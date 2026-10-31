// landmarksVladimir/art.js - canvas paintings of the west Petrograd side sights (docs/research/vladimir.md; photos refs/vladimir): muntined window panes, the oak west door, the clock dial,
// white balusters and the iron fence of the cathedral (alpha cut-outs), the gilded angels of the Order of St Vladimir, standing-seam sheet roofs; the bay tiles of Tuchkov Buyan (ochre wall
// with four rows of windows), of the judicial quarter (cream stone with punched windows, rusticated base, the court's dark window strips, raw insulation of the housing, scaffold skin, blue
// corrugated fence, site cabins, crane lattice, gravel), of Yubileyny (dark glazing, entrance band, annex panels) and of the Petrovsky stadium (yellow gallery wall, blue seat rows, pitch,
// track, mast lattice, lamp banks).  Every tile repeats (RepeatWrapping) and is cached by key.
const TAU = Math.PI * 2;
export function makeArt(ctx) {
  const tex = ctx.tex, A = {};
  const D = (w, h, fn, key, o = {}) => tex.draw(w, h, fn, { key: 'lmV-' + key, repeat: [1, 1], ...o });
  const speck = (g, w, h, seed, n, cols, s = 2) => { const r = ctx.rng(seed); for (let i = 0; i < n; i++) { g.fillStyle = cols[(r() * cols.length) | 0]; g.fillRect(r() * w, r() * h, 1 + r() * s, 1 + r() * s); } };
  const glass = (g, x, y, w, h, base = '#2b3745') => {
    g.fillStyle = base; g.fillRect(x, y, w, h);
    const gr = g.createLinearGradient(x, y, x + w, y + h * 0.8); gr.addColorStop(0, 'rgba(150,185,215,0.42)'); gr.addColorStop(0.55, 'rgba(60,90,125,0.05)'); gr.addColorStop(1, 'rgba(18,24,34,0.25)');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
  };

  // ---------------------------------------------------------------------------------------------- the cathedral
  /** window pane: dark glass, white muntin grid cols x rows; `head` = fraction of the height taken by the fan / segment head */
  const pane = (key, cols, rows, head = 0, pw = 96, phh = 224) => D(pw, phh, (g, w, h) => {
    glass(g, 0, 0, w, h);
    const wr = g.createLinearGradient(0, h * 0.6, 0, h); wr.addColorStop(0, 'rgba(255,220,150,0)'); wr.addColorStop(1, 'rgba(255,214,140,0.16)'); g.fillStyle = wr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f1efe7'; const b = 4;
    g.fillRect(0, 0, b, h); g.fillRect(w - b, 0, b, h); g.fillRect(0, h - b, w, b); g.fillRect(0, 0, w, b);
    for (let c = 1; c < cols; c++) g.fillRect(w * c / cols - 1.5, 0, 3, h);
    const y0 = head ? h * head : 0;
    for (let r = 1; r < rows; r++) g.fillRect(0, y0 + (h - y0) * r / rows - 1.5, w, 3);
    if (head) g.fillRect(0, y0 - 2, w, 4);
  }, key);
  A.winTall = pane('winTall', 3, 6, 0.16); A.winSq = pane('winSq', 3, 3, 0, 96, 128); A.winArch = pane('winArch', 2, 4, 0.26, 64, 160); A.winOval = pane('winOval', 4, 3, 0, 128, 96);
  A.dark = D(64, 64, (g, w, h) => { g.fillStyle = '#15181d'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(70,58,44,0.55)'; g.fillRect(0, h * 0.3, w, 4); g.fillRect(0, h * 0.72, w, 3); }, 'dark');
  /** oak double door under a glazed fan light with radial bars (uv spans an arched opening) */
  A.door = D(128, 256, (g, w, h) => {
    g.fillStyle = '#8a6238'; g.fillRect(0, 0, w, h);
    const fan = h * 0.3; glass(g, 0, 0, w, fan, '#232c36');
    g.strokeStyle = '#1b1d20'; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8; g.beginPath(); g.moveTo(w / 2, fan); g.lineTo(w / 2 - Math.cos(a) * w * 0.7, fan - Math.sin(a) * fan * 1.2); g.stroke(); }
    for (const rr of [0.35, 0.7]) { g.beginPath(); g.ellipse(w / 2, fan, w * 0.5 * rr, fan * rr, 0, Math.PI, TAU); g.stroke(); }
    g.fillStyle = '#6d4a28'; g.fillRect(0, fan - 3, w, 8); g.fillRect(w / 2 - 2, fan, 4, h - fan);
    for (const x0 of [8, w / 2 + 6]) for (const [y0, hh] of [[fan + 14, 60], [fan + 84, 60], [fan + 154, h - fan - 166]]) { g.fillStyle = '#75512e'; g.fillRect(x0, y0, w / 2 - 14, hh); g.strokeStyle = '#a57a48'; g.lineWidth = 2; g.strokeRect(x0 + 4, y0 + 4, w / 2 - 22, hh - 8); }
    g.fillStyle = '#d6b055'; g.fillRect(w / 2 - 9, fan + 96, 4, 22); g.fillRect(w / 2 + 5, fan + 96, 4, 22);
  }, 'door');
  A.doorSide = D(96, 192, (g, w, h) => {
    g.fillStyle = '#7f8c98'; g.fillRect(0, 0, w, h); g.fillStyle = '#6c7884'; g.fillRect(w / 2 - 2, 0, 4, h);
    g.strokeStyle = '#98a4ae'; g.lineWidth = 2; for (const x0 of [6, w / 2 + 4]) for (const y0 of [8, h * 0.36, h * 0.68]) g.strokeRect(x0, y0, w / 2 - 12, h * 0.26);
  }, 'doorSide');
  /** tower clock: white dial, black roman ticks, hands at ten past ten */
  A.clock = D(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#f4f2ea'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 2, 0, TAU); g.fill();
    g.strokeStyle = '#22252a'; g.lineWidth = 4; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 5, 0, TAU); g.stroke();
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.lineWidth = i % 3 ? 3 : 6; g.beginPath(); g.moveTo(w / 2 + Math.sin(a) * 44, h / 2 - Math.cos(a) * 44); g.lineTo(w / 2 + Math.sin(a) * 54, h / 2 - Math.cos(a) * 54); g.stroke(); }
    g.lineWidth = 5; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 - 22, h / 2 - 22); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + 30, h / 2 - 30); g.stroke();
  }, 'clock', { repeat: null });
  /** white stone balustrade (alpha): bulbous balusters between a base and a rail, tile 1 m x 1 m */
  A.balus = D(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#f1efe7'; g.fillRect(0, 0, w, 16); g.fillRect(0, h - 18, w, 18);
    for (let i = 0; i < 4; i++) { const cx = (i + 0.5) * w / 4; g.beginPath(); g.moveTo(cx - 4, 16); g.bezierCurveTo(cx - 4, 40, cx - 13, 70, cx - 9, 92); g.lineTo(cx - 5, h - 18); g.lineTo(cx + 5, h - 18); g.lineTo(cx + 9, 92); g.bezierCurveTo(cx + 13, 70, cx + 4, 40, cx + 4, 16); g.closePath(); g.fill(); }
    g.fillStyle = '#cfcdc4'; g.fillRect(0, 13, w, 3); g.fillRect(0, h - 18, w, 3);
  }, 'balus');
  /** the iron fence of the enclosure (alpha), tile 2.6 m x 1.9 m: spear pickets, a band of rings at mid height, a diamond lattice below, an X-braced post with a small cross at u = 0 */
  A.fence = D(256, 192, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#23262a'; g.fillStyle = '#23262a';
    const top = 26, mid = h * 0.50, low = h * 0.62;
    g.lineWidth = 5; for (const y of [top + 22, mid - 12, low, h - 5]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.lineWidth = 3; for (let i = 1; i < 12; i++) { const x = i * w / 12; g.beginPath(); g.moveTo(x, i % 2 ? top : top + 12); g.lineTo(x, low); g.stroke(); g.beginPath(); g.moveTo(x - 5, (i % 2 ? top : top + 12) + 9); g.lineTo(x, (i % 2 ? top : top + 12) - 8); g.lineTo(x + 5, (i % 2 ? top : top + 12) + 9); g.closePath(); g.fill(); }
    g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc((i + 0.5) * w / 6, (mid - 12 + low) / 2, 9, 0, TAU); g.stroke(); }
    g.lineWidth = 2; for (let i = -8; i < 24; i++) { g.beginPath(); g.moveTo(i * 16, low); g.lineTo(i * 16 + (h - low), h - 5); g.stroke(); g.beginPath(); g.moveTo(i * 16, h - 5); g.lineTo(i * 16 + (h - low), low); g.stroke(); }
    g.lineWidth = 6; g.beginPath(); g.moveTo(4, 14); g.lineTo(4, h); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(4, 2); g.lineTo(4, 16); g.moveTo(0, 7); g.lineTo(9, 7); g.stroke();
  }, 'fence');
  /** gilded relief over the west door: two kneeling angels with raised wings either side of the star of the Order of St Vladimir (decal, alpha) */
  A.angels = D(384, 168, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const gold = '#e6b63e', lite = '#f6d878', dk = '#8a6414', cx = w / 2, cy = h * 0.52;
    g.lineJoin = 'round'; g.lineWidth = 2.5; g.strokeStyle = dk;
    for (const s of [-1, 1]) {
      g.save(); g.translate(cx + s * 38, 0); g.scale(s, 1);
      // raised wing with three rows of feathers
      g.fillStyle = gold; g.beginPath(); g.moveTo(36, 66); g.bezierCurveTo(60, 20, 104, 4, 138, 12); g.bezierCurveTo(128, 30, 124, 40, 108, 50); g.bezierCurveTo(118, 54, 112, 66, 96, 70); g.bezierCurveTo(84, 82, 60, 84, 40, 78); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = dk; g.lineWidth = 1.6; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(46 + i * 4, 70 - i * 2); g.quadraticCurveTo(74 + i * 6, 44 - i * 5, 110 + i * 4, 26 - i * 2.2); g.stroke(); }
      g.lineWidth = 2.5;
      // robe, kneeling toward the star
      g.fillStyle = gold; g.beginPath(); g.moveTo(22, 62); g.bezierCurveTo(40, 58, 52, 74, 56, 96); g.bezierCurveTo(70, 112, 92, 126, 104, 150); g.bezierCurveTo(74, 156, 44, 150, 22, 136); g.bezierCurveTo(10, 112, 10, 84, 22, 62); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = dk; g.lineWidth = 1.6; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(28 + i * 6, 76 + i * 4); g.quadraticCurveTo(40 + i * 10, 112 + i * 4, 52 + i * 12, 146); g.stroke(); }
      g.lineWidth = 2.5;
      // arm to the star, head with hair
      g.fillStyle = lite; g.beginPath(); g.moveTo(26, 66); g.lineTo(-2, 78); g.lineTo(0, 90); g.lineTo(30, 80); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.arc(24, 46, 13, 0, TAU); g.fill(); g.stroke(); g.fillStyle = gold; g.beginPath(); g.arc(28, 42, 13, -2.2, 0.9); g.fill();
      g.restore();
    }
    // the star of the order in a round frame under a crown
    g.fillStyle = gold; g.beginPath(); g.arc(cx, cy, 40, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#2f2640'; g.beginPath(); g.arc(cx, cy, 30, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = lite; for (let i = 0; i < 8; i++) { const a = i * TAU / 8, r = i % 2 ? 19 : 27; g.beginPath(); g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.lineTo(cx + Math.cos(a + 0.42) * 8, cy + Math.sin(a + 0.42) * 8); g.lineTo(cx + Math.cos(a - 0.42) * 8, cy + Math.sin(a - 0.42) * 8); g.closePath(); g.fill(); }
    g.fillStyle = '#a8262e'; g.beginPath(); g.arc(cx, cy, 7, 0, TAU); g.fill();
    g.fillStyle = gold; g.beginPath(); g.moveTo(cx - 15, cy - 40); g.lineTo(cx - 18, cy - 60); g.lineTo(cx - 8, cy - 50); g.lineTo(cx, cy - 64); g.lineTo(cx + 8, cy - 50); g.lineTo(cx + 18, cy - 60); g.lineTo(cx + 15, cy - 40); g.closePath(); g.fill(); g.stroke();
    g.fillRect(cx - 2, cy - 76, 4, 14); g.fillRect(cx - 7, cy - 72, 14, 4);
  }, 'angels', { repeat: null });
  /** standing-seam sheet roof, tile 2.4 m x 2.4 m */
  A.seams = D(128, 128, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); speck(g, w, h, 5201, 260, ['rgba(120,130,140,0.10)', 'rgba(255,255,255,0.22)'], 6);
    g.fillStyle = 'rgba(60,70,80,0.42)'; for (let i = 0; i < 4; i++) g.fillRect(i * w / 4, 0, 2, h); g.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 4; i++) g.fillRect(i * w / 4 + 2, 0, 2, h);
    g.fillStyle = 'rgba(60,70,80,0.2)'; g.fillRect(0, h * 0.5, w, 1);
  }, 'seams');

  // ---------------------------------------------------------------------------------------------- Tuchkov Buyan
  /** one bay of a warehouse block, 4.7 m x 14.2 m (plinth top to cornice): banded ochre wall, four small windows in flat off-white frames, a string course between the two original storeys */
  A.buyanBay = D(128, 384, (g, w, h) => {
    g.fillStyle = '#d9b25e'; g.fillRect(0, 0, w, h);
    speck(g, w, h, 5301, 900, ['rgba(180,140,70,0.28)', 'rgba(238,214,150,0.25)', 'rgba(150,120,80,0.16)', 'rgba(230,222,200,0.20)'], 7);
    g.fillStyle = 'rgba(120,90,40,0.30)'; for (let y = 0; y < h; y += h / 30) g.fillRect(0, y, w, 1.5);
    g.fillStyle = '#e6dfcd'; g.fillRect(0, h * 0.492, w, h * 0.022); g.fillStyle = 'rgba(90,70,40,0.35)'; g.fillRect(0, h * 0.514, w, 2);
    const ww = w * 0.25, wh = h * 0.105;
    for (const fy of [0.115, 0.335, 0.63, 0.85]) {
      const x = w / 2 - ww / 2, y = h * (1 - fy) - wh;
      g.fillStyle = '#e6dfcd'; g.fillRect(x - 6, y - 7, ww + 12, wh + 14); g.fillStyle = '#e6dfcd'; g.fillRect(x - 9, y + wh + 5, ww + 18, 5);
      glass(g, x, y, ww, wh, '#27303a'); g.fillStyle = '#d8d4c6'; g.fillRect(x + ww / 2 - 1, y, 2, wh); g.fillRect(x, y + wh * 0.4, ww, 2);
      g.fillStyle = 'rgba(110,84,44,0.4)'; g.fillRect(x - 2, y + wh + 10, 3, 16); g.fillRect(x + ww, y + wh + 10, 3, 22);                                                              // rain streaks
    }
  }, 'buyanBay');
  A.buyanPlain = D(128, 128, (g, w, h) => { g.fillStyle = '#d9b25e'; g.fillRect(0, 0, w, h); speck(g, w, h, 5302, 420, ['rgba(180,140,70,0.28)', 'rgba(238,214,150,0.25)', 'rgba(150,120,80,0.16)'], 7); g.fillStyle = 'rgba(120,90,40,0.28)'; for (let y = 0; y < h; y += h / 5) g.fillRect(0, y, w, 1.5); }, 'buyanPlain');

  // ---------------------------------------------------------------------------------------------- the judicial quarter
  const stone = (g, w, h, seed, base = '#e6dcc6') => { g.fillStyle = base; g.fillRect(0, 0, w, h); speck(g, w, h, seed, 380, ['rgba(255,250,235,0.25)', 'rgba(170,155,125,0.14)'], 9); };
  /** cream stone bay 3.6 m x 4.0 m with one punched window (dark frame, keystone, sill) */
  A.jqStone = D(128, 144, (g, w, h) => {
    stone(g, w, h, 5401); g.fillStyle = 'rgba(150,135,105,0.35)'; g.fillRect(0, h - 2, w, 2); g.fillRect(0, 0, 1.5, h);
    const x = w * 0.3, ww = w * 0.4, y = h * 0.2, wh = h * 0.58;
    g.fillStyle = '#d4c9b0'; g.fillRect(x - 5, y - 5, ww + 10, wh + 10); glass(g, x, y, ww, wh, '#242a31'); g.fillStyle = '#16191d'; g.fillRect(x + ww / 2 - 1.5, y, 3, wh); g.fillRect(x, y + wh * 0.3, ww, 3);
    g.fillStyle = '#efe7d4'; g.beginPath(); g.moveTo(w / 2 - 7, y - 5); g.lineTo(w / 2 + 7, y - 5); g.lineTo(w / 2 + 5, y - 17); g.lineTo(w / 2 - 5, y - 17); g.closePath(); g.fill(); g.fillRect(x - 8, y + wh + 5, ww + 16, 4);
  }, 'jqStone');
  /** rusticated ground floor 3.6 m x 5.0 m with a round-arched window */
  A.jqRust = D(128, 176, (g, w, h) => {
    stone(g, w, h, 5402, '#dcd2bb'); g.fillStyle = 'rgba(120,108,84,0.45)'; for (let y = 0; y < h; y += h / 9) g.fillRect(0, y, w, 2.5);
    const ww = w * 0.42, x = w / 2 - ww / 2, y1 = h * 0.86, y0 = h * 0.34;
    g.fillStyle = '#242a31'; g.beginPath(); g.moveTo(x, y1); g.lineTo(x, y0); g.arc(w / 2, y0, ww / 2, Math.PI, 0); g.lineTo(x + ww, y1); g.closePath(); g.fill();
    g.strokeStyle = '#efe7d4'; g.lineWidth = 5; g.beginPath(); g.moveTo(x, y1); g.lineTo(x, y0); g.arc(w / 2, y0, ww / 2, Math.PI, 0); g.lineTo(x + ww, y1); g.stroke();
    g.fillStyle = '#16191d'; g.fillRect(w / 2 - 1.5, y0 - ww / 2, 3, y1 - y0 + ww / 2); g.fillRect(x, y0, ww, 3);
  }, 'jqRust');
  /** the court: bay 3.3 m x 4.2 m, a tall dark window strip with a bronze spandrel panel between stone pilaster strips */
  A.jqStrip = D(112, 144, (g, w, h) => {
    stone(g, w, h, 5403); const x = w * 0.27, ww = w * 0.46;
    g.fillStyle = '#1f242a'; g.fillRect(x, 0, ww, h); glass(g, x + 3, h * 0.30, ww - 6, h * 0.66, '#252c34'); g.fillStyle = '#5a4a36'; g.fillRect(x + 3, h * 0.04, ww - 6, h * 0.24);
    g.strokeStyle = '#8a7350'; g.lineWidth = 2; g.strokeRect(x + 8, h * 0.07, ww - 16, h * 0.18); g.beginPath(); g.arc(w / 2, h * 0.16, 7, 0, TAU); g.stroke();
    g.fillStyle = '#14171a'; g.fillRect(w / 2 - 1.5, h * 0.30, 3, h * 0.7);
    g.fillStyle = 'rgba(150,135,105,0.4)'; g.fillRect(x - 6, 0, 2, h); g.fillRect(x + ww + 4, 0, 2, h);
  }, 'jqStrip');
  /** raw facade of the housing: mineral-wool boards with dowels, window holes with blue film, 3.4 m x 3.1 m */
  A.jqIns = D(128, 116, (g, w, h) => {
    g.fillStyle = '#b9a37c'; g.fillRect(0, 0, w, h); speck(g, w, h, 5404, 300, ['rgba(140,120,84,0.3)', 'rgba(215,200,165,0.3)'], 8);
    g.fillStyle = 'rgba(90,76,50,0.35)'; for (let y = 0; y < h; y += h / 5) g.fillRect(0, y, w, 1.5); for (let x = 0; x < w; x += w / 4) g.fillRect(x, 0, 1.5, h);
    g.fillStyle = '#e8e6de'; for (let y = 8; y < h; y += h / 5) for (let x = 10; x < w; x += w / 4) g.fillRect(x, y, 3, 3);
    g.fillStyle = '#8f8f8a'; g.fillRect(0, h - 6, w, 6);
    g.fillStyle = '#2a323c'; g.fillRect(w * 0.32, h * 0.2, w * 0.36, h * 0.52); g.fillStyle = 'rgba(70,120,200,0.35)'; g.fillRect(w * 0.32, h * 0.2, w * 0.36, h * 0.52); g.fillStyle = '#d9d9d2'; g.fillRect(w * 0.5 - 1.5, h * 0.2, 3, h * 0.52);
  }, 'jqIns');
  /** scaffold skin (alpha), tile 3.0 m x 2.0 m: standards, ledgers, a plank deck, a diagonal brace, a toe board */
  A.scaffold = D(192, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#7a858c'; g.lineWidth = 4;
    for (const x of [3, w / 2, w - 3]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.lineWidth = 3; for (const y of [h * 0.45, h * 0.72]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.lineWidth = 2.5; g.beginPath(); g.moveTo(3, h); g.lineTo(w / 2, 14); g.stroke();
    g.fillStyle = '#b08d57'; g.fillRect(0, h - 12, w, 9); g.fillStyle = '#8f6f40'; g.fillRect(0, h - 3, w, 3); g.fillStyle = '#c9a25e'; g.fillRect(0, h - 24, w, 5);
  }, 'scaffold');
  /** green debris net over a scaffold (alpha speckle), tile 3 m x 2 m */
  A.net = D(96, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(64,128,92,0.82)'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(40,96,66,0.9)'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1); for (let x = 0; x < w; x += 4) g.fillRect(x, 0, 1, h); g.clearRect(0, 0, w, 2); }, 'net');
  /** the blue site fence, tile 2.0 m x 6.4 m: an embossed panel base 2.4 m, corrugated sheet above */
  A.fenceBlue = D(64, 256, (g, w, h) => {
    g.fillStyle = '#2a4fa6'; g.fillRect(0, 0, w, h);
    const yb = h * (1 - 2.4 / 6.4);
    for (let x = 0; x < w; x += 8) { g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x, 0, 3, yb); g.fillStyle = 'rgba(0,0,30,0.22)'; g.fillRect(x + 5, 0, 3, yb); }
    g.fillStyle = '#3058b2'; g.fillRect(0, yb, w, h - yb); g.fillStyle = '#1f3c86'; g.fillRect(0, yb, w, 4); g.fillRect(0, h - 6, w, 6); g.fillRect(0, yb, 3, h - yb); g.fillRect(w - 3, yb, 3, h - yb);
    g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 2; for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) { const cx = (i + 0.5) * w / 2, cy = yb + (j + 0.5) * (h - yb - 8) / 3 + 4; g.beginPath(); g.moveTo(cx, cy - 12); g.lineTo(cx + 12, cy); g.lineTo(cx, cy + 12); g.lineTo(cx - 12, cy); g.closePath(); g.stroke(); }
    g.fillStyle = 'rgba(0,0,30,0.18)'; g.fillRect(0, h * 0.3, w, 2);
  }, 'fenceBlue');
  A.fenceGrey = D(64, 96, (g, w, h) => { g.fillStyle = '#d9dad6'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(90,96,100,0.3)'; for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 2, h); g.fillStyle = '#8c9296'; g.fillRect(0, h * 0.3, w, 3); g.fillRect(0, h * 0.7, w, 3); g.fillRect(0, 0, 3, h); }, 'fenceGrey');
  /** site cabin wall, 6 m x 2.6 m: white ribbed sheet, a window and a door */
  A.cabin = D(192, 84, (g, w, h) => {
    g.fillStyle = '#e6e7e4'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(120,126,130,0.22)'; for (let x = 0; x < w; x += 6) g.fillRect(x, 0, 1.5, h);
    g.fillStyle = '#9aa0a4'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4); g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h);
    glass(g, 30, 18, 46, 30, '#2e3a46'); g.fillStyle = '#f4f4f0'; g.fillRect(52, 18, 2, 30); glass(g, 108, 18, 30, 30, '#2e3a46'); g.fillStyle = '#c9ccc8'; g.fillRect(150, 12, 28, h - 16); g.fillStyle = '#7d8388'; g.fillRect(172, h / 2, 3, 6);
  }, 'cabin');
  A.cabinBlue = D(192, 84, (g, w, h) => {
    g.fillStyle = '#2d4f9a'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(10,20,60,0.25)'; for (let x = 0; x < w; x += 6) g.fillRect(x, 0, 1.5, h);
    g.fillStyle = '#e8e8e4'; g.fillRect(0, 0, w, 5); g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h); glass(g, 40, 18, 44, 30, '#2e3a46'); g.fillStyle = '#e8e8e4'; g.fillRect(120, 12, 28, h - 16);
  }, 'cabinBlue');
  /** crane / mast lattice (alpha), tile 2 m x 2 m: two chords, a horizontal and an X */
  const lattice = (key, col) => D(64, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = col; g.lineWidth = 7; g.beginPath(); g.moveTo(4, 0); g.lineTo(4, h); g.moveTo(w - 4, 0); g.lineTo(w - 4, h); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(0, 2); g.lineTo(w, 2); g.moveTo(4, 2); g.lineTo(w - 4, h); g.moveTo(w - 4, 2); g.lineTo(4, h); g.stroke();
  }, key);
  A.lattice = lattice('lattice', '#e9ebe8'); A.latticeRed = lattice('latticeRed', '#c8402e');
  A.gravel = D(128, 128, (g, w, h) => { g.fillStyle = '#8d8478'; g.fillRect(0, 0, w, h); speck(g, w, h, 5405, 1500, ['#7a7166', '#9c9488', '#a8a195', '#6f675d', '#8a7f70'], 3); }, 'gravel');
  A.pallets = D(128, 64, (g, w, h) => {                                    // stacked stone slabs wrapped in film, side view 2.4 m x 1.2 m
    g.fillStyle = '#e9e6dc'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(150,146,132,0.5)'; for (let y = 6; y < h - 10; y += 7) g.fillRect(2, y, w - 4, 1.5); for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 2, h - 10);
    g.fillStyle = '#b58a50'; g.fillRect(0, h - 10, w, 10); g.fillStyle = '#7d5c32'; for (let x = 6; x < w; x += 30) g.fillRect(x, h - 7, 18, 7);
  }, 'pallets');

  // ---------------------------------------------------------------------------------------------- Yubileyny
  /** glazing between two fins, 4.0 m x 16 m: dark bronze glass, slim mullions, floor bands */
  A.yubGlass = D(64, 256, (g, w, h) => {
    glass(g, 0, 0, w, h, '#2a3036'); g.fillStyle = '#1a1d21'; for (const fx of [0.33, 0.66]) g.fillRect(w * fx - 1.5, 0, 3, h);
    for (let i = 0; i <= 4; i++) { g.fillStyle = '#3b4148'; g.fillRect(0, h * i / 4 - 5, w, 10); g.fillStyle = '#16181b'; g.fillRect(0, h * i / 4 + 5, w, 2); }
  }, 'yubGlass');
  /** ground floor between fins, 4.0 m x 4.5 m: glass doors with steel frames */
  A.yubDoors = D(128, 144, (g, w, h) => {
    glass(g, 0, 0, w, h, '#2f363d'); g.fillStyle = '#c9ccce'; g.fillRect(0, 0, w, 10); g.fillRect(0, h * 0.28, w, 5); for (let i = 0; i <= 4; i++) g.fillRect(w * i / 4 - 2, 0, 4, h);
    g.fillStyle = '#8d9296'; for (let i = 0; i < 4; i++) g.fillRect(w * (i + 0.5) / 4 - 9, h * 0.62, 4, 16); g.fillStyle = '#6b6f73'; g.fillRect(0, h - 5, w, 5);
  }, 'yubDoors');
  /** annex wall, 6 m x 4.5 m: pale panels with a dark strip window */
  A.annex = D(128, 96, (g, w, h) => {
    g.fillStyle = '#d8d9d6'; g.fillRect(0, 0, w, h); speck(g, w, h, 5501, 160, ['rgba(255,255,255,0.3)', 'rgba(120,124,126,0.14)'], 8);
    g.fillStyle = 'rgba(100,106,110,0.4)'; g.fillRect(0, 0, 1.5, h); g.fillRect(w / 2, 0, 1.5, h); g.fillRect(0, h - 2, w, 2);
    glass(g, 0, h * 0.28, w, h * 0.34, '#2a3138'); g.fillStyle = '#b8bcbe'; for (let i = 0; i < 4; i++) g.fillRect(w * i / 4, h * 0.28, 2, h * 0.34);
  }, 'annex');
  /** the plain name of the hall (it is the building's name, not a trademark) */
  A.yubName = D(512, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#343a41'; g.font = `bold 46px ${tex.FONTS ? tex.FONTS.sans : 'sans-serif'}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ЮБИЛЕЙНЫЙ', w / 2, h / 2 + 2); }, 'yubName', { repeat: null });

  // ---------------------------------------------------------------------------------------------- Petrovsky stadium
  /** back wall of the outer gallery, one bay 6.2 m x 12 m: yellow wall, a door below, a window above, the gallery floor line */
  A.stadWall = D(128, 256, (g, w, h) => {
    g.fillStyle = '#e6c27a'; g.fillRect(0, 0, w, h); speck(g, w, h, 5601, 420, ['rgba(255,240,200,0.25)', 'rgba(170,130,70,0.16)'], 8);
    g.fillStyle = '#efe6cf'; g.fillRect(0, h * 0.47, w, 12); g.fillStyle = 'rgba(100,80,40,0.4)'; g.fillRect(0, h * 0.47 + 12, w, 2);
    g.fillStyle = '#3d5f8c'; g.fillRect(w * 0.34, h * 0.70, w * 0.32, h * 0.30); g.fillStyle = '#2b4466'; g.fillRect(w * 0.5 - 1, h * 0.70, 2, h * 0.30);
    glass(g, w * 0.28, h * 0.14, w * 0.44, h * 0.2, '#2c3540'); g.fillStyle = '#efe6cf'; g.fillRect(w * 0.5 - 1.5, h * 0.14, 3, h * 0.2); g.fillRect(w * 0.28, h * 0.24, w * 0.44, 3);
  }, 'stadWall');
  /** seat rows seen from above, tile 3 m (along the row) x 0.8 m (one row) */
  A.seats = D(96, 32, (g, w, h) => { g.fillStyle = '#9fa3a6'; g.fillRect(0, 0, w, h); g.fillStyle = '#2f6fc0'; for (let i = 0; i < 6; i++) g.fillRect(i * 16 + 2, 4, 12, 16); g.fillStyle = '#255aa0'; for (let i = 0; i < 6; i++) g.fillRect(i * 16 + 2, 4, 12, 4); g.fillStyle = '#74787b'; g.fillRect(0, h - 5, w, 5); }, 'seats');
  A.pitch = D(64, 64, (g, w, h) => { g.fillStyle = '#4f9a3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#5aa844'; g.fillRect(0, 0, w / 2, h); speck(g, w, h, 5602, 200, ['rgba(40,90,30,0.25)', 'rgba(120,190,90,0.22)'], 2); }, 'pitch');
  A.track = D(64, 64, (g, w, h) => { g.fillStyle = '#b5503f'; g.fillRect(0, 0, w, h); speck(g, w, h, 5603, 200, ['rgba(120,40,30,0.3)', 'rgba(215,120,100,0.25)'], 2); g.fillStyle = 'rgba(245,240,235,0.85)'; for (let i = 0; i < 8; i++) g.fillRect(0, i * h / 8, w, 1.5); }, 'track');
  /** a bank of floodlights, 6 x 5 lamps on a dark frame */
  A.lamps = D(128, 128, (g, w, h) => { g.fillStyle = '#5d646a'; g.fillRect(0, 0, w, h); for (let j = 0; j < 5; j++) for (let i = 0; i < 6; i++) { g.fillStyle = '#e9edf0'; g.beginPath(); g.arc((i + 0.5) * w / 6, (j + 0.5) * h / 5, 8, 0, TAU); g.fill(); g.fillStyle = '#aab3ba'; g.beginPath(); g.arc((i + 0.5) * w / 6, (j + 0.5) * h / 5, 4, 0, TAU); g.fill(); } }, 'lamps');
  A.concrete = D(128, 128, (g, w, h) => { g.fillStyle = '#b4b2ab'; g.fillRect(0, 0, w, h); speck(g, w, h, 5604, 700, ['rgba(140,138,130,0.3)', 'rgba(210,208,200,0.3)'], 4); g.fillStyle = 'rgba(90,88,82,0.35)'; g.fillRect(0, 0, w, 1.5); g.fillRect(0, 0, 1.5, h); }, 'concrete');
  return A;
}
