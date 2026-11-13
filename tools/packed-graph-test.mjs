// Route and append parity against the previous array-based A* on the full baked graph.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { decodeBaked } from '../src/core/baked-codec.js';
import { PackedEdges, PackedAdjacency } from '../src/world/people/packed-graph.js';
const root = new URL('../assets/baked/', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('manifest.json', root)));
const bytes = gunzipSync(fs.readFileSync(new URL(manifest.files['nav-medium'], root)));
const data = decodeBaked(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const N = data.N, cols = data.edges, nn = N.x.length;
const E = new PackedEdges(cols), adj = new PackedAdjacency(nn, E);
const original = E.map(e => e), lists = Array.from({length:nn},()=>[]);
original.forEach((e,i)=>{lists[e.a].push(i);lists[e.b].push(i);});
for(let i=0;i<nn;i++)assert.deepEqual([...adj[i]],lists[i]);
for(let i=0;i<E.length;i++)assert.deepEqual(E[i],original[i]);
const comp = new Int32Array(nn); // Permit searches in every component; unreachable routes still return null.
const oldRoute = (N,E,adj,comp,nn) => { const nav = {};
  const gS = new Float32Array(nn + 64), fromE = new Int32Array(nn + 64), stamp = new Int32Array(nn + 64); let curStamp = 0;
  let heapN = [], heapF = [];
  const hpush = (n, f) => { let i = heapN.length; heapN.push(n); heapF.push(f); while (i > 0) { const p = (i - 1) >> 1; if (heapF[p] <= f) break; heapN[i] = heapN[p]; heapF[i] = heapF[p]; i = p; } heapN[i] = n; heapF[i] = f; };
  const hpop = () => { const n0 = heapN[0], n = heapN.pop(), f = heapF.pop(); const sz = heapN.length; if (sz) { let i = 0; for (;;) { let c = 2 * i + 1; if (c >= sz) break; if (c + 1 < sz && heapF[c + 1] < heapF[c]) c++; if (heapF[c] >= f) break; heapN[i] = heapN[c]; heapF[i] = heapF[c]; i = c; } heapN[i] = n; heapF[i] = f; } return n0; };
  /** shortest route (node ids) from a to b; opts.noCross forbids zebra edges; returns null when unreachable */
  const HW = 1.18;                                                                 // heuristic weight (the lattice edges cost 1.0-1.22 per metre): slightly greedy A*, ~3x fewer expansions
  nav.route = (a, b, opts = {}) => {
    if (a < 0 || b < 0) return null; if (a === b) return [a];
    if (comp[a] !== comp[b]) return null;                                         // different components: no route (and no exhaustive search)
    curStamp++; heapN = []; heapF = []; gS[a] = 0; stamp[a] = curStamp; fromE[a] = -1; hpush(a, 0);
    const bx = N.x[b], bz = N.z[b]; let guard = 0;
    while (heapN.length && guard++ < 60000) {
      const u = hpop(); if (u === b) break;
      const gu = gS[u];
      for (const ei of adj[u]) {
        const e = E[ei]; if (opts.noCross && e.kind === 1) continue;
        const v = e.a === u ? e.b : e.a, g = gu + e.cost + (opts.noise ? opts.noise(ei) : 0);
        if (stamp[v] !== curStamp || g < gS[v]) { gS[v] = g; stamp[v] = curStamp; fromE[v] = ei; hpush(v, g + HW * Math.hypot(N.x[v] - bx, N.z[v] - bz)); }
      }
    }
    if (stamp[b] !== curStamp) return null;
    const out = []; let v = b; while (v !== a) { out.push(v); const e = E[fromE[v]]; v = e.a === v ? e.b : e.a; } out.push(a); out.reverse(); return out;
  };
  return nav.route;
};
const source = fs.readFileSync(new URL('../src/world/people/nav.js',import.meta.url),'utf8');
const routeFactory = new Function('N','E','adj','comp','nn', 'const nav={},hyp=(a,b)=>Math.sqrt(a*a+b*b);'+source.slice(source.indexOf('  const gS ='),source.indexOf('  /** the edge between'))+'return nav.route;');
const current = routeFactory(N,E,adj,comp,nn);
const reference = oldRoute(N,original,lists,comp,nn);
let seed=1827, checked=0;
const random=()=>((seed=Math.imul(seed,1664525)+1013904223|0)>>>0)/4294967296;
for(let i=0;i<120;i++){
 const a=Math.floor(random()*nn), b=i%3===0?original[Math.floor(random()*E.length)].b:Math.min(nn-1,a+1+Math.floor(random()*100));
 for(const opts of [{},{noCross:true},{noise:ei=>(ei%13)*.125}]){
  assert.deepEqual(current(a,b,opts),reference(a,b,opts),`route ${a} -> ${b}`);checked++;
 }
}
assert.deepEqual(current(12,12),[12]);assert.equal(current(-1,0),null);
// Station builders add nodes and edges after baked hydration; growth must preserve the baked columns.
const oldLength=E.length, oldFirst=cols.a[0];
adj.push([]);E.push({a:0,b:nn,len:1,kind:0,cid:-1,cost:1});adj.append(0,oldLength);adj.append(nn,oldLength);
assert.deepEqual([...adj[nn]],[oldLength]);assert.equal(adj[0].at(-1),oldLength);
adj.rebuild();assert.deepEqual([...adj[nn]],[oldLength]);assert.equal(adj[0].at(-1),oldLength);
assert.equal(cols.a.length,oldLength);assert.equal(cols.a[0],oldFirst);
console.log(`RESULT: OK - ${nn} nodes, ${oldLength} edges, exact adjacency and ${checked} route comparisons; append/rebuild preserves bake.`);

// Exercise the no-bake builder, including capacity growth and tied alternatives.
const smallN={x:[],z:[]}, smallE=new PackedEdges(), smallAdj=new PackedAdjacency(0,smallE), oldE=[], oldAdj=[];
for(let i=0;i<180;i++){smallN.x.push(i%15);smallN.z.push(Math.floor(i/15));smallAdj.push([]);oldAdj.push([]);}
for(let i=0;i<165;i++)for(const b of [i+1,i+15]){
 const edge={a:i,b,len:1,kind:i%7===0?1:0,cid:i%7===0?i:-1,cost:1};
 const id=smallE.length;smallE.push(edge);smallAdj.append(i,id);smallAdj.append(b,id);oldE.push(edge);oldAdj[i].push(id);oldAdj[b].push(id);
}
for(let i=0;i<180;i++)assert.deepEqual([...smallAdj[i]],oldAdj[i]);
const smallComp=new Int32Array(180), aRoute=routeFactory(smallN,smallE,smallAdj,smallComp,180), bRoute=oldRoute(smallN,oldE,oldAdj,smallComp,180);
for(let i=0;i<100;i++){const a=i%180,b=(i*29)%180;for(const opts of [{},{noCross:true}])assert.deepEqual(aRoute(a,b,opts),bRoute(a,b,opts));}
console.log('RESULT: OK - generator growth, ordered ties and no-cross routing.');
