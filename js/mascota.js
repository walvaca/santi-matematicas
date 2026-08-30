/* SM.mascota — Cosmo, el robot compañero. Dibuja su carita en SVG (sin imágenes
   externas) en distintos estados de ánimo, y guarda los bancos de frases de ánimo. */
(function () {
  const PARTES = {
    feliz: {
      ojos: '<circle cx="48" cy="51" r="6.5" fill="#fff"/><circle cx="50" cy="49" r="2.6" fill="var(--sm-cara)"/>'
          + '<circle cx="72" cy="51" r="6.5" fill="#fff"/><circle cx="74" cy="49" r="2.6" fill="var(--sm-cara)"/>',
      boca: '<path d="M45,63 Q60,73 75,63" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round"/>',
      brazos: '<path d="M28,75 Q17,84 21,95" stroke="var(--sm-cuerpo)" stroke-width="8" fill="none" stroke-linecap="round"/>'
            + '<path d="M92,75 Q103,84 99,95" stroke="var(--sm-cuerpo)" stroke-width="8" fill="none" stroke-linecap="round"/>',
      extra: '',
    },
    animando: {
      ojos: '<path d="M42,54 L48,45 L54,54" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
          + '<path d="M66,54 L72,45 L78,54" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
      boca: '<path d="M43,61 Q60,80 77,61 Q60,71 43,61 Z" fill="#fff"/>',
      brazos: '<path d="M28,72 Q13,59 19,44" stroke="var(--sm-cuerpo)" stroke-width="8" fill="none" stroke-linecap="round"/>'
            + '<path d="M92,72 Q107,59 101,44" stroke="var(--sm-cuerpo)" stroke-width="8" fill="none" stroke-linecap="round"/>',
      extra: '<text x="14" y="30" font-size="16" class="sm-chispa">✦</text><text x="98" y="26" font-size="13" class="sm-chispa sm-chispa2">✦</text>',
    },
    pensando: {
      ojos: '<circle cx="48" cy="52" r="6" fill="#fff"/><circle cx="46" cy="49" r="2.4" fill="var(--sm-cara)"/>'
          + '<path d="M67,47 Q73,43 79,47" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="72" cy="53" r="6" fill="#fff"/><circle cx="70" cy="50" r="2.4" fill="var(--sm-cara)"/>',
      boca: '<path d="M51,66 L69,66" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>',
      brazos: '<path d="M28,76 Q18,85 22,95" stroke="var(--sm-cuerpo)" stroke-width="8" fill="none" stroke-linecap="round"/>'
            + '<path d="M92,73 Q100,65 96,58" stroke="var(--sm-cuerpo)" stroke-width="8" fill="none" stroke-linecap="round"/>',
      extra: '<text x="88" y="24" font-size="18" fill="var(--sm-cara)" font-weight="700">?</text>',
    },
    consolando: {
      ojos: '<path d="M43,52 Q48,48 53,52" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>'
          + '<path d="M67,52 Q72,48 77,52" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>',
      boca: '<path d="M48,65 Q60,71 72,65" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>',
      brazos: '<path d="M28,75 Q17,84 21,95" stroke="var(--sm-cuerpo)" stroke-width="8" fill="none" stroke-linecap="round"/>'
            + '<path d="M92,75 Q103,84 99,95" stroke="var(--sm-cuerpo)" stroke-width="8" fill="none" stroke-linecap="round"/>',
      extra: '',
    },
    celebrando: {
      ojos: '<path d="M42,54 L48,45 L54,54" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
          + '<path d="M66,54 L72,45 L78,54" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
      boca: '<path d="M43,61 Q60,80 77,61 Q60,71 43,61 Z" fill="#fff"/>',
      brazos: '<path d="M28,72 Q13,59 19,44" stroke="var(--sm-cuerpo)" stroke-width="8" fill="none" stroke-linecap="round"/>'
            + '<path d="M92,72 Q107,59 101,44" stroke="var(--sm-cuerpo)" stroke-width="8" fill="none" stroke-linecap="round"/>',
      extra: '<text x="10" y="34" font-size="18" class="sm-chispa">✦</text>'
           + '<text x="100" y="20" font-size="14" class="sm-chispa sm-chispa2">✦</text>'
           + '<text x="96" y="98" font-size="16" class="sm-chispa sm-chispa3">✦</text>'
           + '<text x="16" y="92" font-size="12" class="sm-chispa sm-chispa2">✦</text>',
    },
  };

  function svg(estado, claseExtra) {
    const p = PARTES[estado] || PARTES.feliz;
    return `<svg viewBox="0 0 120 120" class="sm-mascota-svg ${claseExtra || ''}" xmlns="http://www.w3.org/2000/svg">
      ${p.extra}
      <line x1="60" y1="20" x2="60" y2="8" stroke="var(--sm-cuerpo)" stroke-width="4" stroke-linecap="round"/>
      <circle cx="60" cy="6" r="5" fill="var(--accent2)"/>
      ${p.brazos}
      <rect x="38" y="80" width="44" height="26" rx="9" fill="var(--sm-cuerpo)"/>
      <circle cx="60" cy="93" r="5" fill="var(--accent2)"/>
      <rect x="23" y="18" width="74" height="64" rx="20" fill="var(--sm-cuerpo)"/>
      <rect x="34" y="33" width="52" height="36" rx="12" fill="var(--sm-cara)"/>
      ${p.ojos}
      ${p.boca}
    </svg>`;
  }

  const FRASES = {
    saludo: [
      '¡Hola, {nombre}! Cosmo te está esperando para despegar 🚀',
      '¡{nombre}! Listo para otra misión por el espacio de los números 🌌',
      '¡Reporte de vuelo, {nombre}! ¿Qué planeta conquistamos hoy?',
      '¡Bienvenido de vuelta, capitán {nombre}! La nave está lista.',
      '¡{nombre}, tu tripulación te extrañaba! Vamos a jugar 🪐',
    ],
    antesNivel: [
      '¡Vamos {nombre}, tú puedes! 💪',
      '¡A darle con toda! Cosmo cree en ti 🚀',
      '¡Ánimo, campeón espacial!',
      'Respira hondo... ¡y a la cuenta de tres, despegamos!',
      '¡Tú ya dominas esto, solo hay que demostrarlo!',
      '¡Cada misión te hace más fuerte con los números!',
    ],
    acierto: [
      '¡Exacto! 🎯', '¡Así se hace! 🚀', '¡Perfecto!', '¡Eres una estrella! ⭐',
      '¡Increíble, {nombre}!', '¡Directo al blanco!', '¡Vamos bien!', '¡Genial!',
    ],
    racha: [
      '¡Racha de {n}! 🔥', '¡{n} seguidas, imparable! 🔥', '¡En llamas! Racha de {n} 🔥',
    ],
    error: [
      'Casi... ¡la próxima la clavas! La respuesta era {respuesta}.',
      'No pasa nada, así se aprende. Era {respuesta} — ¡a por la siguiente!',
      '¡Buen intento! La respuesta correcta es {respuesta}. ¡Tú puedes!',
      'Se te escapó por poco. Era {respuesta}. ¡Sigue así, vas muy bien!',
    ],
    resultado3: [
      '¡3 estrellas! Eres un verdadero astronauta matemático 🌟🌟🌟',
      '¡Misión perfecta, {nombre}! No hay planeta que se te resista 🚀',
      '¡Increíble! Dominaste este nivel por completo.',
    ],
    resultado2: [
      '¡Muy bien, {nombre}! 2 estrellas, ya casi lo dominas 🌟🌟',
      '¡Buen vuelo! Un poco más de práctica y sacas las 3 estrellas.',
    ],
    resultado1: [
      '¡Lo lograste! Sigue practicando y subirás de nivel 🌟',
      '¡Nivel superado! Cada intento te hace mejor.',
    ],
    resultado0: [
      'Este planeta es duro, pero no imposible. ¡Vuelve a intentarlo, {nombre}!',
      '¡Casi! Repasa la lección y vuelve a intentarlo, tú puedes con esto.',
      'No te rindas — hasta los mejores astronautas repiten misiones.',
    ],
    logroNuevo: [
      '¡Nuevo logro desbloqueado! 🏆', '¡Ganaste una insignia nueva! 🎖️',
    ],
  };

  function frase(banco, datos) {
    const opciones = FRASES[banco] || [''];
    let texto = opciones[Math.floor(Math.random() * opciones.length)];
    Object.entries(datos || {}).forEach(([clave, valor]) => {
      texto = texto.replace(new RegExp(`\\{${clave}\\}`, 'g'), valor);
    });
    return texto;
  }

  window.SM = window.SM || {};
  window.SM.mascota = { svg, frase };
})();
