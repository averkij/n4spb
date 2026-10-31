// Run an audit on every shipping territory, including future registry additions.
import { spawnSync } from 'node:child_process';
import { REGISTRY } from '../src/areas/registry.js';
const [script,...args]=process.argv.slice(2);
if(!script)throw new Error('usage: node tools/each-live-area.mjs <tool> [args]');
const failed=[];
for(const a of Object.values(REGISTRY).filter(a=>!a.parked&&a.status!=='planned')){
 console.log('\nAREA '+a.id);
 const r=spawnSync(process.execPath,['tools/area.mjs',a.id,script,...args],{stdio:'inherit'});
 if(r.status!==0)failed.push(a.id);
}
console.log(failed.length?'FAILED: '+failed.join(', '):'Every live area passed');
process.exitCode=failed.length?1:0;
