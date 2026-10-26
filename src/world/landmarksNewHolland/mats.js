// landmarksNewHolland/mats.js - the materials of New Holland island (dossier docs/research/new-holland.md sections 4-8, 13).
// Colours: weathered red brick #a9503a (arch #a24c36), mortar #c9a98a, limestone plinth #cfc3a4, arch ring #c9b98a, arch granite #6f6a66, graphite sheet roof #4a4d52, Bottle roof #8a4a40, Kuznya roof #7a3a30,
// Commandant's trim #ecdcb0, Kovsh quay granite #b9a79a, black iron #26262a, granite sett #a09d9a with pale kerb #c8c4bc, lawn #5fa23a, timber deck #8a7058, silver-grey cladding #9a9486.
// Textures are painted here with ctx.tex.draw (<= 512 px, shared by key, world-scale uv: see the tile sizes noted per texture).
const lcg = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };

export function makeMats(ctx) {
  const T = ctx.mat.toon;
  const tex = (w, h, key, fn, repeat = [1, 1]) => ctx.tex.draw(w, h, fn, { key: 'lmNH-' + key, repeat });
  const speckle = (g, w, h, r, n, cols, smin = 1, smax = 3) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[(r() * cols.length) | 0]; const s = smin + r() * (smax - smin); g.fillRect(r() * w, r() * h, s, s * (0.6 + r() * 0.8)); } };
  const BRICKS = ['#a9503a', '#b45a40', '#9c4733', '#a24c36', '#b8624a', '#94412f', '#ac5640'];

  // ---- red brick, running bond: a tile = 2 m x 2 m (brick 0.26 x 0.075 m, 26 courses)
  const brickTex = tex(256, 256, 'brick', (g, w, h) => {
    const r = lcg(101); g.fillStyle = '#c4a58a'; g.fillRect(0, 0, w, h);
    const bh = h / 26, bw = w / 7.7;
    for (let c = 0; c < 26; c++) {
      const off = (c % 2) * bw / 2, y = c * bh;
      for (let x = -bw; x < w + bw; x += bw) {
        g.fillStyle = BRICKS[(r() * BRICKS.length) | 0]; g.globalAlpha = 0.9 + r() * 0.1;
        g.fillRect(x + off + 1, y + 1, bw - 2, bh - 1.4);
      }
    }
    g.globalAlpha = 1; speckle(g, w, h, r, 260, ['#7a3626', '#c6785c', '#8a4030'], 1, 3);
  });
  // ---- brick pier with chevron relief (the herring-bone jambs of the warehouse arcades): tile 2 m x 2 m
  const chevTex = tex(256, 256, 'chev', (g, w, h) => {
    const r = lcg(103); g.fillStyle = '#c0a088'; g.fillRect(0, 0, w, h);
    const bh = h / 26, bw = w / 7.7;
    for (let c = 0; c < 26; c++) { const off = (c % 2) * bw / 2, y = c * bh; for (let x = -bw; x < w + bw; x += bw) { g.fillStyle = BRICKS[(r() * BRICKS.length) | 0]; g.fillRect(x + off + 1, y + 1, bw - 2, bh - 1.4); } }
    g.strokeStyle = 'rgba(80,32,22,0.55)'; g.lineWidth = 3;
    for (let k = -2; k < 6; k++) { g.beginPath(); g.moveTo(w / 2, k * 64 + 8); g.lineTo(0, k * 64 + 48); g.moveTo(w / 2, k * 64 + 8); g.lineTo(w, k * 64 + 48); g.stroke(); }
    g.strokeStyle = 'rgba(210,150,120,0.5)'; g.lineWidth = 2;
    for (let k = -2; k < 6; k++) { g.beginPath(); g.moveTo(w / 2, k * 64 + 14); g.lineTo(0, k * 64 + 54); g.moveTo(w / 2, k * 64 + 14); g.lineTo(w, k * 64 + 54); g.stroke(); }
  });
  // ---- rock-faced limestone blocks 0.6 x 0.3 m (tile 2.4 m)
  const stoneTex = tex(256, 256, 'stone', (g, w, h) => {
    const r = lcg(107); g.fillStyle = '#cfc3a4'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, r, 900, ['#b9ad8c', '#ddd2b6', '#c4b794', '#a99c7c'], 1.5, 5);
    g.strokeStyle = 'rgba(96,86,66,0.7)'; g.lineWidth = 2.5;
    for (let y = 0; y <= h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); const off = (y / 32) % 2 ? 0 : 64; for (let x = off; x <= w; x += 128) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); } }
  });
  // ---- dark grey-brown granite: tile = 1 m drum height (banded column shafts: u around, v up)
  const columnTex = tex(128, 128, 'column', (g, w, h) => {
    const r = lcg(109); g.fillStyle = '#6f6a66'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, r, 700, ['#5a5552', '#837d78', '#4c4846', '#948d86'], 1, 3.2);
    g.strokeStyle = 'rgba(190,180,160,0.75)'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 2); g.lineTo(w, 2); g.stroke();
    g.strokeStyle = 'rgba(46,42,40,0.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 6); g.lineTo(w, 6); g.stroke();
    g.strokeStyle = 'rgba(60,56,52,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(w * 0.5, 6); g.lineTo(w * 0.5, h); g.stroke();
  });
  // ---- standing-seam sheet roof (tile 2.4 m, seams every 0.6 m)
  const zincTex = (key, base, seam, seed) => tex(256, 256, key, (g, w, h) => {
    const r = lcg(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
    speckle(g, w, h, r, 500, ['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.07)'], 2, 9);
    g.fillStyle = seam; for (let x = 0; x < w; x += 64) { g.fillRect(x, 0, 3, h); g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(x + 3, 0, 2, h); g.fillStyle = seam; }
  });
  const graniteQuayTex = tex(256, 256, 'quay', (g, w, h) => {                                  // ashlar courses 0.5 m, tile 2.5 m
    const r = lcg(113); g.fillStyle = '#b9a79a'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, r, 1400, ['#8f8078', '#d7c8bb', '#a79388', '#c9b8aa', '#7c6e68'], 1.2, 3.4);
    g.strokeStyle = 'rgba(72,60,56,0.7)'; g.lineWidth = 2.5;
    for (let y = 0; y <= h; y += 51) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); const off = (Math.round(y / 51) % 2) ? 0 : 90; for (let x = off; x <= w; x += 180) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 51); g.stroke(); } }
  });
  const settTex = tex(256, 256, 'sett', (g, w, h) => {                                         // granite setts 0.1 m, tile 2 m (20 x 20 blocks)
    const r = lcg(127); g.fillStyle = '#8a8784'; g.fillRect(0, 0, w, h);
    const n = 16, s = w / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const off = (j % 2) * s / 2; g.fillStyle = ['#a29f9c', '#aaa7a3', '#9a9794', '#b2aeaa', '#96938f'][(r() * 5) | 0]; g.fillRect(i * s + off + 0.8, j * s + 0.8, s - 1.6, s - 1.6); }
  });
  const settWarmTex = tex(256, 256, 'settw', (g, w, h) => {
    const r = lcg(131); g.fillStyle = '#7e7a72'; g.fillRect(0, 0, w, h);
    const n = 16, s = w / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const off = (j % 2) * s / 2; g.fillStyle = ['#aaa69c', '#b4afa4', '#a29e94', '#bcb7ac'][(r() * 4) | 0]; g.fillRect(i * s + off + 0.8, j * s + 0.8, s - 1.6, s - 1.6); }
  });
  const kerbTex = tex(128, 128, 'kerb', (g, w, h) => { const r = lcg(137); g.fillStyle = '#c8c4bc'; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 300, ['#b4afa6', '#dad6ce', '#a8a39a'], 1, 2.4); });
  const gravelTex = tex(256, 256, 'gravel', (g, w, h) => { const r = lcg(139); g.fillStyle = '#c9c0ae'; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 2200, ['#b8ae9a', '#d8cfbd', '#a89e8a', '#cfc6b2'], 1, 3); });
  const concreteTex = tex(256, 256, 'plates', (g, w, h) => { const r = lcg(149); g.fillStyle = '#b5b3ae'; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 400, ['#a5a39e', '#c2c0bb'], 1, 3); g.strokeStyle = 'rgba(90,88,84,0.6)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); });
  const lawnTex = tex(256, 256, 'lawn', (g, w, h) => {
    const r = lcg(151); g.fillStyle = '#5fa23a'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, r, 1800, ['#76b648', '#4e902f', '#6aae40', '#82be52'], 1.5, 4);
    g.fillStyle = 'rgba(255,255,255,0.045)'; for (let i = 0; i < 8; i += 2) g.fillRect(0, i * 32, w, 32);   // mow stripes (tile 12 m)
  });
  const bedTex = tex(256, 256, 'bed', (g, w, h) => {                                           // herb-garden bed: tall grass + flowers
    const r = lcg(157); g.fillStyle = '#6a8a3c'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, r, 1600, ['#7c9c48', '#5a7a30', '#8aa856', '#a8b46a', '#4e6e2c'], 1.5, 5);
    for (let i = 0; i < 90; i++) { g.fillStyle = ['#8a4ea8', '#b070c8', '#e8e0d0', '#d86a98'][(r() * 4) | 0]; g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * 3, 0, 6.3); g.fill(); }
  });
  const woodDeckTex = tex(256, 256, 'deck', (g, w, h) => {                                      // timber deck boards 0.14 m, tile 1.4 m
    const r = lcg(163); g.fillStyle = '#8a7058'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 10; i++) { g.fillStyle = ['#8f765c', '#836a52', '#97805f', '#7e664e'][(r() * 4) | 0]; g.fillRect(0, i * 25.6 + 1.2, w, 23); }
  });
  const silverWoodTex = tex(256, 256, 'silver', (g, w, h) => {                                  // vertical grey cladding battens, tile 1.6 m
    const r = lcg(167); g.fillStyle = '#9a9486'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) { g.fillStyle = ['#a29c8e', '#948e80', '#aaa496', '#8e8878'][(r() * 4) | 0]; g.fillRect(i * 16 + 1, 0, 14, h); }
  });
  const timberTex = tex(256, 256, 'timber', (g, w, h) => { const r = lcg(173); g.fillStyle = '#c8a878'; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 500, ['#b89868', '#d8b888', '#a88858'], 2, 8); g.strokeStyle = 'rgba(90,64,40,0.5)'; g.lineWidth = 1.5; for (let y = 0; y < h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } });
  const sandTex = tex(256, 256, 'sand', (g, w, h) => { const r = lcg(179); g.fillStyle = '#d8c490'; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 1600, ['#cdb882', '#e4d2a0', '#c2ad76'], 1, 3); });
  const waterTex = tex(128, 128, 'water', (g, w, h) => { const r = lcg(181); g.fillStyle = '#2e5a72'; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 300, ['#3a6a84', '#264e64', '#46788f'], 3, 9); });

  const M = {
    brick: T('#ffffff', { map: brickTex, name: 'lmNH-brick', paint: 0.04 }),
    brickChev: T('#ffffff', { map: chevTex, name: 'lmNH-brickChev', paint: 0.04 }),
    brickArch: T('#a24c36', { name: 'lmNH-brickArch', paint: 0.05 }),
    brickArchLight: T('#b86048', { name: 'lmNH-brickArchL', paint: 0.05 }),
    brickDark: T('#7c3a2c', { name: 'lmNH-brickDark', paint: 0.04 }),
    stone: T('#ffffff', { map: stoneTex, name: 'lmNH-stone', paint: 0.03 }),
    limestone: T('#cfc3a4', { name: 'lmNH-limestone', paint: 0.03 }),
    ring: T('#c9b98a', { name: 'lmNH-ring', paint: 0.03 }),
    ringShade: T('#b3a374', { name: 'lmNH-ringShade', paint: 0.03 }),
    column: T('#ffffff', { map: columnTex, name: 'lmNH-column', paint: 0.03 }),
    graniteDark: T('#6f6a66', { name: 'lmNH-graniteDark', paint: 0.03 }),
    graniteStone: T('#807a76', { name: 'lmNH-graniteStone', paint: 0.03 }),
    roofZinc: T('#ffffff', { map: zincTex('zinc', '#5a5e64', '#484c52', 191), name: 'lmNH-zinc', paint: 0.03, side: 'double' }),
    roofBottle: T('#ffffff', { map: zincTex('bottleRoof', '#8a4a40', '#6e382f', 193), name: 'lmNH-roofBottle', paint: 0.03, side: 'double' }),
    roofKuznya: T('#ffffff', { map: zincTex('kuznyaRoof', '#7a3a30', '#5e2c24', 197), name: 'lmNH-roofKuznya', paint: 0.03, side: 'double' }),
    roofDark: T('#ffffff', { map: zincTex('darkRoof', '#5c5856', '#46423f', 199), name: 'lmNH-roofDark', paint: 0.03, side: 'double' }),
    roofBrown: T('#ffffff', { map: zincTex('commRoof', '#5a4a44', '#443632', 211), name: 'lmNH-roofComm', paint: 0.03, side: 'double' }),
    roofGreyZ: T('#ffffff', { map: zincTex('greyz', '#8d9298', '#6f747a', 223), name: 'lmNH-roofGreyZ', paint: 0.03, side: 'double' }),
    cream: T('#ecdcb0', { name: 'lmNH-cream', paint: 0.03 }),
    creamShade: T('#d6c694', { name: 'lmNH-creamShade', paint: 0.03 }),
    white: T('#efe8d6', { name: 'lmNH-white', paint: 0.03 }),
    whiteShade: T('#d8d0bc', { name: 'lmNH-whiteShade', paint: 0.03 }),
    iron: T('#26262a', { name: 'lmNH-iron' }),
    ironSoft: T('#3a3a3e', { name: 'lmNH-ironSoft' }),
    frame: T('#2f2f2a', { name: 'lmNH-frame', polygonOffset: -1 }),
    glass: T('#27323f', { name: 'lmNH-glass', emissive: '#0a1018', emissiveIntensity: 0.22 }),
    glassLit: T('#5a6a70', { name: 'lmNH-glassLit' }),
    wallPlaster: T('#e0b078', { name: 'lmNH-plasterGable', paint: 0.05 }),
    quay: T('#ffffff', { map: graniteQuayTex, name: 'lmNH-quay', paint: 0.03 }),
    quayCoping: T('#a8978c', { name: 'lmNH-coping', paint: 0.03 }),
    sett: T('#ffffff', { map: settTex, name: 'lmNH-sett', paint: 0.04, polygonOffset: -2 }),
    settWarm: T('#ffffff', { map: settWarmTex, name: 'lmNH-settWarm', paint: 0.04, polygonOffset: -2 }),
    kerb: T('#ffffff', { map: kerbTex, name: 'lmNH-kerbStrip', paint: 0.03, polygonOffset: -3 }),
    kerbSolid: T('#c8c4bc', { name: 'lmNH-kerb', paint: 0.03 }),
    gravel: T('#ffffff', { map: gravelTex, name: 'lmNH-gravel', paint: 0.05, polygonOffset: -2 }),
    plates: T('#ffffff', { map: concreteTex, name: 'lmNH-plates', paint: 0.04, polygonOffset: -2 }),
    lawn: T('#ffffff', { map: lawnTex, name: 'lmNH-lawn', paint: 0.06, polygonOffset: -1 }),
    bed: T('#ffffff', { map: bedTex, name: 'lmNH-bed', paint: 0.06, polygonOffset: -3 }),
    sand: T('#ffffff', { map: sandTex, name: 'lmNH-sand', paint: 0.05, polygonOffset: -2 }),
    deck: T('#ffffff', { map: woodDeckTex, name: 'lmNH-deck', paint: 0.04 }),
    deckEdge: T('#6e5a46', { name: 'lmNH-deckEdge', paint: 0.03 }),
    silver: T('#ffffff', { map: silverWoodTex, name: 'lmNH-silver', paint: 0.03 }),
    timber: T('#ffffff', { map: timberTex, name: 'lmNH-timber', paint: 0.04 }),
    timberDark: T('#8a6a48', { name: 'lmNH-timberDark', paint: 0.04 }),
    rope: T('#b8a078', { name: 'lmNH-rope' }),
    benchWood: T('#9a7a52', { name: 'lmNH-benchWood', paint: 0.04 }),
    water: T('#ffffff', { map: waterTex, name: 'lmNH-water', paint: 0.02, emissive: '#10303a', emissiveIntensity: 0.25, polygonOffset: -3 }),
    lampGlass: ctx.mat.emissive ? ctx.mat.emissive('#fff3d0', 0.5, { name: 'lmNH-lampGlass' }) : T('#fff3d0', { name: 'lmNH-lampGlass' }),
    green: T('#3f7f4a', { name: 'lmNH-green', paint: 0.03 }),
    awnA: T('#e9e2d0', { name: 'lmNH-awnA', paint: 0.03, side: 'double' }),
    awnB: T('#b9503a', { name: 'lmNH-awnB', paint: 0.03, side: 'double' }),
    table: T('#2c2c30', { name: 'lmNH-table' }),
    pot: T('#8a8478', { name: 'lmNH-pot', paint: 0.03 }),
    boxwood: T('#3e7a3c', { name: 'lmNH-boxwood', paint: 0.1 }),
    zincDome: T('#8d9a98', { name: 'lmNH-zincDome', paint: 0.03 }),
    blank: T('#6a5a4a', { name: 'lmNH-boarded', paint: 0.03 }),
    black: T('#16171a', { name: 'lmNH-black' }),
  };
  M.cutouts = new Set();
  M.decals = new Set();
  return M;
}
