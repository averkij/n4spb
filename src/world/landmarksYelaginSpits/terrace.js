// landmarksYelaginSpits/terrace.js - the raised sand-gravel terrace plaza behind the wall, its granite curb, the physics floor, and the gravel patch of the mapped footway area w1217811697 (the "unpaved" ring along
// the shore: terrace + both wings).  Photos spit 03, 12, 17, 18, 25; dossier 5.1.
//   * PLAZA: 27 m x 13 m between the returns and the park edge, raised by TERRACE (0.30 m) over the lawn, rounded east corners (R 3 m), gravel #c9b5a2, a 0.22 m granite curb 0.34 m high along the free
//     edges (the park-side steps replace it between a = -9 .. +9: stairs.js).  Walk box: rectangle a -13.9..13.9, b -13.2..-0.2.
//   * GRAVEL RING: the OSM area w1217811697 (29 vertices, 700 m2) is claimed in groups.js; streets then does not draw it (nor the footway ribbons inside it): this file lays the same gravel texture over the whole
//     ring at y 0.045 (under the raised plaza it is hidden).  Hand-over note: the cobble wings lie at the rim of the ring.
import { TERRACE, TERRACE_E, faceB, HL, world, local, box } from './frame.js';
import { arc, strip, flat } from './wall.js';

const CURB_H = TERRACE + 0.04, CURB_W = 0.22, R_C = 3.0;
export const SIDE = { a: 14.0, bRet: -5.9 };

/** the free-edge path of the plaza in two halves: south side down to the steps, and the steps' north end around to the north return; [[a, b], ...] each */
function edges() {
  const south = [[13.89, -5.81], [14.0, -10.2]], north = [[-13.73, -6.02]];
  for (let i = 1; i <= 8; i++) { const t = (i / 8) * Math.PI / 2; south.push([11 + R_C * Math.cos(t), -10.2 - R_C * Math.sin(t)]); }
  south.push([9, TERRACE_E]);
  const nw = [[-9, TERRACE_E]];
  for (let i = 0; i <= 8; i++) { const t = (i / 8) * Math.PI / 2; nw.push([-11 - R_C * Math.sin(t), -10.2 - R_C * Math.cos(t)]); }
  nw.push(...north);
  return { south, north: nw };
}

export function terrace(ctx, P, M, svc) {
  const e = edges(), face = arc(-HL, HL, 14);
  // the plaza surface (the polygon runs the face line, the south edge, the east edge across the steps, the north edge)
  const ring = face.concat(e.south, e.north);
  P.cap(M.gravel, ring, TERRACE, true, 3);
  // curbs: outer face, top, inner lip (the inner lip is a reversed polyline, so its normal looks into the plaza)
  for (const line of [e.south, e.north]) {
    strip(P, M.granite, line, 0, 0, CURB_H, 3, 3, 0);
    flat(P, M.granite, line, 0, -CURB_W, CURB_H, true, 3);
    strip(P, M.granite, line.slice().reverse(), CURB_W, TERRACE, CURB_H, 3, 3, 0);
  }
  // floor
  const [cx, cz, w, d, r] = box(0, (TERRACE_E - 0.2) / 2, 27.8, -TERRACE_E - 0.2);
  ctx.physics.addWalkBox(cx, cz, w, d, r, TERRACE, -0.3);
  svc.terrace = { x: cx, z: cz, w, d, rotY: r, y: TERRACE };
}

/** the gravel layer over the whole claimed ring (mapped area w1217811697): flat at y 0.045, hidden under the raised plaza, visible on the wings */
export function gravelRing(ctx, P, M, areas) {
  const a = areas.find((q) => q.id === 'w1217811697');
  if (!a) return 0;
  let n = 0;
  for (const poly of a.polys || []) {
    const pts = []; for (let i = 0; i < poly.o.length; i += 2) pts.push(local(poly.o[i], poly.o[i + 1]));
    P.cap(M.gravel, pts, 0.045, true, 3); n++;
  }
  return n;
}
void world; void faceB;
