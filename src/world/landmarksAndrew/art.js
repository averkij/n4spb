// landmarksAndrew/art.js - canvas paintings of the module, part 1: windows, doors, iron fences / rails (alpha cut-outs), roof sheets, ground surfaces (docs/research/andrew.md sections 3.5, 3.8, 4.4, 5.3, 8.4, 8.5;
// photos refs/andrew 04 26 30 43 63 77 80 82 144 145 147 157 158).  Part 2 (market, pavilion, Pel house, konka, signs) is art2.js.
// EVERY texture key starts with 'lmAnd-' (the texture cache is scene-wide: a prefix that matches another module silently takes its textures).
// Surface tiles are tinted by their material colour (painted light grey / white) and use world-space or metre uv; window sheets span exactly one opening (uv 0..1).
const TAU = Math.PI * 2;
export const COL = {
  rose: '#ecbcad', roseShade: '#cf9f92', peach: '#f3d9b8', white: '#f6f1e8', whiteShade: '#d8d3c6', silver: '#b8bec1', silverDark: '#8c9295', sheet: '#9ea3a6', plinth: '#aaa8a3', gold: '#e0b44a',
  iron: '#1f2220', underside: '#3a4048', door: '#6a4a38', lampGreen: '#2f4a3f',
  fenceWhite: '#dfe3e6', brickRed: '#a45f50', granite: '#a09d98',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {};
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmAnd-' + key, repeat });
  const R = (seed) => ctx.rng(seed);
  const F = tex.FONTS;

  // ---------------------------------------------------------------------------------------------- windows (uv spans the opening)
  /** dark glass with a light muntin grid: cols x rows lights, an arch bar at archFrac from the top, frame colour fc */
  const pane = (key, cols, rows, archFrac = 0, fc = '#efeee6', glass = ['#2d3a4a', '#1b2430']) => D(128, 256, (g, w, h) => {
    const gr0 = g.createLinearGradient(0, 0, 0, h); gr0.addColorStop(0, glass[0]); gr0.addColorStop(1, glass[1]); g.fillStyle = gr0; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, w, h * 0.7); gr.addColorStop(0, 'rgba(150,185,215,0.40)'); gr.addColorStop(0.55, 'rgba(60,90,125,0.05)'); gr.addColorStop(1, 'rgba(20,28,40,0.25)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = fc; const b = 5;
    g.fillRect(0, 0, b, h); g.fillRect(w - b, 0, b, h); g.fillRect(0, h - b, w, b); g.fillRect(0, 0, w, b);
    for (let c = 1; c < cols; c++) g.fillRect(w * c / cols - 2, 0, 4, h);
    for (let r = 1; r < rows; r++) g.fillRect(0, h * r / rows - 1.5, w, 3);
    if (archFrac) g.fillRect(0, h * archFrac - 3, w, 6);
  }, key);
  A.win36 = pane('win36', 3, 6, 0.30); A.win24 = pane('win24', 2, 5, 0.28); A.win12 = pane('win12', 1, 4, 0.30); A.win23 = pane('win23', 2, 3, 0.28);
  A.winBrown = pane('winBrown', 2, 3, 0.3, '#5a3328', ['#26323f', '#141c26']);              // market sashes
  A.winBrownTall = pane('winBrownTall', 2, 4, 0.3, '#4a3326', ['#26323f', '#141c26']);      // Pel house
  A.winGreen = pane('winGreen', 2, 3, 0.3, '#e9efe9', ['#2d3d3f', '#18262a']);               // Annunciation upper windows (white frames)
  /** a window behind an iron grille: dark glass, a fine black lattice, a light frame */
  A.winGrille = D(128, 256, (g, w, h) => {
    g.fillStyle = '#1f252d'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(110,130,150,0.20)'; g.fillRect(0, 0, w, h * 0.45);
    g.strokeStyle = '#0d0f11'; g.lineWidth = 3; const s = 22;
    for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s + h * 0.62, h); g.stroke(); g.beginPath(); g.moveTo(i * s + h * 0.62, 0); g.lineTo(i * s, h); g.stroke(); }
    g.fillStyle = '#0d0f11'; g.fillRect(0, 0, 5, h); g.fillRect(w - 5, 0, 5, h); g.fillRect(0, h - 5, w, 5); g.fillRect(0, 0, w, 6);
  }, 'winGrille');
  /** open belfry bay: very dark with a beam */
  A.dark = D(64, 64, (g, w, h) => { g.fillStyle = '#16191e'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(70,56,44,0.55)'; g.fillRect(0, h * 0.36, w, 4); g.fillRect(0, h * 0.7, w, 4); g.fillStyle = 'rgba(120,100,70,0.5)'; g.fillRect(w * 0.3, 0, 3, h); }, 'dark');
  /** a niche filled in the wall colour (blind arch of the drums and turrets): faint inner shade */
  A.niche = D(64, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(0,0,0,0.28)'); gr.addColorStop(0.35, 'rgba(0,0,0,0.0)'); gr.addColorStop(1, 'rgba(255,255,255,0.05)'); g.clearRect(0, 0, w, h); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 0, w, 4); }, 'niche');

  // ---------------------------------------------------------------------------------------------- doors
  /** double door with a fan light and carved panels: tile = one opening; ground colour col, fan light dark */
  const door = (key, col, panel, fan = 0.2) => D(128, 256, (g, w, h) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h);
    const f = h * fan; g.fillStyle = '#222b36'; g.fillRect(0, 0, w, f);
    g.strokeStyle = '#d8d4c8'; g.lineWidth = 3; for (let i = 0; i <= 7; i++) { g.beginPath(); g.moveTo(w / 2, f); g.lineTo(w * i / 7, 0); g.stroke(); }
    g.fillStyle = '#d8d4c8'; g.fillRect(0, f - 4, w, 5);
    for (let leaf = 0; leaf < 2; leaf++) for (let r = 0; r < 3; r++) {
      const x0 = leaf * w / 2 + 8, y0 = f + 8 + r * (h - f - 16) / 3, pw = w / 2 - 16, ph = (h - f - 16) / 3 - 8;
      g.fillStyle = panel[0]; g.fillRect(x0, y0, pw, ph); g.fillStyle = panel[1]; g.fillRect(x0 + 3, y0 + 3, pw - 6, ph - 6);
    }
    g.fillStyle = '#2a1c12'; g.fillRect(w / 2 - 1.5, f, 3, h - f); g.fillRect(0, h - 3, w, 3);
  }, key);
  A.doorBrown = door('doorBrown', '#6a4a38', ['#3e2a1f', '#7a573f']);                    // cathedral portals: dark wood
  A.doorVarnish = door('doorVarnish', '#c8924e', ['#8a6330', '#d6a560']);                // Annunciation: natural varnish, carved panels
  A.doorGlassAl = D(128, 256, (g, w, h) => {                                                // pavilion: five dark aluminium leaves with glass
    g.fillStyle = '#26313a'; g.fillRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(140,170,190,0.4)'); gr.addColorStop(1, 'rgba(20,30,40,0.2)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#34383b'; for (let i = 0; i <= 5; i++) g.fillRect(i * w / 5 - 2, 0, 4, h); g.fillRect(0, 0, w, 5); g.fillRect(0, h - 6, w, 6); g.fillRect(0, h * 0.4, w, 3);
    g.fillStyle = '#e2b92d'; g.fillRect(0, h * 0.62, w, 6);
  }, 'doorGlassAl');

  // ---------------------------------------------------------------------------------------------- iron fences and rails (alpha cut-outs; tile = one panel unless noted)
  const tipUp = (g, x, y, hw, h) => { g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + hw, y); g.lineTo(x - hw, y); g.closePath(); g.fill(); };
  /** the cathedral fence: light grey-white iron: vertical bars every 0.11 m with a spearhead on every third bar, scrolled volutes in the upper third, a Greek-key band along the bottom (panel 3.4 x 1.75 m) */
  A.fenceCath = D(512, 264, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#dfe3e6'; g.strokeStyle = '#dfe3e6';
    const nb = 30; g.lineWidth = 3;
    for (let i = 0; i < nb; i++) { const x = (i + 0.5) * w / nb; g.fillRect(x - 1.6, 30, 3.2, h - 58); if (i % 3 === 1) tipUp(g, x, 32, 6, 30); }
    g.fillRect(0, 30, w, 5); g.fillRect(0, h * 0.34, w, 4); g.fillRect(0, h - 58, w, 5);
    g.lineWidth = 3.2;
    for (let k = 0; k < 5; k++) { const cx = (k + 0.5) * w / 5; g.beginPath(); g.arc(cx - 22, h * 0.26, 16, 0.4, Math.PI * 1.7); g.stroke(); g.beginPath(); g.arc(cx + 22, h * 0.26, 16, Math.PI - 1.7 + Math.PI, Math.PI * 2.7 - Math.PI); g.stroke(); g.beginPath(); g.arc(cx, h * 0.5, 12, 0, TAU); g.stroke(); }
    g.lineWidth = 3;                                                                                      // meander band
    for (let x = 0; x < w; x += 24) { g.beginPath(); g.moveTo(x, h - 12); g.lineTo(x, h - 50); g.lineTo(x + 16, h - 50); g.lineTo(x + 16, h - 26); g.lineTo(x + 8, h - 26); g.lineTo(x + 8, h - 38); g.stroke(); }
    g.fillRect(0, h - 10, w, 5);
  }, 'fenceCath');
  /** the Annunciation street fence (photos 143 145 147): black frame, a Greek-key frieze between two flat rails along the TOP, the field below filled with a fine diamond lattice, spear tips on the upper rail (panel 3.6 x 1.5 m) */
  A.fenceAnn = D(512, 224, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#17191a'; g.strokeStyle = '#17191a';
    for (let x = 6; x < w; x += 22) tipUp(g, x, 26, 5.5, 26);
    g.fillRect(0, 24, w, 5); g.fillRect(0, 66, w, 5);
    g.lineWidth = 3; for (let x = 0; x < w; x += 26) { g.beginPath(); g.moveTo(x, 64); g.lineTo(x, 31); g.lineTo(x + 18, 31); g.lineTo(x + 18, 54); g.lineTo(x + 9, 54); g.lineTo(x + 9, 42); g.stroke(); }
    g.lineWidth = 2; const s = 17; for (let i = -14; i < 40; i++) { g.beginPath(); g.moveTo(i * s, 72); g.lineTo(i * s + 150, h - 8); g.stroke(); g.beginPath(); g.moveTo(i * s + 150, 72); g.lineTo(i * s, h - 8); g.stroke(); }
    g.fillRect(0, 71, w, 3); g.fillRect(0, h - 9, w, 7); g.fillRect(0, 0, 4, h); g.fillRect(w - 4, 0, 4, h);
  }, 'fenceAnn');
  /** low boulevard rail (0.6 m): black pickets every 0.12 m with spear finials, two rails (tile 2.4 m x 0.6 m) */
  A.railBlv = D(256, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#191b1c'; const n = 20;
    for (let i = 0; i < n; i++) { const x = (i + 0.5) * w / n; g.fillRect(x - 1.4, 10, 2.8, h - 14); tipUp(g, x, 14, 3.4, 12); }
    g.fillRect(0, 15, w, 4); g.fillRect(0, h - 14, w, 4);
  }, 'railBlv');
  /** garden rail with St Andrew's cross bracing (0.8 m bays of 2 m) */
  A.railX = D(256, 100, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#191b1c'; g.strokeStyle = '#191b1c'; g.lineWidth = 4;
    g.fillRect(0, 8, w, 5); g.fillRect(0, h - 10, w, 5);
    g.beginPath(); g.moveTo(4, h - 8); g.lineTo(w - 4, 10); g.stroke(); g.beginPath(); g.moveTo(w - 4, h - 8); g.lineTo(4, 10); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.arc(w / 2, h / 2, 9, 0, TAU); g.stroke();
  }, 'railX');
  /** the horse-tram enclosure: black diagonal lattice panel (1.1 m) with a top rail (tile 2.4 x 1.1 m) */
  A.railKonka = D(256, 116, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#17191a'; g.fillStyle = '#17191a'; g.lineWidth = 3; const s = 28;
    for (let i = -6; i < 14; i++) { g.beginPath(); g.moveTo(i * s, 12); g.lineTo(i * s + h, h - 8); g.stroke(); g.beginPath(); g.moveTo(i * s + h, 12); g.lineTo(i * s, h - 8); g.stroke(); }
    g.fillRect(0, 6, w, 7); g.fillRect(0, h - 10, w, 7); for (let i = 0; i < 8; i++) tipUp(g, (i + 0.5) * w / 8, 8, 4, 8);
  }, 'railKonka');
  /** the Korchmin terrace rail: scrolled black panels (tile 2.0 m x 0.9 m) */
  A.railScroll = D(256, 115, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#17191a'; g.fillStyle = '#17191a'; g.lineWidth = 4;
    g.fillRect(0, 6, w, 6); g.fillRect(0, h - 12, w, 6);
    for (let k = 0; k < 4; k++) { const cx = (k + 0.5) * w / 4; g.beginPath(); g.arc(cx - 13, h / 2, 13, Math.PI * 0.5, Math.PI * 2.1); g.stroke(); g.beginPath(); g.arc(cx + 13, h / 2, 13, Math.PI * 1.0 - 0.5, Math.PI * 2.5 - 0.7); g.stroke(); g.fillRect(cx - 1.5, 12, 3, h - 24); }
  }, 'railScroll');

  // ---------------------------------------------------------------------------------------------- roof sheets (tinted by the material colour; seams every 0.55 m)
  /** standing-seam sheet iron: tile 2.2 x 2.2 m, seams every 0.55 m (vertical), a few lighter panels */
  A.seams = D(128, 128, (g, w, h) => {
    const r = R(8101); g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { const v = 0.93 + r() * 0.08; g.fillStyle = `rgba(${200 * v | 0},${204 * v | 0},${208 * v | 0},0.35)`; g.fillRect(i * 32, 0, 32, h); }
    g.fillStyle = 'rgba(40,36,34,0.55)'; for (let i = 0; i < 4; i++) g.fillRect(i * 32, 0, 2, h);
    g.fillStyle = 'rgba(255,255,255,0.45)'; for (let i = 0; i < 4; i++) g.fillRect(i * 32 + 2, 0, 2, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(60,60,60,0.06)'; g.fillRect(r() * w, r() * h, 3 + r() * 6, 1 + r() * 2); }
  }, 'seams');
  /** lead-grey scale pattern of the chapel tent (diamond scales): tile 1 x 1 m */
  A.scales = D(128, 128, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(40,44,48,0.5)'; g.lineWidth = 2; for (let i = -4; i < 9; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 + 128, h); g.stroke(); g.beginPath(); g.moveTo(i * 32 + 128, 0); g.lineTo(i * 32, h); g.stroke(); } }, 'scales');
  /** brass-lit gold leaf (crosses, balls): flat colour with a faint grain (not used for large areas) */
  A.sheetGlow = D(64, 64, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); const r = R(8111); for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(255,240,180,${0.08 + r() * 0.1})`; g.fillRect(r() * w, r() * h, 8, 2); } }, 'sheetGlow');

  // ---------------------------------------------------------------------------------------------- ground surfaces (white-ish tiles tinted by the material colour; uv in metres / tile)
  /** granite slabs 0.6 x 0.9 m laid in bands (the boulevard promenades): tile 3.6 x 3.6 m: 6 x 4 slabs, running joints */
  A.slabGrey = D(512, 512, (g, w, h) => {
    const r = R(8121); g.fillStyle = '#6d6a66'; g.fillRect(0, 0, w, h);
    const cw = w / 6, rh = h / 4;
    for (let row = 0; row < 4; row++) for (let c = -1; c < 7; c++) {
      const x = c * cw + (row % 2) * cw * 0.37, v = 0.9 + r() * 0.2, wr = (row % 2 ? 0.6 : 1.0);
      g.fillStyle = `rgb(${196 * v | 0},${192 * v | 0},${186 * v | 0})`; g.fillRect(x + 1.5, row * rh + 1.5, cw - 3, rh - 3);
      g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x + 1.5, row * rh + 1.5, cw - 3, 4); void wr;
    }
    for (let i = 0; i < 900; i++) { const v = r(); g.fillStyle = v < 0.5 ? 'rgba(90,86,80,0.18)' : 'rgba(255,255,255,0.2)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  }, 'slabGrey');
  /** red-brown clinker pavers in herringbone (the cathedral precinct, the fountain plazas): tile 2 x 2 m, brick 0.2 x 0.1 */
  A.herring = D(256, 256, (g, w, h) => {
    const r = R(8131); g.fillStyle = '#6c4a42'; g.fillRect(0, 0, w, h);
    const bw = 0.2 / 2 * w, bh = 0.1 / 2 * h;
    for (let row = 0; row < 20; row++) for (let c = 0; c < 10; c++) {
      const v = 0.86 + r() * 0.28, x = c * bw * 2 + (row % 2 ? bw : 0), y = row * bh;
      g.fillStyle = `rgb(${190 * v | 0},${112 * v | 0},${98 * v | 0})`; const vert = (c + row) % 2 === 0;
      if (vert) g.fillRect(x + 0.6, y + 0.6, bw - 1.4, bh * 2 - 1.4); else g.fillRect(x + 0.6, y + 0.6, bw * 2 - 1.4, bh - 1.4);
    }
  }, 'herring');
  /** block paving in running bond, red-brown with grey: the central alley (tile 3 x 3 m, 0.2 x 0.1 pavers) */
  A.alley = D(256, 256, (g, w, h) => {
    const r = R(8141), pw = 0.2 / 3 * w, ph = 0.1 / 3 * h; g.fillStyle = '#5a4a44'; g.fillRect(0, 0, w, h);
    for (let y = 0, row = 0; y < h; y += ph, row++) for (let x = -(row % 2) * pw / 2; x < w; x += pw) { const v = 0.84 + r() * 0.3, gr = r() < 0.18; g.fillStyle = gr ? `rgb(${150 * v | 0},${140 * v | 0},${132 * v | 0})` : `rgb(${176 * v | 0},${106 * v | 0},${92 * v | 0})`; g.fillRect(x + 0.5, y + 0.5, pw - 1, ph - 1); }
  }, 'alley');
  /** granite setts 0.1 m (forecourt of the Annunciation church; the cathedral west court): tile 2 x 2 m */
  A.sett = D(256, 256, (g, w, h) => {
    const r = R(8151); g.fillStyle = '#6b6966'; g.fillRect(0, 0, w, h); const c = 12.8;
    for (let y = 0, row = 0; y < h; y += c, row++) for (let x = -(row % 2) * c / 2; x < w; x += c) { const v = 0.8 + r() * 0.4; g.fillStyle = `rgb(${158 * v | 0},${156 * v | 0},${152 * v | 0})`; g.fillRect(x + 1, y + 1, c - 2, c - 2); }
  }, 'sett');
  /** fine gravel (garden paths) */
  A.gravel = D(256, 256, (g, w, h) => {
    const r = R(8161); g.fillStyle = '#e6ded6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1000; i++) { const v = 190 + Math.floor(r() * 60); g.fillStyle = `rgb(${v},${v - 8},${v - 14})`; const s = 1 + r() * 3.2; g.fillRect(r() * w, r() * h, s, s * (0.6 + r() * 0.7)); }
    for (let i = 0; i < 380; i++) { const v = 140 + Math.floor(r() * 50); g.fillStyle = `rgba(${v},${v - 10},${v - 14},0.5)`; const s = 1 + r() * 2.4; g.fillRect(r() * w, r() * h, s, s); }
  }, 'gravel');
  A.grass = D(256, 256, (g, w, h) => {
    const r = R(8171); g.fillStyle = '#eef3e4'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) { const v = 208 + Math.floor(r() * 47); g.fillStyle = `rgba(${v - 24},${v},${v - 40},0.5)`; const s = 3 + r() * 14; g.beginPath(); g.ellipse(r() * w, r() * h, s, s * (0.4 + r() * 0.5), r() * 3.1, 0, TAU); g.fill(); }
    for (let i = 0; i < 140; i++) { g.fillStyle = r() < 0.8 ? 'rgba(255,255,240,0.5)' : 'rgba(250,236,120,0.45)'; g.fillRect(r() * w, r() * h, 2, 2); }
  }, 'grass');
  A.graniteGrain = D(128, 128, (g, w, h) => {
    const r = R(8181); g.fillStyle = '#e2ded6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const v = r(); g.fillStyle = v < 0.45 ? `rgba(150,142,130,${0.18 + r() * 0.2})` : v < 0.85 ? `rgba(255,255,250,${0.2 + r() * 0.25})` : `rgba(80,74,66,${0.15 + r() * 0.15})`; g.fillRect(r() * w, r() * h, 1 + r() * 1.8, 1 + r() * 1.6); }
  }, 'graniteGrain');
  /** rough-hewn rusticated granite blocks (plinths, the Pel base, the fence foot): tile 3.2 x 1.6 m, blocks 0.8 x 0.5 */
  A.rustic = D(256, 128, (g, w, h) => {
    const r = R(8191); g.fillStyle = '#4a4540'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 3; row++) for (let c = -1; c < 4; c++) { const x = c * 64 + (row % 2) * 32, y = row * 42.6, v = 0.82 + r() * 0.3; g.fillStyle = `rgb(${176 * v | 0},${150 * v | 0},${144 * v | 0})`; g.fillRect(x + 2, y + 2, 60, 38); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 2, y + 2, 60, 5); g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(x + 2, y + 34, 60, 6); }
    for (let i = 0; i < 300; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(40,30,30,0.16)'; g.fillRect(r() * w, r() * h, 2 + r() * 3, 2); }
  }, 'rustic');
  /** mowed lawn stripes are not needed; water for the fountains */
  /** slotted cast-iron drain grate (0.3 m wide, tile 0.3 x 1.2 m): dark with light slots */
  A.drain = D(64, 256, (g, w, h) => { g.fillStyle = '#2a2d2f'; g.fillRect(0, 0, w, h); g.fillStyle = '#4a4f52'; g.fillRect(2, 0, 3, h); g.fillRect(w - 5, 0, 3, h); g.fillStyle = '#121416'; for (let y = 6; y < h; y += 12) g.fillRect(10, y, w - 20, 5); }, 'drain');
  A.water = D(64, 64, (g, w, h) => { g.fillStyle = '#cfe6f2'; g.fillRect(0, 0, w, h); const r = R(8201); for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(255,255,255,${0.2 + r() * 0.3})`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(r() * w, r() * h); g.lineTo(r() * w + 8, r() * h); g.stroke(); } }, 'water');
  return A;
}
