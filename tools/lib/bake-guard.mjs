// What the bake checks around the GPU work, all CPU (docs/AREAS.md section 4):
//   auditServed({ served, seen, area })  the served-file audit: every repository file the page loaded during the bake must be in the closure of the area or on the allowlist
//   acquireLock(root) / releaseLock      assets/baked/.bake.lock (O_EXCL, the pid inside): one bake at a time
//   checkThree(root, ctx)                node_modules/three must be the version of package-lock.json (the revision hashes the lock entry, the bake loads the installed files)
//   dirtyInClosure(root, hashed)         the files of a closure with uncommitted changes (git), or null when git is not available
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { threeLockOf } from '../baked-revision.mjs';
import { isAllowedServed } from './closure-rules.mjs';

/** the violations (strings) of a served set: [] when every served repository path is in the closure or allowed */
export function auditServed({ served, seen, area }) {
  const out = [];
  for (const rel of [...served].sort()) {
    if (seen.has(rel) || isAllowedServed(rel)) continue;
    out.push(`${rel} was served to the page of ${area} but is not in its closure ${rel.startsWith('src/') ? '(a dependency the scanner did not see: add the rule to DYNAMIC_IMPORTS / RUNTIME_ASSETS in tools/lib/closure-rules.mjs)' : '(add it to ALLOW_SERVED in tools/lib/closure-rules.mjs if it cannot change what the bake contains, else to RUNTIME_ASSETS with hash:true)'}`);
  }
  return out;
}

export const lockFile = (root) => path.join(root, 'assets', 'baked', '.bake.lock');
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
let held = null;
/** takes the lock or throws; a lock whose process is gone is removed (a crashed bake) */
export function acquireLock(root, pid = process.pid) {
  const f = lockFile(root); fs.mkdirSync(path.dirname(f), { recursive: true });
  for (let attempt = 0; attempt < 2; attempt++) {
    try { const fd = fs.openSync(f, 'wx'); fs.writeSync(fd, `${pid}\n`); fs.closeSync(fd); held = { f, pid }; return f; }
    catch (e) {
      if (e.code !== 'EEXIST') throw e;
      let other = NaN; try { other = parseInt(fs.readFileSync(f, 'utf8'), 10); } catch { /* vanished: retry */ }
      if (Number.isFinite(other) && other > 0 && alive(other)) throw new Error(`another bake is running (${path.relative(root, f).replaceAll('\\', '/')}, pid ${other}). If no bake is running, delete that file.`);
      if (attempt === 0 && Number.isFinite(other)) { try { fs.unlinkSync(f); } catch { /* raced */ } continue; }
      throw new Error(`${path.relative(root, f).replaceAll('\\', '/')} exists but its content is not a pid. If no bake is running, delete that file.`);
    }
  }
  throw new Error('could not take the bake lock');
}
export function releaseLock() {
  if (!held) return;
  try { if (parseInt(fs.readFileSync(held.f, 'utf8'), 10) === held.pid) fs.unlinkSync(held.f); } catch { /* gone */ }
  held = null;
}

/** the installed three.js must be the locked one; returns { version, locked } or throws */
export function checkThree(root, ctx) {
  const locked = threeLockOf(ctx).version;
  let installed; try { installed = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/three/package.json'), 'utf8')).version; } catch (e) { throw new Error(`node_modules/three is not installed (${e.code || e.message}): npm ci`); }
  if (installed !== locked) throw new Error(`node_modules/three is ${installed} but package-lock.json locks ${locked}: the bake would load another three.js than the revision names (npm ci)`);
  return { version: installed, locked };
}

export function dirtyInClosure(root, hashed) {
  let text; try { text = execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }); } catch { return null; }
  const set = new Set(hashed), out = [];
  for (const line of text.split('\n')) { if (line.length < 4) continue; const p = line.slice(3).replace(/^"|"$/g, '').split(' -> ').pop(); if (set.has(p)) out.push(p); }
  return out;
}
