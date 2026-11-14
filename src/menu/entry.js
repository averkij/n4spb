import { REGISTRY } from '../areas/registry.js';
import { decodeView } from './share-codec.js';
import { loadingPhotos } from './loading-photos.js';

async function loadScene() {
  try { await import('../main.js'); }
  catch (error) {
    dispatchEvent(new CustomEvent('scene-entry-error', { detail: { message: error.message } }));
    throw error;
  }
}

const params = new URLSearchParams(location.search);
const view = decodeView(location.hash, REGISTRY);
addEventListener('hashchange',()=>{if(location.hash.startsWith('#view='))location.reload();});
const central = document.documentElement.dataset.area === 'palace';
const direct = [...params.keys()].some(k=>!['q','touch','menu'].includes(k));
if (view?.invalid || (central && !direct && !view)) {
  document.documentElement.classList.add('menu-mode');
  const { showMenu } = await import('./menu.js');
  await showMenu(view?.invalid);
} else if (window.__mobileSceneEntry) {
  try { sessionStorage.setItem('n4spb.diagnostic-arrival', window.__mobileSceneEntry); } catch {}
  location.replace(window.__mobileSceneEntry);
} else {
  if(!params.has('shot')&&!params.has('bake'))loadingPhotos(document.documentElement.dataset.area);
  if (view) {
    const destination = REGISTRY[view.area].page;
    if (document.documentElement.dataset.area !== view.area) {
      location.replace(new URL(destination+location.hash, location.href));
    } else {
      window.__sharedView = view;
      params.set('cam',[...view.pos,view.rot[1]*180/Math.PI,view.rot[0]*180/Math.PI].join(','));
      params.set('tod',String(view.tod));
      if (view.look) params.set('look',view.look);
      history.replaceState(null,'',location.pathname+'?'+params+location.hash);
      await loadScene();
    }
  } else await loadScene();
}
