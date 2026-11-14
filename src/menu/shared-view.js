import { encodeView } from './share-codec.js';
export function installSharedView({camera,tod,area,registry,toast,start,held,canShare,player,audio}) {
  try {audio.muted=localStorage.getItem('piter.menuMute')==='1';document.getElementById('mute')?.setAttribute('aria-pressed',String(audio.muted));}catch{}
  const unlock=()=>{try{audio.start();}catch{}if(audio.context?.state==='running'){removeEventListener('pointerdown',unlock,true);removeEventListener('keydown',unlock,true);}};
  addEventListener('pointerdown',unlock,true);addEventListener('keydown',unlock,true);
  let resume;
  for(const el of document.querySelectorAll('#help .desk')) el.insertAdjacentHTML('beforeend',' · <kbd>P</kbd> Share view');
  if(held){
    document.body.classList.add('playing');
    resume=document.createElement('button');resume.id='shared-resume';resume.textContent='Исследовать →';
    resume.style.cssText='position:fixed;z-index:100;bottom:28px;left:50%;transform:translateX(-50%);padding:14px 28px;border:1px solid #e2b6f0;border-radius:4px;background:#301b40;color:white;font:600 16px Arial;cursor:pointer';
    resume.onclick=()=>start();document.body.append(resume);
  }
  let busy=false;
  addEventListener('keydown',async e=>{
    if(e.code!=='KeyP'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||busy||(!held&&!canShare())||e.target?.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName))return;
    e.preventDefault();busy=true;
    const view={area,pos:camera.position.toArray(),rot:[camera.rotation.x,camera.rotation.y,camera.rotation.z],fov:camera.fov,tod:tod.k,look:tod.variant,noui:document.body.classList.contains('noui')};
    const url=encodeView(view,location.href,registry[area].page);
    try{await navigator.clipboard.writeText(url);toast('Ссылка скопирована');}
    catch{
      document.exitPointerLock?.();
      const enabled=player.enabled;player.enabled=false;
      const dialog=document.createElement('dialog');dialog.style.cssText='max-width:90vw;padding:24px;background:#281733;color:white;border:1px solid #c98fe1;border-radius:8px';
      const label=document.createElement('label');label.textContent='Скопируйте ссылку на вид';
      const input=document.createElement('input');input.value=url;input.readOnly=true;input.style.cssText='display:block;width:65vw;margin:16px 0;padding:10px';label.append(input);
      const close=document.createElement('button');close.textContent='Закрыть';close.onclick=()=>dialog.close();dialog.append(label,close);document.body.append(dialog);dialog.addEventListener('close',()=>{player.enabled=enabled;dialog.remove();},{once:true});dialog.showModal();input.select();
    }finally{busy=false;}
  });
  return {release(){held=false;resume?.remove();}};
}
