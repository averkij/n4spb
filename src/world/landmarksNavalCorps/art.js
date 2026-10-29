// landmarksNavalCorps/art.js - the canvas paintings of the module (docs/research/navalcorps.md sections 4.9, 5.4, 6.2, 6.3, 7; photos refs/navalcorps a07 a04 a05 b02 b11 c16 c17 c18 c09 d01 d12).
//   Corps:   pale cream-yellow stucco, the rusticated ground floor (0.5 m courses), double-sash windows (three variants: ground, first and top floor), the brown glazed doors, the lunette and the blind roundels
//            of the pavilion attics, zinc standing-seam roofs, the memorial plaques with the real OSM wording (marble boards, black letters; no orders / stars).
//   Church:  yellow-tan Riga brick with sandstone belts, corbel arcature friezes and majolica squares, the gable mosaic with a gilded abstract inscription band, the gilded Celtic-knot belt of the central dome.
//   Stair:   red-brown polished granite (speckled), the pink granite of the stair and the quay blocks (ashlar), the bronze plates of the pedestal (inscription ПЕРВОМУ РУССКОМУ ПЛАВАТЕЛЮ ВОКРУГ СВЕТА
//            АДМИРАЛУ ИВАНУ ФЕДОРОВИЧУ КРУЗЕНШТЕРНУ, the coat of arms relief WITHOUT its two banners, the motto SPE ERECTUS), the cast-iron ship-wheel panel of the railing.
//   S-189:   the numerals С189 (white block letters with a black shadow), the gangway banner (plain white, black text), the red-and-white fender face of the pontoon, concrete.
// Every key starts with 'lmnaval-' (the texture cache is scene-wide: a prefix that matches another module silently takes its textures).
const TAU = Math.PI * 2;
export const COL = {
  plaster: '#e7d0a0', plasterShade: '#cdb07c', joint: '#cdb584', trim: '#efe9d8', frame: '#f3f1ea', column: '#ece8dc', plinth: '#9b968c', glass: '#3a4448', glassRef: '#6c7f8a',
  doorW: '#634527', doorE: '#8a6a45', zinc: '#a9b5bf', zincNew: '#b6c0c7', primer: '#c46a3c', dome: '#aebbc4', domeRib: '#93a3ae', gild: '#d9b04a', turret: '#e2d09a', iron: '#2a2d30',
  pipe: '#e2cf98', roofCream: '#e1c89f', brickRed: '#99735d', chimney: '#372d2c', chimneyCream: '#e6d6b0',
  granite: '#9a5a42', graniteLit: '#b06a4e', graniteShade: '#7a4636', stair: '#a8886c', stairRiser: '#8d7260', block: '#a98c7a', blockShade: '#907864', parapet: '#b49882', ironRail: '#222527',
  brick: '#c0a470', brickLit: '#cdb27c', brickShade: '#a88e5c', belt: '#d8c690', terra: '#a8643c', plinthCh: '#6e6a66', vault: '#64483e', grey: '#6f7780', stalk: '#8f969c', silver: '#c9d1d8',
  goldLit: '#e8c860', mosaic: '#c9a23a', doorOchre: '#d5b552', glassCh: '#2b3338', houseOchre: '#c9a85a', houseCream: '#e8d9ae', houseTerra: '#a65a3c',
  hull: '#9aa3a9', hullShade: '#8a949f', green: '#2f8a4a', boot: '#f0f0ec', deck: '#6b6f72', concrete: '#8d8f90', fenderRed: '#7a3f32', fenderWhite: '#e6e6e0', tent: '#8a8e8a', umbrella: '#2a8a82', mast: '#6f7478',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {}, C = COL;
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmnaval-' + key, repeat });
  const R = (seed) => ctx.rng(seed);
  const F = tex.FONTS;
  const speckle = (g, w, h, seed, n, a = 0.1, dark = '40,36,32') => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : dark},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2); } };
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };

  // ------------------------------------------------------------------------------------------ Corps: stucco and rustication (tiles 4 x 4 m and 3 x 2 m)
  A.stucco = D(256, 256, (g, w, h) => {
    g.fillStyle = C.plaster; g.fillRect(0, 0, w, h);
    const r = R(8101);
    for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,248,225' : '150,120,70'},${0.025 + r() * 0.03})`; g.fillRect(r() * w, 0, 6 + r() * 30, h); }
    speckle(g, w, h, 8102, 500, 0.05);
  }, 'stucco');
  A.rust = D(384, 256, (g, w, h) => {
    g.fillStyle = C.plaster; g.fillRect(0, 0, w, h);
    const r = R(8111), ch = h / 4;
    for (let k = 0; k < 4; k++) {
      g.fillStyle = `rgba(255,250,230,0.07)`; g.fillRect(0, k * ch + 4, w, 6);
      g.fillStyle = C.joint; g.fillRect(0, k * ch, w, 4); g.fillStyle = 'rgba(120,96,56,0.28)'; g.fillRect(0, k * ch + 4, w, 3);
      const off = (k % 2) * w / 4 + (r() * 10 | 0);
      for (let x = off; x < w + 1; x += w / 2) { g.fillStyle = C.joint; g.fillRect(x, k * ch, 3, ch); }
    }
    speckle(g, w, h, 8112, 400, 0.05);
  }, 'rust');
  /** window sashes: aspect w:h, `rows` panes high per sash, two sashes; dark glass with a faint sky reflection, white frame + muntins */
  const winTex = (key, w, h, rows) => D(w, h, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#46535a'); gr.addColorStop(0.55, '#2f393d'); gr.addColorStop(1, '#3a4448'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(150,175,190,0.22)'; g.beginPath(); g.moveTo(0, H * 0.55); g.lineTo(W * 0.5, 0); g.lineTo(W * 0.8, 0); g.lineTo(0, H * 0.9); g.closePath(); g.fill();
    const t = Math.max(3, W * 0.055), tm = Math.max(2, W * 0.028);
    g.fillStyle = C.frame;
    g.fillRect(0, 0, W, t); g.fillRect(0, H - t, W, t); g.fillRect(0, 0, t, H); g.fillRect(W - t, 0, t, H); g.fillRect(W / 2 - t * 0.6, 0, t * 1.2, H);
    for (let i = 1; i < rows; i++) { const y = H * i / rows; g.fillRect(t, y - tm / 2, W / 2 - t * 1.6, tm); g.fillRect(W / 2 + t * 0.6, y - tm / 2, W / 2 - t * 1.6, tm); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(t, t, W - 2 * t, 3);
  }, key);
  A.winGF = winTex('winGF', 96, 172, 3); A.winF1 = winTex('winF1', 96, 208, 3); A.winTF = winTex('winTF', 92, 116, 2);
  /** the plain compound walls (side and courtyard faces): one bay 3.25 x 13.3 m with the three window rows, hoods on the first floor, the belts and the cornice (cheap texture, no geometry) */
  A.tile = D(104, 426, (g, W, H) => {
    const m = (y) => (13.3 - y) / 13.3 * H, px = W / 3.25;
    g.fillStyle = C.plaster; g.fillRect(0, 0, W, H);
    g.fillStyle = C.joint; for (let y = 0.5; y < 4.1; y += 0.5) g.fillRect(0, m(y), W, 1);
    g.fillStyle = C.trim; g.fillRect(0, m(4.3), W, m(4.1) - m(4.3)); g.fillRect(0, m(9.6), W, m(9.4) - m(9.6)); g.fillRect(0, m(13.3), W, m(12.1) - m(13.3));
    g.fillStyle = C.plinth; g.fillRect(0, m(0.4), W, m(0) - m(0.4));
    const win = (sill, head, ww) => { const x = (3.25 - ww) / 2 * px; g.fillStyle = '#3a4448'; g.fillRect(x, m(head), ww * px, m(sill) - m(head)); g.fillStyle = C.frame; g.fillRect(x + ww * px / 2 - 1, m(head), 2, m(sill) - m(head)); g.fillRect(x, m(head), ww * px, 2); g.fillRect(x, m(sill) - 2, ww * px, 2); };
    win(1.55, 3.7, 1.2); win(5.35, 7.95, 1.2); win(10.3, 11.75, 1.15);
    g.fillStyle = C.trim; g.fillRect((3.25 - 1.5) / 2 * px, m(8.5), 1.5 * px, m(8.05) - m(8.5));
  }, 'tile');
  A.terrace = D(256, 256, (g, w, h) => {      // the pinkish compacted gravel / flag terrace in front of the stair (tile 3 m): pale pink-grey flags with fine joints and grit
    g.fillStyle = '#c4a89b'; g.fillRect(0, 0, w, h); const r = R(8401);
    for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? 'rgba(235,205,190,0.35)' : 'rgba(120,92,84,0.28)'; const s2 = 1 + r() * 3; g.fillRect(r() * w, r() * h, s2, s2); }
    g.fillStyle = 'rgba(110,84,76,0.35)'; g.fillRect(0, 0, w, 2); g.fillRect(0, h / 2, w, 2); g.fillRect(0, 0, 2, h); g.fillRect(w / 2, 0, 2, h);
  }, 'terrace');
  A.grille = D(64, 128, (g, w, h) => {          // an iron grille over a ground-floor window: vertical bars every 8 px and two rails (alpha cut-out)
    g.clearRect(0, 0, w, h); g.fillStyle = '#1e2224'; for (let x = 4; x < w; x += 8) g.fillRect(x, 0, 1.2, h); g.fillRect(0, 0, w, 2); g.fillRect(0, h - 2, w, 2); g.fillRect(0, h * 0.5 - 0.7, w, 1.4);
  }, 'grille');
  A.winChurch = D(64, 256, (g, W, H) => {     // tall arched church window: dark glass, thin muntins
    g.fillStyle = C.glassCh; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(120,140,150,0.2)'; g.fillRect(4, 4, W * 0.35, H - 8);
    g.fillStyle = '#5d554a'; g.fillRect(W / 2 - 2, 0, 4, H); for (let i = 1; i < 8; i++) g.fillRect(0, H * i / 8, W, 3);
  }, 'winChurch');
  A.doorW = D(128, 192, (g, W, H) => {        // double leaf wooden door, upper two thirds glazed (2 x 3 panes per leaf)
    g.fillStyle = C.doorW; g.fillRect(0, 0, W, H);
    for (const x0 of [6, W / 2 + 3]) {
      g.fillStyle = '#24231f'; g.fillRect(x0, 6, W / 2 - 9, H * 0.62);
      g.fillStyle = 'rgba(150,175,190,0.25)'; g.fillRect(x0 + 2, 8, 10, H * 0.62 - 4);
      g.fillStyle = '#4a321c'; for (let i = 1; i < 3; i++) g.fillRect(x0, 6 + H * 0.62 * i / 3, W / 2 - 9, 3); g.fillRect(x0 + (W / 2 - 9) / 2 - 1.5, 6, 3, H * 0.62);
      g.fillStyle = '#4a321c'; rr(g, x0 + 2, H * 0.62 + 12, W / 2 - 13, H * 0.3, 3); g.fill(); g.fillStyle = '#7a5835'; g.fillRect(x0 + 6, H * 0.62 + 16, W / 2 - 21, 3);
    }
    g.fillStyle = '#2a1c10'; g.fillRect(W / 2 - 1.5, 0, 3, H);
  }, 'doorW');
  A.doorE = D(128, 192, (g, W, H) => {
    g.fillStyle = C.doorE; g.fillRect(0, 0, W, H); g.fillStyle = '#6a4e30'; g.fillRect(W / 2 - 1.5, 0, 3, H);
    for (const x0 of [8, W / 2 + 4]) { g.fillStyle = '#5a4128'; rr(g, x0, 10, W / 2 - 12, H * 0.38, 3); g.fill(); rr(g, x0, H * 0.5, W / 2 - 12, H * 0.42, 3); g.fill(); g.fillStyle = '#9c7c55'; g.fillRect(x0 + 4, 14, W / 2 - 20, 3); g.fillRect(x0 + 4, H * 0.5 + 4, W / 2 - 20, 3); }
  }, 'doorE');
  A.lunette = D(256, 128, (g, W, H) => {      // half-round window 3.5 x 1.8 m with 7 radial bars and a horizontal mullion
    g.fillStyle = C.frame; g.beginPath(); g.moveTo(0, H); g.arc(W / 2, H, W / 2, Math.PI, 0); g.closePath(); g.fill();
    g.fillStyle = '#34414a'; g.beginPath(); g.moveTo(10, H - 6); g.arc(W / 2, H - 6, W / 2 - 10, Math.PI, 0); g.closePath(); g.fill();
    g.fillStyle = 'rgba(160,185,200,0.25)'; g.beginPath(); g.moveTo(14, H - 8); g.arc(W / 2, H - 8, W / 2 - 14, Math.PI * 1.1, Math.PI * 1.55); g.lineTo(W / 2, H - 8); g.closePath(); g.fill();
    g.strokeStyle = C.frame; g.lineWidth = 4; for (let i = 1; i <= 7; i++) { const a = Math.PI + Math.PI * i / 8; g.beginPath(); g.moveTo(W / 2, H - 6); g.lineTo(W / 2 + Math.cos(a) * (W / 2 - 8), H - 6 + Math.sin(a) * (W / 2 - 8)); g.stroke(); }
    g.fillStyle = C.frame; g.fillRect(8, H - 38, W - 16, 4); g.fillRect(0, H - 6, W, 6);
  }, 'lunette');
  A.roundel = D(128, 128, (g, W, H) => {      // recessed blind disc with a crescent shadow
    g.fillStyle = C.plaster; g.fillRect(0, 0, W, H); g.fillStyle = C.trim; g.beginPath(); g.arc(W / 2, H / 2, W * 0.5 - 2, 0, TAU); g.fill();
    g.fillStyle = '#d9c58f'; g.beginPath(); g.arc(W / 2, H / 2, W * 0.4, 0, TAU); g.fill(); g.fillStyle = '#b79f68'; g.beginPath(); g.arc(W / 2 + 8, H / 2 + 8, W * 0.4, 0, TAU); g.arc(W / 2, H / 2, W * 0.38, TAU, 0, true); g.fill();
  }, 'roundel');
  A.zinc = D(256, 256, (g, w, h) => {         // standing-seam zinc roof: seams every 0.6 m on a tile 2.4 m wide (u = across the seams)
    g.fillStyle = C.zinc; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(70,84,94,0.45)'; g.fillRect(i * 64, 0, 3, h); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(i * 64 + 3, 0, 3, h); }
    const r = R(8131); for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(r() * w, 0, 14 + r() * 30, h); }
    speckle(g, w, h, 8132, 260, 0.06);
  }, 'zinc');
  A.zincRust = D(256, 256, (g, w, h) => { g.fillStyle = C.primer; g.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(80,36,20,0.45)'; g.fillRect(i * 64, 0, 3, h); } speckle(g, w, h, 8133, 200, 0.08); }, 'zincRust');
  A.dome = D(256, 128, (g, w, h) => {         // flat dome zinc: meridian seams (u = around, 28 gores over 2 uv units)
    g.fillStyle = C.dome; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) { g.fillStyle = C.domeRib; g.fillRect(i * w / 2, 0, 3, h); g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(i * w / 2 + 3, 0, 3, h); }
    speckle(g, w, h, 8141, 160, 0.06);
  }, 'dome');
  /** memorial plaque boards: pale marble / dark bronze-letter board with the real wording, wrapped in the board frame */
  const plaque = (key, text, dark = false) => D(256, 340, (g, w, h) => {
    g.fillStyle = dark ? '#34383a' : '#d9d8d2'; g.fillRect(0, 0, w, h);
    g.strokeStyle = dark ? '#8a7a52' : '#8f8e88'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
    g.strokeStyle = dark ? 'rgba(160,140,90,0.5)' : 'rgba(120,120,115,0.5)'; g.lineWidth = 2; g.strokeRect(14, 14, w - 28, h - 28);
    g.fillStyle = dark ? '#c9a95a' : '#26282a'; g.textAlign = 'center'; g.textBaseline = 'top';
    const size = 17, lh = size * 1.28; g.font = `600 ${size}px ${F.serif}`;
    const words = text.split(' '), lines = []; let cur = '';
    for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (g.measureText(t).width > w - 44 && cur) { lines.push(cur); cur = wd; } else cur = t; }
    if (cur) lines.push(cur);
    let y = Math.max(20, (h - lines.length * lh) / 2);
    for (const ln of lines) { g.fillText(ln, w / 2, y); y += lh; }
  }, key);
  A.plaque = (i, text, dark) => plaque('plaque' + i, text, dark);
  A.plaqueBlank = D(64, 64, (g, w, h) => { g.fillStyle = '#cfcec8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8f8e88'; g.lineWidth = 4; g.strokeRect(3, 3, w - 6, h - 6); }, 'plaqueBlank');

  // ------------------------------------------------------------------------------------------ monument and stair
  A.graniteRed = D(256, 256, (g, w, h) => {   // polished red-brown granite with pink-grey speckles and black flecks (tile 1 m)
    g.fillStyle = C.granite; g.fillRect(0, 0, w, h); const r = R(8201);
    for (let i = 0; i < 1100; i++) { const k = r(); g.fillStyle = k < 0.4 ? 'rgba(214,150,126,0.55)' : k < 0.7 ? 'rgba(40,24,22,0.55)' : 'rgba(236,214,200,0.45)'; const s = 1 + r() * 3.2; g.fillRect(r() * w, r() * h, s, s * (0.7 + r() * 0.6)); }
  }, 'graniteRed');
  A.stairGranite = D(256, 256, (g, w, h) => {  // pink-grey granite slabs, tile 2 x 2 m (joints every 1 m), flame-finished
    g.fillStyle = C.stair; g.fillRect(0, 0, w, h); const r = R(8211);
    for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? 'rgba(236,200,176,0.35)' : 'rgba(70,50,44,0.3)'; const s = 1 + r() * 2.4; g.fillRect(r() * w, r() * h, s, s); }
    g.fillStyle = 'rgba(80,58,48,0.5)'; g.fillRect(0, 0, w, 3); g.fillRect(0, h / 2, w, 3); g.fillRect(0, 0, 3, h); g.fillRect(w / 2, 0, 3, h);
  }, 'stairGranite');
  A.ashlar = D(256, 256, (g, w, h) => {        // quay-wall granite ashlar: 0.9 x 0.55 m blocks (tile 3.6 x 2.2 m), darker band below
    g.fillStyle = C.block; g.fillRect(0, 0, w, h); const r = R(8221), ch = h / 4;
    for (let k = 0; k < 4; k++) for (let c = -1; c < 4; c++) { const x = c * w / 4 + (k % 2) * w / 8, v = 0.94 + r() * 0.1; g.fillStyle = `rgb(${169 * v | 0},${140 * v | 0},${122 * v | 0})`; g.fillRect(x + 2, k * ch + 2, w / 4 - 4, ch - 4); }
    speckle(g, w, h, 8222, 500, 0.06);
  }, 'ashlar');
  A.plate = D(512, 200, (g, w, h) => {         // the stepped bronze inscription plate of the pedestal (dossier 5.4): narrow tab with line 1, wider plate with lines 2-4, bolts at the corners
    g.clearRect(0, 0, w, h);
    const tab0 = w * 0.155, tab1 = w * 0.845, ty = 0, th = h * 0.27, py = th, ph = h - th;
    g.fillStyle = '#3d3830'; g.fillRect(tab0, ty, tab1 - tab0, th + 2); g.fillRect(0, py, w, ph);
    g.fillStyle = '#2a2620'; g.fillRect(tab0, ty, tab1 - tab0, 3); g.fillRect(0, py + ph - 3, w, 3);
    g.fillStyle = '#6a5a3a'; for (const [x, y] of [[tab0 + 12, 12], [tab1 - 12, 12], [12, py + 12], [w - 12, py + 12], [12, h - 12], [w - 12, h - 12]]) { g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); }
    g.fillStyle = '#9a8660'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const lines = [['ПЕРВОМУ РУССКОМУ', th * 0.52, 32], ['ПЛАВАТЕЛЮ ВОКРУГ СВЕТА', py + ph * 0.19, 31], ['АДМИРАЛУ ИВАНУ ФЕДОРОВИЧУ', py + ph * 0.5, 31], ['КРУЗЕНШТЕРНУ', py + ph * 0.8, 40]];
    for (const [t, y, s] of lines) tex.fitText(g, t, w / 2, y, w * 0.9, s, F.sans, 700);
  }, 'plate', [1, 1]);
  A.arms = D(256, 320, (g, w, h) => {          // the coat of arms relief of the pedestal: a shield with a six-pointed star over clasped hands, a closed helmet with crown and plume, two supporters,
    g.clearRect(0, 0, w, h);                   // acanthus mantling, the scroll SPE ERECTUS.  The two furled banners of the real relief are OMITTED (no flags).
    g.fillStyle = '#34312c'; g.beginPath(); g.moveTo(8, 8); g.lineTo(w - 8, 8); g.lineTo(w - 8, h * 0.9); g.quadraticCurveTo(w - 14, h * 0.96, w / 2, h - 4); g.quadraticCurveTo(14, h * 0.96, 8, h * 0.9); g.closePath(); g.fill();
    g.strokeStyle = '#6b5f4e'; g.lineWidth = 3; g.stroke();
    const light = '#7a6c55', mid = '#55493a', dk = '#24211d';
    const blob = (x, y, rx, ry, c, rot = 0) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); };
    // mantling (acanthus scrolls)
    g.strokeStyle = light; g.lineWidth = 5; g.lineCap = 'round';
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(w / 2 + s * 20, h * 0.28); g.bezierCurveTo(w / 2 + s * 80, h * 0.2, w / 2 + s * 110, h * 0.5, w / 2 + s * 90, h * 0.75); g.stroke(); g.beginPath(); g.moveTo(w / 2 + s * 40, h * 0.45); g.bezierCurveTo(w / 2 + s * 100, h * 0.4, w / 2 + s * 112, h * 0.6, w / 2 + s * 100, h * 0.8); g.stroke(); blob(w / 2 + s * 102, h * 0.72, 11, 16, mid, s * 0.5); }
    // helmet, crown, plume
    blob(w / 2, h * 0.19, 26, 21, mid); blob(w / 2, h * 0.17, 20, 15, light); g.fillStyle = dk; g.fillRect(w / 2 - 14, h * 0.17, 28, 4);
    g.fillStyle = mid; g.fillRect(w / 2 - 18, h * 0.08, 36, 9); g.fillStyle = light; for (let i = 0; i < 5; i++) g.fillRect(w / 2 - 17 + i * 8, h * 0.055, 5, 8);
    g.strokeStyle = light; g.lineWidth = 5; g.beginPath(); g.moveTo(w / 2, h * 0.05); g.bezierCurveTo(w / 2 + 14, h * 0.0, w / 2 + 34, h * 0.02, w / 2 + 40, h * 0.07); g.stroke();
    // shield
    g.fillStyle = mid; g.beginPath(); g.moveTo(w / 2 - 44, h * 0.34); g.lineTo(w / 2 + 44, h * 0.34); g.lineTo(w / 2 + 44, h * 0.62); g.quadraticCurveTo(w / 2 + 40, h * 0.76, w / 2, h * 0.8); g.quadraticCurveTo(w / 2 - 40, h * 0.76, w / 2 - 44, h * 0.62); g.closePath(); g.fill();
    g.strokeStyle = light; g.lineWidth = 3; g.stroke();
    g.fillStyle = light; g.beginPath(); for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + i * Math.PI / 6, rad = i % 2 ? 9 : 20; g.lineTo(w / 2 + Math.cos(a) * rad, h * 0.46 + Math.sin(a) * rad); } g.closePath(); g.fill();
    blob(w / 2 - 9, h * 0.64, 14, 6, light, -0.2); blob(w / 2 + 9, h * 0.64, 14, 6, light, 0.2);
    // supporters: left a bare-chested standing man, right a draped bearded figure
    blob(w / 2 - 66, h * 0.36, 9, 10, light); g.fillStyle = light; g.fillRect(w / 2 - 74, h * 0.4, 16, h * 0.34); g.fillStyle = mid; g.fillRect(w / 2 - 74, h * 0.62, 16, h * 0.12);
    blob(w / 2 + 66, h * 0.36, 9, 10, light); g.fillStyle = mid; g.fillRect(w / 2 + 56, h * 0.4, 20, h * 0.36); g.fillStyle = light; g.fillRect(w / 2 + 56, h * 0.42, 6, h * 0.3);
    // scroll with the motto
    g.fillStyle = mid; g.beginPath(); g.moveTo(w / 2 - 70, h * 0.84); g.quadraticCurveTo(w / 2, h * 0.9, w / 2 + 70, h * 0.84); g.lineTo(w / 2 + 70, h * 0.88); g.quadraticCurveTo(w / 2, h * 0.95, w / 2 - 70, h * 0.88); g.closePath(); g.fill();
    g.fillStyle = '#b9a67a'; g.font = `700 12px ${F.serif}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SPE ERECTUS', w / 2, h * 0.895);
  }, 'arms', [1, 1]);
  A.wheelPanel = D(256, 128, (g, w, h) => {     // one cast-iron panel of the railing: frame, X lattice, two ship's-wheel medallions with eight spokes (tile = one panel 1.75 x 0.8 m)
    g.clearRect(0, 0, w, h); g.strokeStyle = C.ironRail; g.fillStyle = C.ironRail; g.lineCap = 'butt';
    g.lineWidth = 5; g.beginPath(); g.moveTo(0, 8); g.lineTo(w, 8); g.moveTo(0, h - 10); g.lineTo(w, h - 10); g.stroke(); g.fillRect(0, h - 22, w, 8);
    g.lineWidth = 3; g.beginPath(); g.moveTo(0, 8); g.lineTo(w / 2, h - 18); g.lineTo(w, 8); g.moveTo(0, h - 18); g.lineTo(w / 2, 8); g.lineTo(w, h - 18); g.stroke();
    for (const cx of [w * 0.25, w * 0.75]) {
      const cy = h * 0.5; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, 28, 0, TAU); g.stroke(); g.lineWidth = 2.5;
      for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 33, cy + Math.sin(a) * 33); g.stroke(); g.beginPath(); g.arc(cx + Math.cos(a) * 33, cy + Math.sin(a) * 33, 3, 0, TAU); g.fill(); }
      g.beginPath(); g.arc(cx, cy, 7, 0, TAU); g.fill();
    }
  }, 'wheelPanel', [1, 1]);
  A.lattice = D(128, 128, (g, w, h) => {        // plain iron lattice with a loop band (railings of the church fence and the yard)
    g.clearRect(0, 0, w, h); g.strokeStyle = C.ironRail; g.lineWidth = 4;
    g.beginPath(); g.moveTo(0, 6); g.lineTo(w, 6); g.moveTo(0, h - 6); g.lineTo(w, h - 6); g.stroke();
    g.lineWidth = 3; for (let i = 0; i < 4; i++) { const x = i * w / 4 + w / 8; g.beginPath(); g.moveTo(x, 6); g.lineTo(x, h - 6); g.stroke(); g.beginPath(); g.arc(x + w / 8, h / 2, w / 10, 0, TAU); g.stroke(); }
  }, 'lattice', [1, 1]);

  // ------------------------------------------------------------------------------------------ church
  A.brick = D(384, 460, (g, w, h) => {          // tile 3.0 x 3.6 m: yellow-tan brick courses, a sandstone belt, an arcature frieze, majolica squares, a plain panel field
    g.fillStyle = C.brick; g.fillRect(0, 0, w, h); const r = R(8301);
    for (let y = 0; y < h; y += 7) { g.fillStyle = 'rgba(80,60,30,0.16)'; g.fillRect(0, y, w, 1.4); for (let x = (y / 7 % 2) * 10; x < w; x += 20) { g.fillStyle = 'rgba(80,60,30,0.10)'; g.fillRect(x, y, 1.2, 7); } }
    for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,240,190,0.10)' : 'rgba(120,80,40,0.10)'; g.fillRect(r() * w, r() * h, 10 + r() * 20, 6); }
    // belts (sandstone) at 0.12 and 0.5 of the tile, with a terracotta accent line
    for (const [fy, ht] of [[0.04, 0.05], [0.5, 0.035]]) { g.fillStyle = C.belt; g.fillRect(0, h * fy, w, h * ht); g.fillStyle = C.terra; g.fillRect(0, h * (fy + ht), w, 3); g.fillStyle = 'rgba(120,96,50,0.5)'; g.fillRect(0, h * fy, w, 2); }
    // arcature frieze: a row of tiny arches under the upper belt (0.35 m pitch)
    g.fillStyle = C.brickShade; for (let x = 0; x < w; x += 41) { g.beginPath(); g.arc(x + 20, h * 0.145, 14, Math.PI, 0); g.lineTo(x + 34, h * 0.155 + 20); g.lineTo(x + 6, h * 0.155 + 20); g.closePath(); g.fill(); }
    g.fillStyle = C.belt; for (let x = 0; x < w; x += 41) { g.beginPath(); g.arc(x + 20, h * 0.145, 17, Math.PI, 0); g.arc(x + 20, h * 0.145, 12, 0, Math.PI, true); g.fill(); }
    // majolica squares (blue-green rosettes) in a row
    for (let x = 22; x < w; x += 96) { g.fillStyle = C.belt; g.fillRect(x - 17, h * 0.62 - 17, 34, 34); g.fillStyle = '#4a8c9a'; g.fillRect(x - 12, h * 0.62 - 12, 24, 24); g.fillStyle = '#e8e0c0'; g.beginPath(); g.arc(x, h * 0.62, 7, 0, TAU); g.fill(); g.fillStyle = '#9a3a32'; g.beginPath(); g.arc(x, h * 0.62, 3.5, 0, TAU); g.fill(); }
    // recessed panel field (lighter brick frame) in the lower third
    g.strokeStyle = C.belt; g.lineWidth = 6; g.strokeRect(24, h * 0.72, w - 48, h * 0.22); g.strokeStyle = C.terra; g.lineWidth = 2; g.strokeRect(34, h * 0.72 + 10, w - 68, h * 0.22 - 20);
    speckle(g, w, h, 8302, 600, 0.05);
  }, 'brick');
  A.brickPlain = D(256, 256, (g, w, h) => {      // plain brick (tile 2 x 2 m): courses and a few darker bricks
    g.fillStyle = C.brick; g.fillRect(0, 0, w, h); const r = R(8311);
    for (let y = 0; y < h; y += 7) { g.fillStyle = 'rgba(80,60,30,0.16)'; g.fillRect(0, y, w, 1.4); for (let x = (y / 7 % 2) * 12; x < w; x += 24) { g.fillStyle = 'rgba(80,60,30,0.10)'; g.fillRect(x, y, 1.2, 7); } }
    for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,240,190,0.10)' : 'rgba(120,80,40,0.12)'; g.fillRect(r() * w, r() * h, 12 + r() * 20, 6); }
  }, 'brickPlain');
  A.arcature = D(256, 64, (g, w, h) => {         // corbel table: tiny arches (tile 2.0 x 0.5 m: 6 arches)
    g.fillStyle = C.belt; g.fillRect(0, 0, w, h); g.fillStyle = C.brickShade; const n = 6, pw = w / n;
    for (let i = 0; i < n; i++) { g.beginPath(); g.arc(i * pw + pw / 2, h * 0.55, pw * 0.32, Math.PI, 0); g.lineTo(i * pw + pw * 0.82, h); g.lineTo(i * pw + pw * 0.18, h); g.closePath(); g.fill(); }
    g.fillStyle = 'rgba(120,96,50,0.5)'; g.fillRect(0, 0, w, 3); g.fillStyle = C.terra; g.fillRect(0, h - 4, w, 4);
  }, 'arcature');
  A.mosaic = D(256, 160, (g, w, h) => {          // the gable mosaic: gold tesserae with a floral pattern in blue, red and green, under a gilded abstract inscription band
    g.fillStyle = C.mosaic; g.fillRect(0, 0, w, h); const r = R(8321);
    for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,230,140,0.30)' : 'rgba(110,80,20,0.25)'; g.fillRect(r() * w, r() * h, 4, 4); }
    const cols = ['#3b6f8a', '#9a3a32', '#4a7a4a', '#e8e0c0'];
    for (let k = 0; k < 14; k++) { const cx = 20 + (k % 5) * 54 + (k > 9 ? 27 : 0), cy = 36 + Math.floor(k / 5) * 44; g.fillStyle = cols[k % 4]; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * TAU / 10, rad = i % 2 ? 7 : 15; g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); } g.closePath(); g.fill(); g.fillStyle = '#e8e0c0'; g.beginPath(); g.arc(cx, cy, 3, 0, TAU); g.fill(); }
    g.strokeStyle = '#4a4a2a'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
  }, 'mosaic');
  A.knot = D(256, 64, (g, w, h) => {              // the gilded Celtic-knot belt of the central dome (u = around the dome, 8 cartouches)
    g.fillStyle = C.gild; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a6a1c'; g.lineWidth = 3;
    for (let i = 0; i < 8; i++) { const x = i * w / 8; g.beginPath(); g.moveTo(x, h * 0.2); g.bezierCurveTo(x + w / 24, h * 0.9, x + w / 12, h * 0.1, x + w / 8, h * 0.8); g.stroke(); g.beginPath(); g.moveTo(x, h * 0.8); g.bezierCurveTo(x + w / 24, h * 0.1, x + w / 12, h * 0.9, x + w / 8, h * 0.2); g.stroke(); g.fillStyle = '#f0d070'; g.beginPath(); g.arc(x + w / 16, h / 2, 6, 0, TAU); g.fill(); }
    g.fillStyle = '#8a6a1c'; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3);
  }, 'knot');
  A.silver = D(128, 64, (g, w, h) => { g.fillStyle = C.silver; g.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(80,92,104,0.35)'; g.fillRect(i * w / 4, 0, 2, h); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(i * w / 4 + 2, 0, 4, h); } }, 'silver');
  A.domeAl = D(128, 64, (g, w, h) => { g.fillStyle = '#a6aeb2'; g.fillRect(0, 0, w, h); const r = R(8341); for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? 'rgba(90,96,100,0.25)' : 'rgba(210,214,216,0.2)'; g.fillRect(r() * w, r() * h, 10 + r() * 24, 3 + r() * 6); } for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(70,76,80,0.4)'; g.fillRect(i * w / 4, 0, 2, h); } }, 'domeAl');
  A.verdi = D(256, 256, (g, w, h) => {          // the statue bronze: dark blue-green bronze with bright verdigris on the up-facing surfaces (v = normal.y: the top rows) and rain streaks
    const r = R(8211); g.fillStyle = '#3f5f55'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 360; i++) { g.globalAlpha = 0.22; g.fillStyle = r() < 0.5 ? '#26382f' : '#5a8274'; g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * 7, 0, TAU); g.fill(); }
    g.globalAlpha = 1; g.fillStyle = 'rgba(106,162,145,0.38)'; g.fillRect(0, 0, w, h * 0.24);
    for (let x = 0; x < w; x += 3) { const s = r(); if (s < 0.3) continue; const gr = g.createLinearGradient(0, 0, 0, h * (0.25 + s * 0.45)); gr.addColorStop(0, 'rgba(120,180,160,' + (0.25 + 0.35 * s) + ')'); gr.addColorStop(1, 'rgba(120,180,160,0)'); g.fillStyle = gr; g.fillRect(x, 0, 3, h * (0.25 + s * 0.45)); }
  }, 'verdi');
  A.gildDiamond = D(64, 64, (g, w, h) => { g.fillStyle = C.gild; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a6a1c'; g.lineWidth = 2; for (let i = -2; i < 6; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16 + 64, 64); g.moveTo(i * 16 + 64, 0); g.lineTo(i * 16, 64); g.stroke(); } }, 'gildDiamond');
  A.portalDoor = D(64, 96, (g, w, h) => { g.fillStyle = C.doorOchre; g.fillRect(0, 0, w, h); g.fillStyle = '#b8963a'; g.fillRect(w / 2 - 1.5, 0, 3, h); g.fillRect(0, h * 0.45, w, 3); }, 'portalDoor');
  A.facadeHouse = D(256, 256, (g, w, h) => {      // front house of the compound: yellow-ochre brick, cream belts, terracotta bands (tile 3 x 3 m)
    g.fillStyle = C.houseOchre; g.fillRect(0, 0, w, h); const r = R(8351);
    for (let y = 0; y < h; y += 6) { g.fillStyle = 'rgba(80,60,20,0.14)'; g.fillRect(0, y, w, 1.2); }
    for (let i = 0; i < 100; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,240,180,0.10)' : 'rgba(120,80,30,0.10)'; g.fillRect(r() * w, r() * h, 12 + r() * 20, 5); }
    g.fillStyle = C.houseCream; g.fillRect(0, h * 0.02, w, h * 0.04); g.fillRect(0, h * 0.5, w, h * 0.03); g.fillStyle = C.houseTerra; g.fillRect(0, h * 0.06, w, 4); g.fillRect(0, h * 0.53, w, 4);
  }, 'facadeHouse');
  A.houseWin = D(64, 128, (g, w, h) => { g.fillStyle = C.glassCh; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(130,150,160,0.2)'; g.fillRect(4, 4, w * 0.35, h - 8); g.fillStyle = '#efe6d0'; g.fillRect(0, 0, w, 5); g.fillRect(0, h - 5, w, 5); g.fillRect(0, 0, 5, h); g.fillRect(w - 5, 0, 5, h); g.fillRect(w / 2 - 2, 0, 4, h); g.fillRect(0, h * 0.35, w, 3); g.fillRect(0, h * 0.7, w, 3); }, 'houseWin');
  A.ochreWall = D(128, 128, (g, w, h) => { g.fillStyle = '#d6a56a'; g.fillRect(0, 0, w, h); speckle(g, w, h, 8361, 120, 0.05); g.strokeStyle = '#efe0c0'; g.lineWidth = 4; g.strokeRect(14, 22, w - 28, h - 40); }, 'ochreWall');

  // ------------------------------------------------------------------------------------------ S-189 and its pier
  A.sail = D(256, 128, (g, w, h) => {              // the numerals С189: white block letters with a black shadow (tile = 4.2 x 2.1 m)
    g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${h * 0.95}px ${F.sans}`;
    g.fillStyle = '#17191a'; g.fillText('С189', w / 2 + 5, h / 2 + 6); g.fillStyle = '#f4f4f0'; g.fillText('С189', w / 2, h / 2);
  }, 'sail', [1, 1]);
  A.banner = D(512, 96, (g, w, h) => {              // the gangway banner: plain white, black text (the saltire emblem of the real banner is left out)
    g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, w, h); g.fillStyle = '#1c1d1e'; g.textAlign = 'center'; g.textBaseline = 'middle';
    tex.fitText(g, 'МУЗЕЙ ПОДВОДНАЯ ЛОДКА С189', w / 2, h * 0.52, w * 0.92, h * 0.5, F.sans, 800);
  }, 'banner', [1, 1]);
  A.fender = D(256, 64, (g, w, h) => {              // the river face of the pontoon: white concrete panels between red-brown steel fender posts every 3 m (tile 6 m)
    g.fillStyle = C.fenderWhite; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) { g.fillStyle = C.fenderRed; g.fillRect(i * w / 2 - 5, 0, 10, h); g.fillStyle = 'rgba(60,20,14,0.5)'; g.fillRect(i * w / 2 + 5, 0, 2, h); }
    g.fillStyle = 'rgba(90,90,84,0.35)'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4);
    speckle(g, w, h, 8371, 120, 0.1);
  }, 'fender');
  A.concrete = D(256, 256, (g, w, h) => { g.fillStyle = C.concrete; g.fillRect(0, 0, w, h); speckle(g, w, h, 8381, 600, 0.07); g.fillStyle = 'rgba(60,60,58,0.4)'; g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h); }, 'concrete');
  A.hullGrey = D(128, 128, (g, w, h) => { g.fillStyle = C.hull; g.fillRect(0, 0, w, h); const r = R(8391); for (let i = 0; i < 24; i++) { g.fillStyle = r() < 0.5 ? 'rgba(190,196,200,0.14)' : 'rgba(110,120,128,0.12)'; g.fillRect(r() * w, 0, 6 + r() * 16, h); } }, 'hullGrey');
  /** the plating of the sail: light grey steel with a horizontal weld seam every 1 m and a vertical one every 1.5 m (tile 3 x 3 m), a few rivet dots; the real sail (d04) is a seamed plate box, not one flat colour */
  A.sailGrey = D(256, 256, (g, w, h) => {
    g.fillStyle = C.hull; g.fillRect(0, 0, w, h); const r = R(8401);
    for (let i = 0; i < 16; i++) { g.fillStyle = r() < 0.5 ? 'rgba(200,206,210,0.12)' : 'rgba(110,120,128,0.10)'; g.fillRect(r() * w, 0, 5 + r() * 14, h); }
    for (let k = 0; k < 3; k++) { const y = k * h / 3; g.fillStyle = 'rgba(70,78,86,0.55)'; g.fillRect(0, y, w, 3); g.fillStyle = 'rgba(225,230,233,0.35)'; g.fillRect(0, y + 3, w, 2); }
    for (let k = 0; k < 2; k++) { const x = k * w / 2; g.fillStyle = 'rgba(70,78,86,0.45)'; g.fillRect(x, 0, 2, h); g.fillStyle = 'rgba(225,230,233,0.3)'; g.fillRect(x + 2, 0, 2, h); }
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(80,88,95,0.5)'; g.fillRect(r() * w, r() * h, 2, 2); }
  }, 'sailGrey');
  A.slots = D(128, 32, (g, w, h) => { g.fillStyle = C.hull; g.fillRect(0, 0, w, h); g.fillStyle = '#1e2224'; for (let i = 0; i < 3; i++) g.fillRect(8 + i * 40, 10, 26, 7); }, 'slots');
  return A;
}
