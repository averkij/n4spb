// traffic/fleet.js - draws every vehicle (moving + parked) with a handful of InstancedMeshes.
//   per model kind (fleetdata.MODEL_KINDS): L0 (near) paint + glass + lamps, L1 (far) paint, plus the livery layers the model carries (taxi stripes, police / ambulance stripes and text,
//   the double-decker wordmark). Shared: occupants (drivers / passengers), steering wheels, taxi roof lamps, LED route boards, the two trolley poles of every trolleybus.
//   Each frame the module pushes every vehicle (push) and the fleet buckets it by distance to the camera (L0 < LOD0_R, L1 up to CULL_R, culled beyond), writing the instance matrices /
//   colours / plate cells / lamp intensities straight into the typed arrays. Meshes with nothing to draw are hidden (no empty draw calls).
// Car material = ctx.mat.toon (vertex colours, hand-painted noise) patched with: per-vertex `aKind` (1 = paint: tinted by the instance colour, plus a darker sill 10 %; 2 = plate: uv into
//   the plate atlas cell `aPlate`; 0 fixed colours; 3 = fixed colour with the sill), so ONE mesh carries paint, tyres, trim and plates. The cars of Petersburg are rain-washed: no dust gradient.
// Lamp material = unlit (MeshBasicMaterial) with per-instance head / tail / indicator intensities (day: dim DRL, night + braking: bloom).
// Trolley poles: two thin rods per trolleybus from the roof pad to the contact wires; traffic.js finds the wire tips (streets.wires.pairs) and passes them as v.tips.
import * as THREE from 'three';
import { ARCH, PART_ARCH, MODEL_KINDS, archOf } from './fleetdata.js';
import { makeModel } from './models.js';
import { plateAtlas, routeAtlas, liveryAtlas, PLATE_CELL, ROUTE_CELL } from './plates.js';
import { VB, quad } from './vb.js';
import { createFleetDamage } from './damage-fleet.js';
import { deformPoint } from '../drive/damage.js';

export const LOD0_R = 55, CULL_R = 340;

function patchCarMaterial(base) {
  const m = base.clone();
  m.name = 'pb-car-paint';
  const baseOBC = base.onBeforeCompile;
  m.onBeforeCompile = (shader, renderer) => {
    baseOBC(shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aKind;\nattribute float aPlate;\nvarying float vKind;\nvarying float vOy;')
      .replace('#include <color_vertex>', `
        vColor = vec3( 1.0 );
        #ifdef USE_COLOR
          vColor *= color;
        #endif
        #ifdef USE_INSTANCING_COLOR
          { float kp = step( 0.5, aKind ) * ( 1.0 - step( 1.5, aKind ) ); vColor = mix( vColor, vColor * instanceColor.xyz, kp ); }
        #endif`)
      .replace('#include <uv_vertex>', `#include <uv_vertex>
        #ifdef USE_MAP
        {
          float pk = step( 1.5, aKind ) * ( 1.0 - step( 2.5, aKind ) );
          float cell = floor( aPlate + 0.5 );
          float cc = mod( cell, ${PLATE_CELL.cols}.0 ), rr = floor( cell / ${PLATE_CELL.cols}.0 );
          vec2 pu = vec2( ( cc * ${PLATE_CELL.w}.0 + 1.0 + uv.x * ${PLATE_CELL.w - 2}.0 ) / ${PLATE_CELL.W}.0, 1.0 - ( rr * ${PLATE_CELL.h}.0 + ${PLATE_CELL.h - 1}.0 - uv.y * ${PLATE_CELL.h - 2}.0 ) / ${PLATE_CELL.H}.0 );
          vMapUv = mix( vec2( 0.5, 0.008 ), pu, pk );
        }
        #endif`)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvKind = aKind; vOy = position.y;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vKind;\nvarying float vOy;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          float dk = ( step( 0.5, vKind ) * ( 1.0 - step( 1.5, vKind ) ) ) + ( step( 2.5, vKind ) * ( 1.0 - step( 3.5, vKind ) ) );
          diffuseColor.rgb *= 1.0 - 0.10 * dk * ( 1.0 - smoothstep( 0.30, 0.46, vOy ) );
        }`);
  };
  m.customProgramCacheKey = () => 'pb-car-paint';
  return m;
}

export function lampMaterial() {
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, name: 'pb-car-lamp' });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aKind;\nattribute vec3 aLamp;\nvarying vec2 vLensUv;\nvarying float vLensKind;')
      .replace('#include <color_vertex>', `
        #ifdef USE_COLOR
        vLensUv = uv; vLensKind = aKind;
        // A lens still reflects daylight when its bulb is off. In particular,
        // parked vehicles have aLamp = 0, not an opaque black lamp cover.
        vColor = ( aKind < 0.5 ? vec3( 0.86, 0.93, 1.0 ) * max(0.55, aLamp.x) : ( aKind < 1.5 ? vec3( 1.0, 0.13, 0.08 ) * max(0.16, aLamp.y) : vec3( 1.0, 0.56, 0.08 ) * max(0.18, aLamp.z) ) ) * color;
        #endif`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vLensUv;\nvarying float vLensKind;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        if (vLensKind < 0.5) {
          // Silver reflector chambers, fluted glass and a sky reflection;
          // all fleet archetypes retain their existing lens silhouettes.
          float chamber = sin(vLensUv.x * 6.2831853 * 2.0);
          float flute = sin(vLensUv.x * 6.2831853 * 12.0);
          float reflection = smoothstep(0.48, 0.78, vLensUv.y);
          diffuseColor.rgb *= 0.68 + 0.15 * chamber * chamber + 0.05 * flute + 0.22 * reflection;
        }`);
  };
  m.customProgramCacheKey = () => 'pb-car-lamp';
  return m;
}

/** a basic (unlit) material that samples a row of an atlas chosen per instance (aCell) - the LED route boards */
function boardMaterial(tex) {
  const C = ROUTE_CELL;
  const m = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, name: 'pb-route-board' });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aCell;')
      .replace('#include <uv_vertex>', `#include <uv_vertex>
        #ifdef USE_MAP
          { float cell = floor( aCell + 0.5 ); float col = floor( cell / ${C.per}.0 ); float row = cell - col * ${C.per}.0;
            vMapUv = vec2( ( col + uv.x ) * ${C.w}.0 / ${C.W}.0, ( row + uv.y ) * ${C.h}.0 / ${C.H}.0 ); }
        #endif`);
  };
  m.customProgramCacheKey = () => 'pb-route-board';
  return m;
}

export function createFleet(ctx, cfg) {
  const cullR = CULL_R * ((ctx.quality && ctx.quality.cull) || 1), cullR2 = cullR * cullR;      // quality tier: 340 / 255 / 187 m
  const { mat } = ctx;
  const atlas = plateAtlas(ctx), routes = routeAtlas(ctx), liv = liveryAtlas(ctx);
  const baseToon = mat.toon('#ffffff', { vertexColors: true, map: atlas, paint: 0.02, name: 'pb-car-base' });
  const paintMat = patchCarMaterial(baseToon);
  // vehicle glass: the anime glass of ctx.mat.glass with less sky reflection and weaker streaks (bus / car windows read dark)
  const glassBase = mat.glass({ tint: '#0f1a24', opacity: 0.72, streaks: true });
  const glassMat = glassBase.clone();
  glassMat.fragmentShader = glassBase.fragmentShader.replace('0.35 + 0.45 * fres', '0.12 + 0.5 * fres').replace('streak * 0.55', 'streak * 0.36');
  if (ctx.shared.uSkyMid) { glassMat.uniforms.uSkyTop = ctx.shared.uSkyMid; glassMat.uniforms.uSkyLow = ctx.shared.uSkyLow; }
  glassMat.name = 'pb-car-glass';
  const lampMat = lampMaterial();
  const personMat = mat.toon('#ffffff', { vertexColors: true, paint: 0.02, name: 'pb-person' });
  const taxiMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, name: 'pb-taxi-lamp' });
  const livMat = mat.toon('#ffffff', { vertexColors: true, paint: 0.02, name: 'pb-livery' });
  const decalMat = mat.toon('#ffffff', { map: liv, alphaTest: 0.5, side: 'double', polygonOffset: -2, paint: 0.0, name: 'pb-decal' });
  const poleMat = mat.toon('#2a2d31', { paint: 0.0, name: 'pb-pole' });
  const boardMat = boardMaterial(routes);
  const night = ctx.shared.uNight;

  const inst = (geom, material, cap, o = {}) => {
    const m = new THREE.InstancedMesh(geom, material, cap);
    m.frustumCulled = false; m.count = 0; m.castShadow = !!o.cast; m.receiveShadow = o.receive !== false; m.name = o.name || ''; m.visible = false;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (o.color) { m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3).fill(1), 3); m.instanceColor.setUsage(THREE.DynamicDrawUsage); }
    if (o.attr) for (const [k, n] of Object.entries(o.attr)) { const a = new THREE.InstancedBufferAttribute(new Float32Array(cap * n), n); a.setUsage(THREE.DynamicDrawUsage); geom.setAttribute(k, a); m[k] = a; }
    if (o.noOutline) ctx.noOutline(m);
    ctx.add(m);
    return m;
  };

  // ---- per model kind meshes (geometry cloned per mesh so the per-instance attributes can live on it)
  const K = {};
  const EX = { taxi: [livMat, 48], police: [livMat, 8], amb: [livMat, 8], pdec: [decalMat, 8], adec: [decalMat, 8], tdec: [decalMat, 12] };
  for (const kind of MODEL_KINDS) {
    const cap = cfg.capacity[kind] || 8, cap0 = Math.min(cap, cfg.lod0Cap?.[kind] ?? 60);
    const m0 = makeModel(kind, 0), m1 = makeModel(kind, 1);
    const k = {
      kind, model: m0, n0: 0, n1: 0, cap, cap0, ex: {},
      paint0: inst(m0.paint.clone(), paintMat, cap0, { cast: true, color: true, attr: { aPlate: 1 }, name: 'car-' + kind + '-L0' }),
      paint1: inst(m1.paint.clone(), paintMat, cap, { cast: true, color: true, attr: { aPlate: 1 }, name: 'car-' + kind + '-L1' }),
      glass: inst(m0.glass.clone(), glassMat, cap0, { receive: false, noOutline: true, name: 'car-' + kind + '-glass' }),
      lamps: inst(m0.lamps.clone(), lampMat, cap0, { receive: false, noOutline: true, attr: { aLamp: 3 }, name: 'car-' + kind + '-lamps' }),
    };
    // All near-model layers use exactly the same transform and instance order.
    k.glass.instanceMatrix = k.lamps.instanceMatrix = k.paint0.instanceMatrix;
    for (const [name, [material, ecap]] of Object.entries(EX)) {
      const g = m0.extras && m0.extras[name]; if (!g) continue;
      const decal = material === decalMat;
      k.ex[name] = Object.assign(inst(g.clone(), material, ecap, { receive: !decal, noOutline: decal, name: `car-${kind}-${name}` }), { n: 0, cap: ecap });
    }
    K[kind] = k;
  }
  // ---- shared small meshes
  const personGeo = (() => {   // seated person: torso + head + hair, origin at the head centre, facing +Z
    const V = new VB(0);
    V.box(0.44, 0.50, 0.22, '#3b4048', [0, -0.40, -0.04]);
    V.box(0.20, 0.23, 0.21, '#c49a82', [0, 0, 0]);
    V.box(0.22, 0.10, 0.23, '#1b1918', [0, 0.095, -0.012]);
    return V.build();
  })();
  const steerGeo = (() => { const V = new VB(0); V.box(0.36, 0.03, 0.36, '#1c1d20', [0, 0, 0], [-1.05, 0, 0]); return V.build(); })();
  const taxiGeo = (() => { const V = new VB(0); V.box(0.36, 0.045, 0.16, '#222', [0, 0, 0]); V.box(0.32, 0.10, 0.12, '#f6c316', [0, 0.07, 0]); V.box(0.34, 0.012, 0.14, '#fff6c8', [0, 0.125, 0]); return V.build(); })();
  const S = {
    person: inst(personGeo, personMat, cfg.persons || 360, { cast: true, name: 'people-in-cars' }),
    steer: inst(steerGeo, personMat, cfg.persons || 360, { name: 'car-steering-wheels' }),
    taxi: inst(taxiGeo, taxiMat, 48, { name: 'taxi-lamps', noOutline: true }),
  };
  const boardGeo = quad([-0.7, -0.13, 0], [0.7, -0.13, 0], [0.7, 0.13, 0], [-0.7, 0.13, 0]);
  boardGeo.deleteAttribute('normal');
  S.board = inst(boardGeo, boardMat, 60, { receive: false, noOutline: true, attr: { aCell: 1 }, name: 'bus-route-boards' });
  // trolley poles: unit rod along +Y (r = 1 scaled to 2.2 cm), one instance per pole, matrix = rod from the roof pad to the wire tip
  const poleGeo = (() => { const g = new THREE.CylinderGeometry(1, 1, 1, 5); g.translate(0, 0.5, 0); return g; })();
  S.pole = inst(poleGeo, poleMat, 2 * 40, { cast: true, name: 'trolley-poles' });
  // the contact head: a small block at the tip (instanced too)
  const headGeo = (() => { const V = new VB(0); V.box(0.07, 0.05, 0.22, '#15161a', [0, 0, 0]); return V.build(); })();
  S.head = inst(headGeo, personMat, 2 * 40, { name: 'trolley-heads' });

  // ---- per frame
  const cam = new THREE.Vector3();
  let nPerson = 0, nSteer = 0, nTaxi = 0, nBoard = 0, nPole = 0, culled = 0;
  const stats = { l0: 0, l1: 0, culled: 0 };
  const damaged = createFleetDamage(ctx);
  function begin(camera) {
    damaged.begin();
    camera.getWorldPosition(cam);
    for (const k of Object.values(K)) { k.n0 = k.n1 = 0; for (const e of Object.values(k.ex)) e.n = 0; }
    nPerson = nSteer = nTaxi = nBoard = nPole = culled = 0;
    stats.l0 = stats.l1 = 0;
  }
  // yaw (c, s = cos / sin of rotY) and an optional pitch (cp, sp = cos / sin of the nose-up angle: the humped Anichkov deck): columns X = (c, 0, -s), Y = (-sp s, cp, -sp c), Z = (cp s, sp, cp c)
  const put = (arr, o, x, y, z, c, s, cp = 1, sp = 0) => {
    arr[o] = c; arr[o + 1] = 0; arr[o + 2] = -s; arr[o + 3] = 0;
    arr[o + 4] = -sp * s; arr[o + 5] = cp; arr[o + 6] = -sp * c; arr[o + 7] = 0;
    arr[o + 8] = cp * s; arr[o + 9] = sp; arr[o + 10] = cp * c; arr[o + 11] = 0;
    arr[o + 12] = x; arr[o + 13] = y; arr[o + 14] = z; arr[o + 15] = 1;
  };
  /** world position of the vehicle-local offset (lx, ly, lz) of v (yaw + pitch) -> _w */
  const _w = [0, 0, 0];
  const damagedPoint = { x: 0, y: 0, z: 0 };
  const at = (v, cp, sp, lx, ly, lz) => {
    if (v.damageState) {
      const spec = v.damageSpec || (v.damageSpec = { ...archOf(v.kind), W: archOf(v.kind).wid });
      damagedPoint.x = lx; damagedPoint.y = ly; damagedPoint.z = lz;
      deformPoint(damagedPoint, v.damageState, spec);
      lx = damagedPoint.x; ly = damagedPoint.y; lz = damagedPoint.z;
    }
    _w[0] = v.x + v.c * lx - sp * v.s * ly + cp * v.s * lz;
    _w[1] = v.y + cp * ly + sp * lz;
    _w[2] = v.z - v.s * lx - sp * v.c * ly + cp * v.c * lz;
    return _w;
  };
  /** matrix of a rod / head from p0 along (dx,dy,dz) of length len (unit rod along +Y, radius r) */
  const putRod = (arr, o, x0, y0, z0, x1, y1, z1, r) => {
    let dx = x1 - x0, dy = y1 - y0, dz = z1 - z0; const len = Math.hypot(dx, dy, dz) || 1e-6; dx /= len; dy /= len; dz /= len;
    // x axis = normalize(up x d) (d is never vertical for a pole)
    let ax = dz, az = -dx; const al = Math.hypot(ax, az) || 1; ax /= al; az /= al;
    // z axis = x axis x y axis(d)
    const bx = ay2(ax, 0, az, dx, dy, dz);
    arr[o] = ax * r; arr[o + 1] = 0; arr[o + 2] = az * r; arr[o + 3] = 0;
    arr[o + 4] = dx * len; arr[o + 5] = dy * len; arr[o + 6] = dz * len; arr[o + 7] = 0;
    arr[o + 8] = bx[0] * r; arr[o + 9] = bx[1] * r; arr[o + 10] = bx[2] * r; arr[o + 11] = 0;
    arr[o + 12] = x0; arr[o + 13] = y0; arr[o + 14] = z0; arr[o + 15] = 1;
  };
  const ay2 = (ax, ay, az, dx, dy, dz) => [ay * dz - az * dy, az * dx - ax * dz, ax * dy - ay * dx];
  const addEx = (e, v) => { if (e && e.n < e.cap) { put(e.instanceMatrix.array, e.n * 16, v.x, v.y, v.z, v.c, v.s, v.cp === undefined ? 1 : v.cp, v.sp || 0); e.n++; } };
  /** v: { kind, x, y, z, c, s (cos / sin of rotY), color {r,g,b}, plate, lamp: [head, tail, ind] | null (parked), driver, pax, taxi, police, amb, route, tips } */
  function push(v) {
    const dx = v.x - cam.x, dz = v.z - cam.z, d2 = dx * dx + dz * dz;
    if (d2 > cullR2) { culled++; return; }
    const k = K[v.kind]; if (!k) return;
    const damagedBody = damaged.push(v, k);
    const near = damagedBody || d2 < LOD0_R * LOD0_R && k.n0 < k.cap0;
    const cp = v.cp === undefined ? 1 : v.cp, sp = v.sp || 0;
    if (near) {
      if (!damagedBody) {
        const i = k.n0++;
        put(k.paint0.instanceMatrix.array, i * 16, v.x, v.y, v.z, v.c, v.s, cp, sp);
        const ca = k.paint0.instanceColor.array; ca[i * 3] = v.color.r; ca[i * 3 + 1] = v.color.g; ca[i * 3 + 2] = v.color.b;
        k.paint0.aPlate.array[i] = v.plate;
        const la = k.lamps.aLamp.array, L = v.lamp;
        if (L) { la[i * 3] = L[0]; la[i * 3 + 1] = L[1]; la[i * 3 + 2] = L[2]; } else { la[i * 3] = la[i * 3 + 1] = la[i * 3 + 2] = 0; }
      }
      stats.l0++;
      const sd = k.model.seat;
      if (v.driver && nPerson < (S.person.instanceMatrix.array.length / 16) - 1) {
        const lx = sd.x, lz = sd.z; let w = at(v, cp, sp, lx, sd.y, lz);
        put(S.person.instanceMatrix.array, nPerson * 16, w[0], w[1], w[2], v.c, v.s, cp, sp); nPerson++;
        if (nSteer < (S.steer.instanceMatrix.array.length / 16)) { w = at(v, cp, sp, lx, sd.wy, sd.wz); put(S.steer.instanceMatrix.array, nSteer * 16, w[0], w[1], w[2], v.c, v.s, cp, sp); nSteer++; }
        if (v.pax && nPerson < (S.person.instanceMatrix.array.length / 16) - 1) { w = at(v, cp, sp, -sd.x, sd.y - 0.02, lz); put(S.person.instanceMatrix.array, nPerson * 16, w[0], w[1], w[2], v.c, v.s, cp, sp); nPerson++; }
      }
      if (v.taxi && nTaxi < 48 && sd.roofZ !== undefined && k.ex.taxi) { const w = at(v, cp, sp, 0, sd.roofY + 0.03, sd.roofZ); put(S.taxi.instanceMatrix.array, nTaxi * 16, w[0], w[1], w[2], v.c, v.s, cp, sp); nTaxi++; }
      if (!damagedBody) {
        if (v.taxi) addEx(k.ex.taxi, v);
        if (v.police) { addEx(k.ex.police, v); addEx(k.ex.pdec, v); }
        if (v.amb) { addEx(k.ex.amb, v); addEx(k.ex.adec, v); }
        if (k.ex.tdec) addEx(k.ex.tdec, v);
      }
      const md = k.model;
      if (v.route !== undefined && v.route !== null && md.board && nBoard < 60) {      // LED route board above the windscreen
        const bd = md.board;
        const w = at(v, cp, sp, 0, bd.y, bd.z); put(S.board.instanceMatrix.array, nBoard * 16, w[0], w[1], w[2], v.c, v.s, cp, sp);
        S.board.aCell.array[nBoard] = v.route; nBoard++;
      }
      if (md.pole && v.tips && nPole + 2 <= 80) {                                       // two trolley poles from the pad to the wire tips
        const pl = md.pole, t = v.tips;
        for (let q = 0; q < 2; q++) {
          const sx = q ? -pl.x : pl.x, w = at(v, cp, sp, sx, pl.y, pl.z), bx = w[0], by = w[1], bz = w[2];
          const tx = t[q * 3], ty = t[q * 3 + 1], tz = t[q * 3 + 2];
          putRod(S.pole.instanceMatrix.array, nPole * 16, bx, by, bz, tx, ty, tz, 0.034);
          // contact head: a short block along the wire at the tip
          put(S.head.instanceMatrix.array, nPole * 16, tx, ty - 0.02, tz, t[6], t[7]);
          nPole++;
        }
      }
    } else if (k.n1 < k.cap) {
      const i = k.n1++;
      put(k.paint1.instanceMatrix.array, i * 16, v.x, v.y, v.z, v.c, v.s, cp, sp);
      const ca = k.paint1.instanceColor.array; ca[i * 3] = v.color.r; ca[i * 3 + 1] = v.color.g; ca[i * 3 + 2] = v.color.b;
      stats.l1++;
    }
  }
  function end() {
    const upload = (attribute, count) => {
      if (!count) return;
      let end = count * attribute.itemSize;
      // Include pending data if this mesh has not been rendered since an earlier pack.
      for (const r of attribute.updateRanges) end = Math.max(end, r.start + r.count);
      attribute.clearUpdateRanges(); attribute.addUpdateRange(0, end); attribute.needsUpdate = true;
    };
    for (const k of Object.values(K)) {
      k.paint0.count = k.glass.count = k.lamps.count = k.n0; k.paint1.count = k.n1;
      const mm = [k.paint0, k.paint1, k.glass, k.lamps];
      for (const m of mm) m.visible = m.count > 0;
      upload(k.paint0.instanceMatrix, k.n0); upload(k.paint1.instanceMatrix, k.n1);
      upload(k.paint0.instanceColor, k.n0); upload(k.paint1.instanceColor, k.n1); upload(k.paint0.aPlate, k.n0); upload(k.lamps.aLamp, k.n0);
      for (const e of Object.values(k.ex)) { e.count = e.n; e.visible = e.n > 0; upload(e.instanceMatrix, e.n); }
    }
    S.person.count = nPerson; S.steer.count = nSteer; S.taxi.count = nTaxi; S.board.count = nBoard; S.pole.count = nPole; S.head.count = nPole;
    for (const m of [S.person, S.steer, S.taxi, S.board, S.pole, S.head]) { upload(m.instanceMatrix, m.count); m.visible = m.count > 0; }
    upload(S.board.aCell, nBoard);
    stats.culled = culled;
  }
  return { begin, push, end, K, S, stats, lampMat, paintMat, damaged };
}
void ARCH; void PART_ARCH; void archOf;
