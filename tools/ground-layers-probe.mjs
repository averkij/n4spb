// Ground layers: which pre-batch meshes of the area's build (staticRoot) cover a point with a surface near the ground, bottom to top, with y, material, polygonOffset and owner chain.
//   node tools/area.mjs vasilyevsky tools/ground-layers-probe.mjs --pts "x,z;x,z" [--modules environment,streets,landmarksSmolensky] [--ymax 0.3]
//   node tools/area.mjs vasilyevsky tools/ground-layers-probe.mjs --grid x0,z0,x1,z1,step [--gap 0.015]       sweep: every grid point where two meshes of different owners / materials lie within --gap m of each other
//                                                                                                           (coplanar: the depth test cannot tell them apart; env-ground is under everything by polygonOffset and skipped)
// Reads what the modules built (CPU geometry), never the batched / baked scene: use it to find coplanar or near-coplanar layers (z-fighting) and two systems drawing the same ground.
import { buildWorld } from './lib/headless-world.mjs';
const argv = process.argv.slice(2); const opt = (k, d = null) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const mods = (opt('modules') || 'environment,streets,landmarksSmolensky').split(','); const YMAX = Number(opt('ymax', 0.3)), GAP = Number(opt('gap', 0.015));
const { ctx, THREE, errors } = await buildWorld({ modules: mods });
if (errors.length) console.log('build errors:', errors);
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
ctx.staticRoot.updateMatrixWorld(true);
// every upward ground triangle (all vertices below YMAX), binned by 8 m cells
const CELL = 8, bins = new Map(), tris = [];
ctx.staticRoot.traverse((o) => {
  if (!o.isMesh || o.isInstancedMesh || !o.geometry) return;
  const g = o.geometry, pos = g.attributes.position; if (!pos) return; if (!g.boundingBox) g.computeBoundingBox();
  const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld); if (bb.min.y > YMAX) return;
  const m = Array.isArray(o.material) ? o.material[0] : o.material; let chain = '', p = o; for (let i = 0; p && i < 3; i++, p = p.parent) chain += (p.name || p.type) + '<';
  const idx = g.index, nT = idx ? idx.count / 3 : pos.count / 3, info = { mat: m.name || m.type, po: m.polygonOffset ? `${m.polygonOffsetFactor}/${m.polygonOffsetUnits}` : '-', tr: m.transparent ? 'T' : '', dw: m.depthWrite === false ? 'nodw' : '', mesh: o.name || '', chain, col: m.color ? m.color.getHexString() : '', hidden: o.visible === false };
  if (info.hidden) return;
  for (let t = 0; t < nT; t++) {
    const i0 = idx ? idx.getX(t * 3) : t * 3, i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
    a.fromBufferAttribute(pos, i0).applyMatrix4(o.matrixWorld); b.fromBufferAttribute(pos, i1).applyMatrix4(o.matrixWorld); c.fromBufferAttribute(pos, i2).applyMatrix4(o.matrixWorld);
    if (Math.max(a.y, b.y, c.y) > YMAX || Math.min(a.y, b.y, c.y) < -0.5) continue;
    const d = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z); if (Math.abs(d) < 1e-12) continue;
    const T = { info, ax: a.x, ay: a.y, az: a.z, bx: b.x, by: b.y, bz: b.z, cx: c.x, cy: c.y, cz: c.z, d };
    const k = tris.push(T) - 1;
    const x0 = Math.floor(Math.min(a.x, b.x, c.x) / CELL), x1 = Math.floor(Math.max(a.x, b.x, c.x) / CELL), z0 = Math.floor(Math.min(a.z, b.z, c.z) / CELL), z1 = Math.floor(Math.max(a.z, b.z, c.z) / CELL);
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { const key = x * 65536 + z; let l = bins.get(key); if (!l) bins.set(key, (l = [])); l.push(k); }
  }
});
const at = (x, z) => {
  const out = [], l = bins.get(Math.floor(x / CELL) * 65536 + Math.floor(z / CELL)) || [];
  for (const k of l) {
    const t = tris[k], l1 = ((t.bz - t.cz) * (x - t.cx) + (t.cx - t.bx) * (z - t.cz)) / t.d, l2 = ((t.cz - t.az) * (x - t.cx) + (t.ax - t.cx) * (z - t.cz)) / t.d, l3 = 1 - l1 - l2;
    if (!(l1 >= -1e-6 && l2 >= -1e-6 && l3 >= -1e-6)) continue;
    out.push({ y: l1 * t.ay + l2 * t.by + l3 * t.cy, ...t.info });
  }
  return out.sort((p, q) => p.y - q.y);
};
const line = (r) => `  y=${r.y.toFixed(4)} ${r.mat} #${r.col} po=${r.po} ${r.tr}${r.dw}  ${r.mesh}  ${r.chain}`;
const pts = (opt('pts') || '').split(';').filter(Boolean).map((s) => s.split(',').map(Number));
for (const q of pts) { console.log(`--- (${q.join(', ')})`); for (const r of at(q[0], q[1])) console.log(line(r)); }
if (opt('grid')) {
  const [x0, z0, x1, z1, st] = opt('grid').split(',').map(Number), pairs = new Map(); let n = 0, bad = 0;
  for (let x = x0; x <= x1; x += st) for (let z = z0; z <= z1; z += st) {
    const L = at(x, z).filter((r) => r.mat !== 'env-ground' && r.y > 0.002); if (!L.length) continue; n++;
    let hit = false;
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      if (L[j].y - L[i].y > GAP) break; if (L[i].mat === L[j].mat && L[i].chain === L[j].chain) continue;
      hit = true; const k = `${L[i].chain.split('<')[0]}:${L[i].mat}(${L[i].po}) <> ${L[j].chain.split('<')[0]}:${L[j].mat}(${L[j].po})`; const e = pairs.get(k) || { n: 0, ex: [x, z], dy: [] }; e.n++; if (e.dy.length < 3) e.dy.push(+(L[j].y - L[i].y).toFixed(4)); pairs.set(k, e);
    }
    if (hit) bad++;
  }
  console.log(`grid ${st} m: ${n} covered points, ${bad} with two different layers within ${GAP} m`);
  for (const [k, e] of [...pairs.entries()].sort((p, q) => q[1].n - p[1].n).slice(0, 30)) console.log(`  ${String(e.n).padStart(6)}  ${k}  e.g. ${e.ex.map((v) => v.toFixed(1))}  dy ${e.dy}`);
}
process.exit(0);
