// landmarksSmolensky/floor.js - the FOREST FLOOR of the cemetery (docs/research/smolensky-detail.md 5.1, 7.4; photos sd062 sd211 sd204 sd302 sd098 sd103): replaces the single camouflage decal by a splat of four tiling textures
// (leaf litter with orange top leaves, a goutweed carpet with white umbels, moss and fern shade, a mown lawn) under one coarse mask (1 texel per 3 m, R goutweed, G litter, B moss / fern, A lawn) blended in the
// fragment shader with a height-style break-up (the textures' own luminance sharpens the transitions, so the patches have leaf-shaped edges, not gradients).  ONE mesh, ONE material, the same one draw call as the decal.
// The mask follows the zones of place2.js: mown lawn round the Smolensk church and in the lot of the Resurrection church, goutweed in the old quarters, bare litter in the newer rows and the cleared strip behind
// the Maly / Beringa fence.  Alley verges (path-edge strips with a ragged grass edge) are laid by verges() as cut-out ribbons along the mapped ways.
import * as THREE from 'three';
import { CH, RE } from './frame.js';
import { zoneAt } from './place2.js';
import { hash2 } from './util.js';

const TAU = Math.PI * 2;
/** stamp a shape at (x, y) and at the wrapped offsets that touch the tile edge (seamless tiles) */
function stamp(g, w, h, x, y, rad, f) { for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { if (x + ox + rad < 0 || x + ox - rad > w || y + oy + rad < 0 || y + oy - rad > h) continue; f(x + ox, y + oy); } }
const leafPath = (g, x, y, rx, ry, rot) => { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.moveTo(0, ry); g.bezierCurveTo(-rx, ry * 0.3, -rx * 0.8, -ry * 0.8, 0, -ry); g.bezierCurveTo(rx * 0.8, -ry * 0.8, rx, ry * 0.3, 0, ry); g.fill(); g.restore(); };

export function makeFloorTextures(ctx) {
  const D = (w, h, fn, key) => ctx.tex.draw(w, h, fn, { key: 'lmsmol-floor-' + key, repeat: [1, 1], anisotropy: 8 });
  const rnd = (s) => ctx.rng('lmsmol-floor-' + s);
  const litter = D(512, 512, (g, w, h) => {                                          // dead leaves of maple, lime, birch and ash over dark soil, twigs, a few sprouts (tile 3.1 m)
    const r = rnd('litter'); g.fillStyle = '#4a3022'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? 'rgba(40,24,16,0.5)' : 'rgba(110,76,52,0.35)'; const x = r() * w, y = r() * h, rr = 14 + r() * 40; stamp(g, w, h, x, y, rr, (a, b) => { g.beginPath(); g.ellipse(a, b, rr, rr * 0.7, r() * 3, 0, TAU); g.fill(); }); }
    const cols = ['#644432', '#3a2518', '#7a5a3a', '#8a5c34', '#5a4630', '#936f5e', '#a8782e', '#c8782a', '#d8b040', '#4a3a28'], wts = [14, 14, 12, 10, 12, 8, 6, 5, 3, 10];
    const tot = wts.reduce((s, q) => s + q, 0);
    for (let i = 0; i < 900; i++) {
      let a = r() * tot, k = 0; while (a > wts[k]) { a -= wts[k]; k++; } g.fillStyle = cols[k];
      const x = r() * w, y = r() * h, rx = 6 + r() * 11, ry = 9 + r() * 15, rot = r() * TAU; stamp(g, w, h, x, y, ry, (px, py) => leafPath(g, px, py, rx, ry, rot));
      if (r() < 0.25) { g.strokeStyle = 'rgba(30,20,12,0.5)'; g.lineWidth = 1.2; stamp(g, w, h, x, y, ry, (px, py) => { g.save(); g.translate(px, py); g.rotate(rot); g.beginPath(); g.moveTo(0, ry); g.lineTo(0, -ry * 0.8); g.stroke(); g.restore(); }); }
    }
    for (let i = 0; i < 40; i++) { g.strokeStyle = r() < 0.5 ? '#3a2a1c' : '#6a5238'; g.lineWidth = 1.5 + r() * 2; const x = r() * w, y = r() * h, a = r() * TAU, l = 20 + r() * 50; stamp(g, w, h, x, y, l, (px, py) => { g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); g.stroke(); }); }
    for (let i = 0; i < 26; i++) { g.fillStyle = '#6c8b54'; const x = r() * w, y = r() * h; stamp(g, w, h, x, y, 10, (px, py) => leafPath(g, px, py, 4, 8, r() * TAU)); }
  }, 'litter');
  const gout = D(512, 512, (g, w, h) => {                                            // goutweed (Aegopodium) from above: layered light-green leaflets, white umbels (tile 2.3 m)
    const r = rnd('gout'); g.fillStyle = '#2f4a20'; g.fillRect(0, 0, w, h);
    const layer = (n, cols, rx, ry) => { for (let i = 0; i < n; i++) { const x = r() * w, y = r() * h, rot = r() * TAU, c = cols[(r() * cols.length) | 0]; g.fillStyle = c; for (let j = 0; j < 3; j++) { const a = rot + j * 2.1 + (r() - 0.5) * 0.4, ox = Math.cos(a) * ry * 0.9, oy = Math.sin(a) * ry * 0.9; stamp(g, w, h, x + ox, y + oy, ry * 1.2, (px, py) => leafPath(g, px, py, rx, ry, a + Math.PI / 2)); } } };
    layer(110, ['#44622a', '#50702f', '#3a5826'], 20, 30); layer(150, ['#648a40', '#74964a', '#5f8238'], 19, 28); layer(150, ['#86aa58', '#96b868', '#74964a'], 18, 26); layer(90, ['#b0cf86', '#a2c47a', '#92b46a'], 16, 24);
    g.strokeStyle = 'rgba(40,70,30,0.5)'; g.lineWidth = 1.2;
    for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(236,244,226,0.95)'; const x = r() * w, y = r() * h; stamp(g, w, h, x, y, 12, (px, py) => { for (let k = 0; k < 8; k++) { g.beginPath(); g.arc(px + (r() - 0.5) * 18, py + (r() - 0.5) * 18, 1.8, 0, TAU); g.fill(); } }); }
  }, 'goutweed');
  const moss = D(256, 256, (g, w, h) => {                                            // moss felt, rotting leaves and fern shade (tile 2.7 m)
    const r = rnd('moss'); g.fillStyle = '#4a6030'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { g.fillStyle = ['#83983e', '#6a7d2e', '#9aae4a', '#5a6a28', '#3d5226'][(r() * 5) | 0]; g.globalAlpha = 0.55 + r() * 0.4; const x = r() * w, y = r() * h, rr = 5 + r() * 16; stamp(g, w, h, x, y, rr, (px, py) => { g.beginPath(); g.ellipse(px, py, rr, rr * 0.6, r() * 3, 0, TAU); g.fill(); }); }
    g.globalAlpha = 1; for (let i = 0; i < 30; i++) { g.fillStyle = r() < 0.5 ? '#5a4632' : '#6c5238'; const x = r() * w, y = r() * h; stamp(g, w, h, x, y, 10, (px, py) => leafPath(g, px, py, 4 + r() * 4, 7 + r() * 6, r() * TAU)); }
    for (let i = 0; i < 12; i++) { g.strokeStyle = '#3d6a2e'; g.lineWidth = 2; const x = r() * w, y = r() * h, a = r() * TAU; stamp(g, w, h, x, y, 30, (px, py) => { g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + Math.cos(a) * 15, py + Math.sin(a) * 15 - 6, px + Math.cos(a) * 30, py + Math.sin(a) * 30); g.stroke(); }); }
  }, 'moss');
  const lawn = D(256, 256, (g, w, h) => {                                            // a mown lawn with clover and dandelions (tile 1.7 m)
    const r = rnd('lawn'); g.fillStyle = '#5c8a35'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.strokeStyle = ['#6f9a42', '#4f7a2a', '#7ba43f', '#648f30', '#46702a'][(r() * 5) | 0]; g.lineWidth = 1.3; const x = r() * w, y = r() * h, l = 3 + r() * 6, a = -Math.PI / 2 + (r() - 0.5) * 1.4; stamp(g, w, h, x, y, 10, (px, py) => { g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); g.stroke(); }); }
    for (let i = 0; i < 26; i++) { g.fillStyle = r() < 0.7 ? '#e8c21a' : '#f4f2ee'; const x = r() * w, y = r() * h; stamp(g, w, h, x, y, 4, (px, py) => { g.beginPath(); g.arc(px, py, 2 + r() * 1.5, 0, TAU); g.fill(); }); }
  }, 'lawn');
  return { litter, gout, moss, lawn };
}

/** the coarse mask over the polygon box: [x0, z0, x1, z1] -> DataTexture RGBA8 (1 texel per 3 m) */
export function makeMask(pl, box) {
  const S = 3, nx = Math.ceil((box[2] - box[0]) / S), nz = Math.ceil((box[3] - box[1]) / S), data = new Uint8Array(nx * nz * 4);
  const vn = (x, z, s, seed) => { const gx = Math.floor(x / s), gz = Math.floor(z / s), fx = x / s - gx, fz = z / s - gz, u = fx * fx * (3 - 2 * fx), w = fz * fz * (3 - 2 * fz); const q = (a, b) => hash2(gx + a, gz + b, seed); return (q(0, 0) * (1 - u) + q(1, 0) * u) * (1 - w) + (q(0, 1) * (1 - u) + q(1, 1) * u) * w; };
  const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const soft = (f, x, z, u0, u1, v0, v1, m) => { const q = f.M(x, z), du = Math.min(q.u - u0, u1 - q.u), dv = Math.min(q.v - v0, v1 - q.v); return ss(-m, m, Math.min(du, dv)); };
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = box[0] + (i + 0.5) * S, z = box[1] + (j + 0.5) * S, o = (j * nx + i) * 4;
    const zone = zoneAt(x, z), n1 = vn(x, z, 14, 5), n2 = vn(x, z, 28, 9), n3 = vn(x, z, 9, 13);
    let g = zone === 'C' ? 0.75 + 0.25 * n1 : zone === 'A' ? 0.5 + 0.4 * n1 : zone === 'B' ? 0.28 + 0.3 * n1 : 0.12 + 0.2 * n1;      // goutweed
    let l = zone === 'D' ? 0.9 : zone === 'B' ? 0.7 : 0.3 + 0.4 * (1 - n1);                                                          // litter
    let m = ss(0.55, 0.8, n2) * (zone === 'D' ? 0.4 : 0.9) + ss(0.7, 0.95, n3) * 0.3;                                                // moss / fern shade
    let a = Math.max(soft(RE, x, z, -3, 38, 27, 50, 4), soft(CH, x, z, -6, 50, -30, 30, 4) * 0.75);                                    // mown lawn: the church lot and the Smolensk church surroundings
    if (a > 0.05) { g *= 1 - a * 0.9; l *= 1 - a * 0.8; m *= 1 - a * 0.9; }
    data[o] = Math.min(255, g * 255) | 0; data[o + 1] = Math.min(255, l * 255) | 0; data[o + 2] = Math.min(255, m * 255) | 0; data[o + 3] = Math.min(255, a * 255) | 0;
  }
  const t = new THREE.DataTexture(data, nx, nz, THREE.RGBAFormat); t.colorSpace = THREE.NoColorSpace; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
  return { tex: t, box, S, nx, nz };
}

/** the splat material: toon, world-space tiles, blend by the mask with a luminance break-up */
export function makeFloorMaterial(ctx, mask, tiles) {
  const m = ctx.mat.toon('#ffffff', { name: 'lmsmol-floorSplat', paint: 0.03 });
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (shader, renderer) => {
    if (prev) prev.call(m, shader, renderer);
    shader.uniforms.uSplat = { value: mask.tex }; shader.uniforms.uBox = { value: new THREE.Vector4(mask.box[0], mask.box[1], 1 / (mask.nx * mask.S), 1 / (mask.nz * mask.S)) };
    shader.uniforms.uTL = { value: tiles.litter }; shader.uniforms.uTG = { value: tiles.gout }; shader.uniforms.uTM = { value: tiles.moss }; shader.uniforms.uTS = { value: tiles.lawn };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D uSplat, uTL, uTG, uTM, uTS; uniform vec4 uBox;')
      .replace('#include <map_fragment>', `
        { vec2 wp = vPWorld.xz;
          vec4 sp = texture2D( uSplat, ( wp - uBox.xy ) * uBox.zw );
          vec3 cL = texture2D( uTL, wp / 3.1 ).rgb, cG = texture2D( uTG, wp / 2.3 + 0.37 ).rgb, cM = texture2D( uTM, wp / 2.7 + 0.11 ).rgb, cS = texture2D( uTS, wp / 1.7 ).rgb;
          float wL = ( 0.15 + sp.g ) * ( 0.55 + dot( cL, vec3( 0.6 ) ) ), wG = sp.r * ( 0.35 + 1.6 * dot( cG, vec3( 0.33 ) ) ), wM = sp.b * ( 0.45 + 1.2 * dot( cM, vec3( 0.33 ) ) ), wS = sp.a * 1.6;
          wL = wL * wL; wG = wG * wG * wG; wM = wM * wM; wS = wS * wS;
          float ws = wL + wG + wM + wS + 1e-4;
          diffuseColor.rgb *= ( cL * wL + cG * wG + cM * wM + cS * wS ) / ws; }`);
  };
  m.customProgramCacheKey = () => 'paint|lmsmol-floor-splat';
  m.needsUpdate = true;
  return m;
}
