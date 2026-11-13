import { Sculpt, cached, face } from '../lib/figures.js';

// Bezborodko's four small grey-granite human-headed sphinxes. They are not the
// enormous Egyptian royal sphinxes at the Academy: no crown or ceremonial beard.
// Figure front +z, feet at0; total length1.72m, head height1.13m.
export const sphinx=()=>cached('finlyandsky-bezborodko-sphinx',()=>{
  const S=new Sculpt({detail:.68,patina:false});
  S.tube('main',[[0,.26,-.70],[0,.35,-.34],[0,.38,.15],[0,.42,.34]],[[.23,.23],[.28,.26],[.29,.27],[.25,.23]],{seg:12,per:4});
  S.blob('main',[0,.42,.30],[.28,.28,.29],{w:12,h:8});
  for(const side of[-1,1]){
    S.blob('main',[side*.22,.25,-.49],[.16,.24,.25],{w:10,h:7});
    S.tube('main',[[side*.20,.18,-.36],[side*.23,.09,-.08],[side*.22,.08,.23]],[[.10,.08],[.08,.07],[.075,.055]],{seg:8,per:3});
    S.tube('main',[[side*.18,.36,.27],[side*.18,.15,.48],[side*.18,.075,.75]],[[.10,.11],[.08,.065],[.08,.055]],{seg:9,per:4});
    S.blob('main',[side*.18,.07,.79],[.095,.065,.12],{w:8,h:6});
    for(const dx of[-.05,0,.05])S.tube('dark',[[side*.18+dx,.085,.80],[side*.18+dx,.04,.87]],.008,{seg:4,per:1});
  }
  S.tube('main',[[0,.45,.28],[0,.65,.35],[0,.84,.37]],[[.19,.20],[.15,.16],[.13,.15]],{seg:12,per:4});
  face(S,{c:[0,.89,.41],x:[1,0,0],y:[0,1,0],z:[0,0,1]},{scale:1.55,hair:'cap',mouth:'closed',age:.35,brow:.35,jaw:.8,seed:11,detail:.65});
  S.blob('main',[0,.99,.30],[.19,.17,.16],{w:12,h:8});
  S.tube('main',[[0,1.03,.25],[0,.85,.22],[0,.59,.21]],[[.16,.10],[.20,.12],[.24,.11]],{seg:12,per:4});
  for(const side of[-1,1])S.tube('main',[[side*.14,.92,.36],[side*.18,.76,.40],[side*.18,.56,.44]],[[.035,.08],[.035,.08],[.03,.075]],{seg:8,per:3,ref:[0,0,1]});
  S.tube('main',[[0,.29,-.75],[-.20,.15,-.80],[-.35,.09,-.53],[-.30,.08,-.26]],.033,{seg:7,per:4});
  return S.finish({});
});

// Small carved lion mask forms the actual keystone over the grotto arch.
export const lionMask=()=>cached('finlyandsky-bezborodko-lion-mask',()=>{
  const S=new Sculpt({detail:.65,patina:false});
  for(let i=0;i<10;i++){const a=i*Math.PI/5;S.blob('main',[Math.cos(a)*.16,Math.sin(a)*.19,0],[.075,.095,.045],{w:7,h:6});}
  S.blob('main',[0,0,.025],[.15,.185,.075],{w:10,h:8});
  for(const s of[-1,1]){S.blob('main',[s*.06,-.045,.10],[.065,.055,.045],{w:7,h:6});S.blob('dark',[s*.067,.063,.082],[.020,.015,.012],{w:6,h:5});S.blob('main',[s*.13,.145,.01],[.045,.06,.035],{w:7,h:6});}
  S.blob('dark',[0,-.015,.15],[.035,.025,.025],{w:7,h:6});S.blob('dark',[0,-.105,.10],[.045,.04,.018],{w:7,h:6});
  return S.finish({});
});
