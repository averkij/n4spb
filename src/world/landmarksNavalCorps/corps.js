// landmarksNavalCorps/corps.js - the NAVAL CADET CORPS (Морской кадетский корпус, Lt Schmidt emb. 17; F. I. Volkov 1796-98; OSM r1242815 with its parts w818073724 / 25 / 27): the shell.
// Dossier docs/research/navalcorps.md section 4, photos refs/navalcorps a07 (the frontal reading) a01 a02 a04 a05 a06 a26 a27.
//   RING     the baked ring minus its five courtyards, extruded to the cornice crown 13.3 m (the generic city drew a 9.9 m block there): every outer edge gets the stepped cornice; the river front, the
//            12th-line wall (159 m, 49 bays) and the 11th-line wall (80 m, 24 bays) are real windowed walls (windowWall: reveals, sashes, hoods), the other outer faces and the courtyard faces use the
//            one-bay texture `tile`.  The roof is a zinc cap with the hip roof of the front range (ridge 15.9 m); the pavilion risalits project 0.5 m.
//   FRONT    plinth, rusticated ground floor (windows 1.2 x 2.15 with console brackets under the string course), first floor with the hoods, small top floor, belts, the cornice, downpipes, the two doors with
//            balconies (west 8.0 m / east 7.8 m, stone balustrade on corbels), the memorial plaques with the real OSM wording and the clock.
//   The colonnade, the pavilion attics with the flat domes, the turret and the skyline behind are in colonnade.js and top.js.  No flags, no flagpoles (the turret mast is omitted).
import * as THREE from 'three';
import * as L from '../layout.js';
import { K, HT, WIN, BAYS, DOORS, PAV_W, PAV_E, COL, CENTRAL, polyWorld } from './frame.js';
import { ringEdges, band, frameOf, onEdge, localOnEdge } from './kit.js';
import { windowWall, hood, corniceBox, pipe } from './facade.js';
import { pairs } from './surfaces.js';
import { addPolyColliders } from '../lib/massing.js';

const U_END = 135.9;
export const PLAQUES = [
  [7.8, 'Здесь учились выдающиеся русские флотоводцы: адмирал Спиридов Григорий Андреевич с 1725 по 1732 г.г., адмирал Ушаков Федор Федорович с 1761 по 1766 г., адмирал Сенявин Дмитрий Николаевич, адмирал Нахимов Павел Степанович, адмирал Бутаков Григорий Иванович'],
  [10.7, 'Здесь учились выдающиеся деятели науки: с 1814 по 1819 г.г. Даль Владимир Иванович, с 1838 по 1842 г.г. Можайский Александр Федорович, с 1873 по 1877 г.г. Шокальский Юлий Михайлович, с 1878 по 1884 г.г. Крылов Алексей Николаевич'],
  [35.7, 'Здесь учились видные советские адмиралы: адмирал Галлер Лев Михайлович с 1902 по 1905 г., адмирал Левченко Гордей Иванович с 1918 по 1922 г., адмирал Алафузов Владимир Антонович с 1921 по 1925 г., адмирал Владимирский Лев Анатольевич с 1921 по 1925 г.'],
  [38.9, 'Здесь учились видные советские адмиралы: адмирал флота Советского Союза Кузнецов Николай Герасимович с 1922 по 1926 г., адмирал Трибуц Владимир Филиппович с 1922 по 1926 г., адмирал Октябрьский Филипп Сергеевич, адмирал флота Лобов Семен Михайлович'],
  [66.5, 'В этом здании 8 (21) мая 1917 года на общегородском собрании Петроградской партийной организации выступал Владимир Ильич Ленин с докладом об итогах седьмой (Апрельской) Всероссийской конференции РСДРП(б)', true],
  [88.7, 'Здесь учился и в 1860 году окончил полный курс Морского кадетского корпуса Василий Васильевич Верещагин, великий русский художник'],
  [124.4, 'Здесь учились выдающиеся советские флотоводцы: адмирал Головко Арсений Григорьевич с 1925 по 1928 г.г., адмирал Зозуля Федор Владимирович с 1925 по 1928 г.г., адмирал Фокин Виталий Алексеевич с 1924 по 1927 г.г., вице-адмирал Дрозд Валентин Петрович ...'],
  [128.3, 'Здесь учились выдающиеся мореплаватели: с 1785 по 1788 г.г. Крузенштерн Иван Федорович, с 1783 по 1788 г.г. Лисянский Юрий Федорович, с 1789 по 1797 г.г. Беллинсгаузен Фаддей Фаддеевич, с 1800 по 1808 г.г. Лазарев Михаил Петрович, ...'],
];
export const PIPES_X = [4.5, 14.4, 20.2, 27.9, 33.5, 52.0, 80.0, 102.0, 117.8, 134.5];

/** window openings of the three floors at the axes xs (wall-local x) */
export function openingsFor(M, xs, o = {}) {
  const ops = [];
  for (const x of xs) {
    if (o.door && o.door.includes(x)) { ops.push({ x, w: 2.2, y0: 0, y1: 3.25, kind: 'door', glass: x < 60 ? M.doorW : M.doorE }); }
    else if (!o.noGF) ops.push({ x, w: WIN.gf[2], y0: WIN.gf[0], y1: WIN.gf[1], glass: M.winGF });
    ops.push({ x, w: WIN.f1[2], y0: WIN.f1[0], y1: WIN.f1[1], glass: M.winF1 });
    if (!(o.blindTF && o.blindTF.includes(x))) ops.push({ x, w: WIN.tf[2], y0: WIN.tf[0], y1: WIN.tf[1], glass: M.winTF });
  }
  return ops;
}

/** furniture of a windowed wall piece in the current frame: plinth, string course, belt, sills, brackets, hoods; x0..x1, z0 = wall plane */
export function trims(P, M, xs, x0, x1, z0, o = {}) {
  const door = o.door || [];
  // plinth (granite), broken at the doors
  if (!o.noPlinth) {
  let a = x0; const brk = door.map((d) => [d - 1.35, d + 1.35]).filter(([p, q]) => q > x0 && p < x1);
  for (const [p, q] of brk) { if (p > a) P.box(M.plinth, a, p, 0, HT.plinth, z0, z0 + 0.08, 'b', 2); a = q; }
  if (x1 > a) P.box(M.plinth, a, x1, 0, HT.plinth, z0, z0 + 0.08, 'b', 2);
  }
  if (!o.noStr) P.box(M.trim, x0, x1, HT.str0, HT.str1, z0, z0 + 0.14, 'bk', 2);          // string course (the colonnade shelf replaces it in the central block)
  P.box(M.trim, x0, x1, HT.belt0, HT.belt1, z0, z0 + 0.1, 'bk', 2);                      // belt course
  for (const x of xs) {
    const gfDoor = door.includes(x);
    if (!gfDoor) {
      P.box(M.trim, x - 0.7, x + 0.7, WIN.gf[0] - 0.12, WIN.gf[0], z0, z0 + 0.12, 'bk', 1);                           // sill
      P.box(M.trim, x - 0.15, x + 0.15, 3.72, HT.str0, z0, z0 + 0.1, 'bk', 1);                                        // console bracket
      if (!o.pav) P.quad(M.grille, [x - 0.6, WIN.gf[0], z0 - 0.04], [x + 0.6, WIN.gf[0], z0 - 0.04], [x + 0.6, WIN.gf[1], z0 - 0.04], [x - 0.6, WIN.gf[1], z0 - 0.04], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);   // iron grille (none in the pavilions)
    }
    P.box(M.trim, x - 0.7, x + 0.7, WIN.f1[0] - 0.12, WIN.f1[0], z0, z0 + 0.12, 'bk', 1);
    hood(P, M.trim, x, WIN.f1[1] + 0.1, 1.5, z0);
    if (!(o.blindTF && o.blindTF.includes(x))) P.box(M.trim, x - 0.65, x + 0.65, WIN.tf[0] - 0.1, WIN.tf[0], z0, z0 + 0.1, 'bk', 1);
  }
}

export function build(Q) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksNavalCorps] corps/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const poly = polyWorld(), edges = ringEdges(poly);
  Q.corps = { poly, edges };
  stage('ring', () => ring(Q, poly, edges));
  stage('front', () => front(Q));
  stage('roofs', () => roofs(Q, poly));
  stage('colliders', () => { addPolyColliders(Q.ctx, poly, -0.3, 17, 0.9); });
  if (errs.length) throw new Error(errs.join('\n'));
}

/** class of a ring edge: front (the river front, drawn by front()), west / east (windowed side walls), plain, court */
function classify(e) {
  const A = K.M(e.a[0], e.a[1]), B = K.M(e.b[0], e.b[1]), nu = e.n[0] * K.U[0] + e.n[1] * K.U[1], nv = e.n[0] * K.V[0] + e.n[1] * K.V[1];
  if (e.hole) return 'court';
  if (Math.abs(A.v) < 0.5 && Math.abs(B.v) < 0.5 && nv > 0.9) return 'front';
  if (Math.abs(A.u) < 1.0 && Math.abs(B.u) < 1.0 && nu < -0.9 && e.len > 100) return 'west';
  if (Math.abs(A.u - U_END) < 1.0 && Math.abs(B.u - U_END) < 1.0 && nu > 0.9 && e.len > 60) return 'east';
  return 'plain';
}

function ring(Q, poly, edges) {
  const P = Q.P, M = Q.M, H = HT.cornice;
  const cls = new Map(edges.map((e) => [e, classify(e)]));
  Q.corps.cls = cls;
  for (const e of edges) {
    const c = cls.get(e);
    if (c === 'front') continue;
    onEdge(P, e, (len, f) => {
      if (c === 'west' || c === 'east') {
        // the river corner of this wall (u = 0 / U_END, v = 0) in the edge frame: the bays count from it
        const rc = K.W(c === 'west' ? 0 : U_END, 0), xr = localOnEdge(e, rc.x, rc.z).u, dir = xr < len / 2 ? 1 : -1, pitch = c === 'west' ? 3.25 : 3.35;
        const xs = []; for (let k = 0; ; k++) { const x = xr + dir * (3.1 + pitch * k); if (x < 1.2 || x > len - 1.2) break; xs.push(x); }
        // the side walls may stand right on a service carriageway (the 11th line): the plinth is a flush granite band (no protruding box)
        windowWall(P, { x0: 0, x1: len, y0: HT.plinth, y1: H, z0: 0, tu: 4, tv: 4, base: M.rust, baseTop: HT.gf, wall: M.stucco, reveal: M.plaster, ops: openingsFor(M, xs) });
        P.quad(M.plinth, [0, 0, 0], [len, 0, 0], [len, HT.plinth, 0], [0, HT.plinth, 0], [0, 0, 1], [[0, 0], [len / 2, 0], [len / 2, 0.2], [0, 0.2]]);
        trims(P, M, xs, 0, len, 0, { noPlinth: true });
      } else {
        P.quad(M.tile, [0, 0, 0], [len, 0, 0], [len, H, 0], [0, H, 0], [0, 0, 1], [[0, 0], [len / 3.25, 0], [len / 3.25, 1], [0, 1]]);
      }
    });
  }
  // the stepped cornice round every outer edge except the river front (that one is drawn in front())
  const outer = edges.filter((e) => !e.hole), draw = (e) => cls.get(e) !== 'front';
  band(P, outer, 12.1, 12.5, 0.45, { front: M.trim, top: M.trim, under: M.trimShade }, { draw, uvs: 2 });
  band(P, outer, 12.5, 12.95, 0.4, { front: M.trimShade, top: M.trimShade }, { draw, uvs: 2 });
  band(P, outer, 12.95, H, 0.9, { front: M.trim, top: M.trim, under: M.trimShade }, { draw, uvs: 2 });
}

// ------------------------------------------------------------------------------------------------ the river front
function front(Q) {
  const P = Q.P, M = Q.M, ctx = Q.ctx, labels = ctx.services.labels, H = HT.cornice;
  P.push(K.x, 0, K.z, K.rot);
  try {
    const xsAll = [...BAYS].filter((x) => x !== 103.5 && x !== 116.2).sort((a, b) => a - b);
    // the two flank windows 103.5 / 116.2 stand on the returns of the east risalit: dropped (the risalit is 103.3 .. 116.7)
    const segs = [
      { x0: 0, x1: PAV_W.u0, z0: 0, y1: H }, { x0: PAV_W.u0, x1: PAV_W.u1, z0: 0.5, y1: H, pav: true },
      { x0: PAV_W.u1, x1: CENTRAL.u0, z0: 0, y1: H }, { x0: CENTRAL.u0, x1: CENTRAL.u1, z0: 0, y1: HT.ent1 }, { x0: CENTRAL.u1, x1: PAV_E.u0, z0: 0, y1: H },
      { x0: PAV_E.u0, x1: PAV_E.u1, z0: 0.5, y1: H, pav: true }, { x0: PAV_E.u1, x1: U_END, z0: 0, y1: H },
    ];
    for (const s of segs) {
      const xs = xsAll.filter((x) => x - 0.65 > s.x0 + 0.02 && x + 0.65 < s.x1 - 0.02);
      const door = DOORS.filter((d) => xs.includes(d));
      const blind = s.x0 === PAV_W.u0 ? [19.0] : [];
      windowWall(P, { x0: s.x0, x1: s.x1, y1: s.y1, z0: s.z0, tu: 4, tv: 4, base: M.rust, baseTop: HT.gf, wall: M.stucco, reveal: M.plaster, ops: openingsFor(M, xs, { door, blindTF: blind }) });
      trims(P, M, xs, s.x0, s.x1, s.z0, { door, blindTF: blind, noStr: s.x0 === CENTRAL.u0, pav: !!s.pav });
      if (s.pav) {
        // the returns of the risalit (0.5 m) and the blind panel of the west attic floor
        for (const [x, nx] of [[s.x0, -1], [s.x1, 1]]) P.quad(M.stucco, [x, 0, 0], [x, 0, 0.5], [x, H, 0.5], [x, H, 0], [nx, 0, 0], [[0, 0], [0.125, 0], [0.125, 3.3], [0, 3.3]]);
        if (blind.length) { P.box(M.trim, 19.0 - 0.7, 19.0 + 0.7, WIN.tf[0] - 0.1, WIN.tf[1] + 0.15, s.z0, s.z0 + 0.05, 'bk', 1); P.box(M.plasterShade, 19.0 - 0.55, 19.0 + 0.55, WIN.tf[0], WIN.tf[1] + 0.05, s.z0 + 0.04, s.z0 + 0.06, 'bk', 1); }
      }
      // the main cornice of this piece (the central block carries the colonnade entablature instead)
      if (s.y1 === H) corniceBox(P, M.trim, M.trimShade, s.x0, s.x1, s.z0, 12.1, s.x0 === 0 ? 0.9 : 0, s.x1 === U_END ? 0.9 : 0);
      // downpipes standing off the wall
      for (const x of PIPES_X) if (x > s.x0 + 0.3 && x < s.x1 - 0.3 && !xs.some((w) => Math.abs(w - x) < 0.8)) {
        const c = K.W(x, s.z0 + 0.08);
        if (labels && labels.reserve('r1242815', c.x, 6.3, c.z, 0.16, 12.4, K.V[0], K.V[1], 'pipe') === false) continue;
        pipe(P, M.pipe, x, 0.15, 12.2, s.z0 + 0.1);
      }
    }
    // pavilions: balcony, door surround and the blank plaques beside the door
    pavilionDoor(Q, 23.9, 8.0, 0.5, 8);
    pavilionDoor(Q, 110.0, 7.8, 0.5, 8);
    plaques(Q);
  } finally { P.pop(); }
}

/** the balcony over a pavilion door: slab 1.2 m deep on corbels, stone balustrade 0.95 m, and the door surround (jambs and lintel) */
function pavilionDoor(Q, xc, w, z0, nCorb) {
  const P = Q.P, M = Q.M, x0 = xc - w / 2, x1 = xc + w / 2, yb = 3.9, zb = z0 + 1.2;
  P.box(M.trim, x0, x1, yb, yb + 0.25, z0, zb, 'k', 2);
  for (let i = 0; i < nCorb; i++) { const x = x0 + 0.5 + i * (w - 1.0) / (nCorb - 1); P.box(M.trimShade, x - 0.18, x + 0.18, yb - 0.55, yb, z0, z0 + 0.7, 'k', 1); }
  // balustrade: rail, plinth rail, balusters every 0.29 m, end posts
  P.box(M.trim, x0, x1, yb + 1.1, yb + 1.2, z0 + 0.95, zb, 'b', 1);
  P.box(M.trim, x0, x1, yb + 0.25, yb + 0.37, z0 + 0.95, zb - 0.02, 'b', 1);
  const nb = Math.round(w / 0.29);
  for (let i = 0; i <= nb; i++) { const x = x0 + 0.1 + i * (w - 0.2) / nb; P.cyl(M.trim, [x, yb + 0.37, zb - 0.12], [x, yb + 1.1, zb - 0.12], 0.045, 0.045, 6, false); }
  for (const x of [x0 + 0.12, x1 - 0.12]) P.box(M.trim, x - 0.1, x + 0.1, yb + 0.25, yb + 1.2, zb - 0.22, zb, 'b', 1);
  // door surround
  P.box(M.trim, xc - 1.32, xc - 1.1, 0, 3.4, z0, z0 + 0.1, 'b', 1); P.box(M.trim, xc + 1.1, xc + 1.32, 0, 3.4, z0, z0 + 0.1, 'b', 1); P.box(M.trim, xc - 1.32, xc + 1.32, 3.25, 3.45, z0, z0 + 0.12, 'b', 1);
  // two small dark-red name boards 0.35 x 0.25 m beside the door (the real boards also carry order reliefs: left out)
  for (const dx of [-1.5, 1.5]) P.box(M.houseTerra, xc + dx - 0.175, xc + dx + 0.175, 1.98, 2.23, z0, z0 + 0.03, 'bk', 1);
}

/** the memorial boards (wording of the OSM nodes) snapped to the nearest gap between two ground-floor windows, and the street clock */
function plaques(Q) {
  const P = Q.P, M = Q.M, ctx = Q.ctx, labels = ctx.services.labels, T = ctx.mat.toon;
  const gf = BAYS.filter((x) => x > 0).map((x) => [x - 0.6, x + 0.6]).concat(DOORS.map((d) => [d - 1.4, d + 1.4]));
  const free = (x, w) => !gf.some(([a, b]) => x + w / 2 > a - 0.1 && x - w / 2 < b + 0.1) && !PIPES_X.some((p) => Math.abs(p - x) < w / 2 + 0.15);
  const snap = (x, w) => { for (let d = 0; d < 3.2; d += 0.1) for (const s of [1, -1]) { const t = x + s * d; if (free(t, w)) return t; } return null; };
  const z0 = (x) => ((x > PAV_W.u0 && x < PAV_W.u1) || (x > PAV_E.u0 && x < PAV_E.u1) ? 0.5 : 0);
  PLAQUES.forEach(([x0, text, dark], i) => {
    const w = dark ? 0.7 : 0.55, h = dark ? 0.9 : 0.75, x = snap(x0, w); if (x == null) return;
    const zz = z0(x), yc = dark ? 2.7 : 2.0, c = K.W(x, zz + 0.02);
    if (ctx.services.labels && ctx.services.labels.reserve('r1242815', c.x, yc, c.z, w, h, K.V[0], K.V[1], 'plaque') === false) return;
    const mat = T('#ffffff', { map: M.A.plaque(i, text, !!dark), name: 'lmnaval-plaque' + i, paint: 0, polygonOffset: -2 });
    P.box(M.trimShade, x - w / 2 - 0.03, x + w / 2 + 0.03, yc - h / 2 - 0.03, yc + h / 2 + 0.03, zz, zz + 0.02, 'bk', 1);
    P.quad(mat, [x - w / 2, yc - h / 2, zz + 0.022], [x + w / 2, yc - h / 2, zz + 0.022], [x + w / 2, yc + h / 2, zz + 0.022], [x - w / 2, yc + h / 2, zz + 0.022], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    Q.svc.plaques.push({ x: c.x, z: c.z, y: yc, text });
  });
  // the street clock on the wall (OSM n8754362394, d 0.6 m): snapped to a gap near u 63.6
  const cx = snap(65.2, 0.7);
  if (cx != null) {
    const c = K.W(cx, 0.1);
    if (!labels || labels.reserve('r1242815', c.x, 3.0, c.z, 0.7, 0.7, K.V[0], K.V[1], 'clock') !== false) {
      P.cyl(M.iron, [cx, 3.0, 0.02], [cx, 3.0, 0.1], 0.34, 0.34, 18, true); P.cyl(M.trim, [cx, 3.0, 0.1], [cx, 3.0, 0.115], 0.3, 0.3, 18, true);
      P.box(M.iron, cx - 0.012, cx + 0.012, 3.0, 3.24, 0.115, 0.13, '', 1); P.box(M.iron, cx - 0.2, cx, 2.988, 3.012, 0.115, 0.13, '', 1);
    }
  }
}

// ------------------------------------------------------------------------------------------------ roofs
function roofs(Q, poly) {
  const P = Q.P, M = Q.M, H = HT.cornice;
  // the flat zinc cap of the whole ring (minus the courtyards) at the cornice crown
  P.cap(M.zinc, pairs(poly.o), H, true, 2.4, poly.h.map(pairs));
  // the hip roof of the front range (u 0 .. 135.9, v 0 .. -18.4), eaves 13.3, ridge 15.9, in frame K
  P.push(K.x, 0, K.z, K.rot);
  try {
    const R0 = H, R1 = HT.ridge, d = 18.4, m = d / 2, W0 = U_END, sl = Math.hypot(m, R1 - R0);
    const uvq = (a, b, c, e) => [[a / 2.4, 0], [b / 2.4, 0], [c / 2.4, sl / 2.4], [e / 2.4, sl / 2.4]];
    P.quad(M.zinc, [0, R0, 0], [W0, R0, 0], [W0 - m, R1, -m], [m, R1, -m], [0, 0.4, 1], uvq(0, W0, W0 - m, m));
    P.quad(M.zinc, [W0, R0, -d], [0, R0, -d], [m, R1, -m], [W0 - m, R1, -m], [0, 0.4, -1], uvq(W0, 0, m, W0 - m));
    P.fan(M.zinc, [[0, R0, -d], [0, R0, 0], [m, R1, -m]], [-0.4, 0.4, 0], (p) => [p[2] / 2.4, 0]);
    P.fan(M.zinc, [[W0, R0, 0], [W0, R0, -d], [W0 - m, R1, -m]], [0.4, 0.4, 0], (p) => [p[2] / 2.4, 0]);
    // one stretch of the west wing roof shows rust-orange primer on new sheets in the 2019 photographs (u 3 .. 18): a patch on the front slope
    P.quad(M.zincRust, [3, R0 + 0.012, -0.02], [18, R0 + 0.012, -0.02], [18, R0 + (R1 - R0) * 4.0 / m + 0.012, -4.0], [3, R0 + (R1 - R0) * 4.0 / m + 0.012, -4.0], [0, 0.4, 1], [[0, 0], [6, 0], [6, 1.6], [0, 1.6]]);
    // chimneys of the front range: cream plaster stacks with white caps along the ridge, about every 14 m
    for (let u = 8; u < W0 - 4; u += 14.3) {
      if ((u > PAV_W.u0 - 2 && u < PAV_W.u1 + 2) || (u > PAV_E.u0 - 2 && u < PAV_E.u1 + 2) || (u > CENTRAL.u0 - 2 && u < CENTRAL.u1 + 2)) continue;
      P.box(M.chimneyCream, u - 0.45, u + 0.45, R1 - 0.6, R1 + 1.2, -m - 0.45, -m + 0.45, 'b', 1); P.box(M.trim, u - 0.55, u + 0.55, R1 + 1.2, R1 + 1.4, -m - 0.55, -m + 0.55, 'b', 1);
    }
  } finally { P.pop(); }
}
