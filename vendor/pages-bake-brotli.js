// Deployment-only Brotli stream decoder. Source bakes remain canonical gzip.
// Runs in the existing baked worker (or its main-thread diagnostic fallback).
import init, { DecompressStream, BrotliStreamResultCode } from './brotli-dec-wasm/decoder.js';

let ready;
const decoderReady = () => ready ||= init();

export async function brotliReadable(input) {
  await decoderReady();
  const decoder = new DecompressStream();
  let finished = false;
  let closed = false;
  const close = () => { if (!closed) { closed = true; decoder.free(); } };
  const outputSize = 64 * 1024;
  return input.pipeThrough(new TransformStream({
    transform(chunk, controller) {
      try {
        if (finished) throw new Error('Trailing Brotli data');
        let offset = 0;
        do {
          const result = decoder.decompress(chunk.subarray(offset), outputSize);
          let bytes, code, consumed;
          try {
            bytes = result.buf; code = result.code; consumed = result.input_offset;
          } finally { result.free(); }
          if (bytes.length) controller.enqueue(bytes);
          offset += consumed;
          if (code === BrotliStreamResultCode.ResultSuccess) {
            if (offset !== chunk.length) throw new Error('Trailing Brotli data');
            finished = true;
            break;
          }
          if (code === BrotliStreamResultCode.NeedsMoreInput) {
            if (offset !== chunk.length) throw new Error('Brotli decoder left input unread');
            break;
          }
          if (code !== BrotliStreamResultCode.NeedsMoreOutput) throw new Error('Brotli decode failed');
          if (!bytes.length && !consumed) throw new Error('Brotli decoder stalled');
        } while (true);
      } catch (error) { close(); throw error; }
    },
    flush() {
      close();
      if (!finished) throw new Error('Truncated Brotli data');
    },
  }));
}
