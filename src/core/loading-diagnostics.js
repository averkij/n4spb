// Classic, CDN-independent recorder for diagnostics.html ONLY. Optional probes
// import real builders; no changes to the normal entry page or bake products.
// All data stays on this device unless the player copies/downloads a report.
(() => {
  'use strict';
  const LIMIT = 140, PENDING_LIMIT = 64;
  const key = 'n4spb.loading-report.v1:' + location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1);
  let run = null, previous = null, saved = null, storageError = '', selected = 'current';
  let ui, lastSample = '', lastTick = 0, requestId = 0;
  const watchedRenderers = new WeakSet();
  const diagnosticsVersion = document.querySelector('meta[name="diagnostics-version"]')?.content || 'unknown';
  const pageIdentity = { id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
    opened: new Date().toISOString(), timeOrigin: performance.timeOrigin,
    navigationType: performance.getEntriesByType('navigation')[0]?.type || 'unknown' };
  const sceneTest = () => ['scene', 'scene-staged', 'scene-js-gzip'].includes(run?.test);
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
  safe(() => {
    const raw = localStorage.getItem(key + ':draw');
    if (!raw || raw.length > 12000) return;
    const checkpoint = JSON.parse(raw);
    for (const r of [saved, previous]) if (r?.id === checkpoint.runId) {
      if (Number.isInteger(checkpoint?.draw?.number)) r.lastColourDraw = checkpoint.draw;
      if (checkpoint.groundGL) r.lastGroundGL = checkpoint.groundGL;
      if ('colourGL' in checkpoint) r.lastColourGL = checkpoint.colourGL;
      if (checkpoint.canvasUpload) r.canvasUpload = checkpoint.canvasUpload;
      if (checkpoint.lastDraw) r.lastDraw = checkpoint.lastDraw;
      if ('lastDrawGL' in checkpoint) r.lastDrawGL = checkpoint.lastDrawGL;
    }
  });
  const report = () => selected === 'previous' ? previous : (run || saved);
  const text = () => {
    sample();
    const current = report();
    return JSON.stringify({ diagnosticSchema: 1, storageWarning: storageError || undefined,
      currentPage: { ...pageIdentity, testStarted: !!run, sceneStarted: sceneTest(),
        reportSource: current && current === run ? 'live' : 'saved',
        reportFromCurrentPage: current?.page?.id ? current.page.id === pageIdentity.id : null,
        visibleProgress: document.getElementById('loadpct')?.textContent,
        loaded: document.body.classList.contains('loaded'), playing: document.body.classList.contains('playing') },
      report: current }, null, 2);
  };
  function persist() {
    if (!run) return;
    run.lastSeen = new Date().toISOString();
    try { localStorage.setItem(key, JSON.stringify({ schema: 1, current: run, previous })); }
    catch { storageError = 'Storage is unavailable or full. This report cannot survive a reload; copy it now.'; }
  }
  function persistDrawCheckpoint() {
    if (run) safe(() => localStorage.setItem(key + ':draw', JSON.stringify({ runId: run.id,
      draw: run.lastColourDraw, groundGL: run.lastGroundGL, colourGL: run.lastColourGL, canvasUpload: run.canvasUpload,
      lastDraw: run.lastDraw, lastDrawGL: run.lastDrawGL })));
  }
  addEventListener('piter-diagnostic-canvas-upload', e => {
    if (!run) return;
    run.canvasUpload = e.detail; persistDrawCheckpoint();
  });
  function event(kind, detail = '') {
    if (!run) return;
    run.events.push({ ms: Math.round(performance.now() - run.startMs), kind, detail: short(detail) });
    if (run.events.length > LIMIT) run.events.shift();
    persist(); render();
  }
  function render() {
    if (!ui) return;
    const r = report();
    ui.version.textContent = `Diagnostics v${diagnosticsVersion}${r?.version ? ' · Report ' + r.version : ''}`;
    ui.status.textContent = r ? `${r === run ? 'Live attempt' : 'Saved attempt'} · ${r.status} · ${r.phase || 'waiting'}${r.elapsedMs ? ` · ${Math.round(r.elapsedMs / 1000)}s` : ''}` : 'No saved attempt. Tap Start test.';
    ui.notice.textContent = storageError || (run ? 'Recording this page. Even at 100%, the first frame may still be loading. Wait for Loaded; monitoring. If it freezes, reopen this link to recover the report.' : 'No test is running in this page. Press Start test to load the game. A saved report does not restore a running scene.');
    ui.hide.disabled = !sceneTest();
    ui.hide.textContent = sceneTest() ? 'Show current game' : 'Start a scene test first';
    const entries = Object.values(r?.pending || {});
    ui.pending.textContent = entries.length ? 'Waiting: ' + entries.slice(-4).map(p => p.asset).join('\n') : 'No recorded pending requests.';
    ui.tail.textContent = (r?.events || []).slice(-6).map(e => `${(e.ms / 1000).toFixed(1)}s ${e.kind}: ${e.detail}`).join('\n');
    ui.previous.disabled = !previous;
    ui.toggle.textContent = `Diagnostics v${diagnosticsVersion} · ${run ? run.phase || run.status : 'saved reports'}`;
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
        const traced = ['scene-staged', 'scene-js-gzip'].includes(run?.test) && labelURL(url).endsWith('/src/core/baked-worker.js');
        super(traced ? new URL('./src/core/baked-worker-trace.js', location.href) : url, options);
        this.diagnosticRequests = new Map();
        this.diagnosticQueue = []; this.diagnosticBusy = false; this.diagnosticStopped = false;
        this.diagnosticStaged = traced;
        event('worker:created', labelURL(url));
        this.addEventListener('message', e => {
          if (traced && e.data?.loadingDiagnostic === true) {
            // Phase/heartbeat messages are support metadata, never asset replies.
            // Consume them before the original loader sees the matching id.
            e.stopImmediatePropagation();
            const data = e.data;
            run.workerTrace = { ...run.workerTrace, lastMessageMs: Math.round(performance.now() - run.startMs) };
            if (data.kind === 'heartbeat') {
              run.workerTrace.heartbeatMs = run.workerTrace.lastMessageMs;
              run.workerTrace.active = data.active; persist(); return;
            }
            const item = this.diagnosticRequests.get(data.id);
            if (item && run.pending[item.id]) run.pending[item.id].workerPhase = data.phase;
            run.workerTrace.lastPhase = { id: data.id, phase: data.phase || data.kind, asset: item?.asset };
            event('worker:phase', `${data.phase || data.kind} ${item?.asset || ''} ${data.detail || ''}`);
            return;
          }
          const data = e.data, item = this.diagnosticRequests.get(data?.id);
          if (!item) return;
          this.diagnosticRequests.delete(data.id);
          finish(item.id, data.error ? 'worker:asset-error' : 'worker:decoded', `${item.asset} ${data.error || `${data.bytes} bytes, read ${Math.round(data.readMs)}ms, decode ${Math.round(data.decodeMs)}ms`}`);
          if (this.diagnosticStaged) { this.diagnosticBusy = false; this.diagnosticTimer = setTimeout(() => this.drainDiagnosticQueue(), 0); }
        });
        this.addEventListener('error', e => event('worker:error', e.message));
        this.addEventListener('messageerror', () => event('worker:message-error'));
      }
      postMessage(data, ...rest) {
        let item;
        if (data && typeof data.url === 'string' && typeof data.id === 'number') {
          item = { id: request(this.diagnosticStaged ? 'worker:queued' : 'worker:asset', data.url, data.rawBytes), asset: labelURL(data.url) };
          this.diagnosticRequests.set(data.id, item);
        }
        // Only the baked decoder's small request messages are delayed. Other
        // workers and messages retain their original synchronous semantics.
        if (this.diagnosticStaged && item) {
          this.diagnosticQueue.push({ data, rest, item }); this.drainDiagnosticQueue(); return;
        }
        try { return super.postMessage(data, ...rest); }
        catch (error) {
          if (item) { this.diagnosticRequests.delete(data.id); finish(item.id, 'worker:send-error', error.message); }
          throw error;
        }
      }
      drainDiagnosticQueue() {
        clearTimeout(this.diagnosticTimer);
        if (this.diagnosticStopped || this.diagnosticBusy || !this.diagnosticQueue.length) return;
        // Palace builds riverfront before requesting the field. Other areas
        // start with environment (which awaits that field), or build riverfront
        // later: waiting for it there would deadlock the loader.
        const list = window.__ctx?.buildList;
        if ((!list || list[0] === 'landmarksRiverfront') &&
          !window.__stats?.modules?.landmarksRiverfront && !window.__errors?.some(e => e.module === 'landmarksRiverfront')) {
          this.diagnosticTimer = setTimeout(() => this.drainDiagnosticQueue(), 50); return;
        }
        const { data, rest, item } = this.diagnosticQueue.shift();
        this.diagnosticBusy = true;
        if (run?.pending[item.id]) run.pending[item.id].kind = 'worker:asset';
        event('worker:sent', item.asset);
        try { super.postMessage(run?.test === 'scene-js-gzip' ? { ...data, gzipJS: true } : data, ...rest); }
        catch (error) {
          this.diagnosticRequests.delete(data.id); this.diagnosticBusy = false;
          finish(item.id, 'worker:send-error', error.message);
          // Deliver an ordinary asset error to the original loader; do not
          // silently swallow an asynchronous postMessage failure.
          this.dispatchEvent(new MessageEvent('message', { data: { id: data.id, error: error.message } }));
          this.diagnosticTimer = setTimeout(() => this.drainDiagnosticQueue(), 0);
        }
      }
      terminate() {
        this.diagnosticStopped = true; clearTimeout(this.diagnosticTimer); this.diagnosticQueue.length = 0;
        for (const item of this.diagnosticRequests.values()) finish(item.id, 'worker:terminated', item.asset);
        this.diagnosticRequests.clear(); return super.terminate();
      }
    };
  }

  // One inventory after batching, before uploads can release CPU arrays. These
  // are reachable backing buffers, not total process/GPU memory or a live heap.
  function sceneInventory(scene) {
    const geometry = new Set(), textureBuffers = new Set(), textures = new Set(), materials = new Set(), canvases = new Set();
    let meshes = 0, geometryBytes = 0, dataTextureBytes = 0, canvasPixels = 0;
    const largestTextures = [];
    const owners = new Map(), largestBuffers = [];
    const attribute = (a, o) => {
      const b = (a?.isInterleavedBufferAttribute ? a.data.array : a?.array)?.buffer;
      if (b && !geometry.has(b)) {
        geometry.add(b); geometryBytes += b.byteLength;
        const name = short(o.name || o.parent?.name || o.type);
        owners.set(name, (owners.get(name) || 0) + b.byteLength);
        largestBuffers.push({ firstOwner: name, bytes: b.byteLength });
      }
    };
    const texture = (t, label) => {
      if (!t?.isTexture || textures.has(t)) return;
      textures.add(t);
      const image = t.image, b = image?.data?.buffer;
      if (typeof image?.getContext === 'function' && !canvases.has(image)) {
        canvases.add(image); canvasPixels += image.width * image.height;
      }
      if (b && !textureBuffers.has(b)) { textureBuffers.add(b); dataTextureBytes += b.byteLength; }
      largestTextures.push({ label: short(t.name || label), width: image?.width, height: image?.height,
        dataBytes: image?.data?.byteLength || 0 });
    };
    scene?.traverse(o => {
      if (!o.isMesh && !o.isLine && !o.isPoints) return;
      meshes++;
      attribute(o.geometry?.index, o);
      for (const a of Object.values(o.geometry?.attributes || {})) attribute(a, o);
      for (const list of Object.values(o.geometry?.morphAttributes || {})) for (const a of list) attribute(a, o);
      attribute(o.instanceMatrix, o); attribute(o.instanceColor, o);
      for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
        if (!m || materials.has(m)) continue;
        materials.add(m);
        for (const [key, value] of Object.entries(m)) texture(value, key);
        for (const [key, uniform] of Object.entries(m.uniforms || {})) texture(uniform?.value, key);
      }
    });
    largestTextures.sort((a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0));
    return { meshes, materials: materials.size, geometryBuffers: geometry.size, geometryBytes,
      geometryFirstOwners: [...owners].map(([name, bytes]) => ({ name, bytes })).sort((a,b) => b.bytes-a.bytes).slice(0, 15),
      largestGeometryBuffers: largestBuffers.sort((a,b) => b.bytes-a.bytes).slice(0, 10),
      textures: textures.size, dataTextureBytes, canvasCount: canvases.size, canvasPixels,
      canvasRGBA8BytesEstimate: canvasPixels * 4, largestTextures: largestTextures.slice(0, 10) };
  }
  function watchRenderer(renderer) {
    if (!renderer || watchedRenderers.has(renderer)) return;
    watchedRenderers.add(renderer);
    if (run?.options.diagshadows === '0') {
      renderer.shadowMap.enabled = false;
      event('gpu:comparison', 'Sun shadows disabled for this diagnostic run');
    }
    let renders = 0;
    const draw = renderer.renderBufferDirect;
    let draws = 0, depthDraws = 0, groundDraw = false, activeDraw = false, colourCalls = 0;
    const checkpoint = persistDrawCheckpoint;
    if (run?.options.diagdrawtrace === '1') {
      const gl = renderer.getContext();
      for (const name of ['useProgram', 'getProgramInfoLog', 'getShaderInfoLog', 'getProgramParameter', 'getActiveUniform', 'getUniformLocation', 'getActiveAttrib', 'getAttribLocation',
        'createShader', 'compileShader', 'createProgram', 'linkProgram', 'bindVertexArray', 'bindBuffer', 'bufferData', 'bufferSubData',
        'vertexAttribPointer', 'vertexAttribIPointer', 'vertexAttribDivisor', 'enableVertexAttribArray',
        'texImage2D', 'texSubImage2D', 'texStorage2D', 'generateMipmap', 'drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
        const original = gl[name];
        if (typeof original !== 'function') continue;
        const wrapped = function (...args) {
          if (!activeDraw) return Reflect.apply(original, this, args);
          const meta = args.map(v => v === null || ['number', 'string', 'boolean'].includes(typeof v) ? v
            : ArrayBuffer.isView(v) ? { type: v.constructor.name, bytes: v.byteLength }
              : v?.width !== undefined ? { width: v.width, height: v.height, sourceType: v.constructor?.name, dataBytes: v.data?.byteLength } : typeof v);
          const call = { number: ++colourCalls, draw: run.lastDraw.number, pass: run.lastDraw.pass, target: run.lastDraw.target,
            call: name, status: 'entered', args: meta };
          run.lastDrawGL = call;
          if (run.lastDraw.target === 'colour') run.lastColourGL = call;
          if (groundDraw) run.lastGroundGL = call;
          checkpoint();
          try { const result = Reflect.apply(original, this, args); call.status = 'returned'; checkpoint(); return result; }
          catch (error) { call.status = 'failed'; checkpoint(); throw error; }
        };
        try { gl[name] = wrapped; if (gl[name] !== wrapped) event('gpu:trace-unavailable', name); }
        catch { event('gpu:trace-unavailable', name); }
      }
    }
    if (typeof draw === 'function' && run?.options.diagdrawtrace === '1') renderer.renderBufferDirect = function (...args) {
      // The first depth and colour renders. Keep a compact checkpoint to
      // avoid rewriting the whole report for every draw or filling its journal.
      if (![1, 2].includes(run?.renderPass?.number) || !['normal-depth', 'colour'].includes(run.renderPass.target) || document.body.classList.contains('loaded')) return Reflect.apply(draw, this, args);
      const colour = run.renderPass.target === 'colour';
      const [, , geometry, material, object] = args;
      const textures = [];
      const note = (t, label) => { if (t?.isTexture) textures.push({ label, width: t.image?.width, height: t.image?.height, dataBytes: t.image?.data?.byteLength || 0 }); };
      for (const [label, t] of Object.entries(material || {})) note(t, label);
      for (const [label, u] of Object.entries(material?.uniforms || {})) note(u?.value, label);
      // Three r170 stores onBeforeCompile-injected uniforms here, rather than
      // on a MeshToonMaterial. These include the ground's class/distance fields.
      for (const [label, u] of Object.entries(renderer.properties.get(material).uniforms || {}))
        if (!textures.some(t => t.label === label)) note(u?.value, label);
      const submission = { number: colour ? ++draws : ++depthDraws, pass: run.renderPass.number, target: run.renderPass.target,
        status: 'entered', object: short(object?.name || object?.parent?.name),
        material: short(material?.name || material?.type), vertices: geometry?.attributes?.position?.count,
        indices: geometry?.index?.count, instances: object?.isInstancedMesh ? object.count : undefined, textures: textures.slice(0, 12) };
      run.lastDraw = submission; run.lastDrawGL = null;
      if (colour) { run.lastColourDraw = submission; run.lastColourGL = null; }
      checkpoint(); activeDraw = true;
      groundDraw = colour && (object?.name === 'env-ground' || material?.name === 'env-ground' || material?.name === 'diagnostic-ground-plain');
      try { const result = Reflect.apply(draw, this, args); submission.status = 'returned'; checkpoint(); return result; }
      catch (error) { submission.status = 'failed'; checkpoint(); throw error; }
      finally { groundDraw = activeDraw = false; }
    };
    const shadowRender = renderer.shadowMap?.render;
    if (typeof shadowRender === 'function') renderer.shadowMap.render = function (...args) {
      if (!run || document.body.classList.contains('loaded') || renders > 20 || !this.enabled || (!this.autoUpdate && !this.needsUpdate)) return Reflect.apply(shadowRender, this, args);
      const t = performance.now(); run.graphicsPhase = 'shadow:entered'; event('gpu:shadow:start', `render #${renders}`);
      try {
        const result = Reflect.apply(shadowRender, this, args);
        run.graphicsPhase = 'render:entered'; event('gpu:shadow:end', `${Math.round(performance.now() - t)}ms`);
        return result;
      } catch (error) { run.graphicsPhase = 'shadow:failed'; event('gpu:shadow:error', error.message); throw error; }
    };
    for (const method of ['compile', 'compileAsync', 'render']) {
      const original = renderer[method];
      if (typeof original !== 'function') continue;
      renderer[method] = function (...args) {
        // Preparation uploads have their own batch checkpoints. They must not
        // consume the first depth/colour pass numbers or per-draw trace budget.
        if (method === 'render' && args[0]?.userData?.diagnosticGeometryUpload) return Reflect.apply(original, this, args);
        if (!run || document.body.classList.contains('loaded') || method === 'render' && ++renders > 20) return Reflect.apply(original, this, args);
        const t = performance.now();
        if (!run.sceneBuffers && (method === 'compileAsync' || method === 'render')) run.sceneBuffers = safe(() => sceneInventory(args[0]));
        let detail = '';
        if (method === 'render') {
          if (renders === 1) run.geometryBeforeDepthBytes = safe(() => sceneInventory(args[0]).geometryBytes);
          const target = renderer.getRenderTarget(), pipeline = window.__pipeline;
          run.renderPass = { number: renders, target: target === pipeline?.targets?.rtND ? 'normal-depth' : target === pipeline?.targets?.rtColor ? 'colour' : target ? 'postprocess' : 'screen',
            width: target?.width ?? renderer.domElement.width, height: target?.height ?? renderer.domElement.height,
            samples: target?.samples ?? 0, cameraMask: args[1]?.layers?.mask,
            shadowsEnabled: renderer.shadowMap.enabled, shadowsNeedUpdate: renderer.shadowMap.needsUpdate,
            geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures };
          detail = `#${renders} ${run.renderPass.target}; layers=${run.renderPass.cameraMask}; shadows=${run.renderPass.shadowsEnabled}`;
        }
        run.graphicsPhase = method + ':entered'; sample(); event('gpu:' + method + ':start', detail);
        const done = () => {
          if (method === 'render' && renders === 1) run.geometryAfterDepthBytes = safe(() => sceneInventory(args[0]).geometryBytes);
          run.graphicsPhase = method + ':returned'; event('gpu:' + method + ':end', `${Math.round(performance.now() - t)}ms`);
        };
        const failed = error => { run.graphicsPhase = method + ':failed'; event('gpu:' + method + ':error', error.message); };
        try {
          const result = Reflect.apply(original, this, args);
          if (method === 'compileAsync') { result.then(done, failed); return result; }
          done(); return result;
        } catch (error) { failed(error); throw error; }
      };
    }
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
  addEventListener('piter-diagnostic-build', e => {
    if (!run || !sceneTest()) return;
    const { name, state, ...detail } = e.detail;
    run.buildPhase = `${name}:${state}`;
    if (name === 'batch' && state === 'end') run.batch = detail;
    if (name === 'texture-cap' && state === 'end') run.textureCap = detail;
    if (name === 'plain-ground' && state === 'end') run.plainGround = detail;
    if (name === 'sign-atlas-cap' && state === 'end') run.signAtlasCap = detail;
    if (name === 'geometry-upload') run.geometryUpload = { state, ...detail };
    if (name === 'geometry-pack') run.geometryPack = { state, ...detail };
    sample(); event(`build:${name}:${state}`, JSON.stringify(detail));
  });
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
        run.phase = `Reading ${run.area} manifest`; event('probe:manifest');
        const bakeBase = './assets/' + document.querySelector('meta[name="diagnostics-bake"]').content;
        const response = await fetch(bakeBase + 'manifest.json', { signal: abort.signal, cache: 'no-cache' });
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
          worker.postMessage({ id: i, url: new URL(bakeBase + file, location.href).href, rawBytes: manifest.sizes?.[name]?.raw });
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
    if (!sceneTest()) { persist(); render(); return; }
    watchRenderer(ctx?.renderer);
    run.version = document.getElementById('ver')?.textContent || null;
    const percent = parseInt(document.getElementById('loadpct')?.textContent, 10);
    if (Number.isFinite(percent)) {
      const prior = run.lastProgressPercent;
      run.lastProgressPercent = percent;
      if (Number.isFinite(prior) && percent < prior) event('progress:regressed', `${prior}% -> ${percent}% in the same page`);
    }
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
    panel.innerHTML = `<div class="diag-card"><h1>Loading diagnostics</h1><p id="diag-version"></p><p id="diag-notice"></p>
      <p>Reports stay on this device. No report is sent automatically.</p>
      <div id="diag-options"><label>Device / iOS version (optional)<input id="diag-device" type="text" maxlength="120" placeholder="iPhone 16 Pro Max, iOS 26.7"></label>
      <label>Test <select id="diag-test"><option value="scene">Full area scene</option><option value="scene-staged">Full scene: staged decoding</option><option value="scene-js-gzip">Full scene: JS gzip decoder</option><option value="assets-sequential">Assets only: one at a time</option><option value="assets-burst">Assets only: seven together</option><option value="riverfront">Riverfront geometry only</option></select></label>
      <p id="diag-description"></p>
      <label>Decoder <select id="diag-worker"><option value="1">Worker (normal)</option><option value="0">Main thread (comparison)</option></select></label>
      <label><input type="checkbox" id="diag-compile" checked> Early shader compilation (normal)</label>
      <label><input type="checkbox" id="diag-shadows" checked> Sun shadows (uncheck for comparison)</label>
      <label><input type="checkbox" id="diag-atlas" checked> Texture atlases (uncheck to reduce batching memory; may run slower)</label>
      <label><input type="checkbox" id="diag-texture"> Limit static canvas textures to 256px (comparison; blurry signs)</label>
      <label><input type="checkbox" id="diag-drawtrace"> Trace first depth/colour draws (adds diagnostic overhead)</label>
      <label><input type="checkbox" id="diag-ground"> Plain ground material (comparison; removes procedural surface detail)</label>
      <label><input type="checkbox" id="diag-signatlas"> Limit road-sign atlas to 1024px (comparison; blurrier signs)</label>
      <label><input type="checkbox" id="diag-canvasupload"> Upload canvas pixels through ImageData (comparison; extra CPU copying)</label>
      <label><input type="checkbox" id="diag-geometry"> Lower geometry memory (more draw calls; keep source meshes and outlines)</label>
      <label><input type="checkbox" id="diag-uploader"> Upload geometry in small batches before the first frame (also enables lower geometry memory)</label>
      <label><input type="checkbox" id="diag-pack"> Pack static geometry into smaller buffers (comparison; slightly reduced precision; enables lower geometry memory)</label>
      <button id="diag-start" type="button">Start test</button></div>
      <h2 id="diag-status" style="font-size:17px"></h2>
      <div class="diag-row"><button id="diag-current" type="button">Latest report</button><button id="diag-previous" type="button">Previous report</button><button id="diag-copy" type="button">Copy report</button><button id="diag-download" type="button">Download report</button><button id="diag-show" type="button">Show report text</button><button id="diag-hide" type="button">Show game</button></div>
      <pre id="diag-pending"></pre><pre id="diag-tail"></pre>
      <p id="diag-feedback" role="status"></p><textarea id="diag-output" aria-label="Diagnostic report text" readonly hidden></textarea></div>`;
    document.body.append(panel);
    const $ = id => document.getElementById('diag-' + id);
    const toggle = document.createElement('button'); toggle.id = 'diag-toggle'; toggle.type = 'button'; document.body.append(toggle);
    ui = { panel, toggle, hide: $('hide'), version: $('version'), status: $('status'), notice: $('notice'), pending: $('pending'), tail: $('tail'), previous: $('previous'), output: $('output') };
    const showText = () => { ui.output.hidden = false; ui.output.value = text(); ui.output.focus(); ui.output.select(); };
    const changeTest = () => {
      const scene = $('test').value === 'scene', staged = ['scene-staged', 'scene-js-gzip'].includes($('test').value);
      $('worker').disabled = !scene; $('compile').disabled = !(scene || staged);
      $('shadows').disabled = !(scene || staged);
      $('atlas').disabled = !(scene || staged);
      $('texture').disabled = $('drawtrace').disabled = !(scene || staged);
      $('ground').disabled = !(scene || staged);
      $('signatlas').disabled = !(scene || staged);
      $('canvasupload').disabled = !(scene || staged);
      $('geometry').disabled = !(scene || staged);
      $('uploader').disabled = !(scene || staged);
      $('pack').disabled = !(scene || staged);
      $('description').textContent = $('test').value === 'scene-js-gzip' ? 'Full scene with staged decoding. Download each compressed file, then inflate with JavaScript in the worker, bypassing native DecompressionStream.' : staged ? 'Full scene: defer baked requests until riverfront construction and its early compilation finish, then decode one file at a time.' : scene ? 'Build and render the full scene.' : $('test').value === 'riverfront'
        ? 'Import and build the first riverfront module without WebGL or baked-asset workers. If it freezes, reopen this link for the last phase.'
        : 'Test the real worker and seven startup assets without building the scene or using WebGL. Stops after 90 seconds if no result.';
    };
    const requestedTest = new URLSearchParams(location.search).get('test');
    $('compile').checked = new URLSearchParams(location.search).get('earlycompile') !== '0';
    $('worker').value = new URLSearchParams(location.search).get('bakedworker') === '0' ? '0' : '1';
    if (['scene-staged', 'scene-js-gzip', 'assets-sequential', 'assets-burst', 'riverfront'].includes(requestedTest)) $('test').value = requestedTest;
    $('shadows').checked = new URLSearchParams(location.search).get('diagshadows') !== '0';
    $('atlas').checked = new URLSearchParams(location.search).get('diagatlas') !== '0';
    $('texture').checked = new URLSearchParams(location.search).get('diagtexture') === '256';
    $('drawtrace').checked = new URLSearchParams(location.search).get('diagdrawtrace') === '1';
    $('ground').checked = new URLSearchParams(location.search).get('diagground') === 'plain';
    $('signatlas').checked = new URLSearchParams(location.search).get('diagsignatlas') === '1024';
    $('canvasupload').checked = new URLSearchParams(location.search).get('diagcanvasupload') === 'pixels';
    $('geometry').checked = new URLSearchParams(location.search).get('diaggeometry') === 'lean';
    $('uploader').checked = new URLSearchParams(location.search).get('diaguploader') === 'staged';
    if ($('uploader').checked) $('geometry').checked = true;
    $('uploader').onchange = () => { if ($('uploader').checked) $('geometry').checked = true; };
    $('pack').checked = new URLSearchParams(location.search).get('diagpack') === '1';
    if ($('pack').checked) $('geometry').checked = true;
    $('pack').onchange = () => { if ($('pack').checked) $('geometry').checked = true; };
    $('test').onchange = changeTest; changeTest();
    toggle.onclick = () => { panel.hidden = false; render(); };
    $('hide').onclick = () => {
      if (!sceneTest()) return;
      sample(); event('ui:show-game', `${run.phase}; loaded=${run.loaded}; playing=${run.playing}`);
      panel.hidden = true;
    };
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
      // Never inherit bake/shot flags. A diagnostic hand-off retains the pose
      // and state the normal arrival planner validates for this destination.
      const test = $('test').value;
      const query = new URLSearchParams({ q: params.get('q') === 'medium' ? 'medium' : 'performance', bakedworker: test === 'scene' ? $('worker').value : '1', earlycompile: $('compile').checked ? '1' : '0', test });
      if (['scene', 'scene-staged', 'scene-js-gzip'].includes(test)) {
        query.set('diagscene', '1');
        if (params.get('diagscene') === '1' && params.has('ho') && params.has('cam')) {
          for (const name of ['ho', 'cam', 'fly', 'tod', 'look']) if (params.has(name)) query.set(name, params.get(name));
        }
      }
      if (!$('shadows').checked && ['scene', 'scene-staged', 'scene-js-gzip'].includes(test)) query.set('diagshadows', '0');
      if (!$('atlas').checked && ['scene', 'scene-staged', 'scene-js-gzip'].includes(test)) query.set('diagatlas', '0');
      if ($('texture').checked && ['scene', 'scene-staged', 'scene-js-gzip'].includes(test)) query.set('diagtexture', '256');
      if ($('drawtrace').checked && ['scene', 'scene-staged', 'scene-js-gzip'].includes(test)) query.set('diagdrawtrace', '1');
      if ($('ground').checked && ['scene', 'scene-staged', 'scene-js-gzip'].includes(test)) query.set('diagground', 'plain');
      if ($('signatlas').checked && ['scene', 'scene-staged', 'scene-js-gzip'].includes(test)) query.set('diagsignatlas', '1024');
      if ($('canvasupload').checked && ['scene', 'scene-staged', 'scene-js-gzip'].includes(test)) query.set('diagcanvasupload', 'pixels');
      if (($('geometry').checked || $('uploader').checked || $('pack').checked) && ['scene', 'scene-staged', 'scene-js-gzip'].includes(test)) {
        query.set('diaggeometry', 'lean'); query.set('supercells', '0'); query.set('nd', '0');
      }
      if ($('uploader').checked && ['scene', 'scene-staged', 'scene-js-gzip'].includes(test)) query.set('diaguploader', 'staged');
      if ($('pack').checked && ['scene', 'scene-staged', 'scene-js-gzip'].includes(test)) query.set('diagpack', '1');
      history.replaceState(null, '', location.pathname + '?' + query);
      run = { id: Date.now().toString(36), page: { ...pageIdentity }, started: new Date().toISOString(), startMs: performance.now(), status: 'Loading', test, diagnosticsVersion,
        deviceNote: $('device').value.slice(0, 120), userAgent: navigator.userAgent, platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency, deviceMemoryGiB: navigator.deviceMemory,
        screen: { width: screen.width, height: screen.height, dpr: devicePixelRatio },
        viewport: { width: innerWidth, height: innerHeight }, path: location.pathname, options: Object.fromEntries(query),
        area: document.documentElement.dataset.area, pending: {}, events: [], droppedPending: 0, maxHeartbeatGapMs: 0 };
      selected = 'current'; lastTick = performance.now();
      $('options').hidden = true;
      setInterval(sample, 1000);
      if (!sceneTest()) { event('start', test); void (test === 'riverfront' ? probeRiverfront() : probeAssets()); return; }
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
    const arrivalTicket = safe(() => {
      const ticket = sessionStorage.getItem('n4spb.diagnostic-arrival');
      sessionStorage.removeItem('n4spb.diagnostic-arrival');
      return ticket === location.href;
    });
    const arrivalParams = new URLSearchParams(location.search);
    if (arrivalTicket && arrivalParams.get('diagscene') === '1' && arrivalParams.has('ho') && arrivalParams.has('cam') &&
      ['scene', 'scene-staged', 'scene-js-gzip'].includes($('test').value)) $('start').click();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
})();
