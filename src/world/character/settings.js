export const CHARACTER_STORAGE_KEY='piter.character';
// Capture the physical keys used by common browser Ctrl shortcuts as well as
// movement. Escape remains with the browser so leaving fullscreen is familiar.
const FULLSCREEN_CONTROL_KEYS=[
  'KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight',
  'Tab','F4','F5','PageUp','PageDown',
  'KeyB','KeyE','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','KeyM','KeyN','KeyO','KeyP','KeyQ','KeyR','KeyT','KeyU','KeyV',
  'Digit0','Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9',
  'Minus','Equal','Numpad0','NumpadAdd','NumpadSubtract',
];
export const CHARACTER_CHOICES=[
  {id:'woman-beret',label:'Девушка в красном берете · Red beret'},
  {id:'man-jacket',label:'Мужчина в кепке · Baseball cap'},
];
export function loadCharacterChoice(storage){
  try{const value=storage?.getItem(CHARACTER_STORAGE_KEY);return value===CHARACTER_CHOICES[1].id||value==='1'?1:0;}catch{return 0;}
}
export function saveCharacterChoice(storage,index){try{storage?.setItem(CHARACTER_STORAGE_KEY,CHARACTER_CHOICES[index===1?1:0].id);return true;}catch{return false;}}

export function appendCharacterSettings(container,system,doc=document){
  const section=doc.createElement('section');section.className='character-settings';
  const heading=doc.createElement('h3');heading.textContent='Персонаж · Character';section.append(heading);
  const select=doc.createElement('select');select.id='character-choice';select.setAttribute('aria-label','Персонаж · Character');
  CHARACTER_CHOICES.forEach((choice,index)=>{const option=doc.createElement('option');option.value=String(index);option.textContent=choice.label;select.append(option);});
  select.value=String(system.index);select.disabled=system.busy;
  select.addEventListener('change',()=>{if(!system.select(Number(select.value)))select.value=String(system.index);});section.append(select);
  const hint=doc.createElement('p');hint.textContent=system.busy?'Выбор доступен после посадки · Finish entering the car to change character.':'Выбор сохраняется между районами · Your choice follows you between districts.';section.append(hint);
  const camera=doc.createElement('p');camera.textContent='V: от третьего лица → дальше → от первого лица · near → far → first person';
  const zoom=doc.createElement('p');zoom.textContent='Колесо мыши: расстояние камеры · Mouse wheel: camera distance';section.append(camera,zoom);
  const credits=doc.createElement('a');credits.href=new URL('../../../assets/characters/CREDITS.md',import.meta.url).href;credits.textContent='Авторы моделей и лицензии · Model credits';credits.target='_blank';credits.rel='noopener';section.append(credits);
  container.append(section);return section;
}
export function installCharacterSettings(ctx,system,doc=typeof document!=='undefined'?document:null){
  if(!doc)return()=>{};
  const style=doc.createElement('style');style.textContent='.character-settings select{width:100%;min-height:44px;padding:8px;font:inherit;color:inherit;background:rgba(255,255,255,.95);border:1px solid #b1b8c4;border-radius:5px}.character-settings p{font-size:13px;line-height:1.5}.character-settings h3{margin:0 0 12px}html.tc #character-settings-button{display:none}';doc.head.append(style);
  const walkHelp=doc.createElement('span');walkHelp.innerHTML=' · <kbd>Ctrl</kbd> Crouch';
  doc.querySelector?.('#help .walk')?.append(walkHelp);
  const keyboard=globalThis.navigator?.keyboard;
  const unlock=()=>{if(!doc.fullscreenElement)keyboard?.unlock?.();};
  if(keyboard?.lock)doc.addEventListener('fullscreenchange',unlock);
  const open=()=>{
    if(!ctx.ui?.panel)return;
    const body=doc.createElement('div'), section=appendCharacterSettings(body,system,doc);
    const panel=ctx.ui.panel(body,{title:'Настройки · Settings'});
    const note=doc.createElement('p');
    note.textContent='Удерживайте Ctrl, чтобы присесть. · Hold Ctrl to crouch. Use Ctrl + arrow keys in a browser tab.';
    section.append(note);
    if(doc.fullscreenEnabled&&keyboard?.lock&&!doc.documentElement.classList.contains('tc')){
      const fullscreen=doc.createElement('button');
      fullscreen.type='button';
      fullscreen.textContent=doc.fullscreenElement?'Выйти из полного экрана · Exit fullscreen':'Полноэкранное управление · Fullscreen controls';
      fullscreen.title='Keep Ctrl + WASD and common Ctrl shortcuts in the game';
      fullscreen.addEventListener('click',async()=>{
        fullscreen.disabled=true;
        try{
          if(doc.fullscreenElement)await doc.exitFullscreen();
          else{
            await doc.documentElement.requestFullscreen();
            try{await keyboard.lock(FULLSCREEN_CONTROL_KEYS);}
            catch(error){await doc.exitFullscreen();throw error;}
          }
          if(body.isConnected)panel.close();
        }catch{
          note.textContent='Полноэкранный захват клавиш недоступен. · Use Ctrl + arrow keys if keyboard lock is unavailable.';
        }finally{fullscreen.disabled=false;}
      });
      section.append(fullscreen);
    }
  };
  system.openSettings=open;
  const controls=doc.getElementById('fly')?.parentElement;
  let button=null;
  if(controls){button=doc.createElement('button');button.type='button';button.className='chip';button.id='character-settings-button';button.textContent='Настройки';button.setAttribute('aria-label','Настройки · Settings');button.addEventListener('click',open);controls.append(button);}
  return()=>{if(keyboard?.lock){doc.removeEventListener('fullscreenchange',unlock);keyboard.unlock();}button?.remove();walkHelp.remove();style.remove();};
}
