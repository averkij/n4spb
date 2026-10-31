// landmarksVladimir/buyan.js - TUCHKOV BUYAN, the hemp warehouses on the Malaya Neva (Большой пр. П.С., 1А; A. A. Dyakov after M. A. Dedenev and A. Rinaldi, 1763-72; OSM w30352025) in
// the frame BUYAN (frame.js: origin = the middle of the river front, +z = out to the river, +x = along the front to the ESE).  Dossier docs/research/vladimir.md section 4; photos
// refs/vladimir buyan_02 / 05 / 07_frag (bays: four rows of small windows, lesenes, string course), buyan_08_centre + buyan_09_balcony (weigh house), buyan_03 (gallery link with its arch),
// buyan_10_aerial + buyan_11 (massing, hip roofs).  Unrestored state of June 2026: flaking ochre, off-white trim, grey sheet roofs.
// Plan [OSM]: two L-shaped blocks (front 85 m and 84 m, 19 m deep, end wings to 42 m), the pavilion 18 x 19 m between them, links 8.5 m long set back 13.4 m.  ~9 k triangles.
import * as THREE from 'three';
import * as G from './geo.js';
import * as S from './stucco.js';
import { BUYAN } from './frame.js';
import { ringEdges, onEdge, band, polyOf, rectPath } from './kit.js';
import { hipRoof } from './roofs.js';
import { segBand } from './cathedral.js';
import { addPolyColliders } from '../lib/massing.js';

const WEST = [[-102.2, 0], [-17.2, 0], [-17.2, -18.9], [-78.1, -18.9], [-78.1, -42.8], [-102.2, -42.8]];
const EAST = [[18, 0], [102.2, 0], [102.2, -42.0], [78.7, -42.0], [78.7, -19.3], [18, -19.3]];
const PAV = [[-8.4, -0.35], [9.5, -0.35], [9.5, -19.1], [-8.4, -19.1]];
const LINKS = [{ x0: -17.2, x1: -8.4, zf: -13.6, zb: -18.9 }, { x0: 9.5, x1: 18, zf: -13.1, zb: -19.3 }];
const BAY = 4.7, YP = 1.0, YC = 15.2;

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx, F = BUYAN;
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksVladimir] buyan/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  P.push(F.ox, 0, F.oz, F.rot);
  stage('blocks', () => { block(P, M, WEST); block(P, M, EAST); });
  stage('pavilion', () => pavilion(P, M));
  stage('links', () => { for (const l of LINKS) link(P, M, l); });
  P.pop();
  stage('colliders', () => {
    for (const r of [WEST, EAST, PAV]) addPolyColliders(ctx, F.poly(r), 0, 16, 0.9);
    for (const l of LINKS) F.box(ctx.physics, (l.x0 + l.x1) / 2, (l.zf + l.zb) / 2, l.x1 - l.x0, l.zf - l.zb, 0, 0, 8);
  });
  const c = F.W(0, -9);
  K.svc.monuments.push({ id: 'w30352025', name: 'Тучков буян (пеньковые склады)', x: c.x, z: c.z, h: 19 });
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ one L-shaped warehouse block
function block(P, M, ring) {
  const E = ringEdges(polyOf(ring));
  for (const e of E) onEdge(P, e, (len) => {
    const nb = Math.max(1, Math.round(len / BAY)), w = len / nb;
    P.quad(M.buyanBay, [0, YP, 0], [len, YP, 0], [len, YC, 0], [0, YC, 0], [0, 0, 1], [[0, 0], [nb, 0], [nb, 1], [0, 1]]);
    P.box(M.plinth, 0, len, 0, YP, 0, 0.16, 'bk');
    for (let k = 0; k <= nb; k++) { const u = k * w, a = k === 0 ? 0 : u - 0.3, b = k === nb ? len : u + 0.3; P.box(M.ochreTrim, a, b, YP, YC - 0.6, 0, 0.13, 'bk' + (k === 0 ? 'l' : '') + (k === nb ? 'r' : '')); }
  });
  band(P, E, YC - 0.62, YC - 0.3, 0.22, { front: M.ochreTrim, under: M.ochreTrim });
  band(P, E, YC - 0.3, YC, 0.5, { front: M.ochreTrim, top: M.buyanRoof, under: M.ochreTrim });
  hipRoof(P, M.buyanRoof, ring, YC + 0.02, 0.42, { step: 3.2, cap: 4.2 });
  // brick chimneys on the ridge (photo buyan_11)
  const xs = ring === WEST ? [-70, -50, -30] : [30, 50, 70];
  for (const x of xs) P.box(M.ochre, x - 0.5, x + 0.5, YC + 3.2, YC + 5.4, -9.9, -8.9, 'b');
}

// ------------------------------------------------------------------------------------------------ the weigh house (важня)
function pavilion(P, M) {
  const E = ringEdges(polyOf(PAV)), y1 = 6.5, y2 = 12.4;
  E.forEach((e, i) => onEdge(P, e, (len) => {
    P.quad(M.buyanPlain, [0, YP, 0], [len, YP, 0], [len, y2, 0], [0, y2, 0], [0, 0, 1], [[0, 0], [len / 4, 0], [len / 4, 2.4], [0, 2.4]]);
    P.box(M.plinth, 0, len, 0, YP, 0, 0.16, 'bk');
    P.box(M.ochreTrim, 0, len, y1 - 0.2, y1 + 0.15, 0, 0.14, 'bk');
    for (const u of [0.55, len - 0.55]) for (let k = 0; k < 9; k++) P.box(M.ochreTrim, u - 0.55, u + 0.55, YP + 0.1 + k * 1.24, YP + 1.14 + k * 1.24, 0, 0.16, 'bk' + (u < 1 ? 'l' : 'r'));   // rusticated quoins
    const front = i === 0, n = front ? 3 : 3, cx = (k) => len * (k + 0.5) / n;
    for (let k = 0; k < n; k++) {
      const u = cx(k), mid = front && k === 1;
      if (mid) {
        // ground floor: the door in an arched recess; upper floor: the arched window with its baroque surround and the iron balcony
        S.archGlass(P, M.dark, u, YP, 2.0, 4.4, 0.04); S.archFrame(P, M.ochreTrim, u, YP, 2.0, 4.4, 0.28, 0, 0.18);
        G.pane(P, M.doorSide, u - 0.8, u + 0.8, YP, YP + 2.6, 0.07);
        S.archGlass(P, M.winArch, u, y1 + 1.0, 1.7, 3.9, 0.05); S.archFrame(P, M.ochreTrim, u, y1 + 1.0, 1.7, 3.9, 0.3, 0, 0.2);
        for (const s of [-1, 1]) S.volute(P, M.ochreTrim, u + s * 1.35, y1 + 3.3, 0.14, 0.34, s > 0 ? 0 : Math.PI, Math.PI * 1.4);
        G.solid(P, M.ochreTrim, segBand(u, y1 + 5.15, 1.5, 0.5, 0.2, 8), 0, 0.32);
        P.box(M.ochreTrim, u - 1.7, u + 1.7, y1 + 0.72, y1 + 0.9, 0, 1.0, 'k');
        for (const du of [-1.3, -0.45, 0.45, 1.3]) S.console_(P, M, u + du, y1 + 0.72, 0, 0.8, 0.92);
        P.quad(M.fence, [u - 1.7, y1 + 0.9, 1.0], [u + 1.7, y1 + 0.9, 1.0], [u + 1.7, y1 + 1.85, 1.0], [u - 1.7, y1 + 1.85, 1.0], [0, 0, 1], [[0.05, 0.5], [1.3, 0.5], [1.3, 0.97], [0.05, 0.97]]);
        for (const s of [-1, 1]) P.quad(M.fence, [u + s * 1.7, y1 + 0.9, 0.02], [u + s * 1.7, y1 + 0.9, 1.0], [u + s * 1.7, y1 + 1.85, 1.0], [u + s * 1.7, y1 + 1.85, 0.02], [s, 0, 0], [[0.05, 0.5], [0.42, 0.5], [0.42, 0.97], [0.05, 0.97]]);
      } else {
        for (const [yb, hh] of [[YP + 1.5, 2.3], [y1 + 1.4, 2.6]]) {
          G.pane(P, M.winSq, u - 0.75, u + 0.75, yb, yb + hh, 0.04);
          P.box(M.ochreTrim, u - 1.0, u - 0.75, yb - 0.2, yb + hh + 0.25, 0, 0.14, 'bk'); P.box(M.ochreTrim, u + 0.75, u + 1.0, yb - 0.2, yb + hh + 0.25, 0, 0.14, 'bk');
          P.box(M.ochreTrim, u - 0.75, u + 0.75, yb + hh, yb + hh + 0.25, 0, 0.14, 'bklr'); P.box(M.ochreTrim, u - 1.1, u + 1.1, yb - 0.38, yb - 0.2, 0, 0.24, 'k');
        }
      }
    }
  }));
  band(P, E, y2 - 0.45, y2 - 0.1, 0.24, { front: M.ochreTrim, under: M.ochreTrim });
  band(P, E, y2 - 0.1, y2 + 0.2, 0.55, { front: M.ochreTrim, top: M.buyanRoof, under: M.ochreTrim });
  hipRoof(P, M.buyanRoof, PAV, y2 + 0.22, 0.4, { step: 3, cap: 3.2 });
}

// ------------------------------------------------------------------------------------------------ a gallery link: a wall with one wide arch, a flat roof with a parapet
function link(P, M, l) {
  const len = l.x1 - l.x0, h = 7.6, aw = 4.4, ah = 2.6;
  P.push(l.x0, 0, l.zf, 0);
  { const sh = new THREE.Shape(); rectPath(sh, 0, 0, len, h); const hole = new THREE.Path(); hole.moveTo(len / 2 - aw / 2, 0); hole.lineTo(len / 2 - aw / 2, ah); hole.absellipse(len / 2, ah, aw / 2, 1.9, Math.PI, 0, true, 0); hole.lineTo(len / 2 + aw / 2, 0); hole.lineTo(len / 2 - aw / 2, 0); sh.holes.push(hole); P.face(M.buyanPlain, sh, 0, 4); }
  P.quad(M.archDark, [0.2, 0, -2.6], [len - 0.2, 0, -2.6], [len - 0.2, h, -2.6], [0.2, h, -2.6], [0, 0, 1]);
  for (const s of [-1, 1]) P.quad(M.buyanPlain, [len / 2 + s * aw / 2, 0, -2.6], [len / 2 + s * aw / 2, 0, 0], [len / 2 + s * aw / 2, ah, 0], [len / 2 + s * aw / 2, ah, -2.6], [-s, 0, 0], [[0, 0], [0.65, 0], [0.65, 0.65], [0, 0.65]]);
  P.box(M.ochreTrim, -0.05, len + 0.05, h - 0.5, h, 0, 0.3, 'bk'); P.box(M.ochreTrim, 0, len, 4.9, 5.15, 0, 0.12, 'bk');
  for (const u of [1.6, len - 1.6]) { G.pane(P, M.winSq, u - 0.6, u + 0.6, 5.5, 6.8, 0.04); P.box(M.ochreTrim, u - 0.8, u + 0.8, 6.8, 7.0, 0, 0.12, 'bk'); }
  P.pop();
  P.cap(M.buyanRoof, [[l.x0, l.zb], [l.x1, l.zb], [l.x1, l.zf], [l.x0, l.zf]], 7.58, true, 2.4);
}
