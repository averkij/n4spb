// landmarksKamennoostrovsky/common.js - palette, canvas textures, materials and the stucco-facade VOCABULARY (copied from the Nevsky landmark houses, landmarksMariinsky/common.js; the Art Nouveau
// additions of this module are in nouveau.js).  K.capture(fn) builds a TEMPLATE collector (see kit.js Parts.stamp).
//
// makeKit(ctx) -> K.  K.P is the geometry collector (kit.js Parts); every facade function below draws in the CURRENT facade frame (x = along the wall to the right seen from the
// street, y up, z out of the wall; kit.onEdge pushes it).  Windows are a glass quad 5 cm in front of the wall + a stucco surround + sill / hood: the wall itself is a flat quad, so a
// facade of 15 bays x 5 floors costs ~6000 triangles and stays crisp at 1 m.  Sources: docs/research/nevsky.md (colours, storeys) and refs/nevsky photos 14 15 16 18 30 57 64.
import * as THREE from 'three';
import * as L from '../layout.js';
import { Parts, rectPath, archPath, DEG, onEdge } from './kit.js';
import { makeReliefs } from './reliefs.js';

// ------------------------------------------------------------------------------------------------ palette (docs/research/nevsky.md, LOOK.md)
export const C = {
  trim: '#f1ece0', trimCream: '#e8dcc4', trimShade: '#d8cfbd', cornice: '#e6dcc6', corniceShade: '#bda98a', rustic: '#b09c80',
  iron: '#1b1f20', ironSoft: '#2a2e30', granite: '#8c8f92', graniteDark: '#5d5f62', graniteWarm: '#9a948c', plinthPink: '#8c6b66',
  roofGreen: '#5a7a63', roofSilver: '#9ba0a3', roofRust: '#8b4a3d', roofDark: '#4a4a52',
  doorWood: '#4a2f26', doorDark: '#2a2622', frameBrown: '#5b3f2e', frameWhite: '#f2efe8',
  awning: '#8c1d2e', awningValance: '#6d1523', awningCream: '#d8cfb8',
  brass: '#c9a24b', metroM: '#1795d4', metroMDark: '#1f4e9e', signDark: '#262a30', signCream: '#e8e0cf',
  chimney: '#b4523c', chimneyYellow: '#e0b457', glassBlue: '#8fb4d6',
};

const hash = (...a) => { let h = 2166136261; for (const v of a) { h ^= (Math.floor(v * 1000) | 0) + 0x9e3779b9; h = Math.imul(h, 16777619); h ^= h >>> 13; } return ((h >>> 0) % 100000) / 100000; };

export function makeKit(ctx) {
  const T = ctx.mat.toon, THREE_ = THREE;
  const tex = ctx.tex;
  let cur = new Parts();
  // P forwards to the collector of the building being built (K.begin() starts a new one, K.flush() turns it into meshes)
  const P = new Proxy({}, { get: (_, k) => { const v = cur[k]; return typeof v === 'function' ? v.bind(cur) : v; } });
  const nightMats = [];                                                // materials whose emissive follows uNight
  const K = { ctx, P, L, C, THREE: THREE_, nightMats, hash, tris: 0 };
  K.onEdgeFn = (e, fn) => onEdge(P, e, fn);
  K.begin = () => { cur = new Parts(); return K; };
  /** run fn with an empty collector in an identity frame and return that collector (a template for P.stamp) */
  K.capture = (fn) => { const keep = cur, t = new Parts(); cur = t; try { fn(); } finally { cur = keep; } return t; };
  K.flush = (parent, name) => {
    K.tris += cur.tris;
    for (const k of cur.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksKamennoostrovsky] ${name}: NaN vertex in material ${k.mat.name || k.mat.color.getHexString()} at ${bad / 3 | 0} of ${k.n}`); }
    const meshes = cur.build(parent, { name });
    for (const m of meshes) if (K.decalMats.has(m.material)) ctx.noOutline(m);
    cur = new Parts(); return meshes;
  };

  // -------------------------------------------------------------------------------------------- canvas textures
  /** rustication tile: 2.4 m x 1.2 m, two courses of 1.2 m blocks, grooves; white so that the material colour tints it */
  K.texRust = tex.draw(256, 128, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c4baa8';
    g.fillRect(0, 0, w, 5); g.fillRect(0, h / 2 - 2, w, 5);
    g.fillRect(0, 0, 4, h / 2); g.fillRect(w / 2 - 2, h / 2, 4, h / 2);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, 5, w, 3); g.fillRect(0, h / 2 + 3, w, 3);
  }, { key: 'lmKam-rust', repeat: [1, 1] });
  /** dentil / modillion strip: tile 0.6 m wide: two blocks and two gaps, for the frieze under a cornice */
  K.texDentil = tex.draw(128, 64, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#9d907a';
    for (let i = 0; i < 4; i++) g.fillRect(i * 32 + 22, 12, 10, 40);
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 8, w, 8);
  }, { key: 'lmKam-dentil', repeat: [1, 1] });
  /** white relief frieze of rosettes in squares (Nevsky 114 type), tile 1.2 m x 0.6 m, alpha cut-out */
  K.texRosette = tex.draw(128, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#f4efe4';
    for (let i = 0; i < 2; i++) {
      const cx = i * 64 + 32, cy = 32;
      g.beginPath(); g.arc(cx, cy, 20, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#c8c0ae'; g.beginPath(); g.arc(cx, cy, 11, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#f4efe4'; g.beginPath(); g.arc(cx, cy, 5, 0, Math.PI * 2); g.fill();
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.fillRect(cx + Math.cos(a) * 24 - 3, cy + Math.sin(a) * 24 - 3, 6, 6); }
    }
  }, { key: 'lmKam-rosette', repeat: [1, 1] });
  /** window atlas, 4 variants of 128 x 256 (1 : 2): sash frames + curtains / blinds / sky reflections. `lit` = the night emissive map */
  const winAtlas = (frame, lit, key) => tex.draw(512, 256, (g, w, h) => {
    for (let i = 0; i < 4; i++) {
      const x0 = i * 128;
      g.fillStyle = lit ? '#000000' : frame; g.fillRect(x0, 0, 128, 256);
      const panes = [[x0 + 8, 8, 112, 64], [x0 + 8, 80, 52, 168], [x0 + 68, 80, 52, 168]];
      const warm = lit && (i === 1 || i === 3);
      for (const [px, py, pw, ph] of panes) {
        let gr;
        if (lit) { gr = g.createLinearGradient(0, py, 0, py + ph); gr.addColorStop(0, warm ? '#ffe6ac' : '#000'); gr.addColorStop(1, warm ? '#ffc070' : '#000'); }
        else {
          gr = g.createLinearGradient(0, py, 0, py + ph);
          if (i === 0) { gr.addColorStop(0, '#86b6e0'); gr.addColorStop(1, '#3e6a9c'); }
          else if (i === 1) { gr.addColorStop(0, '#34425a'); gr.addColorStop(1, '#232c3c'); }
          else if (i === 2) { gr.addColorStop(0, '#b0cde6'); gr.addColorStop(1, '#6590bd'); }
          else { gr.addColorStop(0, '#4a5d78'); gr.addColorStop(1, '#2b3649'); }
        }
        g.fillStyle = gr; g.fillRect(px, py, pw, ph);
        if (!lit) {
          if (i === 1) { g.fillStyle = 'rgba(236,226,204,0.92)'; g.fillRect(px, py + ph * 0.28, pw, ph * 0.72); }
          if (i === 2 && py > 40) { g.fillStyle = 'rgba(244,244,238,0.9)'; for (let s = 0; s < 5; s++) g.fillRect(px, py + s * 14, pw, 8); }
          if (i === 3 && px < x0 + 64) { g.fillStyle = 'rgba(214,224,238,0.88)'; g.fillRect(px, py, pw, ph); }
          g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.moveTo(px + pw * 0.2, py + ph); g.lineTo(px + pw * 0.55, py); g.lineTo(px + pw * 0.75, py); g.lineTo(px + pw * 0.4, py + ph); g.fill();
        } else if (warm && i === 1) { g.fillStyle = 'rgba(255,170,90,0.5)'; g.fillRect(px, py + ph * 0.28, pw, ph * 0.72); }
      }
    }
  }, { key });
  K.texWinBrown = winAtlas(C.frameBrown, false, 'lmKam-win-brown'); K.texWinBrownLit = winAtlas('#000', true, 'lmKam-win-brown-lit');
  K.texWinWhite = winAtlas(C.frameWhite, false, 'lmKam-win-white'); K.texWinWhiteLit = K.texWinBrownLit;
  /** shop glass atlas: 4 variants of 256 x 128 (2 : 1): dark interiors, warm lamps, shelves, mannequins */
  const shopAtlas = (lit, key) => tex.draw(1024, 128, (g, w, h) => {
    for (let i = 0; i < 4; i++) {
      const x0 = i * 256;
      const base = ['#3a3532', '#2a3036', '#473a33', '#2c3a38'][i];
      g.fillStyle = lit ? '#1a1612' : base; g.fillRect(x0, 0, 256, 128);
      // ceiling lamps
      g.fillStyle = lit ? '#fff0c8' : '#e8dcc0'; for (let k = 0; k < 4; k++) g.fillRect(x0 + 20 + k * 62, 6, 34, 6);
      if (lit) { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,214,150,0.95)'); gr.addColorStop(1, 'rgba(255,170,90,0.35)'); g.fillStyle = gr; g.fillRect(x0 + 6, 14, 244, 108); }
      // shelves / goods
      const pal = ['#c8503a', '#d6b25a', '#6f8fb0', '#e8e0d0', '#7a9a6a', '#b06a8a'];
      for (let r = 0; r < 3; r++) for (let k = 0; k < 8; k++) { const hh = hash(i, r, k); g.fillStyle = lit ? 'rgba(0,0,0,0.25)' : pal[Math.floor(hh * 6)]; g.globalAlpha = lit ? 1 : 0.55; g.fillRect(x0 + 12 + k * 30, 30 + r * 30, 22, 14 + hh * 10); }
      g.globalAlpha = 1;
      // mannequins
      if (i % 2 === 0) { g.fillStyle = lit ? 'rgba(60,40,30,0.8)' : '#ded6c8'; g.fillRect(x0 + 90, 40, 14, 70); g.fillRect(x0 + 160, 44, 14, 66); }
      // reflection of the sky on the glass
      if (!lit) { g.fillStyle = 'rgba(150,185,220,0.22)'; g.fillRect(x0, 0, 256, 128); g.fillStyle = 'rgba(255,255,255,0.14)'; g.beginPath(); g.moveTo(x0 + 40, 128); g.lineTo(x0 + 120, 0); g.lineTo(x0 + 150, 0); g.lineTo(x0 + 70, 128); g.fill(); }
    }
  }, { key });
  K.texShop = shopAtlas(false, 'lmKam-shop'); K.texShopLit = shopAtlas(true, 'lmKam-shop-lit');

  // -------------------------------------------------------------------------------------------- materials
  const glassMat = (map, lit, name) => {
    const m = T('#ffffff', { map, name, paint: 0.02 });
    m.emissive = new THREE.Color('#ffffff'); m.emissiveMap = lit; m.emissiveIntensity = 0;
    nightMats.push(m); return m;
  };
  K.mats = {
    trim: T(C.trim), cream: T(C.trimCream), shade: T(C.trimShade), cornice: T(C.cornice), corniceShade: T(C.corniceShade),
    iron: T(C.iron), ironSoft: T(C.ironSoft), granite: T(C.granite), graniteDark: T(C.graniteDark), graniteWarm: T(C.graniteWarm),
    doorWood: T(C.doorWood), doorDark: T(C.doorDark), brass: T(C.brass, { emissive: '#3a2a08', emissiveIntensity: 0.4 }),
    awning: T(C.awning, { side: 'double' }), awningValance: T(C.awningValance), awningCream: T(C.awningCream, { side: 'double' }),
    roofGreen: T(C.roofGreen), roofSilver: T(C.roofSilver), roofRust: T(C.roofRust), roofDark: T(C.roofDark), chimney: T(C.chimney), chimneyYellow: T(C.chimneyYellow),
    winBrown: glassMat(K.texWinBrown, K.texWinBrownLit, 'lmKam-winB'), winWhite: glassMat(K.texWinWhite, K.texWinWhiteLit, 'lmKam-winW'),
    shop: glassMat(K.texShop, K.texShopLit, 'lmKam-shop'),
    dentil: T(C.cornice, { map: K.texDentil }),
    rosette: T('#ffffff', { map: K.texRosette, alphaTest: 0.5, side: 'double', name: 'lmKam-rosette' }),
    black: T('#101214'), glassDark: T('#1e2630'),
  };
  K.decalMats = new Set([K.mats.rosette]);
  // night: windows / shop glass glow with uNight
  ctx.onUpdate(() => {
    const n = ctx.shared.uNight ? ctx.shared.uNight.value : 0, k = Math.min(1, Math.max(0, (n - 0.12) / 0.5));
    for (const m of nightMats) m.emissiveIntensity = k * 0.95;
  });
  const wallCache = new Map();
  /** plain stucco / rusticated wall material for a colour */
  K.wall = (hex) => { if (!wallCache.has(hex)) wallCache.set(hex, T(hex)); return wallCache.get(hex); };
  K.rust = (hex) => { const k = 'r' + hex; if (!wallCache.has(k)) wallCache.set(k, T(hex, { map: K.texRust })); return wallCache.get(k); };
  K.mat = (hex, o) => T(hex, o);

  // -------------------------------------------------------------------------------------------- sign textures
  K.signTex = (text, o = {}) => {
    const w = o.w || 512, h = o.h || 96, key = 'lmKam-sign|' + text + '|' + JSON.stringify(o);
    return tex.draw(w, h, (g) => {
      if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, w, h); } else g.clearRect(0, 0, w, h);
      g.fillStyle = o.fg || '#f4efe6'; g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
      tex.fitText(g, text, o.align === 'left' ? w * 0.05 : w / 2, h * 0.54, w * (o.fill ?? 0.92), h * (o.size ?? 0.66), o.font || tex.FONTS.round, o.weight || 600);
    }, { key });
  };

  // -------------------------------------------------------------------------------------------- vocabulary (all in the current facade frame)
  /** flat wall quad x0..x1, y0..y1 at z = 0 (uv in metres / tile) */
  K.wallQuad = (mat, x0, x1, y0, y1, tile = 1, z = 0, tileY = tile) => {
    P.quad(mat, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1], [[x0 / tile, y0 / tileY], [x1 / tile, y0 / tileY], [x1 / tile, y1 / tileY], [x0 / tile, y1 / tileY]]);
  };
  /** the same wall with round-headed / rectangular holes (Shape holes): holes = [{ x, y0, w, h, head }] */
  K.wallWithHoles = (mat, x0, x1, y0, y1, holes, tile = 3, tileY = tile) => {
    const s = new THREE.Shape(); rectPath(s, x0, y0, x1, y1, false);
    for (const hl of holes) { const p = new THREE.Path(); if (hl.head === 'arch') archPath(p, hl.x, hl.y0, hl.w, Math.max(0.05, hl.h - hl.w / 2), true); else rectPath(p, hl.x - hl.w / 2, hl.y0, hl.x + hl.w / 2, hl.y0 + hl.h, true); s.holes.push(p); }
    const g = new THREE.ShapeGeometry(s, 10), ua = g.attributes.uv, pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) ua.setXY(i, pa.getX(i) / tile, pa.getY(i) / tileY);
    K.P.geo(mat, g, 0, 0, 0); g.dispose();
  };
  /** textured plane (decals, signs, relief panels) facing out, `z` out of the wall */
  K.plane = (mat, x0, x1, y0, y1, z, uv = [[0, 0], [1, 0], [1, 1], [0, 1]]) => {
    P.quad(mat, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1], uv);
  };
  /** repeat a relief texture (aspect `asp` = width / height of one tile) along a strip */
  K.strip = (mat, x0, x1, y0, y1, z, asp = 4) => {
    const n = Math.max(1, Math.round((x1 - x0) / ((y1 - y0) * asp)));
    P.quad(mat, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1], [[0, 0], [n, 0], [n, 1], [0, 1]]);
  };
  const cell = (v) => { const e = 0.004; return [v / 4 + e, (v + 1) / 4 - e]; };
  /** glass pane (rect or round head) at z, atlas variant v (0..3) */
  K.glass = (mat, x, y0, w, h, head, v, z = 0.05, atlas = 4) => {
    const u0 = v / atlas + 0.004, u1 = (v + 1) / atlas - 0.004;
    const x0 = x - w / 2, x1 = x + w / 2;
    if (head === 'arch') {
      const r = w / 2, hs = Math.max(0.05, h - r), seg = 10;
      const pts = [[x0, y0], [x1, y0], [x1, y0 + hs]];
      for (let i = 1; i < seg; i++) { const a = Math.PI * i / seg; pts.push([x + Math.cos(a) * r, y0 + hs + Math.sin(a) * r]); }
      pts.push([x0, y0 + hs]);
      // two triangle fans: the rect part and the half disc
      const uvf = (p) => [u0 + (p[0] - x0) / w * (u1 - u0), (p[1] - y0) / h];
      P.fan(mat, [[x0, y0, z], [x1, y0, z], [x1, y0 + hs, z], [x0, y0 + hs, z]], [0, 0, 1], (p) => uvf(p));
      const disc = [[x + r, y0 + hs, z]]; for (let i = 1; i < seg; i++) { const a = Math.PI * i / seg; disc.push([x + Math.cos(a) * r, y0 + hs + Math.sin(a) * r, z]); } disc.push([x - r, y0 + hs, z]);
      const c = [[x, y0 + hs, z]].concat(disc);
      P.fan(mat, c, [0, 0, 1], (p) => uvf(p));
    } else {
      P.quad(mat, [x0, y0, z], [x1, y0, z], [x1, y0 + h, z], [x0, y0 + h, z], [0, 0, 1], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]]);
    }
  };
  /** stucco surround of a window opening: sides + lintel (rect) or an arched ring. sw = width of the frame, d = projection */
  K.surround = (mat, x, y0, w, h, head, sw, d) => {
    if (head === 'arch') {
      const r = w / 2 + sw, hs = Math.max(0.05, h - w / 2);
      const s = new THREE.Shape(); archPath(s, x, y0 - 0.0, w + 2 * sw, hs, false);
      const hole = new THREE.Path(); archPath(hole, x, y0, w, hs, true); s.holes.push(hole);
      P.extrude(mat, s, 0, d, 1, 8); void r;
    } else {
      const x0 = x - w / 2, x1 = x + w / 2;
      P.box(mat, x0 - sw, x0, y0, y0 + h + sw, 0, d, 'kb');
      P.box(mat, x1, x1 + sw, y0, y0 + h + sw, 0, d, 'kb');
      P.box(mat, x0, x1, y0 + h, y0 + h + sw, 0, d, 'kb');
    }
  };
  /** projecting sill with two small brackets */
  K.sill = (mat, x, y0, w, sw = 0.12, d = 0.16) => { P.box(mat, x - w / 2 - sw, x + w / 2 + sw, y0 - 0.1, y0, 0, d, 'k'); };
  /** triangular or segmental hood over a window (top of the surround at yTop) */
  K.hood = (mat, kind, x, yTop, w, hh, d) => {
    const s = new THREE.Shape(), x0 = x - w / 2, x1 = x + w / 2;
    s.moveTo(x0, yTop); s.lineTo(x1, yTop);
    if (kind === 'tri') s.lineTo(x, yTop + hh); else s.quadraticCurveTo(x, yTop + 2 * hh, x0, yTop);
    if (kind === 'tri') s.lineTo(x0, yTop);
    P.extrude(mat, s, 0, d, 1, 6);
  };
  let winSeed = 0;
  /**
   * One window. o = { x, y (sill), w, h, head 'flat'|'arch', sw (surround width), d (surround depth), hood 'tri'|'seg'|null, hoodH, sill (bool), frame 'brown'|'white', v (variant), surMat, sillMat, hoodMat, lintel (extra box height) }
   */
  K.window = (o) => {
    const w = o.w ?? 1.2, h = o.h ?? 2.0, head = o.head || 'flat', sw = o.sw ?? 0.2, d = o.d ?? 0.1;
    const v = o.v ?? Math.floor(hash(++winSeed, o.x, o.y) * 4) % 4;
    const gm = (o.frame || 'brown') === 'white' ? K.mats.winWhite : K.mats.winBrown;
    K.glass(gm, o.x, o.y, w, h, head, v);
    if (sw > 0) K.surround(o.surMat || K.mats.trim, o.x, o.y, w, h, head, sw, d);
    if (o.sill !== false) K.sill(o.sillMat || o.surMat || K.mats.trim, o.x, o.y, w, sw * 0.7, d + 0.07);
    if (o.hood) K.hood(o.hoodMat || o.surMat || K.mats.trim, o.hood, o.x, o.y + h + sw, w + 2 * sw + (o.hoodOver ?? 0.16), o.hoodH ?? 0.45, d + 0.05);
  };
  /** a row of identical windows at the centres `xs` */
  K.windows = (xs, o) => { for (const x of xs) K.window({ ...o, x }); };
  /** centres of n bays of width pitch spread over [x0, x1] */
  K.bays = (x0, x1, pitch) => { const n = Math.max(1, Math.round((x1 - x0) / pitch)), p = (x1 - x0) / n; return Array.from({ length: n }, (_, i) => x0 + p * (i + 0.5)); };
  /** balcony: slab on brackets + iron railing; y = floor level of the balcony door */
  K.balcony = (x0, x1, y, d = 0.85, o = {}) => {
    const slab = o.slabMat || K.mats.trim, rail = K.mats.iron, rh = o.rh ?? 0.95;
    P.box(slab, x0, x1, y - 0.2, y, 0, d, 'k');
    if (o.brackets !== false) for (const bx of [x0 + 0.25, x1 - 0.25, (x0 + x1) / 2]) if (bx === (x0 + x1) / 2 && x1 - x0 < 2.2) continue; else P.box(slab, bx - 0.08, bx + 0.08, y - 0.7, y - 0.2, 0, d * 0.7, 'kb');
    const t = 0.03;
    P.box(rail, x0, x1, y + rh - 0.05, y + rh, d - t * 2, d, 'kb');                         // top rail (front)
    P.box(rail, x0, x0 + t * 2, y, y + rh, 0.05, d, 'k'); P.box(rail, x1 - t * 2, x1, y, y + rh, 0.05, d, 'k');
    P.box(rail, x0 + t, x1 - t, y + 0.12, y + 0.16, d - t, d, 'kb');
    const n = Math.max(2, Math.round((x1 - x0) / 0.2));
    for (let i = 1; i < n; i++) { const bx = x0 + (x1 - x0) * i / n; P.box(rail, bx - 0.012, bx + 0.012, y + 0.16, y + rh - 0.05, d - 0.05, d - 0.03, 'kbtl'); }
  };
  /** flat pilaster strip with a plain base and capital */
  K.pilaster = (mat, x, w, y0, y1, d = 0.12, capH = 0.3) => {
    P.box(mat, x - w / 2, x + w / 2, y0, y1, 0, d, 'kb');
    P.box(mat, x - w / 2 - 0.05, x + w / 2 + 0.05, y1 - capH, y1, 0, d + 0.05, 'kb');
    P.box(mat, x - w / 2 - 0.05, x + w / 2 + 0.05, y0, y0 + capH, 0, d + 0.05, 'kb');
  };
  /** a round arched door / gate: dark wood leaves behind a stucco ring; passable = no door leaf (an open arch) */
  K.gate = (x, y0, w, h, o = {}) => {
    const sw = o.sw ?? 0.3, d = o.d ?? 0.14, hs = Math.max(0.05, h - w / 2), r = w / 2;
    if (o.ring !== false) {
      const s = new THREE.Shape(); archPath(s, x, y0, w + 2 * sw, hs, false); const hole = new THREE.Path(); archPath(hole, x, y0, w, hs, true); s.holes.push(hole);
      P.extrude(o.ringMat || K.mats.trim, s, 0, d, 1, 8);
    }
    if (!o.open) {
      const s = new THREE.Shape(); archPath(s, x, y0, w, hs, false);
      P.face(o.doorMat || K.mats.doorWood, s, 0.12, 1, 8);
      // fanlight glass (upper part) and two leaves
      const r2 = r - 0.12;
      K.glass(K.mats.winBrown, x, y0 + hs - 0.1, w - 0.24, r2 + 0.1, 'arch', 1, 0.14);
      P.box(K.mats.doorDark, x - 0.02, x + 0.02, y0, y0 + hs - 0.1, 0.12, 0.16, 'kb');
    }
  };
  /** shop window: dark frame + lit-at-night glass, round head or flat */
  K.shopWindow = (x, y0, w, h, o = {}) => {
    const head = o.head || 'flat', v = o.v ?? Math.floor(hash(++winSeed, x, y0) * 4) % 4, fw = o.fw ?? 0.12;
    K.glass(K.mats.shop, x, y0, w, h, head, v, o.z ?? 0.06, 4);
    if (head === 'arch') {
      const hs = Math.max(0.05, h - w / 2), s = new THREE.Shape(); archPath(s, x, y0, w + 2 * fw, hs, false); const hole = new THREE.Path(); archPath(hole, x, y0, w, hs, true); s.holes.push(hole);
      P.extrude(o.frameMat || K.mats.trim, s, 0, o.d ?? 0.12, 1, 8);
    } else K.surround(o.frameMat || K.mats.trim, x, y0, w, h, 'flat', fw, o.d ?? 0.12);
  };
  /** shed awning: slanted cloth from the wall at y (top) down to y - drop, projection d, with a valance */
  K.awning = (x0, x1, y, d = 1.5, drop = 0.7, mat = K.mats.awning) => {
    P.quad(mat, [x0, y, 0.05], [x1, y, 0.05], [x1, y - drop, d], [x0, y - drop, d], [0, 0.55, 0.85]);
    P.quad(K.mats.awningValance, [x0, y - drop, d], [x1, y - drop, d], [x1, y - drop - 0.3, d], [x0, y - drop - 0.3, d], [0, 0, 1]);
    P.fan(mat, [[x0, y, 0.05], [x0, y - drop, d], [x0, y - drop - 0.3, d], [x0, y - 0.3, 0.05]], [-1, 0, 0]);
    P.fan(mat, [[x1, y, 0.05], [x1, y - drop, d], [x1, y - drop - 0.3, d], [x1, y - 0.3, 0.05]], [1, 0, 0]);
  };
  /** lettering band (a sign fascia plane with its own texture) */
  K.fascia = (x0, x1, y0, y1, text, o = {}) => {
    const tr = !!o.transparent;
    const mat = T('#ffffff', { map: K.signTex(text, { w: o.w || 512, h: o.h || 96, bg: o.bg, fg: o.fg, font: o.font, weight: o.weight, size: o.size, align: o.align, fill: o.fill }), transparent: tr, alphaTest: tr ? 0.45 : 0, side: tr ? 'double' : 'front', name: 'lmKam-sign' });
    if (tr) K.decalMats.add(mat);
    K.plane(mat, x0, x1, y0, y1, o.z ?? 0.1);
  };
  /** round downpipe against the wall */
  K.downpipe = (x, y0, y1, mat = null, r = 0.075) => { P.cyl(mat || K.mats.shade, [x, y0, 0.1], [x, y1, 0.1], r, r, 8, false); P.box(mat || K.mats.shade, x - 0.04, x + 0.04, y0 + 2.2, y0 + 2.35, 0, 0.18, 'kb'); };
  /** relief cartouche: a small white plaque on the wall (cheap stand-in for stucco ornament) */
  K.plaque = (mat, x, y, w, h, d = 0.06) => { P.box(mat, x - w / 2, x + w / 2, y, y + h, 0, d, 'kb'); };
  /** a classical column (shaft + base + Ionic / Corinthian-like capital with volutes), axis along y at (x, z) */
  K.column = (mat, x, z, y0, y1, r, o = {}) => {
    const capH = o.capH ?? r * 1.6, baseH = r * 0.7;
    P.cyl(mat, [x, y0 + baseH, z], [x, y1 - capH, z], r, r * 0.88, o.seg ?? 14, false);               // entasis shaft
    P.box(mat, x - r * 1.25, x + r * 1.25, y0, y0 + baseH, z - r * 1.25, z + r * 1.25, 'b');          // plinth + base
    P.cyl(mat, [x, y0 + baseH, z], [x, y0 + baseH + r * 0.35, z], r * 1.12, r * 0.96, 14, false);
    // capital: echinus + volute scrolls (two horizontal cylinders) + abacus
    P.cyl(mat, [x, y1 - capH, z], [x, y1 - capH * 0.45, z], r * 0.88, r * 1.15, 14, false);
    if (o.volutes !== false) for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.cyl(mat, [x + sx * r * 1.0, y1 - capH * 0.62, z + sz * r * 0.4 - r * 0.25], [x + sx * r * 1.0, y1 - capH * 0.62, z + sz * r * 0.4 + r * 0.25], r * 0.38, r * 0.38, 8, true);
    P.box(mat, x - r * 1.45, x + r * 1.45, y1 - capH * 0.45, y1, z - r * 1.45, z + r * 1.45, 'b');
  };
  /** stone balustrade (low parapet with balusters) under a tall window: x0..x1 at floor level y, height h, projection d */
  K.balustrade = (x0, x1, y, h = 0.75, d = 0.3, mat = K.mats.trim) => {
    P.box(mat, x0, x1, y, y + 0.14, 0, d, 'k');
    P.box(mat, x0 - 0.04, x1 + 0.04, y + h - 0.12, y + h, 0, d, 'k');
    const n = Math.max(3, Math.round((x1 - x0) / 0.28));
    for (let i = 0; i <= n; i++) { const bx = x0 + 0.08 + (x1 - x0 - 0.16) * i / n; P.box(mat, bx - 0.05, bx + 0.05, y + 0.14, y + h - 0.12, d - 0.16, d - 0.06, 'kbt'); }
  };
  /** iron railing along x at depth z (top rail + posts + low rail), from y, height h */
  K.railRun = (x0, x1, y, z, h = 0.95, mat = K.mats.iron) => {
    P.box(mat, x0, x1, y + h - 0.05, y + h, z - 0.03, z + 0.03, '');
    P.box(mat, x0, x1, y + 0.1, y + 0.14, z - 0.015, z + 0.015, '');
    const n = Math.max(2, Math.round((x1 - x0) / 0.16));
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; P.box(mat, x - 0.012, x + 0.012, y + 0.14, y + h - 0.05, z - 0.012, z + 0.012, 'tb'); }
  };
  /** the same along z (a side return), at x, from z0 to z1 */
  K.railRunZ = (x, y, z0, z1, h = 0.95, mat = K.mats.iron) => {
    P.box(mat, x - 0.03, x + 0.03, y + h - 0.05, y + h, z0, z1, '');
    P.box(mat, x - 0.015, x + 0.015, y + 0.1, y + 0.14, z0, z1, '');
    const n = Math.max(2, Math.round(Math.abs(z1 - z0) / 0.16));
    for (let i = 0; i <= n; i++) { const z = z0 + (z1 - z0) * i / n; P.box(mat, x - 0.012, x + 0.012, y + 0.14, y + h - 0.05, z - 0.012, z + 0.012, 'tb'); }
  };
  /**
   * Gable / hip roof prism along a wall (frame of the edge): eave at (z = 0, y0), ridge at z = -D/2, y0 + R, back eave at z = -D. hipL / hipR = hipped end (else a gable triangle).
   */
  K.gable = (u0, u1, y0, D, R, mat, o = {}) => {
    const hl = o.hipL ? D / 2 : 0, hr = o.hipR ? D / 2 : 0, uL = u0 + hl, uR = u1 - hr, z0 = o.z0 ?? -0.12;
    const yR = y0 + R, zr = z0 - (D / 2 - 0.12), zb = z0 - D + 0.24;
    P.fan(mat, [[u0, y0, z0], [u1, y0, z0], [uR, yR, zr], [uL, yR, zr]], [0, D / 2, R]);
    P.fan(mat, [[u1, y0, zb], [u0, y0, zb], [uL, yR, zr], [uR, yR, zr]], [0, D / 2, -R]);
    P.fan(mat, [[u0, y0, zb], [u0, y0, z0], [uL, yR, zr]], [-1, hl ? R / (D / 2) : 0, hl ? 0 : 0]);
    P.fan(mat, [[u1, y0, z0], [u1, y0, zb], [uR, yR, zr]], [1, hr ? R / (D / 2) : 0, 0]);
    if (o.chimneys) for (const u of o.chimneys) { P.box(K.mats.chimneyYellow, u - 0.4, u + 0.4, y0, yR + 1.2, zr - 0.4, zr + 0.4, 'b'); P.box(K.mats.shade, u - 0.5, u + 0.5, yR + 1.2, yR + 1.35, zr - 0.5, zr + 0.5, 'b'); }
  };
  /**
   * A shop-window storey: windows of width ~pitch between piers, a sign fascia (generic Russian names) over each, doors, optional awnings. o = { y0, y1 (top of the glass), pitch, names: [..], awn: [indices],
   * doors: [indices], head 'flat'|'arch', signH }
   */
  K.shopfront = (u0, u1, o) => {
    const n = Math.max(1, Math.round((u1 - u0) / (o.pitch ?? 4.6))), p = (u1 - u0) / n, y0 = o.y0 ?? 0.9, y1 = o.y1 ?? 4.0, sh = o.signH ?? 0.6;
    for (let i = 0; i < n; i++) {
      const x = u0 + p * (i + 0.5), w = p - (o.pier ?? 0.9);
      if ((o.doors || []).includes(i)) K.gate(x, y0 - 0.9 + 0.9, Math.min(w, 2.0), y1 - y0 + 0.3, { sw: 0.2, ring: true, doorMat: K.mats.doorWood });
      else K.shopWindow(x, y0, w, y1 - y0, { head: o.head || 'flat', fw: 0.14, v: (i + (o.v ?? 0)) % 4, frameMat: o.frameMat });
      if (o.names && o.names[i]) {
        const bg = (o.bgs && o.bgs[i % o.bgs.length]) || '#2b2622', fg = (o.fgs && o.fgs[i % o.fgs.length]) || '#f0e6cf';
        K.fascia(x - w / 2, x + w / 2, y1 + 0.18, y1 + 0.18 + sh, o.names[i], { w: 512, h: 96, bg, fg, font: i % 2 ? K.ctx.tex.FONTS.serif : K.ctx.tex.FONTS.round, z: 0.07 });
      }
      if ((o.awn || []).includes(i)) K.awning(x - w / 2 - 0.1, x + w / 2 + 0.1, y1 + 0.1, 1.7, 0.7);
    }
  };
  /** roof railing (black iron): posts every ~1 m, top and bottom rails, along a polyline of world points [[x,z]..] (call in the world frame) at height y */
  K.railing = (pts, y, h = 0.9, closed = false) => {
    const r = K.mats.iron, n = pts.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = pts[i], b = pts[(i + 1) % n], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.2) continue;
      P.cyl(r, [a[0], y + h, a[1]], [b[0], y + h, b[1]], 0.025, 0.025, 4, false);
      P.cyl(r, [a[0], y + 0.12, a[1]], [b[0], y + 0.12, b[1]], 0.02, 0.02, 4, false);
      const k = Math.max(1, Math.round(len / 1.0));
      for (let j = 0; j <= k; j++) { const t = j / k, px = a[0] + (b[0] - a[0]) * t, pz = a[1] + (b[1] - a[1]) * t; P.cyl(r, [px, y, pz], [px, y + h, pz], 0.022, 0.022, 4, false); }
    }
  };
  let relMats = null;
  Object.defineProperty(K, 'R', { get: () => (relMats ||= makeReliefs(K)) });
  return K;
}
export { rectPath, archPath, DEG };
