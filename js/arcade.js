/* SM.arcade — lógica de los mini-juegos de Arcade (Invasores Numéricos, Memoria
   Espacial, Escalera Numérica, Agujeros Negros, Esquiva Asteroides): reglas,
   puntaje, vidas/tiempo, dificultad creciente. La animación y el dibujo en pantalla
   viven en js/ui.js; estos módulos solo llevan el estado del puntaje, igual que
   SM.juego lleva el estado de un nivel normal.

   Cada juego se puede jugar en 4 niveles de dificultad seleccionables
   (`DIFICULTADES_ARCADE`, pedido explícito del usuario) que ajustan tiempo, vidas,
   velocidad/ritmo y qué tan grandes/difíciles son los números — no son partidas
   distintas de verdad, son la MISMA lógica con perillas distintas. */
(function () {
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function elegir(arr) { return arr[randInt(0, arr.length - 1)]; }
  function mezclar(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = randInt(0, i); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  const JUEGOS = [
    { id: 'invasores', nombre: 'Invasores Numéricos', emoji: '👾',
      descripcion: 'Naves con números caen del cielo. Lee la regla y dispara solo a las que la cumplan — ¡cuidado con las trampas!' },
    { id: 'memoria', nombre: 'Memoria Espacial', emoji: '🧠',
      descripcion: 'Voltea cartas y encuentra las parejas de operación y resultado antes de que se acabe el tiempo.' },
    { id: 'escalera', nombre: 'Escalera de Divisores', emoji: '🪜',
      descripcion: 'Aparece un número: calcula su mitad, tercera parte, cuarta parte... y tócalas en orden, de la más chica a la más grande.' },
    { id: 'agujeros', nombre: 'Agujeros Negros', emoji: '🕳️',
      descripcion: 'Números aparecen un instante en los agujeros — tócalos rápido si cumplen la regla antes de que se los trague el agujero negro.' },
    { id: 'asteroides', nombre: 'Esquiva Asteroides', emoji: '☄️',
      descripcion: 'Mueve tu nave entre los 3 carriles: choca con los asteroides correctos y esquiva los que no cumplan la regla.' },
  ];

  const DIFICULTADES_ARCADE = [
    { id: 'principiante', nombre: 'Principiante', emoji: '🐣', vidas: 4, factorTiempo: 1.3, factorVelocidad: 0.65, factorNumeros: 0.65 },
    { id: 'intermedio', nombre: 'Intermedio', emoji: '🚀', vidas: 3, factorTiempo: 1.0, factorVelocidad: 1.0, factorNumeros: 1.0 },
    { id: 'experto', nombre: 'Experto', emoji: '🔥', vidas: 3, factorTiempo: 0.85, factorVelocidad: 1.4, factorNumeros: 1.35 },
    { id: 'maestro', nombre: 'Maestro', emoji: '👑', vidas: 2, factorTiempo: 0.7, factorVelocidad: 1.85, factorNumeros: 1.7 },
  ];
  function obtenerDificultad(id) { return DIFICULTADES_ARCADE.find((d) => d.id === id) || DIFICULTADES_ARCADE[1]; }

  // ==================== BANCO DE REGLAS (Invasores, Agujeros, Asteroides) ====================
  // `factor` agranda o achica los números según la dificultad — se recrea cada vez
  // que hace falta una regla nueva, no es una lista fija como antes.
  // Cada regla lleva `tabla:true/false` para poder filtrar solo las de tablas de
  // multiplicar cuando el "modo enfoque" (`estado.modoSoloTablas`) está activo — ver
  // `elegirRegla(factor, soloTablas)`. Nunca se borró ninguna regla existente: el
  // modo enfoque es temporal y reversible desde Ajustes, así que todo el banco sigue
  // aquí para cuando el usuario lo vuelva a activar.
  function crearReglas(factor) {
    factor = factor || 1;
    return [
      { tabla: true, crear: () => {
        const n = randInt(Math.max(2, Math.round(3 * factor)), Math.max(4, Math.round(9 * factor)));
        return {
          texto: `¡Dispara a los resultados de la TABLA DEL ${n}!`,
          generarValor: () => (Math.random() < 0.55 ? n * randInt(1, 9) : randInt(1, Math.max(20, Math.round(80 * factor)))),
          esCorrecta: (v) => v % n === 0,
          etiqueta: (v) => String(v),
        };
      } },
      { tabla: false, crear: () => {
        const n = randInt(Math.max(8, Math.round(20 * factor)), Math.max(15, Math.round(60 * factor)));
        return {
          texto: `¡Dispara a los números MAYORES que ${n}!`,
          generarValor: () => randInt(Math.max(n - 25, 1), n + 25),
          esCorrecta: (v) => v > n,
          etiqueta: (v) => String(v),
        };
      } },
      { tabla: false, crear: () => {
        const n = randInt(Math.max(8, Math.round(20 * factor)), Math.max(15, Math.round(60 * factor)));
        return {
          texto: `¡Dispara a los números MENORES que ${n}!`,
          generarValor: () => randInt(Math.max(n - 25, 1), n + 25),
          esCorrecta: (v) => v < n,
          etiqueta: (v) => String(v),
        };
      } },
      { tabla: false, crear: () => ({
        texto: '¡Dispara solo a los números PARES!',
        generarValor: () => randInt(1, Math.max(20, Math.round(80 * factor))),
        esCorrecta: (v) => v % 2 === 0,
        etiqueta: (v) => String(v),
      }) },
      { tabla: false, crear: () => ({
        texto: '¡Dispara solo a los números IMPARES!',
        generarValor: () => randInt(1, Math.max(20, Math.round(80 * factor))),
        esCorrecta: (v) => v % 2 === 1,
        etiqueta: (v) => String(v),
      }) },
      { tabla: true, crear: () => {
        const tope = Math.max(4, Math.round(9 * factor));
        const a = randInt(2, tope), b = randInt(2, tope), objetivo = a * b;
        return {
          texto: `¡Dispara a los que valen ${a} × ${b}!`,
          generarValor: () => (Math.random() < 0.4 ? objetivo : Math.max(1, objetivo + elegir([-a, -b, a, b, -2, 2]))),
          esCorrecta: (v) => v === objetivo,
          etiqueta: (v) => String(v),
        };
      } },
      { tabla: false, crear: () => ({
        texto: '¡Dispara a las fracciones MAYORES que 1/2!',
        generarValor: () => { const d = elegir([3, 4, 5, 6, 8]); return { n: randInt(1, d - 1), d }; },
        esCorrecta: (v) => v.n / v.d > 0.5,
        etiqueta: (v) => `${v.n}/${v.d}`,
      }) },
      { tabla: false, crear: () => {
        const tope = Math.max(9, Math.round(20 * factor));
        const a = randInt(3, tope), b = randInt(3, tope), objetivo = a + b;
        return {
          texto: `¡Dispara a los que valen ${a} + ${b}!`,
          generarValor: () => (Math.random() < 0.4 ? objetivo : Math.max(0, objetivo + elegir([-a, -b, a, b, -3, 3, -1, 1]))),
          esCorrecta: (v) => v === objetivo,
          etiqueta: (v) => String(v),
        };
      } },
      { tabla: false, crear: () => {
        const a = randInt(Math.max(10, Math.round(20 * factor)), Math.max(20, Math.round(70 * factor)));
        const b = randInt(Math.max(2, Math.round(5 * factor)), a - 1);
        const objetivo = a - b;
        return {
          texto: `¡Dispara a los que valen ${a} − ${b}!`,
          generarValor: () => (Math.random() < 0.4 ? objetivo : Math.max(0, objetivo + elegir([-b, b, -a, a, -2, 2, -1, 1]))),
          esCorrecta: (v) => v === objetivo,
          etiqueta: (v) => String(v),
        };
      } },
    ];
  }
  function elegirRegla(factor, soloTablas) {
    const todas = crearReglas(factor);
    const pool = soloTablas ? todas.filter((r) => r.tabla) : todas;
    return elegir(pool).crear();
  }

  const DURACION_REGLA = 18;

  // ==================== INVASORES NUMÉRICOS ====================
  function crearPartidaInvasores(dificultadId, soloTablas) {
    const perfil = obtenerDificultad(dificultadId);
    const denomBase = 110 / perfil.factorVelocidad;
    let tiempoRestante = Math.round(75 * perfil.factorTiempo);
    let puntaje = 0;
    let vidas = perfil.vidas;
    let combo = 0;
    let comboMax = 0;
    let reglaActual = elegirRegla(perfil.factorNumeros, soloTablas);
    let tiempoParaCambiarRegla = DURACION_REGLA;
    let terminada = false;

    return {
      puntaje: () => puntaje,
      vidas: () => vidas,
      combo: () => combo,
      comboMax: () => comboMax,
      reglaActual: () => reglaActual,
      tiempoRestante: () => Math.max(0, Math.ceil(tiempoRestante)),
      terminada: () => terminada,
      velocidad: () => Math.min(2.7, 1 + puntaje / denomBase),
      intervaloSpawnMs: () => Math.max(550 / perfil.factorVelocidad, (1400 / perfil.factorVelocidad) / (1 + puntaje / denomBase)),

      generarNave() {
        const valor = reglaActual.generarValor();
        return {
          id: Math.random().toString(36).slice(2),
          valor,
          etiqueta: reglaActual.etiqueta(valor),
          esCorrecta: reglaActual.esCorrecta(valor),
        };
      },

      disparar(nave) {
        if (terminada) return { acierto: false, puntosGanados: 0 };
        if (nave.esCorrecta) {
          combo += 1;
          comboMax = Math.max(comboMax, combo);
          const puntosGanados = 7 * Math.min(combo, 5);
          puntaje += puntosGanados;
          return { acierto: true, puntosGanados };
        }
        combo = 0;
        vidas -= 1;
        if (vidas <= 0) { vidas = 0; terminada = true; }
        return { acierto: false, puntosGanados: 0 };
      },

      naveEscapo(nave) {
        if (nave.esCorrecta) combo = 0;
      },

      tick(dtSegundos) {
        if (terminada) return { terminada: true, reglaNueva: false };
        tiempoRestante -= dtSegundos;
        if (tiempoRestante <= 0) { tiempoRestante = 0; terminada = true; return { terminada: true, reglaNueva: false }; }
        tiempoParaCambiarRegla -= dtSegundos;
        let reglaNueva = false;
        if (tiempoParaCambiarRegla <= 0) { reglaActual = elegirRegla(perfil.factorNumeros, soloTablas); tiempoParaCambiarRegla = DURACION_REGLA; reglaNueva = true; }
        return { terminada: false, reglaNueva };
      },
    };
  }

  // ==================== MEMORIA ESPACIAL ====================
  function generarHechosUnicos(cantidad, factor, soloTablas) {
    factor = factor || 1;
    const resultados = new Set();
    const hechos = [];
    let intentos = 0;
    while (hechos.length < cantidad && intentos < 500) {
      intentos++;
      let enunciado, resultado;
      // Modo enfoque en tablas: SOLO multiplicación, mezclando tablas bajas y altas
      // (hasta la del 12) — nunca solo las fáciles, para que no se quede "pegado".
      const r = soloTablas ? 0 : Math.random();
      if (soloTablas) {
        const tope = Math.min(12, Math.max(6, Math.round(6 + 6 * factor)));
        const a = randInt(1, tope), b = randInt(1, 12);
        enunciado = `${a} × ${b}`; resultado = a * b;
      } else if (r < 0.4) {
        const tope = Math.max(4, Math.round(10 * factor));
        const a = randInt(2, tope), b = randInt(2, tope);
        enunciado = `${a} × ${b}`; resultado = a * b;
      } else if (r < 0.7) {
        const a = randInt(Math.max(5, Math.round(10 * factor)), Math.max(15, Math.round(60 * factor)));
        const b = randInt(Math.max(3, Math.round(5 * factor)), Math.max(10, Math.round(30 * factor)));
        enunciado = `${a} + ${b}`; resultado = a + b;
      } else {
        const a = randInt(Math.max(10, Math.round(20 * factor)), Math.max(20, Math.round(70 * factor)));
        const b = randInt(Math.max(3, Math.round(5 * factor)), a - 1);
        enunciado = `${a} − ${b}`; resultado = a - b;
      }
      if (!resultados.has(resultado)) { resultados.add(resultado); hechos.push({ enunciado, resultado: String(resultado) }); }
    }
    return hechos;
  }

  const PARES_POR_DIFICULTAD = { principiante: 6, intermedio: 8, experto: 10, maestro: 12 };
  function crearPartidaMemoria(dificultadId, soloTablas) {
    const perfil = obtenerDificultad(dificultadId);
    const numPares = PARES_POR_DIFICULTAD[perfil.id] || 8;
    const hechos = generarHechosUnicos(numPares, perfil.factorNumeros, soloTablas);
    let cartas = [];
    hechos.forEach((h, i) => {
      cartas.push({ id: `${i}a`, grupo: i, texto: h.enunciado, encontrada: false });
      cartas.push({ id: `${i}b`, grupo: i, texto: h.resultado, encontrada: false });
    });
    cartas = mezclar(cartas);

    let volteadas = [];
    let puntaje = 0;
    let movimientos = 0;
    let paresEncontrados = 0;
    let combo = 0;
    let comboMax = 0;
    let tiempoRestante = Math.round(100 * perfil.factorTiempo);
    let terminada = false;

    return {
      cartas: () => cartas,
      puntaje: () => puntaje,
      movimientos: () => movimientos,
      paresEncontrados: () => paresEncontrados,
      totalPares: () => numPares,
      volteadas: () => volteadas,
      comboMax: () => comboMax,
      terminada: () => terminada,
      tiempoRestante: () => Math.max(0, Math.ceil(tiempoRestante)),

      // Devuelve 'esperando' (primera carta), 'acierto'/'fallo' (segunda carta) o 'ignorado'.
      voltear(id) {
        if (terminada) return { resultado: 'ignorado' };
        const carta = cartas.find((c) => c.id === id);
        if (!carta || carta.encontrada || volteadas.includes(id) || volteadas.length >= 2) return { resultado: 'ignorado' };
        volteadas.push(id);
        if (volteadas.length === 1) return { resultado: 'esperando' };

        movimientos++;
        const [id1, id2] = volteadas;
        const c1 = cartas.find((c) => c.id === id1);
        const c2 = cartas.find((c) => c.id === id2);
        if (c1.grupo === c2.grupo) {
          c1.encontrada = true; c2.encontrada = true;
          combo++; comboMax = Math.max(comboMax, combo);
          const puntos = 14 * Math.min(combo, 4);
          puntaje += puntos;
          paresEncontrados++;
          volteadas = [];
          if (paresEncontrados >= numPares) terminada = true;
          return { resultado: 'acierto', puntos };
        }
        combo = 0;
        return { resultado: 'fallo' }; // la UI debe llamar confirmarFallo() tras un breve delay
      },

      confirmarFallo() { volteadas = []; },

      tick(dtSegundos) {
        if (terminada) return true;
        tiempoRestante -= dtSegundos;
        if (tiempoRestante <= 0) { tiempoRestante = 0; terminada = true; }
        return terminada;
      },
    };
  }

  // ==================== ESCALERA DE DIVISORES ====================
  // Rediseñado a pedido del usuario: la versión anterior (tocar números al azar en
  // orden ascendente) se resolvía solo mirando, sin pensar de verdad, y por eso Santi
  // llegaba a la meta "super rápido". Ahora cada ronda muestra UN número compartido
  // (`numeroBase`, siempre múltiplo de 120 para que todas las partes den exacto) y
  // los tiles muestran la OPERACIÓN (½, ⅓, ¼...), no el resultado — hay que calcular
  // mentalmente cada parte para poder ordenarlas de menor a mayor resultado.
  const PARTES = {
    2: { etiqueta: '½', nombre: 'la mitad' },
    3: { etiqueta: '⅓', nombre: 'la tercera parte' },
    4: { etiqueta: '¼', nombre: 'la cuarta parte' },
    5: { etiqueta: '⅕', nombre: 'la quinta parte' },
    6: { etiqueta: '⅙', nombre: 'la sexta parte' },
    8: { etiqueta: '⅛', nombre: 'la octava parte' },
    10: { etiqueta: '⅒', nombre: 'la décima parte' },
  };
  // Cada dificultad usa un pool fijo de partes (no solo tiles más numerosas): a más
  // dificultad, denominadores mentalmente más difíciles (6, 8) se suman al pool.
  const PARTES_POR_DIFICULTAD = {
    principiante: [2, 4, 5, 10],
    intermedio: [2, 3, 4, 5, 10],
    experto: [2, 3, 4, 5, 6, 10],
    maestro: [2, 3, 4, 5, 6, 8, 10],
  };
  // Modo enfoque en tablas: en vez de partes de un número, los tiles son productos
  // a×b DISTINTOS (ej. "7 × 8" y "6 × 9") que hay que calcular y ordenar de menor a
  // mayor resultado — como los resultados quedan cerca entre sí (56 vs 54), no se
  // puede ordenar solo mirando el enunciado, hay que saberse las tablas de verdad.
  const RANGO_TABLAS_POR_DIFICULTAD = {
    principiante: { min: 1, max: 6 },
    intermedio: { min: 1, max: 9 },
    experto: { min: 2, max: 11 },
    maestro: { min: 1, max: 12 },
  };
  function crearPartidaEscalera(dificultadId, soloTablas) {
    const perfil = obtenerDificultad(dificultadId);
    const denominadores = PARTES_POR_DIFICULTAD[perfil.id] || PARTES_POR_DIFICULTAD.intermedio;
    const rangoTablas = RANGO_TABLAS_POR_DIFICULTAD[perfil.id] || RANGO_TABLAS_POR_DIFICULTAD.intermedio;
    let tiempoRestante = Math.round(75 * perfil.factorTiempo);
    let puntaje = 0;
    let vidas = perfil.vidas;
    let escalon = 0;
    let combo = 0;
    let comboMax = 0;
    let terminada = false;
    let tiles = [];
    let ordenObjetivo = [];
    let indiceEsperado = 0;
    let numeroBase = 0;
    const cantidadTiles = (PARTES_POR_DIFICULTAD[perfil.id] || PARTES_POR_DIFICULTAD.intermedio).length;

    function nuevaRondaTablas() {
      numeroBase = null;
      const usados = new Set();
      const pares = [];
      let intentos = 0;
      while (pares.length < cantidadTiles && intentos < 300) {
        intentos++;
        const a = randInt(rangoTablas.min, rangoTablas.max);
        const b = randInt(1, 12);
        const valor = a * b;
        if (!usados.has(valor)) { usados.add(valor); pares.push({ a, b, valor }); }
      }
      tiles = mezclar(pares.map((p, i) => ({ id: `${escalon}-${i}`, valor: p.valor, etiqueta: `${p.a} × ${p.b}`, nombre: `${p.a} por ${p.b}` })));
    }
    function nuevaRondaPartes() {
      const multiplo = Math.max(1, Math.round((1 + escalon) * perfil.factorNumeros));
      numeroBase = 120 * multiplo; // 120 es divisible entre 2,3,4,5,6,8,10 — siempre da exacto
      const base = denominadores.map((d, i) => ({ id: `${escalon}-${i}-${d}`, valor: numeroBase / d, etiqueta: PARTES[d].etiqueta, nombre: PARTES[d].nombre }));
      tiles = mezclar(base);
    }
    function nuevaRonda() {
      if (soloTablas) nuevaRondaTablas(); else nuevaRondaPartes();
      ordenObjetivo = [...tiles].sort((a, b) => a.valor - b.valor).map((t) => t.id);
      indiceEsperado = 0;
    }
    nuevaRonda();

    return {
      tiles: () => tiles,
      numeroBase: () => numeroBase,
      puntaje: () => puntaje,
      vidas: () => vidas,
      escalon: () => escalon,
      comboMax: () => comboMax,
      terminada: () => terminada,
      tiempoRestante: () => Math.max(0, Math.ceil(tiempoRestante)),
      siguienteEsperada: () => ordenObjetivo[indiceEsperado],

      tocar(id) {
        if (terminada) return { correcto: false };
        const esperadaId = ordenObjetivo[indiceEsperado];
        if (id === esperadaId) {
          indiceEsperado++;
          combo++; comboMax = Math.max(comboMax, combo);
          const puntos = 7 * Math.min(combo, 5);
          puntaje += puntos;
          let escalonCompleto = false;
          if (indiceEsperado >= ordenObjetivo.length) {
            escalon++;
            nuevaRonda();
            escalonCompleto = true;
          }
          return { correcto: true, puntos, escalonCompleto };
        }
        combo = 0;
        vidas--;
        if (vidas <= 0) { vidas = 0; terminada = true; }
        return { correcto: false };
      },

      tick(dtSegundos) {
        if (terminada) return true;
        tiempoRestante -= dtSegundos;
        if (tiempoRestante <= 0) { tiempoRestante = 0; terminada = true; }
        return terminada;
      },
    };
  }

  // ==================== AGUJEROS NEGROS ====================
  // "Whack-a-mole" con regla: los huecos se iluminan un instante con un número;
  // hay que tocarlos mientras están activos si cumplen la regla (reusa crearReglas).
  const NUM_HUECOS = 9;
  function crearPartidaAgujeros(dificultadId, soloTablas) {
    const perfil = obtenerDificultad(dificultadId);
    let tiempoRestante = Math.round(60 * perfil.factorTiempo);
    let puntaje = 0, vidas = perfil.vidas, combo = 0, comboMax = 0;
    let reglaActual = elegirRegla(perfil.factorNumeros, soloTablas);
    let tiempoParaCambiarRegla = DURACION_REGLA;
    let terminada = false;
    let acumuladorSpawn = 0;
    const huecos = Array.from({ length: NUM_HUECOS }, (_, i) => ({ id: i, activo: false, etiqueta: '', esCorrecta: false, tiempoVida: 0 }));

    function intervaloSpawnMs() { return Math.max(480 / perfil.factorVelocidad, (1050 - puntaje * 4) / perfil.factorVelocidad); }
    function duracionHuecoMs() { return Math.max(650 / perfil.factorVelocidad, (1250 - puntaje * 3) / perfil.factorVelocidad); }

    return {
      huecos: () => huecos,
      puntaje: () => puntaje,
      vidas: () => vidas,
      reglaActual: () => reglaActual,
      tiempoRestante: () => Math.max(0, Math.ceil(tiempoRestante)),
      terminada: () => terminada,
      comboMax: () => comboMax,

      tocar(id) {
        const h = huecos[id];
        if (terminada || !h.activo) return { resultado: 'ignorado' };
        h.activo = false;
        if (h.esCorrecta) {
          combo++; comboMax = Math.max(comboMax, combo);
          const puntos = 8 * Math.min(combo, 5);
          puntaje += puntos;
          return { resultado: 'acierto', puntos };
        }
        combo = 0;
        vidas--;
        if (vidas <= 0) { vidas = 0; terminada = true; }
        return { resultado: 'fallo' };
      },

      tick(dtSegundos) {
        if (terminada) return { terminada: true, reglaNueva: false };
        tiempoRestante -= dtSegundos;
        if (tiempoRestante <= 0) { tiempoRestante = 0; terminada = true; return { terminada: true, reglaNueva: false }; }
        tiempoParaCambiarRegla -= dtSegundos;
        let reglaNueva = false;
        if (tiempoParaCambiarRegla <= 0) { reglaActual = elegirRegla(perfil.factorNumeros, soloTablas); tiempoParaCambiarRegla = DURACION_REGLA; reglaNueva = true; }

        huecos.forEach((h) => {
          if (h.activo) {
            h.tiempoVida -= dtSegundos * 1000;
            if (h.tiempoVida <= 0) {
              h.activo = false;
              if (h.esCorrecta) combo = 0;
            }
          }
        });

        acumuladorSpawn += dtSegundos * 1000;
        if (acumuladorSpawn >= intervaloSpawnMs()) {
          acumuladorSpawn = 0;
          const libres = huecos.filter((h) => !h.activo);
          if (libres.length) {
            const h = elegir(libres);
            const valor = reglaActual.generarValor();
            h.activo = true;
            h.etiqueta = reglaActual.etiqueta(valor);
            h.esCorrecta = reglaActual.esCorrecta(valor);
            h.tiempoVida = duracionHuecoMs();
          }
        }

        return { terminada: false, reglaNueva };
      },
    };
  }

  // ==================== ESQUIVA ASTEROIDES ====================
  // Nave en 3 carriles: hay que moverse al carril del asteroide correcto antes de
  // que llegue abajo, y esquivar los que no cumplan la regla (reusa crearReglas).
  const CARRILES = 3;
  function crearPartidaAsteroides(dificultadId, soloTablas) {
    const perfil = obtenerDificultad(dificultadId);
    const denomBase = 110 / perfil.factorVelocidad;
    let tiempoRestante = Math.round(75 * perfil.factorTiempo);
    let carrilActual = 1;
    let puntaje = 0, vidas = perfil.vidas, combo = 0, comboMax = 0;
    let terminada = false;
    let objetos = [];
    let reglaActual = elegirRegla(perfil.factorNumeros, soloTablas);
    let tiempoParaCambiarRegla = DURACION_REGLA;
    let acumuladorSpawn = 0;
    let contadorId = 0;

    function velocidad() { return Math.min(2.3, 1 + puntaje / denomBase); }

    return {
      objetos: () => objetos,
      carrilActual: () => carrilActual,
      puntaje: () => puntaje,
      vidas: () => vidas,
      reglaActual: () => reglaActual,
      tiempoRestante: () => Math.max(0, Math.ceil(tiempoRestante)),
      terminada: () => terminada,
      comboMax: () => comboMax,

      moverA(carril) { carrilActual = Math.max(0, Math.min(CARRILES - 1, carril)); },

      tick(dtSegundos) {
        if (terminada) return { terminada: true, reglaNueva: false };
        tiempoRestante -= dtSegundos;
        if (tiempoRestante <= 0) { tiempoRestante = 0; terminada = true; return { terminada: true, reglaNueva: false }; }
        tiempoParaCambiarRegla -= dtSegundos;
        let reglaNueva = false;
        if (tiempoParaCambiarRegla <= 0) { reglaActual = elegirRegla(perfil.factorNumeros, soloTablas); tiempoParaCambiarRegla = DURACION_REGLA; reglaNueva = true; }

        const avance = dtSegundos * 0.4 * velocidad();
        objetos.forEach((o) => { o.distancia += avance; });

        const restantes = [];
        objetos.forEach((o) => {
          if (o.distancia >= 1) {
            if (o.carril === carrilActual) {
              if (o.esCorrecta) {
                combo++; comboMax = Math.max(comboMax, combo);
                puntaje += 6 * Math.min(combo, 5);
              } else {
                combo = 0;
                vidas--;
                if (vidas <= 0) { vidas = 0; terminada = true; }
              }
            } else if (o.esCorrecta) {
              combo = 0;
            }
          } else {
            restantes.push(o);
          }
        });
        objetos = restantes;

        acumuladorSpawn += dtSegundos * 1000;
        const intervalo = Math.max(480 / perfil.factorVelocidad, (950 / perfil.factorVelocidad) / velocidad());
        if (acumuladorSpawn >= intervalo) {
          acumuladorSpawn = 0;
          const valor = reglaActual.generarValor();
          objetos.push({
            id: contadorId++, carril: randInt(0, CARRILES - 1), distancia: 0,
            etiqueta: reglaActual.etiqueta(valor), esCorrecta: reglaActual.esCorrecta(valor),
          });
        }

        return { terminada, reglaNueva };
      },
    };
  }

  window.SM = window.SM || {};
  window.SM.arcade = {
    JUEGOS, DIFICULTADES_ARCADE, obtenerDificultad,
    crearPartidaInvasores, crearPartidaMemoria, crearPartidaEscalera,
    crearPartidaAgujeros, crearPartidaAsteroides,
  };
})();
