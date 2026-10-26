// world/lib/bascule-gates.js - the SOLID, BREAKABLE road barriers of a bascule bridge (docs/AREAS.md 13.8, 13.10, 13.11, 15.x). The red-and-white booms that drop across the carriageway and the pavements when the bridge is
// about to open used to be a picture only (a car drove through them). Here every boom is made of TWO HALVES (the post half and the outer half), each
//   * a KNOCK RECORD (kind 'fence', a light `beam` piece, core/knock.js): it gives way to ANY car that touches it, at any speed (a few kilograms: the car is hardly slowed, nothing stops or flips it); the two halves of a boom
//     break TOGETHER (the boom snaps in the middle: the onKnock of one half snaps the other): the post half swings open about its post like a gate and droops to the road, the outer half is thrown along the hit and falls flat;
//     both end as thin rest boxes (<= 0.42 m) the car drives over, like every other fence of the world. Their instances (the red stripes, the white stripes, the counterweight stub on the post half) live in world-frame knock
//     meshes (lib/knock-inst.js) that `set(barrier)` re-poses while the boom swings down or up;
//   * a DYNAMIC collider box (the record's own `src`, the protocol of drive/collision.js, as the rail and kerb bays of lib/bascule-bays.js) that exists only while the half is (nearly) down: `boxes(pool)` appends the boxes
//     of the STANDING halves whose angle above the road is at most BOX_PSI (20 degrees); a raised boom (72 degrees) is no obstacle.
// A broken boom stays broken until the NEXT CYCLE starts: the module calls `restore()` on the 'warn' event, which re-arms every record (core/knock.js restore: the flying body is dropped, the rest box removed) and puts it
// back at its post. The NPC stop logic (stop lines, the pedestrian gate walls of lib/bascule.js) does not look at any of this and works as it did.
// Nothing is allocated per frame: `set` writes into module scratch objects and runs only when the barrier value changed (or after a restore).
import * as THREE from 'three';
import { knockInstances } from './knock-inst.js';

export const ARM_Y = 0.95;                 // m: the axis of the boom above the foot of its post
export const ARM_UP = 72 * Math.PI / 180;  // rad: the raised boom
export const BOX_PSI = 20 * Math.PI / 180; // rad: above this the boom has no collider box
export const ARM_MASS = 8;                 // kg per half of a boom (the knock solver shares the car's impulse by mass: the car loses ~0.6 % of its speed in the contact)
const UPV = new THREE.Vector3(0, 1, 0), AXZ = new THREE.Vector3(0, 0, 1), ONE = new THREE.Vector3(1, 1, 1);
const qY = new THREE.Quaternion(), qZ = new THREE.Quaternion(), qA = new THREE.Quaternion(), _p = new THREE.Vector3(), _pp = new THREE.Vector3(), _s = new THREE.Vector3(), _qq = new THREE.Quaternion(), M4 = new THREE.Matrix4(), touched = new Set();

/** a geometry of axis-aligned boxes [x0, x1, y0, y1, z0, z1] (flat normals, uv in metres) */
export function boxesGeo(list) {
  const pos = [], nrm = [], uv = [], idx = [];
  const face = (a, b, c, d, n) => { const k = pos.length / 3; for (const p of [a, b, c, d]) { pos.push(...p); nrm.push(...n); } uv.push(0, 0, 1, 0, 1, 1, 0, 1); idx.push(k, k + 1, k + 2, k, k + 2, k + 3); };
  for (const [x0, x1, y0, y1, z0, z1] of list) {
    face([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]); face([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]);
    face([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]); face([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]);
    face([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]); face([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeBoundingSphere(); return g;
}
/** the unit boom (x 0..1 along the boom, 0.1 x 0.1 across) of n stripes: the even ones (parity 0) or the odd ones (parity 1) of the half h (0 = post half, stripes 0 .. n/2 - 1; 1 = outer half) */
const stripes = (n, parity, h) => { const l = []; for (let i = h * n / 2; i < (h + 1) * n / 2; i++) if (i % 2 === parity) l.push([i / n, (i + 1) / n, -0.05, 0.05, -0.05, 0.05]); return boxesGeo(l); };

/**
 * createBarrierArms(ctx, { name, toWorld, arms, mats: { red, white, post }, near }) -> { count, arms, set(barrier), restore(), boxes(pool), tip(i, out), info }
 *   toWorld(u, v, out) -> { x, z }   the frame of the bridge
 *   arms   [{ u, v (the post), to (the tip, at the lowered pose), y0 (the foot of the post), ped }]
 *   near   optional { x, z, r }: the provider hands out nothing while the player is farther than r from (x, z) (like the leaf bays)
 * Each arm (a boom): { u, v, to, y0, len, px, pz (post, world), dx, dz (the direction toward the tip), yaw, pieces: [post half, outer half], rec / box (of the post half), state: 'stand' | 'broken' }.
 * Each piece: { arm, half, s0, s1 (its span along the boom), rec (knock record or null), box (its dynamic collider), refs: [{ mesh, index }] (red, white, stub for the post half) }.
 */
export function createBarrierArms(ctx, { name, toWorld, arms: specs, mats, near = null }) {
  const knock = !!ctx.knock, arms = [], pieces = [];
  for (const s of specs) {
    const a = toWorld(s.u, s.v, { x: 0, z: 0 }), b = toWorld(s.u, s.to, { x: 0, z: 0 }), len = Math.abs(s.v - s.to), dx = (b.x - a.x) / len, dz = (b.z - a.z) / len;
    const arm = { ...s, len, px: a.x, pz: a.z, dx, dz, yaw: Math.atan2(-dz, dx), pieces: null, cls: s.ped ? 'ped' : 'road', rec: null, box: null, refs: null, get state() { return this.pieces.every((p) => !p.rec || p.rec.state === 'stand') ? 'stand' : 'broken'; } };
    arm.pieces = [0, 1].map((h) => ({ arm, half: h, s0: h * len / 2, s1: (h + 1) * len / 2, rec: null, refs: null, box: { cx: 0, cz: 0, w: len / 2, d: 0.3, rotY: 0, y0: 0, y1: 1 } }));
    arm.box = arm.pieces[0].box;
    arms.push(arm); pieces.push(...arm.pieces);
  }
  const stub = boxesGeo([[-0.45, 0, -0.09, 0.09, -0.09, 0.09]]), geos = { road: { n: 12 }, ped: { n: 4 } };
  for (const cls of ['road', 'ped']) for (const h of [0, 1]) geos[cls][h] = { r: stripes(geos[cls].n, 0, h), w: stripes(geos[cls].n, 1, h) };
  /** the world matrix of part k (0 red, 1 white, 2 stub) of arm a with the boom raised by psi above the road */
  const matrix = (a, psi, k, out) => {
    qY.setFromAxisAngle(UPV, a.yaw); qZ.setFromAxisAngle(AXZ, psi);
    return out.compose(_p.set(a.px, a.y0 + ARM_Y, a.pz), qA.copy(qY).multiply(qZ), k === 2 ? ONE : _s.set(a.len, 1, 1));
  };
  /** the break of one half snaps the other (the boom breaks in the middle): the partner flies with the same direction and speed */
  const snapPartner = (p, b) => { const q = p.arm.pieces[1 - p.half]; if (q.rec && ctx.knock.snap) ctx.knock.snap(q.rec, b.dx, b.dz, b.sp); };
  for (const cls of ['road', 'ped']) for (const h of [0, 1]) {
    const list = pieces.filter((p) => p.arm.cls === cls && p.half === h); if (!list.length) continue;
    const spots = list.map((p) => { const a = p.arm, m = (p.s0 + p.s1) / 2; return { x: a.px + a.dx * m, y: a.y0, z: a.pz + a.dz * m, rotY: a.yaw }; });      // (the record stands at the middle of its half of the lowered boom)
    const place = (k) => (s, i) => matrix(list[i].arm, ARM_UP, k, new THREE.Matrix4());
    const g = geos[cls][h], parts = [{ geo: g.r, mat: mats.red, name: 'red' + h, noOutline: true, shadow: true, receive: false, place: place(0) }, { geo: g.w, mat: mats.white, name: 'white' + h, noOutline: true, shadow: true, receive: false, place: place(1) }];
    if (h === 0) parts.push({ geo: stub, mat: mats.post, name: 'stub', noOutline: true, shadow: true, receive: false, place: place(2) });
    const res = knockInstances(ctx, {
      name: name + '-' + cls, spots, far: 450, parts,
      rec: (s, i) => { const p = list[i], a = p.arm; return { kind: 'fence', mass: ARM_MASS, h: 0.12, r: 0.06, w: a.len / 2, d: 0.3, anchored: 0, hitK: 0.05, metal: true, minDv: 0.1, originY: ARM_Y, beam: { ax: a.dx, az: a.dz, hinge: h === 0 }, onKnock: (it, b) => snapPartner(p, b) }; },
    });
    list.forEach((p, i) => {
      p.rec = res.records[i] || null;
      if (p.rec) { p.box = p.rec.src; p.rec.dynamic = true; p.refs = p.rec.parts; }
      else p.refs = parts.map((_, k) => ({ mesh: res.meshes[k], index: i }));
    });
  }
  for (const a of arms) { a.rec = a.pieces[0].rec; a.refs = a.pieces[0].refs; a.box = a.pieces[0].box; }
  let last = -1, nowBarrier = 0;
  /** pose every STANDING half for barrier = 0 (up) .. 1 (down); force = also when the value is the same (after a restore) */
  const set = (barrier, force = false) => {
    if (barrier === last && !force) return;
    last = barrier; nowBarrier = barrier;
    const psi = (1 - barrier) * ARM_UP, c = Math.cos(psi), sn = Math.sin(psi);
    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i], a = p.arm, r = p.rec, bx = p.box;
      if (r && r.state !== 'stand') continue;
      const run0 = p.s0 * c, run1 = p.s1 * c;
      bx.cx = a.px + a.dx * (run0 + run1) / 2; bx.cz = a.pz + a.dz * (run0 + run1) / 2; bx.w = run1 - run0 + 0.1; bx.d = 0.3; bx.rotY = a.yaw; bx.y0 = a.y0 + ARM_Y - 0.15; bx.y1 = a.y0 + ARM_Y + p.s1 * sn + 0.15;
      for (let k = 0; k < p.refs.length; k++) {
        const ref = p.refs[k]; matrix(a, psi, k, M4);
        if (r) {
          const pt = r.parts[k]; M4.decompose(_pp, _qq, _s);
          pt.off.set(_pp.x - r.x, _pp.y - (r.y + ARM_Y), _pp.z - r.z); pt.q.copy(_qq); pt.s.copy(_s);
          if (r.wobble) continue;
        }
        ref.mesh.setMatrixAt(ref.index, M4); touched.add(ref.mesh);
      }
    }
    for (const m of touched) m.instanceMatrix.needsUpdate = true;
    touched.clear();
  };
  /** re-arm every broken half (the module calls it when the next cycle starts); returns how many came back */
  const restore = () => {
    let n = 0;
    if (ctx.knock && ctx.knock.restore) for (let i = 0; i < pieces.length; i++) { const r = pieces[i].rec; if (r && r.state !== 'stand' && ctx.knock.restore(r)) n++; }
    if (n) set(nowBarrier, true);
    return n;
  };
  const boxes = [];
  const lowAt = (1 - BOX_PSI / ARM_UP) - 1e-9, r2 = near ? near.r * near.r : 0;
  const provide = () => {
    boxes.length = 0;
    if (nowBarrier < lowAt) return boxes;                                                    // (every boom is above BOX_PSI: nothing to collide with)
    if (near) { const pp = ctx.player && ctx.player.position; if (pp) { const dx = pp.x - near.x, dz = pp.z - near.z; if (dx * dx + dz * dz > r2) return boxes; } }
    for (let i = 0; i < pieces.length; i++) { const p = pieces[i]; if (!p.rec || p.rec.state === 'stand') boxes.push(p.box); }
    return boxes;
  };
  provide.stableBoxes = true;
  ctx.physics.addDynamic(provide);
  set(0, true);
  return {
    count: arms.length, arms, pieces, set, restore, boxes: provide,
    /** the world position of the tip of arm i (read back from its instance matrix: what is drawn; the outer half carries the tip) */
    tip(i, out = new THREE.Vector3()) { const ref = arms[i].pieces[1].refs[0]; ref.mesh.getMatrixAt(ref.index, M4); return out.set(1, 0, 0).applyMatrix4(M4); },
    get barrier() { return nowBarrier; },
    info: { arms: arms.length, pieces: pieces.length, standing: () => arms.filter((a) => a.state === 'stand').length },
  };
}
