import * as THREE from 'three';
import { registerLOD } from '../../core/spatial.js';
import { BUILDINGS } from '../data/city.js';
import { Parts } from '../landmarksD/kit.js';
import { areaUnderpasses, areaUnderpassLifts, localToWorld } from './regional-underpass-sites.js';
export { regionalUnderpassSites } from './regional-underpass-sites.js';

const ink = {
  stone:'#aaa6a0', riser:'#706d68', nosing:'#c0b9ad', edge:'#d1cbc0', granite:'#867b79', pinkgranite:'#9a746d',
  wall:'#c8c4b7', tile:'#9d9b90', steel:'#566669', handrail:'#b7bfbd', lamp:'#ffeabc',
  green:'#377e69', enamel:'#53776f', glass:'#577877', frame:'#445654', amber:'#dbb14e',
  aluminium:'#b6bdbe', stainless:'#909b9c', aqua:'#438c8d', anthracite:'#41484a',
};

// Share a single vertex-colour material across the cut. A flight, its joinery and its
// handrails travel as one mesh, including when streamed by the static-world loader.
function emit(ctx, p, site, label) {
  const pos=[], norm=[], col=[], idx=[];
  for (const [part,b] of p.b) {
    const off=pos.length/3, color=new THREE.Color(ink[part]);
    for(let i=0;i<b.n;i++)color.toArray(col,col.length);
    pos.push(...b.pos);norm.push(...b.nrm);
    for(const i of b.idx)idx.push(i+off);
  }
  const g=new THREE.BufferGeometry();
  for(const [key,a] of [['position',pos],['normal',norm],['color',col]])g.setAttribute(key,new THREE.Float32BufferAttribute(a,3));
  g.setIndex(idx);g.computeBoundingSphere();
  const mesh=new THREE.Mesh(g,ctx.mat.toon('#ffffff',{vertexColors:true,name:'public-underpass-stone-and-joinery'}));
  mesh.name=label;mesh.position.set(site.x,0,site.z);mesh.rotation.y=site.axis;
  mesh.castShadow=true;mesh.receiveShadow=true;
  ctx.addStatic(mesh);mesh.updateWorldMatrix(true,false);registerLOD(mesh,190);
}

function boxCollider(ctx,s,u,v,w,d,bottom,top,walk=false) {
  const pt=localToWorld(s,u,v);
  return walk ? ctx.physics.addWalkBox(pt.x,pt.z,w,d,s.axis,top,bottom) :
    ctx.physics.addBox(pt.x,pt.z,w,d,s.axis,bottom,top);
}

function horizontal(ctx,p,s,v0,v1,y) {
  const r=s.width/2;
  p.box('stone',-r,r,y-.12,y,v0,v1,'b');
  boxCollider(ctx,s,0,(v0+v1)/2,s.width,v1-v0+.002,y-.18,y,true);
}

function flight(ctx,p,s,f) {
  const r=s.width/2, length=f.end-f.start, tread=length/f.steps;
  const rise=(f.top-f.bottom)/f.steps;
  for(let i=0;i<f.steps;i++) {
    const v=f.start+i*tread, y=f.top-(i+1)*rise;
    // From street level the risers face away. The worn granite leading edge
    // keeps each tread legible in shade, without coplanar overlay geometry.
    const lip=v+tread-Math.min(.042,tread*.16);
    p.quad('stone',[-r,y,v],[r,y,v],[r,y,lip],[-r,y,lip],[0,1,0]);
    p.quad(i===0||i===f.steps-1?'edge':'nosing',[-r,y,lip],[r,y,lip],
      [r,y,v+tread],[-r,y,v+tread],[0,1,0]);
    p.quad('riser',[-r,y,v],[-r,y+rise,v],[r,y+rise,v],[r,y,v],[0,0,1]);
  }
  const c=localToWorld(s,0,(f.start+f.end)/2);
  ctx.physics.addStairs(c.x,c.z,s.width,length,s.axis,f.top,f.bottom,f.steps);
  // Narrow channels for bicycle or stroller wheels alongside the stairs. These
  // are separate from the pedestrian path and are not wheelchair access ramps.
  const channels=s.style==='sport'||s.style==='moscow'||(s.style==='arcade'&&s.ref==='2')||
    (s.style==='pinkgranite'&&s.ref!=='3');
  if(channels) {
    const centers=s.style==='sport'&&s.ref==='8' ? [r-.34] : [r-.35,r-.87];
    for(const u of centers) {
      const a=f.top+.025,b=f.bottom+.025,w=.065;
      p.quad('stainless',[u-w,a,f.start],[u+w,a,f.start],[u+w,b,f.end],[u-w,b,f.end],[0,1,0]);
      for(const x of [u-w,u+w])p.cyl('aluminium',[x,a+.018,f.start],[x,b+.018,f.end],.012,.012,5);
      const pt=localToWorld(s,u,(f.start+f.end)/2);
      ctx.physics.addWalkRamp(pt.x,pt.z,2*w,length,s.axis,a,b,.055);
    }
  }
  for(const side of [-1,1]) {
    const u=side*(r-.15), top=f.top+.86, bottom=f.bottom+.86;
    p.cyl('handrail',[u,top,f.start],[u,bottom,f.end],.039,.039,8);
    for(let i=0;i<=3;i++) {
      const t=i/3,v=f.start+length*t,y=top+(bottom-top)*t;
      p.cyl('steel',[u,y-.13,v],[side*(r+.02),y-.13,v],.023,.023,6);
      p.col('steel',u,v,y-.13,y,.023,.023,6);
    }
  }
}

function lowerDoors(ctx,p,s,v,y) {
  const r=s.width/2, leaf=Math.min(1.06,r-.19), h=2.13;
  // The public passage is represented only as far as its entrance landing. Two
  // open glazed swing doors and a lit recess give a usable threshold and turn space.
  p.box('frame',-r,r,y+h,y+h+.09,v-.07,v+.07);
  for(const side of [-1,1]) {
    const hinge=side*leaf;
    p.box('frame',hinge-.055,hinge+.055,y,y+h,v-.07,v+.07);
    p.box('glass',Math.min(hinge,side*r),Math.max(hinge,side*r),y+.12,y+h-.07,v-.035,v+.035);
    boxCollider(ctx,s,(hinge+side*r)/2,v,r-leaf,.09,y,y+h);
    // Each leaf is folded back against its reveal, leaving the centre walkable.
    p.box('glass',hinge-.024,hinge+.024,y+.1,y+h-.07,v+.03,v+leaf);
    for(const z of [v+.04,v+leaf])p.box('frame',hinge-.045,hinge+.045,y+.04,y+h,z-.032,z+.032);
    for(const h0 of [.075,1.01,h-.055])p.box('handrail',hinge-.043,hinge+.043,y+h0-.028,y+h0+.028,v+.03,v+leaf);
    boxCollider(ctx,s,hinge,v+leaf/2,.09,leaf,y,y+h);
  }
}

function streetSign(ctx,p,s) {
  const w=1.98,h=.43,x=0;
  // A public direction plate is embedded in the far granite parapet at the open
  // stair mouths. At enclosed entrances it hangs above the glazed street doors.
  const v=s.canopy ? -.08 : s.opening-.07, y=s.canopy ? 2.47 : .42;
  p.box('frame',x-w/2-.025,x+w/2+.025,y-h/2-.025,y+h/2+.025,v-.08,v+.055);
  const texture=ctx.tex.draw(512,128,(g,cw,ch)=>{
    g.fillStyle='#f2f2e9';g.fillRect(0,0,cw,ch);g.textAlign='center';g.textBaseline='middle';
    g.fillStyle='#1c5395';g.font='bold 77px sans-serif';g.fillText('М',52,67);
    g.fillStyle='#293842';ctx.tex.fitText(g,s.name,301,45,394,49,'sans-serif',700);
    ctx.tex.fitText(g,s.ref?'Выход '+s.ref:'Подземный переход',301,94,372,32,'sans-serif',500);
  },{key:'metro-underpass-label-'+s.name+'-'+s.ref});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),ctx.mat.decal('#ffffff',{map:texture}));
  const center=localToWorld(s,x,v-.085);mesh.position.set(center.x,y,center.z);
  mesh.rotation.y=s.axis+Math.PI;mesh.name='metro-underpass-sign-'+s.id;
  ctx.addStatic(mesh);mesh.updateWorldMatrix(true,false);registerLOD(mesh,72);
}

function stairwell(ctx,s) {
  const p=new Parts(), r=s.width/2, end=s.end+s.landing;
  const finish=s.style==='pinkgranite'?'pinkgranite':'granite';
  const hole=s.hole;
  ctx.physics.addHole(hole.x,hole.z,hole.w,hole.d,hole.rotY);
  horizontal(ctx,p,s,-.44,0,0);
  if(['pinkgranite','moscow','sport','arcade'].includes(s.style)) {
    p.box('amber',-r+.09,r-.09,.003,.014,-.4,-.055,'b');
    for(let u=-r+.14;u<r-.12;u+=.11)
      p.box('edge',u-.012,u+.012,.014,.02,-.37,-.089,'b');
  }
  for(let i=0;i<s.flights.length;i++) {
    const f=s.flights[i];
    if(i) horizontal(ctx,p,s,s.flights[i-1].end,f.start,f.top);
    flight(ctx,p,s,f);
  }
  horizontal(ctx,p,s,s.end,end,-s.depth);
  for(const side of [-1,1]) {
    const u=side*(r+.135), railTop=s.canopy ? .59 : .76;
    p.box('wall',u-.135,u+.135,-s.depth-.17,.055,0,end);
    boxCollider(ctx,s,u,end/2,.27,end,-s.depth-.17,.055);
    p.box(finish,u-.17,u+.17,.055,railTop,0,s.opening);
    p.box('edge',u-.21,u+.21,railTop,railTop+.072,-.055,s.opening+.055);
    boxCollider(ctx,s,u,s.opening/2,.38,s.opening,0,railTop+.072);
    for(let v=1;v<s.opening-.5;v+=1.36) {
      const x=side*(r-.004);
      p.box('tile',x-.006,x+.006,.088,railTop-.025,v-.009,v+.009);
    }
  }
  // Granite parapet closes the street end above the tunnel. A person must be able
  // to walk on the overlying pavement, and under the short canopy of ground below.
  p.box(finish,-r-.27,r+.27,.025,.72,s.opening,s.opening+.25);
  p.box('edge',-r-.32,r+.32,.72,.785,s.opening-.035,s.opening+.285);
  boxCollider(ctx,s,0,s.opening+.13,s.width+.54,.26,.02,.785);
  p.box('wall',-r,r,-.16,-.04,s.opening,end);
  boxCollider(ctx,s,0,(s.opening+end)/2,s.width,end-s.opening,-.16,0,true);
  if(!s.shared) {
    lowerDoors(ctx,p,s,s.end+.62,-s.depth);
    p.box('wall',-r-.13,r+.13,-s.depth,.04,end,end+.17);
    p.box('lamp',-.35,.35,-s.depth+2.19,-s.depth+2.26,end-.03,end+.006);
    boxCollider(ctx,s,0,end+.085,s.width+.26,.17,-s.depth,.04);
  }
  streetSign(ctx,p,s);
  emit(ctx,p,s,'metro-underpass-'+s.id);
}

function shelter(ctx,building,s) {
  const p=new Parts(), glass=new Parts(), flat=building.polys[0].o, corners=[];
  const c=Math.cos(s.axis), sn=Math.sin(s.axis);
  for(let i=0;i<flat.length;i+=2) {
    const dx=flat[i]-s.x,dz=flat[i+1]-s.z;corners.push([dx*c-dz*sn,dx*sn+dz*c]);
  }
  const lo=Math.min(...corners.map(q=>q[0])),hi=Math.max(...corners.map(q=>q[0]));
  const a=Math.min(...corners.map(q=>q[1])),b=Math.max(...corners.map(q=>q[1]));
  const green=s.style==='greenhouse', pitched=green||s.style==='moscow';
  const eave=green?2.88:2.62, ridge=eave+(green?.15:pitched?.61:.23),mid=(lo+hi)/2;
  const skin=ctx.mat.toon('#a6ced0',{transparent:true,opacity:.31,depthWrite:false,side:THREE.DoubleSide,name:'public-metro-shelter-glass'});
  const count=Math.max(2,Math.ceil((b-a)/4.0));
  const opposing=areaUnderpasses.find(o=>o.canopy===s.canopy && o.id!==s.id);
  const opposingCenter=opposing ? (opposing.x-s.x)*c-(opposing.z-s.z)*sn : 0;
  for(const side of [lo,hi]) {
    const slope=[[side,eave,a],[side,eave,b],[mid,ridge,b],[mid,ridge,a]];
    if(pitched) p.quad(green?'green':'enamel',...slope,[0,1,0]);
    else glass.quad(skin,...slope,[0,1,0]);
    p.box(green?'green':'steel',side-.095,side+.095,eave-.19,eave+.055,a,b);
    for(let i=0;i<=count;i++) {
      const v=a+(b-a)*i/count;
      p.box(green?'green':'steel',side-.055,side+.055,.03,eave,v-.055,v+.055);
      p.cyl('steel',[side,eave,v],[mid,ridge,v],.046,.046,6);
      boxCollider(ctx,s,side,v,.11,.11,0,eave);
      if(i && (green||s.style==='arcade'||s.style==='sport')) {
        const prev=v-(b-a)/count;
        glass.quad(skin,[side,.56,prev+.055],[side,.56,v-.055],
          [side,eave-.2,v-.055],[side,eave-.2,prev+.055],[side<mid?-1:1,0,0]);
        boxCollider(ctx,s,side,(prev+v)/2,.065,v-prev,.56,eave-.2);
      }
    }
  }
  p.box(green?'green':'steel',mid-.045,mid+.045,ridge-.042,ridge+.043,a,b);
  for(const v of [a,b]) {
    p.box(green?'green':'steel',lo,hi,eave-.17,eave+.04,v-.09,v+.09);
    if(green) {
      const doorCenter=Math.max(lo+1.28,Math.min(hi-1.28,v===a?0:opposingCenter));
      for(const [x0,x1] of [[lo,doorCenter-1.21],[doorCenter+1.21,hi]]) {
        if(x1<=x0)continue;
        glass.quad(skin,[x0,.13,v],[x1,.13,v],[x1,eave-.2,v],[x0,eave-.2,v],[0,0,v===a?-1:1]);
        p.box('green',x0,x1,.83,.9,v-.04,v+.04);
        boxCollider(ctx,s,(x0+x1)/2,v,x1-x0,.10,.03,eave-.17);
      }
      // Narrow stainless and glazed leaves, yellow warning bands, square white
      // metro emblems and a wide green fascia are visible in the street photograph.
      const doorTop=2.27, leaf=.95, dir=v===a?1:-1;
      for(const sign of [-1,1]) {
        const u=doorCenter+1.21*sign;
        p.box('aluminium',u-.047,u+.047,.04,doorTop,v-.07,v+.07);
        const tip=v+dir*leaf;
        p.box('glass',u-.018,u+.018,.13,doorTop-.075,Math.min(v,tip),Math.max(v,tip));
        p.box('amber',u-.03,u+.03,1.16,1.23,Math.min(v,tip),Math.max(v,tip));
        boxCollider(ctx,s,u,(v+tip)/2,.078,leaf,.04,doorTop);
      }
      p.box('aluminium',doorCenter-1.26,doorCenter+1.26,doorTop,doorTop+.09,v-.068,v+.068);
      p.box('green',lo-.32,hi+.32,eave-.15,eave+.12,v-.40,v+.40);
      p.box('edge',doorCenter-.37,doorCenter+.37,eave+.12,eave+.82,v-.086,v+.086);
      for(const side of [-1,1]) {
        const front=v-dir*.095;
        p.cyl('frame',[doorCenter+side*.27,eave+.23,front],[doorCenter+side*.15,eave+.69,front],.039,.039,6);
        p.cyl('frame',[doorCenter+side*.15,eave+.69,front],[doorCenter,eave+.32,front],.039,.039,6);
      }
    }
  }
  emit(ctx,p,s,'metro-underpass-shelter-'+building.id);
  if(glass.b.size) {
    const group=new THREE.Group();group.position.set(s.x,0,s.z);group.rotation.y=s.axis;
    group.name='metro-underpass-glazing-'+building.id;
    const panes=glass.build(group,{cast:false});
    ctx.addStatic(group);group.updateWorldMatrix(true,true);
    for(const m of panes){m.name=group.name;registerLOD(m,145);}
  }
}

function liftKiosk(ctx,s) {
  const p=new Parts(),rw=s.roofWidth/2,rd=s.roofDepth/2;
  const half=1.89, back=1.80, front=-1.80, height=3.08;
  // On this pair the thin cantilever is wider than the lift enclosure on all four
  // sides. Four folded soffit panels meet over the glazed and stainless-steel core.
  const outline=[[-rw,-rd],[rw,-rd],[rw,rd],[-rw,rd]];
  for(let i=0;i<4;i++) {
    const [u,v]=outline[i],[uu,vv]=outline[(i+1)%4];
    p.fan('anthracite',[[u,3.44,v],[uu,3.44,vv],[0,height,0]],[0,-1,0]);
    p.quad('aluminium',[u,3.44,v],[uu,3.44,vv],[uu,3.53,vv],[u,3.53,v],null);
  }
  p.cap('stainless',outline,3.53);
  p.box('stone',-half-.22,half+.22,-.05,.035,front-.39,back+.12);
  boxCollider(ctx,s,0,(front+back-.27)/2,2*half+.44,back-front+.51,-.12,.035,true);
  p.box('stainless',-half,half,.035,height,back-.07,back);
  boxCollider(ctx,s,0,back-.04,half*2,.08,.03,height);
  for(const side of [-1,1]) {
    const x=side*half;
    p.box('stainless',x-.055,x+.055,.035,height,.13,back);
    p.box('stone',x-.055,x+.055,.035,.79,front,.15);
    p.box('aqua',x-.04,x+.04,.79,height,front,.15);
    p.box('aluminium',x-.067,x+.067,.035,height,front-.035,front+.035);
    p.box('aluminium',x-.067,x+.067,.74,.80,front,.15);
    boxCollider(ctx,s,x,0,.12,back-front,.035,height);
    p.box('stone',Math.min(side*1.02,x),Math.max(side*1.02,x),.035,.75,front-.035,front+.045);
    p.box('aqua',Math.min(side*1.02,x),Math.max(side*1.02,x),.75,height,front-.025,front+.035);
    boxCollider(ctx,s,side*(half+1.02)/2,front,half-1.02,.085,.035,height);
    p.box('aluminium',side*1.00-.045,side*1.00+.045,.035,2.33,front-.075,front+.075);
    p.box('aqua',Math.min(side*1.00,side*1.74),Math.max(side*1.00,side*1.74),.095,2.20,front+.06,front+.12);
  }
  p.box('aqua',-1.02,1.02,2.32,height,front-.03,front+.025);
  p.box('aluminium',-1.04,1.04,2.24,2.33,front-.06,front+.07);
  // Surface-only public landing. The car doors are visible at its rear.
  const v=.89;
  p.box('wall',-half,half,.035,height,v,v+.13);
  boxCollider(ctx,s,0,v+.06,half*2,.12,.035,height);
  for(const side of [-1,1]) {
    p.box('stainless',Math.min(side*.018,side*.80),Math.max(side*.018,side*.80),.055,2.17,v-.04,v);
    p.box('aluminium',side*.82-.035,side*.82+.035,.04,2.22,v-.055,v);
  }
  p.box('aluminium',-.85,.85,2.16,2.23,v-.055,v+.01);
  p.box('frame',1.012,1.17,1.01,1.25,v-.05,v);
  p.box('lamp',1.052,1.13,1.10,1.16,v-.065,v-.05);
  p.box('frame',-.90,.90,2.35,2.58,front-.095,front+.04);
  const label=ctx.tex.draw(384,80,(g,w,h)=>{
    g.fillStyle='#e5e6dc';g.fillRect(0,0,w,h);g.textAlign='center';g.textBaseline='middle';
    g.fillStyle='#253a50';ctx.tex.fitText(g,'Лифт · Зенит',w/2,h/2,w-16,51,'sans-serif',700);
  },{key:'metro-zenit-lift-public-plate'});
  const plate=new THREE.Mesh(new THREE.PlaneGeometry(1.73,.20),ctx.mat.decal('#fff',{map:label}));
  const pt=localToWorld(s,0,front-.098);plate.position.set(pt.x,2.465,pt.z);
  plate.rotation.y=s.axis+Math.PI;plate.name='metro-lift-plate-'+s.id;
  ctx.addStatic(plate);plate.updateWorldMatrix(true,false);registerLOD(plate,60);
  emit(ctx,p,s,'metro-lift-'+s.id);
}

export function buildRegionalUnderpasses(ctx) {
  if(!areaUnderpasses.length && !areaUnderpassLifts.length)return;
  for(const s of areaUnderpassLifts)liftKiosk(ctx,s);
  ctx.services.regionalMetroLifts=areaUnderpassLifts;
  const shelters=new Map();
  for(const s of areaUnderpasses) {
    stairwell(ctx,s);
    if(s.canopy&&!shelters.has(s.canopy))shelters.set(s.canopy,s);
  }
  for(const b of BUILDINGS)if(shelters.has(b.id))shelter(ctx,b,shelters.get(b.id));
  ctx.services.regionalUnderpasses=areaUnderpasses;
}
