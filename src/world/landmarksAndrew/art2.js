// landmarksAndrew/art2.js - canvas paintings of the module, part 2: balustrades, and (as the parts are added) the market, the pavilion, the Pel house, the horse tram and the lettering.
// Every key starts with 'lmAnd-'.  See art.js for part 1.
const TAU = Math.PI * 2;
export function makeArt2(ctx, A) {
  const tex = ctx.tex;
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmAnd-' + key, repeat });
  const R = (seed) => ctx.rng(seed);
  const F = tex.FONTS;
  void R; void F; void TAU;
  /** white balusters (alpha): tile 0.7 m x 0.95 m = 5 turned balusters between a base and a cap rail */
  A.balus = D(128, 160, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#f2eee4';
    g.fillRect(0, 0, w, 14); g.fillRect(0, h - 16, w, 16);
    for (let i = 0; i < 5; i++) { const cx = (i + 0.5) * w / 5; g.beginPath(); g.moveTo(cx - 4, 14); g.lineTo(cx + 4, 14); g.lineTo(cx + 8, 50); g.lineTo(cx + 3, 80); g.lineTo(cx + 9, 110); g.lineTo(cx + 5, h - 16); g.lineTo(cx - 5, h - 16); g.lineTo(cx - 9, 110); g.lineTo(cx - 3, 80); g.lineTo(cx - 8, 50); g.closePath(); g.fill(); }
  }, 'balus');
  /** the cartouche plaque of the Golovin bust (photo 224, text read): dark bronze with lighter capitals, 0.5 x 0.6 m */
  A.golovin = D(256, 300, (g, w, h) => {
    g.fillStyle = '#34302b'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8c7a52'; g.lineWidth = 5; g.strokeRect(8, 8, w - 16, h - 16);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const lines = [['ПЕРВЫЙ КАВАЛЕР', 20], ['ОРДЕНА', 20], ['АНДРЕЯ', 24], ['ПЕРВОЗВАННОГО', 20], ['ФЁДОР', 22], ['АЛЕКСЕЕВИЧ', 20], ['ГОЛОВИН', 28], ['1650-1706', 20]];
    lines.forEach(([t, s], i) => { let sz = s; g.font = `700 ${sz}px ${F.serif}`; while (sz > 8 && g.measureText(t).width > w - 40) { sz--; g.font = `700 ${sz}px ${F.serif}`; } g.fillStyle = '#16140f'; g.fillText(t, w / 2 + 1, 34 + i * 33 + 1); g.fillStyle = '#b8a678'; g.fillText(t, w / 2, 34 + i * 33); });
  }, 'golovin');
  /** grey-red speckled granite with a diagonal rhombus relief (the order obelisk, photo 34 / 71): tile 1.2 x 1.2 m (u around the shaft face, v up) */
  A.rhomb = D(128, 128, (g, w, h) => {
    const r = R(8301); g.fillStyle = '#d9d0cb'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) { const v = r(); g.fillStyle = v < 0.5 ? `rgba(120,96,92,${0.2 + r() * 0.25})` : `rgba(255,255,255,${0.2 + r() * 0.25})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
    g.strokeStyle = 'rgba(70,56,54,0.7)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w / 2, 0); g.lineTo(w, h / 2); g.lineTo(w / 2, h); g.closePath(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(2, h / 2 + 2); g.lineTo(w / 2 + 2, 2); g.lineTo(w + 2, h / 2 + 2); g.stroke();
  }, 'rhomb');
}
