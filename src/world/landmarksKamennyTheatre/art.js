// landmarksKamennyTheatre/art.js - the canvas paintings of the module (every key starts with 'lmkth-': the texture cache is scene-wide).  Dossier docs/research/kamenny-2026.md 5.3 and the BUILD LOG, photos T01..T13 K01..K10.
//   ashlar    the gable walls and the portico back wall: wooden boards cut as ASHLAR courses (pink-beige #D9BDA8, white joints; courses 0.4 m, blocks 1.6 m, tile 3.2 m; T06 T11 T12)
//   boards    the long walls: horizontal boards 0.2 m with rare butt joints (tile 3.2 m; T02 T04 T05)
//   granite   the stylobate / plinth: grey limestone slabs in courses of 0.3 m (tile 1.8 m; T05 T06)
//   roof      grey standing-seam sheet iron (tile 1.2 m; T13)       slate  dark blue-grey diamond slates (Kleinmichel, tile 1.0 m; K03 K09)
//   plaster   cream plaster (annex, Kleinmichel house; speckle only, the colour is the material's)     timber  the half-timber panels of the tower / hall: cream field, white members (K05 K07 K08)
//   win atlas windows and doors (decals: 1.45 x 3.0 m casement, half-round fanlights, small / ground windows, white lattice doors, annex glazing, louvres, vent grille, the hall gable)
//   cut atlas iron fence bay, gate leaf, roof railing, white balusters, the fretwork balustrade (alpha cut-outs, tinted per cell)
//   signs atlas the bronze plaques at the portico doors and the three posters of the round BDT kiosk
const TAU = Math.PI * 2;
export const COL = {
  pink: '#d9bda8', joint: '#eee4d8', white: '#f2efe8', roof: '#7e8488', granite: '#a7a79d', iron: '#1f2327', cream: '#eadba2', slate: '#4d535c', gold: '#d9ae3e', shade: '#d2cabb', grey: '#8d9296',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {}, C = COL;
  const D = (w, h, fn, key, o = {}) => tex.draw(w, h, fn, { key: 'lmkth-' + key, repeat: [1, 1], ...o });
  const R = (seed) => ctx.rng(seed);
  const speckle = (g, w, h, seed, n, a = 0.1, size = 2.5) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '60,40,30'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * size, 1 + r() * size); } };

  // ------------------------------------------------------------------------------------------ walls
  A.ashlar = D(512, 512, (g, w, h) => {
    const r = R(9101), rows = 8, rh = h / rows, bw = w / 2;
    g.fillStyle = C.joint; g.fillRect(0, 0, w, h);
    for (let j = 0; j < rows; j++) {
      const off = (j % 2) * bw / 2;
      for (let i = -1; i < 3; i++) {
        const x = i * bw + off, y = j * rh, v = 0.965 + r() * 0.07;
        g.fillStyle = `rgb(${224 * v | 0},${196 * v | 0},${176 * v | 0})`; g.fillRect(x + 3, y + 3, bw - 6, rh - 5);
        g.fillStyle = 'rgba(255,238,226,0.35)'; g.fillRect(x + 3, y + 3, bw - 6, 2);                         // lit top edge
        g.fillStyle = 'rgba(100,60,40,0.16)'; g.fillRect(x + 3, y + rh - 5, bw - 6, 2);                      // shadow under the joint
        for (let k = 0; k < 5; k++) { g.fillStyle = `rgba(120,80,60,${0.04 + r() * 0.05})`; g.fillRect(x + 6 + r() * (bw * 0.5), y + 8 + r() * (rh - 18), 40 + r() * 130, 1.2); }  // wood grain
      }
    }
    speckle(g, w, h, 9102, 500, 0.05, 2);
  }, 'ashlar', { anisotropy: 8 });

  A.boards = D(512, 512, (g, w, h) => {
    const r = R(9111), rows = 16, rh = h / rows;
    g.fillStyle = '#c9ab97'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < rows; j++) {
      const v = 0.97 + r() * 0.06, y = j * rh;
      g.fillStyle = `rgb(${222 * v | 0},${194 * v | 0},${174 * v | 0})`; g.fillRect(0, y + 1.5, w, rh - 2.5);
      g.fillStyle = 'rgba(255,240,228,0.30)'; g.fillRect(0, y + 1.5, w, 2);
      for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(120,80,60,${0.04 + r() * 0.05})`; g.fillRect(r() * w, y + 4 + r() * (rh - 8), 40 + r() * 160, 1); }
      if (r() < 0.4) { const x = r() * w; g.fillStyle = 'rgba(110,80,64,0.45)'; g.fillRect(x, y + 1.5, 2, rh - 2.5); }
    }
    speckle(g, w, h, 9112, 400, 0.05, 2);
  }, 'boards', { anisotropy: 8 });

  A.granite = D(256, 256, (g, w, h) => {
    const r = R(9121), ch = h / 6;
    g.fillStyle = '#85857d'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 6; k++) {
      let x = -((k * 53) % 90);
      while (x < w) {
        const bw = 70 + ((k * 7 + Math.floor(x)) % 4) * 26, v = 0.92 + r() * 0.14;
        g.fillStyle = `rgb(${172 * v | 0},${172 * v | 0},${162 * v | 0})`; g.fillRect(x + 1.5, k * ch + 1.5, bw - 3, ch - 3);
        for (let i = 0; i < 3; i++) { g.fillStyle = `rgba(80,86,76,${0.05 + r() * 0.08})`; g.fillRect(x + r() * bw * 0.8, k * ch + r() * ch, 14 + r() * 40, 1.4); }
        x += bw;
      }
    }
    speckle(g, w, h, 9122, 800, 0.08, 3);
  }, 'granite', { anisotropy: 6 });

  A.roof = D(256, 256, (g, w, h) => {
    const r = R(9131);
    g.fillStyle = '#868c91'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) {
      g.fillStyle = 'rgba(40,46,52,0.45)'; g.fillRect(i * 128, 0, 4, h); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(i * 128 + 4, 0, 3, h);
      g.fillStyle = `rgba(255,255,255,${0.04 + r() * 0.05})`; g.fillRect(i * 128 + 8, 0, 110, h);
    }
    g.fillStyle = 'rgba(40,46,52,0.2)'; g.fillRect(0, 126, w, 3);
    speckle(g, w, h, 9132, 200, 0.05, 2);
  }, 'roof', { anisotropy: 6 });

  A.slate = D(256, 256, (g, w, h) => {
    const r = R(9141), n = 8, s = w / n;
    g.fillStyle = '#3f444c'; g.fillRect(0, 0, w, h);
    for (let j = -1; j < n + 1; j++) for (let i = -1; i < n + 1; i++) {
      const cx = i * s + (j % 2) * s / 2, cy = j * s * 0.5, v = 0.9 + r() * 0.22;
      g.fillStyle = `rgb(${88 * v | 0},${94 * v | 0},${104 * v | 0})`;
      g.beginPath(); g.moveTo(cx, cy - s * 0.5); g.lineTo(cx + s * 0.5, cy); g.lineTo(cx, cy + s * 0.5); g.lineTo(cx - s * 0.5, cy); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(25,28,34,0.55)'; g.lineWidth = 1.4; g.stroke();
    }
    speckle(g, w, h, 9142, 200, 0.05, 2);
  }, 'slate', { anisotropy: 6 });

  A.dentil = D(256, 32, (g, w, h) => {                        // the dentil band: three teeth of 0.17 m with 0.17 m gaps per 1.02 m tile
    g.fillStyle = '#d6d0be'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) { g.fillStyle = '#f4f1e9'; g.fillRect(i * w / 3 + w / 12, 0, w / 6, h); g.fillStyle = 'rgba(120,112,92,0.35)'; g.fillRect(i * w / 3 + w / 12 + w / 6 - 3, 0, 3, h); }
  }, 'dentil');

  A.plaster = D(256, 256, (g, w, h) => {
    const r = R(9151);
    g.fillStyle = '#f6f5f1'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const s = 14 + r() * 40; g.fillStyle = `rgba(${r() < 0.5 ? '212,206,190' : '255,255,255'},${0.05 + r() * 0.07})`; g.beginPath(); g.ellipse(r() * w, r() * h, s, s * (0.5 + r() * 0.6), r() * TAU, 0, TAU); g.fill(); }
    speckle(g, w, h, 9152, 500, 0.05, 2);
  }, 'plaster');

  A.timber = D(256, 256, (g, w, h) => {                       // 2.5 m tile: cream field, white members 0.14 m: frame, a rail strip with rings in the top 20 %, an X-braced field below
    g.fillStyle = '#ecdca4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#f6f3ec'; g.fillStyle = '#f6f3ec'; g.lineCap = 'butt';
    const b = 14; g.fillRect(0, 0, b, h); g.fillRect(w - b, 0, b, h); g.fillRect(0, 0, w, b * 0.6); g.fillRect(0, h - b * 0.6, w, b * 0.6);
    g.fillRect(0, h * 0.2, w, b * 0.7); g.fillRect(0, h * 0.42, w, b * 0.6);
    g.lineWidth = 6; for (const cx of [w * 0.28, w * 0.72]) { g.beginPath(); g.arc(cx, h * 0.1, 15, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(cx - 24, h * 0.1); g.lineTo(cx + 24, h * 0.1); g.stroke(); }
    g.lineWidth = 9; g.beginPath(); g.moveTo(b, h * 0.46); g.lineTo(w - b, h - 8); g.moveTo(w - b, h * 0.46); g.lineTo(b, h - 8); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, h * 0.42); g.lineTo(w / 2, h); g.stroke();
    g.fillStyle = 'rgba(160,130,60,0.07)'; for (let i = 0; i < 8; i++) g.fillRect(0, h * 0.2 + i * 9, w, 1.5);
  }, 'timber');

  // ------------------------------------------------------------------------------------------ the cells (windows, ironwork, signs)
  const cells = {};
  const cell = (name, w, h, fn) => { cells[name] = [w, h, fn]; };
  const glassBase = (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#5a6a77'); gr.addColorStop(0.5, '#2c3743'); gr.addColorStop(1, '#46535f');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(170,195,210,0.22)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.7, 0); g.lineTo(w * 0.1, h * 0.55); g.lineTo(0, h * 0.55); g.fill();
  };
  const line = (g, x0, y0, x1, y1, lw) => { g.lineWidth = lw; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  const WH = '#f2f0ea';
  /** the casement 1.45 x 3.0 m of the second floor: two leaves, a transom at 20 %, three panes in each leaf below it */
  cell('winTall', 128, 256, (g, w, h) => {
    glassBase(g, w, h); g.strokeStyle = WH;
    g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); line(g, w / 2, 0, w / 2, h, 7); line(g, 0, h * 0.2, w, h * 0.2, 7);
    for (const f of [0.47, 0.73]) line(g, 0, h * f, w, h * f, 4); line(g, w * 0.25, h * 0.2, w * 0.25, h, 3); line(g, w * 0.75, h * 0.2, w * 0.75, h, 3);
  });
  /** the half-round fanlight over a casement: a semicircle filling the cell's width (uv by the bounding box), 11 radial bars and a ring */
  cell('winFan', 256, 128, (g, w, h) => {
    g.fillStyle = '#26303a'; g.fillRect(0, 0, w, h); glassBase(g, w, h); g.strokeStyle = WH;
    const cx = w / 2, cy = h;
    for (let i = 1; i < 12; i++) { const a = Math.PI * i / 12; line(g, cx, cy, cx + Math.cos(a) * w, cy - Math.sin(a) * w, 5); }
    g.lineWidth = 7; g.beginPath(); g.arc(cx, cy, h * 0.55, Math.PI, TAU); g.stroke(); g.lineWidth = 12; g.beginPath(); g.arc(cx, cy, h - 5, Math.PI, TAU); g.stroke();
    line(g, 0, h - 3, w, h - 3, 8);
  });
  /** the small window of the top floor 1.0 x 1.3 m: two leaves, a transom */
  cell('winSmall', 96, 128, (g, w, h) => { glassBase(g, w, h); g.strokeStyle = WH; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); line(g, w / 2, 0, w / 2, h, 6); line(g, 0, h * 0.34, w, h * 0.34, 5); });
  /** the ground-floor window 1.1 x 1.9 m: two leaves, a transom */
  cell('winGround', 96, 160, (g, w, h) => { glassBase(g, w, h); g.strokeStyle = WH; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); line(g, w / 2, 0, w / 2, h, 6); line(g, 0, h * 0.28, w, h * 0.28, 6); line(g, 0, h * 0.62, w, h * 0.62, 3); });
  /** the white double door 1.7 x 2.3 m: each leaf has two star-lattice lights over a panel (T06 T12) */
  cell('doorW', 128, 176, (g, w, h) => {
    g.fillStyle = WH; g.fillRect(0, 0, w, h); g.strokeStyle = '#c8c4b8'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4); line(g, w / 2, 0, w / 2, h, 4);
    for (const k of [0, 1]) for (const j of [0, 1]) {
      const x = k * w / 2 + 11, y = 12 + j * 42, ww = w / 2 - 22, hh = 36;
      g.fillStyle = '#26303a'; g.fillRect(x, y, ww, hh); g.strokeStyle = WH; g.lineWidth = 4; line(g, x, y, x + ww, y + hh, 4); line(g, x + ww, y, x, y + hh, 4); line(g, x + ww / 2, y, x + ww / 2, y + hh, 4); line(g, x, y + hh / 2, x + ww, y + hh / 2, 4);
    }
    g.strokeStyle = '#d4d0c4'; g.lineWidth = 3; for (const k of [0, 1]) { g.strokeRect(k * w / 2 + 11, 104, w / 2 - 22, 62); }
    g.fillStyle = '#b89a3c'; g.fillRect(w / 2 - 9, 96, 4, 22); g.fillRect(w / 2 + 5, 96, 4, 22);
  });
  /** the annex glazing 1.7 x 2.4 m: three tall sashes with a transom (T01 T12: white-framed tall windows between pilasters) */
  cell('winAnnex', 128, 176, (g, w, h) => { glassBase(g, w, h); g.strokeStyle = WH; g.lineWidth = 7; g.strokeRect(3.5, 3.5, w - 7, h - 7); line(g, w / 3, 0, w / 3, h, 5); line(g, w * 2 / 3, 0, w * 2 / 3, h, 5); line(g, 0, h * 0.22, w, h * 0.22, 6); });
  /** grey louvres of the ventilation kiosks (tile 0.8 x 0.8 m) */
  cell('louvre', 64, 64, (g, w, h) => { g.fillStyle = '#5c6268'; g.fillRect(0, 0, w, h); for (let i = 0; i < 10; i++) { g.fillStyle = '#2f3438'; g.fillRect(0, i * 6.4 + 3.6, w, 2.6); g.fillStyle = '#7b8288'; g.fillRect(0, i * 6.4, w, 1.4); } });
  /** the plinth vent grille 0.7 x 0.4 m */
  cell('grille', 96, 56, (g, w, h) => { g.fillStyle = '#1d2226'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a8e92'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4); for (let i = 1; i < 6; i++) line(g, i * w / 6, 0, i * w / 6, h, 2.4); });
  /** the louvred vent of the tympanum 1.3 x 0.8 m (pink slats) */
  cell('ventPink', 96, 64, (g, w, h) => { g.fillStyle = '#9a7c6c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { g.fillStyle = '#d9bda8'; g.fillRect(2, i * 7 + 3, w - 4, 4); } g.strokeStyle = '#eee4d8'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3); });
  /** the gable of the glazed hall of the Kleinmichel dacha (K02 K05 K07): cream field, a white lattice arch with struts, a tall pointed-arch glass wall with white mullions (uv by the bounding box of a pentagon: 8 x 9.5 m) */
  cell('gableHall', 256, 256, (g, w, h) => {
    g.fillStyle = '#ecdca4'; g.fillRect(0, 0, w, h);
    const cx = w / 2, bx = 40, by = h - 4;
    g.fillStyle = '#35424f'; g.beginPath(); g.moveTo(cx - 70, by); g.lineTo(cx - 70, h * 0.46); g.quadraticCurveTo(cx - 70, h * 0.2, cx, h * 0.14); g.quadraticCurveTo(cx + 70, h * 0.2, cx + 70, h * 0.46); g.lineTo(cx + 70, by); g.closePath(); g.fill();
    g.fillStyle = 'rgba(170,200,215,0.25)'; g.fillRect(cx - 66, h * 0.3, 60, h * 0.6);
    g.strokeStyle = '#f6f3ec'; g.lineWidth = 5; for (const x of [-35, 0, 35]) line(g, cx + x, h * 0.16, cx + x, by, 5); for (const y of [0.4, 0.62]) line(g, cx - 70, h * y, cx + 70, h * y, 5);
    g.lineWidth = 14; g.beginPath(); g.moveTo(cx - 82, by); g.lineTo(cx - 82, h * 0.46); g.quadraticCurveTo(cx - 82, h * 0.16, cx, h * 0.1); g.quadraticCurveTo(cx + 82, h * 0.16, cx + 82, h * 0.46); g.lineTo(cx + 82, by); g.stroke();
    g.lineWidth = 7; for (let i = 0; i < 6; i++) { const t = (i + 0.5) / 6; line(g, cx - 82 - 6, h * 0.5 - t * h * 0.34, bx + 6 + t * 30, h * 0.52 - t * h * 0.28, 6); line(g, cx + 82 + 6, h * 0.5 - t * h * 0.34, w - bx - 6 - t * 30, h * 0.52 - t * h * 0.28, 6); }
    g.lineWidth = 9; line(g, 0, h * 0.04, cx, 0, 9); line(g, w, h * 0.04, cx, 0, 9); line(g, bx, h * 0.3, bx, by, 8); line(g, w - bx, h * 0.3, w - bx, by, 8);
  });

  // ironwork cut-outs
  const spear = (g, x, y, hw, hh) => { g.beginPath(); g.moveTo(x - hw, y); g.lineTo(x, y - hh); g.lineTo(x + hw, y); g.closePath(); g.fill(); };
  /** one fence bay 2.0 x 1.9 m: 14 bars with a ball under a spear tip, three rails, a lower field of ring links (K03 K09 K10) */
  cell('fenceK', 256, 243, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'butt';
    const n = 14, step = w / n;
    for (let i = 0; i < n; i++) { const x = (i + 0.5) * step; g.fillRect(x - 2.6, 24, 5.2, h - 24); spear(g, x, 26, 5, 20); g.beginPath(); g.arc(x, 32, 4.4, 0, TAU); g.fill(); }
    g.fillRect(0, 44, w, 6); g.fillRect(0, h * 0.5, w, 6); g.fillRect(0, h - 14, w, 8);
    g.lineWidth = 3; for (let i = 0; i < n; i++) { const cx = (i + 0.5) * step; g.beginPath(); g.ellipse(cx + step / 2, h * 0.7, step * 0.5, h * 0.09, 0, 0, TAU); g.stroke(); }
  });
  /** one gate leaf 2.1 x 3.0 m: stiles, a scrolled top rail with a central finial, bars with rings between the rails, an ornamental cartouche (K09 K03) */
  cell('leafK', 192, 288, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'round';
    const n = 10, step = w / n;
    g.fillRect(0, 30, 9, h - 30); g.fillRect(w - 9, 30, 9, h - 30); g.fillRect(0, h - 16, w, 16); g.fillRect(0, h * 0.62, w, 7); g.fillRect(0, 70, w, 6);
    for (let i = 0; i < n; i++) { const x = (i + 0.5) * step; g.fillRect(x - 2.2, 76, 4.4, h - 80); spear(g, x, 80, 5, 18); }
    g.lineWidth = 5; for (const s of [0, 1]) { const x0 = s ? w : 0, d = s ? -1 : 1; g.beginPath(); g.moveTo(x0, 70); g.bezierCurveTo(x0 + d * 30, 20, x0 + d * 80, 24, w / 2, 8); g.stroke(); g.beginPath(); g.arc(x0 + d * 36, 52, 12, 0, TAU); g.stroke(); }
    g.lineWidth = 4; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc((i + 0.5) * w / 5, h * 0.74, step * 0.85, 0, TAU); g.stroke(); }
    g.beginPath(); g.ellipse(w / 2, h * 0.42, 30, 24, 0, 0, TAU); g.lineWidth = 6; g.stroke(); g.fillRect(w / 2 - 3, 10, 6, 26);
  });
  /** a plain roof railing (the theatre roof edge, T04 T02): two rails, thin verticals every 0.5 m, black */
  cell('roofRail', 256, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.fillRect(0, 2, w, 3); g.fillRect(0, h * 0.5, w, 2); g.fillRect(0, h - 3, w, 3); for (let i = 0; i < 4; i++) g.fillRect(i * w / 4 + 2, 2, 3, h - 3); });
  /** the white balustrade bay 1.8 x 1.1 m: nine turned balusters, the rails are geometry (T01 T04 T12) */
  cell('balust', 256, 160, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; const n = 9, step = w / n;
    for (let i = 0; i < n; i++) { const cx = (i + 0.5) * step; g.beginPath(); g.moveTo(cx - 5, 0); g.lineTo(cx + 5, 0); g.lineTo(cx + 4, 20); g.quadraticCurveTo(cx + 15, 50, cx + 6, 90); g.lineTo(cx + 9, h); g.lineTo(cx - 9, h); g.lineTo(cx - 6, 90); g.quadraticCurveTo(cx - 15, 50, cx - 4, 20); g.closePath(); g.fill(); }
  });
  /** the fretwork balustrade bay 2.0 x 1.0 m of the Kleinmichel tower gallery: top / bottom rail, a ring with a cross in each of four fields (K05 K07 K08) */
  cell('fretBal', 256, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.fillRect(0, 0, w, 12); g.fillRect(0, h - 12, w, 12);
    const n = 4, s = w / n; g.lineWidth = 6;
    for (let i = 0; i < n; i++) { const cx = (i + 0.5) * s, cy = h / 2; g.beginPath(); g.arc(cx, cy, 24, 0, TAU); g.stroke(); line(g, cx - 24, cy, cx + 24, cy, 6); line(g, cx, cy - 24, cx, cy + 24, 6); g.fillRect(i * s - 3, 12, 6, h - 24); }
    g.fillRect(w - 6, 12, 6, h - 24);
  });
  /** the bronze plaque at the left door of the portico (T01 X09): the name of the theatre; 0.5 x 0.65 m */
  cell('plaqueA', 256, 320, (g, w, h) => {
    g.fillStyle = '#4a4636'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b9a45a'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#d8c677'; g.textAlign = 'center'; g.textBaseline = 'middle';
    tex.fitText(g, 'Каменноостровский', w / 2, h * 0.30, w * 0.84, 30, tex.FONTS.serif, 700);
    tex.fitText(g, 'театр', w / 2, h * 0.46, w * 0.84, 38, tex.FONTS.serif, 700);
    tex.fitText(g, 'Вторая сцена БДТ', w / 2, h * 0.68, w * 0.8, 22, tex.FONTS.serif, 400);
  });
  /** the second plaque (right of the doors): a heritage plate, the lines are unreadable strokes below the heading; 0.5 x 0.65 m */
  cell('plaqueB', 256, 320, (g, w, h) => {
    g.fillStyle = '#3d3a30'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8f8a6c'; g.lineWidth = 5; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#c9c18a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    tex.fitText(g, 'ОБЪЕКТ КУЛЬТУРНОГО', w / 2, h * 0.14, w * 0.8, 20, tex.FONTS.serif, 700); tex.fitText(g, 'НАСЛЕДИЯ', w / 2, h * 0.24, w * 0.8, 24, tex.FONTS.serif, 700);
    g.fillStyle = 'rgba(201,193,138,0.55)'; for (let i = 0; i < 9; i++) g.fillRect(34, h * 0.36 + i * 20, w - 68 - (i % 3) * 22, 6);
  });
  /** three posters of the round BDT kiosk (X09 T11): a blue, a red and a cream one with the wordmark БДТ (plain lettering) */
  const poster = (name, bg, fg, a, b) => cell(name, 128, 192, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    tex.fitText(g, 'БДТ', w / 2, 34, w * 0.6, 40, tex.FONTS.serif, 700); g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(w / 2, h * 0.52, 36, 46, 0, 0, TAU); g.fill();
    g.fillStyle = fg; tex.fitText(g, a, w / 2, h * 0.8, w * 0.84, 16, tex.FONTS.serif, 700); tex.fitText(g, b, w / 2, h * 0.9, w * 0.84, 12, tex.FONTS.serif, 400);
  });
  poster('poster1', '#2c5f93', '#f1efe6', 'Вторая сцена', 'Каменноостровский театр');
  poster('poster2', '#a83a32', '#f6efe0', 'Репертуар', 'на этот месяц');
  poster('poster3', '#e9dfc4', '#2a2f3a', 'Большой', 'драматический театр');

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
  const wn = pack('win', 1024, 640, { winTall: [0, 0], winFan: [136, 0], winSmall: [400, 0], winGround: [504, 0], doorW: [608, 0], winAnnex: [744, 0], louvre: [880, 0], grille: [880, 72], ventPink: [880, 136], gableHall: [0, 270] });
  A.win = wn.tex; A.winUV = wn.uv;
  const ct = pack('cut', 1024, 640, { fenceK: [0, 0], leafK: [264, 0], roofRail: [464, 0], balust: [464, 72], fretBal: [0, 252] }, { fenceK: C.iron, leafK: C.iron, roofRail: C.iron, balust: C.white, fretBal: C.white });
  A.cut = ct.tex; A.cutUV = ct.uv;
  const sg = pack('signs', 1024, 640, { plaqueA: [0, 0], plaqueB: [264, 0], poster1: [0, 330], poster2: [136, 330], poster3: [272, 330] });
  A.signs = sg.tex; A.signsUV = sg.uv;
  return A;
}
