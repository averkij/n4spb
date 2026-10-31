// landmarksKamennoostrovsky/emir.js - the north end of the avenue (region P8).  docs/research/kamennoostrovsky.md sections 7a, 7b; photos refs/kamennoostrovsky 75-79.
//   r406242   Kamennoostrovsky 44b: the HOUSE OF THE EMIR OF BUKHARA (S. Krichinsky 1913-14): a front of yellowish-white Shishim marble; a rough-hewn ground floor with banded piers and stone balls,
//             three gate arches to the court under a two-storey LOGGIA (three arches on columns, balustrade, big arched lattice windows behind), wings with a giant engaged order over floors 2-3,
//             windows in toothed stone frames under pediments.  OSM: the front is four edges (south wing 11.9 m, centre 11.4 m set back 1.8 m, north wing 12.6 m, a 6.8 m piece set back 3.1 m).
//             The gates are drawn closed (iron bars): the court stays private.
//   w41169889 Kamennoostrovsky 42: the LENSOVET PALACE OF CULTURE (E. Levinson, V. Munts 1931-38, constructivism), built from its four OSM parts: the four-storey front block (the tall glazed
//             portal of the main entrance, the three-storey glazed grid over the shops, the square stone TOWER at the north end), the hall block behind, the low two-step cafe wing with the
//             relief frieze toward ploshchad Shevchenko.  Simplified: the overhang part w1303547577 is not drawn, the cafe wing follows the polygonal OSM outline (the real one is rounded).
import * as THREE from 'three';
import { buildTenement } from './tenement.js';
import { NC } from './nouveau.js';

export function build(K, N, svc) {
  const L = K.L, P = K.P, M = K.mats, S = N.mats;
  const near = (e, x, z, r = 4) => Math.hypot((e.a[0] + e.b[0]) / 2 - x, (e.a[1] + e.b[1]) / 2 - z) < r;

  // ------------------------------------------------------------------------------------------ 44b: House of the Emir of Bukhara
  {
    const WALL = '#e2ddce', TRIM = '#ece8dc', ROCK = '#d0cab8', HC = 22.8, UP = 0.4, Y1 = 6.2, Y2 = 14.6;
    const wall = K.wall(WALL), trim = K.wall(TRIM), rock = N.rock(ROCK), ys = [7.2, 11.0, 15.9, 19.3];
    const isCentre = (e) => !e.hole && near(e, -2387.75, -4035.7, 2.5);
    const isWing = (e) => !e.hole && (near(e, -2391.0, -4047.1, 2.5) || near(e, -2380.45, -4025.8, 2.5));
    const win = (y, o = {}) => ({ y, h: 2.0, w: 1.25, style: 'plain', mat: trim, frame: 'brown', ...o });
    const ball = (x, y, z, r = 0.34) => { P.box(trim, x - 0.5, x + 0.5, y - 0.22, y, z - 0.5, z + 0.1, 'b'); N.ball(wall, x, y + r * 0.9, z - 0.2, r); };

    /** the 11.4 m centre: three gate arches, the loggia, two storeys above */
    const centre = (len) => {
      const top = HC + UP, pp = len / 3, ax = [pp / 2, len / 2, len - pp / 2], D = 1.7, r = 1.55, ysp = Y1 + 5.9;
      // ground floor: rough stone with three round gate arches (closed iron gates), banded piers with stone balls
      K.wallWithHoles(rock, 0, len, 0, Y1, ax.map((x) => ({ x, y0: 0.03, w: 2.7, h: 4.87, head: 'arch' })), 2.4, 1.6);   // (a hole must not touch the outline: 3 cm threshold)
      for (const x of ax) {
        P.quad(S.glassDark, [x - 1.4, 0, -0.03], [x + 1.4, 0, -0.03], [x + 1.4, 4.95, -0.03], [x - 1.4, 4.95, -0.03], [0, 0, 1]);
        P.quad(N.barsMat, [x - 1.35, 0, 0.05], [x + 1.35, 0, 0.05], [x + 1.35, 3.55, 0.05], [x - 1.35, 3.55, 0.05], [0, 0, 1], [[0, 0], [4.5, 0], [4.5, 1.6], [0, 1.6]]);
        N.archRing(trim, x, 0, 2.7, 4.9, 0.28, 0.14);
      }
      for (const x of [0.02, pp, 2 * pp, len - 0.02]) {
        const a = Math.max(0, x - 0.52), b = Math.min(len, x + 0.52);
        for (const y of [0.4, 1.45, 2.5]) P.box(rock, a, b, y, y + 0.6, 0, 0.5, 'k');
        P.box(trim, a, b, 3.55, 3.75, 0, 0.55, 'k');
        if (x > 1 && x < len - 1) ball(x, 4.0, 0.45);
      }
      // the loggia: a recess 1.7 m deep with three arched lattice windows, floor, ceiling and side returns
      P.quad(wall, [0, Y1, -D], [len, Y1, -D], [len, Y2, -D], [0, Y2, -D], [0, 0, 1], [[0, 0], [len / 3, 0], [len / 3, 2.8], [0, 2.8]]);
      for (const x of ax) { N.archFill(N.lattice, x, Y1 + 0.95, 2.5, 5.9, -D + 0.04); N.archRing(trim, x, Y1 + 0.95, 2.5, 5.9, 0.16, 0.1 - D); }
      P.quad(wall, [0, Y1, -D], [0, Y1, 0], [0, Y2, 0], [0, Y2, -D], [1, 0, 0]);
      P.quad(wall, [len, Y1, 0], [len, Y1, -D], [len, Y2, -D], [len, Y2, 0], [-1, 0, 0]);
      P.quad(trim, [0, Y1, 0], [len, Y1, 0], [len, Y1, -D], [0, Y1, -D], [0, 1, 0]);
      P.quad(trim, [0, Y2, -D], [len, Y2, -D], [len, Y2, 0], [0, Y2, 0], [0, -1, 0]);
      // the arcade in the facade plane: a 0.45 m thick spandrel with three semicircular arches on four columns
      const sp = new THREE.Shape(); sp.moveTo(0, ysp);
      for (const x of ax) { sp.lineTo(x - r, ysp); sp.absarc(x, ysp, r, Math.PI, 0, true); }
      sp.lineTo(len, ysp); sp.lineTo(len, Y2); sp.lineTo(0, Y2); sp.closePath();
      P.extrude(wall, sp, -0.45, 0.45, 3, 10);
      for (const x of [0.36, pp, 2 * pp, len - 0.36]) K.column(trim, x, -0.22, Y1, ysp, 0.3, { capH: 0.7, seg: 12 });
      N.parapet(0.7, len - 0.7, Y1, 0.02, { mat: trim, hex: TRIM, gap: pp, h: 0.9, t: 0.2 });
      // the two storeys above
      K.wallQuad(wall, 0, len, Y2, top, 3);
      for (const x of ax) { N.window(win(ys[2], { x })); N.window(win(ys[3], { x, h: 1.8 })); }
    };

    buildTenement(K, N, svc, {
      name: 'emir', title: 'Дом эмира Бухарского (Каменноостровский, 44б)', titleEn: 'House of the Emir of Bukhara (S. Krichinsky 1913-14)', ids: ['r406242'], hc: HC, up: UP, wall: WALL, court: '#b9b6ab', trim, frame: 'brown',
      pitch: 3.0, margin: 1.4, corniceMat: trim, corniceScale: 1.3, plinth: 0.6, plinthMat: N.ashlar('#bdb7a6'), noPlinth: isCentre,
      base: { kind: 'plain', h: Y1, mat: rock, tile: 2.4, tileY: 1.6, sill: 1.5, winH: 2.6, w: 1.3, style: 'block', trim },
      floors: [win(ys[0], { style: 'rustic', h: 2.5, w: 1.3 }), win(ys[1], { style: 'key', h: 2.2 }), win(ys[2]), win(ys[3], { h: 1.8 })],
      bands: [{ y0: Y1 - 0.3, y1: Y1, d: 0.3, mat: trim }, { y0: Y2, y1: Y2 + 0.9, d: 0.35, mat: trim }],
      front: (e, c) => { if (!isCentre(e)) return false; e.street = true; N.withEdge(e, c.f, c.len, () => centre(c.len)); return true; },
      extra: (e, len, xs) => {
        if (!isWing(e) || xs.length < 2) return;
        // the giant engaged order over floors 2-3 on banded stone piers, pediments over the second-floor windows, stone balls on the end piers (photo 75)
        const pp = xs[1] - xs[0], cols = [xs[0] - pp / 2, ...xs.map((x) => x + pp / 2)];
        for (const x of cols) {
          K.column(trim, x, 0.3, Y1, Y2, 0.42, { capH: 1.1, seg: 12 });
          P.box(rock, x - 0.55, x + 0.55, 0.6, Y1 - 0.3, 0, 0.42, 'kb');
          for (const y of [0.7, 2.0, 3.3, 4.6]) P.box(rock, x - 0.68, x + 0.68, y, y + 0.62, 0, 0.58, 'k');
        }
        for (const x of xs) K.hood(trim, 'tri', x, ys[0] + 2.5 + 0.72, 2.3, 0.55, 0.2);
      },
    });
    svc.photoSpots.push({ x: -2362, z: -4032, yaw: L.yawToward(-2362, -4032, -2388, -4036), pitch: 16, name: 'Каменноостровский проспект · Дом эмира Бухарского' });
  }

  // ------------------------------------------------------------------------------------------ 42: Lensovet Palace of Culture
  {
    const WALL = '#aaa593', stone = N.ashlar(WALL), trim = K.wall('#c6c2b3'), HH = { w1303547572: 17.5, w1303547573: 13.5, w1303547574: 9, w1303547575: 5 }, TOWER = 31;
    const isNorth = (e) => !e.hole && e.rec.id === 'w1303547572' && near(e, -2310.55, -3867.55, 4);
    const isFrieze = (e) => !e.hole && e.rec.id === 'w1303547574' && e.len > 25 && e.n[1] < 0;
    const rows = [6.2, 9.9, 13.6].map((y) => ({ y, h: 2.2, w: 2.0, style: 'slab', mat: trim, frame: 'white', sw: 0.12, d: 0.07 }));
    const G0 = 21.5, G1 = 63.5, T0 = 64.2;
    buildTenement(K, N, svc, {
      name: 'lensovet', title: 'Дворец культуры имени Ленсовета', titleEn: 'Lensovet Palace of Culture (E. Levinson, V. Munts 1931-38)', ids: Object.keys(HH), at: [-2311, -3868], hc: 17.5, hcOf: (rec) => HH[rec.id], up: 0.5,
      wall: WALL, court: '#a19c8b', trim, frame: 'white', pitch: 4.2, margin: 1.6, cornice: 'none', plinth: 0.5, plinthMat: N.ashlar(NC.stoneDark), roofMat: K.mats.roofDark,
      street: (e) => (isFrieze(e) ? true : null),
      base: { kind: 'shop', h: 4.9, mat: N.ashlar('#948f7f'), tile: 1.8, y0: 0.5, y1: 4.1, frameMat: S.stoneDark, pier: 0.8, signEvery: 2 },
      floors: rows,
      edge: (e, len) => {
        if (isFrieze(e)) return { xs: () => [], floors: [] };
        if (isNorth(e)) return { xs: () => K.bays(G0, G1, (G1 - G0) / 9), floors: [] };
        return { floors: rows.filter((F) => F.y + F.h < e.hc - 0.5) };
      },
      bands: [{ y0: 4.9, y1: 5.2, d: 0.22, mat: trim }, { y0: (e) => e.hc + 0.2, y1: (e) => e.hc + 0.5, d: 0.1, mat: trim }],
      extra: (e, len, xs, top) => {
        if (isFrieze(e)) { K.strip(K.R.frieze, 0.6, len - 0.6, 6.5, 8.3, 0.04, 4); return; }
        if (!isNorth(e)) return;
        // the tall glazed portal of the main entrance
        K.wallQuad(N.lattice, 1.3, 9.5, 3.4, 13.8, 1.4, 0.03);
        P.box(trim, 0.8, 1.3, 0, 14.3, 0, 0.5, 'kb'); P.box(trim, 9.5, 10.0, 0, 14.3, 0, 0.5, 'kb'); P.box(trim, 1.3, 9.5, 13.8, 14.3, 0, 0.5, 'k');
        P.box(S.stoneDark, 1.3, 9.5, 3.1, 3.4, 0, 1.7, 'k');
        for (let i = 0; i < 4; i++) { const x = 2.45 + i * 1.98; P.box(S.glassDark, x - 0.8, x + 0.8, 0.1, 2.9, 0.05, 0.13, 'kb'); P.box(trim, x + 0.8, x + 0.98, 0, 3.1, 0.05, 0.2, 'kb'); }
        P.box(trim, 1.47, 1.65, 0, 3.1, 0.05, 0.2, 'kb');
        N.board(5.4, 15.2, 7.8, 0.75, ['ДВОРЕЦ КУЛЬТУРЫ ИМЕНИ ЛЕНСОВЕТА'], { bg: '#8f8b7c', fg: '#ece6d2', font: K.ctx.tex.FONTS.sans, weight: 700, size: 0.7, z: 0.05, px: 768 });
        svc.entrances.push({ x: N.world(5.4, 0.8)[0], z: N.world(5.4, 0.8)[1], rotY: Math.atan2(e.n[0], e.n[1]), kind: 'door', bldg: 'w41169889', name: 'ДК имени Ленсовета' });
        // two plain bays, then the glazed grid: nine bays by three rows of big windows between stone fins
        for (const x of [13.6, 17.8]) for (const F of rows) N.window({ ...F, x });
        const gp = (G1 - G0) / 9;
        for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) K.wallQuad(N.lattice, G0 + i * gp + 0.3, G0 + (i + 1) * gp - 0.3, 5.75 + j * 3.75, 9.0 + j * 3.75, 1.55, 0.03);
        for (let i = 0; i <= 9; i++) P.box(trim, G0 + i * gp - 0.16, G0 + i * gp + 0.16, 5.2, 16.9, 0, 0.36, 'kb');
        for (let j = 0; j <= 3; j++) P.box(trim, G0, G1, 5.4 + j * 3.75, 5.75 + j * 3.75, 0, 0.3, 'k');
        // the tower at the north end: a square stone shaft with a few small windows
        P.box(stone, T0, len, top, TOWER, -(len - T0), 0, 'b', 1.8);
        P.box(trim, T0 - 0.15, len + 0.15, TOWER, TOWER + 0.35, -(len - T0) - 0.15, 0.15, 'b');
        for (const y of [6.4, 10.2, 14.0, 19.5, 23.5, 27.2]) N.window({ x: (T0 + len) / 2, y, w: 1.3, h: 1.6, style: 'slab', mat: trim, frame: 'white', sw: 0.1, d: 0.06 });
      },
    });
    svc.photoSpots.push({ x: -2282, z: -3880, yaw: L.yawToward(-2282, -3880, -2320, -3888), pitch: 16, name: 'Каменноостровский проспект · ДК имени Ленсовета' });
  }
}
