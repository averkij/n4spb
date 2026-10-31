import { portedRailings } from '../lib/ported-railings.js';
// landmarksKronverk/zoo.js - the ENTRANCE OF THE LENINGRAD ZOO (Alexander Park 1; dossier docs/research/kronverk.md section 7; photos refs/kronverk 68 69 70) and the picket FENCES of the zoo and of the
// museum territory.  The entrance pavilion r3296319: one storey of pale limestone, a flat roof slab on square piers along its north front, a rubble-stone wall with round-arched ticket windows, two white
// lions on rubble plinths, white vases, the wordmark «ЗООПАРК» with a white bear on the roof (a plain pictogram, no logo); the house r3296318 behind it; the gate posts at the OSM gate nodes.
// The zoo inside stays generic (city / environment).  Fences: black spear pickets 2.4 m as alpha-tested panels on the OSM fence ways (gaps at the mapped gates and where a way crosses asphalt), with colliders.
import * as THREE from 'three';
import { BARRIERS, BARRIER_NODES } from '../data/city.js';
import { ringEdges, onEdge } from './kit.js';
import { byId, pairs, dist, centroid, rotOut, rotOf } from './frame.js';
import { house } from './house.js';
import { C } from './mats.js';
import { lion, cached, figureMats } from '../lib/figures.js';

const FENCES = ['w916761500', 'w916761501', 'w135306252', 'w135306251', 'w135306250', 'w310701122', 'w135844803'];

export function build(K) {
  const errs = [];
  for (const [name, fn] of [['entrance', entrance], ['fences', fences]]) { try { fn(K); } catch (e) { console.error(`[landmarksKronverk] zoo/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } }
  if (errs.length) throw new Error(errs.join('\n'));
}

function entrance(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics, fm = figureMats(ctx);
  const rec = byId('r3296319'); if (!rec) return;
  const Hh = 5.2;
  const zooBay = M.bay('zoo-wall', 4.4, Hh, (D) => {
    const w = D.wM; D.rect(0, 0, w, D.hM, '#8f877c');
    for (let j = 0; j < 9; j++) for (let i = -1; i < 9; i++) { const k = 0.86 + D.r() * 0.28; D.rect(i * 0.56 + (j % 2) * 0.28 + 0.03, j * 0.48 + 0.03, i * 0.56 + (j % 2) * 0.28 + 0.53, j * 0.48 + 0.45, `rgb(${168 * k | 0},${158 * k | 0},${144 * k | 0})`); }
    D.rect(0, 0, w, 0.5, C.zooD);
    D.fillArch(w / 2, 0.95, 2.7, 2.9, C.zoo); D.fillArch(w / 2, 1.05, 2.3, 2.6, '#e9e6dc'); D.rect(w / 2 - 1.15, 2.5, w / 2 + 1.15, 3.05, '#6aa23e'); D.rect(w / 2 - 1.15, 1.05, w / 2 + 1.15, 2.5, '#3c4a52');
    D.rect(w / 2 - 0.03, 1.05, w / 2 + 0.03, 2.5, '#e9e6dc'); D.rect(w / 2 - 1.3, 0.92, w / 2 + 1.3, 1.05, C.zoo);
    D.rect(0, D.hM - 1.0, w, D.hM, C.zoo); D.rect(0, D.hM - 1.04, w, D.hM - 1.0, 'rgba(60,50,40,0.4)');
  }, [256, 256]);
  const st = { H: Hh, bay: 4.4, mat: zooBay, trim: C.zoo, roof: 'roofZinc', flat: true, parapet: 0.3, cornice: 0.5, plain: M.zoo };
  const { edges } = house(K, rec, st);
  // the portico: square piers and a roof slab before every long north-facing wall
  const lions = [];
  for (const e of edges) {
    if (e.hole || e.len < 30 || e.n[1] > -0.55) continue;
    onEdge(P, e, (len, f) => {
      const n = Math.max(2, Math.round(len / 4.4)), w = len / n;
      for (let i = 0; i <= n; i++) { const x = Math.min(len - 0.4, Math.max(0.4, i * w)); P.box(M.zoo, x - 0.4, x + 0.4, 0, Hh - 0.9, 2.6, 3.4, 'b', 2); ph.addBox(f.x + f.xa[0] * x + e.n[0] * 3.0, f.z + f.xa[1] * x + e.n[1] * 3.0, 0.8, 0.8, f.rot, 0, Hh); }
      P.box(M.zoo, -0.3, len + 0.3, Hh - 0.9, Hh + 0.1, 0, 3.9, 'k', 2); P.box(M.underside, 0, len, Hh - 0.92, Hh - 0.9, 0, 3.6, 'tlrfk', 1);
      P.box(M.graniteGrey, -0.3, len + 0.3, 0, 0.16, 0, 4.2, 'bk', 2);
      lions.push([f.x + f.xa[0] * (len * 0.5 - 5) + e.n[0] * 5.6, f.z + f.xa[1] * (len * 0.5 - 5) + e.n[1] * 5.6, f.rot], [f.x + f.xa[0] * (len * 0.5 + 5) + e.n[0] * 5.6, f.z + f.xa[1] * (len * 0.5 + 5) + e.n[1] * 5.6, f.rot]);
      // the wordmark with the white bear on the roof
      const board = M.sign('zoo-word', 1024, 192, ['ЗООПАРК'], { bg: '#efece2', fg: '#b5482c', font: M.FONT.sans, pad: 0.25 });
      const bx = len / 2;
      P.box(M.white, bx - 4.6, bx + 4.6, Hh + 0.1, Hh + 1.7, 3.3, 3.5, 'b', 2); P.quad(board, [bx - 4.5, Hh + 0.15, 3.51], [bx + 4.5, Hh + 0.15, 3.51], [bx + 4.5, Hh + 1.65, 3.51], [bx - 4.5, Hh + 1.65, 3.51], [0, 0, 1]);
      // the white bear: body, head, legs (a flat cut-out silhouette 0.14 m thick)
      const by = Hh + 1.7; P.box(M.white, bx - 1.5, bx + 1.1, by + 0.55, by + 1.45, 3.33, 3.47, '', 2); P.box(M.white, bx + 0.9, bx + 1.9, by + 0.9, by + 1.55, 3.33, 3.47, '', 2); P.box(M.white, bx + 1.8, bx + 2.25, by + 0.95, by + 1.25, 3.33, 3.47, '', 2);
      for (const lx of [-1.35, -0.7, 0.35, 0.9]) P.box(M.white, bx + lx - 0.17, bx + lx + 0.17, by, by + 0.6, 3.33, 3.47, 'b', 2);
    });
  }
  // two white lions on rubble plinths, white vases
  const mkW = { main: M.white, dark: M.white, accent: M.white };
  const li = cached('lmKr-zoo-lion', () => lion({ pose: 'sit', detail: 0.45, head: { turn: 0.2 }, tail: 'curl' }));
  svc.zooLions = lions.length; lions.slice(0, 2).forEach(([x, z, rot], i) => {
    P.push(x, 0, z, rot); P.box(M.rubble, -0.9, 0.9, 0, 1.25, -1.5, 1.5, 'b', 2); P.box(M.zoo, -1.0, 1.0, 1.25, 1.4, -1.6, 1.6, '', 2);
    P.pop(); li.place(P, mkW, x, 1.4, z, rot + (i ? -0.25 : 0.25), 1.0); ph.addBox(x, z, 2.0, 3.2, rot, 0, 2.8);
    const vx = x + Math.cos(rot) * (i ? 2.6 : -2.6), vz = z - Math.sin(rot) * (i ? 2.6 : -2.6);
    P.cyl(M.white, [vx, 0, vz], [vx, 0.5, vz], 0.35, 0.22, 10, true); P.cyl(M.white, [vx, 0.5, vz], [vx, 1.05, vz], 0.25, 0.55, 12, false); P.cyl(M.white, [vx, 1.0, vz], [vx, 1.05, vz], 0.5, 0.5, 12, true); ph.addCylinder(vx, vz, 0.5, 0, 1.1);
  });
  // the house behind (1A) and the gate posts
  const r2 = byId('r3296318'); if (r2) house(K, r2, { key: 'zoo-house', H: 8.2, bay: 3.8, trim: '#efe8d6', roof: 'roofGreen', cornice: 0.4, fac: { wall: '#e3d6ae', trim: '#f2ecd8', socle: '#9a948a', socleH: 0.7, floors: [{ h: 3.9, win: 'rect', ww: 1.4, wh: 2.0, sill: 1.0 }, { h: 3.8, win: 'rect', ww: 1.4, wh: 2.0, sill: 0.9 }], cornice: 0.5 } });
  const gates = BARRIER_NODES.filter((nn) => nn.kind === 'gate' && Math.hypot(nn.x + 2357.2, nn.z + 2326.7) < 4);
  if (gates.length === 2) {
    const [a, b] = gates, l = dist([a.x, a.z], [b.x, b.z]), t = [(b.x - a.x) / l, (b.z - a.z) / l], c = [(a.x + b.x) / 2, (a.z + b.z) / 2];
    for (const s of [-1, 1]) { const x = c[0] + t[0] * s * 3.2, z = c[1] + t[1] * s * 3.2; P.box(M.rubble, x - 0.45, x + 0.45, 0, 3.0, z - 0.45, z + 0.45, 'b', 2); P.box(M.zoo, x - 0.55, x + 0.55, 3.0, 3.2, z - 0.55, z + 0.55, '', 2); ph.addBox(x, z, 0.9, 0.9, 0, 0, 3.2); }
  }
  const c = centroid(pairs(rec.polys[0].o));
  svc.entrances.push({ x: c[0], z: c[1] - 8, rotY: Math.PI, name: 'Ленинградский зоопарк (касса и вход)', bldg: 'r3296319' });
  svc.photoSpots.push({ x: c[0], z: c[1] - 26, yaw: 180, name: 'Вход в Ленинградский зоопарк' }); svc.crowd.push({ x: c[0], z: c[1] - 12, r: 9, n: 10, name: 'у входа в зоопарк' });
  void ringEdges; void THREE;
}

function fences(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics;
  // one 3 m panel: two rails, spear pickets every 0.15 m, transparent between them
  const tex = M.tex(256, 256, 'picket', (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#1b1d1f';
    g.fillRect(0, h * 0.2, w, 7); g.fillRect(0, h * 0.86, w, 8);
    for (let i = 0; i < 20; i++) { const x = (i + 0.5) * w / 20; g.fillRect(x - 2, h * 0.08, 4, h * 0.92); g.beginPath(); g.moveTo(x - 5, h * 0.09); g.lineTo(x, 0); g.lineTo(x + 5, h * 0.09); g.closePath(); g.fill(); }
  });
  const mat = ctx.mat.toon('#ffffff', { map: tex, name: 'lmKr-picket', alphaTest: 0.5, side: 'double', paint: 0 }); M.cutouts.add(mat);
  const net = ctx.services?.streets?.net, onRoad = (x, z) => (net && net.cover ? net.cover(x, z, {}) > -0.4 : ctx.L.isOnRoad(x, z, 0.4));
  const gateNodes = BARRIER_NODES.filter((nn) => nn.kind === 'gate' || nn.kind === 'lift_gate');
  const Hf = 2.4; let total = 0; const bays=[];
  for (const id of FENCES) {
    const f = BARRIERS.find((b) => b.id === id); if (!f) continue;
    const pts = pairs(f.pts);
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], l = dist(a, b); if (l < 0.5) continue;
      const t = [(b[0] - a[0]) / l, (b[1] - a[1]) / l], rot = rotOf(t[0], t[1]), n = Math.max(1, Math.round(l / 3)), w = l / n;
      for (let k = 0; k < n; k++) {
        const x0 = a[0] + t[0] * k * w, z0 = a[1] + t[1] * k * w, xm = x0 + t[0] * w / 2, zm = z0 + t[1] * w / 2;
        if (onRoad(xm, zm) || onRoad(x0, z0) || gateNodes.some((gn) => Math.hypot(gn.x - xm, gn.z - zm) < 2.4) || ctx.L.inRiver(xm, zm)) continue;
        bays.push({x0,z0,x1:x0+t[0]*w,z1:z0+t[1]*w,y:0}); total += w;
      }
    }
    svc.fences.push({ id, kind: 'picket', h: Hf });
  }
  portedRailings(ctx,'kronverk-zoo-fence',bays,mat,{height:Hf});
  svc.fenceLength = Math.round(total);
}
