// PROVENANCE: copied verbatim from src/world/landmarksSmolensky/atlas.js of this repository (itself copied from the source project 102_3d_piter, commit 0568f7af); only the texture / material / mesh name prefix lmsmol- became lmdek- (the texture cache is scene-wide) and the module name in the log lines. The header below is the original one.
// landmarksSmolensky/atlas.js - ONE 2048 x 2048 detail atlas ('lmdek-detailAtlas') for the 1-3 m level of the cemetery (docs/research/smolensky-detail.md 1.1-1.7, 7.2, 7.8; photos sd099 sd204 sd211 sd062 sd121 sd037 sd224 sd302).
// Every cell has an 8 px gutter of replicated edge pixels (the mips of a sheet bleed neighbours otherwise).  Three kinds of cell:
//  * 'alpha'  colour + alpha cut-outs (fence panels F1-F13, the lattice / grille, the crosses X1-X7, the plant cards, bouquets, flat bed fills): drawn light grey / real colour and tinted per instance;
//  * 'stone'  the opaque stone cells: R = grain luminance, G = engraving (drawn light), B = moss / lichen; the shader (gravemat.js) builds the colour from the instance tint, so one cell serves black, grey, red
//             and pale granite.  Faces of a stone cell: FACE = left 78 % (front / back of a slab), STRIP = right 16 % (sides, top);
//  * a cell never carries readable text, a face or a portrait (user rules: calm place, no invented names).
// atlas.cells[name] = { u0, v0, du, dv } in texture coordinates (v up: the picture's top row is v = u0 + dv); sizes in px chosen at ~213-270 px per metre (a panel is 1.2 m wide in 256 px).
const TAU = Math.PI * 2;
const SZ = 2048, PAD = 8;
export const FACE = [0.0, 0.0, 0.78, 1.0], STRIP = [0.82, 0.05, 0.16, 0.9];

export function makeAtlas(ctx) {
  const defs = [];
  const def = (name, w, h, mode, paint) => defs.push({ name, w, h, mode, paint });
  const IRON = '#ececec', IRON2 = '#bdbdbd';

  // ------------------------------------------------------------------------------------------------ iron fence panels (1.2 m wide = 256 px)
  const spear = (g, x, y, hw, h) => { g.beginPath(); g.moveTo(x - hw, y + h); g.lineTo(x, y); g.lineTo(x + hw, y + h); g.closePath(); g.fill(); };
  const ball = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  const post = (g, x, h, w = 8, r = 7) => { g.fillRect(x - w / 2, 12, w, h - 12); ball(g, x, 10, r); g.fillRect(x - w / 2 - 2, 20, w + 4, 4); };
  const flecks = (g, w, h, r, n) => { for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? 'rgba(150,150,150,0.5)' : 'rgba(255,255,255,0.35)'; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); } };
  def('f1', 256, 192, 'alpha', (g, w, h, r) => {                                      // arc-top hoops: flat pickets pitch 0.10, a hanging hoop between, double top rail
    g.fillStyle = IRON; g.strokeStyle = IRON; g.lineWidth = 4;
    g.fillRect(0, 30, w, 4); g.fillRect(0, 42, w, 4); g.fillRect(0, h - 8, w, 6);
    for (let x = 14; x < w; x += 21) { g.fillRect(x - 2, 14, 4, h - 14); spear(g, x, 4, 5, 12); }
    for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(43 + 85 * k, 46, 34, 0, Math.PI); g.stroke(); }
    post(g, 4, h, 8, 6); post(g, w - 4, h, 8, 6); flecks(g, w, h, r, 80);
  });
  def('f2', 256, 150, 'alpha', (g, w, h, r) => {                                      // ring-loop: stems with double loops on a flat top rail, ball-top posts
    g.fillStyle = IRON; g.strokeStyle = IRON; g.lineWidth = 3.5;
    g.fillRect(0, 22, w, 5); g.fillRect(0, h - 10, w, 5);
    for (let x = 20; x < w - 8; x += 24) { g.fillRect(x - 1.5, 22, 3, h - 22); for (const y of [56, 90]) { g.beginPath(); g.arc(x, y, 9, 0, TAU); g.stroke(); } }
    post(g, 5, h, 10, 8); post(g, w - 5, h, 10, 8); flecks(g, w, h, r, 60);
  });
  def('f3', 256, 170, 'alpha', (g, w, h, r) => {                                      // diamond trellis between two rails, acorn posts
    g.fillStyle = IRON; g.strokeStyle = IRON; g.lineWidth = 3;
    g.fillRect(0, 20, w, 5); g.fillRect(0, h - 10, w, 5);
    for (let x = -h; x < w + h; x += 34) { g.beginPath(); g.moveTo(x, 24); g.lineTo(x + 140, h - 8); g.stroke(); g.beginPath(); g.moveTo(x + 140, 24); g.lineTo(x, h - 8); g.stroke(); }
    for (const x of [6, w - 6]) { g.fillRect(x - 5, 26, 10, h - 26); g.beginPath(); g.ellipse(x, 14, 7, 11, 0, 0, TAU); g.fill(); }
    flecks(g, w, h, r, 60);
  });
  def('f4', 256, 224, 'alpha', (g, w, h, r) => {                                      // spear pickets pitch 0.12 with a band of small pointed arches between the spear tips, fleur finials
    g.fillStyle = IRON; g.strokeStyle = IRON; g.lineWidth = 3.5;
    g.fillRect(0, 44, w, 4); g.fillRect(0, 60, w, 4); g.fillRect(0, h - 12, w, 6);
    for (let x = 12; x < w; x += 25.6) { g.fillRect(x - 2.5, 20, 5, h - 20); spear(g, x, 4, 6, 18); }
    for (let k = 0; k < 10; k++) { const x = 25 * k + 12; g.beginPath(); g.moveTo(x, 46); g.quadraticCurveTo(x + 6, 30, x + 12.5, 22); g.quadraticCurveTo(x + 19, 30, x + 25, 46); g.stroke(); }
    for (const x of [6, 134]) { ball(g, x, 16, 9); g.beginPath(); g.arc(x - 9, 24, 6, 0, Math.PI * 1.5); g.stroke(); g.beginPath(); g.arc(x + 9, 24, 6, Math.PI * 1.5, Math.PI * 3); g.stroke(); }
    flecks(g, w, h, r, 90);
  });
  def('f5', 256, 150, 'alpha', (g, w, h, r) => {                                      // C-scroll top rail, spear / fleur finials
    g.fillStyle = IRON; g.strokeStyle = IRON; g.lineWidth = 3.5;
    g.fillRect(0, 34, w, 4); g.fillRect(0, h - 10, w, 5);
    for (let x = 12; x < w; x += 18) { g.fillRect(x - 1.5, 34, 3, h - 34); }
    for (let k = 0; k < 4; k++) { const x = 32 + 64 * k; g.beginPath(); g.arc(x - 12, 22, 11, Math.PI * 0.6, Math.PI * 2.1); g.stroke(); g.beginPath(); g.arc(x + 12, 22, 11, Math.PI * 0.9, Math.PI * 2.4, true); g.stroke(); spear(g, x, 2, 5, 14); }
    post(g, 5, h, 9, 7); post(g, w - 5, h, 9, 7); flecks(g, w, h, r, 50);
  });
  def('f6', 256, 213, 'alpha', (g, w, h, r) => {                                      // heart-scroll panel (painted blue) with diamond plates every 0.5 m
    g.fillStyle = IRON; g.strokeStyle = IRON; g.lineWidth = 4;
    g.fillRect(0, 24, w, 5); g.fillRect(0, h - 12, w, 6);
    for (let k = 0; k < 5; k++) { const x = 26 + 51 * k; g.beginPath(); g.moveTo(x, 70); g.bezierCurveTo(x - 30, 44, x - 28, 90, x, 112); g.bezierCurveTo(x + 28, 90, x + 30, 44, x, 70); g.stroke(); g.fillRect(x - 1.5, 112, 3, h - 124); }
    for (const x of [0, 107, 214]) { g.save(); g.translate(x + 20, 150); g.rotate(Math.PI / 4); g.fillRect(-9, -9, 18, 18); g.restore(); }
    post(g, 5, h, 10, 7); post(g, w - 5, h, 10, 7); flecks(g, w, h, r, 60);
  });
  def('f7', 256, 213, 'alpha', (g, w, h, r) => {                                      // cast rosette panels: circle-in-square wheels
    g.fillStyle = IRON; g.strokeStyle = IRON; g.lineWidth = 5;
    g.strokeRect(12, 22, 232, 178);
    for (const cx of [75, 181]) { g.lineWidth = 4; g.beginPath(); g.arc(cx, 111, 56, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx, 111, 22, 0, TAU); g.stroke(); g.lineWidth = 4; for (let a = 0; a < 8; a++) { g.beginPath(); g.moveTo(cx + Math.cos(a * Math.PI / 4) * 22, 111 + Math.sin(a * Math.PI / 4) * 22); g.lineTo(cx + Math.cos(a * Math.PI / 4) * 56, 111 + Math.sin(a * Math.PI / 4) * 56); g.stroke(); } }
    g.fillRect(0, 8, 14, h - 8); g.fillRect(w - 14, 8, 14, h - 8); flecks(g, w, h, r, 60);
  });
  def('f8', 256, 160, 'alpha', (g, w, h, r) => {                                      // chain on cast ball-top posts (heavy chain, three swags)
    g.fillStyle = IRON; g.strokeStyle = IRON;
    for (const x of [8, 128, 248]) { g.fillRect(x - 7, 26, 14, h - 26); ball(g, x, 18, 11); g.fillRect(x - 10, 40, 20, 6); }
    g.lineWidth = 6; g.setLineDash([9, 3]);
    for (const a of [8, 128]) { g.beginPath(); g.moveTo(a + 8, 56); g.quadraticCurveTo(a + 60, 118, a + 112, 56); g.stroke(); }
    g.setLineDash([]); flecks(g, w, h, r, 40);
  });
  def('f9', 256, 340, 'alpha', (g, w, h, r) => {                                      // Gothic arcade grille round a tomb: two trefoil arches
    g.fillStyle = IRON; g.strokeStyle = IRON; g.lineWidth = 6;
    g.fillRect(0, h - 14, w, 8); g.fillRect(0, 110, w, 5);
    for (const x0 of [0, 128]) {
      g.beginPath(); g.moveTo(x0 + 8, 110); g.lineTo(x0 + 8, 70); g.quadraticCurveTo(x0 + 10, 26, x0 + 64, 8); g.quadraticCurveTo(x0 + 118, 26, x0 + 120, 70); g.lineTo(x0 + 120, 110); g.stroke();
      g.lineWidth = 4; g.beginPath(); g.arc(x0 + 64, 62, 20, 0, TAU); g.stroke(); for (const dx of [-24, 24]) { g.beginPath(); g.arc(x0 + 64 + dx, 82, 12, 0, TAU); g.stroke(); } g.lineWidth = 6;
      g.lineWidth = 3.5; for (let x = x0 + 16; x < x0 + 120; x += 16) { g.beginPath(); g.moveTo(x, 118); g.lineTo(x, h - 14); g.stroke(); } g.lineWidth = 6;
    }
    ball(g, 64, 6, 6); ball(g, 192, 6, 6); post(g, 4, h, 8, 0.1); post(g, w - 4, h, 8, 0.1); flecks(g, w, h, r, 120);
  });
  def('f10', 256, 256, 'alpha', (g, w, h, r) => {                                     // chain-link mesh in a frame, rusty posts
    g.fillStyle = IRON; g.strokeStyle = IRON; g.lineWidth = 1.6;
    for (let x = -h; x < w + h; x += 13) { g.beginPath(); g.moveTo(x, 12); g.lineTo(x + h, h - 6); g.stroke(); g.beginPath(); g.moveTo(x + h, 12); g.lineTo(x, h - 6); g.stroke(); }
    g.fillRect(0, 8, w, 6); g.fillRect(0, h - 8, w, 6); g.fillRect(0, 8, 10, h - 8); g.fillRect(w - 10, 8, 10, h - 8); flecks(g, w, h, r, 100);
  });
  def('f11', 256, 235, 'alpha', (g, w, h, r) => {                                     // plain pointed pickets, two rails
    g.fillStyle = IRON; g.fillRect(0, 64, w, 5); g.fillRect(0, h - 28, w, 6);
    for (let x = 12; x < w; x += 25.6) { g.fillRect(x - 2.5, 14, 5, h - 14); spear(g, x, 2, 6, 14); }
    post(g, 4, h, 8, 0.1); post(g, w - 4, h, 8, 0.1); flecks(g, w, h, r, 70);
  });
  def('f12', 256, 107, 'alpha', (g, w, h, r) => {                                     // lyre-scroll frames (round the Xenia candle box)
    g.fillStyle = IRON; g.strokeStyle = IRON; g.lineWidth = 4; g.fillRect(0, h - 8, w, 6); g.fillRect(0, 8, w, 4);
    for (let k = 0; k < 4; k++) { const x = 32 + 64 * k; g.beginPath(); g.moveTo(x - 20, h - 8); g.bezierCurveTo(x - 36, 40, x - 12, 16, x - 6, 36); g.stroke(); g.beginPath(); g.moveTo(x + 20, h - 8); g.bezierCurveTo(x + 36, 40, x + 12, 16, x + 6, 36); g.stroke(); g.fillRect(x - 1.5, 30, 3, h - 38); }
    flecks(g, w, h, r, 30);
  });
  def('f13', 256, 118, 'alpha', (g, w, h, r) => {                                     // low wrought fence with big S-scrolls and pointed finials
    g.fillStyle = IRON; g.strokeStyle = IRON; g.lineWidth = 4.5; g.fillRect(0, 26, w, 4); g.fillRect(0, h - 10, w, 5);
    for (let k = 0; k < 3; k++) { const x = 8 + 85 * k; g.beginPath(); g.moveTo(x, h - 10); g.bezierCurveTo(x + 40, h - 40, x + 4, 40, x + 40, 36); g.bezierCurveTo(x + 76, 32, x + 46, 70, x + 80, h - 10); g.stroke(); spear(g, x + 40, 4, 5, 24); }
    post(g, 4, h, 8, 5); post(g, w - 4, h, 8, 5); flecks(g, w, h, r, 30);
  });
  def('lat', 256, 384, 'alpha', (g, w, h, r) => {                                     // diamond lattice wall of an iron gazebo (cells 0.1 m)
    g.fillStyle = IRON; g.strokeStyle = IRON; g.lineWidth = 2.6;
    for (let x = -h; x < w + h; x += 26) { g.beginPath(); g.moveTo(x, 8); g.lineTo(x + h, h - 8); g.stroke(); g.beginPath(); g.moveTo(x + h, 8); g.lineTo(x, h - 8); g.stroke(); }
    g.fillRect(0, 0, 8, h); g.fillRect(w - 8, 0, 8, h); g.fillRect(0, 0, w, 10); g.fillRect(0, h - 12, w, 12); g.fillRect(0, h * 0.45, w, 6); flecks(g, w, h, r, 120);
  });
  def('grille', 256, 384, 'alpha', (g, w, h, r) => {                                  // an iron door grille of a chapel-tomb: arched head with a cross, bars pitch 0.07
    g.fillStyle = IRON; g.strokeStyle = IRON; g.lineWidth = 6;
    g.beginPath(); g.moveTo(6, h); g.lineTo(6, 130); g.quadraticCurveTo(6, 8, 128, 6); g.quadraticCurveTo(250, 8, 250, 130); g.lineTo(250, h); g.stroke();
    g.lineWidth = 3.5; for (let x = 20; x < 240; x += 18) { g.beginPath(); g.moveTo(x, 40 + 70 * Math.abs(x - 128) / 128 * 0.9); g.lineTo(x, h); g.stroke(); }
    g.fillRect(8, h * 0.52, 240, 6); g.fillRect(8, h - 12, 240, 8); g.fillRect(122, 30, 12, 60); g.fillRect(104, 50, 48, 10); flecks(g, w, h, r, 100);
  });

  // ------------------------------------------------------------------------------------------------ crosses (270 px per metre; arm span / height in the comments)
  const bar = (g, x0, y0, x1, y1, t) => { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * t / 2, ny = dx / l * t / 2; g.beginPath(); g.moveTo(x0 + nx, y0 + ny); g.lineTo(x1 + nx, y1 + ny); g.lineTo(x1 - nx, y1 - ny); g.lineTo(x0 - nx, y0 - ny); g.closePath(); g.fill(); };
  const trefoil = (g, x, y, r, dx, dy) => { ball(g, x, y, r); ball(g, x + dy * r * 0.9, y + dx * r * 0.9, r * 0.8); ball(g, x - dy * r * 0.9, y - dx * r * 0.9, r * 0.8); };
  def('x1', 180, 512, 'alpha', (g, w, h, r) => {                                      // cast-iron openwork cross 0.67 x 1.9 m: trefoil arm ends, medallion with a diamond lattice, scrolls, stepped foot
    g.fillStyle = IRON; g.strokeStyle = IRON;
    bar(g, 90, 46, 90, 470, 17); bar(g, 12, 200, 168, 200, 16); bar(g, 40, 100, 140, 100, 12);
    trefoil(g, 90, 36, 13, 0, -1); trefoil(g, 14, 200, 12, 1, 0); trefoil(g, 166, 200, 12, -1, 0); trefoil(g, 90, 476, 12, 0, 1);
    g.lineWidth = 9; g.beginPath(); g.arc(90, 200, 40, 0, TAU); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(90, 168); g.lineTo(122, 200); g.lineTo(90, 232); g.lineTo(58, 200); g.closePath(); g.stroke(); ball(g, 90, 200, 11);
    g.lineWidth = 6; for (const s of [-1, 1]) { g.beginPath(); g.arc(90 + s * 36, 150, 22, s > 0 ? Math.PI * 0.9 : Math.PI * 1.1, s > 0 ? Math.PI * 2.4 : Math.PI * -0.4, s < 0); g.stroke(); g.beginPath(); g.arc(90 + s * 34, 252, 20, s > 0 ? Math.PI * 1.6 : Math.PI * 1.4, s > 0 ? Math.PI * 3.1 : Math.PI * -0.1, s < 0); g.stroke(); g.beginPath(); g.arc(90 + s * 28, 420, 20, 0, TAU); g.stroke(); }
    g.fillRect(70, 452, 40, 10); flecks(g, w, h, r, 120);
  });
  def('x2', 180, 486, 'alpha', (g, w, h, r) => {                                      // forged-iron cross: thin twisted bars, spade-ended arms with curls, scroll feet, an onion arch on top
    g.fillStyle = IRON; g.strokeStyle = IRON; g.lineWidth = 8;
    bar(g, 90, 60, 90, 450, 8); bar(g, 14, 190, 166, 190, 8); bar(g, 46, 112, 134, 112, 7);
    g.beginPath(); g.moveTo(66, 62); g.quadraticCurveTo(90, 8, 114, 62); g.stroke();
    for (const x of [14, 166]) { g.beginPath(); g.arc(x, 190, 11, 0, TAU * 0.85); g.stroke(); }
    g.lineWidth = 6; for (const s of [-1, 1]) { g.beginPath(); g.arc(90 + s * 24, 408, 24, 0, TAU * 0.8); g.stroke(); g.beginPath(); g.arc(90 + s * 26, 238, 18, 0, TAU * 0.75); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(52, 292, 76, 34); g.fillStyle = IRON; flecks(g, w, h, r, 120);
  });
  def('x3', 176, 432, 'alpha', (g, w, h, r) => {                                      // pebble-mosaic concrete cross 0.65 x 1.6 m (section 0.15): trefoil ends, a round medallion, moss
    const cross = () => { g.beginPath(); g.rect(68, 40, 40, 392); g.rect(8, 150, 160, 40); g.arc(88, 36, 30, 0, TAU); g.arc(26, 170, 26, 0, TAU); g.arc(150, 170, 26, 0, TAU); };
    g.save(); cross(); g.clip(); g.fillStyle = '#9d9a92'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) { const v = 140 + r() * 100 | 0; g.fillStyle = `rgb(${v},${v - 4},${v - 10})`; g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * 5, 2 + r() * 3.5, r() * 3, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(100,95,88,0.55)'; g.beginPath(); g.arc(88, 170, 28, 0, TAU); g.fill(); g.fillStyle = 'rgba(214,212,204,0.9)'; g.beginPath(); g.arc(88, 170, 18, 0, TAU); g.fill();
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(131,152,62,0.55)'; g.beginPath(); g.arc(r() * w, 250 + r() * 180, 2 + r() * 7, 0, TAU); g.fill(); }
    g.restore();
  });
  def('x4', 190, 432, 'alpha', (g, w, h, r) => {                                      // painted stone trefoil cross 0.7 x 1.6 m: soft rounded arms, an oval plate, lichen discs
    g.fillStyle = '#dcdcd4'; g.beginPath(); g.rect(78, 44, 34, 388); g.rect(14, 150, 162, 34); g.arc(95, 40, 28, 0, TAU); g.arc(26, 166, 24, 0, TAU); g.arc(164, 166, 24, 0, TAU); g.fill();
    g.fillStyle = '#c4c4bc'; g.beginPath(); g.ellipse(95, 168, 15, 20, 0, 0, TAU); g.fill(); g.fillStyle = '#f2f2ee'; g.beginPath(); g.ellipse(95, 168, 11, 15, 0, 0, TAU); g.fill();
    g.save(); g.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 60; i++) { g.fillStyle = r() < 0.6 ? 'rgba(235,225,220,0.7)' : 'rgba(131,152,62,0.5)'; g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * 5, 0, TAU); g.fill(); } g.restore();
  });
  def('x5', 200, 380, 'alpha', (g, w, h, r) => {                                      // granite cross 0.74 x 1.4 m with the top, main and slanted foot bar (light grey: tinted black / red)
    g.fillStyle = '#d6d6d6'; g.fillRect(82, 20, 36, 360); g.fillRect(8, 112, 184, 34); g.fillRect(52, 44, 96, 22);
    g.save(); g.translate(100, 330); g.rotate(-0.22); g.fillRect(-52, -10, 104, 20); g.restore();
    g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.strokeRect(86, 24, 28, 352); g.strokeRect(12, 116, 176, 26); g.strokeRect(56, 48, 88, 14);
  });
  def('x6', 160, 600, 'alpha', (g, w, h, r) => {                                      // wooden gabled cross ("golubets") 0.6 x 2.2 m: scalloped A-roof, a ceramic icon plate, carved line on the bar
    g.fillStyle = '#c9c9c9'; g.beginPath(); g.moveTo(80, 0); g.lineTo(150, 54); g.lineTo(10, 54); g.closePath(); g.fill();
    g.fillStyle = '#a8a8a8'; g.beginPath(); g.moveTo(80, 10); g.lineTo(136, 50); g.lineTo(24, 50); g.closePath(); g.fill();
    g.fillStyle = '#d8d8d8'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(18 + i * 18, 56, 8, 0, Math.PI); g.fill(); }
    g.fillStyle = '#d0d0d0'; g.fillRect(60, 54, 40, 546); g.fillRect(10, 200, 140, 30);
    g.fillStyle = '#9a9a9a'; for (let y = 70; y < 600; y += 16) g.fillRect(64 + r() * 12, y, 3, 8 + r() * 6);
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(80, 130, 15, 20, 0, 0, TAU); g.fill(); g.fillStyle = '#7a7a7a'; for (let i = 0; i < 6; i++) g.fillRect(16 + i * 22, 212, 12, 4);
  });
  def('x7', 135, 400, 'alpha', (g, w, h, r) => {                                      // plain weathered wooden cross 0.5 x 1.5 m with a little shingled roof
    g.fillStyle = '#bdbdbd'; g.beginPath(); g.moveTo(67, 0); g.lineTo(125, 38); g.lineTo(9, 38); g.closePath(); g.fill();
    g.fillStyle = '#cfcfcf'; g.fillRect(52, 36, 30, 364); g.fillRect(6, 128, 123, 26);
    g.fillStyle = '#8f8f8f'; for (let y = 50; y < 400; y += 14) g.fillRect(54 + r() * 14, y, 2.5, 8 + r() * 8);
  });

  // ------------------------------------------------------------------------------------------------ plants and flowers (cards; real colour)
  const leaf = (g, x, y, rx, ry, rot, col, vein) => { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-rx, -ry * 0.3, -rx * 0.8, -ry * 0.9, 0, -ry); g.bezierCurveTo(rx * 0.8, -ry * 0.9, rx, -ry * 0.3, 0, 0); g.fill(); if (vein) { g.strokeStyle = vein; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -ry * 0.85); g.stroke(); } g.restore(); };
  def('pGout', 256, 192, 'alpha', (g, w, h, r) => {                                   // goutweed (Aegopodium): knee-high stalks with three-lobed light-green leaves, white umbels
    const cols = ['#88a971', '#6c8b54', '#a5c78c', '#7a9b62', '#5b7d44'];
    for (let k = 0; k < 14; k++) { const x = 10 + r() * 236, top = 40 + r() * 110, lean = (r() - 0.5) * 0.5; g.strokeStyle = '#5b7d44'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + lean * 30, h - top / 2, x + lean * 60, h - top); g.stroke(); const lx = x + lean * 60, ly = h - top; for (let j = 0; j < 3; j++) leaf(g, lx, ly, 20 + r() * 8, 34 + r() * 12, -0.9 + j * 0.9 + (r() - 0.5) * 0.4, cols[(r() * 5) | 0], 'rgba(60,90,40,0.7)'); }
    for (let k = 0; k < 14; k++) { const x = r() * w, y = h - 20 - r() * 130; leaf(g, x, y + 30, 16 + r() * 10, 26 + r() * 10, (r() - 0.5) * 1.8, cols[(r() * 5) | 0], 'rgba(60,90,40,0.6)'); }
    for (let k = 0; k < 5; k++) { const x = 20 + r() * 216, y = 14 + r() * 40; g.fillStyle = 'rgba(236,244,226,0.95)'; for (let i = 0; i < 9; i++) ball(g, x + (r() - 0.5) * 22, y + (r() - 0.5) * 10, 2.2); }
  });
  def('pNet', 256, 192, 'alpha', (g, w, h, r) => {                                    // nettle and burdock: serrated dark leaves
    const cols = ['#4f7a3a', '#5d8a42', '#3f6a2e', '#6a9a4a'];
    for (let k = 0; k < 12; k++) { const x = 10 + r() * 236, top = 50 + r() * 120; g.strokeStyle = '#3f6a2e'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x, h); g.lineTo(x + (r() - 0.5) * 30, h - top); g.stroke(); for (let j = 0; j < 4; j++) { const y = h - top * (0.3 + j * 0.22); leaf(g, x + (r() - 0.5) * 20, y, 11 + r() * 5, 30 + r() * 10, (j % 2 ? 1 : -1) * (0.7 + r() * 0.5), cols[(r() * 4) | 0], 'rgba(30,60,20,0.7)'); } }
    for (let k = 0; k < 4; k++) leaf(g, 30 + r() * 200, h, 40 + r() * 20, 90 + r() * 30, (r() - 0.5) * 1.2, '#4a7a3a', 'rgba(30,60,20,0.8)');
  });
  def('pFern', 256, 192, 'alpha', (g, w, h, r) => {                                   // ferns (Dryopteris): arching pinnate fronds
    for (let k = 0; k < 7; k++) { const x0 = 128 + (r() - 0.5) * 60, a = -Math.PI / 2 + (k - 3) * 0.32 + (r() - 0.5) * 0.15, len = 110 + r() * 60; g.strokeStyle = '#3d6a2e'; g.lineWidth = 2.2; g.beginPath(); const pts = []; for (let t = 0; t <= 1.01; t += 0.1) { const px = x0 + Math.cos(a) * len * t + (k - 3) * 26 * t * t, py = h - Math.sin(-a) * len * t * (1 - 0.25 * t) + 60 * t * t * (Math.abs(k - 3) / 3); pts.push([px, py]); } g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.stroke(); for (let i = 1; i < pts.length - 1; i++) { const [px, py] = pts[i], s = (1 - i / pts.length) * 24 + 4; g.fillStyle = i % 2 ? '#4a7a3a' : '#568a42'; g.beginPath(); g.ellipse(px - s * 0.6, py - 2, s, 3.2, -0.5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(px + s * 0.6, py - 2, s, 3.2, 0.5, 0, TAU); g.fill(); } }
  });
  def('pTuft', 256, 128, 'alpha', (g, w, h, r) => {                                   // grass tuft and trampled blades at an alley edge
    for (let k = 0; k < 46; k++) { const x = r() * w, hh = 30 + r() * 80, lean = (r() - 0.5) * 40; g.strokeStyle = ['#7aa24a', '#5f8a3a', '#86ac45', '#6f9a36'][(r() * 4) | 0]; g.lineWidth = 2 + r() * 2; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + lean * 0.4, h - hh * 0.6, x + lean, h - hh); g.stroke(); }
  });
  const bloom = (g, x, y, rad, c1, c2) => { for (let i = 0; i < 9; i++) { const a = i * TAU / 9; g.fillStyle = i % 2 ? c1 : c2; g.beginPath(); g.ellipse(x + Math.cos(a) * rad * 0.55, y + Math.sin(a) * rad * 0.55, rad * 0.5, rad * 0.32, a, 0, TAU); g.fill(); } g.fillStyle = c2; ball(g, x, y, rad * 0.32); };
  def('bqA', 160, 128, 'alpha', (g, w, h, r) => {                                     // plastic carnations: pink / magenta / white on green stems
    for (let k = 0; k < 7; k++) { const x = 30 + r() * 100, y = 18 + r() * 40; g.strokeStyle = '#3f7a34'; g.lineWidth = 3; g.beginPath(); g.moveTo(80, h); g.lineTo(x, y + 12); g.stroke(); bloom(g, x, y, 14 + r() * 5, ['#d56a9a', '#c63d8e', '#f1efe9', '#e8a0c0'][(r() * 4) | 0], '#a8286a'); }
  });
  def('bqB', 160, 128, 'alpha', (g, w, h, r) => {                                     // red roses and yellow chrysanthemums
    for (let k = 0; k < 7; k++) { const x = 30 + r() * 100, y = 18 + r() * 40; g.strokeStyle = '#3f7a34'; g.lineWidth = 3; g.beginPath(); g.moveTo(80, h); g.lineTo(x, y + 12); g.stroke(); const c = [['#d22a22', '#8c1612'], ['#e8c21a', '#b8860a'], ['#f08a1c', '#a8520a'], ['#f2f2ea', '#c8c8b0']][(r() * 4) | 0]; bloom(g, x, y, 12 + r() * 6, c[0], c[1]); }
  });
  def('wreath', 128, 160, 'alpha', (g, w, h, r) => {                                  // a dark green wreath with a ribbon, on a stand
    g.strokeStyle = '#8a6a46'; g.lineWidth = 4; g.beginPath(); g.moveTo(64, h); g.lineTo(64, 110); g.stroke();
    for (let i = 0; i < 60; i++) { const a = i / 60 * TAU; g.fillStyle = ['#2f5a2a', '#3f7a34', '#274a24'][i % 3]; g.beginPath(); g.ellipse(64 + Math.cos(a) * 44, 62 + Math.sin(a) * 44, 11, 6, a + 1.4, 0, TAU); g.fill(); }
    g.fillStyle = '#e8e4d8'; g.fillRect(56, 100, 16, 36); g.fillStyle = '#c8202a'; g.fillRect(58, 118, 12, 4); for (let i = 0; i < 6; i++) bloom(g, 64 + Math.cos(i * 1.2) * 44, 62 + Math.sin(i * 1.2) * 44, 7, '#f1efe9', '#e8c21a');
  });
  def('candle', 64, 96, 'alpha', (g, w, h, r) => {                                    // a glass grave lamp with a brass lid and a flame (amber)
    g.fillStyle = '#b8860a'; g.fillRect(16, 10, 32, 10); g.fillStyle = '#c9421a'; g.beginPath(); g.moveTo(14, 20); g.lineTo(50, 20); g.lineTo(46, 88); g.lineTo(18, 88); g.closePath(); g.fill();
    g.fillStyle = '#ffd890'; g.beginPath(); g.ellipse(32, 56, 7, 12, 0, 0, TAU); g.fill();
  });
  // flat bed fills (a horizontal card lying on the grave: soil with leaf litter, white marble chips, trimmed lawn, herringbone pavers)
  def('cSoil', 256, 256, 'alpha', (g, w, h, r) => {
    g.fillStyle = '#4d3223'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { g.fillStyle = ['#644432', '#3a2518', '#936f5e', '#7a5a3a', '#c8782a', '#a89040'][(r() * 6) | 0]; g.globalAlpha = 0.5 + r() * 0.5; g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * 9, 2 + r() * 5, r() * 3, 0, TAU); g.fill(); }
    g.globalAlpha = 1; for (let i = 0; i < 12; i++) { g.fillStyle = '#6c8b54'; g.beginPath(); g.ellipse(r() * w, r() * h, 5, 3, r() * 3, 0, TAU); g.fill(); }
  });
  def('cGravel', 256, 256, 'alpha', (g, w, h, r) => {
    g.fillStyle = '#d8d6d0'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) { const v = 190 + r() * 60 | 0; g.fillStyle = `rgb(${v},${v - 2},${v - 8})`; g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 4, 1.5 + r() * 3, r() * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(80,70,60,0.35)'; g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * 3, 0, TAU); g.fill(); }
  });
  def('cGrass', 256, 256, 'alpha', (g, w, h, r) => {
    g.fillStyle = '#5f8f2a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.strokeStyle = ['#7aa24a', '#4f7a2e', '#86ac45', '#6f9a36'][(r() * 4) | 0]; g.lineWidth = 1.5; const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y - 5 - r() * 8); g.stroke(); }
    for (let i = 0; i < 14; i++) { g.fillStyle = r() < 0.5 ? '#f2e8a0' : '#f4f2ee'; ball(g, r() * w, r() * h, 2.2); }
  });
  def('cPaver', 256, 256, 'alpha', (g, w, h, r) => {                                  // herringbone pavers 0.2 x 0.1 m on a 1.2 m tile
    g.fillStyle = '#6a6460'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 12; j++) for (let i = -1; i < 12; i++) { const v = 150 + r() * 50 | 0, k = (i + j) % 2; g.fillStyle = `rgb(${v},${v - 12},${v - 20})`; if (k) g.fillRect(i * 21 + 1, j * 21 + 1, 19, 9); else g.fillRect(i * 21 + 1, j * 21 + 11, 19, 9); }
  });
  def('cMoss', 256, 128, 'alpha', (g, w, h, r) => {                                   // a strip of moss and leaf litter along a kerb / the foot of a stone
    for (let i = 0; i < 110; i++) { g.fillStyle = ['#83983e', '#6a7d2e', '#9aae4a', '#5a6a28'][(r() * 4) | 0]; g.globalAlpha = 0.7 + r() * 0.3; g.beginPath(); g.ellipse(r() * w, h - r() * r() * h, 4 + r() * 12, 3 + r() * 6, r() * 3, 0, TAU); g.fill(); }
  });

  // cobble-faced concrete tub sides (K1): flat white-grey cobbles on grey mortar, a pale rim, moss at the foot and along the top; the festoon variant carries a garland relief (one panel = 1.2 x 0.4 m)
  const cobbles = (g, w, h, r) => {
    g.fillStyle = '#767672'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 17) for (let x = -8 + ((y / 17) % 2) * 11; x < w; x += 22) { const v = 168 + r() * 70 | 0; g.fillStyle = `rgb(${v},${v - 3},${v - 9})`; g.beginPath(); g.ellipse(x + 10 + r() * 3, y + 8, 9 + r() * 2.5, 6.5 + r() * 1.5, (r() - 0.5) * 0.3, 0, TAU); g.fill(); }
    g.fillStyle = '#d6d4cc'; g.fillRect(0, 0, w, 7);
    for (let i = 0; i < 36; i++) { g.fillStyle = ['#83983e', '#6a7d2e', '#9aae4a'][(r() * 3) | 0]; g.globalAlpha = 0.6 + r() * 0.4; g.beginPath(); g.ellipse(r() * w, (r() < 0.7 ? h - r() * r() * h * 0.45 : r() * 12), 4 + r() * 11, 3 + r() * 6, r() * 3, 0, TAU); g.fill(); } g.globalAlpha = 1;
  };
  def('cCobble', 256, 82, 'alpha', cobbles);
  def('cFestoon', 256, 82, 'alpha', (g, w, h, r) => { cobbles(g, w, h, r); g.strokeStyle = '#ecebe4'; g.lineWidth = 5; g.fillStyle = '#ecebe4'; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(k * 86 + 4, 14); g.quadraticCurveTo(k * 86 + 43, 62, k * 86 + 82, 14); g.stroke(); g.fillRect(k * 86 + 40, 46, 6, 20); } g.strokeStyle = 'rgba(60,60,56,0.5)'; g.lineWidth = 2; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(k * 86 + 4, 20); g.quadraticCurveTo(k * 86 + 43, 68, k * 86 + 82, 20); g.stroke(); } });

  // ------------------------------------------------------------------------------------------------ stone cells: R = grain, G = engraving, B = moss / lichen
  const stoneBase = (g, w, h, r, base = 205, amp = 26, coarse = 0) => {
    g.fillStyle = `rgb(${base},0,0)`; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const v = Math.max(0, Math.min(255, base + (r() - 0.5) * 2 * amp)) | 0; g.fillStyle = `rgba(${v},0,0,0.55)`; const s = 1 + r() * (2 + coarse); g.fillRect(r() * w, r() * h, s, s); }
  };
  const addCh = (g, fn) => { g.save(); g.globalCompositeOperation = 'lighter'; fn(); g.restore(); };
  const moss = (g, w, h, r, n = 26, low = true) => addCh(g, () => { for (let i = 0; i < n; i++) { const y = low ? h - r() * r() * h * 0.5 : r() * h; g.fillStyle = `rgba(0,0,${120 + r() * 120 | 0},${0.5 + r() * 0.5})`; g.beginPath(); g.ellipse(r() * w, y, 3 + r() * 11, 2 + r() * 6, r() * 3, 0, TAU); g.fill(); } for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(0,0,150,0.7)'; g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * 5, 0, TAU); g.fill(); } });
  const eng = (g, fn) => addCh(g, () => { g.strokeStyle = 'rgb(0,255,0)'; g.fillStyle = 'rgb(0,255,0)'; g.lineWidth = 3; fn(); });
  const stone = (name, paint, o = {}) => def(name, 200, 200, 'stone', (g, w0, h0, r) => { g.scale(w0 / 256, h0 / 256); const w = 256, h = 256; stoneBase(g, w, h, r, o.base, o.amp, o.coarse); paint(g, w, h, r); if (o.moss !== false) moss(g, w, h, r, o.mossN); });
  const FW = 200, FH = 256;                                                            // the face region of a stone cell: 0 .. 200 px (78 %)
  const cross8 = (g, cx, cy, s) => { g.fillRect(cx - 3 * s, cy - 24 * s, 6 * s, 56 * s); g.fillRect(cx - 14 * s, cy - 10 * s, 28 * s, 5 * s); g.fillRect(cx - 9 * s, cy - 20 * s, 18 * s, 4 * s); g.save(); g.translate(cx, cy + 24 * s); g.rotate(-0.25); g.fillRect(-9 * s, -2.5 * s, 18 * s, 5 * s); g.restore(); };
  stone('sPlain', () => {});
  stone('sCross', (g, w, h) => eng(g, () => { g.strokeRect(14, 14, FW - 28, FH - 28); cross8(g, FW / 2, FH * 0.44, 2.4); g.lineWidth = 2; g.strokeRect(22, 22, FW - 44, FH - 44); }));
  stone('sOval', (g, w, h) => eng(g, () => { g.strokeRect(12, 12, FW - 24, FH - 24); g.lineWidth = 4; g.beginPath(); g.ellipse(FW / 2, 92, 38, 52, 0, 0, TAU); g.stroke(); g.lineWidth = 2; g.beginPath(); g.ellipse(FW / 2, 92, 32, 46, 0, 0, TAU); g.stroke(); cross8(g, FW / 2, 188, 1.3); }));
  stone('sBorder', (g, w, h, r) => eng(g, () => { g.strokeRect(14, 14, FW - 28, FH - 28); g.lineWidth = 2; for (let y = 120; y < 220; y += 16) { let x = 34; while (x < FW - 40) { const l = 5 + r() * 14; g.fillRect(x, y, l, 3); x += l + 4 + r() * 4; } } cross8(g, FW / 2, 68, 1.4); }));
  stone('sDado', (g, w, h) => { addCh(g, () => { g.fillStyle = 'rgba(0,0,0,0)'; }); g.fillStyle = 'rgba(150,0,0,0.5)'; g.fillRect(24, 40, FW - 48, FH - 80); eng(g, () => { g.lineWidth = 3; g.beginPath(); g.moveTo(24 + 10, 40); g.lineTo(FW - 34, 40); g.lineTo(FW - 24, 50); g.lineTo(FW - 24, FH - 50); g.lineTo(FW - 34, FH - 40); g.lineTo(34, FH - 40); g.lineTo(24, FH - 50); g.lineTo(24, 50); g.closePath(); g.stroke(); }); });
  stone('sCobble', (g, w, h, r) => {
    g.fillStyle = 'rgb(105,0,0)'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 22) for (let x = -10 + ((y / 22) % 2) * 14; x < w; x += 28) { const v = 150 + r() * 90 | 0; g.fillStyle = `rgb(${v},0,0)`; g.beginPath(); g.ellipse(x + 12 + r() * 3, y + 10, 11 + r() * 3, 8 + r() * 2, (r() - 0.5) * 0.3, 0, TAU); g.fill(); }
  }, { moss: true, mossN: 40 });
  stone('sFestoon', (g, w, h, r) => {
    g.fillStyle = 'rgb(120,0,0)'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 22) for (let x = -10 + ((y / 22) % 2) * 14; x < w; x += 28) { const v = 150 + r() * 80 | 0; g.fillStyle = `rgb(${v},0,0)`; g.beginPath(); g.ellipse(x + 12, y + 10, 11, 8, 0, 0, TAU); g.fill(); }
    eng(g, () => { g.lineWidth = 5; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(k * 70 - 4, 50); g.quadraticCurveTo(k * 70 + 31, 130, k * 70 + 66, 50); g.stroke(); g.fillRect(k * 70 + 28, 112, 6, 22); } });
  });
  stone('sKerb', () => {}, { base: 190, amp: 40, coarse: 3, moss: true, mossN: 14 });
  stone('sMarble', (g, w, h, r) => { g.fillStyle = 'rgba(0,0,0,0)'; for (let k = 0; k < 6; k++) { g.strokeStyle = `rgba(${150 + r() * 40 | 0},0,0,0.5)`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(r() * w, 0); g.bezierCurveTo(r() * w, h * 0.3, r() * w, h * 0.6, r() * w, h); g.stroke(); } }, { base: 238, amp: 10 });
  stone('sDrape', (g, w, h, r) => { for (let x = 6; x < FW; x += 14) { g.fillStyle = `rgba(${150 + r() * 60 | 0},0,0,0.55)`; g.fillRect(x, 0, 6 + r() * 4, h); } eng(g, () => { for (let x = 20; x < FW - 10; x += 36) g.fillRect(x, FH - 36, 5, 28); }); });
  stone('sGothic', (g, w, h) => eng(g, () => { g.lineWidth = 4; g.beginPath(); g.moveTo(24, FH - 20); g.lineTo(24, 120); g.quadraticCurveTo(26, 60, FW / 2, 24); g.quadraticCurveTo(FW - 26, 60, FW - 24, 120); g.lineTo(FW - 24, FH - 20); g.stroke(); g.beginPath(); g.arc(FW / 2, 108, 24, 0, TAU); g.stroke(); for (const dx of [-26, 26]) { g.beginPath(); g.arc(FW / 2 + dx, 138, 14, 0, TAU); g.stroke(); } }));
  stone('sAedi', (g, w, h) => { g.fillStyle = 'rgba(150,0,0,0.55)'; g.beginPath(); g.moveTo(40, FH); g.lineTo(40, 110); g.arc(FW / 2, 110, FW / 2 - 40, Math.PI, 0); g.lineTo(FW - 40, FH); g.fill(); eng(g, () => { g.lineWidth = 4; g.beginPath(); g.moveTo(34, FH); g.lineTo(34, 110); g.arc(FW / 2, 110, FW / 2 - 34, Math.PI, 0); g.lineTo(FW - 34, FH); g.stroke(); }); }, { base: 224, amp: 14 });
  stone('sRust', (g, w, h, r) => { for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${150 + r() * 80 | 0},0,0,0.5)`; g.beginPath(); g.ellipse(r() * w, r() * h, 8 + r() * 30, 6 + r() * 18, r() * 3, 0, TAU); g.fill(); } }, { base: 200, amp: 30, coarse: 4, moss: true, mossN: 40 });
  stone('sSoviet', (g, w, h, r) => { for (let i = 0; i < 420; i++) { const v = 130 + r() * 110 | 0; g.fillStyle = `rgb(${v},0,0)`; g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * 5, 2 + r() * 3.5, r() * 3, 0, TAU); g.fill(); } eng(g, () => { g.lineWidth = 2; g.strokeRect(20, 20, FW - 40, FH - 40); g.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU * 2 / 5; const x = FW / 2 + Math.cos(a) * 30, y = 110 + Math.sin(a) * 30; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.fill(); }); });

  // ------------------------------------------------------------------------------------------------ pack and paint
  const cells = {}, mode = {};
  const tex = ctx.tex.draw(SZ, SZ, (g) => {
    const order = defs.slice().sort((a, b) => b.h - a.h || b.w - a.w);
    let x = 0, y = 0, rowH = 0, over = 0;
    for (const d of order) {
      const cw = d.w + 2 * PAD, ch = d.h + 2 * PAD;
      if (x + cw > SZ) { x = 0; y += rowH; rowH = 0; }
      rowH = Math.max(rowH, ch);
      if (y + ch > SZ) { over++; continue; }
      const ix = x + PAD, iy = y + PAD;
      g.save(); g.translate(ix, iy); g.beginPath(); g.rect(0, 0, d.w, d.h); g.clip();
      d.paint(g, d.w, d.h, ctx.rng('lmdek-atlas-' + d.name)); g.restore();
      const rep = (sx, sy, sw, sh, dx, dy, dw, dh) => g.drawImage(g.canvas, sx, sy, sw, sh, dx, dy, dw, dh);
      rep(ix, iy, 1, d.h, ix - PAD, iy, PAD, d.h); rep(ix + d.w - 1, iy, 1, d.h, ix + d.w, iy, PAD, d.h);
      rep(ix - PAD, iy, d.w + 2 * PAD, 1, ix - PAD, iy - PAD, d.w + 2 * PAD, PAD); rep(ix - PAD, iy + d.h - 1, d.w + 2 * PAD, 1, ix - PAD, iy + d.h, d.w + 2 * PAD, PAD);
      cells[d.name] = { u0: ix / SZ, v0: 1 - (iy + d.h) / SZ, du: d.w / SZ, dv: d.h / SZ, px: [ix, iy, d.w, d.h] };
      mode[d.name] = d.mode;
      x += cw;
    }
    if (over) console.warn(`[landmarksDekabristov] atlas: ${over} cells did not fit (used height ${y + rowH})`);
  }, { key: 'lmdek-detailAtlas', anisotropy: 8 });
  return { tex, cells, mode, size: SZ };
}
