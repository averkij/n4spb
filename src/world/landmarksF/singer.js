// landmarksF/singer.js - Singer House (Dom Knigi, Nevsky 28, Pavel Suzor 1902-04, OSM w102305449): Art Nouveau steel-frame house, 6 storeys under the 23.4 m limit + a mansard, dark red-brown granite
// ground floor with a 5-arch arcade, grey granite floors 2-6 with arched windows, gilded spandrel bands, green bronze valkyries flanking the tall central arch, the gold plate "Компанiя Зингеръ", and the
// glazed ribbed tower at the Nevsky / canal corner with a bronze figure holding a glass globe (37 m) and the eagle.  Photos refs/kazan 56-63; docs/research/kazan-cathedral.md 6.3.
import * as THREE from 'three';
import * as L from '../layout.js';
import { ringEdges, onEdge, localOnEdge, archPath, rectPath } from './kit.js';
import { addPolyColliders } from '../lib/massing.js';

const ID = 'w102305449';
const Y_CORN = 23.4, Y_MAN = 28.4, Y_G = 5.6;       // cornice, mansard ridge, top of the ground floor

export function build(K) {
  const P = K.P, ctx = K.ctx, T = ctx.mat.toon;
  const b = L.buildingById(ID); if (!b) throw new Error('Singer House record missing');
  const poly = b.polys[0], edges = ringEdges(poly);
  const S = {
    gray: T('#7c7b82', { name: 'sg-gray', paint: 0.05, map: ctx.tex.draw(256, 256, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(40,38,44,0.45)'; for (let i = 0; i < 4; i++) g.fillRect(0, i * 64, w, 3); for (let i = 0; i < 4; i++) { const o = (i % 2) * 64; for (let k = 0; k < 3; k++) g.fillRect(o + k * 128 % 256, i * 64, 2, 64); } const r = ctx.rng(7); for (let i = 0; i < 180; i++) { g.fillStyle = `rgba(30,28,34,${0.04 + r() * 0.06})`; g.fillRect(r() * w, r() * h, 2 + r() * 8, 1 + r() * 2); } }, { key: 'sg-gray-tex' }) }), grayLight: T('#9a999f', { name: 'sg-grayL' }), red: T('#5a4549', { name: 'sg-red', paint: 0.05 }), redDark: T('#4a3a3e', { name: 'sg-redD' }),
    gold: T('#d9b04a', { name: 'sg-gold', emissive: '#5a4208', emissiveIntensity: 0.35 }), bronze: T('#6f5a38', { name: 'sg-bronze' }), green: T('#5e9576', { name: 'sg-green', paint: 0.04 }), greenDark: T('#3d6f5c', { name: 'sg-greenD' }),
    roof: T('#4a4e54', { name: 'sg-roof' }), win: T('#3f5670', { name: 'sg-win' }), winDark: T('#2d3c4c', { name: 'sg-winD' }), shop: T('#7c6450', { name: 'sg-shop', emissive: '#3a2810', emissiveIntensity: 0.3 }),
    chim: T('#7a5a4c', { name: 'sg-chim' }), trim: T('#b4b0a8', { name: 'sg-trim' }), globe: T('#b8c8cc', { name: 'sg-globe', transparent: true, opacity: 0.8 }), plain: T('#bfae8c', { name: 'sg-plain' }),
    sign: T('#ffffff', { name: 'sg-sign', map: ctx.tex.draw(512, 64, (g, w, h) => { g.fillStyle = '#d9b04a'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a2a10'; g.textAlign = 'center'; g.textBaseline = 'middle'; ctx.tex.fitText(g, 'Компанiя Зингеръ', w / 2, h / 2 + 2, w * 0.9, h * 0.62, ctx.tex.FONTS.serif, 700); }, { key: 'sg-sign' }) }),
  };
  const nev = edges.find((e) => e.i === 9), canal = edges.find((e) => e.i === 5);
  // Owner's Nevsky/canal photograph (2026-11): warm oak window frames,
  // restrained patinated bronze and continuous ornament below the glazing.
  S.oak=T('#b58a4c',{name:'sg-oak'});
  S.green=T('#72866a',{name:'sg-patina',paint:.025});
  S.greenDark=T('#435b4b',{name:'sg-patina-shadow'});
  S.shop=T('#34434a',{name:'sg-shop-glazing',emissive:'#4d3922',emissiveIntensity:.18});

  // ---- roof: mansard (sloped faces inset 3.4 m) + flat top
  const ring = []; for (let i = 0; i < poly.o.length; i += 2) ring.push([poly.o[i], poly.o[i + 1]]);
  const area = ring.reduce((a, p, i) => { const q = ring[(i + 1) % ring.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
  const inner = ring.map((p, i) => {
    const a = ring[(i + ring.length - 1) % ring.length], c = ring[(i + 1) % ring.length];
    const n1 = norm(p[0] - a[0], p[1] - a[1], area), n2 = norm(c[0] - p[0], c[1] - p[1], area);
    let bx = n1[0] + n2[0], bz = n1[1] + n2[1]; const bl = Math.hypot(bx, bz) || 1; bx /= bl; bz /= bl;
    const k = Math.min(2.6, 3.4 / Math.max(0.35, bx * n1[0] + bz * n1[1]));
    return [p[0] - bx * k, p[1] - bz * k];
  });
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length, n = norm(ring[j][0] - ring[i][0], ring[j][1] - ring[i][1], area);
    P.quad(S.roof, [ring[i][0], Y_CORN + 0.45, ring[i][1]], [ring[j][0], Y_CORN + 0.45, ring[j][1]], [inner[j][0], Y_MAN, inner[j][1]], [inner[i][0], Y_MAN, inner[i][1]], [n[0], 0.9, n[1]]);
  }
  P.cap(S.roof, inner, Y_MAN, true, 6);
  P.cap(S.trim, ring, Y_CORN + 0.45, true, 6, [inner]);                               // the cornice ledge (visible only as a thin ring)

  // ---- walls
  for (const e of edges) onEdge(P, e, (len) => {
    if (e === nev) nevskyFront(K, S, len);
    else if (e === canal) canalFront(K, S, len);
    else if (e.len < 2.5 && e.i >= 6 && e.i <= 8) cornerWall(P, S, len);
    else plainWall(P, S, len);
  });
  // ---- tower at the corner
  const f = localOnEdge(nev, -1413.8, -357.5);
  K.tower = { u: f.u, d: f.d };
  onEdge(P, nev, () => tower(K, S, f.u, -f.d));
  // chimneys on the party wall
  P.box(S.chim, -1439.2, -1438.2, Y_CORN, Y_MAN + 2.2, -361.6, -360.4, 'b');
  for (const z of [-366, -372, -379]) P.box(S.chim, -1437.6 + (z + 366) * 0.08, -1436.9 + (z + 366) * 0.08, Y_MAN - 0.3, Y_MAN + 2.0, z, z + 0.8, 'b');

  // ---- colliders, entrances, photo spots
  addPolyColliders(ctx, poly, 0, 40, 0.9);
  const m = (e, u) => { const o = ringOrigin(e); return { x: o.x + o.ux * u + e.n[0] * 0.6, z: o.z + o.uz * u + e.n[1] * 0.6 }; };
  const door = m(nev, nev.len / 2 - 0.0), rot = Math.atan2(nev.n[0], nev.n[1]);
  K.svc.entrances.push({ x: door.x, z: door.z, rotY: rot, bldg: ID });
  K.svc.monuments.push({ id: ID, name: 'Дом Зингера', x: -1422, z: -379, h: 37 });
  K.svc.photoSpots.push({ x: -1448, z: -300, yaw: L.yawToward(-1448, -300, -1422, -370), pitch: 16, name: 'Дом Зингера (Дом книги)' });
}

const norm = (dx, dz, area) => { const l = Math.hypot(dx, dz) || 1; let nx = dz / l, nz = -dx / l; if (area > 0 !== true) { nx = -nx; nz = -nz; } return [nx, nz]; };
function ringOrigin(e) { const dx = e.b[0] - e.a[0], dz = e.b[1] - e.a[1], l = Math.hypot(dx, dz); const xa = [e.n[1], -e.n[0]]; const fwd = dx * xa[0] + dz * xa[1] > 0; const o = fwd ? e.a : e.b; return { x: o[0], z: o[1], ux: xa[0], uz: xa[1] }; }

function cornerWall(P, S, len) {
  P.quad(S.red, [0, 0, 0], [len, 0, 0], [len, Y_G + 0.9, 0], [0, Y_G + 0.9, 0], [0, 0, 1]);
  P.quad(S.gray, [0, Y_G + 0.9, 0], [len, Y_G + 0.9, 0], [len, Y_CORN, 0], [0, Y_CORN, 0], [0, 0, 1]);
}
function plainWall(P, S, len) {
  P.quad(S.plain, [0, 0, 0], [len, 0, 0], [len, Y_CORN, 0], [0, Y_CORN, 0], [0, 0, 1]);
}

/** wall with holes (rect / arch) through a THREE.Shape */
function wallHoles(P, mat, x0, x1, y0, y1, holes) {
  const s = new THREE.Shape(); rectPath(s, x0, y0, x1, y1, false);
  for (const h of holes) { const p = new THREE.Path(); if (h.arch) archPath(p, h.x, h.y, h.w, Math.max(0.05, h.h - h.w / 2), true); else rectPath(p, h.x - h.w / 2, h.y, h.x + h.w / 2, h.y + h.h, true); s.holes.push(p); }
  P.face(mat, s, 0, 2.4, 8);
}
/** a window opening (glass 12 cm behind the wall plane is avoided: the glass is 6 cm IN FRONT of a recessed dark panel) */
function glass(P, S, x, y, w, h, arch, mat) {
  const m = mat || S.win;
  if (arch) {
    const hs = Math.max(0.05, h - w / 2), s = new THREE.Shape(); archPath(s, x, y, w, hs, false);
    P.face(m, s, -0.25, 1, 8);
  } else P.quad(m, [x - w / 2, y, -0.25], [x + w / 2, y, -0.25], [x + w / 2, y + h, -0.25], [x - w / 2, y + h, -0.25], [0, 0, 1]);
  // a mullion and two transoms
  P.box(S.oak, x - 0.045, x + 0.045, y, y + h - (arch ? w / 2 : 0), -0.24, -.16, 'kb');
  const hh = h - (arch ? w / 2 : 0);
  for (const k of [0.33, 0.66]) P.box(S.oak, x - w / 2, x + w / 2, y + hh * k - 0.035, y + hh * k + 0.035, -0.24, -.16, 'kb');
  for(const sg of[-1,1])P.box(S.oak,x+sg*w/2-.055,x+sg*w/2+.055,y,y+hh,-.24,-.13,'kb');
  if(arch)archRim(P,S.oak,x,y,w,h,.065,-.16);
}

// Raised arch voussoirs and iron scrollwork read at walking distance without
// a separate material/mesh for each carved piece.
function archRim(P,mat,x,y,w,h,r=.12,z=.12){
 const spring=y+h-w/2;
 for(const sg of[-1,1])P.cyl(mat,[x+sg*w/2,y,z],[x+sg*w/2,spring,z],r,r,5,false);
 let prev=[x+w/2,spring,z];
 for(let i=1;i<=16;i++){const a=i*Math.PI/16,p=[x+Math.cos(a)*w/2,spring+Math.sin(a)*w/2,z];P.cyl(mat,prev,p,r,r,5,false);prev=p;}
}
function scrollBand(P,S,x,y,w,z=.16){
 P.box(S.greenDark,x-w/2,x+w/2,y,y+.42,z-.04,z+.02,'kb');
 for(let i=0;i<Math.max(2,Math.round(w/.6));i++){
  const u=x-w/2+.3+i*.6;
  P.geo(S.bronze,new THREE.TorusGeometry(.16,.026,4,10,Math.PI*1.8),u,y+.21,z+.045,0,0,i%2?Math.PI:0);
  P.cyl(S.gold,[u-.16,y+.12,z+.06],[u+.17,y+.31,z+.06],.018,.018,4,false);
 }
}
function balcony(P, S, x, y, w, d = 0.55) {
  P.box(S.bronze, x - w / 2 - 0.1, x + w / 2 + 0.1, y - 0.18, y, 0, d, 'k');
  P.box(S.bronze, x - w / 2 - 0.1, x + w / 2 + 0.1, y + 0.85, y + 0.9, d - 0.05, d, 'kb');
  for (let i = 0; i <= Math.round(w / 0.2); i++) { const xx = x - w / 2 + i * 0.2; P.box(S.bronze, xx - 0.012, xx + 0.012, y, y + 0.85, d - 0.04, d - 0.02, 'kb'); }
}

function rows(K, S, x0, x1, bays, o) {
  const P = K.P, pitch = (x1 - x0) / bays;
  const xs = Array.from({ length: bays }, (_, i) => x0 + pitch * (i + 0.5));
  return { xs, pitch };
}

function nevskyFront(K, S, len) {
  const P = K.P, tx = K.tower ? K.tower.u : len - 3.3;
  // ground floor: red granite with 5 arches; upper floors grey; the whole wall as shapes with holes
  const ax = [3.6, 8.7, 13.8, 18.9, 24.0];                                         // arch centres (on a 27.5 m front, the corner bay at 27.5-31 is in the tower)
  const scale = len / 28.8, aw = 3.3;
  const cx = ax.map((x) => x * scale);
  // wall holes: ground arches + upper windows
  const holes = [];
  for (const x of cx) holes.push({ x, y: 0.0, w: aw, h: 5.0, arch: true });
  const fl = [[6.9, 3.4], [10.3, 3.4], [13.7, 3.4]];                                   // floors 2-4: (sill y, height)
  const bayX = [3.6, 8.7, 18.9, 24.0].map((x) => x * scale);                           // four arched bays; the centre bay is the tall arch
  for (const x of bayX) for (const [y, h] of fl) holes.push({ x, y, w: 3.0, h: y === 13.7 ? h : h - 0.5, arch: y === 13.7 });
  holes.push({ x: cx[2], y: 7.4, w: 3.7, h: 9.4, arch: true });                        // tall central arch (floors 2-4)
  const top = [17.2, 20.4];
  for (const x of [1.8, 5.4, 9.0, 12.6, 16.2, 19.8, 23.4, 27.0].map((x) => x * scale)) for (const y of top) if (Math.abs(x - cx[2]) > 2.6) holes.push({ x, y, w: 1.9, h: 2.2, arch: false });
  const wallStr = [[0, Y_G, S.red], [Y_G + 0.9, Y_CORN, S.gray]];
  // lower band (ground floor) with arch holes; the plate band; upper wall with window holes
  const g0 = holes.filter((h) => h.y < Y_G).map((h) => ({ ...h }));
  wallHoles(P, S.red, 0, len, 0, Y_G, g0);
  P.box(S.redDark, 0, len, Y_G, Y_G + 0.9, -0.0, 0.25, 'kb'); P.quad(S.sign, [cx[2] - 3.4, Y_G + 0.12, 0.27], [cx[2] + 3.4, Y_G + 0.12, 0.27], [cx[2] + 3.4, Y_G + 0.78, 0.27], [cx[2] - 3.4, Y_G + 0.78, 0.27], [0, 0, 1]);
  const up = holes.filter((h) => h.y >= Y_G + 0.9).map((h) => ({ ...h }));
  P.push(0, 0, 0, 0);
  wallHoles(P, S.gray, 0, len, Y_G + 0.9, Y_CORN, up);
  P.pop();
  // glazing + frames
  for (const h of g0) { shopGlass(P, S, h.x, h.y, h.w, h.h); }
  for (const h of up) {
    if (h.arch) { glass(P, S, h.x, h.y, h.w, h.h, true); archRim(P,S.trim,h.x,h.y,h.w+.24,h.h+.12,.12,.09); continue; }
    glass(P, S, h.x, h.y, h.w, h.h, false);
    if (h.h > 3) { P.box(S.gold, h.x - h.w / 2 - 0.05, h.x + h.w / 2 + 0.05, h.y - 0.28, h.y - 0.1, 0, 0.14, 'kb'); }
    if (h.w > 2.9 && h.y < 14.5) balcony(P, S, h.x, h.y - 0.05, h.w);
    if(h.y<17)scrollBand(P,S,h.x,h.y-.58,h.w);
  }
  // door in the middle arch: bronze doors with a golden case
  P.box(S.gold, cx[2] - 1.9, cx[2] - 1.7, 0.0, 5.0, 0, 0.35, 'kb'); P.box(S.gold, cx[2] + 1.7, cx[2] + 1.9, 0.0, 5.0, 0, 0.35, 'kb');
  // gold lamp standards beside the middle door
  for (const sg of [-1, 1]) { P.cyl(S.gold, [cx[2] + sg * 2.4, 0.4, 0.5], [cx[2] + sg * 2.4, 3.6, 0.5], 0.12, 0.08, 6, false); P.cyl(S.globe, [cx[2] + sg * 2.4, 3.6, 0.5], [cx[2] + sg * 2.4, 4.2, 0.5], 0.28, 0.28, 8, true); }
  // valkyries: two green bronze figures flanking the tall arch (4 m), wings
  for (const sg of [-1, 1]) valkyrie(P, S, cx[2] + sg * 2.5, 11.0, sg);
  // gilded bands under the rows of the central arch, the tall arch ring
  P.box(S.gold, cx[2] - 2.2, cx[2] + 2.2, 11.2, 11.38, -0.0, 0.16, 'kb'); P.box(S.gold, cx[2] - 2.2, cx[2] + 2.2, 14.2, 14.38, 0, 0.16, 'kb');
  // string course + cornice with a balustrade
  P.box(S.trim, -0.15, len + 0.15, Y_CORN - 0.5, Y_CORN + 0.45, 0, 0.55, '');
  for (let x = 0.3; x < len; x += 0.5) P.box(S.trim, x - 0.07, x + 0.07, Y_CORN + 0.45, Y_CORN + 1.25, 0.2, 0.34, 'kb');
  P.box(S.trim, -0.1, len + 0.1, Y_CORN + 1.25, Y_CORN + 1.4, 0.14, 0.4, 'kb');
  // dormers on the mansard
  for (const x of [3.0, 8.4, 14.0, 20.0].map((x) => x * scale)) dormer(P, S, x, Y_CORN + 0.45);
  // sculpted cartouche at the top of the tall arch
  P.box(S.green, cx[2] - 0.8, cx[2] + 0.8, 17.4, 18.6, 0, 0.3, 'kb');
}
/** shopfront filling an arch: a warm lit panel 40 cm behind the wall plane, dark sill band, bronze transoms, a dark ceiling slab so nothing is seen through */
function shopGlass(P, S, x, y, w, h) {
  const hs = Math.max(0.05, h - w / 2), s = new THREE.Shape(); archPath(s, x, y, w, hs, false);
  P.face(S.shop, s, -0.4, 1, 8);
  archRim(P,S.redDark,x,y,w+.26,h+.13,.18,.10);
  for(const side of[-1,1]){
    P.box(S.red,x+side*(w/2+.43)-.18,x+side*(w/2+.43)+.18,.15,h+.3,0,.34,'kb');
    for(const yy of[.8,2.2,3.6])P.geo(S.gold,new THREE.TorusGeometry(.16,.035,4,10),x+side*(w/2+.43),yy,.37);
  }
  P.box(S.winDark, x - w / 2 - 0.02, x + w / 2 + 0.02, y, y + 1.0, -0.45, -0.35, 'kb');
  P.box(S.bronze, x - 0.04, x + 0.04, y + 1.0, y + hs, -0.38, -0.32, 'kb');
  for (const k of [1.0, 2.9]) P.box(S.bronze, x - w / 2, x + w / 2, y + k, y + k + 0.07, -0.38, -0.32, 'kb');
  P.box(S.winDark, x - w / 2 - 0.3, x + w / 2 + 0.3, y, y + h + 0.1, -0.6, -0.45, 'fb');
}

function canalFront(K, S, len) {
  const P = K.P, bays = Math.round(len / 3.6), pitch = len / bays, holes = [];
  const xs = Array.from({ length: bays }, (_, i) => pitch * (i + 0.5));
  for (const x of xs) { holes.push({ x, y: 0.5, w: 2.4, h: 4.2, arch: true }); for (const y of [6.9, 10.3, 13.7]) holes.push({ x, y, w: 2.2, h: 2.9, arch: false }); for (const y of [17.2, 20.4]) holes.push({ x, y, w: 1.8, h: 2.1, arch: false }); }
  const g0 = holes.filter((h) => h.y < Y_G), up = holes.filter((h) => h.y >= Y_G);
  wallHoles(P, S.red, 0, len, 0, Y_G, g0);
  P.box(S.redDark, 0, len, Y_G, Y_G + 0.9, 0, 0.25, 'kb');
  wallHoles(P, S.gray, 0, len, Y_G + 0.9, Y_CORN, up);
  for (const h of g0) shopGlass(P,S,h.x,h.y,h.w,h.h);
  for (const h of up) { glass(P, S, h.x, h.y, h.w, h.h, false); if (h.h > 2.5) scrollBand(P,S,h.x,h.y-.6,h.w); }
  P.box(S.trim, -0.15, len + 0.15, Y_CORN - 0.5, Y_CORN + 0.45, 0, 0.55, '');
  for (let x = 0.3; x < len; x += 0.5) P.box(S.trim, x - 0.07, x + 0.07, Y_CORN + 0.45, Y_CORN + 1.25, 0.2, 0.34, 'kb');
  P.box(S.trim, -0.1, len + 0.1, Y_CORN + 1.25, Y_CORN + 1.4, 0.14, 0.4, 'kb');
  for (let i = 1; i < bays; i += 2) dormer(P, S, pitch * i, Y_CORN + 0.45);
}

function dormer(P, S, x, y) {
  P.box(S.roof, x - 0.9, x + 0.9, y, y + 2.6, -2.0, 0.1, 'b');
  const s = new THREE.Shape(); s.moveTo(x - 1.12, y + 2.4); s.absarc(x,y+2.4,1.12,Math.PI,0,true);s.lineTo(x-1.12,y+2.4);
  P.extrude(S.roof, s, -2.0, 2.1, 1, 2);
  P.quad(S.win, [x - 0.5, y + 0.5, 0.14], [x + 0.5, y + 0.5, 0.14], [x + 0.5, y + 2.2, 0.14], [x - 0.5, y + 2.2, 0.14], [0, 0, 1]);
  P.box(S.trim, x - 0.7, x - 0.5, y + 0.3, y + 2.4, 0.1, 0.22, 'kb'); P.box(S.trim, x + 0.5, x + 0.7, y + 0.3, y + 2.4, 0.1, 0.22, 'kb'); P.box(S.trim, x - 0.7, x + 0.7, y + 2.3, y + 2.55, 0.1, 0.26, 'kb');
  archRim(P,S.trim,x,y+2.0,2.15,1.55,.13,.22);
}

function valkyrie(P, S, x, y, sg) {
  P.push(x, y, 0.0, 0);
  P.cyl(S.green, [0, 0.0, 0.35], [0, 2.6, 0.45], 0.42, 0.3, 6, false);
  P.cyl(S.green, [0, 2.6, 0.45], [0, 3.5, 0.45], 0.28, 0.24, 6, true);
  P.cyl(S.green, [0, 3.5, 0.45], [0, 3.95, 0.45], 0.2, 0.2, 6, true);
  P.geo(S.green,new THREE.SphereGeometry(.25,8,6),0,3.8,.48);
  for(let i=0;i<6;i++)P.cyl(S.greenDark,[sg*.2,1.7,.3],[sg*(.6+i*.16),3.3+i*.16,.33],.09,.04,5,true);
  for(const s of[-1,1]){P.cyl(S.green,[s*.24,2.8,.42],[s*.55,3.3,.6],.12,.09,6);P.cyl(S.green,[s*.55,3.3,.6],[s*.65,3.95,.62],.09,.06,6);}
  P.pop();
}

function tower(K, S, u, d) {
  const P = K.P, y0 = 17.5, R = 3.6, cx = u, cz = d;      // the tower stands d metres inside the Nevsky wall (cz > 0 would be outward: here negative)
  const wz = -Math.abs(cz);
  // Continuous rounded oriel, with stacked oak-framed windows. The previous
  // solid upper cylinder and blank chamfer hid the defining corner glazing.
  P.cyl(S.gray,[cx,0,wz],[cx,Y_CORN+.6,wz],R,R,24,false);
  for(let i=0;i<24;i++){
    const a=i*Math.PI/12,r=R+.035,pitch=2*r*Math.tan(Math.PI/24);
    P.push(cx+Math.sin(a)*r,0,wz+Math.cos(a)*r,a);
    for(const [y,h]of[[.3,4.8],[6.85,2.9],[10.25,2.9],[13.65,3.0],[17.25,4.5]]){
      const w=pitch-.11;
      P.quad(S.win,[-w/2,y,.045],[w/2,y,.045],[w/2,y+h,.045],[-w/2,y+h,.045],[0,0,1]);
      for(const x of[-w/2,w/2])P.box(S.oak,x-.035,x+.035,y,y+h,.05,.14,'kb');
      for(const yy of[y,y+h*.62,y+h])P.box(S.oak,-w/2,w/2,yy-.04,yy+.04,.05,.14,'kb');
      if(y>5&&y<17)scrollBand(P,S,0,y-.57,pitch,.18);
    }
    P.pop();
  }
  for(const y of[5.5,6.5,10.0,13.4,17.0,22.6])P.cyl(S.bronze,[cx,y,wz],[cx,y+.14,wz],R+.18,R+.18,24,true);
  P.cyl(S.trim, [cx, Y_CORN + 0.6, wz], [cx, Y_CORN + 1.1, wz], R + 0.3, R + 0.3, 20, true);
  // green copper bell with scroll feet (photo 58 / 60: a flared bell, a glazed lantern in the middle, a narrow cap), then the glazed lantern with 12 ribs
  const yb = Y_CORN + 1.1, rg = R - 0.3, bellH = 1.2, lanH = 5.0;
  const bell = [[0, 0], [R + 0.25, 0], [R + 0.38, .25], [R + .1, .6], [R-.85,bellH]];
  P.geo(S.green, new THREE.LatheGeometry(bell.map((q) => new THREE.Vector2(q[0], q[1])), 20), cx, yb, wz);
  P.cyl(S.greenDark, [cx, yb + 0.9, wz], [cx, yb + 1.0, wz], R + 0.32, R + 0.32, 20, true);
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + 0.2; P.cyl(S.greenDark, [cx + Math.sin(a) * (R + 0.3), yb + 0.6, wz + Math.cos(a) * (R + 0.3)], [cx + Math.sin(a) * (R + 0.6), yb + 1.5, wz + Math.cos(a) * (R + 0.6)], 0.28, 0.12, 5, true); }
  const yl = yb + bellH, rl = R - 0.85;
  P.cyl(S.winDark, [cx, yl, wz], [cx, yl + lanH, wz], rl, rl * 0.86, 20, false);
  for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; let prev = null; for (let i = 0; i <= 8; i++) { const t = i / 8, r = rl * (1.0 - 0.14 * t) + 0.1, y = yl + lanH * t; const p = [cx + Math.sin(a) * r, y, wz + Math.cos(a) * r]; if (prev) P.cyl(S.green, prev, p, 0.1, 0.1, 4, false); prev = p; } }
  for (let i = 0; i < 3; i++) { const t = (i + 0.5) / 3, r = rl * (1.0 - 0.14 * t) + 0.12; P.cyl(S.green, [cx, yl + lanH * t, wz], [cx, yl + lanH * t + 0.14, wz], r + 0.08, r + 0.08, 20, true); }
  const yc = yl + lanH;
  P.geo(S.green, new THREE.LatheGeometry([[0, 0], [rl * 0.9, 0], [rl * 0.95, 0.35], [rl * 0.7, 1.0], [rl * 0.5, 1.8], [0.5, 2.4], [0, 2.6]].map((q) => new THREE.Vector2(q[0], q[1])), 20), cx, yc, wz);
  // the bronze figure on the cap holding the globe
  const yt = yc + 2.2;
  P.cyl(S.green, [cx, yt, wz], [cx, yt + 2.2, wz], 0.7, 0.35, 8, true);
  P.cyl(S.green, [cx, yt + 2.2, wz], [cx, yt + 3.0, wz], 0.35, 0.26, 8, true);
  P.geo(S.green, new THREE.SphereGeometry(0.28, 8, 6), cx, yt + 3.25, wz);
  P.cyl(S.green, [cx + 0.1, yt + 2.9, wz], [cx + 0.6, yt + 4.0, wz], 0.1, 0.1, 5, true);
  // the glass globe with a meridian skeleton and the gold band (a plain wordmark band, no text)
  const gy = yt + 4.9;
  P.geo(S.globe, new THREE.SphereGeometry(1.65, 16, 12), cx + 0.35, gy, wz);
  // True spherical meridians replace the former straight crossed rods.
  P.geo(S.gold,new THREE.CylinderGeometry(1.71,1.71,.43,32,1,true),cx+.35,gy,wz,.28,0,-.28);
  for(let k=0;k<6;k++)P.geo(S.trim,new THREE.TorusGeometry(1.68,.028,4,32),cx+.35,gy,wz,0,k*Math.PI/6,0);
  for(const lat of[-.82,.82])P.geo(S.trim,new THREE.TorusGeometry(Math.sqrt(1.68**2-lat**2),.025,4,28),cx+.35,gy+lat,wz,Math.PI/2,0,0);
  // the eagle (spread wings) at the right of the tower base
  P.push(cx, Y_CORN + 1.0, wz+R-.1, 0);
  P.geo(S.green,new THREE.SphereGeometry(1,10,7),0,1.1,.1,0,0,0,.48,.95,.4);
  P.geo(S.green,new THREE.SphereGeometry(.32,8,6),0,2.1,.2);
  for(const sg of[-1,1])for(let i=0;i<8;i++)P.cyl(S.greenDark,[sg*.32,1.25,.1],[sg*(.75+i*.19),1.55+i*.22,.08],.13,.045,5,true);
  for(let i=0;i<5;i++)P.cyl(S.green,[0,.6,.1],[(i-2)*.18,-.35,.2],.1,.045,5,true);
  P.pop();
}
