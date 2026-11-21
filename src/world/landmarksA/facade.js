// landmarksA/facade.js - the street front of the Moscow Railway Station (K. Thon, 1851): the 69.8 m central block (11 bays: 2 drive-through gateways at the
// ends, 9 round arches with a pair of arched windows and an oculus each, the middle three are the doors; two stacked orders of engaged Corinthian columns; paired
// first-floor windows with white surrounds; deep modillion cornice and parapet), the two curved wings, the dark roofs with chimneys and the roof lettering
// "МОСКОВСКИЙ ВОКЗАЛ".  Photos: SP/refs/station 02 (frontal), 51 (aerial), 82 (tower + arches), 05-06; spec docs/research/station.md "Modelling spec".
// Frame: station frame of common.js (u along the facade, d into the building).  Heights: plinth 1.0, ground storey to 8.3, impost 8.7, upper storey to 15.85,
// cornice top 17.5, parapet 18.5; wings: cornice 14.4.  Colliders: the facade line is solid except the three doors and the two gateways.
import * as THREE from 'three';
import { Parts, TH, W, wbox, C, archPath, rectPath, makeCommon, O } from './common.js';
import { hipRoof } from './geom.js';
import { styledWalls } from './walls.js';
import { windowTex, archWinTex, lettersTex } from './tex.js';
import { C as COL } from './common.js';

export const PITCH = 6.145;
export const PU = (k) => -33.8 + k * PITCH;
export const BAY_C = (k) => -33.8 + (k + 0.5) * PITCH;
const BAYS = 11, GATEWAYS = [0, 10], DOORS = [4, 5, 6];
const PL = 1.0, G1 = 8.3, IMP = 8.7, UP = 15.85, CORN = 17.5, PAR = 18.5;
const WAY = 3.95;          // clear width of an arch
export const WING_H = 14.4;

// west wing / east wing rings in the station frame [u, d] (OSM r2404499 measured at O); the closing edge runs along the central block
export const WING_W = [[-34.9, 2.7], [-46.2, 2.5], [-58.1, 10.3], [-64.8, 22.3], [-50.3, 30.5], [-46.1, 22.9], [-40.2, 19.4], [-34.9, 19.4]];
export const WING_E = [[34.9, 2.0], [47.0, 2.4], [58.6, 7.4], [67.7, 17.0], [55.1, 28.5], [49.2, 23.2], [41.7, 20.2], [34.9, 20.1]];

function archShape(w, hs, y0) { const s = new THREE.Shape(); archPath(s, w, hs, 0, y0); return s; }

export function buildFacade(Cc) {
  const { ctx, M, T } = Cc;
  const P = new Parts();
  const winMat = T('#ffffff', { map: windowTex(ctx), paint: 0 });
  const winLit = Cc.lit('win', windowTex(ctx), windowTex(ctx, true), 1.0);                    // lit windows at night (warm emissive map)
  Cc.winMat = winMat; Cc.winLit = winLit;
  const archMat = Cc.lit('arch', archWinTex(ctx), archWinTex(ctx, true), 1.0);
  // floodlit walls at night (wall washers): warm emissive on the stucco, stronger on the white trim
  const N = Cc.night; N.toon(M.stucco, '#ffd49a', 0.42); N.toon(M.wing, '#ffd49a', 0.42); N.toon(M.panel, '#ffd49a', 0.4); N.toon(M.stuccoShade, '#ffcf90', 0.4);
  N.toon(M.trim, '#fff0d2', 0.78); N.toon(M.trimShade, '#ffe2b8', 0.5); N.toon(M.plinth, '#ffd49a', 0.18); N.toon(M.plinthDark, '#ffd49a', 0.15); N.toon(M.chimney, '#ffd49a', 0.3);
  // rusticated granite plinth (blocks 1 m x 0.5 m)
  const rustTex = ctx.tex.draw(128, 128, (g, w, h) => { const r = ctx.rng('st-rust'); g.fillStyle = '#8c8d8a'; g.fillRect(0, 0, w, h); for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const o = (j % 2) * 0.5; const t = 0.92 + r() * 0.16; g.fillStyle = `rgb(${Math.round(142 * t)},${Math.round(143 * t)},${Math.round(139 * t)})`; g.fillRect(((i + o) % 1) * w + 2, j * h / 2 + 2, w - 4, h / 2 - 4); } g.strokeStyle = 'rgba(60,62,60,0.7)'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.moveTo(w / 2, 0); g.lineTo(w / 2, h / 2); g.moveTo(0, h / 2); g.moveTo(0, h / 2); g.stroke(); }, { key: 'st_rust', repeat: [1, 1] });
  const plinthM = N.toon(T('#ffffff', { map: rustTex, name: 'st-plinthrust', paint: 0.03 }), '#ffd49a', 0.18);
  const dark = T('#241f1a', { paint: 0 });                      // interior seen through the doors / gateways
  const cream = T('#e9d9b4', { paint: 0.03 });                  // downpipes
  const steps = T('#9a9893');

  // ================================================================ central block: core box (visible only from the sides / above)
  P.box(M.stucco, -34.9, 34.9, G1, PAR, 0.3, 19.4, 'n');          // upper mass: the front is made of the panels below
  // ground floor: bays
  for (let k = 0; k < BAYS; k++) {
    const uc = BAY_C(k), gate = GATEWAYS.includes(k), door = DOORS.includes(k);
    // panel with the arch opening
    const sh = new THREE.Shape(); rectPath(sh, -PITCH / 2, 0, PITCH / 2, G1);
    const open = (gate || door) ? 0 : PL, hs = (gate || door) ? 4.35 : 3.35;
    sh.holes.push(archPath(new THREE.Path(), WAY, hs, 0, open, true));
    P.extrude(M.stucco, sh, gate ? 19.4 : 0.9, uc, 0, 0);
    // archivolt (white ring, projects 0.14 m)
    const ring = new THREE.Shape(); archPath(ring, WAY + 0.9, hs + 0.0, 0, open - (open ? 0.0 : 0));
    ring.holes.push(archPath(new THREE.Path(), WAY, hs, 0, open, true));
    P.extrude(M.trim, ring, 0.14, uc, 0, -0.14);
    if (!gate) {
      // window plate (textured) at the back of the reveal, 2 cm in front of the plane z = 0.9
      const y0 = PL, y1 = PL + 3.35 + WAY / 2;
      if (door) {
        // plate with the door opening cut out (2.7 x 2.9 m)
        const pl = new THREE.Shape(); rectPath(pl, -WAY / 2, 0, WAY / 2, y1);
        const hole = new THREE.Path(); rectPath(hole, -1.35, 0, 1.35, 2.9, true); pl.holes.push(hole);
        const g = new THREE.ShapeGeometry(pl);
        const pos = g.attributes.position, uv = g.attributes.uv;
        // vertical mapping: the texture bottom is the sill (y = PL for window bays); at doors the same texture is used from y = PL up
        for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); uv.setXY(i, (pos.getX(i) + WAY / 2) / WAY, Math.max(0, (y - PL)) / (y1 - PL)); }
        // faces +z by default: flip so that it faces outward (-z) = rotate by PI about y
        P.geo(archMat, g, uc, 0, 0.88, 0, Math.PI, 0); g.dispose();
        // door reveal frame (white) and two leaves swung open against the reveal
        P.box(M.trim, uc - 1.35 - 0.12, uc - 1.35, 0, 2.9, 0.6, 0.9, 'sr'); P.box(M.trim, uc + 1.35, uc + 1.35 + 0.12, 0, 2.9, 0.6, 0.9, 'sl');
        P.box(M.trim, uc - 1.35, uc + 1.35, 2.9, 3.05, 0.6, 0.9, 'b');
        P.box(M.door, uc - 1.33, uc - 1.33 + 0.07, 0.05, 2.75, 0.12, 0.12 + 1.3);       // open leaves (look like swung inward against the vestibule wall)
        P.box(M.door, uc + 1.33 - 0.07, uc + 1.33, 0.05, 2.75, 0.12, 0.12 + 1.3);
        // brass sign over the door: "ВХОД"
        const vt = T('#ffffff', { map: ctx.tex.sign({ w: 256, h: 80, bg: '#2a1d14', fg: '#e8c878', text: 'ВХОД', size: 54, key: 'st_vhod', font: '"Noto Serif", serif', border: 5, borderColor: '#b99a52' }), paint: 0, emissive: '#3a3020', emissiveIntensity: 0.5 });
        P.quad(vt, [uc + 0.55, 3.15, 0.84], [uc - 0.55, 3.15, 0.84], [uc - 0.55, 3.5, 0.84], [uc + 0.55, 3.5, 0.84], [0, 0, -1], [[1, 0], [0, 0], [0, 1], [1, 1]].map(([a, b]) => [1 - a, b]));
      } else {
        const h = y1 - y0;
        P.quad(archMat, [uc + WAY / 2, y0, 0.88], [uc - WAY / 2, y0, 0.88], [uc - WAY / 2, y1, 0.88], [uc + WAY / 2, y1, 0.88], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]].map(([a, b]) => [1 - a, b]).map(([a, b]) => [a, b]));
        // window sill (granite)
        P.box(M.granite, uc - WAY / 2 - 0.1, uc + WAY / 2 + 0.1, PL - 0.05, PL + 0.12, 0.0, 0.95, 'b');
      }
    } else {
      // gateway: iron-grey tunnel floor shadow; a dark far end is not needed (the tunnel is open to the courtyards)
    }
  }
  // end half piers
  P.box(M.stucco, -34.9, -33.8, 0, G1, 0, 0.9, 'r'); P.box(M.stucco, 33.8, 34.9, 0, G1, 0, 0.9, 'l');

  // ================================================================ plinth (granite)
  const PW = (PITCH - WAY) / 2;
  P.box(plinthM, -34.9, -33.8, 0, PL, -0.32, 0.9);
  P.box(plinthM, 33.8, 34.9, 0, PL, -0.32, 0.9);
  for (let k = 0; k < BAYS; k++) {
    const a = PU(k), b = PU(k + 1);
    if (GATEWAYS.includes(k) || DOORS.includes(k)) { P.box(plinthM, a, a + PW, 0, PL, -0.32, 0.9, 'r'); P.box(plinthM, b - PW, b, 0, PL, -0.32, 0.9, 'l'); }
    else P.box(plinthM, a, b, 0, PL, -0.32, 0.0, 'bl');
  }
  // plinth top moulding
  for (let k = 0; k < BAYS; k++) { const a = PU(k), b = PU(k + 1); if (GATEWAYS.includes(k) || DOORS.includes(k)) { P.box(M.plinthDark, a, a + PW, PL, PL + 0.1, -0.36, 0.0, 'b'); P.box(M.plinthDark, b - PW, b, PL, PL + 0.1, -0.36, 0.0, 'b'); } else P.box(M.plinthDark, a, b, PL, PL + 0.1, -0.36, 0.0, 'b'); }
  // two steps in front of the three doors (granite, 0.12 m each, visual; the player's feet stay at y = 0)
  P.box(M.granite, PU(4) + PW, PU(7) - PW, 0, 0.1, -1.2, -0.3, 'b'); P.box(M.granite, PU(4) + PW + 0.2, PU(7) - PW - 0.2, 0.1, 0.2, -0.8, -0.3, 'b');

  // Thon's two orders share a pier axis. Only the two outer returns are doubled.
  // The survey shows fluting above a collar on the lower third of each shaft.
  for (let k = 0; k <= BAYS; k++) {
    const xs = [PU(k)];
    if (k === 0) xs.push(-34.5);
    if (k === BAYS) xs.push(34.5);
    for (const x of xs) {
      for (const [base, top] of [[PL, G1], [IMP, UP]]) {
        const z = -0.32, collar = base + (top - base) * 0.33;
        P.box(M.trimShade, x - 0.52, x + 0.52, base, base + 0.15, z - 0.48, 0.25);
        P.cyl(M.trim, x, z, base + 0.15, base + 0.38, 0.50, 0.41, 16);
        P.cyl(M.trim, x, z, base + 0.38, top - 0.82, 0.40, 0.35, 24);
        P.cyl(M.trimShade, x, z, collar, collar + 0.09, 0.41, 0.41, 20);
        // Rounded arrises on the exposed half of the engaged shaft.
        for (let i = -4; i <= 4; i++) {
          const angle = i * Math.PI / 10;
          P.cyl(M.trim, x + 0.34 * Math.sin(angle), z - 0.34 * Math.cos(angle),
            collar + 0.14, top - 0.82, 0.048, 0.044, 6);
        }
        P.cyl(M.trim, x, z, top - 0.82, top - 0.25, 0.35, 0.51, 16);
        for (let i = -3; i <= 3; i++) {
          const angle = i * Math.PI / 7;
          P.cyl(M.trimShade, x + 0.37 * Math.sin(angle), z - 0.37 * Math.cos(angle),
            top - 0.72, top - 0.37, 0.085, 0.035, 6);
        }
        P.box(M.trim, x - 0.58, x + 0.58, top - 0.25, top, z - 0.53, 0.24);
      }
    }
  }

  // ================================================================ impost cornice between the two storeys
  P.box(M.trim, -34.9, 34.9, G1, G1 + 0.2, -0.78, 0.0, 'b'); P.box(M.trim, -34.9, 34.9, G1 + 0.2, IMP, -0.5, 0.0, 'b'); P.box(M.trimShade, -34.9, 34.9, G1 - 0.15, G1, -0.2, 0.0, 'b');

  // ================================================================ upper storey: panels with window pairs
  for (let k = 0; k < BAYS; k++) {
    const uc = BAY_C(k);
    const sh = new THREE.Shape(); rectPath(sh, -PITCH / 2, IMP, PITCH / 2, UP);
    for (const s of [-1, 1]) sh.holes.push(rectPath(new THREE.Path(), s * 0.88 - 0.70, 9.65, s * 0.88 + 0.70, 14.05, true));
    P.extrude(M.stucco, sh, 0.3, uc, 0, 0);
    for (const s of [-1, 1]) {
      const x = uc + s * 0.88;
      P.quad(((k * 3 + (s > 0 ? 2 : 0) + 7) % 4) ? winLit : winMat, [x + 0.70, 9.65, 0.28], [x - 0.70, 9.65, 0.28], [x - 0.70, 14.05, 0.28], [x + 0.70, 14.05, 0.28], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]].map(([a, b]) => [1 - a, b]));
    }
    // surround: jambs, lintel, hood, sill, apron frame
    P.box(M.trim, uc - 1.85, uc - 1.58, 9.85, 14.40, -0.1, 0.3, 'r'); P.box(M.trim, uc + 1.58, uc + 1.85, 9.85, 14.40, -0.1, 0.3, 'l');
    P.box(M.trim, uc - 0.1, uc + 0.1, 9.65, 14.05, -0.06, 0.3, 'bt');
    P.box(M.trim, uc - 1.85, uc + 1.85, 14.05, 14.40, -0.1, 0.3, 'b');
    P.box(M.trim, uc - 2.00, uc + 2.00, 14.40, 14.65, -0.4, 0.2); P.box(M.trimShade, uc - 1.95, uc + 1.95, 14.65, 14.77, -0.3, 0.1);
    P.box(M.trim, uc - 1.95, uc + 1.95, 9.42, 9.65, -0.25, 0.3, 'b');
    // apron frame (panel below the sill)
    P.box(M.trim, uc - 1.85, uc + 1.85, 8.95, 9.0, -0.04, 0.02, 'b'); P.box(M.trim, uc - 1.85, uc + 1.85, 9.5, 9.55, -0.04, 0.02, 'b');
    P.box(M.trim, uc - 1.85, uc - 1.80, 9.0, 9.5, -0.04, 0.02, ''); P.box(M.trim, uc + 1.80, uc + 1.85, 9.0, 9.5, -0.04, 0.02, '');
  }

  // ================================================================ entablature: architrave, frieze, modillion cornice, corona, parapet
  P.box(M.trim, -34.9, 34.9, UP, UP + 0.35, -0.22, 0.0, 'b');
  P.box(M.stuccoShade, -34.9, 34.9, UP + 0.35, 16.55, -0.04, 0.0, 'bt');
  P.box(M.trim, -34.9, 34.9, 16.55, 16.75, -0.4, 0.0, 'b');
  for (let u = -34.6; u < 34.7; u += 0.62) P.box(M.trim, u - 0.12, u + 0.12, 16.75, 17.2, -0.82, -0.4, 'b');           // modillions
  P.box(M.trim, -34.9, 34.9, 17.2, 17.5, -1.1, 0.0, '');
  P.box(M.trimShade, -34.9, 34.9, 17.5, 17.62, -0.96, -0.1, 'b');
  // parapet: wall set back, panel fields over each bay, piers over the column pairs
  P.box(M.stucco, -34.9, 34.9, 17.62, PAR, -0.2, 0.9, 'b');
  for (let k = 0; k < BAYS; k++) { const uc = BAY_C(k); P.box(M.panel, uc - 1.9, uc + 1.9, 17.9, 18.35, -0.24, -0.2, 'b'); P.box(M.trim, uc - 1.95, uc + 1.95, 17.86, 17.9, -0.25, -0.2, 'b'); P.box(M.trim, uc - 1.95, uc + 1.95, 18.35, 18.39, -0.25, -0.2, 'b'); }
  for (let k = 0; k <= BAYS; k++) P.box(M.trim, PU(k) - 0.5, PU(k) + 0.5, 17.62, PAR + 0.1, -0.34, 0.0, 'b');
  P.box(M.trim, -34.9, 34.9, PAR, PAR + 0.14, -0.3, 0.9, 'b');

  // iron-and-glass canopies over the three doors with a lamp each
  const glassC = T('#9fbccb', { paint: 0, transparent: true, opacity: 0.45, depthWrite: false, name: 'st-canopy-glass' }); glassC.userData.noOutline = true;
  for (const k of DOORS) {
    const uc = BAY_C(k);
    P.box(M.iron, uc - 1.9, uc + 1.9, 3.72, 3.8, -1.7, -0.1); P.quad(glassC, [uc - 1.9, 3.8, -1.7], [uc + 1.9, 3.8, -1.7], [uc + 1.9, 4.25, -0.1], [uc - 1.9, 4.25, -0.1], [0, 1, -0.3]);
    for (const s of [-1, 1]) P.box(M.iron, uc + s * 1.85 - 0.03, uc + s * 1.85 + 0.03, 3.0, 3.75, -1.65, -1.6, 'bs');
    P.box(M.iron, uc - 1.9, uc + 1.9, 3.8, 3.86, -1.72, -1.66, 'bs');
    const lampG = ctx.mat.emissive('#ffe2a6', 1.0); Cc.night.basic(lampG, 0.7, 1.7);
    P.box(lampG, uc - 0.25, uc + 0.25, 3.62, 3.7, -1.2, -0.7, 't'); P.glow(Cc.halo, uc, 3.3, -0.95, 2.4);
  }
  // ================================================================ downpipes (cream, in front of the wall, at three piers)
  for (const k of [3, 8]) { const u = PU(k) + 1.0; P.cyl(cream, u, -0.12, 1.3, 16.9, 0.07, 0.07, 6, true); }

  // ================================================================ central roof (dark metal hip), chimneys
  const ridgeY = 21.8;
  const rf = M.roof;
  const e0 = [-34.9, 1.2], e1 = [34.9, 1.2], e2 = [34.9, 19.4], e3 = [-34.9, 19.4], r0 = [-26, 9.6], r1 = [26, 9.6];
  const Y0 = PAR + 0.1;
  P.quad(rf, [e0[0], Y0, e0[1]], [e1[0], Y0, e1[1]], [r1[0], ridgeY, r1[1]], [r0[0], ridgeY, r0[1]], [0, 0.93, -0.37]);        // front slope
  P.quad(rf, [e2[0], Y0 - 0.5, e2[1]], [e3[0], Y0 - 0.5, e3[1]], [r0[0], ridgeY, 9.6], [r1[0], ridgeY, 9.6], [0, 0.92, 0.38]);    // rear slope
  P.quad(rf, [e1[0], Y0, e1[1]], [e2[0], Y0 - 0.5, e2[1]], [r1[0], ridgeY, r1[1]], [r1[0], ridgeY, r1[1]], [0.9, 0.4, 0]);
  P.quad(rf, [e3[0], Y0 - 0.5, e3[1]], [e0[0], Y0, e0[1]], [r0[0], ridgeY, r0[1]], [r0[0], ridgeY, r0[1]], [-0.9, 0.4, 0]);
  P.quad(M.stucco, [-34.9, PAR, 1.2], [34.9, PAR, 1.2], [34.9, PAR, 0.9], [-34.9, PAR, 0.9], [0, 1, 0]);
  const chim = (u, d, h = 3.4, base = Y0) => { P.box(M.chimney, u - 0.7, u + 0.7, base, base + h, d - 0.5, d + 0.5, 'b'); P.box(M.trim, u - 0.82, u + 0.82, base + h, base + h + 0.25, d - 0.62, d + 0.62); };
  for (const u of [-30, -18, 18, 30]) chim(u, 5.0, 3.0 + (ridgeY - Y0) * 0.25, Y0 + 0.4);
  chim(-6, 14.5, 3.4, Y0 - 0.2); chim(7, 14.5, 3.4, Y0 - 0.2);

  // ================================================================ wings
  for (const [ring, tag] of [[WING_W, 'w'], [WING_E, 'e']]) wing(P, M, T, ring, winMat, cream, winLit);

  // ================================================================ roof lettering "МОСКОВСКИЙ ВОКЗАЛ"
  const lw = (text, key, u0, u1) => {
    const tex = lettersTex(ctx, text, key);
    const m = Cc.night.toon(T('#ffffff', { map: tex, alphaTest: 0.35, side: 'double', paint: 0, name: 'st-letters-' + key }), '#ffffff', 1.1, 0.5);
    m.userData.noOutline = true;
    const y0 = PAR + 0.25, hh = 2.2, tilt = 0.2, d0 = 2.6;
    P.quad(m, [u1, y0, d0], [u0, y0, d0], [u0, y0 + hh * Math.cos(tilt), d0 + hh * Math.sin(tilt)], [u1, y0 + hh * Math.cos(tilt), d0 + hh * Math.sin(tilt)], [0, 0.2, -1], [[1, 0], [0, 0], [0, 1], [1, 1]].map(([a, b]) => [1 - a, b]));
    P.box(M.ironLight, u0, u1, PAR + 0.16, y0 + 0.1, d0 - 0.1, d0 + 0.18);                                          // base rail
    for (let u = u0 + 1; u < u1; u += 5) P.box(M.ironLight, u - 0.05, u + 0.05, PAR + 0.1, y0 + 1.6, d0 - 0.05, d0 + 0.5);   // stays
  };
  lw('МОСКОВСКИЙ', 'st_l1', 7.5, 34); lw('ВОКЗАЛ', 'st_l2', -34, -7.5);

  const g = new THREE.Group(); g.name = 'station-front'; g.position.set(O.x, 0, O.z); g.rotation.y = TH;
  P.build(g, {});
  // noOutline for the lettering meshes
  g.traverse((o) => { if (o.isMesh && o.material.userData.noOutline) ctx.noOutline(o); });
  ctx.addStatic(g);
  Cc.parts.facadeTris = P.tris;

  // ================================================================ colliders
  const solid = (a, b, d0 = -0.75, d1 = 1.0) => { if (b - a > 0.05) wbox(ctx, a, b, d0, d1); };
  const gW = BAY_C(0), gE = BAY_C(10), gh = WAY / 2;
  solid(-34.9, gW - gh, -0.75, 19.4);                                           // west end pier + gateway west wall
  solid(gW + gh, gW + gh + 0.5, -0.75, 19.4);                                   // gateway east wall (inner)
  solid(gW + gh + 0.5, BAY_C(4) - gh, -0.75, 1.0);                              // windows 1-3 and piers up to the first door
  for (const k of DOORS) {
    const uc = BAY_C(k);
    solid(uc - WAY / 2, uc - 1.35, 0.55, 1.2); solid(uc + 1.35, uc + WAY / 2, 0.55, 1.2);
    if (k < 6) solid(uc + WAY / 2, BAY_C(k + 1) - WAY / 2, -0.75, 1.0);          // pier between two doors
  }
  solid(BAY_C(6) + gh, gE - gh - 0.5, -0.75, 1.0);
  solid(gE - gh - 0.5, gE - gh, -0.75, 19.4);
  solid(gE + gh, 34.9, -0.75, 19.4);
  Cc.parts.doorBays = DOORS.map((k) => BAY_C(k));
  return g;
}

// ====================================================================================================== wings
function wing(P, M, T, ring, winMat, cream, winLit) {
  styledWalls(P, M, ring, WING_H, winMat, { winLit, skip: (a, b) => Math.abs(a[0]) === 34.9 && Math.abs(b[0]) === 34.9, wall: M.wing });
  hipRoof(P, M.roof, ring, WING_H + 0.5, 3.1, 6.0, { cap: true });
  // chimney stacks on the roof of each wing
  const c = ring.reduce((s, p) => [s[0] + p[0] / ring.length, s[1] + p[1] / ring.length], [0, 0]);
  const ox = Math.sign(c[0]);
  for (const [du, dd] of [[8, 14], [18, 13], [-4, 8]]) { P.box(M.chimney, ox * (34.9 + du) - 0.6, ox * (34.9 + du) + 0.6, WING_H + 2.0, WING_H + 5.0, dd - 0.5, dd + 0.5); P.box(M.trim, ox * (34.9 + du) - 0.72, ox * (34.9 + du) + 0.72, WING_H + 5.0, WING_H + 5.22, dd - 0.62, dd + 0.62); }
}
