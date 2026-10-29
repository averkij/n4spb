// landmarksGavan/artTown.js - textures of the GAVAN WORKERS' TOWN (docs/research/gavan.md section 8; photos refs/gavan 62-98): the bay tiles of the five slabs (red-brick piers + pale plaster panel with a white-framed window; the
// rusticated ground floor with its small high window), plain brick, the green sheet roof, the gable boards, the entrance door, the unplastered annex brick, the club wing face, the big MURAL on the east end wall of block A
// ("Вода - это жизнь", 1990: teal sky, cobalt waves, a seated figure with a fan halo of 15 rays), the plaque of D. A. Dril' (old orthography, as read from photo 82) and the ДЗЮДО sign.  Keys 'lmgavan-'.
export function artTown(ctx, A, H) {
  const { D, R, speckle, F, TAU } = H;
  const px = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const BRICK = '#a6503b', PLASTER = '#c4c9b8', TRIM = '#ece8dc', RUST = '#a39f92';
  const brickFill = (g, w, h, seed, base = BRICK, course = 7, bw = 17) => {                   // English-bond-like brick: courses of `course` px, bricks `bw` px, a little noise
    px(g, 0, 0, w, h, base); const r = R(seed);
    for (let k = 0; k < Math.ceil(h / course); k++) { const y = k * course, off = (k % 2) * bw / 2; g.fillStyle = 'rgba(40,16,10,0.35)'; g.fillRect(0, y, w, 1); for (let x = -bw; x < w + bw; x += bw) { g.fillRect(x + off, y, 1, course); const v = r(); g.fillStyle = v < 0.3 ? 'rgba(255,200,170,0.10)' : v < 0.6 ? 'rgba(60,20,10,0.12)' : 'rgba(0,0,0,0)'; g.fillRect(x + off + 1, y + 1, bw - 2, course - 1); } }
  };

  // ------------------------------------------------------------------------------------------ upper floors: one bay 3.1 m x one storey 3.375 m (40 px / m)
  A.townUp = D(124, 135, (g, w, h) => {
    const m = 40; brickFill(g, w, h, 9401, BRICK, 6, 16);
    px(g, 0.55 * m, 0, 2.0 * m, h, PLASTER); speckle(g, w, h, 9402, 120, 0.05);
    g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(0.55 * m, 0, 2.0 * m, 3);                      // the plaster band under the floor line
    g.fillStyle = 'rgba(70,60,50,0.22)'; g.fillRect(0.55 * m, h - 0.0, 2.0 * m, 0);
    const wx = 0.95 * m, ww = 1.2 * m, wy = 0.8 * m, wh = 1.7 * m;
    px(g, wx - 5, (h - wy - wh) - 5, ww + 10, wh + 10, TRIM);                                           // the white surround
    g.fillStyle = '#2d363a'; g.fillRect(wx, (h - wy - wh), ww, wh);
    g.fillStyle = 'rgba(150,175,190,0.25)'; g.fillRect(wx + 3, (h - wy - wh) + 3, ww * 0.3, wh * 0.45);
    g.fillStyle = TRIM; g.fillRect(wx + ww / 2 - 1.2, (h - wy - wh), 2.4, wh); g.fillRect(wx, (h - wy - wh) + wh * 0.28, ww, 2.4);   // casement muntins, a 3-pane top light
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(wx, (h - wy - wh), ww, 2);
    px(g, wx - 8, h - wy + 3, ww + 16, 5, TRIM);                                                       // the sill
    px(g, wx - 5, (h - wy - wh) - 9, ww + 10, 4, TRIM);                                                  // the lintel
  }, 'townUp');
  A.townGF = D(124, 180, (g, w, h) => {                                                               // the rusticated ground floor 4.5 m (40 px / m): grey cement-stucco, grooves every 0.45 m, a small high window
    const m = 40; px(g, 0, 0, w, h, RUST); const r = R(9411);
    for (let k = 0; k < 10; k++) { g.fillStyle = 'rgba(60,56,48,0.4)'; g.fillRect(0, k * 0.45 * m, w, 2); g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(0, k * 0.45 * m + 2, w, 3); }
    speckle(g, w, h, 9412, 200, 0.07); void r;
    const wx = 1.1 * m, ww = 0.9 * m, wy = 1.4 * m, wh = 1.3 * m, Y = (v) => h - v * m;
    px(g, wx - 5, (h - wy - wh) - 5, ww + 10, wh + 10, TRIM); g.fillStyle = '#2d363a'; g.fillRect(wx, (h - wy - wh), ww, wh);
    g.fillStyle = TRIM; g.fillRect(wx + ww / 2 - 1.2, (h - wy - wh), 2.4, wh); g.fillRect(wx, (h - wy - wh) + wh * 0.3, ww, 2.4);
    px(g, 0, Y(0.5), w, 0.5 * m, '#8e8a7e');                                                          // the plinth
  }, 'townGF');
  A.townBrick = D(256, 256, (g, w, h) => { brickFill(g, w, h, 9421, BRICK, 10, 26); speckle(g, w, h, 9422, 200, 0.06); }, 'townBrick');
  A.annexBrick = D(256, 256, (g, w, h) => { brickFill(g, w, h, 9423, '#b88a6a', 10, 26); speckle(g, w, h, 9424, 200, 0.06); }, 'annexBrick');
  A.townPlaster = D(128, 128, (g, w, h) => { px(g, 0, 0, w, h, PLASTER); speckle(g, w, h, 9431, 160, 0.05); }, 'townPlaster');
  A.roofGreen = D(256, 256, (g, w, h) => {                                                            // green sheet roof, standing seams every 0.6 m (tile 2.4 m wide)
    px(g, 0, 0, w, h, '#3a9560'); for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(20,70,40,0.5)'; g.fillRect(i * 64, 0, 3, h); g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(i * 64 + 3, 0, 3, h); } speckle(g, w, h, 9441, 200, 0.07);
  }, 'roofGreen');
  A.gableBoards = D(128, 128, (g, w, h) => {                                                          // the gable tympanum: vertical dark boards
    px(g, 0, 0, w, h, '#6f4636'); const r = R(9451); for (let i = 0; i < 12; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,220,190' : '30,12,6'},${0.06 + r() * 0.08})`; g.fillRect(i * w / 12, 0, w / 12, h); g.fillStyle = 'rgba(25,10,5,0.5)'; g.fillRect(i * w / 12, 0, 1.5, h); }
  }, 'gableBoards');
  A.townDoor = D(64, 128, (g, w, h) => {                                                              // an entrance door 1.4 x 2.3 m with a transom (dark brown)
    px(g, 0, 0, w, h, '#4a3022'); px(g, 5, 8, w - 10, h * 0.2, '#2a3236'); g.fillStyle = '#6a4a35'; g.fillRect(w / 2 - 1, 8, 2, h - 8); g.fillRect(5, h * 0.3, w - 10, 2);
    g.fillStyle = '#5a3c2a'; g.fillRect(8, h * 0.36, w / 2 - 12, h * 0.56); g.fillRect(w / 2 + 4, h * 0.36, w / 2 - 12, h * 0.56);
  }, 'townDoor');
  A.clubFace = D(256, 256, (g, w, h) => {                                                             // the club wing: plaster with red-brick bands (tile 4 m)
    px(g, 0, 0, w, h, '#d9d3b8'); speckle(g, w, h, 9461, 200, 0.05); px(g, 0, h * 0.12, w, 10, BRICK); px(g, 0, h * 0.62, w, 10, BRICK); px(g, 0, h * 0.64 + 14, w, 3, 'rgba(60,40,30,0.4)');
  }, 'clubFace');
  A.clubWin = D(96, 160, (g, w, h) => {                                                               // a tall window 1.25 x 1.85 m in a plain surround on the club face
    px(g, 0, 0, w, h, '#d9d3b8'); px(g, 6, 6, w - 12, h - 12, TRIM); px(g, 14, 14, w - 28, h - 28, '#2d363a'); g.fillStyle = TRIM; g.fillRect(w / 2 - 1.5, 14, 3, h - 28); g.fillRect(14, h * 0.3, w - 28, 3);
  }, 'clubWin');
  A.annexWin = D(96, 180, (g, w, h) => {                                                              // an arched window 1.3 x 2.4 m on the unplastered annex brick (bay-window face)
    brickFill(g, w, h, 9462, '#b88a6a', 8, 20); const cx = w / 2;
    g.fillStyle = TRIM; g.beginPath(); g.moveTo(cx - 36, h - 14); g.lineTo(cx + 36, h - 14); g.lineTo(cx + 36, 56); g.arc(cx, 56, 36, 0, Math.PI, true); g.closePath(); g.fill();
    g.fillStyle = '#2d363a'; g.beginPath(); g.moveTo(cx - 28, h - 20); g.lineTo(cx + 28, h - 20); g.lineTo(cx + 28, 56); g.arc(cx, 56, 28, 0, Math.PI, true); g.closePath(); g.fill();
    g.fillStyle = TRIM; g.fillRect(cx - 1.5, 28, 3, h - 48); g.fillRect(cx - 28, h * 0.5, 56, 3);
  }, 'annexWin');
  A.judoSign = D(256, 64, (g, w, h) => {
    px(g, 0, 0, w, h, '#1f2326'); g.strokeStyle = '#c9c4b0'; g.lineWidth = 3; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#f0ecda'; g.font = `bold 40px ${F ? F.sans : 'sans-serif'}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ДЗЮДО', w / 2, h / 2 + 2);
  }, 'judoSign');
  A.plaqueDril = D(256, 340, (g, w, h) => {                                                           // white marble 0.55 x 0.7 m, black incised capitals (as read from photo 82)
    px(g, 0, 0, w, h, '#dcdad2'); g.strokeStyle = '#7a786f'; g.lineWidth = 5; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#1c1c1c'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const lines = [['ГАВАНЬСКIЙ', 24], ['РАБОЧIЙ ГОРОДОКЪ', 18], ['ВОЗВЕДЕНЪ', 18], ['ТРУДАМИ УЧРЕДИТЕЛЯ', 14], ['«ТОВАРИЩЕСТВА БОРЬБЫ', 14], ['СЪ ЖИЛИЩНОЙ НУЖДОЙ»', 14], ['ДМИТРIЕМЪ АНДРЕЕВИЧЕМЪ', 12], ['ДРИЛЬ', 30], ['ВЪ 1904.1905.1906 ГОДАХЪ', 13]];
    let y = 40; for (const [t, s] of lines) { g.font = `bold ${s}px ${F ? F.serif : 'serif'}`; g.fillText(t, w / 2, y); y += s + 15; }
  }, 'plaqueDril');

  // ------------------------------------------------------------------------------------------ the mural on the east end wall of block A: 11.4 x 21 m (22.5 px / m)
  A.mural = D(256, 472, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#3fa7a0'); sky.addColorStop(0.5, '#6cc3bd'); sky.addColorStop(0.78, '#bfe3e6'); sky.addColorStop(1, '#2f5fb5'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    const r = R(9471);
    // soft cloud wisps and a pale disc behind the figure
    for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.ellipse(r() * w, h * (0.05 + r() * 0.35), 30 + r() * 40, 7 + r() * 8, 0, 0, TAU); g.fill(); }
    const cx = w / 2, cy = h * 0.4;
    g.fillStyle = 'rgba(245,235,200,0.5)'; g.beginPath(); g.arc(cx, cy, 98, 0, TAU); g.fill();
    // the fan halo: 15 rays, orange-red and yellow
    for (let i = 0; i < 15; i++) { const a = Math.PI * (0.06 + 0.88 * i / 14) + Math.PI, a0 = a - 0.09, a1 = a + 0.09; g.fillStyle = i % 3 === 0 ? '#c8372d' : i % 3 === 1 ? '#e8742c' : '#f0c43a'; g.beginPath(); g.moveTo(cx, cy + 20); g.arc(cx, cy + 20, 150, a0, a1); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(cx + Math.cos(a) * 146, cy + 20 + Math.sin(a) * 146, 5, 0, TAU); g.fill(); }
    g.fillStyle = '#4a9b4a'; for (let i = 0; i < 9; i++) { const a = Math.PI * (0.1 + 0.8 * i / 8) + Math.PI; g.beginPath(); g.ellipse(cx + Math.cos(a) * 158, cy + 20 + Math.sin(a) * 158, 11, 5, a, 0, TAU); g.fill(); }   // green leaves on top
    // the seated figure: head, closed eyes, robe, folded hands
    g.fillStyle = '#e8c3a6'; g.beginPath(); g.ellipse(cx, cy - 12, 26, 32, 0, 0, TAU); g.fill();
    g.fillStyle = '#3a2a22'; g.beginPath(); g.ellipse(cx, cy - 36, 28, 15, 0, Math.PI, TAU); g.fill(); g.fillRect(cx - 28, cy - 38, 7, 34); g.fillRect(cx + 21, cy - 38, 7, 34);
    g.strokeStyle = '#3a2a22'; g.lineWidth = 2.5; g.beginPath(); g.arc(cx - 10, cy - 14, 6, 0.1, Math.PI - 0.1); g.stroke(); g.beginPath(); g.arc(cx + 10, cy - 14, 6, 0.1, Math.PI - 0.1); g.stroke(); g.beginPath(); g.moveTo(cx - 7, cy + 2); g.quadraticCurveTo(cx, cy + 7, cx + 7, cy + 2); g.stroke();
    g.fillStyle = '#f2ead2'; g.beginPath(); g.moveTo(cx - 28, cy + 18); g.quadraticCurveTo(cx - 80, cy + 60, cx - 94, cy + 150); g.lineTo(cx + 94, cy + 150); g.quadraticCurveTo(cx + 80, cy + 60, cx + 28, cy + 18); g.closePath(); g.fill();
    g.fillStyle = '#d9c9a0'; g.beginPath(); g.moveTo(cx - 40, cy + 40); g.quadraticCurveTo(cx, cy + 62, cx + 40, cy + 40); g.lineTo(cx + 30, cy + 70); g.lineTo(cx - 30, cy + 70); g.closePath(); g.fill();
    g.fillStyle = '#e8c3a6'; g.beginPath(); g.ellipse(cx, cy + 82, 24, 11, 0, 0, TAU); g.fill();
    // two small cherub-like figures left and right at mid height, the tree trunk behind
    for (const sx of [-1, 1]) { const x = cx + sx * 96, y = cy + 120; g.fillStyle = '#e8c3a6'; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); g.fillStyle = '#f6f2e6'; g.beginPath(); g.ellipse(x + sx * 12, y + 2, 14, 6, sx * 0.4, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x, y + 18, 8, 12, 0, 0, TAU); g.fill(); }
    // the sea: cobalt waves with white crests and fish / dolphin forms in the lowest 4 m
    const sy = h * 0.78; g.fillStyle = '#2f5fb5'; g.fillRect(0, sy, w, h - sy);
    for (let k = 0; k < 6; k++) { const y = sy + 6 + k * 15; g.strokeStyle = k % 2 ? '#f0f6fb' : '#7fa8e0'; g.lineWidth = 4; g.beginPath(); for (let x = -10; x < w + 10; x += 6) { const yy = y + Math.sin(x * 0.07 + k) * 4; if (x === -10) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); }
    g.fillStyle = '#e8f1fa'; for (const x of [50, 150, 215]) { g.beginPath(); g.ellipse(x, sy + 36 + (x % 3) * 8, 17, 6, -0.3, 0, TAU); g.fill(); g.beginPath(); g.moveTo(x + 14, sy + 33); g.lineTo(x + 26, sy + 26); g.lineTo(x + 24, sy + 38); g.closePath(); g.fill(); }
  }, 'mural');
}
