// wallmat.js - the WALL / FACADE SYSTEM of Saint Petersburg: ONE procedural shader family that paints every stucco / brick / panel / glass-infill wall of the
// centre (rusticated ground floor, shop fronts with sign bands, parade doors, carriage-arch rims, piano nobile with pediments, lintels and sills, belt courses,
// frieze, corner pilasters, courtyard walls, firewalls, restoration nets, wear) from a handful of per-wall numbers, plus the geometry builder that feeds it.
//
// Why a shader: ~190 km of street wall x 5 storeys = 300 000 windows. Real window reveals would eat the whole triangle budget; the shader draws them per fragment
// from a *wall space* (u = bay index along the wall, v = metres above the wall base) so any wall length / height stays crisp, with no texture memory. It is a
// patched MeshToonMaterial (cel light bands, sun shadows, fog and outline pass work like every ctx.mat.toon surface). Geometry (cornices, balconies, erkers,
// arch vaults, awnings, mansards, chimneys ...) is built by the other city/* files; they use the same material for the faces that carry windows (erkers, turrets).
//
// ---- per-quad data (vertex attributes; the wall meshes are noBatch and split by 48 m cells by city.js, so the batcher never touches them) -------------------------
//   uv      = (u, v): u = bay coordinate along the wall segment (0 .. Nseg, multiples of 1/4 are exact), v = height above the wall base in metres
//   color   = base wall colour (linear)
//   aA      = (arch, floors, Hc, bw)       arch id (ARCH), storey count, cornice height above the base (m), bay width (m)
//   aB      = (Nseg, i0, seed, flags)      bays of this segment, global index of its first bay (hash only), per-building seed 0..1, FLAG bits
//   aC      = (plinth, Gh, PNh, centre)    granite plinth height, ground floor height, piano-nobile height (m), emphasised centre bay (local index or -1; on NORDIC walls a 24-bit mask of the FEATURE bays: bay windows / gable axes)
//   aD      = (balM, doorM, pierM, sdoorM) 24-bit bay masks: balcony doors on the piano nobile, parade doors, shop piers (at the LEFT edge of the bay), shop doors
//   The upper storeys share Uh = (Hc - plinth - Gh - PNh) / (floors - 2).
//   FLAG bits: see F below. All numbers are decoded as flat varyings (no interpolation noise: the z-fighting lesson of the Yakutsk wall shader).
// Palette / era / geometry decisions live in archetypes.js and walls.js.
import * as THREE from 'three';

export const ARCH = { PLAIN: 0, CLASSIC: 1, ECLECTIC: 2, BRICK: 3, TENEMENT: 4, NOUVEAU: 5, NEOCLASS: 6, STALIN: 7, PANEL: 8, MODERN: 9, MANSION: 10, COURT: 11, SERVICE: 12, ERKER: 13, STAIR: 14, FIREWALL: 15,
  // the Petrograd side (2026-10, docs/city-api.md "Petrograd-side archetypes"): painted by their own branches, the ids above are untouched
  NORDIC: 16,            // Northern Modern tenement 1899-1912: roughcast field + smooth bands, slim paired / three-light windows with small-pane upper sashes, rough granite socle that steps up, majolica band
  NEOCLASSIC1910: 17,    // neoclassical revival 1908-16: banded two-storey base, giant pilaster order with capitals, medallions / garlands in the spandrels, attic storey above the order on 6+ storeys
  PARAPET: 18,           // roof balustrade / attic parapet quads (gables.js): aA = (18, variant 0 balusters / 1 attic panels, height, bay width)
  GABLE: 19,             // shaped attic gable above the cornice (gables.js): aA = (19, shape 0 round / 1 shouldered / 2 steep / 3 stepped, height, 1), aB.x = width in metres
};
export const F = {
  SHOP: 1, BLANK: 2, NET: 4, GATE: 8, QUOIN_L: 16, QUOIN_R: 32, TINT1: 64, TINT2: 128, WEAR1: 256, WEAR2: 512, COURT: 1024, NOCENTRE: 2048, RICH: 4096, GREENNET: 8192, NIGHTSHOP: 16384, ARCHOPEN: 32768, TRIM1: 65536, GRANITE: 524288,
  MAJOLICA: 1048576,     // NORDIC / GABLE: glazed tile band under the top storey (bit 20)
  SOCLE: 2097152,        // NORDIC: rough granite socle that steps up to the top of the ground floor at the feature / door bays (bit 21); NEOCLASSIC1910: the order is half-columns (rounder shading)
  SCENIC: 4194304,       // visual margin / waterfront: retain filtered window rhythm after fine ornament fades (bit 22)
};
export const tintFlags = (t) => (t & 3) * F.TINT1;       // ground-floor tint 0 same / 1 dark grey-brown / 2 terracotta / 3 pale
export const wearFlags = (w) => (w & 3) * F.WEAR1;       // wear 0 fresh .. 3 worn
/** trim class of a house (known.js): 0 warm white (default) 1 white 2 wall colour 3 cream 4 light grey stone 5 dark stone 6 patinated green-grey. Bits 16-18 of the flags. */
export const trimFlags = (c) => ((c | 0) & 7) * F.TRIM1;

const GLSL_HELPERS = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
vec3 sr(vec3 c){ return c * c; }                       // sRGB-ish literal -> linear (gamma 2)
float box1(float d, float aa){ return 1.0 - smoothstep(-0.5 * aa, 0.5 * aa, d); }
// Analytic box-filtered periodic aperture. A distant window still has its
// proper fractional pixel coverage, rather than fading the entire facade to
// one colour or clamping derivatives and making a shimmering dot grid.
float pulseIntegral(float x,float period,float width){
  return floor(x/period)*width+clamp(mod(x,period)-(period-width)*0.5,0.0,width);
}
float apertureAA(float x,float period,float width,float pixel){
  float p=max(pixel,1e-4),w=min(width,period*0.9);
  return clamp((pulseIntegral(x+p*0.5,period,w)-pulseIntegral(x-p*0.5,period,w))/p,0.0,1.0);
}
float rectD(vec2 q, vec2 hs){ vec2 d = abs(q) - hs; return max(d.x, d.y); }
// window outline distance (negative inside). head 0 flat, 1 round (semicircle), 2 segmental arc
float winD(vec2 q, vec2 hs, int head){
  float side = abs(q.x) - hs.x, bot = -q.y - hs.y;
  if (head == 1) { float cy = hs.y - hs.x; if (q.y > cy) return max(length(vec2(q.x, q.y - cy)) - hs.x, bot); return max(side, bot); }
  if (head == 2) { float r = hs.x * 0.32, R = (hs.x * hs.x + r * r) / (2.0 * r); if (q.y > hs.y - r) return max(length(q - vec2(0.0, hs.y - R)) - R, max(side, bot)); return max(side, bot); }
  return max(max(side, bot), q.y - hs.y);
}
vec3 curtainCol(float r){
  if (r < 0.28) return sr(vec3(0.94, 0.93, 0.88));
  if (r < 0.50) return sr(vec3(0.92, 0.86, 0.72));
  if (r < 0.66) return sr(vec3(0.78, 0.82, 0.88));
  if (r < 0.80) return sr(vec3(0.82, 0.68, 0.62));
  return sr(vec3(0.70, 0.78, 0.68));
}
// one window: q = metres from the window centre, hs = half size. Returns the sash / glass colour; cover = 1 inside the outline.
vec3 windowCol(vec2 q, vec2 hs, int head, vec2 id, float S, float aa, vec3 glassLo, vec3 glassHi, float lit, float night, out float cover, out vec3 emis){
  float r1 = h21(id * 1.31 + S * 5.7), r2 = h21(id.yx * 2.17 + S * 1.9 + 3.0), r3 = h21(id * 0.73 + S * 8.3 + 11.0), r4 = h21(id * 3.1 + S * 2.3 + 17.0);
  float d = winD(q, hs, head);
  cover = box1(d, aa);
  float fw = 0.055;
  float inner = box1(d + fw, aa);
  vec3 fc = r3 < 0.62 ? sr(vec3(0.94, 0.93, 0.89)) : (r3 < 0.88 ? sr(vec3(0.42, 0.29, 0.21)) : sr(vec3(0.30, 0.36, 0.33)));
  float t = clamp((q.y + hs.y) / max(2.0 * hs.y, 0.05), 0.0, 1.0);
  vec3 g = mix(glassLo, glassHi, smoothstep(0.1, 1.0, t) * (0.45 + 0.55 * r2));
  g *= 0.82 + 0.3 * r1;
  float cur = step(r1, 0.34), cover2 = 0.45 + 0.4 * r2;
  float curt = cur * smoothstep(1.0 - cover2 - 0.04, 1.0 - cover2 + 0.04, t);
  g = mix(g, curtainCol(r4) * (0.8 + 0.25 * t), curt * 0.85);
  float blind = step(0.34, r1) * step(r1, 0.42);
  float slat = step(0.5, fract(q.y / 0.07));
  g = mix(g, sr(vec3(0.86, 0.86, 0.82)) * (0.78 + 0.22 * slat), blind * 0.8 * step(t, 0.92));
  // mullions: a vertical one on wide windows and a transom (fanlight) on tall ones
  float mull = 0.0;
  if (hs.x > 0.42) mull += box1(abs(q.x) - 0.022, aa);
  if (hs.y > 0.8) mull += box1(abs(q.y - hs.y * 0.46) - 0.022, aa);
  g = mix(g, fc, clamp(mull, 0.0, 1.0));
  float rim = smoothstep(hs.y - fw - 0.10, hs.y - fw, q.y) * 0.34 + smoothstep(-hs.x + fw + 0.08, -hs.x + fw, q.x) * 0.16;
  g *= 1.0 - rim * (1.0 - clamp(mull, 0.0, 1.0));
  float L = step(r4, lit);
  vec3 warm = r3 > 0.9 ? vec3(0.55, 0.72, 1.0) : mix(vec3(1.0, 0.70, 0.38), vec3(1.0, 0.88, 0.62), r2);
  emis = warm * L * night * (0.7 + 0.35 * (1.0 - curt * 0.5)) * inner;
  g = mix(g, warm * 0.5, L * night * 0.55);
  return mix(fc, g, inner);
}
`;

const GLSL_WALL = /* glsl */`
  // ------------------------------------------------------------------ decode
  int arch = int(vA.x + 0.5); float nFl = vA.y, Hc = vA.z, bw = vA.w;
  float Nseg = vB.x, i0h = vB.y, S = vB.z; int fl = int(vB.w + 0.5);
  float plinth = vC.x, Gh = vC.y, PNh = vC.z, centreBay = vC.w;
  int balM = int(vD.x + 0.5), doorM = int(vD.y + 0.5), pierM = int(vD.z + 0.5), sdoorM = int(vD.w + 0.5);
  float u = vCell.x, y = vCell.y;
  bool bShop = (fl & 1) != 0, bBlank = (fl & 2) != 0, bNet = (fl & 4) != 0, bGate = (fl & 8) != 0, qL = (fl & 16) != 0, qR = (fl & 32) != 0;
  int gfTint = (fl / 64) & 3, wear = (fl / 256) & 3, tcls = (fl / 65536) & 7;
  bool bCourt = (fl & 1024) != 0, bNoCentre = (fl & 2048) != 0, bRich = (fl & 4096) != 0, bGreenNet = (fl & 8192) != 0;
  bool bMaj = (fl & 1048576) != 0, bSocle = (fl & 2097152) != 0;
  int featM = arch == 16 ? int(max(centreBay, 0.0) + 0.5) : 0;
  vec3 wall = diffuseColor.rgb;
  vec2 fwc = max(fwidth(vec2(u * bw, y)), vec2(1e-5));
  float aa = max(max(fwc.x, fwc.y), 1e-4);
  float detail = 1.0 - smoothstep(0.26, 0.80, aa);
  float pn = vnoise(vec2(vWp.x + vWp.z, vWp.y * 1.7) * 0.18) - 0.5;
  float pn2 = vnoise(vec2(vWp.x - vWp.z, vWp.y) * 1.3) - 0.5;
  wall *= 1.0 + 0.06 * pn + 0.035 * (vnoise(vec2(u * bw, y) * 3.1) - 0.5) * detail + 0.03 * pn2 * detail;
  if ((fl & 524288) != 0) {                          // rough-hewn granite cladding (Wawelberg house, Junker house, bank corners): 1.1 x 0.55 m blocks with dark joints
    float gR = floor(y / 0.55), gX = (u * bw) / 1.1 + mod(gR, 2.0) * 0.5;
    float gv = h21(vec2(floor(gX), gR) + S * 3.0);
    float gjx = min(fract(gX), 1.0 - fract(gX)) * 1.1, gjy = min(fract(y / 0.55), 1.0 - fract(y / 0.55)) * 0.55;
    wall *= 0.78 + 0.42 * gv;
    wall *= 1.0 - 0.30 * max(box1(gjx - 0.025, aa * 0.5), box1(gjy - 0.025, aa * 0.5)) * detail;
  }
  vec3 trimB = uTrimC;
  if (tcls == 1) trimB = sr(vec3(0.955, 0.945, 0.915));
  else if (tcls == 2) trimB = mix(wall, vec3(1.0), 0.07);
  else if (tcls == 3) trimB = sr(vec3(0.93, 0.87, 0.73));
  else if (tcls == 4) trimB = sr(vec3(0.78, 0.76, 0.72));
  else if (tcls == 5) trimB = sr(vec3(0.55, 0.52, 0.48));
  else if (tcls == 6) trimB = sr(vec3(0.46, 0.58, 0.52));
  vec3 trim = mix(trimB, wall, tcls == 2 ? 0.0 : 0.08);
  vec3 col = wall, avgc = wall;
  float bi = floor(u + 1e-3), fx = u - bi;
  float xm = (fx - 0.5) * bw;                       // metres from the bay centre
  int li = int(clamp(bi + 0.5, 0.0, 23.0));
  bool lastBay = bi > Nseg - 1.5;
  vec2 id = vec2(bi + i0h, 0.0);
  float night = uNight;
  float lit = uOpt.w;

  float yG1 = plinth + Gh, yPN1 = yG1 + PNh;
  float nUp = max(nFl - 2.0, 0.0);
  float UFh = nUp > 0.5 ? max(Hc - yPN1, 2.0) / nUp : 3.5;
  // storey class: -1 plinth, 0 ground, 1 piano nobile, 2 upper, 3 top floor
  int fcls; float fb, fh, fi;
  if (y < plinth) { fcls = -1; fb = 0.0; fh = plinth; fi = -1.0; }
  else if (y < yG1) { fcls = 0; fb = plinth; fh = Gh; fi = 0.0; }
  else if (y < yPN1 && PNh > 0.1) { fcls = 1; fb = yG1; fh = PNh; fi = 1.0; }
  else { float k = clamp(floor((y - yPN1) / UFh), 0.0, max(nUp - 1.0, 0.0)); fcls = (k > nUp - 1.5 && nFl > 3.5) ? 3 : 2; fb = yPN1 + k * UFh; fh = UFh; fi = 2.0 + k; }
  id.y = fi;
  float fy = y - fb;                                 // metres above the floor line

  if (arch >= 18) {
    // ------------------------------------------------------------------ roof parapets and shaped gables (gables.js): u * bw = metres along the piece, y = metres above its foot
    vec3 pcol = wall;
    float xl = u * bw;
    if (arch == 18) {
      float Hp = Hc;
      float bx = (fx - 0.5) * bw;                                        // metres from the middle of this parapet bay
      float pier = box1(bw * 0.5 - abs(bx) - 0.24, aa);
      if (nFl < 0.5) {                                                   // balustrade: vase balusters every 21 cm between piers, plinth and hand rail
        float t = clamp((y - 0.20) / max(Hp - 0.36, 0.05), 0.0, 1.0);
        float prof = 0.030 + 0.050 * sin(3.14159 * pow(1.0 - t, 1.5));
        float bal = box1(abs(fract(bx / 0.21 + 0.5) - 0.5) * 0.21 - prof, aa * 0.7);
        vec3 gap = mix(uGlassLo, vec3(0.30, 0.36, 0.44), 0.45);
        pcol = mix(gap, wall * 0.96, bal);
        pcol = mix(wall * 0.80, pcol, detail);
        pcol = mix(pcol, wall, max(step(y, 0.20), step(Hp - 0.16, y)));
        pcol = mix(pcol, wall * 0.99, pier);
        pcol *= 1.0 - 0.12 * box1(abs(y - (Hp - 0.19)) - 0.025, aa) * detail;
      } else {                                                           // attic parapet: recessed panels between piers
        float pd = max(abs(bx) - (bw * 0.5 - 0.46), abs(y - Hp * 0.5) - (Hp * 0.5 - 0.22));
        pcol = mix(wall, wall * 0.88, box1(pd, aa) * detail);
        pcol = mix(pcol, wall * 0.78, box1(abs(pd) - 0.02, aa) * detail);
        pcol *= 1.0 - 0.10 * step(Hp - 0.12, y);
      }
    } else {
      // gable: shape (aA.y) 0 round, 1 shouldered (a bell over two low shoulders), 2 steep triangle, 3 stepped; W = aB.x metres, Hg = aA.z
      float W = Nseg, Hg = Hc, gx = (xl - W * 0.5) / (W * 0.5), ax = abs(gx);
      int shape = int(nFl + 0.5);
      float f;
      if (shape == 0) f = Hg * sqrt(max(1.0 - ax * ax, 0.0));
      else if (shape == 1) f = Hg * (0.34 + 0.66 * (1.0 - smoothstep(0.18, 0.74, ax)));
      else if (shape == 2) f = Hg * (1.0 - ax);
      else f = Hg * (ax < 0.34 ? 1.0 : (ax < 0.68 ? 0.66 : 0.34));
      float sp = h21(floor(vec2(xl, y) / 0.05) + S * 7.0);
      vec3 smoothC = tcls == 0 ? mix(wall, vec3(0.90, 0.88, 0.82), 0.34) : trim;
      pcol = wall * (0.90 + 0.13 * sp * detail + 0.065 * (1.0 - detail));
      float dTop = f - y;
      pcol = mix(pcol, smoothC, box1(dTop - 0.20, aa));                                            // coping along the outline
      pcol = mix(pcol, smoothC * 0.80, box1(abs(dTop - 0.20) - 0.02, aa) * detail);
      pcol = mix(pcol, smoothC, box1(y - 0.16, aa));                                               // foot band on the cornice
      // attic window: round on the round / shouldered gables, a slim arched one on the steep ones
      vec2 wq = vec2(xl - W * 0.5, y - Hg * (shape == 2 ? 0.34 : 0.44));
      float wr = min(0.52, Hg * 0.17);
      float wd = (shape == 2 || shape == 3) ? winD(wq, vec2(wr * 0.62, wr * 1.25), 1) : length(wq) - wr;
      pcol = mix(pcol, smoothC, box1(wd - 0.09, aa) * detail);
      vec3 gl = mix(uGlassLo, uGlassHi, 0.25 + 0.4 * clamp(wq.y / wr * 0.5 + 0.5, 0.0, 1.0));
      gl = mix(gl, sr(vec3(0.94, 0.93, 0.89)), max(box1(abs(wq.x) - 0.022, aa), box1(abs(wq.y) - 0.022, aa)) * detail);
      pcol = mix(pcol, gl, box1(wd, aa));
      if (bMaj) {                                                                                  // a tile panel under the window
        float mk = h21(vec2(S * 17.0, 8.0));
        vec3 t1 = mk < 0.42 ? sr(vec3(0.30, 0.62, 0.60)) : (mk < 0.70 ? sr(vec3(0.26, 0.47, 0.58)) : (mk < 0.86 ? sr(vec3(0.44, 0.58, 0.34)) : sr(vec3(0.74, 0.52, 0.24))));
        float pm = box1(max(abs(wq.x) - wr * 1.5, abs(wq.y + wr + 0.34) - 0.13), aa);
        pcol = mix(pcol, mix(t1, sr(vec3(0.92, 0.88, 0.76)), 0.5 * mod(floor(xl / 0.14), 2.0)), pm * detail);
      }
    }
    pcol *= 1.0 - 0.03 * float(wear);
    diffuseColor.rgb = pcol;
  } else {
  // ------------------------------------------------------------------ per-arch window grammar
  float hw = clamp(bw * 0.215, 0.42, 0.72), hh = 0.8, sill = 0.9, sw = 0.0;    // half width, half height, sill (m above the floor), surround width
  int head = 0, sur = 0, wcount = 1;
  float pairOff = 0.6, nType = 0.0; bool nFeat = false, oAttic = false;
  float rr = h21(id * 1.7 + S * 3.1);
  bool stucco = (arch == 1 || arch == 2 || arch == 4 || arch == 5 || arch == 6 || arch == 7 || arch == 10);
  if (arch == 1) {            // CLASSIC: flat pilaster strips, pediments on the piano nobile, modillion cornice
    if (fcls == 0) { hh = fh * 0.24; sill = fh * 0.30; sw = 0.10; sur = 1; head = rr < 0.3 ? 2 : 0; }
    else if (fcls == 1) { hh = fh * 0.30; sill = fh * 0.12; sw = 0.20; sur = (mod(bi, 2.0) < 0.5) ? 2 : 3; hw *= 1.04; }
    else if (fcls == 2) { hh = fh * 0.27; sill = fh * 0.24; sw = 0.14; sur = 4; }
    else { hh = fh * 0.22; sill = fh * 0.30; sw = 0.10; sur = 1; }
  } else if (arch == 2 || arch == 10) {      // ECLECTIC (Nevsky 108 type): white surrounds, pediments on the piano nobile, lintels above, sills with brackets
    if (fcls == 0) { hh = fh * 0.17; sill = fh * 0.33; sw = 0.12; sur = 1; head = rr < 0.3 ? 2 : 0; }
    else if (fcls == 1) { hh = fh * 0.255; sill = fh * 0.085; sw = 0.26; sur = (rr < 0.55) ? 2 : 3; hw *= 1.05; }
    else if (fcls == 2) { hh = fh * 0.265; sill = fh * 0.22; sw = 0.19; sur = 4; }
    else { hh = fh * 0.22; sill = fh * 0.30; sw = 0.17; sur = 1; }
  } else if (arch == 4) {                    // TENEMENT with erkers and rich stucco: hoods and garlands, round heads on the top floor
    if (fcls == 0) { hh = fh * 0.17; sill = fh * 0.32; sw = 0.12; sur = 1; head = 2; }
    else if (fcls == 1) { hh = fh * 0.26; sill = fh * 0.09; sw = 0.22; sur = 5; head = rr < 0.4 ? 2 : 0; }
    else if (fcls == 2) { hh = fh * 0.26; sill = fh * 0.22; sw = 0.17; sur = 4; }
    else { hh = fh * 0.24; sill = fh * 0.26; sw = 0.14; sur = 1; head = 1; hw *= 0.92; }
  } else if (arch == 5) {                    // NOUVEAU: windows of several shapes, smooth pale stucco, thin surrounds
    float k = h21(id * 2.3 + S * 7.0);
    if (fcls == 0) { hh = fh * 0.15; sill = fh * 0.38; sw = 0.06; sur = 1; head = 0; hw *= 0.95; }
    else if (k < 0.4) { hh = fh * 0.28; sill = fh * 0.12; sw = 0.10; sur = 1; head = 0; }
    else if (k < 0.7) { hh = fh * 0.26; sill = fh * 0.16; sw = 0.12; sur = 1; head = 1; }
    else { hh = fh * 0.22; sill = fh * 0.22; sw = 0.08; sur = 1; head = 2; hw *= 1.1; }
    if (fcls == 3) { head = 1; hh = fh * 0.25; }
  } else if (arch == 6) {                    // NEOCLASSIC with a giant order: plain framed windows between the half columns
    if (fcls == 0) { hh = fh * 0.19; sill = fh * 0.30; sw = 0.10; sur = 1; }
    else if (fcls == 1) { hh = fh * 0.27; sill = fh * 0.10; sw = 0.16; sur = 4; }
    else { hh = fh * 0.26; sill = fh * 0.22; sw = 0.12; sur = 1; }
  } else if (arch == 7) {                    // STALIN infill: regular, flat frames, big arched ground floor windows
    hw = clamp(bw * 0.2, 0.5, 0.7);
    if (fcls == 0) { hh = fh * 0.30; sill = fh * 0.18; sw = 0.14; sur = 1; head = 1; hw = clamp(bw * 0.3, 0.6, 1.0); }
    else if (fcls == 3) { hh = fh * 0.24; sill = fh * 0.26; sw = 0.12; sur = 1; }
    else { hh = fh * 0.26; sill = fh * 0.22; sw = 0.12; sur = 1; }
  } else if (arch == 3) {                    // BRICK style: segmental arches in lighter brick, stone sills
    hw = clamp(bw * 0.2, 0.45, 0.6);
    if (fcls == 0) { hh = fh * 0.24; sill = fh * 0.28; sw = 0.12; sur = 1; head = 2; }
    else if (fcls == 3) { hh = fh * 0.22; sill = fh * 0.28; sw = 0.12; sur = 1; head = 2; }
    else { hh = fh * 0.26; sill = fh * 0.2; sw = 0.14; sur = 1; head = 2; }
  } else if (arch == 8) {                    // PANEL: squarish paired windows
    hw = clamp(bw * 0.24, 0.5, 0.8);
    hh = fh * 0.22; sill = fh * 0.30; sw = 0.04; sur = 0; if (fcls == 0) { hh = fh * 0.22; sill = fh * 0.34; }
  } else if (arch == 9) {                    // MODERN infill: big glazing, thin frames
    hw = clamp(bw * 0.36, 0.7, 1.2);
    hh = fh * 0.32; sill = fh * 0.2; sw = 0.03; sur = 0; if (fcls == 0) { hh = fh * 0.34; sill = fh * 0.12; }
  } else if (arch == 11) {                   // COURT: plain paired windows, no trim
    hw = clamp(bw * 0.19, 0.4, 0.55); hh = fh * 0.24; sill = fh * 0.30; sw = 0.0; sur = 0; wcount = (bw > 2.4) ? 2 : 1;
    if (fcls == 0) { hh = fh * 0.17; sill = fh * 0.40; }
  } else if (arch == 12) {                   // SERVICE: small windows
    hw = clamp(bw * 0.16, 0.3, 0.5); hh = fh * 0.14; sill = fh * 0.5; sw = 0.04; sur = 1;
  } else if (arch == 13) {                   // ERKER faces
    hw = clamp(bw * 0.3, 0.3, 0.6); hh = fh * 0.30; sill = fh * 0.14; sw = 0.06; sur = 1; if (fcls == 3) head = 1;
  } else if (arch == 16) {                   // NORDIC: bay groups of two share a window type (slim pair / single / segmental), feature bays carry a wide three-light window
    nType = h21(vec2(floor((bi + i0h + 1.0) * 0.5), S * 13.0 + 2.0));
    nFeat = ((featM >> li) & 1) != 0;
    sur = 1; sw = 0.075;
    if (fcls == 0) { hh = fh * 0.19; sill = fh * 0.40; head = 2; hw = clamp(bw * 0.19, 0.4, 0.62); sw = 0.0; sur = 0; }
    else if (nFeat) { hw = clamp(bw * 0.34, 0.75, 1.2); hh = fh * 0.29; sill = fh * 0.13; head = fcls == 3 ? 1 : 0; }
    else if (nType < 0.44 && bw > 2.3) { wcount = 2; pairOff = bw * 0.185; hw = clamp(bw * 0.105, 0.27, 0.40); hh = fh * 0.30; sill = fh * 0.12; head = fcls == 3 ? 1 : 0; }
    else if (nType < 0.80) { hw = clamp(bw * 0.205, 0.42, 0.66); hh = fh * 0.275; sill = fh * 0.15; head = 0; if (fcls == 3) { hh = fh * 0.21; sill = fh * 0.24; } }
    else { hw = clamp(bw * 0.23, 0.45, 0.72); hh = fh * 0.27; sill = fh * 0.15; head = 2; if (fcls == 3) head = 1; }
  } else if (arch == 17) {                   // NEOCLASSIC1910: plain framed windows between the pilasters, keystones on the base, squat attic windows
    hw = clamp(bw * 0.205, 0.45, 0.68);
    oAttic = nFl > 5.5;
    if (fcls == 0) { hh = fh * 0.19; sill = fh * 0.32; sw = 0.0; sur = 0; }
    else if (fcls == 1) { hh = fh * 0.26; sill = fh * 0.14; sw = 0.10; sur = 4; }
    else if (fcls == 3 && oAttic) { hh = fh * 0.20; sill = fh * 0.26; sw = 0.08; sur = 1; hw *= 0.9; }
    else { hh = fh * 0.27; sill = fh * 0.17; sw = 0.09; sur = fi < 2.5 ? 4 : 1; if (fcls == 3) { hh = fh * 0.24; head = h21(vec2(S * 5.0, 3.0)) < 0.4 ? 1 : 0; } }
  }
  bool balDoor = (fcls == 1) && (((balM >> li) & 1) != 0);
  if (balDoor) { hh = fh * 0.33; sill = fh * 0.02; }
  bool centre = (!bNoCentre) && (float(li) + 0.5 > centreBay) && (float(li) - 0.5 < centreBay) && centreBay >= 0.0;
  if (centre && (arch == 2 || arch == 4 || arch == 1 || arch == 10) && fcls >= 1) { hw *= 1.0; if (fcls == 1) { sur = 3; sw += 0.06; } }
  vec2 hs = vec2(hw, hh);
  vec2 q0 = vec2(xm, fy - sill - hh);                // metres from the window centre (bay centre)

  if (arch == 3 && !bBlank && fcls >= 0) {                  // BRICK style: the plain field is unplastered brick with dark stone bands
    float br = y / 0.083, row = floor(br);
    float bu = (u * bw) / 0.25 + mod(row, 2.0) * 0.5;
    vec2 bf = vec2(fract(bu), fract(br));
    float mortar = max(box1(min(bf.x, 1.0 - bf.x) * 0.25 - 0.004, aa * 0.5), box1(min(bf.y, 1.0 - bf.y) * 0.083 - 0.004, aa * 0.5));
    float bv = h21(vec2(floor(bu), row) + S * 3.0);
    vec3 bcol = wall * (0.86 + 0.28 * bv);
    bcol = mix(bcol, wall * 1.25 + vec3(0.03), mortar * detail * 0.5);
    float stone = box1(abs(y - yG1) - 0.14, aa) + box1(abs(y - yPN1) - 0.09, aa) + box1(abs(y - (Hc - 0.55)) - 0.28, aa);
    wall = mix(bcol, sr(vec3(0.42, 0.40, 0.39)), clamp(stone, 0.0, 1.0));
    trim = mix(sr(vec3(0.80, 0.76, 0.66)), wall, 0.2);
    col = wall; avgc = wall;
  }

  // ------------------------------------------------------------------ painting
  if (fcls < 0) {
    // ---- granite plinth
    float ym = plinth - y;
    float jh = box1(abs(fract(y / 0.5) - 0.5) * 0.5 - 0.01, aa * 0.6);
    col = uPlinthC * (0.92 + 0.2 * h21(vec2(floor(u * 3.0), S))) * (1.0 - 0.12 * pn);
    col = mix(col, col * 0.78, jh * detail);
    col = mix(col, col * 1.35, (1.0 - smoothstep(0.0, 0.07, ym)) * 0.5);
    avgc = col;
  } else if (bBlank) {
    // ---- party wall / firewall: patched plaster with brick showing, soot, a few small blind windows
    float pat = smoothstep(0.55, 0.62, vnoise(vec2(u * bw, y) * 0.35 + S * 9.0));
    vec3 brick = sr(vec3(0.62, 0.38, 0.30)) * (0.85 + 0.3 * h21(floor(vec2(u * bw / 0.25, y / 0.083)) + S));
    col = mix(wall * 0.86, brick, pat * 0.8);
    float soot = 1.0 - smoothstep(0.0, 6.0, Hc - y);
    col *= 1.0 - 0.10 * soot;
    float jb = max(box1(abs(fract(y / 0.5) - 0.5) * 0.5 - 0.01, aa * 0.5), 0.0);
    col = mix(col, col * 0.88, jb * 0.5 * detail);
    avgc = col;
  } else {
    // ======================================================== STOREYS
    float inFrieze = step(Hc - 0.85, y);
    // ---- ground floor paint
    vec3 gcol = wall;
    if (fcls == 0 && arch != 13) {
      vec3 tintC = gfTint == 1 ? sr(vec3(0.43, 0.40, 0.37)) : (gfTint == 2 ? sr(vec3(0.74, 0.40, 0.29)) : (gfTint == 3 ? sr(vec3(0.88, 0.84, 0.74)) : wall));
      gcol = mix(wall, tintC, gfTint == 0 ? 0.0 : 0.8) * (gfTint == 0 ? 0.93 : 1.0);
      if (arch == 5 || arch == 6 || arch == 4) {            // ashlar blocks 0.9 x 0.45
        float row = floor((y - plinth) / 0.45);
        float bx = fract((u * bw) / 0.9 + mod(row, 2.0) * 0.5);
        float jj = max(box1(min(bx, 1.0 - bx) * 0.9 - 0.012, aa * 0.6), box1(abs(fract((y - plinth) / 0.45) - 0.5) * 0.45 - 0.2 + 0.19, aa * 0.6));
        gcol *= 1.0 - 0.20 * jj * detail;
        gcol *= 0.94 + 0.10 * h21(vec2(floor((u * bw) / 0.9 + mod(row, 2.0) * 0.5), row) + S);
      } else {                                                // channelled rustication: horizontal grooves every 0.6 m
        float gr = box1(abs(fract((y - plinth) / 0.6) - 0.5) * 0.6 - 0.265, aa * 0.6);
        gcol *= 1.0 - 0.17 * gr * detail;
      }
    }
    col = (fcls == 0 && arch != 13) ? gcol : wall;
    if (arch == 16) {
      // ======== NORDIC: roughcast field, smooth light bands (lesenes at the feature bays, band under the top storey, frieze), stepped granite socle, majolica band
      vec3 smoothC = tcls == 0 ? mix(wall, vec3(0.90, 0.88, 0.82), 0.34) : trim;
      float sp = h21(floor(vec2(u * bw, y) / 0.05) + S * 7.0);
      vec3 rough = wall * (0.90 + 0.13 * sp * detail + 0.065 * (1.0 - detail));
      float yTopF = nFl > 3.5 ? yPN1 + (nUp - 1.0) * UFh : Hc;
      col = rough;
      // socle: rough-hewn granite blocks; low (a little over the plinth) on plain bays, up to the top of the ground floor at feature bays, doors and some bay pairs
      float soH = plinth;
      if (bSocle) { bool up = nFeat || (((doorM >> li) & 1) != 0) || h21(vec2(floor((bi + i0h) * 0.5), S * 3.0 + 9.0)) < 0.34; soH = up ? yG1 - 0.02 : plinth + Gh * 0.42; }
      if (y < yG1) {
        vec3 gr = h21(vec2(S * 11.0, 4.0)) < 0.30 ? sr(vec3(0.58, 0.46, 0.42)) : sr(vec3(0.56, 0.55, 0.54));
        float gR = floor(y / 0.47), gX = (u * bw) / (0.78 + 0.5 * h21(vec2(gR, S * 5.0))) + mod(gR, 2.0) * 0.5;
        float gv = h21(vec2(floor(gX), gR) + S * 3.0);
        float gj = max(box1(min(fract(gX), 1.0 - fract(gX)) * 0.9 - 0.028, aa * 0.5), box1(min(fract(y / 0.47), 1.0 - fract(y / 0.47)) * 0.47 - 0.028, aa * 0.5));
        vec3 block = gr * (0.80 + 0.36 * gv) * (1.0 - 0.34 * gj * detail);
        vec3 plain = mix(rough * 0.90, smoothC * 0.92, box1(abs(fract((y - plinth) / 0.62) - 0.5) * 0.62 - 0.285, aa * 0.6) * detail * 0.5);
        gcol = y < soH ? block : plain;
        col = gcol;
        col = mix(col, gr * 0.62, box1(abs(y - soH) - 0.035, aa) * (bSocle ? 1.0 : 0.0) * detail);
      } else {
        // lesene strips flanking the feature bays, from the ground-floor string course to the frieze
        if (nFeat) col = mix(col, smoothC, max(box1((xm + bw * 0.5) - 0.34, aa), box1((bw * 0.5 - xm) - 0.34, aa)));
        col = mix(col, smoothC, box1(abs(y - yG1 - 0.10) - 0.10, aa) * detail);                       // string course over the ground floor
        col *= 1.0 - 0.14 * box1(abs(y - yG1 + 0.05) - 0.04, aa) * detail;
        if (nFl > 3.5) {
          float bandLo = yTopF - 0.62, bandHi = yTopF - 0.06;
          if (bMaj) {                                                                               // glazed tile band: two-tone tiles 14 cm, set between smooth rules
            float mk = h21(vec2(S * 17.0, 8.0));
            vec3 t1 = mk < 0.42 ? sr(vec3(0.30, 0.62, 0.60)) : (mk < 0.70 ? sr(vec3(0.26, 0.47, 0.58)) : (mk < 0.86 ? sr(vec3(0.44, 0.58, 0.34)) : sr(vec3(0.74, 0.52, 0.24))));
            vec3 t2 = mix(t1, sr(vec3(0.92, 0.88, 0.76)), 0.72);
            vec2 tc = vec2(u * bw, y - bandLo) / 0.14;
            float chk = mod(floor(tc.x) + floor(tc.y), 2.0);
            float dia = step(abs(fract(tc.x * 0.25) - 0.5) + abs(fract((y - bandLo) / 0.56) - 0.5) * 0.5, 0.26);
            vec3 tile = mix(mix(t1, t2, chk * 0.55), t2, dia) * (1.0 - 0.16 * max(box1(min(fract(tc.x), 1.0 - fract(tc.x)) * 0.14 - 0.006, aa * 0.5), box1(min(fract(tc.y), 1.0 - fract(tc.y)) * 0.14 - 0.006, aa * 0.5)) * detail);
            float inB = step(bandLo, y) * step(y, bandHi);
            col = mix(col, mix(t1 * 0.8 + t2 * 0.2, tile, detail), inB);
            col = mix(col, smoothC, max(box1(abs(y - bandLo) - 0.035, aa), box1(abs(y - bandHi) - 0.035, aa)) * detail);
          } else {
            col = mix(col, smoothC, box1(abs(y - yTopF + 0.16) - 0.11, aa) * detail);              // smooth band under the top storey
          }
        }
        // frieze: a smooth band with small square vents, a dark shadow line under the eaves
        float fzN = step(Hc - 0.85, y);
        vec3 fzC = smoothC * (1.0 - 0.10 * box1(max(abs(fract(u * bw / 1.1) - 0.5) * 1.1 - 0.11, abs(y - (Hc - 0.42)) - 0.11), aa) * detail);
        col = mix(col, fzC, fzN);
        col = mix(col, smoothC * 0.78, box1(abs(y - (Hc - 0.85)) - 0.035, aa) * detail);
        if (qL) col = mix(col, smoothC, box1(u * bw - 0.36, aa) * (1.0 - fzN));
        if (qR) col = mix(col, smoothC, box1((Nseg - u) * bw - 0.36, aa) * (1.0 - fzN));
      }
      trim = smoothC;
    } else if (arch == 17) {
      // ======== NEOCLASSIC1910: banded base of two storeys, giant pilasters with bases and capitals, spandrel medallions / garlands, entablature, attic storey above the order on 6+ storeys
      // the order: white / cream on a coloured front; on a stone-grey terrazite front (trim class 2) it is the same stone, so it is drawn a tone lighter than the field and gets a shadow edge
      vec3 stone = tcls == 2 ? mix(wall, vec3(0.86, 0.85, 0.82), 0.34) : trim;
      float fieldK = tcls == 2 ? 0.90 : 1.0;
      trim = stone;
      float yOrd0 = PNh > 0.1 ? yPN1 : yG1;                                                    // top of the base = foot of the order
      float yOrd1 = oAttic ? yPN1 + (nUp - 1.0) * UFh - 0.42 : Hc - 0.85;                      // underside of the entablature
      if (y < yOrd0) {
        vec3 base = (fcls == 0 ? gcol : wall * 0.93);
        if (fcls == 1) base *= 1.0 - 0.15 * box1(abs(fract((y - yG1) / 0.6) - 0.5) * 0.6 - 0.265, aa * 0.6) * detail;
        col = base;
        gcol = base;
      } else {
        col = wall * fieldK;
        float dB = bw * 0.5 - abs(xm);                                                          // distance to the nearest bay boundary = the pilaster axis
        float pwid = clamp(bw * 0.11, 0.25, 0.36);
        float inO = step(yOrd0 + 0.14, y) * step(y, yOrd1);
        float yb = y - yOrd0 - 0.14, yc = yOrd1 - y;
        float wid = pwid + (yb < 0.34 ? 0.07 : 0.0) + (yc < 0.46 ? 0.09 : 0.0) + (yc < 0.14 ? 0.07 : 0.0);
        float pil = box1(dB - wid, aa) * inO;
        float flute = box1(abs(fract(dB / 0.085 + 0.5) - 0.5) * 0.085 - 0.012, aa * 0.6) * step(0.34, yb) * step(0.46, yc);
        float roundS = bSocle ? 0.16 * (dB / max(wid, 0.01)) : 0.0;                              // half-columns: darker towards the edge
        vec3 pc = stone * (0.99 - 0.09 * flute * detail - roundS);
        pc = mix(pc, stone * 0.80, (box1(abs(yc - 0.46) - 0.025, aa) + box1(abs(yc - 0.14) - 0.02, aa) + box1(abs(yb - 0.34) - 0.025, aa)) * detail);
        pc = mix(pc, stone * 0.76, box1(length(vec2(dB - wid * 0.60, yc - 0.30)) - 0.085, aa) * step(yc, 0.46) * detail);          // volute of the capital
        // spandrels: a medallion or a garland under the windows of the order floors
        if (fcls >= 2 && fy < sill - 0.10 && y < yOrd1) {
          float mk = h21(vec2(bi + i0h, fi * 3.0 + S * 9.0));
          vec2 sq = vec2(xm, fy - sill * 0.5);
          float orn = 0.0;
          if (mk < 0.34) orn = box1(abs(length(sq) - min(0.23, sill * 0.36)) - 0.04, aa);
          else if (mk < 0.72) { float sag = sq.y + 0.10 - 0.55 * sq.x * sq.x; orn = box1(abs(sag) - 0.045, aa) * step(abs(sq.x), 0.52) + box1(length(vec2(abs(sq.x) - 0.52, sq.y - 0.05)) - 0.07, aa); }
          else orn = box1(max(abs(abs(sq.x) - (hw - 0.02)) - 0.03, abs(sq.y) - sill * 0.30), aa) + box1(max(abs(sq.x) - hw, abs(abs(sq.y) - sill * 0.30) - 0.03), aa);
          col = mix(col, stone * 0.97, clamp(orn, 0.0, 1.0) * detail * (bRich ? 1.0 : 0.75));
        }
        col *= 1.0 - 0.22 * box1(abs(dB - wid - 0.04) - 0.04, aa) * inO * detail;                // the shadow the pilaster casts on the field
        col = mix(col, pc, pil);
        // entablature of the order: architrave + frieze + dentil cornice; the attic storey above it has small panels between the windows
        if (oAttic) {
          float e0 = yOrd1, e1 = yOrd1 + 0.42;
          float inE = step(e0, y) * step(y, e1);
          col = mix(col, stone * (0.98 - 0.10 * step(0.5, fract(u * bw / 0.30)) * step(e0 + 0.27, y) * detail), inE);
          col = mix(col, stone * 0.80, box1(abs(y - e0 - 0.13) - 0.02, aa) * detail);
          if (y > e1 && y < Hc - 0.85) col = mix(col, stone * 0.97, box1(max(abs(dB) - 0.34, abs(y - (e1 + Hc - 0.85) * 0.5) - (Hc - 0.85 - e1) * 0.36), aa) * detail);
        }
        float fzN = step(Hc - 0.85, y);
        float dent = step(0.5, fract(u * bw / 0.34)) * step(0.50, y - (Hc - 0.85));
        col = mix(col, stone * (0.98 - 0.10 * dent * detail), fzN);
        col = mix(col, stone * 0.80, box1(abs(y - (Hc - 0.85)) - 0.04, aa) * detail);
      }
      // string course / balcony cornice on top of the base, a lighter one over the ground floor
      col = mix(col, stone * 0.97, (box1(abs(y - yOrd0) - 0.16, aa) + box1(abs(y - yOrd0 - 0.24) - 0.035, aa)) * detail);
      col *= 1.0 - 0.17 * box1(abs(y - yOrd0 + 0.27) - 0.06, aa) * detail;
      if (PNh > 0.1 && fcls <= 1) col = mix(col, stone * 0.95, box1(abs(y - yG1) - 0.08, aa) * detail);
      // toothed quoins at the wall ends
      if (y < yOrd1 && y > plinth) {
        float qj = step(0.5, fract(y / 0.92));
        if (qL) col = mix(col, stone * (0.98 - 0.06 * qj), box1(u * bw - (0.36 + 0.14 * qj), aa) * detail);
        if (qR) col = mix(col, stone * (0.98 - 0.06 * qj), box1((Nseg - u) * bw - (0.36 + 0.14 * qj), aa) * detail);
      }
    }

    // ---- vertical members: corner pilasters (quoins), lesenes, giant order
    if (fcls >= 1) {
      float dl = u * bw, dr = (Nseg - u) * bw;
      float endStrip = 0.0;
      if (qL) endStrip = max(endStrip, box1(dl - 0.42, aa));
      if (qR) endStrip = max(endStrip, box1(dr - 0.42, aa));
      float qj = box1(abs(fract(y / 0.55) - 0.5) * 0.55 - 0.255, aa * 0.5);
      col = mix(col, trim * (0.97 - 0.07 * qj * detail), endStrip * (stucco ? 1.0 : 0.0));
    }
    if (arch == 6 && fcls >= 1 && fcls <= 3) {                 // giant half columns at every 2nd bay boundary
      float dB = mod(bi, 2.0) < 0.5 ? abs(xm + bw * 0.5) : abs(bw * 0.5 - xm);
      col = mix(col, trim * 0.96, box1(dB - 0.30, aa) * step(yG1 + 0.6, y) * step(y, Hc - 1.0));
    }
    // ---- belt courses: a heavy string course on top of the ground floor, a thin one under the top storeys, and sill lines
    if (stucco || arch == 3) {
      float sc1 = box1(abs(y - yG1) - 0.18, aa) + box1(abs(y - yG1 - 0.28) - 0.04, aa);
      col = mix(col, trim * 0.96, clamp(sc1, 0.0, 1.0) * detail);
      float sh1 = box1(abs(y - yG1 + 0.30) - 0.07, aa);
      col *= 1.0 - 0.17 * sh1 * detail;
      if (nFl > 3.5) { float sc2 = box1(abs(y - yPN1) - 0.07, aa); col = mix(col, trim * 0.94, sc2 * detail); }
    }
    // ---- frieze under the cornice: trim band with relief (modillions / dentils / garlands)
    if (stucco || arch == 3 || arch == 8 || arch == 9) {
      float fz = inFrieze;
      float s = u * bw;
      float rel = 0.0;
      if (arch == 1 || arch == 6 || arch == 7) rel = step(0.5, fract(s / 0.34)) * step(0.50, y - (Hc - 0.85));            // dentils
      else rel = 0.5 + 0.5 * sin(s * 7.0 + sin(s * 2.3) * 1.5) ;                                                         // scroll / garland
      vec3 fcol = trim * (0.98 - 0.10 * rel * (bRich || arch != 2 ? 1.0 : 0.6));
      fcol = mix(fcol, trim * 0.80, box1(abs(y - (Hc - 0.85)) - 0.04, aa));
      if (arch == 3 || arch == 8 || arch == 9) fcol = col * 0.85;
      col = mix(col, fcol, fz * (arch == 8 || arch == 9 ? 0.0 : 1.0));
    }
    // ---- windows (not inside the frieze band)
    float inWin = step(y, Hc - 0.9);
    vec3 fe = vec3(0.0);
    float wcov = 0.0;
    bool shopHere = bShop && fcls == 0 && !bGate;
    bool doorHere = fcls == 0 && !bGate && (((doorM >> li) & 1) != 0);
    bool stairHere = arch == 11 && fcls >= 1 && (((sdoorM >> li) & 1) != 0);
    float wdist = 0.0;
    if (stairHere && inWin > 0.5) {                                          // glazed stair tower of a courtyard: white aluminium lattice, full height
      float inS = box1(abs(xm) - 0.95, aa);
      float ml = box1(abs(fract(xm / 0.95 + 0.5) - 0.5) * 0.95 - 0.022, aa) + box1(abs(fract(fy / (fh * 0.5)) - 0.5) * fh * 0.5 - fh * 0.25 + 0.028, aa);
      vec3 sg = mix(uGlassLo, uGlassHi, 0.30 + 0.45 * h21(floor(vec2(xm / 0.95 + 5.0, y / (fh * 0.5))) + S * 3.0));
      sg = mix(sg, sr(vec3(0.92)), clamp(ml, 0.0, 1.0));
      col = mix(col, sg, inS);
      wEmis += vec3(1.0, 0.8, 0.5) * night * inS * 0.35 * step(0.6, h21(vec2(floor(y / (fh * 0.5)), S * 5.0))) * (1.0 - clamp(ml, 0.0, 1.0));
    }
    if (!shopHere && !doorHere && !stairHere && fcls >= 0 && inWin > 0.5) {
      for (int wi = 0; wi < 2; wi++) {
        if (wi >= wcount) break;
        float off = wcount == 2 ? (wi == 0 ? -pairOff : pairOff) : 0.0;
        vec2 q = vec2(xm - off, fy - sill - hh);
        vec2 hs2 = wcount == 2 ? vec2(hw, hh) : hs;
        // surround (flat frame), pediment / lintel / hood above, sill with brackets below
        if (sur > 0) {
          float sM = box1(winD(q, hs2 + vec2(sw), head), aa);
          col = mix(col, trim * 0.99, sM * detail);
          if (sur == 2 || sur == 3) {
            float halfW = hs2.x + sw + 0.14, topY = hs2.y + sw, ph = sur == 2 ? 0.72 : 0.58;
            float dy = q.y - topY, lim = sur == 2 ? ph * (1.0 - abs(q.x) / halfW) : ph * sqrt(max(1.0 - q.x * q.x / (halfW * halfW), 0.0));
            float pm = box1(max(-dy, dy - lim), aa);
            col = mix(col, trim, pm * detail);
            float dy2 = dy - 0.09; float lim2 = sur == 2 ? (ph - 0.16) * (1.0 - abs(q.x) / (halfW - 0.2)) : (ph - 0.15) * sqrt(max(1.0 - q.x * q.x / ((halfW - 0.2) * (halfW - 0.2)), 0.0));
            float pi2 = box1(max(-dy2, dy2 - lim2), aa) * pm;
            col = mix(col, wall * 0.78, pi2 * detail);
            col = mix(col, trim * 0.78, box1(abs(dy + 0.02) - 0.03, aa) * box1(abs(q.x) - halfW, aa) * detail);
          } else if (sur == 4 || sur == 5) {
            float halfW = hs2.x + sw + 0.12, topY = hs2.y + sw;
            float lintel = box1(max(abs(q.x) - halfW, abs(q.y - topY - 0.12) - 0.12), aa);
            col = mix(col, trim * 0.99, lintel * detail);
            float keyb = box1(max(abs(q.x) - 0.12, abs(q.y - topY - 0.15) - 0.19), aa);
            col = mix(col, trim * 0.90, keyb * detail * (sur == 4 ? 1.0 : 0.0));
            if (sur == 5) {                                   // hood: bracketed cornice slab with a stucco head (disc)
              float slab = box1(max(abs(q.x) - halfW - 0.1, abs(q.y - topY - 0.34) - 0.06), aa);
              col = mix(col, trim * 0.96, slab * detail);
              col = mix(col, trim * 0.82, box1(length(vec2(q.x, q.y - topY - 0.16)) - 0.09, aa) * detail);
            }
            col *= 1.0 - 0.16 * box1(max(abs(q.x) - halfW, abs(q.y - topY + 0.06) - 0.06), aa) * (1.0 - lintel) * detail;
          }
          if (fcls >= 1 && (sur == 2 || sur == 3 || sur == 5 || sur == 4)) {
            float sillR = box1(max(abs(q.x) - hs2.x - sw - 0.08, abs(q.y + hs2.y + sw + 0.07) - 0.07), aa);
            col = mix(col, trim * 0.98, sillR * detail);
            if (fcls == 1) {
              float br = max(box1(max(abs(abs(q.x) - (hs2.x + sw - 0.06)) - 0.07, abs(q.y + hs2.y + sw + 0.34) - 0.17), aa), 0.0);
              col = mix(col, trim * 0.92, br * detail);
            }
            col *= 1.0 - 0.18 * box1(max(abs(q.x) - hs2.x - sw, abs(q.y + hs2.y + sw + 0.20) - 0.05), aa) * (1.0 - sillR) * detail;
          }
        }
        float cov; vec3 e1;
        vec3 wc = windowCol(q, hs2, head, id + vec2(float(wi) * 7.0, 0.0), S, aa, uGlassLo, uGlassHi, lit, night, cov, e1);
        if (arch == 16 && fcls >= 1) {
          float r3n = h21((id + vec2(float(wi) * 7.0, 0.0)) * 0.73 + S * 8.3 + 11.0);
          vec3 fcn = r3n < 0.62 ? sr(vec3(0.94, 0.93, 0.89)) : (r3n < 0.88 ? sr(vec3(0.42, 0.29, 0.21)) : sr(vec3(0.30, 0.36, 0.33)));
          float inG = box1(winD(q, hs2 - vec2(0.055), head), aa);
          float up = step(hs2.y * 0.34, q.y);
          float pane = max(box1(abs(fract(q.x / 0.20 + 0.5) - 0.5) * 0.20 - 0.011, aa), box1(abs(fract((q.y - hs2.y) / 0.20 + 0.5) - 0.5) * 0.20 - 0.011, aa)) * up;
          pane = max(pane, box1(abs(q.y - hs2.y * 0.34) - 0.022, aa));
          if (nFeat) pane = max(pane, box1(abs(abs(q.x) - hs2.x * 0.36) - 0.024, aa));
          wc = mix(wc, fcn, clamp(pane, 0.0, 1.0) * inG * detail);
        }
        // brick style: lighter arch ring (rowlock)
        col = mix(col, wc, cov);
        fe += e1; wcov = max(wcov, cov);
        // rain streak below the window
        float below = -(q.y + hs2.y);
        float streak = box1(abs(q.x) - hs2.x * 0.8, aa) * step(0.0, below) * (1.0 - smoothstep(0.0, 1.2, below));
        col *= 1.0 - 0.06 * streak * float(wear + 1) * detail;
      }
      wEmis += fe;
    }
    if (arch == 13 && !bSocle && fy < sill - 0.03 && inWin > 0.5) {           // erker spandrel: glazed tile panel (turquoise / cream) with a 20 cm grid (bit SOCLE on an erker face = plain stucco spandrels: the NORDIC bays without majolica)
      vec3 tc = h21(vec2(i0h, S * 9.0)) < 0.5 ? sr(vec3(0.40, 0.68, 0.68)) : sr(vec3(0.86, 0.84, 0.76));
      float tg = max(box1(abs(fract(xm / 0.2 + 0.5) - 0.5) * 0.2 - 0.006, aa * 0.5), box1(abs(fract(fy / 0.2) - 0.5) * 0.2 - 0.094, aa * 0.5));
      col = mix(col, tc * (1.0 - 0.18 * tg * detail), 0.9 * step(0.04, fy));
    }
    // ---- ground floor: shop front / parade door
    if (fcls == 0 && arch != 13) {
      float pierW = 0.30;
      if (shopHere) {
        float gLo = plinth + 0.55, signLo = yG1 - 1.0, signHi = yG1 - 0.14, gHi = signLo - 0.32;
        bool pierHere = (((pierM >> li) & 1) != 0) || bi < 0.5;
        float px = pierHere ? (xm + bw * 0.5) : 99.0;            // distance from the left edge of this bay
        float pierMask = box1(px - 0.28, aa) + (lastBay ? box1((bw * 0.5 - xm) - 0.28, aa) : 0.0);
        pierMask = clamp(pierMask, 0.0, 1.0);
        float glassM = step(gLo, y) * step(y, gHi) * (1.0 - pierMask);
        float signM = step(signLo, y) * step(y, signHi);
        float xl = u * bw;
        // the unit this bay belongs to: the last pier at or left of it
        int ustart = 0; for (int k = 0; k < 24; k++) { if (k > li) break; if (((pierM >> k) & 1) != 0) ustart = k; }
        float uid = float(ustart) + i0h * 0.37 + S * 17.0;
        float ru = h21(vec2(uid, 3.1)), ru2 = h21(vec2(uid, 7.7)), ru3 = h21(vec2(uid, 11.3));
        float yy = clamp((y - gLo) / (gHi - gLo), 0.0, 1.0);
        vec3 inn; float bright = 0.5;
        if (ru < 0.28) {                                          // cafe: warm cream wall, dark wood tables, pendant lamps
          inn = mix(sr(vec3(0.74, 0.62, 0.44)), sr(vec3(0.93, 0.86, 0.70)), yy);
          inn = mix(inn, sr(vec3(0.30, 0.20, 0.14)), step(yy, 0.30) * 0.85);
          float lampD = length(vec2(fract(xl / 1.1 + 0.5) - 0.5, (yy - 0.78) * 0.9)); inn = mix(inn, sr(vec3(1.0, 0.92, 0.7)), 1.0 - smoothstep(0.05, 0.1, lampD));
          bright = 0.8;
        } else if (ru < 0.50) {                                   // boutique: pale walls, shelves, dark mannequin silhouettes
          inn = mix(sr(vec3(0.46, 0.45, 0.47)), sr(vec3(0.74, 0.72, 0.68)), yy);
          inn = mix(inn, sr(vec3(0.30, 0.29, 0.32)), box1(abs(fract(yy * 3.0 + 0.1) - 0.5) * 0.3 - 0.012, aa) * 0.8);
          float mq = step(0.55, h21(vec2(floor(xl / 0.9), uid))) * box1(abs(fract(xl / 0.9) - 0.5) * 0.9 - 0.2, aa) * step(yy, 0.62);
          inn = mix(inn, sr(vec3(0.20, 0.20, 0.24)), mq * 0.8);
          bright = 0.9;
        } else if (ru < 0.66) {                                   // grocery: green-white shelves
          inn = mix(sr(vec3(0.70, 0.78, 0.70)), sr(vec3(0.95, 0.96, 0.92)), yy);
          float sh = abs(fract(yy * 4.0) - 0.5);
          inn = mix(inn, vec3(h21(vec2(floor(xl / 0.35), floor(yy * 4.0) + uid)), 0.55, 0.45) * 0.6, step(0.5, h21(vec2(floor(xl / 0.35), floor(yy * 4.0)))) * step(sh, 0.4) * 0.65);
          bright = 0.9;
        } else if (ru < 0.80) {                                   // bar: dark wood, orange lamps
          inn = mix(sr(vec3(0.16, 0.10, 0.08)), sr(vec3(0.34, 0.22, 0.14)), yy);
          float lampD = length(vec2(fract(xl / 0.9 + 0.5) - 0.5, (yy - 0.75) * 0.8)); inn = mix(inn, sr(vec3(1.0, 0.62, 0.25)), 1.0 - smoothstep(0.04, 0.09, lampD));
          bright = 0.55;
        } else if (ru < 0.86) {                                   // empty / for rent: paper on the glass, a red poster
          inn = sr(vec3(0.62, 0.62, 0.58)) * (0.85 + 0.1 * yy);
          inn = mix(inn, sr(vec3(0.36, 0.35, 0.32)), box1(abs(fract(xl / 0.9) - 0.5) * 0.9 - 0.42, aa) * 0.5);
          inn = mix(inn, sr(vec3(0.78, 0.18, 0.18)), box1(max(abs(xm * 1.0) - 0.45, abs(yy - 0.55) - 0.12), aa) * step(0.5, ru2));
          bright = 0.35;
        } else {                                                  // bank / office: frosted blue-grey
          inn = mix(sr(vec3(0.34, 0.42, 0.52)), sr(vec3(0.58, 0.66, 0.74)), yy);
          inn = mix(inn, sr(vec3(0.22, 0.28, 0.36)), box1(abs(fract(yy * 15.0) - 0.5) * 0.07 - 0.012, aa) * 0.55);          // horizontal blinds
          inn = mix(inn, sr(vec3(0.85)), box1(abs(yy - 0.45) - 0.03, aa) * 0.4);
          bright = 0.6;
        }
        // depth cues: dark floor, shaded ceiling, a row of ceiling lamps: the pane reads as a room behind glass, not as a hole onto the sky
        inn *= 1.0 - 0.22 * smoothstep(0.80, 1.0, yy) - 0.30 * (1.0 - smoothstep(0.0, 0.16, yy));
        inn = mix(inn, sr(vec3(1.0, 0.95, 0.80)), box1(max(abs(fract(xl / 1.9 + 0.5) - 0.5) * 1.9 - 0.5, abs(yy - 0.93) - 0.012), aa) * 0.75 * step(ru, 0.9));
        // window stickers / posters at eye level
        float pc = h21(floor(vec2(xl / 0.62, yy * 3.0)) + uid * 3.0);
        vec3 pcol = pc < 0.95 ? sr(vec3(0.86, 0.80, 0.30)) : sr(vec3(0.82, 0.22, 0.22));
        inn = mix(inn, pcol, step(0.955, pc) * step(0.2, yy) * step(yy, 0.75) * box1(max(abs(fract(xl / 0.62) - 0.5) * 0.62 - 0.18, abs(fract(yy * 3.0) - 0.5) * 0.3 - 0.1), aa) * step(ru, 0.9));
        // reflections of the sky / opposite houses: tilted bands, brighter near the top
        float dg = fract((xl + y * 0.9) / 2.8);
        float refl = smoothstep(0.0, 0.04, dg) * (1.0 - smoothstep(0.10, 0.16, dg)) * 0.30 + smoothstep(0.55, 1.0, yy) * 0.12;
        inn *= 0.66;
        inn = mix(inn, uGlassHi * 0.9, clamp(refl, 0.0, 0.38));
        float mx = abs(fract(xl / 1.45 + 0.5) - 0.5) * 1.45;
        float mull = box1(mx - 0.028, aa);
        vec3 shopC = mix(inn, sr(vec3(0.11, 0.11, 0.13)), clamp(mull, 0.0, 1.0));
        float sl = step(h21(id * 2.3 + S * 3.3 + floor(u / 3.0)), 0.55);
        wEmis += vec3(1.0, 0.82, 0.55) * night * glassM * bright * 0.55 * (1.0 - clamp(mull, 0.0, 1.0));
        vec3 sc = gcol;
        // stall riser: dark granite
        vec3 riser = mix(uPlinthC * 0.8, gcol * 0.55, 0.35);
        sc = mix(sc, riser, step(y, gLo) * (1.0 - pierMask));
        sc = mix(sc, shopC, glassM * detail + glassM * (1.0 - detail) * 0.8);
        // transom frame between the glass and the sign board, dark metal
        sc = mix(sc, sr(vec3(0.12, 0.12, 0.14)), step(gHi, y) * step(y, signLo) * (1.0 - pierMask));
        sc = mix(sc, sr(vec3(0.12, 0.12, 0.14)), box1(abs(y - gLo) - 0.03, aa) * (1.0 - pierMask) * detail);
        // sign band (the lettering is geometry): dark / painted board
        float bandc = h21(vec2(floor(u / 3.0) + i0h, S * 11.0));
        vec3 board = bandc < 0.5 ? sr(vec3(0.16, 0.15, 0.15)) : (bandc < 0.68 ? sr(vec3(0.20, 0.14, 0.13)) : (bandc < 0.84 ? sr(vec3(0.89, 0.86, 0.78)) : sr(vec3(0.15, 0.24, 0.19))));
        sc = mix(sc, board, signM);
        sc = mix(sc, trim * 0.9, box1(abs(y - signHi - 0.04) - 0.04, aa) * detail);
        // shop door: glass door in a dark frame at this bay
        if (((sdoorM >> li) & 1) != 0) {
          float dM = box1(max(abs(xm) - 0.56, max(y - (plinth + 2.5), -(y - (plinth + 0.02)))), aa);
          float dIn = box1(max(abs(xm) - 0.48, max(y - (plinth + 2.44), -(y - (plinth + 0.1)))), aa);
          vec3 dglass = mix(inn * 0.75, uGlassHi, 0.18 + 0.2 * smoothstep(0.3, 1.0, (y - plinth) / 2.4));
          dglass = mix(dglass, sr(vec3(0.10, 0.10, 0.12)), box1(abs(xm) - 0.02, aa) + box1(abs(y - (plinth + 1.9)) - 0.02, aa));
          sc = mix(sc, sr(vec3(0.17, 0.17, 0.19)), dM);
          sc = mix(sc, dglass, dIn);
          sc = mix(sc, sr(vec3(0.78, 0.78, 0.76)), box1(max(abs(xm - 0.3) - 0.025, abs(y - (plinth + 1.1)) - 0.28), aa) * detail);   // push bar
        }
        // stone piers between the units
        float pv = box1(abs(abs(xm) - bw * 0.5 + 0.28) - 0.01, aa * 0.6);
        sc = mix(sc, gcol * 0.96, pierMask * step(plinth, y) * step(y, signHi + 0.1));
        col = sc;
        avgc = mix(gcol, shopC, 0.55);
      } else {
        avgc = mix(gcol, uGlassLo, 0.25);
      }
    }
    if (!shopHere && !(fcls == 0)) avgc = mix(wall, mix(uGlassLo, uGlassHi, 0.4), 0.30 * clamp(hw * hh * 4.0 / (bw * fh), 0.0, 1.0) + 0.1);
    if (fcls == 0 && !shopHere && !doorHere) avgc = mix(gcol, uGlassLo, 0.2);
    // ---- carriage arch rim (the opening itself is geometry): rusticated voussoirs around the arch, keystone
    if (bGate) {
      float r = bw * 0.5, cy = 2.55;
      float dArch = length(vec2(xm, y - cy)) - r;
      float rimM = box1(abs(dArch - 0.2) - 0.2, aa) * step(0.0, y - cy);
      float vous = step(0.5, fract(atan(y - cy, xm) * 4.0 / 3.14159));
      col = mix(col, mix(trim * 0.97, trim * 0.84, vous), rimM);
      col = mix(col, trim * 0.92, box1(max(abs(xm) - 0.2, abs(y - (cy + r + 0.2)) - 0.28), aa) * step(0.0, y - cy));
    }
    // ---- wear
    float dirt = (1.0 - smoothstep(0.0, 2.2, y - plinth)) * (0.05 + 0.05 * float(wear));
    col *= 1.0 - dirt;
    if (wear >= 2) {
      float pt = smoothstep(0.62, 0.70, vnoise(vec2(u * bw, y) * 0.55 + S * 13.0));
      col = mix(col, col * 0.62 + vec3(0.04, 0.035, 0.03), pt * (fcls <= 1 ? 0.55 : 0.3) * detail);
    }
    float soot = (1.0 - smoothstep(0.0, 1.1, Hc - 0.85 - y)) * 0.06 * float(wear + 1);
    col *= 1.0 - soot * (1.0 - inFrieze);
    col = mix(col, vec3(dot(col, vec3(0.33))), 0.04 * float(wear));
    if (arch == 3) { col *= 1.0; }
  }

  // ---- parade doors (парадные) at street level, through the granite plinth: stone surround, arched double leaf, glazed fanlight, intercom
  if (!bGate && !bBlank && (((doorM >> li) & 1) != 0) && y < 3.0) {
    float dh = 2.6, dwh = 0.78;
    vec2 dq = vec2(xm, y - 0.1 - dh * 0.5);
    float surr = box1(winD(dq, vec2(dwh + 0.2, dh * 0.5 + 0.2), 2), aa);
    vec3 stoneC = mix(trim * 0.93, uPlinthC * 1.25, step(y, plinth));
    col = mix(col, stoneC, surr * detail);
    float leaf = box1(winD(dq, vec2(dwh, dh * 0.5), 2), aa);
    vec3 door = sr(vec3(0.27, 0.18, 0.14)) * (0.9 + 0.2 * h21(vec2(floor(y / 0.3), S)));
    door = mix(door, door * 0.65, box1(abs(xm) - 0.02, aa));
    door = mix(door, sr(vec3(0.20, 0.26, 0.31)), box1(max(abs(xm) - 0.62, abs(y - 2.12) - 0.3), aa) * 0.9);
    col = mix(col, door, leaf);
    col = mix(col, sr(vec3(0.66, 0.66, 0.62)), box1(max(abs(xm + 0.98) - 0.06, abs(y - 1.4) - 0.11), aa) * detail);
    avgc = mix(avgc, door, 0.15);
  }

  // ------------------------------------------------------------------ restoration net (printed canvas / green mesh)
  if (bNet) {
    vec3 canvas = bGreenNet ? sr(vec3(0.20, 0.42, 0.24)) : mix(col, sr(vec3(0.86, 0.84, 0.78)), 0.35);
    float mesh = 0.86 + 0.14 * step(0.5, fract((u * bw) / 0.02)) * step(0.5, fract(y / 0.02));
    col = mix(col, canvas * mesh, bGreenNet ? 0.62 : 0.78);
    avgc = mix(avgc, canvas, 0.6);
  }
  if((fl & 4194304)!=0 && !bBlank && arch>0 && arch<18 && arch!=12 && arch!=15 && fcls>=0){
    // The far Neva bank is commonly 0.8-2m/pixel. Keep its actual bay/storey
    // rhythm there while mullions, grime and tiny mouldings use the old fade.
    float wx=apertureAA(u*bw,bw,2.0*hw,fwc.x);
    float wy=apertureAA(fy-sill-hh+fh*0.5,fh,2.0*hh,fwc.y);
    vec3 glass=mix(uGlassLo,uGlassHi,0.32);
    vec3 coarse=mix(wall,glass,wx*wy*0.92);
    float frameX=apertureAA(u*bw,bw,2.0*hw+0.22,fwc.x);
    float frameY=apertureAA(fy-sill-hh+fh*0.5,fh,2.0*hh+0.22,fwc.y);
    coarse=mix(coarse,trim,max(0.0,frameX*frameY-wx*wy)*0.8);
    avgc=coarse;
  }
  col = mix(avgc, col, detail);
  diffuseColor.rgb = col;
  }
`;

const cache = new Map();
const C3 = (hex) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r, c.g, c.b); };

function buildMaterial(ctx, spec) {
  const o = { glassLo: '#202c3a', glassHi: '#6a95c4', trim: '#f1ece0', plinth: '#7b7a76', lit: 0.30, name: 'city-wall', ...spec };
  const uniforms = {
    uTrimC: { value: C3(o.trim) }, uPlinthC: { value: C3(o.plinth) }, uGlassLo: { value: C3(o.glassLo) }, uGlassHi: { value: C3(o.glassHi) },
    uOpt: { value: new THREE.Vector4(0, 0, 0, o.lit) },
    uNight: ctx.shared.uNight,
  };
  const m = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: ctx.mat.gradientMap, vertexColors: true, name: o.name });
  m.userData.wall = { spec: o };
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec4 aA; attribute vec4 aB; attribute vec4 aC; attribute vec4 aD;
        flat varying vec4 vA; flat varying vec4 vB; flat varying vec4 vC; flat varying vec4 vD;
        varying vec2 vCell; varying vec3 vWp;`)
      .replace('#include <fog_vertex>', `#include <fog_vertex>
        vA = aA; vB = aB; vC = aC; vD = aD; vCell = uv;
        { vec4 pw = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            pw = instanceMatrix * pw;
          #endif
          vWp = (modelMatrix * pw).xyz; }`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        flat varying vec4 vA; flat varying vec4 vB; flat varying vec4 vC; flat varying vec4 vD;
        varying vec2 vCell; varying vec3 vWp;
        uniform vec3 uTrimC, uPlinthC, uGlassLo, uGlassHi; uniform vec4 uOpt; uniform float uNight;
        ${GLSL_HELPERS}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 wEmis = vec3(0.0);
        ${GLSL_WALL}`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += wEmis;');
  };
  m.customProgramCacheKey = () => 'piterwall4';
  return m;
}

/** The (single, cached) wall material. */
export function wallMaterial(ctx, spec = {}) {
  const key = JSON.stringify(spec);
  if (!ctx._wallMats) ctx._wallMats = new Map();
  let m = ctx._wallMats.get(key);
  if (!m) { m = buildMaterial(ctx, spec); ctx._wallMats.set(key, m); }
  return m;
}

// ------------------------------------------------------------------------------------------------------------------------------------------------
// geometry: quads with the per-wall attributes
export class FacadeBuilder {
  constructor() { this.pos = []; this.nrm = []; this.uv = []; this.col = []; this.A = []; this.Bv = []; this.C = []; this.D = []; this.idx = []; this.n = 0; }
  vert(x, y, z, nx, ny, nz, u, v, c, at) {
    this.pos.push(x, y, z); this.nrm.push(nx, ny, nz); this.uv.push(u, v); this.col.push(c.r, c.g, c.b);
    this.A.push(at.A[0], at.A[1], at.A[2], at.A[3]); this.Bv.push(at.B[0], at.B[1], at.B[2], at.B[3]); this.C.push(at.C[0], at.C[1], at.C[2], at.C[3]); this.D.push(at.D[0], at.D[1], at.D[2], at.D[3]);
    return this.n++;
  }
  get empty() { return this.n === 0; }
  get tris() { return this.idx.length / 3; }
  /** vertical wall rectangle a-b, bottom y0 / top y1 (world), uv u0..u1 (bays) and v0..v1 (metres above the wall base), normal (nx, nz) = outward */
  quad(a, b, y0, y1, nx, nz, u0, u1, v0, v1, at, c) {
    const i0 = this.vert(a[0], y0, a[1], nx, 0, nz, u0, v0, c, at), i1 = this.vert(b[0], y0, b[1], nx, 0, nz, u1, v0, c, at);
    const i2 = this.vert(b[0], y1, b[1], nx, 0, nz, u1, v1, c, at), i3 = this.vert(a[0], y1, a[1], nx, 0, nz, u0, v1, c, at);
    this.idx.push(i0, i2, i1, i0, i3, i2);
  }
  /** any quad (or triangle): pts = 4 (3) points [x, y, z] in loop order, n = the normal it must face (the winding is flipped to match), uv = 4 (3) [u, v] */
  face(pts, n, uv, at, c) {
    const [p, q, r] = pts;
    const cx = (q[1] - p[1]) * (r[2] - p[2]) - (q[2] - p[2]) * (r[1] - p[1]), cy = (q[2] - p[2]) * (r[0] - p[0]) - (q[0] - p[0]) * (r[2] - p[2]), cz = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    if (pts.length === 3) {                                  // a triangle (a quad with a collapsed edge, e.g. a gable strip that ends on the ground line): one triangle, wound to face n
      const o3 = (cx * n[0] + cy * n[1] + cz * n[2] >= 0) ? [0, 1, 2] : [0, 2, 1];
      const i3 = o3.map((k) => this.vert(pts[k][0], pts[k][1], pts[k][2], n[0], n[1], n[2], uv[k][0], uv[k][1], c, at));
      this.idx.push(i3[0], i3[1], i3[2]);
      return;
    }
    const order = (cx * n[0] + cy * n[1] + cz * n[2] >= 0) ? [0, 1, 2, 3] : [0, 3, 2, 1];
    const ix = order.map((k) => this.vert(pts[k][0], pts[k][1], pts[k][2], n[0], n[1], n[2], uv[k][0], uv[k][1], c, at));
    this.idx.push(ix[0], ix[1], ix[2], ix[0], ix[2], ix[3]);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('aA', new THREE.Float32BufferAttribute(this.A, 4));
    g.setAttribute('aB', new THREE.Float32BufferAttribute(this.Bv, 4));
    g.setAttribute('aC', new THREE.Float32BufferAttribute(this.C, 4));
    g.setAttribute('aD', new THREE.Float32BufferAttribute(this.D, 4));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
}

/** Per-wall attribute bundle. o: { arch, floors, H, bw, N, i0, seed, flags, plinth, G, PN, centre, bal, door, pier, sdoor } */
export function wallAttr(o) {
  return {
    A: [o.arch, o.floors, o.H, o.bw],
    B: [o.N, o.i0 || 0, o.seed || 0, o.flags || 0],
    C: [o.plinth ?? 1.0, o.G ?? 4.4, o.PN ?? 4.4, o.centre ?? -1],
    D: [o.bal || 0, o.door || 0, o.pier || 0, o.sdoor || 0],
  };
}
