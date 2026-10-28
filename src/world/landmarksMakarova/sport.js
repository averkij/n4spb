// landmarksMakarova/sport.js - the two oval glazed pavilions of the metro station Sportivnaya-2 (exits 6 and 7, opened 27 May 2015; OSM w627859233 / w627859229, docs/research/makarova.md section 9; photos s01 s03).
// A low oval kiosk on the pavement of the bridge head: a polished pink-grey granite plinth wall 1.1 m high with a thin coping, clear glazing between steel mullions (pitch <= 1.9 m), a flat silver-grey rolled
// canopy (three fascia bands) that overhangs the glass, a straight DOOR CHORD at one tip (four glass door leaves flanked by square granite pillars with white fluted bins in front, a raised granite slab with a yellow
// edge strip, the pill sign "Спортивная Sportivnaya" behind the glass under the soffit), the white box sign with the blue M on two posts on the roof, a steel-grid skylight in the roof.
// Plan: the OSM 18-gon in the pavilion frame (frame.js F6 / F7: door tip at u = -7.7 for both): the glass line is the footprint inset 0.25 m (the metro room walls stand 0.4 m inside), the canopy the footprint
// outset 0.35 m.  Everything is drawn in ONE pushed frame with local rings (kit.js ringEdges / onEdge / band work on local rings there).
// HEIGHTS (dossier 11 "height conflict"): the metro room under the shell has its ceiling 3.1 m over the floor (y 3.15), the real canopy soffit is 2.55 m: the FALLBACK of the dossier is built (soffit 3.2,
// roof top 3.75, sign top 4.95); SHELL_SOFFIT turns it back to the photographed 2.55 if the metro owner lowers the room.  The metro draws the opening in the floor, the stair, the escalators and the room.
// Colliders: the plinth / glass ring (thin walls) with the door chord left open, the two pillars.  Publishes the entrance anchors, crowd discs, photo spots, svc.metro = { signs: true }.
import * as L from '../layout.js';
import { F6, F7, ringIn, colliders } from './frame.js';
import { ringEdges, onEdge, band } from './kit.js';
import { offsetRing, clipRing, smoothRing } from './util.js';

export const SHELL_SOFFIT = 3.2;
const PL = 1.1, COP = 0.04, FASCIA = [0.18, 0.2, 0.17], PIL = 0.9;
const PAVILIONS = [
  { id: 'sportivnaya2-6', name: 'Выход № 6', bldg: 'w627859233', f: F6, door: [-3758.5, -1677.7], rotY: -0.91, crowd: [-3756.5, -1673.5], spot: [-3741, -1675] },
  { id: 'sportivnaya2-7', name: 'Выход № 7', bldg: 'w627859229', f: F7, door: [-3792.0, -1699.6], rotY: 0.23, crowd: [-3792.0, -1699.6], spot: null },
];
const poly = (r) => ({ o: r.flat(), h: [] });

export function build(K) {
  const errs = [];
  for (const pv of PAVILIONS) {
    try { pavilion(K, pv); } catch (e) { console.error(`[landmarksMakarova] sport ${pv.id}:`, e); errs.push(`${pv.id}: ${e && e.stack || e}`); }
  }
  K.svc.metro = { signs: true };
  if (errs.length) throw new Error(errs.join('\n'));
}

function pavilion(K, pv) {
  const { ctx, P, M } = K, ph = ctx.physics, f = pv.f, CL = colliders(f, ph);
  const ring = ringIn(f, pv.bldg);
  if (!ring) throw new Error('footprint missing ' + pv.bldg);
  // ---- plan: the door chord 0.5 m inside the tip, the glass line = the footprint inset 0.25 m, the canopy = the footprint outset 0.35 m
  const uTip = Math.min(...ring.map((p) => p[0])), uC = uTip + 0.5, uChord = uC + 0.25;
  const glass = offsetRing(clipRing(ring, 0, uC, 1), -0.25);
  const inner = offsetRing(glass, -0.35);
  const canopy = smoothRing(offsetRing(ring, 0.35));
  const cv = glass.filter((p) => Math.abs(p[0] - uChord) < 1e-4).map((p) => p[1]).sort((a, b) => a - b);
  if (cv.length < 2) throw new Error('door chord not found');
  const vA = cv[0], vB = cv[cv.length - 1], wC = vB - vA, vMid = (vA + vB) / 2;
  const eG = ringEdges(poly(glass), 0.05), eI = ringEdges(poly(inner), 0.05), eC = ringEdges(poly(canopy), 0.05);
  const isChord = (e) => Math.abs(e.a[0] - uChord) < 0.03 && Math.abs(e.b[0] - uChord) < 0.03;
  const chordIdx = new Set(eG.filter(isChord).map((e) => e.i));
  const notChord = (e) => !chordIdx.has(e.i);
  const yG0 = PL + COP, yS = SHELL_SOFFIT, yT = yS + FASCIA[0] + FASCIA[1] + FASCIA[2];
  const vL = vA + PIL, vR = vB - PIL;

  P.push(f.x, 0, f.z, f.rot);
  try {
    // ---- the plinth (front face on the glass line, top = coping) and the coping strip 5 cm proud
    band(P, eI.filter(notChord), 0, PL, 0.35, { front: M.sportG, top: M.sportG }, { uvs: 1.2 });
    band(P, eI.filter(notChord), PL, yG0, 0.4, { front: M.canopyLow, top: M.canopyTop }, { uvs: 2 });
    // ---- the glazing: panels <= 1.9 m between steel mullions, a top rail under the soffit
    for (const e of eG) {
      if (!notChord(e)) continue;
      onEdge(P, e, (len) => {
        const n = Math.max(1, Math.ceil(len / 1.9));
        P.quad(M.glass, [0, yG0, 0], [len, yG0, 0], [len, yS, 0], [0, yS, 0], [0, 0, 1]);
        P.quad(M.glass, [len, yG0, 0], [0, yG0, 0], [0, yS, 0], [len, yS, 0], [0, 0, -1]);
        for (let i = 0; i <= n; i++) { const x = len * i / n; P.box(M.steel, x - 0.025, x + 0.025, yG0, yS, -0.045, 0.045, 'b'); }
        P.box(M.steel, 0, len, yS - 0.07, yS, -0.05, 0.05, 'b'); P.box(M.steel, 0, len, yG0, yG0 + 0.05, -0.05, 0.05, 'bt');
      });
    }
    // ---- the canopy: soffit, three fascia bands, roof, skylight
    P.cap(M.soffit, canopy, yS, false, 1.5);
    let y = yS;
    band(P, eC, y, y + FASCIA[0], 0, { front: M.canopyLow }, { uvs: 2 }); y += FASCIA[0];
    band(P, eC, y, y + FASCIA[1], 0.04, { front: M.canopyMid, under: M.canopyLow, top: M.canopyMid }, { uvs: 2 }); y += FASCIA[1];
    band(P, eC, y, y + FASCIA[2], 0.07, { front: M.canopyTop, under: M.canopyMid, top: M.canopyTop }, { uvs: 2 });
    P.cap(M.membrane, canopy, yT, true, 2);
    const sky = offsetRing(canopy, -1.1);
    band(P, ringEdges(poly(sky), 0.05), yT, yT + 0.1, 0.1, { front: M.canopyTop, top: M.canopyTop }, { uvs: 2 });
    P.cap(M.skylight, sky, yT + 0.04, true, 1.2);

    // ---- the door chord (plane u = uChord, faces -u)
    const nb = 4, bw = (vR - vL) / nb;
    for (const [v0, v1] of [[vA, vL], [vR, vB]]) {                                   // the end pillars 1.2 m high, flat tops
      P.box(M.sportG, uChord, uChord + 0.9, 0, 1.2, v0, v1, '', 1.2);
    }
    // door leaves between the pillars: steel frames, clear glass, bar handles; a transom above 2.3 m
    const yD0 = 0.1, yD1 = 2.3, zf = uChord;
    P.quad(M.doorGlass, [zf, yD0, vL], [zf, yD0, vR], [zf, yD1, vR], [zf, yD1, vL], [-1, 0, 0]);
    P.quad(M.doorGlass, [zf, yD0, vR], [zf, yD0, vL], [zf, yD1, vL], [zf, yD1, vR], [1, 0, 0]);
    P.quad(M.glass, [zf, yD1, vL], [zf, yD1, vR], [zf, yS, vR], [zf, yS, vL], [-1, 0, 0]);
    P.quad(M.glass, [zf, yD1, vR], [zf, yD1, vL], [zf, yS, vL], [zf, yS, vR], [1, 0, 0]);
    for (let i = 0; i <= nb; i++) { const v = vL + bw * i; P.box(M.steel, zf - 0.04, zf + 0.04, yD0, yS, v - 0.03, v + 0.03, 'b'); }
    for (const yy of [yD0, yD1 - 0.05, yD1]) P.box(M.steel, zf - 0.045, zf + 0.045, yy, yy + 0.05, vL, vR, 'b');
    P.box(M.steel, zf - 0.05, zf + 0.05, yS - 0.07, yS, vL, vR, 'b');
    for (let i = 0; i < nb; i++) { const vc = vL + bw * (i + 0.5), s = i % 2 ? 1 : -1; P.box(M.steelDark, zf - 0.09, zf - 0.05, 0.95, 1.55, vc + s * 0.34 - 0.012, vc + s * 0.34 + 0.012, 'b'); }
    // the pill sign behind the glass under the soffit, 4.6 x 0.45 m (a decal 6 cm inside the glass)
    const sw = Math.min(4.6, vR - vL + 0.1);
    P.quad(M.pill, [uChord + 0.07, 2.68, vMid - sw / 2], [uChord + 0.07, 2.68, vMid + sw / 2], [uChord + 0.07, 3.13, vMid + sw / 2], [uChord + 0.07, 3.13, vMid - sw / 2], [-1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);   // seen from the street (looking along +u) the right hand is +v
    // the raised granite slab in front of the doors with its yellow edge strip, the two fluted bins
    P.box(M.slab, uChord - 1.8, uChord + 0.05, 0, 0.1, vA - 0.3, vB + 0.3, '', 1.2);
    P.quad(M.yellow, [uChord - 1.8, 0.105, vA - 0.3], [uChord - 1.65, 0.105, vA - 0.3], [uChord - 1.65, 0.105, vB + 0.3], [uChord - 1.8, 0.105, vB + 0.3], [0, 1, 0]);
    P.quad(M.yellow, [uChord - 1.65, 0.105, vA - 0.3], [uChord + 0.05, 0.105, vA - 0.3], [uChord + 0.05, 0.105, vA - 0.15], [uChord - 1.65, 0.105, vA - 0.15], [0, 1, 0]);
    P.quad(M.yellow, [uChord - 1.65, 0.105, vB + 0.15], [uChord + 0.05, 0.105, vB + 0.15], [uChord + 0.05, 0.105, vB + 0.3], [uChord - 1.65, 0.105, vB + 0.3], [0, 1, 0]);
    for (const vv of [vA + 0.45, vB - 0.45]) {
      P.box(M.bin, uChord - 1.05, uChord - 0.45, 0.1, 0.92, vv - 0.3, vv + 0.3, '', 1);
      for (let k = 0; k < 4; k++) { const w = vv - 0.3 + 0.15 + k * 0.1; P.box(M.canopyMid, uChord - 1.07, uChord - 1.05, 0.2, 0.84, w - 0.012, w + 0.012, 'bt', 1); }
      P.box(M.steelDark, uChord - 0.95, uChord - 0.55, 0.92, 0.95, vv - 0.2, vv + 0.2, '', 1);
    }
    // the white box sign with the blue M on two posts above the left part of the door end
    const su = uChord + 1.0, sv = vMid - wC / 6;
    for (const dv of [-0.28, 0.28]) P.box(M.steelDark, su - 0.03, su + 0.03, yT, yT + 0.35, sv + dv - 0.03, sv + dv + 0.03, 'b', 1);
    P.box(M.mWhite, su - 0.1, su + 0.1, yT + 0.35, yT + 1.2, sv - 0.4, sv + 0.4, '', 1);
    P.quad(M.mBox, [su - 0.103, yT + 0.35, sv - 0.4], [su - 0.103, yT + 0.35, sv + 0.4], [su - 0.103, yT + 1.2, sv + 0.4], [su - 0.103, yT + 1.2, sv - 0.4], [-1, 0, 0]);
    P.quad(M.mBox, [su + 0.103, yT + 0.35, sv + 0.4], [su + 0.103, yT + 0.35, sv - 0.4], [su + 0.103, yT + 1.2, sv - 0.4], [su + 0.103, yT + 1.2, sv + 0.4], [1, 0, 0]);
  } finally { P.pop(); }

  // ---- colliders: the plinth / glass ring (door chord open), the pillars
  for (const e of eG) if (notChord(e)) CL.wall(e.a, e.b, 0, yS, 0.4);
  for (const [v0, v1] of [[vA, vL], [vR, vB]]) CL.box(uChord + 0.45, (v0 + v1) / 2, 0.9, v1 - v0, 0, 1.2);

  // ---- services: the entrance anchor, a crowd disc at the door, a photo spot
  const door = ctx.L.DOORWAYS ? (ctx.L.DOORWAYS.find((d) => d.id === pv.id) || null) : null;
  K.svc.entrances.push({ id: pv.id, x: door ? door.x : pv.door[0], z: door ? door.z : pv.door[1], rotY: door ? door.rotY : pv.rotY, kind: 'metro' });
  K.svc.crowd.push({ x: pv.crowd[0], z: pv.crowd[1], r: 3, n: 3, kind: 'door', name: pv.name });
  if (pv.spot) { const c = f.W(0, 0); K.svc.photoSpots.push({ x: pv.spot[0], z: pv.spot[1], yaw: L.yawToward ? L.yawToward(pv.spot[0], pv.spot[1], c.x, c.z) : 57, name: 'Выход станции «Спортивная»' }); }
}
