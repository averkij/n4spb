// landmarksAurora/mats.js - the materials of the Petrovskaya / Petrogradskaya embankment sights (dossier docs/research/aurora.md sections 2.3, 3, 4, 5, 10).
// Ship: «шаровый» grey #6e7882 with painted plating strakes (tile 6 x 2.4 m), boot-topping green #1f9d55, white line, teak deck #9a7b55, canvas #cdbb8c, barrel red / white.
// School: sky blue #6db7e6, white trim #f1f0ea, grey-green base #a9ad9a, graphite-brown roof #57504f, small-pane windows (tile = one window), gilding #d9a82c.
// Cabin: red brick #b0503c (tile 2 x 2 m), pale band #e0cfa8, pale green sheet roof #b9cdb9, dark green cast iron #3f5049.  Quay: pink granite #b08a80, grey granite #9a9690.
// Textures are painted with ctx.tex.draw (<= 512 px, shared by key).
const lcg = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };

export function makeMats(ctx) {
  const T = ctx.mat.toon;
  const tex = (w, h, key, fn, repeat = [1, 1]) => ctx.tex.draw(w, h, fn, { key: 'lmAu-' + key, repeat });
  const speckle = (g, w, h, r, n, cols, smin = 1, smax = 3) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[(r() * cols.length) | 0]; const s = smin + r() * (smax - smin); g.fillRect(r() * w, r() * h, s, s * (0.6 + r() * 0.8)); } };

  // ---- hull plating: tile 6 m x 2.4 m (two strakes of 1.2 m, butts every 6 m staggered, rivet rows)
  const hullTex = tex(512, 256, 'hull', (g, w, h) => {
    const r = lcg(7); g.fillStyle = '#6e7882'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.04)'; g.fillRect(r() * w, r() * h, 30 + r() * 120, 8 + r() * 40); }
    g.strokeStyle = 'rgba(40,46,54,0.55)'; g.lineWidth = 2;
    for (const y of [1, h / 2]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.beginPath(); g.moveTo(2, 0); g.lineTo(2, h / 2); g.moveTo(w / 2, h / 2); g.lineTo(w / 2, h); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 1.5;
    for (const y of [4, h / 2 + 3]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = 'rgba(38,44,52,0.5)';
    for (let x = 6; x < w; x += 12) { g.fillRect(x, 9, 2, 2); g.fillRect(x, h / 2 + 9, 2, 2); g.fillRect(x, h / 2 - 8, 2, 2); g.fillRect(x, h - 8, 2, 2); }
    for (let y = 14; y < h / 2 - 8; y += 12) { g.fillRect(9, y, 2, 2); g.fillRect(w / 2 + 7, y + h / 2, 2, 2); }
    g.fillStyle = 'rgba(30,36,42,0.10)'; for (let i = 0; i < 26; i++) g.fillRect(r() * w, r() * h, 2, 20 + r() * 60);          // rain streaks
  });
  // ---- teak deck planks 0.15 m, tile 2.4 m
  const deckTex = tex(256, 256, 'deck', (g, w, h) => {
    const r = lcg(11); g.fillStyle = '#9a7b55'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) { g.fillStyle = ['#a08158', '#94754f', '#a6875e', '#8e704c'][(r() * 4) | 0]; g.fillRect(0, i * 16 + 1, w, 14.4); }
    g.fillStyle = 'rgba(40,30,20,0.35)'; for (let i = 0; i < 16; i++) g.fillRect(((i * 97) % 256), i * 16, 2, 16);
  });
  // ---- mooring barrel: red / white vertical sectors (u around, 8 sectors), a dark water stain at the bottom
  const barrelTex = tex(256, 64, 'barrel', (g, w, h) => {
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#e9e6de' : '#c8322c'; g.fillRect(i * 32, 0, 32, h); }
    g.fillStyle = 'rgba(40,50,40,0.45)'; g.fillRect(0, h - 10, w, 10);
  });
  const pieTex = tex(128, 128, 'barrelTop', (g, w, h) => {                                      // the flat end of a mooring barrel: eight red / white sectors
    g.fillStyle = '#c8322c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i += 2) { g.fillStyle = '#e9e6de'; g.beginPath(); g.moveTo(w / 2, h / 2); g.arc(w / 2, h / 2, w, i * Math.PI / 4, (i + 1) * Math.PI / 4); g.fill(); }
    g.fillStyle = '#5a5e62'; g.beginPath(); g.arc(w / 2, h / 2, 9, 0, 6.3); g.fill();
  });
  // ---- school windows: one tile = one window with the small-pane grid («мелкая расстекловка»): dark glass, white bars
  const paneTex = (key, nx, ny, bar = '#f4f1e8') => tex(128, 192, key, (g, w, h) => {
    const r = lcg(17 + nx * 3 + ny); g.fillStyle = '#2b3a47'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { g.fillStyle = ['#2b3a47', '#33475a', '#27333f', '#3b5266'][(r() * 4) | 0]; g.fillRect(i * w / nx, j * h / ny, w / nx, h / ny); }
    g.fillStyle = 'rgba(150,190,220,0.18)'; g.beginPath(); g.moveTo(0, h * 0.55); g.lineTo(w, h * 0.2); g.lineTo(w, 0); g.lineTo(0, 0); g.fill();
    g.fillStyle = bar; g.fillRect(0, 0, w, 5); g.fillRect(0, h - 5, w, 5); g.fillRect(0, 0, 5, h); g.fillRect(w - 5, 0, 5, h);
    for (let i = 1; i < nx; i++) g.fillRect(i * w / nx - (i * 2 === nx ? 3 : 1.5), 0, i * 2 === nx ? 6 : 3, h);
    for (let j = 1; j < ny; j++) g.fillRect(0, j * h / ny - 1.5, w, 3);
  });
  // ---- plain back-wall tile of the school (one bay 3.2 m x one storey 4.4 m): blue wall with a white-framed window
  const backTex = (key, wall, band) => tex(128, 176, key, (g, w, h) => {
    g.fillStyle = wall; g.fillRect(0, 0, w, h);
    g.fillStyle = band; g.fillRect(0, h - 8, w, 8);
    g.fillStyle = '#f1f0ea'; g.fillRect(34, 34, 60, 100);
    g.fillStyle = '#2b3a47'; g.fillRect(39, 39, 50, 90);
    g.fillStyle = '#f1f0ea'; g.fillRect(62, 39, 4, 90); for (let j = 1; j < 4; j++) g.fillRect(39, 39 + j * 22.5 - 1, 50, 3); g.fillRect(50, 39, 2, 90); g.fillRect(76, 39, 2, 90);
  });
  // ---- red brick, running bond: tile 2 m x 2 m
  const brickTex = tex(256, 256, 'brick', (g, w, h) => {
    const r = lcg(101), B = ['#b0503c', '#b95a42', '#a44834', '#aa4d38', '#bd624a', '#9c4230'];
    g.fillStyle = '#c9ab90'; g.fillRect(0, 0, w, h);
    const bh = h / 26, bw = w / 7.7;
    for (let c = 0; c < 26; c++) { const off = (c % 2) * bw / 2, y = c * bh; for (let x = -bw; x < w + bw; x += bw) { g.fillStyle = B[(r() * B.length) | 0]; g.fillRect(x + off + 1, y + 1, bw - 2, bh - 1.4); } }
  });
  const granite = (key, base, cols, seed, course = 0) => tex(256, 256, key, (g, w, h) => {
    const r = lcg(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
    speckle(g, w, h, r, 1500, cols, 1.2, 3.4);
    if (course) { g.strokeStyle = 'rgba(60,44,42,0.55)'; g.lineWidth = 2; for (let y = 0; y <= h; y += course) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); const off = (Math.round(y / course) % 2) ? 0 : 96; for (let x = off; x <= w; x += 192) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + course); g.stroke(); } } }
  });
  const pinkTex = granite('pink', '#b08a80', ['#9a7168', '#c7a297', '#a67d73', '#bd978c', '#7f5f58'], 113, 64);        // ashlar courses 0.5 m, tile 2 m
  const pinkSlabTex = granite('pinkSlab', '#b08a80', ['#9a7168', '#c7a297', '#a67d73', '#bd978c'], 127);
  const greyTex = granite('grey', '#9a9690', ['#84807a', '#b0aca6', '#8e8a84', '#a6a29c', '#74706a'], 131);
  const sheetTex = (key, base, seam, seed) => tex(256, 256, key, (g, w, h) => {                 // standing-seam roof, seams every 0.6 m (tile 2.4 m)
    const r = lcg(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
    speckle(g, w, h, r, 400, ['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.06)'], 2, 9);
    for (let x = 0; x < w; x += 64) { g.fillStyle = seam; g.fillRect(x, 0, 3, h); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x + 3, 0, 2, h); }
  });
  const gravelTex = tex(256, 256, 'gravel', (g, w, h) => { const r = lcg(139); g.fillStyle = '#a2726a'; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 2200, ['#8f6259', '#b5857c', '#996a61', '#ab7b72'], 1, 3); });

  const M = {
    // ---- ship
    hull: T('#ffffff', { map: hullTex, name: 'lmAu-hull', paint: 0.03, side: 'double' }),
    grey: T('#6e7882', { name: 'lmAu-grey', paint: 0.03 }),
    greyD: T('#6e7882', { name: 'lmAu-greyD', paint: 0.03, side: 'double' }),
    greyLight: T('#8a939c', { name: 'lmAu-greyLight', paint: 0.03 }),
    greyDark: T('#474e57', { name: 'lmAu-greyDark', paint: 0.03 }),
    boot: T('#1f9d55', { name: 'lmAu-boot', paint: 0.03 }),
    white: T('#eeece4', { name: 'lmAu-shipWhite', paint: 0.02 }),
    deck: T('#ffffff', { map: deckTex, name: 'lmAu-deck', paint: 0.04 }),
    canvas: T('#c8bc9c', { name: 'lmAu-canvas', paint: 0.05 }),
    black: T('#1c1f22', { name: 'lmAu-black' }),
    mouth: T('#23272b', { name: 'lmAu-mouth' }),
    brass: T('#c9a24b', { name: 'lmAu-brass' }),
    port: T('#2a3642', { name: 'lmAu-portGlass', emissive: '#0a1018', emissiveIntensity: 0.2 }),
    red: T('#c8322c', { name: 'lmAu-red', paint: 0.02 }),
    redDeep: T('#8e2a26', { name: 'lmAu-redDeep', paint: 0.02 }),
    barrel: T('#ffffff', { map: barrelTex, name: 'lmAu-barrel', paint: 0.02 }),
    barrelTop: T('#ffffff', { map: pieTex, name: 'lmAu-barrelTop' }),
    ladder: T('#c9a23a', { name: 'lmAu-ladder', paint: 0.03 }),
    rust: T('#5a4a40', { name: 'lmAu-dolphin', paint: 0.05 }),
    // ---- school
    blue: T('#6db7e6', { name: 'lmAu-blue', paint: 0.035 }),
    blueShade: T('#5aa6d8', { name: 'lmAu-blueShade', paint: 0.035 }),
    trim: T('#f1f0ea', { name: 'lmAu-trim', paint: 0.025 }),
    trimShade: T('#dcdad0', { name: 'lmAu-trimShade', paint: 0.025 }),
    base: T('#a9ad9a', { name: 'lmAu-base', paint: 0.035 }),
    plinth: T('#ffffff', { map: greyTex, name: 'lmAu-plinth', paint: 0.03 }),
    roof: T('#ffffff', { map: sheetTex('roof', '#57504f', '#433d3c', 191), name: 'lmAu-roof', paint: 0.03, side: 'double' }),
    roofDark: T('#3c3838', { name: 'lmAu-roofDark', paint: 0.03 }),
    win34: T('#ffffff', { map: paneTex('win34', 4, 6), name: 'lmAu-win46' }),
    win23: T('#ffffff', { map: paneTex('win23', 2, 4), name: 'lmAu-win24' }),
    winBrown: T('#ffffff', { map: paneTex('winBrown', 4, 5, '#5a3a2c'), name: 'lmAu-winBrown' }),
    backBlue: T('#ffffff', { map: backTex('backBlue', '#6db7e6', '#f1f0ea'), name: 'lmAu-backBlue', paint: 0.03 }),
    backBase: T('#ffffff', { map: backTex('backBase', '#a9ad9a', '#f1f0ea'), name: 'lmAu-backBase', paint: 0.03 }),
    door: T('#8a5a36', { name: 'lmAu-door', paint: 0.04 }),
    gold: T('#d9a82c', { name: 'lmAu-gold', emissive: '#6a4a08', emissiveIntensity: 0.35 }),
    clock: T('#e9e2c8', { name: 'lmAu-clockFace' }),
    // ---- cabin
    brick: T('#ffffff', { map: brickTex, name: 'lmAu-brick', paint: 0.04 }),
    brickBand: T('#e0cfa8', { name: 'lmAu-brickBand', paint: 0.03 }),
    cabinRoof: T('#ffffff', { map: sheetTex('cabinRoof', '#b9cdb9', '#9db59f', 197), name: 'lmAu-cabinRoof', paint: 0.03, side: 'double' }),
    logRed: T('#8e3a2e', { name: 'lmAu-logRed', paint: 0.05 }),
    logRoof: T('#6a4a3a', { name: 'lmAu-logRoof', paint: 0.05 }),
    fence: T('#3f5049', { name: 'lmAu-fence' }),
    iron: T('#1f2224', { name: 'lmAu-iron' }),
    gravel: T('#ffffff', { map: gravelTex, name: 'lmAu-gravel', paint: 0.05, polygonOffset: -2 }),
    lawn: T('#5f9a3a', { name: 'lmAu-lawn', paint: 0.08, polygonOffset: -1 }),
    bench: T('#3f7f4a', { name: 'lmAu-bench', paint: 0.03 }),
    // ---- granite
    pink: T('#ffffff', { map: pinkTex, name: 'lmAu-pink', paint: 0.03 }),
    pinkSlab: T('#ffffff', { map: pinkSlabTex, name: 'lmAu-pinkSlab', paint: 0.03 }),
    pinkDark: T('#8e6a62', { name: 'lmAu-pinkDark', paint: 0.03 }),
    greyGranite: T('#ffffff', { map: greyTex, name: 'lmAu-greyGranite', paint: 0.03 }),
    stone: T('#b3aea4', { name: 'lmAu-lionStone', paint: 0.06 }),
    stoneDark: T('#6f6b64', { name: 'lmAu-lionStoneDark', paint: 0.04 }),
    darkStone: T('#4a4a4e', { name: 'lmAu-darkStone', paint: 0.03 }),
    water: T('#3f6a92', { name: 'lmAu-waterPatch', paint: 0.02 }),
  };
  M.cutouts = new Set();
  M.decals = new Set();
  M.tex = tex;
  return M;
}
