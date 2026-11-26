// Time of day for Saint Petersburg, 59.93 N, UTC+3, mid July: afternoon (k = 0) -> golden evening (1) -> white night (2) -> soft overcast day (3) -> afternoon again.
// Animates the sun / twilight light, hemisphere light, fog, painted sky colours, cloud / star / moon amounts, exposure / bloom / saturation, and the shared
// uniforms that the facade, water and glass shaders read (ctx.shared.uNight, uSkyLow / uSkyMid / uSkyTop, uSunDir).
// Key T cycles, ?tod=day|golden|night|overcast (also dusk = golden) or a number 0..4 (4 = day again). Numbers and reasoning: docs/LOOK.md (sources: docs/research/streets.md section 7).
// Indoor zones (core/zones.js, docs/UNDERGROUND.md) are blended over the preset by `overlay.apply()` at the end of every apply(): while a zone is active the preset is re-applied each frame.
//
//   day       15:20  sun SW (az 222, 45 deg up), bright blue sky with cumulus, strong blue-grey shadows: the ochre / pink stucco glows
//   golden    19:10  sun WNW (az 282, 17 deg up) exactly along Nevsky (bearing 283.5), long warm light, facades orange-pink, peach horizon
//   night     00:20  white night: the sun is 7 deg below the north horizon, deep ultramarine sky, a cream-rose glow in the north, lamps and windows on (uNight 1)
//   overcast  11:20  "Petersburg milk": grey-white stratus, soft cool flat light, muted colours (saturation 0.82)
//
// Seasons / weathers: a preset table is a plain list of objects. `SEASONS` maps a name to such a list; `VARIANTS` are shallow overrides (overcast veil, cloudier) merged over
// the table at run time, so a later 'winter' is one more table plus a snow ground, no new code.
import * as THREE from 'three';

/** `dir` = direction TO the light (day: layout.SUN_DIR, replaced by the real value at creation); `sky` = the true sun direction (below the horizon at night).
 *  Azimuth / elevation -> vector: x = sin(az) cos(el), y = sin(el), z = -cos(az) cos(el) (+X east, -Z north). */
export const PRESETS = [
  { name: 'day', label: 'День · Afternoon', clock: 15 * 60 + 20, dir: [-0.473, 0.707, 0.526],
    sunColor: '#fff8ee', sunI: 2.1, hemiSky: '#b0c6ea', hemiGround: '#cbb99e', hemiI: 1.9,
    zenith: '#2c6cc4', mid: '#5a92d4', horizon: '#b0cae6', warm: '#fff0d0', fog: '#b0cae6', fogD: 0.00042,
    night: 0, exposure: 1.0, bloom: 0.26, glow: 0.1, leak: 0.8, vignette: 0.18, threshold: 1.05, sat: 1.02,
    cloudLit: '#fffaf2', cloudShade: '#d3dcee', cloudBase: '#9fb0cc', cloudGlow: '#ffe0b0', anti: '#e8a0b8', overCol: '#bcc4d2',
    disc: 1, glowAmt: 0.28, haze: 0.5, cumulus: 0.64, cirrus: 0.5, overcast: 0, stars: 0, moon: 0, antiAmt: 0 },
  { name: 'golden', label: 'Золотой вечер · Golden evening', clock: 19 * 60 + 10, dir: [-0.931, 0.292, -0.2],
    sunColor: '#ffc88a', sunI: 2.1, hemiSky: '#9aa6dc', hemiGround: '#d6a98a', hemiI: 1.7,
    zenith: '#3a62b6', mid: '#7f98cc', horizon: '#eac3a4', warm: '#ffb070', fog: '#e6c3a6', fogD: 0.00052,
    night: 0, exposure: 1.02, bloom: 0.36, glow: 0.18, leak: 1.15, vignette: 0.22, threshold: 0.95, sat: 1.1,
    cloudLit: '#ffd8b0', cloudShade: '#b9a4bc', cloudBase: '#a08aae', cloudGlow: '#ff9a5a', anti: '#d8a0c0', overCol: '#c2b2bc',
    disc: 1, glowAmt: 0.8, haze: 0.45, cumulus: 0.5, cirrus: 0.55, overcast: 0, stars: 0, moon: 0, antiAmt: 0.35 },
  { name: 'night', label: 'Белая ночь · White night', clock: 24 * 60 + 20, dir: [-0.253, 0.208, -0.945], sky: [-0.189, -0.122, -0.974],
    sunColor: '#aab8f0', sunI: 0.95, hemiSky: '#88a0e0', hemiGround: '#7a7490', hemiI: 1.9,
    zenith: '#0f2b84', mid: '#2c52ae', horizon: '#7580b8', warm: '#f6c8b2', fog: '#5e6a9e', fogD: 0.00058,
    night: 1, exposure: 1.2, bloom: 0.5, glow: 0.3, leak: 0.3, vignette: 0.28, threshold: 0.85, sat: 1.05,
    cloudLit: '#7686c0', cloudShade: '#37457f', cloudBase: '#2a3568', cloudGlow: '#e89a92', anti: '#5a5092', overCol: '#4a5688',
    disc: 0, glowAmt: 0.95, haze: 0.5, cumulus: 0.32, cirrus: 0.4, overcast: 0, stars: 0, moon: 0, antiAmt: 0.2 },
  { name: 'overcast', label: 'Пасмурно · Overcast', clock: 24 * 60 + 11 * 60 + 20, dir: [-0.159, 0.788, 0.595],
    sunColor: '#f2f0ec', sunI: 0.65, hemiSky: '#b3c3de', hemiGround: '#aaa49c', hemiI: 2.4,
    zenith: '#97a4bb', mid: '#b6c0d0', horizon: '#d9dde3', warm: '#f4efe6', fog: '#d1d7df', fogD: 0.0005,
    night: 0, exposure: 1.0, bloom: 0.14, glow: 0.1, leak: 0.15, vignette: 0.24, threshold: 1.1, sat: 0.8,
    cloudLit: '#e6eaef', cloudShade: '#a9b2c1', cloudBase: '#8992a4', cloudGlow: '#f0ece4', anti: '#c8c0cc', overCol: '#b4bdca',
    disc: 0, glowAmt: 0.22, haze: 0.4, cumulus: 0, cirrus: 0, overcast: 0.92, stars: 0, moon: 0, antiAmt: 0 },
];

const december = [
  { label: 'Зимний день', clock: 12 * 60 + 40, dir: [-0.23, 0.16, 0.96], sunColor: '#ffdfb8', sunI: 1.55, hemiGround: '#bdcbda', zenith: '#628ab4', horizon: '#dae3e8', fog: '#ccdae5', cumulus: 0.25, sat: 0.92 },
  { label: 'Зимние сумерки', clock: 16 * 60, dir: [-0.73, 0.08, 0.67], night: 0.66, zenith: '#304873', mid: '#75849d', horizon: '#d5afb0', fog: '#acaec1', hemiGround: '#9eaabc', sunI: 1.1 },
  { label: 'Зимняя ночь', clock: 22 * 60, zenith: '#0c142b', mid: '#23334f', horizon: '#45516a', fog: '#414d64', sunI: 0.55, hemiI: 1.05, stars: 0.55, moon: 0.8 },
  { label: 'Зимнее утро · Winter morning', clock: 24 * 60 + 9 * 60 + 30, dir: [0.55, 0.06, 0.83],
    night: 0.32, sunColor: '#f3d9c6', sunI: 0.73, hemiSky: '#bbc5d7', hemiGround: '#c3cdd7', hemiI: 1.8,
    zenith: '#8895a9', mid: '#b0b9c6', horizon: '#dacec7', fog: '#bdc6d0', fogD: 0.00066, overcast: 0.77 },
];
export const SEASONS = { summer: PRESETS, winter: PRESETS.map((p, i) => ({ ...p, ...december[i] })) };

/** Names accepted by `?tod=` / tod.set besides the preset names. */
const ALIASES = { dusk: 'golden', evening: 'golden', sunset: 'golden', white: 'night', cloudy: 'overcast', grey: 'overcast', gray: 'overcast', milk: 'overcast' };

/** Shallow overrides merged over a preset (`?look=overcast|cloudy`, tod.setVariant). A key `xName` multiplies the preset value `name`. */
export const VARIANTS = {
  // a stratus veil over whatever the preset is (the sun is dimmed, the sky greyed, the clouds flattened)
  overcast: { zenith: '#9aa6bc', mid: '#b6c0d0', horizon: '#d3d8de', fog: '#cdd3db', xSunI: 0.35, xHemiI: 1.12, exposure: 1.0, disc: 0, glowAmt: 0.15, cumulus: 0.3, cirrus: 0, overcast: 0.85, overCol: '#adb6c4', sat: 0.88, cloudLit: '#d8dde5', cloudShade: '#9aa3b4', cloudBase: '#808a9c' },
  // broken cloud: more cumulus, a little less sun
  cloudy: { cumulus: 0.8, xSunI: 0.8, cirrus: 0.2 },
};

/** overlay (optional): { apply(), active } from core/zones.js. apply() is called at the END of every apply(k) and rewrites the sun / ambient / fog / sky / post
 *  values for the indoor zone the camera is in; while overlay.active (inside a zone or fading out of it) the whole preset is re-applied every frame, so the overlay
 *  always blends over fresh preset values (the time-of-day system and the T key keep working underground). */
export function createTimeOfDay({ sky, scene, shared, sunDir, pipeline, season = 'summer', overlay = null, fogScale = 1 }) {      // fogScale: the quality tier's fog multiplier (main.js, the performance tier hides its short far plane in haze)
  const A = new THREE.Color(), B = new THREE.Color(), V = new THREE.Vector3(), W = new THREE.Vector3();
  const dayDir = sunDir.clone().normalize();      // layout.SUN_DIR, as handed over by main.js
  let table = SEASONS[season] || PRESETS, variant = null;
  let k = season === 'winter' ? table.findIndex(p => p.name === 'overcast') : 0, target = k, dirty = true;
  const count = () => table.length;               // k runs 0..count: count = the first preset again (the T cycle wraps forward)

  /** preset i (taken modulo the table) with the active variant merged over it */
  function preset(i) {
    const n = count(), idx = ((i % n) + n) % n;
    const p = { ...table[idx] };
    if (idx === 0 && table === PRESETS) p.dir = dayDir.toArray();
    if (variant && VARIANTS[variant]) {
      for (const [key, v] of Object.entries(VARIANTS[variant])) { if (/^x[A-Z]/.test(key)) { const base = key[1].toLowerCase() + key.slice(2); p[base] *= v; } else p[key] = v; }
    }
    return p;
  }
  const lerpColor = (out, ha, hb, t) => { A.set(ha); B.set(hb); out.copy(A).lerp(B, t); };

  function apply(kk) {
    const i = Math.min(count() - 1, Math.floor(kk)), a = preset(i), b = preset(i + 1), t = Math.min(1, kk - i);
    const m = (x, y) => x + (y - x) * t;
    // light direction (sun by day, the glow of the north at night): lerp then normalise; the sky gets the true sun (below the horizon on the white night)
    V.set(...a.dir); W.set(...b.dir); sunDir.copy(V.lerp(W, t)).normalize();
    shared.uSunDir.value.copy(sunDir);
    V.set(...(a.sky || a.dir)); W.set(...(b.sky || b.dir)); sky.uniforms.uSun.value.copy(V.lerp(W, t)).normalize();
    lerpColor(sky.sun.color, a.sunColor, b.sunColor, t); sky.sun.intensity = m(a.sunI, b.sunI);
    lerpColor(sky.hemi.color, a.hemiSky, b.hemiSky, t); lerpColor(sky.hemi.groundColor, a.hemiGround, b.hemiGround, t); sky.hemi.intensity = m(a.hemiI, b.hemiI);
    const u = sky.uniforms;
    lerpColor(u.uZenith.value, a.zenith, b.zenith, t); lerpColor(u.uMid.value, a.mid, b.mid, t);
    lerpColor(u.uHorizon.value, a.horizon, b.horizon, t); lerpColor(u.uWarm.value, a.warm, b.warm, t);
    lerpColor(u.uFog.value, a.fog, b.fog, t); scene.fog.color.copy(u.uFog.value); scene.fog.density = m(a.fogD, b.fogD) * fogScale;
    lerpColor(u.uCloudLit.value, a.cloudLit, b.cloudLit, t); lerpColor(u.uCloudShade.value, a.cloudShade, b.cloudShade, t);
    lerpColor(u.uCloudBase.value, a.cloudBase, b.cloudBase, t); lerpColor(u.uCloudGlow.value, a.cloudGlow, b.cloudGlow, t);
    lerpColor(u.uAnti.value, a.anti, b.anti, t); lerpColor(u.uOverCol.value, a.overCol, b.overCol, t);
    u.uDisc.value = m(a.disc, b.disc); u.uGlowAmt.value = m(a.glowAmt, b.glowAmt); u.uHaze.value = m(a.haze, b.haze);
    u.uCumulus.value = m(a.cumulus, b.cumulus); u.uCirrus.value = m(a.cirrus, b.cirrus); u.uOvercast.value = m(a.overcast, b.overcast);
    u.uStars.value = m(a.stars, b.stars); u.uMoon.value = m(a.moon, b.moon); u.uAntiAmt.value = m(a.antiAmt, b.antiAmt);
    const night = m(a.night, b.night);
    u.uNight.value = night; shared.uNight.value = night;
    shared.uSkyLow.value.copy(u.uHorizon.value); shared.uSkyMid.value.copy(u.uMid.value); shared.uSkyTop.value.copy(u.uZenith.value);
    if (pipeline) {
      const c = pipeline.compMat.uniforms;
      c.uExposure.value = m(a.exposure, b.exposure); c.uBloom.value = m(a.bloom, b.bloom); c.uGlow.value = m(a.glow, b.glow); c.uVignette.value = m(a.vignette, b.vignette);
      if (c.uSat) c.uSat.value = m(a.sat ?? 1.05, b.sat ?? 1.05);
      pipeline.leakScale = m(a.leak, b.leak);
      if (pipeline.brightMat) pipeline.brightMat.uniforms.uThreshold.value = m(a.threshold, b.threshold);
    }
    if (tod.overlay) tod.overlay.apply();
  }
  const parse = (v) => {
    const n = count();
    if (typeof v === 'number') return Math.max(0, Math.min(n, v));
    const s = v === 'morning' && table === SEASONS.winter ? 'overcast' : ALIASES[String(v)] || String(v), idx = table.findIndex((p) => p.name === s);
    return idx >= 0 ? idx : (Number.isFinite(Number(v)) ? Math.max(0, Math.min(n, Number(v))) : 0);
  };
  const clockOf = (i) => { const n = count(); return table[i % n].clock + (i >= n ? 1440 : 0); };   // minutes, increasing along k (the wrap adds a day)

  const tod = {
    overlay,                                    // see the header of createTimeOfDay; main.js wires core/zones.js here
    get k() { return k; }, get target() { return target; },
    /** jump (instant) or glide to a preset name / number 0..count (count = day again) */
    set(v, instant = false) { target = parse(v); if (instant) { k = target >= count() ? 0 : target; if (k === 0) target = 0; dirty = true; } },
    /** next preset (day -> golden -> night -> overcast -> day); returns its label */
    cycle() { const n = count(), cur = Math.round(target); target = cur + 1; if (target > n) target = n; return table[target % n].label; },
    /** weather overlay ('overcast', 'cloudy', or null / '' for the preset as it is) */
    setVariant(name) { variant = VARIANTS[name] ? name : null; dirty = true; },
    get variant() { return variant; },
    /** switch the preset table (a SEASONS key) */
    setSeason(name) { if (SEASONS[name]) { table = SEASONS[name]; dirty = true; } },
    update(dt) {
      if (k !== target) {
        const step = dt / 3.2; k += Math.max(-step, Math.min(step, target - k)); if (Math.abs(k - target) < 1e-4) k = target;
        if (k >= count()) { k = 0; target = 0; }  // arrived at "day again": the same state as k = 0
        dirty = true;
      }
      if (dirty || (tod.overlay && tod.overlay.active)) { apply(k); dirty = false; }
    },
    get label() { return table[Math.round(k) % count()].label; },
    /** Saint Petersburg local time (UTC+3) for the HUD, "15:20" / "19:10" / "00:20" / "11:20"; simSeconds advances the minutes slowly */
    clockText(simSeconds = 0) {
      const i = Math.min(count() - 1, Math.floor(k)), t = Math.min(1, k - i);
      const c0 = clockOf(i), c1 = clockOf(i + 1);
      const mins = Math.round(c0 + (c1 - c0) * t + Math.floor(simSeconds / 60)) % (24 * 60);
      return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
    },
  };
  try { const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('look') : null; if (q && VARIANTS[q]) variant = q; } catch (e) { /* no DOM */ }
  return tod;
}
