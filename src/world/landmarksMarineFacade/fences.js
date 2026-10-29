// landmarksMarineFacade/fences.js - the security perimeter of the closed port (dossier 4.7, CRITIC 17.6): nobody else draws the BARRIERS ways (environment/field.js only stamps the ground raster), so this part
// draws and collides them.  (a) the landside welded-mesh fence: 3 m pieces of an alpha mesh panel 1.7 m tall on square galvanised posts, (b) the pedestrian GUARD RAIL (two rails with X bracing, 1.1 m, posts every
// 2 m) where a mapped fence runs along the kerb of a public road (w1278050002, w1286786905: the OSM line lies on the asphalt edge, so each piece is slid sideways off the carriageway), (c) the 2.4 m precast
// concrete walls of the tip yard / gate walls, (d) the gates and lift gates (BARRIER_NODES): two square posts and, at a lift gate, a booth with the red housing and the boom RAISED (a lowered boom across a mapped
// road would look like a bug for the traffic).  A run that crosses real asphalt is left open there (an open vehicle gate) and no post stands within 0.3 m of the asphalt: road integrity.  Every run is solid
// (thin colliders flagged `fence` like streets/barriers.js addFenceBoxes) so the people module treats them as walls.  No sirens, no flashing lights.
// n4spb (docs/AREAS.md 13.7, 15.v; docs/gdm-M.md): every live piece of a run (mesh panel 3 m, guard rail 2 m, precast wall 6 m) is a breakable BAY of lib/fence-bays.js (its own thin collider flagged `fence`, its drawing,
// ONE knock record; the posts stay static instanced), the source merged the live pieces into solid boxes of at most 14 m; the booth of a lift gate is a knock record.
import { BARRIERS, BARRIER_NODES } from '../data/city.js';
import * as L from '../layout.js';
import * as THREE from 'three';
import { coverFn } from './surfaces.js';
import { addInstanced, partsGeos, kBays, tint, kFurn } from './inst.js';
import { unitBox } from '../lib/fence-bays.js';

/** a vertical alpha-cut panel x 0..1, y y0..y1, in the plane z = 0 of a bay, uv (0..u1, v0..v1) (the source drew each piece as one quad with exactly this uv) */
function panelGeo(y0, y1, u1, v0, v1) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, y0, 0, 1, y0, 0, 1, y1, 0, 0, y1, 0], 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, v0, u1, v0, u1, v1, 0, v1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]); g.computeBoundingSphere(); return g;
}
/** the three kinds of a run: the bay parts (made once per build), the collider and the knock record of a piece */
const KINDS = {
  mesh: { h: 2.0, thick: 0.12, rec: { kind: 'fence', mass: 220, h: 2.0, anchored: 14, hitK: 0.4, metal: true, minDv: 0 } },
  guard: { h: 1.1, thick: 0.12, rec: { kind: 'fence', mass: 160, h: 1.1, anchored: 12, hitK: 0.35, metal: true, minDv: 0 } },
  wall: { h: 2.4, thick: 0.3, rec: { kind: 'fence', mass: 900, h: 2.4, anchored: 16, hitK: 0.5, metal: false, minDv: 0 } },
};

export const FENCE_IDS = ['w1278051833', 'w1278050004', 'w1278050003', 'w1278050002', 'w1278051835', 'w1278050019', 'w1278051842', 'w1278051831', 'w1278050025', 'w1286786905', 'w1278049975', 'w1278050027', 'w1278051829', 'w1278049988', 'w1278051828', 'w1278049985', 'w1278050017', 'w1278049990'];
export const WALL_IDS = ['w704139084', 'w704139087', 'w704139089', 'w704139076', 'w704139099', 'w704139081', 'w704139082', 'w704139086'];
const GUARD = new Set(['w1278050002', 'w1286786905']);                       // fences that follow the kerb of a road: drawn as guard rails
const inPort = (x, z) => x > -9700 && x < -8570 && z > -2390 && z < -1100;
const segDist = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };

export function build(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics, cover = coverFn(ctx);
  const gates = BARRIER_NODES.filter((n) => inPort(n.x, n.z) && (n.kind === 'gate' || n.kind === 'lift_gate'));
  let pieces = 0, gaps = 0, slid = 0, wallLen = 0, fenceLen = 0, guardLen = 0;
  const posts = [];                                                          // fence / guard-rail posts: one instanced list (a unit box scaled in y)
  const bay = { mesh: [], guard: [], wall: [] }, booths = [];                // the bays of the three kinds, the lift-gate booths
  const gapLog = {};
  const runs = [...FENCE_IDS.map((id) => [GUARD.has(id) ? 'guard' : 'mesh', id]), ...WALL_IDS.map((id) => ['wall', id])];
  for (const [kind, id] of runs) {
    const b = BARRIERS.find((q) => q.id === id); if (!b || !b.pts) { console.warn('[landmarksMarineFacade/fences] missing barrier', id); continue; }
    const pts = b.pts, np = pts.length / 2, segs = b.closed ? np : np - 1;
    for (let s = 0; s < segs; s++) {
      const i = s * 2, j = ((s + 1) % np) * 2;
      const ax = pts[i], az = pts[i + 1], bx = pts[j], bz = pts[j + 1], dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
      if (len < 0.4) continue;
      const ux = dx / len, uz = dz / len, rot = Math.atan2(-uz, ux), step = kind === 'wall' ? 6 : kind === 'guard' ? 2 : 3, n = Math.max(1, Math.round(len / step)), st = len / n;
      // piece k: ends e0 / e1, middle m; a guard rail piece is slid away from the carriageway (to the side where the cover decreases) until its ends and middle clear the asphalt
      const info = [];
      for (let k = 0; k < n; k++) {
        const e0 = [ax + ux * k * st, az + uz * k * st], e1 = [ax + ux * (k + 1) * st, az + uz * (k + 1) * st], m = [(e0[0] + e1[0]) / 2, (e0[1] + e1[1]) / 2];
        let off = 0;
        if (kind === 'guard') {
          const nx = -uz, nz = ux, c = (o) => Math.max(cover(e0[0] + nx * o, e0[1] + nz * o), cover(e1[0] + nx * o, e1[1] + nz * o), cover(m[0] + nx * o, m[1] + nz * o));
          if (c(0) > -0.4) { let best = 0, bv = c(0); for (const sg of [1, -1]) for (let o = 0.25; o <= 1.6; o += 0.25) { const v = c(sg * o); if (v < bv - 1e-6) { bv = v; best = sg * o; } if (v < -0.4) break; } off = bv < -0.4 ? best : 0; if (off) slid++; }
        }
        const nx = -uz * off, nz = ux * off;
        const road = (cover(e0[0] + nx, e0[1] + nz) > -0.15 || cover(e1[0] + nx, e1[1] + nz) > -0.15 || cover(m[0] + nx, m[1] + nz) > -0.15);
        const gate = gates.some((g) => segDist(g.x, g.z, e0[0], e0[1], e1[0], e1[1]) < 2.3);
        if (road || gate) { gaps++; const q = (gapLog[id] ||= { road: 0, gate: 0 }); if (road) q.road++; else q.gate++; }
        info.push({ live: !road && !gate, off, nx, nz });
      }
      for (let k = 0; k < n; k++) {
        const it = info[k]; if (!it.live) continue;
        const x0 = k * st, x1 = (k + 1) * st;
        // the piece is a BAY (collider, drawing and record in knockBays below); its posts stay static
        bay[kind].push({ x0: ax + it.nx + ux * x0, z0: az + it.nz + uz * x0, x1: ax + it.nx + ux * x1, z1: az + it.nz + uz * x1, y: 0 });
        if (kind === 'mesh') {
          for (const x of [x0, x1]) { const px = ax + it.nx + ux * x, pz = az + it.nz + uz * x; if (cover(px, pz) < -0.3) posts.push({ x: px, z: pz, h: 2.1, rot }); }
          fenceLen += st;
        } else if (kind === 'guard') {
          for (const x of [x0, x1]) { const px = ax + it.nx + ux * x, pz = az + it.nz + uz * x; if (cover(px, pz) < -0.3) posts.push({ x: px, z: pz, h: 1.12, rot }); }
          guardLen += st;
        } else wallLen += st;
        pieces++;
      }
      svc.fences.push({ id, kind, pts: [[ax, az], [bx, bz]], solid: true });
    }
  }
  // gates: two square posts (galvanised, 2.4 m) 5 m apart, a lift gate also gets a booth + the raised boom
  let lifts = 0;
  for (const g of gates) {
    const road = L.nearestRoad(g.x, g.z, { drivable: true, maxDist: 8 });
    const ang = road ? Math.atan2(road.tz, road.tx) : 0;
    const cx = Math.cos(ang), sx = Math.sin(ang);                              // along the road; the gate posts stand across it (offset +- 3.2 m)
    const place = (px, pz) => cover(px, pz) < -0.35;
    if (g.kind === 'gate') {
      for (const s of [-1, 1]) { const px = g.x - sx * 3.2 * s, pz = g.z + cx * 3.2 * s; if (!place(px, pz)) continue; P.box(M.post, px - 0.07, px + 0.07, 0, 2.4, pz - 0.07, pz + 0.07, 'b', 1); }
    } else {
      // lift gate: the housing (red, 0.4 x 0.4 x 1.1 m) on the +side post, the boom raised; a white booth 2.2 x 2.2 x 2.6 m on the other side
      const hx = g.x - sx * 3.3, hz = g.z + cx * 3.3, bx = g.x + sx * 3.6, bz = g.z - cx * 3.6;
      if (place(hx, hz)) {
        P.box(M.boomRed, hx - 0.2, hx + 0.2, 0, 1.1, hz - 0.2, hz + 0.2, 'b', 1);
        P.cyl(M.boomWhite, [hx, 1.1, hz], [hx + cx * 0.4 + 0.1, 5.0, hz + sx * 0.4 + 0.1], 0.06, 0.05, 5, false);       // the raised boom (nearly vertical)
      }
      if (place(bx, bz) && place(bx + 1.1, bz) && place(bx - 1.1, bz) && place(bx, bz + 1.1) && place(bx, bz - 1.1)) {
        booths.push({ x: bx, y: 0, z: bz, rotY: 0, item: ph.addBox(bx, bz, 2.2, 2.2, 0, 0, 2.6) });      // n4spb: a knock record (drawn below, at the origin)
      }
      lifts++;
    }
  }
  // the booths of the lift gates (white 2.2 x 2.2 x 2.6 m, a dark roof plate, a glass door): knock records
  if (booths.length) {
    const geo = partsGeos((Q) => { Q.box(M.white, -1.1, 1.1, 0, 2.6, -1.1, 1.1, 'b', 2); Q.box(M.dark, -1.2, 1.2, 2.6, 2.75, -1.2, 1.2, 'b', 2); Q.box(M.doorGlass, -0.8, 0.8, 0.9, 2.2, -1.12, -1.1, '', 1); });
    kFurn(K, 'lmmarin-gate-booth', geo, booths, booths.map((b) => b.item), { kind: 'booth', mass: 700, h: 2.75, w: 2.2, d: 2.2, anchored: 14, hitK: 0.5, metal: false, minDv: 0 }, 300);
  }
  // the bays of the runs: one knockBays call per kind (the same drawing as the pieces of the source: alpha mesh panel y 0.25 .. 1.95; guard panel 0 .. 1.1; precast panel 2.4 m on a pale cap line)
  if (bay.mesh.length) {
    const panel = { geo: panelGeo(0.25, 1.95, 1, 0.1, 1.0), mat: M.meshPanel };
    kBays(K, { name: 'lmmarin-fence-mesh', bays: bay.mesh, far: 420, parts: [{ ...panel, name: 'panel', stretch: true, shadow: false, receive: false, noOutline: true }],
      collider: { y0: 0, y1: KINDS.mesh.h, thick: KINDS.mesh.thick, e0: 0, e1: 0 }, rec: () => KINDS.mesh.rec });
  }
  if (bay.guard.length) {
    const panel = { geo: panelGeo(0, 1.1, 1, 0, 1), mat: M.guardPanel };
    kBays(K, { name: 'lmmarin-fence-guard', bays: bay.guard, far: 420, parts: [{ ...panel, name: 'panel', stretch: true, shadow: false, receive: false, noOutline: true }],
      collider: { y0: 0, y1: KINDS.guard.h, thick: KINDS.guard.thick, e0: 0, e1: 0 }, rec: () => KINDS.guard.rec });
  }
  if (bay.wall.length) {
    const wall = tint(unitBox(0, 2.4, -0.1, 0.1, { uLen: 6, uvs: 3 }), M.wall), cap = tint(unitBox(2.4, 2.48, -0.13, 0.13, { uLen: 6, uvs: 3 }), M.footBlock);
    kBays(K, { name: 'lmmarin-fence-wall', bays: bay.wall, far: 520, parts: [{ ...wall, name: 'wall', stretch: true }, { ...cap, name: 'cap', stretch: true }],
      collider: { y0: 0, y1: KINDS.wall.h, thick: KINDS.wall.thick, e0: 0, e1: 0 }, rec: () => KINDS.wall.rec });
  }
  // the posts (instanced: a 0.07 x 1 x 0.07 m box scaled to the post height)
  { const geo = partsGeos((Q) => { Q.box(M.post, -0.035, 0.035, 0, 1, -0.035, 0.035, 'b', 1); });
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), mats = posts.map((p) => new THREE.Matrix4().compose(new THREE.Vector3(p.x, 0, p.z), q.setFromAxisAngle(up, p.rot), new THREE.Vector3(1, p.h, 1)));
    K.extraTris += addInstanced(ctx, K.root, 'lmmarin-fposts', geo, mats).tris; svc.counts.fencePosts = posts.length; }
  svc.counts.fencePieces = pieces; svc.counts.fenceGaps = gaps; svc.counts.guardSlid = slid; svc.counts.fenceLenM = Math.round(fenceLen); svc.counts.guardLenM = Math.round(guardLen); svc.counts.wallLenM = Math.round(wallLen);
  svc.counts.gateBooths = booths.length; svc.counts.gates = gates.length; svc.counts.liftGates = lifts; svc.counts.fenceGapLog = JSON.stringify(gapLog);
  svc.gates = gates.map((g) => ({ id: g.id, kind: g.kind, x: g.x, z: g.z }));
}
