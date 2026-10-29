// landmarksMining/plaques.js (copy of landmarksUniversity/plaques.js) - wall plates with the real Russian texts of the dossier (docs/research/university-embankment.md section 8).  A plate is drawn in the CURRENT facade
// frame (kit.onEdge / a pushed frame: x along the wall, z out) and reserves its rectangle through ctx.services.labels (docs/rules/LABELS-API.md): when the place is taken it is skipped.
/**
 * plate(K, { id, x, y (centre), w, h, lines: [..], key, style: 'bronze' | 'stone' | 'board', world: fn(x, z) -> [wx, wz] (the frame's local -> world), n: [nx, nz] wall normal })
 */
export function plate(K, o) {
  const { ctx, P, M } = K, labels = ctx.services.labels, w = o.w ?? 0.9, h = o.h ?? 0.7, z = o.z ?? 0;
  const p = o.world(o.x, z + 0.05);
  if (labels && !labels.reserve(o.id || 0, p[0], o.y, p[1], w, h, o.n[0], o.n[1], 'plate-landmark')) return false;
  const st = o.style || 'bronze', bg = st === 'stone' ? '#d9d4c8' : st === 'board' ? '#1f3350' : '#2a2c2b', fg = st === 'stone' ? '#3a342c' : st === 'board' ? '#f1efe6' : '#cdb779', rim = st === 'stone' ? '#b9b2a2' : st === 'board' ? '#c9b26a' : '#8a7a4a';
  const W = 512, H = Math.max(64, Math.round((512 * h) / w));
  const t = ctx.tex.draw(W, H, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, W, H); g.strokeStyle = rim; g.lineWidth = 6; g.strokeRect(9, 9, W - 18, H - 18);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = o.lines.length, lh = (H - 60) / n;
    o.lines.forEach((s, i) => ctx.tex.fitText(g, s, W / 2, 30 + lh * (i + 0.5), W - 56, Math.min(lh * 0.74, o.size ?? 46), ctx.tex.FONTS.serif, 700));
  }, { key: 'lmMin-plate-' + o.key });
  const mat = ctx.mat.toon('#ffffff', { map: t, name: 'lmMin-plate-' + o.key, paint: 0.01 });
  P.box(M.iron, o.x - w / 2, o.x + w / 2, o.y - h / 2, o.y + h / 2, z, z + 0.04, 'kb');
  P.quad(mat, [o.x - w / 2 + 0.02, o.y - h / 2 + 0.02, z + 0.046], [o.x + w / 2 - 0.02, o.y - h / 2 + 0.02, z + 0.046], [o.x + w / 2 - 0.02, o.y + h / 2 - 0.02, z + 0.046], [o.x - w / 2 + 0.02, o.y + h / 2 - 0.02, z + 0.046], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  return true;
}
