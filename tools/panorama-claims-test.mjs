// Shared arch/detail streams cannot conceal missing shells or a second main
// building. Exercise the real claim auditor and real panorama/city builders.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
for(const mutant of [null,'citydraw:r2612859','undraw:r2612859']){
  const r=spawnSync(process.execPath,['tools/area.mjs','palace','tools/claims-draw-audit.mjs','--modules','landmarksRiverfront,city',...(mutant?['--mutant',mutant]:[])],{encoding:'utf8',maxBuffer:16*1024*1024});
  assert.equal(r.status,mutant?1:0,r.stdout+r.stderr);
  console.log(`PASS panorama claim audit ${mutant||'normal shared architectural details'}`);
}
