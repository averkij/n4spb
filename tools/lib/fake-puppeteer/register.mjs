// TEST HELPER: `node --import tools/lib/fake-puppeteer/register.mjs tools/bake-scene.mjs ...` replaces puppeteer-core by fake.mjs (no browser, no GPU) so that tools/bake-flow-test.mjs can run the
// whole bake (plan, preflight, server, uploads, audit, publish) on a fabricated repository. Never used by a real bake.
import { register } from 'node:module';
register('./hooks.mjs', import.meta.url);
