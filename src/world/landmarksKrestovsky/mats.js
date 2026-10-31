// Shared photographic silver/stone/bronze palette and a single label atlas.
// The atlas follows the existing ParkKit's 4 by 8 layout; no corporate symbols.
import { plazaTexture } from './plaza.js';
export function mats(ctx) {
  const flat=c=>ctx.mat.toon(c,{paint:.025});
  const M={silver:flat('#b8bec2'),steel:flat('#74828a'),white:flat('#e4e5df'),stone:flat('#b9c0be'),stoneShade:flat('#949f9c'),glass:flat('#30434b'),bronze:flat('#665b4c'),dark:flat('#343b43'),granite:flat('#94938c'),wood:flat('#89674d'),pitch:flat('#528d40'),pitchLight:flat('#689a4b'),seats:flat('#3b7c9e')};
  const names=['СТАДИОН САНКТ-ПЕТЕРБУРГ','КРЕСТОВСКИЙ ОСТРОВ','ПРИМОРСКИЙ ПАРК ПОБЕДЫ','М'];
  const tex=ctx.tex.draw(1024,1024,g=>{
    for(let i=0;i<names.length;i++){
      const x=i*256;g.fillStyle=i===3?'#e7e7df':'#b9c0be';g.fillRect(x,0,256,128);
      g.textAlign='center';g.textBaseline='middle';g.fillStyle=i===3?'#2782b3':'#38464b';
      ctx.tex.fitText(g,names[i],x+128,64,238,i===3?90:25,ctx.tex.FONTS.sans,600);
    }
  },{key:'krestovsky-sight-names'});
  M.names=ctx.mat.toon('#e1e3df',{map:tex,paint:0,polygonOffset:-2});
  M.plaza=ctx.mat.toon('#ffffff',{map:plazaTexture(ctx),paint:.03,polygonOffset:-1});     // granite apron round the arena (plaza.js)
  return M;
}
