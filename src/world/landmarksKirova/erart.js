// landmarksKirova/erart.js - the canvas paintings of the ERARTA museum facade (docs/research/kirova.md section 11; photos refs/kirova er01 .. er06, er03, er04, er05).
// Everything that is a REPEATING surface is a small tile at 100-128 px per metre (the user judges the facade at 1-3 m); windows, trim, columns, balustrades and the portal are real geometry (erfront.js ...).
//   eRust       warm yellow rendered base, horizontal rustication bands of 0.5 m (two tones), tile 1.8 x 1.0 m, v = 0 at the top of the granite plinth (the caller shifts y)
//   eAshlar     small beige ashlar blocks 0.7 x 0.35 m (the wall behind the columns and the wing upper floors), tile 2.8 x 1.4 m
//   eGranite    pink-red polished granite, courses of 0.6 m, blocks 1.2 m, tile 2.4 x 1.2 m
//   eGlA..eGlD  glass of a window pane (0..1 uv): sky reflection over a dark room, a lit ceiling, pale curtains, a basement grating
//   ePanel      white aluminium-composite panel with 1 cm joints (tile 1.2 x 1.2 m, drawn so that one tile is one panel)
//   eSignTex    sign band of the portal (14.6 x 1.83 m): ERARTA in wine-red thin capitals + the museum line in dark grey (cut-out)
//   eFriezeTex  attic frieze line, dark brown capitals (17 x 1.0 m, cut-out)
//   eDoorOrn    ornament of one door group: Art Nouveau circles and arcs in black (cut-out, 1.9 x 3.9 m)
//   eLobby*     interior of the lit foyer seen through the door glass
// The stroke font of the wordmark (GLYPHS) is shared with the 3D roof letters (erlet.js). Keys start with 'lmKir-e'.
const TAU = Math.PI * 2;
export const EC = {
  rustA: '#ecd8ac', rustB: '#dfc99d', rustLine: 'rgba(122,92,48,0.55)', ashlar: '#e3d0a9', ashlarJoint: 'rgba(150,120,78,0.55)',
  granite: '#7a524b', graniteDark: '#5a3a36', white: '#f3f1ea', yellow: '#e7d3a2', frieze: '#e9d4a2', frame: '#3b3029', red: '#9d3445', roofRed: '#d9403c',
};

/** stroke font of the wordmark: polylines in a unit box (x 0..width, y 0..1, y up) */
export const GLYPHS = {
  E: { w: 0.86, p: [[[0.86, 1], [0, 1], [0, 0], [0.86, 0]], [[0, 0.5], [0.8, 0.5]]] },
  R: { w: 0.9, p: [[[0, 0], [0, 1], [0.62, 1], [0.8, 0.96], [0.9, 0.84], [0.9, 0.68], [0.8, 0.56], [0.62, 0.5], [0, 0.5]], [[0.46, 0.5], [0.98, 0]]] },
  A: { w: 1.0, p: [[[0, 0], [0.5, 1], [1, 0]], [[0.2, 0.34], [0.8, 0.34]]] },
  T: { w: 0.9, p: [[[0, 1], [0.9, 1]], [[0.45, 1], [0.45, 0]]] },
};
// the real wordmark is narrower than the first stroke font (portal: 3.4 x 0.6 m, roof: 13.4 x 2.4 m, erarta-detail 1.4): every glyph is squeezed to 80 % and the gap closed to 0.22
const XS = 0.8;
for (const gl of Object.values(GLYPHS)) { gl.w *= XS; for (const pl of gl.p) for (const pt of pl) pt[0] *= XS; }
export const WORD = 'ERARTA', GAP = 0.22;
/** layout of the word: [{ ch, x0 }] and the total width in unit-height units */
export function wordLayout() {
  let x = 0; const out = [];
  for (const ch of WORD) { out.push({ ch, x0: x }); x += GLYPHS[ch].w + GAP; }
  return { items: out, width: x - GAP };
}

export function makeErArt(ctx) {
  const tex = ctx.tex, A = {}, C = EC, F = tex.FONTS;
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmKir-' + key, repeat });
  const R = (seed) => ctx.rng(seed);
  const speck = (g, w, h, seed, n, a = 0.08) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,250' : '60,48,34'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 1.6); } };
  const rgbOf = (hex) => hex.match(/\w\w/g).map((h) => parseInt(h, 16));
  const shade = (hex, k) => { const [r, gg, b] = rgbOf(hex); return `rgb(${Math.min(255, r * k) | 0},${Math.min(255, gg * k) | 0},${Math.min(255, b * k) | 0})`; };

  // ---------------------------------------------------------------- rusticated base: 1.8 x 1.0 m at 128 px/m, two bands of 0.5 m (v 0..0.5 lower band = canvas lower half)
  A.eRust = D(230, 128, (g, w, h) => {
    const r = R(9101);
    for (let j = 0; j < 2; j++) {
      const y1 = h - j * 64, y0 = y1 - 64;                                      // canvas rows of band j counted from the bottom
      g.fillStyle = j === 0 ? C.rustA : C.rustB; g.fillRect(0, y0, w, 64);
      for (let y = y0 + 2; y < y1 - 5; y += 3) { g.fillStyle = `rgba(${j ? '110,84,44' : '255,246,220'},${0.05 + r() * 0.04})`; g.fillRect(0, y, w, 1); }     // fine ribbing
      g.fillStyle = C.rustLine; g.fillRect(0, y1 - 3, w, 3);                    // the groove under the band
      g.fillStyle = 'rgba(255,248,226,0.35)'; g.fillRect(0, y0, w, 2);          // the lit edge on top
    }
    speck(g, w, h, 9102, 500, 0.05);
  }, 'eRust');

  // ---------------------------------------------------------------- small ashlar blocks 0.7 x 0.35 m, running bond, tile 2.8 x 1.4 m at 100 px/m
  A.eAshlar = D(280, 140, (g, w, h) => {
    const r = R(9111), bw = 70, bh = 35;
    for (let j = 0; j < 4; j++) for (let i = -1; i < 5; i++) {
      const x = i * bw + (j % 2) * bw / 2, y = h - (j + 1) * bh, v = 0.965 + r() * 0.07;
      g.fillStyle = shade(C.ashlar, v); g.fillRect(x, y, bw, bh);
    }
    g.fillStyle = C.ashlarJoint;
    for (let j = 0; j <= 4; j++) g.fillRect(0, h - j * bh - 1, w, 2);
    for (let j = 0; j < 4; j++) for (let i = -1; i < 5; i++) { const x = i * bw + (j % 2) * bw / 2; g.fillRect(x - 1, h - (j + 1) * bh, 2, bh); }
    speck(g, w, h, 9112, 380, 0.05);
  }, 'eAshlar');

  // ---------------------------------------------------------------- pink granite: courses of 0.6 m, blocks 1.2 m, tile 2.4 x 1.2 m at 100 px/m
  A.eGranite = D(240, 120, (g, w, h) => {
    const r = R(9121);
    for (let j = 0; j < 2; j++) for (let i = -1; i < 3; i++) {
      const x = i * 120 + (j % 2) * 60, y = h - (j + 1) * 60, v = 0.93 + r() * 0.14;
      g.fillStyle = shade(C.granite, v); g.fillRect(x, y, 120, 60);
      for (let k = 0; k < 3; k++) { g.fillStyle = r() < 0.5 ? 'rgba(255,214,200,0.08)' : 'rgba(70,30,30,0.09)'; g.beginPath(); g.moveTo(x + r() * 120, y + r() * 60); g.lineTo(x + r() * 120, y + r() * 60); g.lineTo(x + r() * 120, y + r() * 60); g.fill(); }
    }
    for (let i = 0; i < 1200; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,225,215,0.22)' : 'rgba(60,24,24,0.26)'; g.fillRect(r() * w, r() * h, 1 + r() * 1.8, 1 + r() * 1.4); }
    g.fillStyle = 'rgba(54,22,22,0.55)'; for (let j = 0; j <= 2; j++) g.fillRect(0, h - j * 60 - 1, w, 2);
    for (let j = 0; j < 2; j++) for (let i = -1; i < 3; i++) g.fillRect(i * 120 + (j % 2) * 60 - 1, h - (j + 1) * 60, 2, 60);
  }, 'eGranite');

  // ---------------------------------------------------------------- window glass (uv 0..1 over one pane group)
  const glass = (key, kind) => D(64, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    if (kind === 'D') { gr.addColorStop(0, '#46535a'); gr.addColorStop(1, '#161b1e'); } else { gr.addColorStop(0, '#93a8b6'); gr.addColorStop(0.45, '#566a76'); gr.addColorStop(1, '#222a2f'); }
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    if (kind === 'B') {                                                            // a lit room: two ceiling lamps and a warm wall
      const lg = g.createLinearGradient(0, h * 0.2, 0, h); lg.addColorStop(0, 'rgba(235,205,150,0.55)'); lg.addColorStop(1, 'rgba(235,205,150,0.12)'); g.fillStyle = lg; g.fillRect(0, h * 0.2, w, h * 0.8);
      for (const x of [0.28, 0.72]) { const rg = g.createRadialGradient(w * x, h * 0.3, 0, w * x, h * 0.3, w * 0.22); rg.addColorStop(0, 'rgba(255,248,220,0.95)'); rg.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = rg; g.fillRect(0, 0, w, h * 0.6); }
    } else if (kind === 'C') {                                                     // pale curtains
      g.fillStyle = 'rgba(236,228,208,0.82)'; g.fillRect(0, h * 0.34, w, h * 0.66);
      g.fillStyle = 'rgba(160,150,128,0.35)'; for (let x = 4; x < w; x += 9) g.fillRect(x, h * 0.34, 2, h * 0.66);
    } else if (kind === 'D') {                                                     // the basement window: a grating
      g.fillStyle = 'rgba(30,30,30,0.9)'; for (let x = 6; x < w; x += 12) g.fillRect(x, 0, 3, h);
    }
    g.fillStyle = 'rgba(255,255,255,0.09)'; g.beginPath(); g.moveTo(0, h * 0.5); g.lineTo(w * 0.55, 0); g.lineTo(w * 0.8, 0); g.lineTo(0, h * 0.8); g.fill();     // a soft diagonal reflection
  }, key);
  A.eGlA = glass('eGlA', 'A'); A.eGlB = glass('eGlB', 'B'); A.eGlC = glass('eGlC', 'C'); A.eGlD = glass('eGlD', 'D');

  // ---------------------------------------------------------------- white panel (one tile = one panel, joints on the left and bottom edge)
  A.ePanel = D(128, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#f6f5f0'); gr.addColorStop(1, '#ebeae4'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(110,108,100,0.55)'; g.fillRect(0, 0, 2, h); g.fillRect(0, h - 2, w, 2);
    speck(g, w, h, 9131, 60, 0.03);
  }, 'ePanel');

  // ---------------------------------------------------------------- the wordmark on canvas: the stroke font, thin wine-red capitals
  const drawWord = (g, x, yBase, hgt, lw, col) => {
    const lay = wordLayout(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const { ch, x0 } of lay.items) for (const pl of GLYPHS[ch].p) { g.beginPath(); pl.forEach(([u, v], i) => { const px = x + (x0 + u) * hgt, py = yBase - v * hgt; if (i) g.lineTo(px, py); else g.moveTo(px, py); }); g.stroke(); }
    return lay.width * hgt;
  };
  // sign band: 14.6 x 1.83 m at 140 px/m = 2044 x 256
  A.eSignTex = D(2048, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const hg = 0.6 * 140, lay = wordLayout(), ww = lay.width * hg;
    drawWord(g, (w - ww) / 2, h * 0.36 + hg / 2 - 4, hg, 8, C.red);
    g.fillStyle = '#3a3d44'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${0.27 * 140}px ${F.sans}`;
    const t = 'МУЗЕЙ И ГАЛЕРЕИ СОВРЕМЕННОГО ИСКУССТВА'; let x = w * 0.09; const step = (w * 0.82) / t.length; for (const ch of t) { g.fillText(ch, x + step / 2, h * 0.78); x += step; }
  }, 'eSignTex');
  // attic frieze: 21 x 1.0 m at 97 px/m (2048 x 100): letters 0.5 m high
  A.eFriezeTex = D(2048, 100, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#6a5846'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${0.5 * 97}px ${F.sans}`;
    const t = 'МУЗЕЙ И ГАЛЕРЕИ СОВРЕМЕННОГО ИСКУССТВА'; let x = w * 0.02; const step = (w * 0.96) / t.length; for (const ch of t) { g.fillText(ch, x + step / 2, h / 2 + 2); x += step; }
  }, 'eFriezeTex');
  // door ornament (photo er04): the side groups carry one big ring across both leaves with a partial inner arc, the centre group only the arched transom bar; 1.9 x 3.9 m at 64 px/m
  const orn = (key, ring) => D(128, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#121416'; g.lineCap = 'round'; g.lineWidth = 3.2;
    g.beginPath(); g.moveTo(w * 0.03, h * 0.19); g.quadraticCurveTo(w / 2, h * 0.015, w * 0.97, h * 0.19); g.stroke();                                                          // the arched transom bar
    if (ring) {
      g.beginPath(); g.arc(w * 0.5, h * 0.6, w * 0.42, 0, TAU); g.stroke();
      g.lineWidth = 2.4; g.beginPath(); g.arc(w * 0.5, h * 0.6, w * 0.3, 0.75 * Math.PI, 2.1 * Math.PI); g.stroke();
      g.beginPath(); g.moveTo(w * 0.08, h * 0.88); g.quadraticCurveTo(w * 0.3, h * 0.7, w * 0.5, h * 0.78); g.stroke();
    }
  }, key);
  A.eDoorOrn = orn('eDoorOrn', true); A.eDoorOrnC = orn('eDoorOrnC', false);
  // lobby: warm cream wall with panel joints and a floor of dark stone, ceiling lights are plain emissive boxes
  A.eLobbyWall = D(128, 128, (g, w, h) => { g.fillStyle = '#f2dcae'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(170,130,80,0.35)'; g.fillRect(0, 0, 2, h); g.fillRect(0, 0, w, 2); speck(g, w, h, 9141, 80, 0.05); }, 'eLobbyWall');
  A.eLobbyFloor = D(128, 128, (g, w, h) => { g.fillStyle = '#4a4440'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(200,190,170,0.18)'; g.fillRect(0, 0, 2, h); g.fillRect(0, 0, w, 2); g.fillRect(64, 0, 1, h); g.fillRect(0, 64, w, 1); speck(g, w, h, 9142, 160, 0.09); }, 'eLobbyFloor');
  // the forecourt paving (erarta-detail 2.5): pale grey-beige concrete slabs 1.0 x 1.0 m with fine joints, tile 2 x 2 m at 128 px/m (a decal tile)
  A.ePave = D(256, 256, (g, w, h) => {
    const r = R(9161);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const v = 0.95 + r() * 0.1; g.fillStyle = shade('#bdb6aa', v); g.fillRect(i * 128, j * 128, 128, 128); }
    speck(g, w, h, 9162, 700, 0.07);
    g.fillStyle = 'rgba(96,90,82,0.55)'; g.fillRect(0, 0, w, 2); g.fillRect(0, 128 - 1, w, 2); g.fillRect(0, 0, 2, h); g.fillRect(128 - 1, 0, 2, h);
  }, 'ePave');
  // the red roof sheet: standing seams every 0.5 m (tile 2 x 2 m at 64 px/m)
  A.eRoofSheet = D(128, 128, (g, w, h) => { g.fillStyle = '#b6453d'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(80,22,18,0.4)'; g.fillRect(x, 0, 2, h); g.fillStyle = 'rgba(255,190,170,0.16)'; g.fillRect(x + 2, 0, 2, h); } speck(g, w, h, 9151, 120, 0.06); }, 'eRoofSheet');
  return A;
}
