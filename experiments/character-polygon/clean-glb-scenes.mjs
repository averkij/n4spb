// Blender selection exports can retain an empty scene for unrelated open work.
// Remove those scenes after glTF Transform dedup/prune, preserving the BIN chunk.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
for (const name of ['civilian', 'sedan', 'man-white', 'woman-beret', 'man-jacket']) {
  const file = fileURLToPath(new URL(`./assets/${name}.glb`, import.meta.url));
  const source = fs.readFileSync(file);
  if (source.readUInt32LE(0) !== 0x46546c67 || source.readUInt32LE(4) !== 2) throw new Error('Expected a glTF 2.0 binary');
  const jsonLength = source.readUInt32LE(12), data = JSON.parse(source.subarray(20, 20 + jsonLength));
  const defaultScene = data.scenes[data.scene ?? 0];
  data.scenes = data.scenes.filter(scene => scene === defaultScene || scene.nodes?.length);
  data.scene = data.scenes.indexOf(defaultScene);
  const text = Buffer.from(JSON.stringify(data));
  const json = Buffer.alloc(Math.ceil(text.length / 4) * 4, 0x20); text.copy(json);
  const tail = source.subarray(20 + jsonLength);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(20 + json.length + tail.length, 8);
  header.writeUInt32LE(json.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  fs.writeFileSync(file, Buffer.concat([header, json, tail]));
  console.log(`${name}: ${data.scenes.length} populated scene, ${data.animations?.length ?? 0} animations`);
}
