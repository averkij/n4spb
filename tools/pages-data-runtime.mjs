// Deployment-only codec. The emitted copy lives in dist/vendor, never src/ or a bake.
import { gunzipSync } from '../vendor/fflate/fflate.module.js';

export const MAX_JSON_BYTES = 32 * 1024 * 1024;
const CRC_TABLE = Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});

export function unpackJSON(encoded, size) {
  if(!Number.isInteger(size)||size<0||size>MAX_JSON_BYTES)throw new Error('Packed JSON length exceeds limit');
  if(typeof encoded!=='string'||encoded.length>MAX_JSON_BYTES*2+128||encoded.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))throw new Error('Invalid packed JSON base64');
  const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),n=bytes.length;
  const u32=i=>(bytes[i]|bytes[i+1]<<8|bytes[i+2]<<16|bytes[i+3]<<24)>>>0;
  if(n<18||bytes[0]!==31||bytes[1]!==139||bytes[2]!==8||u32(n-4)!==size)throw new Error('Packed JSON gzip length mismatch');
  const plain=gunzipSync(bytes,{out:new Uint8Array(size)});
  if(plain.length!==size)throw new Error('Packed JSON decoded length mismatch');
  let crc=0xffffffff;for(const b of plain)crc=CRC_TABLE[(crc^b)&255]^(crc>>>8);
  if(((crc^0xffffffff)>>>0)!==u32(n-8))throw new Error('Packed JSON checksum mismatch');
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(plain));
}
