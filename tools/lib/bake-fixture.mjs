// TEST HELPER (tools/bake-manifest-check-test.mjs, bake-plan-test.mjs, bake-publish-test.mjs): a tiny repository on disk with two live areas (alpha, beta) and one parked (gamma), valid under the REAL closure
// rules (its src/main.js carries the real `./world/${n}.js` template), and fake bakes of it published by the real publishArea. No GPU, no browser, no node_modules.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRevisionContext, areaRevision } from '../baked-revision.mjs';
import { inputsOf, REQUIRED } from './bake-status.mjs';
import { publishArea } from './bake-publish.mjs';
import { areaDir } from './revision-module.mjs';

const page = (id) => `<!doctype html>\n<html lang="en" data-area="${id}">\n<head>\n<script type="importmap">\n{ "imports": { "./src/world/area.js": "./src/areas/${id}/area.js", "three": "https://cdn.example/three.js" } }\n</script>\n</head>\n<body>\n<script type="module" src="./src/main.js"></script>\n</body>\n</html>\n`;
export const REGISTRY_TEXT = `export const REGISTRY = {
  alpha: { id: 'alpha', page: 'index.html', bake: 'baked/alpha/' },
  beta: { id: 'beta', page: 'beta.html', bake: 'baked/beta/' },
  gamma: { id: 'gamma', page: 'gamma.html', bake: 'baked/gamma/', parked: true },
  delta: { id: 'delta', page: 'delta.html', bake: 'baked/delta/', status: 'planned' },
};
`;
export function miniTree() {
  const area = (id, mods) => `export const AREA = '${id}';\nexport const MODULES = [\n${mods.map((m) => `  '${m}',`).join('\n')}\n];\n`;
  return {
    'package-lock.json': JSON.stringify({ packages: { '': {}, 'node_modules/three': { version: '0.170.0', integrity: 'sha512-AAAA' } } }),
    'index.html': page('alpha'), 'beta.html': page('beta'), 'gamma.html': page('gamma'),
    'src/main.js': "import * as THREE from 'three';\nimport { AREA, MODULES } from './world/area.js';\nimport './core/engine.js';\nimport './core/gates.js';\nconst imports = new Map(MODULES.map((n) => { const p = import(`./world/${n}.js`); return [n, p]; }));\n",
    'src/world/area.js': area('default', ['zz']),
    'src/areas/alpha/area.js': area('alpha', ['m1', 'm2']), 'src/areas/beta/area.js': area('beta', ['m1']), 'src/areas/gamma/area.js': area('gamma', ['m1']),
    'src/areas/registry.js': REGISTRY_TEXT,
    'src/core/engine.js': "import './helper.js';\nexport const e = 1;\n", 'src/core/helper.js': 'export const h = 1;\n',
    'src/core/gates.js': 'export const G = 1;\n', 'src/core/baked-revision.js': "export const BAKED_REVISION = 'x';\n",
    'src/world/m1.js': 'export const m1 = 1;\n', 'src/world/m2.js': "import './alpha-only.js';\nexport const m2 = 1;\n", 'src/world/alpha-only.js': 'export const a = 1;\n',
  };
}
export function writeTree(root, tree) {
  for (const [rel, content] of Object.entries(tree)) {
    const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true });
    if (content === null) fs.rmSync(f, { force: true }); else fs.writeFileSync(f, content);
  }
}
/** a fresh temp repository with the mini tree; remove() deletes it */
export function makeRoot(tree = miniTree()) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'n4spb-bake-'));
  writeTree(root, tree);
  return { root, remove() { fs.rmSync(root, { recursive: true, force: true }); } };
}
export const KEYS = [...REQUIRED, 'field-qP', 'street-surfaces-2_-5'];
/** fake products for `files` of an area directory: { files, sizes, sha256 } (random bytes; the "gzip" is whatever lands on disk) */
export function fakeProducts(dir, revision, keys = KEYS) {
  fs.mkdirSync(dir, { recursive: true });
  const files = {}, sizes = {}, sha256 = {};
  for (const k of keys) {
    const name = `${k}.${revision}.bin.gz`, buf = crypto.randomBytes(256 + (k.length * 7));
    fs.writeFileSync(path.join(dir, name), buf);
    files[k] = name; sizes[k] = { raw: buf.length * 3, gzip: buf.length }; sha256[k] = crypto.createHash('sha256').update(buf).digest('hex');
  }
  return { files, sizes, sha256 };
}
/** publishes a fake bake of `id` on the CURRENT tree through the real publishArea; returns { revision, manifest, ... } */
export function fakeBake(root, id, { fault, keys, bakeSeconds = 321 } = {}) {
  const ctx = createRevisionContext(root), row = ctx.row(id), info = areaRevision(root, id, ctx);
  const dir = areaDir(root, row), p = fakeProducts(dir, info.revision, keys);
  const res = publishArea({ root, row, revision: info.revision, ...p, inputs: inputsOf(ctx, id, info), closure: { files: info.files, bytes: info.bytes }, bakeSeconds, rows: ctx.rows(), fault });
  return { revision: info.revision, row, dir, ...res };
}
export const readJSON = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
export function mutateJSON(f, fn) { const j = readJSON(f); fn(j); fs.writeFileSync(f, JSON.stringify(j, null, 2)); }
export const manifestPath = (root, id) => path.join(root, 'assets', 'baked', id, 'manifest.json');
