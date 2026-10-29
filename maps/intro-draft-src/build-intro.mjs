// Builds intro-data.json for maps/intro-draft.html from the cached Overpass responses in ./raw.
// Areas = the real municipal districts (admin_level 8, "округа") of Saint Petersburg and its towns, grouped by the 18 real districts (admin_level 5).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { here, raw, geomOf, dpRing, dp, ringAreaM2, bboxOf, extentM, toM, rpt, r5, chainWays, ringsFromWays, inRings, clipPolyline } from './lib.mjs';

const BBOX = [59.55, 29.40, 60.25, 30.90];     // S W N E
const W = BBOX[1], S = BBOX[0], E = BBOX[3], N = BBOX[2];
const bb = [W, S, E, N];
const CELL = 40;                                // metres per raster cell
const KXm = toM([1, 0])[0], KYm = toM([0, 1])[1];
const GW = Math.ceil((E - W) * KXm / CELL), GH = Math.ceil((N - S) * KYm / CELL);
const toG = (p) => [(p[0] - W) * KXm / CELL, (N - p[1]) * KYm / CELL];          // lon/lat -> fractional grid coords (y down)
const fromG = (x, y) => [W + x * CELL / KXm, N - y * CELL / KYm];
const B_KM2 = 3.947, B_LO = B_KM2 * 0.8, B_HI = B_KM2 * 1.2;

// ---------- rings from OSM elements
function relRings(rel) {
  const o = [], i = [];
  for (const m of rel.members || []) {
    if (m.type !== 'way' || !m.geometry) continue;
    (m.role === 'inner' ? i : o).push(geomOf(m.geometry));
  }
  return { outer: ringsFromWays(o).rings, inner: ringsFromWays(i).rings };
}
function elemRings(e) {
  if (e.type === 'way') {
    if (!e.geometry || e.geometry.length < 4) return null;
    const g = geomOf(e.geometry);
    const a = g[0], b = g[g.length - 1];
    if (a[0] !== b[0] || a[1] !== b[1]) return null;
    return { outer: [g], inner: [] };
  }
  if (e.type === 'relation') return relRings(e);
  return null;
}

// ---------- scanline fill (evenodd) of rings into a grid; fn(x, y) is called per covered cell
function fillRings(rings, fn) {
  const edges = [];
  let y0 = Infinity, y1 = -Infinity;
  for (const ring of rings) {
    const g = ring.map(toG);
    for (let i = 0, n = g.length; i < n; i++) {
      const a = g[i], b = g[(i + 1) % n];
      if (a[1] === b[1]) continue;
      edges.push(a[1] < b[1] ? [a[0], a[1], b[0], b[1]] : [b[0], b[1], a[0], a[1]]);
      y0 = Math.min(y0, a[1], b[1]); y1 = Math.max(y1, a[1], b[1]);
    }
  }
  if (!edges.length) return;
  const ys = Math.max(0, Math.floor(y0)), ye = Math.min(GH - 1, Math.ceil(y1));
  const buckets = new Map();
  for (const e of edges) {
    const a = Math.max(0, Math.floor(e[1] - 0.5)), b = Math.min(GH - 1, Math.ceil(e[3] - 0.5));
    for (let y = a; y <= b; y++) { let l = buckets.get(y); if (!l) buckets.set(y, l = []); l.push(e); }
  }
  for (let y = ys; y <= ye; y++) {
    const l = buckets.get(y); if (!l) continue;
    const yc = y + 0.5, xs = [];
    for (const e of l) if (yc >= e[1] && yc < e[3]) xs.push(e[0] + (yc - e[1]) / (e[3] - e[1]) * (e[2] - e[0]));
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const xa = Math.max(0, Math.ceil(xs[k] - 0.5)), xb = Math.min(GW - 1, Math.ceil(xs[k + 1] - 0.5) - 1);
      for (let x = xa; x <= xb; x++) fn(x, y);
    }
  }
}

// ---------- sea polygon from the coastline (as in the earlier map build)
function buildSea() {
  const c = raw('coast');
  const segs = c.elements.map((e) => ({ ids: e.nodes, pts: geomOf(e.geometry) }));
  const chains = chainWays(segs, true);
  const closed = chains.filter((c) => c.closed).map((c) => c.pts);
  const open = chains.filter((c) => !c.closed).map((c) => c.pts);
  const wdt = E - W, hgt = N - S, perim = 2 * (wdt + hgt), EPS = 1e-9;
  const tOf = (p) => {
    const dTop = Math.abs(p[1] - N), dRight = Math.abs(p[0] - E), dBot = Math.abs(p[1] - S), dLeft = Math.abs(p[0] - W);
    const m = Math.min(dTop, dRight, dBot, dLeft);
    if (m === dTop) return p[0] - W;
    if (m === dRight) return wdt + (N - p[1]);
    if (m === dBot) return wdt + hgt + (E - p[0]);
    return 2 * wdt + hgt + (p[1] - S);
  };
  const corners = [[0, [W, N]], [wdt, [E, N]], [wdt + hgt, [E, S]], [2 * wdt + hgt, [W, S]]];
  const pieces = [], islands = [];
  for (const r of closed) {
    if (r.every((p) => p[0] >= W && p[0] <= E && p[1] >= S && p[1] <= N)) islands.push(r);
    else for (const pc of clipPolyline(r, bb)) pieces.push(pc);
  }
  for (const ch of open) for (const pc of clipPolyline(ch, bb)) pieces.push(pc);
  const items = pieces.map((p, i) => ({ i, p, ts: tOf(p[0]), te: tOf(p[p.length - 1]), used: false }));
  const rings = [];
  for (const it of items) {
    if (it.used) continue;
    let ring = [], cur = it;
    for (;;) {
      cur.used = true; ring = ring.concat(cur.p);
      let best = null, bd = Infinity;
      for (const o of items) { const d = (o.ts - cur.te + perim) % perim; if (o.used && o !== it) continue; if (d < bd) { bd = d; best = o; } }
      const tEnd = cur.te, span = bd;
      const cs = corners.map(([t, pt]) => ({ d: (t - tEnd + perim) % perim, pt })).filter((c) => c.d > EPS && c.d < span - EPS).sort((a, b) => a.d - b.d);
      for (const c of cs) ring.push(c.pt);
      if (best === it) break;
      cur = best;
    }
    ring.push(ring[0]); rings.push(ring);
  }
  return { rings: rings.concat(islands) };
}

const log = (...a) => console.log(...a);

// ================================================================ load
const boundary = relRings(raw('boundary').elements[0]).outer;
const districts = raw('districts').elements.map((e) => ({ id: e.id, name: e.tags.name, ...relRings(e) }));
const moAll = raw('mo').elements;
const moTags = new Map(raw('mo_tags').elements.map((e) => [e.id, e]));
const places = raw('places2').elements;
log('mo', moAll.length, 'districts', districts.length, 'places', places.length);

// ---------- the sea and the inland water into grids
const sea = buildSea();
const water = new Uint8Array(GW * GH);                  // 1 = sea or lake / river polygon
fillRings(sea.rings, (x, y) => { water[y * GW + x] = 1; });
{
  const w = raw('water').elements;
  let n = 0;
  for (const e of w) {
    const r = elemRings(e); if (!r) continue;
    const bbp = bboxOf(r.outer.flat());
    if (extentM(r.outer.flat()) < 100) continue;         // ignore ponds under ~100 m
    const tmp = [];
    fillRings(r.outer.concat(r.inner), (x, y) => { tmp.push(y * GW + x); });
    for (const i of tmp) water[i] ^= 0;                   // (no-op; keep order explicit)
    for (const i of tmp) water[i] = 1;
    n++;
  }
  log('water polygons rasterised', n);
}

// ---------- the municipal districts
const cityRings = boundary;
const mos = [];
for (const e of moAll) {
  const t = e.tags || {}, name = t.name || '';
  const r = relRings(e);
  if (!r.outer.length) continue;
  const tg = moTags.get(e.id);
  const c = tg && tg.center ? [tg.center.lon, tg.center.lat] : (() => { const b = bboxOf(r.outer.flat()); return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; })();
  if (/поселение|городское поселение|сельское поселение/.test(name)) continue;       // Leningrad oblast
  if (!inRings(c, cityRings)) continue;                                           // not in the federal city
  mos.push({ id: e.id, rawName: name, nameEnOsm: t['name:en'] || '', type: t.admin_type || t.place || '', rings: r });
}
log('municipal districts in the city:', mos.length);

// ---------- manual edits of the area division (edits.json): merges of neighbouring districts (the 'cut' edits, street ends closed to the coast, are applied by build-overlap.mjs)
function unionRings(rA, rB) {
  const key = (p) => p[0].toFixed(7) + ',' + p[1].toFixed(7);
  const ccw = (r) => (ringAreaM2(r) > 0 ? r : r.slice().reverse());
  const edges = new Map(), pts = new Map();
  for (const ring of rA.outer.concat(rB.outer).map(ccw)) for (let i = 0, n = ring.length; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n]; const ka = key(a), kb = key(b); if (ka === kb) continue;
    pts.set(ka, a); pts.set(kb, b); edges.set(ka + '>' + kb, [ka, kb]);
  }
  for (const k of [...edges.keys()]) { const [a, b] = k.split('>'); const rk = b + '>' + a; if (edges.has(k) && edges.has(rk)) { edges.delete(k); edges.delete(rk); } }
  const out = new Map(); for (const [a, b] of edges.values()) { let l = out.get(a); if (!l) out.set(a, l = []); l.push(b); }
  const rings = [];
  for (const [start, ends] of out) while (ends.length) { const ring = [pts.get(start)]; let cur = ends.pop(), g = 0; while (cur !== start && g++ < 1e6) { ring.push(pts.get(cur)); const l = out.get(cur); if (!l || !l.length) break; cur = l.pop(); } if (ring.length >= 4) rings.push(ring); }
  return { outer: rings, inner: rA.inner.concat(rB.inner) };
}
const plainName = (n) => n.replace(/^округ\s+/i, '').replace(/\s+округ$/i, '').trim();
const EDITS = (() => { try { return JSON.parse(fs.readFileSync(path.join(here, 'edits.json'), 'utf8')); } catch (e) { return { merge: [] }; } })();
for (const mg of EDITS.merge || []) {
  const parts = mg.names.map((n) => mos.find((m) => plainName(m.rawName) === n));
  if (parts.some((p) => !p)) { log('edit: merge skipped, not found:', mg.names.join(' + ')); continue; }
  const before = parts.map((p) => p.rings.outer.length);
  let rings = parts[0].rings;
  for (const p of parts.slice(1)) {
    rings = unionRings(rings, p.rings);
    const at = mos.indexOf(p);
    // "stable": the last district fills the freed slot, so the index k of every other area (the registry mapId of the live areas, docs/AREAS.md, tools --k) does not move; without it the later areas shift down by one
    if (mg.stable) { const last = mos.pop(); if (last !== p) mos[at] = last; } else mos.splice(at, 1);
  }
  parts[0].rings = rings; parts[0].rawName = mg.ru; parts[0].nameEnOsm = mg.en || '';
  log('edit: merged', mg.names.join(' + '), '->', mg.ru, '| outer rings', before.join('+'), '->', rings.outer.length);
}


// rayon of each
for (const m of mos) {
  const b = bboxOf(m.rings.outer.flat());
  m.bbox = b;
  const c = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
  const tg = moTags.get(m.id); const p = tg && tg.center ? [tg.center.lon, tg.center.lat] : c;
  let ray = districts.find((d) => inRings(p, d.outer));
  if (!ray) ray = districts.find((d) => inRings(c, d.outer));
  m.rayon = ray ? ray.name : '?';
}

// label grid (index of the municipal district per cell) and land stats
const lab = new Int16Array(GW * GH).fill(-1);
mos.forEach((m, k) => { fillRings(m.rings.outer.concat(m.rings.inner), (x, y) => { lab[y * GW + x] = k; }); });
const cellKm2 = (CELL * CELL) / 1e6;
for (const [k, m] of mos.entries()) m._k = k;
const cnt = new Float64Array(mos.length), cntAll = new Float64Array(mos.length);
for (let i = 0; i < lab.length; i++) { const k = lab[i]; if (k < 0) continue; cntAll[k]++; if (!water[i]) cnt[k]++; }
// pole of inaccessibility on the land cells of each (chamfer distance transform over its bbox)
function labelPoint(k) {
  const m = mos[k], b = m.bbox;
  const [gx0, gy1] = toG([b[0], b[1]]), [gx1, gy0] = toG([b[2], b[3]]);
  const x0 = Math.max(0, Math.floor(gx0) - 1), x1 = Math.min(GW - 1, Math.ceil(gx1) + 1), y0 = Math.max(0, Math.floor(gy0) - 1), y1 = Math.min(GH - 1, Math.ceil(gy1) + 1);
  const w = x1 - x0 + 1, h = y1 - y0 + 1, d = new Float32Array(w * h);
  const INF = 1e9;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y + y0) * GW + (x + x0); d[y * w + x] = lab[i] === k && !water[i] ? INF : 0; }
  const A = 1, Bd = 1.4142;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = d[y * w + x]; if (!v) continue;
    if (x > 0) v = Math.min(v, d[y * w + x - 1] + A); if (y > 0) v = Math.min(v, d[(y - 1) * w + x] + A);
    if (x > 0 && y > 0) v = Math.min(v, d[(y - 1) * w + x - 1] + Bd); if (x < w - 1 && y > 0) v = Math.min(v, d[(y - 1) * w + x + 1] + Bd);
    d[y * w + x] = v;
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    let v = d[y * w + x]; if (!v) continue;
    if (x < w - 1) v = Math.min(v, d[y * w + x + 1] + A); if (y < h - 1) v = Math.min(v, d[(y + 1) * w + x] + A);
    if (x < w - 1 && y < h - 1) v = Math.min(v, d[(y + 1) * w + x + 1] + Bd); if (x > 0 && y < h - 1) v = Math.min(v, d[(y + 1) * w + x - 1] + Bd);
    d[y * w + x] = v;
  }
  let best = -1, bx = 0, by = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = d[y * w + x]; if (v < INF / 2 && v > best) { best = v; bx = x; by = y; } }
  if (best < 0) return { p: m.rings.outer[0][0], r: 0 };
  return { p: fromG(bx + x0 + 0.5, by + y0 + 0.5), r: best * CELL };
}

// save the rasters for the overlap build (build-overlap.mjs): water mask and the municipal district index per cell
fs.writeFileSync(path.join(here, 'raw', 'grid-water.bin'), Buffer.from(water));
fs.writeFileSync(path.join(here, 'raw', 'grid-lab.bin'), Buffer.from(lab.buffer, lab.byteOffset, lab.byteLength));
fs.writeFileSync(path.join(here, 'raw', 'grid.json'), JSON.stringify({ GW, GH, CELL, BBOX, areas: mos.length }));
// adjacency by shared border (cells)
const adj = new Map();
const addAdj = (a, b) => { if (a === b || a < 0 || b < 0) return; const key = a < b ? a * 1000 + b : b * 1000 + a; adj.set(key, (adj.get(key) || 0) + 1); };
for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
  const i = y * GW + x, k = lab[i]; if (k < 0 || water[i]) continue;
  if (x + 1 < GW) { const j = i + 1; if (!water[j]) addAdj(k, lab[j]); }
  if (y + 1 < GH) { const j = i + GW; if (!water[j]) addAdj(k, lab[j]); }
}

// ---------- names
const TR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
const translit = (s) => s.replace(/[А-Яа-яЁё]/g, (ch) => { const l = ch.toLowerCase(), t = TR[l] ?? ch; return ch !== l ? t.charAt(0).toUpperCase() + t.slice(1) : t; });
const cleanRu = (n) => {
  let s = n.replace(/^округ\s+/i, '').replace(/\s+округ$/i, '').replace(/^муниципальный округ\s+/i, '').trim();
  if (/^№/.test(s)) s = 'Округ ' + s;
  return s;
};
const EN_FIX = { 'Адмиралтейский': 'Admiralty', 'Дворцовый': 'Palace', 'Литейный': 'Liteyny', 'Сенной': 'Haymarket', 'Владимирский': 'Vladimirsky', 'Смольнинское': 'Smolninskoye', 'Коломна': 'Kolomna', 'Гавань': 'Gavan (Harbour)', 'Аптекарский остров': 'Apothecary Island', 'Остров Декабристов': 'Dekabristov Island', 'Васильевский': 'Vasilyevsky', 'Кронверкское': 'Kronverkskoye', 'Чкаловское': 'Chkalovskoye', 'Петровский': 'Petrovsky', 'Посадский': 'Posadsky', 'Введенский': 'Vvedensky', 'Лиговка-Ямская': 'Ligovka-Yamskaya', 'Семёновский': 'Semyonovsky', 'Измайловское': 'Izmaylovskoye', 'Екатерингофский': 'Yekateringofsky', 'Нарвский': 'Narvsky', 'Автово': 'Avtovo', 'Морские ворота': 'Sea Gate', 'Кронштадт': 'Kronstadt', 'Колпино': 'Kolpino', 'Пушкин': 'Pushkin', 'Павловск': 'Pavlovsk', 'Петергоф': 'Peterhof', 'Ломоносов': 'Lomonosov', 'Сестрорецк': 'Sestroretsk', 'Зеленогорск': 'Zelenogorsk', 'Стрельна': 'Strelna', 'Красное Село': 'Krasnoye Selo', 'Парголово': 'Pargolovo', 'Лисий Нос': 'Lisy Nos', 'Комарово': 'Komarovo' };
const RAY_EN = { 'Колпинский район': 'Kolpinsky', 'Пушкинский район': 'Pushkinsky', 'Московский район': 'Moskovsky', 'Красносельский район': 'Krasnoselsky', 'Петродворцовый район': 'Petrodvortsovy', 'Невский район': 'Nevsky', 'Фрунзенский район': 'Frunzensky', 'Адмиралтейский район': 'Admiralteysky', 'Василеостровский район': 'Vasileostrovsky', 'Выборгский район': 'Vyborgsky', 'Калининский район': 'Kalininsky', 'Кировский район': 'Kirovsky', 'Красногвардейский район': 'Krasnogvardeysky', 'Центральный район': 'Tsentralny', 'Петроградский район': 'Petrogradsky', 'Кронштадтский район': 'Kronshtadtsky', 'Курортный район': 'Kurortny', 'Приморский район': 'Primorsky' };

// neighbourhood names inside each municipal district (OSM place nodes)
const placeNodes = places.filter((p) => p.tags && p.tags.name && /^(suburb|neighbourhood|quarter|island)$/.test(p.tags.place)).map((p) => ({ n: p.tags.name, ne: p.tags['name:en'] || '', p: [p.lon, p.lat], k: p.tags.place }));
for (const m of mos) m.contains = [];
for (const pl of placeNodes) {
  const g = toG(pl.p); const x = Math.floor(g[0]), y = Math.floor(g[1]);
  if (x < 0 || y < 0 || x >= GW || y >= GH) continue;
  const k = lab[y * GW + x]; if (k >= 0) mos[k].contains.push(pl);
}

// ---------- the live areas (P Palace-Liteyny, S Smolninskoye, A Admiralty-Haymarket, V Vladimirsky-Ligovka, W Vasilyevsky-Okrug 7; docs/AREAS.md sections 13-15) in lon/lat from the registry (the parked strip and North are no longer drawn; 'area B' elsewhere on the page stays the size REFERENCE, the old North, 3.95 km2)
const REG = await import(new URL('../../src/areas/registry.js', import.meta.url).href);
const OR = { lon: 30.351279, lat: 59.932421 };
const KX0 = 111412.84 * Math.cos(OR.lat * Math.PI / 180) - 93.5 * Math.cos(3 * OR.lat * Math.PI / 180) + 0.118 * Math.cos(5 * OR.lat * Math.PI / 180);
const lat0 = OR.lat * Math.PI / 180;
const KY0 = 111132.954 - 559.822 * Math.cos(2 * lat0) + 1.175 * Math.cos(4 * lat0);
const unproj = (x, z) => [OR.lon + x / KX0, OR.lat - z / KY0];
// The live list comes from the registry: every row with a mapId that is not parked (docs/AREAS.md 13 / 15): palace P (98), smolny S (96), admiralty A (46), vladimirsky V (97), vasilyevsky W (48; V is taken). The letter is the badge on the page.
const LIVE_LETTER = { palace: 'P', smolny: 'S', admiralty: 'A', vladimirsky: 'V', vasilyevsky: 'W', gavan: 'G', morskoy: 'M', dekabristov: 'D' };
const liveKeys = Object.keys(REG.REGISTRY).filter((k) => REG.REGISTRY[k].mapId != null && !REG.REGISTRY[k].parked);
liveKeys.sort((a, b) => Object.keys(LIVE_LETTER).indexOf(a) - Object.keys(LIVE_LETTER).indexOf(b));
for (const k of liveKeys) if (!LIVE_LETTER[k]) throw new Error('registry row ' + k + ' has a mapId but no letter in LIVE_LETTER (build-intro.mjs)');
// union area of axis-aligned rectangles (the ST station rectangle overlaps the rows of its neighbours), km2
const unionKm2 = (rs) => {
  const xs = [...new Set(rs.flatMap((r) => [r.x0, r.x1]))].sort((a, b) => a - b); let s = 0;
  for (let i = 0; i + 1 < xs.length; i++) {
    const iv = rs.filter((r) => r.x0 <= xs[i] && r.x1 >= xs[i + 1]).map((r) => [r.z0, r.z1]).sort((a, b) => a[0] - b[0]);
    let end = -Infinity, len = 0; for (const [a, b] of iv) { if (b > end) { len += b - Math.max(a, end); end = b; } }
    s += len * (xs[i + 1] - xs[i]);
  }
  return s / 1e6;
};
const existing = [];
for (const key of liveKeys) {
  const letter = LIVE_LETTER[key], st = 'Live';
  const row = REG.REGISTRY[key];
  const rects = row.play.map((r) => [unproj(r.x0, r.z0), unproj(r.x1, r.z0), unproj(r.x1, r.z1), unproj(r.x0, r.z1)].map(rpt));
  const mark = new Uint8Array(GW * GH);
  for (const r of rects) fillRings([r], (x, y) => { mark[y * GW + x] = 1; });
  const km2 = unionKm2(row.play);
  const overlap = new Float64Array(mos.length);
  for (let i = 0; i < mark.length; i++) if (mark[i] && lab[i] >= 0 && !water[i]) overlap[lab[i]]++;
  // the edge gates of this area (the five-area graph, registry GATES): the letters of the live areas one walks into
  const edges = REG.GATES.filter((g) => g.kind === 'edge' && g.from === key && LIVE_LETTER[g.to]).map((g) => LIVE_LETTER[g.to]);
  existing.push({ id: letter, key, page: row.page, title: row.title, titleEn: row.titleEn, status: st, km2: Math.round(km2 * 100) / 100, rects, overlap,
    mapId: row.mapId, approxMB: row.approxMB, sights: row.sights, rectN: row.play.length, edges });
}

// ---------- the source project's coverage (the playable rectangles of D:/git2/agi-fun-tests/102_3d_piter, same frame) and its authored sights
let srcCov = null;
try { srcCov = JSON.parse(fs.readFileSync(path.join(here, 'raw', 'source-coverage.json'), 'utf8')); } catch (e) { log('no source coverage file'); }
const srcCnt = new Float64Array(mos.length), sightN = new Int16Array(mos.length), sightList = mos.map(() => []);
let srcRects = [], srcKm2 = 0;
if (srcCov) {
  srcRects = srcCov.regions.map((rg) => { const p = rg.playRect; return [unproj(p.x0, p.z0), unproj(p.x1, p.z0), unproj(p.x1, p.z1), unproj(p.x0, p.z1)].map(rpt); });
  const mark = new Uint8Array(GW * GH);
  for (const rc of srcRects) fillRings([rc], (x, y) => { mark[y * GW + x] = 1; });
  let n = 0;
  for (let i = 0; i < mark.length; i++) if (mark[i]) { n++; if (lab[i] >= 0 && !water[i]) srcCnt[lab[i]]++; }
  srcKm2 = Math.round(n * cellKm2 * 10) / 10;
  for (const sg of srcCov.sights) {
    const ll = unproj(sg.at[0], sg.at[1]); const g = toG(ll); const x = Math.floor(g[0]), y = Math.floor(g[1]);
    if (x < 0 || y < 0 || x >= GW || y >= GH) continue;
    const k = lab[y * GW + x]; if (k < 0) continue;
    sightN[k]++; sightList[k].push({ n: sg.name, b: sg.buildings || 0 });
  }
  log('source coverage: rectangles', srcRects.length, 'union km2', srcKm2, 'sights', srcCov.sights.length);
}

// ---------- output per area
const out = { meta: { cell: CELL, B_KM2, B_LO, B_HI, bbox: BBOX }, areas: [], rayons: [], existing: [], layers: {} };
const rayNames = [...new Set(mos.map((m) => m.rayon))];
const order = ['Центральный район', 'Адмиралтейский район', 'Василеостровский район', 'Петроградский район', 'Московский район', 'Фрунзенский район', 'Невский район', 'Красногвардейский район', 'Калининский район', 'Выборгский район', 'Приморский район', 'Кировский район', 'Красносельский район', 'Колпинский район', 'Пушкинский район', 'Петродворцовый район', 'Курортный район', 'Кронштадтский район'];
rayNames.sort((a, b) => (order.indexOf(a) + 100) % 100 - (order.indexOf(b) + 100) % 100);
const HUES = [222, 34, 160, 330, 12, 275, 190, 52, 130, 300, 95, 4, 245, 175, 60, 205, 340, 20];
const rayIdx = new Map(rayNames.map((r, i) => [r, i]));
mos.forEach((m, k) => {
  const km2 = cnt[k] * cellKm2;
  const nm = cleanRu(m.rawName);
  const lp = labelPoint(k);
  const simp = (rings, tol) => rings.map((r) => dpRing(r, tol)).filter(Boolean).filter((r) => extentM(r) > 60).map((r) => r.map(rpt));
  const outer = simp(m.rings.outer, 18), inner = simp(m.rings.inner, 18);
  const kind = km2 > B_KM2 * 1.5 ? 'big' : km2 > B_HI ? 'large' : km2 < B_LO ? 'small' : 'b';
  const nb = [];
  for (const [key, v] of adj) { const a = Math.floor(key / 1000), b = key % 1000; if (a === k) nb.push([b, v]); else if (b === k) nb.push([a, v]); }
  m.nb = nb.sort((a, b) => b[1] - a[1]);
  out.areas.push({
    k, osm: m.id, ru: nm, en: EN_FIX[nm] || m.nameEnOsm || translit(nm), raw: m.rawName,
    rayon: m.rayon, ray: rayIdx.get(m.rayon), km2: Math.round(km2 * 100) / 100, x: Math.round(km2 / B_KM2 * 100) / 100,
    kind, split: kind === 'big' ? Math.max(2, Math.round(km2 / B_KM2)) : 0,
    label: [r5(lp.p[0]), r5(lp.p[1])], lr: Math.round(lp.r),
    outer, inner,
    src: Math.round(100 * srcCnt[k] / Math.max(1, cnt[k])), srcKm2: Math.round(srcCnt[k] * cellKm2 * 100) / 100,
    sights: sightN[k], sightList: sightList[k].sort((p, q) => q.b - p.b).slice(0, 8).map((x) => x.n),
    contains: m.contains.slice(0, 8).map((p) => ({ ru: p.n, en: p.ne || translit(p.n) })),
    exist: existing.map((e) => ({ id: e.id, pct: Math.round((e.overlap[k] / Math.max(1, cnt[k])) * 100) })).filter((e) => e.pct > 0),
    nb: m.nb.slice(0, 6).map(([j, v]) => ({ k: j, len: Math.round(v * CELL) })),
  });
});
// merge suggestions: pair the small areas with their neighbours so that the merged area is close to B (same real district preferred)
{
  const A = out.areas, nbAll = (k) => mos[k].nb;               // full neighbour lists (by shared border)
  const grp = A.map((x, i) => ({ id: i, members: [i], sum: x.km2 }));
  const gOf = A.map((x, i) => i);
  const find = (i) => { while (gOf[i] !== i) { gOf[i] = gOf[gOf[i]]; i = gOf[i]; } return i; };
  const sumOf = (g) => grp[g].sum;
  const LIMIT = B_HI * 1.12;
  const cand = [];
  for (const x of A) if (x.kind === 'small') for (const [j, len] of nbAll(x.k)) {
    const y = A[j]; if (!y || y.k === x.k) continue;
    if (y.kind === 'small' && y.k < x.k) continue;                // each small-small pair once
    const sum = x.km2 + y.km2; if (sum > LIMIT) continue;
    const pen = (y.rayon === x.rayon ? 0 : 1.2) + (y.kind === 'small' ? 0 : 0.8);
    cand.push({ a: x.k, b: j, score: Math.abs(sum - B_KM2) + pen - Math.min(len, 4000) / 20000 });
  }
  cand.sort((p, q) => p.score - q.score);
  for (const c of cand) {
    const ga = find(c.a), gb = find(c.b);
    if (ga === gb) continue;
    if (sumOf(ga) + sumOf(gb) > LIMIT) continue;
    if (A[c.a].kind !== 'small' && A[c.b].kind !== 'small') continue;
    // never merge two groups that both already contain a non-small area
    gOf[gb] = ga; grp[ga].members.push(...grp[gb].members); grp[ga].sum += grp[gb].sum;
  }
  for (const x of A) {
    if (x.kind !== 'small') continue;
    const g = find(x.k), G = grp[g];
    x.mergeGroup = G.members.slice().sort((p, q) => p - q);
    x.mergeSum = Math.round(G.sum * 100) / 100;
    x.mergeLone = G.members.length === 1;
    if (x.mergeLone) {                                           // nobody to pair with inside the limit: the best neighbour anyway
      const cand2 = nbAll(x.k).map(([j, len]) => ({ j, len, sum: x.km2 + A[j].km2, same: A[j].rayon === x.rayon })).sort((p, q) => (q.same - p.same) || (q.len - p.len));
      if (cand2.length) { x.mergeGroup = [x.k, cand2[0].j]; x.mergeSum = Math.round(cand2[0].sum * 100) / 100; }
    }
  }
}
// shade within the real district: greedy colouring over same-district neighbours
for (const a of out.areas) a.shade = -1;
for (const a of [...out.areas].sort((p, q) => q.nb.length - p.nb.length)) {
  const used = new Set(a.nb.map((n) => out.areas[n.k]).filter((o) => o && o.rayon === a.rayon && o.shade >= 0).map((o) => o.shade));
  let s = 0; while (used.has(s)) s++; a.shade = s;
}
out.rayons = rayNames.map((r, i) => ({ id: i, ru: r.replace(' район', ''), ruFull: r, en: RAY_EN[r] || translit(r), hue: HUES[i % HUES.length], n: out.areas.filter((a) => a.rayon === r).length, km2: Math.round(out.areas.filter((a) => a.rayon === r).reduce((s, a) => s + a.km2, 0) * 10) / 10 }));
out.source = { rects: srcRects, km2: srcKm2, regions: srcRects.length, sights: srcCov ? srcCov.sights.length : 0 };
out.existing = existing.map((e) => ({ id: e.id, key: e.key, page: e.page, title: e.title, titleEn: e.titleEn, status: e.status, km2: e.km2, rects: e.rects, mapId: e.mapId, approxMB: e.approxMB, sights: e.sights, rectN: e.rectN, edges: e.edges }));
// the map areas that ARE a live scene (the card and the list show the badge); k of out.areas is the district index = the registry's mapId
for (const e of existing) { const a = out.areas.find((x) => x.k === e.mapId); if (!a) throw new Error('mapId ' + e.mapId + ' is not an area of the map'); a.live = e.id; }

// ---------- base layers (simplified)
const q = (pts) => pts.map(rpt);
// sea + big water polygons
out.layers.sea = sea.rings.map((r) => dpRing(r, 25)).filter(Boolean).filter((r) => extentM(r) > 120).map(q);
{
  const polys = [];
  for (const e of raw('water').elements) {
    const r = elemRings(e); if (!r) continue;
    const ext = extentM(r.outer.flat()); if (ext < 220) continue;
    const o = r.outer.map((x) => dpRing(x, 14)).filter(Boolean).map(q), i = r.inner.map((x) => dpRing(x, 14)).filter(Boolean).filter((x) => extentM(x) > 80).map(q);
    if (o.length) polys.push({ o, i });
  }
  out.layers.water = polys;
}
{
  const lines = [];
  for (const nm of ['rivers', 'c_rivers']) for (const e of raw(nm).elements) {
    if (!e.geometry) continue;
    const g = dp(geomOf(e.geometry), 12); if (g.length < 2) continue;
    const t = e.tags || {};
    lines.push({ n: t.name || '', w: t.waterway === 'river' ? 2 : 1, p: q(g) });
  }
  // keep each name+width once per identical start (dedupe duplicates between the two layers)
  const seen = new Set(); out.layers.rivers = lines.filter((l) => { const k = l.n + '|' + l.p[0] + '|' + l.p[l.p.length - 1]; if (seen.has(k)) return false; seen.add(k); return true; });
}
{
  const roads = [];
  for (const e of raw('main_roads').elements) {
    if (!e.geometry) continue; const t = e.tags || {};
    const g = dp(geomOf(e.geometry), 20); if (g.length < 2) continue;
    roads.push({ c: t.highway === 'trunk' ? 2 : 1, n: t.name || '', p: q(g) });
  }
  for (const e of raw('roads').elements) {
    if (!e.geometry) continue; const t = e.tags || {};
    const g = dp(geomOf(e.geometry), 20); if (g.length < 2) continue;
    roads.push({ c: 3, n: t.name || '', p: q(g) });
  }
  out.layers.roads = roads;
}
out.layers.rayons = districts.map((d) => ({ n: d.name, o: d.outer.map((x) => dpRing(x, 30)).filter(Boolean).map(q) }));
out.layers.parks = [];
for (const e of raw('c_parks').elements) {
  const r = elemRings(e); if (!r) continue;
  const o = r.outer.map((x) => dpRing(x, 8)).filter(Boolean).map(q); if (!o.length) continue;
  out.layers.parks.push({ n: (e.tags && e.tags.name) || '', o });
}

fs.writeFileSync(path.join(here, 'intro-data.json'), JSON.stringify(out));
const kb = (o) => (Buffer.byteLength(JSON.stringify(o)) / 1024) | 0;
log('areas', out.areas.length, 'KB', kb(out), 'layers KB', Object.fromEntries(Object.entries(out.layers).map(([k, v]) => [k, kb(v)])));
log('classes', out.areas.reduce((m, a) => (m[a.kind] = (m[a.kind] || 0) + 1, m), {}));
for (const a of out.areas.sort((p, q) => p.km2 - q.km2)) log(a.km2.toFixed(2).padStart(7), a.kind.padEnd(5), a.rayon.padEnd(24), a.ru, a.exist.map((e) => e.id + e.pct).join(','));
