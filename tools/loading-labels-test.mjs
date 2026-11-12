// The loading bar must name every built module in Russian, on every area page.
// Fail when a new module would fall back to an internal JS identifier.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import { mainModules } from './modules-list.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const main = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
const literal = main.match(/^const LABELS = \{([\s\S]*?)^\};/m);
if (!literal) throw new Error('Cannot find the base loading labels in src/main.js');
const base = runInNewContext(`({${literal[1]}})`);
const areaRoot = path.join(root, 'src/areas');
const ids = fs.readdirSync(areaRoot).filter(id => fs.existsSync(path.join(areaRoot, id, 'area.js')));
const failures = [];
let count = 0;
for (const id of ['strip', ...ids]) {
  const local = id === 'strip' ? {} : (await import(pathToFileURL(path.join(areaRoot, id, 'area.js')).href)).LABELS || {};
  for (const name of mainModules(id)) {
    const label = local[name] || base[name];
    count++;
    if (typeof label !== 'string' || !/[А-ЯЁа-яё]/.test(label) || /\blandmarks[A-Z]/.test(label))
      failures.push(`${id}/${name}: ${JSON.stringify(label)}`);
  }
}
if (failures.length) {
  console.error(`Missing or non-Russian preloader labels (${failures.length}):\n${failures.join('\n')}`);
  process.exitCode = 1;
} else console.log(`Loading labels: ${count} module uses across ${ids.length + 1} area pages have Russian text`);
