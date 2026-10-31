// landmarksYelaginPark/mats.js - the materials of the module (ctx.mat.toon only; every name starts with 'ypark-').  About 20 materials for the whole module, shared by all sights.
// Colours (dossier docs/research/yelagin-park-2026.md and the photos of its PHOTO TABLE):
//   Hercules plinth: pink-red speckled granite #a86f62 [hercules 1-7]; marble group #e4ddcf (figure kit marble); Kirov stele #b07a6e, bust bronze #34413a (figure kit bronze);
//   theatre: glulam #b5753a / underside #d9a968 / membrane #bfc4c6, steel poles #8a8f93, chairs white #f2f2ee [park 28]; vent pavilion: limestone #cdb98c, black louvres #26292b [misc 10];
//   piers: weathered timber, dark steel; bear: dark brown carved wood [oldman1].
// M.decals = flat sheets lying 2-6 cm in front of a surface (polygonOffset, no outline), M.cutouts = alpha cut-outs (none yet).
const RNG = (seed) => { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; };

export function makeMats(ctx) {
  const T = ctx.mat.toon, W = '#ffffff', M = { decals: new Set(), cutouts: new Set() };
  const flat = (name, col, o = {}) => T(col, { name: 'ypark-' + name, paint: 0.03, ...o });
  const tex = (key, w, h, fn, repeat = [1, 1]) => ctx.tex.draw(w, h, fn, { key: 'ypark-' + key, repeat });

  // ---- speckled pink-red granite (1 tile = 1 m): fine dark and light flecks on a salmon ground
  const gTex = tex('granite-pink', 256, 256, (g, w, h) => {
    const r = RNG(7); g.fillStyle = '#c99886'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1500; i++) { g.globalAlpha = 0.45; g.fillStyle = r() < 0.4 ? '#7a5650' : r() < 0.5 ? '#eed0c0' : '#a8776a'; g.fillRect(r() * w, r() * h, 1.5 + r() * 2.5, 1.5 + r() * 2.5); }
    g.globalAlpha = 1;
  });
  M.granitePink = T('#ffffff', { map: gTex, name: 'ypark-granitePink', paint: 0.04 });
    // ---- limestone ashlar (1 tile = 1 m wide x 1 m tall: two courses 0.5 m, joints staggered)
  const lTex = tex('limestone', 256, 256, (g, w, h) => {
    const r = RNG(11); g.fillStyle = '#d6c391'; g.fillRect(0, 0, w, h);
    for (let c = 0; c < 2; c++) {
      for (let b = 0; b < 2; b++) { g.globalAlpha = 0.35; g.fillStyle = r() < 0.5 ? '#c8b27c' : '#e2d3a6'; g.fillRect((b * 128 + c * 64) % w, c * 128, 128, 126); }
    }
    g.globalAlpha = 1; g.fillStyle = 'rgba(96,82,52,0.7)';
    for (let c = 0; c < 2; c++) { g.fillRect(0, c * 128, w, 3); for (let b = 0; b < 2; b++) g.fillRect(((b * 128 + c * 64) % w), c * 128, 3, 128); }
    for (let i = 0; i < 160; i++) { g.globalAlpha = 0.18; g.fillStyle = '#8a7648'; g.fillRect(r() * w, r() * h, 2 + r() * 4, 1.5); }
    g.globalAlpha = 1;
  });
  M.limestone = T('#e8dcb6', { map: lTex, name: 'ypark-limestone', paint: 0.04 });
  M.limestoneCap = flat('limestoneCap', '#cbb98a', { paint: 0.04 });
  // ---- glulam timber: warm orange-brown with long grain streaks (u runs along the beam)
  const tTex = tex('glulam', 256, 128, (g, w, h) => {
    const r = RNG(21); g.fillStyle = '#d9a566'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { g.globalAlpha = 0.2; g.fillStyle = r() < 0.5 ? '#b57d3e' : '#ecc189'; g.fillRect(0, r() * h, w, 1 + r() * 4); }
    g.globalAlpha = 0.3; g.fillStyle = '#7a4a1c'; for (let i = 1; i < 4; i++) g.fillRect(0, i * h / 4, w, 1.5);          // the lamella joints
    g.globalAlpha = 1;
  });
  M.glulam = T('#ffffff', { map: tTex, name: 'ypark-glulam', paint: 0.04 });
  // ---- white marble of the statue (the figure kit's patina uv: u = horizontal position, v = normal.y: the top rows read the grime of up-facing surfaces)
  const mTex = tex('marble-white', 256, 256, (g, w, h) => {
    const r = RNG(51); g.fillStyle = '#efece3'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 200; i++) { g.globalAlpha = 0.2; g.fillStyle = r() < 0.5 ? '#dcd8cc' : '#faf8f2'; g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * 9, 0, 6.3); g.fill(); }
    g.globalAlpha = 1; g.fillStyle = 'rgba(128,132,112,0.30)'; g.fillRect(0, 0, w, h * 0.14);
    for (let x = 0; x < w; x += 3) { const s = r(); if (s < 0.55) continue; const gr = g.createLinearGradient(0, 0, 0, h * (0.2 + s * 0.35)); gr.addColorStop(0, 'rgba(120,128,104,0.34)'); gr.addColorStop(1, 'rgba(120,128,104,0)'); g.fillStyle = gr; g.fillRect(x, 0, 3, h * (0.2 + s * 0.35)); }
    g.fillStyle = 'rgba(160,150,128,0.3)'; g.fillRect(0, h * 0.82, w, h * 0.18);
  });
  M.marble = T('#ffffff', { map: mTex, name: 'ypark-marble', paint: 0.03 });
  // ---- the stage shell wall: vertical larch battens with dark joints (1 tile = 1 m)
  const wTex = tex('stage-battens', 128, 128, (g, w, h) => { const r = RNG(61); for (let i = 0; i < 8; i++) { const k = 0.9 + r() * 0.18; g.fillStyle = `rgb(${Math.round(176 * k)},${Math.round(128 * k)},${Math.round(80 * k)})`; g.fillRect(i * 16, 0, 15, h); g.fillStyle = 'rgba(60,40,20,0.6)'; g.fillRect(i * 16 + 15, 0, 1, h); } });
  M.battens = T('#ffffff', { map: wTex, name: 'ypark-battens', paint: 0.04 });
  M.membrane = flat('membrane', '#b3b7b6', { paint: 0.04 });            // roof covering seen from above
  M.steel = flat('steel', '#868d91', { paint: 0.02 });                  // galvanised poles and brackets
  M.steelDark = flat('steelDark', '#3b4146', { paint: 0.02 });
  M.earth = flat('earth', '#a58b66', { paint: 0.06 });                  // the sand-earth mounds under the arch feet [park 28]
  M.rubber = flat('rubber', '#5d5f64', { paint: 0.03, polygonOffset: -1 });         // the dark rubber floor of the arena
  M.rubberGreen = flat('rubberGreen', '#4f8c46', { paint: 0.03 });                  // the green rubber terraces and edge strips
  M.rubberGreenFloor = flat('rubberGreenFloor', '#4f8c46', { paint: 0.03, polygonOffset: -2 });
  M.benchWood = T('#b0763f', { map: tTex, name: 'ypark-benchWood', paint: 0.04 });
  M.white = flat('white', '#eceae2', { paint: 0.02 });                                // painted garden benches / chairs
  M.deck = (() => {                                                                    // weathered pier planks (1 tile = 1 m, planks 12 cm along u)
    const d = tex('deck', 256, 256, (g, w, h) => {
      const r = RNG(31), rows = 8, rh = h / rows;
      for (let j = 0; j < rows; j++) { const k = 0.86 + r() * 0.2; g.fillStyle = `rgb(${Math.round(150 * k)},${Math.round(128 * k)},${Math.round(96 * k)})`; g.fillRect(0, j * rh, w, rh - 1.5); g.fillStyle = 'rgba(40,32,22,0.55)'; g.fillRect(0, j * rh + rh - 2, w, 2); g.fillStyle = 'rgba(60,46,30,0.5)'; g.fillRect((j * 83 + 40) % w, j * rh, 2, rh - 1.5); }
    });
    return T('#e2d7c2', { map: d, name: 'ypark-deck', paint: 0.05 });
  })();
  M.louvre = flat('louvre', '#25292c', { paint: 0.02 });
  M.louvreEdge = flat('louvreEdge', '#3a4044', { paint: 0.02 });
  M.dark = flat('dark', '#14181a', { paint: 0.01 });                                  // interior seen between the louvres, cap undersides
  M.bearWood = (() => {
    const b = tex('bear', 128, 128, (g, w, h) => { const r = RNG(41); g.fillStyle = '#76594a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.globalAlpha = 0.3; g.fillStyle = r() < 0.5 ? '#4f3a2e' : '#8d7060'; g.fillRect(r() * w, 0, 1 + r() * 3, h); } g.globalAlpha = 1; });
    return T('#cdb09c', { map: b, name: 'ypark-bearWood', paint: 0.04 });
  })();
  // ---- plants: hosta leaves (two greens), salvia (red spikes on green), bed soil
  M.hostaA = flat('hostaA', '#4d9140', { paint: 0.05, side: 'double' });
  M.hostaB = flat('hostaB', '#79b24f', { paint: 0.05, side: 'double' });
  M.salvia = flat('salvia', '#d62a1c', { paint: 0.05, emissive: '#3a0a06', emissiveIntensity: 0.2 });
  M.soil = flat('soil', '#5b4632', { paint: 0.05 });
  // ---- the salvia bed surface: dense red flower spikes on green leaves, painted (1 tile = 0.5 m round the dome)
  const sTex = tex('salvia', 256, 256, (g, w, h) => {
    const r = RNG(71); g.fillStyle = '#3c6b30'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const x = r() * w, y = r() * h, k = 3 + r() * 5; g.globalAlpha = 0.9; g.fillStyle = r() < 0.7 ? '#d72b1c' : r() < 0.5 ? '#b81d14' : '#ec4a2e'; g.beginPath(); g.moveTo(x, y - k * 1.8); g.lineTo(x - k * 0.55, y + k * 0.8); g.lineTo(x + k * 0.55, y + k * 0.8); g.closePath(); g.fill(); }
    g.globalAlpha = 1;
  }, [3, 2]);
  M.salviaTex = T('#ffffff', { map: sTex, name: 'ypark-salviaTex', paint: 0.03 });
  // ---- the Kirov plaque (decal, dark patinated metal with pale letters)
  const plaque = tex('plaque-kirov', 256, 128, (g, w, h) => {
    g.fillStyle = '#3d4541'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7e867f'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#cfcdbd'; g.textAlign = 'center'; g.textBaseline = 'middle';
    ctx.tex.fitText(g, 'С. М. КИРОВ', w / 2, h * 0.38, w - 40, 38, ctx.tex.FONTS.serif, 700);
    ctx.tex.fitText(g, '1886 · 1934', w / 2, h * 0.74, w - 60, 26, ctx.tex.FONTS.serif, 500);
  }, [1, 1]);
  M.plaqueKirov = T(W, { map: plaque, name: 'ypark-plaqueKirov', paint: 0, polygonOffset: -2 }); M.decals.add(M.plaqueKirov);
  // ---- aliases: the module keeps its material count under 20 by sharing (same colour family / texture)
  M.graniteDark = M.granitePink; M.limestoneCap = M.limestone; M.membrane = M.steel; M.concrete = M.steel; M.panel = M.white; M.steelDark = M.dark; M.rubberGreenFloor = M.rubberGreen;
  M.benchWood = M.glulam; M.louvreEdge = M.louvre; M.salviaLeaf = M.hostaA; M.salviaDark = M.salviaTex; M.bloomPink = M.salvia;
  // ---- the figure kit materials (marble, bronze) come from figureMats(ctx) in the parts that use them
  return M;
}
