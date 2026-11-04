// Diagnostic alternative to native DecompressionStream. Keep one final output
// buffer, and validate gzip size/CRC because gunzipSync does not check the CRC.
import { gunzipSync } from '../../vendor/fflate/fflate.module.js';
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let crc = i;
  for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  crcTable[i] = crc >>> 0;
}
export function inflateBakedGzip(compressed, rawBytes) {
  if (!Number.isSafeInteger(rawBytes) || rawBytes < 8 || rawBytes > 512 * 1024 * 1024) throw Error('Invalid baked output size');
  if (compressed.byteLength < 18) throw Error('Truncated gzip data');
  const trailer = new DataView(compressed.buffer, compressed.byteOffset + compressed.byteLength - 8, 8);
  if (trailer.getUint32(4, true) !== rawBytes) throw Error('Gzip size does not match manifest');
  const output = gunzipSync(compressed, { out: new Uint8Array(rawBytes) });
  if (output.byteLength !== rawBytes) throw Error('Decoded size does not match manifest');
  let crc = 0xffffffff;
  for (let i = 0; i < output.length; i++) crc = crcTable[(crc ^ output[i]) & 255] ^ (crc >>> 8);
  if (((crc ^ 0xffffffff) >>> 0) !== trailer.getUint32(0, true)) throw Error('Gzip checksum mismatch');
  return output.buffer;
}
