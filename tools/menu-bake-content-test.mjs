// UI-only changes should not alter the baked world. Compare payload hashes to HEAD.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { REGISTRY } from '../src/areas/registry.js';
let changed=0,checked=0;
for(const row of Object.values(REGISTRY).filter(r=>!r.parked&&r.status!=='planned')){
 const file=`assets/${row.bake}manifest.json`;
 const before=JSON.parse(execFileSync('git',['show',`HEAD:${file}`],{encoding:'utf8',maxBuffer:10*1024*1024}));
 const after=JSON.parse(fs.readFileSync(file));
 if(before.revision===after.revision)continue;
 const diffs=[...new Set([...Object.keys(before.sha256),...Object.keys(after.sha256)])].filter(k=>before.sha256[k]!==after.sha256[k]);
 checked++;changed+=diffs.length;console.log(`${row.id}: ${diffs.length?diffs.join(', '):'identical world payloads'}`);
}
console.log(`${checked} rebuilt areas checked; ${changed} changed products`);
process.exitCode=changed?1:0;
