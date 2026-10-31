// landmarksLETI/entrance5.js - the MAIN ENTRANCE of Corpus 5 (photo 60): a wide dark-granite stair of 17 risers (0.15 m) rising 2.55 m from the plaza to the landing, splaying from 10.6 m at the top to 20 m at the foot,
//   steel handrails on both sides, two concrete bowls of pink flowers at the foot; on the landing the pale-clad portal box: two pylons, the band with the plain wordmark "СПбГЭТУ «ЛЭТИ» / ПЕРВЫЙ ЭЛЕКТРОТЕХНИЧЕСКИЙ"
//   (text only: the emblem of the photo is a logo and is left out; the teardrop banners of the photo are temporary and are not drawn), the dark glass doors (shut, solid) in a 1.6 m deep reveal.
//   Frame EF: origin at the middle of the front edge 2 of r11983462 (17.3 m, facing WSW), +x right as seen from outside, +z out.  OSM way w141425873 (steps, 17 steps, 31 m: the map line also covers the approach walk) is
//   claimed: this stair replaces it.
import { Frame } from './frame.js';
import { stage, boxL, walkL, cylL } from './shell.js';
import { roundTowerBrick } from './brick.js';
import * as THREE from 'three';
import { makeLabels } from '../streets/labels.js';

export const EN = { landY: 2.55, n: 17, rise: 0.15, tread: 0.33, landD: 2.4, wTop: 10.6, wFoot: 20.0, boxZ: 1.8, doorZ: 0.25, doorW: 5.6, doorH: 2.5 };
export const halfW = (i) => (EN.wTop + (EN.wFoot - EN.wTop) * (i + 0.5) / 16) / 2;
export let EF = null;

export function build(K) {
  const ctx = K.ctx, P = K.P, D = K.D, M = K.M, b = K.shared.c5.blocks.find((q) => q.key === 'hall');
  const e = b.edges.find((q) => q.i === 2);
  if (!e) throw new Error('r11983462 edge 2 missing');
  const mid = [(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2];
  const fr = new Frame(mid[0], mid[1], Math.atan2(e.n[0], e.n[1]));
  EF = fr; K.shared.c5.EF = fr;
  const Y = EN.landY, ZB = EN.boxZ;

  stage(K, 'stair', () => fr.on(P, () => {
    // podium (landing) under the box and in front of it, and the 16 step blocks of the stair
    P.box(M.conc, -5.3, 5.3, 0, Y, 0, EN.landD, 'kt', 2.4);
    P.quad(M.conc, [-5.3, Y, EN.landD], [5.3, Y, EN.landD], [5.3, Y, 0], [-5.3, Y, 0], [0, 1, 0], [[-5.3 / 2.4, EN.landD / 2.4], [5.3 / 2.4, EN.landD / 2.4], [5.3 / 2.4, 0], [-5.3 / 2.4, 0]]);
    for (let i = 0; i < 16; i++) {
      const w = halfW(i), z0 = EN.landD + i * EN.tread, z1 = z0 + EN.tread, top = Y - (i + 1) * EN.rise;
      P.box(M.conc, -w, w, 0, top, z0, z1, 'kbt', 2.4);
      P.quad(M.conc, [-w, top, z1], [w, top, z1], [w, top, z0], [-w, top, z0], [0, 1, 0], [[-w / 2.4, z1 / 2.4], [w / 2.4, z1 / 2.4], [w / 2.4, z0 / 2.4], [-w / 2.4, z0 / 2.4]]);
    }
    // handrails: sloped steel tubes at 0.95 m above the treads with a post every third step
    const zA = EN.landD, zB = EN.landD + 16 * EN.tread;
    for (const s of [-1, 1]) {
      const xa = s * (EN.wTop / 2 + 0.05), xb = s * (EN.wFoot / 2 + 0.05);
      P.cyl(M.steel, [xa, Y + 0.95, zA - 0.2], [xa, Y + 0.95, zA], 0.035, 0.035, 6, true);
      P.cyl(M.steel, [xa, Y + 0.95, zA], [xb, 0.15 + 0.95, zB], 0.035, 0.035, 6, true);
      P.cyl(M.steel, [xa, Y + 0.5, zA], [xb, 0.15 + 0.5, zB], 0.025, 0.025, 6, true);
      for (let i = 0; i <= 16; i += 4) {
        const t = i / 16, x = xa + (xb - xa) * t, z = zA + (zB - zA) * t, top = Y - (i + 0.5) * EN.rise;
        P.cyl(M.steel, [x, top, z], [x, top + 0.95 + (i === 16 ? 0.0 : 0), z], 0.035, 0.035, 6, true);
      }
    }
    // the two concrete bowls with pink flowers at the foot of the stair
    for (const s of [-1, 1]) {
      const x = s * (EN.wFoot / 2 + 1.1), z = zB + 1.2;
      P.cyl(M.conc, [x, 0, z], [x, 0.55, z], 0.5, 0.72, 12, true);
      P.cyl(M.dark, [x, 0.5, z], [x, 0.6, z], 0.62, 0.62, 12, true);
      P.geo(M.bloom, new THREE.SphereGeometry(0.55, 8, 5), x, 0.62, z, 0, 0, 0, 1, 0.55, 1);
    }
  }));

  // the two round brick stair towers that stand at the wall of the auditorium wing left of the stair (photos 60 / leti/16: massive cylinders above the low hall, ~21 m)
  stage(K, 'towers', () => {
    for (const z of [-2.6, 3.9]) { const p = fr.w(-20.4, z); roundTowerBrick(P, M, p[0], p[1], 2.7, 0, 21.4, { seg: 22 }); cylL(ctx, fr, -20.4, z, 2.75, 0, 22.4); }
  });

  stage(K, 'box', () => fr.on(P, () => {
    // pylons (2.5 m), the band over the portal, return faces; all pale cladding
    P.box(M.clad, -5.3, -2.8, Y, 9.0, 0, ZB + 0.3, 'kb', 2.4);
    P.box(M.clad, 2.8, 5.3, Y, 8.4, 0, ZB, 'kb', 2.4);
    P.box(M.clad, -2.8, 2.8, Y + EN.doorH, 8.4, 0, ZB, 'kb', 2.4);
    P.box(M.conc, -5.4, 5.4, 8.4, 8.55, -0.05, ZB + 0.12, 'b', 1);                              // the thin grey cap over the band (a flat coping)
    P.quad(M.roofc, [-2.8, Y + EN.doorH, 0.25], [2.8, Y + EN.doorH, 0.25], [2.8, Y + EN.doorH, ZB], [-2.8, Y + EN.doorH, ZB], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);     // the soffit of the portal
    // the dark glass doors at the back of the reveal
    P.quad(M.c5door, [-2.8, Y, EN.doorZ], [2.8, Y, EN.doorZ], [2.8, Y + EN.doorH, EN.doorZ], [-2.8, Y + EN.doorH, EN.doorZ], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // the wordmark on the band (labels registry)
    const lab = ctx.services.labels || (ctx.services.labels = makeLabels()), c = fr.w(0, ZB + 0.03), n = [Math.sin(fr.rot), Math.cos(fr.rot)];
    if (lab.reserve('lmleti-sign5', c[0], Y + 4.1, c[1], 6.8, 1.7, n[0], n[1], 'sign')) {
      P.quad(M.word, [-3.4, Y + 3.25, ZB + 0.03], [3.4, Y + 3.25, ZB + 0.03], [3.4, Y + 4.95, ZB + 0.03], [-3.4, Y + 4.95, ZB + 0.03], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
  }));

  stage(K, 'colliders', () => {
    walkL(ctx, fr, 0, EN.landD / 2, 10.6, EN.landD, Y, 0);
    for (let i = 0; i < 16; i++) {
      const w = halfW(i), z = EN.landD + (i + 0.5) * EN.tread, p = fr.w(0, z);
      const it = ctx.physics.addWalkBox(p[0], p[1], w * 2, EN.tread + 0.04, fr.rot, Y - (i + 1) * EN.rise, 0); it.sticky = true;
      for (const s of [-1, 1]) boxL(ctx, fr, s * (w + 0.06), z, 0.12, EN.tread + 0.04, Y - (i + 1) * EN.rise, Y - (i + 1) * EN.rise + 1.0);
    }
    boxL(ctx, fr, -4.05, ZB / 2 + 0.15, 2.5, ZB + 0.3, Y, 9.0); boxL(ctx, fr, 4.05, ZB / 2, 2.5, ZB, Y, 8.4);       // pylons
    boxL(ctx, fr, 0, EN.doorZ / 2 + 0.05, 5.6, 0.5, Y, Y + EN.doorH);                                               // the shut doors
    boxL(ctx, fr, 0, ZB / 2, 5.6, ZB, Y + EN.doorH, 8.4);                                                          // the band
  });

  const p0 = fr.w(0, 10), door = fr.w(0, 2.0);
  K.svc.entrances.push({ id: 'leti-c5', x: door[0], z: door[1], rotY: fr.rot, name: 'ЛЭТИ, корпус 5: главный вход', closed: true });
  K.svc.photoSpots.push({ x: p0[0], z: p0[1], yaw: Math.round(fr.rot * 180 / Math.PI), name: 'ЛЭТИ: лестница и вход корпуса 5' });
  K.svc.monuments.push({ id: 'r11983462', name: 'ЛЭТИ, корпус 5 (аудиторный), вход с лестницей', x: mid[0], z: mid[1], h: 9 });
}
