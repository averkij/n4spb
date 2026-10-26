// drive/boat/model.js - the MOTOR BOAT, authored in code (no asset files): a white open day-boat with a blue hull, a red pinstripe, a pointed bow, a cream foredeck, a cockpit with a teak floor, two bucket seats
// and a rear bench, a console with a tilted windshield and a helm, a stainless bow rail, a life ring and an OUTBOARD motor on the transom that turns with the wheel. Cel-shaded like the cars: ONE merged
// vertex-colour mesh through ctx.mat.toon (the traffic module's VB builder), a glass pane, the lamps (emissive; running lights at night), the helmsman and the outboard: five draws, plus the wake (boat/wake.js).
// The hull is lofted from stations (a pointed bow, a V bottom, a chine, a flared side, a sheer line that rises toward the bow) with flat faces: the low-poly look of the rest of the game.
// Frame: forward +Z, +X = the boat's LEFT (port), the origin on the WATERLINE in the middle of the hull (the keel is 0.43 m below it, the gunwale 0.55 m above amidships, the stem 1.0 m).
// API (the car model's): root, wheels (none), steerWheel, driver, flames (none), set(p), setView(inside).
import * as THREE from 'three';
import { VB } from '../../traffic/vb.js';
import { SPEC_BOAT } from './handling.js';

const WHITE = '#f3f4f1', CREAM = '#ece5d1', NAVY = '#1c3a73', NAVY_DK = '#142a55', RED = '#cf2b35', TEAK = '#a07a4e', CHROME = '#cfd6df', BLACK = '#17191d', GREY = '#8f98a3', SEAT = '#223a6a', SEAT_LT = '#e8e4d8', DASH = '#2a2f37';
const lerp = (a, b, t) => a + (b - a) * t;

// ---- the hull stations, stern to bow: z, half width of the gunwale / the chine, height of the gunwale / the chine / the keel
export const ST = {
  z:  [-2.60, -2.30, -1.60, -0.80, 0.10, 0.95, 1.70, 2.30, 2.72, 3.00],
  gw: [0.93, 0.96, 0.97, 0.97, 0.95, 0.86, 0.66, 0.40, 0.14, 0.0],
  cw: [0.64, 0.70, 0.77, 0.79, 0.76, 0.64, 0.44, 0.22, 0.07, 0.0],
  gy: [0.55, 0.55, 0.56, 0.58, 0.62, 0.70, 0.80, 0.90, 0.97, 1.00],
  cy: [-0.12, -0.14, -0.17, -0.18, -0.14, -0.04, 0.10, 0.30, 0.47, 0.55],
  ky: [-0.22, -0.32, -0.40, -0.43, -0.37, -0.22, 0.00, 0.28, 0.45, 0.55],
};
const NS = ST.z.length, COCKPIT_END = 5;       // the stations 0..5 (z -2.6 .. 0.95) are the open cockpit, 5..9 the foredeck

/** a collector of flat triangles; each is wound to face `hint` (a function of the centroid giving the wanted outward direction) */
function Flat() {
  const pos = [];
  const tri = (a, b, c, hint) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (nx * nx + ny * ny + nz * nz < 1e-12) return;       // a collapsed triangle (the bow tip)
    const h = hint([(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3]);
    if (nx * h[0] + ny * h[1] + nz * h[2] < 0) pos.push(...a, ...c, ...b); else pos.push(...a, ...b, ...c);
  };
  const quad = (a, b, c, d, hint) => { tri(a, b, c, hint); tri(a, c, d, hint); };
  const geo = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g; };
  return { tri, quad, geo };
}
const UP = () => [0, 1, 0];
const OUT = (c) => [c[0], 0, 0];                              // away from the hull's axis (the sides: they are never horizontal)
const DECK_L = () => [0.3, 1, 0], DECK_R = () => [-0.3, 1, 0];     // up and a little outward (the foredeck strips at the stem are near-vertical slivers in the plane x = 0)
const DOWN = () => [0, -1, 0];                               // the bottom (a hint on the height would turn the near-flat bow strips upside down)
const IN = (c) => [-c[0], 0.3 - c[1], 0];                    // toward the axis (the inner walls of the cockpit)

/** a point on the right side of station i: row 0 keel, 1 chine, 2 gunwale; t between the chine and the gunwale for the side strips */
const sidePt = (i, t, s) => [s * lerp(ST.cw[i], ST.gw[i], t), lerp(ST.cy[i], ST.gy[i], t), ST.z[i]];
const keelPt = (i) => [0, ST.ky[i], ST.z[i]];
const chinePt = (i, s) => [s * ST.cw[i], ST.cy[i], ST.z[i]];

export function hullGeometries() {
  const bottom = Flat(), lower = Flat(), pin = Flat(), side = Flat(), deck = Flat(), coam = Flat(), floor = Flat(), inner = Flat(), trans = Flat();
  for (let i = 0; i + 1 < NS; i++) for (const s of [1, -1]) {
    bottom.quad(keelPt(i), keelPt(i + 1), chinePt(i + 1, s), chinePt(i, s), DOWN);
    lower.quad(sidePt(i, 0, s), sidePt(i + 1, 0, s), sidePt(i + 1, 0.30, s), sidePt(i, 0.30, s), OUT);          // the blue boot-top band above the chine
    pin.quad(sidePt(i, 0.30, s), sidePt(i + 1, 0.30, s), sidePt(i + 1, 0.37, s), sidePt(i, 0.37, s), OUT);      // the red pinstripe
    side.quad(sidePt(i, 0.37, s), sidePt(i + 1, 0.37, s), sidePt(i + 1, 1, s), sidePt(i, 1, s), OUT);           // the white topsides
  }
  // the foredeck: from the front of the cockpit to the stem, a shallow ridge down the middle
  for (let i = COCKPIT_END; i + 1 < NS; i++) {
    const L0 = sidePt(i, 1, 1), L1 = sidePt(i + 1, 1, 1), R0 = sidePt(i, 1, -1), R1 = sidePt(i + 1, 1, -1), c0 = [0, ST.gy[i] + 0.05, ST.z[i]], c1 = [0, ST.gy[i + 1] + 0.05, ST.z[i + 1]];
    deck.quad(L0, L1, c1, c0, DECK_L); deck.quad(c0, c1, R1, R0, DECK_R);
  }
  // the cockpit: the teak floor, the inner walls (inset 7 cm), the coaming on top of the gunwale, the front wall under the foredeck and the rear wall above the transom
  // The liner is a SHELL inside the outer hull, parallel to it: at the floor height its half width is the outer half width there minus the inset (it used to be the gunwale width minus the inset, which poked out
  // of the hull at the stern and made the teak corners show beside the transom), and it runs over EVERY cockpit station 0..COCKPIT_END (the loop used to stop at station 4, which left the side of the hull open
  // between z 0.10 and 0.95, beside the seats and the console: from inside the single-sided outer side was culled and the water showed through).
  const FL = 0.10, IN_W = 0.07;
  const outerHalf = (i, y) => lerp(ST.cw[i], ST.gw[i], (y - ST.cy[i]) / (ST.gy[i] - ST.cy[i]));      // the outer half width of the hull at height y (above the chine) on station i
  const xf = (i) => outerHalf(i, FL) - IN_W;                                                             // the liner's half width at the floor
  const zS = ST.z[0] + 0.08, zF = ST.z[COCKPIT_END], wS = ST.gw[0] - IN_W, wF = ST.gw[COCKPIT_END] - IN_W;
  const zi = (i) => (i === 0 ? zS : ST.z[i]);                                                            // the first liner station stands at the rear wall, 8 cm in front of the transom
  for (let i = 0; i < COCKPIT_END; i++) for (const s of [1, -1]) {
    const a = [s * (ST.gw[i] - IN_W), ST.gy[i], zi(i)], b = [s * (ST.gw[i + 1] - IN_W), ST.gy[i + 1], zi(i + 1)];
    inner.quad([s * xf(i), FL, a[2]], [s * xf(i + 1), FL, b[2]], b, a, IN);
    coam.quad(sidePt(i, 1, s), sidePt(i + 1, 1, s), b, a, UP);
    floor.quad([s * xf(i), FL, a[2]], [0, FL, a[2]], [0, FL, b[2]], [s * xf(i + 1), FL, b[2]], UP);
  }
  coam.quad(sidePt(0, 1, -1), sidePt(0, 1, 1), [wS, ST.gy[0], zS], [-wS, ST.gy[0], zS], UP);                 // the cap on top of the transom (it used to be an open slit)
  const rear = (s) => [s * xf(0), FL, zS];
  inner.quad(rear(-1), rear(1), [wS, ST.gy[0], zS], [-wS, ST.gy[0], zS], () => [0, 0, 1]);                      // the rear wall, facing the bow
  // the front wall, facing the stern: its top follows the ridge of the foredeck (a 5 cm rise in the middle), so no slit is left under the deck
  const topF = ST.gy[COCKPIT_END] + 0.05 * (1 - wF / ST.gw[COCKPIT_END]), apexF = ST.gy[COCKPIT_END] + 0.05;
  const fw = [[-xf(COCKPIT_END), FL], [xf(COCKPIT_END), FL], [wF, topF], [0, apexF], [-wF, topF]];
  for (let k = 1; k + 1 < fw.length; k++) inner.tri([fw[0][0], fw[0][1], zF], [fw[k][0], fw[k][1], zF], [fw[k + 1][0], fw[k + 1][1], zF], () => [0, 0, -1]);
  // the transom (outside): the cross-section of station 0 as a fan
  const T0 = [keelPt(0), chinePt(0, 1), sidePt(0, 1, 1), sidePt(0, 1, -1), chinePt(0, -1)];
  for (let k = 1; k + 1 < T0.length; k++) trans.tri(T0[0], T0[k], T0[k + 1], () => [0, 0, -1]);
  return { bottom, lower, pin, side, deck, coam, floor, inner, trans };
}

export function createBoatModel(ctx) {
  const { mat } = ctx, S = SPEC_BOAT;
  const V = new VB(0), G = new VB(0), LAMP = new VB(0), DR = new VB(0), OB = new VB(0), LEG = new VB(0), PR = new VB(0), WH = new VB(0);
  const H = hullGeometries();
  const add = (f, col) => { const g = f.geo(); V.add(g, col); g.dispose(); };
  add(H.bottom, NAVY_DK); add(H.lower, NAVY); add(H.pin, RED); add(H.side, WHITE); add(H.deck, CREAM); add(H.coam, WHITE); add(H.floor, TEAK); add(H.inner, CREAM); add(H.trans, WHITE);

  // ---- the console (a block with a sloped dash), the helm, the windshield frame, the seats, the rear bench, the bow rail, the cleats, the life ring
  V.box(1.34, 0.46, 0.46, WHITE, [0, 0.58, 0.68]);                                        // console body (front wall of the cockpit to z 0.45)
  V.box(1.34, 0.05, 0.40, DASH, [0, 0.83, 0.70]);                           // dash top
  V.box(0.34, 0.16, 0.05, BLACK, [0.30, 0.89, 0.84], [-0.5, 0, 0]);                       // the gauge pod
  V.box(0.42, 0.03, 0.30, GREY, [-0.32, 0.86, 0.72]);                                     // a hatch / cup tray on the passenger side
  for (const sd of [-1, 1]) {
    V.rod([sd * 0.74, 0.86, 0.88], [sd * 0.70, 1.34, 0.66], 0.016, CHROME, 6);           // windshield pillars (leaning back)
  }
  V.rod([-0.70, 1.34, 0.66], [0.70, 1.34, 0.66], 0.016, CHROME, 6);                       // top bar
  V.rod([-0.72, 0.89, 0.87], [0.72, 0.89, 0.87], 0.014, CHROME, 6);                       // base bar
  for (const sx of [0.34, -0.34]) {                                                       // two bucket seats
    V.rbox(0.52, 0.22, 0.54, 0.05, SEAT, [sx, 0.26, -0.18], null, 1);
    V.rbox(0.50, 0.58, 0.14, 0.05, SEAT, [sx, 0.62, -0.50], [-0.12, 0, 0], 1);
    V.box(0.36, 0.05, 0.10, SEAT_LT, [sx, 0.97, -0.52], [-0.12, 0, 0]);                  // headrest piping
    V.box(0.12, 0.30, 0.34, DASH, [sx, 0.13, -0.18]);                                     // the pedestal
  }
  V.rbox(1.62, 0.26, 0.56, 0.05, SEAT, [0, 0.28, -2.02], null, 1);                        // the rear bench
  V.rbox(1.62, 0.52, 0.14, 0.05, SEAT, [0, 0.60, -2.30], [-0.10, 0, 0], 1);
  V.box(1.30, 0.04, 0.40, TEAK, [0, 0.12, -1.20]);                                        // a teak step plate in the aisle
  // the bow rail (stainless): posts and a loop that follows the gunwale to the stem
  const RP = [[1.4, 0.76, 0.76], [2.0, 0.55, 0.88], [2.5, 0.30, 0.95], [2.82, 0.0, 1.0]];
  for (const sd of [-1, 1]) {
    for (let k = 0; k < RP.length; k++) { const [z, w, y] = RP[k]; V.rod([sd * w, y, z], [sd * w, y + 0.26, z], 0.014, CHROME, 5); }
    for (let k = 0; k + 1 < RP.length; k++) V.rod([sd * RP[k][1], RP[k][2] + 0.26, RP[k][0]], [sd * RP[k + 1][1], RP[k + 1][2] + 0.26, RP[k + 1][0]], 0.014, CHROME, 5);
  }
  V.box(0.14, 0.05, 0.10, CHROME, [0, 1.02, 2.93]);                                       // the bow fairlead
  for (const z of [1.0, -0.6]) for (const sd of [-1, 1]) V.cyl(0.03, 0.04, 0.07, CHROME, [sd * (ST.gw[4] - 0.04), ST.gy[4] + 0.04, z], null, 6);       // cleats
  V.torus(0.20, 0.048, RED, [0.62, 0.50, -2.46], [0, 0, 0], 5, 16);                       // the life ring on the rear wall
  V.torus(0.20, 0.050, WHITE, [0.62, 0.50, -2.455], [0, 0, 0], 5, 4, 0.9);
  V.rod([0.55, 0.56, -2.50], [0.55, 1.34, -2.50], 0.012, CHROME, 5);                      // the stern light pole

  // ---- the windshield (a tilted glass pane in the frame)
  G.box(1.40, 0.50, 0.02, '#ffffff', [0, 1.115, 0.765], [-0.44, 0, 0]);

  // ---- the lamps: bow lamp, red (port, left = +X) and green (starboard) running lights, the stern light
  LAMP.box(0.13, 0.07, 0.10, '#ffffff', [0, 1.045, 2.56]);
  LAMP.box(0.07, 0.07, 0.07, '#ff3a3a', [0.58, 0.96, 1.98]);
  LAMP.box(0.07, 0.07, 0.07, '#33ff77', [-0.58, 0.96, 1.98]);
  LAMP.box(0.07, 0.07, 0.07, '#ffffff', [0.55, 1.36, -2.50]);

  // ---- the helmsman (seated on the left seat; hidden in the cockpit view) and the wheel
  const jacket = '#e0783a', skin = '#e8b894';
  DR.box(0.40, 0.46, 0.24, jacket, [0.34, 0.66, -0.30], [-0.12, 0, 0]);
  DR.box(0.11, 0.38, 0.11, jacket, [0.58, 0.66, 0.0], [1.25, 0, 0.12]);
  DR.box(0.11, 0.38, 0.11, jacket, [0.12, 0.66, 0.0], [1.25, 0, -0.12]);
  DR.box(0.34, 0.12, 0.40, '#2b3550', [0.34, 0.40, -0.14]);
  DR.sph(0.11, skin, [0.34, 1.04, -0.30], 8); DR.sph(0.122, '#3a2a22', [0.34, 1.07, -0.34], 8, [1, 0.8, 1]);
  WH.torus(0.15, 0.016, BLACK, [0, 0, 0], [0, 0, 0], 5, 14); WH.box(0.022, 0.28, 0.02, BLACK, [0, 0, 0]); WH.box(0.28, 0.022, 0.02, BLACK, [0, 0, 0]);

  // ---- the outboard motor (its own pivot at the transom: it swings with the wheel)
  OB.rbox(0.40, 0.62, 0.52, 0.09, WHITE, [0, 0.20, -0.20], null, 1);                      // the cowling
  OB.box(0.42, 0.10, 0.54, NAVY, [0, 0.28, -0.20]);                                        // the stripe
  OB.box(0.16, 0.20, 0.10, BLACK, [0, 0.12, 0.08]);                                        // the clamp bracket on the transom
  // The SUBMERGED part (the leg from the cowling down, the gearcase torpedo, the propeller; the waterline is y = -0.58 in this pivot) is NOT part of the outlined mesh: the cel outline pass sees the depth / normals of
  // everything below the surface and drew it through the water as a static dark line drawing that did not move with the wake. It is its own mesh on the no-outline layer (colour pass only: plain grey shapes under
  // the water, no contour), and the propeller is a separate spinning mesh (turns with the speed).
  LEG.box(0.17, 0.90, 0.34, GREY, [0, -0.46, -0.26]);                                      // the leg
  LEG.cyl(0.095, 0.095, 0.56, GREY, [0, -0.88, -0.30], [Math.PI / 2, 0, 0], 8);            // the gearcase torpedo
  PR.box(0.03, 0.30, 0.10, '#555b63', [0, 0, 0]); PR.box(0.30, 0.03, 0.10, '#555b63', [0, 0, 0]);        // the propeller (a cross, centred on its axis)

  const mk = (vb, opts) => new THREE.Mesh(vb.build(), mat.toon('#ffffff', { vertexColors: true, paint: 0.02, ...opts }));
  const body = mk(V, { name: 'boat-body', side: 'double' }); body.name = 'boat-body'; body.castShadow = true; body.receiveShadow = true;
  const driver = mk(DR, { name: 'boat-driver' }); driver.name = 'boat-driver';
  const outboard = mk(OB, { name: 'boat-motor' }); outboard.name = 'boat-motor'; outboard.castShadow = true;
  const steerWheel = new THREE.Group(); steerWheel.position.set(0.34, 0.99, 0.50); steerWheel.rotation.x = -0.52;
  steerWheel.add(mk(WH, { name: 'boat-wheel', paint: 0 }));
  // The windshield is a CALM pane: a flat tinted unlit plane of constant opacity. No sky reflection, no fresnel, no scrolling highlight streaks (the shared mat.glass has them and they raced across the pane as the boat moved).
  const glassMat = new THREE.MeshBasicMaterial({ color: '#7f9bb0', transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, fog: true, name: 'boat-glass' });
  const glass = new THREE.Mesh(G.build(), glassMat); glass.name = 'boat-glass'; glass.renderOrder = 2;
  const lampMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, name: 'boat-lamps' });
  const lamps = new THREE.Mesh(LAMP.build(), lampMat); lamps.name = 'boat-lamps'; lampMat.color.setScalar(0.55);

  const leg = mk(LEG, { name: 'boat-motor-leg' }); leg.name = 'boat-motor-leg';
  const prop = mk(PR, { name: 'boat-motor-prop', side: 'double' }); prop.name = 'boat-motor-prop'; prop.position.set(0, -0.88, -0.62);
  ctx.noOutline(leg); ctx.noOutline(prop);                                                    // below the waterline: no outline pass (see above)
  const motor = new THREE.Group(); motor.position.set(0, 0.58, -2.63); motor.add(outboard, leg, prop);
  const root = new THREE.Group(); root.name = 'drive-boat'; root.rotation.order = 'YXZ';
  root.add(body, glass, lamps, driver, steerWheel, motor);
  root.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });

  // The helmsman exists only while the player drives the boat: a parked / moored / respawned boat is empty. `driven` (set by drive.js: enter / exit / every pose) and the cockpit view (the eye is the helmsman's) decide.
  let driven = false, inside = false;
  const showDriver = () => { driver.visible = driven && !inside; };
  driver.visible = false;
  const night = ctx.shared ? ctx.shared.uNight : null;
  const phase = Math.random() * 6.28;
  const api = {
    root, wheels: [], steerWheel, driver, flames: [], glow: null, headMat: lampMat, tailMat: lampMat, body, glass, outboard: motor, propeller: prop, spec: S, boat: true,
    /** pose: x y z yaw pitch roll, steerAngle; kmh. The hull rocks on the water by itself (a slow heave, roll and pitch that grow a little with the speed) */
    set(p) {
      const t = (typeof performance !== 'undefined' ? performance.now() : 0) / 1000, k = 1 + Math.min(1, (p.kmh || 0) / 40) * 0.6;
      const heave = 0.028 * Math.sin(t * 1.7 + phase) * k, roll = 0.016 * Math.sin(t * 1.25 + phase * 1.7) * k, pitch = 0.010 * Math.sin(t * 1.05 + phase * 0.6) * k;
      root.position.set(p.x, p.y + heave, p.z); root.rotation.set(-(p.pitch + pitch), p.yaw, p.roll + roll);
      motor.rotation.y = -(p.steerAngle || 0) * 0.9;
      prop.rotation.z += (p.dt || 0.016) * (p.driven ? 5 + (p.kmh || 0) * 1.1 : 0.4);        // the propeller turns with the speed (a lazy drift at rest)
      steerWheel.rotation.z = -(p.steer || 0) * 2.0;
      if (p.driven !== undefined && !!p.driven !== driven) { driven = !!p.driven; showDriver(); }
      const n = night ? night.value : 0;
      lampMat.color.setScalar(p.lights ? 0.9 + 1.6 * n : 0.45 + 0.9 * n);
    },
    /** the cockpit view (camera mode 2): the helmsman is hidden, the boat has no roof to take away */
    setView(v) { inside = !!v; showDriver(); },
    /** the player gets in (true) / out (false): the painted helmsman is shown only while the boat is in use */
    setDriven(v) { driven = !!v; showDriver(); },
  };
  return api;
}
