// landmarksA/interior.js - the walkable inside of the Moscow Railway Station (docs/research/station.md section 6; photos SP/refs/station 15-21, 45-50, 88):
//   vestibule (the 1850s entrance hall behind the three doors: plaster, marble piers, painted ceiling, chandelier)  ->  the main hall (grey stone floor, travertine
//   walls, faceted concrete ceiling with a clerestory, salmon far wall with the city arms, letters "САНКТ-ПЕТЕРБУРГ", the bronze bust of Peter I on a granite pillar)
//   ->  the long concourse (shops on both sides, departure boards from the sim clock, the metro door on the west side, glazed rear screen)  ->  the gates under the canopy.
// Everything is in the station frame (u along the facade, d into the building).  Floors are y = 0.03 above the ground plane.  One indoor lighting zone covers it all.
import * as THREE from 'three';
import { Parts, TH, W, UV, wbox, C, O } from './common.js';
import { rectPath } from './common.js';
import { archWinTex } from './tex.js';
import { HALL, CANOPY } from './halls.js';
import * as L from '../layout.js';

const FLOOR_Y = 0.03;
const CEIL = 12.3, VEST_CEIL = 7.6;
export const IN = { u0: -16.5, u1: 12.5, d0: 19.9, dFar: 60, d1: 142.7, vu0: -13, vu1: 11, vd0: 1.4 };

export function buildInterior(Cc) {
  const { ctx, M, T } = Cc;
  const rng = ctx.rng('station-interior');
  const P = new Parts();

  // ------------------------------------------------------------------ textures
  const floorTex = ctx.tex.draw(256, 256, (g, w, h) => {
    g.fillStyle = '#7e7a74'; g.fillRect(0, 0, w, h);
    const r = ctx.rng('floor'); const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const k = 0.93 + r() * 0.12; g.fillStyle = `rgb(${Math.round(126 * k)},${Math.round(122 * k)},${Math.round(116 * k)})`; g.fillRect(i * s + 1, j * s + 1, s - 2, s - 2); }
    g.strokeStyle = 'rgba(70,68,64,0.55)'; g.lineWidth = 2; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
  }, { key: 'st_floor', repeat: [1, 1] });
  const travTex = ctx.tex.draw(256, 256, (g, w, h) => {
    g.fillStyle = '#bfae90'; g.fillRect(0, 0, w, h);
    const r = ctx.rng('trav'); const cw = 64, ch = 32;
    for (let j = 0; j < h / ch; j++) for (let i = 0; i < w / cw; i++) { const k = 0.94 + r() * 0.1; g.fillStyle = `rgb(${Math.round(190 * k)},${Math.round(171 * k)},${Math.round(142 * k)})`; g.fillRect(i * cw + 1, j * ch + 1, cw - 2, ch - 2); }
    g.fillStyle = 'rgba(120,100,70,0.14)'; for (let i = 0; i < 160; i++) g.fillRect(r() * w, r() * h, 5 + r() * 14, 1);
  }, { key: 'st_trav', repeat: [1, 1] });
  const pyrTex = ctx.tex.draw(256, 256, (g, w, h) => {
    const n = 4, s = w / n, c = ['#d4d1ca', '#c0bdb6', '#a9a69f', '#bab7b0'];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = i * s, y = j * s, cx = x + s / 2, cy = y + s / 2;
      const tri = (a, b, c2, col) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c2[0], c2[1]); g.closePath(); g.fillStyle = col; g.fill(); };
      tri([x, y], [x + s, y], [cx, cy], c[0]); tri([x + s, y], [x + s, y + s], [cx, cy], c[2]); tri([x + s, y + s], [x, y + s], [cx, cy], c[1]); tri([x, y + s], [x, y], [cx, cy], c[3]);
    }
  }, { key: 'st_pyr', repeat: [1, 1] });
  const alumTex = ctx.tex.draw(256, 256, (g, w, h) => {
    g.fillStyle = '#e6e8ea'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c9cdd1'; for (let i = 0; i < 8; i++) g.fillRect(i * 32 + 14, 0, 4, h);
    g.fillStyle = '#fffbea'; g.fillRect(0, 118, w, 20);
  }, { key: 'st_alum', repeat: [1, 1] });
  const salmonTex = ctx.tex.draw(256, 256, (g, w, h) => {
    g.fillStyle = '#b8786a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(100,55,45,0.35)'; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
  }, { key: 'st_salmon', repeat: [1, 1] });
  const plafondTex = ctx.tex.draw(512, 256, (g, w, h) => {
    g.fillStyle = '#efe0b0'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c9a85a'; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28); g.lineWidth = 2; g.strokeRect(26, 26, w - 52, h - 52);
    const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 190); gr.addColorStop(0, '#9fd0c8'); gr.addColorStop(0.55, '#4e9da3'); gr.addColorStop(1, '#2f6c78');
    g.save(); g.beginPath(); g.ellipse(w / 2, h / 2, 190, 88, 0, 0, Math.PI * 2); g.fillStyle = gr; g.fill(); g.lineWidth = 5; g.strokeStyle = '#d7b45a'; g.stroke(); g.clip();
    g.fillStyle = 'rgba(255,255,255,0.8)'; for (const [x, y, r] of [[170, 105, 30], [200, 112, 26], [330, 150, 34], [360, 142, 24], [260, 90, 20]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#e2461f'; g.beginPath(); g.moveTo(120, 150); g.quadraticCurveTo(260, 40, 400, 150); g.lineTo(400, 170); g.quadraticCurveTo(260, 70, 120, 172); g.closePath(); g.fill();
    g.fillStyle = '#f2c230'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(150 + i * 55, 128 - Math.sin(i / 4 * Math.PI) * 34, 6, 0, Math.PI * 2); g.fill(); }
    g.restore();
  }, { key: 'st_plafond' });

  // ------------------------------------------------------------------ materials
  const plaster = T('#ece4cf'), marble = T('#d9c4b0'), marbleDark = T('#b99a86');
  const floorM = T('#ffffff', { map: floorTex, paint: 0.02 });
  const trav = T('#ffffff', { map: travTex, paint: 0.03 });
  const pyr = T('#ffffff', { map: pyrTex, paint: 0.02 });
  const alum = T('#ffffff', { map: alumTex, paint: 0.02, emissive: '#d8dce0', emissiveIntensity: 0.25 });
  const salmon = T('#ffffff', { map: salmonTex, paint: 0.02 });
  const plafond = T('#ffffff', { map: plafondTex, paint: 0.0 });
  const glowDay = ctx.mat.emissive('#d9ecff', 1.05);
  const warmGlow = ctx.mat.emissive('#ffe7b0', 1.0);
  const pinkLed = ctx.mat.emissive('#ff7c9a', 1.1);
  const wood = T(C.wood), woodDark = T(C.woodDark), metal = T(C.metal), gold = T(C.bronzeLight), bronze = T(C.bronze);
  const granitePillar = T('#7c7c7e');
  const yellow = T(C.yellowTape);
  const dark = T('#2b2d33');
  const glowL0 = () => ctx.mat.emissive('#fff4dc', 1.0);
  const ledScreen = ctx.mat.emissive('#2a6fd0', 0.9);

  // ------------------------------------------------------------------ floors (uv in tiles of 4.8 m)
  const S = 1 / 4.8;
  const floorQuad = (u0, u1, d0, d1, mat, y = FLOOR_Y) => P.quad(mat, [u0, y, d0], [u1, y, d0], [u1, y, d1], [u0, y, d1], [0, 1, 0], [[u0 * S, d0 * S], [u1 * S, d0 * S], [u1 * S, d1 * S], [u0 * S, d1 * S]]);
  floorQuad(IN.vu0, IN.vu1, 0.95, 19.9, floorM);            // vestibule (marble look: same slabs, lighter below)
  floorQuad(IN.u0, IN.u1, 19.9, IN.d1 + 0.6, floorM);
  // a yellow tactile guide line from the doors through the hall to the gates
  P.quad(yellow, [-1.1 + 0.1, FLOOR_Y + 0.012, 1.0], [-1.1, FLOOR_Y + 0.012, 1.0], [-1.1, FLOOR_Y + 0.012, 150], [-1.0, FLOOR_Y + 0.012, 150], [0, 1, 0]);

  // ------------------------------------------------------------------ vestibule: walls, piers, painted ceiling, chandelier, relief over the arch
  const vs = IN.vu0, ve = IN.vu1;
  // inner front wall with the three doors (2.7 x 2.9 m) cut out
  const doorC = Cc.parts.doorBays || [-6.14, 0, 6.14];
  let jamb = vs;
  for (const uc of doorC) {
    P.box(plaster, jamb, uc - 1.35, 0, VEST_CEIL, 0.95, 1.4, 'b');
    P.box(marbleDark, jamb, uc - 1.35, 0, 0.9, 1.4, 1.46, 'b');
    P.box(plaster, uc - 1.35, uc + 1.35, 2.9, VEST_CEIL, 0.95, 1.4, 'b');
    jamb = uc + 1.35;
  }
  P.box(plaster, jamb, ve, 0, VEST_CEIL, 0.95, 1.4, 'b');
  P.box(marbleDark, jamb, ve, 0, 0.9, 1.4, 1.46, 'b');
  P.box(plaster, vs - 0.5, vs, 0, VEST_CEIL, 1.4, 19.9); P.box(plaster, ve, ve + 0.5, 0, VEST_CEIL, 1.4, 19.9);
  // hall front wall: pieces beside the opening (u -9 .. 7), lintel above
  P.box(plaster, IN.u0, -9, 0, CEIL, 19.4, 19.9); P.box(plaster, 7, IN.u1, 0, CEIL, 19.4, 19.9);
  P.box(plaster, -9, 7, 7.0, CEIL, 19.4, 19.9);
  // marble piers (pink-cream) along the vestibule walls and beside the opening
  for (const u of [vs + 0.2, ve - 0.2]) for (let d = 4; d < 19; d += 4.4) { P.box(marble, u - 0.35, u + 0.35, 0, 3.2, d - 0.35, d + 0.35); P.box(marbleDark, u - 0.42, u + 0.42, 3.2, 3.4, d - 0.42, d + 0.42); P.box(marble, u - 0.35, u + 0.35, 3.4, VEST_CEIL, d - 0.35, d + 0.35); }
  P.box(marble, -9.5, -8.9, 0, 7.0, 18.2, 19.4); P.box(marble, 7.0, 7.6, 0, 7.0, 18.2, 19.4);
  // dado, cornice
  P.box(M.trim, vs, ve, VEST_CEIL - 0.5, VEST_CEIL, 1.4, 19.4, 'b');
  // ceiling with the 1950s painting
  P.quad(plafond, [vs, VEST_CEIL, 1.4], [ve, VEST_CEIL, 1.4], [ve, VEST_CEIL, 19.4], [vs, VEST_CEIL, 19.4], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  for (const d of [6, 12]) {      // two bronze chandeliers: ring + 6 candle torches
    const u = -1; P.cyl(gold, u, d, VEST_CEIL - 2.0, VEST_CEIL - 1.9, 0.9, 0.9, 12); P.cyl(gold, u, d, VEST_CEIL - 1.9, VEST_CEIL, 0.05, 0.05, 6);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; P.cyl(warmGlow, u + Math.cos(a) * 0.85, d + Math.sin(a) * 0.85, VEST_CEIL - 1.9, VEST_CEIL - 1.5, 0.05, 0.03, 5); }
  }
  // relief over the arch: oval shield with a loco (a plain sign plate)
  P.quad(T('#ffffff', { map: ctx.tex.sign({ w: 512, h: 128, bg: '#efe6cf', fg: '#7a5a30', text: '100 ЛЕТ ЖЕЛЕЗНОЙ ДОРОГЕ', size: 52, border: 5, borderColor: '#c9a85a', key: 'st_relief100', font: '"Noto Serif", serif' }), paint: 0 }), [3.5, 9.4, 19.38], [-5.5, 9.4, 19.38], [-5.5, 10.9, 19.38], [3.5, 10.9, 19.38], [0, 0, -1]);

  // ------------------------------------------------------------------ main hall: walls, far wall, ceiling
  const ux0 = IN.u0, ux1 = IN.u1, dd0 = IN.d0, dd1 = IN.d1, dF = IN.dFar;
  // side walls (inner faces) of the hall + concourse, travertine; upper band lighter plaster
  const sideWall = (u, nx) => {
    const gaps = nx > 0 ? [[dd0, 92], [100, dd1]] : [[dd0, dd1]];            // the west wall has the metro lobby door at d 92..100 (height 4.4)
    for (const [a, b] of gaps) P.quad(trav, [u, 0, a], [u, 0, b], [u, 9.4, b], [u, 9.4, a], [nx, 0, 0], [[a / 4, 0], [b / 4, 0], [b / 4, 9.4 / 4], [a / 4, 9.4 / 4]]);
    if (nx > 0) P.quad(trav, [u, 4.4, 92], [u, 4.4, 100], [u, 9.4, 100], [u, 9.4, 92], [nx, 0, 0], [[92 / 4, 4.4 / 4], [100 / 4, 4.4 / 4], [100 / 4, 9.4 / 4], [92 / 4, 9.4 / 4]]);
    P.quad(plaster, [u, 9.4, dd0], [u, 9.4, dd1], [u, CEIL, dd1], [u, CEIL, dd0], [nx, 0, 0]);
    // clerestory: bright daylight windows between pilasters (decorative, the shell windows are dark outside)
    for (let d = dd0 + 4; d < dd1 - 3; d += 6.2) P.quad(glowDay, [u + nx * 0.02, 10.2, d - 1.7], [u + nx * 0.02, 10.2, d + 1.7], [u + nx * 0.02, 11.9, d + 1.7], [u + nx * 0.02, 11.9, d - 1.7], [nx, 0, 0]);
    // shop-fascia datum line with a pink LED strip at 3.5 m
    P.quad(pinkLed, [u + nx * 0.04, 3.55, dd0], [u + nx * 0.04, 3.55, dd1], [u + nx * 0.04, 3.65, dd1], [u + nx * 0.04, 3.65, dd0], [nx, 0, 0]);
  };
  sideWall(ux0, 1); sideWall(ux1, -1);
  // far wall of the main hall: salmon panels, 12 m opening towards the concourse, arms, letters, LED board
  {
    const sh = new THREE.Shape(); rectPath(sh, ux0, 0, ux1, CEIL);
    sh.holes.push(rectPath(new THREE.Path(), -8.5, 0, 3.5, 5.4, true));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: false });
    // planar uv in metres / 4 so the salmon panels keep their proportions
    const pos = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 4, pos.getY(i) / 4);
    P.geo(salmon, g, 0, 0, dF, 0, 0, 0); g.dispose();
  }
  // coat of arms (gold shield 1.4 x 1.8), letters САНКТ-ПЕТЕРБУРГ, LED board above the opening
  P.box(gold, -2.7, -1.3, 6.9, 8.7, dF - 0.06, dF - 0.01); P.box(M.trim, -2.45, -1.55, 7.2, 8.4, dF - 0.1, dF - 0.06);
  P.quad(T('#ffffff', { map: ctx.tex.draw(1024, 96, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#6e5a46'; g.font = '600 76px "Noto Serif", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('САНКТ-ПЕТЕРБУРГ', w / 2, h / 2); }, { key: 'st_spb' }), alphaTest: 0.4, paint: 0, side: 'double' }), [6.5, 9.2, dF - 0.03], [-9.5, 9.2, dF - 0.03], [-9.5, 10.6, dF - 0.03], [6.5, 10.6, dF - 0.03], [0, 0, -1], [[1, 0], [0, 0], [0, 1], [1, 1]].map(([a, b]) => [1 - a, b]));
  P.box(dark, -8.2, 3.2, 5.6, 7.0, dF - 0.12, dF - 0.04); P.quad(ledScreen, [3.0, 5.7, dF - 0.13], [-8.0, 5.7, dF - 0.13], [-8.0, 6.9, dF - 0.13], [3.0, 6.9, dF - 0.13], [0, 0, -1]);
  // ceilings
  const cS = 1 / 4.8;
  P.quad(pyr, [ux0, CEIL, dd0], [ux1, CEIL, dd0], [ux1, CEIL, dF], [ux0, CEIL, dF], [0, -1, 0], [[ux0 * cS, dd0 * cS], [ux1 * cS, dd0 * cS], [ux1 * cS, dF * cS], [ux0 * cS, dF * cS]]);
  P.quad(alum, [ux0, CEIL, dF], [ux1, CEIL, dF], [ux1, CEIL, dd1 + 0.6], [ux0, CEIL, dd1 + 0.6], [0, -1, 0], [[ux0 * cS, dF * cS], [ux1 * cS, dF * cS], [ux1 * cS, (dd1 + 0.6) * cS], [ux0 * cS, (dd1 + 0.6) * cS]]);
  // rear wall pieces of the concourse (the 26 m opening between u -15 and 11 stays free)
  P.box(M.wing, ux0 - 0.5, -15, 0, CEIL, dd1, dd1 + 0.6, 'lrb'); P.box(M.wing, 11, ux1 + 0.5, 0, CEIL, dd1, dd1 + 0.6, 'lrb');
  P.box(plaster, -15, 11, 8.0, CEIL, dd1, dd1 + 0.3, 'lrb');

  // ------------------------------------------------------------------ the bust of Peter I (bronze on a grey granite pillar) in front of the far wall opening
  {
    const u = -2.3, d = dF - 1.6;
    P.box(granitePillar, u - 0.7, u + 0.7, 0, 3.0, d - 0.7, d + 0.7); P.box(T('#5f5f62'), u - 0.82, u + 0.82, 0, 0.35, d - 0.82, d + 0.82); P.box(T('#5f5f62'), u - 0.8, u + 0.8, 3.0, 3.12, d - 0.8, d + 0.8);
    // chest in baroque armour (tapered), shoulders, head with a curly wig
    P.cyl(bronze, u, d, 3.12, 4.0, 0.62, 0.45, 12); P.box(bronze, u - 0.62, u + 0.62, 3.8, 4.1, d - 0.28, d + 0.28);
    P.cyl(bronze, u, d, 4.0, 4.28, 0.18, 0.15, 8);
    const hg = new THREE.SphereGeometry(0.34, 12, 10); P.geo(bronze, hg, u, 4.6, d, 0, 0, 0, 1, 1.2, 1); hg.dispose();
    for (const s of [-1, 1]) { const wg = new THREE.SphereGeometry(0.22, 8, 6); P.geo(bronze, wg, u + s * 0.34, 4.35, d - 0.02, 0, 0, 0, 1, 1.6, 1); wg.dispose(); }
    Cc.svc.monuments.push({ id: 'peter-bust', name: 'Бюст Петра I · Bust of Peter I', x: W(u, d)[0], z: W(u, d)[1], h: 5 });
    // photo spot: from the hall entrance looking at the bust
    const p = W(-2.3, 26); Cc.svc.photoSpots.push({ x: p[0], z: p[1], yaw: 0, name: 'Зал с бюстом Петра I · Hall with the bust of Peter I', interior: true });
  }

  // ------------------------------------------------------------------ shop units along the walls (generic Russian names: no brands)
  const signNames = ['Кофейня', 'Сувениры', 'Выпечка', 'Связь', 'Аптека', 'Цветы', 'Игрушки', 'Продукты', 'Книги и пресса', 'Шоколад', 'Подарки', 'Мороженое', 'Чай и кофе', 'Булочная', 'Багаж', 'Быстрое питание'];
  const signCols = [['#1d1d22', '#ffffff'], ['#6b2a3a', '#fff0d6'], ['#154a3a', '#e8fff3'], ['#1d3b6b', '#ffffff'], ['#2b2b30', '#ffd24a'], ['#7b3b12', '#fff2dd']];
  let si = 0;
  const shopUnit = (u, d, nx, wd, depth = 2.4, h = 3.4) => {
    // u = wall line, nx = +1 when the unit stands against the west wall (front faces +u), -1 against the east wall
    const x0 = nx > 0 ? u : u - depth, x1 = nx > 0 ? u + depth : u;
    P.box(dark, x0, x1, 0, h, d - wd / 2, d + wd / 2, 't' + (nx > 0 ? 'l' : 'r'));
    const front = nx > 0 ? x1 : x0;
    // glazed warm front below the fascia
    P.quad(warmGlow, [front + nx * 0.02, 0.25, d - wd / 2 + 0.25], [front + nx * 0.02, 0.25, d + wd / 2 - 0.25], [front + nx * 0.02, 2.5, d + wd / 2 - 0.25], [front + nx * 0.02, 2.5, d - wd / 2 + 0.25], [nx, 0, 0]);
    P.box(metal, front - 0.05 + nx * 0.02, front + nx * 0.07, 0.0, 0.25, d - wd / 2, d + wd / 2, 'b');
    // counter shelf
    P.box(wood, front, front + nx * 0.5, 0.95, 1.05, d - wd / 2 + 0.3, d + wd / 2 - 0.3);
    // fascia sign
    const nm = signNames[si % signNames.length], col = signCols[si % signCols.length]; si++;
    const tex = ctx.tex.sign({ w: 512, h: 96, bg: col[0], fg: col[1], text: nm, size: 56, key: 'st_shop_' + nm + col[0], font: '"Noto Sans", sans-serif', radius: 0 });
    const m = T('#ffffff', { map: tex, paint: 0, emissive: '#555555', emissiveIntensity: 0.55 });
    const dA = d + nx * (wd / 2 - 0.1), dB = d - nx * (wd / 2 - 0.1);          // left end first as seen by a viewer facing the sign
    P.quad(m, [front + nx * 0.09, 2.55, dA], [front + nx * 0.09, 2.55, dB], [front + nx * 0.09, 3.3, dB], [front + nx * 0.09, 3.3, dA], [nx, 0, 0]);
    P.box(dark, front, front + nx * 0.1, 2.5, 3.35, d - wd / 2, d + wd / 2);
  };
  // main hall: shops along both side walls from the entrance to the far wall; the east row is the ticket office (Кассы) with numbered windows
  for (let d = 24; d < 56; d += 4.6) shopUnit(IN.u0, d, 1, 4.4);
  // ticket counter along the east wall
  {
    const u = IN.u1, d0 = 24, d1 = 50;
    P.box(dark, u - 1.6, u, 0, 3.6, d0, d1, 'tl'); P.box(wood, u - 1.7, u - 1.4, 0.95, 1.1, d0, d1);
    for (let d = d0 + 1.6; d < d1 - 1; d += 3.1) {
      P.quad(warmGlow, [u - 1.62, 1.1, d - 1.0], [u - 1.62, 1.1, d + 1.0], [u - 1.62, 2.4, d + 1.0], [u - 1.62, 2.4, d - 1.0], [-1, 0, 0]);
      P.box(metal, u - 1.65, u - 1.58, 1.1, 2.4, d - 1.05, d - 1.0); P.box(metal, u - 1.65, u - 1.58, 1.1, 2.4, d + 1.0, d + 1.05);
      P.box(T('#2b6bd1'), u - 1.66, u - 1.6, 2.5, 3.0, d - 0.4, d + 0.4);
    }
    const bt = ctx.tex.sign({ w: 512, h: 96, bg: '#1d3b6b', fg: '#ffffff', text: 'БИЛЕТНЫЕ КАССЫ', size: 54, key: 'st_kassy', font: '"Noto Sans", sans-serif' });
    P.quad(T('#ffffff', { map: bt, paint: 0, emissive: '#555555', emissiveIntensity: 0.6 }), [u - 1.7, 3.1, d0 + 2], [u - 1.7, 3.1, d1 - 2], [u - 1.7, 3.9, d1 - 2], [u - 1.7, 3.9, d0 + 2], [-1, 0, 0]);
  }
  for (let d = 54; d < 59; d += 4.6) shopUnit(IN.u1, d, -1, 4.4);
  // concourse: shops on both sides, a gap for the metro door on the west side (d 92..100)
  for (let d = 65; d < 139; d += 6.4) {
    if (!(d > 89 && d < 103)) shopUnit(IN.u0, d, 1, 5.2);
    shopUnit(IN.u1, d, -1, 5.2);
  }
  // metro door on the west wall: portal, plain blue "М" sign (no logo), arrow
  {
    const u = IN.u0, d = 96;
    P.box(M.trim, u, u + 0.12, 0, 4.6, d - 2.1, d - 1.7); P.box(M.trim, u, u + 0.12, 0, 4.6, d + 1.7, d + 2.1); P.box(M.trim, u, u + 0.12, 4.2, 4.6, d - 2.1, d + 2.1);
    const mt = ctx.tex.draw(256, 128, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#1b4ea0'; g.font = '700 108px "Noto Sans", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('М', 62, 70); g.font = '600 38px "Noto Sans", sans-serif'; g.fillText('Метро', 170, 70); }, { key: 'st_metro' });
    P.quad(T('#ffffff', { map: mt, paint: 0, emissive: '#666666', emissiveIntensity: 0.5 }), [u + 0.14, 4.7, d + 1.5], [u + 0.14, 4.7, d - 1.5], [u + 0.14, 5.9, d - 1.5], [u + 0.14, 5.9, d + 1.5], [1, 0, 0]);
  }

  // ------------------------------------------------------------------ the metro lobby behind the west door (OSM entrance n1109163066 "Площадь Восстания - 2" at u -21.7, d 95.8):
  // a plain plaster room with a closed roller shutter (the passage to the station is closed since the early 2000s, docs/research/station.md); the metro module may dig its stairs here
  {
    const lu0 = -27.5, lu1 = -17.0, ld0 = 90.3, ld1 = 101.7, lh = 4.2, cc = W(-22.3, 96);
    const holeHere = (L.GROUND_HOLES || []).some((h) => Math.hypot(h.x - cc[0], h.z - cc[1]) < 12);
    if (!holeHere) floorQuad(lu0, lu1, ld0, ld1, floorM);
    P.quad(plaster, [lu0, 0, ld0], [lu0, 0, ld1], [lu0, lh, ld1], [lu0, lh, ld0], [1, 0, 0]);
    P.quad(plaster, [lu1 - 0.5, 0, ld1], [lu1 - 0.5, 0, ld0], [lu1 - 0.5, lh, ld0], [lu1 - 0.5, lh, ld1], [-1, 0, 0]);
    P.quad(plaster, [lu0, 0, ld0], [lu1 - 0.5, 0, ld0], [lu1 - 0.5, lh, ld0], [lu0, lh, ld0], [0, 0, 1]);
    P.quad(plaster, [lu1 - 0.5, 0, ld1], [lu0, 0, ld1], [lu0, lh, ld1], [lu1 - 0.5, lh, ld1], [0, 0, -1]);
    P.quad(T('#e8e2d2'), [lu0, lh, ld0], [lu1 - 0.5, lh, ld0], [lu1 - 0.5, lh, ld1], [lu0, lh, ld1], [0, -1, 0]);
    P.box(glowL0(), lu0 + 2, lu1 - 3, lh - 0.06, lh - 0.02, 95.2, 96.8, 't');
    // roller shutter + notice on the west wall
    const shutter = T('#8f969d');
    P.box(shutter, lu0 + 0.02, lu0 + 0.1, 0.0, 3.0, 93.2, 98.8); for (let y = 0.2; y < 3.0; y += 0.2) P.box(T('#7b838a'), lu0 + 0.1, lu0 + 0.13, y, y + 0.03, 93.2, 98.8);
    P.quad(T('#ffffff', { map: ctx.tex.sign({ w: 512, h: 128, bg: '#1d3b6b', fg: '#ffffff', text: 'Переход закрыт', size: 62, key: 'st_closed', font: '"Noto Sans", sans-serif' }), paint: 0, emissive: '#555', emissiveIntensity: 0.5 }), [lu0 + 0.16, 3.1, 94.2], [lu0 + 0.16, 3.1, 97.8], [lu0 + 0.16, 3.9, 97.8], [lu0 + 0.16, 3.9, 94.2], [1, 0, 0]);
  }
  // ------------------------------------------------------------------ benches (wavy wooden seats), round tables, luggage lockers, signs
  const bench = (u, d, rot, len = 2.6) => {
    P.push(u, 0, d, rot);
    P.box(wood, -len / 2, len / 2, 0.42, 0.48, -0.25, 0.25); P.box(wood, -len / 2, len / 2, 0.55, 1.0, 0.25, 0.3);
    for (const s of [-1, 1]) { P.box(metal, s * len / 2 - 0.04, s * len / 2 + 0.04, 0, 0.45, -0.22, 0.22); P.box(metal, s * len / 2 - 0.04, s * len / 2 + 0.04, 0.45, 1.0, 0.24, 0.28); }
    P.pop();
  };
  for (const [u, d] of [[-9, 32], [-1, 32], [5.5, 32], [-9, 46], [-1, 46], [5.5, 46]]) { bench(u, d, 0, 2.6); bench(u, d + 1.1, Math.PI, 2.6); }
  for (const d of [76, 84, 108, 116, 126]) { bench(-8, d, Math.PI / 2, 2.6); bench(-6.8, d, -Math.PI / 2, 2.6); bench(4.5, d, Math.PI / 2, 2.6); bench(5.7, d, -Math.PI / 2, 2.6); }
  for (const [u, d] of [[-12, 30], [-12, 40], [9, 30], [8, 56], [-12, 56]]) { P.cyl(wood, u, d, 1.05, 1.1, 0.42, 0.42, 12); P.cyl(metal, u, d, 0.0, 1.05, 0.05, 0.05, 6); P.cyl(metal, u, d, 0.0, 0.05, 0.3, 0.3, 10); }

  // departure boards: hung from the ceiling over the concourse, drawn from the sim clock (see update below)
  const board = makeBoard(ctx);
  const boards = [];
  for (const d of [70, 104, 134]) {
    P.box(metal, -5.3, -4.9, 8.2, CEIL, d - 0.1, d + 0.1); P.box(metal, 1.9, 2.3, 8.2, CEIL, d - 0.1, d + 0.1);
    P.box(dark, -5.4, 2.4, 6.0, 8.2, d - 0.18, d + 0.18);
    boards.push(d);
    P.quad(board.mat, [2.2, 6.1, d - 0.2], [-5.2, 6.1, d - 0.2], [-5.2, 8.1, d - 0.2], [2.2, 8.1, d - 0.2], [0, 0, -1], [[1, 0], [0, 0], [0, 1], [1, 1]].map(([a, b]) => [1 - a, b]));
    P.quad(board.mat, [-5.2, 6.1, d + 0.2], [2.2, 6.1, d + 0.2], [2.2, 8.1, d + 0.2], [-5.2, 8.1, d + 0.2], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  // big sign over the opening to the platforms
  P.quad(T('#ffffff', { map: ctx.tex.sign({ w: 1024, h: 128, bg: '#0f6a3c', fg: '#ffffff', text: 'ВЫХОД К ПОЕЗДАМ  ·  ПЛАТФОРМЫ  1 – 11', size: 62, key: 'st_exit_trains', font: '"Noto Sans", sans-serif' }), paint: 0, emissive: '#555555', emissiveIntensity: 0.5 }), [-1.0, 9.0, dd1 - 0.05], [-13.0, 9.0, dd1 - 0.05], [-13.0, 10.2, dd1 - 0.05], [-1.0, 10.2, dd1 - 0.05], [0, 0, -1], [[1, 0], [0, 0], [0, 1], [1, 1]].map(([a, b]) => [1 - a, b]));
  P.quad(T('#ffffff', { map: ctx.tex.sign({ w: 1024, h: 128, bg: '#1d3b6b', fg: '#ffffff', text: 'КАМЕРА ХРАНЕНИЯ · ЗАЛ ОЖИДАНИЯ · ТУАЛЕТ', size: 56, key: 'st_services', font: '"Noto Sans", sans-serif' }), paint: 0, emissive: '#555555', emissiveIntensity: 0.5 }), [10.5, 9.0, dd1 - 0.05], [-0.5, 9.0, dd1 - 0.05], [-0.5, 10.2, dd1 - 0.05], [10.5, 10.2, dd1 - 0.05], [0, 0, -1], [[1, 0], [0, 0], [0, 1], [1, 1]].map(([a, b]) => [1 - a, b]));

  // ------------------------------------------------------------------ gates (turnstile line) under the canopy
  const gd = 150;
  const gates = [];
  for (let u = -33.4; u <= 10.2; u += 1.5) {
    P.box(metal, u - 0.2, u + 0.2, 0, 1.15, gd - 0.55, gd + 0.55); P.box(T('#2db96a'), u - 0.21, u + 0.21, 1.0, 1.1, gd - 0.2, gd + 0.2); P.box(T('#b9bdc2'), u - 0.21, u + 0.21, 1.15, 1.2, gd - 0.55, gd + 0.55);
    gates.push(u + 0.75);
  }
  // canopy underside lights + floor under the canopy (granite slabs)
  floorQuad(CANOPY.u0, CANOPY.u1, dd1 + 0.6, CANOPY.d1, floorM);
  const glowL = ctx.mat.emissive('#fff4dc', 1.0);
  for (let u = CANOPY.u0 + 4; u < CANOPY.u1; u += 8) for (const d of [150, 160]) P.box(glowL, u - 0.9, u + 0.9, CANOPY.y - 0.28, CANOPY.y - 0.25, d - 0.15, d + 0.15, 't');

  const g = new THREE.Group(); g.name = 'station-interior'; g.position.set(O.x, 0, O.z); g.rotation.y = TH;
  P.build(g, { cast: false });
  ctx.addStatic(g);
  Cc.parts.interiorTris = P.tris;

  // ------------------------------------------------------------------ colliders for furniture (low walk-blocking boxes)
  for (let d = 24; d < 56; d += 4.6) wbox(ctx, IN.u0, IN.u0 + 2.4, d - 2.2, d + 2.2, 0, 3.4);
  wbox(ctx, IN.u1 - 1.7, IN.u1, 24, 50, 0, 3.6);
  for (let d = 54; d < 59; d += 4.6) wbox(ctx, IN.u1 - 2.4, IN.u1, d - 2.2, d + 2.2, 0, 3.4);
  for (let d = 65; d < 139; d += 6.4) { if (!(d > 89 && d < 103)) wbox(ctx, IN.u0, IN.u0 + 2.4, d - 2.6, d + 2.6, 0, 3.4); wbox(ctx, IN.u1 - 2.4, IN.u1, d - 2.6, d + 2.6, 0, 3.4); }
  wbox(ctx, -3.0, -1.6, dF - 2.3, dF - 0.9, 0, 5);                          // bust pillar
  for (let u = -33.4; u <= 10.2; u += 1.5) wbox(ctx, u - 0.2, u + 0.2, gd - 0.55, gd + 0.55, 0, 1.3);
  // far-wall pieces beside the opening
  wbox(ctx, IN.u0 - 0.5, -8.5, dF - 0.1, dF + 0.7, 0, 13); wbox(ctx, 3.5, IN.u1 + 0.5, dF - 0.1, dF + 0.7, 0, 13);
  // inner front wall of the vestibule (doors stay free) and its side walls
  wbox(ctx, vs, -7.5 - 0.0, 0.9, 1.5, 0, 8); wbox(ctx, -4.8, -1.35, 0.9, 1.5, 0, 8); wbox(ctx, 1.35, 4.8, 0.9, 1.5, 0, 8); wbox(ctx, 7.5, ve, 0.9, 1.5, 0, 8);
  wbox(ctx, vs - 0.6, vs, 1.4, 19.9, 0, 8); wbox(ctx, ve, ve + 0.6, 1.4, 19.9, 0, 8);

  // ------------------------------------------------------------------ indoor lighting zone over vestibule + hall + concourse
  if (ctx.zones && ctx.zones.add) {
    ctx.zones.add({
      id: 'station-hall',
      test: (x, y, z) => { if (y > 14) return false; const [u, d] = UV(x, z); if (u >= -27.6 && u <= -16.9 && d >= 90.2 && d <= 101.8) return true; return (u >= IN.vu0 - 0.4 && u <= IN.vu1 + 0.4 && d >= 0.95 && d <= 19.9) || (u >= IN.u0 - 0.4 && u <= IN.u1 + 0.4 && d >= 19.4 && d <= IN.d1 + 0.2); },
      indoor: { name: 'Московский вокзал · Moscow Railway Station hall', sun: 0.0, sky: true, shadows: false, ambient: { color: '#fff3e0', ground: '#d2c2a8', intensity: 1.75 }, fog: { color: '#cfd6dc', density: 0.0012 }, key: { color: '#fff0dc', intensity: 1.2, dir: [0.25, 0.9, 0.35] } },
    });
  }
  // ------------------------------------------------------------------ live boards
  ctx.onUpdate((dt, t) => board.update(t));
  // station exits for the people module: the three doors and the two gateways (positions just in front of the facade, rotY faces the square)
  const exits = Cc.svc.stationExits;
  for (const uc of [-6.145, 0, 6.145]) { const [x, z] = W(uc, -2.2); exits.push({ x, z, rotY: TH + Math.PI, kind: 'door', inside: (() => { const [ix, iz] = W(uc, 4); return { x: ix, z: iz }; })() }); }
  for (const uc of [-30.7, 30.7]) { const [x, z] = W(uc, -2.2); exits.push({ x, z, rotY: TH + Math.PI, kind: 'gateway' }); }
  for (const u of [-24, -16, -8, 0, 6]) { const [x, z] = W(u, 156); exits.push({ x, z, rotY: TH, kind: 'platform-gate' }); }
  Cc.svc.gates = gates;
  Cc.svc.gateLanes = gates.map((u) => { const [x, z] = W(u, gd + 0.0); return { x, z, rotY: TH }; });
  return g;
}

/** departure board canvas: 6 rows, times from the HUD clock rounded to 5 minutes, redrawn when the minute changes */
function makeBoard(ctx) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mat = ctx.mat.emissive('#ffffff', 1.0, { map: tex }); mat.userData.noBatch = true;
  const DEST = [['Москва · Ленинградский', 'Сапсан'], ['Москва · Ленинградский', 'Красная стрела'], ['Великий Новгород', 'Ласточка'], ['Мурманск', 'Фирменный'], ['Петрозаводск', 'Фирменный'], ['Адлер', 'Двухэтажный'], ['Бологое', 'Скорый'], ['Псков', 'Скорый']];
  let last = -1;
  const draw = (mins) => {
    g.fillStyle = '#0a1a33'; g.fillRect(0, 0, 512, 256);
    g.fillStyle = '#ffd23a'; g.font = '700 22px "Noto Sans", sans-serif'; g.textBaseline = 'middle';
    g.fillText('ОТПРАВЛЕНИЕ', 12, 18); g.textAlign = 'right'; g.fillText('ПУТЬ', 500, 18); g.textAlign = 'left';
    g.fillStyle = '#26406b'; g.fillRect(0, 34, 512, 2);
    for (let i = 0; i < 6; i++) {
      const m = Math.ceil(mins / 5) * 5 + i * 17 + (i % 3) * 5, hh = Math.floor(m / 60) % 24, mm = m % 60;
      const y = 56 + i * 36, row = DEST[(i + Math.floor(mins / 30)) % DEST.length];
      g.fillStyle = '#ffffff'; g.font = '700 24px "Noto Sans", sans-serif'; g.fillText(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, 12, y);
      g.fillStyle = '#dfe9ff'; g.font = '600 20px "Noto Sans", sans-serif'; g.fillText(row[0], 100, y - 7); g.fillStyle = '#8fb2ff'; g.font = '500 15px "Noto Sans", sans-serif'; g.fillText(row[1], 100, y + 11);
      g.fillStyle = '#5ee08a'; g.font = '700 26px "Noto Sans", sans-serif'; g.textAlign = 'right'; g.fillText(String(1 + (i * 3 + Math.floor(mins / 10)) % 11), 492, y); g.textAlign = 'left';
    }
    tex.needsUpdate = true;
  };
  const minutesNow = (t) => { try { const s = window.__tod && window.__tod.clockText ? window.__tod.clockText(t) : null; if (s) { const [h, m] = s.split(':').map(Number); return h * 60 + m; } } catch (e) { /* none */ } return 15 * 60 + 20 + Math.floor(t / 60); };
  draw(minutesNow(0)); last = minutesNow(0);
  return { mat, tex, update(t) { const m = minutesNow(t); if (m !== last) { last = m; draw(m); } } };
}
