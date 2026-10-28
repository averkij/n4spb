// landmarksVOStatues/plates.js - the name plates and carved inscriptions of the monuments: ONE canvas atlas (pages of 4 x 8 cells of 256 x 128 px) drawn once, one decal quad per plate.
// Texts are the REAL ones of the dossiers (docs/research/vo-statues-2026*.md: OSM inscription tags, citywalls.ru, ru.wikipedia, photographs that were read); where an inscription is not known the plate carries
// the name of the object and the documented author / year only.  Kinds: brass (a small garden plate), steel (stainless plate), carve (light letters cut into dark granite), gold (gilt letters on black).
// A freestanding plate reserves its rectangle in ctx.services.labels (kind 'plate', pseudo building id 'vostatues') so that nothing else is hung over it.
import { TEXT } from './platetext.js';

export const CELL = { w: 256, h: 128, cols: 4, rows: 8 };
export const PER_PAGE = CELL.cols * CELL.rows;
const KEYS = Object.keys(TEXT);
export const plateIndex = (key) => KEYS.indexOf(key);
/** { page, u0, v0, u1, v1 } of a plate key (null when unknown) */
export function plateCell(key) {
  const i = plateIndex(key); if (i < 0) return null;
  const page = Math.floor(i / PER_PAGE), c = i % PER_PAGE, cx = c % CELL.cols, cy = Math.floor(c / CELL.cols);
  return { page, u0: (cx * CELL.w + 3) / (CELL.w * CELL.cols), u1: ((cx + 1) * CELL.w - 3) / (CELL.w * CELL.cols), v1: 1 - (cy * CELL.h + 3) / (CELL.h * CELL.rows), v0: 1 - ((cy + 1) * CELL.h - 3) / (CELL.h * CELL.rows) };
}

const SKIN = {
  brass: { bg: '#8a7035', rim: '#cfae5a', ink: '#23190a', hi: 'rgba(255,236,170,0.5)' },
  steel: { bg: '#b4bbc1', rim: '#e3e7ea', ink: '#262c31', hi: 'rgba(255,255,255,0.6)' },
  carve: { bg: '#2c2d30', rim: '#2c2d30', ink: '#d8d6cc', hi: 'rgba(255,255,255,0.0)' },
  gold: { bg: '#18191b', rim: '#18191b', ink: '#d8b653', hi: 'rgba(255,255,255,0.0)' },
};

function wrap(g, text, maxW) {
  const words = String(text).split(/\s+/), out = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }
  if (cur) out.push(cur); return out;
}

/** the atlas pages as materials (ctx.mat.toon with a canvas map, decal offset) */
export function makePlates(ctx) {
  const tex = ctx.tex, pages = [], nPages = Math.max(1, Math.ceil(KEYS.length / PER_PAGE));
  for (let p = 0; p < nPages; p++) {
    const map = tex.draw(CELL.w * CELL.cols, CELL.h * CELL.rows, (g, W, H) => {
      g.fillStyle = '#20262c'; g.fillRect(0, 0, W, H);
      for (let c = 0; c < PER_PAGE; c++) {
        const key = KEYS[p * PER_PAGE + c]; if (!key) break;
        const T = TEXT[key], S = SKIN[T.k || 'brass'], x0 = (c % CELL.cols) * CELL.w, y0 = Math.floor(c / CELL.cols) * CELL.h;
        g.fillStyle = T.bg || S.bg; g.fillRect(x0 + 3, y0 + 3, CELL.w - 6, CELL.h - 6);
        if (T.k === 'brass' || T.k === 'steel' || !T.k) { g.strokeStyle = S.rim; g.lineWidth = 3; g.strokeRect(x0 + 8, y0 + 8, CELL.w - 16, CELL.h - 16); g.fillStyle = S.hi; g.fillRect(x0 + 10, y0 + 10, CELL.w - 20, 3); }
        g.fillStyle = T.ink || S.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
        const big = T.big || 0, tsz = big || 25;
        const ts = tex.fitText(g, T.t, x0 + CELL.w / 2, y0 + (T.b ? 31 : CELL.h / 2), CELL.w - 34, tsz, tex.FONTS.serif, 700);
        if (T.b) {
          let bs = T.bs || 15; g.font = `500 ${bs}px ${tex.FONTS.sans}`;
          let lines = wrap(g, T.b, CELL.w - 40);
          while (lines.length > 4 && bs > 9) { bs -= 1; g.font = `500 ${bs}px ${tex.FONTS.sans}`; lines = wrap(g, T.b, CELL.w - 40); }
          lines.slice(0, 5).forEach((s, i) => g.fillText(s, x0 + CELL.w / 2, y0 + 33 + ts * 0.6 + bs * 0.4 + i * (bs + 2.5)));
        }
      }
    }, { key: 'lmvos-plates-' + p });
    pages.push(ctx.mat.toon('#ffffff', { map, name: 'lmvos-plates-' + p, paint: 0, polygonOffset: -2 }));
  }
  return pages;
}

/** a plate (decal quad, facing +z of the current frame) at (x, y, z) centre, w x h metres; reserves the label rectangle (world frame from K) and returns false when occupied or unknown */
export function plateOn(P, M, K, key, w, h, x, y, z, rotY = 0) {
  const c = plateCell(key); if (!c || !M.plates || !M.plates[c.page]) return false;
  if (K && K.labels) {
    const cs = Math.cos(K.yaw), sn = Math.sin(K.yaw), tot = K.yaw + rotY;                      // frame of the piece: rotY turns +z toward +x
    const wx = K.x + x * cs + z * sn, wz = K.z - x * sn + z * cs;
    if (!K.labels.reserve('vostatues', wx, y, wz, w, h, Math.sin(tot), Math.cos(tot), 'plate')) return false;
  }
  const mat = M.plates[c.page];
  P.push(x, y, z, rotY);
  P.quad(mat, [-w / 2, -h / 2, 0], [w / 2, -h / 2, 0], [w / 2, h / 2, 0], [-w / 2, h / 2, 0], [0, 0, 1], [[c.u0, c.v0], [c.u1, c.v0], [c.u1, c.v1], [c.u0, c.v1]]);
  P.pop();
  return true;
}

/** a plate on an arbitrary quad (corners bottom-left, bottom-right, top-right, top-left in the current frame), e.g. a slanted slab; no label reservation (the caller owns the surface) */
export function plateQuad(P, M, key, bl, br, tr, tl) {
  const c = plateCell(key); if (!c || !M.plates || !M.plates[c.page]) return false;
  const u = [br[0] - bl[0], br[1] - bl[1], br[2] - bl[2]], v = [tl[0] - bl[0], tl[1] - bl[1], tl[2] - bl[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  P.quad(M.plates[c.page], bl, br, tr, tl, n, [[c.u0, c.v0], [c.u1, c.v0], [c.u1, c.v1], [c.u0, c.v1]]);
  return true;
}
