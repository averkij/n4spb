// Finland Station, its glass clock tower, sculptured facade, commuter platforms
// and Evseev's Lenin monument. Sources/estimates: research/finlyandsky-station.md.
import * as THREE from 'three';
import { BUILDINGS, MONUMENTS, PLATFORMS, RAILS } from './data/city.js';
import { Parts, ringEdges, onEdge } from './landmarksD/kit.js';
import { MeshBuilder, addPrism, addPolyColliders } from './lib/massing.js';
import { sculptLenin } from './landmarksFinlyandskyStation/lenin.js';
import { square } from './landmarksFinlyandskyStation/square.js';
import { registerLOD } from '../core/spatial.js';
import { makeLabels } from './streets/labels.js';
import { triangulateRing, subtractConvex, ccw, boxOfPoly } from './environment/clip.js';

export const OWNS_GROUPS = true;
export const FRONT = { x: 284.7, z: -2570.85, rot: -Math.atan2(27.5, 97.4), width: Math.hypot(97.4, 27.5) };
const c = Math.cos(FRONT.rot), s = Math.sin(FRONT.rot);
export const stationPoint = (u, v) => ({ x: FRONT.x + c * u + s * v, z: FRONT.z - s * u + c * v });
const sphere = new THREE.SphereGeometry(1, 8, 6);

function instances(ctx, name, geo, mat, spots, far) {
  if (!spots.length) return;
  const mesh = new THREE.InstancedMesh(geo, mat, spots.length), matrix = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), scale = new THREE.Vector3();
  spots.forEach((a, i) => { p.set(a.x, a.y, a.z); q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, a.rot || 0); scale.set(a.sx || 1, a.sy || 1, a.sz || 1); mesh.setMatrixAt(i, matrix.compose(p, q, scale)); });
  mesh.name = name; mesh.castShadow = true; mesh.receiveShadow = true; mesh.computeBoundingBox(); mesh.computeBoundingSphere(); ctx.addStatic(mesh); registerLOD(mesh, far); return mesh;
}

function facadeLabel(K, text, p, y, rot, w, h, id, roof = false) {
  const { ctx, fine: P, decals } = K;
  if (!ctx.tex?.sign || !ctx.services.labels.reserve(id, p.x, y, p.z, w, h, Math.sin(rot), Math.cos(rot), 'landmark')) return;
  const texture = ctx.tex.sign({ text, bg: roof ? 'rgba(0,0,0,0)' : '#414b50', fg: '#deded2', w: 1024, h: 128, font: 'sans' });
  const mat = ctx.mat.decal('#ffffff', { map: texture, alphaTest: roof ? .4 : 0 }); decals.add(mat);
  P.push(p.x, y, p.z, rot); P.quad(mat, [-w / 2, -h / 2, 0], [w / 2, -h / 2, 0], [w / 2, h / 2, 0], [-w / 2, h / 2, 0], [0, 0, 1]); P.pop();
}
function label(K, text, u, y, v, w, h, id = 'r2123616') {
  facadeLabel(K, text, stationPoint(u, v), y, FRONT.rot, w, h, id, y > 15);
}

function relief(P, M, u, n) {
  // Eighteen recessed panels above the glazing show varied small processions,
  // workers and railway scenes, rather than one identical strip of bumps.
  const z = .31, y = 11.3;
  P.box(M.reliefShadow, u - 1.92, u + 1.92, y, 14.25, .18, .25);
  for (let j = 0; j < 3; j++) {
    const x = u - 1.15 + j * 1.1, yy = y + .25, lean = ((n + j) % 3 - 1) * .14;
    P.cyl(M.relief, [x - .18, yy, z], [x - .11 + lean, yy + .7, z], .12, .15, 5);
    P.cyl(M.relief, [x + .2, yy, z], [x + .12 + lean, yy + .7, z], .12, .15, 5);
    P.cyl(M.relief, [x + lean, yy + .63, z], [x + lean * 1.5, yy + 1.5, z], .32, .22, 6);
    P.geo(M.relief, sphere, x + lean * 1.5, yy + 1.82, z + .03, 0, 0, 0, .2, .24, .14);
    P.cyl(M.relief, [x - .24 + lean, yy + 1.34, z], [x - .48, yy + .9 + (n % 2) * .7, z], .1, .075, 5);
    P.cyl(M.relief, [x + .24 + lean, yy + 1.34, z], [x + .51, yy + 1.0 + ((n + j) % 2) * .7, z], .1, .075, 5);
  }
  if (n % 4 === 0) P.box(M.relief, u - 1.5, u + 1.5, y + .08, y + .22, .3, .46);
}

function station(K) {
  const { ctx, shell: P, medium: D, fine: F, M, svc } = K;
  const rec = BUILDINGS.find(b => b.id === 'r2123616');
  // Keep the complete mapped rear wing, not merely the impressive street face.
  if (rec) for (const poly of rec.polys) {
    const a = new MeshBuilder(), b = new MeshBuilder(); addPrism(a, b, poly, 0, 10.6, { bay: 4.2, floor: 3.8 });
    P.geo(M.stone, a.build()); P.geo(M.roof, b.build()); addPolyColliders(ctx, poly, 0, 10.6);
  }
  for (const p of [P, D, F]) p.push(FRONT.x, 0, FRONT.z, FRONT.rot);
  const half = FRONT.width / 2;
  if (!rec) { P.box(M.stone, -half, half, 0, 10.6, -35, 0); ctx.physics.addBox(FRONT.x - s * 17.5, FRONT.z - c * 17.5, FRONT.width, 35, FRONT.rot, 0, 15.8); }
  P.box(M.stone, -half, half, 10.6, 15.8, -35, 0);
  P.box(M.roof, -half - .15, half + .15, 15.8, 16.08, -35.2, .2);
  P.box(M.granite, -half, half, .04, .55, 0, .10, 'b');
  D.box(M.trim, -half - .05, half + .05, 15.35, 15.75, 0, .16);
  // Eighteen narrow, recessed, monumental glazed bays, with different entrance
  // doors beneath the middle panels. Reliefs and mullions sit off the wall.
  for (let i = 0; i < 18; i++) {
    const u = -44.4 + i * 5.22;
    D.box(M.window, u - 1.9, u + 1.9, .55, 11.15, .12, .18);
    D.box(M.trim, u - 2.02, u - 1.87, .5, 14.35, .09, .24);
    D.box(M.trim, u + 1.87, u + 2.02, .5, 14.35, .09, .24);
    for (const yy of [3.1, 5.7, 8.3, 10.9]) F.box(M.metal, u - 1.87, u + 1.87, yy, yy + .07, .205, .265);
    F.box(M.metal, u - .035, u + .035, .6, 11.1, .205, .265);
    if (i >= 6 && i <= 11) {
      D.box(M.metal, u - 1.95, u + 1.95, 2.65, 3.14, .25, .9);
      for (const q of [-1, 1]) {
        D.box(M.door, u + q * .88 - .71, u + q * .88 + .71, .58, 2.64, .28, .34);
        F.box(M.trim, u + q * .88 - .03, u + q * .88 + .03, 1.2, 1.7, .35, .4);
      }
    }
    relief(F, M, u, i);
  }
  // Stone joints are shallow thin dark seams, never z-fighting planes.
  for (let yy = 1; yy < 15.2; yy += .82) for (const q of [-1, 1]) F.box(M.joint, q < 0 ? -half : 48.0, q < 0 ? -48.0 : half, yy, yy + .018, .105, .12);
  for (const p of [P, D, F]) p.pop();

  // The actual elevated footprint is only 8 x 8 m. Its central clock is now
  // a full dark dial, replaced in 2017; older open numeral rings are not used.
  const tx = 286.9, tz = -2578.1;
  for (const p of [P, D, F]) p.push(tx, 0, tz, FRONT.rot);
  P.box(M.stone, -4.25, 4.25, 16.08, 16.8, -4.25, 4.25);
  P.box(M.window, -3.8, 3.8, 16.8, 28.6, -3.8, 3.8);
  for (const yy of [19.2, 28.6]) P.box(M.metal, -4.2, 4.2, yy, yy + .42, -4.2, 4.2);
  for (let face = 0; face < 4; face++) {
    const a = face * Math.PI / 2;
    D.push(0, 0, 0, a); F.push(0, 0, 0, a);
    for (let u = -3.55; u <= 3.6; u += .88) D.box(M.metal, u - .045, u + .045, 16.8, 28.6, 3.81, 3.9);
    D.cyl(M.clock, [0, 24.05, 3.94], [0, 24.05, 4.04], 2.74, 2.74, 40);
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6;
      F.cyl(M.silver, [Math.sin(angle) * 2.17, 24.05 + Math.cos(angle) * 2.17, 4.075], [Math.sin(angle) * 2.54, 24.05 + Math.cos(angle) * 2.54, 4.075], .045, .045, 4);
    }
    F.cyl(M.silver, [0, 24.05, 4.1], [-1.1, 24.92, 4.1], .075, .04, 5);
    F.cyl(M.silver, [0, 24.05, 4.12], [1.78, 23.14, 4.12], .055, .025, 5);
    D.pop(); F.pop();
  }
  P.col(M.silver, 0, 0, 29.02, 59.0, .22, .035, 8);
  // The station has a needle spire, not the five-pointed finial of Vosstaniya's
  // obelisk. Reference photographs do not show a star here.
  P.col(M.silver, 0, 0, 59.0, 59.9, .035, 0, 8);
  for (const p of [P, D, F]) p.pop();
  label(K, 'ФИНЛЯНДСКИЙ ВОКЗАЛ', -28.0, 16.65, .26, 35, .95);
  label(K, 'Finlyandskiy Railway Station', 29.5, 16.65, .26, 34, .88);
  label(K, 'ПРИГОРОДНЫЕ ПОЕЗДА', -1.5, 2.94, .98, 15.0, .32);
  label(K, 'МЕТРО · ПЛОЩАДЬ ЛЕНИНА', 39.2, 2.92, .35, 12.0, .42);
  svc.houses.push({ id: 'r2123616', name: 'Финляндский вокзал', x: FRONT.x, z: FRONT.z, h: 16.08 });
  svc.monuments.push({ id: 'w314291447', name: 'Башня Финляндского вокзала', x: tx, z: tz, h: 60 });
  svc.entrances.push(...[-5.25, 0, 5.25].map(u => ({ ...stationPoint(u, 1.5), width: 2.8, name: 'Финляндский вокзал' })));
  stationRear(K, rec);
}

function stationRear(K, rec) {
  const { ctx, shell: P, medium: D, fine: F, M, svc } = K;
  if (!rec) return;
  // The 2022 platform-side photograph shows seven monumental glazed bays,
  // clerestory transoms, paired doors and the low ticket-hall barrel roof.
  // Place this face on the actual rear edge of the 40 m central concourse.
  for (const p of [P, D, F]) p.push(FRONT.x, 0, FRONT.z, FRONT.rot);
  D.box(M.granite, -20.0, 19.9, .10, .85, -58.49, -58.40);
  D.box(M.trim, -20.1, 20.0, 10.2, 10.65, -58.59, -58.36);
  for (let i = 0; i < 7; i++) {
    const u = -17.1 + i * 5.7, hw = 2.35;
    D.box(M.window, u - hw, u + hw, .85, 8.55, -58.57, -58.45);
    D.box(M.window, u - hw, u + hw, 9.0, 10.05, -58.57, -58.45);
    for (const side of [-1, 1]) D.box(M.trim, u + side * (hw + .09) - .10, u + side * (hw + .09) + .10, .75, 10.1, -58.68, -58.42);
    for (const yy of [3.0, 5.9, 8.55, 9.0]) F.box(M.metal, u - hw, u + hw, yy, yy + .07, -58.66, -58.56);
    F.box(M.metal, u - .035, u + .035, .85, 10.05, -58.66, -58.56);
    if (i > 0 && i < 6) {
      for (const a of [-1, 1]) {
        D.box(M.door, u + a * .76 - .67, u + a * .76 + .67, .3, 2.85, -58.75, -58.58);
        F.box(M.silver, u + a * .76 - .025, u + a * .76 + .025, 1.15, 1.75, -58.80, -58.73);
      }
    }
  }
  // Low curved roof over the ticket hall; closed soffit/end faces keep the
  // barrel connected to its mapped concourse rather than a floating outline.
  for (let i = 0; i < 16; i++) {
    const a = Math.PI * i / 16, b = Math.PI * (i + 1) / 16;
    const x0 = -7 * Math.cos(a), x1 = -7 * Math.cos(b), y0 = 10.65 + 2.15 * Math.sin(a), y1 = 10.65 + 2.15 * Math.sin(b);
    P.quad(M.roof, [x0, y0, -58.75], [x1, y1, -58.75], [x1, y1, -42.0], [x0, y0, -42.0], [0, 1, 0]);
    P.fan(M.stone, [[x0, 10.6, -58.77], [x1, 10.6, -58.77], [x1, y1, -58.77], [x0, y0, -58.77]], [0, 0, -1]);
  }
  for (let i = 0; i < 7; i++) {
    const u = -5.55 + i * 1.85, top = 10.65 + 2.15 * Math.sqrt(Math.max(0, 1 - (u / 7) ** 2));
    D.box(M.window, u - .64, u + .64, 10.92, Math.max(11.1, top - .3), -58.84, -58.78);
  }
  for (const p of [P, D, F]) p.pop();
  facadeLabel(K, 'САНКТ-ПЕТЕРБУРГ', stationPoint(-11.4, -58.74), 11.25, FRONT.rot + Math.PI, 16.0, .85, rec.id, true);
  facadeLabel(K, 'SAINT PETERSBURG', stationPoint(11.4, -58.74), 11.25, FRONT.rot + Math.PI, 16.0, .85, rec.id, true);
  facadeLabel(K, 'ВЫХОД В ГОРОД', stationPoint(0, -58.83), 3.28, FRONT.rot + Math.PI, 9.0, .40, rec.id);

  // Continue the mapped rear/side wings with two-storey window rhythms, stone
  // plinths and cornices. Window/frame pieces are instanced, not one material
  // or an individual mesh per bay. The front face already has bespoke glazing.
  const trim = [], glass = [], seams = [];
  const add = (out, e, u, y, w, h, d, off) => {
    const x = e.a[0] + (e.b[0] - e.a[0]) * u / e.len + e.n[0] * off;
    const z = e.a[1] + (e.b[1] - e.a[1]) * u / e.len + e.n[1] * off;
    out.push({ x, y, z, sx: w, sy: h, sz: d, rot: Math.atan2(e.n[0], e.n[1]) });
  };
  for (const poly of rec.polys) for (const e of ringEdges(poly)) {
    const mx = (e.a[0] + e.b[0]) / 2, mz = (e.a[1] + e.b[1]) / 2;
    const u = (mx - FRONT.x) * c - (mz - FRONT.z) * s, v = (mx - FRONT.x) * s + (mz - FRONT.z) * c;
    if (v > -2 || (Math.abs(u) < 21 && v > -60) || e.len < 7) continue;
    onEdge(D, e, len => {
      D.box(M.granite, 0, len, .05, .65, 0, .055);
      D.box(M.trim, -.04, len + .04, 9.95, 10.5, 0, .18);
      D.box(M.trim, 0, len, 5.05, 5.25, 0, .095);
    });
    const n = Math.floor((e.len - 1.6) / 4.3);
    for (let i = 0; i < n; i++) for (const y of [2.75, 7.55]) {
      const a = (i + .5) * e.len / n;
      add(trim, e, a, y, 2.38, 3.35, .11, .09);
      add(glass, e, a, y + .04, 1.98, 2.93, .06, .17);
      add(seams, e, a, y + .04, .055, 2.93, .08, .23);
      add(seams, e, a, y - .33, 1.98, .055, .08, .23);
    }
  }
  const geo = new THREE.BoxGeometry(1, 1, 1);
  for (const [name, mat, spots, far] of [['trim', M.trim, trim, 650], ['glazing', M.window, glass, 650], ['mullions', M.metal, seams, 240]]) {
    const mesh = instances(ctx, `finlyandsky-station-facade-${name}`, geo, mat, spots, far);
    if (mesh) mesh.userData.buildingFacade = true;
  }
  svc.rearFacade = { bays: 7, sideWindows: glass.length, barrelRoof: true };
}

function lenin(K) {
  const { shell: P, medium: D, fine: F, M, ctx, svc } = K;
  const rec = MONUMENTS.find(m => m.id === 'r8850275') || { x: 233.4, z: -2407.8 }, { x, z } = rec, rot = FRONT.rot;
  for (const p of [P, D, F]) p.push(x, 0, z, rot);
  // The black granite support is an abstract armoured-car prow and turret,
  // not a realistic wheeled vehicle and not an ordinary square stone column.
  P.box(M.blackGranite, -3.8, 3.8, .04, .35, -4.2, 4.2);
  P.box(M.blackGranite, -2.4, 2.4, .35, .7, -3.2, 3.2);
  P.box(M.blackGranite, -1.35, 1.35, .7, 4.8, -1.8, 1.8);
  P.box(M.blackGranite, -1.75, 1.75, 3.7, 5.3, -2.2, 1.5);
  P.col(M.blackGranite, 0, -.35, 4.7, 6.0, 1.65, 1.65, 12);
  P.box(M.blackGranite, -2.6, -1.1, 4.9, 5.35, -.7, -.1);
  P.fan(M.blackGranite, [[-1.7, 3.2, 1.65], [1.7, 3.2, 1.65], [2.15, 5.1, 1.65], [-2.15, 5.1, 1.65]], [0, 0, 1]);
  D.push(0,6.0,-.35);F.push(0,6.0,-.35);
  sculptLenin(D,F,M);
  D.pop();F.pop();
  F.box(M.joint, -.025, .025, .7, 3.65, 1.81, 1.83);
  for (const yy of [1.5, 2.65, 3.65]) F.box(M.joint, -1.35, 1.35, yy, yy + .02, 1.805, 1.82);
  for (const p of [P, D, F]) p.pop();
  ctx.physics.addBox(x, z, 3.5, 4.4, rot, .35, 6);
  svc.monuments.push({ id: 'r8850275', name: 'Ленин на броневике', x, z, h: 10.7 });
}

function platformCap(ctx, P, mat, poly) {
  let pieces = triangulateRing(poly.o, poly.h || []);
  const net = ctx.services.streets?.net;
  if (net) {
    const bounds = boxOfPoly(poly.o.reduce((a, x, i, o) => i % 2 ? a : [...a, [x, o[i + 1]]], []));
    const touches = b => b[0] <= bounds[1] && b[1] >= bounds[0] && b[2] <= bounds[3] && b[3] >= bounds[2];
    for (const w of net.ways) for (let i = 0; i + 1 < w.x.length; i++) {
      const ax = w.x[i], az = w.z[i], bx = w.x[i + 1], bz = w.z[i + 1], dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz);
      const h = Math.max(w.hL[i], w.hR[i], w.hL[i + 1], w.hR[i + 1]) + .65;
      if (!l || !touches([Math.min(ax, bx) - h, Math.max(ax, bx) + h, Math.min(az, bz) - h, Math.max(az, bz) + h])) continue;
      const ux = dx / l, uz = dz / l, nx = -uz, nz = ux;
      const cut = ccw([[ax - ux * h - nx * h, az - uz * h - nz * h], [bx + ux * h - nx * h, bz + uz * h - nz * h], [bx + ux * h + nx * h, bz + uz * h + nz * h], [ax - ux * h + nx * h, az - uz * h + nz * h]]);
      pieces = subtractConvex(pieces, cut);
    }
    for (const f of net.fillets) if (touches(f.box)) pieces = subtractConvex(pieces, ccw(f.poly));
  }
  for (const p of pieces) P.fan(mat, p.map(([x, z]) => [x, .16, z]), [0, 1, 0], a => [a[0] / 3, a[2] / 3]);
}

function platforms(K) {
  const { shell: P, medium: D, M, ctx, svc } = K;
  const platform = PLATFORMS.find(p => p.id === 'r12715182');
  if (platform) for (const p of platform.polys) platformCap(ctx, P, M.platform, p);
  const sleepers = [], seen = new Set();
  const net = ctx.services.streets?.net, scratch = {};
  const clear = (x, z) => net ? net.cover(x, z, scratch) < -.6 : !ctx.L.isOnRoad(x, z, .6);
  let railSegments = 0;
  for (const rail of RAILS) if (rail.kind === 'rail' && !rail.tunnel && !rail.bridge && (rail.layer || 0) === 0) for (let i = 0; i + 3 < rail.pts.length; i += 2) {
    const a = rail.pts.slice(i, i + 2), b = rail.pts.slice(i + 2, i + 4), dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), n = Math.max(1, Math.ceil(len / 1.7));
    if (!len) continue;
    const nx = -dz / len, nz = dx / len;
    // Consolidate contiguous road-clear runs. Actual service asphalt and road
    // crossings remain on top, rather than a raised metal ribbon through them.
    let start = null;
    const flush = end => {
      if (start === null) return;
      for (const q of [-.76, .76]) {
        const ax = a[0] + dx * start + nx * q, az = a[1] + dz * start + nz * q, bx = a[0] + dx * end + nx * q, bz = a[1] + dz * end + nz * q;
        D.quad(M.rail, [ax - nx * .035, .13, az - nz * .035], [bx - nx * .035, .13, bz - nz * .035], [bx + nx * .035, .13, bz + nz * .035], [ax + nx * .035, .13, az + nz * .035], [0, 1, 0]);
      }
      railSegments++; start = null;
    };
    for (let j = 0; j < n; j++) {
      const t0 = j / n, t1 = (j + 1) / n, x = a[0] + dx * (t0 + t1) / 2, z = a[1] + dz * (t0 + t1) / 2;
      const railClear = [t0, (t0 + t1) / 2, t1].every(t => [-.8, .8].every(q => clear(a[0] + dx * t + nx * q, a[1] + dz * t + nz * q)));
      if (railClear) { if (start === null) start = t0; } else flush(t0);
      const local = x >= 270 && x <= 490 && z >= -3130 && z <= -2620;
      // At-grade lines continue toward Kushelevka, but sleeper detail stays
      // within the station throat. Bridge/tunnel tracks are not flattened.
      if (!local || ![-1.3, 0, 1.3].every(q => clear(x + nx * q, z + nz * q))) continue;
      const key = `${Math.round(x * 2)},${Math.round(z * 2)}`; if (seen.has(key)) continue; seen.add(key);
      sleepers.push({ x, z, y: .065, rot: Math.atan2(-nz, nx) });
    }
    flush(1);
  }
  instances(ctx, 'finlyandsky-track-sleepers', new THREE.BoxGeometry(2.4, .10, .21), M.sleeper, sleepers, 430);
  // The actual two mapped passenger shelters are only ~45 m long. The first
  // release's five 192 m bare canopies incorrectly roofed the open track fan.
  // Surveyed roof outlines control width/length; the 2015 reference supplies
  // white walls, broad opaque soffits, dark casement windows and open bays.
  const canopyIds = ['w158544503', 'w158544582'];
  const canopyRows = [];
  for (const id of canopyIds) {
    const rec = BUILDINGS.find(b => b.id === id), poly = rec?.polys?.[0];
    if (!poly) continue;
    const local = poly.o.reduce((a, x, i, o) => {
      if (i % 2) return a;
      const dx = x - FRONT.x, dz = o[i + 1] - FRONT.z;
      a.push([dx * c - dz * s, dx * s + dz * c]); return a;
    }, []);
    const us = local.map(p => p[0]), vs = local.map(p => p[1]);
    const u0 = Math.min(...us), u1 = Math.max(...us), v0 = Math.min(...vs), v1 = Math.max(...vs);
    const u = (u0 + u1) / 2, v = (v0 + v1) / 2, half = (u1 - u0) / 2, len = v1 - v0, p = stationPoint(u, v), rot = FRONT.rot;
    P.push(p.x, 0, p.z, rot); D.push(p.x, 0, p.z, rot);
    P.box(M.trim, -half, half, 4.43, 4.63, -len / 2, len / 2);
    for (const side of [-1, 1]) {
      P.quad(M.roof, [side * half, 4.63, -len / 2], [side * half, 4.63, len / 2], [0, 4.95, len / 2], [0, 4.95, -len / 2], [side * .1, 1, 0]);
      P.box(M.trim, side * half - .055, side * half + .055, 4.43, 4.78, -len / 2, len / 2);
    }
    for (const end of [-1, 1]) P.fan(M.trim, [[-half, 4.63, end * len / 2], [half, 4.63, end * len / 2], [0, 4.95, end * len / 2]], [0, 0, end]);
    for (let d = -len / 2 + 1; d <= len / 2; d += 5.5) D.box(M.silver, -half + .06, half - .06, 4.34, 4.43, d - .065, d + .065);
    for (const d of [-len / 2 + .2, -11, 0, 11, len / 2 - .2]) {
      P.box(M.trim, -.18, .18, .16, 4.44, d - .18, d + .18);
      D.box(M.trim, -half + .15, half - .15, 4.02, 4.35, d - .10, d + .10);
      const q = stationPoint(u, v + d);
      ctx.physics.addBox(q.x, q.z, .36, .36, rot, .16, 4.44);
    }
    const panels = [[-18.5, -11.5], [-10.4, -3.4], [3.4, 10.4], [11.5, 18.5]];
    for (const [a, b] of panels) {
      P.box(M.trim, -.12, .12, .16, 1.2, a, b);
      P.box(M.trim, -.12, .12, 3.45, 4.36, a, b);
      D.box(M.window, -.14, .14, 1.28, 3.35, a + .18, b - .18);
      for (let d = a + .2; d <= b; d += 1.1) D.box(M.metal, -.17, .17, 1.23, 3.42, d - .035, d + .035);
      D.box(M.metal, -.17, .17, 2.72, 2.78, a + .12, b - .12);
      // These are the shelter's fixed wall panels, not unbreakable street
      // furniture. The broad 6.8 m centre opening stays physically open.
      const q = stationPoint(u, v + (a + b) / 2);
      ctx.physics.addBox(q.x, q.z, .24, b - a, rot, .16, 4.36);
    }
    P.pop(); D.pop();
    facadeLabel(K, 'ВЫХОД В ГОРОД', stationPoint(u, v1 + .035), 4.12, FRONT.rot, Math.min(half * 2 - .6, 5.5), .32, id);
    canopyRows.push({ id, width: u1 - u0, length: len, x: p.x, z: p.z });
  }
  svc.platforms = { id: 'r12715182', canopies: canopyRows.length, shelters: canopyRows, sleepers: sleepers.length, railSegments };
}

function commuter(K) {
  const { shell: P, medium: D, M, ctx, svc } = K;
  // A parked, unbranded suburban electric set on a surveyed terminal track.
  // There is no moving-vehicle state or whole-district frame update.
  const track = RAILS.find(r => r.id === 'w1076914002');
  if (!track?.pts?.length) return;
  const [ax, az, bx, bz] = track.pts, len = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / len, dz = (bz - az) / len;
  const rot = Math.atan2(-dx, -dz), rc = Math.cos(rot), rs = Math.sin(rot), windows = [];
  for (let car = 0; car < 3; car++) {
    const x = ax + dx * (16 + 20.3 * car), z = az + dz * (16 + 20.3 * car);
    P.push(x, 0, z, rot); D.push(x, 0, z, rot);
    P.box(M.train, -1.43, 1.43, .85, 3.47, -9.8, 9.8);
    P.box(M.metal, -1.38, 1.38, 3.47, 3.7, -9.55, 9.55);
    P.box(M.trainRed, -1.445, 1.445, 1.25, 1.65, -9.82, 9.82);
    P.box(M.clock, -1.15, 1.15, .56, .88, -9.3, 9.3);
    for (const side of [-1, 1]) {
      for (const v of [-8.1, 8.1]) {
        D.box(M.trainRed, side < 0 ? -1.46 : 1.44, side < 0 ? -1.44 : 1.46, .88, 3.28, v - .73, v + .73);
        D.box(M.window, side < 0 ? -1.475 : 1.46, side < 0 ? -1.46 : 1.475, 1.95, 2.9, v - .56, v + .56);
      }
      for (let i = 0; i < 8; i++) {
        const u = side * 1.455, v = -6.1 + i * 1.74;
        windows.push({ x: x + rc * u + rs * v, y: 2.52, z: z - rs * u + rc * v, rot });
      }
      for (const v of [-6.3, -4.5, 4.5, 6.3]) D.cyl(M.clock, [side * .8, .48, v], [side * 1.02, .48, v], .38, .38, 10);
    }
    if (car === 0) {
      D.box(M.trainRed, -1.44, 1.44, 1.0, 3.35, 9.8, 9.9);
      D.box(M.window, -1.12, 1.12, 2.0, 3.0, 9.905, 9.94);
      D.box(M.metal, -.05, .05, 2.0, 3.0, 9.95, 9.97);
      for (const u of [-1, 1]) D.cyl(M.silver, [u, 1.45, 9.91], [u, 1.45, 10.0], .15, .15, 8);
    }
    D.box(M.clock, -.22, .22, .64, .84, -10.35, -9.8);
    P.pop(); D.pop();
    ctx.physics.addBox(x, z, 2.86, 19.6, rot, .5, 3.7);
  }
  instances(ctx, 'finlyandsky-commuter-windows', new THREE.BoxGeometry(.026, .88, 1.35), M.window, windows, 500);
  svc.parkedTrains = [{ track: track.id, cars: 3, x: ax, z: az, name: 'Пригородный электропоезд' }];
}

export function build(ctx) {
  ctx.services.labels ||= makeLabels();
  const M = Object.fromEntries(Object.entries({ stone: '#d8d2bf', trim: '#e4dfd0', granite: '#777771', roof: '#8e9797', window: '#304953', metal: '#8e9e9d', silver: '#c4c8bd', relief: '#bcb8a6', reliefShadow: '#6b716b', joint: '#b5b1a4', door: '#34474b', clock: '#3a4247', blackGranite: '#424b46', bronze: '#454e42', bronzeDark: '#28352c', bronzeLight:'#56604d', platform: '#8d8980', sleeper: '#888981', rail: '#8f9796', train: '#b3b7b4', trainRed: '#b4453b' }).map(([key, color]) => [key, ctx.mat.toon(color, { paint: .025 })]));
  const root = new THREE.Group(); root.name = 'landmarksFinlyandskyStation';
  const K = { ctx, M, root, shell: new Parts(), medium: new Parts(), fine: new Parts(), decals: new Set(), svc: { houses: [], monuments: [], entrances: [], photoSpots: [], triangles: 0 } };
  station(K); lenin(K); square(K,stationPoint); platforms(K); commuter(K);
  for (const [p, far, name] of [[K.shell, 2600, 'silhouette'], [K.medium, 650, 'architecture'], [K.fine, 240, 'reliefs']]) {
    for (const m of p.build(root, { name: `finlyandsky-${name}` })) { if (K.decals.has(m.material)) ctx.noOutline(m); m.updateMatrixWorld(true); registerLOD(m, far); }
    K.svc.triangles += p.tris;
  }
  ctx.addStatic(root);
  K.svc.photoSpots.push({ name: 'Финляндский вокзал', ...stationPoint(0, 78), yaw: -15.8, pitch: 11 }, { name: 'Ленин и поющие фонтаны', x: 225, z: -2360, yaw: -16.0, pitch: 10 });
  ctx.services.landmarksFinlyandskyStation = K.svc;
  const shared = (ctx.services.landmarks ||= {});
  for (const key of ['monuments', 'photoSpots']) shared[key] = (shared[key] || []).concat(K.svc[key]);
}
