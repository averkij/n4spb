// landmarksUniversity/mats.js - materials and canvas textures of Universitetskaya embankment.  Colours: docs/research/university-embankment.md sections 3-7 (hex read from the photos
// refs/university kk_01 kk_02 kk_06 ac_01 ac_02 tc_01 tc_24 lo_16 mw_01 gd_03 re_01 p2_04).  The facades are flat walls with BAY textures (one window axis per tile, painted in real
// colours in metres; uv = (bay index, height / texture height)); relief that matters for the silhouette (pilaster strips, cornices, porticos, balconies, the tower) is real geometry.
// `painter()` is the small canvas vocabulary in metres (y up): rect, joints, arch, oval, win, archWin, eared.  All keys start with lmU-.
export const C = {
  white: '#f3f1ea', whiteShade: '#dcd9cf', line: '#c4c1b6', iron: '#1b1f20', glassA: '#6c8aa3', glassB: '#2c3a4a', door: '#5a3a26', doorDark: '#3c2618',
  kk: '#4fae94', kkDark: '#439a82', kkSocle: '#6f9a8a', kkRoof: '#aab2b6', dome: '#54554f', domeGreen: '#5f7468', gold: '#d8a93a', skirt: '#8a5a4c',
  annex: '#e0cc85', annexRust: '#d2bd78', frameBrown: '#6a4a35',
  ac: '#ead596', acShade: '#dcc684', granite: '#8c7f7c', graniteDark: '#6f6462', acRoof: '#9aa0a4', chimney: '#e4d6a8',
  tc: '#c9504a', tcDark: '#b24540', tcRoof: '#b8c0c4', limestone: '#c9c3b2',
  mw: '#e6cf86', mwRust: '#d9c79a', gd: '#ecd98f', gdRust: '#c9bd95', p2: '#b9cdb4', p2Roof: '#c8603c', rectorRoof: '#c46a55',
  redGranite: '#7d3f3a', redGraniteDark: '#643230', slab: '#9b9a95', bronze: '#4a4a3c', lawn: '#5f8f2a', boulder: '#9a8f88',
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
  q.win = (x0, y0, x1, y1, nx = 2, ny = 3, frame = C.white) => {
    q.rect(frame, x0, y0, x1, y1);
    const m = 0.045, pw = (x1 - x0 - m) / nx, ph = (y1 - y0 - m) / ny;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { glassFill(y0 + m + j * ph, y0 + (j + 1) * ph); g.fillRect(X(x0 + m + i * pw), Y(y0 + (j + 1) * ph), (pw - m) * sx, (ph - m) * sy); }
    g.fillStyle = 'rgba(255,255,255,0.13)'; g.beginPath(); g.moveTo(X(x0), Y(y0 + (y1 - y0) * 0.2)); g.lineTo(X(x1), Y(y0 + (y1 - y0) * 0.75)); g.lineTo(X(x1), Y(y1)); g.lineTo(X(x0), Y(y0 + (y1 - y0) * 0.5)); g.closePath(); g.fill();
  };
  /** round-headed window: opening width w, bottom y0, crown y0 + h; nx x ny panes below the fan */
  q.archWin = (cx, y0, w, h, nx = 2, ny = 3, frame = C.white) => {
    const ys = y0 + h - w / 2, x0 = cx - w / 2, x1 = cx + w / 2;
    q.arch(frame, cx, y0, w, ys);
    g.save(); archPath(cx, y0 + 0.05, w - 0.1, ys); g.clip();
    glassFill(y0, y0 + h); g.fillRect(X(x0), Y(y0 + h), w * sx, h * sy);
    g.fillStyle = frame; const m = 0.045;
    for (let i = 1; i < nx; i++) g.fillRect(X(x0 + (w * i) / nx - m / 2), Y(ys), m * sx, (ys - y0) * sy);
    for (let j = 1; j <= ny; j++) g.fillRect(X(x0), Y(y0 + ((ys - y0) * j) / ny + m / 2), w * sx, m * sy);
    g.strokeStyle = frame; g.lineWidth = Math.max(1.5, m * sx);
    for (const a of [Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75]) { g.beginPath(); g.moveTo(X(cx), Y(ys)); g.lineTo(X(cx) + Math.cos(a) * (w / 2) * sx, Y(ys) - Math.sin(a) * (w / 2) * sy); g.stroke(); }
    g.beginPath(); g.ellipse(X(cx), Y(ys), (w / 4) * sx, (w / 4) * sy, 0, Math.PI, 0, false); g.stroke();
    g.restore();
  };
  /** Petrine "eared" surround round an opening x0..x1, y0..y1: band fw wide, ears at the upper corners, optional curved head (cap) and sill */
  q.eared = (col, x0, y0, x1, y1, fw = 0.18, o = {}) => {
    const e = o.ear ?? fw * 0.55;
    q.rect(col, x0 - fw, y0 - (o.sill ?? 0.12), x1 + fw, y1 + fw);
    q.rect(col, x0 - fw - e, y1 - fw * 1.6, x1 + fw + e, y1 + fw);
    if (o.foot) q.rect(col, x0 - fw - e, y0 - (o.sill ?? 0.12), x1 + fw + e, y0 + fw * 0.9);
    if (o.cap) { g.fillStyle = col; g.beginPath(); g.moveTo(X(x0 - fw - e), Y(y1 + fw)); g.quadraticCurveTo(X((x0 + x1) / 2), Y(y1 + fw + o.cap * 2), X(x1 + fw + e), Y(y1 + fw)); g.closePath(); g.fill(); }
    g.strokeStyle = o.shade || C.line; g.lineWidth = 1; g.strokeRect(X(x0 - fw) + 0.5, Y(y1 + fw) + 0.5, (x1 - x0 + 2 * fw) * sx - 1, (y1 - y0 + fw + (o.sill ?? 0.12)) * sy - 1);
  };
  /** thin shadow line under a moulding */
  q.shade = (x0, y, x1, t = 0.04, col = 'rgba(60,70,80,0.28)') => q.rect(col, x0, y - t, x1, y);
  return q;
}

export function makeMats(ctx) {
  const T = ctx.mat.toon, tex = ctx.tex;
  const M = { C, T };
  const rnd = (seed) => ctx.rng(seed);
  const bay = (W, H, bw, bh, fn, key, rep = true) => tex.draw(W, H, (g) => fn(painter(g, W, H, bw, bh)), rep ? { key, repeat: [1, 1] } : { key });
  const bayMat = (t, name) => T('#ffffff', { map: t, name: 'lmU-' + name, paint: 0.02 });
  const plain = (hex, name, o = {}) => T(hex, { name: 'lmU-' + name, paint: 0.04, ...o });

  // ------------------------------------------------------------------------------------------------ tiles
  const seam = tex.draw(64, 64, (g, w, h) => { g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h); g.fillStyle = '#bdbdbd'; g.fillRect(0, 0, 4, h); g.fillStyle = '#ffffff'; g.fillRect(4, 0, 3, h); }, { key: 'lmU-seam', repeat: [1, 1] });
  const ashlar = tex.draw(256, 128, (g, w, h) => {
    const r = rnd(9301); g.fillStyle = '#eeeeec'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 2; row++) for (let k = -1; k < 3; k++) { const v = 222 + Math.floor(r() * 30); g.fillStyle = `rgb(${v},${v},${v - 2})`; g.fillRect(k * 128 + (row ? 64 : 0) + 2, row * 64 + 2, 124, 60); }
    for (let i = 0; i < 600; i++) { const v = 150 + Math.floor(r() * 90); g.fillStyle = `rgba(${v},${v - 4},${v - 8},0.32)`; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2); }
    g.fillStyle = '#aeaca8'; for (let row = 0; row < 2; row++) { g.fillRect(0, row * 64 - 1, w, 2); for (let k = 0; k < 3; k++) g.fillRect(k * 128 + (row ? 64 : 0) - 1, row * 64, 2, 64); }
    g.fillRect(0, h - 2, w, 2);
  }, { key: 'lmU-ashlar', repeat: [1, 1] });
  const slabs = tex.draw(256, 256, (g, w, h) => {
    const r = rnd(9302); g.fillStyle = '#d9d8d2'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 4; row++) for (let k = -1; k < 3; k++) { const v = 214 + Math.floor(r() * 34); g.fillStyle = `rgb(${v},${v},${v - 3})`; g.fillRect(k * 128 + (row % 2 ? 64 : 0) + 1, row * 64 + 1, 126, 62); }
  }, { key: 'lmU-slabs', repeat: [1, 1] });
  const grass = tex.draw(256, 256, (g, w, h) => {
    const r = rnd(9303); g.fillStyle = '#f0f4e6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) { const v = 208 + Math.floor(r() * 47); g.fillStyle = `rgba(${v - 24},${v},${v - 40},0.22)`; const s = 2 + r() * 7; g.beginPath(); g.ellipse(r() * w, r() * h, s, s * (0.4 + r() * 0.5), r() * 3.1, 0, 6.3); g.fill(); }
  }, { key: 'lmU-grass', repeat: [1, 1] });
  /** balustrade cut-out: tile = one baluster (0.36 m) x the height between plinth and rail */
  const balus = tex.draw(64, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(20, h); g.lineTo(20, h - 10); g.quadraticCurveTo(6, h - 40, 24, h - 74); g.quadraticCurveTo(28, h - 96, 22, h - 116); g.lineTo(22, 0); g.lineTo(42, 0); g.lineTo(42, h - 116);
    g.quadraticCurveTo(36, h - 96, 40, h - 74); g.quadraticCurveTo(58, h - 40, 44, h - 10); g.lineTo(44, h); g.closePath(); g.fill();
  }, { key: 'lmU-balus', repeat: [1, 1] });
  /** wrought-iron balcony / fence panel cut-out: tile 1.0 m x 1.0 m, scrolls between two rails */
  const ironwork = tex.draw(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff'; g.lineWidth = 5;
    g.fillRect(0, 0, w, 7); g.fillRect(0, h - 9, w, 9); g.fillRect(0, 26, w, 4); g.fillRect(0, 0, 5, h); g.fillRect(w / 2 - 2, 0, 4, h);
    for (const cx of [w * 0.25, w * 0.75]) { g.lineWidth = 4; g.beginPath(); g.arc(cx, 62, 15, 0, 6.3); g.stroke(); g.beginPath(); g.arc(cx, 98, 11, 0, 6.3); g.stroke(); g.beginPath(); g.moveTo(cx, 30); g.lineTo(cx, 47); g.stroke(); }
  }, { key: 'lmU-ironwork', repeat: [1, 1] });
  /** fence pickets cut-out: tile 0.6 m x 2.6 m: four pickets with spear tips, two rails */
  const pickets = tex.draw(64, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff';
    for (let k = 0; k < 4; k++) { const x = 8 + k * 16; g.fillRect(x - 1.6, 18, 3.2, h - 18); g.beginPath(); g.moveTo(x - 4, 22); g.lineTo(x, 0); g.lineTo(x + 4, 22); g.closePath(); g.fill(); }
    g.fillRect(0, 34, w, 5); g.fillRect(0, h - 26, w, 5);
  }, { key: 'lmU-pickets', repeat: [1, 1] });

  // ------------------------------------------------------------------------------------------------ Kunstkamera
  const KH = 14.2;
  /** wing bay bw x 14.2 m: a 2.1 .. 3.2 m green field between two half lopatki (lop wide each), three windows.  kind: 'win' | 'blind' (white panels instead of windows) | 'door'.
   *  Three rhythms (kk_01): the pavilions 3.02 m, the walls beside the tower 3.6 m with broad strips, the end walls 4.4 m. */
  const kkBay = (kind, bw, lop, tag) => bay(256, 1024, bw, KH, (q) => {
    const cx = bw / 2, blind = kind === 'blind', hw = 0.48, fw = 0.17;
    q.rect(C.kk, 0, 0, bw, KH);
    q.rect(C.white, 0, 1.3, lop, 13.2); q.rect(C.white, bw - lop, 1.3, bw, 13.2);                        // the halves of the lopatki
    q.rect(C.line, lop, 1.3, lop + 0.03, 13.2); q.rect('rgba(40,90,80,0.35)', bw - lop - 0.04, 1.3, bw - lop, 13.2);   // their edges (light from the left)
    q.rect(C.kkSocle, 0, 0, bw, 1.3); q.rect('#5d8778', 0, 0, bw, 0.25); q.rect(C.white, 0, 1.22, bw, 1.36); q.shade(0, 1.22, bw);
    if (!blind && kind !== 'door') { q.rect(C.white, cx - 0.5, 0.42, cx + 0.5, 1.0); q.rect('#2a343c', cx - 0.4, 0.5, cx + 0.4, 0.92); for (const x of [cx - 0.13, cx + 0.13]) q.rect('#9aa39e', x - 0.015, 0.5, x + 0.015, 0.92); }
    const floors = [[1.95, 4.3, 3], [6.2, 9.2, 4], [10.6, 12.9, 3]];
    floors.forEach(([y0, y1, ny], f) => {
      if (kind === 'door' && f === 0) {                                                               // the door replaces the ground-floor window and cuts the socle
        q.eared(C.white, cx - 0.6, 0.3, cx + 0.6, y1, 0.19, { sill: 0 }); q.rect(C.door, cx - 0.6, 0.3, cx + 0.6, 3.25); q.rect(C.doorDark, cx - 0.02, 0.3, cx + 0.02, 3.25);
        for (const sx of [-0.31, 0.31]) { q.rect(C.doorDark, cx + sx - 0.2, 0.55, cx + sx + 0.2, 1.5); q.rect(C.doorDark, cx + sx - 0.2, 1.7, cx + sx + 0.2, 3.0); }
        q.win(cx - 0.6, 3.35, cx + 0.6, y1, 2, 1); return;
      }
      q.eared(C.white, cx - hw, y0, cx + hw, y1, fw, { cap: f === 1 ? 0.2 : 0, foot: true });
      if (blind) q.rect('#ece9e0', cx - hw, y0, cx + hw, y1); else q.win(cx - hw, y0, cx + hw, y1, 2, ny);
      q.shade(cx - hw - fw, y0 - 0.12, cx + hw + fw);
    });
    q.rect(C.white, cx - 0.56, 4.95, cx + 0.56, 5.75); q.rect(C.line, cx - 0.56, 4.95, cx + 0.56, 4.99);     // the apron panel of the first-floor window
    q.oval(C.white, cx, 9.92, 0.3, 0.3); q.oval(C.kkDark, cx, 9.92, 0.17, 0.17);                         // the round medallion under the upper window
    q.rect(C.white, 0, 13.2, bw, KH); q.shade(0, 13.2, bw, 0.05); q.rect(C.whiteShade, 0, 13.52, bw, 13.58); q.rect(C.whiteShade, 0, 13.86, bw, 13.9);
  }, 'lmU-kkBay-' + kind + tag);
  /** banded white (quoins): tile 1 m x 0.76 m with two joints */
  const band2 = tex.draw(64, 64, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#c9c6ba'; g.fillRect(0, 0, w, 4); g.fillRect(0, 32, w, 4); }, { key: 'lmU-band2', repeat: [1, 1] });
  /** the centre: the two canted sides and the concave front unrolled, 19.8 m x 14.2 m, white with dense banding, five axes (door / windows / niches) */
  const kkCentre = bay(1024, 1024, 19.8, KH, (q) => {
    q.rect(C.white, 0, 0, 19.8, KH); q.joints(C.line, 0, 1.3, 19.8, 13.2, 0.38, 0.045);
    q.rect(C.kkSocle, 0, 0, 19.8, 1.3); q.rect('#5d8778', 0, 0, 19.8, 0.25); q.rect(C.white, 0, 1.22, 19.8, 1.36);
    const ax = [1.84, 5.74, 9.88, 13.96, 17.9];
    ax.forEach((cx, i) => {
      const mid = i === 2, niche = i === 1 || i === 3;
      q.rect(C.kk, cx - 0.95, 1.36, cx + 0.95, 13.2);
      if (niche) {
        q.arch(C.white, cx, 1.9, 1.3, 3.9); q.arch('#e2dfd6', cx, 2.0, 1.05, 3.85);
        q.arch(C.white, cx, 6.1, 1.3, 8.6); q.arch('#e2dfd6', cx, 6.2, 1.05, 8.55);
        q.oval(C.white, cx, 11.7, 0.62, 0.95); q.oval('#e2dfd6', cx, 11.7, 0.5, 0.8);
      } else if (mid) {
        q.eared(C.white, cx - 0.8, 1.6, cx + 0.8, 4.5, 0.2, {}); q.archWin(cx, 1.6, 1.6, 3.0, 2, 2);
        q.eared(C.white, cx - 0.7, 6.0, cx + 0.7, 9.3, 0.2, { foot: true }); q.win(cx - 0.7, 6.0, cx + 0.7, 9.3, 2, 4);
        q.g.fillStyle = C.white; q.g.beginPath(); q.g.moveTo(q.X(cx - 1.05), q.Y(9.55)); q.g.lineTo(q.X(cx), q.Y(10.15)); q.g.lineTo(q.X(cx + 1.05), q.Y(9.55)); q.g.closePath(); q.g.fill();
        q.eared(C.white, cx - 0.6, 10.7, cx + 0.6, 12.8, 0.18, {}); q.archWin(cx, 10.7, 1.2, 2.1, 2, 2);
      } else {
        q.eared(C.white, cx - 0.55, 1.9, cx + 0.55, 4.4, 0.18, {}); q.archWin(cx, 1.9, 1.1, 2.5, 2, 2);
        q.eared(C.white, cx - 0.55, 6.2, cx + 0.55, 9.2, 0.18, { foot: true }); q.win(cx - 0.55, 6.2, cx + 0.55, 9.2, 2, 4);
        q.eared(C.white, cx - 0.5, 10.7, cx + 0.5, 12.8, 0.18, {}); q.archWin(cx, 10.7, 1.0, 2.1, 2, 2);
      }
    });
    q.rect(C.white, 0, 13.2, 19.8, KH); q.shade(0, 13.2, 19.8, 0.05); q.rect(C.whiteShade, 0, 13.52, 19.8, 13.58); q.rect(C.whiteShade, 0, 13.86, 19.8, 13.9);
  }, 'lmU-kkCentre', false);
  /** tower tier 1: one face 6.8 m x 5.9 m (y 14.2 .. 20.1): green with white bands, two round-headed windows */
  const kkT1 = bay(512, 512, 6.8, 5.9, (q) => {
    q.rect(C.kk, 0, 0, 6.8, 5.9);
    for (let y = 0.25; y < 4.9; y += 0.56) q.rect(C.white, 0, y, 6.8, y + 0.28);
    q.rect(C.white, 0, 0, 0.5, 5.9); q.rect(C.white, 6.3, 0, 6.8, 5.9); q.rect(C.white, 0, 5.0, 6.8, 5.9); q.shade(0, 5.0, 6.8, 0.06); q.rect(C.whiteShade, 0, 5.4, 6.8, 5.46);
    for (const cx of [2.0, 4.8]) { q.arch(C.white, cx, 0.5, 1.9, 3.1); q.archWin(cx, 0.72, 1.46, 3.1, 3, 3); q.rect(C.white, cx - 0.16, 4.2, cx + 0.16, 4.9); }
  }, 'lmU-kkT1');
  /** tower tier 2: one of 8 bays round the drum, 4.05 m x 8.2 m (y 20.7 .. 28.9): white pilaster halves, the tall arched window in a green field, the entablature */
  const kkT2 = bay(256, 512, 4.05, 8.2, (q) => {
    q.rect(C.kk, 0, 0, 4.05, 8.2);
    q.rect(C.white, 0, 0, 0.55, 8.2); q.rect(C.white, 3.5, 0, 4.05, 8.2); q.rect(C.line, 0.55, 0, 0.58, 6.9); q.rect('rgba(40,90,80,0.3)', 3.46, 0, 3.5, 6.9);
    q.rect(C.white, 0, 0, 4.05, 0.3); q.rect(C.white, 0.55, 6.3, 3.5, 6.5);
    q.arch(C.white, 2.025, 0.5, 1.9, 4.95); q.archWin(2.025, 0.68, 1.54, 5.05, 3, 5);
    q.rect(C.white, 0, 6.9, 4.05, 8.2); q.shade(0, 6.9, 4.05, 0.07); q.rect(C.whiteShade, 0, 7.35, 4.05, 7.43); q.rect(C.whiteShade, 0, 7.85, 4.05, 7.9);
  }, 'lmU-kkT2');
  /** tower tier 3: one face of the octagon 2.2 m x 7.4 m (y 28.9 .. 36.3): arched window, entablature, the attic with a green panel */
  const kkT3 = bay(128, 512, 2.2, 7.4, (q) => {
    q.rect(C.kk, 0, 0, 2.2, 7.4);
    q.rect(C.white, 0, 0, 0.16, 7.4); q.rect(C.white, 2.04, 0, 2.2, 7.4); q.rect(C.white, 0, 0, 2.2, 0.3);
    q.arch(C.white, 1.1, 0.55, 1.2, 3.15); q.archWin(1.1, 0.7, 0.94, 2.95, 2, 3); q.rect(C.white, 0.16, 4.3, 2.04, 4.5);
    q.rect(C.white, 0, 5.0, 2.2, 6.2); q.shade(0, 5.0, 2.2, 0.06); q.rect(C.whiteShade, 0, 5.65, 2.2, 5.71);
    q.rect(C.white, 0, 6.2, 2.2, 7.4); q.rect(C.kk, 0.4, 6.45, 1.8, 7.05); q.rect(C.whiteShade, 0, 7.3, 2.2, 7.4);
  }, 'lmU-kkT3');
  /** lantern face 0.75 m x 2.2 m */
  const kkLant = bay(64, 128, 0.75, 2.2, (q) => { q.rect(C.white, 0, 0, 0.75, 2.2); q.rect(C.kk, 0.1, 0.1, 0.65, 0.55); q.rect(C.kk, 0.1, 0.7, 0.65, 1.85); q.win(0.22, 0.78, 0.53, 1.78, 2, 3); }, 'lmU-kkLant');
  /** the annex on Tamozhenny pereulok: bay 3.6 m x 15.5 m, yellow, rusticated ground floor, arched first-floor windows, brown frames */
  const kkAnnex = bay(256, 1024, 3.6, 15.5, (q) => {
    q.rect(C.annex, 0, 0, 3.6, 15.5); q.rect(C.annexRust, 0, 0, 3.6, 5.0); q.joints('#bfa655', 0, 0.9, 3.6, 5.0, 0.52); q.rect('#8f8a80', 0, 0, 3.6, 0.9);
    q.rect(C.white, 0, 4.95, 3.6, 5.2); q.shade(0, 4.95, 3.6);
    q.arch(C.white, 1.8, 1.5, 1.7, 3.3); q.archWin(1.8, 1.6, 1.4, 2.5, 2, 2, C.frameBrown);
    q.rect(C.white, 1.0, 6.1, 2.6, 9.5); q.arch(C.white, 1.8, 6.1, 1.9, 8.7); q.archWin(1.8, 6.3, 1.4, 3.1, 2, 3, C.frameBrown);
    q.rect(C.white, 0, 10.2, 3.6, 10.4);
    q.rect(C.white, 1.02, 11.1, 2.58, 13.6); q.win(1.15, 11.2, 2.45, 13.5, 2, 3, C.frameBrown);
    q.rect(C.white, 0, 14.5, 3.6, 15.5); q.shade(0, 14.5, 3.6, 0.06);
  }, 'lmU-kkAnnex');

  // ------------------------------------------------------------------------------------------------ Academy of Sciences, Museum wing
  const AH = 17.3;
  /** Academy bay bw x 17.3 m: the granite storey 0..2.8 with a small window, two tall plain windows on white sill bands, the white frieze band, the modillion cornice */
  const acBay = (bw, tag) => bay(256, 1024, bw, AH, (q) => {
    const cx = bw / 2, g = q.g;
    q.rect(C.ac, 0, 0, bw, AH);
    q.rect(C.granite, 0, 0, bw, 2.8); q.joints('#6f6462', 0, 0, bw, 2.8, 0.56, 0.03); for (let x = 0.4; x < bw; x += 1.1) q.rect('#6f6462', x, 0, x + 0.025, 2.8);
    q.rect('#7c706d', 0, 0, bw, 0.3); q.rect('#e9e4d6', cx - 0.62, 1.05, cx + 0.62, 2.15); q.win(cx - 0.52, 1.13, cx + 0.52, 2.07, 2, 2);
    q.rect(C.white, 0, 2.8, bw, 3.0); q.shade(0, 2.8, bw);
    q.rect(C.white, 0, 3.42, bw, 3.6); q.shade(0, 3.42, bw); q.rect('#d9c98f', cx - 0.72, 3.6, cx + 0.72, 6.7); q.win(cx - 0.62, 3.6, cx + 0.62, 6.6, 2, 4);
    q.rect(C.white, 0, 8.7, bw, 8.95); q.shade(0, 8.7, bw);
    q.rect(C.white, 0, 10.02, bw, 10.2); q.shade(0, 10.02, bw); q.rect('#d9c98f', cx - 0.72, 10.2, cx + 0.72, 13.5); q.win(cx - 0.62, 10.2, cx + 0.62, 13.4, 2, 4);
    q.rect(C.white, 0, 15.0, bw, 15.22); q.shade(0, 15.0, bw);
    q.rect(C.white, 0, 16.25, bw, AH); q.shade(0, 16.25, bw, 0.06);
    g.fillStyle = '#b9b5a8'; for (let x = 0.12; x < bw; x += 0.5) g.fillRect(q.X(x), q.Y(16.85), 0.26 * q.sx, 0.3 * q.sy);
    q.rect(C.whiteShade, 0, 16.5, bw, 16.56);
  }, 'lmU-acBay' + tag);
  /** Museum wing bay 3.9 m x 13.5 m: rusticated ground floor with a round-arched window under a lion mask, the first-floor window in an arched niche over a balustrade, mezzanine window */
  const mwBay = bay(256, 1024, 3.9, 13.5, (q) => {
    const cx = 1.95, g = q.g;
    q.rect(C.mw, 0, 0, 3.9, 13.5);
    q.rect(C.mwRust, 0, 0, 3.9, 4.9); q.joints('#b9a877', 0, 0.8, 3.9, 4.9, 0.5, 0.04); for (const x of [0.02, 1.0, 2.9, 3.86]) q.rect('#b9a877', x, 0.8, x + 0.03, 4.9);
    q.rect('#8f8a80', 0, 0, 3.9, 0.8);
    q.arch(C.white, cx, 1.2, 2.0, 2.9); q.archWin(cx, 1.3, 1.6, 2.5, 2, 2, '#e9e5d8');
    q.oval(C.white, cx, 4.25, 0.34, 0.4); q.oval('#d5d0c2', cx, 4.2, 0.2, 0.24); q.rect('#8a857a', cx - 0.12, 4.22, cx - 0.05, 4.3); q.rect('#8a857a', cx + 0.05, 4.22, cx + 0.12, 4.3);   // the lion mask
    q.rect(C.white, 0, 4.9, 3.9, 5.2); q.shade(0, 4.9, 3.9);
    q.arch(C.white, cx, 5.2, 2.5, 8.5); q.arch(C.mw, cx, 5.2, 2.14, 8.5);
    q.rect(C.white, cx - 1.07, 5.2, cx + 1.07, 6.05); g.fillStyle = '#b5b0a2'; for (let x = cx - 0.95; x < cx + 0.9; x += 0.24) g.fillRect(q.X(x), q.Y(5.92), 0.1 * q.sx, 0.6 * q.sy);
    q.rect(C.white, cx - 0.78, 6.05, cx + 0.78, 9.25); q.win(cx - 0.62, 6.15, cx + 0.62, 9.1, 2, 4); q.rect(C.white, cx - 0.95, 9.25, cx + 0.95, 9.42);
    q.rect(C.white, 0, 10.5, 3.9, 10.68); q.shade(0, 10.5, 3.9);
    q.rect(C.white, cx - 0.72, 10.95, cx + 0.72, 12.15); q.win(cx - 0.6, 11.05, cx + 0.6, 12.05, 2, 2);
    q.rect(C.white, 0, 12.6, 3.9, 13.5); q.shade(0, 12.6, 3.9, 0.06); g.fillStyle = '#b9b5a8'; for (let x = 0.1; x < 3.9; x += 0.5) g.fillRect(q.X(x), q.Y(13.15), 0.26 * q.sx, 0.28 * q.sy);
  }, 'lmU-mwBay');
  const modil = tex.draw(64, 32, (g, w, h) => { g.fillStyle = '#d6d6d2'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4f2ea'; g.fillRect(10, 5, 22, 22); g.fillRect(42, 5, 22, 22); }, { key: 'lmU-modil', repeat: [1, 1] });

  // ------------------------------------------------------------------------------------------------ Twelve Collegia, Rector's wing
  const TH = 15.2;
  /** east-front bay bw x 15.2 m (tc_24): red rusticated ground floor with a round-arched window, giant white pilaster halves over two floors, two eared windows, entablature with a red frieze.
   *  kind: 'win' | 'door' (oak double door in the arch) | 'plain' (no ground-floor window: the ends) */
  const tcBay = (bw, lop, kind, tag) => bay(256, 1024, bw, TH, (q) => {
    const cx = bw / 2, g = q.g;
    q.rect(C.tc, 0, 0, bw, TH);
    q.joints(C.white, 0, 0.35, bw, 3.9, 0.42, 0.04); q.rect(C.tcDark, 0, 0, bw, 0.4);
    if (kind !== 'plain') {
      g.fillStyle = C.white; g.beginPath(); g.moveTo(q.X(cx - 1.5), q.Y(3.85)); g.lineTo(q.X(cx - 0.75), q.Y(2.5)); g.lineTo(q.X(cx + 0.75), q.Y(2.5)); g.lineTo(q.X(cx + 1.5), q.Y(3.85)); g.closePath(); g.fill();   // the wedge panel over the arch
      q.arch(C.white, cx, 0.75, 2.2, 2.55);
      if (kind === 'door') { q.arch(C.door, cx, 0.4, 1.9, 2.55); q.rect(C.doorDark, cx - 0.03, 0.4, cx + 0.03, 2.6); q.rect(C.doorDark, cx - 0.95, 2.52, cx + 0.95, 2.6); for (const s of [-0.48, 0.48]) { q.rect(C.doorDark, cx + s - 0.3, 0.65, cx + s + 0.3, 1.35); q.rect(C.doorDark, cx + s - 0.3, 1.5, cx + s + 0.3, 2.35); } }
      else q.archWin(cx, 0.9, 1.9, 2.7, 3, 2);
      q.rect(C.white, cx - 0.14, 3.55, cx + 0.14, 3.9);
    }
    q.rect(C.white, 0, 3.9, bw, 4.18); q.shade(0, 3.9, bw);
    for (const [a, b2] of [[0, lop], [bw - lop, bw]]) { q.rect(C.white, a, 4.18, b2, 13.7); q.rect(C.whiteShade, a, 4.62, b2, 4.68); q.rect(C.whiteShade, a, 13.2, b2, 13.26); }
    q.rect(C.line, lop, 4.18, lop + 0.03, 13.7); q.rect('rgba(90,30,30,0.35)', bw - lop - 0.04, 4.18, bw - lop, 13.7);
    q.eared(C.white, cx - 0.68, 5.35, cx + 0.68, 7.95, 0.2, { cap: 0.22, foot: true }); q.win(cx - 0.68, 5.35, cx + 0.68, 7.95, 2, 3);
    q.rect(C.white, cx - 0.72, 8.55, cx + 0.72, 9.1);
    q.eared(C.white, cx - 0.68, 9.75, cx + 0.68, 12.05, 0.2, { cap: 0.2, foot: true }); q.win(cx - 0.68, 9.75, cx + 0.68, 12.05, 2, 3);
    q.rect(C.white, 0, 13.7, bw, 14.1); q.shade(0, 13.7, bw, 0.05); q.rect(C.white, 0, 14.62, bw, TH); q.shade(0, 14.62, bw, 0.05); q.rect(C.whiteShade, 0, 14.9, bw, 14.95);
  }, 'lmU-tcBay-' + kind + tag);
  /** the broad pier between two sections: 1.4 m x 15.2 m, paired pilasters, a white blind niche on the ground floor */
  const tcPier = bay(128, 1024, 1.4, TH, (q) => {
    q.rect(C.tc, 0, 0, 1.4, TH); q.joints(C.white, 0, 0.35, 1.4, 3.9, 0.42, 0.04); q.rect(C.tcDark, 0, 0, 1.4, 0.4);
    q.arch(C.white, 0.7, 0.8, 0.86, 2.6); q.arch('#e6e2d8', 0.7, 0.86, 0.7, 2.58);
    q.rect(C.white, 0, 3.9, 1.4, 4.18); q.rect(C.white, 0.05, 4.18, 0.62, 13.7); q.rect(C.white, 0.78, 4.18, 1.35, 13.7); q.rect(C.whiteShade, 0, 4.62, 1.4, 4.68);
    q.rect(C.white, 0, 13.7, 1.4, 14.1); q.rect(C.white, 0, 14.62, 1.4, TH); q.rect(C.whiteShade, 0, 14.9, 1.4, 14.95);
  }, 'lmU-tcPier');
  /** the west gallery: bay 3.6 m x 8.5 m: the open arcade (a dark arch between red banded piers), the glazed corridor above (white, flat pilasters, a round-headed window) */
  const tcGal = bay(256, 512, 3.6, 8.5, (q) => {
    q.rect(C.tc, 0, 0, 3.6, 4.0); q.joints(C.white, 0, 0.3, 3.6, 4.0, 0.42, 0.045);
    q.arch('#3a2f30', 1.8, 0, 2.5, 2.3); q.arch('#5a4644', 1.8, 0, 2.5, 0.9); q.g.strokeStyle = C.white; q.g.lineWidth = 4; q.g.beginPath(); q.g.ellipse(q.X(1.8), q.Y(2.3), 1.3 * q.sx, 1.3 * q.sy, 0, Math.PI, 0, false); q.g.stroke();
    q.rect(C.white, 0, 4.0, 3.6, 8.5); q.shade(0, 4.0, 3.6); q.rect(C.line, 0, 4.25, 3.6, 4.29);
    q.rect('#e7e3d9', 0.5, 4.3, 3.1, 7.7); q.rect(C.line, 0.48, 4.3, 0.5, 7.7); q.rect(C.line, 3.1, 4.3, 3.12, 7.7);
    q.archWin(1.8, 4.75, 1.7, 2.75, 3, 3); q.rect(C.line, 0, 7.72, 3.6, 7.76); q.rect(C.whiteShade, 0, 8.2, 3.6, 8.26);
  }, 'lmU-tcGal');
  /** the west wall of the main block above the gallery roof: bay 3.6 m x 5.8 m (y 9.4 .. 15.2) */
  const tcWest = bay(256, 256, 3.6, 5.8, (q) => {
    q.rect(C.tc, 0, 0, 3.6, 5.8); q.rect(C.white, 1.02, 0.9, 2.58, 3.5); q.win(1.14, 1.0, 2.46, 3.4, 2, 3);
    q.rect(C.white, 0, 4.5, 3.6, 4.9); q.rect(C.white, 0, 5.3, 3.6, 5.8); q.rect(C.whiteShade, 0, 5.55, 3.6, 5.6);
  }, 'lmU-tcWest');
  /** Rector's wing bay 4.0 m x 9.8 m: two floors, white lopatki halves, windows in white frames */
  const reBay = bay(256, 512, 4.0, 9.8, (q) => {
    q.rect(C.tc, 0, 0, 4.0, 9.8); q.rect(C.tcDark, 0, 0, 4.0, 0.7); q.rect(C.white, 0, 0.7, 4.0, 0.86);
    q.rect(C.white, 0, 0.86, 0.48, 8.6); q.rect(C.white, 3.52, 0.86, 4.0, 8.6); q.rect(C.line, 0.48, 0.86, 0.51, 8.6);
    q.rect(C.white, 0, 4.55, 4.0, 4.78); q.shade(0, 4.55, 4.0);
    q.eared(C.white, 1.35, 1.6, 2.65, 3.8, 0.2, { foot: true }); q.win(1.35, 1.6, 2.65, 3.8, 2, 3);
    q.eared(C.white, 1.35, 5.5, 2.65, 7.9, 0.2, { cap: 0.2, foot: true }); q.win(1.35, 5.5, 2.65, 7.9, 2, 3);
    q.rect(C.white, 0, 8.6, 4.0, 9.8); q.shade(0, 8.6, 4.0, 0.05); q.rect(C.tc, 0, 9.0, 4.0, 9.3); q.rect(C.whiteShade, 0, 9.55, 4.0, 9.6);
  }, 'lmU-reBay');
  /** Palace of Peter II: bay 3.4 m x 15 m: three floors (the two-storey wings use v 0 .. 9.8 / 15), pale green, white lopatki halves, white frames */
  const p2Bay = bay(256, 1024, 3.4, 15, (q) => {
    q.rect(C.p2, 0, 0, 3.4, 15); q.rect('#a3b79f', 0, 0, 3.4, 0.8); q.rect(C.white, 0, 0.8, 3.4, 0.95);
    q.rect(C.white, 0, 0.95, 0.42, 14.0); q.rect(C.white, 2.98, 0.95, 3.4, 14.0); q.rect(C.line, 0.42, 0.95, 0.45, 14.0); q.rect('rgba(70,90,70,0.3)', 2.95, 0.95, 2.98, 14.0);
    q.eared(C.white, 1.1, 1.7, 2.3, 3.9, 0.18, { foot: true }); q.win(1.1, 1.7, 2.3, 3.9, 2, 3);
    q.rect(C.white, 0, 4.6, 3.4, 4.85); q.shade(0, 4.6, 3.4);
    q.eared(C.white, 1.1, 5.6, 2.3, 8.2, 0.18, { cap: 0.2, foot: true }); q.win(1.1, 5.6, 2.3, 8.2, 2, 3);
    q.rect(C.white, 0, 9.35, 3.4, 9.8); q.shade(0, 9.35, 3.4, 0.05);
    q.eared(C.white, 1.1, 10.6, 2.3, 12.9, 0.18, { foot: true }); q.win(1.1, 10.6, 2.3, 12.9, 2, 3);
    q.rect(C.white, 0, 14.0, 3.4, 15); q.shade(0, 14.0, 3.4, 0.05); q.rect(C.whiteShade, 0, 14.55, 3.4, 14.6);
  }, 'lmU-p2Bay');
  /** Novobirzhevoy Gostiny Dvor: bay 4.0 m x 14.5 m: the open arcade (a dark arch on rusticated piers), a round-headed window in an arched niche, the small third-floor window of 1936 */
  const gdBay = bay(256, 1024, 4.0, 14.5, (q) => {
    q.rect(C.gd, 0, 0, 4.0, 14.5);
    q.rect(C.gdRust, 0, 0, 4.0, 5.4); q.joints('#aba07a', 0, 0.6, 4.0, 5.4, 0.5, 0.045); for (const x of [0.03, 0.72, 3.25, 3.94]) q.rect('#aba07a', x, 0.6, x + 0.03, 3.4); q.rect('#8f8a80', 0, 0, 4.0, 0.6);
    q.arch('#40382f', 2.0, 0, 2.6, 3.3); q.arch('#d9cfae', 2.0, 0, 1.5, 2.0); q.arch('#3a3028', 2.0, 0, 1.1, 1.75); q.rect('#6b6558', 0.7, 0, 3.3, 0.12);
    q.g.strokeStyle = '#e9e3d0'; q.g.lineWidth = 3; q.g.beginPath(); q.g.ellipse(q.X(2.0), q.Y(3.3), 1.3 * q.sx, 1.3 * q.sy, 0, Math.PI, 0, false); q.g.stroke();
    q.rect(C.white, 0, 5.4, 4.0, 5.7); q.shade(0, 5.4, 4.0);
    q.arch(C.white, 2.0, 6.2, 2.3, 8.6); q.arch(C.gd, 2.0, 6.2, 1.98, 8.6); q.rect(C.white, 1.0, 6.2, 3.0, 6.36); q.archWin(2.0, 6.5, 1.4, 2.9, 2, 3);
    q.rect(C.white, 0, 10.5, 4.0, 10.85); q.shade(0, 10.5, 4.0, 0.05);
    q.rect(C.white, 1.28, 11.5, 2.72, 12.9); q.win(1.4, 11.6, 2.6, 12.8, 2, 2);
    q.rect(C.white, 0, 13.7, 4.0, 14.5); q.shade(0, 13.7, 4.0, 0.05); q.rect(C.whiteShade, 0, 14.1, 4.0, 14.15);
  }, 'lmU-gdBay');
  /** the shop wall inside the arcade of the Gostiny Dvor: bay 4.0 m x 5.2 m, cream, a door with a fanlight or a window by turns (two bays per tile would need 8 m: one door per bay) */
  const gdBack = bay(256, 256, 4.0, 5.2, (q) => {
    q.rect('#efe6c8', 0, 0, 4.0, 5.2); q.rect('#b9b29a', 0, 0, 4.0, 0.5);
    q.arch(C.white, 2.0, 0, 2.0, 2.9); q.arch(C.door, 2.0, 0, 1.6, 2.2); q.rect(C.doorDark, 1.97, 0, 2.03, 2.25); q.rect(C.white, 1.2, 2.2, 2.8, 2.32);
    q.g.save(); q.g.beginPath(); q.g.ellipse(q.X(2.0), q.Y(2.32), 0.8 * q.sx, 0.8 * q.sy, 0, Math.PI, 0, false); q.g.closePath(); q.g.clip(); q.rect('#33414f', 1.1, 2.32, 2.9, 3.2); q.rect(C.white, 1.98, 2.32, 2.02, 3.2); q.g.restore();
  }, 'lmU-gdBack');
  const gdRustTex = tex.draw(64, 64, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#d6cfb8'; g.fillRect(0, 0, w, 4); g.fillRect(0, 32, w, 4); g.fillRect(0, 0, 3, 32); g.fillRect(32, 32, 3, 32); }, { key: 'lmU-gdRust', repeat: [1, 1] });
  const tcRustTex = tex.draw(64, 64, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4d9d2'; g.fillRect(0, 0, w, 5); g.fillRect(0, 32, w, 5); }, { key: 'lmU-tcRust', repeat: [1, 1] });

  Object.assign(M, {
    tc: plain(C.tc, 'tc'), tcBay: bayMat(tcBay(3.1, 0.45, 'win', 'B'), 'tcBay'), tcBayR: bayMat(tcBay(4.17, 0.5, 'win', 'R'), 'tcBayR'), tcDoorR: bayMat(tcBay(4.17, 0.5, 'door', 'R'), 'tcDoorR'),
    tcPier: bayMat(tcPier, 'tcPier'), tcGal: bayMat(tcGal, 'tcGal'), tcWest: bayMat(tcWest, 'tcWest'), reBay: bayMat(reBay, 'reBay'),
    tcRoof: T(C.tcRoof, { map: seam, name: 'lmU-tcRoof', paint: 0.03 }), tcWall: T(C.tc, { map: tcRustTex, name: 'lmU-tcWall', paint: 0.03 }), rectorRoof: T(C.rectorRoof, { map: seam, name: 'lmU-rectorRoof', paint: 0.04 }),
    p2: plain(C.p2, 'p2'), p2Bay: bayMat(p2Bay, 'p2Bay'), p2Roof: T(C.p2Roof, { map: seam, name: 'lmU-p2Roof', paint: 0.04 }), gd: plain(C.gd, 'gd'), gdBay: bayMat(gdBay, 'gdBay'), gdBack: bayMat(gdBack, 'gdBack'), gdRust: T(C.gdRust, { map: gdRustTex, name: 'lmU-gdRust', paint: 0.03 }), gdIn: plain('#efe6c8', 'gdIn'),
    ac: plain(C.ac, 'ac'), acBay4: bayMat(acBay(4.0, '4'), 'acBay4'), acBay5: bayMat(acBay(5.0, '5'), 'acBay5'), acRoof: T(C.acRoof, { map: seam, name: 'lmU-acRoof', paint: 0.06 }), acChimney: plain(C.chimney, 'acChimney'),
    mw: plain(C.mw, 'mw'), mwBay: bayMat(mwBay, 'mwBay'), modil: T('#ffffff', { map: modil, name: 'lmU-modil', paint: 0.01 }),
    white: plain(C.white, 'white', { paint: 0.02 }), whiteShade: plain(C.whiteShade, 'whiteShade', { paint: 0.02 }), soffit: plain('#cdd2da', 'soffit', { paint: 0.02 }),
    iron: T(C.iron, { name: 'lmU-iron' }), glass: plain('#2e3c46', 'glass', { paint: 0.02 }), door: plain(C.door, 'door'),
    kk: plain(C.kk, 'kk'), kkSocle: plain(C.kkSocle, 'kkSocle'), kkRoof: T(C.kkRoof, { map: seam, name: 'lmU-kkRoof', paint: 0.03 }), kkChimney: plain(C.kk, 'kkChimney'),
    kkBayP: bayMat(kkBay('win', 3.02, 0.45, 'P'), 'kkBayP'), kkDoorP: bayMat(kkBay('door', 3.02, 0.45, 'P'), 'kkDoorP'), kkBayM: bayMat(kkBay('win', 3.6, 0.75, 'M'), 'kkBayM'),
    kkBayE: bayMat(kkBay('win', 4.4, 0.6, 'E'), 'kkBayE'), kkBlindE: bayMat(kkBay('blind', 4.4, 0.6, 'E'), 'kkBlindE'), kkCentre: bayMat(kkCentre, 'kkCentre'),
    whiteBand: T(C.white, { map: band2, name: 'lmU-whiteBand', paint: 0.02 }),
    kkT1: bayMat(kkT1, 'kkT1'), kkT2: bayMat(kkT2, 'kkT2'), kkT3: bayMat(kkT3, 'kkT3'), kkLant: bayMat(kkLant, 'kkLant'), kkAnnex: bayMat(kkAnnex, 'kkAnnex'),
    annex: plain(C.annex, 'annex'), dome: T(C.dome, { name: 'lmU-dome', paint: 0.09 }), skirt: T(C.skirt, { map: seam, name: 'lmU-skirt', paint: 0.05 }),
    gold: T(C.gold, { name: 'lmU-gold', paint: 0.03, emissive: '#6a4a08', emissiveIntensity: 0.35 }),
    balus: T(C.white, { map: balus, alphaTest: 0.5, side: 'double', name: 'lmU-balus', paint: 0.02 }),
    ironwork: T(C.iron, { map: ironwork, alphaTest: 0.5, side: 'double', name: 'lmU-ironwork', paint: 0.0 }),
    pickets: T(C.iron, { map: pickets, alphaTest: 0.5, side: 'double', name: 'lmU-pickets', paint: 0.0 }),
    granite: T(C.granite, { map: ashlar, name: 'lmU-granite', paint: 0.03 }), granitePlain: plain(C.granite, 'graniteP'), graniteDark: plain(C.graniteDark, 'graniteD'),
    limestone: T(C.limestone, { map: ashlar, name: 'lmU-limestone', paint: 0.03 }), slab: T(C.slab, { map: slabs, name: 'lmU-slab', paint: 0.05, polygonOffset: -3 }),
    lawn: T(C.lawn, { map: grass, name: 'lmU-lawn', paint: 0.06, polygonOffset: -1 }),
    redGranite: T(C.redGranite, { name: 'lmU-redGranite', paint: 0.07 }), redGraniteDark: plain(C.redGraniteDark, 'redGraniteD'), boulder: T(C.boulder, { name: 'lmU-boulder', paint: 0.1 }),
    bronze: plain(C.bronze, 'bronze', { paint: 0.06 }),
  });
  M.tex = { seam, ashlar, slabs, grass };
  M.bay = bay; M.bayMat = bayMat; M.plain = plain;
  M.cutouts = new Set([M.balus, M.ironwork, M.pickets]);
  M.decals = new Set();
  return M;
}
