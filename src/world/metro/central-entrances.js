// Street entrances shared by the district pages and the working metro in strip.html.
import * as THREE from 'three';
import { PITS, STATIONS, UNDERPASS_Y } from '../data/metro.js';
import { centralExtraDoors, centralStreetDoors } from './central-locations.js';
export { centralMetroEntranceIds } from './central-locations.js';
import { portalModels, portalPalette } from './central-entrance-mesh.js';
import { extrudeX } from './lib.js';

const kinds = {
  'vosstaniya-in': 'rotunda', 'vosstaniya-out': 'rotunda', 'vosstaniya2-in': 'railway',
  'mayakovskaya-in': 'nevsky-atrium', 'mayakovskaya-out': 'marata',
  'vladimirskaya-in': 'vladimir', 'dostoevskaya-in': 'passage',
  'admiralteyskaya-in': 'admiral', 'admiralteyskaya-in2': 'admiral',
  'gostiny-in': 'gallery', 'gostiny-out': 'gallery',
  'nevsky-canal': 'engelhardt', 'gostiny-canal': 'canal',
  'vosstaniya-ligovsky': 'railway', 'vosstaniya-court': 'railway', 'vosstaniya-colonnade': 'railway',
  'vladimirskaya-kuznechny': 'vladimir', 'dostoevskaya-passage-in': 'passage',
  'dostoevskaya-passage-out': 'passage', 'admiralteyskaya-east': 'admiral', 'gostiny-sadovaya': 'gallery',
};
const stationById = new Map(Object.values(STATIONS).flat().map(s => [s.id,s]));
const colors = portalPalette.map(css => new THREE.Color(css));
function bytes(encoded) {
  return Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
}

function portalGeometry(kind) {
  const [vertices, indices, palette] = portalModels[kind].map(bytes);
  const positions = Float32Array.from(new Int16Array(vertices.buffer), n => n / 1000);
  const tint = new Float32Array(palette.length * 3);
  for (let i = 0; i < palette.length; i++) colors[palette[i]].toArray(tint, i * 3);
  const mesh = new THREE.BufferGeometry();
  mesh.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  mesh.setAttribute('color', new THREE.BufferAttribute(tint, 3));
  mesh.setIndex(new THREE.BufferAttribute(new Uint16Array(indices.buffer), 1));
  mesh.computeVertexNormals();
  mesh.computeBoundingSphere();
  return mesh;
}

function label(ctx, station, exit) {
  const s = stationById.get(station), text = exit ? 'Выход в город' : s.name;
  const texture = ctx.tex.draw(512, 112, (g, w, h) => {
    g.fillStyle = '#e9e6de';
    ctx.tex.roundRect(g, 2, 2, w - 4, h - 4, 50); g.fill();
    g.fillStyle = '#243a73'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold 69px sans-serif'; g.fillText('М', 47, h / 2 + 3);
    g.fillStyle = '#263138';
    ctx.tex.fitText(g, text, 276, 41, 377, 44, 'sans-serif', 700);
    ctx.tex.fitText(g, exit ? 'Way out' : s.nameEn, 276, 81, 370, 25, 'sans-serif', 500);
  }, { key: 'central-metro-plate-' + station + (exit ? '-out' : '') });
  return ctx.mat.decal('#ffffff', { map: texture });
}

function point(x, z, yaw, side, depth) {
  return [x + Math.cos(yaw) * side + Math.sin(yaw) * depth,
          z - Math.sin(yaw) * side + Math.cos(yaw) * depth];
}

function doorColliders(ctx, d, kind, working) {
  const scale = d.w / 3.4;
  const at = (side, depth) => point(d.x, d.z, d.rotY, side, depth);
  if (kind === 'gallery') {
    if (!working) for (const side of [-1, 1]) {
      ctx.physics.addBox(...at(side * 1.22, -.17), .63, .075, d.rotY, 0, 2.6);
    }
    return;
  }
  const recessed = ['nevsky-atrium', 'marata', 'engelhardt', 'canal', 'admiral'].includes(kind);
  const depth = recessed ? -.25 : .10;
  for (const side of [-1, 1]) {
    ctx.physics.addBox(...at(side * 1.285 * scale, depth), .65 * scale, .10, d.rotY, 0, 2.48);
  }
  const angle = 78 * Math.PI / 180;
  const dx = .73 * Math.cos(angle) * scale, dz = -.73 * Math.sin(angle);
  ctx.physics.addBox(...at(-.96 * scale + dx / 2, depth + dz / 2),
    Math.hypot(dx, dz), .09, d.rotY + Math.atan2(-dz, dx), 0, 2.48);
}

function surfaceLobby(ctx, g, d, m) {
  const k = ctx.kit(g), w = d.w, deep = 3.0;
  const at = (a, b) => point(d.x, d.z, d.rotY, a, b);
  k.box(w + .30, .13, deep + .85, m.walk, [0, .047, -deep / 2 + .20]);
  k.box(w + .30, .16, deep, m.ceiling, [0, 3.30, -deep / 2]);
  // A short vestibule on pages without the line. Its solid back and sides keep
  // the entrance reversible and prevent walking into the unbuilt station.
  for (const side of [-1, 1]) {
    const a = side * (w / 2 + .045);
    k.box(.16, 3.25, deep + .12, m.wall, [a, 1.66, -deep / 2]);
    ctx.physics.addBox(...at(a, -deep / 2), .16, deep+.12, d.rotY, -.4, 3.4);
  }
  k.box(w+.3, 3.3, .17, m.wall, [0, 1.68, -deep]);
  for (const side of [-1,1]) {
    const a=side*w*.22;
    k.box(w*.32, 1.38, .06, m.dark, [a, 1.30, -deep+.11]);
    k.box(w*.28, .67, .05, m.window, [a, 1.56, -deep+.155]);
  }
  k.box(w*.58, .035, .23, m.light, [0, 3.19, -deep*.48]);
  ctx.physics.addBox(...at(0, -deep), w+.3, .17, d.rotY, -.5, 3.5);
  ctx.physics.addWalkBox(...at(0, -deep/2+.20), w+.3, deep+.85, d.rotY, g.position.y + .112, -.25);
}

function entranceSteps(ctx, g, d, m) {
  const k = ctx.kit(g), count = d.steps, rise = .14, tread = .33;
  for (let i = 0; i < count; i++) {
    const depth = .60 + (i + .5) * tread, top = -.14 * (i + 1) + .098;
    k.box(d.w + .08, .16, tread, m.walk, [0,top-.08,depth]);
    const at = point(d.x,d.z,d.rotY,0,depth);
    ctx.physics.addWalkBox(...at,d.w+.08,tread+.003,d.rotY,g.position.y+top,-.2);
  }
}

function lowerRail(k, side, run, height, metal) {
  const start = new THREE.Vector3(side * 2.07, height, .08);
  const end = new THREE.Vector3(side * 2.07, height - 4.5, run);
  const dir = end.clone().sub(start);
  const rail = k.cyl(.046, .046, dir.length(), metal, start.clone().add(end).multiplyScalar(.5).toArray(), null, 7);
  rail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  for (const f of [.10, .44, .78, .98]) {
    k.box(.05, .10, .22, metal, [side * 2.16, height - 4.5 * f, run * f]);
  }
}

function stairs(ctx, p, gallery, plate, m) {
  const [x, z] = p.mouth;
  const yaw = Math.atan2(p.e[0], p.e[1]), run = 4.5 / Math.tan(Math.PI / 6), n = 30;
  const end = Math.max(run + .65, (p.foot[0] - x) * p.e[0] + (p.foot[1] - z) * p.e[1] + .1);
  const at = (a,b) => point(x,z,yaw,a,b);
  const g = new THREE.Group(); g.name = 'central-metro-' + p.id;
  g.position.set(x, 0, z); g.rotation.y = yaw; ctx.addStatic(g);
  const k = ctx.kit(g);
  for (let i = 0; i < n; i++) {
    const top = -4.5 * (i + 1) / n;
    k.box(4.46, .17, run / n, i === 0 ? m.yellow : m.walk, [0, top - .085, (i + .5) * run / n]);
  }
  const profile = [[0, .95], [4.45, .95], [4.45, 0], [end, 0], [end, -4.85], [run, -4.85], [0, -.32]];
  for (const sign of [-1, 1]) {
    const side = sign * 2.40;
    g.add(new THREE.Mesh(extrudeX(profile, side - .19, side + .19), m.granite));
    k.box(.46, .12, 4.48, m.cap, [side, 1.00, 2.22]);
    lowerRail(k, sign, run, .92, m.dark);
    ctx.physics.addBox(...at(side, run / 2), .4, run + .20, yaw, -5.2, 1.05);
  }
  // The photographed identification strip hangs on the far wall below pavement
  // level and is visible from above; no crossbar spans the dry pavement.
  k.box(4.58, .82, .24, m.granite, [0, .57, 4.49]);
  k.box(4.68, .11, .35, m.cap, [0, 1.02, 4.49]);
  k.plane(2.67, .55, plate, [0, .28, 4.35], [0, Math.PI, 0]).castShadow = false;
  k.box(4.53, .18, end-4.42, m.ceiling, [0, -.14, (end+4.42)/2]);
  k.box(4.48, .12, end-run+.06, m.walk, [0, -4.56, (run+end)/2]);
  k.box(1.4, .045, .15, m.light, [0, -.27, 5.05]);
  ctx.physics.addStairs(...at(0, run / 2), 4.30, run, yaw, 0, -4.5, n);
  ctx.physics.addHole(...at(0, 2.3), 4.46, 4.6, yaw);
  ctx.physics.addWalkBox(...at(0, (end+run)/2), 4.35, end-run+.09, yaw, UNDERPASS_Y+.05, -5.0);
  // Keep street walkers from dropping over the rear parapet.
  ctx.physics.addBox(...at(0, 4.49), 4.65, .30, yaw, -.16, 1.08);
  if (!gallery) {
    k.box(4.66, 4.34, .20, m.wall, [0, -2.34, end]);
    k.box(2.25, 2.62, .06, m.dark, [0, -3.18, end-.14]);
    ctx.physics.addBox(...at(0,end), 4.65, .2, yaw, -5.1, -.22);
  }
  return {...p,run,yaw,end};
}

export function buildCentralMetroEntrances(ctx, working = (ctx.buildList || ctx.L.MODULE_KEYS).includes('metro')) {
  if (ctx.services.centralMetroEntrances) return ctx.services.centralMetroEntrances;
  const doors = centralStreetDoors.filter(d => ctx.L.inPlay(d.x,d.z));
  const pits = PITS.filter(p => ctx.L.inPlay(...p.mouth));
  const output = { doors: [], pits: [] };
  ctx.services.centralMetroEntrances = output;
  if (!doors.length && !pits.length) return output;
  const geometries = new Map(), labels = new Map();
  const shared = ctx.mat.toon('#ffffff', { vertexColors: true, flatShading: true });
  const m = Object.fromEntries(Object.entries({
    walk:'#8e8178', wall:'#ac9a87', ceiling:'#746c66', window:'#77878b', light:'#eee6cf',
    dark:'#454b4a', fanlight:'#465456', mullion:'#343a39', granite:'#795f58', cap:'#aa9387', yellow:'#dfc34c',
  }).map(([id,css]) => [id,ctx.mat.toon(css)]));
  function plate(id, exit=false) {
    const key = id + (exit ? '-out' : '');
    if (!labels.has(key)) labels.set(key,label(ctx,id,exit));
    return labels.get(key);
  }
  for (const d of doors) {
    const kind = kinds[d.id], historicHall = working && !centralExtraDoors.includes(d);
    if (!geometries.has(kind)) geometries.set(kind,portalGeometry(kind));
    const g = new THREE.Group();
    g.name = 'central-metro-' + d.id; g.position.set(d.x,(d.steps || 0) * .14,d.z); g.rotation.y = d.rotY;
    ctx.addStatic(g);
    const mesh = new THREE.Mesh(geometries.get(kind),shared); mesh.scale.x = d.w / 3.4;
    mesh.name = 'Blender-' + kind; g.add(mesh);
    doorColliders(ctx, d, kind, historicHall);
    const k = ctx.kit(g);
    // The historic facade opening is taller than several modern door banks.
    // Fit a recessed opaque fanlight behind the original arch, above the free passage.
    const fanBottom = 3.04, fanTop = 5.15;
    k.box(d.w + .48, fanTop - fanBottom, .14, m.fanlight, [0,(fanTop+fanBottom)/2,-.43]);
    for (const fraction of [-.25,0,.25]) {
      k.box(.046,fanTop-fanBottom,.055,m.mullion,[fraction*d.w,(fanTop+fanBottom)/2,-.34]);
    }
    if (kind === 'gallery' && !historicHall) {
      for (const side of [-1,1]) {
        k.box(.63, 2.46, .075, m.window, [side*1.22, 1.34, -.17]);
        k.box(.055, .42, .10, m.dark, [side*1.00, 1.04, -.10]);
      }
    }
    if (!historicHall) surfaceLobby(ctx,g,d,m);
    if (d.steps) entranceSteps(ctx,g,d,m);
    const station = d.id === 'gostiny-canal' ? 'gostiny' : d.station;
    k.plane(Math.min(d.w*.88,2.67),.47,plate(station,d.kind==='exit'),[0,2.88,.46]).castShadow=false;
    output.doors.push(d);
  }
  for (const p of pits) output.pits.push(stairs(ctx,p,working,plate('nevsky'),m));
  return output;
}
