// ui.js — a tiny UI layer for world modules (ctx.ui) and the interaction prompts (ctx.interact).
//
//   ctx.ui.toast(text)                         the HUD toast (the same one the area names use)
//   ctx.ui.panel(el | html, { title, onClose, closeLabel })   modal overlay: Esc / the close button / a click on the dark backdrop closes it, the game input is paused
//                                               while it is open (player.inputLock), the pointer lock is released and restored on close. Returns { close(), el }.
//   ctx.ui.close()                              close the open panel;  ctx.ui.open  true while one is open
//
//   ctx.interact.add({ id, x, y, z | at:()=>({x,y,z}), radius, label, labelEn (strings or functions returning one), key:'KeyE', enabled?:()=>bool, onUse:()=>void })
//   ctx.interact.remove(id | def), .list(), .target (the one shown now), .use() (what E / a tap does)
//   The nearest enabled entry within `radius` (3D distance from the camera) and roughly in front of the camera shows the chip "[E] label" (index.html #interact; on touch
//   screens the chip is tappable). While flying nothing is offered. The DOM elements are optional: without them the logic still runs (tests).
import * as THREE from 'three';

const keyName = (code) => (code || 'KeyE').replace(/^Key/, '').replace(/^Digit/, '');

// Firefox's fingerprinting resistance can hide code for Cyrillic input.
// Keep physical bindings authoritative; only recover the bilingual E/У action
// when the browser supplies no physical key. Never act during IME composition.
export function isInteractionKey(event, code = 'KeyE') {
  if (event.isComposing) return false;
  if (event.code && event.code !== 'Unidentified') return event.code === code;
  return code === 'KeyE' && ['e', 'E', 'у', 'У'].includes(event.key);
}

export function createUI({ player, toast, doc = typeof document !== 'undefined' ? document : null }) {
  const $ = (id) => (doc ? doc.getElementById(id) : null);
  let open = null;          // { el, onClose, wasLocked }

  function close() {
    if (!open) return;
    const o = open; open = null;
    const root = $('panel'); if (root) { root.hidden = true; root.classList.remove('open'); const body = root.querySelector('.panel-body'); if (body) body.replaceChildren(); }
    player.inputLock = Math.max(0, player.inputLock - 1);
    try { o.onClose && o.onClose(); } catch (e) { console.error('panel onClose', e); }
    try { player.dom.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    if (o.wasLocked) player.requestLock();
  }
  function panel(content, opts = {}) {
    if (open) close();
    const root = $('panel');
    const body = root && root.querySelector('.panel-body');
    if (!root || !body) { console.warn('ui.panel: #panel missing in index.html'); return { close() {}, el: null }; }
    const wasLocked = !!doc.pointerLockElement;
    if (wasLocked) { try { doc.exitPointerLock(); } catch (e) { /* ignore */ } }
    body.replaceChildren();
    if (typeof content === 'string') body.innerHTML = content; else if (content) body.append(content);
    const title = root.querySelector('.panel-title'); if (title) title.textContent = opts.title || '';
    const x = root.querySelector('.panel-x'); if (x) { x.textContent = opts.closeLabel || 'Закрыть · Close'; x.disabled = false; }      // (a question disables the shared button while it arms: every panel starts with it enabled)
    root.hidden = false; root.classList.add('open');
    player.inputLock++;
    open = { el: body, onClose: opts.onClose, wasLocked, backdropClose: opts.backdropClose !== false };
    if (x) x.focus({ preventScroll: true });
    return { close, el: body };
  }
  /**
   * A yes / no question on the panel (the prompt of the area gates, core/gates.js): confirm({ title, body (html string or element), yes, no, onYes, onNo, armMs = 700 }).
   * Esc and the "no" button decline; Enter or the "yes" button accept, but only after armMs: every button is disabled until then, so a key held down or a double tap that was meant for the
   * game cannot answer it, and Space is swallowed while the question is open (a jump or a fly-up key must never press the focused button). A click on the dark backdrop does not close it.
   * Returns { close(), el, armed } or the plain panel handle when the DOM has no #panel.
   */
  function confirm({ title, body, yes = 'OK', no = 'Cancel', onYes, onNo, armMs = 700 } = {}) {
    if (!doc) return null;
    const el = doc.createElement('div'); el.className = 'confirm';
    const text = doc.createElement('div'); text.className = 'confirm-body'; if (typeof body === 'string') text.innerHTML = body; else if (body) text.append(body);
    const row = doc.createElement('div'); row.className = 'confirm-row';
    const yesB = doc.createElement('button'); yesB.type = 'button'; yesB.className = 'confirm-yes'; yesB.textContent = yes; yesB.disabled = true;
    row.append(yesB); el.append(text, row);
    let decided = false, armed = false;
    const x = () => { const r = $('panel'); return r && r.querySelector('.panel-x'); };
    const decide = (accepted) => { if (decided) return; decided = true; clearTimeout(timer); confirmKeys.open = false; const cb = accepted ? onYes : onNo; h.close(); try { cb && cb(); } catch (e) { console.error('confirm callback', e); } };
    const h = panel(el, { title, closeLabel: no, backdropClose: false, onClose: () => { if (!decided) { decided = true; clearTimeout(timer); confirmKeys.open = false; try { onNo && onNo(); } catch (e) { console.error('confirm onNo', e); } } } });
    const xb = x(); if (xb) xb.disabled = true;      // the "no" button is armed together with "yes" (Esc declines at any time)
    confirmKeys.open = true; confirmKeys.accept = () => { if (armed) decide(true); };
    yesB.addEventListener('click', () => decide(true));
    const timer = setTimeout(() => { armed = true; yesB.disabled = false; if (xb) xb.disabled = false; try { yesB.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, armMs);
    return { close: () => decide(false), el, get armed() { return armed; } };
  }
  const confirmKeys = { open: false, accept: null };
  if (doc) {
    const root = $('panel');
    if (root) {
      const x = root.querySelector('.panel-x'); if (x) x.addEventListener('click', close);
      root.addEventListener('pointerdown', (e) => { if (e.target === root && (!open || open.backdropClose)) close(); });      // the dark backdrop (not for a question: confirm)
    }
    addEventListener('keydown', (e) => { if (open && e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } }, true);
    // a question is open: Enter answers yes (once armed; not when "Not now" has the focus: Enter then presses that button), a Space press never reaches the game or a focused button.
    // The Space KEYUP is only default-prevented, not stopped: a key that was held before the question opened (fly up, handbrake) must still be seen going up, or it would stay "down".
    const onNo = (e) => e.target && e.target.closest && e.target.closest('.panel-x');
    addEventListener('keydown', (e) => {
      if (!confirmKeys.open) return;
      if (e.code === 'Space') { e.preventDefault(); e.stopPropagation(); return; }
      if (e.code === 'Enter' && !e.repeat && !onNo(e)) { e.preventDefault(); e.stopPropagation(); confirmKeys.accept && confirmKeys.accept(); }
    }, true);
    addEventListener('keyup', (e) => { if (confirmKeys.open && e.code === 'Space') e.preventDefault(); }, true);
  }
  return { panel, confirm, close, toast, get open() { return !!open; }, get modalOpen() { return !!open; } };
}

export function createInteract({ camera, player, ui, doc = typeof document !== 'undefined' ? document : null }) {
  const items = [];
  const chip = doc ? doc.getElementById('interact') : null;
  let target = null, shown = '';
  const _p = new THREE.Vector3(), _f = new THREE.Vector3();

  function posOf(d) { if (d.at) { const a = d.at(); return a; } return d; }
  function add(def) {
    if (!def || typeof def.onUse !== 'function') throw new Error('interact.add: onUse is required');
    const d = { radius: 2.5, key: 'KeyE', label: '', labelEn: '', ...def, id: def.id ?? 'i' + items.length };
    const i = items.findIndex((o) => o.id === d.id); if (i >= 0) items.splice(i, 1);
    items.push(d);
    return d;
  }
  function remove(idOrDef) { const i = items.findIndex((o) => o === idOrDef || o.id === idOrDef); if (i >= 0) { if (target === items[i]) target = null; items.splice(i, 1); return true; } return false; }

  /** pick the nearest enabled item within its radius and roughly in front of the camera; update the chip */
  function update() {
    target = null;
    if (!player.fly && player.inputLock === 0) {
      camera.getWorldDirection(_f);
      let best = Infinity;
      for (const d of items) {
        if (d.enabled && !d.enabled()) continue;
        const a = posOf(d); if (!a) continue;
        _p.set(a.x - camera.position.x, (a.y ?? camera.position.y) - camera.position.y, a.z - camera.position.z);
        const dist = _p.length();
        if (dist > d.radius || dist >= best) continue;
        if (dist > 1.2 && _p.normalize().dot(_f) < 0.25) continue;                 // roughly in front (about +-75 degrees), unless right at it
        best = dist; target = d;
      }
    }
    if (chip) {
      const lab = (v) => (typeof v === 'function' ? v() : v);
      const txt = target ? `[${keyName(target.key)}] ${lab(target.label)}${lab(target.labelEn) ? ' · ' + lab(target.labelEn) : ''}` : '';
      if (txt !== shown) { shown = txt; chip.textContent = txt; chip.classList.toggle('show', !!target); }
    }
    return target;
  }
  function use() { if (target) { const t = target; try { t.onUse(); } catch (e) { console.error('interact onUse', e); } return true; } return false; }

  if (doc) {
    addEventListener('keydown', (e) => {
      if (e.repeat || !target || ui.modalOpen || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
      if (isInteractionKey(e, target.key)) { e.preventDefault(); use(); }
    });
    if (chip) chip.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); use(); });      // touch screens: tap the chip
  }
  return { add, remove, list: () => items.slice(), update, use, get target() { return target; } };
}
