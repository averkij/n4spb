// landmarksSevkabel/art.js - the canvas paintings of the module (docs/research/sevkabel.md; photos refs/sevkabel).  One painter per texture; every key starts with 'lmsevka-'
// (the texture cache is scene-wide: a prefix that matches another module silently takes its textures).  Tile sizes are in metres and are given with every painter: the geometry sets uv = metres / tile.
//   chp:      the sheet-clad plant block (one wall = 8 x 28 m: panel joints, three ribbon bands, plinth, cornice).
// (more painters are added below as the parts of the module are built.)
const TAU = Math.PI * 2;
export const COL = {
  chimRed: '#b8452c', chimRedDark: '#8a3a2a', chimWhite: '#e8e6e0', steel: '#5a5a5c', ladder: '#9a9ea0',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {};
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmsevka-' + key, repeat });
  const R = (seed) => ctx.rng(seed);
  const speckle = (g, w, h, seed, n, a = 0.1) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,32'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2); } };
  void TAU;

  // ------------------------------------------------------------------------------------------ CHP-7 block: tile 8 m wide x 28 m tall (v = y / 28)
  A.chp = D(256, 1024, (g, w, h) => {
    const Y = (y) => h * (1 - y / 28);
    g.fillStyle = '#d6dcdf'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(150,160,166,0.45)'; for (let i = 0; i <= 4; i++) g.fillRect(i * (w / 4) - 1, 0, 2, h);          // panel joints every 2 m
    for (const y0 of [6, 11, 17]) {                                                                                     // ribbon glazing 1.5 m tall
      g.fillStyle = '#44525c'; g.fillRect(0, Y(y0 + 1.5), w, Y(y0) - Y(y0 + 1.5));
      g.fillStyle = 'rgba(160,190,205,0.30)'; g.fillRect(0, Y(y0 + 1.5), w, (Y(y0) - Y(y0 + 1.5)) * 0.35);
      g.fillStyle = '#aab3b8'; for (let i = 0; i <= 4; i++) g.fillRect(i * (w / 4) - 2, Y(y0 + 1.5), 4, Y(y0) - Y(y0 + 1.5));
      g.fillStyle = 'rgba(120,128,134,0.55)'; g.fillRect(0, Y(y0), w, 3);
    }
    g.fillStyle = '#a9afb1'; g.fillRect(0, Y(2), w, Y(0) - Y(2));                                                       // plinth
    g.fillStyle = '#c4cacd'; g.fillRect(0, 0, w, Y(27));                                                                // cornice band
    g.fillStyle = 'rgba(90,98,104,0.5)'; g.fillRect(0, Y(27), w, 3);
    speckle(g, w, h, 8101, 900, 0.07);
  }, 'chp');

  /** a wrapped blob painter: draws the shape at the 9 tile offsets so that the tile repeats without a seam */
  const wrap = (g, w, h, fn) => { for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) fn(ox, oy); };
  /** a soft-edged elliptical blob (radial gradient from the colour at the centre to transparent), drawn at the 9 tile offsets */
  const soft = (g, w, h, x, y, rx, ry, rgb, a) => wrap(g, w, h, (ox, oy) => { g.save(); g.translate(x + ox, y + oy); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, 'rgba(' + rgb + ',' + a.toFixed(3) + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore(); });

  // ------------------------------------------------------------------------------------------ the hall: board-marked concrete under peeling white paint (photos 028 034 017): tile 3.6 x 3.6 m, joints every 1.2 m
  A.conc = D(512, 512, (g, w, h) => {
    const r = R(8201);
    g.fillStyle = '#c3beaf'; g.fillRect(0, 0, w, h);                                                                      // warm grey-beige concrete
    for (let i = 0; i < 46; i++) soft(g, w, h, r() * w, r() * h, 40 + r() * 90, 14 + r() * 34, '238,233,218', 0.22 + r() * 0.3);   // the old white paint
    for (let i = 0; i < 40; i++) soft(g, w, h, r() * w, r() * h, 20 + r() * 50, 8 + r() * 22, '104,104,98', 0.14 + r() * 0.2);  // bare grey patches
    for (let i = 0; i < 26; i++) { const x = r() * w, y = r() * h, l = 40 + r() * 120; wrap(g, w, h, (ox, oy) => { g.fillStyle = 'rgba(96,92,84,0.10)'; g.fillRect(x + ox, y + oy, 1.5 + r() * 2, l); }); }    // rain streaks
    g.fillStyle = 'rgba(0,0,0,0.035)'; for (let y = 0; y < h; y += 17) g.fillRect(0, y, w, 1);                                // board marks every 0.12 m
    g.fillStyle = 'rgba(70,66,58,0.30)'; for (let k = 0; k < 3; k++) { g.fillRect(0, k * h / 3, w, 2); g.fillRect(k * w / 3, 0, 2, h); }
    speckle(g, w, h, 8202, 500, 0.06);
  }, 'conc');
  /** the painted spandrel / wall panels between the windows: whiter, mottled: tile 3.6 x 3.6 m */
  A.concPaint = D(512, 512, (g, w, h) => {
    const r = R(8211);
    g.fillStyle = '#ddd8c7'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 50; i++) soft(g, w, h, r() * w, r() * h, 20 + r() * 50, 8 + r() * 24, '150,146,134', 0.08 + r() * 0.14);
    g.fillStyle = 'rgba(80,76,68,0.28)'; for (let k = 0; k < 3; k++) { g.fillRect(0, k * h / 3, w, 2); g.fillRect(k * w / 3, 0, 2, h); }
    speckle(g, w, h, 8212, 500, 0.06);
  }, 'concPaint');
  /** one pane of a steel window wall (1.6 x 1.1 m): rust-brown frame, dark grey-green glass with a faint sky streak (photo 028) */
  const pane = (g, w, h, glassA, glassB, frame, bar) => {
    const gr = g.createLinearGradient(0, 0, w * 0.6, h); gr.addColorStop(0, glassA); gr.addColorStop(1, glassB); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(190,205,210,0.16)'; g.beginPath(); g.moveTo(0, h * 0.65); g.lineTo(w * 0.55, 0); g.lineTo(w * 0.8, 0); g.lineTo(0, h * 0.95); g.closePath(); g.fill();
    g.fillStyle = frame; const t = Math.max(3, w * 0.045); g.fillRect(0, 0, w, t * 0.7); g.fillRect(0, h - t * 0.7, w, t * 0.7); g.fillRect(0, 0, t, h); g.fillRect(w - t, 0, t, h);
    if (bar) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(w * 0.2, h * 0.5, w * 0.6, 2); }
  };
  A.rustWin = D(256, 176, (g, w, h) => pane(g, w, h, '#53656a', '#3a4a4e', '#6b3a2a', false), 'rustWin');
  A.milkyWin = D(256, 176, (g, w, h) => pane(g, w, h, '#d6dcd8', '#bcc6c4', '#3a3633', false), 'milkyWin');
  A.darkWin = D(256, 176, (g, w, h) => pane(g, w, h, '#33393d', '#22282c', '#26221f', false), 'darkWin');
  /** the alley face: a ribbon-window row, cell 3.0 m wide x 3.1 m tall (sill panel 0.6 m, window 1.4 m, head panel 1.1 m): cream precast panel, dark brown steel frames (photos 027 029) */
  A.ribbon = D(256, 264, (g, w, h) => {
    g.fillStyle = '#d6ccaa'; g.fillRect(0, 0, w, h);
    const wy = h * (1 - 2.0 / 3.1), wh = h * 1.4 / 3.1;
    g.fillStyle = '#3d4549'; g.fillRect(0, wy, w, wh);
    g.fillStyle = 'rgba(180,200,205,0.2)'; g.fillRect(0, wy, w, wh * 0.4);
    g.fillStyle = '#4a3a30'; g.fillRect(0, wy - 3, w, 3); g.fillRect(0, wy + wh, w, 3); for (const x of [0, w / 2 - 1.5, w - 3]) g.fillRect(x, wy, 3, wh);
    g.fillStyle = 'rgba(90,82,66,0.4)'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h);
    speckle(g, w, h, 8221, 120, 0.07);
  }, 'ribbon');
  /** red brick, running bond, tile 2 x 2 m (courses of 0.0833 m: 24 per tile): neutral base, tinted by the material colour */
  A.brick = D(512, 512, (g, w, h) => {
    const r = R(8231);
    // a NEUTRAL light brick pattern: the material colour (brickRed / brickDark / plinth ...) tints it
    g.fillStyle = '#c9c1b6'; g.fillRect(0, 0, w, h);
    const rows = 24, rh = h / rows, bw = w / 8;
    for (let row = 0; row < rows; row++) for (let c = -1; c < 9; c++) {
      const x = c * bw + (row % 2) * bw / 2, v = 0.88 + r() * 0.22;
      g.fillStyle = `rgb(${Math.min(255, 238 * v) | 0},${Math.min(255, 232 * v) | 0},${Math.min(255, 226 * v) | 0})`; g.fillRect(x + 1.2, row * rh + 1, bw - 2.4, rh - 2);
    }
    speckle(g, w, h, 8232, 600, 0.05);
  }, 'brick');
  // ------------------------------------------------------------------------------------------ window sashes: one opening = one quad (the cell is the opening); arched heads are PAINTED (wall-coloured corners above a lintel ring)
  /** o: { wall, frame, glass: [top, bottom], lintel, bars: [cols, rows], arch: 'seg' | 'round' | null, trans: fraction of the height of a transom bar (0 = none), fw: frame width px } */
  const sashPaint = (g, w, h, o) => {
    const fw = o.fw ?? Math.max(3, w * 0.05);
    g.fillStyle = o.wall; g.fillRect(0, 0, w, h);
    const archH = o.arch === 'round' ? w / 2 : o.arch === 'seg' ? w * 0.22 : 0;
    // glass region path (rect with an arched top)
    const path = (inset) => {
      g.beginPath(); g.moveTo(inset, h); g.lineTo(inset, archH + (o.arch ? 0 : inset));
      if (o.arch === 'round') g.arc(w / 2, w / 2, w / 2 - inset, Math.PI, 0, false);
      else if (o.arch === 'seg') g.quadraticCurveTo(w / 2, -archH * 0.45 + inset, w - inset, archH);
      else g.lineTo(w - inset, inset);
      g.lineTo(w - inset, h); g.closePath();
    };
    if (o.arch && o.lintel) { g.fillStyle = o.lintel; path(0); g.fill(); }
    g.fillStyle = o.frame; path(o.arch && o.lintel ? w * 0.06 : 0); g.fill();
    const gr = g.createLinearGradient(0, 0, w * 0.5, h); gr.addColorStop(0, o.glass[0]); gr.addColorStop(1, o.glass[1]); g.fillStyle = gr;
    path(fw + (o.arch && o.lintel ? w * 0.06 : 0)); g.fill();
    g.fillStyle = 'rgba(200,215,220,0.13)'; g.beginPath(); g.moveTo(0, h * 0.7); g.lineTo(w * 0.6, h * 0.1); g.lineTo(w * 0.85, h * 0.1); g.lineTo(0, h); g.closePath(); g.fill();
    g.fillStyle = o.frame;
    const [cols, rows] = o.bars || [2, 3];
    for (let i = 1; i < cols; i++) g.fillRect(w * i / cols - fw * 0.4, archH * 0.6, fw * 0.8, h);
    for (let j = 1; j <= rows; j++) g.fillRect(0, archH + (h - archH) * j / (rows + 1) - fw * 0.4, w, fw * 0.8);
    if (o.trans) g.fillRect(0, h * o.trans - fw * 0.5, w, fw);
    if (o.arch && o.lintel) { g.strokeStyle = o.lintel; g.lineWidth = Math.max(2, w * 0.05); g.beginPath(); g.moveTo(0, h); g.lineTo(0, archH); if (o.arch === 'round') g.arc(w / 2, w / 2, w / 2, Math.PI, 0, false); else g.quadraticCurveTo(w / 2, -archH * 0.45, w, archH); g.lineTo(w, h); g.stroke(); }
  };
  A.sashBrick = D(96, 160, (g, w, h) => sashPaint(g, w, h, { wall: '#a74a2c', frame: '#2f2e2b', glass: ['#3f484d', '#272e33'], lintel: '#e3d6bb', bars: [2, 3], arch: 'seg' }), 'sashBrick');
  A.sashTallGreen = D(112, 248, (g, w, h) => sashPaint(g, w, h, { wall: '#9a452a', frame: '#2f4a3c', glass: ['#4a5a5c', '#2d393c'], bars: [2, 5], trans: 0.22, fw: 4 }), 'sashTallGreen');
  A.sashWhitePrism = D(112, 120, (g, w, h) => sashPaint(g, w, h, { wall: '#d9d6c8', frame: '#eeeeea', glass: ['#58646e', '#3a444c'], bars: [2, 1], fw: 5 }), 'sashWhitePrism');
  A.sashWhite = D(104, 168, (g, w, h) => sashPaint(g, w, h, { wall: '#d3c6a2', frame: '#f1efe6', glass: ['#4d5a64', '#323d46'], bars: [2, 3], trans: 0.25, fw: 5 }), 'sashWhite');
  A.sashAlms = D(96, 176, (g, w, h) => sashPaint(g, w, h, { wall: '#b4502d', frame: '#2b2a28', glass: ['#454e53', '#2a3236'], lintel: '#efe8dc', bars: [2, 3], arch: 'round' }), 'sashAlms');
  A.sashFactory = D(112, 208, (g, w, h) => sashPaint(g, w, h, { wall: '#e4e9dc', frame: '#4f3f33', glass: ['#566673', '#303c47'], bars: [3, 5], trans: 0.18, fw: 4 }), 'sashFactory');
  A.sashPink = D(104, 160, (g, w, h) => sashPaint(g, w, h, { wall: '#ebb5a5', frame: '#f6f1e8', glass: ['#4d5a64', '#323d46'], bars: [2, 3], trans: 0.25, fw: 5 }), 'sashPink');
  /** the lantern dates band «1879  1942  1949  1979» (white on dark): 8 x 1 m */
  A.dates = D(512, 64, (g, w, h) => {
    g.fillStyle = '#24282b'; g.fillRect(0, 0, w, h);
    g.font = `700 40px ${tex.FONTS ? tex.FONTS.sans : 'sans-serif'}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f2f0ea';
    ['1879', '1942', '1949', '1979'].forEach((t, i) => g.fillText(t, w * (i + 0.5) / 4, h * 0.54));
  }, 'dates');
  // ------------------------------------------------------------------------------------------------ the Brusnitsyn quarter, Skobsky, the almshouse
  /** plaster with soft mottling: base colour, patch colour list [rgb strings], n blobs */
  const plaster = (g, w, h, seed, base, patches, n = 50, rmax = 40) => {
    const r = R(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) { const c = patches[(r() * patches.length) | 0], m = /rgba\((\d+,\d+,\d+),/.exec(c); soft(g, w, h, r() * w, r() * h, 12 + r() * rmax * 1.3, 8 + r() * rmax * 0.7, m ? m[1] : '120,120,120', 0.08 + r() * 0.14); }
    speckle(g, w, h, seed + 1, 300, 0.05);
  };
  A.plasterOld = D(256, 256, (g, w, h) => plaster(g, w, h, 8401, '#d8cba4', ['rgba(150,142,120,A)', 'rgba(255,248,226,A)'], 46, 40), 'plasterOld');
  A.plasterPink = D(256, 256, (g, w, h) => plaster(g, w, h, 8411, '#ebb5a5', ['rgba(190,120,104,A)', 'rgba(255,225,214,A)'], 40, 36), 'plasterPink');
  A.plasterRose = D(256, 256, (g, w, h) => plaster(g, w, h, 8421, '#c7907c', ['rgba(120,70,56,A)', 'rgba(222,170,150,A)'], 40, 36), 'plasterRose');
  A.plasterMint = D(256, 256, (g, w, h) => plaster(g, w, h, 8491, '#e4e9dc', ['rgba(150,170,150,A)', 'rgba(255,255,250,A)', 'rgba(176,112,90,A)'], 36, 34), 'plasterMint');
  A.plasterSand = D(256, 256, (g, w, h) => plaster(g, w, h, 8431, '#d3c6a2', ['rgba(150,140,112,A)', 'rgba(240,232,206,A)'], 40, 34), 'plasterSand');
  /** the older mansion walls: bright ochre-yellow stucco flaking down to pink brick (tile 4 x 4 m) */
  A.ochre = D(256, 256, (g, w, h) => {
    plaster(g, w, h, 8441, '#d4a93c', ['rgba(240,205,100,A)', 'rgba(150,110,30,A)'], 30, 40);
    const r = R(8442); for (let i = 0; i < 14; i++) { const x = r() * w, y = r() * h, bw = 14 + r() * 40, bh = 8 + r() * 24; wrap(g, w, h, (ox, oy) => { g.fillStyle = 'rgba(176,112,90,0.75)'; g.fillRect(x + ox, y + oy, bw, bh); g.fillStyle = 'rgba(120,70,56,0.5)'; for (let k = 0; k < bh; k += 6) g.fillRect(x + ox, y + oy + k, bw, 1); }); }
  }, 'ochre');
  /** the yard wall: bright yellow plaster with the brick showing at the foot (3 m x 2.7 m: v 0 = ground) */
  A.wallYellow = D(192, 170, (g, w, h) => {
    g.fillStyle = '#f0c64a'; g.fillRect(0, 0, w, h);
    const r = R(8451); for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(255,236,150,${0.1 + r() * 0.2})`; g.fillRect(r() * w, r() * h * 0.8, 20 + r() * 40, 8 + r() * 20); }
    for (let i = 0; i < 40; i++) { const x = r() * w, y = h - r() * 36, bw = 10 + r() * 22; g.fillStyle = 'rgba(184,104,74,0.85)'; g.fillRect(x, y, bw, 7); }
    g.fillStyle = 'rgba(120,70,40,0.35)'; for (let k = 0; k < 6; k++) g.fillRect(0, h - 6 - k * 7, w, 1);
  }, 'wallYellow');
  /** rusticated ground floor of the mansion: rock-faced blocks 0.9 x 0.45 m dark grey-brown with pink brick showing through (tile 3.6 x 1.8 m) */
  A.rock = D(512, 256, (g, w, h) => {
    const r = R(8461); g.fillStyle = '#5e574c'; g.fillRect(0, 0, w, h);
    const rows = 4, rh = h / rows;
    for (let row = 0; row < rows; row++) for (let c = -1; c < 5; c++) {
      const x = c * 128 + (row % 2) * 64, v = 0.9 + r() * 0.2, pink = r() < 0.05;
      g.fillStyle = pink ? `rgb(${176 * v | 0},${112 * v | 0},${90 * v | 0})` : `rgb(${150 * v | 0},${142 * v | 0},${122 * v | 0})`; g.fillRect(x + 3, row * rh + 3, 122, rh - 6);
      g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x + 3, row * rh + 3, 122, 5);
    }
    speckle(g, w, h, 8462, 700, 0.12);
  }, 'rock');
  /** barred ground-floor window of the mansion (1.2 x 1.7 m): dark glass behind black iron bars */
  A.barred = D(96, 136, (g, w, h) => {
    g.fillStyle = '#8f8878'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#242b2c'; g.fillRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#10130f'; for (let i = 0; i < 8; i++) g.fillRect(8 + i * 11, 4, 3, h - 8); g.fillRect(4, h * 0.35, w - 8, 3); g.fillRect(4, h * 0.7, w - 8, 3);
  }, 'barred');
  /** tall first-floor window with a heavy moulded frame and a curtain (1.5 x 3.4 m) */
  A.curtain = D(96, 216, (g, w, h) => {
    g.fillStyle = '#c9b88a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#8a7a5a'; g.fillRect(3, 3, w - 6, h - 6);
    g.fillStyle = '#4a4034'; g.fillRect(9, 9, w - 18, h - 18);
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7b6a52'); gr.addColorStop(1, '#5e5040'); g.fillStyle = gr; g.fillRect(12, 12, w - 24, h - 24);
    g.fillStyle = 'rgba(255,230,170,0.18)'; for (let i = 0; i < 6; i++) g.fillRect(14 + i * 12, 12, 4, h - 24);
    g.fillStyle = '#4a4034'; g.fillRect(w / 2 - 1.5, 12, 3, h - 24);
  }, 'curtain');
  /** garland frieze under the mansion cornice (5 m x 1 m): swags of leaves on pale stucco */
  A.garland = D(512, 104, (g, w, h) => {
    g.fillStyle = '#d2c496'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#b8a97a'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6);
    for (let i = 0; i < 5; i++) {
      const x0 = i * w / 5, x1 = (i + 1) * w / 5;
      g.strokeStyle = '#a69868'; g.lineWidth = 9; g.beginPath(); g.moveTo(x0 + 8, 20); g.quadraticCurveTo((x0 + x1) / 2, 100, x1 - 8, 20); g.stroke();
      g.strokeStyle = '#e8dcb4'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0 + 8, 18); g.quadraticCurveTo((x0 + x1) / 2, 96, x1 - 8, 18); g.stroke();
      g.fillStyle = '#a69868'; g.beginPath(); g.arc(x0 + 8, 22, 9, 0, TAU); g.fill();
    }
  }, 'garland');
  /** skobsky: the rusticated lower floors: horizontal grooves every 0.75 m on darker sand (tile 3 x 3 m) */
  A.skobBase = D(256, 256, (g, w, h) => {
    plaster(g, w, h, 8471, '#c4b698', ['rgba(120,108,84,A)', 'rgba(230,220,190,A)'], 36, 34);
    g.fillStyle = 'rgba(90,78,56,0.4)'; for (let i = 0; i < 4; i++) g.fillRect(0, i * 64, w, 2);
  }, 'skobBase');
  /** weathered timber boards (the skyway): horizontal boards 0.2 m, dark brown (tile 2 x 1 m) */
  A.boards = D(256, 128, (g, w, h) => {
    const r = R(8481); g.fillStyle = '#3b2519'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5; i++) { const v = 0.8 + r() * 0.35; g.fillStyle = `rgb(${122 * v | 0},${74 * v | 0},${58 * v | 0})`; g.fillRect(0, i * 25.6 + 1, w, 23.6); }
    g.fillStyle = 'rgba(40,24,16,0.5)'; g.fillRect(0, 0, 4, h); g.fillRect(w - 4, 0, 4, h);
  }, 'boards');
  /** the almshouse cast-iron fence: spear-topped bars, two rails (alpha cut-out; 3 m x 1.8 m) */
  A.fence = D(256, 160, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#17191a';
    for (let x = 3; x < w; x += 10) { g.fillRect(x, 20, 2.5, h - 20); g.beginPath(); g.moveTo(x - 1, 20); g.lineTo(x + 1.25, 6); g.lineTo(x + 3.5, 20); g.closePath(); g.fill(); }
    g.fillRect(0, 36, w, 3.5); g.fillRect(0, h - 30, w, 3.5);
    for (let x = 0; x < w; x += 64) { g.beginPath(); g.arc(x + 32, 62, 9, 0, TAU); g.lineWidth = 2.2; g.strokeStyle = '#17191a'; g.stroke(); }
  }, 'fence');
  /** the round hanging sign of the arts centre (0.9 m, dark green on cream; a plain wordmark): photo 089 */
  A.signRound = D(128, 128, (g, w, h) => {
    g.fillStyle = '#efe6d0'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 2, 0, TAU); g.fill();
    g.strokeStyle = '#2f5a48'; g.lineWidth = 7; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 8, 0, TAU); g.stroke();
    g.fillStyle = '#2f5a48'; g.textAlign = 'center'; g.textBaseline = 'middle'; tex.fitText(g, 'БРУСНИЦЫН', w / 2, h / 2, w - 36, 20, tex.FONTS ? tex.FONTS.sans : 'sans-serif', 700);
  }, 'signRound');
  /** weathering (Corten) steel plate: rust brown with orange streaks and a few darker patches, 3.3 x 4.6 m */
  A.corten = D(128, 192, (g, w, h) => {
    const r = R(8321);
    g.fillStyle = '#7a3b22'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { const x = r() * w, y = r() * h * 0.6, l = 20 + r() * 90; g.fillStyle = `rgba(${r() < 0.5 ? '169,88,45' : '96,44,24'},${0.18 + r() * 0.3})`; g.fillRect(x, y, 1.5 + r() * 4, l); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h);
  }, 'corten');
  // ------------------------------------------------------------------------------------------ the promenade (photos 034 032 017)
  /** larch deck, boards along u (0.14 m wide with a 6 mm gap): tile 1.12 m (8 boards) x 2.4 m */
  A.deck = D(128, 256, (g, w, h) => {
    const r = R(8241);
    g.fillStyle = '#4a2c1c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) { const v = 0.9 + r() * 0.2; g.fillStyle = `rgb(${139 * v | 0},${90 * v | 0},${60 * v | 0})`; g.fillRect(i * 16 + 1, 0, 14, h); g.fillStyle = 'rgba(60,34,20,0.25)'; g.fillRect(i * 16 + 4 + (r() * 6 | 0), 0, 1, h); if (r() < 0.8) { const y = r() * h; g.fillStyle = 'rgba(40,24,14,0.5)'; g.fillRect(i * 16 + 1, y, 14, 2); } }
  }, 'deck');
  /** slatted larch bench / stage: slats 0.07 m across u: tile 1 m x 1 m */
  A.slats = D(128, 128, (g, w, h) => {
    const r = R(8251);
    g.fillStyle = '#5b351f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 12; i++) { const v = 0.92 + r() * 0.16; g.fillStyle = `rgb(${180 * v | 0},${104 * v | 0},${58 * v | 0})`; g.fillRect(0, i * (h / 12) + 1, w, h / 12 - 2); }
  }, 'slats');
  /** mown lawn with faint stripes: tile 6 x 6 m */
  A.lawn = D(256, 256, (g, w, h) => {
    const r = R(8261);
    g.fillStyle = '#6d9a4c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,30,0,0.05)'; g.fillRect(0, i * h / 6, w, h / 6); }
    for (let i = 0; i < 900; i++) { const x = r() * w, y = r() * h; g.fillStyle = r() < 0.5 ? 'rgba(90,140,60,0.5)' : 'rgba(60,110,40,0.5)'; g.fillRect(x, y, 1.5, 3); }
  }, 'lawn');
  /** pale stone slabs 0.5 x 1.0 m, long side across the path (photo 034): tile 1 x 1 m */
  A.slabPath = D(128, 128, (g, w, h) => {
    const r = R(8271);
    g.fillStyle = '#9d9c97'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) { const v = 0.95 + r() * 0.08; g.fillStyle = `rgb(${190 * v | 0},${190 * v | 0},${184 * v | 0})`; g.fillRect(1, i * 64 + 1, w - 2, 62); }
    speckle(g, w, h, 8272, 120, 0.08);
  }, 'slabPath');
  /** fine reddish-brown gravel (the pier plaza, photo 016): tile 4 x 4 m */
  A.gravel = D(256, 256, (g, w, h) => {
    const r = R(8281);
    g.fillStyle = '#7d5d4f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const x = r() * w, y = r() * h, v = r(); g.fillStyle = v < 0.33 ? 'rgba(160,120,100,0.5)' : v < 0.66 ? 'rgba(80,56,48,0.5)' : 'rgba(110,86,76,0.5)'; g.fillRect(x, y, 2, 2); }
  }, 'gravel');
  /** dark grey-brown concrete pavers 0.3 x 0.6 m in running bond with a lighter band 1.2 m wide every 8 m (photos 021 022 027): tile 8 x 8 m (bands along v at u = 0 .. 1.2) */
  A.pavers = D(512, 512, (g, w, h) => {
    const r = R(8291), px = w / 8;
    g.fillStyle = '#4c4a4b'; g.fillRect(0, 0, w, h);
    const rows = 27, rh = h / rows;
    for (let row = 0; row < rows; row++) for (let c = -1; c < 14; c++) {
      const x = c * (px * 0.6) + (row % 2) * px * 0.3, v = 0.92 + r() * 0.16, band = (x + px * 0.3) < px * 1.2 && x > -px * 0.3;
      const base = band ? [138, 135, 136] : [110, 107, 108];
      g.fillStyle = `rgb(${base[0] * v | 0},${base[1] * v | 0},${base[2] * v | 0})`; g.fillRect(x + 1, row * rh + 1, px * 0.6 - 2, rh - 2);
    }
  }, 'pavers');
  // ------------------------------------------------------------------------------------------ murals of the gable ends (flat pictures, no text, no logos; photos 003 016 017 026)
  /** the teal wall of the NW gable, 8 x 21 m (a pair of figures in blue-grey) */
  A.muralTeal = D(192, 504, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#34a08e'); gr.addColorStop(1, '#2a8878'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#7f98a8'; g.beginPath(); g.moveTo(24, h * 0.18); g.lineTo(70, h * 0.17); g.lineTo(84, h * 0.34); g.lineTo(70, h * 0.62); g.lineTo(28, h * 0.62); g.lineTo(14, h * 0.34); g.closePath(); g.fill();
    g.fillStyle = '#5f7a8d'; g.beginPath(); g.moveTo(96, h * 0.2); g.lineTo(150, h * 0.19); g.lineTo(166, h * 0.4); g.lineTo(150, h * 0.62); g.lineTo(100, h * 0.62); g.lineTo(88, h * 0.4); g.closePath(); g.fill();
    g.fillStyle = '#d7b48e'; g.beginPath(); g.ellipse(52, h * 0.15, 20, 30, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(125, h * 0.17, 20, 30, 0, 0, TAU); g.fill();
    g.fillStyle = '#3c5a68'; g.fillRect(0, h * 0.62, w, h * 0.38);
    g.fillStyle = '#2a4a3a'; g.fillRect(0, h - 42, w, 42);
  }, 'muralTeal');
  /** the peach wall of the NW gable, 14.5 x 21 m: wavy green bands with cyan lines, a dark green plinth 4 m tall */
  A.muralPeach = D(384, 560, (g, w, h) => {
    g.fillStyle = '#e9a177'; g.fillRect(0, 0, w, h);
    for (let b = 0; b < 15; b++) {
      const y0 = 30 + b * 33;
      g.strokeStyle = '#5e7d3a'; g.lineWidth = 15; g.beginPath();
      for (let x = 0; x <= w; x += 6) { const y = y0 + Math.sin(x * 0.045 + b * 0.8) * 13 + Math.sin(x * 0.11 + b) * 6; if (x === 0) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
      g.strokeStyle = '#33b6c4'; g.lineWidth = 3.5; g.beginPath();
      for (let x = 0; x <= w; x += 6) { const y = y0 + 9 + Math.sin(x * 0.045 + b * 0.8 + 0.4) * 13 + Math.sin(x * 0.11 + b) * 6; if (x === 0) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
    }
    g.fillStyle = '#2a4a3a'; g.fillRect(0, h - 107, w, 107);
  }, 'muralPeach');
  /** the pink wall of the SE gable (a balloon-like disc and a sleepy round face; no text), 17 x 21 m */
  A.muralPink = D(256, 320, (g, w, h) => {
    g.fillStyle = '#d65aa6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2ac2e'; g.beginPath(); g.arc(w * 0.5, h * 0.3, w * 0.3, 0, TAU); g.fill();
    g.strokeStyle = '#26272b'; g.lineWidth = 6; g.beginPath(); for (let i = 0; i <= 12; i++) { const x = w * 0.12 + i * w * 0.76 / 12, y = h * 0.3 + (i % 2 ? 14 : -14); if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
    g.fillStyle = '#f4f1ea'; g.beginPath(); g.ellipse(w * 0.5, h * 0.8, w * 0.3, h * 0.2, 0, 0, TAU); g.fill();
    g.fillStyle = '#26272b'; g.fillRect(w * 0.33, h * 0.78, w * 0.12, 4); g.fillRect(w * 0.56, h * 0.78, w * 0.12, 4);
  }, 'muralPink');
  /** the yellow wall with a gantry crane and a big "7" (SE gable, NE flank), 9 x 21 m */
  A.muralYellow = D(144, 336, (g, w, h) => {
    g.fillStyle = '#e8c340'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#26272b'; g.fillRect(14, h * 0.12, w - 28, 8); g.fillRect(24, h * 0.12, 6, h * 0.42); g.fillRect(w - 30, h * 0.12, 6, h * 0.42); g.fillRect(24, h * 0.3, w - 48, 5);
    g.fillStyle = '#c24a2a'; g.fillRect(40, h * 0.3, 34, 22);
    g.font = '700 150px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#26272b'; g.fillText('7', w / 2, h * 0.88);
  }, 'muralYellow');

  /** the ticket container's long side (6 x 2.6 m): blue steel with the white outline wordmark «ПРИЧАЛ» (photos 016 017; plain letters, no logo) */
  A.container = D(512, 224, (g, w, h) => {
    g.fillStyle = '#2c63c7'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,40,0.18)'; for (let x = 8; x < w; x += 22) g.fillRect(x, 0, 5, h);                         // corrugation
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, w, 5); g.fillRect(0, h - 5, w, 5);
    g.font = `700 96px ${tex.FONTS ? tex.FONTS.sans : 'sans-serif'}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.strokeText('ПРИЧАЛ', w / 2, h * 0.5);
  }, 'container');

  return A;
}
