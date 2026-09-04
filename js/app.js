/* SM app.js — arranque y router de pantallas. Estado en memoria, sin URLs: cada
   pantalla se pinta reemplazando el HTML de #app (ver js/ui.js). */
(function () {
  const caja = { estado: SM.progreso.cargar() };
  caja.estado = SM.progreso.actualizarProgresoDiario(caja.estado);
  SM.sonido.setActivo(caja.estado.sonido);

  function ir(pantalla, datos) {
    datos = datos || {};
    const root = document.getElementById('app');
    window.scrollTo(0, 0);
    switch (pantalla) {
      case 'mundo': SM.ui.pantallaMundo(root, caja, datos.mundoId, ir); break;
      case 'leccion': SM.ui.pantallaLeccion(root, caja, datos.mundoId, ir); break;
      case 'juego': SM.ui.pantallaJuego(root, caja, datos.mundoId, datos.nivelId, ir); break;
      case 'arcade': SM.ui.pantallaArcade(root, caja, ir); break;
      case 'invasores': SM.ui.pantallaInvasores(root, caja, ir); break;
      case 'memoria': SM.ui.pantallaMemoria(root, caja, ir); break;
      case 'escalera': SM.ui.pantallaEscalera(root, caja, ir); break;
      case 'agujeros': SM.ui.pantallaAgujeros(root, caja, ir); break;
      case 'asteroides': SM.ui.pantallaAsteroides(root, caja, ir); break;
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
    document.addEventListener('click', iniciarMusicaSiCorresponde, { once: true });
    document.addEventListener('touchstart', iniciarMusicaSiCorresponde, { once: true });
  });
})();
