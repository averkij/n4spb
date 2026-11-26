// The beret outfit has an overlapping waist seam and a flared skirt. Move
// the fabric with each thigh while retaining the authored body animation.
import { DynamicDrawUsage } from 'three';
const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));

export function prepareDress(actor) {
  for (const name of ['dress_0001', 'dress_1001']) {
    const mesh = actor.visual.getObjectByName(name);
    if (!mesh?.isSkinnedMesh) continue;
    mesh.geometry = mesh.geometry.clone();
    const p = mesh.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), ease = 1 + .11 * clamp(1 - Math.abs(y - 1.11) / .11);
      p.setXYZ(i, p.getX(i) * ease, y, -.05 + (p.getZ(i) + .05) * ease);
    }
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();
  }

  const skirt = actor.visual.getObjectByName('dress_0001');
  if (!skirt?.isSkinnedMesh) return;
  const { hips, legs: { l, r } } = actor.rig;
  const { skinIndex } = skirt.geometry.attributes;
  const position = skirt.geometry.attributes.position.clone().setUsage(DynamicDrawUsage);
  const skinWeight = skirt.geometry.attributes.skinWeight.clone().setUsage(DynamicDrawUsage);
  skirt.geometry.setAttribute('position', position);
  skirt.geometry.setAttribute('skinWeight', skinWeight);
  const joints = skirt.skeleton.bones;
  const hipIndex = joints.indexOf(hips), leftIndex = joints.indexOf(l.upper), rightIndex = joints.indexOf(r.upper);
  const baseWeights = skinWeight.array.slice(), basePositions = position.array.slice(), hem = [];
  for (let i = 0; i < position.count; i++) {
    // Both faces of the skirt share these three influences. The belt seam
    // and the bodice use their original weights.
    if (skinIndex.getX(i) !== hipIndex || skinIndex.getY(i) !== leftIndex ||
        skinIndex.getZ(i) !== rightIndex || position.getY(i) > .99) continue;
    const reach = clamp((1.01 - position.getY(i)) / .18);
    const front = clamp((position.getZ(i) + .052) / .11, -1, 1);
    const side = clamp(position.getX(i) / .30, -.5, .5);
    const flare = clamp((1.025 - position.getY(i)) / .085);
    hem.push({ i, reach, front, side, flare, x: position.getX(i), y: position.getY(i), z: position.getZ(i) + .052 });
  }

  let posed = false;
  const thighReach = (limb, x, z) => {
    const knee = limb.lower.matrixWorld.elements, hip = limb.upper.matrixWorld.elements;
    return (hip[12] - knee[12]) * x + (hip[14] - knee[14]) * z;
  };
  actor.fitDress = (active = true) => {
    if (!active) {
      if (posed) {
        position.array.set(basePositions);
        position.needsUpdate = true;
        skinWeight.array.set(baseWeights);
        skinWeight.needsUpdate = true;
        posed = false;
      }
      return;
    }
    actor.root.updateMatrixWorld(true);
    const facing = actor.root.matrixWorld.elements;
    const left = thighReach(l, facing[8], facing[10]), right = thighReach(r, facing[8], facing[10]);
    const swing = clamp((Math.max(Math.abs(left), Math.abs(right)) - .08) / .2);
    const hipY = hips.matrixWorld.elements[13] - facing[13];
    const squat = clamp((actor.standHip - hipY - .19) / .2);
    // A raised knee can reach above the hip at takeoff. Give the cloth
    // more room there while keeping the upper seam attached to the bodice.
    const lift = Math.max(0, l.lower.matrixWorld.elements[13] - l.upper.matrixWorld.elements[13],
      r.lower.matrixWorld.elements[13] - r.upper.matrixWorld.elements[13]);
    const width = .20 + 2.4 * lift, depth = .65 + 6 * lift;
    for (const { i, reach, front, side, flare, x, y, z } of hem) {
      const a = Math.max(0, front * left) * (1 + side);
      const b = Math.max(0, front * right) * (1 - side);
      const weight = .88 * reach * clamp(Math.max(a, b) / .19);
      // When both knees are forward in a crouch, let the back hang from
      // the hips instead of flaring the whole skirt around the knees.
      const drape = 1 - squat * (1 - clamp(.7 + .8 * front));
      const base = (1 - weight) * drape;
      const newLeft = baseWeights[4 * i + 1] * base + (a + b > 0 ? weight * a / (a + b) : 0);
      const newRight = baseWeights[4 * i + 2] * base + (a + b > 0 ? weight * b / (a + b) : 0);
      skinWeight.setXYZW(i, 1 - newLeft - newRight, newLeft, newRight, 0);
      const room = flare * swing * drape;
      position.setXYZ(i, x * (1 + width * room), y, z * (1 + depth * room) - .052);
    }
    position.needsUpdate = true;
    skinWeight.needsUpdate = true;
    posed = true;
  };
}
