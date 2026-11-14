import * as THREE from 'three';
import { buildCourse } from './karting/course.js';
import { buildStadium } from './karting/stadium.js';
import { loadKarts } from './karting/karts.js';

export const OWNS_GROUPS = ['kirovets-karting'];

export function build(ctx) {
  const root = new THREE.Group();
  root.name = 'karting-narvskaya';
  const course = buildCourse(ctx, root);
  buildStadium(ctx, root);
  ctx.addStatic(root);
  ctx.services.kartingNarvskaya = { ...course, loadVehicles: () => loadKarts(ctx) };
}
