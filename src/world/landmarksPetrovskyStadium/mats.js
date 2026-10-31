// landmarksPetrovskyStadium/mats.js - the materials of the Petrovsky stadium sight (every key starts with 'lmPS-'; all through ctx.mat / ctx.tex, <= 22 materials, 9 canvas textures, ~1.6 Mpx):
//   seats     two-tone blue seat rows (photos s01 s02 s12: dark #2a58a6 / light #6f9bd6 sectors, grey concrete treads); atlas 512 x 256 = 2 tiles of 13 seats x 4 rows, one tile per bay, v = rows / 4
//   wall      the back wall of the gallery, atlas 1024 x 512 = 4 bay tiles (6.6 x 8 m each): windows / ticket hatch / the entrance with red doors and a plain "ВХОД" board / blank (photos s12 s04)
//   soffit    the MAROON soffit under the cornice #8a2f2a with lighter rafters (the colour the old module missed: s12)
//   pitch     striped turf 105 x 68 m with the real markings (1024 x 656 px, one quad)
//   track / turf / lane / apron / lamps / brick / roof ... plain or small tiles
// Alpha cut-outs (the blue fence) are listed in M.cutouts (no outline pass).
const TAU = Math.PI * 2;
const rngOf = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

export function makeMats(ctx) {
  const T = ctx.mat.toon, tex = ctx.tex;
  const D = (w, h, fn, key, o = {}) => tex.draw(w, h, fn, { key: 'lmPS-' + key, repeat: [1, 1], ...o });
  const speck = (g, w, h, seed, n, cols, s = 2) => { const r = rngOf(seed); for (let i = 0; i < n; i++) { g.fillStyle = cols[(r() * cols.length) | 0]; g.fillRect(r() * w, r() * h, 1 + r() * s, 1 + r() * s); } };
  const glass = (g, x, y, w, h) => { g.fillStyle = '#26303a'; g.fillRect(x, y, w, h); const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, 'rgba(160,190,215,0.45)'); gr.addColorStop(0.6, 'rgba(60,90,125,0.05)'); gr.addColorStop(1, 'rgba(16,22,30,0.3)'); g.fillStyle = gr; g.fillRect(x, y, w, h); };

  // ---- seats: 2 tiles side by side, each 256 x 256 = 13 seats across, 4 rows
  const seatTex = D(512, 256, (g, w, h) => {
    const cols = [{ back: '#1f4c9c', seat: '#163a7a', hi: '#2f66bd' }, { back: '#5b92da', seat: '#3f74c0', hi: '#86b2ec' }];
    cols.forEach((c, t) => {
      const x0 = t * 256;
      g.fillStyle = '#80868c'; g.fillRect(x0, 0, 256, 256);
      for (let j = 0; j < 4; j++) {
        const y0 = j * 64;
        g.fillStyle = '#6f757b'; g.fillRect(x0, y0 + 56, 256, 8);                       // the shadowed riser
        g.fillStyle = '#979ca1'; g.fillRect(x0, y0 + 50, 256, 6);                       // the tread edge
        for (let i = 0; i < 13; i++) {
          const x = x0 + 4 + i * 19.0;
          g.fillStyle = c.back; g.fillRect(x, y0 + 4, 17, 27);                          // backrest
          g.fillStyle = c.hi; g.fillRect(x, y0 + 4, 17, 4);
          g.fillStyle = c.seat; g.fillRect(x, y0 + 31, 17, 17);                         // seat pan
        }
      }
      g.fillStyle = '#b9bcbe'; g.fillRect(x0, 0, 3, 256); g.fillRect(x0 + 253, 0, 3, 256);   // the aisle steps between the sectors
    });
  }, 'seats');

  // ---- gallery wall atlas: v 0 = floor, v 1 = 8 m; canvas y = 512 - 64 m
  const wallTex = D(1024, 512, (g, w, h) => {
    const base = '#e8d385';
    const frame = '#8c3a2b', white = '#f1ead2';
    const cy = (m) => h - m * 64, cx = (t, m) => t * 256 + m * 38.8;
    const win = (t, m, wm, y0m, y1m, fr = frame) => {                                       // a window of the wall: red frame, dark glass, a mullion
      const x = cx(t, m - wm / 2), yy = cy(y1m), ww = wm * 38.8, hh = (y1m - y0m) * 64;
      g.fillStyle = fr; g.fillRect(x - 3, yy - 3, ww + 6, hh + 6); glass(g, x, yy, ww, hh);
      g.fillStyle = white; g.fillRect(x + ww / 2 - 1.5, yy, 3, hh); g.fillRect(x, yy + hh * 0.34, ww, 3);
      g.fillStyle = '#c8bc86'; g.fillRect(x - 5, yy + hh + 3, ww + 10, 5);                // the sill
    };
    for (let t = 0; t < 4; t++) {
      g.fillStyle = base; g.fillRect(t * 256, 0, 256, h);
      const r = rngOf(900 + t);
      for (let i = 0; i < 220; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,245,205,0.22)' : 'rgba(165,135,75,0.14)'; g.fillRect(t * 256 + r() * 256, r() * h, 2 + r() * 9, 2 + r() * 7); }
      const gr = g.createLinearGradient(0, h - 90, 0, h); gr.addColorStop(0, 'rgba(120,100,60,0)'); gr.addColorStop(1, 'rgba(120,100,60,0.28)'); g.fillStyle = gr; g.fillRect(t * 256, h - 90, 256, 90);   // damp grime at the foot
      g.fillStyle = 'rgba(95,75,40,0.35)'; g.fillRect(t * 256, 0, 256, 12);                                                                                                                   // shadow under the entablature
      g.fillStyle = '#d6c986'; g.fillRect(t * 256, h - 22, 256, 22);                                                                                                                            // a low plinth band
    }
    // the plain upper wall carries horizontal rustication grooves (s05, s12: ONE row of windows in the lower half of the bay, the wall above them is blank)
    for (let t = 0; t < 4; t++) for (const m of [3.75, 4.35, 4.95, 5.55, 6.15, 6.75]) { g.fillStyle = 'rgba(110,90,45,0.30)'; g.fillRect(t * 256, cy(m), 256, 3); g.fillStyle = 'rgba(255,248,215,0.22)'; g.fillRect(t * 256, cy(m) + 3, 256, 2); }
    // tile 0: a PAIR of tall windows (1.2 x 2.45 m) per bay
    for (const m of [2.45, 4.15]) win(0, m, 1.2, 0.95, 3.4);
    // tile 1: ticket hatches (small windows with a shelf), a window at either side
    win(1, 0.95, 1.1, 0.95, 3.4); win(1, 5.65, 1.1, 0.95, 3.4);
    for (const m of [2.45, 4.15]) { g.fillStyle = frame; g.fillRect(cx(1, m - 0.8), cy(2.6), 1.6 * 38.8, 1.3 * 64); glass(g, cx(1, m - 0.65), cy(2.45), 1.3 * 38.8, 1.0 * 64); }
    // tile 2: the entrance, a 3.4 x 3.9 m opening with red double doors under a glazed transom, cream pilasters and a plain board
    { const x = cx(2, 1.6), ww = 3.4 * 38.8, y1 = cy(3.9), hh = 3.9 * 64;
      g.fillStyle = white; g.fillRect(x - 12, y1 - 12, ww + 24, hh + 12);                                                                   // the frame
      g.fillStyle = '#1b1a1c'; g.fillRect(x, y1, ww, hh);
      glass(g, x + 3, y1 + 3, ww - 6, 62);                                                                                                   // transom
      g.fillStyle = '#9b2d25'; g.fillRect(x + 3, y1 + 70, ww / 2 - 5, hh - 70); g.fillRect(x + ww / 2 + 2, y1 + 70, ww / 2 - 5, hh - 70);
      g.fillStyle = '#7d2019'; for (const dx of [0, ww / 2 + 2]) { g.fillRect(x + 3 + dx + 10, y1 + 82, ww / 2 - 25, 60); g.fillRect(x + 3 + dx + 10, y1 + 160, ww / 2 - 25, hh - 180); }
      g.fillStyle = '#d6b055'; g.fillRect(x + ww / 2 - 9, y1 + 150, 4, 24); g.fillRect(x + ww / 2 + 5, y1 + 150, 4, 24);
      g.fillStyle = '#2b5aa8'; g.fillRect(x - 12, y1 - 62, ww + 24, 42); g.fillStyle = '#f4f1e6'; g.font = 'bold 30px ' + (tex.FONTS ? tex.FONTS.sans : 'sans-serif'); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ВХОД', x + ww / 2, y1 - 40);
      g.fillStyle = white; g.fillRect(x - 28, 0, 14, h); g.fillRect(x + ww + 14, 0, 14, h);                                                // the pilasters
    }
    // tile 3: two spaced windows with white frames (the service bays of s05)
    win(3, 1.9, 1.2, 0.95, 3.4, white); win(3, 4.9, 1.2, 0.95, 3.4, white);
  }, 'wall');

  // ---- maroon soffit: u = along the ring (one bay), v = across the gallery (4 m)
  const soffitTex = D(128, 128, (g, w, h) => {
    g.fillStyle = '#8a2f2a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#7a2824'; g.fillRect(10, 8, w - 20, h - 16);
    g.fillStyle = '#a8423b'; g.fillRect(0, 0, 8, h); g.fillRect(w - 8, 0, 8, h); g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6);
    g.fillStyle = '#93332d'; g.fillRect(w / 2 - 3, 8, 6, h - 16);
    speck(g, w, h, 321, 90, ['rgba(255,220,200,0.10)', 'rgba(40,10,8,0.18)'], 3);
  }, 'soffit');

  // ---- the pitch (one quad, 105 x 68 m): mown stripes and the markings of a football pitch
  const pitchTex = D(1024, 656, (g, w, h) => {
    const sx = w / 104.9, sy = h / 68;                                                       // px per metre
    for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? '#5aa844' : '#4f9a3a'; g.fillRect(i * w / 14, 0, w / 14 + 1, h); }
    speck(g, w, h, 777, 900, ['rgba(40,90,30,0.2)', 'rgba(130,200,100,0.18)'], 3);
    g.strokeStyle = '#eeede2'; g.lineWidth = 3; g.fillStyle = '#eeede2';
    const R = (x0, y0, x1, y1) => g.strokeRect(x0 * sx, y0 * sy, (x1 - x0) * sx, (y1 - y0) * sy);
    g.strokeRect(2, 2, w - 4, h - 4);
    g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
    g.beginPath(); g.arc(w / 2, h / 2, 9.15 * sy, 0, TAU); g.stroke();
    g.beginPath(); g.arc(w / 2, h / 2, 5, 0, TAU); g.fill();
    for (const side of [0, 1]) {
      const x0 = side ? 104.9 : 0, sg = side ? -1 : 1;
      R(Math.min(x0, x0 + sg * 16.5), 34 - 20.16, Math.max(x0, x0 + sg * 16.5), 34 + 20.16);
      R(Math.min(x0, x0 + sg * 5.5), 34 - 9.16, Math.max(x0, x0 + sg * 5.5), 34 + 9.16);
      g.beginPath(); g.arc((x0 + sg * 11) * sx, 34 * sy, 5, 0, TAU); g.fill();
      const a = Math.acos(5.5 / 9.15);
      g.beginPath(); g.arc((x0 + sg * 11) * sx, 34 * sy, 9.15 * sy, side ? Math.PI - a : -a, side ? Math.PI + a : a); g.stroke();
    }
  }, 'pitch', { repeat: null });

  const turfTex = D(128, 128, (g, w, h) => { g.fillStyle = '#58a141'; g.fillRect(0, 0, w, h); speck(g, w, h, 41, 260, ['rgba(40,90,30,0.2)', 'rgba(130,200,100,0.2)'], 3); }, 'turf');
  const trackTex = D(128, 128, (g, w, h) => { g.fillStyle = '#b0493a'; g.fillRect(0, 0, w, h); speck(g, w, h, 5603, 380, ['rgba(120,40,30,0.3)', 'rgba(215,120,100,0.25)', 'rgba(90,30,24,0.2)'], 2); }, 'track');
  const apronTex = D(256, 256, (g, w, h) => {
    g.fillStyle = '#b4b1a9'; g.fillRect(0, 0, w, h);
    speck(g, w, h, 5604, 900, ['rgba(140,138,130,0.28)', 'rgba(215,212,204,0.30)', 'rgba(110,108,100,0.2)'], 3);
    g.fillStyle = 'rgba(96,94,88,0.55)'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h); g.fillRect(w / 2, 0, 1.5, h); g.fillRect(0, h / 2, w, 1.5);        // expansion joints every 4 m (tile 8 m)
  }, 'apron');
  const lampsTex = D(256, 64, (g, w, h) => {
    g.fillStyle = '#4a5258'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 20; i++) { const x = (i + 0.5) * w / 20; g.fillStyle = '#d9dee1'; g.beginPath(); g.arc(x, h * 0.5, 9.5, 0, TAU); g.fill(); g.fillStyle = '#f4f6f6'; g.beginPath(); g.arc(x, h * 0.5, 5.5, 0, TAU); g.fill(); g.strokeStyle = '#2d3338'; g.lineWidth = 2; g.beginPath(); g.arc(x, h * 0.5, 10.5, 0, TAU); g.stroke(); }
  }, 'lamps');
  const brickTex = D(64, 128, (g, w, h) => {
    g.fillStyle = '#a0503b'; g.fillRect(0, 0, w, h); const r = rngOf(88);
    for (let j = 0; j < 16; j++) for (let i = 0; i < 4; i++) { g.fillStyle = ['#a8573f', '#9a4a36', '#b0614a', '#92432f'][(r() * 4) | 0]; g.fillRect(i * 16 + (j % 2) * 8 + 1, j * 8 + 1, 14, 6); }
    g.fillStyle = 'rgba(60,40,30,0.5)'; for (let j = 0; j < 16; j++) g.fillRect(0, j * 8, w, 1);
  }, 'brick');
  const fenceTex = D(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#2058b0';
    g.fillRect(0, 6, w, 7); g.fillRect(0, h - 14, w, 7);                                       // two rails
    for (let i = 0; i < 8; i++) g.fillRect(i * 16 + 6, 0, 4, h);                              // pickets (tile 2.4 m)
  }, 'fence');

  const M = {
    seats: T('#ffffff', { map: seatTex, name: 'lmPS-seats', paint: 0.02 }),
    wall: T('#ffffff', { map: wallTex, name: 'lmPS-wall', paint: 0.03 }),
    soffit: T('#ffffff', { map: soffitTex, name: 'lmPS-soffit', paint: 0.02 }),
    cream: T('#ece0b0', { name: 'lmPS-cream', paint: 0.04 }),
    concrete: T('#aeaca4', { name: 'lmPS-concrete', paint: 0.05 }),
    apron: T('#ffffff', { map: apronTex, name: 'lmPS-apron', paint: 0.05, polygonOffset: -2 }),
    track: T('#ffffff', { map: trackTex, name: 'lmPS-track', paint: 0.03, polygonOffset: -2 }), turf: T('#ffffff', { map: turfTex, name: 'lmPS-turf', paint: 0.03, polygonOffset: -3 }),
    pitch: T('#ffffff', { map: pitchTex, name: 'lmPS-pitch', paint: 0.02, polygonOffset: -4 }),
    lane: T('#f1eee4', { name: 'lmPS-lane', paint: 0.01, polygonOffset: -5 }),
    dark: T('#26292e', { name: 'lmPS-dark', paint: 0.01 }),
    steel: T('#e6e8e4', { name: 'lmPS-steel', paint: 0.02 }), steelGrey: T('#8d959b', { name: 'lmPS-steelGrey', paint: 0.02 }),
    lamps: T('#ffffff', { map: lampsTex, name: 'lmPS-lamps', paint: 0.01 }),
    plaster: T('#e8d37c', { name: 'lmPS-plaster', paint: 0.05 }), brick: T('#ffffff', { map: brickTex, name: 'lmPS-brick', paint: 0.04 }),
    blue: T('#2a5fb0', { name: 'lmPS-blue', paint: 0.02 }), rust: T('#8a4a30', { name: 'lmPS-rust', paint: 0.06 }),
    fence: T('#ffffff', { map: fenceTex, name: 'lmPS-fence', paint: 0.01, alphaTest: 0.5, side: 'double' }),
  };
  // material budget (<= 20 per sight): the shaded cream, the roof grey, the white and the sheet grey are the same toon materials as their neighbours
  M.creamShade = M.cream; M.roof = M.concrete; M.white = M.steel; M.sheet = M.steelGrey;
  M.cutouts = new Set([M.fence]);
  return M;
}
