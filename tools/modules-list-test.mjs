// tools/modules-list-test.mjs - the MODULES parser (tools/modules-list.mjs) fails CLOSED: it feeds the bake-revision closure (tools/lib/closure.mjs), so a module name it cannot read would be built
// at run time but never enter the closure, and later edits to that module would not stale the area. Pure CPU, no node_modules.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { modulesFromSource, mainModules } from './modules-list.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('PASS', name); };
const src = (body) => `export const MODULES = [\n${body}\n];`;
ok('single, double and backtick quotes, several names per line, comments', () => assert.deepEqual(modulesFromSource(src("  'a', \"b\", // c\n  /* d */ `e`,\n  'f',"), 'x', 1), ['a', 'b', 'e', 'f']));
ok('a spread is refused', () => assert.throws(() => modulesFromSource(src("  'a',\n  ...rest,"), 'x', 1), /not a plain quoted name/));
ok('a computed entry is refused', () => assert.throws(() => modulesFromSource(src("  'a',\n  name + 'B',"), 'x', 1), /not a plain quoted name/));
ok('a missing array is refused', () => assert.throws(() => modulesFromSource('export const X = 1;', 'x', 1), /MODULES not found/));
ok('too few names are refused (min)', () => assert.throws(() => modulesFromSource(src("  'a',"), 'x', 5), /parsed to 1 names/));
ok('every live and parked area parses to its real list', () => {
  const ids = ['strip', ...fs.readdirSync(path.join(root, 'src/areas'), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)];
  let seen = 0;
  for (const id of ids) { if (id !== 'strip' && !fs.existsSync(path.join(root, 'src/areas', id, 'area.js'))) continue; assert.ok(mainModules(id).length >= 5, id); seen++; }
  assert.ok(seen >= 6, 'areas parsed: ' + seen);
});
console.log(`\nALL ${n} PASSED`);
