// landmarksStrelka/exchange.js - the Old Stock Exchange (Биржа, Thomas de Thomon 1805-10): a temple on a granite podium (docs/research/strelka.md 2.2; photos refs/strelka ex_01 ex_06 ex_08 ex_09).
// Model frame (frame.js): +z = the east front (toward the tip of the Spit), +x = north; the building is symmetric in x and z.
//   podium 3.0 m (main block x +-35.5, z +-48.6), end stairs 46 m wide between cheek blocks, two ramps on each long side rising to a middle landing;
//   cella 44.28 x 68.86 m (walls 3.0 .. 15.7, one arched niche bay per intercolumniation: texture), 36 pilasters; 44 Doric columns 11.35 m (10 on the ends at 6.035 m, 14 on the sides at 6.065 m,
//   corners shared) as ONE InstancedMesh; beams, architrave, triglyph frieze (two triglyphs per bay), cornice, attic, lean-to roof of the colonnade;
//   clerestory to the eaves at 24.4, gable roof with the ridge at 29.8 along z, fan windows in both gables (texture), lunettes on the flanks, quoins, raking cornices, the roof lantern.
// Colliders: the podium is walk boxes around the cella (the cella itself is four thin wall boxes: the roof map makes its roof landable), stairs, walk ramps, a cylinder per column.
import * as THREE from 'three';
import { ROT, W, boxAt, cylAt, walkAt, rampAt } from './frame.js';
import { plate, vquad, wall, slope, vpoly, latheGeo } from './prims.js';
import { addInstanced, mat4 } from './inst.js';
import { exchangeGroup } from './statues.js';

export const EX = {
  podY: 3.0, podX: 35.5, podZ: 48.6, stairX: 23, stairZ: 54.6, cheekX: 29.5, rampX0: 35.5, rampX1: 41.8,
  cellaX: 22.14, cellaZ: 34.43, colX: 27.16, colZ: 39.42, pitchX: 6.035, pitchZ: 6.065, entX: 28.04, entZ: 40.37,
  yCol: 14.35, yArch: 15.7, yFrieze: 17.3, yCorn: 17.7, yAttic: 19.0, yLean: 20.0, yEave: 24.4, yRidge: 29.8,
};

export function exchange(K) {
  const { ctx, P, M } = K, ph = ctx.physics, E = EX;
  P.push(W(0, 0).x, 0, W(0, 0).z, ROT);
  try {
    podium(P, M, E);
    cella(P, M, E);
    entablature(P, M, E);
    clerestory(P, M, E);
    // the attic sculpture groups in front of the fan windows (statues.js): east Neptune with two rivers, west Navigation with Mercury and two rivers; ~5 m on a green copper-clad base
    const sm = { main: M.sculpt, dark: M.sculptDark, accent: M.sculpt };
    for (const s of [1, -1]) { P.box(M.sculptBase, -4.7, 4.7, E.yAttic - 0.02, E.yAttic + 1.0, s > 0 ? 38.5 : -40.3, s > 0 ? 40.3 : -38.5, 'b'); exchangeGroup(s > 0 ? 0 : 1).place(P, sm, 0, E.yAttic + 1.0, s * 39.3, s > 0 ? 0 : Math.PI, 2.3); }
  } finally { P.pop(); }
  columns(K, E);

  // ---------------------------------------------------------------------------------------------- colliders
  const Y = E.podY, cz0 = E.cellaZ + 0.45, cx0 = E.cellaX + 0.45;
  walkAt(ph, 0, (cz0 + E.podZ) / 2, 2 * E.podX, E.podZ - cz0, 0, Y); walkAt(ph, 0, -(cz0 + E.podZ) / 2, 2 * E.podX, E.podZ - cz0, 0, Y);
  for (const s of [1, -1]) {
    walkAt(ph, s * (cx0 + E.podX) / 2, 0, E.podX - cx0, 2 * cz0, 0, Y);
    for (const t of [1, -1]) walkAt(ph, s * (E.stairX + E.cheekX) / 2, t * (E.podZ + E.stairZ) / 2, E.cheekX - E.stairX, E.stairZ - E.podZ, 0, Y);       // cheek blocks
    // ramps along the flanks: z 11.2 -> 33.5 (down) and -33.8 -> -10.0 (up), the landing between
    rampAt(ph, s * (E.rampX0 + E.rampX1) / 2, 22.35, E.rampX1 - E.rampX0, 22.3, 0, Y, 0, 4);
    rampAt(ph, s * (E.rampX0 + E.rampX1) / 2, -21.9, E.rampX1 - E.rampX0, 23.8, 0, 0, Y, 4);
    walkAt(ph, s * (E.rampX0 + 42.3) / 2, 0.6, 42.3 - E.rampX0, 21.2, 0, Y);
    boxAt(ph, s * 42.05, 0.6, 0.5, 67.3, 0, 0, Y + 0.45);                                   // the kerb on the outer edge of the ramps (nobody steps off the side)
    boxAt(ph, s * (E.cellaX - 0.45), 0, 0.9, 2 * E.cellaZ, 0, 0, 31);                         // cella walls
    boxAt(ph, 0, s * (E.cellaZ - 0.45), 2 * E.cellaX, 0.9, 0, 0, 31);
  }
  // the end stairs: 19 risers over 6 m (local +z of the stair box = model +z)
  { const p = W(0, (E.podZ + E.stairZ) / 2); ph.addStairs(p.x, p.z, 2 * E.stairX, E.stairZ - E.podZ, ROT, Y, 0, 19); }
  { const p = W(0, -(E.podZ + E.stairZ) / 2); ph.addStairs(p.x, p.z, 2 * E.stairX, E.stairZ - E.podZ, ROT, 0, Y, 19); }
  for (const [x, z] of K.exColumns) cylAt(ph, x, z, 0.95, Y, 16);
  K.svc.entrances.push({ ...W(0, E.cellaZ + 1.2), rotY: ROT, name: 'Биржа', closed: true }, { ...W(0, -E.cellaZ - 1.2), rotY: ROT + Math.PI, name: 'Биржа', closed: true });
}

// -------------------------------------------------------------------------------------------------- podium, stairs, ramps
function podium(P, M, E) {
  const Y = E.podY, gx = E.podX, gz = E.podZ;
  // outer faces of the main block (the middle of the end faces is hidden by the stairs: only the parts outside the cheek blocks are drawn)
  for (const s of [1, -1]) {
    wall(P, M.podium, [s * gx, -gz], [s * gx, gz], 0, Y, [s, 0]);
    for (const t of [1, -1]) {
      wall(P, M.podium, [t * E.cheekX, s * gz], [t * gx, s * gz], 0, Y, [0, s]);
      // cheek block: outer side, front, inner side above the steps (drawn whole: the steps hide its lower part), top
      const x0 = t * E.stairX, x1 = t * E.cheekX, z0 = s * gz, z1 = s * E.stairZ;
      wall(P, M.podium, [x1, z0], [x1, z1], 0, Y, [t, 0]); wall(P, M.podium, [x0, z1], [x1, z1], 0, Y, [0, s]); wall(P, M.podium, [x0, z0], [x0, z1], 0, Y, [-t, 0]);
      plate(P, M.podiumTop, Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1), Y + 0.002, { tile: 3 });
      P.box(M.granitePlain, Math.min(x0, x1) - 0.08, Math.max(x0, x1) + 0.08, Y, Y + 0.14, Math.min(z0, z1) - 0.08, Math.max(z0, z1) + 0.08, 'b');   // coping slab
    }
    // stairs: 18 treads + 19 risers of 0.158 m between the cheek blocks
    const n = 19, h = Y / n, run = (E.stairZ - gz) / n;
    for (let i = 0; i < n; i++) {
      const za = s * (gz + i * run), zb = s * (gz + (i + 1) * run), yt = Y - (i + 1) * h;
      vquad(P, M.stairs, [-E.stairX, za], [E.stairX, za], yt, yt + h, [0, s], 0, 20, 0, 0.2);
      if (i < n - 1) P.quad(M.stairs, [-E.stairX, yt, za], [E.stairX, yt, za], [E.stairX, yt, zb], [-E.stairX, yt, zb], [0, 1, 0], [[0, 0], [20, 0], [20, 0.3], [0, 0.3]]);
    }
  }
  // the terrace: a ring of dark paving around the cella at 3.0 (the cella floor is not drawn: closed)
  const cz = E.cellaZ, cx = E.cellaX;
  plate(P, M.podiumTop, -gx, gx, cz, gz, Y, { tile: 3 }); plate(P, M.podiumTop, -gx, gx, -gz, -cz, Y, { tile: 3 });
  plate(P, M.podiumTop, cx, gx, -cz, cz, Y, { tile: 3 }); plate(P, M.podiumTop, -gx, -cx, -cz, cz, Y, { tile: 3 });
  // granite edge band of the terrace (a slab course 0.5 m wide, 1 cm higher)
  for (const s of [1, -1]) { plate(P, M.granitePlain, s > 0 ? gx - 0.5 : -gx, s > 0 ? gx : -gx + 0.5, -gz, gz, Y + 0.012, { tile: 3 }); }
  // ten light wells (low glazed pyramids) on each end terrace in front of the columns
  for (const s of [1, -1]) for (let k = 0; k < 10; k++) { const x = -27.16 + k * 6.035 + 3.0; if (k === 9) continue; const z = s * 44.6; P.box(M.granitePlain, x - 0.55, x + 0.55, Y, Y + 0.12, z - 0.55, z + 0.55, 'b'); P.box(M.glass, x - 0.4, x + 0.4, Y + 0.12, Y + 0.3, z - 0.4, z + 0.4, 'b'); }
  // flank ramps (x 35.5 .. 41.8) with a low kerb on the outer edge, and the landing between them
  for (const s of [1, -1]) {
    const xa = s * E.rampX0, xb = s * E.rampX1, lo = Math.min(xa, xb), hi = Math.max(xa, xb);
    // front ramp: z 33.5 (y 0) -> 11.2 (y 3); rear ramp: z -33.8 (y 0) -> -10.0 (y 3)
    slope(P, M.settsRamp, [lo, 33.5], [hi, 33.5], 0.02, [lo, 11.2], [hi, 11.2], Y, { tile: 1.2 });
    slope(P, M.settsRamp, [hi, -33.8], [lo, -33.8], 0.02, [hi, -10.0], [lo, -10.0], Y, { tile: 1.2 });
    plate(P, M.podiumTop, lo, hi, -10.0, 11.2, Y, { tile: 3 });
    // outer side wall of ramps + landing (a trapezoid) and the kerb on it
    vpoly(P, M.podium, [xb, 0], [0, 1], [[-33.8, 0], [33.5, 0], [11.2, Y], [-10.0, Y]], [s, 0]);
    const xk0 = s > 0 ? hi : lo - 0.5, xk1 = s > 0 ? hi + 0.5 : lo;
    vpoly(P, M.granitePlain, [s > 0 ? xk1 : xk0, 0], [0, 1], [[-33.8, 0], [33.5, 0], [33.5, 0.3], [11.2, Y + 0.3], [-10.0, Y + 0.3], [-33.8, 0.3]], [s, 0]);
    vpoly(P, M.granitePlain, [s > 0 ? xk0 : xk1, 0], [0, 1], [[33.5, 0.02], [33.5, 0.3], [11.2, Y + 0.3], [11.2, Y]], [-s, 0]);
    vpoly(P, M.granitePlain, [s > 0 ? xk0 : xk1, 0], [0, 1], [[-33.8, 0.02], [-33.8, 0.3], [-10.0, Y + 0.3], [-10.0, Y]], [-s, 0]);
    P.box(M.granitePlain, xk0, xk1, Y, Y + 0.3, -10.0, 11.2, 'b');
    slope(P, M.granitePlain, [xk0, 33.5], [xk1, 33.5], 0.3, [xk0, 11.2], [xk1, 11.2], Y + 0.3, { tile: 2 });
    slope(P, M.granitePlain, [xk1, -33.8], [xk0, -33.8], 0.3, [xk1, -10.0], [xk0, -10.0], Y + 0.3, { tile: 2 });
    for (const zz of [33.5, -33.8]) vquad(P, M.granitePlain, [xk0, zz], [xk1, zz], 0, 0.3, [0, Math.sign(zz)]);
    // the podium wall behind the ramps is the main block's flank face (already drawn); the ends of the landing block
    void xa;
  }
}

// -------------------------------------------------------------------------------------------------- cella walls with the niche bays, pilasters
function cella(P, M, E) {
  const Y = E.podY, cx = E.cellaX, cz = E.cellaZ, yT = E.yArch;
  for (const s of [1, -1]) {
    // flanks: 11 bays between the 12 pilasters (z -33.36 .. 33.36), plain strips at the corners
    const zb = 5.5 * E.pitchZ;
    vquad(P, M.exBay, [s * cx, -s * zb], [s * cx, s * zb], Y, yT, [s, 0], 0, 11, 0, 1);
    for (const t of [1, -1]) wall(P, M.wall, [s * cx, t * zb], [s * cx, t * cz], Y, yT, [s, 0]);
    // ends: 7 bays between the 8 pilasters, the middle one with the door
    const xb = 3.5 * E.pitchX;
    vquad(P, M.exBay, [s * xb, s * cz], [s * 0.5 * E.pitchX, s * cz], Y, yT, [0, s], 0, 3, 0, 1);
    vquad(P, M.exBayDoor, [s * 0.5 * E.pitchX, s * cz], [-s * 0.5 * E.pitchX, s * cz], Y, yT, [0, s], 0, 1, 0, 1);
    vquad(P, M.exBay, [-s * 0.5 * E.pitchX, s * cz], [-s * xb, s * cz], Y, yT, [0, s], 0, 3, 0, 1);
    for (const t of [1, -1]) wall(P, M.wall, [t * xb, s * cz], [t * cx, s * cz], Y, yT, [0, s]);
    // door canopy (a small flat roof on two brackets) and the step
    P.box(M.white, -1.5, 1.5, Y + 3.95, Y + 4.15, s > 0 ? cz : -cz - 0.9, s > 0 ? cz + 0.9 : -cz, 'b');
    // pilasters: flanks at the column lines k = 1..12, ends k = 1..8; 1.77 m wide, 0.16 m proud, with a plain capital
    for (let k = 1; k <= 12; k++) { const z = -E.colZ + k * E.pitchZ; pilaster(P, M, s * cx, z, s, 0, Y, E.yCol); }
    for (let k = 1; k <= 8; k++) { const x = -E.colX + k * E.pitchX; pilaster(P, M, x, s * cz, 0, s, Y, E.yCol); }
  }
}
function pilaster(P, M, x, z, nx, nz, y0, y1) {
  const hw = 0.885, d = 0.16;
  const x0 = nx ? Math.min(x, x + nx * d) : x - hw, x1 = nx ? Math.max(x, x + nx * d) : x + hw, z0 = nz ? Math.min(z, z + nz * d) : z - hw, z1 = nz ? Math.max(z, z + nz * d) : z + hw;
  P.box(M.white, x0, x1, y0, y1 - 0.5, z0, z1, 'b');
  const e = 0.1; P.box(M.white, x0 - (nx ? (nx < 0 ? e : 0) : e), x1 + (nx ? (nx > 0 ? e : 0) : e), y1 - 0.5, y1, z0 - (nz ? (nz < 0 ? e : 0) : e), z1 + (nz ? (nz > 0 ? e : 0) : e), '');
}

// -------------------------------------------------------------------------------------------------- 44 instanced columns
function columns(K, E) {
  const { ctx, M } = K, Y = E.podY, H = E.yCol - Y;                       // 11.35
  const list = [];
  for (let k = 0; k < 14; k++) for (const s of [1, -1]) list.push([s * E.colX, -E.colZ + k * E.pitchZ]);
  for (let k = 1; k < 9; k++) for (const s of [1, -1]) list.push([-E.colX + k * E.pitchX, s * E.colZ]);
  K.exColumns = list;
  // one column: plinth 0.10, shaft with a slight entasis 0.88 -> 0.80, necking, echinus, abacus 2.3 m
  const prof = [[0.90, 0.10], [0.88, 0.5], [0.875, 3.6], [0.85, 7.0], [0.80, H - 0.95], [0.80, H - 0.82], [0.84, H - 0.80], [0.84, H - 0.72], [0.80, H - 0.70], [0.80, H - 0.6], [1.12, H - 0.36], [1.15, H - 0.35]];
  const shaft = latheGeo(prof, 20);
  const box = (w, h, y) => { const g = new THREE.BoxGeometry(w, h, w); g.translate(0, y + h / 2, 0); return g; };
  const parts = { list: [{ mat: M.white, geo: ctx.geo.mergeGeometries([shaft, box(2.3, 0.35, H - 0.35), box(2.05, 0.10, 0)]) }] };
  const mats = list.map(([x, z]) => { const p = W(x, z); return mat4(p.x, Y, p.z, ROT, 1); });
  const r = addInstanced(ctx, K.root, 'lmSt-exColumns', parts, mats);
  K.extraTris += r.tris;
}

// -------------------------------------------------------------------------------------------------- beams, architrave, frieze, cornice, attic, lean-to roofs
function entablature(P, M, E) {
  const ex = E.entX, ez = E.entZ, ix = ex - 1.76, iz = ez - 1.76, cx = E.cellaX, cz = E.cellaZ;
  const y0 = E.yCol, y1 = E.yArch, y2 = E.yFrieze, y3 = E.yCorn, y4 = E.yAttic;
  // ceiling beams column -> pilaster, and the flat ceiling above them
  for (let k = 1; k <= 12; k++) { const z = -E.colZ + k * E.pitchZ; for (const s of [1, -1]) P.box(M.whiteShade, Math.min(s * cx, s * ix), Math.max(s * cx, s * ix), y0, y0 + 0.9, z - 0.86, z + 0.86, 't'); }
  for (let k = 1; k <= 8; k++) { const x = -E.colX + k * E.pitchX; for (const s of [1, -1]) P.box(M.whiteShade, x - 0.86, x + 0.86, y0, y0 + 0.9, Math.min(s * cz, s * iz), Math.max(s * cz, s * iz), 't'); }
  plate(P, M.soffit, -ix, ix, cz, iz, y0 + 0.9, { up: false }); plate(P, M.soffit, -ix, ix, -iz, -cz, y0 + 0.9, { up: false });
  plate(P, M.soffit, cx, ix, -cz, cz, y0 + 0.9, { up: false }); plate(P, M.soffit, -ix, -cx, -cz, cz, y0 + 0.9, { up: false });
  for (const s of [1, -1]) {
    // architrave: outer face, soffit, inner face
    wall(P, M.white, [s * ex, -ez], [s * ex, ez], y0, y1, [s, 0]); wall(P, M.white, [-ex, s * ez], [ex, s * ez], y0, y1, [0, s]);
    wall(P, M.whiteShade, [s * ix, -iz], [s * ix, iz], y0, y0 + 0.9, [-s, 0]); wall(P, M.whiteShade, [-ix, s * iz], [ix, s * iz], y0, y0 + 0.9, [0, -s]);
    plate(P, M.soffit, Math.min(s * ix, s * ex), Math.max(s * ix, s * ex), -ez, ez, y0, { up: false });
    plate(P, M.soffit, -ix, ix, Math.min(s * iz, s * ez), Math.max(s * iz, s * ez), y0, { up: false });
    // frieze: two triglyphs per intercolumniation (tile = half a bay), a triglyph over every column axis
    const nz = 3 * 13, nx = 3 * 9, zc = E.colZ, xc = E.colX;
    vquad(P, M.trig, [s * ex, -s * zc], [s * ex, s * zc], y1, y2, [s, 0], 0, nz, 0, 1); vquad(P, M.trig, [-s * xc, s * ez], [s * xc, s * ez], y1, y2, [0, s], 0, nx, 0, 1);
    for (const t of [1, -1]) { wall(P, M.white, [s * ex, t * zc], [s * ex, t * ez], y1, y2, [s, 0]); wall(P, M.white, [t * xc, s * ez], [t * ex, s * ez], y1, y2, [0, s]); }
    // cornice: projecting slab with the mutule soffit
    const px = ex + 1.33, pz = ez + 1.33;
    wall(P, M.white, [s * px, -pz], [s * px, pz], y2 + 0.05, y3, [s, 0]); wall(P, M.white, [-px, s * pz], [px, s * pz], y2 + 0.05, y3, [0, s]);
    P.quad(M.dent, [s * ex, y2 + 0.05, -pz], [s * px, y2 + 0.05, -pz], [s * px, y2 + 0.05, pz], [s * ex, y2 + 0.05, pz], [0, -1, 0], [[0, 0], [1, 0], [1, 2 * pz], [0, 2 * pz]]);
    P.quad(M.dent, [-ex, y2 + 0.05, s * ez], [-ex, y2 + 0.05, s * pz], [ex, y2 + 0.05, s * pz], [ex, y2 + 0.05, s * ez], [0, -1, 0], [[0, 0], [1, 0], [1, 2 * ex], [0, 2 * ex]]);
    plate(P, M.white, Math.min(s * (ex - 0.9), s * px), Math.max(s * (ex - 0.9), s * px), -pz, pz, y3, {}); plate(P, M.white, -ex, ex, Math.min(s * (ez - 0.9), s * pz), Math.max(s * (ez - 0.9), s * pz), y3 - 0.004, {});
    // attic: a plain parapet band 17.7 .. 19.0, 0.9 m thick
    wall(P, M.white, [s * ex, -ez], [s * ex, ez], y3, y4, [s, 0]); wall(P, M.white, [-ex, s * ez], [ex, s * ez], y3, y4, [0, s]);
    plate(P, M.whiteShade, Math.min(s * (ex - 0.9), s * ex), Math.max(s * (ex - 0.9), s * ex), -ez, ez, y4, {}); plate(P, M.whiteShade, -ex + 0.9, ex - 0.9, Math.min(s * (ez - 0.9), s * ez), Math.max(s * (ez - 0.9), s * ez), y4 - 0.004, {});
    wall(P, M.whiteShade, [s * (ex - 0.9), -ez + 0.9], [s * (ex - 0.9), ez - 0.9], y4 - 0.6, y4, [-s, 0]); wall(P, M.whiteShade, [-ex + 0.9, s * (ez - 0.9)], [ex - 0.9, s * (ez - 0.9)], y4 - 0.6, y4, [0, -s]);
    // lean-to roofs of the colonnade: from 18.4 behind the attic up to 20.0 at the clerestory wall, mitred at the corners
    const ax = ex - 0.9, az = ez - 0.9, yl = y4 - 0.6, yh = E.yLean;
    P.quad(M.roof, [s * ax, yl, -az], [s * ax, yl, az], [s * cx, yh, cz], [s * cx, yh, -cz], [s * 0.3, 1, 0], [[0, 0], [2 * az / 0.6, 0], [(az + cz) / 0.6, 9], [(az - cz) / 0.6, 9]]);
    P.quad(M.roof, [-ax, yl, s * az], [ax, yl, s * az], [cx, yh, s * cz], [-cx, yh, s * cz], [0, 1, s * 0.3], [[0, 0], [2 * ax / 0.6, 0], [(ax + cx) / 0.6, 9], [(ax - cx) / 0.6, 9]]);
  }
}

// -------------------------------------------------------------------------------------------------- clerestory, gables with the fan windows, roof, lantern
function clerestory(P, M, E) {
  const cx = E.cellaX, cz = E.cellaZ, y0 = E.yArch, ye = E.yEave, yr = E.yRidge, sl = (yr - ye) / cx;
  for (const s of [1, -1]) {
    // flanks: plain to 19.2, the window band 19.2 .. 23.7 (11 modules: small, small, big, small, small, big ... as the OSM model), plain to the eaves
    wall(P, M.wall, [s * cx, -cz], [s * cx, cz], y0, 19.2, [s, 0]); wall(P, M.wall, [s * cx, -cz], [s * cx, cz], 23.7, ye, [s, 0]);
    for (let m = -5; m <= 5; m++) { const big = m % 3 === 0, z0 = (m - 0.5) * E.pitchZ, z1 = (m + 0.5) * E.pitchZ, u = big ? 1 / 3 : 0; vquad(P, M.lun, [s * cx, z0], [s * cx, z1], 19.2, 23.7, [s, 0], u, u + 1 / 3, 0, 1); }
    for (const t of [1, -1]) vquad(P, M.lun, [s * cx, t * 5.5 * E.pitchZ], [s * cx, t * cz], 19.2, 23.7, [s, 0], 0.7, 0.72, 0, 1);
    // eaves cornice
    P.box(M.white, s > 0 ? cx : -cx - 0.66, s > 0 ? cx + 0.66 : -cx, ye - 0.7, ye - 0.22, -cz - 0.66, cz + 0.66, 't');
    // gable end: plain below 18.6, then the pentagon with the fan texture (x -20 .. 20 -> u 0..1, y 18.6 .. 30.6 -> v 0..1)
    wall(P, M.wall, [-cx, s * cz], [cx, s * cz], y0, 18.6, [0, s]);
    vpoly(P, M.fan, [0, s * cz], [1, 0], [[-cx, 18.6], [cx, 18.6], [cx, ye], [0, yr], [-cx, ye]], [0, s], (x, y) => [(x + 20) / 40, (y - 18.6) / 12]);
    // raking cornices (white, 0.5 m deep, projecting 0.7 m) and the quoins of the corners
    for (const t of [1, -1]) {
      const zf = s * (cz + 0.7), zb = s * cz, xe = t * (cx + 0.7), yb = ye - 0.7 * sl;
      P.quad(M.white, [xe, yb - 0.5, zf], [0, yr - 0.5, zf], [0, yr + 0.06, zf], [xe, yb + 0.06, zf], [0, 0, s]);                 // front face of the rake
      P.quad(M.dent, [xe, yb - 0.5, zb], [0, yr - 0.5, zb], [0, yr - 0.5, zf], [xe, yb - 0.5, zf], [0, -1, 0], [[0, 0], [24, 0], [24, 1], [0, 1]]);   // soffit with modillions
      P.box(M.white, t > 0 ? cx - 1.1 : -cx - 0.12, t > 0 ? cx + 0.12 : -cx + 1.1, 19.0, ye - 0.45, s > 0 ? cz : -cz - 0.12, s > 0 ? cz + 0.12 : -cz, 'b');
      P.box(M.white, t > 0 ? cx : -cx - 0.12, t > 0 ? cx + 0.12 : -cx, 19.0, ye - 0.45, s > 0 ? cz - 1.1 : -cz, s > 0 ? cz : -cz + 1.1, 'b');
    }
    // roof slope (overhang 0.7), split into cells
    const ox = cx + 0.7, oz = cz + 0.7, yo = ye - 0.7 * sl + 0.06;
    slope(P, M.roof, [s * ox, -s * oz], [s * ox, s * oz], yo, [0, -s * oz], [0, s * oz], yr + 0.06, { tile: 0.6, n: [s * sl, 1, 0] });
  }
  // the lantern on the ridge: a glazed box with a hipped roof (OSM 28.7 .. 31.9)
  const lx = 4.6, lz = 6.2, yb = yr - lx * sl - 0.1, yt = 30.5;
  for (const s of [1, -1]) { wall(P, M.glass, [s * lx, -lz], [s * lx, lz], yb, yt, [s, 0]); vpoly(P, M.glass, [0, s * lz], [1, 0], [[-lx, yb], [lx, yb], [lx, yt], [-lx, yt]], [0, s]); }
  for (const s of [1, -1]) {
    P.fan(M.roof, [[s * (lx + 0.3), yt, -lz - 0.3], [s * (lx + 0.3), yt, lz + 0.3], [0, 31.9, lz - lx], [0, 31.9, -lz + lx]], [s * 0.35, 1, 0], (p) => [p[2] / 0.6, p[0] / 0.6]);
    P.fan(M.roof, [[-lx - 0.3, yt, s * (lz + 0.3)], [lx + 0.3, yt, s * (lz + 0.3)], [0, 31.9, s * (lz - lx)]], [0, 1, s * 0.35], (p) => [p[0] / 0.6, p[2] / 0.6]);
  }
  for (const [x, z] of [[lx, lz], [-lx, lz], [lx, -lz], [-lx, -lz]]) P.box(M.white, x - 0.2, x + 0.2, yb, yt, z - 0.2, z + 0.2, 'b');
  // a brick chimney on the south slope (ex_09)
  P.box(M.chimney, -9.2, -8.2, yr - 9.2 * sl - 0.2, yr + 0.9, 14, 15, 'b');
}
