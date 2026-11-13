// traffic - the vehicles of Saint Petersburg: moving traffic on the lane graph of the streets module (one-way carriageways of Nevsky, signals with the 110 s plan, queues, give way to
// pedestrians), buses / articulated buses / trolleybuses with dwell at the stops, kerbside parked cars in streets.parkedSlots.
//
// WHAT IT DRAWS / DOES (code in traffic/):
//   fleetdata.js  the Petersburg fleet as data: 21 archetypes (11 car families: Solaris-class sedans, Lada Granta / Vesta (+ SW), Chinese compact crossovers, small / mid crossovers, large SUVs,
//                 liftbacks, premium sedans, hatches, MPVs; delivery vans, box trucks, minibuses; turquoise city buses 12 m / 9.5 m / articulated 18 m, two trolleybus liveries,
//                 the red-purple "Сити Тур" double-decker, tourist coaches), palettes with the research frequencies (white / grey / black / silver dominate), plate regions 78 / 178 / 98 / 198,
//                 route list for the LED boards; livery variants: white-yellow TAXIS (12 % of the cars: stripe + roof lamp), police (white + blue stripe, text) and ambulance (white + red stripe,
//                 text, red cross) WITHOUT beacon bars and silent (user rule: no sirens / flashing lights)
//   mk.js         shared model helpers;   models.js  cars, vans, truck (two levels of detail: ~600 / ~150 triangles);   buses.js  buses, trolleybuses, articulated pair, double-decker, coach
//   fleet.js      InstancedMeshes (paint / glass / lamps per kind and LOD, livery layers, occupants, steering wheels, taxi lamps, LED route boards, trolley poles), car shader (instance colour on
//                 paint only, a darker sill: the cars are rain-washed, plate atlas), lamps as emissive (DRL by day, bloom + brake lights at night)
//   plates.js     canvas atlases: plates (no flag on them), LED route boards, livery text decals
//   wireindex.js  spatial index of streets.wires.pairs: the lanes under the wires (trolleybuses only drive there) and the wire point each pole touches
//   sim.js        the car-following simulation (IDM) on streets.lanes + connectors: signals, stop lines, give way, left-turn gaps, queues, exit-room check, bus dwell at the stops, a collision
//                 safety net between segments; deterministic in the simulation time (fixed step 1/15 s, restarts when t runs backwards: screenshots call window.__sim(t))
//   parking.js    occupancy of streets.parkedSlots (parallel bays 66-86 %, lots 40-90 %)
// Sources: docs/research/transport.md (fleet statistics, catalogue, 91 photos in SP/refs/transport), docs/streets-api.md (the lane graph, wires, stops), the Yakutsk sibling's traffic module.
//
// SERVICE  ctx.services.traffic = {
//   vehicles: [{ id, kind, x, z, rotY, speed }]   the MOVING vehicles, updated every frame (kind = archetype key; rotY = the direction it faces, three.js convention)
//   parked:   [{ x, z, rotY, kind }]              every parked car (static)
//   blockers(): [{ x, z, w, d, hw, hd, rotY, vx, vz, speed, kind }]   oriented rectangles of the moving vehicles (w across, d along, half sizes hw / hd) for pedestrians, plus services.traffic.extraBlockers
//                (set by drive.js: the player's own car, kind 'player')
//   sim: the simulation (debug), stats: { moving, parked, l0, l1 }
// }
// Physics: parked cars are solid boxes; moving vehicles within 30 m of the player are dynamic boxes (ctx.physics.addDynamic).
// Pedestrians: vehicles stop at the line while services.people.crossingBusy(crosswalk id) is true (read lazily: people is built after traffic).
// Tuning: traffic/sim.js SPAWN_MEAN (seconds between cars per source lane: Nevsky / Ligovsky 34 s, side streets 60-300 s), CAP = 340 vehicles in the whole network (a full network admits nobody:
// the uniform 110 s plan gives the avenues ~50 % red, so queues are long; without the cap a jam grows without bound), TAXI_SHARE 12 %, trolleybus every ~42 s per wired kerb lane.
// Debug: ?tr=nopark,nomove skip parts; ?tr=gallery shows one of every model on the square (z-fight / look review); node tools/traffic-test.mjs [--minutes N --peds --parked --bench --diag].
//
// WEST (Nevsky west of the Fontanka to the Admiralty, Palace Square, Isaac's Square; wave 3, docs/research/west-life-furniture.md section 3):
//   * simulation: REGIONAL (only the lanes within ~420 m of the camera exist; cars are seeded at the region edge beyond the 340 m cull radius, retired when their lifespan (200-440 s) is over AND
//     nobody sees them: outside the view frustum and > 60 m away, or > 230 m away - one-way rings would otherwise fill up); yard / service lanes get no segment; sim creation ~0.7 s, parked planning ~0.25 s
//   * junction clusters (the nodes of Nevsky x Sadovaya, the Palace Bridge ends ...): micro lanes (< 24 m between two nodes) count as part of the box (c.confLanes), a car enters a micro exit lane only
//     when it can leave it (red / amber light at its end, occupied crossing beyond: sim.js throughBlocked), a car that crossed a signalled line on green is not stopped again by the micro links of the
//     cluster (v.pass), mid-block pedestrian lights within 14 m behind a junction exit are respected (a car does not enter on a light that turns red before it arrives: lightBlocks)
//   * density: WEST_DENS per road rank (Nevsky 8-12 vehicles per 100 m of a carriageway, Palace Square roads nearly empty, Dvortsovy proezd / bridge x1.2), the red-brown bus lane of Nevsky west carries
//     buses / trolleybuses / taxis only (a PT vehicle or taxi every ~95 m; private cars avoid it when choosing a turn), taxis 14 %, sightseeing double-deckers / coaches stop 28-50 s at the
//     pick-up bays (Дворцовая площадь, Исаакиевская, Гостиный двор, Казанск..., Адмиралтейск..., Конюшенн...: sim.js TOUR_STOP)
//   * bridges: vehicles ride the humped decks of every bridge (services.bridges.deckY, the Palace Bridge crown is +2.4 m) and pitch with them
//   * parked: ~2.5 k cars in the kerb bays / lots of streets.parkedSlots, never on a bridge deck or on the Palace Square polygon, never inside a building; taxi ranks (Admiralteysky corner 5, Kazanskaya st,
//     Isaac's Sq, Gostiny Dvor side: white taxis with a driver), coaches / double-decker / minibuses at the Isaac's Square loop, Kazanskaya st and the Moika at the Pevchesky bridge
// TRAMS (traffic/trams.js, model in buses.js): red and cream one-section cars on the rails of streets.tram: route 3 (Sadovaya / Apraksin Dvor - Gostiny Dvor - Italyanskaya - Mikhailovsky Castle - Letny Sad),
//   one line per direction (the two directions are different OSM ways, the north twin of the southbound track lies outside the strip); ~5 cars on the map, stops, signals, a raised pantograph;
//   ?tr=notram switches them off. The car lanes that lie on their rails are left to them
// BUS ROUTES: the route boards come from the stops of the area (trolleybus 1 3 5 7 8 10 11 12 15 16 17 22 28 42, bus 2 3 7 10 15 22 24 26 27 46 49 54 65 70 71 74 76 105 141 181 191 225 290), trolleybuses only under the wires
//   streets draws; traffic.js PALACE_ROUTES gives the boards of the Palace Bridge lanes
// PARKED: the kerb bays / lots of streets.parkedSlots inside the data extent, with the rules of traffic/parking.js (not beside tram rails, archway mouths, gates of the sights), taxi ranks at the metro pavilions,
//   coaches at the sights where a quiet kerb exists
// TODO / NOT BUILT (next iteration): no two-wheelers in the traffic (cyclists / e-scooters belong to the people module), no lane changes / overtaking (a bus dwelling at a stop blocks its lane for 12-28 s; cars rarely use the bus lane), bus doors do not animate, no turn indicators, no
// couriers / scooters / motorcycles / municipal vehicles, no tram contact wire on the streets (streets draws none yet: docs/research/petro-requests-traffic.md), the trolleybus routes follow the wired lanes found by geometry (streets.wires), a few short unwired lanes are driven through.
import { bindCarImpact, bindParkedImpact } from './traffic/impact.js';
import { getCarWrecks } from './drive/wrecks.js';
import * as THREE from 'three';
import { createSim } from './traffic/sim.js';
import { createFleet, CULL_R } from './traffic/fleet.js';
import { planParked } from './traffic/parking.js';
import { ARCH, MODEL_KINDS, archOf, TAXI_WHITE, ROUTE_BY_REF } from './traffic/fleetdata.js';
import { STATIONS } from './data/city.js';
import { northDeckHeight } from './northBridges/sites.js';

const DBG = (typeof location !== 'undefined' && new URLSearchParams(location.search).get('tr')) || '';
const TAU = Math.PI * 2;

export async function build(ctx) {
  const st = ctx.services.streets;
  const svc = ctx.services.traffic = { vehicles: [], parked: [], blockers: () => [], stats: { moving: 0, parked: 0, l0: 0, l1: 0 } };
  if (!st || !st.lanes) { console.warn('[traffic] streets service missing: no vehicles'); return; }
  const wrecks = await getCarWrecks(ctx);

  // ---- parked cars
  let plan = DBG.includes('nopark') ? { cars: [], stats: {} } : planParked(ctx, st);
  if (DBG.includes('gallery')) plan = { cars: gallery(ctx), stats: {} };
  const parkedRecs = plan.cars.map((p) => ({
    kind: p.kind, x: p.x, y: p.y, z: p.z, c: p.c, s: p.s, color: new THREE.Color(p.color), plate: p.plate, lamp: null, driver: p.driver, pax: p.pax, taxi: p.taxi, police: !!p.police, amb: !!p.amb, route: undefined, tips: null,
  }));
  for (const [index, p] of plan.cars.entries()) {
    const a = archOf(p.kind), ox = Math.sin(p.rotY) * (a.front + a.rear) / 2, oz = Math.cos(p.rotY) * (a.front + a.rear) / 2;
    const collider = ctx.physics.addBox(p.x + ox, p.z + oz, a.wid + 0.08, a.len + 0.08, p.rotY, 0, a.hgt);
    bindParkedImpact(collider, parkedRecs[index], a, wrecks);
    svc.parked.push({ x: p.x, z: p.z, rotY: p.rotY, kind: p.kind });
  }

  // ---- moving traffic: only the lanes within ~420 m of the camera exist (sim.js regional simulation); ?tr=whole simulates the whole network
  const camPos = ctx.camera.position, centre = [0, 0];
  const L = ctx.L;
  // retired vehicles (sim.js: a trip ends when nobody can see the car): outside the view frustum and > 60 m away, or > 230 m away
  const frus = new THREE.Frustum(), projView = new THREE.Matrix4(), ball = new THREE.Sphere(new THREE.Vector3(), 4);
  const hidden = (x, z) => {
    const dx = x - camPos.x, dz = z - camPos.z, d2 = dx * dx + dz * dz;
    if (d2 > 230 * 230) return true;
    if (d2 < 60 * 60) return false;
    ball.center.set(x, 1.5, z); return !frus.intersectsSphere(ball);
  };
  // the Anichkov Bridge is a humped deck (+0.06 m at the abutments, +1.5 m at the crown): vehicles on it ride at the deck height and pitch with its slope (landmarksC.bridge.deckY)
  const westDeckY = bridgeDeck(ctx), SV = ctx.services;
  // the east bridges (Smolninskoye: the Alexander Nevsky Bridge) publish their own deck-height service, asked first (as in the source); without it the chain is exactly the west one
  const deckY = SV.eastBridges ? (x, z, rot) => SV.eastBridges.deckY(x, z) ?? (westDeckY ? westDeckY(x, z, rot) : null) : westDeckY;
  const sim = DBG.includes('nomove') || DBG.includes('gallery') ? null : createSim(st, () => ctx.rng('traffic-sim'), {
    trams: !DBG.includes('notram'), tramStops: STATIONS.filter((q) => q.kind === 'tram'),
    // a road that the data extent cuts in the middle of a river crossing ends on the last dry metre (outside the play area only: inside it every crossing has its deck)
    wet: (x, z) => L.inRiver(x, z) && (!deckY || deckY(x, z) === null), inPlay: (x, z) => L.inPlay(x, z, 0),
    extent: L.EXTENT, atEdge: (x, z, m = 70) => !L.inExtent(x, z, m),
    centre: DBG.includes('whole') ? undefined : () => { centre[0] = camPos.x; centre[1] = camPos.z; return centre; },
    radius: Math.max(260, CULL_RADIUS(ctx) + 80),
    routes: routeProvider(st), hidden,
    pedBusy: (id) => { const pp = ctx.services.people; return !!(pp && pp.crossingBusy && pp.crossingBusy(id)); },
  });
  const pk = {}; for (const p of plan.cars) pk[p.kind] = (pk[p.kind] || 0) + 1;
  const capacity = {}, lod0Cap = {};
  for (const k of MODEL_KINDS) {
    const a = archOf(k), bus = !!a.bus;
    capacity[k] = (pk[k] || 0) + (bus ? 30 : 120); lod0Cap[k] = bus ? 14 : 60;
  }
  const fleet = createFleet(ctx, { capacity, lod0Cap, persons: 280 });
  const wireIdx = sim && sim.stats.wired ? sim.stats.wired.index : null;
  const night = ctx.shared.uNight;
  const camera = ctx.camera;
  const blockers = [], bpool = [], dyn = [];      // blockers = the output list (the pooled vehicle rectangles + svc.extraBlockers, e.g. the player's car), bpool = the pooled rectangles
  const px = ctx.player.position;
  svc.sim = sim;
  svc.blockers = () => blockers;

  // the two wire points a trolleybus's poles touch: 4.3 m behind the pad, on the contact-wire pair under the bus (null -> folded poles)
  const tipsBuf = new Float32Array(8);
  const POLE_LEN = 4.3, FOLD = 3.4;
  function trolleyTips(rec, c, s, x, z, rot) {
    const pole = rec.pole; if (!pole) return null;
    const fx = s, fz = c, bx = x + fx * pole.z, bz = z + fz * pole.z;
    const w = wireIdx ? wireIdx.query(bx - fx * POLE_LEN, bz - fz * POLE_LEN, fx, fz, 2.8, 0.8) : null;
    const t = tipsBuf;
    if (w) {
      let nx = -w.tz, nz = w.tx; if (nx * c + nz * -s < 0) { nx = -nx; nz = -nz; }          // normal towards the car's left (+X = (c, -s))
      t[0] = w.x + nx * 0.25; t[1] = w.y; t[2] = w.z + nz * 0.25;
      t[3] = w.x - nx * 0.25; t[4] = w.y; t[5] = w.z - nz * 0.25;
      t[6] = w.tz; t[7] = w.tx;
    } else {                                                                                   // no wire here: the poles lie folded back along the roof
      for (let q = 0; q < 2; q++) { const sx = q ? -pole.x : pole.x; t[q * 3] = x + c * sx + fx * (pole.z - FOLD); t[q * 3 + 1] = pole.y + 0.25; t[q * 3 + 2] = z - s * sx + fz * (pole.z - FOLD); }
      t[6] = c; t[7] = s;
    }
    void rot;
    return t;
  }

  const GROUND = 0.03;
  /** rec.y / cp / sp (cos / sin of the nose-up angle) from the road height under the two axles of a vehicle at (x, z) heading rot (wb = wheelbase) */
  function lift(rec, x, z, rot, wb) {
    const h = wb / 2, fx = Math.sin(rot) * h, fz = Math.cos(rot) * h;
    const yf = deckY(x + fx, z + fz, rot), yr = deckY(x - fx, z - fz, rot);
    if (yf === null && yr === null) { rec.y = GROUND; rec.cp = 1; rec.sp = 0; return; }
    const a = yf === null ? GROUND : yf, b = yr === null ? GROUND : yr, d = Math.hypot(wb, a - b) || 1;
    rec.y = (a + b) / 2 + GROUND; rec.cp = wb / d; rec.sp = (a - b) / d;
  }

  let lastT = -1;
  const frame = (t, parkedOnly = false) => {
    const sim_ = parkedOnly ? null : sim;
    camera.updateMatrixWorld();
    frus.setFromProjectionMatrix(projView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    const alpha = sim_ ? sim_.advanceTo(t) : 0;
    const nt = night ? night.value : 0;
    fleet.begin(camera);
    for (const r of parkedRecs) fleet.push(r);
    let nb = 0, nd = 0, nv = 0;
    if (sim_) {
      const head = 0.78 + 1.9 * nt, tailBase = 0.38 + 0.8 * nt;
      for (const v of sim_.vehicles) {
        let rec = v.rec;
        const parts = v.arch.parts;
        if (!rec) {
          const kind = parts ? parts[0] : v.kind;
          rec = v.rec = { kind, x: 0, y: 0.03, z: 0, c: 1, s: 0, color: new THREE.Color(v.color), plate: v.plate, lamp: [0, 0, 0], driver: true, pax: v.pax, taxi: v.taxi, police: v.police, amb: v.amb, route: v.route, door: 0, tips: null, pole: fleet.K[kind].model.pole || null };
          if (parts) v.rec2 = { kind: parts[1], x: 0, y: 0.03, z: 0, c: 1, s: 0, color: rec.color, plate: v.plate, lamp: [0, 0, 0], driver: false, pax: false, taxi: false, police: false, amb: false, route: undefined, door: 0, tips: null, pole: null };
        }
        // Rapier owns the pose after impact. Do not put the wreck back on its lane.
        if (rec.wrecked) { fleet.push(rec); continue; }
        const x = v.px + (v.x - v.px) * alpha, z = v.pz + (v.z - v.pz) * alpha;
        let dr = v.rot - v.prot; dr -= TAU * Math.round(dr / TAU);
        const rot = v.prot + dr * alpha;
        rec.x = x; rec.z = z; rec.c = Math.cos(rot); rec.s = Math.sin(rot); rec.door = v.door;
        if (deckY) lift(rec, x, z, rot, v.wb);
        rec.lamp[0] = head; rec.lamp[1] = v.brake ? 2.1 + 0.4 * nt : tailBase; rec.lamp[2] = 0;
        if (rec.pole) {
          const dd = (x - px.x) ** 2 + (z - px.z) ** 2;
          rec.tips = dd < 70 * 70 ? trolleyTips(rec, rec.c, rec.s, x, z, rot) : null;
        }
        fleet.push(rec);
        if (parts) {
          const r2 = v.rec2, x2 = v.px2 + (v.x2 - v.px2) * alpha, z2 = v.pz2 + (v.z2 - v.pz2) * alpha;
          let d2 = v.rot2 - v.prot2; d2 -= TAU * Math.round(d2 / TAU);
          const rot2 = v.prot2 + d2 * alpha;
          r2.x = x2; r2.z = z2; r2.c = Math.cos(rot2); r2.s = Math.sin(rot2); if (deckY) lift(r2, x2, z2, rot2, v.wb); r2.lamp[0] = 0; r2.lamp[1] = rec.lamp[1]; r2.lamp[2] = 0;
          fleet.push(r2);
        }
        // services
        let o = svc.vehicles[nv]; if (!o) o = svc.vehicles[nv] = { id: 0, kind: '', x: 0, z: 0, rotY: 0, speed: 0 };
        o.id = v.id; o.kind = v.kind; o.x = x; o.z = z; o.rotY = rot; o.speed = v.v; nv++;
        const a = v.arch, ox = Math.sin(rot) * (a.front + a.rear) / 2, oz = Math.cos(rot) * (a.front + a.rear) / 2;
        let b = bpool[nb]; if (!b) b = bpool[nb] = { x: 0, z: 0, w: 0, d: 0, hw: 0, hd: 0, rotY: 0, vx: 0, vz: 0, speed: 0, kind: '' };
        b.x = x + ox; b.z = z + oz; b.w = v.wid; b.d = v.len; b.hw = v.wid / 2; b.hd = v.len / 2; b.rotY = rot; b.speed = v.v; b.vx = Math.sin(rot) * v.v; b.vz = Math.cos(rot) * v.v; b.kind = v.kind; nb++;
        if (Math.abs(x - px.x) < 30 && Math.abs(z - px.z) < 30) {
          const front = parts ? archOf(parts[0]) : a;
          let q = dyn[nd]; if (!q) q = dyn[nd] = { cx: 0, cz: 0, w: 0, d: 0, rotY: 0, y0: 0, y1: 2 };
          q.cx = x + Math.sin(rot) * (front.front + front.rear) / 2; q.cz = z + Math.cos(rot) * (front.front + front.rear) / 2; q.w = v.wid; q.d = front.len; q.rotY = rot; q.y0 = rec.y - GROUND; q.y1 = rec.y - GROUND + a.hgt; bindCarImpact(q, v, sim_.time, rec, front, wrecks); nd++;
          if (parts) {
            const r2 = archOf(parts[1]), x2 = v.px2 + (v.x2 - v.px2) * alpha, z2 = v.pz2 + (v.z2 - v.pz2) * alpha, rot2 = v.rec2 ? Math.atan2(v.rec2.s, v.rec2.c) : rot;
            let q2 = dyn[nd]; if (!q2) q2 = dyn[nd] = { cx: 0, cz: 0, w: 0, d: 0, rotY: 0, y0: 0, y1: 2 };
            q2.cx = x2 + Math.sin(rot2) * (r2.front + r2.rear) / 2; q2.cz = z2 + Math.cos(rot2) * (r2.front + r2.rear) / 2; q2.w = v.wid; q2.d = r2.len; q2.rotY = rot2; q2.y0 = v.rec2.y - GROUND; q2.y1 = v.rec2.y - GROUND + a.hgt; bindCarImpact(q2, v, sim_.time, v.rec2, r2, wrecks); nd++;
          }
        }
      }
    }
    svc.vehicles.length = nv; blockers.length = 0; for (let i = 0; i < nb; i++) blockers.push(bpool[i]);
    for (const wreck of wrecks.blockers()) blockers.push(wreck);
    if (svc.extraBlockers) for (const e of svc.extraBlockers) blockers.push(e);
    dyn.length = nd;
    fleet.end();
    svc.stats.moving = nv; svc.stats.parked = parkedRecs.length; svc.stats.l0 = fleet.stats.l0; svc.stats.l1 = fleet.stats.l1;
    lastT = t;
  };
  ctx.physics.addDynamic(() => dyn);
  ctx.onUpdate((dt, t) => { if (t === lastT && dt === 0) { /* re-push for a moved camera (screenshots) */ } frame(t); });
  frame(0, true);       // (parked cars only: the regional simulation starts at the first update, when the camera stands where the player was placed)
}

/** the cull radius of the vehicle meshes (fleet.js CULL_R x the quality tier): the simulation region is a little larger */
function CULL_RADIUS(ctx) { return CULL_R * ((ctx.quality && ctx.quality.cull) || 1); }

/** height of the road deck under (x, z) or null: the humped decks of every bridge (services.bridges.deckY wraps landmarksC.bridge.deckY), with a coarse prefilter by the bridge positions */
function westBridgeDeck(ctx) {
  const lc = ctx.services.landmarksC && ctx.services.landmarksC.bridge && ctx.services.landmarksC.bridge.deckY;
  const br = ctx.services.bridges;
  const fn = (br && br.deckY) || lc || null;
  if (!fn) return null;
  const sites = br && br.list && br.list.length ? br.list : null;
  if (!sites) return fn;
  const R2 = 190 * 190;
  return (x, z) => { for (let i = 0; i < sites.length; i++) { const b = sites[i], dx = b.x - x, dz = b.z - z; if (dx * dx + dz * dz < R2) return fn(x, z); } return lc ? lc(x, z) : null; };
}

/** the decks under a vehicle: the raised decks of the module northBridges (the Bolsheokhtinsky Bridge of Smolninskoye; the source asks them first, they lie far from the west bridges) before the west decks above */
function bridgeDeck(ctx) {
  const west = westBridgeDeck(ctx), nb = ctx.services.northBridges && ctx.services.northBridges.deckY;
  if (!nb) return west;
  // Embankment traffic can pass beneath a Neva bridge at the same X/Z. Only
  // vehicles aligned with its road axis ride the deck; test both axles alike.
  return (x,z,rot) => {
    const aligned=rot===undefined||northDeckHeight(x,z,Math.sin(rot),Math.cos(rot))!==null;
    const d=aligned?nb(x,z):null;
    return d!==null&&d!==undefined?d:west?west(x,z):null;
  };
}

/** the Palace Bridge (docs/research/vo-roster-metro.md 3.1, OSM 2026 mapper state [L]): street (lane name) -> [trolleybus refs, bus refs] of the flow that runs to Vasilievsky Island (the stop data of the bridge knows only a few relations) */
const PALACE_ROUTES = [/Университетская набережная|Дворцовый мост/, ['1', '10', '11', '28'], ['6', '7', '24']];

/**
 * The route boards of a lane: the routes of the stops whose bay lies on the lane (within 6 m, same direction), else (trolleybus) the trolley routes of its road, else the routes of the nearest
 * stop ahead / behind within 700 m; cached per lane. -> (seg, trolley) => [route index] | null
 */
function routeProvider(st) {
  const roadTrolley = new Map((st.roads || []).filter((r) => r.trolley && r.trolley.length).map((r) => [r.id, r.trolley]));
  const bays = (st.busStops || []).filter((b) => b.bay && b.routes && ((b.routes.bus && b.routes.bus.length) || (b.routes.trolley && b.routes.trolley.length)));
  const cache = new Map();
  const toIdx = (refs, trolley) => { const o = []; for (const r of refs || []) { const i = ROUTE_BY_REF.get((trolley ? 'T' : 'A') + r); if (i !== undefined) o.push(i); } return o; };
  return (seg, trolley) => {
    const key = seg.id + (trolley ? 'T' : 'A'); let c = cache.get(key); if (c !== undefined) return c;
    // the Palace Bridge: the routes of a lane by the street it runs on
    { const nm = seg.lane && seg.lane.name;
      if (nm && PALACE_ROUTES[0].test(nm)) { const o = toIdx(trolley ? PALACE_ROUTES[1] : PALACE_ROUTES[2], trolley); if (o.length) { cache.set(key, o); return o; } } }
    const set = new Set(); let near = null, nd = 1e9;
    const { xs, zs, n } = seg;
    for (const b of bays) {
      const refs = trolley ? b.routes.trolley : b.routes.bus; if (!refs || !refs.length) continue;
      let best = 1e9, tx = 0, tz = 1;
      for (let i = 0; i + 1 < n; i++) {
        const ax = xs[i], az = zs[i], dx = xs[i + 1] - ax, dz = zs[i + 1] - az, l2 = dx * dx + dz * dz || 1e-9;
        let u = ((b.bay.x - ax) * dx + (b.bay.z - az) * dz) / l2; u = u < 0 ? 0 : u > 1 ? 1 : u;
        const d = Math.hypot(ax + dx * u - b.bay.x, az + dz * u - b.bay.z);
        if (d < best) { best = d; const l = Math.sqrt(l2); tx = dx / l; tz = dz / l; }
      }
      if (best < 6 && tx * b.bay.tx + tz * b.bay.tz > 0.6) for (const r of toIdx(refs, trolley)) set.add(r);
      else if (best < nd && tx * b.bay.tx + tz * b.bay.tz > 0.3) { nd = best; near = refs; }
    }
    if (!set.size && trolley) { const refs = roadTrolley.get(seg.lane.road); if (refs) for (const r of toIdx(refs, true)) set.add(r); }
    if (!set.size && near && nd < 700) for (const r of toIdx(near, trolley)) set.add(r);
    c = set.size ? [...set] : null; cache.set(key, c); return c;
  };
}

/** one of every model (taxi / police / ambulance variants included) in two rows facing west / east near the Moscow station forecourt (?tr=gallery); view them from the side / the front */
function gallery(ctx) {
  const out = [];
  const list = MODEL_KINDS.filter((k) => k !== 'artic_r').map((k) => ({ kind: k })).concat([{ kind: 'sedan', taxi: true }, { kind: 'cross_c', taxi: true }, { kind: 'liftback', police: true }, { kind: 'van', police: true }, { kind: 'van', amb: true }]);
  const colors = ['#eceae4', '#b9bcbf', '#1d1f23', '#4a4d52', '#a52a2b', '#2c4a86'];
  list.forEach((e, i) => {
    const a = archOf(e.kind), col = i % 8, row = Math.floor(i / 8), rot = Math.PI / 2 * (row % 2 ? -1 : 1);
    const x = 560 + col * 14.5, z = 215 + row * 9, bus = !!a.bus;
    const color = e.taxi ? TAXI_WHITE : (e.police || e.amb) ? '#f4f4f1' : bus ? ARCH[e.kind] && ARCH[e.kind].trolley ? '#1f7fd6' : '#5fc4b8' : colors[i % colors.length];
    out.push({ id: i, kind: e.kind, x, z, y: 0.03, rotY: rot, c: Math.cos(rot), s: Math.sin(rot), hl: a.len / 2, hw: a.wid / 2, color: PAINT(e.kind, color), plate: i % 36, driver: true, pax: i % 3 === 0, taxi: !!e.taxi, police: !!e.police, amb: !!e.amb, slot: 'gallery' });
  });
  void ctx;
  return out;
}
const BUS_PAINT = { bus: '#5fc4b8', midi: '#5fc4b8', artic: '#5fc4b8', trolley: '#1f7fd6', trolley2: '#2a74c8', dd: '#d8352a', coach: '#f1f1ee' };
const PAINT = (kind, dflt) => BUS_PAINT[kind] || dflt;
