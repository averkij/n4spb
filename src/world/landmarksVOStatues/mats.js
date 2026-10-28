// landmarksVOStatues/mats.js - the materials of the module (ctx.mat.toon only; every material / texture key starts with 'lmvos-').
//   vc        ONE vertex-colour material for every plain surface (granite, marble, steel, paint, wood, plaster, church walls): Parts.tint(hex) before the geometry.  The engine merges all of it per cell.
//   vc2       the same, double sided (wing membrane, sails, thin sheets)
//   bronzeSet { main, dark, accent } of the figure kit (patinated dark bronze with verdigris, eyes, gilt)
//   gilt      gilded surfaces (domes, crosses, bells): the figure-kit gold
//   plates    ATLAS pages of the name plates (plates.js), decals 2 cm in front of a surface
//   page      the open Pushkin page of the Open Book;  musa  the quatrains of the Musa Jalil shaft;  cobble  granite setts (aprons)
// Colours of the photographs (dossier docs/research/vo-statues-2026*.md): granite grey #8e8e88, polished pink-red #9c5a4c, black #222426, white-speckled #d4d2cc, marble #e8e6df, lava #4f4741, rust #8a4a2f.
import { figureMats } from '../lib/figures.js';
import { makePlates } from './plates.js';

export const PAL = {
  graniteGrey: '#8e8e88', graniteDark: '#6f7274', granitePink: '#9c5a4c', graniteRed: '#9c4b46', graniteBlack: '#222426', graniteWhite: '#d4d2cc', graniteLenin: '#a98d84', graniteMusa: '#5a3a35', graniteKarp: '#8e6f68', boulder: '#c9c9c4',
  marble: '#e8e6df', lava: '#4f4741', rust: '#8a4a2f', scrapRed: '#b8442f', wireBlue: '#2f5fd0', paintRed: '#c0233a', brassGold: '#d4a82a', bronzeNew: '#8a6a3e', bronzeBright: '#c9a24a', bronzeOld: '#4a4a3c', bronzePatina: '#4f8f7a',
  iron: '#23282a', steel: '#6c7378', wood: '#8a6a45', plaster: '#3f9a63', brickPink: '#c27a6e', cobble: '#8a8a84',
};

export function makeMats(ctx) {
  const T = ctx.mat.toon, fm = figureMats(ctx), tex = ctx.tex, M = { PAL, fm };
  M.vc = T('#ffffff', { vertexColors: true, name: 'lmvos-vc', paint: 0.04 });
  M.vc2 = T('#ffffff', { vertexColors: true, side: 'double', name: 'lmvos-vc2', paint: 0.03 });
  M.bronzeSet = { main: fm.bronze, dark: fm.dark, accent: fm.gold };
  M.bronzeMono = { main: fm.bronze, dark: fm.dark, accent: fm.bronze };                       // a bronze statue without gilt trim
  M.gilt = fm.gold;
  // warm brown bronze of the newer monuments (Musa Jalil, the polar explorer, the Student: photos n2101529725 c00 c02, n5102741821 c01, n12201012355 c00): one more material, a small brown patina map
  M.bronzeBrownTex = tex.draw(128, 128, (g, w, h) => {
    const r = ctx.rng(9341); g.fillStyle = '#5a4130'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { g.globalAlpha = 0.35; g.fillStyle = r() < 0.5 ? '#46322a' : '#74563f'; g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * 6, 0, 6.3); g.fill(); }
    g.globalAlpha = 1; g.fillStyle = 'rgba(122,98,72,0.35)'; g.fillRect(0, 0, w, h * 0.18);
  }, { key: 'lmvos-bronze-brown', repeat: [1, 1] });
  M.bronzeBrown = T('#ffffff', { map: M.bronzeBrownTex, name: 'lmvos-bronze-brown', paint: 0.03, emissive: '#1a0e08', emissiveIntensity: 0.25 });
  M.bronzeBrownSet = { main: M.bronzeBrown, dark: fm.dark, accent: M.bronzeBrown };
  M.water = T('#3e6e74', { name: 'lmvos-water', paint: 0.02, emissive: '#10303a', emissiveIntensity: 0.3, polygonOffset: -3 });   // fountain basins only (the Menshikov fountain recipe)
  M.plates = makePlates(ctx);
  const R = (seed) => ctx.rng(seed);
  // granite setts: 2 m tile, 0.14 x 0.1 m stones in staggered rows, grey with a few warm stones
  M.cobbleTex = tex.draw(256, 256, (g, w, h) => {
    const r = R(9301), rows = 20, rh = h / rows; g.fillStyle = '#5f625f'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < rows; k++) {
      const cols = 14, cw = w / cols, off = (k % 2) * cw / 2;
      for (let i = -1; i < cols; i++) {
        const v = 0.78 + r() * 0.34, warm = r() < 0.2 ? 1.08 : 1;
        g.fillStyle = `rgb(${138 * v * warm | 0},${138 * v | 0},${134 * v / warm | 0})`;
        g.fillRect(i * cw + off + 1, k * rh + 1, cw - 2, rh - 2);
        g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(i * cw + off + 1, k * rh + 1, cw - 2, 1.2);
      }
    }
  }, { key: 'lmvos-cobble', repeat: [1, 1] });
  M.cobble = T('#ffffff', { map: M.cobbleTex, name: 'lmvos-cobble', paint: 0.03, polygonOffset: -2 });
  // the open Pushkin page (Bronze Horseman, the introduction): capitals cut into the grey granite, 12 lines of the left page; uv 0..1 over the page
  M.pageTex = tex.draw(512, 512, (g, w, h) => {
    const r = R(9311);
    g.fillStyle = '#8b8d8c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,40,40'},${0.04 + r() * 0.06})`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
    const L = ['Люблю тебя, Петра творенье,', 'Люблю твой строгий, стройный вид,', 'Невы державное теченье,', 'Береговой её гранит,', 'Твоих оград узор чугунный,', 'Твоих задумчивых ночей', 'Прозрачный сумрак, блеск безлунный,', 'Когда я в комнате моей', 'Пишу, читаю без лампады,', 'И ясны спящие громады', 'Пустынных улиц, и светла', 'Адмиралтейская игла'];
    g.fillStyle = '#34363a'; g.textAlign = 'left'; g.textBaseline = 'middle';
    L.forEach((s, i) => { tex.fitText(g, s.toUpperCase(), 44, 56 + i * 33.5, w - 88, 21, tex.FONTS.serif, 600); });
    g.fillStyle = 'rgba(255,255,255,0.18)'; L.forEach((s, i) => { g.fillRect(44, 56 + i * 33.5 + 14, 80 + (s.length * 6.5) % 180, 1); });
  }, { key: 'lmvos-page' });
  M.page = T('#ffffff', { map: M.pageTex, name: 'lmvos-page', paint: 0.04 });
  // the four mosaic panels of the SPbU fountain (a 2 x 2 atlas of tessellated tiles: blue, gold, red, green schemes)
  M.mosaicTex = tex.draw(256, 256, (g, w, h) => {
    const r = R(9321), sch = [['#2f5fa8', '#7fb0e0', '#e8eef0'], ['#c99a2e', '#e8c860', '#8a5a1c'], ['#a8322e', '#e07a64', '#f0dcc0'], ['#2f7a52', '#7fc08a', '#d8e8c8']];
    for (let q = 0; q < 4; q++) { const x0 = (q % 2) * 128, y0 = Math.floor(q / 2) * 128, c = sch[q]; for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { g.fillStyle = c[Math.floor(r() * 3)]; g.fillRect(x0 + i * 8 + 0.5, y0 + j * 8 + 0.5, 7, 7); } }
  }, { key: 'lmvos-mosaic' });
  M.mosaic = T('#ffffff', { map: M.mosaicTex, name: 'lmvos-mosaic', paint: 0.02, polygonOffset: -2 });
  // the spines of the books under the Little Prince: the surnames of the faculty's scholars [W citywalls]: 5 rows of 512 x 51 px
  M.spinesTex = tex.draw(512, 256, (g, w, h) => {
    const names = ['Ларин', 'Срезневский', 'Стеблин-Каменский', 'Бодуэн де Куртене', 'Зиндер'], cols = ['#3d5a50', '#4a3d33', '#2f4a45', '#52443a', '#34504a'];
    names.forEach((n, i) => { g.fillStyle = cols[i]; g.fillRect(0, i * 51.2, w, 51.2); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, i * 51.2, w, 3); g.fillStyle = '#d6b45a'; g.textAlign = 'center'; g.textBaseline = 'middle'; tex.fitText(g, n.toUpperCase(), w / 2, i * 51.2 + 27, w - 60, 28, tex.FONTS.serif, 700); });
  }, { key: 'lmvos-spines' });
  M.spines = T('#ffffff', { map: M.spinesTex, name: 'lmvos-spines', paint: 0.03 });
  M.sets = { stone: { main: M.vc, dark: M.vc, accent: M.vc } };
  return M;
}
