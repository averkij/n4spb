// landmarksPribaltiyskaya/art.js - the canvas paintings of the module (docs/research/pribaltiyskaya.md sections 4.2, 4.4, 4.5, 5, 6, 8, 9; photos 08 15 01 12 (hotel), 10 (1981 slide), 45 52 48 (Kirov), n11 (Peter's scroll), cw_nakh_268028).
//   hotel:   the window bay (3.86 x 2.93 m: a 2.25 x 1.7 m dark window, a 1.25 m grey-bronze spandrel, the folded pier strip at the tile edge), the blind champagne panel (joints every 1.2 m), the base zone
//            (glass lobby with brown piers + the dark bronze band, 3.86 x 12.3 m), the dark crown / ear panel, the red granite plinth, the terrace (polished red-pink slabs with dark diagonal bands), the plaza slab field,
//            the roof word ПРИБАЛТИЙСКАЯ (white, cut-out), the canopy plate, the dome ribs, the Waterville glass and pink panels.
//   Kirov:   the platform grid (7 m pitch, 1.4 m pale strips, dark setts), the wall plates, the college front (6 m bay: pilasters, ground storey, four floors, inscription band, attic ribbon), the side wall, the
//            frieze (three lines of black capitals, cut-out), the bronze plaque with its four paragraphs.
//   Peter I: the decree scroll (ten lines of raised capitals on dark bronze).   Nakhimov: the gilt inscription, the round glass building's band texture.
// Every key starts with 'lmprib-' (the texture cache is scene-wide: a prefix that matches another module silently takes its textures).
const TAU = Math.PI * 2;

export const COL = {
  wall: '#b4ac9e', pier: '#c2baab', win: '#353a42', spandrel: '#8d857a', bandDark: '#3d3530', lobbyGlass: '#4a5560', crown: '#7a6044', attic: '#5a4636', beam: '#3d3e44', roof: '#4b4944',
  granite: '#8f6459', graniteLit: '#a8786c', granDark: '#6a3a32', setts: '#5f5a52', pale: '#b9b0a0', gran2: '#aaa8a4', limestone: '#cfc3a3', plaza: '#9e9288', asphalt: '#5d5f62',
  bronze: '#3a3430', gold: '#d9b24a', navy: '#1f3a6a',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {}, C = COL;
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmprib-' + key, repeat });
  const R = (seed) => ctx.rng(seed);
  const F = tex.FONTS;
  const speckle = (g, w, h, seed, n, a = 0.1) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,32'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2); } };
  /** text stretched to the width tw (canvas px) at x0, baseline y; letters of the given font size */
  const fit = (g, text, x0, y, tw, size, weight, fill, fam) => {
    g.font = `${weight} ${size}px ${fam}`; const m = g.measureText(text).width || 1;
    g.save(); g.translate(x0, y); g.scale(tw / m, 1); g.fillStyle = fill; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(text, 0, 0); g.restore();
  };

  // ------------------------------------------------------------------------------------------ the hotel window bay: tile 3.86 m x 2.93 m (192 x 146 px, 49.7 px/m); canvas y runs DOWN: the window sits at the BOTTOM (sill), the spandrel on top
  A.bay = D(192, 146, (g, w, h) => {
    const r = R(9301), ppm = w / 3.86;
    g.fillStyle = C.wall; g.fillRect(0, 0, w, h);
    // pier strips at the tile edges (the pier is split over the tile seam): folded panel = a light rib 0.9 m wide centred on the seam, darker angled facets either side
    g.fillStyle = C.pier; g.fillRect(0, 0, 0.45 * ppm, h); g.fillRect(w - 0.45 * ppm, 0, 0.45 * ppm, h);
    g.fillStyle = 'rgba(70,62,50,0.20)'; g.fillRect(0.45 * ppm, 0, 0.35 * ppm, h); g.fillRect(w - 0.8 * ppm, 0, 0.35 * ppm, h);
    g.fillStyle = 'rgba(60,54,44,0.35)'; g.fillRect(0.45 * ppm, 0, 1.5, h); g.fillRect(w - 0.45 * ppm - 1.5, 0, 1.5, h);
    // spandrel (top 1.25 m) grey-bronze with a horizontal split into two stacked pieces
    const sh = 1.25 * ppm, wx0 = 0.805 * ppm, ww = 2.25 * ppm, wh = 1.7 * ppm;
    g.fillStyle = C.spandrel; g.fillRect(0.8 * ppm, 0, w - 1.6 * ppm, sh);
    g.fillStyle = 'rgba(40,34,28,0.35)'; g.fillRect(0.8 * ppm, sh * 0.5 - 1, w - 1.6 * ppm, 2);
    g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(0.8 * ppm, 0, w - 1.6 * ppm, 3);
    // the window (two sashes, dark blue-grey glass with a sky glint), 0.2 m reveal shadow
    const gy0 = sh, gy1 = sh + wh;
    g.fillStyle = 'rgba(40,34,28,0.5)'; g.fillRect(wx0 - 3, gy0 - 2, ww + 6, wh + 3);
    const gr = g.createLinearGradient(0, gy0, 0, gy1); gr.addColorStop(0, '#46505e'); gr.addColorStop(1, C.win);
    g.fillStyle = gr; g.fillRect(wx0, gy0, ww, wh);
    g.fillStyle = 'rgba(150,176,200,0.22)'; g.beginPath(); g.moveTo(wx0 + ww * 0.1, gy1); g.lineTo(wx0 + ww * 0.45, gy0); g.lineTo(wx0 + ww * 0.62, gy0); g.lineTo(wx0 + ww * 0.27, gy1); g.closePath(); g.fill();
    if (r() < 0.5) { g.fillStyle = 'rgba(214,206,186,0.38)'; g.fillRect(wx0 + 2, gy0 + 2, ww * 0.48, wh * 0.55); }
    g.fillStyle = '#d4cfc4'; g.fillRect(wx0 + ww / 2 - 1.5, gy0, 3, wh); g.fillRect(wx0, gy0, ww, 2); g.fillRect(wx0, gy1 - 2, ww, 2);
    speckle(g, w, h, 9302, 120, 0.04);
  }, 'bay');

  // ------------------------------------------------------------------------------------------ blind champagne panel with vertical joints every 1.2 m: tile 2.4 x 2.93 m
  A.blind = D(128, 156, (g, w, h) => {
    g.fillStyle = '#b9ae9c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) { g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(i * 64 + 4, 0, 22, h); g.fillStyle = 'rgba(60,52,42,0.22)'; g.fillRect(i * 64, 0, 3, h); g.fillStyle = 'rgba(60,52,42,0.12)'; g.fillRect(i * 64 + 40, 0, 20, h); }
    g.fillStyle = 'rgba(60,52,42,0.18)'; g.fillRect(0, h - 3, w, 3);
    speckle(g, w, h, 9311, 90, 0.04);
  }, 'blind');

  // ------------------------------------------------------------------------------------------ the base zone 3.2 .. 15.5 (12.3 m) of one bay (3.86 m): glass lobby 7 m (bronze glass, brown piers, mullions at 1.93 m) + the dark bronze band 5.3 m
  A.base = D(128, 256, (g, w, h) => {
    const ppm = w / 3.86, py = h / 12.3, r = R(9321);
    g.fillStyle = C.bandDark; g.fillRect(0, 0, w, h);
    // canvas y runs down: the band is at the TOP (12.3 .. 7.0 m), the glass below it
    const yb = 5.3 * py;
    for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(i * 32 + 4, 0, 12, yb); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(i * 32, 0, 2, yb); }
    const gr = g.createLinearGradient(0, yb, 0, h); gr.addColorStop(0, '#5a6670'); gr.addColorStop(1, '#3c464e');
    g.fillStyle = gr; g.fillRect(0.55 * ppm, yb + 4, w - 1.1 * ppm, h - yb - 4);
    if (r() < 0.6) { g.fillStyle = 'rgba(216,185,112,0.18)'; g.fillRect(0.55 * ppm, yb + 4, w - 1.1 * ppm, (h - yb) * 0.5); }
    g.fillStyle = '#2f3438'; g.fillRect(w / 2 - 1.5, yb, 3, h - yb); g.fillRect(0.55 * ppm, yb + (h - yb) * 0.55, w - 1.1 * ppm, 2);
    g.fillStyle = '#4a3a30'; g.fillRect(0, yb, 0.55 * ppm, h - yb); g.fillRect(w - 0.55 * ppm, yb, 0.55 * ppm, h - yb);
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.moveTo(0.55 * ppm, h); g.lineTo(0.55 * ppm + 20, yb); g.lineTo(0.55 * ppm + 34, yb); g.lineTo(0.55 * ppm + 14, h); g.closePath(); g.fill();
  }, 'base');

  // ------------------------------------------------------------------------------------------ dark bronze crown / ear panel, vertical joints every 1.2 m: tile 2.4 x 2.4 m
  A.crownPanel = D(128, 128, (g, w, h) => {
    g.fillStyle = C.crown; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) { g.fillStyle = 'rgba(255,240,210,0.10)'; g.fillRect(i * 64 + 6, 0, 24, h); g.fillStyle = 'rgba(20,14,8,0.32)'; g.fillRect(i * 64, 0, 3, h); }
    speckle(g, w, h, 9331, 80, 0.05);
  }, 'crownPanel');
  // the fins band wall: the dark recess between the fins with narrow windows: one pair of fins (1.9 m) x 5.7 m (64 x 192 px)
  A.finsWall = D(64, 192, (g, w, h) => {
    g.fillStyle = '#a39a8c'; g.fillRect(0, 0, w, h);                                                    // the champagne recess between the fins (photo 15: the band reads light with narrow dark slits)
    g.fillStyle = 'rgba(40,34,28,0.25)'; g.fillRect(0, 0, w * 0.16, h); g.fillRect(w * 0.84, 0, w * 0.16, h);
    g.fillStyle = '#2a3038'; g.fillRect(w * 0.27, h * 0.1, w * 0.46, h * 0.8);
    g.fillStyle = 'rgba(130,160,190,0.22)'; g.fillRect(w * 0.31, h * 0.1, 5, h * 0.8);
  }, 'finsWall');

  // ------------------------------------------------------------------------------------------ red granite plinth wall: blocks 1.2 x 0.8 m, polished dark red-brown; tile 2.4 x 1.6 m
  A.plinth = D(128, 86, (g, w, h) => {
    const r = R(9341), cw = w / 2, rh = h / 2;
    g.fillStyle = '#6f4a40'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 2; row++) for (let c = -1; c < 3; c++) { const x = c * cw + (row % 2) * cw / 2, v = 0.9 + r() * 0.2; g.fillStyle = `rgb(${143 * v | 0},${100 * v | 0},${89 * v | 0})`; g.fillRect(x + 1.5, row * rh + 1.5, cw - 3, rh - 3); }
    g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, 0, w, 6);
    speckle(g, w, h, 9342, 80, 0.06);
  }, 'plinth');

  // ------------------------------------------------------------------------------------------ the terrace: polished red-pink granite slabs 1.5 x 1.0 m, dark brown polished bands crossing diagonally (1.0 m wide), a grey band every 6 m; tile 6 x 6 m
  A.terrace = D(256, 256, (g, w, h) => {
    const r = R(9351), s = w / 6;
    g.fillStyle = '#7c5a52'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 6; row++) for (let c = -1; c < 5; c++) { const x = c * 1.5 * s + (row % 2) * 0.75 * s, v = 0.93 + r() * 0.14; g.fillStyle = `rgb(${168 * v | 0},${120 * v | 0},${108 * v | 0})`; g.fillRect(x + 1.5, row * s + 1.5, 1.5 * s - 3, s - 3); }
    g.save(); g.fillStyle = 'rgba(66,40,34,0.62)';
    for (const o of [0, -w, w]) { g.beginPath(); g.moveTo(o, 0); g.lineTo(o + s, 0); g.lineTo(o + w + s, h); g.lineTo(o + w, h); g.closePath(); g.fill(); }
    g.restore();
    g.fillStyle = 'rgba(141,141,141,0.5)'; g.fillRect(0, h * 0.5 - 0.6 * s, w, 1.2 * s);
    speckle(g, w, h, 9352, 160, 0.06);
  }, 'terrace');

  // ------------------------------------------------------------------------------------------ the plaza slab field: grey-pink granite slabs about 1 x 2 m with irregular joints, diagonal bands of dark setts 0.6 m; tile 8 x 8 m
  A.plaza = D(256, 256, (g, w, h) => {
    const r = R(9361), s = w / 8;
    g.fillStyle = '#7d7469'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 8; row++) { let x = -r() * 2 * s; while (x < w) { const sw = (1.2 + r() * 1.2) * s, v = 0.92 + r() * 0.16; g.fillStyle = `rgb(${158 * v | 0},${146 * v | 0},${136 * v | 0})`; g.fillRect(x + 1.2, row * s + 1.2, sw - 2.4, s - 2.4); x += sw; } }
    g.save(); g.fillStyle = '#5c574f';
    for (const o of [0, -w, w]) { g.beginPath(); g.moveTo(o + w * 0.3, 0); g.lineTo(o + w * 0.3 + 0.6 * s, 0); g.lineTo(o + w * 0.3 + w + 0.6 * s, h); g.lineTo(o + w * 0.3 + w, h); g.closePath(); g.fill(); }
    g.restore();
    for (let y = 0; y < h; y += 5) for (let x = (y / 5 % 2) * 4; x < w; x += 8) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, y, 6, 3); }
    speckle(g, w, h, 9362, 200, 0.06);
  }, 'plaza');

  // ------------------------------------------------------------------------------------------ the white roof word ПРИБАЛТИЙСКАЯ (cut-out, 19 m x 2.4 m on 1024 x 128 canvas, plain sans)
  A.letters = D(1024, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); fit(g, 'ПРИБАЛТИЙСКАЯ', 6, h - 16, w - 12, 112, 600, '#f2f0ea', F.sans);
  }, 'letters');
  // the canopy fascia plate (navy, white wordmark in two scripts), 12 m x 0.5 m
  A.plate = D(512, 48, (g, w, h) => {
    g.fillStyle = '#1b2d52'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8d0dc'; g.fillRect(0, 0, w, 2); g.fillRect(0, h - 2, w, 2);
    fit(g, 'PRIBALTIYSKAYA  ПРИБАЛТИЙСКАЯ', 12, h - 12, w - 24, 28, 600, '#f2f4f8', F.sans);
  }, 'plate');
  // the low golden dome: ribbed (one rib per uv unit: a dark seam at the edge)
  A.dome = D(64, 64, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#9c7a3a'); gr.addColorStop(0.5, '#c9a24e'); gr.addColorStop(1, '#8a6a30');
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(50,34,12,0.5)'; g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h);
  }, 'dome');
  // Waterville: blue-green curtain wall in a 3 x 3 m grid; the pink end-block cladding
  A.wvGlass = D(128, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8fb2bb'); gr.addColorStop(1, '#6a95a2');
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,0.14)'; g.beginPath(); g.moveTo(10, h); g.lineTo(60, 0); g.lineTo(80, 0); g.lineTo(30, h); g.closePath(); g.fill();
    g.fillStyle = '#d6dfe2'; g.fillRect(0, 0, w, 4); g.fillRect(0, 0, 4, h);
  }, 'wvGlass');
  A.wvPink = D(128, 128, (g, w, h) => {
    g.fillStyle = '#b39695'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(90,60,60,0.25)'; g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h); g.fillRect(w / 2, 0, 2, h); g.fillRect(0, h / 2, w, 2);
    speckle(g, w, h, 9371, 80, 0.05);
  }, 'wvPink');

  // ------------------------------------------------------------------------------------------ Kirov: the platform grid (tile 7 x 7 m: an L of pale strips 1.4 m wide on the top and left edge, dark setts in the square)
  A.kpave = D(256, 256, (g, w, h) => {
    const r = R(9401), s = w / 7;
    g.fillStyle = C.setts; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '120,114,104' : '40,38,34'},${0.2 + r() * 0.2})`; g.fillRect(r() * w, r() * h, 3 + r() * 5, 2 + r() * 4); }
    g.fillStyle = C.pale; g.fillRect(0, 0, w, 1.4 * s); g.fillRect(0, 0, 1.4 * s, h);
    g.fillStyle = 'rgba(60,54,44,0.3)'; g.fillRect(0, 1.4 * s - 1, w, 2); g.fillRect(1.4 * s - 1, 0, 2, h);
  }, 'kpave');
  // wall plates: pale grey-pink granite 1.2 x 0.65 m plates; tile 2.4 x 1.3 m
  A.kwall = D(128, 70, (g, w, h) => {
    const r = R(9411), cw = w / 2, rh = h / 2;
    g.fillStyle = '#74706e'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 2; row++) for (let c = 0; c < 2; c++) { const v = 0.92 + r() * 0.16; g.fillStyle = `rgb(${179 * v | 0},${172 * v | 0},${169 * v | 0})`; g.fillRect(c * cw + 1, row * rh + 1, cw - 2, rh - 2); }
    speckle(g, w, h, 9412, 60, 0.06);
  }, 'kwall');
  // the college front: ONE bay (6.0 m wide x 20.0 m tall = 120 x 400 px, 20 px/m; canvas y runs down): pilaster strips 1.0 m (0.5 m at each tile edge), granite plinth 0.9 m, the ground storey with small barred windows,
  // four floors of 2.4 x 1.5 m windows at 2.9 m pitch (3.6 .. 15.2), the plain band 15.2 .. 18.3, the attic ribbon 18.3 .. 20.0, cornice
  A.college = D(120, 400, (g, w, h) => {
    const r = R(9421), P = 20, Y = (m) => h - m * P;
    g.fillStyle = C.limestone; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '150,140,110' : '240,232,210'},0.12)`; g.fillRect(r() * w, r() * h, 3 + r() * 8, 2 + r() * 5); }
    g.fillStyle = '#d9cdb0'; g.fillRect(0, 0, 0.5 * P, h); g.fillRect(w - 0.5 * P, 0, 0.5 * P, h);
    g.fillStyle = 'rgba(80,70,50,0.35)'; g.fillRect(0.5 * P - 1, 0, 2, h); g.fillRect(w - 0.5 * P - 1, 0, 2, h);
    g.fillStyle = '#7d7f80'; g.fillRect(0, Y(0.9), w, 0.9 * P);                                   // granite plinth
    for (const x of [1.4, 3.4]) { g.fillStyle = '#2d2a28'; g.fillRect(x * P, Y(3.0), 1.2 * P, 1.0 * P); g.fillStyle = '#5a5550'; for (let b = 0; b < 4; b++) g.fillRect(x * P + b * 0.3 * P + 2, Y(3.0), 1, 1.0 * P); }
    for (let f = 0; f < 4; f++) {
      const y1 = 3.6 + f * 2.9 + 0.7, y0 = y1 + 1.5;                                                 // sill y1, head y0
      g.fillStyle = '#4a4540'; g.fillRect(1.8 * P - 2, Y(y0) - 2, 2.4 * P + 4, 1.5 * P + 3);
      g.fillStyle = '#3a4650'; g.fillRect(1.8 * P, Y(y0), 2.4 * P, 1.5 * P);
      g.fillStyle = 'rgba(180,200,215,0.25)'; g.fillRect(1.8 * P, Y(y0), 2.4 * P * 0.5, 1.5 * P * 0.5);
      g.fillStyle = '#e8e2d2'; for (let p = 1; p < 3; p++) g.fillRect(1.8 * P + p * 0.8 * P - 1, Y(y0), 2, 1.5 * P);
    }
    g.fillStyle = '#c8bc9c'; g.fillRect(0, Y(15.2), w, 2);                                         // course under the inscription band
    g.fillStyle = '#3a4650'; g.fillRect(0.5 * P + 2, Y(19.2), w - 1.0 * P - 4, 0.9 * P);          // the attic ribbon window
    g.fillStyle = '#e8e2d2'; for (let p = 1; p < 4; p++) g.fillRect(0.5 * P + p * (w - P) / 4, Y(19.2), 2, 0.9 * P);
    g.fillStyle = '#a89c7c'; g.fillRect(0, Y(20.0), w, 3);
  }, 'college');
  A.collegeSide = D(120, 116, (g, w, h) => {
    g.fillStyle = '#d2c7aa'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a4650'; g.fillRect(24, 20, 72, 44); g.fillStyle = '#e8e2d2'; g.fillRect(58, 20, 3, 44); g.fillRect(0, h - 3, w, 3);
  }, 'collegeSide');
  // the frieze: three justified lines of black capitals, cut-out, 38 m x 3.1 m on 1024 x 160 (capital height about 0.55 m)
  A.frieze = D(1024, 160, (g, w, h) => {
    g.clearRect(0, 0, w, h); const ink = '#1d1b19', ph = h / 3.1;
    fit(g, 'ПОДВИГУ МОРЯКОВ КРАСНОЗНАМЁННОГО БАЛТИЙСКОГО ФЛОТА', 4, 0.85 * ph, w - 8, 36, 500, ink, F.sans);
    fit(g, 'В ВЕЛИКОЙ ОТЕЧЕСТВЕННОЙ ВОЙНЕ 1941 - 1945 г.г.', 4, 1.85 * ph, w - 8, 36, 500, ink, F.sans);
    fit(g, '★ ГЕРОИЧЕСКОМУ ЭКИПАЖУ КРЕЙСЕРА „КИРОВ“ ★', 4, 2.85 * ph, w - 8, 36, 500, ink, F.sans);
  }, 'frieze');
  // the bronze plaque 0.7 x 0.95 m (256 x 348): four centred paragraphs of blocky capitals, a 0.05 m raised border and the star
  A.plaque = D(256, 348, (g, w, h) => {
    g.fillStyle = '#4f4330'; g.fillRect(0, 0, w, h); g.fillStyle = '#8a7650'; g.fillRect(0, 0, w, 7); g.fillRect(0, h - 7, w, 7); g.fillRect(0, 0, 7, h); g.fillRect(w - 7, 0, 7, h);
    g.fillStyle = '#6b5a3a'; g.fillRect(9, 9, w - 18, h - 18);
    const P = [['КРЕЙСЕР „КИРОВ“', 'НАХОДИЛСЯ В СТРОЮ', 'С 1938 ПО 1974 ГОД'], ['ИМЕЛ МОЩНОЕ ВООРУЖЕНИЕ:', 'ДЕВЯТЬ—180 мм ОРУДИЙ', 'ВОСЕМЬ—100 мм ОРУДИЙ', 'ПЯТНАДЦАТЬ—37 мм ОРУДИЙ', 'ШЕСТЬ ПУЛЕМЁТОВ'],
      ['ЗА ГОДЫ', 'ВЕЛИКОЙ ОТЕЧЕСТВЕННОЙ', 'ВОЙНЫ', 'ПРОВЁЛ СВЫШЕ 200', 'БОЕВЫХ СТРЕЛЬБ', 'НАНЕСШИХ ПРОТИВНИКУ', 'ТЯЖЁЛЫЕ ПОТЕРИ'], ['УЧАСТВОВАЛ В ОТРАЖЕНИИ', 'БОЛЕЕ 40', 'МАССИРОВАННЫХ НАЛЁТОВ', 'ВРАЖЕСКОЙ АВИАЦИИ', 'НА ЛЕНИНГРАД']];
    const n = P.reduce((s, p) => s + p.length, 0) + 3 + 1, lh = (h - 40) / n; let y = 22 + lh * 0.7;
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    for (const para of P) { for (const line of para) { g.font = `700 ${Math.floor(lh * 0.74)}px ${F.sans}`; const m = g.measureText(line).width || 1, sc = Math.min(1, (w - 30) / m); g.save(); g.translate(w / 2, y); g.scale(sc, 1); g.fillStyle = '#12100c'; g.fillText(line, 1, 1); g.fillStyle = '#c8b27a'; g.fillText(line, 0, 0); g.restore(); y += lh; } y += lh * 0.75; }
    g.fillStyle = '#c8b27a'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 5 : 11; g.lineTo(w / 2 + Math.cos(a) * rr, y - 4 + Math.sin(a) * rr); } g.closePath(); g.fill();
  }, 'plaque');

  // ------------------------------------------------------------------------------------------ Peter I's decree scroll 0.9 x 1.5 m (192 x 320 px): ten lines of raised capitals on dark bronze
  A.scroll = D(192, 320, (g, w, h) => {
    g.fillStyle = '#2f2a24'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${i % 2 ? '120,100,70' : '10,8,6'},0.12)`; g.fillRect((i * 37) % w, (i * 53) % h, 4 + i % 7, 3); }
    g.fillStyle = '#6b5a44'; g.fillRect(0, 0, w, 5); g.fillRect(0, h - 5, w, 5); g.fillRect(0, 0, 5, h); g.fillRect(w - 5, 0, 5, h);
    const T = ['ОТ ВОПЛОЩЕНИЯ', 'ИИСУСА ХРИСТА', '1703 ГОДА, МАЯ 16.', 'ОСНОВАН', 'ЦАРСТВУЮЩИЙ ГРАД', 'САНКТ-ПЕТЕРБУРГ', 'ВЕЛИКИМ ГОСУДАРЕМ', 'ЦАРЕМ И ВЕЛИКИМ', 'КНЯЗЕМ ПЕТРОМ', 'АЛЕКСЕЕВИЧЕМ'], lh = (h - 40) / T.length;
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    T.forEach((s, i) => { g.font = `600 ${Math.floor(lh * 0.62)}px ${F.sans}`; const m = g.measureText(s).width || 1, sc = Math.min(1, (w - 24) / m); g.save(); g.translate(w / 2, 26 + lh * (i + 0.78)); g.scale(sc, 1); g.fillStyle = '#0c0a08'; g.fillText(s, 1, 1); g.fillStyle = '#a48c64'; g.fillText(s, 0, 0); g.restore(); });
  }, 'scroll');

  // ------------------------------------------------------------------------------------------ Nakhimov: the gilt inscription АДМИРАЛ / НАХИМОВ. (cut-out, 1.1 x 0.55 m on 256 x 128)
  A.nakh = D(256, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    for (const [s, y] of [['АДМИРАЛ', 52], ['НАХИМОВ.', 112]]) { g.font = `600 52px ${F.serif}`; const m = g.measureText(s).width || 1; g.save(); g.translate(w / 2, y); g.scale(Math.min(1, (w - 16) / m), 1); g.fillStyle = '#d9b24a'; g.fillText(s, 0, 0); g.restore(); }
  }, 'nakh');
  // the round glass building of the Nakhimov park: three storeys of dark blue-green glass bands separated by white spandrels, tile 4 x 4.3 m
  A.cylGlass = D(128, 136, (g, w, h) => {
    g.fillStyle = '#e8ecee'; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, 0, h * 0.7); gr.addColorStop(0, '#5f8c96'); gr.addColorStop(1, '#3f6a78');
    g.fillStyle = gr; g.fillRect(0, h * 0.28, w, h * 0.7); g.fillStyle = '#dfe6e8'; for (let x = 0; x < w; x += 32) g.fillRect(x, h * 0.28, 2, h * 0.7);
    g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(8, h * 0.3, 18, h * 0.66);
  }, 'cylGlass');
  return A;
}
