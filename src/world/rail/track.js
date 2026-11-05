// rail/track.js - ballast, concrete sleepers, R65 rails, buffer stops, switch drives and signal masts of the whole track field.
// Layers above the street (y = 0): ballast crest 0.03 < sleeper top 0.09 < rail head top 0.28 (RAIL_TOP); ballast shoulders run out to y = 0 at 2.9 m.
// Photos: refs/station/22, 27, 43 (granite ballast, concrete sleepers with clips, rusty rails with a bright running band).
import * as THREE from 'three';
import { RAIL_TOP, HG } from './geom.js';
import { sweep } from './gb.js';
import { onObvodnySpan } from './obvodny.js';

const SLEEPER_TOP = 0.09, SLEEPER_STEP = 0.7, RAIL_H = 0.18;
const BALLAST = [[2.9, 0.0], [1.75, 0.03], [-1.75, 0.03], [-2.9, 0.0]];     // right -> left over the crest (counter-clockwise: normals up)
// simplified R65, counter-clockwise from the right foot
const RAIL = [[0.07, 0.012], [0.012, 0.035], [0.012, 0.125], [0.036, 0.145], [0.036, 0.18], [-0.036, 0.18], [-0.036, 0.145], [-0.012, 0.125], [-0.012, 0.035], [-0.07, 0.012]];
const TOP_EDGE = 4;

/** Samples every `near` m while z < zFar, then every `far` m (the yard far south is only a silhouette). */
export function sampleAdaptive(path, near = 6, far = 12, zFar = 900) {
  const out = []; let s = 0;
  for (;;) { const p = path.at(Math.min(s, path.len)); out.push({ x: p.x, z: p.z, tx: p.tx, tz: p.tz, s: p.s, dy:p.dy }); if (s >= path.len) break; s = Math.min(path.len, s + (p.dy>0 ? 3 : p.z < zFar ? near : far)); }
  return out;
}
export function sampleAlong(path, step, s0 = 0, s1 = path.len) {
  const out = []; const n = Math.max(1, Math.ceil((s1 - s0) / step));
  for (let i = 0; i <= n; i++) { const p = path.at(s0 + (s1 - s0) * i / n); out.push({ x: p.x, z: p.z, tx: p.tx, tz: p.tz, s: p.s }); }
  return out;
}

export function ballastTexture(ctx) {
  return ctx.tex.draw(256, 256, (g, w, h) => {
    const r = ctx.rng('rail-ballast');
    g.fillStyle = '#7d7871'; g.fillRect(0, 0, w, h);
    const cols = ['#8f8a82', '#6f6a64', '#9b958b', '#625e59', '#a39d92', '#858079', '#77726c', '#948b7e'];
    for (let i = 0; i < 1500; i++) {
      const x = r() * w, y = r() * h, s = 2 + r() * 5, a = r() * 6.3;
      g.fillStyle = cols[(r() * cols.length) | 0]; g.beginPath();
      for (let k = 0; k < 5; k++) { const t = a + k * 1.256 + (r() - 0.5) * 0.6, rr = s * (0.7 + r() * 0.5); g.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr * 0.8); }
      g.closePath(); g.fill();
    }
  }, { key: 'rail-ballast', repeat: [1, 1], anisotropy: 8 });
}

/** Ballast, rails, sleepers of every path. Returns stats. */
export function buildTracks(ctx, root, G, bk, M) {
  const sleepers = [];
  const grid = new Map();
  const near = (x, z, ry) => {
    const cx = Math.floor(x), cz = Math.floor(z);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const a = grid.get((cx + i) + ',' + (cz + j)); if (!a) continue;
      for (const q of a) if (Math.hypot(q.x - x, q.z - z) < 0.52 && Math.abs(Math.atan2(Math.sin(q.ry - ry), Math.cos(q.ry - ry))) < 0.35) return true;
    }
    return false;
  };
  const addSl = (o) => { const k = Math.floor(o.x) + ',' + Math.floor(o.z); let a = grid.get(k); if (!a) grid.set(k, (a = [])); a.push(o); sleepers.push(o); };
  const r = ctx.rng('rail-sleepers');
  let railLen = 0;
  for (const p of G.paths) {
    // visible only where the player area reaches (with slack): every way lies in the data extent, so draw all of it
    const sm = sampleAdaptive(p, 6, 12, 900);
    // Raised tracks share a solid deck bed; individual 5.8 m ballast ribbons
    // would overlap each other and spill beyond the bridge's steel sides.
    for(let i=1;i<sm.length;i++){
      const a=sm[i-1],b=sm[i],x=(a.x+b.x)/2,z=(a.z+b.z)/2;
      if(onObvodnySpan(x,z))continue;
      sweep(bk,[a,b],BALLAST,()=> 'ballast',{uvMode:'world',worldScale:2.2});
      if(!(a.dy>0||b.dy>0))continue;
      // The fan of approach tracks needs an embankment under its ballast.
      // Where a road/water crosses, retain an open underpass with a thin slab.
      const open=ctx.L.inRiver(x,z)||ctx.L.isOnRoad(x,z,3);
      const pa=[a.x+a.tz*2.9,a.dy,a.z-a.tx*2.9],pb=[a.x-a.tz*2.9,a.dy,a.z+a.tx*2.9];
      const pc=[b.x-b.tz*2.9,b.dy,b.z+b.tx*2.9],pd=[b.x+b.tz*2.9,b.dy,b.z-b.tx*2.9];
      const down=p=>[p[0],open?p[1]-.8:0,p[2]],A=down(pa),B=down(pb),C=down(pc),D=down(pd);
      const mesh=bk.get('concrete',x,z),ctr=[x,(a.dy+b.dy)/2-.4,z];
      mesh.face(pa,pd,D,A,null,null,ctr);mesh.face(pb,B,C,pc,null,null,ctr);
      if(open)mesh.face(A,D,C,B,null,null,ctr);
      const depth=open?.8:Math.max(a.dy,b.dy,.1);
      ctx.physics.addWalkTriangle([pa,pb,pc],depth);ctx.physics.addWalkTriangle([pa,pc,pd],depth);
    }
    for (const side of [-1, 1]) {
      const prof = RAIL.map(([q, y]) => [side * HG + q, RAIL_TOP - RAIL_H + y]);
      sweep(bk, sm, prof, (k) => (k === TOP_EDGE ? 'railTop' : (k === 1 || k === 3 || k === 5 || k === 7) ? 'railSide' : null));
    }
    railLen += p.len;
    const off = (p.len * 0.37) % SLEEPER_STEP;
    for (let s = off + 0.3; s < p.len - 0.3;) {
      const q = p.at(s); s += q.z < 800 ? SLEEPER_STEP : q.z < 950 ? 0.95 : 1.5;
      const ry = Math.atan2(q.tx, q.tz) + (r() - 0.5) * 0.01;
      if (near(q.x, q.z, ry)) continue;
      addSl({ x: q.x, z: q.z, dy:q.dy, ry, c: (r() * 5) | 0 });
    }
  }
  // instanced sleepers: tapered prism, top at y = 0 (positioned at SLEEPER_TOP)
  const L2 = 1.3, a = 0.11, b = 0.15, h = 0.2;
  const geo = new THREE.BufferGeometry();
  {
    const V = [[-L2, 0, -a], [L2, 0, -a], [L2, 0, a], [-L2, 0, a], [-L2, -h, -b], [L2, -h, -b], [L2, -h, b], [-L2, -h, b]];
    const F = [[0, 3, 2, 1], [3, 7, 6, 2], [1, 5, 4, 0]];
    const pos = [], nrm = [];
    for (const f of F) {
      const q = f.map((i) => V[i]);
      const ux = q[1][0] - q[0][0], uy = q[1][1] - q[0][1], uz = q[1][2] - q[0][2], vx = q[3][0] - q[0][0], vy = q[3][1] - q[0][1], vz = q[3][2] - q[0][2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      for (const k of [0, 1, 2, 0, 2, 3]) { pos.push(...q[k]); nrm.push(nx, ny, nz); }
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2));
  }
  // winding check: the top face must point up
  { const p = geo.attributes.position.array; const ux = p[3] - p[0], uz = p[5] - p[2], vx = p[6] - p[0], vz = p[8] - p[2]; if (uz * vx - ux * vz < 0) { /* flipped */ const n = geo.attributes.normal.array; for (let i = 0; i < n.length; i++) n[i] = -n[i]; } }
  const im = new THREE.InstancedMesh(geo, M.sleeper, sleepers.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pv = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1), cc = new THREE.Color();
  const SL = ['#c4c1b9', '#bbb8b0', '#cdcac2', '#b5b2aa', '#c0bcb2'];
  sleepers.forEach((s, i) => { e.set(0, s.ry, 0); q.setFromEuler(e); m4.compose(pv.set(s.x, SLEEPER_TOP+(s.dy||0), s.z), q, sc); im.setMatrixAt(i, m4); im.setColorAt(i, cc.set(SL[s.c])); });
  im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.computeBoundingSphere(); im.castShadow = false; im.receiveShadow = true; im.name = 'rail-sleepers';
  root.add(im);
  return { sleepers: sleepers.length, railLen, tris: sleepers.length * 6 };
}

/** Buffer stops at every head, switch drives, signal masts. */
export function buildTrackFurniture(ctx, root, G, bk) {
  const out = { buffers: 0, signals: [], drives: 0 };
  // ---- buffer stops: concrete block + two raking posts + red-white beam (typical Russian "тупиковый упор")
  for (const b of G.buffers) {
    const p = G.paths.find((q) => q.id === b.track); if (!p) continue;
    const t = p.at(Math.max(0, p.project(b.x, b.z))), ry = Math.atan2(t.tx, t.tz);
    const cx = b.x, cz = b.z;
    const B = (key, ...a) => bk.get(key, cx, cz).box(...a);
    B('concrete', cx, 0.35, cz - t.tz * 0.0, 1.35, 0.35, 0.45, ry);                         // block under the beam (centred on the stop line)
    B('concrete', cx - t.tz * 0.0, 0.18, cz, 1.6, 0.18, 0.7, ry);
    // beam
    const bx = cx - t.tx * 0.55, bz = cz - t.tz * 0.55;
    for (const sx of [-1, 1]) {
      const px = bx + t.tz * sx * HG, pz = bz - t.tx * sx * HG;
      bk.get('steel', cx, cz).bar([px, RAIL_TOP, pz], [px - t.tx * 0.35, RAIL_TOP + 1.0, pz - t.tz * 0.35], 0.18, 0.16, null);
    }
    const hy = RAIL_TOP + 1.05;
    bk.get('red', cx, cz).box(bx - t.tx * 0.35, hy, bz - t.tz * 0.35, 1.25, 0.16, 0.12, ry);
    for (let k = -2; k <= 2; k += 2) bk.get('white', cx, cz).box(bx - t.tx * 0.35 + t.tz * k * 0.42, hy, bz - t.tz * 0.35 - t.tx * k * 0.42, 0.2, 0.165, 0.125, ry);
    out.buffers++;
  }
  // ---- switch drives: a small grey box beside the track at every switch node
  for (const n of G.nodes.switches) {
    const p = G.paths.reduce((best, q) => { const d = q.nearest(n.x, n.z); return !best || d.d < best.d ? { ...d, p: q } : best; }, null);
    if (!p || p.d > 4) continue;
    const t = p.p.at(Math.min(p.p.len, Math.max(0, p.s))), ry = Math.atan2(t.tx, t.tz);
    const x = t.x + t.tz * 2.3, z = t.z - t.tx * 2.3;
    bk.get('steel', x, z).box(x, t.dy+0.28, z, 0.28, 0.28, 0.4, ry);
    bk.get('red', x, z).box(x, t.dy+0.58, z, 0.16, 0.04, 0.2, ry);
    out.drives++;
  }
  // ---- signal masts at the signal nodes + a signal beside every platform track exit (south end of the canopy zone)
  const sigs = G.nodes.signals.map((n) => ({ x: n.x, z: n.z, ref: n.ref || '' }));
  for (const s of sigs) {
    let best = null; for (const q of G.paths) { const d = q.nearest(s.x, s.z); if (!best || d.d < best.d) best = { ...d, p: q }; }
    if (!best || best.d>4) continue;
    const t = best.p.at(best.s), ry = Math.atan2(-t.tx, -t.tz);          // faces the trains coming from the south... (toward the head)
    const x = t.x + t.tz * 2.9, z = t.z - t.tx * 2.9;
    bk.get('signalPole', x, z).prism(x, t.dy, z, 0.08, 0.08, t.dy+5.2, 8, null, false);
    bk.get('signalHead', x, z).box(x, t.dy+5.35, z, 0.22, 0.6, 0.16, ry);
    bk.get('signalHead', x, z).box(x, t.dy+4.4, z, 0.55, 0.05, 0.2, ry);
    for (let i = 0; i < 3; i++) {
      const lens = [['lensRed', 5.7], ['lensYellow', 5.35], ['lensGreen', 5.0]][i];
      bk.get(lens[0], x, z).box(x + Math.sin(ry) * 0.17, t.dy+lens[1], z + Math.cos(ry) * 0.17, 0.07, 0.07, 0.02, ry);
    }
    out.signals.push({ x, z, ref: s.ref });
  }
  return out;
}
