/* SM.arcade — lógica del mini-juego "Invasores Numéricos" (reglas, puntaje, vidas,
   dificultad creciente). La animación de las naves y el dibujo en pantalla viven en
   js/ui.js; este módulo solo lleva el estado del puntaje, igual que SM.juego lleva
   el estado de una sesión de nivel normal. */
(function () {
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function elegir(arr) { return arr[randInt(0, arr.length - 1)]; }

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

  function crearPartida(duracionSegundos) {
    let tiempoRestante = duracionSegundos || 90;
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
      velocidad: () => Math.min(2.4, 1 + puntaje / 150),
      intervaloSpawnMs: () => Math.max(650, 1500 / (1 + puntaje / 150)),

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
          const puntosGanados = 10 * Math.min(combo, 5);
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

  window.SM = window.SM || {};
  window.SM.arcade = { crearPartida };
})();
