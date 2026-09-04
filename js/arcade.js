/* SM.arcade — lógica de los mini-juegos de Arcade (Invasores Numéricos, Memoria
   Espacial, Escalera Numérica): reglas, puntaje, vidas/tiempo, dificultad creciente.
   La animación y el dibujo en pantalla viven en js/ui.js; estos módulos solo llevan
   el estado del puntaje, igual que SM.juego lleva el estado de un nivel normal. */
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
    { id: 'escalera', nombre: 'Escalera Numérica', emoji: '🪜',
      descripcion: 'Toca los números en orden de menor a mayor lo más rápido posible para subir escalones.' },
    { id: 'agujeros', nombre: 'Agujeros Negros', emoji: '🕳️',
      descripcion: 'Números aparecen un instante en los agujeros — tócalos rápido si cumplen la regla antes de que se los trague el agujero negro.' },
    { id: 'asteroides', nombre: 'Esquiva Asteroides', emoji: '☄️',
      descripcion: 'Mueve tu nave entre los 3 carriles: choca con los asteroides correctos y esquiva los que no cumplan la regla.' },
  ];

  // ==================== INVASORES NUMÉRICOS ====================
  const REGLAS = [
    () => {
      const n = randInt(3, 9);
      return {
        texto: `¡Dispara a los MÚLTIPLOS de ${n}!`,
        generarValor: () => (Math.random() < 0.55 ? n * randInt(1, 9) : randInt(1, 80)),
        esCorrecta: (v) => v % n === 0,
        etiqueta: (v) => String(v),
      };
    },
    () => {
      const n = randInt(20, 60);
      return {
        texto: `¡Dispara a los números MAYORES que ${n}!`,
        generarValor: () => randInt(Math.max(n - 25, 1), n + 25),
        esCorrecta: (v) => v > n,
        etiqueta: (v) => String(v),
      };
    },
    () => {
      const n = randInt(20, 60);
      return {
        texto: `¡Dispara a los números MENORES que ${n}!`,
        generarValor: () => randInt(Math.max(n - 25, 1), n + 25),
        esCorrecta: (v) => v < n,
        etiqueta: (v) => String(v),
      };
    },
    () => ({
      texto: '¡Dispara solo a los números PARES!',
      generarValor: () => randInt(1, 80),
      esCorrecta: (v) => v % 2 === 0,
      etiqueta: (v) => String(v),
    }),
    () => ({
      texto: '¡Dispara solo a los números IMPARES!',
      generarValor: () => randInt(1, 80),
      esCorrecta: (v) => v % 2 === 1,
      etiqueta: (v) => String(v),
    }),
    () => {
      const a = randInt(2, 9), b = randInt(2, 9), objetivo = a * b;
      return {
        texto: `¡Dispara a los que valen ${a} × ${b}!`,
        generarValor: () => (Math.random() < 0.4 ? objetivo : Math.max(1, objetivo + elegir([-a, -b, a, b, -2, 2]))),
        esCorrecta: (v) => v === objetivo,
        etiqueta: (v) => String(v),
      };
    },
    () => ({
      texto: '¡Dispara a las fracciones MAYORES que 1/2!',
      generarValor: () => { const d = elegir([3, 4, 5, 6, 8]); return { n: randInt(1, d - 1), d }; },
      esCorrecta: (v) => v.n / v.d > 0.5,
      etiqueta: (v) => `${v.n}/${v.d}`,
    }),
  ];

  const DURACION_REGLA = 18;

  function crearPartidaInvasores(duracionSegundos) {
    let tiempoRestante = duracionSegundos || 75;
    let puntaje = 0;
    let vidas = 3;
    let combo = 0;
    let comboMax = 0;
    let reglaActual = elegir(REGLAS)();
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
      velocidad: () => Math.min(2.7, 1 + puntaje / 110),
      intervaloSpawnMs: () => Math.max(550, 1400 / (1 + puntaje / 110)),

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
        if (tiempoParaCambiarRegla <= 0) { reglaActual = elegir(REGLAS)(); tiempoParaCambiarRegla = DURACION_REGLA; reglaNueva = true; }
        return { terminada: false, reglaNueva };
      },
    };
  }

  // ==================== MEMORIA ESPACIAL ====================
  function generarHechosUnicos(cantidad) {
    const resultados = new Set();
    const hechos = [];
    let intentos = 0;
    while (hechos.length < cantidad && intentos < 500) {
      intentos++;
      let enunciado, resultado;
      if (Math.random() < 0.6) {
        const a = randInt(2, 10), b = randInt(2, 10);
        enunciado = `${a} × ${b}`; resultado = a * b;
      } else {
        const a = randInt(10, 60), b = randInt(5, 30);
        enunciado = `${a} + ${b}`; resultado = a + b;
      }
      if (!resultados.has(resultado)) { resultados.add(resultado); hechos.push({ enunciado, resultado: String(resultado) }); }
    }
    return hechos;
  }

  function crearPartidaMemoria(numPares, duracionSegundos) {
    numPares = numPares || 8;
    const hechos = generarHechosUnicos(numPares);
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
    let tiempoRestante = duracionSegundos || 100;
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

  // ==================== ESCALERA NUMÉRICA ====================
  function crearPartidaEscalera(duracionSegundos) {
    let tiempoRestante = duracionSegundos || 75;
    let puntaje = 0;
    let vidas = 3;
    let escalon = 0;
    let combo = 0;
    let comboMax = 0;
    let terminada = false;
    let tiles = [];
    let ordenObjetivo = [];
    let indiceEsperado = 0;

    function nuevaRonda() {
      const cantidad = 5;
      const rango = 20 + escalon * 9;
      const valores = new Set();
      while (valores.size < cantidad) valores.add(randInt(1, rango));
      const base = [...valores].map((v, i) => ({ id: `${escalon}-${i}-${v}`, valor: v }));
      tiles = mezclar(base);
      ordenObjetivo = [...tiles].sort((a, b) => a.valor - b.valor).map((t) => t.id);
      indiceEsperado = 0;
    }
    nuevaRonda();

    return {
      tiles: () => tiles,
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
  // hay que tocarlos mientras están activos si cumplen la regla (reusa REGLAS).
  const NUM_HUECOS = 9;
  function crearPartidaAgujeros(duracionSegundos) {
    let tiempoRestante = duracionSegundos || 60;
    let puntaje = 0, vidas = 3, combo = 0, comboMax = 0;
    let reglaActual = elegir(REGLAS)();
    let tiempoParaCambiarRegla = DURACION_REGLA;
    let terminada = false;
    let acumuladorSpawn = 0;
    const huecos = Array.from({ length: NUM_HUECOS }, (_, i) => ({ id: i, activo: false, etiqueta: '', esCorrecta: false, tiempoVida: 0 }));

    function intervaloSpawnMs() { return Math.max(480, 1050 - puntaje * 4); }
    function duracionHuecoMs() { return Math.max(650, 1250 - puntaje * 3); }

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
        if (tiempoParaCambiarRegla <= 0) { reglaActual = elegir(REGLAS)(); tiempoParaCambiarRegla = DURACION_REGLA; reglaNueva = true; }

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
  // que llegue abajo, y esquivar los que no cumplan la regla (reusa REGLAS).
  const CARRILES = 3;
  function crearPartidaAsteroides(duracionSegundos) {
    let tiempoRestante = duracionSegundos || 75;
    let carrilActual = 1;
    let puntaje = 0, vidas = 3, combo = 0, comboMax = 0;
    let terminada = false;
    let objetos = [];
    let reglaActual = elegir(REGLAS)();
    let tiempoParaCambiarRegla = DURACION_REGLA;
    let acumuladorSpawn = 0;
    let contadorId = 0;

    function velocidad() { return Math.min(2.3, 1 + puntaje / 110); }

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
        if (tiempoParaCambiarRegla <= 0) { reglaActual = elegir(REGLAS)(); tiempoParaCambiarRegla = DURACION_REGLA; reglaNueva = true; }

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
        const intervalo = Math.max(480, 950 / velocidad());
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
    JUEGOS, crearPartidaInvasores, crearPartidaMemoria, crearPartidaEscalera,
    crearPartidaAgujeros, crearPartidaAsteroides,
  };
})();
