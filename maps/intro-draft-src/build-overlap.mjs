// Applies the AREA OVERLAP RULES (docs/AREAS.md section 12) to the draft map and writes the result into intro-data.json. Run after build-intro.mjs and build-streets.mjs.
//   R2  border streets belong to both areas, and each area reaches ONE block (at most 8 cells = 320 m deep) across the border street into the neighbour
//   R3  where >= 3 areas meet (a junction, a square, a station) the blocks around it belong to ALL the areas that meet there
//   R4  bridges between areas belong to both; R5 water is reachable: every water cell belongs to the areas whose shore is within 320 m of the nearest one (max 2 km)
import fs from 'node:fs';
import path from 'node:path';
import { here, raw, geomOf, dp, rpt, toM } from './lib.mjs';
import { GW, GH, CELL, fromG, cellOf, toG, drawLine, traceRings } from './grid.mjs';

const D = JSON.parse(fs.readFileSync(path.join(here, 'intro-data.json'), 'utf8'));
const A = D.areas, NA = A.length;
const bin = (n) => { const b = fs.readFileSync(path.join(here, 'raw', n)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.length); };
const water = new Uint8Array(bin('grid-water.bin'));
const lab = new Int16Array(bin('grid-lab.bin'));
if (water.length !== GW * GH || lab.length !== GW * GH) throw new Error('grid size mismatch: rerun build-intro.mjs');
const cellKm2 = CELL * CELL / 1e6;
const DEPTH = 8, JR = 4;                                      // cells: the depth of "one block", the radius of a junction
const log = (...a) => console.log(...a);
const EDITS = (() => { try { return JSON.parse(fs.readFileSync(path.join(here, 'edits.json'), 'utf8')); } catch (e) { return {}; } })();

// ------------------------------------------------------------------ streets and canals as barriers; the bridges
const barrier = new Uint8Array(GW * GH);
const DRIVE = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential', 'unclassified', 'living_street']);
const bridges = [];
const byName = new Map();                                        // street name -> Map(way id -> points), for the 'cut' edits
const addWay = (e) => {
  const t = e.tags || {}; if (!e.geometry || e.geometry.length < 2) return;
  const pts = geomOf(e.geometry);
  if (t.name && t.highway && DRIVE.has(t.highway)) { let m = byName.get(t.name); if (!m) byName.set(t.name, m = new Map()); m.set(e.id, pts); }
  if (t.bridge && t.bridge !== 'no' && t.highway) bridges.push({ id: e.id, name: t.name || '', hw: t.highway, pts });
  if (!t.highway || !DRIVE.has(t.highway)) return;
  if (t.tunnel && t.tunnel !== 'no') return;
  drawLine(pts, (i) => { barrier[i] = 1; });
};
const tryRaw = (n) => { try { return raw(n).elements; } catch (e) { return []; } };
const SRC_ROADS = 'D:/git2/agi-fun-tests/102_3d_piter/data/osm-raw/roads.json';
if (fs.existsSync(SRC_ROADS)) for (const e of JSON.parse(fs.readFileSync(SRC_ROADS, 'utf8')).elements) addWay(e);
for (const n of ['main_roads', 'roads', 'c_streets', 'secondary', 'tertiary']) for (const e of tryRaw(n)) addWay(e);
for (const n of ['rivers', 'c_rivers']) for (const e of tryRaw(n)) { const t = e.tags || {}; if (e.geometry && /^(river|canal)$/.test(t.waterway || '')) drawLine(geomOf(e.geometry), (i) => { barrier[i] = 1; }); }
log('bridge ways', bridges.length);

// 'cut' edits (edits.json): close the gap between the END of a named street and the coast, so the two faces beside the street end stop being one face (see README). { street, end: 'sw' | 'n' | ... (compass of the chain end, default every end), to: 'coast' (the nearest water cell) | [lon, lat], maxM }
{
  const DIR = { n: [0, 1], s: [0, -1], e: [1, 0], w: [-1, 0], ne: [1, 1], nw: [-1, 1], se: [1, -1], sw: [-1, -1] };
  const KXc = toM([1, 0])[0], KYc = toM([0, 1])[1];
  for (const ct of EDITS.cut || []) {
    const ways = byName.get(ct.street);
    if (!ways) { log('edit: cut skipped, street not found:', ct.street); continue; }
    const key = (p) => p[0].toFixed(7) + ',' + p[1].toFixed(7), deg = new Map(), at = new Map();
    for (const pts of ways.values()) pts.forEach((p, i) => { const k = key(p); at.set(k, p); deg.set(k, (deg.get(k) || 0) + (i === 0 || i === pts.length - 1 ? 1 : 2)); });
    let ends = [...deg].filter(([, d]) => d === 1).map(([k]) => at.get(k));      // the ends of the chain (nodes that only one way ends at)
    if (ct.end && DIR[ct.end]) { const v = DIR[ct.end], sc = (p) => p[0] * KXc * v[0] + p[1] * KYc * v[1]; ends = [ends.reduce((b, p) => (!b || sc(p) > sc(b) ? p : b), null)].filter(Boolean); }
    for (const p of ends) {
      let to = Array.isArray(ct.to) ? ct.to : null;
      if (!to) {                                                  // the nearest water cell within maxM
        const c = toG(p), cx = Math.floor(c[0]), cy = Math.floor(c[1]), R = Math.ceil((ct.maxM || 300) / CELL);
        let bd = Infinity;
        for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= GW || y >= GH || !water[y * GW + x]) continue; const d = Math.hypot(x + 0.5 - c[0], y + 0.5 - c[1]); if (d < bd) { bd = d; to = fromG(x + 0.5, y + 0.5); } }
      }
      if (!to) { log('edit: cut skipped, no water within', ct.maxM || 300, 'm of the end of', ct.street, p.join(',')); continue; }
      let n = 0; drawLine([p, to], (i) => { barrier[i] = 1; n++; });
      log('edit: cut', ct.street, 'end', p.join(','), '->', to.map((v) => v.toFixed(5)).join(','), n, 'cells');
    }
  }
}

// ------------------------------------------------------------------ blocks: the faces of the street network
const blk = new Int32Array(GW * GH);
const owner = [0], bsize = [0];
{
  const stack = new Int32Array(GW * GH);
  let nb = 0;
  for (let s = 0; s < GW * GH; s++) {
    if (blk[s] || water[s] || barrier[s] || lab[s] < 0) continue;
    nb++; let sp = 0, n = 0; stack[sp++] = s; blk[s] = nb;
    const cnt = new Map();
    while (sp) {
      const i = stack[--sp]; n++;
      const k = lab[i]; cnt.set(k, (cnt.get(k) || 0) + 1);
      const x = i % GW;
      const nbs = [x > 0 ? i - 1 : -1, x < GW - 1 ? i + 1 : -1, i - GW, i + GW];
      for (const j of nbs) if (j >= 0 && j < GW * GH && !blk[j] && !water[j] && !barrier[j] && lab[j] >= 0) { blk[j] = nb; stack[sp++] = j; }
    }
    let best = -1, bc = -1; for (const [k, c] of cnt) if (c > bc) { bc = c; best = k; }
    owner.push(best); bsize.push(n);
  }
  log('blocks', nb);
}

// ------------------------------------------------------------------ helpers
const ext = A.map(() => new Set());                              // cells an area reaches beyond its own land
const tally = A.map(() => new Map());                           // area -> Map(neighbour -> cells taken)
const core = (a, i) => lab[i] === a && !water[i];
function window(i, r) {                                          // blocks and owners within r cells of cell i
  const x = i % GW, y = (i / GW) | 0, bl = new Set(), ow = new Set();
  for (let dy = -r; dy <= r; dy++) { const yy = y + dy; if (yy < 0 || yy >= GH) continue; for (let dx = -r; dx <= r; dx++) { const xx = x + dx; if (xx < 0 || xx >= GW) continue; const b = blk[yy * GW + xx]; if (b) { bl.add(b); ow.add(owner[b]); } } }
  return { bl, ow };
}
function growInto(seeds, b, depth) {                              // the cells of block b within `depth` cells (4-connected) of the street cells `seeds`
  const seen = new Map(), q = [];
  for (const s of seeds) { const x = s % GW, y = (s / GW) | 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue; const j = yy * GW + xx; if (blk[j] === b && !seen.has(j)) { seen.set(j, 1); q.push(j); } } }
  for (let h = 0; h < q.length; h++) {
    const i = q[h], d = seen.get(i); if (d >= depth) continue; const x = i % GW;
    for (const j of [x > 0 ? i - 1 : -1, x < GW - 1 ? i + 1 : -1, i - GW, i + GW]) if (j >= 0 && j < GW * GH && blk[j] === b && !seen.has(j)) { seen.set(j, d + 1); q.push(j); }
  }
  return q;
}
const give = (a, cells, from) => { for (const i of cells) if (!core(a, i)) ext[a].add(i); if (from >= 0) tally[a].set(from, (tally[a].get(from) || 0) + cells.length); };

// ------------------------------------------------------------------ R2: border streets and one block across
const border = new Map();                                        // street cell -> owners (>= 2 areas within 2 cells)
const pairSeeds = new Map();                                     // blockId * 128 + area -> the street cells that touch it
for (let i = 0; i < GW * GH; i++) {
  if (!barrier[i] || water[i] || lab[i] < 0) continue;
  const { bl, ow } = window(i, 2); if (ow.size < 2) continue;
  const owners = [...ow]; border.set(i, owners);
  for (const a of owners) { if (!core(a, i)) ext[a].add(i); }
  for (const b of bl) for (const a of owners) if (owner[b] !== a) { const k = b * 128 + a; let l = pairSeeds.get(k); if (!l) pairSeeds.set(k, l = []); l.push(i); }
}
for (const [k, seeds] of pairSeeds) { const a = k % 128, b = (k - a) / 128; give(a, growInto(seeds, b, DEPTH), owner[b]); }
log('border street cells', border.size, 'block pairs', pairSeeds.size);

// ------------------------------------------------------------------ R3: junctions of >= 3 areas
const jc = [];
for (const [i] of border) { const { bl, ow } = window(i, JR); if (ow.size >= 3) jc.push({ i, bl, ow }); }
const jIdx = new Map(jc.map((c, n) => [c.i, n])), jseen = new Uint8Array(jc.length), junctions = [];
for (let s = 0; s < jc.length; s++) {
  if (jseen[s]) continue;
  const comp = [s]; jseen[s] = 1;
  for (let h = 0; h < comp.length; h++) { const c = jc[comp[h]], x = c.i % GW, y = (c.i / GW) | 0; for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue; const n = jIdx.get(yy * GW + xx); if (n !== undefined && !jseen[n]) { jseen[n] = 1; comp.push(n); } } }
  const S = new Set(), BL = new Set(), seeds = [];
  let sx = 0, sy = 0; for (const n of comp) { const c = jc[n]; for (const a of c.ow) S.add(a); for (const b of c.bl) BL.add(b); seeds.push(c.i); sx += c.i % GW; sy += (c.i / GW) | 0; }
  if (S.size < 3) continue;
  for (const b of BL) { const cells = growInto(seeds, b, DEPTH); for (const a of S) if (owner[b] !== a) give(a, cells, owner[b]); else give(a, [], -1); }
  for (const a of S) give(a, seeds, -1);
  const p = fromG(sx / comp.length + 0.5, sy / comp.length + 0.5);
  junctions.push({ p: rpt(p), areas: [...S].sort((x, y) => x - y), n: S.size, cells: comp.length });
}
log('junctions (>= 3 areas)', junctions.length, 'of which 4+:', junctions.filter((j) => j.n >= 4).length);

// ------------------------------------------------------------------ R4: bridges between areas
const outBridges = [];
{
  const ownersNear = (pt) => { const i = cellOf(pt); const s = new Set(); if (i < 0) return s; const x = i % GW, y = (i / GW) | 0; for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue; const j = yy * GW + xx; if (lab[j] >= 0 && !water[j]) s.add(lab[j]); } return s; };
  for (const br of bridges) {
    const a = ownersNear(br.pts[0]), b = ownersNear(br.pts[br.pts.length - 1]);
    const S = new Set([...a, ...b]); if (S.size < 2) continue;
    const cells = new Set(); drawLine(br.pts, (i) => { cells.add(i); const x = i % GW; for (const j of [i - 1, i + 1, i - GW, i + GW]) if (j >= 0 && j < GW * GH && (j % GW === x || Math.abs((j % GW) - x) === 1)) cells.add(j); });
    for (const k of S) give(k, [...cells], -1);
    if (!br.name && !DRIVE.has(br.hw)) continue;
    outBridges.push({ n: br.name, hw: br.hw, areas: [...S].sort((x, y) => x - y), p: dp(br.pts, 6).map(rpt) });
  }
  log('bridges between areas', outBridges.length, 'named', new Set(outBridges.filter((b) => b.n).map((b) => b.n)).size);
}

// ------------------------------------------------------------------ R5: water
const R = 50, TOL = 8;                                           // reach 2 km, the other bank counts when within 320 m of the nearest
const A1 = new Int16Array(GW * GH).fill(-1), A2 = new Int16Array(GW * GH).fill(-1), A3 = new Int16Array(GW * GH).fill(-1);
const D1 = new Uint8Array(GW * GH).fill(255), D2 = new Uint8Array(GW * GH).fill(255), D3 = new Uint8Array(GW * GH).fill(255);
function ins(i, a, d) {
  if (d < D1[i]) { A3[i] = A2[i]; D3[i] = D2[i]; A2[i] = A1[i]; D2[i] = D1[i]; A1[i] = a; D1[i] = d; }
  else if (d < D2[i]) { A3[i] = A2[i]; D3[i] = D2[i]; A2[i] = a; D2[i] = d; }
  else if (d < D3[i]) { A3[i] = a; D3[i] = d; }
}
{
  const seeds = A.map(() => []);
  for (let i = 0; i < GW * GH; i++) { const a = lab[i]; if (a < 0 || water[i]) continue; const x = i % GW; let w = false; for (const j of [x > 0 ? i - 1 : -1, x < GW - 1 ? i + 1 : -1, i - GW, i + GW]) if (j >= 0 && j < GW * GH && water[j]) { w = true; break; } if (w) seeds[a].push(i); }
  const stamp = new Int16Array(GW * GH).fill(-1);
  for (let a = 0; a < NA; a++) {
    let front = [];
    for (const s of seeds[a]) { const x = s % GW; for (const j of [x > 0 ? s - 1 : -1, x < GW - 1 ? s + 1 : -1, s - GW, s + GW]) if (j >= 0 && j < GW * GH && water[j] && stamp[j] !== a) { stamp[j] = a; ins(j, a, 1); front.push(j); } }
    for (let d = 2; d <= R && front.length; d++) {
      const next = [];
      for (const i of front) { const x = i % GW; for (const j of [x > 0 ? i - 1 : -1, x < GW - 1 ? i + 1 : -1, i - GW, i + GW, x > 0 ? i - GW - 1 : -1, x < GW - 1 ? i - GW + 1 : -1, x > 0 ? i + GW - 1 : -1, x < GW - 1 ? i + GW + 1 : -1]) if (j >= 0 && j < GW * GH && water[j] && stamp[j] !== a) { stamp[j] = a; ins(j, a, d); next.push(j); } }
      front = next;
    }
  }
}
const wz = A.map(() => []);
let waterAssigned = 0, waterOpen = 0;
for (let i = 0; i < GW * GH; i++) {
  if (!water[i]) continue;
  if (A1[i] < 0) { waterOpen++; continue; }
  waterAssigned++; wz[A1[i]].push(i);
  if (A2[i] >= 0 && D2[i] <= D1[i] + TOL) wz[A2[i]].push(i);
  if (A3[i] >= 0 && D3[i] <= D1[i] + TOL) wz[A3[i]].push(i);
}
log('water cells: assigned', waterAssigned, 'open (beyond 2 km of any shore)', waterOpen);

// ------------------------------------------------------------------ output
const coreCells = A.map(() => []);
for (let i = 0; i < GW * GH; i++) { const a = lab[i]; if (a >= 0 && !water[i]) coreCells[a].push(i); }
for (const a of A) {
  const k = a.k, E = ext[k];
  const fp = new Set(coreCells[k]); for (const i of E) fp.add(i);
  const extOnly = [...E].filter((i) => !core(k, i));
  a.fp = traceRings(fp, 22, 80);
  a.ext = traceRings(extOnly, 24, 80);
  a.wz = traceRings(wz[k], 32, 220);
  a.fpKm2 = Math.round(fp.size * cellKm2 * 100) / 100;
  a.extKm2 = Math.round(extOnly.length * cellKm2 * 100) / 100;
  a.wzKm2 = Math.round(wz[k].length * cellKm2 * 10) / 10;
  a.ovl = [...tally[k]].map(([n, c]) => ({ k: n, km2: Math.round(c * cellKm2 * 100) / 100 })).filter((x) => x.km2 >= 0.01).sort((p, q) => q.km2 - p.km2).slice(0, 8);
}
// name the junctions by the nearest authored sight of the source project
let sights = [];
try {
  const sc = JSON.parse(fs.readFileSync(path.join(here, 'raw', 'source-coverage.json'), 'utf8'));
  const OR = { lon: 30.351279, lat: 59.932421 }, lat0 = OR.lat * Math.PI / 180;
  const KX0 = 111412.84 * Math.cos(lat0) - 93.5 * Math.cos(3 * lat0) + 0.118 * Math.cos(5 * lat0), KY0 = 111132.954 - 559.822 * Math.cos(2 * lat0) + 1.175 * Math.cos(4 * lat0);
  sights = sc.sights.map((s) => ({ n: s.name, p: [OR.lon + s.at[0] / KX0, OR.lat - s.at[1] / KY0] }));
} catch (e) { /* no source coverage */ }
const KXm = toM([1, 0])[0], KYm = toM([0, 1])[1];
for (const j of junctions) {
  let best = null, bd = 450;
  for (const s of sights) { const d = Math.hypot((s.p[0] - j.p[0]) * KXm, (s.p[1] - j.p[1]) * KYm); if (d < bd) { bd = d; best = s.n; } }
  if (best) j.near = best;
}
D.junctions = junctions; D.bridges = outBridges;
D.rules = { depthM: DEPTH * CELL, junctionRadiusM: JR * CELL, waterReachM: R * CELL, waterBankM: TOL * CELL };
fs.writeFileSync(path.join(here, 'intro-data.json'), JSON.stringify(D));
const kb = (o) => (Buffer.byteLength(JSON.stringify(o)) / 1024) | 0;
log('KB fp', kb(A.map((a) => a.fp)), 'ext', kb(A.map((a) => a.ext)), 'wz', kb(A.map((a) => a.wz)), 'total', (fs.statSync(path.join(here, 'intro-data.json')).size / 1024) | 0);
const j4 = junctions.filter((j) => j.n >= 4).sort((p, q) => q.n - p.n);
log('4+ area junctions:'); for (const j of j4.slice(0, 14)) log('  ', j.p.join(','), j.n, j.near || '-', j.areas.map((k) => A[k].ru).join(' / '));
const mos = A.find((a) => a.ru === 'Дворцовый–Литейный') || A[0];
log(mos.ru, 'core km2', mos.km2, 'footprint', mos.fpKm2, 'overlap', mos.extKm2, 'water', mos.wzKm2, JSON.stringify(mos.ovl.map((o) => A[o.k].ru + ' ' + o.km2)));
