// landmarksNikolsky/cathedral.js - St Nicholas Naval Cathedral (S. I. Chevakinsky 1753-62) in the model frame (frame.js: local +z = the main WSW facade, x = v).
// Plan: Greek cross, central square 26.2 m, four arms to |25|, every re-entrant corner a double 6 m step (OSM ring of r3290873, dossier 2.2).  Elevation (dossier 3.2): podium 0 - 4.3, giant
// Corinthian order 4.3 - 15.2 (pairs at the arm corners, trios between three window bays, one pair on every 6 m step wall), entablature 15.2 - 16.75, attic with oval windows 16.75 - 19.5,
// upper cornice to 20.1, a low hipped copper roof (distance-field hip), a segmental pediment with a gold ray fan in the middle of every arm, four corner towers (body to 29.5, drum, ribbed gold dome,
// lantern, onion, cross) and the central dome stack (drum 22.2 - 35.7, dome, lantern, onion, cross to ~64 m).
// Photos refs/nikolsky 039 037 001 005 009 031 036 (see the dossier PHOTO TABLE).  Everything is merged by Parts: ~100 k triangles.
import * as THREE from 'three';
import * as L from '../layout.js';
import * as G from './geo.js';
import * as S from './stucco.js';
import { domeStack } from './domes.js';
import { C0, ROT, W, cyl as ccyl, box as cbox } from './frame.js';
import { addPolyColliders } from '../lib/massing.js';

export const A = 13.1, S1 = 19.1, E = 25.0;                      // half arm width, step lines, arm end
export const Y = { pod: 4.3, col0: 0.0, colTop: 15.2, ent: 16.75, attic: 19.5, up: 20.1 };
const R_COL = 0.58;

/** the 20 ring vertices (model x, z) */
export const RING = (() => {
  const pts = [];
  for (let k = 0; k < 4; k++) { const th = k * Math.PI / 2, c = Math.cos(th), s = Math.sin(th); for (const [xa, za] of [[-A, E], [A, E], [A, S1], [S1, S1], [S1, A]]) pts.push([xa * c + za * s, -xa * s + za * c]); }
  return pts;
})();
/** the 4 corner towers: centres in the model frame */
export const TOWERS = [[14.7, 14.7], [14.7, -14.7], [-14.7, 14.7], [-14.7, -14.7]];

const pointInRing = (x, z, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) if ((ring[i][1] > z) !== (ring[j][1] > z) && x < (ring[j][0] - ring[i][0]) * (z - ring[i][1]) / (ring[j][1] - ring[i][1]) + ring[i][0]) c = !c; return c; };
const distSeg = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
const distRing = (x, z, ring) => { let d = 1e9; for (let i = 0; i < ring.length; i++) d = Math.min(d, distSeg(x, z, ring[i], ring[(i + 1) % ring.length])); return d; };

/** push the frame of a wall edge (origin at its left end seen from outside, local +z out) and run fn(len, n) */
function onWall(P, a, b, fn) {
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
  let nx = dz / len, nz = -dx / len;
  const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
  if (nx * mx + nz * mz < 0) { nx = -nx; nz = -nz; }
  const xa = [nz, -nx], fwd = dx * xa[0] + dz * xa[1] > 0, o = fwd ? a : b;
  P.push(o[0], 0, o[1], Math.atan2(nx, nz));
  try { return fn(len, { o, n: [nx, nz], t: xa }); } finally { P.pop(); }
}

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics;
  P.push(C0.x, 0, C0.z, ROT);
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksNikolsky] cathedral/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  stage('walls', () => walls(P, M));
  stage('facades', () => facades(K));
  stage('roof', () => roof(P, M));
  stage('towers', () => towers(K));
  stage('centre', () => centre(K));
  P.pop();
  // colliders: the footprint walls (thin boxes) + pedestals and steps
  stage('colliders', () => {
    const rec = L.buildingById('r3290874');
    if (rec) for (const poly of rec.polys) addPolyColliders(ctx, poly, 0, 45, 1.0);
    for (let i = 0; i < RING.length; i++) {
      const a = RING[i], b = RING[(i + 1) % RING.length];
      onWallCollide(ph, a, b, i);
    }
  });
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ walls
function walls(P, M) {
  const H = Y.up, ring = RING;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n];
    onWall(P, a, b, (len) => {
      // main wall: blue, uv in metres (the toon paint adds the hand-painted variation)
      P.quad(M.blue, [0, 0, 0], [len, 0, 0], [len, H, 0], [0, H, 0], [0, 0, 1], [[0, 0], [len / 3, 0], [len / 3, H / 3], [0, H / 3]]);
      // granite base band (0 - 0.5)
      P.box(M.graniteBase, 0, len, 0, 0.5, 0, 0.2, 'b');
    });
  }
}

/** roof: a distance-field hip.  y = 20.1 + 0.55 * min(d, 4.2) over the footprint, faceted quads; the plateau sits under the drums */
function roof(P, M) {
  const ring = RING, step = 1.0, X0 = -26, Z0 = -26, N = 53;
  const RY = Y.up + 0.05;
  const hAt = (x, z) => (pointInRing(x, z, ring) ? RY + 0.55 * Math.min(distRing(x, z, ring), 4.2) : null);
  const hv = (x, z) => { const h = hAt(x, z); return h === null ? RY : h; };
  for (let iz = 0; iz < N; iz++) for (let ix = 0; ix < N; ix++) {
    const x = X0 + ix * step, z = Z0 + iz * step;
    const cx = x + step / 2, cz = z + step / 2;
    if (!pointInRing(cx, cz, ring)) continue;
    // every corner of the cell must be inside or on the ring (cells straddling an edge are clipped by using the clamped value)
    const y00 = hv(x, z), y10 = hv(x + step, z), y11 = hv(x + step, z + step), y01 = hv(x, z + step);
    const clampIn = (px, pz, y) => (pointInRing(px, pz, ring) ? y : RY);
    P.quad(M.copper, [x, clampIn(x, z, y00), z], [x + step, clampIn(x + step, z, y10), z], [x + step, clampIn(x + step, z + step, y11), z + step], [x, clampIn(x, z + step, y01), z + step], [0, 1, 0], [[x / 2, z / 2], [(x + step) / 2, z / 2], [(x + step) / 2, (z + step) / 2], [x / 2, (z + step) / 2]]);
  }
}

// ------------------------------------------------------------------------------------------------ facades
const PAIR_PITCH = 1.6, TRIO_PITCH = 1.5, COL_Z = 0.92, PED_Z = 1.75;

function pedestal(P, M, cx, w, y1 = Y.pod) {
  P.box(M.white, cx - w / 2, cx + w / 2, 0.0, y1, 0.0, PED_Z, 'b');
  // recessed blue panel on the front
  const pw = w - 1.0, ph = y1 - 1.6;
  P.quad(M.blue, [cx - pw / 2, 0.75, PED_Z + 0.03], [cx + pw / 2, 0.75, PED_Z + 0.03], [cx + pw / 2, 0.75 + ph, PED_Z + 0.03], [cx - pw / 2, 0.75 + ph, PED_Z + 0.03], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  P.box(M.whiteShade, cx - w / 2 - 0.12, cx + w / 2 + 0.12, y1, y1 + 0.18, -0.0, PED_Z + 0.12, 'b');   // cap slab
}
/** the order of one bay group: pedestal + columns + a forward entablature block */
function group(P, M, cx, n, pitch) {
  const w = (n - 1) * pitch + 2.0;
  pedestal(P, M, cx, w);
  S.cluster(P, M, cx, COL_Z, Y.pod + 0.18, Y.colTop, R_COL, n, pitch);
  S.entablature(P, M, cx - w / 2 - 0.3, cx + w / 2 + 0.3, Y.colTop, 2.3, { z0: 0.55 });
}

function endWall(P, M, len, main) {
  const c = len / 2;
  // continuous entablature + attic zone + upper cornice
  S.entablature(P, M, 0, len, Y.colTop, 0.55);
  const upY = Y.ent;
  P.box(M.white, 0, len, Y.attic - 0.05, Y.up, 0, 0.95, 'b');
  S.underside(P, M, 0, len, Y.attic - 0.05, 0.02, 0.95);
  P.box(M.whiteShade, 0, len, 0.5, 0.78, 0, 0.32, 'b');                  // string above the granite base
  // order groups: pairs at +-12, trios at +-4.3
  for (const s of [-1, 1]) { group(P, M, c + s * 12.0, 2, PAIR_PITCH); group(P, M, c + s * 4.3, 3, TRIO_PITCH); }
  // bays: ground windows, balconies, upper windows, oculi
  for (const dx of [-8.3, 0, 8.3]) {
    const cx = c + dx, door = dx === 0 && main;
    // ground window or door
    if (door) {
      S.archGlass(P, M.door, cx, 0.62, 2.3, 4.0, 0.06);
      S.archFrame(P, M.white, cx, 0.62, 2.3, 4.0, 0.28, 0, 0.26);
      S.cartouche(P, M, cx, 4.95, 0.28, 3.0);
      // steps (3 x 0.15 m), granite: the lowest is the longest
      for (let k = 0; k < 3; k++) P.box(M.greyGranite, cx - 1.7, cx + 1.7, 0, 0.15 * (k + 1), 0, 0.6 * (3 - k), 'b');
      doorLantern(P, M, cx, 4.5);
    } else {
      S.archWindow(P, M, cx, 1.55, 1.9, 3.3, { mat: M.winBarred, crest: true });
    }
    // balcony at 7.4
    S.balcony(P, M, cx, 7.4, door ? 3.0 : 2.9);
    // upper window
    S.archWindow(P, M, cx, 8.35, 2.3, 4.6, { mat: M.win36, crest: true, b: 0.34 });
    // oculus in the attic
    S.oculus(P, M, cx, 18.0, 0.95, 0.6, {});
  }
  // attic pilaster blocks above the groups
  for (const s of [-1, 1]) for (const d of [12.0, 4.3]) {
    const cx = c + s * d;
    for (const o of (d === 12.0 ? [0] : [-1.5, 1.5])) {
      P.box(M.white, cx + o - 0.35, cx + o + 0.35, Y.ent, Y.attic - 0.1, 0.0, 0.35, 'b');
      S.putto(P, M, cx + o, Y.attic - 1.0, 0.4, 0.2);
    }
  }
  // the pediment (segmental arch) and the ray fan
  pediment(P, M, c);
}

function pediment(P, M, c) {
  const r = 5.8, y0 = Y.up + 0.15, cy = y0, n = 22;
  const outer = [], inner = [];
  for (let i = 0; i <= n; i++) { const a = Math.PI * i / n; outer.push([c + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  for (let i = n; i >= 0; i--) { const a = Math.PI * i / n; inner.push([c + Math.cos(a) * (r - 1.1), cy + Math.sin(a) * (r - 1.1)]); }
  // ring: outer arc then inner arc reversed
  P.extrude(M.white, G.shapeOf(outer.concat(inner)), 0, 0.7, 1, 4);
  // blue tympanum (half disc), slightly behind the ring face
  const fill = []; for (let i = 0; i <= n; i++) { const a = Math.PI * i / n; fill.push([c + Math.cos(a) * (r - 1.05), cy + Math.sin(a) * (r - 1.05)]); }
  P.face(M.blue, G.shapeOf(fill), 0.2, 3, 4);
  S.cartouche(P, M, c, cy + 1.0, 0.45, 4.2);
  // round window
  P.push(0, 0, 0, 0);
  const cw = 0.9, cyy = cy + 2.7;
  const rs = new THREE.Shape(); rs.absellipse(c, cyy, cw + 0.18, cw + 0.18, 0, Math.PI * 2, false, 0); const hole = new THREE.Path(); hole.absellipse(c, cyy, cw, cw, 0, Math.PI * 2, true, 0); rs.holes.push(hole);
  P.extrude(M.white, rs, 0.2, 0.3, 1, 14);
  const gs = new THREE.Shape(); gs.absellipse(c, cyy, cw, cw, 0, Math.PI * 2, false, 0); const gg = new THREE.ShapeGeometry(gs, 14), ua = gg.attributes.uv, pa = gg.attributes.position;
  for (let i = 0; i < pa.count; i++) ua.setXY(i, (pa.getX(i) - c + cw) / (2 * cw), (pa.getY(i) - cyy + cw) / (2 * cw));
  P.geo(M.win24, gg, 0, 0, 0.21); gg.dispose();
  for (const sx of [-1, 1]) S.putto(P, M, c + sx * 2.0, cyy - 0.3, 0.5, 0.26);
  P.pop();
  // the gilded ray fan behind the upper edge
  S.rayFan(P, M, c, cy + 0.2, 0.38, r + 0.4, r + 3.0, 0.12, Math.PI - 0.12, 25, 0.11);
}

function doorLantern(P, M, cx, y) {
  P.box(M.iron, cx - 0.015, cx + 0.015, y, y + 0.6, 0.55, 0.58, '');
  P.box(M.lampGlass, cx - 0.2, cx + 0.2, y - 0.62, y - 0.02, 0.52, 0.92, '');
  P.box(M.iron, cx - 0.24, cx + 0.24, y - 0.02, y + 0.05, 0.5, 0.95, '');
}

function stepWall(P, M, len) {
  const c = len / 2, dy = 0.035;                                         // the step walls' cornices sit 3.5 cm higher than the arm walls': where two projecting runs overlap at a corner their tops never share a plane
  S.entablature(P, M, 0, len, Y.colTop + dy, 0.55);
  P.box(M.white, 0, len, Y.attic - 0.05 + dy, Y.up + dy, 0, 0.95, 'b');
  S.underside(P, M, 0, len, Y.attic - 0.05 + dy, 0.02, 0.95);
  P.box(M.whiteShade, 0, len, 0.5, 0.78, 0, 0.32, 'b');
  group(P, M, c, 2, PAIR_PITCH);
  // a blue panel with white frame in the podium zone each side of the pedestal, and a small arched blind window in the upper zone
  const side = (len - (PAIR_PITCH + 2.0)) / 2;
  if (side > 0.9) for (const sx of [-1, 1]) {
    const cx = c + sx * (len / 2 - side / 2);
    S.archWindow(P, M, cx, 1.9, Math.min(0.9, side - 0.7), 3.0, { mat: M.winBarred, sill: true, b: 0.18 });
    S.archWindow(P, M, cx, 8.3, Math.min(0.95, side - 0.7), 4.2, { mat: M.win12, sill: true, b: 0.18 });
  }
}

function facades(K) {
  const P = K.P, M = K.M, n = RING.length;
  for (let i = 0; i < n; i++) {
    const a = RING[i], b = RING[(i + 1) % n];
    onWall(P, a, b, (len) => { if (i % 5 === 0) endWall(P, M, len, i === 0); else stepWall(P, M, len); });
  }
  // downpipes at the re-entrant corners (pale blue-grey)
  for (let i = 0; i < n; i++) if (i % 5 === 2 || i % 5 === 4) { const p = RING[i]; P.col(M.pipe, p[0], p[1], 0.3, Y.up - 0.5, 0.07, 0.07, 6, false); }
}

// ------------------------------------------------------------------------------------------------ the four corner towers
function towers(K) {
  const P = K.P, M = K.M, hw = 4.9, y0 = 16.0, yc = 28.4, yTop = 29.6;
  for (const [cx, cz] of TOWERS) {
    const sx = Math.sign(cx), sz = Math.sign(cz);
    // body: four faces, blue
    for (const [fx, fz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      P.push(cx + fx * hw, 0, cz + fz * hw, Math.atan2(fx, fz));
      // local x = (fz, -fx)... left end seen from outside at -hw: draw with a symmetric span -hw..hw
      P.quad(M.blue, [-hw, y0, 0], [hw, y0, 0], [hw, yTop, 0], [-hw, yTop, 0], [0, 0, 1], [[0, 0], [hw * 2 / 3, 0], [hw * 2 / 3, (yTop - y0) / 3], [0, (yTop - y0) / 3]]);
      // big arched window with a rocaille crest and a gilded sunburst
      S.archWindow(P, M, 0, 19.8, 2.5, 5.6, { mat: M.win35, crest: true, b: 0.4 });
      S.rayFan(P, M, 0, 27.6, 0.3, 1.4, 2.4, 0.4, Math.PI - 0.4, 9, 0.07);
      // pilaster strips either side of the window, with capitals
      for (const s of [-1, 1]) P.box(M.whiteShade, s * 2.5 - 0.22, s * 2.5 + 0.22, y0, yc - 0.9, 0, 0.28, 'b');
      P.pop();
    }
    // triple-column clusters on the four corners (L-shaped: the middle one on the corner)
    for (const [ax, az] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const px = cx + ax * (hw + 0.28), pz = cz + az * (hw + 0.28);
      for (const [dx, dz] of [[0, 0], [-ax * 0.82, 0], [0, -az * 0.82]]) {
        const x = px + dx, z = pz + dz;
        S.column(P, M, x, z, y0 + 2.2, yc, 0.34, { putti: false });
      }
    }
    // cornice ring with corner breaks
    const pr = 0.85;
    for (const [fx, fz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      P.push(cx + fx * hw, 0, cz + fz * hw, Math.atan2(fx, fz));
      S.entablature(P, M, -hw - 1.0, hw + 1.0, yc, pr, { hA: 0.4, hF: 0.4, hC: 0.45 });
      P.pop();
    }
    // foot consoles (big white scrolls) under the outer corner of the tower
    for (const [ax, az] of [[sx, sz]]) {
      P.push(cx + ax * hw, 0, cz + az * hw, Math.atan2(ax, 0));
      S.volute(P, M.white, 0, 15.5, 0.6, 1.1, 0.4, Math.PI * 1.5, 1.6);
      P.pop();
    }
    P.cap(M.white, [[cx - hw - 0.85, cz - hw - 0.85], [cx + hw + 0.85, cz - hw - 0.85], [cx + hw + 0.85, cz + hw + 0.85], [cx - hw - 0.85, cz + hw + 0.85]], yTop + 0.02, true, 3);
    domeStack(P, M, cx, cz, { y0: yTop, drumH: 2.4, drumR: 4.7, domeR: 4.4, domeH: 3.6, lanR: 1.3, lanH: 3.0, onionR: 1.45, cross: 3.4 });
  }
}

// ------------------------------------------------------------------------------------------------ the central dome stack
function centre(K) {
  const P = K.P, M = K.M;
  const r = domeStack(P, M, 0, 0, { y0: 22.2, drumH: 13.5, drumR: 7.2, domeR: 6.8, domeH: 5.6, lanR: 1.95, lanH: 5.2, onionR: 2.4, cross: 9.5 });
  K.svc.cathedral = { centre: [C0.x, C0.z], heights: r };
}

// ------------------------------------------------------------------------------------------------ colliders
/** boxes for the pedestals of the order (they stand 1.75 m in front of the wall): the player must not walk through the columns */
function onWallCollide(ph, a, b, i) {
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
  let nx = dz / len, nz = -dx / len; const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2; if (nx * mx + nz * mz < 0) { nx = -nx; nz = -nz; }
  const tx = nz, tz = -nx, fwd = dx * tx + dz * tz > 0, o = fwd ? a : b, c = len / 2;
  const list = i % 5 === 0 ? [[c - 12, 3.6], [c + 12, 3.6], [c - 4.3, 5.0], [c + 4.3, 5.0]] : [[c, 3.6]];
  for (const [u, w] of list) {
    const px = o[0] + tx * u + nx * PED_Z / 2, pz = o[1] + tz * u + nz * PED_Z / 2, alongX = Math.abs(tx) > 0.5;
    cbox(ph, px, pz, alongX ? w : PED_Z, alongX ? PED_Z : w, 0, 0, 6);
  }
}
