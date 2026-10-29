// Real glazed café/restaurant fronts and covered summer terraces. The shared
// public-life-plan cuts the matching windows in yard.js; these enclosed shallow
// dining rooms fill those openings. They are visible through glazing; public
// access is to the terraces. References: courtyard photos 021/022/045, user poses.
import { H } from './frame.js';
import { onEdge, frameOf } from './kit.js';
import { DINING, diningEdge } from './public-life-plan.js';
import { publicSpot, sign, tile, solid, table, planter, visitor, festoon, knockCaptured } from './culture-kit.js';
import { knockFurniture } from '../lib/knock-furniture.js';
import { partsGeos } from './inst.js';
// n4spb (docs/AREAS.md 13, 15.v): the terrace tables, planters, low rails and the menu stand are knock records (the walk deck, the awning poles and the glazed rooms are structures)

export function buildDining(K) {
  for (const def of DINING) {
    const edge = diningEdge(def), f = frameOf(edge), { P, M, ctx, svc } = K;
    let tables = 0;
    const knocks = { tables: [], planters: [] };
    onEdge(P, edge, () => {
      P.push(def.u, 0, 0);
      room(K, def);
      sign(K, def.title, 0, 4.65, .12, Math.min(5.8, def.w - .8), .65, def.bld);
      const toH = (u, d) => H.M(f.x + f.xa[0] * (def.u + u) + edge.n[0] * d, f.z + f.xa[1] * (def.u + u) + edge.n[1] * d);
      const centre = toH(0, (def.depth + .35) / 2), rot = f.rot - H.rot;
      if (publicSpot(ctx, centre.u, centre.v, def.w, def.depth - .35, rot)) {
        const color = M[def.color], hw = def.w / 2 - .15, far = def.depth - .2;
        // One compact walkable deck, clear of real asphalt/buildings. The open
        // middle of its front and sides retains access to the courtyard.
        P.box(M.deck, -hw, hw, .07, .14, .35, far, 'b', 1.4);
        const deckCentre = toH(0, (far + .35) / 2), wp = H.W(deckCentre.u, deckCentre.v);
        ctx.physics.addWalkBox(wp.x, wp.z, def.w - .3, far - .35, f.rot, .14, .07);
        const reserve = (x, y, z, w, h, kind) => {
          const a = toH(x, z), world = H.W(a.u, a.v);
          return ctx.services.labels.reserve(def.bld, world.x, y, world.z, w, h, edge.n[0], edge.n[1], kind);
        };
        if (reserve(0, 3.49, .1, def.w, 1.2, 'awning')) {
          const z1 = far - .3;
          P.quad(color, [-hw, 4.08, .08], [hw, 4.08, .08], [hw, 3.08, z1], [-hw, 3.08, z1], [0, 1, .2]);
          P.quad(M.plaster, [-hw, 4.05, .08], [hw, 4.05, .08], [hw, 3.05, z1], [-hw, 3.05, z1], [0, -1, -.2]);
          P.box(color, -hw, hw, 2.90, 3.08, z1 - .06, z1, 'b');
          for (const dx of [-hw + .2, hw - .2]) {
            P.col(M.black, dx, z1 - .15, .14, 3.10, .045, .045, 6);
            const a = toH(dx, z1 - .15); H.cyl(ctx.physics, a.u, a.v, .065, .14, 3.10);
            P.cyl(M.black, [dx, 3.9, .1], [dx, 3.0, z1], .026, .026, 5);
          }
          festoon(K, [-hw + .4, 2.97, z1 - .07], [hw - .4, 2.97, z1 - .07], .13);
        }
        // Tables stay at the sides; the user's close façade poses and the
        // centre path remain clear instead of putting chairs against the door.
        const offsets = def.w > 10 ? [-3.4, 3.4] : [-1.65, 1.65];
        const rows = def.w > 10 ? [2.0, 4.0] : [2.55];
        for (const x of offsets) for (const z of rows) {
          const a = toH(x, z);
          if (!publicSpot(ctx, a.u, a.v, 1.1, 2.3, rot)) continue;
          P.push(0, .14, 0); visitor(P, M, x, z - .78, 0, tables + 1, true); P.pop();
          { const wt = H.W(a.u, a.v); knocks.tables.push({ spot: { x: wt.x, y: .14, z: wt.z, rotY: f.rot }, item: solid(K, a.u, a.v, 1.1, 2.3, .85, rot, .14) }); }      // (the table is a knock record, below)
          tables++;
        }
        for (const x of [-hw + .75, hw - .75]) {
          const z = far - .65, a = toH(x, z);
          { const wt = H.W(a.u, a.v); knocks.planters.push({ spot: { x: wt.x, y: .14, z: wt.z, rotY: f.rot }, item: solid(K, a.u, a.v, .9, .9, 1.2, rot, .14) }); }
        }
        for (const [x0, x1] of [[-hw, -1.5], [1.5, hw]]) {
          const a = toH((x0 + x1) / 2, far), wt = H.W(a.u, a.v), mid = (x0 + x1) / 2;      // the low terrace rail: a knock record of its own (kind fence)
          const railGeo = partsGeos((Q) => Q.box(M.larchDark, x0 - mid, x1 - mid, .38, .72, -.07, .02, 'b'));
          K.extraTris += knockFurniture(K.ctx, 'lmsevka-terrace-rails', railGeo, [{ x: wt.x, y: 0, z: wt.z, rotY: f.rot }], [solid(K, a.u, a.v, x1 - x0, .12, .8, rot, .14)],
            { kind: 'fence', mass: 80, h: .8, w: x1 - x0, d: .12, anchored: 8, hitK: 0.25, metal: false, minDv: 0 }, 200);
        }
        // A freestanding menu by the wall, outside the clear centre path.
        {
          const a = toH(hw - .6, 1.1), wm = H.W(a.u, a.v);
          K.extraTris += knockCaptured(K, 'lmsevka-menu', { x: wm.x, z: wm.z, rotY: f.rot }, (K2) => {
            K2.P.push(wm.x, .14, wm.z, f.rot);
            K2.P.box(M.larchDark, -.34, .34, 0, 1.25, -.08, .08, 'b');
            sign(K2, 'МЕНЮ', 0, .75, .12, .6, .75, def.id); K2.P.pop();
            return solid(K, a.u, a.v, .7, .25, 1.4, rot);
          }, { kind: 'sign', mass: 25, h: 1.4, w: .7, d: .25, anchored: 6, hitK: 0.15, metal: false, minDv: 0 }, 160, { x: 0, z: 0, rot: 0 });
        }
      }
      P.pop();
    });
    if (knocks.tables.length) K.extraTris += knockFurniture(K.ctx, 'lmsevka-terrace-tables', partsGeos((Q) => table(Q, M, 0, 0)), knocks.tables.map((q) => q.spot), knocks.tables.map((q) => q.item),
      { kind: 'table', mass: 40, h: .95, w: 1.1, d: 2.3, hitK: 0.2, metal: true, minDv: 0 }, 200);
    if (knocks.planters.length) K.extraTris += knockFurniture(K.ctx, 'lmsevka-terrace-planters', partsGeos((Q) => planter(Q, M, 0, 0)), knocks.planters.map((q) => q.spot), knocks.planters.map((q) => q.item),
      { kind: 'planter', mass: 160, h: 1.2, r: .5, hitK: 0.3, metal: false, minDv: 0 }, 200);
    const x = f.x + f.xa[0] * def.u + edge.n[0] * 3, z = f.z + f.xa[1] * def.u + edge.n[1] * 3;
    (svc.restaurants ||= []).push({ id: def.id, name: def.title, x, z, building: def.bld, terraceTables: tables });
  }
}

function room(K, def) {
  const { P, M } = K, hw = def.w / 2, ceiling = def.h + .03;
  // Back, floor, ceiling and returns enclose each large storefront opening.
  // These faces point INTO the alcove: an ordinary outward-facing box would
  // cull its back/ceiling from the terrace and expose the city through the wall.
  P.quad(M.plaster, [-hw, .12, -2.7], [hw, .12, -2.7], [hw, ceiling, -2.7], [-hw, ceiling, -2.7], [0, 0, 1]);
  P.quad(M.concPaint, [-hw, .12, -.25], [-hw, .12, -2.7], [-hw, ceiling, -2.7], [-hw, ceiling, -.25], [1, 0, 0]);
  P.quad(M.concPaint, [hw, .12, -2.7], [hw, .12, -.25], [hw, ceiling, -.25], [hw, ceiling, -2.7], [-1, 0, 0]);
  P.quad(M.concSoffit, [-hw, ceiling, -2.7], [hw, ceiling, -2.7], [hw, ceiling, -.25], [-hw, ceiling, -.25], [0, -1, 0]);
  P.box(M.larchDark, -hw, hw, .1, .15, -2.68, -.26, 'b');
  P.box(M.larchDark, -hw + .25, hw - .25, .14, .94, -2.42, -1.85, 'b');
  P.box(M.larch, -hw + .16, hw - .16, .94, 1.03, -2.5, -1.72, 'b');
  for (let x = -hw + .8; x < hw - .3; x += 1.3) {
    P.box(M.larchDark, x - .35, x + .35, 1.66, 1.75, -2.6, -2.20, 'b');
    for (const dx of [-.18, .18]) P.col(M.plaster, x + dx, -2.35, 1.75, 1.99, .07, .085, 8);
    P.col(M.black, x, -1.1, ceiling - .55, ceiling, .02, .02, 5);
    P.cyl(M.cultureTeal, [x, ceiling - .70, -1.1], [x, ceiling - .5, -1.1], .22, .08, 8, false);
    P.col(M.cultureLight, x, -1.1, ceiling - .71, ceiling - .68, .18, .18, 8);
  }
  for (const x of [-hw + 1.3, hw - 1.3]) {
    P.box(M.steelGrey, x - .27, x + .27, 1.03, 1.45, -2.36, -1.91, 'b');
    P.col(M.plaster, x, -1.78, 1.03, 1.18, .07, .07, 8);
  }
  tile(P, M, 24, hw * .42, 2.22, -2.65, Math.min(1.8, hw - .4), .8);
  // Glazing is recessed by yard.js; these mullions and door handles match it.
  for (let x = -hw; x <= hw + .001; x += def.w / 4) P.box(M.black, x - .04, x + .04, .12, def.h, -.28, -.20, 'b');
  P.box(M.black, -hw, hw, def.h - .09, def.h, -.28, -.20, 'b');
  for (const x of [-.2, .2]) P.cyl(M.copper, [x, 1.05, -.16], [x, 1.4, -.16], .028, .028, 6);
  P.push(0, .14, 0); visitor(P, M, -.5, -1.42, 0, 2); P.pop();
}
