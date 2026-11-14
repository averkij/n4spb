import { VERSION } from '../core/version.js';

const arrow = direction => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${direction === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}"/></svg>`;
const speaker = `<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M4 11h5l6-5v16l-6-5H4z"/><path class="sound-waves" d="M19 9a8 8 0 0 1 0 10m4-14a14 14 0 0 1 0 18"/><path class="sound-off" d="m20 11 6 6m0-6-6 6"/></svg>`;

export async function showMenu(invalid = false) {
  document.title = 'Saint City';
  const root = document.createElement('main');
  root.id = 'start-menu';
  root.innerHTML = `<header class="menu-utilities"><small>v${VERSION}</small><button id="menu-sound" aria-pressed="false">${speaker}</button></header>
    <section class="menu-copy"><h1><span>Saint</span> <span>City</span></h1><button id="menu-start" disabled><span>Начать</span></button><p id="menu-status" role="status">${invalid ? 'Ссылка на вид недействительна. Выберите район.' : 'Загрузка карты…'}</p></section>
    <section class="menu-map" aria-label="Выбор района"><svg id="city-map" viewBox="-28000 -11000 44000 24000" aria-label="Районы Санкт-Петербурга" role="group"></svg><nav class="area-navigation" aria-label="Выбрать район"><button id="area-prev" aria-label="Предыдущий район">${arrow('left')}</button><h2 id="selected-name" aria-live="polite">—</h2><button id="area-next" aria-label="Следующий район">${arrow('right')}</button></nav></section>`;
  document.body.append(root);
  const $ = id => document.getElementById(id);
  let muted = false, audio = null;
  try { muted = localStorage.getItem('piter.menuMute') === '1'; } catch {}
  const soundButton = $('menu-sound');
  const soundLabel = () => {
    soundButton.setAttribute('aria-label', muted ? 'Включить звук' : 'Выключить звук');
    soundButton.setAttribute('aria-pressed', String(muted));
    soundButton.title = muted ? 'Включить звук' : 'Выключить звук';
  };
  soundLabel();
  const unlock = () => {
    if (!audio) { const Audio = window.AudioContext || window.webkitAudioContext; if (Audio) audio = new Audio(); }
    audio?.resume().catch(() => {});
  };
  root.addEventListener('pointerdown', unlock);
  root.addEventListener('keydown', unlock);
  function tone(click = false) {
    if (muted || audio?.state !== 'running') return;
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(click ? 660 : 440, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(click ? 880 : 520, audio.currentTime + .06);
    g.gain.setValueAtTime(.035, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .09);
    o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + .1);
  }
  root.addEventListener('pointerover', e => { const active = e.target.closest('button,path[data-area]'); if (active && !active.disabled && !active.contains(e.relatedTarget)) tone(); });
  root.addEventListener('focusin', e => { if (e.target.matches('button,path[data-area]') && !e.target.disabled) tone(); });
  root.addEventListener('click', e => { const active = e.target.closest('button,path[data-area]'); if (active && !active.disabled) tone(true); }, true);
  soundButton.onclick = () => { muted = !muted; soundLabel(); try { localStorage.setItem('piter.menuMute', muted ? '1' : '0'); } catch {} };
  try {
    const response = await fetch('./assets/menu/map.json');
    if (!response.ok) throw Error('map');
    const { areas, catalogue, water } = await response.json();
    const svg = $('city-map'), ns = 'http://www.w3.org/2000/svg';
    const element = (name, attrs) => {
      const el = document.createElementNS(ns, name);
      for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
      return el;
    };
    // Cut the water out of the land: the artwork remains visible through rivers
    // and the gulf, without a rectangular map backdrop.
    const defs = element('defs', {}), mask = element('mask', { id: 'menu-land-mask', maskUnits: 'userSpaceOnUse', x: -90000, y: -90000, width: 180000, height: 180000 });
    mask.append(element('rect', { x: -90000, y: -90000, width: 180000, height: 180000, fill: 'white' }));
    mask.append(element('path', { d: water, fill: 'black', 'fill-rule': 'evenodd' }));
    defs.append(mask); svg.append(defs);
    const land = element('g', { mask: 'url(#menu-land-mask)' }); svg.append(land);
    let selected = catalogue.find(a => a.id === 'palace') || catalogue[0];
    const select = id => {
      selected = catalogue.find(a => a.id === id);
      $('selected-name').textContent = selected.name;
      svg.querySelectorAll('[data-area]').forEach(p => {
        p.classList.toggle('chosen', p.dataset.area === id);
        p.setAttribute('aria-pressed', String(p.dataset.area === id));
      });
    };
    for (const a of areas) {
      const p = element('path', { d: a.path, 'fill-rule': 'evenodd', class: a.id ? 'live' : 'unavailable' });
      if (a.id) {
        const row = catalogue.find(r => r.id === a.id);
        p.dataset.area = a.id; p.setAttribute('tabindex', '0'); p.setAttribute('role', 'button'); p.setAttribute('aria-label', row.name);
        p.onclick = () => select(a.id);
        p.onkeydown = e => { if (['Enter', ' '].includes(e.key)) { e.preventDefault(); select(a.id); tone(true); } };
        const title = element('title', {}); title.textContent = row.name; p.append(title);
      }
      land.append(p);
    }
    // Portrait screens frame the playable city itself, leaving a quiet margin
    // of surrounding districts. Both frames stay fixed during interaction.
    const bounds = [...svg.querySelectorAll('.live')].map(p => p.getBBox());
    const x0 = Math.min(...bounds.map(b => b.x)), y0 = Math.min(...bounds.map(b => b.y));
    const width = Math.max(...bounds.map(b => b.x + b.width)) - x0;
    const height = Math.max(...bounds.map(b => b.y + b.height)) - y0;
    const portraitFrame = [x0 - width * .1, y0 - height * .07, width * 1.2, height * 1.14].join(' ');
    const portrait = matchMedia('(max-width: 1100px) and (orientation: portrait)');
    const frame = () => svg.setAttribute('viewBox', portrait.matches ? portraitFrame : '-28000 -11000 44000 24000');
    portrait.addEventListener('change', frame); frame();
    const cycle = step => select(catalogue[(catalogue.indexOf(selected) + step + catalogue.length) % catalogue.length].id);
    $('area-prev').onclick = () => cycle(-1);
    $('area-next').onclick = () => cycle(1);
    select(selected.id);
    $('menu-start').disabled = false;
    if (!invalid) $('menu-status').textContent = '';
    $('menu-start').onclick = () => {
      const b = $('menu-start'); b.disabled = true; b.querySelector('span').textContent = 'Загрузка…';
      const query = new URLSearchParams({ play: '1' }), current = new URLSearchParams(location.search);
      for (const key of ['q', 'touch']) if (current.has(key)) query.set(key, current.get(key));
      setTimeout(() => { location.href = selected.page + '?' + query; }, 110);
    };
  } catch { $('menu-status').textContent = 'Не удалось загрузить карту. Обновите страницу.'; }
}
