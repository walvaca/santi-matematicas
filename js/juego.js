/* SM.juego — motor de una sesión de nivel: genera preguntas, lleva el puntaje, la
   racha y (en niveles contrarreloj) el tiempo, y calcula las estrellas ganadas al
   terminar. La UI (js/ui.js) solo llama a estos métodos y pinta lo que devuelven.

   `desafio` (opcional, { erroresPermitidos, segundosPorPregunta }) activa el "modo
   agilidad": termina la sesión si se agotan los errores permitidos, y/o pone un
   cronómetro por pregunta (si se acaba, cuenta como fallo y avanza). Se ignora en
   niveles contrarreloj o en el quiz final, que ya tienen su propia mecánica. */
(function () {
  function crearSesion(mundoId, nivelId, desafio) {
    const mundo = SM.mundos.obtener(mundoId);
    const nivel = SM.mundos.obtenerNivel(mundoId, nivelId);
    const esContrarreloj = !!nivel.contrarreloj;
    const desafioActivo = !esContrarreloj && !nivel.esQuiz ? (desafio || {}) : {};
    const erroresPermitidos = desafioActivo.erroresPermitidos || null;
    const segundosPorPregunta = desafioActivo.segundosPorPregunta || null;

    let preguntaActual = null;
    let indice = 0;
    let correctas = 0;
    let errores = 0;
    let racha = 0;
    let rachaMax = 0;
    let tiempoRestante = esContrarreloj ? nivel.contrarreloj.segundos : null;
    let tiempoPregunta = segundosPorPregunta;
    let terminada = false;

    function nuevaPregunta() {
      preguntaActual = SM.generadores.generar(nivel.generador, nivel.params);
      tiempoPregunta = segundosPorPregunta;
      return preguntaActual;
    }
    nuevaPregunta();

    function calcularEstrellas() {
      if (esContrarreloj) {
        const [u1, u2, u3] = nivel.contrarreloj.umbralEstrellas;
        if (correctas >= u3) return 3;
        if (correctas >= u2) return 2;
        if (correctas >= u1) return 1;
        return 0;
      }
      const pct = correctas / Math.max(indice, 1);
      if (nivel.esQuiz) {
        // el quiz final es el reto más exigente: aprobar de verdad cuesta, no hay estrella de consuelo
        if (pct >= 1) return 3;
        if (pct >= 0.93) return 2;
        if (pct >= 0.85) return 1;
        return 0;
      }
      if (pct >= 0.9) return 3;
      if (pct >= 0.7) return 2;
      if (pct >= 0.4) return 1;
      return 0;
    }

    return {
      mundo, nivel, esContrarreloj, erroresPermitidos, segundosPorPregunta,
      preguntaActual: () => preguntaActual,
      numeroPregunta: () => indice + 1,
      totalPreguntas: () => (esContrarreloj ? null : nivel.preguntas),
      tiempoRestante: () => tiempoRestante,
      tiempoPregunta: () => tiempoPregunta,
      erroresRestantes: () => (erroresPermitidos == null ? null : Math.max(0, erroresPermitidos - errores)),
      racha: () => racha,
      correctas: () => correctas,
      terminada: () => terminada,

      responder(valorUsuario) {
        const p = preguntaActual;
        const esCorrecta = String(valorUsuario).trim().toLowerCase() === String(p.respuesta).trim().toLowerCase();
        indice++;
        if (esCorrecta) {
          correctas++; racha++; rachaMax = Math.max(rachaMax, racha);
        } else {
          racha = 0;
          errores++;
        }
        if (!esContrarreloj && indice >= nivel.preguntas) terminada = true;
        if (erroresPermitidos != null && errores >= erroresPermitidos) terminada = true;
        return { correcta: esCorrecta, respuestaCorrecta: p.respuesta, explicacion: p.explicacion, racha, rachaMax };
      },

      avanzar() {
        if (terminada) return null;
        return nuevaPregunta();
      },

      tick() {
        if (!esContrarreloj || terminada) return terminada;
        tiempoRestante -= 1;
        if (tiempoRestante <= 0) { tiempoRestante = 0; terminada = true; }
        return terminada;
      },

      // Cronómetro por pregunta (modo agilidad). Devuelve true si se acabó el tiempo
      // para la pregunta actual — la UI debe tratarlo como una respuesta incorrecta.
      tickPregunta() {
        if (segundosPorPregunta == null || terminada || tiempoPregunta == null) return false;
        tiempoPregunta -= 1;
        if (tiempoPregunta <= 0) { tiempoPregunta = 0; return true; }
        return false;
      },

      calcularEstrellas,

      finalizar(estado) {
        const estrellas = calcularEstrellas();
        const info = SM.progreso.registrarResultadoNivel(estado, mundoId, nivelId, estrellas, esContrarreloj ? correctas : null);
        return Object.assign(
          { estrellas, correctas, total: esContrarreloj ? indice : Math.max(indice, 1), rachaMax },
          info,
        );
      },
    };
  }

  window.SM = window.SM || {};
  window.SM.juego = { crearSesion };
})();
