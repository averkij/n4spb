// landmarksTroitskaya/art.js - canvas paintings of the module (docs/research/troitskaya.md, photos refs/troitskaya): the grey granite of the Mosque (rock-faced courses, smooth ashlar, the frieze of
// little pointed arches), its majolica (pishtaq face with the three jamb panels and the inscription band, muqarnas cells, jamb tile, the iwan back wall with the three doors, lattice windows, the pointed
// windows in tile surrounds, calligraphy medallions, the north portal panel, the dome rib strip with stepped lozenges and the pale cartouche band, the minaret shaft with its diamond net, the gallery,
// the tile turret), the turquoise-and-gold fence; the glazed brick, granite and blue frieze of the Kshesinskaya mansion; window sheets of the houses; grit / lawn / paver surfaces; plaques with real text.
// Arabic inscriptions are abstract calligraphic strokes (no fake readable text).  Everything is cached by key ('lmT-...').
const TAU = Math.PI * 2;
export const TILE = { turq: '#3fbccb', turqL: '#7fd6dc', cobalt: '#1f4a9c', navy: '#17306e', sky: '#5aa6da', white: '#eef2f2', beige: '#c8a488', ochre: '#d6a23c', black: '#15181d' };

export function makeArt(ctx) {
  const tex = ctx.tex, A = {};
  const D = (w, h, fn, key, repeat) => tex.draw(w, h, fn, { key: 'lmT-' + key, repeat });
  const R = (seed) => ctx.rng(seed);
  const T = TILE;
  const diamond = (g, cx, cy, rx, ry) => { g.beginPath(); g.moveTo(cx, cy - ry); g.lineTo(cx + rx, cy); g.lineTo(cx, cy + ry); g.lineTo(cx - rx, cy); g.closePath(); g.fill(); };
  /** pointed (two-centre) arch path: half width r, straight part hs, rise ha, base at (cx, yb) with y growing DOWN in canvas (yb = bottom) */
  const archPath = (g, cx, yb, r, hs, ha) => {
    const c = (ha * ha - r * r) / (2 * r), Rr = r + c, a1 = Math.acos(c / Rr);
    g.beginPath(); g.moveTo(cx - r, yb); g.lineTo(cx - r, yb - hs);
    for (let i = 0; i <= 10; i++) { const a = a1 * i / 10; g.lineTo(cx + c - Rr * Math.cos(a), yb - hs - Rr * Math.sin(a)); }
    for (let i = 10; i >= 0; i--) { const a = a1 * i / 10; g.lineTo(cx - c + Rr * Math.cos(a), yb - hs - Rr * Math.sin(a)); }
    g.lineTo(cx + r, yb); g.closePath();
  };
  /** an arabesque field: cobalt ground, interlaced pink-beige straps, turquoise / white florets (the jamb panels, photo 10) */
  const arabesque = (g, x, y, w, h, s, seed) => {
    const r = R(seed);
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = T.cobalt; g.fillRect(x, y, w, h);
    g.lineWidth = Math.max(1.5, s * 0.16); g.strokeStyle = T.beige;
    for (let j = -1; j * s < h + s; j++) for (let i = -1; i * s < w + s; i++) {
      const cx = x + i * s + (j % 2 ? s / 2 : 0), cy = y + j * s * 0.8;
      g.beginPath(); g.moveTo(cx, cy - s * 0.5); g.quadraticCurveTo(cx + s * 0.55, cy - s * 0.2, cx + s * 0.5, cy + s * 0.3); g.quadraticCurveTo(cx, cy + s * 0.75, cx - s * 0.5, cy + s * 0.3); g.quadraticCurveTo(cx - s * 0.55, cy - s * 0.2, cx, cy - s * 0.5); g.stroke();
      g.fillStyle = r() < 0.5 ? T.turq : T.sky; g.beginPath(); g.arc(cx, cy, s * 0.17, 0, TAU); g.fill();
      g.fillStyle = r() < 0.3 ? T.ochre : T.white; g.beginPath(); g.arc(cx, cy, s * 0.07, 0, TAU); g.fill();
    }
    g.restore();
  };
  /** a border strip of white florets on cobalt between turquoise lines */
  const floretBand = (g, x, y, w, h, vertical) => {
    g.fillStyle = T.navy; g.fillRect(x, y, w, h);
    const s = vertical ? w : h, n = Math.max(1, Math.round((vertical ? h : w) / s));
    for (let i = 0; i < n; i++) {
      const cx = vertical ? x + w / 2 : x + (i + 0.5) * w / n, cy = vertical ? y + (i + 0.5) * h / n : y + h / 2;
      g.fillStyle = i % 2 ? T.white : T.turqL;
      for (let k = 0; k < 6; k++) { const a = k * TAU / 6; g.beginPath(); g.ellipse(cx + Math.cos(a) * s * 0.2, cy + Math.sin(a) * s * 0.2, s * 0.13, s * 0.07, a, 0, TAU); g.fill(); }
      g.fillStyle = T.ochre; g.beginPath(); g.arc(cx, cy, s * 0.07, 0, TAU); g.fill();
    }
  };
  /** abstract white calligraphy (thuluth-like strokes) in a box */
  const calligraphy = (g, x, y, w, h, seed, col = T.white) => {
    const r = R(seed); g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineCap = 'round';
    const n = Math.max(3, Math.round(w / (h * 0.42)));
    for (let i = 0; i < n; i++) {
      const cx = x + (i + 0.5) * w / n, t = r();
      g.lineWidth = Math.max(1.2, h * 0.07);
      g.beginPath(); g.moveTo(cx - w / n * 0.4, y + h * (0.62 + t * 0.12)); g.quadraticCurveTo(cx, y + h * (0.9 - t * 0.2), cx + w / n * 0.42, y + h * 0.6); g.stroke();
      if (t > 0.3) { g.lineWidth = Math.max(1.2, h * 0.06); g.beginPath(); g.moveTo(cx + (t - 0.6) * w / n * 0.5, y + h * 0.12); g.lineTo(cx + (t - 0.6) * w / n * 0.5 + h * 0.05, y + h * 0.66); g.stroke(); }
      if (t < 0.6) { g.beginPath(); g.arc(cx - w / n * 0.15, y + h * (0.3 + t * 0.2), h * 0.05, 0, TAU); g.fill(); }
    }
    g.restore();
  };
  /** girih-like lattice (turquoise bars on dark): stars in a square net */
  const lattice = (g, x, y, w, h, s, col = T.turq, bg = '#1c2a33') => {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = bg; g.fillRect(x, y, w, h); g.strokeStyle = col; g.lineWidth = Math.max(1.5, s * 0.13);
    for (let j = 0; j * s < h + s; j++) for (let i = 0; i * s < w + s; i++) {
      const cx = x + i * s, cy = y + j * s;
      g.beginPath(); for (let k = 0; k <= 8; k++) { const a = k * TAU / 8, rr = k % 2 ? s * 0.5 : s * 0.24; const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; if (k) g.lineTo(px, py); else g.moveTo(px, py); } g.stroke();
      g.beginPath(); g.arc(cx + s / 2, cy + s / 2, s * 0.2, 0, TAU); g.stroke();
    }
    g.restore();
  };

  // ------------------------------------------------------------------------------------------ granite of the Mosque
  /** rock-faced blocks: tile 2.2 x 2.2 m = 4 courses of 0.55 m, blocks 0.7 - 1.3 m, dark joints, a lit upper edge and a shaded lower one on every block */
  A.rock = D(256, 256, (g, w, h) => {
    const r = R(9101); g.fillStyle = '#4f535b'; g.fillRect(0, 0, w, h);
    for (let c = 0; c < 4; c++) {
      let x = -r() * 50;
      while (x < w) {
        const bw = 60 + r() * 70, v = 98 + Math.floor(r() * 38), y = c * 64;
        g.fillStyle = `rgb(${v - 4},${v},${v + 8})`; g.fillRect(x + 2, y + 2, bw - 4, 60);
        g.fillStyle = 'rgba(255,255,255,0.24)'; g.fillRect(x + 4, y + 3, bw - 8, 8);
        g.fillStyle = 'rgba(20,24,34,0.38)'; g.fillRect(x + 4, y + 48, bw - 8, 12);
        for (let k = 0; k < 5; k++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '30,34,44'},0.10)`; g.fillRect(x + 6 + r() * (bw - 20), y + 10 + r() * 36, 6 + r() * 16, 3 + r() * 6); }
        x += bw;
      }
    }
  }, 'rock', [1, 1]);
  /** smooth ashlar: tile 2.4 x 1.2 m, two courses of 1.2 m slabs, thin joints */
  A.ashlar = D(256, 128, (g, w, h) => {
    const r = R(9102); g.fillStyle = '#a9acad'; g.fillRect(0, 0, w, h);
    for (let c = 0; c < 2; c++) for (let i = 0; i < 2; i++) { const v = 164 + Math.floor(r() * 16); g.fillStyle = `rgb(${v - 2},${v},${v + 2})`; g.fillRect(i * 128 + (c ? 64 : 0) - 64 + 1, c * 64 + 1, 126, 62); g.fillRect(i * 128 + (c ? 64 : 0) + 64 + 1, c * 64 + 1, 126, 62); }
    g.fillStyle = 'rgba(70,74,82,0.55)'; g.fillRect(0, 0, w, 2); g.fillRect(0, 64, w, 2);
  }, 'ashlar', [1, 1]);
  /** the frieze of small pointed blind arches: tile = one arch 0.55 m wide x 1.1 m */
  A.arcade = D(64, 128, (g, w, h) => {
    g.fillStyle = '#b3b5b4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#5e6168'; archPath(g, 32, 112, 17, 52, 30); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, 0, w, 8); g.fillStyle = 'rgba(40,44,52,0.35)'; g.fillRect(0, 118, w, 10);
  }, 'arcade', [1, 1]);
  /** grey stalactite corbel (under the dome, under the minaret galleries): tile = one cell */
  A.corbel = D(64, 96, (g, w, h) => {
    g.fillStyle = '#8b8f95'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 3; j++) { const y = j * 32, o = j % 2 ? 0 : 32;
      for (let i = -1; i < 2; i++) { const cx = i * 64 + o + 32; g.fillStyle = '#5b5f68'; g.beginPath(); g.moveTo(cx - 26, y + 2); g.lineTo(cx + 26, y + 2); g.lineTo(cx + 18, y + 22); g.lineTo(cx, y + 31); g.lineTo(cx - 18, y + 22); g.closePath(); g.fill();
        g.fillStyle = j === 1 ? T.cobalt : '#a9adb2'; g.beginPath(); g.moveTo(cx - 14, y + 5); g.lineTo(cx + 14, y + 5); g.lineTo(cx, y + 22); g.closePath(); g.fill(); } }
  }, 'corbel', [1, 1]);

  // ------------------------------------------------------------------------------------------ majolica of the Mosque
  /** the pishtaq face 8.2 x 19.5 m (the iwan opening is a hole in the mesh: x 0.195..0.805, to 13.2 m): turquoise frame, three panels on each jamb, the inscription band, the row of little arches */
  A.portal = D(512, 1024, (g, w, h) => {
    g.fillStyle = T.turq; g.fillRect(0, 0, w, h);
    const m = 14; g.fillStyle = T.navy; g.fillRect(m, m, w - 2 * m, h - 2 * m);
    floretBand(g, m, m, w - 2 * m, 22, false); floretBand(g, m, h - m - 22, w - 2 * m, 22, false); floretBand(g, m, m, 22, h - 2 * m, true); floretBand(g, w - m - 22, m, 22, h - 2 * m, true);
    // top: row of little arches (y 40..120) and the inscription band (y 150..250)
    g.fillStyle = T.turq; g.fillRect(40, 40, w - 80, 86);
    for (let i = 0; i < 12; i++) { const cx = 40 + (i + 0.5) * (w - 80) / 12; g.fillStyle = T.cobalt; archPath(g, cx, 122, 13, 44, 26); g.fill(); g.fillStyle = T.ochre; g.beginPath(); g.arc(cx, 96, 4, 0, TAU); g.fill(); }
    g.fillStyle = T.turqL; g.fillRect(40, 134, w - 80, 6);
    arabesque(g, 40, 146, w - 80, 112, 30, 9201);
    g.fillStyle = T.navy; g.fillRect(96, 160, w - 192, 84); g.strokeStyle = T.turqL; g.lineWidth = 4; g.strokeRect(96, 160, w - 192, 84);
    calligraphy(g, 108, 168, w - 216, 68, 9202);
    g.fillStyle = T.turqL; g.fillRect(40, 264, w - 80, 6);
    // spandrels round the arch (y 276..560): arabesque
    arabesque(g, 40, 276, w - 80, 300, 34, 9203);
    // jambs: three panels each (lower tall arch panel, square panel, upper tall arch panel), x 40..94 and 418..472
    for (const x0 of [40, w - 40 - 58]) {
      g.fillStyle = T.turq; g.fillRect(x0 - 2, 330, 62, h - 330 - 36);
      const panel = (y0, y1, arch) => {
        arabesque(g, x0 + 5, y0, 48, y1 - y0, 17, 9210 + y0);
        if (arch) { g.strokeStyle = T.turqL; g.lineWidth = 4; archPath(g, x0 + 29, y1 - 6, 19, (y1 - y0) - 44, 26); g.stroke(); }
        g.strokeStyle = T.turqL; g.lineWidth = 3; g.strokeRect(x0 + 5, y0, 48, y1 - y0);
      };
      panel(346, 520, true); panel(534, 590, false); panel(604, 790, true); panel(804, 852, false); panel(866, h - 44, true);
    }
    // thin twisted colonnette lines at the edges of the opening
    for (const x of [100, w - 106]) { g.fillStyle = T.sky; g.fillRect(x, 330, 6, h - 330 - 14); for (let y = 336; y < h - 20; y += 16) { g.fillStyle = T.ochre; g.fillRect(x, y, 6, 4); } }
  }, 'portal');
  /** muqarnas (stalactite cells of the iwan vault): tile ~1.1 x 1.1 m */
  A.muqarnas = D(128, 128, (g, w, h) => {
    const r = R(9230); g.fillStyle = T.cobalt; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 4; j++) for (let i = -1; i < 4; i++) {
      const cx = i * 32 + (j % 2 ? 16 : 0) + 16, y = j * 32;
      g.fillStyle = r() < 0.5 ? T.navy : '#2a62b4'; g.beginPath(); g.moveTo(cx - 15, y + 1); g.lineTo(cx + 15, y + 1); g.lineTo(cx + 11, y + 20); g.lineTo(cx, y + 31); g.lineTo(cx - 11, y + 20); g.closePath(); g.fill();
      g.strokeStyle = T.turq; g.lineWidth = 2.5; g.stroke();
      g.fillStyle = r() < 0.4 ? T.ochre : T.turqL; g.beginPath(); g.ellipse(cx, y + 12, 3.5, 6, 0, 0, TAU); g.fill();
    }
  }, 'muqarnas', [1, 1]);
  /** tile dado / jamb lining of the iwan: tile 1.2 x 2.4 m */
  A.jamb = D(128, 256, (g, w, h) => {
    arabesque(g, 0, 0, w, h, 26, 9240);
    g.fillStyle = T.turq; g.fillRect(0, 0, 6, h); g.fillRect(w - 6, 0, 6, h); g.fillRect(0, 0, w, 5); g.fillRect(0, h / 2 - 2, w, 5);
    g.fillStyle = T.beige; g.fillRect(8, 0, 3, h); g.fillRect(w - 11, 0, 3, h);
  }, 'jamb', [1, 1]);
  /** back wall of the iwan 5.0 x 8.6 m (below the springing): three dark doors in a black-stone surround with inscription strips, a tile dado, a lattice pointed window over the middle door */
  A.iwanBack = D(256, 440, (g, w, h) => {
    arabesque(g, 0, 0, w, h, 26, 9250);
    g.fillStyle = T.turq; g.fillRect(0, 0, w, 6);
    // lattice window
    g.fillStyle = T.turqL; archPath(g, w / 2, 196, 46, 96, 52); g.fill();
    g.save(); archPath(g, w / 2, 192, 40, 92, 46); g.clip(); lattice(g, w / 2 - 44, 40, 88, 160, 22, T.turq, '#12303c'); g.restore();
    // black-stone surround with the doors (lower 4.3 m = 220 px)
    g.fillStyle = '#23262b'; g.fillRect(8, 216, w - 16, h - 216);
    g.fillStyle = '#3a3e45'; g.fillRect(14, 222, w - 28, 26); calligraphy(g, 20, 224, w - 40, 22, 9251, '#c9ccd0');
    for (let i = 0; i < 3; i++) {
      const x = 22 + i * 74;
      g.fillStyle = '#4a4e55'; g.fillRect(x - 5, 256, 5, h - 256);
      g.fillStyle = '#3b2a1e'; g.fillRect(x, 258, 64, h - 258);
      g.fillStyle = '#58402c'; g.fillRect(x + 4, 264, 26, h - 270); g.fillRect(x + 34, 264, 26, h - 270);
      g.fillStyle = '#2a1d14'; for (let k = 0; k < 4; k++) { g.fillRect(x + 8, 272 + k * 40, 18, 30); g.fillRect(x + 38, 272 + k * 40, 18, 30); }
      g.fillStyle = T.ochre; g.fillRect(x + 28, 340, 3, 12); g.fillRect(x + 33, 340, 3, 12);
    }
  }, 'iwanBack');
  /** tall lattice window of the hall (1.5 x 6.5 m) in a turquoise frame */
  A.latticeWin = D(64, 256, (g, w, h) => { g.fillStyle = T.turq; g.fillRect(0, 0, w, h); lattice(g, 5, 5, w - 10, h - 10, 18); g.fillStyle = T.turqL; g.fillRect(5, h * 0.33, w - 10, 3); g.fillRect(5, h * 0.66, w - 10, 3); }, 'latticeWin');
  /** pointed upper window in a tile surround (2.3 x 3.6 m) */
  A.pointedWin = D(128, 200, (g, w, h) => {
    g.fillStyle = '#a7aaab'; g.fillRect(0, 0, w, h);
    g.fillStyle = T.turq; archPath(g, 64, 196, 60, 96, 92); g.fill();
    g.save(); archPath(g, 64, 192, 52, 94, 82); g.clip(); arabesque(g, 0, 0, w, h, 20, 9260); g.restore();
    g.fillStyle = T.turqL; archPath(g, 64, 184, 36, 84, 60); g.fill();
    g.save(); archPath(g, 64, 182, 32, 82, 54); g.clip(); lattice(g, 28, 30, 72, 156, 18); g.restore();
  }, 'pointedWin');
  /** round calligraphy medallion (alpha): carved stone disc with a tile ring */
  A.medallion = D(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#c0c2c1'; g.beginPath(); g.arc(64, 64, 62, 0, TAU); g.fill();
    g.fillStyle = '#868a90'; g.beginPath(); g.arc(64, 64, 54, 0, TAU); g.fill();
    g.fillStyle = '#6c7078'; g.beginPath(); g.arc(64, 64, 46, 0, TAU); g.fill();
    calligraphy(g, 26, 36, 76, 30, 9270, '#c4c7cb'); calligraphy(g, 30, 66, 68, 26, 9271, '#c4c7cb');
  }, 'medallion');
  /** the north portal panel 4.6 x 9.2 m: tile field, inner frame, inscription, a recessed pointed niche with a lattice window and a brown door */
  A.northPortal = D(256, 512, (g, w, h) => {
    g.fillStyle = T.turq; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { const cx = 10 + (i + 0.5) * (w - 20) / 9; g.fillStyle = T.cobalt; archPath(g, cx, 40, 9, 16, 14); g.fill(); }
    arabesque(g, 10, 46, w - 20, h - 56, 30, 9280);
    g.fillStyle = T.turq; g.fillRect(58, 110, w - 116, h - 120);
    lattice(g, 64, 116, w - 128, h - 132, 12, T.turqL, T.cobalt);
    g.fillStyle = T.navy; g.fillRect(84, 150, w - 168, 50); g.strokeStyle = T.turqL; g.lineWidth = 3; g.strokeRect(84, 150, w - 168, 50); calligraphy(g, 90, 156, w - 180, 38, 9281);
    g.fillStyle = T.turqL; archPath(g, w / 2, h - 10, 48, 200, 56); g.fill();
    g.save(); archPath(g, w / 2, h - 10, 42, 198, 50); g.clip(); lattice(g, 80, 230, 96, 180, 20, T.turq, '#12303c');
    g.fillStyle = '#e4e6e2'; g.fillRect(84, 400, 88, 28); calligraphy(g, 88, 403, 80, 22, 9282, '#3a4a5a');
    g.fillStyle = '#7a4a2a'; g.fillRect(84, 432, 88, 80); g.fillStyle = '#5a3418'; g.fillRect(126, 432, 3, 80); g.restore();
  }, 'northPortal');
  /** one dome rib, u across the rib, v from the base (bottom of the canvas) to the apex: turquoise with cobalt stepped lozenges (white / ochre hearts), dark rosette row, the pale cartouche band at 12-30 % */
  A.rib = D(32, 1024, (g, w, h) => {
    g.fillStyle = T.turq; g.fillRect(0, 0, w, h);
    const lz = (cy, s, heart) => { g.fillStyle = T.cobalt; for (let k = -3; k <= 3; k++) { const ww = (4 - Math.abs(k)) * 3.2; g.fillRect(16 - ww, cy + k * s, ww * 2, s + 0.5); } g.fillStyle = heart; g.fillRect(13, cy - s * 0.2, 6, s * 1.4); };
    for (let i = 0; i < 20; i++) lz(18 + i * 34, 3.4, i % 3 === 0 ? T.ochre : T.white);
    // pale band (v 0.70 .. 0.88 of the canvas height from the top = 12 .. 30 % above the base)
    g.fillStyle = '#8fd0da'; g.fillRect(0, 716, w, 150);
    g.fillStyle = T.cobalt; for (let i = 0; i < 3; i++) { const cy = 741 + i * 50; g.beginPath(); g.ellipse(16, cy, 9, 21, 0, 0, TAU); g.fill(); g.fillStyle = T.white; g.beginPath(); g.ellipse(16, cy, 5.5, 15, 0, 0, TAU); g.fill(); g.fillStyle = T.ochre; g.beginPath(); g.ellipse(16, cy, 2.5, 8, 0, 0, TAU); g.fill(); g.fillStyle = T.cobalt; }
    g.fillStyle = T.navy; g.fillRect(0, 866, w, 10); g.fillRect(0, 706, w, 10);
    // rosette row and the foot of the rib
    g.fillStyle = T.turq; g.fillRect(0, 876, w, 148);
    g.fillStyle = '#5a3a22'; g.beginPath(); g.arc(16, 900, 11, 0, TAU); g.fill(); g.fillStyle = T.ochre; g.beginPath(); g.arc(16, 900, 5, 0, TAU); g.fill();
    g.fillStyle = T.cobalt; g.fillRect(0, 930, w, 8); g.fillRect(0, 980, w, 6);
    g.fillStyle = 'rgba(10,30,70,0.45)'; g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h);                // the groove between two ribs
    g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(12, 0, 7, h);
  }, 'rib');
  /** drum of the dome: one of 16 bays (2.9 m wide x 5 m): granite with a pointed lattice window in a tile frame */
  A.drum = D(128, 256, (g, w, h) => {
    const r = R(9300); g.fillStyle = '#9b9ea1'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 8; j++) for (let i = 0; i < 3; i++) { const v = 150 + Math.floor(r() * 20); g.fillStyle = `rgb(${v - 3},${v},${v + 3})`; g.fillRect(i * 43 + (j % 2 ? 20 : 0) - 20 + 1, j * 32 + 1, 41, 30); g.fillRect(i * 43 + (j % 2 ? 20 : 0) + 109, j * 32 + 1, 41, 30); }
    g.fillStyle = T.turq; archPath(g, 64, 226, 26, 120, 44); g.fill();
    g.save(); archPath(g, 64, 222, 21, 118, 37); g.clip(); lattice(g, 40, 50, 48, 176, 14, T.turqL, '#16323c'); g.restore();
    g.fillStyle = T.turq; g.fillRect(0, 232, w, 6); g.fillStyle = T.cobalt; g.fillRect(0, 238, w, 6);
  }, 'drum', [1, 1]);
  /** minaret shaft: stone courses with the raised diamond net (tile = a quarter of the girth x 4.4 m) */
  A.shaft = D(128, 256, (g, w, h) => {
    const r = R(9310); g.fillStyle = '#8f9399'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 8; j++) for (let i = -1; i < 3; i++) { const v = 138 + Math.floor(r() * 22); g.fillStyle = `rgb(${v - 3},${v},${v + 5})`; g.fillRect(i * 64 + (j % 2 ? 32 : 0) + 1, j * 32 + 1, 62, 30); }
    g.strokeStyle = '#b9bcc0'; g.lineWidth = 7; g.beginPath(); g.moveTo(64, 0); g.lineTo(128, 128); g.lineTo(64, 256); g.lineTo(0, 128); g.closePath(); g.stroke();
    g.strokeStyle = 'rgba(40,44,54,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(64, 8); g.lineTo(122, 128); g.lineTo(64, 248); g.lineTo(6, 128); g.closePath(); g.stroke();
    g.fillStyle = '#23272e'; g.fillRect(61, 104, 6, 48);
  }, 'shaft', [1, 1]);
  /** minaret gallery: one of 8 bays: smooth stone with a pointed dark opening and a small sill */
  A.gallery = D(64, 256, (g, w, h) => {
    g.fillStyle = '#a1a4a8'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(60,64,72,0.5)'; for (let j = 1; j < 8; j++) g.fillRect(0, j * 32, w, 2); g.fillRect(0, 0, 2, h);
    g.fillStyle = '#bfc2c4'; archPath(g, 32, 180, 15, 70, 26); g.fill();
    g.fillStyle = '#1d2128'; archPath(g, 32, 178, 11, 68, 20); g.fill();
    g.fillStyle = '#8a8d92'; g.fillRect(14, 180, 36, 8);
  }, 'gallery', [1, 1]);
  /** the tile turret of a minaret: turquoise / cobalt / ochre diamonds (tile = a quarter of the girth), a band of little arches on top */
  A.turret = D(64, 256, (g, w, h) => {
    g.fillStyle = T.cobalt; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 7; j++) { const cy = 54 + j * 30;
      for (const cx of [0, 32, 64]) { g.fillStyle = T.turq; diamond(g, cx + (j % 2 ? 16 : 0), cy, 15, 20); g.fillStyle = T.navy; diamond(g, cx + (j % 2 ? 16 : 0), cy, 9, 12); g.fillStyle = j % 2 ? T.white : T.ochre; diamond(g, cx + (j % 2 ? 16 : 0), cy, 4, 6); } }
    g.fillStyle = T.navy; g.fillRect(0, 0, w, 34); for (let i = 0; i < 2; i++) { g.fillStyle = T.ochre; archPath(g, 16 + i * 32, 30, 9, 12, 12); g.fill(); g.fillStyle = T.white; archPath(g, 16 + i * 32, 30, 5, 10, 8); g.fill(); }
    g.fillStyle = T.turq; g.fillRect(0, 34, w, 5); g.fillRect(0, h - 8, w, 8);
  }, 'turret', [1, 1]);
  /** fence of the Mosque (alpha): tile 1.6 x 1.8 m: turquoise uprights and keel arches, gilded scrolls and fleur-de-lis tips */
  A.mosqueFence = D(128, 144, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#3aa99a'; g.fillStyle = '#3aa99a'; g.lineWidth = 3;
    g.fillRect(0, 16, w, 4); g.fillRect(0, h - 8, w, 5);
    for (let i = 0; i <= 4; i++) g.fillRect(i * 32 - 1.5, 14, 3, h - 18);
    for (let i = 0; i < 2; i++) { const cx = 32 + i * 64; g.beginPath(); g.moveTo(cx - 30, 124); g.quadraticCurveTo(cx - 30, 70, cx - 14, 60); g.quadraticCurveTo(cx - 2, 50, cx, 28); g.quadraticCurveTo(cx + 2, 50, cx + 14, 60); g.quadraticCurveTo(cx + 30, 70, cx + 30, 124); g.stroke(); }
    g.strokeStyle = '#d9b23c'; g.fillStyle = '#d9b23c'; g.lineWidth = 2.5;
    for (let i = 0; i < 2; i++) { const cx = 32 + i * 64; for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * 9, 92, 7, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx + s * 9, 110, 5, 0, TAU); g.stroke(); } g.beginPath(); g.moveTo(cx, 76); g.lineTo(cx, 124); g.stroke(); }
    for (let i = 0; i <= 4; i++) { const cx = i * 32; g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx + 5, 12); g.lineTo(cx, 18); g.lineTo(cx - 5, 12); g.closePath(); g.fill(); }
  }, 'mosqueFence', [1, 1]);
  /** carved panel of a granite fence post */
  A.postPanel = D(32, 96, (g, w, h) => { g.fillStyle = '#9a9da0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6d7076'; g.lineWidth = 2; for (let j = 0; j < 2; j++) { const cy = 26 + j * 44; g.beginPath(); g.ellipse(16, cy, 9, 18, 0, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(16, cy - 12); g.lineTo(22, cy); g.lineTo(16, cy + 12); g.lineTo(10, cy); g.closePath(); g.stroke(); } }, 'postPanel');

  // ------------------------------------------------------------------------------------------ Kshesinskaya mansion
  /** glazed brick: tile 1.0 x 0.5 m (4 x 6 courses) */
  A.brick = D(128, 64, (g, w, h) => {
    const r = R(9400); g.fillStyle = '#c6b68a'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 6; j++) for (let i = -1; i < 4; i++) { const k = 0.93 + r() * 0.12; g.fillStyle = `rgb(${Math.min(255, 222 * k) | 0},${Math.min(255, 206 * k) | 0},${Math.min(255, 158 * k) | 0})`; g.fillRect(i * 32 + (j % 2 ? 16 : 0) + 1, j * 10.67 + 1, 30, 9); }
  }, 'brick', [1, 1]);
  /** rock-faced granite of the mansion's lower floor: tile 2 x 1.4 m, 3 courses */
  A.granK = D(256, 180, (g, w, h) => {
    const r = R(9401); g.fillStyle = '#5f6268'; g.fillRect(0, 0, w, h);
    for (let c = 0; c < 3; c++) { let x = -r() * 40; while (x < w) { const bw = 70 + r() * 60, v = 132 + Math.floor(r() * 30); g.fillStyle = `rgb(${v},${v + 1},${v + 4})`; g.fillRect(x + 2, c * 60 + 2, bw - 4, 56); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 4, c * 60 + 3, bw - 8, 6); g.fillStyle = 'rgba(20,24,30,0.25)'; g.fillRect(x + 4, c * 60 + 48, bw - 8, 8); x += bw; } }
  }, 'granK', [1, 1]);
  /** the dark blue majolica frieze with metal wreaths and swags: tile 2.2 x 1.1 m */
  A.frieze = D(256, 128, (g, w, h) => {
    g.fillStyle = '#27407e'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 8; i++) { g.fillStyle = (i + j) % 2 ? '#2c4a8e' : '#223a74'; g.fillRect(i * 32 + 1, j * 32 + 1, 30, 30); }
    g.strokeStyle = '#8f979c'; g.lineWidth = 5; g.beginPath(); g.arc(128, 60, 30, 0, TAU); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(0, 40); g.quadraticCurveTo(50, 96, 98, 56); g.stroke(); g.beginPath(); g.moveTo(256, 40); g.quadraticCurveTo(206, 96, 158, 56); g.stroke();
    g.fillStyle = '#8f979c'; g.fillRect(0, 0, 8, h); g.fillRect(0, h - 6, w, 6);
  }, 'frieze', [1, 1]);
  /** a tall mansion window (wooden frame, net curtains): 1 : 2.4 */
  const kwin = (key, frame, cols, upper) => D(96, 224, (g, w, h) => {
    g.fillStyle = frame; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7fa6c8'); gr.addColorStop(1, '#3a5876'); g.fillStyle = gr; g.fillRect(6, 6, w - 12, h - 12);
    g.fillStyle = 'rgba(240,236,224,0.82)'; g.fillRect(6, h * upper + 4, w - 12, h * (1 - upper) - 10);
    g.strokeStyle = 'rgba(200,196,184,0.9)'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(6 + i * (w - 12) / 4, h * upper + 4); g.quadraticCurveTo(w / 2, h * 0.7, 6 + (4 - i) * (w - 12) / 4, h - 8); g.stroke(); }
    g.fillStyle = frame; g.fillRect(0, h * upper, w, 6); for (let c = 1; c < cols; c++) g.fillRect(w * c / cols - 3, 0, 6, h);
    if (upper > 0.2) for (let c = 0; c < cols * 2; c++) g.fillRect(6 + c * (w - 12) / (cols * 2) - 1, 6, 2, h * upper - 6);
  }, key);
  A.kwin = kwin('kwin', '#6b4a2e', 2, 0.26); A.kwin3 = kwin('kwin3', '#6b4a2e', 3, 0.26); A.wwin = kwin('wwin', '#ece9e0', 2, 0.3);
  /** winter garden glazing: grey iron grid over greenish glass (tile = 1 x 1 m pane field of 2 x 2) */
  A.wgarden = D(128, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#a9c6cf'); gr.addColorStop(1, '#4e6f78'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(70,110,70,0.25)'; g.fillRect(0, h * 0.5, w, h * 0.5);
    g.fillStyle = '#70777c'; g.fillRect(0, 0, w, 5); g.fillRect(0, 0, 5, h); g.fillRect(0, 62, w, 4); g.fillRect(62, 0, 4, h);
  }, 'wgarden', [1, 1]);
  /** grey iron fence of the mansion (alpha): tile 1.4 x 1.9 m: bars, a row of rings under the top rail */
  A.kfence = D(112, 152, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#737a80'; g.strokeStyle = '#737a80';
    g.fillRect(0, 6, w, 5); g.fillRect(0, 40, w, 4); g.fillRect(0, h - 10, w, 6);
    for (let i = 0; i < 8; i++) g.fillRect(i * 14 + 5, 6, 3.5, h - 12);
    g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(14 + i * 28, 25, 10, 0, TAU); g.stroke(); }
  }, 'kfence', [1, 1]);

  // ------------------------------------------------------------------------------------------ house sheets (one storey bay per tile: uv u = bays, v = storeys)
  /** generic bay: wall colour, one window (frame colour, w / h fraction), optional sill band; variant count 1 */
  const bay = (key, o) => D(128, 128, (g, w, h) => {
    g.fillStyle = o.wall; g.fillRect(0, 0, w, h);
    if (o.rough) { const r = R(9500 + key.length); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '60,50,30'},0.10)`; g.fillRect(r() * w, r() * h, 2 + r() * 3, 2 + r() * 2); } }
    const ww = w * o.ww, wh = h * o.wh, x0 = (w - ww) / 2, y0 = h * (o.top ?? 0.16);
    if (o.trim) { g.fillStyle = o.trim; g.fillRect(x0 - 7, y0 - 7, ww + 14, wh + 14); }
    g.fillStyle = o.frame; g.fillRect(x0, y0, ww, wh);
    const gr = g.createLinearGradient(0, y0, 0, y0 + wh); gr.addColorStop(0, o.g0 || '#7d9fc0'); gr.addColorStop(1, o.g1 || '#34485e'); g.fillStyle = gr; g.fillRect(x0 + 4, y0 + 4, ww - 8, wh - 8);
    g.fillStyle = o.frame; g.fillRect(x0 + ww / 2 - 2, y0, 4, wh); g.fillRect(x0, y0 + wh * (o.bar ?? 0.3), ww, 4);
    if (o.small) for (let i = 1; i < 6; i++) g.fillRect(x0 + ww * i / 6 - 0.75, y0, 1.5, wh * (o.bar ?? 0.3));
    if (o.band) { g.fillStyle = o.band; g.fillRect(0, h - 7, w, 7); }
    if (o.balcony) { g.fillStyle = o.balcony; g.fillRect(x0 - 12, y0 + wh + 2, ww + 24, 5); g.fillRect(x0 - 12, y0 + wh - 22, ww + 24, 3); for (let i = 0; i <= 8; i++) g.fillRect(x0 - 12 + i * (ww + 24) / 8 - 1, y0 + wh - 22, 2, 26); }
  }, key, [1, 1]);
  A.bayLidval = bay('bayLidval', { wall: '#bfb193', rough: true, ww: 0.36, wh: 0.6, frame: '#5a3a30', trim: '#d0c7ab', small: true, bar: 0.32 });
  A.bayLidvalStone = bay('bayLidvalStone', { wall: '#8c8a84', rough: true, ww: 0.4, wh: 0.52, top: 0.22, frame: '#4a3028', trim: '#77756f', bar: 0.3 });
  A.bayPolit = bay('bayPolit', { wall: '#c9cac6', ww: 0.5, wh: 0.46, top: 0.24, frame: '#eceae4', bar: 0.36, g0: '#8ea9c2', g1: '#40546a' });
  A.bayPolitBalc = bay('bayPolitBalc', { wall: '#c9cac6', ww: 0.5, wh: 0.56, top: 0.2, frame: '#eceae4', bar: 0.3, g0: '#8ea9c2', g1: '#40546a', balcony: '#8f9296' });
  A.bayPolitGlass = D(128, 128, (g, w, h) => { g.fillStyle = '#d5d6d2'; g.fillRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#a9c2d6'); gr.addColorStop(1, '#5a748c'); g.fillStyle = gr; g.fillRect(4, 22, w - 8, h - 44); g.fillStyle = '#eceae4'; for (let i = 0; i <= 4; i++) g.fillRect(i * (w - 8) / 4 + 2, 22, 4, h - 44); g.fillRect(4, 56, w - 8, 3); }, 'bayPolitGlass', [1, 1]);
  A.bayStalin = bay('bayStalin', { wall: '#e0c682', ww: 0.34, wh: 0.58, frame: '#f1ede2', trim: '#efe3bd', bar: 0.3 });
  A.bayStalinBase = bay('bayStalinBase', { wall: '#d2b672', ww: 0.4, wh: 0.6, frame: '#f1ede2', bar: 0.3, band: '#c2a762' });
  A.bayStone = bay('bayStone', { wall: '#d9d2c2', ww: 0.34, wh: 0.58, frame: '#f1ede2', trim: '#ebe6d8', bar: 0.3 });
  A.bayStoneBase = bay('bayStoneBase', { wall: '#cbc3b2', ww: 0.44, wh: 0.62, frame: '#3a3532', bar: 0.26, band: '#bdb5a4', g0: '#59657a', g1: '#2b3340' });
  A.bayBrant = bay('bayBrant', { wall: '#e6e2d6', ww: 0.36, wh: 0.62, frame: '#5a4636', trim: '#f2efe6', bar: 0.28 });
  A.bayLink = bay('bayLink', { wall: '#d9cfae', ww: 0.3, wh: 0.74, top: 0.12, frame: '#5a4636', bar: 0.22 });
  A.bayCourt = bay('bayCourt', { wall: '#d6c79c', ww: 0.3, wh: 0.5, top: 0.22, frame: '#ece8dc', bar: 0.34 });

  // ------------------------------------------------------------------------------------------ surfaces (world uv)
  A.grit = D(256, 256, (g, w, h) => { const r = R(9601); g.fillStyle = '#eee4e0'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1500; i++) { const v = 190 + Math.floor(r() * 60); g.fillStyle = `rgba(${v},${v - 14},${v - 20},0.55)`; const s = 1 + r() * 2.6; g.fillRect(r() * w, r() * h, s, s); } }, 'grit', [1, 1]);
  A.grass = D(256, 256, (g, w, h) => { const r = R(9602); g.fillStyle = '#eef3e4'; g.fillRect(0, 0, w, h); for (let i = 0; i < 520; i++) { const v = 208 + Math.floor(r() * 47); g.fillStyle = `rgba(${v - 24},${v},${v - 40},0.5)`; const s = 3 + r() * 14; g.beginPath(); g.ellipse(r() * w, r() * h, s, s * (0.4 + r() * 0.5), r() * 3.1, 0, TAU); g.fill(); } }, 'grass', [1, 1]);
  A.pavers = D(256, 256, (g, w, h) => { const r = R(9603); g.fillStyle = '#8f8d88'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) for (let x = -32; x < w; x += 32) { const v = 168 + Math.floor(r() * 40); g.fillStyle = `rgb(${v},${v - 3},${v - 7})`; g.fillRect(x + (y / 16 % 2) * 16 + 1, y + 1, 30, 14); } }, 'pavers', [1, 1]);
  A.hedge = D(128, 128, (g, w, h) => { const r = R(9604); g.fillStyle = '#e4eedc'; g.fillRect(0, 0, w, h); for (let i = 0; i < 420; i++) { const v = 170 + Math.floor(r() * 80); g.fillStyle = `rgba(${v - 40},${v},${v - 60},0.6)`; g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * 4, 2 + r() * 3, r() * 3, 0, TAU); g.fill(); } }, 'hedge', [1, 1]);
  A.granitePolished = D(256, 256, (g, w, h) => { const r = R(9605); g.fillStyle = '#e6dcd8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { const v = 120 + Math.floor(r() * 130); g.fillStyle = `rgba(${v},${v - 12},${v - 16},0.42)`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); } }, 'granitePolished', [1, 1]);
  A.gold = D(128, 64, (g, w, h) => { const r = R(9606); g.fillStyle = '#e9b43c'; g.fillRect(0, 0, w, h); for (let j = 0; j < 2; j++) for (let i = -1; i < 2; i++) { const k = 0.9 + r() * 0.2; g.fillStyle = `rgb(${Math.min(255, 238 * k) | 0},${Math.min(255, 186 * k) | 0},${Math.min(255, 66 * k) | 0})`; g.fillRect(i * 64 + j * 32 + 1, j * 32 + 1, 62, 30); } }, 'gold', [1, 1]);

  // ------------------------------------------------------------------------------------------ text plates
  /** an engraved / gilded line of text on stone (key = text) */
  A.text = (text, o = {}) => D(o.w || 512, o.h || 64, (g, w, h) => {
    if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, w, h); } else g.clearRect(0, 0, w, h);
    g.fillStyle = o.fg || '#d9b23c'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const lines = String(text).split('\n');
    lines.forEach((ln, i) => tex.fitText(g, ln, w / 2, h * (i + 0.5) / lines.length + 1, w * 0.92, h / lines.length * 0.74, o.font || tex.FONTS.serif, o.weight || 700));
  }, 'text|' + text + '|' + (o.w || 512) + '|' + (o.h || 64) + '|' + (o.bg || '') + (o.fg || '') + (o.repeat ? 'r' : ''), o.repeat ? [1, 1] : undefined);
  return A;
}
