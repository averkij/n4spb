// landmarksPrimorskaya/vestibule.js - the SURFACE VESTIBULE of the Primorskaya metro station, drawn on the two mapped buildings: the hall w149345779 (one storey, 3.3 m) and the two-storey block w149345769 (6.6 m) that adjoins
// its north side. The hall is a glazed pavilion (curtain wall on the south long side, the west end and the north-west corner, a granite plinth, a thin flat roof beam, the ПРИМОРСКАЯ fascia and the blue М), the block is a
// plastered mass with two ribbons of windows. The three mapped entrances (n3870045073, n3870045075 on the west end, n3870045077 the exit on the north-west corner) get a pair of glass doors under a small porch each.
// NO METRO NETWORK exists in this build: the doors stay SHUT (the walls are solid colliders, lib/massing.js addPolyColliders), the entrances are published as door points (ctx.services.landmarksPrimorskaya.entrances: { x, z, rotY, bldg, kind },
// 0.6 m outside the wall, rotY facing out; PRUNE_SERVICES clears the trees from them). Everything is closed geometry; no flags.
import * as L from '../layout.js';
import { ENTRANCES } from '../data/city.js';
import { ringFromFlat, addPolyColliders } from '../lib/massing.js';

const inRing = (r, x, z) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };

/** the edges of a footprint ring, each oriented so that the OUTWARD normal is the left of travel: { a, b, len, rot, n } (rot = rotY that turns a local +x along the edge, a local +z is then outward) */
function edgesOf(ring) {
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    let a = ring[i], b = ring[(i + 1) % ring.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < 0.3) continue;
    let nx = -dz / len, nz = dx / len;                                                   // the left of travel
    if (inRing(ring, (a[0] + b[0]) / 2 + nx * 0.2, (a[1] + b[1]) / 2 + nz * 0.2)) { [a, b] = [b, a]; dx = -dx; dz = -dz; nx = -nx; nz = -nz; }
    out.push({ a, b, len, rot: Math.atan2(-dz, dx), n: [nx, nz] });
  }
  return out;
}
const projOn = (e, x, z) => { const dx = e.b[0] - e.a[0], dz = e.b[1] - e.a[1], t = Math.max(0, Math.min(e.len, ((x - e.a[0]) * dx + (z - e.a[1]) * dz) / e.len)); return { s: t, d: Math.hypot(e.a[0] + dx / e.len * t - x, e.a[1] + dz / e.len * t - z) }; };

export function vestibule(K) {
  const { ctx, M, P } = K, PAL = M.PAL, S = K.svc;
  const hall = L.buildingById('w149345779'), block = L.buildingById('w149345769');
  if (!hall && !block) return;
  for (const rec of [hall, block]) {
    if (!rec || !rec.polys || !rec.polys[0]) continue;
    const isHall = rec.id === 'w149345779', ring = ringFromFlat(rec.polys[0].o), H = isHall ? 3.3 : 6.6, edges = edgesOf(ring);
    const ents = ENTRANCES.filter((e) => e.bldg === rec.id).map((e) => { let best = null; for (const ed of edges) { const p = projOn(ed, e.x, e.z); if (!best || p.d < best.d) best = { ed, s: p.s, d: p.d, e }; } return best; }).filter((q) => q && q.d < 2.5);
    // the roof: a flat cap over the whole footprint
    P.tint(PAL.concreteDark).cap(M.vc, ring, H + 0.02, true, 4);
    for (const ed of edges) {
      const mine = ents.filter((q) => q.ed === ed), glazed = isHall && (mine.length > 0 || (ed.len > 20 && ed.n[1] > 0.5));
      P.push(ed.a[0], 0, ed.a[1], ed.rot);
      const len = ed.len;
      if (isHall) {
        // the roof beam (a thin slab that overhangs the glazed fronts) and the plinth
        P.tint(PAL.concrete).box(M.vc, -0.1, len + 0.1, H - 0.5, H + 0.02, -0.35, glazed ? 0.45 : 0.06, 'b', 2);
        if (glazed) {
          P.tint(PAL.graniteDark).box(M.vc, -0.05, len + 0.05, 0, 0.5, -0.35, 0.08, 'bt', 2);
          P.quad(M.glass, [0, 0.5, 0.04], [len, 0.5, 0.04], [len, H - 0.5, 0.04], [0, H - 0.5, 0.04], [0, 0, 1]);
          const n = Math.max(2, Math.round(len / 1.7));
          P.tint(PAL.steel); for (let i = 0; i <= n; i++) { const x = len * i / n; P.box(M.vc, x - 0.04, x + 0.04, 0.5, H - 0.5, 0, 0.13, '', 1); }
          P.box(M.vc, 0, len, 2.1, 2.17, 0, 0.12, 'b', 1);
        } else {
          P.tint(PAL.cladding).box(M.vc, 0, len, 0, H - 0.5, -0.4, 0.04, 'b', 2);
          P.tint(PAL.graniteDark).box(M.vc, 0, len, 0, 0.35, -0.4, 0.08, 'b', 2);
        }
      } else {
        // the block: plastered wall, two ribbons of windows (dark glass in a pale frame), a parapet and a plinth
        P.tint(PAL.claddingBlock).box(M.vc, -0.05, len + 0.05, 0, H, -0.4, 0.04, 'b', 2);
        P.tint(PAL.graniteDark).box(M.vc, -0.05, len + 0.05, 0, 0.45, -0.4, 0.08, 'bt', 2);
        const n = Math.max(2, Math.floor(len / 3));
        for (const [y0, y1] of [[0.95, 2.55], [4.15, 5.75]]) for (let i = 0; i < n; i++) {
          const x0 = len * (i + 0.12) / n, x1 = len * (i + 0.88) / n;
          P.tint(PAL.steel).box(M.vc, x0 - 0.06, x1 + 0.06, y0 - 0.06, y1 + 0.06, 0.04, 0.1, 'b', 1);
          P.quad(M.glassLit, [x0, y0, 0.105], [x1, y0, 0.105], [x1, y1, 0.105], [x0, y1, 0.105], [0, 0, 1]);
        }
        P.tint(PAL.concrete).box(M.vc, -0.1, len + 0.1, H, H + 0.55, -0.4, 0.12, 'b', 2);
      }
      // entrances: a pair of glass doors, a step and a porch with two posts each
      for (const q of mine) {
        const s = Math.max(1.2, Math.min(len - 1.2, q.s)), exit = q.e.kind === 'exit';
        P.tint(PAL.steel).box(M.vc, s - 1.1, s + 1.1, 0, 2.45, 0.02, 0.18, '', 1);
        P.quad(M.glass, [s - 1.0, 0.1, 0.19], [s - 0.03, 0.1, 0.19], [s - 0.03, 2.35, 0.19], [s - 1.0, 2.35, 0.19], [0, 0, 1]);
        P.quad(M.glass, [s + 0.03, 0.1, 0.19], [s + 1.0, 0.1, 0.19], [s + 1.0, 2.35, 0.19], [s + 0.03, 2.35, 0.19], [0, 0, 1]);
        P.tint(PAL.brass); for (const x of [s - 0.16, s + 0.16]) P.box(M.vc, x - 0.02, x + 0.02, 0.9, 1.25, 0.2, 0.26, '', 1);
        P.tint(PAL.granitePale).box(M.vc, s - 1.6, s + 1.6, 0, 0.12, 0, exit ? 1.6 : 2.2, 'b', 2);
        const dep = exit ? 1.6 : 2.2;
        P.tint(PAL.concrete).box(M.vc, s - 1.8, s + 1.8, H - 0.62, H - 0.5, 0, dep + 0.1, '', 2);
        P.tint(PAL.steel); for (const x of [s - 1.65, s + 1.65]) P.col(M.vc, x, dep, 0, H - 0.62, 0.07, 0.07, 6, true);
        // the entrance as a door point, 0.6 m outside the wall (the convention of lib/door-points.js: rotY = atan2(n.x, n.z))
        const ex = ed.a[0] + (ed.b[0] - ed.a[0]) / len * s + ed.n[0] * 0.6, ez = ed.a[1] + (ed.b[1] - ed.a[1]) / len * s + ed.n[1] * 0.6;
        S.entrances.push({ x: ex, z: ez, rotY: Math.atan2(ed.n[0], ed.n[1]), bldg: rec.id, kind: exit ? 'exit' : 'subway', clearance: 4 });
        S.porchPosts.push({ edge: ed, s, dep });
      }
      // the sign: ПРИМОРСКАЯ on the beam of the west end and of the north-west corner (the two fronts of the entrances), the blue М over the west end
      if (isHall && mine.length) {
        const sw = Math.min(len - 0.6, 3.6);
        P.quad(M.signName, [len / 2 - sw / 2, H - 0.47, 0.465], [len / 2 + sw / 2, H - 0.47, 0.465], [len / 2 + sw / 2, H - 0.02, 0.465], [len / 2 - sw / 2, H - 0.02, 0.465], [0, 0, 1]);
        if (mine.some((q) => q.e.kind !== 'exit')) {
          P.tint(PAL.steel).box(M.vc, len / 2 - 0.05, len / 2 + 0.05, H + 0.02, H + 0.45, 0.1, 0.2, 'b', 1);
          P.quad(M.signM, [len / 2 - 0.55, H + 0.45, 0.18], [len / 2 + 0.55, H + 0.45, 0.18], [len / 2 + 0.55, H + 1.5, 0.18], [len / 2 - 0.55, H + 1.5, 0.18], [0, 0, 1]);      // (the raised part of the office complex above the west end starts at 5 m: the sign stays below it)
        }
      }
      P.pop();
    }
    S.walls += addPolyColliders(ctx, rec.polys[0], 0, H + 0.6);
    S.hall = S.hall || (isHall ? rec.id : null);
  }
  // the porch posts as slim solid columns
  for (const { edge, s, dep } of S.porchPosts) for (const x of [s - 1.65, s + 1.65]) {
    const px = edge.a[0] + (edge.b[0] - edge.a[0]) / edge.len * x + edge.n[0] * dep, pz = edge.a[1] + (edge.b[1] - edge.a[1]) / edge.len * x + edge.n[1] * dep;
    ctx.physics.addCylinder(px, pz, 0.1, 0, 2.8); S.colliders++;
  }
}
