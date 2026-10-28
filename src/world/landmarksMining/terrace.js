// landmarksMining/terrace.js - the quay terrace beside the Krasin (docs/research/mining.md 9.5, 9.7; photos refs/mining 61 62 69 75 110): the AMUNDSEN BUST (bronze head and shoulders on a four-sided grey granite
// pedestal 0.6 x 0.6 x 1.5 m with a moulded cap, plates with the Russian inscriptions, S (16.6, 13.4), facing the ship / the river), the two wooden BENCHES (S (13.8, 11.0) and (16.8, 7.8), facing the river), the glazed
// ticket shelter w693966848 (S X 14.4 .. 25.4, Z -3.5 .. 2.6: glass walls under a low pitched grey roof), a short row of clipped LIMES along the service road, the lift gate's bollards.  The terrace paving and the lawn
// are streets' / environment's; the round granite curb of the lawn is in descents.js.  Frame S of frame.js.
import * as THREE from 'three';
import * as L from '../layout.js';
import { S as FS, coverOf } from './frame.js';
import { bust } from '../lib/figures.js';
import { plantTrees } from './trees.js';

export async function build(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics, FM = M.FM, cover = coverOf(ctx), label = ctx.services.labels;
  const step = (name, fn) => { const t0 = performance.now(); try { fn(); if (typeof process !== 'undefined' && process.env && process.env.MINING_DEBUG) console.log('  [terrace] ' + name + ' ' + Math.round(performance.now() - t0) + ' ms'); } catch (e) { console.error(`[landmarksMining/terrace] ${name}:`, e); } };
  const plateTex = (key, lines, w, h, o = {}) => ctx.tex.draw(512, Math.round(512 * h / w), (g, W, H) => {
    g.fillStyle = o.bg || '#2a2c2b'; g.fillRect(0, 0, W, H); g.strokeStyle = '#8a7a4a'; g.lineWidth = 5; g.strokeRect(8, 8, W - 16, H - 16);
    g.fillStyle = o.fg || '#cdb779'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const lh = (H - 36) / lines.length; lines.forEach((s, i) => ctx.tex.fitText(g, s, W / 2, 18 + lh * (i + 0.5), W - 44, Math.min(lh * 0.72, 54), ctx.tex.FONTS.serif, 700));
  }, { key: 'lmMin-' + key });
  // ------------------------------------------------------------------------------------------ the Amundsen bust
  step('bust', () => {
    P.push(FS.x, 0, FS.z, FS.rot);
    try {
      const X = 16.6, Z = 13.4;
      P.box(M.granitePed, X - 0.45, X + 0.45, 0.0, 0.15, Z - 0.45, Z + 0.45, 'b', 1.6);
      P.box(M.granitePed, X - 0.3, X + 0.3, 0.15, 1.38, Z - 0.3, Z + 0.3, 'b', 1.6);
      P.box(M.granitePed, X - 0.38, X + 0.38, 1.38, 1.52, Z - 0.38, Z + 0.38, 'b', 1.6);
      const key = FM.keys('bronze', 'gold');
      bust({ detail: 0.8, style: 'civil', turn: 0.0, face: { age: 0.5, hair: 'short', seed: 91 } }).place(P, key, X, 1.52, Z, -Math.PI / 2, 1.05);
      // inscription plates on three faces (reserved through the label registry): the front toward the ship (-X), the two sides
      const faces = [['front', [-1, 0], ['Руал Амундсен —', 'известный полярный', 'исследователь']], ['gift', [0, 1], ['Дар правительства Норвегии', 'в связи со 100-летием со дня', 'рождения Руаля Амундсена']], ['gift2', [0, -1], ['Руал Амундсен', '1872 — 1928']]];
      for (const [id, [nx, nz], lines] of faces) {
        const w = 0.46, h = 0.34, c = FS.W(X + nx * 0.31, Z + nz * 0.31);
        const wn = [FS.A[0] * nx + FS.B[0] * nz, FS.A[1] * nx + FS.B[1] * nz];
        if (label && !label.reserve('mining-amundsen-' + id, c.x, 0.85, c.z, w, h, wn[0], wn[1], 'plate-landmark')) continue;
        const m = ctx.mat.toon('#ffffff', { map: plateTex('amundsen-' + id, lines, w, h), name: 'lmMin-amundsen-' + id, paint: 0, polygonOffset: -2 });
        const ox = X + nx * 0.304, oz = Z + nz * 0.304, tx = -nz * (w / 2), tz = nx * (h / 2 * 0), ax = nx === 0 ? w / 2 : 0, az = nz === 0 ? w / 2 : 0;
        void tx; void tz;
        // vertical plate quad on the face (centre ox, oz; half width along the face)
        const along = nx === 0 ? [1, 0] : [0, 1], hx = along[0] * w / 2, hz = along[1] * w / 2;
        P.quad(m, [ox - hx, 0.68, oz - hz], [ox + hx, 0.68, oz + hz], [ox + hx, 1.02, oz + hz], [ox - hx, 1.02, oz - hz], [nx, 0, nz], nx < 0 || nz > 0 ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[1, 0], [0, 0], [0, 1], [1, 1]]);
        void ax; void az;
      }
      const bw = FS.W(X, Z);
      FS.cyl(ph, X, Z, 0.5, 0, 2.3);
      svc.monuments.push({ id: 'n6449209085', name: 'Памятник Руалю Амундсену', x: bw.x, z: bw.z, h: 2.3, r: 0.6 });
      svc.crowd.push({ x: bw.x, z: bw.z, r: 7, n: 6, kind: 'quay', y: 0, name: 'Набережная у «Красина»' });
    } finally { P.pop(); }
  });
  // ------------------------------------------------------------------------------------------ the two benches (wooden, a back, iron ends), facing the river (-X)
  step('benches', () => {
    P.push(FS.x, 0, FS.z, FS.rot);
    try {
      for (const [X, Z] of [[13.8, 11.0], [16.8, 7.8]]) {
        P.box(M.wood, X - 0.25, X + 0.2, 0.42, 0.47, Z - 0.85, Z + 0.85, 'b', 1);
        P.box(M.wood, X + 0.18, X + 0.22, 0.5, 0.95, Z - 0.85, Z + 0.85, 'b', 1);
        for (const dz of [-0.8, 0.8]) { P.box(M.benchIron, X - 0.22, X + 0.2, 0, 0.42, Z + dz - 0.03, Z + dz + 0.03, 'b'); P.box(M.benchIron, X + 0.17, X + 0.21, 0.42, 0.98, Z + dz - 0.03, Z + dz + 0.03, 'b'); }
        const w = FS.W(X, Z); svc.benches.push({ x: w.x, z: w.z, rotY: FS.rot + Math.PI / 2 * 0 + Math.PI / 2, len: 1.7 });
        FS.box(ph, X, Z, 0.7, 1.8, 0, 0, 1.0);
      }
    } finally { P.pop(); }
  });
  // ------------------------------------------------------------------------------------------ the glazed ticket shelter w693966848 (a closed building: glass walls, low pitched grey roof)
  step('shelter', () => {
    const b = L.buildingById('w693966848'); if (!b || !b.polys || !b.polys[0]) return;
    const o = b.polys[0].o; if (o.length < 8) return;
    const cx = (o[0] + o[2] + o[4] + o[6]) / 4, cz = (o[1] + o[3] + o[5] + o[7]) / 4, a = Math.atan2(o[3] - o[1], o[2] - o[0]);
    const ca = Math.cos(a), sa = Math.sin(a);
    let w = 0, d = 0; for (let i = 0; i < o.length; i += 2) { const dx = o[i] - cx, dz = o[i + 1] - cz; w = Math.max(w, Math.abs(dx * ca + dz * sa)); d = Math.max(d, Math.abs(-dx * sa + dz * ca)); }
    // frame: local x along the first edge (rotY = -a), local z the other axis
    P.push(cx, 0, cz, -a);
    try {
      const h = 3.0, glass = ctx.mat.toon('#7a97a6', { name: 'lmMin-shelterGlass', paint: 0.01 }), roof = M.rearRoof;
      for (const s of [-1, 1]) {
        P.box(glass, -w, w, 0.5, h, s * d - 0.03, s * d + 0.03, 'bt', 3); P.box(glass, s * w - 0.03, s * w + 0.03, 0.5, h, -d, d, 'bt', 3);
        P.box(M.plinth, -w, w, 0, 0.5, s * d - 0.08, s * d + 0.08, 'b', 3); P.box(M.plinth, s * w - 0.08, s * w + 0.08, 0, 0.5, -d, d, 'b', 3);
      }
      for (let k = 0; k <= 6; k++) { const x = -w + 2 * w * k / 6; for (const s of [-1, 1]) P.box(M.iron, x - 0.04, x + 0.04, 0.5, h, s * d - 0.05, s * d + 0.05, 'b'); }
      // low gable roof (ridge along x)
      const rise = 1.0;
      P.quad(roof, [-w - 0.3, h, -d - 0.3], [w + 0.3, h, -d - 0.3], [w + 0.3, h + rise, 0], [-w - 0.3, h + rise, 0], [0, 1, -0.5], [[0, 0], [8, 0], [8, 2], [0, 2]]);
      P.quad(roof, [w + 0.3, h, d + 0.3], [-w - 0.3, h, d + 0.3], [-w - 0.3, h + rise, 0], [w + 0.3, h + rise, 0], [0, 1, 0.5], [[0, 0], [8, 0], [8, 2], [0, 2]]);
      P.fan(roof, [[-w - 0.3, h, -d - 0.3], [-w - 0.3, h, d + 0.3], [-w - 0.3, h + rise, 0]], [-1, 0, 0], (p) => [p[2] / 3, p[1] / 3]);
      P.fan(roof, [[w + 0.3, h, d + 0.3], [w + 0.3, h, -d - 0.3], [w + 0.3, h + rise, 0]], [1, 0, 0], (p) => [p[2] / 3, p[1] / 3]);
    } finally { P.pop(); }
    ph.addBox(cx, cz, 2 * w, 2 * d, -a, 0, 4.2);
  });
  // ------------------------------------------------------------------------------------------ the row of clipped limes along the west side of the service road (world (-4642 .. -4636, 458 .. 497))
  step('trees', () => {
    const list = [];
    for (let k = 0; k < 8; k++) {
      const t = k / 7, x = -4642 + 6 * t + 0.6 * Math.sin(k), z = 459 + 38 * t;
      if (cover(x, z) > -2.2 || L.insideBuilding(x, z, 1.5) || L.inRiver(x, z)) continue;
      list.push({ x, z, fam: 'limeA', s: 0.62 + 0.04 * (k % 3), yaw: k * 1.7 });
    }
    if (list.length) plantTrees(K, list, 'lmMin-limes');
    svc.trees = list.length;
  });
}
