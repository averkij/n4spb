// landmarksMarineFacade/art.js - the canvas paintings of the module (docs/research/marinefacade.md sections 4, 5, 6, 7, 8, 17; photos refs/marinefacade alen_01..08, 16, 30, 53, 83, 01).
//   terminals:  the plain side-wall panels (1.2 m fields, a ribbon window band per storey), the timber-slat soffit, the vertical timber-slat screens, the roof membrane, the white name plates
//               «МОРСКОЙ ВОКЗАЛ [N] TERMINAL» (plain wordmark, no logo), tapered concrete is a flat colour.
//   quay:       yellow-black hazard stripes, the guard-rail panel with X bracing and the welded-mesh fence panel (alpha cut-outs), the galvanised ribbed canopy roof.
//   ships:      the hull side with two rows of portholes, the balcony block (white frames + green-grey glass per 3 m cabin bay), the dark-glass variant of liner B.
//   shore:      the helipad (yellow circle + white H on dark asphalt with white corner brackets), the Mayak placeholder bands.
// Every key starts with 'lmmarin-' (the texture cache is scene-wide: a prefix that matches another module silently takes its textures).
const TAU = Math.PI * 2;
export const COL = {
  panel: '#d9dbde', ribbon: '#2f3d52', timber: '#8a5b3a', soffit: '#6b4330', band: '#c9772e', bandShade: '#a05a28', cap: '#dfe2e4', roofTop: '#a9b4ab', pier: '#d6d8d6',
  strut: '#c7cacd', strutShade: '#8f969d', rod: '#7b838b', canopy: '#8d9195', glass: '#6f8da3', mullion: '#9aa3ab', doorFrame: '#5d6670', apron: '#3f4244', berth: '#a8aaa6', hard: '#8f8b84',
  fender: '#2d4fa3', yellow: '#d9b21c', black: '#1c1c1c', mesh: '#b4b8bc', guard: '#aeb3b6', mast: '#bcc0c5', mastHead: '#6e7479', lawn: '#6f8f4a', checkpoint: '#9aa3ab',
  hull: '#f1f1ee', boot: '#23324f', boat: '#f0b030', glassShip: '#8fa8a2', rope: '#8fb2d8', funnel: '#f4f4f2',
  gold: '#c9a43c', goldLit: '#e6c35c', gcWall: '#d8d4ca', gcPilaster: '#c9c6bd', gcGlass: '#3a4a60',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {}, C = COL;
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmmarin-' + key, repeat });
  const R = (seed) => ctx.rng(seed);
  const F = tex.FONTS;
  const speckle = (g, w, h, seed, n, a = 0.1) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,32'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2); } };

  // ------------------------------------------------------------------------------------------ plain side wall: one storey = 4.2 m tall, 4.8 m wide (4 panel fields of 1.2 m); the ribbon window band 1.4 .. 2.6 m
  A.panel = D(256, 224, (g, w, h) => {
    const r = R(9101), ppm = w / 4.8;
    g.fillStyle = '#c9ccd0'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 4; row++) for (let c = 0; c < 4; c++) {
      const v = 0.965 + r() * 0.05; g.fillStyle = `rgb(${217 * v | 0},${219 * v | 0},${222 * v | 0})`; g.fillRect(c * 1.2 * ppm + 1, row * 1.05 * ppm + 1, 1.2 * ppm - 2, 1.05 * ppm - 2);
    }
    // ribbon window band (2 panel rows high would be 2.1 m: the band is 1.2 m tall) with the mullions on the panel joints
    const y0 = h - 2.7 * ppm, y1 = h - 1.5 * ppm;
    g.fillStyle = '#2f3d52'; g.fillRect(0, y0, w, y1 - y0);
    const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(160,190,214,0.55)'); gr.addColorStop(0.45, 'rgba(90,120,150,0.2)'); gr.addColorStop(1, 'rgba(20,28,40,0.2)'); g.fillStyle = gr; g.fillRect(0, y0, w, y1 - y0);
    g.fillStyle = '#9aa3ab'; for (let c = 0; c < 4; c++) g.fillRect(c * 1.2 * ppm - 1.5, y0 - 2, 3, y1 - y0 + 4); g.fillRect(0, y0 - 2, w, 2); g.fillRect(0, y1, w, 2);
    speckle(g, w, h, 9102, 200, 0.05);
  }, 'panel');
  /** timber-slat soffit / screen: slats 0.15 m wide running along u; tile 2 x 2 m */
  A.soffit = D(128, 128, (g, w, h) => {
    const r = R(9111); g.fillStyle = '#4e3022'; g.fillRect(0, 0, w, h);
    const n = 13, sh = h / n;
    for (let i = 0; i < n; i++) { const v = 0.9 + r() * 0.2; g.fillStyle = `rgb(${107 * v | 0},${67 * v | 0},${48 * v | 0})`; g.fillRect(0, i * sh + 1, w, sh - 2); g.fillStyle = 'rgba(255,220,180,0.10)'; g.fillRect(0, i * sh + 1, w, 2); }
  }, 'soffit');
  A.screen = D(64, 128, (g, w, h) => {
    const r = R(9121); g.fillStyle = '#3f2a1c'; g.fillRect(0, 0, w, h);
    const n = 8, sw = w / n;
    for (let i = 0; i < n; i++) { const v = 0.9 + r() * 0.2; g.fillStyle = `rgb(${138 * v | 0},${91 * v | 0},${58 * v | 0})`; g.fillRect(i * sw + 1, 0, sw - 2, h); g.fillStyle = 'rgba(255,230,190,0.12)'; g.fillRect(i * sw + 1, 0, 2, h); }
  }, 'screen');
  /** roof membrane (pale grey-green) with seams every 1 m: tile 2 x 2 m */
  A.roofTop = D(128, 128, (g, w, h) => { g.fillStyle = '#a9b4ab'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(70,80,70,0.28)'; g.fillRect(0, 0, 2, h); g.fillRect(64, 0, 2, h); speckle(g, w, h, 9131, 160, 0.06); }, 'roofTop');
  /** the white name plates 3.9 x 1.2 m for terminals 1-4 in ONE atlas (canvas 640 x 784: plate n is the strip n from the top) «МОРСКОЙ / ВОКЗАЛ», the number in a rounded square, «TERMINAL» */
  A.plates = D(640, 784, (g, w, h) => {
    const rr = (x, y, ww, hh, r) => { g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + ww - r, y); g.quadraticCurveTo(x + ww, y, x + ww, y + r); g.lineTo(x + ww, y + hh - r); g.quadraticCurveTo(x + ww, y + hh, x + ww - r, y + hh); g.lineTo(x + r, y + hh); g.quadraticCurveTo(x, y + hh, x, y + hh - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); };
    for (let n = 1; n <= 4; n++) {
      const oy = (n - 1) * 196;
      g.fillStyle = '#4a4f55'; rr(2, oy + 2, 636, 192, 38); g.fill(); g.fillStyle = '#f4f5f6'; rr(7, oy + 7, 626, 182, 33); g.fill();
      g.fillStyle = '#16191d'; g.textBaseline = 'middle'; g.textAlign = 'left';
      g.font = `700 46px ${F.sans}`; g.fillText('МОРСКОЙ', 34, oy + 62); g.fillText('ВОКЗАЛ', 34, oy + 134);
      g.strokeStyle = '#16191d'; g.lineWidth = 7; rr(306, oy + 48, 100, 100, 22); g.stroke();
      g.textAlign = 'center'; g.font = `800 74px ${F.sans}`; g.fillText(String(n), 356, oy + 100);
      g.textAlign = 'left'; g.font = `700 40px ${F.sans}`; g.fillText('TERMINAL', 424, oy + 100);
    }
  }, 'plates');


  // ------------------------------------------------------------------------------------------ quay and fences
  /** yellow / black diagonal stripes: tile 1.2 x 0.3 m (canvas 256 x 64) */
  A.hazard = D(256, 64, (g, w, h) => {
    g.fillStyle = '#e6c200'; g.fillRect(0, 0, w, h); g.fillStyle = '#1c1c1c';
    for (let x = -h; x < w + h; x += 64) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 32, h); g.lineTo(x + 32 + h, 0); g.lineTo(x + h, 0); g.closePath(); g.fill(); }
  }, 'hazard');
  /** welded mesh fence panel (alpha): 2.5 m x 2.0 m tile, square 5 x 5 cm cells drawn as 8 px cells (readable from 5 m), two horizontal bars */
  A.mesh = D(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#b4b8bc'; g.lineWidth = 2;
    for (let x = 2; x < w; x += 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 2; y < h; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.lineWidth = 6; g.beginPath(); g.moveTo(0, 5); g.lineTo(w, 5); g.moveTo(0, h - 5); g.lineTo(w, h - 5); g.stroke();
  }, 'mesh');
  /** pedestrian guard rail panel (alpha) 2.0 x 1.1 m: two rails and X bracing */
  A.guard = D(256, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#aeb3b6'; g.lineWidth = 6; g.lineCap = 'butt';
    g.beginPath(); g.moveTo(0, 8); g.lineTo(w, 8); g.moveTo(0, h - 10); g.lineTo(w, h - 10); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(6, 8); g.lineTo(w - 6, h - 10); g.moveTo(w - 6, 8); g.lineTo(6, h - 10); g.stroke();
  }, 'guard');
  /** the galvanised ribbed roof of the vehicle checkpoint canopies: tile 3 x 3 m */
  A.rib = D(128, 128, (g, w, h) => { g.fillStyle = '#9aa3ab'; g.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,0.12)' : 'rgba(40,50,60,0.12)'; g.fillRect(i * 8, 0, 8, h); } }, 'rib');
  /** the clear panes of the gallery side + posts: handled by flat colours; the gallery roof is a smooth dark grey metal */
  A.galleryRoof = D(64, 128, (g, w, h) => { g.fillStyle = '#505960'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(200,215,230,0.16)'; g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h); speckle(g, w, h, 9141, 40, 0.05); }, 'galleryRoof');
  /** gallery glazing: clear panes with a faint sky gradient, mullions every 3 m (tile 3 x 2.6 m) */
  A.paneGlass = D(128, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(176,206,226,0.85)'); gr.addColorStop(1, 'rgba(112,142,164,0.8)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(200,205,210,0.9)'; g.fillRect(0, 0, 4, h); g.fillRect(0, h - 5, w, 5); g.fillRect(0, 0, w, 4); }, 'paneGlass');

  // ------------------------------------------------------------------------------------------ the liners
  /** hull side: white plating with two rows of porthole dots at 3.3 m pitch (tile 3.3 m wide x 6.2 m tall: the plating between the boot-top and the lifeboat deck) and faint weld lines */
  A.hull = D(128, 240, (g, w, h) => {
    g.fillStyle = '#f1f1ee'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(120,128,136,0.10)'; g.fillRect(0, h - 3, w, 3); g.fillRect(0, h * 0.5, w, 2);
    g.fillStyle = '#2c3a48'; for (const y of [0.30, 0.66]) { g.beginPath(); g.arc(w / 2, h * y, 11, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(w / 2 - 4, h * y - 4, 4, 3); g.fillStyle = '#2c3a48'; }
    speckle(g, w, h, 9151, 60, 0.04);
  }, 'hull');
  /** balcony cabin block: a white frame and a green-grey glass pane per 3.0 m cabin bay with a rail line (tile 3.0 x 3.06 m) */
  A.balcony = D(128, 128, (g, w, h) => {
    g.fillStyle = '#e9ece8'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#7f9a96'; g.fillRect(8, 16, w - 16, h - 50); const gr = g.createLinearGradient(0, 16, 0, h - 34); gr.addColorStop(0, 'rgba(255,255,255,0.28)'); gr.addColorStop(1, 'rgba(0,0,0,0.12)'); g.fillStyle = gr; g.fillRect(8, 16, w - 16, h - 50);
    g.fillStyle = '#c9d0cc'; g.fillRect(8, h - 36, w - 16, 5); g.fillStyle = '#8a9a98'; g.fillRect(8, h - 30, w - 16, 12);
    g.fillStyle = '#d4dad6'; g.fillRect(w / 2 - 2, 16, 4, h - 50);
  }, 'balcony');
  /** the dark-glass variant (liner B): bands of dark glass with white deck edges, tile 3 x 3.06 m */
  A.balconyDark = D(128, 128, (g, w, h) => {
    g.fillStyle = '#eef0ee'; g.fillRect(0, 0, w, h); g.fillStyle = '#46545a'; g.fillRect(0, 14, w, h - 44);
    const gr = g.createLinearGradient(0, 14, 0, h - 30); gr.addColorStop(0, 'rgba(180,205,220,0.32)'); gr.addColorStop(1, 'rgba(0,0,0,0.18)'); g.fillStyle = gr; g.fillRect(0, 14, w, h - 44);
    g.fillStyle = '#d8dcdc'; g.fillRect(0, h - 32, w, 5); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(w / 2 - 1, 14, 2, h - 44);
  }, 'balconyDark');

  // ------------------------------------------------------------------------------------------ ground marks
  /** the helipad: 28 x 28 m dark asphalt square, yellow ring d 12 m + white H 4 m, four white corner brackets (canvas 512 x 512 = 30 x 30 m) */
  A.helipad = D(512, 512, (g, w, h) => {
    const ppm = w / 30; g.fillStyle = '#4a4c4d'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#e8c21a'; g.lineWidth = 0.9 * ppm; g.beginPath(); g.arc(w / 2, h / 2, 5.6 * ppm, 0, TAU); g.stroke();
    g.fillStyle = '#f2f2ee'; const hh = 3.2 * ppm, ww = 2.4 * ppm, t = 0.55 * ppm; g.fillRect(w / 2 - ww / 2, h / 2 - hh / 2, t, hh); g.fillRect(w / 2 + ww / 2 - t, h / 2 - hh / 2, t, hh); g.fillRect(w / 2 - ww / 2, h / 2 - t / 2, ww, t);
    const b = 5 * ppm, t2 = 0.5 * ppm, m = 1.1 * ppm;
    for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const x = sx ? w - m : m, y = sy ? h - m : m, dx = sx ? -1 : 1, dy = sy ? -1 : 1; g.fillRect(Math.min(x, x + dx * b), y - (dy < 0 ? t2 : 0), b, t2); g.fillRect(x - (dx < 0 ? t2 : 0), Math.min(y, y + dy * b), t2, b); }
    speckle(g, w, h, 9161, 500, 0.05);
  }, 'helipad');
  /** the Mayak placeholder: white body with two dusty-red bands (a lighthouse reading), tile 1 x 6 m */
  A.mayak = D(32, 192, (g, w, h) => { g.fillStyle = '#e9e7df'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8483a'; g.fillRect(0, 40, w, 36); g.fillRect(0, 112, w, 36); }, 'mayak');
  /** granite boulder: grey with speckle */
  A.stone = D(64, 64, (g, w, h) => { g.fillStyle = '#8a7f78'; g.fillRect(0, 0, w, h); speckle(g, w, h, 9171, 140, 0.18); }, 'stone');
  /** brick pavers (red-brown, running bond 20 x 10 cm): the terminal forecourt, tile 3 x 3 m */
  A.pavers = D(256, 256, (g, w, h) => {
    const r = R(9181), ppm = w / 3, pw = 0.2 * ppm, ph = 0.1 * ppm; g.fillStyle = '#6e5a50'; g.fillRect(0, 0, w, h);
    for (let y = 0, row = 0; y < h; y += ph, row++) for (let x = -(row % 2) * pw / 2; x < w; x += pw) { const v = 0.86 + r() * 0.28; g.fillStyle = `rgb(${172 * v | 0},${128 * v | 0},${112 * v | 0})`; g.fillRect(x + 0.4, y + 0.4, pw - 0.8, ph - 0.8); }
  }, 'pavers');
  /** concrete slabs 3 x 3 m with dark joints (berth strip / hardstanding): tile 3 x 3 m */
  A.slabs = D(128, 128, (g, w, h) => { g.fillStyle = '#a8aaa6'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(60,62,60,0.45)'; g.fillRect(0, 0, 2, h); g.fillRect(0, 0, w, 2); speckle(g, w, h, 9191, 120, 0.07); }, 'slabs');
  return A;
}
