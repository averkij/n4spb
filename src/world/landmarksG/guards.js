// landmarksG/guards.js - the Guards Corps Headquarters (A. Bryullov 1837-43, Dvortsovaya pl. 2-4 / Millionnaya 40), OSM w41289421: an L of 4 storeys, 18.9 m, pale cream-yellow (#e6dc9c) with white
// order and a pink granite plinth.  The front towards the column (SW, v = -127.8 in the palace frame) is a 65 m block with TWELVE free Ionic columns (pitch 4.3 m, 7.9 -> 15.6 m) over a smooth
// two-storey base (windows on balustrade panels, "guardsmen's lace" stucco panels between them, two tall white portals with brown doors at the ends), two recessed wing fronts and 9 m steps.
// Photo refs/palace-square/117 (straight-on, scale 31 px/m).  Rear (Millionnaya) walls and the court wing are plain windows.  The mast on the roof is omitted.
import * as L from '../layout.js';
import { buildHouse } from './house.js';
import { onEdge, band } from './kit.js';
import { ringFromFlat } from '../lib/massing.js';
import { GC } from './mats.js';
import { guardsProjection } from './projection.js';

const Y = { PL: 0.9, BELT: 7.7, COL0: 7.9, COL1: 15.6, FRIEZE: 16.35, COR: 17.15, TOP: 18.45 };
const inRing = (r, x, z) => { let ins = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) ins = !ins; } return ins; };
function mkEdge(a, b, ring, o = {}) {
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
  let n = [dz / len, -dx / len];
  if (inRing(ring, (a[0] + b[0]) / 2 + n[0] * 0.6, (a[1] + b[1]) / 2 + n[1] * 0.6)) n = [-n[0], -n[1]];
  return { a, b, len, n, ...o };
}

export function build(K, ctx) {
  const P = K.P, GM = K.G.M, G = K.G;
  const rec = L.buildingById('w41289421');
  if (!rec) throw new Error('Guards HQ record missing');
  const ring = ringFromFlat(rec.polys[0].o);
  const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.5;
  const front = [[4, 5, 'wing'], [5, 6, 'step'], [6, 7, 'main'], [7, 8, 'step'], [8, 9, 'wing']];
  const isFront = (e) => front.some(([i, j]) => (near(e.a, ring[i]) && near(e.b, ring[j])) || (near(e.a, ring[j]) && near(e.b, ring[i])));
  buildHouse(K, {
    name: 'guards', recs: [rec], hc: 17.9, wall: GC.guardsWall, court: '#dcd290', plinth: 1.0, plinthMat: GM.plinth, floors: [4.4, 4.0, 3.9, 3.6], courtPitch: 3.4,
    roofMat: GM.roof, upstand: 0.45, party: (e) => (isFront(e) ? true : null), railing: true, collideH: 20,
  });
  const edges = front.map(([i, j, kind]) => mkEdge(ring[i], ring[j], ring, { kind }));
  const white = GM.guardsWhite, shade = GM.whiteShade;
  band(P, edges, 0, Y.PL, 0.1, { front: K.rust(GC.plinth), top: GM.graniteGrey }, { uvs: 2.4 });
  band(P, edges, Y.BELT, Y.BELT + 0.3, 0.12, { front: white, top: white, under: shade });
  band(P, edges, Y.COL1, Y.FRIEZE, (e) => (e.kind === 'main' ? 0.55 : 0.1), { front: white, top: white, under: shade });
  band(P, edges, Y.FRIEZE, Y.COR - 0.4, 0.06, { front: GM.guards, top: GM.guards, under: shade });
  band(P, edges, Y.COR - 0.4, Y.COR, (e) => (e.kind === 'main' ? 0.9 : 0.5), { front: K.mats.dentil, top: white, under: shade }, { uvs: 0.6 });
  band(P, edges, Y.COR, Y.TOP - 0.25, (e) => (e.kind === 'main' ? 1.15 : 0.7), { front: white, top: white, under: shade });
  band(P, edges, Y.TOP - 0.25, Y.TOP, (e) => (e.kind === 'main' ? 0.8 : 0.45), { front: white, top: white, under: shade });
  for (const e of edges) onEdge(P, e, (len) => face(K, e, len));
  guardsProjection(ctx, edges.find(e => e.kind === 'main'));
  K.svc.houses.push({ id: 'w41289421', name: 'Штаб Гвардейского корпуса', nameEn: 'Guards Corps Headquarters', x: -1872, z: -866 });
  K.svc.monuments.push({ id: 'guards-hq', name: 'Штаб Гвардейского корпуса', nameEn: 'Guards Corps HQ', x: -1895, z: -860, h: 19 });
}

function face(K, e, len) {
  const P = K.P, GM = K.G.M, G = K.G, white = GM.guardsWhite;
  const win = (o) => K.window({ frame: 'white', surMat: white, sillMat: white, ...o });
  K.wallQuad(GM.guards, 0, len, Y.PL, Y.TOP, 3);
  if (e.kind === 'main') {
    const P0 = 8.85, pitch = 4.3, r = 0.55;
    // columns, 12 free Ionic columns 0.75 m in front of the wall
    for (let k = 0; k < 12; k++) K.column(white, P0 + k * pitch, 0.78, Y.COL0, Y.COL1, r, { capH: r * 1.3, volutes: true, seg: 12 });
    P.box(shade(GM), P0 - 0.9, P0 + 11 * pitch + 0.9, Y.COL0 - 0.1, Y.COL0, 0.2, 1.3, 'k');          // continuous stylobate under the columns
    for (let k = -1; k <= 11; k++) {
      const x = P0 + k * pitch + pitch / 2;
      if (x < 1.2 || x > len - 1.2) continue;
      // base: two window rows between the lace panels
      win({ x, y: 1.5, w: 1.45, h: 2.4, sw: 0.13, d: 0.09 });
      win({ x, y: 5.0, w: 1.45, h: 2.0, sw: 0.13, d: 0.09 });
      // upper storeys between the columns
      if (k >= 0 && k < 11) {
        win({ x, y: 9.0, w: 1.6, h: 2.5, sw: 0.1, d: 0.07, sill: true });
        P.box(GM.wall, x - 0.85, x + 0.85, 8.2, 8.95, 0, 0.1, 'kb');
        win({ x, y: 13.2, w: 1.6, h: 1.7, sw: 0.1, d: 0.07, sill: true });
        P.box(white, x - 0.85, x + 0.85, 12.2, 13.1, 0, 0.1, 'kb');
      }
    }
    // lace panels on the piers of the base (between the window axes)
    for (let k = 0; k <= 11; k++) { const x = P0 + k * pitch; K.plane(G.lace, x - 0.45, x + 0.45, 1.5, 6.9, 0.06); }
    // end zones: tall white portals with brown doors
    for (const x of [4.2, len - 4.2]) portal(K, x);
    // frieze rosettes
    K.strip(K.mats.rosette, 0.5, len - 0.5, Y.FRIEZE + 0.05, Y.COR - 0.5, 0.05, 2);
  } else {
    const n = Math.max(1, Math.round(len / 3.6)), p = len / n;
    for (let i = 0; i < n; i++) {
      const x = p * (i + 0.5);
      win({ x, y: 1.5, w: 1.4, h: 2.4, sw: 0.13, d: 0.09 });
      win({ x, y: 5.0, w: 1.4, h: 2.0, sw: 0.13, d: 0.09 });
      win({ x, y: 9.0, w: 1.4, h: 2.5, sw: 0.12, d: 0.08 });
      win({ x, y: 13.2, w: 1.4, h: 1.7, sw: 0.12, d: 0.08 });
    }
    // end pilasters
    for (const x of [0.5, len - 0.5]) K.pilaster(white, x, 0.7, Y.COL0, Y.COL1, 0.15, 0.5);
  }
  P.box(GM.guardsWhite, 0, len, Y.TOP, Y.TOP + 0.5, 0.1, 0.5, 'b');                                      // roof parapet
}
const shade = (GM) => GM.whiteShade;

function portal(K, x) {
  const P = K.P, GM = K.G.M, white = GM.guardsWhite;
  const w = 2.2, h = 6.4;
  P.box(white, x - w / 2 - 0.55, x - w / 2, 0, h + 0.5, 0, 0.3, 'kb'); P.box(white, x + w / 2, x + w / 2 + 0.55, 0, h + 0.5, 0, 0.3, 'kb');
  P.box(white, x - w / 2 - 0.55, x + w / 2 + 0.55, h, h + 0.5, 0, 0.3, 'kb');
  P.box(GM.door, x - w / 2, x + w / 2, 0.05, h, 0.04, 0.1, 'kb');
  P.box(GM.black, x - 0.02, x + 0.02, 0.05, h, 0.1, 0.12, 'kb');
}
