// landmarksKirova/art.js - the canvas paintings of the module (docs/research/kirova.md sections 4-11; photos refs/kirova dk01 dk03 dk14 dk15 dk17 dk27 dk28 dk33 dk37 dk38, er01-er05, sm01, rr01, rr04, gd03, gd09).
//   DK Palace  wall (stone-imitating stucco scored in ashlar blocks 1.0 x 0.5 m, the lit photographic colour #d2ad98), podium (one 6 m module: dark plinth, ground-floor glass group 4 m + pier 2 m,
//              spandrel band, second-floor ribbon group), bay (the clear bay between two pilasters of the upper block: three window rows, two recessed spandrel panels), rear (orange pebbledash #c4825c,
//              the courtyard walls), arm (the west arm: two floors), cinema (dark rusticated base + ribbon windows), gallery (the 1968 low gallery: showcases + ribbon), strip (the east wall: ONE ribbon),
//              tower faces, the dark rough portal stone, the portal doors (lozenge panels), the roof membrane, the glass drum.
//   Erarta     base (warm yellow grooved render, two floors), portico wall (small ashlar blocks, windows of floors 3-5), wing upper floors, flanks, pink granite plinth, the white portal panels, the
//              sign band texts, the red roof letters ERARTA (plain capitals), the attic frieze text.
//   Garden     gravel / plaza / asphalt, the iron fence panel (cut-out), the gate leaf, lawn hedges, flower beds.   Monuments: Sobchak pedestal (polished dark red-brown granite, letters, arms), Roerich
//   pedestal granite and the back plaque text, bronze, the Sobchak platform clinker.
// Every key starts with 'lmKir-' (the texture cache is scene-wide: a prefix that matches another module silently takes its textures).
const TAU = Math.PI * 2;
export const COL = {
  wall: '#d5b8a6', wallLit: '#e5cdb8', wallShade: '#a4978a', pilaster: '#dfc7b6', joint: '#c2a291', plinth: '#8b6f60', band: '#c8a38d', nicheBack: '#d8b4a0', nicheOld: '#b86f5b',
  frame: '#3d2c24', glass: '#2f3a40', glassDay: '#5c6b73', curtain: '#e8e2d6', pier: '#cdbfb2', portal: '#a98873', portalPier: '#9c7d6a', door: '#b8793b', doorStile: '#d9bf84', doorWin: '#d6b87a',
  roof: '#55524f', coping: '#bda594', rear: '#c4825c', armGlass: '#8a4a2a', cinemaBase: '#6a5f58', cinemaTop: '#a9806a', concrete: '#c8c4bc', white: '#ece8e0', whiteCanopy: '#3b3633',
  endBlock: '#e5cdb8', flash: '#7a3a30',
  eBase: '#e9d3a6', eBase2: '#dcc59a', eWhite: '#f1efe9', eFrieze: '#e6cf9f', eWall: '#e2cfa8', eGranite: '#a46f64', eGraniteCheek: '#8d6358', eRoof: '#b8473f', eFrame: '#3a3028', eRed: '#c8343c',
  steel: '#2e2420', steelSheen: '#4a3a2c',
  gravel: '#b49a82', gravelDust: '#a58b74', plaza: '#b8806f', gateAsphalt: '#a89a85', lawn: '#6f9d4e', hedge: '#3f6b3a', iron: '#1f2326', cream: '#e6dcc6', gateRoof: '#6b6f72',
  sobGranite: '#53403a', sobLetter: '#b4b0a4', sobPaver: '#b87468', sobStripe: '#b9b5ae', bronze: '#2f302c', bronzeHi: '#4c5a4f',
  rubberCol: '#9a5a4a', roeGranite: '#a58a82', roeDark: '#4d3733', roeFig: '#a8a49e', roePlat: '#a08e88',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {}, C = COL;
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmKir-' + key, repeat });
  const R = (seed) => ctx.rng(seed);
  const F = tex.FONTS;
  const speckle = (g, w, h, seed, n, a = 0.1) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,32'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2); } };
  /** metre painter: y up, origin bottom-left of a tile of H metres at ppm pixels per metre */
  const MP = (g, ppm, H) => ({
    rect: (x0, y0, x1, y1, col) => { g.fillStyle = col; g.fillRect(x0 * ppm, (H - y1) * ppm, (x1 - x0) * ppm, (y1 - y0) * ppm); },
    line: (x0, y0, x1, y1, col, wm) => { g.strokeStyle = col; g.lineWidth = Math.max(1, wm * ppm); g.beginPath(); g.moveTo(x0 * ppm, (H - y0) * ppm); g.lineTo(x1 * ppm, (H - y1) * ppm); g.stroke(); },
    grad: (x0, y0, x1, y1, c0, c1) => { const gr = g.createLinearGradient(0, (H - y1) * ppm, 0, (H - y0) * ppm); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(x0 * ppm, (H - y1) * ppm, (x1 - x0) * ppm, (y1 - y0) * ppm); },
  });
  /** a window: dark frame, glass with a sky gradient, mullions (nx panes), a transom at fraction ty from the bottom */
  const window = (g, ppm, H, x0, y0, x1, y1, o = {}) => {
    const m = MP(g, ppm, H), fr = o.fr ?? 0.05;
    m.rect(x0, y0, x1, y1, o.frame || C.frame);
    m.grad(x0 + fr, y0 + fr, x1 - fr, y1 - fr, o.top || C.glassDay, o.bot || C.glass);
    const nx = o.nx || 2, ny = o.ny || 0;
    for (let i = 1; i < nx; i++) { const x = x0 + (x1 - x0) * i / nx; m.rect(x - fr / 2, y0, x + fr / 2, y1, o.frame || C.frame); }
    if (o.ty) m.rect(x0, y0 + (y1 - y0) * o.ty - fr / 2, x1, y0 + (y1 - y0) * o.ty + fr / 2, o.frame || C.frame);
    for (let j = 1; j < ny; j++) { const y = y0 + (y1 - y0) * j / ny; m.rect(x0, y - fr / 2, x1, y + fr / 2, o.frame || C.frame); }
    if (o.curtain) { const r = R(o.curtain); for (let i = 0; i < nx; i++) if (r() < 0.55) { const xa = x0 + fr + (x1 - x0 - 2 * fr) * i / nx, xb = x0 + (x1 - x0) * (i + 1) / nx - fr / 2; m.rect(xa, y0 + (y1 - y0) * (0.25 + r() * 0.3), xb, y1 - fr, C.curtain); } }
    if (o.sill) m.rect(x0 - 0.06, y0 - 0.1, x1 + 0.06, y0, o.sill);
    if (o.bars) { for (let x = x0 + 0.12; x < x1 - 0.05; x += 0.14) m.rect(x, y0, x + 0.025, y0 + (y1 - y0) * 0.55, '#d9d6cf'); }
  };
  /** ashlar scoring: blocks bw x bh m in running bond, base colour, tone variation; joints jc */
  const ashlar = (g, ppm, H, x0, y0, x1, y1, base, jc, seed, bw = 1.0, bh = 0.5, ja = 0.5) => {
    const m = MP(g, ppm, H), r = R(seed);
    const [br, bg, bb] = base.match(/\w\w/g).map((h) => parseInt(h, 16));
    const rows = Math.ceil((y1 - y0) / bh);
    for (let j = 0; j < rows; j++) {
      const ya = y0 + j * bh, yb = Math.min(y1, ya + bh), off = (j % 2) * bw / 2;
      for (let x = x0 - off; x < x1; x += bw) {
        const v = 0.965 + r() * 0.07, xa = Math.max(x0, x), xb = Math.min(x1, x + bw);
        if (xb <= xa) continue;
        g.fillStyle = `rgb(${br * v | 0},${bg * v | 0},${bb * v | 0})`; g.fillRect(xa * ppm, (H - yb) * ppm, (xb - xa) * ppm, (yb - ya) * ppm);
      }
    }
    g.fillStyle = jc;
    const jw = Math.max(1, ppm * 0.02);
    for (let j = 0; j <= rows; j++) { const y = y0 + j * bh; if (y > y1) break; g.globalAlpha = ja; g.fillRect(x0 * ppm, (H - y) * ppm - jw / 2, (x1 - x0) * ppm, jw); }
    for (let j = 0; j < rows; j++) { const ya = y0 + j * bh, yb = Math.min(y1, ya + bh), off = (j % 2) * bw / 2; for (let x = x0 - off; x < x1; x += bw) { if (x > x0 + 0.01) { g.globalAlpha = ja; g.fillRect(x * ppm - jw / 2, (H - yb) * ppm, jw, (yb - ya) * ppm); } } }
    g.globalAlpha = 1;
  };

  // ============================================================================================== DK wall: 4 x 4 m tile of ashlar stucco
  A.wall = D(512, 512, (g, w, h) => { ashlar(g, 128, 4, 0, 0, 4, 4, C.wall, C.joint, 8101); speckle(g, w, h, 8102, 2600, 0.05); }, 'wall');
  A.wallShade = D(256, 256, (g, w, h) => { ashlar(g, 64, 4, 0, 0, 4, 4, '#c9a08e', '#a98777', 8103); speckle(g, w, h, 8104, 900, 0.07); }, 'wallShade');
  A.rough = D(192, 192, (g, w, h) => { g.fillStyle = C.plinth; g.fillRect(0, 0, w, h); speckle(g, w, h, 8105, 2200, 0.16); const r = R(8106); for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(60,44,38,0.28)'; g.fillRect(0, r() * h, w, 2); } }, 'rough');

  // ============================================================================================== podium module 6.0 x 9.2 m (64 px/m)
  // (A.podium removed: plain colour now)
  A.podiumRough = D(384, 589, (g, w, h) => {                                                                       // the dark rough stone base of the pavilions (ground floor to 4.9) is a separate material
    const ppm = 64, H = 9.2, m = MP(g, ppm, H);
    g.fillStyle = C.plinth; g.fillRect(0, 0, w, h); speckle(g, w, h, 8116, 3500, 0.16);
    window(g, ppm, H, 1.4, 0.7, 3.4, 3.3, { nx: 2, ty: 0.7, fr: 0.07 });
    m.rect(0, 4.8, 6, 4.9, '#a08470');
  }, 'podiumRough');

  // ============================================================================================== upper block: the clear bay 2.45 x 13 m (y 9.2 .. 22.2)
  // (A.bay removed: plain colour now)

  // ============================================================================================== pavilion niche back + side windows
  A.pavSide = D(64, 128, (g, w, h) => {                                                                          // a column of small windows on the pavilion side faces: tile 1.7 m wide x 3.4 m high
    const ppm = 37.6, H = 3.4; ashlar(g, 37.6, H, 0, 0, 1.7, H, C.wall, C.joint, 8131); window(g, 37.6, H, 0.3, 0.9, 1.4, 2.4, { nx: 2, fr: 0.05 });
  }, 'pavSide');

  // ============================================================================================== rear / courtyard wall: orange render, tall stair windows (tile 2.9 x 3.7 m, 56 px/m)
  A.rear = D(162, 207, (g, w, h) => {
    const ppm = 56, H = 3.7, m = MP(g, ppm, H), r = R(8141);
    g.fillStyle = C.rear; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,220,190' : '90,50,30'},0.12)`; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
    m.rect(0, 0, 0.5, H, '#cd9068');                                                                              // the pilaster strip
    window(g, ppm, H, 1.0, 0.9, 2.45, 2.7, { nx: 2, ty: 0.72, fr: 0.05, frame: '#3a2a22' });
    m.rect(0.95, 2.7, 2.5, 2.8, '#b8714e');
    m.rect(0, 3.55, 2.9, 3.7, 'rgba(70,40,26,0.2)');
  }, 'rear');
  A.rearTall = D(162, 207, (g, w, h) => {                                                                         // the stair strip: tall narrow windows in vertical bands
    const ppm = 56, H = 3.7, m = MP(g, ppm, H), r = R(8142);
    g.fillStyle = C.rear; g.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,220,190' : '90,50,30'},0.12)`; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
    window(g, ppm, H, 0.7, 0.2, 1.1, 3.5, { nx: 1, ty: 0.6, fr: 0.05, frame: '#3a2a22' }); window(g, ppm, H, 1.8, 0.2, 2.2, 3.5, { nx: 1, ty: 0.6, fr: 0.05, frame: '#3a2a22' });
  }, 'rearTall');

  // ============================================================================================== side faces: ribbon windows on three floors (tile 6 x 3.7 m)
  A.ribbon = D(288, 178, (g, w, h) => {
    const ppm = 48, H = 3.7, m = MP(g, ppm, H);
    ashlar(g, ppm, H, 0, 0, 6, H, C.wall, C.joint, 8151);
    window(g, ppm, H, 0.6, 1.2, 5.4, 2.8, { nx: 4, fr: 0.05 }); m.rect(0.55, 1.1, 5.45, 1.2, '#c2a08c');
  }, 'ribbon');

  // ============================================================================================== west arm: two floors of orange-salmon pebbledash (tile 6 x 10 m at 40 px/m)
  A.arm = D(240, 400, (g, w, h) => {
    const ppm = 40, H = 10, m = MP(g, ppm, H), r = R(8161);
    g.fillStyle = C.rear; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,215,185' : '90,50,30'},0.12)`; g.fillRect(r() * w, r() * h, 1.6, 1.6); }
    m.rect(0, 0, 6, 0.5, '#9d9288');                                                                              // concrete plinth
    for (const x0 of [0.6, 3.4]) { window(g, ppm, H, x0, 1.0, x0 + 1.5, 2.9, { nx: 2, fr: 0.06, frame: C.armGlass }); for (let x = x0 + 0.1; x < x0 + 1.45; x += 0.2) m.rect(x, 1.0, x + 0.025, 2.9, '#f0eee8'); }
    m.rect(0, 4.7, 6, 5.05, '#d4b89e');                                                                           // the stone belt between the floors
    for (const x0 of [0.3, 2.25, 4.2]) window(g, ppm, H, x0, 5.7, x0 + 1.5, 8.8, { nx: 2, ny: 3, fr: 0.06, frame: C.armGlass });
    m.rect(0, 9.55, 6, 10, 'rgba(70,40,26,0.2)');
  }, 'arm');

  // ============================================================================================== cinema: dark rusticated base + upper render with ribbon windows (tile 4 x 9.5 m at 48 px/m)
  A.cinema = D(192, 456, (g, w, h) => {
    const ppm = 48, H = 9.5, m = MP(g, ppm, H), r = R(8171);
    g.fillStyle = C.cinemaTop; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,220,190' : '70,40,28'},0.1)`; g.fillRect(r() * w, r() * h, 1.6, 1.6); }
    ashlar(g, ppm, H, 0, 0, 4, 3.6, C.cinemaBase, '#403833', 8172, 1.0, 0.5, 0.7);
    window(g, ppm, H, 1.0, 1.0, 3.0, 3.0, { nx: 2, fr: 0.06, frame: '#3a2d26', bars: true });
    m.rect(0, 3.6, 4, 3.85, '#8c6a58');
    window(g, ppm, H, 0.2, 4.6, 3.8, 6.0, { nx: 3, fr: 0.06, frame: '#3a2d26' });
    window(g, ppm, H, 0.2, 6.8, 3.8, 8.2, { nx: 3, fr: 0.06, frame: '#3a2d26' });
    m.rect(0, 9.2, 4, 9.5, '#8e6a58');
  }, 'cinema');

  // ============================================================================================== the 1968 gallery: showcases + ribbon (tile 2.75 x 9.2 m at 56 px/m)
  // (A.gallery removed: plain colour now)

  // ============================================================================================== the east strip wall behind the gallery: ONE ribbon of low windows (tile 5.0 x 8.0 m: y 9.5 .. 17.5)
  A.strip = D(320, 512, (g, w, h) => {
    const ppm = 64, H = 8, m = MP(g, ppm, H);
    ashlar(g, ppm, H, 0, 0, 5, H, C.wall, C.joint, 8191);
    window(g, ppm, H, 0.5, 3.0, 4.5, 4.4, { nx: 4, fr: 0.05, curtain: 8192 });
    m.rect(0.45, 2.9, 4.55, 3.0, '#c2a08c');
    speckle(g, w, h, 8193, 500, 0.05);
  }, 'strip');

  // ============================================================================================== tower
  // (A.towerWin removed: plain colour now)
  A.drum = D(512, 128, (g, w, h) => {                                                                            // eight tall windows of 'glass tubes' round the drum: one texture turn
    g.fillStyle = C.wall; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 8; k++) {
      const x0 = k * 64 + 8, x1 = k * 64 + 56;
      g.fillStyle = C.frame; g.fillRect(x0 - 2, 12, x1 - x0 + 4, 104);
      const gr = g.createLinearGradient(0, 12, 0, 116); gr.addColorStop(0, '#7f949c'); gr.addColorStop(1, '#2f3a40'); g.fillStyle = gr; g.fillRect(x0, 14, x1 - x0, 100);
      g.fillStyle = C.frame; for (let i = 1; i < 4; i++) g.fillRect(x0 + (x1 - x0) * i / 4 - 1, 14, 2, 100);
    }
    g.fillStyle = 'rgba(60,44,38,0.25)'; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8);
  }, 'drum');

  // ============================================================================================== portal stone, doors, roof
  A.portalStone = D(192, 192, (g, w, h) => {
    g.fillStyle = C.portal; g.fillRect(0, 0, w, h);
    const r = R(8211); for (let i = 0; i < 3800; i++) { const t = r(); g.fillStyle = `rgba(${t < 0.4 ? '110,80,64' : t < 0.8 ? '200,170,150' : '70,56,50'},0.2)`; g.fillRect(r() * w, r() * h, 1.5 + r() * 2.5, 1.5 + r() * 2); }
    g.fillStyle = 'rgba(60,44,38,0.3)'; for (let y = 0; y < h; y += 48) g.fillRect(0, y, w, 1.5);
  }, 'portalStone');
  A.door = D(128, 332, (g, w, h) => {                                                                             // one leaf 1.0 x 2.6 m
    g.fillStyle = C.door; g.fillRect(0, 0, w, h);
    g.fillStyle = C.doorStile; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8); g.fillRect(0, 0, 8, h); g.fillRect(w - 8, 0, 8, h);
    const panel = (y0, y1, loz) => {
      g.fillStyle = '#9b6330'; g.fillRect(16, y0, w - 32, y1 - y0);
      g.fillStyle = '#c28645'; g.fillRect(20, y0 + 4, w - 40, y1 - y0 - 8);
      if (loz) { g.fillStyle = '#9b6330'; g.beginPath(); g.moveTo(w / 2, y0 + 14); g.lineTo(w - 30, (y0 + y1) / 2); g.lineTo(w / 2, y1 - 14); g.lineTo(30, (y0 + y1) / 2); g.closePath(); g.fill(); }
    };
    panel(16, 80, false); panel(88, 160, true); panel(168, 240, true); panel(248, 304, false);
    g.fillStyle = '#6a4a30'; g.fillRect(0, h - 22, w, 22);                                                        // kick plate
    g.fillStyle = '#d6c79a'; g.fillRect(w - 18, h * 0.5, 6, 30);
  }, 'door');
  A.portalWin = D(128, 115, (g, w, h) => { window(g, 67.4, 1.7, 0, 0, 1.9, 1.7, { nx: 2, ny: 3, fr: 0.06, frame: C.doorWin, top: '#6b7a80' }); }, 'portalWin');
  A.roof = D(128, 128, (g, w, h) => { g.fillStyle = C.roof; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(30,28,26,0.45)'; g.fillRect(0, 0, 2, h); g.fillRect(64, 0, 2, h); speckle(g, w, h, 8221, 220, 0.12); }, 'roof');

  // ============================================================================================== roof words of the DK (switch LETTERS)
  A.dkWords = (txt, key) => D(768, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#4a3d38'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${h * 0.8}px ${F.sans}`; g.fillText(txt, w / 2, h * 0.5); }, key);

  // ============================================================================================== garden
  // (A.gravel removed: plain colour now)
  // (A.plaza removed: plain colour now)
  // (A.gateAsphalt removed: plain colour now)
  // (A.dirt removed: plain colour now)
  // (A.rubble removed: plain colour now)
  // (A.rubber removed: plain colour now)
  // (A.court removed: plain colour now)
  // (A.hedge removed: plain colour now)
  /** the iron fence panel: 1.2 m wide x 2.0 m high, 16 mm bars every 0.12 m with spear heads, two rails (alpha cut-out) */
  A.fence = D(128, 213, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = C.iron;
    const ppm = 106.5;
    for (let i = 0; i < 10; i++) { const x = (i + 0.5) * 12.8; g.fillRect(x - 1.4, 18, 2.8, h - 18); g.beginPath(); g.moveTo(x - 3.2, 18); g.lineTo(x, 3); g.lineTo(x + 3.2, 18); g.closePath(); g.fill(); }
    g.fillRect(0, 30, w, 4); g.fillRect(0, h - 38, w, 4); void ppm;
  }, 'fence');
  /** the south gate leaf 1.7 x 2.6 m: scalloped garland top rail, five ring motifs in the lower panel (alpha cut-out) */
  A.gate = D(128, 196, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = C.iron;
    for (let i = 0; i < 12; i++) { const x = (i + 0.5) * w / 12; g.fillRect(x - 1.4, 40, 2.8, h - 40); g.beginPath(); g.moveTo(x - 3, 40); g.lineTo(x, 28); g.lineTo(x + 3, 40); g.fill(); }
    g.fillRect(0, 44, w, 4); g.fillRect(0, h * 0.62, w, 4); g.fillRect(0, h - 8, w, 8); g.fillRect(0, 0, 5, h); g.fillRect(w - 5, 0, 5, h);
    g.strokeStyle = C.iron; g.lineWidth = 3; for (let i = 0; i < 6; i++) { const x0 = i * w / 6, x1 = (i + 1) * w / 6; g.beginPath(); g.moveTo(x0, 20); g.quadraticCurveTo((x0 + x1) / 2, 46, x1, 20); g.stroke(); }
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc((i + 0.5) * w / 5, h * 0.82, 9, 0, TAU); g.stroke(); }
  }, 'gate');
  // (A.flower removed: plain colour now)

  // ============================================================================================== monuments
  // (A.sobGranite removed: plain colour now)
  /** front text block of the Sobchak pedestal P1 (1.15 x 1.0 m face): coat of arms + seven lines */
  A.sobFront = D(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    // the city arms (relief): crowned shield with the crossed sceptre and two anchors, leaning supporters (plain pale-metal outline, no flag)
    g.fillStyle = '#b4b0a4'; g.strokeStyle = '#b4b0a4'; g.lineWidth = 3;
    const cx = w / 2;
    g.beginPath(); g.moveTo(cx - 26, 40); g.lineTo(cx + 26, 40); g.lineTo(cx + 26, 78); g.quadraticCurveTo(cx + 24, 100, cx, 108); g.quadraticCurveTo(cx - 24, 100, cx - 26, 78); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(cx - 18, 36); g.lineTo(cx - 18, 24); g.lineTo(cx - 9, 31); g.lineTo(cx, 20); g.lineTo(cx + 9, 31); g.lineTo(cx + 18, 24); g.lineTo(cx + 18, 36); g.closePath(); g.fill();
    g.lineWidth = 2.5; g.beginPath(); g.moveTo(cx - 17, 52); g.lineTo(cx + 17, 98); g.moveTo(cx + 17, 52); g.lineTo(cx - 17, 98); g.stroke();
    g.beginPath(); g.moveTo(cx, 46); g.lineTo(cx, 100); g.stroke(); g.beginPath(); g.arc(cx, 52, 4, 0, TAU); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 34, 98); g.quadraticCurveTo(cx - 52, 70, cx - 40, 46); g.moveTo(cx + 34, 98); g.quadraticCurveTo(cx + 52, 70, cx + 40, 46); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = C.sobLetter;
    const lines = ['АНАТОЛИЮ', 'АЛЕКСАНДРОВИЧУ', 'СОБЧАКУ', '(1937-2000)', 'ВОЗВРАТИВШЕМУ', 'ИМЯ', 'ГОРОДУ'];
    lines.forEach((t, i) => { g.font = `600 ${i === 3 ? 17 : 19}px ${F.serif}`; g.fillText(t, w / 2, 134 + i * 17.5); });
  }, 'sobFront');
  A.sobUpper = D(256, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = C.sobLetter; g.textAlign = 'center'; g.textBaseline = 'middle';
    ['ПЕРВОМУ', 'МЭРУ', 'САНКТ-ПЕТЕРБУРГА'].forEach((t, i) => { g.font = `600 ${i === 2 ? 20 : 24}px ${F.serif}`; g.fillText(t, w / 2, 24 + i * 36); });
  }, 'sobUpper');
  A.roeSign = D(128, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#4a3a36'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `italic 600 ${h * 0.62}px ${F.hand}`; g.fillText('Н. Рерих', w / 2, h / 2); }, 'roeSign');
  A.roePlaque = D(512, 512, (g, w, h) => {
    g.fillStyle = '#2c2523'; g.fillRect(0, 0, w, h); g.fillStyle = '#b9b0a2'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const lines = ['ПАМЯТНИК УСТАНОВЛЕН В 2010 ГОДУ', 'ПО ЗАКАЗУ', 'МЕЖДУНАРОДНОГО БЛАГОТВОРИТЕЛЬНОГО ФОНДА', '«РЕРИХОВСКОЕ НАСЛЕДИЕ»', 'НА СРЕДСТВА ЖИТЕЛЯ САНКТ-ПЕТЕРБУРГА', 'ЖОРНО ЮРИЯ ЮРЬЕВИЧА', 'СКУЛЬПТОР В.В. ЗАЙКО, АРХИТЕКТОР Ю.Ф. КОЖИН', 'ИСПОЛНИЛ МАСТЕР П.И. ГИЛЬ', 'КАМЕНЬ ДЛЯ СКУЛЬПТУРЫ ПРЕДОСТАВИЛ КЛУБ ГОРНОПРОМЫШЛЕННИКОВ.', 'ПРЕЗИДЕНТ С.Г. ЛОСЕНКО'];
    lines.forEach((t, i) => { g.font = `600 ${i === 3 ? 29 : 24}px ${F.sans}`; g.save(); const mw = g.measureText(t).width, k = Math.min(1, (w - 30) / mw); g.translate(w / 2, 40 + i * 48); g.scale(k, 1); g.fillText(t, 0, 0); g.restore(); });
  }, 'roePlaque');
  // (A.roeGranite removed: plain colour now)
  // (A.roeFig removed: plain colour now)
  // (A.platform removed: plain colour now)
  // (A.paverRed removed: plain colour now)
  // (A.slabs removed: plain colour now)
  // (A.kerb removed: plain colour now)
  // the slab pavement of the palace front: an exact copy of the Nevsky slab of streets/tex.js (same painter and seed, own key; same world-space uv in dkpave.js) so that it matches the pavement of streets where the two overlap
  A.dkSlab = tex.draw(256, 256, (g, w, h) => {
    let sd = 4451 >>> 0; const r = () => ((sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296);
    g.fillStyle = '#76736e'; g.fillRect(0, 0, w, h);
    const cols = 3, rows = 4, bw = w / cols, bh = h / rows;
    for (let j = 0; j < rows; j++) for (let i = -1; i < cols; i++) {
      const x = i * bw + (j % 2 ? bw / 2 : 0), y = j * bh, v = 0.96 + r() * 0.07, k = r();
      const c = k < 0.1 ? [166, 156, 152] : k < 0.28 ? [150, 150, 147] : [158, 158, 153];
      g.fillStyle = `rgb(${Math.round(c[0] * v)},${Math.round(c[1] * v)},${Math.round(c[2] * v)})`;
      g.fillRect(x + 0.9, y + 0.9, bw - 1.8, bh - 1.8);
      for (let q = 0; q < 26; q++) { g.fillStyle = r() < 0.5 ? 'rgba(70,66,64,0.10)' : 'rgba(255,252,246,0.10)'; g.fillRect(x + r() * bw, y + r() * bh, 1.4, 1.4); }
    }
  }, { key: 'lmKir-dkSlab', repeat: [1, 1], anisotropy: 8 });
  return A;
}
