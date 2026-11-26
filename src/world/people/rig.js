// people/rig.js - the stylised anime figure as INSTANCED ARTICULATED PARTS (characters half; copy of the Yakutsk rig (itself a retune of the Moscow rig), used unchanged for Saint Petersburg).
// One InstancedMesh per part variant (torso outfits, head + hair / hat styles, upper / fore arms, thighs, shins, feet), every person owns one instance of each of
// its parts; anim.js writes the instance matrices every frame as pure functions of the state.
// Colours: a patched MeshToonMaterial with per-vertex palette slots (aSlot 0 = fixed colour, 1..4 -> per-instance iA..iD) so one geometry serves every colour
// combination; heads add a painted face atlas (transparent skin, opaque features) selected per instance (iFace).  Cel look = ctx.mat.gradientMap; outlines come from
// the screen-space pass (instanced meshes are handled).
// Slots: 1 = A (main garment colour), 2 = B (second colour: collar, hem, shirt, shoes upper, hat), 3 = C (accent: stripes, sole, hair), 4 = SK (skin).
// Proportions (rig units = metres of a 1.78 m reference adult; the person's root scale does the rest): hip 0.92 above the sole, thigh 0.43, shin 0.40, ankle 0.09,
// shoulder 0.5 above the hip joint, neck pivot 0.56, skull centre 0.135 above the neck pivot (x headK).
import * as THREE from 'three';
import { Geo, TAU, clamp, lerp } from './kit.js';

export const H = { hip: 0.92, thigh: 0.43, shin: 0.40, ankle: 0.09, sh: 0.5, shX: 0.2, upper: 0.29, fore: 0.27, neck: 0.56, head: 0.249 };
export const SA = 1, SB = 2, SC = 3, SK = 4;
const ID = new THREE.Matrix4();

// ------------------------------------------------------------------ geometry helpers
/** lofted elliptical rings [{y, rx, rz}] -> BufferGeometry (smooth normals). Front = +Z. */
export function loft(rows, seg = 8, capTop = true, capBot = false) {
  const pos = [], idx = [], n = rows.length;
  for (const r of rows) for (let i = 0; i < seg; i++) { const a = (i / seg) * TAU; pos.push(Math.sin(a) * r.rx + (r.cx || 0), r.y, Math.cos(a) * r.rz + (r.cz || 0)); }
  for (let j = 0; j < n - 1; j++) for (let i = 0; i < seg; i++) { const a = j * seg + i, b = j * seg + ((i + 1) % seg), c = (j + 1) * seg + i, d = (j + 1) * seg + ((i + 1) % seg); idx.push(a, b, c, b, d, c); }
  if (capTop) { const t = pos.length / 3, r = rows[n - 1]; pos.push(r.cx || 0, r.y, r.cz || 0); for (let i = 0; i < seg; i++) idx.push(t, (n - 1) * seg + i, (n - 1) * seg + ((i + 1) % seg)); }
  if (capBot) { const t = pos.length / 3, r = rows[0]; pos.push(r.cx || 0, r.y, r.cz || 0); for (let i = 0; i < seg; i++) idx.push(t, (i + 1) % seg, i); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const rowsOf = (t, kx = 1, kz = kx) => t.map(([y, rx, rz]) => ({ y, rx: rx * kx, rz: rz * kz }));
function addLoft(G, rows, slot, col = '#ffffff', seg = 8, capTop = true, capBot = false) { const s = G.slot; G.slot = slot; G.add(loft(rows, seg, capTop, capBot), ID, col); G.slot = s; }
const slotted = (G, slot, fn) => { const s = G.slot; G.slot = slot; fn(G); G.slot = s; };
/** a limb hanging along -Y from the joint: radius r0 at the joint tapering to r1 at length len */
function limb(G, len, r0, r1, slot, col = '#ffffff', seg = 5, y0 = 0) { slotted(G, slot, (g) => g.tube([0, y0, 0], [0, y0 - len, 0], r0, col, seg, r1, true)); }

// ------------------------------------------------------------------ torso outfits
// y, rx, rz of the rings of a standing torso (hip joint = origin; the neck pivot is at y 0.56)
const BODY = [[-0.17, 0.182, 0.118], [-0.04, 0.178, 0.12], [0.2, 0.148, 0.108], [0.43, 0.182, 0.114], [0.52, 0.17, 0.1], [0.565, 0.075, 0.06]];
const SKIRT = (hem) => [[hem, 0.27, 0.215], [hem * 0.55 - 0.02, 0.225, 0.18], [-0.08, 0.18, 0.13]];
export const TORSOS = ['tee', 'tank', 'shirt', 'dress', 'dressS', 'jacket', 'hoodie', 'blazer', 'blazerSkirt', 'vest', 'teetie', 'track'];
/** kind: one of TORSOS (slots A main, B second, C accent, SK skin) */
export function torsoGeo(kind) {
  const G = new Geo();
  if (kind === 'parka' || kind === 'overcoat') {
    const hem = kind === 'parka' ? -0.21 : -0.35;
    addLoft(G, rowsOf([[hem, 0.21, 0.15], [-0.05, 0.20, 0.14], [0.26, 0.185, 0.13], [0.48, 0.21, 0.14], [0.56, 0.09, 0.085]]), SA);
    slotted(G, SB, g => { g.cyl(0.09, 0.11, 0.085, [0, 0.55, 0], '#ffffff', 8); g.box(0.06, 0.21, 0.036, [0.048, 0.425, 0.13], '#ffffff'); });
  } else if (kind === 'tee') { addLoft(G, rowsOf(BODY), SA); }
  else if (kind === 'tank') {
    const r = rowsOf(BODY); addLoft(G, r.slice(0, 4), SA, '#ffffff', 8, false);
    addLoft(G, r.slice(3), SK, '#ffffff', 8, true);
    slotted(G, SA, (g) => { for (const s of [-1, 1]) g.box(0.05, 0.14, 0.12, [s * 0.11, 0.5, 0], '#ffffff', [0, 0, s * 0.12]); });
  } else if (kind === 'shirt') {
    addLoft(G, rowsOf(BODY, 1.02, 1.03), SA);
    slotted(G, SB, (g) => { g.cyl(0.082, 0.09, 0.05, [0, 0.54, 0], '#ffffff', 8, null, true); g.box(0.026, 0.5, 0.014, [0, 0.27, 0.107], '#ffffff'); });
  } else if (kind === 'dress' || kind === 'dressS') {
    const low = [[-0.34, 0.27, 0.215], [-0.19, 0.225, 0.18], [-0.05, 0.18, 0.13], [0.1, 0.15, 0.104], [0.24, 0.136, 0.096], [0.4, 0.172, 0.106]];
    const up = [[0.4, 0.172, 0.106], [0.47, 0.185, 0.1], [0.52, 0.17, 0.092], [0.565, 0.075, 0.06]];
    const R = (t) => t.map(([y, rx, rz]) => ({ y, rx, rz }));
    if (kind === 'dress') {
      addLoft(G, R(low), SA, '#ffffff', 8, false); addLoft(G, R(up), SK, '#ffffff', 8, true);
      slotted(G, SA, (g) => { for (const s of [-1, 1]) g.box(0.045, 0.12, 0.11, [s * 0.105, 0.5, 0], '#ffffff', [0, 0, s * 0.12]); });
    } else { addLoft(G, R([...low, ...up.slice(1)]), SA); slotted(G, SB, (g) => g.cyl(0.082, 0.09, 0.04, [0, 0.54, 0], '#ffffff', 8, null, true)); }
    addLoft(G, [{ y: -0.345, rx: 0.272, rz: 0.217 }, { y: -0.27, rx: 0.246, rz: 0.2 }], SB, '#ffffff', 8, false);          // hem band
    slotted(G, SC, (g) => g.cyl(0.14, 0.145, 0.035, [0, 0.2, 0], '#ffffff', 8, null, true));                                 // belt
  } else if (kind === 'jacket' || kind === 'track' || kind === 'hoodie') {
    addLoft(G, rowsOf(BODY, 1.07, 1.1), SA);
    if (kind !== 'hoodie') slotted(G, SB, (g) => g.cyl(0.09, 0.1, 0.05, [0, 0.545, 0], '#ffffff', 8, null, true));
    if (kind === 'hoodie') slotted(G, SA, (g) => { g.cyl(0.12, 0.085, 0.1, [0, 0.55, -0.06], '#ffffff', 8, [0.55, 0, 0], true); });
    if (kind === 'hoodie') slotted(G, SB, (g) => g.box(0.24, 0.11, 0.03, [0, 0.05, 0.116], '#ffffff'));
    else slotted(G, SC, (g) => g.box(0.034, 0.62, 0.016, [0, 0.2, 0.116], '#ffffff'));
    if (kind === 'track') slotted(G, SC, (g) => { for (const s of [-1, 1]) g.box(0.02, 0.5, 0.07, [s * 0.164, 0.22, 0.0], '#ffffff'); });
  } else if (kind === 'blazer' || kind === 'blazerSkirt') {
    if (kind === 'blazerSkirt') addLoft(G, [{ y: -0.31, rx: 0.235, rz: 0.19 }, { y: -0.2, rx: 0.205, rz: 0.165 }, { y: -0.1, rx: 0.17, rz: 0.12 }], SC, '#ffffff', 8, false);
    addLoft(G, rowsOf(BODY, 1.05, 1.07), SA);
    slotted(G, SB, (g) => g.quad([0.06, 0.52, 0.1], [-0.06, 0.52, 0.1], [-0.02, 0.2, 0.118], [0.02, 0.2, 0.118], '#ffffff'));
    slotted(G, SC, (g) => g.box(0.03, 0.22, 0.012, [0, 0.36, 0.12], '#ffffff'));
    slotted(G, SA, (g) => { g.box(0.085, 0.14, 0.05, [-0.08, 0.46, 0.085], '#dcdcdc', [0.4, 0.5, 0]); g.box(0.085, 0.14, 0.05, [0.08, 0.46, 0.085], '#dcdcdc', [0.4, -0.5, 0]); });
  } else if (kind === 'vest') {
    addLoft(G, rowsOf(BODY), SA);
    addLoft(G, [[-0.06, 0.162, 0.113], [0.1, 0.158, 0.108], [0.26, 0.158, 0.108], [0.4, 0.182, 0.118], [0.5, 0.175, 0.108]].map(([y, rx, rz]) => ({ y, rx, rz })), SB, '#ffffff', 8, false);
    slotted(G, SB, (g) => { for (const s of [-1, 1]) g.box(0.07, 0.05, 0.19, [s * 0.1, 0.52, 0], '#ffffff'); });
    slotted(G, SC, (g) => { g.cyl(0.164, 0.166, 0.04, [0, 0.08, 0], '#ffffff', 8, null, true); g.cyl(0.168, 0.172, 0.04, [0, 0.34, 0], '#ffffff', 8, null, true); });
  } else if (kind === 'teetie') {
    addLoft(G, rowsOf(BODY), SA);
    slotted(G, SB, (g) => { g.cyl(0.178, 0.178, 0.09, [0, 0.0, 0], '#ffffff', 8, null, true); g.box(0.09, 0.1, 0.07, [0, -0.01, 0.15], '#ffffff'); g.box(0.12, 0.3, 0.05, [-0.1, -0.14, 0.14], '#ffffff', [0, 0, 0.15]); });
  }
  return G;
}

// ------------------------------------------------------------------ limbs
export const UPPERS = ['short', 'long', 'bulk', 'bare'], FORES = ['long', 'bulk', 'bare', 'roll'], THIGHS = ['std', 'wide', 'jeans', 'shorts', 'bare'], SHINS = ['std', 'wide', 'jeans', 'bare'], FEET = ['sneaker', 'flat', 'sandal'];
export function upperArmGeo(kind) {
  const G = new Geo();
  if (kind === 'short') { limb(G, 0.15, 0.056, 0.052, SA); limb(G, 0.15, 0.047, 0.043, SK, '#ffffff', 5, -0.14); }
  else if (kind === 'long') limb(G, H.upper, 0.05, 0.043, SA);
  else if (kind === 'bulk') limb(G, H.upper, 0.059, 0.052, SA);
  else limb(G, H.upper, 0.045, 0.04, SK);
  return G;
}
export function foreArmGeo(kind) {
  const G = new Geo(), sk = kind === 'bare' || kind === 'roll', w = kind === 'bulk' ? 1.18 : 1;
  slotted(G, kind === 'bare' ? SK : SA, (g) => g.sphere(0.044 * w, 0.044 * w, 0.044 * w, [0, 0, 0], '#ffffff', 4, null, 2));
  if (kind === 'roll') { limb(G, 0.09, 0.047, 0.047, SA); limb(G, H.fore - 0.12, 0.04, 0.035, SK, '#ffffff', 5, -0.09); }
  else limb(G, H.fore - 0.03, 0.043 * w, 0.037 * w, sk ? SK : SA);
  slotted(G, SK, (g) => g.box(0.052, 0.09, 0.04, [0, -H.fore - 0.025, 0.004], '#ffffff'));
  return G;
}
export function thighGeo(kind) {
  const G = new Geo(), w = kind === 'wide' ? 1.17 : kind === 'jeans' ? 0.92 : 1;
  if (kind === 'bare') limb(G, H.thigh + 0.02, 0.078, 0.06, SK, '#ffffff', 6);
  else if (kind === 'shorts') { limb(G, 0.24, 0.088, 0.086, SA, '#ffffff', 6); limb(G, 0.21, 0.07, 0.06, SK, '#ffffff', 6, -0.23); }
  else limb(G, H.thigh + 0.02, 0.083 * w, 0.064 * w, SA, '#ffffff', 6);
  return G;
}
export function shinGeo(kind) {
  const G = new Geo(), w = kind === 'wide' ? 1.17 : kind === 'jeans' ? 0.92 : 1, len = H.shin - 0.02;
  if (kind === 'bare') { slotted(G, SK, (g) => g.sphere(0.06, 0.06, 0.06, [0, 0, 0], '#ffffff', 4, null, 2)); limb(G, len, 0.06, 0.04, SK, '#ffffff', 6); }
  else { slotted(G, SA, (g) => g.sphere(0.066 * w, 0.066 * w, 0.066 * w, [0, 0, 0], '#ffffff', 4, null, 2)); limb(G, len, 0.064 * w, kind === 'wide' ? 0.058 : 0.048 * w, SA, '#ffffff', 6); }
  return G;
}
/** origin at the ankle; sole bottom 0.09 below it; toe +Z */
export function footGeo(kind) {
  const G = new Geo();
  if (kind === 'boot') {
    slotted(G, SB, g => { g.cyl(0.06, 0.056, 0.15, [0, 0.05, 0], '#ffffff', 6); g.box(0.11, 0.09, 0.245, [0, -0.03, 0.055], '#ffffff'); });
    slotted(G, SC, g => g.box(0.115, 0.024, 0.255, [0, -0.078, 0.056], '#ffffff'));
  } else if (kind === 'sneaker') {
    slotted(G, SB, (g) => g.box(0.096, 0.06, 0.26, [0, -0.04, 0.07], '#ffffff'));
    slotted(G, SC, (g) => g.box(0.102, 0.03, 0.29, [0, -0.075, 0.075], '#ffffff'));
  } else if (kind === 'flat') {
    slotted(G, SB, (g) => g.box(0.092, 0.04, 0.24, [0, -0.062, 0.06], '#ffffff'));
    slotted(G, SC, (g) => g.box(0.094, 0.016, 0.255, [0, -0.082, 0.065], '#ffffff'));
  } else {
    slotted(G, SK, (g) => g.box(0.085, 0.035, 0.235, [0, -0.062, 0.06], '#ffffff'));
    slotted(G, SB, (g) => { g.box(0.092, 0.014, 0.03, [0, -0.045, 0.03], '#ffffff'); g.box(0.092, 0.014, 0.03, [0, -0.048, 0.13], '#ffffff'); });
    slotted(G, SC, (g) => g.box(0.09, 0.016, 0.26, [0, -0.082, 0.065], '#ffffff'));
  }
  return G;
}

// ------------------------------------------------------------------ head, faces and hair
export const FACE_W = 0.19, FACE_H = 0.2;
export const ATLAS = { cols: 8, rows: 4, cell: 128 };
function skullGeo() {
  const g = new THREE.SphereGeometry(1, 10, 5), p = g.attributes.position, rx = 0.098, ry = 0.114, rz = 0.107;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (y < 0) { const t = -y; x *= 1 - 0.3 * t * t; z *= 1 - 0.25 * t; y *= 1 + 0.16 * t; if (z > 0) z += 0.06 * t * t; }       // narrow jaw, soft chin
    p.setXYZ(i, x * rx, y * ry + 0.135, z * rz + 0.005);
  }
  g.computeVertexNormals();
  return g;
}
let _skull = null;
function capGeo(scale = 1.07, cover = 1.9, front = 0.36, seg = 10, rings = 3) {           // hair / hat cap: partial sphere with a raised front edge (fringe line)
  const g = new THREE.SphereGeometry(1, seg, rings, 0, TAU, 0, cover), p = g.attributes.position, R = 0.108 * scale;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i) * R * 0.98, y = p.getY(i) * R * 1.08, z = p.getZ(i) * R;
    if (z > 0) { const lim = lerp(-0.02, front * 0.15 + 0.03, Math.min(1, z / R)); if (y < lim) y = lim; }
    p.setXYZ(i, x, y + 0.148, z - 0.004);
  }
  g.computeVertexNormals(); return g;
}
function ringGeo(scale, t0, t1, p0, p1, seg = 10) {                                         // a band of hair (sides + back only: balding)
  const g = new THREE.SphereGeometry(1, seg, 2, p0, p1, t0, t1), p = g.attributes.position, R = 0.108 * scale;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * R * 0.98, p.getY(i) * R * 1.08 + 0.148, p.getZ(i) * R - 0.004);
  g.computeVertexNormals(); return g;
}
export const HEADS = ['short', 'crop', 'bald', 'bob', 'long', 'pony', 'bun', 'halfup', 'pigtails', 'cap', 'bucket', 'beret', 'crochet'];
export function headGeo(style) {
  const G = new Geo(), add = (geo, slot, col = '#ffffff') => { const s = G.slot; G.slot = slot; G.add(geo, ID, col); G.slot = s; };
  _skull = _skull || skullGeo();
  add(_skull, SK); slotted(G, SK, (g) => g.cyl(0.05, 0.058, 0.13, [0, 0.02, -0.004], '#ffffff', 5, null, true));                                              // neck
  const hair = (fn) => slotted(G, SC, fn);
  if (style === 'short') add(capGeo(1.07, 1.9, 0.3), SC);
  else if (style === 'crop') add(capGeo(1.03, 1.72, 0.22), SC);
  else if (style === 'bald') add(ringGeo(1.05, 1.0, 0.85, Math.PI / 2 + 0.95, TAU - 1.9), SC);
  else if (style === 'bob') { add(capGeo(1.09, 2.0, 0.34), SC); hair((g) => { g.sphere(0.03, 0.1, 0.095, [0.094, 0.08, -0.01], '#ffffff', 5, null, 3); g.sphere(0.03, 0.1, 0.095, [-0.094, 0.08, -0.01], '#ffffff', 5, null, 3); g.sphere(0.105, 0.1, 0.04, [0, 0.09, -0.098], '#ffffff', 6, null, 3); }); }
  else if (style === 'long' || style === 'halfup') {
    add(capGeo(1.09, 2.0, 0.34), SC);
    hair((g) => { g.sphere(0.114, 0.27, 0.06, [0, -0.07, -0.09], '#ffffff', 6, null, 4); g.sphere(0.03, 0.17, 0.09, [0.098, 0.03, -0.01], '#ffffff', 5, null, 3); g.sphere(0.03, 0.17, 0.09, [-0.098, 0.03, -0.01], '#ffffff', 5, null, 3); if (style === 'halfup') g.sphere(0.05, 0.05, 0.05, [0, 0.245, -0.06], '#ffffff', 5); });
  } else if (style === 'pony') { add(capGeo(1.07, 1.9, 0.32), SC); hair((g) => { g.tube([0, 0.19, -0.11], [0, -0.04, -0.2], 0.026, '#ffffff', 5, 0.05); }); }
  else if (style === 'bun') { add(capGeo(1.07, 1.9, 0.32), SC); hair((g) => g.sphere(0.055, 0.055, 0.055, [0, 0.245, -0.055], '#ffffff', 5)); }
  else if (style === 'pigtails') { add(capGeo(1.07, 1.95, 0.32), SC); hair((g) => { for (const s of [-1, 1]) g.tube([s * 0.1, 0.17, -0.02], [s * 0.13, 0.0, -0.05], 0.03, '#ffffff', 5, 0.02); }); }
  else if (style === 'cap') {
    add(capGeo(1.04, 1.85, 0.3), SC);
    add(capGeo(1.13, 1.72, 0.24), SB);
    slotted(G, SB, (g) => g.box(0.15, 0.012, 0.11, [0, 0.19, 0.135], '#ffffff', [0.14, 0, 0]));
  } else if (style === 'bucket') {
    add(capGeo(1.04, 1.85, 0.3), SC);
    add(capGeo(1.15, 1.8, 0.1), SB);
    slotted(G, SB, (g) => g.cyl(0.158, 0.172, 0.02, [0, 0.172, 0], '#ffffff', 10, [0.05, 0, 0]));
  } else if (style === 'beret') {
    add(capGeo(1.05, 1.9, 0.3), SC);
    slotted(G, SB, (g) => { g.sphere(0.135, 0.05, 0.135, [0.01, 0.245, 0.0], '#ffffff', 8, [0.12, 0, 0.12]); g.box(0.012, 0.03, 0.012, [0.0, 0.3, 0.0], '#ffffff'); });
  } else if (style === 'crochet') {
    add(capGeo(1.04, 1.85, 0.3), SC);
    add(capGeo(1.15, 1.95, 0.1), SB);
    slotted(G, SB, (g) => g.cyl(0.148, 0.158, 0.03, [0, 0.165, 0], '#ffffff', 10, null, false));
  }
  const geo = G.build(true, true), pos = geo.attributes.position, slot = geo.attributes.aSlot, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {                                                        // planar face projection for skin vertices on the front, the blank corner elsewhere
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (slot.getX(i) === SK && z > 0.02 && y > 0.02 && y < 0.27) { const fu = clamp(0.5 + x / FACE_W, 0.01, 0.99), fv = clamp(0.5 + (y - 0.145) / FACE_H, 0.01, 0.99); uv.setXY(i, fu / ATLAS.cols, 1 - 1 / ATLAS.rows + fv / ATLAS.rows); }
    else uv.setXY(i, 0.004 / ATLAS.cols, 1 - 1 / ATLAS.rows + 0.004 / ATLAS.rows);
  }
  return geo;
}

// ------------------------------------------------------------------ face atlas
// 8 x 4 cells of 128 px.  Cell index = row * 8 + col:
//   0-3 female plain (eye families 0 wide, 1 medium, 2 lowered-lid, 3 wide light-eyed), 4-7 male plain (same families), 8-15 the same with sunglasses,
//   16-17 girl, 18-19 boy, 20-21 elder woman (family 1 / 2), 22-23 elder man.
export const FACE = { f: 0, m: 4, glasses: 8, girl: 16, boy: 18, elderF: 20, elderM: 22 };
const EYE_COLS = ['#5b3a29', '#3a2a26', '#2f2a30', '#6c8a6e'];
function paintFace(g, ox, oy, o) {
  const X = (u) => ox + u * 128, Y = (v) => oy + (1 - v) * 128;                       // face uv (0..1) -> canvas
  const fem = o.fem, child = o.child, fam = o.fam;
  const ey = child ? 0.43 : 0.47, ew = (child ? 0.2 : fem ? [0.2, 0.185, 0.195, 0.2][fam] : [0.175, 0.165, 0.175, 0.175][fam]) * (o.elder ? 0.92 : 1);
  const eh = child ? 0.32 : fem ? [0.3, 0.25, 0.2, 0.3][fam] : [0.25, 0.22, 0.185, 0.25][fam];
  const eye = o.eye;
  for (const s of [-1, 1]) {
    const ex = 0.5 + s * (child ? 0.225 : 0.215);
    if (!o.glasses) {
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(X(ex), Y(ey), ew * 64, eh * 64, 0, 0, TAU); g.fill();
      const gr = g.createLinearGradient(0, Y(ey + eh), 0, Y(ey - eh)); gr.addColorStop(0, '#1c1a24'); gr.addColorStop(0.4, eye); gr.addColorStop(1, '#e8cfb8');
      g.fillStyle = gr; g.beginPath(); g.ellipse(X(ex), Y(ey - 0.012), ew * 52, eh * 61, 0, 0, TAU); g.fill();
      g.fillStyle = '#15131b'; g.beginPath(); g.ellipse(X(ex), Y(ey - 0.012), ew * 24, eh * 37, 0, 0, TAU); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(X(ex - s * 0.035), Y(ey + eh * 0.45), ew * 15, eh * 16, 0, 0, TAU); g.fill();
      g.strokeStyle = '#1d1a24'; g.lineCap = 'round'; g.lineWidth = child ? 2.2 : fem ? 3.4 : 2.6;
      g.beginPath(); g.ellipse(X(ex), Y(ey), ew * 64, eh * 64, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();                       // upper lash line
      if (fam === 2 && !child) { g.lineWidth = 1.6; g.globalAlpha = 0.55; g.beginPath(); g.ellipse(X(ex), Y(ey + eh * 0.55), ew * 62, eh * 36, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.globalAlpha = 1; }   // soft lid fold, never a slit
      if (fem && !child) { g.lineWidth = 3; g.beginPath(); g.moveTo(X(ex + s * ew * 0.95), Y(ey + eh * 0.3)); g.lineTo(X(ex + s * (ew + 0.045)), Y(ey + eh * 0.55)); g.stroke(); }
      // brows
      g.strokeStyle = o.brow; g.lineWidth = child ? 2.2 : fem ? 3 : 4.4;
      g.beginPath(); g.moveTo(X(ex - s * 0.11), Y(ey + eh + 0.09 - (fem ? 0 : 0.02))); g.quadraticCurveTo(X(ex), Y(ey + eh + 0.145), X(ex + s * 0.12), Y(ey + eh + 0.09 + (fam % 2 ? 0.02 : 0))); g.stroke();
      if (child || o.young) { g.fillStyle = 'rgba(232,120,120,0.30)'; g.beginPath(); g.ellipse(X(ex + s * 0.02), Y(ey - 0.2), child ? 15 : 12, child ? 8 : 6, 0, 0, TAU); g.fill(); }
      if (o.elder) { g.strokeStyle = 'rgba(120,80,70,0.4)'; g.lineWidth = 1.4; for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(X(ex + s * (ew + 0.03)), Y(ey - 0.02 + k * 0.06)); g.lineTo(X(ex + s * (ew + 0.1)), Y(ey - 0.06 + k * 0.1)); g.stroke(); } g.beginPath(); g.moveTo(X(0.5 + s * 0.12), Y(0.36)); g.quadraticCurveTo(X(0.5 + s * 0.2), Y(0.28), X(0.5 + s * 0.17), Y(0.2)); g.stroke(); }
    } else {
      // sunglasses: dark rounded lenses, a bridge and temples
      { const lx = X(ex), ly = Y(ey - 0.01), rw = (ew + 0.05) * 64, rh = (eh * 0.7 + 0.03) * 64; g.fillStyle = '#2a3150'; g.beginPath(); g.ellipse(lx, ly, rw, rh, 0, 0, TAU); g.fill();
        g.fillStyle = '#1a1e33'; g.beginPath(); g.ellipse(lx, ly + rh * 0.3, rw * 0.9, rh * 0.62, 0, 0, TAU); g.fill();
        g.strokeStyle = '#0d0e14'; g.lineWidth = 3.2; g.beginPath(); g.ellipse(lx, ly, rw, rh, 0, 0, TAU); g.stroke();
        g.fillStyle = 'rgba(200,220,245,0.75)'; g.beginPath(); g.ellipse(lx - s * rw * 0.35, ly - rh * 0.4, rw * 0.38, rh * 0.16, -0.5 * s, 0, TAU); g.fill(); }
      g.strokeStyle = '#17171d'; g.lineWidth = 3; g.beginPath(); g.moveTo(X(ex + s * (ew + 0.04)), Y(ey + 0.02)); g.lineTo(X(ex + s * (ew + 0.3)), Y(ey + 0.04)); g.stroke();
      g.strokeStyle = o.brow; g.lineWidth = fem ? 2.6 : 4; g.globalAlpha = 0.8; g.beginPath(); g.moveTo(X(ex - s * 0.11), Y(ey + eh + 0.1)); g.quadraticCurveTo(X(ex), Y(ey + eh + 0.15), X(ex + s * 0.12), Y(ey + eh + 0.1)); g.stroke(); g.globalAlpha = 1;
    }
  }
  if (o.glasses) { g.strokeStyle = '#17171d'; g.lineWidth = 3; g.beginPath(); g.moveTo(X(0.5 - 0.215 + ew + 0.045), Y(ey + 0.02)); g.quadraticCurveTo(X(0.5), Y(ey + 0.06), X(0.5 + 0.215 - ew - 0.045), Y(ey + 0.02)); g.stroke(); }
  g.strokeStyle = 'rgba(150,90,80,0.7)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(X(0.5), Y(0.34)); g.lineTo(X(0.51), Y(0.3)); g.stroke();      // nose hint
  g.strokeStyle = '#9a4b4b'; g.lineWidth = child ? 2.4 : 2.8; g.beginPath();                                                                      // mouth
  const sm = o.smile; g.moveTo(X(0.42), Y(0.18 + sm * 0.4)); g.quadraticCurveTo(X(0.5), Y(0.13 - sm), X(0.58), Y(0.18 + sm * 0.4)); g.stroke();
  if (o.open) { g.fillStyle = '#7a3438'; g.beginPath(); g.ellipse(X(0.5), Y(0.15), 9, 6, 0, 0, Math.PI); g.fill(); }
}
/** painted face atlas (8 x 4 cells of 128 px): transparent skin, opaque features */
export function faceAtlas(ctx) {
  return ctx.tex.draw(ATLAS.cols * ATLAS.cell, ATLAS.rows * ATLAS.cell, (g) => {
    for (let c = 0; c < 32; c++) {
      const ox = (c % ATLAS.cols) * ATLAS.cell, oy = Math.floor(c / ATLAS.cols) * ATLAS.cell;
      let o;
      if (c < 16) { const base = c % 8, fem = base < 4, fam = base % 4; o = { fem, fam, glasses: c >= 8, eye: EYE_COLS[fam === 3 ? 3 : fam === 0 ? 0 : fam], brow: fem ? '#3a2a26' : '#241e22', smile: (c % 3) * 0.025 - 0.005, young: fem }; }
      else if (c < 20) o = { fem: c < 18, child: true, fam: 0, eye: c % 2 ? '#3a2a26' : '#5b3a29', brow: '#4a3a30', smile: 0.045, open: c === 17 };
      else if (c < 24) { const fem = c < 22; o = { fem, fam: 1 + (c % 2), elder: true, eye: '#3a2a26', brow: fem ? '#8a8a90' : '#6a6a70', smile: 0.015 }; }
      else continue;
      paintFace(g, ox, oy, o);
    }
  }, { key: 'pt-faces', anisotropy: 4 });
}

// ------------------------------------------------------------------ materials
/** patched toon material: per-vertex slot -> per-instance palette (iA..iD), optional face atlas selected by iFace */
export function paletteMaterial(ctx, map = null) {
  const key = 'pt-pal|' + (map ? 'face' : 'plain');
  if (ctx.mat.cache.has(key)) return ctx.mat.cache.get(key);
  const m = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: ctx.mat.gradientMap, vertexColors: true, map });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nattribute float aSlot; attribute vec3 iA; attribute vec3 iB; attribute vec3 iC; attribute vec3 iD;${map ? '\nattribute vec2 iFace;' : ''}`)
      .replace('#include <color_vertex>', `#include <color_vertex>
        { vec3 tint = aSlot < 0.5 ? vec3(1.0) : (aSlot < 1.5 ? iA : (aSlot < 2.5 ? iB : (aSlot < 3.5 ? iC : iD))); vColor.rgb *= tint; }`);
    if (map) {
      sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv += iFace;\n#endif');
      sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#ifdef USE_MAP
        vec4 sampledDiffuseColor = texture2D( map, vMapUv );
        diffuseColor.rgb = mix( diffuseColor.rgb, sampledDiffuseColor.rgb, sampledDiffuseColor.a );
      #endif`);
    }
  };
  m.customProgramCacheKey = () => key;
  ctx.mat.cache.set(key, m);
  return m;
}
