import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const source = new URL('../../../assets/sculptures/klodt.glb', import.meta.url);

export async function loadHorseTamers() {
  const loader = new GLTFLoader();
  // The CPU area builder imports this module from disk. Use the same GLB for
  // its geometry and bounds checks as the browser uses for the shipping bake.
  let gltf;
  if (source.protocol === 'file:') {
    const bytes = await process.getBuiltinModule('node:fs/promises').readFile(source);
    gltf = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  } else {
    gltf = await loader.loadAsync(source.href);
  }
  const sculptures = {};
  for (const pose of ['A', 'B', 'C', 'D']) {
    const mesh = gltf.scene.getObjectByName('Klodt_' + pose);
    if (!mesh?.isMesh) throw new Error('Missing Klodt sculpture ' + pose);
    mesh.updateWorldMatrix(true, false);
    sculptures[pose] = mesh.geometry.applyMatrix4(mesh.matrixWorld);
  }
  return sculptures;
}

export function bronzeMaterial(ctx) {
  // Sculpt UVs encode baked ambient visibility (U) and broad reflected light (V).
  // This keeps recesses warm and rubbed, sky-facing bronze cooler in one draw.
  const palette = ctx.tex.draw(64, 64, (g, w, h) => {
    for (let y = 0; y < h; y++) {
      const sky = 1 - y / (h - 1);
      const grad = g.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, '#191918');
      grad.addColorStop(.50, `rgb(${42+38*sky|0},${38+40*sky|0},${31+39*sky|0})`);
      const shade = [52 + sky * 151, 48 + sky * 157, 40 + sky * 147];
      grad.addColorStop(1, 'rgb(' + shade.map(Math.round).join(',') + ')');
      g.fillStyle = grad;
      g.fillRect(0, y, w, 1);
    }
  }, { key: 'lmC-cast-bronze' });
  return ctx.mat.toon('#e0dbd2', { map: palette, name: 'lmC-cast-bronze' });
}
