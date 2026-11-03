// Panoramas may cross the local data extent, but must retain the exact source
// claim. A displaced panorama group must still fail the real audit.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
for(const mutant of [false,true]){
  const r=spawnSync(process.execPath,['tools/area.mjs','palace','tools/landmarks-groups-check.mjs',...(mutant?['--mutant-panorama']:[])],{encoding:'utf8'});
  assert.equal(r.status,mutant?1:0,r.stdout+r.stderr);
  if(mutant)assert(r.stdout.includes('panorama claim does not match its registered source group'));
}
console.log('PASS panorama extent audit: registered source claims pass; displaced source claims fail');
