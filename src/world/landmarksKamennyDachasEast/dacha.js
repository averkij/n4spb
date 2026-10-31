// landmarksKamennyDachasEast/dacha.js - the OLDENBURG DACHA (OSM w31065816, Malaya Nevka embankment 11; F. L. Shustov 1831-33, wooden, square plan with a central rotunda under a dome; photos O02 O04 O05 O07 O10 O11 S03 S04):
//   the square core 26.4 x 26.0 m of two storeys in pale-yellow clapboard on a stone plinth, three SIX-column Doric porticoes (south = toward the river and the sphinx pier, east, west) with flat entablatures and an iron-railed
//   balcony on their roofs, the entrance vestibule on the north with the garland relief on its sides, tall arched windows with radial fanlights beside the porticoes, the dentil cornice, the drum of the rotunda with twelve arched
//   windows, the grey-green ribbed dome with a ring railing on top.  The plot is a construction site behind a green plank fence (restoration since 2021): exterior only and solid.
// Frame D (frame.js).  Collectors: P = the shell (LOD 1100 m), N = near detail (window surrounds, column necks, arch frames; LOD 350 m).  Facade frame of a face: x to the right seen from outside, y up, z out.
import { D, DP } from './frame.js';
import { holedWall, Q, surround, archSurround } from './facade.js';
import { band, ringEdges, polyOf } from './kit.js';
import { tube, revolve, archPts, planeShape, onFace } from './geo.js';

const { HW, HD, PL, E1, WT, CT, DR, DC } = DP;
const WALL_UVS = 3.2;
const BAYS = [-5.2, -2.6, 0, 2.6, 5.2];                                  // the five bays between the six columns
const COLX = [-6.4, -3.9, -1.3, 1.3, 3.9, 6.4];

const on = (Ps, x, z, nx, nz, fn) => { for (const P of Ps) P.push(x, 0, z, Math.atan2(nx, nz)); try { return fn(); } finally { for (const P of Ps) P.pop(); } };

/** the openings of a face: ground floor, upper floor, the arched windows beside the portico */
function openings(kind) {
  const H = [];
  const g = (cx) => H.push({ x0: cx - 0.675, x1: cx + 0.675, y0: 1.4, y1: 4.4, kind: 'g' });
  const u = (cx) => H.push({ x0: cx - 0.6, x1: cx + 0.6, y0: 6.1, y1: 8.1, kind: 'u' });
  const a = (cx) => H.push({ cx, y0: 1.3, w: 2.0, h: 3.8, arch: true, kind: 'a' });
  if (kind === 'port') {                                                   // south / east / west: portico in the middle
    a(-10); a(10); u(-10); u(10);
    g(-5.2); g(-2.6); g(2.6); g(5.2); H.push({ x0: -0.75, x1: 0.75, y0: PL + 0.05, y1: PL + 3.05, kind: 'd' });
    for (const x of BAYS) u(x);
  } else {                                                                 // north: the vestibule hides the middle
    a(-10); a(10); u(-10); u(10);
  }
  return H;
}

function drawOpenings(P, N, M, H, depth = 0.3) {
  const z = -depth + 0.04;
  for (const h of H) {
    if (h.kind === 'a') {
      const r = h.w / 2, ys = h.y0 + h.h - r, S = M.winG;
      Q(P, S, [h.cx - r, h.y0, z], [h.cx + r, h.y0, z], [h.cx + r, ys, z], [h.cx - r, ys, z], [0, 0, 1]);
      const pts = []; for (let i = 0; i <= 14; i++) { const q = Math.PI * i / 14; pts.push([h.cx + Math.cos(q) * r, ys + Math.sin(q) * r]); }
      planeShape(P, M.fan, pts, z);
      archSurround(N, M.white, h, { sw: 0.18, proud: 0.07 });
    } else {
      const S = { g: M.winG, u: M.winU, d: M.doorG }[h.kind];
      Q(P, S, [h.x0, h.y0, z], [h.x1, h.y0, z], [h.x1, h.y1, z], [h.x0, h.y1, z], [0, 0, 1]);
      if (h.kind === 'g') surround(N, M.white, h, { sw: 0.16, proud: 0.06, sill: 0.12 });
      else if (h.kind === 'u') surround(N, M.white, h, { sw: 0.13, proud: 0.06, sill: 0.1 });
      else surround(N, M.white, h, { sw: 0.16, proud: 0.07, sill: 0 });
    }
  }
}

/** the six-column Doric portico in a facade frame: floor and steps, columns, flat entablature, the deck with its iron railing; hw half width, depth = how far it projects from the wall */
function portico(P, N, M, hw, depth) {
  const { colH, colR0, colR1 } = DP, zc = depth - 0.75;
  P.box(M.plinth, -hw, hw, 0, PL, 0.15, depth, 'b', 1.8);                                                     // the porch floor on the stone footing
  P.box(M.granite, -2.4, 2.4, 0, 0.27, depth, depth + 1.0, 'b', 1.8); P.box(M.granite, -2.4, 2.4, 0.27, 0.54, depth, depth + 0.7, 'b', 1.8); P.box(M.granite, -2.4, 2.4, 0.54, PL, depth, depth + 0.4, 'b', 1.8);
  for (const x of COLX.map((c) => c * hw / 6.8)) {
    tube(P, M.white, x, zc, PL, PL + colH - 0.3, colR0, colR1, 20, 1, 1);                                       // the faceted shaft (the facets read as flutes)
    tube(P, M.white, x, zc, PL + colH - 0.3, PL + colH - 0.1, colR1, 0.38, 20, 1, 1);                           // the echinus
    P.box(M.white, x - 0.43, x + 0.43, PL + colH - 0.1, PL + colH, zc - 0.43, zc + 0.43, 'b', 2);                   // the abacus
    N.col(M.white, x, zc, PL + colH - 0.34, PL + colH - 0.3, colR1 + 0.04, colR1 + 0.04, 20, true);             // the necking ring
  }
  // the entablature round the three sides (mitred): architrave, frieze, the corona with a soffit
  const edges = [
    { a: [-hw, 0], b: [-hw, depth], n: [-1, 0] }, { a: [-hw, depth], b: [hw, depth], n: [0, 1] }, { a: [hw, depth], b: [hw, 0], n: [1, 0] },
  ].map((e) => ({ ...e, len: Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]) }));
  const y0 = E1 - 0.9;
  band(P, edges, y0, y0 + 0.4, 0.1, { front: M.white, top: M.white, under: M.shade }, { uvs: 3 });
  band(P, edges, y0 + 0.4, y0 + 0.75, 0.04, { front: M.white, top: null, under: null }, { uvs: 3 });
  band(P, edges, y0 + 0.75, E1, 0.3, { front: M.white, top: M.white, under: M.shade }, { uvs: 3 });
  P.quad(M.roof, [-hw, E1, depth], [hw, E1, depth], [hw, E1, 0], [-hw, E1, 0], [0, 1, 0], [[-hw / 2.4, depth / 2.4], [hw / 2.4, depth / 2.4], [hw / 2.4, 0], [-hw / 2.4, 0]]);   // the balcony deck
  // the balcony railing: white piers and iron lattice panels
  const yb = E1 + 0.04, hR = 1.0, zf = depth - 0.15, xs = hw - 0.15;
  const nF = Math.max(1, Math.round(2 * xs / 3.4)), px = Array.from({ length: nF + 1 }, (_, i) => -xs + 2 * xs * i / nF);
  for (const x of px) { P.box(M.white, x - 0.15, x + 0.15, yb, yb + hR + 0.1, zf - 0.15, zf + 0.15, 'b', 1); P.box(M.white, x - 0.2, x + 0.2, yb + hR + 0.1, yb + hR + 0.18, zf - 0.2, zf + 0.2, 'b', 1); }
  for (let i = 0; i < nF; i++) Q(P, M.rail, [px[i] + 0.15, yb + 0.05, zf], [px[i + 1] - 0.15, yb + 0.05, zf], [px[i + 1] - 0.15, yb + hR, zf], [px[i] + 0.15, yb + hR, zf], [0, 0, 1]);
  const zw = 0.35;
  for (const s of [-1, 1]) {
    P.box(M.white, s * xs - 0.15, s * xs + 0.15, yb, yb + hR + 0.1, zw - 0.15, zw + 0.15, 'b', 1);
    Q(P, M.rail, [s * xs, yb + 0.05, zw + 0.15], [s * xs, yb + 0.05, zf - 0.15], [s * xs, yb + hR, zf - 0.15], [s * xs, yb + hR, zw + 0.15], [s, 0, 0]);
  }
}

export async function build(K) {
  const { M, P, N, svc } = K;
  P.push(D.ox, 0, D.oz, D.rot); N.push(D.ox, 0, D.oz, D.rot);
  try {
    const faces = [
      { id: 'S', x: 0, z: HD, nx: 0, nz: 1, w: 2 * HW, kind: 'port', port: { hw: DP.portS.hw, depth: DP.portS.d - HD } },
      { id: 'E', x: HW, z: 0, nx: 1, nz: 0, w: 2 * HD, kind: 'port', port: { hw: DP.portE.hw, depth: DP.portE.d - HW } },
      { id: 'W', x: -HW, z: 0, nx: -1, nz: 0, w: 2 * HD, kind: 'port', port: { hw: DP.portW.hw, depth: DP.portW.d - HW } },
      { id: 'N', x: 0, z: -HD, nx: 0, nz: -1, w: 2 * HW, kind: 'north' },
    ];
    // ---- stone plinth of the core
    P.box(M.plinth, -HW - 0.15, HW + 0.15, 0, PL, -HD - 0.15, HD + 0.15, 'b', 1.8);
    // ---- the four walls
    for (const f of faces) {
      on([P, N], f.x, f.z, f.nx, f.nz, () => {
        const H = openings(f.kind);
        holedWall(P, M.boards, -f.w / 2, f.w / 2, PL, WT, H, { depth: 0.3, uvs: WALL_UVS });
        drawOpenings(P, N, M, H);
        for (const s of [-1, 1]) P.box(M.white, s < 0 ? -f.w / 2 : f.w / 2 - 0.3, s < 0 ? -f.w / 2 + 0.3 : f.w / 2, PL, WT, 0, 0.05, 'kb', 1);   // the white corner boards
        if (f.port) portico(P, N, M, f.port.hw, f.port.depth);
      });
    }
    // ---- the north vestibule: a two-storey projection with its own front, side walls and entablature
    {
      const vd = DP.vest.d - HD, vhw = DP.vest.hw;
      on([P, N], 0, -HD - vd, 0, -1, () => {
        const H = [{ x0: -0.75, x1: 0.75, y0: PL + 0.05, y1: PL + 3.05, kind: 'd' }, { x0: -4.675, x1: -3.325, y0: 1.4, y1: 4.4, kind: 'g' }, { x0: 3.325, x1: 4.675, y0: 1.4, y1: 4.4, kind: 'g' }];
        for (const x of [-4.8, -2.4, 0, 2.4, 4.8]) H.push({ x0: x - 0.6, x1: x + 0.6, y0: 6.1, y1: 8.1, kind: 'u' });
        holedWall(P, M.boards, -vhw, vhw, PL, WT, H, { depth: 0.3, uvs: WALL_UVS });
        drawOpenings(P, N, M, H);
        P.box(M.plinth, -vhw - 0.15, vhw + 0.15, 0, PL, -vd + 0.15, 0.15, 'b', 1.8);
        P.box(M.granite, -1.6, 1.6, 0, 0.27, 0.15, 1.0, 'b', 1.8); P.box(M.granite, -1.6, 1.6, 0.27, 0.54, 0.15, 0.7, 'b', 1.8);
        // the string course between the floors (the ground floor top)
        P.box(M.white, -vhw, vhw, E1 - 0.12, E1 + 0.08, 0, 0.14, 'k', 1);
      });
      for (const s of [-1, 1]) {                                                                    // the side walls of the vestibule, each with an arched window and the garland relief
        on([P, N], s * vhw, -HD - vd / 2, s, 0, () => {
          const H = [{ cx: 0, y0: 1.3, w: 1.6, h: 3.4, arch: true, kind: 'a' }];
          holedWall(P, M.boards, -vd / 2, vd / 2, PL, WT, H, { depth: 0.3, uvs: WALL_UVS });
          const z = -0.26, r = 0.8, ys = 1.3 + 3.4 - r;
          Q(P, M.winG, [-r, 1.3, z], [r, 1.3, z], [r, ys, z], [-r, ys, z], [0, 0, 1]);
          const pts = []; for (let i = 0; i <= 14; i++) { const q = Math.PI * i / 14; pts.push([Math.cos(q) * r, ys + Math.sin(q) * r]); }
          planeShape(P, M.fan, pts, z);
          archSurround(N, M.white, H[0], { sw: 0.16, proud: 0.07 });
          Q(P, M.garland, [-0.95, 5.95, 0.025], [0.95, 5.95, 0.025], [0.95, 6.85, 0.025], [-0.95, 6.85, 0.025], [0, 0, 1]);
          P.box(M.white, -vd / 2, vd / 2, E1 - 0.12, E1 + 0.08, 0, 0.14, 'k', 1);
        });
      }
    }
    // ---- the cornice round the core and the vestibule (dentil band under a deep corona), the roof
    const ring = [[-HW, -HD], [-DP.vest.hw, -HD], [-DP.vest.hw, -DP.vest.d], [DP.vest.hw, -DP.vest.d], [DP.vest.hw, -HD], [HW, -HD], [HW, HD], [-HW, HD]];
    const edges = ringEdges(polyOf(ring));
    band(P, edges, WT, WT + 0.25, 0.06, { front: M.white, top: null, under: null }, { uvs: 3 });
    band(P, edges, WT + 0.25, WT + 0.45, 0.42, { front: M.dentil, top: null, under: M.shade }, { uvs: 1.02 });
    band(P, edges, WT + 0.45, WT + 0.8, 0.8, { front: M.white, top: M.white, under: M.shade }, { uvs: 3 });
    band(P, edges, WT + 0.8, CT, 0.72, { front: M.white, top: M.white, under: null }, { uvs: 3 });
    P.cap(M.roof, ring, CT, true, 4);
    // ---- the rotunda: the drum (24 facets, twelve arched windows), its cornice, the dome, the ring railing
    const R = DP.drumR, seg = 24;
    tube(P, M.boards, 0, 0, CT, DR, R, R, seg, 2 * Math.PI * R / WALL_UVS / seg * seg, (DR - CT) / WALL_UVS);
    const ap = R * Math.cos(Math.PI / seg), ww = 0.95, wh = 2.3, wy = CT + 0.6;
    for (let i = 0; i < seg; i += 2) {
      const tm = (i + 0.5) * 2 * Math.PI / seg, x = Math.sin(tm) * (ap + 0.025), z = Math.cos(tm) * (ap + 0.025);
      P.push(x, wy, z, tm); N.push(Math.sin(tm) * ap, wy, Math.cos(tm) * ap, tm);
      try { planeShape(P, M.winDrD, archPts(0, 0, ww, wh, 10), 0); archSurround(N, M.white, { cx: 0, y0: 0, w: ww, h: wh }, { sw: 0.13, proud: 0.07, sill: false, impost: false }); } finally { P.pop(); N.pop(); }
    }
    revolve(P, M.white, [[R - 0.05, DR], [R + 0.3, DR], [R + 0.3, DR + 0.22], [R + 0.55, DR + 0.28], [R + 0.55, DR + 0.5], [R + 0.35, DR + 0.6]], 36, { uRep: 12, vTile: 3, capTop: M.white });
    const prof = []; for (let i = 0; i <= 10; i++) { const a = Math.PI / 2 * i / 10 * 0.985; prof.push([DP.domeR * 0.985 * Math.cos(a), DC + DP.DOME * Math.sin(a)]); }
    prof[prof.length - 1][0] = 0.02;
    revolve(P, M.dome, prof, 36, { uRep: 12, vTile: 3 });
    // the ring railing on the crown of the dome: a short neck, twelve posts and two rails (as a 12-sided cut-out lattice)
    const yT = DC + DP.DOME - 0.12;
    tube(P, M.dome, 0, 0, yT, yT + 0.35, 1.9, 1.9, 12, 1, 1, { capTop: M.dome });
    for (let i = 0; i < 12; i++) {
      const a0 = i * Math.PI / 6, a1 = (i + 1) * Math.PI / 6, r = 1.9, p = (a, y) => [Math.sin(a) * r, y, Math.cos(a) * r];
      const am = (a0 + a1) / 2;
      Q(P, M.rail, p(a0, yT + 0.35), p(a1, yT + 0.35), p(a1, yT + 1.35), p(a0, yT + 1.35), [Math.sin(am), 0, Math.cos(am)]);
    }
    svc.dachaH = yT + 1.35;
  } finally { P.pop(); N.pop(); }
}
