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
    { id: 'explorador', nombre: 'Explorador espacial', icono: '🛰️', descripcion: 'Visita la lección de los 8 planetas.',
      condicion: (e) => e.leccionesVistas.length >= (SM.mundos.lista || []).length },
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
    { id: 'minuto-oro', nombre: 'Minuto de oro', icono: '⏱️', descripcion: 'Consigue 10 o más aciertos en el Minuto Loco de alguna tabla (Centro de Tablas).',
      condicion: (e) => (e.mejorMinutoLoco || 0) >= 10 },
    { id: 'cerebro-tablas', nombre: 'Cerebro de tablas', icono: '🧠', descripcion: 'Domina las 144 combinaciones de las tablas del 1 al 12 (Tarjetas Rápidas / Minuto Loco).',
      condicion: (e) => todasFactsDominadas(e) },
    { id: 'arcade-cadete', nombre: 'Cadete cazador', icono: '🎮', descripcion: 'Consigue 100 puntos en algún juego de Arcade (en cualquier dificultad).',
      condicion: (e) => Object.values(e.arcade.juegos).some((j) => mejorPuntajeJuego(j) >= 100) },
    { id: 'arcade-francotirador', nombre: 'Francotirador espacial', icono: '🛸', descripcion: 'Consigue 300 puntos en algún juego de Arcade (en cualquier dificultad).',
      condicion: (e) => Object.values(e.arcade.juegos).some((j) => mejorPuntajeJuego(j) >= 300) },
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
    { id: 'maestro-radix', nombre: 'Maestro de Radix', icono: '🛸', descripcion: '3 estrellas en todos los niveles de Radix.',
      condicion: (e) => mundoCompleto(e, 'radix') },
    { id: 'maestro-factorix', nombre: 'Maestro de Factorix', icono: '🌌', descripcion: '3 estrellas en todos los niveles de Factorix.',
      condicion: (e) => mundoCompleto(e, 'factorix') },
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

  // ---------- Centro de Tablas (js/tablas.js): dominio por "hecho" individual ----------
  // A propósito el mapa de dominio se alimenta SOLO de Tarjetas Rápidas y Minuto Loco
  // (ver registrarFactTabla, llamado desde tablas.js), no de los niveles normales de
  // Tablix — así no hay que tocar el motor compartido SM.juego que usan los otros 7
  // planetas. "Dominado" = al menos 2 intentos y 80% o más de acierto.
  function statsFact(estado, a, b) {
    const s = (estado.tablasFacts && estado.tablasFacts[`${a}x${b}`]) || { aciertos: 0, fallos: 0 };
    const intentos = s.aciertos + s.fallos;
    return { aciertos: s.aciertos, fallos: s.fallos, intentos, precision: intentos ? s.aciertos / intentos : 0 };
  }
  function registrarFactTabla(estado, a, b, correcta) {
    const clave = `${a}x${b}`;
    if (!estado.tablasFacts[clave]) estado.tablasFacts[clave] = { aciertos: 0, fallos: 0 };
    if (correcta) estado.tablasFacts[clave].aciertos += 1; else estado.tablasFacts[clave].fallos += 1;
    // sin guardar() a propósito: se persiste junto con el resto al terminar la sesión
    // (registrarResultadoMetodoTablas), igual que las estrellas de un nivel normal
    // solo se guardan al finalizar, no pregunta por pregunta.
  }
  function dominaFact(estado, a, b) {
    const s = statsFact(estado, a, b);
    return s.intentos >= 2 && s.precision >= 0.8;
  }
  function resumenDominioTablas(estado) {
    const porTabla = [];
    let dominadasTotal = 0;
    for (let a = 1; a <= 12; a++) {
      let dominadas = 0;
      for (let b = 1; b <= 12; b++) { if (dominaFact(estado, a, b)) dominadas += 1; }
      dominadasTotal += dominadas;
      porTabla.push({ tabla: a, dominadas, total: 12, pct: Math.round((dominadas / 12) * 100) });
    }
    return { porTabla, dominadas: dominadasTotal, total: 144, pct: Math.round((dominadasTotal / 144) * 100) };
  }
  function todasFactsDominadas(estado) { return resumenDominioTablas(estado).dominadas >= 144; }

  // Registra el resultado de una sesión del Centro de Tablas (Tarjetas Rápidas, Minuto
  // Loco o Conteo Salteado) — no son "niveles" de mundos.js, así que no pasan por
  // registrarResultadoNivel, pero sí alimentan el mismo XP/racha/logros/metas que todo
  // lo demás. `extra.minutoLoco` (aciertos) actualiza el récord para el logro "Minuto de oro".
  function registrarResultadoMetodoTablas(estado, xpGanado, extra) {
    if (extra && typeof extra.minutoLoco === 'number') {
      estado.mejorMinutoLoco = Math.max(estado.mejorMinutoLoco || 0, extra.minutoLoco);
    }
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
    return { xpGanado, logrosNuevos, metasNuevas, retoCumplidoAhora };
  }

  // Cuenta regresiva opcional para un examen/sustentación (Centro de Tablas la muestra
  // como banner motivador). `fecha` null/vacía la quita. Editable por un adulto en Ajustes.
  function actualizarExamenTablas(estado, { fecha, nota }) {
    estado.examenTablas = fecha ? { fecha, nota: (nota || '').trim().slice(0, 60) } : null;
    guardar(estado);
    return estado;
  }

  // Checklist del "Plan de 5 días" del Centro de Tablas — 5 casillas que el adulto o
  // Santi marcan a mano según avanzan, sin ninguna lógica de desbloqueo detrás.
  function togglePlanTablas(estado, indice) {
    if (!estado.planTablas) estado.planTablas = [false, false, false, false, false];
    estado.planTablas[indice] = !estado.planTablas[indice];
    guardar(estado);
    return estado;
  }

  // Mejor puntaje de un juego de arcade, sin importar en qué dificultad se logró.
  function mejorPuntajeJuego(juego) {
    if (!juego || !juego.dificultades) return 0;
    return Math.max(0, ...Object.values(juego.dificultades).map((d) => d.mejorPuntaje || 0));
  }

  // Cobertura completa: a pedido explícito del usuario, un premio ya no se gana solo
  // acumulando XP en lo que sea más fácil — Santi tiene que haber practicado los 8
  // planetas Y los 5 juegos de arcade al menos una vez cada uno ("ejercicios de
  // todos los tipos y juegos... es indispensable"). "Practicado" un planeta = tiene
  // al menos 1 estrella en algún nivel suyo; "practicado" un juego de arcade = tiene
  // al menos 1 partida jugada en alguna dificultad.
  function coberturaDetalle(estado) {
    // Con el modo enfoque en tablas activo, solo Tablix está desbloqueado — exigir
    // los 8 planetas dejaría CUALQUIER premio imposible de ganar mientras Santi
    // practica tablas, que es justo lo contrario de lo que se busca. En ese modo la
    // cobertura de planetas se reduce a los que sí están disponibles (solo Tablix).
    const mundos = estado.modoSoloTablas ? (SM.mundos.lista || []).filter((m) => m.id === 'tablix') : (SM.mundos.lista || []);
    const mundosHechos = mundos.filter((m) => Object.keys(estado.estrellas).some((k) => k.startsWith(`${m.id}:`))).length;
    const juegosArr = Object.values(estado.arcade.juegos);
    const juegosHechos = juegosArr.filter((j) => Object.values(j.dificultades).some((d) => d.partidasJugadas > 0)).length;
    return {
      mundosHechos, mundosTotal: mundos.length,
      juegosHechos, juegosTotal: juegosArr.length,
      completa: mundos.length > 0 && mundosHechos === mundos.length && juegosArr.length > 0 && juegosHechos === juegosArr.length,
    };
  }
  function coberturaCompleta(estado) { return coberturaDetalle(estado).completa; }

  // Una meta está "lista" solo si se cumplen TODAS las condiciones — el XP a secas se
  // puede juntar en una tarde de juego intenso, la racha no (solo sube un día a la
  // vez), y la cobertura completa no se puede lograr practicando solo lo fácil: las
  // metas grandes obligan a jugar de forma constante y variada, no de golpe ni
  // acampando en un solo tema.
  function metaLista(estado, meta) {
    return estado.xp >= meta.puntos
      && (!meta.rachaMinima || estado.racha.dias >= meta.rachaMinima)
      && coberturaCompleta(estado);
  }

  function metasPorDefecto() {
    return [
      { id: 'meta-paleta', nombre: 'Paleta Dracula', emoji: '🍭', puntos: 800, rachaMinima: 5, reclamada: false, notificada: false },
      { id: 'meta-pizza', nombre: 'Noche de pizza', emoji: '🍕', puntos: 2500, rachaMinima: 5, reclamada: false, notificada: false },
      { id: 'meta-cine', nombre: 'Ir al cine', emoji: '🎬', puntos: 5000, rachaMinima: 5, reclamada: false, notificada: false },
      { id: 'meta-robux', nombre: '500 Robux', emoji: '🎮', puntos: 9000, rachaMinima: 5, reclamada: false, notificada: false },
    ];
  }

  const IDS_DIFICULTAD_ARCADE = ['principiante', 'intermedio', 'experto', 'maestro'];
  function dificultadesJuegoPorDefecto() {
    const d = {};
    IDS_DIFICULTAD_ARCADE.forEach((id) => { d[id] = { mejorPuntaje: 0, partidasJugadas: 0 }; });
    return d;
  }
  function arcadeJuegosPorDefecto() {
    return {
      invasores: { dificultades: dificultadesJuegoPorDefecto() },
      memoria: { dificultades: dificultadesJuegoPorDefecto() },
      escalera: { dificultades: dificultadesJuegoPorDefecto() },
      agujeros: { dificultades: dificultadesJuegoPorDefecto() },
      asteroides: { dificultades: dificultadesJuegoPorDefecto() },
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
      // `historial`: fechas ISO (AAAA-MM-DD) de los días en que SÍ cumplió el reto —
      // solo alimenta el widget de racha estilo Duolingo (semana con días marcados),
      // no cambia ninguna regla de la racha. Se guardan las últimas 60.
      racha: { dias: 0, ultimaFecha: null, historial: [] },
      sonido: true,
      musica: true,
      arcade: { juegos: arcadeJuegosPorDefecto() },
      metas: metasPorDefecto(),   // premios reales que un adulto configura y entrega
      desafio: { erroresPermitidos: null, segundosPorPregunta: null }, // modo agilidad opcional
      metaDiariaXP: 100,           // XP que hay que ganar HOY para que cuente como día cumplido
      retoDiario: { fecha: null, xpHoy: 0, cumplidoHoy: false },
      // Rescate de racha (ver `actualizarProgresoDiario` / `terminarRescate`): solo existe
      // el día en que se perdió una racha > 0. estado: disponible | en-curso | logrado | fallido.
      rescateRacha: null,
      // Modo enfoque: solo tablas — pedido explícito del usuario (Santi casi pierde
      // el año por no dominar las tablas, y se dispersaba entre 8 planetas y 5
      // juegos). En true, todos los planetas menos Tablix quedan bloqueados y el
      // arcade solo genera contenido de tablas de multiplicar. Lo apaga un adulto
      // desde Ajustes cuando Santi ya domine las tablas y toque avanzar a lo demás.
      // Default true para bóvedas NUEVAS y también para las YA GUARDADAS (ver
      // `cargar()`) — a diferencia de otros valores nuevos de esta app, este sí
      // debía aplicar de inmediato a la partida real de Santi, por pedido explícito.
      modoSoloTablas: true,
      // Centro de Tablas (js/tablas.js): dominio por hecho individual ("axb" -> {aciertos,
      // fallos}), récord del Minuto Loco, y checklist del plan de 5 días.
      tablasFacts: {},
      mejorMinutoLoco: 0,
      planTablas: [false, false, false, false, false],
      // Cuenta regresiva por defecto — pedido explícito y urgente del usuario
      // (2026-09-16/17): Santi tiene sustentación de recuperación el lunes 2026-09-21 y
      // debe saberse todas las tablas para ese día. Igual que `modoSoloTablas`, este
      // default SÍ debe aplicar de inmediato a la partida YA GUARDADA de Santi (ver
      // `cargar()`) — un adulto puede editarla o quitarla en Ajustes en cualquier momento.
      examenTablas: examenTablasPorDefecto(),
    };
  }

  function examenTablasPorDefecto() {
    return { fecha: '2026-09-21', nota: 'Sustentación de recuperación de matemáticas' };
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
  // Migra el bloque `arcade` guardado, venga de la forma que venga:
  // 1) plano viejísimo { mejorPuntaje, partidasJugadas } (solo existía Invasores),
  // 2) { juegos: { invasores: { mejorPuntaje, partidasJugadas }, ... } } (antes de
  //    tener dificultades seleccionables), o 3) la forma actual con `dificultades`.
  // En los casos 1 y 2 el progreso viejo se mete en la dificultad "intermedio",
  // que era el único modo en que se podía jugar entonces.
  function migrarArcade(guardado) {
    const base = arcadeJuegosPorDefecto();
    if (!guardado) return { juegos: base };
    if (!guardado.juegos) {
      base.invasores.dificultades.intermedio = { mejorPuntaje: guardado.mejorPuntaje || 0, partidasJugadas: guardado.partidasJugadas || 0 };
      return { juegos: base };
    }
    Object.keys(base).forEach((juegoId) => {
      const guardadoJuego = guardado.juegos[juegoId];
      if (!guardadoJuego) return;
      if (guardadoJuego.dificultades) {
        IDS_DIFICULTAD_ARCADE.forEach((difId) => {
          base[juegoId].dificultades[difId] = Object.assign({}, base[juegoId].dificultades[difId], guardadoJuego.dificultades[difId]);
        });
      } else if (typeof guardadoJuego.mejorPuntaje === 'number') {
        base[juegoId].dificultades.intermedio = { mejorPuntaje: guardadoJuego.mejorPuntaje || 0, partidasJugadas: guardadoJuego.partidasJugadas || 0 };
      }
    });
    return { juegos: base };
  }

  function isoDe(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // Bóvedas guardadas antes del widget de racha no tienen `historial`: se reconstruye
  // a partir de la racha que ya tenía (N días seguidos que terminan en el último día
  // cumplido), así el widget no aparece vacío la primera vez que Santi lo ve.
  function migrarRacha(racha, retoDiario) {
    const r = Object.assign({ dias: 0, ultimaFecha: null }, racha);
    if (Array.isArray(r.historial)) return r;
    r.historial = [];
    const reto = retoDiario || {};
    if (r.dias > 0 && reto.fecha) {
      const [a, m, d] = reto.fecha.split('-').map(Number);
      const fin = new Date(a, m - 1, d);
      if (!reto.cumplidoHoy) fin.setDate(fin.getDate() - 1);
      for (let i = r.dias - 1; i >= 0; i--) {
        const dia = new Date(fin);
        dia.setDate(fin.getDate() - i);
        r.historial.push(isoDe(dia));
      }
    }
    return r;
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
        racha: migrarRacha(guardado.racha, guardado.retoDiario),
        logros: guardado.logros || [],
        leccionesVistas: guardado.leccionesVistas || [],
        arcade: migrarArcade(guardado.arcade),
        desafio: Object.assign({ erroresPermitidos: null, segundosPorPregunta: null }, guardado.desafio),
        metaDiariaXP: guardado.metaDiariaXP || 100,
        retoDiario: Object.assign({ fecha: null, xpHoy: 0, cumplidoHoy: false }, guardado.retoDiario),
        rescateRacha: guardado.rescateRacha || null,
        // A propósito default `true` incluso para bóvedas guardadas ANTES de que
        // existiera este campo (`typeof ... === 'boolean'` es la única forma de
        // distinguir "false porque el adulto ya lo apagó" de "no existía todavía").
        modoSoloTablas: typeof guardado.modoSoloTablas === 'boolean' ? guardado.modoSoloTablas : true,
        tablasFacts: guardado.tablasFacts || {},
        mejorMinutoLoco: guardado.mejorMinutoLoco || 0,
        planTablas: guardado.planTablas || [false, false, false, false, false],
        // `!== undefined` (no `typeof boolean`, porque acá el valor es un objeto o null):
        // una bóveda guardada ANTES de que existiera este campo nunca tuvo la clave, así
        // que se le aplica el default de una vez (mismo espíritu que modoSoloTablas). Si
        // el adulto ya la quitó a mano desde Ajustes, queda guardada como `null` y se
        // respeta (no vuelve a aparecer sola).
        examenTablas: guardado.examenTablas !== undefined ? guardado.examenTablas : examenTablasPorDefecto(),
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
    const diasAntes = estado.racha.dias;
    estado.rescateRacha = null; // un rescate solo vale el día en que se perdió la racha
    if (!esPrimeraVez && (!estado.retoDiario.cumplidoHoy || !fueAyer)) {
      estado.racha.dias = 0;
      if (diasAntes > 0) {
        estado.rescateRacha = { fecha: hoy, diasPerdidos: diasAntes, diaPerdido: fechaISO(-1), estado: 'disponible' };
      }
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
      const hoy = hoyISO();
      if (!estado.racha.historial.includes(hoy)) estado.racha.historial.push(hoy);
      estado.racha.historial = estado.racha.historial.slice(-60);
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
  function registrarResultadoArcade(estado, juegoId, dificultadId, puntaje) {
    if (!estado.arcade.juegos[juegoId]) estado.arcade.juegos[juegoId] = { dificultades: dificultadesJuegoPorDefecto() };
    if (!estado.arcade.juegos[juegoId].dificultades[dificultadId]) estado.arcade.juegos[juegoId].dificultades[dificultadId] = { mejorPuntaje: 0, partidasJugadas: 0 };
    const stats = estado.arcade.juegos[juegoId].dificultades[dificultadId];
    stats.partidasJugadas += 1;
    const esRecord = puntaje > stats.mejorPuntaje;
    if (esRecord) stats.mejorPuntaje = puntaje;

    // /10, no /5: Santi cumplía la meta diaria y las metas de premios jugando solo
    // arcade — se bajó a propósito para que el arcade sea un extra, no el camino
    // rápido para lograrlo todo (pedido explícito, junto con subir la dificultad
    // de los juegos en arcade.js).
    const xpGanado = Math.round(puntaje / 10);
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

  function toggleMusica(estado) {
    estado.musica = !estado.musica;
    guardar(estado);
    return estado.musica;
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

  function actualizarModoSoloTablas(estado, activo) {
    estado.modoSoloTablas = !!activo;
    guardar(estado);
    return estado;
  }

  // ===== Rescate de racha =====
  // Pedido explícito del usuario (2026-09-26): un juego de recuperación que SOLO aparece
  // cuando Santi pierde la racha. 10 operaciones de tablas; con 0, 1 o 2 errores la
  // recupera, con 3 o más no. Un solo intento y solo ese día: al empezar queda
  // 'en-curso', así que cerrar la app a mitad de juego cuenta como intento gastado.
  const RESCATE_PREGUNTAS = 10;
  const RESCATE_ERRORES_MAX = 2;

  function rescateDisponible(estado) {
    const r = estado.rescateRacha;
    return !!(r && r.fecha === hoyISO() && r.estado === 'disponible');
  }

  function iniciarRescate(estado) {
    if (!rescateDisponible(estado)) return false;
    estado.rescateRacha.estado = 'en-curso';
    guardar(estado);
    return true;
  }

  function terminarRescate(estado, errores) {
    const r = estado.rescateRacha;
    if (!r || r.estado !== 'en-curso') return { exito: false, dias: estado.racha.dias, logrosNuevos: [], metasNuevas: [] };
    const exito = errores <= RESCATE_ERRORES_MAX;
    r.estado = exito ? 'logrado' : 'fallido';
    const logrosNuevos = [];
    let metasNuevas = [];
    if (exito) {
      // Si hoy ya había cumplido el reto (racha 0 → 1), ese día se suma encima.
      estado.racha.dias = r.diasPerdidos + (estado.retoDiario.cumplidoHoy ? 1 : 0);
      estado.racha.rescatados = (estado.racha.rescatados || []).concat(r.diaPerdido).slice(-30);
      LOGROS.forEach((l) => {
        if (!estado.logros.includes(l.id) && l.condicion(estado)) {
          estado.logros.push(l.id);
          logrosNuevos.push(l);
        }
      });
      metasNuevas = revisarMetasAlcanzadas(estado);
    }
    guardar(estado);
    return { exito, dias: estado.racha.dias, diasPerdidos: r.diasPerdidos, logrosNuevos, metasNuevas };
  }

  // Los 7 días de la semana actual (lunes a domingo) para el widget de racha:
  // cada uno con su letra y si está cumplido / es hoy / es futuro.
  function semanaRacha(estado) {
    const hoy = new Date();
    const hoyStr = isoDe(hoy);
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
    const letras = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    return letras.map((letra, i) => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      const iso = isoDe(d);
      const rescatado = (estado.racha.rescatados || []).includes(iso);
      return { letra, iso, cumplido: estado.racha.historial.includes(iso), rescatado, esHoy: iso === hoyStr, futuro: iso > hoyStr };
    });
  }

  // Reinicia SOLO la racha y el reto del día (pedido explícito del usuario, "volvamos
  // a iniciar desde 00") — a propósito no toca estrellas/XP/logros, que nunca se
  // borran solos en esta app.
  function reiniciarRacha(estado) {
    estado.racha = { dias: 0, ultimaFecha: null, historial: [] };
    estado.rescateRacha = null;
    estado.retoDiario = { fecha: null, xpHoy: 0, cumplidoHoy: false };
    guardar(estado);
    return estado;
  }

  window.SM = window.SM || {};
  window.SM.progreso = {
    LOGROS, cargar, guardar, actualizarProgresoDiario, registrarResultadoNivel, registrarResultadoArcade,
    nivelDesbloqueado, estrellasMundo, sumaEstrellas, reiniciar, toggleSonido, toggleMusica, metaLista,
    marcarLeccionVista, agregarMeta, eliminarMeta, reclamarMeta, mejorPuntajeJuego,
    resetearNivel, resetearPlaneta, actualizarDesafio, actualizarMetaDiaria, coberturaCompleta, coberturaDetalle,
    actualizarModoSoloTablas, reiniciarRacha, semanaRacha, hoyISO,
    rescateDisponible, iniciarRescate, terminarRescate, RESCATE_PREGUNTAS, RESCATE_ERRORES_MAX,
    statsFact, registrarFactTabla, resumenDominioTablas, registrarResultadoMetodoTablas,
    actualizarExamenTablas, togglePlanTablas,
  };
})();
