// bridges/mats.js - canvas textures and toon materials of the bridges: pink-grey granite courses (rapakivi #a8988c lit / #8a7e78 shade, 0.55 m courses), the rough parapet blocks with rust
// patches (Kazansky photo refs/canals 01), the wet water-line granite, brick soffit, granite pavement slabs 1.3 x 0.6 m, setts, asphalt, plank decks, painted fascia bands of the iron
// arches (Green #5c9478, Pevchesky #1f3a2c, Blue #2a50b0, Red #d8182c), clearance boards.  All colours are LIT albedos (docs/LOOK.md): a sunlit surface comes out ~1.05 x its hex.
// Railing textures live in rails.js (they use M.railMat).
export function makeMats(ctx) {
  const T = ctx.mat.toon, tex = ctx.tex, M = {};
  const rngOf = (k) => ctx.rng('brg-' + k);

  // ------------------------------------------------------------------ granite: 2.2 m tile, 4 courses of 0.55 m, blocks 1.1 - 1.7 m, light speckle + rust stains
  const graniteDraw = (key, rust) => (g, w, h) => {
    const r = rngOf(key);
    g.fillStyle = '#f0ebe6'; g.fillRect(0, 0, w, h);
    const rows = 4, rh = h / rows;
    for (let j = 0; j < rows; j++) {
      let x = -r() * 150;
      while (x < w) {
        const bw = 150 + r() * 130, k = 0.9 + r() * 0.12;
        g.fillStyle = `rgb(${Math.round(240 * k)},${Math.round(234 * k)},${Math.round(230 * k)})`; g.fillRect(x + 1.5, j * rh + 1.5, bw - 3, rh - 3);
        for (let s = 0; s < 46; s++) { g.fillStyle = r() < 0.5 ? 'rgba(110,80,70,0.15)' : 'rgba(255,248,244,0.24)'; g.fillRect(x + r() * bw, j * rh + r() * rh, 2 + r() * 3, 2 + r() * 2); }
        if (rust && r() < 0.28) { g.fillStyle = 'rgba(150,84,62,0.16)'; g.beginPath(); g.ellipse(x + bw * (0.3 + r() * 0.4), j * rh + rh * (0.3 + r() * 0.4), 14 + r() * 24, 8 + r() * 14, r() * 3, 0, 6.3); g.fill(); }
        x += bw;
      }
    }
    g.fillStyle = 'rgba(60,44,40,0.58)';
    for (let j = 0; j < rows; j++) g.fillRect(0, j * rh - 1.5, w, 3.5);
    const r2 = rngOf(key + '-j');
    for (let j = 0; j < rows; j++) { let x = r2() * 120 + (j % 2) * 90; while (x < w) { g.fillRect(x - 1.5, j * rh, 3.5, rh); x += 150 + r2() * 130; } }
  };
  M.texGranite = tex.draw(512, 512, graniteDraw('granite', true), { key: 'brg-granite', repeat: [1, 1], anisotropy: 8 });
  const gm = (name, hex, o = {}) => T(hex, { map: M.texGranite, paint: 0.05, name: 'brg-' + name, ...o });
  M.granite = gm('granite', '#b0a198');                // the canal-bridge ashlar (grey-pink)
  M.graniteDark = gm('granite-d', '#8a7f78');           // abutments in shade, spandrels of the Kazansky arch
  M.graniteRed = gm('granite-r', '#b99e92');            // pink-red rapakivi (Palace Bridge piers, Winter Canal bridges)
  M.voussoir = gm('voussoir', '#c7b8ae');               // the lighter radial ring
  M.palacePier = gm('palace-pier', '#bba59b');
  M.coping = T('#b9a89e', { paint: 0.05, name: 'brg-coping' });
  M.copingDark = T('#9c8e86', { paint: 0.05, name: 'brg-coping-d' });
  M.pylon = T('#ab9c95', { map: M.texGranite, paint: 0.06, name: 'brg-pylon' });
  M.pylonRough = T('#a89488', { paint: 0.07, name: 'brg-pylon-r' });
  M.wet = T('#4c504d', { map: M.texGranite, paint: 0.04, name: 'brg-wet' });

  // ------------------------------------------------------------------ rough parapet blocks: tile 2.8 m x 1.2 m = two blocks, joints, hammered speckle, rust
  M.texParapet = tex.draw(512, 256, (g, w, h) => {
    const r = rngOf('parapet');
    g.fillStyle = '#efe8e3'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) {
      const x = i * w / 2, k = 0.9 + r() * 0.1;
      g.fillStyle = `rgb(${Math.round(238 * k)},${Math.round(232 * k)},${Math.round(228 * k)})`; g.fillRect(x + 2, 3, w / 2 - 4, h - 6);
      for (let s = 0; s < 120; s++) { g.fillStyle = r() < 0.5 ? 'rgba(90,70,64,0.17)' : 'rgba(255,250,246,0.3)'; g.fillRect(x + r() * w / 2, r() * h, 2 + r() * 4, 2 + r() * 3); }
      for (let s = 0; s < 3; s++) if (r() < 0.6) { g.fillStyle = 'rgba(140,80,58,0.20)'; g.beginPath(); g.ellipse(x + w / 4 + (r() - 0.5) * 160, h * (0.25 + r() * 0.5), 16 + r() * 26, 8 + r() * 12, r() * 3, 0, 6.3); g.fill(); }
    }
    g.fillStyle = 'rgba(52,40,36,0.62)'; g.fillRect(0, 0, 3, h); g.fillRect(w / 2 - 1.5, 0, 3, h); g.fillRect(w - 3, 0, 3, h);
  }, { key: 'brg-parapet', repeat: [1, 1], anisotropy: 8 });
  M.parapet = T('#a09790', { map: M.texParapet, paint: 0.06, name: 'brg-parapet' });
  M.parapetPink = T('#a99b95', { map: M.texParapet, paint: 0.06, name: 'brg-parapet-p' });

  // ------------------------------------------------------------------ vault soffit (dark brick), spandrel brick
  M.texBrick = tex.draw(256, 256, (g, w, h) => {
    const r = rngOf('brick');
    g.fillStyle = '#6a5c56'; g.fillRect(0, 0, w, h);
    const rows = 16, rh = h / rows;
    for (let j = 0; j < rows; j++) for (let i = 0; i < 8; i++) { const x = i * 32 + (j % 2) * 16, k = 0.78 + r() * 0.4; g.fillStyle = `rgb(${Math.round(120 * k)},${Math.round(98 * k)},${Math.round(88 * k)})`; g.fillRect(x + 1, j * rh + 1, 30, rh - 2); }
  }, { key: 'brg-brick', repeat: [1, 1] });
  M.vault = T('#5a4f4a', { map: M.texBrick, paint: 0.03, name: 'brg-vault' });
  M.soffitIron = T('#38544a', { paint: 0.05, name: 'brg-soffit-iron' });
  M.soffitDark = T('#2a3040', { paint: 0.04, name: 'brg-soffit-dark' });

  // ------------------------------------------------------------------ deck surfaces
  M.asphalt = T('#5a5d60', { paint: 0.07, name: 'brg-asphalt' });
  M.mark = ctx.mat.decal('#f1f1ec', { name: 'brg-mark' });
  M.markY = ctx.mat.decal('#e8c548', { name: 'brg-mark-y' });
  M.texPave = tex.draw(512, 512, (g, w, h) => {                  // granite slabs 1.2 x 0.8 m in running bond, tile 2.4 m
    const r = rngOf('pave');
    g.fillStyle = '#e6dcd6'; g.fillRect(0, 0, w, h);
    const rows = 3, rh = h / rows;
    for (let j = 0; j < rows; j++) for (let i = 0; i < 2; i++) {
      const x = i * w / 2 + (j % 2) * w / 4, k = 0.9 + r() * 0.12;
      for (const dx of [0, -w]) { g.fillStyle = `rgb(${Math.round(232 * k)},${Math.round(222 * k)},${Math.round(216 * k)})`; g.fillRect(x + dx + 2, j * rh + 2, w / 2 - 4, rh - 4); }
      for (let s = 0; s < 26; s++) { g.fillStyle = r() < 0.5 ? 'rgba(110,90,84,0.14)' : 'rgba(255,250,246,0.22)'; g.fillRect(x + r() * w / 2, j * rh + r() * rh, 2 + r() * 3, 2 + r() * 2); }
    }
    g.fillStyle = 'rgba(70,56,52,0.5)';
    for (let j = 0; j < rows; j++) g.fillRect(0, j * rh - 1.5, w, 3);
    for (let j = 0; j < rows; j++) for (const x of [(j % 2) * w / 4, w / 2 + (j % 2) * w / 4]) g.fillRect(x - 1.5, j * rh, 3, rh);
  }, { key: 'brg-pave', repeat: [1, 1], anisotropy: 8 });
  M.pave = T('#b8aca6', { map: M.texPave, paint: 0.04, name: 'brg-pave' });
  M.kerb = T('#9a9692', { paint: 0.04, name: 'brg-kerb' });
  M.texSett = tex.draw(256, 256, (g, w, h) => {                  // setts 0.12 x 0.15 m: tile 1.9 m
    const r = rngOf('sett');
    g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 14; j++) for (let i = 0; i < 12; i++) { const k = 0.82 + r() * 0.3; g.fillStyle = `rgb(${Math.round(200 * k)},${Math.round(200 * k)},${Math.round(204 * k)})`; g.fillRect(i * 21.3 + (j % 2) * 10 + 1, j * 18.3 + 1, 19, 16); }
  }, { key: 'brg-sett', repeat: [1, 1], anisotropy: 4 });
  M.sett = T('#8c8f91', { map: M.texSett, paint: 0.04, name: 'brg-sett' });
  M.texPlank = tex.draw(256, 128, (g, w, h) => {                 // planks along u: width 0.14 m, tile 1.0 x 0.9 m
    const r = rngOf('plank');
    for (let i = 0; i < 7; i++) { const k = 0.85 + r() * 0.2; g.fillStyle = `rgb(${Math.round(190 * k)},${Math.round(150 * k)},${Math.round(104 * k)})`; g.fillRect(0, i * 18, w, 16); g.fillStyle = 'rgba(70,45,24,0.5)'; g.fillRect(0, i * 18 + 16, w, 2); for (let s = 0; s < 4; s++) g.fillRect(r() * w, i * 18 + r() * 14, 20 + r() * 40, 1.5); }
  }, { key: 'brg-plank', repeat: [1, 1], anisotropy: 4 });
  M.plank = T('#a98660', { map: M.texPlank, paint: 0.05, name: 'brg-plank' });
  M.footAsphalt = T('#7a7d80', { paint: 0.07, name: 'brg-foot-asphalt' });

  // ------------------------------------------------------------------ painted fascia / apron bands of the iron arches (white-tinted canvases carry their own colour)
  const bandTex = (key, base, light, dark, kind) => tex.draw(512, 128, (g, w, h) => {      // tile 2.6 m x 0.65 m: the cast ornament band under the cornice
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.fillStyle = light; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 10, w, 10);
    g.fillStyle = dark; g.fillRect(0, 6, w, 3); g.fillRect(0, h - 13, w, 3);
    for (let i = 0; i < 2; i++) {
      const cx = i * w / 2 + w / 4, cy = h / 2;
      if (kind === 'rosette') {
        g.fillStyle = light; g.beginPath(); g.arc(cx, cy, 30, 0, 6.3); g.fill(); g.fillStyle = dark; g.beginPath(); g.arc(cx, cy, 20, 0, 6.3); g.fill(); g.fillStyle = light; g.beginPath(); g.arc(cx, cy, 8, 0, 6.3); g.fill();
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.fillRect(cx + Math.cos(a) * 36 - 3, cy + Math.sin(a) * 36 - 3, 6, 6); }
        g.strokeStyle = dark; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + 64, cy - 20); g.lineTo(cx + 78, cy); g.lineTo(cx + 64, cy + 20); g.moveTo(cx - 64, cy - 20); g.lineTo(cx - 78, cy); g.lineTo(cx - 64, cy + 20); g.stroke();
      } else if (kind === 'chevron') {
        g.fillStyle = dark; for (let k = -2; k <= 2; k++) { const x = cx + k * 42; g.beginPath(); g.moveTo(x - 14, cy - 22); g.lineTo(x + 10, cy); g.lineTo(x - 14, cy + 22); g.lineTo(x - 6, cy + 22); g.lineTo(x + 18, cy); g.lineTo(x - 6, cy - 22); g.fill(); }
      } else if (kind === 'lozenge') {
        g.fillStyle = light; g.beginPath(); g.moveTo(cx, cy - 34); g.lineTo(cx + 44, cy); g.lineTo(cx, cy + 34); g.lineTo(cx - 44, cy); g.fill(); g.fillStyle = dark; g.beginPath(); g.moveTo(cx, cy - 22); g.lineTo(cx + 28, cy); g.lineTo(cx, cy + 22); g.lineTo(cx - 28, cy); g.fill();
        g.fillStyle = light; g.beginPath(); g.arc(cx, cy, 7, 0, 6.3); g.fill();
      }
    }
  }, { key: 'brg-band-' + key, repeat: [1, 1], anisotropy: 8 });
  M.bandGreen = T('#ffffff', { map: bandTex('green', '#5c9478', '#86b898', '#2e5a46', 'rosette'), paint: 0.03, name: 'brg-band-green' });
  M.bandBlue = T('#ffffff', { map: bandTex('blue', '#2a50b0', '#6c92e0', '#16307a', 'rosette'), paint: 0.03, name: 'brg-band-blue' });
  M.bandRed = T('#ffffff', { map: bandTex('red', '#c8182c', '#e86a78', '#80101e', 'lozenge'), paint: 0.03, name: 'brg-band-red' });
  M.bandPev = T('#ffffff', { map: bandTex('pev', '#254636', '#4a6a58', '#16281f', 'lozenge'), paint: 0.03, name: 'brg-band-pev' });
  M.fasGreen = T('#5c9478', { paint: 0.05, name: 'brg-fas-green' });
  M.fasGreenDark = T('#3f7058', { paint: 0.05, name: 'brg-fas-green-d' });
  M.fasBlue = T('#2a50b0', { paint: 0.05, name: 'brg-fas-blue' });
  M.fasBlueLight = T('#4a74cc', { paint: 0.05, name: 'brg-fas-blue-l' });
  M.fasRed = T('#cc1c30', { paint: 0.05, name: 'brg-fas-red' });
  M.fasPev = T('#27483a', { paint: 0.05, name: 'brg-fas-pev' });
  M.fasPale = T('#cdd0c0', { paint: 0.05, name: 'brg-fas-pale' });         // Bankovsky / Mucny girder fascia
  M.fasForest = T('#38523f', { paint: 0.05, name: 'brg-fas-forest' });     // Italyansky plate girder
  M.fasIron = T('#2c4a3c', { paint: 0.04, name: 'brg-fas-iron' });         // Palace Bridge steel

  // ------------------------------------------------------------------ black cast iron, gilding, lamp glass
  M.iron = T('#202428', { paint: 0.02, name: 'brg-iron' });
  M.ironGreen = T('#2f5a46', { paint: 0.03, name: 'brg-iron-green' });
  M.ironGreenDark = T('#1f3a2c', { paint: 0.03, name: 'brg-iron-green-d' });
  M.gold = T('#d8aa30', { emissive: '#3a2a08', emissiveIntensity: 0.45, paint: 0.02, name: 'brg-gold' });
  M.steel = T('#8a9096', { paint: 0.02, name: 'brg-steel' });
  M.bronzeGrey = T('#4a5650', { paint: 0.04, name: 'brg-griffin' });
  M.pedestalGrey = T('#8e9086', { paint: 0.05, name: 'brg-pedestal' });
  M.lampGlass = T('#f2efe4', { emissive: '#ffd89a', emissiveIntensity: 0.0, paint: 0.02, name: 'brg-lamp-glass' });
  M.cap = T('#34383a', { paint: 0.03, name: 'brg-cap' });
  M.black = T('#1c1f21', { paint: 0.02, name: 'brg-black' });
  M.white = T('#e8e6de', { paint: 0.03, name: 'brg-white' });
  M.navy = T('#1d3a78', { paint: 0.03, name: 'brg-navy' });
  const lampMats = [M.lampGlass];
  ctx.onUpdate(() => { const n = ctx.shared && ctx.shared.uNight ? ctx.shared.uNight.value : 0, k = Math.min(1, Math.max(0, (n - 0.1) / 0.5)); for (const m of lampMats) m.emissiveIntensity = k * 1.6; });

  // ------------------------------------------------------------------ boards and plates
  const sign = (key, draw, w = 128, h = 128) => T('#ffffff', { map: tex.draw(w, h, draw, { key: 'brg-sign-' + key, repeat: [1, 1] }), name: 'brg-sign-' + key });
  M.clear = (txt) => sign('clear-' + txt, (g, w, h) => { g.fillStyle = '#d0242e'; g.fillRect(0, 0, w, h); g.fillStyle = '#f6f4ee'; g.fillRect(8, 8, w - 16, h - 16); g.fillStyle = '#16181a'; tex.fitText(g, txt, w / 2, h * 0.54, w * 0.74, h * 0.46, tex.FONTS.sans, 800); });
  M.boat = sign('boat', (g, w, h) => { g.fillStyle = '#1b5fb0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f6f4ee'; g.lineWidth = 5; g.strokeRect(5, 5, w - 10, h - 10); g.fillStyle = '#f6f4ee'; g.beginPath(); g.moveTo(24, 74); g.lineTo(104, 74); g.lineTo(92, 96); g.lineTo(36, 96); g.closePath(); g.fill(); g.fillRect(48, 52, 34, 20); g.fillRect(56, 38, 12, 14); g.fillRect(28, 102, 72, 5); });
  M.noShips = sign('noships', (g, w, h) => {                      // black plate, white stacked lettering (Kazansky: "ПРОХОД СУДОВ ЗАПРЕЩЁН")
    g.fillStyle = '#17191b'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d8d8d2'; g.lineWidth = 3; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = '#ecece6'; const L = ['ПРОХОД', 'СУДОВ', 'ЗАПРЕЩЁН']; L.forEach((t, i) => tex.fitText(g, t, w / 2, h * (0.22 + i * 0.28), w * 0.84, h * 0.2, tex.FONTS.sans, 700));
  }, 128, 256);
  M.anchor = (() => { const m = T('#ffffff', { map: tex.draw(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); const c = w / 2; g.fillStyle = '#f4f2ec'; g.beginPath(); g.arc(c, c, 62, 0, 6.3); g.fill(); g.strokeStyle = '#d0242e'; g.lineWidth = 12; g.beginPath(); g.arc(c, c, 56, 0, 6.3); g.stroke(); g.strokeStyle = '#1b1f20'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.arc(c, 34, 8, 0, 6.3); g.stroke(); g.beginPath(); g.moveTo(c, 42); g.lineTo(c, 98); g.stroke(); g.beginPath(); g.moveTo(c - 15, 55); g.lineTo(c + 15, 55); g.stroke(); g.beginPath(); g.arc(c, 80, 28, 0.15, Math.PI - 0.15); g.stroke(); g.strokeStyle = '#d0242e'; g.lineWidth = 10; g.beginPath(); g.moveTo(c - 44, c - 44); g.lineTo(c + 44, c + 44); g.stroke(); }, { key: 'brg-sign-anchor', repeat: [1, 1] }), alphaTest: 0.5, name: 'brg-sign-anchor' }); return m; })();
  M.namePlate = (txt) => sign('name-' + txt, (g, w, h) => { g.fillStyle = '#1c2a5a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2d4a32'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4); g.fillStyle = '#f2f2ee'; tex.fitText(g, txt, w / 2, h * 0.54, w * 0.9, h * 0.5, tex.FONTS.sans, 600); }, 256, 64);

  // ------------------------------------------------------------------ the Mars Field / Summer Garden reach (docs/research/mars-bridges-canals.md sections 7.1 / 8): per-bridge looks for arch.js
  M.graniteSwan = gm('granite-swan', '#a89a92');          // Upper Swan: bare grey-pink granite (#9a8c84 lit in the dossier)
  M.graniteLower = gm('granite-lower', '#c0968a');        // Lower Swan: pink-red arch
  M.graniteLaundry = gm('granite-laundry', '#b88f78');    // Laundry: warm pink-brown granite
  M.pierPink = T('#b88878', { map: M.texGranite, paint: 0.05, name: 'brg-pier-pink' });        // Troitsky piers / pedestals: polished pink-red granite
  M.pierGrey = T('#8a8a88', { map: M.texGranite, paint: 0.04, name: 'brg-pier-grey' });        // caisson base of the Troitsky piers
  M.steelTroitsky = T('#55695a', { paint: 0.04, name: 'brg-steel-troitsky' });                  // moss-green steel
  M.steelTroitskyDark = T('#3f4f45', { paint: 0.04, name: 'brg-steel-troitsky-d' });
  M.railSage = T('#8fa89a', { paint: 0.03, name: 'brg-rail-sage' });
  M.bronzeTroitsky = T('#4b5d50', { paint: 0.04, name: 'brg-bronze-troitsky' });
  M.contactGrey = T('#8ea08c', { paint: 0.03, name: 'brg-contact-pole' });
  M.obeliskRed = T('#8a4a40', { paint: 0.03, name: 'brg-obelisk-red' });
  M.tramRail = T('#6c7074', { paint: 0.02, name: 'brg-tram-rail' });
  M.sand = T('#b9a98a', { paint: 0.05, name: 'brg-sand' });
  const L = (key, fas, soffit, band) => ({ fas: T(fas, { paint: 0.05, name: 'brg-fas-' + key }), soffit: T(soffit, { paint: 0.05, name: 'brg-soffit-' + key }), band });
  /** per style: fascia colour, soffit colour, the ornament band under the cornice (iron arches); stone styles: { fas: granite material } only */
  M.bandTroitsky = T('#ffffff', { map: bandTex('troitsky', '#55695a', '#8fa89a', '#3b4a41', 'rosette'), paint: 0.03, name: 'brg-band-troitsky' });
  M.looks = {
    'swan-upper': { fas: M.graniteSwan }, 'swan-lower': { fas: M.graniteLower }, arch3: { fas: M.graniteLaundry },
    pantel: L('pantel', '#4f7a5a', '#33503c', T('#ffffff', { map: bandTex('pantel', '#7f9a6a', '#d8aa30', '#4f6a42', 'lozenge'), paint: 0.03, name: 'brg-band-pantel' })),
    eng1: L('eng1', '#587e62', '#3c5c48', T('#ffffff', { map: bandTex('eng1', '#587e62', '#8cb89c', '#365a44', 'rosette'), paint: 0.03, name: 'brg-band-eng1' })),
    garden1: L('garden1', '#5d8466', '#3c5e48', T('#ffffff', { map: bandTex('garden1', '#5d8466', '#d8aa30', '#3a6a4a', 'rosette'), paint: 0.03, name: 'brg-band-garden1' })),
    garden2: L('garden2', '#8da898', '#5e7a6a', T('#ffffff', { map: bandTex('garden2', '#8da898', '#c4d8cc', '#6a8576', 'chevron'), paint: 0.03, name: 'brg-band-garden2' })),
    konyush: L('konyush', '#2f4a3a', '#1f3328', T('#ffffff', { map: bandTex('konyush', '#2f4a3a', '#d8aa30', '#1c2f24', 'rosette'), paint: 0.03, name: 'brg-band-konyush' })),
    aegis: L('aegis', '#2c3f33', '#1c2a22', T('#ffffff', { map: bandTex('aegis', '#2c3f33', '#d8aa30', '#1a2a20', 'lozenge'), paint: 0.03, name: 'brg-band-aegis' })),
  };

  // ------------------------------------------------------------------ the south-west (docs/research/sw-canals-bridges.md section 3, 4, 6)
  M.colGreen = T('#2f4a38', { paint: 0.03, name: 'brg-col-green' });
  M.lionWhite = T('#eceae2', { paint: 0.04, name: 'brg-lion-white' });
  M.fasPochtamt = T('#33493a', { paint: 0.04, name: 'brg-fas-pochtamt' });
  M.fasLviny = T('#aab2b8', { paint: 0.04, name: 'brg-fas-lviny' });
  M.fasSennoy = T('#3c5a48', { paint: 0.04, name: 'brg-fas-sennoy' });
  M.fasKrasnogv = T('#3b5a40', { paint: 0.04, name: 'brg-fas-krasnogv' });
  M.fasKrasnoflot = T('#3f5a46', { paint: 0.04, name: 'brg-fas-krasnoflot' });
  // the Kamenny Bridge: alternating smooth and diamond-pointed ("брильянтовый руст") blocks, 2.2 m tile, 4 courses
  M.texRustic = tex.draw(512, 512, (g, w, h) => {
    const r = rngOf('rustic');
    g.fillStyle = '#f0ebe6'; g.fillRect(0, 0, w, h);
    const rows = 4, rh = h / rows;
    for (let j = 0; j < rows; j++) {
      let x = -((j % 2) * 70);
      let n = 0;
      while (x < w) {
        const bw = 140 + r() * 20, k = 0.9 + r() * 0.12, rustic = (n + j) % 2 === 0;
        g.fillStyle = `rgb(${Math.round(240 * k)},${Math.round(234 * k)},${Math.round(230 * k)})`; g.fillRect(x + 1.5, j * rh + 1.5, bw - 3, rh - 3);
        if (rustic) {                                                           // a pyramid: four facets drawn as lit / shaded triangles
          const x0 = x + 3, x1 = x + bw - 3, y0 = j * rh + 3, y1 = (j + 1) * rh - 3, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
          g.fillStyle = 'rgba(255,248,244,0.35)'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.lineTo(cx, cy); g.fill();
          g.fillStyle = 'rgba(60,44,40,0.28)'; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x1, y1); g.lineTo(cx, cy); g.fill();
          g.fillStyle = 'rgba(60,44,40,0.14)'; g.beginPath(); g.moveTo(x1, y0); g.lineTo(x1, y1); g.lineTo(cx, cy); g.fill();
          g.strokeStyle = 'rgba(70,52,46,0.4)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(cx, cy); g.lineTo(x1, y0); g.moveTo(x0, y1); g.lineTo(cx, cy); g.lineTo(x1, y1); g.stroke();
        } else for (let s = 0; s < 30; s++) { g.fillStyle = r() < 0.5 ? 'rgba(110,80,70,0.13)' : 'rgba(255,248,244,0.22)'; g.fillRect(x + r() * bw, j * rh + r() * rh, 2 + r() * 3, 2 + r() * 2); }
        x += bw; n++;
      }
    }
    g.fillStyle = 'rgba(60,44,40,0.58)'; for (let j = 0; j < rows; j++) g.fillRect(0, j * rh - 1.5, w, 3.5);
  }, { key: 'brg-rustic', repeat: [1, 1], anisotropy: 8 });
  M.graniteKamenny = T('#8c7266', { map: M.texRustic, paint: 0.05, name: 'brg-granite-kamenny' });
  M.graniteObukh = gm('granite-obukh', '#a8a29a');
  const Lk = (key, fas, soffit, band) => { M.looks[key] = L(key, fas, soffit, band); };
  const bandOf = (key, base, light, dark, kind) => T('#ffffff', { map: bandTex(key, base, light, dark, kind), paint: 0.03, name: 'brg-band-' + key });
  M.looks.krush1 = L('krush1', '#5c6a62', '#3c4640', null); M.looks.admiral = { fas: M.graniteRed };
  M.looks.kamenny = { fas: M.graniteKamenny }; M.looks.mogilev = { fas: M.graniteLaundry }; M.looks.slab = { fas: M.granite }; M.looks.obukh = { fas: M.graniteObukh };
  Lk('demidov', '#6f8a68', '#3e5a44', null); Lk('vozn', '#587a52', '#3c5a3c', null); Lk('podyach', '#7b906a', '#55684a', null);
  Lk('kokushkin', '#8a9482', '#626b5c', bandOf('kokushkin', '#8a9482', '#aab4a2', '#6c7664', 'rosette'));
  Lk('potseluev', '#7d9486', '#55695e', bandOf('potseluev', '#7d9486', '#b3c3b8', '#5a7064', 'rosette'));
  Lk('kharlamov', '#8c9094', '#7a7e80', null); Lk('novonik', '#9a9ea0', '#84888a', null); Lk('kashin', '#8c9094', '#7a7e80', null);
  Lk('fonarny', '#4c6b44', '#33492f', null); Lk('khrapov', '#6e7f76', '#55645c', null);
  Lk('pikalov', '#4a5a4a', '#2a3a30', null); Lk('staro', '#36513c', '#2a3a30', null); Lk('torgovy', '#44594b', '#2a3a30', null); Lk('matveev', '#4f6e3c', '#2a3a30', null); Lk('dekabristov', '#4a5c48', '#2a3a30', null);

  // ------------------------------------------------------------------ the big bridges of the Petrograd side / the Spit (docs/research/petro-bridges.md)
  M.sageT = T('#74917f', { paint: 0.04, name: 'brg-sage-t' });                                  // Trinity: all cast iron and steel in the sun (#7d9b87 lit)
  M.granitePeach = gm('granite-peach', '#cdb8a8');                                              // Trinity viaduct ashlar (pink-beige #dcc6b4 lit)
  M.parapetPeach = T('#d0beb0', { map: M.texParapet, paint: 0.05, name: 'brg-parapet-peach' });
  M.granitePink = gm('granite-pink', '#c0a093');                                                // Birzhevoy / Tuchkov / Palace north: pink-grey facing (#c9a79a lit)
  M.graniteSalmon = gm('granite-salmon', '#cc9f8c');                                            // Sampsonievsky (#dba893 lit)
  M.parapetPink = T('#c4a89c', { map: M.texParapet, paint: 0.05, name: 'brg-parapet-pink2' });
  M.fasPalace = T('#42624e', { paint: 0.04, name: 'brg-fas-palace' });                           // Palace Bridge trusses (#4b6a55 lit, #3f5a4b shade; was #2c4a3c)
  M.fasBirzh = T('#47704f', { paint: 0.05, name: 'brg-fas-birzh' });                            // Birzhevoy welded arches (#4c7858 lit, #2f5a42 shade)
  M.fasBirzhDark = T('#2c5540', { paint: 0.05, name: 'brg-fas-birzh-d' });
  M.fasTuchkov = T('#a2a8a4', { paint: 0.05, name: 'brg-fas-tuchkov' });                        // Tuchkov light grey steel (#aab0ac lit)
  M.fasTuchkovDark = T('#7a807e', { paint: 0.05, name: 'brg-fas-tuchkov-d' });
  M.fasSamps = T('#4f7859', { paint: 0.05, name: 'brg-fas-samps' });                            // Sampsonievsky girders, green since the 2020s (#55805f lit)
  M.fasSampsDark = T('#39593f', { paint: 0.05, name: 'brg-fas-samps-d' });
  M.fasKrest = T('#5a8468', { paint: 0.05, name: 'brg-fas-krest' });                            // Bolshoy Krestovsky girders and lamp posts (green)
  M.fasKrestDark = T('#3d5e4a', { paint: 0.05, name: 'brg-fas-krest-d' });
  M.concreteRust = T('#aaa396', { map: M.texGranite, paint: 0.06, name: 'brg-concrete-rust' });  // its rusticated concrete piers
  M.fasLazarev = T('#c2c6c9', { paint: 0.04, name: 'brg-fas-lazarev' });                         // Lazarevsky box girder
  M.pylonSilver = T('#cdd1d4', { paint: 0.03, name: 'brg-pylon-silver' });                        // its two steel arches
  M.fasZhdan = T('#93a5b0', { paint: 0.05, name: 'brg-fas-zhdan' });                            // Zhdanovsky Bridge blue-grey sheet fascia
  M.concrete = T('#aeb1a9', { paint: 0.06, name: 'brg-concrete' });                             // Krasnogo Kursanta girder
  M.graniteGrey = gm('granite-grey', '#aaa9a2');
  M.pavilion = T('#d9d4c8', { paint: 0.04, name: 'brg-pavilion' });
  M.pavilionRoof = T('#8e9aa0', { paint: 0.04, name: 'brg-pavilion-roof' });
  M.darkGlass = T('#2c3842', { paint: 0.02, name: 'brg-dark-glass' });

  // the Karpovka bridges (sites-petro.js): grey concrete frames, grey granite arches
  Lk('petropav', '#868d80', '#62685e', null); Lk('gesler', '#bdbab0', '#908d86', null); Lk('karpov', '#b9b7ad', '#8c8a82', null); Lk('baroch', '#4f9358', '#356a40', null); Lk('molod', '#bdb8ac', '#8f8a80', null);
  Lk('aptek', '#b3b0a8', '#8a8780', null); M.looks.silin = { fas: M.graniteObukh };
  M.fasGren = T('#8a9388', { paint: 0.05, name: 'brg-fas-gren' });                              // Grenadersky girders (grey-olive)
  M.fasGrenDark = T('#636b62', { paint: 0.05, name: 'brg-fas-gren-d' });

  M.decalMats = new Set([M.mark, M.markY, M.anchor]);
  M.lampMats = lampMats;
  return M;
}
