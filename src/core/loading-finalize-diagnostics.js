// diagnostics.html scopes ONLY main.js imports here. Production imports and
// baking use the original modules. No geometry/material algorithm is copied.
import { batchStatic as batch } from './batch2.js';
import { splitInstanced as split } from './spatial.js';
import { batchFixtureCells as fixtures } from './fixture-cells.js';
import { compactStaticAttributes as compact } from './compact-static.js';
import { buildNDProxy as outline } from './ndproxy.js';
export { releasedStats } from './spatial.js';
export { NDLazy } from './ndproxy.js';

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
  const noAtlas = new URLSearchParams(location.search).get('diagatlas') === '0';
  if (new URLSearchParams(location.search).get('diagtexture') === '256') {
    phase('texture-cap', 'start');
    const stats = reduceCanvasTextures(root, window.__ctx?.dynamicRoot, 256);
    phase('texture-cap', 'end', stats);
  }
  return trace('batch', batch, [root, noAtlas ? { ...options, atlasTextures: false } : options], { atlasEnabled: !noAtlas });
}
export const splitInstanced = (...args) => trace('split-instances', split, args);
export const batchFixtureCells = (...args) => trace('fixture-cells', fixtures, args);
export const compactStaticAttributes = (...args) => trace('compact-attributes', compact, args);
export const buildNDProxy = (...args) => trace('outline-proxies', outline, args);
