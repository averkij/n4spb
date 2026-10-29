// landmarksModernVO/art.js - the canvas paintings of the module: wall families (glazed tile in running bond, brick, roughcast, rock-faced granite, plaster, rustication) and the window glass sheets.
// Every texture key starts with 'lmmvo-' (the texture cache is scene-wide).  Colours: docs/research/modernvo.md (the sampled medians of every house; section 14.3 / 14.4).
//   A.tile(key, hex, o)     glazed tile / brick courses with per-course colour noise: o { cols, rows, tw, th (m per tile), joint (px), mortar, vary, dark, accent: [[hex, prob]..], glaze, seed } -> { tex, tu, tv }
//   A.rough(key, hex, o)    pebble-dash / roughcast (2 x 2 m);  A.granite(key, hex, o)  rock-faced ashlar blocks (2.2 x 1.2 m);  A.plaster(key, hex, o)  smooth plaster (3 x 3 m);  A.rustic(key, hex, o)  rusticated plaster
//   A.win(key, o)           a window sheet: o { head: 'flat' | 'arch' | 'point' | 'round', frame, glass, bars: 'two' | 'three' | 'cross' | 'none', ratio (h / w), mull (px) }
// The returned texture sizes are in metres (tu, tv): wall quads map uv = metres / (tu, tv).
const TAU = Math.PI * 2;
export const hex3 = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgb = (c, k = 1) => `rgb(${Math.max(0, Math.min(255, c[0] * k)) | 0},${Math.max(0, Math.min(255, c[1] * k)) | 0},${Math.max(0, Math.min(255, c[2] * k)) | 0})`;

export function makeArt(ctx) {
  const tex = ctx.tex, A = { dim: {} };
  const D = (w, h, fn, key, o = {}) => tex.draw(w, h, fn, { key: 'lmmvo-' + key, repeat: [1, 1], ...o });
  const R = (seed) => ctx.rng(seed);
  const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const speckle = (g, w, h, seed, n, a = 0.1, s = 2) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '30,24,20'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * s, 1 + r() * s * 0.8); } };
  const blotch = (g, w, h, seed, n, a = 0.05) => { const r = R(seed); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,240,215' : '60,45,30'},${0.015 + r() * a})`; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 40, 6 + r() * 22, r() * 3, 0, TAU); g.fill(); } };

  /** glazed tile / brick in running bond: texture covers cols x rows tiles of tw x th metres */
  A.tile = (key, hex, o = {}) => {
    const cols = o.cols ?? 8, rows = o.rows ?? 16, tw = o.tw ?? 0.19, th = o.th ?? 0.065, base = hex3(hex), mortar = hex3(o.mortar || '#c9c3b6');
    const seed = o.seed ?? (hashStr(key) % 9000 + 100), joint = o.joint ?? 1.4;
    const t = D(256, 256, (g, w, h) => {
      const r = R(seed), bw = w / cols, bh = h / rows;
      g.fillStyle = rgb(mortar); g.fillRect(0, 0, w, h);
      for (let j = 0; j < rows; j++) for (let i = -1; i < cols; i++) {
        const x = i * bw + (j % 2) * bw / 2;
        let c = base, k = 1 + (r() - 0.5) * 2 * (o.vary ?? 0.1);
        const q = r();
        if (o.accent) { let acc = 0; for (const [ah, p] of o.accent) { acc += p; if (q < acc) { c = hex3(ah); k = 1 + (r() - 0.5) * (o.vary ?? 0.1); break; } } }
        if (c === base && q > 1 - (o.dark ?? 0.06)) k *= 0.82;
        g.fillStyle = rgb(c, k); g.fillRect(x + joint * 0.5, j * bh + joint * 0.5, bw - joint, bh - joint);
        if (o.glaze) { g.fillStyle = 'rgba(255,255,255,0.13)'; g.fillRect(x + joint * 0.5, j * bh + joint * 0.5, bw - joint, Math.max(1, bh * 0.2)); }
      }
      speckle(g, w, h, seed + 1, 500, 0.05, 2);
    }, 'tile-' + key);
    A.dim['tile-' + key] = [cols * tw, rows * th];
    return { tex: t, tu: cols * tw, tv: rows * th };
  };
  /** roughcast / pebble-dash, 2 x 2 m */
  A.rough = (key, hex, o = {}) => {
    const base = hex3(hex), seed = o.seed ?? (hashStr(key) % 9000 + 200);
    const t = D(256, 256, (g, w, h) => {
      g.fillStyle = rgb(base); g.fillRect(0, 0, w, h);
      blotch(g, w, h, seed, 24, 0.016);
      const r = R(seed + 3);
      for (let i = 0; i < 2600; i++) { const v = r(); g.fillStyle = v < 0.45 ? `rgba(255,250,240,${0.05 + r() * 0.1})` : `rgba(20,16,14,${0.05 + r() * 0.12})`; g.fillRect(r() * w, r() * h, 1 + r() * 1.8, 1 + r() * 1.8); }
    }, 'rough-' + key);
    return { tex: t, tu: 2, tv: 2 };
  };
  /** rock-faced granite ashlar: cols x rows blocks (0.55 x 0.3 m) on 2.2 x 1.2 m */
  A.granite = (key, hex, o = {}) => {
    const base = hex3(hex), cols = o.cols ?? 4, rows = o.rows ?? 4, tw = o.tw ?? 0.55, th = o.th ?? 0.3, seed = o.seed ?? (hashStr(key) % 9000 + 300);
    const t = D(256, 256, (g, w, h) => {
      const r = R(seed), bw = w / cols, bh = h / rows;
      g.fillStyle = rgb(base, 0.45); g.fillRect(0, 0, w, h);
      for (let j = 0; j < rows; j++) for (let i = -1; i < cols; i++) {
        const x = i * bw + (j % 2) * bw / 2 + (r() - 0.5) * 3, y = j * bh;
        const k = 0.88 + r() * 0.26;
        g.fillStyle = rgb(base, k); g.beginPath(); g.moveTo(x + 2 + r() * 3, y + 2 + r() * 2); g.lineTo(x + bw - 2 - r() * 3, y + 2 + r() * 2); g.lineTo(x + bw - 2 - r() * 3, y + bh - 2 - r() * 2); g.lineTo(x + 2 + r() * 3, y + bh - 2 - r() * 2); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 3, y + 3, bw - 7, 2);
        g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(x + 3, y + bh - 5, bw - 7, 2);
      }
      speckle(g, w, h, seed + 1, 700, 0.12, 2.2);
    }, 'granite-' + key);
    return { tex: t, tu: cols * tw, tv: rows * th };
  };
  /** smooth plaster with soft stains, 3 x 3 m */
  A.plaster = (key, hex, o = {}) => {
    const base = hex3(hex), seed = o.seed ?? (hashStr(key) % 9000 + 400);
    const t = D(256, 256, (g, w, h) => { g.fillStyle = rgb(base); g.fillRect(0, 0, w, h); blotch(g, w, h, seed, 22, o.stain ?? 0.022); speckle(g, w, h, seed + 1, 260, 0.05); }, 'plaster-' + key);
    return { tex: t, tu: 3, tv: 3 };
  };
  /** rusticated plaster: horizontal grooves every `step` m (tile 1 x 2 steps) */
  A.rustic = (key, hex, o = {}) => {
    const base = hex3(hex), joint = hex3(o.joint || '#efdcc6'), step = o.step ?? 0.55, seed = o.seed ?? (hashStr(key) % 9000 + 500);
    const t = D(256, 256, (g, w, h) => {
      g.fillStyle = rgb(base); g.fillRect(0, 0, w, h); blotch(g, w, h, seed, 20, 0.04);
      const n = 2, bh = h / n;
      for (let j = 0; j < n; j++) { g.fillStyle = rgb(joint); g.fillRect(0, j * bh, w, 5); g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(0, j * bh + 5, w, 3); }
      speckle(g, w, h, seed + 1, 300, 0.05);
    }, 'rustic-' + key);
    return { tex: t, tu: 1.4, tv: 2 * step };
  };

  /** a window sheet.  o: head 'flat' | 'arch' | 'point' | 'round', frame colour, glass 'day' | 'dark', bars 'two' (transom + upper pair) | 'three' | 'cross' | 'none' | 'slit', ratio h / w, f frame px, mull */
  A.win = (key, o = {}) => {
    const ratio = o.ratio ?? 1.9, pw = 80, ph = Math.max(48, Math.min(256, Math.round(pw * ratio)));
    const t = D(pw, ph, (g, w, h) => {
      const frame = o.frame || '#eee9de', f = o.f ?? Math.max(4, w * 0.075), head = o.head || 'flat';
      g.fillStyle = frame; g.fillRect(0, 0, w, h);
      const glass = (inset) => {
        g.beginPath();
        if (head === 'arch') { const r = (w - 2 * inset) / 2; g.moveTo(inset, h); g.lineTo(inset, inset + r); g.arc(w / 2, inset + r, r, Math.PI, 0); g.lineTo(w - inset, h); }
        else if (head === 'point') { const r = (w - 2 * inset); g.moveTo(inset, h); g.lineTo(inset, inset + r * 0.9); g.quadraticCurveTo(inset + 0.02 * r, inset + r * 0.25, w / 2, inset); g.quadraticCurveTo(w - inset - 0.02 * r, inset + r * 0.25, w - inset, inset + r * 0.9); g.lineTo(w - inset, h); }
        else if (head === 'round') { g.ellipse(w / 2, h / 2, w / 2 - inset, h / 2 - inset, 0, 0, TAU); }
        else { g.rect(inset, inset, w - 2 * inset, h - 2 * inset); }
        g.closePath();
      };
      const dark = o.glass === 'dark';
      const gr = g.createLinearGradient(0, 0, w * 0.3, h);
      gr.addColorStop(0, dark ? '#4e6272' : '#a9c2d3'); gr.addColorStop(0.5, dark ? '#334552' : '#78929f'); gr.addColorStop(1, dark ? '#202c35' : '#4d6676');
      g.fillStyle = gr; glass(f); g.fill();
      g.save(); glass(f); g.clip(); g.fillStyle = 'rgba(255,255,255,0.16)'; g.beginPath(); g.moveTo(w * 0.1, h); g.lineTo(w * 0.5, 0); g.lineTo(w * 0.72, 0); g.lineTo(w * 0.32, h); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, w, f * 1.7); g.fillRect(0, 0, f * 1.6, h);                  // inner shadow of the reveal
      g.restore();
      g.fillStyle = frame;
      const bars = o.bars || 'two', m = o.mull ?? Math.max(3, w * 0.05);
      if (bars === 'two' || bars === 'three') {
        const ty = h * (bars === 'two' ? 0.3 : 0.26); g.fillRect(f, ty - m / 2, w - 2 * f, m);
        g.fillRect(w / 2 - m / 2, f, m, ty - f);
        if (bars === 'three') { g.fillRect(f, h * 0.62 - m / 2, w - 2 * f, m * 0.8); }
        g.fillRect(w / 2 - m / 2, ty, m, h - ty - f);
      } else if (bars === 'cross') { g.fillRect(w / 2 - m / 2, f, m, h - 2 * f); g.fillRect(f, h * 0.38 - m / 2, w - 2 * f, m); }
      else if (bars === 'slit') { g.fillRect(f, h * 0.5 - m / 2, w - 2 * f, m * 0.7); }
      else if (bars === 'v3' || bars === 'v4') { const n = bars === 'v3' ? 3 : 4; for (let i = 1; i < n; i++) g.fillRect(f + (w - 2 * f) * i / n - m / 2, f, m, h - 2 * f); g.fillRect(f, h * 0.62 - m / 2, w - 2 * f, m * 0.8); }
      glass(f); g.lineWidth = Math.max(1.5, f * 0.35); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.stroke();
    }, 'win-' + key);
    return t;
  };
  A.FONTS = tex.FONTS; A.speckle = speckle; A.blotch = blotch; A.R = R; A.D = D; A.hashStr = hashStr;
  return A;
}
