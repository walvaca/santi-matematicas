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

  // Fanfarria exclusiva del hito de 100 días de racha — la más larga de la app, suena
  // una sola vez en la vida del juego (ver SM.ui.celebrarRacha100).
  function hito100() {
    const subida = [392, 523, 659, 784, 1047, 1319, 1568];
    subida.forEach((f, i) => tono(f, i * 0.09, 0.18, 'triangle', 0.14));
    [1047, 1319, 1568].forEach((f) => tono(f, 0.75, 0.9, 'triangle', 0.12));
    [784, 988, 1175].forEach((f) => tono(f, 1.2, 0.35, 'square', 0.05));
    [1047, 1319, 1568, 2093].forEach((f) => tono(f, 1.55, 1.4, 'triangle', 0.11));
  }

  // Fin de partida de arcade por quedarse sin vidas: un tono suave, nunca punitivo.
  function derrota() {
    tono(392, 0, 0.16, 'sine', 0.12);
    tono(311, 0.13, 0.18, 'sine', 0.1);
    tono(261, 0.26, 0.28, 'sine', 0.09);
  }

  // ---- música de fondo ----
  // Pedido explícito del usuario (2026-09-26): "cada juego una música diferente".
  // Mini secuenciador sin archivos de audio: cada tema tiene melodía, bajo y batería
  // sintetizados, y se programa con "lookahead" (cada 60 ms se agenda lo que suena en
  // los próximos 0,25 s). `SM.sonido.musica.tema(id)` cambia de canción; app.js elige
  // el tema según la pantalla. Además, al salir de la app (pantalla oculta / pagehide)
  // se llama `pausarTodo()`: corta la música y suspende el AudioContext — antes la
  // música seguía sonando con el juego cerrado (bug reportado por el usuario).
  //
  // Formato: `mel` = 16 notas de corchea ("A4", "_" silencio, "-" alarga la anterior);
  // `bajo` = 8 negras; `bat` = 16 semicorcheas por compás (k bombo, s caja, h platillo).
  const TEMAS_MUSICA = {
    menu:      { bpm: 96,  onda: 'triangle', vol: 0.9, mel: 'A4 C5 E5 G5 E5 C5 A4 C5 D5 E5 A5 E5 D5 C5 A4 -', bajo: 'A2 A2 F2 F2 C3 C3 G2 G2', bat: '' },
    estudio:   { bpm: 76,  onda: 'sine',     vol: 0.9, mel: 'C5 E5 G5 E5 D5 F5 A5 F5 E5 G5 C6 G5 D5 G5 B5 -', bajo: 'C3 C3 F2 F2 C3 C3 G2 G2', bat: '' },
    tablas:    { bpm: 108, onda: 'triangle', vol: 0.8, mel: 'G4 C5 E5 C5 G4 C5 E5 - A4 D5 F5 D5 B4 D5 G5 -', bajo: 'C3 C3 C3 C3 F2 F2 G2 G2', bat: 'k...h...s...h...' },
    rescate:   { bpm: 126, onda: 'square',   vol: 0.4, mel: 'A4 _ A4 C5 E5 D5 C5 B4 A4 _ A4 C5 F5 E5 D5 G#4', bajo: 'A2 A2 A2 A2 F2 F2 E2 E2', bat: 'k.h.k.h.s.h.k.h.' },
    invasores: { bpm: 140, onda: 'square',   vol: 0.4, mel: 'E5 _ E5 G5 B5 A5 G5 E5 D5 _ D5 F#5 A5 G5 F#5 D5', bajo: 'E2 E2 E2 E2 D2 D2 D2 D2', bat: 'k.h.s.h.k.h.s.hh' },
    memoria:   { bpm: 90,  onda: 'sine',     vol: 0.9, mel: 'D5 F5 A5 C6 B5 A5 F5 - E5 G5 B5 D6 C6 B5 G5 -', bajo: 'D3 D3 D3 D3 E3 E3 E3 E3', bat: 'h...h...h...h...' },
    escalera:  { bpm: 116, onda: 'triangle', vol: 0.8, mel: 'C5 D5 E5 F5 G5 A5 B5 C6 B5 A5 G5 F5 E5 D5 C5 -', bajo: 'C3 G2 A2 E2 F2 C3 F2 G2', bat: 'k...h.h.s...h.h.' },
    agujeros:  { bpm: 100, onda: 'sawtooth', vol: 0.35, mel: 'F#4 _ A4 _ C#5 _ B4 A4 F#4 _ E4 _ G#4 A4 F#4 -', bajo: 'F#2 F#2 F#2 F#2 D2 D2 C#2 C#2', bat: 'k..hk..hs..hk.hh' },
    asteroides:{ bpm: 132, onda: 'square',   vol: 0.4, mel: 'A4 A4 C5 A4 D5 A4 E5 D5 C5 C5 E5 C5 G5 E5 D5 C5', bajo: 'A2 A2 A2 A2 F2 F2 G2 G2', bat: 'k.h.s.h.k.k.s.h.' },
    serpiente: { bpm: 118, onda: 'triangle', vol: 0.8, mel: 'E5 F5 G#5 A5 G#5 F5 E5 - B4 C5 D5 E5 D5 C5 B4 -', bajo: 'E2 E2 E2 E2 E2 E2 D2 D2', bat: 'k..sk..sk..sk.ss' },
    globos:    { bpm: 128, onda: 'triangle', vol: 0.8, staccato: true, mel: 'F5 _ A5 _ C6 _ A5 F5 G5 _ A#5 _ G5 E5 F5 -', bajo: 'F2 C3 F2 C3 C3 G2 F2 C3', bat: 'k.h.s.h.k.h.s.h.' },
    tunel:     { bpm: 150, onda: 'sawtooth', vol: 0.3, mel: 'D5 F5 A5 D6 C6 A5 F5 A5 A#4 D5 F5 A#5 A5 F5 C5 E5', bajo: 'D2 D2 D2 D2 A#1 A#1 C2 C2', bat: 'k.hhs.hhk.hhs.hh' },
    carrera:   { bpm: 164, onda: 'square',   vol: 0.4, mel: 'G5 G5 D5 G5 B5 A5 G5 F#5 E5 E5 C5 E5 G5 F#5 E5 D5', bajo: 'G2 D3 G2 D3 C3 G2 D3 D3', bat: 'k.s.k.s.k.s.kks.' },
  };
  const SEMITONOS = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function frecuencia(nombre) {
    const m = /^([A-G]#?)(\d)$/.exec(nombre);
    if (!m) return null;
    const midi = 12 * (Number(m[2]) + 1) + SEMITONOS[m[1]];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  // Convierte "A4 C5 - _" en una lista de semicorcheas: {freq, pasos} al empezar cada
  // nota, null en los pasos que continúan o son silencio.
  function parsearPista(texto, pasosPorNota) {
    const pasos = [];
    let ultima = null;
    texto.trim().split(/\s+/).forEach((tok) => {
      if (tok === '-' && ultima) {
        ultima.pasos += pasosPorNota;
        for (let i = 0; i < pasosPorNota; i++) pasos.push(null);
        return;
      }
      const nota = tok === '_' ? null : { freq: frecuencia(tok), pasos: pasosPorNota };
      ultima = nota;
      pasos.push(nota);
      for (let i = 1; i < pasosPorNota; i++) pasos.push(null);
    });
    return pasos;
  }
  const temasListos = {};
  function temaListo(id) {
    if (!temasListos[id]) {
      const t = TEMAS_MUSICA[id] || TEMAS_MUSICA.menu;
      temasListos[id] = Object.assign({}, t, { melPasos: parsearPista(t.mel, 2), bajoPasos: parsearPista(t.bajo, 4) });
    }
    return temasListos[id];
  }

  let musicaActiva = false;
  let musicaGain = null;
  let musicaTimer = null;
  let temaActualId = 'menu';
  let pasoMusica = 0;
  let proximoTiempo = 0;
  let bufferRuido = null;

  function ruido(c) {
    if (!bufferRuido) {
      bufferRuido = c.createBuffer(1, c.sampleRate * 0.3, c.sampleRate);
      const d = bufferRuido.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return bufferRuido;
  }
  function notaMusica(c, freq, t, dur, onda, vol) {
    const osc = c.createOscillator();
    osc.type = onda;
    osc.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.setValueAtTime(vol, t + Math.max(0.02, dur - 0.04));
    g.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(g).connect(musicaGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
  function golpe(c, tipo, t) {
    if (tipo === 'k') {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(1.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(g).connect(musicaGain);
      osc.start(t); osc.stop(t + 0.16);
      return;
    }
    const src = c.createBufferSource();
    src.buffer = ruido(c);
    const filtro = c.createBiquadFilter();
    filtro.type = tipo === 'h' ? 'highpass' : 'bandpass';
    filtro.frequency.value = tipo === 'h' ? 7000 : 1800;
    const g = c.createGain();
    const dur = tipo === 'h' ? 0.04 : 0.12;
    g.gain.setValueAtTime(tipo === 'h' ? 0.25 : 0.55, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filtro).connect(g).connect(musicaGain);
    src.start(t); src.stop(t + dur + 0.01);
  }
  function tocarPaso(c, t) {
    const tema = temaListo(temaActualId);
    const dPaso = 60 / tema.bpm / 4;
    const mel = tema.melPasos[pasoMusica % tema.melPasos.length];
    if (mel && mel.freq) notaMusica(c, mel.freq, t, mel.pasos * dPaso * (tema.staccato ? 0.45 : 0.9), tema.onda, tema.vol);
    const bajo = tema.bajoPasos[pasoMusica % tema.bajoPasos.length];
    if (bajo && bajo.freq) notaMusica(c, bajo.freq, t, bajo.pasos * dPaso * 0.85, tema.onda === 'sine' ? 'sine' : 'triangle', 0.7);
    if (tema.bat) {
      const ch = tema.bat[pasoMusica % tema.bat.length];
      if (ch === 'k' || ch === 's' || ch === 'h') golpe(c, ch, t);
    }
  }
  function programarMusica() {
    if (!musicaActiva) return;
    const c = contexto();
    if (!c || c.state !== 'running') return;
    if (!musicaGain) {
      musicaGain = c.createGain();
      musicaGain.gain.value = 0.05;
      musicaGain.connect(c.destination);
    }
    if (proximoTiempo < c.currentTime) proximoTiempo = c.currentTime + 0.05;
    while (proximoTiempo < c.currentTime + 0.25) {
      tocarPaso(c, proximoTiempo);
      proximoTiempo += 60 / temaListo(temaActualId).bpm / 4;
      pasoMusica++;
    }
  }
  // Corta en seco lo que ya estaba agendado (desconectando el volumen general).
  function silenciarAgendado() {
    if (musicaGain) {
      try { musicaGain.disconnect(); } catch (e) { /* ya desconectado */ }
      musicaGain = null;
    }
  }

  function musicaIniciar() {
    if (musicaActiva) return;
    musicaActiva = true;
    proximoTiempo = 0;
    const c = contexto();
    if (c && c.state === 'suspended') c.resume();
    programarMusica();
    musicaTimer = setInterval(programarMusica, 60);
  }
  function musicaDetener() {
    musicaActiva = false;
    if (musicaTimer) { clearInterval(musicaTimer); musicaTimer = null; }
    silenciarAgendado();
  }
  function musicaTema(id) {
    const nuevo = TEMAS_MUSICA[id] ? id : 'menu';
    if (nuevo === temaActualId) return;
    temaActualId = nuevo;
    pasoMusica = 0;
    if (musicaActiva) { silenciarAgendado(); proximoTiempo = 0; programarMusica(); }
  }
  function musicaSetActiva(valor) {
    if (valor) musicaIniciar(); else musicaDetener();
  }
  function musicaEstaActiva() { return musicaActiva; }

  // Al cerrar/ocultar la app: nada debe seguir sonando.
  function pausarTodo() {
    musicaDetener();
    if (ctx && ctx.state === 'running') ctx.suspend();
  }

  function setActivo(valor) { activo = !!valor; }
  function estaActivo() { return activo; }

  window.SM = window.SM || {};
  window.SM.sonido = {
    acierto, error, click, nivelCompletado, logro, disparo, explosion,
    inicioNivel, rachaSubida, metaAlcanzada, derrota, hito100,
    setActivo, estaActivo,
    pausarTodo,
    musica: { iniciar: musicaIniciar, detener: musicaDetener, setActiva: musicaSetActiva, estaActiva: musicaEstaActiva, tema: musicaTema, TEMAS: Object.keys(TEMAS_MUSICA) },
  };
})();
