// A deliberately outsized harbour easter egg, inspired by the 399.9 x 61 m
// Hamburg Express class. See docs/research/sea-gates-landmarks.md. Model +
// tuning use the ordinary boat contract; navigation still checks the entire hull.
import * as THREE from 'three';
import { VB } from '../../traffic/vb.js';

export const CONTAINER_SHIP_SPEC = {
  name: 'container-ship', W: 61, len: 399.9, front: 199.95, rear: -199.95,
  centerZ: 0, hgt: 62, draft: 16, wb: 260, R: 1, mass: 224995000, durability: 100,
  eye: { x: 0, y: 48.9, z: 76 }, fovRest: 78, exhaust: [],
};

// Shared by the rendered hull and shoreline checks: [z, half beam, keel y,
// deck y]. The broad shoulders continue to z=128 before the bow tapers.
const STATIONS = [
  [-199.95, 22, -7, 10.8], [-191, 28, -11, 11.2], [-168, 30.5, -15, 11.6],
  [-100, 30.5, -16, 11.6], [50, 30.5, -16, 11.6], [128, 30.5, -15, 11.8],
  [162, 25, -11, 13.1], [184, 14, -5, 15], [199.95, 0.1, 1, 16.2],
];

// Arcade manoeuvring retains the size, inertia and very slow turn of a ship.
// Deliberately no boost or planing trim: a whole container terminal should not
// heel like the little day boat. hf/hr/hw are full-size shoreline probes.
export const CONTAINER_SHIP_TUNING = {
  spec: CONTAINER_SHIP_SPEC, hf: 199.9, hr: 199.9, hw: 30.5, edgeMargin: 6,
  shoreProfile: STATIONS.map(([z, halfBeam]) => [z, halfBeam]),
  acc: 0.75, vmax: 10.5, brake: 1.15, revAcc: 0.4, vrev: 3,
  dragLin: 0.045, handDecel: 1.9, steerIn: 0.8, steerOut: 0.95,
  yawRate: 0.055, yawMin: 0.9, yawInertia: 0.65, yawSpeedLoss: 0.6,
  shoal: 2.5, shoalDrag: 2, shoreMargin: 1.2, grip: 0.7, gripHand: 0.4,
  scrub: 0.004, pitchK: 0.00004, pitchMax: 0.001, rollK: 0.00002,
  rollMax: 0.001, trim: 0, bodyResp: 0.8, impactDecay: 1.5,
};

const NAVY = '#1d2934', RED = '#9b3835', STEEL = '#bfc5c5', WHITE = '#e6e7df';
const CARGO = ['#a54a40', '#9c453c', '#ad7955', '#33596b', '#52716a', '#d0cbb6', '#c06f35', '#65485f', '#6a5950'];

function hull(V) {
  const P = [], lower = [], deck = [];
  const quad = (to, a, b, c, d, hint) => {
    const normal = new THREE.Vector3().subVectors(new THREE.Vector3(...b), new THREE.Vector3(...a))
      .cross(new THREE.Vector3().subVectors(new THREE.Vector3(...c), new THREE.Vector3(...a)));
    if (normal.dot(new THREE.Vector3(...hint)) < 0) to.push(...a, ...c, ...b, ...a, ...d, ...c);
    else to.push(...a, ...b, ...c, ...a, ...c, ...d);
  };
  for (let i = 0; i < STATIONS.length - 1; i++) {
    const a = STATIONS[i], b = STATIONS[i + 1];
    for (const side of [-1, 1]) {
      quad(P, [side * a[1], 1.4, a[0]], [side * b[1], 1.4, b[0]], [side * b[1], b[3], b[0]], [side * a[1], a[3], a[0]], [side, 0, 0]);
      quad(lower, [side * a[1] * 0.74, a[2], a[0]], [side * b[1] * 0.74, b[2], b[0]], [side * b[1], 1.4, b[0]], [side * a[1], 1.4, a[0]], [side, -0.2, 0]);
    }
    quad(deck, [-a[1], a[3], a[0]], [a[1], a[3], a[0]], [b[1], b[3], b[0]], [-b[1], b[3], b[0]], [0, 1, 0]);
    quad(lower, [-a[1] * .74, a[2], a[0]], [a[1] * .74, a[2], a[0]], [b[1] * .74, b[2], b[0]], [-b[1] * .74, b[2], b[0]], [0, -1, 0]);
  }
  const a = STATIONS[0];
  quad(P, [-a[1], 1.4, a[0]], [a[1], 1.4, a[0]], [a[1], a[3], a[0]], [-a[1], a[3], a[0]], [0, 0, -1]);
  quad(lower, [-a[1] * .74, a[2], a[0]], [a[1] * .74, a[2], a[0]], [a[1], 1.4, a[0]], [-a[1], 1.4, a[0]], [0, 0, -1]);
  for (const [pos, color] of [[P, NAVY], [lower, RED], [deck, '#737969']]) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    V.add(g, color); g.dispose();
  }
}

function containerMap(ctx) {
  if (!ctx.tex?.draw) return null;
  return ctx.tex.draw(512, 256, (g, w, h) => {
    g.fillStyle = '#e6e6e6'; g.fillRect(0, 0, w, h);
    // Corrugation, top and bottom rails, corner castings and twin-door locks.
    for (let x = 12; x < w; x += 20) {
      g.fillStyle = '#a5a5a5'; g.fillRect(x, 8, 3, h - 16);
      g.fillStyle = '#ffffff'; g.fillRect(x + 3, 8, 2, h - 16);
    }
    g.strokeStyle = '#727272'; g.lineWidth = 5; g.strokeRect(3, 3, w - 6, h - 6);
    for (const x of [12, w / 2, w - 12]) { g.fillStyle = '#999999'; g.fillRect(x, 10, 4, h - 20); }
    g.fillStyle = '#f0f0e8'; g.fillRect(w - 82, h - 62, 52, 25);
    g.fillStyle = '#777777'; g.fillRect(w - 78, h - 57, 41, 3); g.fillRect(w - 78, h - 49, 29, 3);
    for (const x of [2, w - 14]) for (const y of [2, h - 14]) { g.fillStyle = '#646464'; g.fillRect(x, y, 12, 12); }
  }, { key: 'sea-gates-container-corrugation' });
}

/** Full-size geometry, forward +Z and waterline y=0, like createBoatModel. */
export function createContainerShipModel(ctx) {
  const root = new THREE.Group(); root.name = 'drive-container-ship'; root.rotation.order = 'YXZ';
  const V = new VB(0), D = new VB(0), GL = new VB(0), DR = new VB(0), WH = new VB(0);
  hull(V);
  // White accommodation block ahead of the separate engine/funnel island.
  V.box(35, 30, 20, WHITE, [0, 27, 65]);
  for (let floor = 0; floor < 7; floor++) {
    const y = 15 + floor * 4;
    for (let x = -14; x <= 14; x += 4) {
      V.box(1.5, 1.6, .1, '#253a44', [x, y, 75.08]);
      V.box(1.5, 1.6, .1, '#253a44', [x, y, 54.92]);
    }
    for (const side of [-1, 1]) for (let z = 59; z <= 71; z += 4) V.box(.1, 1.5, 1.6, '#253a44', [side * 17.55, y, z]);
    V.box(36, .22, 21, '#c6c8bc', [0, y + 1.7, 65]);
  }
  // Bridge wings are the signature full-beam cantilevers of the twin-island design.
  V.box(61, .8, 12, WHITE, [0, 45.3, 70]);
  V.box(39, 3.2, 12, WHITE, [0, 47.3, 70]);
  V.box(61, .7, 12.8, WHITE, [0, 49.2, 70]);
  for (const side of [-1, 1]) {
    V.rod([side * 29.7, 45, 70], [side * 18, 35.5, 65], .42, WHITE, 6);
    GL.box(18, 1.7, .06, '#91b2bd', [side * 10, 47.8, 76.08]);
    for (const x of [side * 26, side * 29.8]) V.box(.16, 1.2, 11.5, WHITE, [x, 46.3, 70]);
    D.box(1.4, .5, 1.1, '#323b3d', [side * 27, 46.1, 73]);
  }
  // Forward observation window is transparent; the roof hides only in helm view.
  const roofVB = new VB(0); roofVB.box(41, .35, 13.4, WHITE, [0, 49.7, 70]);
  V.box(20, 22, 19, '#d97526', [0, 23, -102]);
  V.box(18, 17, 16, '#e2812b', [0, 42.5, -102]);
  V.box(18.5, 1.2, 16.5, '#30383d', [0, 51.5, -102]);
  for (const x of [-6, -2, 2, 6]) {
    V.cyl(.65, .65, 3.8, '#34393a', [x, 54, -102], null, 8);
    for (let y = 43; y < 49; y += 1) V.box(2.8, .25, .1, '#573f2c', [x, y, -93.95]);
  }
  // Lashing bridges, buttresses, foredeck machinery, lifeboats and mooring holes.
  for (const z of [-184, -148, -112, -76, -40, -4, 32, 95, 132, 166]) {
    V.box(59, .45, 1, '#94463d', [0, 13.2, z]);
    for (const x of [-28, -20, -12, -4, 4, 12, 20, 28]) {
      D.box(.32, 25, .42, '#a14c40', [x, 24, z]);
      D.rod([Math.max(-29.6, x - 3.5), 12, z], [Math.min(29.6, x + 3.5), 35, z], .12, '#a14c40', 5);
    }
    D.box(58, .22, 1.1, '#c9a155', [0, 36.3, z]);
  }
  for (const side of [-1, 1]) {
    V.rbox(3, 3.5, 9, .7, '#d57932', [side * 22, 23, 59], null, 1);
    for (const z of [-192, -188, -184, -180]) V.box(1.4, 1.5, .12, '#101b24', [side * 20, 7.8, z], [0, side * .5, 0]);
    for (const z of [-165, -125, -80, -35, 10, 48, 92, 130]) {
      D.rod([side * 30.1, 12, z - 12], [side * 30.1, 13.2, z - 12], .05, STEEL, 5);
      D.rod([side * 30.1, 13.2, z - 12], [side * 30.1, 13.2, z + 12], .05, STEEL, 5);
    }
    V.cyl(1.5, 1.5, 1, '#333a3a', [side * 8, 14.7, 179], null, 10);
    V.box(5, .8, 2.2, '#a7ada6', [side * 8, 15.5, 179]);
    D.rod([side * 12, 15.5, 180], [side * 2.5, 16.4, 190], .14, '#3c4242', 5);
  }
  // Radar antennas are equipment, never flags / pennants / decorative poles.
  V.rod([0, 49.8, 65], [0, 61, 65], .28, WHITE, 6);
  V.box(10, .6, .65, WHITE, [0, 57.5, 65]);
  V.box(6, .35, .45, '#b7c0ba', [0, 60, 65]);
  for (const x of [-8, 8]) { V.sph(1.15, WHITE, [x, 51, 66], 8); D.rod([x, 49.5, 66], [x, 50.5, 66], .18, STEEL, 5); }

  const mk = (vb, name) => {
    const m = new THREE.Mesh(vb.build(), ctx.mat.toon('#ffffff', { vertexColors: true, paint: .025 }));
    m.name = name; m.castShadow = true; m.receiveShadow = true; return m;
  };
  const body = mk(V, 'container-ship-hull-superstructure'); root.add(body);
  const near = new THREE.Group(); near.name = 'container-ship-near-details'; near.add(mk(D, 'container-ship-lashing-railings'));
  // A moving vessel cannot join static sectors. THREE.LOD uses its actual world
  // position and the camera each render; empty far detail has zero draw calls.
  const detailLOD = new THREE.LOD(); detailLOD.addLevel(near, 0); detailLOD.addLevel(new THREE.Group(), 1100); root.add(detailLOD);
  const roof = mk(roofVB, 'container-ship-bridge-roof'); root.add(roof);
  const glass = new THREE.Mesh(GL.build(), new THREE.MeshBasicMaterial({ color: '#8ba8ad', vertexColors: true, transparent: true, opacity: .3, depthWrite: false }));
  glass.name = 'container-ship-bridge-glass'; ctx.noOutline?.(glass); root.add(glass);

  const places = [], farV = new VB(0), matrix = new THREE.Matrix4();
  for (let bay = 0; bay < 27; bay++) {
    const z = -177 + bay * 12.45;
    if (z > 51 && z < 82) continue;
    const width = z > 145 ? 20 : 24;
    for (let row = 0; row < width; row++) {
      const x = (row - (width - 1) / 2) * 2.48;
      if (z > -115 && z < -89 && Math.abs(x) < 11) continue;
      const levels = 7 + ((bay * 7 + row * 3) % 4);
      for (let level = 0; level < levels; level++) places.push({ x, y: 12 + (level + .5) * 2.9, z, color: CARGO[(bay * 13 + row * 5 + level * 3) % CARGO.length] });
      farV.box(2.44, levels * 2.9, 12.19, CARGO[(bay + row * 3) % CARGO.length], [x, 12 + levels * 1.45, z]);
    }
  }
  const containers = new THREE.InstancedMesh(new THREE.BoxGeometry(2.44, 2.86, 12.19), ctx.mat.toon('#ffffff', { map: containerMap(ctx), paint: .025 }), places.length);
  containers.name = 'container-ship-individual-containers';
  places.forEach((p, i) => { matrix.makeTranslation(p.x, p.y, p.z); containers.setMatrixAt(i, matrix); containers.setColorAt(i, new THREE.Color(p.color)); });
  containers.instanceMatrix.needsUpdate = true; containers.instanceColor.needsUpdate = true;
  containers.computeBoundingBox(); containers.computeBoundingSphere(); containers.castShadow = true; containers.receiveShadow = true;
  const cargoLOD = new THREE.LOD(); cargoLOD.name = 'container-ship-cargo-lod'; cargoLOD.addLevel(containers, 0); cargoLOD.addLevel(mk(farV, 'container-ship-far-stacks'), 1600); root.add(cargoLOD);

  // One helmsman for the outside view and a real wheel on the bridge console.
  DR.box(.45, .65, .3, '#3e5264', [0, 47.1, 75.1]); DR.sph(.16, '#d5ad88', [0, 47.65, 75.1], 8);
  const driver = mk(DR, 'container-ship-helmsman'); root.add(driver); driver.visible = false;
  WH.torus(.35, .035, '#293637', [0, 0, 0], null, 5, 12); WH.box(.04, .66, .04, '#293637', [0, 0, 0]);
  const steerWheel = new THREE.Group(); steerWheel.position.set(0, 47.1, 76.1); steerWheel.add(mk(WH, 'container-ship-wheel')); root.add(steerWheel);
  const lamps = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  let driven = false, inside = false;
  const showDriver = () => { driver.visible = driven && !inside; roof.visible = !inside; };
  root.userData.containerCount = places.length;
  root.userData.shipDimensions = { length: 399.9, beam: 61 };
  return {
    root, body, glass, wheels: [], steerWheel, driver, flames: [], glow: null,
    headMat: lamps, tailMat: lamps, spec: CONTAINER_SHIP_SPEC, boat: true,
    set(p) {
      root.position.set(p.x, p.y, p.z);
      root.rotation.set(-(p.pitch || 0), p.yaw || 0, p.roll || 0);
      steerWheel.rotation.z = -(p.steer || 0) * 2;
      if (p.driven !== undefined) { driven = !!p.driven; showDriver(); }
    },
    setView(v) { inside = !!v; showDriver(); },
    setDriven(v) { driven = !!v; showDriver(); },
  };
}
