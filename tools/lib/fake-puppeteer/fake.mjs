// A fake puppeteer-core for tools/bake-flow-test.mjs: pages do what the baking page does, over plain HTTP against the real bake server. Configured by environment variables:
//   FAKE_BAKE_LOADS  JSON { "<page>": ["repo/path", ...] }   the files the page loads (the closure)    FAKE_BAKE_KEYS  JSON ["field", ...]   all product keys (nav-low is uploaded by the nav stage)
//   FAKE_BAKE_EXTRA  JSON { "<page>": ["repo/path", ...] }   files the page loads that it should not    FAKE_BAKE_FAIL  "<page>:<quality>"   that stage raises a page error
//   FAKE_BAKE_EDIT   JSON { "<page>": ["rel", "text"] }      append text to a repository file while that page is being baked (the source changes during the bake)
import fs from 'node:fs';
import path from 'node:path';
const env = (k, d) => (process.env[k] ? JSON.parse(process.env[k]) : d);
const sink = () => {};
function makePage() {
  const handlers = {}; let lastUrl = '';
  return {
    on: (ev, fn) => { (handlers[ev] ||= []).push(fn); },
    createCDPSession: async () => ({ send: async () => {}, on: sink }),
    evaluateOnNewDocument: async () => {},
    url: () => lastUrl, title: async () => 'fake',
    waitForFunction: async () => {},
    evaluate: async () => [],
    close: async () => {},
    async goto(url) {
      lastUrl = url; const u = new URL(url), page = u.pathname.slice(1), q = u.searchParams.get('bake') === 'nav' ? 'performance' : 'medium', base = u.origin;
      if (process.env.FAKE_BAKE_FAIL === `${page}:${q}`) { for (const fn of handlers.pageerror || []) fn(new Error('fake page error')); await new Promise((r) => setTimeout(r, 5)); throw new Error('fake page error'); }
      const loads = env('FAKE_BAKE_LOADS', {})[page] || [], extra = env('FAKE_BAKE_EXTRA', {})[page] || [];
      if (q === 'medium') for (const rel of [...loads, ...extra]) await (await fetch(`${base}/${rel}${rel === page ? u.search : ''}`)).arrayBuffer();
      const rev = (await (await fetch(`${base}/__baked_revision`)).json()).revision;
      const keys = env('FAKE_BAKE_KEYS', []);
      const put = async (name, buf) => { const cut = Math.floor(buf.length / 2); for (const [off, end] of [[0, cut], [cut, buf.length]]) { const r = await fetch(`${base}/__bake/${name}`, { method: 'POST', body: buf.subarray(off, end), headers: { 'X-Bake-Offset': String(off), 'X-Bake-Final': end === buf.length ? '1' : '0' } }); if (!r.ok) throw new Error(`upload ${name}: ${r.status}`); } };
      if (q === 'medium') for (const k of keys.filter((x) => x !== 'nav-low')) await put(k, Buffer.from(`${k}|${page}|${rev}|`.repeat(20)));
      else {
        const inputs = await (await fetch(`${base}/__bake_inputs`)).json();
        if (inputs.revision !== rev || inputs.files.field !== `field.${rev}.bin.gz`) throw new Error(`the nav stage sees ${JSON.stringify(inputs.files)} for revision ${rev}`);
        await put('nav-low', Buffer.from(`nav-low|${page}|${rev}|`.repeat(20)));
      }
      const edit = env('FAKE_BAKE_EDIT', {})[page];
      if (edit && q === 'performance') fs.appendFileSync(path.join(process.env.FAKE_BAKE_ROOT, edit[0]), edit[1]);
      return { status: () => 200 };
    },
  };
}
export default { launch: async () => ({ newPage: async () => makePage(), close: async () => {} }) };
