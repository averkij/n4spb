export const CHARACTER_STORAGE_KEY='piter.character';
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
  const camera=doc.createElement('p');camera.textContent='V: от третьего лица → дальше → от первого лица · near → far → first person';section.append(camera);
  const credits=doc.createElement('a');credits.href=new URL('../../../assets/characters/CREDITS.md',import.meta.url).href;credits.textContent='Авторы моделей и лицензии · Model credits';credits.target='_blank';credits.rel='noopener';section.append(credits);
  container.append(section);return section;
}
export function installCharacterSettings(ctx,system,doc=typeof document!=='undefined'?document:null){
  if(!doc)return()=>{};
  const style=doc.createElement('style');style.textContent='.character-settings select{width:100%;min-height:44px;padding:8px;font:inherit;color:inherit;background:rgba(255,255,255,.95);border:1px solid #b1b8c4;border-radius:5px}.character-settings p{font-size:13px;line-height:1.5}.character-settings h3{margin:0 0 12px}html.tc #character-settings-button{display:none}';doc.head.append(style);
  const open=()=>{
    if(!ctx.ui?.panel)return;
    const body=doc.createElement('div');appendCharacterSettings(body,system,doc);ctx.ui.panel(body,{title:'Настройки · Settings'});
  };
  system.openSettings=open;
  const controls=doc.getElementById('fly')?.parentElement;
  let button=null;
  if(controls){button=doc.createElement('button');button.type='button';button.className='chip';button.id='character-settings-button';button.textContent='Настройки';button.setAttribute('aria-label','Настройки · Settings');button.addEventListener('click',open);controls.append(button);}
  return()=>{button?.remove();style.remove();};
}
