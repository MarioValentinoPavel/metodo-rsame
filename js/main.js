/* Método R'Same · comportamiento práctico de la página.
   Todo funciona sin este script; aquí solo se añaden ayudas: letra grande, menú,
   estados de inscripción según la fecha, hora del país y el «canal» de cursos. */
(() => {
  'use strict';
  const doc = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  const guarda = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };

  /* ---------- letra grande ---------- */
  const botonesLetra = $$('button[data-letra]'); // ojo: <html data-letra> no es un botón
  const pintaLetra = () => {
    const on = doc.dataset.letra === 'grande';
    botonesLetra.forEach((b) => {
      b.classList.toggle('activa', on);
      const t = b.querySelector('span');
      if (t) t.textContent = on ? 'Letra normal' : 'Letra grande';
    });
  };
  botonesLetra.forEach((b) => b.addEventListener('click', () => {
    const on = doc.dataset.letra !== 'grande';
    if (on) doc.dataset.letra = 'grande'; else delete doc.dataset.letra;
    guarda('rsame-letra', on ? 'grande' : null);
    pintaLetra();
    requestAnimationFrame(midCanal);
  }));
  pintaLetra();

  /* ---------- menú ---------- */
  const menu = $('#menu');
  const menuBtn = $('.menu-btn');
  const cabecera = $('#cab');
  const abreMenu = (abrir) => {
    // el panel empieza justo debajo de la cabecera (arriba del todo hay la barra de aviso)
    if (abrir) menu.style.top = Math.max(0, Math.round(cabecera.getBoundingClientRect().bottom)) + 'px';
    menu.hidden = !abrir;
    menuBtn.setAttribute('aria-expanded', String(abrir));
    menuBtn.querySelector('span').textContent = abrir ? 'Cerrar' : 'Menú';
    menuBtn.querySelector('use').setAttribute('href', abrir ? '#i-cerrar' : '#i-menu');
    doc.classList.toggle('menu-abierto', abrir);
    if (abrir) menu.querySelector('a').focus();
  };
  menuBtn.addEventListener('click', () => abreMenu(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) abreMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) { abreMenu(false); menuBtn.focus(); }
  });
  // si el botón «Menú» deja de verse (pantalla más ancha), se cierra el panel
  addEventListener('resize', () => { if (!menu.hidden && getComputedStyle(menuBtn).display === 'none') abreMenu(false); });

  /* ---------- fechas (siempre en hora de España) ---------- */
  const TZ = 'Europe/Madrid';
  const partes = (fecha, tz) => {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short' }).formatToParts(fecha);
    return Object.fromEntries(p.map((x) => [x.type, x.value]));
  };
  const ahora = new Date();
  const pm = partes(ahora, TZ);
  const hoyMadrid = `${pm.year}-${pm.month}-${pm.day}T${pm.hour}:${pm.minute}`;
  const diaMadrid = hoyMadrid.slice(0, 10);

  // Fechas publicadas en metodorsame.com y en las páginas de inscripción de la gira (16-11-2026).
  const CITAS = {
    abundancia: { abre: '2026-09-16T12:00', cierra: '2026-11-16T23:59', inicio: '2026-10-27' },
    bsas: { inicio: '2026-11-18', fin: '2026-11-22T23:59', texto: 'R’SAME Full Concept en Buenos Aires, del 18 al 22 de noviembre' },
    santiago: { inicio: '2026-11-25', fin: '2026-11-29T23:59', texto: 'Taller de Especialización R’SAME en Santiago de Chile, del 25 al 29 de noviembre' },
  };

  const pintaEstado = (el, clase, icono, texto) => {
    el.className = 'estado ' + clase;
    el.querySelector('use').setAttribute('href', icono);
    el.querySelector('span').textContent = texto;
  };

  // Abundancia: abierta, último día o cerrada
  const ab = CITAS.abundancia;
  const abAbierta = hoyMadrid >= ab.abre && hoyMadrid <= ab.cierra;
  const abUltimo = abAbierta && diaMadrid === ab.cierra.slice(0, 10);
  $$('[data-cita="abundancia"]').forEach((el) => {
    const est = el.querySelector('[data-estado]');
    if (abUltimo && est) pintaEstado(est, 'estado-ultimo', '#i-reloj', 'Último día: hasta hoy, lunes 16 de noviembre');
    if (!abAbierta) {
      if (est) pintaEstado(est, 'estado-cerrada', '#i-candado', 'Cerradas');
      $$('[data-si-abierta]', el).forEach((x) => { x.hidden = true; });
      $$('[data-si-cerrada]', el).forEach((x) => { x.hidden = false; });
      const nota = el.querySelector('[data-estado-nota]');
      if (nota) nota.textContent = 'El curso empezó el 27 de octubre de 2026.';
    }
  });
  const pasados = $('#pasados');
  const aPasados = (html) => { if (pasados) pasados.insertAdjacentHTML('afterbegin', `<li>${html}</li>`); };
  if (!abAbierta) {
    const li = $('#agenda [data-cita="abundancia"]');
    if (li) li.remove();
    aPasados('<a href="#curso-abundancia">Abundancia y cambios de tablero</a>, online: empezó el 27 de octubre de 2026');
  }

  // Gira: próximo, en curso o ya hecho
  ['santiago', 'bsas'].forEach((k) => {
    const c = CITAS[k];
    const li = $(`#agenda [data-cita="${k}"]`);
    if (!li) return;
    if (hoyMadrid > c.fin) {
      li.remove();
      aPasados(`${li.querySelector('h4').textContent}, ${li.querySelector('.cita-que p').textContent.split(' · ')[0]}: ${c.texto.split(', ').pop()}`);
    } else if (diaMadrid >= c.inicio) {
      pintaEstado(li.querySelector('[data-estado]'), 'estado-curso', '#i-calendario', 'Se está celebrando estos días');
    }
  });
  const agenda = $('#agenda');
  if (agenda && !agenda.children.length) {
    agenda.insertAdjacentHTML('beforeend', '<li class="cita"><div class="cita-que"><h4>Ahora no hay cursos con fecha</h4><p>Apúntate al aviso de nuevas fechas y te escribiremos cuando se programen.</p></div><div class="cita-accion"><a class="btn" href="https://metodorsame.com/#mc4wp-form-1">Avisarme de nuevas fechas</a></div></li>');
  }

  // Barra de aviso: lo más urgente primero
  const avisoTxt = $('#aviso-txt');
  const avisoEnlace = $('#aviso-enlace');
  if (avisoTxt) {
    let msg = null;
    if (abUltimo) msg = '<strong>Último día:</strong> inscripciones a Abundancia y cambios de tablero (online) hasta hoy, lunes 16.';
    else if (abAbierta) msg = '<strong>Inscripciones abiertas:</strong> Abundancia y cambios de tablero (online), hasta el lunes 16 de noviembre.';
    else {
      const prox = ['bsas', 'santiago'].find((k) => hoyMadrid <= CITAS[k].fin);
      if (prox) msg = `<strong>${diaMadrid >= CITAS[prox].inicio ? 'Estos días' : 'Próximo curso'}:</strong> ${CITAS[prox].texto}.`;
    }
    if (msg) avisoTxt.innerHTML = msg;
    else {
      avisoTxt.innerHTML = '<strong>¿Quieres saber cuándo hay fechas nuevas?</strong> Apúntate al aviso por correo.';
      avisoEnlace.textContent = 'Apuntarme';
      avisoEnlace.href = 'https://metodorsame.com/#mc4wp-form-1';
    }
  }

  // «Hoy es…» para situarse
  const hoy = $('#hoy');
  if (hoy) {
    const txt = new Intl.DateTimeFormat('es-ES', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(ahora);
    hoy.innerHTML = `<svg class="ic" aria-hidden="true"><use href="#i-calendario"/></svg>Hoy es ${txt} (hora de España)`;
    hoy.hidden = false;
  }

  /* ---------- la hora de las clases en tu país ---------- */
  const offset = (tz, fecha) => {
    const v = partes(fecha, tz);
    return Math.round((Date.UTC(+v.year, +v.month - 1, +v.day, +v.hour, +v.minute, +v.second) - fecha.getTime()) / 60000);
  };
  const instanteMadrid = (y, m, d, hh, mm) => {
    const guess = Date.UTC(y, m - 1, d, hh, mm);
    let t = guess - offset(TZ, new Date(guess)) * 60000;
    const o2 = offset(TZ, new Date(t));
    t = guess - o2 * 60000;
    return new Date(t);
  };
  let tuZona = 'Europe/Madrid';
  try { tuZona = Intl.DateTimeFormat().resolvedOptions().timeZone || TZ; } catch (e) {}
  // para revisar cómo lo ve alguien de otro país: ?tz=America/Mexico_City
  const tzPrueba = new URLSearchParams(location.search).get('tz');
  if (tzPrueba) { try { new Intl.DateTimeFormat('es', { timeZone: tzPrueba }); tuZona = tzPrueba; } catch (e) {} }
  // próximo martes en España
  const dias = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
  const faltan = (2 - dias[pm.weekday] + 7) % 7;
  const base = new Date(Date.UTC(+pm.year, +pm.month - 1, +pm.day + faltan));
  $$('.tu-hora').forEach((el) => {
    const horas = el.dataset.hora.split(',').map((h) => h.trim().split(':').map(Number));
    const instantes = horas.map(([h, m]) => instanteMadrid(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate(), h, m));
    if (instantes.every((t) => offset(tuZona, t) === offset(TZ, t))) return; // misma hora que España
    const dia = new Intl.DateTimeFormat('es-ES', { timeZone: tuZona, weekday: 'long' });
    const hora = new Intl.DateTimeFormat('es-ES', { timeZone: tuZona, hour: 'numeric', minute: '2-digit' });
    const dias2 = instantes.map((t) => dia.format(t));
    const horas2 = instantes.map((t) => hora.format(t));
    const une = (l) => (l.length > 1 ? l.slice(0, -1).join(', ') + ' y ' + l[l.length - 1] : l[0]);
    // «martes a las 2:00 y a las 11:00» o, si cambia el día, «lunes a las 23:00 y martes a las 8:00»
    const mismoDia = dias2.every((d) => d === dias2[0]);
    el.textContent = 'En tu hora local: ' + (mismoDia
      ? dias2[0] + ' ' + une(horas2.map((h) => 'a las ' + h))
      : une(instantes.map((t, i) => dias2[i] + ' a las ' + horas2[i])));
    el.hidden = false;
  });

  /* ---------- cabecera, botón subir, sección actual ---------- */
  const cab = $('#cab');
  const arriba = $('#arriba');
  let ticking = false;
  const alScroll = () => {
    ticking = false;
    const y = window.scrollY;
    cab.classList.toggle('con-sombra', y > 8);
    arriba.classList.toggle('ver', y > 1100);
    midCanal();
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(alScroll); } }, { passive: true });

  const enlacesNav = $$('.nav a');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = '#' + en.target.id;
        enlacesNav.forEach((a) => {
          if (a.getAttribute('href') === id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['cursos', 'fechas', 'jau', 'videos', 'preguntas', 'contacto'].forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- R'SAME: las letras se despliegan al llegar ---------- */
  const sigla = $('#sigla');
  if (sigla && 'IntersectionObserver' in window && !quieto.matches) {
    const r = sigla.getBoundingClientRect();
    if (r.top > innerHeight * 0.85) {
      sigla.classList.add('prepara');
      const io = new IntersectionObserver((en) => {
        if (en[0].isIntersecting) { sigla.classList.add('visto'); io.disconnect(); }
      }, { rootMargin: '0px 0px -18% 0px' });
      io.observe(sigla);
    }
  }

  /* ---------- el canal: la luz baja por la línea al leer los cursos ---------- */
  const canal = $('#canal');
  const cursos = canal ? $$('.curso', canal) : [];
  function midCanal() {
    if (!canal) return;
    if (quieto.matches) { canal.style.setProperty('--p', 1); cursos.forEach((c) => c.classList.add('encendido')); return; }
    const r = canal.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
    canal.style.setProperty('--p', p.toFixed(4));
    cursos.forEach((c) => {
      const n = c.querySelector('.nodo').getBoundingClientRect();
      c.classList.toggle('encendido', n.top + n.height / 2 < innerHeight * 0.6);
    });
  }
  midCanal();
  alScroll();

  /* ---------- al saltar a un curso, abrir su temario si se pide ---------- */
  const abreDesdeHash = () => {
    const id = location.hash.slice(1);
    if (!id) return;
    const el = document.getElementById(id);
    if (el && el.tagName === 'DETAILS') el.open = true;
  };
  addEventListener('hashchange', abreDesdeHash);
  abreDesdeHash();
})();
