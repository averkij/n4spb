// Keep the generated street lamp out of the printworks' mapped front shell.
// Its complete body/glow/pool, breakable record and collider move together.
import { THREE, L } from './kit.js';

export function clearForecourtLamp(ctx, building) {
  const lamps = ctx.services.streets?.lamps, net = ctx.services.streets?.net;
  if (!lamps || !net) return [];
  const inside = (o, x, z) => { let a = false; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) if ((o[i + 1] > z) !== (o[j + 1] > z) && x < (o[j] - o[i]) * (z - o[i + 1]) / (o[j + 1] - o[i + 1]) + o[i]) a = !a; return a; };
  const moved = [], matrix = new THREE.Matrix4();
  for (const lamp of lamps) {
    if (!building.polys.some(p => inside(p.o, lamp.x, lamp.z) && !(p.h || []).some(h => inside(h, lamp.x, lamp.z)))) continue;
    const old = { x: lamp.x, z: lamp.z };
    let target = null;
    search: for (let r = 0.25; r <= 24; r += 0.25) for (let a = 0; a < 360; a += 15) {
      const x = old.x + r * Math.cos(a * Math.PI / 180), z = old.z + r * Math.sin(a * Math.PI / 180);
      if (L.inPlay(x, z) && !L.insideBuilding(x, z, 0.4) && !L.inRiver(x, z) && net.cover(x, z, {}) < -0.55 && lamps.every(q => q === lamp || Math.hypot(q.x - x, q.z - z) >= 8)) { target = { x, z }; break search; }
    }
    if (!target) throw new Error(`printworks: no clear pavement for lamp at ${old.x},${old.z}`);
    const dx = target.x - old.x, dz = target.z - old.z;
    const rec = ctx.knock?.list.find(r => r.kind === 'lamp' && Math.hypot(r.x - old.x, r.z - old.z) < 0.05);
    if (ctx.knock && !rec) throw new Error(`printworks: generated lamp has no breakable record at ${old.x},${old.z}`);
    const dirty = new Set();
    if (rec) {
      for (const p of rec.parts) {
        p.M0.elements[12] += dx; p.M0.elements[14] += dz;
        if (p.mesh) { p.mesh.setMatrixAt(p.index, p.M0); p.mesh.instanceMatrix.needsUpdate = true; dirty.add(p.mesh); }
        else if (p.obj) { p.obj.matrix.copy(p.M0); p.obj.matrixWorldNeedsUpdate = true; }
      }
      rec.x = target.x; rec.z = target.z;
      rec.src.cx = target.x; rec.src.cz = target.z;
      rec.items = rec.items.map(it => { ctx.physics.remove(it); const n = ctx.physics.addCylinder(it.cx + dx, it.cz + dz, it.r, it.y0, it.y1); n.source = rec.src; return n; });
      rec.item = rec.items[0] || null;
    } else {
      ctx.staticRoot.traverse(mesh => {
        if (!mesh.isInstancedMesh || !/^lamps-/.test(mesh.name)) return;
        for (let i = 0; i < mesh.count; i++) { mesh.getMatrixAt(i, matrix); const e = matrix.elements;
          if (Math.hypot(e[12] - old.x, e[14] - old.z) >= 0.05) continue;
          e[12] += dx; e[14] += dz; mesh.setMatrixAt(i, matrix); mesh.instanceMatrix.needsUpdate = true; dirty.add(mesh);
        }
      });
      for (const it of ctx.physics.items.slice()) if (it.type === 'cyl' && it.r < 0.4 && Math.hypot(it.cx - old.x, it.cz - old.z) < 0.05) { ctx.physics.remove(it); ctx.physics.addCylinder(it.cx + dx, it.cz + dz, it.r, it.y0, it.y1); }
    }
    for (const mesh of dirty) { mesh.computeBoundingSphere(); if (mesh.userData.knock) mesh.boundingSphere.radius += 30; }
    lamp.x = target.x; lamp.z = target.z;
    moved.push({ from: old, to: target, knock: !!rec });
  }
  return moved;
}
