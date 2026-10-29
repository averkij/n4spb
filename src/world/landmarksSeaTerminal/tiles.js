// landmarksSeaTerminal/tiles.js - ONE material kind for every repeating wall painting + ONE vertex-coloured base for every plain colour (draw-call account, 2026-10-10; copy of landmarksModernVO/tiles.js, itself the method of landmarksKirova/tiles.js).
// Why: the engine (core/batch2.js) batches by material KIND.  A tiled canvas texture (uv beyond 0..1) cannot be atlased, so each of the ~18 paintings of the module (aluminium sails, concrete, deck, hoarding, hull plates, ashlar, gravel, brick, bay wall) was a kind of
// its own: x 192 m cells x size classes x (colour + shadow pass) = the +60 .. +80 calls of the postcard poses.  Here the paintings live in ONE atlas texture and a patched
// MeshToonMaterial (same cel light, shadows, fog, paint noise as ctx.mat.toon) repeats them per fragment: fract(uv) inside the tile rectangle, textureGrad with the gradient of the CONTINUOUS uv (no seam, trilinear /
// anisotropic), a 16 px wrap border round every tile and a fade to the mean colour of the tile at strong minification (no bleed of the neighbour tiles at distance).  The geometry (uv in tile repeats, Parts.quad /
// box / cap / extrude ...) did not change: kit.js is untouched, the houses still hand REAL materials to Parts, and kit.build() (below) turns the buckets into meshes:
//   * a bucket whose material has a tiled map (uv outside 0..1)       -> a tile of the atlas;  vertex colour = the MEAN colour of the tile (linear) with the tile id in the fraction of the blue channel
//     (b * 255 = B8 + (id + 0.5) / 64), so the far-distance proxies of core/batch2.js (one vertex-coloured mesh per sector) paint the mean colour and the shader still decodes the id;
//   * a bucket whose material is a plain colour (no map, no emissive)   -> a vertex colour (what batch2 did with every plain material anyway) of ONE base material per (side, polygonOffset, paint bin, outline layer);
//   * every other bucket (atlas sheets with unit uv: windows, decals, signs; transparent glass; emissive) stays a mesh of its own material, unchanged.
// Buckets of one base inside one part are concatenated into one mesh.  A tinted opaque map (material colour != white) gets its own tile (the tint is multiplied into the tile in LINEAR space).
// The mean colours are read back from the finished atlas (ONE getImageData, finalize()) and written into the vertex colours then: reading 46 canvases one by one cost 0.3 s.
import * as THREE from 'three';

const PAD = 16, MAXID = 64, W = 2048;
const PAINT_BINS = [0, 0.02, 0.04, 0.06];

const lin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
const enc = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);

export function makeTileKit(ctx, prefix) {
  const T = ctx.mat.toon;
  const tiles = [], byKey = new Map(), bases = new Map();
  const uni = {
    uAtlas: { value: null }, uAtlasPx: { value: new THREE.Vector2(W, W) },
    uRect: { value: Array.from({ length: MAXID }, () => new THREE.Vector4(0, 0, 1, 1)) },
    uMean: { value: Array.from({ length: MAXID }, () => new THREE.Vector3(0.5, 0.5, 0.5)) },
  };
  const kit = { tiles, bases, stats: { tileBuckets: 0, flatBuckets: 0, keptBuckets: 0, meshes: 0, atlasPx: 0, buildMs: 0, atlasMs: 0 } };

  /** the tile of a texture with an optional linear tint (the mean colour is filled in by finalize) */
  const tileFor = (tex, tint) => {
    const key = tex.uuid + (tint ? '|' + tint.map((v) => v.toFixed(3)).join(',') : '');
    let t = byKey.get(key); if (t) return t;
    if (tiles.length >= MAXID) return null;
    const img = tex.image;
    t = { key, tex, img, tint, id: tiles.length, w: img.width, h: img.height, mean: [0.5, 0.5, 0.5], refs: [] };
    tiles.push(t); byKey.set(key, t); return t;
  };

  /** the base material of (kind 'flat' | 'tile', side, alphaTest, polygonOffset, paint bin, noOutline, noCast) */
  const baseOf = (kind, side, alphaTest, po, paint, no, nc) => {
    const key = [kind, side, alphaTest, po, paint, no ? 1 : 0, nc ? 1 : 0].join('|');
    let b = bases.get(key); if (b) return b;
    const name = `${prefix}-${kind}${side === 'double' ? 'D' : ''}${alphaTest ? 'A' : ''}${po ? 'P' : ''}${paint ? 'p' + Math.round(paint * 100) : ''}${no ? 'N' : ''}${nc ? 'X' : ''}`;
    const m = T('#ffffff', { vertexColors: true, vpaint: true, paint, name, side, alphaTest, polygonOffset: po });
    const cut = alphaTest > 0;
    if (kind === 'tile') {
      const prev = m.onBeforeCompile;
      m.onBeforeCompile = (shader, renderer) => {
        if (prev) prev.call(m, shader, renderer);
        Object.assign(shader.uniforms, uni);
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec2 vTUv;')
          .replace('#include <fog_vertex>', '#include <fog_vertex>\nvTUv = uv;');
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', `#include <common>
            varying vec2 vTUv; uniform sampler2D uAtlas; uniform vec2 uAtlasPx; uniform vec4 uRect[${MAXID}]; uniform vec3 uMean[${MAXID}];`)
          .replace('#include <map_fragment>', `#include <map_fragment>
            { int ti = int(floor(fract(vColor.b * 255.0) * 64.0));
              vec4 rc = uRect[ti];
              vec2 gx = dFdx(vTUv), gy = dFdy(vTUv), sz = rc.zw * uAtlasPx;
              vec4 tc = textureGrad(uAtlas, rc.xy + fract(vTUv) * rc.zw, gx * rc.zw, gy * rc.zw);
              float lod = log2(max(max(length(gx * sz), length(gy * sz)), 1e-5));
              diffuseColor.rgb = mix(tc.rgb, uMean[ti], smoothstep(3.5, 5.5, lod));
              ${cut ? 'diffuseColor.a *= tc.a;' : ''} }`)
          .replace('#include <color_fragment>', '');
      };
      m.customProgramCacheKey = () => 'lmTiles' + (cut ? 'C' : 'O');
    }
    b = { mat: m, kind, no, nc, cut, key }; bases.set(key, b); return b;
  };

  /** the base + colour (flat: the material colour; tile: the tile) of a bucket, or null when the bucket stays as it is.  o.noOutline(mat): the material is an alpha cut-out / decal / glass (no outline pass) */
  const convert = (k, o) => {
    const m = k.mat;
    if (o.keep && o.keep(m)) return null;      // (o.keep: materials that must stay as they are, e.g. alpha cut-outs: their shadow uses the alpha of their own texture, an atlas tile would cast a solid shadow)
    if (!m || !m.isMeshToonMaterial || !m.userData || !m.userData.toon || m.transparent || m.opacity < 1 || m.alphaMap || m.normalMap || m.bumpMap) return null;
    if (m.emissive && (m.emissive.r || m.emissive.g || m.emissive.b)) return null;
    const side = m.side === THREE.DoubleSide ? 'double' : m.side === THREE.BackSide ? null : 'front'; if (!side) return null;
    const po = m.userData.toon.polygonOffset || 0, no = !!(o.noOutline && o.noOutline(m)), nc = !!(o.noCast && o.noCast(m));
    const pv = m.userData.toon.paint || 0, paint = PAINT_BINS.reduce((a, b) => (Math.abs(b - pv) < Math.abs(a - pv) ? b : a));
    if (!m.map) {
      if (m.alphaTest > 0) return null;
      return { base: baseOf('flat', side, 0, po, paint, no, nc), col: [m.color.r, m.color.g, m.color.b] };
    }
    const img = m.map.image;
    if (!img || m.map.isDataTexture || m.map.isCompressedTexture || !(img.width > 0) || img.width > 1024 || img.height > 1024) return null;
    const uv = k.uv; let tiled = false;
    for (let i = 0; i < uv.length; i++) { const v = uv[i]; if (v < -0.002 || v > 1.002 || !Number.isFinite(v)) { tiled = true; break; } }
    if (!tiled) return null;
    const white = Math.abs(m.color.r - 1) + Math.abs(m.color.g - 1) + Math.abs(m.color.b - 1) < 0.004;
    if (!white && m.alphaTest > 0) return null;
    const t = tileFor(m.map, white ? null : [m.color.r, m.color.g, m.color.b]); if (!t) return null;
    return { base: baseOf('tile', side, m.alphaTest || 0, po, 0.03, no, nc), tile: t };
  };

  /** the vertex colour of a tile: its mean (linear) with the id in the fraction of the blue channel */
  const tileCol = (t) => { const b8 = Math.max(0, Math.min(254, Math.floor(t.mean[2] * 255))); return [t.mean[0], t.mean[1], (b8 + (t.id + 0.5) / 64) / 255]; };

  /** Parts.build() replacement: returns the meshes added to `parent`.  o: { name, noOutline(mat), noCast(mat), keep(mat) } (the callbacks see the ORIGINAL materials) */
  kit.build = (P, parent, o = {}) => {
    const tb = performance.now(), items = [], merged = new Map();
    for (const k of P.b.values()) {
      if (!k.n) continue;
      const c = convert(k, o);
      if (!c) { items.push({ k, base: null }); kit.stats.keptBuckets++; continue; }
      kit.stats[c.tile ? 'tileBuckets' : 'flatBuckets']++;
      let mb = merged.get(c.base);
      if (!mb) { mb = { base: c.base, parts: [], n: 0, nIdx: 0 }; merged.set(c.base, mb); items.push({ k: mb, base: c.base }); }
      mb.parts.push({ k, c, off: mb.n }); mb.n += k.n; mb.nIdx += k.idx.length;
    }
    const meshes = [];
    for (const it of items) {
      const { k, base } = it;
      const g = new THREE.BufferGeometry();
      let mat = k.mat, n = k.n;
      if (base) {                                                                              // concatenate the buckets of the base into typed arrays
        mat = base.mat; n = k.n;
        const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3), idx = n > 65535 ? new Uint32Array(k.nIdx) : new Uint16Array(k.nIdx);
        let io = 0;
        for (const { k: b, c, off } of k.parts) {
          pos.set(b.pos, off * 3); nrm.set(b.nrm, off * 3); uv.set(b.uv, off * 2);
          if (c.tile) c.tile.refs.push({ col, from: off, to: off + b.n }); else for (let i = 0; i < b.n; i++) { col[(off + i) * 3] = c.col[0]; col[(off + i) * 3 + 1] = c.col[1]; col[(off + i) * 3 + 2] = c.col[2]; }
          for (let i = 0; i < b.idx.length; i++) idx[io++] = b.idx[i] + off;
        }
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      } else {
        g.setAttribute('position', new THREE.Float32BufferAttribute(k.pos, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(k.nrm, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(k.uv, 2));
        g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(k.idx, 1) : new THREE.Uint16BufferAttribute(k.idx, 1));
      }
      g.computeBoundingSphere(); g.computeBoundingBox();
      const m = new THREE.Mesh(g, mat);
      m.castShadow = o.cast !== false && !mat.transparent && !(base ? base.nc : (o.noCast && o.noCast(mat))); m.receiveShadow = o.receive !== false;
      if (o.name) m.name = o.name;
      if (base && base.no) ctx.noOutline(m);
      parent.add(m); meshes.push(m); kit.stats.meshes++;
    }
    kit.stats.buildMs += performance.now() - tb;
    return meshes;
  };

  /** call once after the last part: packs the atlas, reads the mean colour of every tile back from it, writes the vertex colours and fills the shared uniforms */
  kit.finalize = () => {
    if (!tiles.length) return;
    const ta = performance.now(), order = [...tiles].sort((a, b) => b.h - a.h || b.w - a.w);
    let x = 0, y = 0, shelf = 0;
    for (const t of order) {
      const w = t.w + 2 * PAD, h = t.h + 2 * PAD;
      if (x + w > W) { x = 0; y += shelf; shelf = 0; }
      t.px = x + PAD; t.py = y + PAD; x += w; shelf = Math.max(shelf, h);
    }
    const H = Math.max(256, Math.ceil((y + shelf) / 256) * 256);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    for (const t of tiles) {
      try {
        g.save(); g.translate(t.px, t.py); g.fillStyle = g.createPattern(t.img, 'repeat'); g.fillRect(-PAD, -PAD, t.w + 2 * PAD, t.h + 2 * PAD); g.restore();      // the wrap border: the tile repeated round itself
        if (t.tint) {                                                                                       // a tinted map: the tint is multiplied in linear space, pixel by pixel
          const x0 = t.px - PAD, y0 = t.py - PAD, w = t.w + 2 * PAD, h = t.h + 2 * PAD, id = g.getImageData(x0, y0, w, h), d = id.data;
          const lut = new Float32Array(256); for (let i = 0; i < 256; i++) lut[i] = lin(i / 255);
          for (let i = 0; i < d.length; i += 4) { d[i] = Math.round(enc(lut[d[i]] * t.tint[0]) * 255); d[i + 1] = Math.round(enc(lut[d[i + 1]] * t.tint[1]) * 255); d[i + 2] = Math.round(enc(lut[d[i + 2]] * t.tint[2]) * 255); }
          g.putImageData(id, x0, y0);
        }
      } catch (e) { /* node harness */ }
    }
    kit.stats.drawMs = performance.now() - ta;
    try {                                                                                                     // mean colours (alpha weighted), like core/batch2.js avgOf: linear of the mean sRGB byte: the atlas is shrunk 16 x (ONE small read-back instead of 16 MB)
      const S = 16, sc = document.createElement('canvas'); sc.width = W / S; sc.height = H / S; const gs = sc.getContext('2d', { willReadFrequently: true });
      gs.imageSmoothingEnabled = true; gs.imageSmoothingQuality = 'high'; gs.drawImage(cv, 0, 0, W, H, 0, 0, sc.width, sc.height);
      const all = gs.getImageData(0, 0, sc.width, sc.height).data;
      for (const t of tiles) {
        let r = 0, gg = 0, b = 0, a = 0;
        const x0 = Math.ceil(t.px / S), x1 = Math.floor((t.px + t.w) / S), y0 = Math.ceil(t.py / S), y1 = Math.floor((t.py + t.h) / S);
        for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) { const o = (j * sc.width + i) * 4, w = all[o + 3]; r += all[o] * w; gg += all[o + 1] * w; b += all[o + 2] * w; a += w; }
        if (a > 0) t.mean = [lin(r / a / 255), lin(gg / a / 255), lin(b / a / 255)];
      }
    } catch (e) { /* node harness: mid grey */ }
    kit.stats.readMs = performance.now() - ta - kit.stats.drawMs;
    for (const t of tiles) {
      const c = tileCol(t);
      for (const { col, from, to } of t.refs) for (let v = from; v < to; v++) { col[v * 3] = c[0]; col[v * 3 + 1] = c[1]; col[v * 3 + 2] = c[2]; }
      t.refs.length = 0;
    }
    const atlas = new THREE.CanvasTexture(cv); atlas.colorSpace = THREE.SRGBColorSpace; atlas.anisotropy = 8; atlas.generateMipmaps = true;
    atlas.minFilter = THREE.LinearMipmapLinearFilter; atlas.magFilter = THREE.LinearFilter; atlas.wrapS = atlas.wrapT = THREE.ClampToEdgeWrapping; atlas.needsUpdate = true;
    uni.uAtlas.value = atlas; uni.uAtlasPx.value.set(W, H);
    for (const t of tiles) { uni.uRect.value[t.id].set(t.px / W, 1 - (t.py + t.h) / H, t.w / W, t.h / H); uni.uMean.value[t.id].set(t.mean[0], t.mean[1], t.mean[2]); }
    kit.stats.atlasPx = W * H; kit.stats.atlasMs = performance.now() - ta;
  };
  return kit;
}
