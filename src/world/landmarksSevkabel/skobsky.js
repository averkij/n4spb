// landmarksSevkabel/skobsky.js - the "SKOBSKY PALACE" (Скобский дворец; Kozhevennaya line 25 / Kosaya line 24; OSM w136791761; docs/research/sevkabel.md section 6; photos 061 062 063).
// An L of two 17.5 / 18.4 m deep wings: 165 m along Kozhevennaya line (54 axes) and 94 m along Kosaya line (31 axes), SIX storeys, cornice 22.5 m [E], repainted sand-beige (the soot-black of the Soviet years is gone):
// the two lower floors are rusticated (darker sand, shop fronts on the ground floor), floors 3-6 plain with white-framed windows 1.3 x 2.1 m on a 3 m pitch, cartouche / garland panels over the corner axes and every 9th axis,
// a plain right-angled corner with a 1.5 m cream pilaster strip, a strong profiled cornice, white-blue downpipes every 6 m, a shallow hip of light zinc with about 40 small hatches.  Frame K (frame.js).
// The courtyard side (NE) is plain plaster with plain windows.  Residential: not enterable, solid (thin wall colliders on the outline).
import * as THREE from 'three';
import * as L from '../layout.js';
import { K as KF } from './frame.js';
import { polysOf, roofCap, ringFromFlat } from './common.js';
import { ringEdges, onEdge, band } from './kit.js';
import { windowWall, bayWall, cornice } from './facade.js';
import { inflate, pairs } from './surfaces.js';
import { addPolyColliders } from '../lib/massing.js';

const HC = 22.5;
const FLOORS = [0, 4.5, 8.3, 11.9, 15.5, 19.1];

export function build(K) {
  const { ctx, P, M, svc } = K;
  const poly = polysOf('w136791761')[0]; if (!poly) throw new Error('w136791761 missing');
  const edges = ringEdges(poly);
  const cream = { front: M.trimCream, top: M.trimCream, under: M.trimCream };
  // classify the edges by their direction in frame K: the street fronts face +lz (Kozhevennaya) or -lx (Kosaya)
  const fr = (e) => { const m = KF.M((e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2), n = [e.n[0] * KF.U[0] + e.n[1] * KF.U[1], e.n[0] * KF.V[0] + e.n[1] * KF.V[1]]; return { m, n }; };
  edges.forEach((e) => {
    const f = fr(e), street = (f.n[1] > 0.7 && e.len > 100) || (f.n[0] < -0.7 && e.len > 60);
    if (e.len < 4) { onEdge(P, e, (len) => windowWall(P, { x0: 0, x1: len, y0: 0, y1: HC, tu: 3, tv: 3, base: M.skobBase, baseTop: 8.3, wall: M.plasterSand })); return; }
    if (street) {
      const shop = { y0: 0, w: 2.2, h: 2.9, sill: 0.45, glass: M.darkWin, glassUv: [[0, 0], [1.4, 0], [1.4, 2.6], [0, 2.6]], skip: (i) => i % 9 === 4 };
      const win = (y0, sill) => ({ y0, w: 1.3, h: 2.1, sill, glass: M.sashWhite });
      bayWall(P, e, { y0: 0, y1: HC, tu: 3, tv: 3, base: M.skobBase, baseTop: 8.3, wall: M.plasterSand, reveal: M.trimCream, depth: 0.22, pitch: 3.0, margin: 1.5,
        floors: [shop, win(4.5, 0.95), win(8.3, 0.85), win(11.9, 0.85), win(15.5, 0.85), win(19.1, 0.8)],
        extra: [] });
      // the corner pilaster strip, panels over the corner axes and every 9th axis, downpipes every 6 m
      onEdge(P, e, (len) => {
        const n = Math.max(1, Math.round((len - 3) / 3.0)), step = (len - 3) / n;
        for (const x of [0.75, len - 0.75]) P.box(M.trimCream, x - 0.75, x + 0.75, 0, HC, 0.0, 0.12, 'bk', 2);
        for (let i = 0; i < n; i++) if (i === 0 || i === n - 1 || i % 9 === 0) { const x = 1.5 + (i + 0.5) * step; P.quad(M.garland, [x - 0.95, 16.1, 0.13], [x + 0.95, 16.1, 0.13], [x + 0.95, 17.0, 0.13], [x - 0.95, 17.0, 0.13], [0, 0, 1], [[0, 0], [0.4, 0], [0.4, 1], [0, 1]]); }
        for (let x = 6; x < len - 3; x += 6) P.cyl(M.pipeBlue, [x, 0.2, 0.1], [x, HC - 0.6, 0.1], 0.06, 0.06, 6, false);
      });
    } else {
      // courtyard side and the short ends: plain plaster, plain windows (no shop fronts), narrower reveals
      const win = (y0) => ({ y0, w: 1.2, h: 1.9, sill: 1.0, glass: M.sashWhite });
      bayWall(P, e, { y0: 0, y1: HC, tu: 3, tv: 3, wall: M.plasterSand, reveal: M.trimCream, depth: 0.18, pitch: 3.0, margin: 1.5, floors: FLOORS.map(win) });
    }
  });
  // string courses and the profiled cornice (cream, mitred round the whole outline)
  band(P, edges, 4.35, 4.65, 0.1, cream); band(P, edges, 8.15, 8.45, 0.1, cream);
  cornice(P, poly, HC, cream, 0.6, 1.1);
  // the roof: a shallow hip (outer ring at the cornice, inset 5 m, flat top at 25.0) of light grey zinc, a railing line, about 40 hatches
  const ring = pairs(poly.o), inner = inflate(ring, -5.0);
  {
    const yo = HC + 0.3, yi = 25.0, n = ring.length;
    for (let i = 0; i < n; i++) {
      const a = ring[i], b = ring[(i + 1) % n], ia = inner[i], ib = inner[(i + 1) % n];
      P.quad(M.zincLight, [a[0], yo, a[1]], [b[0], yo, b[1]], [ib[0], yi, ib[1]], [ia[0], yi, ia[1]], [0, 1, 0.4], [[a[0] / 3, a[1] / 3], [b[0] / 3, b[1] / 3], [ib[0] / 3, ib[1] / 3], [ia[0] / 3, ia[1] / 3]]);
    }
    P.cap(M.zincLight, inner, yi, true, 3);
    P.cap(M.zincLight, ring, HC, true, 3);
    for (const e of edges) onEdge(P, e, (len) => { for (let x = 0.4; x < len - 0.2; x += 0.9) P.cyl(M.ironBlack, [x, HC + 0.3, 0.12], [x, HC + 1.0, 0.12], 0.02, 0.02, 4, false); P.box(M.ironBlack, 0, len, HC + 0.95, HC + 1.0, 0.1, 0.14, 'b', 1); });
    // hatches along the ridge strips (frame K)
    P.push(KF.x, 0, KF.z, KF.rot);
    for (let u = 9; u < 160; u += 4.1) P.box(M.zincLight, u - 0.5, u + 0.5, yi, yi + 0.9, -9.0, -8.0, 'b', 1);
    for (let v = -90; v < -24; v += 5.5) P.box(M.zincLight, 8.5, 9.5, yi, yi + 0.9, v - 0.5, v + 0.5, 'b', 1);
    P.pop();
  }
  addPolyColliders(ctx, poly, 0, HC + 1, 0.9);
  const c = KF.W(80, -9);
  svc.monuments.push({ id: 'w136791761', name: 'Скобский дворец', x: c.x, z: c.z, h: HC });
  const spot = (x, z, yaw, pitch, name) => { if (!L.insideBuilding(x, z, 0.6)) svc.photoSpots.push({ x, z, yaw, pitch, name }); };
  spot(-5559.5, 1142.3, -69.5, 20, 'Скобский дворец: угол Кожевенной и Косой линий');
  void THREE; void ringFromFlat; void roofCap;
}
