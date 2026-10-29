// PROVENANCE: copied verbatim from src/world/landmarksSmolensky/gravemat.js of this repository (itself copied from the source project 102_3d_piter, commit 0568f7af); only the texture / material / mesh name prefix lmsmol- became lmdek- (the texture cache is scene-wide) and the module name in the log lines. The header below is the original one.
// landmarksSmolensky/gravemat.js - the shared geometries and the two atlas materials of the detailed grave field (gravefield.js; atlas.js holds the sheet).
// Six unit geometries (every grave, tomb, fence, cross, flower bunch and plant card of the cemetery is an instance of one of them: no mesh per archetype):
//   slab   box x -0.5..0.5, y 0..1, z -0.5..0.5, no bottom (10 triangles): stelae, kerbs, plinths, tubs, tomb bodies;  front / back faces carry the FACE region of the stone cell, sides and top the STRIP
//   taper  frustum of the unit box (top scale 0.62, 10 triangles): obelisk shafts, chamfered stele tops, boulders, sarcophagus lids      pyr  four-sided pyramid (4 triangles): corner posts, roofs, caps
//   shaft  an eight-sided column (16 triangles: columns, urns, piers)                                                                 cross two crossing alpha quads (the second is the 14 % stem strip, so a cross seen edge-on is a thin post)
//   panel  one alpha quad x -0.5..0.5, y 0..1, double sided (fence panels, lattices, grilles, flat bed fills lying down, plant cards, bouquets)
// Materials: `stone` (opaque, layer 0: R = grain x the instance tint, G = engraving drawn light, B = moss / lichen) and `cut` (alpha cut-outs, colour x tint, alpha-to-coverage, no outline pass).
// Per-instance data: instanceMatrix, instanceColor (tint) and the vec4 attribute aCell = the atlas rectangle (u0, v0, du, dv).
import * as THREE from 'three';
import { FACE, STRIP } from './atlas.js';

const mk = (pos, nrm, uv, idx) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere(); return g; };
const fu = (u) => FACE[0] + u * FACE[2], fv = (v) => FACE[1] + v * FACE[3], su = (u) => STRIP[0] + u * STRIP[2], sv = (v) => STRIP[1] + v * STRIP[3];

function quadInto(a, p, n, uv, flipWind = false) {                         // p: 4 corners (counter-clockwise seen from the normal side), uv: 4 pairs
  const base = a.pos.length / 3;
  for (let i = 0; i < 4; i++) { a.pos.push(...p[i]); a.nrm.push(...n); a.uv.push(uv[i][0], uv[i][1]); }
  a.idx.push(base, base + 1, base + 2, base, base + 2, base + 3); void flipWind;
}
const acc = () => ({ pos: [], nrm: [], uv: [], idx: [] });

export function makeGeos() {
  // ---- slab: front (+z) and back (-z) FACE region, left / right / top STRIP region
  const s = acc();
  quadInto(s, [[-0.5, 0, 0.5], [0.5, 0, 0.5], [0.5, 1, 0.5], [-0.5, 1, 0.5]], [0, 0, 1], [[fu(0), fv(0)], [fu(1), fv(0)], [fu(1), fv(1)], [fu(0), fv(1)]]);
  quadInto(s, [[0.5, 0, -0.5], [-0.5, 0, -0.5], [-0.5, 1, -0.5], [0.5, 1, -0.5]], [0, 0, -1], [[fu(0), fv(0)], [fu(1), fv(0)], [fu(1), fv(1)], [fu(0), fv(1)]]);
  quadInto(s, [[-0.5, 0, -0.5], [-0.5, 0, 0.5], [-0.5, 1, 0.5], [-0.5, 1, -0.5]], [-1, 0, 0], [[su(0), sv(0)], [su(1), sv(0)], [su(1), sv(1)], [su(0), sv(1)]]);
  quadInto(s, [[0.5, 0, 0.5], [0.5, 0, -0.5], [0.5, 1, -0.5], [0.5, 1, 0.5]], [1, 0, 0], [[su(0), sv(0)], [su(1), sv(0)], [su(1), sv(1)], [su(0), sv(1)]]);
  quadInto(s, [[-0.5, 1, 0.5], [0.5, 1, 0.5], [0.5, 1, -0.5], [-0.5, 1, -0.5]], [0, 1, 0], [[su(0), sv(0)], [su(1), sv(0)], [su(1), sv(1)], [su(0), sv(1)]]);
  const slab = mk(s.pos, s.nrm, s.uv, s.idx);
  // ---- taper: the four sloping sides (FACE) and a top (STRIP)
  const K = 0.62, t = acc(), k2 = K / 2, sl = 0.5 - k2;                    // slope: dx = sl over dy = 1
  const side = (a, b, c, d, n) => { const l = Math.hypot(...n); quadInto(t, [a, b, c, d], n.map((q) => q / l), [[fu(0), fv(0)], [fu(1), fv(0)], [fu(1), fv(1)], [fu(0), fv(1)]]); };
  side([-0.5, 0, 0.5], [0.5, 0, 0.5], [k2, 1, k2], [-k2, 1, k2], [0, sl, 1]);
  side([0.5, 0, -0.5], [-0.5, 0, -0.5], [-k2, 1, -k2], [k2, 1, -k2], [0, sl, -1]);
  side([-0.5, 0, -0.5], [-0.5, 0, 0.5], [-k2, 1, k2], [-k2, 1, -k2], [-1, sl, 0]);
  side([0.5, 0, 0.5], [0.5, 0, -0.5], [k2, 1, -k2], [k2, 1, k2], [1, sl, 0]);
  quadInto(t, [[-k2, 1, k2], [k2, 1, k2], [k2, 1, -k2], [-k2, 1, -k2]], [0, 1, 0], [[su(0), sv(0)], [su(1), sv(0)], [su(1), sv(1)], [su(0), sv(1)]]);
  const taper = mk(t.pos, t.nrm, t.uv, t.idx);
  // ---- pyr: apex (0, 1, 0)
  const p = acc(), tri = (a, b, c, n) => { const l = Math.hypot(...n), base = p.pos.length / 3; for (const [q, uv] of [[a, [0, 0]], [b, [1, 0]], [c, [0.5, 1]]]) { p.pos.push(...q); p.nrm.push(n[0] / l, n[1] / l, n[2] / l); p.uv.push(fu(uv[0]), fv(uv[1])); } p.idx.push(base, base + 1, base + 2); };
  tri([-0.5, 0, 0.5], [0.5, 0, 0.5], [0, 1, 0], [0, 0.5, 1]); tri([0.5, 0, -0.5], [-0.5, 0, -0.5], [0, 1, 0], [0, 0.5, -1]);
  tri([-0.5, 0, -0.5], [-0.5, 0, 0.5], [0, 1, 0], [-1, 0.5, 0]); tri([0.5, 0, 0.5], [0.5, 0, -0.5], [0, 1, 0], [1, 0.5, 0]);
  const pyr = mk(p.pos, p.nrm, p.uv, p.idx);
  // ---- shaft: an eight-sided column (bottom r 0.5, top r 0.43, open ends: the capitals and bases are slabs)
  const sh = acc(), NS = 8;
  for (let i = 0; i < NS; i++) {
    const a0 = i / NS * Math.PI * 2, a1 = (i + 1) / NS * Math.PI * 2, am = (a0 + a1) / 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), r0 = 0.5, r1 = 0.43;
    const base = sh.pos.length / 3, n = [Math.cos(am), 0.07, Math.sin(am)], l = Math.hypot(...n);
    sh.pos.push(c0 * r0, 0, s0 * r0, c1 * r0, 0, s1 * r0, c1 * r1, 1, s1 * r1, c0 * r1, 1, s0 * r1);
    for (let k = 0; k < 4; k++) sh.nrm.push(n[0] / l, n[1] / l, n[2] / l);
    sh.uv.push(fu(i / NS), fv(0), fu((i + 1) / NS), fv(0), fu((i + 1) / NS), fv(1), fu(i / NS), fv(1));
    sh.idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
  }
  const shaft = mk(sh.pos, sh.nrm, sh.uv, sh.idx);
  // ---- cross: plane A (full cell) and plane B (the stem strip, 14 % wide, turned 90 degrees)
  const c = acc();
  quadInto(c, [[-0.5, 0, 0], [0.5, 0, 0], [0.5, 1, 0], [-0.5, 1, 0]], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  quadInto(c, [[0, 0, 0.07], [0, 0, -0.07], [0, 1, -0.07], [0, 1, 0.07]], [1, 0, 0], [[0.43, 0], [0.57, 0], [0.57, 1], [0.43, 1]]);
  const cross = mk(c.pos, c.nrm, c.uv, c.idx);
  // ---- panel
  const q = acc(); quadInto(q, [[-0.5, 0, 0], [0.5, 0, 0], [0.5, 1, 0], [-0.5, 1, 0]], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  const panel = mk(q.pos, q.nrm, q.uv, q.idx);
  return { slab, taper, pyr, shaft, cross, panel, tris: { slab: 10, taper: 10, pyr: 4, shaft: 16, cross: 4, panel: 2 } };
}

/** the instanced-atlas patch: aCell moves the uv into the atlas rectangle; 'stone' builds the colour from grain x tint + engraving + moss */
function patch(ctx, m, mode) {
  // n4spb change (landmarksDekabristov): ctx.mat.toon caches by its options, so the Lutheran and the Armenian grave field get the SAME material object; patching it twice would declare `attribute vec4 aCell` twice
  // (a GLSL error on the GPU): the patch is applied once
  if (m.userData.dekGravePatch) return m;
  m.userData.dekGravePatch = true;
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (shader, renderer) => {
    if (prev) prev.call(m, shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 aCell;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv = aCell.xy + uv * aCell.zw;\n#endif');
    if (mode === 'stone') {
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <map_fragment>', 'vec4 gt = texture2D( map, vMapUv );\n diffuseColor.rgb *= gt.rrr;')
        .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.88, 0.88, 0.84 ), gt.g * 0.8 );\n diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.40, 0.50, 0.17 ), gt.b * 0.7 );');
    }
  };
  m.customProgramCacheKey = () => 'paint|lmdek-atlas-' + mode;
  m.needsUpdate = true;
  void ctx;
  return m;
}

export function makeGraveMats(ctx, atlas) {
  const stone = patch(ctx, ctx.mat.toon('#ffffff', { map: atlas.tex, paint: 0.03, name: 'lmdek-graveStone' }), 'stone');
  const cut = patch(ctx, ctx.mat.toon('#ffffff', { map: atlas.tex, paint: 0.02, side: 'double', alphaTest: 0.42, name: 'lmdek-graveCut' }), 'cut');
  cut.alphaToCoverage = true;
  return { stone, cut };
}
