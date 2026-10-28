// landmarksSevkabel/istkabel.js - ISTKABEL, the eastern third of Sevkabel Port (Kozhevennaya line 34; the former printed-cotton factory of Voronin, Lyutsh and Chesher, later the Vera Slutskaya factory; public since 2020;
// OSM r8702903 with its 17 parts + the two glazed galleries w1056867780 / w1056867782; docs/research/sevkabel.md section 4.10; photos 010 011 035 131-136).
// White / pale-mint plaster (#e4e9dc) over three to five storeys of 4.6 m, big multi-pane steel windows (brown-black frames, 1.6 x 2.6 m), a white cornice, hip roofs of grey-blue zinc; the river wing (the "long white
// building" of the Neva view), the north wing on Kozhevennaya line (the tallest: five storeys), the courtyard blocks and the low whitewashed annexes.  The giant engaged columns / the pedimented avant-corps of the courtyard
// side are NOT modelled (their position is [?] in the dossier).  Closed: exterior only, solid (thin wall colliders on every part).
import * as THREE from 'three';
import * as L from '../layout.js';
import { BUILDINGS } from '../data/city.js';
import { ringEdges, onEdge, band } from './kit.js';
import { windowWall, bayWall } from './facade.js';
import { roofCap } from './common.js';
import { inflate, pairs } from './surfaces.js';
import { addPolyColliders } from '../lib/massing.js';

const STOREY = 4.6;

/** a hip skirt + flat top from the inset ring; falls back to a flat cap when the inset ring collapses */
function hipRoof(P, M, poly, y, rise, inset) {
  const ring = pairs(poly.o);
  let inner = null;
  try { inner = inflate(ring, -inset); } catch (e) { inner = null; }
  const area = (r) => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a / 2); };
  const ok = inner && inner.length === ring.length && area(inner) > 0.25 * area(ring) && area(inner) < area(ring);
  roofCap(P, M.zincBlue, poly, y, 4);
  if (!ok) return;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n], ia = inner[i], ib = inner[(i + 1) % n];
    P.quad(M.zincBlue, [a[0], y + 0.25, a[1]], [b[0], y + 0.25, b[1]], [ib[0], y + rise, ib[1]], [ia[0], y + rise, ia[1]], [0, 1, 0.4], [[a[0] / 3, a[1] / 3], [b[0] / 3, b[1] / 3], [ib[0] / 3, ib[1] / 3], [ia[0] / 3, ia[1] / 3]]);
  }
  P.cap(M.zincBlue, inner, y + rise, true, 3);
}

export function build(K) {
  const { ctx, P, M, svc } = K;
  const parts = BUILDINGS.filter((b) => b.parent === 'r8702903' && b.polys && b.polys.length);
  if (!parts.length) throw new Error('r8702903 parts missing');
  const white = { front: M.whiteStone, top: M.whiteStone, under: M.whiteStone };
  let drawn = 0;
  for (const b of parts) {
    const lv = Math.max(1, b.levels || 2), H = lv === 1 ? 4.0 : STOREY * lv - 0.6;
    for (const poly of b.polys) {
      const edges = ringEdges(poly);
      edges.forEach((e) => {
        if (e.len < 3.0) { onEdge(P, e, (len) => windowWall(P, { x0: 0, x1: len, y0: 0, y1: H, tu: 4, tv: 4, wall: M.plasterMint })); return; }
        const floors = [];
        for (let f = 0; f < lv; f++) floors.push({ y0: f * STOREY, w: lv === 1 ? 1.2 : 1.6, h: lv === 1 ? 1.8 : 2.6, sill: lv === 1 ? 1.2 : 1.1, glass: M.sashFactory });
        bayWall(P, e, { y0: 0, y1: H, tu: 4, tv: 4, wall: M.plasterMint, reveal: M.plasterMint, depth: 0.2, pitch: 3.6, margin: 1.6, floors });
      });
      if (lv >= 2) { band(P, edges, H - 0.9, H - 0.55, 0.12, white); band(P, edges, H - 0.55, H, 0.28, white); }
      if (lv >= 3) hipRoof(P, M, poly, H, 2.4, 4.0); else roofCap(P, M.zincBlue, poly, H, 4);
      addPolyColliders(ctx, poly, 0, H + 1, 0.9);
      drawn++;
    }
  }
  // the two glazed galleries between wings (w1056867780 / w1056867782: OSM building=bridge, levels 2, min_level 1): a dark glazed box at 4 .. 8 m
  for (const id of ['w1056867780', 'w1056867782']) {
    const b = BUILDINGS.find((q) => q.id === id); if (!b) continue;
    for (const poly of b.polys) {
      for (const e of ringEdges(poly)) onEdge(P, e, (len) => P.quad(M.darkWin, [0, 4.2, 0], [len, 4.2, 0], [len, 7.8, 0], [0, 7.8, 0], [0, 0, 1], [[0, 0], [len / 1.5, 0], [len / 1.5, 3.6 / 1.2], [0, 3.6 / 1.2]]));
      roofCap(P, M.zincBlue, poly, 7.8, 4);
    }
  }
  svc.istkabel = { parts: drawn };
  if (!L.insideBuilding(-5900, 1040, 0.6)) svc.photoSpots.push({ x: -5900, z: 1040, yaw: -17.8, pitch: 20, name: 'Три трубы ТЭЦ-7 из двора Исткабеля' });
  const c = parts[0].polys[0].o;
  svc.crowd.push({ id: 'istkabel-courtyard', kind: 'courtyard', x: -5900, z: 990, r: 20, n: 10 });
  void THREE; void c;
}
