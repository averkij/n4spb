// landmarksStrelka/prows.js - the ROSTRA of the Rostral columns (painted green sheet copper over an iron frame; photos refs/strelka fig_12 fig_14 rc_02 rc_05 rc_09) and the anchors, as cached Figures
// (lib/figures geometry core: Sculpt / tube / blob).  Local frame of a prow: +z = out of the column (the bow), y up, origin = on the column surface at the level of the gunwale at the stern.
//   prow('naiad')    tier 1 at the pedestal: a clinker boat with a crenellated bulwark and the winged NAIAD figurehead (torso, bat wings, a double fish tail twisting down the stem);
//   prow('monster')  tiers 2 and 4: a round-bellied bow with a scroll on top, a monster's head with a fin-shaped ram and a sea horse on each cheek;
//   prow('slender')  tier 3: a slim up-curved bow ending in a volute with a mask;
//   anchor()         the anchor reliefs between the prows (2.2 m, facing +z, origin at its middle).
import * as THREE from 'three';
import { Sculpt, cached, V } from '../lib/figures.js';

/** hull surface: t = 0 at the stern (inside the column by `inset`), 1 at the bow; a U-section from gunwale to gunwale.  Returns { geo, at(t, th) -> point } */
function hull(o) {
  const { L, B, D, sheer = 0.5, full = 1, inset = 0.6, bowPow = 2, rise = 0.72, nt = 10, ns = 10 } = o;
  const at = (t, th) => {
    const z = -inset + (L + inset) * t, tt = Math.max(0, z / L);
    const b = (B / 2) * Math.pow(Math.max(0, 1 - Math.pow(tt, bowPow)), 0.6), g = sheer * tt * tt, d = D * (1 - rise * Math.pow(tt, 2.2));
    const s = Math.sin(th), c = Math.cos(th);
    return [b * Math.sign(s) * Math.pow(Math.abs(s), full), g - d * Math.pow(Math.abs(c), full), z];
  };
  const pos = [], idx = [];
  for (let i = 0; i <= nt; i++) for (let j = 0; j <= ns; j++) pos.push(...at(i / nt, -Math.PI / 2 + Math.PI * j / ns));
  for (let i = 0; i < nt; i++) for (let j = 0; j < ns; j++) { const a = i * (ns + 1) + j, b = a + 1, c = a + ns + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  // deck (a little below the gunwale) so that nobody looks into an empty shell
  const base = pos.length / 3;
  for (let i = 0; i <= nt; i++) { const p = at(i / nt, -Math.PI / 2), q = at(i / nt, Math.PI / 2); pos.push(p[0] * 0.96, p[1] - 0.14, p[2], q[0] * 0.96, q[1] - 0.14, q[2]); }
  for (let i = 0; i < nt; i++) { const a = base + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return { geo: g, at };
}
/** merlons of a bulwark along both gunwales from t0 to t1 */
function merlons(S, H, t0, t1, n, h = 0.38) {
  for (const th of [-Math.PI / 2, Math.PI / 2]) for (let k = 0; k < n; k++) {
    const ta = t0 + (t1 - t0) * (k + 0.12) / n, tb = t0 + (t1 - t0) * (k + 0.62) / n, a = H.at(ta, th), b = H.at(tb, th);
    S.sheet('main', [a, b, V.add(b, [0, h, 0]), V.add(a, [0, h, 0])], 0.035);
  }
  for (const th of [-Math.PI / 2, Math.PI / 2]) { const pts = []; for (let k = 0; k <= 5; k++) pts.push(V.add(H.at(k / 5 * 0.98, th), [0, 0.02, 0])); S.tube('main', pts, 0.05, { seg: 6, per: 3 }); }   // the gunwale rail
}
/** strakes: thin ridges along the planks */
function strakes(S, H, n = 3) {
  for (let k = 1; k <= n; k++) for (const sgn of [1, -1]) { const th = sgn * (Math.PI / 2) * (1 - k / (n + 1.2)), pts = []; for (let i = 0; i <= 6; i++) pts.push(H.at(0.08 + 0.9 * i / 6, th)); S.tube('main', pts, 0.022, { seg: 5, per: 3 }); }
}

export function prow(kind) {
  return cached('lmSt-prow-' + kind, () => {
    const S = new Sculpt({ detail: 1 });
    if (kind === 'naiad') {
      const H = hull({ L: 3.4, B: 3.0, D: 2.3, sheer: 0.7, full: 0.82, inset: 0.7, bowPow: 2.2, nt: 12, ns: 12 });
      S.add('main', H.geo); merlons(S, H, 0.2, 0.62, 3); strakes(S, H, 4);
      // the naiad: she rises from the stem, leaning forward, the arms straight down on the bow, bat wings spread behind, the scaled tail runs down the stem
      const stem = H.at(1, 0), top = [0, stem[1] + 1.05, stem[2] - 0.1];
      S.tube('main', [[0, stem[1] - 0.2, stem[2] - 0.05], [0, stem[1] + 0.35, stem[2] + 0.02], [0, stem[1] + 0.75, stem[2] + 0.0], top], [[0.3, 0.24], [0.27, 0.2], [0.3, 0.2], [0.24, 0.16]], { seg: 10, per: 4 });   // hips, waist, chest
      for (const s of [1, -1]) S.blob('main', [s * 0.12, stem[1] + 0.82, stem[2] + 0.17], [0.1, 0.1, 0.09], { w: 7, h: 5 });
      S.tube('main', [top, V.add(top, [0, 0.16, 0.03])], [[0.08, 0.08], [0.075, 0.075]], { seg: 7, per: 3 });
      const head = V.add(top, [0, 0.34, 0.06]);
      S.blob('main', head, [0.15, 0.19, 0.17], { w: 10, h: 8 }); S.blob('main', V.add(head, [0, -0.02, 0.15]), [0.03, 0.05, 0.04], { w: 5, h: 4 });
      S.tube('main', [V.add(head, [0, 0.14, -0.04]), V.add(head, [0, 0.0, -0.17]), V.add(head, [0, -0.3, -0.2]), V.add(head, [0, -0.6, -0.16])], [[0.15, 0.1], [0.19, 0.1], [0.2, 0.08], [0.14, 0.05]], { seg: 9, per: 4 });   // the long hair
      for (const s of [1, -1]) {
        const sh = V.add(top, [s * 0.27, -0.06, 0]), hand = V.add(H.at(0.9, s * Math.PI / 2), [s * 0.05, 0.05, 0]);
        S.tube('main', [sh, V.add(V.lerp(sh, hand, 0.5), [s * 0.08, 0, 0.02]), hand], [[0.075, 0.075], [0.06, 0.06], [0.05, 0.05]], { seg: 7, per: 4 }); S.blob('main', hand, [0.06, 0.035, 0.09], { w: 6, h: 4 });
        // wing: three fingers of a bat wing from the shoulder blade, backwards and up
        const root = V.add(top, [s * 0.14, -0.1, -0.18]);
        const tips = [[s * 1.15, 0.5, -0.5], [s * 1.25, 0.05, -0.75], [s * 0.85, -0.3, -0.7]].map((d) => V.add(root, d));
        S.sheet('main', [root, tips[0], tips[1]], 0.02); S.sheet('main', [root, tips[1], tips[2]], 0.02);
        for (const tp of tips) S.tube('main', [root, tp], [[0.035, 0.035], [0.012, 0.012]], { seg: 5, per: 2 });
      }
      // the double tail twisting down the stem to the keel, ending in a fin
      const tail = []; for (let k = 0; k <= 7; k++) { const p = H.at(1 - 0.045 * k, 0), a = k * 1.1; tail.push([Math.sin(a) * 0.14, stem[1] - 0.25 - k * 0.24, p[2] + 0.08 + Math.cos(a) * 0.05 - (k > 5 ? (k - 5) * 0.12 : 0)]); }
      S.tube('main', tail, tail.map((_, k) => [0.2 - k * 0.018, 0.17 - k * 0.015]), { seg: 8, per: 3 });
      const te = tail[tail.length - 1]; S.sheet('main', [te, V.add(te, [0.28, -0.3, 0.05]), V.add(te, [0, -0.16, 0.02]), V.add(te, [-0.28, -0.3, 0.05])], 0.02);
    } else if (kind === 'monster') {
      const H = hull({ L: 2.3, B: 2.7, D: 2.6, sheer: 0.1, full: 0.62, inset: 0.7, bowPow: 2.6, rise: 0.42, nt: 12, ns: 12 });
      S.add('main', H.geo); merlons(S, H, 0.25, 0.6, 2, 0.32);
      const stem = H.at(1, 0), yk = stem[1], zs = stem[2];                 // keel point of the bow (the gunwale there is at y = 0.1)
      // the scroll rising over the bow
      S.tube('main', [[0, -0.3, zs - 0.35], [0, 0.45, zs - 0.12], [0, 0.95, zs - 0.3], [0, 0.86, zs - 0.66], [0, 0.6, zs - 0.56]], [[0.2, 0.08], [0.17, 0.07], [0.13, 0.06], [0.1, 0.05], [0.07, 0.04]], { seg: 7, per: 5 });
      // the monster's head on the stem: skull, long snout with an open jaw, brow ridges, ears
      const hc = [0, yk + 0.95, zs - 0.12];
      S.blob('main', hc, [0.3, 0.27, 0.32], { w: 10, h: 7 });
      S.tube('main', [V.add(hc, [0, 0.03, 0.2]), V.add(hc, [0, 0.0, 0.55]), V.add(hc, [0, -0.02, 0.86])], [[0.2, 0.13], [0.16, 0.1], [0.13, 0.08]], { seg: 8, per: 3 });
      S.tube('main', [V.add(hc, [0, -0.2, 0.16]), V.add(hc, [0, -0.27, 0.5]), V.add(hc, [0, -0.3, 0.76])], [[0.16, 0.06], [0.13, 0.05], [0.1, 0.04]], { seg: 7, per: 3 });
      for (const s of [1, -1]) { S.blob('main', V.add(hc, [s * 0.17, 0.17, 0.18]), [0.08, 0.06, 0.1], { w: 6, h: 4 }); S.sheet('main', [V.add(hc, [s * 0.22, 0.12, -0.08]), V.add(hc, [s * 0.5, 0.36, -0.22]), V.add(hc, [s * 0.3, -0.02, -0.2])], 0.02); }
      // the fin-shaped ram under the jaw
      const rc = [0, yk + 0.25, zs - 0.05];
      S.sheet('main', [rc, V.add(rc, [0.34, 0.1, 0.75]), V.add(rc, [0.12, -0.02, 0.62]), V.add(rc, [0, 0.0, 0.92]), V.add(rc, [-0.12, -0.02, 0.62]), V.add(rc, [-0.34, 0.1, 0.75])], 0.035);
      // a sea horse on each cheek of the hull: an S-shaped ridge with a head
      for (const s of [1, -1]) {
        const th = s * 0.72, pts = [[0.3, 0.0], [0.42, 0.14], [0.52, 0.0], [0.62, -0.16], [0.72, -0.02]].map(([t, dth]) => V.add(H.at(t, th + s * dth), [s * 0.04, 0, 0]));
        S.tube('main', pts, [[0.1, 0.06], [0.11, 0.06], [0.09, 0.05], [0.07, 0.05], [0.04, 0.04]], { seg: 6, per: 4 });
        S.blob('main', V.add(H.at(0.26, th - s * 0.06), [s * 0.06, 0.06, 0]), [0.1, 0.07, 0.13], { w: 6, h: 4 });
      }
    } else {
      const H = hull({ L: 2.7, B: 1.9, D: 2.0, sheer: 1.5, full: 0.9, inset: 0.7, bowPow: 1.6, nt: 12, ns: 10 });
      S.add('main', H.geo); merlons(S, H, 0.2, 0.55, 2, 0.3); strakes(S, H, 2);
      const stem = H.at(1, 0);
      // the stem post curling into a volute, a bearded mask under it
      S.tube('main', [[0, stem[1] - 0.5, stem[2] - 0.12], [0, stem[1] + 0.3, stem[2] + 0.06], [0, stem[1] + 0.95, stem[2] + 0.02], [0, stem[1] + 1.3, stem[2] - 0.26], [0, stem[1] + 1.12, stem[2] - 0.56], [0, stem[1] + 0.88, stem[2] - 0.42]], [[0.16, 0.12], [0.14, 0.11], [0.12, 0.1], [0.1, 0.09], [0.08, 0.07], [0.06, 0.05]], { seg: 7, per: 5 });
      S.blob('main', [0, stem[1] + 0.18, stem[2] + 0.12], [0.2, 0.25, 0.16], { w: 9, h: 7 });
      S.blob('main', [0, stem[1] - 0.08, stem[2] + 0.16], [0.14, 0.2, 0.1], { w: 7, h: 5 });
      for (const s of [1, -1]) S.blob('main', [s * 0.17, stem[1] + 0.3, stem[2] + 0.02], [0.1, 0.16, 0.14], { w: 6, h: 5 });
    }
    return S.finish({});
  });
}

/** an Admiralty anchor relief, 2.2 m tall, facing +z, its middle at the origin (shank vertical, ring on top, arms with flukes at the bottom, a rope wound round the shank) */
export function anchor() {
  return cached('lmSt-anchor', () => {
    const S = new Sculpt({ detail: 1 });
    S.tube('main', [[0, -0.95, 0], [0, 0.85, 0]], [[0.075, 0.06], [0.06, 0.05]], { seg: 5, per: 2 });
    const ring = []; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; ring.push([Math.cos(a) * 0.13, 0.98 + Math.sin(a) * 0.13, 0]); }
    S.tube('main', ring, 0.035, { seg: 4, closed: true, per: 1 });
    S.tube('main', [[-0.5, 0.66, 0], [0.5, 0.66, 0]], [[0.06, 0.06], [0.06, 0.06]], { seg: 5, per: 2 });
    for (const s of [1, -1]) S.blob('main', [s * 0.5, 0.66, 0], [0.085, 0.085, 0.085], { w: 5, h: 3 });
    S.tube('main', [[-0.62, -0.5, 0], [-0.42, -0.86, 0], [0, -1.05, 0], [0.42, -0.86, 0], [0.62, -0.5, 0]], [[0.05, 0.05], [0.07, 0.06], [0.085, 0.07], [0.07, 0.06], [0.05, 0.05]], { seg: 5, per: 4 });
    for (const s of [1, -1]) S.sheet('main', [[s * 0.62, -0.36, 0], [s * 0.78, -0.62, 0], [s * 0.6, -0.62, 0], [s * 0.46, -0.52, 0]], 0.04);
    const rope = []; for (let k = 0; k <= 8; k++) { const a = k * 1.9; rope.push([Math.cos(a) * 0.1, 0.7 - k * 0.18, Math.sin(a) * 0.1 + 0.02]); }
    S.tube('main', rope, 0.028, { seg: 4, per: 1 });
    return S.finish({});
  });
}
