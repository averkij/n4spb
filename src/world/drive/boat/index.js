// drive/boat/index.js - the WATER GARAGE: the boats that wait at their docks (drive.js builds one vehicle per entry, next to the cars) and the table of docks.
// A DOCK is a place in the water where a boat is moored: { id, name, x, z, yaw }. The table is per area like the car GARAGE (lib/area-tables.js GARAGE.boats; an area module may export its own list in GARAGE.boats),
// and without one the area gets the SHARED table below, filtered by its territory: a boat is built when its dock lies inside the play area AND on water (physics.waterLevel). So every area whose territory contains
// the Anichkov dock gets the boat, and an area that does not (the Smolninskoye) gets none; a new area needs no edit.
// An entry (the car's shape, drive/cars/index.js): { id, kind: 'boat', name, nameEn, label, labelEn, toast, spec, tuning, parked {x, z, yaw}, sound, hud, exhaust [], reach, makeModel(ctx) }.
import { GARAGE } from '../../lib/area-tables.js';
import { createBoatModel } from './model.js';
import { SPEC_BOAT, BOAT_TUNING } from './handling.js';

/**
 * The shared docks (street frame: x east, z south; yaw 0 faces +Z = south, forward = (sin yaw, cos yaw)).
 * anichkov: the Fontanka, on the west side of the river 80 m north of the Anichkov Bridge, beside the first quay stair (the stair at x -452.9, z -166.3; the pontoon of the tourist boats starts 8 m further north).
 *   The water edge is at x -451.2 there, so the hull lies 2.7 m off it: the centre at x -447.6, z -170.3, the bow upstream-south, parallel to the quay (the river runs along (0.183, -0.983): yaw -0.184 rad = -10.5 deg).
 *   The pose of the owner's request (-451.2, -0.8, -169.8, yaw 684, pitch -16.3) looks at it from the water edge.
 */
export const DOCKS = [
  { id: 'boat', dock: 'anichkov', x: -448.9, z: -170.3, yaw: -0.184 },
];

/** the key hint line of the boat's HUD (hud.js setProfile) */
const HUD_KEYS = '<kbd>W</kbd><kbd>S</kbd> газ · назад &nbsp; <kbd>A</kbd><kbd>D</kbd> руль &nbsp; <kbd>Space</kbd> стоп &nbsp; <kbd>G</kbd> сигнал &nbsp; <kbd>V</kbd> камера &nbsp; <kbd>R</kbd> на старт &nbsp; <kbd>E</kbd> выйти · exit';

const PRESENTATION ={ name: 'Катер', nameEn: 'Motor boat', label: 'Сесть в катер', labelEn: 'Get in the motor boat', toast: 'Катер · Motor boat · W S газ / реверс · A D руль', reach: 5.6 };

/** the outboard's voice (drive/sound.js profile, procedural): a low rough four-stroke burble that climbs with the revs (`chug` = the depth of the cylinder pulses), the wash of the water along the hull (`wash` grows with the speed
 *  and replaces the wind of a car) and now and then a slap of the bow (`splash`). Calm: no alarms. */
export const BOAT_SOUND = { types: ['sawtooth', 'square', 'sawtooth'], f0: 32, fk: 120, subRatio: 0.5, detune: 1.012, gains: [0.40, 0.30, 0.22], lpBase: 240, lpRpm: 950, lpThr: 600, lpQ: 1.6,
  engBase: 0.11, engThr: 0.16, engRpm: 0.07, intake: 0.6, blip: false, wind: 1, volume: 0.9, wash: 0.30, chug: 0.35, splash: true };

/** the tuning of the boat in the car's format: createBoatHandling(ctx, tuning) */
export const boatTuning = (spec = SPEC_BOAT) => ({ ...BOAT_TUNING, spec, hf: spec.front - 0.02, hr: -spec.rear - 0.05, hw: spec.W / 2 + 0.02 });

/** the boats of this area: the area's own list (GARAGE.boats) or the shared docks, those that lie in the territory on water */
export function loadBoats(ctx) {
  const L = ctx.L, ph = ctx.physics, list = Array.isArray(GARAGE.boats) ? GARAGE.boats : DOCKS;
  const out = [];
  for (const d of list) {
    if (!d || !Number.isFinite(d.x) || !Number.isFinite(d.z)) continue;
    if (L.inPlay && !L.inPlay(d.x, d.z)) continue;                         // the dock is outside the territory of this area
    if (ph.waterLevel && ph.waterLevel(d.x, d.z) == null) continue;        // no water at the dock (a data change): no boat rather than a boat on the pavement
    const spec = { ...SPEC_BOAT };
    out.push({
      id: d.id || 'boat', kind: 'boat', ...PRESENTATION, spec, tuning: boatTuning(spec), parked: { x: d.x, z: d.z, yaw: Number.isFinite(d.yaw) ? d.yaw : 0 },
      sound: BOAT_SOUND, hud: { boat: true, gearD: true, noBoost: true, noCondition: true, keys: HUD_KEYS }, exhaust: [], makeModel: (c) => createBoatModel(c),
    });
  }
  return out;
}
