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
import { positionsMM, triangles } from './head-scan.js';
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
  const boot = kind === 'boot' || kind === 'wideBoot';
  const G = new Geo(), w = kind === 'wide' || kind === 'wideBoot' ? 1.17 : kind === 'jeans' ? 0.92 : 1;
  const len = H.shin - (boot ? .128 : .02);
  if (kind === 'bare') { slotted(G, SK, (g) => g.sphere(0.06, 0.06, 0.06, [0, 0, 0], '#ffffff', 4, null, 2)); limb(G, len, 0.06, 0.04, SK, '#ffffff', 6); }
  else { slotted(G, SA, (g) => g.sphere(0.066 * w, 0.066 * w, 0.066 * w, [0, 0, 0], '#ffffff', 4, null, 2)); limb(G, len, 0.064 * w, kind === 'wide' ? 0.058 : 0.048 * w, SA, '#ffffff', 6); }
  if (boot) {
    // The shaft follows the lower leg; only the vamp rolls with the foot.
    // The trouser terminates inside the cuff, including throughout the swing.
    addLoft(G, [{y:-H.shin+.008,rx:.040,rz:.046,cz:-.003},
      {y:-H.shin+.143,rx:.058*w,rz:.061*w,cz:-.003}], SB, '#eadfd8', 6);
  }
  return G;
}
// ------------------------------------------------------------------ head, faces and hair
export const FACE_W = 0.19, FACE_H = 0.2;
export const ATLAS = { cols: 8, rows: 4, cell: 128 };
function skullGeo() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positionsMM.map(mm => mm / 1000), 3));
  g.setIndex(triangles);
  g.computeVertexNormals();
  return g;
}
let _skull = null;
function capGeo(scale = 1.07, cover = 1.9, front = 0.36, seg = 8, rings = 3) {
  const g = new THREE.SphereGeometry(1, seg, rings, 0, TAU, 0, cover), p = g.attributes.position, R = 0.102 * scale;
  for (let i = 0; i < p.count; i++) {
    const a = i % (seg + 1) * TAU / seg;
    const at = Math.floor(i / (seg + 1)) / rings;
    const edge = cover + 0.18 - (0.64 + front) * Math.max(0, Math.sin(a));
    const theta = at * edge;
    p.setXYZ(i, -Math.cos(a) * Math.sin(theta) * R * 0.92, 0.144 + Math.cos(theta) * R * 1.09,
      Math.sin(a) * Math.sin(theta) * R - 0.003);
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
    add(capGeo(1.14, 1.46, 0.02, 12), SB);
  }
  const geo = G.build(true, true), pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {                                                        // planar face projection for skin vertices on the front, the blank corner elsewhere
    if (i < _skull.attributes.position.count) {
      // Wrap to the transparent side margin at the temples. Collapsing the
      // rear vertices to one corner lets the eyes smear across profile faces.
      const angle = Math.atan2(pos.getX(i), pos.getZ(i)), y = pos.getY(i);
      const fu = clamp(0.5 + angle / 2.35, 0.01, 0.99), fv = clamp(0.5 + (y - 0.145) / FACE_H, 0.01, 0.99);
      uv.setXY(i, fu / ATLAS.cols, 1 - 1 / ATLAS.rows + fv / ATLAS.rows);
    }
    else uv.setXY(i, 0.035 / ATLAS.cols, 1 - 1 / ATLAS.rows + 0.035 / ATLAS.rows);
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
  g.save();
  g.translate(ox, oy);
  // Coordinates in one 128-pixel cell, top to bottom. Only features have ink.
  const y = o.child ? 66 : 61, half = o.child ? 11 : 9.5;
  const lid = o.child ? 4.5 : o.elder || o.fam === 2 ? 2.6 : 3.6;
  function curve(x0, y0, cx, cy, x1, y1, colour, width) {
    g.strokeStyle = colour; g.lineWidth = width; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke();
  }
  function oval(x, y, rx, ry, colour) {
    g.fillStyle = colour; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill();
  }
  for (const s of [-1, 1]) {
    const x = 64 + s * (o.child ? 22 : 21), outer = x + s * half, inner = x - s * half;
    const blush = g.createRadialGradient(x + s * 7, y + 13, 1, x + s * 7, y + 13, 11);
    blush.addColorStop(0, o.elder ? 'rgba(174,114,98,.10)' : 'rgba(191,114,99,.19)');
    blush.addColorStop(1, 'rgba(191,114,99,0)');
    oval(x + s * 7, y + 13, 13, 9, blush);
    curve(inner - s, y - 8, x, y - (o.fem ? 14 : 12), outer + s, y - 9, o.brow, o.child ? 1.9 : o.fem ? 2.5 : 3.2);
    if (o.glasses) {
      oval(x, y, 14, 8, '#353b46');
      curve(x - 8, y - 4, x - 5, y - 5, x, y - 5, '#838f9a', 1.6);
      curve(outer, y - 2, outer + s * 6, y - 3, outer + s * 19, y - 5, '#33313a', 2.1);
    } else {
      g.save(); g.beginPath(); g.moveTo(inner, y + 1);
      g.quadraticCurveTo(x, y - lid * 2.05, outer, y - 0.8);
      g.quadraticCurveTo(x, y + lid * 1.65, inner, y + 1); g.closePath();
      g.fillStyle = '#ede4d8'; g.fill(); g.clip();
      oval(x, y - 0.3, lid + 0.9, lid + 1, o.eye);
      oval(x, y, lid * 0.55, lid * 0.68, '#28232a');
      oval(x - 1, y - 1.3, 0.9, 0.9, '#f6eee6'); g.restore();
      curve(inner, y + 1, x, y - lid * 2.05, outer, y - 0.8, '#46342f', o.fem ? 1.9 : 1.5);
      if (o.elder) curve(outer + s, y + 3, outer + 3 * s, y + 4, outer + 5 * s, y + 5, 'rgba(109,76,66,.46)', 1.2);
    }
    curve(64 + s * 3, 83, 64 + s * 5, 84, 64 + s * 6, 81, 'rgba(106,66,56,.68)', 1.65);
  }
  if (o.glasses) curve(55, y - 2, 64, y - 6, 73, y - 2, '#35323a', 2.4);
  const mouth = o.child ? 95 : 96, corners = mouth - o.smile * 62;
  curve(52, corners, 64, mouth + 1, 76, corners, '#875956', 2);
  curve(57, mouth + 3, 64, mouth + (o.open ? 7 : 5), 71, mouth + 3, 'rgba(188,123,112,.65)', 2);
  g.restore();
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
      // Morph just the skin of the head. Hair and headwear keep their fit at the crown.
      sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        if (aSlot > 3.5) {
          float face = floor(iFace.x * 8.0 + .5) - 8.0 * floor(iFace.y * 4.0 + .5);
          float child = step(16.,face) * (1.-step(20.,face));
          float elder = step(20.,face);
          float masculine = face < 16. ? step(4.,mod(face,8.)) : step(2.,mod(face,4.));
          float jaw = smoothstep(.0,.045,position.y) * (1.-smoothstep(.075,.17,position.y));
          transformed.x *= 1. + jaw * (.10*masculine - .12*(1.-masculine) + .12*child + .07*elder);
          transformed.y += jaw * (.017*child - .007*elder);
          transformed.z += smoothstep(.055,.10,position.z) * (.009*masculine - .016*child);
        }`);
      sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv += iFace;\n#endif');
      sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '').replace('#include <color_fragment>', `#include <color_fragment>
        #ifdef USE_MAP
        vec4 sampledDiffuseColor = texture2D( map, vMapUv );
        diffuseColor.rgb = mix( diffuseColor.rgb, sampledDiffuseColor.rgb, sampledDiffuseColor.a );
      #endif`);
    }
  };
  m.customProgramCacheKey = () => key;
  ctx.mat.cache.set(key, m);
  return m;
}
