/* SM app.js — arranque y router de pantallas. Estado en memoria, sin URLs: cada
   pantalla se pinta reemplazando el HTML de #app (ver js/ui.js). */
(function () {
  const caja = { estado: SM.progreso.cargar() };
  caja.estado = SM.progreso.actualizarProgresoDiario(caja.estado);
  SM.sonido.setActivo(caja.estado.sonido);

  let pantallaActual = 'inicio';
  function ir(pantalla, datos) {
    datos = datos || {};
    pantallaActual = pantalla || 'inicio';
    const root = document.getElementById('app');
    window.scrollTo(0, 0);
    switch (pantalla) {
      case 'mundo': SM.ui.pantallaMundo(root, caja, datos.mundoId, ir); break;
      case 'leccion': SM.ui.pantallaLeccion(root, caja, datos.mundoId, ir); break;
      case 'centro-tablas': SM.ui.pantallaCentroTablas(root, caja, ir); break;
      case 'elegir-tabla': SM.ui.pantallaElegirTablaEntreno(root, caja, ir, datos.modo); break;
      case 'minuto-loco': SM.ui.pantallaMinutoLoco(root, caja, ir, datos.tabla); break;
      case 'conteo-tablas': SM.ui.pantallaConteoTablas(root, caja, ir, datos.tabla); break;
      case 'flashcards-tablas': SM.ui.pantallaFlashcardsTablas(root, caja, ir); break;
      case 'juego': SM.ui.pantallaJuego(root, caja, datos.mundoId, datos.nivelId, ir); break;
      case 'arcade': SM.ui.pantallaArcade(root, caja, ir); break;
      case 'elegir-dificultad': SM.ui.pantallaDificultadArcade(root, caja, datos.juegoId, ir); break;
      case 'invasores': SM.ui.pantallaInvasores(root, caja, ir, datos.dificultad); break;
      case 'memoria': SM.ui.pantallaMemoria(root, caja, ir, datos.dificultad); break;
      case 'escalera': SM.ui.pantallaEscalera(root, caja, ir, datos.dificultad); break;
      case 'agujeros': SM.ui.pantallaAgujeros(root, caja, ir, datos.dificultad); break;
      case 'asteroides': SM.ui.pantallaAsteroides(root, caja, ir, datos.dificultad); break;
      case 'serpiente': SM.ui.pantallaSerpiente(root, caja, ir, datos.dificultad); break;
      case 'globos': SM.ui.pantallaGlobos(root, caja, ir, datos.dificultad); break;
      case 'tunel': SM.ui.pantallaTunel(root, caja, ir, datos.dificultad); break;
      case 'carrera': SM.ui.pantallaCarrera(root, caja, ir, datos.dificultad); break;
      case 'rescate-racha': SM.ui.pantallaRescateRacha(root, caja, ir); break;
      case 'premios': SM.ui.pantallaPremios(root, caja, ir); break;
      case 'logros': SM.ui.pantallaLogros(root, caja, ir); break;
      case 'ajustes': SM.ui.pantallaAjustes(root, caja, ir); break;
      default: SM.ui.pantallaInicio(root, caja, ir);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    ir('inicio');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch((err) => console.error('No se pudo registrar el Service Worker', err));
    }
    // La música solo puede arrancar dentro de un gesto real del usuario (política
    // de autoplay del navegador) — se engancha al primer toque/click de la sesión.
    function iniciarMusicaSiCorresponde() {
      if (caja.estado.musica) SM.sonido.musica.iniciar();
    }
    // En Android la app puede quedar abierta en segundo plano varios días: al volver,
    // si cambió la fecha, se cierra el día (regla de racha de siempre) y, si estaba en
    // Inicio, se repinta para que el widget de racha muestre el día nuevo.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      if (caja.estado.retoDiario.fecha === SM.progreso.hoyISO()) return;
      caja.estado = SM.progreso.actualizarProgresoDiario(caja.estado);
      if (pantallaActual === 'inicio') ir('inicio');
    });
    document.addEventListener('click', iniciarMusicaSiCorresponde, { once: true });
    document.addEventListener('touchstart', iniciarMusicaSiCorresponde, { once: true });
  });
})();
