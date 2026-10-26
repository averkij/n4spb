// COPY of landmarksKarpovka/leafmat.js via landmarksOktyabrsky; used by landmarksAcademy for the foliage materials of trees.js.
// landmarksAcademy/ (copy of environment/leafmat.js - vertex-animated vegetation materials (wind sway from the shared uniforms) and the leaf-cluster cel shading. )
//   canopyMaterial(ctx)   trees / bushes / hedges: vertex colours x per-instance colour, wind sway, "leaf clump" highlights + shadows (worley cells
//                          in world space, hard-edged = anime foliage). Adapted from the Moscow sibling (100_3d_moscow_city/environment/trees.js).
//   tuftMaterial(ctx)     grass clumps / reeds: double-sided blades, strong sway from the tip.
// Both are ordinary ctx.mat.toon() materials with an onBeforeCompile patch (never merged: only used on InstancedMesh / noBatch meshes).
import * as THREE from 'three';

const LEAF_GLSL = /* glsl */`
vec3 fl_h3(vec3 p){ p = vec3(dot(p,vec3(127.1,311.7,74.7)), dot(p,vec3(269.5,183.3,246.1)), dot(p,vec3(113.5,271.9,124.6))); return fract(sin(p)*43758.5453123); }
vec2 fl_worley(vec3 p, out vec3 toF){
  vec3 ip = floor(p), fp = fract(p); float f1 = 8.0, f2 = 8.0; toF = vec3(0.0);
  for (int k = -1; k <= 1; k++) for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec3 b = vec3(float(i), float(j), float(k)); vec3 r = b + fl_h3(ip + b) * 0.8 + 0.1 - fp; float d = dot(r, r);
    if (d < f1) { f2 = f1; f1 = d; toF = r; } else if (d < f2) f2 = d;
  }
  return vec2(sqrt(f1), sqrt(f2));
}`;

const swayProject = (hk, amp) => /* glsl */`
vec4 mvPosition = vec4( transformed, 1.0 );
float swH = clamp( position.y * ${hk.toFixed(4)}, 0.0, 1.7 );
float swPh = 0.0;
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
  swPh = instanceMatrix[3].x * 0.31 + instanceMatrix[3].z * 0.17;
#endif
vec4 swW = modelMatrix * mvPosition;
{
  float g = 0.35 + 0.65 * uGust;
  float wv = sin( uTime * 1.35 + swPh ) * 0.6 + sin( uTime * 2.9 + swPh * 2.3 ) * 0.25 + 0.15;
  float k = swH * swH;
  vec2 d = uWind * ( 0.5 + 0.5 * wv ) * g * ${(0.05 * amp).toFixed(4)} * k;
  d += vec2( -uWind.y, uWind.x ) * sin( uTime * 3.7 + swPh * 1.7 ) * ${(0.011 * amp).toFixed(4)} * k;
  float fl = sin( uTime * 6.1 + dot( swW.xyz, vec3( 1.3, 2.1, 1.7 ) ) ) * ${(0.009 * amp).toFixed(4)} * g * k;
  swW.xz += d + vec2( fl, -fl );
  swW.y += fl * 0.5 - dot( d, d ) * 0.3;
}
mvPosition = viewMatrix * swW;
gl_Position = projectionMatrix * mvPosition;`;

/** wind sway (+ optional leaf-clump shading) on a toon material. o: { leaf: {scale, amount}, hk (height -> sway factor), amp } */
export function swayPatch(ctx, m, key, o = {}) {
  if (m.userData.envSway) return m;
  m.userData.envSway = true;
  const prev = m.onBeforeCompile, hk = o.hk ?? 0.07, amp = o.amp ?? 1, leaf = o.leaf || null;
  m.onBeforeCompile = (shader, renderer) => {
    if (prev) prev.call(m, shader, renderer);
    shader.uniforms.uTime = ctx.shared.uTime; shader.uniforms.uWind = ctx.shared.uWind; shader.uniforms.uGust = ctx.shared.uGust;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime; uniform vec2 uWind; uniform float uGust;')
      .replace('#include <project_vertex>', swayProject(hk, amp));
    if (leaf) {
      const sc = (1 / leaf.scale).toFixed(4), amt = leaf.amount.toFixed(3);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\n' + LEAF_GLSL)
        .replace('#include <color_fragment>', `#include <color_fragment>
        {
          vec3 q = vPWorld * ${sc};
          float fw = length(fwidth(q));
          float a = ${amt} * (1.0 - smoothstep(0.3, 0.8, fw));
          if (a > 0.001) {
            vec3 wq = q + vec3(sin(q.y * 1.7 + q.z * 1.3), sin(q.z * 1.9 + q.x * 1.1), sin(q.x * 1.5 + q.y * 1.2)) * 0.28;
            vec3 toF; vec2 w = fl_worley(wq, toF);
            vec3 cn = normalize(-toF + vec3(1e-4));
            float lit = dot(cn, normalize(vec3(-0.35, 1.0, 0.25)));
            float aa = clamp(fw * 1.2, 0.03, 0.3);
            float r1 = w.x;
            float hl = smoothstep(0.28 - aa, 0.28 + aa, lit) * smoothstep(0.16 - aa, 0.16 + aa, r1) * (1.0 - smoothstep(0.5 - aa, 0.5 + aa, r1));
            float sh = (1.0 - smoothstep(-0.32 - aa, -0.32 + aa, lit)) * smoothstep(0.3 - aa, 0.3 + aa, r1);
            float tone = (1.0 + 0.16 * hl) * (1.0 - 0.18 * sh);
            diffuseColor.rgb *= mix(1.0, tone, a);
          }
        }`);
    }
  };
  m.customProgramCacheKey = () => 'paint|env-sway|' + key;
  m.needsUpdate = true;
  return m;
}

/** the shared leaf-clump canopy material (vertex colours x instance colour, sway, leaf-cell shading) */
export function canopyMaterial(ctx) {
  return swayPatch(ctx, ctx.mat.toon('#ffffff', { vertexColors: true, paint: 0.035, name: 'env-canopy' }), 'canopy', { leaf: { scale: 0.3, amount: 1.0 }, hk: 0.07, amp: 1.5 });
}
/** conifer foliage: almost still, no leaf cells (the tiers are the pattern) */
export function coniferMaterial(ctx) {
  return swayPatch(ctx, ctx.mat.toon('#ffffff', { vertexColors: true, paint: 0.03, name: 'env-conifer' }), 'conifer', { hk: 0.05, amp: 0.5 });
}
/** bare / bark meshes that must follow the crown's sway */
export function trunkMaterial(ctx, map, name) {
  return swayPatch(ctx, ctx.mat.toon('#ffffff', { map, paint: 0.05, name }), 'trunk-' + name, { hk: 0.07, amp: 1.5 });
}
/** grass blades / reeds: vertex colours x instance colour, double sided, sway grows with the square of the height */
export function tuftMaterial(ctx, name = 'env-tuft') {
  return swayPatch(ctx, ctx.mat.toon('#ffffff', { vertexColors: true, side: 'double', paint: 0.0, name }), 'tuft-' + name, { hk: 1.4, amp: 2.2 });
}
void THREE;
