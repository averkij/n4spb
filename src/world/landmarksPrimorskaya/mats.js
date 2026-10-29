// landmarksPrimorskaya/mats.js - the materials of the module (ctx.mat.toon only; every material / texture key starts with 'lmprim-').
//   vc / vc2   ONE vertex-colour material for every plain surface (concrete, granite, steel, paint, cladding), single and double sided; Parts.tint(hex) before the geometry
//   glass      the curtain-wall glass of the vestibule (blue-green, opaque toon; its night twin glassLit glows warm with ctx.shared.uNight)
//   granite    the plain granite of the cheek walls of the stairs (a bay part: unitBox geometry takes a plain material)
//   signName   the fascia ПРИМОРСКАЯ (a lit sign: the texture is its own emissive map and follows ctx.shared.uNight, the pattern of landmarksNorthFull litFascia)
//   signM      the blue М of the metro with a white letter (double sided, lit the same way)
//   signMuseum the signboard of the Museum of the Petersburg Metro
export const PAL = {
  concrete: '#bdbab1', concreteDark: '#8f8d86', granite: '#8d8c87', graniteDark: '#5f6061', granitePale: '#b9b7ae', steel: '#2c3034', steelLight: '#8d9298', cladding: '#c9c4b8', claddingBlock: '#b6b2a7',
  glassDark: '#33454c', green: '#2d8a3d', blue: '#1889bd', brass: '#b9923a', wood: '#8a6b43', shrub: '#3f6b3a',
};

export function makeMats(ctx) {
  const T = ctx.mat.toon, tex = ctx.tex, M = { PAL }, night = [];
  M.vc = T('#ffffff', { vertexColors: true, name: 'lmprim-vc', paint: 0.04 });
  M.vc2 = T('#ffffff', { vertexColors: true, side: 'double', name: 'lmprim-vc2', paint: 0.03 });
  M.glass = T('#6b8f97', { name: 'lmprim-glass', paint: 0.02 });
  M.glassLit = T('#6b8f97', { name: 'lmprim-glass-lit', paint: 0.02, emissive: '#ffe6b0', emissiveIntensity: 0 }); night.push([M.glassLit, 0.55]);
  M.granite = T(PAL.granite, { name: 'lmprim-granite', paint: 0.05 });
  M.road = ctx.mat.decal('#ffffff', { vertexColors: true, name: 'lmprim-decal', polygonOffset: -3, paint: 0.04 });
  const lit = (map, name, side) => { const m = T('#ffffff', { map, name, side, paint: 0.02, emissive: '#ffffff' }); m.emissiveMap = map; m.emissiveIntensity = 0; night.push([m, 0.9]); return m; };
  // ПРИМОРСКАЯ: dark letters on a pale fascia with the green stripe of the Nevsko-Vasileostrovskaya line (the OSM colour of the entrances is green); 8:1
  M.signName = lit(tex.draw(512, 64, (g, w, h) => {
    g.fillStyle = '#eceae2'; g.fillRect(0, 0, w, h); g.fillStyle = PAL.green; g.fillRect(0, h - 9, w, 9);
    g.fillStyle = '#2f3b36'; g.textAlign = 'center'; g.textBaseline = 'middle'; tex.fitText(g, 'ПРИМОРСКАЯ', w / 2, (h - 9) / 2 + 2, w * 0.9, 42, tex.FONTS.sans, 700);
  }, { key: 'lmprim-name' }), 'lmprim-sign-name');
  M.signM = lit(tex.draw(128, 128, (g, w, h) => {
    g.fillStyle = PAL.blue; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${h * 0.86}px "Noto Sans", "Segoe UI", Arial, sans-serif`; g.fillText('М', w / 2, h * 0.53);
  }, { key: 'lmprim-m' }), 'lmprim-sign-m', 'double');
  M.signMuseum = tex.draw(512, 160, (g, w, h) => {
    g.fillStyle = '#23303a'; g.fillRect(0, 0, w, h); g.fillStyle = PAL.blue; g.fillRect(0, 0, w, 14);
    g.fillStyle = '#eef0f0'; g.textAlign = 'center'; g.textBaseline = 'middle';
    tex.fitText(g, 'МУЗЕЙ', w / 2, 64, w * 0.8, 52, tex.FONTS.sans, 700); tex.fitText(g, 'ПЕТЕРБУРГСКОГО МЕТРОПОЛИТЕНА', w / 2, 118, w * 0.92, 30, tex.FONTS.sans, 600);
  }, { key: 'lmprim-museum' });
  M.signMuseumMat = T('#ffffff', { map: M.signMuseum, name: 'lmprim-sign-museum', side: 'double', paint: 0.02 });
  M.night = night;
  if (ctx.onUpdate && ctx.shared && ctx.shared.uNight) ctx.onUpdate(() => { const n = ctx.shared.uNight.value; for (const [m, k] of night) m.emissiveIntensity = n * k; });
  return M;
}
