// landmarksKronverk/mats.js - materials and canvas textures of the Kronverk / Alexander Park module (dossier docs/research/kronverk.md sections 2-7; colours read from photos 01 04 12 20 37 53 59 64 79 68).
// WALL TEXTURES are painted for ONE BAY: u = bays along the wall, v = 0..1 over the whole face height (one quad per footprint edge).  M.bay(key, wM, hM, painter, px) builds such a material:
// the painter works in METRES (x 0..wM to the right, y 0..hM up from the ground) through the helper `D`.  M.fac(o) is the stucco-house bay of the fortress module (floors with windows, socle, cornice).
// Free geometry (turrets, gates, pedestals) uses the tiling materials (uv in metres): brickT (2 x 2 m), granite tiles, roof seams.
const lcg = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };

export const C = {
  brick: '#c4603f', brickLit: '#cf6c48', brickShade: '#a34a35', brickDark: '#8a3d2c', mortar: '#d0a288', socle: '#b3a59c', socleDark: '#8f837c', roof: '#aab4ba', roofSeam: '#8f9aa1', pipe: '#b05840', capMetal: '#9aa3a8',
  glass: '#27313a', bronze: '#4f4435', bronzeLit: '#6a5c45', olive: '#5d6b47', oliveD: '#47543a', oliveL: '#6f7d55', track: '#2c2f2e', tyre: '#26282a', silver: '#b9bec2', white: '#e9e7df',
  granitePink: '#b9a7a0', granitePinkD: '#9a8880', granitePinkL: '#cbbbb4', graniteGrey: '#9a958e', iron: '#1e2022', lawn: '#5f9a3c', grit: '#b9a694',
  saucer: '#8b6a55', saucerD: '#6f5344', saucerL: '#a07c64', blue: '#2a63c8',
  baltic: '#a9a39a', balticD: '#8f8a82', balticL: '#bdb7ae', yellow: '#e2c56a', yellowD: '#cdaf55', cream: '#f0e6c8', ochre: '#d8b25a', ochreD: '#c29c48', zinc: '#a9b0b4', zoo: '#c9c1b0', zooD: '#aaa292', rubble: '#9c948a',
  ortho: '#c9c2b2', orthoD: '#b0a998',
};

export function makeMats(ctx) {
  const T = ctx.mat.toon, FONT = (ctx.tex && ctx.tex.FONTS) || { serif: 'serif', sans: 'sans-serif', round: 'sans-serif' };
  const tex = (w, h, key, fn, repeat = [1, 1]) => ctx.tex.draw(w, h, fn, { key: 'lmKr-' + key, repeat });
  const speckle = (g, w, h, r, n, cols, smin = 1, smax = 3) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[(r() * cols.length) | 0]; const s = smin + r() * (smax - smin); g.fillRect(r() * w, r() * h, s, s * (0.6 + r() * 0.8)); } };
  /** drawing helper in metres for a bay of wM x hM painted on a w x h canvas (canvas top = the top of the wall) */
  const mk = (g, w, h, wM, hM, seed) => {
    const X = (x) => x / wM * w, Y = (y) => h - y / hM * h, r = lcg(seed);
    const D = {
      g, w, h, wM, hM, X, Y, r,
      rect: (x0, y0, x1, y1, col) => { g.fillStyle = col; g.fillRect(X(x0), Y(y1), X(x1) - X(x0), Y(y0) - Y(y1)); },
      /** brick field over x0..x1, y0..y1: courses `ch` m, bricks `bw` m, colours */
      bricks: (x0, y0, x1, y1, cols = ['#c4603f', '#cb6744', '#bd5a3a', '#c9643f', '#b85536', '#d06e4a'], ch = 0.105, bw = 0.3, mortar = '#b98a70') => {
        D.rect(x0, y0, x1, y1, mortar);
        const n = Math.ceil((y1 - y0) / ch), m = Math.ceil((x1 - x0) / bw) + 1, ph = Math.max(1, (Y(0) - Y(ch)) - 1), pw = Math.max(1, X(bw) - 1);
        for (let c = 0; c < n; c++) for (let b = -1; b < m; b++) { g.fillStyle = cols[(r() * cols.length) | 0]; const xx = X(x0 + (b + (c % 2) * 0.5) * bw); const xa = Math.max(X(x0), xx), xb = Math.min(X(x1), xx + pw); if (xb > xa) g.fillRect(xa, Y(y0 + (c + 1) * ch), xb - xa, ph); }
      },
      /** round- or segment-headed opening path: centre x, bottom y, width, total height, rise of the head (w/2 = round) */
      arch: (cx, y0, ww, hh, rise = ww / 2) => {
        const x0 = X(cx - ww / 2), x1 = X(cx + ww / 2), yb = Y(y0), ys = Y(y0 + hh - rise), yt = Y(y0 + hh);
        g.beginPath(); g.moveTo(x0, yb); g.lineTo(x0, ys); g.bezierCurveTo(x0, ys - (ys - yt) * 1.33, x1, ys - (ys - yt) * 1.33, x1, ys); g.lineTo(x1, yb); g.closePath();
      },
      fillArch: (cx, y0, ww, hh, col, rise) => { D.arch(cx, y0, ww, hh, rise); g.fillStyle = col; g.fill(); },
      /** a window: brick surround (darker ring), dark glass, pale glazing bars */
      window: (cx, y0, ww, hh, o = {}) => {
        const rise = o.rise ?? ww / 2, s = o.surround ?? 0.22;
        if (s > 0) D.fillArch(cx, y0 - 0.06, ww + 2 * s, hh + s + 0.06, o.ring || '#a8492f', rise + s * 0.6);
        if (o.ring2) D.fillArch(cx, y0 - 0.02, ww + s, hh + s * 0.5 + 0.02, o.ring2, rise + s * 0.3);
        D.fillArch(cx, y0, ww, hh, o.glass || C.glass, rise);
        if (o.bars !== false) { g.strokeStyle = o.bar || 'rgba(214,208,196,0.85)'; g.lineWidth = Math.max(1.5, X(0.05)); g.beginPath(); const nb = o.nx ?? 2; for (let i = 1; i <= nb; i++) { const x = X(cx - ww / 2 + ww * i / (nb + 1)); g.moveTo(x, Y(y0)); g.lineTo(x, Y(y0 + hh - rise * 0.3)); } const ny = o.ny ?? Math.max(1, Math.round(hh / 0.9)); for (let i = 1; i <= ny; i++) { const y = Y(y0 + (hh - rise) * i / ny); g.moveTo(X(cx - ww / 2), y); g.lineTo(X(cx + ww / 2), y); } g.stroke(); }
        if (o.sill !== false) D.rect(cx - ww / 2 - 0.15, y0 - 0.16, cx + ww / 2 + 0.15, y0, o.sillCol || '#d2c4b6');
      },
      band: (y0, y1, col, shadow = true) => { D.rect(0, y0, wM, y1, col); if (shadow) D.rect(0, y0 - 0.07, wM, y0, 'rgba(60,24,16,0.35)'); },
      /** corbel table: a row of small round arches hanging under a cornice */
      corbels: (y0, y1, n, col = '#8f3d2a') => { const ww = wM / n; for (let i = 0; i < n; i++) D.fillArch((i + 0.5) * ww, y0, ww * 0.62, y1 - y0, col); },
      speck: (n, cols) => speckle(g, w, h, r, n, cols, 1, 3),
      text: (s, cx, y, hM_, col, font = 'bold', fam = FONT.serif) => { g.fillStyle = col; g.font = `${font} ${Math.max(6, Math.round(Y(0) - Y(hM_)))}px ${fam}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, X(cx), Y(y)); },
    };
    return D;
  };
  const M = { C, FONT };
  const bayCache = new Map();
  /** a one-bay wall material: painter(D) in metres; px = [w, h] of the canvas */
  M.bay = (key, wM, hM, painter, px = [256, 512], opts = {}) => {
    let m = bayCache.get(key); if (m) return m;
    const map = tex(px[0], px[1], 'bay-' + key, (g, w, h) => painter(mk(g, w, h, wM, hM, key.length * 7919 + 17)));
    m = T('#ffffff', { map, name: 'lmKr-bay-' + key, paint: opts.paint ?? 0.03, ...(opts.mat || {}) });
    m.userData.bay = wM; m.userData.H = hM;
    bayCache.set(key, m); return m;
  };
  M.mk = mk; M.tex = tex;

  // ---------------------------------------------------------------- tiling textures
  const brickTile = tex(256, 256, 'brickT', (g, w, h) => { const D = mk(g, w, h, 2, 2, 5); D.bricks(0, 0, 2, 2, undefined, 0.1, 0.286); speckle(g, w, h, D.r, 260, ['rgba(70,30,20,0.18)', 'rgba(235,170,140,0.16)'], 1, 3); });
  const graniteTile = (key, base, seed, joints = true) => tex(256, 256, key, (g, w, h) => {
    const r = lcg(seed); g.fillStyle = base; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 1500, ['rgba(60,50,46,0.22)', 'rgba(240,230,224,0.22)', 'rgba(150,110,100,0.18)'], 1, 3);
    if (joints) { g.strokeStyle = 'rgba(70,60,56,0.5)'; g.lineWidth = 2; for (let y = 0; y <= h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); const off = (y / 64) % 2 ? 0 : 64; for (let x = off; x <= w; x += 128) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke(); } } }
  });
  const seamTile = (key, base, seam, seed) => tex(256, 256, key, (g, w, h) => { const r = lcg(seed); g.fillStyle = base; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 500, ['rgba(255,255,255,0.06)', 'rgba(0,0,0,0.06)'], 2, 9); g.fillStyle = seam; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 3, h); g.fillStyle = 'rgba(255,255,255,0.12)'; for (let x = 3; x < w; x += 64) g.fillRect(x, 0, 2, h); });
  const lawnTex = tex(256, 256, 'lawn', (g, w, h) => { const r = lcg(53); g.fillStyle = C.lawn; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 1800, ['#70a846', '#548a30', '#6aa23e', '#7cb04c'], 1.5, 4); });
  const gritTex = tex(256, 256, 'grit', (g, w, h) => { const r = lcg(59); g.fillStyle = C.grit; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 2200, ['#a89684', '#c8b6a4', '#9c8a7a', '#c2ae9c'], 1, 3); });
  const rubbleTex = tex(256, 256, 'rubble', (g, w, h) => {
    const r = lcg(61); g.fillStyle = '#6f6860'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 7; j++) for (let i = -1; i < 6; i++) { const k = 0.85 + r() * 0.3; g.fillStyle = `rgb(${160 * k | 0},${150 * k | 0},${(138 + r() * 10) * k | 0})`; const x = i * 46 + (j % 2) * 23 + r() * 6, y = j * 37 + r() * 4; g.beginPath(); g.moveTo(x + 4, y + 3); g.lineTo(x + 40 + r() * 4, y + 2 + r() * 3); g.lineTo(x + 42, y + 30 + r() * 4); g.lineTo(x + 3 + r() * 4, y + 33); g.closePath(); g.fill(); }
  });
  const slabTex = tex(256, 256, 'slab', (g, w, h) => { const r = lcg(43); g.fillStyle = '#a7a39c'; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 900, ['#98948d', '#b6b2ab', '#8e8a84'], 1, 3); g.strokeStyle = 'rgba(70,66,62,0.6)'; g.lineWidth = 2; for (let y = 0; y <= h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); const off = (y / 64) % 2 ? 0 : 64; for (let x = off; x <= w; x += 128) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke(); } } });

  // plain colours are shared by hex (M.col returns an existing one): every distinct material is a draw call after batching
  const byHex = new Map();
  const flat = (hex, name, o = {}) => { const m = T(hex, { name: 'lmKr-' + name, paint: 0.04, ...o }); if (!Object.keys(o).length && !byHex.has(hex.toLowerCase())) byHex.set(hex.toLowerCase(), m); return m; };
  Object.assign(M, {
    brickT: T('#ffffff', { map: brickTile, name: 'lmKr-brickT', paint: 0.03 }),
    brickFlat: flat(C.brick, 'brickFlat'), brickShade: flat(C.brickShade, 'brickShade'), brickDark: flat(C.brickDark, 'brickDark'),
    socle: T('#ffffff', { map: graniteTile('socle', C.socle, 11), name: 'lmKr-socle', paint: 0.03 }), socleFlat: flat(C.socle, 'socleFlat'),
    granitePink: T('#ffffff', { map: graniteTile('gpink', C.granitePink, 13), name: 'lmKr-gpink', paint: 0.03 }), granitePinkFlat: flat(C.granitePink, 'gpinkFlat'), granitePinkD: flat(C.granitePinkD, 'gpinkD'),
    granitePolish: T('#ffffff', { map: graniteTile('gpol', '#b29c96', 15, false), name: 'lmKr-gpol', paint: 0.02 }),
    graniteGrey: T('#ffffff', { map: graniteTile('ggrey', C.graniteGrey, 17), name: 'lmKr-ggrey', paint: 0.03 }), graniteGreyFlat: flat(C.graniteGrey, 'ggreyFlat'), graniteBrown: T('#ffffff', { map: graniteTile('gbrown', '#7d6558', 19), name: 'lmKr-gbrown', paint: 0.03 }),
    rubble: T('#ffffff', { map: rubbleTex, name: 'lmKr-rubble', paint: 0.04 }), rock: flat('#9a8c86', 'rock', { paint: 0.08 }), rockD: flat('#857871', 'rockD', { paint: 0.08 }),
    roof: T('#ffffff', { map: seamTile('roof', C.roof, C.roofSeam, 73), name: 'lmKr-roof', paint: 0.03, side: 'double' }),
    roofRed: T('#ffffff', { map: seamTile('roofRed', '#a8483c', '#8a372e', 79), name: 'lmKr-roofRed', paint: 0.03, side: 'double' }),
    roofZinc: T('#ffffff', { map: seamTile('roofZinc', C.zinc, '#8d9498', 83), name: 'lmKr-roofZinc', paint: 0.03, side: 'double' }),
    roofGreen: T('#ffffff', { map: seamTile('roofGreen', '#5f8f74', '#4a765e', 89), name: 'lmKr-roofGreen', paint: 0.03, side: 'double' }),
    capMetal: flat(C.capMetal, 'capMetal'), pipe: flat(C.pipe, 'pipe'), white: flat(C.white, 'white'), whiteShade: flat('#cfccc2', 'whiteShade'), cream: flat(C.cream, 'cream'),
    underside: flat('#3a4048', 'underside'), dark: flat('#20262c', 'dark', { polygonOffset: -2 }), glass: T(C.glass, { name: 'lmKr-glass', emissive: '#0a1018', emissiveIntensity: 0.22, polygonOffset: -1 }),
    glassBlue: T('#3d5c78', { name: 'lmKr-glassBlue', emissive: '#16283a', emissiveIntensity: 0.3 }),
    iron: flat(C.iron, 'iron', { paint: 0 }), bronze: flat(C.bronze, 'bronze', { paint: 0.02 }), bronzeLit: flat(C.bronzeLit, 'bronzeLit', { paint: 0.02 }), gold: T('#d8a838', { name: 'lmKr-gold', emissive: '#6a4a08', emissiveIntensity: 0.4 }),
    olive: flat(C.olive, 'olive', { paint: 0.05 }), oliveD: flat(C.oliveD, 'oliveD', { paint: 0.05 }), oliveL: flat(C.oliveL, 'oliveL', { paint: 0.05 }), track: flat(C.track, 'track'), tyre: flat(C.tyre, 'tyre'),
    silver: flat(C.silver, 'silver', { paint: 0.02 }), silverD: flat('#8e9498', 'silverD', { paint: 0.02 }), oldBronze: flat('#5a6a4c', 'oldBronze', { paint: 0.04 }), wood: flat('#6a5038', 'wood'), woodGreen: flat('#3f6a4a', 'woodGreen'),
    lawn: T('#ffffff', { map: lawnTex, name: 'lmKr-lawn', paint: 0.06, polygonOffset: -3 }), lawnSlope: T('#ffffff', { map: lawnTex, name: 'lmKr-lawnSlope', paint: 0.06 }),
    grit: T('#ffffff', { map: gritTex, name: 'lmKr-grit', paint: 0.05, polygonOffset: -4 }), slab: T('#ffffff', { map: slabTex, name: 'lmKr-slab', paint: 0.04, polygonOffset: -4 }),
    slabPink: T('#ffffff', { map: graniteTile('slabPink', '#c2b0a8', 23), name: 'lmKr-slabPink', paint: 0.04, polygonOffset: -4 }),
    saucer: flat(C.saucer, 'saucer', { paint: 0.02 }), saucerD: flat(C.saucerD, 'saucerD', { paint: 0.02 }), saucerL: flat(C.saucerL, 'saucerL', { paint: 0.02 }), blue: T(C.blue, { name: 'lmKr-blue', emissive: '#0a2a6a', emissiveIntensity: 0.3 }),
    steel: flat('#aeb4b8', 'steel', { paint: 0.01 }), lampGlobe: T('#f3efe2', { emissive: '#ffe9b0', emissiveIntensity: 0.3, name: 'lmKr-lampGlobe' }), lanternGlass: T('#e9dfb8', { emissive: '#ffd890', emissiveIntensity: 0.3, name: 'lmKr-lantern' }),
    baltic: flat(C.baltic, 'baltic'), balticD: flat(C.balticD, 'balticD'), balticL: flat(C.balticL, 'balticL'), yellow: flat(C.yellow, 'yellow'), yellowD: flat(C.yellowD, 'yellowD'), ochre: flat(C.ochre, 'ochre'), ochreD: flat(C.ochreD, 'ochreD'),
    zinc: flat(C.zinc, 'zinc', { paint: 0.02 }), zoo: flat(C.zoo, 'zoo'), zooD: flat(C.zooD, 'zooD'), benchGreen: flat('#3f6a4a', 'benchGreen'), water: T('#3f6a86', { name: 'lmKr-water', emissive: '#0c2030', emissiveIntensity: 0.25, transparent: true, opacity: 0.9 }),
    signRed: flat('#a5362c', 'signRed'), majolica: null,
  });
  M.cutouts = new Set(); M.decals = new Set();
  M.col = (hex) => { const k = hex.toLowerCase(); let m = byHex.get(k); if (!m) { m = T(hex, { name: 'lmKr-c-' + k.slice(1), paint: 0.04 }); byHex.set(k, m); } return m; };

  // ---------------------------------------------------------------- stucco house bays (copy of the fortress module's M.fac)
  const archPath = (g, cx, yb, ww, hh) => { const r = ww / 2; g.beginPath(); g.moveTo(cx - r, yb); g.lineTo(cx - r, yb - hh + r); g.arc(cx, yb - hh + r, r, Math.PI, 0, false); g.lineTo(cx + r, yb); g.closePath(); };
  const facCache = new Map();
  /** o: { key, H, bay, wall, trim, socle, socleH, glass, frame, doorCol, floors: [{ h, win: 'rect' | 'arch' | 'none' | 'door' | 'gate', ww, wh, sill, rust, rustCol, hood: 'bar' | 'ped', band, pil }], cornice, lesene, brick } */
  M.fac = (o) => {
    let m = facCache.get(o.key); if (m) return m;
    const map = tex(256, 512, 'fac-' + o.key, (g, w, h) => {
      const r = lcg(o.key.length * 7919 + 13), H = o.H, py = (y) => h - (y / H) * h, px = (x) => (x / o.bay) * w;
      g.fillStyle = o.wall; g.fillRect(0, 0, w, h);
      if (o.brick) { const ch = h / (H / 0.11), bw = w / (o.bay / 0.3); for (let c = 0; c * ch < h; c++) for (let b = -1; b * bw < w; b++) { const k = 0.93 + r() * 0.14; g.fillStyle = `rgba(${k > 1 ? 255 : 0},${k > 1 ? 255 : 0},${k > 1 ? 255 : 0},${Math.abs(k - 1) * 0.9})`; g.fillRect(b * bw + (c % 2) * bw / 2, c * ch, bw - 1, ch - 1); } }
      speckle(g, w, h, r, 500, ['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.05)'], 2, 8);
      let y0 = o.socleH || 0;
      if (o.socleH) { g.fillStyle = o.socle || '#8f8a84'; g.fillRect(0, py(o.socleH), w, h - py(o.socleH)); }
      for (const f of o.floors) {
        const y1 = y0 + f.h;
        if (f.rust) { g.fillStyle = f.rustCol || o.wall; g.fillRect(0, py(y1), w, py(y0) - py(y1)); g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 2.5; for (let y = y0 + 0.45; y < y1 - 0.1; y += 0.45) { g.beginPath(); g.moveTo(0, py(y)); g.lineTo(w, py(y)); g.stroke(); } }
        if (f.pil) { g.fillStyle = o.trim; const pw = px(f.pil); g.fillRect(0, py(y1), pw / 2, py(y0) - py(y1)); g.fillRect(w - pw / 2, py(y1), pw / 2, py(y0) - py(y1)); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(pw / 2, py(y1), 2, py(y0) - py(y1)); }
        if (f.win && f.win !== 'none') {
          const ww = px(f.ww || 1.2), wh = (f.wh || 1.9) / H * h, yb = py(y0 + (f.sill ?? 0.9)), cx = w / 2, b = Math.max(4, px(0.16));
          const arch = f.win === 'arch' || f.win === 'gate';
          g.fillStyle = o.trim;
          if (arch) { archPath(g, cx, yb + b * 0.5, ww + 2 * b, wh + b * 1.5); g.fill(); } else g.fillRect(cx - ww / 2 - b, yb - wh - b, ww + 2 * b, wh + 2 * b);
          if (f.hood) { g.fillRect(cx - ww / 2 - b * 2.2, yb - wh - b * 2.6, ww + b * 4.4, b * 1.2); if (f.hood === 'ped') { g.beginPath(); g.moveTo(cx - ww / 2 - b * 2.2, yb - wh - b * 2.6); g.lineTo(cx, yb - wh - b * 5.4); g.lineTo(cx + ww / 2 + b * 2.2, yb - wh - b * 2.6); g.closePath(); g.fill(); } }
          g.fillStyle = f.win === 'door' || f.win === 'gate' ? (o.doorCol || '#5a3a2a') : (f.glass || o.glass || C.glass);
          if (arch) { archPath(g, cx, yb, ww, wh); g.fill(); } else g.fillRect(cx - ww / 2, yb - wh, ww, wh);
          g.strokeStyle = f.win === 'door' || f.win === 'gate' ? 'rgba(30,18,10,0.7)' : (o.frame || '#e9e6dc'); g.lineWidth = Math.max(2, px(0.06));
          g.beginPath(); const nv = f.nv ?? 1; for (let i = 1; i <= nv; i++) { const x = cx - ww / 2 + ww * i / (nv + 1); g.moveTo(x, yb); g.lineTo(x, yb - wh); } if (f.win !== 'door' && f.win !== 'gate') { const nh = f.nh ?? 1; for (let i = 1; i <= nh; i++) { const y = yb - wh * (nh === 1 ? 0.62 : i / (nh + 1)); g.moveTo(cx - ww / 2, y); g.lineTo(cx + ww / 2, y); } } g.stroke();
          if (!arch && f.win !== 'door') { g.fillStyle = o.trim; g.fillRect(cx - ww / 2 - b * 1.6, yb + b * 0.2, ww + b * 3.2, b * 0.9); }
        }
        if (f.band !== false && y1 < H - 0.05) { g.fillStyle = o.trim; g.fillRect(0, py(y1) - 3, w, 6); }
        y0 = y1;
      }
      if (o.lesene) { g.fillStyle = o.trim; const lw = px(o.lesene); g.fillRect(0, 0, lw / 2, py(o.socleH || 0)); g.fillRect(w - lw / 2, 0, lw / 2, py(o.socleH || 0)); }
      if (o.cornice) { g.fillStyle = o.trim; g.fillRect(0, 0, w, (o.cornice / H) * h); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, (o.cornice / H) * h - 3, w, 3); }
    });
    m = T('#ffffff', { map, name: 'lmKr-fac-' + o.key, paint: 0.03 });
    facCache.set(o.key, m); return m;
  };
  /** a text plate / sign material: lines of text on a field (canvas w x h px) */
  M.sign = (key, w, h, lines, o = {}) => {
    const map = tex(w, h, 'sign-' + key, (g) => {
      g.fillStyle = o.bg || '#4f4435'; g.fillRect(0, 0, w, h);
      if (o.border) { g.strokeStyle = o.border; g.lineWidth = o.bw || 6; g.strokeRect(o.bw || 6, o.bw || 6, w - 2 * (o.bw || 6), h - 2 * (o.bw || 6)); }
      g.fillStyle = o.fg || '#e6d9b0'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const n = lines.length, lh = h / (n + (o.pad ?? 0.6));
      lines.forEach((s, i) => { let fs = Math.round(lh * (o.scale || 0.78)); g.font = `${o.weight || 'bold'} ${fs}px ${o.font || FONT.serif}`; const mw = g.measureText(s).width; if (mw > w * 0.92) { fs = Math.floor(fs * w * 0.92 / mw); g.font = `${o.weight || 'bold'} ${fs}px ${o.font || FONT.serif}`; } g.fillText(s, w / 2, lh * (i + 0.5 + (o.pad ?? 0.6) / 2)); });
    });
    const m = T('#ffffff', { map, name: 'lmKr-sign-' + key, paint: 0, polygonOffset: -4, ...(o.emissive ? { emissive: o.emissive, emissiveIntensity: 0.3 } : {}) });
    M.decals.add(m); return m;
  };
  return M;
}
