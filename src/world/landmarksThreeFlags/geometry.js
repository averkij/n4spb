import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MAST_HEIGHT, FLAG_WIDTH, FLAG_HEIGHT } from './sites.js';

const GOLD = new THREE.Color('#ddba50');
const COLORS = {
  imperial: ['#252b32', '#d2ad3e', '#e7e6dc'].map(c => new THREE.Color(c)),
  russia: ['#e7e6df', '#27559f', '#b72536'].map(c => new THREE.Color(c)),
  ussr: ['#b92531', '#b92531', '#b92531'].map(c => new THREE.Color(c)),
};

function cylinder(r0, r1, y0, y1, segments = 16) {
  return new THREE.CylinderGeometry(r1, r0, y1 - y0, segments).translate(0, (y0 + y1) / 2, 0);
}
function merge(parts) {
  const out = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  out.computeBoundingBox(); out.computeBoundingSphere(); return out;
}

export function mastGeometry() {
  // The first section contains 3 embedded metres, leaving 10 visible metres.
  // The exposed 18-section profile is 90 m cylindrical, 50 m taper, 35 m thin.
  return merge([
    cylinder(1.95, 1.95, 0, 90, 20),
    cylinder(1.95, 0.9, 90, 140, 20),
    cylinder(0.9, 0.9, 140, 173.35, 16),
    // Swivelling head's inverted truncated-cone weather hood and service rim.
    cylinder(0.9, 2.275, 173.35, 174.55, 20),
    cylinder(2.275, 2.275, 174.55, MAST_HEIGHT, 20),
  ]);
}

export function collarGeometry() {
  const parts = [cylinder(2.15, 2.15, 0, 0.2, 24)];
  for (let y = 10; y <= 170; y += 10) {
    const r = y <= 90 ? 1.95 : y < 140 ? 1.95 - (y - 90) * 1.05 / 50 : 0.9;
    parts.push(cylinder(r + 0.075, r + 0.075, y - 0.055, y + 0.055, 16));
  }
  // Steel hatches and lifting attachment remain part of the movable mast.
  parts.push(new THREE.BoxGeometry(0.85, 1.85, 0.12).translate(0, 1.2, 1.975));
  parts.push(cylinder(0.13, 0.13, 132.5, 173.7, 6).translate(1.035, 0, 0));
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2;
    parts.push(cylinder(0.075, 0.075, 0.2, 0.37, 6).translate(Math.cos(a) * 2.025, 0, Math.sin(a) * 2.025));
  }
  return merge(parts);
}

// A formed, moderately filled cloth: metres along its hoist and fly remain
// 40 and 60, while the free edge sags and folds. This immutable pose has no
// frame callback or special shader, and is baked/cullable like other scenery.
// All three share a wind direction; their slightly different phase prevents
// an artificial repeated silhouette. The hoist edge stays fixed to the mast.
export function clothPoint(u, v, phase = 0) {
  const q = u / FLAG_WIDTH;
  return [
    1.1 + u * (0.965 - 0.025 * Math.sin(v / FLAG_HEIGHT * Math.PI)),
    MAST_HEIGHT - 1.05 - v - 3.8 * q * q + Math.sin(q * 7.5 + phase) * q * 0.9,
    Math.sin(q * 9 + phase - v * 0.075) * q * 3.5 + Math.sin(q * 19 + v * 0.11) * q * 0.7,
  ];
}

function star(cx, cy, radius, inner) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? inner : radius;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
}

export function flagGeometry(kind, phase = 0) {
  const pos = [], color = [], indices = [], colors = COLORS[kind];
  // The horizontal bands use separate vertices at their boundaries, so a
  // tricolour is sharply woven rather than interpolated through pastel bands.
  for (let band = 0; band < 3; band++) {
    const start = pos.length / 3, cols = 36, rows = 8;
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
      const u = i / cols * FLAG_WIDTH, v = (band + j / rows) / 3 * FLAG_HEIGHT;
      pos.push(...clothPoint(u, v, phase));
      const shade = 1 - (Math.floor(u / (FLAG_WIDTH / 27)) % 2) * 0.018;
      color.push(colors[band].r * shade, colors[band].g * shade, colors[band].b * shade);
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const a = start + j * (cols + 1) + i, b = a + cols + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const goldTriangle = (a, b, c, side, depth = 0) => {
    if (depth < 4 && Math.max(Math.hypot(a[0] - b[0], a[1] - b[1]), Math.hypot(b[0] - c[0], b[1] - c[1]), Math.hypot(c[0] - a[0], c[1] - a[1])) > 1.4) {
      const ab = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], bc = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2], ca = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2];
      for (const q of [[a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]]) goldTriangle(...q, side, depth + 1);
      return;
    }
    const base = pos.length / 3;
    for (const [u, v] of [a, b, c]) { const p = clothPoint(u, v, phase); p[2] += side * 0.08; pos.push(...p); color.push(GOLD.r, GOLD.g, GOLD.b); }
    indices.push(base, base + 1, base + 2);
  };
  const polygon = ring => {
    for (const tri of THREE.ShapeUtils.triangulateShape(ring.map(p => new THREE.Vector2(...p)), [])) {
      for (const side of [-1, 1]) goldTriangle(...tri.map(i => ring[i]), side);
    }
  };
  if (kind === 'ussr') {
    // Historical 2023 reference: outlined star, hammer and curved sickle at
    // the upper hoist. Vector pieces conform to the formed textile surface.
    const outer = star(8.2, 5.7, 1.65, 0.67), inner = star(8.2, 5.7, 1.22, 0.47);
    for (let i = 0; i < 10; i++) polygon([outer[i], outer[(i + 1) % 10], inner[(i + 1) % 10], inner[i]]);
    const crescent = [], cx = 8.7, cy = 11.6;
    for (let i = 0; i <= 24; i++) { const a = -1.05 + i / 24 * 4.25; crescent.push([cx + Math.cos(a) * 3.5, cy + Math.sin(a) * 3.5]); }
    for (let i = 24; i >= 0; i--) { const a = -1.05 + i / 24 * 4.25; crescent.push([cx - 0.6 + Math.cos(a) * 2.65, cy - 0.65 + Math.sin(a) * 2.65]); }
    polygon(crescent);
    polygon([[5.8, 8.1], [7.05, 7.3], [13.2, 14.1], [12.25, 15.05]]);
    polygon([[5.25, 9.1], [8.1, 6.5], [9.75, 8.2], [7.25, 10.75]]);
    polygon([[8.3, 13.45], [9.35, 12.65], [13.55, 16.4], [12.65, 17.35]]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(color, 3));
  g.setIndex(indices); g.computeVertexNormals(); g.computeBoundingSphere(); g.computeBoundingBox(); return g;
}
