// Strict deployment-only packing of generated JSON leaf modules. No game source is edited.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { MAX_JSON_BYTES, unpackJSON, emittedCodec } from './pages-data-codec.mjs';

export const CODEC_PATH='vendor/pages-data.js';
export const PACK_MANIFEST='vendor/pages-data-manifest.json';
const ALIAS='__pagesUnpackJSON';
const sha256=s=>createHash('sha256').update(s).digest('hex');

// Accept only comments/whitespace and complete export const NAME=JSON.parse("...");
// statements. JSON double-quoted literals deliberately exclude executable JS escapes,
// templates, expressions, revivers, imports, calls and other declarations.
export function parseGeneratedLeaf(source) {
  if(!/^\s*\/\/\s*GENERATED\b/i.test(source))return null;
  const rows=[];let i=0;
  const trivia=()=>{for(;;){while(/\s/.test(source[i]||'')&&i<source.length)i++;if(source.startsWith('//',i)){const e=source.indexOf('\n',i);i=e<0?source.length:e+1;}else if(source.startsWith('/*',i)){const e=source.indexOf('*/',i+2);if(e<0)return false;i=e+2;}else return true;}};
  while(trivia()&&i<source.length){
    const start=i,m=/^export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*JSON\s*\.\s*parse\s*\(\s*/.exec(source.slice(i));
    if(!m)return null;i+=m[0].length;const argStart=i;
    if(source[i++]!=='"')return null;
    let closed=false;while(i<source.length){const c=source[i++];if(c==='\\'){i++;continue;}if(c==='"'){closed=true;break;}if(c==='\n'||c==='\r')return null;}
    if(!closed)return null;const argEnd=i,literal=source.slice(argStart,argEnd);
    const end=/^\s*\)\s*;/.exec(source.slice(i));if(!end)return null;i+=end[0].length;
    let text;try{text=JSON.parse(literal);JSON.parse(text);}catch{return null;}
    if(Buffer.byteLength(text)>MAX_JSON_BYTES||Buffer.from(text).toString('utf8')!==text)return null;
    if(rows.some(r=>r.name===m[1])||m[1]===ALIAS||m[1]==='JSON')return null;
    rows.push({name:m[1],start,argStart,argEnd,text,literal});
  }
  return i===source.length&&rows.length?rows:null;
}

export function packLeaf(source, relativePath) {
  // Only generated data folders are eligible; hand-authored code stays verbatim.
  if(!/^src\/(?:.*\/)?data\/.+\.js$/.test(relativePath))return null;
  const rows=parseGeneratedLeaf(source);if(!rows)return null;
  const replacements=[];
  for(const row of rows){
    const raw=Buffer.from(row.text),encoded=gzipSync(raw,{level:9,mtime:0}).toString('base64');
    const packed=`${ALIAS}(${JSON.stringify(encoded)},${raw.length})`;
    // Check EVERY actual eligible export through the emitted codec's function,
    // including exports too small to benefit from packing.
    assert.deepStrictEqual(unpackJSON(encoded,raw.length),JSON.parse(row.text),`${relativePath}:${row.name} round trip`);
    if(raw.length>=1024&&packed.length<row.literal.length-128)replacements.push({...row,packed});
  }
  if(!replacements.length)return null;
  // Keep comments and declarations byte-for-byte; replace each JSON.parse call only.
  let out=source;
  for(const row of rows.slice().reverse()){
    const r=replacements.find(r=>r.name===row.name);if(!r)continue;
    const head=source.slice(row.start,row.argStart),callStart=row.start+head.lastIndexOf('JSON');
    const close=/^\s*\)/.exec(source.slice(row.argEnd));
    out=out.slice(0,callStart)+r.packed+out.slice(row.argEnd+close[0].length);
  }
  let helper=path.posix.relative(path.posix.dirname(relativePath),CODEC_PATH);if(!helper.startsWith('.'))helper='./'+helper;
  const insert=rows[0].start;
  out=out.slice(0,insert)+`import { unpackJSON as ${ALIAS} } from ${JSON.stringify(helper)};\n`+out.slice(insert);
  return {source:out,exports:rows.length,packedExports:replacements.length,helper};
}

function leaves(dir,prefix='src') {
  const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){assert(!e.isSymbolicLink(),'no symlinks in deployment source');const rel=prefix+'/'+e.name,p=path.join(dir,e.name);if(e.isDirectory())out.push(...leaves(p,rel));else if(e.name.endsWith('.js'))out.push(rel);}return out.sort();
}

export function packGeneratedData(root, site) {
  root=path.resolve(root);site=path.resolve(site);assert.notEqual(root,site,'deployment must be separate from source');
  assert(!site.startsWith(path.join(root,'src')+path.sep),'deployment must be outside source modules');
  const plan=[];let before=0,after=0,exports=0,packedExports=0;
  for(const rel of leaves(path.join(root,'src'))){
    const original=fs.readFileSync(path.join(root,rel),'utf8'),packed=packLeaf(original,rel);if(!packed)continue;
    const target=path.join(site,rel);assert.equal(fs.readFileSync(target,'utf8'),original,`deployment copy differs from source: ${rel}`);
    assert(!fs.lstatSync(target).isSymbolicLink()&&fs.realpathSync(target).startsWith(fs.realpathSync(site)+path.sep),'deployment file must stay inside its copy');
    const oldBytes=Buffer.byteLength(original),newBytes=Buffer.byteLength(packed.source);if(newBytes>=oldBytes)continue;
    plan.push({rel,target,original,...packed});before+=oldBytes;after+=newBytes;exports+=packed.exports;packedExports+=packed.packedExports;
  }
  if(plan.length){
    const codec=path.join(site,CODEC_PATH);assert(!fs.existsSync(codec),'deployment helper already exists');
    assert(fs.existsSync(path.join(site,'vendor/fflate/fflate.module.js')),'deployment requires the existing fflate vendor');
    const helper=emittedCodec();after+=Buffer.byteLength(helper);
    fs.writeFileSync(codec,helper);
    for(const row of plan)fs.writeFileSync(row.target,row.source);
    const manifest={schema:1,codec:{path:CODEC_PATH,sha256:sha256(helper)},vendor:{path:'vendor/fflate/fflate.module.js',sha256:sha256(fs.readFileSync(path.join(site,'vendor/fflate/fflate.module.js')))},modules:plan.map(row=>({path:row.rel,sourceSHA256:sha256(row.original),packedSHA256:sha256(row.source),exports:row.exports,packedExports:row.packedExports}))};
    const manifestText=JSON.stringify(manifest,null,1)+'\n';fs.writeFileSync(path.join(site,PACK_MANIFEST),manifestText);after+=Buffer.byteLength(manifestText);
    assert.equal(fs.readFileSync(codec,'utf8'),helper,'emitted decoder readback');
    for(const row of plan)assert.equal(sha256(fs.readFileSync(row.target)),sha256(row.source),`deployment write integrity: ${row.rel}`);
    // Source/bake inputs must remain byte-identical even after deployment writes.
    for(const row of plan)assert.equal(fs.readFileSync(path.join(root,row.rel),'utf8'),row.original,`source changed during deployment: ${row.rel}`);
  }
  return {modules:plan.length,exports,packedExports,before,after,saved:before-after,paths:plan.map(r=>r.rel)};
}

export function verifyPackedData(root,site) {
  const manifest=JSON.parse(fs.readFileSync(path.join(site,PACK_MANIFEST),'utf8'));assert.equal(manifest.schema,1);
  for(const item of[manifest.codec,manifest.vendor])assert.equal(sha256(fs.readFileSync(path.join(site,item.path))),item.sha256,item.path+' integrity');
  assert.equal(fs.readFileSync(path.join(site,CODEC_PATH),'utf8'),emittedCodec(),'exact emitted decoder');
  let exports=0;for(const row of manifest.modules){
    const original=fs.readFileSync(path.join(root,row.path),'utf8'),packed=fs.readFileSync(path.join(site,row.path),'utf8');
    assert.equal(sha256(original),row.sourceSHA256,row.path+' source authority');assert.equal(sha256(packed),row.packedSHA256,row.path+' deployment integrity');
    const expected=packLeaf(original,row.path);assert(expected);assert.equal(packed,expected.source,row.path+' deterministic lossless transform');exports+=expected.exports;
    assert.equal(path.posix.normalize(path.posix.join(path.posix.dirname(row.path),expected.helper)),CODEC_PATH,'helper resolves under project URL base');
  }
  return {modules:manifest.modules.length,exports};
}
