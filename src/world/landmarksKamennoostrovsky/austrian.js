// landmarksKamennoostrovsky/austrian.js - AUSTRIAN SQUARE (Австрийская площадь, the octagon where Kamennoostrovsky pr. crosses ul. Mira): its five houses.
// docs/research/kamennoostrovsky.md section 3; photos refs/kamennoostrovsky 32-49.  OSM footprints (bay windows and corner towers are bumps of the outlines):
//   SE  w42422601  Kamennoostrovsky 13 / Mira 13 / Divenskaya 2: the Keldal house (V. Schaub 1902-03): white stucco with brick-red rough panels and green majolica bands, horseshoe gables, a square
//                  clock tower with a green dome between the avenue wing and the recessed centre, green sheet roof
//   SW  r1267606   Kamennoostrovsky 16: the Lipgart house (Schaub 1905-06): grey neo-baroque / Jugendstil, the round corner tower with a two-tier lantern and a green onion spire, studio window
//   SW  r1267607   Kamennoostrovsky 18 / Mira 11: the Lepenberg house (A. Kovsharov 1899-1901): ochre late eclectic, green scale mansard
//   NW  w52104048  Kamennoostrovsky 20 / Mira 10: the Gorbov house (Schaub 1901-02): sand neo-baroque, a curved gable over the square front, a small round turret with a silver cupola at the
//                  Mira corner and the tall tower with a bell spire toward the avenue, silver mansard
//   NE  w27046419  Kamennoostrovsky 15 / Mira 12: the 1952 house (O. Guryev, A. Shcherbenok): peach Stalinist neoclassic with arched ground floor and an attic with a cartouche
import { buildTenement } from './tenement.js';
import { NC } from './nouveau.js';

export function build(K, N, svc) {
  const L = K.L, P = K.P, M = K.mats, S = N.mats;
  const near = (e, x, z, r = 4) => Math.hypot((e.a[0] + e.b[0]) / 2 - x, (e.a[1] + e.b[1]) / 2 - z) < r;
  const sills = (y0, hs) => { const out = []; let y = y0; for (const h of hs) { out.push(y); y += h; } return out; };

  // ------------------------------------------------------------------------------------------ 13: Keldal house
  {
    const WALL = '#ece8dc', RED = '#b9685c', GREEN = NC.roofGreen, red = N.mats.red || K.mat(RED, { paint: 0.07 }), HC = 19.8;
    const ys = sills(5.7, [3.7, 3.6, 3.5]);
    const win = (y, o = {}) => ({ y, h: 2.0, w: 1.2, style: 'nord', mat: M.trim, frame: 'nordBrown', ...o });
    buildTenement(K, N, svc, {
      name: 'keldal', title: 'Дом Кельдаля (Каменноостровский, 13)', titleEn: 'Keldal house on Austrian Square (V. Schaub 1902-03)', ids: ['w42422601'], hc: HC, wall: WALL, court: '#ddd6c6', frame: 'nordBrown',
      plinthMat: N.rock(NC.graniteRed), pitch: 2.9, corniceMat: M.trim, roofMat: N.seam(GREEN),
      base: { kind: 'arch', h: 4.7, mat: K.mat('#e2ddd0', { map: N.texAshlar }), tile: 1.8, y0: 0.7, y1: 3.9, frameMat: red, w: 2.1, signEvery: 2 },
      floors: [win(ys[0]), win(ys[1]), win(ys[2]), win(ys[2] + 3.5, { h: 1.8 })],
      bands: [{ y0: 4.7, y1: 4.95, d: 0.12, mat: M.trim }, { y0: ys[2] - 0.75, y1: ys[2] - 0.35, d: 0.03, mat: N.majolica, uvs: 0.4 }],
      balconies: [{ floor: 0, bays: (i, n) => n > 3 && i % 4 === 1, w: 2.2 }, { floor: 2, bays: (i, n) => n > 3 && i % 4 === 3, w: 2.0 }],
      mansard: { mat: N.seam(GREEN), run: 1.6, rise: 2.4, D: 5.5, dormers: 7 },
      extra: (e, len, xs, top) => {
        // brick-red rough panels: a frieze under the cornice and aprons under the windows of the top floors (photo 37)
        K.wallQuad(red, 0.25, len - 0.25, HC - 2.9, HC - 1.2, 2, 0.011);
        xs.forEach((x, i) => { if (i % 2 === 0) K.wallQuad(red, x - 0.75, x + 0.75, ys[1] - 1.05, ys[1] - 0.15, 2, 0.011); });
        K.wallQuad(red, 0, len, 0.75, 1.5, 2, 0.02);
        // a horseshoe gable over every long front (the wings carry the tall ones)
        if (len > 13) { const m = len > 20 ? len * 0.28 : len / 2; N.attic(m - 3.2, m + 3.2, top - 0.1, 4.2, 'baroque', K.wall(WALL), { t: 0.5, z: 0.02, oculus: { y: 2.4, r: 0.55, mat: red } }); K.wallQuad(red, m - 2.0, m + 2.0, top + 0.2, top + 1.5, 2, 0.035); }
      },
      after: () => {
        tower(-1875.2, -3041.6, 2.9, 27.6, 3.0); tower(-1868.6, -3071.6, 2.5, 24.6, 2.2);
        function tower(x, z, r, y1, dh) {
          N.turret(x, z, r, HC - 1, y1, { n: 8, wall: K.wall(WALL), floors: [{ y: y1 - 3.2, h: 1.8, w: 1.0, style: 'nord', frame: 'nordBrown' }], bands: [[y1 - 4.4, y1 - 3.7, 0.02, red], [y1 - 1.0, y1 - 0.4, 0.02, red]],
            top: { kind: 'bell', h: dh, mat: N.seam(GREEN), r: 1.12, lantern: { h: 1.0, r: r * 0.28 }, spire: 1.6, ball: 0.14, corniceMat: M.trim } });
        }
      },
    });
  }

  // ------------------------------------------------------------------------------------------ 20 / Mira 10: Gorbov house
  {
    const WALL = '#cbbd9a', TRIM = '#e6dfca', DARK = '#8f8468', HC = 20.4, trim = K.wall(TRIM), dark = K.mat(DARK, { paint: 0.06 });
    const ys = sills(5.9, [3.8, 3.7, 3.6]);
    const win = (y, o = {}) => ({ y, h: 2.1, w: 1.25, style: 'key', mat: trim, frame: 'nordWhite', ...o });
    buildTenement(K, N, svc, {
      name: 'gorbov', title: 'Дом Горбова (Каменноостровский, 20 / ул. Мира, 10)', titleEn: 'Gorbov house on Austrian Square (V. Schaub 1901-02)', ids: ['w52104048'], hc: HC, wall: WALL, court: '#c2b594', trim, frame: 'nordWhite',
      pitch: 3.0, corniceMat: trim, roofMat: N.seam(NC.zinc),
      base: { kind: 'arch', h: 4.9, mat: K.rust('#c2b592'), tile: 2.4, tileY: 1.2, y0: 0.7, y1: 4.0, frameMat: trim, w: 2.0, signEvery: 3 },
      floors: [win(ys[0] - 0.9, { h: 2.2, style: 'arch', sw: 0.18, key2: trim, y: 5.8 }), win(ys[1]), win(ys[2]), win(ys[2] + 3.6, { h: 1.9, style: 'plain' })],
      bands: [{ y0: 4.9, y1: 5.2, d: 0.16, mat: trim }, { y0: ys[1] - 0.95, y1: ys[1] - 0.7, d: 0.1, mat: trim }],
      mansard: { mat: N.seam(NC.zinc), run: 1.5, rise: 2.8, D: 5.5, dormers: 6, dhead: 'arch' },
      extra: (e, len, xs, top) => {
        // giant pilaster strips over the three upper floors with dark rough panels between the windows (photo 40)
        if (len < 6 || xs.length < 2) return;
        const pp = xs[1] - xs[0];
        for (let i = 0; i <= xs.length; i++) { const x = i === 0 ? xs[0] - pp / 2 : i === xs.length ? xs[i - 1] + pp / 2 : (xs[i - 1] + xs[i]) / 2; K.pilaster(trim, x, 0.42, ys[1] - 0.7, HC - 1.2, 0.09, 0.3); }
        for (const x of xs) for (const k of [1, 2]) K.wallQuad(dark, x - 0.95, x + 0.95, ys[k] + 2.2, ys[k] + 2.2 + 1.25, 2, 0.011);
        if (near(e, -1940.4, -3077.4, 4)) { N.attic(len / 2 - 4.6, len / 2 + 4.6, top - 0.1, 5.2, 'baroque', K.wall(WALL), { t: 0.6, z: 0.03, window: { w: 1.1, h: 1.6, y: 0.9, style: 'arch', mat: trim, frame: 'nordWhite' } }); K.plane(K.R.cartouche, len / 2 - 1.5, len / 2 + 1.5, top + 2.6, top + 4.6, 0.06); }
      },
      after: () => {
        N.turret(-1944.2, -3066.5, 2.5, HC - 1.5, 23.6, { n: 10, wall: K.wall(WALL), floors: [{ y: 21.2, h: 1.5, w: 0.8, style: 'plain', mat: trim, frame: 'nordWhite' }], every: 2, top: { kind: 'bell', h: 2.6, mat: N.seam(NC.zinc), r: 1.12, lantern: { h: 0.9, r: 0.7 }, spire: 1.2, corniceMat: trim } });
        N.turret(-1932.3, -3092.9, 2.7, HC - 1.5, 27.2, { n: 8, wall: K.wall(WALL), floors: [{ y: 21.6, h: 1.7, w: 0.9, style: 'plain', mat: trim, frame: 'nordWhite' }, { y: 24.6, h: 1.6, w: 0.9, style: 'arch', mat: trim, frame: 'nordWhite', sw: 0.14 }],
          bands: [[23.9, 24.2, 0.08, trim]], top: { kind: 'helmet', h: 4.6, mat: N.seam(NC.zinc), r: 1.16, lantern: { h: 1.4, r: 0.75 }, spire: 3.2, ball: 0.16, corniceMat: trim } });
      },
    });
  }

  // ------------------------------------------------------------------------------------------ 16: Lipgart house
  {
    const WALL = '#b7b8ad', TRIM = '#d8d6c8', HC = 22.4, trim = K.wall(TRIM), rec = L.buildingById('r1267606');
    const ys = sills(5.6, [3.6, 3.7, 3.7, 3.5]);
    const win = (y, o = {}) => ({ y, h: 2.1, w: 1.2, style: 'key', mat: trim, frame: 'nordWhite', ...o });
    if (rec) buildTenement(K, N, svc, {
      name: 'lipgart', title: 'Дом Липгарта (Каменноостровский, 16)', titleEn: 'Liphart house on Austrian Square (V. Schaub 1905-06)', ids: ['r1267606'], polysOf: () => [rec.polys[0]], hc: HC, wall: WALL, court: '#aeb0a6', trim, frame: 'nordWhite',
      pitch: 2.9, corniceMat: trim, roofMat: N.seam(NC.roofGrey),
      base: { kind: 'arch', h: 4.7, mat: K.rust('#abada3'), tile: 2.4, tileY: 1.2, y0: 0.6, y1: 3.9, frameMat: trim, w: 2.2, signEvery: 2 },
      floors: [win(ys[0], { h: 1.9, style: 'plain' }), win(ys[1], { h: 2.2 }), win(ys[2], { h: 2.3, style: 'hood' }), win(ys[3], { h: 2.0 }), win(ys[3] + 3.5, { h: 1.7, style: 'arch', sw: 0.14 })],
      bands: [{ y0: 4.7, y1: 4.95, d: 0.14, mat: trim }, { y0: ys[1] - 0.8, y1: ys[1] - 0.6, d: 0.1, mat: trim }],
      balconies: [{ floor: 2, bays: (i, n) => n > 4 && i % 4 === 2, w: 2.1 }, { floor: 3, bays: (i, n) => n > 4 && i % 4 === 0, w: 2.0 }],
      mansard: { mat: N.seam(NC.roofGrey), run: 1.2, rise: 2.2, D: 5, dormers: 0 },
      extra: (e, len, xs, top) => {
        if (len > 30) { N.attic(len * 0.3 - 3.2, len * 0.3 + 3.2, top - 0.3, 3.9, 'flat', K.wall(WALL), { t: 0.5, z: 0.02 }); K.wallQuad(N.lattice, len * 0.3 - 2.7, len * 0.3 + 2.7, top + 0.3, top + 3.0, 1, 0.05); }
      },
      after: () => {
        // the round corner tower: three window tiers above the cornice, a baroque lantern and a green onion with a needle (photos 43 45)
        const x = -1904.4, z = -3028.0, G = N.scale('#5f8f70');
        N.turret(x, z, 2.7, 0.7, 27.6, { n: 12, wall: K.wall(WALL), a0: Math.atan2(0.2, -0.98) - 2.0, a1: Math.atan2(0.2, -0.98) + 2.0, every: 2, phase: 1, floors: [...ys.map((y) => ({ y, h: 2.0, w: 1.0, style: 'key', mat: trim, frame: 'nordWhite' })), { y: 23.4, h: 2.6, w: 1.0, style: 'arch', mat: trim, frame: 'nordWhite', sw: 0.16 }],
          bands: [[4.7, 4.95, 0.12, trim], [HC - 0.5, HC, 0.3, trim]], top: { kind: 'none', corniceMat: trim } });
        N.turret(x, z, 2.0, 27.7, 30.6, { n: 8, wall: K.wall(TRIM), floors: [{ y: 28.2, h: 1.6, w: 0.8, style: 'arch', mat: trim, frame: 'nordWhite', sw: 0.12 }], top: { kind: 'onion', h: 3.6, mat: G, r: 1.0, drum: { h: 0.5, mat: trim, r: 0.6 }, spire: 3.4, ball: 0.14, spireMat: S.gold, corniceMat: trim } });
        P.cap(N.seam(NC.roofGrey), ring(x, z, 2.7, 12), 27.7, true, 2);
      },
    });
  }

  // ------------------------------------------------------------------------------------------ 18 / Mira 11: Lepenberg house
  {
    const WALL = '#d6a877', TRIM = '#efe3cb', HC = 20.6, trim = K.wall(TRIM), rec = L.buildingById('r1267607');
    const ys = sills(5.5, [3.7, 3.6, 3.5]);
    const win = (y, o = {}) => ({ y, h: 2.0, w: 1.15, style: 'hood', mat: trim, frame: 'white', ...o });
    if (rec) buildTenement(K, N, svc, {
      name: 'lepenberg', title: 'Дом Лепенберга (Каменноостровский, 18 / ул. Мира, 11)', titleEn: 'Lepenberg house (A. Kovsharov 1899-1901)', ids: ['r1267607'], polysOf: () => [rec.polys[0]], hc: HC, wall: WALL, court: '#c9a57e', trim, frame: 'white',
      pitch: 2.8, corniceMat: trim, base: { kind: 'shop', h: 4.5, mat: K.rust('#c99a6c'), tile: 2.4, tileY: 1.2, frameMat: trim, signEvery: 2, awnings: 4 },
      floors: [win(ys[0]), win(ys[1], { style: 'plain' }), win(ys[2], { style: 'key' }), win(ys[2] + 3.5, { h: 1.8, style: 'plain' })],
      bands: [{ y0: 4.5, y1: 4.75, d: 0.14, mat: trim }, { y0: ys[1] - 0.75, y1: ys[1] - 0.55, d: 0.08, mat: trim }],
      balconies: [{ floor: 1, bays: (i, n) => n > 4 && i % 5 === 2, w: 2.0 }],
      mansard: { mat: N.scale('#4f8f6c'), run: 1.0, rise: 2.9, D: 5.5, dormers: 4.2, dormerMat: K.wall(TRIM) },
    });
  }

  // ------------------------------------------------------------------------------------------ 15 / Mira 12: the 1952 house
  {
    const WALL = '#dba98b', TRIM = '#eedfc6', HC = 21.4, trim = K.wall(TRIM);
    const ys = sills(6.0, [3.7, 3.7, 3.6]);
    const win = (y, o = {}) => ({ y, h: 2.1, w: 1.3, style: 'plain', mat: trim, frame: 'white', ...o });
    buildTenement(K, N, svc, {
      name: 'k15', title: 'Каменноостровский, 15 (1952)', titleEn: 'Kamennoostrovsky 15 on Austrian Square (O. Guryev, A. Shcherbenok 1952)', ids: ['w27046419'], hc: HC, wall: WALL, court: '#cfa387', trim, frame: 'white',
      pitch: 3.1, corniceMat: trim, corniceScale: 1.25, plinthMat: N.ashlar(NC.granite),
      base: { kind: 'arch', h: 5.4, mat: K.rust('#d2a183'), tile: 2.4, tileY: 1.2, y0: 0.8, y1: 4.2, frameMat: trim, w: 1.9, signEvery: 3 },
      floors: [win(ys[0] - 0.4, { h: 1.9, y: 5.9 }), win(ys[1], { style: 'hood' }), win(ys[2]), win(ys[2] + 3.6, { h: 1.9 })],
      bands: [{ y0: 5.4, y1: 5.7, d: 0.2, mat: trim }, { y0: ys[1] - 0.9, y1: ys[1] - 0.65, d: 0.3, mat: trim }],
      balconies: [{ floor: 1, kind: 'stone', bays: (i, n) => n > 3 && (i === 0 || i === n - 1), w: 2.4, hex: TRIM, mat: trim }],
      extra: (e, len, xs, top) => {
        // relief panels between the windows of the two middle floors, the attic with the cartouche over the square front (photo 35)
        for (const x of xs) K.plane(K.R.panel, x - 0.6, x + 0.6, ys[1] + 2.25, ys[1] + 3.15, 0.03);
        if (near(e, -1896.2, -3104.9, 5)) { N.attic(0.4, len - 0.4, top - 0.05, 1.5, 'flat', K.wall(WALL), { t: 0.5, z: 0.02 }); N.attic(len / 2 - 2.4, len / 2 + 2.4, top + 1.4, 1.5, 'round', K.wall(WALL), { t: 0.5, z: 0.02 }); K.plane(K.R.cartouche, len / 2 - 1.0, len / 2 + 1.0, top + 0.5, top + 2.5, 0.06); }
      },
    });
  }

  svc.photoSpots.push({ x: -1906, z: -3064, yaw: L.yawToward(-1906, -3064, -1870, -3050), pitch: 12, name: 'Австрийская площадь · дом Кельдаля' });
  svc.photoSpots.push({ x: -1900, z: -3070, yaw: L.yawToward(-1900, -3070, -1940, -3078), pitch: 14, name: 'Австрийская площадь · дом Горбова' });
}
const ring = (x, z, r, n) => Array.from({ length: n }, (_, i) => [x + Math.sin((i / n) * Math.PI * 2) * r, z + Math.cos((i / n) * Math.PI * 2) * r]);
