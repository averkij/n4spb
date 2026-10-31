// landmarksTransfiguration/art.js - the canvas paintings of the church, the terrace and the bunker (every texture key starts with 'lmTF-'; photos refs/aptekarsky 65 66 and refs/transfiguration 04..16):
//   plaster   the weathered ochre stucco of the church walls (#d6a255, trowel patches, a few damp stains; tile 3 m)
//   rustic    the rusticated ground floor: four courses of 0.625 m, blocks of 1.25 m staggered, deep joints (tile 2.5 m)
//   granite   the smooth pale grey granite of the plinth, the portal steps and the coping (slab joints every 1.25 m; tile 2.5 m)
//   rubble    the rough grey-brown granite rubble of the retaining wall of Instrumentalnaya (photos 65 66 14; tile 3 m)
//   lawn      the mown grass of the terrace and the hedge (tiles 4 m and 2 m)
//   soil      the earth and leaf litter of the mound over the bunker (tile 3 m)
//   armour    the dark riveted ship armour of the bunker walls (tile 2.4 m), armourRed the red-painted riveted plates round the door (tile 1.2 m)
//   win       ONE atlas: barred rectangular window, barred arched window, the church door, the small window, the name board, the red bunker board (uv rectangles in ATLAS)
const TAU = Math.PI * 2;
// uv rectangles of the atlas (u0, v0, u1, v1; v up): 1024 x 1024 px
const px = (x, y, w, h) => [x / 1024, 1 - (y + h) / 1024, (x + w) / 1024, 1 - y / 1024];
export const ATLAS = {
  rect: px(0, 0, 256, 384),          // 1.0 x 1.5 m window: dark glass, brown bars, black grille
  arch: px(256, 0, 256, 512),        // 0.95 x 1.85 m round-headed window
  door: px(512, 0, 256, 448),        // 1.5 x 2.6 m: the church door, shut
  small: px(768, 0, 256, 320),       // 0.8 x 1.0 m window of the gable band and the drum
  name: px(0, 512, 1024, 112),       // 3.6 x 0.39 m name board over the door
  board: px(0, 624, 320, 400),       // 1.04 x 1.3 m red board of the bunker
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {};
  const D = (w, h, fn, key, o = {}) => tex.draw(w, h, fn, { key: 'lmTF-' + key, repeat: [1, 1], ...o });
  const rr = (seed) => ctx.rng(seed);
  const speckle = (g, w, h, r, n, a = 0.1) => { for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(255,236,200,${a})` : `rgba(60,40,20,${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); } };

  // ---------------------------------------------------------------------------------------------- ochre stucco (photo 65: #d6a255 with a warm orange cast, peeling patches)
  A.plaster = D(256, 256, (g, w, h) => {
    const r = rr(6501); g.fillStyle = '#d6a255'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,214,150,0.12)' : 'rgba(150,90,30,0.10)'; g.beginPath(); g.ellipse(r() * w, r() * h, 14 + r() * 40, 8 + r() * 22, r() * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(120,70,30,0.10)'; g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 14, 16 + r() * 30, 0, 0, TAU); g.fill(); }
    speckle(g, w, h, r, 1500, 0.1);
  }, 'plaster');

  // ---------------------------------------------------------------------------------------------- rusticated ground floor
  A.rustic = D(512, 512, (g, w, h) => {
    const r = rr(6502), rows = 4, rh = h / rows, bw = w / 2;
    g.fillStyle = '#9c6c34'; g.fillRect(0, 0, w, h);
    const tones = ['#d9ac64', '#d2a45a', '#dcb06a', '#cf9f56', '#d6a85f'];
    for (let j = 0; j < rows; j++) {
      const off = (j % 2) * bw / 2;
      for (let i = -1; i < 3; i++) {
        const x = i * bw + off, y = j * rh;
        g.fillStyle = tones[(r() * tones.length) | 0]; g.fillRect(x + 5, y + 6, bw - 10, rh - 11);
        g.fillStyle = 'rgba(255,230,170,0.22)'; g.fillRect(x + 5, y + 6, bw - 10, 4);           // top light
        g.fillStyle = 'rgba(90,50,16,0.22)'; g.fillRect(x + 5, y + rh - 11, bw - 10, 5);        // bottom shade
        for (let k = 0; k < 40; k++) { g.fillStyle = r() < 0.5 ? 'rgba(255,230,170,0.10)' : 'rgba(80,44,14,0.10)'; g.fillRect(x + 6 + r() * (bw - 14), y + 8 + r() * (rh - 18), 2 + r() * 8, 1 + r() * 4); }
      }
    }
  }, 'rustic', { anisotropy: 8 });

  // ---------------------------------------------------------------------------------------------- pale grey granite
  A.granite = D(512, 512, (g, w, h) => {
    const r = rr(6503); g.fillStyle = '#a7a9a3'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) { g.fillStyle = r() < 0.5 ? 'rgba(232,234,226,0.18)' : 'rgba(80,86,86,0.14)'; g.beginPath(); g.ellipse(r() * w, r() * h, 14 + r() * 50, 8 + r() * 26, r() * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 1800; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,250,0.22)' : 'rgba(60,64,66,0.22)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
    g.strokeStyle = 'rgba(66,70,70,0.55)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 2); g.lineTo(w, 2); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.moveTo(w / 2, 0); g.lineTo(w / 2, h / 2); g.moveTo(0, h / 2); g.lineTo(0, h); g.moveTo(w, h / 2); g.lineTo(w, h); g.stroke();
  }, 'granite', { anisotropy: 8 });

  // ---------------------------------------------------------------------------------------------- granite rubble of the retaining wall
  A.rubble = D(512, 512, (g, w, h) => {
    const r = rr(6504), tones = ['#6e6a62', '#7b766e', '#605d56', '#847f77', '#736f68', '#8a867d', '#57544e', '#938e84'];
    g.fillStyle = '#8f897c'; g.fillRect(0, 0, w, h);
    let y = 0;
    while (y < h - 4) {
      const rh = Math.min(h - y, 32 + r() * 44); let x = -r() * 60;
      while (x < w) {
        const bw = 44 + r() * 90; g.fillStyle = tones[(r() * tones.length) | 0];
        g.beginPath(); const x0 = x + 2, y0 = y + 2, x1 = x + bw - 2, y1 = y + rh - 2, j = () => r() * 9;
        g.moveTo(x0 + j(), y0 + j() * 0.6); g.lineTo(x1 - j(), y0 + j() * 0.6); g.lineTo(x1 - j() * 0.5, y1 - j()); g.lineTo(x0 + j() * 0.5, y1 - j() * 0.7); g.closePath(); g.fill();
        for (let k = 0; k < 10; k++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,245,0.12)' : 'rgba(20,20,18,0.20)'; g.fillRect(x + 3 + r() * (bw - 10), y + 3 + r() * (rh - 10), 2 + r() * 12, 2 + r() * 6); }
        x += bw;
      }
      y += rh;
    }
    for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(150,170,110,0.2)'; g.fillRect(r() * w, r() * h, 2 + r() * 8, 2 + r() * 4); }       // lichen
  }, 'rubble', { anisotropy: 8 });

  // ---------------------------------------------------------------------------------------------- lawn and hedge
  A.lawn = D(256, 256, (g, w, h) => {
    const r = rr(6505); g.fillStyle = '#6f9b4c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? 'rgba(160,200,100,0.14)' : 'rgba(40,90,30,0.14)'; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 30, 6 + r() * 16, r() * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 1400; i++) { g.fillStyle = r() < 0.5 ? 'rgba(190,225,130,0.28)' : 'rgba(30,70,24,0.28)'; g.fillRect(r() * w, r() * h, 1, 2 + r() * 3); }
  }, 'lawn');
  A.hedge = D(256, 256, (g, w, h) => {
    const r = rr(6506); g.fillStyle = '#30632c'; g.fillRect(0, 0, w, h);
    const tones = ['#3f7a35', '#4a8a3b', '#35692f', '#548f40', '#2c5a2a'];
    for (let i = 0; i < 260; i++) { g.fillStyle = tones[(r() * tones.length) | 0]; g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 14, 5 + r() * 10, r() * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 400; i++) { g.fillStyle = r() < 0.5 ? 'rgba(200,235,140,0.22)' : 'rgba(10,36,12,0.28)'; g.fillRect(r() * w, r() * h, 2 + r() * 4, 2 + r() * 3); }
  }, 'hedge');

  // ---------------------------------------------------------------------------------------------- soil with leaf litter (the mound over the bunker)
  A.soil = D(256, 256, (g, w, h) => {
    const r = rr(6507); g.fillStyle = '#5d6a3a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? 'rgba(120,100,60,0.30)' : 'rgba(50,70,30,0.30)'; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 30, 6 + r() * 16, r() * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.6 ? 'rgba(138,106,44,0.55)' : 'rgba(96,120,52,0.5)'; g.beginPath(); g.ellipse(r() * w, r() * h, 1.6 + r() * 2.6, 1.0 + r() * 1.6, r() * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? 'rgba(160,140,100,0.30)' : 'rgba(20,16,10,0.30)'; g.fillRect(r() * w, r() * h, 1, 1 + r() * 2); }
  }, 'soil');

  // ---------------------------------------------------------------------------------------------- ship armour (photos 10 11 12 13): dark steel plates, rivet rows, rust
  A.armour = D(512, 512, (g, w, h) => {
    const r = rr(6508); g.fillStyle = '#4a4944'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? 'rgba(120,80,48,0.20)' : 'rgba(30,30,28,0.22)'; g.beginPath(); g.ellipse(r() * w, r() * h, 18 + r() * 60, 10 + r() * 30, r() * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? 'rgba(140,76,40,0.30)' : 'rgba(18,18,16,0.30)'; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
    g.strokeStyle = 'rgba(14,14,12,0.7)'; g.lineWidth = 3;                                                                       // plate joints
    g.beginPath(); g.moveTo(0, 2); g.lineTo(w, 2); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.moveTo(w / 2, 0); g.lineTo(w / 2, h / 2); g.moveTo(w * 0.2, h / 2); g.lineTo(w * 0.2, h); g.stroke();
    for (const yy of [14, h / 2 - 14, h / 2 + 14, h - 14]) for (let x = 14; x < w; x += 26) { g.fillStyle = '#2c2b27'; g.beginPath(); g.arc(x, yy, 5, 0, TAU); g.fill(); g.fillStyle = 'rgba(190,190,176,0.35)'; g.beginPath(); g.arc(x - 1.4, yy - 1.4, 2, 0, TAU); g.fill(); }
  }, 'armour', { anisotropy: 8 });
  A.armourRed = D(256, 256, (g, w, h) => {
    const r = rr(6509); g.fillStyle = '#8a2f26'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? 'rgba(220,120,90,0.14)' : 'rgba(40,10,8,0.20)'; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 4); }
    for (const yy of [16, h - 16]) for (let x = 12; x < w; x += 24) { g.fillStyle = '#5b1d17'; g.beginPath(); g.arc(x, yy, 5.5, 0, TAU); g.fill(); g.fillStyle = 'rgba(240,160,130,0.35)'; g.beginPath(); g.arc(x - 1.5, yy - 1.5, 2.2, 0, TAU); g.fill(); }
    g.strokeStyle = 'rgba(40,8,6,0.55)'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
  }, 'armourRed');

  // ---------------------------------------------------------------------------------------------- the atlas of windows, door, boards
  const glass = (g, x, y, w, h) => {
    const gr = g.createLinearGradient(x, y, x + w * 0.6, y + h); gr.addColorStop(0, '#46586a'); gr.addColorStop(0.5, '#2b3946'); gr.addColorStop(1, '#1e2832');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(190,210,225,0.20)'; g.beginPath(); g.moveTo(x + w * 0.1, y + h * 0.9); g.lineTo(x + w * 0.5, y + h * 0.1); g.lineTo(x + w * 0.7, y + h * 0.1); g.lineTo(x + w * 0.3, y + h * 0.9); g.closePath(); g.fill();
  };
  const bars = (g, x, y, w, h, nv, nh) => {                       // the black iron grille in front
    g.strokeStyle = '#141618'; g.lineWidth = 4;
    for (let i = 1; i < nv; i++) { const xx = x + w * i / nv; g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y + h); g.stroke(); }
    g.lineWidth = 3; for (let j = 1; j < nh; j++) { const yy = y + h * j / nh; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); }
  };
  const sash = (g, x, y, w, h, tx) => {                           // the brown wooden bars: one mullion and transoms
    g.strokeStyle = '#4b3826'; g.lineWidth = 8; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.stroke();
    g.lineWidth = 7; for (const t of tx) { g.beginPath(); g.moveTo(x, y + h * t); g.lineTo(x + w, y + h * t); g.stroke(); }
  };
  A.win = D(1024, 1024, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    // rect 256 x 384
    glass(g, 0, 0, 256, 384); sash(g, 0, 0, 256, 384, [0.36, 0.7]); bars(g, 0, 0, 256, 384, 5, 4);
    g.strokeStyle = '#25190f'; g.lineWidth = 10; g.strokeRect(5, 5, 246, 374);
    // arch 256 x 512: round head (radius 128)
    g.save(); g.beginPath(); g.moveTo(256, 512); g.lineTo(512, 512); g.lineTo(512, 128); g.arc(384, 128, 128, 0, Math.PI, true); g.lineTo(256, 512); g.closePath(); g.clip();
    glass(g, 256, 0, 256, 512); sash(g, 256, 0, 256, 512, [0.4, 0.72]); bars(g, 256, 0, 256, 512, 5, 5); g.restore();
    g.strokeStyle = '#25190f'; g.lineWidth = 8; g.beginPath(); g.moveTo(262, 512); g.lineTo(262, 128); g.arc(384, 128, 122, Math.PI, 0, false); g.lineTo(506, 512); g.stroke();
    // door 256 x 448: dark-brown double leaf with panels and a glazed transom
    g.fillStyle = '#2b2018'; g.fillRect(512, 0, 256, 448);
    glass(g, 524, 12, 232, 100); g.strokeStyle = '#161616'; g.lineWidth = 5; for (const xx of [582, 640, 698]) { g.beginPath(); g.moveTo(xx, 12); g.lineTo(xx, 112); g.stroke(); }
    for (let k = 0; k < 2; k++) {
      const x0 = 520 + k * 120, ww = 112; g.fillStyle = '#3b2a1c'; g.fillRect(x0, 124, ww, 316);
      for (const [yy, hh] of [[140, 132], [286, 60], [358, 74]]) { g.fillStyle = '#4a3624'; g.fillRect(x0 + 10, yy, ww - 20, hh); g.strokeStyle = '#1c130c'; g.lineWidth = 3; g.strokeRect(x0 + 12, yy + 2, ww - 24, hh - 4); }
    }
    g.fillStyle = '#c9a33e'; g.fillRect(636, 262, 6, 30); g.fillRect(646, 262, 6, 30);
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(639, 120, 3, 326);
    // small 256 x 320
    glass(g, 768, 0, 256, 320); sash(g, 768, 0, 256, 320, [0.5]); g.strokeStyle = '#d9d4c6'; g.lineWidth = 12; g.strokeRect(774, 6, 244, 308);
    // name board 1024 x 112: pale grey board, dark letters (photo 65: "ХРАМ ПРЕОБРАЖЕНИЯ ГОСПОДНЯ")
    g.fillStyle = '#c9c7bd'; g.fillRect(0, 512, 1024, 112); g.strokeStyle = '#6a6860'; g.lineWidth = 5; g.strokeRect(3, 515, 1018, 106);
    g.fillStyle = '#3a3a36'; g.textAlign = 'center'; g.textBaseline = 'middle';
    tex.fitText(g, 'ХРАМ ПРЕОБРАЖЕНИЯ ГОСПОДНЯ', 512, 570, 960, 74, tex.FONTS.serif, 700);
    // red board of the bunker 320 x 400: "ПАМЯТНИК ИСТОРИИ 1942-1945 / «БУНКЕР ТРИБУЦА» / the text of the sign (photo refs/transfiguration/10) without telephones
    g.fillStyle = '#d4513f'; g.fillRect(0, 624, 320, 400); g.strokeStyle = '#8a2a20'; g.lineWidth = 5; g.strokeRect(3, 627, 314, 394);
    g.fillStyle = '#f4dcc8'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillRect(150, 650, 20, 4); g.fillRect(158, 640, 4, 30); g.beginPath(); g.arc(160, 646, 7, 0, TAU); g.strokeStyle = '#f4dcc8'; g.lineWidth = 3; g.stroke();            // the small anchor mark
    tex.fitText(g, 'ПАМЯТНИК ИСТОРИИ', 160, 700, 280, 24, tex.FONTS.sans, 700);
    tex.fitText(g, '1942-1945', 160, 730, 200, 22, tex.FONTS.sans, 700);
    tex.fitText(g, '«БУНКЕР ТРИБУЦА»', 160, 782, 290, 34, tex.FONTS.sans, 800);
    const lines = ['Здесь находился', 'флагманский командный', 'пункт Краснознамённого', 'Балтийского флота', '', 'Построен в блокадном', 'Ленинграде', 'из корабельной брони'];
    let yy = 836; for (const t of lines) { if (t) tex.fitText(g, t, 160, yy, 270, 19, tex.FONTS.sans, 600); yy += 22; }
  }, 'win', { repeat: null, anisotropy: 8 });
  return A;
}
