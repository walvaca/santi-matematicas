/* SM.sonido — efectos sintetizados con Web Audio API, sin archivos de audio.
   Todo se dispara dentro de manejadores de click/tap, así que el navegador siempre
   tiene el "gesto de usuario" que necesita para reproducir sonido. La música de
   fondo (`SM.sonido.musica`) usa el mismo AudioContext compartido pero tiene su
   propio interruptor, separado del de los efectos. */
(function () {
  let ctx = null;
  let activo = true;

  function contexto() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tono(freq, inicioSeg, duracion, tipo, volumen) {
    const c = contexto();
    if (!c || !activo) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = tipo || 'sine';
    osc.frequency.value = freq;
    const t0 = c.currentTime + inicioSeg;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volumen || 0.18, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duracion);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + duracion + 0.02);
  }

  function acierto() {
    tono(660, 0, 0.11, 'triangle');
    tono(880, 0.08, 0.16, 'triangle');
  }

  function error() {
    tono(330, 0, 0.14, 'sine', 0.13);
    tono(247, 0.09, 0.18, 'sine', 0.11);
  }

  function click() {
    tono(500, 0, 0.05, 'square', 0.06);
  }

  function nivelCompletado(estrellas) {
    const notas = [523, 659, 784, 1047];
    for (let i = 0; i <= estrellas && i < notas.length; i++) {
      tono(notas[i], i * 0.11, 0.22, 'triangle', 0.16);
    }
  }

  function logro() {
    tono(784, 0, 0.12, 'triangle', 0.15);
    tono(988, 0.1, 0.12, 'triangle', 0.15);
    tono(1319, 0.2, 0.25, 'triangle', 0.17);
  }

  function disparo() {
    tono(880, 0, 0.07, 'sawtooth', 0.08);
    tono(220, 0.05, 0.09, 'sawtooth', 0.06);
  }

  function explosion() {
    tono(180, 0, 0.05, 'square', 0.1);
    tono(90, 0.04, 0.16, 'square', 0.09);
  }

  // ---- sonidos especiales nuevos (pedido explícito) ----

  // Al arrancar un nivel/quiz/juego de arcade: un "power up" corto y animoso.
  function inicioNivel() {
    tono(392, 0, 0.08, 'triangle', 0.1);
    tono(523, 0.06, 0.08, 'triangle', 0.11);
    tono(659, 0.12, 0.14, 'triangle', 0.13);
  }

  // Cuando sube la racha (se cumple el reto diario): más especial que un logro normal.
  function rachaSubida() {
    tono(659, 0, 0.1, 'triangle', 0.14);
    tono(784, 0.09, 0.1, 'triangle', 0.14);
    tono(988, 0.18, 0.1, 'triangle', 0.15);
    tono(1319, 0.27, 0.3, 'triangle', 0.18);
  }

  // Meta/premio de la vida real alcanzado: la fanfarria más grande de la app.
  function metaAlcanzada() {
    tono(523, 0, 0.14, 'triangle', 0.15);
    tono(659, 0.1, 0.14, 'triangle', 0.15);
    tono(784, 0.2, 0.14, 'triangle', 0.16);
    tono(1047, 0.3, 0.14, 'triangle', 0.17);
    tono(1319, 0.4, 0.4, 'triangle', 0.2);
  }

  // Fin de partida de arcade por quedarse sin vidas: un tono suave, nunca punitivo.
  function derrota() {
    tono(392, 0, 0.16, 'sine', 0.12);
    tono(311, 0.13, 0.18, 'sine', 0.1);
    tono(261, 0.26, 0.28, 'sine', 0.09);
  }

  // ---- música de fondo ----
  let musicaActiva = false;
  let musicaGain = null;
  let musicaTimeoutId = null;
  let musicaIndicePatron = 0;

  // Dos frases cortas de 8 notas (escala pentatónica menor "espacial") que se
  // alternan para que el loop no se sienta tan repetitivo.
  const PATRONES_MUSICA = [
    [[440, 0.3], [523.25, 0.3], [659.25, 0.3], [783.99, 0.3], [659.25, 0.3], [523.25, 0.3], [440, 0.3], [523.25, 0.3]],
    [[587.33, 0.3], [659.25, 0.3], [880, 0.3], [659.25, 0.3], [587.33, 0.3], [440, 0.3], [523.25, 0.3], [440, 0.6]],
  ];

  function reproducirCicloMusica() {
    if (!musicaActiva) return;
    const c = contexto();
    if (!c) return;
    if (!musicaGain) {
      musicaGain = c.createGain();
      musicaGain.gain.value = 0.045;
      musicaGain.connect(c.destination);
    }
    const patron = PATRONES_MUSICA[musicaIndicePatron % PATRONES_MUSICA.length];
    musicaIndicePatron++;
    let t = c.currentTime + 0.05;
    let duracionTotal = 0;
    patron.forEach(([freq, dur]) => {
      const osc = c.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const notaGain = c.createGain();
      notaGain.gain.setValueAtTime(0, t);
      notaGain.gain.linearRampToValueAtTime(1, t + 0.02);
      notaGain.gain.linearRampToValueAtTime(0, t + dur - 0.03);
      osc.connect(notaGain).connect(musicaGain);
      osc.start(t);
      osc.stop(t + dur);
      t += dur;
      duracionTotal += dur;
    });
    musicaTimeoutId = setTimeout(reproducirCicloMusica, duracionTotal * 1000);
  }

  function musicaIniciar() {
    if (musicaActiva) return;
    musicaActiva = true;
    reproducirCicloMusica();
  }
  function musicaDetener() {
    musicaActiva = false;
    if (musicaTimeoutId) { clearTimeout(musicaTimeoutId); musicaTimeoutId = null; }
  }
  function musicaSetActiva(valor) {
    if (valor) musicaIniciar(); else musicaDetener();
  }
  function musicaEstaActiva() { return musicaActiva; }

  function setActivo(valor) { activo = !!valor; }
  function estaActivo() { return activo; }

  window.SM = window.SM || {};
  window.SM.sonido = {
    acierto, error, click, nivelCompletado, logro, disparo, explosion,
    inicioNivel, rachaSubida, metaAlcanzada, derrota,
    setActivo, estaActivo,
    musica: { iniciar: musicaIniciar, detener: musicaDetener, setActiva: musicaSetActiva, estaActiva: musicaEstaActiva },
  };
})();
