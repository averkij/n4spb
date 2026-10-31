// landmarksPetrovskyWest/art.js - the canvas paintings of the module (every texture key starts with 'lmpwest-'; the texture cache is scene-wide).
// Photos: refs/petrovsky-west (g01..g11: the Gote works at Petrovsky pr. 20, t21..t24: the Bavaria malthouse) and refs/petrovsky-zhdanovka-2026/misc (m09 the Almaz office).  Tiles (80 px per metre unless noted):
//   ruinBay   one 3.4 x 3.2 m bay of the malthouse: red brick with white lime streaks, an EMPTY window 1.0 x 1.35 m (dark, a splintered frame, pale stone sill and lintel)   ruinPlain  the same brick without a window
//   hallBay   one 5.1 x 6.6 m bay of the Gote hall lit. V: limestone plinth, brick pilasters, a tall arched window with a dark many-paned glazing, a dentil frieze under the eaves (hallWall(..., false) draws the same wall without a window)
//   board     the weatherboard siding of the Gote mansion (1 m tile, board lap 0.14 m)   mansionWin  one tall window with its wide casing (1.8 x 2.7 m)   basement  the rusticated stone basement (1 m tile)
//   tower     the yellow plaster of the water tower with weathering streaks   almazBay / almazBay0  the Almaz office: white window panels between yellow piers (4.0 x 3.4 m), the ground floor with grilles
//   relief    the two-tier stone relief of workers at the corner (3.2 x 3.4 m)   signs     plain wordmark plates: АЛМАЗ and СУДОСТРОИТЕЛЬНАЯ ФИРМА (blue letters, no emblem)
//   corr      grey corrugated sheet (hoarding fence, cabins)   zincRoof  grey standing-seam sheet roof (1.2 m ribs)
const TAU = Math.PI * 2;
export const RNG = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
export const PXM = 80;

export function makeArt(ctx) {
  const tex = ctx.tex, A = {};
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmpwest-' + key, repeat });
  const speckle = (g, w, h, seed, n, a = 0.1, size = 2.5) => { const r = RNG(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,32'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * size, 1 + r() * size); } };
  const streaks = (g, w, h, seed, n, a = 0.1, col = '90,86,76') => { const r = RNG(seed); for (let i = 0; i < n; i++) { const x = r() * w, len = h * (0.2 + r() * 0.6), y0 = r() * h * 0.5; const gr = g.createLinearGradient(0, y0, 0, y0 + len); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x, y0, 1.5 + r() * 4, len); } };

  // ------------------------------------------------------------------------------------------ brick
  /** laid brick: course height ch px, brick length bl px; base colour jitter, light mortar */
  const brick = (g, x0, y0, w, h, seed, o = {}) => {
    const r = RNG(seed), ch = o.ch || 6.2, bl = o.bl || 20, base = o.base || [178, 84, 54], jit = o.jit ?? 18;
    g.fillStyle = o.mortar || '#7d5a49'; g.fillRect(x0, y0, w, h);
    for (let row = 0, y = y0; y < y0 + h; row++, y += ch) {
      const off = (row % 2) * bl / 2;
      for (let x = x0 - off; x < x0 + w; x += bl) {
        const k = (r() - 0.5) * jit, rr = base[0] + k, gg = base[1] + k * 0.55, bb = base[2] + k * 0.45;
        g.fillStyle = `rgb(${rr | 0},${gg | 0},${bb | 0})`;
        const xa = Math.max(x0, x + 0.7), xb = Math.min(x0 + w, x + bl - 0.7), yb = Math.min(y0 + h, y + ch - 0.8);
        if (xb > xa && yb > y) g.fillRect(xa, y, xb - xa, yb - y);
      }
    }
  };
  /** white lime / efflorescence patches that run down from the sills and the top */
  const lime = (g, w, h, seed, n, a = 0.2, holes = []) => {
    const r = RNG(seed);
    for (let i = 0; i < n; i++) {
      const x = r() * w, y = r() * h, rx = 3 + r() * 11, ry = 5 + r() * 24;
      g.fillStyle = `rgba(${236 + (r() * 16 | 0)},${230 + (r() * 16 | 0)},${220 + (r() * 16 | 0)},${a * (0.4 + r() * 0.8)})`;
      g.beginPath(); g.ellipse(x, y, rx, ry, (r() - 0.5) * 0.5, 0, TAU); g.fill();
    }
  };

  const BW = 272, BH = 256;                                  // 3.4 x 3.2 m at 80 px/m
  const ruinWall = (g, w, h, seed, withWin) => {
    brick(g, 0, 0, w, h, seed);
    lime(g, w, h, seed + 1, 30, 0.1);
    if (withWin) {
      const wx = 96, ww = 80, wy = 68, wh = 112;           // opening 1.0 x 1.4 m, sill at 0.95 m
      g.fillStyle = '#c7bca4'; g.fillRect(wx - 10, wy - 14, ww + 20, 12);                 // pale stone lintel
      g.fillStyle = '#d4cab4'; g.fillRect(wx - 10, wy + wh + 2, ww + 20, 9);              // sill
      g.fillStyle = '#b9ae96'; g.fillRect(wx - 6, wy - 3, 6, wh + 5); g.fillRect(wx + ww, wy - 3, 6, wh + 5);   // jambs
      g.fillStyle = '#1f1b19'; g.fillRect(wx, wy, ww, wh);                                 // the empty opening
      const gr = g.createLinearGradient(wx, wy, wx + ww, wy + wh); gr.addColorStop(0, 'rgba(120,110,100,0.45)'); gr.addColorStop(0.55, 'rgba(60,54,50,0.1)'); gr.addColorStop(1, 'rgba(110,100,90,0.35)');
      g.fillStyle = gr; g.fillRect(wx, wy + 14, ww, wh - 22);                                // the far wall inside
      g.strokeStyle = '#7a5e44'; g.lineWidth = 3; g.strokeRect(wx + 3, wy + 3, ww - 6, wh - 6);    // the old frame, hanging
      g.beginPath(); g.moveTo(wx + ww / 2, wy + 3); g.lineTo(wx + ww / 2, wy + wh * 0.62); g.moveTo(wx + 3, wy + wh * 0.38); g.lineTo(wx + ww - 3, wy + wh * 0.38); g.stroke();
      g.fillStyle = 'rgba(70,60,48,0.4)'; g.fillRect(wx + ww * 0.55, wy + wh * 0.4, ww * 0.4, wh * 0.6);  // a half-fallen sash
      const st = g.createLinearGradient(0, wy + wh, 0, wy + wh + 60); st.addColorStop(0, 'rgba(235,228,214,0.30)'); st.addColorStop(1, 'rgba(235,228,214,0)'); g.fillStyle = st; g.fillRect(wx - 6, wy + wh + 10, ww + 12, 60);
    }
    streaks(g, w, h, seed + 2, 12, 0.14, '60,36,28'); speckle(g, w, h, seed + 3, 260, 0.08, 2.2);
  };
  A.ruinBay = D(BW, BH, (g, w, h) => ruinWall(g, w, h, 9101, true), 'ruinBay');
  A.ruinPlain = D(BW, BH, (g, w, h) => ruinWall(g, w, h, 9111, false), 'ruinPlain');

  // ------------------------------------------------------------------------------------------ Gote hall lit. V (photos g01 g09)
  const HW = 306, HH = 396;                                  // 5.1 x 6.6 m at 60 px/m
  const hallWall = (g, w, h, seed, win) => {
    brick(g, 0, 0, w, h, seed, { ch: 4.6, bl: 16, base: [166, 70, 44], jit: 20, mortar: '#8a6a58' });
    const r = RNG(seed + 7);
    g.fillStyle = '#d0c6b0'; g.fillRect(0, h - 54, w, 54);                                           // limestone plinth 0.9 m
    g.fillStyle = 'rgba(70,64,54,0.35)'; for (let x = 0; x < w; x += 78) g.fillRect(x, h - 54, 1.5, 54); g.fillRect(0, h - 56, w, 2);
    g.fillStyle = 'rgba(130,52,30,0.55)'; g.fillRect(0, 0, 24, h - 54); g.fillRect(w - 24, 0, 24, h - 54);   // the pilasters at both edges of the bay (a little redder)
    g.fillStyle = 'rgba(90,40,26,0.45)'; g.fillRect(24, 0, 2, h - 54); g.fillRect(w - 26, 0, 2, h - 54);
    // dentil frieze 0.7 m under the eaves
    g.fillStyle = '#a24a30'; g.fillRect(0, 12, w, 40);
    for (let x = 0; x < w; x += 12) { g.fillStyle = '#7b3220'; g.fillRect(x, 24, 7, 8); g.fillStyle = '#b05a3a'; g.fillRect(x + 7, 36, 5, 9); }
    g.fillStyle = '#9a4a32'; g.fillRect(0, 50, w, 5); g.fillStyle = 'rgba(60,30,20,0.5)'; g.fillRect(0, 56, w, 3);
    if (win) {
      const cx = w / 2, ww = 138, wTop = 98, wBot = h - 54 - 84, rr = ww / 2;                       // arched window 2.3 m wide, springline at wTop + rr
      g.fillStyle = '#c9bfa8'; g.beginPath(); g.moveTo(cx - ww / 2 - 9, wBot + 4); g.lineTo(cx - ww / 2 - 9, wTop + rr); g.arc(cx, wTop + rr, rr + 9, Math.PI, 0, false); g.lineTo(cx + ww / 2 + 9, wBot + 4); g.closePath(); g.fill();   // pale brick / stone arch ring
      g.fillStyle = '#d6ccb6'; g.fillRect(cx - ww / 2 - 14, wBot + 4, ww + 28, 7);                    // sill
      g.fillStyle = '#26282a'; g.beginPath(); g.moveTo(cx - ww / 2, wBot); g.lineTo(cx - ww / 2, wTop + rr); g.arc(cx, wTop + rr, rr, Math.PI, 0, false); g.lineTo(cx + ww / 2, wBot); g.closePath(); g.fill();
      g.save(); g.beginPath(); g.moveTo(cx - ww / 2, wBot); g.lineTo(cx - ww / 2, wTop + rr); g.arc(cx, wTop + rr, rr, Math.PI, 0, false); g.lineTo(cx + ww / 2, wBot); g.closePath(); g.clip();
      const gl = g.createLinearGradient(cx - ww / 2, wTop, cx + ww / 2, wBot); gl.addColorStop(0, '#6c7f8a'); gl.addColorStop(0.5, '#3a464e'); gl.addColorStop(1, '#4e5e68');
      g.fillStyle = gl; g.fillRect(cx - ww / 2, wTop, ww, wBot - wTop);
      g.fillStyle = 'rgba(210,226,236,0.22)'; g.beginPath(); g.moveTo(cx - ww / 2, wTop); g.lineTo(cx + ww * 0.3, wTop); g.lineTo(cx - ww / 2, wTop + (wBot - wTop) * 0.5); g.fill();
      g.strokeStyle = '#1a1a1a'; g.lineWidth = 3;                                                        // the steel glazing bars: 5 columns x 9 rows
      for (let i = 1; i < 5; i++) { const x = cx - ww / 2 + ww * i / 5; g.beginPath(); g.moveTo(x, wTop); g.lineTo(x, wBot); g.stroke(); }
      for (let j = 1; j < 9; j++) { const y = wTop + (wBot - wTop) * j / 9; g.beginPath(); g.moveTo(cx - ww / 2, y); g.lineTo(cx + ww / 2, y); g.stroke(); }
      g.strokeStyle = '#1a1a1a'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, wTop); g.lineTo(cx, wBot); g.stroke();
      g.restore();
    }
    lime(g, w, h, seed + 3, 10, 0.1); streaks(g, w, h, seed + 4, 10, 0.12, '60,36,28'); speckle(g, w, h, seed + 5, 200, 0.07, 2);
    void r;
  };
  A.hallBay = D(HW, HH, (g, w, h) => hallWall(g, w, h, 9201, true), 'hallBay');

  // ------------------------------------------------------------------------------------------ the wooden mansion (photos g06 g07 g11)
  A.board = D(128, 128, (g, w, h) => {                       // lap siding: 8 boards per metre-ish (tile = 1 m), painted pinkish tan
    g.fillStyle = '#b0927c'; g.fillRect(0, 0, w, h);
    const bh = h / 7;
    for (let i = 0; i < 7; i++) {
      const y = i * bh; g.fillStyle = i % 2 ? '#b69881' : '#ac8e78'; g.fillRect(0, y, w, bh);
      g.fillStyle = 'rgba(255,240,226,0.32)'; g.fillRect(0, y, w, 2.4); g.fillStyle = 'rgba(70,46,34,0.42)'; g.fillRect(0, y + bh - 3.2, w, 3.2);
    }
    speckle(g, w, h, 9301, 160, 0.06, 2);
  }, 'board');
  A.basement = D(128, 128, (g, w, h) => {                    // rusticated stone basement: horizontal rustication grooves every 0.5 m, a vertical joint now and then
    g.fillStyle = '#b28f7a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) { const y = i * 64; g.fillStyle = 'rgba(70,44,34,0.45)'; g.fillRect(0, y, w, 4); g.fillStyle = 'rgba(255,238,220,0.28)'; g.fillRect(0, y + 4, w, 3); }
    g.fillStyle = 'rgba(70,44,34,0.35)'; g.fillRect(40, 4, 3, 60); g.fillRect(100, 68, 3, 60);
    streaks(g, w, h, 9311, 8, 0.1); speckle(g, w, h, 9312, 300, 0.1, 2.2);
  }, 'basement');
  A.mansionWin = D(144, 216, (g, w, h) => {                  // 1.8 x 2.7 m: wide casing (same tan as the wall), a tall window 1.1 x 2.1 m in black frames: lower casement of 3 x 3 panes, a transom, a fixed top
    g.fillStyle = '#c4a58c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d2b69e'; g.fillRect(4, 4, w - 8, 8); g.fillRect(4, h - 18, w - 8, 10);          // lintel board and sill
    g.fillStyle = 'rgba(60,38,28,0.5)'; g.fillRect(4, 12, w - 8, 2); g.fillRect(4, h - 20, w - 8, 2);
    const x0 = 28, x1 = w - 28, y0 = 26, y1 = h - 28;
    g.fillStyle = '#24262a'; g.fillRect(x0 - 4, y0 - 4, x1 - x0 + 8, y1 - y0 + 8);
    const gl = g.createLinearGradient(x0, y0, x1, y1); gl.addColorStop(0, '#7b909b'); gl.addColorStop(0.5, '#33414a'); gl.addColorStop(1, '#52636e');
    g.fillStyle = gl; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    g.fillStyle = 'rgba(214,230,240,0.24)'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + (x1 - x0) * 0.8, y0); g.lineTo(x0, y0 + (y1 - y0) * 0.5); g.fill();
    g.strokeStyle = '#1c1d20'; g.lineWidth = 3.4;
    const mid = (x0 + x1) / 2, tr = y0 + (y1 - y0) * 0.3;
    g.beginPath(); g.moveTo(mid, y0); g.lineTo(mid, y1); g.moveTo(x0, tr); g.lineTo(x1, tr); g.stroke();
    g.lineWidth = 2.2; g.beginPath();
    for (let j = 1; j < 3; j++) { const y = tr + (y1 - tr) * j / 3; g.moveTo(x0, y); g.lineTo(x1, y); }
    for (const [a, b] of [[x0, mid], [mid, x1]]) for (let i = 1; i < 2; i++) { const x = a + (b - a) * i / 2; g.moveTo(x, tr); g.lineTo(x, y1); }
    g.stroke();
  }, 'mansionWin');

  // ------------------------------------------------------------------------------------------ the water tower
  A.tower = D(128, 128, (g, w, h) => {                       // chrome-cream plaster (g02 g09) with grey streaks and a horizontal band joint every 1.6 m (tile = 3.2 m)
    g.fillStyle = '#d6c47e'; g.fillRect(0, 0, w, h);
    const r = RNG(9401);
    for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,248,214' : '150,130,80'},${0.08 + r() * 0.1})`; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 24, 8 + r() * 20, r() * TAU, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(110,92,52,0.28)'; g.fillRect(0, h / 2 - 1, w, 2); g.fillRect(0, 0, w, 2);
    streaks(g, w, h, 9402, 12, 0.14, '100,86,50'); speckle(g, w, h, 9403, 220, 0.07, 2);
  }, 'tower');

  // ------------------------------------------------------------------------------------------ the Almaz office (photo m09)
  const AW = 320, AH = 272;                                  // 4.0 x 3.4 m at 80 px/m
  const almaz = (g, w, h, seed, ground) => {
    g.fillStyle = ground ? '#c9c4b0' : '#e4d9a0'; g.fillRect(0, 0, w, h);                          // yellow stucco piers
    g.fillStyle = ground ? '#dcd8cc' : '#eeeae0'; g.fillRect(40, 0, 240, h);                        // the white vertical panel with the window pair
    g.fillStyle = 'rgba(120,108,70,0.25)'; g.fillRect(40, 0, 3, h); g.fillRect(277, 0, 3, h);
    const wy = 62, wh = 136, ww = 84;
    for (const x0 of [64, 172]) {
      g.fillStyle = '#c9c4b4'; g.fillRect(x0 - 5, wy - 5, ww + 10, wh + 10);
      const gl = g.createLinearGradient(x0, wy, x0 + ww, wy + wh); gl.addColorStop(0, '#9fb2bd'); gl.addColorStop(0.5, '#56666f'); gl.addColorStop(1, '#6d7e88');
      g.fillStyle = gl; g.fillRect(x0, wy, ww, wh);
      g.fillStyle = 'rgba(230,238,244,0.28)'; g.beginPath(); g.moveTo(x0, wy); g.lineTo(x0 + ww * 0.8, wy); g.lineTo(x0, wy + wh * 0.5); g.fill();
      g.fillStyle = '#e9e7e0'; g.fillRect(x0 + ww / 2 - 2.5, wy, 5, wh); g.fillRect(x0, wy + wh * 0.3, ww, 5);
      if (ground) { g.strokeStyle = '#2a2c2e'; g.lineWidth = 2.4; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(x0 + ww * i / 5, wy); g.lineTo(x0 + ww * i / 5, wy + wh); g.stroke(); } for (let j = 1; j < 4; j++) { g.beginPath(); g.moveTo(x0, wy + wh * j / 4); g.lineTo(x0 + ww, wy + wh * j / 4); g.stroke(); } }
      g.fillStyle = '#d8d3c4'; g.fillRect(x0 - 8, wy + wh + 5, ww + 16, 7);                       // sill
    }
    streaks(g, w, h, seed, 8, 0.12, '110,98,60'); speckle(g, w, h, seed + 1, 160, 0.07, 2);
  };
  A.almazBay = D(AW, AH, (g, w, h) => almaz(g, w, h, 9501, false), 'almazBay');
  A.almazBay0 = D(AW, AH, (g, w, h) => almaz(g, w, h, 9511, true), 'almazBay0');
  A.relief = D(256, 272, (g, w, h) => {                      // two tiers (3.2 x 1.7 m each) of stone relief: rows of workers (hard hats, overalls, tools, ring buoys), shadowed and lit like a carving (photo m09)
    const r = RNG(9521);
    g.fillStyle = '#b4b1a8'; g.fillRect(0, 0, w, h);
    for (let tier = 0; tier < 2; tier++) {
      const y0 = tier * h / 2, th = h / 2;
      g.fillStyle = '#8c8980'; g.fillRect(0, y0 + th - 8, w, 8); g.fillStyle = '#d6d3ca'; g.fillRect(0, y0, w, 5);
      for (let k = 0; k < 5; k++) {
        const x = 30 + k * 49 + (r() - 0.5) * 8, base = y0 + th - 10, hgt = 94 + r() * 18, wd = 34 + r() * 6, lean = (r() - 0.5) * 8;
        const fig = (dx, dy, col) => {
          g.fillStyle = col;
          g.beginPath(); g.ellipse(x + dx + lean * 0.3, base - hgt + dy, 9.5, 11, 0, 0, TAU); g.fill();                                  // head
          g.beginPath(); g.moveTo(x + dx - wd / 2 + lean, base - hgt + 10 + dy); g.lineTo(x + dx + wd / 2 + lean, base - hgt + 10 + dy); g.lineTo(x + dx + wd * 0.42, base - 8 + dy); g.lineTo(x + dx - wd * 0.42, base - 8 + dy); g.closePath(); g.fill();   // torso and legs
          g.fillRect(x + dx - wd / 2 - 5 + lean, base - hgt + 16 + dy, 9, hgt * 0.42);                                                    // an arm hanging
          g.save(); g.translate(x + dx + wd / 2 + lean, base - hgt + 16 + dy); g.rotate(-0.7 + (k % 3) * 0.5); g.fillRect(0, -4, hgt * 0.46, 8); g.restore();   // the raised arm with a tool
        };
        fig(4, 3, '#6d6a62'); fig(0, 0, '#dad7cd');                                                                                       // a dark shadow offset, then the lit figure
        g.fillStyle = '#9f9c92'; g.beginPath(); g.ellipse(x + lean * 0.3, base - hgt - 4, 11, 7, 0, Math.PI, 0); g.fill();               // hard hat
        g.fillStyle = 'rgba(80,76,68,0.45)'; g.fillRect(x + wd * 0.1 + lean, base - hgt + 12, wd * 0.36, hgt * 0.62);
        if (k % 3 === 1) { g.strokeStyle = '#8e8b82'; g.lineWidth = 6; g.beginPath(); g.arc(x + 17, base - hgt * 0.42, 10, 0, TAU); g.stroke(); g.strokeStyle = '#efece3'; g.lineWidth = 2; g.beginPath(); g.arc(x + 16, base - hgt * 0.42 - 1, 10, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
      }
    }
    streaks(g, w, h, 9522, 8, 0.1); speckle(g, w, h, 9523, 260, 0.1, 2);
  }, 'relief');
  A.signs = D(512, 256, (g, w, h) => {                       // row 0: АЛМАЗ (big, blue); row 1: СУДОСТРОИТЕЛЬНАЯ ФИРМА (smaller, blue on pale grey)
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0)'; g.fillRect(0, 0, w, h);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#2255a8'; g.font = '700 110px "Noto Sans", "Segoe UI", Arial, sans-serif'; g.fillText('АЛМАЗ', w / 2, 62);
    g.fillStyle = '#d7dadc'; g.fillRect(0, 150, w, 106);
    g.fillStyle = '#2255a8'; g.font = '700 33px "Noto Sans", "Segoe UI", Arial, sans-serif'; g.fillText('СУДОСТРОИТЕЛЬНАЯ ФИРМА', w / 2, 203);
  }, 'signs');

  // ------------------------------------------------------------------------------------------ sheet goods
  A.corr = D(128, 128, (g, w, h) => {                        // grey corrugated sheet, vertical ribs every 0.2 m (tile 1 m)
    g.fillStyle = '#8f9796'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 25.6) { g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(x, 0, 6, h); g.fillStyle = 'rgba(40,46,46,0.28)'; g.fillRect(x + 12, 0, 6, h); }
    streaks(g, w, h, 9601, 6, 0.1); speckle(g, w, h, 9602, 120, 0.06, 2);
  }, 'corr');
  A.fence = D(256, 64, (g, w, h) => {                        // black cast-iron fence panel (tile 2.4 x 1.45 m): spear pickets every 0.15 m between two rails, a ring ornament in the middle (alpha cut-out)
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#26282b';
    const n = 16, pw = w / n;
    for (let i = 0; i < n; i++) { const x = (i + 0.5) * pw; g.fillRect(x - 1.1, 7, 2.2, h - 7); g.beginPath(); g.moveTo(x - 2.6, 9); g.lineTo(x, 1); g.lineTo(x + 2.6, 9); g.closePath(); g.fill(); }
    g.fillRect(0, 14, w, 3.4); g.fillRect(0, h - 12, w, 3.6);
    g.strokeStyle = '#26282b'; g.lineWidth = 2; g.beginPath(); g.arc(w / 2, h * 0.5, 9, 0, TAU); g.stroke(); g.beginPath(); g.arc(w * 0.25, h * 0.5, 6, 0, TAU); g.stroke(); g.beginPath(); g.arc(w * 0.75, h * 0.5, 6, 0, TAU); g.stroke();
  }, 'fence');
  A.zincRoof = D(128, 128, (g, w, h) => {                    // light-grey standing seam, ribs every 0.6 m (tile 1.2 m)
    g.fillStyle = '#b6bcc0'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 64) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x, 0, 4, h); g.fillStyle = 'rgba(70,78,84,0.28)'; g.fillRect(x + 4, 0, 3, h); }
    streaks(g, w, h, 9611, 6, 0.08); speckle(g, w, h, 9612, 100, 0.05, 2);
  }, 'zincRoof');
  return A;
}
