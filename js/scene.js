// ============================================================
//  NEURAL COSMOS — Three.js particle core + bloom
// ============================================================
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const canvas = document.querySelector("#webgl");
const sizes = { w: window.innerWidth, h: window.innerHeight };

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05070d, 0.055);

const camera = new THREE.PerspectiveCamera(55, sizes.w / sizes.h, 0.1, 100);
camera.position.set(0, 0, 9);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(sizes.w, sizes.h);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ---------------------------------------------------------
//  COLOR PALETTE (driven by scroll section)
// ---------------------------------------------------------
const palette = {
  cyan: new THREE.Color(0x4da6ff),
  coral: new THREE.Color(0xff6b4a),
  violet: new THREE.Color(0x8b6bff),
  teal: new THREE.Color(0x2fe0c0),
};
const target = { colorA: palette.cyan.clone(), colorB: palette.coral.clone() };

// ---------------------------------------------------------
//  NEURAL CORE — points on a fibonacci sphere, displaced
// ---------------------------------------------------------
const COUNT = 9000;
const radius = 3.2;
const positions = new Float32Array(COUNT * 3);
const base = new Float32Array(COUNT * 3);
const randoms = new Float32Array(COUNT);
const colorMix = new Float32Array(COUNT);

const golden = Math.PI * (3 - Math.sqrt(5));
for (let i = 0; i < COUNT; i++) {
  const y = 1 - (i / (COUNT - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const theta = golden * i;
  const x = Math.cos(theta) * r;
  const z = Math.sin(theta) * r;
  base[i * 3] = x * radius;
  base[i * 3 + 1] = y * radius;
  base[i * 3 + 2] = z * radius;
  positions[i * 3] = base[i * 3];
  positions[i * 3 + 1] = base[i * 3 + 1];
  positions[i * 3 + 2] = base[i * 3 + 2];
  randoms[i] = Math.random();
  colorMix[i] = Math.random();
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
geometry.setAttribute("aMix", new THREE.BufferAttribute(colorMix, 1));

const material = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: { value: 0 },
    uSize: { value: 22 * Math.min(window.devicePixelRatio, 2) },
    uColorA: { value: target.colorA },
    uColorB: { value: target.colorB },
    uAmp: { value: 0.45 },
  },
  vertexShader: /* glsl */ `
    uniform float uTime;
    uniform float uSize;
    uniform float uAmp;
    attribute float aRandom;
    attribute float aMix;
    varying float vMix;
    varying float vAlpha;

    // simplex-ish noise (cheap)
    vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    float snoise(vec3 v){
      const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
      vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
      vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
      vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
      i=mod289(i);
      vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
      float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
      vec4 j=p-49.0*floor(p*ns.z*ns.z);
      vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
      vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
      vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
      vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
      vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
      vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
      vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
      p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
      vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
      return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }

    void main(){
      vMix = aMix;
      vec3 pos = position;
      vec3 dir = normalize(pos);
      float n = snoise(pos * 0.55 + uTime * 0.18);
      float n2 = snoise(pos * 1.4 - uTime * 0.1);
      float displace = (n * 0.7 + n2 * 0.3) * uAmp;
      pos += dir * displace;

      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uSize * (0.4 + aRandom * 0.9) * (1.0 / -mv.z);
      vAlpha = 0.35 + smoothstep(-1.0, 1.0, n) * 0.65;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    varying float vMix;
    varying float vAlpha;
    void main(){
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      float glow = smoothstep(0.5, 0.0, d);
      vec3 col = mix(uColorA, uColorB, vMix);
      gl_FragColor = vec4(col, glow * vAlpha);
    }
  `,
});

const core = new THREE.Points(geometry, material);
scene.add(core);

// ---------------------------------------------------------
//  STARFIELD
// ---------------------------------------------------------
const starCount = 1400;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPos[i * 3] = (Math.random() - 0.5) * 60;
  starPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
  starPos[i * 3 + 2] = (Math.random() - 0.5) * 60 - 10;
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({
  size: 0.04, color: 0x9bb4e0, transparent: true, opacity: 0.6,
  blending: THREE.AdditiveBlending, depthWrite: false,
});
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

// ---------------------------------------------------------
//  POST-PROCESSING — BLOOM
// ---------------------------------------------------------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(sizes.w, sizes.h),
  0.85, // strength
  0.6,  // radius
  0.15  // threshold
);
composer.addPass(bloom);

// ---------------------------------------------------------
//  INTERACTION
// ---------------------------------------------------------
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener("pointermove", (e) => {
  mouse.tx = (e.clientX / sizes.w - 0.5);
  mouse.ty = (e.clientY / sizes.h - 0.5);
});

let scrollFactor = 0; // 0..1 of page
window.addEventListener("scroll", () => {
  const max = document.body.scrollHeight - window.innerHeight;
  scrollFactor = max > 0 ? window.scrollY / max : 0;
});

// section -> color theme (called from main.js)
const themes = {
  hero:    [palette.cyan, palette.coral],
  about:    [palette.cyan, palette.teal],
  work:     [palette.violet, palette.coral],
  projects: [palette.teal, palette.violet],
  skills:   [palette.teal, palette.cyan],
  contact: [palette.coral, palette.violet],
};
window.__setCosmosTheme = (name) => {
  const t = themes[name];
  if (t) { target.colorA.copy(t[0]); target.colorB.copy(t[1]); }
};
window.__setCosmosAmp = (v) => { material.uniforms.uAmp.value = v; };

// ---------------------------------------------------------
//  RESIZE
// ---------------------------------------------------------
window.addEventListener("resize", () => {
  sizes.w = window.innerWidth;
  sizes.h = window.innerHeight;
  camera.aspect = sizes.w / sizes.h;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.w, sizes.h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(sizes.w, sizes.h);
});

// ---------------------------------------------------------
//  LOOP
// ---------------------------------------------------------
const clock = new THREE.Clock();
function tick() {
  const t = clock.getElapsedTime();
  material.uniforms.uTime.value = t;

  // smooth color lerp
  material.uniforms.uColorA.value.lerp(target.colorA, 0.04);
  material.uniforms.uColorB.value.lerp(target.colorB, 0.04);

  // mouse parallax
  mouse.x += (mouse.tx - mouse.x) * 0.05;
  mouse.y += (mouse.ty - mouse.y) * 0.05;

  core.rotation.y = t * 0.05 + mouse.x * 0.6;
  core.rotation.x = mouse.y * 0.4;
  stars.rotation.y = t * 0.01;

  // scroll pushes the core back & up slightly
  core.position.z = -scrollFactor * 4;
  core.position.y = scrollFactor * 1.2;
  camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.05;
  camera.position.y += (-mouse.y * 1.0 - camera.position.y) * 0.05;
  camera.lookAt(core.position);

  composer.render();
  requestAnimationFrame(tick);
}
tick();

// let the preloader know WebGL is ready
window.dispatchEvent(new Event("cosmos-ready"));
