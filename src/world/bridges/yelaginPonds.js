// bridges/yelaginPonds.js - the 11 footbridges and the 5 sluices of the ponds of the Yelagin park (group `bridges-yelagin-ponds`).  Dossier: docs/research/yelagin-ponds-bridges.md (OSM ways + deck rings,
// ru / en Wikipedia, 30+ Commons photos "Мост на Елагином острове между N и M прудами. 2023", "Гидротехническое водопропускное сооружение ..."), data + coordinates: yelaginPonds/specs.js.
// What the OSM data hold: every bridge is a 2.4 m `highway=footway` way plus (for 8 of them) a man_made=bridge ring; the water of the ponds is a cut of the ground (bed -1.4 m, POND_Y -0.35, a green rim
// that slopes 1.1 m inward from the outline, a 0.4 m collider box along the outline).  Nothing drew a deck: the environment laid an invisible walk box over the water (quay.js fallback), and the pond
// outline colliders stood across both ends of the deck.  This module claims the ways + rings (bridges/groups.js row `yelagin-ponds`), draws the real bridges and:
//   * measures the bank lines of the channel under every deck from the layout (heightAt < -0.8) and puts the abutment faces 1.15 m inside them (over the rim slope);
//   * opens the outline colliders of the pond where they cross a deck (the leftover pieces beside the deck are put back);
//   * lays walk ramps / stairs for the deck, side colliders along the railings, bollards at the mouths of the narrow ones (a car passes only the 8 m wide road-width decks).
// Types: T timber trestle (pipe-pile bents, plank deck, steel X-lattice), A arched strut bridge (steel arch ribs + posts + diagonals, granite landings with 5 steps), G granite abutments + pale haunched
// girder + cast-iron ring-and-diamond railing between granite posts, C plank culvert; sluices: granite headwall block, gate frame(s) with winch columns and hand wheels, X railing, granite end posts.
// NO flags / flagpoles / lamps on the carriageway (the lamp poles of the paths are the streets' business).  One Parts per spatial cell (clusters of <= 150 m): the meshes cull as one.
import * as THREE from 'three';
import { Parts } from './kit.js';
import { PONDS, SLUICES } from './yelaginPonds/specs.js';
import { pondMats, RAIL } from './yelaginPonds/mats.js';

export { PONDS, SLUICES };
const RIM = 1.15, BED = -0.5;                                                  // the foot of everything under the water line: the pond water is at -0.35 (no geometry below it: its toon outline would show through)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** frame of a bridge record: centre (the middle of the OSM way + the ring shift), T (rad) = direction of +u */
export function frameOfPond(sp) {
  const T = Math.atan2(sp.b[1] - sp.a[1], sp.b[0] - sp.a[0]), c = Math.cos(T), s = Math.sin(T), du = sp.ring ? sp.ring[2] : 0, dv = sp.ring ? sp.ring[3] : 0;
  const mx = (sp.a[0] + sp.b[0]) / 2, mz = (sp.a[1] + sp.b[1]) / 2;
  return { T, c, s, cx: mx + du * c - dv * s, cz: mz + du * s + dv * c, len: Math.hypot(sp.b[0] - sp.a[0], sp.b[1] - sp.a[1]) };
}
const W = (f, u, v) => ({ x: f.cx + u * f.c - v * f.s, z: f.cz + u * f.s + v * f.c });
const UV = (f, x, z) => ({ u: (x - f.cx) * f.c + (z - f.cz) * f.s, v: -(x - f.cx) * f.s + (z - f.cz) * f.c });

/** the pond-outline collider boxes that cross the deck rectangle |u| <= HL, |v| <= hw: cut out the part inside the strip and put the rest back (so the bank stays closed beside the deck) */
function openRimBoxes(ph, f, HL, hw, add) {
  const R = HL + hw + 12, strip = hw + 0.35; let n = 0;
  for (const it of Array.from(ph._query(f.cx, f.cz, R))) {
    if (it.type !== 'box' || it.y0 !== -2 || it.y1 !== 1.25 || Math.abs(it.hd * 2 - 0.4) > 0.02) continue;
    const ax = it.c, az = -it.s, p0 = UV(f, it.cx - ax * it.hw, it.cz - az * it.hw), p1 = UV(f, it.cx + ax * it.hw, it.cz + az * it.hw);
    // clip the segment p0 - p1 (u, v) against the strip |v| <= strip; it must cross the deck within |u| <= HL + 0.4
    const dv = p1.v - p0.v, du = p1.u - p0.u; let t0 = 0, t1 = 1;
    if (Math.abs(dv) < 1e-6) { if (Math.abs(p0.v) > strip) continue; } else { const ta = (-strip - p0.v) / dv, tb = (strip - p0.v) / dv; t0 = Math.max(0, Math.min(ta, tb)); t1 = Math.min(1, Math.max(ta, tb)); if (t1 <= t0) continue; }
    const um = p0.u + du * (t0 + t1) / 2; if (Math.abs(um) > HL + 0.4) continue;
    if(it.source?.knock)continue; ph.remove(it); n++;
    const seg = (ta, tb) => { if ((tb - ta) * Math.hypot(du, dv) < 0.4) return; const a = W(f, p0.u + du * ta, p0.v + dv * ta), b = W(f, p0.u + du * tb, p0.v + dv * tb), l = Math.hypot(b.x - a.x, b.z - a.z); add((a.x + b.x) / 2, (a.z + b.z) / 2, l + 0.1, 0.4, Math.atan2(-(b.z - a.z), b.x - a.x)); };
    seg(0, t0); seg(t1, 1);
  }
  return n;
}

export function buildYelaginPonds(env) {
  const { ctx, M, flush } = env, L = ctx.L, ph = ctx.physics, Y = pondMats(ctx, M), TM = ctx.mat.toon;
  const t0 = Date.now(), out = { list: [], colliders: 0, cells: 0, info: {} };
  const sites = [];

  // ================================================================================================ the bridges
  const makeBridge = (sp) => {
    const f = frameOfPond(sp), w = (u, v) => W(f, u, v), hw = sp.hw, type = sp.type;
    const HL = Math.max(f.len, sp.ring ? sp.ring[0] : 0) / 2;
    const wet = (u, v) => { const q = w(u, v); return L.heightAt(q.x, q.z) < -0.8; };
    let bk0 = null, bk1 = null;
    for (const v of [0, hw * 0.5, -hw * 0.5]) for (let u = -HL - 8; u <= HL + 8; u += 0.2) if (wet(u, v)) { if (bk0 === null || u < bk0) bk0 = u; if (bk1 === null || u > bk1) bk1 = u; }
    let dry = false;
    if (bk0 === null || bk1 - bk0 < 1.2) { dry = true; [bk0, bk1] = sp.bank || [-3, 3]; }
    bk0 = clamp(bk0, -HL + 0.9, HL - 0.9); bk1 = clamp(bk1, -HL + 0.9, HL - 0.9);
    const rimE = clamp((bk1 - bk0 - 1.5) / 2, 0, RIM);                                                        // how far the abutment faces stand inside the bank lines (over the rim slope)
    const fa0 = bk0 + rimE, fa1 = bk1 - rimE, mid = (fa0 + fa1) / 2, half = Math.max(0.5, (fa1 - fa0) / 2);
    const stairL = type === 'A' ? clamp(HL - bk1 - 0.5, 1.0, 1.7) : 0;
    const e = type === 'A' ? sp.landing : type === 'G' ? 0.22 : type === 'C' ? 0.1 : 0.15;                  // deck height at the abutments
    const yDeck = (u0) => {
      const u = clamp(u0, -HL, HL);
      if (type === 'A' && Math.abs(u) > HL - stairL) return e * (HL - Math.abs(u)) / stairL;               // the steps (the rails follow them)
      if (u >= bk0 && u <= bk1) { const t = clamp((u - mid) / half, -1, 1); return e + sp.crown * (1 - t * t); }
      if (type === 'A') return e;
      const d = u < bk0 ? bk0 - u : u - bk1, room = Math.max(0.5, u < bk0 ? HL + bk0 : HL - bk1);
      return Math.max(0.02, e - (e - 0.02) * clamp(d / room, 0, 1));
    };
    const depth = (u) => (type === 'G' ? (u >= bk0 && u <= bk1 ? 0.78 - 0.38 * (1 - Math.pow((u - mid) / Math.max(0.5, half), 2)) : 0.8) : type === 'A' ? 0.42 : type === 'C' ? 0.3 : 0.38);
    const B = { id: sp.id, name: sp.name, nameEn: sp.nameEn, x: f.cx, z: f.cz, at: [f.cx, f.cz], info: { type, hw, len: +(2 * HL).toFixed(1), banks: [+bk0.toFixed(1), +bk1.toFixed(1)], dry, rails: 0, colliders: 0, tris: 0 }, masts: [], yDeck };
    B.crossing={ax:f.c,az:f.s,w:2*hw,len:2*HL};
    B.bounds = (() => { let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const [u, v] of [[-HL, -hw], [HL, -hw], [HL, hw], [-HL, hw]]) { const q = w(u, v); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z); } return [x0 - 2, z0 - 2, x1 + 2, z1 + 2]; })();
    B.deckAt = (x, z) => { const q = UV(f, x, z); return Math.abs(q.v) <= hw - 0.1 && Math.abs(q.u) <= HL + 0.2 ? yDeck(q.u) : null; };
    B.draw = (P) => {
      P.push(f.cx, 0, f.cz, -f.T);
      const deckMat = sp.deck === 'wood' ? Y.deckWood : M.asphalt;
      const bodyMat = type === 'G' ? Y.girder : type === 'A' ? Y.archSteel : Y.timber;
      const hd = hw - 0.12; Y.post = Y.post || TM('#d0d6d9', { paint: 0.03, name: 'brg-yp-post' });
      // ---- nodes along u (deck strips): every <= 1.4 m, and the key stations
      const nodes = [];
      { const keys = [-HL, bk0, fa0, mid, fa1, bk1, HL]; if (type === 'A') keys.push(-HL + stairL, HL - stairL); const ks = [...new Set(keys.map((k) => +k.toFixed(3)))].sort((a, b) => a - b);
        for (let i = 0; i + 1 < ks.length; i++) { const n = Math.max(1, Math.ceil((ks[i + 1] - ks[i]) / 1.4)); for (let k = 0; k < n; k++) nodes.push(ks[i] + (ks[i + 1] - ks[i]) * k / n); } nodes.push(HL); }
      const uStart = type === 'A' ? -HL + stairL : -HL, uEnd = type === 'A' ? HL - stairL : HL;
      const live = nodes.filter((u) => u >= uStart - 1e-6 && u <= uEnd + 1e-6);
      for (let i = 0; i + 1 < live.length; i++) {
        const u0 = live[i], u1 = live[i + 1], y0 = yDeck(u0), y1 = yDeck(u1), d0 = depth(u0), d1 = depth(u1);
        P.quad(deckMat, [u0, y0, -hd], [u1, y1, -hd], [u1, y1, hd], [u0, y0, hd], [0, 1, 0], [[u0, -hd / 1.5], [u1, -hd / 1.5], [u1, hd / 1.5], [u0, hd / 1.5]]);
        const under = (u) => (u > fa0 + 0.01 && u < fa1 - 0.01);
        for (const sg of [-1, 1]) {
          const v = sg * hw;
          P.quad(bodyMat, [u0, y0 - d0, v], [u1, y1 - d1, v], [u1, y1, v], [u0, y0, v], [0, 0, sg], [[u0, -d0], [u1, -d1], [u1, 0], [u0, 0]]);
          P.quad(deckMat, [u0, y0, v - sg * 0.12], [u1, y1, v - sg * 0.12], [u1, y1, v], [u0, y0, v], [0, 1, 0]);
        }
        if (under((u0 + u1) / 2)) P.quad(bodyMat, [u0, y0 - d0, -hw], [u0, y0 - d0, hw], [u1, y1 - d1, hw], [u1, y1 - d1, -hw], [0, -1, 0]);
      }
      // ---- abutments: blocks over the bank lines (granite for A / G, concrete wedges for T / C), faces 1.15 m inside the bank (over the rim slope)
      const aMat = type === 'G' || type === 'A' ? M.granite : Y.concrete;
      for (const [fa, dir] of [[fa0, 1], [fa1, -1]]) {
        const yTop = yDeck(fa) - depth(fa) + 0.02, ub = type === 'A' ? -dir * (HL - stairL) : fa - dir * (rimE + 1.4), yb = BED;
        if (type === 'C') continue;
        P.box(aMat, Math.min(fa, ub), Math.max(fa, ub), yb, Math.max(yTop, 0.02), -hw, hw, dir > 0 ? 'lb' : 'rb', 2.4);
        // wing: the granite cheek continues along the bank line 1.6 m past the deck on both sides, sloping down to the ground
        if (type === 'G' || type === 'A') for (const sg of [-1, 1]) {
          const v0 = sg * hw, v1 = sg * (hw + 1.8), uA = Math.min(fa, fa - dir * 0.4), uB = Math.max(fa, fa - dir * 0.4);          // a 0.4 m thick wall (land side behind the face), seen from the water as a coping block, not as a flat flag
          P.box(M.granite, uA, uB, yb, 0.14, Math.min(v0, v1), Math.max(v0, v1), dir > 0 ? 'lb' : 'rb', 2.4);
        }
      }
      // ---- T: pipe-pile bents and cap beams across the opening
      if (type === 'T') {
        const n = Math.max(1, Math.round((fa1 - fa0) / 3.4));
        for (let k = 1; k < n; k++) {
          const u = fa0 + (fa1 - fa0) * k / n, top = yDeck(u) - depth(u) - 0.02;
          for (const v of (hw < 1.4 ? [-hw * 0.6, hw * 0.6] : [-hw * 0.72, 0, hw * 0.72])) P.cyl(Y.pile, [u, BED, v], [u, top - 0.22, v], 0.13, 0.13, 7, true);
          P.box(Y.timber, u - 0.17, u + 0.17, top - 0.22, top - 0.02, -hw + 0.1, hw - 0.1, '', 1);
        }
        for (const [uu, dir] of [[fa0, 1], [fa1, -1]]) for (const v of [-hw * 0.72, hw * 0.72]) P.cyl(Y.timber, [uu + dir * 0.35, yDeck(uu) - depth(uu) - 0.02, v], [uu + dir * 1.45, yDeck(uu) - depth(uu) - 0.02 - 0.0, v], 0.07, 0.07, 5, false);
      }
      // ---- A: two steel arch ribs under the deck (convex up), posts and diagonals, cross beams
      if (type === 'A') {
        const ySp = -0.3, yCr = yDeck(mid) - depth(mid) - 0.12, N = 12;
        const rib = (u) => { const t = clamp((u - mid) / half, -1, 1); return ySp + (yCr - ySp) * (1 - t * t); };
        for (const sg of [-1, 1]) {
          const v = sg * (hw - 0.4); let prev = null;
          for (let k = 0; k <= N; k++) { const u = fa0 + (fa1 - fa0) * k / N, p = [u, rib(u), v]; if (prev) P.cyl(Y.archSteel, prev, p, 0.15, 0.15, 7, false); prev = p; }
          const nP = Math.max(3, Math.round((fa1 - fa0) / 2.3));
          for (let k = 0; k <= nP; k++) {
            const u = fa0 + (fa1 - fa0) * k / nP, yt = yDeck(u) - depth(u);
            P.cyl(Y.archSteel, [u, rib(u), v], [u, yt, v], 0.1, 0.1, 6, false);
            if (k < nP) { const u2 = fa0 + (fa1 - fa0) * (k + 1) / nP, a = k % 2 ? [u, yt, v] : [u, rib(u), v], b = k % 2 ? [u2, rib(u2), v] : [u2, yDeck(u2) - depth(u2), v]; P.cyl(Y.archSteel, a, b, 0.07, 0.07, 5, false); }
          }
        }
        for (let k = 1; k < 6; k++) { const u = fa0 + (fa1 - fa0) * k / 6; P.box(Y.archSteel, u - 0.08, u + 0.08, yDeck(u) - depth(u) - 0.16, yDeck(u) - depth(u), -hw + 0.3, hw - 0.3, 'b', 1); }
        // the granite landings with five steps at both ends
        for (const dir of [1, -1]) {
          const uo = dir * HL, ui = dir * (HL - stairL), n = 5;
          for (let i = 0; i < n; i++) { const ua = uo - dir * stairL * i / n, ub = uo - dir * stairL * (i + 1) / n, yt = e * (i + 1) / n; P.box(Y.step, Math.min(ua, ub), Math.max(ua, ub), 0, yt, -hw + 0.3, hw - 0.3, '', 1.5); }
          for (const sg of [-1, 1]) { const ua = uo, ub = ui; P.box(M.granite, Math.min(ua, ub), Math.max(ua, ub), -0.1, e + 0.12, sg > 0 ? hw - 0.3 : -hw, sg > 0 ? hw : -hw + 0.3, '', 2); }
        }
      }
      // ---- C: plank culvert: two timber curbs
      if (type === 'C') for (const sg of [-1, 1]) P.box(Y.timber, -HL, HL, -0.3, 0.2, sg * hw - 0.06, sg * hw + 0.06, '', 1);
      // ---- G: granite end posts on plinths, pale girder end faces
      const railA = -HL + (type === 'G' ? 0.85 : type === 'A' ? stairL * 0 + 0.45 : 0.3), railB = HL - (type === 'G' ? 0.85 : type === 'A' ? 0.45 : 0.3);
      if (type === 'G') for (const sg of [-1, 1]) for (const su of [-1, 1]) {
        const u = su * (HL - 0.45), v = sg * (hw - 0.34), y0 = yDeck(u);
        P.box(M.pylon, u - 0.3, u + 0.3, y0 - 0.12, y0 + 0.28, v - 0.3, v + 0.3, 'b', 1.2);
        P.box(M.pylon, u - 0.24, u + 0.24, y0 + 0.28, y0 + 1.1, v - 0.24, v + 0.24, 'b', 1.2);
        P.box(M.pylon, u - 0.3, u + 0.3, y0 + 1.1, y0 + 1.2, v - 0.3, v + 0.3, 'b', 1.2);
      }
      // ---- the railing: panels between the posts (alpha cut-out) + round posts
      const kind = sp.rail.kind, spec = RAIL[kind], rm = Y.rail(kind, sp.rail.hex), nb = Math.max(1, Math.round((railB - railA) / spec.W)), bw = (railB - railA) / nb;
      const rv = hw - 0.12;
      for (const sg of [-1, 1]) {
        const v = sg * rv;
        for (let i = 0; i < nb; i++) {
          const ua = railA + bw * i, ub = ua + bw, ya = yDeck(ua) + 0.06, yb2 = yDeck(ub) + 0.06;
          if (type === 'A' && (Math.abs(ua) > HL - stairL - 0.01 || Math.abs(ub) > HL - stairL + 0.01) && false) continue;
          P.quad(rm, [ua, ya, v], [ub, yb2, v], [ub, yb2 + spec.H, v], [ua, ya + spec.H, v], [0, 0, sg]); B.info.rails++;
        }
        for (let i = 0; i <= nb; i++) { const u = railA + bw * i, y = yDeck(u) + 0.04; P.cyl(Y.post, [u, y, v], [u, y + spec.H + 0.04, v], 0.04, 0.035, 5, true); }
      }
      // ---- bollards across the mouths of the narrow decks (a person passes, a car does not)
      B.bollards = [];
      if (2 * hw < 5.0) for (const su of [-1, 1]) {
        const u = su * (HL + 0.9), n = 2 * Math.max(1, Math.ceil((2 * hw - 0.9) / 2.2)), sp0 = Math.min(1.15, (2 * hw - 0.8) / (n - 1 || 1));       // an even number: a gap in the middle (1.15 m: a person passes, a car does not)
        for (let k = 0; k < n; k++) { const v = (k - (n - 1) / 2) * sp0; P.cyl(M.steel, [u, 0, v], [u, 0.8, v], 0.08, 0.08, 6, true); P.cyl(M.white, [u, 0.6, v], [u, 0.72, v], 0.085, 0.085, 6, false); B.bollards.push(w(u, v)); }
      }
      P.pop();
    };
    B.colliders = () => {
      const cl = [];
      const rampRot = Math.atan2(f.c, f.s), uA = type === 'A' ? -HL + stairL : -HL - 0.3, uB = type === 'A' ? HL - stairL : HL + 0.3, m = Math.max(1, Math.ceil((uB - uA) / (sp.crown > 0.05 ? 1.3 : 2.6)));
      for (let i = 0; i < m; i++) { const u0 = uA + (uB - uA) * i / m, u1 = uA + (uB - uA) * (i + 1) / m, q = w((u0 + u1) / 2, 0); ph.addWalkRamp(q.x, q.z, 2 * hw - 0.3, u1 - u0 + 0.04, rampRot, yDeck(u0), yDeck(u1), 2.5); cl.push(1); }
      if (type === 'A') for (const dir of [1, -1]) {                                                     // the steps (local z axis of a stair = +u * dir)
        const uo = dir * HL, ui = dir * (HL - stairL), q = w((uo + ui) / 2, 0), rot = dir > 0 ? Math.atan2(-f.c, -f.s) : rampRot;
        ph.addStairs(q.x, q.z, 2 * hw - 0.6, stairL, rot, 0, e, 5); cl.push(1);
      }
      const top = Math.max(yDeck(mid), yDeck(bk0), yDeck(bk1)) + 1.2;
      for (const sg of [-1, 1]) { const nR = Math.max(1, Math.ceil(2 * HL / 6)); for (let i = 0; i < nR; i++) { const u0 = -HL + 2 * HL * i / nR, u1 = -HL + 2 * HL * (i + 1) / nR, q = w((u0 + u1) / 2, sg * (hw - 0.1)); ph.addBox(q.x, q.z, u1 - u0 + 0.05, 0.26, -f.T, -6, top); cl.push(1); } }
      for (const q of B.bollards || []) { ph.addCylinder(q.x, q.z, 0.12, -0.5, 1.6); cl.push(1); }
      const cut = openRimBoxes(ph, f, HL, hw, (x, z, l, d, rot) => { ph.addBox(x, z, l, d, rot, -2, 1.25); });
      B.info.rimCut = cut; B.info.colliders = cl.length; return cl.length;
    };
    return B;
  };

  // ================================================================================================ the sluices
  const makeSluice = (sp) => {
    sp={...sp,len:Math.max(9,sp.len)}; // Extend the existing deck over the authored boat passage.
    const f = frameOfPond(sp), w = (u, v) => W(f, u, v), HL = sp.len / 2, wd = sp.wd, hv = wd / 2, yT = 0.32;
    const B = { id: sp.id, name: sp.name, nameEn: sp.nameEn, x: f.cx, z: f.cz, at: [f.cx, f.cz], info: { type: 'sluice', len: sp.len, rails: 0, colliders: 0 }, masts: [] };
    B.crossing={ax:f.c,az:f.s,w:wd,len:sp.len};
    B.bounds = (() => { let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const [u, v] of [[-HL, -hv], [HL, -hv], [HL, hv], [-HL, hv]]) { const q = w(u, v); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z); } return [x0 - 3, z0 - 3, x1 + 3, z1 + 3]; })();
    B.deckAt = () => null;
    const tor = new THREE.TorusGeometry(0.34, 0.022, 4, 12);
    const cols = [];
    B.draw = (P) => {
      P.push(f.cx, 0, f.cz, -f.T);
      P.box(M.granite, -HL, HL, -0.5, yT - 0.06, -hv, hv, 't', 2.4);                                      // the headwall block
      P.box(Y.sluiceDeck, -HL - 0.08, HL + 0.08, yT - 0.06, yT, -hv - 0.08, hv + 0.08, 'b', 2.4);          // the granite deck slab
      // the gate opening on both long faces: a black steel gate plate with a rusty lower leaf and a grating of thin bars in front (photos s4s1 s5n1)
      for (const sg of [-1, 1]) {
        const v = sg * (hv + 0.02), gw = sp.gates === 2 ? 1.2 : 1.1;
        for (let g = 0; g < sp.gates; g++) {
          const uc = sp.gates === 2 ? (g === 0 ? -HL * 0.42 : HL * 0.42) : 0;
          P.quad(Y.gateBlack, [uc - gw / 2, -0.3, v], [uc + gw / 2, -0.3, v], [uc + gw / 2, yT - 0.12, v], [uc - gw / 2, yT - 0.12, v], [0, 0, sg]);
          P.quad(Y.plate, [uc - gw / 2 + 0.08, -0.3, v + sg * 0.01], [uc + gw / 2 - 0.08, -0.3, v + sg * 0.01], [uc + gw / 2 - 0.08, -0.0, v + sg * 0.01], [uc - gw / 2 + 0.08, -0.0, v + sg * 0.01], [0, 0, sg]);
          for (let k = 0; k <= 8; k++) { const u = uc - gw / 2 + 0.05 + (gw - 0.1) * k / 8; P.cyl(M.black, [u, -0.3, v + sg * 0.12], [u, 0.12, v + sg * 0.12], 0.012, 0.012, 3, false); }
          P.box(M.black, uc - gw / 2, uc + gw / 2, 0.1, 0.14, v + sg * 0.1, v + sg * 0.14, '', 1);
        }
      }
      // winch columns on the deck: portal frame + pale column, spindle and hand wheel (set off the axis: a visitor passes on the other side, the deck is only 2.4 - 3 m wide)
      for (let g = 0; g < sp.gates; g++) {
        const uc = sp.gates === 2 ? (g === 0 ? -HL * 0.42 : HL * 0.42) : 0, vc = sp.gates === 2 ? (g === 0 ? 0.4 : -0.4) : 0.45;
        for (const du of [-0.5, 0.5]) P.box(Y.winch, uc + du - 0.04, uc + du + 0.04, yT, yT + 0.95, vc - 0.08, vc + 0.08, 'b', 1);
        P.box(Y.winch, uc - 0.55, uc + 0.55, yT + 0.88, yT + 0.98, vc - 0.1, vc + 0.1, '', 1);
        P.cyl(Y.winch, [uc, yT, vc], [uc, yT + 1.05, vc], 0.15, 0.1, 8, true);
        P.cyl(M.black, [uc, yT + 1.05, vc], [uc, yT + 1.7, vc], 0.03, 0.03, 4, true);
        P.geo(Y.winch, tor, uc, yT + 1.05, vc, Math.PI / 2, 0, 0, 1, 1, 1);
        cols.push(w(uc, vc));
      }
      // railing: X-lattice along both long sides between granite end posts
      const rm = Y.rail('xlat', '#cfd5d8'), spec = RAIL.xlat, nb = Math.max(1, Math.round((2 * HL - 1.0) / spec.W)), bw = (2 * HL - 1.0) / nb, rv = hv - 0.1;
      for (const sg of [-1, 1]) {
        for (let i = 0; i < nb; i++) { const ua = -HL + 0.5 + bw * i; P.quad(rm, [ua, yT + 0.03, sg * rv], [ua + bw, yT + 0.03, sg * rv], [ua + bw, yT + 0.03 + spec.H, sg * rv], [ua, yT + 0.03 + spec.H, sg * rv], [0, 0, sg]); B.info.rails++; }
        for (const su of [-1, 1]) { const u = su * (HL - 0.28), v = sg * (hv - 0.2); P.box(M.pylon, u - 0.22, u + 0.22, yT, yT + 1.05, v - 0.22, v + 0.22, 'b', 1.2); }
      }
      // bollards at the two mouths (a person passes, a car does not)
      B.bollards = [];
      for (const su of [-1, 1]) for (const v of [-0.65, 0.65]) { const u = su * (HL + 0.8); P.cyl(M.steel, [u, 0, v], [u, 0.8, v], 0.08, 0.08, 6, true); P.cyl(M.white, [u, 0.6, v], [u, 0.72, v], 0.085, 0.085, 6, false); B.bollards.push(w(u, v)); }
      // approach slabs: two granite steps from the ground to the deck
      for (const su of [-1, 1]) P.box(Y.step, su > 0 ? HL : -HL - 0.45, su > 0 ? HL + 0.45 : -HL, 0, yT * 0.5, -hv, hv, su > 0 ? 'l' : 'r', 1.5);
      P.pop();
    };
    B.colliders = () => {
      let n = 0;
      const q = w(0, 0); ph.addWalkBox(q.x, q.z, sp.len + 0.2, wd + 0.1, -f.T, yT, -0.5); n++;
      for (const su of [-1, 1]) { const a = w(su * (HL + 0.225), 0); ph.addWalkBox(a.x, a.z, 0.45, wd, -f.T, yT * 0.5, -0.5); n++; }
      for (const sg of [-1, 1]) { const a = w(0, sg * (hv - 0.1)); ph.addBox(a.x, a.z, sp.len - 0.7, 0.2, -f.T, -0.5, yT + 1.2); n++; }
      for (const su of [-1, 1]) for (const sg of [-1, 1]) { const a = w(su * (HL - 0.28), sg * (hv - 0.2)); ph.addCylinder(a.x, a.z, 0.28, -1.5, yT + 1.1); n++; }
      for (const c of cols) { ph.addCylinder(c.x, c.z, 0.17, -1.5, yT + 2.0); n++; }
      for (const b of B.bollards || []) { ph.addCylinder(b.x, b.z, 0.12, -0.5, 1.6); n++; }
      n += openRimBoxes(ph, f, HL + 0.8, hv + 0.1, (x, z, l, d, rot) => { ph.addBox(x, z, l, d, rot, -2, 1.25); }) * 0;
      B.info.colliders = n; return n;
    };
    return B;
  };

  // ================================================================================================ cells: greedy clusters of <= 150 m, one Parts (= one mesh per material) each
  const all = [...PONDS.map((sp) => ({ sp, kind: 'b' })), ...SLUICES.map((sp) => ({ sp, kind: 's' }))].map((o) => { const f = frameOfPond(o.sp); return { ...o, x: f.cx, z: f.cz }; });
  const cells = [];
  for (const o of all) {
    let c = cells.find((q) => q.items.some((p) => Math.hypot(p.x - o.x, p.z - o.z) < 150));
    if (!c) { c = { items: [] }; cells.push(c); }
    c.items.push(o);
  }
  let ci = 0;
  for (const cell of cells) {
    const P = new Parts(), names = [];
    for (const o of cell.items) {
      let B; const t00 = P.tris;
      try { B = o.kind === 'b' ? makeBridge(o.sp) : makeSluice(o.sp); B.draw(P); }
      catch (err) { console.error(`[bridges] ${o.sp.id} failed:`, err); throw err; }
      B.info.tris = P.tris - t00; B.info.cell = ci; names.push(o.sp.id); B.cellTris = B.info.tris;
      sites.push(B); out.list.push({ id: B.id, name: B.name, nameEn: B.nameEn, x: B.x, z: B.z, at: B.at, B });
    }
    flush(P, 'ypond-' + ci); out.cells++; ci++;
  }
  for (const b of sites) out.colliders += b.colliders();
  out.info = { ms: Date.now() - t0, tris: sites.reduce((a, b) => a + (b.info.tris || 0), 0), bridges: PONDS.length, sluices: SLUICES.length, cells: out.cells, banks: Object.fromEntries(sites.map((b) => [b.id, b.info])) };
  if (ctx.services) ctx.services.yelaginPonds = { info: out.info, sites };
  void TM;
  return out;
}
