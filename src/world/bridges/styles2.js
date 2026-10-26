// bridges/styles2.js - what makes the bridges of the Mars Field / Summer Garden reach recognisable, drawn on top of the generic arch of arch.js (B = makeArch(...); everything in the site frame u / y / v):
//   swan-upper  grey-pink humpback stone arch, SOLID granite parapet 0.8 m thick joined to the quay parapet, no railing, no lamps (photo refs/mars-bridges 05)
//   swan-lower  low pink-red arch, dark green `wheel` railing, pink granite end blocks with cushion tops (photos 12 13)
//   arch3       the Laundry Bridge: three unequal arches (arch.js site.spans), solid rolled parapet, two oval lucarnes over the piers, round upstream / pointed downstream cutwaters (photos 28 33)
//   pantel      Panteleymonovsky: green girder with a pale olive gilded band, 13 gilded Gorgon masks per face, `lancesT` railing, four spear-bundle standards with shield, wreath and the gilded eagle (photos 37 42 43)
//   eng1        1st Engineer (bridges/eng1.js): dark cast-iron arch with a medallion row + baluster edge between granite abutments, black bar railing with trophy posts, granite end-posts with black lamp standards, board "2.6"
//   garden1     1st Sadovy: green arch with 11 gilded plates per face, `discs` railing, spear standards on pink blocks, two tram tracks, tripod pole "Садовый мост 1" (photos 53 55)
//   garden2     2nd Sadovy: flat sage girder, `lances2` railing (S-scroll frieze, Greek key base), spear standards (photos 56 60)
//   konyush     Bolshoy Konyushenny: dark green iron arch, `lancesW` railing with a gilded cap, four leaf-base standards, kerb bollards (photos 64 66)
//   aegis       the Triple Bridge (Teatralny + Malo-Konyushenny): near-black green fascia with gilt leaves, `aegis` railing with a gilt bead handrail, globe standards, sett deck (photos 70 72 73)
// Same pieces as styles.js (pylon, tripod, parapet) so that the new bridges read as the same family as Green / Pevchesky / Red.  The double-headed eagle is a state emblem, not a flag (user decision 2026-10-06).
import * as THREE from 'three';
import { pylon, tripod } from './sculpt.js';
import { SITES, inDeck } from './sites.js';
import { torchere, lampLeaf, lampGlobe, eagle } from './sculpt2.js';
import { obeliskLamp } from './sculpt3.js';
import { eng1 } from './eng1.js';

const frame = (B, P, fn) => { P.push(B.f.cx, 0, B.f.cz, -B.T); try { fn(); } finally { P.pop(); } };
const tint = (ctx, hex) => ctx.mat.toon(hex, { paint: 0.03, name: 'brg-t-' + hex });
const GOLD = '#d8aa30';
function board(P, mat, B, sg, u, y, w, h) {
  const v = (sg < 0 ? B.site.v0 : B.site.v1) + sg * 0.06;
  P.quad(mat, [u - sg * w / 2, y, v], [u + sg * w / 2, y, v], [u + sg * w / 2, y + h, v], [u - sg * w / 2, y + h, v], [0, 0, sg], [[0, 0], [1, 0], [1, 1], [0, 1]]);
}
/** n gilded discs (masks / plates) along the fascia band of face sg between u a..b, standing 4.5 cm proud; flat caps so they read as relief medallions */
function plates(e, B, sg, a, b, n, r, ry = r) {
  const { P, M } = e, v = (sg < 0 ? B.site.v0 : B.site.v1);
  for (let i = 0; i < n; i++) {
    const u = a + (b - a) * (i + 0.5) / n, y = B.yDeck(u) - 0.4;
    P.geo(M.gold, new THREE.SphereGeometry(1, 8, 5), u, y, v + sg * 0.05, 0, 0, 0, r, ry, 0.03);
  }
}
/** the 4 corner blocks (pink granite) of a bridge with a lamp standard on each; fn(u, top, v, sg, ts) puts the standard */
export function cornerBlocks(e, B, w, d, hgt, fn, skip) {
  const { P, M } = e;
  for (const sg of [-1, 1]) {
    const fi = B.faceInfo(sg), a = fi.a, b = fi.b, v0 = sg < 0 ? fi.v : fi.v - d, v1 = sg < 0 ? fi.v + d : fi.v;
    for (const [u0, u1, ts] of [[a - w, a, -1], [b, b + w, 1]]) {
      if (skip && skip((u0 + u1) / 2, (v0 + v1) / 2)) continue;
      const y0 = B.yDeck((u0 + u1) / 2) - 0.1;
      pylon(P, M.pylon, M.coping, u0, u1, y0, y0 + hgt, v0, v1, { cap: 0.08 });
      if (fn) fn((u0 + u1) / 2, y0 + hgt, (v0 + v1) / 2, sg, ts, y0, [u0, u1, v0, v1]);
    }
  }
}
const parapets = (e, B, sg, a, b, ext, h, th, mat) => {
  B.parapet(sg, a - ext, a - 0.05, h, th, mat); B.parapet(sg, b + 0.05, b + ext, h, th, mat);
};

const swanUpper = (e, B) => {
  const { P, M } = e;
  frame(B, P, () => {
    for (const sg of [-1, 1]) {
      const fi = B.faceInfo(sg), th = 0.82, uA = fi.uA - 3.2, uB = fi.uB + 3.2;
      B.parapet(sg, uA, uB, 1.1, th, M.parapet); B.faceCollider(sg, uA - 1.0, uB + 1.0, th / 2, 0.9);
      // square low end pylons (0.9 x thickness x 1.25 m, flat cap) where the parapet meets the quay parapet
      const v0 = Math.min(fi.v, fi.v - sg * th) - 0.04, v1 = Math.max(fi.v, fi.v - sg * th) + 0.04;
      for (const [u0, u1] of [[uA - 0.9, uA], [uB, uB + 0.9]]) { const y0 = B.yDeck((u0 + u1) / 2) - 0.05; pylon(P, M.pylon, M.coping, u0, u1, y0, y0 + 1.25, v0, v1, { cap: 0.04 }); }
    }
  });
};

const swanLower = (e, B) => {
  const { P, M, ctx } = e, post = tint(ctx, '#2b4437');
  frame(B, P, () => {
    for (const sg of [-1, 1]) {
      const fi = B.faceInfo(sg), a = fi.a, b = fi.b, w = 1.3, d = 0.8, v0 = sg < 0 ? fi.v : fi.v - d, v1 = sg < 0 ? fi.v + d : fi.v;
      B.railLine(sg, a, b, 'wheel', '#2f4a3c', { postMat: post, postW: 0.2, gold: null });
      for (const [u0, u1] of [[a - w, a], [b, b + w]]) {
        const y0 = B.yDeck((u0 + u1) / 2) - 0.1;
        pylon(P, M.pylon, M.coping, u0, u1, y0, y0 + 1.1, v0, v1, { cap: 0.04 });
      }
      for (const [u0, u1] of [[a - w - 3, a - w], [b + w, b + w + 3]]) B.parapet(sg, u0, u1, 1.0, 0.5, M.parapetPink);
      B.faceCollider(sg, a - w - 3.2, b + w + 3.2, 0.25, 0.6);
    }
  });
};

const arch3 = (e, B) => {
  const { P, M, ctx } = e, site = B.site, wl = B.waterY, skewed = !!site.skewed, mat = skewed ? M.graniteObukh : M.graniteLaundry;
  const izm = site.id === 'izmailovsky', post = tint(ctx, '#2b4437');
  frame(B, P, () => {
    for (const sg of [-1, 1]) {
      const fi = B.faceInfo(sg), uA = fi.uA - 3, uB = fi.uB + 3;
      if (izm) {
        B.railLine(sg, fi.a, fi.b, 'lattice-star', '#2f4a3c', { postMat: post, postW: 0.2 });
        for (const [u0, u1] of [[fi.a - 3.4, fi.a - 0.05], [fi.b + 0.05, fi.b + 3.4]]) B.parapet(sg, u0, u1, 1.0, 0.5, M.parapetPink);
        B.faceCollider(sg, fi.a - 3.6, fi.b + 3.6, 0.25, 0.6);
      } else {
        B.parapet(sg, uA, uB, skewed ? 1.0 : 0.95, skewed ? 0.8 : 0.5, skewed ? M.parapet : M.parapetPink); B.faceCollider(sg, uA - 0.2, uB + 0.2, skewed ? 0.4 : 0.25, 0.6);
        for (const u of [uA, uB]) P.box(M.coping, u - 0.4, u + 0.4, B.yDeck(u) + 0.7, B.yDeck(u) + 0.95, Math.min(fi.v - sg * 0.55, fi.v + sg * 0.03), Math.max(fi.v - sg * 0.55, fi.v + sg * 0.03), 'b', 1.2);
      }
    }
    // piers: lucarnes in the spandrels (Laundry only), cutwaters (rounded upstream, pointed downstream / triangular on the skewed Fontanka bridges): the pier axis follows the bank lines
    const op = (v) => { const bk = B.bank(v); return B.openings(bk[0], bk[1]); };
    const yb = wl - 0.6, hw = site.pier / 2, ops0 = op(site.v0), ops1 = op(site.v1);
    for (let i = 0; i + 1 < ops0.length; i++) {
      const pc = (v, o) => (o[i][1] + o[i + 1][0]) / 2, p0 = pc(site.v0, ops0), p1 = pc(site.v1, ops1), slope = (p1 - p0) / (site.v1 - site.v0);
      const pAt = (v) => p0 + slope * (v - site.v0), top = B.springY + 0.9;
      if (!skewed) {
        const pu = (p0 + p1) / 2, ySpr = B.springY + 0.35;
        for (const sg of [-1, 1]) {
          const v = sg < 0 ? site.v0 : site.v1, yc = (ySpr + B.yDeck(pu)) / 2 - 0.05, n = 14, ring = [], hole = [];
          for (let k = 0; k < n; k++) { const t = k / n * Math.PI * 2; ring.push([pu + Math.cos(t) * 0.7, yc + Math.sin(t) * 0.46, v + sg * 0.045]); hole.push([pu + Math.cos(t) * 0.58, yc + Math.sin(t) * 0.36, v + sg * 0.06]); }
          P.fan(M.black, hole, [0, 0, sg]);
          for (let k = 0; k < n; k++) P.cyl(M.coping, ring[k], ring[(k + 1) % n], 0.06, 0.06, 5, false);
        }
      }
      P.col(mat, p0, site.v0, yb, top, hw, hw, 12, true);
      const vt = site.v1 + (skewed ? 3.2 : 2.1), yTip = wl + 0.25, tipU = pAt(site.v1) + slope * (vt - site.v1);
      for (const s of [-1, 1]) P.quad(mat, [pAt(site.v1) + s * hw, yb, site.v1], [tipU, yb, vt], [tipU, yTip, vt], [pAt(site.v1) + s * hw, top, site.v1], [s * 0.9, 0, 0.5], [[0, 0], [2, 0], [2, 1], [0, 1]]);
      P.fan(M.coping, [[pAt(site.v1) - hw, top, site.v1], [pAt(site.v1) + hw, top, site.v1], [tipU, yTip, vt]], [0, 1, 0.3]);
      if (skewed) { const tu = pAt(site.v0) + slope * (-3.2); for (const s of [-1, 1]) P.quad(mat, [pAt(site.v0) + s * hw, yb, site.v0], [tu, yb, site.v0 - 3.2], [tu, yTip, site.v0 - 3.2], [pAt(site.v0) + s * hw, top, site.v0], [s * 0.9, 0, -0.5], [[0, 0], [2, 0], [2, 1], [0, 1]]); P.fan(M.coping, [[pAt(site.v0) - hw, top, site.v0], [pAt(site.v0) + hw, top, site.v0], [tu, yTip, site.v0 - 3.2]], [0, 1, -0.3]); }
    }
    if (site.posts) for (const sg of [-1, 1]) {      // the Prachechny Bridge (bridges/sites-pal.js): four granite corner posts (0.95 m square, 1.4 m, capped) at the heads, over the outer ends of the two parapets
      const fi = B.faceInfo(sg), vA = fi.v - sg * 0.85, vB = fi.v + sg * 0.1;
      for (const u of [fi.uA - 3.45, fi.uB + 3.45]) { const y0 = B.yDeck(u) - 0.1; pylon(P, M.pylon, M.coping, u - 0.475, u + 0.475, y0, y0 + 1.45, Math.min(vA, vB), Math.max(vA, vB), { cap: 0.06 }); }
    }
    if (skewed && !izm) cornerBlocks(e, B, 0.7, 0.7, 0.9, (u, topY, v, sg) => obeliskLamp(P, M, u, topY - 0.0, v, Math.PI / 2, { h: 3.4, plinthH: 0.4 }));
    if (izm) cornerBlocks(e, B, 0.8, 0.8, 1.0, (u, topY, v, sg) => lampLeaf(P, M, u, topY, v, 0));
  });
};

const pantel = (e, B) => {
  const { P, M, ctx } = e, post = tint(ctx, '#2f4a3c');
  frame(B, P, () => {
    for (const sg of [-1, 1]) {
      const fi = B.faceInfo(sg), a = fi.a, b = fi.b;
      B.railLine(sg, a, b, 'lancesT', '#35523f', { postMat: post, postW: 0.22, gold: { kind: 'lancesTG', hex: GOLD } });
      plates(e, B, sg, a, b, 13, 0.15, 0.2);
      B.faceCollider(sg, a - 1.5, b + 1.5, 0.25, 0.6);
    }
    cornerBlocks(e, B, 1.3, 1.3, 1.5, (u, top, v, sg, ts, y0, box) => {
      torchere(P, M, u, top, v, Math.PI / 2, { h: 2.6, shield: true, wreath: true, eagle: true, arm: sg, face: 0 });
      if (ts < 0 && sg < 0) tripod(P, M, box[0] - 0.9, y0 + 0.1, box[2] + 0.6, B.site.pole);
    });
  });
};

/** two tram tracks (flush rails, gauge 1.52 m) along u at the given v values */
export function tramTracks(e, B, vs) {
  const { P, M } = e, a = B.uMin, b = B.uMax;
  for (const vc of vs) for (const dv of [-0.76, 0.76]) {
    const n = Math.max(2, Math.ceil((b - a) / 2.5));
    for (let i = 0; i < n; i++) {
      const u0 = a + (b - a) * i / n, u1 = a + (b - a) * (i + 1) / n, y0 = B.yDeck(u0) + 0.035, y1 = B.yDeck(u1) + 0.035;
      P.quad(M.tramRail, [u0, y0, vc + dv - 0.035], [u1, y1, vc + dv - 0.035], [u1, y1, vc + dv + 0.035], [u0, y0, vc + dv + 0.035], [0, 1, 0]);
    }
  }
}

const garden1 = (e, B) => {
  const { P, M, ctx } = e, post = tint(ctx, '#3f6a4a');
  frame(B, P, () => {
    for (const sg of [-1, 1]) {
      const fi = B.faceInfo(sg), a = fi.a, b = fi.b;
      B.railLine(sg, a, b, 'discs', '#5a8a62', { postMat: post, postW: 0.22, gold: { kind: 'discsG', hex: GOLD } });
      plates(e, B, sg, a, b, 11, 0.2, 0.15);
      for (const [u0, u1] of [[a - 1.3 - 4, a - 1.3], [b + 1.3, b + 1.3 + 4]]) B.parapet(sg, u0, u1, 1.05, 0.5, M.parapetPink);
      board(P, M.clear(B.site.clear), B, sg, B.uc, B.crownY + 0.55, 0.45, 0.45);
      B.faceCollider(sg, a - 5.5, b + 5.5, 0.25, 0.6);
    }
    cornerBlocks(e, B, 1.3, 1.3, 1.4, (u, top, v, sg, ts, y0, box) => {
      torchere(P, M, u, top, v, Math.PI / 2, { h: 2.4, shield: true, wreath: true, arm: sg });
      if (ts < 0 && sg < 0) tripod(P, M, box[0] - 0.9, y0 + 0.1, box[2] + 0.6, B.site.pole);
    });
    tramTracks(e, B, B.site.trams);
  });
};

const garden2 = (e, B) => {
  const { P, M, ctx } = e, post = tint(ctx, '#6f8b7c');
  frame(B, P, () => {
    for (const sg of [-1, 1]) {
      const fi = B.faceInfo(sg), a = fi.a, b = fi.b;
      B.railLine(sg, a, b, 'lances2', '#8da898', { postMat: post, postW: 0.22, gold: { kind: 'lances2G', hex: GOLD } });
      for (const [u0, u1] of [[a - 1.2 - 4, a - 1.2], [b + 1.2, b + 1.2 + 4]]) B.parapet(sg, u0, u1, 1.05, 0.5, M.parapetPink);
      B.faceCollider(sg, a - 5.4, b + 5.4, 0.25, 0.6);
    }
    cornerBlocks(e, B, 1.2, 1.2, 1.3, (u, top, v, sg) => torchere(P, M, u, top, v, Math.PI / 2, { h: 2.4, shield: true, wreath: true, arm: sg }));
  });
};

const konyush = (e, B) => {
  const { P, M, ctx } = e, post = tint(ctx, '#2b4437');
  frame(B, P, () => {
    for (const sg of [-1, 1]) {
      const fi = B.faceInfo(sg), a = fi.a, b = fi.b;
      B.railLine(sg, a, b, 'lancesW', '#2f4a3a', { postMat: post, postW: 0.2, capMat: M.gold, gold: { kind: 'lancesWG', hex: GOLD } });
      plates(e, B, sg, a, b, Math.round((b - a) / 1.6), 0.11, 0.11);
      for (const [u0, u1] of [[a - 1.0 - 4.5, a - 1.0], [b + 1.0, b + 1.0 + 4.5]]) B.parapet(sg, u0, u1, 1.05, 0.5, M.parapetPink);
      B.faceCollider(sg, a - 5.6, b + 5.6, 0.25, 0.6);
    }
    cornerBlocks(e, B, 1.0, 1.0, 0.9, (u, top, v) => lampLeaf(P, M, u, top, v, 0));
    // iron bollards between the pavements and the roadway, joined by a steel bar (every 2.4 m, 0.8 m high)
    const [a0, b0] = B.bank(0);
    for (const vk of [-4.1, 4.1]) {
      const [a, b] = B.bank(vk), n = Math.max(2, Math.round((b - a) / 2.4));
      for (let i = 0; i <= n; i++) { const u = a + (b - a) * i / n; P.cyl(M.ironGreenDark, [u, B.yDeck(u) + 0.12, vk], [u, B.yDeck(u) + 0.8, vk], 0.07, 0.055, 6, true); }
      for (let i = 0; i < n; i++) { const u0 = a + (b - a) * i / n, u1 = a + (b - a) * (i + 1) / n; P.cyl(M.steel, [u0, B.yDeck(u0) + 0.62, vk], [u1, B.yDeck(u1) + 0.62, vk], 0.018, 0.018, 4, false); }
    }
    void a0; void b0;
  });
};

const aegis = (e, B) => {
  const { P, M } = e, site = B.site;
  // the Triple Bridge: the two decks meet at one corner, so railings / pylons / colliders of one bridge stop where the other bridge's deck lies (the walkway must stay open)
  const other = SITES.find((q) => q.style === 'aegis' && q.id !== site.id);
  const covered = (u, v) => { if (!other) return false; const w = B.world(u, v); return inDeck(other, w.x, w.z, 30, 0.5); };
  /** free [u0, u1] ranges of the line at v between ua and ub (step 0.25 m), ranges shorter than minLen dropped */
  const freeRanges = (ua, ub, v, minLen) => {
    const out = []; let s0 = null;
    for (let u = ua; u <= ub + 1e-6; u += 0.25) { const c = covered(u, v); if (!c && s0 === null) s0 = u; if ((c || u + 0.25 > ub + 1e-6) && s0 !== null) { const u1 = c ? u - 0.25 : ub; if (u1 - s0 >= minLen) out.push([s0, u1]); s0 = null; } }
    return out;
  };
  frame(B, P, () => {
    for (const sg of [-1, 1]) {
      const fi = B.faceInfo(sg), a = fi.a, b = fi.b;
      for (const [u0, u1] of freeRanges(a, b, fi.v - sg * 0.18, 1.0)) B.railLine(sg, u0, u1, 'aegis', '#2c3f33', { postMat: M.ironGreenDark, postW: 0.14, capMat: M.gold, gold: { kind: 'aegisG', hex: GOLD } });
      plates(e, B, sg, a, b, Math.round((b - a) / 1.7), 0.12, 0.12);
      for (const [u0, u1] of freeRanges(a - 1.2, b + 1.2, fi.v - sg * 0.25, 0.5)) B.faceCollider(sg, u0, u1, 0.25, 0.6);
    }
    cornerBlocks(e, B, 1.2, 1.2, 1.2, (u, top, v, sg, ts, y0, box) => {
      lampGlobe(P, M, u, top, v, 0);
      if (ts < 0 && sg < 0) tripod(P, M, box[0] - 0.9, y0 + 0.1, box[2] + 0.6, site.pole);
    }, covered);
  });
};

export const STYLES2 = { 'swan-upper': swanUpper, 'swan-lower': swanLower, arch3, pantel, eng1, garden1, garden2, konyush, aegis };
void eagle;
