// landmarksPetrovskyYacht/art.js - the canvas paintings of the module (every texture key starts with 'lmpyac-'; the texture cache is scene-wide).
// Dossier docs/research/petrovsky-zhdanovka-2026.md section 10; photos refs/petrovsky-zhdanovka-2026/yacht (y01 y03 y04 y05 y06 y07 y12 y18 y19 y22) and misc (v01 v03 v04 v05).
//   Main building (crystal frame, 1969-80): conc weathered white concrete (tile 3 m)  soffit waffle slab underside (tile 2.2 m)  wallSolid solid ground-floor bay with a slot window (3.3 x 3.4 m)
//   glassGround / glassLattice ground-floor glazing (3.3 x 3.4 m)  glassFirst first-floor curtain wall with blue posts (3.3 x 3.1 m)  triBand the sloped top band: grey corrugated triangles apex up over
//   dark glass (one 3.3 m module, 3.3 x 3.78 m)  rubble the grey stone-veneer podium wall (2 m)  granite steps / paving (1.5 m)  railBlue / railWhite tube railings (alpha cut-outs).
//   Standart shed: corrugated dark green; Savina Home: yellow stucco bay with white order (see savina.js).
const TAU = Math.PI * 2;
export const RNG = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };

export function makeArt(ctx) {
  const tex = ctx.tex, A = {}, TILES = {};
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmpyac-' + key, repeat });
  const speckle = (g, w, h, seed, n, a = 0.1, size = 2.5) => { const r = RNG(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,32'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * size, 1 + r() * size); } };
  const streaks = (g, w, h, seed, n, a = 0.1) => { const r = RNG(seed); for (let i = 0; i < n; i++) { const x = r() * w, len = h * (0.2 + r() * 0.6), y0 = r() * h * 0.5; const gr = g.createLinearGradient(0, y0, 0, y0 + len); gr.addColorStop(0, `rgba(90,86,76,${a})`); gr.addColorStop(1, 'rgba(90,86,76,0)'); g.fillStyle = gr; g.fillRect(x, y0, 1.5 + r() * 4, len); } };

  // ------------------------------------------------------------------------------------------ concrete
  A.conc = D(256, 256, (g, w, h) => {                          // weathered white board-marked concrete: cast panels 0.75 m, rain streaks, a few rust and green stains
    const r = RNG(8101);
    g.fillStyle = '#e8e8e2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '170,170,162' : '250,250,246'},${0.06 + r() * 0.08})`; g.beginPath(); g.ellipse(r() * w, r() * h, 14 + r() * 40, 8 + r() * 24, r() * TAU, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(120,118,108,0.16)'; for (let k = 0; k < 4; k++) g.fillRect(0, k * h / 4, w, 1.5);
    g.fillStyle = 'rgba(120,118,108,0.10)'; g.fillRect(w / 2, 0, 1.5, h);
    streaks(g, w, h, 8102, 26, 0.12);
    for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(150,92,60,${0.05 + r() * 0.06})`; g.fillRect(r() * w, r() * h * 0.6, 2 + r() * 3, 20 + r() * 50); }
    speckle(g, w, h, 8103, 500, 0.07, 2.2);
  }, 'conc');

  A.soffit = D(256, 256, (g, w, h) => {                        // the waffle underside of the slab: square coffers 1.1 m with a 0.2 m rib
    g.fillStyle = '#c4ccd4'; g.fillRect(0, 0, w, h);
    const n = 2, cw = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      g.fillStyle = '#b4bec8'; g.fillRect(i * cw + 12, j * cw + 12, cw - 24, cw - 24);
      g.fillStyle = 'rgba(255,255,250,0.35)'; g.fillRect(i * cw + 12, j * cw + 12, cw - 24, 4); g.fillRect(i * cw + 12, j * cw + 12, 4, cw - 24);
      g.fillStyle = 'rgba(70,68,60,0.28)'; g.fillRect(i * cw + 12, j * cw + cw - 16, cw - 24, 4); g.fillRect(i * cw + cw - 16, j * cw + 12, 4, cw - 24);
    }
    speckle(g, w, h, 8111, 300, 0.07, 2);
  }, 'soffit');

  // ------------------------------------------------------------------------------------------ ground floor
  TILES.wallSolid = (g, w, h) => {                     // one 3.3 x 3.4 m bay of the solid concrete ground floor: panel joints, a tall slot window (grey, half boarded), grime at the foot
    const r = RNG(8121);
    g.fillStyle = '#cfd0c8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '150,150,140' : '235,235,228'},${0.07 + r() * 0.08})`; g.beginPath(); g.ellipse(r() * w, r() * h, 12 + r() * 34, 8 + r() * 20, r() * TAU, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(90,90,82,0.35)'; g.fillRect(0, 0, 3, h); g.fillRect(0, h * 0.34, w, 2); g.fillRect(0, h * 0.67, w, 2);
    const wx = w * 0.36, ww = w * 0.28, wy = h * 0.2, wh = h * 0.6;
    g.fillStyle = '#6f7778'; g.fillRect(wx - 5, wy - 5, ww + 10, wh + 10);
    g.fillStyle = '#44525a'; g.fillRect(wx, wy, ww, wh);
    g.fillStyle = 'rgba(190,210,222,0.30)'; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + ww * 0.8, wy); g.lineTo(wx, wy + wh * 0.5); g.fill();
    g.fillStyle = '#9aa0a0'; g.fillRect(wx, wy + wh * 0.62, ww, wh * 0.38);          // the lower sash boarded with grey sheet
    g.fillStyle = '#6f7778'; g.fillRect(wx + ww / 2 - 1.5, wy, 3, wh * 0.62); g.fillRect(wx, wy + wh * 0.3, ww, 3);
    const gr = g.createLinearGradient(0, h * 0.8, 0, h); gr.addColorStop(0, 'rgba(70,66,56,0)'); gr.addColorStop(1, 'rgba(70,66,56,0.30)'); g.fillStyle = gr; g.fillRect(0, h * 0.8, w, h * 0.2);
    streaks(g, w, h, 8122, 14, 0.12); speckle(g, w, h, 8123, 260, 0.07, 2);
  };

  const glassPane = (g, x, y, w, h, seed) => {                 // dark interior glass with a pale sky reflection
    const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#5f7886'); gr.addColorStop(0.45, '#2c3a43'); gr.addColorStop(1, '#3c4c57');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(200,222,236,0.22)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.75, y); g.lineTo(x, y + h * 0.55); g.fill();
    g.fillStyle = 'rgba(232,228,214,0.22)'; g.fillRect(x + w * 0.08, y + h * 0.04, w * 0.84, h * 0.16);          // a curtain gathered at the top
  };
  TILES.glassGround = (g, w, h) => {                   // the glazed hall: two big panes per bay, white frames, a grey kick panel
    g.fillStyle = '#e4e4de'; g.fillRect(0, 0, w, h);
    const m = 8, pw = (w - 3 * m) / 2, ph = h - 2 * m - 34;
    glassPane(g, m, m, pw, ph, 1); glassPane(g, 2 * m + pw, m, pw, ph, 2);
    g.fillStyle = '#e9e9e3'; g.fillRect(w / 2 - 3, m, 6, ph); g.fillRect(m, m + ph * 0.24, w - 2 * m, 5);
    g.fillStyle = '#c3c4bd'; g.fillRect(m, h - 34 - m + m, w - 2 * m, 34);
    g.fillStyle = 'rgba(70,70,64,0.4)'; g.fillRect(0, 0, 3, h);
  };
  TILES.glassLattice = (g, w, h) => {                  // windows with a fish-scale grille (the south front, y04)
    g.fillStyle = '#d6d6cf'; g.fillRect(0, 0, w, h);
    const m = 12, pw = (w - 3 * m) / 2, ph = h - 2 * m - 26;
    glassPane(g, m, m, pw, ph, 3); glassPane(g, 2 * m + pw, m, pw, ph, 4);
    g.strokeStyle = 'rgba(20,28,32,0.85)'; g.lineWidth = 2.2;
    for (const x0 of [m, 2 * m + pw]) for (let row = 0; row < 7; row++) for (let c = -1; c < 5; c++) {
      const cx = x0 + c * 14 + (row % 2) * 7, cy = m + 8 + row * 12; if (cx < x0 - 2 || cx > x0 + pw + 2) continue;
      g.beginPath(); g.arc(cx, cy, 7, 0, Math.PI, false); g.stroke();
    }
    g.fillStyle = '#e4e4dd'; g.fillRect(w / 2 - 3, m, 6, ph); g.fillStyle = '#c3c4bd'; g.fillRect(m, h - 26 - m + 6, w - 2 * m, 26);
    speckle(g, w, h, 8131, 120, 0.06, 2);
  };

  // ------------------------------------------------------------------------------------------ first floor and the sloped band
  TILES.glassFirst = (g, w, h) => {                    // one 3.3 x 3.1 m bay of the first-floor curtain wall: blue post on the left, two tall casements with a transom, white frames
    g.fillStyle = '#e6e6e0'; g.fillRect(0, 0, w, h);
    const post = 14, m = 6, pw = (w - post - 3 * m) / 2, ph = h - 2 * m;
    glassPane(g, post + m, m, pw, ph, 5); glassPane(g, post + 2 * m + pw, m, pw, ph, 6);
    g.fillStyle = '#e8e8e2'; g.fillRect(post + m + pw - 1, m, m + 2, ph); g.fillRect(post + m, m + ph * 0.2, w - post - 2 * m, 5);
    g.fillStyle = 'rgba(232,232,226,0.8)'; g.fillRect(post + m + pw * 0.5 - 2, m + ph * 0.2, 4, ph * 0.8); g.fillRect(post + 2 * m + pw * 1.5 - 2, m + ph * 0.2, 4, ph * 0.8);
    g.fillStyle = '#1f4ea0'; g.fillRect(0, 0, post, h);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(3, 0, 3, h);
  };

  TILES.triBand = (g, w, h) => {                       // one 3.3 m module of the sloped band: a corrugated grey triangle (apex up) between two dark glass triangles, a glass strip at the top
    const r = RNG(8141);
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#6d8fa5'); gr.addColorStop(0.5, '#3f5666'); gr.addColorStop(1, '#556f80');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(205,224,236,0.25)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.8, 0); g.lineTo(0, h * 0.5); g.fill();
    g.strokeStyle = '#6a4a3c'; g.lineWidth = 2.5;                                        // rusty glazing bars
    for (const t of [0.14, 0.30, 0.46]) { g.beginPath(); g.moveTo(0, h * t); g.lineTo(w, h * t); g.stroke(); }
    g.beginPath(); g.moveTo(w * 0.5, 0); g.lineTo(w * 0.5, h * 0.12); g.moveTo(0, 0); g.lineTo(0, h); g.moveTo(w, 0); g.lineTo(w, h); g.stroke();
    const ax = w * 0.5, ay = h * 0.13, bx0 = 0, bx1 = w, by = h;                          // the solid triangle
    const tg = g.createLinearGradient(0, ay, 0, by); tg.addColorStop(0, '#b9bdbd'); tg.addColorStop(1, '#a2a7a8');
    g.fillStyle = tg; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx1, by); g.lineTo(bx0, by); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(80,86,88,0.35)'; g.lineWidth = 1.5;                            // corrugation lines
    for (let i = 1; i < 16; i++) { const f = i / 16; g.beginPath(); g.moveTo(ax + (bx0 - ax) * f, ay + (by - ay) * f); g.lineTo(ax + (bx1 - ax) * f, ay + (by - ay) * f); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,0.28)'; for (let i = 0; i < 10; i++) { const x = ax + (r() - 0.5) * w * 0.5; g.beginPath(); g.moveTo(x, ay + 20); g.lineTo(x + (x - ax) * 0.9, by); g.stroke(); }
    g.strokeStyle = '#6a4a3c'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(bx0, by); g.lineTo(ax, ay); g.lineTo(bx1, by); g.stroke();
    const st = g.createLinearGradient(0, h * 0.7, 0, h); st.addColorStop(0, 'rgba(60,56,48,0)'); st.addColorStop(1, 'rgba(60,56,48,0.28)'); g.fillStyle = st; g.fillRect(0, h * 0.7, w, h * 0.3);
    streaks(g, w, h, 8142, 10, 0.1);
  };

  // ------------------------------------------------------------------------------------------ podium, steps
  A.rubble = D(256, 256, (g, w, h) => {                        // crazy-paving veneer of irregular grey stones in pale mortar (tile 2 m); the poly stones are jittered quads on a 5 x 6 grid
    const r = RNG(8151);
    g.fillStyle = '#9d9f98'; g.fillRect(0, 0, w, h);
    const cols = 4, rows = 5, cw = w / cols, rh = h / rows, pts = [];
    for (let j = 0; j <= rows; j++) { pts.push([]); for (let i = 0; i <= cols; i++) pts[j].push([i * cw + (i % cols === 0 ? 0 : (r() - 0.5) * cw * 0.7) + (j % 2) * cw * 0.15 * (i % cols === 0 ? 0 : 1), j * rh + (j % rows === 0 ? 0 : (r() - 0.5) * rh * 0.6)]); }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const p = [pts[j][i], pts[j][i + 1], pts[j + 1][i + 1], pts[j + 1][i]], cx = (p[0][0] + p[1][0] + p[2][0] + p[3][0]) / 4, cy = (p[0][1] + p[1][1] + p[2][1] + p[3][1]) / 4, v = 0.78 + r() * 0.42;
      g.fillStyle = `rgb(${(92 * v) | 0},${(96 * v) | 0},${(92 * v) | 0})`; g.beginPath();
      p.forEach((q, k) => { const x = cx + (q[0] - cx) * 0.95, y = cy + (q[1] - cy) * 0.95; if (k) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,250,0.10)'; g.beginPath(); g.moveTo(cx - cw * 0.3, cy - rh * 0.3); g.lineTo(cx + cw * 0.25, cy - rh * 0.34); g.lineTo(cx + cw * 0.2, cy - rh * 0.1); g.lineTo(cx - cw * 0.3, cy - rh * 0.1); g.fill();
    }
    speckle(g, w, h, 8152, 400, 0.08, 2.4);
  }, 'rubble');
  A.granite = D(256, 256, (g, w, h) => {                       // pale grey granite slabs 0.75 x 0.5 m (tile 1.5 m), worn
    const r = RNG(8161);
    g.fillStyle = '#5a5c58'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 3; j++) for (let i = -1; i < 3; i++) { const x = i * 128 + (j % 2) * 64, y = j * (h / 3), v = 0.9 + r() * 0.18; g.fillStyle = `rgb(${(186) * v | 0},${(186) * v | 0},${(180) * v | 0})`; g.fillRect(x + 2, y + 2, 124, h / 3 - 4); }
    speckle(g, w, h, 8162, 700, 0.09, 2.4);
  }, 'granite');

  // ------------------------------------------------------------------------------------------ railings (alpha cut-outs; rows of the rails atlas; one tile = 2.0 m x 1.1 m)
  const RAILS = {};
  const rail = (col, balusters, rails) => (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = col; g.strokeStyle = col;
    for (const ry of rails) g.fillRect(0, ry, w, 6);
    g.fillRect(0, 0, 8, h); g.fillRect(w - 8, 0, 8, h);
    for (let i = 0; i < balusters; i++) g.fillRect(8 + (i + 0.5) * (w - 16) / balusters - 1.5, 6, 3, h - 6);
  };
  RAILS.railBlue = rail('#2b58b4', 12, [0, 124]);
  RAILS.railWhite = (g, w, h) => {                             // the roof railing: top and mid tube, thin posts every 1.0 m
    g.clearRect(0, 0, w, h); g.fillStyle = '#dcdcd6';
    g.fillRect(0, 2, w, 6); g.fillRect(0, h * 0.5, w, 4); g.fillRect(0, h * 0.28, w, 3);
    g.fillRect(0, 0, 6, h); g.fillRect(w - 6, 0, 6, h); g.fillRect(w / 2 - 3, 0, 6, h);
  };
  A.RAILS = RAILS; A.TILES = TILES;
  return A;
}

/**
 * Atlas assembly (called by mats.js after art2.js has added its painters): the five facade tiles of the main building in ONE texture (rows of 192 px, u repeats), the alpha railings / fences / compass
 * sign in ONE texture, the three signs in ONE texture.  A.uv[name] = { v0, v1 } (texture v of the bottom / top of the row, inset by half a texel) or { u0, u1, v0, v1 } for the signs.
 */
export function makeAtlases(ctx, A) {
  const tex = ctx.tex, ROW = 192, uv = (A.uv = {});
  const D = (w, h, fn, key) => tex.draw(w, h, fn, { key: 'lmpyac-' + key, repeat: [1, 1] });
  const rows = (names, H, total) => names.forEach((n, i) => { uv[n] = { v0: 1 - (ROW * i + H[i] - 0.5) / total, v1: 1 - (ROW * i + 0.5) / total }; });
  const names = ['wallSolid', 'glassGround', 'glassLattice', 'glassFirst', 'triBand'];
  A.hallTiles = D(256, ROW * names.length, (g, w, h) => {
    names.forEach((n, i) => { g.save(); g.translate(0, ROW * i); g.beginPath(); g.rect(0, 0, w, ROW); g.clip(); A.TILES[n](g, w, ROW); g.restore(); });
  }, 'hallTiles');
  rows(names, names.map(() => ROW), ROW * names.length);
  const rn = ['railBlue', 'railWhite', 'railBal', 'wireGreen', 'railRing'], rh = [140, 140, 120, 184, 140], TOT = ROW * rn.length + 256;
  A.rails = D(256, TOT, (g, w, h) => {
    rn.forEach((n, i) => { g.save(); g.translate(0, ROW * i); g.beginPath(); g.rect(0, 0, w, rh[i]); g.clip(); (A.RAILS[n])(g, w, rh[i]); g.restore(); });
    g.save(); g.translate(0, ROW * rn.length); g.beginPath(); g.rect(0, 0, w, 256); g.clip(); A.RAILS.compass(g, 256, 256); g.restore();
  }, 'rails');
  rn.forEach((n, i) => { uv[n] = { v0: 1 - (ROW * i + rh[i] - 0.5) / TOT, v1: 1 - (ROW * i + 0.5) / TOT }; });
  uv.compass = { u0: 0.004, u1: 0.996, v0: 1 - (ROW * rn.length + 255.5) / TOT, v1: 1 - (ROW * rn.length + 0.5) / TOT };
  A.signs = D(1024, 512, (g, w, h) => {
    const put = (n, x, y, sw, sh) => { g.save(); g.translate(x, y); g.beginPath(); g.rect(0, 0, sw, sh); g.clip(); A.SIGNS[n](g, sw, sh); g.restore(); uv[n] = { u0: (x + 0.5) / w, u1: (x + sw - 0.5) / w, v0: 1 - (y + sh - 0.5) / h, v1: 1 - (y + 0.5) / h }; };
    put('savFrieze', 0, 0, 1024, 96); put('nameStandart', 0, 104, 512, 160); put('infoRops', 512, 104, 512, 300); put('plaque', 0, 272, 512, 128);
  }, 'signs');
  return A;
}
