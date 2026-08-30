# Súper Santi: Misión Matemática

## Qué es
Juego educativo de matemáticas por niveles, hecho a medida para Santi (11 años):
bueno con computadores y videojuegos, con una debilidad puntual en matemáticas,
urgente en las tablas de multiplicar. Es una Progressive Web App (PWA) pensada para
el celular: cada tema de matemáticas es un "planeta" que se visita en una nave, con
una mascota robot (Cosmo) que anima constantemente. Cada planeta tiene una sección de
**lección** (didáctica, con trucos y ejemplos visuales) y una sección de **niveles de
juego** (retos con puntaje, estrellas y racha). Proyecto hermano de `tsi-vault` /
`tsi-catalogo` pero de dominio totalmente distinto — no comparten código.

Publicado en `https://walvaca.github.io/santi-matematicas/` (GitHub Pages, repo
`walvaca/santi-matematicas`) — Santi ya la usa en su celular real. **v1.2** (tag de
git) es la versión que está jugando ahora mismo; cualquier cambio nuevo debe
commitearse y pushearse a `main` para que le llegue (`git push`, sin pasos extra de
publicación — Pages se re-despliega solo). Si se hace un cambio grande que valga la
pena marcar como hito, seguir con `git tag -a vX.Y -m "..."` + `git push origin vX.Y`.

## Stack técnico
- Sin framework, sin build step. `index.html` (estructura + CSS en `<style>`) + JS
  vanilla en `js/*.js`, cada archivo cuelga de un namespace `window.SM`
  (`SM.progreso`, `SM.mundos`, `SM.generadores`, `SM.mascota`, `SM.sonido`, `SM.juego`,
  `SM.arcade`, `SM.ui`), cargados en orden fijo desde `index.html`. No hay `package.json`.
- Persistencia: **localStorage** (clave `superSantiProgreso`) — estrellas por nivel,
  XP total, racha de días, logros. Es JSON pequeño, no hace falta IndexedDB.
- `manifest.json` + `sw.js` — PWA instalable/offline, mismo patrón que
  `tsi-catalogo/sw.js` (red primero, cae a caché sin internet).
- Iconos (`icon-192.png` / `icon-512.png`) generados con Pillow (script no versionado,
  en el scratchpad de la sesión que los creó) — tema espacial: cohete + planeta con
  anillo sobre fondo degradado azul-violeta.
- Sonido: efectos sintetizados con Web Audio API (`js/sonido.js`), sin archivos de
  audio — así no pesa nada y funciona offline. Toggle de silencio guardado en el
  mismo bloque de progreso.
- Sin backend, sin llamadas de red propias más allá de servir los archivos estáticos.
  CSP restrictiva en `index.html` (`default-src 'self'`, sin dominios externos —
  a diferencia de tsi-vault, esta app no sincroniza con Google Drive).

## Cómo correrlo / probarlo
Servir la carpeta con un servidor estático (`python -m http.server --directory
santi-matematicas 8010`, o `npx serve .`) — no abrir `index.html` con `file://`
porque el Service Worker no se registra ahí. Probar siempre en viewport móvil
(es el uso real: celular de Santi) y, tras la primera carga, en modo avión para
confirmar que el Service Worker sirve la app sin internet.

## Contenido: los 6 planetas (`js/mundos.js`)
Orden fijo por prioridad/dificultad. **Todos los planetas están visibles desde el
inicio** (no se obliga a repasar lo que Santi ya sabe), pero **dentro de cada
planeta los niveles se desbloquean en secuencia** (hace falta al menos 1 estrella
en un nivel para abrir el siguiente).

1. **Tablix** (15 niveles) — tablas de multiplicar (0-12), una por una y luego
   mezcladas. Prioridad urgente. Lección con trucos reales (dobles, el 9 con los
   dedos, descomposición para 7/8, conteo salteado). Termina en contrarreloj.
2. **Numeria** (11 niveles) — suma y resta, con/sin llevar, 1 a 4 dígitos, problemas
   cortos (suma y resta por separado).
3. **Multiplux** (10 niveles) — multiplicación de varios dígitos, construye sobre las
   tablas de Tablix (2×1 → 3×1 → 2×2 → 3×2).
4. **Divisorix** (10 niveles) — división: reparto equitativo, relación inversa con
   multiplicar, exacta y con residuo por separado en cada tamaño de dividendo.
5. **Fracciolandia** (9 niveles) — qué es una fracción (barras/círculos en SVG, sin
   imágenes), equivalentes, **simplificar**, comparar, sumar/restar mismo
   denominador, fracción de un número, y **sumar con distinto denominador** (nivel
   Experto — solo casos donde un denominador es múltiplo del otro, para no meter LCM
   completo, que queda fuera de alcance).
6. **Incógnita** (9 niveles) — álgebra básica: "número misterioso", ecuaciones
   simples con metáfora de balanza, patrones crecientes y decrecientes por separado.

Cada nivel tiene una **etiqeta de dificultad 1-4** (Fácil/Medio/Difícil/Experto,
campo `dificultad` en `mundos.js`, constantes de color en `SM.mundos.DIFICULTADES`)
que se muestra junto a las estrellas en el mapa de niveles — el pedido original del
usuario fue "algo como en ajedrez", y se resolvió como una etiqueta por nivel, **no**
un puntaje ELO global (se le preguntó explícitamente y esa fue la elección).

**Fuera de alcance, a propósito** (se pidió dejarlo para una actualización
posterior, no hay que asumir que ya existe): decimales, porcentajes, geometría,
potencias, álgebra más avanzada, fracciones con LCM completo. Si se pide agregar uno
de estos temas, es una ampliación nueva — sigue el mismo patrón de `mundos.js` +
`generadores.js` + `lecciones.js` que ya existe para los 6 planetas actuales.

## Quiz Final por planeta (dentro de `mundos.js`, `esQuiz: true`)
Cada planeta tiene, al final de su array `niveles`, una entrada extra con
`id: 'quiz'` y `esQuiz: true` — el "Quiz Final de [planeta]", 15 preguntas
mezclando TODOS los temas de ese planeta (reutiliza el mismo `params` que el nivel
"Mezcla de todo"/contrarreloj de cada mundo, sin generador nuevo). Se decidió con el
usuario explícitamente: **es un reto opcional, no bloquea nada** — `nivelDesbloqueado`
lo trata como siempre desbloqueado (no hace parte de la cadena secuencial de niveles
normales). Lo que lo hace "el más exigente" es la nota de aprobación: umbrales de
estrellas mucho más duros que un nivel normal (`SM.juego` calcularEstrellas: 100%
para 3★, 93% para 2★, **85% mínimo para aprobar (1★)**, si no llega a 85% son 0
estrellas y no cuenta como aprobado) y da más XP que un nivel normal (25 por estrella
+ 25 la primera vez, vs. 15+15 de un nivel normal — `registrarResultadoNivel` en
`progreso.js` lo detecta mirando `nivel.esQuiz`). Como el quiz es una entrada más
dentro de `niveles`, **ya cuenta automáticamente** en el logro "Maestro de
[planeta]" (que exige 3★ en *todos* los niveles) y en el total de estrellas del
planeta — no hizo falta tocar esa lógica.

## Metas y premios reales (`progreso.metas`, gestionado en Ajustes)
Sistema de metas de XP con premios de la vida real (Roblox, pizza, cine, lo que el
adulto decida) — pedido explícito del usuario, **no** se inventaron montos fijos:
el padre/madre define nombre, emoji y puntos XP de cada meta desde la sección
"🎁 Metas y premios" dentro de Ajustes (`SM.progreso.agregarMeta` /
`eliminarMeta` / `reclamarMeta`). Vienen 3 metas de ejemplo por defecto
(`metasPorDefecto()` en `progreso.js`: Roblox 300 XP, pizza 700 XP, cine 1500 XP)
que el adulto puede editar o borrar libremente. Usan el **mismo XP global** que ya
suman los niveles y el arcade — no es una moneda aparte.

Pantalla propia para Santi (`SM.ui.pantallaPremios`, pestaña "🎁 Metas" en la barra
inferior) donde ve el progreso de cada meta con una barra; cuando la alcanza se
marca "🎉 ¡Lista!" pero **solo el adulto puede marcarla "✅ entregada"** desde
Ajustes (`reclamarMeta`) — Santi no puede auto-otorgarse el premio, solo mostrarle a
un adulto que ya la ganó. `revisarMetasAlcanzadas` (en `progreso.js`) se llama cada
vez que sube el XP (nivel normal, quiz o arcade) y devuelve las metas recién
alcanzadas (`metasNuevas`) para que la pantalla de resultados muestre una tarjeta de
celebración, igual que con los logros — usa un flag `notificada` separado de
`reclamada` para no repetir el aviso en cada partida futura.

## Reiniciar niveles/planetas para practicar (pantallaMundo)
Pedido explícito del usuario: poder reiniciar solo un nivel (o un planeta completo)
para repasar una tarea puntual, sin tocar XP/logros/metas/arcade. Dos acciones, las
dos en `pantallaMundo`:
- Botón `↺` junto a cada nivel (solo aparece si ya tiene estrellas) → `resetearNivel`:
  borra solo las estrellas de ESE nivel.
- Botón `🔄` en el encabezado del planeta → `resetearPlaneta`: borra las estrellas de
  TODOS sus niveles (incluido el quiz) y re-bloquea el planeta desde el nivel 1.

Esto solo funciona sin romper el mapa porque el desbloqueo **ya no depende de las
estrellas del nivel anterior** — depende de `estado.progresoMaximo[mundoId]` (el
índice más alto que Santi alguna vez alcanzó), que solo sube, nunca baja al reiniciar
estrellas (`nivelDesbloqueado` en `progreso.js`). Antes dependía de
`estrellas[nivelAnterior] >= 1`, lo cual habría re-bloqueado en cascada todo lo que
viene después de un nivel reiniciado — se cambió el modelo específicamente para
evitar eso. Las bóvedas guardadas antes de este cambio no tienen `progresoMaximo`
guardado; `cargar()` lo reconstruye una vez a partir de las estrellas existentes
(`progresoMaximoInicial`) para no bloquear nada de golpe.

## Modo desafío: errores permitidos y tiempo por pregunta (agilidad)
Config global en `estado.desafio` (`{ erroresPermitidos, segundosPorPregunta }`,
ambos `null` = sin límite, es el valor por defecto), editable en Ajustes con dos
`<select>`. Se aplica **solo a niveles normales de práctica** — `SM.juego.crearSesion`
lo ignora si el nivel es contrarreloj o el quiz final, que ya tienen su propio reto
(esto pasa dentro de `juego.js`, no hay que repetir el filtro en la UI). Mecánica:
- `erroresPermitidos`: la sesión termina apenas se acumulan esa cantidad de fallos
  (como las vidas del arcade), mostrando corazones ❤️/🖤 en la barra superior.
- `segundosPorPregunta`: cronómetro que se reinicia en cada pregunta nueva
  (`sesion.tickPregunta()`, temporizador propio en `pantallaJuego`, no confundir con
  el `tick()` del contrarreloj que es de sesión completa); si llega a 0 cuenta como
  fallo automático y avanza sola.
- Como la sesión ahora puede terminar antes de responder todas las `nivel.preguntas`,
  `calcularEstrellas` usa `correctas / preguntas_intentadas` (no
  `correctas / nivel.preguntas` fijo) para no penalizar preguntas que nunca se
  llegaron a mostrar.

## Arcade: Invasores Numéricos (`js/arcade.js`)
Mini-juego aparte de los niveles normales, pensado para "ganar puntos" de forma más
arcade — pedido explícito del usuario. Pantalla propia (`SM.ui.pantallaInvasores`),
accesible desde una 4ª pestaña en la barra inferior ("🕹️ Arcade"). Mecánica: naves
con números (o fracciones) caen del cielo; arriba se muestra una **regla** que rota
cada ~18s ("¡Dispara a los múltiplos de 7!", "¡Dispara a los PARES!", fracciones
mayores/menores que 1/2, etc.); tocar una nave que cumple la regla suma puntos con
multiplicador de combo (se reinicia si fallas o si se te escapa una nave correcta sin
disparar); 3 vidas, partida de 90s, la dificultad (velocidad de caída y de aparición)
sube con el puntaje. `SM.arcade.crearPartida()` lleva solo el estado/puntaje (puro,
sin DOM) — la animación de las naves usa `requestAnimationFrame` dentro de
`pantallaInvasores`, con posiciones en píxeles actualizadas a mano (sin canvas, sigue
el patrón vanilla del resto de la app). El mejor puntaje y las partidas jugadas se
guardan en `progreso.arcade`; el puntaje de una partida da algo de XP al pool global
(`registrarResultadoArcade` en `progreso.js`) y puede desbloquear logros propios
("Cadete cazador", "Francotirador espacial").

## Generación de preguntas (`js/generadores.js`)
Las preguntas son **procedurales**, no un banco fijo — cada `SM.generadores.<tema>`
recibe un nivel de dificultad y devuelve una pregunta nueva al azar (con las
respuestas incorrectas de opción múltiple generadas para que sean parecidas a la
correcta, no aleatorias sin sentido, para que el error también enseñe). Así el juego
no se vuelve memorizable y se puede rejugar un nivel para subir de estrellas.

## Motivación (el propósito central de la app — no recortar esto en cambios futuros)
- Cosmo (mascota, `js/mascota.js`) siempre anima, nunca regaña. Banco amplio de
  frases para que no se sienta repetitivo ("¡Vamos Santi, tú puedes!", etc.).
- Una respuesta incorrecta muestra la respuesta correcta con una micro-explicación y
  anima a seguir — nunca un mensaje punitivo ni un tono de "fallaste".
- Racha de días consecutivos (compara la fecha guardada en `progreso.js` contra hoy)
  y logros/insignias visibles en "Mis logros" — son el enganche de largo plazo,
  igual de importantes que el contenido matemático en sí.

## Convenciones de código
- JS vanilla en `js/*.js`, namespace `window.SM` por archivo, sin bundler.
- Textos de interfaz en español, tono cercano y animoso (se dirige a un niño de 11
  años, no a un adulto) — evitar tecnicismos innecesarios en lecciones y feedback.
- CSS con variables en `:root` (mismo patrón que `tsi-vault`/`tsi-catalogo`), paleta
  espacial (azul-violeta oscuro de fondo, acentos cian/naranja, estrellas doradas).
