import * as THREE from 'three';
import { packMaterial, packMeshes, packGeometry, unpackGeometry, splitGeometry, unpackMaterials, unpackMeshes } from './baked-meshes.js';
import { Parts, ringEdges } from '../world/landmarksD/kit.js';
import { LOD } from './lod.js';
import { registerLOD, largePieceFar, concatGeometries, instancedAuthoredFar } from './spatial.js';

// SILHOUETTE SUPER-CELLS (plan 2026-10-15 item 1b): the footprint shells of unloaded regions (one per 640 m region) are drawn as ONE mesh per SIL_SUPER m
// (3 x 3 regions): same triangles and material, a ninth of the calls (86 silhouette calls beyond 3 km at the walk end). A region that loads leaves its group, which is rebuilt
// from the retained member geometries (a few thousand triangles). ?supercells=0 = one mesh per region as before.
export const SIL_SUPER = 1920;
/** groups silhouette records [{ key: 'kx_kz' of the 640 m region, geometry }] by super-cell; returns Map(superKey -> list) */
export function silhouetteBins(list, cell = 640, superCell = SIL_SUPER) {
  const bins = new Map(), f = superCell / cell;
  for (const it of list) { const [kx, kz] = it.key.split('_').map(Number); const k = `${Math.floor(kx / f)}_${Math.floor(kz / f)}`; let b = bins.get(k); if (!b) bins.set(k, (b = [])); b.push(it); }
  return bins;
}

// A cheap, closed footprint shell maintains the distant skyline until detail arrives.
export function captureSilhouettes(records) {
  const cells = new Map(), mat = new THREE.MeshBasicMaterial();
  for (const rec of records) {
    const b = rec.b, key = `${Math.floor(b.cx / 640)}_${Math.floor(b.cz / 640)}`;
    let p = cells.get(key); if (!p) cells.set(key, p = new Parts());
    for (const poly of b.polys) {
      const y0 = b.minH || 0, y1 = y0 + rec.st.H;
      for (const e of ringEdges(poly)) p.quad(mat, [e.a[0],y0,e.a[1]], [e.b[0],y0,e.b[1]], [e.b[0],y1,e.b[1]], [e.a[0],y1,e.a[1]], [e.n[0],0,e.n[1]]);
      const ring = a => Array.from({length:a.length/2}, (_,i)=>[a[i*2],a[i*2+1]]);
      p.cap(mat,ring(poly.o),y1,true,4,poly.h.map(ring));
    }
  }
  return [...cells].map(([key,p]) => {
    const root = new THREE.Group(), m = p.build(root)[0];
    const geometry = packGeometry(m.geometry); m.geometry.dispose();
    return {asset:`city-base-${key}`,geometry};
  });
}

export function captureRegions(ctx, name, root, extra = {}, split = false) {
  root.updateMatrixWorld(true);
  const meshes = []; root.traverse(o => { if (o.isMesh) meshes.push(o); });
  const materials = [], textures = [], materialIds = new Map(), textureIds = new Map(), cells = new Map();
  const cell = 640, box = new THREE.Box3(), center = new THREE.Vector3();
  const put = (key, m) => { let a = cells.get(key); if (!a) cells.set(key, a = []); a.push(m); };
  for (const m of meshes) {
    if (Array.isArray(m.material)) throw new Error('Baked mesh material arrays need an explicit adapter');
    if (!materialIds.has(m.material)) { materialIds.set(m.material, materials.length); materials.push(packMaterial(m.material, textures, textureIds)); }
    const lod = LOD.of(m);
    if (lod) m.userData.bakedLOD = { cx: lod.cx, cz: lod.cz, r: lod.r, far: lod.far };
    if (split && !m.isInstancedMesh) {
      for (const p of splitGeometry(m.geometry, cell)) {
        const clone = m.clone(); clone.geometry = p.geometry; clone.matrixWorld.copy(m.matrixWorld); put(p.key, clone);
      }
    } else {
      box.setFromObject(m); box.getCenter(center); put(`${Math.floor(center.x / cell)},${Math.floor(center.z / cell)}`, m);
    }
  }
  const regions = [];
  for (const [key, list] of cells) {
    const asset = `${name}-${key.replace(',', '_')}`;
    box.makeEmpty(); for (const m of list) box.union(new THREE.Box3().setFromObject(m));
    regions.push({ asset, bounds: [box.min.x, box.min.z, box.max.x, box.max.z] });
    ctx.recordBake(asset, packMeshes(list, materialIds));
    if (split) for (const m of list) m.geometry.dispose();
  }
  ctx.recordBake(name, { ...extra, regions, materials, textures });
}
const distance = (r, x, z) => Math.hypot(Math.max(r.bounds[0] - x, 0, x - r.bounds[2]), Math.max(r.bounds[1] - z, 0, z - r.bounds[3]));
export function createRegionStreamer(ctx, baked) {
  const regions = [], stats = { total: 0, loaded: 0, failed: 0, initial: 0 }, pending = new Set();
  let running = false, started = false, x = ctx.initialPosition.x, z = ctx.initialPosition.z;
  let lastPump = -Infinity;
  // Keep a generous ring ahead of the player, without decoding the entire
  // island in the background while they are trying to walk or drive.
  const prefetchRadius = 1400;
  const roadRadius = 450;
  const fetchRegion = r => {
    if (r.state === 'ready') return Promise.resolve();
    if (r.promise) return r.promise;
    r.state = 'loading'; pending.add(r);
    r.promise = (async () => {
      const p = await baked.load(r.asset); if (!p) throw new Error(`Missing region ${r.asset}`);
      const group = unpackMeshes(p, r.materials); group.name = r.asset;
      r.parent.add(group); group.updateMatrixWorld(true);
      // every region mesh joins the sector culling (core/lod.js); the details keep their baked LOD distance
      // (shop signs: unreadable beyond 450 m; any other mesh without a baked range: core/spatial.js largePieceFar keeps buildings, skyline and large surfaces, ?lrange=0 = all infinite)
      group.traverse(m => { if (m.userData.bakedLOD) LOD.add(m, ...['cx', 'cz', 'r', 'far'].map(k => m.userData.bakedLOD[k])); else if (m.isMesh) registerLOD(m, /^city-signs/.test(m.name) ? 450 : m.isInstancedMesh ? instancedAuthoredFar(m) : largePieceFar(m.geometry, m.matrixWorld, -3).far); });      // (instanced: the size rule of core/spatial.js instancedAuthoredFar)
      ctx.onRegionAttach?.(group);
      if (r.silhouette) { r.silhouette.removeFromParent(); r.silhouette.geometry.dispose(); }
      if (r.silBin) { const bin = r.silBin; r.silBin = null; for (const it of bin.list) if (it.r === r) it.geometry.dispose(); bin.list = bin.list.filter(it => it.r !== r); rebuildSil(bin); }
      r.group = group; r.state = 'ready'; stats.loaded++; if (ctx.zones) { if (ctx.zones.attach) ctx.zones.attach(group); else ctx.zones.refresh(); }
      // Hydrated geometry owns its arrays now. Keep no second graph of packed
      // metadata alive after upload/disposal of the original region meshes.
      baked.release?.(r.asset);
    })().catch(e => { r.state = 'failed'; r.error = e; stats.failed++; r.promise = null; throw e; }).finally(() => pending.delete(r));
    r.promise.catch(() => {}); return r.promise;
  };
  // (re)builds the merged silhouette of a super-cell from its remaining members; false when their layouts differ (the caller keeps one mesh per region then)
  const rebuildSil = (bin) => {
    const old = bin.mesh.geometry;
    if (!bin.list.length) { bin.mesh.removeFromParent(); old.dispose(); return true; }
    const g = concatGeometries(bin.list.map(it => it.geometry)); if (!g) return false;
    bin.mesh.geometry = g; old.dispose(); return true;
  };
  const within = (px, pz, radius) => regions.filter(r => distance(r, px, pz) <= radius);
  const ensureAt = async (px, pz, radius = 700) => {
    const list = within(px, pz, radius);
    // Limit decompression/attachment concurrency on both startup and teleports.
    for (let i = 0; i < list.length; i += 2) await Promise.all(list.slice(i, i + 2).map(fetchRegion));
  };
  // A slow speculative city request must not hold up the road the car is
  // approaching. Use the second decoding slot for nearby street surfaces,
  // without waiting for an idle callback or the running background pump.
  const warmRoad = () => {
    if (pending.size >= 2) return;
    let next = null, nearest = roadRadius;
    for (const r of regions) {
      if (r.state !== 'queued' || !r.asset.startsWith('street-surfaces-')) continue;
      const d = distance(r, x, z);
      if (d <= nearest) { next = r; nearest = d; }
    }
    if (next) fetchRegion(next).catch(e => console.warn('[region]', e.message));
  };
  const idle = () => new Promise(resolve => typeof requestIdleCallback === 'function' ? requestIdleCallback(resolve, { timeout: 500 }) : setTimeout(resolve, 30));
  const pump = async () => {
    if (running) return; running = true;
    try {
      while (true) {
        // Choose after yielding: a teleport or a fast car may have changed
        // the destination while the browser was waiting for an idle slot.
        await idle();
        if (pending.size >= 2) break;
        let next = null, nearest = prefetchRadius;
        for (const r of regions) {
          if (r.state !== 'queued') continue;
          const d = distance(r, x, z);
          if (d <= nearest) { next = r; nearest = d; }
        }
        if (!next) break;
        await fetchRegion(next).catch(e => console.warn('[region]', e.message));
      }
    } finally { running = false; }
  };
  return {
    stats, regions,
    async register(base, parent) {
      const materials = await unpackMaterials(ctx, base);
      for (const r of base.regions) regions.push({ ...r, parent, materials, state: 'queued' });
      const silhouetteMat = ctx.mat.toon('#b6afa1', {paint:0});
      const single = (r, geometry) => {
        const m = new THREE.Mesh(geometry, silhouetteMat);
        m.name = `silhouette-${r.asset}`; m.userData.noBatch = true; ctx.noOutline(m);
        parent.add(m); r.silhouette = m;
      };
      const sil = [];
      for (const s of base.silhouettes || []) {
        const r = regions.find(r => r.asset === s.asset); if (!r || r.state === 'ready') continue;
        const key = /-(-?\d+)_(-?\d+)$/.exec(s.asset);      // (asset <name>-<kx>_<kz>: the first dash is the separator, not a minus)
        if (LOD.superCells && key) sil.push({ r, key: `${key[1]}_${key[2]}`, geometry: unpackGeometry(s.geometry) }); else single(r, unpackGeometry(s.geometry));
      }
      for (const [k, list] of silhouetteBins(sil)) {
        const bin = { list, mesh: new THREE.Mesh(new THREE.BufferGeometry(), silhouetteMat) };
        if (list.length < 2 || !rebuildSil(bin)) { for (const it of list) single(it.r, it.geometry); continue; }
        bin.mesh.name = `silhouette-super-${k}`; bin.mesh.userData.noBatch = true; ctx.noOutline(bin.mesh); parent.add(bin.mesh);
        for (const it of list) it.r.silBin = bin;
      }
      stats.total = regions.length;
      await ensureAt(x, z); stats.initial = stats.loaded;
    },
    ensureAt,
    async ensureAll() { for (let i = 0; i < regions.length; i += 2) await Promise.all(regions.slice(i, i + 2).map(fetchRegion)); },
    readyAt(px, pz, radius = 160) { return within(px, pz, radius).every(r => r.state === 'ready'); },
    update(px, pz) {
      x = px; z = pz;
      const now = performance.now();
      if (started && now - lastPump >= 200) { lastPump = now; warmRoad(); if (!running) pump(); }
    },
    start() { started = true; warmRoad(); pump(); },
    pending,
  };
}
