// Stone colour and course sizes checked against the actual Arsenalnaya and
// Bezborodko photographs in docs/research/finlyandsky-waterfront.md.
export function makeMats(ctx,prefix,grey=false){
  let seed=7919;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const texture=(name,floor=false)=>ctx.tex.draw(512,512,(g,w,h)=>{
    g.fillStyle=grey?'#9e9e94':'#b6a39a';g.fillRect(0,0,w,h);
    for(let i=0;i<5200;i++){const n=rand();g.fillStyle=n>.55?'rgba(241,232,212,.20)':'rgba(63,59,53,.16)';const r=rand()*1.7+.4;g.fillRect(rand()*w,rand()*h,r,r);}
    const rows=floor?4:4,cols=floor?2:2;
    for(let row=0;row<rows;row++){
      const y=row*h/rows;g.fillStyle='rgba(48,43,38,.25)';g.fillRect(0,y,w,1.7);g.fillStyle='rgba(248,236,218,.30)';g.fillRect(0,y+2,w,1.2);
      for(let col=-1;col<=cols;col++){const x=(col+(row%2)*.5)*w/cols;g.fillStyle='rgba(48,43,38,.23)';g.fillRect(x,y,1.8,h/rows);g.fillStyle='rgba(248,236,218,.25)';g.fillRect(x+2,y,1,h/rows);}
    }
    // Sparse fine mineral streaks, kept below the stone joints in contrast.
    g.strokeStyle='rgba(62,64,57,.10)';g.lineWidth=.6;
    for(let i=0;i<24;i++){const x=rand()*w,y=rand()*h;g.beginPath();g.moveTo(x,y);g.lineTo(x+rand()*45-20,y+rand()*90);g.stroke();}
  },{key:prefix+'-'+name,repeat:[1,1]});
  const t=(name,color,extra={})=>ctx.mat.toon(color,{name:prefix+'-'+name,paint:.025,...extra});
  return{wall:t('ashlar','#ffffff',{map:texture('ashlar')}),floor:t('slabs','#ffffff',{map:texture('slabs',true)}),coping:t('coping',grey?'#b1b0a5':'#baa89c'),stepA:t('steps-a',grey?'#a6a69d':'#b6aaa0'),stepB:t('steps-b',grey?'#999b92':'#aa9c92'),wet:t('water-stain',grey?'#6a7466':'#79766a'),iron:t('iron','#272e2a'),dark:t('recess','#343a34'),figure:t('sphinx-granite','#a3a49a'),figureDark:t('sphinx-shadows','#898e83')};
}
