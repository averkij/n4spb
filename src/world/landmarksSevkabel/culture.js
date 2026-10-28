// Sevkabel outdoor cultural life: rounded food trailers, restaurant awnings,
// terraces, original public art, a small music stage and real festoon bulbs.
// References: dossier photos 021/022/031/045 and docs/SEVKABEL-CULTURE.md.
// All ground fixtures pass final footprint checks; the alley/quay stay open.
import * as THREE from 'three';
import { H } from './frame.js';
import { polysOf } from './common.js';
import { ringEdges, onEdge } from './kit.js';
import { publicSpot, solid, sign, tile, table, planter, visitor, festoon, buildBulbs, knockCaptured } from './culture-kit.js';
import { partsGeos } from './inst.js';
import { knockFurniture } from '../lib/knock-furniture.js';      // n4spb (docs/AREAS.md 13, 15.v): the trailers, the café / picnic tables, the planters and the print stands are knock records (the stage, the cable sculpture stay solid structures)
import { buildDining } from './dining.js';
import { SPOOL_TOWERS, wallFestoonPlan } from './public-life-plan.js';

export function build(K) {
  restaurants(K);
  buildDining(K);
  const { P, M, ctx, svc } = K;
  P.push(H.x, 0, H.z, H.rot);
  for (const [x, z, rot, title, color] of [
    [25, -29.1, Math.PI, 'ЧУРРОС', M.cultureRose], [50, -29.1, Math.PI, 'ПОНЧИКИ', M.yellowSteel],
    [103, 17, -Math.PI / 2, 'КОФЕ', M.cultureTeal],
    [-38.5, -29.8, Math.PI, 'ТРДЕЛЬНИКИ', M.larch],
    [-22.8, -29.2, Math.PI, 'КОФЕ И ЧУРРОС', M.cultureTeal],
  ]) {
    // Serving awnings are part of the footprint check, not only the trailer box.
    if (!publicSpot(ctx, x, z, 7.2, 5.2, rot)) continue;
    const w = H.W(x, z);
    K.extraTris += knockCaptured(K, 'lmsevka-trailers', { x: w.x, z: w.z, rotY: H.rot + rot }, (K2) => trailer(K2, x, z, rot, title, color),
      { kind: 'booth', mass: 1500, h: 3.05, w: 7.2, d: 2.7, anchored: 18, hitK: 0.6, metal: false, minDv: 0 }, 260);
  }
  terraces(K); installations(K); stage(K); lighting(K);
  P.pop(); buildBulbs(K);
  svc.culturalActivities = ['craft-fair', 'pottery-workshop', 'print-gallery', 'summer-stage', 'food-court'];
}

function trailer(K, x, z, rot, title, color) {
  const { P, M, svc } = K;
  P.push(x, 0, z, rot);
  P.box(color, -2.9, 2.9, .55, 2.25, -1.2, 1.2, 'bf');
  const roof = new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  P.geo(color, roof, 0, 2.25, 0, 0, 0, 0, 2.9, .7, 1.2); roof.dispose();
  P.box(M.steelGrey, -3, 3, .48, .58, -1.25, 1.25, 'b');
  P.box(color, -2.9, 2.9, .55, 1.18, 1.15, 1.2, 'b');
  for (const [a, b] of [[-2.9, -2.25], [2.25, 2.9]]) P.box(color, a, b, 1.18, 2.25, 1.15, 1.2, 'b');
  P.box(M.portalDark, -2.25, 2.25, 1.2, 2.25, .83, .87, 'b');
  P.box(M.larch, -2.45, 2.45, 1.13, 1.23, 1.08, 1.65, 'b');
  for (const a of [-2.25, 0, 2.25]) P.box(M.steelGrey, a - .025, a + .025, 1.22, 2.25, .94, 1.04, 'b');
  for (const a of [-1.8, -.8, .6, 1.6]) {
    P.col(M.plaster, a, 1.3, 1.23, 1.42, .07, .07, 8);
    P.col(M.copper, a, .93, 1.28, 1.56, .11, .11, 8);
  }
  if (title === 'ТРДЕЛЬНИКИ') {
    // Readable spiral pastries on steel rotisserie spits in the serving hatch.
    P.box(M.steelGrey, -2.1, -.2, 1.26, 1.4, .9, 1.4, 'b');
    for (const y of [1.6, 1.95]) {
      P.cyl(M.steelGrey, [-2.05, y, 1.15], [-.25, y, 1.15], .018, .018, 6);
      for (const cx of [-1.6, -.7]) {
        const points = Array.from({length: 37}, (_, i) => { const t = i / 36, angle = t * Math.PI * 8; return [cx - .25 + t * .5, y + Math.cos(angle) * .09, 1.15 + Math.sin(angle) * .09]; });
        for(let i = 1; i < points.length; i++) P.cyl(M.larch, points[i - 1], points[i], .035, .035, 5, false);
      }
    }
  } else if (title === 'КОФЕ И ЧУРРОС') {
    P.box(M.steelGrey, -1.65, -.85, 1.23, 1.78, .93, 1.35, 'b');
    P.box(M.black, -1.55, -.95, 1.44, 1.53, 1.35, 1.4, 'b');
    for (const x of [-1.45, -1.1]) P.col(M.plaster, x, 1.45, 1.23, 1.38, .06, .065, 8);
    for (const x of [.9, 1.55]) for (let j = 0; j < 4; j++) P.cyl(M.larch, [x, 1.25 + j * .05, 1.3], [x + .4, 1.25 + j * .05, 1.3], .023, .023, 6);
  }
  // Sloping serving hatch is visibly open, carried by diagonal struts.
  P.quad(color, [-2.5, 2.4, 1.15], [2.5, 2.4, 1.15], [2.5, 2.1, 2.5], [-2.5, 2.1, 2.5], [0, 1, .2]);
  P.quad(M.plaster, [-2.5, 2.37, 1.15], [2.5, 2.37, 1.15], [2.5, 2.07, 2.5], [-2.5, 2.07, 2.5], [0, -1, -.2]);
  for (const a of [-2.4, 2.4]) P.cyl(M.steelGrey, [a, 1.35, 1.15], [a, 2.1, 2.4], .025, .025, 5);
  sign(K, title, 0, 3.12, .1, 3.8, .6, 'sevkabel-trailer-' + title);
  sign(K, 'МЕНЮ', -2.54, 1.7, 1.25, .52, .75, 'sevkabel-trailer-' + title);
  for (const a of [-1.7, 1.7]) for (const b of [-1.28, 1.28]) {
    P.cyl(M.black, [a, .43, b - .11], [a, .43, b + .11], .4, .4, 12);
    P.cyl(M.zincLight, [a, .43, b + Math.sign(b) * .12], [a, .43, b + Math.sign(b) * .15], .22, .22, 10);
  }
  for (const b of [-.6, .6]) P.cyl(M.steelGrey, [2.9, .45, b], [3.5, .45, 0], .04, .04, 5);
  P.box(M.steelGrey, -.5, .5, 2.9, 3.02, -.35, .35, 'b');
  festoon(K, [-2.4, 2.26, 2.35], [2.4, 2.26, 2.35], .09);
  P.push(0, .55, 0); visitor(P, M, .65, .88, 0, 2); P.pop();
  P.pop();
  (svc.foodTrucks ||= []).push({ name: title, ...H.W(x, z), rotY: H.rot + rot });
  return solid(K, x, z, 7.2, 2.7, 3.05, rot);      // (the collider is the record's item, see build())
}

function restaurants(K) {
  const { P, M, ctx, svc } = K, tables = [];
  for (const [id, normal, titles] of [
    ['r8702909', [0, 1], ['КОФЕ', 'ПЕКАРНЯ', 'У МОРЯ']],
  ]) {
    const poly = polysOf(id)[0]; if (!poly) continue;
    const edge = ringEdges(poly).filter(e => e.len > 28).find(e => {
      const nx = e.n[0] * H.U[0] + e.n[1] * H.U[1], nz = e.n[0] * H.V[0] + e.n[1] * H.V[1];
      return nx * normal[0] + nz * normal[1] > .7;
    });
    if (!edge) continue;
    onEdge(P, edge, (len, f) => {
      for (let i = 0; i < titles.length; i++) {
        const u = 10 + (len - 20) * (i + .5) / titles.length;
        // Projected facade rectangle includes the canopy and sign. If another
        // plate/shop already owns it, skip both together.
        if (!sign(K, titles[i], u, 4.9, .18, 5.8, .72, id)) continue;
        const aw = new THREE.Vector3(u, 3.8, .18).applyMatrix4(P.m);
        if (!ctx.services.labels.reserve(id, aw.x, aw.y, aw.z, 6, .9, edge.n[0], edge.n[1], 'awning')) continue;
        const shade = i % 2 ? M.cultureRose : M.cultureTeal;
        P.quad(shade, [u - 3, 4.25, .1], [u + 3, 4.25, .1], [u + 3, 3.55, 2.2], [u - 3, 3.55, 2.2], [0, 1, .3]);
        P.box(shade, u - 3, u + 3, 3.36, 3.55, 2.12, 2.2, 'b');
        for (const dx of [-2.8, 2.8]) P.cyl(M.black, [u + dx, 3.0, .15], [u + dx, 3.55, 2.15], .025, .025, 5);
        // Warm shelving and mullions make the ground-level windows read as shops.
        P.box(M.larchDark, u - 2.5, u + 2.5, 1.05, 1.15, .08, .27, 'b');
        for (const dx of [-1.8, -.6, .6, 1.8]) {
          P.box(M.rustBrown, u + dx - .03, u + dx + .03, .45, 3.2, .04, .15, 'b');
          P.box(M.lampWarm, u + dx - .22, u + dx + .22, 2.7, 2.87, .06, .13, 'b');
        }
        const wx = f.x + f.xa[0] * u + edge.n[0] * 3.6, wz = f.z + f.xa[1] * u + edge.n[1] * 3.6;
        // Geometry collector is in WORLD facade frame here; furniture is H-local.
        for (const dx of [-1.8, 1.8]) {
          const px = wx + f.xa[0] * dx, pz = wz + f.xa[1] * dx, hp = H.M(px, pz);
          if (!publicSpot(ctx, hp.u, hp.v, 1.5, 2.3, f.rot - H.rot)) continue;
          tables.push({ spot: { x: px, y: 0, z: pz, rotY: f.rot }, item: solid(K, hp.u, hp.v, 1.5, 2.3, .85, f.rot - H.rot) });      // (drawn as a knock record below)
        }
        (svc.restaurants ||= []).push({ name: titles[i], x: wx, z: wz, building: id });
      }
    });
  }
  if (tables.length) K.extraTris += knockFurniture(ctx, 'lmsevka-cafe-tables', partsGeos((Q) => table(Q, M, 0, 0)), tables.map((q) => q.spot), tables.map((q) => q.item),
    { kind: 'table', mass: 40, h: 0.95, w: 1.5, d: 2.3, hitK: 0.2, metal: true, minDv: 0 }, 200);
}

function terraces(K) {
  const { P, M, ctx, svc } = K, picnic = [], planters = [];
  for (const [x, z] of [[-115, 16], [-108, 18], [96, 6], [96, 23], [13, -43.5], [26, -43.5]]) {
    if (!publicSpot(ctx, x, z, 3, 2.4)) continue;
    { const w = H.W(x, z); picnic.push({ spot: { x: w.x, y: 0, z: w.z, rotY: H.rot }, item: solid(K, x, z, 2.3, 1.9, .82) }); }
    visitor(P, M, x - .6, z - .68, 0, 2, true);
    svc.benches.push({ ...H.W(x, z), len: 2.1, rotY: H.rot });
  }
  for (const [x, z] of [[-111, 13], [96, 1], [96, 28], [34, -44], [6, -44]]) {
    if (!publicSpot(ctx, x, z, 1.1, 1.1)) continue;
    { const w = H.W(x, z); planters.push({ spot: { x: w.x, y: 0, z: w.z, rotY: H.rot }, item: solid(K, x, z, .9, .9, 1.2) }); }
  }
  if (picnic.length) K.extraTris += knockFurniture(ctx, 'lmsevka-picnic', partsGeos((Q) => table(Q, M, 0, 0, true)), picnic.map((q) => q.spot), picnic.map((q) => q.item),
    { kind: 'table', mass: 90, h: 0.85, w: 2.3, d: 1.9, hitK: 0.25, metal: false, minDv: 0 }, 200);
  if (planters.length) K.extraTris += knockFurniture(ctx, 'lmsevka-planters', partsGeos((Q) => planter(Q, M, 0, 0)), planters.map((q) => q.spot), planters.map((q) => q.item),
    { kind: 'planter', mass: 160, h: 1.2, r: 0.5, hitK: 0.3, metal: false, minDv: 0 }, 200);
}

function installations(K) {
  const { P, M, ctx, svc } = K;
  // Cable-history sculpture: drums around a copper loop, away from the Tesla.
  if (publicSpot(ctx, -112, 2, 5, 4)) {
    P.push(-112, 0, 2);
    P.box(M.conc, -2.2, 2.2, .05, .24, -1.7, 1.7, 'b');
    for (const x of [-1.4, 1.4]) {
      P.cyl(M.larchDark, [x, .25, 0], [x, .42, 0], .65, .65, 12);
      P.col(M.larch, x, 0, .42, 1.28, .25, .25, 8);
      P.col(M.larchDark, x, 0, 1.28, 1.43, .65, .65, 12);
    }
    const ring = new THREE.TorusGeometry(1.35, .12, 6, 22);
    P.geo(M.copper, ring, 0, 2.8, 0); ring.dispose();
    P.cyl(M.copper, [-1.3, 1.35, 0], [-.5, 2.1, 0], .08, .08, 6);
    P.cyl(M.copper, [1.3, 1.35, 0], [.5, 2.1, 0], .08, .08, 6);
    sign(K, 'СЕВКАБЕЛЬ ПОРТ', 0, .68, 1.76, 2.5, .5); P.pop(); solid(K, -112, 2, 4.5, 3.5, 4.3);
    svc.monuments.push({ id: 'sevkabel-cable-art', name: 'Инсталляция «Кабельное кольцо»', ...H.W(-112, 2), h: 4.3 });
  }
  // An outdoor print gallery beside the alley, with frames and feet.
  for (const [x, z, rot] of [[-68, -31, Math.PI], [82, -19, Math.PI / 2]]) {
    if (!publicSpot(ctx, x, z, 5.5, 1.6, rot)) continue;
    const w = H.W(x, z);
    K.extraTris += knockCaptured(K, 'lmsevka-print-stands', { x: w.x, z: w.z, rotY: H.rot + rot }, (K2) => {
      const P = K2.P;
      P.push(x, 0, z, rot);
      for (const dx of [-1.7, 1.7]) {
        P.box(M.black, dx - .035, dx + .035, .05, 2.6, -.08, .08, 'b');
        P.box(M.black, dx - .5, dx + .5, .05, .12, -.5, .5, 'b');
        P.box(M.larchDark, dx - 1.0, dx + 1.0, .72, 2.52, -.08, .03, 'b');
        tile(P, M, dx < 0 ? 22 : 24, dx, 1.62, .07, 1.8, 1.55);
      }
      P.pop(); return solid(K, x, z, 5.5, 1.1, 2.6, rot);
    }, { kind: 'sign', mass: 120, h: 2.6, w: 5.5, d: 1.1, anchored: 14, hitK: 0.3, metal: true, minDv: 0 }, 200);
  }
}

function stage(K) {
  const { P, M, ctx } = K, x = -87.2, z = 16.3;
  if (!publicSpot(ctx, x, z, 5, 12)) return;
  P.push(x, 0, z, -Math.PI / 2);
  P.box(M.slats, -5.8, 5.8, .05, .48, -1.9, 1.9, 'b');
  for (const a of [-4.9, 4.9]) {
    P.box(M.portalDark, a - .48, a + .48, .48, 2.0, -.3, .6, 'b');
    P.col(M.black, a, .2, 2.0, 3.3, .04, .04, 5);
    P.col(M.cultureLight, a, .2, 3.2, 3.32, .2, .2, 8);
  }
  P.box(M.cultureTeal, -4.1, 4.1, .48, 3.5, -1.85, -1.72, 'b');
  sign(K, 'СЦЕНА', 0, 2.9, -1.65, 3.4, .65);
  P.col(M.black, -.7, .4, .48, 1.95, .025, .025, 5);
  P.cyl(M.black, [-.7, 1.95, .4], [-.35, 2.1, .3], .025, .035, 6);
  P.push(0, .48, 0); visitor(P, M, -.45, -.1, 0, 0); P.pop();
  P.col(M.copper, 1.8, -.2, .5, .95, .4, .4, 12);
  P.col(M.plaster, 1.8, -.2, .95, 1.0, .4, .4, 12);
  for (const a of [1.0, 2.7]) P.col(M.copper, a, -.3, 1.15, 1.19, .33, .33, 10);
  P.pop();
  const p = H.W(x, z); ctx.physics.addWalkBox(p.x, p.z, 12, 4, H.rot - Math.PI / 2, .48, .05);
  solid(K, x + 1.8, z, .2, 8.2, 3.5);
  K.svc.stage = { ...p, name: 'Летняя сцена' };
}

function lighting(K) {
  const { P, M, ctx } = K;
  // Anchors are attached to buildings or existing cable-spool towers: no new
  // posts on the road. Small brackets make the string endpoints believable.
  for (const x of [-55, -8, 38]) {
    const plan = wallFestoonPlan(x); if (!plan) continue;
    const anchor = (a) => {
      if (!ctx.services.labels.reserve(a.bld, a.x, plan.y, a.z, .32, .3, a.nx, a.nz, 'cable-anchor')) return null;
      const q = H.M(a.x, a.z), nx = a.nx * H.U[0] + a.nz * H.U[1], nz = a.nx * H.V[0] + a.nz * H.V[1];
      P.push(q.u, plan.y, q.v, Math.atan2(nx, nz));
      P.box(M.black, -.16, .16, -.15, .15, -.30, .04, '');
      P.cyl(M.steelGrey, [0, 0, -.2], [0, 0, .24], .045, .045, 6);
      P.pop();
      const endpoint = [q.u + nx * .24, plan.y, q.v + nz * .24];
      (K.svc.festoonAnchors ||= []).push({ bld: a.bld, x: a.x, z: a.z, y: plan.y, nx: a.nx, nz: a.nz, eyelet: H.W(endpoint[0], endpoint[2]) });
      return endpoint;
    };
    const a = anchor(plan.hall), b = anchor(plan.yard); if (a && b) festoon(K, a, b, .8);
  }
  for (let i = 0; i < 4; i++) {
    const a = SPOOL_TOWERS[i], b = SPOOL_TOWERS[i + 1]; festoon(K, [a[0], 4.8, a[1]], [b[0], 4.8, b[1]], .5);
  }
  festoon(K, [-100, 4.8, 8], [-95, 4.8, -10], .55);
  festoon(K, [-95, 4.8, -10], [-79.0, 6.2, -15.3], .7);
  // Low wall-mounted wash fixtures reveal ribs and masonry without point lights.
  for (const x of [-63.6, -39.5, -15.4, 8.7, 32.8, 56.9]) {
    P.box(M.black, x - .18, x + .18, 2.6, 2.78, 26.57, 26.77, 'b');
    P.box(M.lampWarm, x - .12, x + .12, 2.78, 2.81, 26.62, 26.73, 'b');
  }
  void ctx;
}
