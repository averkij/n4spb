// drive/cars/roadster.js - the drivable TESLA ROADSTER (second generation, unveiled 2026-10-15): a low flat-faceted wedge in "Ano White" satin over a black carbon lower body,
// ONE bronze glass arrowhead (windscreen + roof + rear strip), white wheel discs with six wide tapered black spokes edged in titanium and bronze, a full-width white nose bar and a full-width red tail bar, butterfly-door cut lines,
// a chopped tail with four gold-ringed nozzles above four fan recesses and a deployable wing, strictly two seats. It is the 4th garage car (docs: the Roadster spec of the lead technical artist).
// It is a sibling of drive/model.js (the red coupe) and cars/cybertruck.js: the same car frame (forward +Z, origin on the ground midway between the axles, +X = the car's LEFT), the same model API
// (root, wheels, steerWheel, driver, flames, glow, headMat, tailMat, body, glass, cockpit, set(p), setView(inside)), built with the traffic module's vertex-colour builder.
// SHAPE (measured from the official press renders, +-3 %): 4.62 m long, 2.00 m wide, 1.22 m high, wheelbase 2.96 m, cab-forward (the windscreen base is above the front axle), nose lip 0.49 m,
//   hood 25 deg then flat to the cowl 0.83 m, windscreen 18.7 deg to the roof peak 1.219 m at z = -0.1, roof falling 9 deg to a 4 cm step, rear deck 0.93 m at the chopped tail; tyres 0.685 m (front) / 0.734 m (rear).
// REACTIVE: the 4 rear nozzles (SPEC_ROADSTER.exhaust) fire cold-gas plumes under thrust (model.flames[0..3], pale blue-white billowing lathe plumes that fade out, NO orange flame); the wing rises and tips back at speed / thrust;
//   four hidden down-jets (hop, p.jet / p.jetK) appear only while a hop uses them. HOP v3: on the BARREL hop (C) p.flip (radians, from handling.js car.flip) rolls the whole model
//   a full 360 degrees about its long axis through the middle of the body (COSMETIC: the physics car stays upright; the cockpit view ignores it so the camera never rolls) and four thin cyan-white side streaks (p.s0 / p.s1 = the pulses
//   of the left / right jets) shoot out of the flanks while it turns.
// DRAW CALLS: exterior 17 (body, glass, head lamps, tail lamps, driver, yoke, 4 wheels, rear plate, roof logo, wing = blade + fences + struts) + glow + head-lamp pool + 4 plumes + 4 down-jets (the last three groups only while used).
// Z-FIGHTING: every part keeps >= 1.5-2 cm from the surface it sits next to; decals (bars, seams, plate) are 1.2-2 cm proud.
// COCKPIT: camera mode 2 shows the cockpit set of cars/roadster/interior.js (createRoadsterCockpit(ctx, S, paint) -> { group, wheel, setVisible, update }); its yoke is also the exterior steering wheel.
import * as THREE from 'three';
import { VB } from '../../traffic/vb.js';
import { TYRE, extrudeSide } from '../../traffic/mk.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { hullGeo, sym, RF, RR, TWF, TWR, TRACK_F, TRACK_R, AXLE, ARCH, HW, HOOD, DECK, BELT,
  hoodY, glassHW, splitY, roofY, deckY, sideX, archLine, flareRing } from './roadster/geo.js';
import { glowTexture, beamTexture } from './cybertruck/textures.js';
import { createRoofLogo } from '../model.js';
import { createRoadsterCockpit } from './roadster/interior.js';

export const SPEC_ROADSTER = {
  name: 'roadster',
  W: 2.00,                 // body width at the haunches (collision half width = W/2+0.06 = 1.06)
  R: 0.355,                // MEAN wheel radius for spin (front 0.3425, rear 0.367); the model uses the per-axle radii of roadster/geo.js
  tw: 0.31,                // mean tyre width (front 0.295 tread, rear 0.33)
  track: 1.61,             // mean (front 1.58, rear 1.64); the model uses TRACK_F / TRACK_R
  yb: 0.15,                // sill underside; splitter 0.105, diffuser lip 0.26
  wb: 2.96,                // axles at +-1.48
  front: 2.36, rear: -2.26,
  hgt: 1.22,               // collision / roof height (roof peak 1.219)
  len: 4.62, centerZ: 0.05,
  // coupe-style profile numbers that some helpers read
  hn: 0.49, hh: 0.83, zc: 1.41, hb: 0.82, zt: -1.44, ht: 1.06, H: 1.22, zr0: 0.36, zr1: -1.44, taper: [0.36, 0.03],
  eye: { x: 0.36, y: 0.93, z: 0.20 }, fovRest: 74,
  mass: 1690,              // overridden by the MASS table
  exhaust: [{ x: 0.40, y: 0.50, z: -2.27 }, { x: 0.13, y: 0.50, z: -2.27 }, { x: -0.13, y: 0.50, z: -2.27 }, { x: -0.40, y: 0.50, z: -2.27 }],   // the 4 rear nozzles
};

// ---- the palette (albedo hex of the toon / vertex-colour pipeline)
const NOSE = '#1E2228', PAINT = '#DDDFE4', PAINT_HI = '#F6F7F9', CARBON = '#14171B', UNDER = '#0D0F12', LINING = '#0F1114', PILLAR = '#14171B', SEAT = '#E6E6EA', METAL = '#C9CBD0', FENDER = '#CDD2DB';
const DISC = '#F0F1F5', RIM = '#A9ACB6', SPOKE = '#0A0A0D', BRONZE = '#8C6B4A', TITAN = '#524E53', CAP = '#242733', TYRE_STEP = '#1B1B1D', RING = '#B8A47C', BORE = '#050505';
const DEGS = Math.PI / 180, SHADE_LIFT = [0.44, 0.46, 0.50];
/** hop v3 (the numbers mirror tuning.hop in cars/tuning.js): the height of the barrel roll's axis, the side-jet nozzles (front lateral L1 / L2 and a rear pair near the rear wheels; x is mirrored) */
const FLIP_PIVOT = 0.55, SIDE_NOZZLES = [[0.92, 0.58, 2.05], [1.0, 0.55, -1.75]];

/** a copy of a toon material whose shaded side is lifted toward a cool blue-grey: the albedo (vertex colour included) is added back as emissive, so the satin white reads white in the shade
 *  while the black carbon stays black (the lift scales with the albedo); the original (shared by the other garage cars) stays untouched */
function liftShade(base, lift, night) {
  const m = base.clone(), obc = base.onBeforeCompile;
  m.onBeforeCompile = (shader, renderer) => {
    obc(shader, renderer);
    shader.uniforms.uRdNight = night || { value: 0 };                                                                  // the lift fades with the night: the car must not glow in the dark
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uRdNight;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * vec3(${lift.map((v) => v.toFixed(3)).join(', ')}) * (1.0 - 0.92 * uRdNight);`);
  };
  m.customProgramCacheKey = () => 'paint-rdl';
  return m;
}

/** the US-style rear plate texture: silver plate, dark letters (the real car carries the demo word RDSTR) */
function plateTexture(text) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 112;
  const g = cv.getContext('2d');
  g.fillStyle = '#d1cac4'; g.fillRect(0, 0, 512, 112);
  g.strokeStyle = '#2a2a2e'; g.lineWidth = 5; g.strokeRect(5, 5, 502, 102);
  g.fillStyle = '#2a2a2e'; g.textBaseline = 'middle'; g.textAlign = 'center';
  g.font = '600 74px "Noto Sans", Arial, sans-serif'; g.fillText(text, 256, 58);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function createRoadsterModel(ctx, { plate = 'RDSTR' } = {}) {
  const { mat } = ctx, S = SPEC_ROADSTER;
  const V = new VB(0), G = new VB(0), LH = new VB(0), LT = new VB(0), DR = new VB(0);
  const hi = new THREE.Color(PAINT_HI), metal = new THREE.Color(METAL);
  const sky = (p, c, n) => { if (n.y > 0.8) c.lerp(hi, 0.5); };                                                  // up-facing facets catch the sky

  // ================================================================================== body: the lower prism = the side profile extruded straight (arches cut in) with a plan taper
  const prof = [[-2.26, 0.26], [-2.0, 0.15]];
  prof.push(...archLine(ARCH.rear, 22), ...archLine(ARCH.front, 22));
  prof.push([2.0, 0.15], [2.31, 0.33]);
  prof.push(...HOOD, ...BELT.slice(1), ...DECK);
  const taper = { zF0: 1.4, zF1: 2.36, kF: 0.36, zR0: -1.5, zR1: -2.26, kR: 0.03, kS: 0 };
  const tintBody = (p, c, n, info) => {
    if (n.y < -0.7) { c.set(UNDER); info.kind = 0; return; }                                                   // underside + the flat roof of the wheel openings
    if (Math.abs(n.x) < 0.5 && n.y < 0.5) for (const a of [ARCH.rear, ARCH.front]) if (Math.abs(p.z - a.z) < 0.70 && p.y < 0.95 && p.y > 0.14) { c.set(LINING); info.kind = 0; return; }   // the arch lining
    if (n.z < -0.9 && p.z < -2.2) { c.copy(metal); return; }                                                    // the grey rear metal panel under the tail bar
    sky(p, c, n);
  };
  V.add(extrudeSide(prof, 2 * HW, 0, taper), PAINT, null, tintBody);

  // ---- the black carbon lower body: three skins (between the arches, behind the rear arch, in front of the front arch) with the same taper, 1.5 cm proud on each side
  const arcPts = (a, side, ymax) => archLine(a, 22).filter((p) => (side < 0 ? p[0] < a.z : p[0] > a.z) && p[1] <= ymax(p[0]));
  const rr = arcPts(ARCH.rear, 1, splitY), fl = arcPts(ARCH.front, -1, splitY), fr = arcPts(ARCH.front, 1, splitY), rl = arcPts(ARCH.rear, -1, () => 0.62);
  const zfl = fl[fl.length - 1][0];
  const sill = [...rr, ...fl, [zfl, splitY(zfl)], [1.0, splitY(1.0)], [0, splitY(0)], [-0.8, splitY(-0.8)], [rr[0][0], splitY(rr[0][0])]];
  const tail = [[-2.275, 0.26], [-2.0, 0.15], ...rl, [-2.255, 0.62]];
  const nose = [...fr, [2.0, 0.15], [2.1, 0.21], [2.2, 0.27], [2.32, 0.33], [2.365, 0.47], [2.2, 0.43], [2.05, 0.38], [fr[0][0], splitY(fr[0][0])]];   // 3.5 cm proud: the plan taper bends the flat face away from the chords of the body's own triangles
  for (const pts of [sill, tail, nose]) V.add(extrudeSide(pts, 2 * HW + (pts === nose ? 0.07 : 0.03), 0, taper), pts === nose ? NOSE : CARBON, null, (p, c, n) => { if (n.y < -0.7) c.set(UNDER); });
  for (const a of [ARCH.rear, ARCH.front]) V.box(1.28, 0.55, 0.88, '#0D0F12', [0, 0.425, a.z]);                  // the dark wheel house between the two tyres (closes the see-through tunnel of the arch cut-outs)

  // ---- flare rings around the four arches (soft round fenders): white, the rear ones black below y 0.62; 3 cm proud, a step the ink pass reads as one solid line (1.5 cm came out dotted)
  for (const a of [ARCH.front, ARCH.rear]) {                                                                          // a full-width band with the body's taper: only its 1.5 cm rim shows outside the prism
    const ring = flareRing({ ...a, Ra: a.Ra + 0.012 }, 0.05, 22), isRear = a === ARCH.rear;
    V.add(extrudeSide(ring, 2 * HW + 0.06, 0, taper), PAINT, null, (p, c, n, info) => { if (isRear && p.y < 0.62) { c.set(CARBON); info.kind = 0; } else sky(p, c, n); });
  }

  // ---- hood facet (an inverted trapezoid) and the two fender facets that flank it (2-3 cm proud)
  const hoodX = (z) => Math.max(0.45, Math.min(0.60, 0.45 + 0.15 * (z - 1.41) / (2.34 - 1.41)));
  const hp = [];
  for (const [z0] of HOOD) { const z = Math.min(z0, 2.34), x = hoodX(z); hp.push([x, hoodY(z) + 0.02, z], [x, hoodY(z) - 0.03, z]); }
  V.add(hullGeo(sym(hp)), PAINT, null, (p, c, n) => { if (n.y > 0.6) c.lerp(hi, 0.5); });
  for (const sd of [-1, 1]) {
    const pts = [];
    for (const z of [2.35, 2.26, 2.16, 2.06, 1.96, 1.86, 1.76, 1.66, 1.56, 1.45]) {
      const xin = hoodX(z), xs = HW * (1 - 0.36 * Math.pow(Math.max(0, (z - 1.4) / 0.96), 2)) + 0.004;                   // the outer edge is flush with the body's edge: the silhouette stays the one hood line
      pts.push([xin - 0.012, hoodY(z) + 0.012, z], [xs, hoodY(z) + 0.004, z], [xs, hoodY(z) - 0.03, z], [xin - 0.012, hoodY(z) - 0.02, z]);
    }
    V.add(hullGeo(pts.map((p) => [sd * p[0], p[1], p[2]])), FENDER, null, (p, c, n) => { if (n.y > 0.8) c.lerp(hi, 0.22); });       // a tone below the hood: the crease reads as an edge, not as a dotted line
    V.rod([sd * (hoodX(1.45) + 0.004), hoodY(1.45) + 0.019, 1.45], [sd * (hoodX(2.30) + 0.004), hoodY(2.30) + 0.019, 2.30], 0.009, '#8E929B', 5);   // the crease between the hood and the fender
  }

  // ---- the rear haunches: a low ridge along each outer edge of the deck (the deck sinks toward the glass strip)
  for (const sd of [-1, 1]) {
    const hz = [-1.15, -1.6, -2.2], pts = [];
    for (const z of hz) { const y = z > -1.2 ? BELT[3][1] : deckY(z); pts.push([sd * 0.95, y + 0.04, z], [sd * 0.62, y + 0.012, z], [sd * 0.95, y - 0.03, z], [sd * 0.62, y - 0.03, z]); }
    V.add(hullGeo(pts), PAINT, null, sky);
  }
  // ---- the cabin: the paint wedge in front of each side window (the door front, leaning in), the A pillars, door lines, the dark liner, the two seat backs above the belt
  const A1 = [0.50, 0.83, 1.41], A2 = [0.76, 1.184, 0.36];
  for (const sd of [-1, 1]) {
    const wedge = [[sideX(0.79), 0.79, 1.2], [sideX(0.76), 0.76, 0.86], [sideX(0.78), 0.78, 0.86], [0.77, 1.165, 0.45], [0.50, 0.83, 1.41], [0.60, 0.83, 1.30], [sideX(0.79) - 0.05, 0.78, 1.2], [0.70, 1.13, 0.45]];
    V.add(hullGeo(wedge.map((p) => [sd * p[0], p[1], p[2]])), PAINT, null, sky);
    V.rod([sd * A1[0], A1[1] + 0.004, A1[2]], [sd * A2[0], A2[1] + 0.004, A2[2]], 0.009, '#C9CDD4', 5);                  // A pillar: a thin silver edge
    V.rod([sd * (HW + 0.006), 0.80, 0.94], [sd * (HW + 0.006), 0.37, 0.82], 0.0045, '#5A5D64', 4);                      // the front shut line of the butterfly door (thin, leaning forward at the top)
    V.rod([sd * (HW + 0.008), 0.35, -0.17], [sd * (HW + 0.008), 0.88, -0.34], 0.007, '#6E7178', 4);                      // the rear shut line, leaning back 17 deg
    V.box(0.02, 0.03, 0.18, CARBON, [sd * (HW + 0.004), 0.78, -0.10]);                                                  // flush door handle
  }
  const glassZ = [1.41, 0.86, 0.36, -0.1, -0.5, -1.0, -1.44];
  const gTop = glassZ.map((z) => [glassHW(z), roofY(z), z]), gBot = glassZ.map((z) => [Math.max(0.2, glassHW(z) - 0.04), roofY(z) - 0.06, z]);
  G.add(hullGeo(sym([...gTop, ...gBot])), '#ffffff');                                                                  // windscreen + roof
  G.add(hullGeo(sym([[0.50, deckY(-1.5) + 0.012, -1.5], [0.40, deckY(-1.8) + 0.012, -1.8], [0.46, deckY(-1.5) - 0.03, -1.5], [0.36, deckY(-1.8) - 0.03, -1.8]])), '#ffffff');     // the rear strip lying on the deck
  for (const sd of [-1, 1]) {                                                                                           // the side glass sliver (leans inward, ends in a point at the rear)
    const pts = [];
    for (const [z, y] of [[0.86, 0.78], [0.45, 1.165], [-0.20, 1.195], [-1.15, 1.03], [-1.0, 0.975]]) pts.push([sd * (sideX(y) + 0.012), y, z], [sd * (sideX(y) - 0.05), y - 0.02, z]);
    G.add(hullGeo(pts), '#ffffff');
  }
  // The exterior cabin is open beneath its glass so the animated driver is
  // visible. First-person mode retains its separate interior roof lining.
  for (const x of [0.36, -0.36]) {
    V.rbox(0.44, 0.52, 0.12, 0.05, SEAT, [x, 0.80, -0.14], [-0.4, 0, 0], 1);
    V.rbox(0.24, 0.17, 0.10, 0.04, SEAT, [x, 1.00, -0.24], [-0.4, 0, 0], 1);
    V.box(0.14, 0.03, 0.01, '#F2273A', [x, 0.93, -0.30]);                                                                // the red "ROADSTER" headrest light
  }
  for (const z of [0.0, -0.5, -1.0]) V.box(2 * glassHW(z) - 0.10, 0.004, 0.01, '#2A211C', [0, roofY(z) + 0.004, z]);   // the three roof glass seams (the T-top suggestion; the glass is fixed)

  // ---- front: splitter lip, raked chin slab, the dark louvre intake, the camera dot, the lateral slits
  V.add(hullGeo(sym([[0.63, 0.47, 2.368], [0.64, 0.47, 2.30], [0.665, 0.33, 2.358], [0.665, 0.33, 2.25], [0.58, 0.19, 2.335], [0.58, 0.19, 2.20]])), NOSE);   // the dark chin panel under the nose bar: flush with the hood's bottom edge, the lower corners chamfered
  V.add(hullGeo(sym([[0.70, 0.105, 2.10], [0.70, 0.135, 2.10], [0.66, 0.105, 2.36], [0.66, 0.135, 2.36], [0.50, 0.105, 2.405], [0.50, 0.135, 2.405], [0.30, 0.105, 2.405], [0.30, 0.135, 2.405]])), CARBON);   // the thin full-width splitter lip with chamfered front corners
  V.box(1.10, 0.07, 0.03, '#0B0C0E', [0, 0.385, 2.352]);
  for (const y of [0.36, 0.385, 0.41]) V.box(1.06, 0.008, 0.01, '#1B1D21', [0, y, 2.367]);
  V.sph(0.012, '#0B0C0E', [0, 0.445, 2.37], 6);
  for (const sd of [-1, 1]) V.box(0.10, 0.04, 0.012, '#3A3C42', [sd * 0.62, 0.30, 2.37]);                               // front lateral slits (the L1 / L2 stubs)

  // ---- rear: the black bumper bar that carries the nozzles, the diffuser box with its strakes, the four fan recesses, the four gold-ringed nozzles, the charge port, the down-jet stubs
  V.box(1.88, 0.07, 0.10, CARBON, [0, 0.55, -2.22]);
  V.add(hullGeo(sym([[0.81, 0.56, -2.265], [0.81, 0.56, -1.97], [0.80, 0.17, -1.97], [0.76, 0.17, -2.19], [0.78, 0.23, -2.265], [0.81, 0.40, -2.265]])), CARBON);   // the diffuser: a tapered block whose underside ramps up toward the tail, the fans sit in its face
  for (const x of [-0.40, 0, 0.40]) V.box(0.02, 0.30, 0.30, '#07080A', [x, 0.38, -2.125]);
  for (const x of [-0.60, -0.20, 0.20, 0.60]) {
    V.cyl(0.095, 0.095, 0.02, '#07080A', [x, 0.30, -2.272], [Math.PI / 2, 0, 0], 14);
    for (let k = 0; k < 4; k++) V.box(0.15, 0.012, 0.012, '#2A2C31', [x, 0.30, -2.286], [0, 0, k * Math.PI / 4]);          // the fan blades
  }
  for (const n of S.exhaust) {
    V.cyl(0.062, 0.062, 0.07, RING, [n.x, 0.50, -2.255], [Math.PI / 2, 0, 0], 16);
    V.cyl(0.045, 0.045, 0.075, BORE, [n.x, 0.50, -2.257], [Math.PI / 2, 0, 0], 12);
  }
  V.box(0.08, 0.08, 0.02, '#0B0C0E', [0.78, 0.84, -2.25]);
  for (const sd of [-1, 1]) {
    V.box(0.10, 0.03, 0.07, '#0B0C0E', [sd * 0.95, 0.15, 0.95]);
    V.box(0.10, 0.03, 0.07, '#0B0C0E', [sd * 0.95, 0.15, -1.98]);
  }

  // ================================================================================== lamps (emissive): nose bar + triangular headlights + amber markers (white), tail bar + corner wraps + markers (red)
  LH.box(1.22, 0.030, 0.03, '#ffffff', [0, 0.485, 2.372]);                                                              // the full-width nose bar (the width of the hood's bottom edge)
  for (const sd of [-1, 1]) LH.box(0.05, 0.05, 0.03, '#ffffff', [sd * 0.64, 0.46, 2.36]);                              // the front corner markers
  const xs = (z) => HW * (1 - 0.36 * Math.pow((z - 1.4) / 0.96, 2));
  for (const sd of [-1, 1]) {
    const fy = (z) => hoodY(z) + 0.018, tri = [[xs(1.98) - 0.03, fy(1.98), 1.98], [xs(2.27) - 0.03, fy(2.27), 2.27], [hoodX(2.27) + 0.045, fy(2.27) - 0.002, 2.27]];
    LH.add(hullGeo(tri.flatMap((p) => [[sd * p[0], p[1], p[2]], [sd * p[0], p[1] - 0.012, p[2]]])), '#EAF2FF');          // the triangular headlight: a lit notch lying on the fender top, its point aimed at the hood
    LH.box(0.10, 0.02, 0.012, '#FF9A1A', [sd * 0.958, 0.70, 0.95]);                                                     // amber side marker behind the front arch
    LT.box(0.03, 0.026, 0.10, '#ffffff', [sd * 0.925, 0.855, -2.20]);                                                   // the tail bar wraps 6 cm round each corner
    LT.box(0.02, 0.03, 0.12, '#7A1A1A', [sd * 0.995, 0.62, -1.9]);                                                      // rear side marker on the flare
  }
  V.box(1.90, 0.075, 0.02, '#0B0C0E', [0, 0.855, -2.248]);                                                              // the black housing band of the tail bar
  LT.box(1.86, 0.026, 0.02, '#ffffff', [0, 0.855, -2.265]);                                                             // the full-width red bar (93 % of the width)

  // ================================================================================== driver: upper body behind the yoke (hidden in the cockpit view); strictly one occupant is seen
  const jacket = '#2b3a67';
  DR.box(0.40, 0.46, 0.24, jacket, [0.36, 0.62, 0.0], [-0.4, 0, 0]);
  for (const sd of [-1, 1]) DR.rod([0.36 + sd * 0.21, 0.78, 0.12], [0.36 + sd * 0.16, 0.70, 0.74], 0.05, jacket, 6);
  DR.sph(0.115, '#e8b894', [0.36, 1.04, -0.10], 8);
  DR.sph(0.122, '#3a2a22', [0.36, 1.07, -0.14], 8, [1, 0.8, 1]);

  // ================================================================================== wheels: two geometries (front / rear), a white aero disc with six wide tapered black spokes (titanium and bronze edge strips). Rim detail on +X; the right side is mirrored.
  const wheelGeo = (R, tw) => {
    const WV = new VB(0), X = [0, 0, Math.PI / 2];
    WV.cyl(R, R, tw, TYRE, [0, 0, 0], X, 36);
    WV.cyl(R * 0.90, R * 0.90, tw + 0.012, TYRE_STEP, [0, 0, 0], X, 36);                                                // the thin sidewall step
    WV.cyl(R * 0.835, R * 0.835, tw + 0.020, RIM, [0, 0, 0], X, 36);                                                    // the bright thin rim lip
    WV.cyl(R * 0.80, R * 0.80, tw + 0.026, DISC, [0, 0, 0], X, 36);                                                     // the white aero disc
    const x0 = tw / 2 + 0.0135;
    // six wide black blades, narrow at the hub and broad at the rim, trailing 0.22 rad (a prism of 8 corners each); the titanium edge strip and the bronze inner strip run ALONG the two long edges of each blade
    // (f0..f1 = the lateral span of the strip as a fraction of the blade half width, -1 = one edge, +1 = the other)
    const blade = (a0, r0, h0, r1, h1, tw1, th, x, color, f0 = -1, f1 = 1, t0 = 0, t1 = 1) => {                      // t0..t1: the part of the blade's length the piece covers
      const pts = [];
      for (const t of [t0, t1]) { const r = r0 + (r1 - r0) * t, h = h0 + (h1 - h0) * t, a = a0 + tw1 * t; for (const f of [f0, f1]) for (const xx of [x, x + th]) pts.push([xx, Math.cos(a) * r - Math.sin(a) * h * f, Math.sin(a) * r + Math.cos(a) * h * f]); }
      WV.add(hullGeo(pts), color);
    };
    for (let k = 0; k < 6; k++) {
      const a0 = k * Math.PI / 3, ro = R * 0.79;
      blade(a0, 0.05, 0.030, ro, 0.046, 0.05, 0.016, x0, SPOKE);
      blade(a0, 0.05, 0.030, ro, 0.046, 0.05, 0.0035, x0 + 0.0165, TITAN, 0.84, 1.0, 0.0, 1.0);
      blade(a0, 0.05, 0.030, ro, 0.046, 0.05, 0.0035, x0 + 0.0165, BRONZE, -1.0, -0.78, 0.0, 0.62);
    }
    WV.cyl(0.055, 0.055, tw + 0.07, CAP, [0, 0, 0], X, 10);
    return WV.build();
  };
  const wheelMat = liftShade(mat.toon('#ffffff', { vertexColors: true, paint: 0.02, name: 'drive-wheel' }), SHADE_LIFT, ctx.shared.uNight);
  const gF = wheelGeo(RF, TWF), gR = wheelGeo(RR, TWR);
  const wheels = [];
  for (const [sx, z, front] of [[1, AXLE, true], [-1, AXLE, true], [1, -AXLE, false], [-1, -AXLE, false]]) {
    const R = front ? RF : RR;
    const pivot = new THREE.Group(); pivot.position.set(sx * (front ? TRACK_F : TRACK_R) / 2, R, z);
    const m = new THREE.Mesh(front ? gF : gR, wheelMat); m.castShadow = true; m.scale.x = sx; m.name = 'drive-wheel';
    pivot.add(m); wheels.push({ pivot, mesh: m, front, k: S.R / R });                                                   // k: the spin correction of this axle (p.spin is radians for the mean radius)
  }

  // ================================================================================== meshes
  const body = new THREE.Mesh(V.build(), liftShade(mat.toon('#ffffff', { vertexColors: true, paint: 0.02, name: 'drive-body' }), SHADE_LIFT, ctx.shared.uNight));
  body.castShadow = true; body.receiveShadow = true; body.name = 'drive-body';
  const glassBase = mat.glass({ tint: '#594536', opacity: 0.32, streaks: true });
  const glassMat = glassBase.clone();
  glassMat.fragmentShader = glassBase.fragmentShader.replace('0.35 + 0.45 * fres', '0.16 + 0.55 * fres').replace('smoothstep(-0.1, 0.6, R.y));', 'smoothstep(-0.1, 0.6, R.y)); sky = vec3(dot(sky, vec3(0.3, 0.55, 0.15))) * vec3(1.28, 1.0, 0.78) * 0.45;').replace('streak * 0.55', 'streak * 0.20');   // bronze, never blue: the sky it reflects is turned into warm luminance
  if (ctx.shared.uSkyMid) { glassMat.uniforms.uSkyTop = ctx.shared.uSkyMid; glassMat.uniforms.uSkyLow = ctx.shared.uSkyLow; }
  const glass = new THREE.Mesh(G.build(), glassMat); glass.name = 'drive-glass'; glass.renderOrder = 2;
  const headMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, name: 'drive-head' });
  const tailMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, name: 'drive-tail' });
  const lampH = new THREE.Mesh(LH.build(), headMat), lampT = new THREE.Mesh(LT.build(), tailMat);
  headMat.color.setScalar(0.9); tailMat.color.set(1.1, 0.10, 0.08);
  const driver = new THREE.Mesh(DR.build(), mat.toon('#ffffff', { vertexColors: true, paint: 0.02, name: 'drive-driver' }));

  const root = new THREE.Group(); root.name = 'drive-car'; root.rotation.order = 'YXZ';
  root.add(body, glass, lampH, lampT, driver);
  for (const w of wheels) root.add(w.pivot);

  // ---- plate: ONE rear plate only (the prototype has no front plate)
  const plateMat = mat.toon('#ffffff', { map: plateTexture(plate), paint: 0, name: 'drive-plate' });
  const pr = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.113), plateMat); pr.position.set(0, 0.66, -2.262); pr.rotation.y = Math.PI; root.add(pr);

  // ---- the Bibliotechka logo on the roof glass (the house rule: every garage car carries it); the damage module bends it with the roof
  const roofLogo = createRoofLogo(ctx, root, { w: 0.55, y: roofY(-0.10) + 0.006, z: -0.10, tilt: 0 });

  // ---- the wing: a white blade with a dark top skin on two struts and two swept end-plate fences; flush on the deck at rest, up and back at speed / under thrust (not deformed by the damage module)
  const wingGroup = new THREE.Group(); wingGroup.name = 'drive-wing';
  const WG = new VB(0);
  WG.box(1.80, 0.022, 0.44, '#C9CAD0', [0, 0, 0]);
  WG.box(1.78, 0.004, 0.42, '#6B6D73', [0, 0.013, 0]);
  WG.box(1.78, 0.004, 0.42, '#A08274', [0, -0.013, 0]);
  const SG = new VB(0);                                                                                                  // the two struts (a unit tall each: the group scales them with the deployment)
  for (const sd of [-1, 1]) SG.rod([sd * 0.10, -1, 0.0], [sd * 0.10, 0.0, 0.0], 0.018, PILLAR, 6);
  const wingMesh = new THREE.Mesh(WG.build(), mat.toon('#ffffff', { vertexColors: true, paint: 0.02, name: 'drive-wing' })); wingMesh.castShadow = true;
  const FV = new VB(0);
  for (const sd of [-1, 1]) FV.add(hullGeo([[sd * 0.90, 0, 0.22], [sd * 0.90, 0, -0.22], [sd * 0.90, 0.30, -0.22], [sd * 0.895, 0, 0.22], [sd * 0.895, 0, -0.22], [sd * 0.895, 0.30, -0.22]]), '#C9CAD0');
  const fences = new THREE.Mesh(FV.build(), wingMesh.material); fences.position.y = 0.011;
  const struts = new THREE.Mesh(SG.build(), wingMesh.material); struts.position.y = -0.01;
  wingGroup.add(wingMesh, fences, struts); wingGroup.position.set(0, deckY(-2.0) + 0.03, -2.04); root.add(wingGroup);

  // ---- the cold-gas plumes (4): a pale blue-white core + a wider soft halo (lathe bulbs that fade out along the length), one mesh per nozzle; NO orange anywhere
  const plumeGeo = (() => {                                                                                              // a lathe of 16 sides: a narrow throat that swells into a rounded cloud and closes at the tip, the colour fades to black along the length (additive: it dissolves)
    const mk = (prof, col) => {
      const g = new THREE.LatheGeometry(prof.map(([r, t]) => new THREE.Vector2(r, t)), 16); g.rotateX(-Math.PI / 2);
      g.deleteAttribute('uv'); g.deleteAttribute('normal'); const n = g.attributes.position.count, a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const t = Math.min(1, -g.attributes.position.getZ(i)), f = Math.pow(1 - t, 0.8) * (0.35 + 0.65 * Math.min(1, t * 6)); a[i * 3] = col[0] * f; a[i * 3 + 1] = col[1] * f; a[i * 3 + 2] = col[2] * f; }
      g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g.toNonIndexed();
    };
    return mergeGeometries([mk([[0.04, 0], [0.08, 0.12], [0.11, 0.35], [0.09, 0.65], [0.04, 0.9], [0, 1]], [0.80, 0.90, 1.0]), mk([[0.07, 0], [0.14, 0.15], [0.19, 0.4], [0.16, 0.7], [0.07, 0.93], [0, 1]], [0.20, 0.27, 0.36])]);
  })();
  const flameMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, name: 'drive-flame' });
  const flames = [];
  for (const n of S.exhaust) { const f = new THREE.Mesh(plumeGeo, flameMat); f.position.set(n.x, n.y, n.z - 0.045); f.visible = false; f.scale.set(1, 1, 0.01); root.add(f); flames.push(f); ctx.noOutline(f); }
  // ---- the down-jets of a hop (4 white columns behind the wheels): built hidden, shown only while p.jet > 0
  const jetGeo = new THREE.ConeGeometry(0.09, 1, 8, 1, true); jetGeo.rotateX(Math.PI); jetGeo.translate(0, -0.5, 0);
  const jetMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.92, 0.95, 1.0), transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, name: 'drive-jet' });
  const downJets = [];
  for (const [x, z] of [[0.95, 0.95], [-0.95, 0.95], [0.95, -1.98], [-0.95, -1.98]]) { const j = new THREE.Mesh(jetGeo, jetMat); j.position.set(x, 0.17, z); j.visible = false; root.add(j); downJets.push(j); ctx.noOutline(j); }
  // ---- the side streaks of a max hop (4 thin cyan-white cold-gas cores on the flanks, built hidden, shown only while the barrel roll turns and a side jet pulses): the plume lathe laid along +/- x, thin, 0.4 - 1.8 m long: the white particle streams of fx.js carry the look, these cores only make them read as jets
  const streaks = [], streakMat = flameMat.clone(); streakMat.opacity = 0.5; streakMat.name = 'drive-streak';
  for (const [nx, ny, nz] of SIDE_NOZZLES) for (const sd of [1, -1]) {
    const m = new THREE.Mesh(plumeGeo, streakMat); m.position.set(sd * nx, ny, nz); m.rotation.y = sd > 0 ? -Math.PI / 2 : Math.PI / 2; m.visible = false; m.scale.set(0.3, 0.3, 0.01); root.add(m); ctx.noOutline(m);
    streaks.push({ mesh: m, side: sd > 0 ? 0 : 1 });
  }
  // ---- the pale-blue ground glow under thrust (the real car has none otherwise) and the head-lamp pool on the road (night)
  const glowMat = new THREE.MeshBasicMaterial({ map: glowTexture(), color: new THREE.Color(0.55, 0.75, 1.0), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, name: 'drive-roadster-glow' });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 5.8), glowMat); glow.rotation.x = -Math.PI / 2; glow.position.set(0, 0.06, -3.2); root.add(glow); ctx.noOutline(glow);
  const beamMat = new THREE.MeshBasicMaterial({ map: beamTexture(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, name: 'drive-roadster-beam' });
  const beamGeo = new THREE.PlaneGeometry(6.8, 17); beamGeo.rotateX(-Math.PI / 2);
  const beam = new THREE.Mesh(beamGeo, beamMat); beam.position.set(0, 0.05, S.front + 8.5); root.add(beam); ctx.noOutline(beam);
  root.traverse((o) => { if (o.isMesh && o !== glow) o.frustumCulled = false; });
  for (const m of [lampH, lampT, driver]) m.castShadow = false;

  // ================================================================================== COCKPIT (cars/roadster/interior.js)
  // the cockpit set of camera mode 2: shell, red ambient strip, screen and the yoke; the yoke (cockpit.wheel) is also the exterior steering wheel, seen through the glass; setView swaps the exterior parts in `outer` for it
  const cockpit = createRoadsterCockpit(ctx, S, PAINT);
  root.add(cockpit.group);
  const steerWheel = cockpit.wheel; root.add(steerWheel);

  const night = ctx.shared.uNight, cp = { steer: 0, kmh: 0, rpm: 0, gear: 'N', night: 0, boost: 0, dt: 0.016 };       // cp: the cockpit's per-frame parameters (one object, nothing allocated per frame)
  let boostK = 0, wingK = 0, inside = false, flipShown = 0;
  const _e = new THREE.Euler(0, 0, 0, 'YXZ'), _o = new THREE.Vector3();
  // damage (drive/damage.js) bends only the body mesh: the wing follows the crushed tail (read from the body's bounding box, which damage.sync recomputes) and vanishes with it
  body.geometry.computeBoundingBox();
  const minZ0 = body.geometry.boundingBox.min.z;
  const outer = [body, glass, lampH, lampT, roofLogo, pr, wingGroup];
  const api = {
    root, wheels, steerWheel, driver, flames, glow, headMat, tailMat, body, glass, cockpit, spec: S, wing: wingGroup, downJets, exhaust: S.exhaust,
    /** pose: x y z yaw (rotY) pitchUp roll; steer in -1..1 (+ = left); roll the wheels by `spin` radians since the last call; brake / boost / lights 0..1; optional hop: jet 0..1 */
    set(p) {
      const dt = p.dt || 0.016, hop = Math.max(0, p.jet || 0);
      // HOP v3: the barrel hop's roll (p.flip, radians) turns the model about its long axis through the middle of the body (the cockpit view stays level: the camera is derived from this root)
      const px = -p.pitch - 0.07 * hop;
      let ft = inside ? 0 : (p.flip || 0); ft -= 2 * Math.PI * Math.round(ft / (2 * Math.PI));                              // the shortest equivalent angle: a finished roll (2 pi) is level
      if (inside) flipShown = 0;                                                                                          // the cockpit camera is derived from this root: never a trace of roll there
      if (ft === 0 && flipShown !== 0) { flipShown *= Math.exp(-18 * dt); if (Math.abs(flipShown) < 0.002) flipShown = 0; }  // an early landing eases the roll out instead of snapping
      else flipShown = ft;
      root.position.set(p.x, p.y, p.z); root.rotation.set(px, p.yaw, p.roll + flipShown);
      if (flipShown !== 0) { _e.set(px, p.yaw, 0, 'YXZ'); _o.set(FLIP_PIVOT * Math.sin(flipShown), FLIP_PIVOT * (1 - Math.cos(flipShown)), 0).applyEuler(_e); root.position.add(_o); }
      for (const st of streaks) { const k = flipShown !== 0 && !inside ? (st.side === 0 ? p.s0 : p.s1) || 0 : 0; st.mesh.visible = k > 0.08; if (st.mesh.visible) { const f = 1 + 0.12 * Math.sin(61 * performance.now() / 1000 + st.side * 2); st.mesh.scale.set(0.3, 0.3, (0.4 + 1.4 * k) * f); } }
      const del = p.steerAngle, sp = p.spin;
      for (const w of wheels) { if (w.front) w.pivot.rotation.y = del; w.mesh.rotation.x += sp * w.k; }
      steerWheel.rotation.z = p.steer * 2.2;
      const n = night ? night.value : 0;
      if (inside && cockpit) { cp.steer = p.steer; cp.kmh = p.kmh || 0; cp.rpm = p.rpm ?? 0.15; cp.gear = p.gear || 'N'; cp.night = n; cp.boost = p.boost || 0; cp.dt = dt; cockpit.update(cp); }
      headMat.color.setScalar(p.lights ? 1.0 + 1.5 * n : 1.0);                                                          // the nose bar is on in daylight
      const br = p.brake > 0.05 ? Math.min(2.6, 2.4 + 0.5 * n) : 1.1, bk = p.brake > 0.05;                              // the tail bar is always lit like the real one
      tailMat.color.set(br, br * (bk ? 0.1 : 0.09), br * (bk ? 0.08 : 0.07));
      beamMat.opacity = p.lights ? Math.min(0.75, 0.9 * n) : 0; beam.visible = beamMat.opacity > 0.01;
      // thrust: a valve (fast on, faster off); the plumes shorten when the tank is nearly empty
      const on = p.boost > 0.05 ? 1 : 0;
      boostK += (on - boostK) * Math.min(1, dt * (on ? 9 : 14));
      const tank = on ? Math.max(0.4, Math.min(1, ((p.boost || 0) - 0.2) / 0.15)) : 1, k = boostK * tank, tt = performance.now() / 1000;
      for (let i = 0; i < flames.length; i++) {
        const fl = flames[i], fk = 1 + 0.10 * Math.sin(53 * tt + i) + 0.06 * Math.sin(31 * tt + 2 * i);
        fl.visible = boostK > 0.04; fl.scale.set(0.5 + 0.5 * k, 0.5 + 0.5 * k, (0.1 + 0.9 * k) * 1.7 * fk);               // the plume is 1 m long at scale 1: up to 1.7 m
      }
      glowMat.opacity = 0.55 * boostK * (0.35 + n); glow.visible = glowMat.opacity > 0.01;
      // the wing: up and back above ~90 km/h or under thrust (5/s), down at 2/s; hidden when the tail is crushed
      const want = (p.kmh || 0) > 90 || p.boost > 0.05 ? 1 : 0;
      wingK += (want - wingK) * Math.min(1, dt * (want ? 5 : 2));
      wingGroup.position.y = deckY(-2.0) + 0.03 + 0.16 * wingK; wingGroup.position.z = -2.04 - 0.06 * wingK; wingGroup.rotation.x = -5 * DEGS * wingK; fences.scale.y = 0.12 + 0.88 * wingK; struts.scale.y = 0.02 + 0.20 * wingK;
      const bb = body.geometry.boundingBox, sag = bb ? Math.max(0, bb.min.z - minZ0) : 0, crushed = sag > 0.3;
      wingGroup.position.z += sag; wingGroup.visible = !inside && !crushed;                                            // up to 0.3 m of crush the wing follows the tail, beyond it vanishes
      const dj = hop, jk = p.jetK || 1, rolled = Math.abs(flipShown) > 0.5;                                                          // the cold-gas columns of a hop (the simple hop short ones, the barrel hop fat long ones); absent for plain driving
      for (const j of downJets) { j.visible = dj > 0.02 && !rolled; if (j.visible) j.scale.set(1 + 0.25 * (jk - 1), (0.4 + 1.2 * dj) * (1 + 0.3 * (jk - 1)), 1 + 0.25 * (jk - 1)); }      // (not while the car is rolled over: the particle columns of fx.js fire straight down on their own)
    },
    /** camera mode 2 (cockpit): the exterior shell, glass, lamps, plate, roof decal and wing are replaced by the cockpit set (roadster/interior.js); the wheel meshes and the yoke stay */
    setView(v) {
      inside = !!v; driver.visible = !inside;
      for (const o of outer) o.visible = !inside;
      if (cockpit) cockpit.setVisible(inside);
    },
  };
  return api;
}
