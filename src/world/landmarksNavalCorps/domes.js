// landmarksNavalCorps/domes.js - the five domes and the small gilded domes of the DORMITION CHURCH (docs/research/navalcorps.md 6.1 / 6.3, photos refs/navalcorps c16 c17 c18 c09 c30 c31).
// Frame C (the current Parts frame).  Bodies of revolution (geo.js revolve), heights above the street at the church wall:
//   central dome   drum top 28.0, aluminium cap (dull grey, patched) equator 29.8 (dia 9.2), the lower part wrapped in a GILDED Celtic-knot belt (28.3 .. 31.1, eight cartouches), a gilded cone neck 32.5 .. 36.0
//                  with two collars, a gilded ball d 1.1 (centre 36.5), a gilded Orthodox cross 2.7 m (37.8 .. 40.5) on a stem, four chains from the cross foot to the neck base; cross tip about 40 m
//   corner towers  four, at (5.5, 3.5) (24.7, 3.5) (5.5, 20.5) (24.7, 20.5): brick drum 14.1 .. 20.7 (dia 3.7) with two arched windows and an arcature belt, a BARE SILVER onion (aluminium, 16 ribs; widest 22.2,
//                  dia 4.3), a gilded neck, ball and a gilded cross 2.5 m with chains; cross tip 28.9
//   small domes    three gilded onions on grey fluted stalks over the NE apses (dia 2.1 / 2.5 / 1.8; tips 19.7 / 20.7 / 19.3), diamond-scale (two) and spiral-twisted (the middle one) gilding.
import * as THREE from 'three';
import { revolve, cross } from './geo.js';

const TAU = Math.PI * 2;
/** radius of a polyline profile [[r, y]..] at height y (linear) */
function rAt(prof, y) { for (let i = 0; i + 1 < prof.length; i++) { const a = prof[i], b = prof[i + 1]; if (y >= a[1] - 1e-9 && y <= b[1] + 1e-9) return a[0] + (b[0] - a[0]) * (y - a[1]) / ((b[1] - a[1]) || 1); } return prof[prof.length - 1][0]; }
const ball = (P, mat, x, y, z, r, seg = 12) => { const g = new THREE.SphereGeometry(r, seg, Math.max(5, seg >> 1)); P.geo(mat, g, x, y, z); g.dispose(); };
/** four thin chains from a point (cx, y1, cz) at the cross foot down to a ring of radius r2 at y2 (gilded beads: a thin tube) */
function chains(P, M, cx, cz, y1, r1, y2, r2) {
  for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + Math.PI / 4; P.cyl(M.gild, [cx + Math.sin(a) * r1, y1, cz + Math.cos(a) * r1], [cx + Math.sin(a) * r2, y2, cz + Math.cos(a) * r2], 0.014, 0.014, 4, false); }
}
/** a gilded Orthodox cross of height h whose foot is at (x, y, z): a stem, the main bar, a short upper bar, a slanted foot bar; the bars face +z (rot about y) */
export function goldCross(P, M, x, y, z, h, rot = 0) {
  cross(P, M.gild, x, y, z, h, rot);
  P.push(x, y, z, rot); P.box(M.gild, -h * 0.09, h * 0.09, h * 0.2, h * 0.2 + h * 0.03, -h * 0.02, h * 0.02, '', 1); P.pop();
}

export function centralDome(P, M, cx, cz) {
  const prof = [[4.6, 28.0], [4.74, 28.6], [4.78, 29.2], [4.6, 29.8], [4.3, 30.5], [3.6, 31.3], [2.5, 32.0], [1.3, 32.5]];
  revolve(P, M.domeAl, prof, 48, { cx, cz, uRep: 8, vTile: 2 });
  // the gilded belt: the curve between y 28.3 and 31.1, pushed 6 cm outwards
  const yy = [28.3, 28.6, 29.2, 29.8, 30.4], belt = yy.map((y) => [rAt(prof, y) + 0.07, y]);
  revolve(P, M.knot, belt, 48, { cx, cz, uRep: 1, vTile: 2 });
  // cone neck 32.5 .. 36.0 with two collars at 33.4 and 34.6, the ball, the stem, the cross
  revolve(P, M.gild, [[1.3, 32.5], [1.05, 33.0], [0.85, 33.35], [0.97, 33.4], [0.97, 33.5], [0.8, 33.55], [0.62, 34.55], [0.72, 34.6], [0.72, 34.7], [0.5, 34.75], [0.36, 35.6], [0.3, 36.0]], 24, { cx, cz, uRep: 2, vTile: 2 });
  ball(P, M.gild, cx, 36.5, cz, 0.55, 14);
  P.col(M.gild, cx, cz, 37.0, 37.8, 0.05, 0.05, 6, false);
  P.cyl(M.gild, [cx - 0.28, 37.55, cz], [cx + 0.28, 37.55, cz], 0.04, 0.04, 6, false);                                      // the crescent at the foot of the cross (a bar)
  goldCross(P, M, cx, 37.8, cz, 2.7, 0);
  chains(P, M, cx, cz, 37.45, 0.3, 32.6, 1.25);
}

export function cornerTower(P, M, x, z, rot = 0) {
  const r = 1.85;
  P.col(M.brickFlat, x, z, 14.0, 17.2, r + 0.1, r + 0.1, 16, false);
  revolve(P, M.brick, [[r, 17.2], [r, 20.7]], 20, { cx: x, cz: z, uRep: 2, vTile: 3.6 });
  revolve(P, M.arcature, [[r + 0.18, 20.2], [r + 0.18, 20.7], [r + 0.0, 20.7]], 20, { cx: x, cz: z, uRep: 3, vTile: 0.5 });
  revolve(P, M.belt, [[r + 0.22, 20.7], [r + 0.22, 20.85], [r - 0.2, 20.85]], 20, { cx: x, cz: z });
  // two small dark arched windows on the river side
  for (const a of [-0.45, 0.45]) { const px = x + Math.sin(a + rot) * (r + 0.02), pz = z + Math.cos(a + rot) * (r + 0.02); P.quad(M.glassDark, [px - Math.cos(a + rot) * 0.22, 18.0, pz + Math.sin(a + rot) * 0.22], [px + Math.cos(a + rot) * 0.22, 18.0, pz - Math.sin(a + rot) * 0.22], [px + Math.cos(a + rot) * 0.22, 19.6, pz - Math.sin(a + rot) * 0.22], [px - Math.cos(a + rot) * 0.22, 19.6, pz + Math.sin(a + rot) * 0.22], [Math.sin(a + rot), 0, Math.cos(a + rot)]); }
  const onion = [[1.3, 20.85], [1.45, 21.0], [1.9, 21.5], [2.15, 22.2], [2.0, 23.2], [1.5, 24.1], [0.8, 24.8], [0.35, 25.3]];
  revolve(P, M.silver, onion, 32, { cx: x, cz: z, uRep: 4, vTile: 2 });
  revolve(P, M.gild, [[0.35, 25.3], [0.3, 25.9]], 12, { cx: x, cz: z });
  ball(P, M.gild, x, 26.1, z, 0.3, 10);
  P.col(M.gild, x, z, 26.3, 26.5, 0.04, 0.04, 5, false);
  goldCross(P, M, x, 26.4, z, 2.5, rot);
  chains(P, M, x, z, 26.3, 0.2, 24.2, 1.05);
}

/** a small gilded dome on a fluted grey stalk: stalk from yBase to yBase + stalkH, onion of belly radius r, tip height `tip` (cross 1.3 m); style 'diamond' | 'spiral' */
export function smallDome(P, M, x, z, yBase, tip, r, style = 'diamond') {
  const crossH = 1.3, ballR = 0.17, onionH = r * 2.1, yOn = tip - crossH - 0.3 - onionH;
  revolve(P, M.stalk, [[r * 0.62, yBase], [r * 0.7, yBase + 0.2], [r * 0.5, yBase + (yOn - yBase) * 0.3], [r * 0.62, yBase + (yOn - yBase) * 0.55], [r * 0.46, yOn - 0.1], [r * 0.7, yOn - 0.05], [r * 0.7, yOn]], 12, { cx: x, cz: z, uRep: 3, vTile: 2 });
  const prof = [[r * 0.7, yOn], [r * 0.95, yOn + onionH * 0.16], [r, yOn + onionH * 0.36], [r * 0.92, yOn + onionH * 0.58], [r * 0.62, yOn + onionH * 0.8], [r * 0.26, yOn + onionH * 0.95], [0.05, yOn + onionH]];
  revolve(P, style === 'spiral' ? M.gild : M.gildDiamond, prof, 20, { cx: x, cz: z, uRep: style === 'spiral' ? 8 : 3, vTile: 1.2 });
  ball(P, M.gild, x, yOn + onionH + 0.05, z, ballR, 8);
  goldCross(P, M, x, yOn + onionH + 0.2, z, crossH, 0);
}
