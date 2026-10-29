// landmarksMarineFacade/ships.js - the two moored white cruise liners of the port (the lead's decision: white, NO flags, NO funnel logo, NO readable name, no horn; dossier section 5 + CRITIC 5.1 / 5.2).
//   Liner A  (Radiance-class look, LOA 293 m, beam 32.2 m, 12 decks): along the EAST wall at berths 4-5, bow to the SSW so that the PORT side faces the quay.
//   Liner B  (AIDA-class look, LOA 252 m, beam 32.2 m): along the SOUTH wall at berth 6, bow to the WNW, port side to the quay; the superstructure has the dark-glass balcony bands.
// Ship frame: +x bow, +y up from the WATERLINE (world y = -3.4 + y), +z starboard, the quay side is -z.  Hull: lofted every ~6 m from the waterplane (stops 1.2 m under the water), white plating with two rows of
// portholes, a navy boot-top, a raked flared bow; the open lifeboat deck (y 10.6 .. 14.6) with 12 orange tenders per side (instanced) on a recessed core, the stepped balcony block (white frames + glass per
// 3 m cabin bay, 4 steps to y 36), the wheelhouse with its wings, the lattice mast with two radomes (top 62 m), the funnel casing (blank white, top 52 m), the glass dome, six pale-blue mooring ropes.
// The hull is placed 0.8 m off the measured quay edge (frame.js quayEdge); colliders: a hull box over the water (nobody boards).  Static: no heave, no horn.
import * as THREE from 'three';
import { FW, FM, quayEdge, WATER_Y, U_DIR, V_DIR } from './frame.js';
import { rotYOf, prism } from './geo.js';

const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
/** half-breadth fraction of the waterplane from the stern (t 0) to the stem (t 1).  Review fix 2026-10-09: the stern is ROUNDED and full width by t = 0.06 (the first balcony step starts 8 m forward of the transom
 *  and used to overhang the narrowed stern by 5 m: a floating block in the quay-side views), the bow is one smooth convex curve (1 - s^2.2)^0.62 from t = TB to the stem instead of four straight facets. */
const TB = 0.74;
const STERN = [[0, 0.80], [0.012, 0.88], [0.03, 0.95], [0.06, 0.99], [0.1, 1.0]];
const hbFrac = (t) => {
  if (t <= 0) return STERN[0][1]; if (t >= 1) return 0;
  if (t >= TB) { const s = (t - TB) / (1 - TB); return Math.pow(Math.max(0, 1 - Math.pow(s, 2.2)), 0.62); }
  if (t >= 0.1) return 1;
  for (let i = 0; i + 1 < STERN.length; i++) if (t <= STERN[i + 1][0]) { const k = (t - STERN[i][0]) / (STERN[i + 1][0] - STERN[i][0]); return STERN[i][1] + (STERN[i + 1][1] - STERN[i][1]) * k; }
  return 1;
};

export const SHIPS = [
  { id: 'liner-a', L: 293, B: 32.2, wall: 'east', par: 400, bowDir: [-0.2885, 0.9575], variant: 'a', funnelX: -40, funnelTop: 52, mast: 96, bridge: 96, steps: [[14.6, 20.7, 15.2, -138, 112], [20.7, 26.9, 14.3, -132, 106], [26.9, 33.0, 13.2, -124, 100], [33.0, 36.0, 12.0, -108, 68]] },
  { id: 'liner-b', L: 252, B: 32.2, wall: 'south', par: 160, bowDir: [-0.9575, -0.2885], variant: 'b', funnelX: -60, funnelTop: 48, mast: 82, bridge: 82, steps: [[14.5, 20.6, 14.8, -118, 100], [20.6, 26.7, 13.9, -112, 94], [26.7, 32.8, 12.8, -104, 88], [32.8, 39.0, 11.6, -92, 56]] },
];

/** world centre of the ship: its centreline 0.8 m + half beam off the measured quay edge */
export function shipCentre(S) {
  const half = S.B / 2 + 0.8;
  if (S.wall === 'east') { const e = quayEdge('east', S.par) ?? -6; return { ...FW(e + half, S.par), u: e + half, v: S.par }; }
  const e = quayEdge('south', S.par) ?? 0; return { ...FW(S.par, e + half), u: S.par, v: e + half };
}

export function build(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics;
  for (const S of SHIPS) { try { liner(K, S); } catch (e) { console.error('[landmarksMarineFacade/ships]', S.id, e); } }
  // the tenders: enclosed lifeboats 9.5 x 3.2 x 3.4 m, orange with a pale roof strip (48 of them, built into the ship mesh)
  // (review fix: a pointed bow and a rounded stern instead of a 9.5 x 3.2 m crate; the roof strip and the davit stay)
  const TENDER = [[-4.75, -1.0], [-4.2, -1.6], [2.4, -1.6], [4.75, -0.55], [4.75, 0.55], [2.4, 1.6], [-4.2, 1.6], [-4.75, 1.0]];
  for (const b of K.boats || []) { P.push(b.x, b.y, b.z, b.rot); try { prism(P, TENDER, 0.2, 2.6, { wall: M.boat, roof: M.boat }, { tile: 2, capTile: 2 }); P.box(M.hullPlain, -3.9, 3.0, 2.6, 2.75, -1.0, 1.0, 'b', 2); P.box(M.deckGrey, -0.2, 0.2, 2.6, 3.4, -0.1, 0.1, 'b', 1); } finally { P.pop(); } }
  svc.counts.tenders = (K.boats || []).length;
}

function liner(K, S) {
  const { ctx, P, M, svc } = K, ph = ctx.physics;
  const c = shipCentre(S), ea = S.bowDir, rot = rotYOf(ea[0], ea[1]), zd = [-ea[1], ea[0]];
  const L = S.L, B = S.B, hb = B / 2, H = 10.6, x0 = -L / 2, WL = WATER_Y;
  const rake = 7.0, k = rake / ((1 - TB) * L);
  const hbAt = (x, y) => {
    const t = (x - x0) / L, yy = Math.max(0, y);
    const te = t > TB ? TB + (t - TB) / (1 + k * yy / H) : t;                    // the upper levels reach farther forward: the raked stem (7 m at the deck)
    return hb * hbFrac(te) * (1 + (t > TB ? 0.035 * yy / H : 0));
  };
  const dark = S.variant === 'b';
  P.push(c.x, WL, c.z, rot);
  try {
    // ------------------------------------------------------------------------------------- the hull: stations every ~6 m, levels -1.2 / 0.8 (boot-top) / 7.0 / 10.6
    // stations: every 2.4 m round the stern (first 10 %), every ~6 m amidships, every 2.2 m on the bow (smooth curve), then five stations beyond the waterline stem for the raked stem
    const xs = [], xSt = x0 + 0.1 * L, xBow = x0 + TB * L;
    for (let x = x0; x < xSt - 0.01; x += 2.4) xs.push(x);
    { const nm = Math.max(1, Math.round((xBow - xSt) / 6)); for (let i = 0; i < nm; i++) xs.push(xSt + (xBow - xSt) * i / nm); }
    { const nb = Math.ceil((x0 + L - xBow) / 2.2); for (let i = 0; i <= nb; i++) xs.push(xBow + (x0 + L - xBow) * i / nb); }
    xs.push(x0 + L + 2.0, x0 + L + 4.0, x0 + L + 5.5, x0 + L + 6.6, x0 + L + 7.3);
    const lv = [-1.2, 0.8, 7.0, H], mats = [M.boot, M.hull, M.hullPlain];
    const uvh = (x, y) => [x / 3.3, (y - 0.8) / 6.2];
    for (let j = 0; j + 1 < lv.length; j++) for (let i = 0; i + 1 < xs.length; i++) {
      const xa = xs[i], xb = xs[i + 1], ya = lv[j], yb = lv[j + 1];
      const wa0 = hbAt(xa, ya), wa1 = hbAt(xa, yb), wb0 = hbAt(xb, ya), wb1 = hbAt(xb, yb);
      if (wa0 + wa1 + wb0 + wb1 < 0.05) continue;
      // the stem rakes forward with height: x of the upper edge moves forward by the rake where the stem is
      const uv = j === 1 ? [uvh(xa, ya), uvh(xb, ya), uvh(xb, yb), uvh(xa, yb)] : [[xa / 4, ya / 4], [xb / 4, ya / 4], [xb / 4, yb / 4], [xa / 4, yb / 4]];
      for (const sg of [1, -1]) {
        const p0 = [xa, ya, sg * wa0], p1 = [xb, ya, sg * wb0], p2 = [xb, yb, sg * wb1], p3 = [xa, yb, sg * wa1];
        const nz = sg, nx = 0.15 * (xb > L / 2 - 30 ? 1 : 0);
        P.quad(mats[j], p0, p1, p2, p3, [nx, 0.02, nz], uv);
      }
    }
    // the transom (stern) face and the deck slab at y = H
    P.quad(M.hullPlain, [x0, -1.2, -hbAt(x0, 0)], [x0, -1.2, hbAt(x0, 0)], [x0, H, hbAt(x0, H)], [x0, H, -hbAt(x0, H)], [-1, 0, 0]);
    { const ring = []; for (const x of xs) ring.push([x, hbAt(x, H)]); for (let i = xs.length - 1; i >= 0; i--) ring.push([xs[i], -hbAt(xs[i], H)]);
      const clean = ring.filter((p, i) => i === 0 || Math.hypot(p[0] - ring[i - 1][0], p[1] - ring[i - 1][1]) > 0.05);
      P.cap(M.deckGrey, clean, H, true, 6); }
    // ------------------------------------------------------------------------------------- the recessed core with the lifeboat deck (y 10.6 .. 14.6) and the stepped balcony block
    const xr0 = S.steps[0][3] + 6, xr1 = S.steps[0][4] - 6, cw = 13.0;
    P.box(M.hullPlain, xr0, xr1, H, 14.6, -cw, cw, 'b', 4);
    // review fix: the aft deckhouse (24 m, as wide as the first balcony step) closes the open gap that showed under the stern end of the block from the quay and from the stern
    P.box(M.hullPlain, S.steps[0][3] + 0.03, S.steps[0][3] + 24, H, 14.6, -S.steps[0][2] + 0.04, S.steps[0][2] - 0.04, 'bt', 4);          // (3-4 cm inside the block walls: a shared seam z-fought at 14.6 m)
    const balc = dark ? M.balconyDark : M.balcony;
    for (const [ya, yb, w, xs0, xs1] of S.steps) {
      const bowTaper = 18;
      const ring = [[xs0, -w], [xs1 - bowTaper, -w], [xs1, -w * 0.45], [xs1, w * 0.45], [xs1 - bowTaper, w], [xs0, w]];
      prism(P, ring, ya, yb, { wall: balc, roof: M.deckGrey }, { tile: 3.03, capTile: 6 });
      // the white deck edge line
      P.box(M.hullPlain, xs0, xs1 - bowTaper, yb - 0.12, yb + 0.05, -w - 0.08, w + 0.08, 'bl', 4);          // (no aft face: it was coplanar with the aft wall of the step and z-fought from the stern, zfight 2026-10-09)
    }
    const top = S.steps[3][1];
    // wheelhouse: a wide box across the front of step 3 with wings out to 19.5 m, a roof; glass band
    const bx = S.bridge;
    P.box(M.hullPlain, bx - 5.5, bx + 4.5, 33.0, 38.6, -17.5, 17.5, '', 4); P.box(M.shipDark, bx - 5.6, bx + 4.6, 34.2, 36.6, -17.45, 17.45, '', 4);
    P.box(M.hullPlain, bx - 6, bx + 5, 38.6, 39.0, -18, 18, 'b', 4);
    P.box(M.hullPlain, bx - 3.5, bx + 2.5, 39.0, 42.0, -6, 6, '', 4); P.box(M.shipDark, bx - 3.55, bx + 2.55, 40.0, 41.4, -5.9, 5.9, '', 4);
    P.col(M.hullPlain, bx - 0.5, 0, 42.0, 61.0, 0.55, 0.3, 8, true);                       // the mast
    P.box(M.hullPlain, bx - 1.2, bx + 0.2, 52, 52.3, -3.2, 3.2, '', 2); P.box(M.hullPlain, bx - 1.0, bx + 0.0, 57, 57.2, -2.2, 2.2, '', 2);
    for (const [dx, dy, dz, r] of [[0.0, 62.6, 0, 1.3], [-0.5, 44.6, 2.4, 1.2], [-0.5, 44.6, -2.4, 1.2]]) { const g = new THREE.SphereGeometry(r, 10, 7); P.geo(M.radome, g, bx + dx, dy, dz); g.dispose(); }
    // the funnel: a blank white casing (22 m long, 8 m wide, tapering) with a dark rim; a rear fin
    const fx = S.funnelX, ft = S.funnelTop, fy0 = top;
    { const seg = 20, ring = (rx, rz, y) => Array.from({ length: seg }, (_, i) => { const a = i / seg * Math.PI * 2; return [fx + Math.cos(a) * rx, y, Math.sin(a) * rz]; });
      const r0 = ring(dark ? 5 : 11, 4.0, fy0), r1 = ring(dark ? 4 : 9, 3.2, ft - 2.0), r2 = ring(dark ? 4.2 : 9.3, 3.35, ft - 2.0), r3 = ring(dark ? 4.2 : 9.3, 3.35, ft);
      const band = (A, Bq, mat) => { for (let i = 0; i < seg; i++) { const j = (i + 1) % seg, n = [Math.cos((i + 0.5) / seg * Math.PI * 2) * 0.8, 0.1, Math.sin((i + 0.5) / seg * Math.PI * 2)]; P.quad(mat, A[i], A[j], Bq[j], Bq[i], n, [[i / 3, 0], [(i + 1) / 3, 0], [(i + 1) / 3, 1], [i / 3, 1]]); } };
      band(r0, r1, M.funnel); band(r2, r3, M.shipDark); P.fan(M.shipDark, r3.map((p) => p), [0, 1, 0], (p) => [p[0], p[2]]);
      P.box(M.funnel, fx - (dark ? 5.5 : 12), fx - (dark ? 4 : 10), fy0, ft - 3.0, -0.35, 0.35, '', 2); }                  // the blank fin behind the funnel
    // the solarium dome and the aft radomes
    P.box(M.shipGlass, -10, 50, top, top + 2.4, -8, 8, 'b', 3);
    for (const sz of [-1, 1]) { const g = new THREE.SphereGeometry(1.25, 10, 7); P.geo(M.radome, g, S.steps[3][3] + 8, top + 3.2, sz * 4); g.dispose(); }
    // ------------------------------------------------------------------------------------- tenders (12 per side at 14 m pitch, instanced; positions in world), mooring ropes on the quay side (-z)
    const wp = (lx, lz) => ({ x: c.x + ea[0] * lx + zd[0] * lz, z: c.z + ea[1] * lx + zd[1] * lz });
    K.boats ||= [];
    for (let n = 0; n < 12; n++) for (const sz of [-1, 1]) { const lx = xr0 + 24 + n * 14.0; if (lx > xr1 - 14) continue; const p = wp(lx, sz * (cw + 1.55)); K.boats.push({ x: p.x, y: WL + H, z: p.z, rot }); }
    // mooring ropes (pale blue-white, 0.07 m): 2 bow lines, 2 stern lines and 2 springs from the hull to bollard points on the quay (the quay deck is y = 0 = 3.4 above the waterline)
    const qz = -(hb + 0.8 + 3.2);
    for (const [fx0, tx] of [[L / 2 - 10, L / 2 + 14], [L / 2 - 14, L / 2 + 22], [x0 + 10, x0 - 16], [x0 + 14, x0 - 22], [L / 2 - 30, L / 2 - 6], [x0 + 30, x0 + 6]]) {
      const a = [fx0, 7.4, -hbAt(fx0, 7.4)], b = [tx, 3.5, qz]; let prev = a;
      for (let q = 1; q <= 6; q++) { const t = q / 6, pt = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - 0.9 * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t]; P.cyl(M.rope, prev, pt, 0.07, 0.07, 4, false); prev = pt; }
    }
  } finally { P.pop(); }
  // collider over the water: nobody boards (the hull is a solid box from the bed to the lifeboat deck)
  ph.addBox(c.x, c.z, L, B, rot, WL - 3, WL + 14.6);
  svc.ships.push({ id: S.id, c: [Math.round(c.x * 10) / 10, Math.round(c.z * 10) / 10], ax: ea, L, B, wall: S.wall });
}
