// landmarksKirova/erarta.js - the ERARTA MUSEUM (Эрарта, 29th line 2, OSM w45966528; Stalinist neoclassicism, 1951; museum since 2010) as a DETAILED object (user request 2026-10-09: it must not read as a box at 1-3 m).
// Orchestrator of the files: erfront.js (front segments: granite plinth, rusticated base, windows with reveals / frames / surrounds, balustrades, crown cornices), erportico.js (eight columns, wall behind,
// entablature, attic with the museum line, roof sign), erportal.js (white portal box, sign band, three glass door groups, the lit foyer behind the glass, granite stair with cheeks, colliders of the entrance),
// erflank.js (flanks / rear from the box partition VOLE, roofs, chimneys, downpipes), erartaart.js (Era and Arta on the cheek walls), eryard.js (foreyard: larches, lawns, furniture), erwin.js / erlet.js (vocabulary).
// Dossier docs/research/kirova.md section 11, photos refs/kirova er01 .. er06.  Frame FE (frame.js): local x = q' (NNW), local z = r' (ENE, outward: the front faces +z); plan numbers in ER.
import * as L from '../layout.js';
import { FE, ER, ringOf } from './frame.js';
import { addPolyColliders } from '../lib/massing.js';

const V = (id, x, z, h) => ({ id, x, z, h });
/** the box partition of the footprint (local x = q', z = r'); drawn by erflank.js (exposed runs) and the front files */
export const VOLE = [
  V('pavS', [ER.pavS[0], ER.pavS[1]], [ER.rear, ER.pavSR], ER.pavCornice),
  V('wingS', [ER.wingS[0], ER.wingS[1]], [ER.rear, ER.wingSR], ER.wingCornice),
  V('cb', [ER.centre[0], 8.8], [ER.rear, ER.wall], ER.entTop),
  V('cb2', [8.8, ER.centre[1]], [-14.3, ER.wall], ER.entTop),
  V('cbBase', [ER.centre[0], ER.centre[1]], [ER.wall, ER.centreR], ER.corniceTop),
  V('wingN', [ER.wingN[0], ER.wingN[1]], [-14.3, ER.wingNR], ER.wingCornice),
  V('pavN', [ER.pavN[0], ER.pavN[1]], [-14.3, ER.pavNR], ER.pavCornice),
  V('bump', [ER.bump.q[0], ER.bump.q[1]], [ER.bump.r[0], -14.3], ER.wingCornice),
];

export async function build(K) {
  const { ctx, P } = K, errs = [];
  const stage = async (name, fn) => { try { return await fn(); } catch (e) { console.error(`[landmarksKirova] erarta/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  // Respect the shared registry before emitting signs, including rejected slots.
  const lab = ctx.services.labels, nx = FE.s, nz = FE.c;
  const label = (q, r, y, w, h) => { const p = FE.W(q, r); return !lab?.reserve || lab.reserve('w45966528', p.x, y, p.z, w, h, nx, nz, 'sign'); };
  K.erartaLabels = {
    portal: label(0, ER.centreR + ER.portal.r + 0.03, ER.plinth + ER.portal.h - 0.955, 14.6, 1.83),
    attic: label(-1, -0.87, ER.entTop + 0.78, 21, 1),
  };
  FE.push(P);
  const front = await import('./erfront.js'), portico = await import('./erportico.js'), portal = await import('./erportal.js'), flank = await import('./erflank.js');
  await stage('front', () => front.build(K));
  await stage('portico', () => portico.build(K));
  await stage('portal', () => portal.build(K));
  await stage('flank', () => flank.build(K, VOLE));
  P.pop();
  await stage('art', async () => { const a = await import('./erartaart.js'); a.build(K); });
  await stage('mir', async () => { const m = await import('./ermir.js'); m.build(K); });
  await stage('yard', async () => { const y = await import('./eryard.js'); y.build(K); });
  await stage('plaza', async () => { const y = await import('./erplaza.js'); y.build(K); });
  await stage('colliders', () => { const o = ringOf('w45966528'); if (o) addPolyColliders(ctx, { o: Array.from(o), h: [] }, -0.3, 26, 0.9); });
  await stage('services', () => {
    const sv = K.svc, c = FE.W(0, 0.1);
    sv.entrances.push({ id: 'erarta-main', x: c.x, z: c.z, rotY: FE.rot, closed: true, name: 'Эрарта' });
    for (const q of [-4.3, 4.3]) { const p = FE.W(q, 0.1); sv.entrances.push({ id: 'erarta-side', x: p.x, z: p.z, rotY: FE.rot, closed: true, name: 'Эрарта' }); }
    const cs = FE.W(0, 10); sv.crowd.push({ id: 'erarta-stair', kind: 'photo', x: cs.x, z: cs.z, r: 8, n: 6 });
    const ps = FE.W(0, 30), pt = FE.W(0, 0);
    sv.photoSpots.push({ x: ps.x, z: ps.z, yaw: L.yawToward(ps.x, ps.z, pt.x, pt.z), pitch: 12, name: 'Эрарта: портик и лестница' });
    const pw = FE.W(-14, 30); sv.photoSpots.push({ x: pw.x, z: pw.z, yaw: L.yawToward(pw.x, pw.z, c.x, c.z), pitch: 10, name: 'Эрарта: фасад с улицы' });
    sv.monuments.push({ id: 'w45966528', name: 'Музей современного искусства «Эрарта»', x: c.x, z: c.z, h: 24.5 });
  });
  if (errs.length) throw new Error(errs.join('\n'));
}
