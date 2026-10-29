// landmarksSmolensky/art.js - canvas paintings of the cemetery sights (every texture key starts with 'lmsmol-'; the texture cache is scene-wide).  Colours: docs/research/smolensky.md sections 4-8, photos refs/smolensky
// 99 (Smolensk church), 26 / 28 / c10 / c12 (Xenia chapel), 38 / 40 (Trinity), 58 / 60 (Holy Gates), 57 / 45 (Resurrection), 81 / 84 / 139 (fences, tombs).
//  * windows: dark glass with a black forged lattice (refectory, Resurrection, gates), white-muntined fan-light panes (drum, lantern), amber icon glass with a circle-and-cross lattice (Xenia chapel),
//    the chestnut double door with its glazed upper half, the dark bell opening
//  * walls: banded brick (red courses 0.45 m + white belts 0.25 m: Resurrection), pebble-dash stucco in two greens (Xenia), diamond scale shingles (the tent), zinc standing seams, silver sheet ribs (domes)
//  * ground: herringbone brick pavers (Xenia plaza), asphalt, granite grain, gravel, leaf litter
//  * cut-outs (alpha): the forged bar fence of Maly pr. / Beringa st., the cast-iron church-lot fence with rosettes, the open gate leaf, the Xenia chapel grille
//  * plaques: Arina Rodionovna (marble), the cemetery hours plate, the two plates of the Smolensk church, the Xenia hours plate and burial plaque, the Trinity plaque and mosaic, the Kamskaya monument plate
const TAU = Math.PI * 2;

export const COL = {
  // Smolensk church
  blue: '#6fb9d8', blueShade: '#5aa3c4', white: '#f1eff2', whiteShade: '#d9d6dc', plinth: '#bba58f', zinc: '#b8c0c8', silver: '#b9c2c9', spire: '#c2c7d3', gold: '#d9a93a', chestnut: '#4a2c1c',
  canopy: '#55585d', iron: '#26292b', stepGranite: '#aba58f', pipe: '#9aa3a6',
  // Xenia chapel
  xGreenDark: '#3f8f56', xGreen: '#b4d3a8', xWhite: '#f0f0ea', xBrown: '#4a3a32', xTent: '#3d3a3c', xDrum: '#3a2f2a', xGold: '#d9b13a', xPlinth: '#9a9c9a', amber: '#d89a2a',
  // Trinity chapel
  tWhite: '#f1efe9', tLead: '#5a5360', tRoof: '#5b5e66', tGranite: '#9a9a96',
  // Holy Gates
  yellow: '#e3c06a', yTrim: '#f1ecdd', yRoof: '#8d9ba8', yPlinth: '#8a8d90',
  // Resurrection church
  brick: '#a85a43', rWhite: '#f0eeea', rGold: '#e0b030', rPlinth: '#a08a84', rBlue: '#b4c3e6', rDoor: '#2a3a8c',
  // fences and ground
  bars: '#2c333a', socle: '#a86a64', concrete: '#525c6e', asphalt: '#5c5554', pavers: '#b5b5ae', paversDark: '#8f8985', gravel: '#8b6a5a',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {};
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmsmol-' + key, repeat });
  const rnd = (seed) => ctx.rng(seed);

  // ------------------------------------------------------------------------------------------------ windows
  /** dark glass with a forged lattice of cols x rows squares (the uv spans the whole opening) */
  const lattice = (key, cols, rows, glass, line) => D(128, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, glass); gr.addColorStop(0.5, '#2a3946'); gr.addColorStop(1, '#1d2731');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(150,185,215,0.28)'; g.fillRect(w * 0.1, h * 0.05, w * 0.3, h * 0.35);
    g.fillStyle = line;
    for (let c = 0; c <= cols; c++) g.fillRect(Math.max(0, Math.min(w - 4, w * c / cols - 2)), 0, 4, h);
    for (let r = 0; r <= rows; r++) g.fillRect(0, Math.max(0, Math.min(h - 4, h * r / rows - 2)), w, 4);
  }, key);
  A.latt = lattice('latt', 5, 9, '#34495a', '#0e1114');
  A.lattGate = lattice('lattGate', 3, 5, '#38495a', '#14171a');
  A.lattRe = lattice('lattRe', 4, 8, '#34495a', '#15181b');
  /** white-muntined pane with a fan light on top (drum, lantern, upper windows of the gates) */
  const paneW = (key, cols, rows, archFrac) => D(128, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#3b5268'); gr.addColorStop(1, '#202c38'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(160,195,225,0.3)'; g.fillRect(w * 0.12, h * 0.06, w * 0.28, h * 0.3);
    g.fillStyle = '#f1efe9';
    g.fillRect(0, 0, 6, h); g.fillRect(w - 6, 0, 6, h); g.fillRect(0, h - 6, w, 6);
    for (let c = 1; c < cols; c++) g.fillRect(w * c / cols - 2, h * archFrac, 4, h);
    for (let r = 1; r < rows; r++) g.fillRect(0, h * (archFrac + (1 - archFrac) * r / rows) - 2, w, 4);
    g.fillRect(0, h * archFrac - 3, w, 6);
    g.strokeStyle = '#f1efe9'; g.lineWidth = 4; for (let k = 1; k < 6; k++) { const a = Math.PI * k / 6; g.beginPath(); g.moveTo(w / 2, h * archFrac); g.lineTo(w / 2 + Math.cos(a) * w / 2, h * archFrac - Math.sin(a) * h * archFrac); g.stroke(); }
  }, key);
  A.paneDrum = paneW('paneDrum', 2, 3, 0.3); A.paneLantern = paneW('paneLantern', 1, 2, 0.4);
  /** plain white-framed window with a barred glass (gates, ground windows): cols x rows */
  A.winGate = D(128, 192, (g, w, h) => {
    g.fillStyle = '#2d3a46'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(150,185,215,0.25)'; g.fillRect(w * 0.1, h * 0.06, w * 0.35, h * 0.35);
    g.fillStyle = '#efece0'; g.fillRect(0, 0, 7, h); g.fillRect(w - 7, 0, 7, h); g.fillRect(0, 0, w, 7); g.fillRect(0, h - 7, w, 7); g.fillRect(w / 2 - 3, 0, 6, h); g.fillRect(0, h * 0.42 - 3, w, 6);
    g.fillStyle = '#1d2022'; for (let i = 1; i < 6; i++) g.fillRect(w * i / 6 - 1.5, 7, 3, h - 14); g.fillRect(7, h * 0.7 - 2, w - 14, 4);
  }, 'winGate');
  /** amber icon glass of the Xenia chapel (pointed lancets): amber with a forged circle-and-cross lattice */
  A.amber = D(128, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e2a533'); gr.addColorStop(1, '#c98820'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#34261a'; g.lineWidth = 5;
    const rows = 6, cols = 2, cw = w / cols, ch = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const cx = cw * (c + 0.5), cy = ch * (r + 0.5);
      g.beginPath(); g.arc(cx, cy, Math.min(cw, ch) * 0.34, 0, TAU); g.stroke();
      g.beginPath(); g.moveTo(cx - cw * 0.34, cy); g.lineTo(cx + cw * 0.34, cy); g.moveTo(cx, cy - ch * 0.34); g.lineTo(cx, cy + ch * 0.34); g.stroke();
    }
    g.lineWidth = 6; g.strokeRect(2, 2, w - 4, h - 4);
  }, 'amber');
  /** dark bell opening with a rail and a few bells */
  A.bell = D(64, 128, (g, w, h) => {
    g.fillStyle = '#12151a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3a2f26'; g.fillRect(0, h * 0.25, w, 5); g.fillRect(0, h * 0.62, w, 5);
    g.fillStyle = '#7a5e3a'; for (let i = 0; i < 3; i++) { const cx = w * (0.22 + i * 0.28); g.beginPath(); g.moveTo(cx - 8, h * 0.62); g.quadraticCurveTo(cx - 9, h * 0.38, cx, h * 0.36); g.quadraticCurveTo(cx + 9, h * 0.38, cx + 8, h * 0.62); g.fill(); }
    g.fillStyle = '#1d2022'; g.fillRect(0, h * 0.8, w, 4); for (let i = 1; i < 9; i++) g.fillRect(w * i / 9 - 1, h * 0.8, 2, h * 0.2);
  }, 'bell');
  /** the chestnut double door, glazed upper half (2 x 3 panes per leaf), panelled lower part: 128 x 160 (2.6 x 3.2 m) */
  A.door = D(128, 160, (g, w, h) => {
    g.fillStyle = '#563528'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#6a4330'; g.fillRect(2, 2, w - 4, h - 4);
    for (const x0 of [0, w / 2]) {
      g.fillStyle = '#3d2518'; g.fillRect(x0 + 6, 6, w / 2 - 12, h * 0.46);
      g.fillStyle = '#1a2430'; for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) g.fillRect(x0 + 9 + i * (w / 4 - 8), 9 + j * (h * 0.46 / 3 - 1), w / 4 - 12, h * 0.46 / 3 - 6);
      g.fillStyle = '#3d2518'; g.fillRect(x0 + 6, h * 0.55, w / 2 - 12, h * 0.4);
      g.fillStyle = '#7a4d37'; g.fillRect(x0 + 12, h * 0.6, w / 2 - 24, h * 0.3);
    }
    g.fillStyle = '#26160d'; g.fillRect(w / 2 - 1.5, 0, 3, h);
  }, 'door');
  A.doorRe = D(64, 128, (g, w, h) => {                                      // the royal-blue arched door of the Resurrection gallery with a metal grid
    g.fillStyle = '#26337f'; g.fillRect(0, 0, w, h); g.fillStyle = '#34449c'; g.fillRect(4, 4, w - 8, h - 8);
    g.strokeStyle = '#10163f'; g.lineWidth = 2; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(w * i / 4, 4); g.lineTo(w * i / 4, h - 4); g.stroke(); }
    for (let j = 1; j < 6; j++) { g.beginPath(); g.moveTo(4, h * j / 6); g.lineTo(w - 4, h * j / 6); g.stroke(); }
    g.fillStyle = '#e0b030'; for (let i = 0; i < 2; i++) g.fillRect(w * 0.3 + i * w * 0.34, h * 0.55, 3, 8);
  }, 'doorRe');
  A.doorWest = D(64, 96, (g, w, h) => {                                     // dark metal-clad double door with a fan transom (the Resurrection west door)
    g.fillStyle = '#2a2d33'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a3e46'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) g.fillRect(4 + i * 15, h * 0.34 + j * 13, 12, 10);
    g.fillStyle = '#1d2026'; g.fillRect(w / 2 - 1.5, h * 0.3, 3, h * 0.7);
    g.fillStyle = '#323a46'; g.fillRect(0, 0, w, h * 0.3); g.strokeStyle = '#161a20'; g.lineWidth = 2; for (let k = 1; k < 6; k++) { const a = Math.PI * k / 6; g.beginPath(); g.moveTo(w / 2, h * 0.3); g.lineTo(w / 2 + Math.cos(a) * w / 2, h * 0.3 - Math.sin(a) * h * 0.3); g.stroke(); }
  }, 'doorWest');

  // ------------------------------------------------------------------------------------------------ walls
  /** banded brick of the Resurrection church, DENSE rhythm (catalogue 4.1, measured on nw07 / sd261): a 0.90 m tile = 7 red courses (0.52 m) + 5 white-plastered courses (0.38 m); white belts project 2-3 cm (relief shading) */
  A.brick = D(128, 128, (g, w, h) => {
    const r = rnd(8801), red = 74, cy = red / 7;
    g.fillStyle = '#e4e2dc'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#9b6656'; g.fillRect(0, 0, w, red);                                        // mortar: dark red-grey
    for (let row = 0; row < 7; row++) for (let c = -1; c < 4; c++) {
      const off = (row % 2) * w / 8, k = 0.88 + r() * 0.24;
      g.fillStyle = `rgb(${Math.min(255, 174 * k) | 0},${Math.min(255, 70 * k) | 0},${Math.min(255, 48 * k) | 0})`;
      g.fillRect(c * w / 4 + off + 1, row * cy + 1, w / 4 - 2, cy - 2);
    }
    g.fillStyle = 'rgba(120,118,112,0.30)'; for (let i = 1; i < 5; i++) g.fillRect(0, red + i * 54 / 5, w, 1.5);   // the white belt: five courses faintly grooved
    g.fillStyle = 'rgba(150,148,142,0.4)'; g.fillRect(0, red, w, 3); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, h - 3, w, 3);
  }, 'brick');
  /** the SPARSE rhythm of the central block: a 1.3 m tile = 14 red courses (1.05 m) + one 0.25 m white belt */
  A.brickSparse = D(128, 128, (g, w, h) => {
    const r = rnd(8803), red = 103, cy = red / 14;
    g.fillStyle = '#e4e2dc'; g.fillRect(0, 0, w, h); g.fillStyle = '#9b6656'; g.fillRect(0, 0, w, red);
    for (let row = 0; row < 14; row++) for (let c = -1; c < 4; c++) { const off = (row % 2) * w / 8, k = 0.88 + r() * 0.24; g.fillStyle = `rgb(${Math.min(255, 174 * k) | 0},${Math.min(255, 70 * k) | 0},${Math.min(255, 48 * k) | 0})`; g.fillRect(c * w / 4 + off + 1, row * cy + 0.5, w / 4 - 2, cy - 1); }
    g.fillStyle = 'rgba(150,148,142,0.4)'; g.fillRect(0, red, w, 2);
  }, 'brickSparse');
  A.brickPlain = D(128, 128, (g, w, h) => {                                 // the plain red wall (no belts): tiles 0.8 x 0.6 m (8 courses of 0.075)
    const r = rnd(8802), cy = h / 8; g.fillStyle = '#c9b2a0'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 8; row++) for (let c = -1; c < 4; c++) { const off = (row % 2) * w / 8, k = 0.88 + r() * 0.24; g.fillStyle = `rgb(${Math.min(255, 168 * k) | 0},${Math.min(255, 90 * k) | 0},${Math.min(255, 66 * k) | 0})`; g.fillRect(c * w / 4 + off + 1.5, row * cy + 1.5, w / 4 - 3, cy - 3); }
  }, 'brickPlain');
  /** pebble-dash stucco: speckle on a base colour */
  const pebble = (key, base, dark, light) => D(128, 128, (g, w, h) => {
    const r = rnd(8810 + key.length); g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1100; i++) { g.fillStyle = r() < 0.5 ? dark : light; g.globalAlpha = 0.18 + r() * 0.2; g.fillRect(r() * w, r() * h, 1 + r() * 2.2, 1 + r() * 2.2); }
    g.globalAlpha = 1;
  }, key);
  A.pebble = pebble('pebble', COL.xGreen, '#7fa476', '#dcebd2'); A.pebbleDark = pebble('pebbleDark', COL.xGreenDark, '#2c6a40', '#5fb47a');
  /** diamond scale shingles of the tent: tile 0.7 x 0.7 m (2 x 2 diamonds of 0.35 m) */
  A.scales = D(128, 128, (g, w, h) => {
    g.fillStyle = '#35333a'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      const cx = c * w / 2 + (r % 2) * w / 4, cy = r * h / 4 + h / 8;
      g.fillStyle = (r + c) % 2 ? '#47444b' : '#3d3a42'; g.beginPath(); g.moveTo(cx, cy - h / 8); g.lineTo(cx + w / 4, cy); g.lineTo(cx, cy + h / 8); g.lineTo(cx - w / 4, cy); g.closePath(); g.fill();
      g.strokeStyle = '#6a6567'; g.lineWidth = 1.5; g.stroke();
    }
  }, 'scales');
  /** standing-seam zinc / sheet-iron: 1 m tile, seams every 0.5 m */
  const seams = (key, base, line) => D(64, 64, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); g.fillStyle = line; g.fillRect(0, 0, 2, h); g.fillRect(w / 2, 0, 2, h); g.globalAlpha = 0.18; g.fillStyle = '#fff'; g.fillRect(3, 0, 6, h); g.fillRect(w / 2 + 3, 0, 6, h); g.globalAlpha = 1; }, key);
  A.zinc = seams('zinc', '#b4bcc4', '#8a949c'); A.zincDark = seams('zincDark', '#8d9ba8', '#667380'); A.roofDark = seams('roofDark', '#5b5e66', '#3e4148');
  /** silver sheet of the domes: repeated 14 times round a lathe body (28 radial seams) */
  A.sheet = D(64, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#aeb8c0'); gr.addColorStop(0.5, '#c3ccd2'); gr.addColorStop(1, '#aeb8c0'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#8c969e'; g.fillRect(0, 0, 2, h); g.fillRect(w / 2, 0, 2, h); }, 'sheet', [14, 1]);
  A.sheetPlain = D(32, 32, (g, w, h) => { g.fillStyle = '#b9c2c9'; g.fillRect(0, 0, w, h); g.fillStyle = '#9aa4ac'; g.fillRect(0, 0, 2, h); }, 'sheetPlain', [8, 1]);
  /** gold sheet (domes, crowns) */
  A.goldSheet = D(64, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#f0c24a'); gr.addColorStop(0.5, '#e0b030'); gr.addColorStop(1, '#c99a22'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(120,80,10,0.35)'; g.fillRect(0, 0, 2, h); g.fillRect(w / 2, 0, 1.5, h); }, 'goldSheet', [12, 1]);
  /** plain concrete panel wall with a joint every 3.0 m: tile 3 x 2.8 m */
  A.concrete = D(128, 128, (g, w, h) => { const r = rnd(8820); g.fillStyle = '#5a6476'; g.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? 'rgba(30,36,46,0.2)' : 'rgba(160,170,185,0.14)'; g.fillRect(r() * w, r() * h, 2 + r() * 8, 1 + r() * 3); } g.fillStyle = '#343c4a'; g.fillRect(0, 0, 2, h); }, 'concrete');

  // ------------------------------------------------------------------------------------------------ ground
  A.granite = D(128, 128, (g, w, h) => { const r = rnd(8830); g.fillStyle = '#b9b5ae'; g.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? 'rgba(60,56,52,0.22)' : 'rgba(255,250,240,0.22)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } }, 'granite');
  A.pavers = D(256, 256, (g, w, h) => {                                   // brick pavers 0.2 x 0.1 m in running bond, tile 2 m (20 courses of 12.8 px)
    const r = rnd(8831); g.fillStyle = '#8f8b84'; g.fillRect(0, 0, w, h);
    const bw = 25.6, bh = 12.8;
    for (let j = 0; j < 20; j++) for (let i = -1; i < 11; i++) {
      const k = 0.92 + r() * 0.16, base = (i * 3 + j * 5) % 7 === 0 ? 176 : 206;
      g.fillStyle = 'rgb(' + (Math.min(255, base * k) | 0) + ',' + (Math.min(255, (base - 4) * k) | 0) + ',' + (Math.min(255, (base - 14) * k) | 0) + ')';
      g.fillRect(i * bw + (j % 2) * bw / 2 + 1, j * bh + 1, bw - 2, bh - 2);
    }
  }, 'pavers');
  A.asphalt = D(128, 128, (g, w, h) => { const r = rnd(8832); g.fillStyle = '#5c5554'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? 'rgba(20,18,18,0.22)' : 'rgba(150,145,140,0.18)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } }, 'asphalt');
  A.gravel = D(128, 128, (g, w, h) => { const r = rnd(8833); g.fillStyle = '#8b6a5a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? 'rgba(60,40,30,0.3)' : 'rgba(200,170,150,0.3)'; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5); } }, 'gravel');
  /** forest floor: dark leaf litter with ferns / goutweed patches: tile 6 m */
  A.floor = D(256, 256, (g, w, h) => {
    const r = rnd(8834); g.fillStyle = '#4a5a34'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { g.fillStyle = ['#3b4a2a', '#56693a', '#5f5a38', '#6e5f3a', '#44552e'][i % 5]; g.globalAlpha = 0.35 + r() * 0.3; g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 14, 4 + r() * 9, r() * 3, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
  }, 'floor');

  // ------------------------------------------------------------------------------------------------ cut-outs (alpha)
  /** forged bar fence of Maly pr. / Beringa st.: panel 3.6 x 2.0 m (512 x 256 px = 142 px/m), pickets every 0.12 m with spear tips, top / mid rails, a band of scalloped arcs in the lower third */
  A.bars = D(512, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#2c333a'; g.strokeStyle = '#2c333a';
    const pk = 17.04, top = 12;
    for (let x = 4; x < w; x += pk) { g.fillRect(x, top, 3, h - top); g.beginPath(); g.moveTo(x - 2.5, top + 2); g.lineTo(x + 1.5, 0); g.lineTo(x + 5.5, top + 2); g.fill(); }
    g.fillRect(0, top + 6, w, 4); g.fillRect(0, h * 0.5, w, 4); g.fillRect(0, h * 0.86, w, 5);
    g.lineWidth = 3; for (let i = 0; i < 6; i++) { const cx = (i + 0.5) * w / 6; g.beginPath(); g.arc(cx, h * 0.5, w / 12, 0, Math.PI); g.stroke(); }
  }, 'bars');
  /** the black cast-iron church-lot fence of Kamskaya st.: panel 5.7 x 1.95 m (1024 x 256), bars every 0.14 m, scroll rosettes in the lower third, spear tips */
  A.barsK = D(1024, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#16181b'; g.strokeStyle = '#16181b';
    const pk = 25.2, top = 14;
    for (let x = 6; x < w; x += pk) { g.fillRect(x, top, 4.5, h - top); g.beginPath(); g.moveTo(x - 3, top + 3); g.lineTo(x + 2.25, 0); g.lineTo(x + 7.5, top + 3); g.fill(); }
    g.fillRect(0, top + 8, w, 5); g.fillRect(0, h * 0.62, w, 5); g.fillRect(0, h * 0.9, w, 6);
    g.lineWidth = 4; for (let i = 0; i < 10; i++) { const cx = (i + 0.5) * w / 10; g.beginPath(); g.arc(cx - 14, h * 0.76, 13, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx + 14, h * 0.76, 13, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx, h * 0.76, 6, 0, TAU); g.fill(); }
  }, 'barsK');
  /** an open gate leaf: black pickets with a Y-scroll panel pattern: 2.0 x 1.6 m? uv spans the leaf (256 x 256) */
  A.leaf = D(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#26292b'; g.strokeStyle = '#26292b';
    for (let x = 6; x < w; x += 18) { g.fillRect(x, 14, 4, h - 14); g.beginPath(); g.moveTo(x - 3, 17); g.lineTo(x + 2, 0); g.lineTo(x + 7, 17); g.fill(); }
    g.fillRect(0, 22, w, 5); g.fillRect(0, h * 0.5, w, 5); g.fillRect(0, h - 8, w, 8);
    g.lineWidth = 4; for (let i = 0; i < 3; i++) { const cx = (i + 0.5) * w / 3; g.beginPath(); g.arc(cx - 20, h * 0.74, 20, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx + 20, h * 0.74, 20, 0, TAU); g.stroke(); }
  }, 'leaf');
  /** the wrought-iron grille leaf of the Trinity chapel (tall, narrow): gilded balls every 0.45 m are modelled; the panel is a diamond lattice */
  A.grille = D(128, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#1b1c1f'; g.lineWidth = 4;
    g.strokeRect(2, 2, w - 4, h - 4);
    // a ladder of 10 rails with a small diamond (ogee-lattice) between each pair: photos 37 / 38 show a fine lattice, not three big crossing diagonals (the first version read as scaffolding)
    // the leaf is 0.85 x 2.3 m: 4 diamonds across (0.21 m) and 8 rows (0.29 m) of 4 x 8 cells; a rail under every row
    const cols = 4, rows = 8, cw = (w - 4) / cols, rh = (h - 4) / rows;
    for (let j = 0; j < rows; j++) {
      const y = 2 + j * rh; g.lineWidth = 4; g.beginPath(); g.moveTo(2, y); g.lineTo(w - 2, y); g.stroke();
      g.lineWidth = 2.5; g.beginPath();
      for (let i = 0; i < cols; i++) { const x = 2 + i * cw; g.moveTo(x + cw / 2, y); g.lineTo(x + cw, y + rh / 2); g.lineTo(x + cw / 2, y + rh); g.lineTo(x, y + rh / 2); g.closePath(); }
      g.stroke();
    }
  }, 'grille');

  /** the forged plot fence of a grave (a 1.3 x 0.9 m panel): pickets with small spear tips and a scroll band, 256 x 128 */
  A.plotFence = D(256, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#3a2a22'; g.strokeStyle = '#3a2a22';
    for (let x = 6; x < w; x += 14) { g.fillRect(x, 12, 4, h - 12); g.beginPath(); g.moveTo(x - 2, 14); g.lineTo(x + 2, 0); g.lineTo(x + 6, 14); g.fill(); }
    g.fillRect(0, 22, w, 5); g.fillRect(0, h - 10, w, 6); g.lineWidth = 3;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc((i + 0.5) * w / 6, h * 0.6, 13, 0, TAU); g.stroke(); }
  }, 'plotFence');

  // ------------------------------------------------------------------------------------------------ plaques and mosaics
  const FONT = ctx.tex.FONTS || { serif: 'serif', sans: 'sans-serif' };
  const lines = (g, list, x0, y0, w, size, font, color, gap = 1.25, weight = 600, align = 'center') => {
    g.fillStyle = color; g.textAlign = align; g.textBaseline = 'top'; let y = y0;
    for (const t of list) { if (t === '') { y += size * 0.5; continue; } g.font = `${weight} ${size}px ${font}`; ctx.tex.fitText(g, t, align === 'center' ? x0 + w / 2 : x0, y, w, size, font, weight); y += size * gap; }
    return y;
  };
  /** Arina Rodionovna: marble plate 0.45 x 0.65 m inside a stucco frame */
  A.arina = D(256, 384, (g, w, h) => {
    g.fillStyle = '#cfcdd6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#a9a7b2'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
    lines(g, ['НА ЭТОМ КЛАДБИЩЕ', 'ПОХОРОНЕНА', 'АРИНА РОДИОНОВНА', 'НЯНЯ А. С. ПУШКИНА', '1758 — 1828', '', '„Подруга дней моих суровых,', 'Голубка дряхлая моя!“', 'А. Пушкин'], 18, 26, w - 36, 25, FONT.serif, '#1c1c20', 1.3, 700);
  }, 'arina');
  /** the cemetery hours plate beside the arch: black, cream serif letters */
  A.hours = D(256, 256, (g, w, h) => {
    g.fillStyle = '#1b1c1f'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8c8a7e'; g.lineWidth = 3; g.strokeRect(8, 8, w - 16, h - 16);
    lines(g, ['Смоленское', 'православное кладбище', '', 'РЕЖИМ РАБОТЫ', '', 'с 9.00 до 18.00'], 14, 30, w - 28, 28, FONT.serif, '#ece4c8', 1.3, 700);
  }, 'hours');
  /** Kamskaya front: protected-monument plate of the Holy Gates */
  A.monGate = D(256, 256, (g, w, h) => {
    g.fillStyle = '#23262b'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7e8288'; g.lineWidth = 3; g.strokeRect(8, 8, w - 16, h - 16);
    lines(g, ['Памятник истории и культуры', 'Кладбище Смоленское', 'православное', 'Святые ворота с богадельней', 'и часовней, 1807-1809 гг.', 'Архитектор Л. И. Руска', 'Охраняется государством'], 14, 20, w - 28, 22, FONT.serif, '#d8d6cc', 1.32, 600);
  }, 'monGate');
  /** Smolensk church: white marble visitor-hours plate (0.4 x 0.7 m) */
  A.churchHours = D(256, 448, (g, w, h) => {
    g.fillStyle = '#e6e4e8'; g.fillRect(0, 0, w, h); g.fillStyle = '#16181b'; g.fillRect(w / 2 - 3, 10, 6, 34); g.fillRect(w / 2 - 14, 20, 28, 5);
    lines(g, ['Церковь в честь', 'Смоленской иконы', 'Божией Матери', 'Открыта: в воскресные и праздничные дни:', 'с 6.00 до 21.00; в будние дни:', 'с 9.00 до 20.00. Перерыв с 14.00 до 17.00', '', 'The Smolensk Ikon of Mother of God Church', 'Open: Sundays and Feast Days', '6 a.m. - 9 p.m.; Week Days 9 a.m. - 8 p.m.', 'Closed: 2 p.m. - 5 p.m.', '', 'Богослужения совершаются:', 'в воскресные и праздничные дни -', 'в 7.00, 10.00, 18.00; в будние дни - в 10.00, 18.00.', 'Перерыв с 14.00 до 17.00'], 12, 56, w - 24, 19, FONT.serif, '#1b1d20', 1.22, 700);
  }, 'churchHours');
  /** Smolensk church: dark grey-blue sheet-metal protected-monument plate (0.5 x 0.65 m) */
  A.churchPlate = D(256, 332, (g, w, h) => {
    g.fillStyle = '#4f5a66'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8c97a3'; g.lineWidth = 4; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#9aa4ae'; for (const [x, y] of [[18, 18], [w - 18, 18], [18, h - 18], [w - 18, h - 18]]) { g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); }
    lines(g, ['ПАМЯТНИК АРХИТЕКТУРЫ', '', 'ЦЕРКОВЬ СМОЛЕНСКОЙ', 'ИКОНЫ БОЖЬЕЙ МАТЕРИ', '', 'ПОСТРОЕНА в 1785-1790 гг.', 'АРХИТЕКТОР А. А. ИВАНОВ', 'ПЕРЕСТРОЕНА в первой', 'трети XIX в.', '', 'ОХРАНЯЕТСЯ ГОСУДАРСТВОМ'], 22, 30, w - 44, 21, FONT.sans, '#e4e8ec', 1.28, 700);
  }, 'churchPlate');
  /** Xenia chapel: white marble hours plate 0.5 x 0.35 m */
  A.xHours = D(256, 180, (g, w, h) => {
    g.fillStyle = '#e9e7e6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b7b3b0'; g.lineWidth = 3; g.strokeRect(6, 6, w - 12, h - 12);
    lines(g, ['Часовня', 'Святой Блаженной Ксении', 'открыта', 'с 8.00 до 19.00'], 10, 22, w - 20, 30, FONT.serif, '#1f1f22', 1.3, 700);
  }, 'xHours');
  /** Xenia chapel: the burial plaque (arched niche plate 0.45 x 1.2 m, gilded letters on white marble) */
  A.xBurial = D(192, 512, (g, w, h) => {
    g.fillStyle = '#e1dfd6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#b78a2c';
    lines(g, ['Во имя Отца и Сына', 'и Святого Духа.', 'В сей часовне погребена', 'раба Божия Блаженная', 'Ксения Григорьева', 'жена певчего', 'Андрея Федоровича.', 'Оставшись после мужа', '26 лет, странствовала', '45 лет. Звалась во вдовстве', 'именем мужа:', 'Андрей Федорович.', 'Всего жития ея было', 'на земле 71 год.', 'В 1794-1796 году', 'принимала участие', 'в построении Смоленской', 'церкви, тайно по ночам', 'таская на своих плечах', 'кирпичи для строющейся', 'церкви.', '„Кто меня знал,', 'да помянет мою душу', 'для спасения своей души“.', 'Аминь.'], 8, 24, w - 16, 17, FONT.serif, '#a87a22', 1.25, 700);
  }, 'xBurial');
  /** Trinity chapel: dark granite plaque on the east wall (0.5 x 0.35 m) */
  A.trPlaque = D(256, 180, (g, w, h) => {
    g.fillStyle = '#34373a'; g.fillRect(0, 0, w, h);
    lines(g, ['На сем месте находился главный престол храма', 'во Имя Святой Живоначальной Троицы,', 'построенного по проекту архитектора', 'В. Т. Кульченкова и освященного в 1831 г.', 'В 1932 г. храм был разобран на кирпич', 'по распоряжению богоборческой власти.', 'Сия памятная часовня возведена в 2001 г.'], 8, 12, w - 16, 15, FONT.sans, '#e8e8e4', 1.35, 600);
  }, 'trPlaque');
  /** Trinity chapel: the mosaic of Rublev's Trinity (0.8 x 0.9 m) with the Trisagion band (0.8 x 0.2 m): three seated figures round a table on a gold ground */
  A.trMosaic = D(256, 320, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h * 0.8); gr.addColorStop(0, '#b78c3a'); gr.addColorStop(1, '#8c6a2c'); g.fillStyle = gr; g.fillRect(0, 0, w, h * 0.8);
    const fig = (cx, col, cloak) => { g.fillStyle = '#d9b865'; g.beginPath(); g.arc(cx, h * 0.2, 17, 0, TAU); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(cx, h * 0.2, 11, 0, TAU); g.fill(); g.fillStyle = cloak; g.beginPath(); g.moveTo(cx - 34, h * 0.62); g.quadraticCurveTo(cx - 36, h * 0.3, cx, h * 0.28); g.quadraticCurveTo(cx + 36, h * 0.3, cx + 34, h * 0.62); g.fill(); };
    fig(64, '#c9a46a', '#3c5a8c'); fig(128, '#c9a46a', '#8a4a3a'); fig(192, '#c9a46a', '#4f7d6a');
    g.fillStyle = '#e8e0cc'; g.fillRect(104, h * 0.5, 48, h * 0.1); g.fillStyle = '#a6482e'; g.fillRect(118, h * 0.46, 20, h * 0.04);
    g.fillStyle = '#efe5c6'; g.fillRect(0, h * 0.8, w, h * 0.2); g.fillStyle = '#6a4b1e';
    lines(g, ['Святый Боже, Святый Крепкий,', 'Святый Безсмертный, помилуй нас.'], 6, h * 0.82, w - 12, 21, FONT.serif, '#6a4b1e', 1.25, 700);
  }, 'trMosaic');
  A.medallion = D(128, 128, (g, w, h) => {                                   // tile-mosaic medallion with a white and red cross in a circle
    g.fillStyle = '#d8d2c8'; g.fillRect(0, 0, w, h); g.fillStyle = '#7a8aa0'; g.beginPath(); g.arc(w / 2, h / 2, 56, 0, TAU); g.fill(); g.fillStyle = '#f3f1ea'; g.beginPath(); g.arc(w / 2, h / 2, 46, 0, TAU); g.fill();
    g.fillStyle = '#a6482e'; g.fillRect(w / 2 - 9, 22, 18, 84); g.fillRect(22, h / 2 - 9, 84, 18); g.fillStyle = '#f3f1ea'; g.fillRect(w / 2 - 4, 28, 8, 72); g.fillRect(28, h / 2 - 4, 72, 8);
  }, 'medallion');
  A.kokoshnikIcon = D(128, 128, (g, w, h) => {                               // gold-ground round icon (Christ / Xenia): simple figure
    const gr = g.createRadialGradient(w / 2, h / 2, 6, w / 2, h / 2, 62); gr.addColorStop(0, '#f0c85a'); gr.addColorStop(1, '#b98a30'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e0c3a0'; g.beginPath(); g.arc(w / 2, h * 0.34, 15, 0, TAU); g.fill(); g.fillStyle = '#9a2a24'; g.beginPath(); g.moveTo(w * 0.28, h * 0.92); g.quadraticCurveTo(w * 0.3, h * 0.5, w / 2, h * 0.5); g.quadraticCurveTo(w * 0.7, h * 0.5, w * 0.72, h * 0.92); g.fill();
    g.fillStyle = '#f0ece4'; g.beginPath(); g.arc(w / 2, h * 0.3, 21, Math.PI, TAU); g.fill();
  }, 'kokoshnikIcon');
  A.rosette = D(64, 64, (g, w, h) => { g.fillStyle = '#6fb9d8'; g.fillRect(0, 0, w, h); g.fillStyle = '#f1eff2'; for (let k = 0; k < 8; k++) { const a = k * TAU / 8; g.beginPath(); g.ellipse(w / 2 + Math.cos(a) * 14, h / 2 + Math.sin(a) * 14, 9, 5, a, 0, TAU); g.fill(); } g.beginPath(); g.arc(w / 2, h / 2, 7, 0, TAU); g.fill(); }, 'rosette');
  /** the glory (radiant cross with clouds and cherubs) for the pediment tympanum of the Smolensk church: white relief on blue, 4.6 x 1.2 m */
  A.glory = D(512, 128, (g, w, h) => {
    g.fillStyle = '#6fb9d8'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4f2f6';
    for (let k = -14; k <= 14; k++) { const a = -Math.PI / 2 + k * 0.105; g.beginPath(); g.moveTo(w / 2, h * 0.92); g.lineTo(w / 2 + Math.cos(a - 0.03) * 150, h * 0.92 + Math.sin(a - 0.03) * 150); g.lineTo(w / 2 + Math.cos(a + 0.03) * 150, h * 0.92 + Math.sin(a + 0.03) * 150); g.fill(); }
    g.fillRect(w / 2 - 4, h * 0.35, 8, 40); g.fillRect(w / 2 - 14, h * 0.48, 28, 7);
    for (const sx of [-1, 1]) for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(w / 2 + sx * (80 + k * 28), h * (0.82 - 0.05 * (k % 2)), 17 - k, 0, TAU); g.fill(); }
  }, 'glory');
  return A;
}
