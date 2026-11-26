// landmarksNorthFull/fence.js - the captured-cannon fence of the Transfiguration Cathedral as KNOCKABLE instances (M7 knock parity, docs/AREAS.md 8.7): 32 granite piers, each carrying three
// bronze barrels with brass caps. Eight runs follow the oval grounds. Each pier
// owns a knockable collider and pulls its adjoining double chains when it falls.
import * as THREE from 'three';
import { Parts } from '../landmarksD/kit.js';
import { knockInstances } from '../lib/knock-inst.js';

export const PIERS = 32, SPANS = 24;                                   // the census (tools/north-knock-test.mjs): 24 spans of two strands each (docs/AREAS.md 8.7 counted the 48 strands)
const PIER_INSET = 0.65, SAG = 0.34, CHAIN_Y = [1.05, 1.75], FAR = 240, SPAN_PULL_KMH = 8;
/** the template geometries of a small model drawn by `draw(P)` at the origin, one per material (landmarksF/util.js templateOf, with the kit of this module) */
const templateOf = (draw) => { const P = new Parts(), g = new THREE.Group(); draw(P); return P.build(g, {}).map((m) => ({ geo: m.geometry, mat: m.material })); };
const trisOf = (parts) => parts.reduce((n, { geo }) => n + (geo.index ? geo.index.count : geo.attributes.position.count) / 3, 0);
const pkey = (x, z) => x.toFixed(3) + ',' + z.toFixed(3);

export function cannonFence(K, cx, cz) {
  const ctx = K.ctx, M = K.mats, bronze = K.wall('#3c4c43'), ph = ctx.physics;
  // the pier: granite block + three barrels, drawn at the origin facing +z (the frame the merged part used at (x, 36) of each side)
  const pierParts = templateOf((P) => {
    P.box(M.graniteWarm, -1.05, 1.05, 0.13, 0.56, -0.9, 0.9);
    for (let k = -1; k <= 1; k++) {
      P.cyl(bronze, [k * 0.45, 0.56, 0], [k * 0.45, 2.25, 0], 0.16, 0.25, 10, true);
      P.cyl(M.brass, [k * 0.45, 2.22, 0], [k * 0.45, 2.34, 0], 0.26, 0.26, 10, true);
    }
  });
  // Two seven-metre chain templates stretch along local X between the adjoining piers.
  const spanParts = templateOf((P) => {
    for (const y of CHAIN_Y) { let prev; for (let j = 0; j <= 12; j++) { const t = j / 12, q = [t * 7, y - SAG * Math.sin(Math.PI * t), 0]; if (prev) P.cyl(bronze, prev, q, 0.04, 0.04, 5, true); prev = q; } }
  });
  // The cannon enclosure follows the oval of Preobrazhenskaya Square. Its
  // centre is west of the nave centre; breaks in the rows admit the radial paths.
  const rows = [[4,39],[50,84],[98,122],[139,168],[186,220],[239,262],[275,310],[320,355]];
  const piers = [], pierItems = [], spans = [], spanItems = [], spansAt = new Map(), spanRecs = [];
  for (const [start,end] of rows) {
    let prev = null;
    for (let i = 0; i < 4; i++) {
      const angle = THREE.MathUtils.degToRad(start + (end-start)*i/3);
      const x = cx-6.2 + 44*Math.cos(angle), z = cz+.6 + 35*Math.sin(angle);
      const rotY = Math.atan2(-35*Math.cos(angle), -44*Math.sin(angle));
      const pier = {x, y:0, z, rotY};
      piers.push(pier);
      pierItems.push(ph.addBox(x,z,2.1,1.8,rotY,0,2.34));
      if (prev) {
        const dx = x-prev.x, dz = z-prev.z, pitch = Math.hypot(dx,dz);
        const length = pitch - 2*PIER_INSET, yaw = Math.atan2(-dz,dx);
        const mx = (x+prev.x)/2, mz = (z+prev.z)/2;
        const box = ph.addBox(mx,mz,length+.1,.12,yaw,0,1.8);
        box.fence = true;
        const index = spans.length;
        spans.push({x:prev.x+dx*PIER_INSET/pitch, y:0, z:prev.z+dz*PIER_INSET/pitch, rotY:yaw, mx,mz,length});
        spanItems.push(box);
        for (const post of [prev,pier]) {
          const key = pkey(post.x,post.z);
          if (!spansAt.has(key)) spansAt.set(key,[]);
          spansAt.get(key).push(index);
        }
      }
      prev = pier;
    }
  }
  // a knocked pier pulls down its one or two spans, thrown gently to the side the pier falls (streets/barriers.js dropSpans)
  const dropSpans = (rec, body) => {
    if (!ctx.knock) return;
    for (const si of spansAt.get(pkey(rec.x, rec.z)) || []) {
      const sr = spanRecs[si]; if (!sr || sr.state !== 'stand') continue;
      const nx = Math.sin(sr.rotY), nz = Math.cos(sr.rotY), side = nx * body.dx + nz * body.dz < 0 ? -1 : 1;          // (sin, cos) of the record's rotY is the across direction of the span
      ctx.knock.hit(sr.x, sr.z, SPAN_PULL_KMH, nx * side, nz * side, 'chain');
    }
  };
  knockInstances(ctx, { name: 'lmNF-cannon-piers', far: FAR,
    parts: pierParts.map((t) => ({ geo: t.geo, mat: t.mat, name: t.mat === M.graniteWarm ? 'granite' : t.mat === M.brass ? 'brass' : 'bronze' })),
    spots: piers, items: pierItems,
    rec: () => ({ kind: 'bollard', mass: 900, h: 2.34, w: 2.1, d: 1.8, anchored: 30, hitK: 0.6, onKnock: dropSpans }) });
  knockInstances(ctx, { name: 'lmNF-cannon-chains', far: FAR,
    parts: spanParts.map((t) => ({ geo: t.geo, mat: t.mat, shadow: false, name: 'links',
      place: s => new THREE.Matrix4().makeRotationY(s.rotY).scale(new THREE.Vector3(s.length / 7,1,1)).setPosition(s.x,s.y,s.z) })),
    spots: spans, items: spanItems,
    rec: (s) => ({ kind: 'chain', x: s.mx, z: s.mz, rotY: s.rotY, mass: 12, h: 0.8, r: 0.04, w: s.length + 0.1, d: 0.12, anchored: 0.5, hitK: 0.05, minDv: 0 }) }).records.forEach((r, i) => { spanRecs[i] = r; });
  return trisOf(pierParts) * piers.length + trisOf(spanParts) * spans.length;
}
