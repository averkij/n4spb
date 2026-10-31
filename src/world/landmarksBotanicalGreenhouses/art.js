// landmarksBotanicalGreenhouses/art.js - the canvas paintings of the module (dossier docs/research/aptekarsky-2026.md 4.1a, 4.1c, 7; photos 04 08 10 12 (Palm House), 24 (Great Subtropical),
// 33 30 (vestibule), 35 36 (museum), F1 (aerial of the belt)).  EVERY picture is ONE tile that is mapped once per quad with uv inside [0,1]: the engine (core/batch2.js) packs such
// textures into its 4096 atlas pages, so all the glass bays, window bays and roof tiles of the module share a few page materials (the draw-call plan of the dossier, 4.1c).
//   glassWall  2.0 x 4.4 m   vertical iron-and-glass wall: mullion every 1.0 m, transom every 2.2 m, X-bracing in the lower bay, glazing bars in the upper one, dark interior in the panes
//   glassRoof  2.0 x 2.4 m   sloping glass roof: rafters every 0.67 m (along the slope), cross bars, sky glint
//   win        3.0 x 3.0 m   stucco bay with one tall window (cream wall, white frame, dark glass)   brickWin  3.0 x 3.9 m  the same in red brick (the tower of house 12)
//   tin        2.4 x 2.4 m   standing-seam tin roof (4 seams)           railing  1.8 x 1.0 m  white cast-iron roof railing with the arch pattern (alpha)
//   museum     4.15 x 12 m   one bay of the Botanical Museum: three windows, white pilasters, the relief panel under the lowest window   museumDoor  the bay with the door (5th of 9)
//   portal     3.7 x 4.9 m   the east portal of the Palm House (1899): pilasters with shells, oval-headed door, "1899" panel
//   vestWin    1.6 x 3.9 m   tall wooden door-window of the vestibule rotunda     festoon  2.4 x 0.8 m  swags between rosettes     oak  1.5 x 3.3 m  the arched window with the oak-leaf frame
// Every key starts with 'lmgh-' (the texture cache is scene-wide).
const TAU = Math.PI * 2;
export const COL = {
  iron: '#dfe4e3', ironDark: '#6f7a74', cream: '#eddfae', creamLight: '#f4ecd0', white: '#f0eadb', stone: '#b6a78a', stoneDark: '#8f8574', tin: '#b4bec0', tinDark: '#8d999c',
  brick: '#a9573f', brickDark: '#7d3d2d', copper: '#8a5a3c', wood: '#5a3a26', woodWarm: '#6a4a32', portal: '#e8dcb0', ochre: '#dcae68', granite: '#5d5f63', white2: '#f3efe3',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {};
  const D = (w, h, fn, key) => tex.draw(w, h, fn, { key: 'lmgh-' + key });
  const R = (seed) => ctx.rng(seed);

  // ------------------------------------------------------------------------------------------ glass
  A.glassWall = D(192, 422, (g, w, h) => {
    const r = R(9001), pw = w / 2, th = h / 2;
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#a3b9bb'); gr.addColorStop(0.5, '#7f9a9a'); gr.addColorStop(1, '#5e7a78');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 2; k++) for (let i = 0; i < 2; i++) {                                 // the dark interior shows through the panes: plant masses, bracing shadows
      const x = i * pw, y = k * th;
      g.fillStyle = `rgba(36,52,44,${0.18 + r() * 0.22})`; g.fillRect(x + 4, y + 8 + r() * th * 0.3, pw - 8, th * (0.35 + r() * 0.4));
      g.fillStyle = 'rgba(210,228,230,0.22)'; g.beginPath(); g.moveTo(x + pw * 0.15, y + 6); g.lineTo(x + pw * 0.62, y + 6); g.lineTo(x + pw * 0.15, y + th * 0.55); g.fill();   // sky glint
    }
    const iron = '#e8ecec', shade = 'rgba(70,84,84,0.55)';
    // photos 04 / 12: very tall slender verticals about every 0.5 m, sparse transoms, X-bracing only in alternate bays (lower half left bay, upper half right bay)
    g.fillStyle = 'rgba(70,84,84,0.4)'; for (const x of [w / 4, 3 * w / 4]) g.fillRect(x + 1, 0, 2, h);
    g.fillStyle = 'rgba(224,232,232,0.75)'; for (const x of [w / 4, 3 * w / 4]) g.fillRect(x - 1, 0, 3, h);
    const xb = (x0, y0, y1, lw) => { g.strokeStyle = shade; g.lineWidth = lw + 1.2; g.beginPath(); g.moveTo(x0 + 6, y0); g.lineTo(x0 + pw - 6, y1); g.moveTo(x0 + pw - 6, y0); g.lineTo(x0 + 6, y1); g.stroke();
      g.strokeStyle = iron; g.lineWidth = lw; g.beginPath(); g.moveTo(x0 + 6, y0); g.lineTo(x0 + pw - 6, y1); g.moveTo(x0 + pw - 6, y0); g.lineTo(x0 + 6, y1); g.stroke(); };
    xb(0, th + 10, h - 10, 2.2); xb(pw, 10, th - 10, 1.8);
    g.strokeStyle = 'rgba(214,224,224,0.5)'; g.lineWidth = 1.2; for (const y of [th * 0.5, th + th * 0.5]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }   // an intermediate glazing bar
    g.fillStyle = shade; for (const y of [0, th, h - 4]) g.fillRect(0, y + 6, w, 3);       // transoms (shadow edge, then the white bar)
    g.fillStyle = iron; for (const y of [0, th]) g.fillRect(0, y, w, 6); g.fillRect(0, h - 5, w, 5);
    g.fillStyle = shade; for (const x of [0, pw]) g.fillRect(x + 5, 0, 2, h); g.fillRect(w - 7, 0, 2, h);
    g.fillStyle = iron; g.fillRect(0, 0, 5, h); g.fillRect(pw - 3, 0, 6, h); g.fillRect(w - 5, 0, 5, h);   // mullions at both tile edges (half each) and in the middle
  }, 'glassWall');

  A.glassRoof = D(192, 230, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#5a7882'); gr.addColorStop(0.45, '#30464f'); gr.addColorStop(1, '#46636c');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(190,214,222,0.30)'; g.beginPath(); g.moveTo(w * 0.1, 0); g.lineTo(w * 0.55, 0); g.lineTo(w * 0.2, h); g.lineTo(0, h); g.fill();
    g.fillStyle = 'rgba(20,34,40,0.35)'; g.fillRect(w * 0.42, h * 0.12, w * 0.18, h * 0.5);
    g.fillStyle = 'rgba(30,44,50,0.5)'; for (const x of [0, w / 3, 2 * w / 3, w - 3]) g.fillRect(x + 3, 0, 3, h);
    g.fillStyle = '#e1e8e8'; for (const x of [0, w / 3, 2 * w / 3]) g.fillRect(x, 0, 5, h); g.fillRect(w - 5, 0, 5, h);            // rafters
    g.fillStyle = '#cdd8d8'; g.fillRect(0, 0, w, 4); g.fillRect(0, h / 2 - 1, w, 3); g.fillRect(0, h - 4, w, 4);                     // cross bars
  }, 'glassRoof');

  // ------------------------------------------------------------------------------------------ stucco bays
  const winBay = (g, w, h, wall, frame, glass, lintel) => {
    g.fillStyle = wall; g.fillRect(0, 0, w, h);
    const r = R(9010);
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,250,230' : '120,104,70'},${0.03 + r() * 0.05})`; g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 26, 4 + r() * 16, r() * 3, 0, TAU); g.fill(); }
  };
  const window1 = (g, x, y, ww, hh, frame, glass) => {
    g.fillStyle = frame; g.fillRect(x - 5, y - 5, ww + 10, hh + 10);
    const gr = g.createLinearGradient(x, y, x + ww, y + hh); gr.addColorStop(0, '#5b6a73'); gr.addColorStop(0.5, '#2f3a42'); gr.addColorStop(1, '#505e68');
    g.fillStyle = gr; g.fillRect(x, y, ww, hh);
    g.fillStyle = 'rgba(190,210,222,0.22)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + ww * 0.7, y); g.lineTo(x, y + hh * 0.5); g.fill();
    g.fillStyle = frame; g.fillRect(x + ww / 2 - 2, y, 4, hh); g.fillRect(x, y + hh * 0.34, ww, 4);
  };
  A.win = D(240, 240, (g, w, h) => {
    winBay(g, w, h, '#f4eedc');
    const ww = 96, hh = 150, x = (w - ww) / 2, y = h - 38 - hh;
    g.fillStyle = 'rgba(120,104,70,0.22)'; g.fillRect(x - 12, y - 16, ww + 24, 7);                           // lintel shadow
    window1(g, x, y, ww, hh, '#fbf8ef');
    g.fillStyle = '#fbf8ef'; g.fillRect(x - 10, y + hh + 5, ww + 20, 7); g.fillStyle = 'rgba(100,88,60,0.35)'; g.fillRect(x - 10, y + hh + 12, ww + 20, 3);       // sill
  }, 'win');

  A.brickWin = D(240, 304, (g, w, h) => {
    g.fillStyle = '#b25f46'; g.fillRect(0, 0, w, h);
    const r = R(9020);
    for (let j = 0; j < 38; j++) for (let i = -1; i < 10; i++) {                                            // courses of 0.1 m, bricks 0.25 m, running bond
      const x = i * 26 + (j % 2) * 13, y = j * 8, v = 0.88 + r() * 0.24;
      g.fillStyle = `rgb(${178 * v | 0},${92 * v | 0},${68 * v | 0})`; g.fillRect(x + 1, y + 1, 24, 6);
    }
    for (let k = 0; k < 4; k++) { const ww = 78, hh = 132, x = (w - ww) / 2, y = 304 - (k + 1) * 76 - hh * 0 - 4; if (k > 0) continue; }
    const ww = 84, hh = 140, x = (w - ww) / 2, y = 82;
    g.fillStyle = '#e9dcc0'; g.fillRect(x - 6, y - 8, ww + 12, hh + 14); window1(g, x, y, ww, hh, '#f3ead0');
    g.fillStyle = '#e9dcc0'; g.fillRect(x - 10, y + hh + 6, ww + 20, 7);
  }, 'brickWin');

  A.tin = D(128, 128, (g, w, h) => {
    const r = R(9030);
    g.fillStyle = '#eef1f1'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      const x = i * 32, v = 0.93 + r() * 0.1; g.fillStyle = `rgba(${210 * v | 0},${218 * v | 0},${220 * v | 0},0.55)`; g.fillRect(x, 0, 32, h);
      g.fillStyle = 'rgba(70,82,88,0.55)'; g.fillRect(x, 0, 3, h); g.fillStyle = 'rgba(255,255,255,0.65)'; g.fillRect(x + 3, 0, 2, h);
    }
    g.fillStyle = 'rgba(70,82,88,0.15)'; g.fillRect(0, h * 0.55, w, 2);
  }, 'tin');

  // ------------------------------------------------------------------------------------------ ironwork (alpha)
  A.railing = D(230, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff'; g.lineCap = 'round';
    g.lineWidth = 9; g.beginPath(); g.moveTo(0, 8); g.lineTo(w, 8); g.stroke();                              // top rail
    g.lineWidth = 7; g.beginPath(); g.moveTo(0, h - 8); g.lineTo(w, h - 8); g.stroke();                      // bottom rail
    g.lineWidth = 3.5; const n = 8, pw = w / n;
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(Math.min(w - 2, Math.max(2, i * pw)), 8); g.lineTo(Math.min(w - 2, Math.max(2, i * pw)), h - 8); g.stroke(); }          // balusters
    for (let i = 0; i < n; i++) {                                                                             // arch pattern: a loop between each pair of balusters
      g.lineWidth = 3; g.beginPath(); g.arc(i * pw + pw / 2, h * 0.62, pw / 2 - 2, Math.PI, 0, false); g.stroke();
      g.beginPath(); g.arc(i * pw + pw / 2, h * 0.34, 4, 0, TAU); g.fill();
    }
  }, 'railing');

  // ------------------------------------------------------------------------------------------ the Botanical Museum bay
  const museumBay = (g, w, h, door) => {
    const r = R(9040);
    g.fillStyle = '#dca75c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,226,160' : '150,100,40'},${0.04 + r() * 0.06})`; g.beginPath(); g.ellipse(r() * w, r() * h, 8 + r() * 30, 6 + r() * 24, r() * 3, 0, TAU); g.fill(); }
    g.fillStyle = '#f2ecdc'; g.fillRect(0, 0, 9, h); g.fillRect(w - 9, 0, 9, h);                                // white pilaster strips between the bays (half each: 0.18 m together)
    g.fillStyle = 'rgba(120,80,30,0.25)'; g.fillRect(9, 0, 2, h); g.fillRect(w - 11, 0, 2, h);
    const m = h / 12, ww = 1.5 * m * (w / (4.15 * m)), x = (w - ww) / 2;
    const win = (y0, y1) => { g.fillStyle = '#f4efe2'; g.fillRect(x - 6, y0 * m - 6, ww + 12, (y1 - y0) * m + 12); const gr = g.createLinearGradient(x, 0, x + ww, 0); gr.addColorStop(0, '#59656d'); gr.addColorStop(1, '#3c474f'); g.fillStyle = gr; g.fillRect(x, y0 * m, ww, (y1 - y0) * m);
      g.fillStyle = '#f4efe2'; g.fillRect(x + ww / 2 - 2, y0 * m, 4, (y1 - y0) * m); for (const t of [0.25, 0.62]) g.fillRect(x, y0 * m + (y1 - y0) * m * t, ww, 3); g.fillStyle = 'rgba(200,215,225,0.2)'; g.fillRect(x, y0 * m, ww * 0.35, (y1 - y0) * m * 0.4); };
    win(1.1, 3.9); win(4.8, 7.4);                                                                               // photo 35: two tall rows, then the relief panel, then the small ground-floor window under it
    if (!door) win(9.4, 11.2);
    else {                                                                                                      // the door in the granite surround
      g.fillStyle = '#4a4c50'; g.fillRect(x - 12, 8.0 * m, ww + 24, h - 8.0 * m);
      g.fillStyle = '#6a4a2e'; g.fillRect(x, 8.5 * m, ww, h - 8.5 * m); g.fillStyle = '#4f3620'; for (let i = 1; i < 4; i++) g.fillRect(x + ww * i / 4 - 1, 8.5 * m, 3, h - 8.5 * m); g.fillRect(x, 8.5 * m + 2 * m, ww, 3);
    }
    if (!door) {                                                                                                // relief panel: cream slab with a botanical motif (leaf pairs, rosette)
      const py = 7.9 * m, ph = 1.3 * m, px = x - 8, pw2 = ww + 16;
      g.fillStyle = '#f1ece0'; g.fillRect(px, py, pw2, ph); g.strokeStyle = 'rgba(120,110,90,0.55)'; g.lineWidth = 2; g.strokeRect(px + 3, py + 3, pw2 - 6, ph - 6);
      g.strokeStyle = 'rgba(150,138,112,0.95)'; g.fillStyle = 'rgba(222,214,194,1)'; g.lineWidth = 2;
      const cx = px + pw2 / 2, cy = py + ph / 2;
      const leaf = (x, y, ang, L) => { g.save(); g.translate(x, y); g.rotate(ang); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.5, -L * 0.28, L, 0); g.quadraticCurveTo(L * 0.5, L * 0.28, 0, 0); g.fill(); g.stroke(); g.beginPath(); g.moveTo(2, 0); g.lineTo(L * 0.85, 0); g.stroke(); g.restore(); };
      for (let k = -1; k <= 1; k += 2) {                                                                      // two sprays of leaves on a curved stem, a flower (rosette) in the middle
        g.beginPath(); g.moveTo(cx + k * ph * 0.2, cy + 2); g.quadraticCurveTo(cx + k * ph * 0.4, cy + ph * 0.12, cx + k * ph * 0.64, cy - 1); g.stroke();
        for (let j = 0; j < 3; j++) { const x = cx + k * (ph * 0.26 + j * ph * 0.17); leaf(x, cy + (j % 2 ? -1 : 1) * 2 + ph * 0.1 * (1 - j * 0.2), k * (-0.55 + j * 0.05) + (j % 2 ? -0.55 : 0.55) * (k > 0 ? 1 : -1), ph * 0.17); }
      }
      for (let t = 0; t < 8; t++) { g.save(); g.translate(cx, cy); g.rotate(t * Math.PI / 4); g.beginPath(); g.ellipse(ph * 0.17, 0, ph * 0.15, ph * 0.07, 0, 0, TAU); g.fill(); g.stroke(); g.restore(); }
      g.beginPath(); g.arc(cx, cy, ph * 0.07, 0, TAU); g.fill(); g.stroke();
    }
  };
  A.museum = D(192, 556, (g, w, h) => museumBay(g, w, h, false), 'museum');
  A.museumDoor = D(192, 556, (g, w, h) => museumBay(g, w, h, true), 'museumDoor');

  // ------------------------------------------------------------------------------------------ the 1899 portal of the Palm House
  A.portal = D(240, 318, (g, w, h) => {
    const r = R(9050);
    g.fillStyle = '#e9dfb8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,250,225' : '150,130,80'},${0.04 + r() * 0.07})`; g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 24, 5 + r() * 20, r() * 3, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(120,100,60,0.0)';
    for (const x0 of [10, w - 52]) {                                                                          // the pilasters with a shell over a garland
      g.fillStyle = '#efe7ca'; g.fillRect(x0, 22, 42, h - 34); g.strokeStyle = 'rgba(130,112,76,0.55)'; g.lineWidth = 2; g.strokeRect(x0, 22, 42, h - 34);
      g.fillStyle = '#f8f3df'; g.strokeStyle = 'rgba(140,120,84,0.8)'; g.beginPath(); g.arc(x0 + 21, 62, 16, Math.PI, 0); g.lineTo(x0 + 37, 80); g.lineTo(x0 + 5, 80); g.closePath(); g.fill(); g.stroke();
      for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(x0 + 21, 80); g.lineTo(x0 + 7 + k * 7, 52); g.stroke(); }
      g.strokeStyle = 'rgba(140,120,84,0.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0 + 5, 98); g.quadraticCurveTo(x0 + 21, 124, x0 + 37, 98); g.stroke();
    }
    g.fillStyle = '#f1e9cf'; g.fillRect(60, 24, w - 120, 38); g.strokeStyle = 'rgba(130,112,76,0.55)'; g.lineWidth = 2; g.strokeRect(60, 24, w - 120, 38);            // the "1899" panel
    g.fillStyle = 'rgba(86,70,48,0.9)'; g.textAlign = 'center'; g.textBaseline = 'middle'; tex.fitText(g, '1899', w / 2, 44, 86, 26, tex.FONTS.serif, 600);
    const dx = 66, dw = w - 132, dy = 74;                                                                       // the oval-headed door in a white frame
    g.fillStyle = '#f7f1dc'; g.beginPath(); g.moveTo(dx - 8, h); g.lineTo(dx - 8, dy + 54); g.arc(w / 2, dy + 54, dw / 2 + 8, Math.PI, 0); g.lineTo(dx + dw + 8, h); g.fill();
    g.fillStyle = '#4c3220'; g.beginPath(); g.moveTo(dx, h); g.lineTo(dx, dy + 54); g.arc(w / 2, dy + 54, dw / 2, Math.PI, 0); g.lineTo(dx + dw, h); g.fill();
    g.fillStyle = '#2f3b44'; g.beginPath(); g.moveTo(dx + 4, dy + 54); g.arc(w / 2, dy + 54, dw / 2 - 4, Math.PI, 0); g.lineTo(dx + dw - 4, dy + 62); g.lineTo(dx + 4, dy + 62); g.fill();      // fanlight
    g.fillStyle = '#5c3b25'; g.fillRect(dx + 4, dy + 66, dw / 2 - 6, h - dy - 70); g.fillRect(dx + dw / 2 + 2, dy + 66, dw / 2 - 6, h - dy - 70);
    g.strokeStyle = '#3a2616'; g.lineWidth = 2.5; for (const x of [dx + 4, dx + dw / 2 + 2]) { g.strokeRect(x + 6, dy + 74, dw / 2 - 18, 76); g.strokeRect(x + 6, dy + 160, dw / 2 - 18, 60); }
    g.strokeStyle = '#3a2616'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, dy + 62); g.lineTo(w / 2, h); g.stroke();
    g.fillStyle = 'rgba(190,176,130,0.55)'; g.fillRect(0, h - 56, 12, 56); g.fillRect(w - 14, h - 40, 14, 40);                  // peeling plaster at the foot
  }, 'portal');

  // ------------------------------------------------------------------------------------------ vestibule rotunda
  A.vestWin = D(128, 300, (g, w, h) => {
    g.fillStyle = '#6a4a32'; g.fillRect(0, 0, w, h);
    const gl = (x, y, ww, hh) => { const gr = g.createLinearGradient(x, y, x + ww, y + hh); gr.addColorStop(0, '#6c7e86'); gr.addColorStop(1, '#3a464e'); g.fillStyle = gr; g.fillRect(x, y, ww, hh); g.fillStyle = 'rgba(210,225,232,0.22)'; g.fillRect(x, y, ww * 0.3, hh * 0.5); };
    gl(8, 8, w - 16, 70);                                                                                       // the transom light
    for (let i = 0; i < 4; i++) gl(8, 92 + i * 52, w / 2 - 12, 46), gl(w / 2 + 4, 92 + i * 52, w / 2 - 12, 46);
    g.fillStyle = '#6a4a32'; g.fillRect(w / 2 - 2, 78, 4, h - 78); g.fillRect(8, 36, w - 16, 3);
    g.fillStyle = 'rgba(30,20,10,0.4)'; g.fillRect(0, h - 22, w, 22);
  }, 'vestWin');

  A.festoon = D(256, 90, (g, w, h) => {
    g.fillStyle = '#efece3'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(140,146,156,0.3)'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4);
    g.strokeStyle = 'rgba(120,126,136,0.85)'; g.fillStyle = 'rgba(250,250,246,1)';
    for (let k = 0; k < 2; k++) {
      const x0 = k * 128 + 14, x1 = (k + 1) * 128 - 14;
      g.lineWidth = 9; g.beginPath(); g.moveTo(x0, 14); g.quadraticCurveTo((x0 + x1) / 2, h * 1.05, x1, 14); g.stroke();
      g.lineWidth = 6; g.strokeStyle = 'rgba(250,250,246,1)'; g.beginPath(); g.moveTo(x0, 14); g.quadraticCurveTo((x0 + x1) / 2, h * 1.05, x1, 14); g.stroke(); g.strokeStyle = 'rgba(120,126,136,0.85)';
      g.beginPath(); g.arc(k * 128 + 128, 16, 10, 0, TAU); g.fill(); g.lineWidth = 2; g.stroke();
    }
  }, 'festoon');

  A.oak = D(150, 330, (g, w, h) => {                                                                            // the round-headed window with the oak-leaf-and-acorn frame (photo 30)
    g.fillStyle = '#f0ebdd'; g.fillRect(0, 0, w, h);
    const r = R(9060), arch = (x0, x1, yTop, yBot, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(x0, yBot); g.lineTo(x0, yTop + (x1 - x0) / 2); g.arc((x0 + x1) / 2, yTop + (x1 - x0) / 2, (x1 - x0) / 2, Math.PI, 0); g.lineTo(x1, yBot); g.fill(); };
    arch(6, w - 6, 8, h - 14, '#e6dfcc');
    g.fillStyle = '#f8f4e8'; g.strokeStyle = 'rgba(120,108,86,0.7)'; g.lineWidth = 1.5;
    for (let t = 0; t < 34; t++) {                                                                              // leaves along the frame (the arch band is 24 px wide)
      let x, y; const s = t / 34;
      if (s < 0.3) { x = 18; y = h - 24 - s / 0.3 * (h - 24 - 8 - (w - 12) / 2); }
      else if (s < 0.7) { const a = Math.PI + (s - 0.3) / 0.4 * Math.PI; x = w / 2 + Math.cos(a) * (w / 2 - 18); y = 8 + (w - 12) / 2 + Math.sin(a) * (w / 2 - 18); }
      else { x = w - 18; y = 8 + (w - 12) / 2 + (s - 0.7) / 0.3 * (h - 24 - 8 - (w - 12) / 2); }
      g.beginPath(); g.ellipse(x, y, 10, 5.5, r() * 3, 0, TAU); g.fill(); g.stroke();
      if (t % 4 === 0) { g.fillStyle = '#d9d2bf'; g.beginPath(); g.arc(x + 4, y + 6, 3, 0, TAU); g.fill(); g.fillStyle = '#f8f4e8'; }
    }
    arch(30, w - 30, 30, h - 28, '#33302b');
    const gl = g.createLinearGradient(0, 0, w, h); gl.addColorStop(0, '#6c8088'); gl.addColorStop(1, '#3c4a52'); g.fillStyle = gl; arch(36, w - 36, 36, h - 34, gl);
    g.strokeStyle = '#1e1b18'; g.lineWidth = 3; for (let i = 0; i < 5; i++) { const x = 40 + i * (w - 80) / 4; g.beginPath(); g.moveTo(x, 40); g.lineTo(x, h - 34); g.stroke(); }
    g.lineWidth = 2.4; for (let k = 0; k < 7; k++) { const y = 120 + k * 26; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(40 + (i + 0.5) * (w - 80) / 4, y, 6.5, 0, TAU * 0.85); g.stroke(); } }
  }, 'oak');
  // ------------------------------------------------------------------------------------------ wall plates (plain wordmarks, real Russian text of the sight; the plates are reserved in ctx.services.labels)
  const plate = (key, l1, l2, l3, bg, fg) => D(256, 128, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 3; g.strokeRect(6, 6, w - 12, h - 12); g.lineWidth = 1.2; g.strokeRect(11, 11, w - 22, h - 22);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    tex.fitText(g, l1, w / 2, h * 0.28, w * 0.84, 26, tex.FONTS.serif, 700); tex.fitText(g, l2, w / 2, h * 0.53, w * 0.84, 22, tex.FONTS.serif, 500);
    if (l3) tex.fitText(g, l3, w / 2, h * 0.78, w * 0.7, 20, tex.FONTS.serif, 500);
  }, key);
  A.plateMuseum = plate('plateMuseum', 'БОТАНИЧЕСКИЙ МУЗЕЙ', 'имени В. Л. Комарова', 'основан в 1823 году', '#3a3d41', '#eeeadf');
  A.platePalm = plate('platePalm', 'ПАЛЬМОВАЯ ОРАНЖЕРЕЯ', 'Большая пальмовая оранжерея', '1896 – 1899', '#2f4a3c', '#f1eddf');
  A.plateVest = plate('plateVest', 'ОРАНЖЕРЕЙНЫЙ КОМПЛЕКС', 'Ботанического сада Петра Великого', 'вход для посетителей', '#2f4a3c', '#f1eddf');
  return A;
}
