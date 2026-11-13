// Evseev's 1926 orator: a dedicated bronze sculpture, not a clothed pedestrian.
// Photographic proportions/pose: Mark Harrison front/three-quarter views and
// Nikoniko962's 2019/2023 photographs; dimensions remain modelling estimates.
import * as THREE from 'three';

const sphere=new THREE.SphereGeometry(1,18,12);
function ellipsoid(P,M,x,y,z,rx,ry,rz,rot=0){P.geo(M,sphere,x,y,z,0,0,rot,rx,ry,rz);}
function limb(P,M,points,radii,segments=14){for(let i=0;i+1<points.length;i++)P.cyl(M,points[i],points[i+1],radii[i],radii[i+1],segments);}
function fold(P,M,points,r=.018){for(let i=0;i+1<points.length;i++)P.cyl(M,points[i],points[i+1],r,r*.83,7);}
function panel(P,M,points,depth=.045){
  P.fan(M,points,[0,0,1]);
  for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];P.quad(M,a,b,[b[0],b[1],b[2]-depth],[a[0],a[1],a[2]-depth],null);}
}
// Hand frame: +Y points toward the fingers, +Z toward the thumb. Individual
// fingers bend over the open palm instead of forming an undifferentiated ball.
function hand(P,M,F,x,y,z,rot=0,grip=false){
  for(const q of[P,F])q.push(x,y,z,rot);
  ellipsoid(P,M,0,.08,0,.125,.19,.075);
  for(let i=0;i<4;i++){
    const xx=-.09+i*.058,len=(grip?.25:.16)-Math.abs(1.45-i)*.024;
    const bend=grip?.15:.11,yy=grip?.20:.15;
    limb(F,M,[[xx,yy,.012],[xx,yy+len*.6,bend*.32],[xx+.008,yy+len,bend]], [.035,.032,.027],8);
    if(grip)limb(F,M,[[xx+.008,yy+len,bend],[xx+.01,yy+len-.09,bend+.04]],[.027,.023],8);
    else {limb(F,M,[[xx+.008,yy+len,bend],[xx+.01,yy+len-.07,bend+.035]],[.027,.023],8);fold(F,M,[[xx-.012,yy+len*.52,bend*.28],[xx+.018,yy+len*.55,bend*.28]],.009);}
  }
  // The extended right thumb is the characteristic gesture in both close-ups.
  limb(F,M,[[-.10,.08,.015],[-.19,.19,.035],[-.19,grip?.39:.46,.06]], [.052,.043,.031],10);
  for(const q of[P,F])q.pop();
}

export function sculptLenin(P,F,M){
  const bronze=M.bronze,dark=M.bronzeDark,lit=M.bronzeLight||bronze;
  // Separated planted boots, forward right foot, broad long trouser cuffs.
  for(const [x,z,lean]of[[-.37,.14,-.06],[.37,-.03,.06]]){
    ellipsoid(P,dark,x,.105,z+.15,.235,.12,.43);
    ellipsoid(P,bronze,x,.19,z+.055,.215,.16,.33);
    limb(P,bronze,[[x,.24,z],[x+lean,.67,z-.01],[x+lean,1.42,z-.06]], [.19,.225,.27],16);
    fold(F,lit,[[x-.15,.32,z+.18],[x-.12,.62,z+.205],[x-.16,1.11,z+.21]],.019);
    fold(F,dark,[[x+.07,.33,z+.20],[x+.025,.72,z+.23],[x+.08,1.20,z+.25]],.018);
    P.col(bronze,x,z,.31,.37,.225,.225,16);
  }
  // Continuous, subtly twisted overcoat shell. The front opening is a real
  // slit between two tails. Front angle zero points along +Z toward the Neva.
  const rings=[
    {y:.93,w:.82,d:.37,c:.02},{y:1.30,w:.78,d:.38,c:.01},
    {y:1.9,w:.69,d:.38,c:-.035},{y:2.50,w:.64,d:.40,c:-.055},
    {y:2.97,w:.76,d:.35,c:-.07},{y:3.14,w:.72,d:.30,c:-.08},
  ],n=32,start=.105,end=Math.PI*2-.105;
  const ring=r=>Array.from({length:n+1},(_,j)=>{const a=start+(end-start)*j/n,fl=.020*Math.sin(a*7+r.y*1.8)+.010*Math.sin(a*13);return[r.c+Math.sin(a)*(r.w+fl),r.y,.01+Math.cos(a)*(r.d+fl)];});
  const rs=rings.map(ring);
  for(let i=0;i+1<rs.length;i++)for(let j=0;j<n;j++)P.quad(bronze,rs[i][j],rs[i][j+1],rs[i+1][j+1],rs[i+1][j],null);
  for(let j=0;j<n;j++)P.quad(dark,rs[0][j],rs[0][j+1],[rs[0][j+1][0],rs[0][j+1][1]+.055,rs[0][j+1][2]-.025],[rs[0][j][0],rs[0][j][1]+.055,rs[0][j][2]-.025],null);
  // Waistcoat and jacket inside the opening, with shirt, tie and buttons.
  panel(P,dark,[[-.38,1.25,.30],[.31,1.25,.31],[.39,2.77,.41],[-.40,2.78,.43]]);
  panel(P,bronze,[[-.39,1.7,.35],[.31,1.7,.35],[.35,2.97,.42],[-.34,2.98,.44]]);
  panel(F,lit,[[-.21,3.11,.39],[.19,3.10,.39],[.11,2.77,.48],[-.05,2.77,.48]]);
  panel(F,dark,[[-.03,2.95,.495],[.065,2.95,.495],[.12,2.60,.48],[.015,2.52,.48],[-.07,2.63,.48]]);
  for(const yy of[1.92,2.18,2.43,2.70])ellipsoid(F,dark,.02,yy,.43,.035,.035,.018);
  // Turned coat collars and broad angular lapels have actual relief/depth.
  panel(P,lit,[[-.36,3.24,.26],[-.71,3.03,.32],[-.31,2.50,.48],[-.09,2.86,.50],[-.22,2.98,.46]]);
  panel(P,bronze,[[.26,3.22,.24],[.64,3.02,.30],[.40,2.63,.46],[.12,2.83,.49],[.21,2.99,.43]]);
  fold(F,dark,[[-.70,3.02,.33],[-.31,2.50,.49],[-.09,2.86,.51]],.017);
  fold(F,lit,[[.64,3.02,.32],[.40,2.63,.48],[.12,2.83,.51]],.020);
  // Wind-pulled tails, seams, heavy cloth folds and right pocket with cap.
  for(const [x,z,ys]of[[-.58,.33,2.72],[-.40,.37,2.24],[.48,.34,2.52],[.64,.25,2.80]])fold(F,lit,[[x,1.02,z],[x*.90,1.50,z+.045],[x*.80,2.0,z+.04],[x*.74,ys,z]],.023);
  fold(F,dark,[[-.02,1.08,-.365],[-.04,1.9,-.38],[-.07,2.65,-.39]],.020);
  panel(F,dark,[[-.78,1.94,.20],[-.48,2.00,.36],[-.48,2.09,.36],[-.76,2.04,.20]]);
  ellipsoid(P,bronze,-.65,2.095,.27,.22,.10,.19,-.32);
  ellipsoid(F,lit,-.70,2.16,.25,.20,.045,.16,-.32);
  // Extended anatomical right arm (viewer's left), with bent elbow and cuff.
  limb(P,bronze,[[-.69,2.98,.00],[-1.02,3.14,.20],[-1.31,3.38,.60],[-1.35,3.74,.92]], [.32,.30,.24,.18],18);
  fold(F,dark,[[-.89,2.94,.25],[-1.10,3.13,.47],[-1.29,3.49,.80]],.025);
  fold(F,lit,[[-1.06,3.29,.07],[-1.37,3.47,.44],[-1.44,3.66,.81]],.022);
  P.cyl(dark,[-1.34,3.66,.85],[-1.35,3.76,.94],.202,.197,18);
  hand(P,bronze,F,-1.35,3.78,.94,-.10);
  // Left hand gathers the coat lapel. The elbow projects away from the body.
  limb(P,bronze,[[.66,3.01,-.035],[1.03,2.75,.11],[.94,2.55,.39],[.49,2.81,.56]], [.31,.30,.245,.16],18);
  P.cyl(dark,[.60,2.73,.535],[.47,2.81,.57],.19,.18,16);
  hand(P,bronze,F,.36,2.78,.56,-.47,true);
  fold(F,lit,[[.85,2.89,.34],[1.08,2.71,.32],[1.00,2.55,.47]],.022);
  // Neck and head are sculptural planes with a rounded bald cranium, projecting
  // brow, cheekbones, nose, moustache and pointed goatee. No painted face decal.
  P.col(bronze,-.07,.015,3.05,3.48,.19,.17,16);
  for(const q of[P,F])q.push(-.09,3.63,.06,-.09);
  ellipsoid(P,bronze,0,.13,-.015,.285,.355,.275);
  ellipsoid(P,bronze,0,-.095,.075,.245,.245,.235);
  for(const sign of[-1,1]){
    ellipsoid(P,bronze,sign*.273,.00,.00,.060,.105,.063);
    ellipsoid(F,dark,sign*.284,.01,.026,.026,.064,.026);
    ellipsoid(F,lit,sign*.135,-.045,.244,.13,.095,.052,sign*.25);
    ellipsoid(F,dark,sign*.113,.069,.247,.105,.043,.028,sign*-.12);
    ellipsoid(F,lit,sign*.115,.124,.244,.12,.034,.044,sign*-.18);
    ellipsoid(F,bronze,sign*.11,.068,.269,.078,.017,.025);
  }
  // Angular bridge and heavy tip of the nose, mouth beneath the moustache.
  panel(F,lit,[[-.044,.12,.260],[.038,.12,.260],[.060,-.075,.337],[-.056,-.075,.337]],.09);
  ellipsoid(F,bronze,0,-.071,.324,.076,.059,.067);
  for(const sign of[-1,1])ellipsoid(F,dark,sign*.078,-.147,.264,.10,.040,.052,sign*.20);
  fold(F,dark,[[-.12,-.192,.253],[0,-.204,.278],[.12,-.192,.253]],.015);
  panel(F,bronze,[[-.14,-.225,.225],[.14,-.225,.225],[.09,-.33,.24],[0,-.37,.25],[-.10,-.31,.24]],.045);
  for(const x of[-.065,-.025,.025,.065])fold(F,lit,[[x,-.245,.267],[x*.75,-.315,.269],[x*.3,-.352,.26]],.009);
  for(const q of[P,F])q.pop();
}
