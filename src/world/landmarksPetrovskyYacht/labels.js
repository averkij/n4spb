// landmarksPetrovskyYacht/labels.js - one helper: reserve a rectangle of a wall in the shared facade-label registry (docs/rules/LABELS-API.md) before a plate is drawn.
import { makeLabels } from '../streets/labels.js';

/** frame = (lx, lz) => { x, z } world point, nrm = world unit normal pointing out of the wall; returns true when the rectangle is free (and now reserved) */
export function reserve(ctx, id, world, y, w, h, nrm, kind = 'plate') {
  const labels = (ctx.services.labels ||= makeLabels());
  return labels.reserve(id, world.x, y, world.z, w, h, nrm[0], nrm[1], kind);
}
