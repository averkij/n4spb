// diagnostics.html scopes ONLY main.js imports here. Production imports and
// baking use the original modules. No geometry/material algorithm is copied.
import { batchStatic as batch } from './batch2.js';
import { splitInstanced as split } from './spatial.js';
import { batchFixtureCells as fixtures } from './fixture-cells.js';
import { compactStaticAttributes as compact } from './compact-static.js';
import { buildNDProxy as outline } from './ndproxy.js';
export { releasedStats } from './spatial.js';
export { NDLazy } from './ndproxy.js';

// Upload only immutable geometry that already opts into an onUpload callback.
// Three r170 uploads attributes while projecting a mesh, and its index during
// binding-state setup even with a zero draw count. This uses those normal cache
// paths: no private renderer API, duplicate GPU buffers, or replacement arrays.
// Requires nd=0: lazy outline builders must never read already-released arrays.
export async function stageGeometryUploads(renderer, root, THREE, notify = () => {}) {
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
        stats.batches++; notify('progress', { ...stats });
        batchBytes = batchCount = 0;
        await new Promise(resolve => setTimeout(resolve, 0));
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

function installStagedGeometryUpload() {
  const params = new URLSearchParams(location.search);
  if (params.get('diaguploader') !== 'staged') return;
  if (params.get('nd') !== '0' || params.get('supercells') !== '0') throw Error('Staged uploads require lower geometry memory mode');
  const { renderer, THREE } = window.__ctx, compile = renderer.compileAsync;
  renderer.compileAsync = async function (...args) {
    renderer.compileAsync = compile;
    await stageGeometryUploads(renderer, args[0], THREE, (state, detail) => phase('geometry-upload', state, detail));
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
