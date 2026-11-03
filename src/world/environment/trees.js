// environment/trees.js - the trees and shrubs of central Saint Petersburg in July: placement (from the OSM tree nodes / rows, the gardens, the courtyards, the Fontanka
// embankment) and the instanced meshes with wind sway and distance LOD. Adapted from the Yakutsk sibling (trees.js).
// Species (docs/research/streets.md section 6, fontanka.md section D / spec 10): small-leaved lime (the main park / embankment tree, young 5-6 m rows on the west bank of
// the Fontanka, old 15-20 m giants in the gardens), Norway maple, elm, ash, English oak, horse chestnut, balsam poplar, silver birch, clipped 'Globosum' maple balls on
// a clear stem (Vosstaniya Sq), rowan / bird cherry and lilac / privet shrubs in courtyards, blue spruce + birch in the Anichkov Palace garden.
// NONE on Nevsky Prospekt itself (the historic centre has no street trees: OSM has 5 within 25 m of the whole avenue); the clipped ball maples of Vosstaniya Sq are the exception.
// Where trunks stand (all tested against field.free: never in buildings, carriageways + parking pockets, the paving beside the roads (unless the tree is a pavement tree or
// the spot is a lawn verge), footways, the squares' paving, water + the quay strip, pitches, parking lots, crossings, bus stops, signals, doors, benches, monuments, fences,
// the metro shafts and entrances, nor on the hero / view corridors):
//   OSM tree nodes     the 285 mapped trees (balls near Hotel Oktyabrskaya), tree rows (Pushkinskaya, Zhukovskogo ...: lime / maple / ash, 8-11 m apart)
//   embankment         the west bank of the Fontanka: a row of young limes on the pavement at the facade line (6.5 m apart, 5-6 m tall); a few old limes / chestnuts in front of
//                      Fontanka 44 / 46; none between the road and the water
//   gardens            GREEN park / grass lawns get scattered specimens (lime, maple, elm, ash, oak ...), "wood" polygons thickets, the Anichkov garden spruce + birch
//   courtyards         1-3 trees in the building holes (well-yards: 8-10 m maple / ash / birch / rowan) + a sparse scatter on unbuilt lawn patches
// Output: ctx.services.environment.trees = [{x, z, r (crown radius), h, tr (trunk radius), sp, shrub?}], solid trunk colliders in the play area.
import * as THREE from 'three';
import { mergedMedianAt } from '../lib/road-plan.js';
import { createTreeInstanceWriter } from './tree-instances.js';
import { BUILDINGS, GREEN, EXTENT, TREES, TREE_ROWS } from '../data/city.js';
import * as L from '../layout.js';
import { isOwned } from '../lib/claims.js';
import { HOOKS, WATER as AREA_WATER } from '../lib/area-tables.js';
import { SPECIES, FAMILIES, canopyGeometry, trunkGeometry } from './treegeo.js';
import { canopyMaterial, coniferMaterial, trunkMaterial } from './leafmat.js';
import { riverBanks, waterBanks } from './river.js';
import { hash2, clamp, polyArea, polyBox, pointInPoly, sstep, lonLatToXZ } from './util.js';

// ---------------------------------------------------------------- leaf colours (sRGB, the instance colour; cel lighting makes lit ~ 1.4x)
const LEAF = {
  lime: ['#4f7a2e', '#5a8434', '#467028', '#62893a', '#3f6a2a'],
  maple: ['#5e9a35', '#6aa43c', '#548e2f', '#74a840', '#5a9234'],
  elm: ['#4a7430', '#527c36', '#446c2c', '#58803a'],
  ash: ['#5a8a38', '#639240', '#4e7e30', '#6a9a44'],
  oak: ['#4a6e2c', '#53773a', '#42642a', '#5a7e3a'],
  chestnut: ['#3f6a3f', '#386038', '#46743f', '#3a6838'],
  poplar: ['#3f6b2a', '#4a7633', '#365e24'],
  birch: ['#668f3a', '#5e9a35', '#729a42', '#628a38', '#6b9440'],
  ball: ['#5fae3a', '#68b543', '#58a636'],
  spruce: ['#3f6b66', '#46746e', '#386058', '#2d5a4a', '#355f50'],
  rowan: ['#53783d', '#5d8446', '#678f4c'],
  shrub: ['#52763a', '#5f8641', '#456b32', '#6a9248', '#4e7a3a'],
};
const MIX = {
  yard: { mapleA: 0.26, ash: 0.15, limeB: 0.1, birchA: 0.13, birchB: 0.1, elm: 0.05, rowan: 0.12, shrub: 0.09 },
  green: { limeA: 0.2, limeB: 0.12, mapleA: 0.16, elm: 0.1, ash: 0.1, oak: 0.08, birchA: 0.08, chestnut: 0.06, poplar: 0.05, spruceA: 0.05 },
  anichkov: { spruceA: 0.3, spruceB: 0.12, birchA: 0.18, birchB: 0.1, limeA: 0.12, mapleA: 0.1, chestnut: 0.04, shrub: 0.04 },
  rows: { limeA: 0.6, mapleA: 0.25, ash: 0.15 },
  osm: { limeA: 0.24, mapleA: 0.2, limeB: 0.12, ash: 0.1, elm: 0.07, birchA: 0.1, chestnut: 0.05, poplar: 0.06, rowan: 0.06 },
  wood: { birchA: 0.2, mapleA: 0.2, ash: 0.15, limeB: 0.15, poplar: 0.1, oak: 0.08, elm: 0.07, shrub: 0.05 },
};
const LOD_D = [42, 150, 360];

function pick(R, table) {
  let tot = 0; for (const k in table) tot += table[k];
  let x = R() * tot; for (const k in table) { x -= table[k]; if (x <= 0) return k; }
  return Object.keys(table)[0];
}

// ---------------------------------------------------------------- bark textures
function barkTexture(ctx, kind) {
  return ctx.tex.draw(128, 256, (g, w, h) => {
    const r = ctx.rng('bark-pb-' + kind);
    const furrows = (base, dark, n, wmin) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      for (let i = 0; i < n; i++) { const x = r() * w; g.strokeStyle = dark.replace('A', (0.35 + r() * 0.35).toFixed(2)); g.lineWidth = wmin + r() * 4; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 32) g.lineTo(x + Math.sin(y * 0.07 + i) * 5 + (r() - 0.5) * 4, y); g.stroke(); }
    };
    if (kind === 'birch') {
      g.fillStyle = '#ece8dc'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(150,145,135,${0.06 + r() * 0.1})`; g.fillRect(r() * w, 0, 2 + r() * 8, h); }
      for (let i = 0; i < 52; i++) {
        const x = r() * w, y = r() * h, ww = 8 + r() * 26, hh = 2 + r() * 5;
        g.fillStyle = `rgba(34,31,29,${0.75 + r() * 0.2})`; g.beginPath(); g.ellipse(x, y, ww / 2, hh / 2, (r() - 0.5) * 0.25, 0, 6.3); g.fill();
        if (x + ww / 2 > w) { g.beginPath(); g.ellipse(x - w, y, ww / 2, hh / 2, 0, 0, 6.3); g.fill(); }
      }
    } else if (kind === 'pale') {                                                    // poplar: pale grey, furrowed
      g.fillStyle = '#948c7c'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) { const x = r() * w, y = r() * h; g.fillStyle = `rgba(60,54,48,${0.25 + r() * 0.3})`; g.fillRect(x, y, 2 + r() * 3, 8 + r() * 26); }
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(200,192,176,${0.12 + r() * 0.15})`; g.fillRect(r() * w, r() * h, 3 + r() * 6, 12 + r() * 30); }
    } else if (kind === 'lime') furrows('#5e5044', 'rgba(32,26,20,A)', 38, 2);    // dark furrowed lime / elm
    else if (kind === 'oak') furrows('#6c5e4e', 'rgba(34,28,22,A)', 30, 3);
    else if (kind === 'ash') furrows('#8a857c', 'rgba(52,48,42,A)', 34, 2);
    else if (kind === 'maple') furrows('#7a6e62', 'rgba(46,40,34,A)', 30, 2);
    else furrows('#6f645a', 'rgba(46,40,36,A)', 34, 2);
  }, { key: 'env-bark-pb-' + kind, repeat: [1, 1], anisotropy: 4 });
}
function blobTexture(ctx) {
  return ctx.tex.draw(128, 128, (g, w, h) => {
    const c = w / 2, grd = g.createRadialGradient(c, c, 0, c, c, c);
    grd.addColorStop(0, 'rgba(255,255,255,0.34)'); grd.addColorStop(0.5, 'rgba(255,255,255,0.16)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.clearRect(0, 0, w, h); g.fillStyle = grd; g.fillRect(0, 0, w, h);
  }, { key: 'env-treeblob-pb', anisotropy: 2 });
}

// ---------------------------------------------------------------- placement
export function placeTrees(ctx, field, owned, extraAvoid = []) {
  // ONE STREAM PER RECORD (2026-10-06, lead's request): until now every step drew from one sequential stream, so each new district (new tree nodes, GREEN polygons, buildings, a bigger extent, new water in the
  // field) re-rolled the courtyard and yard trees of all the older areas. Now every record seeds its own stream: an OSM tree node / row by its position, a GREEN polygon and a courtyard hole by the OSM id + ring
  // index, a yard cell by its cell (the 6 m grid is anchored at the origin, not at the extent corner), a bank row by the start of its bank segment. R is the stream of the record in hand (seed() switches it).
  // What still couples records: the spacing test against trees planted earlier (records run in data order, older regions first).
  let _a = 1;
  const R = () => { _a = (_a + 0x6D2B79F5) | 0; let t = Math.imul(_a ^ (_a >>> 15), 1 | _a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  R.range = (lo, hi) => lo + (hi - lo) * R();
  const hashStr = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const hashXZ = (x, z, salt) => (Math.imul(Math.round(x * 4) | 0, 73856093) ^ Math.imul(Math.round(z * 4) | 0, 19349663) ^ Math.imul(salt | 0, 83492791)) >>> 0;
  const seed = (v) => { _a = (typeof v === 'number' ? v : hashStr(v)) | 0; R(); R(); };
  seed('env-trees-pb');
  const q = ctx.quality && (ctx.quality.level || ctx.quality.name), density = q === 'low' ? 0.5 : q === 'medium' ? 0.75 : 1;
  const list = [], grid = new Map(), stats = {}, rej = {};
  const key = (i, j) => i * 100003 + j, cellOf = (v) => Math.floor(v / 8);
  const near = (x, z) => { const out = []; const ci = cellOf(x), cj = cellOf(z); for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) { const a = grid.get(key(i, j)); if (a) out.push(...a); } return out; };
  const colors = {}; for (const k in LEAF) colors[k] = LEAF[k].map((h) => new THREE.Color(h));
  // keep the hero view and the numbered viewpoints open: a disc around each and a corridor along the look direction
  const CLEAR = [];
  for (const [i, v] of [L.HERO, ...L.VIEWS].entries()) { const yaw = (v.yaw * Math.PI) / 180; CLEAR.push({ x: v.x, z: v.z, r: 7, dx: -Math.sin(yaw), dz: -Math.cos(yaw), len: i === 0 ? 100 : 40, hw: i === 0 ? 10 : 6 }); }
  const areaCleared = HOOKS.treeCleared?.(ctx), areaReject = HOOKS.treeReject?.(ctx);      // the area's keep-outs (hooks/keep-out.js, once per build): soft = skipped under o.force (no caller forces, so mapped trees are cleared too), hard = always
  const cleared = (x, z) => {
    if (areaCleared && areaCleared(x, z)) return true;                            // (the North: Smolny's mapped ceremonial approaches stay open, not procedural woodland)
    for (const c of CLEAR) {
      const px = x - c.x, pz = z - c.z; if (px * px + pz * pz < c.r * c.r) return true;
      const t = px * c.dx + pz * c.dz; if (t > 0 && t < c.len && Math.abs(px * c.dz - pz * c.dx) < c.hw * (1 - 0.5 * t / c.len)) return true;
    }
    return false;
  };
  // the hedge runs on a 16 m grid (every run registered in the cells within AV_PAD of its box): a trunk candidate tests only the runs of its own cell. The test itself is the one of before
  // (any run nearer than m + 0.7 m rejects); when m + 0.7 exceeds the padding the full list is scanned, so the answer never changes.
  const AV_CELL = 16, AV_PAD = 10, avGrid = new Map(), avKey = (i, j) => i * 100003 + j;
  const hedgeRuns = extraAvoid.filter((a) => a.kind === 'hedge');
  for (const a of hedgeRuns) { const x0 = Math.min(a.ax, a.bx) - AV_PAD, x1 = Math.max(a.ax, a.bx) + AV_PAD, z0 = Math.min(a.az, a.bz) - AV_PAD, z1 = Math.max(a.az, a.bz) + AV_PAD; for (let i = Math.floor(x0 / AV_CELL); i <= Math.floor(x1 / AV_CELL); i++) for (let j = Math.floor(z0 / AV_CELL); j <= Math.floor(z1 / AV_CELL); j++) { const k = avKey(i, j); let l = avGrid.get(k); if (!l) avGrid.set(k, (l = [])); l.push(a); } }
  const avoidOk = (x, z, m) => {
    const list = m + 0.7 <= AV_PAD ? avGrid.get(avKey(Math.floor(x / AV_CELL), Math.floor(z / AV_CELL))) : hedgeRuns; if (!list) return true;
    for (let q = 0; q < list.length; q++) { const a = list[q]; const dx = a.bx - a.ax, dz = a.bz - a.az, l2 = dx * dx + dz * dz || 1, t = clamp(((x - a.ax) * dx + (z - a.az) * dz) / l2, 0, 1); if (Math.hypot(a.ax + dx * t - x, a.az + dz * t - z) < m + 0.7) return false; }
    return true;
  };
  const NEVSKY = L.NAMES.streets.nevsky;
  const onNevsky =(x, z) => L.roadsNear(x, z, 13, { drivable: true, name: NEVSKY }).length > 0;      // (roadsNear name filter: only the Nevsky segments are measured; the same answer as filtering the result)
  const inExt = (x, z) => L.inExtent(x, z, 3);
  // Parking pockets: streets/net.js widens the asphalt by 2.2 m on the kerb side of the ordinary side streets (parkPolicy: ranks 1-3 except primaries / links, named, carriageway <= 7.5 m, not the NO_PARK avenues)
  // away from the junctions and the bus stops. The field only knows the pockets of OSM parking tags, so a trunk 0.8 m from the basic asphalt edge stood in a bay. Rule (a mirror of that policy, not a copy of the
  // geometry): on such a street no trunk closer than the pocket + its own radius to the asphalt edge, unless a junction is near (the pocket tapers out within 11-20 m of one) or the street has a tag the field reads.
  const PARK_HW = new Set(['secondary', 'tertiary', 'unclassified', 'residential', 'living_street']);
  const NO_PARK = new Set(['Невский проспект', 'Лиговский проспект', 'площадь Восстания', 'Суворовский проспект', 'Гончарная улица', 'Аничков мост', 'Владимирский проспект', 'Литейный проспект', 'Загородный проспект',
    'Владимирская площадь', 'Манежная площадь', 'Дворцовая площадь', 'Дворцовая набережная', 'Дворцовый проезд', 'Адмиралтейский проезд', 'Адмиралтейский проспект', 'Дворцовый мост', 'Садовая улица']);
  const POCKET = 2.2;
  // Between two carriageways of one street that are closer than 7.5 m (streets/net.js fillMedians merges them into ONE roadway): no trunk on that strip.
  const inMergedStrip = (x, z) => {
    const hits = L.roadsNear(x, z, 7.5, { drivable: true });
    for (let i = 0; i < hits.length; i++) for (let j = i + 1; j < hits.length; j++) {
      const a = hits[i], b = hits[j];
      if (a.gap + b.gap >= 7.5 || (a.road.name !== b.road.name && a.road.name && b.road.name)) continue;
      if ((a.x - x) * (b.x - x) + (a.z - z) * (b.z - z) < 0) return true;              // the two centrelines lie on opposite sides of the trunk
    }
    return false;
  };
  const inBay = (x, z, tr) => {
    const hits = L.roadsNear(x, z, 14, { drivable: true });
    for (const h of hits) {
      const r = h.road; if (!PARK_HW.has(r.hw) || !r.name || r.parkingLane || NO_PARK.has(r.name) || h.w > 7.5 || h.gap > POCKET + tr + 0.3) continue;
      if (hits.some((o) => o.road !== r && o.road.name !== r.name && o.gap < 8)) continue;         // within ~11 m of a junction along the street: no pocket
      return true;
    }
    return false;
  };

  function plant(x, z, fam, o = {}) {
    const F = SPECIES[fam], s = o.s ?? R.range(0.82, 1.2), r = F.R * s;
    const no = (why) => { const k = (o.src || 'other') + ':' + why; rej[k] = (rej[k] || 0) + 1; return false; };
    if (!inExt(x, z)) return no('ext');
    const trunk = F.trunk * Math.min(1.1, .7 + .35*s);
    if (ctx._roadPlan?.cover(x,z,{}) >= -(trunk+.5)) return no('asphalt');
    if (mergedMedianAt(ctx,x,z)) return no('merged-median');
    if (areaReject) { const why = areaReject(x, z); if (why) return no(why); }          // a landmark module draws the place (the North: the Paradny podium, the Kirochnaya campus, the Suvorov strip): mapped OSM trees too
    if (!o.force) {
      if (cleared(x, z)) return no('cleared');
      if (fam !== 'ball' && onNevsky(x, z)) return no('nevsky');                                                     // no trees on Nevsky itself
      if (L.isOnRoad(x, z, F.trunk * 1.1 + 0.3)) return no('road');                                                   // the trunk (and 0.3 m) clear of every drivable way incl. the courtyard lanes the field does not read
      if (inMergedStrip(x, z)) return no('strip');                                                                   // not between two carriageways that net.js merges
      if (inBay(x, z, F.trunk * 0.9)) return no('bay');                                                              // never in a parking pocket of a side street
      if (!field.free(x, z, o.extra ?? 0, { onNaturalBank: !!AREA_WATER.naturalShoreRegion?.(x,z), onPave: !!o.onPave, loose: !!o.loose, claimOk: !!o.claimOk, road: o.road, bld: o.bld ?? (F.shrub ? 1.3 : F.sp === 'spruce' ? 2.2 : 2.4 * Math.min(1, 0.55 + 0.45 * s)), shore: o.shore })) return no('free');
      if (!o.noHedge && !avoidOk(x, z, r * 0.5)) return no('hedge');          // mapped trees (OSM nodes / rows) are ground truth: they stand in a hedge if need be
    }
    const pack = o.pack ?? (F.shrub ? 0.5 : 0.55);
    for (const nb of near(x, z)) if (Math.hypot(nb.x - x, nb.z - z) < (nb.r + r) * (nb.shrub || F.shrub ? Math.min(pack, 0.42) : pack)) return no('pack');
    const pal = colors[F.sp], c = pal[Math.floor(R() * pal.length)];
    const t = { src: o.src || 'other', x, z, fam, sp: F.sp, shrub: !!F.shrub, s, sy: s * R.range(0.92, 1.1), yaw: R() * 6.283, r, h: F.H * s, tr: F.trunk * Math.min(1.1, 0.7 + 0.35 * s), hex: c, bright: R.range(0.93, 1.07), onPave: !!o.onPave };
    t.y = AREA_WATER.naturalShoreRegion?.(x,z) ? L.heightAt(x,z) : 0;
    list.push(t);
    const k = key(cellOf(x), cellOf(z)); let a = grid.get(k); if (!a) grid.set(k, (a = [])); a.push(t);
    stats[o.src || 'other'] = (stats[o.src || 'other'] || 0) + 1;
    return true;
  }

  // ---- 1. the OSM tree nodes and tree rows (Vosstaniya Sq: the 16 clipped maple balls near Hotel Oktyabrskaya)
  {
    const balls = [lonLatToXZ(30.3626, 59.9312)], BR = 52;
    for (let i = 0; i + 1 < TREES.length; i += 2) {
      const x = TREES[i], z = TREES[i + 1]; seed(hashXZ(x, z, 1));
      const isBall = balls.some((b) => Math.hypot(b[0] - x, b[1] - z) < BR);
      if (isBall) plant(x, z, 'ball', { s: R.range(0.9, 1.15), pack: 0.3, bld: 1.0, onPave: true, loose: true, claimOk: true, road: 0.6, shore: 3, src: 'osm-ball' });
      else plant(x, z, pick(R, MIX.osm), { s: R.range(0.75, 1.25), pack: 0.4, bld: 1.1, onPave: true, loose: true, road: 0.8, noHedge: true, shore: 3, src: 'osm' });
    }
    for (const row of TREE_ROWS) {
      const [ax, az, bx, bz] = row, l = Math.hypot(bx - ax, bz - az); if (l < 4) continue;
      seed(hashXZ(ax, az, 2));
      const tx = (bx - ax) / l, tz = (bz - az) / l;
      for (let s = 2; s < l - 1; s += R.range(8, 11)) plant(ax + tx * s, az + tz * s, pick(R, MIX.rows), { s: R.range(0.8, 1.05), pack: 0.4, onPave: true, loose: true, road: 0.8, noHedge: true, bld: 1.4, shore: 3, src: 'row' });
    }
  }

  // ---- 2. the Fontanka embankment: young limes along the facade line of the west bank, a few old trees in front of Fontanka 44 / 46
  {
    seed('fontanka-embankment');
    const banks = riverBanks().filter((b) => b.len > 1000), midX = (b) => { let best = null; for (const p of b.pts) if (!best || Math.abs(p[1] + 90) < Math.abs(best[1] + 90)) best = p; return best[0]; };
    if (banks.length === 2) {
      const west = midX(banks[0]) < midX(banks[1]) ? banks[0] : banks[1], east = west === banks[0] ? banks[1] : banks[0];
      const walk = (bank, step, fn) => {
        let carry = R.range(0, step);
        for (let i = 0; i + 1 < bank.pts.length; i++) {
          const a = bank.pts[i], b = bank.pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.5) continue;
          const tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l, nx = -tz * bank.landSide, nz = tx * bank.landSide;
          for (let s = carry; s < l; s += step) fn(a[0] + tx * s, a[1] + tz * s, nx, nz);
          carry = ((carry - l) % step + step) % step;
        }
      };
      // west bank: limes at the facade line (the first building wall met when walking away from the water), 2.2 m in front of it
      walk(west, 6.5, (x, z, nx, nz) => {
        if (!inExt(x, z) || R() > 0.9 * density || Math.hypot(x + 442, z + 92) < 38) return;                  // not at the bridge
        for (let d = 7; d < 30; d += 0.5) {
          if (field.bldDist(x + nx * d, z + nz * d) < 0.7) { plant(x + nx * (d - 2.3), z + nz * (d - 2.3), 'limeY', { s: R.range(0.85, 1.12), onPave: true, loose: true, road: 0.7, bld: 1.4, pack: 0.5, src: 'embankment' }); return; }
        }
      });
      // old trees: nearest bank points to Fontanka 44 / 46 (east bank) and two on the west bank in front of the Anichkov garden railing
      for (const [qx, qz, fam, s] of [[-410, 0, 'limeA', 1.15], [-408, 24, 'chestnut', 1.05], [-420, 56, 'limeA', 1.0], [-405, 40, 'mapleA', 1.0]]) {
        let best = null; for (const b of [east]) for (let i = 0; i + 1 < b.pts.length; i++) { const p = b.pts[i], d = Math.hypot(p[0] - qx, p[1] - qz); if (!best || d < best.d) best = { d, p, i, b }; }
        if (!best) continue;
        const a = best.p, c = best.b.pts[best.i + 1], l = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1, nx = -(c[1] - a[1]) / l * east.landSide, nz = (c[0] - a[0]) / l * east.landSide;
        for (const off of [8.5, 9.5, 11, 6.5]) if (plant(a[0] + nx * off, a[1] + nz * off, fam, { s, pack: 0.5, onPave: true, bld: 2.0, src: 'embankment-old' })) break;
      }
    }
  }

  // ---- 3. green polygons: lawn specimens, wood thickets
  for (const g of GREEN) {
    if (g.kind === 'flowerbed' || g.kind === 'pitch' || g.kind === 'playground' || g.kind === 'garden' || g.kind === 'fitness_station' || g.kind === 'track') continue;
    if (L.isClaimed(g.id) || isOwned(owned, g.id)) continue;                       // the square's lawns belong to landmarksA
    const mix = /Аничков/.test(g.name || '') ? MIX.anichkov : MIX.green;
    let gi = 0;
    for (const poly of g.polys) {
      seed(g.id + ':' + (gi++));
      const bb = polyBox(poly), area = polyArea(poly);
      if (g.kind === 'wood' || g.kind === 'forest') {
        for (let z = bb.z0; z < bb.z1; z += 5.4) for (let x = bb.x0; x < bb.x1; x += 5.4) {
          const px = x + R.range(-1.6, 1.6), pz = z + R.range(-1.6, 1.6);
          if (!pointInPoly(px, pz, poly) || R() > 0.8) continue;
          if (R() < 0.25) plant(px, pz, 'shrub', { s: R.range(0.7, 1.2), pack: 0.4, src: 'wood' }); else plant(px, pz, pick(R, MIX.wood), { s: R.range(0.8, 1.25), pack: 0.5, src: 'wood' });
        }
      } else {
        const dens = (g.kind === 'park' ? 1 / 105 : 1 / 240) * density;
        let want = Math.round(area * dens);
        for (let tries = 0; tries < want * 30 && want > 0; tries++) {
          const px = R.range(bb.x0, bb.x1), pz = R.range(bb.z0, bb.z1);
          if (!pointInPoly(px, pz, poly)) continue;
          if (plant(px, pz, pick(R, R() < 0.14 ? { shrub: 1 } : mix), { s: R.range(0.8, 1.35), pack: 0.62, shore: 4, src: 'green' })) want--;
        }
      }
    }
  }

  // ---- 4. courtyards: 1-3 trees in the building holes (well-yards 12-20 m wide: one tree of 8-10 m)
  for (const b of BUILDINGS) {
    if (b.skip || b.dupOf || isOwned(owned, b.id)) continue;                         // owned landmark buildings lay their own courtyards (Winter Palace Great Courtyard)
    let hi = 0;
    for (const p of b.polys) for (const h of p.h) {
      seed(b.id + ':h' + (hi++));
      const hp = { o: h, h: [] }, area = polyArea(hp); if (area < 80 || hash2(b.cx | 0, area | 0, 41) > 0.62 * density) continue;
      const bb = polyBox(hp), n = area < 180 ? 1 : area < 480 ? 2 : 3;
      let want = n;
      for (let tries = 0; tries < 80 && want > 0; tries++) {
        const px = R.range(bb.x0, bb.x1), pz = R.range(bb.z0, bb.z1);
        if (!pointInPoly(px, pz, hp)) continue;
        const fam = pick(R, MIX.yard), small = SPECIES[fam].shrub || fam === 'rowan';
        if (plant(px, pz, fam, { s: small ? R.range(0.8, 1.1) : R.range(0.55, 0.85), pack: 0.55, bld: small ? 1.6 : 3.4, onPave: true, src: 'courtyard' })) want--;
      }
    }
  }

  // ---- 5. unbuilt yards: a sparse clumpy scatter where the ground shader paints lawn
  {
    const step = 6.0, X0 = Math.floor((EXTENT.x0 - 6) / step) * step, X1 = EXTENT.x1 + 6, Z0 = Math.floor((EXTENT.z0 - 6) / step) * step, Z1 = EXTENT.z1 + 6;      // cells at multiples of 6 m from the origin
    for (let z = Z0; z < Z1; z += step) for (let x = X0; x < X1; x += step) {
      seed(hashXZ(x, z, 5));
      const px = x + R.range(-2.5, 2.5), pz = z + R.range(-2.5, 2.5);
      const clump = field.noise.noiseAt(1, px, pz, 0.014), k = sstep(0.4, 0.74, clump);
      const p = (0.01 + 0.12 * k * k) * density;
      if (R() > p) continue;
      if (!field.free(px, pz, 0.2)) continue;
      const cat = field.categoryAt(px, pz); if (cat !== 'grass' && !(cat === 'setts' && R() < 0.12)) continue;
      plant(px, pz, pick(R, MIX.yard), { s: R.range(0.6, 1.0), pack: 0.5, src: 'yard' });
    }
  }
  // ---- 6. (last, so that the random stream of every older tree stays as it was) the Swan Canal, Mars Field side (docs/research/mars-bridges-canals.md 2.1, photos 13 / 23): a row of young limes on the 3-3.5 m pavement behind the ball-post rail, ~7 m apart (the garden side belongs to landmarksGarden)
  for (const bank of waterBanks('swan-canal')) {
    for (let i = 0; i + 1 < bank.pts.length; i++) {
      const a = bank.pts[i], b = bank.pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 30) continue;
      const tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l, nx = -tz * bank.landSide, nz = tx * bank.landSide;
      if (nx > -0.3) continue;                                                                               // west bank only (landward normal points west)
      seed(hashXZ(a[0], a[1], 6));
      for (let s = 6; s < l - 6; s += R.range(6.5, 8)) plant(a[0] + tx * s + nx * 6.0, a[1] + tz * s + nz * 6.0, 'limeY', { s: R.range(0.9, 1.15), onPave: true, loose: true, road: 1.8, bld: 1.4, pack: 0.5, src: 'swan-row' });
    }
  }

  // ---- 7. the English Embankment (Bolshaya Neva bank in S3 / S4; docs/research/sw-canals-bridges.md 2.6): young limes on the 3 m lawn strip between the two low fences, ~8.5 m apart, 5.2 m behind the parapet
  for (const bank of waterBanks('neva')) {
    if (bank.far) continue;
    for (let i = 0; i + 1 < bank.pts.length; i++) {
      const a = bank.pts[i], b = bank.pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      if (l < 12 || mx > -2950 || mx < -3830 || mz > 140) continue;      // (the part of the English embankment that lies in the margin west of the Senate Square)
      const tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l, nx = -tz * bank.landSide, nz = tx * bank.landSide;
      seed(hashXZ(a[0], a[1], 7));
      for (let s = 4; s < l - 4; s += R.range(8, 9.5)) plant(a[0] + tx * s + nx * 5.2, a[1] + tz * s + nz * 5.2, 'limeY', { s: R.range(0.9, 1.15), onPave: true, loose: true, road: 1.8, bld: 1.4, pack: 0.5, src: 'engl-row' });
    }
  }
  // ENV_TREE_AT="x,z,r;x,z,r" (node tools only): print the source of every tree within r of each point (diagnostics for the furniture audit rows)
  if (typeof process !== 'undefined' && process.env && process.env.ENV_TREE_AT) for (const q of process.env.ENV_TREE_AT.split(';')) { const [qx, qz, qr] = q.split(',').map(Number); for (const t of list) if (Math.hypot(t.x - qx, t.z - qz) < qr) console.log('[tree]', t.src, t.fam, t.x.toFixed(1), t.z.toFixed(1), 'trunk', t.tr.toFixed(2)); }
  stats.rej = rej;                                                            // rejected placements per source and reason (ENV_DEBUG prints it)
  return { list, stats };
}

// ---------------------------------------------------------------- meshes
export function buildTrees(ctx, root, field, owned, extraAvoid = []) {
  const T = THREE;
  const { list, stats } = placeTrees(ctx, field, owned, extraAvoid);
  const byFam = {}; for (const f of FAMILIES) byFam[f] = [];
  for (const t of list) byFam[t.fam].push(t);
  const col = new T.Color();
  for (const t of list) { col.set(t.hex).multiplyScalar(t.bright); t.rgb = [col.r, col.g, col.b]; }

  const matLobe = canopyMaterial(ctx), matTier = coniferMaterial(ctx);
  const barkMat = {}; for (const k of ['birch', 'pale', 'lime', 'oak', 'ash', 'maple', 'brown']) barkMat[k] = trunkMaterial(ctx, barkTexture(ctx, k), 'env-bark-pb-' + k);
  const group = new T.Group(); group.name = 'env-trees'; root.add(group);
  const M = {}, TR = {};
  for (const fam of FAMILIES) {
    const n = byFam[fam].length; if (!n) continue;
    const F = SPECIES[fam]; M[fam] = []; TR[fam] = [];
    for (let l = 0; l < 4; l++) {
      const im = new T.InstancedMesh(canopyGeometry(fam, l), F.kind === 'tiers' ? matTier : matLobe, n);
      im.instanceMatrix.setUsage(T.DynamicDrawUsage); im.setColorAt(0, col.setRGB(1, 1, 1)); im.instanceColor.setUsage(T.DynamicDrawUsage);
      im.count = 0; im.frustumCulled = false; im.castShadow = l <= 1; im.receiveShadow = l <= 1; im.name = `env-tree-${fam}-${l}`; im.visible = false;
      group.add(im); M[fam].push(im);
      if (l <= 1) {
        const tg = trunkGeometry(fam, l);
        if (tg) { const tm = new T.InstancedMesh(tg, barkMat[F.bark], n); tm.instanceMatrix = im.instanceMatrix; tm.count = 0; tm.frustumCulled = false; tm.castShadow = true; tm.receiveShadow = true; tm.name = `env-trunk-${fam}-${l}`; tm.visible = false; group.add(tm); TR[fam].push(tm); }
        else TR[fam].push(null);
      }
    }
  }
  let blobMesh = null;
  // soft contact shadow under every crown (the real shadow map only reaches ~90 m)
  {
    const blob = new T.InstancedMesh(new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), ctx.mat.decal('#ffffff', { map: blobTexture(ctx), transparent: true, polygonOffset: -3, paint: 0.0, name: 'env-treeblob-pb' }), Math.max(1, list.length));
    const m4 = new T.Matrix4(), qt = new T.Quaternion(), v = new T.Vector3(), sc = new T.Vector3(), cc = new T.Color();
    list.forEach((t, i) => {
      const d = t.r * (t.shrub ? 1.9 : t.sp === 'spruce' ? 2.1 : 2.2);
      qt.setFromAxisAngle(new T.Vector3(0, 1, 0), t.yaw); m4.compose(v.set(t.x, t.y + (t.onPave ? 0.128 : 0.035), t.z), qt, sc.set(d, 1, d)); blob.setMatrixAt(i, m4);
      blob.setColorAt(i, cc.set(t.sp === 'spruce' ? '#14221a' : '#1e2a14'));
    });
    blobMesh = blob;
    blob.count = list.length; blob.instanceMatrix.needsUpdate = true; if (blob.instanceColor) blob.instanceColor.needsUpdate = true; blob.receiveShadow = false; blob.frustumCulled = false; blob.name = 'env-treeblob';
    ctx.noOutline(blob); ctx.noBatch(blob); group.add(blob);
  }

  // trunk colliders (play area only; farther trees are scenery)
  const P = L.WORLD.play; let colliders = 0;
  for (const t of list) if (L.inPlay(t.x, t.z, -5)) { t.col = ctx.physics.addCylinder(t.x, t.z, t.tr, t.y, t.y + (t.shrub ? 1.3 : 4.5)); colliders++; }

  // ---- LOD assignment (re-packed from the camera position at walking speed)
  const state = new Int8Array(list.length).fill(-1);
  const instanceWriter = createTreeInstanceWriter(list);
  const buckets = {}; for (const f in M) buckets[f] = M[f].map(m => instanceWriter.bucket(m));
  // The GPU draws every instance of an instanced mesh (no per-instance frustum culling): trees of LOD 2 / 3 (150 m and farther, 70 % of all trees) outside the view cone are left out
  // (cone = half the horizontal field of view + 18 deg of margin for the re-pack lag; re-packed when the camera turns 6 deg or walks 2.5 m). Not applied from a high or steeply down-looking camera.
  const _dir = new T.Vector3();
  let fx = 0, fz = -1, cosLim = -2;                                                    // camera heading and the cosine limit of the cone (-2 = no cone)
  function aimCone() {
    const cam = ctx.camera; if (!cam || !cam.getWorldDirection) { cosLim = -2; return; }
    const dir = cam.getWorldDirection(_dir), hl = Math.hypot(dir.x, dir.z);
    if (hl < 0.55 || cam.position.y > 45) { cosLim = -2; return; }                      // looking steeply down / up, or flying: everything counts
    fx = dir.x / hl; fz = dir.z / hl;
    const half = Math.atan(Math.tan((cam.fov || 62) * Math.PI / 360) * (cam.aspect || 1.78)) + 18 * Math.PI / 180;
    cosLim = half >= 1.75 ? -2 : Math.cos(half);
  }
  // Cell skipping (perf plan item 2, ?treegrid=0 to disable): trees are grouped into 32 m cells. A cell whose
  // whole disc lies inside one LOD band's hysteresis-proof interior (and wholly inside or outside the view cone
  // when the cone applies) has the same answer for every tree whatever its previous LOD; when that answer equals
  // the cell's previous uniform answer, every tree already holds it and the cell is skipped. Mixed cells run the
  // exact per-tree rule. prune() resets the cell answers.
  const GRID = typeof location === 'undefined' || new URLSearchParams(location.search).get('treegrid') !== '0', CELL = 32, EPS = 1e-3, MIXED = -9;
  let cellN = 0, cellX = null, cellZ = null, cellR = null, cellStart = null, cellTrees = null, cellCode = null;
  if (GRID) {
    const index = new Map(), of = new Int32Array(list.length);
    for (let i = 0; i < list.length; i++) {
      const k = Math.floor(list[i].x / CELL) * 1000003 + Math.floor(list[i].z / CELL);
      let c = index.get(k); if (c === undefined) index.set(k, (c = index.size)); of[i] = c;
    }
    cellN = index.size; cellStart = new Int32Array(cellN + 1); cellTrees = new Int32Array(list.length);
    for (let i = 0; i < list.length; i++) cellStart[of[i] + 1]++;
    for (let c = 0; c < cellN; c++) cellStart[c + 1] += cellStart[c];
    const fill = cellStart.slice(0, cellN); for (let i = 0; i < list.length; i++) cellTrees[fill[of[i]]++] = i;
    cellX = new Float64Array(cellN); cellZ = new Float64Array(cellN); cellR = new Float64Array(cellN); cellCode = new Int8Array(cellN).fill(MIXED);
    for (let c = 0; c < cellN; c++) {
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (let k = cellStart[c]; k < cellStart[c + 1]; k++) { const t = list[cellTrees[k]]; if (t.x < x0) x0 = t.x; if (t.x > x1) x1 = t.x; if (t.z < z0) z0 = t.z; if (t.z > z1) z1 = t.z; }
      const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2; let r = 0;
      for (let k = cellStart[c]; k < cellStart[c + 1]; k++) { const t = list[cellTrees[k]]; r = Math.max(r, Math.hypot(t.x - mx, t.z - mz)); }
      cellX[c] = mx; cellZ[c] = mz; cellR[c] = r + EPS;
    }
  }
  function assignTree(i, cx, cz) {
    const t = list[i]; if (t.dead) { instanceWriter.assign(-1, i); return; }
    const dx = t.x - cx, dz = t.z - cz, d = Math.sqrt(dx * dx + dz * dz);
    let l = d < LOD_D[0] ? 0 : d < LOD_D[1] ? 1 : d < LOD_D[2] ? 2 : 3;
    if (l >= 2 && cosLim > -2 && dx * fx + dz * fz < cosLim * d) { state[i] = -1; instanceWriter.assign(-1, i); return; }
    const pv = state[i];
    if (pv >= 0 && pv !== l) { const lo = pv === 0 ? 0 : LOD_D[pv - 1] * 0.9, hi = pv === 3 ? 1e9 : LOD_D[pv] * 1.1; if (d >= lo && d < hi) l = pv; }
    state[i] = l;
    if (pv !== l) instanceWriter.assign(buckets[t.fam][l], i);
  }
  function cellAnswer(c, cx, cz) {
    const dx = cellX[c] - cx, dz = cellZ[c] - cz, dc = Math.sqrt(dx * dx + dz * dz), r = cellR[c], dmin = dc - r - EPS, dmax = dc + r + EPS;
    const band = dmax < LOD_D[0] * 0.9 ? 0 : dmin >= LOD_D[0] * 1.1 && dmax < LOD_D[1] * 0.9 ? 1 : dmin >= LOD_D[1] * 1.1 && dmax < LOD_D[2] * 0.9 ? 2 : dmin >= LOD_D[2] * 1.1 ? 3 : MIXED;
    if (cosLim <= -2 || dmin < LOD_D[1] + EPS) return band >= 2 && dmin < LOD_D[1] + EPS ? MIXED : band;   // no cone, or near (no cone below 150 m)
    // every tree is at least 150 m away: the cone decides for all of them
    const theta = Math.acos(Math.max(-1, Math.min(1, (dx * fx + dz * fz) / dc))), spread = Math.asin(Math.min(1, r / dc)), half = Math.acos(cosLim);
    if (theta - spread > half + 1e-4) return -1;                                       // wholly outside the cone
    if (theta + spread < half - 1e-4) return band;                                     // wholly inside: the band decides
    return MIXED;
  }
  function assign(cx, cz) {
    if (GRID) {
      for (let c = 0; c < cellN; c++) {
        const code = cellAnswer(c, cx, cz), k0 = cellStart[c], k1 = cellStart[c + 1];
        if (code === MIXED) { for (let k = k0; k < k1; k++) assignTree(cellTrees[k], cx, cz); cellCode[c] = MIXED; continue; }
        if (code === cellCode[c]) continue;                                            // every tree already holds this answer
        for (let k = k0; k < k1; k++) {
          const i = cellTrees[k], t = list[i];
          if (t.dead) { instanceWriter.assign(-1, i); continue; }
          if (code < 0) { state[i] = -1; instanceWriter.assign(-1, i); continue; }
          const pv = state[i]; state[i] = code;
          if (pv !== code) instanceWriter.assign(buckets[t.fam][code], i);
        }
        cellCode[c] = code;
      }
    } else for (let i = 0; i < list.length; i++) assignTree(i, cx, cz);
    finishAssign();
  }
  function finishAssign() {
    instanceWriter.finish();
    for (const f in M) for (let l = 0; l < 4; l++) {
      const c = M[f][l].count;
      if (l <= 1 && TR[f][l]) { TR[f][l].count = c; TR[f][l].visible = c > 0; }
    }
  }
  let lx = 1e9, lz = 1e9, lt = -10, lfx = 0, lfz = 0;
  const first = L.HERO; aimCone(); assign(first.x, first.z); lx = first.x; lz = first.z; lfx = fx; lfz = fz;
  ctx.onUpdate((dt, t) => {
    const p = ctx.camera.position, moved = Math.hypot(p.x - lx, p.z - lz), was = cosLim > -2;
    aimCone();
    const turned = (cosLim > -2) !== was || (cosLim > -2 && fx * lfx + fz * lfz < 0.9945);             // 6 deg
    if (moved > 2.5 || (Math.abs(t - lt) > 1.5 && moved > 0.5) || turned) { assign(p.x, p.z); lx = p.x; lz = p.z; lt = t; lfx = fx; lfz = fz; }
  });

  const owner = new Map();
  let info = list.map((t) => { const e = { x: t.x, z: t.z, r: t.r, h: t.h, tr: t.tr, sp: t.sp, ...(t.shrub ? { shrub: true } : {}) }; owner.set(e, t); return e; });
  /** remove every tree whose trunk lies within r metres of a point [x, z, r] (street lamps, bus stops, signals: their positions exist only after streets is built):
   *  the tree disappears (instances, contact shadow), its collider is disabled and it leaves the published list */
  /** remove the trees within r of any [x, z, r] of `points`, */
  function prune(points) {
    let n = 0; const zero = new T.Matrix4().makeScale(0, 0, 0);
    // 16 m grid of the points (each stored in every cell its radius touches): trees x points was ~1 s of the load
    const GC = 16, grid = new Map();
    for (const pt of points) { const r = pt[2]; for (let cx = Math.floor((pt[0] - r) / GC); cx <= Math.floor((pt[0] + r) / GC); cx++) for (let cz = Math.floor((pt[1] - r) / GC); cz <= Math.floor((pt[1] + r) / GC); cz++) { const k = cx * 4096 + cz; let a = grid.get(k); if (!a) grid.set(k, (a = [])); a.push(pt); } }
    list.forEach((t, i) => {
      if (t.dead) return;
      let hit = false;
      const cand = grid.get(Math.floor(t.x / GC) * 4096 + Math.floor(t.z / GC));
      if (cand) for (const [x, z, r] of cand) if (Math.hypot(t.x - x, t.z - z) < r) { hit = true; break; }

      if (hit) {
        t.dead = true; n++;
        if (t.col) { t.col.y0 = -200; t.col.y1 = -100; }
        if (blobMesh) blobMesh.setMatrixAt(i, zero);
      }
    });
    if (n) { if (blobMesh) blobMesh.instanceMatrix.needsUpdate = true; info = info.filter((e) => !owner.get(e).dead); state.fill(-1); if (cellCode) cellCode.fill(MIXED); assign(lx, lz); }
    return n;
  }
  return { get info() { return info; }, stats, count: list.length, colliders, list, prune };
}
