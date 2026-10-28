// landmarksMenshikov/art.js - the canvas paintings of the module (docs/research/menshikov.md sections 2-5; photos refs/menshikov 01 03 13 15 21 24 47 48 50 79 84 95 98 103 109 110 114 N09 N16).
//   plaster   neutral warm-white mottled plaster (multiplied by the wall colour: palace chrome yellow, Corps salmon, R2 peach) with faint rain streaks;  gran   pink-grey granite;  lime   limestone slabs
//   win*      small-pane sashes (Dutch glazing: 3 x 5, 3 x 4 panes, the round-headed dormer, the oval) on dark glass with a sky reflection;  diamond / seam   roof sheet (rhombs / standing seams)
//   brick     red-brown herringbone court paving;  gravel   pinkish garden gravel;  lawn   mown grass;  setts   fan-laid granite setts of the apron;  hedge   clipped privet
//   scroll    cast-iron band of C-scrolls (fence panels, alpha cut-out);  rings   the ring-and-meander railing of the Neva embankment (alpha);  plaque   the obelisk plaque and the museum plate
//   trophy    white marble trophy relief;  bed   red salvia / silver cineraria flower bed;  ivory   guard-chain hoops (no texture)
// Every key starts with 'lmmensh-' (the texture cache is scene-wide: a prefix that matches another module silently takes its textures).
const TAU = Math.PI * 2;
export const COL = {
  wallY: '#e9ae34', cream: '#f0e6c6', plinth: '#8d8a82', column: '#efe5cc', door: '#43301f', iron: '#2c3036', vase: '#1f2226', gold: '#d9a520', crown: '#25282a', crownBand: '#d8c27a',
  canopy: '#4b5566', roofLow: '#6e7b78', roofTop: '#4f5654', roofWing: '#7b8f80', brickRed: '#a85a45', lime: '#b9b4a4', hedge: '#4e7a3a',
  salmon: '#de8674', salmonBase: '#cb8478', peach: '#dcba8d', whiteP: '#f2f0e8', corpsRoof: '#a8654a', corpsZinc: '#9aa3a8', chimney: '#c4553f',
  granite: '#a8928a', graniteDark: '#6c7078', obeliskShaft: '#6f776f', marblePink: '#c9a89c', fence: '#2e3a36', gravel: '#c5ab94', lawn: '#6c9a44', bronzeBlue: '#74807f', setts: '#6a6d70', pylon: '#c9a08c',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {}, C = COL;
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmmensh-' + key, repeat });
  const R = (seed) => ctx.rng(seed);
  const F = tex.FONTS;
  const speckle = (g, w, h, seed, n, a = 0.1, size = 2.5) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,32'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * size, 1 + r() * size * 0.8); } };

  // ------------------------------------------------------------------------------------------ plaster (neutral, tiles 3 m)
  A.plaster = D(256, 256, (g, w, h) => {
    const r = R(9101);
    g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { const x = r() * w, y = r() * h, s = 14 + r() * 40; g.fillStyle = `rgba(${r() < 0.5 ? '210,200,180' : '255,255,250'},${0.05 + r() * 0.08})`; g.beginPath(); g.ellipse(x, y, s, s * (0.5 + r() * 0.6), r() * TAU, 0, TAU); g.fill(); }
    for (let i = 0; i < 5; i++) { const x = r() * w; g.fillStyle = `rgba(120,100,70,${0.02 + r() * 0.025})`; g.fillRect(x, 0, 3 + r() * 8, h); }       // faint rain streaks
    speckle(g, w, h, 9102, 700, 0.07, 2);
  }, 'plaster');
  /** weathered plaster for the Corps: the same with darker damp patches near the bottom (u = along, v up: tile 3 m) */
  A.plasterOld = D(256, 256, (g, w, h) => {
    const r = R(9111);
    g.fillStyle = '#f2ede4'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 120; i++) { const x = r() * w, y = r() * h, s = 10 + r() * 38; g.fillStyle = `rgba(${r() < 0.55 ? '190,168,140' : '255,252,244'},${0.05 + r() * 0.1})`; g.beginPath(); g.ellipse(x, y, s, s * (0.4 + r() * 0.7), r() * TAU, 0, TAU); g.fill(); }
    for (let i = 0; i < 18; i++) { const x = r() * w, y = r() * h * 0.5; g.fillStyle = `rgba(110,90,66,${0.05 + r() * 0.07})`; g.fillRect(x, y, 2 + r() * 6, h - y); }
    speckle(g, w, h, 9112, 900, 0.09, 3);
  }, 'plasterOld');
  /** rusticated stucco base (tile 2.64 m x 2.64 m: eight courses of 0.33 m, blocks 0.9 m with staggered joints, a few peeling patches) */
  A.rust = D(256, 256, (g, w, h) => {
    const r = R(9115), ch = h / 8;
    g.fillStyle = '#f1ece4'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const x = r() * w, y = r() * h, s = 10 + r() * 30; g.fillStyle = `rgba(${r() < 0.5 ? '200,170,140' : '255,252,246'},${0.06 + r() * 0.1})`; g.beginPath(); g.ellipse(x, y, s, s * (0.4 + r() * 0.6), 0, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(96,70,56,0.5)';
    for (let k = 0; k < 8; k++) g.fillRect(0, k * ch, w, 3);
    g.fillStyle = 'rgba(96,70,56,0.25)';
    for (let k = 0; k < 8; k++) { const off = (k % 2) * 45; for (let x = off; x < w; x += 91) g.fillRect(x, k * ch, 2, ch); }
    for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(160,80,60,0.28)'; g.fillRect(r() * w, r() * h, 18 + r() * 40, 8 + r() * 24); }          // peeling patches showing brick
    speckle(g, w, h, 9116, 500, 0.07, 3);
  }, 'rust');
  A.gran = D(256, 256, (g, w, h) => {
    const r = R(9121);
    g.fillStyle = '#e9e1dc'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '120,100,96' : '255,248,244'},${0.08 + r() * 0.16})`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2.2); }
    g.strokeStyle = 'rgba(80,66,62,0.35)'; g.lineWidth = 1.5;
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
    for (let row = 0; row < 4; row++) for (let c = 0; c < 2; c++) { const x = c * 128 + (row % 2) * 64; g.beginPath(); g.moveTo(x, row * 64); g.lineTo(x, row * 64 + 64); g.stroke(); }
  }, 'gran');
  A.lime = D(256, 128, (g, w, h) => {                       // thin limestone slabs 0.9 x 0.18 m, light beige
    const r = R(9131);
    g.fillStyle = '#9a9684'; g.fillRect(0, 0, w, h);
    const rows = 4, rh = h / rows;
    for (let row = 0; row < rows; row++) for (let c = -1; c < 4; c++) {
      const x = c * 64 + (row % 2) * 32 + r() * 4, v = 0.93 + r() * 0.12;
      g.fillStyle = `rgb(${224 * v | 0},${219 * v | 0},${200 * v | 0})`; g.fillRect(x + 1, row * rh + 1, 62, rh - 2);
    }
    speckle(g, w, h, 9132, 300, 0.08);
  }, 'lime');
  // ------------------------------------------------------------------------------------------ windows (u 0..1, v 0..1 over the opening; panes ~0.33 x 0.38 m)
  const sash = (name, cols, rows, o = {}) => D(o.w ?? 96, o.h ?? 192, (g, w, h) => {
    const m = o.m ?? 3;
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#3c4854'); gr.addColorStop(0.45, '#2a323b'); gr.addColorStop(1, '#4b5a68');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(150,175,195,0.22)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.7, 0); g.lineTo(w * 0.1, h * 0.55); g.lineTo(0, h * 0.55); g.fill();   // sky reflection
    g.strokeStyle = o.bar ?? '#ece6d4'; g.lineWidth = o.lw ?? 3;
    for (let i = 1; i < cols; i++) { g.beginPath(); g.moveTo(w * i / cols, 0); g.lineTo(w * i / cols, h); g.stroke(); }
    for (let j = 1; j < rows; j++) { g.beginPath(); g.moveTo(0, h * j / rows); g.lineTo(w, h * j / rows); g.stroke(); }
    g.lineWidth = m * 2; g.strokeRect(0, 0, w, h);                                                             // the sash frame
    if (o.mid) { g.lineWidth = 5; g.beginPath(); g.moveTo(0, h * o.mid); g.lineTo(w, h * o.mid); g.stroke(); }  // transom
  }, name);
  A.winTall = sash('winTall', 3, 5, { mid: 0.5 });          // palace ground storey / piano nobile
  A.winLow = sash('winLow', 3, 4, { h: 144 });              // palace second storey
  A.winBrown = sash('winBrown', 3, 5, { bar: '#5a4d3d', mid: 0.5 });
  A.winCorps = sash('winCorps', 2, 4, { bar: '#f2efe6', w: 80, h: 180, lw: 3 });      // the Corps: white two-leaf sashes with a transom row
  A.winArch = sash('winArch', 2, 5, { bar: '#f2efe6', w: 80, h: 200, lw: 3 });        // round-headed ground-floor windows
  A.winDormer = sash('winDormer', 2, 3, { w: 64, h: 96, bar: '#d9d2bf' });
  A.winOval = D(96, 64, (g, w, h) => { g.fillStyle = '#2d3640'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(150,175,195,0.25)'; g.fillRect(0, 0, w, h * 0.4); g.strokeStyle = '#f0ead8'; g.lineWidth = 4; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke(); g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); }, 'winOval');
  A.winOculus = D(64, 64, (g, w, h) => { g.fillStyle = '#2b333c'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(150,175,195,0.25)'; g.fillRect(0, 0, w, h * 0.45); g.strokeStyle = '#ece6d4'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); }, 'winOculus');
  A.cellar = D(64, 32, (g, w, h) => { g.fillStyle = '#1e2429'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a3d40'; g.lineWidth = 3; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(w * i / 6, 0); g.lineTo(w * i / 6, h); g.stroke(); } }, 'cellar');
  // ------------------------------------------------------------------------------------------ roofs
  A.diamond = D(256, 256, (g, w, h) => {                     // tile 0.9 x 0.6 m: one rhomb per tile, light seams
    g.fillStyle = '#e4e8e6'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(250,255,255,0.95)'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w, h / 2); g.lineTo(w / 2, h); g.lineTo(0, h / 2); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(0, 0); g.lineTo(w / 2, -h / 2); g.moveTo(w / 2, 0); g.moveTo(0, h); g.lineTo(w / 2, h * 1.5); g.stroke();
    g.beginPath(); g.moveTo(w, 0); g.lineTo(w / 2, -h / 2); g.moveTo(w, h); g.lineTo(w / 2, h * 1.5); g.stroke();
    speckle(g, w, h, 9141, 260, 0.05);
  }, 'diamond');
  A.seam = D(128, 128, (g, w, h) => {                        // standing seams every 0.6 m (tile 0.6 x 0.6 m), a few lighter sheets
    const r = R(9151);
    g.fillStyle = '#ece9e4'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(70,50,40,0.28)'; g.fillRect(0, 0, 4, h); g.fillRect(w - 2, 0, 2, h);
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(4, 0, 4, h);
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '90,60,40' : '255,240,230'},0.07)`; g.fillRect(r() * w, r() * h, 3, 8 + r() * 20); }
  }, 'seam');
  // ------------------------------------------------------------------------------------------ ground
  A.brick = D(256, 256, (g, w, h) => {                       // herringbone, tile 1.6 m: bricks 0.2 x 0.1 m
    const r = R(9161);
    g.fillStyle = '#6f4a3c'; g.fillRect(0, 0, w, h);
    const bw = 32, bh = 16;
    for (let j = 0; j < 16; j++) for (let i = -1; i < 8; i++) {
      const v = 0.86 + r() * 0.22, x = i * bw + (j % 2) * bw / 2, y = j * bh;
      g.fillStyle = `rgb(${166 * v | 0},${98 * v | 0},${80 * v | 0})`; g.fillRect(x + 1, y + 1, bw - 2, bh - 2);
    }
    speckle(g, w, h, 9162, 500, 0.06);
  }, 'brick');
  A.gravel = D(256, 256, (g, w, h) => {
    const r = R(9171);
    g.fillStyle = '#c7ae98'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = r(); g.fillStyle = v < 0.4 ? 'rgba(130,108,92,0.35)' : v < 0.7 ? 'rgba(236,222,206,0.4)' : 'rgba(168,140,118,0.4)'; g.fillRect(r() * w, r() * h, 1 + r() * 2.4, 1 + r() * 2); }
  }, 'gravel');
  A.lawn = D(256, 256, (g, w, h) => {
    const r = R(9181);
    g.fillStyle = '#6a9843'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '96,140,58' : '120,160,70'},0.28)`; g.beginPath(); g.ellipse(r() * w, r() * h, 8 + r() * 26, 6 + r() * 16, r() * TAU, 0, TAU); g.fill(); }
    for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '58,100,36' : '150,186,92'},0.4)`; g.fillRect(r() * w, r() * h, 1, 2 + r() * 3); }
  }, 'lawn');
  A.setts = D(512, 512, (g, w, h) => {                       // fan-laid granite setts (tile 2.8 m): rows of 0.1 m setts on arcs; one big fan from the bottom middle, two quarter fans from the top corners (photos 103 109)
    const r = R(9191);
    g.fillStyle = '#4a4d52'; g.fillRect(0, 0, w, h);
    const S = 17, step = 19;
    const fan = (cx, cy, a0, a1, rmax, tone) => {
      let row = 0;
      for (let rad = 12; rad < rmax; rad += step, row++) {
        const n = Math.max(8, Math.floor(rad * (a1 - a0) / (S + 1.5))), rt = tone * (row % 2 ? 0.97 : 1.03);
        for (let i = 0; i < n; i++) {
          const a = a0 + (i + 0.5) * (a1 - a0) / n, x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
          if (x < -14 || x > w + 14 || y < -14 || y > h + 14) continue;
          const v = (0.84 + r() * 0.28) * rt;
          g.fillStyle = `rgb(${(104 + (r() - 0.5) * 14) * v | 0},${106 * v | 0},${112 * v | 0})`; g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2); g.fillRect(-S / 2, -S / 2, S, S * 0.97); g.restore();
        }
      }
    };
    fan(w / 2, h, Math.PI, 2 * Math.PI, h * 1.25, 1.0);
    fan(0, 0, 0, Math.PI / 2, h * 0.62, 0.95); fan(w, 0, Math.PI / 2, Math.PI, h * 0.62, 0.95);
    speckle(g, w, h, 9192, 1200, 0.06);
  }, 'setts');
  A.paving = D(128, 128, (g, w, h) => {                      // pale grey paver tiles 0.5 m (the apron's granite flags / pavement)
    const r = R(9201);
    g.fillStyle = '#8a8e92'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const v = 0.92 + r() * 0.14; g.fillStyle = `rgb(${176 * v | 0},${178 * v | 0},${180 * v | 0})`; g.fillRect(i * 32 + 1, j * 32 + 1, 30, 30); }
    speckle(g, w, h, 9202, 200, 0.06);
  }, 'paving');
  A.hedge = D(128, 128, (g, w, h) => {
    const r = R(9211);
    g.fillStyle = '#4a7436'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) { const v = r(); g.fillStyle = v < 0.34 ? 'rgba(36,70,28,0.5)' : v < 0.7 ? 'rgba(98,148,66,0.5)' : 'rgba(130,176,86,0.45)'; g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 5, 2 + r() * 4, r() * TAU, 0, TAU); g.fill(); }
  }, 'hedge');
  A.bed = D(128, 128, (g, w, h) => {                         // red salvia
    const r = R(9221);
    g.fillStyle = '#6c1612'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) { g.fillStyle = r() < 0.7 ? 'rgba(210,38,28,0.85)' : r() < 0.5 ? 'rgba(236,70,48,0.8)' : 'rgba(88,120,50,0.7)'; g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 3.4, 3 + r() * 5, r() * TAU, 0, TAU); g.fill(); }
  }, 'bed');
  A.bedEdge = D(64, 64, (g, w, h) => {                       // silvery-grey cineraria
    const r = R(9231);
    g.fillStyle = '#9aa6a0'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? 'rgba(200,210,204,0.8)' : 'rgba(130,146,138,0.7)'; g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 3, 2 + r() * 3, r() * TAU, 0, TAU); g.fill(); }
  }, 'bedEdge');
  // ------------------------------------------------------------------------------------------ iron
  /**
   * cast-iron fence panels (white strokes on transparent: the material colours them).  One tile = one panel: u 0..1 = `lenM` metres, v 0..1 = `hM` metres of ironwork.
   * o: pitch (m between the bars), fl (every fl-th bar ends in a fleur-de-lis, the others in spears), rails [heights above the bottom, m], scrollLo [y0, y1] (m above the bottom: the band of C-scrolls),
   * scrollHi [y0, y1] (a second band just under the top), heart (a lyre / heart shape in the panel centre), top (height of the tips, m).
   */
  const ironPanel = (key, lenM, hM, o) => D(Math.round(lenM * 190), Math.round(hM * 190), (g, w, h) => {
    const ppm = w / lenM, bar = Math.max(2.4, o.bar * ppm), P = o.pitch * ppm, tipH = (o.top ?? 0.16) * ppm;
    g.clearRect(0, 0, w, h); g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff'; g.lineWidth = bar; g.lineCap = 'round'; g.lineJoin = 'round';
    const Y = (m) => h - m * ppm;                                                  // height above the bottom -> canvas y
    const n = Math.round(lenM / o.pitch);
    for (let i = 0; i <= n; i++) {                                                  // the bars with their tips
      const x = Math.min(w - bar / 2, Math.max(bar / 2, i * P));
      g.beginPath(); g.moveTo(x, tipH); g.lineTo(x, h); g.stroke();
      if (i % (o.fl || 4) === (o.fl || 4) - 1 && o.fl !== 0) {                    // fleur-de-lis: a diamond bud with two curling petals
        g.beginPath(); g.moveTo(x, tipH * 0.1); g.quadraticCurveTo(x + tipH * 0.28, tipH * 0.55, x, tipH); g.quadraticCurveTo(x - tipH * 0.28, tipH * 0.55, x, tipH * 0.1); g.fill();
        g.beginPath(); g.moveTo(x, tipH); g.bezierCurveTo(x + tipH * 0.55, tipH * 0.85, x + tipH * 0.5, tipH * 0.35, x + tipH * 0.28, tipH * 0.4); g.stroke();
        g.beginPath(); g.moveTo(x, tipH); g.bezierCurveTo(x - tipH * 0.55, tipH * 0.85, x - tipH * 0.5, tipH * 0.35, x - tipH * 0.28, tipH * 0.4); g.stroke();
      } else {                                                                      // spear head
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x + tipH * 0.2, tipH * 0.62); g.lineTo(x + bar * 0.4, tipH * 0.62); g.lineTo(x + bar * 0.4, tipH); g.lineTo(x - bar * 0.4, tipH); g.lineTo(x - bar * 0.4, tipH * 0.62); g.lineTo(x - tipH * 0.2, tipH * 0.62); g.closePath(); g.fill();
      }
    }
    for (const m of o.rails) { g.lineWidth = bar * 1.5; g.beginPath(); g.moveTo(0, Y(m)); g.lineTo(w, Y(m)); g.stroke(); }
    g.lineWidth = bar * 0.85;
    const spiral = (cx, cy, r, dir) => { g.beginPath(); for (let t = 0; t <= 1.0001; t += 0.07) { const a = dir * (t * 5.4) + (dir > 0 ? Math.PI : 0), rr = r * (1 - 0.78 * t), x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; if (t === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke(); };
    const band = (y0m, y1m) => {                                                   // S-scrolls between every second pair of bars
      const yc = Y((y0m + y1m) / 2), r = Math.min((y1m - y0m) * ppm * 0.42, P * 0.9);
      for (let i = 0; i < n; i += 2) { const x = (i + 1) * P; spiral(x - r * 0.9, yc, r, 1); spiral(x + r * 0.9, yc, r, -1); }
    };
    if (o.scrollLo) band(o.scrollLo[0], o.scrollLo[1]);
    if (o.scrollHi) band(o.scrollHi[0], o.scrollHi[1]);
    if (o.heart) {                                                                  // the lyre / heart in the middle of the panel
      const cx = w / 2, y0 = Y(o.scrollLo ? o.scrollLo[1] : hM * 0.6), y1 = Y(o.scrollLo ? o.scrollLo[0] : hM * 0.2), hh = y1 - y0;
      g.lineWidth = bar * 1.1; g.beginPath(); g.moveTo(cx, y0); g.bezierCurveTo(cx + hh * 0.46, y0 - hh * 0.05, cx + hh * 0.46, y0 + hh * 0.7, cx, y1); g.bezierCurveTo(cx - hh * 0.46, y0 + hh * 0.7, cx - hh * 0.46, y0 - hh * 0.05, cx, y0); g.stroke();
    }
  }, key);
  A.fenceGarden = ironPanel('fenceGarden', 2.6, 1.7, { pitch: 0.12, bar: 0.014, fl: 4, rails: [0.04, 1.45], scrollLo: [0.22, 0.74], scrollHi: [1.1, 1.38], heart: true, top: 0.2 });
  A.fencePalace = ironPanel('fencePalace', 2.8, 1.75, { pitch: 0.14, bar: 0.016, fl: 4, rails: [0.04, 0.3, 1.5], scrollLo: [0.34, 0.74], heart: false, top: 0.22 });
  A.gateLeaf = ironPanel('gateLeaf', 1.6, 2.2, { pitch: 0.12, bar: 0.016, fl: 3, rails: [0.04, 0.3, 1.9], scrollLo: [0.4, 1.0], scrollHi: [1.4, 1.8], heart: false, top: 0.26 });
  /** the embankment railing of the descent: two rows of interlocking rings and a meander on top (u 0..1 = 5.5 m, v 0..1 = 0.9 m) */
  A.rings = D(512, 96, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#ffffff'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(0, h - 2); g.lineTo(w, h - 2); g.stroke(); g.beginPath(); g.moveTo(0, 2); g.lineTo(w, 2); g.stroke();
    g.beginPath(); g.moveTo(0, 22); g.lineTo(w, 22); g.stroke();
    // meander (Greek key) between y 2 and 22
    g.beginPath(); for (let x = 0; x < w; x += 20) { g.moveTo(x, 20); g.lineTo(x, 6); g.lineTo(x + 14, 6); g.lineTo(x + 14, 16); g.lineTo(x + 6, 16); g.lineTo(x + 6, 10); } g.stroke();
    // two rows of rings
    for (let row = 0; row < 2; row++) for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(i * 32 + 16 + (row ? 16 : 0), 40 + row * 24, 17, 0, TAU); g.stroke(); }
  }, 'rings');
  // ------------------------------------------------------------------------------------------ plaques / reliefs
  A.plaqueObelisk = D(256, 300, (g, w, h) => {                // the bronze plaque 1.4 x 1.6 m: gilt capitals in two lines, four bolt heads (photo 98)
    g.fillStyle = '#2a2a24'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3c4634'; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#d8aa2c'; g.textAlign = 'center'; g.textBaseline = 'middle';
    tex.fitText(g, 'РУМЯНЦОВА', w / 2, h * 0.3, w - 30, 54, F.serif, 700);
    tex.fitText(g, 'ПОБѢДАМЪ', w / 2, h * 0.66, w - 30, 54, F.serif, 700);
    for (const [x, y] of [[26, 26], [w - 26, 26], [26, h - 26], [w - 26, h - 26]]) { g.fillStyle = '#16160f'; g.beginPath(); g.arc(x, y, 12, 0, TAU); g.fill(); g.fillStyle = '#4a5240'; g.beginPath(); g.arc(x, y, 8, 0, TAU); g.fill(); }
  }, 'plaqueObelisk');
  /** a white marble trophy panel 0.6 x 0.8 (portrait): a round shield, a plumed helmet, two crossed swords (photo 98) */
  A.trophy = D(192, 256, (g, w, h) => {
    g.fillStyle = '#e4dccb'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b0a692'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
    g.strokeStyle = '#968c78'; g.fillStyle = '#d3cab8'; g.lineWidth = 4;
    g.beginPath(); g.arc(w / 2, h * 0.52, 66, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.arc(w / 2, h * 0.52, 50, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(w * 0.1, h * 0.85); g.lineTo(w * 0.9, h * 0.18); g.moveTo(w * 0.1, h * 0.18); g.lineTo(w * 0.9, h * 0.85); g.stroke();
    g.fillStyle = '#c4baa6'; g.beginPath(); g.ellipse(w / 2, h * 0.5, 34, 40, 0, Math.PI, TAU); g.fill(); g.stroke();      // the helmet bowl
    g.fillRect(w / 2 - 12, h * 0.2, 24, h * 0.3); g.strokeRect(w / 2 - 12, h * 0.2, 24, h * 0.3);                            // the crest
    g.beginPath(); g.ellipse(w / 2, h * 0.5, 40, 8, 0, 0, TAU); g.fill(); g.stroke();
  }, 'trophy');
  /** a landscape trophy relief band 1.8 x 0.55 (the three side faces): shield, helmet, cannon barrels, bundled banners, swords */
  A.trophyBand = D(512, 160, (g, w, h) => {
    g.fillStyle = '#e4dccb'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b0a692'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
    g.strokeStyle = '#968c78'; g.fillStyle = '#d3cab8'; g.lineWidth = 3;
    g.beginPath(); g.arc(w / 2, h * 0.52, 52, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.arc(w / 2, h * 0.52, 38, 0, TAU); g.stroke();
    g.beginPath(); g.ellipse(w / 2, h * 0.5, 26, 30, 0, Math.PI, TAU); g.fill(); g.stroke(); g.fillRect(w / 2 - 8, h * 0.18, 16, h * 0.3); g.strokeRect(w / 2 - 8, h * 0.18, 16, h * 0.3);
    for (const s of [-1, 1]) {
      const cx = w / 2 + s * 150;
      g.beginPath(); g.moveTo(cx - 70, h * 0.82); g.lineTo(cx + 70, h * 0.2); g.moveTo(cx - 70, h * 0.2); g.lineTo(cx + 70, h * 0.82); g.stroke();
      g.fillStyle = '#c4baa6'; g.beginPath(); g.ellipse(cx, h * 0.5, 22, 46, 0, 0, TAU); g.fill(); g.stroke();                // a bundle of banners
      g.fillStyle = '#d3cab8'; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(cx + k * 6, h * 0.16); g.lineTo(cx + k * 6, h * 0.84); g.stroke(); }
      g.fillRect(s > 0 ? w - 90 : 20, h * 0.34, 70, 22); g.strokeRect(s > 0 ? w - 90 : 20, h * 0.34, 70, 22);              // a cannon barrel
    }
  }, 'trophyBand');
  /** the bronze laurel wreath with its two palm sprays (white leaves on transparent: the material colours them; 2.0 x 0.8 m) */
  A.laurel = D(320, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.strokeStyle = '#ffffff'; g.lineCap = 'round';
    const leaf = (x, y, a, l, wd) => { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.ellipse(l / 2, 0, l / 2, wd, 0, 0, TAU); g.fill(); g.restore(); };
    const cx = w / 2, cy = h * 0.58, R = 34;
    g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
    for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; leaf(cx + Math.cos(a) * R, cy + Math.sin(a) * R, a + 1.1, 20, 6); leaf(cx + Math.cos(a) * R, cy + Math.sin(a) * R, a - 1.1, 18, 5); }
    for (const sg of [-1, 1]) {                                   // a palm spray: a drooping stem with leaf pairs
      g.lineWidth = 4; g.beginPath(); g.moveTo(cx + sg * R * 0.9, cy - 6); g.quadraticCurveTo(cx + sg * 100, cy - 38, cx + sg * 150, cy - 10); g.stroke();
      for (let k = 0; k < 14; k++) {
        const t = 0.08 + k / 14 * 0.92, x = (1 - t) * (1 - t) * (cx + sg * R * 0.9) + 2 * (1 - t) * t * (cx + sg * 100) + t * t * (cx + sg * 150), y = (1 - t) * (1 - t) * (cy - 6) + 2 * (1 - t) * t * (cy - 38) + t * t * (cy - 10), a = Math.atan2(-30 * (1 - t) + 28 * t, sg * 60);
        leaf(x, y, a - sg * 0.9 + (sg < 0 ? Math.PI : 0), 22, 5); leaf(x, y, a + sg * 0.9 + (sg < 0 ? Math.PI : 0), 22, 5);
      }
    }
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(cx - 4, cy + R); g.lineTo(cx - 14, cy + R + 22); g.lineTo(cx, cy + R + 14); g.lineTo(cx + 14, cy + R + 22); g.lineTo(cx + 4, cy + R); g.fill();       // the ribbon
  }, 'laurel');
  /** a festoon of leaves for each side of the plaque (0.6 x 1.2 m, hangs from the top corner of a trophy panel): a drop along the plaque and a swag (photo 98) */
  A.festoon = D(160, 320, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.strokeStyle = '#ffffff'; g.lineCap = 'round';
    const leaf = (x, y, a, l, wd) => { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.ellipse(l / 2, 0, l / 2, wd, 0, 0, TAU); g.fill(); g.restore(); };
    g.lineWidth = 4; g.beginPath(); g.moveTo(14, 6); g.lineTo(14, h * 0.88); g.stroke();                                    // the drop along the plaque edge
    for (let k = 0; k < 16; k++) { const y = 10 + k * (h * 0.86 / 16); leaf(14, y, 0.7, 24, 6); leaf(14, y, Math.PI - 0.7, 24, 6); }
    const x0 = 22, y0 = 14, x1 = w - 12, y1 = 14, cx = (x0 + x1) / 2, cy = h * 0.5;                                          // the swag: a quadratic curve from the top corner to the far top corner
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke();
    for (let k = 0; k <= 18; k++) { const t = k / 18, x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1; leaf(x, y, 1.2 + (t - 0.5), 22, 6); leaf(x, y, 1.2 + (t - 0.5) + Math.PI - 0.5, 22, 6); }
  }, 'festoon');
  A.plate = (key, lines, w, h, o = {}) => D(w, h, (g) => {
    g.fillStyle = o.bg ?? '#4d5b57'; g.fillRect(0, 0, w, h); g.strokeStyle = o.rim ?? '#7a8a84'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = o.fg ?? '#cfd8d2'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let y = 18; for (const [s, k, sz] of lines) { const hh = (h - 36) * k; tex.fitText(g, s, w / 2, y + hh / 2, w - 40, sz ?? hh * 0.8, F.serif, 700); y += hh; }
  }, key);
  void C;
  return A;
}
