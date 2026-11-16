/* Método R'Same · el anillo de acuarela del logo, vivo.
   WebGL sin librerías: pigmento que fluye despacio alrededor del retrato de Jau.
   Se para fuera de pantalla, con la pestaña oculta, con «Pausar» y con movimiento reducido.
   Sin WebGL se ve una imagen fija (assets/img/aura.webp). */
(() => {
  'use strict';
  const caja = document.getElementById('aura');
  if (!caja) return;
  const lienzo = caja.querySelector('.aura-lienzo');
  const boton = document.querySelector('.aura-pausa');
  const doc = document.documentElement;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');

  const VS = `attribute vec2 a; varying vec2 v; void main(){ v = a; gl_Position = vec4(a, 0.0, 1.0); }`;
  const FS = `
precision highp float;
varying vec2 v;
uniform float t;      // segundos
uniform float b;      // entrada 0..1
uniform float ri;     // radio del retrato (en unidades -1..1)
float h21(vec2 p){ p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a * vn(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 3.1; a *= 0.5; } return s; }
vec3 pal(float x){
  // el círculo del logo, en el sentido de las agujas del reloj desde arriba
  vec3 c0 = vec3(0.97, 0.60, 0.32); vec3 c1 = vec3(0.98, 0.83, 0.33); vec3 c2 = vec3(0.56, 0.82, 0.40);
  vec3 c3 = vec3(0.32, 0.79, 0.82); vec3 c4 = vec3(0.40, 0.58, 0.95); vec3 c5 = vec3(0.63, 0.46, 0.92);
  vec3 c6 = vec3(0.92, 0.46, 0.79); vec3 c7 = vec3(0.95, 0.43, 0.45);
  float s = fract(x) * 8.0; float f = fract(s); f = f * f * (3.0 - 2.0 * f);
  vec3 a = c7; vec3 c = c0;
  if (s < 1.0) { a = c0; c = c1; } else if (s < 2.0) { a = c1; c = c2; } else if (s < 3.0) { a = c2; c = c3; }
  else if (s < 4.0) { a = c3; c = c4; } else if (s < 5.0) { a = c4; c = c5; } else if (s < 6.0) { a = c5; c = c6; }
  else if (s < 7.0) { a = c6; c = c7; }
  return mix(a, c, f);
}
void main(){
  vec2 p = v;
  float r0 = length(p);
  if (r0 < ri - 0.16 || r0 > 1.02) { gl_FragColor = vec4(0.0); return; }
  float tt = t * 0.05;
  vec2 w = vec2(fbm(p * 1.7 + vec2(tt, -tt * 0.7)), fbm(p * 1.7 + vec2(4.2 - tt * 0.8, 1.3 + tt)));
  vec2 q = p + (w - 0.5) * 0.24;
  float r = length(q);
  float hue = fract(atan(q.x, q.y) / 6.28318);
  float eb = 1.0 - pow(1.0 - b, 3.0);
  float borde = fbm(vec2(hue * 7.0, tt * 1.5) + q * 2.0);
  float ro = mix(ri + 0.02, 0.86 + (borde - 0.5) * 0.18, eb);
  float rin = ri - 0.07 + (fbm(q * 3.5 + 9.0) - 0.5) * 0.07;
  float cuerpo = smoothstep(rin, rin + 0.07, r) * (1.0 - smoothstep(ro - 0.06, ro, r));
  float gran = fbm(q * 7.0 + tt * 0.6);
  float poro = vn(q * 34.0 + 7.0);
  float dens = cuerpo * (0.42 + 0.62 * gran) * (0.86 + 0.28 * poro);
  // el pigmento se acumula en los bordes, como en una acuarela de verdad
  float rim = exp(-pow((r - (ro - 0.03)) / 0.024, 2.0)) * cuerpo;
  float rimIn = exp(-pow((r - (rin + 0.06)) / 0.03, 2.0)) * cuerpo;
  dens += rim * 0.5 + rimIn * 0.22;
  float halo = (1.0 - smoothstep(ro - 0.04, ro + 0.2, r)) * smoothstep(ri - 0.02, ro, r) * 0.16;
  dens = max(dens, halo * eb);
  float hv = hue + t * 0.006 + (fbm(q * 2.3 - tt) - 0.5) * 0.09;
  vec3 col = mix(pal(hv), pal(hv + 0.11), smoothstep(0.55, 0.85, gran) * 0.35);
  float grano = h21(gl_FragCoord.xy) * 0.07;
  float al = clamp(dens * 0.9 - grano * cuerpo, 0.0, 0.92) * eb;
  gl_FragColor = vec4(col * al, al);
}`;

  let gl = null, prog = null, uT, uB, uRi;
  try {
    gl = lienzo.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: false, powerPreference: 'low-power' });
  } catch (e) { gl = null; }
  const sinGl = () => {
    const img = caja.querySelector('.aura-respaldo[data-src]');
    if (img) img.src = img.dataset.src;
    caja.classList.add('sin-gl');
    if (boton) boton.hidden = true;
  };
  if (!gl) { sinGl(); return; }

  const shader = (tipo, src) => {
    const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { console.warn('aura:', e.message); sinGl(); return; }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  uT = gl.getUniformLocation(prog, 't');
  uB = gl.getUniformLocation(prog, 'b');
  uRi = gl.getUniformLocation(prog, 'ri');

  // tamaño: la acuarela es suave, no hace falta la resolución completa
  const escala = () => {
    const movil = matchMedia('(max-width: 979px)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, movil ? 1.25 : 1.5);
    return dpr * (movil ? 0.8 : 0.85);
  };
  const ajusta = () => {
    const lado = caja.getBoundingClientRect().width;
    const px = Math.max(160, Math.round(lado * escala()));
    if (lienzo.width !== px) { lienzo.width = px; lienzo.height = px; gl.viewport(0, 0, px, px); }
  };

  const RI = 0.58; // el retrato ocupa el 58 % de la caja
  let t0 = performance.now(), tPausa = 0, entrada = quieto.matches ? 1 : 0, visible = true, raf = 0, ultimo = 0;
  const pausado = () => doc.dataset.movimiento === 'pausa' || quieto.matches;

  const dibuja = (ts) => {
    const seg = (ts - t0) / 1000; // en 0 s los colores están como en el logo: naranja arriba
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uT, seg);
    gl.uniform1f(uB, entrada);
    gl.uniform1f(uRi, RI);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const bucle = (ts) => {
    raf = 0;
    if (!visible || document.hidden) return;
    if (entrada < 1) entrada = Math.min(1, entrada + (ts - (ultimo || ts)) / 1800);
    if (ts - ultimo >= 33 || entrada < 1) { // ~30 imágenes por segundo
      ultimo = ts;
      dibuja(ts - tPausa);
    }
    if (!pausado() || entrada < 1) raf = requestAnimationFrame(bucle);
  };
  const arranca = () => { if (!raf) raf = requestAnimationFrame(bucle); };

  ajusta();
  dibuja(performance.now());
  arranca();

  if ('ResizeObserver' in window) new ResizeObserver(() => { ajusta(); dibuja(performance.now() - tPausa); }).observe(caja);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) arranca(); }).observe(caja);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) arranca(); });
  lienzo.addEventListener('webglcontextlost', (e) => { e.preventDefault(); sinGl(); });

  // pausar / reanudar (WCAG 2.2.2)
  let pausaDesde = 0;
  const pintaBoton = () => {
    if (!boton) return;
    const p = doc.dataset.movimiento === 'pausa';
    boton.setAttribute('aria-pressed', String(p));
    boton.setAttribute('aria-label', p ? 'Reanudar la animación de colores' : 'Pausar la animación de colores');
    boton.title = p ? 'Reanudar la animación' : 'Pausar la animación';
  };
  if (quieto.matches && boton) boton.hidden = true;
  if (boton) boton.addEventListener('click', () => {
    if (doc.dataset.movimiento === 'pausa') {
      delete doc.dataset.movimiento;
      try { localStorage.removeItem('rsame-movimiento'); } catch (e) {}
      if (pausaDesde) tPausa += performance.now() - pausaDesde;
      pausaDesde = 0;
      arranca();
    } else {
      doc.dataset.movimiento = 'pausa';
      try { localStorage.setItem('rsame-movimiento', 'pausa'); } catch (e) {}
      pausaDesde = performance.now();
    }
    pintaBoton();
  });
  pintaBoton();

  // solo para preparar la imagen fija de respaldo (assets/test/aura-export.html)
  window.__aura = { foto: (px) => { lienzo.width = lienzo.height = px; gl.viewport(0, 0, px, px); entrada = 1; dibuja(performance.now()); return lienzo; } };
})();
