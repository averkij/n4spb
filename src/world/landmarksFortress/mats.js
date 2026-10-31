// landmarksFortress/mats.js - the materials of the Peter and Paul Fortress (dossier docs/research/fortress.md sections 5-8).
// Colours: Neva granite #8f867f (courses 0.46 m), strait brick #b5503c on a limestone socle #cfc6b4, Zotov plaster #a89a94, inner casemate fronts red #b9483a with white frames, wall roofs mint green #b7d1bd,
// cathedral yellow #e6c263 with cream trim #f0e6c4, gilding #e8b93a, hall roof #c9cfd2, vault dome maroon #6a3f3a, cobbles #8d8a86, sand #d9c591, lawn #6a9c3e, iron green #5d7a66.
// WALL TEXTURES are painted for one bay: u = metres along the wall / bay width, v = 0..1 over the whole face height (the face is one quad per edge).
// M.fac(opts) paints a house facade bay (floors with windows, socle, bands, cornice) and caches the material by its key.  Canvas top = v 1.
const lcg = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };

export const C = {
  granite: '#8f867f', graniteLit: '#a59b92', graniteDark: '#6f6862', brick: '#b5503c', brickDark: '#93402f', limestone: '#cfc6b4', plaster: '#a89a94', inner: '#b9483a', white: '#efece2', whiteShade: '#d5d1c4',
  mint: '#aac6b2', mintShade: '#90ae9a', chimney: '#b44a3c', yellow: '#e8c870', yellowShade: '#d2ae58', cream: '#f2e6ba', creamShade: '#dccf9e', gold: '#e8b93a', hallRoof: '#c9cfd2', maroon: '#6a3f3a',
  cobble: '#8d8a86', sand: '#d9c591', lawn: '#6a9c3e', ironGreen: '#5d7a66', iron: '#26282c', glass: '#2e3c46', redRoof: '#b8463d', greenRoof: '#5f9a78', greyRoof: '#a9b0b4', timber: '#7a6248', timberDark: '#4a3b2e',
};

export function makeMats(ctx) {
  const T = ctx.mat.toon;
  const tex = (w, h, key, fn, repeat = [1, 1]) => ctx.tex.draw(w, h, fn, { key: 'lmFort-' + key, repeat });
  const speckle = (g, w, h, r, n, cols, smin = 1, smax = 3) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[(r() * cols.length) | 0]; const s = smin + r() * (smax - smin); g.fillRect(r() * w, r() * h, s, s * (0.6 + r() * 0.8)); } };
  const archPath = (g, cx, yb, ww, hh) => { const r = ww / 2; g.beginPath(); g.moveTo(cx - r, yb); g.lineTo(cx - r, yb - hh + r); g.arc(cx, yb - hh + r, r, Math.PI, 0, false); g.lineTo(cx + r, yb); g.closePath(); };

  // ---------------------------------------------------------------- rampart faces (256 x 512 = one bay x the face height)
  /** granite ashlar: 20 courses, bonded joints; opts.win = an arched casemate window with a pale surround in the upper half */
  const graniteTex = (key, win, seed) => tex(256, 512, key, (g, w, h) => {
    const r = lcg(seed); g.fillStyle = C.granite; g.fillRect(0, 0, w, h);
    const ch = h / 20, bw = w / 4;
    for (let c = 0; c < 20; c++) for (let b = -1; b < 5; b++) {
      const off = (c % 2) * bw / 2, k = 0.9 + r() * 0.2, base = c >= 18 ? [0x70, 0x69, 0x63] : [0x92, 0x89, 0x82];
      g.fillStyle = `rgb(${base[0] * k | 0},${base[1] * k | 0},${(base[2] * (k + (r() - 0.5) * 0.06)) | 0})`;
      g.fillRect(b * bw + off + 1, c * ch + 1, bw - 2, ch - 2);
    }
    speckle(g, w, h, r, 900, ['rgba(60,54,50,0.25)', 'rgba(190,178,168,0.25)', 'rgba(150,120,110,0.2)'], 1, 3);
    g.fillStyle = 'rgba(40,36,34,0.28)'; g.fillRect(0, h - 10, w, 10);                                  // damp foot
    if (win) {
      const cx = w / 2, yb = h * 0.60, ww = w * 0.26, hh = h * 0.22;
      g.fillStyle = '#c9c1b6'; archPath(g, cx, yb + 6, ww + 18, hh + 14); g.fill();
      g.fillStyle = '#20262c'; archPath(g, cx, yb, ww, hh); g.fill();
      g.strokeStyle = '#d8d4c8'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, yb); g.lineTo(cx, yb - hh); g.moveTo(cx - ww / 2, yb - hh * 0.45); g.lineTo(cx + ww / 2, yb - hh * 0.45); g.stroke();
    }
  });
  /** red brick over a limestone socle (13 % of the height); opts.emb = a pointed brick niche with a small white-framed window */
  const brickTex = (key, emb, seed) => tex(256, 512, key, (g, w, h) => {
    const r = lcg(seed); g.fillStyle = '#c9a58c'; g.fillRect(0, 0, w, h);
    const ch = h / 64, bw = w / 10; const cols = ['#b5503c', '#bd5a42', '#a94a36', '#c0604a', '#b0543e', '#a2452f'];
    for (let c = 0; c < 64; c++) for (let b = -1; b < 11; b++) { g.fillStyle = cols[(r() * cols.length) | 0]; g.fillRect(b * bw + (c % 2) * bw / 2 + 0.6, c * ch + 0.6, bw - 1.2, ch - 1.2); }
    const sy = h * 0.87; g.fillStyle = C.limestone; g.fillRect(0, sy, w, h - sy);
    g.strokeStyle = 'rgba(110,100,84,0.6)'; g.lineWidth = 2; for (let y = sy; y < h; y += (h - sy) / 3) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    for (let x = 0; x < w; x += w / 3) { g.beginPath(); g.moveTo(x, sy); g.lineTo(x, h); g.stroke(); }
    speckle(g, w, sy, r, 500, ['rgba(70,30,20,0.22)', 'rgba(230,170,140,0.2)'], 1, 3);
    if (emb) {
      const cx = w / 2, yb = h * 0.66, ww = w * 0.34, hh = h * 0.2;
      g.fillStyle = '#8f3b2b'; g.beginPath(); g.moveTo(cx - ww / 2, yb); g.lineTo(cx - ww / 2, yb - hh * 0.55); g.quadraticCurveTo(cx - ww * 0.3, yb - hh * 0.95, cx, yb - hh); g.quadraticCurveTo(cx + ww * 0.3, yb - hh * 0.95, cx + ww / 2, yb - hh * 0.55); g.lineTo(cx + ww / 2, yb); g.closePath(); g.fill();
      g.fillStyle = '#e6e0d2'; archPath(g, cx, yb - 4, ww * 0.42, hh * 0.42); g.fill(); g.fillStyle = '#232a30'; archPath(g, cx, yb - 7, ww * 0.3, hh * 0.34); g.fill();
      g.fillStyle = '#d9d3c4'; g.fillRect(cx - ww / 2 - 4, yb, ww + 8, 6);
    }
  });
  const plasterTex = tex(256, 512, 'plaster', (g, w, h) => {
    const r = lcg(31); g.fillStyle = C.plaster; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 1200, ['rgba(120,106,100,0.3)', 'rgba(196,184,176,0.3)'], 2, 7);
    g.strokeStyle = 'rgba(90,80,76,0.35)'; g.lineWidth = 1.5; for (let c = 1; c < 12; c++) { g.beginPath(); g.moveTo(0, c * h / 12); g.lineTo(w, c * h / 12); g.stroke(); }
    g.fillStyle = 'rgba(60,54,52,0.3)'; g.fillRect(0, h * 0.93, w, h * 0.07);
  });
  /** inner casemate front: red plaster, two tiers of arched openings with white frames, a white string course (bay 4.6 m) */
  const innerTex = (key, tiers, seed) => tex(256, 512, key, (g, w, h) => {
    const r = lcg(seed); g.fillStyle = C.inner; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 700, ['rgba(140,40,30,0.3)', 'rgba(220,110,90,0.22)'], 2, 6);
    g.fillStyle = '#e9e4d8'; g.fillRect(0, h * 0.5 - 5, w, 10); g.fillRect(0, 0, w, 12); g.fillStyle = '#8a8580'; g.fillRect(0, h * 0.955, w, h * 0.045);
    const tier = (yb, hh, ww, door) => {
      const cx = w / 2;
      g.fillStyle = '#efeadd'; archPath(g, cx, yb, ww + 22, hh + 11); g.fill();
      g.fillStyle = door ? '#5a3a2a' : '#27313a'; archPath(g, cx, yb, ww, hh); g.fill();
      g.strokeStyle = door ? '#3a2418' : '#dcd8cc'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, yb); g.lineTo(cx, yb - hh); g.moveTo(cx - ww / 2, yb - hh * 0.6); g.lineTo(cx + ww / 2, yb - hh * 0.6); g.stroke();
    };
    if (tiers === 2) { tier(h * 0.955, h * 0.3, w * 0.44, r() < 0.34); tier(h * 0.43, h * 0.24, w * 0.3, false); }
    else { tier(h * 0.955, h * 0.5, w * 0.5, r() < 0.5); }
  });
  const seamTex = (key, base, seam, seed) => tex(256, 256, key, (g, w, h) => {
    const r = lcg(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
    speckle(g, w, h, r, 500, ['rgba(255,255,255,0.06)', 'rgba(0,0,0,0.06)'], 2, 9);
    g.fillStyle = seam; for (let x = 0; x < w; x += 64) { g.fillRect(x, 0, 3, h); }
    g.fillStyle = 'rgba(255,255,255,0.1)'; for (let x = 3; x < w; x += 64) g.fillRect(x, 0, 2, h);
  });
  // ---------------------------------------------------------------- ground
  const cobbleTex = tex(256, 256, 'cobble', (g, w, h) => {                                          // rounded cobbles ~0.12 m, tile 2 m: low contrast, tightly packed
    const r = lcg(41); g.fillStyle = '#7e7b77'; g.fillRect(0, 0, w, h);
    const n = 17, s = w / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n + 1; i++) { const k = 0.93 + r() * 0.14; g.fillStyle = `rgb(${146 * k | 0},${142 * k | 0},${(137 + r() * 8) * k | 0})`; g.beginPath(); g.ellipse(i * s + (j % 2) * s / 2 + (r() - 0.5) * 2, j * s + s / 2 + (r() - 0.5) * 2, s * 0.47, s * 0.45, r() * 3, 0, 6.3); g.fill(); }
  });
  const slabTex = tex(256, 256, 'slab', (g, w, h) => {                                              // granite slabs 0.5 x 1 m, tile 2 m
    const r = lcg(43); g.fillStyle = '#a7a39c'; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 900, ['#98948d', '#b6b2ab', '#8e8a84'], 1, 3);
    g.strokeStyle = 'rgba(70,66,62,0.6)'; g.lineWidth = 2; for (let y = 0; y <= h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); const off = (y / 64) % 2 ? 0 : 64; for (let x = off; x <= w; x += 128) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke(); } }
  });
  const sandTex = tex(256, 256, 'sand', (g, w, h) => { const r = lcg(47); g.fillStyle = C.sand; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 1800, ['#cdb882', '#e4d2a0', '#c2ad76', '#dccb9a'], 1, 3); });
  const lawnTex = tex(256, 256, 'lawn', (g, w, h) => { const r = lcg(53); g.fillStyle = C.lawn; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 1800, ['#7aae48', '#588a30', '#74a842', '#84b652'], 1.5, 4); });
  const gravelTex = tex(256, 256, 'gravel', (g, w, h) => { const r = lcg(59); g.fillStyle = '#b9a694'; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 2200, ['#a89684', '#c8b6a4', '#9c8a7a', '#c2ae9c'], 1, 3); });
  const asphaltTex = tex(256, 256, 'asphalt', (g, w, h) => { const r = lcg(61); g.fillStyle = '#6b6e72'; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 1500, ['#5e6165', '#787b7f', '#64676b'], 1, 3); });
  const plankTex = tex(256, 256, 'plank', (g, w, h) => {                                             // deck planks 0.2 m across, tile 2 m (boards run along u)
    const r = lcg(67); g.fillStyle = '#7d6a54'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 10; i++) { g.fillStyle = ['#8f7a60', '#84705a', '#9a8468', '#7c6850', '#8a7458'][(r() * 5) | 0]; g.fillRect(0, i * 25.6 + 1, w, 23.6); if (r() < 0.6) { g.fillStyle = 'rgba(50,38,28,0.5)'; g.fillRect(r() * w, i * 25.6, 2, 25.6); } }
  });
  const goldTex = tex(256, 128, 'gold', (g, w, h) => {
    const r = lcg(71); g.fillStyle = '#e9b43c'; g.fillRect(0, 0, w, h);
    for (let row = 0; row * 32 < h; row++) for (let c = -1; c * 64 < w; c++) { const k = 0.9 + r() * 0.2; g.fillStyle = `rgb(${Math.min(255, 238 * k) | 0},${Math.min(255, 186 * k) | 0},${Math.min(255, 66 * k) | 0})`; g.fillRect(c * 64 + (row % 2) * 32 + 1, row * 32 + 1, 62, 30); }
  });

  const M = {
    C,
    granite: T('#ffffff', { map: graniteTex('granite', false, 11), name: 'lmFort-granite', paint: 0.03 }),
    graniteWin: T('#ffffff', { map: graniteTex('graniteWin', true, 13), name: 'lmFort-graniteWin', paint: 0.03 }),
    graniteFlat: T(C.granite, { name: 'lmFort-graniteFlat', paint: 0.04 }), graniteLit: T(C.graniteLit, { name: 'lmFort-graniteLit', paint: 0.04 }), graniteDark: T(C.graniteDark, { name: 'lmFort-graniteDark', paint: 0.03 }),
    brick: T('#ffffff', { map: brickTex('brick', false, 17), name: 'lmFort-brick', paint: 0.03 }),
    brickEmb: T('#ffffff', { map: brickTex('brickEmb', true, 19), name: 'lmFort-brickEmb', paint: 0.03 }),
    brickFlat: T(C.brick, { name: 'lmFort-brickFlat', paint: 0.05 }), brickDark: T(C.brickDark, { name: 'lmFort-brickDark', paint: 0.04 }), limestone: T(C.limestone, { name: 'lmFort-limestone', paint: 0.03 }),
    plaster: T('#ffffff', { map: plasterTex, name: 'lmFort-plaster', paint: 0.03 }), plasterFlat: T(C.plaster, { name: 'lmFort-plasterFlat', paint: 0.04 }),
    inner2: T('#ffffff', { map: innerTex('inner2', 2, 23), name: 'lmFort-inner2', paint: 0.03 }), inner1: T('#ffffff', { map: innerTex('inner1', 1, 29), name: 'lmFort-inner1', paint: 0.03 }),
    innerFlat: T(C.inner, { name: 'lmFort-innerFlat', paint: 0.05 }),
    roofMint: T('#ffffff', { map: seamTex('mint', C.mint, C.mintShade, 73), name: 'lmFort-roofMint', paint: 0.03, side: 'double' }),
    roofRed: T('#ffffff', { map: seamTex('red', C.redRoof, '#96382f', 79), name: 'lmFort-roofRed', paint: 0.03, side: 'double' }),
    roofGreen: T('#ffffff', { map: seamTex('green', C.greenRoof, '#4a7f62', 83), name: 'lmFort-roofGreen', paint: 0.03, side: 'double' }),
    roofGrey: T('#ffffff', { map: seamTex('grey', C.greyRoof, '#8d9498', 89), name: 'lmFort-roofGrey', paint: 0.03, side: 'double' }),
    roofHall: T('#ffffff', { map: seamTex('hall', C.hallRoof, '#aab1b5', 97), name: 'lmFort-roofHall', paint: 0.03, side: 'double' }),
    roofBlue: T('#ffffff', { map: seamTex('blue', '#8fa3b5', '#74889a', 101), name: 'lmFort-roofBlue', paint: 0.03, side: 'double' }),
    chimney: T(C.chimney, { name: 'lmFort-chimney', paint: 0.04 }), white: T(C.white, { name: 'lmFort-white', paint: 0.03 }), whiteShade: T(C.whiteShade, { name: 'lmFort-whiteShade', paint: 0.03 }),
    yellow: T(C.yellow, { name: 'lmFort-yellow', paint: 0.04 }), yellowShade: T(C.yellowShade, { name: 'lmFort-yellowShade', paint: 0.04 }), cream: T(C.cream, { name: 'lmFort-cream', paint: 0.03 }), creamShade: T(C.creamShade, { name: 'lmFort-creamShade', paint: 0.03 }),
    gold: T('#ffffff', { map: goldTex, emissive: '#6a4a08', emissiveIntensity: 0.4, name: 'lmFort-gold' }), goldFlat: T('#dca62c', { emissive: '#6a4a08', emissiveIntensity: 0.4, name: 'lmFort-goldFlat' }),
    maroon: T(C.maroon, { name: 'lmFort-maroon', paint: 0.03 }), stoneGrey: T('#b9b6ae', { name: 'lmFort-stoneGrey', paint: 0.03 }), stoneGreyShade: T('#9c9992', { name: 'lmFort-stoneGreyShade', paint: 0.03 }),
    underside: T('#3a4048', { name: 'lmFort-underside' }), dark: T('#20262c', { name: 'lmFort-dark', polygonOffset: -2 }), glass: T(C.glass, { name: 'lmFort-glass', emissive: '#0a1018', emissiveIntensity: 0.22, polygonOffset: -1 }),
    iron: T(C.iron, { name: 'lmFort-iron' }), ironGreen: T(C.ironGreen, { name: 'lmFort-ironGreen', paint: 0.02 }), bronze: T('#4a4034', { name: 'lmFort-bronze', paint: 0.02 }), lead: T('#2c2d30', { name: 'lmFort-lead', paint: 0.02 }),
    bell: T('#3d3a2c', { name: 'lmFort-bell', paint: 0.02 }), wood: T('#4a3628', { name: 'lmFort-wood', paint: 0.03 }), door: T('#6a4630', { name: 'lmFort-door', paint: 0.03 }),
    timber: T(C.timber, { name: 'lmFort-timber', paint: 0.04 }), timberDark: T(C.timberDark, { name: 'lmFort-timberDark', paint: 0.04 }), timberGreen: T('#3f4a40', { name: 'lmFort-timberGreen', paint: 0.03 }),
    cobble: T('#ffffff', { map: cobbleTex, name: 'lmFort-cobble', paint: 0.04, polygonOffset: -2 }),
    slab: T('#ffffff', { map: slabTex, name: 'lmFort-slab', paint: 0.04, polygonOffset: -3 }),
    sand: T('#ffffff', { map: sandTex, name: 'lmFort-sand', paint: 0.05, polygonOffset: -1 }),
    lawn: T('#ffffff', { map: lawnTex, name: 'lmFort-lawn', paint: 0.06, polygonOffset: -3 }),
    gravel: T('#ffffff', { map: gravelTex, name: 'lmFort-gravel', paint: 0.05, polygonOffset: -4 }),
    asphalt: T('#ffffff', { map: asphaltTex, name: 'lmFort-asphalt', paint: 0.04, polygonOffset: -4 }),
    plank: T('#ffffff', { map: plankTex, name: 'lmFort-plank', paint: 0.04 }),
    lampGlass: T('#f3efe2', { emissive: '#ffe9b0', emissiveIntensity: 0.3, name: 'lmFort-lampGlass' }),
  };
  M.cutouts = new Set();
  M.decals = new Set();

  // ---------------------------------------------------------------- house facades: one bay per u unit, v over the wall height
  const facCache = new Map();
  /**
   * o: { key, H (wall height m), bay (m), wall, trim, socle (colour), socleH (m), glass, floors: [{ h (m), win: 'rect' | 'arch' | 'none' | 'door' | 'gate', ww, wh (m), sill (m above the floor), rust, hood, band }],
   *      cornice (m), lesene (m: a trim strip on both edges of the bay) }.  Returns the cached toon material.
   */
  M.fac = (o) => {
    let m = facCache.get(o.key); if (m) return m;
    const map = tex(256, 512, 'fac-' + o.key, (g, w, h) => {
      const r = lcg(o.key.length * 7919 + 13), H = o.H, py = (y) => h - (y / H) * h, px = (x) => (x / o.bay) * w;
      g.fillStyle = o.wall; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 500, ['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.05)'], 2, 8);
      let y0 = o.socleH || 0;
      if (o.socleH) { g.fillStyle = o.socle || '#8f8a84'; g.fillRect(0, py(o.socleH), w, h - py(o.socleH)); }
      for (const f of o.floors) {
        const y1 = y0 + f.h;
        if (f.rust) { g.fillStyle = f.rustCol || o.wall; g.fillRect(0, py(y1), w, py(y0) - py(y1)); g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 2.5; for (let y = y0 + 0.45; y < y1 - 0.1; y += 0.45) { g.beginPath(); g.moveTo(0, py(y)); g.lineTo(w, py(y)); g.stroke(); } }
        if (f.win && f.win !== 'none') {
          const ww = px(f.ww || 1.2), wh = (f.wh || 1.9) / H * h, yb = py(y0 + (f.sill ?? 0.9)), cx = w / 2, b = Math.max(4, px(0.16));
          const arch = f.win === 'arch' || f.win === 'gate';
          g.fillStyle = o.trim;
          if (arch) { archPath(g, cx, yb + b * 0.5, ww + 2 * b, wh + b * 1.5); g.fill(); } else g.fillRect(cx - ww / 2 - b, yb - wh - b, ww + 2 * b, wh + 2 * b);
          if (f.hood) { g.fillRect(cx - ww / 2 - b * 2.2, yb - wh - b * 2.6, ww + b * 4.4, b * 1.2); if (f.hood === 'ped') { g.beginPath(); g.moveTo(cx - ww / 2 - b * 2.2, yb - wh - b * 2.6); g.lineTo(cx, yb - wh - b * 5.4); g.lineTo(cx + ww / 2 + b * 2.2, yb - wh - b * 2.6); g.closePath(); g.fill(); } }
          g.fillStyle = f.win === 'door' || f.win === 'gate' ? (o.doorCol || '#5a3a2a') : (o.glass || C.glass);
          if (arch) { archPath(g, cx, yb, ww, wh); g.fill(); } else g.fillRect(cx - ww / 2, yb - wh, ww, wh);
          g.strokeStyle = f.win === 'door' || f.win === 'gate' ? 'rgba(30,18,10,0.7)' : (o.frame || '#e9e6dc'); g.lineWidth = Math.max(2, px(0.06));
          g.beginPath(); g.moveTo(cx, yb); g.lineTo(cx, yb - wh); if (f.win !== 'door' && f.win !== 'gate') { g.moveTo(cx - ww / 2, yb - wh * 0.62); g.lineTo(cx + ww / 2, yb - wh * 0.62); } g.stroke();
          if (!arch && f.win !== 'door') { g.fillStyle = o.trim; g.fillRect(cx - ww / 2 - b * 1.6, yb + b * 0.2, ww + b * 3.2, b * 0.9); }
        }
        if (f.band !== false && y1 < H - 0.05) { g.fillStyle = o.trim; g.fillRect(0, py(y1) - 3, w, 6); }
        y0 = y1;
      }
      if (o.lesene) { g.fillStyle = o.trim; const lw = px(o.lesene); g.fillRect(0, 0, lw / 2, py(o.socleH || 0)); g.fillRect(w - lw / 2, 0, lw / 2, py(o.socleH || 0)); }
      if (o.cornice) { g.fillStyle = o.trim; g.fillRect(0, 0, w, (o.cornice / H) * h); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, (o.cornice / H) * h - 3, w, 3); }
    });
    m = T('#ffffff', { map, name: 'lmFort-fac-' + o.key, paint: 0.03 });
    facCache.set(o.key, m); return m;
  };
  /** a plain toon colour, cached by the engine */
  M.col = (hex, name) => T(hex, { name: 'lmFort-c-' + (name || hex.slice(1)), paint: 0.04 });
  M.tex = tex;
  return M;
}
