// Technological Institute, main Moskovsky frontage: rusticated lower floors, Corinthian order,
// paired round-headed upper lights, lettered attic and small metal dome. OSM r11736537.
// Reference: university history and 2023 architectural photograph cited in central-south.md.
import { buildHouse } from '../landmarksD/house.js';
import { lathe } from '../landmarksD/parts.js';
import { submit,sign } from './common.js';
const X=-1847.6,Z=1565.4,ROT=-Math.PI/2;
export function buildInstitute(K,root){
  const rec=K.L.groupMembers('central-institute').find(b=>b.id==='r11736537');if(!rec)return;
  const P=K.P,stone=K.wall('#d8cbb1'),trim=K.wall('#e4dccb'),shade=K.wall('#b9ac98'),roof=K.wall('#89938f');
  K.begin();
  buildHouse(K,{name:'technological-institute',recs:[rec],hc:19.2,wall:'#d8cbb1',court:'#d4c9b5',roofMat:roof,plinth:.75,railing:false,
    // Campus outline includes all joined teaching wings; claimed building parts are drawn as one closed shell.
    party:()=>false,
    front:(e,{len,f})=>{
      K.wallQuad(K.rust('#d8cbb1'),0,len,0,7.8,2.4);K.wallQuad(stone,0,len,7.8,19.2,4);
      const front=e.n[0]<-.85;
      for(const u of K.bays(.5,len-.5,4.1)){
        const wz=f.z+f.xa[1]*u,centre=front&&wz>1543&&wz<1593;
        K.window({x:u,y:.95,w:1.45,h:3.3,head:'flat',sw:.13,surMat:trim,frame:'white'});
        K.window({x:u,y:5.35,w:1.8,h:4.0,head:'arch',sw:.20,surMat:trim,frame:'white'});
        if(centre){
          for(const dx of [-.57,.57])K.window({x:u+dx,y:11.4,w:.88,h:4.95,head:'arch',sw:.12,surMat:trim,frame:'white',sill:false});
          K.pilaster(trim,u+1.7,.48,10.5,17.55,.25,.85);
        }else K.window({x:u,y:11.1,w:1.5,h:5.25,head:'flat',sw:.16,surMat:trim,frame:'white'});
      }
      for(const y of [4.7,10.05,17.7])P.box(trim,0,len,y,y+.23,.01,.26,'kb');
      return true;
    }});
  // The historic street silhouette is a modest shallow dome, not a monumental church cupola.
  P.push(X,0,Z,ROT);
  P.box(stone,-22.3,22.3,19.25,21.65,-.5,.3,'b');
  P.box(trim,-22.8,22.8,21.65,22.05,-.8,.6,'b');
  for(const u of [-22,-14.7,-7.3,7.3,14.7,22])P.box(trim,u-.36,u+.36,19.3,22.5,-.45,.7,'b');
  P.box(stone,-9,9,19.25,25.5,-19,-1,'b');
  P.box(trim,-9.5,9.5,24.85,25.55,-19.5,-.5,'b');
  lathe(K,roof,'institute-metal-dome',[[0,0],[1,0],[1,.08],[.97,.35],[.8,.7],[.4,.95],[0,1]],0,25.6,-10,9.0,6.9,24);
  // Roof ventilator, the real small circular oculus and a low iron crest; no flagpole.
  P.cyl(shade,[0,29.2,-.75],[0,29.2,-.3],.77,.77,20,true);
  P.cyl(K.mats.glassDark,[0,29.2,-.29],[0,29.2,-.20],.48,.48,20,true);
  P.box(shade,-2.5,2.5,32.55,32.75,-11,-9,'b');
  P.pop();submit(K,root,'institute-silhouette');
  K.begin();P.push(X,0,Z,ROT);
  sign(K,rec.id,X-.46,20.45,Z,31,1.05,-1,0,'ТЕХНОЛОГИЧЕСКИЙ ИНСТИТУТ',{bg:'#d8cbb1',fg:'#665849',size:.61,z:.46});
  P.pop();submit(K,root,'institute-inscription',800);
  K.svc.houses.push({id:rec.id,name:'Технологический институт',x:X,z:Z});
  K.svc.photoSpots.push({x:X-60,z:Z-10,yaw:K.L.yawToward(X-60,Z-10,X,Z),pitch:13,name:'Технологический институт'});
}
