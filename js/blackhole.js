// ============================================================
//  BLACK HOLE — live WebGL shader for the preloader.
//  The accretion disk material actually flows (differential
//  rotation + turbulence + Doppler beaming). Not a rotating image.
// ============================================================
(function () {
  const canvas = document.getElementById("bhCanvas");
  if (!canvas) return;
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: true });
  if (!gl) return; // graceful: % counter still shows

  const vert = `
    attribute vec2 p;
    void main(){ gl_Position = vec4(p, 0.0, 1.0); }
  `;

  const frag = `
    precision highp float;
    uniform vec2 uRes;
    uniform float uTime;

    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      float a = hash(i), b = hash(i + vec2(1.0,0.0)), c = hash(i + vec2(0.0,1.0)), d = hash(i + vec2(1.0,1.0));
      vec2 u = f*f*(3.0 - 2.0*f);
      return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      for(int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; }
      return v;
    }

    const float PI = 3.14159265;

    void main(){
      vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
      float r = length(uv);
      float ang = atan(uv.y, uv.x);

      float hole  = 0.155;   // event horizon
      float inner = 0.185;   // disk inner edge
      float outer = 0.480;   // disk outer edge

      vec3 col = vec3(0.0);

      // ---- accretion disk -------------------------------------
      if (r > inner && r < outer) {
        // differential (Keplerian-ish) rotation: inner spins faster
        float speed = uTime * (0.5 + 0.9 / (r + 0.12));
        float swirl = ang * 2.0 - speed;
        float bands = fbm(vec2(swirl * 1.1, r * 9.0 - uTime * 0.5));
        float fil   = fbm(vec2(swirl * 3.0 + 10.0, r * 18.0));
        float n = mix(bands, fil, 0.4);

        float radial = smoothstep(inner, inner + 0.05, r) * smoothstep(outer, outer - 0.20, r);
        float bright = radial * (0.30 + 1.05 * n);

        // Doppler beaming: gas approaching (one side) appears brighter
        bright *= 0.45 + 0.85 * (0.5 + 0.5 * cos(ang + 0.5));

        vec3 hot = mix(vec3(0.18, 0.45, 1.0), vec3(0.85, 0.95, 1.0), n * n);
        col += hot * bright * 1.7;
      }

      // ---- photon ring hugging the shadow ---------------------
      float ringR = hole + 0.018;
      float ring = smoothstep(0.020, 0.0, abs(r - ringR));
      col += vec3(0.75, 0.88, 1.0) * ring * 1.6;

      // carve out the event horizon
      col *= smoothstep(hole, hole + 0.010, r);

      // faint outer halo
      col += vec3(0.12, 0.26, 0.6) * exp(-3.5 * r) * 0.30;

      // transparency from luminance so there is no visible box
      float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
      gl_FragColor = vec4(col, a);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error("BH shader:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, vert);
  const fs = compile(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const uRes = gl.getUniformLocation(prog, "uRes");
  const uTime = gl.getUniformLocation(prog, "uTime");

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  const preloader = document.getElementById("preloader");
  const start = performance.now();
  let raf;
  function render(now) {
    // stop once the preloader has faded out — frees the GPU
    if (preloader && preloader.classList.contains("done")) {
      cancelAnimationFrame(raf);
      return;
    }
    resize();
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(render);
  }
  raf = requestAnimationFrame(render);
})();
