// The version of the game, shown small in the top right corner of the preloader (src/main.js sets #ver). SemVer, rules in CLAUDE.md ("Versioning"); bump it with `node tools/version.mjs patch|minor|major "note"`
// (it also keeps package.json and CHANGELOG.md in step). RUNTIME-ONLY (tools/baked-revision.mjs RUNTIME_ONLY): only src/main.js imports it, so a bump never makes the bake stale.
export const VERSION = '2.3.4';
