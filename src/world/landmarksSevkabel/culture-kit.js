// Sevkabel cultural-place kit: shared sign/art atlas, café furniture, fair goods,
// posed visitors and spatially bounded bulbs. References: docs/SEVKABEL-CULTURE.md.
// Immutable details use Parts/ctx.addStatic; no per-frame venue simulation.
import * as THREE from 'three';
import * as L from '../layout.js';
import { makeLabels } from '../streets/labels.js';
import { registerLOD } from '../../core/spatial.js';
import { H } from './frame.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { knockFurniture } from '../lib/knock-furniture.js';      // n4spb (docs/AREAS.md 13, 15.v): the trailers, tables, planters and print stands are knock records

export const TITLES = ['ЯРМАРКА В ПОРТУ', 'КЕРАМИКА', 'КНИГИ И ЗИНЫ', 'ПРИНТЫ', 'ВИНТАЖ', 'УКРАШЕНИЯ', 'ЦВЕТЫ', 'КОФЕ', 'ПЕКАРНЯ', 'У МОРЯ', 'ЧУРРОС', 'ПОНЧИКИ', 'СЦЕНА', 'МАСТЕРСКАЯ', 'ГАЛЕРЕЯ', 'ВХОД НА ЯРМАРКУ', 'МЕНЮ', 'АФИША', 'СЕВКАБЕЛЬ ПОРТ', 'ВЫХОД'];
const SIGN_TILES = [...TITLES, ...Array(6).fill(null), 'ТРДЕЛЬНИКИ', 'КОФЕ И ЧУРРОС', 'БИСТРО', 'РЕСТОРАН', 'КАФЕ', 'СЫТНЫЙ ДВОР'];

export function makeCulture(ctx, M) {
  const atlas = ctx.tex.draw(1024, 1024, (g) => {
    const font = ctx.tex.FONTS.sans;
    for (let i = 0; i < 32; i++) {
      const x = (i % 4) * 256, y = Math.floor(i / 4) * 128;
      g.fillStyle = i % 3 === 0 ? '#345e5c' : i % 3 === 1 ? '#d3ac71' : '#efe5cc'; g.fillRect(x, y, 256, 128);
      g.strokeStyle = '#8d6e52'; g.lineWidth = 3; g.strokeRect(x + 5, y + 5, 246, 118);
      if (SIGN_TILES[i]) {
        g.fillStyle = i % 3 === 0 ? '#efe5cc' : '#313b3c'; g.textAlign = 'center'; g.textBaseline = 'middle';
        ctx.tex.fitText(g, SIGN_TILES[i], x + 128, y + 47, 232, 26, font, 700);
        const sub = i === 0 ? 'ЛЕТНИЙ МАРКЕТ · РУЧНАЯ РАБОТА' : i === 16 ? 'КОФЕ  ·  ВЫПЕЧКА  ·  ЛИМОНАД' : i === 17 ? 'МАРКЕТ · ВЫСТАВКА · МУЗЫКА' : 'СДЕЛАНО В ПЕТЕРБУРГЕ';
        ctx.tex.fitText(g, sub, x + 128, y + 89, 232, 12, font, 500);
      } else {
        // Original abstract prints, painted in the atlas rather than extra materials.
        g.fillStyle = '#be7057'; g.beginPath(); g.arc(x + 165, y + 45, 31, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#476e75'; g.fillRect(x + 35, y + 65, 145, 37);
        g.strokeStyle = '#e2c37f'; g.lineWidth = 9; g.beginPath(); g.moveTo(x + 30, y + 103); g.lineTo(x + 113, y + 30); g.lineTo(x + 220, y + 92); g.stroke();
      }
    }
  }, { key: 'lmsevka-culture-atlas' });
  const flat = (name, color) => ctx.mat.toon(color, { name: 'lmsevka-culture-' + name, paint: 0.025 });
  M.cultureAtlas = ctx.mat.toon('#ffffff', { map: atlas, paint: 0, polygonOffset: -2, name: 'lmsevka-culture-atlas' });
  M.cultureTeal = flat('teal', '#467d76'); M.cultureRose = flat('rose', '#b96775');
  M.cultureCream = M.plaster; M.cultureSkin = flat('skin', '#d6aa86');
  M.cultureLight = ctx.mat.emissive('#ffdfa3', 1.35, { name: 'lmsevka-culture-light' });
  const floor = ctx.tex.draw(512, 512, (g) => {
    const r = ctx.rng(8308); g.fillStyle = '#999991'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1400; i++) { g.fillStyle = i % 2 ? 'rgba(48,48,44,.05)' : 'rgba(226,219,198,.06)'; g.fillRect(r() * 512, r() * 512, 3 + r() * 25, 2 + r() * 10); }
    g.fillStyle = 'rgba(47,51,50,.19)'; g.fillRect(0, 0, 512, 2); g.fillRect(0, 0, 2, 512);
    g.strokeStyle = 'rgba(62,59,53,.13)'; g.lineWidth = 1; g.beginPath(); g.moveTo(48, 15); g.lineTo(63, 58); g.lineTo(84, 73); g.stroke();
  }, { key: 'lmsevka-fair-floor', repeat: [1, 1] });
  M.cultureFloor = ctx.mat.toon('#ffffff', { map: floor, paint: .025, name: 'lmsevka-fair-floor' });
  M.cafeGlass = ctx.mat.glass({ tint: '#bed2ce', opacity: .18, streaks: false });
  M.glassy.add(M.cafeGlass);
  M.decals.add(M.cultureAtlas);
  ctx.services.labels ||= makeLabels();
  return M;
}

/** Sign in the current Parts frame; reserve the exact world rectangle first. */
export function sign(K, title, x, y, z, w, h, bld = 'sevkabel-culture') {
  const { P, M, ctx } = K, p = new THREE.Vector3(x, y, z).applyMatrix4(P.m);
  const n = new THREE.Vector3(0, 0, 1).transformDirection(P.m);
  if (!ctx.services.labels.reserve(bld, p.x, p.y, p.z, w, h, n.x, n.z, 'shop')) return false;
  tile(P, M, Math.max(0, SIGN_TILES.indexOf(title)), x, y, z, w, h);
  return true;
}

export function tile(P, M, i, x, y, z, w, h) {
  const u = (i % 4) / 4, v = 1 - (Math.floor(i / 4) + 1) / 8, pad = 1 / 1024;
  P.quad(M.cultureAtlas, [x - w / 2, y - h / 2, z], [x + w / 2, y - h / 2, z], [x + w / 2, y + h / 2, z], [x - w / 2, y + h / 2, z], [0, 0, 1],
    [[u + pad, v + pad], [u + .25 - pad, v + pad], [u + .25 - pad, v + .125 - pad], [u + pad, v + .125 - pad]]);
}

/** Check the final rotated footprint, including its interior, against asphalt/buildings/water. */
export function publicSpot(ctx, x, z, w, d, rot = 0) {
  const c = Math.cos(rot), s = Math.sin(rot), nx = Math.ceil(w / .6), nz = Math.ceil(d / .6);
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
    const u = -w / 2 + w * i / nx, v = -d / 2 + d * j / nz;
    const p = H.W(x + c * u + s * v, z - s * u + c * v);
    if (L.inRiver(p.x, p.z) || L.insideBuilding(p.x, p.z, .2)) return false;
    const cover = ctx.services.streets?.net?.cover;
    if (cover ? cover(p.x, p.z, {}) >= -.5 : L.isOnRoad(p.x, p.z, .5)) return false;
  }
  return true;
}

export function solid(K, x, z, w, d, h, rot = 0, y0 = 0) {
  const p = H.W(x, z); return K.ctx.physics.addBox(p.x, p.z, w, d, H.rot + rot, y0, y0 + h);
}

/**
 * n4spb (docs/AREAS.md 13, 15.v): a fixture of the culture kit as a KNOCK RECORD. `draw(K2)` draws it exactly as before, but into a private collector (K2 = K with P replaced; its H frame is pushed here, so
 * world positions of the signs / bulbs stay right) and returns its collider(s); the geometry is then moved into the local frame of the spot (x, z, rotY: world) and handed to knockFurniture.
 * Returns the triangle count (the caller adds it to K.extraTris).
 */
export function knockCaptured(K, name, spot, draw, rec, far = 220, base = H) {      // base: the frame the draw function works in (default: the frame H of the module; { x: 0, z: 0, rot: 0 } = the world)
  K.bulbs ||= [];                                                                       // (festoon() pushes into K.bulbs: the copy K2 must share the array)
  let items = null;
  const geos = partsGeos((Q) => { Q.push(base.x, 0, base.z, base.rot); items = draw({ ...K, P: Q }); Q.pop(); });
  const inv = new THREE.Matrix4().compose(new THREE.Vector3(spot.x, 0, spot.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), spot.rotY), new THREE.Vector3(1, 1, 1)).invert();
  for (const { geo } of geos.list) { geo.applyMatrix4(inv); geo.computeBoundingSphere(); }
  return knockFurniture(K.ctx, name, geos, [{ x: spot.x, y: 0, z: spot.z, rotY: spot.rotY }], [items], rec, far);
}

export function planter(P, M, x, z) {
  P.box(M.larchDark, x - .45, x + .45, .05, .62, z - .45, z + .45, 'b');
  P.box(M.portalDark, x - .36, x + .36, .62, .65, z - .36, z + .36, 'b');
  for (const [dx, dz, h] of [[0, 0, 1.2], [-.22, .1, .95], [.18, -.2, 1.05]]) {
    P.col(M.cultureTeal, x + dx, z + dz, .63, h, .21, .1, 6);
  }
}

export function table(P, M, x, z, picnic = false) {
  if (picnic) {
    P.box(M.slats, x - 1.05, x + 1.05, .74, .82, z - .43, z + .43, 'b');
    for (const dx of [-.7, .7]) for (const dz of [-.65, .65]) P.cyl(M.black, [x + dx, .05, z + dz], [x + dx, .75, z], .045, .045, 4);
    for (const dz of [-.68, .68]) P.box(M.slats, x - 1.05, x + 1.05, .43, .49, z + dz - .16, z + dz + .16, 'b');
  } else {
    P.col(M.plaster, x, z, .73, .79, .46, .46, 12); P.col(M.black, x, z, .08, .73, .04, .04, 6);
    P.col(M.black, x, z, .06, .10, .27, .27, 8);
    for (const dz of [-.78, .78]) {
      P.box(M.cultureTeal, x - .21, x + .21, .43, .49, z + dz - .2, z + dz + .2, 'b');
      P.box(M.cultureTeal, x - .21, x + .21, .49, .86, z + dz + Math.sign(dz) * .16 - .04, z + dz + Math.sign(dz) * .16 + .04, 'b');
      for (const dx of [-.16, .16]) for (const zz of [-.15, .15]) P.col(M.black, x + dx, z + dz + zz, .05, .43, .025, .025, 4);
    }
  }
  P.col(M.plaster, x + .18, z, .8, .95, .055, .05, 8);
}

export function goods(P, M, kind, x = 0, y = 1.05, z = 0) {
  for (let i = 0; i < 6; i++) {
    const a = x - 1.9 + i * .72, col = i % 2 ? M.cultureTeal : M.cultureRose;
    if (kind === 0) { // pottery: hollow bowls, vases and cups
      P.cyl(col, [a, y, z], [a, y + .23 + .08 * (i % 3), z], .11, .16, 10, false);
      P.col(M.portalDark, a, z, y + .225 + .08 * (i % 3), y + .235 + .08 * (i % 3), .12, .12, 8);
    } else if (kind === 1) { // books/zines in varied stacks
      for (let k = 0; k < 2 + i % 3; k++) P.box(k % 2 ? col : M.plaster, a - .2, a + .2, y + k * .07, y + k * .07 + .055, z - .15, z + .15, 'b');
    } else if (kind === 2) { // print bins and framed original artwork
      P.box(M.larchDark, a - .26, a + .26, y, y + .1, z - .2, z + .2, 'b');
      tile(P, M, 20 + i, a, y + .38, z + .08, .42, .55);
    } else if (kind === 3) { // folded fabrics, clothing rail authored elsewhere
      P.box(col, a - .22, a + .22, y, y + .14, z - .18, z + .18, 'b');
    } else if (kind === 4) {
      P.box(M.plaster, a - .2, a + .2, y, y + .04, z - .18, z + .18, 'b');
      P.cyl(M.copper, [a - .12, y + .07, z], [a + .12, y + .07, z], .045, .045, 8);
    } else { // flowers and paper-wrapped bouquets
      P.col(M.larch, a, z, y, y + .18, .10, .13, 6);
      P.col(M.cultureTeal, a, z, y + .18, y + .52, .04, .04, 5);
      P.col(col, a, z, y + .45, y + .65, .16, .10, 7);
    }
  }
}

/** Posed vendors/readers: bounded static scenery, never a far-away simulated crowd. */
export function visitor(P, M, x, z, rot = 0, outfit = 0, seated = false) {
  P.push(x, 0, z, rot);
  const cloth = [M.cultureTeal, M.cultureRose, M.plaster, M.yellowSteel][outfit % 4], hip = seated ? .65 : .94;
  P.cyl(cloth, [0, hip - .13, 0], [0, hip + .46, 0], .17, .22, 8);
  P.col(M.cultureSkin, 0, 0, hip + .43, hip + .55, .07, .07, 6);
  const head = new THREE.SphereGeometry(1, 10, 6);
  P.geo(M.cultureSkin, head, 0, hip + .67, 0, 0, 0, 0, .12, .15, .115);
  const hair = new THREE.SphereGeometry(1, 10, 4, 0, Math.PI * 2, 0, 1.65);
  P.geo(M.black, hair, 0, hip + .69, -.008, 0, 0, 0, .128, .15, .125);
  head.dispose(); hair.dispose();
  for (const dx of [-.042, .042]) P.box(M.black, dx - .013, dx + .013, hip + .69, hip + .708, .105, .12, 'b');
  for (const s of [-1, 1]) {
    const knee = seated ? [s * .12, .46, .34] : [s * .11, .49, .02];
    P.cyl(M.darkRoof, [s * .1, hip, 0], knee, .09, .07, 6);
    P.cyl(M.darkRoof, knee, [s * .12, .1, seated ? .36 : .04], .065, .05, 6);
    P.box(M.black, s * .12 - .075, s * .12 + .075, .06, .14, seated ? .29 : -.05, seated ? .52 : .2, 'b');
    P.cyl(cloth, [s * .22, hip + .36, 0], [s * .29, hip + .09, .12], .07, .06, 6);
    P.cyl(M.cultureSkin, [s * .29, hip + .09, .12], [s * .13, hip + .15, .3], .052, .043, 6);
  }
  // a cup or a small open zine in the hands gives the pose a purpose.
  if (outfit % 2) P.box(M.plaster, -.13, .13, hip + .12, hip + .16, .22, .42, 'b');
  else P.col(M.plaster, .1, .28, hip + .13, hip + .28, .05, .055, 7);
  P.pop();
}

/** The cable is a static tube; bulbs are collected into 48 m spatial instance cells. */
export function festoon(K, a, b, sag = .7) {
  const { P, M } = K, len = Math.hypot(b[0] - a[0], b[2] - a[2]), count = Math.ceil(len / 1.3);
  const at = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - 4 * sag * t * (1 - t), a[2] + (b[2] - a[2]) * t];
  let prev = a;
  for (let i = 1; i <= count; i++) {
    const p = at(i / count); P.cyl(M.black, prev, p, .014, .014, 4, false); prev = p;
    if (i === count) continue;
    P.cyl(M.black, p, [p[0], p[1] - .15, p[2]], .025, .025, 5);
    const v = new THREE.Vector3(p[0], p[1] - .22, p[2]).applyMatrix4(P.m);
    (K.bulbs ||= []).push(mat4(v.x, v.y, v.z));
  }
}

export function buildBulbs(K) {
  if (!K.bulbs?.length) return;
  const cells = new Map();
  for (const m of K.bulbs) { const e = m.elements, key = `${Math.floor(e[12] / 48)},${Math.floor(e[14] / 48)}`; if (!cells.has(key)) cells.set(key, []); cells.get(key).push(m); }
  const parts = partsGeos((P) => { const g = new THREE.SphereGeometry(.105, 8, 5); P.geo(K.M.cultureLight, g); g.dispose(); });
  for (const [key, matrices] of cells) {
    const r = addInstanced(K.ctx, K.root, 'sevkabel-bulbs-' + key, parts, matrices, { cast: false });
    for (const m of r.meshes) { K.ctx.noOutline(m); m.updateMatrixWorld(true); registerLOD(m, 200); }
    K.extraTris += r.tris;
  }
  K.svc.festoonBulbs = (K.svc.festoonBulbs || 0) + K.bulbs.length;
}
