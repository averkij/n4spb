// landmarksTroitsky/leaf.js - the BASCULE LEAF of the Troitsky Bridge: the moving part (43.2 m of deck with its girders, kerbs, pavements, tram rails, whip railing, one lamp pair, one contact-wire pole and the
// counterweight on the bank side of the hinge), its physics and its dynamic colliders. Everything is a handful of meshes moved by TRANSFORM (no geometry rebuild); the physics floor is three ramps (the roadway
// strip and the two pavements) whose numbers are overwritten per frame (the way a conveyor's `dir` is: an item mutated at run time, no re-insert of grid cells: the footprint of the raised leaf lies inside the
// footprint of the closed one); the rails and the barrier kerbs are BAYS (knock records with a dynamic box each, re-posed with the leaf, see "THE BAYS" below; docs/AREAS.md 13.8): boxes that follow the leaf's surface, one per bay of at most 4 m, short enough for
// the slope under them. Frames: the OUTER group stands at the hinge (u = 15.2) turned by -T (local x = along the bridge, z = across, y up); PIVOT turns by theta about z (the opening); BODY turns by the rest
// tilt ALPHA0 so that its x axis runs along the deck surface: body coordinates (s, n, v) = (distance from the hinge along the surface, height above the surface, across). frame.js has the formulas.
import * as THREE from 'three';
import { railMat, railSpec, RAIL_FAR } from '../bridges/rails.js';
import { unitBox } from '../lib/fence-bays.js';
import { knockInstances } from '../lib/knock-inst.js';
import { lampT, contactPoleT } from '../bridges/sculpt4.js';
import { Parts } from '../bridges/kit.js';
import { FR, HW, ROAD, KERB, PAVE, U_HINGE, Y_HINGE, ALPHA0, LEAF_S, yDeck, toWorld } from './frame.js';
import { trackV } from './bridge.js';
import { createRamps, placeRamps, leafBayAt, LEAF_BAY_RAIL, LEAF_BAY_KERB } from './service.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const G_RAIL = 2.5, RAIL_HEX = '#8fa89a';
const KB_LEN = 4;                                                  // m: a barrier kerb bay of the leaf
const VP0 = ROAD + KERB, VP1 = HW + 0.1;                          // the pavement strip |v| in [VP0, VP1]
/** girder depth under the leaf deck at distance s from the hinge: 4.2 m at the counterweight pier, 1.3 m at the tip (the source's bascD), kept 1.6 m above the water in the closed pose */
const girderDepth = (s) => Math.min(1.3 + 2.9 * Math.pow(clamp(1 - s / LEAF_S, 0, 1), 1.6), 1.8 + yDeck(U_HINGE + s));

export function buildLeaf(env) {
  const { ctx, M } = env, T = FR.T, P = new Parts();
  const outer = new THREE.Group(), pivot = new THREE.Group(), body = new THREE.Group();
  outer.name = 'troitsky-leaf'; outer.position.set(toWorld(U_HINGE, 0).x, Y_HINGE, toWorld(U_HINGE, 0).z); outer.rotation.y = -T;
  body.rotation.z = ALPHA0; pivot.add(body); outer.add(pivot);
  const S = LEAF_S, sage = M.sageT, knock = !!ctx.knock;

  const faceShape = (mat, pts, v, sg, tile = 2.4) => {
    const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));
    const g = new THREE.ShapeGeometry(sh, 1), pa = g.attributes.position, ua = g.attributes.uv, na = g.attributes.normal;
    for (let i = 0; i < pa.count; i++) { ua.setXY(i, pa.getX(i) / tile, pa.getY(i) / tile); na.setZ(i, sg); }
    if (sg < 0) { const ix = g.index; for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a); } }
    P.geo(mat, g, 0, 0, v); g.dispose();
  };

  // ---------------------------------------------------------------- deck: asphalt, steel barrier kerbs, granite pavements, the median, lane marks, tram rails (body frame: x = s, y = n)
  P.quad(M.asphalt, [0, 0, -ROAD], [S, 0, -ROAD], [S, 0, ROAD], [0, 0, ROAD], [0, 1, 0], [[0, -ROAD / 4], [S / 4, -ROAD / 4], [S / 4, ROAD / 4], [0, ROAD / 4]]);
  for (const sg of [-1, 1]) {
    const va = sg * ROAD, vk = sg * VP0, vb = sg * VP1;
    P.quad(M.pave, [0, PAVE, vk], [S, PAVE, vk], [S, PAVE, vb], [0, PAVE, vb], [0, 1, 0], [[0, vk / 2.4], [S / 2.4, vk / 2.4], [S / 2.4, vb / 2.4], [0, vb / 2.4]]);
    if (knock) P.quad(M.steelTroitsky, [0, 0, va], [S, 0, va], [S, 0, vk], [0, 0, vk], [0, 1, 0], [[0, 0], [S, 0], [S, KERB], [0, KERB]]);      // the deck strip under the breakable kerb bays (below): it stays when a bay is gone
    else {                                                                                                                                   // (no ctx.knock: the kerb is part of the moving mesh and a plain box)
      P.quad(M.steelTroitsky, [0, 0, va], [S, 0, va], [S, 0.5, va], [0, 0.5, va], [0, 0, -sg], [[0, 0], [S, 0], [S, 0.5], [0, 0.5]]);
      P.quad(M.steelTroitsky, [0, 0.5, va], [S, 0.5, va], [S, 0.5, vk], [0, 0.5, vk], [0, 1, 0], [[0, 0], [S, 0], [S, KERB], [0, KERB]]);
      P.quad(M.steelTroitsky, [0, PAVE, vk], [S, PAVE, vk], [S, 0.5, vk], [0, 0.5, vk], [0, 0, sg], [[0, 0], [S, 0], [S, 0.3], [0, 0.3]]);
    }
    for (const w of [0.32]) P.quad(M.kerb, [0, 0, sg * w], [S, 0, sg * w], [S, 0.14, sg * w], [0, 0.14, sg * w], [0, 0, sg]);                 // the median
  }
  P.quad(M.kerb, [0, 0.14, -0.32], [S, 0.14, -0.32], [S, 0.14, 0.32], [0, 0.14, 0.32], [0, 1, 0]);
  const nm = Math.ceil(S / 3.2);
  for (let i = 0; i < nm; i++) {
    const s0 = S * i / nm, s1 = S * (i + 1) / nm, mk = (vc, hw) => P.quad(M.mark, [s0, 0.03, vc - hw], [s1, 0.03, vc - hw], [s1, 0.03, vc + hw], [s0, 0.03, vc + hw], [0, 1, 0]);
    for (const vc of [-5.8, 5.8]) if (i % 3 !== 2) mk(vc, 0.06);
    for (const vc of [-3.05, 3.05]) mk(vc, 0.06);
  }
  for (let k = 0; k < 2; k++) for (const dv of [-0.76, 0.76]) {                                                                                  // the two tram tracks (the leaf is flat: the track offset is constant)
    const vc = trackV(k, U_HINGE + S / 2) + dv;
    P.quad(M.tramRail, [0, 0.035, vc - 0.035], [S, 0.035, vc - 0.035], [S, 0.035, vc + 0.035], [0, 0.035, vc + 0.035], [0, 1, 0]);
  }
  // ---------------------------------------------------------------- the deep girder: the plate fascia on both faces (the lower chord curves up toward the tip), the cornice, the soffit, five inner girders
  const nF = Math.max(6, Math.round(S / 3));
  for (const sg of [-1, 1]) {
    const v = sg * HW, pts = [];
    for (let i = 0; i <= nF; i++) { const s = S * i / nF; pts.push([s, -girderDepth(s)]); }
    for (let i = nF; i >= 0; i--) pts.push([S * i / nF, -0.22]);
    faceShape(M.steelTroitsky, pts, v + sg * 0.02, sg, 2.4);
    P.quad(M.railSage, [0, -0.34, v + sg * 0.12], [S, -0.34, v + sg * 0.12], [S, PAVE, v + sg * 0.12], [0, PAVE, v + sg * 0.12], [0, 0, sg]);
    P.quad(M.railSage, [0, PAVE, v + sg * 0.12], [S, PAVE, v + sg * 0.12], [S, PAVE, v - sg * 0.3], [0, PAVE, v - sg * 0.3], [0, 1, 0]);
  }
  for (let i = 0; i < nF; i++) {
    const s0 = S * i / nF, s1 = S * (i + 1) / nF, d0 = girderDepth(s0) + 0.02, d1 = girderDepth(s1) + 0.02;
    P.quad(M.steelTroitskyDark, [s0, -d0, -HW], [s1, -d1, -HW], [s1, -d1, HW], [s0, -d0, HW], [0, -1, 0]);
    for (const vv of [-8, -4, 0, 4, 8]) {
      for (const w of [-0.12, 0.12]) P.quad(M.steelTroitsky, [s0, -d0 - 0.5, vv + w], [s1, -d1 - 0.5, vv + w], [s1, -d1, vv + w], [s0, -d0, vv + w], [0, 0, w < 0 ? -1 : 1]);
      P.quad(M.steelTroitskyDark, [s0, -d0 - 0.5, vv - 0.12], [s1, -d1 - 0.5, vv - 0.12], [s1, -d1 - 0.5, vv + 0.12], [s0, -d0 - 0.5, vv + 0.12], [0, -1, 0]);
    }
  }
  // the end plates: the tip (resting on the 12.1 m pier) and the hinge housing
  P.box(M.steelTroitskyDark, S - 0.05, S + 0.08, -girderDepth(S), PAVE, -HW, HW, '', 1.6);
  P.box(M.steelTroitskyDark, -0.3, 0.05, -girderDepth(0), PAVE, -HW, HW, '', 1.6);
  // ---------------------------------------------------------------- the counterweight: on the BANK side of the hinge (s < 0), under the first span; it swings DOWN into the pit as the leaf rises (the pit is the dark under-span of the bank:
  // everything below the street is hidden by the ground / the quay wall). Two steel lever arms and a concrete block.
  // (their own mesh OUT of the outline pass: the weight hangs in the pit under the bank span and swings down into it, below the water; the outline pass has no water, so its contour lines showed through the river beside the hinge pier, docs/AREAS.md 15.z)
  const PW = new Parts();
  for (const sg of [-1, 1]) PW.box(M.steelTroitskyDark, -10.6, 0.1, -1.55, -0.55, sg * (HW - 1.7) - 0.45, sg * (HW - 1.7) + 0.45, '', 1.6);
  PW.box(M.concreteRust || M.graniteDark, -10.6, -3.4, -3.9, -0.55, -HW + 2.4, HW - 2.4, '', 2.2);
  PW.box(M.steelTroitskyDark, -10.7, -3.3, -4.0, -3.9, -HW + 2.3, HW - 2.3, '', 1.6);
  // ---------------------------------------------------------------- the lamp pair (u 36.7) and the contact-wire pole (u 40.3) that stand on the leaf, fixed to it
  for (const sg of [-1, 1]) lampT(P, M, 36.7 - U_HINGE, PAVE, sg * (ROAD + KERB + 0.28), 0);
  contactPoleT(P, M, 40.3 - U_HINGE, 0.14, 0, Math.PI / 2, 3.4);
  // ---------------------------------------------------------------- the whip railing: posts with pyramid caps and a top rail (Parts), the panels as ONE instanced mesh of alpha-cut planes (it moves with the leaf)
  const nb = Math.round(S / G_RAIL), bw = S / nb, postMat = M.railSage;
  for (const sg of [-1, 1]) {
    const v = sg * (HW - 0.14);
    for (let i = 0; i < nb; i++) P.quad(postMat, [bw * i, PAVE + 1.2, v - 0.06], [bw * (i + 1), PAVE + 1.2, v - 0.06], [bw * (i + 1), PAVE + 1.2, v + 0.06], [bw * i, PAVE + 1.2, v + 0.06], [0, 1, 0]);
    for (let i = 0; i <= nb; i++) {
      const s = bw * i;
      P.box(postMat, s - 0.11, s + 0.11, PAVE, PAVE + 1.25, v - 0.11, v + 0.11, 'b', 1);
      P.push(s, PAVE + 1.25, v, Math.PI / 4); P.cyl(postMat, [0, 0, 0], [0, 0.07, 0], 0.2, 0.2, 4, true); P.cyl(postMat, [0, 0.07, 0], [0, 0.24, 0], 0.17, 0.01, 4, false); P.pop();
    }
  }
  const meshes = P.build(body, { name: 'troitsky-leaf' });
  for (const m of PW.build(body, { name: 'troitsky-leaf-weight' })) ctx.noOutline(m);
  const spec = railSpec('whip'), railM = railMat(ctx, 'whip', RAIL_HEX), nk = Math.ceil(S / KB_LEN), kw = S / nk;
  ctx.add(outer);                                                                                         // the dynamic root: never merged, matrices live

  // ---------------------------------------------------------------- the BAYS of the two rails and the two barrier kerbs (docs/AREAS.md 13.8: the leaf's fences break like every other fence).
  // A bay is a rail panel of 2.5 m (`rail`) or a kerb piece of ~4 m, in the BODY frame at (s0 along the surface from the hinge, n above it, v across). With ctx.knock every bay is a KNOCK RECORD of its own whose
  // instance lives in a WORLD-frame knock mesh (lib/knock-inst.js, like every knockable) and is re-posed by `set(theta)` while it stands: the record's origin, its parts' rest offsets (core/knock.js makePart: off / q / s)
  // and the instance matrix follow the leaf, so a hit at ANY angle breaks the bay from its CURRENT pose (it topples about its foot, sparks, clank; over water it sinks). Its collider is a DYNAMIC box (below) that
  // is the record's own `src` (core/knock.js: the protocol of drive/collision.js: invMassRatio / applyCarImpulse / onCarHit), so a knock needs nothing else. RULE for what is left lying: debris of a bay that broke
  // stays where it fell (a rest box <= 0.42 m, the car drives over it) only while the leaf lies closed; the moment the leaf moves it is swept away (rest box removed, the instance hidden: the bridge crew), a broken bay
  // is never rebuilt, the posts and the top rail strip of the railing stay drawn (as on every bridge). Without ctx.knock (a harness): the old plain path, the rail panels in the moving mesh, plain dynamic boxes.
  const bays = [];
  const newBox = () => ({ cx: 0, cz: 0, w: 1, d: 1, rotY: -T, y0: 0, y1: 0 });
  for (const sg of [-1, 1]) for (let i = 0; i < nb; i++) bays.push({ rail: true, s0: bw * i + 0.04, len: bw - 0.08, v: sg * (HW - 0.14), n: PAVE, sy: spec.H, k: LEAF_BAY_RAIL, rec: null, box: newBox() });
  for (const sg of [-1, 1]) for (let i = 0; i < nk; i++) bays.push({ rail: false, s0: kw * i, len: kw, v: sg * (ROAD + KERB / 2), n: 0, sy: 1, k: LEAF_BAY_KERB, rec: null, box: newBox() });
  const UP = new THREE.Vector3(0, 1, 0), AXZ = new THREE.Vector3(0, 0, 1), ONE = new THREE.Vector3(1, 1, 1), IDQ = new THREE.Quaternion(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  const qY = new THREE.Quaternion().setFromAxisAngle(UP, -T), qZ = new THREE.Quaternion(), qB = new THREE.Quaternion(), Mb = new THREE.Matrix4(), Ml = new THREE.Matrix4(), Mw = new THREE.Matrix4();
  const _p = new THREE.Vector3(), _pp = new THREE.Vector3(), _qq = new THREE.Quaternion(), _s = new THREE.Vector3(), SC = {}, touched = new Set();
  /** the body-to-world matrix of the leaf at opening angle th = outer (hinge, turned -T) * pivot (th about z) * body (ALPHA0 about z) */
  const bodyMatrix = (th) => { qZ.setFromAxisAngle(AXZ, th + ALPHA0); return Mb.compose(outer.position, qB.copy(qY).multiply(qZ), ONE); };
  /** the world matrix of a bay (its unit geometry x 0..1 scaled by the length) for the current bodyMatrix */
  const bayMatrix = (b, out) => out.multiplyMatrices(Mb, Ml.compose(_p.set(b.s0, b.n, b.v), IDQ, _s.set(b.len, b.sy, 1)));
  /** the world position of the foot of a bay at its middle (the origin of its knock record) for the current bodyMatrix */
  const _o = new THREE.Vector3(), foot = (b, out) => out.set(b.s0 + b.len / 2, b.n, b.v).applyMatrix4(Mb);
  if (knock) {
    const makeSet = (name, list, part, rec) => {
      bodyMatrix(0);
      const spots = list.map((b) => { const o = foot(b, _o); return { x: o.x, y: o.y, z: o.z, rotY: -T }; });
      const res = knockInstances(ctx, { name, parts: [{ ...part, place: (s, i) => bayMatrix(list[i], new THREE.Matrix4()) }], spots, rec: (s, i) => rec(list[i]), far: part.far });
      list.forEach((b, i) => { b.rec = res.records[i]; if (b.rec) { b.box = b.rec.src; b.rec.dynamic = true; } });      // (dynamic: its collider is the box of the dynamic provider below, not a physics item: tools read the flag)
      return res;
    };
    const rg = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0);
    makeSet('troitsky-leaf-rail', bays.filter((b) => b.rail), { geo: rg, mat: railM, name: 'rail-whip', noOutline: true, shadow: true, receive: false, far: RAIL_FAR },
      (b) => ({ kind: 'fence', mass: 60, h: spec.H, r: 0.04, w: b.len, d: 0.3, anchored: 12, hitK: 0.2, metal: true, minDv: 0 }));
    makeSet('troitsky-leaf-kerb', bays.filter((b) => !b.rail), { geo: unitBox(0, 0.5, -KERB / 2, KERB / 2, { uLen: KB_LEN }), mat: M.steelTroitsky, name: 'kerb', shadow: true, receive: true, far: 450 },
      (b) => ({ kind: 'fence', mass: 900, h: 0.5, r: 0.2, w: b.len, d: KERB, anchored: 30, hitK: 0.4, metal: true, minDv: 0 }));
  } else {                                                                                                // (no ctx.knock: the rail panels ride in the moving mesh; the kerbs are in the Parts above)
    const rails = bays.filter((b) => b.rail), im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0), railM, rails.length), m4 = new THREE.Matrix4();
    rails.forEach((b, i) => { m4.compose(_p.set(b.s0, b.n, b.v), IDQ, _s.set(b.len, b.sy, 1)); im.setMatrixAt(i, m4); });
    im.instanceMatrix.needsUpdate = true; im.castShadow = true; im.receiveShadow = false; im.name = 'troitsky-leaf-rail'; im.frustumCulled = false; ctx.noOutline(im); body.add(im);
  }
  const tris = P.tris + PW.tris + nb * 4 + (knock ? 2 * nk * 10 : 0);
  /** the bays at opening angle th: the dynamic boxes and (with knock) the pose of every STANDING record; the debris that lies on the moving leaf is swept away (see above) */
  const pose = (th) => {
    bodyMatrix(th);
    for (const b of bays) {
      const t = leafBayAt(th, b.s0 + b.len / 2, b.len, b.v, b.k, SC), bx = b.box, r = b.rec;
      bx.cx = t.cx; bx.cz = t.cz; bx.w = t.w; bx.d = t.d; bx.rotY = t.rotY; bx.y0 = t.y0; bx.y1 = t.y1;
      if (!r) continue;
      if (r.state === 'stand') {
        const o = foot(b, _o); r.x = o.x; r.y = o.y; r.z = o.z; r.rotY = -T; r.src.cx = t.cx; r.src.cz = t.cz;
        const p0 = r.parts[0]; if (!p0) continue;
        bayMatrix(b, Mw).decompose(_pp, _qq, _s);
        p0.off.set(_pp.x - o.x, _pp.y - o.y, _pp.z - o.z); p0.q.copy(_qq); p0.s.copy(_s);
        if (!r.wobble && p0.mesh) { p0.mesh.setMatrixAt(p0.index, Mw); touched.add(p0.mesh); }
      } else if (r.state === 'rest' && th > 1e-3) {
        for (const c of r.items) ctx.physics.remove(c);
        r.items = []; r.item = null; r.state = 'lost';
        for (const p of r.parts) if (p.mesh) { p.mesh.setMatrixAt(p.index, ZERO); touched.add(p.mesh); }
      }
    }
    for (const m of touched) m.instanceMatrix.needsUpdate = true;
    touched.clear();
  };

  // ---------------------------------------------------------------- physics: the floor (three ramps overwritten per frame, service.js) and the dynamic colliders: one box per STANDING bay (the record's own src)
  const ph = ctx.physics;
  let items = [], theta = 0;
  const colliders = () => { items = createRamps(ph); return items.length; };
  const boxes = [], near = { x: 0, z: 0, r2: 160 * 160 }, NONE = [];
  { const c = toWorld(U_HINGE + S / 2, 0); near.x = c.x; near.z = c.z; }
  ph.addDynamic(() => {
    const pp = ctx.player && ctx.player.position;
    if (pp) { const dx = pp.x - near.x, dz = pp.z - near.z; if (dx * dx + dz * dz > near.r2) return NONE; }      // nobody within 160 m: nothing to collide with
    boxes.length = 0;
    for (const b of bays) if (!b.rec || b.rec.state === 'stand') boxes.push(b.box);
    return boxes;
  });

  return {
    outer, pivot, meshes, tris, colliders, items: () => items, bays,
    /** set the opening angle: the transform of the pivot, the three floor ramps and the pose of the bays */
    set(th) { theta = th; pivot.rotation.z = th; placeRamps(items, th); pose(th); },
    get theta() { return theta; },
    info: { rails: 2 * nb, kerbs: 2 * nk },
  };
}
