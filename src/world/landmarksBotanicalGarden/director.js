// landmarksBotanicalGarden/director.js - the DIRECTOR'S HOUSE (Дом директора, lit G; OSM w501013186; project of I. I. Charlemagne 1824, ground floor of the mid-18th c.; dossier 4.1b, photo 43):
//   a white-grey STONE ground floor (2.4 m, rusticated base), a yellow-ochre CLAPBOARD upper floor with white diamond-lattice casements, a four-column loggia with a white balustrade on the middle of the SOUTH
//   front (it stands on the stone base), above it the mezzanine gable of clapboard with the big semicircular lattice window and a small balustrade, a grey sheet-metal hip roof with dormers; the
//   north front has the second, shallow, pilastered loggia.  Frame DH: centre (-1346.1, -4353.5), +z = out of the south-south-east front, x along the front to the right.
import { Frame, ringOf } from './frame.js';
import { ringHouse } from './house.js';
import { revolve } from './geo.js';
import { arch } from './shell.js';
import { holedWall, pane, archSurround } from './facade.js';
import { dormerAt, chimneyAt } from './house.js';
import { stage } from './shell.js';

export const DH = new Frame(-1346.1, -4353.5, 0.3840);
const Y = { base: 2.0, cor: 6.8 };
const LOG = { x0: -4.5, x1: 3.6, zw: 10.2, zf: 12.1 };                         // the loggia: x range, wall plane, front line (local)

function loggia(K) {
  const P = K.P, M = K.M, xc = (LOG.x0 + LOG.x1) / 2;
  P.push(DH.cx, 0, DH.cz, DH.rot);
  // the stone podium under the loggia (the base projects with it), steps? none: the loggia floor is 2.4 m up and closed
  P.box(M.plinth, LOG.x0, LOG.x1, 0, Y.base, LOG.zw - 0.2, LOG.zf, 'b', 3);
  P.box(M.white, LOG.x0 - 0.05, LOG.x1 + 0.05, Y.base - 0.18, Y.base + 0.05, LOG.zw - 0.2, LOG.zf + 0.08, 'b', 3);                // the floor edge band
  // the back wall of the loggia (clapboard) with the door and two windows in the wall plane, and the two closed returns
  P.push(0, 0, LOG.zw, 0);
  const hs = [{ x0: xc - 0.6, x1: xc + 0.6, y0: Y.base + 0.05, y1: Y.base + 2.6, mat: 'timber' }, { x0: xc - 3.0, x1: xc - 2.0, y0: Y.base + 0.8, y1: Y.base + 2.7, mat: 'winD' }, { x0: xc + 2.0, x1: xc + 3.0, y0: Y.base + 0.8, y1: Y.base + 2.7, mat: 'winD' }];
  holedWall(P, M.clapOchre, LOG.x0, LOG.x1, Y.base, Y.cor + 0.5, hs, { depth: 0.3, uvs: 1.2, noEnds: true });       // up to the roof (review 2026-10-14: at Y.cor the strip between the wall top and the roof showed the sky from below)
  for (const h of hs) pane(P, M[h.mat], h, 0.3);
  P.pop();
  for (const x of [LOG.x0, LOG.x1 - 0.3]) P.box(M.clapOchre, x, x + 0.3, Y.base, Y.cor, LOG.zw - 0.3, LOG.zf, 'b', 1.2);
  // four columns and the balustrade between them
  const cols = [-3.4, -1.13, 1.13, 3.4].map((d) => xc + d);
  for (const x of cols) {
    const prof = [[0.34, 0], [0.34, 0.2], [0.27, 0.26], [0.25, 0.4], [0.24, 2.4], [0.22, 4.2], [0.3, 4.3], [0.36, 4.4], [0.4, 4.55]];
    revolve(P, M.white, prof.map(([r, y]) => [r, Y.base + y]), 12, { cx: x, cz: LOG.zf - 0.45, crease: 55, uRep: 2, vTile: 2 });
    P.box(M.white, x - 0.44, x + 0.44, Y.base + 4.55, Y.base + 4.7, LOG.zf - 0.45 - 0.44, LOG.zf - 0.45 + 0.44, 'b', 2);
  }
  // the entablature over the columns (flat roof of the loggia)
  P.box(M.white, LOG.x0 - 0.1, LOG.x1 + 0.1, Y.base + 4.7, Y.cor + 0.35, LOG.zw - 0.1, LOG.zf + 0.15, 'b', 3);
  // the balustrade (white balusters between the columns, 0.9 m)
  for (let b = 0; b < cols.length - 1; b++) {
    const a = cols[b] + 0.3, c = cols[b + 1] - 0.3, n = Math.max(3, Math.round((c - a) / 0.22)), z = LOG.zf - 0.45;
    P.box(M.white, a, c, Y.base + 0.1, Y.base + 0.22, z - 0.12, z + 0.12, 'b', 2);
    P.box(M.white, a, c, Y.base + 0.95, Y.base + 1.08, z - 0.14, z + 0.14, 'b', 2);
    for (let i = 0; i < n; i++) { const x = a + (i + 0.5) * (c - a) / n; P.cyl(M.white, [x, Y.base + 0.22, z], [x, Y.base + 0.95, z], 0.045, 0.045, 5, false); }
  }
  // the two outer posts of the balustrade at the ends are the end columns; the loggia side returns are the ring walls
  P.pop();
}

function mezzanine(K, h) {
  const P = K.P, M = K.M, xc = (LOG.x0 + LOG.x1) / 2, hw = 3.6;
  P.push(DH.cx, 0, DH.cz, DH.rot);
  const y0 = Y.cor + 0.3, y1 = y0 + 2.2, zf = LOG.zw + 0.1;
  // the clapboard front of the mezzanine with the big semicircular lattice window and a little balcony balustrade in front of it
  P.push(0, 0, zf, 0);
  holedWall(P, M.clapOchre, xc - hw, xc + hw, y0, y1, [{ cx: xc, y0: y0 + 0.5, w: 4.6, h: 2.0, arch: true }], { depth: 0.3, uvs: 1.2, noEnds: true });
  pane(P, M.winD, { cx: xc, y0: y0 + 0.5, w: 4.6, h: 2.0, arch: true }, 0.3);
  archSurround(P, M.white, { cx: xc, y0: y0 + 0.5, w: 4.6, h: 2.0 }, { sw: 0.2, proud: 0.07 });
  P.pop();
  const bz = zf + 0.55;
  P.box(M.white, xc - 2.3, xc + 2.3, y0 - 0.05, y0 + 0.08, zf, bz, 'b', 2); P.box(M.white, xc - 2.3, xc + 2.3, y0 + 0.65, y0 + 0.75, bz - 0.1, bz, 'b', 2);
  for (let i = 0; i < 18; i++) { const x = xc - 2.2 + i * 4.4 / 17; P.cyl(M.white, [x, y0 + 0.08, bz - 0.05], [x, y0 + 0.65, bz - 0.05], 0.03, 0.03, 4, false); }
  // the gable above and its roof (ridge along z, to the main roof)
  const gy = y1, pedH = 1.6;
  P.fan(M.clapOchre, [[xc - hw - 0.15, gy, zf], [xc + hw + 0.15, gy, zf], [xc, gy + pedH, zf]], [0, 0, 1], (p) => [p[0] / 1.2, p[1] / 1.2]);
  for (const s of [-1, 1]) P.cyl(M.white, [xc + s * (hw + 0.25), gy + 0.02, zf + 0.1], [xc, gy + pedH + 0.1, zf + 0.1], 0.1, 0.1, 4, false);
  const yr = gy + pedH + 0.1, ov = 0.45;
  for (const s of [-1, 1]) P.quad(M.zinc, [xc + s * (hw + ov), gy - 0.15, zf + 0.35], [xc + s * (hw + ov), gy - 0.15, zf - 9], [xc, yr, zf - 9], [xc, yr, zf + 0.35], [s * pedH, hw, 0], [[0, 0], [8, 0], [8, 5], [0, 5]]);
  for (const s of [-1, 1]) P.quad(M.clapOchre, [xc + s * hw, y0, zf], [xc + s * hw, y0, zf - 9], [xc + s * hw, y1, zf - 9], [xc + s * hw, y1, zf], [s, 0, 0], [[0, 0], [8, 0], [8, 2], [0, 2]]);
  P.pop();
  void h;
}

function north(K) {
  const P = K.P, M = K.M;
  P.push(DH.cx, 0, DH.cz, DH.rot);
  // the shallow back portico: four flat pilasters and a pediment-less entablature on the projection of the ring (x -5.8 .. 3.5, z -10.7)
  for (const x of [-5.5, -3.0, -0.5, 2.0, 3.3]) P.box(M.white, x - 0.2, x + 0.2, Y.base, Y.cor, -10.78, -10.62, 'b', 2);
  P.box(M.white, -5.9, 3.7, Y.cor - 0.2, Y.cor + 0.3, -10.9, -9.2, 'b', 3);
  P.pop();
}

export function build(K) {
  const ring = ringOf('w501013186'), M = K.M;
  const fr = DH;
  const loc = (p) => fr.l(p[0], p[1]);
  // the roof ring: the south loggia projection replaced by a straight line along the wall (the loggia has its own flat roof)
  const roofRing = ring.filter((p) => { const q = loc(p); return !(q[1] > 10.5 && q[0] > LOG.x0 - 0.3 && q[0] < LOG.x1 + 0.3); });
  roofRing.splice(0, 0);
  const inLog = (e) => { const m = loc([(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2]); return m[0] > LOG.x0 - 0.8 && m[0] < LOG.x1 + 0.8 && m[1] > 10.0 && e.len < 9; };
  let res;
  stage(K, 'house', () => {
    res = ringHouse(K, ring, {
      baseH: Y.base, baseMat: M.plinth, wallMat: M.clapOchre, wallUvs: 1.2, y1: Y.cor, surround: 'light',
      floors: [{ y0: Y.base + 1.1, h: 2.2, w: 1.15, mat: 'winD' }], pitch: 3.0, margin: 1.5, baseWin: { y0: 0.7, h: 0.8, w: 0.9 },       // small semi-basement windows in the stone ground floor (photo 43)
      roofMat: M.zinc, roofSlope: 0.4, over: 0.5, cornice: { h: 0.35, d: 0.4 }, roofRing: roofRing.length >= 3 ? roofRing : undefined,
      edgeFilter: (e) => !inLog(e),
    });
  });
  stage(K, 'loggia', () => loggia(K));
  stage(K, 'north', () => north(K));
  if (res && res.roofH) {
    stage(K, 'mezzanine', () => mezzanine(K, res.roofH));
    stage(K, 'dormers', () => {
      for (const lx of [-12.5, -8.2, 6.4, 10.8]) { const w = fr.w(lx, 8.3); dormerAt(K, res.roofH, w[0], w[1], Math.sin(fr.rot), Math.cos(fr.rot), { w: 1.2, h: 1.3, win: 'winD', roofMat: M.zinc }); }
      for (const lx of [-10, 9]) { const w = fr.w(lx, -7.0); dormerAt(K, res.roofH, w[0], w[1], -Math.sin(fr.rot), -Math.cos(fr.rot), { w: 1.2, h: 1.3, win: 'winD', roofMat: M.zinc }); }
      for (const lx of [-8, 8]) { const w = fr.w(lx, 1.5); chimneyAt(K.P, M, res.roofH, w[0], w[1], 2.0, M.roofRed); }
    });
  }
  const front = fr.w(-0.4, 30), c = fr.w(-0.4, 10);
  K.svc.monuments.push({ id: 'w501013186', name: 'Дом директора Ботанического сада', x: c[0], z: c[1], h: 10.6 });
  K.svc.photoSpots.push({ x: front[0], z: front[1], yaw: Math.round(fr.rot * 180 / Math.PI), name: 'Дом директора: лоджия на южном фасаде' });
  if (K.errs && K.errs.length) throw new Error('director: ' + K.errs.join('\n'));
}
