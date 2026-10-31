// landmarksFortress/buildings.js - every house of the fortress on its baked OSM footprint (dossier docs/research/fortress.md sections 2, 8; photos refs/fortress 037 069-077 079-094 173-175 208-225):
// the Boathouse (orange, white portico, the statue "Navigation"), the Mint (rusticated ochre front with the pediment «МОНЕТНЫЙ ДВОРЪ», two round towers, the brick chimney), the Commandant's House
// (white rusticated basement floor, pink-red upper floor, glass roof over the court), the Engineers' House, the Guardhouse (white Tuscan portico), the Zeughaus, the Trubetskoy Bastion prison with its
// bath house, the Anna cavalier, the officers' houses, the Treasury, the Church house, the Archive of the Alekseevsky ravelin, the Flagstaff tower (no mast: user rule) and the kiosks.
// house() is the generic builder: one textured quad per footprint edge (mats.js M.fac: a bay per u unit, v over the height), a mitred cornice, an inset hip roof (sloped ring + flat ridge cap, works for
// L / U shapes and courtyards), chimneys, thin wall colliders.
import * as THREE from 'three';
import { BUILDINGS, MANMADE } from '../data/city.js';
import { ON_ISLAND } from './osm-data.js';
import { ringEdges, onEdge, band } from './kit.js';
import { addPolyColliders } from '../lib/massing.js';
import * as G from './geo.js';
import { byId, pairs, offsetRing, ringArea, U, V, cathW } from './frame.js';
import { human, cached, figureMats } from '../lib/figures.js';

const W2 = { h: 4.3, win: 'rect', ww: 1.25, wh: 2.2, sill: 1.0 };
/** styles: H wall height, bay, colours, floors (mats.js M.fac), roof material key, rise, chimney colour */
const ST = {
  yellow2: { H: 9.2, bay: 3.3, wall: '#e9cb72', trim: '#f4eedc', socleH: 0.8, floors: [{ ...W2, h: 4.2 }, { ...W2, h: 4.2, hood: 'bar' }], cornice: 0.7, roof: 'roofRed' },
  yellow3: { H: 12.6, bay: 3.3, wall: '#ecd27a', trim: '#f6f0de', socleH: 0.8, floors: [{ ...W2, h: 3.9 }, { ...W2, h: 4.0, hood: 'bar' }, { ...W2, h: 3.9 }], cornice: 0.7, roof: 'roofGrey' },
  assembly: { H: 11.6, bay: 3.6, wall: '#b9c3d0', trim: '#eef0f2', socleH: 0.8, floors: [{ h: 5.2, win: 'arch', ww: 1.5, wh: 3.4, sill: 1.0 }, { h: 5.6, win: 'rect', ww: 1.4, wh: 3.0, sill: 1.0, hood: 'bar' }], cornice: 0.8, roof: 'roofGrey' },
  beige3: { H: 12.5, bay: 3.4, wall: '#d9c7a0', trim: '#f0e8d4', socleH: 0.9, floors: [{ ...W2, h: 3.9, rust: true }, { ...W2, h: 4.0, hood: 'bar' }, { ...W2, h: 3.8 }], cornice: 0.8, roof: 'roofGrey' },
  brick2: { H: 9.0, bay: 3.5, wall: '#b5553f', trim: '#f1ece0', socleH: 0.7, socle: '#8f8a84', floors: [{ ...W2, h: 4.1 }, { ...W2, h: 4.2 }], cornice: 0.8, roof: 'roofGrey' },
  church2: { H: 9.6, bay: 3.6, wall: '#e6cf7a', trim: '#f4eedc', socleH: 0.9, floors: [{ ...W2, h: 4.2, rust: true }, { h: 4.5, win: 'arch', ww: 1.4, wh: 2.8, sill: 0.9 }], cornice: 0.8, roof: 'roofBlue' },
  treasury3: { H: 12.4, bay: 3.4, wall: '#ead47e', trim: '#f6f1e2', socleH: 0.9, floors: [{ ...W2, h: 3.9, rust: true }, { ...W2, h: 4.0 }, { ...W2, h: 3.7 }], cornice: 0.8, roof: 'roofGrey' },
  treasury1: { H: 5.0, bay: 3.4, wall: '#ead47e', trim: '#f6f1e2', socleH: 0.7, floors: [{ ...W2, h: 4.3 }], cornice: 0.6, roof: 'roofGrey' },
  treasury2: { H: 8.8, bay: 3.4, wall: '#ead47e', trim: '#f6f1e2', socleH: 0.8, floors: [{ ...W2, h: 4.0, rust: true }, { ...W2, h: 4.0 }], cornice: 0.7, roof: 'roofGrey' },
  peach2: { H: 8.8, bay: 3.4, wall: '#e8b592', trim: '#f6efe2', socleH: 0.7, floors: [{ ...W2, h: 4.0 }, { h: 4.1, win: 'arch', ww: 1.3, wh: 2.5, sill: 0.9 }], cornice: 0.7, roof: 'roofRed' },
  ochre2: { H: 9.4, bay: 3.4, wall: '#e2b866', trim: '#f4ecd6', socleH: 0.8, floors: [{ ...W2, h: 4.2 }, { ...W2, h: 4.4, hood: 'bar' }], cornice: 0.8, roof: 'roofGrey' },
  engineers: { H: 5.2, bay: 3.6, wall: '#e3a98c', trim: '#f5efe4', socleH: 0.6, floors: [{ h: 4.6, win: 'rect', ww: 1.2, wh: 2.2, sill: 1.1 }], cornice: 0.55, lesene: 0.5, roof: 'roofRed' },
  zeughaus: { H: 5.6, bay: 4.5, wall: '#9a9c9e', trim: '#f0eee8', socleH: 0.5, floors: [{ h: 5.1, win: 'arch', ww: 1.7, wh: 3.0, sill: 0.9 }], cornice: 0.5, roof: 'roofRed' },
  karetnik: { H: 4.8, bay: 3.8, wall: '#ecc993', trim: '#f6f0e2', socleH: 0.5, floors: [{ h: 4.3, win: 'arch', ww: 1.6, wh: 2.7, sill: 0.7 }], cornice: 0.5, roof: 'roofGreen' },
  guard: { H: 8.6, bay: 3.2, wall: '#e3a441', trim: '#f6f2e6', socleH: 0.7, floors: [{ ...W2, h: 4.0, win: 'rect' }, { ...W2, h: 3.9 }], cornice: 0.7, roof: 'roofGreen', chimney: '#e3a441' },
  commandant: { H: 8.2, bay: 3.5, wall: '#c8604e', trim: '#f4f0e6', socleH: 0.5, floors: [{ h: 3.3, win: 'arch', ww: 1.3, wh: 1.9, sill: 0.8, rust: true, rustCol: '#efebe0' }, { h: 4.4, win: 'rect', ww: 1.3, wh: 2.6, sill: 0.8, hood: 'ped' }], cornice: 0.6, roof: 'roofGrey' },
  prison: { H: 8.4, bay: 3.2, wall: '#e0b24e', trim: '#f2ead2', socleH: 0.6, floors: [{ h: 3.9, win: 'rect', ww: 1.0, wh: 1.5, sill: 1.6 }, { h: 3.9, win: 'rect', ww: 1.0, wh: 1.5, sill: 1.6 }], cornice: 0.6, roof: 'roofRed', chimney: '#e0b24e' },
  bath: { H: 4.2, bay: 3.2, wall: '#e0b24e', trim: '#f2ead2', socleH: 0.5, floors: [{ h: 3.7, win: 'arch', ww: 1.0, wh: 1.8, sill: 1.1 }], cornice: 0.5, roof: 'roofRed' },
  cavalier: { H: 7.8, bay: 4.6, wall: '#b5503c', trim: '#efe9dc', socleH: 1.0, socle: '#cfc6b4', floors: [{ h: 6.2, win: 'arch', ww: 1.6, wh: 3.4, sill: 1.2 }], cornice: 0.6, roof: 'roofGrey' },
  mint2: { H: 10.2, bay: 3.6, wall: '#d8a95c', trim: '#f3eee0', socleH: 0.8, floors: [{ h: 4.6, win: 'arch', ww: 1.6, wh: 3.0, sill: 0.8, rust: true }, { h: 4.8, win: 'rect', ww: 1.3, wh: 2.4, sill: 1.0, hood: 'bar' }], cornice: 0.8, roof: 'roofRed' },
  mintBack: { H: 10.0, bay: 3.6, wall: '#e6c56c', trim: '#f3eee0', socleH: 0.8, floors: [{ ...W2, h: 4.5 }, { ...W2, h: 4.7 }], cornice: 0.7, roof: 'roofRed' },
  mintLow: { H: 5.6, bay: 3.6, wall: '#e6c56c', trim: '#f3eee0', socleH: 0.6, floors: [{ ...W2, h: 5.0, wh: 2.6 }], cornice: 0.6, roof: 'roofRed' },
  service: { H: 3.6, bay: 3.2, wall: '#d9d2c2', trim: '#f2efe6', socleH: 0.4, floors: [{ h: 3.2, win: 'rect', ww: 1.0, wh: 1.3, sill: 1.1 }], cornice: 0.4, roof: 'roofGrey', rise: 0.9 },
  kiosk: { H: 2.7, bay: 2.2, wall: '#f0ece0', trim: '#5f7a66', socleH: 0.3, floors: [{ h: 2.4, win: 'rect', ww: 1.3, wh: 1.2, sill: 0.9 }], cornice: 0.3, roof: 'roofGreen', rise: 0.8, solid: false },
};
const STYLE_OF = {
  r3257879: 'yellow3', r3257880: 'assembly', r2594686: 'church2', w30325187: 'brick2', w30325189: 'beige3', w30325186: 'yellow2', r3243798: 'treasury3', r3243799: 'treasury1', r3243800: 'treasury2', r3243801: 'treasury1',
  r227971: 'engineers', w30325184: 'zeughaus', w30325201: 'karetnik', r2594691: 'peach2', w30325209: 'yellow2', r2594688: 'treasury1', w23553390: 'ochre2', r2594683: 'ochre2', w30325178: 'ochre2',
  r14293062: 'prison', w138742658: 'bath', r14293056: 'cavalier', r14293060: 'mintLow', r14293061: 'mintLow', r3257957: 'mintBack', r3257958: 'mintBack', r3257961: 'mintBack', r3257962: 'mintBack', r3257963: 'mint2', r3257965: 'mintLow', r3257966: 'mintLow',
  w30325199: 'guard', r3257909: 'commandant',
};
const SKIP = new Set(['r227969', 'r2594679', 'r2594690', 'r16219162', 'r16219164', 'r2594681', 'r2594692', 'r8857004', 'w422056236', 'r2071372', 'r3257878', 'r3243797', 'r227970', 'r3257960', 'r3287692', 'r3257908']);
const KIOSK = new Set(['w1207291741', 'w1229983951', 'w530434779', 'w530434780', 'w530434782', 'w530434799', 'w530434805', 'w661249715', 'w530434771']);

/** drop vertices closer than tol to the previous one and nearly collinear ones */
function simplify(r, tol = 0.5) {
  let o = r.filter((p, i) => i === 0 || Math.hypot(p[0] - r[i - 1][0], p[1] - r[i - 1][1]) > tol);
  if (o.length > 3 && Math.hypot(o[0][0] - o[o.length - 1][0], o[0][1] - o[o.length - 1][1]) < tol) o.pop();
  for (let pass = 0; pass < 2; pass++) o = o.filter((p, i) => { const a = o[(i + o.length - 1) % o.length], b = o[(i + 1) % o.length], cr = (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]), l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return Math.abs(cr) / l > 0.12 || o.length <= 4; });
  return o;
}

export function build(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics;
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksFortress] buildings/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const facOf = new Map();
  const matOf = (key) => { let m = facOf.get(key); if (!m) { const s = ST[key]; m = M.fac({ key, H: s.H, bay: s.bay, wall: s.wall, trim: s.trim, socle: s.socle, socleH: s.socleH, floors: s.floors, cornice: s.cornice, lesene: s.lesene }); facOf.set(key, m); } return m; };
  /** inset hip roof over a polygon: eaves at yE (overhang `over`), ridge ring d inside, rise; holes = courtyards (the roof falls to them too) */
  const roof = (mat, o, holes, yE, d, rise, over = 0.4) => {
    const ring = simplify(o), hs = holes.map((h) => simplify(h));
    const eav = offsetRing(ring, over), rid = offsetRing(ring, -d), heav = hs.map((h) => offsetRing(h, -over)), hrid = hs.map((h) => offsetRing(h, d));
    const slope = (A, B, n) => { for (let i = 0; i < A.length; i++) { const j = (i + 1) % A.length, a = A[i], b = A[j], c = B[j], e = B[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.02) continue; P.quad(mat, [a[0], yE, a[1]], [b[0], yE, b[1]], [c[0], yE + rise, c[1]], [e[0], yE + rise, e[1]], [n * (b[1] - a[1]) / l * 0.4, 0.9, -n * (b[0] - a[0]) / l * 0.4], [[0, 0], [l / 2.4, 0], [l / 2.4, (d + over) / 2.4], [0, (d + over) / 2.4]]); } };
    const sg = ringArea(ring) > 0 ? 1 : -1;
    slope(eav, rid, sg); hs.forEach((h, k) => slope(heav[k], hrid[k], ringArea(h) > 0 ? 1 : -1));
    // the flat ridge cap; a courtyard ridge ring that leaves the outer one (narrow wings) would turn the cap inside out: then only the outer cap is drawn where no hole exists
    const okHoles = hrid.every((h) => h.every((q) => inPoly(rid, q[0], q[1])));
    try { if (okHoles) P.cap(mat, rid, yE + rise, true, 2.4, hrid); } catch (e) { /* a degenerate ridge ring: the sloped ring alone closes the roof well enough */ }
    return rid;
  };
  /** the generic house: rec (a baked building or part), style key or object; returns { H, ring } */
  const house = (rec, key, o = {}) => {
    const s = typeof key === 'string' ? ST[key] : key, mat = o.mat || matOf(typeof key === 'string' ? key : key.key), H = o.H || s.H, plain = M.col(s.wall), trim = M.col(s.trim);
    for (const poly of rec.polys) {
      const edges = ringEdges(poly, 0.15);
      for (const e of edges) onEdge(P, e, (len) => {
        if (len < s.bay * 0.55) { P.quad(plain, [0, 0, 0], [len, 0, 0], [len, H, 0], [0, H, 0], [0, 0, 1]); return; }
        const nb = Math.max(1, Math.round(len / s.bay));
        P.quad(mat, [0, 0, 0], [len, 0, 0], [len, H, 0], [0, H, 0], [0, 0, 1], [[0, 0], [nb, 0], [nb, 1], [0, 1]]);
      });
      band(P, edges.filter((e) => !e.hole), H - 0.25, H + 0.12, 0.38, { front: trim, top: trim, under: M.underside });
      const ring = pairs(poly.o), holes = poly.h.map(pairs), area = Math.abs(ringArea(ring)) - holes.reduce((a, h) => a + Math.abs(ringArea(h)), 0);
      let per = 0; for (const e of edges) per += e.len;
      const wdt = 2 * area / Math.max(1, per), d = Math.min(o.roofD || 4.6, Math.max(0.6, wdt * (holes.length ? 0.47 : 0.44))), rise = o.rise ?? s.rise ?? Math.max(0.8, d * 0.55);
      if (!o.noRoof) {
        const rid = roof(M[o.roof || s.roof] || M.roofGrey, ring, holes, H + 0.12, d, rise);
        if (s.roof !== 'roofGreen' || s.chimney) { const cm = M.col(s.chimney || '#b44a3c', 'chim-' + (s.chimney || 'red').replace('#', '')); let acc = 0; for (let i = 0; i < rid.length; i++) { const a = rid[i], b = rid[(i + 1) % rid.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); acc += l; if (acc > 11 && l > 2 && H > 4.5) { acc = 0; const x = (a[0] + b[0]) / 2, z = (a[1] + b[1]) / 2; P.box(cm, x - 0.4, x + 0.4, H + rise - 0.2, H + rise + 1.4, z - 0.4, z + 0.4, 'b', 1); P.box(M.white, x - 0.5, x + 0.5, H + rise + 1.4, H + rise + 1.55, z - 0.5, z + 0.5, '', 1); } } }
      }
      if (s.solid !== false || true) addPolyColliders(ctx, poly, 0, H + 2, 0.8);
    }
    return { H };
  };
  const partsOf = (id) => BUILDINGS.filter((b) => b.parent === id && b.part);

  // ================================================================== generic houses
  stage('houses', () => {
    let n = 0;
    for (const id of ON_ISLAND.buildings) {
      if (SKIP.has(id)) continue;
      const rec = byId(id); if (!rec) continue;
      house(rec, STYLE_OF[id] || (KIOSK.has(id) || rec.area < 30 ? 'kiosk' : 'service')); n++;
    }
    for (const pid of ['r3257878', 'r3243797', 'w138742658']) for (const pr of partsOf(pid)) { if (STYLE_OF[pr.id]) { house(pr, STYLE_OF[pr.id]); n++; } }
    svc.houses = n;
  });

  // ================================================================== the Mint: back ranges, the front range with its pediment, the two round towers, the chimney
  stage('mint', () => {
    for (const pr of partsOf('r2071372')) { if (pr.roof === 'dome' || !STYLE_OF[pr.id]) continue; house(pr, STYLE_OF[pr.id]); }
    const oc = M.col('#d8a95c', 'mint'), tr = M.col('#f3eee0', 'mintTrim');
    for (const tid of ['r3257960', 'r3287692']) {
      const t = byId(tid); if (!t) continue; const R = Math.sqrt(t.area / Math.PI), x = t.cx, z = t.cz, H = 11.6;
      G.tube(P, matOf('mint2'), x, z, 0, H, R, R, 28, 12, 1); G.tube(P, tr, x, z, H, H + 0.5, R + 0.4, R + 0.4, 28, 1, 1, { capTop: tr });
      for (let k = 0; k < 6; k++) { const a0 = k / 6 * Math.PI / 2, a1 = (k + 1) / 6 * Math.PI / 2; P.col(M.roofRed, x, z, H + 0.5 + Math.sin(a0) * 3.4, H + 0.5 + Math.sin(a1) * 3.4, (R + 0.2) * Math.cos(a0), (R + 0.2) * Math.cos(a1), 28, false); }
      ph.addCylinder(x, z, R, 0, 16);
    }
    // central pavilion on the front range (towards the Cathedral square): a risalit with four pilasters, the frieze with the name and the pediment
    const fr = byId('r3257963');
    if (fr) {
      const c = [fr.cx, fr.cz], n = [U[0], U[1]];
      // the face of the range that looks at the cathedral: move from the centre along +U until outside the footprint
      let dist = 4; for (; dist < 30; dist += 0.25) { const x = c[0] + n[0] * dist, z = c[1] + n[1] * dist; if (!fr.polys.some((p) => inPoly(pairs(p.o), x, z))) break; }
      P.push(c[0] + n[0] * (dist - 0.2), 0, c[1] + n[1] * (dist - 0.2), Math.atan2(n[0], n[1]));
      const hw = 11.5, H = 13.6;
      P.box(oc, -hw, hw, 0, H, -2.0, 1.4, 'b', 3);
      for (const x of [-10.6, -5.4, 5.4, 10.6]) P.box(tr, x - 0.55, x + 0.55, 4.9, H - 2.0, 1.4, 1.62, 'bk', 1);
      for (let y = 0.9; y < 4.6; y += 0.5) P.box(M.col('#b98e48', 'mintRust'), -hw, hw, y, y + 0.05, 1.4, 1.42, 'bk', 1);
      for (const x of [-8, -2.7, 2.7, 8]) { G.solid(P, M.dark, G.archPts(x, 0.6, 1.9, 3.4, 8), 1.4, 0.03, 1); for (const y of [6.0, 9.2]) { P.box(M.glass, x - 0.7, x + 0.7, y, y + 2.2, 1.4, 1.44, 'bk', 1); P.box(tr, x - 0.9, x + 0.9, y + 2.2, y + 2.4, 1.4, 1.55, 'bk', 1); } }
      P.box(M.door, -1.3, 1.3, 0, 3.4, 1.4, 1.46, 'bk', 1);
      P.box(tr, -hw, hw, 4.6, 4.9, 1.4, 1.6, 'bk', 1); P.box(tr, -hw - 0.2, hw + 0.2, H - 2.0, H - 0.6, 1.2, 1.75, 'bk', 1); P.box(tr, -hw - 0.5, hw + 0.5, H - 0.6, H, -2.2, 2.1, 'b', 1);
      const sm = ctx.mat.toon('#ffffff', { map: M.tex(1024, 96, 'mint-sign', (g, w, h) => { g.fillStyle = '#f3eee0'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a3630'; g.font = `bold ${Math.round(h * 0.7)}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('МОНЕТНЫЙ ДВОРЪ', w / 2, h * 0.55, w * 0.94); }), name: 'lmFort-mintSign', polygonOffset: -2 });
      P.quad(sm, [-7.5, H - 1.95, 1.77], [7.5, H - 1.95, 1.77], [7.5, H - 0.65, 1.77], [-7.5, H - 0.65, 1.77], [0, 0, 1]);
      G.solid(P, tr, [[-hw - 0.5, H], [hw + 0.5, H], [0, H + 3.4]], -2.2, 4.3, 2); G.solid(P, oc, [[-hw + 1.6, H + 0.4], [hw - 1.6, H + 0.4], [0, H + 2.7]], 2.1, 0.04, 1);
      P.fan(M.roofRed, [[-hw - 0.8, H - 0.02, 2.3], [0, H + 3.52, 2.3], [0, H + 3.52, -8], [-hw - 0.8, H - 0.02, -8]], [-0.3, 0.95, 0]); P.fan(M.roofRed, [[hw + 0.8, H - 0.02, -8], [0, H + 3.52, -8], [0, H + 3.52, 2.3], [hw + 0.8, H - 0.02, 2.3]], [0.3, 0.95, 0]);     // 10 cm above the pediment block
      P.pop();
      svc.monuments.push({ id: 'r2071372', name: 'Монетный двор', x: c[0], z: c[1], h: 17 });
    }
    const ch = MANMADE.find((m) => m.id === 'n9846071349');
    if (ch) { P.col(M.col('#a04a38', 'mintChimney'), ch.x, ch.z, 0, 38, 1.7, 1.0, 14, true); P.col(M.col('#8a3f30', 'mintChimney2'), ch.x, ch.z, 0, 4, 2.2, 1.8, 14, false); ph.addCylinder(ch.x, ch.z, 2.2, 0, 40); }
  });

  // ================================================================== the Commandant's House: the quadrangle + the glass roof over its court
  stage('commandant', () => {
    const rec = byId('r3257909') || byId('r227970'); if (!rec) return;
    house(rec, 'commandant', { roofD: 4.2 });
    const poly = rec.polys[0];
    if (poly.h.length) { const h = pairs(poly.h[0]), gm = ctx.mat.toon('#ffffff', { map: M.tex(256, 256, 'atrium', (g, w, hh) => { g.fillStyle = '#b9cfdd'; g.fillRect(0, 0, w, hh); g.strokeStyle = '#f4f4f0'; g.lineWidth = 8; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, hh); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } }), name: 'lmFort-atrium' }); P.cap(gm, offsetRing(h, 4.4), 10.95, true, 4); }
    svc.monuments.push({ id: 'r227970', name: 'Комендантский дом', x: rec.cx, z: rec.cz, h: 11 });
  });

  // ================================================================== the Guardhouse portico (four white Tuscan columns, pediment) on the side of the main alley
  stage('guardhouse', () => {
    const rec = byId('w30325199'); if (!rec) return;
    const edges = ringEdges(rec.polys[0], 0.3); let best = null;
    for (const e of edges) { const d = -(e.n[0] * V[0] + e.n[1] * V[1]); if (e.len > 8 && (!best || d > best.d)) best = { e, d }; }
    if (!best) return;
    onEdge(P, best.e, (len) => {
      const cx = len / 2, wm = M.white, H = 8.6;
      for (let k = 0; k < 3; k++) P.box(M.stoneGrey, cx - 5.2 - (2 - k) * 0.3, cx + 5.2 + (2 - k) * 0.3, 0, 0.16 * (k + 1), 0, 2.6 + (2 - k) * 0.3, 'b', 1);
      for (const x of [-4.2, -1.5, 1.5, 4.2]) { P.box(wm, cx + x - 0.5, cx + x + 0.5, 0.48, 0.8, 1.6, 2.6, 'b', 1); P.col(wm, cx + x, 2.1, 0.8, H - 1.9, 0.42, 0.36, 12, false); P.box(wm, cx + x - 0.52, cx + x + 0.52, H - 1.9, H - 1.6, 1.58, 2.62, 'b', 1); }
      P.box(wm, cx - 5.0, cx + 5.0, H - 1.6, H - 0.4, 0, 2.7, 'b', 1); P.box(M.whiteShade, cx - 5.3, cx + 5.3, H - 0.4, H, 0, 3.0, '', 1);
      G.solid(P, wm, [[cx - 5.3, H], [cx + 5.3, H], [cx, H + 2.3]], 0, 3.0, 2); G.solid(P, M.col('#e3a441', 'guardTymp'), [[cx - 3.9, H + 0.3], [cx + 3.9, H + 0.3], [cx, H + 1.8]], 3.0, 0.04, 1);
      G.solid(P, M.door, G.archPts(cx, 0.48, 1.9, 3.2, 8), 0.02, 0.05, 1);
    });
    svc.monuments.push({ id: 'w30325199', name: 'Обер-офицерская гауптвахта', x: rec.cx, z: rec.cz, h: 11 });
  });

  // ================================================================== the Boathouse
  stage('boathouse', () => {
    const rec = byId('r8857004'); if (!rec) return;
    const st = { key: 'boat', H: 6.3, bay: 3.4, wall: '#e09a45', trim: '#f6f2e8', socleH: 0.7, socle: '#a9a39a', floors: [{ h: 5.6, win: 'arch', ww: 1.5, wh: 3.4, sill: 0.9 }], cornice: 0.6, lesene: 0.6, roof: 'roofBlue' };
    const mat = M.fac({ ...st });
    house(rec, st, { mat, noRoof: true });
    // the broken ("Dutch") hip roof: a steep lower part and a shallow upper part, the statue on a pedestal on top
    const ring = simplify(pairs(rec.polys[0].o), 0.8), H = 6.42, e0 = offsetRing(ring, 0.45), e1 = offsetRing(ring, -2.6), c = [rec.cx, rec.cz];
    for (let i = 0; i < ring.length; i++) { const j = (i + 1) % ring.length, a = e0[i], b = e0[j], q = e1[j], p = e1[i]; P.quad(M.roofBlue, [a[0], H, a[1]], [b[0], H, b[1]], [q[0], H + 2.9, q[1]], [p[0], H + 2.9, p[1]], [0, 1, 0], [[0, 0], [2, 0], [2, 1.4], [0, 1.4]]); P.fan(M.roofBlue, [[p[0], H + 2.9, p[1]], [q[0], H + 2.9, q[1]], [c[0], H + 4.3, c[1]]], [0, 1, 0]); }
    P.box(M.stoneGrey, c[0] - 0.55, c[0] + 0.55, H + 4.0, H + 5.2, c[1] - 0.55, c[1] + 0.55, 'b', 1); P.box(M.stoneGreyShade, c[0] - 0.7, c[0] + 0.7, H + 5.2, H + 5.4, c[1] - 0.7, c[1] + 0.7, '', 1);
    const mk = figureMats(ctx).keys('marble', 'marble');
    const fig = cached('lmFort-navigation', () => human({ detail: 0.4, body: { sex: 'f' }, pose: { spine: [0.02, 0.1, 0], arms: { R: { hand: [-0.3, 1.25, 0.12], grip: 'hold' }, L: { hand: [0.26, 0.95, 0.1], grip: 'relaxed' } } }, outfit: { torso: 'robe', hem: 0.95, flare: 0.35, folds: 0.07, sleeves: 'none', cape: 'none' }, face: { age: 0.2, hair: 'curly', seed: 5 } }));
    const rot = Math.atan2(-U[0], -U[1]);
    fig.place(P, mk, c[0], H + 5.4, c[1], rot, 1.35);
    P.col(M.white, c[0] - U[0] * 0.25 + V[0] * 0.42, c[1] - U[1] * 0.25 + V[1] * 0.42, H + 5.4, H + 8.4, 0.035, 0.035, 5, true);                           // the oar
    P.box(M.white, c[0] - U[0] * 0.25 + V[0] * 0.42 - 0.1, c[0] - U[0] * 0.25 + V[0] * 0.42 + 0.1, H + 7.7, H + 8.5, c[1] - U[1] * 0.25 + V[1] * 0.42 - 0.03, c[1] - U[1] * 0.25 + V[1] * 0.42 + 0.03, '', 1);
    // the portico on the west side (towards the square): four white columns, pediment
    const edges = ringEdges(rec.polys[0], 0.3); let best = null;
    for (const e of edges) { const d = -(e.n[0] * U[0] + e.n[1] * U[1]); if (e.len > 5 && (!best || d > best.d)) best = { e, d }; }
    if (best) onEdge(P, best.e, (len) => {
      const cx = len / 2, wm = M.white;
      for (let k = 0; k < 3; k++) P.box(M.stoneGrey, cx - 4.6 - (2 - k) * 0.3, cx + 4.6 + (2 - k) * 0.3, 0, 0.15 * (k + 1), 0, 3.1 + (2 - k) * 0.3, 'b', 1);
      for (const x of [-3.8, -1.35, 1.35, 3.8]) { P.box(wm, cx + x - 0.46, cx + x + 0.46, 0.45, 0.7, 2.1, 3.02, 'b', 1); P.col(wm, cx + x, 2.56, 0.7, 5.0, 0.38, 0.32, 12, false); P.box(wm, cx + x - 0.46, cx + x + 0.46, 5.0, 5.25, 2.1, 3.02, 'b', 1); }
      P.box(wm, cx - 4.4, cx + 4.4, 5.25, 6.1, 0, 3.1, 'b', 1); P.box(M.whiteShade, cx - 4.7, cx + 4.7, 6.1, 6.4, 0, 3.4, '', 1);
      G.solid(P, wm, [[cx - 4.7, 6.4], [cx + 4.7, 6.4], [cx, 8.3]], 0, 3.4, 2); G.solid(P, M.col('#e09a45', 'boatTymp'), [[cx - 3.5, 6.65], [cx + 3.5, 6.65], [cx, 7.9]], 3.4, 0.04, 1);
      G.solid(P, M.door, G.archPts(cx, 0.45, 1.8, 3.6, 8), 0.02, 0.05, 1);
    });
    svc.monuments.push({ id: 'r8857004', name: 'Ботный дом', x: rec.cx, z: rec.cz, h: 15 });
    svc.crowd.push({ x: rec.cx - U[0] * 14, z: rec.cz - U[1] * 14, r: 6, n: 10, kind: 'photo' });
  });

  // ================================================================== the Flagstaff tower on the Naryshkin bastion (the mast with its yard and jack is NOT drawn: no flags, no flagpoles)
  stage('flagtower', () => {
    const rec = byId('w422056236'); if (!rec) return;
    const x = rec.cx, z = rec.cz, y0 = 10.2, wm = M.white, a0 = Math.PI / 8;
    P.col(M.graniteFlat, x, z, 9.0, y0, 5.6, 5.6, 20, true);                                             // the round platform on the roof
    G.frustum(P, wm, x, z, y0, y0 + 1.0, 8, 3.5, 3.5, a0, 1, 1); P.cap(wm, G.ngon(8, 3.5, a0, x, z), y0 + 1.0, true, 2);
    for (let i = 0; i < 8; i++) {
      const t = a0 + i * Math.PI / 4, tm = t + Math.PI / 8;
      P.col(wm, x + Math.sin(t) * 3.0, z + Math.cos(t) * 3.0, y0 + 1.0, y0 + 4.9, 0.26, 0.22, 8, false);
      P.push(x + Math.sin(tm) * 2.55, 0, z + Math.cos(tm) * 2.55, tm); G.solid(P, M.glass, G.archPts(0, y0 + 1.1, 1.5, 3.2, 8), 0, 0.03, 1); G.frameRing(P, wm, G.archPts(0, y0 + 1.0, 1.9, 3.5, 8), G.archPts(0, y0 + 1.1, 1.5, 3.2, 8), 0, 0.1, 1); P.pop();
    }
    G.frustum(P, M.col('#e8e6e0', 'flagBody'), x, z, y0 + 1.0, y0 + 4.9, 8, 2.76, 2.76, a0, 1, 1);
    G.frustum(P, wm, x, z, y0 + 4.9, y0 + 5.5, 8, 3.6, 3.6, a0, 1, 1); P.cap(wm, G.ngon(8, 3.6, a0, x, z), y0 + 5.5, true, 2);
    const prof = [[1.0, 0], [0.98, 0.1], [0.86, 0.3], [0.62, 0.5], [0.42, 0.66], [0.32, 0.8], [0.3, 1.0]];
    for (let k = 0; k + 1 < prof.length; k++) G.frustum(P, M.roofHall, x, z, y0 + 5.5 + prof[k][1] * 3.4, y0 + 5.5 + prof[k + 1][1] * 3.4, 8, 3.5 * prof[k][0], 3.5 * prof[k + 1][0], a0, 2, 1);
    G.frustum(P, wm, x, z, y0 + 8.9, y0 + 10.3, 8, 1.0, 1.0, a0, 1, 1); G.frustum(P, M.roofHall, x, z, y0 + 10.3, y0 + 11.2, 8, 1.15, 0.2, a0, 1, 1); G.ball(P, M.goldFlat, x, y0 + 11.4, z, 0.22, 8);
    svc.monuments.push({ id: 'w422056236', name: 'Флажная башня Нарышкина бастиона', x, z, h: 22 });
  });
  void THREE; void cathW; void MANMADE;
  if (errs.length) throw new Error(errs.join('\n'));
}
function inPoly(r, x, z) { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; }
