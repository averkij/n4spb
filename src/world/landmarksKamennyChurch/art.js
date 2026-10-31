// landmarksKamennyChurch/art.js - the canvas paintings of the church and the chapel (every key starts with 'lmKC-'; photos refs/kamenny-2026 C01..C15, H01..H03):
//   brick       the unplastered red brick of the church in stretcher bond (tile 2.08 m: 8 bricks of 0.26 m across, 28 courses of 0.0743 m, light mortar), the walls of C03 / C09
//   brickPaint  the painted brick of the chapel (flat brick red, faint joints; H01 / H02)
//   limestone   grey-beige limestone slabs (porch platform, blind area, chapel steps; tile 3 m)
//   seams       green sheet-copper roof with standing seams every 0.6 m and weathered pale patches (C03 / C05 roofs; tile 2.4 m)
//   scales      the grey sheet "scale" roofs of the tent, the spire and the drum cone (C02 / C05: rows of flat tiles with raised ribs; tile 1.2 m)
//   winLancet   the church windows: dark glazing in amber wooden bars with Y tracery in the pointed head, black iron grille in front (C03 / C09)   (1.15 x 3.5 m)
//   winDrum     the drum windows: white frame, small panes, tracery in the head (C05)                                                                     (0.95 x 2.3 m)
//   door        the main door: two panelled leaves (dark brown left, natural wood right), glazed pointed transom with iron tracery (C02 / C08)          (2.3 x 4.4 m)
//   plaques     one atlas: the white name plate, the black plaque "Памятник архитектуры", a small icon, the Pushkin plaque, the chapel plate (texts: docs/research/kamenny-2026.md 5.2)
//   mosaic      the mosaic icon of the Mother of God Vsetsaritsa on the back wall of the chapel (H03)
const TAU = Math.PI * 2;
export const ATLAS = {                    // uv rectangles of the plaque atlas (u0, v0, u1, v1; v up)
  white: [0, 1 - 384 / 1024, 256 / 1024, 1],
  black: [256 / 1024, 1 - 384 / 1024, 512 / 1024, 1],
  icon: [512 / 1024, 1 - 192 / 1024, 640 / 1024, 1],
  pushkin: [0, 1 - 576 / 1024, 256 / 1024, 1 - 384 / 1024],
  chapel: [256 / 1024, 1 - 576 / 1024, 512 / 1024, 1 - 384 / 1024],
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {};
  const D = (w, h, fn, key, o = {}) => tex.draw(w, h, fn, { key: 'lmKC-' + key, repeat: [1, 1], ...o });
  const rr = (seed) => ctx.rng(seed);

  // ---------------------------------------------------------------------------------------------- brick
  A.brick = D(1024, 1024, (g, w, h) => {
    const r = rr(7711), rows = 28, rh = h / rows, bw = w / 8;
    g.fillStyle = '#cdb09b'; g.fillRect(0, 0, w, h);
    const tones = ['#b4553f', '#ab4e3a', '#be5f48', '#a24837', '#b85a43', '#ae5240', '#9d4636', '#c2674f', '#b0503c'];
    for (let j = 0; j < rows; j++) {
      const off = (j % 2) * bw / 2;
      for (let i = -1; i < 9; i++) {
        const x = i * bw + off, y = j * rh;
        g.fillStyle = tones[(r() * tones.length) | 0]; g.fillRect(x + 2, y + 2.2, bw - 4, rh - 4.4);
        const k = r();
        if (k < 0.07) { g.fillStyle = 'rgba(70,26,20,0.38)'; g.fillRect(x + 2, y + 2.2, bw - 4, rh - 4.4); }
        else if (k < 0.2) { g.fillStyle = 'rgba(255,196,160,0.14)'; g.fillRect(x + 2, y + 2.2, bw - 4, rh - 4.4); }
        else if (k < 0.3) { g.fillStyle = 'rgba(60,20,16,0.16)'; g.fillRect(x + 2, y + 2.2, bw - 4, rh - 4.4); }
        if (r() < 0.25) { g.fillStyle = 'rgba(40,16,12,0.18)'; g.fillRect(x + 2 + r() * (bw - 20), y + 3 + r() * (rh - 12), 6 + r() * 14, 2 + r() * 3); }
      }
    }
    for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,225,205,0.10)' : 'rgba(50,20,16,0.10)'; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5); }
  }, 'brick', { anisotropy: 8 });

  A.brickPaint = D(1024, 1024, (g, w, h) => {
    const r = rr(311), rows = 28, rh = h / rows, bw = w / 8;
    g.fillStyle = '#c54a2b'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < rows; j++) {
      const off = (j % 2) * bw / 2;
      for (let i = -1; i < 9; i++) {
        const x = i * bw + off, y = j * rh, v = (r() - 0.5) * 0.07;
        g.fillStyle = v > 0 ? `rgba(255,170,130,${v})` : `rgba(80,16,6,${-v})`; g.fillRect(x + 2, y + 2, bw - 4, rh - 4);
      }
    }
    g.strokeStyle = 'rgba(120,28,10,0.55)'; g.lineWidth = 2.6;
    for (let j = 0; j <= rows; j++) { g.beginPath(); g.moveTo(0, j * rh); g.lineTo(w, j * rh); g.stroke(); }
    for (let j = 0; j < rows; j++) { const off = (j % 2) * bw / 2; for (let i = -1; i < 9; i++) { g.beginPath(); g.moveTo(i * bw + off, j * rh); g.lineTo(i * bw + off, (j + 1) * rh); g.stroke(); } }
    for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,190,150,0.08)' : 'rgba(70,14,6,0.09)'; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
  }, 'brickPaint', { anisotropy: 8 });

  // pink plaster (plinth, buttresses): a fine speckle and soft trowel marks
  A.plaster = D(256, 256, (g, w, h) => {
    const r = rr(66); g.fillStyle = '#b3605b'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,210,200,0.10)' : 'rgba(90,30,30,0.10)'; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
    for (let i = 0; i < 18; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,225,215,0.07)' : 'rgba(80,28,28,0.07)'; g.beginPath(); g.ellipse(r() * w, r() * h, 12 + r() * 30, 6 + r() * 14, r() * 3, 0, TAU); g.fill(); }
  }, 'plaster');

  // ---------------------------------------------------------------------------------------------- limestone slabs
  A.limestone = D(512, 512, (g, w, h) => {
    const r = rr(2711), tones = ['#bdb7aa', '#b2ad9f', '#c5bfb1', '#aaa597', '#b8b2a4', '#c0baad'];
    g.fillStyle = '#7e796f'; g.fillRect(0, 0, w, h);
    let y = 0;
    while (y < h - 4) {
      const rh = Math.min(h - y, 70 + r() * 70); let x = -r() * 120;
      while (x < w) {
        const bw = 110 + r() * 150; g.fillStyle = tones[(r() * tones.length) | 0]; g.fillRect(x + 2, y + 2, bw - 4, rh - 4);
        for (let i = 0; i < 9; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,250,235,0.14)' : 'rgba(70,64,52,0.13)'; g.fillRect(x + r() * bw, y + r() * rh, 4 + r() * 16, 3 + r() * 10); }
        if (r() < 0.4) { g.strokeStyle = 'rgba(70,64,56,0.4)'; g.lineWidth = 1.2; g.beginPath(); const sx = x + r() * bw, sy = y + 2; g.moveTo(sx, sy); g.lineTo(sx + (r() - 0.5) * 30, sy + rh * 0.5); g.lineTo(sx + (r() - 0.5) * 40, sy + rh - 3); g.stroke(); }
        x += bw;
      }
      y += rh;
    }
    for (const dx of [0, w]) for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(70,96,60,0.10)'; g.beginPath(); g.ellipse(r() * w + dx - dx, r() * h, 8 + r() * 20, 3 + r() * 7, r() * 3, 0, TAU); g.fill(); }
  }, 'limestone', { anisotropy: 6 });

  // ---------------------------------------------------------------------------------------------- roofs
  A.seams = D(512, 512, (g, w, h) => {
    const r = rr(907);
    g.fillStyle = '#7b9a89'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      const x = i * w / 4; g.fillStyle = 'rgba(30,60,46,0.34)'; g.fillRect(x - 2, 0, 4, h); g.fillStyle = 'rgba(190,225,205,0.22)'; g.fillRect(x + 2, 0, 3, h);
      g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x + 8, 0, w / 4 - 16, h);
    }
    g.fillStyle = 'rgba(30,60,46,0.22)'; g.fillRect(0, h * 0.5 - 1, w, 3);
    for (let i = 0; i < 22; i++) { g.fillStyle = r() < 0.6 ? 'rgba(176,196,184,0.30)' : 'rgba(54,84,70,0.20)'; g.beginPath(); g.ellipse(r() * w, r() * h, 14 + r() * 40, 8 + r() * 24, r() * 3, 0, TAU); g.fill(); }
  }, 'seams', { anisotropy: 6 });

  A.scales = D(512, 512, (g, w, h) => {
    const r = rr(5431), rows = 8, rh = h / rows, cols = 6, cw = w / cols;
    g.fillStyle = '#6f777c'; g.fillRect(0, 0, w, h);
    const tones = ['#b7bcbf', '#aeb3b6', '#bfc4c6', '#a6abae', '#b3b8bb'];
    for (let j = 0; j < rows; j++) {
      const off = (j % 2) * cw / 2;
      for (let i = -1; i < cols + 1; i++) {
        const x = i * cw + off, y = j * rh;
        g.fillStyle = tones[(r() * tones.length) | 0]; g.beginPath(); g.moveTo(x + 3, y + 2); g.lineTo(x + cw - 3, y + 2); g.lineTo(x + cw - 3, y + rh - 8); g.quadraticCurveTo(x + cw / 2, y + rh + 1, x + 3, y + rh - 8); g.closePath(); g.fill();
        g.fillStyle = 'rgba(40,46,52,0.30)'; g.fillRect(x + 3, y + rh - 11, cw - 6, 4);
        g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x + 4, y + 3, cw - 8, 3);
        if (r() < 0.07) { g.fillStyle = 'rgba(120,96,70,0.22)'; g.fillRect(x + 6, y + 6, cw - 12, rh - 18); }
      }
    }
    g.fillStyle = 'rgba(60,66,72,0.5)'; g.fillRect(0, 0, 5, h); g.fillStyle = 'rgba(214,218,220,0.38)'; g.fillRect(5, 0, 3, h);
  }, 'scales', { anisotropy: 6 });

  // ---------------------------------------------------------------------------------------------- windows
  const glass = (g, x, y, w, h, hot = 0.16) => {
    g.fillStyle = '#1f2a37'; g.fillRect(x, y, w, h);
    const gr = g.createLinearGradient(x, y, x + w * 0.9, y + h * 0.9); gr.addColorStop(0, 'rgba(150,190,220,0.40)'); gr.addColorStop(0.5, 'rgba(60,90,125,0.06)'); gr.addColorStop(1, `rgba(255,200,130,${hot})`);
    g.fillStyle = gr; g.fillRect(x, y, w, h);
  };
  A.winLancet = D(128, 384, (g, w, h) => {
    glass(g, 0, 0, w, h);
    const headH = h * 0.285;                                              // rise 1.0 m of 3.5 m
    const amber = '#c4812f', amberD = '#8f5a1c';
    g.strokeStyle = amber; g.lineCap = 'butt';
    g.lineWidth = 7; g.strokeRect(3.5, 3.5, w - 7, h - 7);                  // jamb frame (the head is clipped by the pointed geometry)
    g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, headH * 0.55); g.lineTo(w / 2, h); g.stroke();
    // Y tracery: two arcs rising from the sides of the mullion to the apex
    g.lineWidth = 5; g.beginPath(); g.moveTo(w / 2, headH + 4); g.bezierCurveTo(w * 0.26, headH * 0.78, w * 0.28, headH * 0.34, w * 0.5, 2); g.stroke();
    g.beginPath(); g.moveTo(w / 2, headH + 4); g.bezierCurveTo(w * 0.74, headH * 0.78, w * 0.72, headH * 0.34, w * 0.5, 2); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(w * 0.14, headH * 1.02); g.quadraticCurveTo(w * 0.3, headH * 0.55, w * 0.5, headH * 0.55); g.quadraticCurveTo(w * 0.7, headH * 0.55, w * 0.86, headH * 1.02); g.stroke();
    for (let i = 0; i < 6; i++) { const y = headH + 18 + i * (h - headH - 36) / 5.4; g.lineWidth = 4; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = amberD; g.lineWidth = 1.4; g.strokeRect(7, 7, w - 14, h - 14);
    // the black iron grille in front
    g.strokeStyle = '#17181a'; g.fillStyle = '#17181a'; g.lineWidth = 2.6;
    for (let i = 1; i < 10; i++) { const x = i * w / 10; g.beginPath(); g.moveTo(x, 6); g.lineTo(x, h); g.stroke(); }
    g.lineWidth = 3.4; for (const f of [0.5, 0.74, 0.93]) { g.beginPath(); g.moveTo(0, h * f); g.lineTo(w, h * f); g.stroke(); }
  }, 'winLancet', { anisotropy: 8 });

  A.winDrum = D(96, 240, (g, w, h) => {
    glass(g, 0, 0, w, h);
    const headH = h * 0.29;
    g.strokeStyle = '#f0ede5'; g.lineCap = 'butt';
    g.lineWidth = 7; g.strokeRect(3.5, 3.5, w - 7, h - 7);
    g.lineWidth = 4.5; g.beginPath(); g.moveTo(w / 2, headH * 0.5); g.lineTo(w / 2, h); g.stroke();
    g.lineWidth = 3.4; g.beginPath(); g.moveTo(w / 2, headH + 3); g.bezierCurveTo(w * 0.26, headH * 0.78, w * 0.28, headH * 0.34, w * 0.5, 2); g.stroke();
    g.beginPath(); g.moveTo(w / 2, headH + 3); g.bezierCurveTo(w * 0.74, headH * 0.78, w * 0.72, headH * 0.34, w * 0.5, 2); g.stroke();
    for (let i = 0; i < 6; i++) { const y = headH + 16 + i * (h - headH - 28) / 5.5; g.lineWidth = 3; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  }, 'winDrum', { anisotropy: 8 });

  // ---------------------------------------------------------------------------------------------- main door (2.3 x 4.4 m, pointed opening)
  A.door = D(128, 256, (g, w, h) => {
    const leaf = h * 0.66, top = h - leaf;                                   // leaves occupy the lower 66 percent (2.9 m of 4.4 m)
    glass(g, 0, 0, w, top + 2, 0.22);
    g.strokeStyle = '#18191b'; g.fillStyle = '#18191b'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, top); g.stroke();
    g.lineWidth = 2.4; g.beginPath(); g.moveTo(w / 2, top * 0.6); g.bezierCurveTo(w * 0.28, top * 0.5, w * 0.26, top * 0.2, w / 2, 0); g.stroke();
    g.beginPath(); g.moveTo(w / 2, top * 0.6); g.bezierCurveTo(w * 0.72, top * 0.5, w * 0.74, top * 0.2, w / 2, 0); g.stroke();
    for (const f of [0.35, 0.68]) { g.beginPath(); g.moveTo(0, top * f); g.lineTo(w, top * f); g.stroke(); }
    g.beginPath(); g.arc(w / 2, top * 0.75, 7, 0, TAU); g.stroke();
    g.fillStyle = '#18191b'; g.fillRect(0, top - 3, w, 6);
    // leaves
    const L = [['#4a2e22', '#5b392b', '#3a2218'], ['#b9822f', '#c8923a', '#9a6a22']];
    for (let k = 0; k < 2; k++) {
      const x0 = k * w / 2 + 2, ww = w / 2 - 4, c = L[k];
      g.fillStyle = c[0]; g.fillRect(x0, top + 5, ww, leaf - 5);
      const panels = [[top + 14, leaf * 0.5], [top + 14 + leaf * 0.5 + 8, leaf * 0.2], [top + 14 + leaf * 0.7 + 14, leaf * 0.22]];
      for (const [y0, hh] of panels) { g.fillStyle = c[1]; g.fillRect(x0 + 6, y0, ww - 12, hh); g.strokeStyle = c[2]; g.lineWidth = 2; g.strokeRect(x0 + 8, y0 + 2, ww - 16, hh - 4); }
    }
    g.fillStyle = '#d8b24e'; g.fillRect(w / 2 - 12, top + leaf * 0.5, 4, 26); g.fillRect(w / 2 + 8, top + leaf * 0.5, 4, 26);
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(w / 2 - 1, top + 5, 2, leaf - 5);
  }, 'door');

  // ---------------------------------------------------------------------------------------------- plaques atlas
  const atlas = D(1024, 1024, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const F = tex.FONTS;
    // (0,0) 256 x 384: the white name plate
    g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, 256, 384); g.strokeStyle = '#8c8a84'; g.lineWidth = 3; g.strokeRect(4, 4, 248, 376);
    g.fillStyle = '#2f2f2f'; g.fillRect(124, 16, 8, 28); g.fillRect(114, 24, 28, 7);
    g.fillStyle = '#6a6a66'; for (let i = 0; i < 3; i++) g.fillRect(52 + i * 3, 56 + i * 15, 152 - i * 6, 5);
    g.fillStyle = '#2a2a28'; g.textAlign = 'center'; g.textBaseline = 'middle';
    tex.fitText(g, 'Православная церковь', 128, 112, 200, 20, F.serif, 600);
    tex.fitText(g, 'РОЖДЕСТВА', 128, 168, 220, 38, F.serif, 700);
    tex.fitText(g, 'ИОАННА', 128, 214, 220, 38, F.serif, 700);
    tex.fitText(g, 'ПРЕДТЕЧИ', 128, 260, 220, 38, F.serif, 700);
    tex.fitText(g, 'построена в 1778 г.', 128, 312, 200, 19, F.serif, 600);
    tex.fitText(g, 'арх. Ю. М. Фельтен', 128, 340, 200, 19, F.serif, 600);
    // (256,0) 256 x 384: the black plaque
    g.fillStyle = '#1d201e'; g.fillRect(256, 0, 256, 384); g.strokeStyle = '#4a4d46'; g.lineWidth = 4; g.strokeRect(262, 6, 244, 372);
    g.fillStyle = '#8f9082'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const lines = [['ПАМЯТНИК', 18], ['АРХИТЕКТУРЫ', 20], ['XVIII', 18], ['ВЕКА', 14], ['ЗДАНИЕ', 15], ['ПРЕДТЕЧЕНСКОЙ', 21], ['ЦЕРКВИ', 20], ['ПОСТРОЕНО', 16], ['В 1776-1777 ГГ.', 18], ['АРХИТЕКТОР', 15], ['Ю. ФЕЛЬТЕН', 22], ['ОХРАНЯЕТСЯ', 16], ['ГОСУДАРСТВОМ', 17]];
    let y = 26; for (const [t, s] of lines) { tex.fitText(g, t, 384, y, 224, s, F.serif, 700); y += s + 9.6; }
    // (512,0) 128 x 192: a small framed icon
    g.fillStyle = '#f2f0ea'; g.fillRect(512, 0, 128, 192); g.fillStyle = '#4a3a24'; g.fillRect(522, 10, 108, 172);
    g.fillStyle = '#c8a24a'; g.fillRect(526, 14, 100, 164); g.fillStyle = '#6d4a2a'; g.beginPath(); g.ellipse(576, 66, 22, 26, 0, 0, TAU); g.fill(); g.fillStyle = '#7b2a28'; g.beginPath(); g.moveTo(540, 176); g.lineTo(552, 100); g.lineTo(600, 100); g.lineTo(612, 176); g.closePath(); g.fill();
    g.strokeStyle = '#e8c860'; g.lineWidth = 3; g.beginPath(); g.ellipse(576, 62, 30, 34, 0, 0, TAU); g.stroke();
    // (0,384) 256 x 192: the Pushkin plaque (OSM n1158861685)
    g.fillStyle = '#d9d6cd'; g.fillRect(0, 384, 256, 192); g.strokeStyle = '#7d7b73'; g.lineWidth = 4; g.strokeRect(6, 390, 244, 180);
    g.fillStyle = '#2b2b2a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    tex.fitText(g, 'Здесь', 128, 424, 200, 26, F.serif, 700);
    tex.fitText(g, 'А. С. Пушкин', 128, 466, 220, 34, F.serif, 700);
    tex.fitText(g, 'крестил своих', 128, 508, 220, 28, F.serif, 700);
    tex.fitText(g, 'детей', 128, 546, 200, 28, F.serif, 700);
    // (256,384) 256 x 192: the chapel plate
    g.fillStyle = '#f2f0ea'; g.fillRect(256, 384, 256, 192); g.strokeStyle = '#8c8a84'; g.lineWidth = 3; g.strokeRect(262, 390, 244, 180);
    g.fillStyle = '#2a2a28'; g.textAlign = 'center'; g.textBaseline = 'middle';
    tex.fitText(g, 'Часовня', 384, 424, 200, 26, F.serif, 700);
    tex.fitText(g, 'иконы Божией Матери', 384, 462, 228, 22, F.serif, 600);
    tex.fitText(g, '«Всецарица»', 384, 508, 228, 34, F.serif, 700);
  }, 'plaques', { repeat: null, anisotropy: 8 });
  A.plaques = atlas;

  // ---------------------------------------------------------------------------------------------- mosaic of the chapel (1.9 x 3.4 m pointed niche)
  A.mosaic = D(256, 448, (g, w, h) => {
    const r = rr(404);
    g.fillStyle = '#d6b45a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,238,170,0.30)' : 'rgba(150,110,30,0.25)'; g.fillRect(r() * w, r() * h, 3 + r() * 5, 3 + r() * 5); }
    g.fillStyle = '#c5321f'; g.textAlign = 'center'; g.textBaseline = 'middle';
    tex.fitText(g, 'ОБРАЗЪ', w / 2, 46, 120, 16, tex.FONTS.serif, 700); tex.fitText(g, 'ПР. БЦЫ', w / 2, 66, 120, 15, tex.FONTS.serif, 700); tex.fitText(g, 'ВСЕЦАРИЦА', w / 2, 94, 170, 26, tex.FONTS.serif, 700);
    // throne
    g.fillStyle = '#c99a32'; g.fillRect(40, 190, 176, 190); g.fillStyle = '#7b3a2a'; g.fillRect(52, 210, 152, 30);
    g.fillStyle = '#35604f'; g.fillRect(0, 330, w, 70);
    g.fillStyle = '#c4452e'; g.beginPath(); g.moveTo(70, 400); g.lineTo(186, 400); g.lineTo(176, 372); g.lineTo(80, 372); g.closePath(); g.fill();
    // angels
    for (const s of [-1, 1]) { const x = w / 2 + s * 78; g.fillStyle = s < 0 ? '#b8452e' : '#2e4f86'; g.beginPath(); g.moveTo(x - 18, 230); g.lineTo(x + 18, 230); g.lineTo(x + 26, 150); g.lineTo(x - 26, 150); g.closePath(); g.fill(); g.fillStyle = '#e0b890'; g.beginPath(); g.arc(x, 136, 13, 0, TAU); g.fill(); g.strokeStyle = '#f0c850'; g.lineWidth = 3; g.beginPath(); g.arc(x, 134, 18, 0, TAU); g.stroke(); }
    // Mother of God
    g.fillStyle = '#6e1d28'; g.beginPath(); g.moveTo(128, 150); g.bezierCurveTo(80, 170, 60, 260, 68, 370); g.lineTo(184, 370); g.bezierCurveTo(196, 260, 176, 170, 128, 150); g.closePath(); g.fill();
    g.fillStyle = '#3d6aa0'; g.beginPath(); g.moveTo(104, 270); g.lineTo(152, 270); g.lineTo(168, 372); g.lineTo(90, 372); g.closePath(); g.fill();
    g.fillStyle = '#e0b890'; g.beginPath(); g.ellipse(128, 142, 17, 22, 0, 0, TAU); g.fill();
    g.strokeStyle = '#f3d062'; g.lineWidth = 5; g.beginPath(); g.arc(128, 140, 36, 0, TAU); g.stroke();
    // the Child
    g.fillStyle = '#e8a838'; g.beginPath(); g.moveTo(138, 200); g.lineTo(190, 205); g.lineTo(184, 300); g.lineTo(140, 300); g.closePath(); g.fill();
    g.fillStyle = '#e0b890'; g.beginPath(); g.arc(166, 188, 13, 0, TAU); g.fill(); g.strokeStyle = '#f3d062'; g.lineWidth = 3.5; g.beginPath(); g.arc(166, 186, 20, 0, TAU); g.stroke();
    // tesserae grid
    g.strokeStyle = 'rgba(40,30,10,0.16)'; g.lineWidth = 1; for (let x = 0; x < w; x += 7) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 7) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  }, 'mosaic', { repeat: null });

  return A;
}
