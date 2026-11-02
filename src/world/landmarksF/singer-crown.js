// Singer's photographed crown: a tapered glazed pavilion, sculpted copper
// ribs, draped garlands, eagle and two figures supporting the tilted globe.
import * as THREE from 'three';
import { Parts } from './kit.js';
import { registerLOD } from '../../core/spatial.js';
import { buildSingerSculptures } from './singer-sculpture.js';

const profile = [[24.7,3.5],[25.15,3.35],[25.8,3.04],[27,2.87],[28.5,2.61],[29.8,2.27],[30.65,1.98],[31.15,1.94]];
const at = (a,y,r) => [Math.sin(a)*r,y,Math.cos(a)*r];
function tube(P,mat,points,r,seg=5) {
  for(let i=1;i<points.length;i++)P.cyl(mat,points[i-1],points[i],r,r,seg,false);
}
function circle(P,mat,y,r,width) {
  const p=[];for(let i=0;i<=48;i++)p.push(at(i*Math.PI/24,y,r));tube(P,mat,p,width);
}
function leaf(P,S,a,y,r,length=.5,width=.17,tilt=0) {
  // Folded lanceolate copper leaf with a visible raised midrib.
  const n=[Math.sin(a),0,Math.cos(a)],u=[Math.cos(a),0,-Math.sin(a)];
  const point=(x,dy,d)=>[n[0]*(r+d)+u[0]*(x+tilt*dy),y+dy,n[2]*(r+d)+u[2]*(x+tilt*dy)];
  const b=point(0,0,0),tip=point(0,length,.1),mid=point(0,length*.48,.16),l=point(-width,length*.45,.04),rr=point(width,length*.45,.04);
  P.quad(S.green,b,l,tip,mid,n);P.quad(S.greenDark,b,mid,tip,rr,n);
  P.cyl(S.green,b,tip,.022,.012,4,false);
}
function stoneArch(P,S) {
  P.push(0,0,.9);
  const z=3.43,cy=21.35,inner=2.82,outer=3.61;
  for(let i=0;i<24;i++){
    const a=i*Math.PI/24,b=(i+1)*Math.PI/24;
    const pt=(t,r,zz)=>[Math.cos(t)*r,cy+Math.sin(t)*r,zz];
    P.quad(S.grayLight,pt(a,inner,z),pt(a,outer,z),pt(b,outer,z),pt(b,inner,z),[0,0,1]);
    P.quad(S.trim,pt(a,outer,z-.38),pt(a,outer,z),pt(b,outer,z),pt(b,outer,z-.38),[Math.cos((a+b)/2),Math.sin((a+b)/2),0]);
  }
  for(const [r,w,zz]of[[2.85,.11,3.55],[3.12,.08,3.57],[3.61,.12,3.5]]){
    const p=[];for(let i=0;i<=32;i++){const a=i*Math.PI/32;p.push([Math.cos(a)*r,cy+Math.sin(a)*r,zz]);}tube(P,S.trim,p,w);
  }
  // A shallow oak arch inside the carved stone, with dark glass behind it.
  const s=new THREE.Shape();s.moveTo(-2.7,20.55);s.lineTo(2.7,20.55);s.lineTo(2.7,cy);s.absarc(0,cy,2.7,0,Math.PI,false);s.closePath();
  P.face(S.win,s,3.46,1,12);
  const rim=[];for(let i=0;i<=24;i++){const a=i*Math.PI/24;rim.push([Math.cos(a)*2.71,cy+Math.sin(a)*2.71,3.61]);}tube(P,S.oak,rim,.07);
  for(const x of[-1.35,0,1.35])P.cyl(S.oak,[x,20.55,3.6],[x,cy+Math.sqrt(2.7**2-x*x),3.6],.05,.05,5,false);
  P.pop();
}

export function buildSingerCrown(K,S,cx,cz) {
  const P=K.P,D=new Parts();
  // The eagle and stone arch address the rounded street corner, rather than
  // sitting parallel to either flat elevation.
  P.push(cx,0,cz,.77);D.m.copy(P.m);
  stoneArch(P,S);
  P.geo(S.green,new THREE.LatheGeometry([[0,0],[3.68,0],[3.78,.15],[3.57,.43],[3.35,.75],[3.16,.95]].map(q=>new THREE.Vector2(...q)),32),0,24.1,0);
  // Individual curved panes follow the bell profile. Bronze ribs lie outside
  // the glazing; no opaque cylinder or stack of bars hides the tall windows.
  const bays=12,step=Math.PI*2/bays;
  for(let k=0;k<bays;k++){
    const a=k*step;
    for(let j=1;j<profile.length;j++){
      const [y0,r0]=profile[j-1],[y1,r1]=profile[j];
      for(let q=0;q<3;q++){
        const aa=a+step*q/3,bb=a+step*(q+1)/3;
        P.quad(S.win,at(aa,y0,r0),at(bb,y0,r0),at(bb,y1,r1),at(aa,y1,r1),[Math.sin((aa+bb)/2),.15,Math.cos((aa+bb)/2)]);
      }
    }
    tube(P,S.green,profile.map(([y,r])=>at(a,y,r+.09)),.095,6);
    tube(D,S.bronze,profile.map(([y,r])=>at(a+.036,y,r+.075)),.026,4);
    // Slim window mullions stop below a curved arched crown in each bay.
    tube(P,S.trim,profile.slice(1,-1).map(([y,r])=>at(a+step/2,y,r+.035)),.035,4);
    const arch=[];
    for(let i=0;i<=16;i++){
      const t=i/16,ang=a+step*t,yy=29.3+Math.sin(t*Math.PI)*1.2;
      const r=2.38-(yy-29.3)*.37;arch.push(at(ang,yy,r+.06));
    }
    tube(P,S.green,arch,.07,5);
    for(const [yy,rr]of[[25.25,3.36],[30.75,2.04]]){
      const p=[];for(let i=0;i<=16;i++){const t=i/16;p.push(at(a+t*step,yy-.3*Math.sin(t*Math.PI),rr+.11));}tube(D,S.green,p,.065);
      for(let i=1;i<5;i++)leaf(D,S,a+step*i/5,yy-.29*Math.sin(i*Math.PI/5),rr+.15,.32,.105,(i-2.5)*.2);
    }
    for(const offset of[-.05,.05])leaf(D,S,a+offset,24.6,3.58,.9,.22,offset*5);
  }
  for(const [y,r,w]of[[24.75,3.53,.13],[25.16,3.42,.1],[30.85,2.02,.1],[31.13,2,.12]])circle(P,S.green,y,r,w);
  P.geo(S.green,new THREE.LatheGeometry([[0,0],[2.04,0],[2.05,.18],[1.77,.48],[1.45,.85],[1.12,1.15],[0,1.25]].map(q=>new THREE.Vector2(...q)),32),0,31.1,0);
  for(let k=0;k<18;k++){
    const a=k*Math.PI/9;leaf(D,S,a,31.28,1.94,.6,.17);leaf(D,S,a+.07,31.65,1.55,.55,.17);
  }
  // Relief swags under the eagle and heavy scroll feet at the pavilion base.
  for(let k=0;k<12;k++){
    const a=k*step,p=[];
    for(let j=0;j<=18;j++){const t=j/18,ang=a+t*step;p.push(at(ang,25.1-.36*Math.sin(t*Math.PI),3.65+.08*Math.sin(t*Math.PI)));}
    tube(D,S.greenDark,p,.11);
    const end=at(a,25.23,3.62);D.geo(S.green,new THREE.SphereGeometry(.2,7,5),...end,0,0,0,1,.75,.65);
  }
  buildSingerSculptures(P,S);
  P.pop();
  const root=new THREE.Group();root.name='singer-crown-carving';D.build(root,{name:'singer-crown-carving',cast:true,receive:true});
  root.updateMatrixWorld(true);root.traverse(o=>{if(o.isMesh)registerLOD(o,280);});
  K.ctx.addStatic(root);K.extraTris+=D.tris;
}
