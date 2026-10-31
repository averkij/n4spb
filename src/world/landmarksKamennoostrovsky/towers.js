// landmarksKamennoostrovsky/towers.js - the HOUSE WITH TOWERS (доходный дом К. И. Розенштейна, Каменноостровский пр. 35 / Большой пр. П. С. 75 / ул. Льва Толстого 2; K. I. Rosenstein + A. E. Belogrud 1913-15).
// OSM r2139268 (outline, 16 vertices + courtyard) with the tower parts r4080817 / r4080818 (hexagons from level 2).  docs/research/kamennoostrovsky.md section 2; photos refs/kamennoostrovsky 01-14.
//   plan      the 10.2 m front between two hexagonal towers faces WSW onto Lev Tolstoy Square; the Bolshoy pr. side (35.5 m) runs NE with the lancet arcade of the theatre, the ul. Lva Tolstogo side
//             (39.4 m, one OSM vertex with a 15 cm kink dropped) runs east with two bay windows on volute brackets and the gate arch beside the tower
//   heights   string course 5.75-6.05, sills 6.9 / 10.7 / 14.4 / 18.1, cornice 21.5, balustrade 21.75-22.7, tower shaft 27.0, bracket cornice to 27.9, crown parapet 29.5, pier balls 30.4
//             (photo 04: tower / cornice = 1.40; the towers are 6.6-7 m across)
//   colours   cream stucco #ece3cd, grey terrazzo "stone" #7f7e7c (rough jambs, quoins, corbel trays, arch rings), pink-grey balustrades and tower crowns #a9978c, grey sheet mansard #8a9197
//   towers    stand on three corbelled trays over a narrower base (photo 10); toothed quoins on every corner; the north tower carries the zodiac clock, the south tower the oval cartouche window
import { buildHouse } from './house.js';
import { ringFromFlat } from '../lib/massing.js';
import { ringEdges, band, polyOf } from './kit.js';
import { NC } from './nouveau.js';

const WALL = '#ece3cd', COURT = '#d9cfb6', PINK = NC.stonePink;
const HC = 21.5, UP = 0.25, TOP = 27.0, CROWN = 29.5, TRAY0 = 4.3, TRAY1 = 6.0;
const FL = [{ y: 6.9, h: 2.2 }, { y: 10.7, h: 2.1 }, { y: 14.4, h: 2.0 }, { y: 18.1, h: 2.3 }];
const near = (p, x, z, tol = 0.6) => Math.hypot(p[0] - x, p[1] - z) < tol;
const edgeIs = (e, ax, az, bx, bz, tol = 0.7) => (near(e.a, ax, az, tol) && near(e.b, bx, bz, tol)) || (near(e.a, bx, bz, tol) && near(e.b, ax, az, tol));
// tower hexagons (OSM): [outer vertices from the wall junction round to the other junction ..., the inner vertex]
const TOWER_S = [[-2152.6, -3709.6], [-2154.6, -3707.4], [-2158.1, -3707.9], [-2159.3, -3710.9], [-2157.4, -3714.2], [-2153.6, -3713.6]];
const TOWER_N = [[-2160.7, -3723.8], [-2163.6, -3724.0], [-2164.9, -3727.3], [-2162.9, -3730.2], [-2160.1, -3730.0], [-2158.7, -3727.0]];

export function build(K, N, svc) {
  const L = K.L, P = K.P, M = K.mats, S = N.mats;
  const rec = L.buildingById('r2139268'); if (!rec) return;
  const stone = S.stone, wall = K.wall(WALL), pink = S.stonePink, dentil = K.mat(NC.stone, { map: K.texDentil });
  const roof = N.seam(NC.roofGrey), quoin = N.quoinMat(WALL, NC.stone);
  // the outline without the kink vertex of the ul. Lva Tolstogo front
  const ring0 = ringFromFlat(rec.polys[0].o).filter((p) => !near(p, -2146.1, -3709.1, 0.5));
  const poly = polyOf(ring0, rec.polys[0].h.map(ringFromFlat));
  const isSouth = (e) => edgeIs(e, -2113.4, -3705.7, -2152.6, -3709.6);
  const isFront = (e) => edgeIs(e, -2157.4, -3714.2, -2160.7, -3723.8);
  const isBolshoy = (e) => edgeIs(e, -2160.1, -3730.0, -2137.6, -3757.5);
  const onTower = (e) => !e.hole && [TOWER_S, TOWER_N].some((t) => t.some((p) => near(p, e.a[0], e.a[1], 0.3)) && t.some((p) => near(p, e.b[0], e.b[1], 0.3))) && !isFront(e);
  const street = (e) => isSouth(e) || isFront(e) || isBolshoy(e);

  // ------------------------------------------------------------------------------------------ elevations
  const floorsOf = (o = {}) => [
    { ...FL[0], w: 1.25, style: 'rustic', mat: stone, frame: 'brown', ...(o.f2 || {}) },
    { ...FL[1], w: 1.2, style: 'block', mat: stone, frame: 'brown', ...(o.f3 || {}) },
    { ...FL[2], w: 1.2, style: 'block', mat: stone, frame: 'brown', ...(o.f4 || {}) },
    { ...FL[3], w: 1.2, style: 'arch', mat: stone, frame: 'brown', sw: 0.2, d: 0.1, key2: stone, ...(o.f5 || {}) },
  ];
  /** the roof balustrade of a street front and the attic behind it */
  const crown = (len, o = {}) => {
    N.parapet(o.p0 ?? 0.2, o.p1 ?? len - 0.2, HC + UP, 0.3, { mat: pink, hex: PINK, gap: 3.0, h: 0.95, endL: o.endL, endR: o.endR });
    N.mansard(o.m0 ?? 0, o.m1 ?? len, HC + UP, { mat: roof, inset: o.inset ?? 1.5, run: 1.3, rise: 2.7, D: o.D ?? 6.5, tL: o.tL ?? 0, tR: o.tR ?? 0, dormers: (o.dormers || []).map((u) => ({ u, w: 1.5, h: 1.9, head: 'arch', mat: wall })) });
  };


  const info = buildHouse(K, {
    name: 'towers', recs: [rec], polysOf: () => [poly], clearRoad: false, hc: HC, upstand: UP, wall: WALL, court: COURT, plinth: 0.8, plinthMat: N.rock(NC.granite),
    floors: [5.2, 3.8, 3.8, 3.7, 3.6], courtPitch: 3.2, railing: false, cornice: 'none', roofMat: K.mats.roofSilver,
    noBand: (e) => onTower(e), noPlinth: (e) => onTower(e),
    front: (e, c) => {
      if (onTower(e)) return true;                                                // the towers are built below
      const fn = isFront(e) ? front : isBolshoy(e) ? bolshoy : isSouth(e) ? south : null;
      if (!fn) return false;
      N.withEdge(e, c.f, c.len, () => fn(c.len)); return true;
    },
    bands: [
      { y0: 5.45, y1: 5.75, d: 0.12, mat: dentil, uvs: 0.6, draw: street }, { y0: 5.75, y1: 6.05, d: 0.24, mat: stone, draw: street },
      { y0: 17.0, y1: 17.25, d: 0.1, mat: dentil, uvs: 0.6, draw: street }, { y0: 17.25, y1: 17.5, d: 0.2, mat: stone, draw: street },
      { y0: HC - 0.75, y1: HC - 0.4, d: 0.16, mat: dentil, uvs: 0.6, draw: street }, { y0: HC - 0.4, y1: HC, d: 0.5, mat: stone, draw: street }, { y0: HC, y1: HC + UP, d: 0.32, mat: stone, draw: street },
      { y0: HC - 0.4, y1: HC + UP, d: 0.12, mat: K.wall(COURT), draw: (e) => !street(e) },
    ],
  });

  /** the 10.2 m front between the towers: the great pointed arch of the theatre, three bays, the terrace balustrade */
  function front(len) {
    const xs = [len / 2 - 3.0, len / 2, len / 2 + 3.0];
    N.elevation(len, { wall, H: HC + UP, xs, trim: stone, floors: floorsOf({ f3: { at: (i) => (i === 1 ? { style: 'hood', sw: 0.18, d: 0.1, y: 10.5, h: 2.3 } : null) }, f5: { at: (i) => (i === 1 ? { w: 1.4 } : null) } }) });
    N.lancet({ x: len / 2, w: 6.6, ys: 2.45, ya: 5.3, sw: 0.5, d: 0.26, mat: N.rock(NC.stone), fill: 'door', doorW: 2.2, doorH: 2.4, teeth: 5 });
    N.board(len / 2, 3.45, 4.2, 1.5, ['ТЕАТР', 'ИМЕНИ АНДРЕЯ МИРОНОВА'], { fg: '#e9c24c', transparent: true, weight: 700, size: 0.9, weights: [700, 600], z: 0.16, px: 768 });
    N.stoneBalcony(len / 2 - 1.5, len / 2 + 1.5, 10.5, 1.0, { mat: stone, hex: NC.stone });
    N.stoneBalcony(len / 2 - 1.3, len / 2 + 1.3, 17.9, 0.8, { mat: stone, hex: NC.stone, balHex: PINK });
    crown(len, { p0: 0.3, p1: len - 0.3, inset: 2.6, m0: -1.5, m1: len + 1.5, D: 5.0, dormers: xs, endL: false, endR: false });
    svc.entrances.push({ ...pt(N.world(len / 2, 0.6)), rotY: Math.atan2(N.cur.e.n[0], N.cur.e.n[1]), kind: 'theatre', name: 'Театр имени Андрея Миронова' });
  }

  /** Bolshoy pr. side (35.5 m, the tower at the right end): the arcade of seven pointed arches with oculi, eleven bays, stone balconies */
  function bolshoy(len) {
    const xs = K.bays(1.2, len - 1.6, 2.98), n = xs.length;
    const bal3 = new Set([2, n - 3]), mid = Math.floor(n / 2);
    N.elevation(len, { wall, H: HC + UP, xs, trim: stone, floors: floorsOf() });
    const ax = K.bays(0.9, len - 2.2, 4.6);
    ax.forEach((x, i) => {
      const door = i === 2 || i === 4;
      if (N.blocked(x - 2.0, x + 2.0, 0.2, 5.2)) return;
      N.lancet({ x, w: 3.0, ys: 2.9, ya: 4.85, sw: 0.34, d: 0.2, mat: N.rock(NC.stone), fill: door ? 'door' : 'lattice', doorW: 1.9, teeth: 3 });
      if (i + 1 < ax.length) { const ox = (x + ax[i + 1]) / 2; N.oculus(ox, 4.55, 0.42, stone); }
    });
    // the theatre boards in the heads of the arches (photo 07: gilt letters on a dark panel) and two repertoire boards
    for (const k of [2, 4]) if (ax[k] != null) N.board(ax[k], 3.52, 2.3, 1.05, ['ТЕАТР', 'ИМЕНИ', 'АНДРЕЯ МИРОНОВА'], { bg: '#2a2725', fg: '#e9c24c', weight: 700, size: 0.86, z: 0.13, px: 512 });
    for (const k of [1, 5]) if (ax[k] != null) N.board(ax[k], 3.5, 1.9, 0.8, ['РЕПЕРТУАР', 'ТЕАТРА'], { bg: '#3a2f28', fg: '#e8dcc0', rim: '#b9953e', size: 0.8, z: 0.13, px: 384 });
    for (const k of bal3) N.stoneBalcony(xs[k] - 1.35, xs[k] + 1.35, FL[1].y - 0.45, 1.0, { mat: stone, hex: NC.stone });
    N.stoneBalcony(xs[mid] - 1.4, xs[mid] + 1.4, FL[2].y - 0.45, 1.05, { mat: stone, hex: NC.stone });
    for (let i = 1; i < n; i += 2) N.stoneBalcony(xs[i] - 0.95, xs[i] + 0.95, FL[3].y - 0.2, 0.5, { mat: stone, hex: NC.stone, balHex: PINK, corbels: false, h: 0.8 });
    crown(len, { tR: 0.5, dormers: K.bays(3, len - 4, 6), endR: false });
    svc.entrances.push({ ...pt(N.world(ax[2], 0.6)), rotY: Math.atan2(N.cur.e.n[0], N.cur.e.n[1]), kind: 'theatre', name: 'Театр имени Андрея Миронова' });
  }

  /** ul. Lva Tolstogo side (39.4 m, the tower at the left end): the gate arch, two bay windows on brackets under balconies, twelve bays */
  function south(len) {
    const xs = K.bays(2.0, len - 1.0, 3.03), n = xs.length, e1 = xs[3], e2 = xs[8], ew = 3.5;
    const skip = [[e1 - ew / 2, e1 + ew / 2], [e2 - ew / 2, e2 + ew / 2]];
    const fl = floorsOf();
    N.elevation(len, { wall, H: HC + UP, xs, trim: stone, floors: [{ ...fl[0], at: (i) => (i === 3 || i === 8 ? false : null) }, { ...fl[1], at: (i) => (i === 3 || i === 8 ? false : null) }, fl[2], fl[3]] });
    // ground floor: the gate arch beside the tower, small windows, two doors
    N.lancet({ x: xs[1], w: 3.5, ys: 3.1, ya: 5.1, sw: 0.4, d: 0.22, mat: N.rock(NC.stone), fill: 'gate', teeth: 4 });
    N.board(xs[1], 3.85, 2.5, 1.0, ['ТЕАТР', 'ИМЕНИ АНДРЕЯ МИРОНОВА'], { bg: '#2a2725', fg: '#e9c24c', weight: 700, size: 0.86, z: 0.14, px: 512 });
    xs.forEach((x, i) => {
      if (i < 3) return;
      if (i === 5 || i === 10) { if (!N.blocked(x - 1, x + 1, 0, 3.4)) { P.box(S.door, x - 0.75, x + 0.75, 0.15, 2.75, 0.05, 0.13, 'kb'); P.box(stone, x - 1.0, x - 0.75, 0, 3.0, 0, 0.16, 'kb'); P.box(stone, x + 0.75, x + 1.0, 0, 3.0, 0, 0.16, 'kb'); P.box(stone, x - 1.1, x + 1.1, 2.75, 3.15, 0, 0.2, 'k'); K.glass(M.winBrown, x, 3.3, 1.3, 0.9, 'flat', 1); } return; }
      if (N.blocked(x - 0.9, x + 0.9, 1.2, 4.4)) return;
      N.window({ x, y: 1.7, w: 1.15, h: 2.2, style: 'block', mat: stone, frame: 'brown' });
    });
    for (const u of [e1, e2]) {
      N.erker(u, ew, 1.15, 6.25, 13.95, {
        plan: 'trap', c: 0.75, wall, corbel: 'brackets', corbelMat: stone, top: 'balcony', railHex: NC.stone, topMat: stone,
        bands: [[6.25, 6.6, 0.07, stone], [9.75, 10.2, 0.09, stone], [13.6, 13.95, 0.12, stone]],
        face: (fl2, k) => { for (const F of [FL[0], FL[1]]) N.window({ x: fl2 / 2, y: F.y, w: k === 1 ? Math.min(1.5, fl2 - 0.5) : Math.min(0.55, fl2 - 0.4), h: F.h, style: 'plain', mat: stone, frame: 'brown', sw: 0.12, d: 0.06 }); },
      });
    }
    for (let i = 0; i < n; i += 2) N.stoneBalcony(xs[i] - 0.95, xs[i] + 0.95, FL[3].y - 0.2, 0.5, { mat: stone, hex: NC.stone, balHex: PINK, corbels: false, h: 0.8 });
    crown(len, { tL: 0.5, dormers: K.bays(4, len - 3, 6), endL: false });
  }

  // ------------------------------------------------------------------------------------------ the two hexagonal towers
  const drawn = info.edges.length > 0;
  if (drawn) { tower(TOWER_S, false); tower(TOWER_N, true); }

  function tower(hex, clock) {
    const c = [hex.reduce((s, p) => s + p[0], 0) / 6, hex.reduce((s, p) => s + p[1], 0) / 6];
    const lerpHex = (t) => hex.map((p, i) => (i === 0 || i >= 4 ? p : [c[0] + (p[0] - c[0]) * (0.72 + 0.28 * t), c[1] + (p[1] - c[1]) * (0.72 + 0.28 * t)]));
    const faces = (ring) => ringEdges(polyOf(ring), 0.05);
    // base (narrower): four outer faces from the ground to the first tray, quoin strips at the corners
    faces(lerpHex(0)).slice(0, 4).forEach((e, i) => N.onEdge(e, (len) => {
      K.wallQuad(wall, 0, len, 0, TRAY0, 3);
      P.box(N.rock(NC.granite), 0, len, 0, 0.8, 0, 0.1, 'kb');
      N.quoins(quoin, 0, 0.8, TRAY0, 1, { h: 0.5, long: 0.5 }); N.quoins(quoin, len, 0.8, TRAY0, -1, { h: 0.5, long: 0.5 });
      // the memorial plaque of the house (photo 10) on the face of the south tower that looks at the front
      if (!clock && i === 3) { N.board(len / 2, 2.0, 0.7, 0.95, ['ПАМЯТНИК', 'АРХИТЕКТУРЫ', 'ДОМ К. И. РОЗЕНШТЕЙНА', 'ПОСТРОЕН В 1913—1915 гг.', 'АРХИТЕКТОРЫ', 'А. Е. БЕЛОГРУД', 'К. И. РОЗЕНШТЕЙН', 'ОХРАНЯЕТСЯ ГОСУДАРСТВОМ'], { bg: '#4a4c4e', fg: '#e6e2d6', size: 0.74, z: 0.035, px: 384, kind: 'plate-landmark', frame: S.stoneDark }); return; }
      if (len > 2.6 && !N.blocked(len / 2 - 0.9, len / 2 + 0.9, 1.0, 4.2)) N.window({ x: len / 2, y: 1.5, w: 0.9, h: 2.0, style: 'arch', mat: stone, frame: 'brown', sw: 0.18, d: 0.1, key2: stone });
    }));
    // three corbelled trays (photo 10): each course is a ring of the growing hexagon with corbel blocks under it
    const hStep = (TRAY1 - TRAY0) / 3;
    for (let k = 1; k <= 3; k++) {
      const ring = lerpHex(k / 3), y0 = TRAY0 + (k - 1) * hStep;
      P.cap(stone, ring, y0, false, 2);
      for (const e of faces(ring).slice(0, 4)) N.onEdge(e, (len) => {
        P.box(stone, 0, len, y0 + hStep * 0.45, y0 + hStep, -0.3, 0, 'kl r');
        K.wallQuad(stone, 0, len, y0, y0 + hStep * 0.45, 2, -0.14);
        const nb = Math.max(2, Math.round(len / 0.75));
        for (let i = 0; i < nb; i++) { const x = (len * (i + 0.5)) / nb; P.box(stone, x - 0.14, x + 0.14, y0 + 0.02, y0 + hStep * 0.45, -0.14, 0, 'k'); }
      });
    }
    // shaft: the four street faces from the trays to the cornice, all six above the roof
    const es = faces(hex);
    es.forEach((e, i) => N.onEdge(e, (len) => {
      const outer = i < 4, y0 = outer ? TRAY1 : HC + UP, square = clock ? i === 1 : i === 2;         // the face that looks at the square (WSW)
      K.wallQuad(wall, 0, len, y0, TOP, 3);
      N.quoins(quoin, 0, y0, TOP - 0.95, 1, { h: 0.56, long: 0.5 }); N.quoins(quoin, len, y0, TOP - 0.95, -1, { h: 0.56, long: 0.5 });
      if (outer && len > 2.4) {
        const x = len / 2;
        N.window({ x, y: FL[0].y, w: 0.9, h: FL[0].h, style: 'rustic', mat: stone, frame: 'brown' });
        N.window({ x, y: FL[1].y, w: 0.9, h: FL[1].h, style: 'block', mat: stone, frame: 'brown' });
        N.window({ x, y: FL[2].y, w: 0.9, h: FL[2].h, style: 'block', mat: stone, frame: 'brown' });
        if (square) ogee(x, FL[3].y - 0.2, len);
        else N.window({ x, y: FL[3].y, w: 0.85, h: FL[3].h - 0.2, style: 'arch', mat: stone, frame: 'brown', sw: 0.16, d: 0.09 });
        P.box(stone, 0.1, len - 0.1, 17.25, 17.5, 0, 0.14, 'k');
      }
      if (square) { if (clock) dial(len / 2, 24.3, 1.15); else cartouche(len / 2, 24.3); }
      else if (len > 2.4) N.window({ x: len / 2, y: 23.2, w: 0.8, h: 1.9, style: 'arch', mat: stone, frame: 'brown', sw: 0.16, d: 0.09 });
    }));
    // bracket cornice and the crown: a balustrade between six corner piers with stone balls
    band(P, es, TOP - 0.95, TOP - 0.55, 0.16, { front: dentil, top: stone, under: stone }, { uvs: 0.6 });
    band(P, es, TOP - 0.55, TOP, 0.55, { front: stone, top: stone, under: stone });
    band(P, es, TOP, TOP + 0.3, 0.38, { front: pink, top: pink, under: pink });
    band(P, es, TOP + 0.3, TOP + 0.5, 0.3, { front: pink, top: pink });
    for (const e of es) N.onEdge(e, (len) => { const rep = Math.max(1, Math.round(len / 0.9)); P.quad(N.balMat(PINK), [0, TOP + 0.5, 0.2], [len, TOP + 0.5, 0.2], [len, CROWN - 0.16, 0.2], [0, CROWN - 0.16, 0.2], [0, 0, 1], [[0, 0], [rep, 0], [rep, 1], [0, 1]]); });
    band(P, es, CROWN - 0.16, CROWN, 0.32, { front: pink, top: pink, under: pink });
    P.cap(S.roofDark, hex, TOP + 0.32, true, 3);
    for (const p of hex) {
      const dx = p[0] - c[0], dz = p[1] - c[1], l = Math.hypot(dx, dz), x = p[0] + (dx / l) * 0.3, z = p[1] + (dz / l) * 0.3;
      P.box(pink, x - 0.3, x + 0.3, TOP + 0.3, CROWN + 0.32, z - 0.3, z + 0.3, 'b');
      P.box(pink, x - 0.36, x + 0.36, CROWN + 0.32, CROWN + 0.46, z - 0.36, z + 0.36, 'b');
      N.ball(pink, x, CROWN + 0.72, z, 0.25);
    }
  }
  /** the Gothic frame of the fifth-floor tower window: a triple light under an ogee hood with a corbelled sill (photo 04) */
  function ogee(x, y, len) {
    const w = Math.min(2.2, len - 0.7);
    for (const dx of [-w / 3, 0, w / 3]) K.glass(M.winBrown, x + dx, y + 0.3, w / 3 - 0.14, dx ? 1.9 : 2.3, 'arch', dx ? 1 : 0);
    P.box(stone, x - w / 2 - 0.12, x - w / 2, y, y + 2.3, 0, 0.12, 'kb'); P.box(stone, x + w / 2, x + w / 2 + 0.12, y, y + 2.3, 0, 0.12, 'kb');
    for (const dx of [-w / 6, w / 6]) P.box(stone, x + dx - 0.06, x + dx + 0.06, y + 0.3, y + 2.2, 0, 0.1, 'kb');
    N.attic(x - w / 2 - 0.2, x + w / 2 + 0.2, y + 2.3, 1.1, 'baroque', stone, { t: 0.14, z: 0.14 });
    N.stoneBalcony(x - w / 2 - 0.1, x + w / 2 + 0.1, y + 0.25, 0.5, { mat: stone, hex: NC.stone, h: 0.7 });
  }
  /** the zodiac clock of the north tower: a stone ring, a cream dial with twelve signs, gilt hands */
  function dial(x, y, r) {
    P.cyl(stone, [x, y, 0], [x, y, 0.16], r + 0.22, r + 0.22, 28, true);
    const tex = K.ctx.tex.draw(256, 256, (g, w) => {
      g.clearRect(0, 0, w, w); const c = w / 2;
      g.fillStyle = '#d9d2c0'; g.beginPath(); g.arc(c, c, c - 2, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#5c5b59'; g.beginPath(); g.arc(c, c, c * 0.62, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#d9d2c0'; g.beginPath(); g.arc(c, c, c * 0.56, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#5c5b59'; g.lineWidth = 3;
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(c + Math.cos(a) * c * 0.62, c + Math.sin(a) * c * 0.62); g.lineTo(c + Math.cos(a) * (c - 4), c + Math.sin(a) * (c - 4)); g.stroke(); const b = a + Math.PI / 12; g.fillStyle = '#5c5b59'; g.beginPath(); g.arc(c + Math.cos(b) * c * 0.8, c + Math.sin(b) * c * 0.8, 9, 0, Math.PI * 2); g.fill(); g.fillStyle = '#d9d2c0'; g.beginPath(); g.arc(c + Math.cos(b) * c * 0.8 + 3, c + Math.sin(b) * c * 0.8 - 2, 5, 0, Math.PI * 2); g.fill(); }
      g.strokeStyle = '#3a3835'; g.lineCap = 'round'; g.lineWidth = 7; g.beginPath(); g.moveTo(c, c); g.lineTo(c + c * 0.3, c - c * 0.12); g.stroke(); g.lineWidth = 5; g.beginPath(); g.moveTo(c, c); g.lineTo(c - c * 0.22, c + c * 0.42); g.stroke();
      g.fillStyle = '#3a3835'; g.beginPath(); g.arc(c, c, 8, 0, Math.PI * 2); g.fill();
    }, { key: 'lmKam-zodiac' });
    P.geo(K.mat('#ffffff', { map: tex, name: 'lmKam-zodiac', paint: 0 }), N.circle(), x, y, 0.2, 0, 0, 0, r);   // an opaque disc (no alpha edge over the stone ring)
  }
  /** the oval window of the south tower in its scrolled stone frame */
  function cartouche(x, y) {
    N.oculus(x, y, 0.55, stone, 1.5);
    P.box(stone, x - 0.95, x + 0.95, y - 1.35, y - 1.15, 0, 0.16, 'k'); P.box(stone, x - 0.5, x + 0.5, y + 1.05, y + 1.3, 0, 0.16, 'k');
    for (const s of [-1, 1]) { P.box(stone, x + s * 0.85 - 0.12, x + s * 0.85 + 0.12, y - 1.15, y + 0.6, 0, 0.1, 'kb'); N.ball(stone, x + s * 0.85, y + 0.75, 0.08, 0.16); }
  }

  svc.houses.push({ id: 'r2139268', name: 'Дом с башнями (дом Розенштейна)', nameEn: 'House with Towers (Rosenstein house, Belogrud 1913-15)', x: -2161, z: -3719 });
  svc.photoSpots.push({ x: -2196, z: -3712, yaw: L.yawToward(-2196, -3712, -2160, -3719), pitch: 14, name: 'Площадь Льва Толстого · Дом с башнями' });
}
const pt = (p) => ({ x: p[0], z: p[1] });
