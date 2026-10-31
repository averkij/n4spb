// landmarksYelaginKitchen/art.js - the canvas paintings of the module (dossier docs/research/yelagin-palace-2026.md 6.1, 6.2, 8; photos kit_01 kit_02 kit_04 kit_06 kit_08 kit_09 kit_12 kit_13 kit_14 misc_01).
//   plaster   neutral stucco (multiplied by the wall colour);  plinth  the tan limestone courses of the base (tile 1.1 x 1.1 m: six courses of 0.183 m);  bands  the three grooved white bands above it (tile 1.0 x 0.525 m);
//   zinc  standing-seam roof (tile 1.2 m);  door  the wooden double door 2.5 x 3.7 m (two leaves, 4 x 2 raised panels each, weathered natural wood #b88a52);  fan  the half-round shell relief of the arched niches
//   (radial palmette ribs, alpha-free, painted for the lunette face);  festoon  the garland frieze of the north portico (mascarons, swags, torches; tile 3.6 x 0.65 m);  plaques  an ATLAS of the 14 statue plaques (4 x 4 cells of 256 x 144: name, sculptor, stone and year, as on the stainless plate of photo misc_01);  spears  the white iron fence panel with
//   spear heads (alpha cut-out, one bay 2.4 x 1.6 m).
// Every key starts with 'lmyek-' (the texture cache is scene-wide).
const TAU = Math.PI * 2;
export const COL = {
  wall: '#eeeeea', white: '#f7f7f3', plinth: '#d6c9a6', zinc: '#aab2b7', zincDark: '#6d767c', stoneGrey: '#8d949e', door: '#b88a52', statue: '#d9ceb7', statueDark: '#bdb198', iron: '#f1f0ea', ironDark: '#5d656c', lantern: '#1d2226',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {};
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmyek-' + key, repeat });
  const R = (seed) => ctx.rng(seed);
  const speckle = (g, w, h, seed, n, a = 0.1, size = 2.5) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,32'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * size, 1 + r() * size); } };

  A.plaster = D(256, 256, (g, w, h) => {
    const r = R(8101);
    g.fillStyle = '#f6f6f3'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const x = r() * w, y = r() * h, s = 14 + r() * 40; g.fillStyle = `rgba(${r() < 0.5 ? '208,210,214' : '255,255,255'},${0.02 + r() * 0.03})`; g.beginPath(); g.ellipse(x, y, s, s * (0.5 + r() * 0.6), r() * TAU, 0, TAU); g.fill(); }
    for (let i = 0; i < 3; i++) { const x = r() * w; g.fillStyle = `rgba(120,126,136,${0.015 + r() * 0.02})`; g.fillRect(x, 0, 3 + r() * 6, h); }       // faint rain streaks
    speckle(g, w, h, 8102, 420, 0.05, 2);
  }, 'plaster');

  A.plinth = D(256, 256, (g, w, h) => {                       // tan limestone plates: six courses of 0.183 m in a 1.1 x 1.1 m tile, blocks 1.1 m long staggered course by course
    const r = R(8111), nc = 6, ch = h / nc;
    g.fillStyle = '#9d9478'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < nc; k++) {
      const off = ((k * 97) % 256), bw = 256, v = 0.9 + r() * 0.16;
      for (const x of [off - 256, off]) {
        const vv = 0.9 + r() * 0.16;
        g.fillStyle = `rgb(${226 * vv | 0},${214 * vv | 0},${180 * vv | 0})`; g.fillRect(x + 1.5, k * ch + 1.2, bw - 3, ch - 2.4);
        for (let i = 0; i < 3; i++) { g.fillStyle = `rgba(110,98,70,${0.05 + r() * 0.1})`; g.fillRect(x + r() * bw * 0.8, k * ch + r() * ch, 14 + r() * 50, 1.2); }
      }
      void v;
    }
    for (let i = 0; i < 6; i++) { const x = r() * w; g.fillStyle = `rgba(60,70,60,${0.04 + r() * 0.06})`; g.fillRect(x, 0, 3 + r() * 8, h); }
    speckle(g, w, h, 8112, 500, 0.07, 2.5);
  }, 'plinth');

  A.bands = D(128, 64, (g, w, h) => {                         // three grooved bands: a dark groove with a light lip at the foot of each (tile 1.0 x 0.525 m)
    g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) {
      const y = i * h / 3;
      g.fillStyle = 'rgba(110,116,126,0.75)'; g.fillRect(0, y, w, 3.2);
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(0, y + 3.2, w, 2);
      g.fillStyle = 'rgba(120,126,136,0.10)'; g.fillRect(0, y + 5, w, h / 3 - 5);
    }
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(110,116,126,0.45)'; g.fillRect((i * 23 + 11) % w, ((i % 3) * h / 3) + 6, 1.4, h / 3 - 6); }          // short vertical joints
  }, 'bands');

  A.zinc = D(256, 256, (g, w, h) => {
    const r = R(8151);
    g.fillStyle = '#eef0f2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) {
      const x = i * 128, v = 0.94 + r() * 0.1; g.fillStyle = `rgba(${215 * v | 0},${222 * v | 0},${228 * v | 0},0.5)`; g.fillRect(x, 0, 128, h);
      g.fillStyle = 'rgba(70,78,88,0.45)'; g.fillRect(x, 0, 4, h); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(x + 4, 0, 3, h); g.fillStyle = 'rgba(70,78,88,0.2)'; g.fillRect(x + 7, 0, 3, h);
    }
    speckle(g, w, h, 8152, 220, 0.06, 2);
  }, 'zinc');

  A.door = D(256, 384, (g, w, h) => {                         // u 0..1 over 2.5 m, v 0..1 over 3.7 m: two leaves of weathered natural wood with 4 x 2 raised panels
    const r = R(8161);
    g.fillStyle = '#9a6e3c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '210,160,100' : '90,60,30'},${0.08 + r() * 0.12})`; g.fillRect(r() * w, r() * h, 1.5 + r() * 3, 14 + r() * 80); }
    for (let leaf = 0; leaf < 2; leaf++) for (let row = 0; row < 4; row++) for (let col = 0; col < 2; col++) {
      const x0 = leaf * 128 + 10 + col * 54, y0 = 14 + row * 92 + (row === 3 ? 10 : 0), pw = 48, ph = row === 3 ? 66 : 80;
      g.fillStyle = '#ba8c55'; g.fillRect(x0, y0, pw, ph);
      g.strokeStyle = 'rgba(70,45,20,0.8)'; g.lineWidth = 2; g.strokeRect(x0, y0, pw, ph);
      g.fillStyle = 'rgba(255,225,170,0.35)'; g.fillRect(x0 + 2, y0 + 2, pw - 4, 3); g.fillRect(x0 + 2, y0 + 2, 3, ph - 4);
      g.fillStyle = 'rgba(60,38,16,0.3)'; g.fillRect(x0 + 3, y0 + ph - 5, pw - 5, 3);
    }
    g.fillStyle = 'rgba(40,24,10,0.9)'; g.fillRect(w / 2 - 1.5, 0, 3, h); g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h);          // the meeting stile and the frame
    g.fillStyle = '#3a342c'; g.beginPath(); g.arc(w / 2 - 12, h * 0.52, 5, 0, TAU); g.arc(w / 2 + 12, h * 0.52, 5, 0, TAU); g.fill();           // two handles
    speckle(g, w, h, 8162, 300, 0.06, 2);
  }, 'door');

  A.fan = D(256, 128, (g, w, h) => {                          // the shell of an arched niche: half disc u 0..1 across, v 0..1 up; ribs radiate from the bottom centre
    g.fillStyle = '#e4e4df'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h, n = 17;
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n, am = (a0 + a1) / 2;
      const g2 = g.createLinearGradient(cx + Math.cos(a0) * 120, cy - Math.sin(a0) * 120, cx + Math.cos(a1) * 120, cy - Math.sin(a1) * 120);
      g2.addColorStop(0, 'rgba(255,255,255,0.95)'); g2.addColorStop(0.5, 'rgba(236,236,230,0.9)'); g2.addColorStop(1, 'rgba(150,154,162,0.8)');
      g.fillStyle = g2; g.beginPath(); g.moveTo(cx + Math.cos(am) * 22, cy - Math.sin(am) * 22); g.arc(cx, cy, w / 2 - 6, -a1, -a0); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(100,106,116,0.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx + Math.cos(a0) * 22, cy - Math.sin(a0) * 22); g.lineTo(cx + Math.cos(a0) * (w / 2 - 6), cy - Math.sin(a0) * (w / 2 - 6)); g.stroke();
      g.strokeStyle = 'rgba(110,116,126,0.55)'; g.beginPath(); g.moveTo(cx + Math.cos(am) * 40, cy - Math.sin(am) * 40); g.lineTo(cx + Math.cos(am) * (w / 2 - 20), cy - Math.sin(am) * (w / 2 - 20)); g.stroke();
    }
    g.fillStyle = '#f6f6f2'; g.beginPath(); g.arc(cx, cy, 30, Math.PI, 0); g.fill(); g.strokeStyle = 'rgba(100,106,116,0.7)'; g.lineWidth = 2;
    for (let i = 0; i < 7; i++) { const a = Math.PI * (i + 0.5) / 7; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 28, cy - Math.sin(a) * 28); g.stroke(); }
    g.strokeStyle = 'rgba(110,116,126,0.8)'; g.beginPath(); g.arc(cx, cy, 30, Math.PI, 0); g.stroke(); g.beginPath(); g.arc(cx, cy, w / 2 - 6, Math.PI, 0); g.stroke();
  }, 'fan');

  A.festoon = D(512, 92, (g, w, h) => {                       // north portico frieze: mascarons in round medallions, swags, vertical torches (tile 3.6 x 0.65 m = 4 bays)
    g.fillStyle = '#e8e8e3'; g.fillRect(0, 0, w, h);
    const bay = w / 4;
    for (let k = 0; k < 4; k++) {
      const x0 = k * bay;
      g.fillStyle = '#f7f7f3'; g.strokeStyle = 'rgba(100,106,116,0.85)'; g.lineWidth = 2.4;
      g.beginPath(); g.arc(x0 + bay / 2, 34, 22, 0, TAU); g.fill(); g.stroke();                                                           // medallion with a face
      g.fillStyle = 'rgba(190,194,200,0.9)'; g.beginPath(); g.arc(x0 + bay / 2, 34, 14, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = 'rgba(90,96,106,0.9)'; g.fillRect(x0 + bay / 2 - 7, 29, 4, 3); g.fillRect(x0 + bay / 2 + 3, 29, 4, 3); g.fillRect(x0 + bay / 2 - 3, 41, 6, 2);
      g.strokeStyle = 'rgba(100,106,116,0.9)'; g.lineWidth = 7; g.beginPath(); g.moveTo(x0 + 12, 14); g.quadraticCurveTo(x0 + bay / 2, h * 1.3, x0 + bay - 12, 14); g.stroke();       // swag
      g.strokeStyle = '#f7f7f3'; g.lineWidth = 4.5; g.beginPath(); g.moveTo(x0 + 12, 14); g.quadraticCurveTo(x0 + bay / 2, h * 1.3, x0 + bay - 12, 14); g.stroke();
      g.fillStyle = '#f7f7f3'; g.strokeStyle = 'rgba(100,106,116,0.85)'; g.lineWidth = 2;
      g.beginPath(); g.rect(x0 - 5, 8, 10, h - 16); g.fill(); g.stroke();                                                                 // torch / pilaster strip between the bays
      g.fillStyle = 'rgba(100,106,116,0.5)'; for (let i = 0; i < 4; i++) g.fillRect(x0 - 5, 18 + i * 16, 10, 2);
    }
  }, 'festoon');

  A.spears = D(256, 170, (g, w, h) => {                       // white iron fence bay 2.4 x 1.6 m: round pickets 0.12 m apart with spear heads, two rails, a ring chain between the rails (alpha)
    g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.strokeStyle = '#ffffff'; g.lineCap = 'round';
    const n = 20;
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * w / n;
      g.lineWidth = 3; g.beginPath(); g.moveTo(x, 20); g.lineTo(x, h); g.stroke();
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 4.5, 20); g.lineTo(x, 15); g.lineTo(x - 4.5, 20); g.closePath(); g.fill();
    }
    g.lineWidth = 5; g.beginPath(); g.moveTo(0, 36); g.lineTo(w, 36); g.moveTo(0, h - 22); g.lineTo(w, h - 22); g.stroke();
    g.lineWidth = 2.5; for (let i = 0; i < n / 2; i++) { g.beginPath(); g.arc((i + 0.5) * w / (n / 2), 52, 9, 0, TAU); g.stroke(); }
  }, 'spears');

  A.plaques = D(1024, 576, (g, w, h) => {                     // atlas 4 x 4 of 256 x 144: the stainless plate of a statue (dark steel, light engraving)
    g.fillStyle = '#20262c'; g.fillRect(0, 0, w, h);
    const PL = ['Весталка', 'Юнона', 'Вакх', 'Флора', 'Мелеагр', 'Афина', 'Психея', 'Церера', 'Жрица', 'Адонис', 'Латона /Лето/', 'Меркурий', 'Артемида', 'Аполлон'];
    for (let i = 0; i < PL.length; i++) {
      const cx = (i % 4) * 256, cy = Math.floor(i / 4) * 144;
      g.fillStyle = '#b9c0c6'; g.fillRect(cx + 4, cy + 4, 248, 136);
      g.fillStyle = '#d7dce0'; g.fillRect(cx + 7, cy + 7, 242, 130);
      g.fillStyle = '#30363c'; g.textAlign = 'center'; g.textBaseline = 'middle';
      tex.fitText(g, PL[i].toUpperCase(), cx + 128, cy + 34, 210, 30, tex.FONTS.sans, 700);
      g.fillStyle = 'rgba(48,54,60,0.55)'; for (let k = 0; k < 3; k++) g.fillRect(cx + 26, cy + 62 + k * 8, 204 - (k === 2 ? 60 : 0), 2.4);
      g.fillStyle = '#30363c';
      tex.fitText(g, 'Скульптор С. С. Пименов', cx + 128, cy + 102, 200, 17, tex.FONTS.sans, 500);
      tex.fitText(g, 'Пудожский камень. 1822 г.', cx + 128, cy + 123, 200, 16, tex.FONTS.sans, 500);
    }
  }, 'plaques');
  return A;
}
