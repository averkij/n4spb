// landmarksMining/sculpt.js - the two travertine groups on the cheeks of the portico stair (copies of the 1809-11 originals by Sukhanov's workshop; dossier docs/research/mining.md 5.1, photos refs/mining 04 10 12 13 19 20 51 52):
//   RIGHT (NE) cheek, OSM n4349628892 at P (18.9, 1.9): "Hercules strangling Antaeus" (S. S. Pimenov): Hercules stands with his feet apart, bent over, the head stubbornly bowed, the arms clasped round Antaeus' waist; Antaeus is
//   lifted off the ground and lies diagonally across him, the head and arms thrown back up to the right, one leg hooked over Hercules' hip, the other hanging (review 2026-10-08 after photos 19 / 51 / 52; 3.7 m high).
//   LEFT (SW) cheek, OSM n4349646989 at P (-18.8, 2.5): "The rape of Proserpine by Pluto" (V. I. Demut-Malinovsky): Pluto (bearded, a wreath, a drapery round the hips) strides forward, the head bowed to Proserpine, who reclines
//   across his right arm (half draped, the right hand bent over her head, the left pushing at his shoulder, the legs hanging); the three-headed dog Cerberus lies at his feet (review 2026-10-08 after photo 20; 3.4 m high).
// Each group stands on a two-course plain plinth 0.73 m high (a 2.6 x 2.3 m slab 0.46 m + a 2.2 x 1.9 m block 0.27 m) on the coping (+1.95); the composition is 3.5 m high; putty-buff travertine (smooth: copies of the 2010s).
// Built with the shared figure kit (lib/figures.js: human / extend / Sculpt); both face the river (+w), the heads turned a little toward the axis.  Tool: tools/landmarksMining-figs.mjs (figures-view script).
import * as THREE from 'three';
import { human, extend, cached, V } from '../lib/figures.js';
import * as L from '../layout.js';
import { P as FP, HT } from './frame.js';

const folds = (n, amp) => (t, th) => 1 + amp * Math.sin(th * n + t * 5);
/** add figure `fig` (built standing: feet at the origin, pelvis at y 0.95) into the Sculpt S with its pelvis at `pt`, turned by Euler (rx, ry, rz) about the pelvis, scaled by s */
function addBody(S, fig, pt, rx, ry, rz, s = 1) {
  const e = new THREE.Euler(rx, ry, rz), q = new THREE.Quaternion().setFromEuler(e), pel = new THREE.Vector3(0, 0.95 * s, 0).applyQuaternion(q);
  S.push(pt[0] - pel.x, pt[1] - pel.y, pt[2] - pel.z, rx, ry, rz);
  for (const [key, g] of Object.entries(fig.geos)) { const gg = g.clone(); gg.scale(s, s, s); S.add(key, gg); gg.dispose(); }
  S.pop();
}

/** the local frame of a figure built standing (feet at the origin, pelvis at y 0.95) after addBody(): where a world point (relative to the group) sits, so that a leg can be aimed at it with IK */
function localOf(pt, rx, ry, rz, w) {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
  const v = new THREE.Vector3(w[0] - pt[0], w[1] - pt[1], w[2] - pt[2]).applyQuaternion(q.invert());
  return [v.x, v.y + 0.95, v.z];
}

export function herculesAntaeus() {
  return cached('lmMin-hercules2', () => {
    // review 2026-10-08 (photos 19 / 51 / 52): Hercules stands with his feet apart, bent over, the arms clasped round Antaeus' waist; Antaeus is lifted off the ground and lies diagonally across him,
    // the head and both arms thrown back up to the right (+x), one leg hooked over Hercules' hip, the other hanging down in front of his thigh (the first version stood Antaeus upright)
    const herc = human({
      detail: 0.6, body: { sex: 'm', muscle: 1, bulk: 1.3, shoulders: 1.18 },
      pose: { pelvis: [0, 0.9, 0], pelvisRot: [0.22, -0.1, 0], spine: [0.42, -0.15, 0], head: [0.7, 0.4, 0],
        legs: { L: { foot: [0.36, 0, 0.1], yaw: 0.45, pole: [0.25, 0.1, 1] }, R: { foot: [-0.32, 0, -0.18], yaw: -0.45, pole: [-0.25, 0.1, 1] } },
        arms: { L: { hand: [-0.06, 1.42, 0.6], pole: [0.9, -0.3, 0.2], grip: 'fist' }, R: { hand: [0.1, 1.36, 0.6], pole: [-0.9, -0.3, 0.2], grip: 'fist' } } },
      outfit: { torso: 'nude', cape: 'none' },
      face: { age: 0.5, hair: 'curly', beard: 'short', brow: 1.0, mouth: 'stern', seed: 71 },
    });
    const pt = [0.05, 1.36, 0.46], rx = 0.0, ry = Math.PI, rz = 1.2;                // Antaeus: pelvis position, faces Hercules (-z), tipped 69 deg with the head towards +x (the group is 3.7 m high at scale 1.85)
    const aL = localOf(pt, rx, ry, rz, [0.3, 1.05, 0.14]), aR = localOf(pt, rx, ry, rz, [-0.28, 0.7, 0.66]);
    const ant = human({
      detail: 0.5, body: { sex: 'm', muscle: 0.85, bulk: 1.1, shoulders: 1.08 },
      pose: { pelvis: [0, 0.95, 0], pelvisRot: [0, 0, 0], spine: [-0.5, 0, 0.0], head: [-0.8, 0.0, 0],
        legs: { L: { foot: [aL[0], 0, aL[2]], lift: aL[1] - 0.075, yaw: 0.3, pole: [0.2, 0.6, 1] }, R: { foot: [aR[0], 0, aR[2]], lift: aR[1] - 0.075, yaw: -0.4, pole: [-0.3, 0.2, 1] } },
        arms: { L: { hand: [0.14, 1.62, -0.26], pole: [1.0, 0.4, -0.1], grip: 'open' }, R: { hand: [-0.14, 1.64, -0.24], pole: [-1.0, 0.4, -0.1], grip: 'open' } } },
      outfit: { torso: 'nude' },
      face: { age: 0.4, hair: 'curly', beard: 'none', brow: 0.8, mouth: 'open', seed: 72 },
    });
    return extend(herc, (S) => { addBody(S, ant, pt, rx, ry, rz, 1.0); });
  });
}

/** Cerberus: a heavy dog lying with three heads (body, haunches, forelegs, three heads with ears) */
function cerberus(S, x, z, rot, k = 0.75) {
  const c = (a) => a.map((v) => v * k), pth = (a) => a.map(c), rad = (a) => a.map((r) => r.map((v) => v * k));
  S.push(x, 0, z, 0, rot, 0);
  S.blob('main', c([0, 0.28, 0]), c([0.2, 0.22, 0.46]), { w: 9, h: 6 });
  S.blob('main', c([0, 0.3, -0.34]), c([0.22, 0.24, 0.26]), { w: 8, h: 6 });
  S.blob('main', c([0, 0.36, 0.3]), c([0.2, 0.22, 0.22]), { w: 8, h: 6 });
  for (const s of [-1, 1]) {
    S.tube('main', pth([[s * 0.15, 0.2, 0.36], [s * 0.17, 0.1, 0.62], [s * 0.17, 0.05, 0.78]]), rad([[0.07, 0.07], [0.06, 0.06], [0.07, 0.06]]), { seg: 6, per: 3 });
    S.tube('main', pth([[s * 0.17, 0.18, -0.4], [s * 0.2, 0.05, -0.2], [s * 0.2, 0.05, 0.0]]), rad([[0.09, 0.09], [0.07, 0.07], [0.06, 0.06]]), { seg: 6, per: 3 });
  }
  S.tube('main', pth([[0, 0.4, 0.4], [0, 0.55, 0.55]]), rad([[0.1, 0.09], [0.1, 0.09]]), { seg: 7, per: 3 });
  for (const hx of [-0.19, 0, 0.19]) {
    const hz = hx === 0 ? 0.74 : 0.66;
    S.blob('main', c([hx, 0.52, hz]), c([0.1, 0.1, 0.12]), { w: 8, h: 6 }); S.blob('main', c([hx, 0.46, hz + 0.14]), c([0.065, 0.06, 0.1]), { w: 7, h: 5 });
    for (const e of [-1, 1]) S.blob('main', c([hx + e * 0.08, 0.64, hz - 0.03]), c([0.03, 0.06, 0.04]), { w: 5, h: 4 });
  }
  S.pop();
}

export function plutoProserpine() {
  return cached('lmMin-pluto2', () => {
    // review 2026-10-08 (photo 20): Pluto strides forward with the head bowed to her; Proserpine lies back diagonally across his right arm (the head towards -x, the right hand bent over it, the left pushing at his
    // shoulder), the legs hanging in front of his right thigh; Cerberus lies at his feet (the first version stood her upright beside him and the dog was a cub)
    const pt = [-0.24, 1.12, 0.3], rx = 0, ry = 0, rz = 0.5, s = 0.86;
    const aL = localOf(pt, rx, ry, rz, [-0.12, 0.5, 0.58]), aR = localOf(pt, rx, ry, rz, [-0.5, 0.42, 0.3]);
    const pluto = human({
      detail: 0.6, body: { sex: 'm', muscle: 0.95, bulk: 1.18, shoulders: 1.14 },
      pose: { pelvis: [0, 0.9, 0], pelvisRot: [0.1, 0.3, 0.0], spine: [0.18, -0.35, -0.05], head: [0.5, -0.5, 0],
        legs: { L: { foot: [0.34, 0, -0.2], yaw: 0.35, pole: [0.15, 0.1, 1] }, R: { foot: [-0.3, 0, 0.5], yaw: -0.5, pole: [-0.1, 0.25, 1] } },
        arms: { L: { hand: [0.32, 0.78, 0.1], pole: [0.8, -0.3, -0.5], grip: 'relaxed' }, R: { hand: [-0.3, 1.12, 0.4], pole: [-0.5, -0.5, -0.4], grip: 'hold', palm: [0, 1, 0.2] } } },
      outfit: { torso: 'nude', cape: 'none', hat: 'laurel' },
      face: { age: 0.7, hair: 'curly', beard: 'full', brow: 1.0, mouth: 'stern', seed: 81 },
    });
    const pros = human({
      detail: 0.5, body: { sex: 'f', bulk: 1.0 },
      pose: { pelvis: [0, 0.95, 0], pelvisRot: [0, 0, 0], spine: [-0.2, 0.15, 0.1], head: [-0.55, 0.2, 0.1],
        legs: { L: { foot: [aL[0], 0, aL[2]], lift: aL[1] - 0.075, yaw: 0.3, pole: [0.1, 0.5, 1] }, R: { foot: [aR[0], 0, aR[2]], lift: aR[1] - 0.075, yaw: -0.3, pole: [-0.1, 0.3, 1] } },
        arms: { L: { hand: [0.42, 1.52, 0.2], pole: [0.6, 0.1, -0.5], grip: 'open' }, R: { hand: [-0.1, 1.8, 0.12], pole: [-0.9, 0.6, -0.1], grip: 'open' } } },
      outfit: { torso: 'nude' },
      face: { age: 0.25, hair: 'long', mouth: 'open', seed: 82 },
    });
    return extend(pluto, (S, info) => {
      const j = info.j;
      addBody(S, pros, pt, rx, ry, rz, s);
      // the drapery round Pluto's hips and falling over the left thigh
      S.tube('main', [V.add(j.pelvis, [-0.22, -0.02, -0.04]), V.add(j.pelvis, [-0.14, 0.05, 0.18]), V.add(j.pelvis, [0.05, 0.04, 0.22]), V.add(j.pelvis, [0.22, 0.0, 0.1]), V.add(j.pelvis, [0.3, -0.18, -0.04])], [[0.05, 0.12], [0.06, 0.13], [0.06, 0.14], [0.06, 0.13], [0.05, 0.12]], { seg: 9, per: 3, bump: folds(5, 0.1) });
      S.tube('main', [V.add(j.pelvis, [0.14, -0.04, 0.12]), V.add(j.pelvis, [0.2, -0.38, 0.16]), V.add(j.pelvis, [0.12, -0.66, 0.1])], [[0.13, 0.05], [0.15, 0.05], [0.1, 0.05]], { seg: 8, per: 3, bump: folds(6, 0.1) });
      cerberus(S, 0.4, 0.04, -0.5, 0.7);
    });
  });
}

/** the two-course plain plinth under a group: lower slab 2.6 x 2.3 x 0.46, upper block 2.2 x 1.9 x 0.27 (frame P: group origin at (u, w), faces +w) */
function plinth(P, M, u, w) {
  P.box(M.travPlinth, u - 1.3, u + 1.3, HT.stair, HT.stair + 0.46, w - 1.15, w + 1.15, 'b', 1.6);
  P.box(M.travPlinth, u - 1.1, u + 1.1, HT.stair + 0.46, HT.stair + 0.73, w - 0.95, w + 0.95, 'b', 1.6);
}

export async function build(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics, FM = M.FM;
  const mats = { main: M.trav, dark: FM.dark, accent: M.gold };
  const yBase = HT.stair + 0.73;
  P.push(FP.x, 0, FP.z, FP.rot);
  try {
    for (const [fn, u, w, id, name, rot, s] of [
      [herculesAntaeus, 18.9, 1.9, 'n4349628892', 'Геракл, удушающий Антея (С. С. Пименов)', -0.12, 1.85],
      [plutoProserpine, -18.8, 2.5, 'n4349646989', 'Похищение Прозерпины Плутоном (В. И. Демут-Малиновский)', 0.12, 1.85],
    ]) {
      try {
        plinth(P, M, u, w);
        fn().place(P, mats, u, yBase, w, rot, s);
        const p = FP.W(u, w);
        svc.monuments.push({ id, name, x: p.x, z: p.z, h: 3.5 + 0.73, r: 1.6 });
        FP.cyl(ph, u, w, 1.2, 0, yBase + 3.5);                                                // the group (the cheek top is not walkable)
      } catch (e) { console.error('[landmarksMining/sculpt]', id, e); }
    }
    for (const [u, w, tu, tw, name] of [[11.0, 6.3, 18.9, 1.9, 'Геракл и Антей'], [-11.0, 6.3, -18.8, 2.5, 'Плутон и Прозерпина']]) {
      const a = FP.W(u, w), b = FP.W(tu, tw); svc.photoSpots.push({ name, x: a.x, z: a.z, yaw: L.yawToward(a.x, a.z, b.x, b.z), pitch: 10, y: 0.15 });
    }
  } finally { P.pop(); }
}
