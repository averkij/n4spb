// landmarksDekabristov/art.js - the few canvas paintings of the module (every texture key starts with 'lmdek-'; the texture cache is scene-wide).  The pickets, pavers, asphalt, gravel, granite and concrete tiles are the
// painters of landmarksSmolensky/art.js (this repository; same pictures, same sizes: the Smolensky cemetery and these cemeteries read as one family); the water film and the plaque painter are new.
export function makeArt(ctx) {
  const tex = ctx.tex, A = {};
  const D = (w, h, fn, key, repeat = [1, 1]) => tex.draw(w, h, fn, { key: 'lmdek-' + key, repeat });
  const rnd = (seed) => ctx.rng(seed);
  A.granite = D(128, 128, (g, w, h) => { const r = rnd(8830); g.fillStyle = '#b9b5ae'; g.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? 'rgba(60,56,52,0.22)' : 'rgba(255,250,240,0.22)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } }, 'granite');
  A.pavers = D(256, 256, (g, w, h) => {                                   // brick / sett pavers 0.2 x 0.1 m in running bond, tile 2 m (20 courses of 12.8 px)
    const r = rnd(8831); g.fillStyle = '#8f8b84'; g.fillRect(0, 0, w, h);
    const bw = 25.6, bh = 12.8;
    for (let j = 0; j < 20; j++) for (let i = -1; i < 11; i++) {
      const k = 0.92 + r() * 0.16, base = (i * 3 + j * 5) % 7 === 0 ? 176 : 206;
      g.fillStyle = 'rgb(' + (Math.min(255, base * k) | 0) + ',' + (Math.min(255, (base - 4) * k) | 0) + ',' + (Math.min(255, (base - 14) * k) | 0) + ')';
      g.fillRect(i * bw + (j % 2) * bw / 2 + 1, j * bh + 1, bw - 2, bh - 2);
    }
  }, 'pavers');
  A.asphalt = D(128, 128, (g, w, h) => { const r = rnd(8832); g.fillStyle = '#5c5554'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? 'rgba(20,18,18,0.22)' : 'rgba(150,145,140,0.18)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } }, 'asphalt');
  A.gravel = D(128, 128, (g, w, h) => { const r = rnd(8833); g.fillStyle = '#8b6a5a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? 'rgba(60,40,30,0.3)' : 'rgba(200,170,150,0.3)'; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5); } }, 'gravel');
  A.concrete = D(128, 128, (g, w, h) => { const r = rnd(8820); g.fillStyle = '#5a6476'; g.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? 'rgba(30,36,46,0.2)' : 'rgba(160,170,185,0.14)'; g.fillRect(r() * w, r() * h, 2 + r() * 8, 1 + r() * 3); } g.fillStyle = 'rgba(20,24,32,0.5)'; g.fillRect(0, 0, 3, h); }, 'concrete');
  /** forged bar fence: panel 3.6 x 2.0 m (512 x 256 px), pickets every 0.12 m with spear tips, top / mid rails, a band of scalloped arcs (alpha cut-out) */
  A.bars = D(512, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#2c333a'; g.strokeStyle = '#2c333a';
    const pk = 17.04, top = 12;
    for (let x = 4; x < w; x += pk) { g.fillRect(x, top, 3, h - top); g.beginPath(); g.moveTo(x - 2.5, top + 2); g.lineTo(x + 1.5, 0); g.lineTo(x + 5.5, top + 2); g.fill(); }
    g.fillRect(0, top + 6, w, 4); g.fillRect(0, h * 0.5, w, 4); g.fillRect(0, h * 0.86, w, 5);
    g.lineWidth = 3; for (let i = 0; i < 6; i++) { const cx = (i + 0.5) * w / 6; g.beginPath(); g.arc(cx, h * 0.5, w / 12, 0, Math.PI); g.stroke(); }
  }, 'bars');
  /** a plain railing of straight pickets without spears (the garden and the memorial lawns): panel 3.0 x 1.2 m (384 x 154), pickets every 0.1 m */
  A.rail = D(384, 154, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#3d4a44';
    for (let x = 3; x < w; x += 12.8) g.fillRect(x, 6, 4, h - 6);
    g.fillRect(0, 10, w, 5); g.fillRect(0, h - 22, w, 5); g.fillRect(0, 0, w, 7);
  }, 'rail');
  A.water = D(64, 64, (g, w, h) => { g.fillStyle = '#cfe6f2'; g.fillRect(0, 0, w, h); const r = rnd(8201); for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(255,255,255,${0.2 + r() * 0.3})`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(r() * w, r() * h); g.lineTo(r() * w + 8, r() * h); g.stroke(); } }, 'water');
  return A;
}

/**
 * A plaque with real words: a dark bronze or granite slab with light lettering, `lines` = the text lines (the OSM names and inscriptions, nothing invented); returns the material (a decal: it lies 2 cm in front of its stone).
 * ratio = width : height of the plate; the cache key follows the words.
 */
export function plateMat(ctx, lines, { ratio = 2, bg = '#2b2a27', fg = '#d9d2bd', border = '#8a7a52', key } = {}) {
  const w = 512, h = Math.round(w / ratio), k = 'lmdek-plate-' + (key || lines.join('|'));
  const map = ctx.tex.draw(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = border; g.lineWidth = 5; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = lines.length, lh = (h - 24) / Math.max(1, n), size = Math.min(lh * 0.74, 64);
    lines.forEach((t, i) => { ctx.tex.fitText(g, t, w / 2, 12 + lh * (i + 0.5), w - 36, size, ctx.tex.FONTS.serif, 700); });
  }, { key: k, repeat: [1, 1] });
  return ctx.mat.toon('#ffffff', { map, name: 'lmdek-plateMat-' + (key || lines[0]), paint: 0, polygonOffset: -3, transparent: false });
}
