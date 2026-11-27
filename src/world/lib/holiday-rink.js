// Surveyed seasonal rink surfaces, open boards and overhead lights.
import * as THREE from 'three';
import { PITCHES } from '../data/city.js';
import { registerLOD } from '../../core/spatial.js';
import { knockBays, splitBays } from './fence-bays.js';
import { knockInstances } from './knock-inst.js';
import { VB, mtx } from '../traffic/vb.js';

const iceY = .14;
const bulbColors = ['#ffe29e', '#ffaf80', '#f3eac7', '#a6d9d4'];

// Intersect parallel lighting runs with the measured perimeter so both cable
// ends meet the boards, also on the clipped pavilion side of the lawn.
function lightMasts(ring, cx, cz, yaw, rows) {
  const spots = [], nx = Math.sin(yaw), nz = Math.cos(yaw);
  for (const u of rows) {
    const footX = cx + nz*u, footZ = cz - nx*u, cuts = [];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i+1) % ring.length];
      const da = (a[0]-footX)*nz - (a[1]-footZ)*nx;
      const db = (b[0]-footX)*nz - (b[1]-footZ)*nx;
      if ((da < 0) === (db < 0)) continue;
      const f = da/(da-db);
      cuts.push([a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f]);
    }
    if (cuts.length !== 2) continue;
    const [[ax,az],[bx,bz]] = cuts, rotY = Math.atan2(bx-ax,bz-az), span = Math.hypot(bx-ax,bz-az)/2;
    spots.push({ x: ax, z: az, y: iceY, rotY, span }, { x: bx, z: bz, y: iceY, rotY: rotY+Math.PI, span });
  }
  return spots;
}

export function buildHolidayRink(ctx, glow, site) {
  const { cx, cz, name, fixtures, openings, rows, yaw } = site;
  if (ctx.season !== 'winter' || !ctx.L.inPlay(cx, cz)) return;
  const flat = PITCHES.find(p => p.id === site.pitch)?.polys[0].o;
  if (!flat) return;
  const ring = [];
  for (let i = 0; i < flat.length; i += 2) ring.push([flat[i], flat[i+1]]);

  const shape = new THREE.Shape(ring.map(([x,z]) => new THREE.Vector2(x-cx, cz-z)));
  const geo = new THREE.ShapeGeometry(shape).rotateX(-Math.PI/2);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i)/20, uv.getY(i)/20);
  const map = ctx.tex.draw(512, 512, (g, w, h) => {
    const rnd = ctx.rng(fixtures + '-skate-marks');
    g.fillStyle = '#b9d3db'; g.fillRect(0,0,w,h);
    for (let i = 0; i < 185; i++) {
      const x = rnd()*w, z = rnd()*h, r = 14 + rnd()*118, a = rnd()*Math.PI*2, end = a + .24 + rnd()*1.45;
      g.lineWidth = .55 + rnd()*1.2;
      g.strokeStyle = i % 4 ? 'rgba(249,253,249,.48)' : 'rgba(94,135,155,.24)';
      // Wrap arcs over every crossed edge of this 20 m tile.
      for (const dx of [-w,0,w]) for (const dz of [-h,0,h]) {
        if (x+dx+r < 0 || x+dx-r > w || z+dz+r < 0 || z+dz-r > h) continue;
        g.beginPath(); g.arc(x+dx,z+dz,r,a,end); g.stroke();
      }
    }
  }, { key: name + '-scratches', repeat: [1, 1] });
  const ice = new THREE.Mesh(geo, ctx.mat.toon('#ffffff', { map, name: name + '-ice', paint: 0 }));
  ice.name = name + '-ice'; ice.position.set(cx, iceY, cz); ice.receiveShadow = true;
  ctx.noOutline(ice); ctx.addStatic(ice); ice.updateMatrixWorld(true); registerLOD(ice, 480);
  const pos = geo.attributes.position, index = geo.index;
  for (let i = 0; i < index.count; i += 3) {
    ctx.physics.addWalkTriangle([0,1,2].map(j => {
      const n = index.getX(i+j); return [cx+pos.getX(n), iceY, cz+pos.getZ(n)];
    }), .1);
  }

  // Leave two 6 m openings on the long sides of the rink.
  const bays = [];
  for (let i = 0; i < ring.length; i++) {
    const [ax,az] = ring[i], [bx,bz] = ring[(i+1) % ring.length], dx = bx-ax, dz = bz-az;
    const cut = 3/Math.hypot(dx,dz);
    const intervals = openings.includes(i) ? [[0,.5-cut],[.5+cut,1]] : [[0,1]];
    for (const [s,t] of intervals) bays.push(...splitBays(ax+dx*s,az+dz*s,ax+dx*t,az+dz*t,2.85,{ y: iceY }));
  }
  const mat = ctx.mat.toon('#ffffff', { vertexColors: true, name: name + '-wood' });
  const board = new VB();
  for (let i = 0; i < 5; i++) board.box(.994, .177, .10, i%2 ? '#a27551' : '#b88960', [.5,.11+i*.18,0]);
  board.box(1, .09, .18, '#e8e3d4', [.5,.95,0]);
  board.box(.04, .97, .17, '#785743', [.025,.49,0]);
  knockBays(ctx, { name: fixtures + '-rink-boards', bays, far: 250,
    parts: [{ geo: board.build(), mat, stretch: true }],
    collider: { y0: iceY, y1: iceY+1, thick: .18, e0: 0, e1: 0 },
    rec: { kind: 'fence', mass: 105, h: 1, anchored: 12 },
  });

  const mast = new VB(), line = new VB(), lights = new VB();
  mast.cyl(.11,.17,5.65,'#755844',[0,2.825,0],null,8);
  const height = t => 4.44 + 1.12*(1-t)*(1-t);
  for (let i = 0; i < 10; i++) {
    const t = i/10, next = (i+1)/10, mid = (t+next)/2;
    line.rod([0,height(t),20*t],[0,height(next),20*next],.034,'#59584d',5);
    line.rod([0,height(mid),20*mid],[0,height(mid)-.23,20*mid],.035,'#5c564b',5);
    lights.sph(.144,bulbColors[i%4],[0,height(mid)-.28,20*mid],6);
  }
  const place = s => mtx([s.x,s.y,s.z], [0,s.rotY,0], [1,1,s.span/20]);
  knockInstances(ctx, { name: fixtures + '-rink-garlands', spots: lightMasts(ring, cx, cz, yaw, rows), far: 265,
    parts: [{ geo: mast.build(), mat }, { geo: line.build(), mat, place, shadow: false },
      { geo: lights.build(), mat: glow, place, noOutline: true, shadow: false }],
    items: (_,s) => ctx.physics.addCylinder(s.x,s.z,.17,s.y,s.y+5.65),
    rec: { kind: 'lamp', r: .17, h: 5.65, mass: 140, anchored: 16 },
  });
}
