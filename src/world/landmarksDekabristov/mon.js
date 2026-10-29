// landmarksDekabristov/mon.js - the small vocabulary of the monuments and tombs of the module: stepped plinths, a tapered square obelisk with a pyramid cap, a stele with a plate, a kerb frame with a mound, a
// sarcophagus, a gable-roofed crypt, a pavilion on four piers, a bunch of flowers.  Everything is built in the CURRENT Parts frame (kit.js: P.push(x, 0, z, rotY) for the site of the thing), colliders are added in the world
// frame by the part.  All of it is granite / bronze / plaster as in landmarksSmolensky (the same materials of the family); nothing carries a text except plates that the part asks for with plateMat() (art.js).
import * as G from './geo.js';

/** circumradius of a square of side w (geo.frustum takes the circumradius of an n-gon) */
export const sq = (w) => w / Math.SQRT2;
/** a stack of n centred steps, first w x d x h, every next one inset by `ins` on each side; returns the top y */
export function steps(P, mat, w, d, n, h, ins, y0 = 0) {
  let y = y0;
  for (let i = 0; i < n; i++) { const a = w / 2 - ins * i, b = d / 2 - ins * i; P.box(mat, -a, a, y, y + h, -b, b, 'b', 2); y += h; }
  return y;
}
/** a tapered square obelisk (base side w0 at y0, top side w1 at y1) with a pyramid cap of height `cap` */
export function obelisk(P, mat, capMat, y0, y1, w0, w1, cap) {
  G.frustum(P, mat, 0, 0, y0, y1, 4, sq(w0), sq(w1), Math.PI / 4, 1, Math.max(1, (y1 - y0) / 3));
  G.frustum(P, capMat || mat, 0, 0, y1, y1 + cap, 4, sq(w1), 0, Math.PI / 4, 1, 1);
}
/** a stele: a slab w wide, t thick, h tall on a plinth; a plate (material) on the front (+z) when given */
export function stele(P, mat, { w = 0.9, t = 0.22, h = 1.6, plinth = 0.25, plate = null, plateW = 0.6, plateH = 0.3, plateY = 0.8, plateMat = null, top = 'flat' } = {}) {
  P.box(mat, -w / 2 - 0.12, w / 2 + 0.12, 0, plinth, -t / 2 - 0.12, t / 2 + 0.12, 'b', 2);
  P.box(mat, -w / 2, w / 2, plinth, plinth + h, -t / 2, t / 2, 'b', 2);
  if (top === 'peak') G.frustum(P, mat, 0, 0, plinth + h, plinth + h + w * 0.28, 4, sq(w) * 0.98, 0.02, Math.PI / 4, 1, 1);
  if (plateMat) P.quad(plateMat, [-plateW / 2, plinth + plateY, t / 2 + 0.02], [plateW / 2, plinth + plateY, t / 2 + 0.02], [plateW / 2, plinth + plateY + plateH, t / 2 + 0.02], [-plateW / 2, plinth + plateY + plateH, t / 2 + 0.02], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  void plate;
}
/** a kerb frame (four low beams) round a bed w x l with a mound of earth / lawn inside */
export function kerbBed(P, kerb, bed, w, l, h = 0.14, k = 0.13) {
  P.box(kerb, -w / 2, w / 2, 0, h, l / 2 - k, l / 2, 'b', 1); P.box(kerb, -w / 2, w / 2, 0, h, -l / 2, -l / 2 + k, 'b', 1);
  P.box(kerb, -w / 2, -w / 2 + k, 0, h, -l / 2 + k, l / 2 - k, 'b', 1); P.box(kerb, w / 2 - k, w / 2, 0, h, -l / 2 + k, l / 2 - k, 'b', 1);
  P.box(bed, -w / 2 + k, w / 2 - k, 0, h * 0.8, -l / 2 + k, l / 2 - k, 'b', 2);
}
/** a sarcophagus-like tomb: plinth, body with a coved lid; w x l, body height h */
export function sarcophagus(P, mat, lid, w, l, h) {
  P.box(mat, -w / 2 - 0.1, w / 2 + 0.1, 0, 0.18, -l / 2 - 0.1, l / 2 + 0.1, 'b', 2);
  P.box(mat, -w / 2, w / 2, 0.18, 0.18 + h, -l / 2, l / 2, 'b', 2);
  P.box(lid, -w / 2 - 0.05, w / 2 + 0.05, 0.18 + h, 0.18 + h + 0.12, -l / 2 - 0.05, l / 2 + 0.05, 'b', 2);
  P.box(lid, -w / 2 + 0.12, w / 2 - 0.12, 0.3 + h, 0.3 + h + 0.12, -l / 2 + 0.12, l / 2 - 0.12, 'b', 2);
}
/** a gable-roofed crypt chapel: footprint w x l (l along the gable), wall height h, ridge rise `rise`, a dark door on the +z front */
export function crypt(P, wall, roof, door, trim, w, l, h, rise) {
  P.box(trim, -w / 2 - 0.15, w / 2 + 0.15, 0, 0.35, -l / 2 - 0.15, l / 2 + 0.15, 'b', 2);
  P.box(wall, -w / 2, w / 2, 0.35, 0.35 + h, -l / 2, l / 2, 'b', 2);
  // gabled roof: two slopes (front / back gables are triangles of the wall material)
  const y0 = 0.35 + h, y1 = y0 + rise, ov = 0.25;
  const n = Math.hypot(rise, w / 2 + ov), s = rise / n, c = (w / 2 + ov) / n;
  P.quad(roof, [-w / 2 - ov, y0, l / 2 + ov], [0, y1, l / 2 + ov], [0, y1, -l / 2 - ov], [-w / 2 - ov, y0, -l / 2 - ov], [-s, c, 0], [[0, 0], [1, 0], [1, 3], [0, 3]]);
  P.quad(roof, [0, y1, l / 2 + ov], [w / 2 + ov, y0, l / 2 + ov], [w / 2 + ov, y0, -l / 2 - ov], [0, y1, -l / 2 - ov], [s, c, 0], [[0, 0], [1, 0], [1, 3], [0, 3]]);
  P.fan(wall, [[-w / 2, y0, l / 2 + 0.01], [w / 2, y0, l / 2 + 0.01], [0, y1 - 0.05, l / 2 + 0.01]], [0, 0, 1], (p) => [p[0] / 2, p[1] / 2]);
  P.fan(wall, [[w / 2, y0, -l / 2 - 0.01], [-w / 2, y0, -l / 2 - 0.01], [0, y1 - 0.05, -l / 2 - 0.01]], [0, 0, -1], (p) => [p[0] / 2, p[1] / 2]);
  P.quad(door, [-0.55, 0.35, l / 2 + 0.03], [0.55, 0.35, l / 2 + 0.03], [0.55, 0.35 + 2.0, l / 2 + 0.03], [-0.55, 0.35 + 2.0, l / 2 + 0.03], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
}
/** a pavilion on four square piers (side `p`) on a plinth s x s: entablature, a hipped roof with a lantern and a cross */
export function pavilion(P, M, s, h) {
  const a = s / 2, p = 0.3;
  P.box(M.stoneGrey, -a - 0.2, a + 0.2, 0, 0.3, -a - 0.2, a + 0.2, 'b', 2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const cx = sx * (a - p / 2), cz = sz * (a - p / 2); P.box(M.plaster, cx - p / 2 - 0.04, cx + p / 2 + 0.04, 0.3, 0.55, cz - p / 2 - 0.04, cz + p / 2 + 0.04, 'b', 2); P.box(M.plaster, cx - p / 2, cx + p / 2, 0.55, 0.3 + h, cz - p / 2, cz + p / 2, 'b', 2); }
  P.box(M.plaster, -a - 0.1, a + 0.1, 0.3 + h, 0.3 + h + 0.3, -a - 0.1, a + 0.1, 'b', 2);
  G.frustum(P, M.roofGrey, 0, 0, 0.6 + h, 0.6 + h + 1.5, 4, sq(s + 0.9), sq(0.7), Math.PI / 4, 1, 2);
  P.box(M.roofGrey, -0.3, 0.3, 0.6 + h + 1.5, 0.6 + h + 2.0, -0.3, 0.3, 'b', 1);
  G.frustum(P, M.roofGrey, 0, 0, 0.6 + h + 2.0, 0.6 + h + 2.5, 4, sq(0.7), 0, Math.PI / 4, 1, 1);
  G.cross(P, M.crossIron, 0, 0.6 + h + 2.5, 0, 0.9);
  // the tomb inside: a sarcophagus on the plinth floor
  P.box(M.stonePale, -0.7, 0.7, 0.3, 0.9, -1.0, 1.0, 'b', 2); P.box(M.stoneGrey, -0.8, 0.8, 0.9, 1.0, -1.1, 1.1, 'b', 2);
}
/** a small bunch of flowers lying on a slab at (x, y, z): paper cone + four blossoms (colours from M) */
export function bunch(P, M, x, y, z, i) {
  const cols = [M.flowerRed, M.flowerWhite, M.flower, M.flowerPink];
  i = Math.abs(Math.round(i));                                    // a seed from a coordinate may be negative
  P.push(x, y, z, i * 2.3);
  P.col(M.plaster, 0, 0, 0, 0.2, 0.025, 0.09, 6, false);
  for (let k = 0; k < 4; k++) { const a = k * 1.9 + i, r = k === 0 ? 0 : 0.06; G.ball(P, cols[(i + k) % 4], Math.cos(a) * r, 0.22 + (k % 2) * 0.03, Math.sin(a) * r, 0.06, 6); }
  P.pop();
}
/** a wreath-and-flowers row along the foot of a plinth: n bunches from (x0, z0) along (dx, dz) */
export function bunches(P, M, x0, z0, dx, dz, n, y = 0, seed = 0) { for (let i = 0; i < n; i++) bunch(P, M, x0 + dx * i, y, z0 + dz * i, i + seed); }
