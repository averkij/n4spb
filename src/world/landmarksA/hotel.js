// landmarksA/hotel.js - the corner blocks of Vosstaniya Square: Hotel «Октябрьская» (OSM r1598177, Ligovsky 10 / Nevsky 118, 6 levels, beige-pink rusticated ground floor
// with arched shop windows, five storeys of paired windows, deep cornice; the Ligovsky wing pale grey-blue with white pilaster strips; the roof sign "ГОРОД-ГЕРОЙ ЛЕНИНГРАД"
// over "ГОСТИНИЦА ОКТЯБРЬСКАЯ"), the Best Western block r1588277 (Nevsky 83 / Ligovsky 41, salmon plaster, 5 levels) and the Cosmos hotel w507867255 (Goncharnaya 4, 7 levels,
// pale panel block).  Photos SP/refs/station 64-66 (hotel), 71 (Nevsky 83), 79; docs/research/station.md "Hotel Oktyabrskaya".  World coordinates (no frame).
// Walls = a core prism + one bay per ~3.4 m (ground floor: 0.25 m extruded panel with arched openings; upper floors: textured window plates with white surrounds); the courtyard
// (the hole of the OSM polygon) gets plain bays.  Colliders: addPolyColliders (cut by data/metro.js DOORWAYS).  The ground floor carries lit shop signs (generic names).
import * as THREE from 'three';
import { Parts, C, archPath, rectPath } from './common.js';
import { wallRun, inside, cellCap, ringOf, ringArea, inset } from './geom.js';
import { windowTex } from './tex.js';
import { addPolyColliders } from '../lib/massing.js';
import * as L from '../layout.js';

const SHOP = ['Кафе', 'Бар', 'Кофейня', 'Бистро', 'Пекарня', 'Ресторан', 'Сувениры', 'Аптека', 'Пиццерия', 'Гостиница'];

/** The tall-bay wall builder (used by the hotel here and by the annexes in halls.js): returns { building(rec, H, styleFor, opts) }.  P may be inside any frame. */
export function makeTall(Cc, P) {
  const { ctx, M, T } = Cc;
  const winMat = Cc.winMat || T('#ffffff', { map: windowTex(ctx), paint: 0 });
  const winLit = Cc.winLit || winMat;
  let wc = 0;
  const roofDark = T('#4a4448'), white = M.trim, trimShade = M.trimShade;
  const signMats = SHOP.map((nm, i) => { const bg = ['#7a1f26', '#1d1d22', '#3a2a22', '#154a3a', '#1d3b6b', '#7b3b12'][i % 6]; return T('#ffffff', { map: ctx.tex.sign({ w: 256, h: 64, bg, fg: '#fff2d6', text: nm, size: 40, key: 'ht_' + nm, font: '"Noto Sans", sans-serif' }), paint: 0, emissive: '#666', emissiveIntensity: 0.55 }); });
  let sc = 0;

  /** one bay of a tall rent-house wall (frame: x along the wall, z into the building) */
  function bay(pitch, H, st, portal = null) {
    const hp = pitch / 2, PL = 0.9;
    // ground floor: extruded panel with an arched shop window
    const gh = st.groundH, sh = new THREE.Shape(); rectPath(sh, -hp, 0, hp, gh);
    if (!portal && st.ground !== false) sh.holes.push(archPath(new THREE.Path(), Math.min(1.5, pitch - 1.6), gh - 2.4 - Math.min(1.5, pitch - 1.6) / 2, 0, 0.7, true));
    if (portal) {
      if (portal[0] > -hp + .01) P.box(st.rust, -hp, portal[0], 0, gh, 0, .3);
      if (portal[1] < hp - .01) P.box(st.rust, portal[1], hp, 0, gh, 0, .3);
      P.box(st.rust, portal[0], portal[1], 3.35, gh, 0, .3);
    } else P.extrude(st.rust, sh, .28, 0, 0, 0, 0, 4);
    if (!portal && st.ground !== false) {
      const w = Math.min(1.5, pitch - 1.6), top = gh - 2.4 - w / 2 + 0.7;
      P.quad(M.pane, [w / 2, 0.7, 0.25], [-w / 2, 0.7, 0.25], [-w / 2, top, 0.25], [w / 2, top, 0.25], [0, 0, -1]);
      const arc = new THREE.Shape(); arc.moveTo(-w / 2, 0); arc.absarc(0, 0, w / 2, Math.PI, 0, true); arc.lineTo(-w / 2, 0); P.extrude(M.pane, arc, 0.02, 0, top, 0.23, 0, 4);
      const rg = new THREE.Shape(); archPath(rg, w + 0.4, gh - 2.4 - w / 2, 0, 0.7); rg.holes.push(archPath(new THREE.Path(), w, gh - 2.4 - w / 2, 0, 0.7, true)); P.extrude(white, rg, 0.08, 0, 0, -0.08, 0, 4);
      if (st.shops && (sc++ % 4) === 1) {   // lit shop sign over the window
        const m = signMats[sc % signMats.length];
        P.quad(m, [hp - 0.3, gh - 1.9, -0.12], [-hp + 0.3, gh - 1.9, -0.12], [-hp + 0.3, gh - 1.3, -0.12], [hp - 0.3, gh - 1.3, -0.12], [0, 0, -1], [[1, 0], [0, 0], [0, 1], [1, 1]].map(([a, b]) => [1 - a, b]));
      }
    }
    // string course over the ground floor
    P.box(white, -hp, hp, gh, gh + 0.3, -0.18, 0.25, 'lrs'); P.box(st.wall, -hp, hp, gh + 0.3, H - 1.4, 0.0, 0.26, 'lrs');
    // storeys
    for (const [y0, y1, kind] of st.floors) {
      const h = y1 - y0, ww = Math.min(1.15, pitch - 1.2);
      P.quad(((wc++ * 7 + Math.round(y0)) % 4) ? winLit : winMat, [ww / 2, y0, -0.02], [-ww / 2, y0, -0.02], [-ww / 2, y1, -0.02], [ww / 2, y1, -0.02], [0, 0, -1], [[1, 0], [0, 0], [0, 1], [1, 1]].map(([a, b]) => [1 - a, b]));
      P.box(white, -ww / 2 - 0.2, -ww / 2, y0 - 0.1, y1 + 0.28, -0.1, 0.0, 'rs'); P.box(white, ww / 2, ww / 2 + 0.2, y0 - 0.1, y1 + 0.28, -0.1, 0.0, 'ls');
      P.box(white, -ww / 2 - 0.2, ww / 2 + 0.2, y1, y1 + 0.28, -0.1, 0.0, 'bs'); P.box(white, -ww / 2 - 0.3, ww / 2 + 0.3, y0 - 0.22, y0 - 0.06, -0.16, 0.0, 'bs');
      if (kind === 'noble') { P.box(white, -ww / 2 - 0.34, ww / 2 + 0.34, y1 + 0.28, y1 + 0.5, -0.24, 0.0, 'bs'); const tri = new THREE.Shape(); tri.moveTo(-ww / 2 - 0.3, 0); tri.lineTo(ww / 2 + 0.3, 0); tri.lineTo(0, 0.45); tri.closePath(); P.extrude(white, tri, 0.18, 0, y1 + 0.5, -0.2); }
    }
    // pilaster strip on every bay edge (the grey Ligovsky wing: white strips)
    if (st.strips) { P.box(white, -hp, -hp + 0.28, gh + 0.3, H - 1.4, -0.06, 0.0, 'rs'); }
    // cornice
    P.box(white, -hp, hp, H - 1.4, H - 1.0, -0.2, 0.2, 'lrs'); P.box(trimShade, -hp, hp, H - 1.0, H - 0.35, -0.04, 0.2, 'lrs'); P.box(white, -hp, hp, H - 0.35, H + 0.2, -0.8, 0.4, 'lrs');
    P.box(st.wall, -hp, hp, H + 0.2, H + 0.7, -0.3, 0.3, 'lrs');           // parapet
  }

  /** wall every edge of a ring up to H; styleFor(edge info) -> style */
  function building(rec, H, styleFor, o = {}) {
    const poly = rec ? rec.polys[0] : null, outer = o.outer || ringOf(poly.o), holes = o.outer ? (o.holes || []) : poly.h.map(ringOf);
    const body = (x, z) => inside(outer, x, z) && !holes.some((h) => inside(h, x, z));
    const wall0 = o.coreMat || st0(styleFor).wall;
    P.prism(wall0, inset(outer, 0.3), o.portals?.length ? 3.35 : 0, H - 1.5, '');                       // 0.3 m behind the bay panels (never coplanar with them)
    for (const h of holes) P.prism(wall0, inset(h, -0.3), 0, H - 1.5, '', 1, true);
    const run = (ring, hole) => wallRun(P, ring, (e) => {
      const st = styleFor(e, hole);
      if (!st) {
        if (o.portals?.length) P.box(wall0, 0, e.len, 0, 3.35, .28, .31);
        return;
      }
      const n = Math.max(1, Math.round(e.len / (st.pitch || 3.4))), pitch = e.len / n;
      const openings = [];
      for (const door of o.portals || []) {
        const dx = door.x - e.a[0], dz = door.z - e.a[1], t = dx * e.tx + dz * e.tz;
        if (Math.abs(dx * e.nx + dz * e.nz) < .4 && t >= 0 && t <= e.len)
          openings.push([t - door.w / 2, t + door.w / 2]);
      }
      for (let j = 0; j < n; j++) {
        const from = j * pitch, to = from + pitch, mid = (from + to) / 2;
        const door = openings.find(([a, b]) => b > from && a < to);
        P.push(mid, 0, 0, 0);
        bay(pitch, H, st, door && [Math.max(from, door[0]) - mid, Math.min(to, door[1]) - mid]);
        P.pop();
      }
    }, { inside: body });
    run(outer, false); for (const h of holes) run(h, true);
    // roof: flat cap with a dark parapet cap, cells of <= 24 m
    if (o.roof !== false) cellCap(P, roofDark, outer, H + 0.72, { holes, maxEdge: 22, uvs: 6 });
    if (poly && o.colliders !== false) addPolyColliders(ctx, poly, 0, H + 1, 0.9);
  }
  const st0 = (f) => f({ len: 10, a: [0, 0], b: [10, 0], nx: 0, nz: -1 }, false);
  return { building };
}

export function buildHotel(Cc) {
  const { ctx, M, T } = Cc;
  const P = new Parts();
  const { building } = makeTall(Cc, P);
  const N = Cc.night, HN = (col, o = {}) => T(col, { ...o, name: 'ht' + col });
  const pinkWall = N.toon(HN('#dcc0a6', { paint: 0.07 }), '#ffd9a8', 0.45), pinkRust = N.toon(HN('#cfae92', { paint: 0.07 }), '#ffd09a', 0.4), greyWall = N.toon(HN('#bcc1c6', { paint: 0.06 }), '#ffe0b4', 0.42), greyRust = N.toon(HN('#a9aeb4', { paint: 0.06 }), '#ffd9a8', 0.38);
  const salmon = N.toon(HN('#e2b3a2', { paint: 0.07 }), '#ffd2a0', 0.4), salmonRust = N.toon(HN('#8d8780', { paint: 0.06 }), '#ffd2a0', 0.3), panelC = N.toon(HN('#cdbfa8', { paint: 0.05 }), '#ffd9a8', 0.35), panelD = N.toon(HN('#b4a68f', { paint: 0.05 }), '#ffd9a8', 0.3);

  // ------------------------------------------------------------------ Hotel Oktyabrskaya
  const NEV = 104 * Math.PI / 180;
  const hotelFloors = [[6.5, 9.4, 'noble'], [10.9, 13.5], [14.6, 17.2], [18.2, 20.6], [21.3, 22.3]];
  const pink = { wall: pinkWall, rust: pinkRust, groundH: 5.6, floors: hotelFloors, shops: true, pitch: 3.5 };
  const grey = { wall: greyWall, rust: greyRust, groundH: 5.6, floors: hotelFloors, shops: true, strips: true, pitch: 3.5 };
  const hot = L.buildingById('r1598177');
  building(hot, 23.5, (e, hole) => {
    if (hole) return { ...pink, ground: false, shops: false, groundH: 3.2, floors: [[4.6, 7.4], [8.9, 11.7], [13, 15.8], [17, 19.8], [21.0, 22.3]], pitch: 4.2 };
    const bear = Math.atan2(e.b[0] - e.a[0], -(e.b[1] - e.a[1]));
    const along = Math.abs(Math.cos(bear - NEV));                              // 1 = parallel to Nevsky
    return along > 0.84 ? pink : grey;
  });
  // roof sign (user photo USER_hotel_night.png): thin white capitals «ГОРОД-ГЕРОЙ ЛЕНИНГРАД» standing on the parapet of the FRONT facade (the 96 m edge (591,83)-(668,140) that
  // faces Nevsky and the square), two dark boards with bold yellow «ГОСТИНИЦА» (left) and «ОКТЯБРЬСКАЯ» (right) at the cornice.  All glow at night.
  {
    const a = [591, 83], b = [668, 140], len = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / len, tz = (b[1] - a[1]) / len;
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let out = [tz, -tx]; if (L.insideBuilding(mid[0] + out[0] * 2.5, mid[1] + out[1] * 2.5)) out = [-out[0], -out[1]];
    const r = [out[1], -out[0]];                                                // the viewer's right while looking at the sign from the square
    const letters = (text, key, w, h) => ctx.tex.draw(1024, Math.round(1024 * h / w) , (g, W2, H2) => { g.clearRect(0, 0, W2, H2); g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `300 ${H2 * 0.78}px "Noto Sans", sans-serif`; g.lineWidth = Math.max(2, H2 * 0.045); g.strokeStyle = '#ffffff'; g.strokeText(text, W2 / 2, H2 * 0.55); g.fillText(text, W2 / 2, H2 * 0.55); }, { key, anisotropy: 8 });
    const lm = (tex, key) => { const m = N.toon(T('#ffffff', { map: tex, alphaTest: 0.35, side: 'double', paint: 0, name: 'ht-' + key }), '#ffffff', 1.3, 0.6); m.userData.noOutline = true; return m; };
    const quadAt = (mat, w, h, y, off, nOff, uvFlip = false) => {
      const cx = mid[0] + r[0] * off + out[0] * nOff, cz = mid[1] + r[1] * off + out[1] * nOff;
      const p0 = [cx - r[0] * w / 2, cz - r[1] * w / 2], p1 = [cx + r[0] * w / 2, cz + r[1] * w / 2];
      P.quad(mat, [p0[0], y, p0[1]], [p1[0], y, p1[1]], [p1[0], y + h, p1[1]], [p0[0], y + h, p0[1]], [out[0], 0, out[1]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    };
    const roofY = 23.5 + 0.72;
    quadAt(lm(letters('ГОРОД-ГЕРОЙ ЛЕНИНГРАД', 'ht_roofw', 56, 3.4), 'w'), 56, 3.4, roofY + 2.0, -11, 0.5);
    // frame under the white letters (thin truss on the parapet)
    P.push(mid[0] + r[0] * -11 + out[0] * 0.35, 0, mid[1] + r[1] * -11 + out[1] * 0.35, Math.atan2(-r[1], r[0]));
    P.box(M.ironLight, -28, 28, roofY, roofY + 0.25, -0.1, 0.1, 's'); P.box(M.ironLight, -28, 28, roofY + 1.7, roofY + 1.85, -0.08, 0.08, 's');
    for (let x = -28; x <= 28.01; x += 4) P.box(M.ironLight, x - 0.06, x + 0.06, roofY, roofY + 1.85, -0.08, 0.08, 's');
    P.pop();
    const board = (text, key, w, off) => {
      const tex = ctx.tex.sign({ w: 512, h: 72, bg: '#2a2822', fg: '#ffd23a', text, size: 54, weight: 800, key, font: '"Noto Sans", sans-serif' });
      const m = T('#ffffff', { map: tex, paint: 0, name: 'ht-' + key }); m.emissiveMap = tex; N.toon(m, '#ffffff', 1.0, 0.0);
      quadAt(m, w, 1.9, roofY + 0.05, off, 0.4);
    };
    board('ГОСТИНИЦА', 'ht_b1', 24, -32); board('ОКТЯБРЬСКАЯ', 'ht_b2', 27, 10.5);
    // dark backing boxes for the boards
    for (const [w, off] of [[24.4, -32], [27.4, 10.5]]) { P.push(mid[0] + r[0] * off + out[0] * 0.2, 0, mid[1] + r[1] * off + out[1] * 0.2, Math.atan2(-r[1], r[0])); P.box(T('#2a2822'), -w / 2, w / 2, roofY, roofY + 2.0, -0.2, 0.2, 'bs'); P.pop(); }
  }

  // ------------------------------------------------------------------ Nevsky 83 / Ligovsky 41 (Best Western) and Cosmos
  const bw = L.buildingById('r1588277');
  building(bw, 21, (e, hole) => ({ wall: salmon, rust: salmonRust, groundH: 5.0, floors: hole ? [[6.4, 8.8], [10.4, 12.8], [14.2, 16.6], [17.8, 20.0]] : [[6.2, 8.9, 'noble'], [10.0, 12.6], [13.8, 16.4], [17.4, 19.8]], shops: !hole, ground: !hole, pitch: 3.6 }));
  const cs = L.buildingById('w507867255');
  building(cs, 25.5, () => ({ wall: panelC, rust: panelD, groundH: 4.2, floors: [[5.4, 7.6], [8.9, 11.1], [12.4, 14.6], [15.9, 18.1], [19.4, 21.6], [22.5, 24.2]], shops: false, pitch: 3.2 }));

  const g = new THREE.Group(); g.name = 'station-square-hotels';
  P.build(g, {});
  g.traverse((o) => { if (o.isMesh && o.material.userData.noOutline) ctx.noOutline(o); });
  ctx.addStatic(g);
  Cc.parts.hotelTris = P.tris;
  return g;
}
