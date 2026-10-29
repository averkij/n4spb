// landmarksMakarova/bays.js - n4spb (docs/AREAS.md 13.7, docs/vo-m2.md): the helper of the breakable fences / gates of this module. A panel (a fence bay between two piers, an iron gate leaf) is a unit panel of
// lib/fence-bays.js whose v coordinate repeats every `vTile` metres (a bay is stretched along u, so its u1 is the number of texture tiles along the bay).
import { unitPanel } from '../lib/fence-bays.js';

/** a unit panel x 0..1, y y0..y1; uv u 0..u1, v 0..(y1 - y0) / vTile */
export function tiledPanel(y0, y1, u1, vTile = 1) {
  const g = unitPanel(y0, y1, { u1 }), uv = g.attributes.uv, k = (y1 - y0) / vTile;
  for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * k);
  return g;
}
