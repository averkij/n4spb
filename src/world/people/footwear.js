import * as THREE from 'three';

// The ankle is the joint origin, +Z points towards the toe. The perimeter
// points give the last a heel seat, waist, ball and toe spring. Dimensions in cm.
const outsole = [
  [2.9, -9, -6.8], [3.9, -8.5, 4.1], [5.15, -9, 11.9], [3.6, -8.7, 17.8],
  [0, -8.1, 20], [-3.6, -8.7, 17.8], [-5.15, -9, 11.9], [-3.9, -8.5, 4.1], [-2.9, -9, -6.8],
];
const styles = {
  sneaker: { id: 0, width: 1, collar: 2.8, instep: 2.6, vamp: -3.1 },
  flat: { id: 1, width: .91, collar: 2.5, instep: 2.1, vamp: -4.1 },
  sandal: { id: 2, width: .93, collar: 2.8, instep: 1.8, vamp: -4.5 },
  boot: { id: 3, width: 1.04, collar: 3.0, instep: 3.6, vamp: -2.5 },
};

export function footwearGeometry(kind) {
  const { id, width, collar, instep, vamp } = styles[kind];
  const vertices = [...outsole, [3.05, collar, -4.2], [3.25, instep, 2.3], [2.9, vamp, 13.6],
    [-2.9, vamp, 13.6], [-3.25, instep, 2.3], [-3.05, collar, -4.2]];
  const faces = [], anchors = [9, 10, 11, 11, 12, 12, 13, 14, 14];
  for (let i = 0; i < outsole.length; i++) {
    const next = (i + 1) % outsole.length;
    faces.push(next, i, anchors[i]);
    if (anchors[i] !== anchors[next]) faces.push(next, anchors[i], anchors[next]);
  }
  faces.push(13, 12, 11, 13, 11, 10);
  faces.push(9, 13, 10, 9, 14, 13);
  // A separate bottom ring keeps the tread flat-shaded and the upper rounded.
  const base = vertices.length;
  vertices.push(...outsole);
  for (let i = 1; i < outsole.length - 1; i++) faces.push(base, base + i, base + i + 1);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices.flatMap(([x,y,z]) => [x * width / 100, y / 100, z / 100]), 3));
  geo.setAttribute('aStyle', new THREE.Float32BufferAttribute(vertices.map(() => id), 1));
  geo.setIndex(faces);
  geo.computeVertexNormals();
  return geo;
}

// A single instanced toon material for every shoe. Welt, leather quarters,
// straps and laces follow the shoe coordinates; the palette travels with each
// person. No separate lace meshes, textures or additional passes.
export function footwearMaterial(ctx) {
  const key = 'ppl-footwear';
  if (ctx.mat.cache.has(key)) return ctx.mat.cache.get(key);
  const material = new THREE.MeshToonMaterial({ gradientMap: ctx.mat.gradientMap });
  material.name = key;
  material.onBeforeCompile = shader => {
    const varying = 'varying vec3 footCM, upperTint, soleTint, skinTint; varying float shoeStyle;';
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
      attribute vec3 iA, iB, iC, iD; attribute float aStyle; ${varying}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        footCM = position * 100.;
        // The A channel marks the left shoe. Move the big-toe tip towards
        // the instep and mirror the strap pattern on the opposite foot.
        float medial = 1. - 2. * iA.r;
        transformed.x += medial * .007 * smoothstep(.10, .20, position.z);
        footCM.x *= medial;
        upperTint = iB; soleTint = iC; skinTint = iD; shoeStyle = aStyle;`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      ${varying}
      float edge(float value) {
        float w = max(fwidth(value), .045);
        return smoothstep(-w, w, value);
      }`).replace('#include <color_fragment>', `#include <color_fragment>
        float x = abs(footCM.x), y = footCM.y, z = footCM.z;
        float toe = smoothstep(12., 20., z);
        float arch = 1. - smoothstep(0., 6., abs(z - 4.1));
        float bed = -9. + .9 * toe + .5 * arch;
        float thickness = shoeStyle < .5 ? 2.1 : (shoeStyle > 2.5 ? 1.9 : 1.05);
        float upper = edge(y - bed - thickness);
        vec3 leather = upperTint;
        if (shoeStyle < .5 || shoeStyle > 2.5) {
          float tongue = edge(2.35 - x) * edge(z + .3) * edge(9.4 - z);
          leather *= 1. - .22 * tongue;
          float panel = edge(x - 2.65) * edge(6.0 - z) * edge(z + 4.2);
          leather *= 1. - .17 * panel;
          // Three pairs of chevrons close the tongue above the sloping vamp.
          float gap = abs(mod(z - .38 * x + .7, 2.5) - 1.25);
          float laces = tongue * edge(.27 - gap) * edge(z - .5) * edge(9.1 - z);
          vec3 thread = mix(upperTint, shoeStyle < .5 ? vec3(.70) : vec3(.40,.32,.24), .65);
          leather = mix(leather, thread, laces);
          float toeCap = edge(z - 13.2 + .24 * x);
          leather *= 1. - .12 * toeCap;
        } else {
          // A low-cut throat on the leather slip-on; two separate straps over
          // the visible foot and a heel sling on the open summer sandal.
          float throat = edge(7.4 - z) * edge(y + 4.6 - .17 * x - .72 * max(z - 1., 0.));
          if (shoeStyle < 1.5) leather = mix(leather, skinTint, throat);
          else {
            float straps = max(edge(1.05 - abs(z - 3.8 + .36 * footCM.x)),
              edge(1.05 - abs(z - 11.7 - .17 * footCM.x)));
            float sling = edge(-2.7 - z) * edge(y + 3.5) * edge(-.5 - y);
            leather = mix(skinTint, leather, max(straps, sling));
          }
        }
        vec3 rubber = soleTint * mix(.57, .94, edge(y - bed - .48));
        diffuseColor.rgb *= mix(rubber, leather, upper);
      `);
  };
  material.customProgramCacheKey = () => key;
  ctx.mat.cache.set(key, material);
  return material;
}
