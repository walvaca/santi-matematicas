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
`walvaca/santi-matematicas`) — Santi ya la usa en su celular real. El tag de git más
reciente marca la versión que está jugando (revisar `git tag` para saber cuál es);
cualquier cambio nuevo debe commitearse y pushearse a `main` para que le llegue
(`git push`, sin pasos extra de publicación — Pages se re-despliega solo). Si se hace
un cambio grande que valga la pena marcar como hito, seguir con
`git tag -a vX.Y -m "..."` + `git push origin vX.Y`.

## Stack técnico
- Sin framework, sin build step. `index.html` (estructura + CSS en `<style>`) + JS
  vanilla en `js/*.js`, cada archivo cuelga de un namespace `window.SM`
  (`SM.progreso`, `SM.mundos`, `SM.generadores`, `SM.mascota`, `SM.sonido`, `SM.juego`,
  `SM.arcade`, `SM.ui`), cargados en orden fijo desde `index.html`. No hay `package.json`.
- Persistencia: **localStorage** (clave `superSantiProgreso`) — estrellas por nivel,
  XP total, racha de días, logros. Es JSON pequeño, no hace falta IndexedDB.
- `manifest.json` + `sw.js` — PWA instalable/offline, mismo patrón que
  `tsi-catalogo/sw.js` (red primero, cae a caché sin internet). Los dos `fetch()` de
  `sw.js` usan `{cache:'reload'}`/`{cache:'no-store'}` a propósito — sin eso, un
  `fetch()` normal puede resolver desde la caché HTTP del navegador aunque haya
  internet, y una revisita real sirvió JS viejo pese a haber subido `CACHE_NAME`. Si
  se vuelve a tocar `sw.js`, no quitar esas opciones sin motivo.
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

## Reto diario y racha (`progreso.retoDiario` / `progreso.metaDiariaXP`)
Pedido explícito del usuario: "si Santi no cumple los retos diarios, los avances se
reinician a 0" — para que la pereza no gane. **Decisión de diseño (a respetar en
cambios futuros): lo que se reinicia a 0 es la RACHA, nunca las estrellas/XP/logros
ya ganados.** Borrar de golpe semanas de progreso por saltarse un día habría sido
desproporcionado y habría logrado el efecto contrario (desmotivar en vez de
motivar) — si algún día se pide literalmente borrar todo el progreso, confirmar
explícitamente con el usuario antes de tocar esta lógica, porque ya se decidió una
vez que NO es lo que conviene.

Mecánica (`actualizarProgresoDiario` + `sumarXP`, ambas en `progreso.js`):
- Cada día tiene una meta de XP (`estado.metaDiariaXP`, por defecto 60, editable en
  Ajustes → "🔥 Reto diario y racha"). `estado.retoDiario = { fecha, xpHoy,
  cumplidoHoy }` lleva la cuenta de HOY.
- `sumarXP()` es el único punto donde sube `estado.xp` (nivel normal, quiz o
  arcade — todos pasan por ahí) y también acumula `retoDiario.xpHoy`. En cuanto
  `xpHoy` cruza `metaDiariaXP` por primera vez en el día, `racha.dias` sube EN ESE
  MOMENTO (no hay que esperar al día siguiente para verlo) y devuelve
  `retoCumplidoAhora: true`, que la pantalla de resultados usa para mostrar una
  tarjeta de celebración ("🎯 ¡Reto diario cumplido!").
- `actualizarProgresoDiario()` corre una vez al abrir la app (`app.js`). Si es un
  día nuevo Y (el reto del último día activo NO se había cumplido, O ese último día
  activo no fue literalmente ayer — o sea, se saltó uno o más días sin abrir la app
  siquiera), pone `racha.dias = 0`. Si sí se cumplió Y fue ayer, la racha ya subió
  en su momento — aquí no se toca. Después arma el reto de hoy desde cero.
  Limitación conocida y aceptada: si Santi juega cruzando la medianoche, el reto no
  rueda hasta el próximo `DOMContentLoaded` (mismo límite que ya tenía la racha
  antes de este cambio).
- Inicio (`pantallaInicio`) muestra el reto de hoy con barra de progreso, arriba de
  la tarjeta de "próxima meta".

## Metas y premios reales (`progreso.metas`, gestionado en Ajustes)
Sistema de metas de XP con premios de la vida real (Roblox, pizza, cine, lo que el
adulto decida) — pedido explícito del usuario, **no** se inventaron montos fijos:
el padre/madre define nombre, emoji, puntos XP y (opcional) racha mínima de cada
meta desde la sección "🎁 Metas y premios" dentro de Ajustes
(`SM.progreso.agregarMeta` / `eliminarMeta` / `reclamarMeta`). Vienen 3 metas de
ejemplo por defecto (`metasPorDefecto()` en `progreso.js`) que el adulto puede
editar o borrar libremente:

| Meta | XP | Racha mínima |
|---|---|---|
| 30 min de Roblox | 400 | 2 días |
| Noche de pizza | 1200 | 5 días |
| Ir al cine | 3000 | 10 días |

**Por qué llevan racha mínima, no solo XP alto:** el usuario reportó que Santi sacó
las 3 metas originales (300/700/1500 XP, sin racha) en un solo día de juego intenso
— el XP a secas se puede farmear rejugando niveles ya dominados en una sola tarde.
La racha, en cambio, solo sube un día calendario a la vez sin importar cuánto se
juegue, así que exigirla junto con el XP (`SM.progreso.metaLista`, ambas
condiciones deben cumplirse) obliga a jugar de forma constante en el tiempo, no de
golpe. Al agregar una meta nueva desde Ajustes, dejar "Racha mínima" en 0/vacío
sigue siendo válido (meta solo por XP), pero para premios grandes conviene ponerle
una — es la defensa real contra volver a "sacarlas todas en un día".

**Nota para el usuario, no solo para el código:** estos valores nuevos son el
*default de una bóveda nueva* — el teléfono de Santi ya tiene sus propias metas
guardadas en su `localStorage` (posiblemente ya reclamadas con los montos viejos).
Este cambio de código no las toca. Si se quiere aplicar el ajuste a su partida real,
hay que entrar a Ajustes en su celular y editar/borrar/crear las metas a mano — la
pantalla ya lo permite por completo.

Pantalla propia para Santi (`SM.ui.pantallaPremios`, pestaña "🎁 Metas" en la barra
inferior) donde ve el progreso de cada meta con una barra (dos barras si tiene
racha mínima: XP y racha); cuando la alcanza se marca "🎉 ¡Lista!" pero **solo el
adulto puede marcarla "✅ entregada"** desde Ajustes (`reclamarMeta`) — Santi no
puede auto-otorgarse el premio, solo mostrarle a un adulto que ya la ganó.
`revisarMetasAlcanzadas` (en `progreso.js`) se llama cada vez que sube el XP (nivel
normal, quiz o arcade) y devuelve las metas recién alcanzadas (`metasNuevas`) para
que la pantalla de resultados muestre una tarjeta de celebración, igual que con los
logros — usa un flag `notificada` separado de `reclamada` para no repetir el aviso
en cada partida futura.

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

## Arcade: 3 mini-juegos a elegir (`js/arcade.js`)
Pestaña "🕹️ Arcade" en la barra inferior → `SM.ui.pantallaArcade` es un MENÚ (no un
solo juego): lista `SM.arcade.JUEGOS` con tarjeta + mejor puntaje + botón jugar por
cada uno. Se agregaron 2 juegos más a Invasores Numéricos a pedido explícito del
usuario ("crea más juegos, Santi debe escoger entre varios para que no se aburra") —
cada uno con una mecánica de interacción distinta a propósito, no son 3 variantes
del mismo juego:

1. **Invasores Numéricos** (`crearPartidaInvasores`, `pantallaInvasores`) — reflejos:
   naves con números (o fracciones) caen del cielo; arriba se muestra una **regla**
   que rota cada ~18s ("¡Dispara a los múltiplos de 7!", pares/impares, fracciones
   mayores/menores que 1/2, etc.); tocar una nave que cumple la regla suma puntos
   con combo (se reinicia si fallas o si se te escapa una correcta sin disparar);
   3 vidas, partida de 90s, la velocidad de caída/aparición sube con el puntaje.
2. **Memoria Espacial** (`crearPartidaMemoria`, `pantallaMemoria`) — memoria, sin
   presión de reflejos: 8 pares de cartas (operación ↔ resultado, ej. "7 × 8" con
   "56"), voltea de a 2 para encontrar parejas; `generarHechosUnicos` evita
   resultados repetidos entre pares para que no haya coincidencias ambiguas;
   partida de 120s, combo por aciertos seguidos.
3. **Escalera Numérica** (`crearPartidaEscalera`, `pantallaEscalera`) — orden bajo
   presión: 5 números en pantalla, hay que tocarlos de menor a mayor lo más rápido
   posible; cada escalón completado sube la dificultad (rango de números más
   grande) y genera una ronda nueva; 3 vidas, partida de 90s.

Cada `crearPartidaX()` lleva solo el estado/puntaje (puro, sin DOM) — la animación
usa `requestAnimationFrame` dentro de su pantalla correspondiente, con el mismo
patrón vanilla que ya usaba Invasores (sin canvas). Los 3 comparten la pantalla de
resultados (`mostrarResultadoArcade` en `ui.js`, un solo lugar: registra el
resultado, celebra récord/logros/metas/reto diario, ofrece reintentar o volver).

`progreso.arcade.juegos` guarda mejor puntaje y partidas jugadas **por juego**
(`{ invasores: {...}, memoria: {...}, escalera: {...} }` — antes era un solo
objeto plano, ahora es multi-juego; `migrarArcade()` en `progreso.js` convierte
bóvedas viejas sin romper el mejor puntaje ya guardado de Invasores). El puntaje de
cualquier partida da algo de XP al pool global vía `registrarResultadoArcade(estado,
juegoId, puntaje)` y puede desbloquear los logros "Cadete cazador"/"Francotirador
espacial" (ahora se fijan en el mejor puntaje de CUALQUIER juego de arcade, no solo
Invasores). Para agregar un cuarto juego: seguir el mismo patrón (función pura
`crearPartidaX` en `arcade.js` + pantalla en `ui.js` que llama a
`mostrarResultadoArcade` al terminar + agregar la entrada a `SM.arcade.JUEGOS`).

**Balance (revisado — el arcade NO debe ser el camino fácil):** el usuario reportó
que Santi lograba el reto diario y hasta las metas de premios jugando solo arcade,
sin tocar los planetas de matemáticas de verdad. Dos ajustes, a propósito, que no
hay que revertir sin que el usuario lo pida:
1. La conversión de puntaje de arcade a XP se bajó a la mitad
   (`Math.round(puntaje / 10)` en `registrarResultadoArcade`, antes `/ 5`).
2. Los 3 juegos se hicieron más difíciles y menos generosos en puntos: partidas más
   cortas (Invasores/Escalera 90s→75s, Memoria 120s→100s), puntos por acierto más
   bajos (Invasores/Escalera 10→7 por combo, Memoria 20→14), y la dificultad sube
   más rápido (Invasores: `velocidad`/`intervaloSpawnMs` con denominador 150→110;
   Escalera: el rango de números por escalón crece ×9 en vez de ×6).

`metaDiariaXP` por defecto también subió de 60 a 100 — con el arcade nerfeado, ya
no se completa solo con una partida rápida. Nota igual que con las metas: esto es
el *default de una bóveda nueva*, la de Santi ya tiene su propio valor guardado —
para que le aplique hay que cambiarlo a mano en Ajustes en su celular (el campo
"Meta diaria de XP" ya existe para eso).

## Generación de preguntas (`js/generadores.js`)
Las preguntas son **procedurales**, no un banco fijo — cada `SM.generadores.<tema>`
recibe un nivel de dificultad y devuelve una pregunta nueva al azar (con las
respuestas incorrectas de opción múltiple generadas para que sean parecidas a la
correcta, no aleatorias sin sentido, para que el error también enseñe). Así el juego
no se vuelve memorizable y se puede rejugar un nivel para subir de estrellas.

## Música de fondo y sonidos especiales (`js/sonido.js`)
Pedido explícito de Santi. Sigue sin haber archivos de audio en el proyecto — la
música también es sintetizada con Web Audio API, mismo patrón que los efectos.
- `SM.sonido.musica` (`iniciar`/`detener`/`setActiva`/`estaActiva`): dos frases
  cortas de 8 notas en escala pentatónica (`PATRONES_MUSICA`) que se alternan y se
  reprograman solas al terminar cada una (`reproducirCicloMusica` se llama a sí
  misma vía `setTimeout` calculado con la duración real del patrón — no es un
  `setInterval` de duración fija, así no se desincroniza). Volumen fijo bajo (0.045)
  para no tapar los efectos. Tiene su **propio interruptor** (`estado.musica`),
  separado del de efectos (`estado.sonido`) — Ajustes tiene los dos checkboxes por
  separado. Por política de autoplay del navegador, no puede arrancar sola: `app.js`
  la engancha al primer click/touchstart real de la sesión (`{once:true}`).
- 4 efectos nuevos, todos reutilizando el `tono()` de siempre: `inicioNivel()` (al
  arrancar cualquier nivel/quiz/juego de arcade), `rachaSubida()` (más especial que
  `logro()`, cuando se cumple el reto diario), `metaAlcanzada()` (la fanfarria más
  grande de la app, solo para premios de la vida real — nunca se sub-mezcla con
  `logro()` para no restarle peso), `derrota()` (tono suave y descendente, nunca
  agresivo, cuando un juego de arcade termina por quedarse sin vidas). Cuando en un
  mismo resultado podrían sonar varias cosas a la vez (meta + racha + logro),
  `ui.js` prioriza una sola: meta > racha > logro — nunca se encima más de un
  jingle largo.

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
