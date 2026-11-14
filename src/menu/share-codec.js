// A view, not a saved world. Numeric arrays preserve camera roll as well as yaw/pitch.
export function decodeView(hash, registry) {
  if (!hash.startsWith('#view=')) return null;
  try {
    if (hash.length > 3000) throw Error('length');
    const v = JSON.parse(decodeURIComponent(hash.slice(6)));
    const row = typeof v.area==='string' && Object.hasOwn(registry,v.area) ? registry[v.area] : null;
    if (v.v !== 1 || !row || row.parked || row.status === 'planned') throw Error('area/version');
    if (!Array.isArray(v.pos) || v.pos.length !== 3 || !v.pos.every(n=>Number.isFinite(n)&&Math.abs(n)<100000)) throw Error('position');
    if (!Array.isArray(v.rot) || v.rot.length !== 3 || !v.rot.every(n=>Number.isFinite(n)&&Math.abs(n)<=Math.PI*2)) throw Error('rotation');
    if (!Number.isFinite(v.fov) || v.fov<20 || v.fov>120 || !Number.isFinite(v.tod) || v.tod<0 || v.tod>4) throw Error('lens/light');
    if (v.look !== null && !['overcast','cloudy'].includes(v.look)) throw Error('look');
    return {...v,noui:v.noui===true};
  } catch { return {invalid:true}; }
}
export function encodeView(view, base, page) {
  const url = new URL(page, base);
  const rot=view.rot.map(n=>Math.abs(n)<=Math.PI?n:Math.atan2(Math.sin(n),Math.cos(n)));
  url.search = ''; url.hash = 'view='+encodeURIComponent(JSON.stringify({v:1,...view,rot}));
  return url.href;
}
