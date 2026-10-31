// landmarksKamennoostrovsky/lenfilm.js - the south part of the avenue (P1 north / P3).  docs/research/kamennoostrovsky.md section 7c; photos refs/kamennoostrovsky 60, 61, 72, 73, 80.
//   r1268688  Kamennoostrovsky 10: ONE OSM outline for the Aleksandrov tenement 10 (D. Kryzhanovsky, P. Mulkhanov 1905-06: cream with ochre brick ornament bands, three-sided bay windows, stepped
//             attics) and the LENFILM studio behind it: the ochre avant-corps with the white four-column Corinthian portico and pediment at the west end of the garden south of house 10 (OSM edge
//             15.9 m facing the avenue 55 m away), white arched niches, a round medallion, the word ЛЕНФИЛЬМ over the door.  The portico podium is a walk box.
//   r3419529  Kamennoostrovsky 12: the second Aleksandrov tenement (same hand)
//   r5986712  Kamennoostrovsky 9 / Malaya Posadskaya 2: the Bykhovsky house (M. Lyalevich 1911-12): grey neoclassical revival, six storeys, arched fourth-floor windows with iron balconies, quoins
//   w59965741 Kamennoostrovsky 24 / Bolshaya Monetnaya 10: the Cavos house (L. Benois 1896-97, V. Androsov 1907-12): red brick with pale stucco strips, a green majolica frieze, a glazed oriel
import { buildTenement } from './tenement.js';
import { NC } from './nouveau.js';

export function build(K, N, svc) {
  const L = K.L, P = K.P, M = K.mats, S = N.mats;
  const near = (e, x, z, r = 4) => Math.hypot((e.a[0] + e.b[0]) / 2 - x, (e.a[1] + e.b[1]) / 2 - z) < r;

  // ------------------------------------------------------------------------------------------ 10 and 12: the Aleksandrov tenements; in the garden behind house 10 the Lenfilm portico
  // OSM r1268688 is ONE outline for house 10 and the studio complex behind it.  Seen from the avenue: the street block (front 36.3 m, its south face 71.4 m along the garden), then the ochre studio
  // whose avant-corps (edges 12.7 / 15.9 / 12.5 m around (-1885,-2859)) carries the white portico at the west end of the garden, 55 m from the avenue.
  const OCHRE = '#e3b85a', WHITE = '#f3efe4', white = K.wall(WHITE), ochreWall = K.wall(OCHRE);
  const isPortico = (e) => !e.hole && e.rec.id === 'r1268688' && near(e, -1884.85, -2858.75, 3);
  const isStudio = (e) => { const x = (e.a[0] + e.b[0]) / 2, z = (e.a[1] + e.b[1]) / 2; return !e.hole && e.rec.id === 'r1268688' && x > -1906 && x < -1878 && z > -2870 && z < -2830; };
  const isGarden = (e) => !e.hole && e.rec.id === 'r1268688' && e.len > 60 && near(e, -1868.6, -2881.3, 6);

  /** the portico of the studio on the 15.9 m front: podium (a walk box), four Corinthian columns, entablature, pediment; the door under the word ЛЕНФИЛЬМ, niches, a medallion (photos 60, 80) */
  const portico = (e, len) => {
    const c = len / 2, y0 = 0.3, y1 = 10.4, zc = 2.6, ph = K.ctx.physics, rot = Math.atan2(e.n[0], e.n[1]);
    P.box(M.granite, c - 6.2, c + 6.2, 0, 0.15, 0, 4.2, 'kb'); P.box(M.graniteWarm, c - 5.8, c + 5.8, 0, y0, 0, 3.8, 'kb');
    ph.addWalkBox(...N.world(c, 2.0), 11.6, 3.6, rot, y0);
    for (const dx of [-4.4, -1.5, 1.5, 4.4]) { K.column(white, c + dx, zc, y0, y1, 0.52, { capH: 1.25, seg: 14 }); ph.addCylinder(...N.world(c + dx, zc), 0.6, 0, 11); }
    P.box(white, c - 5.2, c + 5.2, y1, y1 + 0.5, 0, zc + 0.6, 'kb'); P.box(K.wall('#e6e0d0'), c - 5.2, c + 5.2, y1 + 0.5, y1 + 1.1, 0, zc + 0.55, 'kb'); P.box(white, c - 5.5, c + 5.5, y1 + 1.1, y1 + 1.45, 0, zc + 0.95, 'k');
    N.attic(c - 5.5, c + 5.5, y1 + 1.45, 2.4, 'tri', white, { t: zc + 0.95, z: zc + 0.95 });
    P.fan(ochreWall, [[c - 4.2, y1 + 1.75, zc + 0.97], [c + 4.2, y1 + 1.75, zc + 0.97], [c, y1 + 3.5, zc + 0.97]], [0, 0, 1]);                 // the ochre tympanum
    P.box(S.door, c - 0.95, c + 0.95, y0, 3.1, 0.05, 0.13, 'kb'); P.box(S.iron, c - 0.02, c + 0.02, y0, 3.1, 0.13, 0.15, 'kb');
    P.box(white, c - 1.25, c - 0.95, y0, 3.3, 0, 0.16, 'kb'); P.box(white, c + 0.95, c + 1.25, y0, 3.3, 0, 0.16, 'kb'); P.box(white, c - 1.25, c + 1.25, 3.1, 3.3, 0, 0.18, 'k');
    N.board(c, 3.8, 2.3, 0.5, ['ЛЕНФИЛЬМ'], { bg: '#efe6cc', fg: '#8a6a1e', weight: 700, size: 0.8, z: 0.05, px: 512 });
    N.window({ x: c, y: 5.5, w: 1.3, h: 2.6, style: 'plain', mat: white, frame: 'white' }); N.ironBalcony(c - 1.3, c + 1.3, 5.4, 0.5, { kind: 'bars', slabMat: white });
    for (const dx of [-3.0, 3.0]) { N.archFill(white, c + dx, 5.0, 1.5, 3.3, 0.03); N.archFill(white, c + dx, 0.9, 1.3, 2.4, 0.03); }
    P.geo(white, N.circle(), c, 9.3, 0.04, 0, 0, 0, 0.6);
    for (const dx of [-6.7, 6.7]) for (const y of [5.6, 9.7, 13.6]) N.window({ x: c + dx, y, w: 1.0, h: 2.0, style: 'plain', mat: white, frame: 'white' });
    for (const dx of [-3.0, 0, 3.0]) N.window({ x: c + dx, y: 15.4, w: 1.1, h: 1.6, style: 'plain', mat: white, frame: 'white' });
    svc.entrances.push({ x: N.world(c, 4.6)[0], z: N.world(c, 4.6)[1], rotY: rot, kind: 'door', bldg: 'r1268688', name: 'Ленфильм' });
  };

  for (const [id, name, no] of [['r1268688', 'aleks10', '10'], ['r3419529', 'aleks12', '12']]) {
    const WALL = '#e6dcc0', HC = 18.6, trim = K.wall('#efe8d2'), wall = K.wall(WALL), ochre = K.mat('#c98646', { paint: 0.09 }), ys = [5.6, 9.4, 13.2];
    const win = (y, o = {}) => ({ y, h: 2.0, w: 1.2, style: 'plain', mat: trim, frame: 'brown', ...o });
    const bayAt = (len) => (len > 30 ? [len * 0.3, len * 0.72] : len > 14 ? [len / 2] : []);
    const studio = { wallMat: ochreWall, base: { kind: 'plain', h: 4.4, mat: K.rust('#d9ad52'), tile: 2.4, tileY: 1.2, sill: 1.3, winH: 2.1, w: 1.1, style: 'arch', trim: white },
      floors: [win(5.6, { h: 2.4, style: 'hood', mat: white, frame: 'white' }), win(9.7, { h: 1.9, mat: white, frame: 'white' }), win(13.6, { h: 1.8, mat: white, frame: 'white' })], skip: null, balconies: null };
    const garden = { base: { kind: 'plain', h: 4.6, mat: K.rust('#d9cfb2'), tile: 2.4, tileY: 1.2, sill: 1.4, winH: 2.0, w: 1.2, style: 'plain', trim } };
    buildTenement(K, N, svc, {
      name, title: 'Доходный дом Г. А. Александрова (Каменноостровский, ' + no + ')' + (no === '10' ? ' · киностудия «Ленфильм»' : ''),
      titleEn: 'Aleksandrov tenement, Kamennoostrovsky ' + no + ' (D. Kryzhanovsky, P. Mulkhanov 1905-06)' + (no === '10' ? ' with the Lenfilm studio portico in the garden' : ''),
      ids: [id], hc: HC, wall: WALL, court: '#d9cfb2', trim, frame: 'brown',
      pitch: 3.0, corniceMat: trim, base: { kind: 'shop', h: 4.6, mat: K.rust('#d9cfb2'), tile: 2.4, tileY: 1.2, frameMat: trim, signEvery: 2 },
      floors: [win(ys[0]), win(ys[1], { style: 'key' }), win(ys[2], { style: 'arch', sw: 0.14, h: 2.1 })],
      skip: (len) => bayAt(len).map((u) => [u - 1.75, u + 1.75]),
      street: (e) => (isPortico(e) || isStudio(e) || isGarden(e) ? true : null),
      edge: (e, len) => (isPortico(e) ? { ...studio, xs: () => [], floors: [] } : isStudio(e) ? studio : isGarden(e) ? garden : null),
      bands: [{ y0: 4.6, y1: 4.85, d: 0.12, mat: trim }],
      extra: (e, len, xs, top) => {
        if (isPortico(e)) { portico(e, len); return; }
        if (isStudio(e)) return;
        // ochre brick ornament bands, three-sided bay windows through three floors, stepped attics (photo 61)
        for (const y of [ys[1] - 0.95, ys[2] - 0.95, HC - 1.95]) K.wallQuad(ochre, 0.3, len - 0.3, y, y + 0.6, 2, 0.011);
        for (const u of bayAt(len)) {
          N.erker(u, 3.4, 1.0, 5.1, 16.3, { plan: 'trap', c: 0.9, wall, corbel: 'steps', steps: 2, stepH: 0.3, corbelMat: trim, top: 'slab', topMat: trim, bands: [[9.0, 9.3, 0.05, ochre], [12.8, 13.1, 0.05, ochre]],
            face: (fl, k) => { for (const y of ys) N.window(win(y, { x: fl / 2, w: k === 1 ? Math.min(1.3, fl - 0.4) : Math.min(0.6, fl - 0.35) })); } });
          N.attic(u - 2.6, u + 2.6, top - 0.1, 2.5, 'step', wall, { t: 0.45, z: 0.02 });
          K.wallQuad(ochre, u - 0.9, u + 0.9, top + 1.0, top + 1.6, 2, 0.035);
        }
      },
    });
  }
  svc.photoSpots.push({ x: -1861.4, z: -2867.3, yaw: L.yawToward(-1861.4, -2867.3, -1884.85, -2858.75), pitch: 12, name: 'Каменноостровский проспект, 10 · «Ленфильм»' });

  // ------------------------------------------------------------------------------------------ 9: the Bykhovsky house
  {
    const WALL = '#bdb9ad', HC = 24.4, trim = K.wall('#cbc7bb'), ys = [5.6, 9.2, 12.8, 16.4, 20.2];
    const win = (y, o = {}) => ({ y, h: 2.0, w: 1.25, style: 'plain', mat: trim, frame: 'brown', ...o });
    buildTenement(K, N, svc, {
      name: 'bykhovsky', title: 'Дом Быховского (Каменноостровский, 9)', titleEn: 'Bykhovsky house, Kamennoostrovsky 9 (M. Lyalevich 1911-12)', ids: ['r5986712'], hc: HC, wall: WALL, court: '#b1ada1', trim, frame: 'brown',
      pitch: 3.1, corniceMat: trim, corniceScale: 1.2, plinthMat: N.rock(NC.granite), railing: true,
      base: { kind: 'shop', h: 8.6, mat: N.ashlar('#c2beb2'), tile: 1.8, frameMat: trim, signEvery: 3, y1: 3.6 },
      floors: [win(ys[0], { h: 1.9 }), win(ys[1], { h: 2.1 }), win(ys[2], { at: (i) => (i % 3 === 1 ? { style: 'arch', w: 1.6, h: 2.5, sw: 0.18, key2: trim } : null) }), win(ys[3]), win(ys[4], { h: 1.8 })],
      bands: [{ y0: 4.5, y1: 4.75, d: 0.1, mat: trim }, { y0: 8.6, y1: 8.9, d: 0.25, mat: trim }, { y0: ys[4] - 0.75, y1: ys[4] - 0.5, d: 0.2, mat: trim }],
      balconies: [{ floor: 2, bays: (i) => i % 3 === 1, w: 2.2, drop: 0.12 }, { floor: 1, kind: 'stone', bays: (i, n) => n > 5 && i % 6 === 4, w: 2.3, mat: trim, hex: '#cbc7bb' }],
      extra: (e, len, xs) => {
        // toothed quoin strips at the ends of every front, relief panels between the windows of the top floor (photo 73)
        if (len < 8) return;
        const q = N.quoinMat(WALL, '#a9a599');
        N.quoins(q, 0.05, 8.9, ys[4] - 0.75, 1, { h: 0.5, long: 0.7 }); N.quoins(q, len - 0.05, 8.9, ys[4] - 0.75, -1, { h: 0.5, long: 0.7 });
        for (let i = 0; i + 1 < xs.length; i++) K.plane(K.R.panel, (xs[i] + xs[i + 1]) / 2 - 0.45, (xs[i] + xs[i + 1]) / 2 + 0.45, ys[4] + 0.2, ys[4] + 1.5, 0.03);
      },
    });
  }

  // ------------------------------------------------------------------------------------------ 24 / Bolshaya Monetnaya 10: the Cavos house
  {
    const WALL = '#7d4438', PALE = '#cfc6b4', HC = 20.6, pale = K.wall(PALE), brick = K.mat(WALL, { paint: 0.08 }), ys = [5.4, 9.0, 12.7, 16.3];
    const win = (y, o = {}) => ({ y, h: 2.0, w: 1.15, style: 'key', mat: pale, frame: 'white', ...o });
    buildTenement(K, N, svc, {
      name: 'cavos', title: 'Дом Кавоса (Каменноостровский, 24 / Большая Монетная, 10)', titleEn: 'Cavos house, Kamennoostrovsky 24 / Bolshaya Monetnaya 10 (L. Benois 1896-97, V. Androsov 1907-12)', ids: ['w59965741'], hc: HC, wall: WALL, court: '#8a5446', trim: pale, frame: 'white',
      pitch: 2.9, corniceMat: K.wall('#6d5a50'), plinthMat: N.ashlar(NC.granite),
      base: { kind: 'plain', h: 4.4, mat: K.rust('#b9b2a2'), tile: 2.4, tileY: 1.2, sill: 1.5, winH: 2.0, w: 1.2, style: 'arch', trim: pale },
      floors: [win(ys[0]), win(ys[1]), win(ys[2]), win(ys[3], { style: 'arch', sw: 0.14, h: 2.1 })],
      skip: (len) => (len > 40 ? [[len * 0.62 - 1.7, len * 0.62 + 1.7]] : null),
      bands: [{ y0: 4.4, y1: 4.65, d: 0.12, mat: pale }, { y0: HC - 2.0, y1: HC - 1.2, d: 0.03, mat: N.majolica, uvs: 0.4 }],
      balconies: [{ floor: 2, bays: (i, n) => n > 4 && i % 5 === 1, w: 2.2 }, { floor: 1, bays: (i, n) => n > 4 && i % 5 === 3, w: 2.0 }],
      mansard: { mat: N.seam(NC.roofGrey), run: 1.3, rise: 2.6, D: 5.5, dormers: 6.5, dormerMat: pale, on: (e) => e.len > 40 },
      extra: (e, len, xs, top) => {
        // pale stucco strips between the bays of the brick front, the glazed oriel of the long front, brick chimneys (photo 72)
        if (xs.length > 1) { const pp = xs[1] - xs[0]; for (let i = 0; i <= xs.length; i += 2) { const x = i === 0 ? xs[0] - pp / 2 : i >= xs.length ? xs[xs.length - 1] + pp / 2 : (xs[i - 1] + xs[i]) / 2; K.wallQuad(pale, x - 0.28, x + 0.28, 4.65, HC - 2.0, 3, 0.011); } }
        if (len > 40) N.erker(len * 0.62, 3.2, 0.9, 12.3, 18.8, { plan: 'trap', c: 0.8, wall: pale, corbel: 'steps', corbelMat: pale, top: 'tent', tentH: 1.2, tentMat: N.seam(NC.roofGrey),
          face: (fl, k) => { K.wallQuad(N.lattice, 0.15, fl - 0.15, 13.0, 15.4, 1.2, 0.03); K.wallQuad(N.lattice, 0.15, fl - 0.15, 16.0, 18.3, 1.2, 0.03); } });
        if (len > 12 && len <= 40) for (const u of K.bays(2, len - 2, 14)) { P.box(brick, u - 0.5, u + 0.5, top, top + 2.6, -3.4, -2.5, 'b'); P.box(pale, u - 0.6, u + 0.6, top + 2.6, top + 2.8, -3.5, -2.4, 'b'); }
      },
    });
  }
}
