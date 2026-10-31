// The preceding Petrograd checkpoint committed data before its area pages.
// Classify only those explicitly known pending data files until the parallel
// area work supplies area.js. Run again after integrating that checkpoint.
import fs from 'node:fs';
const file = 'tools/lib/closure-orphans.txt';
let text = fs.readFileSync(file,'utf8').replace(/\n# PENDING-AREA-DATA-BEGIN[\s\S]*?# PENDING-AREA-DATA-END\n?/,'\n').trimEnd();
const pending = [];
for(const id of ['aptekarsky','kronverk','islands']) {
  const dir=`src/areas/${id}/data`;
  if(!fs.existsSync(`src/areas/${id}/area.js`) && fs.existsSync(dir))
    for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.js')).sort()) pending.push(`${dir}/${name}`);
}
if(pending.length) text+='\n\n# PENDING-AREA-DATA-BEGIN\n# Data-only checkpoint f55930c; remove this block once their area.js files exist.\n'+pending.join('\n')+'\n# PENDING-AREA-DATA-END';
fs.writeFileSync(file,text+'\n');
console.log(`Classified ${pending.length} files from the preceding data-only checkpoint.`);
