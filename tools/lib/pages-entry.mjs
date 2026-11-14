import assert from 'node:assert/strict';

// Deployment-only selection: authored/bake pages remain unchanged.
function boot(diagnosticPage) {
  const params = new URLSearchParams(location.search);
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  if (mobile && params.get('mobileprofile') !== '0' && !['bake', 'shot', 'only'].some(k => params.has(k))) {
    const target = new URL(diagnosticPage, location.href);
    target.search = location.search; target.hash = location.hash;
    for (const [key, value] of Object.entries({ mobileprofile: '1', diagscene: '1', q: 'performance',
      bakedworker: '1', earlycompile: '1', test: 'scene-js-gzip', diagshadows: '0', diagatlas: '0',
      diagtexture: '256', diagground: 'plain', diagsignatlas: '1024', diagcanvasupload: 'pixels',
      diaguploader: 'staged', diagpack: '1', diaggeometry: 'lean', supercells: '0', nd: '0' })) target.searchParams.set(key, value);
    // The menu entry decides whether the visitor actually wants a scene. Keep
    // mobile visitors on the start screen until Start, a handoff or a shared view.
    globalThis.__mobileSceneEntry = target.href;
  }
  const script = document.createElement('script'); script.type = 'module'; script.src = './src/menu/entry.js';
  document.body.append(script);
}

export function publishedEntry(source, diagnosticPage) {
  const main = '<script type="module" src="./src/menu/entry.js"></script>';
  assert.equal(source.split(main).length, 2, 'published area must have exactly one main entry');
  assert(/^diagnostics(?:-[a-z0-9-]+)?\.html$/.test(diagnosticPage), 'safe generated mobile destination');
  return source.replace(main, `<script data-pages-entry>(${boot.toString()})(${JSON.stringify(diagnosticPage)});</script>`);
}
