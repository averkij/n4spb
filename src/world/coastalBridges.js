// Coastal mapped bridges: low eco-trail boardwalks, road overpasses and port
// WHSD viaducts. References: OSM 2026-10-31; Mostotrest Yacht Bridge;
// St Petersburg administration 2016/96074 (Sea Canal 52 m clearance).
// Static cell batching, bounded knockable rails, no per-frame work.
import * as THREE from 'three';
import { COASTAL_BRIDGES, deckAtSegments } from './coastalBridges/sites.js';
import { WHSD, whsdY } from './bridges/sites-vo2.js';
import { Parts } from './bridges/kit.js';
import { knockInstances } from './lib/knock-inst.js';
export const OWNS_GROUPS = true;

function groundRoadBlocker(net){
  if(!net)return()=>false;
  const skipSet=new Set(net.ways.filter(w=>w.bridge||w.skipDraw||w.pedestrianOnly||w.tramBed));
  const cells=new Map(),size=32;
  for(const f of net.fillets)if(f.ways.some(w=>!skipSet.has(w)))for(let x=Math.floor(f.box[0]/size);x<=Math.floor(f.box[1]/size);x++)for(let z=Math.floor(f.box[2]/size);z<=Math.floor(f.box[3]/size);z++){
    const k=x+','+z;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(f.poly);
  }
  return(x,z,radius)=>{
    const pad=radius+.5;
    if(net.cover(x,z,{skipSet,noFillets:true})>=-pad)return true;
    const seen=new Set();
    for(let cx=Math.floor((x-pad)/size);cx<=Math.floor((x+pad)/size);cx++)for(let cz=Math.floor((z-pad)/size);cz<=Math.floor((z+pad)/size);cz++)for(const p of cells.get(cx+','+cz)||[]){
      if(seen.has(p))continue;seen.add(p);let inside=false;
      for(let i=0,j=p.length-1;i<p.length;j=i++){
        const a=p[j],b=p[i],dx=b[0]-a[0],dz=b[1]-a[1],q=dx*dx+dz*dz,t=q?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/q)):0;
        if(Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)<=pad)return true;
        if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
      }
      if(inside)return true;
    }
    return false;
  };
}

export function build(ctx) {
  const concrete = ctx.mat.toon('#a2a5a0',{name:'coastal-concrete'}), asphalt = ctx.mat.toon('#5a5e61',{name:'coastal-asphalt'}), steel = ctx.mat.toon('#526468',{name:'coastal-steel'}), stripe = ctx.mat.toon('#dad5bb',{name:'coastal-marking'});
  const P = new Parts(), root = new THREE.Group(); root.name = 'coastalBridges';
  const segments = [], railSpots = [], railItems = [];
  const ph = ctx.physics;
  const groundBlocked=groundRoadBlocker(ctx.services.streets?.net);
  let supportsSkipped=0,railsSkipped=0;
  for (const b of COASTAL_BRIDGES) {
    const p = b.pts, spans = [];
    for (let i = 0; i + 3 < p.length; i += 2) {
      const ax = p[i], az = p[i + 1], bx = p[i + 2], bz = p[i + 3], len = Math.hypot(bx - ax, bz - az);
      if (len < 0.1) continue;
      spans.push({ ax, az, bx, bz, len, ya: b.heights[i / 2], yb: b.heights[i / 2 + 1], yaw: Math.atan2(bx - ax, bz - az) });
    }
    let at = 0;
    for (const s of spans) {
      // Small crossings stay near the street. Tall viaduct access slopes are
      // continued by their mapped adjoining bridge ways; no fake solid water.
      const x = (s.ax + s.bx) / 2, z = (s.az + s.bz) / 2, half = b.w / 2;
      // A mapped boardwalk approach can continue across a service-road mouth.
      // Its landing uses asphalt there (notably the Krestovsky Yacht Bridge
      // approach). Retain its shared ramp elevations to keep joints continuous.
      const groundLanding=b.foot&&Math.max(s.ya,s.yb)<=2.5&&[-.45,-.25,0,.25,.45].some(t=>groundBlocked(x+(s.bx-s.ax)*t,z+(s.bz-s.az)*t,half));
      P.push(x, 0, z, s.yaw);
      const quad = (mat, x0, x1, off) => P.quad(mat, [x0,s.ya+off,-s.len/2], [x1,s.ya+off,-s.len/2], [x1,s.yb+off,s.len/2], [x0,s.yb+off,s.len/2], [0,1,0]);
      quad(b.foot&&!b.yacht&&!groundLanding ? concrete : asphalt, -half, half, .025);
      // The web and soffit are geometry, so navigation clearances use the same
      // depth as the walking ramp. WHSD retains its characteristic box girder.
      for (const side of [-1,1]) {
        const a=side*(half+.25),inner=side*Math.max(1,half-2.5);
        P.quad(concrete,[a,s.ya-.5,-s.len/2],[a,s.yb-.5,s.len/2],[a,s.yb+.02,s.len/2],[a,s.ya+.02,-s.len/2],[side,0,0]);
        P.quad(concrete,[a,s.ya-.5,-s.len/2],[inner,s.ya-b.depth,-s.len/2],[inner,s.yb-b.depth,s.len/2],[a,s.yb-.5,s.len/2],[side,-1,0]);
      }
      const bottom=Math.max(1,half-2.5);
      P.quad(concrete,[-bottom,s.ya-b.depth,-s.len/2],[bottom,s.ya-b.depth,-s.len/2],[bottom,s.yb-b.depth,s.len/2],[-bottom,s.yb-b.depth,s.len/2],[0,-1,0]);
      if (!b.foot) for (const side of [-1,1]) quad(stripe,side*(half-.3)-.05,side*(half-.3)+.05,.055);
      P.pop();
      ph.addWalkRamp(x, z, b.w, s.len, s.yaw, s.ya + .025, s.yb + .025, b.depth);
      const seg = { ...s, x, z, w: b.w, y: b.y, id: b.id }; segments.push(seg);
      // Discrete piers leave the navigation opening clear. A 150m support
      // spacing on the high harbour viaduct keeps the fairway open to boats.
      const spacing = b.whsd ? 150 : 80;
      const firstSupport=Math.ceil((at-spacing/2)/spacing)*spacing+spacing/2-at;
      if (b.y > 4) for (let d = firstSupport; d < s.len; d += spacing) {
        const px = s.ax + (s.bx - s.ax) * d / s.len, pz = s.az + (s.bz - s.az) * d / s.len;
        // Piers keep clear of actual ground asphalt, widened parking edges and
        // junction fillets by their whole footprint plus the0.5m scene margin.
        if(groundBlocked(px,pz,Math.hypot(1.2,1.5))||ctx.L?.insideBuilding(px,pz,Math.hypot(1.2,1.5))){supportsSkipped++;continue;}
        // The official168m central span has no pier in its fairway.
        if(b.seaCanal&&pz>3400&&pz<3710)continue;
        const top = s.ya + (s.yb - s.ya) * d / s.len - b.depth;
        if (top > 2) { P.push(px, 0, pz, s.yaw); P.box(concrete, -1.2, 1.2, -5, top, -1.5, 1.5); P.pop(); ph.addBox(px, pz, 2.4, 3, s.yaw, -5, top); }
      }
      // Equal subdivisions cover the whole edge with <=6.4m breakable panels.
      // Collider length, pitched visual and knock dimensions use the same span.
      const panels=Math.max(1,Math.ceil(s.len/6.4)),panelLen=s.len/panels;
      for (const side of [-1, 1]) for (let j=0;j<panels;j++) {
        const d=(j+.5)*panelLen;
        const sx = Math.cos(s.yaw) * side * (half + .18), sz = -Math.sin(s.yaw) * side * (half + .18);
        const px = s.ax + (s.bx - s.ax) * d / s.len + sx, pz = s.az + (s.bz - s.az) * d / s.len + sz;
        const ry = s.ya + (s.yb - s.ya) * d / s.len;
        const grade=(s.yb-s.ya)/s.len,dy=Math.abs(grade)*panelLen/2;
        // Low bridge approaches leave an opening at crossing ground streets.
        if(ry-dy<=2.5&&(groundBlocked(px,pz,Math.hypot(.06,panelLen/2))||ctx.L?.insideBuilding(px,pz,Math.hypot(.06,panelLen/2)))){railsSkipped++;continue;}
        railSpots.push({ x: px, y: ry + .04, z: pz, rotY: s.yaw, len:panelLen,grade });
        railItems.push(ph.addBox(px, pz, .12, panelLen, s.yaw, ry + .03-dy, ry + 1.17+dy));
      }
      // Pale steel two-storey truss, built only from the lower carriageway.
      // Upper-deck geometry remains the mapped opposing lane, not a duplicate.
      if(b.seaCanal&&!b.northbound&&z>2900&&z<4350){
        for(const side of[-1,1]){
          const local=side*(half+.65),a=[local,s.ya+.05,-s.len/2],c=[local,s.yb+.05,s.len/2],atop=[local,s.ya+8,-s.len/2],ctop=[local,s.yb+8,s.len/2];
          P.push(x,0,z,s.yaw);
          P.cyl(steel,a,c,.15,.15,4,false);P.cyl(steel,atop,ctop,.19,.19,4,false);
          P.cyl(steel,a,atop,.19,.19,4,false);P.cyl(steel,a,ctop,.16,.16,4,false);
          P.pop();
        }
      }
      at += s.len;
    }
  }
  // Korabelny's inward-leaning portal pylons and fan stays reproduce the source
  // silhouette while the current OSM centre lines own every road deck.
  let pylons=0;
  if(COASTAL_BRIDGES.some(b=>b.marine))for(const[cx,cz]of WHSD.pylons){
    const yaw=-.105,tx=Math.sin(yaw),tz=Math.cos(yaw),nx=tz,nz=-tx;
    const pos=(u,q,y)=>[cx+tx*u+nx*q,y,cz+tz*u+nz*q];
    const top=120.6,base=-5;
    for(const side of[-1,1]){
      P.cyl(concrete,pos(0,side*22,base),pos(0,side*8.5,top),2.3,1.3,6,true);
      const p=pos(0,side*22,base);ph.addBox(p[0],p[2],5,6,yaw,-5,6);
      for(const dir of[-1,1])for(let j=0;j<12;j++){
        const u=dir*(25+j*12),z=cz+tz*u;
        P.cyl(stripe,pos(0,side*(13.5-j*.36),66+j*4.5),pos(u,side*18.4,whsdY(z)+.8),.09,.09,4,false);
      }
    }
    for(const[y0,y1]of[[64,82],[82,101],[101,116]]){
      const q=y=>22-13.5*(y-base)/(top-base);
      for(const side of[-1,1])P.cyl(concrete,pos(0,side*q(y0),y0),pos(0,-side*q(y1),y1),.6,.6,6,false);
      P.cyl(concrete,pos(0,-q(y1),y1),pos(0,q(y1),y1),.65,.65,6,false);
    }
    pylons++;
  }
  const meshes = P.build(root, { name: 'coastal-bridges' }); ctx.addStatic(root); P.b.clear();
  // One independently breakable6.4m railing panel. Narrow bases + horizontal
  // bars share a geometry; no unbreakable continuous collider wall.
  const rp = new Parts(); rp.box(steel, -.045, .045, 0, 1.12, -.055, .055);
  for (const h of [.55, 1.05]) rp.box(steel, -.04, .04, h, h + .06, -3.2, 3.2);
  const local = new THREE.Group(), geos = rp.build(local, { name: 'coastal-rail-template' });
  const railMatrix=s=>new THREE.Matrix4().makeRotationY(s.rotY).multiply(new THREE.Matrix4().makeRotationX(-Math.atan(s.grade))).scale(new THREE.Vector3(1,1,s.len/6.4)).setPosition(s.x,s.y,s.z);
  knockInstances(ctx, { name: 'coastal-rail', spots: railSpots, items: railItems, parts: geos.map(m => ({ geo: m.geometry, mat: steel,place:railMatrix })), rec: s=>({ kind: 'fence', mass: 45*s.len/6.4, h: 1.15, w: .12, d:s.len, anchored: true, metal: true }), far: 260 });
  // Spatial cells avoid querying every coastal bridge for each traffic agent.
  const grid = new Map(), cell = 128;
  for (const s of segments) for (let ix = Math.floor((Math.min(s.ax, s.bx) - s.w) / cell); ix <= Math.floor((Math.max(s.ax, s.bx) + s.w) / cell); ix++) for (let iz = Math.floor((Math.min(s.az, s.bz) - s.w) / cell); iz <= Math.floor((Math.max(s.az, s.bz) + s.w) / cell); iz++) { const key = ix + ',' + iz; if (!grid.has(key)) grid.set(key, []); grid.get(key).push(s); }
  const empty=[];
  const deckY = (x,z,ref=Infinity) => deckAtSegments(grid.get(Math.floor(x/cell)+','+Math.floor(z/cell))||empty,x,z,ref);
  ctx.services.coastalBridges = { list: COASTAL_BRIDGES, segments, deckY };
  const prior = ctx.services.bridges;
  ctx.services.bridges = { ...(prior || {}), list: [...(prior?.list || []), ...COASTAL_BRIDGES.map(b => ({ id: b.id, x: b.cx, z: b.cz }))], deckY: (x,z,ref=Infinity) => deckY(x,z,ref) ?? prior?.deckY?.(x,z,ref) ?? null };
  return { bridges: COASTAL_BRIDGES.length, rails: railSpots.length, meshes: meshes.length,pylons,supportsSkipped,railsSkipped };
}
