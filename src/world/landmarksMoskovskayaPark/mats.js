// Photographic ochre/bronze/granite ensemble palette; one atlas for all names.
import { HEROES } from './sites.js';
export const NAMES=[...HEROES.map(h=>h[1]),'Г. К. Жуков','Зоя Космодемьянская','А. М. Матросов','ВАГОНЕТКА','СКА Арена','1945 · ПАРК ПОБЕДЫ','1941–1944'];
export function mats(ctx) {
 const flat=(c)=>ctx.mat.toon(c,{paint:.025});
 const M={ochre:flat('#dfbd7b'),trim:flat('#ead09a'),shade:flat('#c39c5e'),granite:flat('#9a9386'),red:flat('#936b61'),iron:flat('#303a36'),bronze:flat('#41483d'),patina:flat('#66745b'),silver:flat('#b9c0c1'),steel:flat('#778689'),glass:flat('#2d4757'),wood:flat('#8d6748'),water:flat('#557b83'),foam:flat('#c1d7d9')};
 Object.assign(M,{ivory:flat('#ded9c9'),roofDark:flat('#51545c'),gold:flat('#c2a14e'),roof:flat('#8d9696'),memory:flat('#d0c6ac'),porphyry:flat('#77515b'),leaf:ctx.mat.toon('#6f913e',{paint:.045}),willow:ctx.mat.toon('#7f9a55',{paint:.045}),bark:flat('#655a44'),birch:flat('#c5c6ac'),flowers:flat('#bd567d'),violet:flat('#7962a3'),hedge:flat('#52753c')});
 const atlas=ctx.tex.draw(1024,1024,(g)=>{
  for(let i=0;i<NAMES.length;i++) {
   const x=i%4*256,y=Math.floor(i/4)*128;g.textAlign='center';g.textBaseline='middle';
   if(i===26){g.fillStyle='#c2dbd7';ctx.tex.fitText(g,NAMES[i],x+128,y+64,232,48,ctx.tex.FONTS.sans,600);continue;}
   g.fillStyle='#41483d';g.fillRect(x,y,256,128);g.strokeStyle='#a99e78';g.lineWidth=2;g.strokeRect(x+6,y+8,244,112);g.fillStyle='#ded7b9';ctx.tex.fitText(g,NAMES[i],x+128,y+57,232,23,ctx.tex.FONTS.sans,600);ctx.tex.fitText(g,i<22?'АЛЛЕЯ ГЕРОЕВ':i===25?'ПАМЯТИ ЖЕРТВ БЛОКАДЫ':'МОСКОВСКИЙ ПАРК ПОБЕДЫ',x+128,y+94,230,11,ctx.tex.FONTS.sans,400);
  }
 },{key:'moskovskaya-park-names'});
 M.names=ctx.mat.toon('#e2ddce',{map:atlas,paint:0,polygonOffset:-2,alphaTest:.5});
 return M;
}
