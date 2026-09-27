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
    // 4 juegos nuevos (pedido explícito del usuario, 2026-09-26).
    { id: 'serpiente', nombre: 'Serpiente Numérica', emoji: '🐍',
      descripcion: 'Guía la serpiente con las flechas o deslizando el dedo y cómete la fruta con el resultado correcto. Si te comes una equivocada o chocas, pierdes una vida.' },
    { id: 'globos', nombre: 'Revienta Globos', emoji: '🎈',
      descripcion: 'Suben globos con números: lee la regla y revienta solo los que la cumplen antes de que se escapen. ¡Si revientas uno equivocado pierdes una vida!' },
    { id: 'tunel', nombre: 'Túnel Hiperespacial', emoji: '🌀',
      descripcion: 'Viajas a toda velocidad y se acercan 3 puertas con números: cámbiate al carril con la respuesta correcta antes de cruzarlas. ¡Cada vez va más rápido!' },
    { id: 'carrera', nombre: 'Carrera contra Cosmo', emoji: '🏁',
      descripcion: 'Cada respuesta correcta acelera tu nave; Cosmo avanza solo. Si te equivocas, tu motor se ahoga un momento. ¡Llega primero a la meta!' },
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

  // ==================== GENERADOR DE PROBLEMAS (Serpiente, Túnel, Carrera) ====================
  // Un problema con UNA respuesta numérica y distractores parecidos a la correcta (para
  // que el error enseñe). Con el modo enfoque solo salen multiplicaciones de tablas.
  function distractoresDe(correcta, candidatos, cantidad) {
    const usados = new Set([correcta]);
    const salida = [];
    mezclar(candidatos).forEach((c) => {
      if (salida.length < cantidad && c > 0 && !usados.has(c)) { usados.add(c); salida.push(c); }
    });
    let k = 1;
    while (salida.length < cantidad) {
      [correcta + k, correcta - k].forEach((c) => {
        if (salida.length < cantidad && c > 0 && !usados.has(c)) { usados.add(c); salida.push(c); }
      });
      k++;
    }
    return salida;
  }
  function crearProblema(factor, soloTablas) {
    factor = factor || 1;
    const tipo = soloTablas ? 'x' : elegir(['x', 'x', '+', '-']);
    let texto, respuesta, candidatos;
    if (tipo === 'x') {
      const tope = Math.max(5, Math.min(12, Math.round(9 * factor)));
      const a = randInt(2, tope), b = randInt(2, tope);
      texto = `${a} × ${b}`; respuesta = a * b;
      candidatos = [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, respuesta + 10, respuesta - 10, respuesta + 1, respuesta - 1];
    } else if (tipo === '+') {
      const tope = Math.max(12, Math.round(35 * factor));
      const a = randInt(3, tope), b = randInt(3, tope);
      texto = `${a} + ${b}`; respuesta = a + b;
      candidatos = [respuesta + 1, respuesta - 1, respuesta + 10, respuesta - 10, respuesta + 2, respuesta - 2];
    } else {
      const a = randInt(Math.max(12, Math.round(20 * factor)), Math.max(25, Math.round(70 * factor)));
      const b = randInt(2, a - 1);
      texto = `${a} − ${b}`; respuesta = a - b;
      candidatos = [respuesta + 1, respuesta - 1, respuesta + 10, respuesta - 10, a + b, respuesta + 2];
    }
    return {
      texto, respuesta,
      opciones(n) { return mezclar([respuesta, ...distractoresDe(respuesta, candidatos, n - 1)]); },
      incorrecta() { return distractoresDe(respuesta, candidatos, 1)[0]; },
    };
  }

  // ==================== SERPIENTE NUMÉRICA ====================
  // Tablero de 9×11. La serpiente avanza sola a pasos; en el tablero hay 3 frutas con
  // números y solo una es el resultado del problema de arriba. Comer la correcta = crece
  // y suma; comer una equivocada o chocar = pierde una vida (al chocar vuelve al centro).
  const SERP_COLS = 9;
  const SERP_FILAS = 11;
  function crearPartidaSerpiente(dificultadId, soloTablas) {
    const perfil = obtenerDificultad(dificultadId);
    let tiempoRestante = Math.round(90 * perfil.factorTiempo);
    let puntaje = 0, vidas = perfil.vidas, combo = 0, comboMax = 0, comidas = 0;
    let terminada = false;
    let cuerpo, dir, dirPendiente;
    let problema = crearProblema(perfil.factorNumeros, soloTablas);
    let frutas = [];
    let acumulador = 0;
    let contadorId = 0;

    function reiniciarSerpiente() {
      const cx = Math.floor(SERP_COLS / 2), cy = Math.floor(SERP_FILAS / 2) + 1;
      cuerpo = [{ x: cx, y: cy }, { x: cx, y: cy + 1 }, { x: cx, y: cy + 2 }];
      dir = { x: 0, y: -1 };
      dirPendiente = dir;
    }
    function ocupada(x, y) {
      return cuerpo.some((c) => c.x === x && c.y === y) || frutas.some((f) => f.x === x && f.y === y);
    }
    function celdaLibre() {
      const cabeza = cuerpo[0];
      for (let intento = 0; intento < 200; intento++) {
        const x = randInt(0, SERP_COLS - 1), y = randInt(0, SERP_FILAS - 1);
        if (ocupada(x, y)) continue;
        if (Math.abs(x - cabeza.x) + Math.abs(y - cabeza.y) < 3) continue;
        return { x, y };
      }
      return { x: 0, y: 0 };
    }
    function ponerFrutas() {
      frutas = [];
      const valores = problema.opciones(3);
      valores.forEach((v) => {
        const celda = celdaLibre();
        frutas.push({ id: contadorId++, x: celda.x, y: celda.y, valor: v, esCorrecta: v === problema.respuesta });
      });
    }
    function pasoSeg() {
      return Math.max(0.13, (0.42 / perfil.factorVelocidad) * Math.pow(0.97, comidas));
    }
    function perderVida() {
      combo = 0;
      vidas -= 1;
      if (vidas <= 0) { vidas = 0; terminada = true; }
    }

    reiniciarSerpiente();
    ponerFrutas();

    function mover() {
      if (!(dirPendiente.x === -dir.x && dirPendiente.y === -dir.y)) dir = dirPendiente;
      const cabeza = { x: cuerpo[0].x + dir.x, y: cuerpo[0].y + dir.y };
      const fuera = cabeza.x < 0 || cabeza.y < 0 || cabeza.x >= SERP_COLS || cabeza.y >= SERP_FILAS;
      const seMuerde = cuerpo.slice(0, -1).some((c) => c.x === cabeza.x && c.y === cabeza.y);
      if (fuera || seMuerde) {
        perderVida();
        reiniciarSerpiente();
        frutas.forEach((f) => { if (cuerpo.some((c) => c.x === f.x && c.y === f.y)) { const c = celdaLibre(); f.x = c.x; f.y = c.y; } });
        return 'choque';
      }
      const fruta = frutas.find((f) => f.x === cabeza.x && f.y === cabeza.y);
      cuerpo.unshift(cabeza);
      if (fruta && fruta.esCorrecta) {
        combo += 1; comboMax = Math.max(comboMax, combo); comidas += 1;
        puntaje += 7 * Math.min(combo, 5);
        problema = crearProblema(perfil.factorNumeros, soloTablas);
        ponerFrutas();
        return 'come';
      }
      cuerpo.pop();
      if (fruta) {
        perderVida();
        frutas = frutas.filter((f) => f !== fruta);
        const c = celdaLibre();
        frutas.push({ id: contadorId++, x: c.x, y: c.y, valor: problema.incorrecta(), esCorrecta: false });
        return 'error';
      }
      return 'paso';
    }

    return {
      COLS: SERP_COLS, FILAS: SERP_FILAS,
      cuerpo: () => cuerpo, frutas: () => frutas, problema: () => problema,
      puntaje: () => puntaje, vidas: () => vidas, comboMax: () => comboMax,
      tiempoRestante: () => Math.max(0, Math.ceil(tiempoRestante)),
      terminada: () => terminada,
      cambiarDireccion(nombre) {
        const mapa = { arriba: { x: 0, y: -1 }, abajo: { x: 0, y: 1 }, izquierda: { x: -1, y: 0 }, derecha: { x: 1, y: 0 } };
        if (mapa[nombre]) dirPendiente = mapa[nombre];
      },
      tick(dtSegundos) {
        if (terminada) return { terminada: true, eventos: [] };
        tiempoRestante -= dtSegundos;
        if (tiempoRestante <= 0) { tiempoRestante = 0; terminada = true; return { terminada: true, eventos: [] }; }
        const eventos = [];
        acumulador += dtSegundos;
        while (acumulador >= pasoSeg() && !terminada) {
          acumulador -= pasoSeg();
          eventos.push(mover());
        }
        return { terminada, eventos };
      },
    };
  }

  // ==================== REVIENTA GLOBOS ====================
  // Globos con números suben desde abajo (con un vaivén); se revientan tocándolos.
  // Reusa el banco de reglas de Invasores/Agujeros/Asteroides, con el texto adaptado.
  function reglaGlobos(factor, soloTablas) {
    const r = elegirRegla(factor, soloTablas);
    r.texto = r.texto.replace('¡Dispara solo a ', '¡Revienta ').replace('¡Dispara a ', '¡Revienta ');
    return r;
  }
  function crearPartidaGlobos(dificultadId, soloTablas) {
    const perfil = obtenerDificultad(dificultadId);
    const denomBase = 110 / perfil.factorVelocidad;
    let tiempoRestante = Math.round(75 * perfil.factorTiempo);
    let puntaje = 0, vidas = perfil.vidas, combo = 0, comboMax = 0;
    let terminada = false;
    let reglaActual = reglaGlobos(perfil.factorNumeros, soloTablas);
    let tiempoParaCambiarRegla = DURACION_REGLA;
    let globos = [];
    let acumuladorSpawn = 600;
    let contadorId = 0;
    const COLORES = ['#ff5c72', '#4fd1ff', '#ffd23f', '#3fd67a', '#ff8a3d', '#a78bfa', '#ff6fae'];

    function velocidad() { return Math.min(2.4, 1 + puntaje / denomBase); }

    return {
      globos: () => globos, reglaActual: () => reglaActual,
      puntaje: () => puntaje, vidas: () => vidas, comboMax: () => comboMax,
      tiempoRestante: () => Math.max(0, Math.ceil(tiempoRestante)),
      terminada: () => terminada,
      reventar(id) {
        const g = globos.find((x) => x.id === id);
        if (!g || terminada) return null;
        globos = globos.filter((x) => x !== g);
        if (g.esCorrecta) {
          combo += 1; comboMax = Math.max(comboMax, combo);
          const puntosGanados = 7 * Math.min(combo, 5);
          puntaje += puntosGanados;
          return { acierto: true, puntosGanados, globo: g };
        }
        combo = 0;
        vidas -= 1;
        if (vidas <= 0) { vidas = 0; terminada = true; }
        return { acierto: false, puntosGanados: 0, globo: g };
      },
      tick(dtSegundos) {
        if (terminada) return { terminada: true, reglaNueva: false, escapados: [] };
        tiempoRestante -= dtSegundos;
        if (tiempoRestante <= 0) { tiempoRestante = 0; terminada = true; return { terminada: true, reglaNueva: false, escapados: [] }; }
        tiempoParaCambiarRegla -= dtSegundos;
        let reglaNueva = false;
        if (tiempoParaCambiarRegla <= 0) { reglaActual = reglaGlobos(perfil.factorNumeros, soloTablas); tiempoParaCambiarRegla = DURACION_REGLA; reglaNueva = true; }
        const escapados = [];
        globos.forEach((g) => { g.subida += dtSegundos * 0.13 * velocidad() * g.ritmo; g.fase += dtSegundos * 2.2; });
        globos = globos.filter((g) => {
          if (g.subida < 1) return true;
          if (g.esCorrecta) combo = 0;
          escapados.push(g);
          return false;
        });
        acumuladorSpawn += dtSegundos * 1000;
        const intervalo = Math.max(520 / perfil.factorVelocidad, (1250 / perfil.factorVelocidad) / velocidad());
        if (acumuladorSpawn >= intervalo) {
          acumuladorSpawn = 0;
          const valor = reglaActual.generarValor();
          globos.push({
            id: contadorId++, x: randInt(10, 88), subida: 0, fase: Math.random() * 6, ritmo: 0.85 + Math.random() * 0.35,
            color: elegir(COLORES), etiqueta: reglaActual.etiqueta(valor), esCorrecta: reglaActual.esCorrecta(valor),
          });
        }
        return { terminada, reglaNueva, escapados };
      },
    };
  }

  // ==================== TÚNEL HIPERESPACIAL ====================
  // Una fila de 3 puertas con números se acerca (efecto de perspectiva en la UI). Arriba
  // está el problema: hay que estar en el carril de la respuesta correcta cuando la fila
  // llega. Una fila = un problema; la velocidad sube con el puntaje.
  function crearPartidaTunel(dificultadId, soloTablas) {
    const perfil = obtenerDificultad(dificultadId);
    let tiempoRestante = Math.round(80 * perfil.factorTiempo);
    let puntaje = 0, vidas = perfil.vidas, combo = 0, comboMax = 0;
    let terminada = false;
    let carrilActual = 1;
    let fila = null;
    let pausa = 0.6;
    let contadorId = 0;

    function velocidad() { return Math.min(2.3, 1 + puntaje / 160); }
    function nuevaFila() {
      const problema = crearProblema(perfil.factorNumeros, soloTablas);
      fila = { id: contadorId++, problema, valores: problema.opciones(3), distancia: 0 };
    }

    return {
      fila: () => fila, carrilActual: () => carrilActual,
      puntaje: () => puntaje, vidas: () => vidas, comboMax: () => comboMax,
      tiempoRestante: () => Math.max(0, Math.ceil(tiempoRestante)),
      terminada: () => terminada,
      moverA(c) { carrilActual = Math.max(0, Math.min(2, c)); },
      tick(dtSegundos) {
        if (terminada) return { terminada: true, cruce: null };
        tiempoRestante -= dtSegundos;
        if (tiempoRestante <= 0) { tiempoRestante = 0; terminada = true; return { terminada: true, cruce: null }; }
        if (!fila) {
          pausa -= dtSegundos;
          if (pausa <= 0) nuevaFila();
          return { terminada, cruce: null };
        }
        fila.distancia += dtSegundos * 0.2 * perfil.factorVelocidad * velocidad();
        if (fila.distancia < 1) return { terminada, cruce: null };
        const carrilCorrecto = fila.valores.indexOf(fila.problema.respuesta);
        const acierto = carrilActual === carrilCorrecto;
        if (acierto) {
          combo += 1; comboMax = Math.max(comboMax, combo);
          puntaje += 8 * Math.min(combo, 5);
        } else {
          combo = 0;
          vidas -= 1;
          if (vidas <= 0) { vidas = 0; terminada = true; }
        }
        const cruce = { acierto, carrilCorrecto, problema: fila.problema };
        fila = null;
        pausa = 0.35;
        return { terminada, cruce };
      },
    };
  }

  // ==================== CARRERA CONTRA COSMO ====================
  // Meta a 12 respuestas correctas. Cosmo avanza solo (más rápido según dificultad).
  // Equivocarse ahoga el motor 1,2 s. Ganar da un bono por el tiempo que le sobró.
  const CARRERA_META = 12;
  function crearPartidaCarrera(dificultadId, soloTablas) {
    const perfil = obtenerDificultad(dificultadId);
    const segundosCosmo = 70 / Math.pow(perfil.factorVelocidad, 0.6);
    let santi = 0, cosmo = 0;
    let puntaje = 0, combo = 0, comboMax = 0, errores = 0;
    let bloqueo = 0;
    let terminada = false, gano = false;
    let problema = crearProblema(perfil.factorNumeros, soloTablas);
    let opciones = problema.opciones(4);

    return {
      META: CARRERA_META,
      avanceSanti: () => santi / CARRERA_META, avanceCosmo: () => Math.min(1, cosmo),
      problema: () => problema, opciones: () => opciones,
      puntaje: () => puntaje, comboMax: () => comboMax, errores: () => errores,
      bloqueado: () => bloqueo > 0, gano: () => gano, terminada: () => terminada,
      segundosCosmoRestantes: () => Math.max(0, Math.ceil((1 - cosmo) * segundosCosmo)),
      responder(valor) {
        if (terminada || bloqueo > 0) return null;
        if (Number(valor) === problema.respuesta) {
          santi += 1; combo += 1; comboMax = Math.max(comboMax, combo);
          puntaje += 8 * Math.min(combo, 5);
          if (santi >= CARRERA_META) {
            gano = true; terminada = true;
            puntaje += 30 + Math.round((1 - cosmo) * segundosCosmo * 2);
          } else {
            problema = crearProblema(perfil.factorNumeros, soloTablas);
            opciones = problema.opciones(4);
          }
          return { acierto: true };
        }
        combo = 0; errores += 1;
        bloqueo = 1.2;
        return { acierto: false, respuesta: problema.respuesta };
      },
      tick(dtSegundos) {
        if (terminada) return { terminada: true };
        if (bloqueo > 0) bloqueo = Math.max(0, bloqueo - dtSegundos);
        cosmo += dtSegundos / segundosCosmo;
        if (cosmo >= 1) { cosmo = 1; terminada = true; }
        return { terminada };
      },
    };
  }

  window.SM = window.SM || {};
  window.SM.arcade = {
    JUEGOS, DIFICULTADES_ARCADE, obtenerDificultad,
    crearPartidaInvasores, crearPartidaMemoria, crearPartidaEscalera,
    crearPartidaAgujeros, crearPartidaAsteroides,
    crearPartidaSerpiente, crearPartidaGlobos, crearPartidaTunel, crearPartidaCarrera,
  };
})();
