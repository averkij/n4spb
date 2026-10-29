// The module list of the page (src/main.js MODULES, in build order) for the headless tools: the audits must build what the page builds, so they read the list
// instead of keeping their own copy (the copies went stale once: landmark modules were missing from the road audits).
// The strip keeps its list in src/main.js; another area exports MODULES from its area module (src/areas/<id>/area.js, docs/AREAS.md): tools/area.mjs sets AREA=<id>.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** The MODULES list of a source text (`file` is only for the messages); `min` is the least plausible count (the real areas have far more; a test fixture may pass 1). */
export function modulesFromSource(src, file, min = 5) {
  const m = src.match(/export const MODULES = \[([\s\S]*?)\n\];/);
  if (!m) throw new Error(`modules-list: MODULES not found in ${file}`);
  // fail closed: every token of the array must be a quoted module name (any quote, any layout); anything else (a spread, a computed entry, a form this parser does not know) is an error,
  // because a module that is built but never enters the closure would let its later edits slip past the bake revision
  const body = m[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const name = /(['"`])[A-Za-z0-9_]+\1/g;
  const list = [...body.matchAll(/(['"`])([A-Za-z0-9_]+)\1/g)].map((x) => x[2]);
  const rest = body.replace(name, '').replace(/[\s,]/g, '');
  if (rest) throw new Error(`modules-list: MODULES of ${file} holds something that is not a plain quoted name: ${JSON.stringify(rest.slice(0, 60))}`);
  if (list.length < min) throw new Error(`modules-list: MODULES of ${file} parsed to ${list.length} names`);
  return list;
}
/** Every module of the page's MODULES list, in order (area: default process.env.AREA or 'strip'). */
export function mainModules(area = process.env.AREA || 'strip') {
  const file = area === 'strip' ? 'src/main.js' : `src/areas/${area}/area.js`;
  return modulesFromSource(fs.readFileSync(path.join(root, file), 'utf8'), file);
}
/** The dynamic modules (no static street furniture / ground surfaces of their own). */
export const DYNAMIC = ['metro', 'traffic', 'people', 'wildlife', 'drive'];
