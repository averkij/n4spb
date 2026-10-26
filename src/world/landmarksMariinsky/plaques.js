// landmarksMariinsky/plaques.js - the flat wall plaques of the sights, with legible Russian text, reserved through ctx.services.labels (docs/rules/LABELS-API.md) before they are drawn:
//   * the Conservatory name plate beside the north door: «САНКТ-ПЕТЕРБУРГСКАЯ ГОСУДАРСТВЕННАЯ КОНСЕРВАТОРИЯ имени Н. А. РИМСКОГО-КОРСАКОВА» (dark blue-grey, white capitals)
//   * the memorial plaque to the Conservatory students who fell in the war (ru.wikipedia 'Театральная площадь', the Conservatory section): «Светлой памяти студентов, аспирантов, педагогов ... отдавших жизнь за
//     свободу и независимость нашей Родины в годы Великой Отечественной войны» (names omitted: the real plaque lists them)
//   * the Mariinsky plaque «Памяти сотрудников, погибших в Великую Отечественную войну 1941—1945 гг.» (1967) beside the side entrance
// A plaque is a flat quad 3 cm off the wall, in the frame of a facade edge (x along the wall, z out).
import { onEdge } from './kit.js';

export function plaqueMat(K, key, lines, o = {}) {
  const w = o.w || 512, h = o.h || 320, T = K.ctx.mat.toon, tex = K.ctx.tex;
  const map = tex.draw(w, h, (g) => {
    g.fillStyle = o.bg || '#2d3744'; g.fillRect(0, 0, w, h);
    g.strokeStyle = o.rim || '#c8b27a'; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
    g.strokeStyle = o.rim2 || 'rgba(255,255,255,0.18)'; g.lineWidth = 2; g.strokeRect(22, 22, w - 44, h - 44);
    g.fillStyle = o.fg || '#f1ecdc'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = lines.length, top = 40, avail = h - 80;
    lines.forEach((s, i) => tex.fitText(g, s, w / 2, top + avail * (i + 0.5) / n, w * 0.84, avail / n * 0.86, (o.fonts && o.fonts[i]) || tex.FONTS.serif, (o.weights && o.weights[i]) || 600));
  }, { key });
  return T('#ffffff', { map, name: key, paint: 0 });
}

/** hang a plaque on an edge frame: edge e, along-wall position u (centre), height y (centre), size w x h; returns true when drawn */
export function hang(K, e, u, y, w, h, mat, kind = 'plate-landmark') {
  const labels = K.ctx.services.labels;
  let ok = false;
  onEdge(K.P, e, (len, f) => {
    const cx = f.x + f.xa[0] * u + e.n[0] * 0.03, cz = f.z + f.xa[1] * u + e.n[1] * 0.03;
    if (labels && !labels.reserve(0, cx, y, cz, w, h, e.n[0], e.n[1], kind)) return;
    K.P.box(K.mats.iron, u - w / 2 - 0.03, u + w / 2 + 0.03, y - h / 2 - 0.03, y + h / 2 + 0.03, 0.005, 0.025, 'kb');
    K.plane(mat, u - w / 2, u + w / 2, y - h / 2, y + h / 2, 0.03);
    ok = true;
  });
  return ok;
}
