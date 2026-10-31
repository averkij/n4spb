// landmarksKamennoostrovsky/showpieces.js - three showpieces away from the two squares.  docs/research/kamennoostrovsky.md sections 4-6; photos refs/kamennoostrovsky 50-58.
//   r3570513  Bolshoy pr. 44: the HOUSE WITH OWLS (доходный дом Т. Н. Путиловой, I. Pretro 1906-07, Northern Modern): warm grey roughcast over a socle of rough-hewn grey granite with pointed shop
//             arches, the pointed portal with two stone owls, the round corner bay with a curved iron balcony and the eagle, twin steep gables, zinc tents and dormers
//   r1263723  Kamennoostrovsky 26-28: the BENOIS HOUSE (L., Yu. and A. Benois + A. Gunst 1911-14, neoclassical revival): grey stone-coloured terrazzo, a giant order on the two lower floors of the
//             avenue front, balustraded balconies and roof parapet; the huge footprint (9 100 m2, 180 vertices, court of honour open to the avenue) is taken from OSM as it is
//   r1263830  Kamennoostrovsky 19 / Bolshaya Monetnaya 13: the VOEYKOVA HOUSE (S. Minash 1911-12, neoclassical revival): pale yellow over a grey rusticated two-storey base, the rounded corner
//             with four giant fluted half-columns under a low drum
import { buildTenement } from './tenement.js';
import { ringFromFlat } from '../lib/massing.js';
import { NC } from './nouveau.js';
import { Sculpt, cached, figureMats } from '../lib/figures.js';

export function build(K, N, svc) {
  const L = K.L, P = K.P, M = K.mats, S = N.mats;
  const near = (e, x, z, r = 4) => Math.hypot((e.a[0] + e.b[0]) / 2 - x, (e.a[1] + e.b[1]) / 2 - z) < r;
  const sills = (y0, hs) => { const out = [y0]; let y = y0; for (const h of hs) { y += h; out.push(y); } return out; };

  // ------------------------------------------------------------------------------------------ Bolshoy 44: House with Owls
  {
    const WALL = '#b5a792', HC = 23.2, rock = N.rock('#8d8b88'), plain = K.wall('#c2b5a0'), zinc = N.seam('#9aa4ac'), ys = sills(6.5, [3.4, 3.4, 3.4, 3.3]);
    const win = (y, o = {}) => ({ y, h: 1.9, w: 1.1, style: 'nord', mat: plain, frame: 'nordBrown', ...o });
    const stoneM = figureMats(K.ctx).keys('granite');
    buildTenement(K, N, svc, {
      name: 'owls', title: 'Дом с совами (дом Путиловой, Большой пр., 44)', titleEn: 'House with Owls (Putilova house, I. Pretro 1906-07)', ids: ['r3570513'], hc: HC, wall: WALL, court: '#a99c88', trim: plain, frame: 'nordBrown',
      pitch: 3.1, cornice: 'none', plinth: 0.5, plinthMat: N.ashlar(NC.graniteRed), roofMat: zinc,
      base: { kind: 'none', h: 5.3, mat: rock, tile: 2.4, tileY: 1.6 },
      floors: [win(ys[0], { h: 2.1, w: 1.25 }), win(ys[1], { at: (i) => (i % 3 === 1 ? { style: 'arch', sw: 0.001, w: 1.3, h: 2.2 } : null) }), win(ys[2], { w: 0.95 }), win(ys[3], { at: (i) => (i % 4 === 2 ? { w: 1.5 } : null) }), win(ys[4], { h: 1.6, w: 0.9 })],
      bands: [{ y0: HC - 0.25, y1: HC + 0.2, d: 0.35, mat: plain }],
      balconies: [{ floor: 1, kind: 'bars', bays: (i, n) => n > 5 && i % 6 === 4, w: 2.4 }, { floor: 3, kind: 'bars', bays: (i, n) => n > 5 && i % 6 === 1, w: 2.2 }],
      mansard: { mat: zinc, run: 2.2, rise: 3.4, D: 6, dormers: 7.5, dw: 1.6, dh: 1.9, dormerMat: K.wall(WALL) },
      extra: (e, len, xs, top) => {
        // ground floor in rough granite: shop windows under flat pointed arches, the granite climbs in steps at the piers (photo 57)
        const isB = near(e, -2803.5, -2984.5, 6), mid = Math.floor(xs.length / 2);
        xs.forEach((x, i) => {
          if (isB && i === mid) return;
          if (N.blocked(x - 1.4, x + 1.4, 0.4, 4.6)) return;
          N.lancet({ x, w: 2.3, y0: 0.55, ys: 2.6, ya: 3.95, sw: 0.02, d: 0.05, mat: rock, fill: 'lattice' });
          P.box(S.stoneDark, x - 1.2, x + 1.2, 0.45, 0.6, 0, 0.14, 'k');
        });
        for (let i = 0; i <= xs.length; i += 2) { const x = i === 0 ? 0.5 : i >= xs.length ? len - 0.5 : (xs[i - 1] + xs[i]) / 2; K.wallQuad(rock, x - 0.45, x + 0.45, 5.3, 6.3 + (i % 4 ? 0.6 : 0), 2.4, 0.012, 1.6); }
        if (isB) {
          // the pointed portal of the main stair with the two owls (photos 54 57)
          const x = xs[mid];
          N.lancet({ x, w: 2.2, ys: 2.6, ya: 4.7, sw: 0.75, d: 0.5, mat: rock, fill: 'door', doorW: 1.6, doorH: 2.5, doorMat: S.doorGreen, teeth: 3 });
          const owl = cached('lmKam-owl', owlFigure);
          for (const s of [-1, 1]) { P.box(S.stone, x + s * 1.75 - 0.3, x + s * 1.75 + 0.3, 3.0, 3.25, 0.3, 0.95, 'k'); owl.place(P, stoneM, x + s * 1.75, 3.25, 0.62, s * -0.35, 1.25); }
          N.attic(len * 0.5 - 4.2, len * 0.5 + 4.2, top, 5.4, 'tri', K.wall(WALL), { t: 0.5, z: 0.02, window: { w: 0.8, h: 1.5, y: 1.0, style: 'nord', mat: plain, frame: 'nordBrown' } });
        }
        // twin steep gables at both ends of the long side fronts (the corner silhouettes)
        if (len > 40) for (const m of [4.6, len - 4.6]) N.attic(m - 4.0, m + 4.0, top, 6.2, 'tri', K.wall(WALL), { t: 0.5, z: 0.02, window: { w: 0.8, h: 1.5, y: 1.2, style: 'nord', mat: plain, frame: 'nordBrown' } });
      },
      after: () => {
        // the round bay of the Strelninskaya corner: three floors, a curved iron balcony, the eagle above it (photos 55 56)
        const cx = -2814.6, cz = -2974.2;                                                // just inside the corner of Bolshoy pr. and Strelninskaya ul.
        const out = Math.atan2(-2813.7 - (-2827.5), -2971.7 - (-3003.1));
        N.turret(cx, cz, 2.6, 5.3, 19.4, { n: 9, a0: out - 1.7, a1: out + 1.7, wall: K.wall(WALL), every: 2, floors: [ys[0], ys[1], ys[2], ys[3]].map((y) => ({ y, h: 2.0, w: 0.9, style: 'nord', mat: plain, frame: 'nordBrown' })), top: { kind: 'cone', h: 1.3, mat: K.wall(WALL), r: 1.0, cornice: false } });
        P.cyl(S.iron, [cx, ys[2] - 0.2, cz], [cx, ys[2] - 0.05, cz], 3.5, 3.5, 18, true);
        for (let i = 0; i < 9; i++) { const t = out - 1.5 + (3.0 * i) / 8; P.cyl(S.iron, [cx + Math.sin(t) * 3.45, ys[2] - 0.05, cz + Math.cos(t) * 3.45], [cx + Math.sin(t) * 3.45, ys[2] + 0.95, cz + Math.cos(t) * 3.45], 0.03, 0.03, 4, false); }
        for (let i = 0; i < 8; i++) { const t0 = out - 1.5 + (3.0 * i) / 8, t1 = t0 + 3.0 / 8; for (const y of [ys[2] + 0.95, ys[2] + 0.55]) P.cyl(S.iron, [cx + Math.sin(t0) * 3.45, y, cz + Math.cos(t0) * 3.45], [cx + Math.sin(t1) * 3.45, y, cz + Math.cos(t1) * 3.45], 0.03, 0.03, 4, false); }
        cached('lmKam-eagle', eagleFigure).place(P, stoneM, cx + Math.sin(out) * 2.75, 20.3, cz + Math.cos(out) * 2.75, out, 1.5);
      },
    });
    svc.photoSpots.push({ x: -2796, z: -2975, yaw: L.yawToward(-2796, -2975, -2806, -2986), pitch: 16, name: 'Большой проспект П. С. · Дом с совами' });
  }

  // ------------------------------------------------------------------------------------------ Kamennoostrovsky 26-28: Benois house
  {
    const WALL = '#b8b5a9', HC = 22.6, ash = N.ashlar('#bdbaae'), trim = K.wall('#c8c5ba'), ys = sills(5.4, [3.6, 3.7, 3.5, 3.4]);
    const win = (y, o = {}) => ({ y, h: 2.0, w: 1.2, style: 'plain', mat: trim, frame: 'white', sw: 0.12, ...o });
    const avenue = (e) => e.n[0] > 0.6 && e.n[1] < 0;                                 // the fronts that look ENE at the avenue
    buildTenement(K, N, svc, {
      name: 'benois', title: 'Дом Бенуа (Каменноостровский, 26—28)', titleEn: 'Benois house (L., Yu., A. Benois, A. Gunst 1911-14)', ids: ['r1263723'], hc: HC, wall: WALL, court: '#aeaba0', trim, frame: 'white', reach: 47,
      pitch: 3.0, corniceMat: trim, corniceScale: 1.15, plinth: 0.9, plinthMat: N.rock(NC.graniteRose), courtPitch: 3.4,
      base: { kind: 'shop', h: 9.0, mat: ash, tile: 1.8, tileY: 0.9, frameMat: trim, signEvery: 3, y1: 3.7 },
      floors: [win(ys[0], { style: 'key' }), win(ys[1], { style: 'hood', h: 2.2 }), win(ys[2]), win(ys[3]), win(ys[4], { h: 1.7 })],
      bands: [{ y0: 4.6, y1: 4.85, d: 0.1, mat: trim }, { y0: 8.75, y1: 9.1, d: 0.3, mat: trim }, { y0: ys[4] - 0.7, y1: ys[4] - 0.5, d: 0.08, mat: trim }],
      extra: (e, len, xs, top) => {
        // the balustraded balcony run over the two-storey base, the giant engaged order on the avenue fronts, the roof balustrade (photo 52)
        if (len < 5.5) return;
        N.parapet(0.15, len - 0.15, 9.1, 0.32, { mat: trim, hex: '#c8c5ba', gap: 3.0, h: 0.8, t: 0.2 });
        if (avenue(e) && xs.length > 1) { const pp = xs[1] - xs[0]; for (let i = 0; i <= xs.length; i++) { const x = i === 0 ? xs[0] - pp / 2 : i === xs.length ? xs[i - 1] + pp / 2 : (xs[i - 1] + xs[i]) / 2; K.column(trim, x, 0.3, 0.9, 8.5, 0.36, { volutes: false, capH: 0.5, seg: 10 }); } }
        if (len > 12) N.parapet(0.2, len - 0.2, top, 0.25, { mat: trim, hex: '#c8c5ba', gap: 3.2, h: 0.9 });
        if (avenue(e) && len > 6) N.attic(len / 2 - 2.6, len / 2 + 2.6, top, 2.2, 'round', K.wall(WALL), { t: 0.45, z: 0.02, oculus: { y: 1.0, r: 0.45, mat: trim } });
      },
    });
    svc.photoSpots.push({ x: -2040, z: -3352, yaw: L.yawToward(-2040, -3352, -2070, -3340), pitch: 12, name: 'Каменноостровский проспект · Дом Бенуа' });
  }

  // ------------------------------------------------------------------------------------------ Kamennoostrovsky 19: Voeykova house
  {
    const WALL = '#e2cd8e', TRIM = '#efe9da', BASE = '#a9a79e', HC = 21.6, trim = K.wall(TRIM), ys = sills(5.3, [3.9, 3.8, 3.7]);
    const win = (y, o = {}) => ({ y, h: 2.1, w: 1.25, style: 'plain', mat: trim, frame: 'white', ...o });
    const rec = L.buildingById('r1263830'), corner = [-1962.6, -3217.0];
    if (rec) buildTenement(K, N, svc, {
      name: 'voeykova', title: 'Дом Воейковой (Каменноостровский, 19)', titleEn: 'Voeykova house (S. Minash 1911-12)', ids: ['r1263830'], hc: HC, wall: WALL, court: '#d5c089', trim, frame: 'white',
      pitch: 3.05, corniceMat: trim, corniceScale: 1.3, plinthMat: N.rock(NC.granite),
      base: { kind: 'plain', h: 8.6, mat: K.rust(BASE), tile: 2.4, tileY: 1.2, sill: 1.4, winH: 2.2, w: 1.3, trim: K.wall('#bcbab1'), style: 'key' },
      floors: [win(ys[0], { h: 1.9, mat: K.wall('#bcbab1'), style: 'key' }), win(ys[1], { style: 'hood', h: 2.3 }), win(ys[2]), win(ys[3], { h: 1.9 })],
      bands: [{ y0: 8.6, y1: 8.95, d: 0.25, mat: trim }],
      extra: (e, len, xs, top) => {
        // pilaster porticos of four on the long fronts, a low pediment over each (photo 58)
        if (len > 25 && xs.length > 5) { const pp = xs[1] - xs[0], k0 = Math.floor(xs.length / 2) - 2; for (let i = 0; i < 5; i++) K.pilaster(trim, xs[k0 + i] - pp / 2, 0.55, 8.95, HC - 1.4, 0.14, 0.5); N.attic(xs[k0] - pp / 2 - 0.6, xs[k0 + 4] - pp / 2 + 0.6, top - 0.1, 2.2, 'tri', K.wall(TRIM), { t: 0.4, z: 0.1 }); }
        N.parapet(0.15, len - 0.15, 8.95, 0.25, { mat: trim, hex: TRIM, gap: 3.0, h: 0.7, t: 0.18 });
      },
      after: () => {
        // the rounded corner: fluted half-columns three floors tall at the vertices of the arc, the low drum above (photo 58)
        const c = [rec.cx, rec.cz], ring = ringFromFlat(rec.polys[0].o).filter((p) => Math.hypot(p[0] - corner[0], p[1] - corner[1]) < 6.5);
        for (const p of ring) { const dx = p[0] - c[0], dz = p[1] - c[1], l = Math.hypot(dx, dz); K.column(trim, p[0] + (dx / l) * 0.35, p[1] + (dz / l) * 0.35, 8.95, HC - 1.5, 0.5, { capH: 1.1, seg: 12 }); }
        const out = Math.atan2(corner[0] - c[0], corner[1] - c[1]), cx = corner[0] - Math.sin(out) * 3.6, cz = corner[1] - Math.cos(out) * 3.6;
        N.turret(cx, cz, 4.6, HC + 0.4, HC + 2.4, { n: 14, wall: K.wall(TRIM), top: { kind: 'dome', h: 1.3, mat: N.seam(NC.zinc), r: 1.02, corniceMat: trim } });
      },
    });
  }
}

/** a stone owl sitting on a ledge (figure frame: faces +z, 0.6 m tall): body, round head with ear tufts, eye discs, beak, folded wings, toes */
function owlFigure() {
  const S = new Sculpt({ detail: 1 }), o = { w: 9, h: 7 };
  S.blob('main', [0, 0.26, 0], [0.17, 0.25, 0.15], o);
  S.blob('main', [0, 0.5, 0.02], [0.16, 0.13, 0.14], o);
  for (const s of [-1, 1]) {
    S.blobBetween('main', [s * 0.1, 0.56, 0.0], [s * 0.15, 0.68, -0.01], 0.035, 0.03, { w: 6, h: 5 });
    S.blob('main', [s * 0.065, 0.515, 0.115], [0.058, 0.058, 0.03], { w: 8, h: 5 });
    S.blob('dark', [s * 0.065, 0.515, 0.14], [0.026, 0.026, 0.012], { w: 6, h: 4 });
    S.blob('main', [s * 0.16, 0.27, -0.02], [0.05, 0.2, 0.12], o);
    S.blobBetween('main', [s * 0.06, 0.03, 0.08], [s * 0.07, 0.02, 0.17], 0.022, 0.022, { w: 5, h: 4 });
  }
  S.blobBetween('main', [0, 0.49, 0.13], [0, 0.44, 0.15], 0.02, 0.02, { w: 5, h: 4 });
  S.blob('main', [0, 0.08, -0.12], [0.07, 0.1, 0.05], { w: 6, h: 5 });
  return S.finish();
}
/** the eagle of the corner bay: body, head with a hooked beak, two raised wings as feathered sheets, tail (figure frame: faces +z, wingspan 1.2 m) */
function eagleFigure() {
  const S = new Sculpt({ detail: 1 }), o = { w: 9, h: 7 };
  S.blob('main', [0, 0.3, 0.05], [0.14, 0.24, 0.16], o);
  S.blob('main', [0, 0.58, 0.14], [0.08, 0.1, 0.1], o);
  S.blobBetween('main', [0, 0.57, 0.22], [0, 0.5, 0.3], 0.03, 0.025, { w: 5, h: 4 });
  S.blob('main', [0, 0.06, -0.06], [0.1, 0.16, 0.05], { w: 6, h: 5 });
  for (const s of [-1, 1]) {
    S.sheet('main', [[s * 0.1, 0.42, 0.0], [s * 0.34, 0.86, -0.06], [s * 0.62, 0.72, -0.08], [s * 0.66, 0.36, -0.08], [s * 0.4, 0.12, -0.05], [s * 0.14, 0.2, 0.0]], 0.02);
    S.blobBetween('main', [s * 0.1, 0.42, 0.01], [s * 0.36, 0.84, -0.05], 0.045, 0.04, { w: 6, h: 5 });
    S.blobBetween('main', [s * 0.05, 0.08, 0.1], [s * 0.06, 0.0, 0.18], 0.025, 0.025, { w: 5, h: 4 });
  }
  return S.finish();
}
