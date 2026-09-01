/* SM.progreso — todo lo que se guarda en localStorage: nombre, estrellas por nivel,
   XP, racha de días y logros. Único punto de lectura/escritura del progreso.

   Reto diario y racha: cada día Santi tiene una meta de XP (`metaDiariaXP`, la
   configura un adulto). Si la cumple, la racha sube y queda marcada como cumplida
   para hoy. Si al abrir la app en un día nuevo el reto del último día activo NO se
   cumplió, la racha vuelve a 0 — pedido explícito del usuario ("si no cumple los
   retos diarios, los avances se reinician a 0"), interpretado como la RACHA (no las
   estrellas/XP/logros ya ganados, que nunca se borran solos). */
(function () {
  const CLAVE = 'superSantiProgreso';

  const LOGROS = [
    { id: 'primeros-pasos', nombre: 'Primeros pasos', icono: '🚀', descripcion: 'Completa tu primer nivel.',
      condicion: (e) => Object.keys(e.estrellas).length >= 1 },
    { id: 'explorador', nombre: 'Explorador espacial', icono: '🛰️', descripcion: 'Visita la lección de los 6 planetas.',
      condicion: (e) => e.leccionesVistas.length >= 6 },
    { id: 'coleccionista-10', nombre: 'Cazaestrellas', icono: '⭐', descripcion: 'Junta 10 estrellas en total.',
      condicion: (e) => sumaEstrellas(e) >= 10 },
    { id: 'coleccionista-30', nombre: 'Coleccionista de estrellas', icono: '🌟', descripcion: 'Junta 30 estrellas en total.',
      condicion: (e) => sumaEstrellas(e) >= 30 },
    { id: 'coleccionista-60', nombre: 'Galaxia de estrellas', icono: '✨', descripcion: 'Junta 60 estrellas en total.',
      condicion: (e) => sumaEstrellas(e) >= 60 },
    { id: 'racha-3', nombre: 'Constancia', icono: '🔥', descripcion: 'Cumple el reto diario 3 días seguidos.',
      condicion: (e) => e.racha.dias >= 3 },
    { id: 'racha-7', nombre: 'Semana espacial', icono: '🏆', descripcion: 'Cumple el reto diario 7 días seguidos.',
      condicion: (e) => e.racha.dias >= 7 },
    { id: 'racha-14', nombre: 'Constancia estelar', icono: '🌌', descripcion: 'Cumple el reto diario 14 días seguidos.',
      condicion: (e) => e.racha.dias >= 14 },
    { id: 'veloz', nombre: 'Veloz como un cohete', icono: '⚡', descripcion: 'Responde 15 o más en un nivel contrarreloj.',
      condicion: (e) => e.mejorContrarreloj >= 15 },
    { id: 'arcade-cadete', nombre: 'Cadete cazador', icono: '🎮', descripcion: 'Consigue 100 puntos en algún juego de Arcade.',
      condicion: (e) => Object.values(e.arcade.juegos).some((j) => j.mejorPuntaje >= 100) },
    { id: 'arcade-francotirador', nombre: 'Francotirador espacial', icono: '🛸', descripcion: 'Consigue 300 puntos en algún juego de Arcade.',
      condicion: (e) => Object.values(e.arcade.juegos).some((j) => j.mejorPuntaje >= 300) },
    { id: 'maestro-tablix', nombre: 'Maestro de Tablix', icono: '🪐', descripcion: '3 estrellas en todos los niveles de Tablix.',
      condicion: (e) => mundoCompleto(e, 'tablix') },
    { id: 'maestro-numeria', nombre: 'Maestro de Numeria', icono: '🌍', descripcion: '3 estrellas en todos los niveles de Numeria.',
      condicion: (e) => mundoCompleto(e, 'numeria') },
    { id: 'maestro-multiplux', nombre: 'Maestro de Multiplux', icono: '☄️', descripcion: '3 estrellas en todos los niveles de Multiplux.',
      condicion: (e) => mundoCompleto(e, 'multiplux') },
    { id: 'maestro-divisorix', nombre: 'Maestro de Divisorix', icono: '🌑', descripcion: '3 estrellas en todos los niveles de Divisorix.',
      condicion: (e) => mundoCompleto(e, 'divisorix') },
    { id: 'maestro-fracciolandia', nombre: 'Maestro de Fracciolandia', icono: '🍕', descripcion: '3 estrellas en todos los niveles de Fracciolandia.',
      condicion: (e) => mundoCompleto(e, 'fracciolandia') },
    { id: 'maestro-incognita', nombre: 'Maestro de Incógnita', icono: '🔭', descripcion: '3 estrellas en todos los niveles de Incógnita.',
      condicion: (e) => mundoCompleto(e, 'incognita') },
    { id: 'mision-cumplida', nombre: 'Misión cumplida', icono: '👑', descripcion: '3 estrellas en TODOS los niveles de todos los planetas.',
      condicion: (e) => (SM.mundos.lista || []).every((m) => mundoCompleto(e, m.id)) },
  ];

  function sumaEstrellas(e) {
    return Object.values(e.estrellas).reduce((a, b) => a + b, 0);
  }

  function mundoCompleto(e, mundoId) {
    const mundo = SM.mundos.obtener(mundoId);
    if (!mundo) return false;
    return mundo.niveles.every((n) => (e.estrellas[`${mundoId}:${n.id}`] || 0) >= 3);
  }

  // Una meta está "lista" solo si se cumplen AMBAS condiciones — el XP a secas se
  // puede juntar en una tarde de juego intenso, la racha no: solo sube un día a la
  // vez, así que las metas grandes obligan a jugar de forma constante, no de golpe.
  function metaLista(estado, meta) {
    return estado.xp >= meta.puntos && (!meta.rachaMinima || estado.racha.dias >= meta.rachaMinima);
  }

  function metasPorDefecto() {
    return [
      { id: 'meta-roblox', nombre: '30 minutos de Roblox', emoji: '🎮', puntos: 400, rachaMinima: 2, reclamada: false, notificada: false },
      { id: 'meta-pizza', nombre: 'Noche de pizza', emoji: '🍕', puntos: 1200, rachaMinima: 5, reclamada: false, notificada: false },
      { id: 'meta-cine', nombre: 'Ir al cine', emoji: '🎬', puntos: 3000, rachaMinima: 10, reclamada: false, notificada: false },
    ];
  }

  function arcadeJuegosPorDefecto() {
    return {
      invasores: { mejorPuntaje: 0, partidasJugadas: 0 },
      memoria: { mejorPuntaje: 0, partidasJugadas: 0 },
      escalera: { mejorPuntaje: 0, partidasJugadas: 0 },
    };
  }

  function porDefecto() {
    return {
      nombre: 'Santi',
      xp: 0,
      estrellas: {},          // "mundoId:nivelId" -> 0..3 (incluye "mundoId:quiz")
      progresoMaximo: {},      // "mundoId" -> índice más alto desbloqueado en niveles regulares
      logros: [],              // ids obtenidos
      leccionesVistas: [],      // ids de mundo cuya lección ya se vio
      mejorContrarreloj: 0,      // mayor cantidad de aciertos en un nivel contrarreloj
      racha: { dias: 0, ultimaFecha: null },
      sonido: true,
      arcade: { juegos: arcadeJuegosPorDefecto() },
      metas: metasPorDefecto(),   // premios reales que un adulto configura y entrega
      desafio: { erroresPermitidos: null, segundosPorPregunta: null }, // modo agilidad opcional
      metaDiariaXP: 60,            // XP que hay que ganar HOY para que cuente como día cumplido
      retoDiario: { fecha: null, xpHoy: 0, cumplidoHoy: false },
    };
  }

  // Para bóvedas guardadas antes de que existiera `progresoMaximo`: reconstruye el
  // avance ya logrado a partir de las estrellas guardadas, para no re-bloquear nada.
  function progresoMaximoInicial(estrellas) {
    const resultado = {};
    (SM.mundos.lista || []).forEach((mundo) => {
      const regulares = mundo.niveles.filter((n) => !n.esQuiz);
      let maximo = 0;
      regulares.forEach((n, idx) => {
        if ((estrellas[`${mundo.id}:${n.id}`] || 0) >= 1) maximo = Math.max(maximo, idx + 1);
      });
      resultado[mundo.id] = maximo;
    });
    return resultado;
  }

  // Bóvedas guardadas antes de que hubiera varios juegos de arcade solo tenían
  // { mejorPuntaje, partidasJugadas } planos, y eran siempre de Invasores Numéricos.
  function migrarArcade(guardado) {
    const base = arcadeJuegosPorDefecto();
    if (!guardado) return { juegos: base };
    if (guardado.juegos) {
      Object.keys(base).forEach((id) => { base[id] = Object.assign({}, base[id], guardado.juegos[id]); });
      return { juegos: base };
    }
    base.invasores = { mejorPuntaje: guardado.mejorPuntaje || 0, partidasJugadas: guardado.partidasJugadas || 0 };
    return { juegos: base };
  }

  function cargar() {
    try {
      const crudo = localStorage.getItem(CLAVE);
      if (!crudo) return porDefecto();
      const guardado = JSON.parse(crudo);
      const estrellas = Object.assign({}, guardado.estrellas);
      return Object.assign(porDefecto(), guardado, {
        estrellas,
        progresoMaximo: guardado.progresoMaximo || progresoMaximoInicial(estrellas),
        racha: Object.assign({ dias: 0, ultimaFecha: null }, guardado.racha),
        logros: guardado.logros || [],
        leccionesVistas: guardado.leccionesVistas || [],
        arcade: migrarArcade(guardado.arcade),
        desafio: Object.assign({ erroresPermitidos: null, segundosPorPregunta: null }, guardado.desafio),
        metaDiariaXP: guardado.metaDiariaXP || 60,
        retoDiario: Object.assign({ fecha: null, xpHoy: 0, cumplidoHoy: false }, guardado.retoDiario),
      });
    } catch (err) {
      console.error('No se pudo leer el progreso guardado', err);
      return porDefecto();
    }
  }

  function guardar(estado) {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
  }

  function fechaISO(offsetDias) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDias);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function hoyISO() { return fechaISO(0); }

  // Se llama una vez al abrir la app: si es un día nuevo, revisa si el reto de ayer
  // se cumplió (si no, la racha vuelve a 0) y arma el reto de hoy desde cero. También
  // rompe la racha si el último día activo NO fue literalmente ayer — saltarse días
  // enteros sin abrir la app cuenta igual que no cumplir el reto, no es una manera de
  // "congelar" la racha.
  function actualizarProgresoDiario(estado) {
    const hoy = hoyISO();
    if (estado.retoDiario.fecha === hoy) return estado;
    const esPrimeraVez = !estado.retoDiario.fecha;
    const fueAyer = estado.retoDiario.fecha === fechaISO(-1);
    if (!esPrimeraVez && (!estado.retoDiario.cumplidoHoy || !fueAyer)) {
      estado.racha.dias = 0;
    }
    estado.racha.ultimaFecha = hoy;
    estado.retoDiario = { fecha: hoy, xpHoy: 0, cumplidoHoy: false };
    guardar(estado);
    return estado;
  }

  // Único punto donde se suma XP: además del total, alimenta el reto diario y, si lo
  // completa por primera vez hoy, sube la racha en el momento (no hay que esperar a
  // mañana para verlo reflejado). Devuelve true si el reto se acaba de cumplir ahora.
  function sumarXP(estado, cantidad) {
    estado.xp += cantidad;
    estado.retoDiario.xpHoy += cantidad;
    if (!estado.retoDiario.cumplidoHoy && estado.retoDiario.xpHoy >= estado.metaDiariaXP) {
      estado.retoDiario.cumplidoHoy = true;
      estado.racha.dias += 1;
      return true;
    }
    return false;
  }

  // Revisa si el progreso actual alcanzó alguna meta todavía no notificada (se llama
  // tras sumar XP o subir la racha).
  function revisarMetasAlcanzadas(estado) {
    const nuevas = [];
    estado.metas.forEach((m) => {
      if (!m.notificada && metaLista(estado, m)) {
        m.notificada = true;
        nuevas.push(m);
      }
    });
    return nuevas;
  }

  function agregarMeta(estado, { nombre, emoji, puntos, rachaMinima }) {
    const puntosNum = Math.max(10, Math.round(puntos));
    const rachaNum = rachaMinima ? Math.max(0, Math.round(rachaMinima)) : null;
    estado.metas.push({
      id: `meta-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nombre: nombre.trim().slice(0, 40),
      emoji: (emoji || '🎁').trim().slice(0, 4) || '🎁',
      puntos: puntosNum,
      rachaMinima: rachaNum,
      reclamada: false,
      // si ya la cumplía antes de crearla, no hace falta re-anunciarla
      notificada: metaLista(estado, { puntos: puntosNum, rachaMinima: rachaNum }),
    });
    guardar(estado);
    return estado;
  }

  function eliminarMeta(estado, metaId) {
    estado.metas = estado.metas.filter((m) => m.id !== metaId);
    guardar(estado);
    return estado;
  }

  function reclamarMeta(estado, metaId) {
    const meta = estado.metas.find((m) => m.id === metaId);
    if (meta) { meta.reclamada = true; guardar(estado); }
    return estado;
  }

  function marcarLeccionVista(estado, mundoId) {
    if (!estado.leccionesVistas.includes(mundoId)) {
      estado.leccionesVistas.push(mundoId);
      guardar(estado);
    }
    return estado;
  }

  // Registra el resultado de un nivel jugado (normal o quiz final). Devuelve info útil
  // para la pantalla de resultados.
  function registrarResultadoNivel(estado, mundoId, nivelId, estrellasGanadas, correctas) {
    const nivel = SM.mundos.obtenerNivel(mundoId, nivelId);
    const esQuiz = !!(nivel && nivel.esQuiz);
    const clave = `${mundoId}:${nivelId}`;
    const estrellasAntes = estado.estrellas[clave] || 0;
    const esRecord = estrellasGanadas > estrellasAntes;
    const primeraVez = !(clave in estado.estrellas);
    if (esRecord) estado.estrellas[clave] = estrellasGanadas;

    const xpGanado = esQuiz
      ? estrellasGanadas * 25 + (primeraVez ? 25 : 0)
      : estrellasGanadas * 15 + (primeraVez ? 15 : 0);
    const retoCumplidoAhora = sumarXP(estado, xpGanado);

    if (!esQuiz && estrellasGanadas >= 1) {
      const mundo = SM.mundos.obtener(mundoId);
      const regulares = mundo.niveles.filter((n) => !n.esQuiz);
      const idx = regulares.findIndex((n) => n.id === nivelId);
      const actual = estado.progresoMaximo[mundoId] || 0;
      estado.progresoMaximo[mundoId] = Math.max(actual, idx + 1);
    }

    if (correctas != null && correctas > estado.mejorContrarreloj) {
      estado.mejorContrarreloj = correctas;
    }

    const logrosNuevos = [];
    LOGROS.forEach((l) => {
      if (!estado.logros.includes(l.id) && l.condicion(estado)) {
        estado.logros.push(l.id);
        logrosNuevos.push(l);
      }
    });
    const metasNuevas = revisarMetasAlcanzadas(estado);

    guardar(estado);
    return {
      estrellasAntes, esRecord, xpGanado, logrosNuevos, metasNuevas, esQuiz, retoCumplidoAhora,
      aprobado: esQuiz ? estrellasGanadas >= 1 : null,
    };
  }

  // Registra el resultado de una partida de un mini-juego de arcade (juegoId: ver
  // SM.arcade.JUEGOS, ej. "invasores", "memoria", "escalera").
  function registrarResultadoArcade(estado, juegoId, puntaje) {
    if (!estado.arcade.juegos[juegoId]) estado.arcade.juegos[juegoId] = { mejorPuntaje: 0, partidasJugadas: 0 };
    const stats = estado.arcade.juegos[juegoId];
    stats.partidasJugadas += 1;
    const esRecord = puntaje > stats.mejorPuntaje;
    if (esRecord) stats.mejorPuntaje = puntaje;

    const xpGanado = Math.round(puntaje / 5);
    const retoCumplidoAhora = sumarXP(estado, xpGanado);

    const logrosNuevos = [];
    LOGROS.forEach((l) => {
      if (!estado.logros.includes(l.id) && l.condicion(estado)) {
        estado.logros.push(l.id);
        logrosNuevos.push(l);
      }
    });
    const metasNuevas = revisarMetasAlcanzadas(estado);

    guardar(estado);
    return { esRecord, xpGanado, logrosNuevos, metasNuevas, retoCumplidoAhora, mejorPuntaje: stats.mejorPuntaje };
  }

  // El desbloqueo se rige por `progresoMaximo` (el índice más alto ya alcanzado),
  // NO por las estrellas actuales del nivel anterior — así, reiniciar las estrellas
  // de un nivel para practicarlo de nuevo nunca vuelve a bloquear lo que ya se abrió.
  function nivelDesbloqueado(estado, mundoId, nivelId) {
    const mundo = SM.mundos.obtener(mundoId);
    if (!mundo) return false;
    const nivel = mundo.niveles.find((n) => n.id === nivelId);
    if (!nivel) return false;
    if (nivel.esQuiz) return true; // el quiz final es opcional, siempre disponible
    const regulares = mundo.niveles.filter((n) => !n.esQuiz);
    const idx = regulares.findIndex((n) => n.id === nivelId);
    const maximo = estado.progresoMaximo[mundoId] || 0;
    return idx <= maximo;
  }

  function estrellasMundo(estado, mundoId) {
    const mundo = SM.mundos.obtener(mundoId);
    if (!mundo) return { obtenidas: 0, maximo: 0 };
    let obtenidas = 0;
    mundo.niveles.forEach((n) => { obtenidas += estado.estrellas[`${mundoId}:${n.id}`] || 0; });
    return { obtenidas, maximo: mundo.niveles.length * 3 };
  }

  function reiniciar() {
    localStorage.removeItem(CLAVE);
    return porDefecto();
  }

  function toggleSonido(estado) {
    estado.sonido = !estado.sonido;
    guardar(estado);
    return estado.sonido;
  }

  // Borra las estrellas de un solo nivel (o del quiz) para volver a practicarlo desde
  // cero. No re-bloquea nada — el acceso depende de `progresoMaximo`, no de esto.
  function resetearNivel(estado, mundoId, nivelId) {
    delete estado.estrellas[`${mundoId}:${nivelId}`];
    guardar(estado);
    return estado;
  }

  // Reinicia un planeta completo: borra las estrellas de todos sus niveles (incluido
  // el quiz) y vuelve a bloquear todo salvo el primer nivel — un "empezar de nuevo"
  // real para repasar el planeta entero como tarea.
  function resetearPlaneta(estado, mundoId) {
    const mundo = SM.mundos.obtener(mundoId);
    if (!mundo) return estado;
    mundo.niveles.forEach((n) => { delete estado.estrellas[`${mundoId}:${n.id}`]; });
    estado.progresoMaximo[mundoId] = 0;
    guardar(estado);
    return estado;
  }

  function actualizarDesafio(estado, { erroresPermitidos, segundosPorPregunta }) {
    estado.desafio = {
      erroresPermitidos: erroresPermitidos ? Number(erroresPermitidos) : null,
      segundosPorPregunta: segundosPorPregunta ? Number(segundosPorPregunta) : null,
    };
    guardar(estado);
    return estado;
  }

  function actualizarMetaDiaria(estado, xp) {
    estado.metaDiariaXP = Math.max(10, Math.round(xp) || 60);
    guardar(estado);
    return estado;
  }

  window.SM = window.SM || {};
  window.SM.progreso = {
    LOGROS, cargar, guardar, actualizarProgresoDiario, registrarResultadoNivel, registrarResultadoArcade,
    nivelDesbloqueado, estrellasMundo, sumaEstrellas, reiniciar, toggleSonido, metaLista,
    marcarLeccionVista, agregarMeta, eliminarMeta, reclamarMeta,
    resetearNivel, resetearPlaneta, actualizarDesafio, actualizarMetaDiaria,
  };
})();
