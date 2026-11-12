// The two 1955 Line 1 surface vestibules in Avtovo. OSM anchors and footprints:
// Avtovo r6440025 (domed east apse), Kirovsky Zavod w47636754 (peripter).
// Architecture and current facade details: docs/research/avtovo-metro.md.
import * as THREE from 'three';
import { Parts, archPath } from './landmarksD/kit.js';
import { registerLOD } from '../core/spatial.js';

export const OWNS_GROUPS = true;

const AVTOVO = { x: -5027.2, z: 7254.5, rot: -1.3963 };
const KIROV = { x: -4993.1, z: 5875.7, rot: -2.0178 };

const W = (f, u, v) => [f.x + Math.cos(f.rot) * u + Math.sin(f.rot) * v,
  f.z - Math.sin(f.rot) * u + Math.cos(f.rot) * v];

// One reusable shaft mesh: radial scallops read as the actual fluting, with a
// slight Doric taper. Both stations use fluted columns, not smooth cylinders.
function flutedShaft() {
  const seg = 48, pos = [], uv = [], idx = [];
  for (const [j, y] of [0, 1].entries()) for (let i = 0; i <= seg; i++) {
    const a = 2 * Math.PI * i / seg;
    const groove = .035 * (1 + Math.cos(a * 12));
    const r = (1 - .075 * j) * (1 - groove);
    pos.push(r * Math.cos(a), y, r * Math.sin(a));
    uv.push(i / seg, y);
  }
  for (let i = 0; i < seg; i++) {
    const a = i, b = i + seg + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const SHAFT = flutedShaft();

function doric(P, M, x, z, y0, y1, radius = .67) {
  P.cyl(M.column, [x, y0, z], [x, y0 + .21, z], radius * 1.14, radius * 1.12, 12);
  P.geo(M.column, SHAFT, x, y0 + .2, z, 0, 0, 0, radius, y1 - y0 - .72, radius);
  P.cyl(M.column, [x, y1 - .55, z], [x, y1 - .26, z], radius * .93, radius * 1.25, 12);
  P.box(M.column, x - radius * 1.36, x + radius * 1.36,
    y1 - .27, y1, z - radius * 1.36, z + radius * 1.36);
}

function archShape(w, y, h) { const s = new THREE.Shape(); archPath(s, 0, y, w, h); return s; }
function archTrim(w, y, h, t = .19) {
  const s = archShape(w, y, h), hole = new THREE.Path();
  archPath(hole, 0, y + t, w - 2 * t, h - t, true); s.holes.push(hole);
  return s;
}
function archedPanel(P, M, x, z, y, w, h, door = false) {
  P.push(x, 0, z);
  P.face(door ? M.door : M.window, archShape(w, y, h), .06);
  P.face(M.cream, archTrim(w + .34, y - .08, h + .06, .18), .09);
  if (door) {
    P.box(M.brass, -.032, .032, y + .08, y + h - .18, .13, .17);
    P.box(M.brass, -w / 2 + .16, w / 2 - .16, y + h * .59, y + h * .59 + .07, .12, .16);
    for (const s of [-1, 1]) P.cyl(M.brass, [s * .24, y + 1.1, .17], [s * .24, y + 1.1, .27], .045, .045, 6);
  } else {
    P.box(M.cream, -.05, .05, y + .08, y + h + w / 2 - .16, .11, .17);
    P.box(M.cream, -w / 2 + .12, w / 2 - .12, y + h * .58, y + h * .58 + .08, .11, .17);
  }
  P.pop();
}

function letterMat(ctx, text, key, bg, ink = '#353c3a') {
  const map = ctx.tex.draw(1024, 128, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = ink; g.font = 'bold 72px Georgia, serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 2, w - 36);
  }, { key });
  return ctx.mat.toon('#ffffff', { map, name: key });
}
function textPanel(P, mat, x0, x1, y0, y1, z) {
  P.quad(mat, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1],
    [[0, 0], [1, 0], [1, 1], [0, 1]]);
}
function metroLogo(ctx) {
  const map = ctx.tex.draw(256, 256, (g, w, h) => {
    g.fillStyle = '#f5f3ea'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#273d75'; g.lineWidth = 17; g.lineCap = 'round';
    g.beginPath(); g.moveTo(49, 182); g.bezierCurveTo(56, 87, 89, 58, 127, 153);
    g.bezierCurveTo(169, 58, 203, 87, 209, 182); g.stroke();
    g.beginPath(); g.moveTo(34, 186); g.lineTo(222, 186); g.stroke();
  }, { key: 'avtovo-metro-emblem' });
  return ctx.mat.toon('#ffffff', { map, name: 'avtovo-metro-emblem' });
}

function dome(P, M, x, z, base, radius, rise) {
  // Shallow sheet-metal dome with the seams visible above Avtovo's parapet.
  const profile = [new THREE.Vector2(radius, 0), new THREE.Vector2(radius * .97, .65),
    new THREE.Vector2(radius * .86, rise * .47), new THREE.Vector2(radius * .65, rise * .76),
    new THREE.Vector2(radius * .35, rise * .94), new THREE.Vector2(0, rise)];
  const g = new THREE.LatheGeometry(profile, 32);
  P.geo(M.metal, g, x, base, z); g.dispose();
  for (let k = 0; k < 16; k++) {
    const a = k * Math.PI / 8;
    for (let j = 0; j < profile.length - 1; j++) {
      const p = profile[j], q = profile[j + 1];
      P.cyl(M.seam,
        [x + (p.x + .035) * Math.cos(a), base + p.y + .045, z + (p.x + .035) * Math.sin(a)],
        [x + (q.x + .035) * Math.cos(a), base + q.y + .045, z + (q.x + .035) * Math.sin(a)],
        .035, .03, 4, false);
    }
  }
  P.cyl(M.seam, [x, base + rise, z], [x, base + rise + 1.2, z], .055, .035, 6);
}

function roofTrophy(P, M, x, z) {
  // Silhouette of the green bronze shield-and-laurel corner sculpture.
  P.box(M.green, x - .75, x + .75, 10.9, 11.18, z - .57, z + .57);
  P.cyl(M.green, [x, 11.1, z], [x, 12.35, z], .36, .21, 8);
  P.cyl(M.green, [x, 12.32, z], [x, 12.48, z], .55, .55, 8);
  for (const s of [-1, 1]) {
    P.cyl(M.green, [x + s * .12, 11.35, z], [x + s * .85, 12.35, z], .18, .07, 6);
    P.cyl(M.green, [x + s * .57, 11.8, z], [x + s * 1.06, 12.0, z], .1, .025, 5);
  }
}

function avtovo(ctx, shell, detail, M) {
  const f = AVTOVO;
  shell.push(f.x, 0, f.z, f.rot); detail.push(f.x, 0, f.z, f.rot);
  // The OSM footprint has a straight western portico, side wings and a
  // semicircular eastern termination. A small gap remains before Stachek.
  shell.box(M.stucco, -9.35, 9.35, 0, 8.5, -6.0, 7.45);
  shell.cyl(M.stucco, [0, 0, -5.25], [0, 9.2, -5.25], 8.5, 8.5, 24);
  shell.box(M.cream, -9.7, 9.7, 8.25, 8.75, -6.3, 7.55);
  shell.box(M.metal, -9.55, 9.55, 8.75, 8.86, -6.15, 7.45);
  for (const s of [-1, 1]) {
    shell.box(M.stucco, s < 0 ? -13.8 : 9.35, s < 0 ? -9.35 : 13.8, 0, 8.15, -6.7, 8.7);
    shell.box(M.cream, s < 0 ? -14.05 : 9.15, s < 0 ? -9.15 : 14.05, 8.0, 8.58, -6.9, 9.0);
    // Modest glazed shopfronts in the flanking wings, seen on street photos.
    detail.push(s * 11.5, 0, 8.78);
    detail.box(M.window, -1.45, 1.45, 1.25, 3.6, .02, .08);
    detail.box(M.cream, -1.6, 1.6, 3.55, 3.76, .07, .16);
    detail.box(M.cream, -.06, .06, 1.25, 3.56, .08, .17);
    detail.pop();
  }
  shell.box(M.granite, -10.2, 10.2, 0, 1.12, 7.3, 13.95);
  for (let i = 0; i < 4; i++) {
    const v0 = 13.95 + i * .84;
    shell.box(M.granite, -10.2, 10.2, 0, .88 - i * .22, v0, v0 + .84);
    detail.box(M.stairEdge, -10.2, 10.2, .88 - i * .22, .93 - i * .22, v0 + .77, v0 + .85);
  }
  // A real two-row, six-column portico rather than a flat repeated facade.
  for (const v of [8.55, 13.0]) for (const u of [-8.55, -5.13, -1.71, 1.71, 5.13, 8.55])
    doric(detail, M, u, v, 1.12, 8.72, .62);
  shell.box(M.stucco, -10.25, 10.25, 8.57, 10.5, 7.55, 13.65);
  // Visible from upper floors: the shallow sheet-metal portico roof behind
  // the ochre front cornice, rather than a bare cream rectangle.
  shell.quad(M.metal, [-10.3, 10.61, 13.68], [10.3, 10.61, 13.68],
    [9.55, 11.32, 7.34], [-9.55, 11.32, 7.34], [0, 1, 0]);
  for (const [y0, y1, outset] of [[8.52, 8.72, .3], [10.28, 10.48, .38], [10.48, 10.78, .52]])
    shell.box(M.cream, -10.25 - outset, 10.25 + outset, y0, y1, 7.3, 13.9 + outset);
  // Low parapet screens the drum; the silver dome remains prominent above it.
  shell.box(M.stucco, -10.7, 10.7, 10.77, 11.55, 13.6, 14.02);
  // The Metro's own 2020 report shows the elevated view: a shallow metal
  // apron, a round upper gallery of windows and slender columns, then the dome.
  for (const side of [-1, 1]) {
    shell.quad(M.metal, [side * 14.05, 8.61, -6.9], [side * 14.05, 8.61, 8.9],
      [side * 8.2, 10.55, 6.5], [side * 8.2, 10.55, -5.9], [side, 1, 0]);
  }
  shell.quad(M.metal, [-13.9, 8.61, -7.0], [13.9, 8.61, -7.0],
    [8.2, 10.55, -5.9], [-8.2, 10.55, -5.9], [0, 1, -1]);
  shell.cyl(M.stucco, [0, 9.15, -5.25], [0, 12.15, -5.25], 7.75, 7.75, 32);
  shell.cyl(M.cream, [0, 12.1, -5.25], [0, 12.42, -5.25], 7.98, 7.98, 32);
  shell.cyl(M.stucco, [0, 12.35, -5.25], [0, 16.35, -5.25], 7.03, 7.03, 32);
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8, ac = a + Math.PI / 16;
    const nx = Math.cos(ac), nz = Math.sin(ac), tx = -nz, tz = nx;
    detail.quad(M.window,
      [7.09 * nx - 1.12 * tx, 12.75, -5.25 + 7.09 * nz - 1.12 * tz],
      [7.09 * nx + 1.12 * tx, 12.75, -5.25 + 7.09 * nz + 1.12 * tz],
      [7.09 * nx + 1.12 * tx, 15.98, -5.25 + 7.09 * nz + 1.12 * tz],
      [7.09 * nx - 1.12 * tx, 15.98, -5.25 + 7.09 * nz - 1.12 * tz], [nx, 0, nz]);
    detail.cyl(M.cream, [7.13 * nx, 12.74, -5.25 + 7.13 * nz],
      [7.13 * nx, 15.99, -5.25 + 7.13 * nz], .045, .045, 5);
    detail.cyl(M.column, [7.66 * Math.cos(a), 12.42, -5.25 + 7.66 * Math.sin(a)],
      [7.66 * Math.cos(a), 16.35, -5.25 + 7.66 * Math.sin(a)], .31, .28, 10);
    detail.cyl(M.cream, [7.66 * Math.cos(a), 16.25, -5.25 + 7.66 * Math.sin(a)],
      [7.66 * Math.cos(a), 16.47, -5.25 + 7.66 * Math.sin(a)], .4, .4, 10);
  }
  shell.cyl(M.cream, [0, 16.31, -5.25], [0, 16.72, -5.25], 7.96, 7.96, 32);
  dome(shell, M, 0, -5.25, 16.7, 7.9, 4.3);
  // Five dark arched door/window bays under the portico.
  for (const u of [-6.84, -3.42, 0, 3.42, 6.84])
    archedPanel(detail, M, u, 7.52, 1.12, 2.45, 3.75, Math.abs(u) < 5);
  for (const u of [-8.55, -5.13, -1.71, 1.71, 5.13, 8.55]) {
    detail.cyl(M.cream, [u, 9.73, 14.01], [u, 9.73, 14.14], .36, .36, 12);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      detail.cyl(M.shadow, [u + .14 * Math.cos(a), 9.73 + .14 * Math.sin(a), 14.15],
        [u + .28 * Math.cos(a), 9.73 + .28 * Math.sin(a), 14.15], .025, .025, 4, false);
    }
  }
  textPanel(detail, letterMat(ctx, 'АВТОВО', 'avtovo-fascia', '#d4b876'), -2.2, 2.2, 9.35, 10.08, 14.18);
  const logo = metroLogo(ctx);
  textPanel(detail, logo, -.45, .45, 11.65, 12.55, 14.08);
  roofTrophy(detail, M, -10.4, 13.7); roofTrophy(detail, M, 10.4, 13.7);
  shell.pop(); detail.pop();
  // Keep the covered portico and the four visible exterior steps walkable.
  let p = W(f, 0, 10.65); ctx.physics.addWalkBox(p[0], p[1], 20.35, 6.7, f.rot, 1.12, 0);
  p = W(f, 0, 15.63); ctx.physics.addStairs(p[0], p[1], 20.35, 3.36, f.rot + Math.PI, 0, .88, 4);
  p = W(f, 0, -.4); ctx.physics.addBox(p[0], p[1], 18.7, 13.9, f.rot, 0, 8.7);
  p = W(f, 0, -5.25); ctx.physics.addBox(p[0], p[1], 16.5, 16.5, f.rot, 0, 9.2);
  for (const s of [-1, 1]) { p = W(f, s * 11.6, 1.0); ctx.physics.addBox(p[0], p[1], 4.3, 15.2, f.rot, 0, 8.2); }
  for (const v of [8.55, 13.0]) for (const u of [-8.55, -5.13, -1.71, 1.71, 5.13, 8.55]) {
    p = W(f, u, v); ctx.physics.addBox(p[0], p[1], 1.22, 1.22, f.rot, 1.12, 8.72);
  }
}

function kirov(ctx, shell, detail, M) {
  const f = KIROV;
  shell.push(f.x, 0, f.z, f.rot); detail.push(f.x, 0, f.z, f.rot);
  // The 40 x 42 m OSM quadrilateral resolves into a 44-column Doric
  // peripter: twelve on each side, with the four corners counted once.
  shell.box(M.granite, -20.15, 20.15, 0, 1.02, -21.1, 21.1);
  shell.box(M.stucco, -15.8, 15.8, 1.02, 8.45, -16.75, 16.75);
  for (const y of [1.02, 7.95]) shell.box(M.cream, -16.0, 16.0, y, y + .35, -16.95, 16.95);
  // Recessed doors correspond to the two mapped entrance nodes on the NW wall.
  for (const u of [-13.3, 11.5]) archedPanel(detail, M, u, 16.82, 1.08, 2.5, 3.45, true);
  for (const u of [-8.5, -4.6, 4.6, 8.5]) archedPanel(detail, M, u, 16.82, 1.15, 2.3, 3.55);
  detail.face(M.shadow, archShape(3.5, 1.02, 3.8), 16.82);
  detail.face(M.cream, archTrim(3.92, .95, 3.9, .21), 16.91);
  for (const side of [-1, 1]) {
    // Dark arched window rhythm in the deep shaded colonnades.
    detail.push(0, 0, side * 16.83, side < 0 ? Math.PI : 0);
    for (const u of [-12, -8, -4, 0, 4, 8, 12]) if (side < 0 || Math.abs(u) < 1)
      archedPanel(detail, M, u, 0, 1.15, 2.35, 3.45);
    detail.pop();
    detail.push(side * 15.88, 0, 0, side < 0 ? -Math.PI / 2 : Math.PI / 2);
    for (const u of [-13, -9, -5, -1, 3, 7, 11]) archedPanel(detail, M, u, 0, 1.15, 2.4, 3.45);
    detail.pop();
  }
  // A 12-position perimeter grid gives 44 unique columns.
  for (let i = 0; i < 12; i++) {
    const u = -19.28 + i * (38.56 / 11);
    for (const v of [-20.18, 20.18]) doric(detail, M, u, v, 1.02, 8.62, .67);
  }
  for (let i = 1; i < 11; i++) {
    const v = -20.18 + i * (40.36 / 11);
    for (const u of [-19.28, 19.28]) doric(detail, M, u, v, 1.02, 8.62, .67);
  }
  shell.box(M.stucco, -20.3, 20.3, 8.47, 9.6, -21.25, 21.25);
  for (const [y0, y1, extra] of [[8.43, 8.62, .23], [9.58, 9.8, .34], [9.8, 10.08, .55], [10.08, 10.22, .65]])
    shell.box(M.cream, -20.3 - extra, 20.3 + extra, y0, y1, -21.25 - extra, 21.25 + extra);
  shell.box(M.roof, -20.7, 20.7, 10.22, 10.46, -21.65, 21.65);
  // Small dentils and relief blocks break up the long classical frieze.
  for (let i = -19; i <= 19; i += 1.75) for (const s of [-1, 1])
    detail.box(M.cream, i - .27, i + .27, 9.53, 9.77, s < 0 ? -21.72 : 21.62, s < 0 ? -21.62 : 21.72);
  for (const u of [-19, -16.5, 16.5, 19])
    detail.box(M.relief, u - .28, u + .28, 9.02, 9.42, 21.79, 21.84);
  textPanel(detail, letterMat(ctx, 'ЛЕНИНГРАДСКИЙ МЕТРОПОЛИТЕН',
    'kirov-metro-historic-fascia', '#d4b876'), -10.6, 10.6, 8.91, 9.52, 21.83);
  // Current exterior: the returned bust sits beneath the historic inscription.
  // OSM does not map its exact niche; position is approximate within the
  // documented central facade bay.
  detail.box(M.redGranite, -.72, .72, 1.02, 2.65, 17.35, 18.45);
  detail.box(M.redGranite, -.9, .9, 2.48, 2.68, 17.18, 18.62);
  detail.cyl(M.bronze, [0, 2.69, 17.93], [0, 3.22, 17.93], .44, .29, 10);
  const bustRound = new THREE.SphereGeometry(1, 12, 8);
  detail.geo(M.bronze, bustRound, 0, 3.12, 17.93, 0, 0, 0, .59, .22, .34); // shoulders
  detail.cyl(M.bronze, [0, 3.16, 17.93], [0, 3.38, 17.93], .14, .14, 8);
  detail.geo(M.bronze, bustRound, 0, 3.65, 17.93, 0, 0, 0, .26, .34, .24); // head
  detail.geo(M.bronze, bustRound, 0, 3.60, 18.18, 0, 0, 0, .085, .085, .10); // profile
  bustRound.dispose();
  // Broad granite steps approach the two mapped door positions.
  for (let i = 0; i < 4; i++) {
    const v0 = 21.1 + i * .78;
    shell.box(M.granite, -18.3, 18.3, 0, .80 - i * .20, v0, v0 + .78);
    detail.box(M.stairEdge, -18.3, 18.3, .80 - i * .20, .85 - i * .20, v0 + .71, v0 + .79);
  }
  shell.pop(); detail.pop();
  let p = W(f, 0, 22.66); ctx.physics.addStairs(p[0], p[1], 36.6, 3.12, f.rot + Math.PI, 0, .8, 4);
  // Walkable stylobate ring under the colonnade, with a solid central hall.
  for (const v of [-18.56, 18.56]) { p = W(f, 0, v); ctx.physics.addWalkBox(p[0], p[1], 40.0, 5.0, f.rot, 1.02, 0); }
  for (const u of [-17.85, 17.85]) { p = W(f, u, 0); ctx.physics.addWalkBox(p[0], p[1], 4.6, 33.6, f.rot, 1.02, 0); }
  p = W(f, 0, 0); ctx.physics.addBox(p[0], p[1], 31.6, 33.5, f.rot, 1.02, 8.45);
  for (let i = 0; i < 12; i++) {
    const u = -19.28 + i * (38.56 / 11);
    for (const v of [-20.18, 20.18]) { p = W(f, u, v); ctx.physics.addBox(p[0], p[1], 1.3, 1.3, f.rot, 1.02, 8.62); }
  }
  for (let i = 1; i < 11; i++) {
    const v = -20.18 + i * (40.36 / 11);
    for (const u of [-19.28, 19.28]) { p = W(f, u, v); ctx.physics.addBox(p[0], p[1], 1.3, 1.3, f.rot, 1.02, 8.62); }
  }
  p = W(f, 0, 17.93); ctx.physics.addBox(p[0], p[1], 1.7, 1.5, f.rot, 1.02, 2.68);
}

export function build(ctx) {
  const M = {
    stucco: ctx.mat.toon('#d4b77d', { paint: .025 }),
    column: ctx.mat.toon('#dfc48a', { paint: .025 }),
    cream: ctx.mat.toon('#e2c991', { paint: .02 }),
    granite: ctx.mat.toon('#8d8b88', { paint: .02 }),
    stairEdge: ctx.mat.toon('#bab8b4', { paint: .01 }),
    roof: ctx.mat.toon('#a7a69c', { paint: .02 }),
    metal: ctx.mat.toon('#a7b2b6', { paint: .015 }),
    seam: ctx.mat.toon('#697b81', { paint: .01 }),
    green: ctx.mat.toon('#3e6047', { paint: .02 }),
    door: ctx.mat.toon('#28393b', { paint: .01 }),
    window: ctx.mat.toon('#34464a', { paint: .01 }),
    brass: ctx.mat.toon('#a17d45', { paint: .01 }),
    shadow: ctx.mat.toon('#866c42', { paint: .01 }),
    relief: ctx.mat.toon('#b4945c', { paint: .015 }),
    redGranite: ctx.mat.toon('#6c4144', { paint: .02 }),
    bronze: ctx.mat.toon('#685b41', { paint: .015 }),
  };
  const root = new THREE.Group(); root.name = 'landmarksAvtovoMetro';
  const avShell = new Parts(), avDetail = new Parts(), kiShell = new Parts(), kiDetail = new Parts();
  avtovo(ctx, avShell, avDetail, M); kirov(ctx, kiShell, kiDetail, M);
  let meshCount = 0;
  for (const [P, name, range] of [
    [avShell, 'avtovo-shell', 1350], [avDetail, 'avtovo-detail', 430],
    [kiShell, 'kirov-metro-shell', 1350], [kiDetail, 'kirov-metro-detail', 430],
  ]) for (const mesh of P.build(root, { name })) { registerLOD(mesh, range); meshCount++; }
  ctx.addStatic(root);
  const avPhoto = W(AVTOVO, 0, 29), kiPhoto = W(KIROV, 0, 37);
  const svc = {
    monuments: [
      { id: 'r6440025', name: 'Автово — наземный вестибюль', x: AVTOVO.x, z: AVTOVO.z, h: 22.2 },
      { id: 'w47636754', name: 'Кировский завод — наземный вестибюль', x: KIROV.x, z: KIROV.z, h: 10.5 },
    ],
    photoSpots: [
      { name: 'Станция метро «Автово»', x: avPhoto[0], z: avPhoto[1], yaw: 280, pitch: 12 },
      { name: 'Станция метро «Кировский завод»', x: kiPhoto[0], z: kiPhoto[1], yaw: 244, pitch: 7 },
    ],
    houses: [], entrances: [], triangles: avShell.tris + avDetail.tris + kiShell.tris + kiDetail.tris,
    meshes: meshCount, columns: { avtovoPortico: 12, avtovoDrum: 16, kirov: 44 },
  };
  ctx.services.landmarksAvtovoMetro = svc;
  const shared = (ctx.services.landmarks ||= {});
  shared.monuments = (shared.monuments || []).concat(svc.monuments);
  shared.photoSpots = (shared.photoSpots || []).concat(svc.photoSpots);
}
