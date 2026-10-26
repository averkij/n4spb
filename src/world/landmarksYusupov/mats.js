// landmarksYusupov/mats.js - materials and canvas textures of the Yusupov Palace group.  Colours (docs/research/yusupov.md 3.3, hex read from photos 14 15 30 54 60): ochre-yellow stucco #e3ad45,
// paler rustication #e6bd68, white trim / columns #f4f1ea, pink-grey granite #8f8885, red-brown sheet-iron roof #a85a45, dark carved wood #5a3418 + green-patina copper canopy #4c7a60, black iron #1e2022.
// Textures are white / light tiles tinted by the material colour; the surface textures use WORLD-space uv.  Alpha cut-outs (ring roundels, coat of arms, palmettes) are registered in M.cutouts.
export const C = {
  wall: '#e3ad45', rustic: '#e6bd68', wallShade: '#c99a3a', trim: '#f4f1ea', trimShade: '#d9d4c6', trimWarm: '#e9e2d0',
  granite: '#8f8885', graniteDark: '#6d6866', graniteWarm: '#9a9088', plinthPink: '#98807a',
  roof: '#a85a45', roofDark: '#8b4a3a', chimney: '#e3ad45', chimneyCap: '#7a4a3a', copper: '#4c7a60',
  wood: '#5a3418', woodDark: '#3f2410', brass: '#c9a24b', gold: '#d8a838', iron: '#1e2022', ironGreen: '#1f2a26',
  gravel: '#9a8f86', court: '#9c7f7b', lawn: '#6aa043', lamp: '#1f2224', bin: '#262a2c', bench: '#6b4a2a',
  glassDark: '#3a4350', pavilion: '#e3b04a', rustPav: '#e8c070',
};

export function makeMats(ctx) {
  const T = ctx.mat.toon, tex = ctx.tex;
  const M = { C };
  M.decals = new Set(); M.cutouts = new Set();
  const t = (hex, name, o = {}) => T(hex, { name: 'lmY-' + name, paint: 0.03, ...o });
  const cut = (map, name) => { const m = T('#ffffff', { map, alphaTest: 0.45, side: 'double', name: 'lmY-' + name, paint: 0.0 }); M.cutouts.add(m); return m; };

  // ---- textures
  const pebbles = tex.draw(256, 256, (g, w, h) => {
    const r = ctx.rng(4811); g.fillStyle = '#e6e2dc'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 800; i++) { const v = 205 + Math.floor(r() * 50); g.fillStyle = `rgb(${v},${v - 4},${v - 8})`; const s = 1 + r() * 3; g.fillRect(r() * w, r() * h, s, s * (0.6 + r() * 0.7)); }
    for (let i = 0; i < 320; i++) { const v = 150 + Math.floor(r() * 50); g.fillStyle = `rgba(${v},${v - 10},${v - 14},0.5)`; const s = 1 + r() * 2.2; g.fillRect(r() * w, r() * h, s, s); }
  }, { key: 'lmY-pebbles', repeat: [1, 1] });
  const grass = tex.draw(256, 256, (g, w, h) => {
    const r = ctx.rng(4812); g.fillStyle = '#f0f4e6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) { const v = 208 + Math.floor(r() * 47); g.fillStyle = `rgba(${v - 24},${v},${v - 40},0.5)`; const s = 3 + r() * 14; g.beginPath(); g.ellipse(r() * w, r() * h, s, s * (0.4 + r() * 0.5), r() * 3.1, 0, 6.3); g.fill(); }
    for (let i = 0; i < 150; i++) { g.fillStyle = r() < 0.75 ? 'rgba(255,255,240,0.5)' : 'rgba(250,236,120,0.45)'; g.fillRect(r() * w, r() * h, 2, 2); }
  }, { key: 'lmY-grass', repeat: [1, 1] });
  // frieze of the Moika front: one tile = 3.3 m x 1.5 m (aspect 2.2): a white ring-wreath roundel centred in the bay, a white panel (fluted block) between the bays; alpha cut-out
  const frieze = tex.draw(528, 240, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const W = '#f4f1ea', S = '#c9c2b0';
    const ring = (cx, cy, r0, r1, col) => { g.fillStyle = col; g.beginPath(); g.arc(cx, cy, r1, 0, 7); g.arc(cx, cy, r0, 0, 7, true); g.fill('evenodd'); };
    ring(w / 2 + 3, h / 2 + 3, 40, 66, S); ring(w / 2, h / 2, 40, 66, W);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; g.fillStyle = W; g.beginPath(); g.arc(w / 2 + Math.cos(a) * 66, h / 2 + Math.sin(a) * 66, 7, 0, 7); g.fill(); }
    // panels at the tile edges (half panel on each side = one 0.5 m panel per bay), with fine vertical flutes
    for (const x0 of [0, w - 40]) { g.fillStyle = W; g.fillRect(x0, 4, 40, h - 8); g.fillStyle = S; for (let k = 5; k < 36; k += 7) g.fillRect(x0 + k, 14, 2, h - 28); }
  }, { key: 'lmY-frieze', repeat: [1, 1] });
  M.frieze = cut(frieze, 'frieze');
  // palmette band of the NE wing: tile 2.0 m x 1.0 m (aspect 2)
  const palm = tex.draw(256, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const W = '#f4f1ea', S = '#cfc8b6';
    const one = (cx, col, o) => {
      g.fillStyle = col;
      for (let k = -4; k <= 4; k++) { const a = -Math.PI / 2 + k * 0.32; g.beginPath(); g.ellipse(cx + o + Math.cos(a) * 18, h / 2 + o + 22 + Math.sin(a) * 22, 6, 17, a + Math.PI / 2, 0, 7); g.fill(); }
      g.beginPath(); g.arc(cx + o, h / 2 + o + 30, 7, 0, 7); g.fill();
    };
    for (const cx of [32, 96, 160, 224]) { one(cx, S, 2); one(cx, W, 0); }
    g.fillStyle = W; g.fillRect(0, h - 14, w, 8); g.fillRect(0, 6, w, 7);
  }, { key: 'lmY-palm', repeat: [1, 1] });
  M.palm = cut(palm, 'palm');
  // coat of arms of the Yusupovs on the attic and over the portal: a crowned shield between two lions rampant, white stucco, 2 : 1 (512 x 256)
  const arms = tex.draw(1024, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.scale(2, 2);
    const W = '#f4f1ea', S = '#b9b09a';
    // heraldic lion rampant (256 x 256 box, faces LEFT, head at about x 70, raised forepaws at x 30..60): body, mane, legs, curled tail
    const lionShape = (col) => {
      g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(88, 120); g.bezierCurveTo(70, 150, 84, 196, 112, 214); g.bezierCurveTo(138, 230, 168, 214, 172, 180);
      g.bezierCurveTo(176, 140, 160, 110, 132, 96); g.bezierCurveTo(116, 90, 100, 96, 88, 120); g.fill();                  // body / haunch
      g.lineWidth = 36; g.beginPath(); g.moveTo(96, 84); g.bezierCurveTo(100, 100, 104, 112, 108, 128); g.stroke();       // neck / chest
      g.beginPath(); g.ellipse(76, 56, 26, 25, 0.1, 0, 7); g.fill();                                                         // head
      g.beginPath(); g.moveTo(56, 52); g.lineTo(34, 58); g.lineTo(36, 70); g.lineTo(60, 74); g.closePath(); g.fill();      // muzzle
      for (let i = 0; i < 11; i++) { const a = -0.4 + i * 0.62; g.beginPath(); g.arc(88 + Math.cos(a + 1.9) * 28, 62 + Math.sin(a + 1.9) * 30, 11, 0, 7); g.fill(); } // mane tufts
      g.beginPath(); g.moveTo(70, 34); g.lineTo(64, 18); g.lineTo(80, 28); g.closePath(); g.fill();                         // ear
      g.lineWidth = 15; g.beginPath(); g.moveTo(92, 108); g.bezierCurveTo(70, 100, 52, 84, 40, 62); g.stroke();            // raised foreleg 1
      g.lineWidth = 14; g.beginPath(); g.moveTo(98, 126); g.bezierCurveTo(74, 130, 56, 118, 44, 100); g.stroke();          // foreleg 2
      g.lineWidth = 19; g.beginPath(); g.moveTo(128, 190); g.bezierCurveTo(112, 212, 104, 226, 80, 240); g.stroke();      // hind legs
      g.beginPath(); g.moveTo(152, 196); g.bezierCurveTo(158, 220, 166, 232, 186, 242); g.stroke();
      g.lineWidth = 10; g.beginPath(); g.moveTo(166, 172); g.bezierCurveTo(206, 176, 222, 140, 206, 106); g.bezierCurveTo(198, 88, 208, 70, 226, 70); g.stroke(); // tail
      g.beginPath(); g.arc(228, 66, 12, 0, 7); g.fill();                                                                     // tail tuft
    };
    const supporters = (col, o) => {
      g.save(); g.translate(o, o); lionShape(col); g.restore();                                                              // right lion: faces left (the shield at the centre)
    };
    for (const [col, o] of [[S, 2.2], [W, 0]]) {
      g.save(); g.translate(264, 0); g.scale(-1, 1); supporters(col, -o); g.restore();                                       // left lion = the mirror image
      g.save(); g.translate(256 - 8, 0); supporters(col, o); g.restore();
      // crowned shield in the middle (centre x = 256)
      g.fillStyle = col; g.beginPath(); g.moveTo(208 + o, 70 + o); g.lineTo(304 + o, 70 + o); g.lineTo(304 + o, 142 + o); g.quadraticCurveTo(304 + o, 196 + o, 256 + o, 214 + o); g.quadraticCurveTo(208 + o, 196 + o, 208 + o, 142 + o); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(214 + o, 62 + o); g.lineTo(214 + o, 32 + o); g.lineTo(234 + o, 48 + o); g.lineTo(256 + o, 20 + o); g.lineTo(278 + o, 48 + o); g.lineTo(298 + o, 32 + o); g.lineTo(298 + o, 62 + o); g.closePath(); g.fill();
    }
    g.fillStyle = S; g.fillRect(224, 92, 64, 7); g.fillRect(224, 118, 64, 7); g.fillRect(252, 92, 7, 96);
  }, { key: 'lmY-arms2', repeat: [1, 1] });
  M.arms = cut(arms, 'arms');
  // brass plate "ЮСУПОВСКИЙ / ДВОРЕЦ" (portrait 0.30 x 0.55 m)
  M.plate = T('#ffffff', { name: 'lmY-plate', paint: 0.0, polygonOffset: -2, map: tex.draw(256, 480, (g, w, h) => {
    g.fillStyle = '#3a342a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#a89a72'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#e4d9b4'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.save(); g.translate(w / 2, h * 0.5); g.rotate(-Math.PI / 2); tex.fitText(g, 'ЮСУПОВСКИЙ  ДВОРЕЦ', 0, 0, h * 0.84, w * 0.5, tex.FONTS.serif, 700); g.restore();
  }, { key: 'lmY-plate', repeat: [1, 1] }) });
  M.decals.add(M.plate);
  // rustication: tile 1.8 m x 1.8 m = two courses of 0.9 m with staggered joints (white tile, tinted by the material colour)
  const rustTex = tex.draw(256, 256, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c9b88e'; g.fillRect(0, 0, w, 7); g.fillRect(0, 128, w, 7);
    g.fillRect(0, 0, 5, 128); g.fillRect(128, 0, 5, 128); g.fillRect(64, 128, 5, 128); g.fillRect(192, 128, 5, 128);
    g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(0, 7, w, 4); g.fillRect(0, 135, w, 4);
  }, { key: 'lmY-rustTex', repeat: [1, 1] });
  M.pebbles = pebbles;

  const surf = (hex, map, name, off = -2) => T(hex, { map, name: 'lmY-' + name, paint: 0.05, polygonOffset: off });
  Object.assign(M, {
    gravel: surf(C.gravel, pebbles, 'gravel', -3), court: surf(C.court, pebbles, 'court', -2), lawn: T(C.lawn, { map: grass, name: 'lmY-lawn', paint: 0.06, polygonOffset: -1 }),
    wall: t(C.wall, 'wall', { paint: 0.04 }), wallShade: t(C.wallShade, 'wallShade'), trim: t(C.trim, 'trim'), trimShade: t(C.trimShade, 'trimShade'), trimWarm: t(C.trimWarm, 'trimWarm'),
    granite: t(C.granite, 'granite', { paint: 0.05 }), graniteDark: t(C.graniteDark, 'graniteDark'), graniteWarm: t(C.graniteWarm, 'graniteWarm', { paint: 0.05 }), plinthPink: t(C.plinthPink, 'plinthPink', { paint: 0.05 }),
    roof: T(C.roof, { name: 'lmY-roof', paint: 0.06, side: 'double' }), roofDark: t(C.roofDark, 'roofDark', { side: 'double' }), copper: t(C.copper, 'copper', { paint: 0.05, side: 'double' }),
    chimney: t(C.chimney, 'chimney'), chimneyCap: t(C.chimneyCap, 'chimneyCap'),
    wood: t(C.wood, 'wood', { paint: 0.04 }), woodDark: t(C.woodDark, 'woodDark'), brass: t(C.brass, 'brass', { emissive: '#3a2a08', emissiveIntensity: 0.4 }), gold: t(C.gold, 'gold', { emissive: '#6a4a08', emissiveIntensity: 0.4, paint: 0 }),
    iron: t(C.iron, 'iron', { paint: 0 }), ironGreen: t(C.ironGreen, 'ironGreen', { paint: 0 }), dark: t('#1c1a1a', 'dark', { paint: 0 }), glassDark: t(C.glassDark, 'glassDark', { paint: 0.02 }),
    lamp: t(C.lamp, 'lamp', { paint: 0 }), lampGlass: ctx.mat.emissive('#fff2c8', 0.5), bin: t(C.bin, 'bin', { paint: 0 }), bench: t(C.bench, 'bench'),
    soil: t('#6a5a48', 'soil', { polygonOffset: -2 }), hoop: t('#2a2c2e', 'hoop', { paint: 0 }), hedge: t('#2c5a32', 'hedge', { paint: 0.1 }),
    pot: t('#c8643c', 'pot', { paint: 0.05 }), flower: t('#f1efe6', 'flower', { paint: 0.12 }), leafy: t('#3f7a34', 'leafy', { paint: 0.1 }),
    pav: t(C.pavilion, 'pav', { paint: 0.04 }), rustY: T('#e8c06a', { map: rustTex, name: 'lmY-rustY', paint: 0.04 }), wallY: t('#e6b955', 'wallY', { paint: 0.04 }), rustPav: T(C.rustPav, { map: rustTex, name: 'lmY-rustPav', paint: 0.04 }),
  });
  return M;
}
