// landmarksKamennoostrovsky/tenement.js - one data-driven builder for the tenement houses of the avenues (house.js scaffolding + nouveau.js vocabulary).
// buildTenement(K, N, svc, cfg) draws the records `ids` as one house:
//   walls      party walls are found by the contact rule of house.js; an outer edge is a STREET front when a road / square lies in front of it (cfg.street overrides), everything else gets the plain courtyard wall
//   elevation  cfg.floors (upper storeys: sill y, height, width, surround style), cfg.pitch, cfg.base (ground floor: 'shop' | 'arch' | 'plain' | 'none' with boards of generic Russian shop names,
//              parade doors, all reserved in the label registry and clear of the street plates), cfg.balconies, cfg.bands (string courses), cfg.edge(e, len) per-edge overrides
//   features   cfg.features: [{ at: [x, z], draw(u, len, e) }] are drawn in the frame of the street edge nearest to the world point `at` (bay windows, gables, portals placed from the OSM footprint
//              or from the photos); cfg.extra(e, len, xs) after every street elevation; cfg.after(info) in the world frame (corner turrets)
//   doorways   cfg.doorways: [{ at: [x, z], w, h, clear, depth }] = open passages through a street front (a metro vestibule inside the house: data/metro.js DOORWAYS, whose rows also split the wall
//              colliders in lib/massing.js): the wall field, the base band and the plinth are cut, jambs and a soffit `depth` m deep line the opening, no shop window within `clear` m of its axis
//   roof       flat sheet deck at the cornice + cfg.mansard (attic prism behind the cornice, mitred at the corners between street fronts, dormers)
// Returns the info of buildHouse plus { streetEdges }.
import * as L from '../layout.js';
import { buildHouse } from './house.js';
import { NC } from './nouveau.js';

const SHOPS = ['Булочная', 'Кофейня', 'Аптека', 'Цветы', 'Книги', 'Оптика', 'Продукты', 'Ателье', 'Кондитерская', 'Парикмахерская', 'Антиквариат', 'Часы', 'Обувь', 'Фотоателье', 'Ткани', 'Посуда', 'Сувениры',
  'Чай и кофе', 'Кафе', 'Пекарня', 'Канцтовары', 'Салон красоты', 'Стоматология', 'Нотариус', 'Ремонт часов', 'Табак', 'Вино', 'Сыр', 'Мебель', 'Подарки', 'Трикотаж', 'Багет', 'Ноты', 'Игрушки'];
const BGS = ['#2b2622', '#1f2a26', '#4a1f26', '#e9e2d0', '#1e3a2a', '#3a2a22', '#23304a', '#e6dcc4'], FGS = ['#f0e6cf', '#f4f1e8', '#f3e6d0', '#2a2622', '#efe8d0', '#e8d8b0', '#f0ead8', '#3a2a22'];

const hashS = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };

export function buildTenement(K, N, svc, cfg) {
  const P = K.P, M = K.mats;
  const recs = cfg.ids.map((id) => L.buildingById(id)).filter(Boolean);
  if (!recs.length) return null;
  const up = cfg.up ?? 0.4, wall = K.wall(cfg.wall), trim = cfg.trim || M.trim, H = (e) => (e.hc ?? cfg.hc) + up;
  let shopSeed = Math.floor(hashS(cfg.name || cfg.ids[0]) * 97);
  const isStreet = (e) => {
    if (e.hole || e.party) return false;
    if (cfg.street) { const r = cfg.street(e); if (r != null) return r; }
    const mx = (e.a[0] + e.b[0]) / 2, mz = (e.a[1] + e.b[1]) / 2;
    if (L.insideBuilding(mx + e.n[0] * 2.5, mz + e.n[1] * 2.5)) return false;
    // march out of the wall: a street front sees a road (not a service lane) before another house; cfg.reach = how far a set-back front (a court of honour, a front garden) may look
    for (let d = 5; d <= (cfg.reach ?? 11); d += 6) { const x = mx + e.n[0] * d, z = mz + e.n[1] * d; if (d > 6 && L.insideBuilding(x, z)) return false; if (L.roadsNear(x, z, 4.5, { drivable: true }).some((h) => h.road.hw !== 'service')) return true; }
    return false;
  };
  const streetEdges = [];
  const plinthH = cfg.plinth ?? 0.75, plinthMat = cfg.plinthMat || N.rock(NC.granite);
  /** the open passages of cfg.doorways that lie on edge e (distance of the point to the wall segment < 1.5 m) */
  const doorwaysOf = (e) => (cfg.doorways || []).filter((d) => {
    const dx = e.b[0] - e.a[0], dz = e.b[1] - e.a[1], t = ((d.at[0] - e.a[0]) * dx + (d.at[1] - e.a[1]) * dz) / (e.len * e.len);
    return !e.hole && t > 0 && t < 1 && Math.abs((d.at[0] - e.a[0]) * e.n[0] + (d.at[1] - e.a[1]) * e.n[1]) < 1.5;
  });

  /** ground floor of a street front */
  function ground(e, len, xs, S) {
    const B = S.base || {}, kind = B.kind || 'shop', y0 = B.y0 ?? 0.75, y1 = B.y1 ?? 3.75, pitch = xs.length > 1 ? xs[1] - xs[0] : len;
    if (kind === 'none' || !xs.length) return;
    const n = xs.length, isDoor = B.doors || ((i, k) => (k >= 3 ? i % 5 === 2 : false));
    xs.forEach((x, i) => {
      const w = Math.min(B.w ?? pitch - (B.pier ?? 0.85), pitch - 0.5, len - 0.6);
      if (w < 0.7) return;
      if (N.blocked(x - w / 2 - 0.15, x + w / 2 + 0.15, y0, y1 + 0.2)) return;
      if ((S.open || []).some((d) => x + w / 2 + 0.15 > d.u - d.clear && x - w / 2 - 0.15 < d.u + d.clear)) return;      // the plain front of a vestibule doorway
      if (kind === 'plain') { N.window({ x, y: B.sill ?? 1.3, w: B.w ?? 1.15, h: B.winH ?? 2.0, style: B.style || 'plain', mat: B.trim || trim, frame: S.frame }); return; }
      const head = kind === 'arch' ? 'arch' : 'flat', fm = B.frameMat || trim;
      if (isDoor(i, n)) {
        const dw = Math.min(1.7, w), dm = B.doorMat || N.mats.door;
        P.box(dm, x - dw / 2, x + dw / 2, 0.12, 2.6, 0.04, 0.125, 'kb'); P.box(N.mats.iron, x - 0.02, x + 0.02, 0.12, 2.6, 0.125, 0.145, 'kb');   // the leaf stands 2.5 cm proud of the plinth band (0.10)
        K.glass(M.winBrown, x, 2.72, dw, Math.max(0.5, y1 - 2.72), head === 'arch' ? 'arch' : 'flat', 1);
        if (head === 'arch') N.archRing(fm, x, 0, dw, y1, 0.2, 0.14); else { P.box(fm, x - dw / 2 - 0.2, x - dw / 2, 0, y1 + 0.2, 0, 0.14, 'kb'); P.box(fm, x + dw / 2, x + dw / 2 + 0.2, 0, y1 + 0.2, 0, 0.14, 'kb'); P.box(fm, x - dw / 2, x + dw / 2, y1, y1 + 0.2, 0, 0.14, 'k'); }
        P.box(fm, x - dw / 2, x + dw / 2, 2.6, 2.72, 0.04, 0.15, 'k');
        svc.entrances.push({ x: N.world(x, 0.6)[0], z: N.world(x, 0.6)[1], rotY: Math.atan2(e.n[0], e.n[1]), kind: 'door', bldg: e.rec.id });
        return;
      }
      K.glass(M.shop, x, y0, w, y1 - y0, head, (i + shopSeed) % 4, 0.06, 4);
      if (head === 'arch') N.archRing(fm, x, y0, w, y1 - y0, B.fw ?? 0.16, 0.12); else { P.box(fm, x - w / 2 - 0.12, x - w / 2, y0, y1 + 0.12, 0, 0.12, 'kbt'); P.box(fm, x + w / 2, x + w / 2 + 0.12, y0, y1 + 0.12, 0, 0.12, 'kbt'); P.box(fm, x - w / 2, x + w / 2, y1, y1 + 0.12, 0, 0.12, 'kt'); }
      P.box(B.sillMat || fm, x - w / 2 - 0.1, x + w / 2 + 0.1, y0 - 0.1, y0, 0, 0.16, 'k');
      if (B.signs !== false && (i + shopSeed) % (B.signEvery ?? 2) === 0) {
        const k = (shopSeed + i * 7) % 32, sw = Math.min(w - 0.1, 2.0), sy = head === 'arch' ? y0 + (y1 - y0) * 0.36 : y1 + 0.12 + 0.3 + (B.signLift ?? 0);
        N.shopSign((N.signAtlas ||= N.makeSignAtlas(SHOPS, BGS, FGS)), x, sy, sw, 0.5, k, head === 'arch' ? 0.1 : 0.05);
      }
      if (B.awnings && (i + shopSeed) % B.awnings === 1) K.awning(x - w / 2 - 0.1, x + w / 2 + 0.1, y1 + 0.05, 1.3, 0.6, B.awningMat || M.awning);
    });
  }

  function street(e, len) {
    const S = { ...cfg, ...(cfg.edge ? cfg.edge(e, len) || {} : {}) };
    const top = H(e);
    const wallE = S.wallMat || wall;                                               // cfg.edge may give one front its own field material (a second house in the same OSM outline)
    if (len < 1.5) { K.wallQuad(wallE, 0, len, 0, top, 3); if (S.base && S.base.mat) K.wallQuad(S.base.mat, 0, len, 0, S.base.h, S.base.tile ?? 2.4, 0.012, S.base.tileY ?? (S.base.tile ?? 2.4) / 1.5); return; }
    const m = S.margin ?? (len < 7 ? Math.max(0.5, len * 0.16) : 1.25);
    const xs = S.xs ? S.xs(len) : (len < 3.2 ? [len / 2] : K.bays(m, len - m, S.pitch ?? 3.0));
    // open passages on this front (frame coordinates: u = axis along the wall)
    S.open = doorwaysOf(e).map((d) => ({ u: (d.at[0] - N.cur.f.x) * N.cur.f.xa[0] + (d.at[1] - N.cur.f.z) * N.cur.f.xa[1], w: d.w, h: d.h ?? 2.7, clear: d.clear ?? d.w / 2 + 0.2, depth: d.depth ?? 0.43 }));
    N.elevation(len, { wall: wallE, H: top, xs, trim, frame: S.frame, base: S.base && S.base.mat ? S.base : null, floors: S.floors, skip: S.skip ? S.skip(len, xs) : null, holes: S.open.map((d) => [d.u - d.w / 2, d.u + d.w / 2, d.h]) });
    if (S.open.length) {
      // the plinth of this front by hand (house.js leaves it out: noPlinth), cut at the openings; jambs and soffit through the wall thickness
      let x = e.party ? 0 : -0.1; const rm = (S.base && S.base.mat) || wall;
      for (const d of S.open.slice().sort((p, q) => p.u - q.u)) {
        if (plinthH > 0 && d.u - d.w / 2 > x + 0.05) P.box(plinthMat, x, d.u - d.w / 2, 0, plinthH, 0, 0.1, 'kb');
        x = d.u + d.w / 2;
        const a = d.u - d.w / 2, b = d.u + d.w / 2, D = d.depth;
        P.quad(rm, [a, 0, 0], [a, 0, -D], [a, d.h, -D], [a, d.h, 0], [1, 0, 0], [[0, 0], [D, 0], [D, d.h], [0, d.h]]);
        P.quad(rm, [b, 0, -D], [b, 0, 0], [b, d.h, 0], [b, d.h, -D], [-1, 0, 0], [[0, 0], [D, 0], [D, d.h], [0, d.h]]);
        P.quad(rm, [a, d.h, 0], [b, d.h, 0], [b, d.h, -D], [a, d.h, -D], [0, -1, 0], [[a, 0], [b, 0], [b, D], [a, D]]);
      }
      if (plinthH > 0 && x < len) P.box(plinthMat, x, len + 0.1, 0, plinthH, 0, 0.1, 'kb');
    }
    ground(e, len, xs, S);
    for (const b of S.balconies || []) {
      const F = S.floors[b.floor]; if (!F) continue;
      xs.forEach((x, i) => {
        if (!b.bays(i, xs.length, len)) return;
        const w = b.w ?? 2.0, y = F.y - (b.drop ?? 0.12);
        if (b.kind === 'stone') N.stoneBalcony(x - w / 2, x + w / 2, y, b.d ?? 0.85, { mat: b.mat || trim, hex: b.hex || NC.stoneLight, balHex: b.balHex, corbels: b.corbels });
        else N.ironBalcony(x - w / 2, x + w / 2, y, b.d ?? 0.7, { kind: b.kind === 'bars' ? 'bars' : 'grille', slabMat: b.mat || trim });
      });
    }
    for (const f of cfg.features || []) {
      const dx = f.at[0] - N.cur.f.x, dz = f.at[1] - N.cur.f.z, u = dx * N.cur.f.xa[0] + dz * N.cur.f.xa[1], d = dx * e.n[0] + dz * e.n[1];
      if (u < -0.3 || u > len + 0.3 || Math.abs(d) > (f.tol ?? 2.2)) continue;
      if (f.done && !f.multi) continue;
      f.done = true; f.draw(Math.max(0, Math.min(len, u)), len, e, xs);
    }
    if (S.extra) S.extra(e, len, xs, top);
  }

  const info = buildHouse(K, {
    name: cfg.name, recs, polysOf: cfg.polysOf, clearRoad: cfg.clearRoad, hc: cfg.hc, hcOf: cfg.hcOf, hcEdge: cfg.hcEdge, upstand: up, wall: cfg.wall, court: cfg.court || cfg.wall, plinth: plinthH, plinthMat,
    floors: cfg.courtFloors || [4.4, 3.7, 3.6, 3.5, 3.4, 3.3], courtPitch: cfg.courtPitch ?? 3.3, railing: cfg.railing ?? false, cornice: cfg.cornice === 'none' ? 'none' : undefined, corniceMat: cfg.corniceMat, corniceScale: cfg.corniceScale,
    roofMat: cfg.roofMat || M.roofSilver, roof: cfg.roof, party: cfg.party, noBand: cfg.noBand, noPlinth: (e, rec) => !!(cfg.noPlinth && cfg.noPlinth(e, rec)) || doorwaysOf(e).length > 0, noWin: cfg.noWin, partyOpts: cfg.partyOpts, collide: cfg.collide,
    front: (e, c) => {
      if (cfg.front) { const r = cfg.front(e, c); if (r) return true; }
      if (!isStreet(e)) return false;
      e.street = true; streetEdges.push(e);
      N.withEdge(e, c.f, c.len, () => street(e, c.len)); return true;
    },
    bands: (cfg.bands || []).map((b) => ({ ...b, draw: b.all ? undefined : (e) => !!e.street && (!b.draw || b.draw(e)) })),
  });

  // attic prisms behind the cornice, mitred where two street fronts meet
  if (cfg.mansard) {
    const R = cfg.mansard;
    for (const e of streetEdges) {
      if (e.len < (R.minLen ?? 3.5) || (R.on && !R.on(e))) continue;
      const g = e.ringEdges, k = g.indexOf(e), tan = (o) => {
        if (!o || !o.street || o.len < 1.0 || Math.abs((o.hc ?? cfg.hc) - (e.hc ?? cfg.hc)) > 0.5) return 0;
        const shared = Math.hypot(o.a[0] - e.b[0], o.a[1] - e.b[1]) < 0.06 ? e.b : Math.hypot(o.b[0] - e.a[0], o.b[1] - e.a[1]) < 0.06 ? e.a : null; if (!shared) return 0;
        const far = shared === e.b ? e.a : e.b, wx = (far[0] - shared[0]) / e.len, wz = (far[1] - shared[1]) / e.len;
        const cs = Math.max(-1, Math.min(1, e.n[0] * o.n[0] + e.n[1] * o.n[1])), phi = Math.acos(cs), t = Math.tan(Math.min(phi, 2.6) / 2);
        return (o.n[0] * wx + o.n[1] * wz) < 0 ? t : -t;
      };
      const prev = g[(k + g.length - 1) % g.length], next = g[(k + 1) % g.length];
      N.onEdge(e, (len, f) => {
        // which neighbour sits at the left end (u = 0) of the frame?
        const leftIsA = Math.hypot(f.x - e.a[0], f.z - e.a[1]) < 0.01;
        const tA = tan(prev), tB = tan(next), tL = leftIsA ? tA : tB, tR = leftIsA ? tB : tA;
        const sp = R.dormers ?? 6, ds = sp && len > 5 ? K.bays(Math.max(1.5, tL * 3), len - Math.max(1.5, tR * 3), sp) : [];
        N.mansard(0, len, H(e), { mat: R.mat || N.seam(NC.roofGrey), inset: R.inset ?? 0.45, run: R.run ?? 1.3, rise: R.rise ?? 2.6, D: R.D ?? 5.5, tL, tR, dormers: ds.map((u) => ({ u, w: R.dw ?? 1.3, h: R.dh ?? 1.7, head: R.dhead, mat: R.dormerMat || wall, frame: cfg.frame })) });
      });
    }
  }
  info.streetEdges = streetEdges;
  if (cfg.after) cfg.after(info);
  if (cfg.title) svc.houses.push({ id: cfg.ids[0], name: cfg.title, nameEn: cfg.titleEn, x: cfg.at ? cfg.at[0] : recs[0].cx, z: cfg.at ? cfg.at[1] : recs[0].cz });
  return info;
}
