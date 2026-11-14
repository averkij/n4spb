// Support-page worker only. Same codec and reply/transfer contract as the
// shipping worker, with small phase messages and an event-loop heartbeat.
import { decodeBaked, readBakedBuffer } from './baked-codec.js';

const active = new Map();
const trace = (id, phase, detail = '') => {
  active.set(id, phase);
  postMessage({ loadingDiagnostic: true, kind: 'phase', id, phase, detail });
};
postMessage({ loadingDiagnostic: true, kind: 'ready' });
setInterval(() => {
  if (active.size) postMessage({ loadingDiagnostic: true, kind: 'heartbeat', active: [...active] });
}, 1000);

globalThis.onmessage = async ({ data: { id, url, rawBytes, gzipJS } }) => {
  try {
    const t0 = performance.now();
    trace(id, 'fetch');
    const response = await fetch(url);
    trace(id, 'headers', `HTTP ${response.status}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    let buffer;
    // Pages may ship Brotli products. Those use the deployment codec's WASM
    // stream; the JS gzip option applies only to gzip transport.
    if (gzipJS && !response.url.split(/[?#]/)[0].endsWith('.bin.br')) {
      trace(id, 'download-compressed');
      const compressed = new Uint8Array(await response.arrayBuffer());
      trace(id, 'import-js-inflater', `${compressed.byteLength} compressed bytes`);
      const { inflateBakedGzip } = await import('./baked-gzip-js.js');
      trace(id, 'inflate-js');
      buffer = inflateBakedGzip(compressed, rawBytes);
    } else {
      trace(id, 'decompress');
      buffer = await readBakedBuffer(response, rawBytes);
    }
    trace(id, 'decode', `${buffer.byteLength} bytes`);
    const t1 = performance.now(), value = decodeBaked(buffer);
    trace(id, 'transfer');
    globalThis.postMessage({ id, value, bytes: buffer.byteLength,
      readMs: t1 - t0, decodeMs: performance.now() - t1 }, [buffer]);
    trace(id, 'transferred');
  } catch (error) {
    trace(id, 'error', String(error?.message || error));
    globalThis.postMessage({ id, error: String(error?.message || error) });
  } finally { active.delete(id); }
};
