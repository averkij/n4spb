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

export async function bronzeMaterial(ctx) {
  const url = new URL('../../../assets/sculptures/klodt-bronze.jpg', import.meta.url);
  // The CPU world builder measures geometry and texture allocation with a
  // canvas stub. The browser and the shipping baker both paint the actual scan.
  let bitmap;
  if (url.protocol !== 'file:') {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Klodt bronze texture HTTP ' + response.status);
    bitmap = await createImageBitmap(await response.blob());
  }
  try {
    const map = ctx.tex.draw(1024, 1024, g => {
      if (bitmap) g.drawImage(bitmap, 0, 0);
    }, { key: 'lmC-cast-bronze' });
    return ctx.mat.toon('#faf6ec', { map, name: 'lmC-cast-bronze' });
  } finally {
    bitmap?.close();
  }
}
