// landmarksKirova/erfront.js - the FRONT ELEVATION of the ERARTA museum except the portico bay (erportico.js) and the portal (erportal.js): the five front segments of the plan
// (south pavilion, south wing, centre base, north wing, north pavilion), drawn in the pushed frame FE (local x = q' to the right seen from the street, z = r' outward, y up).
//   plinth      pink granite 0 .. 1.35 (blocks 1.2 x 0.6 m) with a polished cap, small basement windows with gratings under every bay of the wings / pavilions
//   base        floors 1 and 2: warm-yellow rusticated render (relief bands of 0.5 m, two tones), window openings cut with real reveals (windowWall), dark timber frames with muntins, white surrounds and sills
//   cornice     the white base cornice 9.4 .. 10.1 with dentils; on wings and the centre the terrace balustrade 10.1 .. 11.0 (panels of 10 balusters between pedestals with floodlights)
//   upper       floors 3-5 of the wings / pavilions: small beige ashlar, three window rows, white pilaster strips (ends, thirds), crown cornice (dentils, corona) at 22.0 / 23.0
// Dossier docs/research/kirova.md 11.2, photos er03 er04 er05 er06 (windows 2 x 3 / 2 x 2 panes, white surrounds, pedestals under the columns, pilaster strips between window pairs).
import { ER } from './frame.js';
import { windowWall } from './facade.js';
import { opOf, fixture, crown, baseCornice, balustrade } from './erwin.js';

const hash = (x, k = 0) => (Math.abs(Math.round(x * 13) * 31 + k * 17) >>> 0) % 97;
/** n window axes at the pitch of the columns (3.6 m) centred in x0 .. x1 */
export const axesOf = (a, b, n, pitch = 3.6) => Array.from({ length: n }, (_, i) => (a + b) / 2 + (i - (n - 1) / 2) * pitch);
export const bayCentres = (a, b, pitch = 3.7) => { const n = Math.max(1, Math.round((b - a) / pitch)), p = (b - a) / n; return Array.from({ length: n }, (_, i) => a + p * (i + 0.5)); };

/** windowWall with the uv origin at `ya` (the tile is laid from there) and the fixtures of its ops; ops carry absolute y */
export function windowed(K, o) {
  const { P, M } = K, rel = o.ops.map((p) => ({ ...p, y0: p.y0 - o.ya, y1: p.y1 - o.ya }));
  P.push(0, o.ya, 0, 0);
  windowWall(P, { x0: o.x0, x1: o.x1, y0: 0, y1: o.yb - o.ya, z0: o.z, tu: o.tu, tv: o.tv, wall: o.wall, reveal: o.reveal || M.eReveal, depth: o.depth ?? 0.26, ops: rel });
  if (!o.noFix) for (const p of rel) if (p.kind === 'win') fixture(P, M, p, o.z, o.depth ?? 0.26);
  P.pop();
}

export const SEGS = [
  { id: 'pavS', x: [ER.pavS[0], ER.pavS[1]], z: ER.pavSR, top: ER.pavCornice, pav: true },
  { id: 'wingS', x: [ER.wingS[0], ER.wingS[1]], z: ER.wingSR, top: ER.wingCornice },
  { id: 'wingN', x: [ER.wingN[0], ER.wingN[1]], z: ER.wingNR, top: ER.wingCornice },
  { id: 'pavN', x: [ER.pavN[0], ER.pavN[1]], z: ER.pavNR, top: ER.pavCornice, pav: true, axes: 3 },      // [CRITIC kv374] the north pavilion front has THREE window axes between wide corner piers
];

function segment(K, s) {
  const { P, M } = K, [x0, x1] = s.x, z = s.z, cs = s.axes ? axesOf(x0, x1, s.axes) : bayCentres(x0 + 0.5, x1 - 0.5);
  // plinth with basement windows
  const bs = cs.map((x) => opOf(M, 'bs', x, hash(x)));
  windowWall(P, { x0, x1, y0: 0, y1: ER.plinth, z0: z + 0.12, tu: 2.4, tv: 1.2, wall: M.eGranite, reveal: M.eGraniteDark, depth: 0.28, ops: bs });
  bs.forEach((p) => fixture(P, M, p, z + 0.12, 0.28));
  P.box(M.eGraniteDark, x0 - 0.04, x1 + 0.04, 1.27, 1.39, z - 0.0, z + 0.2, 'k', 2);                                  // the polished cap of the plinth
  // base: floors 1 and 2
  const ops = [];
  cs.forEach((x, i) => { ops.push(opOf(M, 'f1', x, hash(x, 1))); ops.push(opOf(M, 'f2', x, hash(x, 2))); });
  windowed(K, { x0, x1, ya: ER.plinth, yb: ER.corniceTop, z, tu: 1.8, tv: 1.0, wall: M.eRust, ops });
  baseCornice(P, M, x0, x1, z);
  // upper floors
  const up = [], uc = s.axes ? cs : bayCentres(x0 + 0.9, x1 - 0.9, 3.8);
  uc.forEach((x) => { for (const k of ['u3', 'u4', 'u5']) up.push(opOf(M, k, x, hash(x, 3), { w: 1.45 })); });
  const yTop = s.top - 1.05;
  windowed(K, { x0, x1, ya: ER.corniceTop, yb: s.top, z, tu: 2.8, tv: 1.4, wall: M.eAshlar, ops: up });
  // pilaster strips: ends (double width on a pavilion) and the dividing lines between window pairs
  const pil = (a, b) => P.box(M.eWhite, a, b, ER.corniceTop, yTop, z, z + 0.14, 'k', 2);
  pil(x0, x0 + (s.pav ? 0.9 : 0.6)); pil(x1 - (s.pav ? 0.9 : 0.6), x1);
  const w = x1 - x0;
  if (s.axes) for (let i = 0; i + 1 < cs.length; i++) { const m = (cs[i] + cs[i + 1]) / 2; pil(m - 0.25, m + 0.25); }                // between the axes
  else for (const f of s.pav ? [1 / 3, 2 / 3] : [0.5]) pil(x0 + w * f - 0.25, x0 + w * f + 0.25);
  crown(P, M, x0, x1, z, s.top);
  if (s.id === 'pavN') {
    // KartaView kv374 (2019): white apron below each ground-floor window,
    // a broad bracketed sill under the middle top window, and a shallow festoon.
    for (const x of cs) P.box(M.eWhite, x - 0.87, x + 0.87, 1.39, 1.62, z, z + 0.09, 'k', 2);
    const cx = cs[1];
    P.box(M.eWhite, cx - 2.3, cx + 2.3, 17.52, 17.69, z, z + 0.23, 'k', 2);
    for (const x of [cx - 1.75, cx + 1.75]) P.box(M.eWhite, x - 0.12, x + 0.12, 17.22, 17.52, z, z + 0.19, 'k', 1);
    for (let i = 0; i < 10; i++) {
      const a = i / 10, b = (i + 1) / 10;
      P.cyl(M.eWhite, [cx - 0.75 + 1.5 * a, 16.95 - 0.23 * Math.sin(a * Math.PI), z + 0.08], [cx - 0.75 + 1.5 * b, 16.95 - 0.23 * Math.sin(b * Math.PI), z + 0.08], 0.055, 0.055, 5, false);
    }
  }
  if (!s.pav) { const bl = bayCentres(x0, x1, 3.8); balustrade(P, M, x0, x1, z + 0.3, [x0 + 0.0, ...bl.slice(0, -1).map((c, i) => (c + bl[i + 1]) / 2), x1], ER.corniceTop, ER.parapet, { bw: 1.3 }); }
}

/** the centre of the front below the terrace: base slab front wall with the windows beside the portal; the portal itself and the doors are erportal.js */
function centreBase(K) {
  const { P, M } = K, [x0, x1] = ER.centre, z = ER.centreR;
  const bs = [], ops = [];
  for (const x of [-11.7, -8.1, 10.1]) { ops.push(opOf(M, 'f1', x, hash(x, 1))); ops.push(opOf(M, 'f2', x, hash(x, 2))); bs.push(opOf(M, 'bs', x, hash(x))); }
  windowWall(P, { x0, x1, y0: 0, y1: ER.plinth, z0: z + 0.12, tu: 2.4, tv: 1.2, wall: M.eGranite, reveal: M.eGraniteDark, depth: 0.28, ops: bs });
  bs.forEach((p) => fixture(P, M, p, z + 0.12, 0.28));
  P.box(M.eGraniteDark, x0 - 0.04, x1 + 0.04, 1.27, 1.39, z, z + 0.2, 'k', 2);
  // the three door openings of the portal are cut here (door sill = the landing +1.35): centres -4.3 / 0 / 4.3, 2.0 x 4.45
  const doors = [-4.3, 0, 4.3].map((x) => ({ x, w: 2.0, y0: ER.plinth, y1: ER.plinth + 4.0, kind: 'door', glass: null }));
  windowed(K, { x0, x1, ya: ER.plinth, yb: ER.corniceTop, z, tu: 1.8, tv: 1.0, wall: M.eRust, ops: [...ops, ...doors], depth: 0.3 });
  baseCornice(P, M, x0, x1, z);
}

export function build(K) {
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksKirova] erfront/${name}:`, e); throw e; } };
  for (const s of SEGS) stage(s.id, () => segment(K, s));
  stage('centre', () => centreBase(K));
}
