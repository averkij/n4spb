// landmarksKamennoostrovsky/bolshoy.js - three more fronts of Bolshoy pr. P. S. between the House with Owls and Lev Tolstoy Square.  docs/research/kamennoostrovsky.md section 7d; photos 64, 65, 74.
//   r2142991  Bolshoy 69 / Ordinarnaya ul.: the Alyushinsky house (D. Ustrugov 1910-11, Art Nouveau with Gothic motifs): cream, turquoise glazed-tile panels, a dark rough base, the round corner
//             tower bay from the second floor to a pointed helmet dome over a ring of lancet openings, shaped gables
//   r1248810  Bolshoy 49 / ul. Lenina 18: the Badaev house (P. Suzor 1902-03, eclectic): peach with cream trim, two bay windows under pediments, the rounded corner, a dark-red dome over the
//             middle of the avenue front (the corner tower is lost)
//   r2106382  Bolshoy 74 / Podrezova / Barmaleeva: the Antonova house with the former cinema "Svet" (V. Schaub 1912-13, neoclassical revival): grey, six storeys and a mansard, giant pilasters
import { buildTenement } from './tenement.js';
import { NC } from './nouveau.js';

export function build(K, N, svc) {
  const L = K.L, P = K.P, M = K.mats, S = N.mats;
  const near = (e, x, z, r = 4) => Math.hypot((e.a[0] + e.b[0]) / 2 - x, (e.a[1] + e.b[1]) / 2 - z) < r;
  /** outward direction (frame angle of N.turret) of a footprint corner seen from the centroid of the house */
  const outOf = (rec, x, z) => Math.atan2(x - rec.cx, z - rec.cz);

  // ------------------------------------------------------------------------------------------ 69: Alyushinsky house
  {
    const WALL = '#e9e2c4', TURQ = '#3f9a8c', HC = 21.6, trim = K.wall('#f1ebd4'), wall = K.wall(WALL), turq = K.mat(TURQ, { paint: 0.03 }), ys = [5.5, 9.2, 12.9, 16.6];
    const rec = L.buildingById('r2142991');
    const win = (y, o = {}) => ({ y, h: 2.0, w: 1.15, style: 'nord', mat: trim, frame: 'nordBrown', ...o });
    if (rec) buildTenement(K, N, svc, {
      name: 'alyushinsky', title: 'Дом Алюшинского (Большой пр., 69)', titleEn: 'Alyushinsky house, Bolshoy 69 (D. Ustrugov 1910-11)', ids: ['r2142991'], hc: HC, wall: WALL, court: '#d9d2b6', trim, frame: 'nordBrown',
      pitch: 3.0, corniceMat: trim, plinthMat: N.rock(NC.granite),
      base: { kind: 'shop', h: 4.7, mat: N.rock('#77736e'), tile: 2.4, tileY: 1.6, frameMat: S.stoneDark, signEvery: 2 },
      floors: [win(ys[0]), win(ys[1], { style: 'arch', sw: 0.14, h: 2.2 }), win(ys[2]), win(ys[3], { h: 1.8 })],
      bands: [{ y0: 4.7, y1: 4.95, d: 0.12, mat: trim }, { y0: ys[2] - 0.95, y1: ys[2] - 0.35, d: 0.03, mat: turq }],
      balconies: [{ floor: 1, bays: (i, n) => n > 4 && i % 5 === 2, w: 2.1 }],
      extra: (e, len, xs, top) => {
        // turquoise tile panels under the top-floor windows, a shaped gable on every long front (photo 64)
        for (const x of xs) K.wallQuad(turq, x - 0.5, x + 0.5, ys[3] - 0.85, ys[3] - 0.2, 2, 0.011);
        if (len > 30) for (const m of [len * 0.22, len * 0.78]) N.attic(m - 2.8, m + 2.8, top - 0.1, 3.0, 'baroque', wall, { t: 0.45, z: 0.02, oculus: { y: 1.5, r: 0.4, mat: trim } });
      },
      after: () => {
        // the round corner tower bay: from the second floor, two storeys above the cornice, lancet openings in turquoise, a pointed helmet dome
        const cx = -2299.2, cz = -3564.6, a = outOf(rec, -2299.6, -3566.0), r = 2.9, YT = 26.6;
        N.turret(cx, cz, r, 4.8, YT, { n: 10, a0: a - 2.1, a1: a + 2.1, wall, every: 2, phase: 0, floors: [...ys.map((y) => ({ y, h: 1.9, w: 0.9, style: 'nord', mat: trim, frame: 'nordBrown' })), { y: 21.6, h: 2.0, w: 0.9, style: 'nord', mat: trim, frame: 'nordBrown' }],
          bands: [[4.8, 5.1, 0.12, trim], [ys[2] - 0.95, ys[2] - 0.35, 0.03, turq], [HC - 0.3, HC + 0.1, 0.25, trim]], top: { kind: 'none', corniceMat: trim } });
        P.cap(K.mats.roofSilver, ring(cx, cz, r, 14), 4.8, false, 2);
        N.turret(cx, cz, r * 0.92, YT + 0.14, YT + 1.9, { n: 10, wall, floors: [{ y: YT + 0.3, h: 1.4, w: 0.8, style: 'none', frame: 'nordGreen', head: 'arch' }], top: { kind: 'onion', h: 3.6, mat: wall, r: 1.02, spire: 0.9, corniceMat: trim } });
      },
    });
  }

  // ------------------------------------------------------------------------------------------ 49: Badaev house
  {
    const WALL = '#e2b48f', HC = 21.2, trim = K.wall('#efe2c8'), wall = K.wall(WALL), ys = [5.5, 9.2, 12.9, 16.6];
    const rec = L.buildingById('r1248810');
    const win = (y, o = {}) => ({ y, h: 2.0, w: 1.15, style: 'hood', mat: trim, frame: 'brown', ...o });
    const isAvenue = (e) => !e.hole && near(e, -2563.45, -3240.1, 5);
    if (rec) buildTenement(K, N, svc, {
      name: 'badaev', title: 'Дом Бадаева (Большой пр., 49 / ул. Ленина, 18)', titleEn: 'Badaev house, Bolshoy 49 (P. Suzor 1902-03)', ids: ['r1248810'], hc: HC, wall: WALL, court: '#d2a886', trim, frame: 'brown',
      pitch: 2.95, corniceMat: trim, corniceScale: 1.15, plinthMat: N.ashlar(NC.graniteRed), railing: true,
      base: { kind: 'shop', h: 4.6, mat: K.rust('#d6a783'), tile: 2.4, tileY: 1.2, frameMat: trim, signEvery: 2, awnings: 5 },
      floors: [win(ys[0], { style: 'plain' }), win(ys[1]), win(ys[2], { style: 'key' }), win(ys[3], { h: 1.8, style: 'plain' })],
      skip: (len) => (len > 30 ? [len * 0.27, len * 0.73].map((u) => [u - 1.6, u + 1.6]) : null),
      bands: [{ y0: 4.6, y1: 4.85, d: 0.14, mat: trim }, { y0: ys[1] - 0.8, y1: ys[1] - 0.6, d: 0.1, mat: trim }],
      balconies: [{ floor: 2, bays: (i, n) => n > 5 && i === Math.floor(n / 2), w: 2.6 }],
      extra: (e, len, xs, top) => {
        if (len <= 30) return;
        // two flat bay windows through three floors under pediments (photo 65)
        for (const u of [len * 0.27, len * 0.73]) {
          N.erker(u, 3.1, 0.7, 5.0, 16.3, { plan: 'box', wall, corbel: 'brackets', corbelMat: trim, top: 'slab', topMat: trim, bands: [[8.6, 8.85, 0.06, trim], [12.3, 12.55, 0.06, trim], [16.0, 16.3, 0.1, trim]],
            face: (fl, k) => { if (k === 1) for (const y of ys.slice(0, 3)) N.window({ x: fl / 2, y, w: 1.9, h: 2.1, style: 'plain', mat: trim, frame: 'brown' }); } });
          N.attic(u - 1.75, u + 1.75, 16.3, 1.2, 'tri', trim, { t: 0.7, z: 0.7 });
        }
        // the dark-red dome over the middle of the avenue front
        if (isAvenue(e)) { N.attic(len / 2 - 3.4, len / 2 + 3.4, top - 0.1, 2.2, 'flat', wall, { t: 3.6, z: 0.02, window: { w: 1.2, h: 1.3, y: 0.5, style: 'plain', mat: trim, frame: 'brown' } }); N.lathe(N.scale('#7a4238'), 'bell', N.PROF.bell, len / 2, top + 2.1, -1.8, 2.7, 3.6, 14); P.cyl(S.zinc, [len / 2, top + 5.6, -1.8], [len / 2, top + 7.0, -1.8], 0.06, 0.015, 6, false); }
      },
      after: () => {
        // the rounded corner toward ul. Lenina (its tower top is lost: a plain drum under the cornice)
        const a = outOf(rec, -2551.3, -3255.0);
        N.turret(-2551.3 - Math.sin(a) * 1.6, -3255.0 - Math.cos(a) * 1.6, 2.7, 4.8, HC + 0.4, { n: 9, a0: a - 1.9, a1: a + 1.9, wall, every: 2, floors: ys.map((y) => ({ y, h: 1.9, w: 0.9, style: 'plain', mat: trim, frame: 'brown' })),
          bands: [[4.8, 5.05, 0.12, trim], [HC - 0.5, HC, 0.3, trim]], top: { kind: 'dome', h: 0.9, mat: N.seam(NC.roofGrey), r: 1.0, corniceMat: trim } });
      },
    });
  }

  // ------------------------------------------------------------------------------------------ 74: Antonova house (cinema "Svet")
  {
    const WALL = '#b5b1a4', HC = 24.2, trim = K.wall('#c6c2b5'), wall = K.wall(WALL), ys = [5.6, 9.2, 12.8, 16.4, 20.1];
    const win = (y, o = {}) => ({ y, h: 2.0, w: 1.2, style: 'plain', mat: trim, frame: 'white', sw: 0.12, ...o });
    const isAvenue = (e) => !e.hole && near(e, -2441.0, -3432.0, 5);
    buildTenement(K, N, svc, {
      name: 'antonova', title: 'Дом Антоновой (Большой пр., 74)', titleEn: 'Antonova house with the former cinema "Svet", Bolshoy 74 (V. Schaub 1912-13)', ids: ['r2106382'], hc: HC, wall: WALL, court: '#a9a598', trim, frame: 'white',
      pitch: 3.05, corniceMat: trim, corniceScale: 1.2, plinthMat: N.rock(NC.granite),
      base: { kind: 'shop', h: 4.7, mat: N.ashlar('#bab6a9'), tile: 1.8, frameMat: trim, signEvery: 2, awnings: 4 },
      floors: [win(ys[0], { style: 'key' }), win(ys[1], { style: 'hood', h: 2.2 }), win(ys[2]), win(ys[3]), win(ys[4], { h: 1.8 })],
      bands: [{ y0: 4.7, y1: 4.95, d: 0.14, mat: trim }, { y0: ys[1] - 0.85, y1: ys[1] - 0.6, d: 0.22, mat: trim }, { y0: ys[4] - 0.75, y1: ys[4] - 0.5, d: 0.12, mat: trim }],
      balconies: [{ floor: 1, kind: 'stone', bays: (i, n) => n > 4 && i % 4 === 1, w: 2.2, mat: trim, hex: '#c6c2b5' }, { floor: 3, bays: (i, n) => n > 4 && i % 4 === 3, w: 2.0 }],
      mansard: { mat: N.seam(NC.roofGrey), run: 1.3, rise: 2.7, D: 5.5, dormers: 6 },
      extra: (e, len, xs, top) => {
        // giant pilasters over floors 3-5, a baroque attic over the middle of the avenue front (photo 74)
        if (len > 6 && xs.length > 1) { const pp = xs[1] - xs[0]; for (let i = 0; i <= xs.length; i += 2) { const x = i === 0 ? xs[0] - pp / 2 : i >= xs.length ? xs[xs.length - 1] + pp / 2 : (xs[i - 1] + xs[i]) / 2; K.pilaster(trim, x, 0.45, ys[1] - 0.6, ys[4] - 0.75, 0.1, 0.4); } }
        if (isAvenue(e)) N.attic(len / 2 - 3.6, len / 2 + 3.6, top - 0.1, 3.4, 'baroque', wall, { t: 0.5, z: 0.02, oculus: { y: 1.7, r: 0.5, mat: trim } });
      },
    });
  }
}
const ring = (x, z, r, n) => Array.from({ length: n }, (_, i) => [x + Math.sin((i / n) * Math.PI * 2) * r, z + Math.cos((i / n) * Math.PI * 2) * r]);
