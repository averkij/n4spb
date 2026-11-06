// core/minimap.js - the round, heading-up street map in the lower left corner. One instance serves walking, flying and driving (main.js feeds it every frame).
//   * the map itself is cut into 256 m tiles that are drawn on demand from the OSM data (green, water, buildings, roads), kept in a small cache and drawn rotated into the disc
//     (a single 6000 x 4500 px canvas, as the old driving map used, would be ~110 MB);
//   * EVERY named street is labelled: anchors are placed along each named way once, and each frame the anchors near the player are put into screen space as upright-ish text along
//     the street (flipped so it never reads upside down), sorted by road class and de-cluttered with a greedy box test (labels that were shown last frame win ties, so they do not flicker);
//   * a pill above the disc always names the street the player is on (nearest named way, with a little hysteresis at junctions), in Russian and in the Latin form of the navy plates.
// DOM / 2D canvas only, created once; hidden with body.noui (H) and in screenshots (body.shot); main.js switches it off underground and in the metro cars (the street names would be wrong).
import { ROADS, BUILDINGS, RIVER, GREEN, PLAY } from '../world/data/city.js';
import { plateInfo } from '../world/streets/plates.js';

const TILE = 256, PAD = 6, PPM = 1.5, TPX = Math.ceil((TILE + PAD * 2) * PPM), MAX_TILES = 40;
// The complete warm square must fit in the cache, or an idle map rebuilds an
// evicted tile every frame (a radius-3 square needs 49 slots). Leave the remainder
// for tiles from the previous view while driving across a tile boundary.
const WARM_RADIUS = Math.floor((Math.sqrt(MAX_TILES) - 1) / 2);
const BG = '#202c5a';
const CLASSES = [
  { hw: ['service', 'living_street', 'unclassified'], col: '#7f8cc4', min: 1.6 },
  { hw: ['residential', 'tertiary', 'secondary_link', 'primary_link', 'tertiary_link', 'road'], col: '#cfd6f0', min: 2.4 },
  { hw: ['secondary'], col: '#f7f0e1', min: 3 },
  { hw: ['primary'], col: '#ffd873', min: 4 },
];
const CLS_OF = {}; CLASSES.forEach((c, i) => c.hw.forEach((h) => { CLS_OF[h] = i; }));
const RANK = { primary: 4, secondary: 3, secondary_link: 2, primary_link: 2, tertiary: 2, tertiary_link: 1, residential: 1, unclassified: 1, living_street: 1, road: 1, service: 0 };
const LCELL = 128, LDEDUPE = 40, LSPACE = 100;

const CSS = `
:root { --mm: 212px; }
#minimap { position: fixed; z-index: 3; left: 18px; bottom: calc(18px + env(safe-area-inset-bottom, 0px)); width: var(--mm); height: var(--mm); pointer-events: none; opacity: 0; transition: opacity .6s; font-family: "Rubik", "Noto Sans", "Segoe UI", sans-serif; }
body.playing #minimap { opacity: 1; }
body.noui #minimap, body.shot #minimap, #minimap.off { display: none !important; }
#minimap canvas { display: block; width: 100%; height: 100%; border-radius: 50%; box-shadow: 0 0 0 4px rgba(247,240,225,.9), 0 0 0 7px rgba(28,42,90,.55), 0 10px 28px rgba(0,0,0,.45); background: #1b2750; }
#minimap .mm-n { position: absolute; width: 22px; height: 22px; margin: -11px 0 0 -11px; border-radius: 50%; background: #ff4d57; color: #fff; font: 900 12px/22px "Rubik", sans-serif; text-align: center; box-shadow: 0 0 0 2px #fff; }
#minimap .mm-street { position: absolute; left: 0; bottom: calc(100% + 14px); max-width: min(320px, calc(100vw - 36px)); box-sizing: border-box; background: rgba(247,240,225,.92); color: #1c2a5a; padding: 7px 14px 7px 12px; border-radius: 999px; border-left: 6px solid #d8aa4e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0; transition: opacity .3s; box-shadow: 0 4px 14px rgba(0,0,0,.28); }
#minimap .mm-street.on { opacity: 1; }
#minimap .mm-street b { font: 700 14px/1 "Rubik", sans-serif; }
#minimap .mm-street i { font: 500 11px/1 "Noto Sans", sans-serif; font-style: normal; color: #5b6694; margin-left: 8px; }
body.has-minimap #help { left: calc(var(--mm) + 38px); max-width: calc(100vw - var(--mm) - 54px); }
@media (max-width: 900px), (pointer: coarse) { :root { --mm: 164px; } }
@media (max-width: 480px) { :root { --mm: 132px; } #minimap .mm-street b { font-size: 13px; } #minimap .mm-street i { display: none; } }
`;

const ABBR = [[/^проспект$/, 'пр.'], [/^улица$/, 'ул.'], [/^переулок$/, 'пер.'], [/^набережная$/, 'наб.'], [/^площадь$/, 'пл.'], [/^проезд$/, 'пр-д'], [/^бульвар$/, 'бул.'], [/^линия$/, 'лин.'], [/^реки$/, 'р.'], [/^канала$/, 'кан.']];
/** 'набережная реки Фонтанки' -> 'наб. р. Фонтанки' (the map labels are small) */
export const shortStreet = (name) => name.split(' ').map((w) => { for (const [re, to] of ABBR) if (re.test(w)) return to; return w; }).join(' ');
const TYPED = /(проспект|улица|переулок|проезд|площадь|набережная|бульвар|линия)/;
/** Latin form for the pill ('Nevsky pr.'); only for names that follow the plate grammar (an 'Anichkov most' transliteration would look wrong) */
const latinStreet = (name) => { if (!TYPED.test(name)) return ''; try { return plateInfo(name).lat; } catch (e) { return ''; } };

export function createMinimap() {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const root = document.createElement('div'); root.id = 'minimap';
  root.innerHTML = '<div class="mm-street"><b></b><i></i></div><canvas width="424" height="424"></canvas><div class="mm-n">N</div>';
  document.body.appendChild(root);
  const cv = root.querySelector('canvas'), north = root.querySelector('.mm-n'), pill = root.querySelector('.mm-street'), pillName = pill.querySelector('b'), pillLat = pill.querySelector('i');
  const c = cv.getContext('2d');
  const stats = { tiles: 0, labels: 0, anchors: 0, tileMs: 0, drawMs: 0, streets: 0 };

  // ------------------------------------------------------------------ index (built lazily on the first draw)
  let index = null;
  function buildIndex() {
    const tcols = Math.ceil((PLAY.x1 - PLAY.x0) / TILE), trows = Math.ceil((PLAY.z1 - PLAY.z0) / TILE);
    const cells = new Map();
    const cell = (i, j) => { const k = i * 4096 + j; let v = cells.get(k); if (!v) cells.set(k, (v = { roads: CLASSES.map(() => []), green: [], river: [], bld: [] })); return v; };
    const put = (layer, item, x0, z0, x1, z1, cls) => {
      const i0 = Math.max(0, Math.floor((x0 - PLAY.x0 - PAD) / TILE)), i1 = Math.min(tcols - 1, Math.floor((x1 - PLAY.x0 + PAD) / TILE));
      const j0 = Math.max(0, Math.floor((z0 - PLAY.z0 - PAD) / TILE)), j1 = Math.min(trows - 1, Math.floor((z1 - PLAY.z0 + PAD) / TILE));
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const cl = cell(i, j); (cls === undefined ? cl[layer] : cl.roads[cls]).push(item); }
    };
    const bbox = (o) => { let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (let i = 0; i < o.length; i += 2) { const x = o[i], z = o[i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; } return [x0, z0, x1, z1]; };
    for (const p of GREEN) for (const q of p.polys || []) { const b = bbox(q.o); put('green', q, ...b); }
    for (const r of RIVER) for (const q of r.polys || []) { const b = bbox(q.o); put('river', q, ...b); }
    for (const b of BUILDINGS) { if (b.skip || (b.minH || 0) > 3 || b.underground) continue; for (const q of b.polys || []) { const bb = bbox(q.o); put('bld', q, ...bb); } }
    const named = [];
    for (const r of ROADS) {
      if (r.tunnel) continue;
      const cls = CLS_OF[r.hw]; if (cls === undefined) continue;
      const item = { pts: r.pts, w: Math.max(CLASSES[cls].min, (r.w || 6) * 0.8) };
      const b = bbox(r.pts); put('roads', item, b[0] - item.w, b[1] - item.w, b[2] + item.w, b[3] + item.w, cls);
      if (r.name && r.pts.length >= 4) named.push({ name: r.name, pts: r.pts, w: r.w || 6, rank: RANK[r.hw] ?? 1 });
    }

    // ---- named ways: segments (for "which street am I on") and label anchors (one per ~100 m of street)
    const segGrid = new Map(), segs = [];
    const lens = named.map((r) => { let L = 0; for (let i = 2; i < r.pts.length; i += 2) L += Math.hypot(r.pts[i] - r.pts[i - 2], r.pts[i + 1] - r.pts[i - 1]); return L; });
    named.forEach((r, ri) => {
      for (let i = 2; i < r.pts.length; i += 2) {
        const s = segs.length / 5; segs.push(r.pts[i - 2], r.pts[i - 1], r.pts[i], r.pts[i + 1], ri);
        const ci0 = Math.floor(Math.min(r.pts[i - 2], r.pts[i]) / LCELL), ci1 = Math.floor(Math.max(r.pts[i - 2], r.pts[i]) / LCELL);
        const cj0 = Math.floor(Math.min(r.pts[i - 1], r.pts[i + 1]) / LCELL), cj1 = Math.floor(Math.max(r.pts[i - 1], r.pts[i + 1]) / LCELL);
        for (let a = ci0; a <= ci1; a++) for (let b = cj0; b <= cj1; b++) { const k = a * 8192 + b; let l = segGrid.get(k); if (!l) segGrid.set(k, (l = [])); l.push(s); }
      }
    });
    const anchors = [], aGrid = new Map(), sameNear = new Map();           // sameNear: name -> anchors (dedupe the two carriageways of a one-way pair)
    const order = named.map((_, i) => i).sort((a, b) => named[b].rank - named[a].rank || lens[b] - lens[a]);
    const at = (pts, cum, s) => {      // point + tangent at arclength s (tangent over +-12 m)
      const f = (u) => { u = Math.max(0, Math.min(cum[cum.length - 1], u)); let k = 1; while (k < cum.length - 1 && cum[k] < u) k++; const t = (u - cum[k - 1]) / ((cum[k] - cum[k - 1]) || 1); return [pts[(k - 1) * 2] + (pts[k * 2] - pts[(k - 1) * 2]) * t, pts[(k - 1) * 2 + 1] + (pts[k * 2 + 1] - pts[(k - 1) * 2 + 1]) * t]; };
      const p = f(s), a = f(s - 12), b = f(s + 12); return { x: p[0], z: p[1], a: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    };
    for (const ri of order) {
      const r = named[ri], L = lens[ri]; if (L < 35) continue;
      const cum = [0]; for (let i = 2; i < r.pts.length; i += 2) cum.push(cum[cum.length - 1] + Math.hypot(r.pts[i] - r.pts[i - 2], r.pts[i + 1] - r.pts[i - 1]));
      const ss = [L / 2]; for (let k = 1; L / 2 - k * LSPACE > 22; k++) ss.push(L / 2 - k * LSPACE, L / 2 + k * LSPACE);
      for (const s of ss) {
        if (s < 18 || s > L - 18) continue;
        const p = at(r.pts, cum, s);
        let list = sameNear.get(r.name); if (!list) sameNear.set(r.name, (list = []));
        if (list.some((o) => Math.hypot(o.x - p.x, o.z - p.z) < LDEDUPE)) continue;
        const an = { id: anchors.length, x: p.x, z: p.z, a: p.a, text: shortStreet(r.name), rank: r.rank, w: 0 };
        anchors.push(an); list.push(an);
        const k = Math.floor(an.x / LCELL) * 8192 + Math.floor(an.z / LCELL); let l = aGrid.get(k); if (!l) aGrid.set(k, (l = [])); l.push(an);
      }
    }
    stats.anchors = anchors.length; stats.streets = new Set(named.map((r) => r.name)).size;
    return { cells, tcols, trows, named, segs, segGrid, anchors, aGrid };
  }

  // ------------------------------------------------------------------ tiles
  const tiles = new Map();      // key -> { cv, i, j, used }
  function renderTile(i, j) {
    const t0 = performance.now();
    const tc = document.createElement('canvas'); tc.width = tc.height = TPX;
    const g = tc.getContext('2d');
    const x0 = PLAY.x0 + i * TILE - PAD, z0 = PLAY.z0 + j * TILE - PAD;
    g.scale(PPM, PPM); g.translate(-x0, -z0);
    g.fillStyle = BG; g.fillRect(x0, z0, TILE + PAD * 2, TILE + PAD * 2);
    const cl = index.cells.get(i * 4096 + j);
    if (cl) {
      const ring = (o) => { g.moveTo(o[0], o[1]); for (let k = 2; k < o.length; k += 2) g.lineTo(o[k], o[k + 1]); g.closePath(); };
      g.fillStyle = '#2f6a50'; g.beginPath(); for (const q of cl.green) ring(q.o); g.fill();
      g.fillStyle = '#4b84c8'; g.beginPath(); for (const q of cl.river) { ring(q.o); for (const h of q.h || []) ring(h); } g.fill('evenodd');
      g.fillStyle = '#3b4a90'; g.beginPath(); for (const q of cl.bld) { ring(q.o); for (const h of q.h || []) ring(h); } g.fill('evenodd');
      g.lineCap = 'round'; g.lineJoin = 'round';
      CLASSES.forEach((cls, k) => {
        g.strokeStyle = cls.col;
        for (const r of cl.roads[k]) { g.lineWidth = r.w; g.beginPath(); g.moveTo(r.pts[0], r.pts[1]); for (let q = 2; q < r.pts.length; q += 2) g.lineTo(r.pts[q], r.pts[q + 1]); g.stroke(); }
      });
    }
    tiles.set(i * 4096 + j, { cv: tc, i, j, used: 0 });
    stats.tileMs = performance.now() - t0;
  }
  function evict(cx, cz) {
    if (tiles.size <= MAX_TILES) return;
    const list = [...tiles.values()].map((t) => ({ t, d: Math.hypot(PLAY.x0 + (t.i + 0.5) * TILE - cx, PLAY.z0 + (t.j + 0.5) * TILE - cz) })).sort((a, b) => b.d - a.d);
    for (let k = 0; k < list.length && tiles.size > MAX_TILES; k++) tiles.delete(list[k].t.i * 4096 + list[k].t.j);
  }

  // ------------------------------------------------------------------ the street under the player
  const cur = { name: '', d: 1e9 };
  let boundaryNotice = '', transientNotice = '', noticeUntil = 0, streetVisible = false;
  function renderStreet() {
    const notice = boundaryNotice || (performance.now() < noticeUntil ? transientNotice : '');
    const name = notice || (streetVisible ? cur.name : '');
    if (pill.dataset.name !== name) {
      pill.dataset.name = name; pillName.textContent = name;
    }
    const latin = notice ? '' : latinStreet(name);
    if (pillLat.textContent !== latin) pillLat.textContent = latin;
    pill.classList.toggle('on', !!name);
    pill.classList.toggle('boundary-notice', !!boundaryNotice);
    pill.classList.toggle('notice', !!notice);
  }
  /** nearest named way within `radius` m of (x, z): { name, d } | null (d = distance to the kerb line) */
  function streetAt(x, z, radius = 120) {
    if (!index) index = buildIndex();
    const { segs, segGrid, named } = index, best = new Map();
    for (let a = Math.floor((x - radius) / LCELL); a <= Math.floor((x + radius) / LCELL); a++) for (let b = Math.floor((z - radius) / LCELL); b <= Math.floor((z + radius) / LCELL); b++) {
      for (const s of segGrid.get(a * 8192 + b) || []) {
        const ax = segs[s * 5], az = segs[s * 5 + 1], dx = segs[s * 5 + 2] - ax, dz = segs[s * 5 + 3] - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
        const r = named[segs[s * 5 + 4]], d = Math.hypot(x - ax - dx * t, z - az - dz * t) - r.w / 2;
        const o = best.get(r.name); if (o === undefined || d < o) best.set(r.name, d);
      }
    }
    let bn = '', bd = 1e9; for (const [n, d] of best) if (d < bd) { bd = d; bn = n; }
    if (!bn) return null;
    return { name: bn, d: Math.max(0, bd), all: best };
  }
  let pillT = 0;
  function updateStreet(x, z) {
    const r = streetAt(x, z); streetVisible = !!r;
    if (!r) { renderStreet(); return; }
    const curD = cur.name && r.all.has(cur.name) ? Math.max(0, r.all.get(cur.name)) : 1e9;
    if (!cur.name || curD > 60 || r.d < curD - 4) { cur.name = r.name; cur.d = r.d; } else cur.d = curD;      // stay on the street we were on while it is (nearly) as close as the new one
    renderStreet();
  }

  // ------------------------------------------------------------------ drawing
  let diam = 0, active = true;
  let prevLabels = new Set();
  const tick = { x: 1e9, z: 1e9, t: 0 };
  const measure = (an, font) => { if (!an.w || an.font !== font) { c.font = font; an.w = c.measureText(an.text).width; an.font = font; } return an.w; };

  function draw(s) {
    const S = cv.width, z = S / diam, rot = s.yaw - Math.PI, cr = Math.cos(rot), sr = Math.sin(rot), half = diam / 2;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, S, S);
    c.save(); c.beginPath(); c.arc(S / 2, S / 2, S / 2, 0, 6.2832); c.clip();
    c.fillStyle = BG; c.fillRect(0, 0, S, S);
    // ---- tiles under the disc (the missing ones are built nearest first, within a small time budget per frame)
    const i0 = Math.floor((s.x - half - PLAY.x0) / TILE), i1 = Math.floor((s.x + half - PLAY.x0) / TILE), j0 = Math.floor((s.z - half - PLAY.z0) / TILE), j1 = Math.floor((s.z + half - PLAY.z0) / TILE);
    const need = [];
    for (let i = Math.max(0, i0); i <= Math.min(index.tcols - 1, i1); i++) for (let j = Math.max(0, j0); j <= Math.min(index.trows - 1, j1); j++) need.push([i, j, Math.hypot(PLAY.x0 + (i + 0.5) * TILE - s.x, PLAY.z0 + (j + 0.5) * TILE - s.z)]);
    need.sort((a, b) => a[2] - b[2]);
    const tb = performance.now();
    for (const [i, j] of need) { if (tiles.has(i * 4096 + j)) continue; if (performance.now() - tb > 6 && tiles.size) break; renderTile(i, j); }
    if (performance.now() - tb < 2) {      // idle: warm the ring around the view, one tile per frame
      const pi = Math.floor((s.x - PLAY.x0) / TILE), pj = Math.floor((s.z - PLAY.z0) / TILE);
      let done = false;
      for (let r = 1; r <= WARM_RADIUS && !done; r++) for (let di = -r; di <= r && !done; di++) for (let dj = -r; dj <= r && !done; dj++) {
        const i = pi + di, j = pj + dj; if (Math.max(Math.abs(di), Math.abs(dj)) !== r || i < 0 || j < 0 || i >= index.tcols || j >= index.trows || tiles.has(i * 4096 + j)) continue;
        renderTile(i, j); done = true;
      }
    }
    evict(s.x, s.z);
    c.translate(S / 2, S / 2); c.rotate(rot); c.scale(z, z); c.translate(-s.x, -s.z);
    c.imageSmoothingEnabled = true;
    for (const [i, j] of need) { const t = tiles.get(i * 4096 + j); if (t) c.drawImage(t.cv, PLAY.x0 + i * TILE - PAD, PLAY.z0 + j * TILE - PAD, TILE + PAD * 2, TILE + PAD * 2); }
    // ---- street names
    c.setTransform(1, 0, 0, 1, 0, 0);
    drawLabels(s, S, z, cr, sr, half);
    c.restore();
    // ---- the player: an arrow always pointing up (the car arrow, or a smaller one with a view cone on foot)
    c.save(); c.translate(S / 2, S / 2);
    if (!s.car) { const g = c.createRadialGradient(0, 0, 4, 0, 0, 92); g.addColorStop(0, 'rgba(255,224,90,.42)'); g.addColorStop(1, 'rgba(255,224,90,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 92, -Math.PI / 2 - 0.62, -Math.PI / 2 + 0.62); c.closePath(); c.fill(); c.scale(0.8, 0.8); }
    c.fillStyle = '#ff4d57'; c.strokeStyle = '#fff'; c.lineWidth = 4; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(0, -20); c.lineTo(14, 16); c.lineTo(0, 8); c.lineTo(-14, 16); c.closePath(); c.stroke(); c.fill(); c.restore();
    // ---- the north marker on the rim: north (0, -1) after the map rotation
    const nx = -Math.sin(rot), nz = -Math.cos(rot);
    north.style.left = `${(0.5 + nx * 0.486) * 100}%`; north.style.top = `${(0.5 + nz * 0.486) * 100}%`;
  }

  function drawLabels(s, S, z, cr, sr, half) {
    const minRank = diam > 600 ? 2 : diam > 470 ? 1 : 0, R = S / 2 - 7;
    const cands = [];
    for (let a = Math.floor((s.x - half) / LCELL); a <= Math.floor((s.x + half) / LCELL); a++) for (let b = Math.floor((s.z - half) / LCELL); b <= Math.floor((s.z + half) / LCELL); b++) {
      for (const an of index.aGrid.get(a * 8192 + b) || []) {
        if (an.rank < minRank) continue;
        const dx = (an.x - s.x) * z, dz = (an.z - s.z) * z, sx = dx * cr - dz * sr, sz = dx * sr + dz * cr;
        if (Math.hypot(sx, sz) > R) continue;
        let th = an.a + Math.atan2(sr, cr); if (th > Math.PI) th -= 6.2832; if (th < -Math.PI) th += 6.2832;
        if (th > Math.PI / 2) th -= Math.PI; else if (th <= -Math.PI / 2) th += Math.PI;
        cands.push({ an, sx, sz, th, pr: an.rank + (prevLabels.has(an.id) ? 0.6 : 0), d: Math.hypot(sx, sz) });
      }
    }
    cands.sort((p, q) => q.pr - p.pr || p.d - q.d);
    const placed = [], now = new Set(); let drawn = 0;
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    for (const cd of cands) {
      if (drawn >= 22) break;
      const an = cd.an, big = an.rank >= 3, font = `700 ${big ? 21 : 18}px Rubik, "Noto Sans", sans-serif`, w = measure(an, font) + 4, h = big ? 22 : 19;
      const ct = Math.cos(cd.th), st = Math.sin(cd.th), ex = Math.abs(ct) * w / 2 + Math.abs(st) * h / 2, ey = Math.abs(st) * w / 2 + Math.abs(ct) * h / 2;
      if (Math.hypot(cd.sx + ct * w / 2, cd.sz + st * w / 2) > R || Math.hypot(cd.sx - ct * w / 2, cd.sz - st * w / 2) > R) continue;      // both ends inside the disc
      let ok = true;
      for (const p of placed) {
        if (Math.abs(p.x - cd.sx) < p.ex + ex + 3 && Math.abs(p.y - cd.sz) < p.ey + ey + 3) { ok = false; break; }
        if (p.text === an.text && Math.hypot(p.x - cd.sx, p.y - cd.sz) < Math.max(1.6 * w, 80)) { ok = false; break; }      // the same street again right next to it
      }
      if (!ok) continue;
      placed.push({ x: cd.sx, y: cd.sz, ex, ey, text: an.text }); now.add(an.id); drawn++;
      c.save(); c.translate(S / 2 + cd.sx, S / 2 + cd.sz); c.rotate(cd.th); c.font = font;
      c.lineWidth = 5; c.strokeStyle = 'rgba(22,32,72,.95)'; c.strokeText(an.text, 0, 1);
      c.fillStyle = an.rank >= 3 ? '#fff6dc' : '#dfe6ff'; c.fillText(an.text, 0, 1);
      c.restore();
    }
    prevLabels = now; stats.labels = drawn; stats.placed = placed.map((p) => [p.text, Math.round(p.x), Math.round(p.y)]); stats.cands = cands.length;
  }

  return {
    root, canvas: cv, stats, streetAt, shortStreet,
    showNotice(text) { transientNotice = text; noticeUntil = performance.now() + 3800; renderStreet(); },
    setBoundaryNotice(text) { if (text === boundaryNotice) return; boundaryNotice = text; renderStreet(); },
    get diam() { return diam; },
    get street() { return cur.name; },
    setActive(on) { if (on === active) return; active = on; root.classList.toggle('off', !on); document.body.classList.toggle('has-minimap', on); },
    /** s: { x, z, yaw (heading: forward = (sin yaw, cos yaw), the car's convention), diam (metres across the disc), car } */
    update(s, dt = 0.016) {
      if (!active) return;
      if (!index) { index = buildIndex(); document.body.classList.add('has-minimap'); }
      diam = diam ? diam + (s.diam - diam) * Math.min(1, 5 * dt) : s.diam;
      const t0 = performance.now();
      draw(s);
      stats.tiles = tiles.size; stats.drawMs = performance.now() - t0;
      // the street pill: only when we moved a few metres or every quarter second (the nearest-way search is cheap but not free)
      pillT -= dt;
      if (pillT <= 0 || Math.hypot(s.x - tick.x, s.z - tick.z) > 6) { pillT = 0.25; tick.x = s.x; tick.z = s.z; updateStreet(s.x, s.z); }
    },
  };
}
