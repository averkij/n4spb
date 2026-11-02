// Singer House crown sculpture, modelled from the owner's November 2026 close-up:
// raised feathered eagle, paired draped globe bearers, acanthus and a glass globe
// crossed by a broad inclined metal belt. Everything is immutable Parts geometry.
// Frame: tower centre x=z=0, front +z; heights are absolute in that frame.
import * as THREE from 'three';

const TAU = Math.PI * 2;
const add = (a, b) => a.map((v, i) => v + b[i]);
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

/** A closed, ridged leaf / feather: three triangular cross sections and a tip. */
function blade(P, mat, a, b, width, relief = .045, normal = [0, 0, 1]) {
  const axis = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)).normalize();
  const n = new THREE.Vector3(...normal).normalize();
  const side = new THREE.Vector3().crossVectors(n, axis).normalize();
  n.crossVectors(axis, side).normalize();
  const rings = [];
  for (const [t, w] of [[0, .13], [.36, 1], [.74, .63]]) {
    const c = new THREE.Vector3(...mix(a, b, t));
    const l = c.clone().addScaledVector(side, width * w).addScaledVector(n, -relief * .35);
    const r = c.clone().addScaledVector(side, -width * w).addScaledVector(n, -relief * .35);
    const ridge = c.clone().addScaledVector(n, relief * (.75 + Math.sin(t * Math.PI) * .25));
    rings.push([l.toArray(), ridge.toArray(), r.toArray()]);
  }
  const back = n.clone().negate().toArray(), front = n.toArray();
  P.fan(mat, rings[0], axis.clone().negate().toArray());
  for (let j = 0; j < 2; j++) {
    const a0 = rings[j], a1 = rings[j + 1];
    P.quad(mat, a0[0], a1[0], a1[1], a0[1], front);
    P.quad(mat, a0[1], a1[1], a1[2], a0[2], front);
    P.quad(mat, a0[2], a1[2], a1[0], a0[0], back);
  }
  const end = rings[2];
  P.fan(mat, [end[0], b, end[1]], front);
  P.fan(mat, [end[1], b, end[2]], front);
  P.fan(mat, [end[2], b, end[0]], back);
}

function tube(P, mat, points, radius, seg = 5) {
  for (let i = 1; i < points.length; i++) P.cyl(mat, points[i - 1], points[i], radius, radius, seg, false);
}

function drape(P, mat, x, y, z, lean, phase) {
  // A fluted closed skirt, with separate front ridges following hanging folds.
  const levels = [[0, .60, .36], [.35, .55, .36], [.85, .40, .29], [1.3, .36, .25], [1.7, .43, .29]];
  const rings = levels.map(([h, w, d]) => Array.from({ length: 16 }, (_, i) => {
    const a = i / 16 * TAU;
    const flute = 1 + .09 * Math.cos(a * 7 + phase);
    return [x + lean * h + Math.sin(a) * w * flute, y + h, z + Math.cos(a) * d * flute];
  }));
  for (let j = 1; j < rings.length; j++) for (let i = 0; i < 16; i++) {
    const k = (i + 1) % 16, a = (i + .5) / 16 * TAU;
    P.quad(mat, rings[j - 1][i], rings[j - 1][k], rings[j][k], rings[j][i], [Math.sin(a), 0, Math.cos(a)]);
  }
  P.cap(mat, rings[0].map((p) => [p[0], p[2]]), y, false);
  for (let i = 0; i < 7; i++) {
    const a = -.95 + i / 6 * 1.9, points = [];
    for (const [h, w, d] of levels) points.push([x + lean * h + Math.sin(a + .11 * h) * w * 1.02, y + h, z + Math.cos(a + .11 * h) * d * 1.04]);
    tube(P, mat, points, .028);
  }
}

function eagle(P, S, sphere, y, radius) {
  P.push(0, y, radius + .14);
  const blob = (mat, p, s, rz = 0) => P.geo(mat, sphere, ...p, 0, 0, rz, ...s);
  // Draped pedestal: broad sagging side ribbons and a central hanging tail.
  for (const sg of [-1, 1]) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 1.16); shape.bezierCurveTo(sg * .7, .69, sg * 1.05, .91, sg * 1.64, 1.11);
    shape.lineTo(sg * 1.53, .72); shape.bezierCurveTo(sg * .99, .45, sg * .5, .50, 0, .92); shape.closePath();
    P.extrude(S.green, shape, -.04, .12, 1, 6);
    tube(P, S.greenDark, [[sg * .08, 1.08, .10], [sg * .55, .71, .11], [sg * 1.0, .69, .11], [sg * 1.51, .91, .10]], .035);
    for (let i = 0; i < 4; i++) blade(P, S.green, [sg * (.2 + i * .12), .98, .22], [sg * (.24 + i * .15), .20 + i * .09, .24], .09, .04);
    // Broad wing shoulders sit behind two individually separated feather rows.
    blob(S.greenDark, [sg * .62, 1.94, .10], [.45, .62, .17], sg * -.48);
    for (let i = 0; i < 10; i++) {
      blade(P, i % 3 === 0 ? S.greenDark : S.green,
        [sg * (.44 + i * .062), 1.56 + i * .052, .12],
        [sg * (.91 + i * .149), 2.10 + i * .138, .10 - i * .008], .108, .055);
    }
    for (let i = 0; i < 9; i++) blade(P, S.green,
      [sg * (.32 + i * .08), 1.45 + i * .075, .25],
      [sg * (.67 + i * .139), 1.83 + i * .118, .25], .102, .05);
    for (let i = 0; i < 6; i++) blade(P, S.green,
      [sg * .25, 1.28 + i * .09, .34], [sg * (.64 + i * .077), 1.49 + i * .105, .36], .09, .045);
  }
  blob(S.green, [0, 1.52, .27], [.43, .65, .34]);
  // Overlapping breast feathers make a scaled surface rather than a smooth egg.
  for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
    const x = (col - 1) * .19 + (row % 2) * .025;
    blade(P, row % 2 ? S.green : S.greenDark, [x, 1.94 - row * .19, .57], [x * 1.03, 1.65 - row * .19, .61], .102, .035);
  }
  blob(S.greenDark, [0, 2.13, .25], [.24, .27, .22]);
  blob(S.green, [-.035, 2.35, .32], [.245, .25, .23], .15);
  P.cyl(S.bronze, [-.17, 2.36, .49], [-.39, 2.27, .51], .105, .012, 5, true);
  blob(S.greenDark, [-.14, 2.43, .513], [.04, .025, .018]);
  blade(P, S.green, [-.07, 2.58, .30], [.18, 2.64, .30], .12, .035);
  for (const sg of [-1, 1]) {
    P.cyl(S.greenDark, [sg * .20, 1.03, .39], [sg * .30, .80, .48], .074, .06, 6, true);
    for (let i = 0; i < 3; i++) tube(P, S.green, [[sg * .30, .81, .48], [sg * (.21 + .09 * i), .73, .62], [sg * (.23 + .09 * i), .68, .58]], .03, 4);
  }
  for (let i = 0; i < 5; i++) blade(P, S.green, [(i - 2) * .055, 1.10, .33], [(i - 2) * .13, .10 + Math.abs(i - 2) * .08, .40], .09, .045);
  P.pop();
}

function bearers(P, S, sphere, tinySphere, capY, globeY, globeRadius) {
  const blob = (mat, p, s, rz = 0, tiny = false) => P.geo(mat, tiny ? tinySphere : sphere, ...p, 0, 0, rz, ...s);
  // Separate overlapping acanthus leaves; their tips curl away from the pedestal.
  for (let row = 0; row < 2; row++) for (let i = 0; i < 12; i++) {
    const a = (i + row * .5) / 12 * TAU, n = [Math.sin(a), .12, Math.cos(a)];
    const r0 = row ? .56 : .88, r1 = row ? .83 : 1.22;
    blade(P, i % 3 ? S.green : S.greenDark,
      [Math.sin(a) * r0, capY + .12 + row * .40, Math.cos(a) * r0],
      [Math.sin(a) * r1, capY + 1.00 + row * .44, Math.cos(a) * r1], .24, .10, n);
  }
  for (const sg of [-1, 1]) {
    const baseY = capY + .78, x = sg * .64, z = sg < 0 ? .05 : -.15, lean = -sg * .045;
    drape(P, S.green, x, baseY, z, lean, sg);
    blob(S.green, [x + lean * 1.8, baseY + 1.72, z], [.38, .59, .28], sg * -.12);
    // One bent knee and feet emerge from the heavy garment, avoiding a cone silhouette.
    blob(S.greenDark, [x + sg * .24, baseY + .45, z + .24], [.23, .42, .21], sg * .25);
    blob(S.green, [x + sg * .20, baseY + .10, z + .24], [.18, .12, .37], sg * .14);
    blob(S.green, [x - sg * .18, baseY + .06, z + .12], [.16, .11, .30]);
    // Diagonal sash and short shoulder folds give the garment a human construction.
    for (let i = 0; i < 4; i++) tube(P, i % 2 ? S.greenDark : S.green,
      [[x - sg * .27, baseY + 1.17 + i * .09, z + .23], [x, baseY + 1.40 + i * .09, z + .33], [x + sg * .30, baseY + 1.69 + i * .07, z + .22]], .039);
    const head = [x - sg * .03, baseY + 2.38, z + .15];
    P.cyl(S.green, [head[0], baseY + 1.99, z + .10], [head[0], baseY + 2.20, z + .13], .13, .12, 7, true);
    blob(S.greenDark, add(head, [0, .055, -.10]), [.255, .30, .235], sg * -.10);
    blob(S.green, head, [.215, .273, .205], sg * -.10);
    blob(S.green, add(head, [0, -.04, .185]), [.10, .15, .055], 0, true);
    P.cyl(S.green, add(head, [0, .03, .16]), add(head, [0, -.015, .27]), .06, .027, 5, true);
    for (const side of [-1, 1]) {
      blob(S.greenDark, add(head, [side * .086, .06, .19]), [.038, .018, .012], 0, true);
      tube(P, S.green, [add(head, [side * .04, .11, .19]), add(head, [side * .14, .09, .17])], .022, 4);
      blob(S.green, add(head, [side * .205, -.015, .015]), [.055, .085, .05], 0, true);
    }
    tube(P, S.greenDark, [add(head, [-.063, -.115, .184]), add(head, [0, -.125, .207]), add(head, [.055, -.117, .184])], .014, 4);
    for (let i = 0; i < 7; i++) {
      const a = (i / 6 - .5) * Math.PI;
      blob(S.green, add(head, [Math.sin(a) * .205, .18 + Math.cos(a) * .07, -.012]), [.075, .085, .09], 0, true);
    }
    // Both figures actually touch the lower hemisphere with bent raised arms.
    for (let arm = 0; arm < 2; arm++) {
      const outer = arm === 0;
      const shoulder = [x + sg * (outer ? .28 : -.26), baseY + 1.90, z + (outer ? -.02 : .08)];
      const elbow = [sg * (outer ? 1.22 : .25), baseY + 2.65, outer ? -.02 : .68];
      const hx = sg * (outer ? .98 : .35), hz = outer ? .20 : .98;
      const hy = globeY - Math.sqrt(Math.max(.1, globeRadius * globeRadius - hx * hx - hz * hz));
      const hand = [hx, hy, hz];
      blob(S.green, shoulder, [.22, .25, .22]);
      P.cyl(S.green, shoulder, elbow, .17, .135, 7, true);
      blob(S.green, elbow, [.14, .14, .14], 0, true);
      P.cyl(S.green, elbow, hand, .12, .085, 7, true);
      blob(S.green, hand, [.13, .125, .095], sg * .18, true);
      for (let f = 0; f < 4; f++) P.cyl(S.green,
        [hx + (f - 1.5) * .047, hy + .03, hz + .035],
        [hx + (f - 1.5) * .046, hy + .13, hz + .10], .022, .017, 4, true);
    }
  }
}

function globe(P, S, y, r) {
  const glass = new THREE.SphereGeometry(r, 24, 16);
  P.geo(S.globe, glass, 0, y, 0); glass.dispose();
  // Pale metal, as in the reference. Ribs follow complete spherical circles.
  const rib = new THREE.TorusGeometry(r + .027, .026, 3, 40);
  for (let i = 0; i < 7; i++) P.geo(S.trim, rib, 0, y, 0, 0, i / 7 * Math.PI, 0);
  rib.dispose();
  for (const t of [-.64, -.31, .31, .64]) {
    const ring = new THREE.TorusGeometry(Math.sqrt(1 - t * t) * (r + .025), .025, 3, 36);
    P.geo(S.trim, ring, 0, y + t * (r + .025), 0, Math.PI / 2); ring.dispose();
  }
  const belt = new THREE.CylinderGeometry(r + .065, r + .065, .48, 48, 1, true);
  P.geo(S.trim, belt, 0, y, 0, -.16, 0, -.36); belt.dispose();
  // Torus edges share the belt's inclined equatorial plane, rather than horizontal collars.
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.16, 0, -.36));
  const edge = new THREE.TorusGeometry(r + .066, .037, 3, 48);
  edge.rotateX(Math.PI / 2);
  for (const sg of [-1, 1]) {
    const p = new THREE.Vector3(0, sg * .24, 0).applyQuaternion(q);
    P.geo(S.trim, edge, p.x, y + p.y, p.z, -.16, 0, -.36);
  }
  edge.dispose();
}

/** Emit static crown details into the caller's collector; no ctx or runtime work. */
export function buildSingerSculptures(P, S, opts = {}) {
  const { eagleY = 26.0, eagleRadius = 3.1, capY = 31.4, globeY = 36.9, globeRadius = 1.65 } = opts;
  const sphere = new THREE.SphereGeometry(1, 8, 6), tinySphere = new THREE.SphereGeometry(1, 6, 4);
  eagle(P, S, sphere, eagleY, eagleRadius);
  bearers(P, S, sphere, tinySphere, capY, globeY, globeRadius);
  sphere.dispose(); tinySphere.dispose();
  globe(P, S, globeY, globeRadius);
}
