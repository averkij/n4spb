// landmarksMakarova/art.js - the canvas paintings of the module (docs/research/makarova.md sections 3-10; photos refs/makarova r01 r03 r04 c01 c08 l02 l05 k09 m04 s01 s03).
//   granite   pink-grey rapakivi (Lions pier stair, barriers, pedestals, lions), the pink-red coursed parapet granite, the polished grey-pink plinth of the Sportivnaya pavilions, the Catherine plinth
//   row       orange-ochre stucco, the rusticated ground floor (joints every 0.55 m), the terracotta stucco of no. 12, the plain side-wall bays with windows, the dentil band, the palmette frieze
//   churches  weathered grey-beige stucco, white order stucco, the straw-yellow stucco of the Lutheran church, the meander frieze, cream stucco of St Michael, the painted Gothic bays, the dome seams
//   signs     the pill sign "Спортивная / Sportivnaya", the blue M, the plaque of the pier, the notice boards, the door sign of the Lutheran church
//   iron      cut-out railings (vertical bars, scroll balcony panels, the iron gates)
// Every key starts with 'lmMak-' (the texture cache is scene-wide: a prefix that matches another module silently takes its textures).
const TAU = Math.PI * 2;
export const COL = {
  // the row
  ochre: '#bb8650', ochreLit: '#d99850', ochreShade: '#946238', rust: '#c99366', white: '#efe5d0', roofSheet: '#8a8f93', chimney: '#c4876e', plinth: '#8f8a80',
  red: '#8f4a3a', redLit: '#b24c33', cream: '#e8e0cc', dome: '#c3c5bf',
  // churches
  grey: '#bdb8aa', order: '#e6e2d4', towerWall: '#e1dcc4', towerOrder: '#eeeadf', towerPlinth: '#7a5a4c', domeLit: '#bfc4c0', domeShade: '#8d928f', gold: '#d9a526', roof: '#8f9496',
  yellow: '#dcc283', lutOrder: '#f3efe6', lutDome: '#cdd3d8', lutDoor: '#6b3f2a', michael: '#dccdb3', michaelWhite: '#e8e6df', michaelTrim: '#ece8dc', spire: '#3a3637', navRoof: '#46474a', aisleRoof: '#524d52',
  // granite and sport
  graniteP: '#b39a86', graniteShade: '#8d7b6a', parapet: '#c0958a', sportPlinth: '#8a7f78', sportPillar: '#948980', canopy: '#c9ced4', canopyMid: '#aab1b8', canopyLow: '#8c949b', soffit: '#e4e8eb',
  glass: '#7b94a3', steel: '#aab1b6', yellowStrip: '#e0b82c', iron: '#1e1f1f',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {}, C = COL;
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmMak-' + key, repeat });
  const R = (seed) => ctx.rng(seed);
  const F = tex.FONTS;
  const speckle = (g, w, h, seed, n, a = 0.1, s = 2.5) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,32'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * s, 1 + r() * s * 0.8); } };

  // ------------------------------------------------------------------------------------------ granite: tile 1.6 x 1.6 m
  /** pink-grey rapakivi: ovoid light-red feldspar, black biotite flecks (the lions, the barriers and the pedestals of the pier) */
  A.graniteP = D(256, 256, (g, w, h) => {
    const r = R(9101);
    g.fillStyle = '#b8a08c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) { const x = r() * w, y = r() * h, a = 1.4 + r() * 3.4; g.fillStyle = r() < 0.6 ? `rgba(206,150,128,${0.35 + r() * 0.3})` : `rgba(226,214,198,${0.3 + r() * 0.3})`; g.beginPath(); g.ellipse(x, y, a * 1.3, a, r() * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(48,42,40,${0.35 + r() * 0.4})`; g.fillRect(r() * w, r() * h, 1 + r() * 2.2, 1 + r() * 1.8); }
    speckle(g, w, h, 9102, 300, 0.07);
  }, 'graniteP');
  /** the coursed pink-red granite of the embankment parapet and the quay: blocks 1.0 x 0.5 m with visible red joints, tile 2.0 x 1.0 m */
  A.parapet = D(256, 128, (g, w, h) => {
    const r = R(9111);
    g.fillStyle = '#8f5d54'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 2; row++) for (let c = -1; c < 3; c++) {
      const x = c * 128 + row * 64, v = 0.94 + r() * 0.1;
      g.fillStyle = `rgb(${192 * v | 0},${149 * v | 0},${138 * v | 0})`; g.fillRect(x + 2, row * 64 + 2, 124, 60);
      for (let i = 0; i < 70; i++) { g.fillStyle = r() < 0.5 ? 'rgba(120,60,56,0.28)' : 'rgba(255,225,210,0.22)'; g.fillRect(x + 2 + r() * 120, row * 64 + 2 + r() * 56, 1 + r() * 2.4, 1 + r() * 2); }
    }
    speckle(g, w, h, 9112, 200, 0.06);
  }, 'parapet');
  /** polished grey-pink granite of the Sportivnaya plinth: tile 1.2 x 1.2 m, a few dark flecks */
  A.sportGranite = D(128, 128, (g, w, h) => {
    const r = R(9121);
    g.fillStyle = '#8a7f78'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.5 ? 'rgba(170,140,128,0.35)' : 'rgba(54,48,46,0.4)'; g.fillRect(r() * w, r() * h, 1 + r() * 2.6, 1 + r() * 2); }
    g.fillStyle = 'rgba(40,36,34,0.28)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h);
  }, 'sportGranite');
  /** the bridge-head paving slab 0.15 m high at the doors: granite slabs 0.6 x 0.6 m, tile 1.2 x 1.2 */
  A.slab = D(128, 128, (g, w, h) => {
    const r = R(9131); g.fillStyle = '#9c9892'; g.fillRect(0, 0, w, h);
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { const v = 0.93 + r() * 0.12; g.fillStyle = `rgb(${167 * v | 0},${163 * v | 0},${158 * v | 0})`; g.fillRect(a * 64 + 1.5, b * 64 + 1.5, 61, 61); }
    speckle(g, w, h, 9132, 120, 0.07);
  }, 'slab');

  // ------------------------------------------------------------------------------------------ Sportivnaya pavilion
  /** the pill sign under the soffit: 4.6 x 0.45 m, off-white, dark Cyrillic + Latin, the emblem M at the left end, the navy square "М 5" at the right end (photo s03) */
  A.pill = D(1024, 100, (g, w, h) => {
    g.fillStyle = '#e6e4d8'; g.beginPath(); g.moveTo(h / 2, 0); g.lineTo(w - h / 2, 0); g.arc(w - h / 2, h / 2, h / 2, -Math.PI / 2, Math.PI / 2); g.lineTo(h / 2, h); g.arc(h / 2, h / 2, h / 2, Math.PI / 2, -Math.PI / 2); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(40,40,44,0.55)'; g.lineWidth = 2; g.stroke();
    // the round M emblem at the left end
    g.strokeStyle = '#1f4fa8'; g.lineWidth = 7; g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath(); g.moveTo(50, 70); g.quadraticCurveTo(38, 28, 52, 24); g.lineTo(70, 56); g.lineTo(88, 24); g.quadraticCurveTo(102, 28, 90, 70); g.stroke();
    g.fillStyle = '#26282c'; g.textBaseline = 'middle';
    g.font = `bold 34px ${F.sans}`; g.fillText('Спортивная', 130, 32); const wd = g.measureText('Спортивная ').width;
    g.font = `28px ${F.sans}`; g.fillText('Sportivnaya', 130 + wd + 4, 32);
    // the pictograms row: eight small dark glyphs
    for (let i = 0; i < 8; i++) { const x = 180 + i * 62; g.fillStyle = i === 0 ? '#2b8a3e' : '#3a3a3e'; g.beginPath(); g.arc(x, 74, 9, 0, TAU); g.fill(); }
    g.fillStyle = '#1c2252'; g.fillRect(w - 118, 14, 74, 72); g.fillStyle = '#ffffff'; g.font = `bold 38px ${F.sans}`; g.textAlign = 'center'; g.fillText('М 5', w - 81, 52); g.textAlign = 'left';
  }, 'pill');
  /** the white box sign on the roof: 0.8 x 0.85 m, the blue round-shouldered M */
  A.mBox = D(128, 128, (g, w, h) => {
    g.fillStyle = '#f1f3f4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c2c6c8'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
    g.strokeStyle = '#1f4fa8'; g.lineWidth = 13; g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath(); g.moveTo(34, 98); g.quadraticCurveTo(14, 36, 36, 30); g.lineTo(64, 78); g.lineTo(92, 30); g.quadraticCurveTo(114, 36, 94, 98); g.stroke();
  }, 'mBox');
  /** the roof light: steel grid over blue-green glass, tile 1.2 x 1.2 m */
  A.skylight = D(64, 64, (g, w, h) => { g.fillStyle = '#5f8a90'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 0, w, h / 3); g.fillStyle = '#b8bfc4'; g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h); }, 'skylight');
  /** flat roof membrane with seams, tile 2 x 2 m */
  A.membrane = D(128, 128, (g, w, h) => { g.fillStyle = '#aeb0b0'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(60,60,60,0.30)'; g.fillRect(0, 0, 2, h); g.fillRect(64, 0, 2, h); speckle(g, w, h, 9141, 160, 0.08); }, 'membrane');

  // ------------------------------------------------------------------------------------------ the Lions pier
  /** the information plaque "Спуск со львами": 0.5 x 0.9 m on a post, dark blue field, white text */
  A.lionBoard = D(256, 460, (g, w, h) => {
    g.fillStyle = '#1f3b5c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e8e6df'; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#f2f0ea'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `bold 46px ${F.sans}`; g.fillText('Спуск', w / 2, h * 0.30); g.fillText('со львами', w / 2, h * 0.42);
    g.font = `30px ${F.sans}`; g.fillText('1806-1809', w / 2, h * 0.58); g.font = `24px ${F.sans}`; g.fillText('памятник', w / 2, h * 0.70); g.fillText('архитектуры', w / 2, h * 0.77);
    g.fillStyle = '#d9a526'; g.beginPath(); g.moveTo(w / 2, h * 0.08); g.lineTo(w / 2 + 26, h * 0.2); g.lineTo(w / 2 - 26, h * 0.2); g.closePath(); g.fill();
  }, 'lionBoard');

  // ------------------------------------------------------------------------------------------ iron: cut-out railings (alpha tested)
  /** vertical bars every 0.12 m between a top and a bottom rail, tile 1.2 x 1.0 m (the Catherine fence, the Lutheran gates' side panels) */
  A.bars = D(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#1e1f1f';
    for (let i = 0; i < 10; i++) g.fillRect(i * 12.8 + 4, 6, 4, h - 12);
    g.fillRect(0, 4, w, 8); g.fillRect(0, h - 14, w, 8); g.fillRect(0, h * 0.5 - 3, w, 5);
  }, 'bars');
  /** a balcony railing panel: bars, a scroll / circle band, rails; tile 1.6 x 1.0 m (2 scroll cells) */
  A.balcony = D(256, 160, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#1f1d1c'; g.fillStyle = '#1f1d1c'; g.lineWidth = 5;
    g.fillRect(0, 4, w, 9); g.fillRect(0, h - 16, w, 10);
    for (let i = 0; i < 14; i++) g.fillRect(i * 18.3 + 6, 10, 3, h - 22);
    g.lineWidth = 4;
    for (let c = 0; c < 2; c++) { const cx = 64 + c * 128; g.beginPath(); g.arc(cx, h * 0.5, 26, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx, h * 0.5, 10, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(cx - 60, h * 0.5); g.quadraticCurveTo(cx - 40, h * 0.2, cx - 26, h * 0.5); g.stroke(); }
  }, 'balcony');

  // ------------------------------------------------------------------------------------------ plain weathered stucco (tile 4 x 4 m): base colour, mottling, a few damp stains
  const stucco = (key, base, seed, o = {}) => D(256, 256, (g, w, h) => {
    const r = R(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < (o.blots ?? 90); i++) { g.fillStyle = r() < 0.5 ? `rgba(255,250,235,${0.012 + r() * 0.02})` : `rgba(70,56,40,${0.012 + r() * 0.022})`; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 34, 6 + r() * 22, r() * 3, 0, TAU); g.fill(); }
    if (o.streaks) for (let i = 0; i < o.streaks; i++) { const x = r() * w; g.fillStyle = `rgba(60,48,36,${0.02 + r() * 0.03})`; g.fillRect(x, 0, 2 + r() * 6, h); }
    speckle(g, w, h, seed + 1, o.speck ?? 500, 0.07);
  }, key);
  A.stuccoG = stucco('stuccoG', C.grey, 9201, { streaks: 8 });                 // the weathered grey-beige stucco of the Catherine church
  A.whiteS = stucco('whiteS', C.order, 9202, { blots: 50 });
  A.towerWall = stucco('towerWall', C.towerWall, 9203, { blots: 40 });
  A.towerOrder = stucco('towerOrder', C.towerOrder, 9204, { blots: 30 });
  A.stuccoY = stucco('stuccoY', C.yellow, 9205, { blots: 70, streaks: 5 });         // Lutheran St Catherine
  A.lutOrder = stucco('lutOrder', C.lutOrder, 9206, { blots: 30 });
  A.stuccoC = stucco('stuccoC', C.michael, 9207, { blots: 60, streaks: 6 });        // St Michael
  A.michaelWhite = stucco('michaelWhite', C.michaelWhite, 9208, { blots: 30 });
  A.stuccoO = stucco('stuccoO', C.ochre, 9209, { blots: 120, streaks: 10 });        // the Yakovlev houses
  A.stuccoR = stucco('stuccoR', C.red, 9210, { blots: 100, streaks: 8 });           // the Stenbock-Fermor house
  A.creamS = stucco('creamS', C.cream, 9211, { blots: 30 });
  /** dark red-brown granite plinth of the Catherine tower, tile 1.6 m */
  A.plinthRed = D(128, 128, (g, w, h) => { const r = R(9221); g.fillStyle = '#7a5a4c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 220; i++) { g.fillStyle = r() < 0.5 ? 'rgba(180,120,100,0.35)' : 'rgba(40,28,26,0.4)'; g.fillRect(r() * w, r() * h, 1 + r() * 2.4, 1 + r() * 2); } g.fillStyle = 'rgba(30,20,18,0.45)'; g.fillRect(0, h / 2 - 1, w, 2); g.fillRect(0, 0, 2, h); }, 'plinthRed');
  /** grey sheet-metal roof with standing seams every 0.6 m, tile 2.4 x 2.4 m */
  A.roofSheet = D(128, 128, (g, w, h) => { const r = R(9222); g.fillStyle = '#8f9496'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(50,52,54,0.45)'; g.fillRect(i * 32, 0, 2, h); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(i * 32 + 2, 0, 3, h); } speckle(g, w, h, 9223, 150, 0.08); }, 'roofSheet');
  /** the ribbed dome: one rib per tile (the lathe repeats the uv 24 times round), a seam at the left edge, the sheet slightly lighter in the middle */
  A.domeRib = D(64, 128, (g, w, h) => { g.fillStyle = '#c6cbc8'; g.fillRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(80,84,86,0.5)'); gr.addColorStop(0.08, 'rgba(80,84,86,0.0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(80,84,86,0.0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(70,74,76,0.6)'; g.fillRect(0, 0, 2, h); speckle(g, w, h, 9231, 80, 0.06); }, 'domeRib');
  /** the drum wall of the Catherine dome: tile = 30 degrees: a round-headed window 1.35 x 3.8 m with a brown mullion grid and a white archivolt in the first half, a blank bay with a white band in the second */
  A.drumWall = D(256, 512, (g, w, h) => {
    g.fillStyle = '#c9c4b2'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 9241, 200, 0.06);
    const px = w / 4.19, py = h / 6.9, cx = w * 0.25, y0 = h - 1.4 * py, ww = 1.35 * px, hh = 3.8 * py - ww / 2;        // window: sill 1.4 m above the colonnade floor
    g.fillStyle = '#efece0'; g.beginPath(); g.moveTo(cx - ww / 2 - 9, y0 + 3); g.lineTo(cx - ww / 2 - 9, y0 - hh); g.arc(cx, y0 - hh, ww / 2 + 9, Math.PI, 0); g.lineTo(cx + ww / 2 + 9, y0 + 3); g.closePath(); g.fill();
    g.fillStyle = '#4a3a2c'; g.beginPath(); g.moveTo(cx - ww / 2, y0); g.lineTo(cx - ww / 2, y0 - hh); g.arc(cx, y0 - hh, ww / 2, Math.PI, 0); g.lineTo(cx + ww / 2, y0); g.closePath(); g.fill();
    g.fillStyle = '#8a7d66'; for (let i = 1; i < 4; i++) g.fillRect(cx - ww / 2 + i * ww / 4 - 1.5, y0 - hh - ww / 2, 3, hh + ww / 2); for (let j = 1; j < 6; j++) g.fillRect(cx - ww / 2, y0 - j * (hh + ww / 2) / 6 - 1.5, ww, 3);
    g.fillStyle = '#efece0'; g.fillRect(0, y0 - hh - ww / 2 - 2, w, 6);                                                  // the white band at the springing level
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 0, 2, h);
  }, 'drumWall');
  // ------------------------------------------------------------------------------------------ the row: rustication, dentils, palmette frieze, garlands, the dome lattice (every tile is square in metres unless noted)
  /** rusticated ground floor: courses 0.55 m high, vertical joints every 1.1 m staggered, joints 1 cm: tile 1.1 x 1.1 m */
  const rustic = (key, base, joint, seed) => D(128, 128, (g, w, h) => {
    const r = R(seed); g.fillStyle = joint; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 2; row++) { const off = row * 64; for (let c = -1; c < 2; c++) { const v = 0.95 + r() * 0.1; g.fillStyle = shade(base, v); g.fillRect(c * 128 + off + 1.5, row * 64 + 1.5, 125, 61); } }
    speckle(g, w, h, seed + 1, 260, 0.06);
  }, key);
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
  A.rustO = rustic('rustO', C.rust, '#9c7248', 9301);
  A.rustR = rustic('rustR', '#9a5340', '#6f372b', 9302);
  A.rustB = rustic('rustB', '#d3c08c', '#a8965e', 9303);                                  // the Brullov house: pale yellow after the 2025-26 restoration
  A.stuccoB = stucco('stuccoB', '#d8c48e', 9212, { blots: 70, streaks: 5 });
  /** dentil band: white with dark gaps every 0.5 m (tile 0.5 m wide, 0.35 m high: use the band quad's own uv) */
  A.dentil = D(64, 44, (g, w, h) => { g.fillStyle = C.white; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(110,90,66,0.5)'; g.fillRect(0, h * 0.38, w, h * 0.62); g.fillStyle = C.white; for (let i = 0; i < 2; i++) g.fillRect(i * 32 + 4, h * 0.38, 18, h * 0.62 - 3); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, h - 3, w, 3); }, 'dentil');
  /** palmette / leaf-scroll frieze of the lintels: tile 0.9 x 0.45 m: cream relief on a slightly darker ground */
  A.palmette = D(128, 64, (g, w, h) => { g.fillStyle = '#d9cdb2'; g.fillRect(0, 0, w, h); g.fillStyle = C.white; for (let i = 0; i < 2; i++) { const x = i * 64 + 32; g.beginPath(); g.moveTo(x, h * 0.78); for (let k = -2; k <= 2; k++) g.quadraticCurveTo(x + k * 7, h * 0.3, x + k * 9, h * (0.62 - Math.abs(k) * 0.08)); g.closePath(); g.fill(); g.fillRect(x - 12, h * 0.8, 24, 4); } g.fillStyle = 'rgba(0,0,0,0.1)'; g.fillRect(0, h - 3, w, 3); }, 'palmette');
  /** a cream garland frieze on the terracotta ground (no. 12): tile 1.2 x 0.6 m */
  A.garland = D(128, 64, (g, w, h) => { g.fillStyle = '#9a5848'; g.fillRect(0, 0, w, h); g.strokeStyle = C.cream; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, h * 0.25); g.quadraticCurveTo(w * 0.25, h * 0.85, w * 0.5, h * 0.25); g.quadraticCurveTo(w * 0.75, h * 0.85, w, h * 0.25); g.stroke(); g.fillStyle = C.cream; for (const x of [0, w * 0.5]) { g.beginPath(); g.arc(x + 3, h * 0.25, 7, 0, TAU); g.fill(); } }, 'garland');
  /** the pale warm-grey sheet dome with a rhombic standing-seam lattice (no. 12): tile = 1 / 12 of the circumference */
  A.domeDiamond = D(128, 128, (g, w, h) => { g.fillStyle = '#c9cbc4'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,84,82,0.55)'; g.lineWidth = 2; for (let k = -2; k < 4; k++) { g.beginPath(); g.moveTo(k * 64, 0); g.lineTo(k * 64 + 128, h); g.stroke(); g.beginPath(); g.moveTo(k * 64 + 128, 0); g.lineTo(k * 64, h); g.stroke(); } speckle(g, w, h, 9311, 100, 0.07); }, 'domeDiamond');
  // ------------------------------------------------------------------------------------------ Lutheran St Catherine: Greek-key frieze, balusters, ribbed silver dome, drum wall, door sign
  /** the meander (Greek key) frieze: white key on straw yellow, tile 0.9 x 0.5 m */
  A.meander = D(128, 72, (g, w, h) => {
    g.fillStyle = C.yellow; g.fillRect(0, 0, w, h); g.strokeStyle = C.lutOrder; g.lineWidth = 6; g.lineJoin = 'miter';
    for (let i = 0; i < 2; i++) { const x = i * 64; g.beginPath(); g.moveTo(x + 4, h - 10); g.lineTo(x + 4, 10); g.lineTo(x + 56, 10); g.lineTo(x + 56, h - 22); g.lineTo(x + 22, h - 22); g.lineTo(x + 22, 28); g.lineTo(x + 38, 28); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, h - 3, w, 3);
  }, 'meander');
  /** white balusters between a top and a bottom rail (cut-out), tile 0.5 m wide x 1.1 m high */
  A.balust = D(32, 70, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = C.lutOrder;
    g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8);
    g.beginPath(); g.moveTo(10, 8); g.lineTo(22, 8); g.quadraticCurveTo(26, 22, 20, 30); g.quadraticCurveTo(26, 40, 21, h - 12); g.lineTo(21, h - 8); g.lineTo(11, h - 8); g.lineTo(11, h - 12); g.quadraticCurveTo(6, 40, 12, 30); g.quadraticCurveTo(6, 22, 10, 8); g.fill();
  }, 'balust');
  /** the silver ribbed dome of the Lutheran church (16 ribs: tile = one rib) */
  A.lutRib = D(64, 128, (g, w, h) => { g.fillStyle = C.lutDome; g.fillRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(70,80,90,0.5)'); gr.addColorStop(0.1, 'rgba(70,80,90,0)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.14)'); gr.addColorStop(1, 'rgba(70,80,90,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(60,70,80,0.6)'; g.fillRect(0, 0, 2, h); }, 'lutRib');
  /** the Lutheran drum: 8 tiles of 45 degrees: a round-headed window 0.9 x 2.0 m in white frames on straw yellow (tile 3.9 m x 7.5 m) */
  A.lutDrum = D(256, 384, (g, w, h) => {
    g.fillStyle = C.yellow; g.fillRect(0, 0, w, h); speckle(g, w, h, 9411, 160, 0.06);
    const px = w / 3.9, py = h / 7.5, cx = w * 0.5, y0 = h - 4.7 * py, ww = 0.9 * px, hh = 2.0 * py - ww / 2;
    g.fillStyle = C.lutOrder; g.beginPath(); g.moveTo(cx - ww / 2 - 7, y0 + 3); g.lineTo(cx - ww / 2 - 7, y0 - hh); g.arc(cx, y0 - hh, ww / 2 + 7, Math.PI, 0); g.lineTo(cx + ww / 2 + 7, y0 + 3); g.closePath(); g.fill();
    g.fillStyle = '#2f3a42'; g.beginPath(); g.moveTo(cx - ww / 2, y0); g.lineTo(cx - ww / 2, y0 - hh); g.arc(cx, y0 - hh, ww / 2, Math.PI, 0); g.lineTo(cx + ww / 2, y0); g.closePath(); g.fill();
    g.fillStyle = '#7d6a4a'; g.fillRect(cx - 1.5, y0 - hh - ww / 2, 3, hh + ww / 2); g.fillRect(cx - ww / 2, y0 - hh * 0.6, ww, 3);
  }, 'lutDrum');
  /** the door sign over the central portico door: a white panel 1.7 x 0.5 m with two lines of capitals */
  A.lutSign = D(512, 150, (g, w, h) => {
    g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8d8a80'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = '#2c2e33'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold 44px ${F.sans}`; g.fillText('ЛЮТЕРАНСКАЯ ЦЕРКОВЬ', w / 2, h * 0.32); g.font = `bold 40px ${F.sans}`; g.fillText('СВ. ЕКАТЕРИНЫ', w / 2, h * 0.7);
  }, 'lutSign');
  // ------------------------------------------------------------------------------------------ St Michael: the painted Gothic bays of the nave, the notice board
  /** one nave bay (5.5 m wide, 11 m tall tile): a pointed blind arch with a PAIR of lancets (0.9 x 2.8 m) over a round oculus (d 1.0), pilaster-buttress strips at both edges, a corbel-table frieze at the top */
  A.nave = D(256, 512, (g, w, h) => {
    g.fillStyle = C.michael; g.fillRect(0, 0, w, h); speckle(g, w, h, 9421, 260, 0.06);
    const px = w / 5.5, py = h / 11, cx = w / 2;
    g.fillStyle = C.michaelWhite; g.fillRect(0, h - 2.3 * py, w, 2.3 * py);                                            // the white lower zone up to 2.3 m
    g.fillStyle = '#d4c6aa'; g.fillRect(0, 0, 0.3 * px, h); g.fillRect(w - 0.3 * px, 0, 0.3 * px, h);                  // the buttress strips
    const lancet = (x, y0, ww, hh, fill) => { g.fillStyle = fill; g.beginPath(); g.moveTo(x - ww / 2, y0); g.lineTo(x - ww / 2, y0 - hh + ww); g.quadraticCurveTo(x - ww / 2, y0 - hh + ww * 0.3, x, y0 - hh); g.quadraticCurveTo(x + ww / 2, y0 - hh + ww * 0.3, x + ww / 2, y0 - hh + ww); g.lineTo(x + ww / 2, y0); g.closePath(); g.fill(); };
    const sill = h - 4.0 * py;                                                                                          // lancets from y 4.0 to 6.8
    lancet(cx, sill + 0.35 * py, 3.1 * px, 4.6 * py, C.michaelTrim);                                                    // the pointed blind arch (white ring)
    lancet(cx, sill + 0.15 * py, 2.8 * px, 4.3 * py, C.michael);
    for (const s of [-1, 1]) { lancet(cx + s * 0.75 * px, sill, 0.9 * px, 2.8 * py, '#3a4650'); g.fillStyle = '#8c8a80'; g.fillRect(cx + s * 0.75 * px - 1.5, sill - 2.8 * py + 0.3 * px, 3, 2.8 * py); }
    g.fillStyle = '#3a4650'; g.beginPath(); g.arc(cx, sill - 3.4 * py, 0.5 * px, 0, TAU); g.fill(); g.strokeStyle = C.michaelTrim; g.lineWidth = 5; g.stroke();   // the oculus
    g.fillStyle = '#d8cbb0'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(i * w / 8 + w / 16, 0.3 * py, 0.17 * px, 0, Math.PI); g.fill(); }  // corbel table
  }, 'nave');
  /** the arched notice board at the right of the portal (0.9 x 1.4 m): «СОБОР / Св. Михаила» */
  A.michaelBoard = D(180, 280, (g, w, h) => {
    g.fillStyle = '#4a2a20'; g.beginPath(); g.moveTo(0, h); g.lineTo(0, h * 0.28); g.quadraticCurveTo(0, 0, w / 2, 0); g.quadraticCurveTo(w, 0, w, h * 0.28); g.lineTo(w, h); g.closePath(); g.fill();
    g.fillStyle = '#efe9d8'; g.fillRect(14, h * 0.3, w - 28, h * 0.62);
    g.fillStyle = '#2c2a27'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold 34px ${F.serif}`; g.fillText('СОБОР', w / 2, h * 0.46); g.font = `22px ${F.serif}`; g.fillText('Св. Михаила', w / 2, h * 0.64);
  }, 'michaelBoard');
  return A;
}
