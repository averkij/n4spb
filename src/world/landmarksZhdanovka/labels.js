// landmarksZhdanovka/labels.js - reserve a rectangle of a wall in the shared facade-label registry (docs/rules/LABELS-API.md) before a plain shop fascia is drawn.
import { makeLabels } from '../streets/labels.js';
import { toWorld } from './frame.js';

/** a reserve(cx, y, w, h) callback for facade.js front(): the wall of the edge frame f (frame.js edgeFrame), building id bid, standoff 6 cm */
export function reserver(ctx, bid, f, kind = 'shop') {
  const labels = (ctx.services.labels ||= makeLabels());
  return (cx, y, w, h) => { const p = toWorld(f, cx, 0.06); return labels.reserve(bid, p.x, y, p.z, w, h, f.n[0], f.n[1], kind); };
}

/** the eight plain fascia boards (generic words: pharmacy, cafe, groceries ...) as an array of atlas rows */
export const SIGNS = (M) => Array.from({ length: 8 }, (_, i) => M['sg' + i]);

/** a walk(cx, zc, w, d, top) callback for facade.js front(): a walkable step box of the edge frame f (width along the wall) */
export function stepper(ctx, f) {
  const rot = Math.atan2(-f.t[1], f.t[0]);
  return (cx, zc, w, d, top) => { if (!ctx.physics || !ctx.physics.addWalkBox) return; const p = toWorld(f, cx, zc); const it = ctx.physics.addWalkBox(p.x, p.z, w, d, rot, top); if (it && typeof it === 'object') it.sticky = true; };
}
