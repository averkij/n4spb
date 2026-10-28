// Checks intro-data.json (run after the whole rebuild) against what the edits of edits.json promise. Exit code 1 on a failure.
//   node check-edits.mjs [path to intro-data.json]
// 1  every merge: the merged area is there once and its parts are gone; a "stable" merge leaves the live areas at the registry mapId
// 2  the walkable territory (fp) of a merged area reaches at most REACH_M beyond the bbox of its own land (before the 'cut' of Bolshoy prospekt V.O. the south-west tip of Okrug 7 reached 1.75 km west along the harbour)
import fs from 'node:fs';
import path from 'node:path';
import { here, toM } from './lib.mjs';

const D = JSON.parse(fs.readFileSync(process.argv[2] || path.join(here, 'intro-data.json'), 'utf8'));
const EDITS = JSON.parse(fs.readFileSync(path.join(here, 'edits.json'), 'utf8'));
const REACH_M = 450;
const KX = toM([1, 0])[0], KY = toM([0, 1])[1];
const bbox = (rs) => { const b = [1e9, 1e9, -1e9, -1e9]; for (const r of rs) for (const p of r) { b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); } return b; };
const reachM = (a) => { const c = bbox(a.outer), f = bbox(a.fp); return Math.round(Math.max((c[0] - f[0]) * KX, (c[1] - f[1]) * KY, (f[2] - c[2]) * KX, (f[3] - c[3]) * KY)); };
const fails = [];
const plain = (n) => n.replace(/^округ\s+/i, '').trim();

for (const mg of EDITS.merge || []) {
  const merged = D.areas.filter((a) => a.ru === mg.ru);
  if (merged.length !== 1) { fails.push(`merge ${mg.ru}: ${merged.length} areas of that name (want 1)`); continue; }
  for (const n of mg.names.slice(1)) if (D.areas.some((a) => plain(a.ru) === n)) fails.push(`merge ${mg.ru}: the part ${n} is still an area of its own`);
  if (mg.stable) for (const e of D.existing) { const a = D.areas[e.mapId]; if (!a || a.live !== e.id) fails.push(`merge ${mg.ru}: the live area ${e.id} is not at k=${e.mapId} any more`); }
}
// the area of the cut: Okrug 7 (before the merge) or the merged Vasilyevsky-Okrug 7
for (const a of D.areas) if (a.ru === 'Округ № 7' || a.ru === 'Васильевский–Округ № 7') { const r = reachM(a); if (r > REACH_M) fails.push(`${a.ru}: the territory reaches ${r} m beyond its land (max ${REACH_M})`); else console.log(`ok ${a.ru}: reach ${r} m`); }
console.log(`areas ${D.areas.length}, land ${D.areas.reduce((s, a) => s + a.km2, 0).toFixed(2)} km2`);
if (fails.length) { console.error('FAIL\n ' + fails.join('\n ')); process.exit(1); }
console.log('check-edits ok');
