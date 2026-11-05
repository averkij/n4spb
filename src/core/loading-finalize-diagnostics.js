// diagnostics.html scopes ONLY main.js imports here. Production imports and
// baking use the original modules. No geometry/material algorithm is copied.
import { batchStatic as batch } from './batch2.js';
import { splitInstanced as split, releaseOnUpload } from './spatial.js';
import { batchFixtureCells as fixtures } from './fixture-cells.js';
import { compactStaticAttributes as compact } from './compact-static.js';
import { buildNDProxy as outline } from './ndproxy.js';
export { releasedStats } from './spatial.js';
export { NDLazy } from './ndproxy.js';

// Exact full-attribute welding. Hash collisions are resolved by comparing every
// component's raw bits; UV seams, hard normals, colour and paint remain distinct.
// Temporary tables are bounded to one geometry, never a whole-city string map.
export function weldGeometry(g, THREE) {
  const count = g.attributes.position.count, entries = Object.entries(g.attributes);
  if (count < 3 || count > 1000000 || entries.some(([, a]) => a.count !== count || a.isInterleavedBufferAttribute || a.array.BYTES_PER_ELEMENT > 4)) return 0;
  const words = entries.map(([, a]) => ({ stride: a.itemSize, data: a.array instanceof Float32Array ?
    new Uint32Array(a.array.buffer, a.array.byteOffset, a.array.length) : a.array }));
  let size = 1; while (size < count * 2) size *= 2;
  const table = new Uint32Array(size), representatives = new Uint32Array(count), remap = new Uint32Array(count);
  let unique = 0;
  const same = (a, b) => {
    for (const { data, stride } of words) for (let c = 0; c < stride; c++) if (data[a * stride + c] !== data[b * stride + c]) return false;
    return true;
  };
  for (let i = 0; i < count; i++) {
    let hash = 2166136261;
    for (const { data, stride } of words) for (let c = 0; c < stride; c++) hash = Math.imul(hash ^ data[i * stride + c], 16777619);
    let slot = hash & (size - 1);
    while (table[slot] && !same(i, representatives[table[slot] - 1])) slot = (slot + 1) & (size - 1);
    if (!table[slot]) { representatives[unique] = i; table[slot] = ++unique; }
    remap[i] = table[slot] - 1;
  }
  const Index = unique > 65535 ? Uint32Array : Uint16Array;
  const indexCount = g.index?.count ?? count;
  const strideBytes = entries.reduce((n, [, a]) => n + a.itemSize * a.array.BYTES_PER_ELEMENT, 0);
  const saved = (count - unique) * strideBytes + (g.index?.array.byteLength || 0) - indexCount * Index.BYTES_PER_ELEMENT;
  if (saved <= 0) return 0;
  const index = new Index(indexCount);
  for (let i = 0; i < indexCount; i++) index[i] = remap[g.index ? g.index.array[i] : i];
  const indexAttribute = new THREE.BufferAttribute(index, 1);
  indexAttribute.onUpload(g.index?.onUploadCallback ?? g.attributes.position.onUploadCallback);
  g.setIndex(indexAttribute);
  for (const [key, a] of entries) {
    const data = new a.array.constructor(unique * a.itemSize);
    for (let i = 0; i < unique; i++) for (let c = 0; c < a.itemSize; c++) data[i * a.itemSize + c] = a.array[representatives[i] * a.itemSize + c];
    const next = new THREE.BufferAttribute(data, a.itemSize, a.normalized);
    next.name = a.name; next.gpuType = a.gpuType; next.onUpload(a.onUploadCallback); g.setAttribute(key, next);
  }
  return saved;
}

// Lossy diagnostic, restricted to immutable outputs and the stock basic/toon
// material paths. Uniform local decoding keeps normal directions unchanged and
// the toon factory's world-space paint coordinates follow the model matrix.
export async function packGeometry(root, THREE, notify = () => {}) {
  return runSteps(packGeometrySteps(root, THREE, notify));
}
async function runSteps(steps) {
  let next;
  while (!(next = steps.next()).done) await new Promise(resolve => setTimeout(resolve, 0));
  return next.value;
}
function runStepsSync(steps) {
  let next; while (!(next = steps.next()).done) { /* One already-decoded region, before attachment returns. */ }
  return next.value;
}
function* packGeometrySteps(root, THREE, notify = () => {}) {
  const refs = new Map(); root.updateMatrixWorld(true);
  root.traverse(o => { if (o.geometry) { let list = refs.get(o.geometry); if (!list) refs.set(o.geometry, list = []); list.push(o); } });
  const stats = { geometries: 0, positionGeometries: 0, savedAttributeBytes: 0, weldedBytes: 0, maxWorldPositionError: 0 };
  const stockMaterial = m => m && !Array.isArray(m) &&
    ((m.isMeshToonMaterial && m.userData.toon?.obc === m.onBeforeCompile) ||
     (m.isMeshBasicMaterial && m.onBeforeCompile === THREE.Material.prototype.onBeforeCompile));
  const replace = (g, key, a, array, normalized) => {
    const next = new THREE.BufferAttribute(array, a.itemSize, normalized);
    next.name = a.name; next.gpuType = a.gpuType; next.onUpload(a.onUploadCallback);
    stats.savedAttributeBytes += a.array.byteLength - array.byteLength; g.setAttribute(key, next);
  };
  notify('start', { ...stats }); let workBytes = 0;
  for (const [g, objects] of refs) {
    let p = g.attributes.position;
    if (!p || p.itemSize !== 3 || p.normalized || !(p.array instanceof Float32Array) ||
      p.onUploadCallback === THREE.BufferAttribute.prototype.onUploadCallback || Object.keys(g.morphAttributes).length ||
      Object.values(g.attributes).some(a => a.isInterleavedBufferAttribute || a.usage !== THREE.StaticDrawUsage) ||
      objects.some(o => !o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.children.length || o.userData.dynamic || !stockMaterial(o.material))) continue;
    const before = stats.savedAttributeBytes;
    const welded = weldGeometry(g, THREE); stats.weldedBytes += welded; stats.savedAttributeBytes += welded;
    p = g.attributes.position;
    if (!g.boundingBox) g.computeBoundingBox();
    const box = g.boundingBox, span = new THREE.Vector3(); box.getSize(span);
    const scale = Math.max(span.x, span.y, span.z);
    // Frobenius norm bounds world-space error even under sheared parents.
    const worldScale = Math.max(...objects.map(o => Math.hypot(...[0,1,2,4,5,6,8,9,10].map(i => o.matrixWorld.elements[i]))));
    const decomposable = objects.every(o => {
      const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); o.matrix.decompose(p, q, s);
      const m = new THREE.Matrix4().compose(p, q, s);
      return m.elements.every((v, i) => Math.abs(v - o.matrix.elements[i]) < 1e-7);
    });
    // Do not quantize thin paving/decal surfaces, or allow more than 2 cm
    // world-space Euclidean error. Normals/UVs can still be packed separately.
    if (decomposable && Number.isFinite(scale) && scale > 0 && span.y >= 1 && scale * Math.sqrt(3) / 131070 * worldScale <= 0.02) {
      const data = new Uint16Array(p.array.length), min = box.min;
      let maxError = 0;
      for (let i = 0; i < p.count; i++) {
        let error = 0;
        for (let c = 0; c < 3; c++) {
          const origin = c === 0 ? min.x : c === 1 ? min.y : min.z, value = p.array[i * 3 + c];
          const q = Math.round((value - origin) / scale * 65535); data[i * 3 + c] = q;
          error += (origin + q / 65535 * scale - value) ** 2;
        }
        maxError = Math.max(maxError, Math.sqrt(error) * worldScale);
      }
      const decode = new THREE.Matrix4().makeScale(scale, scale, scale).setPosition(min);
      for (const o of objects) {
        o.matrix.multiply(decode); o.matrix.decompose(o.position, o.quaternion, o.scale);
        o.matrixWorldNeedsUpdate = true;
      }
      replace(g, 'position', p, data, true);
      // Preserve conservative authored bounds, including any extra margins.
      const inverse = decode.clone().invert();
      g.boundingBox.applyMatrix4(inverse).expandByScalar(1 / 65535);
      if (g.boundingSphere) { g.boundingSphere.applyMatrix4(inverse); g.boundingSphere.radius += Math.sqrt(3) / 65535; }
      stats.positionGeometries++; stats.maxWorldPositionError = Math.max(stats.maxWorldPositionError, maxError);
    }
    for (const [key, Type, multiplier, lo, hi] of [
      ['normal', Int8Array, 127, -1, 1], ['color', Uint8Array, 255, 0, 1], ['uv', Uint16Array, 65535, 0, 1]
    ]) {
      const a = g.attributes[key]; if (!a || a.array.BYTES_PER_ELEMENT <= Type.BYTES_PER_ELEMENT) continue;
      const get = (i, c) => THREE.MathUtils.denormalize(a.array[i * a.itemSize + c], a.array);
      const value = (i, c) => a.normalized ? get(i, c) : a.array[i * a.itemSize + c];
      let safe = true;
      for (let i = 0; i < a.count && safe; i++) for (let c = 0; c < a.itemSize; c++) {
        const v = value(i, c); if (!Number.isFinite(v) || v < lo || v > hi) { safe = false; break; }
      }
      if (!safe) continue;
      const data = new Type(a.array.length);
      for (let i = 0; i < a.count; i++) for (let c = 0; c < a.itemSize; c++) data[i * a.itemSize + c] = Math.round(value(i, c) * multiplier);
      replace(g, key, a, data, true);
    }
    if (stats.savedAttributeBytes > before) stats.geometries++;
    workBytes += p.array.byteLength;
    if (workBytes >= 4 * 1024 * 1024) { notify('progress', { ...stats }); workBytes = 0; yield; }
  }
  root.updateMatrixWorld(true); notify('end', { ...stats }); return stats;
}

// Upload only immutable geometry that already opts into an onUpload callback.
// Three r170 uploads attributes while projecting a mesh, and its index during
// binding-state setup even with a zero draw count. This uses those normal cache
// paths: no private renderer API, duplicate GPU buffers, or replacement arrays.
// Requires nd=0: lazy outline builders must never read already-released arrays.
export async function stageGeometryUploads(renderer, root, THREE, notify = () => {}) {
  return runSteps(stageGeometryUploadSteps(renderer, root, THREE, notify));
}
function* stageGeometryUploadSteps(renderer, root, THREE, notify = () => {}) {
  const bytesInScene = () => {
    const buffers = new Set(); let bytes = 0;
    const add = a => { const b = (a?.isInterleavedBufferAttribute ? a.data.array : a?.array)?.buffer;
      if (b && !buffers.has(b)) { buffers.add(b); bytes += b.byteLength; } };
    root.traverse(o => {
      add(o.geometry?.index);
      for (const a of Object.values(o.geometry?.attributes || {})) add(a);
      for (const list of Object.values(o.geometry?.morphAttributes || {})) for (const a of list) add(a);
      add(o.instanceMatrix); add(o.instanceColor);
    });
    return bytes;
  };
  const seen = new Set(), queue = [];
  root.traverse(o => {
    const g = o.geometry;
    if (!g || seen.has(g)) return;
    seen.add(g);
    const attrs = [...Object.values(g.attributes), ...(g.index ? [g.index] : [])];
    if (!g.attributes.position || Object.keys(g.morphAttributes).length ||
      attrs.some(a => a.isInterleavedBufferAttribute || a.usage !== THREE.StaticDrawUsage) ||
      !attrs.some(a => a.array?.byteLength && a.onUploadCallback !== THREE.BufferAttribute.prototype.onUploadCallback)) return;
    queue.push({ g, bytes: attrs.reduce((n, a) => n + a.array.byteLength, 0) });
  });
  const stats = { total: queue.length, completed: 0, batches: 0, submittedBytes: 0,
    beforeBytes: bytesInScene(), afterBytes: 0, releasedBytes: 0 };
  stats.afterBytes = stats.beforeBytes;
  notify('start', { ...stats });
  if (!queue.length) { stats.afterBytes = stats.beforeBytes; notify('end', stats); return stats; }
  const scene = new THREE.Scene(); scene.userData.diagnosticGeometryUpload = true;
  const camera = new THREE.Camera();
  const material = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false });
  const mesh = new THREE.Mesh(queue[0].g, material); mesh.frustumCulled = false; scene.add(mesh);
  const target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false, stencilBuffer: false });
  const oldTarget = renderer.getRenderTarget(), face = renderer.getActiveCubeFace(), mip = renderer.getActiveMipmapLevel();
  const viewport = renderer.getViewport(new THREE.Vector4()), scissor = renderer.getScissor(new THREE.Vector4());
  const scissorTest = renderer.getScissorTest(), shadows = renderer.shadowMap.enabled;
  const pixels = new Uint8Array(4);
  try {
    renderer.shadowMap.enabled = false; renderer.setRenderTarget(target); renderer.setScissorTest(false);
    let batchBytes = 0, batchCount = 0;
    for (const { g, bytes } of queue) {
      if (!batchCount) notify('batch', { ...stats, nextGeometryBytes: bytes });
      mesh.geometry = g;
      const { start, count } = g.drawRange;
      try { g.setDrawRange(0, 0); renderer.render(scene, camera); }
      finally { g.setDrawRange(start, count); }
      stats.completed++; stats.submittedBytes += bytes; batchBytes += bytes; batchCount++;
      if (batchBytes >= 4 * 1024 * 1024 || batchCount >= 64 || stats.completed === stats.total) {
        if (renderer.getContext().isContextLost()) throw Error('Context lost during staged geometry upload');
        // Drain queued work before yielding, instead of queuing an entire city
        // in one task. The existing onUpload callbacks release CPU ownership.
        renderer.readRenderTargetPixels(target, 0, 0, 1, 1, pixels);
        stats.afterBytes = bytesInScene(); stats.releasedBytes = stats.beforeBytes - stats.afterBytes;
        stats.batches++; notify('progress', { ...stats });
        batchBytes = batchCount = 0;
        yield;
      }
    }
    stats.afterBytes = bytesInScene(); stats.releasedBytes = stats.beforeBytes - stats.afterBytes;
    notify('end', { ...stats }); return stats;
  } catch (error) { notify('error', { ...stats, message: String(error.message) }); throw error; }
  finally {
    renderer.setRenderTarget(oldTarget, face, mip); renderer.setViewport(viewport);
    renderer.setScissor(scissor); renderer.setScissorTest(scissorTest); renderer.shadowMap.enabled = shadows;
    scene.remove(mesh); material.dispose(); target.dispose();
    // Geometry belongs to the real scene; disposing it would erase the upload.
  }
}

// Baked region geometry is immutable and physics uses the separate field/roof
// products. With ND/super-cells disabled no late builder reads these arrays.
// Enrol only these known owners: arbitrary scene geometry can have CPU users.
export function releaseRegionGeometry(root, THREE) {
  let geometries = 0; const seen = new Set();
  root?.traverse(o => {
    const g = o.geometry;
    if (!g || seen.has(g) || o.userData.dynamic || o.isSkinnedMesh || Object.keys(g.morphAttributes).length) return;
    seen.add(g);
    const attrs = [...Object.values(g.attributes), ...(g.index ? [g.index] : [])];
    if (attrs.some(a => a.isInterleavedBufferAttribute || a.usage !== THREE.StaticDrawUsage ||
      a.onUploadCallback !== THREE.BufferAttribute.prototype.onUploadCallback)) return;
    if (!g.boundingBox) g.computeBoundingBox();
    if (!g.boundingSphere) g.computeBoundingSphere();
    releaseOnUpload(g); geometries++;
  });
  return geometries;
}

export function installRegionMemoryProfile(ctx, THREE, notify = () => {}, isPlaying = () => document.body.classList.contains('playing')) {
  const regions = ctx.regions; if (!regions) return;
  let enrolled = 0;
  for (const r of regions.regions) {
    enrolled += releaseRegionGeometry(r.group, THREE);
    enrolled += releaseRegionGeometry(r.silhouette, THREE);
  }
  // All builders have finished. Regions own hydrated materials/metadata and
  // services own the road/collider data they need; resolved loader promises
  // must not keep the original silhouette/PNG backing buffers alive as well.
  for (const name of ['city-base', 'street-surfaces', 'street-textures', 'street-kerbs']) ctx.baked?.release?.(name);
  notify('initial', { enrolled });
  const attach = ctx.onRegionAttach;
  ctx.onRegionAttach = group => {
    // Finish all CPU readers first. No frame may interleave packing/uploading:
    // the attachment callback is synchronous, and renderer state is restored
    // before control returns to the normal frame loop.
    attach?.(group);
    const start = performance.now();
    notify('start', { asset: group.name });
    const enrolled = releaseRegionGeometry(group, THREE);
    const packed = runStepsSync(packGeometrySteps(group, THREE));
    const uploaded = runStepsSync(stageGeometryUploadSteps(ctx.renderer, group, THREE));
    notify('end', { asset: group.name, enrolled, packed, uploaded, ms: Math.round(performance.now() - start) });
  };
  // The normal 1400 m speculative ring permanently accumulates more geometry
  // immediately behind the Play screen. Keep the same 700 m startup/teleport
  // coverage, and extend it as the player moves. Roads' 450 m lead is included;
  // distant silhouettes stay present and explicit teleports still await data.
  const ensure = regions.ensureAt.bind(regions), update = regions.update.bind(regions);
  let tail = Promise.resolve(), busy = false, started = false, last = null;
  regions.ensureAt = (...args) => {
    const next = tail.then(() => ensure(...args)); tail = next.catch(() => {}); return next;
  };
  regions.start = () => { started = true; notify('waiting', { radius: 700 }); };
  regions.update = (x, z) => {
    update(x, z); // Original pump remains unstarted; retain its position state.
    if (!started || busy || !isPlaying() || (last && Math.hypot(x - last.x, z - last.z) < 100)) return;
    busy = true; last = { x, z };
    notify('request', { x, z, radius: 700 });
    regions.ensureAt(x, z, 700).catch(error => {
      last = null; notify('error', { message: String(error.message) });
    }).finally(() => { busy = false; });
  };
}

function installStagedGeometryUpload() {
  const params = new URLSearchParams(location.search);
  const packed = params.get('diagpack') === '1';
  if (params.get('diaguploader') !== 'staged' && !packed) return;
  if (params.get('nd') !== '0' || params.get('supercells') !== '0') throw Error('Staged uploads require lower geometry memory mode');
  const { renderer, THREE } = window.__ctx, compile = renderer.compileAsync;
  renderer.compileAsync = async function (...args) {
    renderer.compileAsync = compile;
    if (packed) installRegionMemoryProfile(window.__ctx, THREE, (state, detail) => {
      dispatchEvent(new CustomEvent('piter-diagnostic-build', { detail: { name: 'region-memory', state, ...detail } }));
    });
    if (packed) await packGeometry(args[0], THREE, (state, detail) => phase('geometry-pack', state, detail));
    if (params.get('diaguploader') === 'staged') await stageGeometryUploads(renderer, args[0], THREE, (state, detail) => phase('geometry-upload', state, detail));
    return Reflect.apply(compile, this, args);
  };
}

// Diagnostic only: keep TexImageSource overloads and pixel-store state intact,
// but avoid direct canvas-source uploads. Read fresh pixels on EVERY update;
// dynamic canvas painters and their original backing stores remain untouched.
export function installCanvasPixelUploads(gl, notify = () => {}) {
  const originals = new Map(); let uploads = 0, bytesRead = 0;
  for (const name of ['texImage2D', 'texSubImage2D']) {
    const original = gl[name];
    const wrapped = function (...args) {
      const source = args.at(-1);
      if (!(source instanceof HTMLCanvasElement)) return Reflect.apply(original, this, args);
      const ctx = source.getContext('2d');
      if (!ctx || !source.width || !source.height) return Reflect.apply(original, this, args);
      const record = { number: ++uploads, call: name, width: source.width, height: source.height,
        bytes: source.width * source.height * 4, bytesRead, phase: 'read:entered' };
      notify({ ...record });
      try {
        args[args.length - 1] = ctx.getImageData(0, 0, source.width, source.height);
        bytesRead += record.bytes; record.bytesRead = bytesRead; record.phase = 'upload:entered'; notify({ ...record });
        const result = Reflect.apply(original, this, args);
        record.phase = 'upload:returned'; notify({ ...record }); return result;
      } catch (error) {
        record.phase += ':failed'; record.error = String(error.message).slice(0, 200); notify({ ...record }); throw error;
      }
    };
    gl[name] = wrapped;
    if (gl[name] !== wrapped) throw Error(`Cannot install canvas upload comparison: ${name}`);
    originals.set(name, original);
  }
  return () => { for (const [name, original] of originals) gl[name] = original; };
}

export function plainGround(root, THREE) {
  const replacements = new Map(); let meshes = 0;
  root.traverse(o => {
    if (!o.isMesh || o.material?.name !== 'env-ground') return;
    const original = o.material;
    let material = replacements.get(original);
    if (!material) {
      material = new THREE.MeshBasicMaterial({ color: '#6f7377', side: original.side,
        depthTest: original.depthTest, depthWrite: original.depthWrite, depthFunc: original.depthFunc,
        polygonOffset: original.polygonOffset, polygonOffsetFactor: original.polygonOffsetFactor,
        polygonOffsetUnits: original.polygonOffsetUnits, fog: original.fog });
      material.name = 'diagnostic-ground-plain'; replacements.set(original, material);
    }
    o.material = material; meshes++;
  });
  return { meshes, materials: replacements.size };
}

// Deliberately lossy diagnostic: reduce static canvas pixel storage in place,
// so cached texture aliases do not retain the original full-sized backing.
// Data textures and canvases shared with dynamic scene objects are excluded.
export function reduceCanvasTextures(root, dynamicRoot, maxSide) {
  const images = new Map(), dynamicImages = new Set();
  const scan = (tree, visit) => tree?.traverse(o => {
    for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
      if (!m) continue;
      for (const t of Object.values(m)) if (t?.isTexture) visit(t, o);
      for (const u of Object.values(m.uniforms || {})) if (u?.value?.isTexture) visit(u.value, o);
    }
  });
  scan(dynamicRoot, t => dynamicImages.add(t.image));
  scan(root, (t, o) => { if (o.userData?.dynamic || o.instanceMatrix?.usage === 35048) dynamicImages.add(t.image); });
  scan(root, t => {
    const c = t.image;
    if (!t.isCanvasTexture || typeof c?.getContext !== 'function' || dynamicImages.has(c)) return;
    let refs = images.get(c); if (!refs) images.set(c, refs = new Set()); refs.add(t);
  });
  const stats = { maxSide, changed: 0, beforePixels: 0, afterPixels: 0, sharedWithDynamic: dynamicImages.size };
  return resizeCanvases(images, maxSide, stats);
}

// Road-sign atlas pixels are immutable after makePanels.finish, even when
// the same texture is used by knockable signs. Preserve their normalized UVs.
export function reduceSignAtlases(root, dynamicRoot, maxSide) {
  const images = new Map();
  for (const tree of [root, dynamicRoot]) tree?.traverse(o => {
    for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
      const t = m?.map, c = t?.image;
      if (m?.name !== 'pt-sign-atlas' || !t?.isCanvasTexture || typeof c?.getContext !== 'function') continue;
      let refs = images.get(c); if (!refs) images.set(c, refs = new Set()); refs.add(t);
    }
  });
  return resizeCanvases(images, maxSide, { maxSide, changed: 0, beforePixels: 0, afterPixels: 0 });
}

function resizeCanvases(images, maxSide, stats) {
  const scratch = document.createElement('canvas');
  try {
    for (const [c, refs] of images) {
      const w = c.width, h = c.height; stats.beforePixels += w * h;
      const scale = Math.min(1, maxSide / Math.max(w, h));
      if (scale === 1 || !w || !h) { stats.afterPixels += w * h; continue; }
      const width = Math.max(1, Math.round(w * scale)), height = Math.max(1, Math.round(h * scale));
      scratch.width = width; scratch.height = height;
      const small = scratch.getContext('2d');
      const original = c.getContext('2d');
      if (!small || !original) { stats.afterPixels += w * h; continue; }
      small.drawImage(c, 0, 0, width, height);
      c.width = width; c.height = height; original.drawImage(scratch, 0, 0);
      for (const t of refs) t.needsUpdate = true;
      stats.afterPixels += width * height; stats.changed++;
    }
  } finally { scratch.width = scratch.height = 1; }
  stats.rgba8BytesAvoidedEstimate = (stats.beforePixels - stats.afterPixels) * 4;
  return stats;
}

function phase(name, state, detail = {}) {
  if (!document.body.classList.contains('loaded'))
    dispatchEvent(new CustomEvent('piter-diagnostic-build', { detail: { name, state, ...detail } }));
}
function trace(name, fn, args, detail = {}) {
  const started = performance.now();
  phase(name, 'start', detail);
  try {
    const result = fn(...args);
    phase(name, 'end', { ms: Math.round(performance.now() - started),
      ...(name === 'batch' ? { atlasPages: result.atlasPages, atlasTextures: result.atlasTextures } : {}) });
    return result;
  } catch (error) { phase(name, 'error', { message: String(error.message).slice(0, 200) }); throw error; }
}
export function batchStatic(root, options) {
  installStagedGeometryUpload();
  const noAtlas = new URLSearchParams(location.search).get('diagatlas') === '0';
  if (new URLSearchParams(location.search).get('diagcanvasupload') === 'pixels') {
    installCanvasPixelUploads(window.__ctx.renderer.getContext(), detail => {
      if (!document.body.classList.contains('loaded')) dispatchEvent(new CustomEvent('piter-diagnostic-canvas-upload', { detail }));
    });
    phase('canvas-upload-mode', 'end', { mode: 'ImageData' });
  }
  if (new URLSearchParams(location.search).get('diagground') === 'plain') {
    phase('plain-ground', 'start');
    phase('plain-ground', 'end', plainGround(root, window.__ctx.THREE));
  }
  if (new URLSearchParams(location.search).get('diagtexture') === '256') {
    phase('texture-cap', 'start');
    const stats = reduceCanvasTextures(root, window.__ctx?.dynamicRoot, 256);
    phase('texture-cap', 'end', stats);
  }
  if (new URLSearchParams(location.search).get('diagsignatlas') === '1024') {
    phase('sign-atlas-cap', 'start');
    phase('sign-atlas-cap', 'end', reduceSignAtlases(root, window.__ctx?.dynamicRoot, 1024));
  }
  return trace('batch', batch, [root, noAtlas ? { ...options, atlasTextures: false } : options], { atlasEnabled: !noAtlas });
}
export const splitInstanced = (...args) => trace('split-instances', split, args);
export const batchFixtureCells = (...args) => trace('fixture-cells', fixtures, args);
export const compactStaticAttributes = (...args) => trace('compact-attributes', compact, args);
export const buildNDProxy = (...args) => trace('outline-proxies', outline, args);
