// landmarksMining/art.js - canvas textures of the Mining University and the Krasin (every texture key starts with 'lmMin-').  Colours: docs/research/mining.md section 10 (pixel medians of the photos
// refs/mining 01 04 05 10 11 12 13 44 61 62 63 94 and the critic photos).  The facades are flat walls with BAY textures (one window axis per tile, painted in metres: uv = (bay index, height / texture
// height)); everything that matters for the silhouette (columns, entablature, pediment, eagle, cornices, roofs, the ship) is real geometry.
// `painter()` is the small canvas vocabulary in metres (y up): rect, joints, arch, oval, win, archWin, shade.
export const C = {
  wall: '#e9d891', wallLit: '#f2e6b3', wallShade: '#cdb976', wallEast: '#ecd07b', wallWest: '#e6cd84', wallRear: '#c4bba3', wallOff: '#d6cdb6',
  white: '#efece2', whiteShade: '#c9c8c4', plinth: '#cdc8c4', plinthW: '#bdb8ac', back: '#e0b24f', ceil: '#d8a550', beam: '#efece2',
  frame: '#2b2420', frameBrown: '#3b332d', door: '#2a1f1c', glassA: '#6c8aa3', glassB: '#2c3a4a', hood: '#8a5a48', iron: '#1f2023',
  roof: '#5a8a6a', roofRidge: '#4a7a5a', rearRoof: '#6c6a66', chimney: '#e4d6a8',
  pink: '#9a7a6e', pinkStep: '#8a6a5e', pinkShade: '#5f4a43', pinkWet: '#4a4440',
  tread: '#8c877c', riser: '#6b655b', cheek: '#a3a69b', cheekJoint: '#7d7f77', coping: '#6f7070',
  paver: '#9c6e5c', paverJoint: '#7c5a4b', kerb: '#a07f72', slab: '#9a8f86', travertine: '#d3c8b0', travShade: '#b8ab90',
  eagle: '#26262a', gold: '#c99a3a', teal: '#0f4f45', tealShade: '#0a3a33', tealCap: '#1c5a4c', lantern: '#f0e6c0', bronze: '#5a4a2c',
  // ship
  hull: '#3a3f4a', hullShade: '#262a33', boot: '#86a866', bootShade: '#4d6b58', waterline: '#e8e8e0', cream: '#d6c8a2', creamShade: '#b9ab86', funnel: '#d9cdb0', band: '#c4545a', cap: '#202022',
  boat: '#d2662d', cover: '#1c1c1e', deck: '#7a6048', deckFore: '#6b5a49', windlass: '#222326', rope: '#cfcfc8', rail: '#e4dcc4', glassDark: '#2a2d33', teal2: '#4f7a72',
  lawn: '#6fa84a',
};

/** canvas vocabulary in metres: bay of bw x bh metres on a W x H canvas, y up from the bottom */
export function painter(g, W, H, bw, bh) {
  const sx = W / bw, sy = H / bh, X = (x) => x * sx, Y = (y) => H - y * sy;
  const q = { g, W, H, bw, bh, sx, sy, X, Y };
  q.rect = (col, x0, y0, x1, y1) => { g.fillStyle = col; g.fillRect(X(x0), Y(y1), (x1 - x0) * sx, (y1 - y0) * sy); };
  /** horizontal joint lines every `step` m between y0 and y1 (rustication), t = thickness in m */
  q.joints = (col, x0, y0, x1, y1, step, t = 0.035) => { for (let y = y0 + step; y < y1 - 0.02; y += step) q.rect(col, x0, y - t / 2, x1, y + t / 2); };
  const archPath = (cx, y0, w, ys) => { g.beginPath(); g.moveTo(X(cx - w / 2), Y(y0)); g.lineTo(X(cx - w / 2), Y(ys)); g.ellipse(X(cx), Y(ys), (w / 2) * sx, (w / 2) * sy, 0, Math.PI, 0, false); g.lineTo(X(cx + w / 2), Y(y0)); g.closePath(); };
  /** filled round-headed shape: bottom y0, springing ys, width w (crown at ys + w / 2) */
  q.arch = (col, cx, y0, w, ys) => { g.fillStyle = col; archPath(cx, y0, w, ys); g.fill(); };
  q.oval = (col, cx, cy, rx, ry) => { g.fillStyle = col; g.beginPath(); g.ellipse(X(cx), Y(cy), rx * sx, ry * sy, 0, 0, Math.PI * 2); g.fill(); };
  const glassFill = (y0, y1) => { const gr = g.createLinearGradient(0, Y(y1), 0, Y(y0)); gr.addColorStop(0, C.glassA); gr.addColorStop(1, C.glassB); g.fillStyle = gr; };
  /** rectangular window: frame colour, nx x ny panes; x0..x1, y0..y1 = the opening */
  q.win = (x0, y0, x1, y1, nx = 2, ny = 3, frame = C.frame) => {
    q.rect(frame, x0, y0, x1, y1);
    const m = 0.05, pw = (x1 - x0 - m) / nx, ph = (y1 - y0 - m) / ny;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { glassFill(y0 + m + j * ph, y0 + (j + 1) * ph); g.fillRect(X(x0 + m + i * pw), Y(y0 + (j + 1) * ph), (pw - m) * sx, (ph - m) * sy); }
    g.fillStyle = 'rgba(255,255,255,0.13)'; g.beginPath(); g.moveTo(X(x0), Y(y0 + (y1 - y0) * 0.2)); g.lineTo(X(x1), Y(y0 + (y1 - y0) * 0.75)); g.lineTo(X(x1), Y(y1)); g.lineTo(X(x0), Y(y0 + (y1 - y0) * 0.5)); g.closePath(); g.fill();
  };
  /** round-headed window: opening width w, bottom y0, crown y0 + h; nx x ny panes below the fan */
  q.archWin = (cx, y0, w, h, nx = 2, ny = 3, frame = C.frame) => {
    const ys = y0 + h - w / 2, x0 = cx - w / 2, x1 = cx + w / 2;
    q.arch(frame, cx, y0, w, ys);
    g.save(); archPath(cx, y0 + 0.05, w - 0.1, ys); g.clip();
    glassFill(y0, y0 + h); g.fillRect(X(x0), Y(y0 + h), w * sx, h * sy);
    g.fillStyle = frame; const m = 0.05;
    for (let i = 1; i < nx; i++) g.fillRect(X(x0 + (w * i) / nx - m / 2), Y(ys), m * sx, (ys - y0) * sy);
    for (let j = 1; j <= ny; j++) g.fillRect(X(x0), Y(y0 + ((ys - y0) * j) / ny + m / 2), w * sx, m * sy);
    g.strokeStyle = frame; g.lineWidth = Math.max(1.5, m * sx);
    for (const a of [Math.PI * 0.33, Math.PI * 0.66]) { g.beginPath(); g.moveTo(X(cx), Y(ys)); g.lineTo(X(cx) + Math.cos(a) * (w / 2) * sx, Y(ys) - Math.sin(a) * (w / 2) * sy); g.stroke(); }
    g.beginPath(); g.moveTo(X(x0), Y(ys)); g.lineTo(X(x1), Y(ys)); g.stroke();
    g.restore();
  };
  /** thin shadow line under a moulding */
  q.shade = (x0, y, x1, t = 0.04, col = 'rgba(60,70,80,0.28)') => q.rect(col, x0, y - t, x1, y);
  /** a recess / reveal shadow round an opening */
  q.reveal = (x0, y0, x1, y1, t = 0.3, col = 'rgba(110,80,30,0.28)') => { q.rect(col, x0 - t, y0 - 0.02, x0, y1 + t * 0.4); q.rect(col, x1, y0 - 0.02, x1 + t, y1 + t * 0.4); q.rect(col, x0 - t, y1, x1 + t, y1 + t * 0.4); };
  return q;
}

export function makeArt(ctx) {
  const tex = ctx.tex, rnd = (seed) => ctx.rng(seed), A = {};
  const bay = (W, H, bw, bh, fn, key, rep = true) => tex.draw(W, H, (g) => fn(painter(g, W, H, bw, bh)), rep ? { key: 'lmMin-' + key, repeat: [1, 1] } : { key: 'lmMin-' + key });
  const speck = (g, w, h, r, base, n, spread = 22, a = 0.4) => { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { const v = (r() - 0.5) * spread * 2; g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 255 * a * 3})`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2); } };

  // ------------------------------------------------------------------------------------------------ wall bays (11.0 m eave; wings and links)
  const WB = 3.95, WH = 11.0;
  /** the plinth + rusticated wall common to the wing / link bays */
  const wallBase = (q, bw, plinthH, col, step = 0.78) => {
    q.rect(col, 0, 0, bw, WH);
    q.joints('rgba(140,118,60,0.30)', 0, plinthH, bw, 10.2, step);
    q.joints('rgba(255,250,225,0.35)', 0, plinthH + 0.03, bw, 10.2, step, 0.02);
    q.rect(C.plinth, 0, 0, bw, plinthH); q.rect('rgba(105,98,92,0.35)', 0, plinthH * 0.5, bw, plinthH * 0.5 + 0.03);
    q.rect(C.white, 0, plinthH, bw, plinthH + 0.07); q.shade(0, plinthH, bw);
  };
  /** wing bay: plinth 1.6 with a barred basement window, floor 1 window sill 2.15 crown 4.85, floor 2 sill 6.6 crown 9.0, hoods over both */
  A.wing = bay(256, 704, WB, WH, (q) => {
    const cx = WB / 2; wallBase(q, WB, 1.6, C.wall);
    q.rect('#3b3a3c', cx - 0.45, 0.55, cx + 0.45, 1.05); for (let i = 1; i < 4; i++) q.rect('#8d8b88', cx - 0.45 + i * 0.18, 0.55, cx - 0.45 + i * 0.18 + 0.02, 1.05);
    q.rect(C.white, cx - 0.9, 1.95, cx + 0.9, 5.0); q.win(cx - 0.75, 2.15, cx + 0.75, 4.85, 2, 3, C.frameBrown); q.reveal(cx - 0.75, 2.15, cx + 0.75, 4.85, 0.12);
    q.rect(C.hood, cx - 1.0, 5.0, cx + 1.0, 5.17); q.shade(cx - 1.0, 5.0, cx + 1.0, 0.05);
    q.rect(C.white, cx - 0.9, 6.45, cx + 0.9, 9.2); q.win(cx - 0.75, 6.6, cx + 0.75, 9.0, 2, 3, C.frameBrown); q.reveal(cx - 0.75, 6.6, cx + 0.75, 9.0, 0.12);
    q.rect(C.hood, cx - 1.0, 9.2, cx + 1.0, 9.37); q.shade(cx - 1.0, 9.2, cx + 1.0, 0.05);
  }, 'wing');
  /** link bay: the same plinth, a ground-floor window 1.4 x 2.3 (sill 2.15) and a first-floor window 1.3 x 2.2 (sill 5.4) under the relief frieze (a separate decal panel at 8.65 .. 9.95) */
  A.link = bay(256, 704, WB, WH, (q) => {
    const cx = WB / 2; wallBase(q, WB, 1.6, C.wall);
    q.rect('#3b3a3c', cx - 0.45, 0.55, cx + 0.45, 1.05); for (let i = 1; i < 4; i++) q.rect('#8d8b88', cx - 0.45 + i * 0.18, 0.55, cx - 0.45 + i * 0.18 + 0.02, 1.05);
    q.rect(C.white, cx - 0.85, 2.0, cx + 0.85, 4.6); q.win(cx - 0.7, 2.15, cx + 0.7, 4.45, 2, 3, C.frameBrown); q.reveal(cx - 0.7, 2.15, cx + 0.7, 4.45, 0.1);
    q.rect(C.white, cx - 0.8, 5.25, cx + 0.8, 7.75); q.win(cx - 0.65, 5.4, cx + 0.65, 7.6, 2, 3, C.frameBrown); q.reveal(cx - 0.65, 5.4, cx + 0.65, 7.6, 0.1);
  }, 'link');
  /** east range (church block): both floors rusticated every 0.9, plinth 1.0, ground windows with black grilles, first-floor windows with small flat hoods */
  const EB = 4.1;
  A.east = bay(256, 704, EB, WH, (q) => {
    const cx = EB / 2; q.rect(C.wallEast, 0, 0, EB, WH);
    q.joints('rgba(150,125,55,0.30)', 1.0, 1.0, EB, 10.2, 0.9); q.joints('rgba(255,250,225,0.4)', 0, 1.03, EB, 10.2, 0.9, 0.02);
    q.rect(C.plinth, 0, 0, EB, 1.0); q.rect(C.white, 0, 1.0, EB, 1.07);
    q.rect(C.white, cx - 0.8, 1.7, cx + 0.8, 4.4); q.win(cx - 0.65, 1.85, cx + 0.65, 4.25, 2, 3, C.frameBrown); for (let i = 1; i < 6; i++) q.rect('#101010', cx - 0.65 + i * 0.217, 1.85, cx - 0.65 + i * 0.217 + 0.025, 4.25);
    q.rect(C.white, 0, 5.0, EB, 5.12); q.shade(0, 5.0, EB, 0.04);
    q.rect(C.white, cx - 0.8, 6.0, cx + 0.8, 9.0); q.win(cx - 0.65, 6.15, cx + 0.65, 8.85, 2, 3, C.frameBrown); q.reveal(cx - 0.65, 6.15, cx + 0.65, 8.85, 0.1);
    q.rect(C.white, cx - 0.95, 9.0, cx + 0.95, 9.2); q.shade(cx - 0.95, 9.0, cx + 0.95, 0.05);
  }, 'east');
  /** west range / 22nd line: rusticated ground floor with arched windows behind grilles on a 1.2 m granite plinth, two floors of plain windows in flat surrounds */
  const XB = 4.0;
  A.west = bay(256, 704, XB, WH, (q) => {
    const cx = XB / 2; q.rect(C.wallWest, 0, 0, XB, WH);
    q.joints('rgba(150,125,55,0.30)', 1.2, 1.2, XB, 4.6, 0.8); q.joints('rgba(255,250,225,0.4)', 0, 1.23, XB, 4.6, 0.8, 0.02);
    q.rect(C.plinthW, 0, 0, XB, 1.2); q.rect('rgba(90,86,80,0.3)', 0, 0.6, XB, 0.63); q.rect(C.white, 0, 1.2, XB, 1.27);
    q.rect(C.white, 0, 4.55, XB, 4.7); q.shade(0, 4.55, XB, 0.05);
    q.archWin(cx, 1.7, 1.5, 2.8, 2, 3, C.frameBrown); for (let i = 1; i < 7; i++) q.rect('rgba(10,10,10,0.8)', cx - 0.75 + i * 0.1875, 1.7, cx - 0.75 + i * 0.1875 + 0.022, 3.6);
    q.rect(C.white, cx - 0.82, 5.1, cx + 0.82, 7.85); q.win(cx - 0.7, 5.25, cx + 0.7, 7.65, 2, 3, C.frameBrown);
    q.rect(C.white, 0, 7.9, XB, 8.0); q.shade(0, 7.9, XB, 0.04);
    q.rect(C.white, cx - 0.82, 8.5, cx + 0.82, 10.5); q.win(cx - 0.7, 8.62, cx + 0.7, 10.3, 2, 3, C.frameBrown);
  }, 'west');
  /** plain yard wall (the inner courtyard, back sides): 3 floors of windows in flat surrounds */
  A.yard = bay(256, 704, XB, WH, (q) => {
    const cx = XB / 2; q.rect(C.wallWest, 0, 0, XB, WH);
    q.rect(C.plinthW, 0, 0, XB, 0.9); q.rect(C.white, 0, 0.9, XB, 0.96);
    for (const [y0, y1] of [[1.5, 3.9], [4.9, 7.3], [8.2, 10.2]]) { q.rect(C.white, cx - 0.78, y0 - 0.12, cx + 0.78, y1 + 0.12); q.win(cx - 0.65, y0, cx + 0.65, y1, 2, 3, C.frameBrown); }
  }, 'yard');
  /** rear range w116609897: a flat-roofed sand-grey block of 4 storeys (14 m) with a blank concrete-like facade: rows of plain windows */
  const RB = 3.6, RH = 14.0;
  A.rear = bay(256, 960, RB, RH, (q) => {
    const cx = RB / 2; q.rect(C.wallRear, 0, 0, RB, RH);
    q.rect('#a9a28d', 0, 0, RB, 1.0);
    for (let k = 0; k < 4; k++) { const y0 = 1.6 + k * 3.3; q.rect('#d9d1ba', cx - 0.72, y0 - 0.1, cx + 0.72, y0 + 2.2); q.win(cx - 0.62, y0, cx + 0.62, y0 + 2.1, 2, 3, '#4a4036'); }
    q.rect('#b3ab94', 0, RH - 0.5, RB, RH);
  }, 'rear');

  // ------------------------------------------------------------------------------------------------ the gallery back wall (bay 3.545 wide, y 1.95 .. 10.3 = 8.35 m)
  const GW = 3.545, GH = 8.35;
  /** floor y above the stylobate: ground window sill 0.4 (abs 2.35) .. 3.0, string course 3.65 .. 3.9 (abs 5.6), arched window sill 4.35 (abs 6.3) .. crown 7.25 (abs 9.2) */
  const gallery = (kind) => bay(256, 592, GW, GH, (q) => {
    const cx = GW / 2; q.rect(C.back, 0, 0, GW, GH);
    q.rect('rgba(120,80,20,0.12)', 0, 0, GW, 0.12);
    if (kind === 'win') {
      q.reveal(cx - 0.75, 0.4, cx + 0.75, 3.0, 0.32); q.rect(C.white, cx - 0.85, 0.3, cx + 0.85, 3.12); q.win(cx - 0.75, 0.4, cx + 0.75, 3.0, 2, 3, C.frame);
      q.rect(C.white, cx - 0.9, 3.0, cx + 0.9, 3.1);
    }
    q.rect(C.white, 0, 3.65, GW, 3.9); q.shade(0, 3.65, GW, 0.05);
    if (kind !== 'end') { q.reveal(cx - 0.65, 4.35, cx + 0.65, 7.25, 0.32); q.archWin(cx, 4.35, 1.3, 2.9, 2, 3, C.frame); }
    if (kind === 'door') { q.rect(C.white, cx - 1.05, 2.9, cx + 1.05, 3.05); }
  }, 'gallery-' + kind);
  A.galleryWin = gallery('win'); A.galleryDoor = gallery('door'); A.galleryEnd = gallery('end');
  /** the door leaf pair: 1.75 x 2.9 m, dark wood, two glazed panels in black lattice with a gilt monogram */
  A.door = tex.draw(128, 212, (g, w, h) => {
    g.fillStyle = C.door; g.fillRect(0, 0, w, h);
    g.fillStyle = '#17110f'; g.fillRect(w / 2 - 2, 0, 4, h);
    for (const x0 of [10, w / 2 + 8]) {
      g.fillStyle = '#6f7d78'; g.fillRect(x0, 20, w / 2 - 18, h - 70);
      g.strokeStyle = '#0c0c0c'; g.lineWidth = 2;
      for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x0 + (w / 2 - 18) * i / 4, 20); g.lineTo(x0 + (w / 2 - 18) * i / 4, h - 50); g.stroke(); }
      for (let j = 1; j < 6; j++) { g.beginPath(); g.moveTo(x0, 20 + (h - 70) * j / 6); g.lineTo(x0 + w / 2 - 18, 20 + (h - 70) * j / 6); g.stroke(); }
      g.fillStyle = C.gold; g.beginPath(); g.arc(x0 + (w / 2 - 18) / 2, 20 + (h - 70) * 0.45, 6, 0, 6.3); g.fill();
      g.fillStyle = '#1b1413'; g.fillRect(x0, h - 40, w / 2 - 18, 30);
    }
  }, { key: 'lmMin-door', repeat: [1, 1] });

  // ------------------------------------------------------------------------------------------------ relief friezes of the links (10 x 1.3 m): warm stone figures on an ochre field
  const friezeTex = (key, side) => tex.draw(1024, 128, (g, w, h) => {
    const r = rnd(7711 + side); g.fillStyle = '#c9a45a'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(120,90,30,0.2)'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6);
    const fig = (x, y, s, seated) => {
      g.fillStyle = '#e9dcb0'; g.strokeStyle = 'rgba(110,85,40,0.6)'; g.lineWidth = 1.4;
      g.beginPath(); g.arc(x, y - 44 * s, 6.5 * s, 0, 6.3); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(x - 9 * s, y - 36 * s); g.quadraticCurveTo(x - 12 * s, y - 10 * s, x - 10 * s, y + (seated ? 4 : 26) * s); g.lineTo(x + 10 * s, y + (seated ? 4 : 26) * s); g.quadraticCurveTo(x + 12 * s, y - 10 * s, x + 9 * s, y - 36 * s); g.closePath(); g.fill(); g.stroke();
      const a = r() * 1.2 - 0.6; g.beginPath(); g.moveTo(x + 8 * s, y - 32 * s); g.lineTo(x + (22 + 8 * Math.sin(a)) * s, y - (34 - 22 * Math.cos(a)) * s); g.lineWidth = 3.2 * s; g.stroke(); g.lineWidth = 1.4;
    };
    const cxm = w / 2, n = 6;
    fig(cxm, 100, 1.3, true); g.fillStyle = '#8c8478'; g.fillRect(cxm + 34, 82, 46, 14); g.fillRect(cxm + 44, 96, 26, 8);    // Vulcan at the anvil
    for (let i = 0; i < n; i++) { fig(cxm - 120 - i * 74 - (i % 2) * 6, 100 - (i % 2) * 4, 0.95 + r() * 0.2, false); fig(cxm + 150 + i * 74 + (i % 2) * 6, 100 - (i % 2) * 4, 0.95 + r() * 0.2, false); }
  }, { key, repeat: [1, 1] });
  A.friezeW = friezeTex('lmMin-friezeW', 0); A.friezeE = friezeTex('lmMin-friezeE', 1);

  // ------------------------------------------------------------------------------------------------ stone: ashlar cheeks, granite, slabs, pavers, flutes
  A.ashlar = tex.draw(256, 256, (g, w, h) => {      // 1.6 m square: 8 courses of 0.2 m, grey-green limestone `#a3a69b`, joints `#7d7f77`
    const r = rnd(7721); g.fillStyle = '#d9dcd0'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 8; row++) { const off = (row * 53 + 17) % 128; for (let k = -1; k < 3; k++) { const v = 214 + Math.floor(r() * 30); g.fillStyle = `rgb(${v - 4},${v},${v - 8})`; g.fillRect(k * 128 + off + 1, row * 32 + 1, 126, 30); } }
    for (let i = 0; i < 380; i++) { const v = 150 + Math.floor(r() * 90); g.fillStyle = `rgba(${v},${v},${v - 6},0.3)`; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2); }
    g.fillStyle = 'rgba(90,92,84,0.55)'; for (let row = 0; row < 8; row++) { g.fillRect(0, row * 32, w, 2); const off = (row * 53 + 17) % 128; for (let k = -1; k < 3; k++) g.fillRect(k * 128 + off, row * 32, 2, 32); }
    g.fillStyle = 'rgba(60,64,58,0.22)'; g.fillRect(0, h * 0.62, w, h * 0.38);     // stained darker in the lower courses
  }, { key: 'lmMin-ashlar', repeat: [1, 1] });
  /** pink-grey granite with fine speckle; 2.4 m tile with joints every 1.2 m (two courses, staggered) */
  A.granite = tex.draw(256, 256, (g, w, h) => {
    const r = rnd(7722); g.fillStyle = '#f0dcd2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1500; i++) { const v = 150 + Math.floor(r() * 90); g.fillStyle = `rgba(${v + 10},${v - 20},${v - 28},0.34)`; g.fillRect(r() * w, r() * h, 1 + r() * 2.2, 1 + r() * 2.2); }
    for (let i = 0; i < 700; i++) { const v = 40 + Math.floor(r() * 60); g.fillStyle = `rgba(${v},${v - 6},${v - 8},0.28)`; g.fillRect(r() * w, r() * h, 1 + r() * 1.6, 1 + r() * 1.6); }
    g.fillStyle = 'rgba(80,58,50,0.45)'; g.fillRect(0, 0, w, 2); g.fillRect(0, h / 2, w, 2); g.fillRect(0, 0, 2, h / 2); g.fillRect(w / 2, h / 2, 2, h / 2);
  }, { key: 'lmMin-granite', repeat: [1, 1] });
  /** grey granite of the portico stair: fine grain, a seam every 2.7 m is drawn by geometry (the tile is 1.6 m) */
  A.stairGrey = tex.draw(256, 256, (g, w, h) => {
    const r = rnd(7723); g.fillStyle = '#f2ede2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1200; i++) { const v = 160 + Math.floor(r() * 80); g.fillStyle = `rgba(${v},${v - 4},${v - 10},0.3)`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
    g.fillStyle = 'rgba(70,66,58,0.35)'; g.fillRect(0, 0, w, 2); g.fillRect(w * 0.6, 0, 2, h);
  }, { key: 'lmMin-stairGrey', repeat: [1, 1] });
  A.slabs = tex.draw(256, 256, (g, w, h) => {      // 1.8 m: 2 x 2 slabs of 0.9 m, pink-grey
    const r = rnd(7724); g.fillStyle = '#d8cdc6'; g.fillRect(0, 0, w, h);
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { const v = 205 + Math.floor(r() * 36); g.fillStyle = `rgb(${v + 4},${v - 6},${v - 10})`; g.fillRect(a * 128 + 2, b * 128 + 2, 124, 124); }
    for (let i = 0; i < 700; i++) { const v = 140 + Math.floor(r() * 100); g.fillStyle = `rgba(${v},${v - 10},${v - 14},0.25)`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  }, { key: 'lmMin-slabs', repeat: [1, 1] });
  /** herringbone of 0.2 x 0.1 m pavers at 45 deg: 0.8 m tile */
  A.paver = tex.draw(256, 256, (g, w, h) => {
    const r = rnd(7725); g.fillStyle = '#f2e6e0'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { const v = 214 + Math.floor(r() * 36); g.fillStyle = `rgb(${v},${v - 20},${v - 28})`; g.fillRect(i * 16 + 1, j * 16 + 1, 14, 14); }
    g.strokeStyle = 'rgba(100,66,56,0.6)'; g.lineWidth = 1.4;
    for (let k = -16; k <= 32; k++) { g.beginPath(); g.moveTo(k * 16, 0); g.lineTo(k * 16 + 256, 256); g.stroke(); }
    for (let k = 0; k < 40; k++) for (let m = 0; m < 16; m++) { const x = k * 16 + (m % 2) * 8, y = m * 16 + (k % 2) * 8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8, y - 8); g.stroke(); }
  }, { key: 'lmMin-paver', repeat: [1, 1] });
  /** a fluted pilaster strip: 0.9 m wide, 5 flutes */
  A.flutes = tex.draw(128, 64, (g, w, h) => {
    g.fillStyle = C.white; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5; i++) { const x0 = 6 + i * 23; g.fillStyle = 'rgba(120,118,110,0.3)'; g.fillRect(x0, 0, 14, h); g.fillStyle = 'rgba(80,78,72,0.4)'; g.fillRect(x0, 0, 2, h); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(x0 + 14, 0, 3, h); }
  }, { key: 'lmMin-flutes', repeat: [1, 1] });
  /** ONE flute of a column: light arris at the tile edges, a soft shadow gradient to the middle (the shaft maps 16 tiles round) */
  A.flute1 = tex.draw(64, 32, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.18, '#f4f0e6'); gr.addColorStop(0.5, '#b9b6ae'); gr.addColorStop(0.82, '#f4f0e6'); gr.addColorStop(1, '#ffffff');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, { key: 'lmMin-flute1', repeat: [1, 1] });
  /** the lime-green copper roof: a standing seam at the left edge of a 0.6 m tile, the fall line runs along v */
  A.roof = tex.draw(64, 128, (g, w, h) => {
    const r = rnd(7726); g.fillStyle = '#e4efe6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '60,100,70'},${0.05 + r() * 0.08})`; g.fillRect(r() * w, r() * h, 2 + r() * 8, 3 + r() * 16); }
    g.fillStyle = 'rgba(60,96,72,0.55)'; g.fillRect(0, 0, 3, h); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(3, 0, 2, h);
  }, { key: 'lmMin-roof', repeat: [1, 1] });
  A.rearRoof = tex.draw(64, 64, (g, w, h) => { const r = rnd(7727); g.fillStyle = '#d8d8d4'; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.08})`; g.fillRect(r() * w, r() * h, 2 + r() * 5, 2 + r() * 5); } }, { key: 'lmMin-rearRoof', repeat: [1, 1] });
  A.lawn = tex.draw(128, 128, (g, w, h) => { const r = rnd(7728); g.fillStyle = '#f2f6e8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { const v = 205 + Math.floor(r() * 50); g.fillStyle = `rgba(${v - 26},${v},${v - 44},0.22)`; g.beginPath(); g.ellipse(r() * w, r() * h, 1.5 + r() * 4, 1 + r() * 2.5, r() * 3, 0, 6.3); g.fill(); } }, { key: 'lmMin-lawn', repeat: [1, 1] });

  // ------------------------------------------------------------------------------------------------ the ship
  /** hull plating: 4.8 m wide x 2.4 m high tile: butt straps every 2.4 m, seams every 1.2 m, rivet dots, a few rust streaks */
  A.hull = tex.draw(512, 256, (g, w, h) => {
    const r = rnd(7731); g.fillStyle = '#e4e6ec'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const v = 200 + Math.floor(r() * 55); g.fillStyle = `rgba(${v},${v},${v + 4},0.35)`; g.fillRect(r() * w, r() * h, 6 + r() * 30, 2 + r() * 6); }
    g.fillStyle = 'rgba(30,32,40,0.45)'; for (let k = 0; k < 2; k++) g.fillRect(0, k * h / 2, w, 3);
    for (let k = 0; k < 2; k++) g.fillRect(k * w / 2, 0, 3, h);
    g.fillStyle = 'rgba(255,255,255,0.28)'; for (let k = 0; k < 2; k++) g.fillRect(0, k * h / 2 + 3, w, 2);
    g.fillStyle = 'rgba(20,22,30,0.4)'; for (let k = 0; k < 2; k++) for (let x = 6; x < w; x += 16) g.fillRect(x, k * h / 2 + 8, 3, 3);
    for (let i = 0; i < 5; i++) { const x = r() * w, y = r() * h * 0.5; const gr = g.createLinearGradient(0, y, 0, y + 90); gr.addColorStop(0, 'rgba(150,76,40,0.55)'); gr.addColorStop(1, 'rgba(150,76,40,0)'); g.fillStyle = gr; g.fillRect(x, y, 4 + r() * 5, 90); }
  }, { key: 'lmMin-hull', repeat: [1, 1] });
  /** a row of bridge-house windows: tile 1.0 m wide x 1.0 m high: a window 0.9 x 0.62 with a drip hood on cream */
  A.bhWin = tex.draw(128, 128, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a2d33'; g.fillRect(8, 40, 112, 70);
    g.fillStyle = '#5f7686'; g.fillRect(12, 44, 104, 30); g.fillStyle = '#3d4d5a'; g.fillRect(12, 76, 104, 30);
    g.fillStyle = '#e8e2cd'; g.fillRect(6, 34, 116, 6); g.fillStyle = 'rgba(60,50,30,0.35)'; g.fillRect(6, 40, 116, 4);
  }, { key: 'lmMin-bhWin', repeat: [1, 1] });
  A.bhPort = tex.draw(64, 64, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#efe9d6'; g.beginPath(); g.arc(32, 36, 17, 0, 6.3); g.fill(); g.fillStyle = '#2a2d33'; g.beginPath(); g.arc(32, 36, 12, 0, 6.3); g.fill(); g.fillStyle = '#566874'; g.beginPath(); g.arc(32, 33, 8, 0, 6.3); g.fill();
  }, { key: 'lmMin-bhPort', repeat: [1, 1] });
  A.deck = tex.draw(128, 128, (g, w, h) => { const r = rnd(7732); g.fillStyle = '#efe2cf'; g.fillRect(0, 0, w, h); for (let k = 0; k < 8; k++) { const v = 205 + Math.floor(r() * 40); g.fillStyle = `rgb(${v},${v - 12},${v - 30})`; g.fillRect(0, k * 16 + 1, w, 14); } g.fillStyle = 'rgba(60,40,20,0.4)'; for (let k = 0; k < 8; k++) g.fillRect(0, k * 16, w, 1.5); }, { key: 'lmMin-deck', repeat: [1, 1] });
  /** cream superstructure plating: faint horizontal seams and rivets */
  A.cream = tex.draw(128, 128, (g, w, h) => { const r = rnd(7733); g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(150,130,90,${r() * 0.07})`; g.fillRect(r() * w, r() * h, 3 + r() * 14, 2 + r() * 4); } g.fillStyle = 'rgba(140,120,80,0.25)'; g.fillRect(0, 0, w, 2); g.fillRect(0, h / 2, w, 1.5); g.fillRect(0, 0, 1.5, h); }, { key: 'lmMin-cream', repeat: [1, 1] });
  /** a lettered gangway side / hull lettering are drawn as text decals (make with A.letters) */
  A.letters = (key, text, fg, o = {}) => tex.draw(o.w || 512, o.h || 96, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    tex.fitText(g, text, w / 2, h / 2 + 2, w - 12, o.size || h * 0.78, o.font || tex.FONTS.sans, o.weight || 700);
  }, { key: 'lmMin-' + key });
  return A;
}
