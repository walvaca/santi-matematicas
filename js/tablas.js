/* SM.tablasCentro — el "Centro de Tablas": métodos extra de práctica dedicados
   SOLO a las tablas de multiplicar, más allá de los niveles normales de Tablix.
   Pedido explícito y urgente del usuario (2026-09-17): Santi tiene sustentación de
   recuperación el lunes y debe dominar TODAS las tablas para ese día. Tres
   herramientas, cada una un método distinto y comprobado:
   - Minuto Loco: fluidez cronometrada en UNA sola tabla (estilo "Mad Minute").
   - Tarjetas Rápidas: repetición dirigida a los hechos que Santi más falla,
     usando las estadísticas por hecho de SM.progreso (retrieval practice).
   - Conteo Salteado: memorizar la secuencia 0, tabla, 2×tabla... (skip counting).

   A propósito estas 3 sesiones piden la respuesta escrita (teclado numérico), NO
   opción múltiple como los niveles normales de Tablix — para memorizar de verdad
   hace falta PRODUCIR el resultado, no reconocerlo entre 4 opciones. Y a propósito
   NO tocan el motor compartido SM.juego (usado por los otros 7 planetas): tienen su
   propia sesión, con la misma forma (preguntaActual/racha/correctas/terminada/
   responder/avanzar/finalizar/calcularEstrellas) para que js/ui.js las pinte con un
   único renderer genérico en vez de tocar pantallaJuego. */
(function () {
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function barajar(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Un truco corto por tabla (1 al 12) — se muestra al elegir tabla en Minuto Loco /
  // Conteo Salteado, como chuleta rápida (los trucos largos con ejemplo visual viven
  // en la lección de Tablix, js/lecciones.js — esto es solo el recordatorio corto).
  const TRUCOS = {
    1: 'Todo × 1 se queda igual, como mirarte en un espejo.',
    2: 'Es el doble: súmalo con sigo mismo. 2 × 6 = 6 + 6 = 12.',
    3: 'Dobla el número y súmale una vez más. 3 × 6 = 6 + 6 + 6 = 18.',
    4: 'Dobla el doble. Para 4 × 6: dobla el 6 (12), y dobla otra vez (24).',
    5: 'Siempre termina en 0 o en 5. Es la mitad de la tabla del 10.',
    6: 'Con un número par, el resultado termina en el MISMO dígito (6×4=24, 6×8=48).',
    7: 'La más rebelde: pártela. 7 × 8 = 7×10 − 7×2 = 70 − 14 = 56.',
    8: 'Dobla tres veces seguidas. Para 8 × 6: 6 → 12 → 24 → 48.',
    9: 'La manito mágica: baja el dedo del número. Los de la izquierda son las decenas, los de la derecha las unidades.',
    10: 'Solo le agregas un cero al número. 10 × 6 = 60.',
    11: 'Hasta el 9, repite el dígito: 11 × 4 = 44.',
    12: 'Tabla del 10 + tabla del 2. Para 12 × 6: 60 + 12 = 72.',
  };

  function secuenciaConteo(tabla) {
    const seq = [];
    for (let n = 0; n <= 12; n++) seq.push(tabla * n);
    return seq;
  }

  // ================= MINUTO LOCO =================
  // Cronómetro de 60s preguntando SOLO la tabla elegida (b de 1 a 12, barajado y sin
  // repetir hasta cubrirla entera) — fluidez real en esa tabla, no reconocimiento.
  function crearSesionMinutoLoco(tabla, segundos) {
    segundos = segundos || 60;
    let indice = 0, correctas = 0, racha = 0, rachaMax = 0, tiempoRestante = segundos, terminada = false;
    let actual = null;
    let bolsa = [];
    function siguienteB() {
      if (bolsa.length === 0) bolsa = barajar([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      return bolsa.pop();
    }
    function nueva() {
      const b = siguienteB();
      actual = { a: tabla, b, respuesta: tabla * b, enunciado: `${tabla} × ${b} = ?` };
      return actual;
    }
    nueva();
    return {
      preguntaActual: () => actual,
      tiempoRestante: () => tiempoRestante,
      racha: () => racha,
      correctas: () => correctas,
      terminada: () => terminada,
      responder(valor, estado) {
        const ok = String(valor).trim() === String(actual.respuesta);
        indice += 1;
        if (ok) { correctas += 1; racha += 1; rachaMax = Math.max(rachaMax, racha); } else { racha = 0; }
        if (estado) SM.progreso.registrarFactTabla(estado, actual.a, actual.b, ok);
        return { correcta: ok, respuestaCorrecta: actual.respuesta, racha };
      },
      avanzar() { if (terminada) return null; return nueva(); },
      tick() {
        if (terminada) return true;
        tiempoRestante -= 1;
        if (tiempoRestante <= 0) { tiempoRestante = 0; terminada = true; }
        return terminada;
      },
      calcularEstrellas() {
        if (correctas >= 14) return 3;
        if (correctas >= 10) return 2;
        if (correctas >= 6) return 1;
        return 0;
      },
      finalizar(estado) {
        const estrellas = this.calcularEstrellas();
        const xpGanado = correctas * 3;
        const info = SM.progreso.registrarResultadoMetodoTablas(estado, xpGanado, { minutoLoco: correctas });
        return Object.assign({ estrellas, correctas, total: indice, rachaMax, tabla }, info);
      },
    };
  }

  // ================= TARJETAS RÁPIDAS =================
  // Elige `cantidad` hechos (a,b entre 1 y 12 — se excluye ×0 por trivial) priorizando
  // los que Santi nunca ha practicado o más falla (repetición espaciada simplificada:
  // sin intentos = prioridad máxima; con intentos, entre más bajo el acierto más
  // prioridad), con algo de ruido al azar para que la sesión no sea idéntica siempre.
  function elegirFacts(estado, cantidad) {
    const universo = [];
    for (let a = 1; a <= 12; a++) for (let b = 1; b <= 12; b++) universo.push([a, b]);
    const puntuados = universo.map(([a, b]) => {
      const s = SM.progreso.statsFact(estado, a, b);
      const prioridad = (s.intentos === 0 ? 1.5 : (1 - s.precision)) + Math.random() * 0.2;
      return { a, b, prioridad };
    });
    puntuados.sort((x, y) => y.prioridad - x.prioridad);
    return barajar(puntuados.slice(0, cantidad).map((f) => [f.a, f.b]));
  }

  function crearSesionFlashcards(estado, cantidad) {
    cantidad = cantidad || 15;
    const cola = elegirFacts(estado, cantidad);
    let indice = 0, correctas = 0, racha = 0, rachaMax = 0, terminada = false, actual = null;
    function nueva() {
      const [a, b] = cola[indice];
      actual = { a, b, respuesta: a * b, enunciado: `${a} × ${b} = ?` };
      return actual;
    }
    nueva();
    return {
      preguntaActual: () => actual,
      numeroPregunta: () => indice + 1,
      totalPreguntas: () => cola.length,
      racha: () => racha,
      correctas: () => correctas,
      terminada: () => terminada,
      responder(valor, estado2) {
        const ok = String(valor).trim() === String(actual.respuesta);
        SM.progreso.registrarFactTabla(estado2, actual.a, actual.b, ok);
        indice += 1;
        if (ok) { correctas += 1; racha += 1; rachaMax = Math.max(rachaMax, racha); } else { racha = 0; }
        if (indice >= cola.length) terminada = true;
        return { correcta: ok, respuestaCorrecta: actual.respuesta, racha };
      },
      avanzar() { if (terminada) return null; return nueva(); },
      calcularEstrellas() {
        const pct = correctas / cola.length;
        if (pct >= 0.9) return 3;
        if (pct >= 0.7) return 2;
        if (pct >= 0.4) return 1;
        return 0;
      },
      finalizar(estado2) {
        const estrellas = this.calcularEstrellas();
        const xpGanado = correctas * 4;
        const info = SM.progreso.registrarResultadoMetodoTablas(estado2, xpGanado);
        return Object.assign({ estrellas, correctas, total: cola.length, rachaMax }, info);
      },
    };
  }

  // ================= CONTEO SALTEADO =================
  // Muestra los últimos términos de la secuencia (0, tabla, 2×tabla...) y pregunta
  // cuál sigue — practica la memorización de la secuencia completa, no una cuenta
  // aislada. `cantidad` posiciones distintas se eligen al azar (entre la 2 y la 12).
  function crearSesionConteo(tabla, cantidad) {
    cantidad = cantidad || 8;
    const seq = secuenciaConteo(tabla);
    const posiciones = barajar([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const elegidas = posiciones.slice(0, Math.min(cantidad, posiciones.length)).sort((x, y) => x - y);
    let indice = 0, correctas = 0, racha = 0, rachaMax = 0, terminada = false, actual = null;
    function nueva() {
      const i = elegidas[indice];
      const contexto = seq.slice(Math.max(0, i - 4), i).join(', ');
      actual = { i, respuesta: seq[i], enunciado: `Cuenta salteado de ${tabla} en ${tabla}: ${contexto}, ___. ¿Qué número sigue?` };
      return actual;
    }
    nueva();
    return {
      preguntaActual: () => actual,
      numeroPregunta: () => indice + 1,
      totalPreguntas: () => elegidas.length,
      racha: () => racha,
      correctas: () => correctas,
      terminada: () => terminada,
      responder(valor) {
        const ok = String(valor).trim() === String(actual.respuesta);
        indice += 1;
        if (ok) { correctas += 1; racha += 1; rachaMax = Math.max(rachaMax, racha); } else { racha = 0; }
        if (indice >= elegidas.length) terminada = true;
        return { correcta: ok, respuestaCorrecta: actual.respuesta, racha };
      },
      avanzar() { if (terminada) return null; return nueva(); },
      calcularEstrellas() {
        const pct = correctas / elegidas.length;
        if (pct >= 0.9) return 3;
        if (pct >= 0.7) return 2;
        if (pct >= 0.4) return 1;
        return 0;
      },
      finalizar(estado) {
        const estrellas = this.calcularEstrellas();
        const xpGanado = correctas * 4;
        const info = SM.progreso.registrarResultadoMetodoTablas(estado, xpGanado);
        return Object.assign({ estrellas, correctas, total: elegidas.length, rachaMax, tabla }, info);
      },
    };
  }

  window.SM = window.SM || {};
  window.SM.tablasCentro = { TRUCOS, secuenciaConteo, crearSesionMinutoLoco, crearSesionFlashcards, crearSesionConteo };
})();
