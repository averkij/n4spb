// landmarksMariinsky/mats.js - palette and materials of the Mariinsky Theatre, the Conservatory, Teatralnaya Square and its monuments.
// Colours are sampled from the Commons photos with PIL (docs/research/mariinsky.md 3.4, 4): theatre wall mint #a4c4a8 (sunlit #a5beab..#b0cfb3, shade #7d9885), rustication #8fb095, trim / columns / balusters
// cream white #ece8dc, roof sheet iron #a9aeb3, canopy #6b7a72, doors #5a3a1e; Conservatory (restored 2025) cream #e2d9b8 with ivory trim #f2eddc; monument granite: Glinka dark red-brown #7a4a44,
// Rimsky-Korsakov pink-red #b98d86; bronze #4c5a49 with verdigris.
export const C = {
  wall: '#a8c8ac', wallRust: '#93b69a', wallDark: '#86a98d', trim: '#ece8dc', trimShade: '#d6d0c2', trimWarm: '#e4dccb',
  roof: '#a9aeb3', roofDark: '#8b9096', canopy: '#6b7a72', canopyEdge: '#566359', door: '#5a3a1e', doorDark: '#3a2616', iron: '#2b2f33', glass: '#3f4a5a',
  groupStone: '#c9c9c4', pipe: '#9fb7a6', granite: '#8d8f8a', graniteLight: '#bdb7a6', graniteDark: '#6a6c68',
  cons: '#e2d9b8', consRust: '#d9ceab', consTrim: '#f2eddc', consTrimShade: '#d9d0b6', consRoof: '#a9aeb3',
  glinkaGranite: '#7a4a44', glinkaGraniteLight: '#8f5b52', rkGranite: '#b98d86', rkGraniteLight: '#c9a29a', bronze: '#4c5a49', bronzeLight: '#6d8a76', verdigris: '#6f9b86', gilt: '#e8c52e',
  m2Stone: '#d6c8a6', m2Glass: '#7f9a95', m2Steel: '#5a6068', yellowArcade: '#e6c98c',
  gravel: '#c4977c', lawn: '#72ad45', soil: '#4a362c', fenceGreen: '#2f6b4a', bench: '#8b6a45', benchIron: '#2b2f33', lampSilver: '#e9ebec', lampGlobe: '#f6f1df', paving: '#aaa59b', pavingDark: '#8f8a80',
};

export function makeMats(ctx, K) {
  const T = ctx.mat.toon, tex = ctx.tex;
  const t = (hex, o = {}) => T(hex, { paint: 0.03, ...o });
  const M = {};
  Object.assign(M, {
    wall: t(C.wall, { name: 'lmM-wall', paint: 0.035 }), wallRust: T(C.wallRust, { map: K.texRust, name: 'lmM-wallRust', paint: 0.03 }), wallDark: t(C.wallDark, { name: 'lmM-wallDark' }),
    trim: t(C.trim, { name: 'lmM-trim' }), trimShade: t(C.trimShade, { name: 'lmM-trimS' }), trimWarm: t(C.trimWarm, { name: 'lmM-trimW' }),
    roof: T(C.roof, { map: tex.draw(64, 64, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, 0, 3, h); g.fillStyle = 'rgba(255,255,255,0.20)'; g.fillRect(3, 0, 3, h); g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(w / 2, 0, w / 2, h); }, { key: 'piter-roof-metal', repeat: [1, 1] }), name: 'lmM-roof', paint: 0.05, side: 'double' }), roofDark: t(C.roofDark, { name: 'lmM-roofD', side: 'double' }),
    canopy: t(C.canopy, { name: 'lmM-canopy', side: 'double' }), canopyEdge: t(C.canopyEdge, { name: 'lmM-canopyE' }),
    door: t(C.door, { name: 'lmM-door' }), doorDark: t(C.doorDark, { name: 'lmM-doorD' }), iron: t(C.iron, { name: 'lmM-iron', paint: 0 }),
    glassDark: t(C.glass, { name: 'lmM-glassD' }), groupStone: t(C.groupStone, { name: 'lmM-group', paint: 0.04 }), pipe: t(C.pipe, { name: 'lmM-pipe', paint: 0 }),
    granite: t(C.granite, { name: 'lmM-granite' }), graniteLight: t(C.graniteLight, { name: 'lmM-graniteL' }), graniteDark: t(C.graniteDark, { name: 'lmM-graniteD' }),
    cons: t(C.cons, { name: 'lmM-cons', paint: 0.035 }), consRust: T(C.consRust, { map: K.texRust, name: 'lmM-consRust', paint: 0.03 }), consTrim: t(C.consTrim, { name: 'lmM-consTrim' }), consTrimShade: t(C.consTrimShade, { name: 'lmM-consTrimS' }),
    glinkaGranite: t(C.glinkaGranite, { name: 'lmM-glinkaG', paint: 0.02 }), glinkaGraniteLight: t(C.glinkaGraniteLight, { name: 'lmM-glinkaGL', paint: 0.02 }),
    rkGranite: t(C.rkGranite, { name: 'lmM-rkG', paint: 0.02 }), rkGraniteLight: t(C.rkGraniteLight, { name: 'lmM-rkGL', paint: 0.02 }),
    bronze: t(C.bronze, { name: 'lmM-bronze', paint: 0.02 }), gilt: t(C.gilt, { name: 'lmM-gilt', emissive: '#6a5208', emissiveIntensity: 0.4, paint: 0 }),
    m2Stone: t(C.m2Stone, { name: 'lmM-m2Stone', paint: 0.03 }), m2Glass: ctx.mat.glass ? ctx.mat.glass({ tint: C.m2Glass, opacity: 0.55 }) : t(C.m2Glass), m2Steel: t(C.m2Steel, { name: 'lmM-m2Steel', paint: 0 }), yellowArcade: t(C.yellowArcade, { name: 'lmM-yArc' }),
    gravel: T(C.gravel, { name: 'lmM-gravel', paint: 0.06, polygonOffset: -3 }), lawn: T(C.lawn, { name: 'lmM-lawn', paint: 0.07, polygonOffset: -3 }), soil: T(C.soil, { name: 'lmM-soil', polygonOffset: -4 }),
    paving: T(C.paving, { name: 'lmM-paving', paint: 0.05, polygonOffset: -3 }), pavingDark: T(C.pavingDark, { name: 'lmM-pavingD', paint: 0.05, polygonOffset: -4 }),
    fenceGreen: t(C.fenceGreen, { name: 'lmM-fenceG', paint: 0 }), bench: t(C.bench, { name: 'lmM-bench' }), benchIron: t(C.benchIron, { name: 'lmM-benchI', paint: 0 }),
    lampSilver: t(C.lampSilver, { name: 'lmM-lampS', paint: 0.01 }), lampGlobe: ctx.mat.emissive(C.lampGlobe, 0.55),
    black: t('#101214', { name: 'lmM-black', paint: 0 }), dark: t('#1c1a1a', { name: 'lmM-dark', paint: 0 }),
  });
  // gilt incised letters on the plinths: flat textured planes (alpha cut-out) placed 2 cm off the granite
  const letters = (lines, key, fg, o = {}) => {
    const w = o.w || 512, h = o.h || 64 * lines.length;
    const map = tex.draw(w, h, (g) => {
      g.clearRect(0, 0, w, h); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
      lines.forEach((s, i) => tex.fitText(g, s, w / 2, h * (i + 0.5) / lines.length, w * (o.fill ?? 0.9), h / lines.length * (o.size ?? 0.8), o.font || tex.FONTS.serif, o.weight || 600));
    }, { key, repeat: [1, 1] });
    const m = T('#ffffff', { map, alphaTest: 0.45, side: 'double', name: key, paint: 0 }); K.decalMats.add(m); return m;
  };
  M.lettersGlinka = letters(['МИХАИЛЪ', 'ИВАНОВИЧЪ', 'ГЛИНКА'], 'lmM-let-glinka', C.gilt, { w: 512, h: 384, size: 0.74 });
  M.lettersGlinkaYears = letters(['1804—1857'], 'lmM-let-glinkaY', C.gilt, { w: 512, h: 96, size: 0.7 });
  M.lettersGlinkaSide = letters(['ЖИЗНЬ', 'ЗА', 'ЦАРЯ'], 'lmM-let-glinkaS', C.gilt, { w: 256, h: 288, size: 0.72 });
  M.lettersRK = letters(['Николаю Андреевичу', 'Римскому-Корсакову', '1844—1908'], 'lmM-let-rk', '#e8c52e', { w: 1024, h: 288, size: 0.7, font: tex.FONTS.serif });
  return M;
}
