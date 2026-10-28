// lib/docks.js - the SHARED DOCKS of the motor boats (drive/boat/index.js re-exports DOCKS): a place in the water where a boat is moored, { id, dock, x, z, yaw }. They live here, not in drive/, because the
// environment (quay.js) must keep the landing slabs of the quay stairs clear of a dock (the slab is a block for the player's boat, the dock's hull must stay free to leave: tools/boat-test.mjs 1, tools/boat-craft-test.mjs 1).
/**
 * The shared docks (street frame: x east, z south; yaw 0 faces +Z = south, forward = (sin yaw, cos yaw)).
 * anichkov: the Fontanka, on the west side of the river 80 m north of the Anichkov Bridge, beside the first quay stair (the stair at x -452.9, z -166.3; the pontoon of the tourist boats starts 8 m further north).
 *   The water edge on that row is at x -452.2, so the hull lies 2.35 m off it (the centre 3.3 m): the centre at x -448.9, z -170.3, the bow downstream (south, toward the bridge), parallel to the quay (the river runs along
 *   (0.183, -0.983): yaw -0.184 rad = -10.5 deg). The tourist pontoon (landmarksC/boats.js, no collider) starts 4.7 m north of the stern; the stair of the quay (x -452.9, z -166.3) ends at the boat's bow quarter.
 *   The pose of the owner's request (-451.2, -0.8, -169.8, yaw 684, pitch -16.3) is at the water edge, 2 m from the hull.
 */
export const DOCKS = [
  { id: 'boat', dock: 'anichkov', x: -448.9, z: -170.3, yaw: -0.184 },
];

/** the hull of a boat at its dock (the numbers of drive/boat/handling.js SPEC_BOAT; tools/boat-craft-test.mjs 1 checks they agree): beam, bow tip and transom from the origin, the hull's centre is `centerZ` ahead of it */
export const DOCK_HULL = { W: 1.9, front: 3.0, rear: -2.6, centerZ: 0.2 };
/** the clear water a dock keeps around its hull (m): tools/boat-test.mjs 1 "nothing within 0.5 m of the hull", plus the 0.06 m skin of drive/collision.js and a hand of slack */
export const DOCK_CLEAR = 0.5 + 0.06 + 0.04;
