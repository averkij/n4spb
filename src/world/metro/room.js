// metro/room.js — a vestibule that is a rectangular room built INSIDE somebody else's building behind a facade door (Vladimirskaya; the pattern for Mayakovskaya / Dostoevskaya / Vosstaniya-2).
// Room frame (data/metro.js roomGeom): origin on the wall plane at the door, +z inward, +x along the wall. Layout: front wall with the arched door (the facade owner draws the arch outside), the
// ticket hall (cashier windows on the side walls, ticket machines, security frame), the turnstile row, the paid head hall with the three escalator lanes and the shaft opening (a floor hole).
// Floors are drawn 5 cm over the ground plane, walls / ceiling are mine (the building is hollow). Colliders carry y ranges around the street level.
import * as THREE from 'three';
import { Space, extrudeX, extrudeZ, archHole, floorGeo } from './lib.js';
import { MeshBuilder, addCap } from '../lib/massing.js';
import { SHAFT_LEN } from '../data/metro.js';

const CEIL = 5.6, WALLH = 3.4;

export function buildRoom(ctx, M, g, o = {}) {
  const { mat, tex, physics } = ctx;
  const R = new Space(ctx, g.frame, { name: g.id + '-room', tag: null, zone: g.id + '-room' });
  const k = R.k, W = g.halfW, D = g.back ? g.headZ + 3 : g.headZ + SHAFT_LEN + 1.5, A = 4.05, zH = g.headZ, zT = g.ticket;
  const hz0 = g.back ? zH - SHAFT_LEN : zH, hz1 = g.back ? zH : zH + SHAFT_LEN;                 // the shaft opening in the floor
  const wallMat = M.rotundaInner;
  // ---- floor with the shaft hole, ceiling, light panels
  const floorTex = M.T.granite(g.id + '-vfloor', '#cfc6b0', 'rgba(70,55,40,0.28)', 'rgba(255,255,255,0.40)', { tint: '#8a6a50' });
  const fb = new MeshBuilder(); const hole = [[-A, hz0], [A, hz0], [A, hz1], [-A, hz1]].map(([x, z]) => R.W(x, z)), outer = [[-W, 0.3], [W, 0.3], [W, D], [-W, D]].map(([x, z]) => R.W(x, z));
  addCap(fb, { o: outer.flat(), h: [hole.flat()] }, 0.05, { uvScale: 1 });
  const fm = new THREE.Mesh(fb.build(), mat.toon('#ffffff', { map: floorTex })); fm.receiveShadow = true; ctx.addStatic(fm);
  const cb = new MeshBuilder(); addCap(cb, { o: outer.flat(), h: [] }, CEIL, { up: false, uvScale: 6 }); ctx.addStatic(new THREE.Mesh(cb.build(), M.ceiling));
  for (let x = -W + 2.5; x < W - 1; x += 5) for (let z = 3; z < D - 1; z += 5) k.box(1.8, 0.08, 0.9, M.lampWhite, [x, CEIL - 0.06, z]).castShadow = false;
  // ---- walls: front (door), back, sides (extruded slabs: uv in metres, textured on both faces)
  const slabZ = (x0, x1, z0, holes) => { const m = new THREE.Mesh(extrudeZ([[x0, 0], [x1, 0], [x1, CEIL], [x0, CEIL]], z0, z0 + 0.3, holes), wallMat); R.group.add(m); };
  const slabX = (x0, z0, z1) => { const m = new THREE.Mesh(extrudeX([[z0, 0], [z1, 0], [z1, CEIL], [z0, CEIL]], x0, x0 + 0.3), wallMat); R.group.add(m); };
  const door = archHole(0, 1.7, 0.05, 1.9, 10);
  slabZ(-W, W, 0.3, [door]); slabZ(-W, W, D, null); slabX(-W - 0.3, 0.3, D + 0.3);
  const ex = g.exit;
  if (ex) { slabX(W, 0.3, ex.z - 1.8); slabX(W, ex.z + 1.8, D + 0.3); R.bx(W, W + 0.3, 3.4, CEIL, ex.z - 1.8, ex.z + 1.8, M.plasterWarm); }
  else slabX(W, 0.3, D + 0.3);
  for (const [x0, x1] of [[-W - 0.3, -1.7], [1.7, W + 0.3]]) R.col(x0, x1, -1.5, 8, 0.25, 0.65);
  R.col(-W - 0.4, W + 0.4, -1.5, 8, D, D + 0.4); R.col(-W - 0.4, -W, -1.5, 8, 0.25, D + 0.4);
  if (ex) { R.col(W, W + 0.4, -1.5, 8, 0.25, ex.z - 1.8); R.col(W, W + 0.4, -1.5, 8, ex.z + 1.8, D + 0.4); } else R.col(W, W + 0.4, -1.5, 8, 0.25, D + 0.4);
  const nameBoard = k.plane(2.7, 0.84, M.board(M.blueBoard(g.name, 'Metro', null, 'room-' + g.id), 1.0), [0, 4.4, 0.25], [0, Math.PI, 0]); nameBoard.castShadow = false;
  // ---- ticket hall: cashiers on the side walls, machines on the front wall, the security frame
  const cashierMat = mat.toon('#2f2a28');
  for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) {
    const z = (g.back ? 1.6 + i * 2.4 : 2.5 + i * 3.4), x = sx * (W - 0.55);
    k.box(0.9, 1.05, 2.0, cashierMat, [x, 0.55, z]); k.box(0.95, 0.06, 2.05, M.steel, [x, 1.08, z]);
    k.box(0.1, 1.6, 1.5, M.gold, [sx * (W - 0.1), 1.9, z]); k.plane(1.3, 1.4, M.glass, [sx * (W - 0.17), 1.9, z], [0, -sx * Math.PI / 2, 0]);
    k.plane(1.2, 0.3, M.board(M.blueBoard('Касса', '', null, 'vv-kassa1'), 1.0), [sx * (W - 0.18), 2.85, z], [0, -sx * Math.PI / 2, 0]);
    physics.addBox(...R.W(x, z), 0.9, 2.0, R.frame.yaw, -1, 2.4);
  }
  const mt = tex.draw(128, 256, (gg, w, h) => { gg.fillStyle = '#3a3d44'; gg.fillRect(0, 0, w, h); gg.fillStyle = '#ff9a2a'; gg.fillRect(14, 30, w - 28, 74); gg.fillStyle = '#1b1b20'; gg.fillRect(30, 130, w - 60, 40); }, { key: 'vv-machine2' });
  for (const x of [-5.2, -4.2, 4.2, 5.2]) { k.box(0.75, 1.9, 0.5, M.kiosk, [x, 1.0, 0.6]); k.plane(0.6, 1.25, M.board(mt, 0.55), [x, 1.15, 0.87], [0, 0, 0]); physics.addBox(...R.W(x, 0.6), 0.8, 0.55, R.frame.yaw, -1, 2.2); }
  // ---- paid zone: partitions, turnstiles
  const X = 5.6;
  const wall = (x0, x1, z0, z1) => { R.bx(x0, x1, 0.05, WALLH, z0, z1, M.plasterWarm); R.col(x0, x1, -1.5, WALLH + 1, z0, z1); };
  wall(-W, -X - 0.1, zT - 0.15, zT + 0.15); wall(X + 0.1, W, zT - 0.15, zT + 0.15);
  for (let x = -4.4; x <= 4.41; x += 1.1) {
    R.bx(x - 0.15, x + 0.15, 0.05, 1.05, zT - 0.5, zT + 0.5, M.steel); R.col(x - 0.15, x + 0.15, -1.5, 2, zT - 0.5, zT + 0.5);
    R.bx(x - 0.1, x + 0.1, 1.05, 1.3, zT - 0.25, zT + 0.25, M.black); R.bx(x - 0.09, x + 0.09, 1.3, 1.34, zT - 0.2, zT + 0.2, M.lampGreen);
  }
  for (const sx of [-1, 1]) k.plane(2.6, 0.65, M.board(M.blueBoard('К поездам', 'To the trains', 'd', 'vv-trains'), 1.0), [sx * 0, 3.6, zT + (sx > 0 ? 0.3 : -0.3)], [0, sx > 0 ? 0 : Math.PI, 0]);
  const keep = tex.sign({ text: 'Стойте справа, проходите слева', sub: 'Stand on the right, walk on the left', w: 640, h: 140, bg: '#1d4e9b', fg: '#ffffff', radius: 10, border: 5, borderColor: '#ffffff', key: 'vv-keepright', size: 40 });
  for (const sx of [-1, 1]) k.plane(2.2, 0.48, M.board(keep, 0.9), [sx * (W - 0.2), 2.3, zH + 2], [0, -sx * Math.PI / 2, 0]);
  return { R, W, D, zH, zT };
}
