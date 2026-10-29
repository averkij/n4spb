// landmarksGavan/art.js - the canvas paintings of the module (docs/research/gavan.md; photos refs/gavan 03 12 24 25 26 49 65 82 93 102 109).  Every key starts with 'lmgavan-' (the texture cache is scene-wide:
// a prefix that matches another module silently takes its textures).  The wall panels carry the WALL COLOUR as their background (no alpha: they sit 3 cm in front of the wall), the cut-outs (fence bars, fans) are alpha.
//   Pavilions   the eared (shouldered) window surround with a crowned cap and keystone: glazed (white 3 x 5 muntins), blind (a white painted panel), west (green-grey frames); the arched door of the east
//               pavilion; the arched lantern window; the oval window in its cartouche; the bronze plaque of the west pavilion
//   Canal       the black iron fence (vertical bars, two rails), the sunburst fan panel, granite setts, lawn, gravel
//   Bridge      steel-sheet roadway (anti-slip), plank footway, galvanised steel
//   More textures (workers' town, fire reserve, church, harbour) are in artTown.js / artFire.js / artChurch.js / artHarbour.js and are merged into the same `A`.
import { artTown } from './artTown.js';
import { artFire } from './artFire.js';
import { artChurch } from './artChurch.js';
import { artHarbour } from './artHarbour.js';

const TAU = Math.PI * 2;
export const COL = {
  peachE: '#eaa97a', peachW: '#e8b78a', white: '#f6f4ee', whiteShade: '#dcd8cc', plinth: '#a9a595', glass: '#46525a', glassW: '#4f6a62', door: '#c9ccd0', roofWhite: '#f1f2f0', verdi: '#9fbcb2', lantRed: '#8a4a38',
  graniteBase: '#8d8a82', limestone: '#b8b09a', coping: '#a7a39a', setts: '#8e8b84', lawn: '#5e8a40', lawnDry: '#837f48', iron: '#1e2023', rail: '#2d3033',
  steel: '#9fa3a5', steelDark: '#6d7173', deckSteel: '#4d5052', plank: '#8c7556', rust: '#7a4e36',
};

export function makeArt(ctx) {
  const tex = ctx.tex, A = {}, C = COL;
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmgavan-' + key, repeat });
  const R = (seed) => ctx.rng(seed);
  const F = tex.FONTS;
  const speckle = (g, w, h, seed, n, a = 0.1, dark = '40,36,32') => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : dark},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2); } };
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const H = { D, R, F, speckle, rr, C, TAU };

  // ------------------------------------------------------------------------------------------ pavilion windows (quad 1.85 x 3.3 m; px per metre = W / 1.85)
  /** the eared surround: white outline of a rectangle with stepped ears at 2/3 height, a segmental crowned cap and a keystone; the opening (1.15 x 2.05, sill at 0.6 m above the sill block) is filled by `inner(g, x, y, w, h)` */
  const surround = (key, wall, inner, W = 128, Hh = 228) => D(W, Hh, (g, w, h) => {
    const px = w / 1.85, Y = (m) => h - m * px, X = (m) => m * px;
    g.fillStyle = wall; g.fillRect(0, 0, w, h);
    // outer white shape (a rectangle with a cap)
    g.fillStyle = C.white;
    g.beginPath();
    g.moveTo(X(0.0), Y(0)); g.lineTo(X(1.85), Y(0)); g.lineTo(X(1.85), Y(0.24)); g.lineTo(X(1.78), Y(0.24)); g.lineTo(X(1.78), Y(2.05));
    g.lineTo(X(1.85), Y(2.05)); g.lineTo(X(1.85), Y(2.45)); g.lineTo(X(1.76), Y(2.45)); g.lineTo(X(1.76), Y(2.85));
    g.quadraticCurveTo(X(1.5), Y(3.05), X(1.18), Y(3.12)); g.lineTo(X(1.12), Y(3.3)); g.lineTo(X(0.73), Y(3.3)); g.lineTo(X(0.67), Y(3.12));
    g.quadraticCurveTo(X(0.35), Y(3.05), X(0.09), Y(2.85)); g.lineTo(X(0.09), Y(2.45)); g.lineTo(X(0.0), Y(2.45)); g.lineTo(X(0.0), Y(2.05)); g.lineTo(X(0.07), Y(2.05));
    g.lineTo(X(0.07), Y(0.24)); g.lineTo(X(0.0), Y(0.24)); g.closePath(); g.fill();
    // shade lines of the reveal
    g.fillStyle = C.whiteShade; g.fillRect(X(0.29), Y(2.62), X(1.27), px * 0.04); g.fillRect(X(0.72), Y(3.3), X(0.41), px * 0.05);
    // keystone block
    g.fillStyle = '#ebe7dc'; g.fillRect(X(0.78), Y(3.2), X(0.29), px * 0.45);
    // the opening
    inner(g, X(0.35), Y(2.65), X(1.15), X(2.05));
    // sill under the opening
    g.fillStyle = C.whiteShade; g.fillRect(X(0.2), Y(0.62), X(1.45), px * 0.07);
  }, key);
  const glazed = (frame, glassCol) => (g, x, y, w, h) => {
    g.fillStyle = glassCol; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(150,175,190,0.22)'; g.beginPath(); g.moveTo(x, y + h * 0.55); g.lineTo(x + w * 0.55, y); g.lineTo(x + w * 0.85, y); g.lineTo(x, y + h * 0.95); g.closePath(); g.fill();
    g.fillStyle = frame; const t = Math.max(2, w * 0.05);
    g.fillRect(x, y, w, t); g.fillRect(x, y + h - t, w, t); g.fillRect(x, y, t, h); g.fillRect(x + w - t, y, t, h); g.fillRect(x + w / 2 - t * 0.6, y, t * 1.2, h);
    g.fillRect(x, y + h * 0.28 - t * 0.5, w, t * 0.9);                                  // transom
    for (let i = 1; i < 5; i++) { const yy = y + h * 0.28 + (h * 0.72) * i / 5; g.fillRect(x + t, yy - 0.5, w / 2 - t * 1.6, 1.4); g.fillRect(x + w / 2 + t * 0.6, yy - 0.5, w / 2 - t * 1.6, 1.4); }
    for (let i = 1; i < 3; i++) { g.fillRect(x + w * i / 6 - 0.6, y, 1.4, h * 0.28); }
  };
  const blind = (g, x, y, w, h) => { g.fillStyle = '#f2f0ea'; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(180,176,164,0.55)'; g.fillRect(x, y, w, 3); g.fillRect(x, y, 3, h); g.fillStyle = '#e4e0d4'; g.fillRect(x + 6, y + 8, w - 12, h - 16); g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(x + 8, y + 10, w - 16, 2); };
  A.winEast = surround('winEast', C.peachE, glazed('#f3f1ea', C.glass));
  A.winEastBlind = surround('winEastBlind', C.peachE, blind);
  A.winWest = surround('winWest', C.peachW, glazed(C.glassW, '#3f4a50'));
  /** the arched door of the east pavilion's north face: archivolt 1.8 m wide, 3.6 m high (door 1.3 x 3.0, light-grey closed leaf) */
  A.doorEast = D(128, 256, (g, w, h) => {
    const px = w / 1.8, Y = (m) => h - m * px, X = (m) => m * px;
    g.fillStyle = C.peachE; g.fillRect(0, 0, w, h);
    g.fillStyle = C.white; g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(X(1.8), Y(0)); g.lineTo(X(1.8), Y(2.6)); g.arc(X(0.9), Y(2.7), X(0.9), 0, Math.PI, true); g.lineTo(0, Y(0)); g.closePath(); g.fill();
    g.fillStyle = C.door; g.beginPath(); g.moveTo(X(0.25), Y(0)); g.lineTo(X(1.55), Y(0)); g.lineTo(X(1.55), Y(2.35)); g.arc(X(0.9), Y(2.35), X(0.65), 0, Math.PI, true); g.lineTo(X(0.25), Y(0)); g.closePath(); g.fill();
    g.strokeStyle = '#a9adb2'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(0.9), Y(0)); g.lineTo(X(0.9), Y(3.0)); g.stroke(); g.strokeRect(X(0.4), Y(1.1), X(0.4), X(1.5)); g.strokeRect(X(1.0), Y(1.1), X(0.4), X(1.5));
  }, 'doorEast');
  /** the lantern window: quad 0.95 x 1.9 m, arched dark glass 0.6 x 1.5 in a white frame, on the wall colour `wall` */
  const lantWin = (key, wall, frame) => D(80, 160, (g, w, h) => {
    const px = w / 0.95; g.fillStyle = wall; g.fillRect(0, 0, w, h);
    g.fillStyle = frame; g.beginPath(); g.moveTo(w * 0.1, h); g.lineTo(w * 0.9, h); g.lineTo(w * 0.9, h * 0.32); g.arc(w / 2, h * 0.32, w * 0.4, 0, Math.PI, true); g.lineTo(w * 0.1, h); g.closePath(); g.fill();
    g.fillStyle = '#3c4950'; g.beginPath(); g.moveTo(w * 0.2, h * 0.94); g.lineTo(w * 0.8, h * 0.94); g.lineTo(w * 0.8, h * 0.33); g.arc(w / 2, h * 0.33, w * 0.3, 0, Math.PI, true); g.lineTo(w * 0.2, h * 0.94); g.closePath(); g.fill();
    g.fillStyle = frame; g.fillRect(w / 2 - 1, h * 0.04, 2, h * 0.9); for (let i = 1; i < 6; i++) g.fillRect(w * 0.2, h * (0.33 + 0.1 * i), w * 0.6, 1.4);
    g.fillStyle = 'rgba(160,185,200,0.2)'; g.fillRect(w * 0.22, h * 0.4, w * 0.12, h * 0.5); void px;
  }, key);
  A.lantEast = lantWin('lantEast', C.roofWhite, '#f6f6f2');
  A.lantWest = lantWin('lantWest', C.lantRed, '#f0eee6');
  /** the oval window in its cartouche (quad 1.3 x 1.0 m): a recessed panel, a white oval frame, dark glass, a keystone */
  const oval = (key, bg) => D(128, 100, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(4, 4, w - 8, h - 8);
    g.fillStyle = C.white; g.beginPath(); g.ellipse(w / 2, h * 0.52, w * 0.36, h * 0.36, 0, 0, TAU); g.fill();
    g.fillStyle = '#3c4950'; g.beginPath(); g.ellipse(w / 2, h * 0.52, w * 0.29, h * 0.28, 0, 0, TAU); g.fill();
    g.strokeStyle = C.white; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2, h * 0.24); g.lineTo(w / 2, h * 0.8); g.moveTo(w * 0.22, h * 0.52); g.lineTo(w * 0.78, h * 0.52); g.stroke();
    g.fillStyle = C.white; g.fillRect(w / 2 - 7, 3, 14, h * 0.18);
  }, key);
  A.ovalEast = oval('ovalEast', C.roofWhite); A.ovalWest = oval('ovalWest', '#b8654e');
  /** the bronze plaque (0.5 x 0.7 m): the real wording of the west pavilion, four rivets */
  A.plaqueKron = D(256, 360, (g, w, h) => {
    g.fillStyle = '#2e2b26'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a7a52'; g.lineWidth = 4; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#9b8a5a'; for (const [x, y] of [[16, 16], [w - 16, 16], [16, h - 16], [w - 16, h - 16]]) { g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); }
    g.fillStyle = '#c9b57a'; g.textAlign = 'center';
    const lines = [['ПАМЯТНИК', 22], ['АРХИТЕКТУРЫ', 22], ['XVIII века', 22], ['«КРОНШПИЦ»', 30], ['ПОСТРОЕН', 20], ['в 1754 г.', 22], ['АРХИТЕКТОР', 20], ['М. А. БАШМАКОВ', 22], ['ОХРАНЯЕТСЯ', 20], ['ГОСУДАРСТВОМ', 20]];
    let y = 44; for (const [t, s] of lines) { g.font = `bold ${s}px ${F ? F.serif : 'serif'}`; g.fillText(t, w / 2, y); y += s + 12; }
  }, 'plaqueKron');

  // ------------------------------------------------------------------------------------------ canal: fence, setts, lawn, gravel
  /** the fence panel (2.5 x 1.6 m, alpha): vertical bars every 0.12 m, two flat rails, spear tips */
  A.fenceBars = D(256, 164, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff';
    const n = 21; for (let i = 0; i < n; i++) { const x = (i + 0.5) * w / n; g.fillRect(x - 1.6, h * 0.05, 3.2, h * 0.95); g.beginPath(); g.moveTo(x - 3, h * 0.07); g.lineTo(x, 0); g.lineTo(x + 3, h * 0.07); g.fill(); }
    g.fillRect(0, h * 0.14, w, 5); g.fillRect(0, h * 0.8, w, 5);
  }, 'fenceBars');
  /** the sunburst fan panel (2.5 x 1.6 m, alpha): the bars, the rails, a semicircle of 11 radiating bars with a scroll circle in the middle */
  A.fenceFan = D(256, 164, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.strokeStyle = '#fff';
    const n = 21; for (let i = 0; i < n; i++) { const x = (i + 0.5) * w / n; if (Math.abs(x - w / 2) < w * 0.22) continue; g.fillRect(x - 1.6, h * 0.05, 3.2, h * 0.95); }
    g.fillRect(0, h * 0.8, w, 5); g.fillRect(0, h * 0.14, w * 0.28, 5); g.fillRect(w * 0.72, h * 0.14, w * 0.28, 5);
    const cx = w / 2, cy = h * 0.8; g.lineWidth = 2.6;
    for (let i = 0; i < 11; i++) { const a = Math.PI + Math.PI * i / 10; g.beginPath(); g.moveTo(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6); g.lineTo(cx + Math.cos(a) * w * 0.22, cy + Math.sin(a) * h * 0.74); g.stroke(); }
    g.lineWidth = 3; g.beginPath(); g.ellipse(cx, cy, w * 0.22, h * 0.74, 0, Math.PI, TAU); g.stroke(); g.beginPath(); g.arc(cx, cy - h * 0.38, 9, 0, TAU); g.stroke();
  }, 'fenceFan');
  A.setts = D(256, 256, (g, w, h) => {              // granite setts (tile 2 m): 0.11 m units in staggered rows
    g.fillStyle = '#7a7873'; g.fillRect(0, 0, w, h); const r = R(9101);
    const rows = 18, rh = h / rows;
    for (let k = 0; k < rows; k++) { const n = 14, off = (k % 2) * (w / n / 2); for (let i = 0; i < n + 1; i++) { const v = 128 + r() * 40 | 0, wob = r() * 6; g.fillStyle = `rgb(${v + 6},${v + 4},${v})`; g.fillRect(i * w / n + off + 1, k * rh + 1, w / n - 2, rh - 2 + wob * 0); } }
    speckle(g, w, h, 9102, 500, 0.06);
  }, 'setts');
  A.lawn = D(256, 256, (g, w, h) => {              // lawn (tile 6 m): green with mown stripes and lighter patches
    g.fillStyle = C.lawn; g.fillRect(0, 0, w, h); const r = R(9111);
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '150,190,90' : '70,110,40'},${0.03 + r() * 0.04})`; g.fillRect(0, r() * h, w, 5 + r() * 18); }
    for (let i = 0; i < 360; i++) { g.fillStyle = r() < 0.5 ? 'rgba(210,225,140,0.25)' : 'rgba(40,80,30,0.25)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 4); }
  }, 'lawn');
  A.lawnDry = D(256, 256, (g, w, h) => {
    g.fillStyle = C.lawnDry; g.fillRect(0, 0, w, h); const r = R(9112);
    for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? 'rgba(200,190,110,0.3)' : 'rgba(80,100,40,0.3)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 2 + r() * 6); }
  }, 'lawnDry');
  A.gravel = D(256, 256, (g, w, h) => {
    g.fillStyle = '#a8a091'; g.fillRect(0, 0, w, h); speckle(g, w, h, 9121, 900, 0.18, '70,64,56');
  }, 'gravel');
  A.granite = D(256, 256, (g, w, h) => {            // dressed granite slabs (tile 2 m)
    g.fillStyle = '#8f8c86'; g.fillRect(0, 0, w, h); const r = R(9131);
    for (let k = 0; k < 4; k++) for (let i = 0; i < 2; i++) { const x = i * w / 2 + (k % 2) * w / 4, v = 135 + r() * 30 | 0; g.fillStyle = `rgb(${v},${v - 2},${v - 6})`; g.fillRect(x + 1, k * h / 4 + 1, w / 2 - 2, h / 4 - 2); }
    speckle(g, w, h, 9132, 400, 0.08);
  }, 'granite');
  A.ashlar = D(256, 256, (g, w, h) => {             // limestone ashlar of the mole (tile 3 m, 0.45 m courses)
    g.fillStyle = C.limestone; g.fillRect(0, 0, w, h); const r = R(9141), rows = 6, rh = h / rows;
    for (let k = 0; k < rows; k++) { const n = 3, off = (k % 2) * w / n / 2 + r() * 8; g.fillStyle = 'rgba(90,82,66,0.5)'; g.fillRect(0, k * rh, w, 2); for (let i = 0; i < n + 1; i++) { g.fillRect(i * w / n + off, k * rh, 2, rh); const v = r(); g.fillStyle = v < 0.5 ? 'rgba(255,250,235,0.1)' : 'rgba(110,98,76,0.12)'; g.fillRect(i * w / n + off + 2, k * rh + 2, w / n - 2, rh - 2); g.fillStyle = 'rgba(90,82,66,0.5)'; }
    }
    speckle(g, w, h, 9142, 300, 0.07);
  }, 'ashlar');
  A.plasterPeach = D(128, 128, (g, w, h) => { g.fillStyle = C.peachE; g.fillRect(0, 0, w, h); speckle(g, w, h, 9151, 160, 0.05); }, 'plasterPeach');
  A.plasterPeachW = D(128, 128, (g, w, h) => { g.fillStyle = C.peachW; g.fillRect(0, 0, w, h); speckle(g, w, h, 9152, 160, 0.05); }, 'plasterPeachW');

  // ------------------------------------------------------------------------------------------ bridge: steel sheet, planks, galvanised steel
  A.deckSteel = D(256, 256, (g, w, h) => {          // steel-sheet roadway with the anti-slip pattern (tile 2 m)
    g.fillStyle = C.deckSteel; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,0.1)';
    for (let y = 0; y < h; y += 16) for (let x = (y / 16 % 2) * 8; x < w; x += 16) { g.fillRect(x, y, 8, 3); }
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(0, 0, w, 2); g.fillRect(0, h / 2, w, 2); speckle(g, w, h, 9161, 300, 0.1);
  }, 'deckSteel');
  A.plank = D(256, 256, (g, w, h) => {              // weathered pine planks laid along the bridge (tile 2 m: 8 boards across)
    g.fillStyle = C.plank; g.fillRect(0, 0, w, h); const r = R(9171);
    for (let i = 0; i < 8; i++) { const v = r(); g.fillStyle = v < 0.5 ? 'rgba(255,240,210,0.12)' : 'rgba(60,40,20,0.14)'; g.fillRect(i * w / 8, 0, w / 8, h); g.fillStyle = 'rgba(40,28,16,0.55)'; g.fillRect(i * w / 8, 0, 2, h); for (let k = 0; k < 4; k++) g.fillRect(i * w / 8 + r() * 20, r() * h, 1, 10 + r() * 30); }
    g.fillStyle = 'rgba(40,28,16,0.5)'; for (let k = 0; k < 6; k++) g.fillRect(0, r() * h, w, 2);
  }, 'plank');
  A.steelGalv = D(128, 128, (g, w, h) => { g.fillStyle = C.steel; g.fillRect(0, 0, w, h); const r = R(9181); for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '90,96,100'},0.12)`; g.fillRect(r() * w, r() * h, 10 + r() * 30, 8 + r() * 24); } speckle(g, w, h, 9182, 140, 0.1); }, 'steelGalv');
  A.rustGirder = D(128, 128, (g, w, h) => { g.fillStyle = C.rust; g.fillRect(0, 0, w, h); speckle(g, w, h, 9191, 240, 0.15, '60,30,16'); }, 'rustGirder');

  artTown(ctx, A, H); artFire(ctx, A, H); artChurch(ctx, A, H); artHarbour(ctx, A, H);
  return A;
}
