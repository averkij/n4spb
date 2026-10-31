// Reconcile Sea Gates / Okrug 65 with every currently registered live neighbour.
// Rerun after adding the Petrograd island areas: new overlaps become paired
// gates and their priority is searched against the actual gate state machine.
// node tools/connect-coastal-areas.mjs
import fs from 'node:fs';
import { REGISTRY, GATES } from '../src/areas/registry.js';
import { createGateMachine, EDGE_DIRS, inUnion } from '../src/core/gates.js';
import { edgeLens, territoryProblems } from './lib/edge-geometry.mjs';

const COASTAL = ['morskie-vorota', 'okrug65'], PREFIX = 'coast-';
let source = fs.readFileSync('src/areas/registry.js', 'utf8')
  .replace(/\s*\/\/ COASTAL-GATES-BEGIN[\s\S]*?\/\/ COASTAL-GATES-END\n?/g, '\n')
  .replace(/\s*\/\/ COASTAL-GATE-ORDER-BEGIN[\s\S]*?\/\/ COASTAL-GATE-ORDER-END\n?/g, '\n');

for (const id of COASTAL) {
  const file = `src/areas/${id}/territory.json`;
  if (!fs.existsSync(file)) continue;
  const { rects } = JSON.parse(fs.readFileSync(file, 'utf8'));
  const problems = territoryProblems(rects); if (problems.length) throw new Error(`${id}: ${problems.join('; ')}`);
  REGISTRY[id].play = rects;
  const row = `REGISTRY[${JSON.stringify(id)}] = ${JSON.stringify(REGISTRY[id], null, 2)};`;
  const re = new RegExp(`REGISTRY\\["${id}"\\] = \\{[\\s\\S]*?\\n\\};`);
  if (!re.test(source)) throw new Error(`Cannot find registry row ${id}`);
  source = source.replace(re, row);
}

const live = Object.values(REGISTRY).filter(r => !r.dev && r.play?.length);
const overlap = (a, b) => a.play.some(p => b.play.some(q => p.x0 < q.x1 && q.x0 < p.x1 && p.z0 < q.z1 && q.z0 < p.z1));
const generated = [], seen = new Set();
for (const id of COASTAL) for (const other of live) {
  if (id === other.id || !overlap(REGISTRY[id], other)) continue;
  const pair = [id, other.id].sort(), key = pair.join('/'); if (seen.has(key)) continue; seen.add(key);
  for (const [from, to] of [pair, [...pair].reverse()]) generated.push({ id: `${PREFIX}${from}-${to}`, kind: 'edge', from, to, zone: 40, reverse: `${PREFIX}${to}-${from}` });
}
const edges = GATES.filter(g => g.kind === 'edge' && !g.id.startsWith(PREFIX)).concat(generated);
const affected = [...new Set(generated.flatMap(g => [g.from, g.to]))].sort();

// Validate the standard geometry contract, including bounce distance. A tiny
// accidental overlap must be fixed in the territory, rather than made into an
// unusable gate or given an easier assertion here.
for (const g of generated) {
  const lens = edgeLens(REGISTRY[g.from].play, REGISTRY[g.to].play);
  const near = lens.back.filter(d => d < 100).length / lens.back.length * 100;
  if (lens.works < 1000 || (lens.strips[0]?.len || 0) > 300 || near > 10)
    throw new Error(`${g.id}: inadequate seam: works=${lens.works}, dead=${lens.strips[0]?.len || 0}, bounce=${near.toFixed(2)}%`);
  console.log(`${g.id}: ${lens.works} m working boundary; worst dead ${lens.strips[0]?.len || 0} m; bounce ${near.toFixed(1)}%`);
}

const DT = 1 / 30;
function firstEligible(gates, sx, sz, ex, ez) {
  // Every single-row machine sees identical motion and clock. At the first
  // eligible frame, the complete machine chooses the first of these rows.
  // This caches exact state-machine results before trying permutations.
  const machines = gates.map(g => createGateMachine({ gates: [g], config: { graceS: 0 }, rectsOf: id => REGISTRY[id].play }));
  for (let i = 0; i < 2 / DT; i++) for (const m of machines) m.update({ dt: DT, x: sx, z: sz, mode: 'walk', blocked: false });
  const n = Math.max(1, Math.ceil(Math.hypot(ex - sx, ez - sz) / 1.5 / DT));
  for (let i = 0; i <= n; i++) {
    const x = sx + (ex - sx) * i / n, z = sz + (ez - sz) * i / n, matches = [];
    for (let k = 0; k < machines.length; k++) if (machines[k].update({ dt: DT, x, z, mode: 'walk', blocked: false }).offer) matches.push(gates[k].id);
    if (matches.length) return matches;
  }
  return [];
}

const orders = {};
for (const from of affected) {
  const own = edges.filter(g => g.from === from), trials = [], totals = new Map(own.map(g => [g.id, 0]));
  for (const g of own) {
    const points = edgeLens(REGISTRY[from].play, REGISTRY[g.to].play, { backMax: 0 }).points;
    const stride = Math.max(1, Math.floor(points.length / 40));
    for (let i = 0; i < points.length; i += stride) {
      const p = points[i], [dx, dz] = EDGE_DIRS[p.k], sx = p.x - 60 * dx, sz = p.z - 60 * dz;
      if (!inUnion(REGISTRY[from].play, sx, sz)) continue;
      const matches = firstEligible(own, sx, sz, p.x + dx, p.z + dz);
      if (!matches.length) throw new Error(`${g.id}: no gate at real working point ${p.x},${p.z}`);
      trials.push({ intended: g.id, matches }); totals.set(g.id, totals.get(g.id) + 1);
    }
    if (totals.get(g.id) < 10) throw new Error(`${g.id}: only ${totals.get(g.id)} working run-ups`);
  }
  const evaluate = order => {
    const counts = new Map(own.map(g => [g.id, 0]));
    for (const t of trials) if (order.find(id => t.matches.includes(id)) === t.intended) counts.set(t.intended, counts.get(t.intended) + 1);
    return { ok: own.every(g => counts.get(g.id) >= totals.get(g.id) * .5), counts };
  };
  let accepted = null, best = null;
  function visit(prefix, rest) {
    if (accepted) return;
    if (!rest.length) { const r = evaluate(prefix), min = Math.min(...own.map(g => r.counts.get(g.id) / totals.get(g.id))); if (!best || min > best.min) best = { min, order: prefix, counts: r.counts }; if (r.ok) accepted = { order: prefix, counts: r.counts }; return; }
    for (let i = 0; i < rest.length && !accepted; i++) visit(prefix.concat(rest[i]), rest.filter((_, j) => i !== j));
  }
  visit([], own.map(g => g.id));
  if (!accepted) throw new Error(`${from}: no gate priority gives every neighbour at least half of its working run-ups; best ${best.order.map(id => `${id}=${best.counts.get(id)}/${totals.get(id)}`).join(', ')}`);
  orders[from] = accepted.order;
  console.log(`priority ${from}: ${accepted.order.map(id => `${id}=${accepted.counts.get(id)}/${totals.get(id)}`).join(', ')}`);
}

const row = g => `  { id: '${g.id}', kind: 'edge', from: '${g.from}', to: '${g.to}', zone: 40, reverse: '${g.reverse}' },`;
const insertion = '  // g0 - the dev loop';
if (!source.includes(insertion)) throw new Error('Cannot find the gate insertion point');
source = source.replace(insertion, `  // COASTAL-GATES-BEGIN\n  // Generated by tools/connect-coastal-areas.mjs from all live overlaps.\n${generated.map(row).join('\n')}\n  // COASTAL-GATES-END\n${insertion}`);
source += `\n// COASTAL-GATE-ORDER-BEGIN\n// Exact priority search uses createGateMachine and the same working run-ups as\n// gates-test. Keep the source rows stable; apply only their per-area priority.\nconst COASTAL_GATE_ORDER = ${JSON.stringify(orders, null, 2)};\nfor (const [from, ids] of Object.entries(COASTAL_GATE_ORDER)) {\n  const slots = [];\n  for (let i = 0; i < GATES.length; i++) if (GATES[i].kind === 'edge' && GATES[i].from === from) slots.push(i);\n  const rows = new Map(slots.map(i => [GATES[i].id, GATES[i]]));\n  // A later island-area commit may add rows before this generator is rerun.\n  // Preserve every new row exactly once, then rerun the priority search.\n  const ordered = ids.map(id => rows.get(id)).filter(Boolean);\n  for (const i of slots) if (!ids.includes(GATES[i].id)) ordered.push(GATES[i]);\n  ordered.forEach((row, i) => { GATES[slots[i]] = row; });\n}\n// COASTAL-GATE-ORDER-END\n`;
fs.writeFileSync('src/areas/registry.js', source);
console.log(`Connected ${generated.length / 2} coastal neighbour pairs (${generated.length} directional gates).`);
