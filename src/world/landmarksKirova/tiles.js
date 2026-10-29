// landmarksKirova/tiles.js - ONE material kind for every repeating wall painting of the module (draw-call account, 2026-10-10).
// Why: the engine batches by material KIND; a tiled canvas texture (uv beyond 0..1) cannot be atlased, so each of the 17 wall paintings of the Palace and the 4 of the Erarta facade was a kind of its
// own (x cells x size classes = the +50 .. +60 calls of the postcard poses).  Here every tile lives in ONE atlas texture and a patched MeshToonMaterial (same cel light, shadows, fog, paint noise as
// ctx.mat.toon) repeats it per fragment: fract(uv) inside the tile rectangle, textureGrad with the gradient of the CONTINUOUS uv (no seam, trilinear / anisotropic), a 16 px wrap border round every tile
// and a fade to the mean colour of the tile at strong minification (no bleed of the neighbour tiles at distance).
// How the geometry says which tile: a TILE HANDLE (plain object, the `material` that the code of the module passes to Parts.quad / box / cap / tube) carries `tileCol` = the vertex colour that Parts
// writes for every vertex of its bucket: the MEAN COLOUR of the tile (linear) with the tile id in the fraction of the blue channel (b * 255 = B8 + (id + 0.5) / 64).  The far-distance proxies of core/batch2.js
// (one vertex-coloured mesh per sector) therefore paint the tile's mean colour, and the shader decodes the id.  Parts.build() merges the buckets of all handles of one base material into one mesh.
// Two bases: `opaque` (walls, glass paintings of the windows) and `cut` (alpha cut-out, double sided: the iron fence).  uv stays in tile units exactly as before (u, v in repeats).
import * as THREE from 'three';

const PAD = 16, MAXID = 32;

/** mean colour of a canvas texture as LINEAR rgb (a 4 x 4 downscale, like core/batch2.js avgOf); white when the canvas cannot be read (node harness) */
function meanOf(img) {
  try {
    const c = document.createElement('canvas'); c.width = 4; c.height = 4; const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0, 4, 4); const d = g.getImageData(0, 0, 4, 4).data; let r = 0, gg = 0, b = 0, a = 0;
    for (let i = 0; i < 16; i++) { r += d[i * 4]; gg += d[i * 4 + 1]; b += d[i * 4 + 2]; a += d[i * 4 + 3]; }
    const lin = (v) => { v /= 255 * 16; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    if (a > 0 || r + gg + b > 0) return [lin(r), lin(gg), lin(b)];
  } catch (e) { /* unreadable */ }
  return [0.5, 0.5, 0.5];
}

/** encode (mean colour, id) into the vertex colour of a tile (see the header) */
function encode(mean, id) {
  const b8 = Math.max(0, Math.min(254, Math.round(mean[2] * 255)));
  return [Math.round(mean[0] * 255) / 255, Math.round(mean[1] * 255) / 255, (b8 + (id + 0.5) / 64) / 255];
}

/** shelf packing of the tiles (tallest first) into an atlas canvas of width 2048; every tile is drawn 3 x 3 times (wrap border) */
function pack(list) {
  const W = 2048, order = [...list].sort((a, b) => b.h - a.h || b.w - a.w);
  let x = 0, y = 0, shelf = 0;
  for (const t of order) {
    const w = t.w + 2 * PAD, h = t.h + 2 * PAD;
    if (x + w > W) { x = 0; y += shelf; shelf = 0; }
    t.px = x + PAD; t.py = y + PAD; x += w; shelf = Math.max(shelf, h);
  }
  const H = Math.max(256, Math.ceil((y + shelf) / 256) * 256);
  return { W, H };
}

/**
 * defs: { key: texture } for the opaque base, cutDefs: { key: texture } for the alpha-cut base.
 * returns { h: { key: handle }, opaque, cut, atlasPx }
 */
export function makeTiles(ctx, defs, cutDefs = {}, o = {}, decDefs = {}) {
  const make = (set, name, cut, po = 0) => {
    const keys = Object.keys(set); if (keys.length > MAXID) throw new Error('tiles: too many tiles for ' + name);
    const list = keys.map((k) => { const d = set[k], t = d.tex || d, img = t.image; return { key: k, tex: t, emis: d.emis || 0, img, w: img.width, h: img.height }; });
    const { W, H } = pack(list);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    for (const t of list) {
      try {
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {                                        // the wrap border: the tile repeated around itself, clipped to the padded rectangle
          g.save(); g.beginPath(); g.rect(t.px - PAD, t.py - PAD, t.w + 2 * PAD, t.h + 2 * PAD); g.clip();
          g.drawImage(t.img, t.px + i * t.w, t.py + j * t.h, t.w, t.h); g.restore();
        }
      } catch (e) { /* node harness */ }
    }
    const atlas = new THREE.CanvasTexture(cv); atlas.colorSpace = THREE.SRGBColorSpace; atlas.anisotropy = 8; atlas.generateMipmaps = true; atlas.minFilter = THREE.LinearMipmapLinearFilter; atlas.magFilter = THREE.LinearFilter;
    atlas.wrapS = atlas.wrapT = THREE.ClampToEdgeWrapping; atlas.needsUpdate = true;
    const emis = new Array(MAXID).fill(0), rect = Array.from({ length: MAXID }, () => new THREE.Vector4(0, 0, 1, 1)), mean = Array.from({ length: MAXID }, () => new THREE.Vector3(0.5, 0.5, 0.5)), size = Array.from({ length: MAXID }, () => new THREE.Vector2(128, 128));
    const handles = {};
    list.forEach((t, id) => {
      rect[id].set(t.px / W, 1 - (t.py + t.h) / H, t.w / W, t.h / H); size[id].set(t.w, t.h); emis[id] = t.emis;
      const m = meanOf(t.img); mean[id].set(m[0], m[1], m[2]);
      handles[t.key] = { isTileHandle: true, name: 'lmKir-tile-' + t.key, transparent: false, tileCol: encode(m, id), tileId: id, tileBase: null };
    });
    const m = ctx.mat.toon('#ffffff', { vertexColors: true, paint: o.paint ?? 0.04, name: 'lmKir-' + name, side: cut ? 'double' : 'front', alphaTest: cut ? 0.5 : 0, polygonOffset: po });
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = (shader, renderer) => {
      if (prev) prev.call(m, shader, renderer);
      Object.assign(shader.uniforms, { uAtlas: { value: atlas }, uRect: { value: rect }, uMean: { value: mean }, uTsz: { value: size }, uEmis: { value: emis } });
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vTUv;')
        .replace('#include <fog_vertex>', '#include <fog_vertex>\nvTUv = uv;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>
          varying vec2 vTUv; uniform sampler2D uAtlas; uniform vec4 uRect[${MAXID}]; uniform vec3 uMean[${MAXID}]; uniform vec2 uTsz[${MAXID}]; uniform float uEmis[${MAXID}]; int gTi = 0;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
          { int ti = int(floor(fract(vColor.b * 255.0) * 64.0)); gTi = ti;
            vec4 rc = uRect[ti]; vec2 sz = uTsz[ti];
            vec2 gx = dFdx(vTUv), gy = dFdy(vTUv);
            vec4 tc = textureGrad(uAtlas, rc.xy + fract(vTUv) * rc.zw, gx * rc.zw, gy * rc.zw);
            float lod = log2(max(max(length(gx * sz), length(gy * sz)), 1e-5));
            diffuseColor.rgb = mix(tc.rgb, uMean[ti], smoothstep(3.5, 5.5, lod));
            ${cut ? 'diffuseColor.a *= tc.a;' : ''} }`)
        .replace('#include <color_fragment>', '')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>' + String.fromCharCode(10) + 'totalEmissiveRadiance += diffuseColor.rgb * uEmis[gTi];');
    };
    m.customProgramCacheKey = () => 'lmKirTiles' + (cut ? 'C' : 'O');            // (the decal base runs the same code as the opaque one: polygonOffset is not part of the program)
    for (const h of Object.values(handles)) h.tileBase = m;
    return { handles, base: m, atlas, px: W * H };
  };
  const a = make(defs, 'tiles', false), b = Object.keys(cutDefs).length ? make(cutDefs, 'tilesCut', true) : null, c = Object.keys(decDefs).length ? make(decDefs, 'tilesDecal', false, -3) : null;
  return { h: { ...a.handles, ...(b ? b.handles : {}), ...(c ? c.handles : {}) }, opaque: a.base, cut: b ? b.base : null, dec: c ? c.base : null, atlasPx: a.px + (b ? b.px : 0) + (c ? c.px : 0) };
}
