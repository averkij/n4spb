// Classic, CDN-independent recorder for diagnostics.html ONLY. No imports from
// scene builders; no changes to the normal entry page, bake or worker protocol.
// All data stays on this device unless the player copies/downloads a report.
(() => {
  'use strict';
  const LIMIT = 140, PENDING_LIMIT = 64;
  const key = 'n4spb.loading-report.v1:' + location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1);
  let run = null, previous = null, saved = null, storageError = '', selected = 'current';
  let ui, lastSample = '', lastTick = 0, requestId = 0;
  const short = value => String(value ?? '').slice(0, 500);
  const safe = fn => { try { return fn(); } catch { return undefined; } };
  const labelURL = value => {
    try { const u = new URL(String(value), location.href); return u.origin === location.origin ? u.pathname : u.origin + u.pathname; }
    catch { return short(value); }
  };
  try {
    const raw = localStorage.getItem(key) || 'null';
    if (raw.length > 250000) throw Error('Report too large');
    const data = JSON.parse(raw);
    const valid = r => r && typeof r.status === 'string' && Array.isArray(r.events) && r.events.length <= LIMIT && r.pending && typeof r.pending === 'object' && !Array.isArray(r.pending);
    if (data?.schema === 1) {
      if (!valid(data.current) || data.previous && !valid(data.previous)) throw Error('Invalid report');
      saved = data.current; previous = data.previous;
    }
  } catch { storageError = 'Saved reports could not be read. Copy the report before leaving this page.'; }
  const report = () => selected === 'previous' ? previous : (run || saved);
  const text = () => JSON.stringify({ diagnosticSchema: 1, storageWarning: storageError || undefined, report: report() }, null, 2);
  function persist() {
    if (!run) return;
    run.lastSeen = new Date().toISOString();
    try { localStorage.setItem(key, JSON.stringify({ schema: 1, current: run, previous })); }
    catch { storageError = 'Storage is unavailable or full. This report cannot survive a reload; copy it now.'; }
  }
  function event(kind, detail = '') {
    if (!run) return;
    run.events.push({ ms: Math.round(performance.now() - run.startMs), kind, detail: short(detail) });
    if (run.events.length > LIMIT) run.events.shift();
    persist(); render();
  }
  function render() {
    if (!ui) return;
    const r = report();
    ui.status.textContent = r ? `${r.status} · ${r.phase || 'waiting'}${r.elapsedMs ? ` · ${Math.round(r.elapsedMs / 1000)}s` : ''}` : 'No saved attempt. Tap Start test.';
    ui.notice.textContent = storageError || (run ? 'Recording locally. If the page freezes, reopen this same link to recover the last saved report.' : 'The game is paused. A reload will return here without starting another load.');
    const entries = Object.values(r?.pending || {});
    ui.pending.textContent = entries.length ? 'Waiting: ' + entries.slice(-4).map(p => p.asset).join('\n') : 'No recorded pending requests.';
    ui.tail.textContent = (r?.events || []).slice(-6).map(e => `${(e.ms / 1000).toFixed(1)}s ${e.kind}: ${e.detail}`).join('\n');
    ui.previous.disabled = !previous;
    ui.toggle.textContent = run ? `Diagnostics · ${run.phase || run.status}` : 'Diagnostics · saved reports';
  }
  function request(kind, asset, rawBytes) {
    if (!run) return null;
    const id = String(++requestId);
    if (Object.keys(run.pending).length < PENDING_LIMIT) run.pending[id] = { kind, asset: labelURL(asset), rawBytes, startMs: Math.round(performance.now() - run.startMs) };
    else run.droppedPending++;
    event(kind + ':start', `${labelURL(asset)}${rawBytes ? ` (${rawBytes} raw bytes)` : ''}`);
    return id;
  }
  function finish(id, kind, detail) {
    if (!id || !run) return;
    delete run.pending[id]; event(kind, detail);
  }

  // Forward the original arguments, Response and transferable message unchanged.
  // Fetch means headers arrived; worker completion means a decoded value arrived.
  const nativeFetch = window.fetch;
  window.fetch = function (...args) {
    const asset = typeof args[0] === 'string' || args[0] instanceof URL ? args[0] : args[0]?.url;
    const id = request('fetch', asset);
    let p;
    try { p = Reflect.apply(nativeFetch, this, args); }
    catch (e) { finish(id, 'fetch:error', `${labelURL(asset)} ${e.message}`); throw e; }
    return p.then(response => { finish(id, 'fetch:headers', `${response.status} ${labelURL(asset)}`); return response; },
      error => { finish(id, 'fetch:error', `${labelURL(asset)} ${error.message}`); throw error; });
  };
  if (window.Worker) {
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      constructor(url, options) {
        super(url, options);
        this.diagnosticRequests = new Map();
        event('worker:created', labelURL(url));
        this.addEventListener('message', e => {
          const data = e.data, item = this.diagnosticRequests.get(data?.id);
          if (!item) return;
          this.diagnosticRequests.delete(data.id);
          finish(item.id, data.error ? 'worker:asset-error' : 'worker:decoded', `${item.asset} ${data.error || `${data.bytes} bytes, read ${Math.round(data.readMs)}ms, decode ${Math.round(data.decodeMs)}ms`}`);
        });
        this.addEventListener('error', e => event('worker:error', e.message));
        this.addEventListener('messageerror', () => event('worker:message-error'));
      }
      postMessage(data, ...rest) {
        let item;
        if (data && typeof data.url === 'string' && typeof data.id === 'number') {
          item = { id: request('worker:asset', data.url, data.rawBytes), asset: labelURL(data.url) };
          this.diagnosticRequests.set(data.id, item);
        }
        try { return super.postMessage(data, ...rest); }
        catch (error) {
          if (item) { this.diagnosticRequests.delete(data.id); finish(item.id, 'worker:send-error', error.message); }
          throw error;
        }
      }
      terminate() {
        for (const item of this.diagnosticRequests.values()) finish(item.id, 'worker:terminated', item.asset);
        this.diagnosticRequests.clear(); return super.terminate();
      }
    };
  }
  for (const level of ['warn', 'error']) {
    const original = console[level];
    console[level] = function (...args) {
      // Never stringify scene objects/buffers or retain console arguments.
      event('console:' + level, args.map(a => a instanceof Error ? a.message : typeof a === 'object' && a !== null ? '[object]' : short(a)).join(' '));
      return Reflect.apply(original, this, args);
    };
  }
  addEventListener('error', e => event('error', e.message || `Resource failed: ${labelURL(e.target?.src || e.target?.href || '')}`), true);
  addEventListener('unhandledrejection', e => event('unhandledrejection', e.reason?.message || e.reason));
  addEventListener('webglcontextlost', () => { if (run) run.status = 'Graphics context lost'; event('webglcontextlost'); }, true);
  addEventListener('piter-fatal', e => { if (run) run.status = 'Scene failed'; event('fatal', e.detail?.message); });
  addEventListener('pagehide', e => event('pagehide', `persisted=${e.persisted}`));
  addEventListener('pageshow', e => { if (run && e.persisted) event('pageshow', 'restored from back/forward cache'); });
  document.addEventListener('visibilitychange', () => event('visibility', document.visibilityState));
  safe(() => new PerformanceObserver(list => {
    if (!run) return;
    for (const entry of list.getEntries()) if (entry.duration >= 500) event('long-task', `${Math.round(entry.duration)}ms`);
  }).observe({ type: 'longtask', buffered: false }));

  // Isolate the shipping decoder from scene imports, geometry and WebGL. Use
  // the real worker protocol, discard replies immediately, and never retry.
  async function probeAssets() {
    let worker, timeout;
    const jobs = new Map(), abort = new AbortController();
    const deadline = new Promise((_, reject) => {
      timeout = setTimeout(() => reject(Error('Assets-only test exceeded 90 seconds')), 90000);
    });
    try {
      await Promise.race([deadline, (async () => {
        run.phase = 'Reading Palace manifest'; event('probe:manifest');
        const response = await fetch('./assets/baked/palace/manifest.json', { signal: abort.signal, cache: 'no-cache' });
        if (!response.ok) throw Error(`Manifest HTTP ${response.status}`);
        const manifest = await response.json(); run.probeRevision = manifest.revision;
        const names = ['field', 'street-textures', 'street-kerbs', 'street-surfaces', 'city-base', 'roof', 'nav-low'];
        run.probe = { completed: [], total: names.length, bytes: 0 };
        worker = new Worker('./src/core/baked-worker.js', { type: 'module' });
        worker.onmessage = ({ data }) => {
          const job = jobs.get(data.id); if (!job) return;
          jobs.delete(data.id);
          if (data.error) { job.reject(Error(`${job.name}: ${data.error}`)); return; }
          // The decoded value is deliberately not retained in the probe.
          run.probe.completed.push(job.name); run.probe.bytes += data.bytes;
          run.phase = `Decoded ${run.probe.completed.length}/${names.length}: ${job.name}`;
          event('probe:decoded', job.name); job.resolve();
        };
        const fail = error => { for (const job of jobs.values()) job.reject(error); jobs.clear(); };
        worker.onerror = e => fail(Error(e.message || 'Worker failed'));
        worker.onmessageerror = () => fail(Error('Worker reply could not be read'));
        const load = (name, i) => new Promise((resolve, reject) => {
          const file = manifest.files?.[name];
          if (typeof file !== 'string' || !/^[\w.-]+\.bin\.gz$/.test(file)) { reject(Error(`Missing or invalid asset: ${name}`)); return; }
          jobs.set(i, { name, resolve, reject });
          run.phase = `Waiting for ${name}`; event('probe:request', name);
          worker.postMessage({ id: i, url: new URL('./assets/baked/palace/' + file, location.href).href, rawBytes: manifest.sizes?.[name]?.raw });
        });
        if (run.test === 'assets-burst') await Promise.all(names.map(load));
        else for (const [i, name] of names.entries()) await load(name, i);
        run.status = 'Assets test passed'; run.phase = '7/7 assets decoded; no scene built'; event('probe:complete');
      })()]);
    } catch (error) {
      run.status = 'Assets test failed'; event('probe:error', error.message);
    } finally {
      clearTimeout(timeout); abort.abort(); worker?.terminate();
      for (const job of jobs.values()) job.reject(Error('Assets test ended'));
      jobs.clear(); sample();
    }
  }

  async function probeRiverfront() {
    let expired = false;
    const timeout = setTimeout(() => {
      expired = true; run.status = 'Riverfront test timed out'; event('probe:error', 'No completion within 90 seconds');
    }, 90000);
    try {
      run.phase = 'Importing riverfront and context'; event('probe:imports');
      const [THREE, { createContext }, riverfront, L, area] = await Promise.all([
        import('three'), import('./ctx.js'), import('../world/landmarksRiverfront.js'),
        import('../world/layout.js'), import('../world/area.js'),
      ]);
      if (expired) return;
      run.phase = 'Creating CPU context and textures'; event('probe:context');
      await new Promise(resolve => setTimeout(resolve, 0));
      const scene = new THREE.Scene();
      const ctx = createContext({ scene, camera: new THREE.PerspectiveCamera(), renderer: null, audio: null,
        quality: { name: 'performance', level: 'low', pixelRatio: 1, msaa: 2, shadowMap: 1024, petals: 0.35, lod: 0.6, cull: 0.55 },
        sunDir: new THREE.Vector3(...L.SUN_DIR).normalize() });
      ctx.area = area; ctx.buildList = ['landmarksRiverfront'];
      run.phase = 'Constructing riverfront geometry'; event('probe:build');
      await new Promise(resolve => setTimeout(resolve, 0));
      await riverfront.build(ctx);
      run.riverfront = { ...ctx.services.landmarksRiverfront };
      run.status = 'Riverfront test passed'; run.phase = 'Geometry built; no WebGL or asset worker'; event('probe:complete');
      // No GPU was created, and the report retains only part/triangle counts.
      scene.traverse(o => o.geometry?.dispose());
    } catch (error) {
      run.status = 'Riverfront test failed'; event('probe:error', error.message);
    } finally { clearTimeout(timeout); sample(); }
  }

  function sample() {
    if (!run) return;
    const now = performance.now(), ctx = window.__ctx, env = ctx?.services?.environment;
    run.elapsedMs = Math.round(now - run.startMs);
    run.maxHeartbeatGapMs = Math.max(run.maxHeartbeatGapMs, Math.round(now - lastTick)); lastTick = now;
    if (run.test !== 'scene') { persist(); render(); return; }
    run.version = document.getElementById('ver')?.textContent || null;
    run.phase = `${document.getElementById('loadpct')?.textContent || '0%'} ${document.getElementById('loadlabel')?.textContent || ''}`.trim();
    run.mainStarted = !!window.__mainStarted;
    run.loaded = document.body.classList.contains('loaded');
    run.playing = document.body.classList.contains('playing');
    run.milestones = { fieldReady: !!env?.field, groundReady: !!env?.ground, environmentFinished: !!env?.buildPhases };
    run.modules = Object.keys(window.__stats?.modules || {});
    run.timing = { ...window.__stats?.timing };
    const baked = ctx?.services?.baked;
    if (baked) run.baked = { revision: baked.revision, decoder: { ...baked.decoder }, loaded: baked.loaded.slice(-80), failures: baked.failures.slice(-10) };
    if (performance.memory) run.chromiumMemory = { usedJSHeapSize: performance.memory.usedJSHeapSize, jsHeapSizeLimit: performance.memory.jsHeapSizeLimit };
    if (!run.gpu && ctx?.renderer) safe(() => {
      const gl = ctx.renderer.getContext();
      run.gpu = { version: gl.getParameter(gl.VERSION), maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE), maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) };
    });
    if (run.loaded && run.status === 'Loading') run.status = 'Loaded; monitoring';
    const signature = JSON.stringify([run.phase, run.status, run.mainStarted, run.milestones, run.modules]);
    if (signature !== lastSample) { lastSample = signature; event('progress', run.phase + (run.loaded ? ' · first frame ready' : '')); }
    else { persist(); render(); }
  }

  function mount() {
    const css = document.createElement('style');
    css.textContent = `
      #load-diag { position:fixed; z-index:2147483646; inset:0; padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left)); box-sizing:border-box; overflow:auto; background:#0b1230; color:#eef2ff; font:16px/1.45 system-ui,sans-serif; touch-action:pan-y; }
      #load-diag[hidden] { display:none; } #load-diag * { box-sizing:border-box; }
      #load-diag .diag-card { max-width:700px; margin:auto; } #load-diag h1 { font-size:22px; margin:0 0 10px; }
      #load-diag button,#load-diag select,#load-diag input { font:inherit; min-height:44px; max-width:100%; border-radius:6px; border:1px solid #8193c2; padding:9px; }
      #load-diag button { background:#f2c14e; color:#0b1230; cursor:pointer; } #load-diag button:disabled { opacity:.45; }
      #load-diag .diag-row { display:flex; flex-wrap:wrap; gap:8px; margin:10px 0; } #load-diag label { display:block; margin:10px 0; }
      #load-diag input[type=text] { width:100%; } #load-diag input[type=checkbox] { min-height:24px; width:24px; vertical-align:middle; }
      #load-diag pre { white-space:pre-wrap; overflow-wrap:anywhere; max-height:180px; overflow:auto; font-size:12px; padding:10px; background:#172246; border-radius:6px; }
      #load-diag textarea { width:100%; height:35vh; min-height:160px; font:16px/1.4 monospace; background:#fff; color:#111; }
      #diag-toggle { position:fixed; z-index:2147483645; top:max(8px,env(safe-area-inset-top)); right:max(8px,env(safe-area-inset-right)); max-width:80vw; min-height:44px; padding:8px 12px; border:1px solid #fff; border-radius:7px; background:#0b1230; color:white; font:13px system-ui; }
    `;
    document.head.append(css);
    const panel = document.createElement('section'); panel.id = 'load-diag'; panel.setAttribute('aria-label', 'Loading diagnostics');
    panel.innerHTML = `<div class="diag-card"><h1>Loading diagnostics</h1><p id="diag-notice"></p>
      <p>Reports stay on this device. No report is sent automatically.</p>
      <div id="diag-options"><label>Device / iOS version (optional)<input id="diag-device" type="text" maxlength="120" placeholder="iPhone 16 Pro Max, iOS 26.7"></label>
      <label>Test <select id="diag-test"><option value="scene">Full Palace scene</option><option value="assets-sequential">Assets only: one at a time</option><option value="assets-burst">Assets only: seven together</option><option value="riverfront">Riverfront geometry only</option></select></label>
      <p id="diag-description"></p>
      <label>Decoder <select id="diag-worker"><option value="1">Worker (normal)</option><option value="0">Main thread (comparison)</option></select></label>
      <label><input type="checkbox" id="diag-compile" checked> Early shader compilation (normal)</label>
      <button id="diag-start" type="button">Start test</button></div>
      <h2 id="diag-status" style="font-size:17px"></h2>
      <div class="diag-row"><button id="diag-current" type="button">Latest report</button><button id="diag-previous" type="button">Previous report</button><button id="diag-copy" type="button">Copy report</button><button id="diag-download" type="button">Download report</button><button id="diag-show" type="button">Show report text</button><button id="diag-hide" type="button">Show game</button></div>
      <pre id="diag-pending"></pre><pre id="diag-tail"></pre>
      <p id="diag-feedback" role="status"></p><textarea id="diag-output" aria-label="Diagnostic report text" readonly hidden></textarea></div>`;
    document.body.append(panel);
    const $ = id => document.getElementById('diag-' + id);
    const toggle = document.createElement('button'); toggle.id = 'diag-toggle'; toggle.type = 'button'; document.body.append(toggle);
    ui = { panel, toggle, status: $('status'), notice: $('notice'), pending: $('pending'), tail: $('tail'), previous: $('previous'), output: $('output') };
    const showText = () => { ui.output.hidden = false; ui.output.value = text(); ui.output.focus(); ui.output.select(); };
    const changeTest = () => {
      const scene = $('test').value === 'scene';
      $('worker').disabled = $('compile').disabled = !scene;
      $('description').textContent = scene ? 'Build and render the full scene.' : $('test').value === 'riverfront'
        ? 'Import and build the first riverfront module without WebGL or baked-asset workers. If it freezes, reopen this link for the last phase.'
        : 'Test the real worker and seven startup assets without building the scene or using WebGL. Stops after 90 seconds if no result.';
    };
    const requestedTest = new URLSearchParams(location.search).get('test');
    if (['assets-sequential', 'assets-burst', 'riverfront'].includes(requestedTest)) $('test').value = requestedTest;
    $('test').onchange = changeTest; changeTest();
    toggle.onclick = () => { panel.hidden = false; render(); };
    $('hide').onclick = () => { panel.hidden = true; };
    $('current').onclick = () => { selected = 'current'; if (!ui.output.hidden) ui.output.value = text(); render(); };
    $('previous').onclick = () => { selected = 'previous'; if (!ui.output.hidden) ui.output.value = text(); render(); };
    $('show').onclick = showText;
    $('copy').onclick = async () => {
      try {
        if (!navigator.clipboard?.writeText) throw Error('Clipboard unavailable');
        await navigator.clipboard.writeText(text()); $('feedback').textContent = 'Report copied.';
      } catch { showText(); $('feedback').textContent = 'Select and copy the report text below.'; }
    };
    $('download').onclick = () => {
      const href = URL.createObjectURL(new Blob([text()], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = href; a.download = 'n4spb-loading-report.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(href), 10000);
    };
    $('start').onclick = () => {
      if (run) return;
      previous = saved || previous;
      const params = new URLSearchParams(location.search);
      // The diagnostic is a normal full-scene load; never inherit bake/shot or
      // arrival flags from a copied developer URL. Controls are explicit here.
      const test = $('test').value;
      const query = new URLSearchParams({ q: params.get('q') === 'medium' ? 'medium' : 'performance', bakedworker: test === 'scene' ? $('worker').value : '1', earlycompile: $('compile').checked ? '1' : '0', test });
      history.replaceState(null, '', location.pathname + '?' + query);
      run = { id: Date.now().toString(36), started: new Date().toISOString(), startMs: performance.now(), status: 'Loading', test,
        deviceNote: $('device').value.slice(0, 120), userAgent: navigator.userAgent, platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency, deviceMemoryGiB: navigator.deviceMemory,
        screen: { width: screen.width, height: screen.height, dpr: devicePixelRatio },
        viewport: { width: innerWidth, height: innerHeight }, path: location.pathname, options: Object.fromEntries(query),
        area: document.documentElement.dataset.area, pending: {}, events: [], droppedPending: 0, maxHeartbeatGapMs: 0 };
      selected = 'current'; lastTick = performance.now();
      $('options').hidden = true;
      setInterval(sample, 1000);
      if (test !== 'scene') { event('start', test); void (test === 'riverfront' ? probeRiverfront() : probeAssets()); return; }
      event('start', 'Full scene; waiting for main module');
      const script = document.createElement('script'); script.type = 'module'; script.src = document.getElementById('diagnostic-main').dataset.src;
      script.onerror = () => { run.status = 'Main module failed'; event('module:error', 'Main module or an import could not load'); };
      document.body.append(script);
      // The observer persists module progress before the module starts its work.
      const observer = new MutationObserver(sample);
      for (const id of ['loadpct', 'loadlabel', 'ver']) { const el = document.getElementById(id); if (el) observer.observe(el, { childList: true, subtree: true, characterData: true }); }
      panel.hidden = true;
    };
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
})();
