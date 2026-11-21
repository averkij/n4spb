import { AREA_LABELS } from './area-labels.js';

export async function loadingPhotos(area) {
  if (!Object.hasOwn(AREA_LABELS, area)) return;
  const intro = document.getElementById('intro'), fact = document.getElementById('fact');
  if (!intro || !fact) return;
  const title = document.getElementById('stname');
  title.textContent = AREA_LABELS[area]; title.dataset.ready = '';
  const kicker = intro.querySelector('.kicker');
  kicker?.remove();
  const json = async response => { if (!response.ok) throw Error('preloader content'); return response.json(); };
  // One missing asset must not suppress the other content or the loading controls.
  const [photos, content] = await Promise.allSettled([
    fetch(`./assets/splash/${area}/views.json`).then(json),
    fetch(`./assets/splash/${area}/facts.json`).then(json),
  ]);
  const views = photos.status === 'fulfilled' && Array.isArray(photos.value) ? photos.value : [];
  const facts = content.status === 'fulfilled' && Array.isArray(content.value)
    ? content.value : [];
  if (document.body.classList.contains('playing') || !intro.isConnected) return;
  // The inline startup has already picked a random screenshot. Keep it, avoiding
  // a second image flashing in while metadata arrives. A standalone caller can
  // still initialize its image here. Neither image nor fact rotates during load.
  const initialArt = intro.style.getPropertyValue('--art');
  let slide = views.findIndex((_, i) => initialArt.includes(`./assets/splash/${area}/${i + 1}.jpg`));
  if (views.length && slide < 0) {
    slide = Math.floor(Math.random() * views.length);
    intro.style.setProperty('--art', `url("./assets/splash/${area}/${slide+1}.jpg")`);
  }
  const isFact = text => typeof text === 'string' && text.trim();
  const references = views[slide]?.facts;
  const related = Array.isArray(references)
    ? references.filter(Number.isInteger).map(number => facts[number - 1]).filter(isFact) : [];
  const choices = related.length ? related : facts.filter(isFact);
  if (choices.length) fact.textContent = choices[Math.floor(Math.random() * choices.length)];
  fact.dataset.ready = '';
}
