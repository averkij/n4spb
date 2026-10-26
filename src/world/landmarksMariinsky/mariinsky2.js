// landmarksMariinsky/mariinsky2.js - MARIINSKY-II (Вторая сцена, Декабристов 34; Diamond Schmitt / VIPS, opened 2013; OSM w182876241, 11 389 m2, 18 vertices): a beige limestone body (panels with horizontal
// joints, tall narrow window slits), the glass foyer box at the south end of its Kryukov-canal front with a deep glass-and-steel entrance canopy at 5.5 m, a glazed inclined canopy on the roof with steel
// posts.  Heights from the photo scale (people 1.7 m): stone body 25 m, glass foyer 20 m (OSM says 19 m).  Dossier docs/research/mariinsky.md section 6; photos 60 62 64 (the interiors are not modelled).
import * as THREE from 'three';
import { BUILDINGS } from '../data/city.js';
import { ringEdges, onEdge, band, archPath } from './kit.js';
import { ringFlat } from './geo.js';

const H = 25.0, HG = 20.0;

export function build(K, M, D, svc) {
  const P = K.P, ctx = K.ctx, T = ctx.mat.toon, tex = ctx.tex, ph = ctx.physics;
  const rec = BUILDINGS.find((b) => b.id === 'w182876241'); if (!rec) return;
  const poly = rec.polys[0];
  const edges = ringEdges(poly, 0.05).filter((e) => !e.hole);
  const stone = T('#ffffff', { map: tex.draw(128, 128, (g, w, h) => {
    g.fillStyle = '#d9cba9'; g.fillRect(0, 0, w, h); g.fillStyle = '#c4b692';
    for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 2);
    for (let r = 0; r < 4; r++) g.fillRect(((r % 2) * 64) % w, r * 32, 2, 32);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(150,130,90,${0.05 + (i % 3) * 0.03})`; g.fillRect((i * 37) % w, (i * 53) % h, 18, 8); }
  }, { key: 'lmM-m2stone', repeat: [1, 1] }), name: 'lmM-m2stoneMat', paint: 0.03 });
  const curtain = T('#ffffff', { map: tex.draw(128, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9bb8b2'); gr.addColorStop(1, '#5f7d7a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.moveTo(10, h); g.lineTo(70, 0); g.lineTo(100, 0); g.lineTo(40, h); g.fill();
    g.fillStyle = '#4c545c'; g.fillRect(0, 0, w, 6); g.fillRect(0, 0, 5, h); g.fillRect(0, h - 4, w, 4); g.fillRect(w - 3, 0, 3, h);
    g.fillStyle = 'rgba(240,235,220,0.55)'; g.fillRect(34, 60, 12, 190); g.fillRect(84, 150, 10, 100);      // light columns / interior seen through the glass
  }, { key: 'lmM-m2curtain', repeat: [1, 1] }), name: 'lmM-m2curtainMat', paint: 0.01 });
  const glassRoof = T('#bfd8d6', { name: 'lmM-m2roofGlass', side: 'double', transparent: true, opacity: 0.55, paint: 0, depthWrite: false });
  K.decalMats.add(glassRoof);
  // the canal front (outward normal to the east) from north to south: the glass foyer box (z 720..766, by the Dekabristov bridge), the low yellow arcade of the historic Litovsky-market wing (z 766..802,
  // photos 60 / 64: two storeys with round arches and a dark pitched roof; the stone body stands 6 m behind it), then the stone wall down to the skybridge and the Torgovy end
  const kindOf = (e) => { const mx = (e.a[0] + e.b[0]) / 2, mz = (e.a[1] + e.b[1]) / 2; if (e.n[0] > 0.5 && mx > -3185 && mx < -3125) { if (mz > 721 && mz < 766 && e.len > 4) return 'glass'; if (mz >= 766 && mz < 802 && e.len > 20) return 'arcade'; } return 'stone'; };
  const ARC_H = 9.5, SET = 6.0;
  const arcadeMat = T('#e9cf92', { name: 'lmM-m2arcade', paint: 0.04 }), arcadeRoof = T('#5e4a42', { name: 'lmM-m2arcadeRoof', side: 'double', paint: 0.03 });
  for (const e of edges) {
    e.kind = kindOf(e); e.glass = e.kind === 'glass'; e.H = e.glass ? HG : H;
    onEdge(P, e, (len) => {
      if (e.kind === 'glass') {
        K.wallQuad(curtain, 0, len, 0.0, HG, 1.5, 0, 3.3);
        for (let x = 0; x <= len + 0.01; x += 1.5) P.box(M.m2Steel, x - 0.05, x + 0.05, 0, HG, 0, 0.14, 'kb');
        for (let y = 3.3; y < HG; y += 3.3) P.box(M.m2Steel, 0, len, y - 0.05, y + 0.05, 0, 0.14, 'kb');
        for (let x = 3; x < len - 1; x += 6) P.cyl(M.trim, [x, 0, -0.5], [x, 11, -0.5], 0.45, 0.45, 10, false);
        P.box(M.m2Steel, 0.3, len - 0.3, 5.3, 5.55, 0, 5.2, '');                                  // the entrance canopy, projecting 5.2 m
        P.box(glassRoof, 0.5, len - 0.5, 5.56, 5.6, 0.1, 5.1, 'b');
        for (let x = 1.5; x < len - 1; x += 7.5) P.cyl(M.m2Steel, [x, 0, 5.0], [x, 5.3, 5.0], 0.09, 0.09, 6, false);
      } else if (e.kind === 'arcade') {
        // yellow arcade: wall to 9.5 m with 8 round arches (open galleries with dark interiors), cornice, pitched roof sloping back; the stone body rises behind
        K.wallQuad(arcadeMat, 0, len, 0, ARC_H, 3);
        const n = Math.round(len / 4.4), p = len / n;
        for (let i = 0; i < n; i++) {
          const x = p * (i + 0.5);
          { const sh = new THREE.Shape(); archPath(sh, x, 0, 2.0, 3.4, false); P.face(M.doorDark, sh, 0.03, 1, 8); } K.surround(M.trim, x, 0, 2.0, 4.4, 'arch', 0.25, 0.1);
          K.window({ x, y: 5.6, w: 1.2, h: 2.4, head: 'arch', sw: 0.18, d: 0.08, surMat: M.trim, sill: false, frame: 'white' });
        }
        P.box(M.trim, 0, len, ARC_H - 0.5, ARC_H, 0, 0.45, 'kb'); P.box(M.trim, 0, len, 4.7, 5.0, 0, 0.18, 'kb');
        P.quad(arcadeRoof, [0, ARC_H, 0.2], [len, ARC_H, 0.2], [len, ARC_H + 2.4, -SET + 0.4], [0, ARC_H + 2.4, -SET + 0.4], [0, 0.7, 0.7]);
        // the stone body behind: wall quad from 9.5 m up, set back 6 m, with the slits
        P.push(0, 0, -SET);
        try { K.wallQuad(stone, 0, len, ARC_H, H, 2.4, 0, 2.4); for (let x = 1.6; x < len - 1.0; x += 3.0) P.box(M.glassDark, x - 0.3, x + 0.3, 11.2, 22.8, 0, 0.12, 'kb'); } finally { P.pop(); }
        P.box(M.m2Stone, 0, len, ARC_H + 2.3, H, -SET - 0.02, -SET + 0.02, 'kbtb');
      } else {
        K.wallQuad(stone, 0, len, 0, H, 2.4, 0, 2.4);
        for (let x = 1.6; x < len - 1.0; x += 3.0) {
          P.box(M.glassDark, x - 0.3, x + 0.3, 2.8, 10.0, 0, 0.12, 'kb');
          P.box(M.glassDark, x - 0.3, x + 0.3, 11.2, 22.8, 0, 0.12, 'kb');
        }
        if (len > 12) { const x = len / 2; P.box(M.glassDark, x - 2.2, x + 2.2, 11.5, 19.5, 0, 0.14, 'kb'); }
      }
    });
  }
  band(P, edges, 0, 0.6, 0.1, { front: M.graniteDark, top: M.graniteDark }, { draw: (e) => e.kind === 'stone' });
  band(P, edges, (e) => e.H, (e) => e.H + 0.4, 0.15, { front: M.m2Stone, top: M.m2Stone, under: M.graniteLight }, { draw: (e) => e.kind !== 'arcade' });
  // roof: flat cap (stone parapet), a raised plant box, and the inclined glazed "shell" canopy on steel posts over the foyer end
  const ring = ringFlat(poly.o);
  P.cap(M.roofDark, ring, H + 0.02, true, 1.2);
  const cx = -3205, cz = 805;
  // shell: a plane tilted 6 deg over a 40 x 50 m area at the south-east part of the roof
  const pts = [[-3176, 733], [-3169, 758], [-3221, 779], [-3236, 752]];
  const hts = [H + 1.6, H + 1.8, H + 5.8, H + 5.4];
  P.quad(glassRoof, [pts[0][0], hts[0], pts[0][1]], [pts[1][0], hts[1], pts[1][1]], [pts[2][0], hts[2], pts[2][1]], [pts[3][0], hts[3], pts[3][1]], [0, 1, 0]);
  for (let i = 0; i < 4; i++) { const a = pts[i], b = pts[(i + 1) % 4]; P.cyl(M.m2Steel, [a[0], H, a[1]], [a[0], hts[i], a[1]], 0.14, 0.14, 6, false); P.cyl(M.m2Steel, [a[0], hts[i], a[1]], [b[0], hts[(i + 1) % 4], b[1]], 0.1, 0.1, 6, false); }
  for (let k = 1; k < 7; k++) { const t = k / 7; const a = [pts[0][0] + (pts[3][0] - pts[0][0]) * t, pts[0][1] + (pts[3][1] - pts[0][1]) * t, hts[0] + (hts[3] - hts[0]) * t], b = [pts[1][0] + (pts[2][0] - pts[1][0]) * t, pts[1][1] + (pts[2][1] - pts[1][1]) * t, hts[1] + (hts[2] - hts[1]) * t]; P.cyl(M.m2Steel, [a[0], a[2], a[1]], [b[0], b[2], b[1]], 0.07, 0.07, 5, false); }
  P.box(M.m2Stone, cx - 12, cx + 12, H, H + 3.2, cz - 8, cz + 8, 'b'); void cx;
  // colliders: thin walls round the footprint
  for (const e of edges) { const dx = e.b[0] - e.a[0], dz = e.b[1] - e.a[1], l = Math.hypot(dx, dz); if (l < 0.3) continue; ph.addBox((e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2, l + 0.45, 0.9, Math.atan2(-dz, dx), 0, e.H + 1); }
  svc.entrances.push({ x: -3162, z: 745, name: 'Мариинский-2: вход', kind: 'main', rotY: Math.atan2(0.95, -0.3) });
  svc.crowd.push({ x: -3150, z: 742, r: 8, n: 5, name: 'mariinsky2-terrace' });
}
