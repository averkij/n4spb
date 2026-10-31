// landmarksPetrovskyYacht/art2.js - the canvas paintings of the smaller sights (every key 'lmpyac-'): the Standart shed (corrugated dark green sheet, the compass-rose sign, the name plate), the site of the Rops cottage
// (soot-black brick of the chimneys, ash, charred timber, green welded-mesh fence, the information board) and the Savina Home (yellow stucco bay with the white order, frieze, zinc roof, iron fence).
// Photos y12 y18 y19 (yacht) and v01 v02 v03 v04 v05 (misc) of the dossier PHOTO TABLE.
import { RNG } from './art.js';
const TAU = Math.PI * 2;

export function makeArt2(ctx, A) {
  const tex = ctx.tex;
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmpyac-' + key, repeat });
  const speckle = (g, w, h, seed, n, a = 0.1, size = 2.5) => { const r = RNG(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,32'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * size, 1 + r() * size); } };

  // ------------------------------------------------------------------------------------------ Standart shed
  A.corrGreen = D(256, 256, (g, w, h) => {                     // vertical trapezoid-profile sheet, 8 ribs per 1.6 m tile, dark teal green, rust at the foot
    const r = RNG(8201), n = 8, rw = w / n;
    for (let i = 0; i < n; i++) {
      const v = 0.94 + r() * 0.1, gr = g.createLinearGradient(i * rw, 0, (i + 1) * rw, 0);
      gr.addColorStop(0, `rgb(${40 * v | 0},${116 * v | 0},${90 * v | 0})`); gr.addColorStop(0.45, `rgb(${30 * v | 0},${96 * v | 0},${74 * v | 0})`); gr.addColorStop(1, `rgb(${16 * v | 0},${58 * v | 0},${44 * v | 0})`);
      g.fillStyle = gr; g.fillRect(i * rw, 0, rw, h);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(i * rw + rw - 3, 0, 3, h);
    }
    for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(20,30,26,${0.05 + r() * 0.08})`; g.fillRect(r() * w, r() * h * 0.6, 2 + r() * 3, 30 + r() * 80); }
    speckle(g, w, h, 8202, 200, 0.06, 2);
  }, 'corrGreen');
  A.RAILS.compass = ((g, w, h) => {                       // the compass-rose sign on its post: a white disc, a red / blue 8-point star, a dark rim (alpha outside the disc)
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#2b2f33'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 2, 0, TAU); g.fill();
    g.fillStyle = '#f2f2ee'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 16, 0, TAU); g.fill();
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8 - Math.PI / 2, len = i % 2 ? 0.55 : 0.88, c = w / 2, R = (w / 2 - 22) * len, wd = 0.17;
      g.fillStyle = i % 4 === 0 ? '#c8352c' : '#26468a'; g.beginPath(); g.moveTo(c + Math.cos(a) * R, c + Math.sin(a) * R); g.lineTo(c + Math.cos(a + wd) * 24, c + Math.sin(a + wd) * 24); g.lineTo(c + Math.cos(a - wd) * 24, c + Math.sin(a - wd) * 24); g.closePath(); g.fill();
    }
    g.fillStyle = '#2b2f33'; g.beginPath(); g.arc(w / 2, h / 2, 8, 0, TAU); g.fill();
  });
  const SIGNS = (A.SIGNS = {});
  SIGNS.nameStandart = ((g, w, h) => {                  // the rigid name plate on the shed wall (plain wordmark, no logo, no banner)
    g.fillStyle = '#f1f1ec'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1d3c70'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#1d3c70'; g.textAlign = 'center'; g.textBaseline = 'middle';
    tex.fitText(g, 'ВЕРФЬ «ШТАНДАРТ»', w / 2, h / 2, w - 70, 64, tex.FONTS.serif, 700);
  });
  A.timber = D(256, 128, (g, w, h) => {                        // weathered grey-brown plank / log (u along the grain)
    const r = RNG(8211); g.fillStyle = '#8c7a5e'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '60,48,34' : '170,152,120'},${0.1 + r() * 0.18})`; g.fillRect(0, r() * h, w, 1 + r() * 3); }
    g.fillStyle = 'rgba(40,30,20,0.35)'; for (let i = 1; i < 4; i++) g.fillRect(0, i * h / 4, w, 1.5);
  }, 'timber');

  // ------------------------------------------------------------------------------------------ Rops cottage site
  A.brickSoot = D(256, 256, (g, w, h) => {                     // old red brick, sooty after the fire, 12 courses per metre (tile 1 m)
    const r = RNG(8221), rows = 13, rh = h / rows, bw = 64;
    g.fillStyle = '#a8a39a'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < rows; j++) for (let i = -1; i < 5; i++) {
      const x = i * bw + (j % 2) * bw / 2, v = 0.7 + r() * 0.5, soot = 0.35 + r() * 0.4;
      g.fillStyle = `rgb(${(150 * v * (1 - soot * 0.55)) | 0},${(78 * v * (1 - soot * 0.6)) | 0},${(58 * v * (1 - soot * 0.6)) | 0})`; g.fillRect(x + 2, j * rh + 2, bw - 4, rh - 4);
    }
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(20,16,14,0.45)'); gr.addColorStop(1, 'rgba(20,16,14,0.1)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 8222, 400, 0.08, 2.4);
  }, 'brickSoot');
  A.ash = D(256, 256, (g, w, h) => {                           // black ash and charcoal ground with grey patches and a few burnt-out timber ends (tile 4 m)
    const r = RNG(8231); g.fillStyle = '#2b2724'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '90,84,78' : '12,10,9'},${0.25 + r() * 0.3})`; g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * 16, 2 + r() * 9, r() * TAU, 0, TAU); g.fill(); }
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(60,36,24,${0.4 + r() * 0.3})`; g.save(); g.translate(r() * w, r() * h); g.rotate(r() * TAU); g.fillRect(-14, -2, 20 + r() * 20, 3 + r() * 3); g.restore(); }
    speckle(g, w, h, 8232, 500, 0.12, 2);
  }, 'ash');
  A.charred = D(128, 128, (g, w, h) => {                       // charred timber: black alligator-skin with brown glints (u along the beam)
    const r = RNG(8241); g.fillStyle = '#1d1a18'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(${r() < 0.7 ? '60,52,46' : '120,70,40'},${0.25 + r() * 0.3})`; g.fillRect(r() * w, r() * h, 6 + r() * 30, 2 + r() * 5); }
  }, 'charred');
  A.RAILS.wireGreen = ((g, w, h) => {                     // the welded-mesh fence panel 2.5 x 1.8 m: a dark-green frame, 100 x 50 mm mesh (alpha), posts on both sides
    g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgba(66,98,78,0.95)'; g.lineWidth = 1.6;
    for (let x = 8; x < w - 8; x += 10) { g.beginPath(); g.moveTo(x, 6); g.lineTo(x, h - 6); g.stroke(); }
    for (let y = 8; y < h - 8; y += 10) { g.beginPath(); g.moveTo(6, y); g.lineTo(w - 6, y); g.stroke(); }
    g.fillStyle = '#34603f'; g.fillRect(0, 0, w, 7); g.fillRect(0, h - 7, w, 7); g.fillRect(0, 0, 9, h); g.fillRect(w - 9, 0, 9, h);
  });
  A.RAILS.railRing = ((g, w, h) => {                      // the cast-iron fence of the Savina estate (v03): a top rail and a bottom rail, between them a row of tall linked ovals (2.5 m tile x 1.5 m, 140 px = 1.5 m)
    g.clearRect(0, 0, w, h); g.fillStyle = '#26292b'; g.strokeStyle = '#26292b'; g.lineWidth = 4.5;
    g.fillRect(0, 0, w, 7); g.fillRect(0, 22, w, 4); g.fillRect(0, h - 10, w, 10);
    const n = 5, pw = w / n;
    for (let i = 0; i < n; i++) {
      const cx = (i + 0.5) * pw; g.beginPath(); g.ellipse(cx - pw * 0.16, h * 0.62, pw * 0.2, h * 0.34, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(cx + pw * 0.16, h * 0.62, pw * 0.2, h * 0.34, 0, 0, TAU); g.stroke();
      g.beginPath(); g.arc(cx, 14, 6, 0, TAU); g.stroke(); g.fillRect(cx - 2, 20, 4, 8);
    }
    g.fillRect(0, 0, 5, h); g.fillRect(w - 5, 0, 5, h);
  });
  SIGNS.plaque = ((g, w, h) => {                               // the plate beside the entrance of the club (plain wording, no emblem): blue field, white letters, silver rim
    g.fillStyle = '#1d4f9f'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d9dde0'; g.lineWidth = 6; g.strokeRect(5, 5, w - 10, h - 10);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f4f6f8';
    tex.fitText(g, 'ЯХТЕННЫЙ ПОРТ', w / 2, h * 0.34, w - 60, 52, tex.FONTS.sans, 800);
    tex.fitText(g, 'Речной яхт-клуб', w / 2, h * 0.7, w - 80, 40, tex.FONTS.sans, 600);
  });
  SIGNS.infoRops = ((g, w, h) => {                      // the information board hung on the fence of the Rops plot (plain, no logos)
    g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#555'; g.lineWidth = 3; g.strokeRect(4, 4, w - 8, h - 8);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#25282b';
    tex.fitText(g, 'ИНФОРМАЦИОННЫЙ ЩИТ', w / 2, 42, w - 40, 36, tex.FONTS.sans, 800);
    tex.fitText(g, 'Объект культурного наследия', w / 2, 100, w - 50, 30, tex.FONTS.sans, 600);
    tex.fitText(g, 'регионального значения', w / 2, 138, w - 50, 30, tex.FONTS.sans, 600);
    tex.fitText(g, 'Дом управляющего Акционерного общества', w / 2, 188, w - 40, 24, tex.FONTS.sans, 500);
    tex.fitText(g, 'нефтеперегонных заводов «Ропс и К»', w / 2, 218, w - 40, 24, tex.FONTS.sans, 500);
    tex.fitText(g, 'Петровская коса, 9, литера Б', w / 2, 262, w - 60, 24, tex.FONTS.sans, 500);
  });

  // ------------------------------------------------------------------------------------------ Savina Home
  A.savWall = D(256, 640, (g, w, h) => {                       // one 3.4 m bay (8.4 m tall: frieze 0.7, second storey 3.5, string course 0.3, first storey 3.9): chrome-yellow stucco, white order, brown casements
    const m = h / 8.4, YEL = '#e9c04c', WH = '#f4f0e4';
    g.fillStyle = YEL; g.fillRect(0, 0, w, h);
    const r = RNG(8251);
    for (let i = 0; i < 24; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,235,160' : '170,120,20'},${0.04 + r() * 0.05})`; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 40, 8 + r() * 30, r() * TAU, 0, TAU); g.fill(); }
    // rustication of the first storey: white joints every 0.6 m, vertical joints staggered 1.2 m
    g.fillStyle = WH; for (let y = 4.5; y < 8.4; y += 0.6) g.fillRect(0, y * m, w, 2.2);
    for (let k = 0, y = 4.5; y < 8.4; y += 0.6, k++) g.fillRect((k % 2 ? 0.2 : 0.7) * w, y * m, 2.2, 0.6 * m);
    // frieze with swags
    g.fillStyle = WH; g.fillRect(0, 0, w, 0.12 * m); g.fillRect(0, 0.58 * m, w, 0.12 * m);
    g.strokeStyle = WH; g.lineWidth = 5; g.beginPath(); g.moveTo(10, 0.2 * m); g.quadraticCurveTo(w / 2, 0.95 * m, w - 10, 0.2 * m); g.stroke();
    g.fillStyle = WH; g.beginPath(); g.arc(w / 2, 0.37 * m, 5, 0, TAU); g.fill();
    // string course between the storeys
    g.fillStyle = WH; g.fillRect(0, 4.2 * m, w, 0.3 * m); g.fillStyle = 'rgba(120,90,20,0.25)'; g.fillRect(0, 4.5 * m - 2, w, 3);
    const win = (yTop, ww, hh, hood) => {
      const pw = ww * w / 3.4, px = (w - pw) / 2, py = yTop * m, ph = hh * m, bd = 0.13 * w / 3.4;
      g.fillStyle = WH; g.fillRect(px - bd, py - 0.1 * m, pw + 2 * bd, ph + 0.1 * m);
      g.fillStyle = '#2d3943'; g.fillRect(px, py, pw, ph);
      g.fillStyle = 'rgba(190,210,224,0.28)'; g.beginPath(); g.moveTo(px, py); g.lineTo(px + pw * 0.8, py); g.lineTo(px, py + ph * 0.5); g.fill();
      g.fillStyle = '#6b3f2a'; g.fillRect(px, py, pw, 4); g.fillRect(px, py + ph - 4, pw, 4); g.fillRect(px, py, 4, ph); g.fillRect(px + pw - 4, py, 4, ph); g.fillRect(px + pw / 2 - 2, py, 4, ph); g.fillRect(px, py + ph * 0.28, pw, 4);
      g.fillStyle = WH; g.fillRect(px - bd - 4, py + ph, pw + 2 * bd + 8, 0.16 * m);                          // sill
      if (hood) { g.fillStyle = WH; g.beginPath(); g.moveTo(px - bd - 6, py - 0.1 * m); g.lineTo(px + pw / 2, py - 0.5 * m); g.lineTo(px + pw + bd + 6, py - 0.1 * m); g.closePath(); g.fill(); g.fillStyle = YEL; g.beginPath(); g.moveTo(px - bd + 4, py - 0.14 * m); g.lineTo(px + pw / 2, py - 0.4 * m); g.lineTo(px + pw + bd - 4, py - 0.14 * m); g.closePath(); g.fill(); }
    };
    win(1.5, 1.15, 2.0, true);
    win(5.0, 1.2, 2.5, false);
    // soot / damp at the foot
    const gr = g.createLinearGradient(0, h * 0.88, 0, h); gr.addColorStop(0, 'rgba(80,60,20,0)'); gr.addColorStop(1, 'rgba(80,60,20,0.22)'); g.fillStyle = gr; g.fillRect(0, h * 0.88, w, h * 0.12);
  }, 'savWall');
  A.zinc = D(256, 256, (g, w, h) => {                          // grey zinc standing-seam roof (tile 1.2 m: two seams)
    const r = RNG(8261); g.fillStyle = '#c3cbd1'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) { const x = i * 128, v = 0.95 + r() * 0.1; g.fillStyle = `rgba(${200 * v | 0},${210 * v | 0},${218 * v | 0},0.5)`; g.fillRect(x, 0, 128, h); g.fillStyle = 'rgba(70,78,88,0.45)'; g.fillRect(x, 0, 4, h); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x + 4, 0, 3, h); }
    speckle(g, w, h, 8262, 220, 0.06, 2);
  }, 'zinc');
  A.RAILS.railBal = ((g, w, h) => {                       // the white stone balustrade of the balconies (2.0 m tile x 0.94 m): handrail, bottle balusters, plinth rail
    g.clearRect(0, 0, w, h); g.fillStyle = '#f2eee2';
    g.fillRect(0, 0, w, 12); g.fillRect(0, 12, w, 4); g.fillRect(0, h - 14, w, 14);
    for (let i = 0; i < 12; i++) { const cx = 11 + i * 21.2; g.beginPath(); g.ellipse(cx, h * 0.55, 6.5, h * 0.2, 0, 0, TAU); g.fill(); g.fillRect(cx - 3, 16, 6, h - 30); g.fillRect(cx - 5, 16, 10, 5); }
    g.fillRect(0, 0, 8, h); g.fillRect(w - 8, 0, 8, h);
  });
  SIGNS.savFrieze = ((g, w, h) => {                     // the inscription on the frieze of the portico (v02): raised dark letters on pale yellow plaster
    g.fillStyle = '#efe6cc'; g.fillRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#8a7a52';
    tex.fitText(g, 'ДОМ ВЕТЕРАНОВ СЦЕНЫ', w / 2, h / 2 + 2, w - 160, 70, tex.FONTS.serif, 700);
    g.fillStyle = 'rgba(120,100,60,0.5)'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4);
  });
  // ------------------------------------------------------------------------------------------ Petrovskaya kosa 3: the office and the transformer hut (photos k3_1..k3_5)
  A.ashlar = D(256, 256, (g, w, h) => {                        // pale yellow limestone ashlar: blocks 0.6 x 0.3 m in running bond (tile 1.2 m), a few lighter / darker blocks, grey damp at random
    const r = RNG(8271), bw = w / 2, bh = h / 4;
    g.fillStyle = '#d3c08c'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 4; j++) for (let i = -1; i < 3; i++) {
      const x = i * bw + (j % 2) * bw / 2, v = 0.96 + r() * 0.07, d = r() < 0.12 ? 0.95 : 1;
      g.fillStyle = `rgb(${(224 * v * d) | 0},${(207 * v * d) | 0},${(153 * v * d) | 0})`; g.fillRect(x + 2, j * bh + 2.5, bw - 5, bh - 5);
      if (r() < 0.18) { g.fillStyle = `rgba(150,148,130,${0.12 + r() * 0.16})`; g.fillRect(x + 2.5 + r() * 20, j * bh + 2.5, 24 + r() * 50, bh - 5); }
    }
    for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(120,100,60,${0.04 + r() * 0.05})`; g.fillRect(r() * w, 0, 2 + r() * 5, h * (0.3 + r() * 0.7)); }
    speckle(g, w, h, 8272, 260, 0.07, 2.2);
  }, 'ashlar');
  return A;
}
