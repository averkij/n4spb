// landmarksNikolsky/art.js - canvas paintings of the cathedral group: gold-leaf sheets (domes, onions), muntined window panes (arched, tall / small), the oak double door with its fan light,
// the iron balcony railing (alpha cut-out: black bars with spear tips and gilded roundels), the iron-bar panel of the white-pylon fence, the diamond-lattice garden fence, the tower clock dial,
// gravel / asphalt / lawn / granite surfaces.  Colours: docs/research/nikolsky.md section 10 (photos refs/nikolsky 039 037 031 009 073 075).  Everything is cached by key.
const TAU = Math.PI * 2;
export function makeArt(ctx) {
  const tex = ctx.tex, A = {};
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmN-' + key, repeat });

  /** gold leaf: sheets of ~0.35 x 0.25 m, tile 256 x 128, slight warm / cool variation, thin joints */
  A.gold = D(256, 128, (g, w, h) => {
    const r = ctx.rng(5101);
    g.fillStyle = '#e9b43c'; g.fillRect(0, 0, w, h);
    const cw = 64, ch = 32;
    for (let row = 0; row * ch < h; row++) for (let c = -1; c * cw < w; c++) {
      const off = (row % 2) * cw / 2, k = 0.9 + r() * 0.2;
      g.fillStyle = `rgb(${Math.min(255, 238 * k) | 0},${Math.min(255, 186 * k) | 0},${Math.min(255, 66 * k) | 0})`;
      g.fillRect(c * cw + off + 1, row * ch + 1, cw - 2, ch - 2);
      if (r() < 0.25) { g.fillStyle = 'rgba(255,240,170,0.35)'; g.fillRect(c * cw + off + 4, row * ch + 4, cw * 0.5, ch * 0.4); }
    }
    g.fillStyle = 'rgba(120,70,10,0.35)';
    for (let row = 0; row * ch < h; row++) g.fillRect(0, row * ch, w, 1);
  }, 'gold');

  /** window pane: dark glass with a white muntin grid.  cols x rows, painted for a tall arched / rectangular opening (uv spans the whole opening). */
  const pane = (key, cols, rows, archFrac = 0) => D(128, 256, (g, w, h) => {
    g.fillStyle = '#2d3a4a'; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, w, h * 0.7); gr.addColorStop(0, 'rgba(150,185,215,0.45)'); gr.addColorStop(0.55, 'rgba(60,90,125,0.05)'); gr.addColorStop(1, 'rgba(20,28,40,0.25)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // a faint interior hint: warm light bottom
    const wr = g.createLinearGradient(0, h * 0.6, 0, h); wr.addColorStop(0, 'rgba(255,220,150,0)'); wr.addColorStop(1, 'rgba(255,214,140,0.18)'); g.fillStyle = wr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#efeee6';
    const b = 5;
    g.fillRect(0, 0, b, h); g.fillRect(w - b, 0, b, h); g.fillRect(0, h - b, w, b); g.fillRect(0, 0, w, b);
    for (let c = 1; c < cols; c++) g.fillRect(w * c / cols - 2, 0, 4, h);
    for (let rr = 1; rr < rows; rr++) g.fillRect(0, h * rr / rows - 1.5, w, 3);
    if (archFrac) { g.fillRect(0, h * archFrac - 3, w, 6); }
  }, key);
  A.win36 = pane('win36', 3, 6, 0.30); A.win24 = pane('win24', 2, 5, 0.28); A.win35 = pane('win35', 3, 8, 0.32); A.win12 = pane('win12', 1, 4, 0.30);
  A.winBarred = D(128, 256, (g, w, h) => {                                  // dark window with an iron grille (lower church windows, tower arches)
    g.fillStyle = '#242c36'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c9cbc6'; g.fillRect(0, 0, 5, h); g.fillRect(w - 5, 0, 5, h); g.fillRect(0, 0, w, 5); g.fillRect(0, h - 5, w, 5);
    g.fillStyle = '#12151a'; for (let i = 1; i < 6; i++) g.fillRect(w * i / 6 - 2, 5, 4, h - 10); for (let j = 1; j < 8; j++) g.fillRect(5, h * j / 8 - 2, w - 10, 4);
  }, 'winBarred');
  /** bell opening: very dark with a faint beam */
  A.dark = D(64, 64, (g, w, h) => { g.fillStyle = '#14171c'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(60,50,40,0.5)'; g.fillRect(0, h * 0.35, w, 4); g.fillRect(0, h * 0.7, w, 4); }, 'dark');

  /** oak double door with a fan light: 128 x 256, fan light on top 22 %, two leaves of 2 x 4 raised panels */
  A.door = D(128, 256, (g, w, h) => {
    g.fillStyle = '#b98b45'; g.fillRect(0, 0, w, h);
    const fan = h * 0.22;
    g.fillStyle = '#27323f'; g.fillRect(0, 0, w, fan);
    g.fillStyle = '#e8e4d8'; g.fillRect(0, fan - 4, w, 5); g.strokeStyle = '#e8e4d8'; g.lineWidth = 3;
    for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(w / 2, fan); g.lineTo(w * i / 8, 0); g.stroke(); }
    const rows = 4, cols = 2;
    for (let leaf = 0; leaf < 2; leaf++) for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x0 = leaf * w / 2 + 8 + c * (w / 2 - 12) / cols, y0 = fan + 8 + r * (h - fan - 16) / rows, pw = (w / 2 - 12) / cols - 6, ph = (h - fan - 16) / rows - 6;
      g.fillStyle = '#8a6330'; g.fillRect(x0, y0, pw, ph); g.fillStyle = '#c99b53'; g.fillRect(x0 + 3, y0 + 3, pw - 6, ph - 6);
    }
    g.fillStyle = '#5a3d1a'; g.fillRect(w / 2 - 1.5, fan, 3, h - fan); g.fillRect(0, h - 3, w, 3);
    g.fillStyle = '#d7b254'; g.fillRect(w / 2 - 9, h * 0.58, 4, 14); g.fillRect(w / 2 + 5, h * 0.58, 4, 14);
  }, 'door');

  /** balcony railing: 256 x 64 alpha cut-out = 1.0 m x 0.3 m... painted as one bay, black bars with gilded spear tips and roundels, repeat along the length */
  A.rail = D(256, 96, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#1f2226';
    g.fillRect(0, 4, w, 6); g.fillRect(0, h - 10, w, 6);                    // top / bottom rails
    for (let i = 0; i < 16; i++) { const x = (i + 0.5) * w / 16; g.fillRect(x - 2, 8, 4, h - 16); g.fillStyle = '#d9a640'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 4, 10); g.lineTo(x - 4, 10); g.fill(); g.fillStyle = '#1f2226'; }
    g.strokeStyle = '#d9a640'; g.lineWidth = 3;
    for (let i = 0; i < 4; i++) { const cx = (i + 0.5) * w / 4, cy = h / 2; g.beginPath(); g.arc(cx, cy, 20, 0, TAU); g.stroke(); g.fillStyle = '#1f2226'; g.beginPath(); g.arc(cx, cy, 9, 0, TAU); g.fill(); }
  }, 'rail');
  /** iron bar panel of the pylon fence: 128 x 128 alpha, 8 bars with spear tips, 3 rails (tile = 1.12 m x 1.1 m, bar pitch 0.14) */
  A.bars = D(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#24272b';
    for (let i = 0; i < 8; i++) { const x = (i + 0.5) * w / 8; g.fillRect(x - 2, 14, 4, h - 14); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 4.5, 16); g.lineTo(x - 4.5, 16); g.fill(); }
    g.fillRect(0, 26, w, 5); g.fillRect(0, h * 0.58, w, 4); g.fillRect(0, h - 10, w, 6);
  }, 'bars');
  /** diamond lattice (the garden's west / north fence): 128 x 128 alpha, rhombi of 0.3 m, a top rail with spear finials */
  A.lattice = D(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#24272b'; g.lineWidth = 3;
    const s = 32;
    for (let i = -4; i <= 8; i++) { g.beginPath(); g.moveTo(i * s, 12); g.lineTo(i * s + h, h + 12); g.stroke(); g.beginPath(); g.moveTo(i * s + h, 12); g.lineTo(i * s, h + 12); g.stroke(); }
    g.fillStyle = '#24272b'; g.fillRect(0, 8, w, 6); g.fillRect(0, h - 5, w, 5);
    for (let i = 0; i < 4; i++) { const x = (i + 0.5) * w / 4; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 5, 10); g.lineTo(x - 5, 10); g.fill(); }
  }, 'lattice');
  /** tower clock dial: 128 x 128 white, black ring + Arabic-like marks, two hands (the hands are painted: the dial is a static picture) */
  A.clock = D(128, 128, (g, w, h) => {
    g.fillStyle = '#d9a640'; g.beginPath(); g.arc(64, 64, 63, 0, TAU); g.fill();
    g.fillStyle = '#f6f4ec'; g.beginPath(); g.arc(64, 64, 57, 0, TAU); g.fill();
    g.strokeStyle = '#1c1f24'; g.lineWidth = 3;
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.beginPath(); g.moveTo(64 + Math.sin(a) * 46, 64 - Math.cos(a) * 46); g.lineTo(64 + Math.sin(a) * 54, 64 - Math.cos(a) * 54); g.stroke(); }
    g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.sin(2.1) * 28, 64 - Math.cos(2.1) * 28); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.sin(5.6) * 42, 64 - Math.cos(5.6) * 42); g.stroke();
    g.fillStyle = '#1c1f24'; g.beginPath(); g.arc(64, 64, 4, 0, TAU); g.fill();
  }, 'clock');

  // ---- surfaces (white-ish tiles tinted by the material colour; world-space uv)
  A.gravel = D(256, 256, (g, w, h) => {
    const r = ctx.rng(4411); g.fillStyle = '#e6e0da'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const v = 196 + Math.floor(r() * 59); g.fillStyle = `rgb(${v},${v - 6},${v - 10})`; const s = 1 + r() * 3.2; g.fillRect(r() * w, r() * h, s, s * (0.6 + r() * 0.7)); }
    for (let i = 0; i < 360; i++) { const v = 140 + Math.floor(r() * 50); g.fillStyle = `rgba(${v},${v - 10},${v - 14},0.5)`; const s = 1 + r() * 2.4; g.fillRect(r() * w, r() * h, s, s); }
  }, 'gravel');
  A.asphalt = D(256, 256, (g, w, h) => {
    const r = ctx.rng(7120); g.fillStyle = '#e9e9ea'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1100; i++) { const v = 205 + Math.floor(r() * 50); g.fillStyle = `rgb(${v},${v},${v + 2})`; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5); }
    for (let i = 0; i < 260; i++) { const v = 150 + Math.floor(r() * 50); g.fillStyle = `rgba(${v},${v},${v},0.5)`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  }, 'asphalt');
  A.grass = D(256, 256, (g, w, h) => {
    const r = ctx.rng(7744); g.fillStyle = '#eef3e4'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) { const v = 208 + Math.floor(r() * 47); g.fillStyle = `rgba(${v - 24},${v},${v - 40},0.5)`; const s = 3 + r() * 14; g.beginPath(); g.ellipse(r() * w, r() * h, s, s * (0.4 + r() * 0.5), r() * 3.1, 0, TAU); g.fill(); }
    for (let i = 0; i < 140; i++) { g.fillStyle = r() < 0.8 ? 'rgba(255,255,240,0.5)' : 'rgba(250,236,120,0.45)'; g.fillRect(r() * w, r() * h, 2, 2); }
  }, 'grass');
  A.granite = D(256, 256, (g, w, h) => {
    const r = ctx.rng(9021); g.fillStyle = '#d9d5ce'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { const v = 160 + Math.floor(r() * 90); g.fillStyle = `rgba(${v},${v - 6},${v - 10},0.4)`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
  }, 'granite');
  /** stone setts of the plaza ring: 1 m cells of 0.1 m sett pattern */
  A.sett = D(256, 256, (g, w, h) => {
    const r = ctx.rng(3303); g.fillStyle = '#9a968f'; g.fillRect(0, 0, w, h);
    const c = 16;
    for (let y = 0; y < h; y += c) for (let x = 0; x < w; x += c) { const v = 150 + Math.floor(r() * 60); g.fillStyle = `rgb(${v},${v - 4},${v - 8})`; g.fillRect(x + (y / c % 2) * 6 - 6 + 1, y + 1, c - 2, c - 2); }
  }, 'sett');
  return A;
}
