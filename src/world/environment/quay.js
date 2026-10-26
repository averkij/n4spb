// environment/quay.js - the granite quays of EVERY waterway: Fontanka, Griboedov Canal, Moika, Winter Canal, Swan Canal and the Neva (south bank: Palace and Admiralty embankments).
// Swept along the real bank chains of waterways.js / river.js (mitre joints, 9 m pieces inside the data, 120 m pieces beyond it, out to the Neva scenery of waterways.js farBanks), per waterway with its own
// cross-section (WATERWAYS: water level, wall texture, coping profile, parapet kind, post type, bay):
//   * wall: pink-grey granite ashlar in 0.55-0.7 m courses (the Fontanka: grey with pink veining), a dark water-line band + algae stain, rain streaks under the coping, a seam every
//     7.2 m; water line at the waterway's level (-2.9 ... -3.4), wall foot 0.55 m below it, coping top y = +0.17 (above the kerb 0.15 so the streets' kerbs / pavements never cover it)
//   * Fontanka: box coping 0.34 high, pale pink-grey posts 0.45 x 1.0 m every ~3.2 m, black lattice / clover / bar panels (as before)
//   * Griboedov Canal: rolled coping, pink posts 0.5 x 1.1 m (two-step cap) every 2.7 m, black bar panels with a loop band; the Kazan stretch of the west bank has stout granite posts
//     joined by ONE silver steel tube (docs/research/west-canals-bridges.md section 2.1); the east bank near Kazansky and the WSW stretch carry the tall stadium-loop railing
//   * Moika: the "ring / quatrefoil / vase" railing (top frieze of rings, pointed arcs with quatrefoils, turned balusters, a diagonal band), rose-red posts, bay 2.4 m
//   * Winter Canal: round granite pylons on bell corbels every 2.3 m with the black lancet-arch railing (Dunker's design, 1782-84)
//   * Neva (Dvortsovaya / Admiralteyskaya): batter 1:12 wall, a rolled string course and the monolithic rounded granite parapet roll (0.88 m wide, 1.0 m high, sections of 2.2 m with
//     joint lines and a recessed panel on the river face): no iron railing
//   * mooring rings and "anchor prohibited" plates on the wall, drain culverts at the bridges, stair flights (descents with a landing 0.22 m above the water) at the OSM steps / piers,
//     and the COLLIDER that keeps everybody out of the trench (boxes 1.6 m thick, y -6 ... +1.25) except in the GAPS of the bridge crossings (bridges/sites.js decks, BRIDGE_ZONES):
//     there the wall face is still drawn (pushed back by polygonOffset so the bridge's abutment faces always win) but coping, parapet and collider are left out for the bridge owner;
//     the crossings that no bridge module draws get an invisible fallback deck (walk box + parapet boxes) so nobody falls into the water
// DESCENTS (every waterway but the Fontanka): at each OSM steps way / landing stage near a bank the wall gets a walkable descent - a GATE in the parapet / railing line (a landing flush with
//   the pavement between cheek walls, 3.8 m), a FLIGHT of 15-20 granite steps (0.34 run, <= 0.19 rise) hugging the wall face with a stepped cheek wall on the water side, and a LOWER LANDING
//   0.22 m above the water; planned on a first frames pass (straight stretch, no bridge zone within 9 m, 24 m apart), then the wall pieces are split at the gate / flight / landing ends
//   (segKind). Inside PLAY they are physical: walk boxes + sticky stairs, solid barriers on the water side / back / end (nobody can step off into the trench; tools/environment-walk.mjs
//   walks a simulated player down every one and pushes at every edge). The quay collider is a thin wall box now (0.4 m landward of the wall line .. 0.05 m beyond, y -8 .. 1.25).
//   A pier (OSM landing stage) near the lower landing is moved beside it (a 0.4 m gap to the wall, quay.pierOverride -> boats.js draws it; deck walk box + railing barriers, an opening toward
//   the landing). The widest descent (nearest to the Palace Pier of the OSM data) is the LIONS DESCENT: two red-granite pedestals flank its gate with a copper lion each (lions.js).
// Anichkov Bridge: the deck polygon r5537267 (landmarksC) is the gap of the Fontanka there, exactly as before (landmarksC/closure.js re-derives the bank pieces: frames() below keeps the
// densification of the old code for the Fontanka).
// GRASS-SLOPE BANKS (Mars Field extension, docs/research/mars-bridges-canals.md 2.1 / 2.2; waterways.js SLOPE_REACHES / slopeRuns): the Swan Canal (everywhere) and the Moika along the Mikhailovsky Garden are NOT granite walls: a low
//   granite banquette 0.45 m above the water, a lip, a grass slope (4.2-4.7 m run) up to street level (the ground plane is cut away over it: river.js waterCuts kind 'slope'), granite end caps at the bridge zones, a collider on the
//   slope top, ball-post rail + two tubes (Mars Field side) / green trellis (garden side) on the Swan Canal; the Fontanka north of the Moika source has the stadium-loop rail (east) / pointed-arch band rail with big pink posts (garden bank);
//   the Moika bank along the Mikhailovsky Garden has the slope but no rail; the Moika bank at the Summer Garden keeps wall + collider but no railing (the garden fence stands there). Service: quay.slopes.
// SERVICE (ctx.services.environment.quay): { pierOverride: { pierId: { cx, cz, ax, az, len, wid } }, water (Fontanka), top, segments: [{ax,az,bx,bz,nx,nz,bank,key}], gaps, bridges: [zones], stairs: [Fontanka flights (landmarksC pontoons)], allStairs: [every flight (descents: walk, endX/endZ, topY, pier)
//   { x,z,tx,tz,nx,nz,bank,key,length,landingY,w }], rings, signs, posts, panels, colliders, banks: [{name,key,len}] }
import * as THREE from 'three';
import { mergedMedianAt } from '../lib/road-plan.js';
import * as L from '../layout.js';
import { MeshBuilder } from '../lib/massing.js';
import { PIERS, STEPS } from '../data/city.js';
import { deckPoly, bridgeZones, floorZones, waterBanks } from './river.js';
import { WATERWAYS, waterGeo, farBanks, slopeRuns } from './waterways.js';
import { pointInRing, distToRing, hash2 } from './util.js';
import { pierRects } from './boats.js';
import { BANK_INDEX } from './bank-index.js';
import { lionGeometry } from './lions.js';
import { knockBays, faceLeft, unitBox, unitProfile } from '../lib/fence-bays.js';
const L2 = L;

export const WATER_Y = L.RIVER_Y.water;
const Y_TOP = 0.17, COP_BOT = -0.34, COP_OUT = 0.10, COP_IN = 0.62;
const TILE_U = 7.2;
const lvl = (key) => WATERWAYS[key].water;
const FOOT = 0.12;                                           // the wall foot lies this far below the water line (the outline pass sees the foot through the water: keep it at the shore line)
const yBot = (key) => lvl(key) - FOOT;
const tileH = (key) => Y_TOP - yBot(key);
/** descents (stair flights down to the water) of the canals and the Neva: dimensions in metres along the wall (u) and out from the wall face (v) */
const DS = { gateA: 2.0, gateB: 1.8, run: 0.34, rise: 0.19, low: 3.0, topY: 0.10 };
const descentWidth = (key, site) => (key === 'neva' ? (site.big ? 4.6 : 2.8) : key === 'winter-canal' ? 1.6 : 1.9);
/** STEPPABLE FONTANKA FLIGHTS (owner 2026-10-26, a motor boat is parked beside the Anichkov landing stage): the stair flight of the pontoon at the west bank of the Fontanka (OSM pier near (-452.9, -166.3)) is walkable: the railing
 *  has a gap of +-OPEN_GATE m along the quay at the flight (no collider, no drawn panel; the posts frame it), walk boxes carry the walker over the landing / treads / lower landing and the deck of the pontoon of landmarksC/boats.js
 *  (PONTOON: its length / width / deck top, kept in step with buildPier there). Other flights stay as they were (decoration); add a site here to open one. */
const OPEN_FONTANKA_STAIRS = [{ x: -452.9, z: -166.3, r: 6 }];
const OPEN_GATE = 1.2, PONTOON = { len: 15, wid: 3.0, top: -2.72 };
const nearMargin = 25;                                      // detail (posts, rings, 9 m pieces) inside the data extent + this margin
const isNear = (x, z) => L.inExtent(x, z, -nearMargin);

// ---------------------------------------------------------------- textures
const WALLS = {
  fontanka: { tones: ['#8b8783', '#928a85', '#7d7a77', '#948f8a', '#86807a', '#8e8985', '#9a8077'], rows: 7, vein: 1 },
  griboedov: { tones: ['#a99b8f', '#9e9086', '#b3a498', '#968880', '#a8978c', '#9c8d84', '#b19c8e'], rows: 6, vein: 0.6 },
  moika: { tones: ['#a39088', '#98867e', '#ad9a90', '#907f78', '#a68e84', '#9a8880', '#b09890'], rows: 6, vein: 0.6, rust: 1 },
  'winter-canal': { tones: ['#a8968c', '#9c8a82', '#b2a096', '#94847c', '#a8928a', '#9e8c84', '#b09c90'], rows: 6, vein: 0.6 },
  moat: { tones: ['#a8968c', '#9c8a82', '#b2a096', '#94847c', '#a8928a'], rows: 4, vein: 0.5 },
  'swan-canal': { tones: ['#a39088', '#98867e', '#ad9a90', '#907f78', '#a68e84', '#9a8880'], rows: 6, vein: 0.5 },
  neva: { tones: ['#ab9487', '#b49d90', '#9d8a7e', '#a68f84', '#b8a094', '#a08c80', '#b09584'], rows: 7, vein: 0.8, big: 1 },
};
function wallTexture(ctx, key, base = key) {
  const W = WALLS[key], H = tileH(base), wlFrac = 1 - FOOT / H;
  return ctx.tex.draw(1024, 512, (g, w, h) => {
    const r = ctx.rng('quay-wall-tex-' + key);
    g.fillStyle = W.tones[0]; g.fillRect(0, 0, w, h);
    const rows = W.rows, rh = h / rows, tones = W.tones;
    for (let j = 0; j < rows; j++) {
      let x = -r() * 120;
      while (x < w) {
        const bw = (W.big ? 150 : 115) + r() * (W.big ? 190 : 150), c = tones[Math.floor(r() * tones.length)], v = 0.92 + r() * 0.14;
        g.fillStyle = c; g.fillRect(x + 1.5, j * rh + 1.5, bw - 3, rh - 3);
        g.fillStyle = `rgba(${v > 1 ? 255 : 0},${v > 1 ? 255 : 0},${v > 1 ? 255 : 0},${Math.abs(v - 1) * 0.5})`; g.fillRect(x + 1.5, j * rh + 1.5, bw - 3, rh - 3);
        if (r() < 0.5 * W.vein) { g.strokeStyle = `rgba(190,150,140,${0.12 + r() * 0.15})`; g.lineWidth = 1.5 + r() * 2; g.beginPath(); g.moveTo(x + r() * bw, j * rh + 3); g.lineTo(x + r() * bw, (j + 1) * rh - 3); g.stroke(); }
        if (W.rust && r() < 0.3) { g.fillStyle = 'rgba(150,100,70,0.16)'; g.fillRect(x + 4 + r() * bw * 0.5, j * rh + 3, 4 + r() * 10, rh * (0.5 + r() * 1.5)); }
        x += bw;
      }
    }
    g.strokeStyle = 'rgba(38,36,36,0.5)'; g.lineWidth = 2.5;
    for (let j = 0; j <= rows; j++) { g.beginPath(); g.moveTo(0, j * rh); g.lineTo(w, j * rh); g.stroke(); }
    // rain streaks running down from the coping (top = canvas y 0)
    for (let i = 0; i < 40; i++) {
      const x = r() * w, len = 60 + r() * 220, wd = 2 + r() * 7, gr = g.createLinearGradient(0, 0, 0, len);
      gr.addColorStop(0, `rgba(54,52,50,${0.18 + r() * 0.18})`); gr.addColorStop(1, 'rgba(54,52,50,0)'); g.fillStyle = gr; g.fillRect(x, 0, wd, len);
    }
    // the dark water-line band and the algae stain
    const wl = h * wlFrac;
    const damp = g.createLinearGradient(0, wl - 60, 0, h);
    damp.addColorStop(0, 'rgba(40,52,42,0)'); damp.addColorStop(0.4, 'rgba(36,50,40,0.55)'); damp.addColorStop(1, 'rgba(22,34,30,0.85)');
    g.fillStyle = damp; g.fillRect(0, wl - 60, w, h - wl + 60);
    for (let i = 0; i < 70; i++) { const x = r() * w, hh = 5 + r() * 18; g.strokeStyle = `rgba(${70 + Math.round(r() * 40)},${100 + Math.round(r() * 40)},${50 + Math.round(r() * 20)},${0.35 + r() * 0.4})`; g.lineWidth = 1.2 + r() * 1.6; g.beginPath(); g.moveTo(x, wl + 6); g.quadraticCurveTo(x + (r() - 0.5) * 6, wl - hh * 0.5, x + (r() - 0.5) * 9, wl - hh); g.stroke(); }
    // expansion seam on the tile edge
    g.fillStyle = 'rgba(30,28,28,0.38)'; g.fillRect(0, 0, 3, h); g.fillRect(w - 2, 0, 2, h);
  }, { key: 'env-quay-wall-pb2-' + key, repeat: [1, 1], anisotropy: 8 });
}
/** the monolithic Neva parapet: pink-red granite roll, rust-red lead joints at the section edges, a recessed panel with chamfered corners on the river face (v 0.18 .. 0.62 of the face) */
function parapetTexture(ctx) {
  return ctx.tex.draw(256, 256, (g, w, h) => {
    const r = ctx.rng('quay-parapet');
    g.fillStyle = '#b08c7f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '120,70,62' : '214,164,150'},${0.06 + r() * 0.1})`; g.fillRect(r() * w, r() * h, 2 + r() * 8, 2 + r() * 8); }
    g.fillStyle = 'rgba(70,40,36,0.55)'; g.fillRect(0, 0, 5, h); g.fillRect(w - 4, 0, 4, h);
    g.fillStyle = 'rgba(140,60,40,0.7)'; g.fillRect(2, 0, 2, h);
    // the recessed panel (face of the parapet = the lower 60 % of the tile height, drawn from the bottom)
    g.strokeStyle = 'rgba(70,44,40,0.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(34, h * 0.78); g.lineTo(46, h * 0.64); g.lineTo(w - 46, h * 0.64); g.lineTo(w - 34, h * 0.78); g.lineTo(w - 46, h * 0.92); g.lineTo(46, h * 0.92); g.closePath(); g.stroke();
    g.fillStyle = 'rgba(70,44,40,0.12)'; g.fill();
  }, { key: 'env-quay-parapet2', repeat: [1, 1], anisotropy: 8 });
}
/** railing panel textures (alpha cut-out; black iron on transparent) */
function railTexture(ctx, kind) {
  return ctx.tex.draw(512, kind === 'trellis' ? 404 : 168, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#202428'; g.strokeStyle = '#202428';
    const rail = (y, t) => g.fillRect(0, y, w, t);
    g.lineCap = 'round';
    const ring = (x, y, r0) => { g.lineWidth = 3; g.beginPath(); g.arc(x, y, r0, 0, 6.3); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(x, y, r0 * 0.5, 0, 6.3); g.stroke(); };
    const quatrefoil = (cx, cy, rr) => { g.lineWidth = 3; for (const [ox, oy] of [[-rr, 0], [rr, 0], [0, -rr], [0, rr]]) { g.beginPath(); g.arc(cx + ox, cy + oy, rr, 0, 6.3); g.stroke(); } };
    if (kind === 'lattice') {
      rail(6, 10); rail(h - 22, 12); rail(30, 4); rail(h - 40, 4);
      g.lineWidth = 4;
      const step = 30;
      for (let x = -h; x < w + h; x += step) { g.beginPath(); g.moveTo(x, 36); g.lineTo(x + (h - 78), h - 42); g.stroke(); g.beginPath(); g.moveTo(x + (h - 78), 36); g.lineTo(x, h - 42); g.stroke(); }
      for (let x = 10; x < w; x += 98) g.fillRect(x, 6, 6, h - 12);
    } else if (kind === 'clover') {
      rail(6, 8); rail(h - 20, 12); g.lineWidth = 5;
      for (let k = 0; k < 8; k++) { g.beginPath(); g.arc(32 + k * 64, 30, 22, 0, 6.3); g.stroke(); }
      for (let k = 0; k < 3; k++) {
        const cx = 85 + k * 171; g.beginPath(); g.arc(cx, h - 20, 80, Math.PI * 1.12, Math.PI * 1.88); g.stroke();
        for (const [ox, oy] of [[-9, 0], [9, 0], [0, -9], [0, 9]]) { g.beginPath(); g.arc(cx + ox, 98 + oy, 8, 0, 6.3); g.stroke(); }
      }
      for (let x = 12; x < w; x += 171) g.fillRect(x, 6, 6, h - 12);
    } else if (kind === 'moika') {
      // top rail, a frieze of 16 double rings, three pointed arcs each holding a quatrefoil, three turned vase balusters, a band of crossing diagonals with rosettes, bottom rail
      rail(4, 9); rail(h - 12, 10);
      for (let k = 0; k < 16; k++) ring(16 + k * 32, 30, 11);
      g.lineWidth = 5;
      for (let k = 0; k < 3; k++) {
        const x0 = 4 + k * 168, x1 = x0 + 164, xm = (x0 + x1) / 2;
        g.beginPath(); g.moveTo(x0 + 6, h - 36); g.quadraticCurveTo(x0 + 8, 76, xm, 48); g.quadraticCurveTo(x1 - 8, 76, x1 - 6, h - 36); g.stroke();
        quatrefoil(xm, 98, 9);
      }
      for (let k = 0; k < 3; k++) {                              // vase balusters (spool: two bulges on a stem) between the arcs
        const x = 4 + k * 168 + 84 + 0; void x;
      }
      for (let k = 0; k <= 3; k++) {
        const x = 4 + k * 168; g.fillRect(x - 3, 44, 6, h - 80);
        g.beginPath(); g.ellipse(x, 70, 8, 11, 0, 0, 6.3); g.fill(); g.beginPath(); g.ellipse(x, 112, 8, 11, 0, 0, 6.3); g.fill();
      }
      g.lineWidth = 3;
      for (let x = -20; x < w + 20; x += 24) { g.beginPath(); g.moveTo(x, h - 36); g.lineTo(x + 24, h - 14); g.stroke(); g.beginPath(); g.moveTo(x + 24, h - 36); g.lineTo(x, h - 14); g.stroke(); }
      for (let x = 12; x < w; x += 48) { g.beginPath(); g.arc(x, h - 25, 4, 0, 6.3); g.fill(); }
    } else if (kind === 'loops') {
      // tall stadium loops (double wall), small turned balusters between them, bulbous foot collars, flat top rail
      rail(4, 12); rail(h - 22, 12);
      for (let k = 0; k < 14; k++) {
        const x = 8 + k * 36.5;
        g.lineWidth = 3.5; g.beginPath(); g.moveTo(x, 44); g.lineTo(x, h - 44); g.arc(x + 12, h - 44, 12, Math.PI, 0, true); g.lineTo(x + 24, 44); g.arc(x + 12, 44, 12, 0, Math.PI, true); g.closePath(); g.stroke();
        g.lineWidth = 2; g.beginPath(); g.moveTo(x + 5, 46); g.lineTo(x + 5, h - 46); g.moveTo(x + 19, 46); g.lineTo(x + 19, h - 46); g.stroke();
        g.fillRect(x + 28, 20, 3, h - 42); g.beginPath(); g.ellipse(x + 29.5, 96, 5, 7, 0, 0, 6.3); g.fill();
        g.beginPath(); g.ellipse(x + 12, h - 30, 11, 5, 0, 0, 6.3); g.fill();
      }
    } else if (kind === 'trellis') {
      // the green garden trellis of the Swan Canal (photos refs/mars-bridges 23, 26): a square diamond lattice (diamond ~0.25 m) in a thin frame, 2.4 x 1.9 m per panel
      g.fillStyle = g.strokeStyle = '#4f9a48'; g.lineWidth = 4.5;
      const st = 52;
      for (let x = -h; x < w + h; x += st) { g.beginPath(); g.moveTo(x, 10); g.lineTo(x + (h - 20), h - 10); g.stroke(); g.beginPath(); g.moveTo(x + (h - 20), 10); g.lineTo(x, h - 10); g.stroke(); }
      g.fillRect(0, 0, w, 12); g.fillRect(0, h - 16, w, 16); g.fillRect(0, 0, 9, h); g.fillRect(w - 9, 0, 9, h); g.fillRect(w / 2 - 3, 0, 6, h);
    } else if (kind === 'arcade') {
      // Fontanka garden bank (photo 150): round top rail, a band of pointed arches (8 per bay) on thin bars, vertical round bars with collar rings, a heavy bottom rail
      rail(4, 10); rail(h - 20, 14);
      g.lineWidth = 3.4;
      for (let k = 0; k < 8; k++) { const x0 = 3 + k * 63.5, x1 = x0 + 63.5, xm = (x0 + x1) / 2; g.beginPath(); g.moveTo(x0 + 2, 58); g.quadraticCurveTo(x0 + 3, 30, xm, 16); g.quadraticCurveTo(x1 - 3, 30, x1 - 2, 58); g.stroke(); }
      for (let x = 6; x < w; x += 15.8) { g.fillRect(x - 2.2, 14, 4.4, h - 30); }
      for (let x = 6; x < w; x += 15.8) { g.beginPath(); g.ellipse(x, 74, 4.2, 4, 0, 0, 6.3); g.fill(); g.beginPath(); g.ellipse(x, h - 34, 4, 3, 0, 0, 6.3); g.fill(); }
      rail(62, 5); g.fillRect(0, 0, 7, h); g.fillRect(w - 7, 0, 7, h);
    } else if (kind === 'vase') {
      // the standard canal balustrade (photos refs/canals 76, 84): a heavy flat top rail, a thin second rail, a dense row of turned vase balusters on a bottom rail
      rail(3, 15); rail(21, 5); rail(h - 22, 14);
      for (let x = 6; x < w; x += 21.3) {
        g.fillRect(x - 2.5, 26, 5, h - 50);
        g.beginPath(); g.ellipse(x, h * 0.40, 6.5, 15, 0, 0, 6.3); g.fill();
        g.beginPath(); g.ellipse(x, h * 0.72, 5.5, 9, 0, 0, 6.3); g.fill();
        g.fillRect(x - 5, 29, 10, 4);
      }
      g.fillRect(0, 1, 6, h - 10); g.fillRect(w - 6, 1, 6, h - 10);
    } else if (kind === 'lancet') {
      // Winter Canal: round top rail, 8 paired pointed arches per bay, vertical bars with a collar ring, triangular feet
      rail(5, 9);
      for (let k = 0; k <= 8; k++) {
        const x = 3 + k * 63.5; g.fillRect(x - 2.5, 12, 5, h - 28);
        g.beginPath(); g.moveTo(x - 7, h - 8); g.lineTo(x, h - 28); g.lineTo(x + 7, h - 8); g.closePath(); g.fill();
        g.lineWidth = 3; g.beginPath(); g.arc(x, 90, 6, 0, 6.3); g.stroke();
      }
      g.lineWidth = 3.5;
      for (let k = 0; k < 8; k++) {
        const x0 = 3 + k * 63.5, x1 = x0 + 63.5, xm = (x0 + x1) / 2;
        for (const [a, b] of [[x0, xm], [xm, x1]]) { const c = (a + b) / 2; g.beginPath(); g.moveTo(a + 2, h - 34); g.quadraticCurveTo(a + 4, 56, c, 36); g.quadraticCurveTo(b - 4, 56, b - 2, h - 34); g.stroke(); }
      }
    } else {
      rail(6, 9); rail(h - 18, 12); rail(52, 5);
      for (let x = 8; x < w; x += 20) { g.fillRect(x, 6, 5, h - 12); g.beginPath(); g.moveTo(x - 3, 6); g.lineTo(x + 2.5, -2); g.lineTo(x + 8, 6); g.fill(); }
    }
  }, { key: 'env-quay-rail-' + kind + '-3', repeat: [1, 1], anisotropy: 4 });
}
/** the mown grass of the slope banks (photos refs/mars-bridges 13, 23): sunlit green with soft light / dark patches, short blade strokes and the odd dandelion */
function grassTexture(ctx) {
  return ctx.tex.draw(512, 512, (g, w, h) => {
    const r = ctx.rng('quay-grass-tex');
    g.fillStyle = '#5f9238'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? 'rgba(122,170,64,0.18)' : 'rgba(54,98,36,0.16)'; g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 50, 12 + r() * 30, r() * 3, 0, 6.3); g.fill(); }
    for (let i = 0; i < 1500; i++) { const x = r() * w, y = r() * h, l = 4 + r() * 8; g.strokeStyle = r() < 0.5 ? 'rgba(150,196,84,0.55)' : 'rgba(40,84,30,0.5)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - l); g.stroke(); }
    for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(236,214,70,0.8)'; g.fillRect(r() * w, r() * h, 3, 3); }
  }, { key: 'env-quay-grass-1', repeat: [1, 1], anisotropy: 4 });
}
function anchorSignTexture(ctx) {
  return ctx.tex.draw(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const c = w / 2;
    g.fillStyle = '#f4f2ec'; g.beginPath(); g.arc(c, c, 62, 0, 6.3); g.fill();
    g.strokeStyle = '#d0242e'; g.lineWidth = 12; g.beginPath(); g.arc(c, c, 56, 0, 6.3); g.stroke();
    g.strokeStyle = '#1b1f20'; g.fillStyle = '#1b1f20'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.arc(c, 34, 8, 0, 6.3); g.stroke();                       // the anchor: ring, shaft, stock, arms + flukes
    g.beginPath(); g.moveTo(c, 42); g.lineTo(c, 98); g.stroke();
    g.beginPath(); g.moveTo(c - 15, 55); g.lineTo(c + 15, 55); g.stroke();
    g.beginPath(); g.arc(c, 80, 28, 0.15, Math.PI - 0.15); g.stroke();
    g.beginPath(); g.moveTo(c - 26, 74); g.lineTo(c - 30, 86); g.lineTo(c - 18, 84); g.fill(); g.beginPath(); g.moveTo(c + 26, 74); g.lineTo(c + 30, 86); g.lineTo(c + 18, 84); g.fill();
    g.strokeStyle = '#d0242e'; g.lineWidth = 10; g.beginPath(); g.moveTo(c - 44, c - 44); g.lineTo(c + 44, c + 44); g.stroke();   // the prohibition slash
  }, { key: 'env-quay-anchor-sign', repeat: [1, 1], anisotropy: 4 });
}
/** an iron mooring ring on a plate (sprite on the wall face) */
function ringTexture(ctx) {
  return ctx.tex.draw(64, 96, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#23262a'; g.fillRect(24, 6, 16, 22);                          // the plate / staple
    g.strokeStyle = '#23262a'; g.lineWidth = 7; g.beginPath(); g.arc(32, 58, 22, 0, 6.3); g.stroke();
    g.strokeStyle = 'rgba(120,120,120,0.5)'; g.lineWidth = 2; g.beginPath(); g.arc(29, 55, 21, 3.6, 5.3); g.stroke();
  }, { key: 'env-quay-ring-sprite', repeat: [1, 1], anisotropy: 4 });
}
/** a black drain culvert mouth: an arched dark opening with a stone surround */
function culvertTexture(ctx) {
  return ctx.tex.draw(64, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(120,108,100,0.9)'; g.beginPath(); g.moveTo(2, h); g.lineTo(2, 30); g.arc(32, 30, 30, Math.PI, 0); g.lineTo(w - 2, h); g.closePath(); g.fill();
    g.fillStyle = '#0e1214'; g.beginPath(); g.moveTo(9, h); g.lineTo(9, 32); g.arc(32, 32, 23, Math.PI, 0); g.lineTo(w - 9, h); g.closePath(); g.fill();
  }, { key: 'env-quay-culvert', repeat: [1, 1], anisotropy: 4 });
}

// ---------------------------------------------------------------- bank frames
/** densified bank with per-vertex landward mitre normal (mx, mz), mitre scale k, arclength s and the segment's normal (nx, nz) / tangent (tx, tz) per segment.
 *  Anichkov keeps its original polygon-based gaps; explicit bridge sites insert
 *  their edge splits, including Belinsky on the Fontanka. */
function frames(bank, splits) {
  const pts = [];
  for (let i = 0; i < bank.pts.length; i++) {
    const p = bank.pts[i];
    if (i === 0) { pts.push([p[0], p[1]]); continue; }
    const q = bank.pts[i - 1], l = Math.hypot(p[0] - q[0], p[1] - q[1]), near = isNear(p[0], p[1]) || isNear(q[0], q[1]), max = near ? 9 : 120, n = Math.max(1, Math.ceil(l / max));
    for (let k = 1; k <= n; k++) pts.push([q[0] + (p[0] - q[0]) * k / n, q[1] + (p[1] - q[1]) * k / n]);
  }
  let P = pts;
  if (splits && splits.length) {
    const out = [P[0]];
    for (let i = 0; i + 1 < P.length; i++) {
      const a = P[i], b = P[i + 1], ts = [];
      for (const [px, pz, nx, nz] of splits) { const da = (a[0] - px) * nx + (a[1] - pz) * nz, db = (b[0] - px) * nx + (b[1] - pz) * nz; if ((da > 0.02 && db < -0.02) || (da < -0.02 && db > 0.02)) ts.push(da / (da - db)); }
      ts.sort((u, v) => u - v);
      for (const t of ts) out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      out.push(b);
    }
    P = out;
  }
  const n = P.length, seg = [];
  for (let i = 0; i + 1 < n; i++) {
    const dx = P[i + 1][0] - P[i][0], dz = P[i + 1][1] - P[i][1], l = Math.hypot(dx, dz) || 1e-6, tx = dx / l, tz = dz / l;
    seg.push({ tx, tz, nx: -tz * bank.landSide, nz: tx * bank.landSide, len: l });
  }
  const fr = []; let s = 0;
  for (let i = 0; i < n; i++) {
    const a = seg[Math.max(0, i - 1)], b = seg[Math.min(seg.length - 1, i)];
    let mx = a.nx + b.nx, mz = a.nz + b.nz; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = Math.min(2.2, 1 / Math.max(0.35, mx * b.nx + mz * b.nz));
    fr.push({ x: P[i][0], z: P[i][1], mx, mz, k, s });
    if (i < seg.length) s += seg[i].len;
  }
  return { fr, seg };
}
const at = (fr, seg, sv) => {                                   // point, tangent and landward normal at arclength sv
  let lo = 0, hi = fr.length - 2;                                // binary search: the last i (<= len - 2) with fr[i + 1].s >= sv, as the old linear scan found it
  while (lo < hi) { const mid = (lo + hi) >> 1; if (fr[mid + 1].s < sv) lo = mid + 1; else hi = mid; }
  const i = lo;
  const a = fr[i], b = fr[i + 1], sg = seg[i], t = Math.min(1, Math.max(0, (sv - a.s) / Math.max(1e-6, b.s - a.s)));
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, tx: sg.tx, tz: sg.tz, nx: sg.nx, nz: sg.nz };
};

function orientTri(B, a, b, c, nx, ny, nz) {
  const P = B.pos, ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2], vx = P[c * 3] - P[a * 3], vy = P[c * 3 + 1] - P[a * 3 + 1], vz = P[c * 3 + 2] - P[a * 3 + 2];
  if ((uy * vz - uz * vy) * nx + (uz * vx - ux * vz) * ny + (ux * vy - uy * vx) * nz >= 0) B.tri(a, b, c); else B.tri(a, c, b);
}
/** flat quad a b c d (any order that is a convex loop) facing the normal n */
function quadN(B, a, b, c, d, nx, ny, nz) { orientTri(B, a, b, c, nx, ny, nz); orientTri(B, a, c, d, nx, ny, nz); }
/** oriented box: centre (cx, cz), half-extent ht along the tangent (tx, tz) and hn along the landward normal, y0..y1; uv in metres */
function box(B, cx, cz, tx, tz, nx, nz, ht, hn, y0, y1, uvs = 1) {
  const C = (st, sn) => [cx + tx * st * ht + nx * sn * hn, cz + tz * st * ht + nz * sn * hn];
  const corners = [C(-1, -1), C(1, -1), C(1, 1), C(-1, 1)];
  const faces = [[0, 1, -nx, -nz], [1, 2, tx, tz], [2, 3, nx, nz], [3, 0, -tx, -tz]];
  for (const [i, j, fx, fz] of faces) {
    const p = corners[i], q = corners[j];
    const v0 = B.vert(p[0], y0, p[1], fx, 0, fz, (p[0] + p[1]) / uvs, y0 / uvs), v1 = B.vert(q[0], y0, q[1], fx, 0, fz, (q[0] + q[1]) / uvs, y0 / uvs);
    const v2 = B.vert(q[0], y1, q[1], fx, 0, fz, (q[0] + q[1]) / uvs, y1 / uvs), v3 = B.vert(p[0], y1, p[1], fx, 0, fz, (p[0] + p[1]) / uvs, y1 / uvs);
    quadN(B, v0, v1, v2, v3, fx, 0, fz);
  }
  const t = corners.map((p) => B.vert(p[0], y1, p[1], 0, 1, 0, p[0] / uvs, p[1] / uvs));
  quadN(B, t[0], t[1], t[2], t[3], 0, 1, 0);
  const u = corners.map((p) => B.vert(p[0], y0, p[1], 0, -1, 0, p[0] / uvs, p[1] / uvs));
  quadN(B, u[0], u[1], u[2], u[3], 0, -1, 0);
}

// ---------------------------------------------------------------- post geometries (origin = base centre, x along the wall; no bottom faces)
function boxMB(B, cx, y0, y1, hx, hz, cz = 0, top = true) {
  const c = [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]], nrm = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  for (let e = 0; e < 4; e++) {
    const p = c[e], q = c[(e + 1) % 4], [nx, nz] = nrm[e];
    const a = B.vert(cx + p[0], y0, cz + p[1], nx, 0, nz), b = B.vert(cx + q[0], y0, cz + q[1], nx, 0, nz), d = B.vert(cx + q[0], y1, cz + q[1], nx, 0, nz), f = B.vert(cx + p[0], y1, cz + p[1], nx, 0, nz);
    B.quad(a, f, d, b);
  }
  if (top) { const t = c.map((p) => B.vert(cx + p[0], y1, cz + p[1], 0, 1, 0)); B.quad(t[0], t[3], t[2], t[1]); }
}
function pyramidMB(B, y0, y1, hx0, hx1) {                          // a low truncated four-sided pyramid (cap)
  const b = [[-hx0, -hx0], [hx0, -hx0], [hx0, hx0], [-hx0, hx0]], t = [[-hx1, -hx1], [hx1, -hx1], [hx1, hx1], [-hx1, hx1]];
  for (let e = 0; e < 4; e++) {
    const j = (e + 1) % 4, mx = (b[e][0] + b[j][0]) / 2, mz = (b[e][1] + b[j][1]) / 2, l = Math.hypot(mx, mz) || 1, nx = mx / l * 0.8, nz = mz / l * 0.8, ny = 0.6;
    const a = B.vert(b[e][0], y0, b[e][1], nx, ny, nz), c = B.vert(b[j][0], y0, b[j][1], nx, ny, nz), d = B.vert(t[j][0], y1, t[j][1], nx, ny, nz), f = B.vert(t[e][0], y1, t[e][1], nx, ny, nz);
    B.quad(a, f, d, c);
  }
  const tp = t.map((p) => B.vert(p[0], y1, p[1], 0, 1, 0)); B.quad(tp[0], tp[3], tp[2], tp[1]);
}
function lathe(B, rings, seg, y0 = 0) {                              // rings: [[radius, y]...] bottom -> top, a closed 'seg'-sided drum
  let prev = null;
  for (let k = 0; k < rings.length; k++) {
    const [r, y] = rings[k], row = [];
    const dr = k + 1 < rings.length ? rings[k + 1][0] - r : r - rings[k - 1][0], dy = k + 1 < rings.length ? rings[k + 1][1] - y : y - rings[k - 1][1], nl = Math.hypot(dr, dy) || 1;
    for (let s = 0; s < seg; s++) { const a = s / seg * 6.2832, c = Math.cos(a), sn = Math.sin(a); row.push(B.vert(c * r, y + y0, sn * r, c * dy / nl, -dr / nl, sn * dy / nl)); }
    if (prev) for (let s = 0; s < seg; s++) { const s1 = (s + 1) % seg; B.quad(prev[s], prev[s1], row[s1], row[s]); }
    prev = row;
  }
  const [r, y] = rings[rings.length - 1], tp = []; for (let s = 0; s < seg; s++) { const a = s / seg * 6.2832; tp.push(B.vert(Math.cos(a) * r, y + y0, Math.sin(a) * r, 0, 1, 0)); }
  for (let s = 1; s + 1 < seg; s++) B.tri(tp[0], tp[s + 1], tp[s]);
}
/** the monolithic Neva parapet roll: the profile [offset landward, y] swept along the wall (sections of 2.2 m) */
const PARAPET_ROLL = [[0, 0.0], [0, 0.6], [0.1, 0.86], [0.26, 0.99], [0.44, 1.04], [0.62, 0.99], [0.78, 0.86], [0.88, 0.6], [0.88, 0.17]];
function postGeometry(kind) {
  const B = new MeshBuilder();
  if (kind === 'pyramid') {                                          // Fontanka: body 0.45 x 1.0, cap slab 0.52, low pyramid
    boxMB(B, 0, -0.03, 0.97, 0.225, 0.225, 0, false); boxMB(B, 0, 0.97, 1.04, 0.26, 0.26); pyramidMB(B, 1.04, 1.17, 0.3, 0.17);
  } else if (kind === 'twostep' || kind === 'tube') {               // canals: body, a wider cap slab, a smaller block on it (two-step moulded cap)
    const w = kind === 'tube' ? 0.275 : 0.25, H = kind === 'tube' ? 1.15 : 1.1;
    boxMB(B, 0, -0.03, H - 0.2, w, w, 0, false); boxMB(B, 0, H - 0.2, H - 0.1, w + 0.06, w + 0.06, 0, true); boxMB(B, 0, H - 0.1, H, w * 0.9, w * 0.9, 0, true);
  } else if (kind === 'moika') {                                     // rose-red post 0.45 x 0.98, two-step cap
    boxMB(B, 0, -0.03, 0.8, 0.225, 0.225, 0, false); boxMB(B, 0, 0.8, 0.9, 0.27, 0.27, 0, true); boxMB(B, 0, 0.9, 0.98, 0.2, 0.2, 0, true);
  } else if (kind === 'ballpost') {                                   // Swan Canal / Mars Field side (photo 13): square cast post 0.15 with a collar block where the tubes meet and a big ball on a neck
    boxMB(B, 0, -0.1, 0.8, 0.075, 0.075, 0, false); boxMB(B, 0, 0.34, 0.5, 0.105, 0.105, 0, true); boxMB(B, 0, 0.8, 0.85, 0.095, 0.095, 0, true);
    lathe(B, [[0.045, 0.85], [0.07, 0.87], [0.1, 0.9], [0.115, 0.96], [0.1, 1.02], [0.07, 1.05], [0.03, 1.065]], 10);
  } else if (kind === 'trellis') {                                    // thin green posts of the garden trellis
    boxMB(B, 0, -0.1, 1.98, 0.03, 0.03, 0, true);
  } else if (kind === 'bigpost') {                                    // Fontanka garden bank (photo 150): big pink rapakivi post 0.55 x 0.55, 1.15 high, chamfered cap
    boxMB(B, 0, -0.03, 0.98, 0.275, 0.275, 0, false); boxMB(B, 0, 0.98, 1.06, 0.3, 0.3, 0, true); pyramidMB(B, 1.06, 1.2, 0.27, 0.15);
  } else if (kind === 'pylon') {                                     // Winter Canal: round drum 0.45 x 0.95, thin base ring, flat cap
    lathe(B, [[0.25, -0.03], [0.225, 0.05], [0.225, 0.86], [0.27, 0.9], [0.27, 0.95]], 8);
  }
  return B.build();
}
function corbelGeometry() {                                          // bell-shaped granite corbel under a pylon (half cone projecting from the wall)
  const B = new MeshBuilder(); const seg = 6, rings = [[0.1, -0.62], [0.2, -0.4], [0.32, -0.12], [0.36, -0.02]];
  let prev = null;
  for (let k = 0; k < rings.length; k++) {
    const row = []; const [r, y] = rings[k];
    for (let s = 0; s <= seg; s++) { const a = -Math.PI / 2 + s / seg * Math.PI, c = Math.cos(a), sn = Math.sin(a); row.push(B.vert(sn * r * 0.9, y, -c * r * 1.25 + 0.0, sn * 0.8, 0.2, -c * 0.8)); }
    if (prev) for (let s = 0; s < seg; s++) B.quad(prev[s], prev[s + 1], row[s + 1], row[s]);
    prev = row;
  }
  return B.build();
}


/** An InstancedMesh whose instances are re-packed from a camera-distance test: only the items within `R` metres of the camera exist for the GPU (re-packed when the camera has moved 14 m).
 *  items: Float32Array of n 4x4 matrices (column-major) [+ n x 3 colours]; every instance starts visible (the static triangle count stays honest), the first update trims it. */
function culledInstances(ctx, T, root, geometry, material, mats, cols, R, name, opts = {}) {
  const n = mats.length / 16, im = new T.InstancedMesh(geometry, material, n);
  im.instanceMatrix.setUsage(T.DynamicDrawUsage); im.instanceMatrix.array.set(mats); im.instanceMatrix.needsUpdate = true;
  if (cols) { im.setColorAt(0, new T.Color(1, 1, 1)); im.instanceColor.setUsage(T.DynamicDrawUsage); im.instanceColor.array.set(cols); im.instanceColor.needsUpdate = true; }
  // Bound the complete immutable source before distance packing shortens the active prefix.
  im.computeBoundingSphere(); im.userData.dynamic = true;
  im.castShadow = opts.castShadow !== false; im.receiveShadow = !!opts.receiveShadow; im.name = name;
  if (opts.noOutline) ctx.noOutline(im);
  root.add(im);
  const px = new Float32Array(n), pz = new Float32Array(n); for (let i = 0; i < n; i++) { px[i] = mats[i * 16 + 12]; pz[i] = mats[i * 16 + 14]; }
  let lx = 1e9, lz = 1e9;
  const pack = (cx, cz) => {
    const A = im.instanceMatrix.array; let k = 0; const R2 = R * R, C = im.instanceColor ? im.instanceColor.array : null;
    for (let i = 0; i < n; i++) { const dx = px[i] - cx, dz = pz[i] - cz; if (dx * dx + dz * dz > R2) continue; A.set(mats.subarray(i * 16, i * 16 + 16), k * 16); if (C) { C[k * 3] = cols[i * 3]; C[k * 3 + 1] = cols[i * 3 + 1]; C[k * 3 + 2] = cols[i * 3 + 2]; } k++; }
    im.count = k; im.visible = k > 0; im.instanceMatrix.needsUpdate = true; if (C) im.instanceColor.needsUpdate = true; lx = cx; lz = cz;
  };
  ctx.onUpdate(() => { const p = ctx.camera.position; if (Math.hypot(p.x - lx, p.z - lz) > 14) pack(p.x, p.z); });
  return im;
}

// ---------------------------------------------------------------- which railing
function railStyle(key, bank, x, z, nx, s, nz = 0) {
  if (key === 'neva') return null;      // the Neva has the monolithic granite parapet roll, no iron railing
  if (key === 'fontanka' && z < -1075) return nx > 0 ? 'loops' : 'arcade';   // north of the Moika source (docs/research/mars-bridges-canals.md section 3): east / Kutuzov bank = stadium loops, garden bank = pointed-arch band
  if (key === 'moika' && z < -900 && x > -1075 && x < -870 && nz < -0.5) return null;   // north bank at the Summer Garden: the garden's own Charlemagne fence (landmarksGarden) stands here; the wall keeps its collider
  if (key === 'fontanka') { const h = hash2(Math.floor(s / 60), bank.idx, 17); return h < 0.6 ? 'lattice' : h < 0.85 ? 'clover' : 'bars'; }
  if (key === 'griboedov') {
    const west = nx < -0.3, east = nx > 0.3;
    if (west && z > -345 && z < -85) return 'tube';                  // the Kazan stretch: granite posts + one steel tube
    if (east && z > -335 && z < -225) return 'loops';
    if (z > -10 && z < 170) return 'loops';
    return 'vase';
  }
  if (key === 'moika') return x > -1000 ? 'vase' : 'moika';
  if (key === 'winter-canal') return 'lancet';
  return 'vase';
}
const POST = { fontanka: 'pyramid', griboedov: 'twostep', moika: 'moika', 'winter-canal': 'pylon', 'swan-canal': 'twostep', neva: null };
const RAIL_H = { lattice: 0.88, clover: 0.88, bars: 1.0, vase: 1.0, loops: 1.02, moika: 1.0, lancet: 0.85, arcade: 0.95, trellis: 1.9 };
const POST_TONES = {
  fontanka: (t) => (t < 0.12 ? '#a58274' : t < 0.45 ? '#a89a96' : '#b2a5a0'),
  griboedov: (t) => (t < 0.3 ? '#a8968e' : t < 0.65 ? '#9d928c' : '#b0a098'),            // grey granite with a faint pink cast (photos refs/canals 76, 84)
  moika: (t) => (t < 0.4 ? '#9c6e66' : t < 0.75 ? '#a67a70' : '#92665e'),               // rust-rose granite (photo 95)
  'winter-canal': (t) => (t < 0.5 ? '#aa9490' : '#b8a39e'),
  'swan-canal': (t) => (t < 0.5 ? '#a8968e' : '#9d928c'),
  ballpost: () => '#24282c', trellis: () => '#3f7a3c', bigpost: (t) => (t < 0.5 ? '#b08c7c' : '#a98476'),
};

export function buildQuay(ctx, root) {
  const T = ctx.THREE || THREE;
  const P = ctx.palette || {};
  const deck = deckPoly();
  const inAnichkov = (x, z) => !!deck && (pointInRing(x, z, deck) || distToRing(x, z, deck) < 1.2);
  const zones = bridgeZones();
  const info = { segments: [], stairs: [], allStairs: [], rings: 0, signs: 0, posts: 0, panels: 0, colliders: 0, deckPieces: 0, culverts: 0, tubes: 0, fallbackDecks: 0 };
  const face = {}, faceDeck = {}, coping = {}, parapet = new MeshBuilder(), granite = new MeshBuilder(), graniteA = new MeshBuilder(), graniteB = new MeshBuilder(), graniteR = new MeshBuilder(), graniteP = new MeshBuilder(), descents = [], lionSpots = [];
  const keys = Object.keys(WATERWAYS);
  const grass = new MeshBuilder(), capB = new MeshBuilder(), slopeInfo = [];
  for (const k of keys) { face[k] = new MeshBuilder(); faceDeck[k] = new MeshBuilder(); coping[k] = new MeshBuilder(); }
  const rings = [], signs = [], culverts = [], corbels = [];
  // THE BREAKABLE FENCE (docs/AREAS.md 13.7, the world rule "water is reachable"): every post, panel and tube of a railing, every section of the Neva parapet and every cheek wall of a descent is a BAY of lib/fence-bays.js: its own
  // thin collider + its instances + one knock record (a car above the break speed breaks the bay off, the gap is passable). A railing bay is the span between two posts and the post at its end (a post that no span ends at stands alone
  // as a one-post bay). Where no fence is drawn there is no collider: the quay edge is open (a walker steps off it, a car drives off it).
  const bays = [], parapetBays = [], cheekBays = [], pierBays = [], postPts = [], openStairs = [];
  const addBay = (b) => { bays.push(b); postPts.push([b.x1, b.z1]); return b; };
  const postTone = (kind, key, t, x, z) => new THREE.Color((POST_TONES[kind] || POST_TONES[key] || POST_TONES.griboedov)(t)).multiplyScalar(0.92 + 0.14 * hash2(Math.round(x * 3), Math.round(z * 3), 9));
  // the Palace Bridge deck rectangle (bridges/palace.js frame: cx -2339.5, cz -875, bearing 323.5, u 0..254.5, half width ~14.2): the OSM water-polygon seam runs along the abutment line (u ~ 1.5)
  // across the whole deck, so the zone gap (a rectangle centred beside the deck) misses it: whatever piece has its midpoint inside the deck is a gap too
  const PAL = { cx: -2339.5, cz: -875.0, T: (323.5 - 90) * Math.PI / 180, hw: 14.5, u0: -1, u1: 255.5 };
  const inPalaceDeck = (x, z) => { const dx = x - PAL.cx, dz = z - PAL.cz, c = Math.cos(PAL.T), s = Math.sin(PAL.T), u = dx * c + dz * s, v = -dx * s + dz * c; return Math.abs(v) <= PAL.hw && u >= PAL.u0 && u <= PAL.u1; };
  const TRIPLE = new Set(['teatralny', 'malo-konyushenny']);
  // start-up: gapAt / nearBridge run for every piece of every bank; the zones sit on a 64 m grid (each registered in the cells within its radius + 60 m), so a point only visits the zones that
  // can satisfy the distance test below (the tests are the same; any zone that passes answers true, so the order of the candidates does not matter)
  const ZC = 64, zoneGrid = new Map(), zkey = (i, j) => i * 100003 + j;
  for (const zn of zones) { if (zn.id === 'anichkov') continue; const R = zn.w / 2 + zn.len / 2 + 60 + 1; for (let i = Math.floor((zn.c[0] - R) / ZC); i <= Math.floor((zn.c[0] + R) / ZC); i++) for (let j = Math.floor((zn.c[1] - R) / ZC); j <= Math.floor((zn.c[1] + R) / ZC); j++) { const k = zkey(i, j); let l = zoneGrid.get(k); if (!l) zoneGrid.set(k, (l = [])); l.push(zn); } }
  const NOZ = [], zonesAt = (x, z) => zoneGrid.get(zkey(Math.floor(x / ZC), Math.floor(z / ZC))) || NOZ;
  const gapAt = (key, x, z) => {
    if (key === 'fontanka' && inAnichkov(x, z)) return true;
    if (key === 'neva' && inPalaceDeck(x, z)) return true;
    const zl = zonesAt(x, z);
    for (let q = 0; q < zl.length; q++) { const zn = zl[q]; if ((zn.key === key || zn.key === '*') && Math.hypot(x - zn.c[0], z - zn.c[1]) < zn.w / 2 + zn.len / 2 + 40 && zn.test(x, z, TRIPLE.has(zn.id) ? 1.6 : 0.03)) return true; }       // Triple Bridge: the short curved corner pieces of the Griboyedov / Moika corner open too
    return false;
  };

  // streets are built after the environment (no net here): a post, rail or plate whose spot lies in the layout carriageway of a drivable road (+ 0.3 m for the parking pocket / fillet the net adds) is left out (roads that run on the coping, bridge approaches without a deck zone)
  // Primary roads get 1.6 m: the net widens their junction mouths by a fillet (up to ~1.5 m) that the layout does not know (Sadovaya at the 1-y Sadovy bridge).
  const onRoad = (x, z, m = 0.3) => ctx._roadPlan ? ctx._roadPlan.cover(x,z,{}) >= -m || mergedMedianAt(ctx,x,z) : L.roadsNear(x, z, Math.max(m, 1.6), { drivable: true }).some((h) => h.gap <= (h.road.hw === 'primary' ? Math.max(m, 1.6) : m));

  const nearBridge = (key, x, z, m) => { const zl = zonesAt(x, z); for (let q = 0; q < zl.length; q++) { const zn = zl[q]; if (Math.hypot(x - zn.c[0], z - zn.c[1]) < zn.w / 2 + zn.len / 2 + 60 && zn.test(x, z, m)) return true; } return false; };
  // stair sites per waterway: Fontanka = the OSM pier polygons + the Fontanka 44 pier of the research (as before); the others = OSM steps ways that run along a bank + piers
  const bankDist = (banks, x, z) => { let best = 1e9; for (const b of banks) for (let i = 0; i + 1 < b.pts.length; i++) { const a = b.pts[i], c = b.pts[i + 1], dx = c[0] - a[0], dz = c[1] - a[1], l2 = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)); best = Math.min(best, Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z)); } return best; };
  // bankDist(...) < lim without the full minimum: true at the first segment nearer than lim (the same distance expression); a segment whose box is lim or more away on one axis cannot be nearer
  const bankNear = (banks, x, z, lim) => { for (const b of banks) { const pts = b.pts; for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], c = pts[i + 1]; if ((a[0] - x >= lim && c[0] - x >= lim) || (x - a[0] >= lim && x - c[0] >= lim) || (a[1] - z >= lim && c[1] - z >= lim) || (z - a[1] >= lim && z - c[1] >= lim)) continue; const dx = c[0] - a[0], dz = c[1] - a[1], l2 = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)); if (Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z) < lim) return true; } } return false; };
  const sitesOf = {};
  for (const k of keys) sitesOf[k] = [];
  for (const p of PIERS) for (const poly of p.polys) { const n = poly.o.length / 2; let cx = 0, cz = 0; for (let i = 0; i < n; i++) { cx += poly.o[i * 2]; cz += poly.o[i * 2 + 1]; } cx /= n; cz /= n; if (L.claimedBy(p.id)) continue; for (const k of keys) if (bankNear(waterBanks(k), cx, cz, 28)) { sitesOf[k].push({ x: cx, z: cz, w: 1.7, src: 'pier' }); break; } }
  sitesOf.fontanka.push({ x: -420, z: -5, w: 1.7, src: 'research' });
  for (const s of STEPS) {
    const p = s.pts; if (p.length < 4) continue;
    const mx = (p[0] + p[p.length - 2]) / 2, mz = (p[1] + p[p.length - 1]) / 2;
    if (!L.inExtent(mx, mz, 4)) continue;                  
    for (const k of keys) {
      if (k === 'fontanka') continue;
      const bs = waterBanks(k);
      if (bankNear(bs, p[0], p[1], 3.6) && bankNear(bs, p[p.length - 2], p[p.length - 1], 3.6) && Math.hypot(p[0] - p[p.length - 2], p[1] - p[p.length - 1]) > 1.5 && (s.count === undefined || s.count >= 5)) { sitesOf[k].push({ x: mx, z: mz, w: k === 'neva' ? 2.2 : 1.7, src: 'steps', count: s.count }); break; }
    }
  }

  { // the Palace Pier (Lions Descent): the descent nearest to the middle of the OSM relation r11489271 is the wide one with the two lions
    let best = null; for (const st of sitesOf.neva) { const dd = Math.hypot(st.x + 2373, st.z + 836); if (!best || dd < best.dd) best = { st, dd }; }
    if (best && best.dd < 60) best.st.big = true;
  }
  /** One descent of a canal / Neva bank: the GATE (a flush landing in the parapet line with cheek walls), the FLIGHT along the wall face (solid granite from the wall foot, a stepped cheek
   *  wall on the water side) and the LOWER LANDING 0.22 m above the water with an apron step. Inside PLAY it is walkable: walk boxes for the landings and stairs, solid barriers on the
   *  water side and at both ends (the quay collider is cut along the gate and thinned along the flight: see segKind). */
  function buildDescent(d) {
    const { p0, t, n, Wd, N, rise, flight, end, key, wl } = d, YBk = yBot(key), play = L.inPlay(p0.x, p0.z, -5);
    const bx = (u0, u1, v0, v1, y0, y1, B) => { const uc = (u0 + u1) / 2, vc = (v0 + v1) / 2; box(B, p0.x + t[0] * uc - n[0] * vc, p0.z + t[1] * uc - n[1] * vc, t[0], t[1], n[0], n[1], (u1 - u0) / 2, (v1 - v0) / 2, y0, y1, 2); };
    const P = (u, v) => [p0.x + t[0] * u - n[0] * v, p0.z + t[1] * u - n[1] * v];
    const top = DS.topY, gA = DS.gateA, gB = DS.gateB, lowY = wl + 0.22, uL = gB + flight, uE = uL + DS.low;
    /** a breakable cheek bay along the descent from u0 to u1 at v (out from the wall face), th thick, from y to y + h */
    const cheek = (u0, u1, v, th, y, h) => { const a = P(u0, v), b = P(u1, v); cheekBays.push({ x0: a[0], z0: a[1], x1: b[0], z1: b[1], y, h, th, key }); };
    bx(-gA, gB, -0.05, Wd, YBk, top, graniteA);                              // the top landing, flush with the pavement
    if (play) cheek(-gA, gB, Wd - 0.15, 0.3, top, 0.98 - top);               // its outer parapet: a breakable bay (a descent outside the play area keeps the drawn block)
    else bx(-gA, gB, Wd - 0.3, Wd, top, 0.98, graniteR);
    if (play) { const a = P(-gA + 0.2, -0.05), b = P(-gA + 0.2, Wd); cheekBays.push({ x0: a[0], z0: a[1], x1: b[0], z1: b[1], y: top, h: 1.04 - top, th: 0.4, key }); }      // the back cheek (a breakable bay across the gate side)
    else bx(-gA, -gA + 0.4, -0.05, Wd, top, 1.04, graniteR);
    if (key === 'neva') { for (const [a0, a1] of [[-gA, -gA + 0.55], [gB - 0.55, gB]]) { bx(a0, a1, -1.0, -0.02, 0, 1.12, graniteR); bx(a0 - (a0 < 0 ? 0.04 : -0.04) * 0, a1, -1.04, 0.02, 1.12, 1.22, graniteR); } }      // the cut ends of the parapet roll
    else {                                                                   // an end post of the railing on each side of the gate (unless the regular rhythm has one there already)
      for (const u of [-gA - 0.3, gB + 0.3]) {
        const [x, z] = P(u, -0.26);
        let near = false; for (const q of postPts) if (Math.hypot(q[0] - x, q[1] - z) < 1.0) near = true;
        if (!near && POST[key] && !onRoad(x, z)) addBay({ x0: x, z0: z, x1: x + t[0] * 0.001, z1: z + t[1] * 0.001, nx: n[0], nz: n[1], key, y: Y_TOP, post: { kind: POST[key], col: postTone(POST[key], key, hash2(Math.round(x), Math.round(z), 5), x, z), y: Y_TOP - 0.03 }, stub: true });      // (a one-post bay: the yaw of the post follows the wall)
      }
    }
    for (let k = 0; k < N; k++) {                                            // the flight: tread blocks (alternating tone) with the stepped cheek wall on the water side
      const u0 = gB + k * DS.run, ty = top - rise * (k + 1);
      bx(u0, u0 + DS.run, -0.05, Wd, YBk, ty, k % 2 ? graniteB : graniteA);
      if (!play) bx(u0, u0 + DS.run, Wd - 0.28, Wd, ty, ty + 0.9, graniteR);
    }
    if (play) for (let k = 0; k < N; k += 4) {                                // the cheek wall of the flight, one breakable bay per four steps (its top = 0.9 m over the highest tread of the group)
      const k1 = Math.min(N - 1, k + 3), tyHi = top - rise * (k + 1), tyLo = top - rise * (k1 + 1);
      cheek(gB + k * DS.run, gB + (k1 + 1) * DS.run, Wd - 0.14, 0.28, tyLo, tyHi + 0.9 - tyLo);
    }
    bx(uL, uE, -0.05, Wd, YBk, lowY, graniteA);                              // the lower landing
    bx(uE, uE + 0.4, -0.05, Wd, YBk, wl - 0.02, graniteB);                   // the apron step (just under the water line)
    bx(uL, uE, Wd - 0.2, Wd, lowY, lowY + 0.1, graniteR);                    // a low kerb on its water side
    if (d.big) {                                                             // the Lions Descent: a red-granite pedestal with a copper lion on each side of the gate, facing each other
      const pedL = 3.4, pedD = 2.4, h = 2.2;
      for (const side of [-1, 1]) {
        const u0 = side < 0 ? -gA - pedL : gB, u1 = u0 + pedL, fx = -side * t[0], fz = -side * t[1], c = P((u0 + u1) / 2, -pedD / 2);
        bx(u0 - 0.1, u1 + 0.1, -pedD - 0.1, 0.07, 0, 0.4, graniteP);          // the stepped base
        bx(u0 + 0.05, u1 - 0.05, -pedD + 0.05, 0.05, 0.4, h, graniteP);       // the shaft (its water face stands 5 cm proud of the wall line: no coplanar faces with the parapet)
        bx(u0, u1, -pedD, 0.1, h, h + 0.22, graniteP);                       // the cornice
        lionSpots.push({ x: c[0], y: h + 0.22, z: c[1], yaw: Math.atan2(-fz, fx) });
        if (play) { ctx.physics.addBox(c[0], c[1], pedL + 0.2, pedD + 0.2, Math.atan2(-t[1], t[0]), -1, h + 1.6); info.colliders++; }
      }
    }
    if (play) {
      const rot = Math.atan2(-t[1], t[0]);
      let c = P((gB - gA) / 2, (Wd - 0.4) / 2); ctx.physics.addWalkBox(c[0], c[1], gA + gB, Wd + 0.4, rot, top, -8);
      c = P(gB + flight / 2, Wd / 2); ctx.physics.addStairs(c[0], c[1], Wd, flight, Math.atan2(t[0], t[1]), top, lowY, N);
      c = P(uL + DS.low / 2, Wd / 2); ctx.physics.addWalkBox(c[0], c[1], DS.low, Wd, rot, lowY, -8);
      d.rot = rot; d.play = true; info.colliders += 3;                         // the barriers (outer edge, back, end) come in finishDescent once a pier may be attached
    }
    const e = P(uE, Wd / 2);
    const st = { x: p0.x, z: p0.z, tx: t[0], tz: t[1], nx: n[0], nz: n[1], bank: d.bank.name, key, length: uE, landingY: lowY, w: Wd, steps: N, walk: play, endX: e[0], endZ: e[1], topY: top };
    info.allStairs.push(st); d.stair = st;
  }


  /** A pier (OSM landing stage) beside the lower landing of a descent: the pontoon is moved so that its long side runs along the wall from the end of the landing (a 0.4 m gap to the
   *  wall), the walker steps from the landing onto its deck. boats.js draws it from quay.pierOverride. */
  const pierPool = pierRects().map((r) => ({ ...r, used: false }));
  const pierOverride = {};
  function attachPier(d) {
    if (!d.play) return;
    const { p0, t, n, Wd, key, wl } = d, uE = d.end;
    const P = (u, v) => [p0.x + t[0] * u - n[0] * v, p0.z + t[1] * u - n[1] * v];
    const e = P(uE, Wd / 2);
    let cand = null;
    for (const q of pierPool) { if (q.used || q.key !== key) continue; const dd = Math.hypot(q.cx - e[0], q.cz - e[1]); if (dd < 55 && (!cand || dd < cand.dd)) cand = { q, dd }; }
    if (!cand) return;
    const long0 = Math.max(cand.q.len, cand.q.wid), short0 = Math.min(cand.q.len, cand.q.wid);
    const wid = Math.max(2.4, Math.min(short0, key === 'neva' ? 12 : key === 'winter-canal' ? 2.4 : 3.8));
    const u0 = uE + 0.15, v0 = 0.4;
    for (let L = Math.min(long0, key === 'neva' ? 60 : 16); L >= 5; L *= 0.85) {
      let ok = true;
      const samples = []; for (let a = 0; a <= L + 1e-6; a += 2) for (const vv of [0, 0.5, 1]) samples.push([a / L, vv]); samples.push([1, 0], [1, 0.5], [1, 1]);
      for (const [uu, vv] of samples) {
        const [x, z] = P(u0 + L * uu, v0 + wid * vv + (vv ? 0.5 : 0));
        if (L2.waterwayAt(x, z) !== key || nearBridge(key, x, z, 3) || onRoad(x, z, .6)) { ok = false; break; }
        for (const o of descents) { if (o === d || o.key !== key) continue; const w2 = { u: (x - o.p0.x) * o.t[0] + (z - o.p0.z) * o.t[1], v: -((x - o.p0.x) * o.n[0] + (z - o.p0.z) * o.n[1]) }; if (w2.u > -DS.gateA - 1.5 && w2.u < o.end + 1.5 && w2.v > -1.5 && w2.v < o.Wd + 1.5) { ok = false; break; } }
        if (!ok) break;
      }
      if (!ok) continue;
      const c = P(u0 + L / 2, v0 + wid / 2);
      cand.q.used = true; pierOverride[cand.q.id] = { cx: c[0], cz: c[1], ax: t[0], az: t[1], len: L, wid };
      d.pier = { cx: c[0], cz: c[1], len: L, wid, u0, v0, y: wl + 0.32, id: cand.q.id };
      if (d.stair) d.stair.pier = d.pier;
      return;
    }
  }
  /** the barriers of a descent and the deck of its pier. WATER IS REACHABLE (docs/AREAS.md 13.7): the invisible walls of before (the water side of the whole descent, the end of the lower landing, the far end and the wall side of a pier)
   *  are gone: the lower landing and the pier end are OPEN to the water. What stands is drawn and breakable: the cheek bays of buildDescent (the outer parapet and the stepped wall of the flight), the back cheek (a wall,
   *  not facing the water) is a breakable bay too, and a pier's white railing along the water side (pierBays: a rail of two tubes and posts per 2.4 m bay, built with the other bays below). */
  function finishDescent(d) {
    if (!d.play) return;
    const { p0, t, n, Wd, wl, rot } = d, gA = DS.gateA;
    const P = (u, v) => [p0.x + t[0] * u - n[0] * v, p0.z + t[1] * u - n[1] * v];
    const box2 = (u0, u1, v0, v1, y1, y0 = -9) => { const c = P((u0 + u1) / 2, (v0 + v1) / 2); ctx.physics.addBox(c[0], c[1], u1 - u0, v1 - v0, rot, y0, y1); info.colliders++; };
    const pr = d.pier;
    if (!pr) return;
    const top = pr.y, U0 = pr.u0, U1 = pr.u0 + pr.len, V1 = pr.v0 + pr.wid;
    const c = P((U0 + U1) / 2, (pr.v0 + V1) / 2); ctx.physics.addWalkBox(c[0], c[1], pr.len, pr.wid, rot, top, -8); info.colliders++;
    const nb = Math.max(1, Math.round((pr.len - 0.2) / 2.4));                                  // the railing along the water side, from end to end of the deck
    for (let i = 0; i < nb; i++) {
      const a = P(U0 + 0.1 + (pr.len - 0.2) * i / nb, V1 - 0.08), b = P(U0 + 0.1 + (pr.len - 0.2) * (i + 1) / nb, V1 - 0.08);
      pierBays.push({ x0: a[0], z0: a[1], x1: b[0], z1: b[1], y: top, key: d.key, last: i === nb - 1 });
    }
  }
  const banks = [...waterBanks(), ...farBanks()];
  banks.forEach((bank, bi) => {
    const key = bank.key, W = WATERWAYS[key], YB = yBot(key), TH = tileH(key);
    // the order number of the chain: frozen for the chains of the older areas (bank-index.js), a position hash for every other chain: never the running index (it shifts with every new water polygon)
    { const k = key + ':' + Math.round(bank.pts[0][0]) + ':' + Math.round(bank.pts[0][1]); bank.idx = k in BANK_INDEX ? BANK_INDEX[k] : 100 + Math.floor(hash2(Math.round(bank.pts[0][0]), Math.round(bank.pts[0][1]), 71) * 400); }
    void bi;
    // Split at explicit deck edges so a 9 m quay collider cannot cover a sidewalk.
    // Anichkov retains its established polygon-based gap and densification.
    const splits = [];
    // the box of the chain: a zone whose centre is R or more from the box has no chain point within R (the point tests below are the ones of before)
    let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9; for (const p of bank.pts) { if (p[0] < bx0) bx0 = p[0]; if (p[0] > bx1) bx1 = p[0]; if (p[1] < bz0) bz0 = p[1]; if (p[1] > bz1) bz1 = p[1]; }
    const boxFar = (cx, cz, R) => Math.max(bx0 - cx, cx - bx1, 0) >= R || Math.max(bz0 - cz, cz - bz1, 0) >= R;
    for (const zn of zones) {
      if (zn.key !== key || zn.id === 'anichkov' || zn.auto) continue;
      if (boxFar(zn.c[0], zn.c[1], zn.w / 2 + zn.len / 2 + 60)) continue;
      let near = false; for (const p of bank.pts) if (Math.hypot(p[0] - zn.c[0], p[1] - zn.c[1]) < zn.w / 2 + zn.len / 2 + 60) { near = true; break; }
      if (!near) continue;
      if (zn.site) { const s = zn.site, a = (s.b - 90) * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a), g = zn.foot ? 0.8 : 0; for (const v of [s.v0 - g, s.v1 + g]) { splits.push([s.cx - v * sn, s.cz + v * c, -sn, c]); } }
      else { const a = zn.axis * Math.PI / 180, ux = Math.sin(a), uz = -Math.cos(a); for (const v of [-zn.w / 2, zn.w / 2]) splits.push([zn.c[0] + (-uz) * v, zn.c[1] + ux * v, -uz, ux]); }
    }
    if (key === 'neva') {                                              // cut the seam pieces at the Palace Bridge deck edges so only the part under the deck is a gap (the far abutment seam is 66 m long)
      const uv = (x, z) => { const dx = x - PAL.cx, dz = z - PAL.cz; return [dx * Math.cos(PAL.T) + dz * Math.sin(PAL.T), -dx * Math.sin(PAL.T) + dz * Math.cos(PAL.T)]; };
      if (bank.pts.some((p) => { const [u, v] = uv(p[0], p[1]); return Math.abs(v) <= 60 && u >= -10 && u <= 265; })) for (const v of [-PAL.hw, PAL.hw]) splits.push([PAL.cx - v * Math.sin(PAL.T), PAL.cz + v * Math.cos(PAL.T), -Math.sin(PAL.T), Math.cos(PAL.T)]);
    }
    // grass-slope stretches of this bank (waterways.js slopeRuns): the wall pieces are cut at their ends
    const sRuns = slopeRuns().filter((r) => r.bank === bank);
    const inRunS = (sv) => sRuns.some((r) => sv >= r.s0 - 0.05 && sv <= r.s1 + 0.05);
    for (const r of sRuns) {
      const n = r.pts.length - 1, t0 = [r.pts[1][0] - r.pts[0][0], r.pts[1][1] - r.pts[0][1]], t1 = [r.pts[n][0] - r.pts[n - 1][0], r.pts[n][1] - r.pts[n - 1][1]], l0 = Math.hypot(...t0) || 1, l1 = Math.hypot(...t1) || 1;
      splits.push([r.pts[0][0], r.pts[0][1], t0[0] / l0, t0[1] / l0], [r.pts[n][0], r.pts[n][1], t1[0] / l1, t1[1] / l1]);
    }
    // descents (walkable stair flights) of this bank: planned on a first frames pass, then the wall pieces are cut at the gate / flight / landing ends
    const mine = [];
    if (key !== 'fontanka' && key !== 'moat' && !bank.far) {
      const pre = frames(bank, null), pf = pre.fr, ps = pre.seg, ptotal = pf[pf.length - 1].s;
      const siteList = (sitesOf[key] || []).slice().sort((a, b) => (a.src === 'steps' ? 0 : 1) - (b.src === 'steps' ? 0 : 1));
      // The dead-end walls at the data margin (bank.caps, waterways.js) stitch the two banks of a canal into ONE chain; the planner treats each STRETCH between two walls as a chain of its own, as it was when every bank was
      // one: a pier / steps site within 28 m of both banks (the canals are about 19 m wide) gets a descent on each bank (the nearest point of each stretch), and the stretches go in the order of the full city's chains
      // (the last first: the stitched chain starts on the other bank).
      const caps = bank.caps || [], secOf = (s) => { let k = 0; while (k < caps.length && caps[k] < s) k++; return k; };
      const bestsOf = (site, sec) => {
        let best = null;
        for (let i = 0; i + 1 < pf.length; i++) {
          const sg = ps[i], a = pf[i], t = Math.max(0, Math.min(sg.len, (site.x - a.x) * sg.tx + (site.z - a.z) * sg.tz)), d = Math.hypot(a.x + sg.tx * t - site.x, a.z + sg.tz * t - site.z);
          if (secOf(a.s + t) === sec && (!best || d < best.d)) best = { d, s: a.s + t };
        }
        return best;
      };
      for (let sec = caps.length; sec >= 0; sec--) for (const site of siteList) {
        const best = bestsOf(site, sec);
        if (!best || best.d > 28) continue;
        const why = {};
        const Wd = descentWidth(key, site), drop = DS.topY - (lvl(key) + 0.22), N = Math.max(6, Math.ceil(drop / DS.rise)), rise = drop / N, flight = N * DS.run, end = DS.gateB + flight + DS.low;
        let chosen = null;
        for (const sh of [0, 2.5, -2.5, 5, -5, 8, -8, 12, -12, 16, -16]) for (const dir of [1, -1]) {
          if (chosen) break;
          const s0 = best.s + sh, sA = dir > 0 ? s0 - DS.gateA - 0.5 : s0 - end - 0.5, sB = dir > 0 ? s0 + end + 0.5 : s0 + DS.gateA + 0.5;
          if (sA < 0 || sB > ptotal) { why.range = (why.range || 0) + 1; continue; }
          const p0 = at(pf, ps, s0); if (!isNear(p0.x, p0.z)) { why.near = (why.near || 0) + 1; continue; }
          let ok = true;
          for (let u = -DS.gateA - 0.4; u <= end + 0.4 && ok; u += 1.2) { const q = at(pf, ps, s0 + dir * u); if (gapAt(key, q.x, q.z) || nearBridge(key, q.x, q.z, 9) || q.tx * p0.tx + q.tz * p0.tz < 0.985 || inRunS(s0 + dir * u)) ok = false; }
          if (!ok) why.axis = (why.axis || 0) + 1;
          // Test the full final descent/barrier footprint, including its water
          // side and end. Testing the bank axis alone misses skew bridge mouths
          // and carriageways that approach behind the lower landing.
          for (let u=-DS.gateA-.6; u<=end+.6 && ok; u+=.6) for (let v=-.3; v<=Wd+.6 && ok; v+=.6) {
            const x=p0.x+p0.tx*dir*u-p0.nx*v, z=p0.z+p0.tz*dir*u-p0.nz*v;
            if(onRoad(x,z,.6)) {ok=false;why.road=(why.road||0)+1;}
          }
          if (ok && descents.some((q) => Math.hypot(q.p0.x - p0.x, q.p0.z - p0.z) < 24)) { ok = false; why.spacing = (why.spacing || 0) + 1; }
          if (ok) chosen = { key, bank, p0, t: [p0.tx * dir, p0.tz * dir], n: [p0.nx, p0.nz], dir, Wd, N, rise, flight, end, site, wl: lvl(key), big: !!site.big };
        }
        if (chosen) { mine.push(chosen); descents.push(chosen); } 
      }
      for (const d of mine) for (const u of [-DS.gateA, DS.gateB, d.end]) splits.push([d.p0.x + d.t[0] * u, d.p0.z + d.t[1] * u, d.t[0], d.t[1]]);
    }
    const { fr, seg } = frames(bank, splits), total = fr[fr.length - 1].s;
    // position of a point in a descent's frame: u along the flight (gate = [-gateA, gateB]), v out from the wall face
    const dUV = (d, x, z) => ({ u: (x - d.p0.x) * d.t[0] + (z - d.p0.z) * d.t[1], v: -((x - d.p0.x) * d.n[0] + (z - d.p0.z) * d.n[1]) });
    const inOpenGate = (x, z) => { for (const o of openStairs) { const q = dUV({ p0: o, t: [o.tx, o.tz], n: [o.nx, o.nz] }, x, z); if (Math.abs(q.u) <= o.gate && Math.abs(q.v) < 1.6) return true; } return false; };
    const inGate = (x, z, m = 0.4) => {
      for (const d of mine) { const q = dUV(d, x, z); if (q.u >= -DS.gateA - m && q.u <= DS.gateB + m && Math.abs(q.v) < 1.6) return true; }
      for (const o of openStairs) { const q = dUV({ p0: o, t: [o.tx, o.tz], n: [o.nx, o.nz] }, x, z); if (Math.abs(q.u) <= o.gate + m && Math.abs(q.v) < 1.6) return true; }      // the gap in the railing at a steppable Fontanka flight
      return false;
    };
    const segKind = seg.map((sg, i) => {                           // 1 = the gate of a descent (no parapet, no collider), 2 = its flight / lower landing (thin wall collider), 0 = ordinary wall
      const mx = (fr[i].x + fr[i + 1].x) / 2, mz = (fr[i].z + fr[i + 1].z) / 2;
      for (const d of mine) { const q = dUV(d, mx, mz); if (Math.abs(q.v) > 1.2) continue; if (q.u >= -DS.gateA - 0.05 && q.u <= DS.gateB + 0.05) return 1; if (q.u > DS.gateB && q.u <= d.end + 0.05) return 2; }
      return 0;
    });
    const segDeck = seg.map((sg, i) => { const mx = (fr[i].x + fr[i + 1].x) / 2, mz = (fr[i].z + fr[i + 1].z) / 2; return gapAt(key, mx, mz) || (key === 'fontanka' && inAnichkov(fr[i].x, fr[i].z) && inAnichkov(fr[i + 1].x, fr[i + 1].z)); });
    const segNear = seg.map((sg, i) => isNear(fr[i].x, fr[i].z));
    const segSlope = seg.map((sg, i) => { const r = sRuns.find((q) => fr[i].s >= q.s0 - 0.06 && fr[i + 1].s <= q.s1 + 0.06); return r ? r.reach : null; });      // the slope reach of a piece, or null
    const segIn = seg.map((sg, i) => !!bank.far && L.inExtent((fr[i].x + fr[i + 1].x) / 2, (fr[i].z + fr[i + 1].z) / 2, 3));      // scenery banks: the data banks rule inside the extent
    const segPlay = seg.map((sg, i) => L.inPlay(fr[i].x, fr[i].z, -150));
    const segGap = seg.map((sg, i) => segDeck[i] || segKind[i] === 1 || !!segSlope[i]);      // (a slope piece has no coping / parapet either)
    // the raised coping lip (0.17 m) stays out of a carriageway that runs on it (bridge approaches, roads on the quay edge): the road is flush there
    // (tested at both ends and the middle of the piece, 0.15 and 0.7 m landward: the lip is 0.62 m wide and the net's asphalt reaches a little beyond the layout width)
    const segRoad = seg.map((sg, i) => [0.15, 0.7].some((o) => [0, 0.5, 1].some((f) => onRoad(fr[i].x + (fr[i + 1].x - fr[i].x) * f + sg.nx * o, fr[i].z + (fr[i + 1].z - fr[i].z) * f + sg.nz * o))));
    // ---- wall face, coping (strips along the pieces)
    const strip = (Bld, p, q, nd, ny, u0, vf, skip, uv = TILE_U) => {
      for (let i = 0; i + 1 < fr.length; i++) {
        if (skip(i)) continue;
        const a = fr[i], b = fr[i + 1], sg = seg[i];
        const A0 = Bld.vert(a.x + a.mx * p[0] * a.k, p[1], a.z + a.mz * p[0] * a.k, nd * sg.nx, ny, nd * sg.nz, a.s / uv + u0, vf(p[1]));
        const B0 = Bld.vert(b.x + b.mx * p[0] * b.k, p[1], b.z + b.mz * p[0] * b.k, nd * sg.nx, ny, nd * sg.nz, b.s / uv + u0, vf(p[1]));
        const B1 = Bld.vert(b.x + b.mx * q[0] * b.k, q[1], b.z + b.mz * q[0] * b.k, nd * sg.nx, ny, nd * sg.nz, b.s / uv + u0, vf(q[1]));
        const A1 = Bld.vert(a.x + a.mx * q[0] * a.k, q[1], a.z + a.mz * q[0] * a.k, nd * sg.nx, ny, nd * sg.nz, a.s / uv + u0, vf(q[1]));
        quadN(Bld, A0, B0, B1, A1, nd * sg.nx, ny, nd * sg.nz);
      }
    };
    /** a profile polyline [[offset (+ landward), y]...] swept as strips; the normal of every step is (-dy, do) rotated into (landward, up) */
    const sweep = (Bld, prof, skip, u0 = 0, vf = () => 0, uv = TILE_U) => {
      for (let k = 0; k + 1 < prof.length; k++) {
        const p = prof[k], q = prof[k + 1], dO = q[0] - p[0], dY = q[1] - p[1], nl = Math.hypot(dO, dY) || 1, nO = -dY / nl, nY = dO / nl;
        for (let i = 0; i + 1 < fr.length; i++) {
          if (skip(i)) continue;
          const a = fr[i], b = fr[i + 1], sg = seg[i];
          const nxw = nO * sg.nx, nzw = nO * sg.nz;
          const pa0 = p[0], pb0 = p[0], qa0 = q[0], qb0 = q[0];
          const A0 = Bld.vert(a.x + a.mx * pa0 * a.k, p[1], a.z + a.mz * pa0 * a.k, nxw, nY, nzw, a.s / uv + u0, vf(p[1]));
          const B0 = Bld.vert(b.x + b.mx * pb0 * b.k, p[1], b.z + b.mz * pb0 * b.k, nxw, nY, nzw, b.s / uv + u0, vf(p[1]));
          const B1 = Bld.vert(b.x + b.mx * qb0 * b.k, q[1], b.z + b.mz * qb0 * b.k, nxw, nY, nzw, b.s / uv + u0, vf(q[1]));
          const A1 = Bld.vert(a.x + a.mx * qa0 * a.k, q[1], a.z + a.mz * qa0 * a.k, nxw, nY, nzw, a.s / uv + u0, vf(q[1]));
          quadN(Bld, A0, B0, B1, A1, nxw, nY, nzw);
        }
      }
    };
    const vWall = (y) => (y - YB) / TH;
    const u0 = bank.idx * 0.37;
    const batter = key === 'neva' ? 0.3 : key === 'fontanka' ? 0 : 0.08;                 // the foot of the wall leans toward the water
    const wallProf = [[-batter, YB], [0, COP_BOT]];
    sweep(face[key], wallProf, (i) => segDeck[i] || segIn[i] || segSlope[i], u0, vWall);
    sweep(faceDeck[key], wallProf, (i) => !segDeck[i] || segIn[i], u0, vWall);
    // ---- grass-slope banks: low granite banquette (kerb) at the water, a short lip, the grass slope up to street level, granite end caps where the slope meets a bridge / the wall
    for (const reach of new Set(sRuns.map((r) => r.reach))) {
      const KT = lvl(key) + reach.kerb, y0 = KT + reach.lip, run = reach.run, other = (i) => segSlope[i] !== reach, flat0 = () => 0;
      const prof = [[0.45, y0]]; for (const [t, e] of [[0.18, 0.17], [0.38, 0.37], [0.58, 0.58], [0.78, 0.79], [0.92, 0.94], [1, 1]]) prof.push([0.45 + t * (run - 0.45), y0 * (1 - e)]);
      prof.push([run + 0.3, -0.01], [run + 0.45, -0.05]);
      sweep(face[key], [[-0.05, YB], [0, KT]], other, u0, vWall);
      sweep(coping[key], [[0, KT], [0.45, KT]], other, 0, flat0);
      sweep(coping[key], [[0.45, KT], [0.45, y0]], other, 0, flat0);
      sweep(grass, prof, other, 0, (y) => (y - y0) / 5, 5);
      slopeInfo.push({ key, reach: reach.id, run });
      for (const r of sRuns) {
        if (r.reach !== reach) continue;
        for (const [sEnd, dir] of [[r.s0, -1], [r.s1, 1]]) {
          const k = fr.findIndex((q) => Math.abs(q.s - sEnd) < 0.08); if (k < 0) continue;
          const q = fr[k], sg = seg[Math.min(k, seg.length - 1)], nx = dir * sg.tx, nz = dir * sg.tz;
          const poly = [[0, -0.005], [0, KT], [0.45, KT], ...prof.slice(0, 7), [run + 0.3, -0.005]];                  // the cut face of the earth: from the slope line UP to street level (the ground sliver beyond the end rests on it)
          const ids = poly.map(([o, y]) => capB.vert(q.x + q.mx * o * q.k, y, q.z + q.mz * o * q.k, nx, 0, nz, o / 2, y / 2));
          for (let j = 1; j + 1 < ids.length; j++) orientTri(capB, ids[0], ids[j], ids[j + 1], nx, 0, nz);
        }
      }
    }
    const flat = () => 0;
    if (key === 'fontanka') {
      sweep(coping[key], [[0, COP_BOT], [-COP_OUT, COP_BOT], [-COP_OUT, Y_TOP], [COP_IN, Y_TOP]], (i) => segGap[i] || segRoad[i], 0, flat);
    } else if (key === 'neva') {
      sweep(coping[key], [[0, COP_BOT], [-0.13, COP_BOT], [-0.16, -0.22], [-0.12, -0.08], [0, 0.0]], (i) => segGap[i] || segIn[i], 0, flat);                 // the rolled string course
      sweep(parapet, PARAPET_ROLL, (i) => segGap[i] || segIn[i] || (!bank.far && segPlay[i]), 0, (y) => Math.max(0, y) / 1.04 * 0.99, 2.2);      // (the pieces within reach of the player are breakable sections of 2.2 m, parapetBays below)
      for (let i = 0; i + 1 < fr.length; i++) {
        if (segGap[i] || segIn[i] || bank.far || !segPlay[i]) continue;
        const a = fr[i], sg = seg[i], nb = Math.max(1, Math.round(sg.len / 2.2));
        for (let j = 0; j < nb; j++) {
          const x0 = a.x + sg.tx * sg.len * j / nb, z0 = a.z + sg.tz * sg.len * j / nb, x1 = a.x + sg.tx * sg.len * (j + 1) / nb, z1 = a.z + sg.tz * sg.len * (j + 1) / nb;
          // the collider box of the old wall: 0.4 m landward of the wall line, 0.45 thick; where a road runs over it the box moves seaward (up to 5 m) or is left out (a carriageway must not be walled: the bridge approaches)
          const clash = (dd) => [0, 0.5, 1].some((f) => onRoad(x0 + (x1 - x0) * f + sg.nx * (0.4 - dd), z0 + (z1 - z0) * f + sg.nz * (0.4 - dd), dd > 0 ? 0.4 : 0.05));
          let cdd = 0; if (clash(0)) { cdd = -1; for (let dd = 0.3; dd <= 5; dd += 0.3) if (!clash(dd)) { cdd = dd; break; } }
          parapetBays.push(faceLeft(x0, z0, x1, z1, sg.nx, sg.nz, { y: Y_TOP, nx: sg.nx, nz: sg.nz, key, cdd }));
        }
      }
      sweep(coping[key], [[0.88, Y_TOP], [1.4, Y_TOP]], (i) => segGap[i] || segIn[i] || segRoad[i], 0, flat);                // the granite kerb strip (not under a carriageway) behind the parapet
    } else {
      sweep(coping[key], [[0, COP_BOT], [-0.14, COP_BOT], [-0.17, -0.24], [-0.15, -0.08], [-0.07, 0.08], [0.05, 0.16], [0.2, Y_TOP], [COP_IN, Y_TOP]], (i) => segGap[i] || segRoad[i], 0, flat);
    }
    sweep(coping[key], [[0, COP_BOT], [-COP_OUT, COP_BOT], [-COP_OUT, 0.0]], (i) => key === 'neva' || segGap[i] || !segRoad[i], 0, flat);                 // under a carriageway the wall top is flush: only its water-side lip
    info.deckPieces += segDeck.filter(Boolean).length;

    // ---- the published segments (everything except the bridge gaps). The old thin wall box along every piece (and the invisible barrier on every slope top) is GONE: water is reachable, only a drawn fence stands, and a drawn
    // fence is a breakable bay with its own collider (the posts + panels below, the parapet sections of the Neva, the rails of the slope tops). A carriageway on the wall line, a gap, a gate, a stretch without a railing is OPEN.
    for (let i = 0; i + 1 < fr.length; i++) {
      const a = fr[i], b = fr[i + 1], sg = seg[i];
      if (segSlope[i] && !segDeck[i] && !bank.far) {
        if (segNear[i]) info.segments.push({ ax: a.x, az: a.z, bx: b.x, bz: b.z, nx: sg.nx, nz: sg.nz, bank: bank.name, key, slope: segSlope[i].run });
        continue;
      }
      if (segDeck[i] || !segPlay[i] || segKind[i] === 1 || bank.far) continue;                 // the scenery banks of the Neva are straight approximations
      if (segNear[i]) info.segments.push({ ax: a.x, az: a.z, bx: b.x, bz: b.z, nx: sg.nx, nz: sg.nz, bank: bank.name, key });
    }

    // ---- stair flights at the landing-stage / steps sites
    const placed = [];
    for (const site of bank.far || key !== 'fontanka' ? [] : sitesOf[key] || []) {
      let best = null;
      for (let s = 0; s < total; s += 1) { const p = at(fr, seg, s), d = Math.hypot(p.x - site.x, p.z - site.z); if (!best || d < best.d) best = { d, s, p }; }
      if (!best || best.d > 28 || !isNear(best.p.x, best.p.z)) continue;
      if (placed.some((q) => Math.hypot(q.x - best.p.x, q.z - best.p.z) < 14)) continue;
      let dir = 1; { const a = at(fr, seg, Math.min(total, best.s + 10)), b = at(fr, seg, Math.max(0, best.s - 10)); if (gapAt(key, a.x, a.z) && !gapAt(key, b.x, b.z)) dir = -1; }
      const at0 = (u) => at(fr, seg, best.s + dir * u);
      const p0 = at0(0), e = at0(10.5);
      if (gapAt(key, p0.x, p0.z) || gapAt(key, e.x, e.z) || gapAt(key, at0(5).x, at0(5).z) || Math.abs(p0.tx * e.tx + p0.tz * e.tz) < 0.97) continue;
      const tx = p0.tx * dir, tz = p0.tz * dir, nx = p0.nx, nz = p0.nz;      // tx,tz: direction of descent; n: landward
      const Wd = site.w || 1.7, y0 = -0.5, wl = lvl(key);
      const put = (u0m, u1m, top, bot = YB) => {                              // a block from u0m to u1m along the descent, hugging the wall on the water side
        const uc = (u0m + u1m) / 2, c = { x: p0.x + tx * uc, z: p0.z + tz * uc };
        box(granite, c.x - nx * (Wd / 2 + 0.02), c.z - nz * (Wd / 2 + 0.02), tx, tz, nx, nz, (u1m - u0m) / 2, Wd / 2, bot, top, 2);
      };
      put(-1.6, 1.6, y0);                                                      // top landing (below the coping)
      const steps = key === 'fontanka' ? 11 : Math.max(8, Math.ceil((y0 - (wl + 0.22)) / 0.235)), run = 0.4, rise = (y0 - (wl + 0.22)) / steps;
      for (let k = 0; k < steps; k++) {
        const u0m = 1.6 + k * run, top = y0 - rise * (k + 1);
        put(u0m, u0m + run, top);
        box(granite, p0.x + tx * (u0m + run / 2) - nx * (Wd + 0.1), p0.z + tz * (u0m + run / 2) - nz * (Wd + 0.1), tx, tz, nx, nz, run / 2, 0.12, top, top + 0.9, 2);     // balustrade on the water side
      }
      put(1.6 + steps * run, 1.6 + steps * run + 3.0, wl + 0.22);              // the lower landing 0.22 m above the water
      const st = { x: p0.x, z: p0.z, tx, tz, nx, nz, bank: bank.name, key, length: 4.6 + steps * run + 3, landingY: wl + 0.22, w: Wd, steps };
      placed.push(p0); info.allStairs.push(st); if (key === 'fontanka') info.stairs.push(st);
      if (OPEN_FONTANKA_STAIRS.some((o) => Math.hypot(o.x - p0.x, o.z - p0.z) < o.r) && L.inPlay(p0.x, p0.z, -5)) {      // a steppable flight (owner 2026-10-26): a gap in the railing, walk boxes for the landing / treads / pontoon deck
        const rot = Math.atan2(-tz, tx), Pq = (u, v) => [p0.x + tx * u - nx * v, p0.z + tz * u - nz * v], lowY = wl + 0.22, uL = 1.6 + steps * run;
        const walk = (u0, u1, v0, v1, top) => { const c = Pq((u0 + u1) / 2, (v0 + v1) / 2); ctx.physics.addWalkBox(c[0], c[1], u1 - u0, v1 - v0, rot, top, -8).boatPass = true; info.colliders++; };       // boatPass: a FLOOR for the walker only, a floating boat passes it (drive/collision.js)
        walk(-1.6, 1.6, -0.02, Wd + 0.1, y0);                                  // the top landing (0.5 m under the pavement)
        walk(-1.2, 1.2, -0.75, 0.45, y0 + 0.25);                               // a hidden sill under the pavement edge: the climb back from the landing (0.5 m) is two 0.25 m steps
        { const c = Pq(1.6 + (steps * run) / 2, Wd / 2 + 0.02); for (const t of ctx.physics.addStairs(c[0], c[1], Wd, steps * run, Math.atan2(tx, tz), y0, lowY, steps)) t.boatPass = true; info.colliders += steps; }
        walk(uL, uL + 3.0, -0.02, Wd + 0.1, lowY);                             // the lower landing
        walk(uL + 3.0 - 0.05, uL + 3.0 + PONTOON.len, 0.1, PONTOON.wid, PONTOON.top);      // the deck of the landing-stage pontoon of landmarksC/boats.js (it starts 9 m from the flight origin; its deck is 0.26 m above the landing)
        openStairs.push({ x: p0.x, z: p0.z, tx, tz, nx, nz, gate: OPEN_GATE });
        st.walk = true; st.gate = OPEN_GATE; st.topY = y0; st.pontoonTop = PONTOON.top;
      }
    }

    // ---- posts + panels (near parts only, never in a gap)
    if (W.rail.length) {
      let prevPost = null, prevStyle = null, deckPost = null;
      // THE ANICHKOV DECK EDGE (owner 2026-10-26: "a hole in the fence" at the west bank just north of the bridge): the posts inside the deck polygon (+ 1.2 m) are left out, and the bridge railing starts about where the first of
      // them stood, so the last quay bay used to end one bay (3.6 m) short of it: an open hole beside the bridge head. The first / last post of the deck zone is now the end of a closing bay (a deck post is only used as such an end,
      // never drawn on its own, and never where a carriageway or a gate lies); every other deck post stays out.
      const postAt = (x, z, tx, tz, nx, nz, s) => {
        const onDeck = key === 'fontanka' && inAnichkov(x, z);
        if (!isNear(x, z) || inRunS(s) || (!onDeck && gapAt(key, x, z)) || inGate(x, z, 0.0) || onRoad(x + nx * 0.26, z + nz * 0.26)) { prevPost = null; deckPost = null; return; }
        const style = railStyle(key, bank, x, z, nx, s, nz);
        if (!style) { prevPost = null; deckPost = null; return; }
        const px = x + nx * 0.26, pz = z + nz * 0.26, minGap = style === 'tube' ? 1.2 : 1.6;
        if (onDeck) {
          if (prevPost && !deckPost && Math.hypot(prevPost.x - px, prevPost.z - pz) < 4.8 && Math.hypot(prevPost.x - px, prevPost.z - pz) >= minGap && !onRoad((px + prevPost.x) / 2, (pz + prevPost.z) / 2)) {      // coming from the quay: close up to the deck edge
            const dk = { kind: style === 'tube' ? 'tube' : style === 'arcade' ? 'bigpost' : style === 'moika' ? 'moika' : (POST[key] || 'bigpost') };
            dk.col = postTone(dk.kind, key, hash2(Math.round(x), Math.round(z), 5), x, z); dk.y = Y_TOP - 0.03;
            addBay({ x0: prevPost.x, z0: prevPost.z, x1: px, z1: pz, nx, nz, key, y: Y_TOP, post: dk, panel: style === 'tube' ? null : style, h: RAIL_H[style], tube: style === 'tube' });
          }
          prevPost = null; deckPost = { x: px, z: pz }; return;                 // (the next deck posts only move the "last deck post" on)
        }
        if (!prevPost && deckPost) { prevPost = deckPost; }                      // going out of the deck zone: the first quay post closes the bay up to the last deck post
        deckPost = null;
        if (prevPost && Math.hypot(prevPost.x - px, prevPost.z - pz) < minGap) return;
        const postKind = style === 'tube' ? 'tube' : style === 'arcade' ? 'bigpost' : style === 'moika' ? 'moika' : (POST[key] || 'bigpost');
        const post = { kind: postKind, col: postTone(postKind, key, hash2(Math.round(x), Math.round(z), 5), x, z), y: Y_TOP - 0.03 };
        if (key === 'winter-canal') corbels.push({ x: x - nx * 0.0 + nx * 0.0, z, nx, nz, yaw: Math.atan2(nx, nz), px: x + nx * 0.0, pz: z });
        let spanned = false;
        if (prevPost && Math.hypot(prevPost.x - px, prevPost.z - pz) < 4.8 && !onRoad((px + prevPost.x) / 2, (pz + prevPost.z) / 2) && !inOpenGate((px + prevPost.x) / 2, (pz + prevPost.z) / 2)) {      // a span over a carriageway or over the gap of a steppable flight has no railing: the post stands alone
          addBay({ x0: prevPost.x, z0: prevPost.z, x1: px, z1: pz, nx, nz, key, y: Y_TOP, post, panel: style === 'tube' ? null : style, h: RAIL_H[style], tube: style === 'tube' });
          spanned = true;
        }
        if (!spanned) addBay({ x0: px, z0: pz, x1: px + tx * 0.001, z1: pz + tz * 0.001, nx, nz, key, y: Y_TOP, post, stub: true });      // (a one-post bay: the post is turned with the wall)
        prevPost = { x: px, z: pz }; prevStyle = style;
      };
      const bay0 = W.bay;
      for (let i = 0; i < seg.length; i++) {
        const a = fr[i], sg = seg[i], mid = railStyle(key, bank, a.x, a.z, sg.nx, a.s, sg.nz), bay = mid === 'tube' ? 2.1 : bay0, bays = Math.max(1, Math.round(sg.len / bay));
        for (let j = 0; j < bays; j++) { const u = j / bays * sg.len; postAt(a.x + sg.tx * u, a.z + sg.tz * u, sg.tx, sg.tz, sg.nx, sg.nz, a.s + u); }
      }
      const e = fr[fr.length - 1], sg = seg[seg.length - 1]; postAt(e.x, e.z, sg.tx, sg.tz, sg.nx, sg.nz, e.s);
      void prevStyle;
    }

    // ---- rails on the slope tops: ball posts + two black tubes (Mars Field side), green trellis (garden side)
    for (const r of sRuns) {
      const mid = at(fr, seg, (r.s0 + r.s1) / 2), kind = r.reach.rail(mid.nx, mid.nz); if (!kind || !r.pts.length) continue;
      const len = r.s1 - r.s0 - 1.0, bay = kind === 'trellis' ? 2.5 : 2.6, n = Math.max(1, Math.round(len / bay)), step = len / n, off = r.reach.run + 0.3;
      let prev = null;
      for (let j = 0; j <= n; j++) {
        const p = at(fr, seg, r.s0 + 0.5 + j * step), x = p.x + p.nx * off, z = p.z + p.nz * off;
        if (!isNear(x, z) || gapAt(key, x, z) || onRoad(x, z, 0.3)) { prev = null; continue; }
        const post = { kind, col: postTone(kind, key, hash2(Math.round(x), Math.round(z), 5), x, z), y: 0.0 };
        if (prev) addBay({ x0: prev.x, z0: prev.z, x1: x, z1: z, nx: p.nx, nz: p.nz, key, y: 0, post, panel: kind === 'trellis' ? 'trellis' : null, h: RAIL_H.trellis, pany: 0.02, btubes: kind !== 'trellis', slope: true });
        else addBay({ x0: x, z0: z, x1: x + p.tx * 0.001, z1: z + p.tz * 0.001, nx: p.nx, nz: p.nz, key, y: 0, post, stub: true, slope: true });
        prev = { x, z };
      }
    }

    // ---- mooring rings (every ~15 m on the Fontanka, 6 m on the canals, 12 m on the Neva), anchor plates, culverts at the bridges
    const ringStep = key === 'fontanka' ? 15 : key === 'neva' ? 12 : 6.5, ringY = key === 'fontanka' ? -0.95 : lvl(key) + 1.25, signY = key === 'fontanka' ? -1.25 : lvl(key) + 1.85;
    for (let s = 6 + (bank.idx < 100 ? bank.idx : bank.idx % 4) * 3.7; s < total && !bank.far && key !== 'moat'; s += ringStep) {
      const p = at(fr, seg, s); if (!isNear(p.x, p.z) || inRunS(s) || gapAt(key, p.x, p.z) || inGate(p.x, p.z, 0.6)) continue;
      rings.push({ x: p.x - p.nx * 0.045, z: p.z - p.nz * 0.045, nx: -p.nx, nz: -p.nz, y: ringY });
      if (Math.floor(s / ringStep) % (key === 'fontanka' ? 4 : 5) === 1 && !onRoad(p.x, p.z)) signs.push({ x: p.x - p.nx * 0.03, z: p.z - p.nz * 0.03, nx: -p.nx, nz: -p.nz, y: signY });
    }
    // the gap ends: plates and drain culverts on the quay walls just beside the deck zone
    for (let i = 1; i + 1 < segDeck.length && !bank.far; i++) if (segDeck[i] !== segDeck[i - 1]) {
      const a = fr[i], sg = seg[segDeck[i] ? i - 1 : i], off = segDeck[i] ? -1.5 : 1.5, p = { x: a.x + sg.tx * off, z: a.z + sg.tz * off };
      if (!onRoad(p.x, p.z)) signs.push({ x: p.x - sg.nx * 0.03, z: p.z - sg.nz * 0.03, nx: -sg.nx, nz: -sg.nz, y: key === 'fontanka' ? -1.25 : lvl(key) + 1.85 });
      if (key !== 'fontanka' && segNear[i]) { const c = { x: a.x + sg.tx * (off * 2.2), z: a.z + sg.tz * (off * 2.2) }; if (!onRoad(c.x, c.z, 0.9)) culverts.push({ x: c.x - sg.nx * 0.03, z: c.z - sg.nz * 0.03, nx: -sg.nx, nz: -sg.nz, y: lvl(key) + 0.3 }); }
    }

    for (const d of mine) buildDescent(d);
  });

  for (const d of descents) attachPier(d);
  for (const d of descents) finishDescent(d);

  // ---- fallback decks for the crossings that no bridge module draws (invisible: a walk box over the water and parapet boxes along both sides)
  for (const zn of zones) {
    // Owned crossings already have the bridge module's deck and rail colliders.
    // Legacy zone rectangles can reach far onto the approach roads (Palace
    // Passage), so their invisible fallback parapets must not be built there.
    if (zn.own && (ctx.buildList || L.MODULE_KEYS || []).includes('bridges')) continue;
    if (zn.id === 'anichkov' || zn.auto || TRIPLE.has(zn.id)) continue;               // landmarksC closes the Fontanka; the Triple Bridge module draws its own walk decks (no invisible fallback deck); the east / north bridge modules draw their own decks
    if (!L.inPlay(zn.c[0], zn.c[1], -20)) continue;
    const a = zn.axis * Math.PI / 180;
    const ux = Math.sin(a), uz = -Math.cos(a), ang = Math.atan2(-uz, ux), L0 = zn.len + 28;
    ctx.physics.addWalkBox(zn.c[0], zn.c[1], Math.min(L0, zn.site ? 62 : L0), zn.w, ang, 0.0, -1.2);
    // (the two invisible parapet boxes of the fallback deck are gone: an invisible fence cannot be broken, and water is reachable. The deck is a floor, its edges are open.)
    info.fallbackDecks++;
  }
  // ---- floors of the mapped OSM bridges that nothing draws (BRIDGE_ZONES rows with floor: true): ONE invisible walk floor at y 0 (bottom -1.2: the bed below stays free) under the road and its footways, exactly the
  //      oriented box of the rows; a car or a walker crosses instead of falling into the trench. No quay gap, no fence (the roads already open the quay there), nothing to break.
  for (const zn of floorZones()) {
    if (!L.inPlay(zn.c[0], zn.c[1], -5)) continue;
    const a = zn.axis * Math.PI / 180;
    ctx.physics.addWalkBox(zn.c[0], zn.c[1], zn.len, zn.w, Math.atan2(Math.cos(a), Math.sin(a)), 0.0, -1.2);
    info.fallbackDecks++;
  }

  // ---- meshes
  const matFor = (k, deckMat) => ctx.mat.toon('#ffffff', { map: wallTexture(ctx, k), paint: 0.05, polygonOffset: deckMat ? 3 : 0, name: 'env-quay-wall-' + (deckMat ? 'deck-' : '') + k });
  const copingMat = (k) => ctx.mat.toon(k === 'neva' ? '#b69c92' : k === 'fontanka' ? (P.graniteCoping || '#a49a95') : '#b0a29a', { paint: 0.05, name: 'env-quay-coping-' + k });
  const mk = (B, mat, name, shadow = true, rec = true) => { if (B.empty) return null; const m = new T.Mesh(B.build(), mat); m.name = name; m.castShadow = shadow; m.receiveShadow = rec; root.add(m); return m; };
  for (const k of keys) { mk(face[k], matFor(k, false), 'env-quay-wall-' + k); mk(faceDeck[k], matFor(k, true), 'env-quay-wall-deck-' + k, false); mk(coping[k], copingMat(k), 'env-quay-coping-' + k); }
  mk(parapet, ctx.mat.toon('#ffffff', { map: parapetTexture(ctx), paint: 0.04, name: 'env-quay-parapet' }), 'env-quay-parapet');
  mk(grass, ctx.mat.toon('#ffffff', { map: grassTexture(ctx), paint: 0.06, name: 'env-quay-grass' }), 'env-quay-grass');
  mk(capB, ctx.mat.toon('#a69489', { paint: 0.05, side: 'double', name: 'env-quay-slope-caps' }), 'env-quay-slope-caps');
  mk(granite, ctx.mat.toon('#9a948f', { paint: 0.05, name: 'env-quay-stairs' }), 'env-quay-stairs');
  mk(graniteA, ctx.mat.toon('#b4a399', { paint: 0.05, name: 'env-quay-steps-a' }), 'env-quay-steps-a');
  mk(graniteB, ctx.mat.toon('#a69489', { paint: 0.05, name: 'env-quay-steps-b' }), 'env-quay-steps-b');
  mk(graniteR, ctx.mat.toon('#b89888', { paint: 0.05, name: 'env-quay-cheeks' }), 'env-quay-cheeks');
  mk(graniteP, ctx.mat.toon('#a98279', { paint: 0.05, name: 'env-quay-pedestals' }), 'env-quay-pedestals');
  if (lionSpots.length) {
    const g = lionGeometry(), mat = ctx.mat.toon('#ffffff', { vertexColors: true, paint: 0.03, name: 'env-lions' });
    for (const sp of lionSpots) { const m = new T.Mesh(g, mat); m.position.set(sp.x, sp.y, sp.z); m.rotation.y = sp.yaw; m.castShadow = true; m.receiveShadow = true; m.name = 'env-lion'; root.add(m); }
  }

  const m4 = new T.Matrix4(), qt = new T.Quaternion(), pos = new T.Vector3(), sc = new T.Vector3(), up = new T.Vector3(0, 1, 0), col = new T.Color();
  const matBuf = (n) => new Float32Array(n * 16);
  if (corbels.length) {
    const M = matBuf(corbels.length);
    corbels.forEach((c, i) => { qt.setFromAxisAngle(up, Math.atan2(-c.nx, -c.nz)); m4.compose(pos.set(c.x - c.nx * 0.02, COP_BOT + 0.02, c.z - c.nz * 0.02), qt, sc.set(1, 1, 1)); m4.toArray(M, i * 16); });
    culledInstances(ctx, T, root, corbelGeometry(), ctx.mat.toon('#a89590', { paint: 0.05, name: 'env-quay-corbels', side: 'double' }), M, null, 300, 'env-quay-corbels');
  }
  // ---- THE BREAKABLE FENCES (lib/fence-bays.js, docs/AREAS.md 13.7): the railing bays (post + panel / tubes), the sections of the Neva parapet, the cheek walls of the descents, the pier railings. One knockInstances call per family:
  // per 384 m cell and per part a dynamic InstancedMesh (LOD 380 .. 520 m), one knock record per bay (anchored: it holds a bump, a car above the break speed breaks it off at the foot), one thin collider per bay (flagged `fence`).
  const heavyPost = new Set(['pyramid', 'twostep', 'tube', 'moika', 'pylon', 'bigpost']);
  const dirOf = (b, fr) => b.nx * -fr.tz + b.nz * fr.tx;                                       // +1 when the landward normal is the local +z of the bay, else -1
  const fenceStats = { bays: 0, parapet: 0, cheeks: 0, pier: 0 };
  if (bays.length) {
    const postKinds = [...new Set(bays.map((b) => b.post.kind))], panelKinds = [...new Set(bays.filter((b) => b.panel).map((b) => b.panel))];
    const tubeGeo = new T.CylinderGeometry(0.04, 0.04, 1, 6, 1).rotateZ(Math.PI / 2).translate(0.5, 0, 0), panelGeo = new T.PlaneGeometry(1, 1).translate(0.5, 0.5, 0);
    const parts = [];
    for (const kind of postKinds) parts.push({ geo: postGeometry(kind), mat: ctx.mat.toon('#ffffff', { paint: 0.05, name: 'env-quay-posts-' + kind }), name: 'post-' + kind, receive: true, at: 'end', y: (b) => b.post.y - b.y, far: 420, when: (b) => b.post.kind === kind, color: (b) => b.post.col });
    for (const kind of panelKinds) parts.push({ geo: panelGeo, mat: ctx.mat.toon('#ffffff', { map: railTexture(ctx, kind), alphaTest: 0.5, side: 'double', paint: 0.02, name: 'env-quay-rail-' + kind }), name: 'rail-' + kind, noOutline: true, far: 520, stretch: true, inset: 0.15, y: (b) => (b.pany ?? Y_TOP + 0.12) - b.y, sy: (b) => b.h, when: (b) => b.panel === kind });
    parts.push({ geo: tubeGeo, mat: ctx.mat.toon('#7d848a', { paint: 0.02, name: 'env-quay-tubes' }), name: 'tube', far: 380, stretch: true, y: 0.93, when: (b) => b.tube });
    for (const [yy, rr] of [[0.5, 0.024], [0.86, 0.026]]) parts.push({ geo: tubeGeo, mat: ctx.mat.toon('#24282c', { paint: 0.02, name: 'env-quay-btubes' }), name: 'btube-' + yy, far: 380, stretch: true, y: yy, sy: rr / 0.04, sz: rr / 0.04, when: (b) => b.btubes });
    const r = knockBays(ctx, { name: 'env-quay-fence', bays, parts, far: 520,
      collider: (b, fr) => (b.stub ? { y0: -8, y1: 1.25, thick: 0.5, e0: 0.25, e1: 0.25 } : { y0: -8, y1: 1.25, thick: b.slope ? 0.5 : 0.45, off: -(b.slope ? 0.1 : 0.085) * dirOf(b, fr), e0: 0.05, e1: 0.05 }),      // (the wall box of before: 0.4 m landward of the wall line .. 0.05 m beyond; y up to 1.25 keeps jumpers out)
      rec: (b) => { const heavy = heavyPost.has(b.post.kind); return { kind: 'fence', mass: heavy ? 450 : 70, h: b.h ?? 1.0, r: 0.05, anchored: heavy ? 20 : 10, hitK: heavy ? 0.55 : 0.22, metal: !heavy, minDv: 0 }; } });
    fenceStats.bays = bays.length; info.posts = bays.length; info.panels = bays.filter((b) => b.panel).length; info.tubes = bays.filter((b) => b.tube || b.btubes).length; info.colliders += r.items.filter(Boolean).length;
  }
  if (parapetBays.length) {
    const roll = unitProfile(PARAPET_ROLL, { uLen: 2.2, uvs: 2.2, vFn: (y) => Math.max(0, y) / 1.04 * 0.99 });
    const r = knockBays(ctx, { name: 'env-quay-parapet-bays', bays: parapetBays, far: 520,
      parts: [{ geo: roll, mat: ctx.mat.toon('#ffffff', { map: parapetTexture(ctx), paint: 0.04, name: 'env-quay-parapet-bays' }), name: 'roll', receive: true, far: 520, stretch: true, y: -Y_TOP }],
      collider: (b, fr) => (b.cdd < 0 ? null : { y0: -8, y1: 1.25, thick: 0.45, off: (0.4 - b.cdd) * dirOf(b, fr), e0: 0.25, e1: 0.25 }),
      rec: (b) => (b.cdd < 0 ? null : { kind: 'fence', mass: 900, h: 1.04, r: 0.3, anchored: 24, hitK: 0.7, metal: false, minDv: 0 }) });
    fenceStats.parapet = parapetBays.length; info.colliders += r.items.filter(Boolean).length;
  }
  if (cheekBays.length) {
    const r = knockBays(ctx, { name: 'env-quay-cheek-bays', bays: cheekBays, far: 300,
      parts: [{ geo: unitBox(0, 1, -0.5, 0.5), mat: ctx.mat.toon('#b89888', { paint: 0.05, name: 'env-quay-cheeks-bay' }), name: 'cheek', far: 300, stretch: true, sy: (b) => b.h, sz: (b) => b.th }],
      collider: (b) => ({ y0: -9, y1: b.y + b.h + 0.35, thick: b.th, e0: 0.02, e1: 0.02 }),
      rec: (b) => ({ kind: 'fence', mass: 500, h: b.h, r: 0.14, anchored: 18, hitK: 0.5, metal: false, minDv: 0 }) });
    fenceStats.cheeks = cheekBays.length; info.colliders += r.items.filter(Boolean).length;
  }
  if (pierBays.length) {
    const railMat = ctx.mat.toon('#e6e8e6', { paint: 0.03, name: 'env-pier-rail' });
    const r = knockBays(ctx, { name: 'env-pier-rail', bays: pierBays, far: 260,
      parts: [{ geo: unitBox(0.93, 0.98, -0.025, 0.025), mat: railMat, name: 'top', far: 260, stretch: true }, { geo: unitBox(0.48, 0.52, -0.02, 0.02), mat: railMat, name: 'mid', far: 260, stretch: true },
        { geo: new T.BoxGeometry(0.06, 1.0, 0.06).translate(0, 0.5, 0), mat: railMat, name: 'post', far: 260, ats: (b) => (b.last ? ['start', 'end'] : ['start']) }],
      collider: () => ({ y0: -0.6, y1: 1.3, thick: 0.2, e0: 0.05, e1: 0.05 }),
      rec: () => ({ kind: 'fence', mass: 40, h: 1.0, r: 0.04, anchored: 8, hitK: 0.1, metal: true, minDv: 0 }) });
    fenceStats.pier = pierBays.length; info.colliders += r.items.filter(Boolean).length;
  }
  const sprites = (list, tex, w, h, name, yOff = 0) => {
    if (!list.length) return 0;
    const mat = ctx.mat.toon('#ffffff', { map: tex, alphaTest: 0.5, side: 'double', paint: 0.0, polygonOffset: -2, name });
    const im = new T.InstancedMesh(new T.PlaneGeometry(w, h), mat, list.length);
    list.forEach((r, i) => { qt.setFromAxisAngle(up, Math.atan2(r.nx, r.nz)); m4.compose(pos.set(r.x, r.y + yOff, r.z), qt, sc.set(1, 1, 1)); im.setMatrixAt(i, m4); });
    im.instanceMatrix.needsUpdate = true; im.name = name;
    im.computeBoundingBox(); im.computeBoundingSphere();
    ctx.noOutline(im); root.add(im); return list.length;
  };
  info.rings = sprites(rings, ringTexture(ctx), 0.26, 0.4, 'env-quay-rings');
  info.signs = sprites(signs, anchorSignTexture(ctx), 0.52, 0.52, 'env-quay-anchor-signs');
  info.culverts = sprites(culverts, culvertTexture(ctx), 0.9, 0.9, 'env-quay-culverts', 0.45);
  return {
    water: WATER_Y, top: Y_TOP, segments: info.segments, gaps: deck ? [Array.from(deck)] : [], bridges: zones.map((z) => ({ id: z.id, name: z.name, key: z.key, c: z.c, axis: z.axis, w: z.w, len: z.len, own: z.own })),
    stairs: info.stairs, allStairs: info.allStairs, rings: info.rings, signs: info.signs, posts: info.posts, panels: info.panels, colliders: info.colliders, culverts: info.culverts, tubes: info.tubes,
    fallbackDecks: info.fallbackDecks, fence: fenceStats, slopes: slopeInfo, pierOverride, banks: banks.map((b) => ({ name: b.name, key: b.key, len: Math.round(b.len) })),
  };
}
void waterGeo;
