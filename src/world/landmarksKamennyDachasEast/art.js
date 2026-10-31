// landmarksKamennyDachasEast/art.js - the canvas paintings of the module (every key starts with 'lmkde-': the texture cache is scene-wide).  Dossier docs/research/kamenny-2026.md 5.4, photos O01..O12 S01..S04.
//   boards    the clapboard of the dacha: horizontal boards 0.2 m, pale lemon yellow #e1d08a with grain and the odd butt joint (tile 3.2 m; O10 O11 O07)
//   stucco    the ochre plaster of the wing (speckle only, tinted by the material; O09)      plank   the green construction fence: vertical planks 0.18 m, weathered mint green (tile 1.44 m; O05 O12)
//   granite   grey granite blocks (plinth, curb, pier steps, tile 1.8 m)                      roof    grey standing-seam sheet iron (tile 1.2 m)       dome  grey-green copper with one seam per gore
//   dentil    the dentil band of the cornice (3 teeth per 1.02 m tile)
//   win atlas windows / doors / fanlights / the garland relief (decals and panes: ground window 1.35 x 3.0 m, upper window 1.2 x 2.0 m, fanlight, glazed door, drum window, wing window, wing door, plinth grille)
//   cut atlas iron fence bay with spear tips, balcony railing, plank-fence cap (alpha cut-outs, tinted per cell)
const TAU = Math.PI * 2;
export const COL = {
  yellow: '#e1d08a', stucco: '#e4ba6c', white: '#f1eee6', shade: '#d4cdbd', roof: '#7e8488', dome: '#66756b', granite: '#a7a79d', iron: '#1f2327', plank: '#5aa88a', plinth: '#e9e4d6', gold: '#d9ae3e',
  sphinx: '#2f6a5a', sphinxDark: '#234f43', crown: '#a98a4a', chimney: '#e8d9a0', brick: '#a8543c',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {}, C = COL;
  const D = (w, h, fn, key, o = {}) => tex.draw(w, h, fn, { key: 'lmkde-' + key, repeat: [1, 1], ...o });
  const R = (seed) => ctx.rng(seed);
  const speckle = (g, w, h, seed, n, a = 0.1, size = 2.5) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '60,50,30'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * size, 1 + r() * size); } };

  // ------------------------------------------------------------------------------------------ walls
  A.boards = D(512, 512, (g, w, h) => {
    const r = R(7101), rows = 16, rh = h / rows;
    g.fillStyle = '#b9aa6c'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < rows; j++) {
      const v = 0.965 + r() * 0.07, y = j * rh;
      g.fillStyle = `rgb(${226 * v | 0},${210 * v | 0},${138 * v | 0})`; g.fillRect(0, y + 1.5, w, rh - 2.5);
      g.fillStyle = 'rgba(255,248,205,0.30)'; g.fillRect(0, y + 1.5, w, 2);
      g.fillStyle = 'rgba(90,70,30,0.16)'; g.fillRect(0, y + rh - 3, w, 1.5);
      for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(110,90,40,${0.04 + r() * 0.05})`; g.fillRect(r() * w, y + 4 + r() * (rh - 8), 40 + r() * 160, 1); }
      if (r() < 0.35) { const x = r() * w; g.fillStyle = 'rgba(100,80,40,0.45)'; g.fillRect(x, y + 1.5, 2, rh - 2.5); }
    }
    speckle(g, w, h, 7102, 400, 0.05, 2);
  }, 'boards', { anisotropy: 8 });

  A.stucco = D(256, 256, (g, w, h) => {
    const r = R(7111);
    g.fillStyle = '#f7f4ec'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const s = 14 + r() * 40; g.fillStyle = `rgba(${r() < 0.5 ? '214,206,186' : '255,255,255'},${0.05 + r() * 0.07})`; g.beginPath(); g.ellipse(r() * w, r() * h, s, s * (0.5 + r() * 0.6), r() * TAU, 0, TAU); g.fill(); }
    speckle(g, w, h, 7112, 500, 0.05, 2);
  }, 'stucco');

  A.plank = D(256, 256, (g, w, h) => {
    const r = R(7121), n = 8, pw = w / n;
    g.fillStyle = '#2f6e55'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      const v = 0.9 + r() * 0.2;
      g.fillStyle = `rgb(${76 * v | 0},${158 * v | 0},${130 * v | 0})`; g.fillRect(i * pw + 2, 0, pw - 3, h);
      g.fillStyle = 'rgba(210,235,215,0.22)'; for (let k = 0; k < 8; k++) g.fillRect(i * pw + 3 + r() * (pw - 8), r() * h, 2, 18 + r() * 60);   // paint wear
      g.fillStyle = 'rgba(60,50,30,0.18)'; for (let k = 0; k < 3; k++) g.fillRect(i * pw + 3 + r() * (pw - 8), r() * h, 1, 40 + r() * 90);
    }
    speckle(g, w, h, 7122, 300, 0.07, 2);
  }, 'plank', { anisotropy: 4 });

  A.granite = D(256, 256, (g, w, h) => {
    const r = R(7131), ch = h / 6;
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
    speckle(g, w, h, 7132, 800, 0.08, 3);
  }, 'granite', { anisotropy: 6 });

  A.roof = D(256, 256, (g, w, h) => {
    const r = R(7141);
    g.fillStyle = '#868c91'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) {
      g.fillStyle = 'rgba(40,46,52,0.45)'; g.fillRect(i * 128, 0, 4, h); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(i * 128 + 4, 0, 3, h);
      g.fillStyle = `rgba(255,255,255,${0.04 + r() * 0.05})`; g.fillRect(i * 128 + 8, 0, 110, h);
    }
    g.fillStyle = 'rgba(40,46,52,0.2)'; g.fillRect(0, 126, w, 3);
    speckle(g, w, h, 7142, 200, 0.05, 2);
  }, 'roof', { anisotropy: 6 });

  A.dome = D(128, 256, (g, w, h) => {                        // one gore: a standing seam on the left edge, faint sheet joints, verdigris streaks
    const r = R(7151);
    g.fillStyle = '#7d8c81'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(8, 0, w - 16, h);
    g.fillStyle = 'rgba(35,48,42,0.55)'; g.fillRect(0, 0, 5, h); g.fillStyle = 'rgba(235,245,238,0.35)'; g.fillRect(5, 0, 3, h);
    for (let y = 40; y < h; y += 64) { g.fillStyle = 'rgba(40,52,46,0.16)'; g.fillRect(0, y, w, 2); }
    for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(170,200,180,${0.07 + r() * 0.08})`; g.fillRect(12 + r() * (w - 24), r() * h, 3, 30 + r() * 80); }
    speckle(g, w, h, 7152, 120, 0.05, 2);
  }, 'dome', { anisotropy: 4 });

  A.dentil = D(256, 32, (g, w, h) => {
    g.fillStyle = '#d6d0be'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) { g.fillStyle = '#f4f1e9'; g.fillRect(i * w / 3 + w / 12, 0, w / 6, h); g.fillStyle = 'rgba(120,112,92,0.35)'; g.fillRect(i * w / 3 + w / 12 + w / 6 - 3, 0, 3, h); }
  }, 'dentil');

  // ------------------------------------------------------------------------------------------ the cells (windows, doors, ironwork)
  const cells = {};
  const cell = (name, w, h, fn) => { cells[name] = [w, h, fn]; };
  const glassBase = (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#5a6a77'); gr.addColorStop(0.5, '#2c3743'); gr.addColorStop(1, '#46535f');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(170,195,210,0.22)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.7, 0); g.lineTo(w * 0.1, h * 0.55); g.lineTo(0, h * 0.55); g.fill();
  };
  const line = (g, x0, y0, x1, y1, lw) => { g.lineWidth = lw; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  const WH = '#f2f0ea';
  /** the ground-floor casement 1.35 x 3.0 m (O01 O07 O11): two leaves of three panes over a transom row, white frame */
  cell('winG', 128, 288, (g, w, h) => {
    glassBase(g, w, h); g.strokeStyle = WH;
    g.lineWidth = 9; g.strokeRect(4.5, 4.5, w - 9, h - 9); line(g, w / 2, 0, w / 2, h, 7); line(g, 0, h * 0.2, w, h * 0.2, 7);
    for (const f of [0.4, 0.6, 0.8]) line(g, 0, h * f, w, h * f, 3.5); for (const x of [0.25, 0.75]) line(g, w * x, h * 0.2, w * x, h, 3);
  });
  /** the upper-floor window 1.2 x 2.0 m: two leaves of four panes */
  cell('winU', 96, 160, (g, w, h) => {
    glassBase(g, w, h); g.strokeStyle = WH;
    g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); line(g, w / 2, 0, w / 2, h, 6); for (const f of [0.25, 0.5, 0.75]) line(g, 0, h * f, w, h * f, 3.5);
  });
  /** the half-round fanlight over an arched window (a semicircle filling the cell's width, uv by the bounding box): 11 radial bars and a ring (O10 O11) */
  cell('fan', 256, 128, (g, w, h) => {
    g.fillStyle = '#26303a'; g.fillRect(0, 0, w, h); glassBase(g, w, h); g.strokeStyle = WH;
    const cx = w / 2, cy = h;
    for (let i = 1; i < 12; i++) { const a = Math.PI * i / 12; line(g, cx, cy, cx + Math.cos(a) * w, cy - Math.sin(a) * w, 5); }
    g.lineWidth = 7; g.beginPath(); g.arc(cx, cy, h * 0.55, Math.PI, TAU); g.stroke(); g.lineWidth = 12; g.beginPath(); g.arc(cx, cy, h - 5, Math.PI, TAU); g.stroke();
    line(g, 0, h - 3, w, h - 3, 8);
  });
  /** the glazed double door 1.5 x 3.0 m of the porticoes: two leaves, a transom row and three panes across each leaf */
  cell('doorG', 128, 256, (g, w, h) => {
    glassBase(g, w, h); g.strokeStyle = WH;
    g.lineWidth = 9; g.strokeRect(4.5, 4.5, w - 9, h - 9); line(g, w / 2, 0, w / 2, h, 8); line(g, 0, h * 0.16, w, h * 0.16, 6);
    for (const f of [0.34, 0.52, 0.7]) line(g, 0, h * f, w, h * f, 3.5); for (const x of [0.17, 0.33, 0.67, 0.83]) line(g, w * x, h * 0.16, w * x, h * 0.84, 3);
    g.fillStyle = WH; g.fillRect(0, h * 0.84, w, h * 0.16); g.strokeStyle = '#cfcabb'; g.lineWidth = 3; g.strokeRect(8, h * 0.86, w / 2 - 12, h * 0.1); g.strokeRect(w / 2 + 4, h * 0.86, w / 2 - 12, h * 0.1);
  });
  /** the arched window of the drum 0.95 x 2.3 m (O02 O11): round head, three panes, a semicircle of radial bars */
  cell('winDr', 64, 160, (g, w, h) => {
    glassBase(g, w, h); g.strokeStyle = WH; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    line(g, w / 2, 0, w / 2, h, 4); line(g, 0, h * 0.34, w, h * 0.34, 4); line(g, 0, h * 0.62, w, h * 0.62, 3);
    for (let i = 1; i < 5; i++) { const a = Math.PI * i / 5; line(g, w / 2, w / 2, w / 2 + Math.cos(a) * w / 2, w / 2 - Math.sin(a) * w / 2, 2.5); }
  });
  /** the window of the wing 1.4 x 1.9 m (O09): white frame, two leaves, three panes high */
  cell('winW', 112, 152, (g, w, h) => {
    glassBase(g, w, h); g.strokeStyle = WH; g.lineWidth = 9; g.strokeRect(4.5, 4.5, w - 9, h - 9); line(g, w / 2, 0, w / 2, h, 7); for (const f of [0.33, 0.66]) line(g, 0, h * f, w, h * f, 4.5);
  });
  /** the brown wooden door of the wing 1.1 x 2.3 m (O09): panels, a small glazed light */
  cell('doorW', 88, 184, (g, w, h) => {
    g.fillStyle = '#6d4224'; g.fillRect(0, 0, w, h); g.strokeStyle = '#4a2c15'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
    g.fillStyle = '#2f4f48'; g.fillRect(14, 12, w - 28, 34); g.strokeStyle = '#3a2410'; g.lineWidth = 3; g.strokeRect(14, 12, w - 28, 34);
    g.strokeStyle = 'rgba(40,20,8,0.7)'; g.lineWidth = 3; g.strokeRect(12, 58, w - 24, 52); g.strokeRect(12, 120, w - 24, 52);
    g.fillStyle = '#c9a85c'; g.fillRect(w - 20, h * 0.5, 6, 16);
  });
  /** the vent grille of the plinth 0.7 x 0.4 m */
  cell('grille', 96, 56, (g, w, h) => { g.fillStyle = '#1d2226'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a8e92'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4); for (let i = 1; i < 6; i++) line(g, i * w / 6, 0, i * w / 6, h, 2.4); });
  /** the garland relief of the north vestibule (O05): a white plaque with three festoons hanging from rosettes (2.4 x 0.9 m) */
  cell('garland', 256, 96, (g, w, h) => {
    g.fillStyle = 'rgba(236,224,176,1)'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f4f1e9'; g.fillStyle = '#f4f1e9'; g.lineWidth = 7; g.strokeRect(5, 5, w - 10, h - 10);
    for (let i = 0; i < 3; i++) {
      const x0 = 24 + i * 70, x1 = x0 + 70; g.beginPath(); g.arc(x0, 22, 8, 0, TAU); g.fill();
      g.lineWidth = 11; g.beginPath(); g.moveTo(x0, 22); g.quadraticCurveTo((x0 + x1) / 2, 98, x1, 22); g.stroke();
      g.lineWidth = 3; g.strokeStyle = '#cfc8b4'; g.beginPath(); g.moveTo(x0 + 3, 30); g.quadraticCurveTo((x0 + x1) / 2, 88, x1 - 3, 30); g.stroke(); g.strokeStyle = '#f4f1e9';
    }
    g.beginPath(); g.arc(24 + 3 * 70, 22, 8, 0, TAU); g.fill();
  });

  // ironwork cut-outs
  const spear = (g, x, y, hw, hh) => { g.beginPath(); g.moveTo(x - hw, y); g.lineTo(x, y - hh); g.lineTo(x + hw, y); g.closePath(); g.fill(); };
  /** one fence bay 2.4 x 1.5 m (O07 O12): 21 square bars, every second one carrying a leaf-shaped spear tip, two rails; the finial posts are geometry */
  cell('fenceO', 256, 160, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.strokeStyle = '#fff';
    const n = 21, step = w / n;
    for (let i = 0; i < n; i++) { const x = (i + 0.5) * step; g.fillRect(x - 1.1, 20, 2.2, h - 20); if (i % 2 === 0) { spear(g, x, 26, 5, 22); g.fillRect(x - 2.5, 22, 5, 2.5); } else spear(g, x, 22, 2.6, 12); }
    g.fillRect(0, 44, w, 3.5); g.fillRect(0, h - 26, w, 4.5); g.fillRect(0, h - 4, w, 4);
  });
  /** the balcony railing 3.4 x 1.0 m of the porticoes (O10): top rail, bottom rail, thin verticals and a row of X crosses */
  cell('rail', 256, 80, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.fillRect(0, 2, w, 5); g.fillRect(0, h - 7, w, 5);
    for (let i = 0; i <= 12; i++) g.fillRect(i * (w - 3) / 12, 2, 3, h - 4);
    g.lineWidth = 2; for (let i = 0; i < 4; i++) { const x0 = i * w / 4; line(g, x0 + 3, 8, x0 + w / 4 - 3, h - 8, 2); line(g, x0 + w / 4 - 3, 8, x0 + 3, h - 8, 2); }
  });

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
  const wn = pack('win', 1024, 640, { winG: [0, 0], winU: [136, 0], fan: [240, 0], doorG: [504, 0], winDr: [640, 0], winW: [712, 0], doorW: [832, 0], grille: [832, 192], garland: [0, 300] });
  A.win = wn.tex; A.winUV = wn.uv;
  const ct = pack('cut', 1024, 320, { fenceO: [0, 0], rail: [264, 0] }, { fenceO: C.iron, rail: C.iron });
  A.cut = ct.tex; A.cutUV = ct.uv;
  return A;
}
