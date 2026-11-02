// walls.js - turns the visible pieces of every ring edge (edges.js) into facade quads for the wall shader (wallmat.js) and collects the wall records the detail passes need.
//
// For one building:  rings -> edges -> pieces (visible intervals) -> sub-walls (cut at the carriage arches, <= 30 m) -> one quad each:
//   * facade pieces (yLow = 0): storeys, plinth, shop front or parade doors, balcony bays, shop units; the ARCH id is the building's archetype on street walls and COURT on
//     courtyard (hole) walls and back walls that face no street;
//   * firewall pieces (yLow > 0): the blank wall that stands above a lower neighbour;
//   * a carriage arch (edge.gates = [{ s, w }], filled by passages.js) cuts the wall: left / right sub-walls + a piece above the arch built as a strip along the arc.
// A wall record (returned in rec.walls) = { id, bi, e, a, b, dx, dz, nx, nz, s0, s1, len, N, bw, arch, flags, shop, units: [{ b0, b1, s, w, door }], doors: [{ s, x, z }], bal: [bay..], base, plinth, G, PN, floors, H, gate }.
//   NORDIC street walls also carry feat: [{ bay, erker, gable }] (the asymmetric FEATURE bays: a bay window and / or a gable axis; erkers.js and gables.js build them, the shader paints
//   the wide three-light windows and lesenes of those bays from the same mask) and featM (the bay mask).
// Meshes: one FacadeBuilder per 48 m cell (ctx.addStatic + noBatch in city.js).
import * as THREE from 'three';
import { hash01 } from '../lib/massing.js';
import * as L from '../layout.js';
import { ARCH, F, wallAttr, tintFlags, wearFlags, trimFlags } from './wallmat.js';
import { shopChance, shopChanceVO } from './district.js';

const CELL = 48;
export const cellKey = (x, z) => Math.floor(x / CELL) + ',' + Math.floor(z / CELL);
const STREET_ARCH = new Set([ARCH.CLASSIC, ARCH.ECLECTIC, ARCH.BRICK, ARCH.TENEMENT, ARCH.NOUVEAU, ARCH.NEOCLASS, ARCH.STALIN, ARCH.PANEL, ARCH.MODERN, ARCH.MANSION, ARCH.NORDIC, ARCH.NEOCLASSIC1910]);
const NEVSKY_RE = /Невск/, MAIN_RE = /Лиговск|Владимирск|Литейн|Марата|Маяковского|Пушкинск|Загородн|Суворовск|Восстания|Гончарн|Рубинштейна|Большая Московская|Морская|Гороховая|Садовая|Итальянск|Михайловск|Думск|Конюшенн/;
export const GATE_SPRING = 2.55;

const SLIVER = 0.9;

/** a plain blank wall quad of the piece [t0, t1] of an edge from yLow to the cornice (slivers beside arches / at the ends of party walls) */
function blankQuad(streams, rec, e, t0, t1, y0, yLow) {
  const { st } = rec, tab = st.tab, len = t1 - t0, N = Math.max(1, Math.round(len / 3));
  const a = [e.a[0] + e.dx * t0, e.a[1] + e.dz * t0], bb = [e.a[0] + e.dx * t1, e.a[1] + e.dz * t1];
  const at = wallAttr({ arch: ARCH.FIREWALL, floors: tab.floors, H: st.H, bw: len / N, N, i0: 0, seed: st.seed, flags: F.BLANK | wearFlags(Math.max(2, st.wear)), plinth: 1, G: tab.G, PN: tab.PN, centre: -1 });
  streams((a[0] + bb[0]) / 2, (a[1] + bb[1]) / 2).quad(a, bb, y0 + yLow, y0 + st.H, e.nx, e.nz, 0, N, yLow, st.H, at, st.color);
}

/** CRACK LINERS (edges.js: e.liners = [{ t0, t1, h }]): where the neighbour's footprint comes within 12 cm of this wall but does not touch it, the wall hid itself and so did the neighbour's:
 *  the slit between them showed the sky through the hollow bodies. A plain blank quad closes the part that stays hidden (h = height above the wall base). No wall record, no details, no collider. */
function addLiners(streams, rec, e) {
  if (!e.liners || !e.liners.length) return;
  const { b, st } = rec, y0 = Math.max(0, b.minH || 0), tab = st.tab;
  for (const ln of e.liners) {
    const n = Math.max(1, Math.ceil((ln.t1 - ln.t0) / 30));
    for (let k = 0; k < n; k++) {
      const t0 = ln.t0 + (ln.t1 - ln.t0) * k / n, t1 = ln.t0 + (ln.t1 - ln.t0) * (k + 1) / n, len = t1 - t0, N = Math.max(1, Math.round(len / 3));
      const a = [e.a[0] + e.dx * t0, e.a[1] + e.dz * t0], bb = [e.a[0] + e.dx * t1, e.a[1] + e.dz * t1];
      const at = wallAttr({ arch: ARCH.FIREWALL, floors: tab.floors, H: st.H, bw: len / N, N, i0: 0, seed: st.seed, flags: F.BLANK | wearFlags(Math.max(2, st.wear)), plinth: 1, G: tab.G, PN: tab.PN, centre: -1 });
      streams((a[0] + bb[0]) / 2, (a[1] + bb[1]) / 2).quad(a, bb, y0, y0 + ln.h, e.nx, e.nz, 0, N, 0, ln.h, at, st.color);
    }
  }
}

const bays = (len, target) => { const n = Math.max(1, Math.round(len / target)); return n; };

/** Corner test at the START of edge i of a ring: true when the ring turns by more than 25 degrees there. */
function cornerAt(ring, i) {
  const n = ring.pts.length, p = ring.pts[(i + n - 1) % n], a = ring.pts[i], b = ring.pts[(i + 1) % n];
  const d1x = a[0] - p[0], d1z = a[1] - p[1], d2x = b[0] - a[0], d2z = b[1] - a[1];
  const l1 = Math.hypot(d1x, d1z) || 1, l2 = Math.hypot(d2x, d2z) || 1;
  return (d1x * d2x + d1z * d2z) / (l1 * l2) < Math.cos(25 * Math.PI / 180);
}

/** One sub-wall: composition (bays, balconies, doors, shop units) and the quad. Returns the wall record. */
function addSubWall(ctx, B, rec, e, s0, s1, o) {
  const { b, st } = rec;
  const len = s1 - s0, arch = o.arch, tab = st.tab;
  const key = b.id + ':' + e.i + ':' + Math.round(s0);
  const target = o.shop && arch !== ARCH.COURT ? Math.max(st.bayTarget, 3.0) : st.bayTarget;
  const N = bays(len, o.court ? 2.8 : target);
  const bw = len / N;
  const w = { id: key, bi: rec.bi, rec, e, a: [e.a[0] + e.dx * s0, e.a[1] + e.dz * s0], b: [e.a[0] + e.dx * s1, e.a[1] + e.dz * s1], dx: e.dx, dz: e.dz, nx: e.nx, nz: e.nz, s0, s1, len, N, bw, arch, shop: !!o.shop, units: [], doors: [], bal: [], base: o.y0, plinth: o.plinth, G: o.G, PN: tab.PN, floors: tab.floors, H: st.H, hole: e.hole, street: e.street, gate: false };
  w.midX = (w.a[0] + w.b[0]) / 2; w.midZ = (w.a[1] + w.b[1]) / 2;
  let flags = tintFlags(st.gfTint) | wearFlags(st.wear) | trimFlags(st.trimClass);
  if(b.waterfront||!L.inPlay(st.ob.cx,st.ob.cz,-50))flags|=F.SCENIC;
  let balM = 0, doorM = 0, pierM = 0, sdoorM = 0, centre = -1;
  const floors = tab.floors, street = (!!e.street || !!st.allFronts) && !e.hole;      // allFronts: a free-standing yard house (KNOWN `yard`) has doors and trim on every outer wall
  // Detail offsets are local to w.a, which already includes s0.
  // ---- shop units (street walls): piers at the unit starts, a shop door per unit, a parade door when the wall is long
  if (o.shop) {
    flags |= F.SHOP;
    const nev = e.street && NEVSKY_RE.test(e.street.name);
    let k = 0, ui = 0;
    const parade = len > 13 ? Math.max(1, Math.min(N - 2, Math.floor(N * (0.25 + 0.5 * hash01(key + 'p'))))) : -1;
    while (k < N) {
      if (k === parade) { doorM |= (1 << k); if (k > 0) pierM |= (1 << k); k++; if (k < N) pierM |= (1 << k); continue; }
      const maxU = nev ? 4 : 3;
      let u = 1 + Math.floor(hash01(key + 'u' + ui) * maxU);
      if (nev && u < 2 && hash01(key + 'v' + ui) < 0.7) u = 2;
      if (parade > k) u = Math.min(u, parade - k);
      u = Math.min(u, N - k);
      if (N - (k + u) === 1 && k + u !== parade) u++;                // no lonely last bay
      if (k > 0) pierM |= (1 << k);
      const door = hash01(key + 'd' + ui) < 0.5 ? k : k + u - 1;
      sdoorM |= (1 << door);
      w.units.push({ b0: k, b1: k + u, s: (k + u / 2) * bw, w: u * bw, door: (door + 0.5) * bw, bay: door });
      k += u; ui++;
    }
    if (parade >= 0) w.doors.push({ s: (parade + 0.5) * bw });
  } else if (street || o.court) {
    // parade doors (парадные) every ~20 m on residential street walls; back doors every ~12 m in courtyards
    const per = o.court ? 12 : 20;
    if (len >= 5 && arch !== ARCH.SERVICE && !st.podium) {
      const nd = Math.max(1, Math.round(len / per));
      for (let k = 0; k < nd; k++) {
        const bay = Math.max(N > 3 ? 1 : 0, Math.min(N - (N > 3 ? 2 : 1), Math.floor(((k + 0.5) / nd + (hash01(key + 'q' + k) - 0.5) * 0.25) * N)));
        if (doorM & (1 << bay)) continue;
        doorM |= (1 << bay); w.doors.push({ s: (bay + 0.5) * bw });
      }
    }
  }
  // ---- glazed stair towers on courtyard walls (one per ~18 m)
  if (o.court && arch === ARCH.COURT && len > 9 && floors >= 3) {
    const ns = Math.max(1, Math.round(len / 18));
    for (let k = 0; k < ns; k++) { const bay = Math.max(1, Math.min(N - 2, Math.floor(((k + 0.5) / ns + (hash01(key + 'st' + k) - 0.5) * 0.3) * N))); if (!(doorM & (1 << bay))) sdoorM |= (1 << bay); }
  }
  // ---- NORDIC: feature bays. Asymmetric on purpose (Northern Modern fronts are composed off-centre): one per ~6 bays, pulled towards a third of the wall, never on a door bay
  let featM = 0;
  if (arch === ARCH.NORDIC && street && floors >= 3 && N >= 3 && len >= 8.5) {
    const nf = N >= 13 ? 3 : N >= 7 ? 2 : 1, lo = N > 4 ? 1 : 0, hi = N - (N > 4 ? 2 : 1);
    const anchors = nf === 1 ? [hash01(key + 'fa') < 0.5 ? 0.28 : 0.72] : nf === 2 ? [0.18, 0.78] : [0.13, 0.5, 0.87];
    w.feat = [];
    for (let k = 0; k < nf; k++) {
      let c = Math.round(anchors[k] * (N - 1) + (hash01(key + 'fj' + k) - 0.5) * 1.2);
      c = Math.max(lo, Math.min(hi, c));
      if ((doorM >> c) & 1) c = c + 1 <= hi ? c + 1 : c - 1;
      if (c < lo || c > hi || ((doorM >> c) & 1) || (featM & ((1 << c) | (1 << (c + 1)) | (c > 0 ? 1 << (c - 1) : 0)))) continue;
      featM |= 1 << c;
      w.feat.push({ bay: c, erker: !!st.erkers && floors >= 4 && hash01(key + 'fe' + k) < 0.82, gable: false });
    }
    const ord = w.feat.slice().sort((p, q) => hash01(key + 'fg' + p.bay) - hash01(key + 'fg' + q.bay));
    for (let k = 0; k < Math.min(len >= 32 ? (st.gable || 0) : len >= 12.5 ? Math.min(1, st.gable || 0) : 0, ord.length); k++) ord[k].gable = true;      // a gable needs a front of some width; two only on a long one
  }
  w.featM = featM;
  // ---- balconies on the piano nobile of street walls (iron railings; the slab geometry is built by details.js from w.bal)
  if (street && floors >= 3 && N >= 4 && len >= 11 && [ARCH.ECLECTIC, ARCH.TENEMENT, ARCH.CLASSIC, ARCH.NOUVEAU, ARCH.NEOCLASS, ARCH.MANSION, ARCH.STALIN, ARCH.NORDIC, ARCH.NEOCLASSIC1910].includes(arch)) {
    const pBal = arch === ARCH.TENEMENT ? 0.85 : arch === ARCH.STALIN ? 0.3 : arch === ARCH.NORDIC ? 0.5 : 0.65;
    const ng = Math.max(1, Math.min(3, Math.floor(N / 4)));
    for (let g = 0; g < ng; g++) {
      if (hash01(key + 'b' + g) > pBal) continue;
      const gwid = N >= 8 && hash01(key + 'w' + g) < 0.4 ? 3 : N >= 6 ? 2 : (arch === ARCH.TENEMENT ? 1 : (hash01(key + 'w' + g) < 0.5 ? 2 : 1));
      let c = Math.floor((g + 0.5) / ng * N - gwid / 2 + (hash01(key + 'c' + g) - 0.5) * 0.9);
      c = Math.max(N > 3 ? 1 : 0, Math.min(N - gwid - (N > 3 ? 1 : 0), c));
      if (c < 0) continue;
      const g0 = c, g1 = c + gwid;
      if (w.bal.some((x) => g0 < x.b1 + 1 && g1 > x.b0 - 1)) continue;
      if (featM) { let hit = false; for (let k = g0 - 1; k <= g1; k++) if (k >= 0 && ((featM >> k) & 1)) hit = true; if (hit) continue; }      // a balcony never runs into a bay window
      w.bal.push({ b0: g0, b1: g1 }); for (let k = g0; k < g1; k++) balM |= (1 << k);
    }
  }
  // ---- emphasised centre axis
  if (street && N >= 3 && N % 2 === 1 && len < 46 && [ARCH.CLASSIC, ARCH.ECLECTIC, ARCH.TENEMENT, ARCH.STALIN, ARCH.MANSION, ARCH.NEOCLASS].includes(arch)) centre = (N - 1) / 2; else flags |= F.NOCENTRE;
  if (st.rich) flags |= F.RICH;
  if (st.granite && street) flags |= F.GRANITE;
  if (st.majolica && street) flags |= F.MAJOLICA;
  if ((st.socle || st.columns) && street) flags |= F.SOCLE;
  if (arch === ARCH.NORDIC) centre = featM;            // the centre slot carries the feature-bay mask of NORDIC walls (wallmat.js)
  if (o.court) flags |= F.COURT;
  if (st.restore && street) flags |= F.NET | (st.restore === 2 ? F.GREENNET : 0);
  if (o.qL) flags |= F.QUOIN_L; if (o.qR) flags |= F.QUOIN_R;
  w.flags = flags; w.balM = balM; w.centre = centre;
  const at = wallAttr({ arch, floors, H: st.H, bw, N, i0: Math.round(s0), seed: st.seed, flags, plinth: o.plinth, G: o.G, PN: tab.PN, centre, bal: balM, door: doorM, pier: pierM, sdoor: sdoorM });
  B.quad(w.a, w.b, o.y0, o.y0 + st.H, e.nx, e.nz, 0, N, 0, st.H, at, o.color);
  return w;
}

/** The wall piece above a carriage arch (strip along the arc) + attributes. gate = { s, w }. */
function addGatePiece(ctx, B, rec, e, gate, o) {
  const { st } = rec, tab = st.tab, K = 10, gw = gate.w, r = gw / 2;
  const cx = e.a[0] + e.dx * gate.s, cz = e.a[1] + e.dz * gate.s;
  const P = (x, y) => [cx + e.dx * x, o.y0 + y, cz + e.dz * x];
  const flags = F.GATE | tintFlags(st.gfTint) | wearFlags(st.wear) | trimFlags(st.trimClass) | (st.rich ? F.RICH : 0) | F.NOCENTRE | (o.court ? F.COURT : 0);
  const balM = o.balcony ? 1 : 0;
  const at = wallAttr({ arch: o.arch, floors: tab.floors, H: st.H, bw: gw, N: 1, i0: Math.round(gate.s), seed: st.seed, flags, plinth: o.plinth, G: o.G, PN: tab.PN, centre: -1, bal: balM, door: 0, pier: 0, sdoor: 0 });
  const cy = GATE_SPRING;
  for (let k = 0; k < K; k++) {
    const t0 = Math.PI - (k / K) * Math.PI, t1 = Math.PI - ((k + 1) / K) * Math.PI;
    const x0 = Math.cos(t0) * r, y0 = cy + Math.sin(t0) * r, x1 = Math.cos(t1) * r, y1 = cy + Math.sin(t1) * r;
    const top = st.H;
    B.face([P(x0, y0), P(x1, y1), P(x1, top), P(x0, top)], [e.nx, 0, e.nz], [[(x0 + r) / gw, y0], [(x1 + r) / gw, y1], [(x1 + r) / gw, top], [(x0 + r) / gw, top]], at, o.color);
  }
}

/** Build all walls of one building. streams: (x, z) -> FacadeBuilder. Returns the wall records. */
export function buildWalls(ctx, rec, streams, env) {
  const { b, st } = rec;
  const walls = [];
  const y0 = Math.max(0, b.minH || 0), floating = y0 > 0.2;
  const tab = st.tab;
  for (const ring of rec.rings) {
    for (const e of ring.edges) {
      addLiners(streams, rec, e);
      if (!e.pieces.length) continue;
      const court = (e.hole || !e.street) && !(st.allFronts && !e.hole);
      const streetWall = !!e.street && !e.hole;
      const arch = court ? (STREET_ARCH.has(st.arch) ? ARCH.COURT : st.arch) : st.arch;
      const color = court && st.courtColor ? st.courtColor : st.color;
      // shop front?
      let shop = false;
      if (streetWall && !floating && e.len >= 5 && st.arch !== ARCH.SERVICE && st.arch !== ARCH.COURT && tab.floors >= 1) {
        const nm = e.street.name || '';
        const p = st.fresh ? shopChanceVO(nm, st.zone, e.a[0] + e.dx * e.len / 2, e.a[1] + e.dz * e.len / 2) : st.dist ? shopChance(st.dist, nm) : NEVSKY_RE.test(nm) ? 0.95 : MAIN_RE.test(nm) ? 0.62 : 0.30;
        shop = st.shop === true ? true : st.shop === false ? false : hash01(b.id + ':shop:' + e.i) < p;
        if (shop && (L.inRiver(e.a[0] + e.dx * e.len / 2 + e.nx * 1.6, e.a[1] + e.dz * e.len / 2 + e.nz * 1.6) || L.inRiver(e.a[0] + e.dx * e.len / 2, e.a[1] + e.dz * e.len / 2))) shop = false;
      }
      const plinth = floating ? 0 : shop ? 0.4 : (arch === ARCH.SERVICE ? 0.5 : 1.0);
      const G = tab.G + (tab.plinth - plinth);
      for (const pc of e.pieces) {
        // a facade piece narrower than a bay (the end of a party wall) is a plain blank wall and is never skipped: a skipped sliver is a slit onto the hollow body
        const sliver = pc.yLow <= 0.2 && pc.t1 - pc.t0 < SLIVER;
        if (pc.yLow > 0.2 || sliver) {
          // firewall: the wall above a lower neighbour
          const len = pc.t1 - pc.t0; if (len < 0.05 || pc.yLow >= st.H - 0.3) continue;
          const N = Math.max(1, Math.round(len / 3)), bw = len / N;
          const a = [e.a[0] + e.dx * pc.t0, e.a[1] + e.dz * pc.t0], bb = [e.a[0] + e.dx * pc.t1, e.a[1] + e.dz * pc.t1];
          // (st.noFirewall, archetypes.js: a free-standing block of a new complex. The wall above its own lower wing is a facade with windows, not a blank party wall with brick patches)
          const up = !!st.noFirewall && !sliver;
          const at = wallAttr({ arch: up ? st.arch : ARCH.FIREWALL, floors: tab.floors, H: st.H, bw, N, i0: 0, seed: st.seed, flags: up ? wearFlags(st.wear) : F.BLANK | wearFlags(Math.max(2, st.wear)), plinth: 1, G: tab.G, PN: tab.PN, centre: -1 });
          const mid = [(a[0] + bb[0]) / 2, (a[1] + bb[1]) / 2];
          streams(mid[0], mid[1]).quad(a, bb, y0 + pc.yLow, y0 + st.H, e.nx, e.nz, 0, N, pc.yLow, st.H, at, st.color);
          continue;
        }
        // cut at carriage arches
        const gates = (e.gates || []).filter((g) => g.s - g.w / 2 > pc.t0 + 0.9 && g.s + g.w / 2 < pc.t1 - 0.9).sort((p, q) => p.s - q.s);
        let cur = pc.t0;
        const subs = [];
        for (const g of gates) { if (g.s - g.w / 2 - cur > 0.9) subs.push([cur, g.s - g.w / 2]); else if (g.s - g.w / 2 - cur > 0.05) subs.push([cur, g.s - g.w / 2, 'thin']); cur = g.s + g.w / 2; }
        if (pc.t1 - cur > 0.05) subs.push([cur, pc.t1]);
        // split long sub-walls
        const parts = [];
        for (const sp of subs) { const L0 = sp[1] - sp[0], n = Math.max(1, Math.ceil(L0 / 30)); for (let k = 0; k < n; k++) parts.push([sp[0] + L0 * k / n, sp[0] + L0 * (k + 1) / n]); }
        parts.forEach((sp, k) => {
          if (sp[1] - sp[0] < SLIVER) { blankQuad(streams, rec, e, sp[0], sp[1], y0, 0); return; }
          const qL = sp[0] <= 0.01 && !e.hole && cornerAt(e.ring, e.i);
          const qR = sp[1] >= e.len - 0.01 && !e.hole && cornerAt(e.ring, (e.i + 1) % e.ring.pts.length);
          const mx = e.a[0] + e.dx * (sp[0] + sp[1]) / 2, mz = e.a[1] + e.dz * (sp[0] + sp[1]) / 2;
          const w = addSubWall(ctx, streams(mx, mz), rec, e, sp[0], sp[1], { arch, shop, plinth, G, y0, color, court, qL, qR });
          walls.push(w);
        });
        for (const g of gates) {
          const mx = e.a[0] + e.dx * g.s, mz = e.a[1] + e.dz * g.s;
          const bal = !court && tab.floors >= 3 && hash01(b.id + ':gb:' + e.i + Math.round(g.s)) < 0.6;
          addGatePiece(ctx, streams(mx, mz), rec, e, g, { arch, plinth: shop ? 1.0 : plinth, G: tab.G, y0, color, court, balcony: bal });
          walls.push({ id: b.id + ':gate:' + e.i + ':' + Math.round(g.s), bi: rec.bi, rec, e, a: [e.a[0] + e.dx * (g.s - g.w / 2), e.a[1] + e.dz * (g.s - g.w / 2)], b: [e.a[0] + e.dx * (g.s + g.w / 2), e.a[1] + e.dz * (g.s + g.w / 2)], dx: e.dx, dz: e.dz, nx: e.nx, nz: e.nz, s0: g.s - g.w / 2, s1: g.s + g.w / 2, len: g.w, N: 1, bw: g.w, arch, shop: false, units: [], doors: [], bal: bal ? [{ b0: 0, b1: 1 }] : [], base: y0, plinth, G: tab.G, PN: tab.PN, floors: tab.floors, H: st.H, hole: e.hole, street: e.street, gate: true, gateDef: g, midX: mx, midZ: mz, flags: 0 });
        }
      }
    }
  }
  return walls;
}
