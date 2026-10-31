// landmarksKamennoostrovsky/tolstoy.js - the other houses of LEV TOLSTOY SQUARE (площадь Льва Толстого) around the House with Towers (towers.js).
// docs/research/kamennoostrovsky.md section 2; photos refs/kamennoostrovsky 15-31, 59, 70, 71.
//   r1249813   Kamennoostrovsky 38 / Bolshoy 96: the Chubakov house (V. Van der Gucht 1910-11): pale rose and grey, round corner under an arcaded belvedere with a dark dome (restored 2010)
//   w163290692 Kamennoostrovsky 31-33 / ul. Lva Tolstogo 1-3: the Korzinin house (P. Mulkhanov 1903-04): brick pink with cream trim, a concave front on the square between two corner bay turrets
//   r1257106   Bolshoy 98: the Maizel house (D. Kryzhanovsky 1910-11): peach, the big semicircular gable toward the square
//   r1256096 + r1256097  Kamennoostrovsky 37: the House of Fashion with the Petrogradskaya metro vestibule (1963-68): a flat grey-beige stone slab, a glazed ground floor, the plain blue "М"
//   w40260868  Kamennoostrovsky 36 / Bolshoy 73: the former Oldenburg women's institute: low salmon-pink wings with tall arched windows
//   r4080836   Bolshoy 77: the second Rosenstein house (Belogrud 1912-14): black-grey rusticated stone, six giant columns over a two-storey base, an ochre attic with niches and six statues
import { buildTenement } from './tenement.js';
import { NC } from './nouveau.js';
import { human, cached, figureMats } from '../lib/figures.js';
import { DOORWAYS } from '../data/metro.js';

export function build(K, N, svc) {
  const L = K.L, P = K.P, M = K.mats, S = N.mats;
  const near = (e, x, z, r = 4) => Math.hypot((e.a[0] + e.b[0]) / 2 - x, (e.a[1] + e.b[1]) / 2 - z) < r;
  const sills = (y0, hs) => { const out = [y0]; let y = y0; for (const h of hs) { y += h; out.push(y); } return out; };

  // ------------------------------------------------------------------------------------------ 38 / 96: Chubakov house
  {
    const WALL = '#d8b3a6', TRIM = '#ddd5c6', HC = 23.6, trim = K.wall(TRIM), ys = sills(5.6, [3.6, 3.6, 3.6, 3.6]);
    const win = (y, o = {}) => ({ y, h: 2.0, w: 1.2, style: 'plain', mat: trim, frame: 'brown', ...o });
    buildTenement(K, N, svc, {
      name: 'chubakov', title: 'Дом Чубаковых (Каменноостровский, 38 / Большой, 96)', titleEn: 'Chubakov house on Lev Tolstoy Square (V. Van der Gucht 1910-11)', ids: ['r1249813'], hc: HC, wall: WALL, court: '#c9ab9c', trim, frame: 'brown',
      pitch: 2.95, corniceMat: trim, railing: true,
      base: { kind: 'shop', h: 4.7, mat: K.rust('#b9a79b'), tile: 2.4, tileY: 1.2, frameMat: trim, signEvery: 2, awnings: 5 },
      floors: [win(ys[0]), win(ys[1], { style: 'arch', sw: 0.16, key2: trim, h: 2.2 }), win(ys[2], { style: 'key' }), win(ys[3]), win(ys[4], { h: 1.8 })],
      bands: [{ y0: 4.7, y1: 4.95, d: 0.14, mat: trim }, { y0: ys[1] - 0.8, y1: ys[1] - 0.6, d: 0.1, mat: trim }, { y0: ys[4] - 0.75, y1: ys[4] - 0.55, d: 0.08, mat: trim }],
      balconies: [{ floor: 2, bays: (i, n) => n > 4 && i % 5 === 2, w: 2.1 }, { floor: 3, bays: (i, n) => n > 4 && i % 5 === 0, w: 2.0 }],
      extra: (e, len, xs, top) => {
        if (len > 6 && xs.length > 1) { const pp = xs[1] - xs[0]; for (let i = 0; i <= xs.length; i += 2) { const x = i === 0 ? xs[0] - pp / 2 : i === xs.length ? xs[i - 1] + pp / 2 : (xs[i - 1] + xs[i]) / 2; K.pilaster(trim, x, 0.4, ys[1] - 0.6, ys[4] - 0.75, 0.08, 0.3); } }
        if (near(e, -2233.4, -3723.6, 6)) N.attic(len * 0.2 - 3.2, len * 0.2 + 3.2, top - 0.1, 3.6, 'baroque', K.wall(WALL), { t: 0.5, z: 0.02, oculus: { y: 1.9, r: 0.5, mat: trim } });
        if (near(e, -2229.9, -3687.6, 6)) N.attic(len * 0.72 - 3.0, len * 0.72 + 3.0, top - 0.1, 3.4, 'baroque', K.wall(WALL), { t: 0.5, z: 0.02, oculus: { y: 1.8, r: 0.5, mat: trim } });
      },
      after: () => {
        // the round corner on the square and its belvedere: eight arches under a dark dome with a lantern (photos 19 21)
        const cx = -2222.7, cz = -3699.4, a = Math.atan2(0.996, 0.087);
        N.turret(cx, cz, 3.1, 0.75, HC + 0.4, { n: 9, a0: a - 1.75, a1: a + 1.75, wall: K.wall(WALL), floors: ys.map((y, i) => ({ y, h: i === 1 ? 2.2 : 2.0, w: 1.1, style: i === 1 ? 'arch' : 'plain', mat: trim, frame: 'brown', sw: 0.16 })), every: 2, phase: 0,
          bands: [[4.7, 4.95, 0.14, trim], [HC - 0.5, HC + 0.1, 0.3, trim]], top: { kind: 'none', cornice: false } });
        P.cap(K.mats.roofSilver, ring(cx, cz, 3.1, 14), HC + 0.4, true, 2);
        N.turret(cx, cz, 2.5, HC + 0.4, HC + 3.9, { n: 8, wall: trim, floors: [{ y: HC + 0.9, h: 2.3, w: 1.1, style: 'arch', mat: trim, frame: 'brown', sw: 0.14 }], top: { kind: 'dome', h: 2.6, mat: N.seam(NC.roofDark), r: 1.1, lantern: { h: 0.9, r: 0.6, mat: trim }, spire: 1.6, ball: 0.12, corniceMat: trim } });
      },
    });
  }

  // ------------------------------------------------------------------------------------------ 31-33 / L. Tolstogo 1-3: Korzinin house
  {
    const WALL = '#c98877', TRIM = '#ecdcc6', HC = 21.2, trim = K.wall(TRIM), ys = sills(5.5, [3.7, 3.7, 3.6]);
    const win = (y, o = {}) => ({ y, h: 2.0, w: 1.2, style: 'hood', mat: trim, frame: 'white', ...o });
    buildTenement(K, N, svc, {
      name: 'korzinin', title: 'Дом Корзинина (Каменноостровский, 31—33 / ул. Льва Толстого, 1—3)', titleEn: 'Korzinin house on Lev Tolstoy Square (P. Mulkhanov 1903-04)', ids: ['w163290692'], hc: HC, wall: WALL, court: '#b98a7b', trim, frame: 'white',
      pitch: 2.9, corniceMat: trim, railing: true,
      base: { kind: 'shop', h: 4.6, mat: K.rust('#b97c6d'), tile: 2.4, tileY: 1.2, frameMat: trim, signEvery: 2, awnings: 4, awningMat: K.mats.awning },
      floors: [win(ys[0], { style: 'plain' }), win(ys[1], { style: 'arch', sw: 0.16, key2: trim, h: 2.1 }), win(ys[2]), win(ys[3], { h: 1.8, style: 'plain' })],
      bands: [{ y0: 4.6, y1: 4.85, d: 0.14, mat: trim }, { y0: ys[1] - 0.8, y1: ys[1] - 0.6, d: 0.1, mat: trim }, { y0: ys[3] - 0.75, y1: ys[3] - 0.55, d: 0.08, mat: trim }],
      balconies: [{ floor: 1, bays: (i, n) => n > 5 && i === Math.floor(n / 2), w: 2.6 }, { floor: 2, bays: (i, n) => n > 5 && i === Math.floor(n / 2), w: 2.6 }],
      extra: (e, len, xs, top) => { if (len > 20) for (const m of [len * 0.12, len * 0.88]) N.attic(m - 2.6, m + 2.6, top - 0.1, 2.6, 'tri', K.wall(WALL), { t: 0.45, z: 0.02, oculus: { y: 1.0, r: 0.4, mat: trim } }); },
      after: () => {
        // the two bay turrets at the ends of the concave front (the onion tops were lost in a fire of the 1980s: low tents today)
        for (const [x, z, a] of [[-2172.4, -3656.6, Math.atan2(-0.99, -0.1)], [-2155.6, -3690.4, Math.atan2(-0.6, 0.8)]])
          N.turret(x, z, 2.5, 5.2, HC + 2.6, { n: 9, a0: a - 1.8, a1: a + 1.8, wall: K.wall(WALL), floors: [...ys.map((y) => ({ y, h: 1.9, w: 1.0, style: 'plain', mat: trim, frame: 'white' })), { y: HC + 0.5, h: 1.4, w: 0.9, style: 'plain', mat: trim, frame: 'white' }], every: 2,
            bands: [[5.2, 5.5, 0.1, trim], [HC - 0.4, HC, 0.25, trim]], top: { kind: 'tent', h: 1.8, mat: N.seam(NC.roofRed), r: 1.12, corniceMat: trim } });
      },
    });
  }

  // ------------------------------------------------------------------------------------------ Bolshoy 98: Maizel house
  {
    const WALL = '#e2bfa4', TRIM = '#f0e2cd', HC = 23.4, trim = K.wall(TRIM), ys = sills(5.6, [3.6, 3.6, 3.6, 3.5]);
    const win = (y, o = {}) => ({ y, h: 2.0, w: 1.25, style: 'plain', mat: trim, frame: 'white', ...o });
    buildTenement(K, N, svc, {
      name: 'maizel', title: 'Дом Майзель (Большой пр., 98)', titleEn: 'Maizel house, Bolshoy 98 (D. Kryzhanovsky 1910-11)', ids: ['r1257106'], hc: HC, wall: WALL, court: '#d2b49b', trim, frame: 'white',
      pitch: 3.0, corniceMat: trim, railing: true,
      base: { kind: 'arch', h: 4.7, mat: K.rust('#d9b89e'), tile: 2.4, tileY: 1.2, y0: 0.7, y1: 3.9, frameMat: trim, w: 2.1, signEvery: 2 },
      floors: [win(ys[0]), win(ys[1], { style: 'key' }), win(ys[2], { style: 'hood' }), win(ys[3]), win(ys[4], { h: 1.8 })],
      bands: [{ y0: 4.7, y1: 4.95, d: 0.14, mat: trim }, { y0: ys[1] - 0.8, y1: ys[1] - 0.6, d: 0.1, mat: trim }],
      balconies: [{ floor: 1, bays: (i, n) => n > 4 && i % 4 === 1, w: 2.1 }, { floor: 3, bays: (i, n) => n > 4 && i % 4 === 3, w: 2.0 }],
      extra: (e, len, xs, top) => {
        if (len > 6 && xs.length > 1) { const pp = xs[1] - xs[0]; for (let i = 0; i <= xs.length; i += 3) { const x = i === 0 ? xs[0] - pp / 2 : i >= xs.length ? xs[xs.length - 1] + pp / 2 : (xs[i - 1] + xs[i]) / 2; K.pilaster(trim, x, 0.42, ys[1] - 0.6, HC - 1.2, 0.08, 0.34); } }
        // the semicircular gable over the front that looks at the square (photo 22)
        if (near(e, -2186.3, -3744.9, 5)) N.attic(0.6, len - 0.6, top - 0.1, Math.min(6.4, len * 0.42), 'round', K.wall(WALL), { t: 0.5, z: 0.02, window: { w: 1.2, h: 1.6, y: 1.6, style: 'plain', mat: trim, frame: 'white' } });
      },
    });
  }

  // ------------------------------------------------------------------------------------------ 37: House of Fashion + the Petrogradskaya metro vestibule
  {
    const WALL = '#a8a192', TRIM = '#d9d6cc', HC = 24.2, frameM = K.wall(TRIM), ys = sills(6.3, [3.6, 3.6, 3.6, 3.6]);
    const win = (y) => ({ y, h: 2.3, w: 2.0, style: 'slab', mat: frameM, frame: 'white', sw: 0.12, d: 0.07 });
    const cfg = (ids, hc, name, title) => ({
      name, title, titleEn: title ? 'House of Fashion with the Petrogradskaya metro vestibule (1963-68)' : undefined, ids, hc, up: 0.5, wall: WALL, court: '#9f998b', trim: frameM, frame: 'white', pitch: 3.9, margin: 1.6,
      cornice: 'none', plinth: 0.5, plinthMat: N.ashlar(NC.stoneDark), roofMat: K.mats.roofDark,
      base: { kind: 'shop', h: 5.0, mat: N.ashlar('#8f897c'), tile: 1.8, y0: 0.5, y1: 4.3, frameMat: S.stoneDark, pier: 0.7, signEvery: 2, signLift: 0.05 },
      floors: ys.filter((y) => y + 3 < hc).map(win),
      bands: [{ y0: 5.0, y1: 5.3, d: 0.25, mat: S.stoneLight }, { y0: hc + 0.2, y1: hc + 0.5, d: 0.08, mat: S.stoneLight }],
      wallTex: true,
    });
    const main = cfg(['r1256096'], HC, 'dommod', 'Дом мод · станция метро «Петроградская»');
    const DW = DOORWAYS.find((d) => d.id === 'petrogradskaya-in') || null, AT = DW ? [DW.x, DW.z] : [-2227.1, -3771.0];
    // the ticket hall of the metro (metro/st-petr.js + proom.js): its inner wall face lies 0.43 m behind this front, its 0.3 m wall slab carries its own door reveal (door 4.5 x 2.7 m over a floor at 0.05):
    // this front only lines the 0.13 m between its plane and that slab (deeper jambs would be coplanar with the metro's reveal)
    if (DW) main.doorways = [{ at: AT, w: DW.w, h: 2.75, clear: 4.1, depth: 0.13 }];
    main.features = [{ at: AT, tol: 3, draw: (u, len) => {
      // the metro vestibule: a row of five glass doors under the name of the station and the blue "М" (plain letters, no logo).  With the station built (DOORWAYS row petrogradskaya-in) the three
      // middle leaves stand open: the wall is cut by cfg.doorways below (4.5 m wide, 2.7 m high as the door of the ticket hall in metro/st-petr.js); the frame posts and the two outer leaves stay
      for (let i = -2; i <= 2; i++) {
        if (!(DW && Math.abs(i) <= 1)) P.box(S.glassDark, u + i * 1.5 - 0.65, u + i * 1.5 + 0.65, 0.1, 2.5, 0.07, 0.13, 'kb');
        P.box(S.stoneLight, u + i * 1.5 - 0.72, u + i * 1.5 - 0.65, 0, 2.6, 0.05, 0.14, 'kb');
      }
      P.box(S.stoneLight, u + 3.65, u + 3.72, 0, 2.6, 0.05, 0.14, 'kb');
      P.box(S.stoneLight, u - 4.0, u + 4.0, 2.5, 2.75, 0.02, 0.9, '');
      N.board(u, 3.5, 6.4, 0.7, ['ПЕТРОГРАДСКАЯ'], { bg: '#e4e1d8', fg: '#1d4e9b', font: K.ctx.tex.FONTS.sans, weight: 700, size: 0.7, z: 0.12, px: 768 });
      N.board(u - 5.0, 3.6, 1.1, 1.1, ['М'], { bg: '#f2f2ee', fg: '#1795d4', font: K.ctx.tex.FONTS.sans, weight: 800, size: 0.92, z: 0.12, px: 128 });
      svc.entrances.push({ x: N.world(u, 0.8)[0], z: N.world(u, 0.8)[1], rotY: Math.atan2(N.cur.e.n[0], N.cur.e.n[1]), kind: 'metro', name: 'Петроградская' });
    } }];
    buildTenement(K, N, svc, main);
    buildTenement(K, N, svc, cfg(['r1256097'], 13.6, 'dommod2', null));
  }

  // ------------------------------------------------------------------------------------------ 36 / 73: the former women's institute
  {
    const WALL = '#dea88f', TRIM = '#eedcc8', HC = 13.6, trim = K.wall(TRIM);
    buildTenement(K, N, svc, {
      name: 'institute', title: 'Каменноостровский, 36 / Большой, 73 (бывший институт принцессы Ольденбургской)', titleEn: 'Former Oldenburg women\'s institute, Kamennoostrovsky 36 / Bolshoy 73', ids: ['w40260868'], hc: HC, wall: WALL, court: '#cfa089', trim, frame: 'brown',
      pitch: 3.3, corniceMat: trim, plinth: 1.0, plinthMat: N.ashlar('#8a6f66'),
      base: { kind: 'plain', h: 4.6, mat: K.rust('#d39c84'), tile: 2.4, tileY: 1.2, sill: 1.5, winH: 1.9, w: 1.2, style: 'plain' },
      floors: [{ y: 5.6, h: 3.4, w: 1.5, style: 'arch', mat: trim, frame: 'brown', sw: 0.2, d: 0.1, key2: trim }, { y: 10.4, h: 1.5, w: 1.2, style: 'plain', mat: trim, frame: 'brown' }],
      bands: [{ y0: 4.6, y1: 4.9, d: 0.16, mat: trim }, { y0: 9.6, y1: 9.85, d: 0.14, mat: trim }],
    });
  }

  // ------------------------------------------------------------------------------------------ Bolshoy 77: the second Rosenstein house
  {
    const WALL = '#55524f', ATTIC = '#d7b46c', HC = 21.8, dark = N.rock(WALL), plain = K.mat('#605d59', { paint: 0.05 }), attic = K.wall(ATTIC), ys = [5.4, 9.7, 13.5, 17.2];
    const win = (y, o = {}) => ({ y, h: 2.2, w: 1.25, style: 'key', mat: plain, frame: 'brown', ...o });
    buildTenement(K, N, svc, {
      name: 'rosenstein77', title: 'Дом Розенштейна (Большой пр., 77)', titleEn: 'Rosenstein house, Bolshoy 77 (A. Belogrud 1912-14)', ids: ['r4080836'], hc: HC, wall: WALL, court: '#8d8a84', trim: plain, frame: 'brown',
      xs: (len) => (len > 15 ? K.bays(1.7, len - 1.7, (len - 3.4) / 5) : K.bays(1, len - 1, 3)), cornice: 'none', plinthMat: N.rock('#4a4846'), roofMat: K.mats.roofDark,
      base: { kind: 'arch', h: 8.6, mat: dark, tile: 2.4, tileY: 1.6, y0: 0.5, y1: 3.9, frameMat: plain, w: 2.2, signs: false, doors: (i, n) => i === 0 || i === n - 1 },
      floors: [win(ys[0], { h: 2.0 }), win(ys[1], { h: 2.4 }), win(ys[2]), win(ys[3], { h: 2.0 })],
      bands: [{ y0: 8.3, y1: 8.7, d: 0.5, mat: plain }, { y0: HC - 1.3, y1: HC - 0.9, d: 0.2, mat: plain }, { y0: HC - 0.9, y1: HC - 0.3, d: 0.3, mat: K.mat(WALL, { map: K.texDentil }), uvs: 0.6 }, { y0: HC - 0.3, y1: HC + 0.1, d: 0.85, mat: plain }],
      balconies: [{ floor: 1, kind: 'stone', bays: (i) => i === 1 || i === 3, w: 2.2, mat: plain, hex: '#605d59' }, { floor: 2, bays: (i) => i === 0 || i === 2 || i === 4, w: 2.0 }],
      extra: (e, len, xs) => {
        if (len < 15) return;
        // six giant columns with Corinthian capitals over the two-storey base, the ochre attic storey with arched niches and six statues (photo 59)
        const pp = xs[1] - xs[0], cols = [xs[0] - pp / 2, ...xs.map((x) => x + pp / 2)];
        for (const x of cols) K.column(plain, x, 0.42, 8.7, HC - 1.3, 0.52, { capH: 1.3, seg: 12 });
        K.wallQuad(attic, 0, len, HC + 0.1, HC + 3.6, 3, -0.6);
        const fm = figureMats(K.ctx).keys('plaster'), fig = cached('lmKam-r77-statue', () => human({ detail: 0.16, body: { muscle: 0.4 }, outfit: { torso: 'tunic', hem: 0.75, sleeves: 'short' } }));
        for (const x of xs) { P.box(S.glassDark, x - 0.9, x + 0.9, HC + 0.5, HC + 2.4, -0.62, -0.56, 'kb'); N.archRing(attic, x, HC + 0.5, 1.8, 2.8, 0.25, 0.12); }
        for (const x of cols) { P.box(attic, x - 0.5, x + 0.5, HC + 0.1, HC + 3.9, -0.7, -0.1, 'b'); P.box(attic, x - 0.6, x + 0.6, HC + 3.9, HC + 4.1, -0.8, 0.0, 'b'); fig.place(P, fm, x, HC + 4.1, -0.4, 0, 1.15); }
        P.box(attic, 0, len, HC + 3.3, HC + 3.6, -0.75, -0.5, 'b');
      },
    });
  }

  svc.photoSpots.push({ x: -2204, z: -3722, yaw: L.yawToward(-2204, -3722, -2230, -3700), pitch: 14, name: 'Площадь Льва Толстого · дом Чубаковых' });
}
const ring = (x, z, r, n) => Array.from({ length: n }, (_, i) => [x + Math.sin((i / n) * Math.PI * 2) * r, z + Math.cos((i / n) * Math.PI * 2) * r]);
