// landmarksSredny/artA.js - canvas paintings of the tram depot, the admin blocks 79A / 79B and the shared iron fences (docs/research/sredny.md sections 3.2 - 3.5; photos refs/sredny 59 61 72 73 79, n03 n04 n06 n17 n19).
//   brick      red facing brick (0.25 x 0.065 m + 1 cm mortar, tile 2.0 x 2.0 m), rose-brown `#b05c4b`, speckled; brickDark = the darker infill between the corner pylons
//   gate       a pair of timber gate leaves 3.35 x 5.3 m: vertical boards `#7d8da6`, rails at 1.1 / 3.2 m, a V brace on each leaf, two glazed slits (the built leaves, photo 56)
//   plates     the atlas of the 24 white enamel number plates 0.6 x 0.45 m (black digits 1 .. 24, 6 x 4 cells)
//   winBig     the arched steel window of a shed end 7.0 x 3.3 m: 9 x 5 panes
//   sideWin    the two-light steel window of the long walls 1.2 x 1.8 m
//   ochre / ochreRust  the plaster of the admin blocks (smooth, and with the horizontal rustication grooves every 0.5 m of the ground floor); win3 = the white 3-pane window 1.3 x 2.1 m
//   roofMetal  dark grey-brown standing-seam sheet; roofGrey the hipped grey sheet of the admin blocks
//   fenceBlack the black spear fence with the festoon arch between the pickets (Brush plot, photo 79), tile 4.1 x 2.0 m;  fenceSlate the slate-blue fence with spear heads and rings (Geological Committee, photos 40-42), tile 3.4 x 2.0 m
// Every key starts with 'lmsredn-' (the texture cache is scene-wide).
const TAU = Math.PI * 2;

export function makeArtA(ctx) {
  const tex = ctx.tex, A = {}, F = tex.FONTS;
  const D = (w, h, fn, key, repeat = [1, 1], o = {}) => tex.draw(w, h, fn, { key: 'lmsredn-' + key, repeat, ...o });
  const R = (seed) => ctx.rng(seed);
  const speckle = (g, w, h, seed, n, a = 0.1, s = 2) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '30,24,20'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * s, 1 + r() * s * 0.8); } };

  // ------------------------------------------------------------------------------------------ brick: 2 x 2 m, 8 bricks x 26 courses
  const brickTex = (key, base, mortar, seed) => D(512, 512, (g, w, h) => {
    const r = R(seed), cols = 8, rows = 26, bw = w / cols, bh = h / rows;
    g.fillStyle = mortar; g.fillRect(0, 0, w, h);
    for (let j = 0; j < rows; j++) for (let i = -1; i < cols; i++) {
      const x = i * bw + (j % 2) * bw / 2, v = 0.86 + r() * 0.26, dark = r() < 0.08 ? 0.82 : 1;
      g.fillStyle = `rgb(${base[0] * v * dark | 0},${base[1] * v * dark | 0},${base[2] * v * dark | 0})`; g.fillRect(x + 1.2, j * bh + 1, bw - 2.4, bh - 2);
    }
    speckle(g, w, h, seed + 1, 700, 0.07, 2.6);
  }, key);
  A.brick = brickTex('brick', [176, 92, 75], '#c9a99a', 8101);
  A.brickDark = brickTex('brickDark', [118, 62, 52], '#9a7e72', 8102);

  // ------------------------------------------------------------------------------------------ gate leaves 3.35 x 5.3 m (canvas 256 x 400: 76 px/m)
  A.gate = D(256, 404, (g, w, h) => {
    const ppm = w / 3.35, r = R(8111);
    g.fillStyle = '#7d8da6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 22; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '30,40,60'},${0.05 + r() * 0.07})`; g.fillRect(i * w / 22, 0, w / 22 - 1.5, h); g.fillStyle = 'rgba(40,52,76,0.38)'; g.fillRect(i * w / 22 - 0.5, 0, 1.5, h); }
    g.fillStyle = 'rgba(40,52,76,0.7)'; g.fillRect(w / 2 - 2, 0, 4, h);                                                  // the meeting stile
    const railY = [h - 1.1 * ppm, h - 3.2 * ppm];
    g.fillStyle = '#566683'; for (const y of railY) g.fillRect(0, y - 5, w, 10);
    g.strokeStyle = '#566683'; g.lineWidth = 7;                                                                          // the V brace of each leaf
    for (const [x0, x1] of [[0, w / 2], [w / 2, w]]) { g.beginPath(); g.moveTo(x0 + 5, railY[1]); g.lineTo((x0 + x1) / 2, railY[0]); g.lineTo(x1 - 5, railY[1]); g.stroke(); }
    g.fillStyle = '#47566f'; g.fillRect(0, 0, 5, h); g.fillRect(w - 5, 0, 5, h);
    for (const cx of [w / 4, 3 * w / 4]) { g.fillStyle = '#1f2a3a'; g.fillRect(cx - 0.18 * ppm, h - 4.9 * ppm, 0.35 * ppm, 1.8 * ppm); g.fillStyle = '#a8c0d4'; g.fillRect(cx - 0.12 * ppm, h - 4.85 * ppm, 0.24 * ppm, 1.7 * ppm); }
    speckle(g, w, h, 8112, 260, 0.08);
  }, 'gate');
  // ------------------------------------------------------------------------------------------ number plates 24 cells (6 x 4), 64 x 48 px each
  A.plates = D(384, 192, (g, w, h) => {
    g.fillStyle = '#f2f0e8'; g.fillRect(0, 0, w, h);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let n = 1; n <= 24; n++) {
      const cx = ((n - 1) % 6) * 64, cy = Math.floor((n - 1) / 6) * 48;
      g.strokeStyle = '#8d8a82'; g.lineWidth = 2; g.strokeRect(cx + 2, cy + 2, 60, 44);
      g.fillStyle = '#1c1c1c'; g.font = `700 ${n > 9 ? 30 : 36}px ${F.sans}`; g.fillText(String(n), cx + 32, cy + 26);
    }
  }, 'plates');
  // ------------------------------------------------------------------------------------------ the big arched window of a shed end (7.0 x 3.3 m, 9 x 5 panes)
  A.winBig = D(512, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#9dbbd2'); gr.addColorStop(1, '#6a8ca6'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.moveTo(0, h); g.lineTo(w * 0.35, 0); g.lineTo(w * 0.5, 0); g.lineTo(w * 0.15, h); g.closePath(); g.fill();
    g.fillStyle = '#2c3338';
    for (let i = 0; i <= 9; i++) g.fillRect(i * w / 9 - 2.5, 0, 5, h);
    for (let j = 0; j <= 5; j++) g.fillRect(0, j * h / 5 - 2.5, w, 5);
  }, 'winBig');
  // ------------------------------------------------------------------------------------------ two-light steel window 1.2 x 1.8 m
  A.sideWin = D(128, 192, (g, w, h) => {
    g.fillStyle = '#e2c98c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2f3a44'; g.fillRect(8, 8, w - 16, h - 16);
    const gr = g.createLinearGradient(0, 8, 0, h - 8); gr.addColorStop(0, '#7fa0b6'); gr.addColorStop(1, '#4d6678'); g.fillStyle = gr;
    for (const x of [11, w / 2 + 3]) for (const [y0, y1] of [[11, 66], [69, 124], [127, h - 11]]) g.fillRect(x, y0, w / 2 - 14, y1 - y0);
  }, 'sideWin');

  // ------------------------------------------------------------------------------------------ admin blocks: ochre plaster, rustication
  A.ochre = D(256, 256, (g, w, h) => {
    const r = R(8121); g.fillStyle = '#cf9f66'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,235,200' : '120,80,40'},${0.02 + r() * 0.035})`; g.beginPath(); g.ellipse(r() * w, r() * h, 8 + r() * 24, 4 + r() * 14, r() * 3, 0, TAU); g.fill(); }
    speckle(g, w, h, 8122, 300, 0.06);
  }, 'ochre');
  /** rusticated ground floor: grooves every 0.5 m (tile 2 x 2 m: 4 grooves), a darker tone */
  A.ochreRust = D(256, 256, (g, w, h) => {
    const r = R(8131); g.fillStyle = '#a6805a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(70,46,24,0.55)'; g.fillRect(0, i * h / 4, w, 4); g.fillStyle = 'rgba(255,225,180,0.14)'; g.fillRect(0, i * h / 4 + 4, w, 5); }
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,235,200' : '90,60,30'},0.06)`; g.fillRect(r() * w, r() * h, 20 + r() * 40, 10 + r() * 20); }
    speckle(g, w, h, 8132, 260, 0.06);
  }, 'ochreRust');
  /** the white 3-pane window with a transom, 1.3 x 2.1 m */
  A.win3 = D(128, 208, (g, w, h) => {
    g.fillStyle = '#efe6d4'; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#586674'); gr.addColorStop(1, '#2c353e'); g.fillStyle = gr;
    for (const x of [8, 46, 84]) { g.fillRect(x, 8, 36, 52); g.fillRect(x, 70, 36, 130); }
    g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(8, 8, 112, 20);
  }, 'win3');
  A.roofMetal = D(128, 128, (g, w, h) => {
    const r = R(8141); g.fillStyle = '#5f5b58'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { g.fillStyle = '#4a4745'; g.fillRect(i * 32, 0, 2, h); g.fillStyle = '#7d7a76'; g.fillRect(i * 32 + 2, 0, 1, h); }
    for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(125,122,118,0.25)'; g.fillRect(r() * w, r() * h, 10 + r() * 30, 8 + r() * 20); }
  }, 'roofMetal');
  A.roofGrey = D(128, 128, (g, w, h) => { g.fillStyle = '#8c9296'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { g.fillStyle = '#767c80'; g.fillRect(i * 32, 0, 2, h); g.fillStyle = '#a2a8ac'; g.fillRect(i * 32 + 2, 0, 1, h); } speckle(g, w, h, 8151, 60, 0.07); }, 'roofGrey');

  // ------------------------------------------------------------------------------------------ iron fences (alpha cut-out panels, double sided)
  /** black spear fence, panel 4.1 x 2.0 m: pickets every 0.13 m with flat spear tips, a bottom and a mid rail with a festoon arch between pickets every 0.65 m; the posts are real geometry */
  A.fenceBlack = D(1024, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const ppx = w / 4.1, ppy = h / 2.0, n = Math.round(4.1 / 0.13);
    g.fillStyle = '#1b1d20';
    for (let i = 0; i <= n; i++) { const x = i * w / n; g.fillRect(x - 1.8, 0.25 * ppy, 3.6, 1.75 * ppy); g.beginPath(); g.moveTo(x - 4, 0.27 * ppy); g.lineTo(x, 0); g.lineTo(x + 4, 0.27 * ppy); g.closePath(); g.fill(); }
    g.fillRect(0, 1.82 * ppy, w, 5); g.fillRect(0, 0.62 * ppy, w, 5); g.fillRect(0, 0.3 * ppy, w, 4);
    g.strokeStyle = '#1b1d20'; g.lineWidth = 3.2;
    const arc = 0.65 * ppx;
    for (let x = 0; x < w; x += arc) { g.beginPath(); g.moveTo(x, 0.66 * ppy); g.quadraticCurveTo(x + arc / 2, 0.66 * ppy + 0.5 * ppy, x + arc, 0.66 * ppy); g.stroke(); }
  }, 'fenceBlack');
  /** slate-blue fence of the Geological Committee, panel 3.4 x 2.0 m: round pickets every 0.13 m with spear heads, a top rail, a mid rail carrying rings d 0.28 m (one per picket pair), a low rail */
  A.fenceSlate = D(1024, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const ppx = w / 3.4, ppy = h / 2.0, n = Math.round(3.4 / 0.13);
    g.fillStyle = '#444b4f'; g.strokeStyle = '#444b4f';
    for (let i = 0; i <= n; i++) { const x = i * w / n; g.fillRect(x - 1.8, 0.32 * ppy, 3.6, 1.68 * ppy); g.beginPath(); g.moveTo(x - 4.5, 0.36 * ppy); g.lineTo(x, 0); g.lineTo(x + 4.5, 0.36 * ppy); g.closePath(); g.fill(); }
    g.fillRect(0, 0.38 * ppy, w, 5); g.fillRect(0, 0.98 * ppy, w, 5); g.fillRect(0, 1.82 * ppy, w, 5);
    g.lineWidth = 3;
    for (let i = 0; i < n; i += 2) { const x = (i + 1) * w / n; g.beginPath(); g.arc(x, 0.98 * ppy, 0.14 * ppx, 0, TAU); g.stroke(); }
  }, 'fenceSlate');
  /** galvanised lattice (Dom Evangelia, 2.2 m) panel 4.0 x 2.2 m: verticals every 0.1 m and three rails */
  A.fenceLattice = D(512, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#8a8f93';
    const n = 40; for (let i = 0; i <= n; i++) g.fillRect(i * w / n - 1.5, 0, 3, h);
    for (const y of [0.04, 0.5, 0.96]) g.fillRect(0, y * h - 3, w, 6);
  }, 'fenceLattice');
  // ------------------------------------------------------------------------------------------ plaques of the admin blocks (plain text, no emblem)
  /** 79A: a white marble plate 0.55 x 0.38 m, incised black letters (the text of OSM n7110900478 / photo n08) */
  A.plaqueA = D(275, 190, (g, w, h) => {
    g.fillStyle = '#ecebe6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c8c6bc'; g.lineWidth = 4; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = '#b9923c'; for (const [x, y] of [[14, 14], [w - 14, 14], [14, h - 14], [w - 14, h - 14]]) { g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#2a2a2a';
    const L = [['ПОДВИГУ ТРАМВАЙЩИКОВ', 17], ['БЛОКАДНОГО ЛЕНИНГРАДА', 17], ['15го АПРЕЛЯ 1942 ГОДА', 15], ['ИЗ ЭТОГО ПАРКА', 15], ['ВЫШЛИ НА ЛИНИЮ', 15], ['ПЕРВЫЕ', 15], ['ТРАМВАЙНЫЕ ПОЕЗДА', 15]];
    L.forEach(([t, s], i) => { let sz = s; g.font = `600 ${sz}px ${F.serif}`; while (sz > 8 && g.measureText(t).width > w - 40) { sz -= 0.5; g.font = `600 ${sz}px ${F.serif}`; } g.fillText(t, w / 2, 24 + i * 23); });
  }, 'plaqueA');
  /** 79B: a dark grey metal heritage plaque 0.6 x 0.9 m with raised pale letters */
  A.plaqueB = D(240, 360, (g, w, h) => {
    g.fillStyle = '#585d62'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a9096'; g.lineWidth = 3; g.strokeRect(6, 6, w - 12, h - 12);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d6dadc';
    const L = [['Памятник истории и культуры', 12], ['регионального значения', 12], ['', 0], ['Василеостровский вагонный парк', 12], ['Санкт-Петербургского', 12], ['электрического трамвая', 12], ['(Василеостровский', 12], ['трамвайный парк)', 12], ['Административный дом', 12], ['1906-1907 гг.', 12], ['Гражданские инженеры', 11], ['Ф.О. Тейхман, Л.Б. Горенберг', 11], ['перестроен в 1913-1915 гг.', 11], ['гражданский инженер', 11], ['А.А. Ламагин', 12], ['', 0], ['Охраняется государством', 12]];
    let y = 26; for (const [t, s] of L) { if (!t) { y += 12; continue; } let sz = s; g.font = `500 ${sz}px ${F.sans}`; while (sz > 7 && g.measureText(t).width > w - 24) { sz -= 0.5; g.font = `500 ${sz}px ${F.sans}`; } g.fillText(t, w / 2, y); y += sz + 7; }
  }, 'plaqueB');
  /** the gold shaded number 1031 of the monument car (0.22 m letters, alpha, 1.1 x 0.3 m) */
  A.num1031 = D(352, 96, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 74px ${F.serif}`;
    g.fillStyle = '#3a2a10'; g.fillText('1031', w / 2 + 3, h / 2 + 4); g.fillStyle = '#d8b04a'; g.fillText('1031', w / 2, h / 2);
  }, 'num1031');
  /** the incised name on the white pedestal of the Leonov bust (0.6 x 0.22 m) */
  A.leonovPlate = D(300, 110, (g, w, h) => {
    g.fillStyle = '#ece8de'; g.fillRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1c1c1c'; g.font = `600 44px ${F.serif}`; g.fillText('ЛЕОНОВ А.П.', w / 2, h / 2 + 2);
  }, 'leonovPlate');
  /** the destination board on the roof of the monument car: white, black old-orthography letters (a ring with the digit 4, ГЛАВНЫЙ ШТАБЪ., a line that starts with 8) */
  A.brushBoard = D(320, 80, (g, w, h) => {
    g.fillStyle = '#f2efe6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1c1c1c'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
    g.beginPath(); g.arc(34, 40, 22, 0, TAU); g.stroke(); g.fillStyle = '#1c1c1c'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 30px ${F.serif}`; g.fillText('4', 34, 42);
    g.textAlign = 'left'; g.font = `700 26px ${F.serif}`; g.fillText('ГЛАВНЫЙ ШТАБЪ.', 68, 24); g.font = `600 22px ${F.serif}`; g.fillText('8-й ЛИНІИ В. О.', 68, 56);
  }, 'brushBoard');
  void speckle;
  return A;
}
