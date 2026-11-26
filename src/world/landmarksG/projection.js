// A winter projection on Bryullov's square-facing centre bay. The city's
// 2025/26 programme describes winter scenes on this particular facade:
// https://www.gov.spb.ru/press/governor/310107/
// Original artwork: a conifer wood, a crescent and six-armed ice crystals.
import * as THREE from 'three';
import { registerLOD } from '../../core/spatial.js';
import { frameOf } from './kit.js';

function winterLandscape(g, w, h) {
  const nightSky = g.createLinearGradient(0, 0, 0, h);
  nightSky.addColorStop(0, '#5365a9');
  nightSky.addColorStop(.48, '#46639e');
  nightSky.addColorStop(.82, '#69b6c4');
  nightSky.addColorStop(1, '#324f86');
  g.fillStyle = nightSky;
  g.fillRect(0, 0, w, h);

  // Layer two ridgelines with actual pointed silhouettes. Heights are in
  // texture pixels; a foreground tree reaches about five metres on the wall.
  const fir = (x, y, height, width) => {
    g.beginPath();
    g.moveTo(x, y-height);
    for (const side of [1, -1]) {
      const flank = [[.29,.38],[.13,.34],[.40,.64],[.23,.59],[.50,1]];
      const points = side === 1 ? flank : [...flank].reverse();
      for (const [a,b] of points) g.lineTo(x+side*a*width, y-height+b*height);
    }
    g.closePath();
    g.fill();
  };
  for (let layer=0; layer<2; layer++) {
    const ground = x => h*(.80+layer*.12+.05*Math.sin(x*.009+layer*2));
    g.fillStyle = layer ? '#27436e' : '#739abf';
    g.beginPath();
    g.moveTo(0, h);
    for (let x=0; x<=w; x+=4) g.lineTo(x,ground(x));
    g.lineTo(w,h);
    g.fill();
    for (let i=0; i<34-layer*9; i++) {
      const x=(i+.15+Math.sin(i*17)*.18)*w/(34-layer*9);
      const height=(29+layer*27)*(1+.36*Math.cos(i*3.7+layer));
      fir(x,ground(x)+6,height,height*.67);
    }
  }
  // Warm crescent against the cool architecture.
  g.fillStyle='#ffdfa0';
  g.beginPath();
  g.moveTo(545,17);
  g.bezierCurveTo(513,18,516,63,550,62);
  g.bezierCurveTo(526,53,524,30,545,17);
  g.fill();

  for (const [x,y,r] of [[86,59,21],[280,65,29],[438,42,19],[628,78,28],[813,46,23],[955,73,29]]) {
    g.save();
    g.translate(x,y);
    g.strokeStyle='#cdebf0';
    g.lineWidth=2.8;
    g.lineCap='round';
    g.beginPath();
    for (let j=0;j<6;j++) {
      g.rotate(Math.PI/3);
      g.moveTo(0,0); g.lineTo(0,-r);
      for (const q of [.45,.72]) {
        g.moveTo(-r*.18,-r*(q+.14)); g.lineTo(0,-r*q); g.lineTo(r*.18,-r*(q+.14));
      }
    }
    g.stroke();
    g.restore();
  }
  for (let i=0;i<47;i++) {
    const x=(i*199+47)%w, y=9+(i*83+19)%136, r=3+2.5*(i%4===0);
    g.fillStyle = i%3 ? '#b4d9e6' : '#ffdb94';
    g.beginPath();
    for(let j=0;j<8;j++) {
      const a=j*Math.PI/4, size=j%2?r*.24:r;
      const px=x+size*Math.cos(a),py=y+size*Math.sin(a);
      if(j===0)g.moveTo(px,py);else g.lineTo(px,py);
    }
    g.closePath();g.fill();
  }
}

export function guardsProjection(ctx, edge) {
  if (ctx.season !== 'winter') return;
  const frame = frameOf(edge), low = 1, high = 15.55;
  const geometry = new THREE.PlaneGeometry(frame.len-.4,high-low);
  const material = new THREE.ShaderMaterial({
    name:'guards-winter-mapping', transparent:true, depthWrite:false,
    blending:THREE.AdditiveBlending,
    uniforms:{
      picture:{value:ctx.tex.draw(1024,256,winterLandscape,{key:'guards-winter-projection'})},
      night:ctx.shared.uNight, clock:ctx.shared.uTime,
    },
    vertexShader:`uniform float night; varying vec2 panelUV;
      void main() {
        panelUV = uv;
        gl_Position = night <= 0.35 ? vec4(2.0,2.0,2.0,1.0) :
          projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader:`uniform sampler2D picture; uniform float night, clock; varying vec2 panelUV;
      void main() {
        vec3 light = texture2D(picture, panelUV).rgb;
        vec2 grid = panelUV*vec2(26.0,6.0) + vec2(clock*.035,clock*.20);
        vec2 cell = floor(grid);
        float phase = fract(sin(dot(cell,vec2(12.9898,78.233)))*43758.5453);
        vec2 flake = fract(grid)-vec2(.22+.54*phase,.5);
        float point = 1.0-smoothstep(.012,.053,length(flake));
        light += vec3(.34,.49,.54)*point;
        float edge = smoothstep(0.0,.018,min(panelUV.x,1.0-panelUV.x));
        gl_FragColor = vec4(light*1.25, edge*smoothstep(.35,.82,night));
        #include <colorspace_fragment>
      }`,
  });
  const mural = new THREE.Mesh(geometry,material);
  mural.name='guards-winter-projection';
  // 1.8 cm over the flat plaster, behind the panes at 5 cm and the lace
  // relief at 6 cm. The free Ionic columns occlude it in the depth buffer.
  mural.position.set(frame.x + frame.xa[0]*frame.len/2 + edge.n[0]*.018, (low+high)/2,
                     frame.z + frame.xa[1]*frame.len/2 + edge.n[1]*.018);
  mural.rotation.y = frame.rot;
  ctx.noOutline(mural);
  ctx.add(mural);
  mural.updateMatrixWorld();
  registerLOD(mural,320);
}
