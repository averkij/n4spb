// diagnostics.html scopes ONLY main.js imports here. Production imports and
// baking use the original modules. No geometry/material algorithm is copied.
import { batchStatic as batch } from './batch2.js';
import { splitInstanced as split } from './spatial.js';
import { batchFixtureCells as fixtures } from './fixture-cells.js';
import { compactStaticAttributes as compact } from './compact-static.js';
import { buildNDProxy as outline } from './ndproxy.js';
export { releasedStats } from './spatial.js';
export { NDLazy } from './ndproxy.js';

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
  return trace('batch', batch, [root, noAtlas ? { ...options, atlasTextures: false } : options], { atlasEnabled: !noAtlas });
}
export const splitInstanced = (...args) => trace('split-instances', split, args);
export const batchFixtureCells = (...args) => trace('fixture-cells', fixtures, args);
export const compactStaticAttributes = (...args) => trace('compact-attributes', compact, args);
export const buildNDProxy = (...args) => trace('outline-proxies', outline, args);
