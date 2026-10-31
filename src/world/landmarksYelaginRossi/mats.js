// landmarksYelaginRossi/mats.js - the materials of the Rossi pavilions (ctx.mat.toon only; every name starts with 'rossi-').  19 materials for the whole module, shared by the four sights.
// Colours come from the dossier docs/research/yelagin-park-2026.md 5.8 and the photos refs/yelagin-park-2026/rossi 01-18:
//   Music Pavilion: white-cream stucco #eeeadd, columns of grey Siberian marble (loggia: light bluish grey with dark veins #b4bcc4; wing porches: darker veined grey-white #868b90), grey-pink rusticated
//     stylobate #b3afa6, pink-red granite cheek blocks of the steps #a77d70, cream / grey diamond floor tiles, drain pipes grey.
//   East pavilion: pale blue-grey stucco walls #aab3b9, WHITE Doric order and trim, grey-blue sheet-metal roof, cast-iron railing painted pale blue-grey #b4c2c8 with a ring chain, grey granite pier #8f918f.
//   Island pavilion: all white (#f0efe8), pale blue-grey painted sheet roof with seams, grey granite base courses.  Guardhouse site: printed banner (the real text of the hoarding), bare earth.
// M.decals = flat sheets lying 2-4 cm in front of a surface (polygonOffset, no outline); M.cutouts = alpha cut-outs (no outline).
const RNG = (seed) => { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; };

export function makeMats(ctx) {
  const T = ctx.mat.toon, M = { decals: new Set(), cutouts: new Set() };
  const flat = (name, col, o = {}) => T(col, { name: 'rossi-' + name, paint: 0.03, ...o });
  const tex = (key, w, h, fn, repeat = [1, 1]) => ctx.tex.draw(w, h, fn, { key: 'rossi-' + key, repeat });
  const mapped = (name, t, col = '#ffffff', o = {}) => T(col, { map: t, name: 'rossi-' + name, paint: 0.03, ...o });

  // ---- stucco: neutral light with soft rain streaks, a few chips and blotches (1 tile = 4 m)
  const stuccoTex = tex('stucco', 256, 256, (g, w, h) => {
    const r = RNG(5); g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) { const x = r() * w, ww = 6 + r() * 16, hh = h * (0.3 + r() * 0.6); const gr = g.createLinearGradient(0, 0, 0, hh); gr.addColorStop(0, 'rgba(110,104,92,0.09)'); gr.addColorStop(1, 'rgba(110,104,92,0)'); g.fillStyle = gr; g.fillRect(x, 0, ww, hh); }
    for (let i = 0; i < 40; i++) { g.globalAlpha = 0.03 + r() * 0.04; g.fillStyle = r() < 0.5 ? '#9c9686' : '#ffffff'; g.beginPath(); g.arc(r() * w, r() * h, 3 + r() * 14, 0, 6.3); g.fill(); }
    g.globalAlpha = 1;
  });
  M.stuccoCream = mapped('stuccoCream', stuccoTex, '#eeeadd');
  M.stuccoGrey = mapped('stuccoGrey', stuccoTex, '#aab3b9');
  M.white = mapped('white', stuccoTex, '#f1f4f6');

  // ---- the fluted Doric shaft: one tile = one flute (u 0..0.5 arris -> groove bottom, 0.5..1 back): a soft gradient with a dark line at the bottom of the groove
  const fluteTex = tex('flute', 32, 8, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, '#e6e9ec'); gr.addColorStop(0.45, '#9aa0a5'); gr.addColorStop(0.5, '#5b6268'); gr.addColorStop(0.55, '#9aa0a5'); gr.addColorStop(0.7, '#e6e9ec'); gr.addColorStop(1, '#ffffff');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  M.flute = mapped('flute', fluteTex, '#f1f4f6');
  // ---- veined grey marble: neutral base, dark and white veins running diagonally (1 tile = 2 m along v)
  const marbleTex = tex('marble', 256, 256, (g, w, h) => {
    const r = RNG(17); g.fillStyle = '#e4e7ea'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { g.globalAlpha = 0.22; g.fillStyle = r() < 0.5 ? '#aeb4b8' : '#eef0f0'; g.beginPath(); g.arc(r() * w, r() * h, 8 + r() * 30, 0, 6.3); g.fill(); }
    for (let i = 0; i < 16; i++) {
      g.globalAlpha = 0.55; g.strokeStyle = r() < 0.6 ? '#6f777d' : '#f6f7f7'; g.lineWidth = 1 + r() * 3; g.beginPath();
      let x = r() * w, y = 0; g.moveTo(x, y);
      for (let k = 0; k < 7; k++) { x += (r() - 0.35) * 46; y += h / 7; g.lineTo(x, y); }
      g.stroke();
    }
    g.globalAlpha = 1;
  });
  M.marbleLight = mapped('marbleLight', marbleTex, '#f3f6f9');
  M.marbleDark = mapped('marbleDark', marbleTex, '#9ea3a8');

  // ---- stone: rusticated limestone ashlar (4 courses per tile of 1 m, staggered joints), big grey granite blocks (2 courses per metre)
  const ashlarTex = tex('ashlar', 256, 256, (g, w, h) => {
    const r = RNG(23); g.fillStyle = '#bab6ac'; g.fillRect(0, 0, w, h);
    for (let c = 0; c < 4; c++) {
      const y = c * 64, off = (c % 2) * 80;
      for (let b = -1; b < 3; b++) { const x = off + b * 160; g.globalAlpha = 0.18; g.fillStyle = r() < 0.5 ? '#9a968a' : '#cfcbc0'; g.fillRect(x, y, 160, 62); }
      g.globalAlpha = 1; g.fillStyle = 'rgba(70,66,58,0.78)'; g.fillRect(0, y, w, 3);
      for (let b = -1; b < 3; b++) g.fillRect(off + b * 160, y, 3, 64);
      g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(0, y + 3, w, 3);
    }
    for (let i = 0; i < 260; i++) { g.globalAlpha = 0.16; g.fillStyle = '#6e6a5e'; g.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 2); }
    g.globalAlpha = 1;
  });
  M.ashlar = mapped('ashlar', ashlarTex, '#e6e1d6');
  const graniteTex = tex('granite', 256, 256, (g, w, h) => {
    const r = RNG(29); g.fillStyle = '#a3a19e'; g.fillRect(0, 0, w, h);
    for (let c = 0; c < 2; c++) {
      const y = c * 128, off = (c % 2) * 100;
      for (let b = -1; b < 2; b++) { g.globalAlpha = 0.2; g.fillStyle = r() < 0.5 ? '#8c8885' : '#bdbab6'; g.fillRect(off + b * 200, y, 200, 126); }
      g.globalAlpha = 1; g.fillStyle = 'rgba(54,50,48,0.8)'; g.fillRect(0, y, w, 3);
      for (let b = -1; b < 2; b++) g.fillRect(off + b * 200, y, 3, 128);
    }
    for (let i = 0; i < 900; i++) { g.globalAlpha = 0.4; g.fillStyle = r() < 0.4 ? '#58524f' : r() < 0.5 ? '#d5cfca' : '#9a7f78'; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5); }
    g.globalAlpha = 1;
  });
  M.granite = mapped('granite', graniteTex, '#c4c5c4');
  M.graniteRed = flat('graniteRed', '#a07a6e');

  // ---- the cast-iron railing: solid parts (posts, rails, finials) and the alpha panel with the ring chain and the lattice (2.4 m x 1.0 m)
  M.iron = flat('iron', '#b0bec4', { paint: 0.02 });
  const latticeTex = tex('lattice', 512, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff'; g.lineCap = 'round';
    const bar = (x0, y0, x1, y1, lw) => { g.lineWidth = lw; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    bar(0, 14, w, 14, 9); bar(0, 52, w, 52, 5); bar(0, h - 12, w, h - 12, 9); bar(0, h - 50, w, h - 50, 5);                    // top rail, under-rail, bottom rail, chain rail
    const n = 8, step = w / n;
    for (let i = 0; i < n; i++) {                                                                                                      // the hexagon lattice between the rails
      const x = i * step, xm = x + step / 2;
      bar(x, 52, xm, 100, 4); bar(xm, 100, x + step, 52, 4); bar(x, h - 50, xm, h - 98, 4); bar(xm, h - 98, x + step, h - 50, 4); bar(xm, 100, xm, h - 98, 4);
    }
    g.lineWidth = 5;
    for (let i = 0; i < 17; i++) { const cx = (i + 0.5) * w / 17; g.beginPath(); g.arc(cx, h * 0.5, 12, 0, 6.3); g.stroke(); }                 // the ring chain
    g.lineWidth = 4; g.beginPath(); g.arc(18, h / 2, 10, 0, 6.3); g.stroke();
  });
  M.ironLattice = T('#b4c2c8', { map: latticeTex, alphaTest: 0.5, side: 'double', name: 'rossi-ironLattice', paint: 0.02 }); M.cutouts.add(M.ironLattice);

  // ---- roofs: standing-seam sheet metal (1 tile = 2 m): the East pavilion's grey-blue roof, the Island pavilion's lighter painted sheet
  const seamTex = tex('seams', 128, 128, (g, w, h) => {
    const r = RNG(41); g.fillStyle = '#eef1f3'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(70,84,94,0.45)'; g.fillRect(i * 32, 0, 3, h); g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(i * 32 + 3, 0, 2, h); }
    for (let i = 0; i < 90; i++) { g.globalAlpha = 0.07; g.fillStyle = r() < 0.5 ? '#5a6870' : '#ffffff'; g.fillRect(r() * w, r() * h, 6 + r() * 20, 2 + r() * 6); }
    g.globalAlpha = 1; g.fillStyle = 'rgba(70,84,94,0.35)'; g.fillRect(0, 62, w, 2);
  });
  M.roofMetal = mapped('roofMetal', seamTex, '#79868f');
  M.roofLight = mapped('roofLight', seamTex, '#bcc8d0');

  // ---- openings and interior
  M.glass = flat('glass', '#3a4c5c', { paint: 0.01 });
  M.dark = flat('dark', '#3a4044', { paint: 0.01 });
  const tileTex = tex('floor-tiles', 256, 256, (g, w, h) => {
    const r = RNG(53); g.fillStyle = '#dccfb6'; g.fillRect(0, 0, w, h);
    for (let j = -1; j < 3; j++) for (let i = -1; i < 3; i++) {
      const cx = i * 128 + (j % 2) * 0, cy = j * 128; g.globalAlpha = 0.5; g.fillStyle = (i + j) % 2 ? '#bdb29c' : '#e6dcc6'; g.beginPath(); g.moveTo(cx + 64, cy); g.lineTo(cx + 128, cy + 64); g.lineTo(cx + 64, cy + 128); g.lineTo(cx, cy + 64); g.closePath(); g.fill();
    }
    g.globalAlpha = 1; g.strokeStyle = 'rgba(90,82,66,0.55)'; g.lineWidth = 2;
    for (let k = -2; k < 5; k++) { g.beginPath(); g.moveTo(k * 64, 0); g.lineTo(k * 64 + 256, 256); g.stroke(); g.beginPath(); g.moveTo(k * 64 + 256, 0); g.lineTo(k * 64, 256); g.stroke(); }
    for (let i = 0; i < 120; i++) { g.globalAlpha = 0.07; g.fillStyle = '#7a705c'; g.fillRect(r() * w, r() * h, 3 + r() * 10, 2); }
    g.globalAlpha = 1;
  });
  M.floorTile = mapped('floorTile', tileTex, '#ffffff', { paint: 0.02 });

  // ---- ground: pale pinkish gravel of the spit terrace (photo rossi 12: dark brown in the wet, pink beige dry), bare earth of the Guardhouse plot
  const gravelTex = tex('gravel', 256, 256, (g, w, h) => {
    const r = RNG(61); g.fillStyle = '#bcab9a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { g.globalAlpha = 0.3; g.fillStyle = r() < 0.4 ? '#8a7767' : r() < 0.5 ? '#d6c8b8' : '#a39080'; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
    g.globalAlpha = 1;
  });
  M.gravel = mapped('gravel', gravelTex, '#ffffff', { paint: 0.06 });
  const earthTex = tex('earth', 256, 256, (g, w, h) => {
    const r = RNG(67); g.fillStyle = '#a28f73'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1100; i++) { g.globalAlpha = 0.3; g.fillStyle = r() < 0.4 ? '#6f5f48' : r() < 0.5 ? '#c3b290' : '#8a7a5e'; g.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 3); }
    for (let i = 0; i < 30; i++) { g.globalAlpha = 0.5; g.fillStyle = '#6a8a4a'; g.fillRect(r() * w, r() * h, 2 + r() * 5, 2 + r() * 3); }
    g.globalAlpha = 1;
  });
  M.earth = mapped('earth', earthTex, '#ffffff', { paint: 0.06 });

  // ---- bas-relief tablets (decal): a moulded frame, a garland swag, a central medallion and two small masks on the stucco ground (1 tile = one tablet 1.6 x 0.8 m)
  const reliefTex = tex('relief', 256, 192, (g, w, h0) => {
    const h = 128; g.fillStyle = '#e9e6dc'; g.fillRect(0, 0, w, 192);
    g.strokeStyle = 'rgba(70,66,56,0.7)'; g.lineWidth = 3; g.strokeRect(6, 6, w - 12, h - 12);
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; g.strokeRect(10, 10, w - 20, h - 20);
    g.lineWidth = 5; g.strokeStyle = 'rgba(90,84,70,0.65)'; g.beginPath(); g.moveTo(24, 34); g.quadraticCurveTo(w * 0.27, 96, w * 0.5 - 22, 40); g.moveTo(w - 24, 34); g.quadraticCurveTo(w * 0.73, 96, w * 0.5 + 22, 40); g.stroke();
    g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.moveTo(24, 38); g.quadraticCurveTo(w * 0.27, 100, w * 0.5 - 22, 44); g.moveTo(w - 24, 38); g.quadraticCurveTo(w * 0.73, 100, w * 0.5 + 22, 44); g.stroke();
    g.fillStyle = 'rgba(96,90,76,0.7)'; g.beginPath(); g.arc(w / 2, 42, 17, 0, 6.3); g.fill(); g.fillStyle = 'rgba(244,242,234,0.95)'; g.beginPath(); g.arc(w / 2 - 1.5, 40.5, 14, 0, 6.3); g.fill();
    g.fillStyle = 'rgba(96,90,76,0.55)'; for (const x of [34, w - 34]) { g.beginPath(); g.ellipse(x, 62, 9, 12, 0, 0, 6.3); g.fill(); }
    for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(110,104,92,0.5)'; g.beginPath(); g.arc(w * 0.18 + i * 8.5, 80 + Math.sin(i * 0.9) * 8, 3.2, 0, 6.3); g.fill(); }
    // the Greek key (meander) band: two repeats of a hooked key in the lower 56 px
    g.fillStyle = '#f4f2ea'; g.fillRect(0, 136, w, 54); g.strokeStyle = 'rgba(86,80,68,0.85)'; g.lineWidth = 5; g.lineCap = 'butt'; g.lineJoin = 'miter';
    for (let k = 0; k < 4; k++) { const x = k * 64 + 8; g.beginPath(); g.moveTo(x, 182); g.lineTo(x, 144); g.lineTo(x + 48, 144); g.lineTo(x + 48, 174); g.lineTo(x + 18, 174); g.lineTo(x + 18, 160); g.lineTo(x + 32, 160); g.stroke(); }
    g.strokeStyle = 'rgba(86,80,68,0.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 140); g.lineTo(w, 140); g.moveTo(0, 186); g.lineTo(w, 186); g.stroke();
  });
  M.reliefUV = [[0, 0.34], [1, 0.34], [1, 1], [0, 1]];                                       // the tablet part of the texture
  M.meanderUV = (len) => [[0, 0.07], [len / 2, 0.07], [len / 2, 0.27], [0, 0.27]];            // the key band; len = metres (one repeat of four keys = 2 m)
  M.relief = T('#ffffff', { map: reliefTex, name: 'rossi-relief', paint: 0.01, polygonOffset: -2 }); M.decals.add(M.relief);

  // ---- the printed hoarding of the Guardhouse plot (photo rossi 16): a green banner with the picture of the lost pavilion and its history (the real text of the banner; the wedding-cars advertisement is left out)
  const hoardTex = tex('hoarding', 1024, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7aa04a'); gr.addColorStop(1, '#4f7a33'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(240,240,225,0.85)'; g.lineWidth = 3; g.strokeRect(10, 10, w - 20, h - 20);
    // the picture in the middle: the white arcaded pavilion in a park (a small painting, like the original print)
    // (the banner is a low gable: the mesh shows only the part of the texture under the slopes, tall in the middle (u 0.58) and 0 at both ends.  Everything must lie inside the triangle: at the
    //  height v the free width is u 0.58 v .. 1 - 0.42 v, so the picture sits in the middle and the two text blocks start / end where the roof is already above their top line)
    g.save(); g.beginPath(); g.rect(w * 0.43, 36, w * 0.19, 150); g.clip();
    const px = w * 0.43, pw = w * 0.19;
    const sky = g.createLinearGradient(0, 36, 0, 186); sky.addColorStop(0, '#8fa6b8'); sky.addColorStop(1, '#c9c0a0'); g.fillStyle = sky; g.fillRect(px, 36, pw, 150);
    g.fillStyle = '#4e6b3a'; g.fillRect(px, 78, pw, 70);
    g.fillStyle = '#efeadb'; g.fillRect(px + pw * 0.12, 96, pw * 0.76, 56);
    g.fillStyle = '#9d9684'; g.fillRect(px + pw * 0.12, 88, pw * 0.76, 10);
    g.fillStyle = '#4a4d44'; for (let i = 0; i < 5; i++) { const cx = px + pw * 0.22 + i * pw * 0.14; g.beginPath(); g.arc(cx, 126, 9, Math.PI, 0); g.lineTo(cx + 9, 152); g.lineTo(cx - 9, 152); g.closePath(); g.fill(); }
    g.fillStyle = '#c9b88c'; g.fillRect(px, 152, pw, 34);
    g.fillStyle = '#2f3a52'; for (let i = 0; i < 5; i++) g.fillRect(px + 8 + i * 30, 158 + (i % 2) * 6, 8, 22);
    g.fillStyle = '#d8d2c0'; for (let i = 0; i < 3; i++) g.fillRect(px + 100 + i * 28, 162 + (i % 3) * 4, 8, 20);
    g.restore();
    g.fillStyle = '#f4f1e2'; g.textAlign = 'left'; g.textBaseline = 'middle';
    const F = ctx.tex.FONTS.serif;
    // the history text of the banner (left of the picture, four lines, the first line's top at v 0.34: free from u 0.20), the park service text on the right (free up to u 0.85)
    const lx = w * 0.215, lw = w * 0.205;
    ctx.tex.fitText(g, 'Здание Гауптвахты', lx, 178, lw, 22, F, 700);
    ctx.tex.fitText(g, 'Архитектор К. Росси, 1822 г.', lx, 199, lw, 16, F, 600);
    ctx.tex.fitText(g, 'В 1996 году здание вновь сгорело', lx, 218, lw, 15, F, 500);
    ctx.tex.fitText(g, 'и будет восстановлено.', lx, 236, lw, 15, F, 500);
    g.textAlign = 'center';
    const rx = w * 0.745, rw = w * 0.19;
    ctx.tex.fitText(g, 'Стоянка свадебных', rx, 176, rw, 22, F, 700);
    ctx.tex.fitText(g, 'автомобилей', rx, 199, rw, 22, F, 700);
    ctx.tex.fitText(g, 'Костюмированные балы', rx, 222, rw, 15, F, 500);
    ctx.tex.fitText(g, 'и экскурсии', rx, 240, rw, 15, F, 500);
  });
  M.hoarding = T('#ffffff', { map: hoardTex, name: 'rossi-hoarding', paint: 0.0 });
  return M;
}
