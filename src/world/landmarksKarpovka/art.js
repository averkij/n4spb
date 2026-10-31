// landmarksKarpovka/art.js - canvas paintings of the module (docs/research/karpovka.md sections 2-3, photos refs/karpovka): the two-tone striped glazed brick of the Ioannovsky convent (cream / pinkish
// beige bands of four courses), its arched windows under striped voussoir arches (alpha sheets laid over the striped wall), the biforium with a rosette, the three tall windows of the upper church with
// round-pane tracery, drum and belfry bays, the scalloped arcaded cornices, the corbel arcature, the frieze of crosses, seamed sheet for domes and roofs (tinted by the material), the mosaic of St John of
// Kronstadt, the icons and leaves of the Holy Gate; the grey terrazite slabs of the First Lensovet House, its bay tiles (one bay x one storey), gallery glazing, loggia backs, the ribbed shop base, the
// entrance block, the reliefs of the terrace; granite / lawn / paver surfaces; plaques with real text.  Everything is cached by key ('lmKarp-...': no other module uses this prefix).
const TAU = Math.PI * 2;
export const COL = { cream: '#ece6d8', pink: '#c9a898', pinkD: '#b08c7e', pinkL: '#d8bcae', frame: '#f4f2ec', socle: '#b39e97', granite: '#8c7a76', dome: '#a9837a', gold: '#e4b53a',
  slab: '#b0ada6', slabJ: '#8c8983', slabD: '#8c8983', glass0: '#8fb0c8', glass1: '#3b5068' };

export function makeArt(ctx) {
  const tex = ctx.tex, A = {}, C = COL;
  const D = (w, h, fn, key, repeat) => tex.draw(w, h, fn, { key: 'lmKarp-' + key, repeat });
  const R = (seed) => ctx.rng(seed);

  // ------------------------------------------------------------------------------------------ shared painters (canvas y grows DOWN; yb = the bottom of a thing)
  /** horizontal brick bands: `n` pairs of cream / pink over the height h (starting with pink at the bottom), with course and head joints */
  const stripes = (g, x, y, w, h, n, seed = 1) => {
    const r = R(9800 + seed), bh = h / (n * 2);
    for (let i = 0; i < n * 2; i++) {
      const yy = y + h - (i + 1) * bh, cream = i % 2 === 1;
      g.fillStyle = cream ? C.cream : C.pink; g.fillRect(x, yy, w, bh + 0.5);
      g.fillStyle = cream ? 'rgba(150,140,125,0.30)' : 'rgba(120,90,80,0.30)';
      for (let c = 1; c < 4; c++) g.fillRect(x, yy + c * bh / 4, w, 1);
      for (let c = 0; c < 4; c++) for (let bx = (c % 2) * 8 + (r() * 3 | 0); bx < w; bx += 16) g.fillRect(x + bx, yy + c * bh / 4, 1, bh / 4);
    }
  };
  /** ring of alternating voussoirs over a semicircle: centre (cx, ys), radii r0..r1, n stones */
  const voussoirs = (g, cx, ys, r0, r1, n, c0 = C.cream, c1 = C.pink) => {
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI + i * Math.PI / n, a1 = Math.PI + (i + 1) * Math.PI / n;
      g.fillStyle = i % 2 ? c0 : c1; g.beginPath(); g.arc(cx, ys, r1, a0, a1 + 0.01); g.arc(cx, ys, r0, a1 + 0.01, a0, true); g.closePath(); g.fill();
    }
    g.strokeStyle = 'rgba(90,70,62,0.45)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, ys, r1, Math.PI, TAU); g.stroke();
  };
  /** path of a round-headed opening: centre cx, bottom yb, width w, total height h */
  const archPath = (g, cx, yb, w, h) => { const r = w / 2; g.beginPath(); g.moveTo(cx - r, yb); g.lineTo(cx - r, yb - h + r); g.arc(cx, yb - h + r, r, Math.PI, TAU); g.lineTo(cx + r, yb); g.closePath(); };
  /** an arched window: white frame, glass gradient, a mullion and a transom at the springing; `rings` = round-pane tracery of the church windows */
  const archWin = (g, cx, yb, w, h, o = {}) => {
    archPath(g, cx, yb, w, h); g.fillStyle = C.frame; g.fill();
    g.save(); archPath(g, cx, yb - 2, w - 5, h - 4.5); g.clip();
    const gr = g.createLinearGradient(0, yb - h, 0, yb); gr.addColorStop(0, o.g0 || C.glass0); gr.addColorStop(1, o.g1 || C.glass1); g.fillStyle = gr; g.fillRect(cx - w / 2, yb - h, w, h);
    g.fillStyle = 'rgba(255,255,255,0.16)'; g.beginPath(); g.moveTo(cx - w / 2, yb - h * 0.2); g.lineTo(cx + w / 2, yb - h * 0.62); g.lineTo(cx + w / 2, yb - h * 0.78); g.lineTo(cx - w / 2, yb - h * 0.36); g.closePath(); g.fill();
    g.fillStyle = C.frame; g.strokeStyle = C.frame;
    if (o.rings) {
      const rr = w * 0.3, n = Math.max(2, Math.round((h - w / 2) / (w * 0.72)));
      g.lineWidth = Math.max(1.5, w * 0.05);
      for (let i = 0; i < n; i++) { const cy = yb - (i + 0.5) * (h - w / 2) / n; g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.stroke(); g.fillRect(cx - w / 2, cy - (h - w / 2) / n / 2 - 1, w, 2); }
      g.beginPath(); g.arc(cx, yb - h + w / 2, rr * 0.8, 0, TAU); g.stroke(); g.fillRect(cx - 1, yb - h, 2, h);
    } else {
      g.fillRect(cx - 1.5, yb - h, 3, h); g.fillRect(cx - w / 2, yb - h + w / 2 - 1, w, 3);
      if (o.bars) g.fillRect(cx - w / 2, yb - (h - w / 2) * 0.5, w, 2);
    }
    g.restore();
  };
  /** a colonnette with a cushion capital */
  const colonnette = (g, cx, yb, w, h) => { g.fillStyle = C.pinkD; g.fillRect(cx - w / 2, yb - h, w, h); g.fillStyle = C.pinkL; g.fillRect(cx - w / 2, yb - h, w * 0.4, h); g.fillStyle = C.pink; g.fillRect(cx - w * 0.9, yb - h - w * 0.9, w * 1.8, w * 0.9); g.fillRect(cx - w * 0.8, yb - w * 0.6, w * 1.6, w * 0.6); };
  const speckle = (g, w, h, seed, n, a = 0.1) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,36,32'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2); } };

  // ------------------------------------------------------------------------------------------ the convent: walls
  /** striped brick: tile 1.28 x 1.32 m = two cream + two pink bands of four courses */
  A.stripe = D(128, 128, (g, w, h) => stripes(g, 0, 0, w, h, 2, 1), 'stripe', [1, 1]);
  /** socle storey: pinkish-grey ashlar courses, tile 2.0 x 1.0 m */
  A.socle = D(256, 128, (g, w, h) => {
    const r = R(9811); g.fillStyle = '#8f7c76'; g.fillRect(0, 0, w, h);
    for (let c = 0; c < 2; c++) for (let i = -1; i < 3; i++) { const v = 0.93 + r() * 0.12; g.fillStyle = `rgb(${179 * v | 0},${158 * v | 0},${151 * v | 0})`; g.fillRect(i * 128 + (c ? 64 : 0) + 2, c * 64 + 2, 124, 60); g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(i * 128 + (c ? 64 : 0) + 3, c * 64 + 3, 122, 5); }
    speckle(g, w, h, 9812, 260, 0.07);
  }, 'socle', [1, 1]);
  /** corbel arcature under the cornices: tile = one little blind arch 0.55 x 1.0 m */
  A.arcature = D(64, 112, (g, w, h) => {
    g.fillStyle = C.cream; g.fillRect(0, 0, w, h); g.fillStyle = C.pink; g.fillRect(0, 0, w, 20); g.fillStyle = C.pinkD; g.fillRect(0, 18, w, 3);
    g.fillStyle = C.pink; g.fillRect(0, 21, 9, h - 21); g.fillRect(w - 9, 21, 9, h - 21);
    g.fillStyle = C.pinkD; archPath(g, w / 2, h - 12, 38, 70); g.fill(); voussoirs(g, w / 2, h - 12 - 70 + 19, 19, 25, 5);
    g.fillStyle = C.pink; g.fillRect(4, h - 12, 20, 12); g.fillRect(w - 24, h - 12, 20, 12);
  }, 'arcature', [1, 1]);
  /** frieze of crosses pattee in square panels: tile 1.1 x 0.85 m */
  A.crossFrieze = D(128, 96, (g, w, h) => {
    g.fillStyle = C.pink; g.fillRect(0, 0, w, h); g.fillStyle = C.pinkD; g.fillRect(10, 10, w - 20, h - 20); g.fillStyle = C.pinkL; g.fillRect(0, 0, w, 5); g.fillRect(0, h - 5, w, 5);
    g.fillStyle = C.pinkL; const cx = w / 2, cy = h / 2, a = 30;
    for (let k = 0; k < 4; k++) { g.save(); g.translate(cx, cy); g.rotate(k * Math.PI / 2); g.beginPath(); g.moveTo(-4, 0); g.lineTo(-13, -a); g.lineTo(13, -a); g.lineTo(4, 0); g.closePath(); g.fill(); g.restore(); }
    g.beginPath(); g.arc(cx, cy, 7, 0, TAU); g.fill();
  }, 'crossFrieze', [1, 1]);
  /** carved square panels between the storeys: tile 1.3 x 0.62 m */
  A.panelFrieze = D(128, 64, (g, w, h) => {
    g.fillStyle = C.pink; g.fillRect(0, 0, w, h); g.fillStyle = C.pinkD; g.fillRect(16, 9, w - 32, h - 18);
    g.strokeStyle = C.pinkL; g.lineWidth = 3; g.strokeRect(22, 14, w - 44, h - 28);
    g.beginPath(); g.moveTo(w / 2, 16); g.lineTo(w - 26, h / 2); g.lineTo(w / 2, h - 16); g.lineTo(26, h / 2); g.closePath(); g.stroke(); g.fillStyle = C.pinkL; g.beginPath(); g.arc(w / 2, h / 2, 6, 0, TAU); g.fill();
    g.fillStyle = C.cream; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4);
  }, 'panelFrieze', [1, 1]);
  /** scalloped arcaded cornice of the drums: tile = one arch 0.75 x 0.8 m with striped voussoirs over a dark recess */
  A.scallop = D(64, 72, (g, w, h) => {
    g.fillStyle = C.pinkD; g.fillRect(0, 0, w, h); g.fillStyle = C.pink; g.fillRect(0, 0, w, 12);
    g.fillStyle = '#7d6258'; archPath(g, w / 2, h, 34, 48); g.fill(); voussoirs(g, w / 2, h - 48 + 17, 17, 31, 6);
    g.fillStyle = C.cream; g.fillRect(0, 10, w, 3);
  }, 'scallop', [1, 1]);
  /** one bay of a drum: stripes, corner colonnettes, a tall arched window with round-pane glazing under a striped arch: tile ~2.6 x 6.6 m */
  A.drumBay = D(128, 320, (g, w, h) => {
    stripes(g, 0, 0, w, h, 10, 3);
    colonnette(g, 6, h - 4, 9, h - 46); colonnette(g, w - 6, h - 4, 9, h - 46);
    g.fillStyle = C.pink; g.fillRect(0, h - 8, w, 8);
    voussoirs(g, w / 2, 86, 29, 44, 9); archWin(g, w / 2, h - 50, 54, 212, { rings: true });
    g.fillStyle = C.pink; g.fillRect(w / 2 - 34, h - 50, 68, 7);
  }, 'drumBay', [1, 1]);
  /** one bay of the belfry octagon: striped piers, an open arch with a bell: tile ~2.5 x 6.0 m */
  A.belfryBay = D(128, 304, (g, w, h) => {
    stripes(g, 0, 0, w, h, 9, 4);
    colonnette(g, 6, h - 4, 9, h - 40); colonnette(g, w - 6, h - 4, 9, h - 40);
    voussoirs(g, w / 2, 96, 35, 50, 9);
    g.fillStyle = '#2a2a30'; archPath(g, w / 2, h - 70, 66, 172); g.fill();
    g.fillStyle = '#6a5a3a'; g.beginPath(); g.moveTo(w / 2 - 6, 118); g.quadraticCurveTo(w / 2 - 22, 150, w / 2 - 24, 176); g.lineTo(w / 2 + 24, 176); g.quadraticCurveTo(w / 2 + 22, 150, w / 2 + 6, 118); g.closePath(); g.fill();
    g.fillStyle = '#3a3020'; g.fillRect(w / 2 - 30, 106, 60, 6); g.beginPath(); g.arc(w / 2, 182, 5, 0, TAU); g.fill();
    g.fillStyle = C.pink; g.fillRect(w / 2 - 40, h - 70, 80, 8); g.fillStyle = C.pinkD; g.fillRect(w / 2 - 33, h - 62, 66, 26);
  }, 'belfryBay', [1, 1]);
  /** the gable of the south front (8.0 x 3.8 m, mapped on the triangle): stripes, seven stepped blind niches, a cross in a roundel */
  A.gable = D(512, 256, (g, w, h) => {
    stripes(g, 0, 0, w, h, 6, 5);
    const hs = [70, 104, 138, 168, 138, 104, 70];
    for (let i = 0; i < 7; i++) { const cx = 100 + i * 52, yb = h - 26; g.fillStyle = C.pinkD; archPath(g, cx, yb, 26, hs[i]); g.fill(); voussoirs(g, cx, yb - hs[i] + 13, 13, 19, 5); g.fillStyle = C.pink; g.fillRect(cx - 17, yb, 34, 5); }
    g.fillStyle = C.pink; g.fillRect(0, h - 20, w, 20); g.fillStyle = C.pinkD; for (let x = 6; x < w; x += 26) g.fillRect(x, h - 16, 14, 12);
  }, 'gable');
  /** seamed sheet metal (white, tinted by the material): tile 0.6 m between standing seams */
  A.seam = D(64, 64, (g, w, h) => { g.fillStyle = '#f3efec'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(60,40,36,0.5)'; g.fillRect(0, 0, 3, h); g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(3, 0, 3, h); g.fillStyle = 'rgba(60,40,36,0.12)'; g.fillRect(0, h - 2, w, 2); }, 'seam', [1, 1]);
  /** one rib of a dome: u across the rib (seam at both edges), v base .. apex */
  A.rib = D(32, 64, (g, w, h) => { g.fillStyle = '#f1edea'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(70,46,40,0.5)'; g.fillRect(0, 0, 2, h); g.fillRect(w - 2, 0, 2, h); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(2, 0, 3, h); }, 'rib');

  // ------------------------------------------------------------------------------------------ the convent: alpha sheets (laid over the striped wall)
  /** ordinary arched window under a striped arch: 1.7 x 3.4 m (opening 1.15 x 2.6) */
  A.winArch = D(128, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); const cx = w / 2, yb = h - 26, ow = 86, oh = 196;
    voussoirs(g, cx, yb - oh + ow / 2, ow / 2 - 1, ow / 2 + 20, 9);
    g.fillStyle = C.pink; g.fillRect(cx - ow / 2 - 20, yb - oh + ow / 2, 20, 9); g.fillRect(cx + ow / 2, yb - oh + ow / 2, 20, 9);
    archWin(g, cx, yb, ow, oh, { bars: true });
    g.fillStyle = C.pink; g.fillRect(cx - ow / 2 - 12, yb, ow + 24, 9); g.fillStyle = C.pinkD; g.fillRect(cx - ow / 2 - 6, yb + 9, ow + 12, 12);
  }, 'winArch');
  /** small top-storey window: 1.25 x 2.1 m (opening 0.8 x 1.5) */
  A.winSmall = D(96, 160, (g, w, h) => {
    g.clearRect(0, 0, w, h); const cx = w / 2, yb = h - 16, ow = 60, oh = 114;
    voussoirs(g, cx, yb - oh + ow / 2, ow / 2 - 1, ow / 2 + 15, 7); archWin(g, cx, yb, ow, oh);
    g.fillStyle = C.pink; g.fillRect(cx - ow / 2 - 9, yb, ow + 18, 8);
  }, 'winSmall');
  /** paired windows of the tower bays, first floor: 3.6 x 3.5 m */
  A.winPair = D(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); const yb = h - 22, ow = 70, oh = 190;
    for (const cx of [w / 2 - 48, w / 2 + 48]) { voussoirs(g, cx, yb - oh + ow / 2, ow / 2 - 1, ow / 2 + 17, 9); archWin(g, cx, yb, ow, oh, { rings: true }); }
    for (const cx of [w / 2 - 92, w / 2, w / 2 + 92]) colonnette(g, cx, yb, 10, oh - ow / 2 - 6);
    g.fillStyle = C.pink; g.fillRect(w / 2 - 104, yb, 208, 9);
  }, 'winPair');
  /** the biforium of a tower bay: a big striped arch with a rosette over two arched windows: 4.4 x 6.7 m */
  A.biforium = D(256, 390, (g, w, h) => {
    g.clearRect(0, 0, w, h); const cx = w / 2, yb = h - 18, ys = 150;
    g.fillStyle = C.pinkL; g.beginPath(); g.arc(cx, ys, 98, Math.PI, TAU); g.lineTo(cx + 98, yb); g.lineTo(cx - 98, yb); g.closePath(); g.fill();
    voussoirs(g, cx, ys, 96, 122, 15);
    g.fillStyle = C.pink; g.fillRect(cx - 124, ys, 28, 11); g.fillRect(cx + 96, ys, 28, 11);
    g.fillStyle = C.pinkD; g.beginPath(); g.arc(cx, ys - 44, 34, 0, TAU); g.fill(); g.strokeStyle = C.cream; g.lineWidth = 4; g.stroke();
    g.fillStyle = C.cream; for (let k = 0; k < 8; k++) { const a = k * TAU / 8; g.beginPath(); g.ellipse(cx + Math.cos(a) * 16, ys - 44 + Math.sin(a) * 16, 9, 4.5, a, 0, TAU); g.fill(); } g.beginPath(); g.arc(cx, ys - 44, 6, 0, TAU); g.fill();
    for (const x of [cx - 46, cx + 46]) { voussoirs(g, x, yb - 216 + 33, 32, 44, 7); archWin(g, x, yb, 66, 216, { rings: true }); }
    for (const x of [cx - 90, cx, cx + 90]) colonnette(g, x, yb, 10, 180);
    g.fillStyle = C.pink; g.fillRect(cx - 104, yb, 208, 10);
  }, 'biforium');
  /** the three tall windows of the upper church between colonnettes: 7.0 x 8.8 m (side openings 1.3 x 6.7, the middle one 1.5 x 7.7) */
  A.tall3 = D(448, 560, (g, w, h) => {
    g.clearRect(0, 0, w, h); const yb = h - 22, S = [[w / 2 - 130, 82, 428], [w / 2, 96, 492], [w / 2 + 130, 82, 428]];
    for (const [cx, ow, oh] of S) { voussoirs(g, cx, yb - oh + ow / 2, ow / 2 - 1, ow / 2 + 22, 11); archWin(g, cx, yb, ow, oh, { rings: true }); }
    for (const cx of [w / 2 - 196, w / 2 - 65, w / 2 + 65, w / 2 + 196]) colonnette(g, cx, yb, 14, 372);
    g.fillStyle = C.pink; g.fillRect(w / 2 - 212, yb, 424, 12); g.fillStyle = C.pinkD; g.fillRect(w / 2 - 204, yb + 12, 408, 10);
  }, 'tall3');
  /** rectangular socle-storey window with a white ornamental grille: 1.2 x 2.1 m */
  A.socleWin = D(80, 140, (g, w, h) => {
    g.fillStyle = '#9a8680'; g.fillRect(0, 0, w, h); g.fillStyle = '#2f3a44'; g.fillRect(8, 8, w - 16, h - 16);
    g.strokeStyle = C.frame; g.lineWidth = 2.5; g.strokeRect(9, 9, w - 18, h - 18);
    for (let x = 20; x < w - 12; x += 13) { g.beginPath(); g.moveTo(x, 10); g.lineTo(x, h - 10); g.stroke(); }
    for (let y = 30; y < h - 12; y += 34) { g.beginPath(); g.arc(w / 2, y, 11, 0, TAU); g.stroke(); }
  }, 'socleWin');
  /** the main portal: an arched doorway with brown leaves in a pink surround under a small metal hood: 3.0 x 4.0 m (alpha) */
  A.portal = D(192, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); const cx = w / 2, yb = h - 2;
    g.fillStyle = C.pinkD; archPath(g, cx, yb, 150, 214); g.fill(); voussoirs(g, cx, yb - 214 + 75, 60, 75, 11, C.pinkL, C.pink);
    g.fillStyle = '#3a2418'; archPath(g, cx, yb, 118, 196); g.fill();
    g.fillStyle = '#8a5a30'; g.fillRect(cx - 52, yb - 132, 50, 132); g.fillRect(cx + 2, yb - 132, 50, 132);
    g.fillStyle = '#6d4424'; for (const x of [cx - 46, cx + 8]) { g.fillRect(x, yb - 124, 38, 52); g.fillRect(x, yb - 62, 38, 52); }
    g.fillStyle = C.gold; g.fillRect(cx - 6, yb - 70, 3, 14); g.fillRect(cx + 3, yb - 70, 3, 14);
    g.save(); archPath(g, cx, yb - 136, 110, 56); g.clip(); g.fillStyle = '#5a6f86'; g.fillRect(0, 0, w, h); g.strokeStyle = C.frame; g.lineWidth = 2; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(cx, yb - 136); g.lineTo(cx + Math.cos(Math.PI + k * Math.PI / 5) * 70, yb - 136 + Math.sin(Math.PI + k * Math.PI / 5) * 70); g.stroke(); } g.restore();
    g.fillStyle = '#5c3f34'; g.beginPath(); g.moveTo(cx - 92, 62); g.quadraticCurveTo(cx, -14, cx + 92, 62); g.lineTo(cx + 92, 72); g.quadraticCurveTo(cx, 2, cx - 92, 72); g.closePath(); g.fill();
    g.fillStyle = C.gold; g.fillRect(cx - 1.5, 2, 3, 22); g.fillRect(cx - 7, 8, 14, 3);
  }, 'portal');
  /** relief roundel with a cross above the tall windows (alpha) */
  A.roundel = D(64, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = C.pink; g.beginPath(); g.arc(32, 32, 31, 0, TAU); g.fill(); g.fillStyle = C.pinkD; g.beginPath(); g.arc(32, 32, 25, 0, TAU); g.fill(); g.fillStyle = C.cream; g.fillRect(28, 12, 8, 40); g.fillRect(14, 24, 36, 8); }, 'roundel');
  /** a saint: a colour silhouette (robe, mantle, head, halo) at (cx, yb), height s */
  const saint = (g, cx, yb, s, robe, mantle, beard) => {
    g.fillStyle = C.gold; g.beginPath(); g.arc(cx, yb - s * 0.86, s * 0.105, 0, TAU); g.fill();
    g.fillStyle = robe; g.beginPath(); g.moveTo(cx - s * 0.11, yb - s * 0.74); g.lineTo(cx + s * 0.11, yb - s * 0.74); g.lineTo(cx + s * 0.17, yb); g.lineTo(cx - s * 0.17, yb); g.closePath(); g.fill();
    g.fillStyle = mantle; g.beginPath(); g.moveTo(cx - s * 0.12, yb - s * 0.76); g.lineTo(cx + s * 0.12, yb - s * 0.76); g.lineTo(cx + s * 0.2, yb - s * 0.3); g.lineTo(cx + s * 0.06, yb - s * 0.16); g.lineTo(cx - s * 0.2, yb - s * 0.3); g.closePath(); g.fill();
    g.fillStyle = '#e2b998'; g.beginPath(); g.arc(cx, yb - s * 0.86, s * 0.062, 0, TAU); g.fill();
    if (beard) { g.fillStyle = beard; g.beginPath(); g.moveTo(cx - s * 0.05, yb - s * 0.84); g.lineTo(cx + s * 0.05, yb - s * 0.84); g.lineTo(cx, yb - s * 0.72); g.closePath(); g.fill(); }
  };
  /** the mosaic of St John of Kronstadt: gold lattice ground, green phelonion over a white sticharion with a red-gold stole, a cloud under the feet: 1.15 x 2.95 m */
  A.mosaic = D(100, 256, (g, w, h) => {
    g.fillStyle = '#4a2f24'; g.fillRect(0, 0, w, h); g.fillStyle = '#d9a63a'; g.fillRect(5, 5, w - 10, h - 10);
    g.strokeStyle = 'rgba(255,236,160,0.7)'; g.lineWidth = 1; for (let i = -h; i < w + h; i += 9) { g.beginPath(); g.moveTo(i, 5); g.lineTo(i + h, h - 5); g.stroke(); g.beginPath(); g.moveTo(i, h - 5); g.lineTo(i + h, 5); g.stroke(); }
    g.fillStyle = '#e9eef2'; g.beginPath(); g.ellipse(w / 2, h - 26, 40, 16, 0, 0, TAU); g.fill();
    g.fillStyle = '#f0ece2'; g.beginPath(); g.moveTo(w / 2 - 15, 110); g.lineTo(w / 2 + 15, 110); g.lineTo(w / 2 + 24, h - 32); g.lineTo(w / 2 - 24, h - 32); g.closePath(); g.fill();
    g.fillStyle = '#b8402c'; g.fillRect(w / 2 - 7, 112, 14, 96); g.fillStyle = C.gold; g.fillRect(w / 2 - 7, 196, 14, 12);
    g.fillStyle = '#2f6a3c'; g.beginPath(); g.moveTo(w / 2 - 15, 62); g.lineTo(w / 2 + 15, 62); g.lineTo(w / 2 + 33, 150); g.lineTo(w / 2 + 12, 172); g.lineTo(w / 2, 128); g.lineTo(w / 2 - 12, 172); g.lineTo(w / 2 - 33, 150); g.closePath(); g.fill();
    g.fillStyle = C.gold; g.beginPath(); g.arc(w / 2, 44, 19, 0, TAU); g.fill(); g.fillStyle = '#2f6a3c'; g.fillRect(w / 2 - 12, 22, 24, 16);
    g.fillStyle = '#e2b998'; g.beginPath(); g.arc(w / 2, 46, 10, 0, TAU); g.fill(); g.fillStyle = '#eeeeea'; g.beginPath(); g.moveTo(w / 2 - 10, 50); g.lineTo(w / 2 + 10, 50); g.lineTo(w / 2, 72); g.closePath(); g.fill();
    g.fillStyle = C.gold; g.fillRect(w / 2 + 12, 92, 3, 22); g.fillRect(w / 2 + 7, 97, 13, 3);
  }, 'mosaic');
  /** the icons of the Holy Gate: seven arched panels in a row (alpha), sky-blue grounds, colour-silhouette saints */
  A.icons = D(448, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const S = [['#b23a2c', '#2f5aa0', '#6a4a30'], ['#3a2a22', '#6a5040', '#d8d8d4'], ['#b8402c', '#24407e', null], ['#b83a2c', '#2a6a8a', '#6a4a30'], ['#c8b060', '#a8322a', '#e4e4e0'], ['#d8d0c0', '#8a2a2a', '#dcdcd8'], ['#2a4a8a', '#7a5a3a', null]];
    for (let i = 0; i < 7; i++) { const cx = 32 + i * 64; archPath(g, cx, h - 2, 56, 124); g.fillStyle = '#f2e6da'; g.fill(); g.save(); archPath(g, cx, h - 5, 50, 118); g.clip(); g.fillStyle = '#8ec4dc'; g.fillRect(cx - 30, 0, 60, h); saint(g, cx, h - 5, 110, S[i][0], S[i][1], S[i][2]); g.restore(); }
  }, 'icons');
  /** the leaves of the Holy Gate (alpha, arched 3.4 x 3.5 m): pink bars, fan arcs, gilded crosses */
  A.gateLeaf = D(192, 200, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.save(); archPath(g, w / 2, h, w - 4, h - 2); g.clip();
    g.fillStyle = 'rgba(228,170,150,0.92)'; g.fillRect(0, h * 0.42, w, h); g.strokeStyle = '#e4aa96'; g.lineWidth = 3;
    for (let k = 0; k <= 12; k++) { const a = Math.PI + k * Math.PI / 12; g.beginPath(); g.moveTo(w / 2, h * 0.5); g.lineTo(w / 2 + Math.cos(a) * w, h * 0.5 + Math.sin(a) * w); g.stroke(); }
    g.strokeStyle = '#c98e7c'; g.lineWidth = 2; for (let x = 8; x < w; x += 12) { g.beginPath(); g.moveTo(x, h * 0.42); g.lineTo(x, h); g.stroke(); } g.strokeRect(2, h * 0.42, w / 2 - 3, h); g.strokeRect(w / 2 + 1, h * 0.42, w / 2 - 3, h);
    g.fillStyle = C.gold; for (const [x, y] of [[w * 0.27, h * 0.66], [w * 0.73, h * 0.66], [w * 0.5, h * 0.5]]) { g.fillRect(x - 2, y - 13, 4, 26); g.fillRect(x - 9, y - 5, 18, 4); }
    g.restore();
  }, 'gateLeaf');

  // ------------------------------------------------------------------------------------------ the First Lensovet House (tiles: uv u = bays, v = storeys)
  const slabs = (g, w, h, cols, rows, seed) => {
    const r = R(seed); g.fillStyle = C.slabJ; g.fillRect(0, 0, w, h);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const v = 0.955 + r() * 0.08; g.fillStyle = `rgb(${177 * v | 0},${174 * v | 0},${167 * v | 0})`; g.fillRect(i * w / cols + 1, j * h / rows + 1, w / cols - 1.5, h / rows - 1.5); }
    speckle(g, w, h, seed + 1, 160, 0.06);
  };
  const lwin = (g, x, y, ww, wh, panes = 2) => {
    g.fillStyle = '#6f6b64'; g.fillRect(x - 3, y - 3, ww + 6, wh + 6); g.fillStyle = '#f0eee8'; g.fillRect(x, y, ww, wh);
    const gr = g.createLinearGradient(0, y, 0, y + wh); gr.addColorStop(0, '#7f9cb4'); gr.addColorStop(1, '#36485c'); g.fillStyle = gr; g.fillRect(x + 3, y + 3, ww - 6, wh - 6);
    g.fillStyle = '#f0eee8'; for (let k = 1; k < panes; k++) g.fillRect(x + ww * k / panes - 1.5, y, 3, wh); if (wh > 24) g.fillRect(x, y + wh * 0.3, ww, 2.5);
    g.fillStyle = 'rgba(40,36,32,0.35)'; g.fillRect(x - 3, y + wh + 3, ww + 6, 3);
  };
  /** plain slabs: tile 2.75 x 3.1 m (2 x 3 slabs) */
  A.slab = D(128, 128, (g, w, h) => slabs(g, w, h, 2, 3, 9900), 'slab', [1, 1]);
  /** a bay of an upper storey: one nearly square window 1.2 x 1.5 m */
  A.bayWin = D(128, 128, (g, w, h) => { slabs(g, w, h, 2, 3, 9902); lwin(g, 36, 27, 56, 62); }, 'bayWin', [1, 1]);
  /** a bay of the socle storey: a small square window high up */
  A.baySocle = D(128, 128, (g, w, h) => { slabs(g, w, h, 2, 3, 9904); lwin(g, 42, 34, 44, 42); }, 'baySocle', [1, 1]);
  /** a bay of the top storey: a tiny square window */
  A.bayTop = D(128, 128, (g, w, h) => { slabs(g, w, h, 2, 3, 9906); lwin(g, 52, 40, 24, 22, 1); }, 'bayTop', [1, 1]);
  /** a narrow staircase bay: a little square window per storey ("ladder") */
  A.bayLadder = D(64, 128, (g, w, h) => { slabs(g, w, h, 1, 3, 9908); lwin(g, 20, 50, 24, 24, 1); }, 'bayLadder', [1, 1]);
  /** portholes under the cornice of the east wing: tile 2.75 x 1.03 m */
  A.porthole = D(128, 48, (g, w, h) => { slabs(g, w, h, 2, 1, 9910); g.fillStyle = '#6f6b64'; g.beginPath(); g.arc(w / 2, h / 2, 15, 0, TAU); g.fill(); g.fillStyle = '#3d5066'; g.beginPath(); g.arc(w / 2, h / 2, 11, 0, TAU); g.fill(); }, 'porthole', [1, 1]);
  /** glazing behind the gallery: tile 2.75 x 3.2 m */
  A.glaze = D(128, 128, (g, w, h) => {
    g.fillStyle = '#9d988f'; g.fillRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6f8ba2'); gr.addColorStop(1, '#2f3f50'); g.fillStyle = gr; g.fillRect(5, 10, w - 10, h - 26);
    g.fillStyle = '#e9e7e0'; for (let i = 0; i <= 5; i++) g.fillRect(5 + i * (w - 10) / 5 - 1, 10, 2.5, h - 26); g.fillRect(5, 44, w - 10, 2.5); g.fillRect(5, 10, w - 10, 2.5);
    g.fillStyle = 'rgba(255,240,200,0.10)'; g.fillRect(5, 46, w - 10, h - 62);
  }, 'glaze', [1, 1]);
  /** back wall of a loggia: a window band and a door: 4.6 x 2.1 m */
  A.logBack = D(256, 128, (g, w, h) => { g.fillStyle = '#9d988f'; g.fillRect(0, 0, w, h); lwin(g, 16, 16, 120, 66, 3); lwin(g, 160, 14, 44, 108, 1); lwin(g, 212, 16, 34, 66, 1); }, 'logBack');
  /** horizontally ribbed dark base of the shop corner: tile 1 x 1 m */
  A.ribbed = D(64, 64, (g, w, h) => { g.fillStyle = '#6c6a66'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) { g.fillStyle = '#8a8884'; g.fillRect(0, y, w, 3); g.fillStyle = '#4c4a48'; g.fillRect(0, y + 5, w, 3); } }, 'ribbed', [1, 1]);
  /** the main entrance block: dark polished stone, a door with a glazed transom, the number 13: 5.5 x 3.2 m */
  A.entrance = D(256, 150, (g, w, h) => {
    g.fillStyle = '#4a4a4c'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(20,20,22,0.6)'; g.lineWidth = 1.5; for (let x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } g.beginPath(); g.moveTo(0, 50); g.lineTo(w, 50); g.stroke();
    speckle(g, w, h, 9920, 300, 0.08);
    g.fillStyle = '#1e2126'; g.fillRect(96, 26, 64, h - 26); g.fillStyle = '#3a2a20'; g.fillRect(100, 56, 27, h - 56); g.fillRect(129, 56, 27, h - 56); g.fillStyle = '#6f8ba2'; g.fillRect(100, 30, 56, 22);
    g.fillStyle = '#e8e6de'; g.fillRect(190, 62, 34, 26); g.fillStyle = '#1c2a5a'; g.fillRect(192, 64, 30, 22); g.fillStyle = '#f2f2ee'; g.textAlign = 'center'; g.textBaseline = 'middle'; tex.fitText(g, '13', 207, 76, 24, 18, tex.FONTS.sans, 700);
  }, 'entrance');
  /** reliefs of the terrace wall (carved in the grey granite): ears of rye; tank tracks; the footballer of the stone vase */
  const reliefBase = (g, w, h, seed) => { g.fillStyle = '#9a9a96'; g.fillRect(0, 0, w, h); speckle(g, w, h, seed, 260, 0.1); g.strokeStyle = '#6f6f6c'; g.lineWidth = 3; g.strokeRect(4, 4, w - 8, h - 8); g.strokeStyle = '#5c5c5a'; g.fillStyle = '#b6b6b2'; };
  A.reliefRye = D(128, 128, (g, w, h) => {
    reliefBase(g, w, h, 9930);
    for (const [x, t] of [[40, -0.25], [64, 0], [88, 0.25]]) { g.save(); g.translate(x, h - 14); g.rotate(t); g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -94); g.stroke(); for (let k = 0; k < 7; k++) for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 6, -46 - k * 8, 6.5, 3.2, s * -0.9, 0, TAU); g.fill(); g.stroke(); } g.restore(); }
  }, 'reliefRye');
  A.reliefTank = D(128, 128, (g, w, h) => {
    reliefBase(g, w, h, 9932); g.lineWidth = 3;
    g.beginPath(); g.moveTo(22, 96); g.lineTo(106, 96); g.arc(106, 80, 16, Math.PI / 2, -Math.PI / 2, true); g.lineTo(22, 64); g.arc(22, 80, 16, -Math.PI / 2, Math.PI / 2, true); g.closePath(); g.fill(); g.stroke();
    for (let x = 26; x <= 102; x += 19) { g.beginPath(); g.arc(x, 80, 8, 0, TAU); g.stroke(); } for (let x = 14; x < 116; x += 8) { g.beginPath(); g.moveTo(x, 96); g.lineTo(x, 102); g.stroke(); }
    g.fillRect(40, 40, 50, 24); g.strokeRect(40, 40, 50, 24); g.beginPath(); g.moveTo(90, 50); g.lineTo(118, 44); g.stroke();
  }, 'reliefTank');
  A.reliefFoot = D(96, 128, (g, w, h) => {
    reliefBase(g, w, h, 9934); g.lineWidth = 2.5; g.lineCap = 'round';
    g.beginPath(); g.arc(46, 28, 9, 0, TAU); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(40, 38); g.lineTo(58, 40); g.lineTo(62, 72); g.lineTo(38, 70); g.closePath(); g.fill(); g.stroke();
    g.lineWidth = 7; g.strokeStyle = '#b6b6b2'; g.beginPath(); g.moveTo(44, 70); g.lineTo(34, 96); g.lineTo(40, 116); g.moveTo(56, 72); g.lineTo(70, 92); g.lineTo(62, 108); g.moveTo(40, 44); g.lineTo(26, 58); g.moveTo(58, 44); g.lineTo(72, 56); g.stroke();
    g.lineWidth = 2; g.strokeStyle = '#5c5c5a'; g.beginPath(); g.arc(28, 110, 9, 0, TAU); g.fill(); g.stroke();
  }, 'reliefFoot');
  /** the stone fence of the court on ul. Literatorov: grey slabs with a band of flowers and ears: tile 2.0 x 2.0 m */
  A.yardWall = D(128, 128, (g, w, h) => {
    slabs(g, w, h, 2, 3, 9940); g.fillStyle = '#9a968c'; g.fillRect(0, 30, w, 34); g.strokeStyle = '#75716a'; g.lineWidth = 2;
    for (let x = 16; x < w; x += 32) { g.beginPath(); g.arc(x, 47, 8, 0, TAU); g.stroke(); for (let k = 0; k < 6; k++) { const a = k * TAU / 6; g.beginPath(); g.ellipse(x + Math.cos(a) * 9, 47 + Math.sin(a) * 9, 4, 2.2, a, 0, TAU); g.stroke(); } }
  }, 'yardWall', [1, 1]);

  // ------------------------------------------------------------------------------------------ surfaces (world uv)
  A.granite = D(128, 128, (g, w, h) => { g.fillStyle = '#ecebe8'; g.fillRect(0, 0, w, h); const r = R(9950); for (let i = 0; i < 900; i++) { const v = 120 + Math.floor(r() * 120); g.fillStyle = `rgba(${v},${v},${v},0.4)`; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5); } g.fillStyle = 'rgba(40,40,44,0.45)'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h); }, 'granite', [1, 1]);
  A.grass = D(256, 256, (g, w, h) => { const r = R(9952); g.fillStyle = '#eef3e4'; g.fillRect(0, 0, w, h); for (let i = 0; i < 520; i++) { const v = 208 + Math.floor(r() * 47); g.fillStyle = `rgba(${v - 24},${v},${v - 40},0.5)`; const s = 3 + r() * 14; g.beginPath(); g.ellipse(r() * w, r() * h, s, s * (0.4 + r() * 0.5), r() * 3.1, 0, TAU); g.fill(); } }, 'grass', [1, 1]);
  A.pavers = D(256, 256, (g, w, h) => { const r = R(9954); g.fillStyle = '#8f8d88'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) for (let x = -64; x < w; x += 64) { const v = 172 + Math.floor(r() * 36); g.fillStyle = `rgb(${v},${v - 2},${v - 6})`; g.fillRect(x + (y / 32 % 2) * 32 + 1, y + 1, 62, 30); } }, 'pavers', [1, 1]);

  // ------------------------------------------------------------------------------------------ text plates
  A.text = (text, o = {}) => D(o.w || 512, o.h || 64, (g, w, h) => {
    if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, w, h); if (o.rim) { g.strokeStyle = o.rim; g.lineWidth = 4; g.strokeRect(3, 3, w - 6, h - 6); } } else g.clearRect(0, 0, w, h);
    g.fillStyle = o.fg || '#d9b23c'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const lines = String(text).split('\n');
    lines.forEach((ln, i) => tex.fitText(g, ln, w / 2, h * (i + 0.5) / lines.length + 1, w * 0.9, h / lines.length * 0.72, o.font || tex.FONTS.serif, o.weight || 700));
  }, 'text|' + text + '|' + (o.w || 512) + '|' + (o.h || 64) + '|' + (o.bg || '') + (o.fg || ''));
  return A;
}
