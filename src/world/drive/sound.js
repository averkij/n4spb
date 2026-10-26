// drive/sound.js - the engine and the tyres of the player's car, synthesised with WebAudio into the page's AudioContext (audio.context): a four-cylinder note that follows the rpm
// (two detuned saws + a square an octave down through a low-pass whose cutoff opens with the rpm / throttle, soft-clipped), an intake hiss, tyre squeal while drifting, wind, a nitro
// whoosh, a thump / scrape on a collision and a gear-change blip. The ordinary two-tone car horn is the engine's own one-shot (audio.play('carHorn')). CALM by the user's rules:
// no sirens, no alarms. Everything is silent when the page audio is muted or not started. Created lazily at the first enter() (a user gesture).
// PROFILES (drive/cars/tuning.js SOUND): createCarSound(audio, profile) / setProfile(profile) re-voices the same graph per car (oscillator types, pitch law, filter, gains, no gear blips):
// the Lada is a rough old four, the pickup a low electric hum, the Roadster an electric whine whose `jet` field (gain, hp, attack, release) turns the nitro whoosh into the airy hiss of its cold-gas
// nozzles, with a valve thunk when the thrust opens and the one-shots of its gas hops (hop(), cushion(), land(v, big)). HOP v3: the simple hop (X) is hop() alone (hop(true), a fuller one, for the barrel hop); the barrel hop (C) adds the flip() whoosh at take-off and
// lands with a deeper, longer thump (land(v, true)). No charge hiss: both launch on key down. No profile = the red coupe's voice.
// The MOTOR BOAT's outboard (drive/boat/index.js BOAT_SOUND) uses three more profile fields: `chug` (the depth of the cylinder-pulse beat), `wash` (the rush of the water along the hull replaces the wind: it grows with the speed) and `splash` (bow slaps).
export function createCarSound(audio, profile = null) {
  let ac = null, out = null, E = null, started = false, last = { gear: 1, boosting: false }, P = profile || {};
  const noiseBuf = (ac2) => { const b = ac2.createBuffer(1, ac2.sampleRate * 2, ac2.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; };
  const clipCurve = () => { const n = 512, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(x * 2.2) / Math.tanh(2.2); } return c; };

  function build() {
    ac = audio.context; if (!ac) return false;
    out = ac.createGain(); out.gain.value = 0; out.connect(ac.destination);
    const nb = noiseBuf(ac);
    const noise = () => { const s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(); return s; };
    const eng = ac.createGain(); eng.gain.value = 0;
    const o1 = ac.createOscillator(), o2 = ac.createOscillator(), o3 = ac.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'sawtooth'; o3.type = 'square';
    const g1 = ac.createGain(), g2 = ac.createGain(), g3 = ac.createGain(); g1.gain.value = 0.5; g2.gain.value = 0.35; g3.gain.value = 0.3;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2.2; lp.frequency.value = 500;
    const sh = ac.createWaveShaper(); sh.curve = clipCurve(); sh.oversample = '2x';
    o1.connect(g1); o2.connect(g2); o3.connect(g3); g1.connect(lp); g2.connect(lp); g3.connect(lp); lp.connect(sh); sh.connect(eng); eng.connect(out);
    o1.start(); o2.start(); o3.start();
    const intake = ac.createGain(); intake.gain.value = 0; const ibp = ac.createBiquadFilter(); ibp.type = 'bandpass'; ibp.Q.value = 0.9; ibp.frequency.value = 900;
    const n1 = noise(); n1.connect(ibp); ibp.connect(intake); intake.connect(out);
    const squeal = ac.createGain(); squeal.gain.value = 0; const sbp = ac.createBiquadFilter(); sbp.type = 'bandpass'; sbp.Q.value = 7; sbp.frequency.value = 2200;
    const n2 = noise(); n2.connect(sbp); sbp.connect(squeal); squeal.connect(out);
    const wind = ac.createGain(); wind.gain.value = 0; const wlp = ac.createBiquadFilter(); wlp.type = 'lowpass'; wlp.frequency.value = 700; wlp.Q.value = 0.4;
    const n3 = noise(); n3.connect(wlp); wlp.connect(wind); wind.connect(out);
    const whoosh = ac.createGain(); whoosh.gain.value = 0; const hbp = ac.createBiquadFilter(); hbp.type = 'highpass'; hbp.frequency.value = 1200;
    const n4 = noise(); n4.connect(hbp); hbp.connect(whoosh); whoosh.connect(out);
    E = { eng, o1, o2, o3, g1, g2, g3, lp, intake, ibp, squeal, sbp, wind, wlp, whoosh, hbp, nb };
    voice();
    return true;
  }
  /** the profile's static part: oscillator waveforms, their mix and the filter resonance */
  function voice() {
    if (!E) return;
    const ty = P.types || ['sawtooth', 'sawtooth', 'square'], gn = P.gains || [0.5, 0.35, 0.3];
    E.o1.type = ty[0]; E.o2.type = ty[1]; E.o3.type = ty[2];
    E.g1.gain.value = gn[0]; E.g2.gain.value = gn[1]; E.g3.gain.value = gn[2]; E.lp.Q.value = P.lpQ ?? 2.2;
    E.hbp.frequency.value = P.jet ? P.jet.hp : 1200;
  }
  const g = (p, v, t = 0.06) => { try { p.setTargetAtTime(v, ac.currentTime, t); } catch (e) { /* */ } };

  function burst(freq, dur, vol, type = 'lowpass') {
    if (!E) return;
    const s = ac.createBufferSource(); s.buffer = E.nb; s.loopStart = Math.random(); s.loop = true;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; const gg = ac.createGain(), t = ac.currentTime;
    gg.gain.setValueAtTime(vol, t); gg.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(gg); gg.connect(out); s.start(t); s.stop(t + dur + 0.05);
  }
  function thump(vol, f0 = 120, f1 = 38, dur = 0.28) {
    if (!E) return;
    const o = ac.createOscillator(), gg = ac.createGain(), t = ac.currentTime; o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    gg.gain.setValueAtTime(vol, t); gg.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.04); o.connect(gg); gg.connect(out); o.start(t); o.stop(t + dur + 0.07);
  }

  return {
    setProfile(profile) { P = profile || {}; voice(); },
    start() { if (!started) { started = true; if (!build()) started = false; } return started; },
    /** per frame: car state from handling.js ({ rpm, speed (km/h), throttle, drifting, vL, boosting, gear }) */
    update(c, active) {
      if (!ac || !E) return;
      const on = active && !audio.muted && ac.state === 'running';
      g(out.gain, on ? (P.volume ?? 0.9) : 0, 0.08);
      if (!on) return;
      const rpm = c.rpm, thr = c.throttle, f = (P.f0 ?? 26) + rpm * (P.fk ?? 118);           // 4 cylinders: rpm / 60 * 2 Hz fundamental, 800..7000 rpm -> ~26..230 Hz
      const t = ac.currentTime;
      E.o1.frequency.setTargetAtTime(f, t, 0.03); E.o2.frequency.setTargetAtTime(f * (P.detune ?? 1.007), t, 0.03); E.o3.frequency.setTargetAtTime(f * (P.subRatio ?? 0.5), t, 0.03);
      E.lp.frequency.setTargetAtTime((P.lpBase ?? 220) + rpm * (P.lpRpm ?? 1500) + thr * (P.lpThr ?? 900), t, 0.05);
      // P.chug (the boat's outboard): the cylinder pulses, a slow amplitude beat that quickens with the revs (a short smoothing time so that the beat is heard)
      const chug = P.chug ? 1 + P.chug * Math.sin(t * (7 + rpm * 24)) : 1;
      g(E.eng.gain, ((P.engBase ?? 0.10) + (P.engThr ?? 0.20) * thr + (P.engRpm ?? 0.06) * rpm) * chug, P.chug ? 0.012 : 0.05);
      g(E.intake.gain, (0.02 + 0.06 * thr * rpm) * (P.intake ?? 1), 0.06); E.ibp.frequency.setTargetAtTime(500 + rpm * 1400, t, 0.06);
      const slip = c.drifting ? Math.min(1, (Math.abs(c.vL) - 2) / 6) : 0;
      g(E.squeal.gain, 0.16 * slip, 0.05); E.sbp.frequency.setTargetAtTime(1900 + Math.abs(c.vL) * 90, t, 0.08);
      const sp = Math.min(1, c.speed / 220);
      if (P.wash) {      // the boat: the wash of the water along the hull grows with the speed (not its square: it is loud already at 20 km/h), a low rush with a brighter top; now and then the bow slaps a wave
        const ws = Math.min(1, c.speed / 55);
        const wl = P.washLp || [450, 1700], sh = P.splashHz || [1100, 600];      // (the boat's profile sets a darker wash and lower, softer bow slaps)
        g(E.wind.gain, 0.025 * (P.splashVol ?? 1) + P.wash * ws, 0.10); E.wlp.frequency.setTargetAtTime(wl[0] + ws * wl[1], t, 0.10);
        if (P.splash && ws > 0.35 && Math.random() < 0.018 * ws) burst(sh[0] + Math.random() * sh[1], 0.16, (0.05 + 0.05 * ws) * (P.splashVol ?? 1), 'bandpass');
      } else { g(E.wind.gain, (0.02 + 0.28 * sp * sp) * (P.wind ?? 1), 0.12); E.wlp.frequency.setTargetAtTime(350 + sp * 1500, t, 0.12); }
      const J = P.jet;
      g(E.whoosh.gain, c.boosting ? (J ? J.gain : 0.09) : 0, c.boosting ? (J ? J.attack : 0.08) : (J ? J.release : 0.25));
      if (J && c.boosting && !last.boosting) thrust();
      last.boosting = !!c.boosting;
      if (c.gear !== last.gear) { if (P.blip !== false && c.gear > last.gear && thr > 0.3) burst(2400, 0.07, 0.05, 'bandpass'); last.gear = c.gear; }
    },
    hit(v) { if (!E || !on_()) return; thump(Math.min(0.8, 0.12 + v * 0.05)); burst(900 + v * 60, 0.25, Math.min(0.5, 0.08 + v * 0.03)); },
    thrust,
    /** the gas hop: take-off (a hiss of air and a soft thud), the landing cushion re-firing, touchdown (v = the sink speed m/s) */
    hop(big = false) { if (!E || !on_()) return; burst(3500, big ? 0.65 : 0.40, big ? 0.22 : 0.14, 'highpass'); thump(big ? 0.30 : 0.18, big ? 90 : 120); },
    /** the barrel roll of the barrel hop: a calm airy whoosh that sweeps across (a band-passed noise burst), no tone, no alarm */
    flip() { if (!E || !on_()) return; burst(2200, 0.9, 0.11, 'bandpass'); },
    cushion() { if (!E || !on_()) return; burst(3000, 0.2, 0.10, 'highpass'); },
    land(v, big = false) { if (!E || !on_()) return; if (big) { thump(Math.min(0.75, 0.30 + v * 0.04), 95, 28, 0.5); burst(700, 0.45, Math.min(0.4, 0.12 + v * 0.03)); return; } thump(Math.min(0.5, 0.10 + v * 0.04)); burst(900, 0.25, Math.min(0.3, 0.05 + v * 0.025)); },
    scrape(v) { if (!E || !on_()) return; burst(1800, 0.12, Math.min(0.12, 0.03 + v * 0.03), 'bandpass'); },
    horn() { try { audio.play('carHorn', { volume: 1 }); } catch (e) { /* */ } },
    stop() { last.boosting = false; if (out) g(out.gain, 0, 0.05); },
  };
  function on_() { return !!ac && !audio.muted && ac.state === 'running'; }
  /** the valve of the cold-gas nozzles opening: a low click and a thud (one shot, Roadster only: update() fires it at the rising edge of the thrust) */
  function thrust() { if (!E || !on_()) return; burst(300, 0.12, 0.25); thump(0.12); }
}
