// bridges/yelaginMain/common.js - shared parts of the 1st and the 3rd Yelagin bridge (yelaginMain.js, first.js, third.js): materials, alpha-cut railing panels, name plates, lamp heads, deck / railing colliders.
// Everything is drawn into the Parts collector `P` of bridges/kit.js IN THE BRIDGE FRAME (x = u along the deck, y up, z = v across it, pushed by the caller with P.push(cx, 0, cz, -T)).
// Dossier: docs/research/bridges-yelagin-main.md.  NO flags / flagpoles / beacons (user rules).
import * as THREE from 'three';
import { frameOf } from '../sites.js';
import { bankU } from '../long.js';

/** the materials of both bridges (created once per context, `brg-ym-*`); M = bridges/mats.js */
export function ymMats(ctx, M) {
  if (M.__ym) return M.__ym;
  const T = ctx.mat.toon, tex = ctx.tex, rng = ctx.rng('brg-ym-tex'), Y = {};
  Y.white = T('#dfe3e5', { paint: 0.02, name: 'brg-ym-white' });                       // 1st bridge: light grey-white paint of girders, fascia, railing, lamp poles (photos a01 a03 a05)
  Y.cream = T('#e6e4da', { paint: 0.03, name: 'brg-ym-cream' });                       // 3rd bridge: cream fascia of the continuous beams (b01 b02 b04)
  Y.soffit = T('#a3a6a3', { paint: 0.03, name: 'brg-ym-soffit' });
  Y.mint = T('#9cc8aa', { paint: 0.03, name: 'brg-ym-mint' });                         // 3rd bridge: mint-green railing, posts and lamp standards (b01 b06 b09)
  Y.conc = T('#bdbab0', { paint: 0.05, name: 'brg-ym-conc' });                         // 1st bridge: pale concrete grillages, kerb and pavement blocks (a06)
  Y.pile = T('#565c61', { paint: 0.03, name: 'brg-ym-pile' });                         // the dark steel pile dolphins (a01 a06 a08)
  Y.plank = T('#cfc8ba', { map: tex.draw(256, 256, (g, w, h) => {                      // weathered silver-grey boards 0.14 m wide laid along the bridge (OSM surface=wood of the lift leaf), tile 1.0 (along) x 1.0 m
    const rows = 7, rh = h / rows;
    for (let j = 0; j < rows; j++) {
      const k = 0.88 + rng() * 0.14; g.fillStyle = `rgb(${Math.round(172 * k)},${Math.round(164 * k)},${Math.round(148 * k)})`; g.fillRect(0, j * rh, w, rh - 1.5);
      g.fillStyle = 'rgba(66,60,50,0.55)'; g.fillRect(0, j * rh + rh - 2, w, 2);
      g.fillStyle = 'rgba(60,54,46,0.6)'; g.fillRect((j * 97) % w, j * rh, 2, rh - 1.5);
    }
  }, { key: 'brg-ym-plank', repeat: [1, 1], anisotropy: 8 }), paint: 0.05, name: 'brg-ym-plank' });
  Y.granite = T('#bbb8b0', { map: M.texGranite, paint: 0.05, name: 'brg-ym-granite' }); // 3rd bridge: pale grey granite piers and abutments (b01 b04 b06)
  Y.slat = T('#9aa2a6', { map: tex.draw(128, 128, (g, w, h) => {                       // the grey horizontally slatted cladding of the lift frames (a01 a03)
    g.fillStyle = '#e8ecee'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 12; j++) { const k = 0.88 + rng() * 0.12; g.fillStyle = `rgb(${Math.round(226 * k)},${Math.round(232 * k)},${Math.round(236 * k)})`; g.fillRect(0, j * h / 12 + 1, w, h / 12 - 2.5); }
  }, { key: 'brg-ym-slat', repeat: [1, 1] }), paint: 0.03, name: 'brg-ym-slat' });
  // the pavement of the 1st bridge: grey asphalt with a dark rhombus inlay every 2.4 m (photo a05)
  Y.pave1 = T('#8d9092', { map: tex.draw(128, 128, (g, w, h) => {
    g.fillStyle = '#f0f0ee'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { g.fillStyle = rng() < 0.5 ? 'rgba(90,90,92,0.10)' : 'rgba(255,255,255,0.22)'; g.fillRect(rng() * w, rng() * h, 2, 2); }
    g.fillStyle = '#5c5f63'; g.beginPath(); g.moveTo(w / 2, h * 0.3); g.lineTo(w * 0.78, h / 2); g.lineTo(w / 2, h * 0.7); g.lineTo(w * 0.22, h / 2); g.closePath(); g.fill();
    g.fillStyle = '#d4d6d6'; g.beginPath(); g.moveTo(w / 2, h * 0.4); g.lineTo(w * 0.62, h / 2); g.lineTo(w / 2, h * 0.6); g.lineTo(w * 0.38, h / 2); g.closePath(); g.fill();
  }, { key: 'brg-ym-pave1', repeat: [1, 1], anisotropy: 4 }), paint: 0.04, name: 'brg-ym-pave1' });
  Y.plate = (txt, sub) => T('#ffffff', { map: tex.draw(256, 96, (g, w, h) => {          // the blue enamel street plate of the bridges: white lettering inside a white rounded frame (photos a05 b06)
    g.fillStyle = '#1c2a6a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#e9ecf4'; g.lineWidth = 3; g.beginPath(); g.roundRect(7, 7, w - 14, h - 14, 9); g.stroke();
    g.fillStyle = '#eef0f6'; g.textAlign = 'center'; g.textBaseline = 'middle';           // (fitText draws at x, y with the canvas alignment: without this the line started at the middle and ran off the plate)
    tex.fitText(g, txt, w * 0.5, h * 0.5, w * 0.84, h * 0.42, tex.FONTS.sans, 700);
    void sub;
  }, { key: 'brg-ym-plate-' + txt, repeat: [1, 1] }), name: 'brg-ym-plate-' + txt });
  M.__ym = Y; return Y;
}

/** an alpha-cut railing panel material: `paint(g, W, H)` draws white on clear at `px` pixels per metre; the colour tints it */
export function panelMat(ctx, M, key, wM, hM, hex, paint, px = 300) {
  const W = Math.round(wM * px), H = Math.round(hM * px);
  const map = ctx.tex.draw(W, H, (g) => { g.clearRect(0, 0, W, H); paint(g, W, H, px); }, { key: 'brg-ym-panel-' + key, repeat: [1, 1], anisotropy: 8 });
  const m = ctx.mat.toon(hex, { map, alphaTest: 0.5, side: 'double', paint: 0.02, name: 'brg-ym-panel-' + key });
  if (M.decalMats) M.decalMats.add(m);                                               // (no toon outline round the alpha-cut quads: bridges.js flush)
  return m;
}
/** one railing bay as a double sided quad in the bridge frame: from u a (height y a) to u b (y b) at cross coordinate v, `h` high, bottom `yb0` above the deck */
export function bay(P, mat, ua, ub, ya, yb, v, h) {
  P.quad(mat, [ua, ya, v], [ub, yb, v], [ub, yb + h, v], [ua, ya + h, v], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
}

/**
 * An asphalt mouth beyond a deck end: the roads that meet the bridge heads in the data are 2.4 - 4 m park paths / service lanes (the avenue to the 3rd bridge is a 2.4 m footway), the carriageway is 7 - 8 m,
 * so a strip of grass stood between the deck and the path.  A flat trapezoid, full carriageway width at the deck end (u = e * hl, e = -1 / +1), narrowing to +-hwEnd over `len` m, sinking from the deck-end level
 * to `yEnd` (street asphalt is drawn at 0.03: stays above it).  Visual only (the ground is the collider, the step from the deck end is 0.05 m).
 */
export function apron(P, mat, e, hl, road, len, hwEnd, y0 = 0.05, yEnd = 0.042) {
  const a = e * hl, b = e * (hl + len);
  if (e > 0) P.quad(mat, [a, y0, -road], [b, yEnd, -hwEnd], [b, yEnd, hwEnd], [a, y0, road], [0, 1, 0], [[a / 4, -road / 4], [b / 4, -hwEnd / 4], [b / 4, hwEnd / 4], [a / 4, road / 4]]);
  else P.quad(mat, [b, yEnd, -hwEnd], [a, y0, -road], [a, y0, road], [b, yEnd, hwEnd], [0, 1, 0], [[b / 4, -hwEnd / 4], [a / 4, -road / 4], [a / 4, road / 4], [b / 4, hwEnd / 4]]);
}

/** a clear lantern bowl (hemisphere) under a flat cone cap, seen on the 1st bridge standards: centre (x, y, z) = the top of the bowl */
const HEMI = new THREE.SphereGeometry(1, 10, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), BALL = new THREE.SphereGeometry(1, 10, 7);
export function bowlLamp(P, M, Yw, x, y, z, r = 0.24) {
  P.cyl(Yw, [x, y + 0.02, z], [x, y + 0.2, z], 0.05, 0.05, 6, false);                  // the stem into the cap
  P.cyl(Yw, [x, y, z], [x, y + 0.16, z], r * 1.15, r * 0.45, 12, true);                // cap: a low cone
  P.geo(M.lampGlass, HEMI, x, y, z, 0, 0, 0, r, r * 0.9, r);
}
export function globe(P, M, x, y, z, r) { P.geo(M.lampGlass, BALL, x, y, z, 0, 0, 0, r, r, r); }

/** push a vertical pole + plate: a blue enamel plate on both faces (facing +/-u), a dark pole */
export function plateOnPole(P, M, Yw, mat, u0, v0, y0, poleMat, h = 3.0, w = 0.9, hh = 0.34) {
  P.cyl(poleMat, [u0, y0, v0], [u0, y0 + h, v0], 0.045, 0.04, 6, true);
  for (const sg of [-1, 1]) {                                                        // text reads left to right for a walker who faces the plate (left = +v when the face looks toward +u)
    const x = u0 + sg * 0.025, vl = v0 + sg * w / 2, vr = v0 - sg * w / 2;
    P.quad(mat, [x, y0 + h - 0.1 - hh, vl], [x, y0 + h - 0.1 - hh, vr], [x, y0 + h - 0.1, vr], [x, y0 + h - 0.1, vl], [sg, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  P.box(poleMat, u0 - 0.03, u0 + 0.03, y0 + h - 0.1 - hh - 0.02, y0 + h - 0.1 - hh, v0 - w / 2 - 0.02, v0 + w / 2 + 0.02, '', 1);        // the plate frame (bottom / top bars)
  P.box(poleMat, u0 - 0.03, u0 + 0.03, y0 + h - 0.1, y0 + h - 0.08, v0 - w / 2 - 0.02, v0 + w / 2 + 0.02, '', 1);
  P.cyl(poleMat, [u0, y0 + h - 0.08, v0], [u0, y0 + h + 0.18, v0], 0.02, 0.0, 5, false);                                              // the spear finial
}

/** deck colliders: walk ramps in bands (road, the two pavements), railing boxes, cylinders; `bands` = [[vCentre, width, yOffset], ...] */
export function deckColliders(ctx, f, T, world, o) {
  const ph = ctx.physics, rampRot = Math.atan2(f.c, f.s), n = Math.ceil((o.u1 - o.u0) / 4);
  let count = 0;
  for (const [vc, wd, dy] of o.bands) for (let i = 0; i < n; i++) {
    const a = o.u0 + (o.u1 - o.u0) * i / n, b = o.u0 + (o.u1 - o.u0) * (i + 1) / n, w = world((a + b) / 2, vc);
    ph.addWalkRamp(w.x, w.z, wd, b - a + 0.04, rampRot, o.yDeck(a) + dy, o.yDeck(b) + dy, 2.5); count++;
  }
  for (const sg of [-1, 1]) {
    const nR = Math.ceil((o.u1 - o.u0) / 7);
    for (let i = 0; i < nR; i++) { const a = o.u0 + (o.u1 - o.u0) * i / nR, b = o.u0 + (o.u1 - o.u0) * (i + 1) / nR, w = world((a + b) / 2, sg * (o.hw - 0.08)); ph.addBox(w.x, w.z, b - a + 0.05, 0.3, -T, -6, Math.max(o.yDeck(a), o.yDeck(b)) + 1.5); count++; }
  }
  return count;
}

/**
 * The quay opening of the environment can be wider than the drawn wing (closeBank stops at the first solid it meets, and its own last box counts as one): from cross distance `from` outward the bank line is scanned
 * every 0.5 m; where no solid stands on it (a gap between the opening and the environment's wall, an open edge: the walker fell into the trench there) an invisible wall box (y -8 .. 1.3) is added along the free
 * stretch; two solid samples in a row after a free stretch end the scan (the environment's wall takes over).  o: { u (bank line guess on the axis), dir, sg, from, max, yTop }; returns the number of boxes.
 */
export function extendWings(ctx, site, L, o) {
  const ph = ctx.physics, f = frameOf(site), world = (u, v) => ({ x: f.cx + u * f.c - v * f.s, z: f.cz + u * f.s + v * f.c });
  const pts = [], max = o.max ?? 24, step = 0.5; let last = o.u;
  for (let v = o.from; v <= max + 1e-6; v += step) { const ub = bankU(L, site, o.sg * v, last, o.dir); if (ub !== null) last = ub; pts.push({ v: o.sg * v, u: last }); }
  const free = pts.map((q) => { const w = world(q.u - o.dir * 0.1, q.v), p = { x: w.x, z: w.z }; ph.resolve(p, 0.2, 0, 1.7); return Math.hypot(p.x - w.x, p.z - w.z) < 0.04; });
  let n = 0, seenFree = false, solidRun = 0;
  for (let k = 0; k + 1 < pts.length; k++) {
    if (free[k]) { seenFree = true; solidRun = 0; } else if (seenFree && ++solidRun >= 2) break;
    if (!(free[k] && free[k + 1])) continue;
    const a = pts[k], b = pts[k + 1], um = (a.u + b.u) / 2 - o.dir * 0.15, vm = (a.v + b.v) / 2, w = world(um, vm), rot = Math.atan2(-(b.u - a.u) * f.s - (b.v - a.v) * f.c, (b.u - a.u) * f.c - (b.v - a.v) * f.s);
    ph.addBox(w.x, w.z, Math.hypot(b.u - a.u, b.v - a.v) + 0.3, 0.5, rot, -8, (o.yTop ?? 0.05) + 1.25); n++;
  }
  return n;
}
