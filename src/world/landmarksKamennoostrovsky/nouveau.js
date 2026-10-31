// landmarksKamennoostrovsky/nouveau.js - the facade vocabulary of the Petrograd side that the Nevsky kit (common.js) lacks: Art Nouveau / Northern Modern / neoclassical-revival tenements of 1899-1915.
//   textures   rough-hewn granite blocks (socles, portals), baluster strips, wrought-iron balcony grilles, small-pane window sashes, lattice glazing of the lancet arches, sheet / tile roofs, majolica
//   templates  window surrounds built once (K.capture) and stamped per bay (Parts.stamp): 'plain', 'key', 'rustic' (toothed stone blocks + stepped keystone: House with Towers), 'arch', 'nord'
//   elevation  N.elevation(len, spec): wall + base + floors of windows described by data, per-bay overrides
//   bodies     N.erker (bay window: trapezoid / box / round, on corbels, with balcony / tent / gable top), N.stoneBalcony, N.ironBalcony, N.parapet, N.lancet (pointed arch), N.attic (shaped gables),
//              N.mansard (mitred roof prism with dormers), N.turret (round / polygonal corner tower with dome, tent or spire), N.quoins, N.dome
// Everything draws in the CURRENT facade frame of kit.js (x along the wall to the right seen from the street, y up, z out of the wall).  N.onEdge(e, fn) pushes that frame and collects the
// street plates that streets/plates.js already hung on this wall (ctx.services.labels): ground-floor openings keep clear of them (N.blocked) and our own labels reserve their rectangle (N.reserve).
// Sources: docs/research/kamennoostrovsky.md (photo table: refs/kamennoostrovsky/NN_*.jpg).
import * as THREE from 'three';
import { onEdge, archPath } from './kit.js';

export const NC = {
  stone: '#7f7e7c', stoneDark: '#636261', stoneLight: '#a09c96', stonePink: '#a9978c', granite: '#8a8784', graniteRed: '#a17a6e', graniteRose: '#b39488', talc: '#8d948c',
  roofGrey: '#8a9197', roofDark: '#5c6268', roofGreen: '#5f7f6a', roofRed: '#8f4a3b', tile: '#a5553e', copper: '#5f9a84', zinc: '#a3a8ab',
  iron: '#1c1f20', gold: '#c9a24b', glassDark: '#27323c', door: '#4a3122', doorGreen: '#2f4a3c', majolicaBlue: '#2d6d92', majolicaGreen: '#3d7b62', majolicaOchre: '#c79a3e',
};

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);

export function makeNouveau(K) {
  const { ctx, P, mats: M, hash } = K, T = ctx.mat.toon, tex = ctx.tex;
  const N = { C: NC, cur: null };

  // ============================================================================================ textures
  /** rough-hewn stone blocks: tile 2.4 m x 1.6 m, four courses of 0.4 m, random block lengths, chipped light / dark faces (white: the material colour tints it) */
  N.texRock = tex.draw(384, 256, (g, w, h) => {
    g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h);
    const ch = h / 4;
    for (let r = 0; r < 4; r++) {
      let x = -(hash(r, 7) * 60);
      for (let k = 0; x < w; k++) {
        const bw = 60 + hash(r, k, 3) * 70, v = 205 + Math.floor(hash(r, k, 5) * 50);
        g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x + 3, r * ch + 3, bw - 6, ch - 6);
        g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(x + 3, r * ch + 3, bw - 6, 5); g.fillRect(x + 3, r * ch + 3, 5, ch - 6);
        g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x + 3, (r + 1) * ch - 9, bw - 6, 6); g.fillRect(x + bw - 9, r * ch + 3, 6, ch - 6);
        for (let i = 0; i < 5; i++) { g.fillStyle = hash(r, k, i, 9) > 0.5 ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.13)'; g.fillRect(x + 8 + hash(r, k, i) * (bw - 26), r * ch + 9 + hash(r, k, i, 2) * (ch - 26), 6 + hash(i, k) * 12, 4 + hash(i, r) * 7); }
        x += bw;
      }
      g.fillStyle = '#8c8c8c'; g.fillRect(0, r * ch, w, 3);
    }
  }, { key: 'lmKam-rock', repeat: [1, 1] });
  /** smooth ashlar: tile 1.8 m x 0.9 m, two courses, thin joints */
  N.texAshlar = tex.draw(256, 128, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#b9b6b0'; g.fillRect(0, 0, w, 3); g.fillRect(0, h / 2, w, 3); g.fillRect(0, 0, 3, h / 2); g.fillRect(w / 2, h / 2, 3, h / 2);
    g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(w / 2, 3, w / 2, h / 2 - 3);
  }, { key: 'lmKam-ashlar', repeat: [1, 1] });
  /** stone balustrade strip (alpha cut-out): tile 0.9 m x 1 (three vase balusters between a plinth and a hand rail) */
  N.texBalusters = tex.draw(192, 192, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, 26); g.fillRect(0, h - 22, w, 22);
    for (let i = 0; i < 3; i++) {
      const cx = i * 64 + 32;
      g.beginPath(); g.moveTo(cx - 9, 26); g.lineTo(cx + 9, 26); g.lineTo(cx + 7, 60);
      g.bezierCurveTo(cx + 24, 96, cx + 22, 140, cx + 8, 150); g.lineTo(cx + 11, h - 22); g.lineTo(cx - 11, h - 22); g.lineTo(cx - 8, 150);
      g.bezierCurveTo(cx - 22, 140, cx - 24, 96, cx - 7, 60); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(cx + 4, 60, 6, 92); g.fillStyle = '#ffffff';
    }
    g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(0, 20, w, 6); g.fillRect(0, h - 22, w, 5);
  }, { key: 'lmKam-balusters', repeat: [1, 1] });
  /** wrought-iron balcony grille of the Art Nouveau houses (alpha cut-out): tile 1.2 m x 1: whiplash curves, a hand rail and a foot rail */
  N.texGrille = tex.draw(256, 192, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff'; g.lineCap = 'round';
    g.fillRect(0, 0, w, 10); g.fillRect(0, h - 12, w, 8); g.fillRect(0, 26, w, 5);
    g.lineWidth = 5;
    for (let i = 0; i < 4; i++) { const x = i * 64; g.fillRect(x - 3, 10, 6, h - 22); }
    g.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
      const x0 = i * 64, m = x0 + 32;
      g.beginPath(); g.moveTo(x0 + 6, h - 14); g.bezierCurveTo(x0 + 10, 110, m + 22, 120, m, 70); g.bezierCurveTo(m - 16, 44, m - 24, 80, m - 6, 86); g.stroke();
      g.beginPath(); g.moveTo(x0 + 58, h - 14); g.bezierCurveTo(x0 + 54, 110, m - 22, 120, m, 70); g.bezierCurveTo(m + 16, 44, m + 24, 80, m + 6, 86); g.stroke();
      g.beginPath(); g.arc(m, 48, 8, 0, Math.PI * 2); g.stroke();
    }
  }, { key: 'lmKam-grille', repeat: [1, 1] });
  /** plain bar railing (alpha cut-out): tile 0.6 m x 1: five bars between two rails (constructivist / plain tenement balconies) */
  N.texBars = tex.draw(128, 192, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, 9); g.fillRect(0, h - 14, w, 6); g.fillRect(0, 30, w, 4);
    for (let i = 0; i < 5; i++) g.fillRect(i * 25.6 + 10, 9, 5, h - 20);
  }, { key: 'lmKam-bars', repeat: [1, 1] });
  /** window atlas of the 1900s: 4 variants of 128 x 256: a top sash cut into small panes over two tall casements (the Northern Modern "small-pane" transom) */
  const nordAtlas = (frame, lit, key) => tex.draw(512, 256, (g) => {
    for (let i = 0; i < 4; i++) {
      const x0 = i * 128, warm = lit && (i === 0 || i === 2);
      g.fillStyle = lit ? '#000000' : frame; g.fillRect(x0, 0, 128, 256);
      const pane = (px, py, pw, ph) => {
        if (lit) { g.fillStyle = warm ? '#ffd890' : '#000000'; g.fillRect(px, py, pw, ph); return; }
        const gr = g.createLinearGradient(0, py, 0, py + ph);
        const c = [['#8fb6da', '#4a6f9a'], ['#3a465c', '#262f3f'], ['#a9c6de', '#6688b0'], ['#4f6078', '#2e3a4c']][i];
        gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]); g.fillStyle = gr; g.fillRect(px, py, pw, ph);
      };
      for (let c = 0; c < 4; c++) for (let r = 0; r < 2; r++) pane(x0 + 8 + c * 28.5, 8 + r * 33, 25, 29);
      pane(x0 + 8, 82, 53, 166); pane(x0 + 67, 82, 53, 166);
      if (!lit) {
        if (i === 1) { g.fillStyle = 'rgba(238,230,210,0.9)'; g.fillRect(x0 + 8, 82 + 40, 53, 126); g.fillRect(x0 + 67, 82 + 40, 53, 126); }
        if (i === 3) { g.fillStyle = 'rgba(216,224,236,0.85)'; g.fillRect(x0 + 8, 82, 53, 166); }
        g.fillStyle = 'rgba(255,255,255,0.16)'; g.beginPath(); g.moveTo(x0 + 20, 248); g.lineTo(x0 + 70, 82); g.lineTo(x0 + 88, 82); g.lineTo(x0 + 38, 248); g.fill();
      }
    }
  }, { key });
  /** lattice glazing of the big pointed arches / shop arcades: tile 1.0 m: square panes in thin dark bars, lit at night */
  const latAtlas = (lit, key) => tex.draw(128, 128, (g, w, h) => {
    if (lit) { g.fillStyle = '#ffcf86'; g.fillRect(0, 0, w, h); g.fillStyle = '#000000'; }
    else { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5b7694'); gr.addColorStop(1, '#2d3b4d'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(0, 0, w / 2, h / 2); g.fillStyle = '#20252b'; }
    g.fillRect(0, 0, w, 5); g.fillRect(0, 0, 5, h); g.fillRect(w / 2 - 2, 0, 5, h); g.fillRect(0, h / 2 - 2, w, 5);
  }, { key, repeat: [1, 1] });
  /** standing-seam sheet roof (tile 0.6 m) and plain fish-scale / tile roofs (tile 0.5 m): white, tinted by the material */
  N.texSeam = tex.draw(64, 64, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0.24)'; g.fillRect(0, 0, 4, h); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(4, 0, 3, h); g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(w / 2, 0, w / 2, h); }, { key: 'lmKam-seam', repeat: [1, 1] });
  N.texScale = tex.draw(128, 128, (g, w, h) => {
    g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 4; r++) for (let c = -1; c < 4; c++) { const x = c * 32 + (r % 2) * 16, y = r * 32; g.fillStyle = hash(r, c, 4) > 0.5 ? '#ffffff' : '#dcdcdc'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 32, y); g.lineTo(x + 32, y + 18); g.arc(x + 16, y + 18, 16, 0, Math.PI); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2; g.beginPath(); g.arc(x + 16, y + 18, 16, 0, Math.PI); g.stroke(); }
  }, { key: 'lmKam-scale', repeat: [1, 1] });
  /** majolica frieze (tile 1.6 m x 0.8 m): stylised lilies and leaves in blue, green and ochre on a pale ground */
  N.texMajolica = tex.draw(256, 128, (g, w, h) => {
    g.fillStyle = '#d9d2bc'; g.fillRect(0, 0, w, h);
    g.fillStyle = NC.majolicaBlue; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10);
    for (let i = 0; i < 4; i++) {
      const cx = i * 64 + 32;
      g.fillStyle = NC.majolicaGreen; g.beginPath(); g.ellipse(cx - 14, 84, 9, 24, 0.5, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(cx + 14, 84, 9, 24, -0.5, 0, Math.PI * 2); g.fill(); g.fillRect(cx - 2, 50, 4, 62);
      g.fillStyle = i % 2 ? NC.majolicaOchre : NC.majolicaBlue; g.beginPath(); g.ellipse(cx, 38, 10, 20, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(cx - 13, 44, 7, 16, -0.6, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(cx + 13, 44, 7, 16, 0.6, 0, Math.PI * 2); g.fill();
    }
  }, { key: 'lmKam-majolica', repeat: [1, 1] });

  // ============================================================================================ materials
  const cache = new Map();
  const memo = (k, fn) => { if (!cache.has(k)) cache.set(k, fn()); return cache.get(k); };
  const cut = (m) => { K.decalMats.add(m); return m; };
  /** rough-hewn stone of a colour (socles, portals, "torn" granite of the Northern Modern) / smooth ashlar */
  N.rock = (hex) => memo('rock' + hex, () => T(hex, { map: N.texRock, paint: 0.04, name: 'lmKam-rock' + hex }));
  N.ashlar = (hex) => memo('ash' + hex, () => T(hex, { map: N.texAshlar, paint: 0.03, name: 'lmKam-ash' + hex }));
  N.seam = (hex) => memo('seam' + hex, () => T(hex, { map: N.texSeam, paint: 0.05, side: 'double', name: 'lmKam-seam' + hex }));
  N.scale = (hex) => memo('scale' + hex, () => T(hex, { map: N.texScale, paint: 0.04, side: 'double', name: 'lmKam-scale' + hex }));
  N.balMat = (hex) => memo('bal' + hex, () => cut(T(hex, { map: N.texBalusters, alphaTest: 0.5, side: 'double', paint: 0.02, name: 'lmKam-bal' + hex })));
  N.grilleMat = memo('grille', () => cut(T(NC.iron, { map: N.texGrille, alphaTest: 0.5, side: 'double', paint: 0, name: 'lmKam-grille' })));
  N.barsMat = memo('bars', () => cut(T(NC.iron, { map: N.texBars, alphaTest: 0.5, side: 'double', paint: 0, name: 'lmKam-bars' })));
  N.majolica = memo('maj', () => T('#ffffff', { map: N.texMajolica, paint: 0.01, name: 'lmKam-majolica' }));
  const glassMat = (map, lit, name) => { const m = T('#ffffff', { map, name, paint: 0.02 }); m.emissive = new THREE.Color('#ffffff'); m.emissiveMap = lit; m.emissiveIntensity = 0; K.nightMats.push(m); return m; };
  const nordLit = nordAtlas('#000', true, 'lmKam-nord-lit');
  N.winNordWhite = glassMat(nordAtlas('#efece4', false, 'lmKam-nord-white'), nordLit, 'lmKam-winNW');
  N.winNordBrown = glassMat(nordAtlas('#5b3f2e', false, 'lmKam-nord-brown'), nordLit, 'lmKam-winNB');
  N.winNordGreen = glassMat(nordAtlas('#3f5347', false, 'lmKam-nord-green'), nordLit, 'lmKam-winNG');
  N.lattice = glassMat(latAtlas(false, 'lmKam-lattice'), latAtlas(true, 'lmKam-lattice-lit'), 'lmKam-lattice');
  const glassOf = (frame) => (frame === 'white' ? M.winWhite : frame === 'nordWhite' ? N.winNordWhite : frame === 'nordBrown' ? N.winNordBrown : frame === 'nordGreen' ? N.winNordGreen : M.winBrown);
  N.mats = {
    stone: T(NC.stone, { paint: 0.04 }), stoneDark: T(NC.stoneDark, { paint: 0.04 }), stoneLight: T(NC.stoneLight, { paint: 0.04 }), stonePink: T(NC.stonePink, { paint: 0.04 }),
    iron: T(NC.iron, { paint: 0 }), door: T(NC.door), doorGreen: T(NC.doorGreen), glassDark: T(NC.glassDark, { paint: 0.01 }), gold: T(NC.gold, { emissive: '#3a2a08', emissiveIntensity: 0.4, paint: 0 }),
    zinc: T(NC.zinc), copper: T(NC.copper), roofDark: T(NC.roofDark, { side: 'double' }),
  };

  // ============================================================================================ edge frames, street plates, labels
  /** run fn(len, frame) in the frame of edge e; N.cur = { e, f, keep: [[u0, u1, y0, y1], ...] plates already hung on this wall } */
  N.onEdge = (e, fn) => onEdge(P, e, (len, f) => N.withEdge(e, f, len, fn));
  /** the same when the frame of the edge is already pushed (house.js calls cfg.front inside it) */
  N.withEdge = (e, f, len, fn) => {
    const prev = N.cur, keep = [];
    const labels = ctx.services.labels;
    if (labels && labels.list) {
      for (const l of N.labelCache || (N.labelCache = labels.list().slice())) {
        if (l.nx * e.n[0] + l.nz * e.n[1] < 0.8) continue;
        const dx = l.x - f.x, dz = l.z - f.z, d = dx * e.n[0] + dz * e.n[1], u = dx * f.xa[0] + dz * f.xa[1];
        if (d < -0.4 || d > 0.8 || u < -l.w || u > len + l.w) continue;
        keep.push([u - l.w / 2 - 0.12, u + l.w / 2 + 0.12, l.y - l.h / 2 - 0.1, l.y + l.h / 2 + 0.1]);
      }
    }
    N.cur = { e, f, len, keep };
    try { return fn(len, f); } finally { N.cur = prev; }
  };
  /** true when the rectangle [u0, u1] x [y0, y1] of the current wall holds a street plate (keep glass and deep trim away from it) */
  N.blocked = (u0, u1, y0, y1) => !!(N.cur && N.cur.keep.some((k) => u1 > k[0] && u0 < k[1] && y1 > k[2] && y0 < k[3]));
  /** reserve a label rectangle (centre u, y; size w x h; standoff s) on the current wall: false = occupied, do not draw */
  N.reserve = (u, y, w, h, kind = 'shop', s = 0.04) => {
    const c = N.cur, labels = ctx.services.labels; if (!c) return true;
    if (N.blocked(u - w / 2, u + w / 2, y - h / 2, y + h / 2)) return false;
    if (!labels) return true;
    const x = c.f.x + c.f.xa[0] * u + c.e.n[0] * s, z = c.f.z + c.f.xa[1] * u + c.e.n[1] * s;
    return labels.reserve((c.e.rec && c.e.rec.id) || 0, x, y, z, w, h, c.e.n[0], c.e.n[1], kind);
  };
  /** world position of a point of the current facade frame (u along, d out) */
  N.world = (u, d = 0) => { const c = N.cur; return [c.f.x + c.f.xa[0] * u + c.e.n[0] * d, c.f.z + c.f.xa[1] * u + c.e.n[1] * d]; };

  /**
   * A flat board with lines of text on the current wall (shop fascia, theatre board, memorial plaque): centre u, y; size w x h; reserves its rectangle first (false = not drawn).
   * o = { bg, fg, rim, font, weight, z (standoff), kind, px (texture width), transparent (letters only, no board) }
   */
  N.board = (u, y, w, h, lines, o = {}) => {
    const z = o.z ?? 0.04; if (!N.reserve(u, y, w, h, o.kind || 'shop', z)) return false;
    const pw = o.px || 512, ph = Math.max(32, Math.round((pw * h) / w / 8) * 8), key = 'lmKam-board|' + lines.join('/') + '|' + pw + 'x' + ph + '|' + (o.bg || '') + (o.fg || '') + (o.rim || '') + (o.transparent ? 't' : '');
    const map = tex.draw(pw, ph, (g) => {
      if (o.transparent) g.clearRect(0, 0, pw, ph); else { g.fillStyle = o.bg || '#2b2622'; g.fillRect(0, 0, pw, ph); }
      if (o.rim) { g.strokeStyle = o.rim; g.lineWidth = Math.max(3, ph * 0.035); g.strokeRect(g.lineWidth, g.lineWidth, pw - 2 * g.lineWidth, ph - 2 * g.lineWidth); }
      g.fillStyle = o.fg || '#f0e6cf'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const n = lines.length, pad = o.rim ? ph * 0.12 : ph * 0.06, av = ph - 2 * pad;
      lines.forEach((t, i) => tex.fitText(g, t, pw / 2, pad + (av * (i + 0.5)) / n, pw * (o.fill ?? 0.88), (av / n) * (o.size ?? 0.8), (o.fonts && o.fonts[i]) || o.font || tex.FONTS.serif, (o.weights && o.weights[i]) || o.weight || 600));
    }, { key });
    const m = T('#ffffff', { map, name: key.slice(0, 60), paint: 0, alphaTest: o.transparent ? 0.45 : 0, side: o.transparent ? 'double' : 'front' });
    if (o.transparent) cut(m);
    K.plane(m, u - w / 2, u + w / 2, y - h / 2, y + h / 2, z);
    if (o.frame) P.box(o.frame, u - w / 2 - 0.04, u + w / 2 + 0.04, y - h / 2 - 0.04, y + h / 2 + 0.04, 0, z - 0.008, 'k');
    return true;
  };

  /** ONE canvas for all generic shop fascias (32 cells of 256 x 64: a canvas per sign cost ~1.5 s of build time in the browser); names / bgs / fgs come from tenement.js */
  N.makeSignAtlas = (names, bgs, fgs) => {
    const map = tex.draw(1024, 512, (g) => {
      for (let k = 0; k < 32; k++) {
        const x = (k % 4) * 256, y = Math.floor(k / 4) * 64, c = k % bgs.length;
        g.fillStyle = bgs[c]; g.fillRect(x, y, 256, 64); g.fillStyle = fgs[c]; g.textAlign = 'center'; g.textBaseline = 'middle';
        tex.fitText(g, names[k % names.length], x + 128, y + 34, 226, 40, k % 2 ? tex.FONTS.serif : tex.FONTS.round, 600);
      }
    }, { key: 'lmKam-shopsigns' });
    return T('#ffffff', { map, name: 'lmKam-shopsigns', paint: 0 });
  };
  /** a shop fascia from the atlas: centre u, y; size w x h; k = cell index; reserves its rectangle first */
  N.shopSign = (mat, u, y, w, h, k, z = 0.05) => {
    if (!N.reserve(u, y, w, h, 'shop', z)) return false;
    const col = k % 4, row = Math.floor(k / 4) % 8, u0 = col / 4 + 0.003, u1 = (col + 1) / 4 - 0.003, v1 = 1 - row / 8 - 0.004, v0 = 1 - (row + 1) / 8 + 0.004;
    K.plane(mat, u - w / 2, u + w / 2, y - h / 2, y + h / 2, z, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
    return true;
  };

  // ============================================================================================ window surround templates
  const tpls = new Map();
  const tplOf = (key, fn) => { if (!tpls.has(key)) tpls.set(key, K.capture(fn)); return tpls.get(key); };
  const r2 = (v) => Math.round(v * 100) / 100;
  let matId = 0; const ids = new WeakMap(); const idOf = (m) => { if (!ids.has(m)) ids.set(m, ++matId); return ids.get(m); };
  /** surround of a window w x h (sill at y = 0, centre x = 0) in a style; mat = trim / stone material */
  function surroundTpl(style, w, h, mat, o = {}) {
    const key = [style, r2(w), r2(h), idOf(mat), o.sw || 0, o.d || 0, o.hood || '', o.sill === false ? 0 : 1, o.key2 ? idOf(o.key2) : 0].join('|');
    return tplOf(key, () => {
      const a = w / 2;
      if (style === 'plain' || style === 'key' || style === 'hood') {
        const sw = o.sw || 0.14, d = o.d || 0.07;
        P.box(mat, -a - sw, -a, 0, h + sw, 0, d, 'kbt'); P.box(mat, a, a + sw, 0, h + sw, 0, d, 'kbt'); P.box(mat, -a, a, h, h + sw, 0, d, 'kt');
        if (o.sill !== false) P.box(mat, -a - sw - 0.05, a + sw + 0.05, -0.1, 0, 0, d + 0.08, 'k');
        if (style === 'key') { P.box(o.key2 || mat, -0.16, 0.16, h - 0.02, h + sw + 0.2, 0, d + 0.06, 'k'); if (o.sill !== false) for (const s of [-1, 1]) P.box(mat, s * (a - 0.1) - 0.08, s * (a - 0.1) + 0.08, -0.34, -0.1, 0, d + 0.02, 'kt'); }
        if (style === 'hood') { P.box(mat, -a - sw - 0.12, a + sw + 0.12, h + sw + 0.12, h + sw + 0.26, 0, d + 0.14, 'k'); P.box(mat, -a - sw, a + sw, h + sw, h + sw + 0.12, 0, d + 0.03, 'kt'); }
      } else if (style === 'rustic') {
        // toothed stone blocks on the jambs, a flat arch with two voussoirs and a tall keystone, a sill on three corbel blocks (House with Towers, photos 01 07)
        const sw = 0.2, d = 0.09;
        P.box(mat, -a - sw, -a, 0, h, 0, d, 'kbt'); P.box(mat, a, a + sw, 0, h, 0, d, 'kbt');
        for (let y = 0.08; y + 0.3 < h; y += 0.72) for (const s of [-1, 1]) P.box(mat, Math.min(s * (a + sw), s * (a + sw + 0.2)), Math.max(s * (a + sw), s * (a + sw + 0.2)), y, y + 0.34, 0, d + 0.03, s < 0 ? 'ktr' : 'ktl');
        P.box(mat, -a - sw - 0.2, a + sw + 0.2, h, h + 0.36, 0, d + 0.02, 'kt');
        for (const s of [-1, 1]) P.box(mat, s * (a * 0.55) - 0.17, s * (a * 0.55) + 0.17, h - 0.02, h + 0.48, 0, d + 0.08, 'kt');
        P.box(o.key2 || mat, -0.22, 0.22, h - 0.06, h + 0.66, 0, d + 0.14, 'k');
        if (o.sill !== false) { P.box(mat, -a - sw - 0.25, a + sw + 0.25, -0.18, 0, 0, 0.2, 'k'); for (let i = 0; i < 3; i++) { const x = -a + 0.12 + ((w - 0.24) * i) / 2; P.box(mat, x - 0.1, x + 0.1, -0.42, -0.18, 0, 0.14, 'kt'); } }
      } else if (style === 'block') {
        // plain windows of the same house: a sill on two blocks and a single stepped keystone
        P.box(mat, -a - 0.12, a + 0.12, -0.16, 0, 0, 0.16, 'k'); for (const s of [-1, 1]) P.box(mat, s * (a - 0.12) - 0.09, s * (a - 0.12) + 0.09, -0.38, -0.16, 0, 0.12, 'kt');
        P.box(mat, -0.2, 0.2, h - 0.04, h + 0.5, 0, 0.15, 'k');
      } else if (style === 'arch') {
        const sw = o.sw || 0.16, d = o.d || 0.08;
        archRing(mat, 0, 0, w, h, sw, d);
        if (o.sill !== false) P.box(mat, -a - sw - 0.05, a + sw + 0.05, -0.1, 0, 0, d + 0.08, 'k');
        if (o.key2) P.box(o.key2, -0.15, 0.15, h - 0.05, h + sw + 0.18, 0, d + 0.06, 'k');
      } else if (style === 'nord') {
        // Northern Modern: no frame, a thin sill and a narrow brow
        P.box(mat, -a - 0.06, a + 0.06, -0.08, 0, 0, 0.1, 'k'); P.box(mat, -a - 0.04, a + 0.04, h, h + 0.07, 0, 0.07, 'k');
      } else if (style === 'slab') {
        // constructivist / 1960s: a flat concrete frame
        const sw = o.sw || 0.1, d = o.d || 0.06;
        P.box(mat, -a - sw, -a, -sw, h + sw, 0, d, 'k'); P.box(mat, a, a + sw, -sw, h + sw, 0, d, 'k'); P.box(mat, -a, a, h, h + sw, 0, d, 'k'); P.box(mat, -a, a, -sw, 0, 0, d, 'k');
      }
    });
  }
  /** stucco ring of a round-headed opening (front face, outer edge and reveal only: no back faces): centre x, sill y0, width w, total height h, ring width sw, depth d */
  function archRing(mat, x, y0, w, h, sw, d, n = 8) {
    const r = w / 2, R = r + sw, ys = y0 + Math.max(0.05, h - r), a = [], b = [];
    a.push([x + r, y0]); b.push([x + R, y0]);
    for (let i = 0; i <= n; i++) { const t = (Math.PI * i) / n; a.push([x + Math.cos(t) * r, ys + Math.sin(t) * r]); b.push([x + Math.cos(t) * R, ys + Math.sin(t) * R]); }
    a.push([x - r, y0]); b.push([x - R, y0]);
    for (let i = 0; i + 1 < a.length; i++) {
      const p = a[i], q = a[i + 1], P2 = b[i], Q2 = b[i + 1], mx = (P2[0] + Q2[0]) / 2 - x, my = Math.max(0, (P2[1] + Q2[1]) / 2 - ys);
      P.quad(mat, [p[0], p[1], d], [P2[0], P2[1], d], [Q2[0], Q2[1], d], [q[0], q[1], d], [0, 0, 1]);
      P.quad(mat, [P2[0], P2[1], 0], [P2[0], P2[1], d], [Q2[0], Q2[1], d], [Q2[0], Q2[1], 0], [mx, my, 0]);
      P.quad(mat, [p[0], p[1], 0.05], [p[0], p[1], d], [q[0], q[1], d], [q[0], q[1], 0.05], [-mx, -my, 0]);
    }
  }
  N.archRing = archRing;
  /** a round-headed flat fill (glass, niche, dark gate) with uv in metres: centre x, bottom y0, width w, total height h, at depth z */
  N.archFill = (mat, x, y0, w, h, z = 0.03) => {
    const sh = new THREE.Shape(); archPath(sh, 0, 0, w, Math.max(0.05, h - w / 2), false);
    const g = new THREE.ShapeGeometry(sh, 10), pa = g.attributes.position, ua = g.attributes.uv;
    for (let i = 0; i < pa.count; i++) ua.setXY(i, pa.getX(i), pa.getY(i));
    P.geo(mat, g, x, y0, z); g.dispose();
  };
  let seed = 0;
  /** one window: o = { x, y (sill), w, h, style, mat (trim), frame 'brown'|'white'|'nordWhite'|'nordBrown'|'nordGreen', head 'flat'|'arch', v, sw, d, sill, key2 } */
  N.window = (o) => {
    const w = o.w ?? 1.2, h = o.h ?? 2.0, style = o.style || 'plain', head = style === 'arch' ? 'arch' : (o.head || 'flat');
    const v = o.v ?? Math.floor(hash(++seed, o.x, o.y) * 4) % 4;
    K.glass(glassOf(o.frame), o.x, o.y, w, h, head, v, 0.05);
    if (style !== 'none') P.stamp(surroundTpl(style, w, h, o.mat || M.trim, o), o.x, o.y, 0);
  };

  // ============================================================================================ elevation by data
  /**
   * N.elevation(len, S) -> xs (bay centres).  S = {
   *   wall: material of the field, H: top of the wall, z: 0,
   *   base: { h, mat, tile, tileY } optional ground-floor band drawn 1 cm in front of the field (rustication / stone),
   *   x0, x1: window zone (default 1.1 .. len - 1.1), pitch, xs: explicit centres, skip: [[u0, u1], ...] zones without windows (erkers, portals),
   *   floors: [{ y (sill), h, w, style, mat, frame, head, key2, sw, d, sill, at: (i, x, n) => false | override }], holes: [[u0, u1, h], ...] open passages,
   *   trim, frame: defaults for the floors }
   */
  N.elevation = (len, S) => {
    // S.holes: [[u0, u1, h], ...] = open passages through the wall (a metro doorway): the field and the base band are drawn around them
    const holed = (mat, x0, x1, y0, y1, tile, z, tileY) => {
      let x = x0;
      for (const [a, b, h] of (S.holes || []).filter((q) => q[1] > x0 && q[0] < x1 && q[2] > y0).sort((p, q) => p[0] - q[0])) {
        if (a > x + 0.01) K.wallQuad(mat, x, a, y0, y1, tile, z, tileY);
        if (h < y1 - 0.01) K.wallQuad(mat, Math.max(x, a), Math.min(x1, b), h, y1, tile, z, tileY);
        x = Math.max(x, b);
      }
      if (x < x1 - 0.01) K.wallQuad(mat, x, x1, y0, y1, tile, z, tileY);
    };
    holed(S.wall, 0, len, S.y0 ?? 0, S.H, 3, 0, 3);
    if (S.base) holed(S.base.mat, 0, len, 0, S.base.h, S.base.tile ?? 2.4, 0.012, S.base.tileY ?? (S.base.tile ?? 2.4) / 1.5);
    const x0 = S.x0 ?? 1.1, x1 = S.x1 ?? len - 1.1;
    const xs = S.xs || (x1 - x0 > 1 ? K.bays(x0, x1, S.pitch ?? 3.0) : []);
    const skipped = (x, hw) => (S.skip || []).some(([a, b]) => x + hw > a && x - hw < b);
    for (const F of S.floors || []) {
      xs.forEach((x, i) => {
        let o = { x, y: F.y, w: F.w ?? 1.2, h: F.h, style: F.style, mat: F.mat || S.trim, frame: F.frame || S.frame, head: F.head, key2: F.key2, sw: F.sw, d: F.d, sill: F.sill };
        if (F.at) { const r = F.at(i, x, xs.length); if (r === false) return; if (r) o = { ...o, ...r }; }
        if (skipped(o.x, o.w / 2)) return;
        if (o.y < 4.6 && N.blocked(o.x - o.w / 2 - 0.2, o.x + o.w / 2 + 0.2, o.y - 0.2, o.y + o.h + 0.3)) return;
        N.window(o);
      });
    }
    return xs;
  };

  // ============================================================================================ small bodies
  /** toothed quoin blocks up a wall corner: x = corner position, dir = +1 the blocks grow to +x, -1 to -x */
  N.quoins = (mat, x, y0, y1, dir = 1, o = {}) => {
    const wl = o.long ?? 0.62, ch = o.h ?? 0.5, n = Math.max(1, Math.round((y1 - y0) / (2 * ch)));
    P.quad(mat, [x, y0, 0.02], [x + dir * wl, y0, 0.02], [x + dir * wl, y1, 0.02], [x, y1, 0.02], [0, 0, 1], [[0, 0], [1, 0], [1, n], [0, n]]);
  };
  /** the material of N.quoins: an opaque strip in the wall colour with a long and a short stone block per tile (u = 0 is the corner) */
  N.quoinMat = (wallHex, stoneHex) => memo('quoin' + wallHex + stoneHex, () => T('#ffffff', { paint: 0.04, name: 'lmKam-quoin' + wallHex + stoneHex, map: tex.draw(64, 128, (g, w, h) => {
    g.fillStyle = wallHex; g.fillRect(0, 0, w, h); g.fillStyle = stoneHex; g.fillRect(0, 3, w, h / 2 - 6); g.fillRect(0, h / 2 + 3, w * 0.54, h / 2 - 6);
    g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(0, 3, w, 4); g.fillRect(0, h / 2 + 3, w * 0.54, 4); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, h / 2 - 7, w, 4); g.fillRect(0, h - 7, w * 0.54, 4); g.fillRect(w * 0.54 - 3, h / 2 + 3, 3, h / 2 - 6); g.fillRect(w - 3, 3, 3, h / 2 - 6);
  }, { key: 'lmKam-quoin' + wallHex + stoneHex, repeat: [1, 1] }) }));
  let _disc = null; const discGeo = () => (_disc ||= new THREE.CylinderGeometry(1, 1, 1, 20).rotateX(Math.PI / 2));
  let _circle = null;
  /** unit disc facing +z with a planar uv (clock dials, medallions) */
  N.circle = () => (_circle ||= new THREE.CircleGeometry(1, 28));
  /** round / oval window: a stone ring with a dark glass disc (sy = height / width) */
  N.oculus = (x, y, r, mat, sy = 1, o = {}) => {
    const rw = o.ring ?? 0.16, d = o.d ?? 0.1;
    P.geo(mat || M.trim, discGeo(), x, y, d / 2, 0, 0, 0, r + rw, (r + rw) * sy, d);
    P.geo(N.mats.glassDark, discGeo(), x, y, d + 0.012, 0, 0, 0, r, r * sy, 0.024);
  };
  /** stone balustrade as a textured strip (roof parapets, high balconies): piers every ~gap m, a strip of balusters between them at depth z (front face) */
  N.parapet = (x0, x1, y, z, o = {}) => {
    const h = o.h ?? 0.95, mat = o.mat || N.mats.stoneLight, hex = o.hex || NC.stoneLight, gap = o.gap ?? 3.0, pw = o.pier ?? 0.42, t = o.t ?? 0.3;
    const n = Math.max(1, Math.round((x1 - x0) / gap)), step = (x1 - x0) / n;
    for (let i = 0; i <= n; i++) {
      const x = x0 + i * step; if ((i === 0 && o.endL === false) || (i === n && o.endR === false)) continue;
      P.box(mat, x - pw / 2, x + pw / 2, y, y + h + 0.08, z - t - 0.04, z + 0.04, 'b');
      if (o.finial) { P.box(mat, x - pw / 2 - 0.05, x + pw / 2 + 0.05, y + h + 0.08, y + h + 0.18, z - t - 0.09, z + 0.09, 'b'); P.cyl(mat, [x, y + h + 0.18, z - t / 2], [x, y + h + 0.3, z - t / 2], 0.08, 0.12, 6, false); K.P.geo(mat, sphereGeo(), x, y + h + 0.44, z - t / 2, 0, 0, 0, 0.17); }
    }
    const bm = N.balMat(hex);
    for (let i = 0; i < n; i++) {
      const a = x0 + i * step + pw / 2, b = x0 + (i + 1) * step - pw / 2; if (b - a < 0.2) continue;
      const rep = Math.max(1, Math.round((b - a) / 0.9));
      P.quad(bm, [a, y, z - t / 2], [b, y, z - t / 2], [b, y + h, z - t / 2], [a, y + h, z - t / 2], [0, 0, 1], [[0, 0], [rep, 0], [rep, 1], [0, 1]]);
      P.box(mat, a, b, y + h - 0.12, y + h, z - t, z, 'lr'); P.box(mat, a, b, y, y + 0.1, z - t, z, 'lrb');
    }
  };
  let _sphere = null; const sphereGeo = () => (_sphere ||= new THREE.SphereGeometry(1, 10, 7));
  N.ball = (mat, x, y, z, r) => P.geo(mat, sphereGeo(), x, y, z, 0, 0, 0, r);
  /** stone balcony: a slab on big corbel blocks with a baluster strip in front and on the sides.  y = floor of the balcony */
  N.stoneBalcony = (x0, x1, y, d = 0.95, o = {}) => {
    const mat = o.mat || N.mats.stone, hex = o.hex || NC.stone, h = o.h ?? 0.9, bm = N.balMat(o.balHex || hex);
    P.box(mat, x0, x1, y - 0.22, y, 0, d, 'k');
    if (o.corbels !== false) for (const cx of [x0 + 0.28, x1 - 0.28]) { P.box(mat, cx - 0.16, cx + 0.16, y - 0.62, y - 0.22, 0, d * 0.78, 'kt'); P.box(mat, cx - 0.13, cx + 0.13, y - 1.0, y - 0.62, 0, d * 0.45, 'kt'); }
    const rep = Math.max(1, Math.round((x1 - x0) / 0.9));
    P.quad(bm, [x0 + 0.1, y, d - 0.12], [x1 - 0.1, y, d - 0.12], [x1 - 0.1, y + h, d - 0.12], [x0 + 0.1, y + h, d - 0.12], [0, 0, 1], [[0, 0], [rep, 0], [rep, 1], [0, 1]]);
    for (const x of [x0 + 0.1, x1 - 0.1]) P.quad(bm, [x, y, 0.05], [x, y, d - 0.12], [x, y + h, d - 0.12], [x, y + h, 0.05], [x < (x0 + x1) / 2 ? -1 : 1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    for (const x of [x0 + 0.1, x1 - 0.1]) P.box(mat, x - 0.1, x + 0.1, y, y + h + 0.06, d - 0.22, d - 0.02, 'b');
    P.box(mat, x0, x1, y + h - 0.1, y + h, d - 0.2, d - 0.04, 'lr');
  };
  /** iron balcony with an Art Nouveau grille (texture) on a thin slab with two brackets.  kind 'grille' | 'bars' */
  N.ironBalcony = (x0, x1, y, d = 0.75, o = {}) => {
    const slab = o.slabMat || M.trim, gm = o.kind === 'bars' ? N.barsMat : N.grilleMat, h = o.h ?? 0.95, tile = o.kind === 'bars' ? 0.6 : 1.2;
    P.box(slab, x0, x1, y - 0.14, y, 0, d, 'k');
    if (o.brackets !== false) for (const cx of [x0 + 0.2, x1 - 0.2]) P.box(slab, cx - 0.06, cx + 0.06, y - 0.55, y - 0.14, 0, d * 0.7, 'kt');
    const rep = Math.max(1, Math.round((x1 - x0) / tile));
    P.quad(gm, [x0, y, d - 0.03], [x1, y, d - 0.03], [x1, y + h, d - 0.03], [x0, y + h, d - 0.03], [0, 0, 1], [[0, 0], [rep, 0], [rep, 1], [0, 1]]);
    for (const x of [x0 + 0.02, x1 - 0.02]) P.quad(gm, [x, y, 0.04], [x, y, d - 0.03], [x, y + h, d - 0.03], [x, y + h, 0.04], [x < (x0 + x1) / 2 ? -1 : 1, 0, 0], [[0, 0], [0.6, 0], [0.6, 1], [0, 1]]);
  };

  // ============================================================================================ pointed arches
  const geos = new Map();
  /** outline of a pointed arch: centre x, bottom y0, width w, springing at ys, apex at ya (ya - ys >= w / 2) as points (counter clockwise from the bottom left) */
  function lancetPts(x, y0, w, ys, ya, n = 7) {
    const a = w / 2, R = Math.max(ya - ys, a * 1.001), c = (R * R - a * a) / (2 * a), r = a + c, pts = [[x - a, y0], [x + a, y0]];
    const t1 = Math.atan2(R, c);                                               // right arc: centre (x - c, ys), from angle 0 up to the apex
    for (let i = 0; i <= n; i++) { const t = (t1 * i) / n; pts.push([x - c + Math.cos(t) * r, ys + Math.sin(t) * r]); }
    for (let i = n - 1; i >= 0; i--) { const t = (t1 * i) / n; pts.push([x + c - Math.cos(t) * r, ys + Math.sin(t) * r]); }
    return pts;
  }
  const shapeOf = (pts) => { const s = new THREE.Shape(); pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]))); s.closePath(); return s; };
  /**
   * A pointed (lancet) opening with a stone ring: o = { x, y0, w, ys (springing), ya (apex), sw (ring width), d (ring depth), mat (stone), fill: 'lattice' | 'gate' | 'door' | 'dark' | 'open',
   *   teeth (number of projecting voussoir blocks), doorMat, doorW }
   */
  N.lancet = (o) => {
    const { x, w, ys, ya } = o, y0 = o.y0 ?? 0, sw = o.sw ?? 0.42, d = o.d ?? 0.2, mat = o.mat || N.mats.stone;
    const key = ['lan', r2(w), r2(ys - y0), r2(ya - y0), sw, d].join('|');
    if (!geos.has(key)) {
      const outer = shapeOf(lancetPts(0, 0, w + 2 * sw, ys - y0, ya - y0 + sw * 1.15));
      outer.holes.push(new THREE.Path(lancetPts(0, 0, w, ys - y0, ya - y0).reverse().map((p) => new THREE.Vector2(p[0], p[1]))));
      const g = new THREE.ExtrudeGeometry(outer, { depth: d, bevelEnabled: false });
      const fillG = new THREE.ShapeGeometry(shapeOf(lancetPts(0, 0, w, ys - y0, ya - y0)));
      const pa = fillG.attributes.position, ua = fillG.attributes.uv; for (let i = 0; i < pa.count; i++) ua.setXY(i, pa.getX(i), pa.getY(i));
      geos.set(key, { g, fillG });
    }
    const G = geos.get(key);
    P.geo(mat, G.g, x, y0, 0);
    const fill = o.fill || 'lattice';
    if (fill !== 'open') P.geo(fill === 'lattice' || fill === 'door' ? N.lattice : fill === 'gate' ? N.mats.glassDark : N.mats.glassDark, G.fillG, x, y0, 0.05);
    if (fill === 'door' || fill === 'gate') {
      const dw = Math.min(o.doorW ?? 2.0, w - 0.5), dh = o.doorH ?? Math.min(2.7, ys - y0);
      if (fill === 'door') { P.box(o.doorMat || N.mats.door, x - dw / 2, x + dw / 2, y0, y0 + dh, 0.05, 0.13, 'kb'); P.box(N.mats.iron, x - 0.02, x + 0.02, y0, y0 + dh, 0.13, 0.15, 'kb'); P.box(mat, x - dw / 2 - 0.12, x + dw / 2 + 0.12, y0 + dh, y0 + dh + 0.16, 0.05, 0.16, 'k'); }
      else { const rep = Math.max(1, Math.round(w / 0.6)); P.quad(N.barsMat, [x - w / 2, y0, 0.1], [x + w / 2, y0, 0.1], [x + w / 2, ys, 0.1], [x - w / 2, ys, 0.1], [0, 0, 1], [[0, 0], [rep, 0], [rep, (ys - y0) / 2.2], [0, (ys - y0) / 2.2]]); }
    }
    // projecting voussoir blocks around the arc (the toothed outline of the Belogrud arches) + a keystone
    const nT = o.teeth ?? 0;
    if (nT) {
      const a = w / 2 + sw / 2, R = Math.max(ya - ys, w / 2 * 1.001) + sw * 0.6, c = (R * R - a * a) / (2 * a), r = a + c, t1 = Math.atan2(R, c);
      for (let i = 0; i < nT; i++) {
        const t = t1 * (0.12 + (0.8 * i) / Math.max(1, nT - 1));
        for (const s of [1, -1]) { const px = x + s * (-c + Math.cos(t) * r), py = ys + Math.sin(t) * r; P.geo(mat, UNIT_BOX, px, py, d / 2 + 0.03, 0, 0, s * t, sw + 0.3, 0.34, d + 0.06); }
      }
      P.geo(mat, UNIT_BOX, x, ya + sw * 0.75, d / 2 + 0.06, 0, 0, 0, 0.46, sw * 1.9, d + 0.12);
    }
  };

  // ============================================================================================ bay windows (erkers)
  /**
   * N.erker(u, w, d, y0, y1, S): a bay window body on the current wall.  S = { plan: 'trap' (chamfer c) | 'box' | 'round' (n facets), c, wall (mat), face: (len, k, n) => draw windows in the frame
   *   of face k, corbel: 'steps' | 'brackets' | 'none', corbelMat, top: 'balcony' | 'slab' | 'tent' | 'none', topMat, rail: 'stone' | 'iron', bands: [[y0, y1, d, mat], ...] }
   * Returns the plan points [[x, z], ...] in the facade frame.
   */
  N.erker = (u, w, d, y0, y1, S = {}) => {
    const plan = S.plan || 'trap', pts = [];
    if (plan === 'round') { const n = S.n ?? 5; for (let i = 0; i <= n; i++) { const t = Math.PI * (1 - i / n); pts.push([u + Math.cos(t) * w / 2, Math.sin(t) * d]); } }
    else { const c = plan === 'box' ? 0 : (S.c ?? Math.min(d, w * 0.28)); pts.push([u - w / 2, 0]); if (c > 0.01) pts.push([u - w / 2 + c, d]); else pts.push([u - w / 2, d]); pts.push(c > 0.01 ? [u + w / 2 - c, d] : [u + w / 2, d]); pts.push([u + w / 2, 0]); }
    const wall = S.wall || M.trim, nF = pts.length - 1;
    for (let k = 0; k < nF; k++) {
      const a = pts[k], b = pts[k + 1], dx = b[0] - a[0], dz = b[1] - a[1], fl = Math.hypot(dx, dz); if (fl < 0.05) continue;
      P.push(a[0], 0, a[1], Math.atan2(-dz, dx));
      K.wallQuad(wall, 0, fl, y0, y1, 3);
      for (const [by0, by1, bd, bm] of S.bands || []) P.box(bm, -0.02, fl + 0.02, by0, by1, 0, bd, 'k');
      if (S.face) S.face(fl, k, nF);
      P.pop();
    }
    P.cap(S.corbelMat || wall, pts, y0, false, 2); P.cap(S.topMat || wall, pts, y1, true, 2);
    const cm = S.corbelMat || wall;
    if ((S.corbel || 'steps') === 'steps') {
      // inverted stepped trays: each course is the plan shrunk toward the wall
      const n = S.steps ?? 3, hStep = S.stepH ?? 0.36;
      for (let i = 1; i <= n; i++) {
        const k = 1 - i / (n + 1), q = pts.map(([x, z]) => [u + (x - u) * (0.55 + 0.45 * k), z * k]);
        for (let j = 0; j + 1 < q.length; j++) { const a = q[j], b = q[j + 1], dx = b[0] - a[0], dz = b[1] - a[1], fl = Math.hypot(dx, dz); if (fl < 0.05) continue; P.push(a[0], 0, a[1], Math.atan2(-dz, dx)); K.wallQuad(cm, 0, fl, y0 - i * hStep, y0 - (i - 1) * hStep, 2); P.pop(); }
        P.cap(cm, q, y0 - i * hStep, false, 2);
      }
    } else if (S.corbel === 'brackets') {
      // two volute brackets under the front corners (photo 08)
      for (const bx of [u - w * 0.3, u + w * 0.3]) { P.box(cm, bx - 0.22, bx + 0.22, y0 - 0.45, y0, 0, d * 0.95, 'kt'); P.box(cm, bx - 0.19, bx + 0.19, y0 - 0.95, y0 - 0.45, 0, d * 0.62, 'kt'); P.box(cm, bx - 0.16, bx + 0.16, y0 - 1.5, y0 - 0.95, 0, d * 0.3, 'kt'); }
    }
    const top = S.top || 'balcony';
    if (top === 'balcony') {
      const h = 0.92, hex = S.railHex || NC.stone, rm = S.railMat || N.mats.stone;
      for (let k = 0; k < nF; k++) {
        const a = pts[k], b = pts[k + 1], dx = b[0] - a[0], dz = b[1] - a[1], fl = Math.hypot(dx, dz); if (fl < 0.05) continue;
        P.push(a[0], 0, a[1], Math.atan2(-dz, dx));
        if (S.rail === 'iron') { const rep = Math.max(1, Math.round(fl / 1.2)); P.quad(N.grilleMat, [0, y1, -0.04], [fl, y1, -0.04], [fl, y1 + h, -0.04], [0, y1 + h, -0.04], [0, 0, 1], [[0, 0], [rep, 0], [rep, 1], [0, 1]]); }
        else { const rep = Math.max(1, Math.round(fl / 0.9)); P.quad(N.balMat(hex), [0.08, y1, -0.1], [fl - 0.08, y1, -0.1], [fl - 0.08, y1 + h, -0.1], [0.08, y1 + h, -0.1], [0, 0, 1], [[0, 0], [rep, 0], [rep, 1], [0, 1]]); P.box(rm, 0, fl, y1 + h - 0.1, y1 + h, -0.2, 0, 'lr'); }
        P.pop();
      }
      if (S.rail !== 'iron') for (const p of pts.slice(1, -1)) P.box(rm, p[0] - 0.13, p[0] + 0.13, y1, y1 + h + 0.06, p[1] - 0.24, p[1] + 0.02, 'b');
    } else if (top === 'tent') {
      const th = S.tentH ?? 1.6, tm = S.tentMat || N.seam(NC.roofGrey), apex = [u, y1 + th, d * 0.25];
      for (let k = 0; k < nF; k++) { const a = pts[k], b = pts[k + 1]; P.fan(tm, [[a[0], y1, a[1]], [b[0], y1, b[1]], apex], [(b[1] - a[1]), 0.8, -(b[0] - a[0])]); }
    }
    return pts;
  };

  // ============================================================================================ gables, mansards, towers
  /** shaped attic gable standing on the cornice: kind 'tri' | 'round' | 'baroque' | 'step' | 'flat'; x0..x1, base y, height h; a slab of thickness t with its face at z */
  N.attic = (x0, x1, y, h, kind, mat, o = {}) => {
    const t = o.t ?? 0.45, z = o.z ?? 0, m = (x0 + x1) / 2, w = x1 - x0, s = new THREE.Shape();
    s.moveTo(x0, y);
    if (kind === 'tri') { s.lineTo(x1, y); s.lineTo(m, y + h); }
    else if (kind === 'round') { s.lineTo(x1, y); s.lineTo(x1, y + Math.max(0, h - w / 2)); s.absellipse(m, y + Math.max(0, h - w / 2), w / 2, Math.min(h, w / 2), 0, Math.PI, false); }
    else if (kind === 'baroque') { s.lineTo(x1, y); s.lineTo(x1, y + h * 0.3); s.bezierCurveTo(x1 - w * 0.05, y + h * 0.62, x1 - w * 0.22, y + h * 0.5, x1 - w * 0.26, y + h * 0.78); s.absarc(m, y + h * 0.78, w * 0.24, 0, Math.PI, false); s.bezierCurveTo(x0 + w * 0.22, y + h * 0.5, x0 + w * 0.05, y + h * 0.62, x0, y + h * 0.3); }
    else if (kind === 'step') { s.lineTo(x1, y); s.lineTo(x1, y + h * 0.4); s.lineTo(x1 - w * 0.2, y + h * 0.4); s.lineTo(x1 - w * 0.2, y + h * 0.75); s.lineTo(x1 - w * 0.36, y + h * 0.75); s.lineTo(x1 - w * 0.36, y + h); s.lineTo(x0 + w * 0.36, y + h); s.lineTo(x0 + w * 0.36, y + h * 0.75); s.lineTo(x0 + w * 0.2, y + h * 0.75); s.lineTo(x0 + w * 0.2, y + h * 0.4); s.lineTo(x0, y + h * 0.4); }
    else { s.lineTo(x1, y); s.lineTo(x1, y + h); s.lineTo(x0, y + h); }
    s.closePath();
    P.extrude(mat, s, z - t, t, 3, 8);
    if (o.window) { const ww = o.window.w ?? 1.0, wh = o.window.h ?? 1.2; N.window({ x: m, y: y + (o.window.y ?? 0.5), w: ww, h: wh, style: o.window.style || 'plain', mat: o.window.mat || M.trim, frame: o.window.frame, head: o.window.head }); }
    if (o.oculus) { P.cyl(N.mats.glassDark, [m, y + o.oculus.y, z + 0.02], [m, y + o.oculus.y, z + 0.05], o.oculus.r, o.oculus.r, 14, true); P.cyl(o.oculus.mat || M.trim, [m, y + o.oculus.y, z], [m, y + o.oculus.y, z + 0.035], o.oculus.r + 0.12, o.oculus.r + 0.12, 14, true); }
  };
  /**
   * Mansard / attic roof prism behind the cornice of the current wall: eave at depth `inset` behind the facade plane, a slope of `run` x `rise`, a flat top back to depth D, a back wall.
   * tL / tR = mitre tangents of the ends (cot of half the interior angle of the footprint corner: 1 for a right corner, 0 = a plain gable end).  dormers: [{ u, w, h }] lucarnes on the slope.
   */
  N.mansard = (u0, u1, y0, o = {}) => {
    const mat = o.mat || N.seam(NC.roofGrey), inset = o.inset ?? 0.5, run = o.run ?? 1.4, rise = o.rise ?? 2.6;
    let D = o.D ?? 5.5; const tL = o.tL ?? 0, tR = o.tR ?? 0;
    if ((u1 - u0) - (inset + D) * (Math.max(0, tL) + Math.max(0, tR)) < 0.4) D = Math.max(run + 0.2, ((u1 - u0) - 0.4) / Math.max(0.01, Math.max(0, tL) + Math.max(0, tR)) - inset);
    const z0 = -inset, z1 = -inset - run, z2 = -inset - Math.max(D, run + 0.2), y1 = y0 + rise;
    const xl = (z) => u0 - z * tL, xr = (z) => u1 + z * tR;
    P.fan(mat, [[xl(z0), y0, z0], [xr(z0), y0, z0], [xr(z1), y1, z1], [xl(z1), y1, z1]], [0, run, rise], (p) => [p[0] / 0.6, p[1] / 0.6]);
    P.fan(o.topMat || mat, [[xl(z1), y1, z1], [xr(z1), y1, z1], [xr(z2), y1, z2], [xl(z2), y1, z2]], [0, 1, 0], (p) => [p[0] / 0.6, p[2] / 0.6]);
    if (o.back !== false) P.fan(o.backMat || mat, [[xr(z2), y0, z2], [xl(z2), y0, z2], [xl(z2), y1, z2], [xr(z2), y1, z2]], [0, 0, -1], (p) => [p[0] / 0.6, p[1] / 0.6]);
    if (!tL) P.fan(o.endMat || mat, [[u0, y0, z0], [u0, y1, z1], [u0, y1, z2], [u0, y0, z2]], [-1, 0, 0], (p) => [p[2] / 0.6, p[1] / 0.6]);
    if (!tR) P.fan(o.endMat || mat, [[u1, y0, z0], [u1, y1, z1], [u1, y1, z2], [u1, y0, z2]], [1, 0, 0], (p) => [p[2] / 0.6, p[1] / 0.6]);
    for (const dm of o.dormers || []) {
      const w = dm.w ?? 1.3, h = Math.min(dm.h ?? 1.7, rise - 0.15), zf = z0 - 0.12, yb = y0 + 0.12, zs = z0 - run * ((yb + h - y0) / rise) - 0.02, fm = dm.mat || M.trim;
      const a = dm.u - w / 2, b = dm.u + w / 2;
      P.quad(fm, [a, yb, zf], [b, yb, zf], [b, yb + h, zf], [a, yb + h, zf], [0, 0, 1]);
      K.glass(glassOf(dm.frame), dm.u, yb + 0.22, w - 0.34, h - 0.44, dm.head || 'flat', dm.v ?? 1, zf + 0.03);
      P.fan(mat, [[a - 0.08, yb + h, zf + 0.1], [b + 0.08, yb + h, zf + 0.1], [b + 0.08, yb + h + 0.02, zs], [a - 0.08, yb + h + 0.02, zs]], [0, 1, 0]);
      for (const [x, nx] of [[a, -1], [b, 1]]) P.fan(fm, [[x, yb, zf], [x, yb + h, zf], [x, yb + h, zs]], [nx, 0, 0]);
    }
  };
  const lathes = new Map();
  /** lathe body (dome, onion, bell roof) of a profile [[r, y], ...] in unit sizes placed at (x, y, z) scaled by r / h */
  N.lathe = (mat, key, prof, x, y, z, r, h, seg = 16) => {
    const k = key + seg; if (!lathes.has(k)) lathes.set(k, new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p[0], p[1])), seg));
    P.geo(mat, lathes.get(k), x, y, z, 0, 0, 0, r, h, r);
  };
  N.PROF = {
    dome: [[1, 0], [0.98, 0.18], [0.9, 0.42], [0.74, 0.66], [0.5, 0.86], [0.24, 0.97], [0, 1]],
    bell: [[1.12, 0], [1.0, 0.06], [0.86, 0.2], [0.8, 0.42], [0.7, 0.62], [0.5, 0.8], [0.26, 0.93], [0, 1]],
    onion: [[0.55, 0], [0.8, 0.1], [1.0, 0.3], [1.02, 0.46], [0.9, 0.62], [0.6, 0.78], [0.3, 0.9], [0.1, 0.97], [0, 1]],
    cone: [[1, 0], [0, 1]],
    helmet: [[1.06, 0], [1.0, 0.05], [0.94, 0.22], [0.8, 0.44], [0.55, 0.62], [0.3, 0.74], [0.14, 0.86], [0.06, 1]],
  };
  /**
   * Round / polygonal corner tower in the CURRENT frame: centre (cx, cz), radius r, from y0 to y1, n facets; windows on the facets between the angles a0..a1 (radians, 0 = +z, clockwise seen
   * from above toward +x).  S = { wall, n, a0, a1, floors: [{ y, h, w, style, mat, frame }], every (facet step with a window), bands: [[y0, y1, d, mat]], top: { kind: 'dome'|'bell'|'onion'|'cone'|
   *   'helmet'|'tent'|'none', h, mat, r (roof radius factor), drum: { h, mat }, spire: h, ball } }
   */
  N.turret = (cx, cz, r, y0, y1, S = {}) => {
    const n = S.n ?? 12, a0 = S.a0 ?? -Math.PI, a1 = S.a1 ?? Math.PI, wall = S.wall || M.trim, dA = (a1 - a0) / n, Rf = r * Math.cos(dA / 2), fl = 2 * r * Math.sin(dA / 2);
    for (let i = 0; i < n; i++) {
      const a = a0 + ((a1 - a0) * (i + 0.5)) / n;
      P.push(cx + Math.sin(a) * Rf, 0, cz + Math.cos(a) * Rf, a);
      K.wallQuad(wall, -fl / 2, fl / 2, y0, y1, 3);
      for (const [by0, by1, bd, bm] of S.bands || []) P.box(bm, -fl / 2 - bd * 0.3, fl / 2 + bd * 0.3, by0, by1, 0, bd, 'k');
      if ((i % (S.every ?? 1)) === (S.phase ?? 0)) for (const F of S.floors || []) N.window({ x: 0, y: F.y, w: Math.min(F.w ?? 1.0, fl - 0.3), h: F.h, style: F.style, mat: F.mat || M.trim, frame: F.frame, head: F.head, key2: F.key2 });
      if (S.facet) S.facet(fl, i, n, a);
      P.pop();
    }
    const top = S.top || { kind: 'none' };
    let y = y1; const rr = r * (top.r ?? 1.06);
    if (top.cornice !== false) { P.cyl(top.corniceMat || M.trim, [cx, y1 - 0.3, cz], [cx, y1, cz], r + 0.08, r + 0.26, n, false); P.cyl(top.corniceMat || M.trim, [cx, y1, cz], [cx, y1 + 0.14, cz], r + 0.3, r + 0.3, n, true); y = y1 + 0.14; }
    if (top.drum) { P.cyl(top.drum.mat || wall, [cx, y, cz], [cx, y + top.drum.h, cz], r * (top.drum.r ?? 0.86), r * (top.drum.r ?? 0.86), n, true); y += top.drum.h; }
    const tm = top.mat || N.seam(NC.roofGrey);
    if (top.kind === 'tent') { const m = top.n ?? n, base = []; for (let i = 0; i < m; i++) { const a = (i / m) * Math.PI * 2; base.push([cx + Math.sin(a) * rr, y, cz + Math.cos(a) * rr]); } for (let i = 0; i < m; i++) { const a = base[i], b = base[(i + 1) % m]; P.fan(tm, [a, b, [cx, y + top.h, cz]], [(a[0] + b[0]) / 2 - cx, rr * rr / top.h, (a[2] + b[2]) / 2 - cz]); } y += top.h; }
    else if (top.kind && top.kind !== 'none') { N.lathe(tm, top.kind, N.PROF[top.kind], cx, y, cz, rr, top.h, Math.max(12, n)); y += top.h; }
    if (top.lantern) { const lr = top.lantern.r ?? r * 0.3, lh = top.lantern.h ?? 1.2; y -= top.h * 0.04; P.cyl(top.lantern.mat || wall, [cx, y, cz], [cx, y + lh, cz], lr, lr, 8, false); N.lathe(tm, 'dome', N.PROF.dome, cx, y + lh, cz, lr * 1.25, lr * 1.5, 12); y += lh + lr * 1.5; }
    if (top.spire) { P.cyl(top.spireMat || N.mats.zinc, [cx, y - 0.1, cz], [cx, y + top.spire, cz], 0.07, 0.015, 6, false); if (top.ball) N.ball(top.spireMat || N.mats.zinc, cx, y + top.spire * 0.25, cz, top.ball); y += top.spire; }
    return y;
  };

  return N;
}
