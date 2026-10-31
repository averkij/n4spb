// landmarksYelaginServices/art.js - the canvas paintings of the module (dossier docs/research/yelagin-palace-2026.md sections 6, 8, 9; photos stb_01 stb_03 stb_05 stb_06 stb_08 stb_11 stb_14 stb_15 ora_03 ora_04 ora_07 ora_09
// ora_11 misc_10 misc_12 misc_14 misc_16).  Every key starts with 'lmyesv-' (the texture cache is scene-wide).
//   plaster  neutral stucco (multiplied by the wall colour: white #f1f0ea, ochre #d9ab72);  rust  rusticated bands 0.5 m (the grey ground floor of the pavilions; tile 2 x 2 m);  ashlar  grey-beige limestone courses (tile 1.8 m);
//   zinc  standing-seam roof (tile 1.2 m);  setts  rectangular grey-pink cobbles (tile 1.5 m);  winWhite / winBrown  sash windows with glazing bars (u 0..1 over the opening);  fan  half-round window with radial bars (u, v 0..1 over
//   the half-disc);  key  the Greek-key (meander) band under the pavilion cornices (tile 1.2 x 0.5 m);  glassBay  one bay of the Orangery glass wall (3.7 x 7 m: white muntin grid over pale teal glass);
//   clap  clapboard (boards 0.16 m, tile 1 m);  iron  the white spear-topped iron fence (alpha; one panel 2.0 x 2.2 m: bars every 0.12 m, rails, a chain of rings, spear heads);  door  a double wooden door with raised panels (1.8 x 3.2 m).
const TAU = Math.PI * 2;
export const COL = {
  white: '#f1f0ea', wall: '#ecebe6', rust: '#c9cbcf', zinc: '#aab2b7', zincG: '#6f8a62', ochre: '#e0b47a', clapGrey: '#d9dde0', clapCream: '#ebe5cf', dark: '#2b2f33', iron: '#f3f2ee', shade: '#cfd0cc',
  woodWin: '#b07a3a', doorWood: '#b88a52', glass: '#2c353d', lantern: '#1d2226', granite: '#9a978e', plinthPink: '#a68a88',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {};
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmyesv-' + key, repeat });
  const R = (seed) => ctx.rng(seed);
  const speckle = (g, w, h, seed, n, a = 0.1, size = 2.5) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,32'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * size, 1 + r() * size); } };

  A.plaster = D(256, 256, (g, w, h) => {
    const r = R(7301);
    g.fillStyle = '#f5f5f2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 80; i++) { const x = r() * w, y = r() * h, s = 14 + r() * 40; g.fillStyle = `rgba(${r() < 0.5 ? '205,208,214' : '255,255,255'},${0.05 + r() * 0.07})`; g.beginPath(); g.ellipse(x, y, s, s * (0.5 + r() * 0.6), r() * TAU, 0, TAU); g.fill(); }
    for (let i = 0; i < 4; i++) { const x = r() * w; g.fillStyle = `rgba(110,118,132,${0.02 + r() * 0.025})`; g.fillRect(x, 0, 3 + r() * 7, h); }
    speckle(g, w, h, 7302, 600, 0.06, 2);
  }, 'plaster');

  A.rust = D(256, 256, (g, w, h) => {                         // four bands of 0.5 m in a 2 m tile: a deep joint under every band, short vertical joints running bond
    const r = R(7311), bh = h / 4;
    g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 4; k++) {
      const v = 0.95 + r() * 0.08; g.fillStyle = `rgb(${242 * v | 0},${242 * v | 0},${244 * v | 0})`; g.fillRect(0, k * bh + 3, w, bh - 3);
      g.fillStyle = 'rgba(60,64,72,0.45)'; g.fillRect(0, k * bh, w, 3); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(0, k * bh + 3, w, 3);
    }
    speckle(g, w, h, 7312, 500, 0.05, 2);
  }, 'rust');

  A.ashlar = D(256, 256, (g, w, h) => {                       // four courses of 0.45 m in a 1.8 m tile, blocks 0.9 .. 1.4 m, grey-beige travertine-like with horizontal veining
    const r = R(7321), ch = h / 4;
    g.fillStyle = '#dedcd4'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 4; k++) {
      let x = -((k * 61) % 90);
      while (x < w) {
        const bw = 80 + ((k * 7 + Math.floor(x)) % 3) * 22, v = 0.9 + r() * 0.16;
        g.fillStyle = `rgb(${222 * v | 0},${219 * v | 0},${209 * v | 0})`; g.fillRect(x + 1.5, k * ch + 1.5, bw - 3, ch - 3);
        for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(120,110,90,${0.06 + r() * 0.1})`; g.fillRect(x + r() * bw * 0.8, k * ch + r() * ch, 18 + r() * 50, 1.5); }
        g.fillStyle = 'rgba(80,72,60,0.55)'; g.fillRect(x, k * ch, 2.5, ch);
        x += bw;
      }
      g.fillStyle = 'rgba(80,72,60,0.6)'; g.fillRect(0, k * ch, w, 3);
    }
    for (let i = 0; i < 14; i++) { const x = r() * w; g.fillStyle = `rgba(70,76,70,${0.05 + r() * 0.07})`; g.fillRect(x, 0, 4 + r() * 9, h); }
    speckle(g, w, h, 7322, 700, 0.07, 3);
  }, 'ashlar');

  A.setts = D(256, 256, (g, w, h) => {                        // rectangular cobbles 0.2 x 0.1 m in running bond, grey with a pink cast (tile 1.5 m: 8 x 15)
    const r = R(7331), bw = 34, bh = 17;
    g.fillStyle = '#77726f'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 15; j++) for (let i = -1; i < 8; i++) {
      const v = 0.9 + r() * 0.16, x = i * bw + (j % 2) * bw / 2, y = j * bh;
      g.fillStyle = `rgb(${(160 + (r() - 0.5) * 8) * v | 0},${(153 + (r() - 0.5) * 6) * v | 0},${(150 + (r() - 0.5) * 6) * v | 0})`; g.fillRect(x + 1, y + 1, bw - 2, bh - 2);
    }
    speckle(g, w, h, 7332, 400, 0.05, 2);
  }, 'setts');

  A.zinc = D(256, 256, (g, w, h) => {                         // standing seams every 0.6 m (tile 1.2 m: two seams), sheets slightly different in tone
    const r = R(7341);
    g.fillStyle = '#eef0f2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) {
      const x = i * 128, v = 0.94 + r() * 0.1; g.fillStyle = `rgba(${215 * v | 0},${222 * v | 0},${228 * v | 0},0.5)`; g.fillRect(x, 0, 128, h);
      g.fillStyle = 'rgba(70,78,88,0.45)'; g.fillRect(x, 0, 4, h); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(x + 4, 0, 3, h); g.fillStyle = 'rgba(70,78,88,0.2)'; g.fillRect(x + 7, 0, 3, h);
    }
    for (let k = 0; k < 3; k++) { g.fillStyle = 'rgba(80,88,98,0.14)'; g.fillRect(0, k * (h / 3) + r() * 20, w, 2); }
    speckle(g, w, h, 7342, 260, 0.06, 2);
  }, 'zinc');

  A.clap = D(256, 256, (g, w, h) => {                         // clapboard: 6 boards of 0.16 m per 1 m tile, a shadow line under each, a few grain streaks
    const r = R(7351), n = 6, bh = h / n;
    g.fillStyle = '#f6f6f4'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < n; k++) {
      const v = 0.95 + r() * 0.07; g.fillStyle = `rgb(${246 * v | 0},${246 * v | 0},${244 * v | 0})`; g.fillRect(0, k * bh, w, bh);
      g.fillStyle = 'rgba(70,64,56,0.38)'; g.fillRect(0, k * bh + bh - 5, w, 5); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(0, k * bh, w, 2);
      for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(110,100,86,0.10)'; g.fillRect(r() * w, k * bh + 4 + r() * (bh - 12), 30 + r() * 80, 1.5); }
    }
    speckle(g, w, h, 7352, 300, 0.05, 2);
  }, 'clap');

  // ------------------------------------------------------------------------------------------ windows
  const glassBase = (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#3a4652'); gr.addColorStop(0.5, '#27303a'); gr.addColorStop(1, '#46535f');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(150,175,195,0.2)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.7, 0); g.lineTo(w * 0.1, h * 0.55); g.lineTo(0, h * 0.55); g.fill();
  };
  /** white sash window (1.3 x 2.0 m): outer frame, centre mullion, a transom at 30 % and two glazing bars per leaf */
  A.winWhite = D(128, 192, (g, w, h) => {
    glassBase(g, w, h);
    g.strokeStyle = '#f1f0ea'; g.lineWidth = 7; g.strokeRect(3.5, 3.5, w - 7, h - 7);
    g.lineWidth = 5; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h * 0.3); g.lineTo(w, h * 0.3); g.stroke();
    g.lineWidth = 3; for (const t of [0.5, 0.7, 0.85]) { g.beginPath(); g.moveTo(0, h * t); g.lineTo(w, h * t); g.stroke(); }
    g.beginPath(); g.moveTo(w * 0.25, h * 0.3); g.lineTo(w * 0.25, h); g.moveTo(w * 0.75, h * 0.3); g.lineTo(w * 0.75, h); g.stroke();
  }, 'winWhite');
  /** natural-wood window (1.3 x 2.6 m): tall two leaves, transom at 28 % */
  A.winBrown = D(128, 224, (g, w, h) => {
    glassBase(g, w, h);
    g.strokeStyle = COL.woodWin; g.lineWidth = 9; g.strokeRect(4.5, 4.5, w - 9, h - 9);
    g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, h * 0.28); g.lineTo(w / 2, h); g.moveTo(0, h * 0.28); g.lineTo(w, h * 0.28); g.stroke();
    g.lineWidth = 3; for (const t of [0.46, 0.64, 0.82]) { g.beginPath(); g.moveTo(0, h * t); g.lineTo(w, h * t); g.stroke(); }
    g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h * 0.28); g.stroke();
  }, 'winBrown');
  /** half-round fan window: u 0..1 over the half-disc width, v 0..1 over its height; radial bars from the springing centre, an outer ring */
  A.fan = D(256, 128, (g, w, h) => {
    glassBase(g, w, h);
    g.strokeStyle = '#f1f0ea'; g.fillStyle = '#f1f0ea';
    const cx = w / 2, cy = h, n = 7;
    g.lineWidth = 8; g.beginPath(); g.arc(cx, cy, w / 2 - 4, Math.PI, 0); g.stroke(); g.fillRect(0, h - 8, w, 8);
    g.lineWidth = 5; for (let i = 1; i < n; i++) { const a = Math.PI * i / n; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * (w / 2), cy - Math.sin(a) * (w / 2)); g.stroke(); }
    g.beginPath(); g.arc(cx, cy, w * 0.26, Math.PI, 0); g.stroke();
    g.fillRect(cx - 4, 0, 8, h);
  }, 'fan');
  /** Greek key band: tile 1.2 m x 0.5 m (u 0..1 -> 1.2 m): grey meander on white */
  A.key = D(256, 110, (g, w, h) => {
    g.fillStyle = '#f1f0ea'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(120,126,136,0.9)'; g.fillRect(0, 6, w, 5); g.fillRect(0, h - 11, w, 5);
    g.strokeStyle = 'rgba(110,116,128,0.95)'; g.lineWidth = 6; g.lineCap = 'square';
    const u = 24, y0 = 18;
    for (let i = 0; i < 5; i++) {
      const x = i * (w / 5) + 4;
      g.beginPath(); g.moveTo(x, h - 20); g.lineTo(x, y0 + 4); g.lineTo(x + u * 2, y0 + 4); g.lineTo(x + u * 2, h - 38); g.lineTo(x + u, h - 38); g.lineTo(x + u, y0 + 22); g.lineTo(x + u + 12, y0 + 22); g.stroke();
      g.beginPath(); g.moveTo(x + u * 2, h - 20); g.lineTo(x + u * 2 + 14, h - 20); g.stroke();
    }
  }, 'key');
  /** one bay of the Orangery glass wall (3.7 x 7.0 m): pale teal reflecting glass, a muntin grid of 8 x 15 panes, a heavier transom at 58 %, a lattice band at the foot */
  A.glassBay = D(256, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#9db3b4'); gr.addColorStop(0.4, '#6f8c90'); gr.addColorStop(1, '#8ea5a8');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(235,242,244,0.32)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.8, 0); g.lineTo(w * 0.15, h * 0.5); g.lineTo(0, h * 0.5); g.fill();
    g.fillStyle = 'rgba(40,60,66,0.22)'; g.beginPath(); g.moveTo(w, h * 0.3); g.lineTo(w, h); g.lineTo(w * 0.3, h); g.fill();
    g.strokeStyle = '#f1f0ea'; g.lineWidth = 3.5;
    for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.lineTo(i * w / 8, h); g.stroke(); }
    for (let j = 1; j < 15; j++) { g.beginPath(); g.moveTo(0, j * h / 15); g.lineTo(w, j * h / 15); g.stroke(); }
    g.lineWidth = 9; g.beginPath(); g.moveTo(0, h * 0.58); g.lineTo(w, h * 0.58); g.stroke();
    g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    g.lineWidth = 3; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(i * w / 8, h * 0.93); g.lineTo((i + 1) * w / 8, h * 0.99); g.moveTo((i + 1) * w / 8, h * 0.93); g.lineTo(i * w / 8, h * 0.99); g.stroke(); }
  }, 'glassBay');
  /** the white spear-topped fence: one panel 2.0 x 2.2 m (u 0..1, v 0..1), alpha */
  A.iron = D(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; g.strokeStyle = '#ffffff'; g.lineCap = 'butt';
    const n = 17, top = 30;
    g.fillRect(0, top + 14, w, 7); g.fillRect(0, h - 40, w, 7); g.fillRect(0, h * 0.5, w, 5);
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * w / n; g.fillRect(x - 2, top, 4, h - top);
      g.beginPath(); g.moveTo(x - 6, top + 12); g.lineTo(x, 2); g.lineTo(x + 6, top + 12); g.closePath(); g.fill();
    }
    g.lineWidth = 3.5; for (let i = 0; i < n - 1; i++) { g.beginPath(); g.arc((i + 1) * w / n, h * 0.71, 8, 0, TAU); g.stroke(); }
    g.fillRect(0, 0, 5, h); g.fillRect(w - 5, 0, 5, h);
  }, 'iron');
  /** double wooden door with raised panels: u 0..1 over 1.8 m, v over 3.2 m */
  A.door = D(128, 256, (g, w, h) => {
    const r = R(7361);
    g.fillStyle = '#c99a5f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(90,60,30,${0.05 + r() * 0.08})`; g.fillRect(r() * w, r() * h, 1.5, 12 + r() * 40); }
    g.strokeStyle = 'rgba(70,45,22,0.85)'; g.lineWidth = 5; g.strokeRect(2.5, 2.5, w - 5, h - 5); g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
    g.lineWidth = 3.5;
    for (const [x0, x1] of [[10, w / 2 - 8], [w / 2 + 8, w - 10]]) for (const [y0, y1] of [[14, h * 0.3], [h * 0.34, h * 0.64], [h * 0.68, h - 14]]) { g.strokeRect(x0, y0, x1 - x0, y1 - y0); g.fillStyle = 'rgba(255,230,190,0.12)'; g.fillRect(x0 + 2, y0 + 2, x1 - x0 - 4, 5); }
    g.fillStyle = '#3a3226'; g.fillRect(w / 2 - 9, h * 0.5, 4, 16); g.fillRect(w / 2 + 5, h * 0.5, 4, 16);
  }, 'door');
  return A;
}
