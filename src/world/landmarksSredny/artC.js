// landmarksSredny/artC.js - canvas paintings of the Frank mansion, the Dom Evangelia, the Chernikhov tower + rope shop and the Gorny Institut pavilions (docs/research/sredny.md sections 5 - 8; photos refs/sredny 90 91 94-108 111-118 128-130).
//   Frank      creamPlaster `#ece6d6`, salmonBrick plinth `#c8683f`, boards (the timber-clad gable: white boards 0.18 m), fretwork (red-brown cross-pattern balustrade panel), winFrank (maroon frames, 3 panes + a transom),
//              roofMaroon (standing seam `#7a3d38`)
//   Evangelia  stucco (ochre `#c8a66b` with darker streaks and bare-brick patches), winEv (dark brown frames, ~1/3 of the panes broken), roofRust (rusty sheet `#7a5040`)
//   Tower      towerPlaster (warm cream-ochre `#dcc59a`), slit (dark steel + glass slit with transoms, 0.9 x 10.5 m), ribbon (the 1 m glazing ribbon of the tank: mullions every 1.1 m), hallWin (steel-framed window groups)
//   Gorny      louvre (copper slats `#9c4a2c`, pitch 0.12 m), granBand (banded light granite plinth), mirror (faceted mirror steel), nameBand (dark glass with the orange letters ГОРНЫЙ ИНСТИТУТ), blueM (the plain blue M ring),
//              signPlate (grey plate «Горный институт / Gorny Institut» with an orange line badge), liftPlate (grey oval «Лифт № 3 / Elevator № 3»), glassPav (glass wall of the pavilions)
//   Brush      tramBody lettering of the monument car (the number 1031, the roof board)
// Every key starts with 'lmsredn-'.
const TAU = Math.PI * 2;

export function makeArtC(ctx) {
  const tex = ctx.tex, A = {}, F = tex.FONTS;
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmsredn-' + key, repeat });
  const R = (seed) => ctx.rng(seed);
  const speckle = (g, w, h, seed, n, a = 0.1, s = 2) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,30'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * s, 1 + r() * s * 0.8); } };

  // ------------------------------------------------------------------------------------------ Frank mansion
  A.creamPlaster = D(256, 256, (g, w, h) => { const r = R(8301); g.fillStyle = '#f0e6cc'; g.fillRect(0, 0, w, h); for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,250' : '170,160,140'},${0.05 + r() * 0.06})`; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 30, 5 + r() * 14, r() * 3, 0, TAU); g.fill(); } speckle(g, w, h, 8302, 200, 0.05); }, 'creamPlaster');
  A.salmonBrick = D(256, 256, (g, w, h) => {
    const r = R(8311); g.fillStyle = '#d9a48a'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 13; j++) for (let i = -1; i < 4; i++) { const x = i * 64 + (j % 2) * 32, v = 0.88 + r() * 0.24; g.fillStyle = `rgb(${200 * v | 0},${104 * v | 0},${63 * v | 0})`; g.fillRect(x + 1, j * 19.7 + 1, 62, 17.5); }
  }, 'salmonBrick');
  A.boards = D(256, 256, (g, w, h) => {
    const r = R(8321); g.fillStyle = '#e8e2d2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 12; i++) { const v = 0.94 + r() * 0.08; g.fillStyle = `rgb(${232 * v | 0},${226 * v | 0},${210 * v | 0})`; g.fillRect(i * w / 12 + 1, 0, w / 12 - 2, h); g.fillStyle = 'rgba(90,70,50,0.35)'; g.fillRect(i * w / 12 - 0.5, 0, 1.6, h); }
    speckle(g, w, h, 8322, 120, 0.05);
  }, 'boards');
  /** fretwork balustrade panel 1.5 x 0.9 m: five panels with a cross cut-out, old-rose on dark */
  A.fretwork = D(300, 180, (g, w, h) => {
    g.fillStyle = '#92514e'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5; i++) { const cx = (i + 0.5) * w / 5, cy = h / 2; g.fillStyle = '#e8dccc'; g.fillRect(cx - 6, cy - 34, 12, 68); g.fillRect(cx - 34, cy - 6, 68, 12); g.fillStyle = '#7c3a30'; g.fillRect(i * w / 5, 0, 2, h); }
    g.fillStyle = '#7c3a30'; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8);
  }, 'fretwork');
  A.winFrank = D(128, 256, (g, w, h) => {
    g.fillStyle = '#7c3a30'; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#4a5a66'); gr.addColorStop(1, '#262f36'); g.fillStyle = gr;
    for (const x of [9, 67]) { g.fillRect(x, 9, 52, 66); g.fillRect(x, 85, 52, h - 94); }
    g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(9, 9, 110, 22);
  }, 'winFrank');
  /** the portal door 3.0 x 3.2 m (canvas 300 x 320, 100 px/m; photos 95 96): varnished maroon-brown leaves with glazed upper panels and raised lower panels under a semicircular fanlight with radial muntins */
  A.doorFrank = D(300, 320, (g, w, h) => {
    const r = R(8391), FY = 150;
    g.fillStyle = '#5a2a20'; g.fillRect(0, 0, w, h);
    const fg = g.createLinearGradient(0, 0, w, FY); fg.addColorStop(0, '#6a8190'); fg.addColorStop(1, '#34495a'); g.fillStyle = fg; g.fillRect(6, 6, w - 12, FY - 6);
    g.strokeStyle = '#7a3a2c'; g.lineWidth = 5; for (let i = 1; i < 6; i++) { const a = Math.PI * i / 6; g.beginPath(); g.moveTo(w / 2, FY); g.lineTo(w / 2 + Math.cos(a) * 160, FY - Math.sin(a) * 160); g.stroke(); }
    g.beginPath(); g.arc(w / 2, FY, 70, Math.PI, 0); g.stroke();
    g.fillStyle = '#7a3a2c'; g.fillRect(0, FY - 2, w, 12);
    for (const x0 of [0, w / 2]) {
      const lw = w / 2, gr = g.createLinearGradient(x0, 0, x0 + lw, 0); gr.addColorStop(0, '#74352a'); gr.addColorStop(0.5, '#823c2f'); gr.addColorStop(1, '#6e3126');
      g.fillStyle = gr; g.fillRect(x0, FY + 10, lw, h - FY - 10);
      g.fillStyle = '#4e2018'; g.fillRect(x0 + 12, FY + 24, lw - 24, 120); g.fillStyle = '#34495a'; g.fillRect(x0 + 20, FY + 32, lw - 40, 104); g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(x0 + 24, FY + 36, 10, 96);
      g.fillStyle = '#4e2018'; g.fillRect(x0 + 12, FY + 160, lw - 24, 96); g.fillStyle = '#8a4234'; g.fillRect(x0 + 22, FY + 170, lw - 44, 76);
    }
    g.fillStyle = '#3a1a14'; g.fillRect(w / 2 - 2, FY + 10, 4, h - FY - 10);
    g.fillStyle = '#c8a850'; g.fillRect(w / 2 - 16, FY + 120, 5, 40); g.fillRect(w / 2 + 11, FY + 120, 5, 40);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(30,10,6,${0.05 + r() * 0.06})`; g.fillRect(r() * w, FY + 12 + r() * (h - FY - 12), 1, 8 + r() * 24); }
  }, 'doorFrank');
  A.roofMaroon = D(128, 128, (g, w, h) => { g.fillStyle = '#7a3d38'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5; i++) { g.fillStyle = '#5f2c28'; g.fillRect(i * 25.6, 0, 2, h); g.fillStyle = '#93524b'; g.fillRect(i * 25.6 + 2, 0, 1.5, h); } speckle(g, w, h, 8331, 70, 0.07); }, 'roofMaroon');

  // ------------------------------------------------------------------------------------------ Dom Evangelia (abandoned, cracked ochre stucco)
  A.stucco = D(256, 256, (g, w, h) => {
    const r = R(8341); g.fillStyle = '#c8a66b'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 50; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '169,134,80' : '230,205,150'},${0.12 + r() * 0.14})`; g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 26, 4 + r() * 18, r() * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 7; i++) { g.fillStyle = '#8e5a45'; const x = r() * w, y = r() * h; g.fillRect(x, y, 14 + r() * 26, 8 + r() * 14); g.fillStyle = '#6e4636'; for (let k = 0; k < 4; k++) g.fillRect(x, y + k * 4 + 1, 30, 1); }
    for (let i = 0; i < 6; i++) { const gr = g.createLinearGradient(0, 0, 0, h); const x = r() * w; gr.addColorStop(0, 'rgba(110,80,40,0.30)'); gr.addColorStop(1, 'rgba(110,80,40,0)'); g.fillStyle = gr; g.fillRect(x, 0, 3 + r() * 4, h * (0.4 + r() * 0.6)); }
    speckle(g, w, h, 8342, 300, 0.07);
  }, 'stucco');
  A.winEv = D(128, 192, (g, w, h) => {
    const r = R(8351); g.fillStyle = '#4a3b2f'; g.fillRect(0, 0, w, h);
    for (const [x, y, ww, hh] of [[8, 8, 52, 80], [68, 8, 52, 80], [8, 96, 52, 88], [68, 96, 52, 88]]) {
      const broken = r() < 0.4; g.fillStyle = broken ? '#1e1e1e' : (r() < 0.5 ? '#5c6e78' : '#44545e'); g.fillRect(x, y, ww, hh);
      if (!broken) { g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(x, y, ww, 18); } else { g.fillStyle = '#6b6258'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 14 + r() * 10, y); g.lineTo(x, y + 20); g.fill(); }
    }
  }, 'winEv');
  A.roofRust = D(128, 128, (g, w, h) => { const r = R(8361); g.fillStyle = '#7a5040'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5; i++) { g.fillStyle = '#5e3c30'; g.fillRect(i * 25.6, 0, 2, h); } for (let i = 0; i < 24; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '150,96,64' : '90,56,42'},0.3)`; g.fillRect(r() * w, r() * h, 8 + r() * 24, 6 + r() * 22); } }, 'roofRust');

  // ------------------------------------------------------------------------------------------ Chernikhov tower
  A.towerPlaster = D(256, 256, (g, w, h) => {
    const r = R(8371); g.fillStyle = '#dcc59a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,240,205' : '168,140,96'},${0.03 + r() * 0.04})`; g.beginPath(); g.ellipse(r() * w, r() * h, 8 + r() * 28, 5 + r() * 16, r() * 3, 0, TAU); g.fill(); }
    speckle(g, w, h, 8372, 200, 0.04);
  }, 'towerPlaster');
  /** tall slit 0.9 x 10.5 m (canvas 64 x 512): dark steel frame, glass `#36495a`, transoms every ~1.5 m */
  A.slit = D(64, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#46606f'); gr.addColorStop(1, '#2c3d4a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2d3236'; g.fillRect(0, 0, 4, h); g.fillRect(w - 4, 0, 4, h); g.fillRect(w / 2 - 1.5, 0, 3, h);
    for (let y = 0; y < h; y += h / 7) g.fillRect(0, y - 1.5, w, 3);
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(4, 0, 10, h);
  }, 'slit');
  /** the tank ribbon: tile 1.1 x 1.0 m (one mullion cell) */
  A.ribbon = D(110, 100, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5b7d92'); gr.addColorStop(1, '#2e4658'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2d3236'; g.fillRect(0, 0, 4, h); g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4);
    g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(8, 6, 40, 18);
  }, 'ribbon');
  /** a window group of the rope shop: 1.6 x 3.6 m (canvas 128 x 288): black frames, 2 columns x 6 rows */
  A.hallWin = D(128, 288, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#5f7f93'); gr.addColorStop(1, '#2f4658'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2d3236'; g.fillRect(0, 0, 5, h); g.fillRect(w - 5, 0, 5, h); g.fillRect(w / 2 - 2, 0, 4, h);
    for (let j = 0; j <= 6; j++) g.fillRect(0, j * h / 6 - 2, w, 4);
    g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(6, 6, 50, 40);
  }, 'hallWin');

  // ------------------------------------------------------------------------------------------ Gorny Institut pavilions
  /** copper louvre sheet, tile 1.0 x 0.96 m: 8 slats of pitch 0.12 m, sunlit lower edges */
  A.louvre = D(128, 128, (g, w, h) => {
    g.fillStyle = '#9c4a2c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) { g.fillStyle = '#c45f35'; g.fillRect(0, i * 16, w, 4); g.fillStyle = '#6e301a'; g.fillRect(0, i * 16 + 11, w, 5); }
  }, 'louvre');
  /** banded light granite plinth, tile 2.4 x 1.12 m: slabs 0.28 m high, every second one proud (a darker joint under it) */
  A.granBand = D(256, 128, (g, w, h) => {
    const r = R(8381); g.fillStyle = '#7c7573'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 4; j++) { const v = 0.96 + r() * 0.08; g.fillStyle = `rgb(${(j % 2 ? 168 : 178) * v | 0},${(j % 2 ? 158 : 168) * v | 0},${(j % 2 ? 157 : 167) * v | 0})`; g.fillRect(0, j * 32 + 2, w, 28); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, j * 32 + 2, w, 3); }
    speckle(g, w, h, 8382, 200, 0.07);
  }, 'granBand');
  A.mirror = D(128, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#9ea4a8'); gr.addColorStop(0.35, '#d6dadc'); gr.addColorStop(0.6, '#a9afb3'); gr.addColorStop(1, '#c4c9cc'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(40,50,60,0.18)'; g.fillRect(w * 0.33 - 1, 0, 3, h); g.fillRect(w * 0.66 - 1, 0, 3, h);
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(8, 0, 18, h);
  }, 'mirror');
  /** dark glass band 6.2 x 1.5 m (canvas 1024 x 248): the name ГОРНЫЙ ИНСТИТУТ in orange-copper letters 0.45 m high, letter-spaced */
  A.nameBand = D(1024, 248, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#26323a'); gr.addColorStop(1, '#161e24'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#10161b'; for (let i = 1; i < 6; i++) g.fillRect(i * w / 6 - 2, 0, 4, h);
    // the mirror flanks cover the outer 0.4 m of the band: the name must fit in 4.8 m (review fix: it was cut to «РНЫЙ ИНСТИТ»)
    g.textAlign = 'left'; g.textBaseline = 'middle';
    const txt = 'ГОРНЫЙ ИНСТИТУТ', fs0 = 0.45 * w / 6.2 / 0.72, sp0 = 0.1 * w / 6.2;
    g.font = `500 ${fs0}px ${F.sans}`;
    const w0 = [...txt].map((ch) => g.measureText(ch).width).reduce((a, b) => a + b, 0) + sp0 * (txt.length - 1), k = Math.min(1, (4.8 * w / 6.2) / w0);
    g.font = `500 ${fs0 * k}px ${F.sans}`;
    const sp = sp0 * k, ws = [...txt].map((ch) => g.measureText(ch).width);
    let x = w / 2 - (ws.reduce((a, b) => a + b, 0) + sp * (txt.length - 1)) / 2;
    g.fillStyle = '#d9622a'; [...txt].forEach((ch, i) => { g.fillText(ch, x, h / 2 + 3); x += ws[i] + sp; });
    g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(0, 0, w, 10);
  }, 'nameBand');
  /** the plain blue M: a ring d 0.9 m with the letter (canvas 256, alpha) */
  A.blueM = D(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.lineWidth = 22; g.strokeStyle = '#2d78c8'; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.38, h * 0.43, 0, 0, TAU); g.stroke();
    g.strokeStyle = '#f4f6f8'; g.lineWidth = 6; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.38 + 14, h * 0.43 + 14, 0, 0, TAU); g.stroke();
    g.strokeStyle = '#2d78c8'; g.lineWidth = 30; g.lineJoin = 'miter'; g.beginPath(); g.moveTo(w * 0.28, h * 0.72); g.lineTo(w * 0.28, h * 0.3); g.lineTo(w * 0.5, h * 0.56); g.lineTo(w * 0.72, h * 0.3); g.lineTo(w * 0.72, h * 0.72); g.stroke();
  }, 'blueM');
  /** the station sign plate 3.0 x 0.4 m (canvas 1024 x 136): grey, «Горный институт / Gorny Institut», a small orange line badge */
  A.signPlate = D(1024, 136, (g, w, h) => {
    g.fillStyle = '#767b80'; g.fillRect(0, 0, w, h); g.fillStyle = '#e6e8ea'; g.fillRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#4a4f54'; g.fillRect(6, 6, w - 12, 5);
    g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#1f2326'; g.font = `700 52px ${F.sans}`; g.fillText('Горный институт', 36, 48);
    g.fillStyle = '#4a4f54'; g.font = `500 34px ${F.sans}`; g.fillText('Gorny Institut', 36, 98);
    g.fillStyle = '#d9622a'; g.beginPath(); g.arc(w - 84, h / 2, 40, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.font = `700 50px ${F.sans}`; g.textAlign = 'center'; g.fillText('4', w - 84, h / 2 + 3);
  }, 'signPlate');
  /** the lift sign: grey oval 1.3 x 0.35 m (canvas 520 x 140): «Лифт № 3 / Elevator № 3» and the orange 4 */
  A.liftPlate = D(520, 140, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#7d8286'; g.beginPath(); g.ellipse(w / 2, h / 2, w / 2 - 2, h / 2 - 2, 0, 0, TAU); g.fill();
    g.fillStyle = '#e6e8ea'; g.beginPath(); g.ellipse(w / 2, h / 2, w / 2 - 10, h / 2 - 10, 0, 0, TAU); g.fill();
    g.fillStyle = '#1f2326'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.font = `700 40px ${F.sans}`; g.fillText('Лифт № 3', 72, 48); g.font = `500 28px ${F.sans}`; g.fillStyle = '#4a4f54'; g.fillText('Elevator № 3', 72, 92);
    g.fillStyle = '#d9622a'; g.beginPath(); g.arc(w - 74, h / 2, 28, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `700 34px ${F.sans}`; g.fillText('4', w - 74, h / 2 + 2);
  }, 'liftPlate');
  /** dark reflective glass wall of the pavilions: mullion cells 1.5 x 2.6 m (canvas 128 x 224), faint pale lamp strip */
  A.glassPav = D(128, 224, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w * 0.6, h); gr.addColorStop(0, '#2f3d46'); gr.addColorStop(1, '#171f25'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(220,214,170,0.35)'; g.fillRect(8, h * 0.12, w - 16, 5);
    g.fillStyle = 'rgba(255,255,255,0.10)'; g.beginPath(); g.moveTo(0, h * 0.75); g.lineTo(w, h * 0.35); g.lineTo(w, h * 0.5); g.lineTo(0, h * 0.9); g.fill();
    g.fillStyle = '#2b2e30'; g.fillRect(0, 0, 4, h); g.fillRect(w - 4, 0, 4, h);
  }, 'glassPav');
  /** the grey louvres of lift pavilion 3: black slats pitch 0.12 m (tile 1 x 0.96 m) */
  A.louvreBlack = D(128, 128, (g, w, h) => { g.fillStyle = '#101114'; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { g.fillStyle = '#2a2c33'; g.fillRect(0, i * 16, w, 4); } }, 'louvreBlack');
  A.graniteLift = D(128, 128, (g, w, h) => { const r = R(8391); g.fillStyle = '#b4b0aa'; g.fillRect(0, 0, w, h); for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) { const v = 0.96 + r() * 0.08; g.fillStyle = `rgb(${207 * v | 0},${203 * v | 0},${198 * v | 0})`; g.fillRect(i * 64 + 1.5, j * 32 + 1.5, 61, 29); } speckle(g, w, h, 8392, 100, 0.06); }, 'graniteLift');
  /** granite paving of the metro plaza: slabs 0.6 x 1.2 m (tile 2.4 x 2.4 m) */
  A.plaza = D(256, 256, (g, w, h) => {
    const r = R(8401); g.fillStyle = '#7d7873'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 8; j++) for (let i = -1; i < 4; i++) { const x = i * 64 + (j % 2) * 32, v = 0.93 + r() * 0.14; g.fillStyle = `rgb(${154 * v | 0},${148 * v | 0},${144 * v | 0})`; g.fillRect(x + 1.2, j * 32 + 1.2, 61.6, 29.6); }
    speckle(g, w, h, 8402, 260, 0.06);
  }, 'plaza');
  /** red-brown block pavers of the Brush plot, tile 3 x 3 m */
  A.pavers = D(256, 256, (g, w, h) => {
    const r = R(8411), ppm = w / 3, pw = 0.2 * ppm, ph = 0.1 * ppm;
    g.fillStyle = '#6a4238'; g.fillRect(0, 0, w, h);
    for (let y = 0, row = 0; y < h; y += ph, row++) for (let x = -(row % 2) * pw / 2; x < w; x += pw) { const v = 0.88 + r() * 0.22; g.fillStyle = `rgb(${154 * v | 0},${90 * v | 0},${69 * v | 0})`; g.fillRect(x + 0.4, y + 0.4, pw - 0.8, ph - 0.8); }
  }, 'pavers');
  /** lawn, tile 4 x 4 m */
  A.lawn = D(128, 128, (g, w, h) => { const r = R(8421); g.fillStyle = '#5d7c1e'; g.fillRect(0, 0, w, h); for (let i = 0; i < 220; i++) { g.fillStyle = r() < 0.5 ? '#678627' : '#4f6c17'; g.fillRect(r() * w, r() * h, 2 + r() * 3, 2 + r() * 3); } for (let i = 0; i < 6; i++) { g.fillStyle = '#e8d84a'; g.fillRect(r() * w, r() * h, 2, 2); } }, 'lawn');
  /** white sheet with a few dark lines: the plaques' text is drawn per plaque */
  A.plasterWhite = D(64, 64, (g, w, h) => { g.fillStyle = '#e8e6de'; g.fillRect(0, 0, w, h); }, 'plasterWhite');
  A.tramCream = D(64, 64, (g, w, h) => { g.fillStyle = '#eee6d0'; g.fillRect(0, 0, w, h); }, 'tramCream');
  void speckle;
  return A;
}
