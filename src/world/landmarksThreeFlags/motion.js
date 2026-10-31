import * as THREE from 'three';
import { MAST_HEIGHT, FLAG_WIDTH, FLAG_HEIGHT } from './sites.js';

export const WIND_ROTATION = 0.32;
const PRIMARY_SPEED = 0.45, FOLD_SPEED = 0.65;

// Two long travelling waves: about 14 s and 9.7 s per cycle. Amplitude grows
// from zero at the hoist; the steel mast itself never sways with the textile.
export function clothPoint(u, v, phase = 0, time = 0) {
  const q = u / FLAG_WIDTH;
  return [
    1.1 + u * (0.965 - 0.025 * Math.sin(v / FLAG_HEIGHT * Math.PI)),
    MAST_HEIGHT - 1.05 - v - 3.8 * q * q + Math.sin(q * 7.5 + phase - time * PRIMARY_SPEED) * q * 0.9,
    Math.sin(q * 9 + phase - v * 0.075 - time * PRIMARY_SPEED) * q * 3.5
      + Math.sin(q * 19 + v * 0.11 - time * FOLD_SPEED) * q * 0.7,
  ];
}

// Analytic normal, shared by bands and their sewn-on emblem. The shader uses
// the same derivatives, so lighting follows the moving folds rather than the
// original pose. Cross(dv, du) matches the textile's front triangle winding.
export function clothNormal(u, v, phase = 0, time = 0) {
  const q = u / FLAG_WIDTH, a = q * 7.5 + phase - time * PRIMARY_SPEED;
  const b = q * 9 + phase - v * 0.075 - time * PRIMARY_SPEED;
  const c = q * 19 + v * 0.11 - time * FOLD_SPEED;
  const du = new THREE.Vector3(0.965 - 0.025 * Math.sin(v / FLAG_HEIGHT * Math.PI),
    (-7.6 * q + 0.9 * (Math.sin(a) + 7.5 * q * Math.cos(a))) / FLAG_WIDTH,
    (3.5 * Math.sin(b) + 0.7 * Math.sin(c) + q * (31.5 * Math.cos(b) + 13.3 * Math.cos(c))) / FLAG_WIDTH);
  const dv = new THREE.Vector3(-u * 0.025 * Math.PI / FLAG_HEIGHT * Math.cos(v / FLAG_HEIGHT * Math.PI),
    -1, q * (-0.2625 * Math.cos(b) + 0.077 * Math.cos(c)));
  return dv.cross(du).normalize();
}

// Bound every wave phase, including both emblem offsets. A sphere about the
// foot also bounds every mast rotation after a collision. No per-frame bound
// recomputation or unbounded/frustumCulled=false objects are necessary.
export function flagMotionBounds(geometry) {
  const a = geometry.attributes.aFlag, box = new THREE.Box3();
  const turn = new THREE.Matrix4().makeRotationY(WIND_ROTATION), p = new THREE.Vector3();
  let r2 = 0;
  for (let i = 0; i < a.count; i++) {
    const u = a.getX(i), v = a.getY(i), q = u / FLAG_WIDTH;
    const x = 1.1 + u * (0.965 - 0.025 * Math.sin(v / FLAG_HEIGHT * Math.PI));
    const y = MAST_HEIGHT - 1.05 - v - 3.8 * q * q;
    const z = a.getW(i), dy = q * 0.9, dz = q * 4.2;
    r2 = Math.max(r2, x * x + (Math.abs(y) + dy) ** 2 + (Math.abs(z) + dz) ** 2);
    for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      p.set(x, y + sy * dy, z + sz * dz).applyMatrix4(turn); box.expandByPoint(p);
    }
  }
  // Float32 geometry at the envelope boundary needs a tiny numerical allowance.
  geometry.boundingBox = box.expandByScalar(0.0001);
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Math.sqrt(r2) + 0.0001);
  return geometry;
}

const WAVE_GLSL = /* glsl */`
attribute vec4 aFlag;
uniform float uFlagTime;
vec3 flagTurn(vec3 p) {
  return vec3(${Math.cos(WIND_ROTATION)}, 0., ${-Math.sin(WIND_ROTATION)}) * p.x
    + vec3(0., p.y, 0.) + vec3(${Math.sin(WIND_ROTATION)}, 0., ${Math.cos(WIND_ROTATION)}) * p.z;
}
vec3 flagPoint() {
  float u = aFlag.x, v = aFlag.y, q = u / ${FLAG_WIDTH.toFixed(1)};
  float t = uFlagTime;
  return flagTurn(vec3(
    1.1 + u * (0.965 - 0.025 * sin(v / ${FLAG_HEIGHT.toFixed(1)} * PI)),
    ${(MAST_HEIGHT - 1.05).toFixed(2)} - v - 3.8*q*q + sin(q*7.5 + aFlag.z - t*${PRIMARY_SPEED})*q*0.9,
    sin(q*9.0 + aFlag.z - v*0.075 - t*${PRIMARY_SPEED})*q*3.5
      + sin(q*19.0 + v*0.11 - t*${FOLD_SPEED})*q*0.7 + aFlag.w));
}
vec3 flagNormal() {
  float u = aFlag.x, v = aFlag.y, q = u / ${FLAG_WIDTH.toFixed(1)};
  float a = q*7.5 + aFlag.z - uFlagTime*${PRIMARY_SPEED};
  float b = q*9.0 + aFlag.z - v*0.075 - uFlagTime*${PRIMARY_SPEED};
  float c = q*19.0 + v*0.11 - uFlagTime*${FOLD_SPEED};
  vec3 du = vec3(0.965 - 0.025*sin(v/${FLAG_HEIGHT.toFixed(1)}*PI),
    (-7.6*q + 0.9*(sin(a) + 7.5*q*cos(a)))/${FLAG_WIDTH.toFixed(1)},
    (3.5*sin(b) + 0.7*sin(c) + q*(31.5*cos(b) + 13.3*cos(c)))/${FLAG_WIDTH.toFixed(1)});
  vec3 dv = vec3(-u*0.025*PI/${FLAG_HEIGHT.toFixed(1)}*cos(v/${FLAG_HEIGHT.toFixed(1)}*PI),
    -1.0, q*(-0.2625*cos(b) + 0.077*cos(c)));
  return flagTurn(normalize(cross(dv, du)));
}
`;

function animate(material, time) {
  if (material.userData.threeFlagsWave) return material;
  material.userData.threeFlagsWave = true;
  const previous = material.onBeforeCompile, key = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms.uFlagTime = time;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + WAVE_GLSL)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = flagPoint();')
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal = flagNormal();');
  };
  material.customProgramCacheKey = () => key + '|three-flags-wave-v1';
  return material;
}

export function createFlagMaterials(ctx) {
  // The unique factory key keeps this patch local to these three textiles.
  const cloth = ctx.mat.toon('#ffffff', { name: 'three-flags-cloth', vertexColors: true, side: 'double', paint: 0.015 });
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
  const distance = new THREE.MeshDistanceMaterial({ side: THREE.DoubleSide });
  for (const m of [cloth, depth, distance]) animate(m, ctx.shared.uTime);
  return { cloth, depth, distance };
}
