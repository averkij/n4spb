// landmarksBotanicalGarden/art.js - the canvas paintings of the module (dossier docs/research/aptekarsky-2026.md 4.1b, 7; photos 50 49 53 (Institute), 43 (Director's House), 46 (workers' house), 56 (plank bridge),
// 84 (Peter bust), B0 (Stolypin obelisk), D9 (gazebo)).  Every key starts with 'lmbg-' (the texture cache is scene-wide).
//   plaster   neutral stucco (multiplied by the wall colour: ochre / cream / white)        seam   standing-seam sheet-iron roof (red Institute roof, grey zinc roofs)
//   clap      horizontal clapboards (Director's House ochre, workers' house mint)           winI / winIArch / winD   window sheets (u, v 0..1 over the opening)
//   bars      the garden's bar fence (alpha)                                               graniteP / graniteG   pink-grey and grey granite (obelisk, boulder, plinths)
//   bark      the tree-trunk pedestal of the Peter bust                                    slat   bench slats        planks   the weathered planks of the yatsuhashi bridge
//   kawara    grey ceramic roof tiles of the Japanese pavilion                              plateP   the bronze plate of the Peter boulder (Russian text)    plaqueS   the relief plaque of the Stolypin obelisk
const TAU = Math.PI * 2;
export const COL = {
  ochre: '#e3b95a', ochreDark: '#d6a94a', cream: '#eadfc0', white: '#f2eee2', whiteDim: '#e4dfd2', plinth: '#6d6258', granite: '#9b9a95', graniteP: '#b08e86', roofRed: '#a8443b', zinc: '#aeb6bb',
  dirOchre: '#d9b255', workers: '#86b09c', iron: '#25292b', ironL: '#3a4043', slat: '#3f6b4a', bronze: '#5a4b3a', bark: '#8d8b86', frame: '#f1ece0', glass: '#2c3b4a', glassLight: '#7c93a6',
  kawara: '#767f86', timber: '#6b5442', plank: '#8a8274', bed: '#5a432f',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {}, C = COL;
  const D = (w, h, fn, key, repeat = [1, 1], o = {}) => tex.draw(w, h, fn, { key: 'lmbg-' + key, repeat, ...o });
  const R = (seed) => ctx.rng(seed);
  const speckle = (g, w, h, seed, n, a = 0.1, size = 2.5) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,32'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * size, 1 + r() * size); } };

  A.plaster = D(256, 256, (g, w, h) => {
    const r = R(9101);
    g.fillStyle = '#f4f2ee'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { const x = r() * w, y = r() * h, s = 12 + r() * 38; g.fillStyle = `rgba(${r() < 0.5 ? '200,194,182' : '255,255,252'},${0.05 + r() * 0.08})`; g.beginPath(); g.ellipse(x, y, s, s * (0.4 + r() * 0.6), r() * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 6; i++) { const x = r() * w; g.fillStyle = `rgba(110,98,80,${0.02 + r() * 0.03})`; g.fillRect(x, 0, 2 + r() * 6, h); }   // faint rain streaks
    speckle(g, w, h, 9102, 700, 0.06, 2);
  }, 'plaster');

  A.seam = D(256, 256, (g, w, h) => {                                       // tile 1.2 x 1.2 m: seams every 0.6 m, a sheet joint every 1.2 m
    const r = R(9111);
    g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) { const x = i * w / 2; g.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.04})`; g.fillRect(x, 0, w / 2, h); g.fillStyle = 'rgba(0,0,0,0.38)'; g.fillRect(x - 1.5, 0, 3, h); g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(x + 2, 0, 2, h); }
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, h - 3, w, 3);
    speckle(g, w, h, 9112, 500, 0.05, 2.4);
  }, 'seam');

  A.clap = D(256, 256, (g, w, h) => {                                       // tile 1.2 x 1.2 m: 7 boards of 0.17 m
    const r = R(9121), n = 7, bh = h / n;
    g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      const v = 0.94 + r() * 0.1; g.fillStyle = `rgba(${v > 1 ? '255,255,255' : '0,0,0'},${Math.abs(v - 1) * 0.5})`; g.fillRect(0, i * bh, w, bh);
      g.fillStyle = 'rgba(0,0,0,0.30)'; g.fillRect(0, i * bh + bh - 3, w, 3);       // the shadow under every lap
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, i * bh + 1, w, 2);
      for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(90,70,40,${0.06 + r() * 0.08})`; g.fillRect(r() * w, i * bh + 4 + r() * (bh - 8), 10 + r() * 50, 1.2); }
    }
  }, 'clap');

  // ---- window sheets (u, v 0..1 over the opening)
  const frameCol = C.frame;
  const sky = (g, x, y, w, h, k = 1) => { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, `rgba(${(120 * k) | 0},${(150 * k) | 0},${(178 * k) | 0},1)`); gr.addColorStop(1, '#27323d'); g.fillStyle = gr; g.fillRect(x, y, w, h); };
  A.winI = D(128, 256, (g, w, h) => {                                       // tall rectangular window: white frame, 2 columns x 3 rows, a transom light at the top
    g.fillStyle = frameCol; g.fillRect(0, 0, w, h);
    const m = 9, cols = 2, rows = 3, gw = (w - 2 * m - 5 * (cols - 1)) / cols;
    const rowH = [h * 0.5, h * 0.27, h * 0.0]; void rowH;
    const ys = [m, m + (h - 2 * m) * 0.30, m + (h - 2 * m) * 0.66], hs = [(h - 2 * m) * 0.30 - 5, (h - 2 * m) * 0.36 - 5, (h - 2 * m) * 0.34];
    for (let rr = 0; rr < rows; rr++) for (let c = 0; c < cols; c++) { sky(g, m + c * (gw + 5), ys[rr], gw, hs[rr], 0.75 + 0.1 * c); }
    g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
  }, 'winI');
  A.winIArch = D(128, 192, (g, w, h) => {                                   // round-headed window (the planeShape uv covers the bounding box): frame, 2 columns, a fan transom
    g.fillStyle = frameCol; g.fillRect(0, 0, w, h);
    const m = 9;
    g.save(); g.beginPath(); g.moveTo(m, h - m); g.lineTo(m, h * 0.34); g.arc(w / 2, h * 0.34 + 0, w / 2 - m, Math.PI, 0, false); g.lineTo(w - m, h - m); g.closePath(); g.clip();
    sky(g, 0, 0, w, h, 0.85);
    g.restore();
    g.strokeStyle = frameCol; g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, 4); g.lineTo(w / 2, h - 4); g.moveTo(0, h * 0.5); g.lineTo(w, h * 0.5); g.stroke();
  }, 'winIArch');
  A.winD = D(128, 192, (g, w, h) => {                                       // the Director's House casement: white frame, two leaves with a diamond lattice
    g.fillStyle = frameCol; g.fillRect(0, 0, w, h);
    const m = 8;
    sky(g, m, m, w - 2 * m, h - 2 * m, 0.7);
    g.strokeStyle = frameCol; g.lineWidth = 2.2;
    for (let i = -8; i < 12; i++) { g.beginPath(); g.moveTo(m + i * 18, m); g.lineTo(m + i * 18 + 70, h - m); g.stroke(); g.beginPath(); g.moveTo(m + i * 18 + 70, m); g.lineTo(m + i * 18, h - m); g.stroke(); }
    g.fillStyle = frameCol; g.fillRect(w / 2 - 3, 0, 6, h);
    g.strokeStyle = frameCol; g.lineWidth = m; g.strokeRect(m / 2, m / 2, w - m, h - m);
  }, 'winD');

  // ---- the fence: alpha bars (tile 2.0 m wide x 2.0 m high: bars every 0.125 m, a top rail with spear points, a middle and a bottom rail)
  A.bars = D(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#ffffff';
    const pitch = 16, bw = 3.4;
    for (let x = pitch / 2; x < w; x += pitch) { g.fillRect(x - bw / 2, 22, bw, h - 28); g.beginPath(); g.moveTo(x - 4.5, 22); g.lineTo(x, 2); g.lineTo(x + 4.5, 22); g.fill(); }
    g.fillRect(0, 26, w, 7); g.fillRect(0, 118, w, 5); g.fillRect(0, 232, w, 8);
  }, 'bars');

  A.pickets = D(256, 128, (g, w, h) => {                                     // the low slat fence of the Japanese garden: pickets 0.09 m wide every 0.14 m, two rails (tile 2.0 x 1.0 m)
    g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff';
    for (let x = 4; x < w; x += 18) g.fillRect(x, 6, 12, h - 14);
    g.fillRect(0, 22, w, 8); g.fillRect(0, h - 38, w, 8);
  }, 'pickets');

  // ---- stone
  const granite = (key, seed, base, tones, speck) => D(256, 256, (g, w, h) => {
    const r = R(seed);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { g.fillStyle = tones[(r() * tones.length) | 0]; g.globalAlpha = 0.25 + r() * 0.25; g.beginPath(); g.ellipse(r() * w, r() * h, 4 + r() * 16, 3 + r() * 10, r() * 3, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
    for (let i = 0; i < speck; i++) { g.fillStyle = r() < 0.5 ? 'rgba(40,30,28,0.45)' : 'rgba(255,240,232,0.5)'; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5); }
  }, key);
  A.graniteP = granite('graniteP', 9131, '#e6c9c0', ['#d8b0a6', '#f1d9d0', '#c99f96', '#dfc1b8'], 1100);
  A.graniteG = granite('graniteG', 9141, '#d2d0cc', ['#c1bfba', '#e0dedb', '#b4b1ad'], 900);

  A.bark = D(256, 256, (g, w, h) => {                                       // tile 1 x 1 m: vertical furrows of a trunk, a few knots
    const r = R(9151);
    g.fillStyle = '#ece9e3'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { const x = r() * w; g.strokeStyle = `rgba(40,36,30,${0.18 + r() * 0.3})`; g.lineWidth = 1.5 + r() * 3; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 32) g.lineTo(x + (r() - 0.5) * 9, y); g.stroke(); }
    for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(40,34,28,0.45)'; g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 6, 12 + r() * 10, 0, 0, TAU); g.fill(); }
    speckle(g, w, h, 9152, 500, 0.12, 3);
  }, 'bark');

  A.slat = D(256, 128, (g, w, h) => {                                       // a bench seat: four slats with dark gaps
    const r = R(9161), n = 4, bh = h / n;
    g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) { const v = 0.92 + r() * 0.12; g.fillStyle = `rgba(${v > 1 ? '255,255,255' : '0,0,0'},${Math.abs(v - 1) * 0.5})`; g.fillRect(0, i * bh, w, bh); g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, i * bh + bh - 4, w, 4); }
  }, 'slat');

  A.planks = D(256, 256, (g, w, h) => {                                     // tile 1 x 1 m: planks of 0.18 m running along v, weathered
    const r = R(9171), n = 5, bw = w / n;
    g.fillStyle = '#e8e4da'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      const v = 0.9 + r() * 0.14; g.fillStyle = `rgba(${v > 1 ? '255,255,255' : '0,0,0'},${Math.abs(v - 1) * 0.5})`; g.fillRect(i * bw, 0, bw, h);
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(i * bw + bw - 3, 0, 3, h);
      for (let k = 0; k < 5; k++) { g.strokeStyle = `rgba(60,50,40,${0.08 + r() * 0.1})`; g.lineWidth = 1; const x = i * bw + 4 + r() * (bw - 10); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - 0.5) * 6, h); g.stroke(); }
    }
    for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(110,125,90,${0.05 + r() * 0.1})`; g.fillRect(r() * w, r() * h, 4 + r() * 10, 2 + r() * 6); }   // moss
  }, 'planks');

  A.kawara = D(256, 256, (g, w, h) => {                                     // the grey ceramic roof of the pavilion: rows of curved tiles (tile 1.2 x 1.2 m)
    const r = R(9181), n = 8, tw = w / n, th = h / 6;
    g.fillStyle = '#f0f0f0'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 6; row++) for (let i = 0; i < n; i++) {
      const x = i * tw, y = row * th, v = 0.9 + r() * 0.16;
      g.fillStyle = `rgba(${v > 1 ? '255,255,255' : '0,0,0'},${Math.abs(v - 1) * 0.55})`; g.fillRect(x, y, tw, th);
      g.fillStyle = 'rgba(0,0,0,0.38)'; g.fillRect(x, y + th - 5, tw, 5); g.fillStyle = 'rgba(0,0,0,0.30)'; g.fillRect(x + tw - 3, y, 3, th);
    }
  }, 'kawara');

  // ---- one 512 x 512 atlas of the two bronze plaques: top half = the plate on the boulder in front of the Peter bust (photo 84, the real inscription in three centred lines),
  //      bottom half = the bas-relief plaque of the Stolypin obelisk (photo B0: a dark panel with a shallow relief of stylised figures, no text).  v 0.5 .. 1 and 0 .. 0.5.
  A.plaques = D(512, 512, (g, w, h) => {
    const r = R(9191);
    g.fillStyle = '#6a5a43'; g.fillRect(0, 0, w, h / 2);
    const gr = g.createLinearGradient(0, 0, w, h / 2); gr.addColorStop(0, 'rgba(255,230,170,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0.25)'); g.fillStyle = gr; g.fillRect(0, 0, w, h / 2);
    g.strokeStyle = '#a8946c'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h / 2 - 20);
    g.fillStyle = '#d8c8a0'; g.textAlign = 'center'; g.font = 'italic 700 46px "Noto Serif", serif';
    g.fillText('Петру Великому -', w / 2, 98); g.fillText('основателю', w / 2, 154); g.fillText('Ботанического Сада', w / 2, 210);
    g.fillStyle = '#4a4036'; g.fillRect(0, h / 2, w, h / 2);
    g.strokeStyle = '#7e6c52'; g.lineWidth = 8; g.strokeRect(10, h / 2 + 10, w - 20, h / 2 - 20);
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '150,128,92' : '24,20,16'},${0.25 + r() * 0.3})`; g.beginPath(); g.ellipse(60 + r() * (w - 120), h / 2 + 50 + r() * (h / 2 - 100), 8 + r() * 30, 10 + r() * 40, r() * 3, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(160,138,100,0.5)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(100 + i * 76, h / 2 + 120 + (i % 2) * 50, 18, 34, 0.2, 0, TAU); g.fill(); g.fillRect(84 + i * 76, h / 2 + 150 + (i % 2) * 50, 32, 80); }
  }, 'plaques', [1, 1]);
  return A;
}
