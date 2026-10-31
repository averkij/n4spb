// landmarksZhdanovka/art.js - the canvas paintings of the module (every texture key starts with 'lmzhd-'; the texture cache is scene-wide).
// Dossier docs/research/petrovsky-zhdanovka-2026.md, photos refs/petrovsky-zhdanovka-2026/misc: m02 (No. 9, the Meisner house, straight-on elevation), m01 (the entrance arch of No. 9 / the yellow ashlar wall of No. 11),
// m05 (No. 7, salmon plaster), m03 (No. 3, olive plaster, mansard and corner turret), m04 (a neighbour for colour).
// The WINDOWS ARE GEOMETRY (geom.js: holes in the wall, reveals, a recessed glass quad), so the wall paintings carry plaster only:
//   pebble  seamless brown pebble-dash (No. 9, three upper floors; 2.0 m per tile)
//   rock    seamless rock-faced pink granite courses (No. 9 ground floor, arch rings; 2.6 m per tile)
//   frieze  the carved stucco frieze of No. 9 (one mask per 1.95 m tile)
//   tiles   an atlas of repeating floor tiles (160 px = 2.94 m wide, 55 px/m): plain plaster with its string courses, rustication, rosettes: No. 7 / 11 / 3 and the courtyard wall; rows are used through
//           M.<name> virtual materials (kit.js ATLAS ROWS: u repeats, v 0..1 over the floor height)
//   det     an atlas of details of No. 9: cobbled reveal, oriel glass front and side, the carved oak door, the dormer window, the apron plaster
//   win     an atlas of 16 window / shop-window pictures (128 x 256 px each: frame, mullions, glass, curtains), the recessed glass quads
//   rails   the black cast-iron balcony railing (alpha cut-out) of the balconies of No. 7 and No. 3.
const TAU = Math.PI * 2;
export const RNG = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };

const mix = (a, b, t) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const jit = (h, r, a) => mix(h, r() < 0.5 ? '#000000' : '#ffffff', a * r());

/** one mullioned window picture in the box x, y, w, h: frame colour, glass (dark teal sky reflection), optional curtains / blinds, a transom light and a small grid */
function windowAt(g, x, y, w, h, o = {}) {
  const fr = o.frame || '#5b4630', gl = o.glass || '#46606e', fw = o.fw ?? 3;
  g.fillStyle = fr; g.fillRect(x, y, w, h);
  const gx = x + fw, gy = y + fw, gw = w - 2 * fw, gh = h - 2 * fw;
  const gr = g.createLinearGradient(gx, gy, gx + gw, gy + gh); gr.addColorStop(0, o.glass2 || '#9bb4c4'); gr.addColorStop(0.5, gl); gr.addColorStop(1, mix(gl, '#10181e', 0.35));
  g.fillStyle = gr; g.fillRect(gx, gy, gw, gh);
  if (o.curtain) { g.fillStyle = o.curtain; g.fillRect(gx, gy + gh * 0.2, gw, gh * 0.64); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(gx + gw * 0.1, gy + gh * 0.2, 2, gh * 0.64); g.fillRect(gx + gw * 0.5, gy + gh * 0.2, 2, gh * 0.64); g.fillRect(gx + gw * 0.85, gy + gh * 0.2, 2, gh * 0.64); }
  if (o.blinds) { g.fillStyle = o.blinds; g.fillRect(gx, gy + gh * 0.26, gw, gh * 0.7); g.fillStyle = 'rgba(80,60,10,0.35)'; for (let i = 1; i < 10; i++) g.fillRect(gx + gw * i / 10, gy + gh * 0.26, 1.5, gh * 0.7); }
  g.fillStyle = fr;
  const tr = o.transom ?? 0.26;                                       // the transom light: a horizontal bar and a small grid
  g.fillRect(gx, gy + gh * tr - 2, gw, 4);
  g.fillRect(gx + gw / 2 - 2, gy, 4, gh);
  if (o.grid) for (let i = 1; i < o.grid; i++) { g.fillRect(gx + gw * i / o.grid - 1, gy, 2, gh * tr); }
  if (o.sash) { g.fillRect(gx, gy + gh * 0.62 - 2, gw, 3); }
  // inner shadow: the glass sits deep in the reveal
  g.fillStyle = 'rgba(0,0,0,0.20)'; g.fillRect(x, y, w, 3); g.fillRect(x, y, 3, h);
}
/** a rock-faced block course: blocks of irregular width, jittered colour, dark joints, a light top edge */
function rockCourse(g, r, x0, x1, y, h, base, jointC, bw0 = 36, bw1 = 70) {
  let x = x0;
  while (x < x1) {
    const bw = Math.min(x1 - x, bw0 + r() * (bw1 - bw0));
    g.fillStyle = jit(base, r, 0.22); g.fillRect(x, y, bw, h);
    g.fillStyle = 'rgba(255,255,255,0.20)'; g.fillRect(x + 1, y + 1, bw - 2, 3);
    g.fillStyle = 'rgba(0,0,0,0.12)'; for (let k = 0; k < 4; k++) g.fillRect(x + 3 + r() * (bw - 10), y + 5 + r() * (h - 9), 5 + r() * 9, 2 + r() * 3);
    g.fillStyle = jointC; g.fillRect(x + bw - 1.5, y, 2.5, h);
    x += bw;
  }
  g.fillStyle = jointC; g.fillRect(x0, y + h - 2, x1 - x0, 2.5);
}

export function makeArt(ctx) {
  const tex = ctx.tex, A = {};
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmzhd-' + key, repeat });
  const speckle = (g, w, h, seed, n, a = 0.1, size = 2.5) => { const r = RNG(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,32'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * size, 1 + r() * size); } };
  const pebbleTile = (seed, base, light, dark, n = 1500) => {            // a seamless 256 px pebble-dash tile (pebbles wrap round the edges)
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), r = RNG(seed);
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < n; i++) {
      const x = r() * 256, y = r() * 256, s = 2.2 + r() * 3.4, col = r() < 0.35 ? light : r() < 0.55 ? dark : jit(base, r, 0.3);
      for (const dx of [0, 256, -256]) for (const dy of [0, 256, -256]) { if (x + dx < -8 || x + dx > 264 || y + dy < -8 || y + dy > 264) continue; g.fillStyle = col; g.beginPath(); g.ellipse(x + dx, y + dy, s, s * (0.7 + r() * 0.4), r() * TAU, 0, TAU); g.fill(); }
    }
    return c;
  };

  // ============================================================================================== pebble: seamless pebble-dash (2.0 m per tile)
  A.pebble = D(256, 256, (g) => { const c = pebbleTile(9301, '#765a58', '#8e706a', '#5e4547', 2100); g.drawImage(c, 0, 0); speckle(g, 256, 256, 9302, 60, 0.05, 2); }, 'pebble');

  // ============================================================================================== rock: seamless rock-faced pink granite courses (512 px = 3.2 m wide, 2.6 m tall = 4 courses of 0.65 m)
  A.rock = D(512, 416, (g, w, h) => {
    const r = RNG(9311), ch = h / 4;
    for (let k = 0; k < 4; k++) {
      let x = -r() * 60; const y = k * ch;
      while (x < w) { const bw = 90 + r() * 120; g.fillStyle = jit('#9a7b78', r, 0.22); g.fillRect(x, y, bw, ch); g.fillStyle = 'rgba(255,255,255,0.20)'; g.fillRect(x + 1, y + 1, bw - 2, 4);
        g.fillStyle = 'rgba(0,0,0,0.12)'; for (let q = 0; q < 6; q++) g.fillRect(x + 4 + r() * (bw - 14), y + 8 + r() * (ch - 16), 6 + r() * 14, 3 + r() * 5);
        g.fillStyle = 'rgba(60,36,38,0.72)'; g.fillRect(x + bw - 2, y, 3.5, ch); x += bw; }
      g.fillStyle = 'rgba(60,36,38,0.72)'; g.fillRect(0, y + ch - 3, w, 3.5);
    }
    // the blocks wrap in x: copy the seam
    const seam = g.getImageData(0, 0, 6, h); g.putImageData(seam, w - 6, 0);
  }, 'rock');

  // ============================================================================================== frieze: the carved stucco frieze of No. 9 (one mask per tile, 1.95 x 0.75 m)
  A.frieze = D(390, 150, (g, w, h) => {
    const r = RNG(9104);
    g.fillStyle = '#5a4642'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { const xx = r() * w, yy = 14 + r() * (h - 28); g.strokeStyle = r() < 0.5 ? '#8e8a78' : '#6f6a5c'; g.lineWidth = 2 + r() * 2.5; for (const dx of [0, w, -w]) { g.beginPath(); g.arc(xx + dx, yy, 5 + r() * 10, r() * TAU, r() * TAU + 3.2); g.stroke(); } }
    g.fillStyle = '#8b8574'; g.beginPath(); g.ellipse(w / 2, h / 2, 26, 38, 0, 0, TAU); g.fill();
    g.fillStyle = '#4b4438'; g.fillRect(w / 2 - 12, h / 2 - 12, 8, 8); g.fillRect(w / 2 + 5, h / 2 - 12, 8, 8); g.fillRect(w / 2 - 6, h / 2 + 8, 12, 6);
    g.fillStyle = '#3d312e'; g.fillRect(0, 0, w, 5); g.fillRect(0, h - 6, w, 6);
    speckle(g, w, h, 9105, 160, 0.07, 2.4);
  }, 'frieze');

  // ============================================================================================== plinth: polished rose granite slabs (256 x 208 px = 1.9 x 1.3 m: two slabs side by side)
  A.plinth = D(256, 208, (g, w, h) => {
    const r = RNG(9331);
    for (let k = 0; k < 2; k++) {
      const x = k * w / 2; g.fillStyle = jit('#a88a86', r, 0.10); g.fillRect(x, 0, w / 2, h);
      const gr = g.createLinearGradient(x, 0, x + w / 2, h); gr.addColorStop(0, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(60,30,30,0.10)'); g.fillStyle = gr; g.fillRect(x, 0, w / 2, h);
      for (let i = 0; i < 120; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,230,225,0.22)' : 'rgba(70,40,40,0.20)'; g.fillRect(x + r() * w / 2, r() * h, 1 + r() * 3, 1 + r() * 2); }
      g.fillStyle = 'rgba(50,30,30,0.6)'; g.fillRect(x + w / 2 - 2, 0, 3, h);
    }
    g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(0, 0, w, 3);
  }, 'plinth');

  // ============================================================================================== tiles: the repeating floor tiles (plain plaster, 160 px = 2.94 m)
  const TW = 160, PXM = 54.4, T = {};
  const wallBase = (g, w, h, col, seed) => { const r = RNG(seed); g.fillStyle = col; g.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,250,240' : '60,40,30'},${0.012 + r() * 0.022})`; const x = r() * w, y = r() * h, rx = 14 + r() * 40, ry = 8 + r() * 22, a = r() * TAU; for (const dx of [0, w, -w]) { g.beginPath(); g.ellipse(x + dx, y, rx, ry, a, 0, TAU); g.fill(); } } speckle(g, w, h, seed + 1, 140, 0.05, 2); };
  const oval = (g, cx, cy, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(70,50,40,0.5)'; g.lineWidth = 1.5; g.stroke(); };
  // ---- No. 7 (salmon plaster #d9a58a, cream trim): ground floor, floors 2, 3, 4
  const S7 = '#d9a58a', C7 = '#ece0cc';
  T.o7g = [4.2, (g, w, h) => {
    wallBase(g, w, h, '#d29c80', 7101);
    g.fillStyle = '#c28f76'; for (let y = 38; y < h - 50; y += 33) g.fillRect(0, y, w, 2);                // the rusticated grooves
    g.fillStyle = '#a89a8c'; g.fillRect(0, h - 33, w, 33); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, h - 33, w, 2);
    g.fillStyle = C7; g.fillRect(0, 0, w, 14); g.fillStyle = 'rgba(80,50,40,0.35)'; g.fillRect(0, 14, w, 2);
    oval(g, 0, 40, 9, 14, '#e2c3ab'); oval(g, w, 40, 9, 14, '#e2c3ab');
    g.fillStyle = '#c9966f'; g.fillRect(0, h - 36, w, 3);
  }];
  T.o7d = [4.2, (g, w, h) => {                                                                          // the entrance bay: a double door in a cream surround instead of the shop window
    wallBase(g, w, h, '#d29c80', 7141);
    g.fillStyle = '#c28f76'; for (let y = 38; y < h - 50; y += 33) g.fillRect(0, y, w, 2);
    g.fillStyle = '#a89a8c'; g.fillRect(0, h - 33, w, 33);
    g.fillStyle = C7; g.fillRect(42, h - 150 - 33 + 33 - 36, 76, 150); g.fillStyle = '#3d2c20'; g.fillRect(48, h - 150 - 33 + 33 - 30 + 24, 64, 126 - 24); g.fillStyle = '#2f3f48'; g.fillRect(52, h - 150 - 33 + 33 - 30 + 28, 56, 40);
    g.fillStyle = '#e8dfd0'; g.fillRect(79, h - 150 - 33 + 33 - 30 + 24, 3, 126 - 24);
    g.fillStyle = C7; g.fillRect(0, 0, w, 14); g.fillStyle = 'rgba(80,50,40,0.35)'; g.fillRect(0, 14, w, 2);
  }];
  const consoles = (g, w, y, col) => { g.fillStyle = col; for (let i = 0; i < 4; i++) g.fillRect(8 + i * 38, y, 7, 10); };
  T.o7f2 = [3.7, (g, w, h) => {
    wallBase(g, w, h, S7, 7111);
    g.fillStyle = C7; g.fillRect(0, h - 12, w, 12); g.fillStyle = 'rgba(80,50,40,0.35)'; g.fillRect(0, h - 12, w, 2);
    g.fillStyle = '#e2d2bb'; g.fillRect(0, h - 25, w, 4); consoles(g, w, h - 36, '#e6d8c2');          // the plaster band with little consoles under the floor-3 sills
    g.fillStyle = C7; g.fillRect(0, 40, 6, 22); g.fillRect(w - 6, 40, 6, 22);                            // the little consoles at the cell edge
  }];
  T.o7f3 = [3.6, (g, w, h) => {
    wallBase(g, w, h, S7, 7121);
    g.fillStyle = C7; g.fillRect(0, h - 10, w, 10); g.fillStyle = 'rgba(80,50,40,0.3)'; g.fillRect(0, h - 10, w, 2);
    g.fillStyle = '#e2d2bb'; g.fillRect(0, h - 22, w, 4); consoles(g, w, h - 33, '#e6d8c2');
    g.fillStyle = C7; g.fillRect(0, 28, 6, 18); g.fillRect(w - 6, 28, 6, 18);
  }];
  T.o7f4 = [3.5, (g, w, h) => {
    wallBase(g, w, h, S7, 7131);
    g.fillStyle = C7; g.fillRect(0, 0, w, 12); g.fillStyle = 'rgba(80,50,40,0.3)'; g.fillRect(0, 12, w, 2);
  }];
  // ---- No. 11 (chrome-light yellow stucco ruled as ashlar, 1950s): ground floor rusticated, floors plain
  const S11 = '#e2d08c', C11 = '#efe5c4';
  const ashlar = (g, w, h, seed, joint) => { const r = RNG(seed); g.fillStyle = joint; const bh = 34; for (let y = bh; y < h; y += bh) g.fillRect(0, y, w, 1.6); let row = 0; for (let y = 0; y < h; y += bh, row++) { for (let x = (row % 2 ? 40 : 100); x < w; x += 118) g.fillRect(x + (r() - 0.5) * 6, y, 1.6, bh); } };
  T.o11g = [4.4, (g, w, h) => {
    wallBase(g, w, h, '#dcc57c', 1101); ashlar(g, w, h - 50, 1102, 'rgba(120,98,40,0.55)');
    g.fillStyle = '#c8bf9f'; g.fillRect(0, h - 50, w, 50); g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(0, h - 50, w, 2);
    g.fillStyle = '#e8dc9c'; g.fillRect(0, 0, w, 10);
  }];
  T.o11f = [3.5, (g, w, h) => {
    wallBase(g, w, h, S11, 1111); ashlar(g, w, h, 1112, 'rgba(140,116,50,0.40)');
    g.fillStyle = C11; g.fillRect(0, h - 8, w, 8);
  }];
  // ---- No. 3 (olive plaster #a9a58a, cream trim, garlands between the floors)
  const S3 = '#a9a58a', C3 = '#cfc8ae';
  T.o3g = [4.0, (g, w, h) => {
    wallBase(g, w, h, '#a3a085', 3101);
    g.fillStyle = '#8f8d76'; g.fillRect(0, h - 36, w, 36);
    g.fillStyle = '#b8b194'; g.fillRect(0, 8, w, 22); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 30, w, 2);
  }];
  T.o3f = [3.4, (g, w, h) => {
    wallBase(g, w, h, S3, 3111);
    oval(g, 0, 12, 7, 8, '#bdb69a'); oval(g, w, 12, 7, 8, '#bdb69a');                                   // the little garland rosettes between the windows
    g.fillStyle = C3; g.fillRect(0, h - 8, w, 8);
  }];
  // ---- the courtyard wall (plain beige plaster, one small window)
  T.court = [3.6, (g, w, h) => {
    wallBase(g, w, h, '#d6c8a6', 9201);
    windowAt(g, 56, 44, 48, 90, { frame: '#efe9dc', glass: '#3c5260', glass2: '#8fa5b3', transom: 0.25, grid: 0 });
    g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(0, 0, 3, h);
  }];
  A.TILES = T;
  const names = Object.keys(T), GAP = 8, rowPx = names.map((n) => Math.round(T[n][0] * PXM)), total = rowPx.reduce((s, v) => s + v + GAP, 0);
  A.uv = {};
  A.tiles = D(TW, total, (g, w, h) => {
    let y = 0;
    names.forEach((n, i) => {
      g.save(); g.translate(0, y); g.beginPath(); g.rect(0, 0, w, rowPx[i]); g.clip(); T[n][1](g, w, rowPx[i]); g.restore();
      A.uv[n] = { v0: 1 - (y + rowPx[i] - 0.5) / total, v1: 1 - (y + 0.5) / total, hM: T[n][0] };
      y += rowPx[i] + GAP;
    });
  }, 'tiles');

  // ============================================================================================== det: the details of No. 9 (512 px wide)
  const DET = [['cobble', 128], ['bayFront', 256], ['bayFlank', 256], ['door', 256], ['dormer', 128], ['apron', 64], ['bed', 512]];
  const detDraw = {
    cobble: (g, w, h) => { const r = RNG(9321); g.fillStyle = '#8c6a6a'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 14) { let x = -r() * 20; while (x < w) { const bw = 12 + r() * 14; g.fillStyle = jit(r() < 0.3 ? '#a9807c' : '#85686a', r, 0.25); g.fillRect(x, y, bw - 2, 12); x += bw; } } },
    bayFront: (g, w, h) => {                                             // a glazed oriel front 2.3 m x 2.4 m: ochre metal frames, mullions every 0.58 m, a transom grid in the upper third
      g.fillStyle = '#b08a4c'; g.fillRect(0, 0, w, h);
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#9fb6c4'); gr.addColorStop(0.5, '#435c6b'); gr.addColorStop(1, '#2d404b');
      for (let i = 0; i < 4; i++) { const x = 8 + i * (w - 8) / 4; g.fillStyle = gr; g.fillRect(x, 8, (w - 8) / 4 - 8, h - 16); g.fillStyle = 'rgba(230,220,200,0.35)'; if (i === 1 || i === 3) g.fillRect(x + 4, h * 0.35, (w - 8) / 4 - 16, h * 0.55); }
      g.fillStyle = '#b08a4c'; g.fillRect(0, h * 0.26, w, 6); for (let i = 1; i < 12; i++) g.fillRect(i * w / 12 - 1, 8, 2, h * 0.26 - 8);
    },
    bayFlank: (g, w, h) => { g.fillStyle = '#b08a4c'; g.fillRect(0, 0, w, h); g.fillStyle = '#3e5664'; g.fillRect(8, 8, w - 16, h - 16); g.fillStyle = 'rgba(200,216,226,0.35)'; g.fillRect(14, 14, (w - 28) * 0.4, h - 28); g.fillStyle = '#b08a4c'; g.fillRect(0, h * 0.26, w, 6); g.fillRect(w / 2 - 3, 8, 6, h - 16); },
    door: (g, w, h) => {                                                 // the carved oak double door under an arched, gridded transom, black iron straps, panels, a dark kick plate
      g.fillStyle = '#a97428'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#d8a850'; for (let i = 0; i < 9; i++) g.fillRect(6 + i * (w - 12) / 9, 4, 2, h - 8);
      g.fillStyle = '#26323a'; g.fillRect(14, 16, w - 28, h * 0.27);
      g.fillStyle = '#7e5718'; for (let i = 1; i < 6; i++) g.fillRect(14 + i * (w - 28) / 6 - 2, 16, 4, h * 0.27); g.fillRect(14, 16 + h * 0.13, w - 28, 4);
      g.fillStyle = '#222a30'; g.fillRect(14, h * 0.36, (w - 36) / 2, h * 0.5); g.fillRect(w / 2 + 4, h * 0.36, (w - 36) / 2, h * 0.5);
      g.fillStyle = 'rgba(160,190,205,0.4)'; g.fillRect(20, h * 0.38, (w - 48) / 2, h * 0.14); g.fillRect(w / 2 + 10, h * 0.38, (w - 48) / 2, h * 0.14);
      g.fillStyle = '#1b1b1d'; g.fillRect(0, h * 0.5 - 3, w, 6); g.fillRect(0, h * 0.74 - 3, w, 6); g.fillRect(0, h - 22, w, 22); g.fillRect(w / 2 - 2, h * 0.36, 4, h * 0.64);
    },
    dormer: (g, w, h) => { g.fillStyle = '#5b4a3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#34454f'; g.fillRect(10, 12, w - 20, h - 24); g.fillStyle = 'rgba(190,210,222,0.35)'; g.fillRect(14, 16, (w - 28) * 0.45, h - 32); g.fillStyle = '#5b4a3a'; for (let i = 1; i < 5; i++) g.fillRect(10 + i * (w - 20) / 5 - 1, 12, 2, h - 24); g.fillRect(10, h * 0.4, w - 20, 3); },
    apron: (g, w, h) => { wallBase(g, w, h, '#d6cdb6', 9341); },
    bed: (g, w, h) => {                                                  // a round flowerbed seen from above (square, 0..1 = the disc box): green leaves, rings of orange / red / yellow blooms (photo m17: orange bed on the Staro-Zhdanovsky lawn)
      const r = RNG(9351), cx = w / 2, cy = h / 2;
      g.fillStyle = '#4f7a3c'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.47, s = 10 + r() * 14; g.fillStyle = jit('#3f6b32', r, 0.25); g.beginPath(); g.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s, s * 0.8, r() * TAU, 0, TAU); g.fill(); }
      const cols = ['#e07a2b', '#d9452e', '#f0c43a', '#e07a2b', '#f3e2a0'];
      for (let i = 0; i < 520; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.46, s = 5 + r() * 7; g.fillStyle = cols[Math.floor(r() * cols.length)]; g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s, 0, TAU); g.fill(); }
    },
  };
  const detTotal = DET.reduce((s, [, hh]) => s + hh + 8, 0);
  A.det = D(512, detTotal, (g, w, h) => {
    let y = 0;
    for (const [n, hh] of DET) { g.save(); g.translate(0, y); g.beginPath(); g.rect(0, 0, w, hh); g.clip(); detDraw[n](g, w, hh); g.restore(); A.uv[n] = { v0: 1 - (y + hh - 0.5) / detTotal, v1: 1 - (y + 0.5) / detTotal }; y += hh + 8; }
  }, 'det');

  // ============================================================================================== win: 16 window pictures (128 x 256 px each, 4 x 4 grid)
  const doorAt = (g, x, y, w, h, o) => {                                   // a double door with a gridded transom, two glazed panels and a kick plate
    g.fillStyle = o.door; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, y, w, 3); g.fillRect(x, y, 3, h);
    g.fillStyle = o.glass; g.fillRect(x + 12, y + 12, w - 24, h * 0.2); g.fillStyle = o.door; for (let i = 1; i < 5; i++) g.fillRect(x + 12 + i * (w - 24) / 5 - 1.5, y + 12, 3, h * 0.2);
    g.fillRect(x + 12, y + 12 + h * 0.1 - 1.5, w - 24, 3);
    for (const q of [0, 1]) { const px = x + 14 + q * (w / 2 - 6); g.fillStyle = o.glass; g.fillRect(px, y + h * 0.3, w / 2 - 22, h * 0.28); g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(px + 4, y + h * 0.3 + 4, (w / 2 - 22) * 0.4, h * 0.28 - 8); g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(px, y + h * 0.66, w / 2 - 22, h * 0.26); }
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + w / 2 - 2, y + h * 0.22, 4, h * 0.78); g.fillStyle = '#c9a86a'; g.fillRect(x + w / 2 - 9, y + h * 0.56, 4, 12); g.fillRect(x + w / 2 + 5, y + h * 0.56, 4, 12);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x, y + h - 20, w, 20);
  };
  const WIN = [
    ['g9a', { frame: '#7d6238', glass: '#52687a', glass2: '#b3c8d6', curtain: '#d8d2c0', transom: 0.27, grid: 3 }],
    ['g9b', { frame: '#7d6238', glass: '#52687a', glass2: '#b3c8d6', transom: 0.27, grid: 3 }],
    ['g9c', { frame: '#7d6238', glass: '#52687a', glass2: '#b3c8d6', curtain: '#c4cfd6', transom: 0.27, grid: 3 }],
    ['g9g', { frame: '#6b4a2b', glass: '#4b6370', glass2: '#a9c0cc', blinds: '#cdb44e', transom: 0.22, grid: 3, fw: 5 }],
    ['g7a', { frame: '#4d3b2a', glass: '#415867', glass2: '#9bb3c2', transom: 0.25, grid: 2, curtain: '#e6dccb' }],
    ['g7b', { frame: '#4d3b2a', glass: '#415867', glass2: '#9bb3c2', transom: 0.25, grid: 2 }],
    ['g7c', { frame: '#4d3b2a', glass: '#415867', glass2: '#9bb3c2', transom: 0.25, grid: 2, curtain: '#b9c7cf' }],
    ['g7s', { frame: '#e8dfd0', glass: '#2f3f48', glass2: '#7d93a0', transom: 0.18, grid: 2, fw: 4 }],
    ['g11a', { frame: '#f1ebd8', glass: '#415867', glass2: '#9bb3c2', transom: 0.25, grid: 2 }],
    ['g11b', { frame: '#f1ebd8', glass: '#415867', glass2: '#9bb3c2', transom: 0.25, grid: 2, curtain: '#e8e2d2' }],
    ['g11c', { frame: '#f1ebd8', glass: '#415867', glass2: '#9bb3c2', transom: 0.25, grid: 2, curtain: '#bcc9d0' }],
    ['g11s', { frame: '#e8e0cc', glass: '#34464f', glass2: '#8aa0ac', transom: 0.2, grid: 2, fw: 4 }],
    ['g3a', { frame: '#4f4533', glass: '#415867', glass2: '#9bb3c2', transom: 0.25, grid: 2 }],
    ['g3b', { frame: '#4f4533', glass: '#415867', glass2: '#9bb3c2', transom: 0.25, grid: 2, curtain: '#ddd6c2' }],
    ['g3c', { frame: '#4f4533', glass: '#415867', glass2: '#9bb3c2', transom: 0.25, grid: 2, curtain: '#bcc9d0' }],
    ['g3s', { frame: '#c9c2a8', glass: '#2f3f48', glass2: '#7d93a0', transom: 0.16, grid: 3, fw: 4 }],
    ['gd1', { door: '#5a3a22', glass: '#2d3f4a' }], ['gd2', { door: '#2e4a3a', glass: '#27363f' }], ['gd3', { door: '#e8e0cc', glass: '#34464f' }], ['gd4', { door: '#3b2c24', glass: '#2d3f4a' }],
  ];
  A.WIN = {};
  A.win = D(512, 1280, (g, w, h) => {
    WIN.forEach(([n, o], i) => {
      const cx = (i % 4) * 128, cy = Math.floor(i / 4) * 256;
      if (o.door) doorAt(g, cx, cy, 128, 256, o); else windowAt(g, cx, cy, 128, 256, o);
      A.WIN[n] = { u0: (cx + 1) / w, u1: (cx + 127) / w, v0: 1 - (cy + 255) / h, v1: 1 - (cy + 1) / h };
    });
  }, 'win');
  Object.assign(A.uv, A.WIN);

  // ============================================================================================== signs: plain shop fascia boards (generic words, no brands, no logos), 512 x 128 px each, 8 in one column
  const WORDS = ['АПТЕКА', 'КАФЕ', 'ПРОДУКТЫ', 'ЦВЕТЫ', 'ПАРИКМАХЕРСКАЯ', 'ХИМЧИСТКА', 'КЛИНИКА', 'КНИГИ'], SB = ['#2d3a42', '#3a3036', '#27403a', '#33384a', '#2d3a42', '#46362c', '#2d3a42', '#2f3b33'];
  A.SIGN = {};
  A.signs = D(512, 1024, (g, w, h) => {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    WORDS.forEach((t, i) => {
      const y = i * 128; g.fillStyle = SB[i]; g.fillRect(0, y, w, 128); g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(0, y, w, 5); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, y + 120, w, 8);
      let sz = 78; g.font = `700 ${sz}px "Noto Sans", "Segoe UI", Arial, sans-serif`; while (sz > 28 && g.measureText(t).width > 440) { sz -= 4; g.font = `700 ${sz}px "Noto Sans", "Segoe UI", Arial, sans-serif`; }
      g.fillStyle = '#efe9da'; g.fillText(t, w / 2, y + 66);
      A.SIGN['sg' + i] = { u0: 0.002, u1: 0.998, v0: 1 - (y + 127) / h, v1: 1 - (y + 1) / h };
    });
  }, 'signs');
  Object.assign(A.uv, A.SIGN);

  // ============================================================================================== rails: black cast-iron balcony railing (alpha), 256 x 128, repeats per 1.5 m
  A.rails = D(256, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#1d1b1c'; g.fillStyle = '#1d1b1c'; g.lineCap = 'round';
    g.lineWidth = 7; g.beginPath(); g.moveTo(0, 8); g.lineTo(w, 8); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(0, h - 6); g.lineTo(w, h - 6); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(0, 26); g.lineTo(w, 26); g.stroke();
    for (let i = 0; i < 8; i++) {
      const x = 16 + i * 32; g.lineWidth = 5; g.beginPath(); g.moveTo(x, 8); g.lineTo(x, h - 6); g.stroke();
      g.lineWidth = 3.5; g.beginPath(); g.ellipse(x + 16, h * 0.56, 10, 24, 0, 0, TAU); g.stroke();
      g.beginPath(); g.arc(x + 16, h * 0.56 - 24, 4, 0, TAU); g.fill();
    }
  }, 'rails');
  return A;
}
