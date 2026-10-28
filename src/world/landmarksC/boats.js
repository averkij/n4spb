// landmarksC/boats.js - the tourist boats of the Fontanka and their landing stages (docs/research/fontanka.md section G, photos refs/fontanka 16 17 18 19 36 42 43 44 46 47).
// BOATS: glass-roofed "river trams" (white hull with a blue / red stripe, flat oval roof with dark glass panels and blue patches, an open stern deck with benches and orange life
// buoys, 24 x 4.4 m, 2.95 m above the water < the 3.4 m of the bridge) and vintage-style boats (dark red or navy hull, cream cabin, 18 x 4 m).  No flags (user rule).
// MOTION: five boats cruise a race-track loop on the river: the north-bound lane runs through the east arch of the Anichkov Bridge, the south-bound lane through the west arch (the
// lanes are +-16.15 m from the river centre line = the arch centres, the only place with 3.4 m clearance for a 4.4 m wide boat), half circles of R 16.15 turn them round at both
// ends (z -330 and z +120).  Position, heading and bobbing are PURE FUNCTIONS of t (no state): state(t) is published for the other modules.
// WAKE: a V of white foam behind every moving boat (decal, no outline), a foam fringe along the waterline.
// PIERS: a steel pontoon 15 x 3 m (green canopy kiosk, white railing with orange life buoys, benches) beside every stair flight of environment's quay (`quay.stairs`), with one boat moored
// along its outer side, bow up the stream.  COLLIDERS (docs/water-transport-boat-collisions.md): every boat, moving or moored, is a kinematic solid hull box (lib/craft-solids.js: the pose is the same pure function of t
// that poses the mesh) and every pontoon is a float block (a boat cannot ride over it; the walker's deck floor is environment/quay.js).
import * as THREE from 'three';
import * as L from '../layout.js';
import { Parts } from './kit.js';
import { toWorld } from './frame.js';
import { batchGroup } from '../../core/batch2.js';
import { craftSolids, addFloatBlock } from '../lib/craft-solids.js';

const WATER = L.RIVER_Y.water;
const LANE = 16.15;
// centre line of the water, north -> south (research table + the bridge axis): the loop uses z from -330 to +120
const CENTRE = [[-395, -330], [-412, -240], [-428, -150], [0, -130], [0, -92], [0, -53], [-464, -30], [-487, 30], [-510, 90], [-531, 120]];

// ------------------------------------------------------------------------------------------------ the lane (pure functions of the arclength)
function makeLoop() {
  const c = CENTRE.map((p, i) => (p[0] === 0 ? null : p));
  const b0 = toWorld(0, -38.8), b1 = toWorld(0, -0.0), b2 = toWorld(0, 38.8);
  c[3] = [b0.x, b0.z]; c[4] = [b1.x, b1.z]; c[5] = [b2.x, b2.z];
  // Catmull-Rom resampling every ~4 m, from the SOUTH end (a = 0) to the NORTH end
  const pts = c.slice().reverse(), S = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)], n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 4));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      S.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  S.push(pts[pts.length - 1].slice());
  const A = [0]; for (let i = 1; i < S.length; i++) A.push(A[i - 1] + Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]));
  const Lr = A[A.length - 1];
  const at = (a) => {                                               // centre point, northward tangent t and east normal e at arclength a (from the south end)
    a = Math.max(0, Math.min(Lr, a)); let i = 1; while (i < A.length - 1 && A[i] < a) i++;
    const u = (a - A[i - 1]) / (A[i] - A[i - 1] || 1), x = S[i - 1][0] + (S[i][0] - S[i - 1][0]) * u, z = S[i - 1][1] + (S[i][1] - S[i - 1][1]) * u;
    let tx = S[Math.min(S.length - 1, i + 1)][0] - S[Math.max(0, i - 2)][0], tz = S[Math.min(S.length - 1, i + 1)][1] - S[Math.max(0, i - 2)][1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    return { x, z, tx, tz, ex: -tz, ez: tx };
  };
  const R = LANE, total = 2 * Lr + 2 * Math.PI * R;
  /** position / heading on the loop at distance s (wraps); heading = unit direction of travel */
  const state = (s) => {
    s = ((s % total) + total) % total;
    if (s < Lr) { const p = at(s); return { x: p.x + p.ex * R, z: p.z + p.ez * R, hx: p.tx, hz: p.tz }; }
    s -= Lr;
    if (s < Math.PI * R) { const p = at(Lr), th = s / R, c = Math.cos(th), sn = Math.sin(th); return { x: p.x + R * (c * p.ex + sn * p.tx), z: p.z + R * (c * p.ez + sn * p.tz), hx: -sn * p.ex + c * p.tx, hz: -sn * p.ez + c * p.tz }; }
    s -= Math.PI * R;
    if (s < Lr) { const p = at(Lr - s); return { x: p.x - p.ex * R, z: p.z - p.ez * R, hx: -p.tx, hz: -p.tz }; }
    s -= Lr;
    const p = at(0), th = s / R, c = Math.cos(th), sn = Math.sin(th);
    return { x: p.x + R * (-c * p.ex - sn * p.tx), z: p.z + R * (-c * p.ez - sn * p.tz), hx: sn * p.ex - c * p.tx, hz: sn * p.ez - c * p.tz };
  };
  return { state, total, Lr, at };
}

// ------------------------------------------------------------------------------------------------ boat geometry
/** plan outline of a boat: points [lateral x, forward f]; rounded bow (bowL long), stern radius sr */
function plan(Ln, B, bowL, sr = 0.5, scale = 1) {
  const hl = Ln / 2, hb = B / 2, pts = [];
  const arc = (cx, cf, rx, rf, a0, a1, n) => { for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + Math.cos(a) * rx, cf + Math.sin(a) * rf]); } };
  arc(hb - sr, -hl + sr, sr, sr, -Math.PI / 2, 0, 3);                                           // stern, starboard corner
  const nb = 10; for (let i = 0; i <= nb; i++) { const a = i / nb * Math.PI / 2; pts.push([hb * Math.cos(a) * (1 - 0.0) , hl - bowL + Math.sin(a) * bowL * 0.98]); }
  for (let i = nb - 1; i >= 0; i--) { const a = i / nb * Math.PI / 2; pts.push([-hb * Math.cos(a), hl - bowL + Math.sin(a) * bowL * 0.98]); }
  arc(-hb + sr, -hl + sr, sr, sr, Math.PI, Math.PI * 1.5, 3);
  return pts.map((p) => [p[0] * scale, p[1] * scale]);
}
function extruded(pts, y0, y1) {                                                               // plan prism from y0 up to y1 (pts: [x, f])
  const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));
  const g = new THREE.ExtrudeGeometry(sh, { depth: y1 - y0, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(Math.PI / 2); g.translate(0, y1, 0); return g;
}
function flat(pts, y, uvFn) {                                                                  // plan polygon facing up at height y with planar uv
  const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], -p[1])));
  const g = new THREE.ShapeGeometry(sh, 1); g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
  const pa = g.attributes.position, ua = g.attributes.uv;
  for (let i = 0; i < pa.count; i++) { const t = uvFn(pa.getX(i), pa.getZ(i)); ua.setXY(i, t[0], t[1]); }
  return g;
}

function boatMats(ctx, spec) {
  const T = ctx.mat.toon, tex = ctx.tex, key = spec.key;
  const roofTex = tex.draw(256, 512, (g, w, h) => {
    g.fillStyle = spec.roof; g.fillRect(0, 0, w, h);
    if (spec.glassRoof) {
      g.fillStyle = spec.patch; g.beginPath(); g.ellipse(w / 2, h * 0.88, w * 0.36, h * 0.07, 0, 0, 6.3); g.fill(); g.beginPath(); g.ellipse(w / 2, h * 0.5, w * 0.4, h * 0.08, 0, 0, 6.3); g.fill();
      for (let i = 0; i < 7; i++) { const y = h * (0.1 + i * 0.1); const gr = g.createLinearGradient(0, y, 0, y + h * 0.075); gr.addColorStop(0, '#3c4a5c'); gr.addColorStop(1, '#1d2733'); g.fillStyle = gr; g.fillRect(w * 0.16, y, w * 0.68, h * 0.075); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(w * 0.16, y, w * 0.68, 3); }
    } else { g.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 1; i < 10; i++) g.fillRect(0, i * h / 10, w, 2); }
  }, { key: `lmC-boat-roof-${key}`, repeat: [1, 1] });
  const winTex = tex.draw(512, 64, (g, w, h) => {
    g.fillStyle = '#1c2530'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) { const x = i * 64; const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5b7186'); gr.addColorStop(0.55, '#2a3948'); gr.addColorStop(1, '#161d26'); g.fillStyle = gr; g.fillRect(x + 3, 4, 58, h - 8); g.fillStyle = 'rgba(255,255,255,0.14)'; g.beginPath(); g.moveTo(x + 10, h - 4); g.lineTo(x + 30, 4); g.lineTo(x + 40, 4); g.lineTo(x + 20, h - 4); g.fill(); g.fillStyle = 'rgba(190,150,110,0.35)'; g.fillRect(x + 8, h * 0.55, 20, h * 0.4); g.fillRect(x + 36, h * 0.6, 18, h * 0.35); }
    g.fillStyle = spec.cabin; for (let i = 0; i <= 8; i++) g.fillRect(i * 64 - 2, 0, 4, h);
  }, { key: `lmC-boat-win-${key}`, repeat: [1, 1] });
  return {
    hullLow: T(spec.low, { paint: 0.03, name: `lmC-boat-low-${key}` }), hull: T(spec.hull, { paint: 0.03, name: `lmC-boat-hull-${key}` }), stripe: T(spec.stripe, { paint: 0.02, name: `lmC-boat-stripe-${key}` }),
    stripe2: T(spec.stripe2 || spec.stripe, { paint: 0.02, name: `lmC-boat-stripe2-${key}` }),
    deck: T(spec.deck, { paint: 0.04, name: `lmC-boat-deck-${key}` }), cabin: T(spec.cabin, { paint: 0.03, name: `lmC-boat-cabin-${key}` }), roof: T('#ffffff', { map: roofTex, paint: 0.03, name: `lmC-boat-roof-${key}` }),
    roofSide: T(spec.roof, { paint: 0.03, name: `lmC-boat-roofside-${key}` }), win: T('#ffffff', { map: winTex, paint: 0.02, name: `lmC-boat-win-${key}` }),
    rail: T('#f2f2ee', { paint: 0.02, name: 'lmC-boat-rail' }), bench: T('#3f6fa8', { paint: 0.03, name: 'lmC-boat-bench' }), buoy: T('#e8692a', { paint: 0.03, name: 'lmC-boat-buoy' }),
    rubber: T('#1b1d1e', { paint: 0.02, name: 'lmC-boat-rubber' }), brass: T('#c9a24b', { paint: 0.03, name: 'lmC-boat-brass' }), dark: T('#2a2f36', { paint: 0.02, name: 'lmC-boat-dark' }),
  };
}

/** one boat model (forward +z, y = 0 at the water): spec { Ln, B, bowL, free (freeboard), cabinH, aft (open stern deck length), ... } */
function boatModel(ctx, spec) {
  const m = boatMats(ctx, spec), P = new Parts();
  const { Ln, B, bowL } = spec, hl = Ln / 2, fb = spec.free, ch = spec.cabinH, aft = spec.aft, z0 = -hl + aft, cz1 = hl - spec.fore;
  const out = plan(Ln, B, bowL, 0.5), sc = (k) => plan(Ln, B, bowL, 0.5, k);
  P.geo(m.hullLow, extruded(out, -0.12, 0.3));
  P.geo(m.hull, extruded(sc(1.0), 0.3, fb - 0.16)); P.geo(m.stripe, extruded(sc(1.004), fb - 0.16, fb));
  P.geo(m.stripe2, extruded(sc(1.006), fb - 0.3, fb - 0.16));
  P.geo(m.deck, flat(sc(0.985), fb + 0.015, () => [0, 0]));
  // fenders: black rubber blocks along the hull
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const z = -hl + 2.5 + i * (Ln - 7) / 5; P.box(m.rubber, s * (B / 2) - (s > 0 ? 0.02 : 0.2), s * (B / 2) + (s > 0 ? 0.2 : 0.02), 0.45, 0.95, z - 0.18, z + 0.18, ''); }
  // cabin: walls with the window band, pillars, roof
  const cw = B - 0.5, y0 = fb + 0.02, y1 = fb + ch;
  for (const s of [-1, 1]) {
    const x = s * cw / 2, len = cz1 - z0;
    P.quad(m.win, [x, y0 + 0.5, z0], [x, y0 + 0.5, cz1], [x, y1 - 0.15, cz1], [x, y1 - 0.15, z0], [s, 0, 0], [[0, 0], [len / 5, 0], [len / 5, 1], [0, 1]]);
    P.quad(m.cabin, [x, y0, z0], [x, y0, cz1], [x, y0 + 0.5, cz1], [x, y0 + 0.5, z0], [s, 0, 0]);
  }
  P.quad(m.win, [-cw / 2, y0 + 0.5, cz1], [cw / 2, y0 + 0.5, cz1], [cw / 2, y1 - 0.15, cz1], [-cw / 2, y1 - 0.15, cz1], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  P.quad(m.cabin, [-cw / 2, y0, cz1], [cw / 2, y0, cz1], [cw / 2, y0 + 0.5, cz1], [-cw / 2, y0 + 0.5, cz1], [0, 0, 1]);
  P.quad(m.cabin, [cw / 2, y0, z0], [-cw / 2, y0, z0], [-cw / 2, y1, z0], [cw / 2, y1, z0], [0, 0, -1]);          // the aft bulkhead of the cabin
  P.box(m.dark, -cw / 2 + 0.2, cw / 2 - 0.2, y0, y1, z0 + 0.05, cz1 - 0.05, 'ft');                               // dim interior behind the glass
  // roof: a prism over the cabin (oval front), its top with the glass-panel texture
  const rz1 = hl - 0.9, rl = rz1 - (z0 - 0.5), roofPts = plan(rl, B, Math.min(bowL * 0.95, rl * 0.6), 0.4).map((p) => [p[0], p[1] + (z0 - 0.5 + rl / 2)]);
  P.geo(m.roofSide, extruded(roofPts, y1, y1 + 0.14));
  P.geo(m.roof, flat(roofPts, y1 + 0.145, (x, z) => [x / B + 0.5, (z - (z0 - 0.5)) / rl]));
  // open stern deck: benches, rail and life buoys
  if (aft > 0.5) {
    for (const s of [-1, 1]) { P.box(m.bench, s * (B / 2 - 0.55) - 0.25, s * (B / 2 - 0.55) + 0.25, fb + 0.02, fb + 0.45, -hl + 0.6, z0 - 0.5, ''); P.box(m.bench, s * (B / 2 - 0.55) - 0.25 + (s > 0 ? 0.3 : -0.1), s * (B / 2 - 0.55) + 0.25 + (s > 0 ? 0.0 : -0.4), fb + 0.45, fb + 0.9, -hl + 0.6, z0 - 0.5, ''); }
    P.box(m.bench, -B / 2 + 0.6, B / 2 - 0.6, fb + 0.02, fb + 0.45, -hl + 0.5, -hl + 1.0, '');
  }
  // white railing around the open decks (stern and the foredeck)
  const rail = (a, b, h = 0.95) => { P.cyl(m.rail, [a[0], fb + h, a[1]], [b[0], fb + h, b[1]], 0.025, 0.025, 4, false); const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.5)); for (let i = 0; i <= n; i++) { const t = i / n; const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; P.cyl(m.rail, [x, fb, z], [x, fb + h, z], 0.022, 0.022, 4, false); } };
  const hb = B / 2 - 0.12;
  rail([-hb, -hl + 0.4], [hb, -hl + 0.4]); rail([-hb, -hl + 0.4], [-hb, z0 - 0.5]); rail([hb, -hl + 0.4], [hb, z0 - 0.5]);
  if (spec.fore > 1.5) { rail([-hb, cz1 + 0.2], [-hb * 0.8, hl - bowL * 0.55], 0.8); rail([hb, cz1 + 0.2], [hb * 0.8, hl - bowL * 0.55], 0.8); }
  for (const [x, z] of [[hb + 0.05, -hl + 2.5], [-hb - 0.05, -hl + 3.2]]) P.cyl(m.buoy, [x, fb + 0.45, z - 0.15], [x, fb + 0.45, z + 0.15], 0.28, 0.28, 10, true);
  if (spec.brass) { P.box(m.brass, -cw / 2 - 0.04, cw / 2 + 0.04, y1 - 0.2, y1 - 0.12, z0 - 0.02, cz1 + 0.04, 'b'); }
  P.box(m.stripe2, -0.5, 0.5, y1 + 0.145, y1 + 0.5, cz1 - 1.0, cz1 - 0.95, '');                                    // (a small bow screen above the wheelhouse, kept flat and plain)
  const g = new THREE.Group(); P.build(g, { cast: true });
  // foam fringe on the waterline
  return g;
}

// ------------------------------------------------------------------------------------------------ wake
function wakeTexture(ctx) {
  return ctx.tex.draw(256, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
      const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.strokeStyle = gr; g.lineWidth = 14 - k * 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(w / 2 + s * (20 + k * 18), h - 6); g.quadraticCurveTo(w / 2 + s * (60 + k * 30), h * 0.55, w / 2 + s * (112 - k * 6), 8); g.stroke();
    }
    const gr2 = g.createLinearGradient(0, h, 0, 0); gr2.addColorStop(0, 'rgba(255,255,255,0.75)'); gr2.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr2; g.beginPath(); g.moveTo(w / 2 - 34, h); g.lineTo(w / 2 + 34, h); g.lineTo(w / 2 + 6, h * 0.1); g.lineTo(w / 2 - 6, h * 0.1); g.closePath(); g.fill();
    for (let i = 0; i < 70; i++) { const y = h * Math.pow((i * 0.6180339) % 1, 1.4), x = w / 2 + (((i * 0.7548776) % 1) - 0.5) * (30 + (h - y) * 0.2); g.fillStyle = `rgba(255,255,255,${0.35 * (y / h)})`; g.beginPath(); g.arc(x, h - y, 2 + (i % 4), 0, 6.3); g.fill(); }
  }, { key: 'lmC-wake', repeat: [1, 1] });
}

const SPECS = {
  tramA: { key: 'tramA', Ln: 24, B: 4.4, bowL: 7.5, free: 0.95, cabinH: 1.95, aft: 6.0, fore: 2.6, hull: '#f3f3ee', low: '#8e9aa6', stripe: '#1c47a0', stripe2: '#c4302b', deck: '#9fb0c4', cabin: '#f1f1ec', roof: '#f3f3ee', patch: '#3a6fc0', glassRoof: true },
  tramB: { key: 'tramB', Ln: 22, B: 4.2, bowL: 7.0, free: 0.95, cabinH: 1.95, aft: 5.0, fore: 2.4, hull: '#f1f1ec', low: '#7e8996', stripe: '#c4302b', stripe2: '#1c47a0', deck: '#9aa3ad', cabin: '#ececE6', roof: '#f1f1ec', patch: '#c4302b', glassRoof: true },
  vintageRed: { key: 'vintageRed', Ln: 18, B: 4.0, bowL: 5.5, free: 1.0, cabinH: 1.85, aft: 3.5, fore: 2.0, hull: '#9b1c2c', low: '#4a1018', stripe: '#d6b25a', deck: '#8a7358', cabin: '#efe3c0', roof: '#efe3c0', patch: '#efe3c0', glassRoof: false, brass: true },
  vintageNavy: { key: 'vintageNavy', Ln: 17, B: 3.9, bowL: 5.2, free: 1.0, cabinH: 1.85, aft: 3.2, fore: 2.0, hull: '#1c2c4c', low: '#10182c', stripe: '#f1f1ec', deck: '#8a7358', cabin: '#f1f1ec', roof: '#f1f1ec', patch: '#f1f1ec', glassRoof: false, brass: true },
};

// ------------------------------------------------------------------------------------------------ pier (pontoon with kiosk)
function buildPier(ctx, K, quayStair, idx) {
  const T = ctx.mat.toon, P = new Parts();
  const steel = T('#3b4d63', { paint: 0.03, name: 'lmC-pier-steel' }), deck = T('#8a8478', { paint: 0.05, name: 'lmC-pier-deck' }), white = T('#f2f2ee', { paint: 0.02, name: 'lmC-pier-rail' });
  const green = T('#3c6a5a', { paint: 0.03, name: 'lmC-pier-canopy' }), wood = T('#7a5a3c', { paint: 0.04, name: 'lmC-pier-bench' }), buoy = T('#e8692a', { paint: 0.03, name: 'lmC-pier-buoy' }), kiosk = T('#d8d4c8', { paint: 0.03, name: 'lmC-pier-kiosk' });
  const win = ctx.mat.glass ? T('#2a3948', { paint: 0.02, name: 'lmC-pier-glass' }) : T('#2a3948');
  // frame: local +x = along the descent direction (tx, tz), local +z = toward the water (-n)
  const len = 15, wid = 3.0, top = -2.72;
  P.box(steel, 0, len, WATER - 0.4, top - 0.06, 0.05, 0.05 + wid, '');
  P.box(deck, 0.05, len - 0.05, top - 0.06, top, 0.1, wid, 'b');
  // railing on the outer (water) side and the far end, orange life buoys, benches, kiosk with a green canopy
  const rz = wid - 0.04;
  P.box(white, 0.05, len - 0.05, top + 0.93, top + 0.99, rz - 0.03, rz + 0.03, '');
  for (let i = 0; i <= 14; i++) P.box(white, 1 + i - 0.03, 1 + i + 0.03, top, top + 0.95, rz - 0.03, rz + 0.03, 'tb');
  P.box(white, len - 0.08, len - 0.02, top + 0.9, top + 0.96, 0.1, rz, ''); for (const z of [0.5, 1.5, 2.5]) P.box(white, len - 0.06, len - 0.02, top, top + 0.95, z - 0.03, z + 0.03, 'tb');
  for (const x of [5, 9, 13]) P.cyl(buoy, [x, top + 0.55, rz - 0.07], [x, top + 0.55, rz - 0.02], 0.26, 0.26, 10, true);
  for (const x of [11, 13]) { P.box(wood, x - 0.7, x + 0.7, top + 0.02, top + 0.45, 0.3, 0.75, ''); P.box(wood, x - 0.7, x + 0.7, top + 0.45, top + 0.9, 0.3, 0.38, ''); }
  P.box(kiosk, 1.4, 6.2, top, top + 2.35, 0.2, 2.4, 'b'); P.box(win, 1.4, 6.2, top + 0.9, top + 2.0, 2.38, 2.42, 'bt');
  P.quad(green, [1.0, top + 2.35, 0.1], [6.6, top + 2.35, 0.1], [6.6, top + 2.75, 2.9], [1.0, top + 2.75, 2.9], [0, 0.9, 0.35]);
  P.quad(green, [1.0, top + 2.35, 2.9], [6.6, top + 2.35, 2.9], [6.6, top + 2.75, 2.9], [1.0, top + 2.75, 2.9], [0, 0, 1]);
  const g = new THREE.Group(); P.build(g);
  const s = quayStair, tx = s.tx, tz = s.tz, nx = s.nx, nz = s.nz, along = 9.0;                // start behind the lower landing of the stair
  // basis: local x -> (tx, tz), local z must point to the water (-n): rotation.y = atan2(-tz, tx) sends local z to (-tz, tx); mirror z when that is the landward side
  g.position.set(s.x + tx * along, 0, s.z + tz * along);
  g.rotation.y = Math.atan2(-tz, tx);
  if ((-tz) * (-nx) + tx * (-nz) < 0) g.scale.z = -1;
  g.updateMatrixWorld(true);
  // mooring: the boat lies along the outer side, heading up the stream
  const w = (lx, lz) => new THREE.Vector3(lx, 0, lz).applyMatrix4(g.matrixWorld);
  const mid = w(len / 2 + 0.5, wid + 2.45), nxt = w(len / 2 + 0.5 + 1, wid + 2.45);
  let hx = nxt.x - mid.x, hz = nxt.z - mid.z; if (hz > 0) { hx = -hx; hz = -hz; }
  return { group: g, x: mid.x, z: mid.z, hx, hz, idx, centre: w(len / 2, wid / 2), len, wid, rot: g.rotation.y };
}

// ------------------------------------------------------------------------------------------------ build
export function buildBoats(K, M, ctx) {
  const T = ctx.THREE || THREE;
  const loop = makeLoop();
  const models = {}; for (const k of Object.keys(SPECS)) { models[k] = boatModel(ctx, SPECS[k]); try { batchGroup(models[k], ctx.mat); } catch (e) { console.warn('[landmarksC] boat batching', e && e.message); } }      // ~20 meshes per boat -> a few (colours baked to vertices)
  const wakeMat = ctx.mat.emissive('#eef6fa', 1.0, { map: wakeTexture(ctx), transparent: true, opacity: 0.85, depthWrite: false });
  wakeMat.polygonOffset = true; wakeMat.polygonOffsetFactor = -3; wakeMat.polygonOffsetUnits = -6;
  const foamMat = ctx.mat.emissive('#e8f2f6', 1.0, { transparent: true, opacity: 0.45, depthWrite: false });
  foamMat.polygonOffset = true; foamMat.polygonOffsetFactor = -2; foamMat.polygonOffsetUnits = -4;
  const rootB = new T.Group(); rootB.name = 'landmarksC-boats';
  const wrap = (kind, withWake) => {
    const grp = new T.Group(), spec = SPECS[kind], inner = models[kind].clone(true);
    grp.add(inner);
    const fr = plan(spec.Ln, spec.B, spec.bowL, 0.5, 1.07).map((p) => new T.Vector2(p[0], -p[1]));
    const fg = new T.ShapeGeometry(new T.Shape(fr), 1); fg.rotateX(-Math.PI / 2); fg.translate(0, 0.02, 0);
    const foam = new T.Mesh(fg, foamMat); foam.renderOrder = 2; ctx.noOutline(foam); grp.add(foam);
    if (withWake) { const wg = new T.PlaneGeometry(13, 24); wg.rotateX(-Math.PI / 2); wg.translate(0, 0.04, -spec.Ln / 2 - 11.2); const wake = new T.Mesh(wg, wakeMat); wake.renderOrder = 2; ctx.noOutline(wake); grp.add(wake); }
    grp.userData.noWater = true; return grp;
  };
  // ---- moving boats on the loop
  const FLEET = [['tramA', 0.0], ['vintageRed', 0.2], ['tramB', 0.4], ['vintageNavy', 0.6], ['tramA', 0.8]];
  const speed = 3.0, boats = [], moored = [], BOAT_FAR = 900, BOAT_FAR2 = BOAT_FAR * BOAT_FAR; let mooredTick = 0;      // (round 3, 2026-10-15: a boat is ~17 draws; beyond BOAT_FAR m of the camera the group hides: 85-133 boat calls at 0.8-3 km from Nevsky)
  FLEET.forEach(([kind, ph], i) => {
    const g = wrap(kind, true); g.name = `boat-${i}-${kind}`; g.position.set(0, WATER, 0); rootB.add(g);
    boats.push({ id: i, kind, ph, g, s0: ph * loop.total, bob: i * 1.7 });
  });
  const stateOf = (b, t) => { const st = loop.state(b.s0 + speed * t); return st; };
  const craft = craftSolids(ctx), hullOf = (kind) => { const sp = SPECS[kind]; return { w: sp.B, d: sp.Ln, h: sp.free + sp.cabinH + 0.2 }; };      // the hull box: beam x length (the long axis is the local z), up to the roof (the bow screen is 0.5 m over it, thin)
  for (const b of boats) craft.add({ id: 'c-' + b.id, kind: b.kind, key: 'fontanka', y: WATER, ...hullOf(b.kind), moving: true, speed, pose: (t, o) => { const st = stateOf(b, t); o.x = st.x; o.z = st.z; o.rot = Math.atan2(st.hx, st.hz); } });
  ctx.onUpdate((dt, t) => {
    const cam = ctx.camera.position;
    if ((mooredTick = (mooredTick + 1) % 30) === 0) for (const g of moored) { const dx = g.position.x - cam.x, dz = g.position.z - cam.z, on = dx * dx + dz * dz < BOAT_FAR2; if (g.visible !== on) g.visible = on; }
    for (const b of boats) {
      const st = stateOf(b, t), yaw = Math.atan2(st.hx, st.hz), bdx = st.x - cam.x, bdz = st.z - cam.z, on = bdx * bdx + bdz * bdz < BOAT_FAR2;
      if (b.g.visible !== on) b.g.visible = on; if (!on) continue;
      b.g.position.set(st.x, WATER + Math.sin(t * 1.3 + b.bob) * 0.03, st.z);
      b.g.rotation.set(Math.sin(t * 0.9 + b.bob) * 0.006, yaw, Math.sin(t * 1.1 + b.bob * 2) * 0.008);
    }
  });
  boats.forEach((b) => { const st = stateOf(b, 20); b.g.position.set(st.x, WATER, st.z); b.g.rotation.y = Math.atan2(st.hx, st.hz); });
  // ---- landing stages with a moored boat each
  const quay = ctx.services.environment && ctx.services.environment.quay;
  const stairs = (quay && quay.stairs) || [], piers = [];
  const MOORED = ['tramB', 'vintageNavy', 'tramA', 'vintageRed', 'tramA'];
  const piersRoot = new T.Group(); piersRoot.name = 'landmarksC-piers'; ctx.addStatic(piersRoot);
  stairs.forEach((s, i) => {
    if (!s || !isFinite(s.x)) return;
    try {
      const p = buildPier(ctx, K, s, i);
      piersRoot.add(p.group);      // (round 3: a landing stage never moves: it batches with the static city (far proxies) instead of ~4 draws each at every distance under the dynamic root)
      const g = wrap(MOORED[i % MOORED.length], false); g.position.set(p.x, WATER, p.z); g.rotation.y = Math.atan2(p.hx, p.hz); rootB.add(g); moored.push(g);
      const mrot = g.rotation.y;
      craft.add({ id: 'cm-' + i, kind: MOORED[i % MOORED.length], key: 'fontanka', y: WATER, ...hullOf(MOORED[i % MOORED.length]), moving: false, pose: (t, o) => { o.x = p.x; o.z = p.z; o.rot = mrot; } });
      if (L.inPlay(p.centre.x, p.centre.z, -30)) addFloatBlock(ctx.physics, p.centre.x, p.centre.z, p.len + 0.04, p.wid + 0.4, p.rot, WATER);      // (the deck of the steppable pontoon is a walker floor in quay.js; this is what stops the player's boat)
      piers.push({ x: p.centre.x, z: p.centre.z, tx: s.tx, tz: s.tz, nx: s.nx, nz: s.nz, boat: MOORED[i % MOORED.length], stair: { x: s.x, z: s.z } });
    } catch (e) { console.warn('[landmarksC] pier', i, e && e.message); }
  });
  ctx.add(rootB);
  const service = boats.map((b) => ({ id: b.id, kind: b.kind, state: (t) => { const st = stateOf(b, t); return { x: st.x, z: st.z, rotY: Math.atan2(st.hx, st.hz), speed }; } }));
  return { service, piers, loop: { total: loop.total, lane: LANE } };
}
