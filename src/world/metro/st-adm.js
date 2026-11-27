// metro/st-adm.js — Admiralteyskaya (line 5, -86 m, the deepest station of Russia; docs/research/metro-west.md section 5, photos refs/metro-west 01-25, 100, 101).
//   hall     column-wall station: the engine's pylon hall (central hall 8.8 m, 22 pylons per side every 6 m, round 3.4 m arches) with black FLUTED COLUMNS with brass bases / capitals on the pylon faces,
//            cream-pink Gazgan pylons, bronze portrait medallions over white benches, a white panel vault with thin gold rope ribs, grey-blue marble track walls on a black plinth with a PURPLE band, bronze doors
//            with an anchor, floor of pale grey-green granite with gold chevron lines and compass roses, the end mosaic "Founding of the Admiralty" (ships under plain sails: NO flags), purple pill signs.
//   escalators  the big incline (4 lanes, 68.7 m rise, 119 m of run + landings, tall ogive tube) from the vestibule inside the corner house Malaya Morskaya 4 / Kirpichny per.; at its foot a 125 m GALLERY with a
//            U-turn (hairpin) returns to the small incline (15.2 m rise) that lands axially at the east end of the hall.  The whole chain is walkable and moving.
//   vestibule  a hall in the chamfered corner of w52153127 behind the two glass doors of the chamfer (DOORWAYS admiralteyskaya-in / -in2), black fluted columns, the oval silver ceiling dish with the wind rose, the
//            gold-smalt mosaic over the escalator mouth, white parapets, ticket machines.
// Everything is built in the frames of data/metro.js (FRAMES.admiralteyskaya, ESC2.adm1 / adm2).
import * as THREE from 'three';
import { FRAMES, ESC2, DOORWAYS, AD_PZ, toWorld } from '../data/metro.js';
import { Space, extrudeZ, archRing, floorGeo, smoothPath, minRadius } from './lib.js';
import { buildPylonHall, PYLON } from './hall-pylon.js';
import { buildEscalator } from './escalator.js';
import { endPlate } from './plate.js';
import { buildStub, STUB_VISIBLE } from './stubs.js';
import { buildPolyRoom } from './proom.js';
import { createPlatform } from './platform.js';
import { makeSigns } from './signs.js';

const FONT = '"Rubik","Noto Sans",sans-serif', SERIF = '"Noto Serif","Times New Roman",serif';
const CHAMFER = [[-2030.2, -413.8], [-2025.0, -406.3]];

export function buildAdmiralteyskaya(ctx, M, X) {
  const { mat, tex } = ctx;
  const AD = FRAMES.admiralteyskaya, PZ = AD_PZ, FY = AD.y, C = PYLON.C, WALL = PYLON.WALL, TRK = PYLON.TRK;
  const name = 'Адмиралтейская', nameEn = 'Admiralteyskaya', purple = '#7a1fd0';
  const E1 = ESC2.adm1, E2 = ESC2.adm2;
  const res = {};

  // ================================================================ textures
  const rose = tex.draw(512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h); const cx = w / 2, cy = h / 2;
    g.fillStyle = '#e9e2d0'; g.beginPath(); g.arc(cx, cy, 250, 0, 7); g.fill();
    g.strokeStyle = '#c79a3a'; g.lineWidth = 8; g.beginPath(); g.arc(cx, cy, 246, 0, 7); g.stroke(); g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, 214, 0, 7); g.stroke();
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8, long = i % 4 === 0, mid = i % 2 === 0, r = long ? 196 : mid ? 150 : 104, wd = long ? 0.2 : 0.16;
      g.fillStyle = i % 4 === 0 ? '#8e1f2e' : mid ? '#1e3a5e' : '#f4f1ea'; g.strokeStyle = '#1e3a5e'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + r * Math.cos(a - wd), cy + r * Math.sin(a - wd)); g.lineTo(cx + (r + 24) * Math.cos(a), cy + (r + 24) * Math.sin(a)); g.lineTo(cx + r * Math.cos(a + wd), cy + r * Math.sin(a + wd)); g.closePath(); g.fill(); g.stroke();
    }
    g.fillStyle = '#c79a3a'; g.font = `700 36px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const [t, a] of [['С', -Math.PI / 2], ['В', 0], ['Ю', Math.PI / 2], ['З', Math.PI]]) g.fillText(t, cx + 232 * Math.cos(a), cy + 232 * Math.sin(a));
  }, { key: 'adm-rose' });
  const chevron = tex.draw(64, 128, (g, w, h) => {
    g.fillStyle = '#c9c8b8'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c79a3a'; g.lineWidth = 7; g.lineJoin = 'miter';
    for (let y = 8; y < h; y += 32) { g.beginPath(); g.moveTo(6, y + 16); g.lineTo(w / 2, y); g.lineTo(w - 6, y + 16); g.stroke(); }
    g.fillStyle = '#c79a3a'; g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h);
  }, { key: 'adm-chevron' });
  const doorTex = tex.draw(128, 256, (g, w, h) => {
    g.fillStyle = '#c9a24b'; g.fillRect(0, 0, w, h); g.fillStyle = '#7d6428'; g.fillRect(7, 7, w - 14, h - 14);
    g.fillStyle = '#c9a24b'; for (let x = 20; x < w - 12; x += 14) g.fillRect(x, 16, 4, h - 32);
    g.fillStyle = '#1b1612'; for (let x = 18; x < w - 12; x += 14) g.fillRect(x + 4, 16, 3, h - 32);
    g.strokeStyle = '#e8c868'; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, h * 0.5, 34, 0, 7); g.stroke();
    g.fillStyle = '#e8c868'; g.fillRect(w / 2 - 2, h * 0.5 - 24, 4, 44); g.fillRect(w / 2 - 14, h * 0.5 - 14, 28, 4); g.beginPath(); g.arc(w / 2, h * 0.5 - 24, 4, 0, 7); g.stroke(); g.beginPath(); g.arc(w / 2, h * 0.5 + 10, 16, 0.2, Math.PI - 0.2); g.stroke();
  }, { key: 'adm-door' });
  const mosaic = tex.draw(1024, 380, (g, w, h) => {
    const r = ctx.rng('adm-mosaic');
    g.fillStyle = '#c9a24b'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,230,150,0.25)' : 'rgba(120,80,20,0.2)'; g.fillRect(r() * w, r() * h, 6, 6); }
    g.fillStyle = '#5d8fb8'; g.fillRect(24, 24, w - 48, h * 0.62); g.fillStyle = '#9cc4de'; g.fillRect(24, 24, w - 48, h * 0.25);
    g.fillStyle = '#2c5f86'; g.fillRect(24, h * 0.62 + 24 - 60, w - 48, 60); for (let x = 30; x < w - 30; x += 26) { g.strokeStyle = '#8fb7d4'; g.lineWidth = 3; g.beginPath(); g.arc(x, h * 0.62 - 20, 12, 0.2, Math.PI - 0.2); g.stroke(); }
    // the Admiralty: a long pale building with the gilded spire in the middle
    g.fillStyle = '#e6d9a8'; g.fillRect(w * 0.33, h * 0.38, w * 0.34, h * 0.14); g.fillStyle = '#d3c186'; for (let x = w * 0.34; x < w * 0.66; x += 22) g.fillRect(x, h * 0.40, 8, h * 0.1);
    g.fillStyle = '#e6d9a8'; g.fillRect(w * 0.47, h * 0.26, w * 0.06, h * 0.14); g.fillStyle = '#d9b84a'; g.beginPath(); g.moveTo(w * 0.5, 40); g.lineTo(w * 0.515, h * 0.26); g.lineTo(w * 0.485, h * 0.26); g.closePath(); g.fill();
    const ship = (cx, base, s, hull) => { g.fillStyle = hull; g.beginPath(); g.moveTo(cx - 70 * s, base); g.lineTo(cx + 74 * s, base); g.lineTo(cx + 54 * s, base + 24 * s); g.lineTo(cx - 52 * s, base + 24 * s); g.closePath(); g.fill();
      g.strokeStyle = '#3a2a18'; g.lineWidth = 4 * s; for (const dx of [-34, 4, 40]) { g.beginPath(); g.moveTo(cx + dx * s, base); g.lineTo(cx + dx * s, base - 118 * s); g.stroke(); }
      g.fillStyle = '#f4efe2'; for (const [dx, hh] of [[-34, 96], [4, 118], [40, 90]]) { g.beginPath(); g.moveTo(cx + (dx - 28) * s, base - 6 * s); g.quadraticCurveTo(cx + dx * s, base - hh * 0.6 * s, cx + (dx - 26) * s, base - hh * s); g.lineTo(cx + (dx + 26) * s, base - hh * s); g.quadraticCurveTo(cx + (dx + 4) * s, base - hh * 0.5 * s, cx + (dx + 26) * s, base - 6 * s); g.closePath(); g.fill(); } };
    ship(w * 0.17, h * 0.63, 1.5, '#6a4a2c'); ship(w * 0.82, h * 0.6, 1.25, '#7a5530'); ship(w * 0.62, h * 0.74, 0.7, '#6a4a2c');
    g.fillStyle = '#6a4a2c'; g.beginPath(); g.moveTo(w * 0.31, h * 0.78); g.lineTo(w * 0.40, h * 0.78); g.lineTo(w * 0.385, h * 0.83); g.lineTo(w * 0.325, h * 0.83); g.closePath(); g.fill(); g.fillStyle = '#c0392b'; g.beginPath(); g.arc(w * 0.35, h * 0.745, 11, 0, 7); g.fill();
    g.strokeStyle = '#a07a2a'; g.lineWidth = 14; g.strokeRect(10, 10, w - 20, h - 20);
  }, { key: 'adm-mosaic' });
  const decal = (map) => mat.decal('#ffffff', { map });
  const roseMat = decal(rose);
  const stripTex = chevron.clone(); stripTex.needsUpdate = true; stripTex.wrapS = stripTex.wrapT = THREE.RepeatWrapping; stripTex.repeat.set(1, 2 * PZ / 1.0);
  const stripMat = mat.toon('#ffffff', { map: stripTex });
  const vaultWhite = mat.toon('#f4f2ec', { side: 'double' });

  // ================================================================ the hall
  const S = new Space(ctx, AD, { name: 'admiralteyskaya' });
  const hall = buildPylonHall(ctx, M, S, {
    id: 'adm', FY, PZ, name, nameEn, noMeander: true, plain: true, vaultMat: vaultWhite,
    endHole: { S: { halfW: 3.6, spring: 1.0 } },
    skin: { pylon: { plaster: '#ead6b8', marble: '#dcc19c', vein: '#d2b48a', plinth: '#1c1c1e', corn: '#f4eee0' }, track: { plaster: '#f2f0ea', marble: '#a5abb0', vein: '#e8ecee', skirt: '#1c1c1e', corn: '#f4f1ea' }, floor: '#bdbcb2', sideFloor: '#d9d2c0', floorSpeck: ['rgba(60,70,60,0.22)', 'rgba(255,255,250,0.35)', null] },
  });
  const k = S.k;
  for (const m of hall.mouths) buildStub(ctx, M, S, m.sx * TRK, m.zs * (PZ + 0.6), m.zs, hall.BED, {});      // black-disc stubs at both ends (the real tunnels to Sportivnaya / Sadovaya are outside the strip: a ride jumps into the generic tunnel)
  // columns, medallions, benches, info plates on the pylon faces
  for (const sx of [-1, 1]) for (const [i, z] of hall.pylonZ.slice(1, -1).entries()) {
    const cx = sx * (C - 0.3), face = sx * (C - 0.03);
    k.cyl(0.38, 0.4, 0.28, M.brass, [cx, FY + 0.14, z], null, 12);
    k.cyl(0.27, 0.29, 3.05, M.columnBlack, [cx, FY + 0.28 + 1.525, z], null, 10);
    for (const f of [-1, 1]) k.box(0.05, 3.0, 0.07, M.columnBlack, [cx + f * 0.0, FY + 1.8, z + f * 0.0], [0, Math.PI / 5, 0]);
    k.cyl(0.46, 0.3, 0.46, M.brass, [cx, FY + 0.28 + 3.05 + 0.23, z], null, 12);
    S.col(cx - 0.3, cx + 0.3, FY - 0.2, FY + 4.0, z - 0.3, z + 0.3);
    const dz = (i % 2 ? -1 : 1) * 0.85;
    k.cyl(0.5, 0.5, 0.04, M.gold, [face - sx * 0.01, FY + 1.75, z + dz], [0, 0, Math.PI / 2], 20);
    k.cyl(0.42, 0.42, 0.07, M.bronze, [face - sx * 0.05, FY + 1.75, z + dz], [0, 0, Math.PI / 2], 20);
    k.box(0.55, 0.46, 1.4, M.marbleWhite, [sx * (C - 0.3), FY + 0.23, z + dz]); S.col(sx * (C - 0.3) - 0.3, sx * (C - 0.3) + 0.3, FY, FY + 0.5, z + dz - 0.7, z + dz + 0.7);
    k.box(0.04, 0.8, 0.55, M.white, [face, FY + 1.45, z - dz * 0.95]);
  }
  // gold rope ribs over the pylons, a lit cove under them
  { const rib = extrudeZ(archRing(C - 0.03, hall.SPC, 0.1, hall.SPC, 0, 24), -0.07, 0.07); for (const z of hall.pylonZ.slice(1, -1)) { const m = new THREE.Mesh(rib, M.gold); m.position.z = z; m.castShadow = false; S.group.add(m); } }
  // floor: gold chevron lines along the colonnade foot, three compass roses
  for (const sx of [-1, 1]) { const p = k.plane(0.8, 2 * PZ - 6, stripMat, [sx * 3.7, FY + 0.03, 0], [-Math.PI / 2, 0, 0]); p.castShadow = false; p.receiveShadow = false; }
  for (const z of [-40, 0, 40]) { const p = k.plane(3.4, 3.4, roseMat, [0, FY + 0.035, z], [-Math.PI / 2, 0, 0]); p.castShadow = false; }
  // purple bands (white lettering) on the arcade cornice, the track-wall bands, bronze letters, bronze doors
  const band = M.board(M.nameBoard(name, nameEn, purple, 'adm-band'), 1.0), bronzeTex = M.bronzeName(name, 'adm-bronze', { fill: '#8b7b52' }), doorMat = mat.toon('#ffffff', { map: doorTex });
  for (const sx of [-1, 1]) {
    for (let z = -PZ + 14; z < PZ - 10; z += 24) { const p = k.plane(3.4, 0.36, band, [sx * (C - 0.065), FY + 3.78, z], [0, sx > 0 ? -Math.PI / 2 : Math.PI / 2, 0]); p.castShadow = false; }
    const fx = sx > 0 ? WALL - 0.2 : -WALL + 0.2, rotY = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
    for (let z = -PZ + 12; z < PZ - 8; z += 24) { const p = k.plane(3.6, 0.46, band, [fx, FY + 2.05, z], [0, rotY, 0]); p.castShadow = false; }
    for (let z = -PZ + 24; z < PZ - 20; z += 24) { const p = k.plane(6.2, 0.5, mat.decal('#ffffff', { map: bronzeTex }), [fx - sx * 0.01, FY + 2.75, z], [0, rotY, 0]); p.castShadow = false; }
    for (let z = -PZ + 24; z < PZ - 20; z += 24) { const p = k.plane(1.1, 1.85, doorMat, [fx - sx * 0.02, FY + 0.95, z + 12], [0, rotY, 0]); p.castShadow = false; }
  }
  // the end mosaic and the purple hanging signs of the west end
  { const f = k.plane(5.6, 2.7, M.board(mosaic, 0.9), [0, FY + 3.7, -PZ + 0.04], [0, 0, 0]); f.castShadow = false;
    k.box(5.9, 0.12, 0.08, M.gold, [0, FY + 5.12, -PZ + 0.06]); k.box(5.9, 0.12, 0.08, M.gold, [0, FY + 2.32, -PZ + 0.06]); k.box(0.12, 2.9, 0.08, M.gold, [-2.9, FY + 3.72, -PZ + 0.06]); k.box(0.12, 2.9, 0.08, M.gold, [2.9, FY + 3.72, -PZ + 0.06]);
    for (const [x, t, s] of [[-2.2, 'Спортивная', 'Sportivnaya'], [2.2, 'Садовая', 'Sadovaya']]) { const p = k.plane(2.6, 0.62, M.board(M.blueBoard(t, s, x < 0 ? 'r' : 'l', 'adm-pill-' + x, { bg: purple }), 1.0), [x, FY + 1.7, -PZ + 0.12], [0, 0, 0]); p.castShadow = false; } }
  // ---------------------------------------------------------------- Petersburg wayfinding (signs.js kit; docs/research/metro-wayfinding.md): purple hanging boards, linear schemes on the track walls, the network map
  //   The hall already draws the track-wall name bands (purple boards with white lettering, dossier section 5), so signs.trackBand is NOT used here.  Nothing stands on a track bed; boards hang at FY + 3.2.
  {
    const sg = makeSigns(ctx, M), LINE = '5', BH = 0.62, BY = FY + 3.2;
    const exitE = { streets: [['Малая Морская улица', 'Malaya Morskaya street'], ['Кирпичный переулок', 'Kirpichny lane'], ['Невский проспект', 'Nevsky prospekt']], esc: true };
    // one one-sided board; rods run up to the central vault (R = C about SPC); `side` offsets back-to-back pairs so the casings do not overlap
    const board = (z, rotY, sections) => {
      const L = sg.textures.hangBoard(sections, { w: BH }).length, bx = Math.min(L / 2 - 0.4, L * 0.32), vault = hall.SPC + Math.sqrt(C * C - bx * bx);
      return sg.hangBoard(S, { x: 0, y: BY, z: z + (rotY === 0 ? 0.065 : -0.065), rotY, sections, w: BH, both: false, rodLen: vault - (BY + BH / 2) + 0.04 });
    };
    const trS = (arrow) => sg.sec.trains(LINE, +1, arrow), trN = (arrow) => sg.sec.trains(LINE, -1, arrow);       // S track (x = -TRK) runs toward +z = Sadovaya / Shushary; N track (x = +TRK) toward -z = Komendantsky Prospekt
    // east end (the escalator landing, z = +PZ): the exit board faces the platform (-z), the landing board faces the arriving passengers (+z): the two tracks on the left / right, the rules of the escalator side
    const zE = PZ - 6.5;
    board(zE, Math.PI, [sg.sec.exit(exitE, 'u', true)]);
    board(zE, 0, [trS('l'), sg.sec.rules('right'), trN('r')]);
    // hall centre, over the benches: the trains of each side (a viewer walking west has the S track on the left, walking east the N track), the way out in the east direction
    board(6, 0, [trS('l'), trN('r')]);
    board(6, Math.PI, [trN('l'), sg.sec.city('u', true), trS('r')]);
    // west end (the tunnel mouths and the mosaic): the same pair seen from the end of the platform
    const zW = -PZ + 7;
    board(zW, 0, [trS('l'), trN('r')]);
    board(zW, Math.PI, [sg.sec.exit(exitE, 'r', true)]);
    // linear schemes on both track walls between the purple name boards (z = -55.5 + 24 n), the doors (+12) and the bronze letters: the way ahead is on the side the trains of THAT track head to
    for (const [sx, rotY, travelZ] of [[-1, Math.PI / 2, +1], [1, -Math.PI / 2, -1]])
      for (const z of [-43.5, 4.5, 28.5]) sg.lineScheme(S, { x: sx * (WALL - 0.152), y: FY + 1.6, z, rotY, line: LINE, currentId: 'admiralteyskaya', dir: travelZ, ahead: sg.aheadOf(rotY, travelZ) });
    // the network map on the west end wall between the two purple pills, at eye height
    sg.networkMap(S, { x: 0, y: FY + 1.45, z: -PZ + 0.002, rotY: 0, w: 1.5 });
  }
  const vInfo = { openings: hall.openings, FY, TRK, EDGE: PYLON.EDGE, PZ, mouth: PZ + 0.6, discNeg: PZ + 0.6 + STUB_VISIBLE, discPos: PZ + 0.6 + STUB_VISIBLE, activeRadius: 260 };

  // ================================================================ the lower pocket + the small incline (lands axially at the east end)
  const Se2 = new Space(ctx, E2.eframe, { name: 'adm-esc2' });
  const esc2 = buildEscalator(ctx, M, Se2, { FY, yTop: E2.yTop, zTop: 0, zBottom: E2.run, mouth: false, lanes: E2.lanes, halfW: E2.A, bv: E2.bv });
  endPlate(Se2, M, { A: E2.A, bv: E2.bv, y: E2.yTop, z0: -0.5, z1: 0, halfW: 3.9, spring: 0.9, floor: true });
  {
    const zPocketEnd = (() => { const z = Se2.L(...toWorld(AD, 0, PZ + 0.6))[1]; return z; })();         // the plane of the hall's east end cap, in the escalator frame
    const ring = extrudeZ(archRing(E2.A, 1.0, 0.5, -1.4, 0, 36, E2.bv), E2.run - 0.6, zPocketEnd + 0.4);
    { const p = ring.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + FY); ring.computeVertexNormals(); ring.computeBoundingSphere(); }
    const m = new THREE.Mesh(ring, M.plasterVault); Se2.group.add(m);
    const fl = new THREE.Mesh(floorGeo(-E2.A, E2.A, E2.run - 0.3, zPocketEnd + 0.4, FY, 0.5), mat.toon('#ffffff', { map: M.T.granite('adm-pocket', '#bdbcb2', 'rgba(60,70,60,0.22)', 'rgba(255,255,250,0.35)') })); Se2.group.add(fl);
    Se2.walk(-E2.A, E2.A, E2.run - 0.3, zPocketEnd + 1.2, FY, 1.1);
    Se2.col(E2.A - 0.1, E2.A + 0.7, FY - 1.2, FY + 8, E2.run - 0.3, zPocketEnd + 0.5); Se2.col(-E2.A - 0.7, -E2.A + 0.1, FY - 1.2, FY + 8, E2.run - 0.3, zPocketEnd + 0.5);
    // a lit blue glass panel with the winged figures over the escalator mouth is drawn on the hall side: the foot-of-incline arch (photo 02)
  }

  // ================================================================ the big incline (street -> -68.7 m) and its lower plate
  const Se1 = new Space(ctx, E1.eframe, { name: 'adm-esc1' });
  const esc1 = buildEscalator(ctx, M, Se1, { FY: E1.FY, zTop: 0, zBottom: E1.run, shellStart: 12, lanes: E1.lanes, halfW: E1.A, bv: E1.bv });
  endPlate(Se1, M, { A: E1.A, bv: E1.bv, y: E1.FY, z0: E1.run - 0.5, z1: E1.run, halfW: 3.9, spring: 0.9 });
  // the hairpin gallery: F1 -> straight -> U-turn (R 13, to the right) -> back west -> the top of the small incline
  const F1 = [E1.bottom.x, E1.bottom.z], e1 = E1.e, right = [-e1[1], e1[0]], Rr = 13, P1 = [F1[0] + e1[0] * 8, F1[1] + e1[1] * 8];
  const Cc = [P1[0] + Rr * right[0], P1[1] + Rr * right[1]], arc = [];
  for (const ph of [Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75, Math.PI]) arc.push([Cc[0] + Rr * (-Math.cos(ph) * right[0] + Math.sin(ph) * e1[0]), Cc[1] + Rr * (-Math.cos(ph) * right[1] + Math.sin(ph) * e1[1])]);
  const P2 = arc[arc.length - 1], T = [E2.head.x, E2.head.z], tAdm = [-E2.e[0], -E2.e[1]], Tapp = [T[0] + tAdm[0] * 22, T[1] + tAdm[1] * 22];
  const mid = [(P2[0] + Tapp[0]) / 2 - e1[0] * 0, (P2[1] + Tapp[1]) / 2];
  const Te = [T[0] + tAdm[0] * 0.5, T[1] + tAdm[1] * 0.5], gal = smoothPath([F1, P1, ...arc, mid, Tapp, Te], e1, E2.e, 2.5);
  const gl = [0]; for (let i = 1; i < gal.length; i++) gl.push(gl[i - 1] + Math.hypot(gal[i][0] - gal[i - 1][0], gal[i][1] - gal[i - 1][1]));
  const y0g = E1.FY, y1g = E2.yTop, galPts = gal.map((p, i) => [p[0], y0g + (y1g - y0g) * gl[i] / gl[gl.length - 1], p[1]]);
  // the last metre ends at the plate of the small incline (z = -0.5 in its frame)
  X.debug.radii.admGallery = minRadius(gal); X.debug.admGalleryLen = gl[gl.length - 1];
  const grp = X.mkGroup('admiralteyskaya-gallery');
  X.cor('admiralteyskaya-gallery', grp, galPts, { w: 8, h: 2.8, rise: 1.8 });

  // ================================================================ the vestibule (the chamfered corner of Malaya Morskaya 4 / Kirpichny per.)
  const Sv = new Space(ctx, E1.eframe, { name: 'adm-vestibule', tag: null, zone: 'adm-vestibule-fx' });
  const kv = Sv.k, wv = Sv.W.bind(Sv);
  const polyL = [[-7, -3], [7.8, -3], [8.4, 2.5], [8.7, 8], [9.0, 13.0], [9.7, 14.1], [3.1, 21.0], [-7, 21.0]];                 // e1-local plan (inside the house; the 4th-5th vertices run 0.4 m inside the chamfer wall; checked by tools/metro-test)
  const poly = polyL.map(([x, z]) => wv(x, z));
  const dxC = CHAMFER[1][0] - CHAMFER[0][0], dzC = CHAMFER[1][1] - CHAMFER[0][1], lC = Math.hypot(dxC, dzC);
  const doors = DOORWAYS.filter((d) => d.station === 'admiralteyskaya').map((d) => ({ x: d.x, z: d.z, w: d.w, h: 3.3, arch: true }));
  const holeL = [[-E1.A, 0], [E1.A, 0], [E1.A, 13], [-E1.A, 13]].map(([x, z]) => wv(x, z));
  const wallTex = mat.toon('#ffffff', { map: tex.draw(256, 256, (g, w, h) => { g.fillStyle = '#e1d0aa'; g.fillRect(0, 0, w, h); const r = ctx.rng('adm-vwall'); for (let i = 0; i < 200; i++) { g.fillStyle = r() < 0.5 ? 'rgba(160,120,70,0.10)' : 'rgba(255,250,235,0.12)'; g.fillRect(r() * w, r() * h, 10 + r() * 40, 4 + r() * 12); } g.strokeStyle = 'rgba(120,90,50,0.35)'; g.lineWidth = 2; for (let y = 0; y <= h; y += 51.2) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } for (let x = 0; x <= w; x += 77) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } }, { key: 'adm-vwall' }), side: 'double' });
  const room = buildPolyRoom(ctx, M, { id: 'adm-vest', poly, ceil: 5.2, doors, holes: [holeL], wallMat: (() => { wallTex.map.wrapS = wallTex.map.wrapT = THREE.RepeatWrapping; wallTex.map.repeat.set(1 / 2.4, 1 / 2.4); return wallTex; })(), ceilMat: mat.toon('#cfd4d8', { side: 'double' }),
    floorMat: mat.toon('#ffffff', { map: M.T.granite('adm-vfloor', '#3a3c40', 'rgba(255,255,255,0.18)', 'rgba(0,0,0,0.3)', { joint: 'rgba(255,255,255,0.12)' }) }), lamps: { step: 4.2, mat: M.lampWarm, size: [1.2, 0.6], rot: -E1.yaw + Math.PI / 2 } });
  res.room = room;
  // the oval ceiling dish (brushed silver) with the wind rose, a gold-olive cove ring, white round lamps
  { const cy = 5.2 - 0.04, dish = new THREE.Mesh(new THREE.CircleGeometry(1, 48), mat.toon('#ffffff', { map: rose, side: 'double' })); dish.scale.set(4.6, 4.6, 1); dish.rotation.x = Math.PI / 2; dish.position.set(0, cy - 0.01, 6.5); Sv.group.add(dish);
    const ringS = new THREE.Shape(); ringS.absellipse(0, 0, 6.6, 6.6, 0, 6.2832, false); const holeS = new THREE.Path(); holeS.absellipse(0, 0, 5.2, 5.2, 0, 6.2832, true); ringS.holes.push(holeS);
    const ring = new THREE.Mesh(new THREE.ShapeGeometry(ringS, 40), M.goldEm); ring.rotation.x = Math.PI / 2; ring.position.set(0, cy - 0.03, 6.5); Sv.group.add(ring);
    const silver = new THREE.Mesh(new THREE.CircleGeometry(5.2, 48), mat.toon('#c9ced2', { side: 'double' })); silver.rotation.x = Math.PI / 2; silver.position.set(0, cy - 0.02, 6.5); Sv.group.add(silver); }
  // black fluted columns along the walls
  const col = (x, z) => { kv.cyl(0.36, 0.38, 0.22, M.brass, [x, 0.16, z], null, 12); kv.cyl(0.31, 0.33, 3.6, M.columnBlack, [x, 2.0, z], null, 10); kv.cyl(0.42, 0.33, 0.42, M.brass, [x, 4.0, z], null, 12); Sv.col(x - 0.34, x + 0.34, -1, 5, z - 0.34, z + 0.34); };
  for (const z of [1, 5.5, 10, 14.5]) col(-6.2, z);
  // the mosaic over the escalator mouth (west wall), white parapets round the shaft, the exit marker
  { const p = kv.plane(6.6, 2.5, M.board(mosaic, 0.95), [0, 3.3, -2.9], [0, 0, 0]); p.castShadow = false; kv.box(6.9, 0.14, 0.1, M.gold, [0, 4.6, -2.88]); kv.box(6.9, 0.14, 0.1, M.gold, [0, 2.0, -2.88]); kv.box(0.14, 2.7, 0.1, M.gold, [-3.4, 3.3, -2.88]); kv.box(0.14, 2.7, 0.1, M.gold, [3.4, 3.3, -2.88]); }
  for (const sx of [-1, 1]) { kv.box(0.35, 1.0, 12.4, M.marbleWhite, [sx * (E1.A - 0.1), 0.55, 6.7]); Sv.col(sx * (E1.A - 0.1) - 0.2, sx * (E1.A - 0.1) + 0.2, -1, 1.1, 0.5, 13); for (let z = 1.5; z < 13; z += 3) kv.cyl(0.14, 0.14, 0.45, M.lampCylinder, [sx * (E1.A - 0.1), 1.2, z], null, 8); }
  kv.box(2 * E1.A, 1.0, 0.35, M.marbleWhite, [0, 0.55, 13.0]); Sv.col(-E1.A, E1.A, -1, 1.1, 12.8, 13.2);
  // ticket machines on the south wall
  for (const z of [8, 11, 14]) { const x = -6.45; kv.box(0.6, 1.9, 0.9, M.kiosk, [x, 1.0, z]); kv.box(0.05, 0.5, 0.7, M.lampCool, [x + 0.3, 1.45, z]); Sv.col(x - 0.35, x + 0.35, -1, 2.2, z - 0.5, z + 0.5); }
  X.addVestZone('adm-vestibule', room.inside, 9);

  // ================================================================ the surface: door frames, the name board and a cube lamp on the chamfer corner (the house itself is the city module's)
  {
    const u = [dxC / lC, dzC / lC], nOut = [dzC / lC, -dxC / lC], rotY = Math.atan2(nOut[0], nOut[1]);
    const g = new THREE.Group(); g.name = 'adm-signs'; ctx.addStatic(g); const kg = ctx.kit(g);
    const mid2 = [CHAMFER[0][0] + dxC * 0.5 + nOut[0] * 0.2, CHAMFER[0][1] + dzC * 0.5 + nOut[1] * 0.2];
    const nameSign = kg.plane(5.6, 0.62, M.board(M.nameBoard(name, nameEn, purple, 'adm-out-name'), 1.0), [mid2[0], 4.1, mid2[1]], [0, rotY, 0]); nameSign.castShadow = false;
    const cube = [CHAMFER[1][0] + nOut[0] * 0.4 + u[0] * 0.6, CHAMFER[1][1] + nOut[1] * 0.4 + u[1] * 0.6];
    kg.box(0.5, 0.08, 0.08, M.steelBlack, [cube[0], 3.9, cube[1]], [0, rotY, 0]); kg.box(0.5, 0.5, 0.5, M.lampWhite, [cube[0] + nOut[0] * 0.3, 4.1, cube[1] + nOut[1] * 0.3], [0, rotY, 0]);
    const ms = X.mSign(); for (const f of [1, -1]) { const p = kg.plane(0.44, 0.44, ms, [cube[0] + nOut[0] * (0.3 + 0.26 * f), 4.1, cube[1] + nOut[1] * (0.3 + 0.26 * f)], [0, rotY + (f > 0 ? 0 : Math.PI), 0]); p.castShadow = false; }
  }

  // ================================================================ the station object (platform, trains), exit route for the tests
  const rt = X.rtOf('admiralteyskaya', X.net.admiralteyskaya, AD, vInfo, null);
  rt.platform = createPlatform(ctx, M, { id: 'admiralteyskaya', name: X.net.admiralteyskaya.name, nameEn, frame: AD, stock: '717-l5', line: '5', idx: X.net.admiralteyskaya.idx }, vInfo, X.protos, {
    onArrive: () => X.toast('Станция «Адмиралтейская». Выход к Дворцовой, Исаакиевской и Сенатской площадям'),
  });
  X.stations.admiralteyskaya = rt;
  // the way out for the tests (platform -> pavement: through the pocket, up the small incline, along the gallery, up the big incline, round the shaft, out of the chamfer door)
  res.exitRoute = (debug) => {
    const rev = (name) => debug.corridors.find((c) => c.name === name).pts.slice().reverse().filter((_, i, a) => i % 4 === 0 || i === a.length - 1).map((p) => [p[0], p[2]]);
    const W1 = (x, z, tol) => { const q = Se1.W(x, z); return tol ? [q[0], q[1], tol] : q; }, W2 = (x, z, tol) => { const q = Se2.W(x, z); return tol ? [q[0], q[1], tol] : q; };
    const d = DOORWAYS.find((q) => q.id === 'admiralteyskaya-in'), nx = Math.sin(d.rotY), nz = Math.cos(d.rotY);
    const points = [toWorld(AD, 0, 50), toWorld(AD, 0, PZ - 1), W2(1, E2.run + 3.5), W2(1, E2.run - 2, 0.3), W2(1, 12, 0.3), W2(1, 1, 0.3), ...rev('admiralteyskaya-gallery'),
      W1(1, E1.run + 2), W1(1, E1.run - 3, 0.3), W1(1, 60, 0.3), W1(1, 6, 0.3), W1(1, -1.5), W1(6.6, -1.5), W1(6.9, 3), W1(7.1, 9), W1(7.4, 13.5), [d.x - nx * 0.5, d.z - nz * 0.5], [d.x + nx * 3.5, d.z + nz * 3.5]];
    return { start: [...toWorld(AD, 0, -40), FY], points, door: [d.x, d.z], out: [d.x + nx * 3.5, d.z + nz * 3.5], outward: [nx, nz] };
  };
  res.S = S; res.hall = hall; res.esc1 = esc1; res.esc2 = esc2; res.Se1 = Se1; res.Se2 = Se2; res.gallery = galPts; res.room = room;
  return res;
}
