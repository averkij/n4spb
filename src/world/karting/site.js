// Pit-Stop Нарвская, Перекопская 6. World X/Z in metres.
// Track survey: OSM w385655517, checked against the satellite image and TrackTakTak laps.
export const COURSE = [
  [-4717.3, 3509.4], [-4697.7, 3559.9], [-4682.2, 3605.4], [-4681.9, 3610.3],
  [-4682.8, 3614.5], [-4687.2, 3619.7], [-4694.1, 3621.4], [-4703, 3621.3],
  [-4710.8, 3619.4], [-4716.6, 3615.2], [-4718.3, 3608.3], [-4716, 3573.8],
  [-4717.4, 3568.1], [-4721.8, 3564.2], [-4729.7, 3564], [-4736.5, 3568],
  [-4741.2, 3575], [-4742.7, 3582.7], [-4732.2, 3631.6], [-4729.2, 3638],
  [-4723.7, 3642.4], [-4716.5, 3643], [-4705.2, 3639.5], [-4695.9, 3638.1],
  [-4687.6, 3640.2], [-4679.4, 3645.2], [-4671.1, 3654.9], [-4666.1, 3660.1],
  [-4660, 3662.4], [-4652.9, 3662.7], [-4648.7, 3661.8], [-4645.2, 3659.1],
  [-4643.4, 3653.6], [-4644.2, 3649.3], [-4650.2, 3640.9], [-4650.6, 3637.7],
  [-4649.3, 3634.6], [-4644.9, 3631.1], [-4638.4, 3630.5], [-4629.8, 3632],
  [-4619.8, 3635.6], [-4612.4, 3640.3], [-4608.1, 3644.8], [-4606.5, 3650.7],
  [-4608.1, 3656.7], [-4612.6, 3661.3], [-4642.3, 3675.8], [-4651.8, 3679.9],
  [-4661.4, 3680.8], [-4669.5, 3679], [-4676.4, 3675.3], [-4687.4, 3661.1],
  [-4694.7, 3657.6], [-4699.2, 3656.6], [-4704.4, 3656.9], [-4722.5, 3663.9],
  [-4730.2, 3664.8], [-4734.6, 3663.7], [-4738.2, 3660.3], [-4741.2, 3653.2],
  [-4761.2, 3579.2], [-4761.4, 3575.4], [-4760.5, 3571.8], [-4756.2, 3564.5],
  [-4735.2, 3542.4], [-4732.5, 3538.5], [-4731.5, 3533.3], [-4731.6, 3509.1],
  [-4729.3, 3506.3], [-4726, 3504.9], [-4722.2, 3504.6], [-4718.9, 3506.6],
];

// Metres along the mapped clockwise centreline. +1 faces the right of travel.
// These are the visible kerb runs on the reference satellite image.
export const KERB_RUNS = [
  [4, 18, 1], [36, 52, -1],
  [108, 158, 1], [168, 196, 1],
  [195, 216, -1], [208, 251, 1],
  [270, 300, -1], [288, 352, 1], [323, 348, -1],
  [355, 391, -1], [380, 417, 1],
  [420, 481, -1], [433, 455, 1],
  [500, 557, 1], [548, 568, -1],
  [569, 596, -1], [600, 631, 1],
  [666, 693, -1], [705, 738, 1], [738, 758, -1],
  [765, 789, 1], [790, 807, 1],
];

// Use the same boundary for the authored turf and the environment's claim mask.
export const COURSE_LAWN = [
  [-4746,3489], [-4716,3479], [-4701,3507], [-4688,3543], [-4669,3548], [-4656,3582],
  [-4657,3606], [-4636,3618], [-4610,3626], [-4598,3644], [-4600,3661], [-4624,3677],
  [-4661,3694], [-4681,3686], [-4696,3672], [-4723,3680], [-4748,3674], [-4772,3590],
  [-4773,3566], [-4757,3539],
];
export const KARTING_GROUND_CLAIMS = [{ module: 'kartingNarvskaya', rings: [COURSE_LAWN] }];

const SITE_WAYS = new Set(['w385655517', 'w564316332', 'w564319999', 'w564320000']);
export const SHELTER_ID = 'w1344693624';
export const STADIUM_IDS = ['w222657246', 'w1344693627', 'w222938662', 'w222938686', 'w1344693628', SHELTER_ID];
export const STADIUM_GROUP = { key: 'kirovets-karting', name: 'Стадион «Кировец»', nameEn: 'Kirovets Stadium', ids: STADIUM_IDS, osm: ['w1229866327', 'w1229866328', 'w1229866329', 'w1229866330', 'w1229866359'], at: [-4591, 3512] };
export const START_FINISH = [[-4716.448, 3559.705], [-4683.267, 3548.288]];
export const SPEED_CHECK = [-4731.8, 3518];

export const WALK_IN = [
  [-4569, 3367], [-4574.5, 3376], [-4580.4, 3383.2], [-4594.9, 3397.8],
  [-4618, 3406.3], [-4639.5, 3414.2], [-4648.8, 3424.6], [-4660.6, 3436.2],
  [-4670, 3449.5], [-4678.3, 3466.7], [-4683.6, 3486.8], [-4683.8, 3505.5],
  [-4679.1, 3521], [-4671.5, 3532.5], [-4669.3, 3548], [-4666, 3565.1],
  [-4662.6, 3578.2], [-4667, 3588], [-4674.7, 3585.6],
];

export const PIT_LANE = [
  [-4697.7, 3559.9], [-4689.3, 3565.6], [-4679.5, 3572.4], [-4677.5, 3575.6],
  [-4672.6, 3590], [-4668.6, 3601.4], [-4668.3, 3603.3], [-4669.5, 3605],
  [-4681.9, 3610.3],
];

// Low relief inferred from the approach and the footage. All elevations are
// relative to this scene's street datum. Fade back to street grade between runs.
export function relief(x, z) {
  const hill = (cx, cz, rx, rz, h) => h * Math.max(0, 1 - ((x - cx) / rx) ** 2 - ((z - cz) / rz) ** 2) ** 2;
  return .035 + hill(-4724, 3507, 33, 39, .78) + hill(-4760, 3563, 26, 34, .36)
    + hill(-4657, 3672, 33, 34, .45);
}

export function distSqToLine(x, z, points, closed = false) {
  let best = Infinity;
  for (let i = 0; i < points.length - (closed ? 0 : 1); i++) {
    const [ax, az] = points[i], [bx, bz] = points[(i + 1) % points.length];
    const dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, (x - ax - t * dx) ** 2 + (z - az - t * dz) ** 2);
  }
  return best;
}

export function trackKeepout(x, z) {
  if (x < -4770 || x > -4600 || z < 3497 || z > 3690) return false;
  return distSqToLine(x, z, COURSE, true) < 31 || distSqToLine(x, z, PIT_LANE) < 17;
}

function sceneryKeepout(x, z) {
  if (x < -4770 || x > -4495 || z < 3364 || z > 3690) return false;
  const dx = x + 4586.9, dz = z - 3514.6;
  const across = dx * .922 - dz * .386, along = dx * .386 + dz * .922;
  return trackKeepout(x, z)
    || Math.abs(across) < 56 && Math.hypot(across, Math.max(0, Math.abs(along) - 48)) < 58
    || distSqToLine(x, z, WALK_IN) < 5
    || x > -4680 && x < -4654 && z > 3547 && z < 3591;
}

export function withKartingHooks(hooks) {
  function reject(base, extra) {
    return ctx => {
      const original = base?.(ctx);
      return (x, z, ...args) => extra(x, z) || !!original?.(x, z, ...args);
    };
  }
  return {
    ...hooks,
    deckServices: [...(hooks.deckServices || []), 'kartingNarvskaya'],
    treeReject: reject(hooks.treeReject, sceneryKeepout),
    propReject: reject(hooks.propReject, sceneryKeepout),
    tuftReject: reject(hooks.tuftReject, sceneryKeepout),
    groundWayReject: (way) => SITE_WAYS.has(way.id || way) || hooks.groundWayReject?.(way),
    pedestrianOnly: ctx => {
      const original = hooks.pedestrianOnly?.(ctx);
      return way => SITE_WAYS.has(way.id) || !!original?.(way);
    },
  };
}
