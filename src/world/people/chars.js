// people/chars.js - the crowd of the characters half: createCrowd(ctx) -> { add, finalize, render, hide, endFrame, setNight, ... } (interface: contract.js).
// Every VISIBLE person owns one instance in each of its part meshes (torso, head, 2 upper arms, 2 fore arms, 2 thighs, 2 shins, 2 feet) plus small instanced sets for the things it
// carries or rides (items.js).  render() computes the pose (anim.js: pure function of state / spec / t, plus a little per-person smoothing of the speed, gesture weights and
// the glance so that sloppy input never pops) and writes all matrices straight into the instance buffers.
// SLOTS: the instanced meshes are sized for every registered person of a part variant, but only the persons that are drawn (the simulation calls render() for the people within
// the render radius and hide() for the others) hold a slot: a slot is taken from the lowest free index of the variant (so mesh.count = the highest used slot + 1 and the GPU
// draws about as many figures as are in view, 1250 people cost what 400 cost), written with the person's palette colours / face / tints when it is assigned and freed on hide().
// FAR LOD: beyond ~110 m a person is drawn by renderFar(): ONE 84-triangle block figure (legs, torso, arms, head, hair in the person's palette colours; a guide's umbrella stays) instead of
// the ~600-triangle articulated rig, written with a single matrix per frame (no pose maths).
// On WEBGL_multi_draw devices, batches.js puts compatible accessories into three material batches; the
// same slot arrays then address the batch matrix texture. Body parts stay instanced. ?pbat=0 retains the
// original renderer; ?pbat=items (or 1) explicitly enables accessory batches for performance comparisons.
import * as THREE from 'three';
import { Geo, clamp, lerp, smooth, TAU, lampMat } from './kit.js';
import { H, torsoGeo, upperArmGeo, foreArmGeo, thighGeo, shinGeo, footGeo, headGeo, faceAtlas, paletteMaterial, ATLAS } from './rig.js';
import { newPose, posePerson, writeFigure, HIDE, VEH } from './anim.js';
import { KINDS } from './items.js';
import { MODE, GESTURE as G } from './contract.js';
import { makeSpec, ARCH } from './look.js';
import { peopleBatchMode, createPeopleBatches } from './batches.js';
export { makeSpec, ARCH };

const col = (() => { const m = new Map(); return (h) => { let c = m.get(h); if (!c) { c = new THREE.Color(h); m.set(h, c); } return c; }; })();
const PHONE_G = new Set([G.PHONE, G.CALL, G.PHOTO, G.SELFIE]);

export function createCrowd(ctx) {
  const atlas = faceAtlas(ctx), matBody = paletteMaterial(ctx), matHead = paletteMaterial(ctx, atlas);
  const vc = ctx.mat.toon('#ffffff', { vertexColors: true, paint: 0.02 }), screenMat = lampMat(ctx, '#bcd6ee', 0.95, 2.6);
  const persons = [], parts = new Map(), sets = new Map(), meshes = [], far = { mesh: null };
  const batchMode = peopleBatchMode(ctx), useBatches = batchMode !== 'none';
  let finalized = false, night = 0, nightFlag = false, batches = null;
  const crowd = { persons, count: 0, triangles: 0, drawCalls: 0, atlas, shownCount: 0 };

  // ---------------------------------------------------------------- registration
  const partRef = (key, pal, face) => { let e = parts.get(key); if (!e) { e = { key, n: 0, pal: [], face: [] }; parts.set(key, e); } e.pal.push(pal); e.face.push(face); return { key, i: e.n++ }; };
  const itemRef = (name, tint) => { let e = sets.get(name); if (!e) { e = { name, n: 0, tint: [] }; sets.set(name, e); } e.tint.push(tint); return { name, i: e.n++ }; };

  crowd.add = (spec) => {
    if (finalized) throw new Error('crowd.add after finalize');
    const L = spec.look, p = { i: persons.length, spec, sc: L.sc, legK: L.legK, headK: L.headK, wid: L.wid, seed: spec.seed, fem: spec.fem, vehicle: spec.vehicle, pram: spec.pram, dog: spec.dog };
    spec.id = p.i;
    if (ctx.season === 'winter') {
      const coats = ['#773846', '#30465b', '#5d6657', '#a37b55', '#455059', '#81667d'];
      const seed = Math.floor(spec.seed), pick = seed % coats.length;
      Object.assign(L, { torso: pick % 2 ? 'parka' : 'overcoat', upper: 'bulk', fore: 'bulk',
        head: ['crochet', 'beret', 'cap', 'crochet', L.head][Math.floor(seed / 7) % 5], thigh: L.thigh === 'wide' ? 'wide' : 'std', shin: L.shin === 'wide' ? 'wide' : 'std', foot: 'boot',
        A: seed % 4 === 0 ? L.A : coats[pick], B: L.C, pants: L.pants, shoeB: '#493f3b', shoeC: '#312f32' });
    }
    const age = spec.age, h = spec.h;
    p.strideW = h * (age === 'elder' ? 0.72 : age === 'child' ? 0.72 : age === 'teen' ? 0.78 : 0.8) * (spec.pram ? 0.92 : 1) * (L.carry && L.carry.suitcase ? 0.94 : 1);
    p.strideJ = h * (age === 'child' ? 1.0 : 1.15);
    const Lr = (H.thigh + H.shin) * p.legK * p.sc;
    p.A = Math.asin(clamp(p.strideW / (4 * Lr), 0.05, 0.85)); p.AJ = Math.asin(clamp(p.strideJ / (4 * Lr), 0.05, 0.78));
    p.armK = age === 'elder' ? 0.75 : 1;
    p.vs = spec.vehicle === 'bike' || spec.vehicle === 'escooter' ? clamp(h / 1.75, 0.85, 1.05) : spec.vehicle === 'kick' ? clamp(h / 1.3, 0.8, 1.15) : spec.vehicle === 'balance' ? clamp(h / 1.0, 0.8, 1.1) : 1;
    p.sitStyle = L.sitStyle; p.kneeSpread = L.kneeSpread; p.carry = L.carryHand && !spec.dog && !spec.pram && !spec.vehicle ? 'hand' : null;
    p.pull = !!(L.carry && L.carry.suitcase) && !spec.vehicle; p.cs = L.carry || {};
    p.gA = { g: 0, k: 0 }; p.gB = { g: 0, k: 0 }; p.spdS = 0; p.lookS = 0; p.lookKS = 0; p.tPrev = -1; p.hidden = true; p.shown = false;
    const skin = col(L.skin), A = col(L.A), B = col(L.B), C = col(L.C), P = col(L.pants), hat = col(L.hatCol), hair = col(L.hair), sb = col(L.shoeB), sc2 = col(L.shoeC), W = col('#ffffff');
    p.ref = {
      torso: partRef('t|' + L.torso, [A, B, C, skin]), head: partRef('h|' + L.head, [W, hat, hair, skin], L.faceG),
      uaL: partRef('ua|' + L.upper, [A, A, A, skin]), uaR: null, faL: partRef('fa|' + L.fore, [A, A, A, skin]), faR: null,
      thL: partRef('th|' + L.thigh, [P, P, P, skin]), thR: null, shL: partRef('sh|' + L.shin, [P, P, P, skin]), shR: null, ftL: partRef('ft|' + L.foot, [sb, sb, sc2, skin]), ftR: null,
    };
    p.ref.uaR = partRef('ua|' + L.upper, [A, A, A, skin]); p.ref.faR = partRef('fa|' + L.fore, [A, A, A, skin]); p.ref.thR = partRef('th|' + L.thigh, [P, P, P, skin]);
    p.ref.shR = partRef('sh|' + L.shin, [P, P, P, skin]); p.ref.ftR = partRef('ft|' + L.foot, [sb, sb, sc2, skin]);
    p.faceN = L.faceN; p.faceG = L.faceG; p.glasses = spec.glasses;
    // items
    p.it = {};
    if (L.back) p.it.back = itemRef(L.back, col(L.bagCol));
    if (L.lanyard) p.it.lanyard = itemRef('lanyard', col('#2e6fb0'));
    if (L.handBag && !spec.dog && !spec.pram && !spec.vehicle) p.it.hand = itemRef(L.handBag, col(L.bagCol));
    if (spec.age !== 'child' || spec.h > 1.2) { p.it.phone = itemRef('phone', W); p.it.screen = itemRef('screen', W); }
    if (spec.eats) p.it.eat = itemRef('icecream', W);
    if (spec.smokes) p.it.smoke = itemRef('cigarette', W);
    const C2 = p.cs;
    if (C2.suitcase) p.it.suitcase = itemRef('suitcase', col(C2.suitcase));
    if (C2.umbrella) p.it.umbrella = itemRef('umbrella', col(C2.umbrella));
    if (C2.guitar) p.it.guitar = itemRef('guitar', col(C2.guitar));
    if (C2.easel) p.it.easel = itemRef('easel', W);
    if (C2.broom) p.it.broom = itemRef('broom', W);
    if (C2.rod) p.it.rod = itemRef('rod', W);
    if (C2.bouquet) p.it.bouquet = itemRef('bouquet', col(C2.bouquet));
    if (C2.camera) p.it.camera = itemRef('camera', W);
    if (spec.vehicle) { const v = spec.vehicle, vt = col(L.vehicleCol); p.it.veh = itemRef(v, v === 'escooter' ? W : vt); p.it.wheelA = itemRef(v + 'Wheel', W); p.it.wheelB = itemRef(v + 'Wheel', W); }
    if (spec.pram) { p.it.veh = itemRef('pram', W); for (const k of ['wa', 'wb', 'wc', 'wd']) p.it[k] = itemRef('pramWheel', W); }
    if (spec.dog) { p.it.dog = itemRef('dog', col(L.dogCol)); for (const k of ['la', 'lb', 'lc', 'ld']) p.it[k] = itemRef('dogLeg', col(L.dogCol)); p.it.leash = itemRef('leash', W); p.dogS = { x: 0, z: 0, yaw: 0, dist: 0, ok: false, spd: 0 }; }
    persons.push(p); crowd.count = persons.length;
    return p.i;
  };

  // ---------------------------------------------------------------- finalize: build the instanced meshes (capacity = every registered person of the variant, count = 0 until shown)
  const partGeo = (key) => {
    const [k, v] = key.split('|');
    if (k === 't') return torsoGeo(v).build(false, true); if (k === 'ua') return upperArmGeo(v).build(false, true); if (k === 'fa') return foreArmGeo(v).build(false, true);
    if (k === 'th') return thighGeo(v).build(false, true); if (k === 'sh') return shinGeo(v).build(false, true); if (k === 'ft') return footGeo(v).build(false, true);
    return headGeo(v);
  };
  const triOf = (g) => (g.index ? g.index.count : g.attributes.position.count) / 3;
  const initSlots = (e, cap) => { e.owner = new Int32Array(cap).fill(-1); e.hi = 0; e.low = 0; };
  crowd.finalize = () => {
    if (finalized) return; finalized = true;
    let trisAll = 0, personsN = persons.length || 1;
    for (const e of parts.values()) {
      const geo = partGeo(e.key), head = e.key.startsWith('h|'), cap = Math.max(1, e.n);
      e.attrs = [];
      for (const [j, n] of ['iA', 'iB', 'iC', 'iD'].entries()) { const attr = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3); attr.setUsage(THREE.DynamicDrawUsage); geo.setAttribute(n, attr); e.attrs.push(attr); }
      if (head) { const attr = new THREE.InstancedBufferAttribute(new Float32Array(cap * 2), 2); attr.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('iFace', attr); e.faceAttr = attr; }
      const mesh = new THREE.InstancedMesh(geo, head ? matHead : matBody, cap); mesh.count = 0; mesh.frustumCulled = false; mesh.castShadow = true; mesh.receiveShadow = true; mesh.name = 'ppl-' + e.key;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); for (let i = 0; i < cap; i++) mesh.instanceMatrix.array.set(HIDE, i * 16);
      initSlots(e, cap); e.dirty = false; e.tris = triOf(geo);
      mesh.userData.alwaysVisible = true; ctx.add(mesh); e.mesh = mesh; meshes.push(mesh); trisAll += e.tris * e.n;
    }
    for (const e of sets.values()) {
      const K = KINDS[e.name], geo = K.geo().build(false, false), cap = Math.max(1, e.n);
      const mesh = new THREE.InstancedMesh(geo, K.mat === 'screen' ? screenMat : vc, cap); mesh.count = 0; mesh.frustumCulled = false; mesh.castShadow = K.cast !== false; mesh.receiveShadow = true; mesh.name = 'ppl-' + e.name;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); for (let i = 0; i < cap; i++) mesh.instanceMatrix.array.set(HIDE, i * 16);
      if (K.mat !== 'screen') { mesh.setColorAt(0, e.tint[0] || col('#ffffff')); mesh.instanceColor.setUsage(THREE.DynamicDrawUsage); }
      if (K.mat === 'screen') ctx.noOutline(mesh);
      initSlots(e, cap); e.dirty = false; e.tris = triOf(geo); e.screen = K.mat === 'screen';
      mesh.userData.alwaysVisible = true; if (!useBatches) ctx.add(mesh); e.mesh = mesh; meshes.push(mesh); trisAll += e.tris * e.n;
    }
    if (useBatches) {
      batches = createPeopleBatches(ctx, sets); meshes.length = 0;
      for (const e of parts.values()) meshes.push(e.mesh);
      meshes.push(...batches.meshes);
    }
    // far LOD: one mesh, capacity = every person, instance colours iA (top), iB (trousers), iC (hair), iD (skin)
    {
      const g = farGeo().build(false, true), cap = Math.max(1, persons.length);
      const attrs = []; for (const n of ['iA', 'iB', 'iC', 'iD']) { const attr = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3); attr.setUsage(THREE.DynamicDrawUsage); g.setAttribute(n, attr); attrs.push(attr); }
      const mesh = new THREE.InstancedMesh(g, matBody, cap); mesh.count = 0; mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = true; mesh.name = 'ppl-far'; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      for (let i = 0; i < cap; i++) mesh.instanceMatrix.array.set(HIDE, i * 16);
      mesh.userData.alwaysVisible = true; ctx.add(mesh); meshes.push(mesh); far.mesh = mesh; far.attrs = attrs; far.owner = new Int32Array(cap).fill(-1); far.hi = 0; far.low = 0; far.dirty = false; far.tris = triOf(g);
    }
    crowd.drawCalls = meshes.length; crowd.batched = useBatches; crowd.batchMode = batchMode; crowd.trianglesAll = trisAll; crowd.trisPerPerson = trisAll / personsN;
    for (const p of persons) { p.slots = {}; p.items = {}; for (const k of Object.keys(p.ref)) p.slots[k] = { arr: null, off: 0 }; for (const k of Object.keys(p.it)) p.items[k] = { arr: null, off: 0 }; }
    crowd.setNight(ctx.shared && ctx.shared.uNight ? ctx.shared.uNight.value : 0);
  };
  /** the lowest free slot of a variant */
  const take = (e, who) => { let s = e.low; while (e.owner[s] !== -1) s++; e.owner[s] = who; e.low = s + 1; if (s + 1 > e.hi) e.hi = s + 1; return s; };
  const release = (e, s) => { e.owner[s] = -1; if (s < e.low) e.low = s; while (e.hi > 0 && e.owner[e.hi - 1] === -1) e.hi--; };
  const faceXY = (p, idx) => [(idx % ATLAS.cols) / ATLAS.cols, -Math.floor(idx / ATLAS.cols) / ATLAS.rows];
  const showPerson = (p) => {
    for (const [k, r] of Object.entries(p.ref)) {
      const e = parts.get(r.key), s = take(e, p.i), pal = e.pal[r.i], sl = p.slots[k];
      sl.arr = e.mesh.instanceMatrix.array; sl.off = s * 16; sl.s = s;
      for (let j = 0; j < 4; j++) { const a = e.attrs[j].array, c = pal[j]; a[s * 3] = c.r; a[s * 3 + 1] = c.g; a[s * 3 + 2] = c.b; }
      if (e.faceAttr) { const f = faceXY(p, night > 0.5 || !p.glasses ? p.faceN : p.faceG); e.faceAttr.array[s * 2] = f[0]; e.faceAttr.array[s * 2 + 1] = f[1]; }
      e.dirty = true;
    }
    for (const [k, r] of Object.entries(p.it)) {
      const e = sets.get(r.name), s = take(e, p.i), sl = p.items[k];
      sl.arr = e.mesh.instanceMatrix.array; sl.off = s * 16; sl.s = s;
      if (!e.screen) { const t = e.tint[r.i], a = e.mesh.instanceColor.array; a[s * 3] = t.r; a[s * 3 + 1] = t.g; a[s * 3 + 2] = t.b; }
      e.dirty = true;
    }
    p.shown = true; crowd.shownCount++;
  };
  const hidePerson = (p) => {
    for (const [k, r] of Object.entries(p.ref)) { const sl = p.slots[k]; if (sl.arr) { sl.arr.set(HIDE, sl.off); release(parts.get(r.key), sl.s); sl.arr = null; } }
    for (const [k, r] of Object.entries(p.it)) { const sl = p.items[k]; if (sl.arr) { sl.arr.set(HIDE, sl.off); release(sets.get(r.name), sl.s); sl.arr = null; } }
    p.shown = false; p.tPrev = -1; crowd.shownCount--;
  };

  // ---------------------------------------------------------------- far LOD
  function farGeo() {
    const G = new Geo(), box = (w, h, d, x, y, z, slot) => { G.slot = slot; G.box(w, h, d, [x, y + h / 2, z], '#ffffff'); };
    box(0.15, 0.88, 0.17, 0.095, 0, 0, 2); box(0.15, 0.88, 0.17, -0.095, 0, 0, 2);                // legs
    box(0.4, 0.56, 0.25, 0, 0.88, 0, 1); box(0.1, 0.52, 0.12, 0.26, 0.9, 0, 1); box(0.1, 0.52, 0.12, -0.26, 0.9, 0, 1);   // torso, arms
    box(0.2, 0.26, 0.23, 0, 1.46, 0.01, 4); box(0.215, 0.1, 0.24, 0, 1.64, -0.005, 3);              // head, hair
    G.slot = 0; return G;
  }
  const FM = new THREE.Matrix4(), FQ = new THREE.Quaternion(), FS = new THREE.Vector3(), FP = new THREE.Vector3(), FE = new THREE.Euler();
  const takeFar = (who) => { let s = far.low; while (far.owner[s] !== -1) s++; far.owner[s] = who; far.low = s + 1; if (s + 1 > far.hi) far.hi = s + 1; return s; };
  const releaseFar = (s) => { far.owner[s] = -1; if (s < far.low) far.low = s; while (far.hi > 0 && far.owner[far.hi - 1] === -1) far.hi--; };
  const showFar = (p) => {
    const s = takeFar(p.i), L = p.spec.look, cols = [col(L.A), col(L.pants), col(L.hair), col(L.skin)];
    for (let j = 0; j < 4; j++) { const a = far.attrs[j].array, c = cols[j]; a[s * 3] = c.r; a[s * 3 + 1] = c.g; a[s * 3 + 2] = c.b; }
    p.farSlot = s; p.farShown = true; far.dirty = true; crowd.shownCount++;
    if (p.it.umbrella) { const e = sets.get('umbrella'), s2 = take(e, p.i), sl = p.items.umbrella; sl.arr = e.mesh.instanceMatrix.array; sl.off = s2 * 16; sl.s = s2; const t = e.tint[p.it.umbrella.i], a = e.mesh.instanceColor.array; a[s2 * 3] = t.r; a[s2 * 3 + 1] = t.g; a[s2 * 3 + 2] = t.b; e.dirty = true; }
  };
  const hideFar = (p) => {
    far.mesh.instanceMatrix.array.set(HIDE, p.farSlot * 16); releaseFar(p.farSlot); p.farShown = false; p.tPrev = -1; crowd.shownCount--;
    const sl = p.items.umbrella; if (sl && sl.arr) { sl.arr.set(HIDE, sl.off); release(sets.get('umbrella'), sl.s); sl.arr = null; }
  };
  /** far LOD: a block figure at the state's position, one matrix write */
  crowd.renderFar = (i, st) => {
    const p = persons[i]; if (p.shown) hidePerson(p); if (!p.farShown) showFar(p);
    const k = p.sc * (p.spec.look.sc ? 1 : 1);
    FE.set(0, st.yaw, 0); FQ.setFromEuler(FE); FP.set(st.x, st.y, st.z); FS.set(k * p.wid, k, k * p.wid); FM.compose(FP, FQ, FS); FM.toArray(far.mesh.instanceMatrix.array, p.farSlot * 16);
    const sl = p.items.umbrella; if (sl && sl.arr) { FP.set(st.x - 0.28 * Math.cos(st.yaw), st.y + 1.15 * p.sc, st.z + 0.28 * Math.sin(st.yaw)); FS.set(1, 1, 1); FM.compose(FP, FQ, FS); FM.toArray(sl.arr, sl.off); }
    p.hidden = false; return null;
  };
  crowd.isFar = (i) => persons[i].farShown;

  // ---------------------------------------------------------------- per frame
  const P = newPose(), OUT = { root: new THREE.Matrix4(), tor: new THREE.Matrix4(), handL: new THREE.Matrix4(), handR: new THREE.Matrix4(), head: new THREE.Matrix4() };
  const M = new THREE.Matrix4(), M2 = new THREE.Matrix4(), V = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), Q = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), S = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), E = new THREE.Euler();
  const show = (p, key, m) => { const s = p.items[key]; if (s && s.arr) m.toArray(s.arr, s.off); };
  const hideItem = (p, key) => { const s = p.items[key]; if (s && s.arr) s.arr.set(HIDE, s.off); };
  const rotX = (a) => { E.set(a, 0, 0); return Q2.setFromEuler(E); };

  crowd.hide = (i) => { const p = persons[i]; if (p.shown) hidePerson(p); if (p.farShown) hideFar(p); p.hidden = true; };
  crowd.isShown = (i) => persons[i].shown || persons[i].farShown;
  crowd.render = (i, st, t) => {
    const p = persons[i];
    if (p.farShown) hideFar(p);
    if (!p.shown) showPerson(p);
    let dt = t - p.tPrev; const snap = p.tPrev < 0 || !(dt >= 0) || dt > 0.5; dt = snap ? 0 : Math.min(dt, 0.1); p.tPrev = t;
    // smoothing of the inputs (speed, gesture weights, glance)
    if (snap) { p.spdS = st.speed; p.gA.g = st.gesture; p.gA.k = st.gk; p.gB.g = 0; p.gB.k = 0; p.lookS = st.look; p.lookKS = st.lookK; }
    else {
      p.spdS += (st.speed - p.spdS) * (1 - Math.exp(-9 * dt));
      const A = p.gA, B = p.gB;
      if (st.gesture !== A.g) { if (A.k > 0.01) { B.g = A.g; B.k = A.k; } A.g = st.gesture; A.k = 0; }
      A.k += (st.gk - A.k) * (1 - Math.exp(-6 * dt)); B.k = Math.max(0, B.k - dt * 4);
      const r = 1 - Math.exp(-7 * dt); p.lookS += (st.look - p.lookS) * r; p.lookKS += (st.lookK - p.lookKS) * r;
    }
    posePerson(P, p, st, t);
    writeFigure(p, P, st, p.slots, OUT);
    p.hidden = false;
    // ---- items
    const spec = p.spec, sc = p.sc, items = p.items, gA = p.gA, gB = p.gB;
    const actG = gA.k > 0.15 ? gA.g : (gB.k > 0.15 ? gB.g : 0);
    if (items.back) show(p, 'back', OUT.tor);
    if (items.lanyard) show(p, 'lanyard', OUT.tor);
    if (items.camera) show(p, 'camera', OUT.tor);
    if (items.guitar) show(p, 'guitar', OUT.tor);
    if (items.hand) { V.setFromMatrixPosition(OUT.handL); E.set(0, st.yaw + 0.25 * P.shL, 0); Q.setFromEuler(E); S.set(sc, sc, sc); M.compose(V, Q, S); show(p, 'hand', M); }
    if (items.phone) {
      if (PHONE_G.has(actG)) {
        OUT.tor.decompose(V3, Q, S); V.setFromMatrixPosition(OUT.handR);
        if (actG === G.PHOTO) { V2.setFromMatrixPosition(OUT.handL); V.add(V2).multiplyScalar(0.5); }
        if (actG === G.CALL) Q.multiply(Q2.setFromEuler(E.set(0, Math.PI / 2, -0.15)));
        else if (actG === G.PHONE) Q.multiply(Q2.setFromEuler(E.set(-0.75, Math.PI, 0)));
        else Q.multiply(Q2.setFromEuler(E.set(-0.2, Math.PI, 0)));
        S.set(sc, sc, sc); M.compose(V, Q, S); show(p, 'phone', M); show(p, 'screen', M);
      } else { hideItem(p, 'phone'); hideItem(p, 'screen'); }
    }
    if (items.eat) { if (actG === G.EAT) { V.setFromMatrixPosition(OUT.handR); OUT.tor.decompose(V3, Q, S); S.set(sc, sc, sc); M.compose(V, Q, S); show(p, 'eat', M); } else hideItem(p, 'eat'); }
    if (items.smoke) { if (actG === G.SMOKE) { V.setFromMatrixPosition(OUT.handR); OUT.tor.decompose(V3, Q, S); Q.multiply(rotX(1.1)); S.set(sc, sc, sc); M.compose(V, Q, S); show(p, 'smoke', M); } else hideItem(p, 'smoke'); }
    // ---- station / street-life items
    if (items.suitcase) {                                                         // rolling suitcase: beside and a little behind a walker, upright beside a seat
      const k = clamp(sc * 1.04, 0.7, 1.0), sit = st.mode === MODE.SIT;
      M2.makeTranslation(sit ? -0.62 : 0.34 * k, 0, sit ? 0.12 : -0.1 * k); M.multiplyMatrices(OUT.root, M2); M.scale(S.set(k, k, k)); show(p, 'suitcase', M);
    }
    if (items.umbrella) {                                                         // held aloft in the right hand
      V.setFromMatrixPosition(OUT.handR); V.y -= 0.02; E.set(0, st.yaw, 0); Q.setFromEuler(E); S.set(1, 1, 1);
      if (P.shR > 1.5) { M.compose(V, Q, S); show(p, 'umbrella', M); } else { V.set(OUT.root.elements[12] - 0.28 * Math.cos(st.yaw), st.y + 0.0, OUT.root.elements[14] + 0.28 * Math.sin(st.yaw)); M.compose(V, Q, S); show(p, 'umbrella', M); }
    }
    if (items.easel) { M2.makeTranslation(0, 0, 0.95); M.multiplyMatrices(OUT.root, M2); M.multiply(M2.makeRotationY(Math.PI)); show(p, 'easel', M); }
    if (items.broom) { V.setFromMatrixPosition(OUT.handR); E.set(0, st.yaw, 0); Q.setFromEuler(E); S.set(1, 1, 1); M.compose(V, Q, S); show(p, 'broom', M); }
    if (items.rod) { V.setFromMatrixPosition(OUT.handR); E.set(0, st.yaw, 0); Q.setFromEuler(E); S.set(1, 1, 1); M.compose(V, Q, S); show(p, 'rod', M); }                 // the rod of an angler: over the parapet, the line down to the water
    if (items.bouquet) { V.setFromMatrixPosition(OUT.handL); E.set(0.9, st.yaw, 0, 'YXZ'); Q.setFromEuler(E); S.set(1, 1, 1); M.compose(V, Q, S); show(p, 'bouquet', M); }
    // ---- vehicles
    if (spec.vehicle) writeVehicle(p, st, spec.vehicle, st.mode === MODE.RIDE);
    else if (spec.pram) writePram(p, st);
    if (spec.dog) writeDog(p, st, t, dt, snap);
    return P;
  };

  function wheel(p, key, root, vs, x, y, z, r, a) {
    M2.makeTranslation(x * vs, y * vs, z * vs); M.multiplyMatrices(root, M2); M2.makeRotationX(a); M.multiply(M2); if (vs !== 1) M.scale(S.set(vs, vs, vs)); show(p, key, M);
  }
  const VROOT = new THREE.Matrix4();
  function writeVehicle(p, st, v, riding) {
    const vs = p.vs, V0 = VEH[v];
    VROOT.copy(OUT.root); if (!riding) { M2.makeTranslation(-0.42 * vs, 0, 0.3 * vs); VROOT.multiply(M2); }          // walking beside it / parked next to the seat
    M.copy(VROOT); if (vs !== 1) M.scale(S.set(vs, vs, vs)); show(p, 'veh', M);
    const a = st.dist / (V0.wheelR * vs);
    wheel(p, 'wheelA', VROOT, vs, 0, V0.wheelR, V0.wheelZ[0], V0.wheelR, a); wheel(p, 'wheelB', VROOT, vs, 0, V0.wheelR, V0.wheelZ[1], V0.wheelR, a);
  }
  function writePram(p, st) {
    VROOT.copy(OUT.root); M2.makeTranslation(0, 0, VEH.pram.handle[0]); VROOT.multiply(M2);
    show(p, 'veh', VROOT);
    const a = st.dist / 0.13;
    for (const [k, x, z, s] of [['wa', 0.27, 0.12, 1], ['wb', -0.27, 0.12, 1], ['wc', 0.25, 0.9, 0.8], ['wd', -0.25, 0.9, 0.8]]) {
      M2.makeTranslation(x, 0.13 * s, z); M.multiplyMatrices(VROOT, M2); M2.makeRotationX(a / s); M.multiply(M2); M.scale(S.set(s, s, s)); show(p, k, M);
    }
  }
  const angDiff = (a, b) => { let d = a - b; d -= TAU * Math.round(d / TAU); return d; };
  function writeDog(p, st, t, dt, snap) {
    const D = p.dogS, K = p.spec.look.dogK, fx = Math.sin(st.yaw), fz = Math.cos(st.yaw), lx = Math.cos(st.yaw), lz = -Math.sin(st.yaw);
    const ahead = 0.5 + 0.2 * Math.sin(0.3 * t + p.seed), side = 0.95 + 0.1 * Math.sin(0.17 * t + p.seed);
    const tx = st.x + lx * side + fx * ahead, tz = st.z + lz * side + fz * ahead;
    if (!D.ok || snap || dt > 0.3) { D.x = tx; D.z = tz; D.yaw = st.yaw; D.ok = true; D.spd = 0; }
    else if (dt > 0) {
      const k = 1 - Math.exp(-5 * dt), nx = D.x + (tx - D.x) * k, nz = D.z + (tz - D.z) * k, dd = Math.hypot(nx - D.x, nz - D.z);
      D.spd += (dd / dt - D.spd) * (1 - Math.exp(-8 * dt)); D.dist += dd;
      const ty = dd > 0.002 ? Math.atan2(nx - D.x, nz - D.z) : st.yaw; D.yaw += angDiff(ty, D.yaw) * (1 - Math.exp(-6 * dt)); D.x = nx; D.z = nz;
    }
    const gait = smooth(0.05, 0.4, D.spd), ph = TAU * D.dist / 0.77, bob = 0.012 * gait * Math.abs(Math.sin(ph));
    E.set(0, D.yaw, 0); Q.setFromEuler(E); V.set(D.x, st.y + bob, D.z); S.set(K, K, K); MD.compose(V, Q, S); show(p, 'dog', MD);
    for (let j = 0; j < 4; j++) {
      const front = j < 2, sd = j % 2 ? 1 : -1, ang = 0.6 * Math.sin(ph + (front ? 0 : Math.PI) + (j % 2 ? Math.PI : 0)) * gait;
      ML.makeTranslation(sd * 0.075, 0.36, front ? 0.18 : -0.18); MR.makeRotationX(ang); ML.multiply(MR); MW.multiplyMatrices(MD, ML); show(p, DOG_LEGS[j], MW);
    }
    // leash: left hand -> collar
    V.setFromMatrixPosition(OUT.handL); V2.set(0, 0.5, 0.22).multiplyScalar(K); V2.applyQuaternion(Q).add(V3.set(D.x, st.y + bob, D.z));
    const len = V.distanceTo(V2) || 0.1; M.lookAt(V2, V, UP); Q2.setFromRotationMatrix(M); M.compose(V, Q2, S.set(1, 1, len)); show(p, 'leash', M);
  }
  const MD = new THREE.Matrix4(), ML = new THREE.Matrix4(), MR = new THREE.Matrix4(), MW = new THREE.Matrix4(), DOG_LEGS = ['la', 'lb', 'lc', 'ld'];

  const flush = (e) => {
    if (e.batch) { batches.flush(e); return; }
    const m = e.mesh; m.count = e.hi;
    m.instanceMatrix.clearUpdateRanges(); if (e.hi > 0) { m.instanceMatrix.addUpdateRange(0, e.hi * 16); m.instanceMatrix.needsUpdate = true; }
    if (e.dirty) {
      if (e.attrs) { for (const a of e.attrs) a.needsUpdate = true; if (e.faceAttr) e.faceAttr.needsUpdate = true; } else if (m.instanceColor) m.instanceColor.needsUpdate = true;
      e.dirty = false;
    }
  };
  crowd.endFrame = () => {
    for (const e of parts.values()) flush(e); for (const e of sets.values()) flush(e);
    const m = far.mesh; if (m) { m.count = far.hi; m.instanceMatrix.clearUpdateRanges(); if (far.hi > 0) { m.instanceMatrix.addUpdateRange(0, far.hi * 16); m.instanceMatrix.needsUpdate = true; } if (far.dirty) { for (const a of far.attrs) a.needsUpdate = true; far.dirty = false; } }
  };
  crowd.setNight = (k) => {
    night = k; const on = k > 0.5; if (on === nightFlag && finalized && crowd._nightInit) return; nightFlag = on; crowd._nightInit = true;
    if (!finalized) return;
    for (const p of persons) { if (!p.shown) continue; const r = p.ref.head, e = parts.get(r.key), s = p.slots.head.s, f = faceXY(p, on || !p.glasses ? p.faceN : p.faceG); e.faceAttr.array[s * 2] = f[0]; e.faceAttr.array[s * 2 + 1] = f[1]; e.dirty = true; }
  };
  return crowd;
}
