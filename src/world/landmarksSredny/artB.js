// landmarksSredny/artB.js - canvas paintings of the Geological Committee building (Sredny pr. 74; docs/research/sredny.md section 4, photos refs/sredny 32 36 45 46 47 49 n09 n10 n11).
//   dolo       pale dolomite facing: ashlar joints every 0.55 m horizontally and 1.1 m vertically (tile 4.4 x 4.4 m), cream-grey `#dcd2b8`
//   dolo1      the same with deep horizontal rustication grooves every 0.55 m (floor 1)
//   granRust   the rusticated dark granite plinth: rough-hewn blocks 0.9 x 0.45 m, joints `#2a2c2d` (tile 3.6 x 1.8 m)
//   granLight  pale granite slabs 1.2 x 0.6 m (stair, platform, pedestals) `#b7b6b0`
//   glassArch  arched window 1.65 x 3.4 m: steel glazing 2 x 6 panes `#2f3e48`, glass with a sky gradient
//   glassRect  rectangular window: 2 x 4 panes, a transom at 2/3
//   balus      a stone balustrade 1.6 x 0.8 m: five-baluster rhythm, rails top and bottom
//   lettering  the attic inscription ГЕОЛОГИЧЕСКИЙ / КОМИТЕТЪ / 1882 г. on a transparent sheet 6.8 x 3.0 m (cap heights 0.8 / 0.75 / 0.4 m)
//   doorOak    the arched double oak door 1.9 x 4.7 m: honey oak, glazed cut-corner panels, a three-pane fanlight (photo 45; review fix: no oval panes)
//   greenRoof / domeMetal / skylight / plaque  the green sheet of the wings, the grey-green dome with rust streaks, the steel-and-glass panes of the lanterns, the black plaque with gilt text
// Every key starts with 'lmsredn-'.
const TAU = Math.PI * 2;

export function makeArtB(ctx) {
  const tex = ctx.tex, A = {}, F = tex.FONTS;
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmsredn-' + key, repeat });
  const R = (seed) => ctx.rng(seed);
  const speckle = (g, w, h, seed, n, a = 0.1, s = 2) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,30'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * s, 1 + r() * s * 0.8); } };

  /** dolomite: tile 4.4 x 4.4 m (canvas 512): joints every 0.55 m (8 rows) x 1.1 m (4 per row, alternate rows shifted) */
  const dolo = (key, rustic, seed) => D(512, 512, (g, w, h) => {
    const r = R(seed), rows = 8, cw = w / 4, rh = h / rows;
    g.fillStyle = '#cdc2a6'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < rows; j++) for (let i = -1; i < 4; i++) {
      const x = i * cw + (j % 2) * cw / 2, v = 0.96 + r() * 0.08;
      g.fillStyle = `rgb(${236 * v | 0},${224 * v | 0},${194 * v | 0})`; g.fillRect(x + 1.5, j * rh + (rustic ? 4 : 1.5), cw - 3, rh - (rustic ? 8 : 3));
      if (rustic) { g.fillStyle = 'rgba(80,68,48,0.38)'; g.fillRect(x, j * rh, cw, 4); g.fillStyle = 'rgba(255,250,235,0.2)'; g.fillRect(x + 1.5, j * rh + rh - 6, cw - 3, 3); }
    }
    speckle(g, w, h, seed + 1, 500, 0.05);
  }, key);
  A.dolo = dolo('dolo', false, 8201);
  A.dolo1 = dolo('dolo1', true, 8211);
  A.granRust = D(512, 256, (g, w, h) => {
    const r = R(8221), cols = 4, rows = 4, cw = w / cols, rh = h / rows;
    g.fillStyle = '#2a2c2d'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < rows; j++) for (let i = -1; i < cols; i++) {
      const x = i * cw + (j % 2) * cw / 2, v = 0.82 + r() * 0.36;
      const gr = g.createLinearGradient(x, j * rh, x + cw, (j + 1) * rh); gr.addColorStop(0, `rgb(${96 * v | 0},${100 * v | 0},${102 * v | 0})`); gr.addColorStop(1, `rgb(${62 * v | 0},${66 * v | 0},${68 * v | 0})`);
      g.fillStyle = gr; g.fillRect(x + 3, j * rh + 3, cw - 6, rh - 6);
      g.fillStyle = 'rgba(180,184,186,0.15)'; for (let k = 0; k < 8; k++) g.fillRect(x + 6 + r() * (cw - 14), j * rh + 6 + r() * (rh - 14), 3 + r() * 8, 2 + r() * 4);
    }
    speckle(g, w, h, 8222, 500, 0.08);
  }, 'granRust');
  A.granLight = D(256, 256, (g, w, h) => {
    const r = R(8231), cw = w / 2, rh = h / 4;
    g.fillStyle = '#8f8d86'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 4; j++) for (let i = -1; i < 2; i++) { const x = i * cw + (j % 2) * cw / 2, v = 0.95 + r() * 0.1; g.fillStyle = `rgb(${183 * v | 0},${182 * v | 0},${176 * v | 0})`; g.fillRect(x + 1.5, j * rh + 1.5, cw - 3, rh - 3); }
    speckle(g, w, h, 8232, 260, 0.07);
  }, 'granLight');

  /** an arched window 1.65 x 3.4 m (canvas 128 x 256; the arch contour clips the fan, the canvas is a plain rectangle) */
  A.glassArch = D(128, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#8ba7b6'); gr.addColorStop(1, '#4f6878'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.2)'; g.beginPath(); g.moveTo(0, h * 0.6); g.lineTo(w, h * 0.2); g.lineTo(w, h * 0.34); g.lineTo(0, h * 0.74); g.closePath(); g.fill();
    g.fillStyle = '#2f3e48';
    g.fillRect(w / 2 - 2, 0, 4, h);
    for (let j = 1; j < 6; j++) g.fillRect(0, j * h / 6 - 1.5, w, 3);
    g.fillRect(0, 0, 5, h); g.fillRect(w - 5, 0, 5, h); g.fillRect(0, h - 5, w, 5);
  }, 'glassArch');
  A.glassRect = D(128, 160, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#7e9aab'); gr.addColorStop(1, '#41596a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.moveTo(0, h * 0.7); g.lineTo(w, h * 0.3); g.lineTo(w, h * 0.42); g.lineTo(0, h * 0.82); g.closePath(); g.fill();
    g.fillStyle = '#2f3e48';
    g.fillRect(w / 2 - 2, 0, 4, h); g.fillRect(0, h * 0.34 - 2, w, 4); g.fillRect(0, h * 0.67 - 1.5, w, 3);
    g.fillRect(0, 0, 5, h); g.fillRect(w - 5, 0, 5, h); g.fillRect(0, 0, w, 5); g.fillRect(0, h - 5, w, 5);
  }, 'glassRect');
  /** a balustrade panel 1.6 x 0.8 m: rails at top and bottom, five lathe-shaped balusters (vase profile) */
  A.balus = D(256, 128, (g, w, h) => {
    g.fillStyle = '#d9ceb5'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#6b6350'; g.fillRect(0, 14, w, h - 28);
    for (let i = 0; i < 9; i++) {
      const cx = (i + 0.5) * w / 9;
      g.fillStyle = '#e4dac2'; g.beginPath(); g.moveTo(cx - 6, 14); g.lineTo(cx + 6, 14); g.quadraticCurveTo(cx + 3, 30, cx + 11, 62); g.quadraticCurveTo(cx + 3, 90, cx + 6, h - 14); g.lineTo(cx - 6, h - 14); g.quadraticCurveTo(cx - 3, 90, cx - 11, 62); g.quadraticCurveTo(cx - 3, 30, cx - 6, 14); g.fill();
    }
    g.fillStyle = '#cfc4aa'; g.fillRect(0, 0, w, 14); g.fillRect(0, h - 14, w, 14);
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, h - 14, w, 4);
  }, 'balus');
  /** the attic inscription on a transparent sheet 6.8 x 3.0 m (canvas 1024 x 452; 150.6 px/m): line 1 cap height 0.8 m, line 2 0.75 m, line 3 0.4 m, dark grey incised letters with a pale lower-right edge */
  A.lettering = D(1024, 452, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const ppm = w / 6.8;
    const line = (txt, capH, baseY, wMax) => {
      let s = capH * ppm / 0.72; g.font = `700 ${s}px ${F.serif}`;
      const w0 = g.measureText(txt).width; if (w0 > wMax * ppm) { s *= wMax * ppm / w0; g.font = `700 ${s}px ${F.serif}`; }
      g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillText(txt, w / 2 + 1.5, baseY + 1.5);
      g.fillStyle = '#5d5a54'; g.fillText(txt, w / 2, baseY);
    };
    line('ГЕОЛОГИЧЕСКИЙ', 0.8, 0.95 * ppm, 6.3);
    line('КОМИТЕТЪ', 0.75, 1.95 * ppm, 4.3);
    line('1882 г.', 0.4, 2.6 * ppm, 1.9);
  }, 'lettering');
  /** the arched oak door pair 1.9 x 4.7 m (canvas 190 x 470 px, 100 px/m; photo 45): a semicircular fanlight in three panes, a dentil transom, two honey-oak leaves, each with a small upper pane, a tall glazed
   *  panel with cut corners and a raised lower panel; brass pulls.  (The first version had oval portholes: wrong.) */
  A.doorOak = D(190, 470, (g, w, h) => {
    const r = R(8241), FH = 128, TR = 158;
    g.fillStyle = '#4a3320'; g.fillRect(0, 0, w, h);
    // fanlight: dark reflective glass, two wooden muntins, a horizontal bar under it
    const fg = g.createLinearGradient(0, 0, w, FH); fg.addColorStop(0, '#6f8798'); fg.addColorStop(1, '#3d5160'); g.fillStyle = fg; g.fillRect(5, 5, w - 10, FH - 5);
    g.fillStyle = 'rgba(255,255,255,0.16)'; g.beginPath(); g.moveTo(5, FH * 0.8); g.lineTo(w - 5, FH * 0.3); g.lineTo(w - 5, FH * 0.5); g.lineTo(5, FH); g.closePath(); g.fill();
    g.fillStyle = '#7a5226'; g.fillRect(w / 3 - 2, 0, 4, FH); g.fillRect(2 * w / 3 - 2, 0, 4, FH); g.fillRect(0, FH - 2, w, 8);
    // transom board with a row of dentils
    g.fillStyle = '#b07a38'; g.fillRect(0, FH + 6, w, TR - FH - 6);
    g.fillStyle = '#8a5a26'; for (let x = 6; x < w - 6; x += 10) g.fillRect(x, FH + 12, 5, 9);
    g.fillStyle = '#6f4720'; g.fillRect(0, TR - 3, w, 3);
    // the two leaves
    for (const x0 of [0, w / 2]) {
      const lw = w / 2, gr = g.createLinearGradient(x0, 0, x0 + lw, 0); gr.addColorStop(0, '#b4803c'); gr.addColorStop(0.5, '#c28f47'); gr.addColorStop(1, '#a8742f');
      g.fillStyle = gr; g.fillRect(x0, TR, lw, h - TR);
      // small upper pane
      g.fillStyle = '#7a5226'; g.fillRect(x0 + 10, TR + 12, lw - 20, 52); g.fillStyle = '#41586a'; g.fillRect(x0 + 15, TR + 17, lw - 30, 42);
      // tall glazed panel with cut corners (frame, then glass)
      const y0 = TR + 84, y1 = y0 + 150;
      g.fillStyle = '#7a5226'; g.fillRect(x0 + 12, y0, lw - 24, y1 - y0);
      g.fillStyle = '#36505f'; g.beginPath(); const gx0 = x0 + 20, gx1 = x0 + lw - 20, gy0 = y0 + 8, gy1 = y1 - 8, c = 8;
      g.moveTo(gx0 + c, gy0); g.lineTo(gx1 - c, gy0); g.lineTo(gx1 - c, gy0 + c); g.lineTo(gx1, gy0 + c); g.lineTo(gx1, gy1 - c); g.lineTo(gx1 - c, gy1 - c); g.lineTo(gx1 - c, gy1); g.lineTo(gx0 + c, gy1); g.lineTo(gx0 + c, gy1 - c); g.lineTo(gx0, gy1 - c); g.lineTo(gx0, gy0 + c); g.lineTo(gx0 + c, gy0 + c); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(gx0 + 6, gy0 + 6, 8, gy1 - gy0 - 12);
      // raised lower panel
      const py0 = y1 + 14, py1 = h - 12;
      g.fillStyle = '#8a5a26'; g.fillRect(x0 + 12, py0, lw - 24, py1 - py0); g.fillStyle = '#b98642'; g.fillRect(x0 + 19, py0 + 7, lw - 38, py1 - py0 - 14);
    }
    g.fillStyle = '#5a3a1a'; g.fillRect(w / 2 - 2, TR, 4, h - TR);
    g.fillStyle = '#d8b860'; g.fillRect(w / 2 - 14, TR + 170, 5, 46); g.fillRect(w / 2 + 9, TR + 170, 5, 46);          // brass pulls
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(60,36,12,${0.04 + r() * 0.06})`; g.fillRect(r() * w, TR + r() * (h - TR), 1, 6 + r() * 22); }
  }, 'doorOak');
  A.greenRoof = D(128, 128, (g, w, h) => { g.fillStyle = '#4f8a72'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5; i++) { g.fillStyle = '#3f7660'; g.fillRect(i * 25.6, 0, 2, h); g.fillStyle = '#69a08a'; g.fillRect(i * 25.6 + 2, 0, 1.5, h); } speckle(g, w, h, 8251, 80, 0.07); }, 'greenRoof');
  /** the dome sheet: grey-green with rust streaks every 1.5 m (tile 3 x 3 m) */
  A.domeMetal = D(256, 256, (g, w, h) => {
    const r = R(8261); g.fillStyle = '#9aa8a2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { g.fillStyle = '#7d8c86'; g.fillRect(i * w / 6, 0, 2, h); }
    for (let i = 0; i < 2; i++) { const x = i * w / 2 + 40 + r() * 30, gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(138,90,64,0.75)'); gr.addColorStop(1, 'rgba(138,90,64,0)'); g.fillStyle = gr; g.fillRect(x, 0, 5 + r() * 4, h * (0.5 + r() * 0.5)); }
    speckle(g, w, h, 8262, 160, 0.08);
  }, 'domeMetal');
  /** steel-and-glass lantern: panes 1.0 x 1.2 m (tile 2 x 2.4 m = 2 x 2 panes) */
  A.skylight = D(128, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#b4cad6'); gr.addColorStop(1, '#7f9aaa'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3a4248'; g.fillRect(0, 0, w, 4); g.fillRect(0, h / 2 - 2, w, 4); g.fillRect(0, 0, 4, h); g.fillRect(w / 2 - 2, 0, 4, h);
  }, 'skylight');
  /** black plaque 0.5 x 0.6 m with gilt text (generic Russian text of the museum plaque, no emblem) */
  A.plaque = D(250, 300, (g, w, h) => {
    g.fillStyle = '#17181a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8923c'; g.lineWidth = 3; g.strokeRect(6, 6, w - 12, h - 12);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d8b25a';
    const lines = [['ЦЕНТРАЛЬНЫЙ', 13], ['НАУЧНО-ИССЛЕДОВАТЕЛЬСКИЙ', 9], ['ГЕОЛОГОРАЗВЕДОЧНЫЙ МУЗЕЙ', 9], ['имени академика', 11], ['Ф. Н. Чернышева', 13], ['', 0], ['ВСЕРОССИЙСКАЯ', 12], ['ГЕОЛОГИЧЕСКАЯ БИБЛИОТЕКА', 9]];
    let y = 30; for (const [t, s] of lines) { if (!t) { y += 20; continue; } let sz = s; g.font = `600 ${sz}px ${F.serif}`; while (sz > 6 && g.measureText(t).width > w - 24) { sz -= 0.5; g.font = `600 ${sz}px ${F.serif}`; } g.fillText(t, w / 2, y); y += sz + 12; }
  }, 'plaque');
  return A;
}
