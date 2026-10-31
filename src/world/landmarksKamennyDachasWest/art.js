// landmarksKamennyDachasWest/art.js - the canvas paintings of the module (every key starts with 'lmkdw-': the texture cache is scene-wide).  Dossier docs/research/kamenny-2026.md 5.4 and the BUILD LOG, photos V02..V08 (Polovtsov),
// G01..G12 (Gauswald), F01..F12 (Follenweider).  All tiling textures are NEUTRAL (the material colour tints them) except the two-colour ones (half-timber fields, brick, pier brick).
//   stucco / rough / plaster-like walls; clap = clapboard (tile 1.6 m); halfG = pale-green half-timber field with dark members (tile 2.7 m); brickBuff / pierBrick; tile = pan tiles (1.5 m); copper = standing seam (1.2 m);
//   slate = scale slates; stone = granite / limestone courses; dentil = the dentil band.
//   win atlas: windows (decals / panes);  cut atlas: iron fences, gate leaves, balcony railings, fretwork (alpha cut-outs, tinted per cell).
const TAU = Math.PI * 2;
export const COL = {
  stucco: '#ecebe3', white: '#f3f1ea', copper: '#86b79c', roseGranite: '#b39a92', iron: '#202427', shade: '#cfcdc2',
  clap: '#b9cca0', greenD: '#70895a', tileG: '#bd4c37', brickBuff: '#dfc78c', limestone: '#d3cab3', slateD: '#4b4e56',
  rough: '#eeeadf', tileF: '#d9592f', graniteF: '#6a6c70', woodD: '#3b332d',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {};
  const D = (w, h, fn, key, o = {}) => tex.draw(w, h, fn, { key: 'lmkdw-' + key, repeat: [1, 1], ...o });
  const R = (seed) => ctx.rng(seed);
  const speckle = (g, w, h, seed, n, a = 0.1, size = 2.5) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '60,50,40'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * size, 1 + r() * size); } };

  // ------------------------------------------------------------------------------------------ walls and roofs
  A.stucco = D(256, 256, (g, w, h) => {
    const r = R(9201);
    g.fillStyle = '#f7f6f2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const s = 18 + r() * 50; g.fillStyle = `rgba(${r() < 0.5 ? '205,204,196' : '255,255,255'},${0.05 + r() * 0.06})`; g.beginPath(); g.ellipse(r() * w, r() * h, s, s * (0.5 + r() * 0.6), r() * TAU, 0, TAU); g.fill(); }
    speckle(g, w, h, 9202, 300, 0.04, 2);
  }, 'stucco');
  A.clap = D(256, 256, (g, w, h) => {                                     // 12 boards of 0.133 m per 1.6 m tile
    const r = R(9221), rows = 12, rh = h / rows;
    for (let j = 0; j < rows; j++) {
      const v = 0.94 + r() * 0.08, y = j * rh;
      g.fillStyle = `rgb(${244 * v | 0},${246 * v | 0},${238 * v | 0})`; g.fillRect(0, y, w, rh);
      g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(0, y, w, 2);
      g.fillStyle = 'rgba(40,60,30,0.38)'; g.fillRect(0, y + rh - 3, w, 3);
      if (r() < 0.25) { g.fillStyle = 'rgba(60,70,40,0.25)'; g.fillRect(r() * w, y + 2, 2, rh - 4); }
    }
  }, 'clap');
  A.halfG = D(256, 256, (g, w, h) => {                                    // the gable field: pale green panels, dark-green members (14 px = 0.15 m)
    g.fillStyle = '#d4e1ba'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e4eccf'; g.fillRect(8, 8, w - 16, 6);
    g.fillStyle = '#738f58';
    const b = 15; g.fillRect(0, 0, b, h); g.fillRect(w - b, 0, b, h); g.fillRect(w / 2 - b / 2, 0, b, h); g.fillRect(0, 0, w, b); g.fillRect(0, h - b, w, b); g.fillRect(0, h * 0.42, w, b);
    g.fillStyle = 'rgba(30,50,20,0.25)'; g.fillRect(b, b, w - 2 * b, 3);
  }, 'halfG');
  A.brickBuff = D(256, 256, (g, w, h) => {                                // buff brick (Gauswald wing and tower): 16 courses per 1.5 m
    const r = R(9231), rows = 16, rh = h / rows, bw = w / 6;
    g.fillStyle = '#c9b585'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < rows; j++) for (let i = -1; i < 7; i++) {
      const x = i * bw + (j % 2) * bw / 2, v = 0.95 + r() * 0.1;
      g.fillStyle = `rgb(${232 * v | 0},${208 * v | 0},${150 * v | 0})`; g.fillRect(x + 1.5, j * rh + 1.2, bw - 3, rh - 2.4);
    }
  }, 'brickBuff');
  A.pierBrick = D(128, 128, (g, w, h) => {                                // the red gate piers with the buff zig-zag ribbons (G04 G07 G12)
    const r = R(9241), rows = 8, rh = h / rows, bw = w / 4;
    g.fillStyle = '#d8c694'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < rows; j++) for (let i = -1; i < 5; i++) {
      const x = i * bw + (j % 2) * bw / 2, idx = ((i + 40) % 4), buff = (j % 4 === 0) || ((j + idx) % 4 === 0 && idx < 2);
      const v = 0.95 + r() * 0.1;
      g.fillStyle = buff ? `rgb(${236 * v | 0},${216 * v | 0},${160 * v | 0})` : `rgb(${176 * v | 0},${72 * v | 0},${46 * v | 0})`; g.fillRect(x + 1, j * rh + 1, bw - 2, rh - 2);
    }
  }, 'pierBrick');
  A.tile = D(256, 256, (g, w, h) => {                                     // pan tiles: 6 rows, 4 tiles per row, a groove and a shadow edge
    const r = R(9251), rows = 6, rh = h / rows, tw = w / 4;
    g.fillStyle = '#6a6a66'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < rows; j++) for (let i = -1; i < 5; i++) {
      const x = i * tw + (j % 2) * tw / 2, v = 0.9 + r() * 0.2;
      g.fillStyle = `rgb(${232 * v | 0},${226 * v | 0},${220 * v | 0})`; g.fillRect(x + 1.5, j * rh, tw - 3, rh - 2);
      g.fillStyle = 'rgba(50,30,30,0.28)'; g.fillRect(x + tw / 2 - 1.5, j * rh, 3, rh - 2); g.fillStyle = 'rgba(30,20,20,0.4)'; g.fillRect(x + 1.5, j * rh + rh - 5, tw - 3, 3);
    }
  }, 'tile');
  A.copper = D(256, 256, (g, w, h) => {                                   // standing seams every 0.6 m (1.2 m tile)
    const r = R(9261);
    g.fillStyle = '#eef3ef'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) { g.fillStyle = 'rgba(60,90,76,0.5)'; g.fillRect(i * 128, 0, 4, h); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(i * 128 + 4, 0, 3, h); g.fillStyle = `rgba(255,255,255,${0.06 + r() * 0.06})`; g.fillRect(i * 128 + 9, 0, 110, h); }
    g.fillStyle = 'rgba(60,90,76,0.25)'; g.fillRect(0, 128, w, 3); speckle(g, w, h, 9262, 160, 0.06, 2);
  }, 'copper');
  A.slate = D(256, 256, (g, w, h) => {                                    // scale slates of the Gauswald tower (G03 G05)
    const r = R(9271), n = 10, s = w / n;
    g.fillStyle = '#c8cacc'; g.fillRect(0, 0, w, h);
    for (let j = -1; j < n * 2 + 1; j++) for (let i = -1; i < n + 1; i++) {
      const cx = i * s + (j % 2) * s / 2, cy = j * s * 0.5, v = 0.88 + r() * 0.2;
      g.fillStyle = `rgb(${236 * v | 0},${238 * v | 0},${242 * v | 0})`;
      g.beginPath(); g.moveTo(cx, cy - s * 0.5); g.lineTo(cx + s * 0.5, cy); g.lineTo(cx, cy + s * 0.5); g.lineTo(cx - s * 0.5, cy); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(30,32,38,0.5)'; g.lineWidth = 1.3; g.stroke();
    }
  }, 'slate');
  A.stone = D(256, 256, (g, w, h) => {                                    // granite / limestone courses (0.3 m per course, tile 1.8 m)
    const r = R(9281), ch = h / 6;
    g.fillStyle = '#9d9d96'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 6; k++) {
      let x = -((k * 53) % 90);
      while (x < w) {
        const bw = 70 + ((k * 7 + Math.floor(x)) % 4) * 26, v = 0.92 + r() * 0.14;
        g.fillStyle = `rgb(${232 * v | 0},${232 * v | 0},${226 * v | 0})`; g.fillRect(x + 1.5, k * ch + 1.5, bw - 3, ch - 3);
        for (let i = 0; i < 3; i++) { g.fillStyle = `rgba(70,76,66,${0.05 + r() * 0.08})`; g.fillRect(x + r() * bw * 0.8, k * ch + r() * ch, 14 + r() * 40, 1.4); }
        x += bw;
      }
    }
    speckle(g, w, h, 9282, 600, 0.08, 3);
  }, 'stone', { anisotropy: 6 });
  A.rock = D(256, 256, (g, w, h) => {                                     // the rough-hewn dark granite blocks of the Follenweider gate piers and plinth (F07)
    const r = R(9291), ch = h / 4;
    g.fillStyle = '#6e7072'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 4; k++) {
      let x = -((k * 61) % 100);
      while (x < w) {
        const bw = 80 + ((k * 5 + Math.floor(x)) % 3) * 36, v = 0.82 + r() * 0.3;
        g.fillStyle = `rgb(${200 * v | 0},${202 * v | 0},${206 * v | 0})`; g.beginPath(); g.moveTo(x + 4, k * ch + 4); g.lineTo(x + bw - 5, k * ch + 2); g.lineTo(x + bw - 3, k * ch + ch - 4); g.lineTo(x + 3, k * ch + ch - 2); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 6, k * ch + 5, bw - 14, 3);
        x += bw;
      }
    }
    speckle(g, w, h, 9292, 500, 0.1, 3);
  }, 'rock');
  A.dentil = D(256, 32, (g, w, h) => {
    g.fillStyle = '#d4cfc0'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) { g.fillStyle = '#f6f3eb'; g.fillRect(i * w / 3 + w / 12, 0, w / 6, h); g.fillStyle = 'rgba(120,112,92,0.35)'; g.fillRect(i * w / 3 + w / 12 + w / 6 - 3, 0, 3, h); }
  }, 'dentil');
  A.plain = D(64, 64, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); speckle(g, w, h, 9295, 60, 0.04, 2); }, 'plain');

  // ------------------------------------------------------------------------------------------ the cells
  const cells = {};
  const cell = (name, w, h, fn) => { cells[name] = [w, h, fn]; };
  const glass = (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#5f7482'); gr.addColorStop(0.5, '#2f3d4a'); gr.addColorStop(1, '#4a5a68');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(176,200,214,0.22)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.7, 0); g.lineTo(w * 0.1, h * 0.55); g.lineTo(0, h * 0.55); g.fill();
  };
  const line = (g, x0, y0, x1, y1, lw) => { g.lineWidth = lw; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  const WH = '#eef2ee';
  /** Polovtsov: the slender window 0.9 x 3.3 m: two leaves, seven rows of panes (V08 V04) */
  cell('winP', 72, 264, (g, w, h) => { glass(g, w, h); g.strokeStyle = WH; g.lineWidth = 7; g.strokeRect(3.5, 3.5, w - 7, h - 7); line(g, w / 2, 0, w / 2, h, 5); for (let i = 1; i < 7; i++) line(g, 0, i * h / 7, w, i * h / 7, 3.5); });
  /** Polovtsov: the glazed bay: one bay 2.6 x 7.0 m between two columns: 5 x 14 panes with green-white muntins (V05 V08 V09) */
  cell('winBay', 130, 350, (g, w, h) => { glass(g, w, h); g.strokeStyle = '#dfe8d8'; g.lineWidth = 4; for (let i = 1; i < 5; i++) line(g, i * w / 5, 0, i * w / 5, h, 3.4); for (let j = 1; j < 14; j++) line(g, 0, j * h / 14, w, j * h / 14, 3); g.lineWidth = 7; g.strokeRect(3.5, 3.5, w - 7, h - 7); line(g, 0, h * 0.14, w, h * 0.14, 6); });
  /** a plain dark door 2.2 x 3.6 m with a fanlight line (Polovtsov portico) */
  cell('doorP', 110, 180, (g, w, h) => { g.fillStyle = '#4b3a2c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2e2218'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4); line(g, w / 2, 0, w / 2, h, 4); for (const k of [0, 1]) { g.strokeRect(k * w / 2 + 9, 14, w / 2 - 18, h * 0.42); g.strokeRect(k * w / 2 + 9, h * 0.52, w / 2 - 18, h * 0.4); } g.fillStyle = '#b9984a'; g.fillRect(w / 2 - 8, h * 0.5, 4, 14); g.fillRect(w / 2 + 4, h * 0.5, 4, 14); });
  /** Gauswald: the ordinary window 1.1 x 1.5 m (white sashes, two over three panes) */
  cell('winG1', 88, 120, (g, w, h) => { glass(g, w, h); g.strokeStyle = WH; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); line(g, w / 2, 0, w / 2, h, 6); line(g, 0, h * 0.34, w, h * 0.34, 5); line(g, 0, h * 0.67, w, h * 0.67, 3.5); });
  /** Gauswald: the big window 1.9 x 2.2 m: three sashes, four rows */
  cell('winG2', 152, 176, (g, w, h) => { glass(g, w, h); g.strokeStyle = WH; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); for (let i = 1; i < 3; i++) line(g, i * w / 3, 0, i * w / 3, h, 6); for (let j = 1; j < 4; j++) line(g, 0, j * h / 4, w, j * h / 4, 3.5); });
  /** Gauswald: the half-round lattice window of the bay 2.8 x 1.5 m (G01 G03) */
  cell('winHalf', 224, 120, (g, w, h) => { glass(g, w, h); g.strokeStyle = WH; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); for (let i = 1; i < 9; i++) line(g, i * w / 9, 0, i * w / 9, h, 3.5); for (let j = 1; j < 4; j++) line(g, 0, j * h / 4, w, j * h / 4, 3.5); });
  /** a small arched window 0.8 x 1.4 m (tower, gable): the head is cut by the polygon, the cell is the rectangle */
  cell('winArch', 64, 112, (g, w, h) => { glass(g, w, h); g.strokeStyle = WH; g.lineWidth = 7; g.strokeRect(3.5, 3.5, w - 7, h - 7); line(g, w / 2, 0, w / 2, h, 5); line(g, 0, h * 0.4, w, h * 0.4, 4); line(g, 0, h * 0.7, w, h * 0.7, 3.5); });
  /** the entrance door of the brick wing 1.5 x 2.4 m: dark red-brown double leaf with a wrought ornament (G03) */
  cell('doorG', 96, 154, (g, w, h) => { g.fillStyle = '#6a2f22'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a1810'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4); line(g, w / 2, 0, w / 2, h, 4); for (const k of [0, 1]) { g.strokeRect(k * w / 2 + 8, 12, w / 2 - 16, h * 0.4); g.strokeRect(k * w / 2 + 8, h * 0.52, w / 2 - 16, h * 0.4); } g.fillStyle = '#c9a548'; g.fillRect(w / 2 - 8, h * 0.5, 4, 12); g.fillRect(w / 2 + 4, h * 0.5, 4, 12); });
  /** Follenweider: the window 1.1 x 1.5 m with black frames (two over three panes) (F07) */
  cell('winF1', 88, 120, (g, w, h) => { glass(g, w, h); g.strokeStyle = '#1e2124'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); line(g, w / 2, 0, w / 2, h, 5); line(g, 0, h * 0.34, w, h * 0.34, 5); line(g, 0, h * 0.67, w, h * 0.67, 3.5); });
  /** Follenweider: the slit window 0.5 x 2.1 m: black frame, three transoms */
  cell('winSlit', 40, 168, (g, w, h) => { glass(g, w, h); g.strokeStyle = '#1e2124'; g.lineWidth = 7; g.strokeRect(3.5, 3.5, w - 7, h - 7); line(g, w / 2, 0, w / 2, h, 4); for (let j = 1; j < 6; j++) line(g, 0, j * h / 6, w, j * h / 6, 3.5); });
  /** Follenweider: the wide window 2.0 x 1.7 m of the dark half-timber lucarne: a row of five lights */
  cell('winRow', 160, 136, (g, w, h) => { glass(g, w, h); g.strokeStyle = '#26211e'; g.lineWidth = 7; g.strokeRect(3.5, 3.5, w - 7, h - 7); for (let i = 1; i < 5; i++) line(g, i * w / 5, 0, i * w / 5, h, 4.5); line(g, 0, h * 0.4, w, h * 0.4, 5); });

  // ironwork: alpha cut-outs, tinted per cell
  const spear = (g, x, y, hw, hh) => { g.beginPath(); g.moveTo(x - hw, y); g.lineTo(x, y - hh); g.lineTo(x + hw, y); g.closePath(); g.fill(); };
  /** Polovtsov fence bay 2.0 x 2.0 m: 16 spear-headed bars, two rails, a row of rainbow arcs under the tips and a row of rings along the foot (V05 V08) */
  cell('fenceP', 256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'butt';
    const n = 16, step = w / n;
    for (let i = 0; i < n; i++) { const x = (i + 0.5) * step; g.fillRect(x - 2.4, 24, 4.8, h - 24); spear(g, x, 26, 5.5, 20); }
    g.fillRect(0, 48, w, 5); g.fillRect(0, h - 40, w, 5); g.fillRect(0, h - 8, w, 8);
    g.lineWidth = 3; for (let i = 0; i < n; i += 2) { g.beginPath(); g.arc(i * step + step, 48, step * 0.95, Math.PI, TAU); g.stroke(); }
    for (let i = 0; i < n; i += 2) { g.beginPath(); g.arc(i * step + step, h - 24, step * 0.9, 0, TAU); g.stroke(); }
  });
  /** the carriage gate leaf 2.1 x 2.2 m of the Polovtsov plot: bars, rails, a central ring and arcs */
  cell('leafP', 192, 200, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'butt';
    const n = 12, step = w / n;
    g.fillRect(0, 22, 8, h - 22); g.fillRect(w - 8, 22, 8, h - 22);
    for (let i = 0; i < n; i++) { const x = (i + 0.5) * step; g.fillRect(x - 2.2, 22, 4.4, h - 22); spear(g, x, 24, 5, 18); }
    g.fillRect(0, 44, w, 5); g.fillRect(0, h - 36, w, 5); g.fillRect(0, h - 8, w, 8);
    g.lineWidth = 3.4; for (let i = 0; i < n; i += 2) { g.beginPath(); g.arc(i * step + step, 44, step * 0.95, Math.PI, TAU); g.stroke(); }
    g.beginPath(); g.arc(w / 2, h * 0.5, 26, 0, TAU); g.stroke();
  });
  /** Gauswald fence bay 2.0 x 1.55 m: pale-green bars with spear tips, a row of C-scroll arcs on top and a lower rail (G05 G07 G12) */
  cell('fenceG', 256, 198, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'round';
    const n = 20, step = w / n;
    for (let i = 0; i < n; i++) { const x = (i + 0.5) * step; g.fillRect(x - 2.2, 34, 4.4, h - 34); if (i % 2 === 0) spear(g, x, 36, 5.5, 22); else spear(g, x, 44, 4, 14); }
    g.fillRect(0, 62, w, 5); g.fillRect(0, h * 0.62, w, 4); g.fillRect(0, h - 8, w, 8);
    g.lineWidth = 3.4; for (let i = 0; i < n; i += 2) { g.beginPath(); g.arc(i * step + step, 62, step * 0.9, Math.PI, TAU); g.stroke(); g.beginPath(); g.moveTo(i * step + step * 0.1, 62); g.quadraticCurveTo(i * step + step * 0.2, 50, i * step + step * 0.45, 54); g.stroke(); }
  });
  /** the Gauswald gate leaf 2.1 x 1.75 m with a scroll panel (G12) */
  cell('leafG', 192, 160, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'round';
    const n = 14, step = w / n;
    g.fillRect(0, 26, 8, h - 26); g.fillRect(w - 8, 26, 8, h - 26);
    for (let i = 0; i < n; i++) { const x = (i + 0.5) * step; g.fillRect(x - 2, 26, 4, h - 26); spear(g, x, 28, 5, 18); }
    g.fillRect(0, 52, w, 5); g.fillRect(0, h * 0.64, w, 4); g.fillRect(0, h - 8, w, 8);
    g.lineWidth = 3.4; for (let i = 0; i < n; i += 2) { g.beginPath(); g.arc(i * step + step, 52, step * 0.9, Math.PI, TAU); g.stroke(); }
    g.lineWidth = 4; g.beginPath(); g.moveTo(w * 0.2, h * 0.9); g.bezierCurveTo(w * 0.1, h * 0.7, w * 0.4, h * 0.7, w * 0.4, h * 0.82); g.stroke(); line(g, 0, 56, w, h * 0.9, 5);
  });
  /** Follenweider fence bay 2.0 x 1.9 m: black bars grouped with slot ornaments (F01 F07 F09): square tops, a heavy top rail, bars with long loops */
  cell('fenceF', 256, 243, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'butt';
    const n = 17, step = w / n;
    for (let i = 0; i < n; i++) { const x = (i + 0.5) * step; g.fillRect(x - 3, 18, 6, h - 18); g.clearRect(x - 1, 70, 2, 70); }
    g.fillRect(0, 14, w, 9); g.fillRect(0, h * 0.55, w, 7); g.fillRect(0, h - 10, w, 10);
  });
  /** the Follenweider gate leaf 2.2 x 2.2 m: two pitched leaves (the top of each rises to the middle: drawn as a straight top rail here), bars with slot ornaments */
  cell('leafF', 200, 200, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'butt';
    const n = 13, step = w / n;
    g.fillRect(0, 10, 9, h - 10); g.fillRect(w - 9, 10, 9, h - 10);
    for (let i = 0; i < n; i++) { const x = (i + 0.5) * step; g.fillRect(x - 3, 22, 6, h - 22); g.clearRect(x - 1, 70, 2, 70); }
    g.fillRect(0, 10, w, 9); g.fillRect(0, h * 0.5, w, 6); g.fillRect(0, h - 10, w, 10);
  });
  /** the fretwork balcony bay 2.0 x 0.9 m of the Gauswald porch / side balcony: top rail, X-braced fields (G03 G05) */
  cell('fret', 256, 115, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = 6;
    g.fillRect(0, 0, w, 11); g.fillRect(0, h - 11, w, 11);
    const n = 4, s = w / n; for (let i = 0; i < n; i++) { line(g, i * s + 4, 11, (i + 1) * s - 4, h - 11, 7); line(g, (i + 1) * s - 4, 11, i * s + 4, h - 11, 7); g.fillRect(i * s - 3, 11, 6, h - 22); }
    g.fillRect(w - 3, 11, 3, h - 22);
  });
  /** the black iron balcony railing 2.0 x 1.0 m (Follenweider): rails, bars and rings (F02 F04) */
  cell('balF', 256, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = 4;
    g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8); g.fillRect(0, h * 0.5 - 2, w, 4);
    const n = 20, s = w / n; for (let i = 0; i <= n; i++) g.fillRect(i * s - 1.5, 0, 3, h);
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc((i + 0.5) * w / 5, h * 0.75, 17, 0, TAU); g.stroke(); }
  });
  /** the lattice (trellis) field of the Gauswald bay walls: diagonal slats, 0.6 m tile as a cut-out is not needed: a wall texture instead */
  A.lattice = D(128, 128, (g, w, h) => {
    g.fillStyle = '#9fbc83'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6f8a52'; g.lineWidth = 11; g.lineCap = 'butt';
    for (let i = -2; i < 6; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 + 128, 128); g.stroke(); g.beginPath(); g.moveTo(i * 32 + 128, 0); g.lineTo(i * 32, 128); g.stroke(); }
    g.fillStyle = 'rgba(30,50,20,0.2)'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.0)';
  }, 'lattice');

  // ------------------------------------------------------------------------------------------ atlases
  const pack = (key, W, H, layout, tint = {}) => {
    const uv = {};
    const t = D(W, H, (g) => {
      for (const [name, [x, y]] of Object.entries(layout)) {
        const [w, h, fn] = cells[name];
        g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.translate(x, y); fn(g, w, h); g.restore();
        if (tint[name]) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.globalCompositeOperation = 'source-in'; g.fillStyle = tint[name]; g.fillRect(x, y, w, h); g.restore(); }
        uv[name] = [(x + 1) / W, 1 - (y + h - 1) / H, (x + w - 1) / W, 1 - (y + 1) / H];
      }
    }, key);
    return { tex: t, uv };
  };
  const wn = pack('win', 1024, 640, { winP: [0, 0], winBay: [80, 0], doorP: [220, 0], winG1: [336, 0], winG2: [432, 0], winHalf: [592, 0], winArch: [824, 0], doorG: [900, 0],
    winF1: [0, 360], winSlit: [96, 360], winRow: [144, 360] });
  A.win = wn.tex; A.winUV = wn.uv;
  const ct = pack('cut', 1024, 640, { fenceP: [0, 0], leafP: [264, 0], fenceG: [464, 0], leafG: [728, 0], fenceF: [0, 270], leafF: [264, 270], fret: [472, 270], balF: [736, 270] },
    { fenceP: COL.iron, leafP: COL.iron, fenceG: '#b3caa0', leafG: '#b3caa0', fenceF: COL.iron, leafF: COL.iron, fret: COL.greenD, balF: COL.iron });
  A.cut = ct.tex; A.cutUV = ct.uv;
  return A;
}
