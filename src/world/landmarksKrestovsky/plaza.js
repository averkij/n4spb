// The paved apron round the arena (2026-10-13, "finish the stadium area"): granite slabs from under the plinth out to the first service ring.
// Before this the stadium stood on the generic blotchy asphalt / grass patchwork of the data ground. One flat mesh (y +0.03, tile 4.8 m, running-bond 1.2 x 0.6 m slabs), no collider
// (the ground the player walks on stays y = 0). Cells of 1.6 m are kept only where all four corners are clear of: real asphalt (streets net.cover, 0.6 m margin), water, every mapped
// building except the arena oval itself (its annex wings are buildings), lawns / parks / wood (GREEN), car parks and mapped paving AREAS (they have their own surface). Mapped footways are
// not cut out: streets draws them at y 0.04 with a stronger polygon offset, so they lie over the slabs. Runs of kept cells in one row are merged into one quad.
// Rendering cost: one static mesh, one material, no frame callback. Budget: ~3-4 k triangles.
import * as THREE from 'three';
import * as CITY from '../data/city.js';

const TILE = 4.8, Y = .03, CELL = 1.6;
const ringBox = (o) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < o.length; i += 2) { x0 = Math.min(x0, o[i]); x1 = Math.max(x1, o[i]); z0 = Math.min(z0, o[i + 1]); z1 = Math.max(z1, o[i + 1]); } return [x0, x1, z0, z1]; };
const inRing = (o, x, z) => { let yes = false; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) if ((o[i + 1] > z) !== (o[j + 1] > z) && x < (o[j] - o[i]) * (z - o[i + 1]) / (o[j + 1] - o[i + 1]) + o[i]) yes = !yes; return yes; };

export function plazaTexture(ctx) {
  return ctx.tex.draw(256, 256, (g, w, h) => {
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;                    // deterministic slab tones
    g.fillStyle = '#9a9a93'; g.fillRect(0, 0, w, h);
    const sw = w / 4, sh = h / 8;                                                                 // 1.2 x 0.6 m slabs on a 4.8 m tile
    for (let j = 0; j < 8; j++) for (let i = -1; i < 5; i++) {
      const x = i * sw + (j % 2 ? sw / 2 : 0), y = j * sh, t = r();
      g.fillStyle = t < .3 ? '#b9b9b1' : t < .65 ? '#adada5' : t < .9 ? '#b3b2aa' : '#a3a39b';
      g.fillRect(x + 1.2, y + 1.2, sw - 2.4, sh - 2.4);
    }
  }, { key: 'krestovsky-plaza', repeat: [1, 1] });
}

/** the clip rules of the apron as a function pair: why(x, z) -> '' when the point may carry a slab, else the reason letter (r outside the ring, w water, a asphalt, b building, g lawn / park / wood, p car park, s mapped paving area) */
export function apronRules(ctx, bb, rx, rz) {
  const R = 1.42, R0 = .84, reach = R * Math.max(rx, rz) + 12;
  const near = (b) => b[1] > bb.cx - reach && b[0] < bb.cx + reach && b[3] > bb.cz - reach && b[2] < bb.cz + reach;
  const sets = { b: [], g: [], p: [], s: [] }, add = (k, p) => { const b = ringBox(p.o); if (near(b)) sets[k].push({ o: p.o, h: p.h || [], b }); };
  for (const b of CITY.BUILDINGS) { if (b.skip || b.id === 'r8841754' || b.id === 'r8846006') continue; for (const p of b.polys || []) add('b', p); }
  for (const g of CITY.GREEN) { if (g.kind === 'stadium') continue; for (const p of g.polys || []) add('g', p); }     // leisure=stadium is the whole plot, not a lawn
  for (const g of CITY.PARKING) for (const p of g.polys || []) add('p', p);
  for (const a of CITY.AREAS) if (!a.bridge && !a.tunnel) for (const p of a.polys || []) add('s', p);
  const net = ctx.services.streets?.net, L = ctx.L;
  const clearOfAsphalt = net && net.cover ? (x, z) => net.cover(x, z, {}) < -.6 : (x, z) => !L.isOnRoad(x, z, .6);
  const hit = (list, x, z) => { for (const q of list) if (x >= q.b[0] && x <= q.b[1] && z >= q.b[2] && z <= q.b[3] && inRing(q.o, x, z) && !q.h.some((h) => inRing(h, x, z))) return true; return false; };
  const why = (x, z) => {
    const rho = Math.hypot((x - bb.cx) / rx, (z - bb.cz) / rz);
    if (rho < R0 || rho > R) return 'r';
    if (L.heightAt(x, z) <= -.2) return 'w';
    if (!clearOfAsphalt(x, z)) return 'a';
    for (const k of ['b', 'g', 'p', 's']) if (hit(sets[k], x, z)) return k;
    return '';
  };
  return { why, reach };
}

/** bb/rx/rz: the oval of the arena. Returns { quads, triangles, cells }. */
export function plaza(ctx, mat, bb, rx, rz) {
  const { why, reach } = apronRules(ctx, bb, rx, rz), free = (x, z) => why(x, z) === '';
  const x0 = Math.floor((bb.cx - reach) / CELL) * CELL, z0 = Math.floor((bb.cz - reach) / CELL) * CELL, n = Math.ceil(2 * reach / CELL) + 1;
  const ok = new Uint8Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) ok[j * n + i] = free(x0 + i * CELL, z0 + j * CELL) ? 1 : 0;
  const pos = [], uv = [], idx = [];
  let quads = 0, cells = 0;
  for (let j = 0; j + 1 < n; j++) {
    let i = 0;
    while (i + 1 < n) {
      const good = (a) => ok[j * n + a] && ok[j * n + a + 1] && ok[(j + 1) * n + a] && ok[(j + 1) * n + a + 1];
      if (!good(i)) { i++; continue; }
      let e = i; while (e + 1 + 1 < n && good(e + 1)) e++;
      const xa = x0 + i * CELL, xb = x0 + (e + 1) * CELL, za = z0 + j * CELL, zb = za + CELL, k = pos.length / 3;
      pos.push(xa, Y, za, xb, Y, za, xb, Y, zb, xa, Y, zb);
      uv.push(xa / TILE, za / TILE, xb / TILE, za / TILE, xb / TILE, zb / TILE, xa / TILE, zb / TILE);
      idx.push(k, k + 3, k + 2, k, k + 2, k + 1);                                                 // counter-clockwise seen from above (+y)
      quads++; cells += e - i + 1; i = e + 1;
    }
  }
  if (!quads) return { quads: 0, triangles: 0, cells: 0 };
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(pos.length).map((_, k) => (k % 3 === 1 ? 1 : 0)), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeBoundingSphere(); g.computeBoundingBox();
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'krestovsky-plaza'; mesh.receiveShadow = true;
  ctx.addStatic(mesh);
  return { quads, triangles: quads * 2, cells };
}
