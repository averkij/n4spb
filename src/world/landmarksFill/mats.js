// landmarksFill/mats.js - the materials of the module (ctx.mat.toon / decal only; every material / texture key starts with 'lmfill-').
//   vc / vc2   ONE vertex-colour material for every plain surface (concrete, steel, paint, plastic sheeting), single and double sided; Parts.tint(hex) before the geometry
//   road       the haul-road decal (vertex colours, pulled toward the camera, no depth write)
//   lattice    alpha-tested steel lattice of the crane masts and jibs (a cut-out texture on double-sided planes)
//   hoard      the corrugated site hoarding sheet (a texture, one tile per 2 m)
//   lampHead   the lamp heads of the masts: a night-driven emissive (ctx.shared.uNight)
export const PAL = {
  concrete: '#a7a59e', concreteDark: '#85837d', slab: '#b4b2ab', steel: '#6a7076', steelDark: '#3b4046', yellow: '#e2b21f', orange: '#d9772b', blue: '#2f5f95', blueDark: '#27486e', green: '#4f8a52',
  white: '#e4e3de', red: '#b13a2f', brick: '#a8644e', panel: '#c9c3b4', glass: '#34464f', rubber: '#26282b', sand: '#c4b48a', gravel: '#8d8a82', spoil: '#7a6a50', pipe: '#2e5aa0',
};

export function makeMats(ctx) {
  const T = ctx.mat.toon, tex = ctx.tex, M = { PAL };
  M.vc = T('#ffffff', { vertexColors: true, name: 'lmfill-vc', paint: 0.04 });
  M.vc2 = T('#ffffff', { vertexColors: true, side: 'double', name: 'lmfill-vc2', paint: 0.03 });
  M.road = ctx.mat.decal('#ffffff', { vertexColors: true, name: 'lmfill-road', polygonOffset: -3, paint: 0.05 });
  // steel lattice: diagonals + two chords on a transparent ground (alphaTest), 1 tile = 1 m of mast height
  const latTex = tex.draw(64, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#d9d8d2'; g.lineWidth = 5; g.lineCap = 'butt';
    g.beginPath(); g.moveTo(4, 2); g.lineTo(4, h - 2); g.moveTo(w - 4, 2); g.lineTo(w - 4, h - 2); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(4, h - 3); g.lineTo(w - 4, 3); g.moveTo(w - 4, h - 3); g.lineTo(4, 3); g.moveTo(4, 2); g.lineTo(w - 4, 2); g.stroke();
  }, { key: 'lmfill-lattice', repeat: [1, 1] });
  M.lattice = T('#e0a31c', { map: latTex, alphaTest: 0.5, side: 'double', name: 'lmfill-lattice', paint: 0.03 });
  // corrugated hoarding sheet: vertical flutes in two tones, a lighter top edge, faint rust at the foot
  const hoardTex = tex.draw(128, 128, (g, w, h) => {
    const r = ctx.rng(7711);
    for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#587c9c' : '#6a8dad'; g.fillRect(i * 8, 0, 8, h); }
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, 0, w, 5);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(95,60,40,${0.05 + r() * 0.08})`; g.fillRect(r() * w, h - 14 + r() * 14, 2 + r() * 8, 3 + r() * 9); }
  }, { key: 'lmfill-hoard', repeat: [1, 1] });
  M.hoard = T('#ffffff', { map: hoardTex, side: 'double', name: 'lmfill-hoard', paint: 0.03 });
  M.hoardCap = T('#4a4f55', { name: 'lmfill-hoard-cap', paint: 0.03 });
  M.glass = T(PAL.glass, { name: 'lmfill-glass', paint: 0.02 });
  // the lamp heads glow at night (the sign / lamp pattern of landmarksNorthFull: an emissive material that follows ctx.shared.uNight)
  M.lampHead = T('#f3f0e6', { name: 'lmfill-lamp-head', paint: 0.02, emissive: '#ffe9b0', emissiveIntensity: 0 });
  if (ctx.onUpdate && ctx.shared && ctx.shared.uNight) ctx.onUpdate(() => { M.lampHead.emissiveIntensity = ctx.shared.uNight.value * 1.4; });
  return M;
}
