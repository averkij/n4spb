// landmarksSeaTerminal/art.js - the canvas paintings of the module (docs/research/seaterminal.md sections 4.4, 6, 7, 8; photos refs/seaterminal a01 a03 a07 a17 a23 (terminal), d01 d14 (D-2), t03 t04 t07 (torpedo boat)).
//   terminal:  fluted brushed aluminium (ribs 0.45 m, rain streaks), the hotel bay wall (aluminium with 5.0 x 1.5 m dark glazing, four panes, curtains / blinds, four bays per tile), the hall curtain wall
//              (mullions every 1.575 m), the dark podium stone (blocks 0.6 x 0.3 m), weathered concrete, the blue-grey deck fascia, the roof membrane, the lot / under-deck asphalt, the quay slabs,
//              the roof lettering МОРСКОЙ ВОКЗАЛ (blue, alpha cut-out), the restaurant word, the black clock dial with gold marks.
//   D-2:       riveted hull plates (neutral, tinted by the material), the ochre faux-ashlar of the pavilion, the white «Д-2», the red star, the museum plate, the gravel plaza.
//   torpedo boat: riveted plates (lilac grey), the granite plinth with 1.4 m joints, the plinth lettering «1941-45» (dark red) + the gold dedication, the bronze board with the full plaque text, brick pavers.
//   Lenexpo:   galvanised ribbed hoarding sheets.
// Every key starts with 'lmseate-' (the texture cache is scene-wide: a prefix that matches another module silently takes its textures).
const TAU = Math.PI * 2;

export const COL = {
  alu: '#aab1b5', concrete: '#aaa89f', glass: '#3f4f59', podium: '#54504a', fascia: '#7b8696', screen: '#aeb1b1', roof: '#4a4d50', letters: '#2d3a96', needle: '#b9a982', gold: '#d9b24a',
  quay: '#9a9588', quayFace: '#b5a58a', asphalt: '#5d5f62', frame: '#e9e9e4',
  hullUp: '#a9adb0', hullLow: '#58785f', deck: '#6b6f72', boot: '#f0f0ec', star: '#c43030', ochre: '#d4a85e', cradle: '#d9a45a',
  boat: '#a8abb6', boatDeck: '#8e939a', granite: '#8c8f94', brick: '#a5594a', hoard: '#a9b0b3', hoardPost: '#6f757a',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {}, C = COL;
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmseate-' + key, repeat });
  const R = (seed) => ctx.rng(seed);
  const F = tex.FONTS;
  const speckle = (g, w, h, seed, n, a = 0.1) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,32'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2); } };

  // ------------------------------------------------------------------------------------------ fluted aluminium: tile 1.8 x 1.8 m, four ribs of 0.45 m, a lit edge and a shaded edge per rib, rain streaks (photos a03 a17)
  A.alu = D(256, 256, (g, w, h) => {
    const r = R(9101); g.fillStyle = C.alu; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(i * 64, 0, 22, h);
      g.fillStyle = 'rgba(70,76,80,0.20)'; g.fillRect(i * 64 + 50, 0, 14, h);
      g.fillStyle = 'rgba(60,66,70,0.30)'; g.fillRect(i * 64, 0, 2, h);
    }
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '120,126,130' : '236,238,236'},${0.10 + r() * 0.14})`; g.fillRect((r() * w) | 0, (r() * h * 0.5) | 0, 1 + (r() * 2 | 0), (h * (0.3 + r() * 0.7)) | 0); }
    speckle(g, w, h, 9102, 300, 0.05);
  }, 'alu');

  // ------------------------------------------------------------------------------------------ the hotel bay wall (behind the hood frames): four bays (25.2 x 3.0 m) per tile; every bay is one tier:
  // aluminium wall, the glazing 5.0 x 1.5 m (y 0.55 .. 2.05) in four panes, white frames, curtains / blinds in some panes (photo a03)
  A.bayWall = D(1024, 128, (g, w, h) => {
    const r = R(9111), ppm = w / 25.2, py = h / 3.0;
    g.fillStyle = C.alu; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 0.45 * ppm) { g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(x, 0, 0.14 * ppm, h); g.fillStyle = 'rgba(60,66,70,0.14)'; g.fillRect(x + 0.32 * ppm, 0, 0.1 * ppm, h); }
    for (let b = 0; b < 4; b++) {
      const x0 = (b * 6.3 + 0.65) * ppm, gw = 5.0 * ppm, y1 = h - 0.55 * py, y0 = h - 2.05 * py;                       // canvas y runs down: the sill is at the BOTTOM
      const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#4a5c68'); gr.addColorStop(1, '#2f3d47');
      g.fillStyle = gr; g.fillRect(x0, y0, gw, y1 - y0);
      for (let p = 0; p < 4; p++) {
        const px = x0 + p * gw / 4, pw = gw / 4, k = r();
        if (k < 0.22) { g.fillStyle = 'rgba(232,226,208,0.78)'; g.fillRect(px + 2, y0 + 2, pw - 4, y1 - y0 - 4); }
        else if (k < 0.34) { g.fillStyle = 'rgba(120,160,128,0.7)'; g.fillRect(px + 2, y0 + 2, pw - 4, y1 - y0 - 4); }
        else if (k < 0.46) { g.fillStyle = 'rgba(186,170,140,0.6)'; g.fillRect(px + 2, y0 + 2, pw - 4, (y1 - y0) * 0.6); }
        g.fillStyle = 'rgba(255,255,255,0.10)'; g.beginPath(); g.moveTo(px, y1); g.lineTo(px + pw * 0.6, y0); g.lineTo(px + pw * 0.8, y0); g.lineTo(px + pw * 0.2, y1); g.closePath(); g.fill();
      }
      g.fillStyle = C.frame;
      for (let p = 0; p <= 4; p++) g.fillRect(x0 + p * gw / 4 - (p === 2 ? 2.5 : 1.2), y0, p === 2 ? 5 : 2.4, y1 - y0);
      g.fillRect(x0, y0, gw, 2.4); g.fillRect(x0, y1 - 2.4, gw, 2.4);
    }
  }, 'bayWall');

  // ------------------------------------------------------------------------------------------ the hall curtain wall: 2 bays (12.6 x 4.0 m) per tile, mullions every 1.575 m, one transom, a warm light here and there
  A.hall = D(512, 160, (g, w, h) => {
    const r = R(9121), ppm = w / 12.6;
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#4a5b66'); gr.addColorStop(1, '#2c3942'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) {
      const x = i * 1.575 * ppm;
      if (r() < 0.35) { g.fillStyle = `rgba(216,185,112,${0.14 + r() * 0.12})`; g.fillRect(x + 2, 6, 1.575 * ppm - 4, h - 12); }
      g.fillStyle = 'rgba(255,255,255,0.10)'; g.beginPath(); g.moveTo(x, h); g.lineTo(x + 0.6 * ppm, 0); g.lineTo(x + 0.95 * ppm, 0); g.lineTo(x + 0.35 * ppm, h); g.closePath(); g.fill();
    }
    g.fillStyle = '#c9ced1'; for (let i = 0; i <= 8; i++) g.fillRect(i * 1.575 * ppm - 1.2, 0, 2.4, h);
    g.fillRect(0, h * 0.5 - 1.5, w, 3); g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3);
  }, 'hall');

  // ------------------------------------------------------------------------------------------ podium stone: blocks 0.6 x 0.3 m in running bond, dark brown-grey; tile 2.4 x 1.2 m
  A.podium = D(256, 128, (g, w, h) => {
    const r = R(9131), cw = w / 4, rh = h / 4;
    g.fillStyle = '#403c37'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 4; row++) for (let c = -1; c < 5; c++) { const x = c * cw + (row % 2) * cw / 2, v = 0.88 + r() * 0.24; g.fillStyle = `rgb(${84 * v | 0},${80 * v | 0},${74 * v | 0})`; g.fillRect(x + 1, row * rh + 1, cw - 2, rh - 2); }
    speckle(g, w, h, 9132, 300, 0.07);
  }, 'podium');

  // ------------------------------------------------------------------------------------------ weathered concrete (spine, piers, pylon, clock tower): tile 2 x 4 m, vertical streaks and shuttering joints
  A.concrete = D(128, 256, (g, w, h) => {
    const r = R(9141); g.fillStyle = C.concrete; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) { g.fillStyle = `rgba(${r() < 0.7 ? '120,118,112' : '230,228,220'},${0.08 + r() * 0.14})`; g.fillRect((r() * w) | 0, (r() * h * 0.4) | 0, 1 + (r() * 3 | 0), (h * (0.25 + r() * 0.75)) | 0); }
    g.fillStyle = 'rgba(80,78,72,0.28)'; g.fillRect(0, 0, w, 2); g.fillRect(0, h / 2, w, 2); g.fillRect(0, 0, 2, h);
    speckle(g, w, h, 9142, 160, 0.06);
  }, 'concrete');

  // ------------------------------------------------------------------------------------------ the deck fascia, blue-grey, joints every 6.3 m: tile 6.3 x 2.5 m
  A.fascia = D(256, 100, (g, w, h) => {
    g.fillStyle = C.fascia; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(0, 0, w, 10); g.fillStyle = 'rgba(40,46,56,0.22)'; g.fillRect(0, h - 14, w, 14);
    g.fillStyle = 'rgba(40,46,56,0.35)'; g.fillRect(0, 0, 2, h);
    speckle(g, w, h, 9151, 120, 0.05);
  }, 'fascia');

  // ------------------------------------------------------------------------------------------ roof membrane with seams: tile 2 x 2 m
  A.roof = D(128, 128, (g, w, h) => { g.fillStyle = '#6a6d70'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(30,32,34,0.4)'; g.fillRect(0, 0, 2, h); g.fillRect(64, 0, 2, h); g.fillRect(0, 0, w, 2); g.fillRect(0, 64, w, 2); speckle(g, w, h, 9161, 200, 0.08); }, 'roof');

  // ------------------------------------------------------------------------------------------ asphalt of the under-deck floor and the apron: tile 4 x 4 m, dark specks, one patched seam
  A.asphalt = D(256, 256, (g, w, h) => {
    const r = R(9171); g.fillStyle = '#6b6d70'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${r() < 0.6 ? '40,42,44' : '150,152,154'},${0.10 + r() * 0.12})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
    g.fillStyle = 'rgba(30,32,34,0.18)'; g.fillRect(0, h * 0.62, w, 3);
  }, 'asphalt');

  // ------------------------------------------------------------------------------------------ light concrete quay / apron slabs 5 x 5 m with joints
  A.quayDeck = D(256, 256, (g, w, h) => {
    const r = R(9181); g.fillStyle = '#85817a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const v = 0.95 + r() * 0.08; g.fillStyle = `rgb(${160 * v | 0},${156 * v | 0},${146 * v | 0})`; g.fillRect(i * 128 + 1.5, j * 128 + 1.5, 125, 125); }
    speckle(g, w, h, 9182, 240, 0.07);
  }, 'quayDeck');

  // ------------------------------------------------------------------------------------------ roof lettering МОРСКОЙ ВОКЗАЛ: blue plain wide sans on transparent, 23.6 x 2.77 m (canvas 1024 x 120, caps ~1.8 m)
  A.letters = D(1024, 120, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    const text = 'МОРСКОЙ ВОКЗАЛ'; g.font = `500 108px ${F.sans}`;
    const tw = g.measureText(text).width, target = w - 8;
    g.save(); g.translate(4, h - 12); g.scale(target / tw, 1);
    g.fillStyle = C.letters; g.fillText(text, 0, 0); g.restore();
  }, 'letters', [1, 1]);
    /** the word РЕСТОРАН: dark grey condensed letters on transparent, 8.0 x 2.5 m (canvas 512 x 160) */
  A.restoran = D(512, 160, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle';
    let s = 120; g.font = `700 ${s}px ${F.sans}`; const tw = g.measureText('РЕСТОРАН').width; g.save(); g.translate(w / 2, h / 2); g.scale((w - 14) / tw, 1); g.fillStyle = '#3a3d40'; g.fillText('РЕСТОРАН', 0, 0); g.restore();
  }, 'restoran', [1, 1]);
  /** the black clock dial with gold marks and hands, 3.8 m across (canvas 256) */
  A.dial = D(256, 256, (g, w, h) => {
    g.fillStyle = '#1e1f21'; g.fillRect(0, 0, w, h);
    g.translate(w / 2, h / 2); g.fillStyle = '#c9a24a';
    for (let i = 0; i < 12; i++) { g.save(); g.rotate(i * Math.PI / 6); g.fillRect(-5, -112, 10, i % 3 === 0 ? 30 : 18); g.restore(); }
    g.save(); g.rotate(-0.9); g.fillRect(-4, -92, 8, 100); g.restore(); g.save(); g.rotate(1.9); g.fillRect(-3, -70, 6, 78); g.restore();
    g.beginPath(); g.arc(0, 0, 9, 0, TAU); g.fill();
  }, 'dial', [1, 1]);

  // ------------------------------------------------------------------------------------------ D-2
  /** hull plates: near white, seams every 3.0 x 1.2 m, rivet rows (the colour comes from the material): tile 3 x 2.4 m */
  A.plates = D(256, 205, (g, w, h) => {
    const r = R(9201); g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 2; row++) { const y = row * h / 2; g.fillStyle = 'rgba(40,44,48,0.28)'; g.fillRect(0, y, w, 2); g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(0, y + 2, w, 2); }
    g.fillStyle = 'rgba(40,44,48,0.26)'; g.fillRect(0, 0, 2, h); g.fillRect(w / 2, 0, 2, h);
    g.fillStyle = 'rgba(40,44,48,0.22)'; for (let x = 6; x < w; x += 12) for (const y of [8, h / 2 + 8]) g.fillRect(x, y, 3, 3);
    for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(60,70,60,${0.05 + r() * 0.08})`; g.fillRect(r() * w, r() * h, 6 + r() * 30, 2 + r() * 10); }
  }, 'plates');
  /** ochre faux ashlar of the museum pavilion, blocks 1.0 x 0.5 m, dark red-brown foot band: tile 4 x 2 m */
  A.ashlar = D(256, 128, (g, w, h) => {
    const r = R(9211), cw = w / 4, rh = h / 4;
    g.fillStyle = '#9e7a40'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 4; row++) for (let c = -1; c < 5; c++) { const x = c * cw + (row % 2) * cw / 2, v = 0.95 + r() * 0.1; g.fillStyle = `rgb(${212 * v | 0},${168 * v | 0},${94 * v | 0})`; g.fillRect(x + 1.5, row * rh + 1.5, cw - 3, rh - 3); }
    speckle(g, w, h, 9212, 160, 0.06);
  }, 'ashlar');
  /** white «Д-2» block letters on transparent, 4.4 x 2.4 m (canvas 256 x 140) */
  A.d2 = D(256, 140, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 130px ${F.sans}`; const t = 'Д-2'; const tw = g.measureText(t).width;
    g.save(); g.translate(w / 2, h / 2 + 4); g.scale(Math.min(1, (w - 8) / tw), 1); g.fillStyle = '#f4f4f0'; g.fillText(t, 0, 0); g.restore();
  }, 'd2', [1, 1]);
  /** the red star with a white rim and a white 5 (naval insignia, no hammer and sickle), alpha disc 1.2 m (canvas 128) */
  A.star = D(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.translate(w / 2, h / 2 + 4);
    const star = (R0, ri, col) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? ri : R0; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fillStyle = col; g.fill(); };
    star(62, 26, '#f4f4f0'); star(54, 22, C.star);
    g.fillStyle = '#f4f4f0'; g.beginPath(); g.arc(0, 4, 17, 0, TAU); g.fill(); g.fillStyle = '#222'; g.font = `700 26px ${F.sans}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('5', 0, 5);
  }, 'star', [1, 1]);
  /** gravel of the foundation-stone plaza: tile 2 x 2 m */
  A.gravel = D(128, 128, (g, w, h) => { const r = R(9221); g.fillStyle = '#9b9488'; g.fillRect(0, 0, w, h); for (let i = 0; i < 520; i++) { const v = 0.7 + r() * 0.5; g.fillStyle = `rgb(${160 * v | 0},${152 * v | 0},${140 * v | 0})`; g.fillRect(r() * w, r() * h, 1.5 + r() * 2.5, 1.5 + r() * 2); } }, 'gravel');
  /** the museum plate on a stand: white lines on dark green, 0.9 x 0.7 m */
  A.museum = D(256, 200, (g, w, h) => {
    g.fillStyle = '#24402f'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8e6d8'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 30px ${F.sans}`; g.fillText('Д-2', w / 2, 36); g.font = `600 22px ${F.sans}`; g.fillText('«НАРОДОВОЛЕЦ»', w / 2, 76); g.font = `500 17px ${F.sans}`; g.fillText('музей-подводная лодка', w / 2, 116); g.fillText('филиал ЦВМ', w / 2, 142); g.fillRect(24, 160, w - 48, 3);
  }, 'museum', [1, 1]);
  /** the foundation stone inscription plate: seven lines, 0.9 x 0.7 m (the OSM inscription text) */
  A.stonePlate = D(512, 400, (g, w, h) => {
    g.fillStyle = '#cfcab8'; g.fillRect(0, 0, w, h); g.fillStyle = '#3c3a34'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 27px ${F.serif}`;
    const lines = ['К 100-летию подводного', 'флота России здесь будет', 'установлена рубка головного', 'атомного подводного ракетоносца', '«К-137» и создан мемориальный', 'музейный комплекс посвященный', 'морякам-подводникам'];
    lines.forEach((t, i) => g.fillText(t, w / 2, 34 + i * 50));
  }, 'stonePlate', [1, 1]);

  // ------------------------------------------------------------------------------------------ torpedo boat monument
  /** riveted boat plates, lilac grey: tile 2.4 x 1.2 m, a seam every 0.6 m, rivet rows */
  A.boat = D(256, 128, (g, w, h) => {
    const r = R(9301); g.fillStyle = '#f2f2f6'; g.fillRect(0, 0, w, h);
    for (let c = 0; c < 4; c++) { const x = c * w / 4; g.fillStyle = 'rgba(50,54,66,0.30)'; g.fillRect(x, 0, 2, h); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x + 2, 0, 2, h); g.fillStyle = 'rgba(50,54,66,0.28)'; for (let y = 6; y < h; y += 11) { g.fillRect(x + 8, y, 3, 3); g.fillRect(x + w / 4 - 12, y, 3, 3); } }
    g.fillStyle = 'rgba(50,54,66,0.2)'; g.fillRect(0, h / 2, w, 2); g.fillStyle = 'rgba(50,54,66,0.2)'; g.fillRect(0, 0, w, 2);
    for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(90,86,96,${0.05 + r() * 0.08})`; g.fillRect(r() * w, r() * h, 4 + r() * 24, 2 + r() * 8); }
  }, 'boat');
  /** grey granite plinth: slab joints every 1.4 m (tile 2.8 x 2.4 m), polished face */
  A.plinth = D(256, 220, (g, w, h) => {
    const r = R(9311); g.fillStyle = '#6e7176'; g.fillRect(0, 0, w, h);
    for (let c = 0; c < 2; c++) for (let row = 0; row < 2; row++) { const v = 0.95 + r() * 0.1; g.fillStyle = `rgb(${150 * v | 0},${153 * v | 0},${158 * v | 0})`; g.fillRect(c * 128 + 2, row * 110 + 2, 124, 106); }
    speckle(g, w, h, 9312, 300, 0.07);
  }, 'plinth');
  /** the plinth lettering on the long face (17.0 x 2.4 m, canvas 1024 x 144): «1941-45» in dark red, the dedication in gold */
  A.plinthText = D(1024, 144, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.textBaseline = 'alphabetic';
    g.font = `700 92px ${F.sans}`; g.textAlign = 'left'; g.fillStyle = '#9b3a2a'; g.fillText('1941-45', 40, 92);
    g.font = `600 30px ${F.sans}`; g.fillStyle = '#c5a14a'; g.textAlign = 'left';
    const t = 'ГЕРОИЧЕСКИМ МОРЯКАМ ТОРПЕДНЫХ КАТЕРОВ БАЛТИКИ'; const tw = g.measureText(t).width;
    g.save(); g.translate(40, 128); g.scale(Math.min(1.6, (w - 120) / tw), 1); g.fillText(t, 0, 0); g.restore();
  }, 'plinthText', [1, 1]);
  /** the bronze board with the plaque text (verbatim from photo t03), 0.55 x 0.40 m (canvas 1024 x 744) */
  A.plaque = D(1024, 744, (g, w, h) => {
    g.fillStyle = '#b79a4a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8f7630'; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#26412f'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const lines = [['КАТЕР-ПАМЯТНИК ГЕРОИЧЕСКИМ МОРЯКАМ ТОРПЕДНЫХ КАТЕРОВ', 1], ['КРАСНОЗНАМЕННОГО БАЛТИЙСКОГО ФЛОТА', 1], ['', 0],
      ['Моряки торпедных катеров активно участвовали в обороне и снятии блокады', 0], ['Ленинграда, в годы Великой Отечественной войны 1941-1945гг.,', 0], ['на дальних и ближних подступах к городу (на п/о Ханко,', 0],
      ['Моонзундских островах, Выборгском заливе, южной части Балтики.)', 0], ['Торпедные катера КБФ за годы войны потопили 119 и повредили 36 кораблей', 0],
      ['и судов противника, выставили более 2000 мин, участвовали в 12 десантных операциях.', 0], ['Бригада торпедных катеров КБФ награждена орденами', 0], ['Красного Знамени и Нахимова I степени.', 0],
      ['Одному из дивизионов бригады присвоено звание гвардейского.', 0], ['Одиннадцать катерников удостоены звания Героя Советского Союза,', 0], ['многие награждены орденами и медалями.', 0]];
    lines.forEach(([t, bold], i) => { if (!t) return; let s = bold ? 29 : 27; g.font = `${bold ? 700 : 500} ${s}px ${F.sans}`; while (s > 12 && g.measureText(t).width > w - 70) { s--; g.font = `${bold ? 700 : 500} ${s}px ${F.sans}`; } g.fillText(t, w / 2, 62 + i * 45); });
  }, 'plaque', [1, 1]);
  /** herringbone-ish brick pavers, brick red: tile 2 x 2 m (20 x 10 cm) */
  A.brick = D(256, 256, (g, w, h) => {
    const r = R(9321), pw = w / 10, ph = h / 20; g.fillStyle = '#6b4038'; g.fillRect(0, 0, w, h);
    for (let y = 0, row = 0; y < h; y += ph, row++) for (let x = -(row % 2) * pw / 2; x < w; x += pw) { const v = 0.88 + r() * 0.24; g.fillStyle = `rgb(${172 * v | 0},${96 * v | 0},${80 * v | 0})`; g.fillRect(x + 0.8, y + 0.8, pw - 1.6, ph - 1.6); }
  }, 'brick');
  /** the star on the bow flank: reuse A.star */

  // ------------------------------------------------------------------------------------------ Lenexpo hoarding: galvanised ribbed sheets, ribs 0.2 m: tile 2 x 2 m
  A.hoard = D(128, 128, (g, w, h) => {
    const r = R(9401); g.fillStyle = '#b4bbbe'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(i * 12.8, 0, 4, h); g.fillStyle = 'rgba(60,70,76,0.2)'; g.fillRect(i * 12.8 + 8, 0, 4.8, h); }
    for (let i = 0; i < 20; i++) { g.fillStyle = `rgba(110,98,86,${0.06 + r() * 0.1})`; g.fillRect(r() * w, r() * h * 0.4, 1.5 + r() * 3, h * (0.2 + r() * 0.8)); }
    g.fillStyle = 'rgba(70,76,80,0.3)'; g.fillRect(0, h - 3, w, 3);
  }, 'hoard');
  /** blue-white diagonal stripes of the checkpoint hoarding (photo a06): tile 1.8 x 1.8 m */
  A.stripes = D(128, 128, (g, w, h) => {
    g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h); g.fillStyle = '#2c4f9e';
    for (let k = -2; k < 5; k++) { g.beginPath(); g.moveTo(k * 32, 0); g.lineTo(k * 32 + 16, 0); g.lineTo(k * 32 + 16 + h, h); g.lineTo(k * 32 + h, h); g.closePath(); g.fill(); }
  }, 'stripes');
  /** green welded mesh panels on white: transparent mesh cut-out 3 x 2 m */
  A.mesh = D(128, 85, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#6a8f77'; g.lineWidth = 1.6;
    for (let x = 0; x <= w; x += 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y <= h; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = '#2f7a4a'; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3);
  }, 'mesh', [1, 1]);
  return A;
}
