// landmarksStrelka/mats.js - materials and canvas textures of the Spit ensemble.  Colours: docs/research/strelka.md section 3 (hex read from the photos refs/strelka ex_01 ex_06 ex_09 rc_05 rc_09
// fig_14 q_01 q_02 g_07 wh_03 wh_06 cu_11 aer_01).  Textures are light tiles tinted by the material colour, except the facade BAY textures (one bay per tile, painted in real colours, drawn on a flat
// wall quad with uv = (bay index, 0..1)): the Exchange wall bay (arched niche with the fan of voussoirs over a window + the square mezzanine window), the fan window of the gables, the warehouse and
// Customs house bays.  All keys start with lmSt-.
export const C = {
  white: '#f1eee6', whiteShade: '#dcd8cc', wall: '#c6cbbd', wallDark: '#b3b9aa', roof: '#9aa6ab', roofRed: '#b23a3c', roofGrey: '#9ba0a3',
  podium: '#8f8c88', stairs: '#9a9690', granite: '#9a9792', granitePink: '#a58b84', bollard: '#b08f86', sphere: '#8a8683', setts: '#6f7377', pavers: '#98695d',
  shaft: '#d5472c', rostra: '#3f7a45', capital: '#2f5d3c', iron: '#1b1f20', bowl: '#3a3d3b', figure: '#e4dccb', sculpt: '#b9b3a4', sculptBase: '#3f8f6c',
  gravel: '#b98f84', lawn: '#5a8b3c', begonia: '#c83a48', begoniaPink: '#e07a9a', lime: '#3f6f2c', hedge: '#35602a', bench: '#efece4',
  whN: '#e9d79a', whS: '#e3c56c', socle: '#c9bd95', customs: '#ece0c2', dome: '#b05a4c', statue: '#6fae8c', glass: '#2e3c46', door: '#4a2f26', anchor: '#4a3328', bronze: '#4f5a48',
};

export function makeMats(ctx) {
  const T = ctx.mat.toon, tex = ctx.tex;
  const M = { C };
  const rnd = (seed) => ctx.rng(seed);
  // ------------------------------------------------------------------------------------------------ tiles
  /** granite ashlar: tile 2.4 m x 1.2 m, two courses of 1.2 m blocks shifted by half a block, dark joints, speckles */
  const ashlar = tex.draw(256, 128, (g, w, h) => {
    const r = rnd(9101); g.fillStyle = '#eeeeec'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 2; row++) for (let k = -1; k < 3; k++) { const v = 222 + Math.floor(r() * 30); g.fillStyle = `rgb(${v},${v},${v - 2})`; g.fillRect(k * 128 + (row ? 64 : 0) + 2, row * 64 + 2, 124, 60); }
    for (let i = 0; i < 700; i++) { const v = 150 + Math.floor(r() * 90); g.fillStyle = `rgba(${v},${v - 4},${v - 8},0.35)`; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2); }
    g.fillStyle = '#aeaca8'; for (let row = 0; row < 2; row++) { g.fillRect(0, row * 64 - 1, w, 2); for (let k = 0; k < 3; k++) g.fillRect(k * 128 + (row ? 64 : 0) - 1, row * 64, 2, 64); }
    g.fillRect(0, h - 2, w, 2);
  }, { key: 'lmSt-ashlar', repeat: [1, 1] });
  /** setts: tile 1.2 m, 8 x 8 small stones in arcs suggested by offset rows */
  const setts = tex.draw(256, 256, (g, w, h) => {
    const r = rnd(9102); g.fillStyle = '#a9a9a6'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 8; row++) for (let k = -1; k < 9; k++) { const v = 196 + Math.floor(r() * 56); g.fillStyle = `rgb(${v},${v},${v + 3})`; const x = k * 32 + (row % 2 ? 16 : 0) + 2, y = row * 32 + 2; g.beginPath(); g.roundRect(x, y, 28, 28, 6); g.fill(); }
  }, { key: 'lmSt-setts', repeat: [1, 1] });
  /** small pavers (column platforms): tile 1.6 m, 8 rows of bricks 0.2 x 0.1 */
  const pavers = tex.draw(256, 256, (g, w, h) => {
    const r = rnd(9103); g.fillStyle = '#c9c2bc'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 16; row++) for (let k = -1; k < 9; k++) { const v = 214 + Math.floor(r() * 40); g.fillStyle = `rgb(${v},${v - 6},${v - 10})`; g.fillRect(k * 32 + (row % 2 ? 16 : 0) + 1, row * 16 + 1, 30, 14); }
  }, { key: 'lmSt-pavers', repeat: [1, 1] });
  const pebbles = tex.draw(256, 256, (g, w, h) => {
    const r = rnd(9104); g.fillStyle = '#e6e2dc'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const v = 200 + Math.floor(r() * 55); g.fillStyle = `rgb(${v},${v - 4},${v - 8})`; const s = 1 + r() * 3.2; g.fillRect(r() * w, r() * h, s, s * (0.6 + r() * 0.7)); }
    for (let i = 0; i < 380; i++) { const v = 150 + Math.floor(r() * 50); g.fillStyle = `rgba(${v},${v - 10},${v - 14},0.55)`; const s = 1 + r() * 2.4; g.fillRect(r() * w, r() * h, s, s); }
  }, { key: 'lmSt-pebbles', repeat: [1, 1] });
  const grass = tex.draw(256, 256, (g, w, h) => {
    const r = rnd(9105); g.fillStyle = '#f0f4e6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) { const v = 208 + Math.floor(r() * 47); g.fillStyle = `rgba(${v - 24},${v},${v - 40},0.22)`; const s = 2 + r() * 7; g.beginPath(); g.ellipse(r() * w, r() * h, s, s * (0.4 + r() * 0.5), r() * 3.1, 0, 6.3); g.fill(); }
  }, { key: 'lmSt-grass', repeat: [1, 1] });
  const flowers = tex.draw(128, 128, (g, w, h) => {
    const r = rnd(9106); g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 420; i++) { const v = 190 + Math.floor(r() * 65); g.fillStyle = r() < 0.12 ? 'rgba(150,190,130,0.9)' : `rgb(${v},${v},${v})`; g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * 3, 0, 6.3); g.fill(); }
  }, { key: 'lmSt-flowers', repeat: [1, 1] });
  /** standing-seam sheet roof: tile 0.6 m wide, one seam */
  const seam = tex.draw(64, 64, (g, w, h) => { g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h); g.fillStyle = '#b9b9b9'; g.fillRect(0, 0, 5, h); g.fillStyle = '#ffffff'; g.fillRect(5, 0, 3, h); }, { key: 'lmSt-seam', repeat: [1, 1] });
  /** leaves of the clipped limes */
  const leaves = tex.draw(128, 128, (g, w, h) => {
    const r = rnd(9107); g.fillStyle = '#c9d6b8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const v = 150 + Math.floor(r() * 105); g.fillStyle = `rgba(${v - 30},${v},${v - 60},0.75)`; g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * 5, 2 + r() * 3, r() * 3.1, 0, 6.3); g.fill(); }
  }, { key: 'lmSt-leaves', repeat: [1, 1] });

  // ------------------------------------------------------------------------------------------------ facade bay textures (real colours)
  /** canvas helpers in metres: bay of bw x bh metres on a W x H canvas, y up from the bottom */
  const bay = (W, H, bw, bh, fn, key, rep = true) => tex.draw(W, H, (g) => {
    const sx = W / bw, sy = H / bh, X = (x) => x * sx, Y = (y) => H - y * sy;
    const rect = (col, x0, y0, x1, y1) => { g.fillStyle = col; g.fillRect(X(x0), Y(y1), (x1 - x0) * sx, (y1 - y0) * sy); };
    const arch = (col, cx, y0, w, ys, r = w / 2) => { g.fillStyle = col; g.beginPath(); g.moveTo(X(cx - w / 2), Y(y0)); g.lineTo(X(cx - w / 2), Y(ys)); g.ellipse(X(cx), Y(ys), (w / 2) * sx, r * sy, 0, Math.PI, 0, false); g.lineTo(X(cx + w / 2), Y(y0)); g.closePath(); g.fill(); };
    const panes = (x0, y0, x1, y1, nx, ny, frame, glass) => { rect(frame, x0, y0, x1, y1); const pw = (x1 - x0) / nx, ph = (y1 - y0) / ny, m = 0.05; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const gr = g.createLinearGradient(0, Y(y0 + (j + 1) * ph), 0, Y(y0 + j * ph)); gr.addColorStop(0, glass[0]); gr.addColorStop(1, glass[1]); g.fillStyle = gr; g.fillRect(X(x0 + i * pw + m), Y(y0 + (j + 1) * ph - m), (pw - 2 * m) * sx, (ph - 2 * m) * sy); } };
    fn({ g, X, Y, sx, sy, rect, arch, panes, W, H, bw, bh });
  }, rep ? { key, repeat: [1, 1] } : { key });
  const GL = ['#5f7f9a', '#2c3b4a'];
  const rust = (q, col, x0, y0, x1, y1, step = 0.55) => { for (let y = y0 + step; y < y1 - 0.05; y += step) q.rect(col, x0, y - 0.03, x1, y + 0.03); };
  /** the Exchange wall bay: 6.05 m x 12.7 m (y 3.0 .. 15.7).  door = the middle bay of the end walls */
  const exBay = (door) => bay(256, 512, 6.05, 12.7, (q) => {
    q.rect(C.wall, 0, 0, 6.05, 12.7); rust(q, '#b4baab', 0, 0, 6.05, 7.4);
    q.rect('#aab0a2', 0, 0, 6.05, 0.35);                                              // plinth course
    q.arch(C.white, 3.025, 0.35, 4.3, 5.2, 2.15);                                     // archivolt band
    q.arch('#b9bfb0', 3.025, 0.35, 3.6, 5.2, 1.8);                                    // niche
    // the fan of five voussoirs over the window
    const g = q.g, cx = q.X(3.025), cy = q.Y(4.75);
    for (let k = -2; k <= 2; k++) { const a = -Math.PI / 2 + k * 0.36; g.fillStyle = k % 2 ? '#e2dfd5' : C.white; g.beginPath(); g.moveTo(cx + Math.cos(a - 0.15) * 0.5 * q.sx, cy + Math.sin(a - 0.15) * 0.5 * q.sy); g.lineTo(cx + Math.cos(a - 0.17) * 2.0 * q.sx, cy + Math.sin(a - 0.17) * 2.0 * q.sy); g.lineTo(cx + Math.cos(a + 0.17) * 2.0 * q.sx, cy + Math.sin(a + 0.17) * 2.0 * q.sy); g.lineTo(cx + Math.cos(a + 0.15) * 0.5 * q.sx, cy + Math.sin(a + 0.15) * 0.5 * q.sy); g.closePath(); g.fill(); }
    if (door) { q.rect('#d9d6cc', 1.85, 0.35, 4.2, 4.1); q.rect('#4a3024', 2.0, 0.35, 4.05, 3.6); q.rect('#2b3a48', 2.15, 2.0, 2.95, 3.3); q.rect('#2b3a48', 3.1, 2.0, 3.9, 3.3); q.rect('#33221a', 3.0, 0.35, 3.05, 3.6); q.rect('#6a4a35', 2.0, 3.6, 4.05, 3.95); }
    else { q.rect('#e6e3d9', 2.0, 1.05, 4.05, 4.7); q.panes(2.15, 1.2, 3.9, 4.55, 2, 4, '#f1eee6', GL); q.rect(C.white, 1.9, 0.9, 4.15, 1.08); }
    q.rect(C.white, 2.2, 8.35, 3.85, 10.1); q.panes(2.35, 8.5, 3.7, 9.95, 2, 2, '#f1eee6', GL);     // mezzanine window
    g.fillStyle = C.white; g.beginPath(); g.moveTo(q.X(2.75), q.Y(8.35)); g.lineTo(q.X(3.3), q.Y(8.35)); g.lineTo(q.X(3.18), q.Y(7.55)); g.lineTo(q.X(2.87), q.Y(7.55)); g.closePath(); g.fill();
    q.rect('#d9d6cc', 0, 11.2, 6.05, 11.35);
  }, door ? 'lmSt-exBayDoor' : 'lmSt-exBay');
  /** the fan window of a gable: 40 m x 12 m (x -20 .. 20, y 18.6 .. 30.6 of the end wall): springing 19.8, the fan of voussoirs from radius 5.9 (the glazing) to 10.1, flattened to 0.9 (crown 28.9) */
  const fan = bay(1024, 512, 40, 12, (q) => {
    const g = q.g; q.rect(C.wall, 0, 0, 40, 12);
    const cx = q.X(20), cy = q.Y(1.2), rx = (r) => r * q.sx, ry = (r) => r * 0.9 * q.sy;
    g.fillStyle = C.white; g.beginPath(); g.ellipse(cx, cy, rx(10.1), ry(10.1), 0, Math.PI, 0, false); g.closePath(); g.fill();
    g.strokeStyle = '#bdb9ac'; g.lineWidth = 3;
    for (let k = 0; k <= 22; k++) { const a = Math.PI + k * Math.PI / 22; g.beginPath(); g.moveTo(cx + Math.cos(a) * rx(5.9), cy + Math.sin(a) * ry(5.9)); g.lineTo(cx + Math.cos(a) * rx(10.1), cy + Math.sin(a) * ry(10.1)); g.stroke(); }
    g.strokeStyle = '#d2cec2'; g.lineWidth = 4; g.beginPath(); g.ellipse(cx, cy, rx(9.9), ry(9.9), 0, Math.PI, 0, false); g.stroke();
    g.fillStyle = '#e3dfd3'; g.beginPath(); g.ellipse(cx, cy, rx(6.3), ry(6.3), 0, Math.PI, 0, false); g.closePath(); g.fill();
    // glazing: three lights between two wall piers, small panes
    g.save(); g.beginPath(); g.ellipse(cx, cy, rx(5.9), ry(5.9), 0, Math.PI, 0, false); g.closePath(); g.clip();
    const gr = g.createLinearGradient(0, q.Y(6.6), 0, q.Y(1.2)); gr.addColorStop(0, '#7f9db6'); gr.addColorStop(1, '#33455a'); g.fillStyle = gr; g.fillRect(q.X(14), q.Y(7), 12 * q.sx, 6 * q.sy);
    g.fillStyle = C.white; for (let x = 14.3; x < 26; x += 0.72) g.fillRect(q.X(x), q.Y(7), 2, 6 * q.sy); for (let y = 1.2; y < 7; y += 0.9) g.fillRect(q.X(14), q.Y(y), 12 * q.sx, 2);
    g.fillStyle = C.wall; g.fillRect(q.X(17.35), q.Y(7), 0.75 * q.sx, 6 * q.sy); g.fillRect(q.X(21.9), q.Y(7), 0.75 * q.sx, 6 * q.sy);
    g.restore();
    q.rect(C.white, 1.0, 0.95, 39.0, 1.25);
    // the four small lunettes beside the fan
    for (const x of [20 - 18.2, 20 - 12.6, 20 + 12.6, 20 + 18.2]) { g.fillStyle = C.white; g.beginPath(); g.ellipse(q.X(x), q.Y(1.3), 1.45 * q.sx, 1.45 * q.sy, 0, Math.PI, 0, false); g.closePath(); g.fill(); g.fillStyle = '#3c4f62'; g.beginPath(); g.ellipse(q.X(x), q.Y(1.3), 1.1 * q.sx, 1.1 * q.sy, 0, Math.PI, 0, false); g.closePath(); g.fill(); }
  }, 'lmSt-fan', false);
  /** clerestory flank: one 6.065 m module x 4.5 m (y 19.2 .. 23.7): a = small round-headed window, b = half of a big lunette (two tiles make one), c = plain */
  const lun = bay(384, 96, 18.195, 4.5, (q) => {
    const g = q.g; q.rect(C.wall, 0, 0, 18.195, 4.5);
    const half = (cx, r, rw) => { g.fillStyle = C.white; g.beginPath(); g.ellipse(q.X(cx), q.Y(0.75), (r + rw) * q.sx, (r + rw) * q.sy, 0, Math.PI, 0, false); g.closePath(); g.fill(); g.fillStyle = '#3c4f62'; g.beginPath(); g.ellipse(q.X(cx), q.Y(0.75), r * q.sx, r * q.sy, 0, Math.PI, 0, false); g.closePath(); g.fill(); g.fillStyle = C.white; g.fillRect(q.X(cx) - 1.5, q.Y(0.75 + r), 3, r * q.sy); };
    half(3.03, 1.2, 0.3);                                                              // tile 0: a small window
    half(9.1, 2.9, 0.45);                                                              // tile 1: a big lunette (drawn whole in one tile, a little smaller than the OSM 3.8 m radius so that it fits)
    q.rect(C.white, 0, 0.55, 18.195, 0.75);
  }, 'lmSt-lun');
  /** Doric frieze: tile = a third of an intercolumniation (2.02 m) x 1.6 m, a triglyph centred on every tile boundary: one over each column and two between */
  const trig = tex.draw(128, 64, (g, w, h) => {
    g.fillStyle = C.white; g.fillRect(0, 0, w, h); g.fillStyle = '#e2ded2'; g.fillRect(0, 6, w, h - 12);
    const tw = 30; for (const x0 of [-tw / 2, w - tw / 2]) { g.fillStyle = C.white; g.fillRect(x0, 4, tw, h - 8); g.fillStyle = '#b7b3a6'; for (let k = 0; k < 3; k++) g.fillRect(x0 + 5 + k * 9, 10, 3, h - 22); }
    g.fillStyle = '#cfcbbf'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 5, w, 5);
  }, { key: 'lmSt-trig', repeat: [1, 1] });
  /** mutule cornice soffit strip / modillions: tile 1.0 m */
  const dent = tex.draw(64, 32, (g, w, h) => { g.fillStyle = '#d3d8e0'; g.fillRect(0, 0, w, h); g.fillStyle = '#b4bac6'; g.fillRect(10, 8, 14, 16); g.fillRect(42, 8, 14, 16); }, { key: 'lmSt-dent', repeat: [1, 1] });

  /** warehouse bay 5.6 m x 16 m: socle 0..3.0 with a small window, the tall arched bay 3.0..10.8, a square window 11.6..13.4, plain to the cornice.  The low wings use v 0..11/16. */
  const whBay = (wall, key, loggia = false) => bay(256, 512, 5.6, 16, (q) => {
    const g = q.g; q.rect(wall, 0, 0, 5.6, 16);
    q.rect(C.socle, 0, 0, 5.6, 3.0); rust(q, '#b3a67e', 0, 0, 5.6, 3.0, 0.5); for (let x = 0.7; x < 5.6; x += 1.4) q.rect('#b3a67e', x - 0.02, 0, x + 0.02, 3.0);
    q.rect('#8f8a80', 0, 0, 5.6, 0.45); q.rect(C.white, 0, 2.95, 5.6, 3.2);
    q.rect('#e9e5d8', 2.15, 0.9, 3.45, 2.3); q.panes(2.25, 1.0, 3.35, 2.2, 2, 2, '#f1eee6', GL);
    if (!loggia) {
      q.arch(C.white, 2.8, 3.2, 3.5, 8.3, 1.75); q.arch(wall === C.whN ? '#dcc98a' : '#d6b85f', 2.8, 3.2, 3.0, 8.3, 1.5);
      q.rect(C.white, 1.3, 8.15, 4.3, 8.4);
      q.panes(1.85, 3.9, 3.75, 8.1, 2, 4, '#f1eee6', GL);
      g.save(); g.beginPath(); g.ellipse(q.X(2.8), q.Y(8.45), 1.2 * q.sx, 1.2 * q.sy, 0, Math.PI, 0, false); g.closePath(); g.clip(); const gr = g.createLinearGradient(0, q.Y(9.7), 0, q.Y(8.4)); gr.addColorStop(0, GL[0]); gr.addColorStop(1, GL[1]); g.fillStyle = gr; g.fillRect(q.X(1.5), q.Y(9.8), 2.6 * q.sx, 1.4 * q.sy); g.fillStyle = '#f1eee6'; g.fillRect(q.X(2.8) - 1.5, q.Y(9.8), 3, 1.4 * q.sy); g.restore();
      g.fillStyle = C.white; g.beginPath(); g.moveTo(q.X(2.55), q.Y(10.1)); g.lineTo(q.X(3.05), q.Y(10.1)); g.lineTo(q.X(3.2), q.Y(10.75)); g.lineTo(q.X(2.4), q.Y(10.75)); g.closePath(); g.fill();
      q.rect(C.white, 1.75, 3.7, 3.85, 3.9);
    } else { q.panes(1.9, 4.2, 3.7, 7.6, 2, 3, '#f1eee6', GL); q.rect(C.white, 1.75, 4.0, 3.85, 4.2); }
    q.rect(C.white, 0, 10.95, 5.6, 11.15);
    q.rect(C.white, 1.95, 11.75, 3.65, 13.55); q.panes(2.1, 11.9, 3.5, 13.4, 2, 2, '#f1eee6', GL);
  }, key);
  /** Customs house: bay 4.4 m x 16.6 m: rusticated ground floor 0..6.1 with a round-headed window behind a white grille, two upper storeys of plain windows */
  const cuBay = bay(256, 512, 4.4, 16.6, (q) => {
    const g = q.g; q.rect(C.customs, 0, 0, 4.4, 16.6);
    rust(q, '#cfc3a4', 0, 0.6, 4.4, 6.0, 0.6); q.rect('#a9a59b', 0, 0, 4.4, 0.6); q.rect(C.white, 0, 5.95, 4.4, 6.25);
    q.arch(C.white, 2.2, 1.3, 2.3, 3.9, 1.15); q.arch('#2f3d4a', 2.2, 1.45, 1.9, 3.9, 0.95);
    g.strokeStyle = '#efece2'; g.lineWidth = 2; for (let x = 1.45; x < 3.0; x += 0.3) { g.beginPath(); g.moveTo(q.X(x), q.Y(1.45)); g.lineTo(q.X(x), q.Y(4.7)); g.stroke(); } for (let y = 1.9; y < 4.8; y += 0.55) { g.beginPath(); g.moveTo(q.X(1.25), q.Y(y)); g.lineTo(q.X(3.15), q.Y(y)); g.stroke(); }
    q.rect(C.white, 0.95, 1.15, 3.45, 1.32);
    q.rect(C.white, 1.3, 7.3, 3.1, 10.3); q.panes(1.42, 7.42, 2.98, 10.18, 2, 3, '#f1eee6', GL); q.rect(C.white, 1.15, 7.12, 3.25, 7.3);
    q.rect(C.white, 1.3, 11.9, 3.1, 14.4); q.panes(1.42, 12.02, 2.98, 14.28, 2, 3, '#f1eee6', GL); q.rect(C.white, 1.15, 11.72, 3.25, 11.9);
    q.rect(C.white, 0, 15.9, 4.4, 16.6);
  }, 'lmSt-cuBay');

  // ------------------------------------------------------------------------------------------------ materials
  const surf = (hex, map, name, off = -2) => T(hex, { map, name: 'lmSt-' + name, paint: 0.05, polygonOffset: off });
  Object.assign(M, {
    white: T(C.white, { name: 'lmSt-white', paint: 0.02 }), whiteShade: T(C.whiteShade, { name: 'lmSt-whiteShade', paint: 0.02 }), wall: T(C.wall, { name: 'lmSt-wall', paint: 0.03 }), soffit: T('#cdd2da', { name: 'lmSt-soffit', paint: 0.02 }),
    exBay: T('#ffffff', { map: exBay(false), name: 'lmSt-exBay', paint: 0.02 }), exBayDoor: T('#ffffff', { map: exBay(true), name: 'lmSt-exBayDoor', paint: 0.02 }),
    fan: T('#ffffff', { map: fan, name: 'lmSt-fan', paint: 0.02 }), lun: T('#ffffff', { map: lun, name: 'lmSt-lun', paint: 0.02 }),
    trig: T('#ffffff', { map: trig, name: 'lmSt-trig', paint: 0.01 }), dent: T('#ffffff', { map: dent, name: 'lmSt-dent', paint: 0.01 }),
    roof: T(C.roof, { map: seam, name: 'lmSt-roof', paint: 0.03 }), roofRed: T(C.roofRed, { map: seam, name: 'lmSt-roofRed', paint: 0.03 }), roofGrey: T(C.roofGrey, { map: seam, name: 'lmSt-roofGrey', paint: 0.03 }),
    podium: T(C.podium, { map: ashlar, name: 'lmSt-podium', paint: 0.03 }), podiumTop: T('#77787a', { name: 'lmSt-podiumTop', paint: 0.05 }), stairs: T(C.stairs, { name: 'lmSt-stairs', paint: 0.03 }),
    granite: T(C.granite, { map: ashlar, name: 'lmSt-granite', paint: 0.03 }), granitePlain: T(C.granite, { name: 'lmSt-graniteP', paint: 0.04 }),
    granitePink: T(C.granitePink, { map: ashlar, name: 'lmSt-granitePink', paint: 0.03 }), granitePinkPlain: T(C.granitePink, { name: 'lmSt-granitePinkP', paint: 0.04 }),
    bollard: T(C.bollard, { name: 'lmSt-bollard', paint: 0.04 }), sphere: T(C.sphere, { name: 'lmSt-sphere', paint: 0.05 }),
    setts: surf(C.setts, setts, 'setts'), settsRamp: T(C.setts, { map: setts, name: 'lmSt-settsRamp', paint: 0.05 }), pavers: surf(C.pavers, pavers, 'pavers', -3), slab: surf('#9a9890', ashlar, 'slab', -3),
    gravel: surf(C.gravel, pebbles, 'gravel', -3), lawn: T(C.lawn, { map: grass, name: 'lmSt-lawn', paint: 0.06, polygonOffset: -1 }),
    begonia: T(C.begonia, { map: flowers, name: 'lmSt-begonia', paint: 0.08 }), begoniaPink: T(C.begoniaPink, { map: flowers, name: 'lmSt-begoniaPink', paint: 0.08 }),
    lime: T(C.lime, { map: leaves, name: 'lmSt-lime', paint: 0.1 }), hedge: T(C.hedge, { map: leaves, name: 'lmSt-hedge', paint: 0.1 }), bark: T('#4a3f34', { name: 'lmSt-bark', paint: 0.05 }),
    bench: T(C.bench, { name: 'lmSt-bench', paint: 0.02 }), iron: T(C.iron, { name: 'lmSt-iron' }), lampGlass: T('#f2efe4', { name: 'lmSt-lampGlass', emissive: '#ffe9b0', emissiveIntensity: 0.25 }),
    shaft: T(C.shaft, { name: 'lmSt-shaft', paint: 0.03 }), rostra: T(C.rostra, { name: 'lmSt-rostra', paint: 0.04 }), capital: T(C.capital, { name: 'lmSt-capital', paint: 0.03 }), bowl: T(C.bowl, { name: 'lmSt-bowl', paint: 0.03 }),
    figure: T(C.figure, { name: 'lmSt-figure', paint: 0.05 }), figureDark: T('#b9b1a0', { name: 'lmSt-figureDark', paint: 0.03 }), sculpt: T(C.sculpt, { name: 'lmSt-sculpt', paint: 0.06 }), sculptDark: T('#8e897c', { name: 'lmSt-sculptDark', paint: 0.03 }),
    sculptBase: T(C.sculptBase, { name: 'lmSt-sculptBase', paint: 0.06 }),
    ironDoor: T('#8d99a3', { name: 'lmSt-ironDoor', paint: 0.03 }), glass: T(C.glass, { name: 'lmSt-glass', paint: 0.02 }), door: T(C.door, { name: 'lmSt-door', paint: 0.03 }),
    whN: T('#ffffff', { map: whBay(C.whN, 'lmSt-whN'), name: 'lmSt-whN', paint: 0.02 }), whS: T('#ffffff', { map: whBay(C.whS, 'lmSt-whS'), name: 'lmSt-whS', paint: 0.02 }),
    whNL: T('#ffffff', { map: whBay(C.whN, 'lmSt-whNL', true), name: 'lmSt-whNL', paint: 0.02 }), whSL: T('#ffffff', { map: whBay(C.whS, 'lmSt-whSL', true), name: 'lmSt-whSL', paint: 0.02 }),
    whNPlain: T(C.whN, { name: 'lmSt-whNPlain', paint: 0.04 }), whSPlain: T(C.whS, { name: 'lmSt-whSPlain', paint: 0.04 }), chimney: T('#d9c58a', { name: 'lmSt-chimney', paint: 0.04 }),
    cuBay: T('#ffffff', { map: cuBay, name: 'lmSt-cuBay', paint: 0.02 }), customs: T(C.customs, { name: 'lmSt-customs', paint: 0.04 }), dome: T(C.dome, { map: seam, name: 'lmSt-dome', paint: 0.04 }),
    statue: T(C.statue, { name: 'lmSt-statue', paint: 0.05 }), statueDark: T('#4f8068', { name: 'lmSt-statueDark', paint: 0.03 }),
    anchor: T(C.anchor, { name: 'lmSt-anchor', paint: 0.08 }), bronze: T(C.bronze, { name: 'lmSt-bronze', paint: 0.05 }),
  });
  M.tex = { ashlar, setts, pebbles, seam };
  M.decals = new Set();
  M.T = T;
  return M;
}
