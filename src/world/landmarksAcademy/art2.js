// landmarksAcademy/art2.js - the canvas textures of Trezzini Square and the Academic Garden (every key starts with 'lmacade-'); dossier docs/research/academy.md 5, 6, 7.
//   hotel tiles   the Trezzini house front in three runs (west wing 4 axes, centre 3 axes, east wing 4 axes: window centres measured on th_001: 2.3 4.8 7.3 9.7 | 12.8 15.5 18.1 | 21.2 23.5 25.8 28.1 m
//                 from the west corner): pale yellow plaster #ecdc96, dark granite plinth 0..1.6, rectangular windows, first floor = a window in a round-arched niche over a baluster apron (wings), second floor plain
//   banner        the printed FACADE BANNER on the Cherkassky house (2023, th_012): pink wall, white trim, 3 x 9 flat cyan windows, four giant pilasters with two medallions, string courses and cornice
//   pavilion / mosaic / workshop tiles of the garden buildings, inscriptions of the monuments (Trezzini, Klodt, Khetagurov), the plaques of the column of 1847.
import { painter, COL } from './art.js';

export function makeArt2(ctx, A) {
  const tex = ctx.tex, rnd = (seed) => ctx.rng(seed);
  const bay = (W, H, bw, bh, fn, key, o = {}) => tex.draw(W, H, (g) => fn(painter(g, W, H, bw, bh, o.yb || 0)), o.rep === false ? { key } : { key, repeat: [1, 1] });
  const serif = tex.FONTS ? tex.FONTS.serif : 'serif', hand = tex.FONTS ? tex.FONTS.hand : 'cursive';
  const fit = (g, t, w, px, font, weight = 'bold') => { let s = px; g.font = `${weight} ${s}px ${font}`; while (g.measureText(t).width > w && s > 10) { s -= 2; g.font = `${weight} ${s}px ${font}`; } return s; };

  // ------------------------------------------------------------------------------------------------ the Trezzini house
  const HH = 12.4, HF = '#ecdc96', HO = COL.hotelTrim, HD = '#8a8470';
  const hotelTile = (x0, x1, wins, framed, key) => bay(Math.round((x1 - x0) * 46), 620, x1 - x0, HH, (q) => {
    const bw = x1 - x0, SH = 'rgba(80,70,40,0.24)';
    q.rect(HF, 0, 0, bw, HH); q.rect(COL.hotelPlinth, 0, 0, bw, 1.6); q.joints('#4f453b', 0, 0, bw, 1.6, 0.4, 0.03); q.rect('#8a7e70', 0, 1.52, bw, 1.6);
    q.rect(HO, 0, 4.92, bw, 5.12); q.shade(0, 4.92, bw, 0.05, SH);
    for (const c of wins) {
      const cx = c - x0, fr = framed.has(c);
      if (fr) q.eared(HO, cx - 0.52, 2.3, cx + 0.52, 4.2, 0.12, { sill: 0.1, shade: '#cfc59a' });
      q.win(cx - 0.52, 2.3, cx + 0.52, 4.2, 2, 3, fr ? HO : HD);
      q.arch(HO, cx, 5.4, 1.9, 8.2); q.arch('#dccd84', cx, 5.52, 1.66, 8.2);
      q.win(cx - 0.58, 5.92, cx + 0.58, 8.3, 2, 4, HO);
      if (!fr) q.balus(HO, cx - 0.62, 5.12, cx + 0.62, 5.92, 'rgba(80,70,40,0.5)');
      if (fr) q.eared(HO, cx - 0.52, 10.1, cx + 0.52, 11.8, 0.11, { sill: 0.08, shade: '#cfc59a' });
      q.win(cx - 0.52, 10.1, cx + 0.52, 11.8, 2, 3, fr ? HO : HD);
    }
    q.rect(HO, 0, 12.18, bw, HH);
  }, key);
  const fr3 = new Set([12.8, 15.5, 18.1]);
  A.hotelW = hotelTile(0, 11.25, [2.3, 4.8, 7.3, 9.7], fr3, 'lmacade-hotel-w');
  A.hotelC = hotelTile(11.25, 19.65, [12.8, 15.5, 18.1], fr3, 'lmacade-hotel-c');
  A.hotelE = hotelTile(19.65, 30.3, [21.2, 23.5, 25.8, 28.1], fr3, 'lmacade-hotel-e');
  A.hotelSide = bay(256, 640, 3.4, HH, (q) => {
    const cx = 1.7; q.rect(HF, 0, 0, 3.4, HH); q.rect(COL.hotelPlinth, 0, 0, 3.4, 1.6); q.joints('#4f453b', 0, 0, 3.4, 1.6, 0.4, 0.03); q.rect(HO, 0, 4.92, 3.4, 5.12);
    q.win(cx - 0.52, 2.3, cx + 0.52, 4.2, 2, 3, HD); q.arch(HO, cx, 5.4, 1.9, 8.2); q.arch('#dccd84', cx, 5.52, 1.66, 8.2); q.win(cx - 0.58, 5.92, cx + 0.58, 8.3, 2, 4, HO); q.win(cx - 0.52, 10.1, cx + 0.52, 11.8, 2, 3, HD); q.rect(HO, 0, 12.18, 3.4, HH);
  }, 'lmacade-hotel-side');
  const lettering = (text, key, w, h, gold = '#b7993f') => tex.draw(1024, Math.round(1024 * h / w), (g, W, H) => {
    g.clearRect(0, 0, W, H); g.fillStyle = gold; g.textAlign = 'center'; g.textBaseline = 'middle'; fit(g, text, W - 20, H * 0.9, serif); g.fillText(text, W / 2, H / 2);
  }, { key });
  A.hotelLetL = lettering('TREZZINI PALACE HOTEL', 'lmacade-hotel-letL', 7.4, 0.5);
  A.hotelLetR = lettering('ОТЕЛЬ ДВОРЕЦ ТРЕЗИНИ', 'lmacade-hotel-letR', 7.4, 0.5);
  A.hotelRoofTex = A.roof;

  // ------------------------------------------------------------------------------------------------ the Cherkassky house: the printed banner 22.7 x 15.5 m and the boarded plaster sides
  A.banner = bay(1024, 700, 22.7, 15.5, (q) => {
    const bw = 22.7, pw = bw / 9, WIN = COL.cherkWin, O = '#f6f2ea', g = q.g;
    q.rect(COL.cherk, 0, 0, bw, 15.5);
    q.rect('#d99a96', 0, 0, bw, 0.5); q.rect(O, 0, 4.0, bw, 4.25); q.rect(O, 0, 9.6, bw, 9.85);
    for (let i = 0; i < 9; i++) {
      const cx = (i + 0.5) * pw;
      q.rect(O, cx - 0.72, 0.7, cx + 0.72, 3.55); q.rect(WIN, cx - 0.6, 0.82, cx + 0.6, 3.43);                     // ground floor: tall
      q.rect(O, cx - 0.72, 5.0, cx + 0.72, 9.1); q.rect(WIN, cx - 0.6, 5.12, cx + 0.6, 8.98);                      // first floor: tall
      q.rect(O, cx - 0.72, 10.5, cx + 0.72, 13.5); q.rect(WIN, cx - 0.6, 10.62, cx + 0.6, 13.38);                  // second floor: shorter
      for (const [a, b] of [[0.82, 3.43], [5.12, 8.98], [10.62, 13.38]]) { q.rect(O, cx - 0.02, a, cx + 0.02, b); q.rect(O, cx - 0.6, (a + b) / 2, cx + 0.6, (a + b) / 2 + 0.04); }
    }
    for (const k of [3, 4, 5, 6]) q.rect(O, k * pw - 0.34, 4.25, k * pw + 0.34, 9.6);                                  // four giant pilasters
    for (const k of [3.5, 5.5]) { q.oval(O, k * pw, 9.2, 0.5, 0.5); q.oval(COL.cherk, k * pw, 9.2, 0.36, 0.36); }
    q.rect(O, 0, 14.2, bw, 15.5); q.rect('#d9d2c4', 0, 14.2, bw, 14.3); q.rect('#2a58a8', 1.5, 2.2, 1.9, 2.5);
  }, 'lmacade-banner', { rep: false });
  A.cherkSide = bay(256, 700, 3.6, 15.5, (q) => {
    const cx = 1.8, B = '#7a6a55';
    q.rect('#c98a7e', 0, 0, 3.6, 15.5); q.rect('#a87266', 0, 0, 3.6, 0.8); q.rect('#e7d3c4', 0, 4.0, 3.6, 4.2); q.rect('#e7d3c4', 0, 9.6, 3.6, 9.8);
    for (const [y0, y1] of [[0.8, 3.5], [5.0, 9.0], [10.4, 13.4]]) { q.rect('#e9ddd0', cx - 0.7, y0, cx + 0.7, y1); q.rect(B, cx - 0.58, y0 + 0.1, cx + 0.58, y1 - 0.1); for (let y = y0 + 0.4; y < y1 - 0.1; y += 0.5) q.rect('#5e5040', cx - 0.58, y, cx + 0.58, y + 0.03); }
    const r = rnd(8801); for (let i = 0; i < 40; i++) q.rect('rgba(70,40,30,0.14)', r() * 3.4, r() * 15, r() * 3.4 + 0.05, r() * 15 + 1.2);
    q.rect('#e9ddd0', 0, 14.3, 3.6, 15.5);
  }, 'lmacade-cherk-side');

  // ------------------------------------------------------------------------------------------------ the garden buildings
  A.pavWing = bay(256, 768, 3.8, 12.0, (q) => {                                   // the 3-storey wings of the garden pavilion complex: pale yellow, white frames, a flat roof
    const cx = 1.9, O = '#f4efe0';
    q.rect(COL.pavilion, 0, 0, 3.8, 12.0); q.rect('#d9c586', 0, 0, 3.8, 0.7);
    for (const [y0, y1, w] of [[1.2, 3.8, 0.55], [4.7, 7.5, 0.55], [8.5, 11.0, 0.5]]) { q.rect(O, cx - w - 0.12, y0 - 0.1, cx + w + 0.12, y1 + 0.12); q.win(cx - w, y0, cx + w, y1, 2, 3, O); }
    q.rect(O, 0, 11.7, 3.8, 12.0);
  }, 'lmacade-pav-wing');
  A.pavRange = bay(256, 640, 5.6, 8.8, (q) => {                                   // the 2-storey range: a large studio window (3.0 x 3.6) under a white hood, small windows above
    const cx = 2.8, O = '#f4efe0';
    q.rect(COL.pavilion, 0, 0, 5.6, 8.8); q.rect('#d9c586', 0, 0, 5.6, 0.7);
    q.rect(O, cx - 1.7, 0.9, cx + 1.7, 4.8); q.rect('#2a343a', cx - 1.55, 1.05, cx + 1.55, 4.65); for (let x = cx - 1.5; x < cx + 1.6; x += 0.5) q.rect('#c8c2b0', x, 1.05, x + 0.04, 4.65); for (let y = 1.6; y < 4.6; y += 0.6) q.rect('#c8c2b0', cx - 1.55, y, cx + 1.55, y + 0.04);
    q.win(cx - 0.45, 5.6, cx + 0.45, 7.4, 2, 3, O); q.rect(O, 0, 8.3, 5.6, 8.8);
  }, 'lmacade-pav-range');
  A.pavFront = bay(512, 384, 14.0, 9.4, (q) => {                                   // the wall behind the portico: rustication at the foot, semicircular second-floor windows, a plain door
    const O = '#f4efe0'; q.rect(COL.pavilion, 0, 0, 14.0, 9.4); q.rect('#d9c586', 0, 0, 14.0, 0.6);
    q.rect('#e6cf8e', 0, 0.6, 14.0, 4.3); for (let y = 1.2; y < 4.3; y += 0.6) q.rect('#c9b46f', 0, y, 14.0, y + 0.04);
    q.rect(O, 5.5, 0.6, 8.5, 3.8); q.rect('#efe8d6', 5.65, 0.7, 8.35, 3.7); q.rect(O, 7.0 - 0.03, 0.7, 7.0 + 0.03, 3.7);
    for (const cx of [2.2, 5.0, 9.0, 11.8]) { q.rect(O, cx - 0.62, 5.1, cx + 0.62, 7.0); q.arch(O, cx, 5.1, 1.24, 6.9); q.archWin(cx, 5.2, 1.0, 2.6, 2, 3, O); }
    q.rect(O, 0, 8.9, 14.0, 9.4);
  }, 'lmacade-pav-front', { rep: false });
  A.mosaic = bay(256, 768, 4.0, 14.0, (q) => {                                    // the Mosaic workshop: ochre plaster, flat-arched windows, big arched studio windows on the top floor
    const cx = 2.0, O = '#f2e8cc';
    q.rect(COL.mosaic, 0, 0, 4.0, 14.0); q.rect('#a98048', 0, 0, 4.0, 0.9);
    for (const [y0, y1] of [[1.4, 4.2], [5.4, 8.3]]) { q.rect(O, cx - 0.78, y0 - 0.1, cx + 0.78, y1 + 0.14); q.win(cx - 0.66, y0, cx + 0.66, y1, 2, 4, O); }
    q.arch(O, cx, 9.6, 2.6, 11.2); q.archWin(cx, 9.7, 2.3, 3.9, 3, 4, O); q.rect(O, 0, 13.6, 4.0, 14.0);
  }, 'lmacade-mosaic');
  A.workshop = bay(256, 256, 4.0, 5.0, (q) => {                                   // the Battle-painting workshop: a one-storey studio with tall windows
    q.rect(COL.workshop, 0, 0, 4.0, 5.0); q.rect('#a8935e', 0, 0, 4.0, 0.6); q.rect('#f2ecd8', 0.5, 1.0, 3.5, 4.2); q.win(0.62, 1.1, 3.38, 4.1, 4, 4, '#f2ecd8'); q.rect('#f2ecd8', 0, 4.6, 4.0, 5.0);
  }, 'lmacade-workshop');
  A.domWall = bay(256, 640, 3.6, 13.8, (q) => {                                   // the House of Academicians: rusticated ground floor with a mask keystone, tall first-floor windows, shorter second-floor windows
    const cx = 1.8, O = '#f1ece0';
    q.rect(COL.domA, 0, 0, 3.6, 13.8); q.rect('#efe3c8', 0, 0, 3.6, 5.8); q.joints('#cdbf9d', 0, 0.8, 3.6, 5.8, 0.5, 0.03); q.rect('#6f6258', 0, 0, 3.6, 0.8);
    q.rect('#4a4a48', cx - 0.45, 0.2, cx + 0.45, 0.65);
    q.arch(O, cx, 1.5, 1.7, 3.1); q.archWin(cx, 1.6, 1.4, 2.9, 2, 3, O); q.rect(O, cx - 0.2, 4.75, cx + 0.2, 5.4); q.rect('#cdbf9d', cx - 0.05, 4.8, cx + 0.05, 5.3);
    q.rect(O, 0, 5.7, 3.6, 5.95); q.eared(O, cx - 0.55, 6.9, cx + 0.55, 10.2, 0.13, { sill: 0.12 }); q.win(cx - 0.55, 6.9, cx + 0.55, 10.2, 2, 4, O);
    q.eared(O, cx - 0.5, 11.1, cx + 0.5, 12.9, 0.1, { sill: 0.08 }); q.win(cx - 0.5, 11.1, cx + 0.5, 12.9, 2, 3, O); q.rect(O, 0, 13.4, 3.6, 13.8);
  }, 'lmacade-dom-wall');

  // ------------------------------------------------------------------------------------------------ inscriptions (transparent grounds, cut-out materials)
  A.treziniPed = tex.draw(1024, 768, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#d2bf93'; g.textAlign = 'center'; g.textBaseline = 'middle';
    fit(g, 'АРХИТЕКТОРУ', w - 200, 78, serif); g.fillText('АРХИТЕКТОРУ', w / 2, 120);
    fit(g, 'Доменико', w - 120, 230, hand); g.fillText('Доменико', w / 2, 300); fit(g, 'Трезини', w - 120, 250, hand); g.fillText('Трезини', w / 2, 500);
    fit(g, 'Dominico Trezzini', w - 300, 74, hand, 'normal'); g.fillText('Dominico Trezzini', w / 2, 670);
  }, { key: 'lmacade-trezzini-ped' });
  A.klodtPed = tex.draw(512, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#2e2a22'; g.textAlign = 'center'; g.textBaseline = 'middle';
    ['СКУЛЬПТОРУ', 'ПЕТРУ', 'КЛОДТУ'].forEach((t, i) => { fit(g, t, w - 40, 70, serif); g.fillText(t, w / 2, 48 + i * 80); });
  }, { key: 'lmacade-klodt-ped' });
  A.khetPed = tex.draw(1024, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#2b2d2f'; g.textAlign = 'center'; g.textBaseline = 'middle';
    ['Весь мир — мой храм,', 'любовь — моя святыня,', 'вселенная —', 'Отечество моё'].forEach((t, i) => { fit(g, t, w - 60, 86, serif); g.fillText(t, w / 2, 68 + i * 124); });
  }, { key: 'lmacade-khet-ped' });
  const plate = (txt, key) => tex.draw(512, 128, (g, w, h) => { g.fillStyle = '#2e4a3e'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8c08a'; g.textAlign = 'center'; g.textBaseline = 'middle'; fit(g, txt, w - 30, 70, serif); g.fillText(txt, w / 2, h / 2 + 4); }, { key });
  A.colPlateA = plate('ЖИВОПИСЬ', 'lmacade-colplate-a'); A.colPlateB = plate('СКУЛЬПТУРА', 'lmacade-colplate-b'); A.colPlateC = plate('АРХИТЕКТУРА', 'lmacade-colplate-c');
  A.floodPlate = tex.draw(256, 128, (g, w, h) => { g.fillStyle = '#efece4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a8a82'; g.lineWidth = 3; g.strokeRect(3, 3, w - 6, h - 6); g.fillStyle = '#3a3a38'; g.textAlign = 'center'; g.textBaseline = 'middle'; fit(g, 'ВЫСОТА ВОДЫ', w - 30, 26, serif); g.fillText('ВЫСОТА ВОДЫ', w / 2, 36); fit(g, '7-го НОЯБРЯ 1824 г.', w - 30, 26, serif); g.fillText('7-го НОЯБРЯ 1824 г.', w / 2, 80); }, { key: 'lmacade-flood-plate' });
  A.doricFrieze = tex.draw(128, 128, (g, w, h) => {                            // a Doric frieze module (1.25 m): a triglyph with three grooves and a metope with a small white relief (rider / centaur)
    g.fillStyle = '#f0dc9e'; g.fillRect(0, 0, w, h);
    const y0 = h * (1 - 0.74), y1 = h * (1 - 0.04);
    g.fillStyle = '#f7f3e6'; g.fillRect(2, y0, 40, y1 - y0); g.fillStyle = '#c9c1ac'; for (const x of [10, 22, 34]) g.fillRect(x, y0 + 4, 5, y1 - y0 - 8);
    g.fillStyle = '#e9d68e'; g.fillRect(48, y0 + 4, 74, y1 - y0 - 8); g.fillStyle = '#f7f3e6';
    g.beginPath(); g.ellipse(82, y0 + 48, 17, 9, 0, 0, 6.3); g.fill(); g.fillRect(94, y0 + 16, 7, 26); g.beginPath(); g.arc(98, y0 + 14, 6, 0, 6.3); g.fill(); g.fillRect(66, y0 + 48, 4, 22); g.fillRect(78, y0 + 50, 4, 22); g.fillRect(92, y0 + 50, 4, 22);
    g.fillStyle = 'rgba(80,70,50,0.25)'; g.fillRect(0, h - 4, w, 4);
  }, { key: 'lmacade-doric-frieze', repeat: [1, 1] });
  A.treads = A.steps;
  return A;
}
