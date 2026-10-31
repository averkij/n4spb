// landmarksZhdanovka/facade.js - one street front of a house as a stack of floor rows with REAL windows: every row is a plaster tile row (atlas row, uv u = x / tile, v 0..1 over the floor)
// with rectangular holes cut out (geom.js wallHoles), each hole gets reveals + a recessed glass picture (windowOpen) in the infinite-range group and the carved extras (sill, surround, lintel / hood,
// door steps and canopy, plain shop fascia boards) in a ranged group.
// All coordinates are in the EDGE FRAME of the wall (frame.js: x to the right, z outward, origin at the left end of the edge): the caller has done P.push(S.x, 0, S.z, rot).
import { wallHoles, windowOpen, surround } from './geom.js';
import { hash } from './kit.js';

/**
 * rows = [{ mat (atlas row: M.o7f2 ...), h, holes?: extra holes (rows-relative y), win?: { w, y0, y1, types: [M.g7a ...], rev, d?, sill?: mat, sillExt?, surround?: mat, sw?, lintel?: mat, lh?, hood?: (P, cx, wy1, w, cfg) => void,
 *            skip?: Set(axis), over?: { axis: { w, y0, y1, types, door? } }, fascia?: { mat, y0, h, trim? } } }]
 * spec = { len, pitch?, y0?, seed, far? (range of the carved extras), walk?: (cx, zc, w, d, top) => void (a walkable step box in the edge frame), reserve?: (cx, y, w, h) => bool (the label registry: a fascia is drawn only when its wall rectangle is free), stepMat?, canopyMat? }.
 * Returns { N, tile, y, wins } (the y reached; every window { cx, x0, x1, y0, y1, k, row, door }).
 */
export function front(P, M, spec, rows) {
  const len = spec.len, N = Math.max(1, Math.round(len / (spec.pitch || 2.94))), tile = len / N, far = spec.far || 260;
  let y = spec.y0 || 0;
  const extras = [], all = [];
  rows.forEach((r, ri) => {
    const hM = (r.mat.__atlas && r.mat.__atlas.hM) || r.h, wn = r.win, holes = (r.holes || []).map((h) => ({ ...h, y0: y + h.y0, y1: y + h.y1 })), wins = [];
    if (wn) {
      for (let k = 0; k < N; k++) {
        if (wn.skip && wn.skip.has(k)) continue;
        const o = (wn.over && wn.over[k]) || wn, cx = (k + 0.5) * tile;
        const w = o.w ?? wn.w, y0 = y + (o.y0 ?? wn.y0), y1 = y + (o.y1 ?? wn.y1), types = o.types || wn.types;
        if (w > tile - 0.3) continue;
        const h = { x0: cx - w / 2, x1: cx + w / 2, y0, y1 }; holes.push(h);
        wins.push({ ...h, cx, w, k, row: ri, base: y, door: !!o.door, type: types[Math.floor(hash(spec.seed, k, ri) * types.length)], cfg: o });
      }
    }
    wallHoles(P, r.mat, 0, len, y, y + r.h, holes, (x, yy) => [x / tile, Math.min(1, (yy - y) / hM)]);
    for (const w of wins) { windowOpen(P, wn.rev, w.type, w.x0, w.x1, w.y0, w.y1, w.door ? 0.34 : (wn.d ?? 0.24)); extras.push([wn, w]); all.push(w); }
    y += r.h;
  });
  P.ranged(far, () => {
    for (const [wn, w] of extras) {
      const c = w.cfg, sw = wn.surround ? wn.sw ?? 0.1 : 0;
      if (wn.surround) surround(P, wn.surround, w.x0, w.x1, w.y0, w.y1, wn.sw ?? 0.1, wn.spr ?? 0.04, 1);
      if (w.door) {                                                                                            // two granite steps and a flat canopy on two consoles
        const sm = spec.stepMat || wn.sill || wn.surround, cm = spec.canopyMat || wn.surround;
        P.box(sm, w.x0 - 0.35, w.x1 + 0.35, 0, 0.16, 0, 1.1, 'kb', 1.2); P.box(sm, w.x0 - 0.15, w.x1 + 0.15, 0.16, 0.32, 0, 0.3, 'kb', 1.2);
        if (spec.walk) { spec.walk(w.cx, 0.55, w.w + 0.7, 1.1, 0.16); spec.walk(w.cx, 0.15, w.w + 0.3, 0.3, 0.32); }                  // the player can step up to the (closed) door (the wall collider keeps him 0.7 m off the wall: the lower step is 1.1 m deep)
        P.box(cm, w.x0 - 0.3, w.x1 + 0.3, w.y1 + sw + 0.06, w.y1 + sw + 0.24, 0, 0.75, 'k', 1);
        for (const s of [-1, 1]) P.box(cm, w.cx + s * (w.w / 2 + 0.12) - 0.06, w.cx + s * (w.w / 2 + 0.12) + 0.06, w.y1 - 0.5, w.y1 + sw + 0.06, 0, 0.6, 'k', 1);
        continue;
      }
      if (wn.sill) P.box(wn.sill, w.x0 - (wn.sillExt ?? 0.1), w.x1 + (wn.sillExt ?? 0.1), w.y0 - 0.1, w.y0 + 0.02, 0, wn.sillPr ?? 0.16, 'klr', 1);
      if (wn.lintel) P.box(wn.lintel, w.x0 - 0.14, w.x1 + 0.14, w.y1 + sw, w.y1 + sw + (wn.lh ?? 0.16), 0, wn.lpr ?? 0.12, 'klr', 1);
      if (wn.hood) wn.hood(P, w.cx, w.y1 + sw, w.w + 0.3, c);
      const fa = wn.fascia;                                                                                     // a plain shop fascia board (no lettering, no logos) above the shop window
      if (fa && (!spec.reserve || spec.reserve(w.cx, w.base + fa.y0 + fa.h / 2, w.w + 0.5, fa.h))) {
        const fw = w.w + 0.5;
        P.box(fa.mat, w.cx - fw / 2, w.cx + fw / 2, w.base + fa.y0, w.base + fa.y0 + fa.h, 0, 0.1, 'klr', 1);
        if (fa.signs) { const sg = fa.signs[Math.floor(hash(spec.seed, w.k, 5) * fa.signs.length)], x0 = w.cx - fw / 2 + 0.06, x1 = w.cx + fw / 2 - 0.06, ya = w.base + fa.y0 + 0.05, yb = w.base + fa.y0 + fa.h - 0.05; P.quad(sg, [x0, ya, 0.106], [x1, ya, 0.106], [x1, yb, 0.106], [x0, yb, 0.106], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
        if (fa.trim) { P.box(fa.trim, w.cx - fw / 2 - 0.04, w.cx + fw / 2 + 0.04, w.base + fa.y0 + fa.h, w.base + fa.y0 + fa.h + 0.05, 0, 0.13, 'k', 1); P.box(fa.trim, w.cx - fw / 2 - 0.04, w.cx + fw / 2 + 0.04, w.base + fa.y0 - 0.05, w.base + fa.y0, 0, 0.13, 'k', 1); }
      }
    }
  });
  return { N, tile, y, wins: all };
}
