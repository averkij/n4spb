// metro/st-nevsky.js — Nevsky Prospekt (line 2, -63 m) and the interchange with Gostiny Dvor (docs/research/metro-west.md sections 2-4, photos refs/metro-west 51-80, 104-111).
//   hall      the three-vault PYLON station of 1963: cream plastered pylons whose lower part is faced with 12 stepped bands of polished aluminium ("ribs"), a stainless ledge and a curved "seashell" capital that
//             carries the vault, dark granite floor, RED track walls with a blue ribbon / brass letters / steel-glass grid doors, stainless-edged granite benches, violet-blue pill signs (Kupchino / Parnas).
//   chamber   the transverse chamber at the north end (the common chamber with Gostiny Dvor): brown-grey marble, the arched niche with the Order-of-Lenin medallion, four oval ceiling lights, a turnstile row, the
//             four short escalators that lift to the Gostiny Dvor hall (6-7 m rise), the passage from the Gostiny Dvor stair and the 55 m corridor to the canal exit.
//   exits     (1) the underpass of the 1960s: four granite stair PITS on the Nevsky pavements (1, 2 south; 3, 4 north), the H-shaped tunnels, the cassa hall with turnstiles and the head of the own incline (3 lanes,
//             104 m); (2) the canal exit in the Engelhardt house (Nevsky 30): glass doors in the arch of the turquoise house, a hall with a yellow metal ceiling and a 3-lane incline (63 m deep).
// The Nevsky frame is slid ~12 m along the Gostiny Dvor axis (data/metro.js) so that the chamber meets the escalator bank at the west end of the Gostiny Dvor hall.
import * as THREE from 'three';
import { buildCentralMetroEntrances } from './central-entrances.js';
import { FRAMES, ESC2, DOORWAYS, PITS, NV_CH, NV_PZ, UNDERPASS_Y, toWorld, toLocal } from '../data/metro.js';
import { Space, extrudeX, extrudeZ, archRing, archHole, floorGeo, smoothPath, minRadius } from './lib.js';
import { buildPylonHall, PYLON } from './hall-pylon.js';
import { buildEscalator } from './escalator.js';
import { endPlate } from './plate.js';
import { makeSigns } from './signs.js';
import { buildStub } from './stubs.js';
import { buildPolyRoom } from './proom.js';
import { buildJunction } from './junction.js';
import { createPlatform } from './platform.js';

const FONT = '"Rubik","Noto Sans",sans-serif';

/** a stainless tripod turnstile (kit coordinates, y absolute); returns nothing */
export function turnstile(k, M, x, y, z, rotY = 0, physics = null) {
  k.box(0.16, 1.0, 0.7, M.stainless, [x, y + 0.5, z], [0, rotY, 0]); k.box(0.12, 0.14, 0.5, M.lampGreen, [x, y + 1.05, z], [0, rotY, 0]);
  for (const a of [0, 2.09, 4.19]) k.box(0.04, 0.04, 0.5, M.stainless, [x, y + 0.95, z], [0, rotY + a, 0]);
  void physics;
}

export function buildNevsky(ctx, M, X) {
  const { mat, tex, physics } = ctx;
  const NV = FRAMES.nevsky, GD = FRAMES.gostiny, PZ = NV_PZ, FY = NV.y, C = PYLON.C, WALL = PYLON.WALL, TRK = PYLON.TRK, CH = NV_CH;
  const name = 'Невский проспект', nameEn = 'Nevsky Prospekt', violet = '#5b2fe0', blue = '#2b3fb0';
  const res = {};
  const rep = (t, x, y) => M.rep(t, x, y);

  // ================================================================ textures
  const ribTex = rep(tex.draw(768, 576, (g, w, h) => {
    const ppm = 128, Y = (v) => h - v * ppm;            // v counted from the bottom of the pylon profile (0.5 m below the floor)
    g.fillStyle = '#e6dfcb'; g.fillRect(0, 0, w, h);
    const r = ctx.rng('nv-pylon'); for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? 'rgba(160,140,100,0.06)' : 'rgba(255,255,255,0.10)'; g.fillRect(r() * w, r() * h, 20 + r() * 70, 10 + r() * 40); }
    g.fillStyle = '#9c968a'; g.fillRect(0, Y(1.1), w, 0.6 * ppm);                                              // plinth (floor = v 0.5)
    for (let i = 0; i < 12; i++) { const v0 = 1.1 + i * 0.19; g.fillStyle = i % 2 ? '#d9dcde' : '#b9bdc1'; g.fillRect(0, Y(v0 + 0.19), w, 0.19 * ppm); g.fillStyle = 'rgba(55,60,68,0.6)'; g.fillRect(0, Y(v0 + 0.19), w, 4); }
    g.fillStyle = '#a2a5a8'; g.fillRect(0, Y(3.58), w, 0.12 * ppm); g.fillStyle = '#41444a'; g.fillRect(0, Y(3.46), w, 6);
  }, { key: 'nv-pylon-ribs' }), 1 / 6, 1 / 4.5);
  const ribMat = mat.toon('#ffffff', { map: ribTex });
  const blocks = (key, base, joint, bw = 0.9, bh = 0.6, n = 3) => rep(tex.draw(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h); const r = ctx.rng(key), cw = w / n, ch = h / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'; g.fillRect(i * cw, j * ch, cw, ch); }
    g.strokeStyle = joint; g.lineWidth = 2; for (let j = 0; j <= n; j++) { g.beginPath(); g.moveTo(0, j * ch); g.lineTo(w, j * ch); g.stroke(); } for (let j = 0; j < n; j++) for (let i = 0; i <= n; i++) { const x = i * cw + (j % 2) * cw / 2; g.beginPath(); g.moveTo(x % w, j * ch); g.lineTo(x % w, (j + 1) * ch); g.stroke(); }
  }, { key }), 1 / (bw * n), 1 / (bh * n));
  const chamberWall = mat.toon('#ffffff', { map: blocks('nv-chwall', '#8a7a6c', 'rgba(40,30,25,0.45)'), side: 'double' });
  const oval = (key, text, sub) => tex.draw(640, 160, (g, w, h) => {
    g.fillStyle = '#f1ede0'; tex.roundRect(g, 2, 2, w - 4, h - 4, 70); g.fill(); g.strokeStyle = '#cfc8b4'; g.lineWidth = 4; tex.roundRect(g, 2, 2, w - 4, h - 4, 70); g.stroke();
    g.fillStyle = '#1b2a5c'; g.font = `800 96px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('М', 76, h / 2 + 6);
    tex.fitText(g, text, 320, h * 0.38, 340, 52, FONT, 700); g.globalAlpha = 0.8; tex.fitText(g, sub, 320, h * 0.72, 340, 30, FONT, 500); g.globalAlpha = 1;
    for (const [i, c] of [['2', '#0078c9'], ['3', '#009a49']].entries()) { g.fillStyle = c; tex.roundRect(g, 548 + i * 44 - 20, 48, 36, 36, 9); g.fill(); g.fillStyle = '#fff'; g.font = `700 28px ${FONT}`; g.fillText(i ? '3' : '2', 548 + i * 44 - 2, 68); }
  }, { key });
  const ovalMat = M.board(oval('nv-oval', 'Невский проспект', 'Nevskiy prospekt'), 1.0);
  const gridDoor = tex.draw(128, 256, (g, w, h) => { g.fillStyle = '#2a3036'; g.fillRect(0, 0, w, h); g.fillStyle = '#9fb7c4'; g.globalAlpha = 0.8; for (let y = 10; y < h - 6; y += 24) for (let x = 10; x < w - 6; x += 22) g.fillRect(x, y, 18, 20); g.globalAlpha = 1; }, { key: 'nv-griddoor' });

  // ================================================================ the hall
  const S = new Space(ctx, NV, { name: 'nevsky' });
  const hall = buildPylonHall(ctx, M, S, {
    id: 'nevsky', FY, PZ, name, nameEn, noMeander: true, plain: true, pylonMat: ribMat, vaultMat: mat.toon('#e9e3d3', { side: 'double' }),
    hang: [],                                                                                       // the Kupchino / Parnas pills at z = +-34 are replaced by the to-trains boards of the signs kit (see the wayfinding block)
    endHole: { N: { halfW: 3.3, spring: 0.9 }, S: { halfW: 3.6, spring: 1.0 } },
    skin: { pylon: { plaster: '#e6dfcb', marble: '#e3dcc6' }, track: { plaster: '#ddd5c0', marble: '#8a1b22', vein: '#c5281c', skirt: '#1b1b21', corn: '#2a2c86' }, floor: '#3b3a3a', sideFloor: '#3b3a3a', floorSpeck: ['rgba(255,255,255,0.16)', 'rgba(0,0,0,0.30)', null] },
  });
  const k = S.k, SHORTS = 3.5;
  S.walk(-3.3, 3.3, -PZ - 0.9, -PZ + 0.3, FY, 1.1);                                  // the cap of the south end: a floor between the platform and the corridor behind it
  for (const m of hall.mouths) buildStub(ctx, M, S, m.sx * TRK, m.zs * (PZ + 0.6), m.zs, hall.BED, { visible: SHORTS });
  // seashell capitals, cove glows, benches
  const shell = [[0, 0], [0.45, 0], [0.52, 0.06], [0.5, 0.2], [0.38, 0.52], [0.18, 0.9], [0, 1.25]];
  const capGeo = extrudeZ(shell, -1.15, 1.15), capMat = mat.toon('#e9e2cf', { side: 'double' });
  for (const sx of [-1, 1]) {
    for (const z of hall.pylonZ.slice(1, -1)) {
      const m = new THREE.Mesh(capGeo, capMat); m.position.set(sx * (C - 0.02), FY + 3.0, z); m.scale.x = -sx; m.castShadow = false; S.group.add(m);   // mirrored for the +x side so that it leans toward the hall
      k.box(0.05, 0.12, 1.7, M.lampWarm, [sx * (C - 0.42), FY + 4.18, z]);
    }
    for (let i = 1; i < hall.openZ.length - 1; i += 2) { const z = hall.openZ[i]; k.box(0.5, 0.4, 3.0, M.graniteGrey, [sx * 3.5, FY + 0.2, z]); k.box(0.52, 0.04, 3.04, M.stainless, [sx * 3.5, FY + 0.42, z]); S.col(sx * 3.5 - 0.27, sx * 3.5 + 0.27, FY, FY + 0.45, z - 1.5, z + 1.5); }
    const fx = sx > 0 ? WALL - 0.2 : -WALL + 0.2, rotY = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
    for (let z = -PZ + 8; z < PZ - 5; z += 12) { const p = k.plane(3.0, 0.28, M.board(M.nameBoard(name, nameEn, blue, 'nv-ribbon'), 1.0), [fx, FY + 1.95, z], [0, rotY, 0]); p.castShadow = false; }
    for (let z = -PZ + 20; z < PZ - 14; z += 24) { const p = k.plane(5.6, 0.5, mat.decal('#ffffff', { map: M.bronzeName(name, 'nv-brass', { fill: '#b99a4a' }) }), [fx - sx * 0.01, FY + 2.65, z], [0, rotY, 0]); p.castShadow = false; const d = k.plane(1.05, 2.1, mat.toon('#ffffff', { map: gridDoor }), [fx - sx * 0.02, FY + 1.05, z + 12], [0, rotY, 0]); d.castShadow = false; }
  }
  const vInfo = { openings: hall.openings, FY, TRK, EDGE: PYLON.EDGE, PZ, mouth: PZ + 0.6, discNeg: PZ + 0.6 + SHORTS, discPos: PZ + 0.6 + SHORTS, activeRadius: 260 };

  // ================================================================ the north chamber (-63 m), local frame of the hall
  const cx0 = CH.x0, cx1 = CH.x1, cz0 = CH.z0, cz1 = CH.z1, bankC = toLocal(NV, ESC2.bank.bottom.x, ESC2.bank.bottom.z)[1], spr = FY + 3.3, passC = cz1 - 2.6, canalC = bankC + 0.3;
  {
    const floorM = mat.toon('#ffffff', { map: rep(tex.draw(256, 256, (g, w, h) => { g.fillStyle = '#7e6a5c'; g.fillRect(0, 0, w, h); const r = ctx.rng('nv-chfloor'); const cols = ['#8a7c70', '#7e5a4a', '#6d7a68', '#948677']; for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) { g.fillStyle = cols[(r() * cols.length) | 0]; g.fillRect(i * 85.3 + 2, j * 64 + 2, 81, 60); } }, { key: 'nv-chfloor' }), 1 / 1.2, 1 / 1.6) });
    S.group.add(new THREE.Mesh(floorGeo(cx0, cx1, cz0 - 0.1, cz1, FY, 1), floorM)); S.walk(cx0, cx1, cz0 - 0.6, cz1, FY, 1.1);
    S.walk(cx1 - 0.5, cx1 + 1.2, canalC - 2.4, canalC + 2.4, FY, 1.1);                                              // the sill of the arch to the canal corridor
    const arcPts = (n = 36) => { const p = []; for (let i = 0; i <= n; i++) { const t = Math.PI - i * Math.PI / n; p.push([6 * Math.cos(t), spr + 4.4 * Math.sin(t)]); } return p; };
    S.group.add(new THREE.Mesh(extrudeZ(archRing(6, spr, 0.4, spr, 0, 36, 4.4), cz0, cz1 + 0.3), mat.toon('#efe9da', { side: 'double' })));
    S.group.add(new THREE.Mesh(extrudeZ(arcPts().map((p) => p), cz1, cz1 + 0.3), chamberWall));                                                    // the gable of the north wall
    const wall = (x0, x1, holes) => S.group.add(new THREE.Mesh(extrudeX([[cz0, FY - 0.5], [cz1, FY - 0.5], [cz1, spr], [cz0, spr]], x0, x1, holes), chamberWall));
    wall(cx0, cx0 + 0.3, [archHole(bankC, 4.6, FY, FY + 1.3, 14), archHole(passC, 1.6, FY, FY + 1.0, 10)]);                                        // east: the escalator bank + the passage from the Gostiny Dvor stair
    wall(cx1 - 0.3, cx1, [archHole(canalC, 2.4, FY, FY + 0.9, 10)]);                                                                                // west: the corridor to the canal exit
    S.group.add(new THREE.Mesh(extrudeZ([[cx0, FY - 0.5], [cx1, FY - 0.5], [cx1, spr], [cx0, spr]], cz1 - 0.3, cz1), chamberWall));                // north wall
    // colliders
    const ew = (x0, x1, a, b) => { if (b - a > 0.2) S.col(x0, x1, FY - 1.2, FY + 8, a, b); };
    ew(cx0 - 0.3, cx0 + 0.3, cz0, bankC - 4.6); ew(cx0 - 0.3, cx0 + 0.3, bankC + 4.6, passC - 1.6); ew(cx0 - 0.3, cx0 + 0.3, passC + 1.6, cz1 + 0.3);
    ew(cx1 - 0.3, cx1 + 0.3, cz0, canalC - 2.4); ew(cx1 - 0.3, cx1 + 0.3, canalC + 2.4, cz1 + 0.3); S.col(cx0, cx1, FY - 1.2, FY + 8, cz1 - 0.1, cz1 + 0.4);
    // four oval ceiling lights, the arched niche with the Order-of-Lenin medallion, bronze signs, the attendant booth, the turnstile row across the canal arch
    for (const z of [58.6, 62.6, 66.6, 70.6]) { const m = k.cyl(1, 1, 0.05, M.lampWhite, [0, FY + 7.86, z], null, 24); m.scale.set(3.0, 0.05, 1.5); m.castShadow = false; }
    const nz = cz1 - 0.35, nicheMat = mat.toon('#ffffff', { map: blocks('nv-niche', '#d6cfaf', 'rgba(110,95,60,0.4)', 0.5, 0.3, 4) });
    const nshape = new THREE.Shape(); nshape.moveTo(-2.4, 0); nshape.lineTo(2.4, 0); nshape.lineTo(2.4, 4.2); for (let i = 1; i < 18; i++) { const t = i * Math.PI / 18; nshape.lineTo(2.4 * Math.cos(t), 4.2 + 1.5 * Math.sin(t)); } nshape.lineTo(-2.4, 4.2); nshape.lineTo(-2.4, 0);
    const niche = new THREE.Mesh(new THREE.ShapeGeometry(nshape, 1), nicheMat); niche.position.set(0, FY + 0.02, nz); niche.rotation.y = Math.PI; S.group.add(niche);
    // (rotation PI about y turns the +z face toward the hall, local -z)
    k.cyl(0.42, 0.42, 0.08, M.leninBronze, [0, FY + 3.5, nz - 0.07], [Math.PI / 2, 0, 0], 20); k.cyl(0.3, 0.3, 0.1, M.gold, [0, FY + 3.5, nz - 0.09], [Math.PI / 2, 0, 0], 16);
    k.box(2.6, 0.62, 0.05, M.leninBronze, [0, FY + 2.3, nz - 0.05]); k.box(4.4, 0.35, 1.2, M.graniteLight, [0, FY + 0.18, nz - 0.65]); k.box(3.4, 0.35, 0.9, M.graniteLight, [0, FY + 0.5, nz - 0.5]);
    for (const [zc, tx, sb, rot] of [[bankC, 'ГОСТИНЫЙ ДВОР · Выход на Садовую', 'Gostiny Dvor · transfer to line 3', -Math.PI / 2]]) { const p = k.plane(4.2, 0.62, M.board(M.blueBoard(tx, sb, null, 'nv-sign-gd', { bg: '#14653a' }), 1.0), [cx0 + 0.45, FY + 3.9, zc + 0.0], [0, -rot, 0]); p.castShadow = false; }
    { const p = k.plane(4.2, 0.62, M.board(M.blueBoard('КАНАЛ ГРИБОЕДОВА · Выход в город', 'Griboedov canal · way out', null, 'nv-sign-canal', { bg: '#1d4e9b' }), 1.0), [cx1 - 0.45, FY + 3.9, canalC], [0, -Math.PI / 2 * -1, 0]); p.castShadow = false; p.rotation.y = -Math.PI / 2; }
    k.box(1.4, 2.4, 1.4, M.marbleWhite, [cx1 - 1.2, FY + 1.2, cz0 + 2.3]); k.plane(1.2, 1.0, M.glass, [cx1 - 1.2 - 0.71, FY + 1.5, cz0 + 2.3], [0, -Math.PI / 2, 0]); S.col(cx1 - 1.9, cx1 - 0.5, FY, FY + 2.5, cz0 + 1.6, cz0 + 3.0);
    for (const z of [canalC - 1.8, canalC - 0.6, canalC + 0.6, canalC + 1.8]) turnstile(k, M, cx1 - 3.0, FY, z, Math.PI / 2);
    for (const z of [canalC - 3.2, canalC + 3.2]) { k.box(0.1, 1.1, 2.2, M.stainless, [cx1 - 3.0, FY + 0.55, z + (z < canalC ? -1.1 : 1.1) + 0.0]); S.col(cx1 - 3.1, cx1 - 2.9, FY, FY + 1.3, z - 2.2 + (z < canalC ? 0 : 2.2), z + (z < canalC ? 0 : 2.2)); }
  }
  // ================================================================ Petersburg wayfinding (signs.js kit; docs/research/metro-wayfinding.md sections 2, 3, 7)
  //   hanging boards on rods to the central vault (x = 0, FY + 3.2), linear schemes on both track walls, one network map in the north chamber.  The hall already draws the blue ribbon with the cream name plates and the brass
  //   letters on the track walls (the Nevsky variant of the band), so signs.trackBand is NOT used here.  The old pills (Kupchino / Parnas at z = +-34) are replaced by the to-trains boards at the same spots.
  //   S track (x = -TRK) runs toward +z = Parnas (Gorkovskaya side), N track (x = +TRK) toward -z = Kupchino.  A viewer looking -z (a board with rotY 0) has the S track on the left, looking +z (rotY PI) the N track.
  //   Colliders are unchanged: boards hang above the heads, schemes sit on the track walls, the map on the chamber wall beside the niche.  Nothing is placed on a track bed or in a door.
  res.signs = (() => {
    const sg = makeSigns(ctx, M), LINE = '2', BH = 0.62, BY = FY + 3.2, boards = [], schemes = [];
    const exitS = { streets: [['Невский проспект', 'Nevsky prospekt'], ['Думская улица', 'Dumskaya street']], esc: true };             // the own incline -> the cassa hall -> the underpass pits on Nevsky
    const exitN = { streets: [['Садовая улица', 'Sadovaya street'], ['канал Грибоедова', 'Griboedov canal']], esc: true };            // the chamber -> the canal exit / the passage to Gostiny Dvor and Sadovaya
    // one one-sided board; rods run up to the central vault (inner R = C about SPC); the +-0.065 offset keeps the casings of a back-to-back pair apart
    const board = (z, rotY, sections) => {
      const L = sg.textures.hangBoard(sections, { w: BH }).length, bx = Math.min(L / 2 - 0.4, L * 0.32), vault = hall.SPC + Math.sqrt(C * C - bx * bx);
      const b = sg.hangBoard(S, { x: 0, y: BY, z: z + (rotY === 0 ? 0.065 : -0.065), rotY, sections, w: BH, both: false, rodLen: vault - (BY + BH / 2) + 0.04 });
      boards.push({ z, rotY, length: b.length, sections: sections.map((s) => s.kind + (s.text ? ':' + s.text : '')) }); return b;
    };
    const trS = (arrow) => sg.sec.trains(LINE, +1, arrow), trN = (arrow) => sg.sec.trains(LINE, -1, arrow);                               // Parnas / Kupchino (LINES['2'].to by direction)
    const gd = () => sg.sec.transfer({ to: 'gostiny', line: '3', esc: true }, 'u');                                                      // green box «Гостиный двор» + M3 + escalator + up arrow (the 4 short escalators)
    // south end (the own incline lands here): the exit board faces the platform (-z), the landing board faces the arriving passengers (+z): the two tracks on the left / right and the rules of the escalator side
    const zS = -PZ + 4, zN = PZ - 4;
    board(zS, 0, [sg.sec.exit(exitS, 'u', true)]);
    board(zS, Math.PI, [trN('l'), trS('r')]);
    board(zS - 2.2, Math.PI, [sg.sec.rules('right')]);                                                                                    // the rules of the escalator side, first board of the arriving passengers
    // over the benches at z = -+34 (the old Kupchino / Parnas pills): the trains of each side, a viewer walking north has the N track on the left, walking south the S track
    for (const z of [-34, 34]) { board(z, 0, [trS('l'), trN('r')]); board(z, Math.PI, [trN('l'), trS('r')]); }
    // hall centre: toward the south the way out, toward the north the white "Line" section of the transfer to Gostiny Dvor (line 3) and the canal / Sadovaya exit
    board(0, 0, [sg.sec.exit(exitS, 'u', true)]);
    board(0, Math.PI, [sg.sec.transfer({ to: 'gostiny', line: '3', plain: true }, 'u'), sg.sec.exit(exitN, 'u', true)]);
    // north end (the transverse chamber with the 4 short escalators, the canal exit and the passage): the exit + transfer board faces the platform (seen walking north), the landing board faces the arriving passengers (-z)
    board(zN, Math.PI, [sg.sec.exit(exitN, 'u', true), gd()]);
    board(zN, 0, [trS('l'), trN('r')]);
    board(zN + 2.2, 0, [sg.sec.rules('right')]);
    // linear schemes on both track walls between the ribbon plates (z = -46.5 + 12 n), the grid doors (z = -22.5 + 24 n) and the brass letters (higher): the way ahead is drawn on the side the trains of THAT track head to
    for (const [sx, rotY, travelZ] of [[-1, Math.PI / 2, +1], [1, -Math.PI / 2, -1]])
      for (const z of [-40.5, -4.5, 31.5]) { sg.lineScheme(S, { x: sx * (WALL - 0.152), y: FY + 1.6, z, rotY, line: LINE, currentId: 'nevsky', dir: travelZ, ahead: sg.aheadOf(rotY, travelZ) }); schemes.push({ sx, z, travelZ }); }
    // the network map on the north wall of the chamber, right of the Order-of-Lenin niche (the niche spans |x| < 2.4), at eye height
    sg.networkMap(S, { x: 3.9, y: FY + 1.7, z: cz1 - 0.3, rotY: Math.PI, w: 1.5 });
    return { boards, schemes };
  })();

  // ---- the escalator bank: Gostiny Dvor west end (-56) <- chamber (-63); all four lanes carry UP ("almost always working upward", dossier 2.3)
  const E3 = ESC2.bank, Seb = new Space(ctx, E3.eframe, { name: 'nevsky-bank' });
  const escB = buildEscalator(ctx, M, Seb, { FY: E3.FY, yTop: E3.yTop, zTop: 0, zBottom: E3.run, mouth: false, trench: false, shellStart: 0, lanes: E3.lanes, halfW: E3.A });
  endPlate(Seb, M, { A: E3.A, y: E3.yTop, z0: -0.5, z1: 0, halfW: 4.5, spring: 1.2, floor: true });
  endPlate(Seb, M, { A: E3.A, y: E3.FY, z0: E3.run - 0.5, z1: E3.run, halfW: 4.5, spring: 1.2, floor: true });
  res.bank = escB;

  // ================================================================ the own incline: cassa hall of the underpass (-4.5) -> south end of the hall
  const E1 = ESC2.nevsky, Sn = new Space(ctx, E1.eframe, { name: 'nevsky-esc' });
  const escN = buildEscalator(ctx, M, Sn, { FY: E1.FY, yTop: E1.yTop, zTop: 0, zBottom: E1.run, mouth: false, trench: true, shellStart: 11, lanes: E1.lanes, halfW: E1.A });
  endPlate(Sn, M, { A: E1.A, y: E1.FY, z0: E1.run - 0.5, z1: E1.run, halfW: 3.3, spring: 0.6 });
  {
    const F = [E1.bottom.x, E1.bottom.z], eW = E1.e, t = [Math.sin(NV.yaw), Math.cos(NV.yaw)];
    const L = (x, z) => toWorld(NV, x, z), f = toLocal(NV, F[0], F[1]);
    const pts = smoothPath([F, L(f[0] + 4.3, f[1] - 9), L(f[0] + 10.1, f[1] - 16.9), L(f[0] + 18.6, f[1] - 20.9), L(f[0] + 27.1, f[1] - 18.4), L(f[0] + 31.6, f[1] - 11.4), L(0, -(PZ + 0.6) - 0.0)], eW, t, 2.5);
    X.debug.radii.nevskyLower = minRadius(pts);
    const grp = X.mkGroup('nevsky-lower');
    X.cor('nevsky-lower', grp, pts.map((p) => [p[0], FY, p[1]]), { w: 5.6, h: 2.6, rise: 1.4, noLift: true });
  }

  // ---- the cassa hall (underground), the junction rooms, the H-shaped tunnels, the four pits
  const cassa = [];
  {
    const poly = [[-9, -14], [9, -14], [9, 12.6], [-9, 12.6]].map(([x, z]) => Sn.W(x, z));
    const hole = [[-E1.A, 0], [E1.A, 0], [E1.A, 11.4], [-E1.A, 11.4]].map(([x, z]) => Sn.W(x, z));
    const ceil = UNDERPASS_Y + 3.7;
    const tw = M.rotundaInner;
    const room = buildPolyRoom(ctx, M, { id: 'nv-cassa', poly, y0: UNDERPASS_Y + 0.05, ceil, under: true, holes: [hole], wallMat: tw, doors: [{ ...(() => { const [x, z] = Sn.W(0, -14); return { x, z }; })(), w: 4.4, h: 2.9, arch: true }], colY: [UNDERPASS_Y - 1.5, UNDERPASS_Y + 4],
      lamps: { step: 5, mat: M.lampWhite, size: [1.8, 0.9], rot: -E1.yaw }, floorMat: mat.toon('#ffffff', { map: M.T.granite('nv-cassa-floor', '#b4afa5', 'rgba(60,55,50,0.28)', 'rgba(255,255,255,0.35)') }) });
    cassa.push(room); res.cassa = room;
    // the floor around the shaft is walkable: the walk boxes (the hole itself is the escalator)
    const fy = UNDERPASS_Y + 0.05;
    Sn.walk(-9, 9, -14, 0, fy, 1.0); Sn.walk(-2.5, 2.5, -15.6, -13.6, fy, 1.0);                                // + the sill of the trunk doorway Sn.walk(E1.A + 0.7, 9, 0, 12.6, fy, 1.0); Sn.walk(-9, -E1.A - 0.7, 0, 12.6, fy, 1.0);
    // balustrades round the shaft mouth, turnstiles across the walkway (paid zone), ticket machines, signs
    const k2 = Sn.k;
    k2.box(0.3, 1.0, 11.4, M.graniteGrey, [E1.A - 0.1 + 0.3, fy + 0.5, 5.7]); k2.box(0.3, 1.0, 11.4, M.graniteGrey, [-E1.A + 0.1 - 0.3, fy + 0.5, 5.7]);
    for (const x of [-5.2, -3.8, 3.8, 5.2]) turnstile(k2, M, x, fy, -4.5, 0);
    for (const sx of [-1, 1]) { k2.box(0.1, 1.1, 4.6, M.stainless, [sx * 8.9, fy + 0.55, -4.5]); }
    k2.box(8.8, 0.1, 0.1, M.stainless, [0, fy + 1.1, -4.55]);
    for (const [x, z] of [[-8.5, -9], [-8.5, -11.5], [8.5, -9], [8.5, -11.5]]) { k2.box(0.7, 1.9, 0.9, M.kiosk, [x, fy + 0.95, z]); k2.box(0.05, 0.5, 0.7, M.lampCool, [x - Math.sign(x) * 0.36, fy + 1.4, z]); Sn.col(x - 0.4, x + 0.4, fy - 1, fy + 2.2, z - 0.5, z + 0.5); }
    { const p = k2.plane(3.2, 0.7, M.board(M.blueBoard('К поездам · Невский проспект', 'To the trains · line 2', 'd', 'nv-cassa-trains'), 1.0), [0, fy + 3.1, -4.2], [0, Math.PI, 0]); p.castShadow = false; const q = k2.plane(2.6, 0.62, M.board(M.blueBoard('Кассы', 'Tickets', null, 'nv-cassa-kassa', { bg: '#14653a' }), 1.0), [5.5, fy + 3.1, -13.9], [0, 0, 0]); q.castShadow = false;
      const r = k2.plane(4.4, 0.7, M.board(M.blueBoard('Выход на Невский · Садовая · Думская', 'Way out to Nevsky prospekt', 'u', 'nv-cassa-exit'), 1.0), [0, fy + 3.2, -13.85], [0, 0, 0]); r.castShadow = false; }
  }
  // junction rooms where the trunk crosses the two cross tunnels (frames along the cross direction)
  const crossDir = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); return [dx / l, dz / l]; };
  const JS = [-1174.2, -246.7], JN = [-1161.5, -284.1];
  const cd = crossDir([-1189.5, -250.6], [-1158.9, -242.9]), jyaw = Math.atan2(-cd[1], cd[0]);                    // local +x = (cos yaw, -sin yaw) = cd  ->  yaw = atan2(-cd.z, cd.x)
  const UY = UNDERPASS_Y, UC = { w: 4.6, h: 2.6, rise: 1.2 };
  const jr = 4.6, junctions = {};
  for (const [id, P] of [['S', JS], ['N', JN]]) {
    const Sj = new Space(ctx, { x: P[0], z: P[1], yaw: jyaw }, { name: 'nevsky-junction-' + id });
    buildJunction(ctx, M, Sj, { x0: -jr, x1: jr, z0: -jr, z1: jr, y: UY, hw: 2.3, spring: 1.4, H: 4.2, arms: { W: 0, E: 0, N: 0, S: 0 }, signs: [{ text: 'Выход на Невский проспект', sub: 'Way out', key: 'nvj-' + id + '-a', x: 0, z: -jr + 0.5, rot: Math.PI }, { text: 'К поездам · Гостиный двор · Невский проспект', sub: 'To the trains', key: 'nvj-' + id + '-b', x: 0, z: jr - 0.5, rot: 0 }] });
    junctions[id] = Sj;
  }
  const jw = (Sj, x, z) => Sj.W(x, z);
  {
    const grp = X.mkGroup('nevsky-underpass'), cor = (n, pts) => X.cor(n, grp, pts.map((p) => [p[0], UY, p[1]]), UC);
    const T0 = Sn.W(0, -14.0), tEast = [-E1.e[0], -E1.e[1]], sj = junctions.S, nj = junctions.N;
    // trunk: cassa -> junction S (its "south" arm is at local z = +jr: the trunk comes from the south-west)
    const toS = smoothPath([T0, [T0[0] + tEast[0] * 6, T0[1] + tEast[1] * 6], jw(sj, 0, jr + 14), jw(sj, 0, jr + 0.2)], tEast, [-Math.sin(jyaw), -Math.cos(jyaw)], 2.5);
    cor('nevsky-trunk-1', toS);
    cor('nevsky-trunk-2', [jw(sj, 0, -jr - 0.2), jw(sj, 0, -jr - 6), jw(nj, 0, jr + 6), jw(nj, 0, jr + 0.2)].map((p) => p));
    for (const p of PITS) {                                        // cross tunnels: junction arm -> foot of the pit stairs
      const Sj = p.side === 'S' ? sj : nj, east = (p.foot[0] - Sj.frame.x) * cd[0] + (p.foot[1] - Sj.frame.z) * cd[1] > 0, arm = jw(Sj, east ? jr + 0.2 : -jr - 0.2, 0);
      cor('nevsky-pit-' + p.n, [arm, p.foot]);
    }
  }
  const pitInfo = buildCentralMetroEntrances(ctx, true).pits;
  res.pits = pitInfo;
  // seen from the street the stairwell is a window into the underground (zones.js hides every undergroundOnly node above -2 m): looking down the stairs and under the earth lid at the lower flight
  // one sees the foot of the stairs and the cross tunnel behind it. Near a mouth (the approach strip on the uphill side + the stairwell) the underpass tunnels and junction rooms are drawn
  // from the street too, so the opening ends in a tunnel and not in the clear colour (it showed a flat sky-blue rectangle and a floating slab).
  for (const p of pitInfo) {
    const ex = p.e[0], ez = p.e[1];
    ctx.zones?.reveal({ id: 'nevsky-pit-' + p.n + '-view', zones: ['nevsky-underpass', 'nevsky-junction-S', 'nevsky-junction-N'], test: (x, y, z) => { const dx = x - p.mouth[0], dz = z - p.mouth[1], a = dx * ex + dz * ez, l = -dx * ez + dz * ex; return y > -2.5 && a > -30 && a < p.run && Math.abs(l) < 7; } });
  }

  // ================================================================ the canal exit: a hall in the Engelhardt house (Nevsky 30 / Griboedov canal 16) + a 3-lane incline
  const E2 = ESC2.canal, Sk = new Space(ctx, E2.eframe, { name: 'nevsky-canal-esc' });
  const escK = buildEscalator(ctx, M, Sk, { FY: E2.FY, zTop: 0, zBottom: E2.run, shellStart: 12, lanes: E2.lanes, halfW: E2.A });
  endPlate(Sk, M, { A: E2.A, y: E2.FY, z0: E2.run - 0.5, z1: E2.run, halfW: 3.3, spring: 0.6 });
  {
    const F = [E2.bottom.x, E2.bottom.z], eW = E2.e, pts = smoothPath([F, [F[0] + eW[0] * 7, F[1] + eW[1] * 7], toWorld(NV, 44, 62.8), toWorld(NV, 30, 62.0), toWorld(NV, 14, canalC), toWorld(NV, 6.6, canalC)], eW, [-Math.cos(NV.yaw), Math.sin(NV.yaw)], 2.5);
    X.debug.radii.nevskyCanal = minRadius(pts);
    const grp = X.mkGroup('nevsky-canal-lower');
    X.cor('nevsky-canal-lower', grp, pts.map((p) => [p[0], CH.y, p[1]]), { w: 4.8, h: 2.6, rise: 1.4, noLift: true });
  }
  const Sh = new Space(ctx, E2.eframe, { name: 'nevsky-canal-hall', tag: null, zone: 'nevsky-canal-fx' }), kh = Sh.k;
  {
    const polyL = [[-5.6, -5], [10, -5], [10.5, 22.2], [-11.6, 11], [-10.4, 6.2], [-7.5, 0]], poly = polyL.map(([x, z]) => Sh.W(x, z));
    const holeW = [[-E2.A, 0], [E2.A, 0], [E2.A, 13], [-E2.A, 13]].map(([x, z]) => Sh.W(x, z));
    const doors = DOORWAYS.filter((d) => d.station === 'nevsky').map((d) => ({ x: d.x, z: d.z, w: d.w, h: 3.6, arch: true }));
    const gold = mat.toon('#e0b94c', { side: 'double' });
    const room = buildPolyRoom(ctx, M, { id: 'nv-canal', poly, ceil: 5.0, doors, holes: [holeW], ceilMat: gold, wallMat: mat.toon('#ffffff', { map: blocks('nv-canalwall', '#a89a86', 'rgba(60,45,30,0.4)'), side: 'double' }),
      floorMat: mat.toon('#ffffff', { map: M.T.granite('nv-canal-floor', '#9a928a', 'rgba(50,45,40,0.3)', 'rgba(255,255,255,0.3)') }), lamps: { step: 4.4, mat: M.lampWarm, size: [1.4, 0.7], rot: -E2.yaw } });
    res.canalRoom = room;
    for (const sx of [-1, 1]) { kh.box(0.35, 1.0, 12.4, M.graniteGrey, [sx * (E2.A - 0.1), 0.55, 6.7]); Sh.col(sx * (E2.A - 0.1) - 0.2, sx * (E2.A - 0.1) + 0.2, -1, 1.1, 0.5, 13.2); for (let z = 1.5; z < 13; z += 3) kh.cyl(0.14, 0.14, 0.45, M.lampCylinder, [sx * (E2.A - 0.1), 1.2, z], null, 8); }
    kh.box(2 * E2.A, 1.0, 0.35, M.graniteGrey, [0, 0.55, 13.0]); Sh.col(-E2.A, E2.A, -1, 1.1, 12.8, 13.2);
    { const p = kh.plane(4.4, 0.7, ovalMat, [0, 3.6, -4.9], [0, 0, 0]); p.castShadow = false; }
    for (const z of [2, 4.6]) { const x = 9.4; kh.box(0.6, 1.9, 0.9, M.kiosk, [x, 1.0, z]); kh.box(0.05, 0.5, 0.7, M.lampCool, [x - 0.31, 1.45, z]); Sh.col(x - 0.35, x + 0.35, -1, 2.2, z - 0.5, z + 0.5); }
    kh.box(1.4, 2.4, 1.4, M.marbleWhite, [7.6, 1.2, -3.2]); Sh.col(6.9, 8.3, -1, 2.6, -3.9, -2.5);
    X.addVestZone('nevsky-canal', room.inside, 8);
  }
  // ================================================================ the station object, the ways out and the transfer routes (tests)
  const rt = X.rtOf('nevsky', X.net.nevsky, NV, vInfo, null);
  rt.platform = createPlatform(ctx, M, { id: 'nevsky', name: X.net.nevsky.name, nameEn, frame: NV, stock: '717-l2', line: '2', idx: X.net.nevsky.idx }, vInfo, X.protos, {
    onArrive: () => X.toast('Станция «Невский проспект». Переход на станцию «Гостиный двор» Невско-Василеостровской линии. Выход к Невскому проспекту и каналу Грибоедова'),
  });
  X.stations.nevsky = rt;
  res.hall = hall; res.escN = escN; res.escK = escK; res.Sn = Sn; res.Sk = Sk; res.Seb = Seb; res.canalC = canalC; res.bankC = bankC; res.junctions = junctions;
  res.routes = (debug) => {
    const get = (n) => debug.corridors.find((c) => c.name === n).pts, flat = (pts, step = 4) => pts.filter((_, i, a) => i % step === 0 || i === a.length - 1).map((p) => [p[0], p[2]]);
    const rev = (n, step) => flat(get(n).slice().reverse(), step), fwd = (n, step) => flat(get(n), step);
    const SnW = (x, z, tol) => { const q = Sn.W(x, z); return tol ? [q[0], q[1], tol] : q; }, SkW = (x, z, tol) => { const q = Sk.W(x, z); return tol ? [q[0], q[1], tol] : q; }, SbW = (x, z, tol) => { const q = Seb.W(x, z); return tol ? [q[0], q[1], tol] : q; };
    const out = {};
    const pit = PITS.find((p) => p.n === 2), pi = pitInfo.find((p) => p.n === 2), nx = pit.e[0], nz = pit.e[1], c = Math.cos(pi.yaw), s = Math.sin(pi.yaw);
    const pw = (lx, lz) => [pit.mouth[0] + lx * c + lz * s, pit.mouth[1] - lx * s + lz * c];
    out.nevsky = { start: [...toWorld(NV, 0, -30), FY], points: [toWorld(NV, 0, -50), ...rev('nevsky-lower', 4), SnW(2, E1.run + 0.5), SnW(2, E1.run - 3, 0.3), SnW(2, 60, 0.3), SnW(2, 10, 0.3), SnW(2, 0.5, 0.3), SnW(2, -3), SnW(0, -9), SnW(0, -13), ...fwd('nevsky-trunk-1', 4), jw(junctions.S, 0, 0), ...fwd('nevsky-pit-2', 3),
      [...pw(0, pi.run - 1), 0.5], [...pw(0, pi.run - 4), 0.4], [...pw(0, 1), 0.4], [...pw(0, -3.5)]], door: [pit.mouth[0], pit.mouth[1]], out: pw(0, -3.5), outward: [-nx, -nz] };
    const dc = DOORWAYS.find((d) => d.id === 'nevsky-canal'), dx = Math.sin(dc.rotY), dz = Math.cos(dc.rotY);
    out['nevsky-canal'] = { start: [...toWorld(NV, 0, -30), FY], points: [toWorld(NV, 0, 50), toWorld(NV, 0, CH.z0 + 3), toWorld(NV, 3, canalC), toWorld(NV, 5.6, canalC), ...rev('nevsky-canal-lower', 4), SkW(2, E2.run + 0.5), SkW(2, E2.run - 3, 0.3), SkW(2, 60, 0.3), SkW(2, 14, 0.3), SkW(2, 1, 0.3), SkW(2, -1.5), SkW(0, -3.5), SkW(-6.0, -2.6), SkW(-6.8, 3), SkW(-7.6, 9.5), SkW(-4.0, 14.2), [dc.x - dx * 0.5, dc.z - dz * 0.5], [dc.x + dx * 3.5, dc.z + dz * 3.5]], door: [dc.x, dc.z], out: [dc.x + dx * 3.5, dc.z + dz * 3.5], outward: [dx, dz] };
    void SbW;
    return out;
  };
  return res;
}
