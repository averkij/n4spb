// Fit a complex pontoon to its polygon, retaining the open slips between its
// fingers. Each rectangle is used by both the drawing and hull collision.
export function pierParts(o,r,step=1){
 const inside=(x,z)=>{let yes=false;for(let i=0,j=o.length-2;i<o.length;j=i,i+=2)if((o[i+1]>z)!==(o[j+1]>z)&&x<(o[j]-o[i])*(z-o[i+1])/(o[j+1]-o[i+1])+o[i])yes=!yes;return yes;};
 const world=(u,v)=>[r.cx+r.ax*u-r.az*v,r.cz+r.az*u+r.ax*v];
 const rows=[],nu=Math.ceil(r.len/step),nv=Math.ceil(r.wid/step);
 for(let j=0;j<nv;j++){
  const runs=[];let start=null;
  for(let i=0;i<=nu;i++){
   const u=-r.len/2+(i+.5)*step,v=-r.wid/2+(j+.5)*step;
   const ok=i<nu&&inside(...world(u,v));
   if(ok&&start==null)start=i;
   if(!ok&&start!=null){runs.push([start,i]);start=null;}
  }rows.push(runs);
 }
 let open=new Map(),out=[];
 for(let j=0;j<=nv;j++){
  const next=new Map();for(const [a,b] of rows[j]||[]){const k=a+','+b,q=open.get(k)||{a,b,j0:j};q.j1=j+1;next.set(k,q);open.delete(k);}out.push(...open.values());open=next;
 }
 return out.map(q=>{const [cx,cz]=world(-r.len/2+(q.a+q.b)*step/2,-r.wid/2+(q.j0+q.j1)*step/2);return {...r,cx,cz,len:(q.b-q.a)*step,wid:(q.j1-q.j0)*step,exact:true};});
}
