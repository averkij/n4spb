// landmarksModernVO/mats.js - the materials of the module (ctx.mat.toon / glass only; every name starts with 'lmmvo-').  Lazy: a material (and its canvas texture) exists only when a house asks for it.
//   M.def(name, fn)         register a lazy material (the house files add their own);  M.sheet(name, texInfo, o) / M.flat(name, hex, o)  create a toon material;  M.deco(...) / M.cut(...) alpha decals / cut-outs
//   M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset, no outline), M.glassy = transparent sheets.
// Colours: docs/research/modernvo.md (the sampled medians, section 14.4).
import { makeArt } from './art.js';

export function makeMats(ctx) {
  const T = ctx.mat.toon, W = '#ffffff', A = makeArt(ctx);
  const M = { A, cutouts: new Set(), decals: new Set(), glassy: new Set(), tex: {} };
  M.def = (name, fn) => { let v = null; Object.defineProperty(M, name, { get() { return v || (v = fn()); }, enumerable: true, configurable: true }); };
  M.sheet = (name, t, o = {}) => { const m = T(W, { map: t.tex || t, name: 'lmmvo-' + name, paint: 0.03, ...o }); M.tex[name] = t; return m; };
  // flat colours are clustered: a colour within 18 (RGB distance) of an earlier flat colour re-uses that material (houses share one material per colour family; the module stays within the material budget)
  const palette = [], rgbOf = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  const snap = (hex) => { const c = rgbOf(hex); for (const q of palette) if (Math.hypot(q.c[0] - c[0], q.c[1] - c[1], q.c[2] - c[2]) < 18) return q.hex; palette.push({ c, hex }); return hex; };
  M.flat = (name, col, o = {}) => { const c = snap(col); return T(c, { name: 'lmmvo-c' + c.slice(1), paint: 0.03, ...o }); };
  /** an alpha-tested cut-out (no outline) */
  M.cut = (name, t, o = {}) => { const m = T(W, { map: t.tex || t, name: 'lmmvo-' + name, paint: 0, alphaTest: 0.5, side: 'double', ...o }); M.cutouts.add(m); return m; };
  /** a sheet that lies in front of a wall (polygonOffset, alpha cut) */
  M.deco = (name, t, o = {}) => { const m = T(W, { map: t.tex || t, name: 'lmmvo-' + name, paint: 0, polygonOffset: -2, ...o, alphaTest: 0.3 }); M.decals.add(m); return m; };      // (ONE alphaTest for every decal sheet: alphaTest is part of the batch kind, 0.1 / 0.2 / 0.3 / 0.4 were four kinds)
  const flat = M.flat;

  // ---- shared by all houses
  M.def('iron', () => flat('iron', '#26262a', { paint: 0.01 }));
  M.def('ironFence', () => flat('ironFence', '#2a2a2d', { paint: 0.01 }));
  M.def('zinc', () => flat('zinc', '#8c9195', { paint: 0.05 }));
  M.def('zincLight', () => flat('zincLight', '#b9c1c0', { paint: 0.05 }));
  M.def('zincDark', () => flat('zincDark', '#5f5e5c', { paint: 0.05 }));
  M.def('creamTrim', () => flat('creamTrim', '#ece4d2', { paint: 0.03 }));
  M.def('whiteTrim', () => flat('whiteTrim', '#eee9de', { paint: 0.02 }));
  M.def('darkGlass', () => flat('darkGlass', '#2b3338', { paint: 0 }));
  M.def('doorDark', () => flat('doorDark', '#4a352c', { paint: 0.02 }));
  M.def('pipeCream', () => flat('pipeCream', '#e4dac0', { paint: 0.02 }));
  M.def('yardPlaster', () => flat('yardPlaster', '#c9b98e', { paint: 0.05 }));
  M.def('roofGrey', () => flat('roofGrey', '#8d9399', { paint: 0.05 }));
  // standing-seam zinc / sheet-iron roof (1.2 m tile = two seams) and the brick chimneys
  M.def('roofSeam', () => M.sheet('roof-seam', A.D(128, 128, (g, w, h) => { g.fillStyle = '#8f969b'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2; i++) { g.fillStyle = '#6d747a'; g.fillRect(i * 64 + 30, 0, 4, h); g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(i * 64 + 34, 0, 2, h); } A.speckle(g, w, h, 6001, 120, 0.05, 2); }, 'roof-seam'), { paint: 0.05 }));
  M.def('chimney', () => M.flat('chimney', '#9a5a45', { paint: 0.04 }));
  M.def('chimneyCap', () => M.flat('chimney-cap', '#b9b4aa', { paint: 0.03 }));
  // window sheets (80 x ~150 px; stretched over the opening's bounding box)
  M.def('winW', () => M.sheet('winW', A.win('w-flat', { frame: '#eee9de', bars: 'two', ratio: 1.9 }), { paint: 0 }));
  M.def('winD', () => M.sheet('winD', A.win('d-flat', { frame: '#4a3a31', bars: 'two', ratio: 1.9 }), { paint: 0 }));
  M.def('winWArch', () => M.sheet('winWArch', A.win('w-arch', { head: 'arch', frame: '#eee9de', bars: 'cross', ratio: 1.9 }), { paint: 0 }));
  M.def('winDArch', () => M.sheet('winDArch', A.win('d-arch', { head: 'arch', frame: '#4a3a31', bars: 'cross', ratio: 1.9 }), { paint: 0 }));
  M.def('winWPoint', () => M.sheet('winWPoint', A.win('w-point', { head: 'point', frame: '#eee9de', bars: 'cross', ratio: 2.8 }), { paint: 0 }));
  M.def('winSlit', () => M.sheet('winSlit', A.win('d-slit', { frame: '#4a3a31', bars: 'slit', ratio: 3.6, f: 5 }), { paint: 0 }));
  M.def('winRound', () => M.sheet('winRound', A.win('w-round', { head: 'round', frame: '#eee9de', bars: 'cross', ratio: 1 }), { paint: 0 }));
  M.def('winShop', () => M.sheet('winShop', A.win('shop', { frame: '#3b4044', bars: 'none', glass: 'dark', ratio: 1.5, f: 4 }), { paint: 0 }));
  M.def('winSquare', () => M.sheet('winSquare', A.win('d-sq', { frame: '#4a3a31', bars: 'cross', ratio: 1.1 }), { paint: 0 }));
  // iron railing (cut-out): vertical bars between a top and a bottom rail, 1 m high x 1.6 m wide
  M.def('railing', () => M.cut('railing', A.D(128, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#26262a'; g.fillRect(0, 2, w, 5); g.fillRect(0, h - 8, w, 6);
    for (let i = 0; i <= 16; i++) g.fillRect(i * (w - 3) / 16, 2, 3, h - 4);
    for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(i * w / 8 + w / 16, h * 0.5, w / 18, 0, Math.PI * 2); g.lineWidth = 2; g.strokeStyle = '#26262a'; g.stroke(); }
  }, 'railing')));
  return M;
}
