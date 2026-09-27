/* SM.ui — pinta todas las pantallas dentro de #app y maneja sus eventos. Cada
   pantalla recibe `caja` (un contenedor mutable { estado }) y `ir(pantalla, datos)`
   para navegar. No hay URLs: todo es JS puro reemplazando el HTML de #app. */
(function () {
  let intervaloJuego = null;
  let intervaloPregunta = null;
  let rafArcade = null;
  let intervaloRachaWidget = null;
  function detenerIntervalo() {
    if (intervaloRachaWidget) { clearInterval(intervaloRachaWidget); intervaloRachaWidget = null; }
    if (intervaloJuego) { clearInterval(intervaloJuego); intervaloJuego = null; }
    if (intervaloPregunta) { clearInterval(intervaloPregunta); intervaloPregunta = null; }
    if (rafArcade) { cancelAnimationFrame(rafArcade); rafArcade = null; }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function estrellasHTML(n) {
    let h = '';
    for (let i = 1; i <= 3; i++) h += `<span class="sm-estrella ${i <= n ? 'llena' : ''}">★</span>`;
    return h;
  }

  function dificultadHTML(nivelDificultad) {
    const info = SM.mundos.DIFICULTADES[nivelDificultad] || SM.mundos.DIFICULTADES[1];
    let pips = '';
    for (let i = 1; i <= 4; i++) pips += `<span class="sm-dif-pip ${i <= nivelDificultad ? 'llena' : ''}"></span>`;
    return `<span class="sm-dificultad" style="--color-dif:${info.color}"><span class="sm-dif-pips">${pips}</span>${esc(info.nombre)}</span>`;
  }

  function confirmar(mensaje, textoConfirmar, onConfirmar) {
    const overlay = document.createElement('div');
    overlay.className = 'sm-overlay';
    overlay.innerHTML = `<div class="sm-modal">
      <p>${esc(mensaje)}</p>
      <div class="sm-modal-botones">
        <button class="btn btn-sec" data-accion="cancelar">Cancelar</button>
        <button class="btn btn-peligro" data-accion="confirmar">${esc(textoConfirmar)}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.dataset.accion === 'cancelar') overlay.remove();
      else if (e.target.dataset.accion === 'confirmar') { overlay.remove(); onConfirmar(); }
    });
  }

  // "Profesor Cosmo": explicación del método general de un planeta, con un ejemplo
  // propio (no revela la respuesta de la pregunta actual). `alCerrar` es opcional,
  // para reanudar cronómetros que se hayan pausado mientras estaba abierta.
  function mostrarExplicacion(mundoId, alCerrar) {
    const metodo = SM.lecciones.metodo(mundoId);
    if (!metodo) return;
    const overlay = document.createElement('div');
    overlay.className = 'sm-overlay';
    overlay.innerHTML = `<div class="sm-modal sm-modal-explicacion">
      ${SM.mascota.svg('pensando', 'sm-mascota-media')}
      <h2>🤖 ${esc(metodo.titulo)}</h2>
      <ol class="sm-explicacion-pasos">${metodo.pasos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
      ${metodo.ejemplo ? `<p class="sm-explicacion-ejemplo">${esc(metodo.ejemplo)}</p>` : ''}
      <button class="btn" data-accion="cerrar-explicacion">¡Entendido! 🚀</button>
    </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.dataset.accion === 'cerrar-explicacion') {
        overlay.remove();
        if (alCerrar) alCerrar();
      }
    });
  }

  function lanzarConfeti(contenedor) {
    const colores = ['#4fd1ff', '#ff8a3d', '#ffd23f', '#3fd67a', '#ff6fae', '#a78bfa'];
    for (let i = 0; i < 26; i++) {
      const pieza = document.createElement('span');
      pieza.className = 'sm-confeti-pieza';
      pieza.style.left = `${Math.random() * 100}%`;
      pieza.style.background = colores[i % colores.length];
      pieza.style.animationDelay = `${Math.random() * 0.4}s`;
      pieza.style.animationDuration = `${1.4 + Math.random() * 1.1}s`;
      contenedor.appendChild(pieza);
    }
  }

  function barraInferior(activa) {
    const items = [
      { id: 'inicio', icono: '🚀', texto: 'Inicio' },
      { id: 'arcade', icono: '🕹️', texto: 'Arcade' },
      { id: 'premios', icono: '🎁', texto: 'Metas' },
      { id: 'logros', icono: '🏆', texto: 'Logros' },
      { id: 'ajustes', icono: '⚙️', texto: 'Ajustes' },
    ];
    return `<nav class="sm-navbar">${items.map((i) => `
      <button class="sm-navbar-btn ${i.id === activa ? 'activo' : ''}" data-ir="${i.id}">
        <span>${i.icono}</span><small>${i.texto}</small>
      </button>`).join('')}</nav>`;
  }

  function cablearNavbar(root, ir) {
    root.querySelectorAll('.sm-navbar-btn[data-ir]').forEach((btn) => {
      btn.addEventListener('click', () => { SM.sonido.click(); ir(btn.dataset.ir); });
    });
  }

  // ==================== INICIO ====================
  function pantallaInicio(root, caja, ir) {
    detenerIntervalo();
    const estado = caja.estado;
    const totalEstrellas = SM.progreso.sumaEstrellas(estado);
    const saludo = SM.mascota.frase('saludo', { nombre: esc(estado.nombre) });

    // Modo enfoque: solo tablas — pedido explícito del usuario porque Santi estaba
    // repartiendo su tiempo entre 8 planetas y 5 juegos en vez de dominar las tablas
    // de multiplicar, que es la base urgente de todo lo demás. Con el modo activo
    // (`estado.modoSoloTablas`, ver Ajustes) solo Tablix queda jugable; el resto se
    // ve pero bloqueado, con el mismo lenguaje visual que un nivel bloqueado.
    const tarjetas = SM.mundos.lista.map((m) => {
      const { obtenidas, maximo } = SM.progreso.estrellasMundo(estado, m.id);
      const pct = maximo ? Math.round((obtenidas / maximo) * 100) : 0;
      // Desbloqueo con XP: un planeta cerrado muestra cuánto XP le falta y la barra
      // avanza hacia esa meta (el XP no se gasta).
      const bloqueado = !SM.progreso.planetaDesbloqueado(estado, m.id);
      const xpMeta = SM.progreso.xpParaPlaneta(m.id);
      const pctBarra = bloqueado ? Math.min(100, Math.round((estado.xp / xpMeta) * 100)) : pct;
      return `<button class="sm-planeta-card ${bloqueado ? 'bloqueado' : ''}" data-mundo="${m.id}" style="--color-planeta:${m.color}" ${bloqueado ? 'disabled' : ''}>
        <span class="sm-planeta-emoji">${bloqueado ? '🔒' : m.emoji}</span>
        <span class="sm-planeta-nombre">${m.nombre}</span>
        <span class="sm-planeta-subtitulo">${bloqueado ? `Se abre con ${xpMeta.toLocaleString('es-CO')} XP` : esc(m.subtitulo)}</span>
        <span class="sm-planeta-barra ${bloqueado ? 'sm-barra-xp' : ''}"><span style="width:${pctBarra}%"></span></span>
        <span class="sm-planeta-estrellas">${bloqueado ? `✨ Faltan ${(xpMeta - estado.xp).toLocaleString('es-CO')} XP` : `⭐ ${obtenidas}/${maximo}`}</span>
      </button>`;
    }).join('');

    const metaProxima = estado.metas
      .filter((m) => !m.reclamada)
      .sort((a, b) => a.puntos - b.puntos)
      .find((m) => !SM.progreso.metaLista(estado, m)) || estado.metas.find((m) => !m.reclamada);
    const metaHTML = metaProxima ? (() => {
      const pct = Math.min(100, Math.round((estado.xp / metaProxima.puntos) * 100));
      const lista = SM.progreso.metaLista(estado, metaProxima);
      const notaRacha = metaProxima.rachaMinima ? ` · 🔥 racha de ${metaProxima.rachaMinima} días` : '';
      return `<button class="sm-meta-mini" data-accion="premios">
        <span class="sm-meta-mini-emoji">${metaProxima.emoji}</span>
        <span class="sm-meta-mini-info">
          <span>${lista ? '¡Meta lista! ' : 'Próxima meta: '}<b>${esc(metaProxima.nombre)}</b></span>
          <span class="sm-planeta-barra"><span style="width:${pct}%"></span></span>
          <small class="sm-muted">${estado.xp}/${metaProxima.puntos} XP${notaRacha}</small>
        </span>
      </button>`;
    })() : '';

    // Atajo directo al Centro de Tablas (js/tablas.js) mientras el modo enfoque esté
    // activo — es lo único jugable, así que se muestra arriba en vez de obligar a
    // entrar primero a Tablix y buscar el botón dentro.
    const centroTablasHTML = estado.modoSoloTablas ? `<button class="sm-meta-mini" data-accion="centro-tablas" style="border-color:var(--accent)">
      <span class="sm-meta-mini-emoji">🧠</span>
      <span class="sm-meta-mini-info">
        <span><b>Centro de entrenamiento de tablas</b></span>
        <small class="sm-muted">Tarjetas rápidas, Minuto Loco, Conteo Salteado y tu mapa de dominio</small>
      </span>
    </button>` : '';

    const cumplidoHoy = estado.retoDiario.cumplidoHoy;
    const hayRescate = SM.progreso.rescateDisponible(estado);
    const retoHTML = hayRescate ? rescateCardHTML(estado) : widgetRachaHTML(estado);

    root.innerHTML = `<div class="sm-pantalla sm-pantalla-inicio">
      <header class="sm-inicio-header">
        ${SM.mascota.svg(hayRescate ? 'consolando' : (cumplidoHoy ? 'celebrando' : 'animando'), 'sm-mascota-media')}
        <div><h1>${saludo}</h1><p class="sm-muted">Elige un planeta y sigue tu misión matemática</p></div>
      </header>
      <div class="sm-stats-fila">
        <div class="sm-stat-chip">✨ <b>${estado.xp}</b> XP</div>
        <div class="sm-stat-chip">⭐ <b>${totalEstrellas}</b> estrellas</div>
      </div>
      ${retoHTML}
      ${centroTablasHTML}
      ${metaHTML}
      <div class="sm-planetas-grid">${tarjetas}</div>
      ${barraInferior('inicio')}
    </div>`;

    root.querySelectorAll('.sm-planeta-card').forEach((btn) => {
      btn.addEventListener('click', () => { SM.sonido.click(); ir('mundo', { mundoId: btn.dataset.mundo }); });
    });
    const btnMeta = root.querySelector('[data-accion="premios"]');
    if (btnMeta) btnMeta.addEventListener('click', () => { SM.sonido.click(); ir('premios'); });
    const btnCentroTablas = root.querySelector('[data-accion="centro-tablas"]');
    if (btnCentroTablas) btnCentroTablas.addEventListener('click', () => { SM.sonido.click(); ir('centro-tablas'); });
    const btnRacha = root.querySelector('[data-accion="racha"]');
    if (btnRacha) btnRacha.addEventListener('click', () => { SM.sonido.click(); ir('logros'); });
    const btnRescate = root.querySelector('[data-accion="rescate"]');
    if (btnRescate) btnRescate.addEventListener('click', () => { SM.sonido.click(); ir('rescate-racha'); });
    arrancarCuentaRegresivaRacha(root, caja, ir);
    cablearNavbar(root, ir);
    anunciarPlanetasNuevos(caja, ir);
  }

  // Celebra (una sola vez) los planetas que Santi acaba de abrir juntando XP.
  function anunciarPlanetasNuevos(caja, ir) {
    const nuevos = SM.progreso.planetasPorAnunciar(caja.estado);
    if (!nuevos.length) return;
    SM.progreso.marcarPlanetasAnunciados(caja.estado, nuevos.map((m) => m.id));
    const overlay = document.createElement('div');
    overlay.className = 'sm-overlay';
    overlay.innerHTML = `<div class="sm-modal sm-modal-planeta">
      <div id="sm-confeti-planeta" class="sm-confeti-zona"></div>
      <div class="sm-modal-planeta-emojis">${nuevos.map((m) => m.emoji).join(' ')}</div>
      <h2>🔓 ¡${nuevos.length === 1 ? 'Nuevo planeta desbloqueado' : `${nuevos.length} planetas desbloqueados`}!</h2>
      <p>Con tu XP abriste <b>${nuevos.map((m) => esc(m.nombre)).join(', ')}</b>. ¡A explorar, capitán!</p>
      <button class="btn" data-accion="ok">🚀 ¡Vamos!</button>
    </div>`;
    document.body.appendChild(overlay);
    lanzarConfeti(overlay.querySelector('#sm-confeti-planeta'));
    SM.sonido.logro();
    overlay.querySelector('[data-accion="ok"]').addEventListener('click', () => { SM.sonido.click(); overlay.remove(); });
  }

  // ==================== WIDGET DE RACHA (estilo Duolingo) ====================
  // Pedido explícito del usuario: "widgets como el de Duolingo, el de la racha".
  // Un widget real en la pantalla de inicio de Android exige una app nativa, así que
  // se decidió (con el usuario) hacerlo DENTRO de la app, arriba en Inicio: llama
  // grande con los días, la semana L-D marcada, barra del XP de hoy, cuenta regresiva
  // hasta medianoche y el próximo hito de racha. Tocarlo abre "Mis logros".
  function llamaSVG() {
    return `<svg viewBox="0 0 64 80" class="sm-rw-llama-svg" aria-hidden="true">
      <path class="sm-rw-llama-ext" d="M32 2C36 18 54 26 54 50C54 66 44 78 32 78C20 78 10 66 10 50C10 38 16 30 22 24C22 34 26 38 30 38C28 26 26 14 32 2Z"/>
      <path class="sm-rw-llama-int" d="M32 36C34 46 44 50 44 60C44 70 38 76 32 76C26 76 20 70 20 60C20 54 23 50 26 47C26 52 28 55 31 55C30 48 29 42 32 36Z"/>
    </svg>`;
  }

  function proximoHitoRacha(estado) {
    const hitos = [
      { dias: 3, texto: '🔥 logro Constancia' },
      { dias: 7, texto: '🏆 logro Semana espacial' },
      { dias: 14, texto: '🌌 logro Constancia estelar' },
      { dias: 30, texto: '👑 ¡un mes entero!' },
    ];
    estado.metas.filter((m) => !m.reclamada && m.rachaMinima).forEach((m) => {
      if (!hitos.some((h) => h.dias === m.rachaMinima)) hitos.push({ dias: m.rachaMinima, texto: '🎁 racha para premios' });
    });
    hitos.sort((a, b) => a.dias - b.dias);
    return hitos.find((h) => h.dias > estado.racha.dias) || null;
  }

  function textoTiempoRestante() {
    const ahora = new Date();
    const medianoche = new Date(ahora);
    medianoche.setHours(24, 0, 0, 0);
    const min = Math.max(0, Math.floor((medianoche - ahora) / 60000));
    const h = Math.floor(min / 60);
    const m = min % 60;
    return { min, texto: h > 0 ? `${h} h ${m} min` : `${m} min` };
  }

  function widgetRachaHTML(estado) {
    const dias = estado.racha.dias;
    const cumplido = estado.retoDiario.cumplidoHoy;
    const xpHoy = estado.retoDiario.xpHoy;
    const metaHoy = estado.metaDiariaXP;
    const pctHoy = Math.min(100, Math.round((xpHoy / metaHoy) * 100));
    const { min } = textoTiempoRestante();
    const peligro = !cumplido && dias > 0 && min <= 240;

    const semana = SM.progreso.semanaRacha(estado).map((d) => {
      const clase = [d.cumplido ? 'hecho' : '', d.esHoy ? 'hoy' : '', d.futuro ? 'futuro' : ''].join(' ');
      const clase2 = !d.cumplido && d.rescatado ? 'rescatado' : '';
      return `<div class="sm-rw-dia ${clase} ${clase2}"><span>${d.letra}</span><i>${d.cumplido ? '✓' : (d.rescatado ? '🛟' : '')}</i></div>`;
    }).join('');

    let titulo;
    let mensaje;
    if (cumplido) {
      titulo = `¡${dias} día${dias === 1 ? '' : 's'} de racha!`;
      mensaje = `Racha a salvo hoy 🎉 Vuelve mañana para llegar a ${dias + 1}.`;
    } else if (dias > 0) {
      titulo = `${dias} día${dias === 1 ? '' : 's'} de racha`;
      mensaje = `¡Gana ${Math.max(0, metaHoy - xpHoy)} XP más hoy para no perderla!`;
    } else {
      titulo = '¡Enciende tu racha!';
      mensaje = `Gana ${metaHoy} XP hoy y tu llama se prende 🔥`;
    }

    const hito = proximoHitoRacha(estado);
    const hitoHTML = hito ? `<small class="sm-rw-hito">Falta${hito.dias - dias === 1 ? '' : 'n'} <b>${hito.dias - dias}</b> día${hito.dias - dias === 1 ? '' : 's'} para ${hito.texto}</small>` : '';

    return `<button class="sm-racha-widget ${cumplido ? 'cumplido' : ''} ${peligro ? 'peligro' : ''}" data-accion="racha">
      <div class="sm-rw-top">
        <div class="sm-rw-llama ${cumplido ? 'encendida' : ''}">${llamaSVG()}<span class="sm-rw-num">${dias}</span></div>
        <div class="sm-rw-texto">
          <b>${titulo}</b>
          <small>${mensaje}</small>
        </div>
      </div>
      <div class="sm-rw-semana">${semana}</div>
      <div class="sm-rw-progreso">
        <span class="sm-planeta-barra"><span style="width:${pctHoy}%"></span></span>
        <small><b>${xpHoy}/${metaHoy}</b> XP hoy</small>
      </div>
      <div class="sm-rw-pie">
        ${cumplido ? '<small>✅ Reto de hoy cumplido</small>' : `<small class="sm-rw-cuenta">⏳ Te quedan <b id="sm-rw-tiempo">${textoTiempoRestante().texto}</b></small>`}
        ${hitoHTML}
      </div>
    </button>`;
  }

  // Tarjeta que reemplaza al widget SOLO el día en que se perdió la racha y todavía no
  // se ha usado el rescate (ver SM.progreso.rescateDisponible).
  function rescateCardHTML(estado) {
    const r = estado.rescateRacha;
    const n = r.diasPerdidos;
    return `<button class="sm-racha-widget sm-rescate-card" data-accion="rescate">
      <div class="sm-rw-top">
        <div class="sm-rw-llama sm-rw-llama-rota">${llamaSVG()}<span class="sm-rw-num">${n}</span></div>
        <div class="sm-rw-texto">
          <b>💔 ¡Se apagó tu racha de ${n} día${n === 1 ? '' : 's'}!</b>
          <small>Tienes <b>UNA</b> oportunidad, solo hoy, para rescatarla: ${SM.progreso.RESCATE_PREGUNTAS} tablas y puedes fallar máximo ${SM.progreso.RESCATE_ERRORES_MAX}.</small>
        </div>
      </div>
      <span class="btn sm-rescate-btn">🛟 Rescatar mi racha</span>
      <div class="sm-rw-pie"><small class="sm-rw-cuenta">⏳ El rescate se acaba en <b id="sm-rw-tiempo">${textoTiempoRestante().texto}</b></small></div>
    </button>`;
  }

  // ==================== RESCATE DE RACHA (juego) ====================
  // 10 tablas del 2 al 9 escritas con teclado (sin opciones, para que cuente de verdad).
  // 3 vidas: al tercer error termina y la racha no se recupera. Sin XP (no es para farmear).
  function pantallaRescateRacha(root, caja, ir) {
    detenerIntervalo();
    const estado = caja.estado;
    if (!SM.progreso.rescateDisponible(estado)) { ir('inicio'); return; }
    const TOTAL = SM.progreso.RESCATE_PREGUNTAS;
    const MAX_ERR = SM.progreso.RESCATE_ERRORES_MAX;
    const n = estado.rescateRacha.diasPerdidos;

    root.innerHTML = `<div class="sm-pantalla sm-pantalla-resultado">
      ${SM.mascota.svg('animando', 'sm-mascota-media')}
      <h1>🛟 Rescate de racha</h1>
      <p>Tu racha de <b>${n} día${n === 1 ? '' : 's'}</b> se apagó. ¡Todavía podemos salvarla!</p>
      <div class="sm-rescate-reglas">
        <p>✖️ <b>${TOTAL} tablas</b> — escribes el resultado.</p>
        <p>❤️❤️❤️ Puedes fallar <b>máximo ${MAX_ERR}</b>. Al tercer error se acaba.</p>
        <p>☝️ <b>Un solo intento.</b> Si sales a la mitad, se pierde.</p>
      </div>
      <div class="sm-resultado-botones">
        <button class="btn" data-accion="empezar">🚀 ¡Empezar el rescate!</button>
        <button class="btn btn-sec" data-accion="volver">Ahora no</button>
      </div>
    </div>`;
    root.querySelector('[data-accion="volver"]').addEventListener('click', () => { SM.sonido.click(); ir('inicio'); });
    root.querySelector('[data-accion="empezar"]').addEventListener('click', () => {
      if (!SM.progreso.iniciarRescate(caja.estado)) { ir('inicio'); return; }
      SM.sonido.inicioNivel();
      jugar();
    });

    function jugar() {
      let indice = 0;
      let errores = 0;
      let buffer = '';
      let respondiendo = false;
      let pregunta = null;
      let terminado = false;

      root.innerHTML = `<div class="sm-pantalla sm-pantalla-juego">
        <header class="sm-barra-superior">
          <button class="sm-btn-icono" data-accion="salir">✕</button>
          <div class="sm-progreso-zona" id="sm-progreso-zona"></div>
          <div class="sm-vidas-chip" id="sm-vidas-chip"></div>
        </header>
        <div id="sm-pregunta-zona"></div>
      </div>`;
      root.querySelector('[data-accion="salir"]').addEventListener('click', () => {
        confirmar('Si sales ahora, pierdes el rescate y la racha queda en 0. ¿Seguro?', 'Salir', () => { errores = MAX_ERR + 1; finalizar(); });
      });

      function renderProgreso() {
        const pct = Math.round((indice / TOTAL) * 100);
        document.getElementById('sm-progreso-zona').innerHTML = `<div class="sm-progreso-texto">Rescate ${Math.min(indice + 1, TOTAL)}/${TOTAL}</div>
          <div class="sm-progreso-barra"><span style="width:${pct}%"></span></div>`;
        const vidas = MAX_ERR + 1 - errores;
        document.getElementById('sm-vidas-chip').innerHTML = '❤️'.repeat(Math.max(0, vidas)) + '🖤'.repeat(Math.min(MAX_ERR + 1, errores));
      }

      function renderPregunta() {
        respondiendo = false;
        buffer = '';
        pregunta = SM.generadores.generar('tablas', { rango: [2, 3, 4, 5, 6, 7, 8, 9] });
        document.getElementById('sm-pregunta-zona').innerHTML = `
          ${SM.mascota.svg('feliz', 'sm-mascota-media sm-mascota-chica')}
          <div class="sm-pregunta-card"><p class="sm-pregunta-texto">${esc(pregunta.enunciado)}</p></div>
          <div class="sm-numero-zona">
            <div class="sm-numero-display" id="sm-numero-display">&nbsp;</div>
            <div class="sm-teclado">
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button class="sm-tecla" data-tecla="${d}">${d}</button>`).join('')}
              <button class="sm-tecla" data-tecla="borrar">⌫</button>
              <button class="sm-tecla" data-tecla="0">0</button>
              <button class="sm-tecla sm-tecla-ok" data-tecla="ok">✓</button>
            </div>
          </div>
          <div id="sm-feedback-zona"></div>`;
        root.querySelectorAll('.sm-tecla').forEach((btn) => {
          btn.addEventListener('click', () => {
            if (respondiendo) return;
            const t = btn.dataset.tecla;
            if (t === 'borrar') buffer = buffer.slice(0, -1);
            else if (t === 'ok') { if (buffer !== '') responder(buffer); return; }
            else if (buffer.length < 4) buffer += t;
            document.getElementById('sm-numero-display').textContent = buffer || ' ';
          });
        });
        renderProgreso();
      }

      function responder(valor) {
        respondiendo = true;
        const correcta = String(Number(valor)) === String(pregunta.respuesta);
        if (!correcta) errores += 1;
        SM.sonido[correcta ? 'acierto' : 'error']();
        indice += 1;
        root.querySelectorAll('.sm-tecla').forEach((b) => { b.disabled = true; });
        renderProgreso();
        const seAcabo = errores > MAX_ERR || indice >= TOTAL;
        const quedan = MAX_ERR - errores;
        const mensaje = correcta
          ? SM.mascota.frase('acierto', { nombre: esc(caja.estado.nombre) })
          : (errores > MAX_ERR ? '¡Uy! Ese fue el tercer error.' : `Era ${pregunta.respuesta}. ${quedan === 0 ? '¡Ya no puedes fallar más!' : `Te queda ${quedan} error permitido.`}`);
        document.getElementById('sm-feedback-zona').innerHTML = `
          <div class="sm-feedback-panel ${correcta ? 'correcta' : 'incorrecta'}">
            <p>${esc(mensaje)}</p>
            ${!correcta ? `<p class="sm-explicacion">${esc(pregunta.explicacion)}</p>` : ''}
            <button class="btn" data-accion="continuar">${seAcabo ? 'Ver resultado 🛟' : 'Siguiente →'}</button>
          </div>`;
        document.querySelector('#sm-feedback-zona [data-accion="continuar"]').addEventListener('click', () => {
          SM.sonido.click();
          if (seAcabo) finalizar(); else renderPregunta();
        });
      }

      function finalizar() {
        if (terminado) return;
        terminado = true;
        const r = SM.progreso.terminarRescate(caja.estado, errores);
        const aciertos = Math.max(0, indice - Math.min(errores, indice));
        root.innerHTML = `<div class="sm-pantalla sm-pantalla-resultado">
          <div id="sm-confeti-zona" class="sm-confeti-zona"></div>
          ${SM.mascota.svg(r.exito ? 'celebrando' : 'consolando', 'sm-mascota-media')}
          <h1>${r.exito ? '🔥 ¡Racha rescatada!' : '💔 Esta vez no se pudo'}</h1>
          ${r.exito
            ? `<p>¡Lo lograste, ${esc(caja.estado.nombre)}! Tu racha vuelve a <b>${r.dias} día${r.dias === 1 ? '' : 's'}</b>. Ahora cumple el reto de hoy para que siga creciendo.</p>`
            : `<p>Tu racha empieza de nuevo desde 0. ¡Pero hoy mismo puedes encender una nueva ganando ${caja.estado.metaDiariaXP} XP! Cosmo cree en ti.</p>`}
          <div class="sm-stats-fila sm-centrado">
            <div class="sm-stat-chip">✅ ${aciertos}/${indice}</div>
            <div class="sm-stat-chip">❌ ${Math.min(errores, indice)} error${Math.min(errores, indice) === 1 ? '' : 'es'}</div>
          </div>
          ${r.logrosNuevos.length ? `<div class="sm-logros-nuevos">${r.logrosNuevos.map((l) => `
            <div class="sm-logro-chip">${l.icono} <b>${esc(l.nombre)}</b><br><small>${esc(l.descripcion)}</small></div>`).join('')}</div>` : ''}
          ${r.metasNuevas.length ? `<div class="sm-logros-nuevos">${r.metasNuevas.map((m) => `
            <div class="sm-logro-chip sm-meta-chip">${m.emoji} ¡Meta alcanzada! <b>${esc(m.nombre)}</b><br><small>Pídesela a papá o mamá 🎉</small></div>`).join('')}</div>` : ''}
          <div class="sm-resultado-botones">
            <button class="btn" data-accion="inicio">🚀 Ir al inicio</button>
          </div>
        </div>`;
        root.querySelector('[data-accion="inicio"]').addEventListener('click', () => { SM.sonido.click(); ir('inicio'); });
        if (r.exito) {
          lanzarConfeti(document.getElementById('sm-confeti-zona'));
          setTimeout(() => SM.sonido.rachaSubida(), 250);
        } else {
          SM.sonido.derrota();
        }
      }

      renderPregunta();
    }
  }

  // Refresca la cuenta regresiva cada 30 s. Si la app sigue abierta al pasar la
  // medianoche, cierra el día (misma regla de siempre en `actualizarProgresoDiario`)
  // y vuelve a pintar Inicio para que el widget arranque el día nuevo.
  function arrancarCuentaRegresivaRacha(root, caja, ir) {
    const fechaPintada = SM.progreso.hoyISO();
    intervaloRachaWidget = setInterval(() => {
      if (SM.progreso.hoyISO() !== fechaPintada) {
        caja.estado = SM.progreso.actualizarProgresoDiario(caja.estado);
        ir('inicio');
        return;
      }
      const el = root.querySelector('#sm-rw-tiempo');
      if (!el) return;
      const t = textoTiempoRestante();
      el.textContent = t.texto;
      const widget = root.querySelector('.sm-racha-widget');
      if (widget && caja.estado.racha.dias > 0 && t.min <= 240) widget.classList.add('peligro');
    }, 30000);
  }

  // ==================== MUNDO (selección de nivel) ====================
  function pantallaMundo(root, caja, mundoId, ir) {
    detenerIntervalo();
    const estado = caja.estado;
    const mundo = SM.mundos.obtener(mundoId);
    const { obtenidas, maximo } = SM.progreso.estrellasMundo(estado, mundoId);

    const nivelesRegulares = mundo.niveles.filter((n) => !n.esQuiz);
    const nivelQuiz = mundo.niveles.find((n) => n.esQuiz);

    let yaMarcoActual = false;
    const nodos = nivelesRegulares.map((nivel, idx) => {
      const estrellas = estado.estrellas[`${mundoId}:${nivel.id}`] || 0;
      const desbloqueado = SM.progreso.nivelDesbloqueado(estado, mundoId, nivel.id);
      const esActual = desbloqueado && estrellas === 0 && !yaMarcoActual;
      if (esActual) yaMarcoActual = true;
      const icono = nivel.contrarreloj ? '⏱️' : '📍';
      const conector = idx > 0 ? `<div class="sm-nivel-conector ${desbloqueado ? 'activo' : ''}"></div>` : '';
      return `${conector}<div class="sm-nivel-fila">
        <button class="sm-nivel-nodo ${desbloqueado ? '' : 'bloqueado'} ${esActual ? 'actual' : ''}" data-nivel="${nivel.id}" ${desbloqueado ? '' : 'disabled'}>
          <span class="sm-nivel-icono">${desbloqueado ? icono : '🔒'}</span>
          <span class="sm-nivel-info">
            <span class="sm-nivel-nombre">${esc(nivel.nombre)}</span>
            <span class="sm-nivel-fila-meta">${estrellasHTML(estrellas)}${dificultadHTML(nivel.dificultad)}</span>
            ${desbloqueado ? '' : `<small class="sm-nivel-llave">🔑 Gana ⭐ en el nivel anterior o llega a ${SM.progreso.xpParaNivel(idx).toLocaleString('es-CO')} XP (faltan ${(SM.progreso.xpParaNivel(idx) - estado.xp).toLocaleString('es-CO')})</small>`}
          </span>
        </button>
        ${estrellas > 0 ? `<button class="sm-btn-reset-nivel" data-reset-nivel="${nivel.id}" title="Reiniciar este nivel para practicar de nuevo">↺</button>` : ''}
      </div>`;
    }).join('');

    const estrellasQuiz = nivelQuiz ? (estado.estrellas[`${mundoId}:quiz`] || 0) : 0;
    const quizHTML = nivelQuiz ? `<div class="sm-nivel-fila">
        <button class="sm-nivel-nodo sm-quiz-nodo" data-nivel="quiz">
          <span class="sm-nivel-icono">🏆</span>
          <span class="sm-nivel-info">
            <span class="sm-nivel-nombre">${esc(nivelQuiz.nombre)}</span>
            <span class="sm-nivel-fila-meta">${estrellasHTML(estrellasQuiz)}${dificultadHTML(nivelQuiz.dificultad)}</span>
            <span class="sm-quiz-nota">${estrellasQuiz >= 1 ? '✅ Aprobado — ¡inténtalo de nuevo por más estrellas!' : 'Reto opcional · mezcla todo · necesitas 85% o más para aprobar'}</span>
          </span>
        </button>
        ${estrellasQuiz > 0 ? `<button class="sm-btn-reset-nivel" data-reset-nivel="quiz" title="Reiniciar el quiz para practicar de nuevo">↺</button>` : ''}
      </div>` : '';

    root.innerHTML = `<div class="sm-pantalla" style="--color-planeta:${mundo.color}">
      <header class="sm-header-mundo">
        <button class="sm-btn-icono" data-accion="volver">←</button>
        <div>
          <h1>${mundo.emoji} ${esc(mundo.nombre)}</h1>
          <p class="sm-muted">${esc(mundo.subtitulo)} · ⭐ ${obtenidas}/${maximo}</p>
        </div>
        <button class="sm-btn-icono" data-accion="reiniciar-planeta" title="Reiniciar todo este planeta">🔄</button>
      </header>
      <button class="btn sm-btn-leccion" data-accion="leccion">📘 Ver lección</button>
      ${mundoId === 'tablix' ? '<button class="btn" style="margin-bottom:14px" data-accion="centro-tablas">🧠 Centro de entrenamiento de tablas</button>' : ''}
      <div class="sm-niveles-lista">${nodos}</div>
      <div class="sm-quiz-zona">${quizHTML}</div>
    </div>`;

    root.querySelector('[data-accion="volver"]').addEventListener('click', () => { SM.sonido.click(); ir('inicio'); });
    root.querySelector('[data-accion="leccion"]').addEventListener('click', () => { SM.sonido.click(); ir('leccion', { mundoId }); });
    const btnCentroTablas = root.querySelector('[data-accion="centro-tablas"]');
    if (btnCentroTablas) btnCentroTablas.addEventListener('click', () => { SM.sonido.click(); ir('centro-tablas'); });
    root.querySelector('[data-accion="reiniciar-planeta"]').addEventListener('click', () => {
      SM.sonido.click();
      confirmar(`¿Reiniciar todo ${mundo.nombre}? Se perderán las estrellas de sus ${mundo.niveles.length} niveles y se vuelven a bloquear.`, 'Reiniciar planeta', () => {
        SM.progreso.resetearPlaneta(estado, mundoId);
        pantallaMundo(root, caja, mundoId, ir);
      });
    });
    root.querySelectorAll('.sm-nivel-nodo[data-nivel]:not([disabled])').forEach((btn) => {
      btn.addEventListener('click', () => {
        SM.sonido.click();
        const idAtributo = btn.dataset.nivel;
        ir('juego', { mundoId, nivelId: idAtributo === 'quiz' ? 'quiz' : Number(idAtributo) });
      });
    });
    root.querySelectorAll('[data-reset-nivel]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        SM.sonido.click();
        const idAtributo = btn.dataset.resetNivel;
        const nivelId = idAtributo === 'quiz' ? 'quiz' : Number(idAtributo);
        const nivel = SM.mundos.obtenerNivel(mundoId, nivelId);
        confirmar(`¿Reiniciar "${nivel.nombre}" para practicarlo de nuevo? Perderás sus estrellas.`, 'Reiniciar', () => {
          SM.progreso.resetearNivel(estado, mundoId, nivelId);
          pantallaMundo(root, caja, mundoId, ir);
        });
      });
    });
  }

  // ==================== LECCIÓN ====================
  function pantallaLeccion(root, caja, mundoId, ir) {
    detenerIntervalo();
    const mundo = SM.mundos.obtener(mundoId);
    const leccion = SM.lecciones.obtener(mundoId);
    let paso = 0;

    root.innerHTML = `<div class="sm-pantalla" style="--color-planeta:${mundo.color}">
      <header class="sm-header-mundo">
        <button class="sm-btn-icono" data-accion="volver">✕</button>
        <div><h1>${mundo.emoji} ${esc(leccion.titulo)}</h1></div>
      </header>
      <div id="sm-leccion-cuerpo"></div>
    </div>`;
    root.querySelector('[data-accion="volver"]').addEventListener('click', () => { SM.sonido.click(); ir('mundo', { mundoId }); });

    function render() {
      const p = leccion.pasos[paso];
      const esUltimo = paso === leccion.pasos.length - 1;
      const puntos = leccion.pasos.map((_, i) => `<span class="sm-punto ${i === paso ? 'activo' : ''}"></span>`).join('');
      const cuerpo = document.getElementById('sm-leccion-cuerpo');
      cuerpo.innerHTML = `
        <div class="sm-leccion-tarjeta">
          ${SM.mascota.svg(esUltimo ? 'animando' : 'pensando', 'sm-mascota-media sm-mascota-chica')}
          <h2>${esc(p.titulo)}</h2>
          <p>${esc(p.texto)}</p>
          ${p.visual ? `<div class="sm-leccion-visual">${p.visual}</div>` : ''}
        </div>
        <div class="sm-puntos-fila">${puntos}</div>
        <div class="sm-leccion-botones">
          <button class="btn btn-sec" data-accion="anterior" ${paso === 0 ? 'disabled' : ''}>← Anterior</button>
          <button class="btn" data-accion="siguiente">${esUltimo ? '¡A practicar! 🚀' : 'Siguiente →'}</button>
        </div>`;
      cuerpo.querySelector('[data-accion="anterior"]').addEventListener('click', () => { SM.sonido.click(); paso = Math.max(0, paso - 1); render(); });
      cuerpo.querySelector('[data-accion="siguiente"]').addEventListener('click', () => {
        SM.sonido.click();
        if (esUltimo) {
          SM.progreso.marcarLeccionVista(caja.estado, mundoId);
          ir('mundo', { mundoId });
        } else { paso += 1; render(); }
      });
    }
    render();
  }

  // ==================== CENTRO DE TABLAS (hub) ====================
  function pantallaCentroTablas(root, caja, ir) {
    detenerIntervalo();
    const estado = caja.estado;
    const resumen = SM.progreso.resumenDominioTablas(estado);

    let bannerExamen = '';
    if (estado.examenTablas && estado.examenTablas.fecha) {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const fechaExamen = new Date(`${estado.examenTablas.fecha}T00:00:00`);
      const dias = Math.round((fechaExamen - hoy) / 86400000);
      const nota = esc(estado.examenTablas.nota || 'tu examen');
      let texto;
      if (dias > 1) texto = `📅 Faltan <b>${dias} días</b> para: ${nota} — ¡vamos a lograrlo!`;
      else if (dias === 1) texto = `📅 ¡Mañana es el día! ${nota} — un último empujón 💪`;
      else if (dias === 0) texto = `📅 ¡Hoy es el día! ${nota} — tú puedes, Santi 🚀`;
      else texto = `✅ Ya diste ${nota} — ¡sigue practicando para no perder lo aprendido!`;
      bannerExamen = `<div class="sm-reto-diario"><span class="sm-reto-diario-emoji">📅</span><div class="sm-meta-mini-info"><span>${texto}</span></div></div>`;
    }

    const plan = estado.planTablas || [false, false, false, false, false];
    const PLAN_DIAS = [
      { titulo: 'Día 1 — Las fáciles y los trucos', detalle: 'Ve la lección de trucos, y practica 2, 5 y 10 con Minuto Loco.' },
      { titulo: 'Día 2 — Dobles y la manito del 9', detalle: 'Minuto Loco de las tablas 4, 8 y 9 (usa el truco de los dedos).' },
      { titulo: 'Día 3 — Las difíciles: 6 y 7', detalle: 'Minuto Loco de 6 y 7, y una tanda de Tarjetas Rápidas.' },
      { titulo: 'Día 4 — Todo mezclado', detalle: 'Tarjetas Rápidas + Contrarreloj de Tablix + un juego de Arcade.' },
      { titulo: 'Día 5 — Repaso final', detalle: 'Quiz Final de Tablix y Conteo Salteado de las tablas que más te cuesten.' },
    ];
    const planHTML = PLAN_DIAS.map((d, i) => `
      <label class="sm-plan-dia ${plan[i] ? 'hecho' : ''}">
        <input type="checkbox" data-plan="${i}" ${plan[i] ? 'checked' : ''}>
        <span><b>${esc(d.titulo)}</b><br><small class="sm-muted">${esc(d.detalle)}</small></span>
      </label>`).join('');

    const mapaHTML = resumen.porTabla.map((t) => {
      const nivel = t.pct >= 80 ? 'alto' : t.pct >= 40 ? 'medio' : 'bajo';
      return `<div class="sm-mapa-celda sm-mapa-${nivel}"><b>${t.tabla}</b><small>${t.pct}%</small></div>`;
    }).join('');

    root.innerHTML = `<div class="sm-pantalla" style="--color-planeta:#4fd1ff">
      <header class="sm-header-mundo">
        <button class="sm-btn-icono" data-accion="volver">←</button>
        <div><h1>🧠 Centro de Tablas</h1><p class="sm-muted">Métodos extra para dominar las tablas rápido</p></div>
      </header>
      ${bannerExamen}
      <div class="sm-stats-fila sm-centrado">
        <div class="sm-stat-chip">🧠 ${resumen.dominadas}/${resumen.total} hechos dominados (${resumen.pct}%)</div>
      </div>
      <div class="sm-arcade-lista" style="margin:14px 0">
        <button class="sm-arcade-card" data-ir="flashcards-tablas">
          <span class="sm-arcade-emoji">🃏</span>
          <h2>Tarjetas Rápidas</h2>
          <p>Repaso inteligente: pregunta más las que se te olvidan, y menos las que ya dominas.</p>
          <div class="btn">▶️ Practicar 15 tarjetas</div>
        </button>
        <button class="sm-arcade-card" data-ir="elegir-tabla-minuto">
          <span class="sm-arcade-emoji">⏱️</span>
          <h2>Minuto Loco</h2>
          <p>Elige una tabla y entrénala sola, a contrarreloj, hasta que te salga sin pensar.</p>
          <div class="btn">▶️ Elegir tabla</div>
        </button>
        <button class="sm-arcade-card" data-ir="elegir-tabla-conteo">
          <span class="sm-arcade-emoji">🔢</span>
          <h2>Conteo Salteado</h2>
          <p>Memoriza la secuencia de cada tabla (2, 4, 6, 8...) para completarla sin calcular.</p>
          <div class="btn">▶️ Elegir tabla</div>
        </button>
      </div>
      <h2 style="margin-top:6px">🗺️ Tu mapa de tablas</h2>
      <p class="sm-muted" style="margin-bottom:8px">Verde = dominada, amarillo = casi, rojo = a practicar. Se llena jugando Tarjetas Rápidas y Minuto Loco.</p>
      <div class="sm-mapa-tablas">${mapaHTML}</div>
      <h2 style="margin-top:16px">🗓️ Plan de 5 días</h2>
      <div class="sm-plan-lista">${planHTML}</div>
    </div>`;

    root.querySelector('[data-accion="volver"]').addEventListener('click', () => { SM.sonido.click(); ir('mundo', { mundoId: 'tablix' }); });
    root.querySelector('[data-ir="flashcards-tablas"]').addEventListener('click', () => { SM.sonido.click(); ir('flashcards-tablas'); });
    root.querySelector('[data-ir="elegir-tabla-minuto"]').addEventListener('click', () => { SM.sonido.click(); ir('elegir-tabla', { modo: 'minuto' }); });
    root.querySelector('[data-ir="elegir-tabla-conteo"]').addEventListener('click', () => { SM.sonido.click(); ir('elegir-tabla', { modo: 'conteo' }); });
    root.querySelectorAll('[data-plan]').forEach((chk) => {
      chk.addEventListener('change', () => { SM.sonido.click(); SM.progreso.togglePlanTablas(estado, Number(chk.dataset.plan)); });
    });
  }

  // ==================== CENTRO DE TABLAS: elegir tabla (Minuto Loco / Conteo) ====================
  function pantallaElegirTablaEntreno(root, caja, ir, modo) {
    detenerIntervalo();
    const estado = caja.estado;
    const resumen = SM.progreso.resumenDominioTablas(estado);
    const esMinuto = modo === 'minuto';
    const tarjetas = resumen.porTabla.map((t) => `<button class="sm-tabla-elegir-card" data-tabla="${t.tabla}">
        <span class="sm-tabla-elegir-num">${t.tabla}</span>
        <span class="sm-tabla-elegir-info">
          <span class="sm-tabla-elegir-dominio">${t.dominadas}/12 dominadas</span>
          <span class="sm-planeta-barra"><span style="width:${t.pct}%"></span></span>
          <small class="sm-muted">${esc(SM.tablasCentro.TRUCOS[t.tabla] || '')}</small>
        </span>
      </button>`).join('');

    root.innerHTML = `<div class="sm-pantalla">
      <header class="sm-header-mundo">
        <button class="sm-btn-icono" data-accion="volver">←</button>
        <div><h1>${esMinuto ? '⏱️ Minuto Loco' : '🔢 Conteo Salteado'}</h1>
        <p class="sm-muted">${esMinuto ? 'Elige una tabla y entrénala a fondo, cronometrada' : 'Elige una tabla para practicar su secuencia'}</p></div>
      </header>
      <div class="sm-tabla-elegir-lista">${tarjetas}</div>
    </div>`;
    root.querySelector('[data-accion="volver"]').addEventListener('click', () => { SM.sonido.click(); ir('centro-tablas'); });
    root.querySelectorAll('[data-tabla]').forEach((btn) => {
      btn.addEventListener('click', () => {
        SM.sonido.click();
        ir(esMinuto ? 'minuto-loco' : 'conteo-tablas', { tabla: Number(btn.dataset.tabla) });
      });
    });
  }

  // ==================== CENTRO DE TABLAS: sesión genérica ====================
  // Minuto Loco, Tarjetas Rápidas y Conteo Salteado (SM.tablasCentro) comparten la
  // misma forma de sesión, así que se pintan con un único renderer en vez de
  // triplicar pantallaJuego. `esContrarreloj` se detecta por si la sesión trae
  // tick() (Minuto Loco) — si no, es de N preguntas fijas (numeroPregunta/total).
  function pantallaSesionTablas(root, caja, ir, sesion, opciones) {
    detenerIntervalo();
    const estado = caja.estado;
    const esContrarreloj = typeof sesion.tick === 'function';
    let respondiendo = false;
    let buffer = '';
    let relojPausado = false;
    SM.sonido.inicioNivel();

    function salir() {
      detenerIntervalo();
      confirmar('¿Salir de este entrenamiento? Perderás el progreso de este intento.', 'Salir', () => ir(opciones.volverA.pantalla, opciones.volverA.datos));
    }

    root.innerHTML = `<div class="sm-pantalla sm-pantalla-juego">
      <header class="sm-barra-superior">
        <button class="sm-btn-icono" data-accion="salir">✕</button>
        <div class="sm-progreso-zona" id="sm-progreso-zona"></div>
        <div class="sm-racha-chip" id="sm-racha-chip"></div>
      </header>
      <p class="sm-muted" style="text-align:center;margin-bottom:6px">${esc(opciones.subtitulo)}</p>
      <div id="sm-pregunta-zona"></div>
    </div>`;
    root.querySelector('[data-accion="salir"]').addEventListener('click', salir);

    function renderProgreso() {
      const zona = document.getElementById('sm-progreso-zona');
      if (esContrarreloj) {
        const t = sesion.tiempoRestante();
        zona.innerHTML = `<div class="sm-timer ${t <= 10 ? 'urgente' : ''}">⏱️ ${t}s</div>`;
      } else {
        const n = sesion.numeroPregunta(), total = sesion.totalPreguntas();
        const pct = Math.min(100, Math.round(((n - 1) / total) * 100));
        zona.innerHTML = `<div class="sm-progreso-texto">${Math.min(n, total)}/${total}</div>
          <div class="sm-progreso-barra"><span style="width:${pct}%"></span></div>`;
      }
      document.getElementById('sm-racha-chip').innerHTML = sesion.racha() >= 2 ? `🔥 ${sesion.racha()}` : '';
    }

    function renderPregunta() {
      respondiendo = false;
      buffer = '';
      const p = sesion.preguntaActual();
      const zona = document.getElementById('sm-pregunta-zona');
      zona.innerHTML = `
        ${SM.mascota.svg('feliz', 'sm-mascota-media sm-mascota-chica')}
        <div class="sm-pregunta-card"><p class="sm-pregunta-texto">${esc(p.enunciado)}</p></div>
        <button class="sm-btn-profesor" data-accion="explicar">🤖 ¿Cómo se resuelve?</button>
        <div class="sm-numero-zona">
          <div class="sm-numero-display" id="sm-numero-display">&nbsp;</div>
          <div class="sm-teclado">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button class="sm-tecla" data-tecla="${d}">${d}</button>`).join('')}
            <button class="sm-tecla" data-tecla="borrar">⌫</button>
            <button class="sm-tecla" data-tecla="0">0</button>
            <button class="sm-tecla sm-tecla-ok" data-tecla="ok">✓</button>
          </div>
        </div>
        <div id="sm-feedback-zona"></div>`;

      zona.querySelector('[data-accion="explicar"]').addEventListener('click', () => {
        SM.sonido.click();
        relojPausado = true;
        mostrarExplicacion('tablix', () => { relojPausado = false; });
      });
      zona.querySelectorAll('.sm-tecla').forEach((btn) => {
        btn.addEventListener('click', () => {
          const t = btn.dataset.tecla;
          if (respondiendo) return;
          if (t === 'borrar') buffer = buffer.slice(0, -1);
          else if (t === 'ok') { if (buffer !== '') manejarRespuesta(buffer); return; }
          else if (buffer.length < 4) buffer += t;
          document.getElementById('sm-numero-display').textContent = buffer || ' ';
        });
      });
      renderProgreso();
    }

    function mostrarPopupPuntos(racha) {
      const zona = root.querySelector('.sm-pregunta-card');
      if (!zona) return;
      const multiplicador = Math.max(1, Math.min(racha, 5));
      const popup = document.createElement('div');
      popup.className = 'sm-puntos-popup';
      popup.textContent = racha >= 2 ? `+${5 * multiplicador} · combo x${multiplicador}` : '+5';
      zona.appendChild(popup);
      setTimeout(() => popup.remove(), 900);
    }

    function manejarRespuesta(valor) {
      if (respondiendo) return;
      respondiendo = true;
      const r = sesion.responder(valor, estado);
      SM.sonido[r.correcta ? 'acierto' : 'error']();
      if (r.correcta) mostrarPopupPuntos(r.racha);
      root.querySelectorAll('.sm-tecla').forEach((b) => { b.disabled = true; });
      const mensaje = r.correcta
        ? SM.mascota.frase(r.racha >= 3 ? 'racha' : 'acierto', { n: r.racha })
        : SM.mascota.frase('error', { respuesta: r.respuestaCorrecta });
      document.getElementById('sm-feedback-zona').innerHTML = `
        <div class="sm-feedback-panel ${r.correcta ? 'correcta' : 'incorrecta'}">
          <p>${esc(mensaje)}</p>
          <button class="btn" data-accion="continuar">${sesion.terminada() ? 'Ver resultados 🚀' : 'Siguiente →'}</button>
        </div>`;
      document.getElementById('sm-feedback-zona').querySelector('[data-accion="continuar"]').addEventListener('click', () => {
        SM.sonido.click();
        if (sesion.terminada()) { mostrarResultados(); return; }
        sesion.avanzar();
        renderPregunta();
      });
      renderProgreso();
    }

    function mostrarResultados() {
      detenerIntervalo();
      const r = sesion.finalizar(estado);
      const mensaje = SM.mascota.frase(`resultado${r.estrellas}`, { nombre: esc(estado.nombre) });
      const titulo = r.estrellas === 3 ? '¡Entrenamiento perfecto!' : (r.estrellas >= 1 ? '¡Buen entrenamiento!' : '¡Sigue practicando!');

      root.innerHTML = `<div class="sm-pantalla sm-pantalla-resultado">
        <div id="sm-confeti-zona" class="sm-confeti-zona"></div>
        ${SM.mascota.svg(r.estrellas >= 1 ? 'celebrando' : 'consolando', 'sm-mascota-media')}
        <h1>${titulo}</h1>
        <div class="sm-resultado-estrellas">${estrellasHTML(r.estrellas)}</div>
        <p>${mensaje}</p>
        <div class="sm-stats-fila sm-centrado">
          <div class="sm-stat-chip">✅ ${r.correctas}/${r.total}</div>
          <div class="sm-stat-chip">✨ +${r.xpGanado} XP</div>
        </div>
        ${r.retoCumplidoAhora ? `<div class="sm-logros-nuevos"><div class="sm-logro-chip sm-reto-chip">🎯 ¡Reto diario cumplido! <b>Racha: ${estado.racha.dias} 🔥</b></div></div>` : ''}
        ${r.logrosNuevos.length ? `<div class="sm-logros-nuevos">${r.logrosNuevos.map((l) => `
          <div class="sm-logro-chip">${l.icono} <b>${esc(l.nombre)}</b><br><small>${esc(l.descripcion)}</small></div>`).join('')}</div>` : ''}
        ${r.metasNuevas.length ? `<div class="sm-logros-nuevos">${r.metasNuevas.map((m) => `
          <div class="sm-logro-chip sm-meta-chip">${m.emoji} ¡Meta alcanzada! <b>${esc(m.nombre)}</b><br><small>Pídesela a papá o mamá 🎉</small></div>`).join('')}</div>` : ''}
        <div class="sm-resultado-botones">
          <button class="btn btn-sec" data-accion="reintentar">🔁 Reintentar</button>
          <button class="btn btn-sec" data-accion="volver">${esc(opciones.volverA.texto || '🗺️ Volver')}</button>
        </div>
      </div>`;

      SM.sonido.nivelCompletado(r.estrellas);
      if (r.estrellas === 3) lanzarConfeti(document.getElementById('sm-confeti-zona'));
      if (r.metasNuevas.length) setTimeout(() => SM.sonido.metaAlcanzada(), 350);
      else if (r.retoCumplidoAhora) setTimeout(() => SM.sonido.rachaSubida(), 350);
      else if (r.logrosNuevos.length) setTimeout(() => SM.sonido.logro(), 350);

      root.querySelector('[data-accion="reintentar"]').addEventListener('click', () => { SM.sonido.click(); opciones.reintentar(); });
      root.querySelector('[data-accion="volver"]').addEventListener('click', () => { SM.sonido.click(); ir(opciones.volverA.pantalla, opciones.volverA.datos); });
    }

    renderPregunta();
    if (esContrarreloj) {
      intervaloJuego = setInterval(() => {
        if (relojPausado) return;
        const termino = sesion.tick();
        renderProgreso();
        if (termino) mostrarResultados();
      }, 1000);
    }
  }

  function pantallaMinutoLoco(root, caja, ir, tabla) {
    const iniciar = () => {
      const sesion = SM.tablasCentro.crearSesionMinutoLoco(tabla, 60);
      pantallaSesionTablas(root, caja, ir, sesion, {
        subtitulo: `⏱️ Minuto Loco — tabla del ${tabla}`,
        volverA: { pantalla: 'elegir-tabla', datos: { modo: 'minuto' }, texto: '🗺️ Elegir otra tabla' },
        reintentar: iniciar,
      });
    };
    iniciar();
  }

  function pantallaFlashcardsTablas(root, caja, ir) {
    const iniciar = () => {
      const sesion = SM.tablasCentro.crearSesionFlashcards(caja.estado, 15);
      pantallaSesionTablas(root, caja, ir, sesion, {
        subtitulo: '🃏 Tarjetas Rápidas — las que más te cuestan primero',
        volverA: { pantalla: 'centro-tablas', datos: {}, texto: '🧠 Volver al Centro de Tablas' },
        reintentar: iniciar,
      });
    };
    iniciar();
  }

  function pantallaConteoTablas(root, caja, ir, tabla) {
    const iniciar = () => {
      const sesion = SM.tablasCentro.crearSesionConteo(tabla, 8);
      pantallaSesionTablas(root, caja, ir, sesion, {
        subtitulo: `🔢 Conteo Salteado — tabla del ${tabla}`,
        volverA: { pantalla: 'elegir-tabla', datos: { modo: 'conteo' }, texto: '🗺️ Elegir otra tabla' },
        reintentar: iniciar,
      });
    };
    iniciar();
  }

  // ==================== JUEGO ====================
  function pantallaJuego(root, caja, mundoId, nivelId, ir) {
    detenerIntervalo();
    const sesion = SM.juego.crearSesion(mundoId, nivelId, caja.estado.desafio);
    const mundo = sesion.mundo;
    let buffer = '';
    let respondiendo = false;
    SM.sonido.inicioNivel();

    function salir() {
      detenerIntervalo();
      confirmar('¿Salir de la misión? Perderás el progreso de este intento.', 'Salir', () => ir('mundo', { mundoId }));
    }

    root.innerHTML = `<div class="sm-pantalla sm-pantalla-juego" style="--color-planeta:${mundo.color}">
      <header class="sm-barra-superior">
        <button class="sm-btn-icono" data-accion="salir">✕</button>
        <div class="sm-progreso-zona" id="sm-progreso-zona"></div>
        <div class="sm-vidas-chip" id="sm-vidas-chip"></div>
        <div class="sm-racha-chip" id="sm-racha-chip"></div>
      </header>
      <div id="sm-pregunta-zona"></div>
    </div>`;
    root.querySelector('[data-accion="salir"]').addEventListener('click', salir);

    function renderProgreso() {
      const zona = document.getElementById('sm-progreso-zona');
      if (sesion.esContrarreloj) {
        const t = sesion.tiempoRestante();
        zona.innerHTML = `<div class="sm-timer ${t <= 10 ? 'urgente' : ''}">⏱️ ${t}s</div>`;
      } else {
        const n = sesion.numeroPregunta(), total = sesion.totalPreguntas();
        const pct = Math.min(100, Math.round(((n - 1) / total) * 100));
        zona.innerHTML = `<div class="sm-progreso-texto">Pregunta ${Math.min(n, total)}/${total}</div>
          <div class="sm-progreso-barra"><span style="width:${pct}%"></span></div>`;
      }
      const racha = document.getElementById('sm-racha-chip');
      racha.innerHTML = sesion.racha() >= 2 ? `🔥 ${sesion.racha()}` : '';

      const vidas = document.getElementById('sm-vidas-chip');
      const restantes = sesion.erroresRestantes();
      vidas.innerHTML = restantes == null ? '' : '❤️'.repeat(restantes) + '🖤'.repeat(sesion.erroresPermitidos - restantes);
    }

    function iniciarTemporizadorPregunta() {
      if (sesion.segundosPorPregunta == null) return;
      intervaloPregunta = setInterval(() => {
        const agotado = sesion.tickPregunta();
        const el = document.getElementById('sm-timer-pregunta');
        if (el) el.textContent = `⏱️ ${sesion.tiempoPregunta()}s`;
        if (agotado) {
          clearInterval(intervaloPregunta); intervaloPregunta = null;
          manejarRespuesta('⏰-sin-respuesta-a-tiempo');
        }
      }, 1000);
    }
    function detenerTemporizadorPregunta() {
      if (intervaloPregunta) { clearInterval(intervaloPregunta); intervaloPregunta = null; }
    }

    function renderPregunta() {
      respondiendo = false;
      buffer = '';
      detenerTemporizadorPregunta();
      const p = sesion.preguntaActual();
      const zona = document.getElementById('sm-pregunta-zona');
      const cuerpoRespuesta = p.tipo === 'multiple'
        ? `<div class="sm-opciones">${p.opciones.map((op) => `<button class="sm-opcion-btn" data-valor="${esc(op)}">${esc(op)}</button>`).join('')}</div>`
        : `<div class="sm-numero-zona">
            <div class="sm-numero-display" id="sm-numero-display">&nbsp;</div>
            <div class="sm-teclado">
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button class="sm-tecla" data-tecla="${d}">${d}</button>`).join('')}
              <button class="sm-tecla" data-tecla="borrar">⌫</button>
              <button class="sm-tecla" data-tecla="0">0</button>
              <button class="sm-tecla sm-tecla-ok" data-tecla="ok">✓</button>
            </div>
          </div>`;
      zona.innerHTML = `
        ${SM.mascota.svg('feliz', 'sm-mascota-media sm-mascota-chica')}
        <div class="sm-pregunta-card">
          ${sesion.segundosPorPregunta != null ? `<div class="sm-timer-pregunta" id="sm-timer-pregunta">⏱️ ${sesion.tiempoPregunta()}s</div>` : ''}
          ${p.visual ? `<div class="sm-pregunta-visual">${p.visual}</div>` : ''}
          <p class="sm-pregunta-texto">${esc(p.enunciado)}</p>
        </div>
        <button class="sm-btn-profesor" data-accion="explicar">🤖 ¿Cómo se resuelve?</button>
        ${cuerpoRespuesta}
        <div id="sm-feedback-zona"></div>`;

      zona.querySelector('[data-accion="explicar"]').addEventListener('click', () => {
        SM.sonido.click();
        detenerRelojTemporalmente();
        detenerTemporizadorPregunta();
        mostrarExplicacion(mundoId, () => {
          reanudarRelojSiHaceFalta();
          if (!respondiendo) iniciarTemporizadorPregunta();
        });
      });

      if (p.tipo === 'multiple') {
        zona.querySelectorAll('.sm-opcion-btn').forEach((btn) => {
          btn.addEventListener('click', () => manejarRespuesta(btn.dataset.valor));
        });
      } else {
        zona.querySelectorAll('.sm-tecla').forEach((btn) => {
          btn.addEventListener('click', () => {
            const t = btn.dataset.tecla;
            if (respondiendo) return;
            if (t === 'borrar') buffer = buffer.slice(0, -1);
            else if (t === 'ok') { if (buffer !== '') manejarRespuesta(buffer); return; }
            else if (buffer.length < 6) buffer += t;
            document.getElementById('sm-numero-display').textContent = buffer || ' ';
          });
        });
      }
      renderProgreso();
      iniciarTemporizadorPregunta();
    }

    function mostrarPopupPuntos(racha) {
      const zona = root.querySelector('.sm-pregunta-card');
      if (!zona) return;
      const multiplicador = Math.max(1, Math.min(racha, 5));
      const popup = document.createElement('div');
      popup.className = 'sm-puntos-popup';
      popup.textContent = racha >= 2 ? `+${10 * multiplicador} · combo x${multiplicador}` : `+${10 * multiplicador}`;
      zona.appendChild(popup);
      setTimeout(() => popup.remove(), 900);
    }

    function manejarRespuesta(valor) {
      if (respondiendo) return;
      respondiendo = true;
      detenerTemporizadorPregunta();
      const r = sesion.responder(valor);
      SM.sonido[r.correcta ? 'acierto' : 'error']();
      if (r.correcta) mostrarPopupPuntos(r.racha);

      if (sesion.esContrarreloj) detenerRelojTemporalmente();

      const zonaOpciones = root.querySelector('.sm-opciones');
      if (zonaOpciones) {
        zonaOpciones.querySelectorAll('.sm-opcion-btn').forEach((btn) => {
          btn.disabled = true;
          if (btn.dataset.valor === String(r.respuestaCorrecta)) btn.classList.add('correcta');
          else if (btn.dataset.valor === String(valor)) btn.classList.add('incorrecta');
        });
      }
      root.querySelectorAll('.sm-tecla').forEach((b) => { b.disabled = true; });

      const mensaje = r.correcta
        ? SM.mascota.frase(r.racha >= 3 ? 'racha' : 'acierto', { n: r.racha })
        : SM.mascota.frase('error', { respuesta: r.respuestaCorrecta });
      document.getElementById('sm-feedback-zona').innerHTML = `
        <div class="sm-feedback-panel ${r.correcta ? 'correcta' : 'incorrecta'}">
          <p>${esc(mensaje)}</p>
          ${!r.correcta ? `<p class="sm-explicacion">${esc(r.explicacion)}</p>` : ''}
          <button class="btn" data-accion="continuar">${sesion.terminada() ? 'Ver resultados 🚀' : 'Siguiente →'}</button>
        </div>`;
      document.getElementById('sm-feedback-zona').querySelector('[data-accion="continuar"]').addEventListener('click', () => {
        SM.sonido.click();
        if (sesion.terminada()) { mostrarResultados(); return; }
        sesion.avanzar();
        renderPregunta();
        reanudarRelojSiHaceFalta();
      });
      renderProgreso();
    }

    let relojPausado = false;
    function detenerRelojTemporalmente() { relojPausado = true; }
    function reanudarRelojSiHaceFalta() { relojPausado = false; }

    function mostrarResultados() {
      detenerIntervalo();
      const r = sesion.finalizar(caja.estado);
      const siguienteNivel = SM.mundos.siguienteNivel(mundoId, nivelId);
      const puedeSeguir = siguienteNivel && SM.progreso.nivelDesbloqueado(caja.estado, mundoId, siguienteNivel.id);
      const mensaje = SM.mascota.frase(`resultado${r.estrellas}`, { nombre: esc(caja.estado.nombre) });
      let titulo;
      if (r.esQuiz) {
        titulo = r.aprobado ? (r.estrellas === 3 ? '🏆 ¡Quiz perfecto!' : '🏆 ¡Quiz aprobado!') : '🏆 Quiz no aprobado — ¡inténtalo de nuevo!';
      } else {
        titulo = r.estrellas === 3 ? '¡Misión perfecta!' : (r.estrellas >= 1 ? '¡Nivel superado!' : '¡Casi lo logras!');
      }

      root.innerHTML = `<div class="sm-pantalla sm-pantalla-resultado" style="--color-planeta:${mundo.color}">
        <div id="sm-confeti-zona" class="sm-confeti-zona"></div>
        ${SM.mascota.svg(r.estrellas >= 1 ? 'celebrando' : 'consolando', 'sm-mascota-media')}
        <h1>${titulo}</h1>
        <div class="sm-resultado-estrellas">${estrellasHTML(r.estrellas)}</div>
        ${r.esRecord ? '<p class="sm-record">🏅 ¡Nuevo récord en este nivel!</p>' : ''}
        <p>${mensaje}</p>
        <div class="sm-stats-fila sm-centrado">
          <div class="sm-stat-chip">✅ ${r.correctas}/${r.total}</div>
          <div class="sm-stat-chip">✨ +${r.xpGanado} XP</div>
        </div>
        ${r.retoCumplidoAhora ? `<div class="sm-logros-nuevos"><div class="sm-logro-chip sm-reto-chip">🎯 ¡Reto diario cumplido! <b>Racha: ${caja.estado.racha.dias} 🔥</b></div></div>` : ''}
        ${r.logrosNuevos.length ? `<div class="sm-logros-nuevos">${r.logrosNuevos.map((l) => `
          <div class="sm-logro-chip">${l.icono} <b>${esc(l.nombre)}</b><br><small>${esc(l.descripcion)}</small></div>`).join('')}</div>` : ''}
        ${r.metasNuevas.length ? `<div class="sm-logros-nuevos">${r.metasNuevas.map((m) => `
          <div class="sm-logro-chip sm-meta-chip">${m.emoji} ¡Meta alcanzada! <b>${esc(m.nombre)}</b><br><small>Pídesela a papá o mamá 🎉</small></div>`).join('')}</div>` : ''}
        <div class="sm-resultado-botones">
          <button class="btn btn-sec" data-accion="reintentar">🔁 Reintentar</button>
          ${puedeSeguir ? `<button class="btn" data-accion="siguiente">Siguiente nivel ➡️</button>` : ''}
          <button class="btn btn-sec" data-accion="mapa">🗺️ Volver al mapa</button>
        </div>
      </div>`;

      SM.sonido.nivelCompletado(r.estrellas);
      if (r.estrellas === 3) lanzarConfeti(document.getElementById('sm-confeti-zona'));
      if (r.metasNuevas.length) setTimeout(() => SM.sonido.metaAlcanzada(), 350);
      else if (r.retoCumplidoAhora) setTimeout(() => SM.sonido.rachaSubida(), 350);
      else if (r.logrosNuevos.length) setTimeout(() => SM.sonido.logro(), 350);

      root.querySelector('[data-accion="reintentar"]').addEventListener('click', () => { SM.sonido.click(); ir('juego', { mundoId, nivelId }); });
      root.querySelector('[data-accion="mapa"]').addEventListener('click', () => { SM.sonido.click(); ir('mundo', { mundoId }); });
      const btnSig = root.querySelector('[data-accion="siguiente"]');
      if (btnSig) btnSig.addEventListener('click', () => { SM.sonido.click(); ir('juego', { mundoId, nivelId: siguienteNivel.id }); });
    }

    renderPregunta();
    if (sesion.esContrarreloj) {
      intervaloJuego = setInterval(() => {
        if (relojPausado) return;
        const termino = sesion.tick();
        renderProgreso();
        if (termino) mostrarResultados();
      }, 1000);
    }
  }

  // Pantalla de resultados compartida por los 5 juegos de arcade: registra el
  // puntaje, celebra récord/logros/metas/reto diario, y ofrece reintentar o volver.
  // `porDerrota` = terminó por quedarse sin vidas (no en Memoria) — usa un sonido
  // más suave en vez de la fanfarria de siempre, nunca punitivo.
  function mostrarResultadoArcade(root, caja, ir, juegoId, idPantallaJuego, dificultadId, puntaje, comboMax, porDerrota) {
    const resultado = SM.progreso.registrarResultadoArcade(caja.estado, juegoId, dificultadId, puntaje);
    const perfilDif = SM.arcade.obtenerDificultad(dificultadId);
    root.innerHTML = `<div class="sm-pantalla sm-pantalla-resultado">
      <div id="sm-confeti-zona" class="sm-confeti-zona"></div>
      ${SM.mascota.svg(puntaje >= 100 ? 'celebrando' : 'feliz', 'sm-mascota-media')}
      <h1>¡Misión de arcade completada!</h1>
      <p class="sm-muted">${perfilDif.emoji} Dificultad ${esc(perfilDif.nombre)} · Puntaje final</p>
      <div class="sm-arcade-puntaje-final">${puntaje}</div>
      ${resultado.esRecord ? '<p class="sm-record">🏅 ¡Nuevo récord en esta dificultad!</p>' : ''}
      <div class="sm-stats-fila sm-centrado">
        <div class="sm-stat-chip">🔥 Mejor combo: <b>${comboMax}</b></div>
        <div class="sm-stat-chip">✨ +${resultado.xpGanado} XP</div>
      </div>
      ${resultado.retoCumplidoAhora ? `<div class="sm-logros-nuevos"><div class="sm-logro-chip sm-reto-chip">🎯 ¡Reto diario cumplido! <b>Racha: ${caja.estado.racha.dias} 🔥</b></div></div>` : ''}
      ${resultado.logrosNuevos.length ? `<div class="sm-logros-nuevos">${resultado.logrosNuevos.map((l) => `
        <div class="sm-logro-chip">${l.icono} <b>${esc(l.nombre)}</b><br><small>${esc(l.descripcion)}</small></div>`).join('')}</div>` : ''}
      ${resultado.metasNuevas.length ? `<div class="sm-logros-nuevos">${resultado.metasNuevas.map((m) => `
        <div class="sm-logro-chip sm-meta-chip">${m.emoji} ¡Meta alcanzada! <b>${esc(m.nombre)}</b><br><small>Pídesela a papá o mamá 🎉</small></div>`).join('')}</div>` : ''}
      <div class="sm-resultado-botones">
        <button class="btn btn-sec" data-accion="reintentar">🔁 Jugar de nuevo</button>
        <button class="btn btn-sec" data-accion="volver">🕹️ Volver al Arcade</button>
      </div>
    </div>`;
    if (porDerrota) SM.sonido.derrota();
    else SM.sonido.nivelCompletado(resultado.esRecord ? 3 : 1);
    if (resultado.esRecord) lanzarConfeti(document.getElementById('sm-confeti-zona'));
    if (resultado.metasNuevas.length) setTimeout(() => SM.sonido.metaAlcanzada(), 350);
    else if (resultado.retoCumplidoAhora) setTimeout(() => SM.sonido.rachaSubida(), 350);
    else if (resultado.logrosNuevos.length) setTimeout(() => SM.sonido.logro(), 350);
    root.querySelector('[data-accion="reintentar"]').addEventListener('click', () => { SM.sonido.click(); ir(idPantallaJuego, { dificultad: dificultadId }); });
    root.querySelector('[data-accion="volver"]').addEventListener('click', () => { SM.sonido.click(); ir('arcade'); });
  }

  // ==================== ARCADE (menú) ====================
  function pantallaArcade(root, caja, ir) {
    detenerIntervalo();
    const estado = caja.estado;
    const soloTablas = estado.modoSoloTablas;
    const tarjetas = SM.arcade.JUEGOS.map((j) => {
      const juegoStats = estado.arcade.juegos[j.id];
      const mejor = SM.progreso.mejorPuntajeJuego(juegoStats);
      // Modo enfoque: Escalera cambia de nombre/descripción porque su contenido
      // real cambia por completo (ver crearPartidaEscalera en arcade.js); los otros
      // 4 juegos mantienen su nombre — solo cambia QUÉ preguntan, no cómo se llaman.
      const nombre = (soloTablas && j.id === 'escalera') ? 'Escalera de Tablas' : j.nombre;
      const descripcion = (soloTablas && j.id === 'escalera')
        ? 'Aparecen varias multiplicaciones (como 7 × 8 y 6 × 9): calcúlalas y tócalas en orden, del resultado más chico al más grande.'
        : j.descripcion;
      return `<button class="sm-arcade-card" data-elegir="${j.id}">
        <span class="sm-arcade-emoji">${j.emoji}</span>
        <h2>${esc(nombre)}</h2>
        <p>${esc(descripcion)}</p>
        <div class="sm-stats-fila sm-centrado">
          <div class="sm-stat-chip">🏅 Mejor puntaje: <b>${mejor}</b></div>
        </div>
        <div class="btn">▶️ Elegir dificultad y jugar</div>
      </button>`;
    }).join('');

    root.innerHTML = `<div class="sm-pantalla">
      <header class="sm-inicio-header">
        ${SM.mascota.svg('animando', 'sm-mascota-media')}
        <div><h1>🕹️ Arcade</h1><p class="sm-muted">Elige un juego y gana puntos extra</p></div>
      </header>
      ${soloTablas ? '<p class="sm-muted sm-arcade-aviso">🎯 Modo enfoque activo: todos los juegos preguntan solo tablas de multiplicar (0 al 12).</p>' : ''}
      <div class="sm-arcade-lista">${tarjetas}</div>
      ${barraInferior('arcade')}
    </div>`;
    root.querySelectorAll('[data-elegir]').forEach((btn) => {
      btn.addEventListener('click', () => { SM.sonido.click(); ir('elegir-dificultad', { juegoId: btn.dataset.elegir }); });
    });
    cablearNavbar(root, ir);
  }

  // ==================== ARCADE (elegir dificultad) ====================
  function pantallaDificultadArcade(root, caja, juegoId, ir) {
    detenerIntervalo();
    const estado = caja.estado;
    const juego = SM.arcade.JUEGOS.find((j) => j.id === juegoId);
    const juegoStats = estado.arcade.juegos[juegoId];
    const tarjetas = SM.arcade.DIFICULTADES_ARCADE.map((d) => {
      const stats = (juegoStats && juegoStats.dificultades[d.id]) || { mejorPuntaje: 0, partidasJugadas: 0 };
      return `<button class="sm-dificultad-arcade-card sm-dificultad-arcade-${d.id}" data-dificultad="${d.id}">
        <span class="sm-dificultad-arcade-emoji">${d.emoji}</span>
        <span class="sm-dificultad-arcade-info">
          <span class="sm-dificultad-arcade-nombre">${esc(d.nombre)}</span>
          <span class="sm-muted">🏅 ${stats.mejorPuntaje} pts${stats.partidasJugadas ? ` · ${stats.partidasJugadas} partida${stats.partidasJugadas === 1 ? '' : 's'}` : ''}</span>
        </span>
      </button>`;
    }).join('');

    root.innerHTML = `<div class="sm-pantalla">
      <header class="sm-header-mundo">
        <button class="sm-btn-icono" data-accion="volver">←</button>
        <div><h1>${juego.emoji} ${esc(juego.nombre)}</h1><p class="sm-muted">Elige tu nivel de dificultad</p></div>
      </header>
      <div class="sm-dificultad-arcade-lista">${tarjetas}</div>
    </div>`;
    root.querySelector('[data-accion="volver"]').addEventListener('click', () => { SM.sonido.click(); ir('arcade'); });
    root.querySelectorAll('[data-dificultad]').forEach((btn) => {
      btn.addEventListener('click', () => { SM.sonido.click(); ir(juegoId, { dificultad: btn.dataset.dificultad }); });
    });
  }

  // ==================== INVASORES NUMÉRICOS (mini-juego) ====================
  function pantallaInvasores(root, caja, ir, dificultad) {
    detenerIntervalo();
    const partida = SM.arcade.crearPartidaInvasores(dificultad, caja.estado.modoSoloTablas);
    SM.sonido.inicioNivel();
    let naves = [];
    let corriendo = true;
    let ultimoTiempo = null;
    let acumuladorSpawn = 0;

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    function salir() {
      corriendo = false;
      detenerIntervalo();
      confirmar('¿Salir de Invasores Numéricos? Perderás el puntaje de esta partida.', 'Salir', () => ir('arcade'));
    }

    root.innerHTML = `<div class="sm-pantalla sm-pantalla-invasores">
      <header class="sm-barra-superior">
        <button class="sm-btn-icono" data-accion="salir">✕</button>
        <div class="sm-invasores-hud">
          <span>🎯 <b id="sm-inv-puntaje">0</b></span>
          <span id="sm-inv-vidas">❤️❤️❤️</span>
          <span>⏱️ <b id="sm-inv-tiempo">${partida.tiempoRestante()}</b>s</span>
        </div>
      </header>
      <div class="sm-invasores-regla" id="sm-inv-regla">${esc(partida.reglaActual().texto)}</div>
      <div class="sm-invasores-area" id="sm-invasores-area"></div>
    </div>`;
    root.querySelector('[data-accion="salir"]').addEventListener('click', salir);

    function actualizarHUD() {
      document.getElementById('sm-inv-puntaje').textContent = partida.puntaje();
      document.getElementById('sm-inv-tiempo').textContent = partida.tiempoRestante();
      const vidas = partida.vidas();
      document.getElementById('sm-inv-vidas').textContent = '❤️'.repeat(vidas) + '🖤'.repeat(Math.max(0, 3 - vidas));
    }

    function flashRegla() {
      const el = document.getElementById('sm-inv-regla');
      el.textContent = partida.reglaActual().texto;
      el.classList.remove('sm-regla-flash');
      void el.offsetWidth;
      el.classList.add('sm-regla-flash');
    }

    function crearNaveDOM(nave) {
      const area = document.getElementById('sm-invasores-area');
      const el = document.createElement('button');
      el.className = 'sm-nave';
      el.textContent = nave.etiqueta;
      el.style.left = `${randInt(6, 78)}%`;
      el.style.top = '-46px';
      el.addEventListener('click', () => disparar(nave, el));
      area.appendChild(el);
      return el;
    }

    function sacudirArea() {
      const area = document.getElementById('sm-invasores-area');
      area.classList.remove('sm-shake');
      void area.offsetWidth;
      area.classList.add('sm-shake');
    }

    function disparar(nave, el) {
      if (!corriendo || nave.impactada) return;
      nave.impactada = true;
      naves = naves.filter((n) => n !== nave);
      const r = partida.disparar(nave);
      SM.sonido[r.acierto ? 'explosion' : 'error']();
      el.classList.add(r.acierto ? 'sm-nave-acierto' : 'sm-nave-error');
      el.disabled = true;
      if (r.acierto) {
        const popup = document.createElement('div');
        popup.className = 'sm-puntos-popup sm-puntos-popup-arcade';
        popup.textContent = `+${r.puntosGanados}`;
        popup.style.left = el.style.left;
        popup.style.top = el.style.top;
        document.getElementById('sm-invasores-area').appendChild(popup);
        setTimeout(() => popup.remove(), 700);
      } else {
        sacudirArea();
      }
      setTimeout(() => el.remove(), 220);
      actualizarHUD();
      if (partida.terminada()) finalizar();
    }

    function paso(marca) {
      if (!corriendo) return;
      if (ultimoTiempo == null) ultimoTiempo = marca;
      const dt = Math.min(0.1, (marca - ultimoTiempo) / 1000);
      ultimoTiempo = marca;

      const infoTick = partida.tick(dt);
      if (infoTick.reglaNueva) flashRegla();
      actualizarHUD();
      if (infoTick.terminada) { finalizar(); return; }

      const area = document.getElementById('sm-invasores-area');
      const areaAlto = area.offsetHeight;
      const velocidadPx = 46 * partida.velocidad();
      naves.forEach((nave) => {
        nave.topPx += velocidadPx * dt;
        nave.el.style.top = `${nave.topPx}px`;
        if (nave.topPx > areaAlto) {
          nave.escapada = true;
          partida.naveEscapo(nave);
          nave.el.remove();
        }
      });
      naves = naves.filter((n) => !n.escapada);

      acumuladorSpawn += dt * 1000;
      if (acumuladorSpawn >= partida.intervaloSpawnMs()) {
        acumuladorSpawn = 0;
        const nueva = partida.generarNave();
        nueva.topPx = -46;
        nueva.el = crearNaveDOM(nueva);
        naves.push(nueva);
      }

      rafArcade = requestAnimationFrame(paso);
    }

    function finalizar() {
      corriendo = false;
      detenerIntervalo();
      mostrarResultadoArcade(root, caja, ir, 'invasores', 'invasores', dificultad, partida.puntaje(), partida.comboMax(), partida.vidas() === 0);
    }

    actualizarHUD();
    rafArcade = requestAnimationFrame(paso);
  }

  // ==================== MEMORIA ESPACIAL (mini-juego) ====================
  function pantallaMemoria(root, caja, ir, dificultad) {
    detenerIntervalo();
    const partida = SM.arcade.crearPartidaMemoria(dificultad, caja.estado.modoSoloTablas);
    SM.sonido.inicioNivel();
    let corriendo = true;
    let bloqueado = false;
    let ultimoTiempo = null;

    function salir() {
      corriendo = false;
      detenerIntervalo();
      confirmar('¿Salir de Memoria Espacial? Perderás el puntaje de esta partida.', 'Salir', () => ir('arcade'));
    }

    root.innerHTML = `<div class="sm-pantalla sm-pantalla-memoria">
      <header class="sm-barra-superior">
        <button class="sm-btn-icono" data-accion="salir">✕</button>
        <div class="sm-invasores-hud">
          <span>🎯 <b id="sm-mem-puntaje">0</b></span>
          <span>🧩 <b id="sm-mem-pares">0</b>/${partida.totalPares()}</span>
          <span>⏱️ <b id="sm-mem-tiempo">${partida.tiempoRestante()}</b>s</span>
        </div>
      </header>
      <div class="sm-memoria-grid" id="sm-memoria-grid"></div>
    </div>`;
    root.querySelector('[data-accion="salir"]').addEventListener('click', salir);

    function actualizarHUD() {
      document.getElementById('sm-mem-puntaje').textContent = partida.puntaje();
      document.getElementById('sm-mem-pares').textContent = partida.paresEncontrados();
      document.getElementById('sm-mem-tiempo').textContent = partida.tiempoRestante();
    }

    function renderGrid() {
      const grid = document.getElementById('sm-memoria-grid');
      const volteadasIds = partida.volteadas();
      grid.innerHTML = partida.cartas().map((c) => {
        const visible = c.encontrada || volteadasIds.includes(c.id);
        return `<button class="sm-carta-memoria ${visible ? 'volteada' : ''} ${c.encontrada ? 'encontrada' : ''}" data-carta="${c.id}" ${(bloqueado || visible) ? 'disabled' : ''}>
          <span>${visible ? esc(c.texto) : '❓'}</span>
        </button>`;
      }).join('');
      grid.querySelectorAll('.sm-carta-memoria').forEach((btn) => {
        btn.addEventListener('click', () => manejarClickCarta(btn.dataset.carta));
      });
    }

    function manejarClickCarta(id) {
      if (bloqueado) return;
      const r = partida.voltear(id);
      if (r.resultado === 'ignorado') return;
      SM.sonido.click();
      renderGrid();
      if (r.resultado === 'esperando') return;
      if (r.resultado === 'acierto') {
        SM.sonido.acierto();
        actualizarHUD();
        if (partida.terminada()) setTimeout(finalizar, 500);
        return;
      }
      bloqueado = true;
      SM.sonido.error();
      setTimeout(() => {
        partida.confirmarFallo();
        bloqueado = false;
        renderGrid();
      }, 900);
    }

    function finalizar() {
      corriendo = false;
      detenerIntervalo();
      mostrarResultadoArcade(root, caja, ir, 'memoria', 'memoria', dificultad, partida.puntaje(), partida.comboMax());
    }

    function paso(marca) {
      if (!corriendo) return;
      if (ultimoTiempo == null) ultimoTiempo = marca;
      const dt = Math.min(0.1, (marca - ultimoTiempo) / 1000);
      ultimoTiempo = marca;
      const termino = partida.tick(dt);
      const elTiempo = document.getElementById('sm-mem-tiempo');
      if (elTiempo) elTiempo.textContent = partida.tiempoRestante();
      if (termino) { finalizar(); return; }
      rafArcade = requestAnimationFrame(paso);
    }

    renderGrid();
    actualizarHUD();
    rafArcade = requestAnimationFrame(paso);
  }

  // ==================== ESCALERA (mini-juego) ====================
  function pantallaEscalera(root, caja, ir, dificultad) {
    detenerIntervalo();
    const soloTablas = caja.estado.modoSoloTablas;
    const partida = SM.arcade.crearPartidaEscalera(dificultad, soloTablas);
    const nombreJuego = soloTablas ? 'Escalera de Tablas' : 'Escalera de Divisores';
    SM.sonido.inicioNivel();
    let corriendo = true;
    let ultimoTiempo = null;

    function salir() {
      corriendo = false;
      detenerIntervalo();
      confirmar(`¿Salir de ${nombreJuego}? Perderás el puntaje de esta partida.`, 'Salir', () => ir('arcade'));
    }

    const numeroBaseInicial = partida.numeroBase();
    root.innerHTML = `<div class="sm-pantalla sm-pantalla-escalera">
      <header class="sm-barra-superior">
        <button class="sm-btn-icono" data-accion="salir">✕</button>
        <div class="sm-invasores-hud">
          <span>🎯 <b id="sm-esc-puntaje">0</b></span>
          <span id="sm-esc-vidas">❤️❤️❤️</span>
          <span>⏱️ <b id="sm-esc-tiempo">${partida.tiempoRestante()}</b>s</span>
        </div>
      </header>
      <div class="sm-escalera-info">
        <span>🪜 Escalón <b id="sm-esc-escalon">1</b></span>
        ${numeroBaseInicial != null ? `<span class="sm-escalera-numero">🔢 <b id="sm-esc-numero">${numeroBaseInicial}</b></span>` : ''}
      </div>
      <p class="sm-muted sm-escalera-instruccion">${soloTablas ? 'Calcula los resultados y tócalos del MÁS CHICO al MÁS GRANDE' : 'Calcula sus partes y tócalas de la MÁS CHICA a la MÁS GRANDE'}</p>
      <div class="sm-escalera-tiles" id="sm-escalera-tiles"></div>
    </div>`;
    root.querySelector('[data-accion="salir"]').addEventListener('click', salir);

    function actualizarHUD() {
      document.getElementById('sm-esc-puntaje').textContent = partida.puntaje();
      document.getElementById('sm-esc-tiempo').textContent = partida.tiempoRestante();
      document.getElementById('sm-esc-escalon').textContent = partida.escalon() + 1;
      const elNumero = document.getElementById('sm-esc-numero');
      if (elNumero) elNumero.textContent = partida.numeroBase();
      const vidas = partida.vidas();
      document.getElementById('sm-esc-vidas').textContent = '❤️'.repeat(vidas) + '🖤'.repeat(Math.max(0, 3 - vidas));
    }

    function renderTiles() {
      const zona = document.getElementById('sm-escalera-tiles');
      zona.innerHTML = partida.tiles().map((t) => `<button class="sm-tile-escalera" data-tile="${t.id}" title="${t.nombre}">${t.etiqueta}</button>`).join('');
      zona.querySelectorAll('.sm-tile-escalera').forEach((btn) => {
        btn.addEventListener('click', () => manejarToque(btn));
      });
    }

    function manejarToque(btn) {
      if (btn.disabled) return;
      const id = btn.dataset.tile;
      const r = partida.tocar(id);
      if (r.correcto) {
        SM.sonido.acierto();
        btn.classList.add('acierto');
        btn.disabled = true;
        actualizarHUD();
        if (r.escalonCompleto && !partida.terminada()) setTimeout(renderTiles, 350);
      } else {
        SM.sonido.error();
        const zona = document.getElementById('sm-escalera-tiles');
        zona.classList.remove('sm-shake');
        void zona.offsetWidth;
        zona.classList.add('sm-shake');
        actualizarHUD();
      }
      if (partida.terminada()) setTimeout(finalizar, 400);
    }

    function finalizar() {
      corriendo = false;
      detenerIntervalo();
      mostrarResultadoArcade(root, caja, ir, 'escalera', 'escalera', dificultad, partida.puntaje(), partida.comboMax(), partida.vidas() === 0);
    }

    function paso(marca) {
      if (!corriendo) return;
      if (ultimoTiempo == null) ultimoTiempo = marca;
      const dt = Math.min(0.1, (marca - ultimoTiempo) / 1000);
      ultimoTiempo = marca;
      const termino = partida.tick(dt);
      const elTiempo = document.getElementById('sm-esc-tiempo');
      if (elTiempo) elTiempo.textContent = partida.tiempoRestante();
      if (termino) { finalizar(); return; }
      rafArcade = requestAnimationFrame(paso);
    }

    renderTiles();
    actualizarHUD();
    rafArcade = requestAnimationFrame(paso);
  }

  // ==================== AGUJEROS NEGROS (mini-juego) ====================
  function pantallaAgujeros(root, caja, ir, dificultad) {
    detenerIntervalo();
    const partida = SM.arcade.crearPartidaAgujeros(dificultad, caja.estado.modoSoloTablas);
    SM.sonido.inicioNivel();
    let corriendo = true;
    let ultimoTiempo = null;

    function salir() {
      corriendo = false;
      detenerIntervalo();
      confirmar('¿Salir de Agujeros Negros? Perderás el puntaje de esta partida.', 'Salir', () => ir('arcade'));
    }

    root.innerHTML = `<div class="sm-pantalla sm-pantalla-agujeros">
      <header class="sm-barra-superior">
        <button class="sm-btn-icono" data-accion="salir">✕</button>
        <div class="sm-invasores-hud">
          <span>🎯 <b id="sm-agu-puntaje">0</b></span>
          <span id="sm-agu-vidas">❤️❤️❤️</span>
          <span>⏱️ <b id="sm-agu-tiempo">${partida.tiempoRestante()}</b>s</span>
        </div>
      </header>
      <div class="sm-invasores-regla" id="sm-agu-regla">${esc(partida.reglaActual().texto)}</div>
      <div class="sm-agujeros-grid" id="sm-agujeros-grid"></div>
    </div>`;
    root.querySelector('[data-accion="salir"]').addEventListener('click', salir);

    function actualizarHUD() {
      document.getElementById('sm-agu-puntaje').textContent = partida.puntaje();
      document.getElementById('sm-agu-tiempo').textContent = partida.tiempoRestante();
      const vidas = partida.vidas();
      document.getElementById('sm-agu-vidas').textContent = '❤️'.repeat(vidas) + '🖤'.repeat(Math.max(0, 3 - vidas));
    }

    function flashRegla() {
      const el = document.getElementById('sm-agu-regla');
      el.textContent = partida.reglaActual().texto;
      el.classList.remove('sm-regla-flash');
      void el.offsetWidth;
      el.classList.add('sm-regla-flash');
    }

    function renderGridBase() {
      const zona = document.getElementById('sm-agujeros-grid');
      zona.innerHTML = partida.huecos().map((h) => `<button class="sm-hueco" id="sm-hueco-${h.id}" data-hueco="${h.id}">🕳️</button>`).join('');
      zona.querySelectorAll('.sm-hueco').forEach((btn) => {
        btn.addEventListener('click', () => manejarToque(btn));
      });
    }

    // Actualiza solo los huecos que cambiaron de estado, para no pisar la animación
    // de acierto/fallo que deja `manejarToque` con un timeout corto.
    function actualizarGrid() {
      partida.huecos().forEach((h) => {
        const btn = document.getElementById(`sm-hueco-${h.id}`);
        if (!btn) return;
        const yaActivo = btn.classList.contains('activo');
        if (h.activo && !yaActivo) {
          btn.classList.remove('acierto', 'fallo');
          btn.classList.add('activo');
          btn.textContent = h.etiqueta;
        } else if (!h.activo && yaActivo) {
          btn.classList.remove('activo');
          btn.textContent = '🕳️';
        }
      });
    }

    function manejarToque(btn) {
      const id = Number(btn.dataset.hueco);
      const r = partida.tocar(id);
      if (r.resultado === 'ignorado') return;
      btn.classList.remove('activo');
      btn.textContent = '🕳️';
      if (r.resultado === 'acierto') {
        SM.sonido.acierto();
        btn.classList.add('acierto');
      } else {
        SM.sonido.error();
        btn.classList.add('fallo');
      }
      setTimeout(() => btn.classList.remove('acierto', 'fallo'), 350);
      actualizarHUD();
      if (partida.terminada()) setTimeout(finalizar, 300);
    }

    function finalizar() {
      corriendo = false;
      detenerIntervalo();
      mostrarResultadoArcade(root, caja, ir, 'agujeros', 'agujeros', dificultad, partida.puntaje(), partida.comboMax(), partida.vidas() === 0);
    }

    function paso(marca) {
      if (!corriendo) return;
      if (ultimoTiempo == null) ultimoTiempo = marca;
      const dt = Math.min(0.1, (marca - ultimoTiempo) / 1000);
      ultimoTiempo = marca;
      const info = partida.tick(dt);
      if (info.reglaNueva) flashRegla();
      actualizarHUD();
      actualizarGrid();
      if (info.terminada) { finalizar(); return; }
      rafArcade = requestAnimationFrame(paso);
    }

    renderGridBase();
    actualizarHUD();
    rafArcade = requestAnimationFrame(paso);
  }

  // ==================== ESQUIVA ASTEROIDES (mini-juego) ====================
  function pantallaAsteroides(root, caja, ir, dificultad) {
    detenerIntervalo();
    const partida = SM.arcade.crearPartidaAsteroides(dificultad, caja.estado.modoSoloTablas);
    SM.sonido.inicioNivel();
    let corriendo = true;
    let ultimoTiempo = null;
    const elementos = new Map();

    function salir() {
      corriendo = false;
      detenerIntervalo();
      confirmar('¿Salir de Esquiva Asteroides? Perderás el puntaje de esta partida.', 'Salir', () => ir('arcade'));
    }

    root.innerHTML = `<div class="sm-pantalla sm-pantalla-asteroides">
      <header class="sm-barra-superior">
        <button class="sm-btn-icono" data-accion="salir">✕</button>
        <div class="sm-invasores-hud">
          <span>🎯 <b id="sm-ast-puntaje">0</b></span>
          <span id="sm-ast-vidas">❤️❤️❤️</span>
          <span>⏱️ <b id="sm-ast-tiempo">${partida.tiempoRestante()}</b>s</span>
        </div>
      </header>
      <div class="sm-invasores-regla" id="sm-ast-regla">${esc(partida.reglaActual().texto)}</div>
      <div class="sm-asteroides-pista" id="sm-asteroides-pista">
        <div class="sm-carril" data-carril="0"></div>
        <div class="sm-carril" data-carril="1"></div>
        <div class="sm-carril" data-carril="2"></div>
        <div class="sm-nave" id="sm-nave">🚀</div>
      </div>
    </div>`;
    root.querySelector('[data-accion="salir"]').addEventListener('click', salir);
    root.querySelectorAll('.sm-carril').forEach((el) => {
      el.addEventListener('click', () => { partida.moverA(Number(el.dataset.carril)); actualizarNave(); });
    });

    function actualizarHUD() {
      document.getElementById('sm-ast-puntaje').textContent = partida.puntaje();
      document.getElementById('sm-ast-tiempo').textContent = partida.tiempoRestante();
      const vidas = partida.vidas();
      document.getElementById('sm-ast-vidas').textContent = '❤️'.repeat(vidas) + '🖤'.repeat(Math.max(0, 3 - vidas));
    }

    function flashRegla() {
      const el = document.getElementById('sm-ast-regla');
      el.textContent = partida.reglaActual().texto;
      el.classList.remove('sm-regla-flash');
      void el.offsetWidth;
      el.classList.add('sm-regla-flash');
    }

    function actualizarNave() {
      const nave = document.getElementById('sm-nave');
      nave.style.left = `${((partida.carrilActual() + 0.5) / 3) * 100}%`;
    }

    function sincronizarObjetos() {
      const pista = document.getElementById('sm-asteroides-pista');
      const idsActuales = new Set();
      partida.objetos().forEach((o) => {
        idsActuales.add(o.id);
        let el = elementos.get(o.id);
        if (!el) {
          el = document.createElement('div');
          el.className = 'sm-asteroide';
          el.textContent = o.etiqueta;
          pista.appendChild(el);
          elementos.set(o.id, el);
        }
        el.style.left = `${((o.carril + 0.5) / 3) * 100}%`;
        el.style.top = `${o.distancia * 82}%`;
      });
      [...elementos.keys()].forEach((id) => {
        if (!idsActuales.has(id)) {
          elementos.get(id).remove();
          elementos.delete(id);
        }
      });
    }

    function finalizar() {
      corriendo = false;
      detenerIntervalo();
      mostrarResultadoArcade(root, caja, ir, 'asteroides', 'asteroides', dificultad, partida.puntaje(), partida.comboMax(), partida.vidas() === 0);
    }

    function paso(marca) {
      if (!corriendo) return;
      if (ultimoTiempo == null) ultimoTiempo = marca;
      const dt = Math.min(0.1, (marca - ultimoTiempo) / 1000);
      ultimoTiempo = marca;
      const vidasAntes = partida.vidas();
      const puntajeAntes = partida.puntaje();
      const info = partida.tick(dt);
      if (info.reglaNueva) flashRegla();
      if (partida.vidas() < vidasAntes) {
        SM.sonido.error();
        const pista = document.getElementById('sm-asteroides-pista');
        pista.classList.remove('sm-shake');
        void pista.offsetWidth;
        pista.classList.add('sm-shake');
      } else if (partida.puntaje() > puntajeAntes) {
        SM.sonido.acierto();
      }
      actualizarHUD();
      sincronizarObjetos();
      if (info.terminada) { finalizar(); return; }
      rafArcade = requestAnimationFrame(paso);
    }

    actualizarNave();
    rafArcade = requestAnimationFrame(paso);
  }

  // ==================== METAS Y PREMIOS ====================
  function pantallaPremios(root, caja, ir) {
    detenerIntervalo();
    const estado = caja.estado;
    const metas = estado.metas.slice().sort((a, b) => a.puntos - b.puntos);
    const cobertura = SM.progreso.coberturaDetalle(estado);

    const tarjetaCobertura = `<div class="sm-meta-card sm-cobertura-card ${cobertura.completa ? 'lista' : ''}">
      <span class="sm-meta-emoji">${cobertura.completa ? '✅' : '🗺️'}</span>
      <div class="sm-meta-info">
        <span class="sm-meta-nombre">Requisito para CUALQUIER premio</span>
        <span class="sm-meta-puntos">🪐 Planetas practicados: ${cobertura.mundosHechos}/${cobertura.mundosTotal}</span>
        <span class="sm-meta-puntos">🕹️ Juegos de arcade jugados: ${cobertura.juegosHechos}/${cobertura.juegosTotal}</span>
      </div>
    </div>`;

    const tarjetas = metas.map((m) => {
      const alcanzada = SM.progreso.metaLista(estado, m);
      const pct = Math.min(100, Math.round((estado.xp / m.puntos) * 100));
      const pctRacha = m.rachaMinima ? Math.min(100, Math.round((estado.racha.dias / m.rachaMinima) * 100)) : 100;
      let claseExtra = '';
      if (m.reclamada) { claseExtra = 'reclamada'; }
      else if (alcanzada) { claseExtra = 'lista'; }
      return `<div class="sm-meta-card ${claseExtra}">
        <span class="sm-meta-emoji">${m.emoji}</span>
        <div class="sm-meta-info">
          <span class="sm-meta-nombre">${esc(m.nombre)}</span>
          <div class="sm-planeta-barra"><span style="width:${pct}%"></span></div>
          <span class="sm-meta-puntos">${estado.xp}/${m.puntos} XP</span>
          ${m.rachaMinima ? `<div class="sm-planeta-barra sm-barra-racha"><span style="width:${pctRacha}%"></span></div>
          <span class="sm-meta-puntos">🔥 racha ${estado.racha.dias}/${m.rachaMinima} días</span>` : ''}
        </div>
        <span class="sm-meta-estado">${m.reclamada ? '✅' : (alcanzada ? '🎉' : '')}</span>
      </div>`;
    }).join('') || '<p class="sm-muted" style="text-align:center;margin-top:20px">Todavía no hay metas. Pídele a papá o mamá que agregue una desde Ajustes.</p>';

    root.innerHTML = `<div class="sm-pantalla">
      <header class="sm-inicio-header">
        ${SM.mascota.svg('animando', 'sm-mascota-media')}
        <div><h1>🎁 Metas y Premios</h1><p class="sm-muted">✨ ${estado.xp} XP acumulados</p></div>
      </header>
      <div class="sm-metas-lista">${tarjetaCobertura}${tarjetas}</div>
      <p class="sm-muted sm-metas-ayuda">Además del XP y la racha, hay que haber practicado TODOS los planetas y TODOS los juegos de arcade al menos una vez — no vale acampar en lo más fácil. Cuando una meta esté lista, muéstrasela a papá o mamá para reclamar el premio 🎉 — ellos la marcan como entregada desde Ajustes.</p>
      ${barraInferior('premios')}
    </div>`;
    cablearNavbar(root, ir);
  }

  // ==================== LOGROS ====================
  function pantallaLogros(root, caja, ir) {
    detenerIntervalo();
    const estado = caja.estado;
    const tarjetas = SM.progreso.LOGROS.map((l) => {
      const obtenido = estado.logros.includes(l.id);
      return `<div class="sm-logro-card ${obtenido ? 'obtenido' : ''}">
        <span class="sm-logro-icono">${obtenido ? l.icono : '🔒'}</span>
        <span class="sm-logro-nombre">${esc(l.nombre)}</span>
        <span class="sm-logro-desc">${esc(l.descripcion)}</span>
      </div>`;
    }).join('');

    root.innerHTML = `<div class="sm-pantalla">
      <header class="sm-header-mundo">
        <div><h1>🏆 Mis logros</h1><p class="sm-muted">🔥 Racha de ${estado.racha.dias} día${estado.racha.dias === 1 ? '' : 's'} seguidos</p></div>
      </header>
      <div class="sm-logros-grid">${tarjetas}</div>
      ${barraInferior('logros')}
    </div>`;
    cablearNavbar(root, ir);
  }

  // ==================== AJUSTES ====================
  function pantallaAjustes(root, caja, ir) {
    detenerIntervalo();
    const estado = caja.estado;
    const rerender = () => pantallaAjustes(root, caja, ir);

    const filasMetas = estado.metas.slice().sort((a, b) => a.puntos - b.puntos).map((m) => {
      const alcanzada = SM.progreso.metaLista(estado, m);
      const notaRacha = m.rachaMinima ? ` · 🔥 racha ${m.rachaMinima}d` : '';
      return `<div class="sm-meta-admin-fila">
        <span>${m.emoji} ${esc(m.nombre)} — <b>${m.puntos} XP</b>${notaRacha}${m.reclamada ? ' · ✅ entregado' : (alcanzada ? ' · 🎉 lista' : '')}</span>
        <span class="sm-meta-admin-botones">
          ${(!m.reclamada && alcanzada) ? `<button class="btn btn-sec sm-btn-mini" data-reclamar="${m.id}">Marcar entregado</button>` : ''}
          <button class="btn btn-sec sm-btn-mini" data-eliminar="${m.id}">🗑️</button>
        </span>
      </div>`;
    }).join('') || '<p class="sm-muted">No hay metas todavía.</p>';

    root.innerHTML = `<div class="sm-pantalla">
      <header class="sm-header-mundo"><div><h1>⚙️ Ajustes</h1></div></header>
      <div class="sm-ajustes-lista">
        <label class="sm-campo">
          <span>Nombre del explorador</span>
          <input type="text" id="sm-campo-nombre" maxlength="20" value="${esc(estado.nombre)}">
        </label>
        <label class="sm-campo sm-campo-fila">
          <span>Sonido</span>
          <input type="checkbox" id="sm-campo-sonido" ${estado.sonido ? 'checked' : ''}>
        </label>
        <label class="sm-campo sm-campo-fila">
          <span>🎵 Música de fondo</span>
          <input type="checkbox" id="sm-campo-musica" ${estado.musica ? 'checked' : ''}>
        </label>

        <div class="sm-campo">
          <span>🎯 Modo enfoque: solo tablas de multiplicar</span>
          <p class="sm-muted" style="margin-bottom:8px">Mientras esté activo, Tablix está abierto y los demás planetas se van abriendo solos con XP (uno cada 1.000 XP: Numeria 1.000, Multiplux 2.000 … Factorix 7.000; el XP no se gasta), y los 5 juegos de arcade preguntan únicamente tablas de multiplicar, mezclando tablas fáciles y difíciles. Actívalo mientras Santi todavía no domina las tablas del 0 al 12; apágalo cuando esté listo para avanzar a otros temas.</p>
          <label class="sm-campo sm-campo-fila">
            <span>Modo enfoque activo</span>
            <input type="checkbox" id="sm-campo-solo-tablas" ${estado.modoSoloTablas ? 'checked' : ''}>
          </label>
        </div>

        <div class="sm-campo">
          <span>📅 Examen o sustentación de tablas</span>
          <p class="sm-muted" style="margin-bottom:8px">Si Santi tiene una fecha límite (examen, sustentación), el Centro de Tablas le muestra una cuenta regresiva motivadora. Déjalo vacío si no aplica ahora.</p>
          <label class="sm-campo sm-campo-fila">
            <span>Fecha</span>
            <input type="date" id="sm-campo-examen-fecha" value="${estado.examenTablas ? esc(estado.examenTablas.fecha) : ''}">
          </label>
          <label class="sm-campo">
            <span>Nota (ej. "Sustentación de recuperación")</span>
            <input type="text" id="sm-campo-examen-nota" maxlength="60" value="${estado.examenTablas ? esc(estado.examenTablas.nota || '') : ''}">
          </label>
          <div class="sm-meta-admin-botones">
            <button class="btn btn-sec sm-btn-mini" id="sm-btn-guardar-examen">💾 Guardar</button>
            ${estado.examenTablas ? '<button class="btn btn-sec sm-btn-mini" id="sm-btn-quitar-examen">🗑️ Quitar cuenta regresiva</button>' : ''}
          </div>
        </div>

        <div class="sm-campo">
          <span>🔥 Reto diario y racha</span>
          <p class="sm-muted" style="margin-bottom:8px">Cada día Santi debe ganar esta cantidad de XP jugando lo que sea (niveles, quiz o arcade). Si un día no lo cumple, la racha vuelve a 0 al abrir la app al día siguiente.</p>
          <label class="sm-campo sm-campo-fila">
            <span>Meta diaria de XP</span>
            <input type="number" id="sm-campo-meta-diaria" min="10" step="10" value="${estado.metaDiariaXP}" style="max-width:100px">
          </label>
          <p class="sm-muted" style="margin:8px 0">Racha actual: <b>${estado.racha.dias} día${estado.racha.dias === 1 ? '' : 's'}</b></p>
          <button class="btn btn-sec sm-btn-mini" id="sm-btn-reiniciar-racha">🔄 Reiniciar racha a 0</button>
        </div>

        <div class="sm-campo">
          <span>🎯 Modo desafío (agilidad)</span>
          <p class="sm-muted" style="margin-bottom:8px">Se aplica a los niveles normales de práctica (no al quiz ni al contrarreloj, que ya tienen su propio reto). Déjalo en "Sin límite" para jugar como siempre.</p>
          <label class="sm-campo sm-campo-fila">
            <span>Errores permitidos</span>
            <select id="sm-campo-errores">
              <option value="" ${!estado.desafio.erroresPermitidos ? 'selected' : ''}>Sin límite</option>
              <option value="1" ${estado.desafio.erroresPermitidos === 1 ? 'selected' : ''}>1 error</option>
              <option value="3" ${estado.desafio.erroresPermitidos === 3 ? 'selected' : ''}>3 errores</option>
              <option value="5" ${estado.desafio.erroresPermitidos === 5 ? 'selected' : ''}>5 errores</option>
            </select>
          </label>
          <label class="sm-campo sm-campo-fila">
            <span>Tiempo por pregunta</span>
            <select id="sm-campo-tiempo-pregunta">
              <option value="" ${!estado.desafio.segundosPorPregunta ? 'selected' : ''}>Sin límite</option>
              <option value="15" ${estado.desafio.segundosPorPregunta === 15 ? 'selected' : ''}>15 segundos</option>
              <option value="10" ${estado.desafio.segundosPorPregunta === 10 ? 'selected' : ''}>10 segundos</option>
              <option value="6" ${estado.desafio.segundosPorPregunta === 6 ? 'selected' : ''}>6 segundos</option>
            </select>
          </label>
        </div>

        <div class="sm-campo">
          <span>🎁 Metas y premios (para papá o mamá)</span>
          <p class="sm-muted" style="margin-bottom:8px">Define cuántos puntos XP y qué racha mínima necesita Santi para ganarse cada premio real. Además del XP y la racha, TODO premio exige que haya practicado los 8 planetas y los 5 juegos de arcade al menos una vez cada uno (no configurable, aplica siempre) — así no puede ganarse un premio grande acampando en un solo tema fácil. Cuando aparezca "🎉 lista", márcala como entregada aquí una vez se la des.</p>
          <div class="sm-metas-admin-lista">${filasMetas}</div>
          <div class="sm-meta-form">
            <input type="text" id="sm-meta-nombre" placeholder="Nombre del premio (ej. Ir al cine)" maxlength="40">
            <div class="sm-meta-form-fila">
              <input type="text" id="sm-meta-emoji" placeholder="🎁" maxlength="4">
              <input type="number" id="sm-meta-puntos" placeholder="Puntos XP" min="10" step="10">
            </div>
            <label class="sm-campo sm-campo-fila">
              <span>Racha mínima (opcional)</span>
              <input type="number" id="sm-meta-racha" placeholder="0 = sin requisito" min="0" step="1" style="max-width:100px">
            </label>
            <button class="btn btn-sec" id="sm-btn-agregar-meta">➕ Agregar meta</button>
          </div>
        </div>

        <button class="btn btn-peligro" id="sm-btn-reiniciar">🗑️ Reiniciar todo el progreso</button>
      </div>
      ${barraInferior('ajustes')}
    </div>`;

    const campoNombre = root.querySelector('#sm-campo-nombre');
    campoNombre.addEventListener('change', () => {
      const v = campoNombre.value.trim();
      estado.nombre = v || 'Santi';
      SM.progreso.guardar(estado);
    });
    root.querySelector('#sm-campo-sonido').addEventListener('change', (e) => {
      SM.progreso.toggleSonido(estado);
      SM.sonido.setActivo(e.target.checked);
      if (e.target.checked) SM.sonido.click();
    });
    root.querySelector('#sm-campo-musica').addEventListener('change', (e) => {
      SM.progreso.toggleMusica(estado);
      SM.sonido.musica.setActiva(e.target.checked);
    });
    root.querySelector('#sm-campo-meta-diaria').addEventListener('change', (e) => {
      SM.progreso.actualizarMetaDiaria(estado, parseInt(e.target.value, 10));
    });
    root.querySelector('#sm-btn-guardar-examen').addEventListener('click', () => {
      SM.sonido.click();
      const fecha = root.querySelector('#sm-campo-examen-fecha').value;
      const nota = root.querySelector('#sm-campo-examen-nota').value;
      SM.progreso.actualizarExamenTablas(estado, { fecha, nota });
      rerender();
    });
    const btnQuitarExamen = root.querySelector('#sm-btn-quitar-examen');
    if (btnQuitarExamen) btnQuitarExamen.addEventListener('click', () => {
      SM.sonido.click();
      SM.progreso.actualizarExamenTablas(estado, { fecha: null, nota: '' });
      rerender();
    });
    root.querySelector('#sm-campo-solo-tablas').addEventListener('change', (e) => {
      SM.sonido.click();
      SM.progreso.actualizarModoSoloTablas(estado, e.target.checked);
      rerender();
    });
    root.querySelector('#sm-btn-reiniciar-racha').addEventListener('click', () => {
      confirmar('¿Reiniciar la racha a 0 días? El reto de hoy también se reinicia.', 'Reiniciar', () => {
        SM.sonido.click();
        SM.progreso.reiniciarRacha(estado);
        rerender();
      });
    });
    function actualizarDesafioDesdeControles() {
      SM.progreso.actualizarDesafio(estado, {
        erroresPermitidos: root.querySelector('#sm-campo-errores').value,
        segundosPorPregunta: root.querySelector('#sm-campo-tiempo-pregunta').value,
      });
    }
    root.querySelector('#sm-campo-errores').addEventListener('change', actualizarDesafioDesdeControles);
    root.querySelector('#sm-campo-tiempo-pregunta').addEventListener('change', actualizarDesafioDesdeControles);
    root.querySelectorAll('[data-reclamar]').forEach((btn) => {
      btn.addEventListener('click', () => { SM.sonido.click(); SM.progreso.reclamarMeta(estado, btn.dataset.reclamar); rerender(); });
    });
    root.querySelectorAll('[data-eliminar]').forEach((btn) => {
      btn.addEventListener('click', () => {
        SM.sonido.click();
        confirmar('¿Eliminar esta meta?', 'Eliminar', () => { SM.progreso.eliminarMeta(estado, btn.dataset.eliminar); rerender(); });
      });
    });
    root.querySelector('#sm-btn-agregar-meta').addEventListener('click', () => {
      const nombre = root.querySelector('#sm-meta-nombre').value.trim();
      const puntos = parseInt(root.querySelector('#sm-meta-puntos').value, 10);
      const emoji = root.querySelector('#sm-meta-emoji').value.trim();
      const rachaMinima = parseInt(root.querySelector('#sm-meta-racha').value, 10) || null;
      if (!nombre || !puntos || puntos < 10) return;
      SM.sonido.click();
      SM.progreso.agregarMeta(estado, { nombre, emoji, puntos, rachaMinima });
      rerender();
    });
    root.querySelector('#sm-btn-reiniciar').addEventListener('click', () => {
      confirmar('¿Reiniciar todo el progreso de Santi? Se perderán todas las estrellas, XP y logros.', 'Reiniciar', () => {
        caja.estado = SM.progreso.reiniciar();
        ir('inicio');
      });
    });
    cablearNavbar(root, ir);
  }

  window.SM = window.SM || {};
  window.SM.ui = {
    pantallaInicio, pantallaMundo, pantallaLeccion, pantallaJuego,
    pantallaCentroTablas, pantallaElegirTablaEntreno, pantallaMinutoLoco, pantallaConteoTablas, pantallaFlashcardsTablas,
    pantallaArcade, pantallaDificultadArcade, pantallaInvasores, pantallaMemoria, pantallaEscalera,
    pantallaAgujeros, pantallaAsteroides,
    pantallaPremios, pantallaLogros, pantallaAjustes, pantallaRescateRacha,
  };
})();
