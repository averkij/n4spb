// bridges/yelaginPonds/mats.js - the materials of the pond bridges and sluices of the Yelagin park (docs/research/yelagin-ponds-bridges.md): weathered plank deck, pipe piles, timber, pale concrete
// girder, painted arch steel, rust gate plates and the two railing panels (alpha cut-out canvas, tinted by the material colour, like bridges/rails.js):
//   ringlat  cast-iron railing of the granite bridges (photos d1 e1 f1 g1 h1): round top rail, bottom rail, thin balusters, a diamond lattice with a ring + four-pointed star at every crossing (bay 1.6 m, 1.0 m high)
//   xlat     galvanised steel X-lattice of the timber / arched bridges and the sluices (photos a1 a2 b1 s4s1): top, middle and bottom rails and a flat-bar X in every bay (bay 1.8 m, 0.95 m high)
// Shared with the other bridges (mats.js): granite, coping, asphalt, steel, black, lampGlass, pylon.
const PX = 256;
export const RAIL = { ringlat: { W: 1.6, H: 1.0 }, xlat: { W: 1.8, H: 0.95 } };
const cache = new WeakMap();

function paintRail(g, kind, W, H) {
  const p = (m) => m * PX, w = W / PX, h = H / PX;
  g.clearRect(0, 0, W, H); g.fillStyle = '#ffffff'; g.strokeStyle = '#ffffff'; g.lineCap = 'butt';
  const line = (x0, y0, x1, y1, t) => { g.lineWidth = Math.max(1.5, p(t)); g.beginPath(); g.moveTo(p(x0), p(y0)); g.lineTo(p(x1), p(y1)); g.stroke(); };
  const rect = (x0, y0, x1, y1) => g.fillRect(p(x0), p(y0), p(x1 - x0), p(y1 - y0));
  const ring = (x, y, r, t) => { g.lineWidth = Math.max(1.5, p(t)); g.beginPath(); g.arc(p(x), p(y), p(r), 0, 6.3); g.stroke(); };
  if (kind === 'ringlat') {
    rect(0, 0, w, 0.055); rect(0, h - 0.1, w, h - 0.055);                              // round top rail, bottom rail
    for (let half = 0; half < 2; half++) {
      const x0 = half * w / 2, x1 = x0 + w / 2, cx = (x0 + x1) / 2, cy = (0.055 + h - 0.1) / 2;
      line(x0, 0.055, x1, h - 0.1, 0.022); line(x1, 0.055, x0, h - 0.1, 0.022);          // the X
      ring(cx, cy, 0.125, 0.02);                                                         // ring medallion
      line(cx - 0.085, cy, cx + 0.085, cy, 0.016); line(cx, cy - 0.085, cx, cy + 0.085, 0.016);   // four-pointed star
      line(cx - 0.06, cy - 0.06, cx + 0.06, cy + 0.06, 0.012); line(cx - 0.06, cy + 0.06, cx + 0.06, cy - 0.06, 0.012);
      for (const k of [0.1, 0.9]) line(x0 + (x1 - x0) * k, 0.055, x0 + (x1 - x0) * k, h - 0.1, 0.012);        // balusters
    }
    for (const k of [0, 0.5, 1]) line(w * k, 0, w * k, h - 0.05, 0.02);
    for (const k of [0.125, 0.375, 0.625, 0.875]) { g.beginPath(); g.arc(p(w * k), p(h - 0.12), p(0.03), 0, 6.3); g.fill(); }
  } else {
    rect(0, 0, w, 0.05); rect(0, h * 0.5 - 0.015, w, h * 0.5 + 0.015); rect(0, h - 0.09, w, h - 0.05);
    line(0, 0.05, w, h - 0.09, 0.03); line(w, 0.05, 0, h - 0.09, 0.03);
    g.beginPath(); g.arc(p(w / 2), p(h / 2 - 0.02), p(0.045), 0, 6.3); g.fill();
    for (const k of [0, 1]) line(w * k, 0, w * k, h - 0.05, 0.035);
  }
}

export function pondMats(ctx, M) {
  let m = cache.get(ctx); if (m) return m;
  const TM = ctx.mat.toon, tex = ctx.tex, rng = ctx.rng('brg-yponds');
  m = {};
  const texWood = tex.draw(256, 256, (g, w, h) => {                                    // silver-grey weathered boards 0.15 m wide laid along the bridge (photos a1 a2): tile 1.0 (along) x 1.5 m (across)
    const rows = 10, rh = h / rows;
    for (let j = 0; j < rows; j++) {
      const k = 0.88 + rng() * 0.18, r0 = 176 * k, g0 = 166 * k, b0 = 146 * k;
      g.fillStyle = `rgb(${Math.round(r0)},${Math.round(g0)},${Math.round(b0)})`; g.fillRect(0, j * rh, w, rh - 1.5);
      g.fillStyle = 'rgba(70,62,52,0.55)'; g.fillRect(0, j * rh + rh - 2, w, 2);
      g.fillStyle = 'rgba(90,80,66,0.22)'; for (let s = 0; s < 5; s++) g.fillRect(rng() * w, j * rh + rng() * (rh - 3), 30 + rng() * 80, 1.2);
      g.fillStyle = 'rgba(60,52,44,0.6)'; g.fillRect((j * 97) % w, j * rh, 2, rh - 1.5);
    }
  }, { key: 'brg-yp-wood', repeat: [1, 1], anisotropy: 8 });
  m.deckWood = TM('#d2ccbe', { map: texWood, paint: 0.05, name: 'brg-yp-deck-wood' });
  m.timber = TM('#7f7466', { paint: 0.06, name: 'brg-yp-timber' });                  // beams, caps, fascia boards of the trestle bridges
  m.pile = TM('#7a4c38', { paint: 0.05, name: 'brg-yp-pile' });                       // rusty steel pipe piles with timber caps (photo b1)
  m.concrete = TM('#aaa8a0', { paint: 0.05, name: 'brg-yp-concrete' });               // the wedge abutments of the timber bridges (photos a1 b1)
  m.girder = TM('#d5d8d3', { paint: 0.04, name: 'brg-yp-girder' });                   // the pale haunched concrete girder of the granite bridges (photos d1 f1 h2)
  m.archSteel = TM('#6d655a', { paint: 0.05, name: 'brg-yp-arch' });                  // the strut-truss arch of the 2nd - 3rd Southern bridge (photos c2 c3)
  // review 2026-10-14: draw-call budget (25 materials -> 15): the rusty gate plates share the pile material, the black gates the shared M.black, the sluice slab and the treads the concrete grey
  m.plate = m.pile;                                                                    // rusty steel gate plates of the sluices (photos s1s1 s5n1)
  m.gateBlack = M.black || TM('#2a2d30', { paint: 0.03, name: 'brg-yp-gate' });       // black sluice gates under the deck (photo s4s1, sne)
  m.winch = TM('#b7bdc0', { paint: 0.04, name: 'brg-yp-winch' });                     // pale-grey winch columns with hand wheels
  m.sluiceDeck = m.concrete;                                                           // granite slab deck of a sluice
  m.step = m.concrete;                                                                 // granite treads of the arched bridge
  const panel = (kind, hex0) => {
    const hex = kind === 'xlat' ? '#d6dde0' : (hex0 === '#8f9a94' ? hex0 : '#c5ccd0');          // review: four near-identical X-lattice tints and two ring-lattice tints were four extra materials (draw calls)
    const key = kind + hex; if (m['r' + key]) return m['r' + key];
    const spec = RAIL[kind], W = Math.round(spec.W * PX), H = Math.round(spec.H * PX);
    const map = tex.draw(W, H, (g) => paintRail(g, kind, W, H), { key: 'brg-yp-rail-' + kind, repeat: [1, 1], anisotropy: 8 });
    return (m['r' + key] = TM(hex, { map, alphaTest: 0.5, side: 'double', paint: 0.02, name: 'brg-yp-rail-' + kind + hex }));
  };
  m.rail = panel;
  cache.set(ctx, m); return m;
}
void 0;
