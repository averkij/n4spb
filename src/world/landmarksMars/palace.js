// landmarksMars/palace.js - the Marble Palace (Мраморный дворец, A. Rinaldi 1768-85; OSM r969622, 4 levels, ~22 m) with the forecourt fence and the Alexander III monument ("Комод", P. Troubetzkoy 1909).
// The footprint is the OSM ring; every outer edge of 10 m and more gets the same elevation: a rough grey-pink granite ground floor with two bands of small framed windows (#8c6f68), above it the two
// floors united by a Corinthian order of PINK marble pilasters (#c8a8a4, white capitals) between bluish-grey marble panels (#a0a4a6) with a window per bay and a stucco garland plaque under the upper
// window, a dark cornice, an attic balustrade of pale pink stone with urns every ~5 m, a raised central attic with a gilded cartouche and a gilded balustrade on the central balcony (docs/research/
// mars-field.md 6.1, photo marble_10).  Fence of the forecourt: black iron spears with gold ferrules between rough granite piers with urns every ~4 m (6.2, photo mpfence_03).  No flags.
import * as THREE from 'three';
import * as L from '../layout.js';
import { buildHouse } from './house.js';
import { ringFromFlat } from '../lib/massing.js';
import { lathe } from './geo.js';
import { human, horse, extend, cached, figureMats, V } from '../lib/figures.js';
import { Parts } from './kit.js';
import { knockBays } from '../lib/fence-bays.js';

const G = 7.6, HC = 20.2;
const URN = [[0, 0], [0.3, 0], [0.32, 0.06], [0.2, 0.16], [0.3, 0.42], [0.34, 0.62], [0.24, 0.84], [0.3, 0.92], [0.18, 1.0], [0.08, 1.1], [0, 1.16]];
const urn = (P, mat, x, y, z, s = 1) => lathe(P, mat, 'lmM-urn', URN, x, y, z, s, s, 14, 12);

function marbleFront(K, mats) {
  const { rust, panel, pink, trim, gold, pale, dark } = mats, P = K.P;
  return (e, c) => {
    if (e.hole || e.len < 10) return false;
    const len = c.len, main = len > 60, bays = Math.max(3, Math.round((len - 2.4) / 4.1)), p = (len - 2.4) / bays;
    const xs = Array.from({ length: bays }, (_, i) => 1.2 + p * (i + 0.5));
    K.wallQuad(rust, 0, len, 0.9, G, 3);
    K.wallQuad(panel, 0, len, G, HC + 0.45, 3);
    for (const x of xs) {
      K.window({ x, y: 1.5, w: 1.3, h: 2.9, sw: 0.18, d: 0.14, frame: 'white', surMat: pale, sill: false });
      K.window({ x, y: 5.0, w: 1.1, h: 1.5, sw: 0.14, d: 0.1, frame: 'white', surMat: pale, sill: false });
      K.window({ x, y: G + 1.5, w: 1.45, h: 4.2, sw: 0.22, d: 0.16, frame: 'white', surMat: trim, hood: bays > 6 && ((x * 3) | 0) % 2 ? 'seg' : 'tri', hoodH: 0.5 });
      K.window({ x, y: G + 7.0, w: 1.35, h: 3.5, sw: 0.2, d: 0.14, frame: 'white', surMat: trim, sill: false });
      K.plaque(trim, x, G + 6.2, 1.3, 0.4, 0.09);                                           // garland plaque under the upper window
    }
    // order: pink pilaster shafts at the bay boundaries, white bases and capitals; entablature
    for (let i = 0; i <= bays; i++) {
      const x = 1.2 + p * i;
      P.box(pink, x - 0.4, x + 0.4, G + 0.5, HC - 0.9, 0, 0.24, 'kb');
      P.box(trim, x - 0.5, x + 0.5, G + 0.2, G + 0.5, 0, 0.3, 'kb');
      P.box(trim, x - 0.5, x + 0.5, HC - 0.9, HC - 0.4, 0, 0.3, 'kb');
      P.box(trim, x - 0.55, x + 0.55, HC - 0.4, HC - 0.2, 0, 0.34, 'kb');
    }
    P.box(trim, 0, len, G - 0.2, G + 0.2, 0, 0.42, 'b');                                      // the string course between the granite and the order
    // attic balustrade of pale pink stone with urns on the piers; a raised central attic with a gilded cartouche on the long fronts
    const top = HC + 0.45;
    K.balustrade(0.3, len - 0.3, top, 0.95, 0.5, pale);
    const nu = Math.max(2, Math.round(len / 5));
    for (let i = 0; i <= nu; i++) { const x = 0.5 + (len - 1.0) * i / nu; P.box(pale, x - 0.4, x + 0.4, top, top + 0.95, 0.05, 0.55, 'b'); urn(P, K.mats.graniteWarm, x, top + 0.95, 0.3, 1.0); }
    if (main) {
      const cx = len / 2;
      P.box(pale, cx - 6, cx + 6, top, top + 2.6, 0, 0.9, 'b');
      P.box(trim, cx - 6.4, cx + 6.4, top + 2.6, top + 3.0, 0, 1.0, 'b');
      P.box(gold, cx - 1.6, cx + 1.6, top + 0.7, top + 2.2, 0.9, 1.0, 'kb');                    // the crowned monogram cartouche (gilt)
      P.box(gold, cx - 0.9, cx + 0.9, top + 2.2, top + 2.7, 0.9, 1.0, 'kb');
      K.balustrade(cx - 7, cx + 7, G + 0.35, 1.0, 0.9, gold);                                  // the gilded balcony balustrade over the central bays
      for (const dx of [-6.4, -2.1, 2.1, 6.4]) P.box(gold, cx + dx - 0.25, cx + dx + 0.25, G + 0.1, G + 1.35, 0.7, 0.9, 'kb');
    }
    void dark;
    return true;
  };
}

export function palace(K) {
  const P = K.P, ph = K.ctx.physics;
  const rec = L.buildingById('r969622'); if (!rec) throw new Error('Marble Palace record r969622 missing');
  const T = (hex, name, o = {}) => K.mat(hex, { name: 'lmM-' + name, paint: 0.04, ...o });
  const mats = { rust: K.rust('#9a8278'), panel: T('#a0a4a6', 'mp-panel'), pink: T('#c8a8a4', 'mp-pink'), trim: T('#f0ece2', 'mp-trim'), gold: T('#d4a838', 'mp-gold', { emissive: '#6a4a08', emissiveIntensity: 0.4 }), pale: T('#e6cfc8', 'mp-pale'), dark: T('#50484a', 'mp-dark') };
  const front = marbleFront(K, mats);
  buildHouse(K, { name: 'marblePalace', recs: [rec], hc: HC, wall: '#a0a4a6', court: '#c9b8ae', plinth: 0.9, plinthMat: K.rust('#7e6560'), floors: [7.6, 6.0, 5.4], courtPitch: 4.1, corniceMat: mats.dark, roof: 'none', railing: false, front, partyOpts: { tol: 0.7 }, collideH: 24 });
  const poly = rec.polys[0];
  P.cap(T('#6a746e', 'mp-roof'), ringFromFlat(poly.o), HC + 0.5, true, 4, poly.h.map(ringFromFlat));
  K.svc.houses.push({ id: 'r969622', name: 'Мраморный дворец', x: -1376.5, z: -1417.1 });
  K.svc.monuments.push({ id: 'r969622', name: 'Мраморный дворец', x: -1376.5, z: -1417.1, h: 23 });
  void ph;
}

// ================================================================================================ forecourt fence
export function forecourtFence(K) {
  const P = K.P, ph = K.ctx.physics, M = K.M;
  const iron = M.iron, gold = M.gold, pier = M.pierMat || K.mat('#8b7f78', { name: 'lmM-mp-pier', paint: 0.06 }), urnMat = K.mat('#6a6c68', { name: 'lmM-mp-urn', paint: 0.04 });
  // The southern run opens onto the mapped carriage entrance to the court.
  const runs = [[[-1350.7, -1473.9], [-1330.7, -1482.8], [-1317, -1489.2]], [[-1322, -1401.9], [-1307.2, -1408.7]], [[-1300.2, -1411.9], [-1288.2, -1417.4]]];
  // WATER IS REACHABLE (docs/AREAS.md 13.7): the forecourt fence breaks: one BAY per panel between two piers (a granite pier with its urn at the end of the bay, the iron rails, the spears, the gilded rosette, a box collider;
  // lib/fence-bays.js: a car at 24 km/h breaks it off). The geometry is the same as before, drawn once as templates at the origin.
  const bays = [];
  for (const pts of runs) {
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), n = Math.max(1, Math.round(len / 4.1)), step = len / n;
      for (let k = 0; k < n; k++) {
        const m = Math.max(2, Math.round(step / 0.19)), pk = [];
        for (let q = 1; q < m; q++) { const x = (q / m) * step; if (x < 0.5 || step - x < 0.5) continue; pk.push(x / step); }
        bays.push({ x0: a[0] + dx * k / n, z0: a[1] + dz * k / n, x1: a[0] + dx * (k + 1) / n, z1: a[1] + dz * (k + 1) / n, y: 0, first: k === 0, pickets: pk });
      }
    }
  }
  const templ = (fn) => { const Q = new Parts(), g = new THREE.Group(); fn(Q); Q.build(g, { name: 'lmM-fence' }); return g.children.map((m) => ({ geo: m.geometry, mat: m.material })); };
  const parts = [];
  templ((Q) => { Q.box(pier, -0.45, 0.45, 0, 2.2, -0.45, 0.45, 'b'); Q.box(pier, -0.55, 0.55, 2.2, 2.45, -0.55, 0.55, 'b'); lathe(Q, urnMat, 'lmM-urn', URN, 0, 2.45, 0, 0.8, 0.8, 12, 10); })
    .forEach((t, i) => parts.push({ geo: t.geo, mat: t.mat, name: 'pier' + i, far: 400, ats: (q) => (q.first ? ['start', 'end'] : ['end']) }));
  templ((Q) => { Q.box(iron, 0, 1, 0.5, 0.58, -0.03, 0.03, ''); Q.box(iron, 0, 1, 3.0, 3.08, -0.03, 0.03, ''); Q.box(iron, 0, 1, 1.7, 1.75, -0.03, 0.03, ''); })
    .forEach((t, i) => parts.push({ geo: t.geo, mat: t.mat, name: 'rails' + i, far: 400, stretch: true }));
  templ((Q) => { Q.box(iron, -0.014, 0.014, 0.1, 3.3, -0.014, 0.014, 'bt'); Q.cyl(gold, [0, 3.3, 0], [0, 3.55, 0], 0.035, 0.002, 4, false); Q.cyl(gold, [0, 3.0, 0], [0, 3.06, 0], 0.045, 0.045, 5, false); })
    .forEach((t, i) => parts.push({ geo: t.geo, mat: t.mat, name: 'spear' + i, far: 300, ats: (q) => q.pickets }));
  templ((Q) => { Q.cyl(gold, [0, 2.35, -0.04], [0, 2.35, 0.04], 0.32, 0.32, 10, false); })
    .forEach((t, i) => parts.push({ geo: t.geo, mat: t.mat, name: 'rosette' + i, far: 300, ats: () => ['mid'] }));
  knockBays(K.ctx, { name: 'lmM-forecourt-fence', bays, parts, far: 400,
    collider: () => ({ y0: 0, y1: 3.6, thick: 0.4, e0: 0, e1: 0 }),
    rec: () => ({ kind: 'fence', mass: 600, h: 3.2, r: 0.2, anchored: 24, hitK: 0.6, metal: true, minDv: 0 }) });
  void P; void ph;
  // the paved forecourt (cour d'honneur): granite slabs between the palace, the two fences and the service wing (hides the generic ground, which shows tufts and mottling there)
  const court = [[-1322, -1401.9], [-1288.2, -1417.4], [-1317, -1489.2], [-1350.7, -1473.9], [-1343.9, -1456], [-1370.3, -1441.4], [-1362.9, -1428.4], [-1356.6, -1417.3], [-1353.7, -1418.9], [-1333.7, -1429.8]];
  P.cap(M.slabDark, court, 0.024, true, 1.6);
  K.svc.fences.push({ id: 'w116396254', pts: runs[0] }, ...runs.slice(1).map(pts => ({ id: 'w116396257', pts })));
}

// ================================================================================================ Alexander III monument
function alexander() {
  return cached('lmM-alexander', () => {
    const H = horse({
      detail: 0.6, mane: 'right', tail: 'down', bridle: true,
      pose: { base: 'stand', neck: { angle: 0.7, arch: 0.05, len: 0.74 }, head: { pitch: 1.25, turn: 0, open: 0 },
        legs: { fl: { hoof: [0.22, 0, 0.36] }, fr: { hoof: [-0.22, 0, 0.36] }, hl: { hoof: [0.22, 0, -0.62] }, hr: { hoof: [-0.22, 0, -0.62] } } },
    });
    const seat = H.info.seat;
    const R = human({
      detail: 0.45, body: { muscle: 0.3, bulk: 1.18 },
      pose: {
        pelvis: [seat[0], seat[1] - 0.04, seat[2]], pelvisRot: [0, 0, 0], spine: [0.0, 0, 0], head: [0.04, 0, 0],
        legs: { L: { foot: [0.4, seat[1] - 0.82, seat[2] + 0.1], pole: [0.8, 0, 0.7] }, R: { foot: [-0.4, seat[1] - 0.82, seat[2] + 0.1], pole: [-0.8, 0, 0.7] } },
        arms: { L: { hand: [0.2, seat[1] + 0.28, seat[2] + 0.36], pole: [0.5, -0.6, -0.6], grip: 'hold', palm: [-0.4, 0.2, 1] }, R: { hand: [-0.22, seat[1] + 0.15, seat[2] + 0.2], pole: [-0.6, -0.4, -0.7], grip: 'fist', palm: [0.5, 0.2, 0.6] } },
      },
      outfit: { torso: 'coat', hem: 0.22, flare: 0.1, sleeves: 'long', trousers: 'long', boots: 0.5, collar: 'stand', epaulettes: true, buttons: true, cape: 'none', hat: 'none' },
      face: { age: 0.6, hair: 'short', beard: 'full', brow: 0.9, jaw: 1.2, mouth: 'stern', seed: 31 },
    });
    return extend(H, (S) => { for (const [k, g] of Object.entries(R.geos)) S.add(k, g); });
  });
}
export function alexanderMonument(K) {
  const P = K.P, M = K.M, ph = K.ctx.physics, X = -1332.4, Z = -1444.6, rot = 0.9;
  const red = K.mat('#8f6a60', { name: 'lmM-alexRed', paint: 0.05 }), redDark = K.mat('#6e5048', { name: 'lmM-alexRedD', paint: 0.05 }), grey = K.mat('#8a8480', { name: 'lmM-alexGrey', paint: 0.05 });
  P.push(X, 0, Z, rot);
  P.box(grey, -3.5, 3.5, 0, 0.4, -2.2, 2.2, 'b'); P.box(redDark, -3.1, 3.1, 0.4, 0.8, -1.95, 1.95, 'b');
  P.box(red, -2.7, 2.7, 0.8, 2.9, -1.45, 1.45, 'b');                                              // the massive pedestal block (red-grey granite)
  P.box(redDark, -2.9, 2.9, 2.9, 3.2, -1.65, 1.65, 'b');
  const mk = figureMats(K.ctx).keys('bronze', 'bronze');
  alexander().place(P, mk, 0, 3.2, 0, 0, 1.3);
  P.pop();
  ph.addBox(X, Z, 7.0, 4.4, rot, 0, 10);
  K.svc.monuments.push({ id: 'n1312226165', name: 'Памятник Александру III', x: X, z: Z, h: 8.2 });
  void M; void V; void L;
}

export function build(K, ctx) {
  const parts = [['palace', palace], ['fence', forecourtFence], ['alexander', alexanderMonument]];
  for (const [name, fn] of parts) { try { fn(K); } catch (e) { console.error(`[landmarksMars] palace/${name}:`, e); throw e; } }
  void ctx;
}
