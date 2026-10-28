// landmarksMakarova/tiles.js - COPY of landmarksKirova/tiles.js (modules never import each other), generalised to any number of tile sets: ONE material kind per set for every repeating wall painting
// of the module (draw-call account, 2026-10-10).
// Why: the engine batches by material KIND; a tiled canvas texture (uv beyond 0..1) cannot be atlased, so each of the ~35 stucco / granite / frieze paintings was a kind of its own (x 48 m cells x size
// classes x shadow flag = the +45 .. +63 calls of the postcard poses).  Here the paintings of a set live in ONE atlas texture (at most 40 per set: 3 uniform vectors each) and a patched MeshToonMaterial (same cel light, shadows,
// fog, paint noise as ctx.mat.toon) repeats the tile per fragment: fract(uv) inside the tile rectangle, textureGrad with the gradient of the CONTINUOUS uv (no seam, trilinear / anisotropic), a 16 px wrap
// border round every tile and a fade to the mean colour of the tile at strong minification (no bleed of the neighbour tiles at distance).
// How the geometry says which tile: a TILE HANDLE (plain object, the `material` that the code of the module passes to Parts.quad / box / cap / tube) carries `tileCol` = the vertex colour that Parts writes
// for every vertex of its bucket: the MEAN COLOUR of the tile (linear) with the tile id in the fraction of the blue channel (b * 255 = B8 + (id + 0.5) / 64).  The far-distance proxies of core/batch2.js
// (one vertex-coloured mesh per sector) therefore paint the tile's mean colour, and the shader decodes the id.  parts.js merges the buckets of all handles of one base material into one mesh.
// A set is { name, defs: { key: texture | { tex, emis, paint } }, cut?: alpha cut-out (double sided), po?: polygonOffset }; paint = the paint amount of the tile (default o.paint), a per-tile factor of the base paint.  uv stays in tile units exactly as before (u, v in repeats).
import * as THREE from 'three';

const PAD = 16, MAXID = 40;

/** mean colours of the tile images as LINEAR rgb: every image is downscaled to 16 x 16 (smoothing quality high), the samples are converted to linear and averaged (the GPU mip chain averages in linear light,
 *  an average of the sRGB values would come out too light); ONE getImageData of a sheet of all of them.  Mid grey when the canvases cannot be read (node harness).  The first read-back also forces the raster
 *  work of every painting (drawn lazily by the canvas): that cost moves from the first render into the build of the module. */
function meansOf(imgs) {
  const out = imgs.map(() => [0.5, 0.5, 0.5]), N = 16;
  try {
    const c = document.createElement('canvas'); c.width = N; c.height = N * imgs.length; const g = c.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    imgs.forEach((im, i) => g.drawImage(im, 0, i * N, N, N));
    const d = g.getImageData(0, 0, N, N * imgs.length).data, lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    imgs.forEach((im, i) => { let r = 0, gg = 0, bb = 0, a = 0; for (let k = 0; k < N * N; k++) { const o = (i * N * N + k) * 4; r += lin(d[o]); gg += lin(d[o + 1]); bb += lin(d[o + 2]); a += d[o + 3]; } if (a > 0) out[i] = [r / (N * N), gg / (N * N), bb / (N * N)]; });
  } catch (e) { /* unreadable */ }
  return out;
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
 * sets: [{ name, defs, cut, po }]; o.paint = the paint amount of every base (default 0.03); o.prefix = material name prefix.
 * returns { h: { key: handle }, bases: { name: material }, atlasPx }
 */
export function makeTiles(ctx, sets, o = {}) {
  const prefix = o.prefix || 'lmMak-';
  const make = (set) => {
    const { name, defs, cut = false, po = 0 } = set, keys = Object.keys(defs);
    if (keys.length > MAXID) throw new Error('tiles: too many tiles for ' + name);
    const list = keys.map((k) => { const d = defs[k], t = d.tex || d, img = t.image; return { key: k, tex: t, emis: d.emis || 0, paint: d.paint ?? o.paint ?? 0.03, img, w: img.width, h: img.height }; });
    const basePaint = Math.max(1e-4, ...list.map((t) => t.paint));                                              // the base material carries the largest paint amount, every tile scales it (uPaintK)
    const { W, H } = pack(list);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    for (const t of list) {                                                                                  // the wrap border: the tile repeated round itself = a repeat pattern filled over the padded rectangle (one operation per tile)
      try {
        g.save(); g.translate(t.px, t.py); g.fillStyle = g.createPattern(t.img, 'repeat'); g.fillRect(-PAD, -PAD, t.w + 2 * PAD, t.h + 2 * PAD); g.restore();
      } catch (e) { /* node harness */ }
    }
    const atlas = new THREE.CanvasTexture(cv); atlas.colorSpace = THREE.SRGBColorSpace; atlas.anisotropy = 8; atlas.generateMipmaps = true; atlas.minFilter = THREE.LinearMipmapLinearFilter; atlas.magFilter = THREE.LinearFilter;
    atlas.wrapS = atlas.wrapT = THREE.ClampToEdgeWrapping; atlas.needsUpdate = true;
    const info = Array.from({ length: MAXID }, () => new THREE.Vector4(128, 128, 0, 1)), rect = Array.from({ length: MAXID }, () => new THREE.Vector4(0, 0, 1, 1)), mean = Array.from({ length: MAXID }, () => new THREE.Vector3(0.5, 0.5, 0.5));
    const handles = {}, means = meansOf(list.map((t) => t.img));
    list.forEach((t, id) => {
      rect[id].set(t.px / W, 1 - (t.py + t.h) / H, t.w / W, t.h / H); info[id].set(t.w, t.h, t.emis, t.paint / basePaint);
      const m = means[id]; mean[id].set(m[0], m[1], m[2]);
      handles[t.key] = { isTileHandle: true, name: prefix + 'tile-' + t.key, transparent: false, tileCol: encode(m, id), tileId: id, tileBase: null };
    });
    const m = ctx.mat.toon('#ffffff', { vertexColors: true, paint: basePaint, name: prefix + name, side: cut ? 'double' : 'front', alphaTest: cut ? 0.5 : 0, polygonOffset: po });
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = (shader, renderer) => {
      if (prev) prev.call(m, shader, renderer);
      Object.assign(shader.uniforms, { uAtlas: { value: atlas }, uRect: { value: rect }, uMean: { value: mean }, uInfo: { value: info } });
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vTUv;')
        .replace('#include <fog_vertex>', '#include <fog_vertex>\nvTUv = uv;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>
          varying vec2 vTUv; uniform sampler2D uAtlas; uniform vec4 uRect[${MAXID}]; uniform vec3 uMean[${MAXID}]; uniform vec4 uInfo[${MAXID}]; int gTi = 0;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
          { int ti = int(floor(fract(vColor.b * 255.0) * 64.0)); gTi = ti;
            vec4 rc = uRect[ti]; vec4 inf = uInfo[ti]; vec2 sz = inf.xy;
            vec2 gx = dFdx(vTUv), gy = dFdy(vTUv);
            vec4 tc = textureGrad(uAtlas, rc.xy + fract(vTUv) * rc.zw, gx * rc.zw, gy * rc.zw);
            float lx = length(gx * sz), ly = length(gy * sz);
            float lod = log2(max(max(max(lx, ly) / 8.0, min(lx, ly)), 1e-5));        // the mip level of an 8 x anisotropic lookup (the fade must not start before the detail is really lost)
            diffuseColor.rgb = mix(tc.rgb, uMean[ti], smoothstep(3.5, 5.5, lod));
            ${cut ? 'diffuseColor.a *= tc.a;' : ''} }`)
        .replace('float pa = uPaint;', 'float pa = uPaint * uInfo[gTi].w;')
        .replace('#include <color_fragment>', '')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>' + String.fromCharCode(10) + 'totalEmissiveRadiance += diffuseColor.rgb * uInfo[gTi].z;');
    };
    m.customProgramCacheKey = () => 'lmMakTiles' + (cut ? 'C' : 'O');            // (every opaque base runs the same code: the atlas is a uniform; polygonOffset is not part of the program)
    for (const h of Object.values(handles)) h.tileBase = m;
    return { handles, base: m, px: W * H };
  };
  const t0 = performance.now(), h = {}, bases = {}; let atlasPx = 0;
  for (const set of sets) { const r = make(set); Object.assign(h, r.handles); bases[set.name] = r.base; atlasPx += r.px; }
  return { h, bases, atlasPx, ms: Math.round(performance.now() - t0) };
}
