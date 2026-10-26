// Provenance: copied verbatim from 102_3d_piter commit 0568f7af (src/world/bridges/mats-vo.js) for Admiralty-Haymarket (docs/AREAS.md 15.2); this line is the only change.
// bridges/mats-vo.js - the extra materials of the Vasilievsky Island bridges (docs/research/vo-bridges-wave1.md), added to the set of mats.js:
//   Blagoveshchensky Bridge: pale sage-grey steel (the girders read #b9c1b6 lit in photos b01 / b03 / b12), a darker soffit, the alpha-cut X lattice of the girder webs (cell 1.2 m), the sage cast
//   railing, the standards, the pavilion body / roof, granite 'tumba' rings;  Uralsky: pale pink granite obelisks, gilded ships;  Smolensky: black cast torcheres.
// All colours are LIT albedos (docs/LOOK.md).
export function addVoMats(ctx, M) {
  const T = ctx.mat.toon, tex = ctx.tex;
  M.fasBlag = T('#aeb8ab', { paint: 0.05, name: 'brg-fas-blag' });                 // girder fascia / rib (sage grey-green steel)
  M.fasBlagDark = T('#7b857a', { paint: 0.05, name: 'brg-fas-blag-d' });            // soffit, inner webs behind the lattice
  M.ribBlag = T('#bcc4b8', { paint: 0.05, name: 'brg-rib-blag' });                  // the rolled lower chord / bulb flange (a little lighter)
  M.railBlagPost = T('#98a396', { paint: 0.04, name: 'brg-rail-blag-post' });       // cast pillars between the railing panels
  M.blagLamp = T('#8d988b', { paint: 0.04, name: 'brg-blag-lamp' });                // standards
  M.blagCage = T('#2a2f2c', { paint: 0.03, name: 'brg-blag-cage' });                // lantern cages
  M.pavBlag = T('#c3c7bd', { paint: 0.04, name: 'brg-pav-blag' });                  // control pavilion body
  M.pavBlagRoof = T('#7f8b86', { paint: 0.04, name: 'brg-pav-blag-roof' });
  M.pierConcrete = T('#9ea39b', { paint: 0.06, name: 'brg-pier-concrete' });        // the painted concrete of the bascule pier above the granite plinth
  // the X lattice: two crossing flat bars per 1.2 x 1.2 m cell (four triangular openings), white on clear (tinted by the material colour), alpha cut
  const latTex = tex.draw(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff'; g.lineCap = 'butt';
    g.lineWidth = 30;
    for (const [x0, y0, x1, y1] of [[-20, -20, w + 20, h + 20], [w + 20, -20, -20, h + 20]]) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
    g.lineWidth = 12; g.strokeStyle = '#d8d8d8';                                      // a lighter edge line along each bar: reads as a rolled section
    for (const [x0, y0, x1, y1] of [[-20, -20, w + 20, h + 20], [w + 20, -20, -20, h + 20]]) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  }, { key: 'brg-blag-lattice', repeat: [1, 1], anisotropy: 4 });
  M.latticeBlag = T('#aeb8ab', { map: latTex, alphaTest: 0.5, side: 'double', paint: 0.04, name: 'brg-lattice-blag' });
  // Uralsky: the obelisks / tumbas are pale pink granite (lighter than the pier granite), the ships gilded
  M.graniteUral = T('#cdb4a8', { map: M.texGranite, paint: 0.05, name: 'brg-granite-ural' });
  M.obeliskPale = T('#d3c0b4', { map: M.texGranite, paint: 0.05, name: 'brg-obelisk-pale' });
  M.blagVoid = T('#15181a', { paint: 0.01, name: 'brg-blag-void' });                  // the dark inside of the Kryukov vault
  M.ironBlack = T('#1e2224', { paint: 0.02, name: 'brg-iron-black' });
  M.jointSteel = T('#4a443f', { paint: 0.02, name: 'brg-joint-steel' });             // the comb-toothed steel plate of the bascule joint (photo r03)
  // the generic arch looks: Uralsky = pink granite faces over a concrete soffit; Smolensky = a granite-faced arch
  if (M.looks) { M.looks.ural = { fas: M.granitePink, soffit: M.pierConcrete, band: null }; M.looks.smol = { fas: M.granitePink }; }
  // ---- second pass (docs/research/vo-bridges-wave2.md): Nalichny / Korablestroiteley (pink-grey granite faces, pale RC soffit, galvanised poles), the four mouth bridges (pale blue-grey sheet fascia over a
  // curved concrete soffit, grey granite abutments, photos n01 .. n03 k01 m08 m09), the footbridge (grey steel, forged railing, cream globes)
  M.graniteNal = T('#c5a69a', { map: M.texGranite, paint: 0.05, name: 'brg-granite-nal' });              // the faces and abutments of Nalichny (pink-grey rusticated ashlar, photo n03)
  M.obeliskNal = T('#bf9a8c', { map: M.texGranite, paint: 0.05, name: 'brg-obelisk-nal' });             // the four granite-faced obelisks (salmon pink in the sun, photos n01 n02)
  M.graniteKor = T('#b8a8a0', { map: M.texGranite, paint: 0.05, name: 'brg-granite-kor' });             // Korablestroiteley: a greyer granite
  M.graniteGrey2 = T('#aeaba4', { map: M.texGranite, paint: 0.05, name: 'brg-granite-grey2' });         // the grey granite of the mouth bridges (photos m01 m09)
  M.parapetGrey = T('#b2afa9', { map: M.texParapet, paint: 0.06, name: 'brg-parapet-grey' });          // the plain grey granite parapet blocks of the mouth bridges (photos m01 m02)
  M.soffitRC = T('#8f9390', { paint: 0.06, name: 'brg-soffit-rc' });                                    // painted / weathered RC soffit
  M.tramSlab = T('#8d9092', { paint: 0.07, name: 'brg-tram-slab' });                                    // the flush concrete slab of the tram corridor
  M.fasMouth = T('#a7b7c4', { paint: 0.05, name: 'brg-fas-mouth' });                                    // the sheet-metal fascia (pale blue-grey, rust streaks: photo m09 / m08)
  M.soffitMouth = T('#7e878d', { paint: 0.05, name: 'brg-soffit-mouth' });
  M.poleGalv = T('#a0a5a8', { paint: 0.02, name: 'brg-pole-galv' });                                    // galvanised street poles
  M.footSteel = T('#8f9694', { paint: 0.04, name: 'brg-foot-steel' });                                  // the footbridge girders (mid grey, photos f01 f02)
  M.footSteelDark = T('#656c6c', { paint: 0.04, name: 'brg-foot-steel-d' });
  M.globeCream = T('#f4f0e6', { emissive: '#ffe2a8', emissiveIntensity: 0.0, paint: 0.02, name: 'brg-globe' });
  if (M.lampMats && !M.lampMats.includes(M.globeCream)) M.lampMats.push(M.globeCream);                    // (review) the torchere globes glow at night with every other lantern of the module (mats.js drives lampMats from uNight)
  M.posts = M.ironBlack;
  // the WHSD (docs/research/vo-bridges-wave2.md section 5): pale concrete box girders, barriers, portals
  M.whsdConcrete = T('#d3d4cf', { paint: 0.05, name: 'brg-whsd-concrete' });
  M.whsdSoffit = T('#a7a9a4', { paint: 0.05, name: 'brg-whsd-soffit' });
  M.whsdBarrier = T('#c9cac5', { paint: 0.05, name: 'brg-whsd-barrier' });
  M.whsdRim = T('#e1e2dd', { paint: 0.04, name: 'brg-whsd-rim' });
  // the grass slopes of the open cutting (third pass, cutting.js): a mottled lawn green of the park island, 5 m tile (deterministic blades and patches), uv = (s / 5, q / 5)
  const bankTex = tex.draw(256, 256, (g, w, h) => {
    let sd = 7331; const rnd = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
    g.fillStyle = '#86b659'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(94,146,60,0.30)' : 'rgba(176,206,110,0.26)'; const r = 12 + rnd() * 26, x = rnd() * w, y = rnd() * h; for (const [ox, oy] of [[0, 0], [w, 0], [-w, 0], [0, h], [0, -h]]) { g.beginPath(); g.ellipse(x + ox, y + oy, r, r * (0.55 + rnd() * 0.4), rnd() * 3, 0, Math.PI * 2); g.fill(); } }
    g.lineWidth = 1.5; g.lineCap = 'round';
    for (let i = 0; i < 420; i++) { const x = rnd() * w, y = rnd() * h, l = 3 + rnd() * 5; g.strokeStyle = rnd() < 0.6 ? 'rgba(64,112,42,0.5)' : 'rgba(206,222,128,0.5)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 3, y - l); g.stroke(); }
  }, { key: 'brg-whsd-bank', repeat: [1, 1], anisotropy: 4 });
  M.whsdBank = T('#8bb35c', { map: bankTex, paint: 0.07, name: 'brg-whsd-bank' });
  M.tunnelDark = T('#16181a', { paint: 0.01, name: 'brg-tunnel-dark' });
  if (M.looks) {
    M.looks.nalichny = { fas: M.graniteNal, soffit: M.soffitRC };
    M.looks.korable = { fas: M.graniteKor, soffit: M.soffitRC };
    M.looks.mouth = { fas: M.fasMouth, soffit: M.soffitMouth, band: null };
  }
  return M;
}
