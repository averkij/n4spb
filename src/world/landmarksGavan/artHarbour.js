// landmarksGavan/artHarbour.js - textures of Galerny Harbour (docs/research/gavan.md sections 7.3-7.7; photos refs/gavan 31 33 34 39 40 41 42 44 49 50 51 55): the yellow works house (pilaster bays with round-headed
// windows), the guardhouse windows (dark red frames, 2022 state), the brick water tower (shaft face with recessed panels and three window tiers, plain brick, green construction netting, weathered boards), rough stone.
// The wall panels carry the wall colour as background (no alpha) except the netting (alpha cut-out).  Keys 'lmgavan-'.
export function artHarbour(ctx, A, H) {
  const { D, R, speckle, C, TAU } = H;
  const px = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

  // ------------------------------------------------------------------------------------------ the pedimented works house: one bay 4.6 x 6.7 m (40 px / m)
  A.worksFacade = D(184, 268, (g, w, h) => {
    const m = 40, Y = (v) => h - v * m;
    px(g, 0, 0, w, h, '#e6d28a'); speckle(g, w, h, 9301, 160, 0.05);
    px(g, 0, Y(0.5), w, 0.5 * m, '#9a978c'); px(g, 0, Y(0.52), w, 3, 'rgba(0,0,0,0.25)');
    px(g, 0, Y(6.7), w, 0.5 * m, '#f2eee2'); px(g, 0, Y(6.25), w, 3, 'rgba(0,0,0,0.18)');                      // cornice band
    px(g, 0, 0, 0.28 * m, h, '#f2eee2'); px(g, w - 0.28 * m, 0, 0.28 * m, h, '#f2eee2');                        // pilaster strips (half at each edge: one 0.56 m strip per joint)
    const cx = w / 2, ww = 1.3 * m, y0 = Y(1.6), y1 = Y(4.0);
    g.fillStyle = '#f2eee2'; g.beginPath(); g.moveTo(cx - ww / 2 - 7, y0 + 5); g.lineTo(cx + ww / 2 + 7, y0 + 5); g.lineTo(cx + ww / 2 + 7, y1); g.arc(cx, y1, ww / 2 + 7, 0, Math.PI, true); g.closePath(); g.fill();
    g.fillStyle = '#3a4448'; g.beginPath(); g.moveTo(cx - ww / 2, y0); g.lineTo(cx + ww / 2, y0); g.lineTo(cx + ww / 2, y1); g.arc(cx, y1, ww / 2, 0, Math.PI, true); g.closePath(); g.fill();
    g.fillStyle = 'rgba(150,175,190,0.22)'; g.fillRect(cx - ww / 2 + 3, y1 - ww / 2 + 4, ww * 0.35, y0 - y1 + ww / 2 - 10);
    g.fillStyle = '#f2eee2'; g.fillRect(cx - 1.5, y1 - ww / 2, 3, y0 - y1 + ww / 2); for (let k = 1; k < 5; k++) g.fillRect(cx - ww / 2, y1 + (y0 - y1) * k / 5, ww, 2.4);
  }, 'worksFacade');
  A.worksEnd = D(128, 128, (g, w, h) => { px(g, 0, 0, w, h, '#e6d28a'); speckle(g, w, h, 9302, 160, 0.05); px(g, 0, h - 14, w, 14, '#9a978c'); }, 'worksEnd');
  A.pedWindow = D(128, 80, (g, w, h) => {                                   // the tympanum window (semicircular head 1.8 x 0.9 m) on the pediment field
    px(g, 0, 0, w, h, '#f2eee2');
    g.fillStyle = '#d6cfba'; g.fillRect(0, 0, w, 3); g.fillStyle = '#3a4448'; g.beginPath(); g.moveTo(w * 0.14, h); g.arc(w / 2, h, w * 0.36, Math.PI, 0); g.closePath(); g.fill();
    g.fillStyle = '#f2eee2'; for (let i = 1; i < 7; i++) { const a = Math.PI + Math.PI * i / 7; g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w / 2 + Math.cos(a) * w * 0.36, h + Math.sin(a) * w * 0.36); g.lineWidth = 2; g.strokeStyle = '#f2eee2'; g.stroke(); }
  }, 'pedWindow');

  // ------------------------------------------------------------------------------------------ the guardhouse: yellow plaster, white trim, DARK RED window frames (photo 55)
  const gardWall = '#e8da93', gardTrim = '#f3f0e6', gardRed = '#9c2f2a';
  A.gardArch = D(128, 256, (g, w, h) => {                                    // ground-floor arched window panel 1.8 x 3.6 m (71 px / m): white archivolt with keystone, opening 1.2 wide
    const m = w / 1.8; px(g, 0, 0, w, h, gardWall);
    g.fillStyle = gardTrim; g.beginPath(); g.moveTo(0, h); g.lineTo(w, h); g.lineTo(w, h - 2.7 * m); g.arc(w / 2, h - 2.7 * m, w / 2, 0, Math.PI, true); g.closePath(); g.fill();
    const ow = 1.2 * m; g.fillStyle = '#323c40'; g.beginPath(); g.moveTo(w / 2 - ow / 2, h - 0.25 * m); g.lineTo(w / 2 + ow / 2, h - 0.25 * m); g.lineTo(w / 2 + ow / 2, h - 2.7 * m); g.arc(w / 2, h - 2.7 * m, ow / 2, 0, Math.PI, true); g.closePath(); g.fill();
    g.strokeStyle = gardRed; g.lineWidth = 3; g.stroke(); g.fillStyle = gardRed; g.fillRect(w / 2 - 1.5, 6, 3, h - 6 - 0.25 * m); for (let k = 1; k < 5; k++) g.fillRect(w / 2 - ow / 2, h - 0.25 * m - (2.7 * m - 0.25 * m) * k / 5, ow, 2.2);
    g.fillStyle = '#e9e4d4'; g.fillRect(w / 2 - 6, 4, 12, 0.35 * m);                                              // keystone
  }, 'gardArch');
  A.gardRect = D(128, 192, (g, w, h) => {                                    // upper-floor window panel 1.7 x 2.55 m (75 px / m): white surround, small cap, frame dark red
    const m = w / 1.7; px(g, 0, 0, w, h, gardWall);
    px(g, 0.2 * m, 0.3 * m, 1.3 * m, 2.1 * m, gardTrim); px(g, 0.1 * m, 0.1 * m, 1.5 * m, 0.22 * m, gardTrim);
    px(g, 0.35 * m, 0.55 * m, 1.0 * m, 1.75 * m, '#323c40'); g.fillStyle = gardRed; g.fillRect(0.35 * m, 0.55 * m, 1.0 * m, 3); g.fillRect(0.35 * m, 2.3 * m - 3, 1.0 * m, 3); g.fillRect(0.35 * m, 0.55 * m, 3, 1.75 * m); g.fillRect(1.35 * m - 3, 0.55 * m, 3, 1.75 * m); g.fillRect(0.85 * m - 1.5, 0.55 * m, 3, 1.75 * m);
    g.fillRect(0.35 * m, 1.1 * m, 1.0 * m, 2.2);
  }, 'gardRect');
  A.gardDoor = D(128, 224, (g, w, h) => {                                    // glazed arched door 1.5 x 3.2 m behind the portico: dark brown frames
    const m = w / 1.5; px(g, 0, 0, w, h, '#d9c88a');
    g.fillStyle = '#4a3a30'; g.beginPath(); g.moveTo(0.05 * m, h); g.lineTo(1.45 * m, h); g.lineTo(1.45 * m, 1.6 * m); g.arc(0.75 * m, 1.6 * m, 0.7 * m, 0, Math.PI, true); g.closePath(); g.fill();
    g.fillStyle = '#2d363a'; g.fillRect(0.2 * m, 1.4 * m, 1.1 * m, h - 1.4 * m - 0.9 * m); g.beginPath(); g.moveTo(0.2 * m, 1.6 * m); g.arc(0.75 * m, 1.6 * m, 0.55 * m, Math.PI, 0); g.closePath(); g.fill();
    g.fillStyle = '#4a3a30'; g.fillRect(0.75 * m - 1.5, 0.3 * m, 3, h); for (let k = 1; k < 5; k++) g.fillRect(0.2 * m, 0.9 * m + k * 0.5 * m, 1.1 * m, 2.4);
  }, 'gardDoor');
  A.gardWall = D(128, 128, (g, w, h) => { px(g, 0, 0, w, h, gardWall); speckle(g, w, h, 9311, 160, 0.05); }, 'gardWall');

  // ------------------------------------------------------------------------------------------ the water tower: dark brick, recessed panels, window tiers, netting, boards
  A.brickDark = D(256, 256, (g, w, h) => {                                    // dark red-brown brick (tile 2.4 m, 0.075 m courses: 32 rows)
    px(g, 0, 0, w, h, '#4e2f27'); const r = R(9321);
    for (let k = 0; k < 32; k++) { const y = k * 8, off = (k % 2) * 16; for (let i = -1; i < 9; i++) { const v = 0.82 + r() * 0.36; g.fillStyle = `rgb(${72 * v | 0},${42 * v | 0},${33 * v | 0})`; g.fillRect(i * 32 + off + 1, y + 1, 30, 6); } }
    speckle(g, w, h, 9322, 240, 0.08);
  }, 'brickDark');
  A.towerShaft = D(128, 256, (g, w, h) => {                                   // the shaft face 4.4 x 8.4 m (29 px / m): brick, lighter recessed panels, three window tiers, a corbel band at the top
    const m = w / 4.4, Y = (v) => h - v * m * 0.992; px(g, 0, 0, w, h, '#58352b'); const r = R(9331);
    for (let k = 0; k < 72; k++) { const y = k * 3.5, off = (k % 2) * 6; for (let i = -1; i < 12; i++) { const v = 0.85 + r() * 0.3; g.fillStyle = `rgb(${77 * v | 0},${45 * v | 0},${35 * v | 0})`; g.fillRect(i * 12 + off + 0.5, y + 0.5, 11, 2.6); } }
    for (const [v0, v1] of [[0.4, 3.0], [3.3, 5.8], [6.1, 8.0]]) { g.fillStyle = 'rgba(190,140,110,0.34)'; g.fillRect(0.35 * m, Y(v1), w - 0.7 * m, (v1 - v0) * m); g.strokeStyle = 'rgba(30,16,12,0.5)'; g.lineWidth = 1.5; g.strokeRect(0.35 * m, Y(v1), w - 0.7 * m, (v1 - v0) * m); }
    for (const sill of [1.8, 4.4, 6.6]) for (const cx of [1.25, 3.15]) { const x = cx * m - 0.4 * m, y = Y(sill + 1.5); g.fillStyle = '#e8e2d2'; g.fillRect(x - 3, y - 3, 0.8 * m + 6, 1.5 * m + 6); g.fillStyle = '#242c30'; g.fillRect(x, y, 0.8 * m, 1.5 * m); g.fillStyle = '#e8e2d2'; g.fillRect(x + 0.4 * m - 1, y, 2, 1.5 * m); }
    g.fillStyle = '#6a3b2a'; g.fillRect(0, Y(8.4), w, 0.4 * m); for (let i = 0; i < 12; i++) { g.fillStyle = '#7b4a38'; g.beginPath(); g.arc(i * w / 12 + w / 24, Y(8.0), w / 30, 0, Math.PI); g.fill(); }
  }, 'towerShaft');
  A.towerBoards = D(128, 128, (g, w, h) => {                                  // weathered grey-brown boards, vertical
    px(g, 0, 0, w, h, '#a0937a'); const r = R(9341); for (let i = 0; i < 10; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '60,48,34' : '230,220,200'},${0.12 + r() * 0.1})`; g.fillRect(i * w / 10, 0, w / 10, h); g.fillStyle = 'rgba(40,30,20,0.5)'; g.fillRect(i * w / 10, 0, 1.5, h); }
  }, 'towerBoards');
  A.towerNet = D(128, 128, (g, w, h) => {                                     // green construction netting: a fine diamond weave, alpha cut-out (the windows show through)
    g.clearRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 3.2;
    for (let i = -h; i < w + h; i += 11) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i + h, 0); g.lineTo(i, h); g.stroke(); }
  }, 'towerNet');
  A.towerWin = D(64, 96, (g, w, h) => { px(g, 0, 0, w, h, '#a0937a'); px(g, 5, 5, w - 10, h - 10, '#e8e2d2'); px(g, 11, 11, w - 22, h - 22, '#2b3236'); px(g, w / 2 - 1, 11, 2, h - 22, '#e8e2d2'); }, 'towerWin');
  A.stoneRough = D(256, 256, (g, w, h) => {                                   // rough grey limestone slabs in irregular courses (crane stump)
    px(g, 0, 0, w, h, '#8d8a80'); const r = R(9351); let y = 0;
    while (y < h) { const rh = 26 + r() * 30; let x = -r() * 40; while (x < w) { const cw = 40 + r() * 70, v = 0.85 + r() * 0.3; g.fillStyle = `rgb(${141 * v | 0},${138 * v | 0},${128 * v | 0})`; g.fillRect(x + 1.5, y + 1.5, cw - 3, rh - 3); x += cw; } y += rh; }
    speckle(g, w, h, 9352, 300, 0.1);
  }, 'stoneRough');
  void C; void TAU;
}
