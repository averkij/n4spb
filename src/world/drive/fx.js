// drive/fx.js - soft billboard particles for the player's car: white tyre smoke while drifting / braking hard, warm sparks when it scrapes or hits something, and a
// fading exhaust glow trail while the nitro burns. Two InstancedMeshes (smoke = normal blending, sparks = additive), one draw call each, no outline pass.
// COLD GAS (the Roadster, def.jetFx in drive/cars/index.js): its THRUST is not a fire but a white condensate cloud, so the exhaust glow is replaced by soft white puffs from every nozzle
// (a third, normal-blended InstancedMesh with its own cap, so the tyre smoke is never starved), plus the hop's down-jet columns and the ring cloud that rolls out from the car at take-off and touchdown.
// HOP v3: bigger columns / rings for the barrel hop (C; car.jetK), whose SIDE STREAMS are: thin white cold-gas jets from the front lateral nozzles and a
// rear pair, pulsing left / right while the (cosmetic) barrel roll turns the car (car.flip, car.pulse0 / pulse1; tuning.hop.flip.nozzles), emitted along the body's own sideways axis so they spiral with the roll.
import * as THREE from 'three';

export function system(ctx, cap, additive, name = additive ? 'drive-sparks' : 'drive-smoke', flat = false) {      // (exported: the boat's wake, drive/boat/wake.js, is two more soft-particle systems; flat = quads that lie on the water instead of facing the camera)
  const geo = new THREE.InstancedBufferGeometry();
  const base = new THREE.PlaneGeometry(1, 1);
  geo.index = base.index; geo.attributes.position = base.attributes.position; geo.attributes.uv = base.attributes.uv;
  const aPos = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3), aSize = new THREE.InstancedBufferAttribute(new Float32Array(cap), 1);
  const aCol = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4);
  for (const a of [aPos, aSize, aCol]) a.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aPos', aPos); geo.setAttribute('aSize', aSize); geo.setAttribute('aCol', aCol);
  geo.instanceCount = 0;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false, fog: false,
    vertexShader: `attribute vec3 aPos; attribute float aSize; attribute vec4 aCol; varying vec2 vUv; varying vec4 vCol;
      void main(){ vUv = uv; vCol = aCol; ${flat ? 'vec4 mv = viewMatrix * vec4(aPos + vec3(position.x, 0.0, -position.y) * aSize, 1.0);' : 'vec4 mv = viewMatrix * vec4(aPos, 1.0); mv.xy += position.xy * aSize;'} gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec2 vUv; varying vec4 vCol;
      void main(){ float d = length(vUv - 0.5) * 2.0; float a = smoothstep(1.0, 0.15, d) * vCol.a; if (a < 0.01) discard; gl_FragColor = vec4(vCol.rgb, a); }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 5; mesh.name = name;
  ctx.noOutline(mesh); ctx.add(mesh);
  const P = []; for (let i = 0; i < cap; i++) P.push({ live: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, age: 0, life: 1, s0: 1, s1: 1, r: 1, g: 1, b: 1, a: 1, grav: 0, drag: 0 });
  let next = 0;
  return {
    mesh,
    emit(p) {
      const q = P[next]; next = (next + 1) % cap;
      Object.assign(q, { live: true, age: 0, grav: 0, drag: 1, a: 0.5, r: 1, g: 1, b: 1, s0: 0.3, s1: 1, life: 1 }, p);
    },
    update(dt) {
      let n = 0;
      for (const q of P) {
        if (!q.live) continue;
        q.age += dt; if (q.age >= q.life) { q.live = false; continue; }
        const k = Math.exp(-q.drag * dt);
        q.vx *= k; q.vz *= k; q.vy = q.vy * k + q.grav * dt;
        q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
        const t = q.age / q.life;
        aPos.setXYZ(n, q.x, q.y, q.z); aSize.setX(n, q.s0 + (q.s1 - q.s0) * t);
        aCol.setXYZW(n, q.r, q.g, q.b, q.a * (1 - t) * (t < 0.08 ? t / 0.08 : 1));
        n++;
      }
      geo.instanceCount = n; mesh.visible = n > 0;
      aPos.needsUpdate = aSize.needsUpdate = aCol.needsUpdate = true;
    },
    clear() { for (const q of P) q.live = false; geo.instanceCount = 0; mesh.visible = false; },
  };
}

/** where the hop's four down-jets sit in the car frame (x to the left, z forward): behind each front wheel and each rear wheel (roadster.js downJets) */
const DOWN = [[0.95, 0.95], [-0.95, 0.95], [0.95, -1.98], [-0.95, -1.98]];

export function createFx(ctx) {
  const smoke = system(ctx, 110, false), sparks = system(ctx, 70, true), glow = system(ctx, 60, true), jet = system(ctx, 220, false, 'drive-jet');
  let acc = 0, damageAcc = 0, jetAcc = 0, gasAcc = 0, columnAcc = 0, streamAcc = 0;
  const R = ctx.rng('drive-fx');
  return {
    /** every frame: wheel contact points (world) + the state of the car; jetFx (def.jetFx) + jetDir (world unit vector, the way the nozzles fire) switch the exhaust glow to the cold-gas cloud */
    update(dt, car, wheelsWorld, exhaustWorld, jetFx = null, jetDir = null) {
      acc += dt;
      const slip = car.drifting ? Math.min(1, (Math.abs(car.vL) - 2) / 6) : 0, hard = car.braking && car.speed > 40 ? 0.6 : 0;
      const launch = car.throttle > 0.9 && car.speed < 25 && car.speed > 2 ? 0.35 : 0;
      const amt = car.air ? 0 : Math.max(slip, hard, launch);                                   // (no tyre smoke in the air)
      if (amt > 0.05) {
        const rate = 36 * amt;
        while (acc > 1 / rate) {
          acc -= 1 / rate;
          for (const w of wheelsWorld.slice(2)) smoke.emit({ x: w.x + (R() - 0.5) * 0.3, y: 0.18, z: w.z + (R() - 0.5) * 0.3, vx: (R() - 0.5) * 1.2 - car.vx * 0.12, vy: 0.5 + R() * 0.8, vz: (R() - 0.5) * 1.2 - car.vz * 0.12, life: 1.1 + R() * 0.8, s0: 0.45, s1: 2.0 + R() * 1.2, a: 0.42 * amt + 0.1, r: 0.93, g: 0.93, b: 0.95, drag: 1.4 });
        }
      } else acc = 0;
      if (car.boosting && jetFx && jetDir) {
        const c = jetFx.color, spd = Math.hypot(car.vx, car.vz), ground = car.y - (car.h || 0);
        jetAcc += dt * jetFx.rate;
        for (; jetAcc >= 1; jetAcc--) for (const e of exhaustWorld) {
          const back = jetFx.back * (0.7 + 0.6 * R());
          jet.emit({ x: e.x + (R() - 0.5) * 0.08, y: e.y + (R() - 0.5) * 0.08, z: e.z + (R() - 0.5) * 0.08, vx: 0.15 * car.vx + jetDir.x * back + (R() - 0.5), vy: jetDir.y * back + 0.15 + (R() - 0.5) * 0.6, vz: 0.15 * car.vz + jetDir.z * back + (R() - 0.5),
            life: jetFx.life[0] + R() * (jetFx.life[1] - jetFx.life[0]), s0: jetFx.s0, s1: jetFx.s1 * (0.75 + 0.5 * R()), a: jetFx.a, r: c[0], g: c[1], b: c[2], drag: jetFx.drag });
        }
        if (jetFx.ground && spd < 10) {                                                           // a standing start: the cloud hugs the road around the car
          gasAcc += dt * 16;
          for (; gasAcc >= 1; gasAcc--) for (const e of exhaustWorld) if (R() < 0.5) jet.emit({ x: e.x, y: ground + 0.2 + R() * 0.15, z: e.z, vx: (R() - 0.5) * 4, vy: 0.05, vz: (R() - 0.5) * 4, life: 1.2 + R() * 0.7, s0: 0.5, s1: 3.2, a: jetFx.a * 0.8, r: c[0], g: c[1], b: c[2], drag: 1.6 });
        } else gasAcc = 0;
      } else jetAcc = gasAcc = 0;
      if (car.boosting && !jetFx) {
        for (const e of exhaustWorld) if (R() < 0.8) glow.emit({ x: e.x, y: e.y, z: e.z, vx: -car.vx * 0.12 + (R() - 0.5) * 0.6, vy: (R() - 0.2) * 0.4, vz: -car.vz * 0.12 + (R() - 0.5) * 0.6, life: 0.35 + R() * 0.25, s0: 0.28, s1: 0.06, a: 0.7, r: 1.0, g: 0.55, b: 0.18, drag: 2.5 });
      }
      if (car.jet > 0.1) {                                                                        // the hop's down-jets: a white column under each wheel and a spray where it meets the road
        const s = Math.sin(car.yaw), co = Math.cos(car.yaw), ground = car.y - (car.h || 0);
        const K = car.jetK || 1;                                                                  // the barrel hop: longer, fatter columns and a wider spray
        columnAcc += dt * (K > 1 ? 30 : 36);
        for (; columnAcc >= 1; columnAcc--) for (const [lx, lz] of DOWN) {
          const x = car.x + lx * co + lz * s, z = car.z - lx * s + lz * co;
          jet.emit({ x: x + (R() - 0.5) * 0.1, y: car.y + 0.2, z: z + (R() - 0.5) * 0.1, vx: car.vx * 0.5, vy: (-5 - R() * 2) * (1 + 0.35 * (K - 1)), vz: car.vz * 0.5, life: (0.28 + R() * 0.1) * (1 + 0.45 * (K - 1)), s0: 0.22 * K, s1: 0.8 * K, a: 0.5 * car.jet, r: 0.93, g: 0.95, b: 1.0, drag: 1 });
          if (R() < (K > 1 ? 0.35 : 0.5)) { const a = R() * 6.283, v = 2.6 * (1 + 0.5 * (K - 1)); jet.emit({ x, y: ground + 0.12, z, vx: Math.cos(a) * v + car.vx * 0.4, vy: 0.1, vz: Math.sin(a) * v + car.vz * 0.4, life: 0.7 + R() * 0.4, s0: 0.4, s1: 1.7 * (1 + 0.4 * (K - 1)), a: (K > 1 ? 0.3 : 0.4) * car.jet, r: 0.93, g: 0.95, b: 1.0, drag: 2 }); }
        }
      } else columnAcc = 0;
      const FL = car.tuning && car.tuning.hop && car.tuning.hop.flip;
      if (car.flipOn && FL && (car.pulse0 > 0.1 || car.pulse1 > 0.1)) {                           // the side streams of the barrel hop: thin cold-gas jets out of the flanks, spiralling with the roll
        const cf = Math.cos(car.flip), sf = Math.sin(car.flip), py = FL.pivotY, s = Math.sin(car.yaw), co = Math.cos(car.yaw), N = FL.nozzles;
        streamAcc += dt * 56;
        for (; streamAcc >= 1; streamAcc--) for (let side = 0; side < 2; side++) {
          const k = side === 0 ? car.pulse0 : car.pulse1; if (k < 0.1) continue;
          const sx = side === 0 ? 1 : -1;                                                           // + x = the car's left
          for (let i = 0; i < N.length; i++) {
            const lx = sx * N[i][0], ly = N[i][1] - py, lz = N[i][2];
            const rx = lx * cf - ly * sf, ry = lx * sf + ly * cf + py;                              // the nozzle after the roll about the pivot (car frame)
            const dx = sx * cf, dy = sx * sf, v = (10 + 5 * k) * (0.85 + 0.3 * R());                // its jet leaves along the body's own sideways axis
            jet.emit({ x: car.x + rx * co + lz * s + (R() - 0.5) * 0.06, y: car.y + ry + (R() - 0.5) * 0.06, z: car.z - rx * s + lz * co + (R() - 0.5) * 0.06,
              vx: car.vx * 0.5 + dx * co * v, vy: dy * v, vz: car.vz * 0.5 - dx * s * v, life: 0.34 + R() * 0.16, s0: 0.38, s1: 1.2, a: 0.7 * k, r: 0.95, g: 0.98, b: 1.0, drag: 2.0 });
          }
        }
      } else streamAcc = 0;
      const damage = car.damageSmoke || 0;
      if (damage > 0) {
        damageAcc += dt * (5 + 12 * damage);
        while (damageAcc >= 1) {
          damageAcc--;
          smoke.emit({ x: car.x + Math.sin(car.yaw) * (car.smokeZ ?? 1.2) + (R() - 0.5) * 0.35,
            y: car.y + (car.smokeY ?? 0.82), z: car.z + Math.cos(car.yaw) * (car.smokeZ ?? 1.2) + (R() - 0.5) * 0.35,
            vx: car.vx * 0.15 + (R() - 0.5) * 0.4, vy: 0.8 + R() * 0.7, vz: car.vz * 0.15,
            life: 1.8 + R(), s0: 0.3, s1: 1.5 + damage, a: 0.24 + damage * 0.25,
            r: 0.31, g: 0.33, b: 0.37, drag: 0.6 });
        }
      } else damageAcc = 0;
      smoke.update(dt); sparks.update(dt); glow.update(dt); jet.update(dt);
    },
    /** the ring cloud of a hop (take-off and touchdown): puffs roll out from the car's middle at road level; k > 1 = the barrel hop (faster, bigger, a second tighter ring) */
    ring(x, y, z, n = 24, k = 1) {
      for (let i = 0; i < n; i++) {
        const a = (i + R() * 0.8) / n * 6.283, v = (4.2 + R() * 1.6) * k * (k > 1 && i % 2 ? 0.6 : 1);
        jet.emit({ x, y: y + 0.2, z, vx: Math.cos(a) * v, vy: 0.05 + R() * 0.2, vz: Math.sin(a) * v, life: 1.2 + R() * 0.4, s0: 0.6, s1: 2.4 * k, a: 0.45, r: 0.93, g: 0.95, b: 1.0, drag: 1.8 });
      }
    },
    sparks(x, y, z, nx, nz, n = 14, speed = 6) {
      for (let i = 0; i < n; i++) sparks.emit({ x, y, z, vx: nx * speed * (0.4 + R()) + (R() - 0.5) * 5, vy: 1 + R() * 4, vz: nz * speed * (0.4 + R()) + (R() - 0.5) * 5, life: 0.35 + R() * 0.45, s0: 0.10, s1: 0.03, a: 1, r: 1, g: 0.78, b: 0.35, grav: -14, drag: 0.6 });
    },
    clear() { smoke.clear(); sparks.clear(); glow.clear(); jet.clear(); acc = damageAcc = jetAcc = gasAcc = columnAcc = streamAcc = 0; },
  };
}
