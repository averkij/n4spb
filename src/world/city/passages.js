// passages.js - carriage arches (проезды / арки) and metro doorways.
//   planPassages(ctx, net, list): every OSM passage way (ROADS with passage = 1: the part of a service road / footway that runs under a building) whose ends touch a visible street /
//     courtyard wall becomes a GATE on that edge (edge.gates = [{ s, w, ... }]): walls.js cuts the wall there and builds the piece above the arch. layout.DOORWAYS (the metro portals
//     inside Nevsky Atrium etc.) become gates too (no tunnel: the metro module draws everything behind them).
//   buildPassages: the tunnel behind a gate pair: two side walls to the spring line (2.55 m) and a semicircular vault, aged plaster, plus colliders for the side walls (the building
//     interior is hollow: without them the player could step sideways out of the passage into the empty volume).
//   edgeGaps(edge, t0, t1): the collider intervals of a piece around its gates.
import * as THREE from 'three';
import { ROADS } from '../data/city.js';
import { DOORWAYS } from '../data/metro.js';
import { ColorBuilder } from './cornice.js';
import { GATE_SPRING } from './walls.js';

const GRID = 16;

export function planPassages(ctx, net, list) {
  const grid = new Map();
  for (const [, r] of net.rec) for (const ring of r.rings) for (const e of ring.edges) {
    if(r.b.waterfront)continue; // panorama never adds gates, tunnel colliders or navigation
    if ((r.b.minH || 0) > 0.5) continue;                 // a raised part (room over the arch) is the roof of the passage: the arch belongs to the body below it, never cut into the part (its spring line is above the part's top: a hole)
    if (!e.pieces.some((p) => p.yLow < 0.2 && p.t1 - p.t0 > 0.05)) continue;
    const x0 = Math.min(e.a[0], e.b[0]) - 2, x1 = Math.max(e.a[0], e.b[0]) + 2, z0 = Math.min(e.a[1], e.b[1]) - 2, z1 = Math.max(e.a[1], e.b[1]) + 2;
    for (let cx = Math.floor(x0 / GRID); cx <= Math.floor(x1 / GRID); cx++) for (let cz = Math.floor(z0 / GRID); cz <= Math.floor(z1 / GRID); cz++) { const k = cx + ',' + cz; let a = grid.get(k); if (!a) grid.set(k, (a = [])); a.push(e); }
  }
  const nearEdge = (x, z, tol, gw) => {
    const cell = grid.get(Math.floor(x / GRID) + ',' + Math.floor(z / GRID)); if (!cell) return null;
    let best = null;
    for (const e of cell) {
      const t = (x - e.a[0]) * e.dx + (z - e.a[1]) * e.dz, off = (x - e.a[0]) * e.nx + (z - e.a[1]) * e.nz;
      if (Math.abs(off) > tol || t < gw / 2 + 0.015 || t > e.len - gw / 2 - 0.015) continue;
      if (!e.pieces.some((p) => p.yLow < 0.2 && t - gw / 2 > p.t0 + 0.015 && t + gw / 2 < p.t1 - 0.015)) continue;
      if (!best || Math.abs(off) < best.off) best = { e, t, off: Math.abs(off) };
    }
    return best;
  };
  const gates = [], tunnels = [];
  const addGate = (e, t, gw, extra) => {
    e.gates = e.gates || [];
    if (e.gates.some((g) => Math.abs(g.s - t) < (g.w + gw) / 2 + 1.2)) return null;
    const g = { s: t, w: gw, ...extra }; e.gates.push(g); gates.push({ e, g }); return g;
  };
  for (const r of ROADS) {
    if (!r.passage || !r.pts || r.pts.length < 4) continue;
    const gw = r.hw === 'footway' || r.hw === 'path' ? 2.6 : Math.max(3.0, Math.min(3.8, (r.w || 4) * 0.9));
    const n = r.pts.length / 2;
    const ends = [[r.pts[0], r.pts[1]], [r.pts[(n - 1) * 2], r.pts[(n - 1) * 2 + 1]]];
    const mouths = ends.map(([x,z]) => nearEdge(x,z,1.8,gw));
    if (mouths.some(Boolean)) {
      for (const hit of mouths) if (hit) addGate(hit.e,hit.t,gw,{road:r.id});
      tunnels.push({pts:r.pts,w:gw,id:r.id,mouths});
    }
  }
  // carriage gates the research photographs show (known.js: gate = [fraction along the street front, width]): a vault from the street front to the courtyard (a hole ring of the
  // same building) when one lies straight behind the gate; no courtyard behind -> no gate (a blind tunnel would be worse than a plain wall)
  let dossierGates = 0;
  for (const [, rec] of net.rec) {
    if(rec.b.waterfront)continue;
    const spec = rec.st && rec.st.gate; if (!spec || rec.b.minH > 0.5) continue;
    let best = null;
    for (const ring of rec.rings) if (!ring.hole) for (const e of ring.edges) { if (e.street && !e.gates && e.pieces.some((p) => p.yLow < 0.2) && (!best || e.len > best.len)) best = e; }
    const dbg = (m) => { if (typeof process !== 'undefined' && process.env && process.env.CITY_DEBUG) console.log('[city] dossier gate skipped:', rec.b.id, rec.st.name, m); };
    const e = best; if (!e) { dbg('no street edge'); continue; }
    const gw = Math.min(5, spec[1]), pc = e.pieces.filter((p) => p.yLow < 0.2).sort((p, q) => (q.t1 - q.t0) - (p.t1 - p.t0))[0];
    let t = e.len * spec[0]; t = Math.max(pc.t0 + gw / 2 + 1.2, Math.min(pc.t1 - gw / 2 - 1.2, t));
    if (pc.t1 - pc.t0 < gw + 2.6) { dbg('piece too short'); continue; }
    const px = e.a[0] + e.dx * t, pz = e.a[1] + e.dz * t;
    // ray inwards (-normal) to the nearest other edge of the footprint (courtyard side or rear wall), max 45 m
    let dmin = 1e9;
    for (const ring of rec.rings) for (const h of ring.edges) {
      if (h === e || !h.pieces.some((p) => p.yLow < 0.2)) continue;
      const den = (-e.nx) * (-h.dz) - (-e.nz) * (-h.dx); // ray dir d = -n ; edge dir = h.d : solve p + d*s = h.a + h.d*u
      const dx = -e.nx, dz = -e.nz, ex = h.dx, ez = h.dz, cr = dx * ez - dz * ex;
      if (Math.abs(cr) < 1e-6) continue;
      const wx = h.a[0] - px, wz = h.a[1] - pz, s2 = (wx * ez - wz * ex) / cr, u2 = (wx * dz - wz * dx) / cr;
      if (s2 > 2 && s2 < 45 && u2 > 0.5 && u2 < h.len - 0.5 && s2 < dmin) dmin = s2;
      void den;
    }
    if (dmin > 44) { dbg('nothing behind'); continue; }
    const qx = px - e.nx * dmin, qz = pz - e.nz * dmin;
    const hit2 = nearEdge(qx, qz, 1.8, gw);
    if (!hit2 || hit2.e === e) { dbg('no edge at the far end ' + Math.round(dmin)); continue; }
    const g1 = addGate(e, t, gw, { dossier: 1 }); if (!g1) { dbg('gate rejected'); continue; }
    addGate(hit2.e, hit2.t, gw, { dossier: 1 });
    tunnels.push({ pts: [px, pz, qx, qz], w: gw, id: rec.b.id, mouths: [{ e, t },hit2] });
    dossierGates++; if (typeof process !== 'undefined' && process.env && process.env.CITY_DEBUG) console.log('[city] dossier gate', rec.b.id, rec.st.name, Math.round(px), Math.round(pz), 'to courtyard', Math.round(dmin), 'm');
  }
  ctx._cityDossierGates = dossierGates;
  for (const d of DOORWAYS) {
    const hit = nearEdge(d.x, d.z, 1.8, d.w || 3);
    if (hit) addGate(hit.e, hit.t, d.w || 3, { metro: true, id: d.id });
  }
  cutCrossingWalls(tunnels, grid);
  ctx._cityTunnels = tunnels;
  return gates;
}

// Clip a line starting at (x,z), with unit tangent (tx,tz), to an oriented
// passage rectangle. The returned interval is in metres along that line.
function clipToLane(x,z,tx,tz,length,lane,radius,overhang){
  let lo=0,hi=length;
  function clip(start,speed,min,max){
    if(Math.abs(speed)<1e-8)return start>=min && start<=max;
    const a=(min-start)/speed,b=(max-start)/speed;
    lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));
    return hi-lo>.015;
  }
  const {ax,az,ux,uz,len}=lane,dx=x-ax,dz=z-az;
  const lateral=dz*ux-dx*uz,dl=tz*ux-tx*uz;
  if(!clip(dx*ux+dz*uz,tx*ux+tz*uz,-overhang,len+overhang)||!clip(lateral,dl,-radius,radius))return null;
  return {lo,hi,lateral,dl,r:radius};
}

function laneSegments(tunnels){
  const index=new Map();
  for(const {pts,w} of tunnels)for(let i=2;i<pts.length;i+=2){
    const ax=pts[i-2],az=pts[i-1],bx=pts[i],bz=pts[i+1],len=Math.hypot(bx-ax,bz-az);
    if(len<.05)continue;
    const lane={pts,offset:i,ax,az,bx,bz,ux:(bx-ax)/len,uz:(bz-az)/len,len,r:w/2};
    const pad=lane.r+2;
    for(let x=Math.floor((Math.min(ax,bx)-pad)/GRID);x<=Math.floor((Math.max(ax,bx)+pad)/GRID);x++)
      for(let z=Math.floor((Math.min(az,bz)-pad)/GRID);z<=Math.floor((Math.max(az,bz)+pad)/GRID);z++){
        const key=x+','+z;if(!index.has(key))index.set(key,[]);index.get(key).push(lane);
      }
  }
  return index;
}

// At a junction of mapped passages, trim both the brick lining and its collider
// wherever another passage opens through it. This also handles short doglegs.
function remainingWall(a,b,index,pts,offset){
  const dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),cuts=[],seen=new Set();
  if(len<.015)return [];
  for(let x=Math.floor(Math.min(a[0],b[0])/GRID);x<=Math.floor(Math.max(a[0],b[0])/GRID);x++)
    for(let z=Math.floor(Math.min(a[2],b[2])/GRID);z<=Math.floor(Math.max(a[2],b[2])/GRID);z++)
      for(const lane of index.get(x+','+z)||[]){
        if(seen.has(lane))continue;seen.add(lane);
        const own=lane.pts===pts && lane.offset===offset;
        const cut=clipToLane(a[0],a[2],dx/len,dz/len,len,lane,own ? Math.min(.88,lane.r-.10) : lane.r-.10,.60);
        if(cut)cuts.push(cut);
      }
  const runs=[];let t=0;
  for(const {lo,hi} of cuts.sort((a,b)=>a.lo-b.lo)){
    if(lo-t>.025)runs.push([t/len,lo/len]);t=Math.max(t,hi);
  }
  if(len-t>.025)runs.push([t/len,1]);
  return runs;
}

// A driveway can cut several building parts, or meet a facade at a surveyed
// vertex shared by two short edges. Clip every intersecting wall to the vault,
// including walls between the two mouths. Keep the primary portal's own trim.
function cutCrossingWalls(tunnels, grid) {
  const affected = new Map();
  for (const {pts,w,mouths} of tunnels) for (let i=2;i<pts.length;i+=2) {
    const ax=pts[i-2], az=pts[i-1], bx=pts[i], bz=pts[i+1];
    const len=Math.hypot(bx-ax,bz-az), r=w/2;
    if (len<.05) continue;
    const ux=(bx-ax)/len, uz=(bz-az)/len, pad=r+1.8, edges=new Set();
    for(let x=Math.floor((Math.min(ax,bx)-pad)/GRID);x<=Math.floor((Math.max(ax,bx)+pad)/GRID);x++)
      for(let z=Math.floor((Math.min(az,bz)-pad)/GRID);z<=Math.floor((Math.max(az,bz)+pad)/GRID);z++)
        for(const edge of grid.get(x+','+z)||[]) edges.add(edge);
    for(const e of edges){
      if(len>w && mouths?.some(hit=>hit?.e===e && e.gates?.some(g=>Math.abs(g.s-hit.t)<.1)))continue;
      const cut=clipToLane(e.a[0],e.a[1],e.dx,e.dz,e.len,{ax,az,ux,uz,len},r,1.8);
      if(!cut)continue;
      if(!affected.has(e))affected.set(e,[]);
      affected.get(e).push(cut);
    }
  }
  for(const [e,cuts] of affected){
    const pieces=[];
    for(const pc of e.pieces){
      const spans=cuts.filter(c=>c.lo<pc.t1 && c.hi>pc.t0);
      if(!spans.length || pc.yLow>GATE_SPRING+3){pieces.push(pc);continue;}
      const breaks=new Set([pc.t0,pc.t1]);
      const add=t=>{if(t>pc.t0 && t<pc.t1)breaks.add(t);};
      for(const c of spans){
        add(c.lo);add(c.hi);
        for(let k=1;k<10 && Math.abs(c.dl)>1e-8;k++){
          const t=(c.r*Math.cos(k*Math.PI/10)-c.lateral)/c.dl;
          if(t>c.lo && t<c.hi)add(t);
        }
      }
      // Do not split an existing decorated facade arch into wall fragments.
      for(const g of e.gates||[]){
        const l=g.s-g.w/2,r=g.s+g.w/2;
        for(const t of breaks)if(t>l&&t<r && t!==pc.t0 && t!==pc.t1)breaks.delete(t);
        add(l);add(r);
      }
      const ts=[...breaks].sort((a,b)=>a-b);
      for(let j=1;j<ts.length;j++){
        const t0=ts[j-1],t1=ts[j],mid=(t0+t1)/2;
        const active=spans.filter(c=>mid>c.lo && mid<c.hi);
        if(!active.length || e.gates?.some(g=>Math.abs(mid-g.s)<g.w/2)){
          pieces.push({...pc,t0,t1});continue;
        }
        const at=t=>Math.max(pc.yLow,...active.map(c=>{
          const q=Math.min(1,Math.max(-1,(c.lateral+t*c.dl)/c.r));
          return GATE_SPRING+c.r*Math.sqrt(Math.max(0,1-q*q));
        }));
        const h0=at(t0),h1=at(t1);
        pieces.push({t0,t1,yLow:Math.min(h0,h1),h0,h1});
      }
    }
    e.pieces=pieces;
  }
}

/** Collider intervals of the piece [t0, t1] of an edge: [[a, b, under]] - solid pieces between the gates, and 'under' boxes above the arch openings. */
export function edgeGaps(e, t0, t1) {
  const gs = (e.gates || []).filter((g) => g.s + g.w / 2 > t0 && g.s - g.w / 2 < t1).sort((a, b) => a.s - b.s);
  const out = []; let cur = t0;
  for (const g of gs) {
    const a = Math.max(t0, g.s - g.w / 2), b = Math.min(t1, g.s + g.w / 2);
    if (a - cur > 0.05) out.push([cur, a, false]);
    out.push([a, b, true]);
    cur = b;
  }
  if (t1 - cur > 0.05) out.push([cur, t1, false]);
  return out;
}

export function buildPassages(ctx, { M }) {
  const tunnels = ctx._cityTunnels || [];
  if (!tunnels.length) return { triangles: 0 };
  let tris = 0;
  const wallC = new THREE.Color('#6d604c'), vaultC = new THREE.Color('#7a6d58'), floorC = new THREE.Color('#554f40');
  const lanes=laneSegments(tunnels);
  for (const tn of tunnels) {
    const n = tn.pts.length / 2, r = tn.w / 2, cy = GATE_SPRING;
    // The end sections lie on the actual facade planes. Interior sections are
    // shared by adjacent spans, including where a mapped driveway bends.
    const section = [];
    for (let i=0; i<n; i++) {
      const x=tn.pts[2*i], z=tn.pts[2*i+1], prev=Math.max(0,i-1), next=Math.min(n-1,i+1);
      const dx=tn.pts[next*2]-tn.pts[prev*2], dz=tn.pts[next*2+1]-tn.pts[prev*2+1];
      const len=Math.hypot(dx,dz)||1, mx=-dz/len, mz=dx/len;
      const hit=i===0 ? tn.mouths?.[0] : i===n-1 ? tn.mouths?.[1] : null;
      if (!hit) { section.push([x,z,mx,mz]); continue; }
      const {e,t}=hit, sign=e.dx*mx+e.dz*mz>=0?1:-1;
      section.push([e.a[0]+t*e.dx,e.a[1]+t*e.dz,sign*e.dx,sign*e.dz]);
    }
    const cB = M.core(tn.pts[0], tn.pts[1]);
    for (let i = 0; i + 1 < n; i++) {
      const ax = tn.pts[i * 2], az = tn.pts[i * 2 + 1], bx = tn.pts[i * 2 + 2], bz = tn.pts[i * 2 + 3], dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
      if (L < 0.5) continue;
      const ux = dx / L, uz = dz / L, mx = -uz, mz = ux;                 // axis and lateral
      const P = (t, lat, y) => {
        const [x,z,sx,sz] = section[t===0 ? i : i+1];
        return [x+sx*lat,y,z+sz*lat];
      };
      // floor (paving, a hair above the ground plane)
      cB.quad([P(0, -r, 0.03), P(L, -r, 0.03), P(L, r, 0.03), P(0, r, 0.03)], [0, 1, 0], floorC);
      // vault: semicircle, 10 segments, facing down / inward
      const K = 10;
      for (let k = 0; k < K; k++) {
        const t0 = (k / K) * Math.PI, t1 = ((k + 1) / K) * Math.PI;
        const l0 = Math.cos(t0) * r, y0 = cy + Math.sin(t0) * r, l1 = Math.cos(t1) * r, y1 = cy + Math.sin(t1) * r;
        const tm = (t0 + t1) / 2, nl = -Math.cos(tm), ny = -Math.sin(tm);
        cB.quad([P(0, l0, y0), P(L, l0, y0), P(L, l1, y1), P(0, l1, y1)], [mx * nl, ny, mz * nl], vaultC);
      }
      // colliders: the side walls (the hollow building interior must not be reachable from the passage)
      for (const side of [-1, 1]) {
        const a=P(0,side*r,0), b=P(L,side*r,0), dx=b[0]-a[0], dz=b[2]-a[2], len=Math.hypot(dx,dz);
        if(len<.015)continue;
        const nx=dz/len*side,nz=-dx/len*side;
        for(const [lo,hi] of remainingWall(a,b,lanes,tn.pts,(i+1)*2)){
          const point=(t,y)=>[a[0]+t*dx,y,a[2]+t*dz];
          cB.quad([point(lo,0),point(hi,0),point(hi,cy),point(lo,cy)],[nx,0,nz],wallC);
          const mid=(lo+hi)/2;
          ctx.physics.addBox(a[0]+mid*dx-nx*.15,a[2]+mid*dz-nz*.15,(hi-lo)*len,.30,Math.atan2(-dz,dx),0,5);
        }
      }
    }
  }
  return { triangles: tunnels.length * 140 };
}
