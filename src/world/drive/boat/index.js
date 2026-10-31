// drive/boat/index.js - the WATER GARAGE: the boats that wait at their docks (drive.js builds one vehicle per entry, next to the cars) and the table of docks.
// A DOCK is a place in the water where a boat is moored: { id, name, x, z, yaw }. The table is per area like the car GARAGE (lib/area-tables.js GARAGE.boats; an area module may export its own list in GARAGE.boats),
// and without one the area gets the SHARED table below, filtered by its territory: a boat is built when its dock lies inside the play area AND on water (physics.waterLevel). So every area whose territory contains
// the Anichkov dock gets the boat, and an area that does not (the Smolninskoye) gets none; a new area needs no edit.
// An entry (the car's shape, drive/cars/index.js): { id, kind: 'boat', name, nameEn, label, labelEn, toast, spec, tuning, parked {x, z, yaw}, sound, hud, exhaust [], reach, makeModel(ctx) }.
import { GARAGE } from '../../lib/area-tables.js';
import { DOCKS } from '../../lib/docks.js';       // (the shared table of docks: the environment needs it too)
import { createBoatModel } from './model.js';
import { SPEC_BOAT, BOAT_TUNING } from './handling.js';
import { CONTAINER_SHIP_SPEC, CONTAINER_SHIP_TUNING, createContainerShipModel } from './container-ship.js';

export { DOCKS };

/** the key hint line of the boat's HUD (hud.js setProfile) */
const HUD_KEYS = '<kbd>W</kbd><kbd>S</kbd> газ · назад &nbsp; <kbd>A</kbd><kbd>D</kbd> руль &nbsp; <kbd>Space</kbd> стоп &nbsp; <kbd>G</kbd> сигнал &nbsp; <kbd>V</kbd> камера &nbsp; <kbd>R</kbd> на старт &nbsp; <kbd>E</kbd> выйти · exit';

const PRESENTATION ={ name: 'Катер', nameEn: 'Motor boat', label: 'Сесть в катер', labelEn: 'Get in the motor boat', toast: 'Катер · Motor boat · W S газ / реверс · A D руль', reach: 5.6 };

/** the outboard's voice (drive/sound.js profile, procedural): a low rough four-stroke burble that climbs with the revs (`chug` = the depth of the cylinder pulses), the wash of the water along the hull (`wash` grows with the speed
 *  and replaces the wind of a car) and now and then a slap of the bow (`splash`). Calm: no alarms. */
/** SOFTER and LOWER (the owner: "make the boat sound lower, more pleasant"): the whole voice is about 9 dB down (volume 0.9 -> 0.32), the pitch law is lower (a 26..106 Hz fundamental instead of 32..152), the buzzy saw / square pair
 *  is a triangle + a quiet saw + a sine sub, the low-pass opens only to ~0.7 kHz (was 1.8 kHz) with a gentle resonance, the cylinder pulse is a little deeper (a burble, not a buzz), the intake hiss is thin and the water wash is
 *  quieter and darker (wash 0.30 -> 0.17, its low-pass `washLp` 300..1000 Hz instead of 450..2150), the bow slaps are lower and softer. The car voices are untouched (their profiles do not have these fields). */
export const BOAT_SOUND = { types: ['triangle', 'sawtooth', 'sine'], f0: 26, fk: 80, subRatio: 0.5, detune: 1.010, gains: [0.50, 0.14, 0.32], lpBase: 120, lpRpm: 360, lpThr: 200, lpQ: 0.8,
  engBase: 0.11, engThr: 0.15, engRpm: 0.06, intake: 0.2, blip: false, wind: 1, volume: 0.32, wash: 0.17, washLp: [300, 700], chug: 0.45, splash: true, splashHz: [520, 280], splashVol: 0.6 };

/** the tuning of the boat in the car's format: createBoatHandling(ctx, tuning) */
export const boatTuning = (spec = SPEC_BOAT) => ({ ...BOAT_TUNING, spec, hf: spec.front - 0.02, hr: -spec.rear - 0.05, hw: spec.W / 2 + 0.02 });

/** the boats of this area: the area's own list (GARAGE.boats) or the shared docks, those that lie in the territory on water */
export function loadBoats(ctx, { carry = null, docks: suppliedDocks = null } = {}) {
  const L = ctx.L, ph = ctx.physics, list = suppliedDocks || (Array.isArray(GARAGE.boats) ? GARAGE.boats : DOCKS);
  const out = [];
  const docks = [...list];
  // The same named dock represents the same shared boat, including after a
  // collision renamed its local id. Different
  // named docks can reuse an id: keep the destination's boat and give the
  // incoming one an unambiguous local id. Old hand-offs without a dock keep
  // the previous id-only behaviour.
  const usable = (d) => d && Number.isFinite(d.x) && Number.isFinite(d.z) && (!L.inPlay || L.inPlay(d.x, d.z)) && (!ph.waterLevel || ph.waterLevel(d.x, d.z) != null);
  const same = (d) => usable(d) && (carry?.dock && d.dock ? d.dock === carry.dock : (d.id || 'boat') === carry?.id);
  if (carry && typeof carry.id === 'string' && Number.isFinite(carry.x) && Number.isFinite(carry.z) && Number.isFinite(carry.yaw) && !docks.some(same)) {
    // The arrival resolver can land just outside a shoreline. Match the
    // placement search's first 4 m ring rather than discarding the boat before
    // drive.arrive has a chance to check the whole hull and nearby colliders.
    const candidates = [[0, 0], ...Array.from({ length: 8 }, (_, i) => [4 * Math.cos(i * Math.PI / 4), 4 * Math.sin(i * Math.PI / 4)])];
    const wet = candidates.map(([dx, dz]) => ({ x: carry.x + dx, z: carry.z + dz })).find(({ x, z }) => (!L.inPlay || L.inPlay(x, z)) && (!ph.waterLevel || ph.waterLevel(x, z) != null));
    if (wet) {
      const ids = new Set(docks.filter(usable).map((d) => d.id || 'boat'));
      let id = carry.id;
      for (let n = 1; ids.has(id); n++) { const suffix = '_carry' + (n === 1 ? '' : n); id = carry.id.slice(0, 32 - suffix.length) + suffix; }
      docks.push({ ...carry, ...wet, id, carried: true, carriedFrom: carry.id });
    }
  }
  for (const d of docks) {
    if (!d || !Number.isFinite(d.x) || !Number.isFinite(d.z)) continue;
    if (L.inPlay && !L.inPlay(d.x, d.z)) continue;                         // the dock is outside the territory of this area
    if (ph.waterLevel && ph.waterLevel(d.x, d.z) == null) continue;        // no water at the dock (a data change): no boat rather than a boat on the pavement
    const ship = d.vessel === 'container-ship';
    const spec = { ...(ship ? CONTAINER_SHIP_SPEC : SPEC_BOAT) };
    out.push({
      id: d.id || 'boat', kind: 'boat', vessel: ship ? 'container-ship' : undefined, dock: d.dock || null, carried: !!d.carried, carriedFrom: d.carriedFrom || null, ...PRESENTATION,
      ...(ship ? { name: 'Контейнеровоз', nameEn: 'Container ship', label: 'Управлять контейнеровозом', labelEn: 'Take the container ship helm', toast: 'Контейнеровоз · W S тяга / реверс · A D руль · V мостик', reach: 9,
        boarding: { x: spec.W / 2 + 3, z: 76 }, chase: { near: 295, far: 430, height: 110, lookY: 24, lookAhead: 65 } } : {}),
      spec, tuning: ship ? { ...CONTAINER_SHIP_TUNING, edgeMargin: 6 } : boatTuning(spec), parked: { x: d.x, z: d.z, yaw: Number.isFinite(d.yaw) ? d.yaw : 0 },
      sound: BOAT_SOUND, hud: { boat: true, gearD: true, noBoost: true, noCondition: true, keys: HUD_KEYS }, exhaust: [], makeModel: (c) => ship ? createContainerShipModel(c) : createBoatModel(c),
    });
  }
  return out;
}
