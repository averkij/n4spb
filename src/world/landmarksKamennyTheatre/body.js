// landmarksKamennyTheatre/body.js - the BODY of the theatre (Shustov 1827, Cavos 1844): the four wall panels with real window openings, the plinth, the entablature round the whole outline, the gable roof with its railing,
// the two pediments (the front one with the relief and the louvred vents, the rear one with the half-round fanlight), the rear doors with their balustraded landings and the canopy over the central door, the downpipes.
// Frame T (frame.js): origin = the OSM centroid, +z = WNW (the portico side).  Photos T01 T02 T04 T06 T07 T11 T12 (dossier 5.3): long walls = 14 bays (tall casement with a half-round fanlight over a hood on the middle
// floor, a small square window on the top floor, a ground window in the plain bays), gables = 7 bays, the ground floor of the rear wall = door, door, window, double door under a canopy, window, door, door.
// Shell (P): walls, roofs, entablature, plinth.  Near detail (N): window surrounds, raking dentils, relief, balusters.
import { T, TP } from './frame.js';
import { onWall, pane, surroundOf, O, DEPTH, atlasPoly } from './util.js';
import { holedWall, Q, archSurround } from './facade.js';
import { band, ringEdges, polyOf } from './kit.js';
import { entabRing, balustrade, rake } from './orders.js';
import { relief } from './relief.js';

export async function build(K) {
  const { ctx, M, P, N, svc } = K;
  const { HW, ZE, ZF, ZP, pitch, bays } = TP;
  const hw = HW + 0.95, ringZ = ZP - 0.95;
  const slope = (TP.ridge - (TP.cornTop + 0.55)) / hw;                       // the raking cornice and the roof slope
  P.push(T.ox, 0, T.oz, T.rot); N.push(T.ox, 0, T.oz, T.rot);

  // ---------------------------------------------------------------------------------------------- long walls
  for (const side of ['+x', '-x']) {
    onWall([P, N], side, (len) => {
      const holes = [], hs = [];
      const covered = (k) => (side === '+x' ? (k >= bays - TP.annexOff - TP.annexBays && k < bays - TP.annexOff) : (k >= TP.annexOff && k < TP.annexOff + TP.annexBays));
      for (let k = 0; k < bays; k++) {
        const cx = (k + 0.5) * pitch;
        const set = [O.tall(cx), O.fan(cx), O.small(cx)];
        if (!covered(k)) set.push(O.ground(cx));
        for (const h of set) { hs.push(h); holes.push(h.arch ? { cx: h.cx, y0: h.y0, w: h.w, h: h.h, arch: true } : h); }
      }
      holedWall(P, M.boards, DEPTH, len - DEPTH, 0, TP.entab, holes, { depth: DEPTH, uvs: 3.2 });
      for (const h of hs) { pane(P, M, h); surroundOf(N, M, h); }
    });
  }

  // ---------------------------------------------------------------------------------------------- rear (ESE) wall
  const RW = 2 * HW / 7;
  const rearGround = [['door', 1.65, 1.1, 2.5], ['door', 1.65, 1.1, 2.5], ['win'], ['big', 2.4, 0.45, 3.1], ['win'], ['door', 1.65, 1.1, 2.5], ['door', 1.65, 1.1, 2.5]];
  onWall([P, N], 'rear', (len) => {
    const holes = [], hs = [];
    for (let j = 0; j < 7; j++) {
      const cx = (j + 0.5) * RW, g = rearGround[j];
      const set = [O.tall(cx), O.fan(cx), O.small(cx), g[0] === 'win' ? O.ground(cx) : O.door(cx, g[1], g[2], g[3])];
      for (const h of set) { hs.push(h); holes.push(h.arch ? { cx: h.cx, y0: h.y0, w: h.w, h: h.h, arch: true } : h); }
    }
    holedWall(P, M.ashlar, 0, len, 0, TP.entab, holes, { depth: DEPTH, uvs: 3.6 });
    for (const h of hs) { pane(P, M, h); surroundOf(N, M, h); }
  });

  // ---------------------------------------------------------------------------------------------- front wall behind the portico (ashlar, three double doors, two plaques)
  onWall([P, N], 'front', (len) => {
    const holes = [], hs = [];
    for (const dx of [-2.75, 0, 2.75]) { const h = { x0: HW + dx - 1.15, x1: HW + dx + 1.15, y0: TP.platH, y1: TP.platH + 3.3, kind: 'door' }; hs.push(h); holes.push(h); }
    holedWall(P, M.ashlar, 0, len, 0, TP.entab, holes, { depth: DEPTH, uvs: 3.6 });
    for (const h of hs) { pane(P, M, h); surroundOf(N, M, h); }
    const plaque = (u, S) => Q(P, S, [u - 0.25, 2.45, 0.03], [u + 0.25, 2.45, 0.03], [u + 0.25, 3.1, 0.03], [u - 0.25, 3.1, 0.03], [0, 0, 1]);
    // the two plaques between the doors and the outer columns are reserved in the facade label registry (0.5 x 0.65 m, y 2.45 .. 3.1, 3 cm proud)
    const lab = ctx.services && ctx.services.labels;
    const take = (mx) => { const w = T.W(mx, ZF + 0.03); return !lab || lab.reserve('w39358614', w.x, 2.775, w.z, 0.5, 0.65, Math.sin(T.rot), Math.cos(T.rot), 'plate'); };
    if (take(-5.0)) plaque(HW - 5.0, M.plaqueA);
    if (take(5.0)) plaque(HW + 5.0, M.plaqueB);
    svc.plaques.push({ text: 'Каменноостровский театр', at: T.W(-5.0, ZF + 0.03), rotY: T.face(0, 1) });
  });

  // ---------------------------------------------------------------------------------------------- plinth (granite, 1.1 m) round the walls, the platform replaces it at the portico
  const wallEdges = ringEdges(polyOf([[-HW, ZE], [HW, ZE], [HW, ZF], [-HW, ZF]]));
  band(P, wallEdges, 0, TP.plinth, 0.13, { front: M.granite, top: M.granite }, { draw: (e) => e.n[1] < 0.5, uvs: 1.8 });
  // the basement vents (T06 T07 T11): small dark grilles in the plinth, one per bay of the plain long-wall bays and the rear
  for (const s of [-1, 1]) {
    for (let m = 0; m < bays; m++) {
      if (m >= TP.annexOff && m < TP.annexOff + TP.annexBays) continue;
      const z = ZE + (m + 0.5) * pitch, x = s * (HW + 0.14);
      Q(P, M.grille, [x, 0.3, z + 0.35], [x, 0.3, z - 0.35], [x, 0.7, z - 0.35], [x, 0.7, z + 0.35], [s, 0, 0]);
    }
  }

  // ---------------------------------------------------------------------------------------------- entablature round the whole outline (rear, both long sides, the portico front)
  const ring = ringEdges(polyOf([[-HW, ZE], [HW, ZE], [HW, ringZ], [-HW, ringZ]]));
  entabRing(P, M, ring, TP.entab, {});

  // ---------------------------------------------------------------------------------------------- the two pediments
  const tympanum = (apexLow) => {
    const z = 0.01, pts = [[-hw + 0.02, TP.cornTop - 0.02, z], [hw - 0.02, TP.cornTop - 0.02, z], [0, apexLow, z]];
    P.fan(M.boards, pts, [0, 0, 1], (p) => [p[0] / 3.2, p[1] / 3.2]);
  };
  const apexLow = TP.cornTop + hw * slope + 0.02;
  // front
  P.push(0, 0, ringZ, 0); N.push(0, 0, ringZ, 0);
  tympanum(apexLow);
  rake(P, N, M, hw, TP.cornTop + 0.55, TP.ridge);
  for (const s of [-1, 1]) Q(P, M.ventPink, [s * 3.8 - 0.5, TP.cornTop + 0.25, 0.03], [s * 3.8 + 0.5, TP.cornTop + 0.25, 0.03], [s * 3.8 + 0.5, TP.cornTop + 0.85, 0.03], [s * 3.8 - 0.5, TP.cornTop + 0.85, 0.03], [0, 0, 1]);
  relief(K, 0, TP.cornTop + 0.45, 0.02);
  P.pop(); N.pop();
  // rear (ESE): the half-round fanlight in the middle of the tympanum
  P.push(0, 0, ZE, Math.PI); N.push(0, 0, ZE, Math.PI);
  tympanum(apexLow);
  rake(P, N, M, hw, TP.cornTop + 0.55, TP.ridge);
  {
    const r = 1.45, y0 = TP.cornTop + 0.55, pts = [];
    for (let i = 0; i <= 18; i++) { const a = Math.PI * i / 18; pts.push([Math.cos(a) * r, y0 + Math.sin(a) * r]); }
    atlasPoly(P, M.winFanD, pts, 0.04);
    archSurround(N, M.white, { cx: 0, y0, w: 2 * r, h: r }, { sw: 0.24, proud: 0.1, impost: false, sill: true });
  }
  P.pop(); N.pop();

  // ---------------------------------------------------------------------------------------------- roof: grey standing-seam sheet, ridge along the axis, railing on both eaves
  {
    const yE = TP.cornTop, yR = yE + hw * slope, z0 = ZE, z1 = ringZ, ln = z1 - z0;
    for (const s of [-1, 1]) {
      const sl = Math.hypot(hw, yR - yE);
      P.quad(M.roof, [s * hw, yE, z0], [s * hw, yE, z1], [0, yR, z1], [0, yR, z0], [-s * slope, 1, 0], [[z0 / 1.2, 0], [z1 / 1.2, 0], [z1 / 1.2, sl / 1.2], [z0 / 1.2, sl / 1.2]]);
      const x = s * (HW + 0.35), yb = yE + (hw - Math.abs(x)) * slope;
      for (let a = 0; a < ln - 0.01; a += 3.2) {
        const b = Math.min(ln, a + 3.2);
        Q(P, M.roofRail, [x, yb, z0 + a], [x, yb, z0 + b], [x, yb + 0.8, z0 + b], [x, yb + 0.8, z0 + a], [s, 0, 0], [0, 0, (b - a) / 3.2, 1]);
      }
    }
    P.box(M.grey, -0.22, 0.22, yR - 0.04, yR + 0.2, z0, z1, 'b', 1);
  }

  // ---------------------------------------------------------------------------------------------- rear landings with white balustrades and the canopy over the central door (T06 T07 T12)
  // landings: left (mx 4.5 .. 10.7) and right (mx -10.7 .. -4.6); balustrade along the front, open toward the middle where the three steps go down
  for (const [mx0, mx1, inner] of [[4.55, HW, 'lo'], [-HW, -4.55, 'hi']]) {
    P.box(M.granite, mx0, mx1, 0, TP.plinth, ZE - 1.35, ZE, 'fb', 1.8);
    N.push(0, TP.plinth, ZE, Math.PI);
    balustrade(N, M, -mx1, -mx0, 0, 1.3, { step: 3.0, h: 0.95, noStart: inner === 'hi', noEnd: inner === 'lo' });
    N.pop();
    // the return of the balustrade round the outer corner of the landing
    N.push(inner === 'lo' ? mx1 : mx0, TP.plinth, ZE - 0.65, inner === 'lo' ? Math.PI / 2 : -Math.PI / 2);
    balustrade(N, M, -0.65, 0.65, 0, 0, { step: 1.3, h: 0.95 });
    N.pop();
    // three steps descending toward the middle bay along the wall line
    for (let i = 1; i <= 3; i++) {
      const a = inner === 'lo' ? mx0 - i * 0.4 : mx1, b = inner === 'lo' ? mx0 : mx1 + i * 0.4;
      P.box(M.granite, a, b, 0, TP.plinth - i * 0.28, ZE - 1.35, ZE - 0.2, 'b', 1.8);
    }
  }
  // the canopy over the central door: a grey sheet-metal pitched canopy on two slender posts (T07 T12)
  {
    const cz1 = ZE - 1.6, y0 = 3.9, y1 = 3.45;
    P.quad(M.roof, [-1.9, y0, ZE], [1.9, y0, ZE], [1.9, y1, cz1], [-1.9, y1, cz1], [0, 1, -0.28], [[0, 0], [3.2, 0], [3.2, 1.4], [0, 1.4]]);
    for (const s of [-1, 1]) P.col(M.iron, s * 1.75, ZE - 1.5, 0, y1, 0.05, 0.05, 6);
    P.box(M.iron, -1.9, 1.9, y1 - 0.06, y1, cz1 - 0.04, cz1 + 0.04, '', 1);
  }

  // ---------------------------------------------------------------------------------------------- downpipes (cream-pink) on both long walls: two per side (T04 T01 T02)
  for (const s of [-1, 1]) for (const k of [3, 6]) {
    const z = ZF - k * pitch, x = s * (HW + 0.18);
    P.col(M.pipe, x, z, 0.1, TP.entab - 0.2, 0.08, 0.08, 8);
    P.box(M.pipe, x - 0.1 * s - 0.0, x + 0.1 * s, TP.plinth + 0.0, TP.plinth + 0.02, z - 0.02, z + 0.02, '', 1);
  }

  P.pop(); N.pop();
}
