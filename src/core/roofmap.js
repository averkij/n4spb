// roofmap.js — a walkable height map of the building roofs, read back from what is actually drawn.
// The wall colliders are hollow boxes and the crowns, parapets and plant rooms are meshes built by the tower modules, so the only
// truth about "where is the roof" is the rendered geometry: one top-down orthographic depth pass over the static scene gives the
// highest surface in every cell, and inside a ground-standing building footprint that is the roof (or whatever stands on it).
// Stored in 5 cm steps per cell (Uint16, NONE = no roof) and consulted by Physics.roofTop / groundHeight, so a player lands on
// and walks over exactly the surface they see: flat decks, low parapets and steps; a wall or a steep crown simply blocks.
import * as THREE from 'three';
import { MASK_COLOR } from './renderer.js';

export const NONE = 0xffff;
export const UNIT = 0.05;

/** Even-odd scanline fill of polygon rings (outer + holes; flat [x,z,x,z,...], open) on the grid m: fn(row, i0, i1) per run of cell centres inside. */
function fillRings(rings, m, fn) {
  const { x0, z0, res, w, h } = m;
  let zmin = Infinity, zmax = -Infinity;
  for (const r of rings) for (let k = 1; k < r.length; k += 2) { zmin = Math.min(zmin, r[k]); zmax = Math.max(zmax, r[k]); }
  const j0 = Math.max(0, Math.ceil((zmin - z0) / res - 0.5)), j1 = Math.min(h - 1, Math.floor((zmax - z0) / res - 0.5));
  const xs = [];
  for (let j = j0; j <= j1; j++) {
    const z = z0 + (j + 0.5) * res; xs.length = 0;
    for (const o of rings) for (let a = 0, b = o.length - 2; a < o.length; b = a, a += 2) {
      const za = o[a + 1], zb = o[b + 1];
      if ((za > z) !== (zb > z)) xs.push(o[a] + (z - za) * (o[b] - o[a]) / (zb - za));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const i0 = Math.max(0, Math.ceil((xs[k] - x0) / res - 0.5)), i1 = Math.min(w - 1, Math.floor((xs[k + 1] - x0) / res - 0.5));
      if (i1 >= i0) fn(j, i0, i1);
    }
  }
}

/**
 * Capture the roof map.
 * @param renderer   THREE.WebGLRenderer
 * @param scene      the scene; only `root` (the static group, after batching) is drawn
 * @param root       ctx.staticRoot
 * @param footprints [{ o, h }] outlines of the buildings that stand on the ground (layout.groundFootprints())
 * @param physics    its elevated walkable decks (podium plaza, platform, bridges) keep their own floor: no roof cells there
 * @returns { x0, z0, res, w, h, data, cells, ms } or null
 */
export function captureRoofMap(renderer, scene, root, footprints, physics, { res = 0.5, minTop = 2.5, margin = 2 } = {}) {
  const t0 = performance.now();
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const p of footprints) for (let i = 0; i < p.o.length; i += 2) { x0 = Math.min(x0, p.o[i]); x1 = Math.max(x1, p.o[i]); z0 = Math.min(z0, p.o[i + 1]); z1 = Math.max(z1, p.o[i + 1]); }
  if (!(x1 > x0 && z1 > z0)) return null;
  x0 = Math.floor(x0 - margin); z0 = Math.floor(z0 - margin); x1 += margin; z1 += margin;
  const lim = Math.min(8192, renderer.capabilities.maxTextureSize || 4096);
  while (Math.ceil((x1 - x0) / res) > lim || Math.ceil((z1 - z0) / res) > lim) res *= 1.25;
  const w = Math.ceil((x1 - x0) / res), h = Math.ceil((z1 - z0) / res), m = { x0, z0, res, w, h };

  // ---- top-down orthographic depth pass over the static scene (packed RGBA depth: r is the most significant byte)
  const CAMY = 1000, NEAR = 1, FAR = 1500, cx = x0 + (w * res) / 2, cz = z0 + (h * res) / 2;
  const cam = new THREE.OrthographicCamera(-(w * res) / 2, (w * res) / 2, (h * res) / 2, -(h * res) / 2, NEAR, FAR);
  cam.up.set(0, 0, -1); cam.position.set(cx, CAMY, cz); cam.lookAt(cx, 0, cz); cam.layers.mask = MASK_COLOR; cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
  const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.UnsignedByteType, format: THREE.RGBAFormat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false, depthBuffer: true, samples: 0 });
  const mat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  const hidden = []; for (const c of scene.children) if (c !== root && c.visible) { c.visible = false; hidden.push(c); }
  const keep = { over: scene.overrideMaterial, bg: scene.background, fog: scene.fog, target: renderer.getRenderTarget(), clear: renderer.getClearColor(new THREE.Color()), alpha: renderer.getClearAlpha(), shadows: renderer.shadowMap.enabled };
  const buf = new Uint8Array(w * h * 4);
  try {
    scene.overrideMaterial = mat; scene.background = null; scene.fog = null;
    renderer.shadowMap.enabled = false; // shadows cannot affect packed roof depth
    renderer.setRenderTarget(rt); renderer.setClearColor(0xffffff, 1); renderer.clear();
    renderer.render(scene, cam);
    renderer.readRenderTargetPixels(rt, 0, 0, w, h, buf);
  } finally {
    scene.overrideMaterial = keep.over; scene.background = keep.bg; scene.fog = keep.fog;
    renderer.shadowMap.enabled = keep.shadows;
    renderer.setRenderTarget(keep.target); renderer.setClearColor(keep.clear, keep.alpha);
    for (const c of hidden) c.visible = true;
    rt.dispose(); mat.dispose();
  }
  // height of the highest drawn surface in cell (i, j); readback rows run bottom -> top, grid rows run north (z0) -> south
  const topAt = (i, j) => {
    const k = ((h - 1 - j) * w + i) * 4;
    const d = (255 / 256) * (buf[k] / 255 + buf[k + 1] / 65280 + buf[k + 2] / 16711680) + buf[k + 3] / 4278190080;
    return d >= 0.99999 ? NaN : CAMY - (NEAR + d * (FAR - NEAR));
  };

  // ---- cells that already have their own elevated floor (walk boxes / ramps: podium plaza, platform, bridge decks) are not roofs
  const excl = new Uint8Array(w * h);
  for (const it of physics.items) {
    const top = it.type === 'walk' ? it.top : it.type === 'ramp' ? (it.clipTop ?? Math.max(it.yA, it.yB)) : NaN;
    if (!(top >= minTop)) continue;
    if (it.clip) { fillRings([it.clip],m,(j,i0,i1)=>excl.fill(1,j*w+i0,j*w+i1+1)); continue; }
    const hw = it.hw + 0.3, hd = it.hd + 0.3, ring = [];
    for (const [lx, lz] of [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]]) ring.push(it.cx + lx * it.c + lz * it.s, it.cz - lx * it.s + lz * it.c);
    fillRings([ring], m, (j, i0, i1) => excl.fill(1, j * w + i0, j * w + i1 + 1));
  }

  // ---- roof cells: inside a ground-standing footprint, where something is drawn at least minTop above the ground
  const data = new Uint16Array(w * h).fill(NONE); let cells = 0;
  for (const p of footprints) {
    fillRings([p.o, ...p.h], m, (j, i0, i1) => {
      for (let i = i0; i <= i1; i++) {
        const k = j * w + i; if (excl[k]) continue;
        const y = topAt(i, j); if (!(y >= minTop)) continue;             // NaN (nothing drawn) fails too
        data[k] = Math.min(NONE - 1, Math.round(y / UNIT)); cells++;
      }
    });
  }
  return { x0, z0, res, w, h, data, cells, ms: performance.now() - t0 };
}
