// landmarksAcademy/art.js - the canvas textures of the module (every key starts with 'lmacade-').  Colours: docs/research/academy.md section 3.7 (daylight values of the critic pass: field #e0c4a8,
// ground floor #d8b8a0, orders #f0e6d2), 4.4 (pier granite), 5 (garden), 6 (Trezzini house, Cherkassky banner).  The facades are flat walls with BAY textures (one window axis per tile, painted in
// metres, uv = (bay index, height / texture height)); relief that matters for the silhouette (giant pilasters, columns, cornices, balconies, the dome stack) is real geometry (academy.js).
// `painter()` is the small canvas vocabulary in metres (y up): rect, joints, arch, oval, win, archWin, eared, balus.
export const COL = {
  // Academy front (river side), rear (garden side), flanks (4-5 and 2-3 line streets)
  field: '#e0c4a8', ground: '#d8b8a0', groundShade: '#c4a48c', order: '#f0e6d2', orderShade: '#d9cfb9', line: '#bfa88f',
  rearField: '#eed3ab', rearGround: '#e0b996', flankField: '#e8d3a0', flankGround: '#e2c48f',
  plinth: '#6f6258', glassA: '#6c8aa3', glassB: '#2c3a4a', frame: '#f4eddc', door: '#6b4a32', iron: '#1c1f21', rearMetal: '#6f8190',
  roof: '#8c98a2', roofLight: '#b9c1c8', rib: '#98a2aa', drumRing: '#a8b0b6', chimney: '#e0b898', chimneyCap: '#f4ece0', bronze: '#a8793a', bronzeHi: '#d2a85a', stone: '#e6e0d2',
  // pier
  pink: '#a98572', pinkShade: '#886f5b', pinkSun: '#ceb19a', pinkTop: '#b99884', step: '#a0897a', stepShade: '#7a6a5d', lampGreen: '#3f5f52', griffin: '#4d4a37', griffinHi: '#a8782f', griffinBody: '#3f4a3b',
  hiero: '#7e7165', sphinx: '#b9a999', sphinxPlinth: '#928170', crown: '#c6b7b5',
  // square and garden
  hotel: '#ecdc96', hotelTrim: '#f4f1e6', hotelPlinth: '#6a5e52', hotelRoof: '#8f979a', cherk: '#e8a9a4', cherkWin: '#9fd0ea', lawn: '#6f9a4a', lawnShade: '#5c7d3e', gravel: '#a3786b',
  pavilion: '#f0dc9e', mosaic: '#dba868', workshop: '#e2c88d', domA: '#e8d68e', domGround: '#efe3c8',
};

/** canvas vocabulary in metres: a tile of bw x bh metres on a W x H canvas, y up from the bottom; yb = the absolute y (m) of the bottom edge */
export function painter(g, W, H, bw, bh, yb = 0) {
  const sx = W / bw, sy = H / bh, X = (x) => x * sx, Y = (y) => H - (y - yb) * sy;
  const q = { g, W, H, bw, bh, sx, sy, X, Y };
  q.rect = (col, x0, y0, x1, y1) => { g.fillStyle = col; g.fillRect(X(x0), Y(y1), (x1 - x0) * sx, (y1 - y0) * sy); };
  /** horizontal joint lines every `step` m between y0 and y1 (rustication), t = thickness in m */
  q.joints = (col, x0, y0, x1, y1, step, t = 0.035) => { for (let y = y0 + step; y < y1 - 0.02; y += step) q.rect(col, x0, y - t / 2, x1, y + t / 2); };
  const archPath = (cx, y0, w, ys) => { g.beginPath(); g.moveTo(X(cx - w / 2), Y(y0)); g.lineTo(X(cx - w / 2), Y(ys)); g.ellipse(X(cx), Y(ys), (w / 2) * sx, (w / 2) * sy, 0, Math.PI, 0, false); g.lineTo(X(cx + w / 2), Y(y0)); g.closePath(); };
  /** filled round-headed shape: bottom y0, springing ys, width w (crown at ys + w / 2) */
  q.arch = (col, cx, y0, w, ys) => { g.fillStyle = col; archPath(cx, y0, w, ys); g.fill(); };
  q.oval = (col, cx, cy, rx, ry) => { g.fillStyle = col; g.beginPath(); g.ellipse(X(cx), Y(cy), rx * sx, ry * sy, 0, 0, Math.PI * 2); g.fill(); };
  const glassFill = (y0, y1) => { const gr = g.createLinearGradient(0, Y(y1), 0, Y(y0)); gr.addColorStop(0, COL.glassA); gr.addColorStop(1, COL.glassB); g.fillStyle = gr; };
  /** rectangular window: frame colour, nx x ny panes; x0..x1, y0..y1 = the opening */
  q.win = (x0, y0, x1, y1, nx = 2, ny = 3, frame = COL.frame) => {
    q.rect(frame, x0, y0, x1, y1);
    const m = 0.04, pw = (x1 - x0 - m) / nx, ph = (y1 - y0 - m) / ny;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { glassFill(y0 + m + j * ph, y0 + (j + 1) * ph); g.fillRect(X(x0 + m + i * pw), Y(y0 + (j + 1) * ph), (pw - m) * sx, (ph - m) * sy); }
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(X(x0), Y(y0 + (y1 - y0) * 0.2)); g.lineTo(X(x1), Y(y0 + (y1 - y0) * 0.75)); g.lineTo(X(x1), Y(y1)); g.lineTo(X(x0), Y(y0 + (y1 - y0) * 0.5)); g.closePath(); g.fill();
  };
  /** round-headed window: opening width w, bottom y0, crown y0 + h; nx x ny panes below the fan */
  q.archWin = (cx, y0, w, h, nx = 2, ny = 3, frame = COL.frame) => {
    const ys = y0 + h - w / 2, x0 = cx - w / 2;
    q.arch(frame, cx, y0, w, ys);
    g.save(); archPath(cx, y0 + 0.05, w - 0.1, ys); g.clip();
    glassFill(y0, y0 + h); g.fillRect(X(x0), Y(y0 + h), w * sx, h * sy);
    g.fillStyle = frame; const m = 0.04;
    for (let i = 1; i < nx; i++) g.fillRect(X(x0 + (w * i) / nx - m / 2), Y(ys), m * sx, (ys - y0) * sy);
    for (let j = 1; j <= ny; j++) g.fillRect(X(x0), Y(y0 + ((ys - y0) * j) / ny + m / 2), w * sx, m * sy);
    g.strokeStyle = frame; g.lineWidth = Math.max(1.2, m * sx);
    for (const a of [Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75]) { g.beginPath(); g.moveTo(X(cx), Y(ys)); g.lineTo(X(cx) + Math.cos(a) * (w / 2) * sx, Y(ys) - Math.sin(a) * (w / 2) * sy); g.stroke(); }
    g.restore();
  };
  /** framed surround round an opening x0..x1, y0..y1: band fw wide, small ears at the upper corners, optional sill */
  q.eared = (col, x0, y0, x1, y1, fw = 0.16, o = {}) => {
    const e = o.ear ?? fw * 0.5;
    q.rect(col, x0 - fw, y0 - (o.sill ?? 0.1), x1 + fw, y1 + fw);
    q.rect(col, x0 - fw - e, y1 - fw * 1.4, x1 + fw + e, y1 + fw);
    g.strokeStyle = o.shade || COL.line; g.lineWidth = 1; g.strokeRect(X(x0 - fw) + 0.5, Y(y1 + fw) + 0.5, (x1 - x0 + 2 * fw) * sx - 1, (y1 - y0 + fw + (o.sill ?? 0.1)) * sy - 1);
  };
  /** thin shadow line under a moulding */
  q.shade = (x0, y, x1, t = 0.04, col = 'rgba(60,70,80,0.26)') => q.rect(col, x0, y - t, x1, y);
  /** a baluster apron: rails + n small balusters between x0 and x1, y0..y1 */
  q.balus = (col, x0, y0, x1, y1, shade = 'rgba(70,60,50,0.55)') => {
    q.rect(shade, x0, y0, x1, y1); q.rect(col, x0, y0, x1, y0 + 0.1); q.rect(col, x0 - 0.04, y1 - 0.13, x1 + 0.04, y1);
    const n = Math.max(3, Math.round((x1 - x0) / 0.2));
    for (let i = 0; i < n; i++) { const x = x0 + ((i + 0.5) * (x1 - x0)) / n, w = 0.075; q.rect(col, x - w / 2, y0 + 0.1, x + w / 2, y1 - 0.13); q.oval(col, x, y0 + 0.4 * (y1 - y0), w * 0.8, 0.07); }
  };
  return q;
}

export function makeArt(ctx) {
  const tex = ctx.tex, rnd = (seed) => ctx.rng(seed);
  const A = {};
  const bay = (W, H, bw, bh, fn, key, o = {}) => tex.draw(W, H, (g) => fn(painter(g, W, H, bw, bh, o.yb || 0)), o.rep === false ? { key } : { key, repeat: [1, 1] });
  const speckle = (g, w, h, r, n, a0, a1, tone = [210, 200, 190], size = 2.2) => { for (let i = 0; i < n; i++) { const v = a0 + Math.floor(r() * (a1 - a0)); g.fillStyle = `rgba(${Math.min(255, v + tone[0] - 200)},${Math.min(255, v + tone[1] - 200)},${Math.min(255, v + tone[2] - 200)},0.3)`; g.fillRect(r() * w, r() * h, 1 + r() * size, 1 + r() * size); } };

  // ------------------------------------------------------------------------------------------------ the three-tier bays (tile = one window axis, y 0 .. 17.8)
  const BH = 17.8;
  /** FRONT grammar (river side, the front corner pavilions, the flank ends): rusticated ground floor with a round-arched window, first floor with an arched window over a baluster apron,
   *  top floor with a small framed window over a tablet.  pal = { field, ground, shade } */
  const frontBay = (bw, pal, key, o = {}) => bay(o.W || 320, o.H || 1280, bw, BH, (q) => {
    const cx = bw / 2, g = q.g, O = COL.order;
    q.rect(pal.field, 0, 0, bw, BH);
    q.rect(COL.plinth, 0, 0, bw, 0.9); q.rect('#8a7c70', 0, 0.82, bw, 0.9); q.rect('#2a2d30', cx - 0.5, 0.2, cx + 0.5, 0.62); for (let x = cx - 0.45; x < cx + 0.5; x += 0.1) q.rect('#4d5258', x, 0.2, x + 0.025, 0.62);
    // ground floor: rusticated courses of 0.75 m, staggered vertical joints
    q.rect(pal.ground, 0, 0.9, bw, 6.9);
    for (let c = 0; c < 8; c++) { const y0 = 0.9 + c * 0.75; q.rect(pal.shade, 0, y0, bw, y0 + 0.035); for (let x = (c % 2 ? 0.7 : 1.5); x < bw; x += 1.6) q.rect(pal.shade, x, y0, x + 0.025, y0 + 0.75); }
    if (!o.blank) { q.arch(O, cx, 1.02, 2.06, 5.1); q.shade(cx - 1.03, 1.02, cx + 1.03, 0.05); q.archWin(cx, 1.1, 1.6, 4.8, 3, 5);
      q.rect(O, cx - 0.2, 5.92, cx + 0.2, 6.42); q.rect(pal.shade, cx - 0.2, 5.92, cx - 0.17, 6.42); }                   // the keystone
    q.rect(O, 0, 6.82, bw, 7.0); q.shade(0, 6.82, bw);
    if (!o.blank) {
      // first floor: apron, framed arched window, keystone, hood
      q.balus(O, cx - 1.0, 7.0, cx + 1.0, 7.9);
      q.arch(O, cx, 7.9, 1.86, 11.7); q.archWin(cx, 7.9, 1.46, 4.5, 2, 4);
      q.rect(O, cx - 0.18, 12.45, cx + 0.18, 12.95); q.rect(pal.shade, cx - 0.18, 12.45, cx - 0.15, 12.95);
      for (const s of [-1, 1]) { q.oval(O, cx + s * 0.55, 12.62, 0.16, 0.09); }
      // top floor: tablet apron, window with ears
      q.rect(O, cx - 0.85, 13.96, cx + 0.85, 14.55); q.rect('#e6dcc8', cx - 0.72, 14.04, cx + 0.72, 14.47); q.shade(cx - 0.85, 13.96, cx + 0.85, 0.03);
      q.rect(O, cx - 0.78, 14.55, cx + 0.78, 14.68); q.eared(O, cx - 0.55, 14.7, cx + 0.55, 17.1, 0.12, { sill: 0.0 }); q.win(cx - 0.55, 14.7, cx + 0.55, 17.1, 2, 3);
      q.rect(O, cx - 0.78, 17.26, cx + 0.78, 17.4);
    }
    q.rect(O, 0, 17.55, bw, BH);
  }, key);
  /** REAR / FLANK grammar: arched ground-floor windows with iron grilles, tall first-floor windows under flat hoods, small top-floor windows, shallow painted pilaster strips */
  const rearBay = (bw, pal, key, o = {}) => bay(o.W || 320, o.H || 1280, bw, BH, (q) => {
    const cx = bw / 2, g = q.g, O = COL.order;
    q.rect(pal.field, 0, 0, bw, BH);
    q.rect(COL.plinth, 0, 0, bw, 0.9); q.rect('#8a7c70', 0, 0.82, bw, 0.9); q.rect('#2a2d30', cx - 0.45, 0.2, cx + 0.45, 0.62);
    q.rect(pal.ground, 0, 0.9, bw, 6.9);
    for (let c = 0; c < 8; c++) { const y0 = 0.9 + c * 0.75; q.rect(pal.shade, 0, y0, bw, y0 + 0.03); for (let x = (c % 2 ? 0.6 : 1.4); x < bw; x += 1.5) q.rect(pal.shade, x, y0, x + 0.022, y0 + 0.75); }
    if (!o.blank) {
      q.arch(O, cx, 1.04, 1.9, 4.9); q.archWin(cx, 1.1, 1.5, 4.5, 3, 5);
      for (let x = cx - 0.7; x < cx + 0.75; x += 0.14) q.rect(COL.rearMetal, x, 1.15, x + 0.03, 3.2); q.rect(COL.rearMetal, cx - 0.75, 3.15, cx + 0.75, 3.22);   // the grille on the lower half
      q.rect(O, cx - 0.17, 5.65, cx + 0.17, 6.1);
    }
    q.rect(O, 0, 6.82, bw, 7.0); q.shade(0, 6.82, bw);
    if (!o.blank) {
      q.eared(O, cx - 0.62, 7.9, cx + 0.62, 11.6, 0.14, { sill: 0.14 }); q.win(cx - 0.62, 7.9, cx + 0.62, 11.6, 2, 5);
      q.rect(O, cx - 0.86, 11.74, cx + 0.86, 11.95); q.shade(cx - 0.86, 11.74, cx + 0.86, 0.04); q.rect(O, cx - 0.86, 12.15, cx + 0.86, 12.25);
      q.rect(O, cx - 0.5, 13.98, cx + 0.5, 14.35);
      q.eared(O, cx - 0.5, 14.8, cx + 0.5, 16.6, 0.11, { sill: 0.08 }); q.win(cx - 0.5, 14.8, cx + 0.5, 16.6, 2, 3);
    }
    q.rect(O, 0, 17.55, bw, BH);
    // shallow painted pilaster strips (half at each side)
    for (const [a, b] of [[0, 0.28], [bw - 0.28, bw]]) { q.rect(O, a, 6.9, b, 17.55); q.rect(COL.line, a === 0 ? b : a - 0.02, 6.9, a === 0 ? b + 0.02 : a, 17.55); }
  }, key);
  A.front = frontBay(4.35, { field: COL.field, ground: COL.ground, shade: COL.groundShade }, 'lmacade-bay-front');
  A.frontCorner = frontBay(4.4, { field: COL.field, ground: COL.ground, shade: COL.groundShade }, 'lmacade-bay-fcorner');
  A.rear = rearBay(3.8, { field: COL.rearField, ground: COL.rearGround, shade: '#c9a784' }, 'lmacade-bay-rear');
  A.rearCorner = frontBay(4.4, { field: COL.rearField, ground: COL.rearGround, shade: '#c9a784' }, 'lmacade-bay-rcorner');
  A.flank = rearBay(4.35, { field: COL.flankField, ground: COL.flankGround, shade: '#c3a974' }, 'lmacade-bay-flank');
  A.flankEnd = frontBay(4.35, { field: COL.flankField, ground: COL.flankGround, shade: '#c3a974' }, 'lmacade-bay-flankend');
  /** the inner light courts (closed, seen from the roofs only) and the round court wall: three tiers of plain windows / arches, 4.75 m bay */
  A.court = bay(256, 1024, 4.75, BH, (q) => {
    const cx = 4.75 / 2, O = COL.order;
    q.rect('#e9cdb0', 0, 0, 4.75, BH); q.rect('#8a857d', 0, 0, 4.75, 0.7);
    q.rect('#dcb99c', 0, 0.7, 4.75, 6.6); q.joints('#c4a48c', 0, 0.7, 4.75, 6.6, 0.74, 0.03);
    q.arch(O, cx, 0.8, 2.3, 3.4); q.arch('#3a332e', cx, 0.9, 2.0, 3.4); q.arch('#5a4a40', cx, 0.9, 1.5, 2.2);
    q.rect(O, 0, 6.6, 4.75, 6.8); q.shade(0, 6.6, 4.75);
    q.eared(O, cx - 0.7, 7.9, cx + 0.7, 12.4, 0.14, { sill: 0.14 }); q.win(cx - 0.7, 7.9, cx + 0.7, 12.4, 2, 5);
    q.eared(O, cx - 0.5, 14.8, cx + 0.5, 16.6, 0.11, { sill: 0.08 }); q.win(cx - 0.5, 14.8, cx + 0.5, 16.6, 2, 3);
    q.rect(O, 0, 17.55, 4.75, BH);
  }, 'lmacade-bay-court');
  const PF = { field: COL.field, ground: COL.ground, shade: COL.groundShade }, PR = { field: COL.rearField, ground: COL.rearGround, shade: '#c9a784' }, PL = { field: COL.flankField, ground: COL.flankGround, shade: '#c3a974' };
  A.frontBlank = frontBay(1.5, PF, 'lmacade-bay-front-blank', { blank: true, W: 96, H: 1280 });
  A.rearBlank = rearBay(1.5, PR, 'lmacade-bay-rear-blank', { blank: true, W: 96, H: 1280 });
  A.rearCornerBlank = frontBay(1.5, PR, 'lmacade-bay-rcorner-blank', { blank: true, W: 96, H: 1280 });
  A.flankBlank = rearBay(1.5, PL, 'lmacade-bay-flank-blank', { blank: true, W: 96, H: 1280 });
  A.flankEndBlank = frontBay(1.5, PL, 'lmacade-bay-flankend-blank', { blank: true, W: 96, H: 1280 });
  A.inner = bay(256, 1024, 4.2, BH, (q) => {
    const cx = 2.1, O = COL.order;
    q.rect('#e8d3a4', 0, 0, 4.2, BH); q.rect('#8a857d', 0, 0, 4.2, 0.6); q.rect('#ddc79a', 0, 0.6, 4.2, 6.7);
    q.eared(O, cx - 0.65, 1.4, cx + 0.65, 5.4, 0.12, { sill: 0.1 }); q.win(cx - 0.65, 1.4, cx + 0.65, 5.4, 2, 4);
    q.eared(O, cx - 0.65, 8.2, cx + 0.65, 12.0, 0.12, { sill: 0.1 }); q.win(cx - 0.65, 8.2, cx + 0.65, 12.0, 2, 4);
    q.eared(O, cx - 0.5, 14.6, cx + 0.5, 16.8, 0.1, { sill: 0.08 }); q.win(cx - 0.5, 14.6, cx + 0.5, 16.8, 2, 3);
    q.rect(O, 0, 17.55, 4.2, BH);
  }, 'lmacade-bay-inner');

  // ------------------------------------------------------------------------------------------------ the central pavilion (front): one tile 22.6 m x 10.8 m (y 7.0 .. 17.8), u from -12.3
  const CPW = 22.6, CPH = 10.8;
  A.cpFront = bay(1280, 640, CPW, CPH, (q) => {
    const O = COL.order, u = (uu) => uu + 12.3, g = q.g;                    // u -> tile x
    q.rect(COL.field, 0, 7.0, CPW, 17.8);
    // the flank windows at u = -8.25 and 5.85: arched first floor over an apron, small top-floor window
    for (const cu of [-8.25, 5.85]) {
      const cx = u(cu);
      q.balus(O, cx - 0.9, 7.0, cx + 0.9, 7.9); q.arch(O, cx, 7.9, 1.8, 11.7); q.archWin(cx, 7.9, 1.44, 4.5, 2, 4); q.rect(O, cx - 0.17, 12.45, cx + 0.17, 12.9);
      q.rect(O, cx - 0.7, 13.96, cx + 0.7, 14.5); q.rect('#e6dcc8', cx - 0.58, 14.04, cx + 0.58, 14.42);
      q.eared(O, cx - 0.5, 14.7, cx + 0.5, 17.1, 0.11, { sill: 0 }); q.win(cx - 0.5, 14.7, cx + 0.5, 17.1, 2, 3);
    }
    // the central axis: tall arched window (1.8 x 4.6) over the balcony, a rectangular window in an architrave frame above, a garland between them
    const c0 = u(-1.2);
    q.arch(O, c0, 7.9, 2.2, 11.6); q.archWin(c0, 7.9, 1.8, 4.6, 3, 5); q.rect(O, c0 - 0.2, 12.5, c0 + 0.2, 13.05);
    q.rect(O, c0 - 0.7, 13.2, c0 + 0.7, 13.45); g.strokeStyle = O; g.lineWidth = Math.max(2, 0.11 * q.sx);
    g.beginPath(); g.moveTo(q.X(c0 - 1.05), q.Y(13.5)); g.quadraticCurveTo(q.X(c0), q.Y(12.7), q.X(c0 + 1.05), q.Y(13.5)); g.stroke();
    q.eared(O, c0 - 0.65, 13.7, c0 + 0.65, 15.9, 0.16, { sill: 0.12 }); q.win(c0 - 0.65, 13.7, c0 + 0.65, 15.9, 2, 3);
    // trophy panels behind the statues' bays (attributes of the arts), cream relief on a darker field
    for (const [cu, k] of [[-5.1, 0], [2.7, 1]]) {
      const cx = u(cu); q.rect(COL.field, cx - 0.9, 9.4, cx + 0.9, 14.4); q.rect('#d9bba0', cx - 0.5, 11.0, cx + 0.5, 14.2); q.oval(O, cx, 12.6, 0.38, 0.5);
      q.rect(O, cx - 0.05, 11.1, cx + 0.05, 14.1); if (k) { q.rect(O, cx - 0.4, 12.2, cx + 0.4, 12.28); } else { q.rect('#c9b79a', cx - 0.3, 11.6, cx + 0.3, 12.0); }
    }
    // the string course at the podium top
    q.rect(O, 0, 6.95, CPW, 7.2);
  }, 'lmacade-cpfront', { yb: 7.0 });
  // the door under the portico: dark oak double door 2.1 x 3.8 m with a glazed transom, tablet text above it
  A.door = tex.draw(256, 512, (g, w, h) => {
    g.fillStyle = '#d8c8a8'; g.fillRect(0, 0, w, h); g.fillStyle = '#c4b392'; g.fillRect(0, 0, 8, h); g.fillRect(w - 8, 0, 8, h);
    g.fillStyle = '#6b4a32'; g.fillRect(14, 150, w - 28, h - 150);                                            // leaves
    g.fillStyle = '#4a321f'; g.fillRect(w / 2 - 3, 150, 6, h - 150);
    for (const x of [24, w / 2 + 10]) { g.fillStyle = '#7c5a3e'; g.fillRect(x, 170, w / 2 - 34, 130); g.fillRect(x, 320, w / 2 - 34, 170); g.strokeStyle = '#3c2616'; g.lineWidth = 2; g.strokeRect(x + 0.5, 170.5, w / 2 - 35, 129); g.strokeRect(x + 0.5, 320.5, w / 2 - 35, 169); }
    g.fillStyle = '#2d343a'; g.fillRect(14, 20, w - 28, 120);                                                  // the glazed transom
    g.strokeStyle = '#c8c0a8'; g.lineWidth = 3; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(14 + i * (w - 28) / 5, 20); g.lineTo(14 + i * (w - 28) / 5, 140); g.stroke(); } g.beginPath(); g.moveTo(14, 80); g.lineTo(w - 14, 80); g.stroke();
  }, { key: 'lmacade-door' });
  A.tablet = tex.draw(512, 96, (g, w, h) => {
    g.fillStyle = '#2d3b3f'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a24a'; g.lineWidth = 3; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = '#c9a24a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let fs1 = 44; g.font = `bold ${fs1}px ${tex.FONTS ? tex.FONTS.serif : 'serif'}`; while (g.measureText('СВОБОДНЫМЪ ХУДОЖЕСТВАМЪ').width > w - 36 && fs1 > 12) { fs1 -= 2; g.font = `bold ${fs1}px ${tex.FONTS ? tex.FONTS.serif : 'serif'}`; }
    g.fillText('СВОБОДНЫМЪ ХУДОЖЕСТВАМЪ', w / 2, 36); g.font = `bold 24px ${tex.FONTS ? tex.FONTS.serif : 'serif'}`; g.fillText('ЛѢТА 1765 ГОДА', w / 2, 72);
  }, { key: 'lmacade-tablet' });
  A.plaqueDark = tex.draw(64, 64, (g, w, h) => { g.fillStyle = '#34383b'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a8f92'; g.lineWidth = 3; g.strokeRect(3, 3, w - 6, h - 6); g.fillStyle = '#6b7075'; for (let i = 0; i < 4; i++) g.fillRect(12, 14 + i * 10, w - 24, 3); }, { key: 'lmacade-plaque' });

  // ------------------------------------------------------------------------------------------------ the rear centre (garden side): base 22.7 x 7.0 m, upper wall 22.7 x 10.8 m (y 7.0 .. 17.8)
  A.rearBase = bay(1024, 320, 22.7, 7.0, (q) => {
    const O = COL.order, cx = 22.7 / 2, M0 = COL.rearMetal;
    q.rect(COL.plinth, 0, 0, 22.7, 0.9); q.rect('#8a7c70', 0, 0.82, 22.7, 0.9);
    q.rect(COL.rearGround, 0, 0.9, 22.7, 7.0);
    for (let c = 0; c < 8; c++) { const y0 = 0.9 + c * 0.75; q.rect('#c9a784', 0, y0, 22.7, y0 + 0.035); for (let x = (c % 2 ? 0.7 : 1.6); x < 22.7; x += 1.7) q.rect('#c9a784', x, y0, x + 0.025, y0 + 0.75); }
    for (const dx of [-5.6, 5.6]) {                                           // the two big arched openings with iron grilles
      const x = cx + dx; q.arch(O, x, 0.9, 3.9, 4.4); q.arch('#2a2f33', x, 0.9, 3.5, 4.4); q.arch(M0, x, 1.0, 3.3, 4.4);
      q.arch('#33414a', x, 1.1, 2.9, 4.4); for (let xx = x - 1.4; xx < x + 1.5; xx += 0.2) q.rect(M0, xx, 1.1, xx + 0.04, 4.9); for (let y = 1.4; y < 5.2; y += 0.7) q.rect(M0, x - 1.65, y, x + 1.65, y + 0.05);
      q.rect(O, x - 0.2, 6.15, x + 0.2, 6.6);
    }
    q.rect(O, cx - 1.6, 1.0, cx + 1.6, 5.2); q.rect(M0, cx - 1.3, 1.0, cx + 1.3, 4.0); q.rect('#33414a', cx - 1.2, 1.1, cx + 1.2, 3.9);          // the central double door in a flat frame, a transom above
    for (let xx = cx - 1.1; xx < cx + 1.2; xx += 0.22) q.rect(M0, xx, 1.1, xx + 0.04, 3.9); q.rect(M0, cx - 0.02, 1.1, cx + 0.02, 3.9);
    q.rect('#33414a', cx - 1.2, 4.1, cx + 1.2, 4.9); for (let xx = cx - 1.1; xx < cx + 1.2; xx += 0.3) q.rect(M0, xx, 4.1, xx + 0.04, 4.9); q.rect(M0, cx - 1.2, 4.4, cx + 1.2, 4.44);
    q.rect(O, 0, 6.82, 22.7, 7.0);
  }, 'lmacade-rearbase', { rep: false });
  A.rearUpper = bay(1024, 512, 22.7, 10.8, (q) => {
    const O = COL.order, cx = 22.7 / 2;
    q.rect(COL.rearField, 0, 7.0, 22.7, 17.8);
    for (const dx of [-5.6, 0, 5.6]) {
      const x = cx + dx; q.balus(O, x - 1.0, 7.0, x + 1.0, 7.9); q.arch(O, x, 7.9, 1.9, 11.6); q.archWin(x, 7.9, 1.5, 4.6, 2, 4); q.rect(O, x - 0.17, 12.55, x + 0.17, 13.0);
      q.rect(O, x - 0.7, 13.96, x + 0.7, 14.5); q.eared(O, x - 0.5, 14.7, x + 0.5, 17.0, 0.11, { sill: 0 }); q.win(x - 0.5, 14.7, x + 0.5, 17.0, 2, 3);
    }
    q.rect(O, 0, 6.95, 22.7, 7.2);
  }, 'lmacade-rearupper', { yb: 7.0, rep: false });

  // ------------------------------------------------------------------------------------------------ rustication, frieze, modillions, balusters, roofs
  A.rust = tex.draw(256, 256, (g, w, h) => {                                // 3 m x 3 m: courses 0.75 m
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    const r = rnd(7301);
    for (let c = 0; c < 4; c++) { g.fillStyle = 'rgba(140,110,90,0.55)'; g.fillRect(0, c * 64, w, 3); for (let x = (c % 2 ? 40 : 110); x < w + 100; x += 128) g.fillRect(x % w, c * 64, 2, 64); }
    speckle(g, w, h, r, 500, 180, 255, [210, 200, 190], 2);
  }, { key: 'lmacade-rust', repeat: [1, 1] });
  A.frieze = tex.draw(128, 128, (g, w, h) => {                              // 1.25 m x 1.25 m, v = 0 at the frieze foot (band vBase): one square tablet and one rosette per module, the pattern fills v 0 .. 0.76
    g.fillStyle = '#ece1cb'; g.fillRect(0, 0, w, h);
    const y0 = h * (1 - 0.70), y1 = h * (1 - 0.06);
    g.fillStyle = '#d6c9ae'; g.fillRect(12, y0, 64, y1 - y0); g.fillStyle = '#f2e9d6'; g.fillRect(16, y0 + 4, 56, y1 - y0 - 8); g.fillStyle = '#c9b99a';
    g.beginPath(); g.arc(44, (y0 + y1) / 2, 14, 0, 6.3); g.fill(); g.fillStyle = '#f2e9d6'; g.beginPath(); g.arc(44, (y0 + y1) / 2, 8, 0, 6.3); g.fill();
    g.fillStyle = '#d6c9ae'; g.beginPath(); g.arc(100, (y0 + y1) / 2, 11, 0, 6.3); g.fill(); g.fillStyle = '#f2e9d6'; g.beginPath(); g.arc(100, (y0 + y1) / 2, 6.5, 0, 6.3); g.fill();
    g.fillStyle = 'rgba(80,70,60,0.28)'; g.fillRect(0, h - 5, w, 5);
  }, { key: 'lmacade-frieze', repeat: [1, 1] });
  A.modil = tex.draw(64, 32, (g, w, h) => { g.fillStyle = '#d9d0bd'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2ead8'; g.fillRect(10, 5, 22, 22); g.fillRect(42, 5, 22, 22); }, { key: 'lmacade-modil', repeat: [1, 1] });
  A.balus = tex.draw(64, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(20, h); g.lineTo(20, h - 10); g.quadraticCurveTo(6, h - 40, 24, h - 74); g.quadraticCurveTo(28, h - 96, 22, h - 116); g.lineTo(22, 0); g.lineTo(42, 0); g.lineTo(42, h - 116);
    g.quadraticCurveTo(36, h - 96, 40, h - 74); g.quadraticCurveTo(58, h - 40, 44, h - 10); g.lineTo(44, h); g.closePath(); g.fill();
  }, { key: 'lmacade-balus', repeat: [1, 1] });
  A.roof = tex.draw(128, 128, (g, w, h) => {                                // sheet metal, seams every 0.6 m
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(70,80,90,0.5)'; g.fillRect(0, 0, 4, h); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(4, 0, 2, h);
    const r = rnd(7302); for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(80,90,100,${0.04 + r() * 0.06})`; g.fillRect(r() * w, 0, 2 + r() * 12, h); }
  }, { key: 'lmacade-roof', repeat: [1, 1] });
  A.ribs = tex.draw(128, 128, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(80,90,100,0.55)'; g.fillRect(0, 0, 5, h); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(5, 0, 3, h); }, { key: 'lmacade-ribs', repeat: [1, 1] });
  A.glassRoof = tex.draw(128, 128, (g, w, h) => { g.fillStyle = '#8ea9bb'; g.fillRect(0, 0, w, h); g.fillStyle = '#2f3a40'; g.fillRect(0, 0, w, 5); g.fillRect(0, 0, 5, h); g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(8, 8, w - 16, 30); }, { key: 'lmacade-glassroof', repeat: [1, 1] });
  A.fence = tex.draw(128, 512, (g, w, h) => {                               // black cast-iron fence: 1.6 m tall, 1.0 m wide tile, 8 bars with spear tips, two rails
    g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff';
    for (let k = 0; k < 8; k++) { const x = 8 + k * 16; g.fillRect(x - 2, 60, 4, h - 60); g.beginPath(); g.moveTo(x - 6, 70); g.lineTo(x, 0); g.lineTo(x + 6, 70); g.closePath(); g.fill(); }
    g.fillRect(0, 100, w, 8); g.fillRect(0, h - 90, w, 8);
  }, { key: 'lmacade-fence', repeat: [1, 1] });
  A.railing = tex.draw(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.fillRect(0, 6, w, 7); g.fillRect(0, 54, w, 6); g.fillRect(0, 100, w, 7); for (const x of [10, 74]) g.fillRect(x, 6, 5, 101); }, { key: 'lmacade-railing', repeat: [1, 1] });

  // ------------------------------------------------------------------------------------------------ stone: pier granite, slabs, setts, hieroglyphs
  const grainTex = (key, base, seed, n = 900) => tex.draw(256, 256, (g, w, h) => {
    const r = rnd(seed); g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) { const v = 150 + Math.floor(r() * 105); g.fillStyle = `rgba(${v},${Math.max(0, v - 18)},${Math.max(0, v - 26)},0.30)`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2.4); }
    for (let i = 0; i < n / 4; i++) { const v = 90 + Math.floor(r() * 60); g.fillStyle = `rgba(${v},${v - 14},${v - 20},0.28)`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  }, { key, repeat: [1, 1] });
  A.pinkGrain = grainTex('lmacade-pinkgrain', COL.pink, 7311);
  A.greyGrain = tex.draw(256, 256, (g, w, h) => { const r = rnd(7312); g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { const v = 150 + Math.floor(r() * 100); g.fillStyle = `rgba(${v},${v},${v - 4},0.26)`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2.4); } }, { key: 'lmacade-greygrain', repeat: [1, 1] });
  A.slabs = tex.draw(256, 256, (g, w, h) => {                               // 2.4 m x 2.4 m: granite slabs 1.2 x 0.6 laid in courses
    const r = rnd(7313); g.fillStyle = '#d4c6bb'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 4; row++) for (let k = -1; k < 3; k++) { const v = 200 + Math.floor(r() * 40); g.fillStyle = `rgb(${v},${v - 12},${v - 20})`; g.fillRect(k * 128 + (row % 2 ? 64 : 0) + 1.5, row * 64 + 1.5, 125, 61); }
    speckle(g, w, h, r, 600, 150, 235, [200, 188, 180], 2.4);
  }, { key: 'lmacade-slabs', repeat: [1, 1] });
  A.steps = tex.draw(128, 128, (g, w, h) => { const r = rnd(7314); g.fillStyle = '#e8dcd2'; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 300, 160, 240, [210, 195, 188], 2.4); g.fillStyle = 'rgba(80,60,50,0.35)'; g.fillRect(0, 0, w, 3); }, { key: 'lmacade-steps', repeat: [1, 1] });
  /** hieroglyph band tile 0.8 m x 0.5 m: dark incised signs on the plinth */
  A.hiero = tex.draw(128, 96, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); const r = rnd(7315); g.fillStyle = '#7e7165'; g.strokeStyle = '#7e7165'; g.lineWidth = 3;
    g.fillRect(0, 8, w, 3); g.fillRect(0, h - 11, w, 3);
    for (let i = 0; i < 6; i++) {
      const x = 8 + i * 20, k = Math.floor(r() * 5);
      if (k === 0) { g.beginPath(); g.ellipse(x + 8, h / 2, 8, 12, 0, 0, 6.3); g.stroke(); g.fillRect(x + 6, h / 2 - 2, 4, 4); }
      else if (k === 1) { g.fillRect(x, 24, 14, 5); g.fillRect(x + 4, 33, 8, 5); g.fillRect(x, 44, 14, 5); g.fillRect(x + 4, 55, 8, 5); }
      else if (k === 2) { g.beginPath(); g.moveTo(x, 62); g.lineTo(x + 7, 24); g.lineTo(x + 14, 62); g.stroke(); g.fillRect(x + 2, 60, 12, 4); }
      else if (k === 3) { g.fillRect(x + 5, 22, 5, 44); g.fillRect(x, 30, 16, 4); g.beginPath(); g.arc(x + 8, 22, 5, 0, 6.3); g.stroke(); }
      else { g.beginPath(); g.moveTo(x, 40); g.quadraticCurveTo(x + 8, 20, x + 16, 40); g.quadraticCurveTo(x + 8, 58, x, 40); g.stroke(); g.fillRect(x + 6, 36, 4, 6); }
    }
  }, { key: 'lmacade-hiero', repeat: [1, 1] });
  A.inscrPed = tex.draw(1024, 320, (g, w, h) => {                            // the pedestal inscription: transparent ground, dark brown letters (old orthography, four lines, no full stops)
    g.clearRect(0, 0, w, h); g.fillStyle = '#5b4538'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const f = tex.FONTS ? tex.FONTS.serif : 'serif', lines = ['СФИНКСЪ', 'ИЗЪ ДРЕВНИХЪ ѲИВЪ ВЪ ЕГИПТѢ', 'ПЕРЕВЕЗЕНЪ ВЪ ГРАДЪ СВЯТАГО ПЕТРА', 'ВЪ 1832 ГОДУ'];
    lines.forEach((t, i) => { let sz = i === 0 ? 64 : 50; g.font = 'bold ' + sz + 'px ' + f; while (g.measureText(t).width > w - 30 && sz > 14) { sz -= 2; g.font = 'bold ' + sz + 'px ' + f; } g.fillText(t, w / 2, 44 + i * 76); });
  }, { key: 'lmacade-inscr-ped' });
  A.cobble = tex.draw(256, 256, (g, w, h) => {                              // granite setts 0.1 m (4 m tile: 10 cm = 6.4 px)
    const r = rnd(7316); g.fillStyle = '#4e4a45'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 10) for (let x = (y / 10 % 2 ? 0 : 5); x < w; x += 10) { const v = 90 + Math.floor(r() * 50); g.fillStyle = `rgb(${v},${v - 2},${v - 6})`; g.fillRect(x + 1, y + 1, 8, 8); }
  }, { key: 'lmacade-cobble', repeat: [1, 1] });
  A.diamond = tex.draw(256, 256, (g, w, h) => {                             // the round-court floor: diagonal diamond lattice of light slab bands on darker granite
    const r = rnd(7317); g.fillStyle = '#8a857d'; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 500, 100, 190, [160, 155, 150], 2);
    g.strokeStyle = '#a9a59c'; g.lineWidth = 12; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * 128, 0); g.lineTo(k * 128 + 256, 256); g.stroke(); g.beginPath(); g.moveTo(k * 128 + 256, 0); g.lineTo(k * 128, 256); g.stroke(); }
  }, { key: 'lmacade-diamond', repeat: [1, 1] });
  A.lawn = tex.draw(256, 256, (g, w, h) => { const r = rnd(7318); g.fillStyle = '#f2f6e8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 520; i++) { const v = 208 + Math.floor(r() * 47); g.fillStyle = `rgba(${v - 26},${v},${v - 44},0.22)`; const s = 2 + r() * 7; g.beginPath(); g.ellipse(r() * w, r() * h, s, s * (0.4 + r() * 0.5), r() * 3.1, 0, 6.3); g.fill(); } }, { key: 'lmacade-lawn', repeat: [1, 1] });
  A.gravel = tex.draw(128, 128, (g, w, h) => { const r = rnd(7319); g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { const v = 170 + Math.floor(r() * 70); g.fillStyle = `rgba(${v},${v - 28},${v - 40},0.45)`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2.4); } }, { key: 'lmacade-gravel', repeat: [1, 1] });
  A.bark = tex.draw(128, 256, (g, w, h) => { const r = rnd(7320); g.fillStyle = '#6a5c4e'; g.fillRect(0, 0, w, h); for (let i = 0; i < 36; i++) { const x = r() * w; g.strokeStyle = `rgba(32,26,20,${0.3 + r() * 0.35})`; g.lineWidth = 2 + r() * 3; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 32) g.lineTo(x + (r() - 0.5) * 8, y); g.stroke(); } }, { key: 'lmacade-bark', repeat: [1, 1] });

  return A;
}
