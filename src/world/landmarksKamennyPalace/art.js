// landmarksKamennyPalace/art.js - the canvas paintings of the module (dossier docs/research/kamenny-2026.md 5.1; photos P05 P08 P11 P12 P19 P20 P22 P23).
//   plaster  neutral stucco (multiplied by the wall colour: pale yellow #e9cf8c);  ashlar  the plinth: thin grey-beige limestone slabs in horizontal courses 0.3 m (tile 1.8 m), blocks 0.7 - 1.4 m;
//   copper  green copper roof: standing seams every 0.62 m, sheets 1.2 m (tile 1.24 m), verdigris variation;  flags  granite sets / flags of the gate aprons and the steps (tile 2.4 m);
//   winG / winU / winB  window sheets (u 0..1 over the opening) with white frames over dark glass: ground floor (1.35 x 2.8 m), upper (1.3 x 2.0 m), basement grille (0.7 x 0.5 m);
//   fence  one bay of the garden fence (4.0 x 1.9 m, alpha): 28 vertical bars with spear tips, three rails, lozenge chain in the lower field (P22 P23);  leaf  one gate leaf (2.2 x 3.9 m, alpha): ring chain
//   in the upper and the lower field (P20);  railX  the terrace railing (1.8 x 1.0 m, alpha): X bars and rings (P08 P04);  balust  the white roof balustrade (1.8 x 1.1 m, alpha): turned balusters;
//   crest  the gilded cipher in a laurel wreath over the main gate (P09 P20, alpha; the cipher is a stylised scroll, no readable letters);  doorBrown  a plain door.
// Every key starts with 'lmkpal-' (the texture cache is scene-wide: a prefix that matches another module silently takes its textures).
const TAU = Math.PI * 2;
export const COL = {
  wall: '#f6e3a8', white: '#f1eee6', surround: '#bcc5c6', plinth: '#c4c2b6', copper: '#6e9a86', copperEdge: '#5b8672', iron: '#23272b', gold: '#d9ae3e', granite: '#a9a49c', cobble: '#9a8e88',
  glass: '#2c353d', door: '#7a5033', benchWood: '#e4e2da', lampGlass: '#eef0e8', wallDark: '#d9bf78', lime: '#c9c6bb',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {}, C = COL;
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmkpal-' + key, repeat });
  const R = (seed) => ctx.rng(seed);
  const cells = {};
  const cell = (name, w, h, fn) => { cells[name] = [w, h, fn]; };
  const speckle = (g, w, h, seed, n, a = 0.1, size = 2.5) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,32'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * size, 1 + r() * size); } };

  A.plaster = D(256, 256, (g, w, h) => {
    const r = R(8101);
    g.fillStyle = '#f6f5f1'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { const x = r() * w, y = r() * h, s = 14 + r() * 40; g.fillStyle = `rgba(${r() < 0.5 ? '212,206,190' : '255,255,255'},${0.05 + r() * 0.07})`; g.beginPath(); g.ellipse(x, y, s, s * (0.5 + r() * 0.6), r() * TAU, 0, TAU); g.fill(); }
    for (let i = 0; i < 5; i++) { const x = r() * w; g.fillStyle = `rgba(120,112,92,${0.02 + r() * 0.03})`; g.fillRect(x, 0, 3 + r() * 8, h); }       // damp streaks
    speckle(g, w, h, 8102, 600, 0.05, 2);
  }, 'plaster');

  A.ashlar = D(256, 256, (g, w, h) => {                       // the plinth: courses of ~0.3 m in a 1.8 m tile (6 courses), thin slabs 0.7 .. 1.4 m long, grey-beige with horizontal veining (P05 P11)
    const r = R(8111), ch = h / 6;
    g.fillStyle = '#d8d6cc'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 6; k++) {
      let x = -((k * 53) % 90);
      while (x < w) {
        const bw = 70 + ((k * 7 + Math.floor(x)) % 4) * 26, v = 0.92 + r() * 0.14;
        g.fillStyle = `rgb(${218 * v | 0},${214 * v | 0},${202 * v | 0})`; g.fillRect(x + 1, k * ch + 1, bw - 2, ch - 2);
        for (let i = 0; i < 3; i++) { g.fillStyle = `rgba(110,102,84,${0.05 + r() * 0.08})`; g.fillRect(x + r() * bw * 0.8, k * ch + r() * ch, 14 + r() * 40, 1.2); }
        g.fillStyle = 'rgba(80,74,60,0.5)'; g.fillRect(x, k * ch, 1.8, ch);
        x += bw;
      }
      g.fillStyle = 'rgba(80,74,60,0.55)'; g.fillRect(0, k * ch, w, 2);
    }
    speckle(g, w, h, 8112, 600, 0.07, 3);
  }, 'ashlar');

  A.copper = D(256, 256, (g, w, h) => {                       // standing-seam copper roof, verdigris green (tile 1.24 m: two seams, sheets 1.2 m long)
    const r = R(8121);
    g.fillStyle = '#e8f1ec'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const v = 0.9 + r() * 0.16; g.fillStyle = `rgba(${196 * v | 0},${226 * v | 0},${210 * v | 0},0.55)`; g.fillRect(i * 128, j * 128, 128, 128);
      g.fillStyle = 'rgba(40,70,58,0.42)'; g.fillRect(i * 128, 0, 4, h); g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(i * 128 + 4, 0, 3, h);
      g.fillStyle = 'rgba(40,70,58,0.22)'; g.fillRect(i * 128, j * 128 + 124, 128, 3);
    }
    speckle(g, w, h, 8122, 260, 0.06, 2);
  }, 'copper');

  A.flags = D(256, 256, (g, w, h) => {                        // granite flags 1.2 x 0.8 m in a 2.4 m tile
    const r = R(8131);
    g.fillStyle = '#d4d1ca'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 3; k++) for (let c = -1; c < 3; c++) {
      const x = c * 128 + (k % 2) * 64 + r() * 3, y = k * (h / 3), v = 0.9 + r() * 0.18;
      g.fillStyle = `rgb(${214 * v | 0},${211 * v | 0},${203 * v | 0})`; g.fillRect(x + 1.5, y + 1.5, 125, h / 3 - 3);
    }
    g.strokeStyle = 'rgba(80,76,70,0.5)'; g.lineWidth = 2.5;
    for (let k = 0; k <= 3; k++) { g.beginPath(); g.moveTo(0, k * (h / 3)); g.lineTo(w, k * (h / 3)); g.stroke(); }
    for (let k = 0; k < 3; k++) for (let c = 0; c < 3; c++) { const x = c * 128 + (k % 2) * 64; g.beginPath(); g.moveTo(x, k * (h / 3)); g.lineTo(x, (k + 1) * (h / 3)); g.stroke(); }
    speckle(g, w, h, 8132, 900, 0.09, 2.5);
  }, 'flags');

  A.setts = D(256, 256, (g, w, h) => {                        // cobbles of the gate aprons (P20 P22: rounded grey-brown stones)
    const r = R(8141), bw = 32, bh = 22;
    g.fillStyle = '#6c6560'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 12; j++) for (let i = -1; i < 9; i++) {
      const v = 0.88 + r() * 0.2, x = i * bw + (j % 2) * bw / 2 + (r() - 0.5) * 3, y = j * bh;
      g.fillStyle = `rgb(${(150 + (r() - 0.5) * 22) * v | 0},${(140 + (r() - 0.5) * 16) * v | 0},${(132 + (r() - 0.5) * 14) * v | 0})`;
      g.beginPath(); g.ellipse(x + bw / 2, y + bh / 2, bw / 2 - 1, bh / 2 - 1, 0, 0, TAU); g.fill();
    }
    speckle(g, w, h, 8142, 300, 0.05, 2);
  }, 'setts');

  A.dentil = D(256, 32, (g, w, h) => {                        // the dentil band: three teeth of 0.17 m with 0.17 m gaps per 1.02 m tile (vertical stripes: any v works)
    g.fillStyle = '#b4ae98'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) { g.fillStyle = '#f4f1e9'; g.fillRect(i * w / 3 + w / 12, 0, w / 6, h); g.fillStyle = 'rgba(120,112,92,0.35)'; g.fillRect(i * w / 3 + w / 12 + w / 6 - 3, 0, 3, h); }
  }, 'dentil');

  // ------------------------------------------------------------------------------------------ windows
  const glassBase = (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#46535f'); gr.addColorStop(0.5, '#27303a'); gr.addColorStop(1, '#3a4652');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(160,185,200,0.22)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.7, 0); g.lineTo(w * 0.1, h * 0.55); g.lineTo(0, h * 0.55); g.fill();
    g.fillStyle = 'rgba(235,235,228,0.2)'; g.fillRect(w * 0.1, h * 0.05, w * 0.8, h * 0.12);
  };
  const frame = (g, w, h, lw, bars) => {
    g.strokeStyle = '#f2f0ea'; g.lineWidth = lw; g.strokeRect(lw / 2, lw / 2, w - lw, h - lw);
    for (const b of bars) { g.lineWidth = b[4] || lw * 0.7; g.beginPath(); g.moveTo(b[0] * w, b[1] * h); g.lineTo(b[2] * w, b[3] * h); g.stroke(); }
  };
  /** ground-floor window 1.35 x 2.8 m: two leaves, a transom light at the top (28 %), each leaf in three panes below it */
  cell('winG', 128, 256, (g, w, h) => {
    glassBase(g, w, h);
    frame(g, w, h, 7, [[0.5, 0, 0.5, 1, 6], [0, 0.26, 1, 0.26, 6], [0, 0.52, 1, 0.52, 4], [0, 0.76, 1, 0.76, 4]]);
  });
  /** upper window 1.3 x 2.0 m: two leaves, a transom at 28 %, bars in the upper light */
  cell('winU', 128, 192, (g, w, h) => {
    glassBase(g, w, h);
    frame(g, w, h, 7, [[0.5, 0, 0.5, 1, 6], [0, 0.28, 1, 0.28, 6], [0, 0.64, 1, 0.64, 4]]);
  });
  /** basement window 0.7 x 0.5 m: a dark grille */
  cell('winB', 96, 64, (g, w, h) => {
    g.fillStyle = '#1d2226'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#8a8e92'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
    g.lineWidth = 2.5; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(i * w / 5, 0); g.lineTo(i * w / 5, h); g.stroke(); }
    g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
  });
  /** kitchen-block window 1.1 x 1.8 m: two sashes with a transom, white frame */
  cell('winK', 96, 160, (g, w, h) => {
    glassBase(g, w, h);
    frame(g, w, h, 6, [[0.5, 0, 0.5, 1, 5], [0, 0.3, 1, 0.3, 5], [0, 0.65, 1, 0.65, 3.5]]);
  });
  /** a door leaf (natural brown wood) 1.3 x 2.6 m, two panels each leaf */
  cell('door', 96, 192, (g, w, h) => {
    g.fillStyle = '#7d5436'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#4e3220'; g.lineWidth = 3;
    for (const x of [0, w / 2]) { g.strokeRect(x + 6, 8, w / 2 - 12, h * 0.4); g.strokeRect(x + 6, h * 0.5, w / 2 - 12, h * 0.44); }
    g.lineWidth = 4; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
    speckle(g, w, h, 8151, 200, 0.06, 2);
  });

  // ------------------------------------------------------------------------------------------ ironwork (alpha cut-outs)
  const spear = (g, x, y, hw, hh) => { g.beginPath(); g.moveTo(x - hw, y); g.lineTo(x, y - hh); g.lineTo(x + hw, y); g.closePath(); g.fill(); };
  /** one fence bay 4.0 x 1.9 m: 28 bars (0.14 m) with spear tips, rails at 0.06 / 0.55 / 0.93 of the height, a lozenge chain between the two lower rails, rivets */
  cell('fence', 512, 240, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'butt';
    const n = 28, bw = 5;
    const step = w / n;
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * step; g.fillRect(x - bw / 2, 22, bw, h - 22); spear(g, x, 24, 6.5, 22);
    }
    g.fillRect(0, 36, w, 8); g.fillRect(0, h * 0.5, w, 7); g.fillRect(0, h - 22, w, 8);                      // rails
    g.lineWidth = 3; for (let i = 0; i < n; i += 2) { const x0 = (i + 0.5) * step, x1 = x0 + step * 2; g.beginPath(); g.moveTo(x0, h * 0.58); g.lineTo((x0 + x1) / 2, h * 0.82); g.lineTo(x1, h * 0.58); g.stroke(); g.beginPath(); g.moveTo(x0, h * 0.82); g.lineTo((x0 + x1) / 2, h * 0.58); g.lineTo(x1, h * 0.82); g.stroke(); }
  });
  /** one gate leaf 2.2 x 3.9 m (u 0..1 across, v 0..1 up): vertical bars with spear tips, ring chain between rails at 0.30 and 0.45 from the top, big oval links in the lower field, rails */
  cell('leaf', 256, 448, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.strokeStyle = '#fff';
    const n = 15, step = w / n;
    for (let i = 0; i < n; i++) { const x = (i + 0.5) * step; g.fillRect(x - 2.6, 18, 5.2, h - 18); spear(g, x, 20, 6, 20); }
    g.fillRect(0, 28, w, 8); g.fillRect(0, h * 0.28, w, 7); g.fillRect(0, h * 0.4, w, 7); g.fillRect(0, h * 0.82, w, 7); g.fillRect(0, h - 10, w, 10);
    g.lineWidth = 4;
    for (let i = 0; i < n / 1.5; i++) { const cx = (i + 0.5) * step * 1.5; g.beginPath(); g.ellipse(cx, h * 0.34, step * 0.62, h * 0.045, 0, 0, TAU); g.stroke(); }          // the ring chain
    for (let i = 0; i < n / 2; i++) { const cx = (i + 0.5) * step * 2; g.beginPath(); g.ellipse(cx, h * 0.9, step * 0.9, h * 0.06, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(cx, h * 0.67, step * 0.5, step * 0.5, 0, 0, TAU); g.stroke(); }
    g.fillRect(0, 0, 8, h); g.fillRect(w - 8, 0, 8, h);                                                                                                    // stiles
  });
  /** terrace railing bay 1.8 x 1.0 m: top rail, bottom rail, X bars with a ring in each cross, short verticals */
  cell('railX', 512, 280, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineCap = 'round';
    g.lineWidth = 12; g.beginPath(); g.moveTo(0, 12); g.lineTo(w, 12); g.moveTo(0, h - 8); g.lineTo(w, h - 8); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(0, 34); g.lineTo(w, 34); g.stroke();
    const nx = 3, bw = w / nx;
    for (let k = 0; k < nx; k++) {
      const x0 = k * bw + 8, x1 = (k + 1) * bw - 8;
      g.lineWidth = 6; g.beginPath(); g.moveTo(x0, 40); g.lineTo(x1, h - 14); g.moveTo(x1, 40); g.lineTo(x0, h - 14); g.stroke();
      const cx = (x0 + x1) / 2, cy = (40 + h - 14) / 2; g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, 14, 0, TAU); g.stroke();
      g.lineWidth = 6; g.beginPath(); g.moveTo(k * bw + 2, 34); g.lineTo(k * bw + 2, h - 8); g.stroke();
    }
    g.lineWidth = 6; g.beginPath(); g.moveTo(w - 3, 34); g.lineTo(w - 3, h - 8); g.stroke();
  });
  /** the white roof balustrade bay 1.8 x 1.1 m: nine turned balusters (a swelling vase profile), top and bottom rail are geometry */
  cell('balust', 256, 160, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff';
    const n = 9, step = w / n;
    for (let i = 0; i < n; i++) {
      const cx = (i + 0.5) * step;
      g.beginPath(); g.moveTo(cx - 5, 0); g.lineTo(cx + 5, 0); g.lineTo(cx + 4, 20); g.quadraticCurveTo(cx + 15, 50, cx + 6, 90); g.lineTo(cx + 9, h); g.lineTo(cx - 9, h); g.lineTo(cx - 6, 90); g.quadraticCurveTo(cx - 15, 50, cx - 4, 20); g.closePath(); g.fill();
    }
  });
  /** a plain roof railing (the kitchen block roof, P12 P14): two rails, thin verticals every 0.5 m, black on a green roof */
  cell('roofRail', 256, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff';
    g.fillRect(0, 4, w, 5); g.fillRect(0, h * 0.5, w, 4); g.fillRect(0, h - 5, w, 5);
    for (let i = 0; i < 8; i++) g.fillRect(i * w / 8 + 2, 4, 4, h - 6);
  });
  /** the gilded cipher in a laurel wreath (P09): two laurel branches meeting at the foot, an oval frame, a stylised interlaced scroll monogram without letters; 2.8 x 1.9 m */
  cell('crest', 512, 350, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineCap = 'round';
    const cx = w / 2, cy = h * 0.5;
    for (const sg of [-1, 1]) {                                     // laurel branches: a curved stem and leaves along it
      g.lineWidth = 12; g.beginPath(); g.moveTo(cx, h * 0.93); g.bezierCurveTo(cx + sg * w * 0.22, h * 0.95, cx + sg * w * 0.42, h * 0.78, cx + sg * w * 0.4, h * 0.22); g.stroke();
      for (let t = 0.08; t < 0.98; t += 0.075) {
        const x = cx + sg * (w * 0.4 * Math.sin(t * 1.55) + w * 0.02), y = h * 0.93 - h * 0.7 * t;
        g.save(); g.translate(x, y); g.rotate(sg * (-0.5 - t * 0.5)); g.beginPath(); g.ellipse(sg * 16, 0, 26, 10, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(-sg * 16, 4, 22, 8.5, 0, 0, TAU); g.fill(); g.restore();
      }
    }
    g.lineWidth = 9; g.beginPath(); g.ellipse(cx, cy, w * 0.19, h * 0.34, 0, 0, TAU); g.stroke();             // the oval frame
    g.lineWidth = 14;                                              // the cipher: two interlaced scrolls
    g.beginPath(); g.moveTo(cx - 45, cy + 60); g.bezierCurveTo(cx - 70, cy - 20, cx - 30, cy - 80, cx + 5, cy - 50); g.bezierCurveTo(cx + 40, cy - 20, cx - 10, cy + 20, cx - 20, cy - 10); g.stroke();
    g.beginPath(); g.moveTo(cx + 45, cy + 62); g.bezierCurveTo(cx + 70, cy - 10, cx + 40, cy - 70, cx + 5, cy - 40); g.bezierCurveTo(cx - 20, cy - 20, cx + 20, cy + 25, cx + 25, cy + 5); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(cx - 50, cy + 66); g.quadraticCurveTo(cx, cy + 40, cx + 52, cy + 68); g.stroke();
  });
  /** the plaque on the left pier of the main gate (P20: a black board with white lettering; 0.5 x 0.35 m): the palace and the school */
  cell('plaque', 512, 360, (g, w, h) => {
    g.fillStyle = '#16191c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8c9094'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#e8e6de'; g.textAlign = 'center'; g.textBaseline = 'middle';
    tex.fitText(g, 'Каменноостровский дворец', w / 2, h * 0.30, w * 0.84, 40, tex.FONTS.serif, 400);
    tex.fitText(g, 'Академия талантов', w / 2, h * 0.62, w * 0.84, 56, tex.FONTS.serif, 700);
  });
  /** the sign over the checkpoint gate (P02: dark board, pale capitals; 3.4 x 0.42 m) */
  cell('gateSign', 1024, 128, (g, w, h) => {
    g.fillStyle = '#1b1f22'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7d8286'; g.lineWidth = 5; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#ece8d8'; g.textAlign = 'center'; g.textBaseline = 'middle';
    tex.fitText(g, 'АКАДЕМИЯ ТАЛАНТОВ', w / 2, h * 0.52, w * 0.9, 76, tex.FONTS.serif, 700);
  });
  // ------------------------------------------------------------------------------------------ the three atlases (one material each: windows + door, black / white / gilt ironwork cut-outs, signs)
  /** draw the cells of `layout` { name: [x, y] } into one canvas; tint[name] recolours the drawn pixels (source-in); returns { tex, uv: { name: [u0, v0, u1, v1] } } (v up) */
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
  const wn = pack('win', 512, 384, { winG: [0, 0], winU: [136, 0], winK: [272, 0], door: [376, 0], winB: [0, 264] });
  A.win = wn.tex; A.winUV = wn.uv;
  const ct = pack('cut', 1024, 1024, { fence: [0, 0], railX: [0, 248], crest: [0, 536], leaf: [520, 0], roofRail: [776, 0], balust: [776, 72] }, { fence: C.iron, railX: C.iron, leaf: C.iron, roofRail: C.iron, balust: C.white, crest: C.gold });
  A.cut = ct.tex; A.cutUV = ct.uv;
  const sg = pack('signs', 1024, 512, { plaque: [0, 0], gateSign: [0, 368] });
  A.signs = sg.tex; A.signsUV = sg.uv;
  return A;
}
