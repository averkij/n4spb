// landmarksAurora/lions.js - the SHI-TSZA descent of Petrovskaya embankment: two granite Manchurian guardian lions (from Girin, a gift of General N. I. Grodekov, set up in 1907 on
// pedestals by L. N. Benois) flanking the wide granite staircase into the Neva.  Dossier docs/research/aurora.md section 5; photos 71 72 74 75.  OSM nodes n4515911157 / n4515911158.
// Frame LIONS (frame.js): origin = the middle between the lions on the main quay line, +x along the quay to the ENE, +z out to the river.  Pedestals at x = +-10.55 (4.35 m with the lion),
// the inscription on the faces toward the stairs, both lions face the river.
// STAIRS: 18.6 m wide between the cheek blocks, 23 risers of 0.155 m straight into the water with one landing.  They are built only when the bank is open there
// (`L.heightAt` of the stair pit below -1: the request to build-water in docs/research/petro-requests-landmarksAurora.md); otherwise the parapet of the environment runs through and only
// the pedestals stand on the pavement.
import * as THREE from 'three';
import * as L from '../layout.js';
import { lion, cached } from '../lib/figures.js';
import { LIONS, NEVA_Y } from './frame.js';

export function build(K) {
  const { ctx, M, P, svc } = K, ph = ctx.physics;
  const pit = LIONS.w(0, 2.2);
  let open = false; try { open = L.heightAt(pit.x, pit.z) < -1; } catch (e) { open = false; }
  // is the quay of the environment still drawn across the stair front? (its wall / parapet / collider pieces: ctx.services.environment.quay.segments)
  const segs = (ctx.services.environment && ctx.services.environment.quay && ctx.services.environment.quay.segments) || [];
  const frontClosed = segs.some((sg) => { const m = LIONS.loc((sg.ax + sg.bx) / 2, (sg.az + sg.bz) / 2); return Math.abs(m.u) < 8.5 && Math.abs(m.v - LIONS.front) < 1.5; });
  const mode = !open ? 'pedestals' : frontClosed ? 'covered' : 'stairs';        // covered: the pit is cut but the bank is still walled: a granite terrace over the pit until the gap exists
  svc.lions = { open, mode, x: LIONS.x, z: LIONS.z };
  const F = (ctx.tex.FONTS && ctx.tex.FONTS.serif) || 'serif';
  const inscr = ctx.tex.draw(512, 256, (g, w, h) => {
    g.fillStyle = '#9a9690'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.fillStyle = ['#84807a', '#b0aca6', '#8e8a84', '#a6a29c'][i % 4]; g.fillRect((i * 7919) % w, (i * 104729) % h, 2, 2); }
    g.fillStyle = '#3d3a36'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const lines = [['ШИ-ЦЗА', 34], ['ИЗЪ ГОРОДА ГИРИНА ВЪ МАНЧ-', 27], ['ЖУРІИ ПЕРЕВЕЗЕНА ВЪ САНКТЪ-', 27], ['ПЕТЕРБУРГЪ ВЪ 1907 ГОДУ.', 27], ['ДАРЪ ГЕНЕРАЛА-ОТЪ-ИНФАНТЕРІИ', 18], ['НИКОЛАЯ ИВАНОВИЧА ГРОДЕКОВА.', 18]];
    let y = 40; for (const [t, s] of lines) { g.font = `bold ${s}px ${F}`; g.fillText(t, w / 2, y); y += s + (s > 20 ? 12 : 9); if (s === 27 && t.startsWith('ПЕТЕРБУРГЪ')) { g.fillRect(w / 2 - 70, y - 4, 140, 2); y += 10; } }
  }, { key: 'lmAu-shitsza' });
  const inscrMat = ctx.mat.toon('#ffffff', { map: inscr, name: 'lmAu-shitszaText', paint: 0.02 });
  const lionMats = { main: M.stone, dark: M.stoneDark, accent: M.stone };

  P.push(LIONS.x, 0, LIONS.z, LIONS.rot);
  try {
    for (const s of [-1, 1]) {
      const x = s * LIONS.half;
      P.box(M.greyGranite, x - 1.15, x + 1.15, 0, 0.75, -1.45, 1.45, 'b', 1.5);                              // plinth
      P.box(M.greyGranite, x - 0.98, x + 0.98, 0.75, 1.62, -1.3, 1.3, 'b', 1.5);                              // inscription block with a chamfered top
      for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = [0.98, 1.3], b = [0.86, 1.18], q = sx ? [[x + sx * a[0], 1.62, -sx * a[1]], [x + sx * a[0], 1.62, sx * a[1]], [x + sx * b[0], 1.74, sx * b[1]], [x + sx * b[0], 1.74, -sx * b[1]]] : [[x + sz * a[0], 1.62, sz * a[1]], [x - sz * a[0], 1.62, sz * a[1]], [x - sz * b[0], 1.74, sz * b[1]], [x + sz * b[0], 1.74, sz * b[1]]];
        P.quad(M.greyGranite, q[0], q[1], q[2], q[3], [sx * 0.6, 0.8, sz * 0.6]);
      }
      P.box(M.pinkSlab, x - 0.78, x + 0.78, 1.74, 2.08, -1.04, 1.04, 'b', 2);                                 // pink cap
      const xi = x - s * 0.985;                                                                             // the face toward the stairs
      P.quad(inscrMat, [xi, 0.8, -s * 1.22], [xi, 0.8, s * 1.22], [xi, 1.58, s * 1.22], [xi, 1.58, -s * 1.22], [-s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      // the carved Chinese base: lotus tier, waist with panels, upper tier, the slab under the paws
      P.box(M.stone, x - 0.5, x + 0.5, 2.08, 2.34, -0.78, 0.78, 'b'); P.box(M.stoneDark, x - 0.42, x + 0.42, 2.34, 2.5, -0.68, 0.68, 'b'); P.box(M.stone, x - 0.5, x + 0.5, 2.5, 2.7, -0.78, 0.78, 'b'); P.box(M.stone, x - 0.44, x + 0.44, 2.7, 2.84, -0.72, 0.72, 'b');
      for (let k = -3; k <= 3; k++) for (const sx of [-1, 1]) { const g = new THREE.SphereGeometry(1, 6, 4); P.geo(M.stoneDark, g, x + sx * 0.5, 2.21, k * 0.21, 0, 0, 0, 0.035, 0.1, 0.085); g.dispose(); }
      const fig = cached('lmAu-shitsza' + s, () => lion({ pose: 'sit', ball: s < 0, head: { turn: -s * 0.35, pitch: -0.05, open: 0.8 }, detail: 0.85, mane: 1.3, tail: 'curl' }));
      for (const [key, g] of Object.entries(fig.geos)) P.geo(lionMats[key] || lionMats.main, g, x, 2.84, -0.1, 0, 0, 0, 1.55, 1.14, 1.08);      // a stocky guardian lion: the kit lion widened
      if (s > 0) { const g = new THREE.SphereGeometry(1, 8, 6); P.geo(M.stone, g, x + 0.1, 3.0, 0.52, 0, 0, 0, 0.2, 0.17, 0.26); P.geo(M.stone, g, x + 0.1, 3.14, 0.72, 0, 0, 0, 0.12, 0.11, 0.13); g.dispose(); }   // the cub under the paw of the lioness
      const c = LIONS.w(x, 0); ph.addBox(c.x, c.z, 2.3, 2.9, LIONS.rot, 0, 4.4);
      svc.monuments.push({ id: s < 0 ? 'n4515911157' : 'n4515911158', name: 'Ши-цза', x: c.x, z: c.z, h: 4.4 });
    }
    if (mode === 'covered') {
      const hw = LIONS.stairHalf;
      P.box(M.pinkSlab, -hw - 0.05, hw + 0.05, -0.5, 0.06, 0.25, LIONS.front + 0.1, 'b', 2);
      const c = LIONS.w(0, (0.25 + LIONS.front) / 2); ph.addWalkBox(c.x, c.z, hw * 2 + 0.1, LIONS.front - 0.15, LIONS.rot, 0.0, -8);
    }
    if (mode === 'stairs') {
      const hw = LIONS.stairHalf, rise = 0.155, tread = 0.33, WY = NEVA_Y;
      let v = 0.3, y = 0; const steps = [];
      for (let k = 0; k < 24; k++) { if (k === 11) { steps.push([v, v + 1.3, y]); v += 1.3; } y -= rise; steps.push([v, v + tread, y]); v += tread; }
      for (const [v0, v1, top] of steps) P.box(M.pinkSlab, -hw, hw, top - 0.5, top, v0, v1 + 0.02, 'b', 2);
      P.box(M.pinkDark, -hw, hw, -5.6, steps[0][2] - 0.48, 0.28, 0.32, '');
      // cheek blocks: parapet height at the pedestals, stepping down along the flight
      const vEnd = steps[steps.length - 1][1];
      for (const s of [-1, 1]) {
        const xa = Math.min(s * hw, s * (hw + 0.62)), xb = Math.max(s * hw, s * (hw + 0.62));
        P.box(M.pink, xa, xb, -5.6, 0.02, 0.3, 1.45, 'b', 2);
        P.box(M.pink, xa, xb, -5.6, 1.0, 1.45, LIONS.front, 'b', 2);
        P.box(M.pink, xa, xb, -5.6, -0.6, LIONS.front, LIONS.front + 2.2, 'b', 2);
        P.box(M.pink, xa, xb, -5.6, -2.0, LIONS.front + 2.2, vEnd, 'b', 2);
        const c = LIONS.w(s * (hw + 0.31), (0.3 + vEnd) / 2); ph.addBox(c.x, c.z, 0.62, vEnd - 0.3, LIONS.rot, -8, 1.3);
      }
      const mid = (a, b) => LIONS.w(0, (a + b) / 2), n1 = 11, v1a = 0.3, v1b = 0.3 + n1 * tread, v2a = v1b + 1.3, v2b = v2a + 13 * tread;
      { const c = mid(v1a, v1b); ph.addStairs(c.x, c.z, hw * 2, v1b - v1a, LIONS.rot, 0, -n1 * rise, n1); }
      { const c = mid(v1b, v2a); ph.addWalkBox(c.x, c.z, hw * 2, 1.3, LIONS.rot, -n1 * rise, -8); }
      { const c = mid(v2a, v2b); ph.addStairs(c.x, c.z, hw * 2, v2b - v2a, LIONS.rot, -n1 * rise, -(n1 + 13) * rise, 13); }
      { const c = LIONS.w(0, v2b - 2 * tread + 0.4); ph.addBox(c.x, c.z, hw * 2 + 1.3, 0.5, LIONS.rot, -8, WY + 1.4); }      // nobody walks into the river: a barrier at the water's edge
      if (ph.addHole) { const c = LIONS.w(0, 2.2); ph.addHole(c.x, c.z, hw * 2, 3.7, LIONS.rot); }
      svc.crowd.push({ x: mid(v1b, v2a).x, z: mid(v1b, v2a).z, r: 5, n: 6, kind: 'descent', y: -n1 * rise });
    }
  } finally { P.pop(); }
  const sp = LIONS.w(-4, -5);
  svc.photoSpots.push({ x: sp.x, z: sp.z, yaw: L.yawToward ? L.yawToward(sp.x, sp.z, LIONS.w(LIONS.half, 0).x, LIONS.w(LIONS.half, 0).z) : 180, name: 'Спуск со львами Ши-цза' });
  svc.crowd.push({ x: sp.x, z: sp.z, r: 5, n: 8, kind: 'tourists' });
}
