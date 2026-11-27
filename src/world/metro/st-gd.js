// metro/st-gd.js — Gostiny Dvor (line 3, -56 m): the closed-type hall (hall-gd.js), the lower hall + the 4-lane incline (97 m of run, axial with the hall), the TICKET HALL inside the Nevsky wing of Bolshoy Gostiny Dvor
// behind the two doors in the back wall of the Nevsky arcade (folded-plate ceiling, turnstile row, ticket machines, kiosks under a honeycomb glass wall, dark-marble parapet round the escalator mouth), the sunk
// stair in the middle of the platform with the ~90 m passage to the Nevsky Prospekt chamber, and the real running tunnels to Mayakovskaya (1.6 km, OSM polylines of the two tracks).
// Doors of the arcade: landmarksE draws the gallery (and its back wall as one textured quad); the colliders of that wall are split here (DOORWAYS gostiny-in / gostiny-out, lib/massing.js). In front of the quad
// this module puts a PORTAL: stainless frame, four glass leaves that slide apart when somebody comes within 4 m, the lit oval sign, (landmarksE cuts the real openings at the two DOORWAYS: one sees the ticket hall through the glass).
// Gostiny Dvor frame: FRAMES.gostiny (data/metro.js); the ticket hall is built in the escalator frame ESC2.gostiny.eframe (x_e lateral, z_e along the descent = toward the hall).
import * as THREE from 'three';
import { FRAMES, ESC2, DOORWAYS, GD_PZ, NV_CH, toWorld, toLocal } from '../data/metro.js';
import { Space, extrudeX, extrudeZ, archRing, floorGeo, smoothPath, minRadius } from './lib.js';
import { buildGdHall, GDH } from './hall-gd.js';
import { buildEscalator } from './escalator.js';
import { buildLongTunnel } from './tunnel.js';
import { buildPolyRoom } from './proom.js';
import { turnstile } from './st-nevsky.js';
import { createPlatform } from './platform.js';
import { MeshBuilder, addCap } from '../lib/massing.js';
import { makeSigns } from './signs.js';

const FONT = '"Rubik","Noto Sans",sans-serif';
const E_C = 0.9713, E_S = 0.2379, E_OX = -441, E_OZ = -93;                    // the (u, v) grid of the Ostrovsky ensemble (landmarksE/frame.js): u west along Nevsky, v south
const uv = (u, v) => [E_OX - E_C * u - E_S * v, E_OZ - E_S * u + E_C * v];

export function buildGostiny(ctx, M, X) {
  const { mat, tex } = ctx;
  const GD = FRAMES.gostiny, PZ = GD_PZ, FY = GD.y, TRK = GDH.TRK, NV = FRAMES.nevsky, EG = ESC2.gostiny, res = {};
  const name = 'Гостиный двор', nameEn = 'Gostiny Dvor';
  const rep = (t, x, y) => M.rep(t, x, y);

  // ================================================================ the hall
  const S = new Space(ctx, GD, { name: 'gostiny' });
  const sh = { x0: -2.5, x1: 2.5, z0: 7.5, z1: 13.4 };
  const hall = buildGdHall(ctx, M, S, { FY, PZ, name, nameEn, stock: 'neva', pills: [], stairHole: sh, endE: { halfW: 4.0, spring: 1.0 }, endW: { halfW: 4.5, spring: 1.2 } });
  const k = S.k;
  // west end: short dead stubs (the Nevsky chamber lies under them); east end: the real tunnel to Mayakovskaya (discs at 70 m)
  for (const m of hall.mouths) if (m.zs < 0) X.buildStub(ctx, M, S, m.sx * TRK, m.zs * (PZ + 0.6), m.zs, hall.BED, { visible: 3.5 });
  const vInfo = { openings: hall.openings, FY, TRK, EDGE: GDH.EDGE, PZ, mouth: PZ + 0.6, discNeg: PZ + 0.6 + 3.5, discPos: PZ + 0.6 + X.STUB_VISIBLE, activeRadius: 260 };
  // the sunk stair in the middle of the platform: opening 5 m wide, dark granite parapets 0.9 m, yellow tactile panel; the stair goes down 7 m toward the west into the passage under the platform
  {
    const stairRun = (FY - NV_CH.y) / Math.tan(Math.PI / 6), n = 40, z1 = sh.z1, zF = z1 - stairRun, rotY = GD.yaw + Math.PI;
    for (let i = 0; i < n; i++) { const z = z1 - (i + 0.5) * stairRun / n, y = FY - (FY - NV_CH.y) * (i + 1) / n; k.box(4.4, 0.17, stairRun / n, i % 5 === 0 ? M.yellow : M.graniteGrey, [0, y - 0.085, z]); }
    const [cx, cz] = S.W(0, (z1 + zF) / 2);
    ctx.physics.addStairs(cx, cz, 4.4, stairRun, rotY, FY, NV_CH.y, n);
    const prof = [[z1, FY], [sh.z0, FY], [sh.z0, FY - 1.15], [zF, FY - 1.15], [zF, NV_CH.y - 0.25], [z1, FY - 0.25]];
    for (const sx of [-1, 1]) { S.group.add(new THREE.Mesh(extrudeX(prof, sx * 2.5 - 0.2, sx * 2.5 + 0.2), M.graniteGrey)); S.col(sx * 2.5 - 0.2, sx * 2.5 + 0.2, NV_CH.y - 1, FY + 1.0, zF, z1); }
    S.bx(-2.5, 2.5, FY - 1.15, FY - 0.05, zF - 0.4, sh.z0, M.concrete);                                                  // underside of the platform over the covered flight
    for (const sx of [-1, 1]) { k.box(0.35, 0.9, sh.z1 - sh.z0, M.graniteGrey, [sx * 2.5, FY + 0.45, (sh.z0 + sh.z1) / 2]); k.cyl(0.025, 0.025, sh.z1 - sh.z0, M.stainless, [sx * 2.3, FY + 1.05, (sh.z0 + sh.z1) / 2], [Math.PI / 2, 0, 0], 6); S.col(sx * 2.5 - 0.2, sx * 2.5 + 0.2, FY, FY + 1.0, sh.z0, sh.z1); }
    k.box(5.2, 0.9, 0.35, M.graniteGrey, [0, FY + 0.45, sh.z0 - 0.17]); S.col(-2.7, 2.7, FY, FY + 1.0, sh.z0 - 0.35, sh.z0);
    k.box(4.2, 0.03, 1.1, M.yellow, [0, FY + 0.016, z1 + 0.7]);                                                           // tactile panel in front of the stair
    res.stair = { z1, zF, y: NV_CH.y };
    // the passage: stair foot -> under the north side of the hall -> the Nevsky chamber (east wall arch)
    const endNV = toWorld(NV, NV_CH.x0 + 0.6, NV_CH.z1 - 2.6), approach = toLocal(GD, endNV[0], endNV[1]);
    const xE = approach[0], wp = [S.W(0, zF - 0.2), S.W(0, zF - 3), S.W(xE * 0.45, zF - 12), S.W(xE, -22), S.W(xE, -58), S.W(xE, approach[1] + 6), endNV];
    const pts = smoothPath(wp, [Math.sin(GD.yaw + Math.PI), Math.cos(GD.yaw + Math.PI)], [Math.sin(GD.yaw + Math.PI), Math.cos(GD.yaw + Math.PI)], 2.5);
    X.debug.radii.gostinyNevsky = minRadius(pts);
    const grp = X.mkGroup('gostiny-nevsky-passage');
    X.cor('gostiny-nevsky-passage', grp, pts.map((p) => [p[0], NV_CH.y, p[1]]), { w: 4.6, h: 2.6, rise: 1.2, noLift: true });
  }

  // ================================================================ the lower hall + the 4-lane incline (axial with the hall)
  const zBot = (() => { const l = toLocal(GD, EG.bottom.x, EG.bottom.z); return l[1]; })();                           // z of the lanes' foot in the hall frame (87)
  {
    const A = EG.A, ring = extrudeZ(archRing(A, FY + 1.0, 0.5, FY - 1.4, 0, 36, 4.9), PZ + 0.5, zBot + 0.7);
    S.group.add(new THREE.Mesh(ring, mat.toon('#efe9d6', { side: 'double' })));
    const fl = new THREE.Mesh(floorGeo(-A, A, PZ + 0.4, zBot + 0.3, FY, 0.5), mat.toon('#ffffff', { map: M.T.granite('gd-lower-floor', '#cfc9bc', 'rgba(70,60,50,0.22)', 'rgba(255,255,255,0.4)') })); S.group.add(fl);
    S.walk(-A, A, PZ + 0.4, zBot + 0.3, FY, 1.1);
    S.col(A - 0.1, A + 0.7, FY - 1.2, FY + 8, PZ + 0.5, zBot + 0.5); S.col(-A - 0.7, -A + 0.1, FY - 1.2, FY + 8, PZ + 0.5, zBot + 0.5);
    // arch frame of dark green-grey steel, the blue attendant booth, three rows of tripod turnstiles, the blue "Выход / Way out" pill
    k.box(0.3, 4.6, 0.4, mat.toon('#38463f'), [-4.3, FY + 2.3, PZ + 1.0]); k.box(0.3, 4.6, 0.4, mat.toon('#38463f'), [4.3, FY + 2.3, PZ + 1.0]); k.box(8.9, 0.4, 0.4, mat.toon('#38463f'), [0, FY + 4.55, PZ + 1.0]);
    k.box(1.3, 1.6, 1.4, mat.toon('#1d3a9a'), [-3.6, FY + 0.8, PZ + 5.5]); k.box(1.32, 0.7, 1.42, M.glass, [-3.6, FY + 1.5, PZ + 5.5]); S.col(-4.3, -2.9, FY, FY + 1.8, PZ + 4.8, PZ + 6.2);
    for (const z of [PZ + 8.5, PZ + 11]) for (let x = -3.6; x <= 3.7; x += 1.2) turnstile(k, M, x, FY, z, 0);
  }

  // ================================================================ wayfinding (shared kit signs.js, docs/research/metro-wayfinding.md): hanging boards, pier line schemes, network map
  // The default pills of hall-gd are switched off (pills: []) and replaced here at the same spots; the closed-type hall draws its own green name band on the cornice, so there is no sg.trackBand.
  // Boards hang at FY + 3.2 on rods to the vault, schemes / the map sit flat on the piers between the door recesses; no collider changes.
  {
    const sg = makeSigns(ctx, M), line = '3', EDGE = GDH.EDGE, A = GDH.A, SPG = FY + GDH.SPRING, Bv = GDH.B, hH = 0.62, yB = FY + 3.2;
    const st = (d, arrow) => sg.sec.trains(line, d, arrow);               // d = +1: the S track (x = -TRK, trains run toward +z = Rybatskoye); d = -1: the N track (x = +TRK, toward -z = Begovaya)
    const NEVSKY = [['Невский проспект', 'Nevskiy prospekt']], SADOVAYA = [['Садовая улица', 'Sadovaya street']], CANAL = [['канал Грибоедова', 'Griboedov canal']];
    const vault = (x) => SPG + Bv * Math.sqrt(Math.max(0, 1 - (x / A) * (x / A)));                                             // intrados of the hall vault above x
    const lowVault = (x) => FY + 1.0 + 4.9 * Math.sqrt(Math.max(0, 1 - (x / EG.A) * (x / EG.A)));                              // intrados of the lower hall arch above x
    const info = res.signInfo = { boards: [], schemes: 0, maps: 0 };
    // one single-faced board on two rods to the vault (the rods end 6 cm inside the shell); sections are listed left to right as the reader of that face sees them
    const board = (z, rotY, sections, o = {}) => {
      const L = sg.textures.hangBoard(sections, { w: hH }).length, rx = Math.min(L / 2 - 0.4, L * 0.32), ceil = (o.low ? lowVault : vault)(rx);
      sg.hangBoard(S, { x: 0, y: yB, z, rotY, sections, w: hH, both: !!o.both, rodLen: o.noRods ? 0 : ceil - (yB + hH / 2) + 0.06 });
      info.boards.push({ z: +z.toFixed(3), rotY: +rotY.toFixed(3), len: +L.toFixed(2) });
    };
    // a directional board = two single-faced boards back to back (0.13 m apart = the casing thickness); face +z (rotY 0): reader looks toward -z, his left is -x = the S track; face -z (rotY PI): left is +x = the N track
    const pair = (z, facePlus, faceMinus) => { board(z + 0.065, 0, facePlus); board(z - 0.065, Math.PI, faceMinus, { noRods: true }); };
    // 1. platform: to-trains pairs at the three places of the old pills; arrows point to the track side
    for (const z of [-44, -8, 30]) pair(z, [st(+1, 'l'), st(-1, 'r')], [st(-1, 'l'), st(+1, 'r')]);
    // 2. the sunk stair to Nevsky Prospekt (line 2): both faces, the arrow points down the stair; replaces the old blue 'Переход' sign at sh.z1 + 4
    board(sh.z1 + 4, 0, [sg.sec.transfer({ to: 'nevsky', line: '2', esc: false }, 'd')], { both: true });
    // 3. hall ends facing the platform: west = Nevsky Prospekt / Griboedov canal + the transfer to line 2 (other face: to-trains for those arriving from the escalator bank); east = Nevsky Prospekt / Sadovaya street with the escalator
    pair(-(PZ - 3), [sg.sec.exit({ streets: [...NEVSKY, ...CANAL] }, 'u', false), sg.sec.transfer({ to: 'nevsky', line: '2', plain: true }, 'u')], [st(-1, 'l'), st(+1, 'r')]);
    board(PZ - 3, Math.PI, [sg.sec.exit({ streets: [...NEVSKY, ...SADOVAYA] }, 'u', true)]);
    // 4. the escalator landing in the lower hall (the old 'К поездам' pill spot): face to the incline foot = to-trains left/right + the rules; face to the platform = exit with the three streets + escalator
    {
      const zl = PZ + 14;
      board(zl + 0.065, 0, [st(+1, 'l'), st(-1, 'r')], { low: true });
      board(zl - 0.065, Math.PI, [sg.sec.exit({ streets: [...NEVSKY, ...SADOVAYA, ...CANAL] }, 'u', true)], { low: true, noRods: true });
      board(zl + 2, 0, [sg.sec.rules('right')], { low: true, both: true });                                                 // at the foot of the incline: read by those who step off the escalator, and from behind by those leaving
    }
    // 5. line schemes on the piers between the cars (gap centres of the door recesses): 3 per wall; ahead = the side the trains of THAT track head to; the network map (1.2 x 0.9 m) on the west wall pier next to the stair
    const gaps = []; for (let i = 0; i + 1 < hall.doorZ.length; i++) if (hall.doorZ[i + 1] - hall.doorZ[i] > 5) gaps.push((hall.doorZ[i] + hall.doorZ[i + 1]) / 2);
    for (const [sx, rotY, travel] of [[-1, Math.PI / 2, +1], [1, -Math.PI / 2, -1]]) for (const gi of [0, 2, 4]) {
      sg.lineScheme(S, { x: sx * EDGE, y: FY + 1.6, z: gaps[gi], rotY, line, currentId: 'gostiny', dir: travel, ahead: sg.aheadOf(rotY, travel), w: 4.4, h: 1.15, res: 0.8 }); info.schemes++;
    }
    sg.networkMap(S, { x: -EDGE, y: FY + 1.7, z: gaps[3], rotY: Math.PI / 2, w: 1.2 }); info.maps++;
    info.gaps = gaps;
  }
  const Sg = new Space(ctx, EG.eframe, { name: 'gostiny-esc' });
  const escG = buildEscalator(ctx, M, Sg, { FY: EG.FY, zTop: 0, zBottom: EG.run, shellStart: 12, lanes: EG.lanes, halfW: EG.A });

  // ================================================================ the ticket hall (inside the Nevsky wing) + the portal in the gallery wall
  const Sv = new Space(ctx, EG.eframe, { name: 'gostiny-ticket', tag: null, zone: 'gostiny-ticket-fx' }), kv = Sv.k;
  {
    const poly = [uv(538, 41.0), uv(590, 41.0), uv(590, 76), uv(538, 76)];
    const folded = tex.draw(256, 64, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#d7d2c4' : '#f4f1e8'; g.fillRect(i * w / 8, 0, w / 8, h); g.fillStyle = 'rgba(255,250,220,0.8)'; g.fillRect(i * w / 8 + w / 16 - 2, 0, 4, h); } }, { key: 'gd-folded' });
    const foldMat = mat.toon('#ffffff', { map: rep(folded, 1 / 6, 1 / 1), side: 'double' });
    const wallBlocks = rep(tex.draw(256, 256, (g, w, h) => { g.fillStyle = '#d9d6cc'; g.fillRect(0, 0, w, h); const r = ctx.rng('gd-vwall'); for (let i = 0; i < 80; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)'; g.fillRect(r() * w, r() * h, 30 + r() * 40, 20 + r() * 30); } g.strokeStyle = 'rgba(90,90,90,0.28)'; g.lineWidth = 2; for (let j = 0; j <= 4; j++) { g.beginPath(); g.moveTo(0, j * h / 4); g.lineTo(w, j * h / 4); g.stroke(); } for (let j = 0; j < 4; j++) for (let i = 0; i <= 3; i++) { const x = (i * w / 3 + (j % 2) * w / 6) % w; g.beginPath(); g.moveTo(x, j * h / 4); g.lineTo(x, (j + 1) * h / 4); g.stroke(); } }, { key: 'gd-vwall' }), 1 / 2.7, 1 / 2.4);
    const doors = DOORWAYS.filter((d) => d.station === 'gostiny').map((d) => ({ x: d.x, z: d.z, w: d.w, h: 3.3, arch: true }));
    const hole = [[-EG.A, 0], [EG.A, 0], [EG.A, 13], [-EG.A, 13]].map(([x, z]) => Sv.W(x, z));
    const room = buildPolyRoom(ctx, M, { id: 'gd-ticket', poly, ceil: 6.0, doors, holes: [hole], ceilMat: foldMat, wallMat: mat.toon('#ffffff', { map: wallBlocks, side: 'double' }), lamps: false,
      floorMat: mat.toon('#ffffff', { map: M.T.granite('gd-ticket-floor', '#aaa69e', 'rgba(60,55,50,0.25)', 'rgba(255,255,255,0.35)', { joint: 'rgba(0,0,0,0.18)' }) }) });
    res.ticketRoom = room;
    for (let x = -24; x <= 6; x += 3.4) for (const z of [-30, -6, 14]) { const m = kv.box(0.1, 0.06, 2.4, M.lampWarm, [x, 5.94, z]); m.castShadow = false; }
    // dark-marble parapet with a stainless rail round the escalator mouth (copper-orange balustrade below)
    const dm = mat.toon('#5a5a5c');
    for (const sx of [-1, 1]) { kv.box(0.35, 1.1, 12.6, dm, [sx * (EG.A + 0.1), 0.6, 6.5]); kv.cyl(0.03, 0.03, 12.6, M.stainless, [sx * (EG.A - 0.08), 1.2, 6.5], [Math.PI / 2, 0, 0], 6); Sv.col(sx * (EG.A + 0.1) - 0.2, sx * (EG.A + 0.1) + 0.2, -1, 1.2, 0, 13); }
    kv.box(2 * EG.A + 0.7, 1.1, 0.35, dm, [0, 0.6, 13.0]); Sv.col(-EG.A - 0.2, EG.A + 0.2, -1, 1.2, 12.8, 13.2);
    // the turnstile row (8 tripods) across the walk-way, glass-and-steel partitions to both walls
    const zt = -11;
    for (let i = 0; i < 8; i++) turnstile(kv, M, -4.2 + i * 1.2, 0.05, zt, Math.PI / 2);
    kv.box(0.1, 2.2, 0.1, M.stainless, [-5.3, 1.1, zt]); kv.box(0.1, 2.2, 0.1, M.stainless, [5.3, 1.1, zt]);
    for (const [x0, x1] of [[-23.3, -5.4], [5.4, 11.4]]) { const w = x1 - x0; kv.box(w, 2.3, 0.08, M.glass, [(x0 + x1) / 2, 1.2, zt]); kv.box(w, 0.1, 0.12, M.stainless, [(x0 + x1) / 2, 2.35, zt]); Sv.col(x0, x1, -1, 2.4, zt - 0.15, zt + 0.15); }
    // ticket machines + the kiosk row under the honeycomb stained-glass wall (east end), a police post, signs
    for (let x = -21; x <= -8; x += 2.2) { kv.box(0.8, 1.9, 0.55, mat.toon('#3d4d78'), [x, 1.0, zt - 1.2]); kv.box(0.6, 0.45, 0.06, M.lampCool, [x, 1.45, zt - 1.2 - 0.3]); Sv.col(x - 0.45, x + 0.45, -1, 2.0, zt - 1.5, zt - 0.9); }
    const honey = tex.draw(256, 128, (g, w, h) => { g.fillStyle = '#2b2020'; g.fillRect(0, 0, w, h); const cols = ['#a8341c', '#d6891f', '#2a5a8c', '#6a2a5a', '#3a7a4a']; const r = ctx.rng('gd-honey'); for (let y = 6; y < h; y += 17) for (let x = (Math.floor(y / 17) % 2) * 10; x < w; x += 20) { g.fillStyle = cols[(r() * cols.length) | 0]; g.beginPath(); for (let a = 0; a < 6; a++) g.lineTo(x + 9 * Math.cos(a * Math.PI / 3 + Math.PI / 6), y + 9 * Math.sin(a * Math.PI / 3 + Math.PI / 6)); g.closePath(); g.fill(); } }, { key: 'gd-honey' });
    { const p = kv.plane(16, 2.0, M.board(honey, 0.7), [-14, 3.6, -35.65], [0, 0, 0]); p.castShadow = false;                                                    // the honeycomb glass wall over the kiosk row of the east wall
      for (const x of [-22.5, -18.5, -14.5, -10.5]) { kv.box(2.4, 2.0, 1.4, mat.toon('#6a5b50'), [x, 1.0, -35.0]); Sv.col(x - 1.3, x + 1.3, -1, 2.1, -35.8, -34.2); }
      for (const z of [-22, -17.5]) { kv.box(1.4, 2.0, 2.2, mat.toon('#6a5b50'), [-21.6, 1.0, z]); Sv.col(-22.3, -20.9, -1, 2.1, z - 1.2, z + 1.2); } }
    { const s1 = kv.plane(3.2, 0.7, M.board(M.blueBoard('К поездам', 'To the trains', 'd', 'gd-t-trains'), 1.0), [0, 3.3, zt - 0.15], [0, Math.PI, 0]); s1.castShadow = false;
      const s2 = kv.plane(2.6, 0.62, M.board(M.blueBoard('Кассы', 'Ticket-offices', null, 'gd-t-kassa', { bg: '#14653a' }), 1.0), [-14, 3.2, zt - 0.05], [0, 0, 0]); s2.castShadow = false;
      const s3 = kv.plane(3.6, 0.62, M.board(M.blueBoard('Невский проспект · Садовая', 'Nevskiy prospekt · Sadovaya', 'u', 'gd-t-exit', { bg: '#1b35d8' }), 1.0), [-22.4, 3.5, -26.7], [0, Math.PI / 2, 0]); s3.castShadow = false; }
    X.addVestZone('gostiny-ticket', room.inside, 9);
  }
  // portals in the gallery wall (the two doors): frame, sliding leaves, oval sign (the openings are real, cut by landmarksE)
  const portals = [];
  {
    const g = new THREE.Group(); g.name = 'gostiny-portals'; ctx.addStatic(g);
    for (const d of DOORWAYS.filter((q) => q.station === 'gostiny')) {
      const grp = new THREE.Group(); grp.position.set(d.x, 0, d.z); grp.rotation.y = d.rotY; g.add(grp); const kk = ctx.kit(grp), hw = d.w / 2;
      const leaves = []; for (const [i, off, z] of [[0, -0.75, 0.26], [1, -0.25, 0.31], [2, 0.25, 0.31], [3, 0.75, 0.26]]) { const l = kk.box(hw / 2 - 0.02, 3.0, 0.05, M.glassWarm, [off * hw, 1.55, z]); l.userData.noBatch = true; leaves.push({ m: l, x0: off * hw, i }); }
      portals.push({ d, leaves, open: 0 });
    }
    const cam = ctx.camera.position;
    ctx.onUpdate((dt) => {
      for (const p of portals) {
        const dist = Math.hypot(cam.x - p.d.x, cam.z - p.d.z), want = dist < 4.5 && cam.y > -2 ? 1 : 0; if (Math.abs(p.open - want) < 1e-3 && dist > 30) continue;
        p.open += Math.max(-1, Math.min(1, (want - p.open))) * Math.min(1, dt * 2.2);
        for (const l of p.leaves) l.m.position.x = l.x0 + (l.i === 1 ? -1 : l.i === 2 ? 1 : 0) * p.open * (p.d.w / 2 * 0.5);
      }
    });
  }

  // ================================================================ the platform doors: black panels, closed while no train stands with open doors; dynamic colliders keep them shut
  const rt = X.rtOf('gostiny', X.net.gostiny, GD, vInfo, null);
  rt.platform = createPlatform(ctx, M, { id: 'gostiny', name: X.net.gostiny.name, nameEn, frame: GD, stock: 'neva', line: '3', idx: X.net.gostiny.idx }, vInfo, X.protos, {
    onArrive: () => X.toast('Станция «Гостиный двор». Переход на станцию «Невский проспект» Московско-Петроградской линии. Выход к Невскому проспекту, Садовой улице и каналу Грибоедова'),
  });
  X.stations.gostiny = rt;
  {
    const cam = ctx.camera.position, byDir = (sx) => rt.platform.tracks.find((t) => (t.dir > 0 ? -1 : 1) === sx);              // the S track (dir +1) runs at x = -TRK (sx = -1)
    const closed = (tk, t) => { if (!tk) return true; if ((tk.rideOpen || 0) > 0.05) return false; if (tk.override) return true; const s = rt.platform.state(tk, t); return !(s.visible && s.phase === 'dwell' && s.open > 0.05); };
    const state = { closed: { '-1': true, '1': true } };
    ctx.onUpdate((dt, t) => {
      const near = Math.hypot(cam.x - GD.x, cam.z - GD.z) < 140 && Math.abs(cam.y - FY) < 30;
      for (const pn of hall.panels) { const c = near ? closed(byDir(pn.sx), t) : true; pn.mesh.visible = c; state.closed[pn.sx] = c; }
    });
    ctx.physics.addDynamic(() => {
      if (Math.hypot(cam.x - GD.x, cam.z - GD.z) > 140 || Math.abs(cam.y - FY) > 30) return [];
      const out = []; for (const sx of [-1, 1]) if (state.closed[sx]) { const [wx, wz] = S.W(sx * (GDH.EDGE + 0.12), 0); out.push({ cx: wx, cz: wz, w: 0.3, d: 2 * PZ, rotY: GD.yaw, y0: FY - 0.5, y1: FY + 2.5 }); }
      return out;
    });
  }
  // ================================================================ the real tunnels to Mayakovskaya (1.6 km): OSM polylines of the two tracks, thinned, with the depth profile -56 -> -51 and a 3.5 m sag
  res.link = (Mk) => {                    // Mk: { frame, TRK, PZ, BED }
    const MF = Mk.frame, dG = [Math.sin(GD.yaw), Math.cos(GD.yaw)], dM = [Math.sin(MF.yaw), Math.cos(MF.yaw)], BEDg = hall.BED, BEDm = Mk.BED;
    const T1 = [[-1023, -150], [-602, -54], [-322, 7], [78, 99], [234, 159]];                         // GD -> Mayakovskaya (toward Rybatskoye)
    const T2 = [[207, 116], [58, 53], [-129, 22], [-862, -138], [-1022, -184]];                       // Mayakovskaya -> GD (toward Begovaya)
    const make = (a, aDir, b, bDir, mid, y0, y1) => {
      const ctl = [[a[0], a[1]], [a[0] + aDir[0] * 30, a[1] + aDir[1] * 30], ...mid, [b[0] - bDir[0] * 30, b[1] - bDir[1] * 30], [b[0], b[1]]];
      const pts = smoothPath(ctl, aDir, bDir, 12); let Lt = 0; const cum = [0]; for (let i = 1; i < pts.length; i++) { Lt += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); cum.push(Lt); }
      return pts.map((p, i) => { const f = cum[i] / Lt; return [p[0], y0 + (y1 - y0) * f - 3.5 * Math.sin(Math.PI * f), p[1]]; });
    };
    const aS = toWorld(GD, -TRK, PZ + 0.6), bS = toWorld(MF, -Mk.TRK, -Mk.PZ - 0.6), aN = toWorld(MF, Mk.TRK, -Mk.PZ - 0.6), bN = toWorld(GD, TRK, PZ + 0.6);
    const pathS = make(aS, dG, bS, dM, T1, BEDg, BEDm), pathN = make(aN, [-dM[0], -dM[1]], bN, [-dG[0], -dG[1]], T2, BEDm, BEDg);
    const grp = new THREE.Group(); grp.name = 'gostiny-mayakovskaya-tunnel'; grp.userData.undergroundOnly = true; grp.userData.zone = 'tunnel-gd-m'; ctx.addStatic(grp);
    for (const p of [pathS, pathN]) { buildLongTunnel(ctx, M, grp, p, {}); X.debug.tubes.push(p); }
    const lenOf = (p) => { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][2] - p[i - 1][2]); return L; };
    return { 'gostiny>mayakovskaya': { path: pathS, length: lenOf(pathS), lamp: { step: 18, at0: 9 } }, 'mayakovskaya>gostiny': { path: pathN, length: lenOf(pathN), lamp: { step: 18, at0: 9 } } };      // lamp: buildLongTunnel lamps at 9 + 18 n m (both paths in travel order)
  };

  // ================================================================ routes for the tests
  res.hall = hall; res.escG = escG; res.S = S; res.Sg = Sg; res.rt = rt; res.sh = sh; res.zBot = zBot;
  res.routes = (debug, nevsky) => {
    const get = (n) => debug.corridors.find((c) => c.name === n).pts, flat = (pts, step = 4) => pts.filter((_, i, a) => i % step === 0 || i === a.length - 1).map((p) => [p[0], p[2]]);
    const SgW = (x, z, tol) => { const q = Sg.W(x, z); return tol ? [q[0], q[1], tol] : q; };
    const d = DOORWAYS.find((q) => q.id === 'gostiny-in'), nx = Math.sin(d.rotY), nz = Math.cos(d.rotY);
    const exits = { gostiny: { start: [...toWorld(GD, 0, -30), FY], points: [toWorld(GD, 4.2, -2), toWorld(GD, 4.2, 20), toWorld(GD, 0, 40), toWorld(GD, 0, PZ - 1), toWorld(GD, 1, PZ + 8), toWorld(GD, 1, zBot + 3), SgW(1, EG.run + 3, 0.4), SgW(1, EG.run - 3, 0.3), SgW(1, 60, 0.3), SgW(1, 10, 0.3), SgW(1, 0.5, 0.3), SgW(1, -3), SgW(-2, -9), SgW(-1, -13), SgW(-8, -20), SgW(-16, -27), SgW(-20.5, -30.5), [d.x - nx * 0.5, d.z - nz * 0.5], [d.x + nx * 3.5, d.z + nz * 3.5]],
      door: [d.x, d.z], out: [d.x + nx * 3.5, d.z + nz * 3.5], outward: [nx, nz] } };
    const cp = flat(get('gostiny-nevsky-passage'), 4);
    const walks = {
      'gostiny->nevsky': { start: [...toWorld(GD, 0, 30), FY], points: [toWorld(GD, 0, 18), toWorld(GD, 0, res.stair.z1 - 0.3, 0.5), toWorld(GD, 0, res.stair.zF + 1.5, 0.5), ...cp, toWorld(NV, 0, 56), toWorld(NV, 0, 40)], end: { station: 'nevsky', y: NV.y } },
      'nevsky->gostiny': { start: [...toWorld(NV, 0, 40), NV.y], points: [toWorld(NV, 0, 56), toWorld(NV, -1, 61), [...nevsky.Seb.W(1, ESC2.bank.run + 2), 0.6], [...nevsky.Seb.W(1, ESC2.bank.run - 3), 0.3], [...nevsky.Seb.W(1, 6), 0.3], [...nevsky.Seb.W(1, -1), 0.3], toWorld(GD, 0, -PZ + 4), toWorld(GD, 0, -40)], end: { station: 'gostiny', y: FY } },
    };
    return { exits, walks };
  };
  return res;
}
