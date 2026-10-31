// landmarksYelaginServices/houses.js - the five service houses of the Rossi court (dossier 6.5 - 6.9, photos misc_10 misc_11 misc_12 misc_13 misc_14 misc_16 misc_17): the STONE STOREROOMS (Каменные кладовые, 4 литЗ: two-storey
// peach-ochre plaster, white trim, a projecting central bay of three axes, green zinc hipped roof with two half-round dormers), the FRAULEIN house (Фрейлинский корпус, 4 литЛ: two clapboard wings joined by a one-storey
// entrance range with an iron canopy), the CAVALIER / HOFFURIER house (Кавалерский корпус, 4 литК: three storeys, rusticated ground floor, flat roof with an iron railing), the house of the gardener BUK (4 литГ: three storeys,
// cream clapboard, doors in both gables) and the GLASS-BLOWING workshop (4 литИ: a one-storey plain building).  Every house is drawn in its own frame turned to the OSM footprint (local x right, z out of the main front).
import { frameFacing, toWorld } from './frame.js';
import { stage, WD, onSide, rect, arch, panel, gable, hip, chimney, roofRail, canopy } from './wall.js';
import { cornice as stepCornice } from './facade.js';

const FR = {
  storeroom: frameFacing(-4907, -5335, 0.344, -0.939),
  fraulein: frameFacing(-4955, -5337, -0.35, 0.937),
  cavalier: frameFacing(-4902.65, -5380, 0, -1),
  gardener: { x: -4694.7, z: -5440.2, rot: 3.38 * Math.PI / 180 },
  workshop: frameFacing(-4885, -5348, 0, 1),
};
const centers = (n, pitch, c = 0) => Array.from({ length: n }, (_, i) => c + (i - (n - 1) / 2) * pitch);
const inFrame = (K, F, fn) => { K.P.push(F.x, 0, F.z, F.rot); try { fn(); } finally { K.P.pop(); } };

/** the four walls of a rectangle: spec[face] = { holes (face coords), deco(len, a, b) }, mat / yTop / y0 for the panel, plinth = stone band height.  F and B run full width, R and L are trimmed by WD (a, b) */
function walls(K, r, o) {
  const P = K.P, M = K.M;
  for (const name of ['F', 'R', 'B', 'L']) {
    const s = o.faces[name]; if (!s) continue;
    onSide(K, r, name, (len) => {
      const a = (name === 'F' || name === 'B') ? -len / 2 : -len / 2 + WD, b = (name === 'F' || name === 'B') ? len / 2 : len / 2 - WD;
      const aa = s.a ?? a, bb = s.b ?? b;
      if (o.lower) { panel(K, o.lower.mat, aa, bb, 0, o.lower.top, s.low || [], { uvs: o.lower.uvs ?? 3 }); panel(K, o.mat, aa, bb, o.lower.top, o.yTop, s.holes || [], { uvs: o.uvs ?? 1 }); }
      else panel(K, o.mat, aa, bb, 0, o.yTop, s.holes || [], { uvs: o.uvs ?? 3 });
      if (o.plinth) P.box(M.ashlar, aa, bb, 0, o.plinth, 0, 0.1, 'kb', 1.8);
      if (o.string) P.box(M.white, aa, bb, o.string, o.string + 0.2, 0, 0.12, 'k', 3);
      if (o.cornice) { const pr = o.cornice.proj ?? 0.55, fb = name === 'F' || name === 'B'; stepCornice(P, M.white, fb ? a - pr : -len / 2, fb ? b + pr : len / 2, o.yTop - o.cornice.h, o.yTop, { p1: 0.15, p2: 0.3, p3: pr }); }
      if (s.deco) s.deco(len, aa, bb);
    });
  }
}
const win = (cx, y0, w = 1.2, h = 1.8, cornice = false, mat = 'winWhite') => ({ ...rect(cx, y0, w, h, mat, 0.12), cornice });
const dormerFan = (K, x, z, y, w = 1.6) => {       // a small dormer with a half-round window on a hipped roof: front panel + little roof
  const P = K.P, M = K.M;
  P.push(x, 0, z, 0);
  panel(K, M.white, -w / 2 - 0.2, w / 2 + 0.2, y, y + 1.55, [{ ...arch(0, y + 0.25, w, 1.15, 'fan'), sw: 0.14 }]);
  gable(P, M, -w / 2 - 0.3, w / 2 + 0.3, y + 1.55, 0.6, -1.6, 0, { alongZ: true, ov: 0.1, ends: true, end0: false, end1: false, mat: M.zinc });
  P.pop();
};

// ------------------------------------------------------------------------------------------------ stone storerooms
function storerooms(K) {
  const P = K.P, M = K.M, main = { x0: -17.05, x1: 16.45, z0: -4.6, z1: 4.5 }, bay = { x0: -2.7, x1: 3.6, z0: 4.5, z1: 8.15 }, H = 8.0, xc = (main.x0 + main.x1) / 2;
  inFrame(K, FR.storeroom, () => {
    const fx = (xa) => xa - xc;                                                               // absolute local x -> face x of the main front
    const front = [-13.9, -9.9, -5.9, 6.4, 10.4, 14.4];
    walls(K, main, {
      mat: M.ochre, yTop: H, uvs: 3, plinth: 0.7, string: 3.85, cornice: { h: 0.6 },
      faces: {
        R: { holes: [-2.5, 2.5].flatMap((x) => [win(x, 1.0, 1.3, 1.5, true), win(x, 4.5, 1.2, 2.1)]) },
        L: { holes: [-2.5, 2.5].flatMap((x) => [win(x, 1.0, 1.3, 1.5, true), win(x, 4.5, 1.2, 2.1)]) },
        B: { holes: centers(7, 4.6, 0).flatMap((x) => [win(x, 1.0, 1.3, 1.5, true), win(x, 4.5, 1.2, 2.1)]) },
      },
    });
    void front; void fx;
  });
  // the front (z = 4.5) in two panels either side of the bay: drawn by hand
  inFrame(K, FR.storeroom, () => {
    // misc_10: each wing of the front has a TRIPLET (a wide window between two narrow ones, a small pediment over the middle one of the upper floor) at the outer end and ONE window between the triplet and the bay
    for (const [a, b, xs] of [[main.x0, bay.x0, [-12.45, -6.35]], [bay.x1, main.x1, [5.75, 11.85]]]) {
      P.push((a + b) / 2, 0, main.z1, 0);
      const w = b - a, trip = a < 0 ? 0 : 1;
      const holes = xs.flatMap((x, i) => {
        const cx = x - (a + b) / 2;
        if (i !== trip) return [win(cx, 1.0, 1.3, 1.5, false), win(cx, 4.5, 1.2, 2.1, false)];
        return [-1.5, 0, 1.5].flatMap((d) => { const ww = d === 0 ? 1.4 : 0.9; return [win(cx + d, 1.0, ww, 1.5, false), win(cx + d, 4.5, ww, 2.1, false)]; });
      });
      panel(K, M.ochre, -w / 2, w / 2, 0, H, holes, { uvs: 3 });
      P.box(M.ashlar, -w / 2, w / 2, 0, 0.7, 0, 0.1, 'kb', 1.8); P.box(M.white, -w / 2, w / 2, 3.85, 4.05, 0, 0.12, 'k', 3);
      stepCornice(P, M.white, -w / 2 - (a < 0 ? 0.55 : 0.0), w / 2 + (a < 0 ? 0.0 : 0.55), H - 0.6, H, { p1: 0.15, p2: 0.3, p3: 0.55 });
      // the pedimented casings of the outer windows (misc_10): a small triangular pediment over the end window of each part
      const ox = xs[trip] - (a + b) / 2;
      P.fan(M.white, [[ox - 1.0, 4.5 + 2.1 + 0.3, 0.08], [ox + 1.0, 4.5 + 2.1 + 0.3, 0.08], [ox, 4.5 + 2.1 + 0.85, 0.08]], [0, 0, 1], (p) => [p[0], p[1]]);
      P.pop();
    }
    // the projecting central bay: its own front, sides, cornice and flat roof
    onSide(K, bay, 'F', (len) => {
      panel(K, M.ochre, -len / 2, len / 2, 0, H + 0.9, [win(0, 1.0, 1.3, 1.5, true), win(0, 4.5, 1.3, 2.1)]);
      P.box(M.ashlar, -len / 2, len / 2, 0, 0.7, 0, 0.1, 'kb', 1.8); P.box(M.white, -len / 2, len / 2, 3.85, 4.05, 0, 0.12, 'k', 3);
      stepCornice(P, M.white, -len / 2 - 0.55, len / 2 + 0.55, H + 0.3, H + 0.9, { p1: 0.15, p2: 0.3, p3: 0.55 });
    });
    for (const name of ['R', 'L']) onSide(K, bay, name, (len) => {
      panel(K, M.ochre, -len / 2 + WD, len / 2, 0, H + 0.9, []); P.box(M.ashlar, -len / 2 + WD, len / 2, 0, 0.7, 0, 0.1, 'kb', 1.8);
      stepCornice(P, M.white, -len / 2 + 0.55, len / 2, H + 0.3, H + 0.9, { p1: 0.15, p2: 0.3, p3: 0.55 });
    });
    P.cap(M.zincG, [[bay.x0 - 0.5, bay.z0], [bay.x1 + 0.5, bay.z0], [bay.x1 + 0.5, bay.z1 + 0.55], [bay.x0 - 0.5, bay.z1 + 0.55]], H + 0.88, true, 1.2);
    // the green hipped roof, two half-round dormers on the front slope, three chimneys
    hip(P, M, main.x0, main.x1, main.z0, main.z1, H, 2.4, { ov: 0.5, mat: M.zincG });
    for (const x of [-9.9, 10.4]) dormerFan(K, x, 2.6, 8.7, 1.5);
    for (const x of [-8.0, 0.0, 8.0]) chimney(P, M, x, -0.8, H + 1.6, H + 3.6);
    for (const x of [-8.9, 8.2]) P.cyl(M.shade, [x, 0.7, 4.66], [x, H - 0.6, 4.66], 0.06, 0.06, 6, false);
  });
}

// ------------------------------------------------------------------------------------------------ Fraulein house
function fraulein(K) {
  const P = K.P, M = K.M, wR = { x0: 4.3, x1: 14.7, z0: -7.5, z1: 17.15 }, wL = { x0: -14.1, x1: -4.45, z0: -7.3, z1: 17.7 }, link = { x0: -4.4, x1: 4.3, z0: -0.3, z1: 10.95 }, H = 7.4, HL = 3.7;
  inFrame(K, FR.fraulein, () => {
    for (const w of [wR, wL]) {
      const long = w.z1 - w.z0, nb = 5;
      walls(K, w, {
        mat: M.clapGrey, yTop: H, uvs: 1, plinth: 0.9, string: 4.3, cornice: { h: 0.5 },
        faces: {
          F: { holes: centers(3, 3.2).flatMap((x) => [win(x, 1.5, 1.2, 1.8, true), win(x, 4.95, 1.2, 1.8)]) },
          B: { holes: centers(3, 3.2).flatMap((x) => [win(x, 1.5, 1.2, 1.8, true), win(x, 4.95, 1.2, 1.8)]) },
          R: { holes: centers(nb, long / nb).flatMap((x) => [win(x, 1.5, 1.2, 1.8, true), win(x, 4.95, 1.2, 1.8)]) },
          L: { holes: centers(nb, long / nb).flatMap((x) => [win(x, 1.5, 1.2, 1.8, true), win(x, 4.95, 1.2, 1.8)]) },
        },
      });
      hip(P, M, w.x0, w.x1, w.z0, w.z1, H, 2.6, { ov: 0.45, mat: M.zinc });
      chimney(P, M, (w.x0 + w.x1) / 2, (w.z0 + w.z1) / 2 + 1.5, H + 1.7, H + 3.7);
    }
    // the entrance range: one storey, hipped roof, two fan dormers, the door with an iron canopy and granite steps
    walls(K, link, {
      mat: M.clapGrey, yTop: HL, uvs: 1, plinth: 0.9, cornice: { h: 0.4 },
      faces: {
        F: { holes: [win(-3.0, 1.5, 1.2, 1.8, true), win(3.0, 1.5, 1.2, 1.8, true), { x0: -0.9, x1: 0.9, y0: 0.9, y1: 3.2, mat: 'door', sill: 0 }] },
        B: { holes: [win(-2.0, 1.5, 1.2, 1.8, true), win(2.0, 1.5, 1.2, 1.8, true)] },
      },
    });
    hip(P, M, link.x0, link.x1, link.z0, link.z1, HL, 1.6, { ov: 0.4, mat: M.zinc });
    const zf = link.z1;
    for (const x of [-1.8, 1.8]) dormerFan(K, x, zf - 0.8, HL + 0.55, 1.3);
    for (let k = 1; k <= 4; k++) P.box(M.ashlar, -1.3, 1.3, 0, 0.9 * k / 4, zf + (4 - k) * 0.3 - 0.3 + 0.3, zf + (4 - k) * 0.3 + 0.3, 'bk', 1.8);
    canopy(P, M, -1.5, 1.5, zf + 0.0, zf + 1.6, 3.55, 3.2, true);
    chimney(P, M, 0, 5, HL + 1.0, HL + 2.8);
  });
}

// ------------------------------------------------------------------------------------------------ Cavalier house and Gardener Buk's house (three storeys, rusticated ground floor)
function threeStorey(K, F, r, o) {
  const P = K.P, M = K.M, H = o.H, hg = 4.1;
  inFrame(K, F, () => {
    const lw = (len, door) => { let n = Math.round(len / o.pitch); if (door && n % 2 === 0) n += 1; return centers(n, len / n, 0); };
    const faceSpec = (len, door, off = 0) => {
      const cs = lw(len, door).map((x) => x + off);
      return {
        low: cs.flatMap((x) => (door && Math.abs(x - (o.doorX ?? 0)) < 0.9) ? [{ x0: x - 0.9, x1: x + 0.9, y0: 0.0, y1: 2.9, mat: 'door', sill: 0 }] : [{ ...win(x, 1.0, 1.2, 2.2, true) }]),
        holes: cs.flatMap((x) => [win(x, 5.0, 1.2, 2.2, true), win(x, 8.3, 1.2, 1.7, false)]),
      };
    };
    const faces = {}; for (const name of ['F', 'R', 'B', 'L']) { const len = (name === 'F' || name === 'B') ? r.x1 - r.x0 : r.z1 - r.z0; faces[name] = faceSpec(len, o.doors.includes(name)); }
    walls(K, r, { mat: o.mat, yTop: H, uvs: 1, lower: { mat: M.rust, top: hg, uvs: 3 }, string: hg, cornice: { h: 0.65 }, faces, plinth: 0.45 });
    P.cap(M.zinc, [[r.x0 - 0.6, r.z0 - 0.6], [r.x1 + 0.6, r.z0 - 0.6], [r.x1 + 0.6, r.z1 + 0.6], [r.x0 - 0.6, r.z1 + 0.6]], H + 0.02, true, 1.2);
    roofRail(P, M, r.x0 - 0.3, r.x1 + 0.3, r.z0 - 0.3, r.z1 + 0.3, H + 0.05, 0.9);
    for (const [x, z] of o.chimneys) chimney(P, M, x, z, H, H + 2.2);
    if (o.extra) o.extra();
  });
}
function cavalier(K) {
  const P = K.P, M = K.M, r = { x0: -9.65, x1: 9.85, z0: -11.7, z1: 11.45 };
  threeStorey(K, FR.cavalier, r, {
    H: 11.2, mat: M.clapCream, pitch: 3.6, doors: ['F'], doorX: 0, chimneys: [[-5, -1], [4, 4]],
    extra: () => {            // the porch: a stone vestibule with four steps and an iron canopy
      const z1 = r.z1;
      for (let k = 1; k <= 4; k++) P.box(M.ashlar, -2.1, 2.3, 0, 0.9 * k / 4, z1 + (4 - k) * 0.4, z1 + (4 - k) * 0.4 + 0.4, 'bk', 1.8);
      canopy(P, M, -2.2, 2.4, z1 + 0.0, z1 + 1.95, 4.0, 3.6, true);
    },
  });
}
function gardener(K) {
  const r = { x0: -11.85, x1: 11.85, z0: -8.75, z1: 8.75 };
  threeStorey(K, FR.gardener, r, { H: 11.0, mat: K.M.clapCream, pitch: 4.2, doors: ['R', 'L'], doorX: 0, chimneys: [[-6, -2], [0, 2], [6, -2]] });
}

// ------------------------------------------------------------------------------------------------ glass-blowing workshop
function workshop(K) {
  const P = K.P, M = K.M, r = { x0: -4.5, x1: 4.5, z0: -10.9, z1: 11.4 }, H = 3.7;
  inFrame(K, FR.workshop, () => {
    walls(K, r, {
      mat: M.white, yTop: H, uvs: 3, plinth: 0.6, cornice: { h: 0.4 },
      faces: {
        F: { holes: [win(-2.2, 1.0, 1.2, 1.7, true), { x0: -0.5, x1: 1.3, y0: 0.0, y1: 2.5, mat: 'door', sill: 0 }, win(2.9, 1.0, 1.2, 1.7, true)] },
        B: { holes: [win(0, 1.0, 1.2, 1.7, true)] },
        R: { holes: centers(4, 5.2).map((x) => win(x, 1.0, 1.2, 1.7, true)) },
        L: { holes: centers(4, 5.2).map((x) => win(x, 1.0, 1.2, 1.7, true)) },
      },
    });
    gable(P, M, r.x0, r.x1, H, 1.9, r.z0, r.z1, { alongZ: true, ov: 0.35, ends: true });
    chimney(P, M, 1.5, 3.0, H + 1.2, H + 2.9, 0.7, 0.7);
  });
}

// ------------------------------------------------------------------------------------------------ colliders and services
function walk(K) {
  const ph = K.ctx.physics; if (!ph) return;
  const box = (F, r, y1) => { const p = toWorld(F, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2); ph.addBox(p.x, p.z, r.x1 - r.x0, r.z1 - r.z0, F.rot, 0, y1); };
  box(FR.storeroom, { x0: -17.05, x1: 16.45, z0: -4.6, z1: 4.5 }, 10.5); box(FR.storeroom, { x0: -2.7, x1: 3.6, z0: 4.5, z1: 8.15 }, 9.2);
  box(FR.fraulein, { x0: 4.3, x1: 14.7, z0: -7.5, z1: 17.15 }, 10.5); box(FR.fraulein, { x0: -14.1, x1: -4.45, z0: -7.3, z1: 17.7 }, 10.5); box(FR.fraulein, { x0: -4.4, x1: 4.3, z0: -0.3, z1: 10.95 }, 5.2);
  box(FR.cavalier, { x0: -9.65, x1: 9.85, z0: -11.7, z1: 11.45 }, 11.5); box(FR.gardener, { x0: -11.85, x1: 11.85, z0: -8.75, z1: 8.75 }, 11.3); box(FR.workshop, { x0: -4.5, x1: 4.5, z0: -10.9, z1: 11.4 }, 5.7);
  const m = (F, id, name, x, z, h) => { const p = toWorld(F, x, z); K.svc.monuments.push({ id, name, x: p.x, z: p.z, h }); };
  m(FR.storeroom, 'w181423911', 'Каменные кладовые', 0, 0, 10.4); m(FR.fraulein, 'w100820382', 'Фрейлинский корпус', 0, 6, 10.0); m(FR.cavalier, 'w181423910', 'Кавалерский корпус', 0, 0, 11.2);
  m(FR.gardener, 'w181423909', 'Дом садовника Бука', 0, 0, 11.0); m(FR.workshop, 'w181423904', 'Стеклодувная мастерская', 0, 0, 5.6);
  const e = toWorld(FR.storeroom, 0.4, 9.2); K.svc.entrances.push({ x: e.x, z: e.z, rotY: FR.storeroom.rot + Math.PI, bldg: 'w181423911' });
  const f = toWorld(FR.fraulein, 0, 12.4); K.svc.entrances.push({ x: f.x, z: f.z, rotY: FR.fraulein.rot + Math.PI, bldg: 'w100820382' });
}

export function build(K) {
  stage(K, 'houses/storerooms', () => storerooms(K));
  stage(K, 'houses/fraulein', () => fraulein(K));
  stage(K, 'houses/cavalier', () => cavalier(K));
  stage(K, 'houses/gardener', () => gardener(K));
  stage(K, 'houses/workshop', () => workshop(K));
  stage(K, 'houses/walk', () => walk(K));
  if (K.errs) throw new Error(K.errs.join('\n'));
}
