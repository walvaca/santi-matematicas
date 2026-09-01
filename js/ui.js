/* SM.ui — pinta todas las pantallas dentro de #app y maneja sus eventos. Cada
   pantalla recibe `caja` (un contenedor mutable { estado }) y `ir(pantalla, datos)`
   para navegar. No hay URLs: todo es JS puro reemplazando el HTML de #app. */
(function () {
  let intervaloJuego = null;
  let intervaloPregunta = null;
  let rafArcade = null;
  function detenerIntervalo() {
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

    const tarjetas = SM.mundos.lista.map((m) => {
      const { obtenidas, maximo } = SM.progreso.estrellasMundo(estado, m.id);
      const pct = maximo ? Math.round((obtenidas / maximo) * 100) : 0;
      return `<button class="sm-planeta-card" data-mundo="${m.id}" style="--color-planeta:${m.color}">
        <span class="sm-planeta-emoji">${m.emoji}</span>
        <span class="sm-planeta-nombre">${m.nombre}</span>
        <span class="sm-planeta-subtitulo">${esc(m.subtitulo)}</span>
        <span class="sm-planeta-barra"><span style="width:${pct}%"></span></span>
        <span class="sm-planeta-estrellas">⭐ ${obtenidas}/${maximo}</span>
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

    const xpHoy = estado.retoDiario.xpHoy;
    const metaHoy = estado.metaDiariaXP;
    const cumplidoHoy = estado.retoDiario.cumplidoHoy;
    const pctHoy = Math.min(100, Math.round((xpHoy / metaHoy) * 100));
    const retoHTML = `<div class="sm-reto-diario ${cumplidoHoy ? 'cumplido' : ''}">
      <span class="sm-reto-diario-emoji">${cumplidoHoy ? '✅' : '🎯'}</span>
      <div class="sm-meta-mini-info">
        <span>${cumplidoHoy ? '¡Reto de hoy cumplido!' : 'Reto de hoy'} <b>${xpHoy}/${metaHoy} XP</b></span>
        <span class="sm-planeta-barra"><span style="width:${pctHoy}%"></span></span>
        <small class="sm-muted">${cumplidoHoy ? `Racha activa: ${estado.racha.dias} día${estado.racha.dias === 1 ? '' : 's'} 🔥` : 'Si no lo cumples hoy, la racha vuelve a 0 mañana'}</small>
      </div>
    </div>`;

    root.innerHTML = `<div class="sm-pantalla sm-pantalla-inicio">
      <header class="sm-inicio-header">
        ${SM.mascota.svg('feliz', 'sm-mascota-media')}
        <div><h1>${saludo}</h1><p class="sm-muted">Elige un planeta y sigue tu misión matemática</p></div>
      </header>
      <div class="sm-stats-fila">
        <div class="sm-stat-chip">✨ <b>${estado.xp}</b> XP</div>
        <div class="sm-stat-chip">🔥 <b>${estado.racha.dias}</b> día${estado.racha.dias === 1 ? '' : 's'}</div>
        <div class="sm-stat-chip">⭐ <b>${totalEstrellas}</b> estrellas</div>
      </div>
      ${retoHTML}
      ${metaHTML}
      <div class="sm-planetas-grid">${tarjetas}</div>
      ${barraInferior('inicio')}
    </div>`;

    root.querySelectorAll('.sm-planeta-card').forEach((btn) => {
      btn.addEventListener('click', () => { SM.sonido.click(); ir('mundo', { mundoId: btn.dataset.mundo }); });
    });
    const btnMeta = root.querySelector('[data-accion="premios"]');
    if (btnMeta) btnMeta.addEventListener('click', () => { SM.sonido.click(); ir('premios'); });
    cablearNavbar(root, ir);
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
      <div class="sm-niveles-lista">${nodos}</div>
      <div class="sm-quiz-zona">${quizHTML}</div>
    </div>`;

    root.querySelector('[data-accion="volver"]').addEventListener('click', () => { SM.sonido.click(); ir('inicio'); });
    root.querySelector('[data-accion="leccion"]').addEventListener('click', () => { SM.sonido.click(); ir('leccion', { mundoId }); });
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

  // ==================== JUEGO ====================
  function pantallaJuego(root, caja, mundoId, nivelId, ir) {
    detenerIntervalo();
    const sesion = SM.juego.crearSesion(mundoId, nivelId, caja.estado.desafio);
    const mundo = sesion.mundo;
    let buffer = '';
    let respondiendo = false;

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
        ${cuerpoRespuesta}
        <div id="sm-feedback-zona"></div>`;

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
      if (r.logrosNuevos.length || r.metasNuevas.length || r.retoCumplidoAhora) setTimeout(() => SM.sonido.logro(), 350);

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

  // Pantalla de resultados compartida por los 3 juegos de arcade: registra el
  // puntaje, celebra récord/logros/metas/reto diario, y ofrece reintentar o volver.
  function mostrarResultadoArcade(root, caja, ir, juegoId, idPantallaJuego, puntaje, comboMax) {
    const resultado = SM.progreso.registrarResultadoArcade(caja.estado, juegoId, puntaje);
    root.innerHTML = `<div class="sm-pantalla sm-pantalla-resultado">
      <div id="sm-confeti-zona" class="sm-confeti-zona"></div>
      ${SM.mascota.svg(puntaje >= 100 ? 'celebrando' : 'feliz', 'sm-mascota-media')}
      <h1>¡Misión de arcade completada!</h1>
      <p class="sm-muted">Puntaje final</p>
      <div class="sm-arcade-puntaje-final">${puntaje}</div>
      ${resultado.esRecord ? '<p class="sm-record">🏅 ¡Nuevo récord!</p>' : ''}
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
    SM.sonido.nivelCompletado(resultado.esRecord ? 3 : 1);
    if (resultado.esRecord) lanzarConfeti(document.getElementById('sm-confeti-zona'));
    if (resultado.logrosNuevos.length || resultado.metasNuevas.length) setTimeout(() => SM.sonido.logro(), 350);
    root.querySelector('[data-accion="reintentar"]').addEventListener('click', () => { SM.sonido.click(); ir(idPantallaJuego); });
    root.querySelector('[data-accion="volver"]').addEventListener('click', () => { SM.sonido.click(); ir('arcade'); });
  }

  // ==================== ARCADE (menú) ====================
  function pantallaArcade(root, caja, ir) {
    detenerIntervalo();
    const estado = caja.estado;
    const tarjetas = SM.arcade.JUEGOS.map((j) => {
      const stats = estado.arcade.juegos[j.id] || { mejorPuntaje: 0, partidasJugadas: 0 };
      return `<div class="sm-arcade-card">
        <span class="sm-arcade-emoji">${j.emoji}</span>
        <h2>${esc(j.nombre)}</h2>
        <p>${esc(j.descripcion)}</p>
        <div class="sm-stats-fila sm-centrado">
          <div class="sm-stat-chip">🏅 Mejor puntaje: <b>${stats.mejorPuntaje}</b></div>
          <div class="sm-stat-chip">🎮 Partidas: <b>${stats.partidasJugadas}</b></div>
        </div>
        <button class="btn" data-jugar="${j.id}">▶️ Jugar</button>
      </div>`;
    }).join('');

    root.innerHTML = `<div class="sm-pantalla">
      <header class="sm-inicio-header">
        ${SM.mascota.svg('animando', 'sm-mascota-media')}
        <div><h1>🕹️ Arcade</h1><p class="sm-muted">Elige un juego y gana puntos extra</p></div>
      </header>
      <div class="sm-arcade-lista">${tarjetas}</div>
      ${barraInferior('arcade')}
    </div>`;
    root.querySelectorAll('[data-jugar]').forEach((btn) => {
      btn.addEventListener('click', () => { SM.sonido.click(); ir(btn.dataset.jugar); });
    });
    cablearNavbar(root, ir);
  }

  // ==================== INVASORES NUMÉRICOS (mini-juego) ====================
  function pantallaInvasores(root, caja, ir) {
    detenerIntervalo();
    const partida = SM.arcade.crearPartidaInvasores(90);
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
      mostrarResultadoArcade(root, caja, ir, 'invasores', 'invasores', partida.puntaje(), partida.comboMax());
    }

    actualizarHUD();
    rafArcade = requestAnimationFrame(paso);
  }

  // ==================== MEMORIA ESPACIAL (mini-juego) ====================
  function pantallaMemoria(root, caja, ir) {
    detenerIntervalo();
    const numPares = 8;
    const partida = SM.arcade.crearPartidaMemoria(numPares, 120);
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
          <span>🧩 <b id="sm-mem-pares">0</b>/${numPares}</span>
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
      mostrarResultadoArcade(root, caja, ir, 'memoria', 'memoria', partida.puntaje(), partida.comboMax());
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

  // ==================== ESCALERA NUMÉRICA (mini-juego) ====================
  function pantallaEscalera(root, caja, ir) {
    detenerIntervalo();
    const partida = SM.arcade.crearPartidaEscalera(90);
    let corriendo = true;
    let ultimoTiempo = null;

    function salir() {
      corriendo = false;
      detenerIntervalo();
      confirmar('¿Salir de Escalera Numérica? Perderás el puntaje de esta partida.', 'Salir', () => ir('arcade'));
    }

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
        <span class="sm-muted">Toca los números del más pequeño al más grande</span>
      </div>
      <div class="sm-escalera-tiles" id="sm-escalera-tiles"></div>
    </div>`;
    root.querySelector('[data-accion="salir"]').addEventListener('click', salir);

    function actualizarHUD() {
      document.getElementById('sm-esc-puntaje').textContent = partida.puntaje();
      document.getElementById('sm-esc-tiempo').textContent = partida.tiempoRestante();
      document.getElementById('sm-esc-escalon').textContent = partida.escalon() + 1;
      const vidas = partida.vidas();
      document.getElementById('sm-esc-vidas').textContent = '❤️'.repeat(vidas) + '🖤'.repeat(Math.max(0, 3 - vidas));
    }

    function renderTiles() {
      const zona = document.getElementById('sm-escalera-tiles');
      zona.innerHTML = partida.tiles().map((t) => `<button class="sm-tile-escalera" data-tile="${t.id}">${t.valor}</button>`).join('');
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
      mostrarResultadoArcade(root, caja, ir, 'escalera', 'escalera', partida.puntaje(), partida.comboMax());
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

  // ==================== METAS Y PREMIOS ====================
  function pantallaPremios(root, caja, ir) {
    detenerIntervalo();
    const estado = caja.estado;
    const metas = estado.metas.slice().sort((a, b) => a.puntos - b.puntos);

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
      <div class="sm-metas-lista">${tarjetas}</div>
      <p class="sm-muted sm-metas-ayuda">Cuando una meta esté lista, muéstrasela a papá o mamá para reclamar el premio 🎉 — ellos la marcan como entregada desde Ajustes.</p>
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

        <div class="sm-campo">
          <span>🔥 Reto diario y racha</span>
          <p class="sm-muted" style="margin-bottom:8px">Cada día Santi debe ganar esta cantidad de XP jugando lo que sea (niveles, quiz o arcade). Si un día no lo cumple, la racha vuelve a 0 al abrir la app al día siguiente.</p>
          <label class="sm-campo sm-campo-fila">
            <span>Meta diaria de XP</span>
            <input type="number" id="sm-campo-meta-diaria" min="10" step="10" value="${estado.metaDiariaXP}" style="max-width:100px">
          </label>
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
          <p class="sm-muted" style="margin-bottom:8px">Define cuántos puntos XP necesita Santi para ganarse cada premio real. Cuando aparezca "🎉 lista", márcala como entregada aquí una vez se la des.</p>
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
    root.querySelector('#sm-campo-meta-diaria').addEventListener('change', (e) => {
      SM.progreso.actualizarMetaDiaria(estado, parseInt(e.target.value, 10));
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
    pantallaArcade, pantallaInvasores, pantallaMemoria, pantallaEscalera,
    pantallaPremios, pantallaLogros, pantallaAjustes,
  };
})();
