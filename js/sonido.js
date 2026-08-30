/* SM.sonido — efectos sintetizados con Web Audio API, sin archivos de audio.
   Todo se dispara dentro de manejadores de click/tap, así que el navegador siempre
   tiene el "gesto de usuario" que necesita para reproducir sonido. */
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

  function setActivo(valor) { activo = !!valor; }
  function estaActivo() { return activo; }

  window.SM = window.SM || {};
  window.SM.sonido = { acierto, error, click, nivelCompletado, logro, disparo, explosion, setActivo, estaActivo };
})();
