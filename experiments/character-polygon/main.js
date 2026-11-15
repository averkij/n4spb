import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createSimulation, obstacles, STEP, WALK, RUN } from './simulation.js';
import { settledSitting, createPoseRig, capturePoses } from './character-pose.js';

import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {createVehicles,updateVehicle} from './vehicles.js';
import {VEHICLES} from './vehicle-specs.js';
import {animateInteraction,animateOccupant,poseDriver} from './interaction.js';
import {jumpClipTime} from './jump-timing.js';
import {fitJump} from './jump.js';

const $ = id => document.getElementById(id);
const canvas = $('world'), start = $('start'), welcome = $('welcome');
const keys = new Set(), inputs = { forward: false, back: false, left: false, right: false, run: false, jump: false };
const angleDelta = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
let playing = false, ready = false, lockedBefore = false, dragging = false, lastLook = 0, clock = 0;
let footView = 0, driveView = 0, yaw = 0, pitch = .22, cameraDistance = 4.6, snapCamera = true;
let renderer, sim, character, characterVisual, sedan, mixer, actions, activeAction, animationName = '';
const characters = [];
let characterIndex = 0, animationTransitions = 0;
let poseRig;
let vehicles=[];
const scene = new THREE.Scene();
scene.background = new THREE.Color('#a8c0cd'); scene.fog = new THREE.Fog('#a8c0cd', 75, 175);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .08, 220);
const target = new THREE.Vector3(), desired = new THREE.Vector3(), offset = new THREE.Vector3(), smoothTarget = new THREE.Vector3();
const toon = (color, options = {}) => new THREE.MeshToonMaterial({ color, ...options });
const materials = { asphalt: toon('#69747b'), concrete: toon('#bec3bd'), wall: toon('#d2c9b7'), dark: toon('#66757d'), line: toon('#e7e2c8'), accent: toon('#d6ec94') };

function box(w, h, d, x, y, z, material, shadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z); mesh.castShadow = shadow; mesh.receiveShadow = true; scene.add(mesh); return mesh;
}
function stripe(w, d, x, z, material = materials.line) { return box(w, .012, d, x, .016, z, material, false); }
function groundLabel(text, x, z, width = 6) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 128;
  const ctx = c.getContext('2d'); ctx.font = '600 72px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#e2e0cf'; ctx.fillText(text, 512, 64);
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 8), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, opacity: .65 }));
  mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, .035, z); scene.add(mesh);
}
function buildGround() {
  box(400, .5, 400, 0, -.55, 0, toon('#b2b7a8'), false);
  box(96, .3, 96, 0, -.15, 0, materials.asphalt, false);
  const grid = new THREE.GridHelper(90, 18, '#a2afb2', '#a2afb2'); grid.position.y = .008; grid.material.transparent = true; grid.material.opacity = .09; grid.material.depthWrite = false; scene.add(grid);
  for (const o of obstacles) box(o.w, o.h, o.d, o.x, o.y, o.z, o.kind === 'wall' ? materials.wall : o.kind === 'step' ? materials.concrete : materials.dark);
  // A wide, flat loop: no set dressing that obscures animation or camera review.
  for (const x of [-35, 35]) stripe(.12, 70, x, 0);
  for (const z of [-35, 35]) stripe(70, .12, 0, z);
  for (const x of [-26, 26]) stripe(.12, 52, x, 0);
  for (const z of [-26, 26]) stripe(52, .12, 0, z);
  for (let i = -28; i <= 28; i += 6) { stripe(.12, 2, -30.5, i); stripe(.12, 2, 30.5, i); stripe(2, .12, i, -30.5); stripe(2, .12, i, 30.5); }
  for(const spec of VEHICLES){for(const x of [spec.x-1.8,spec.x+1.8])stripe(.09,6.6,x,1);stripe(3.6,.09,spec.x,-2.3);groundLabel(spec.id==='coupe'?'BIBLIOTT GT':spec.id==='traffic'?'CITY TRAFFIC':'BLUE SEDAN',spec.x,5.3,4.4);}
  groundLabel('CAMERA / CLEARANCE', -8.5, -11, 9);
  groundLabel('WALK / RUN / JUMP', -5.5, 9, 9);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.25, 1.3, 64), new THREE.MeshBasicMaterial({ color: '#d6ec94', transparent: true, opacity: .65, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(0, .028, 5); scene.add(ring);
  // Three low cones give steering a reference without filling the empty arena.
  const orange = toon('#d79c65');
  for (const z of [-17, -8, 1]) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(.28, .75, 12), orange); cone.position.set(22, .375, z); cone.castShadow = true; scene.add(cone);
    // Visual markers only, deliberately outside the driving lane.
    box(.6, .06, .6, 22, .03, z, materials.dark);
  }
}
function prepareMaterials(root, car = false) {
  const cache = new Map();
  root.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true; o.receiveShadow = true;
    const convert = m => {
      if (cache.has(m)) return cache.get(m);
      const glass = car && /Windows/i.test(m.name);
      const replacement = toon(m.color, { map: m.map, vertexColors: m.vertexColors, side: m.side, transparent: glass, opacity: glass ? .23 : 1, depthWrite: !glass });
      replacement.name = m.name;
      if (car && m.name === 'Chassis') replacement.color.set('#52798b');
      if (car && /Tire|Bumpers/.test(m.name)) replacement.color.set('#252f35');
      if (glass) { replacement.color.set('#9cbac0'); o.castShadow = false; }
      cache.set(m, replacement); return replacement;
    };
    o.material = Array.isArray(o.material) ? o.material.map(convert) : convert(o.material);
  });
}
function prepareCharacter(gltf,selectable=true) {
  character = new THREE.Group(); characterVisual = gltf.scene;
  characterVisual.rotation.y = Math.PI; character.add(characterVisual); scene.add(character); prepareMaterials(characterVisual);
  mixer = new THREE.AnimationMixer(characterVisual); actions = {};
  for (const source of gltf.animations) {
    const clip=source.name==='Sitting'?settledSitting(source):source;
    const action = mixer.clipAction(clip); actions[clip.name] = action;
    if (/Jump/.test(clip.name)) { action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; }
  }
  for (const name of ['Idle', 'Walk', 'Run', 'Jump', 'RunningJump', 'Sitting']) if (!actions[name]) throw new Error(`Character is missing the ${name} animation`);
  const actor={root:character,visual:characterVisual,mixer,actions,rig:createPoseRig(character)};capturePoses(actor);
  if(selectable)characters.push(actor);return actor;
}
function selectCharacter(index) {
  if (!characters[index]||sim?.state.interaction) return;
  for (const c of characters) { c.root.visible = false; c.mixer.stopAllAction(); }
  characterIndex = index;
  const selected = characters[index]; character = selected.root; characterVisual = selected.visual;
  mixer = selected.mixer; actions = selected.actions; activeAction = null; animationName = '';
  poseRig=selected.rig;
  for (const button of document.querySelectorAll('[data-character]')) button.setAttribute('aria-pressed', String(Number(button.dataset.character) === index));
  // Reflect the choice even while the welcome/pause overlay is open.
  animateCharacter(0); updateCamera(0);
}
function animateCharacter(dt) {
  const s = sim.state, name = s.animation;
  if (animationName !== name) {
    animationTransitions++;
    const next = actions[name]; next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
    if (activeAction) {
      if(name==='Sitting')activeAction.stop();
      else next.crossFadeFrom(activeAction, name.includes('Jump') ? .06 : .16, false);
    }
    activeAction = next; animationName = name;
  }
  if (name === 'Walk') activeAction.timeScale = 1.3 * THREE.MathUtils.clamp(s.speed / WALK, .35, s.interaction?1.4:1.15);
  if (name === 'Run') activeAction.timeScale = 1.65 * THREE.MathUtils.clamp(s.speed / RUN, .6, 1.15);
  activeAction.paused=!!s.jump;
  if(s.jump){activeAction.time=jumpClipTime(s.jump,s.vy);activeAction.timeScale=1;}
  mixer.update(dt);
  for(let i=0;i<vehicles.length;i++)updateVehicle(vehicles[i],sim.vehicles[i],dt);
  const vehicle=vehicles[s.activeVehicle];sedan=vehicle.root;
  for(let i=0;i<vehicles.length;i++)animateOccupant(vehicles[i],sim.vehicles[i],dt,i===s.activeVehicle?s.interaction:null);
  const driving=s.mode==='drive',interacting=!!s.interaction,view=driving?driveView:footView;
  character.visible=interacting||view!==2;
  character.position.set(s.x,s.y,s.z);character.rotation.set(0,s.yaw,0);
  if(s.jump)fitJump(characters[characterIndex],s.jump,s.y);
  if(driving)poseDriver(characters[characterIndex],vehicle,s.steering);
  else if(interacting&&s.interaction.phase!=='approach')animateInteraction(characters[characterIndex],vehicle,s.interaction);

}
function updateCamera(dt) {
  const s = sim.state, driving = s.mode === 'drive', interacting=!!s.interaction, view = interacting?0:driving ? driveView : footView;
  if (driving && playing && clock - lastLook > 1.4 && Math.abs(s.carSpeed) > .8) yaw += angleDelta(yaw, s.carYaw) * (1 - Math.exp(-2.6 * dt));
  if (view === 2) {
    if (driving) {
      const seat=vehicles[s.activeVehicle].spec.seat;offset.set(seat[0],seat[1]+.69,seat[2]-.16).applyAxisAngle(THREE.Object3D.DEFAULT_UP, s.carYaw);
      camera.position.set(s.carX + offset.x, s.carY + offset.y, s.carZ + offset.z);
    } else camera.position.set(s.x, s.y + 1.65, s.z);
    camera.rotation.set(-pitch, yaw, 0, 'YXZ');
    smoothTarget.set(s.x, s.y + 1.15, s.z); snapCamera = true; return;
  }
  target.set(s.x, s.y + (driving ? 1.12 : 1.12), s.z);
  if (snapCamera) smoothTarget.copy(target);
  else smoothTarget.lerp(target, 1 - Math.exp(-18 * dt));
  const distance = interacting?5.4:driving ? (view === 1 ? 10 : 6.7) : (view === 1 ? 7.2 : 4.6);
  const cp = Math.cos(pitch);
  offset.set(Math.sin(yaw) * cp * distance, Math.sin(pitch) * distance, Math.cos(yaw) * cp * distance);
  const fraction = sim.cameraFraction(smoothTarget, offset);
  const allowed = distance * fraction;
  // Contract immediately at a wall, extend gently once the obstruction clears.
  cameraDistance = snapCamera || allowed < cameraDistance ? allowed : THREE.MathUtils.lerp(cameraDistance, allowed, 1 - Math.exp(-7 * dt));
  desired.copy(smoothTarget).addScaledVector(offset, cameraDistance / distance);
  camera.position.copy(desired); camera.lookAt(smoothTarget);
  if (!driving) character.visible = cameraDistance > .55;
  snapCamera = false;
}
function updateHud() {
  const s = sim.state, driving = s.mode === 'drive', v = driving ? driveView : footView;
  const labels={approach:'APPROACHING',open:'OPENING DOOR',reach:'TAKING CAR',extract:'PULLING DRIVER OUT',recover:'TAKING CAR',climb:'GETTING IN',close:'CLOSING DOOR',settle:'GETTING IN'};
  $('mode').textContent = s.interaction ? (s.mode==='exit'?'GETTING OUT':labels[s.interaction.phase]) : driving ? 'DRIVING' : s.animation === 'Idle' ? 'ON FOOT' : s.animation.replace('RunningJump', 'JUMP').toUpperCase();
  for(const button of document.querySelectorAll('[data-character]'))button.disabled=!!s.interaction;
  $('view').textContent = ['THIRD PERSON', 'WIDE VIEW', driving ? 'DRIVER VIEW' : 'FIRST PERSON'][v];
  $('speed').textContent = `${Math.round((driving ? Math.abs(s.carSpeed) : s.speed) * 3.6)} km/h`;
  $('hint').textContent = driving ? 'WASD drive · Space handbrake · E exit · V camera · R reset' : 'WASD move · Shift run · Space jump · E enter car · V camera';
  $('prompt').textContent = !playing ? '' : s.messageTime > 0 ? s.message : s.interaction ? '' : driving ? (Math.abs(s.carSpeed)<1.5?'E · Leave the car':'') : s.nearby>=0 ? `E · ${sim.vehicles[s.nearby].occupied?'Take':'Enter'} ${vehicles[s.nearby].spec.name}` : '';
}
function clearInput() { keys.clear(); for (const k in inputs) inputs[k] = false; dragging = false; }
function pause() {
  if (!ready || !playing) return;
  if(document.pointerLockElement===canvas)document.exitPointerLock();
  playing = false; clearInput(); welcome.hidden = false; start.textContent = 'Continue exploring →'; $('loading').textContent = 'Click to resume · Your position is kept';
}
function cycleView() {
  if (sim.state.mode === 'drive') driveView = (driveView + 1) % 3; else footView = (footView + 1) % 3;
  snapCamera = true;
}
start.addEventListener('click', () => {
  playing = true; welcome.hidden = true; $('help').hidden = true; $('help-button').setAttribute('aria-expanded', 'false');
  canvas.requestPointerLock?.()?.catch?.(() => { $('loading').textContent = 'Drag the mouse to look around'; });
});
$('help-button').addEventListener('click', () => {
  const open = $('help').hidden; $('help').hidden = !open; $('help-button').setAttribute('aria-expanded', String(open));
});
for (const button of document.querySelectorAll('[data-character]')) button.addEventListener('click', () => selectCharacter(Number(button.dataset.character)));
document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === canvas;
  if (!locked && lockedBefore) pause(); lockedBefore = locked;
});
addEventListener('keydown', e => {
  if (e.code === 'Escape') { pause(); return; }
  if (!playing || e.ctrlKey || e.metaKey || e.altKey) return;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if (e.repeat) return;
  if (/^Digit[23]$/.test(e.code)) selectCharacter(Number(e.code.slice(-1)) - 2);
  if (e.code === 'KeyV') cycleView();
  if (e.code === 'Space' && sim.state.mode === 'foot') sim.jump();
  if (e.code === 'KeyE' && sim.enterExit()) { yaw = sim.state.carYaw-Math.PI/2-.35; pitch = .15; snapCamera = true; }
  if (e.code === 'KeyR') { sim.reset(); yaw = 0; pitch = .22; snapCamera = true; }
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => { clearInput(); pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
canvas.addEventListener('mousedown', () => { if (playing) dragging = true; });
addEventListener('mouseup', () => dragging = false);
addEventListener('mousemove', e => {
  if (!playing || (!dragging && document.pointerLockElement !== canvas)) return;
  yaw -= THREE.MathUtils.clamp(e.movementX, -200, 200) * .0025;
  pitch = THREE.MathUtils.clamp(pitch + e.movementY * .002, -.35, 1.05); lastLook = clock;
});
addEventListener('resize', () => { if (!renderer) return; camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); pause(); $('loading').textContent = 'Graphics context lost. Reload the page to resume.'; start.disabled = true; });
canvas.addEventListener('webglcontextrestored', () => location.reload());

async function boot() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
  scene.add(new THREE.HemisphereLight('#e2efff', '#7c8071', 1.3));
  const sunlight = new THREE.DirectionalLight('#fff1d6', 2); sunlight.position.set(-16, 25, 12); sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048); sunlight.shadow.camera.left = -23; sunlight.shadow.camera.right = 23; sunlight.shadow.camera.top = 23; sunlight.shadow.camera.bottom = -23; sunlight.shadow.camera.near = .5; sunlight.shadow.camera.far = 90; sunlight.shadow.normalBias = .06; sunlight.shadow.bias = -.0004;
  scene.add(sunlight, sunlight.target);
  buildGround();
  const loader = new GLTFLoader();
  const [simulation, humans, car, civilian] = await Promise.all([createSimulation(), Promise.all(['woman-beret', 'man-jacket'].map(name => loader.loadAsync(new URL(`./assets/${name}.glb`, import.meta.url).href))), loader.loadAsync(new URL('./assets/sedan.glb', import.meta.url).href),loader.loadAsync(new URL('./assets/civilian.glb',import.meta.url).href)]);
  sim = simulation; humans.forEach(h=>prepareCharacter(h));vehicles=createVehicles(car);
  for(const v of vehicles){scene.add(v.root);if(v.spec.occupied)v.npc=prepareCharacter({scene:clone(civilian.scene),animations:civilian.animations},false);}
  selectCharacter(0);
  ready = true; start.disabled = false; start.textContent = 'Enter the playground →'; $('loading').textContent = 'Mouse to look · Esc to release · R to reset';
  animateCharacter(0); updateCamera(0); updateHud();
  let previous = performance.now(), accumulator = 0, frames = [];
  function frame(now) {
    const elapsed = Math.min((now - previous) / 1000, .1); previous = now; clock += elapsed;
    if (playing) {
      inputs.forward = keys.has('KeyW') || keys.has('ArrowUp'); inputs.back = keys.has('KeyS') || keys.has('ArrowDown');
      inputs.left = keys.has('KeyA') || keys.has('ArrowLeft'); inputs.right = keys.has('KeyD') || keys.has('ArrowRight');
      inputs.run = keys.has('ShiftLeft') || keys.has('ShiftRight'); inputs.jump = keys.has('Space');
      accumulator += elapsed;
      while (accumulator >= STEP) { sim.step(inputs, yaw); accumulator -= STEP; }
    } else accumulator = 0;
    animateCharacter(playing ? elapsed : 0); updateCamera(elapsed); updateHud();
    const s = sim.state;
    sunlight.position.set(s.x - 16, 25, s.z + 12); sunlight.target.position.set(s.x, 0, s.z);
    renderer.render(scene, camera);
    frames.push(elapsed * 1000); if (frames.length > 600) frames.shift();
    requestAnimationFrame(frame);
  }
  // Explicit test surface, enabled only by the diagnostic URL. Normal play has no writable hooks.
  if (new URLSearchParams(location.search).has('test')) window.__polygon = {
    get state() { return { ...sim.state, playing, footView, driveView, cameraDistance, yaw, pitch, camera: camera.position.toArray(), characterVisible: character.visible, animation: animationName, characterIndex, animationTransitions, animationTime: activeAction?.time, animationRate: activeAction?.timeScale }; },
    get stats() { return { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, frames: [...frames], animations: Object.keys(actions) }; },
    resetFrameSamples() { frames = []; },
    reset() { sim.reset(); yaw = 0; pitch = .22; snapCamera = true; },
    pose(x, z, heading = 0) { sim.person.setTranslation({ x, y: 1.02, z }, true); sim.person.setNextKinematicTranslation({ x, y: 1.02, z }); sim.state.vx = sim.state.vz = sim.state.vy = 0; yaw = heading; sim.step({ forward: false, back: false, left: false, right: false, run: false, jump: false }, yaw); snapCamera = true; },
    look(y, p = .22) { yaw = y; pitch = p; lastLook = clock; snapCamera = true; },
    previewAnimation(name, time) {
      // Freeze a precise pose for asset QA; normal play exposes no such hook.
      playing = false; sim.state.animation = name; mixer.stopAllAction();
      activeAction = actions[name]; activeAction.reset().play(); activeAction.time = time;
      animationName = name; mixer.update(0);
    },
    get driverPose() {
      character.updateWorldMatrix(true,true);
      const local=bone=>sedan.worldToLocal(bone.getWorldPosition(new THREE.Vector3())).toArray();
      return {hips:local(poseRig.hips),head:local(poseRig.head),left:local(poseRig.arms.l.end),right:local(poseRig.arms.r.end)};
    },
    get bodyPose(){character.updateWorldMatrix(true,true);const p=b=>b.getWorldPosition(new THREE.Vector3()).toArray();return {hips:p(poseRig.hips),head:p(poseRig.head),leftFoot:p(poseRig.legs.l.end),rightFoot:p(poseRig.legs.r.end)};},
    get vehicles(){return vehicles;},get vehicleStates(){return sim.vehicles.map(({body,collider,spec,...v})=>({...v,id:spec.id}));},
    scene, get character() { return character; }, get sedan(){return sedan;}, camera,
  };
  window.__ready = true;
  requestAnimationFrame(frame);
}
boot().catch(error => { console.error(error); $('loading').textContent = `Could not load playground: ${error.message}. Serve the repository with npm start, then reload.`; start.textContent = 'Unable to start'; });
