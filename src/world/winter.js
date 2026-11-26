// Seasonal content for the connected central districts. World-space placements
// are shared by overlapping pages. The regular area bake serves both seasons.
import * as THREE from 'three';
import { VB, mtx } from './traffic/vb.js';

const districts = new Set(['palace', 'smolny', 'vladimirsky']);
const storageKey = 'piter.season';
export function seasonFor(area, params) {
  if (!districts.has(area) || params.has('bake')) return 'summer';
  let saved;
  try { saved = localStorage.getItem(storageKey); } catch { /* private browsing */ }
  return (params.get('season') || saved) === 'summer' ? 'summer' : 'winter';
}

export function installSeasonControl(anchor, area, season) {
  if (!anchor || !districts.has(area)) return;
  const select = document.createElement('select');
  select.id = 'season';
  select.className = 'chip';
  select.setAttribute('aria-label', 'Время года · Season');
  select.add(new Option('Зима · Winter', 'winter'));
  select.add(new Option('Лето · Summer', 'summer'));
  select.value = season;
  select.onchange = () => {
    try { localStorage.setItem(storageKey, select.value); } catch { /* URL fallback */ }
    const query = new URLSearchParams(location.search);
    query.set('season', select.value);
    query.delete('ho');
    location.search = query;
  };
  anchor.before(select);
}

const sites = [
  ['vosstaniya', 626, 234, 13],
  ['palace-square', -2010, -780, 21],
  ['ostrovsky', -786, -132, 9],
  ['konyushennaya', -1390, -936, 8],
];

function decoratedFir(ctx, id, x, z, h, glow) {
  const random = ctx.rng(id), branches = new VB(), bulbs = new VB();
  const radius = h * 0.235;
  branches.cyl(h * 0.024, h * 0.032, h * 0.23, '#655145', [0, h * 0.115, 0]);
  const ornament = new THREE.IcosahedronGeometry(1, 1);
  for (let tier = 0; tier < 8; tier++) {
    const u = tier / 8, y = h * (0.12 + u * 0.87), r = radius * (1 - u);
    const height = h * (0.28 - 0.15 * u);
    branches.cyl(0.02, r, height, tier % 2 ? '#244c40' : '#2d5947', [0, y + height / 2, 0], [0, tier * 0.37, 0], 16);
    const n = Math.max(7, Math.round(29 * (1 - u)));
    for (let j = 0; j < n; j++) {
      const a = 2 * Math.PI * j / n + tier * 0.37;
      const radial = r * (0.89 + random() * 0.09);
      const px = radial * Math.cos(a), pz = radial * Math.sin(a);
      const length = r * (0.45 + random() * 0.16);
      const tilt = 0.22 + random() * 0.18;
      const by = y + r * (random() - 0.35) * 0.12;
      const turn = [0, -a, -tilt];
      branches.sph(length, j % 3 ? '#2b5946' : '#396951', [px * 0.77, by, pz * 0.77], 7, [1, 0.23, 0.36], turn);
      if (random() < 0.65) branches.sph(length * 0.82, '#b9cdd3', [px * 0.78, by + length * 0.13, pz * 0.78], 7, [1, 0.14, 0.32], turn);
      const size = h * (j % 3 ? 0.006 : 0.011);
      bulbs.add(ornament, j % 3 ? '#ffe2a0' : ['#c84538', '#e4ae52', '#8dbbd2'][tier % 3],
        mtx([px * 1.12, by - length * tilt, pz * 1.12], null, [size, size, size]));
    }
  }
  ornament.dispose();
  const star = new THREE.Shape();
  for (let i = 0; i <= 10; i++) {
    const angle = i * Math.PI / 5, r = h * (i % 2 ? 0.018 : 0.045);
    const sx = Math.sin(angle) * r, sy = Math.cos(angle) * r;
    if (i) star.lineTo(sx, sy); else star.moveTo(sx, sy);
  }
  const topper = new THREE.ExtrudeGeometry(star, { depth: 0.08, bevelEnabled: false });
  for (const turn of [0, Math.PI / 2]) bulbs.add(topper, '#ffd47d', mtx([0, h * 1.03, 0], [0, turn, 0]));
  topper.dispose();
  const tree = new THREE.Group();
  tree.name = 'holiday-' + id;
  const canopy = new THREE.Mesh(branches.build(), ctx.mat.toon('#ffffff', { vertexColors: true, name: 'festive-fir' }));
  canopy.castShadow = canopy.receiveShadow = true;
  tree.add(canopy, new THREE.Mesh(bulbs.build(), glow));
  tree.position.set(x, 0.04, z);
  ctx.add(tree);
  const item = ctx.physics.addCylinder(x, z, radius * 0.42, 0, h);
  ctx.knock?.register({ kind: 'tree', x, z, y: 0.04, mass: h * 27, h, r: radius * 0.42,
    anchored: 22, item, parts: [{ obj: tree }] });
}

function snowman(ctx, x, z, facing) {
  if (ctx.L.insideBuilding(x, z, 0.65) || ctx._roadPlan?.cover(x, z, {}) > -0.65) return;
  const body = new VB();
  body.sph(0.53, '#d8e1e5', [0, 0.37, 0], 12, [1, 0.87, 0.95]);
  body.sph(0.37, '#e2eaeb', [-0.035, 0.93, 0], 12);
  body.sph(0.255, '#edf1ee', [-0.02, 1.45, 0.015], 12);
  body.cyl(0.215, 0.245, 0.10, '#9e3d42', [-0.035, 1.24, 0], [0, 0, -0.1]);
  body.box(0.11, 0.35, 0.045, '#90414a', [0.11, 1.07, 0.29], [-0.28, 0, -0.1]);
  body.cyl(0.008, 0.048, 0.19, '#d58242', [-0.017, 1.43, 0.32], [Math.PI / 2, 0, 0]);
  for (const side of [-1, 1]) body.sph(0.026, '#383839', [side * 0.082 - 0.02, 1.5, 0.249], 6);
  for (let i = 0; i < 3; i++) body.sph(0.032, '#4c4946', [-0.04, 0.79 + i * 0.12, 0.34], 6);
  const obj = new THREE.Mesh(body.build(), ctx.mat.toon('#ffffff', { vertexColors: true, name: 'snowman' }));
  obj.name = 'snowman'; obj.position.set(x, 0.04, z); obj.rotation.y = facing;
  obj.castShadow = obj.receiveShadow = true; ctx.add(obj);
  const item = ctx.physics.addCylinder(x, z, 0.42, 0, 1.68);
  ctx.knock?.register({ kind: 'snowman', x, z, y: 0.04, mass: 64, h: 1.68, r: 0.42, item, parts: [{ obj }] });
}

function snowfall(ctx) {
  const rng = ctx.rng('december-snow'), positions = new Float32Array(ctx.quality.level === 'low' ? 1500 : 3000);
  for (let i = 0; i < positions.length; i++) positions[i] = rng() * 30;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { t: ctx.shared.uTime, night: ctx.shared.uNight },
    vertexShader: `uniform float t; varying float alpha;
      void main() {
        vec3 drift = vec3(t * 0.65 + sin(position.z + t * 0.6) * 0.45, -t * (0.85 + position.x * 0.014), t * 0.18);
        vec3 delta = mod(position + drift - cameraPosition + 15.0, 30.0) - 15.0;
        alpha = 0.82 * (1.0 - smoothstep(10.0, 15.0, length(delta)));
        vec4 eye = viewMatrix * vec4(cameraPosition + delta, 1.0);
        gl_Position = projectionMatrix * eye;
        gl_PointSize = clamp(12.0 / max(0.7, -eye.z), 1.3, 5.0);
      }`,
    fragmentShader: `uniform float night; varying float alpha;
      void main() { float a = alpha * (1.0 - smoothstep(0.16, 0.5, length(gl_PointCoord - 0.5)));
        gl_FragColor = vec4(vec3(0.89,0.93,0.98) * mix(1.0,0.58,night), a); }`,
  });
  const flakes = new THREE.Points(geometry, material);
  flakes.name = 'local-snowfall';
  flakes.frustumCulled = false;
  ctx.noOutline(flakes);
  ctx.add(flakes);
  ctx.onUpdate(() => {
    const p = ctx.camera.position;
    flakes.visible = ctx.indoor.amount < 0.12 && !(ctx.physics.roofTop(p.x, p.z) > p.y + 0.35);
  });
}

export function buildWinter(ctx) {
  const glow = new THREE.MeshBasicMaterial({ vertexColors: true, name: 'holiday-lights' });
  ctx.onUpdate(() => glow.color.setScalar(0.85 + 1.8 * ctx.shared.uNight.value));
  for (const [id, x, z, h] of sites) {
    if (ctx.L.inPlay(x, z) && !ctx.L.insideBuilding(x, z, h * 0.23)) {
      decoratedFir(ctx, id, x, z, h, glow);
      if (id === 'vosstaniya' || id === 'palace-square') snowman(ctx, x + h * 0.3, z + 2, id === 'vosstaniya' ? -1 : 0.8);
    }
  }
  snowfall(ctx);
}
