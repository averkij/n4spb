// npm run roads: runs the furniture audit, the surface audit and the ribbon audit one after the other (every one also runs when an earlier one fails) and exits non-zero when any failed.
// The audits cover the whole play area of the strip (layout.inPlay: the union of the eight play rectangles).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
// Okrug65's final dense network: 140 residual samples / 520977 (0.0269%),
// below the surface audit's 0.3% contract and the strip baseline's 0.0412%.
// Measured builder residue only; no extra material/geometry exemptions.
const surfaceBudget = process.env.AREA === 'okrug65' ? '140' : '120';
const runs = [
  ['roads-furniture-audit.mjs', '--strict', '--allow', 'GUARD_STONE,PROP,BIN,TREE,FACADE_COLLIDER'],
  ['roads-surface-audit.mjs', '--max-fail', surfaceBudget],                       // strip 2026-10-16: 91/221118; whole-city budget 2170
  ['streets-ribbon-audit.mjs', '--max-walls', '4', '--max-surf', '150'],         // walls / pavement strips laid over asphalt (docs/AGENT-BRIEF.md road integrity rules): the strip on 2026-10-16: 2 wall segments, 100 triangles (44 m2)
];
let code = 0;
for (const [script, ...args] of runs) {
  // Node's registered import-map loader belongs to this process. A child must
  // install it again or an area audit silently checks the parked strip data.
  const entry = process.env.AREA && process.env.AREA !== 'strip'
    ? [path.join(dir, 'area.mjs'), process.env.AREA, path.join(dir, script)]
    : [path.join(dir, script)];
  const r = spawnSync(process.execPath, ['--max-old-space-size=12288', ...entry, ...args], { stdio: 'inherit' });
  const c = r.status ?? 1;
  console.log(`[roads] ${script} exit ${c}`);
  if (c !== 0) code = 1;
}
console.log(code === 0 ? '[roads] OK' : '[roads] FAIL');
process.exit(code);
