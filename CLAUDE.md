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
  `SM.arcade`, `SM.tablasCentro`, `SM.ui`), cargados en orden fijo desde `index.html`. No hay `package.json`.
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

## Contenido: los 8 planetas (`js/mundos.js`)
Orden fijo por prioridad/dificultad. **Todos los planetas están visibles desde el
inicio** (no se obliga a repasar lo que Santi ya sabe), pero **dentro de cada
planeta los niveles se desbloquean en secuencia** (hace falta al menos 1 estrella
en un nivel para abrir el siguiente).

1. **Tablix** (6 niveles) — tablas de multiplicar (0-12). **Rediseñado a pedido del
   usuario**: reportó que Santi "aprendía muy poco" porque se quedaba acampando en
   los niveles de tabla aislada (antes había 15 niveles, 11 de ellos una sola tabla
   cada uno, y la mezcla real solo aparecía al final). Ahora NINGÚN nivel aísla una
   tabla — todos combinan fáciles y difíciles desde el nivel 1, con un "pool" de
   tablas que crece nivel a nivel (currículo en espiral) y un nivel dedicado a
   reforzar las tablas objetivamente más difíciles (6,7,8,9) sin aislarlas del todo
   (siempre mezcladas con un par de fáciles). Ver el comentario en `mundos.js` junto
   al array de niveles de Tablix antes de tocarlo — repetir un número en `rango` es
   la forma de subirle peso/frecuencia sin cambiar `generadores.js`. Además de estos
   niveles, Tablix tiene un **Centro de Tablas** con métodos extra (Minuto Loco,
   Tarjetas Rápidas, Conteo Salteado) — ver la sección propia más abajo.
2. **Numeria** (11 niveles) — suma y resta, con/sin llevar, 1 a 4 dígitos, problemas
   cortos (suma y resta por separado).
3. **Multiplux** (10 niveles) — multiplicación de varios dígitos, construye sobre las
   tablas de Tablix (2×1 → 3×1 → 2×2 → 3×2).
4. **Divisorix** (10 niveles) — división: reparto equitativo, relación inversa con
   multiplicar, exacta y con residuo por separado en cada tamaño de dividendo.
5. **Fracciolandia** (9 niveles) — qué es una fracción (barras/círculos en SVG, sin
   imágenes), equivalentes, **simplificar**, comparar, sumar/restar mismo
   denominador, fracción de un número, y **sumar con distinto denominador** (nivel
   Experto — solo casos donde un denominador es múltiplo del otro; el generador de
   este nivel NO se reescribió para usar el mcm completo de Factorix, sigue siendo
   el caso simple — sería una mejora natural a futuro, no hecha todavía).
6. **Incógnita** (9 niveles) — álgebra básica: "número misterioso", ecuaciones
   simples con metáfora de balanza, patrones crecientes y decrecientes por separado.
7. **Radix** (9 niveles) — raíz cuadrada, agregado a pedido explícito del usuario
   porque es el tema que Santi está viendo AHORA en el colegio. Raíces de cuadrados
   perfectos (1-144, los mismos números de las tablas hasta el 12 — se le recuerda a
   Santi esa conexión en la lección), cuadrados perfectos (la inversa, n²), y
   "¿entre qué números está?" para estimar raíces no exactas (nivel Experto).
8. **Factorix** (9 niveles) — divisores, reglas de divisibilidad (2,3,5,10), primos
   vs. compuestos, Máximo Común Divisor (MCD) y mínimo común múltiplo (mcm). Agregado
   a pedido explícito del usuario. La lección conecta a propósito con Fracciolandia
   (MCD para simplificar, mcm para sumar con distinto denominador) y con la meta de
   Santi de ser programador (números primos → criptografía). Generador nuevo
   `SM.generadores.factores` en `generadores.js` (tipos: `noEsDivisor`,
   `divisibilidad`, `primo`, `mcd`, `mcm`, `mixto`); reutiliza el `mcd()` que ya
   existía para simplificar fracciones.

Cada nivel tiene una **etiqeta de dificultad 1-4** (Fácil/Medio/Difícil/Experto,
campo `dificultad` en `mundos.js`, constantes de color en `SM.mundos.DIFICULTADES`)
que se muestra junto a las estrellas en el mapa de niveles — el pedido original del
usuario fue "algo como en ajedrez", y se resolvió como una etiqueta por nivel, **no**
un puntaje ELO global (se le preguntó explícitamente y esa fue la elección).

**Fuera de alcance, a propósito** (se pidió dejarlo para una actualización
posterior, no hay que asumir que ya existe): decimales, porcentajes, geometría,
potencias, álgebra más avanzada. Si se pide agregar uno de estos temas, es una
ampliación nueva — sigue el mismo patrón de `mundos.js` + `generadores.js` +
`lecciones.js` que ya existe para los planetas actuales. Al agregar un planeta,
recordar también: entrada `maestro-<id>` en `LOGROS` de `progreso.js` (el logro
`mision-cumplida` y el contador de `explorador` ya son genéricos, no hace falta
tocarlos), y subir `CACHE_NAME` en `sw.js`.

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

## Modo enfoque: solo tablas (`estado.modoSoloTablas`, gestionado en Ajustes)
Pedido explícito y urgente del usuario (2026-09-16): Santi "casi pierde el año" por
no dominar las tablas de multiplicar, y se dispersaba entre 8 planetas y 5 juegos de
arcade en vez de enfocarse ahí. `estado.modoSoloTablas` (booleano, default **true**
incluso para bóvedas ya guardadas — ver el comentario en `cargar()` en
`progreso.js`, es de los pocos valores nuevos de esta app que sí debía aplicar de
inmediato a la partida real de Santi) es un interruptor reversible, no una
eliminación de contenido — nada se borró del código, todo sigue ahí para cuando el
adulto lo vuelva a apagar desde Ajustes ("🎯 Modo enfoque: solo tablas de
multiplicar").

**Con el modo activo:**
- `pantallaInicio` (`ui.js`) bloquea todos los planetas menos Tablix: se ven
  (candado 🔒, mismo lenguaje visual que un nivel bloqueado dentro de un planeta),
  pero el botón está `disabled` — no hay URL routing en esta app, así que bloquear
  el botón de la grilla basta para que sean inalcanzables por la UI normal.
- Los 5 juegos de arcade generan SOLO contenido de tablas de multiplicar (0 al 12),
  mezclando tablas bajas y altas a propósito (mismo espíritu que el rediseño de
  Tablix: nunca aislar solo lo fácil). Esto se logra con un parámetro `soloTablas`
  nuevo, threaded desde `caja.estado.modoSoloTablas` en cada `pantallaX` de `ui.js`
  hasta el `crearPartidaX(dificultadId, soloTablas)` correspondiente en `arcade.js`:
  - **Invasores / Agujeros Negros / Esquiva Asteroides** (comparten `crearReglas`):
    cada regla del banco ahora lleva `{tabla: true/false, crear}`; con `soloTablas`,
    `elegirRegla(factor, soloTablas)` filtra a solo las 2 reglas etiquetadas
    `tabla:true` ("¡Dispara a los resultados de la TABLA DEL N!" — antes decía
    "MÚLTIPLOS de N", se renombró para usar el mismo lenguaje que el colegio — y
    "vale a × b"). El resto del banco (mayor/menor, pares/impares, fracciones,
    suma, resta) sigue en el código, solo no se elige mientras el modo esté activo.
  - **Memoria Espacial**: `generarHechosUnicos(cantidad, factor, soloTablas)` con
    `soloTablas` genera ÚNICAMENTE parejas de multiplicación (nunca suma/resta),
    con el multiplicando mezclando tablas bajas y altas.
  - **Escalera**: es el cambio más grande — con `soloTablas`, `crearPartidaEscalera`
    deja de usar el modo "partes de un número" (½, ⅓...) y pasa a **"Escalera de
    Tablas"**: cada ronda genera tiles con productos a×b DISTINTOS (ej. "7 × 8" y
    "6 × 9") que hay que calcular y ordenar de menor a mayor resultado — a
    propósito NO usa un solo multiplicando fijo con multiplicadores variables,
    porque ahí el orden se podría adivinar sin calcular nada (mayor multiplicador
    = mayor resultado); con productos de pares distintos, dos resultados pueden
    quedar muy cerca (56 vs 54) y de verdad hay que saberse las tablas. El nombre
    mostrado en `pantallaArcade` también cambia dinámicamente a "Escalera de
    Tablas" mientras el modo esté activo (ver el `map` de tarjetas en
    `pantallaArcade`, `ui.js`) — cuando se apague, vuelve a ser "Escalera de
    Divisores" con su lógica original intacta.
- **Cobertura completa para premios** (sección de abajo) se ajusta sola: con el
  modo activo, `coberturaDetalle` solo exige Tablix (no los 8 planetas — sería
  imposible mientras los otros 7 están bloqueados), pero sigue exigiendo los 5
  juegos de arcade.
- Logros específicos de otros planetas (`maestro-numeria`, etc.) y "Explorador
  espacial" (visitar las 8 lecciones) quedan naturalmente en pausa mientras el modo
  esté activo — no es un bug, es la consecuencia esperada de bloquear esos
  planetas; vuelven a ser alcanzables en cuanto el adulto apague el modo.

**Reinicio de racha:** botón nuevo "🔄 Reiniciar racha a 0" en Ajustes
(`SM.progreso.reiniciarRacha`), separado del botón destructivo de "Reiniciar todo
el progreso" — pedido explícito del usuario ("volvamos a iniciar desde 00"). Solo
toca `estado.racha` y `estado.retoDiario`; NUNCA toca estrellas/XP/logros, que en
esta app nunca se borran solos (mismo principio documentado arriba para el reto
diario).

## Centro de Tablas: métodos extra para dominar las tablas rápido (`js/tablas.js`)
Pedido explícito y urgente del usuario (2026-09-17): Santi perdió la materia, está en
recuperación y tiene sustentación el lunes 2026-09-21 — para ese día debe saberse
TODAS las tablas. Se pidió reforzar la app "mediante módulos de acuerdo a cada
tema", empezando por un módulo de tablas con varios métodos comprobados de
aprendizaje (no solo más niveles). Nuevo namespace `SM.tablasCentro` (archivo propio
`js/tablas.js`, cargado entre `lecciones.js` y `juego.js`) con 3 herramientas, cada
una un método distinto:
- **Minuto Loco** (`crearSesionMinutoLoco`): fluidez cronometrada (60s) en UNA sola
  tabla elegida por Santi — estilo "Mad Minute", el método clásico para automatizar
  una tabla en pocos días. Preguntas b=1..12 barajadas sin repetir hasta cubrir la
  tabla entera.
- **Tarjetas Rápidas** (`crearSesionFlashcards`): 15 preguntas de recuerdo directo,
  priorizando los "hechos" (combinación a×b, a y b entre 1 y 12, se excluye ×0 por
  trivial) que Santi nunca ha practicado o más falla — repetición espaciada
  simplificada (retrieval practice), no un banco fijo.
- **Conteo Salteado** (`crearSesionConteo`): memorizar la secuencia 0, tabla,
  2×tabla... de una tabla elegida, con preguntas "qué sigue" mostrando los últimos
  4 términos.

**Decisiones importantes a respetar si se vuelve a tocar este módulo:**
- Las 3 sesiones piden la respuesta ESCRITA (teclado numérico), nunca opción
  múltiple — a propósito distinto del resto de Tablix (`generadores.js` genera
  siempre opción múltiple para `tablas`), porque memorizar de verdad exige producir
  el resultado, no reconocerlo entre 4 opciones.
- A propósito NO tocan el motor compartido `SM.juego` (usado por los otros 7
  planetas) ni `generadores.js` — tienen su propia sesión en `tablas.js`, con la
  misma forma (`preguntaActual/racha/correctas/terminada/responder/avanzar/
  finalizar/calcularEstrellas`) para que `ui.js` las pinte con un único renderer
  genérico (`pantallaSesionTablas`) en vez de triplicar `pantallaJuego`.
- El "mapa de dominio" (`SM.progreso.resumenDominioTablas`, estado.tablasFacts,
  `"axb" -> {aciertos,fallos}`) se alimenta SOLO de Tarjetas Rápidas y Minuto Loco
  (vía `SM.progreso.registrarFactTabla`), **no** de los niveles normales de Tablix —
  fue una decisión consciente para no tocar `SM.juego`/`generadores.js`. Si se pide
  que el mapa también aprenda de los niveles normales, hay que threadear `estado`
  hasta `sesion.responder()` en `juego.js` (hoy no lo recibe, solo `finalizar()` sí).
  "Dominado" = al menos 2 intentos y 80%+ de acierto en ese hecho puntual.
- XP y logros de estas 3 sesiones NO pasan por `registrarResultadoNivel` (no son
  niveles de `mundos.js`) sino por `SM.progreso.registrarResultadoMetodoTablas`, que
  sí alimenta el mismo XP/racha/reto diario/logros/metas de siempre. 2 logros nuevos:
  "Minuto de oro" (10+ aciertos en un Minuto Loco) y "Cerebro de tablas" (dominar las
  144 combinaciones).
- **Cuenta regresiva de examen** (`estado.examenTablas`, `{fecha, nota}` o `null`):
  banner motivador en el hub. Default `{fecha:'2026-09-21', nota:'Sustentación de
  recuperación de matemáticas'}` — igual que `modoSoloTablas`, este default SÍ se
  fuerza de inmediato sobre la partida YA GUARDADA de Santi (ver el comentario en
  `cargar()`, distingue "nunca existió" de "un adulto ya la quitó" con
  `!== undefined`, no con `typeof`, porque el valor es un objeto/null). Editable o
  eliminable en Ajustes ("📅 Examen o sustentación de tablas") — un adulto la debe
  actualizar a mano para la próxima fecha importante cuando esta ya haya pasado.
- **Plan de 5 días** (`estado.planTablas`, 5 booleanos): checklist manual en el hub,
  sin ninguna lógica de desbloqueo — Santi o el adulto marcan cada día a mano.
- Entrada al módulo: botón "🧠 Centro de entrenamiento de tablas" dentro de
  `pantallaMundo` (solo si `mundoId==='tablix'`), y un atajo directo en
  `pantallaInicio` cuando `estado.modoSoloTablas` está activo (que es el caso ahora)
  para no obligar a pasar primero por Tablix.
- Si se agrega una 4ª herramienta al Centro de Tablas, seguir el mismo patrón: la
  lógica pura en `tablas.js` con la forma de sesión ya descrita, y pintarla con
  `pantallaSesionTablas` en vez de escribir una pantalla nueva desde cero.

## Metas y premios reales (`progreso.metas`, gestionado en Ajustes)
Sistema de metas de XP con premios de la vida real (lo que el adulto decida) —
pedido explícito del usuario, **no** se inventaron montos fijos: el padre/madre
define nombre, emoji, puntos XP y (opcional) racha mínima de cada meta desde la
sección "🎁 Metas y premios" dentro de Ajustes (`SM.progreso.agregarMeta` /
`eliminarMeta` / `reclamarMeta`). Vienen 4 metas de ejemplo por defecto
(`metasPorDefecto()` en `progreso.js`, revisadas 2026-09-07) que el adulto puede
editar o borrar libremente:

| Meta | XP | Racha mínima |
|---|---|---|
| 🍭 Paleta Dracula | 800 | 5 días |
| 🍕 Noche de pizza | 2500 | 5 días |
| 🎬 Ir al cine | 5000 | 5 días |
| 🎮 500 Robux | 9000 | 5 días |

**Por qué llevan racha mínima, no solo XP alto:** el usuario reportó (dos veces:
al agregar la racha mínima originalmente, y de nuevo el 2026-09-07 al pedir subir
los montos) que Santi podía sacar las metas en un solo día de juego intenso — el
XP a secas se puede farmear rejugando niveles ya dominados en una sola tarde. La
racha, en cambio, solo sube un día calendario a la vez sin importar cuánto se
juegue.

**Cobertura completa — requisito nuevo, NO configurable, aplica a TODA meta**
(`SM.progreso.coberturaCompleta`/`coberturaDetalle` en `progreso.js`): a pedido
explícito del usuario ("debe haber realizado ejercicios de todos los tipos y
juegos... es indispensable"), ningún premio se puede ganar sin haber practicado
los 8 planetas (al menos 1 estrella en algún nivel de cada uno) Y los 5 juegos de
arcade (al menos 1 partida jugada en cualquier dificultad de cada uno). Esto es a
propósito INDEPENDIENTE de cada meta individual — vive como condición extra dentro
de `metaLista()`, no como campo del formulario de Ajustes, precisamente para que
no se pueda desactivar sin tocar código. `pantallaPremios` muestra una tarjeta fija
arriba de todas con el conteo "planetas practicados X/8" y "juegos jugados Y/5"
para que Santi vea qué le falta. Si se agrega un planeta o un juego de arcade
nuevo, esta cuenta se actualiza sola (itera `SM.mundos.lista` y
`estado.arcade.juegos`, no hace falta tocar nada aquí).

**Nota para el usuario, no solo para el código:** los montos de la tabla de arriba
son el *default de una bóveda nueva* — el teléfono de Santi ya tiene sus propias
metas guardadas en su `localStorage` con los montos/nombres viejos. Este cambio de
código NO las toca ni las reemplaza solo (a propósito: son datos de premios reales
ya prometidos, no es algo para migrar en silencio). Para aplicar el ajuste a su
partida real, hay que entrar a Ajustes en su celular, borrar las metas viejas y
crear las 4 de la tabla a mano — la pantalla ya lo permite por completo. La
cobertura completa, en cambio, SÍ aplica de inmediato a su partida real apenas
llegue esta actualización, sin que el adulto tenga que hacer nada — es lógica de
código, no un dato guardado.

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

## Arcade: 5 mini-juegos a elegir (`js/arcade.js`)
Pestaña "🕹️ Arcade" en la barra inferior → `SM.ui.pantallaArcade` es un MENÚ (no un
solo juego): lista `SM.arcade.JUEGOS` con tarjeta + mejor puntaje + botón jugar por
cada uno. Empezó con 1, luego 3, y ahora 5 — cada ronda de "más juegos" fue a pedido
explícito (primero "que Santi escoja entre varios", después "juegos futuristas del
espacio, muy divertidos") — cada uno con una mecánica de interacción distinta a
propósito, nunca variantes repetidas del mismo juego:

1. **Invasores Numéricos** (`crearPartidaInvasores`, `pantallaInvasores`) — reflejos:
   naves con números (o fracciones) caen del cielo; arriba se muestra una **regla**
   que rota cada ~18s, elegida al azar del banco compartido `crearReglas(factor)`
   ("¡Dispara a los múltiplos de 7!", mayor/menor que, pares/impares, "vale a × b",
   fracciones mayores que 1/2, y — agregado a pedido del usuario porque faltaba
   sumas/restas en el arcade — "vale a + b" / "vale a − b"); tocar una nave que
   cumple la regla suma puntos con combo (se reinicia si fallas o si se te escapa
   una correcta sin disparar); 3 vidas, partida de 75s, la velocidad de
   caída/aparición sube con el puntaje. Este mismo banco `crearReglas` lo reusan
   Agujeros Negros y Esquiva Asteroides (#4 y #5) — agregar una regla nueva ahí la
   suma automáticamente a los 3 juegos.
2. **Memoria Espacial** (`crearPartidaMemoria`, `pantallaMemoria`) — memoria, sin
   presión de reflejos: 8 pares de cartas (operación ↔ resultado, ej. "7 × 8" con
   "56"), voltea de a 2 para encontrar parejas; `generarHechosUnicos` mezcla
   multiplicación/suma/resta (agregada la resta a pedido del usuario, antes no
   existía) y evita resultados repetidos entre pares para que no haya coincidencias
   ambiguas; partida de 100s, combo por aciertos seguidos.
3. **Escalera de Divisores** (`crearPartidaEscalera`, `pantallaEscalera`) —
   **rediseñado a pedido del usuario**: la versión original ("Escalera Numérica")
   solo pedía tocar números al azar de menor a mayor, algo que se resolvía mirando
   sin pensar, y el usuario reportó que Santi llegaba a la meta de puntos "super
   rápido". Ahora cada ronda muestra UN número compartido `numeroBase` (siempre
   múltiplo de 120, para que toda parte dé exacto) y los tiles muestran la
   OPERACIÓN (½, ⅓, ¼, ⅕, ⅙, ⅛, ⅒ — nunca el resultado, `PARTES` en `arcade.js`),
   así que hay que calcular mentalmente cada parte antes de poder ordenarlas de
   menor a mayor resultado. El pool de partes disponibles crece con la dificultad
   (`PARTES_POR_DIFICULTAD`: principiante solo mitad/cuarta/quinta/décima; maestro
   suma tercera, sexta y octava, las mentalmente más difíciles); 3 vidas, partida
   de 75s. Si se vuelve a sentir "fácil", el nudge es el pool de partes o el
   crecimiento de `numeroBase` por escalón, NO volver a la versión de solo mirar
   y ordenar.
4. **Agujeros Negros** (`crearPartidaAgujeros`, `pantallaAgujeros`) — "whack-a-mole"
   con regla (reusa el mismo banco `REGLAS` de Invasores): grilla de 9 huecos, uno
   se ilumina un instante con un número — hay que tocarlo mientras está activo si
   cumple la regla, antes de que "se lo trague" el agujero. 3 vidas, partida de 60s,
   la ventana de tiempo para tocar se acorta con el puntaje.
5. **Esquiva Asteroides** (`crearPartidaAsteroides`, `pantallaAsteroides`) — nave en
   3 carriles (tap en un carril para moverse ahí); asteroides con números bajan por
   los carriles, hay que estar en el carril correcto cuando el asteroide llega abajo
   si cumple la regla (choque = puntos), o en cualquier otro carril si no la cumple
   (esquivarlo). 3 vidas, partida de 75s.

Cada `crearPartidaX()` lleva solo el estado/puntaje (puro, sin DOM) — la animación
usa `requestAnimationFrame` dentro de su pantalla correspondiente, con el mismo
patrón vanilla de siempre (sin canvas). Agujeros Negros y Esquiva Asteroides evitan
reconstruir todo el HTML en cada frame (a diferencia de los 3 primeros, que sí lo
hacían y no importaba por ser pocos elementos) — actualizan solo los nodos DOM que
cambiaron de estado, porque un huequito o un carril con animación de acierto/fallo
se ve mal si el siguiente frame lo pisa a los 16ms. Los 5 comparten la pantalla de
resultados (`mostrarResultadoArcade` en `ui.js`, un solo lugar: registra el
resultado, celebra récord/logros/metas/reto diario, ofrece reintentar o volver).

### Dificultad seleccionable (`SM.arcade.DIFICULTADES_ARCADE`)
Pedido explícito: "principiante, intermedio, experto, maestro", seleccionable antes
de jugar. Tocar "Jugar" en el menú ya NO entra directo al juego — pasa primero por
`SM.ui.pantallaDificultadArcade` (ruta `elegir-dificultad`, con `juegoId`), que
muestra las 4 tarjetas con el mejor puntaje de Santi en CADA una, y de ahí sí entra
al juego (`ir(juegoId, { dificultad })`). Cada `crearPartidaX(dificultadId)` recibe
el id de dificultad (ya no un `duracionSegundos` suelto) y lee `obtenerDificultad()`
para armar sus parámetros — es la MISMA lógica de juego con 4 perillas distintas
(`vidas`, `factorTiempo`, `factorVelocidad`, `factorNumeros`), no 4 juegos
separados. `factorNumeros` agranda/achica los números que usan las reglas
compartidas de Invasores/Agujeros/Asteroides (`crearReglas(factor)`, ya no es una
lista fija `REGLAS` — se reconstruye cada vez que hace falta una regla nueva) y
también escala cuántas parejas tiene Memoria (6/8/10/12) o cuántos números hay que
ordenar en Escalera (4/5/6/7). El botón "Reintentar" en la pantalla de resultados
respeta la dificultad con la que se jugó (`ir(idPantallaJuego, {dificultad})`).

`progreso.arcade.juegos[juegoId].dificultades[dificultadId]` guarda mejor puntaje y
partidas jugadas **por juego Y por dificultad** (antes era solo por juego —
`migrarArcade()` en `progreso.js` mete el progreso viejo, sin importar de qué forma
venga, en la dificultad "intermedio", que era el único modo en que se podía jugar
entonces). El puntaje de cualquier partida da algo de XP al pool global vía
`registrarResultadoArcade(estado, juegoId, dificultadId, puntaje)` y puede
desbloquear los logros "Cadete cazador"/"Francotirador espacial" (se fijan en el
mejor puntaje de CUALQUIER juego en CUALQUIER dificultad, vía el helper
`SM.progreso.mejorPuntajeJuego(juego)`). Para agregar un sexto juego: seguir el
mismo patrón (función pura `crearPartidaX(dificultadId)` en `arcade.js`, leyendo
`obtenerDificultad(dificultadId)` para sus parámetros, + pantalla en `ui.js` que
recibe `dificultad` como último argumento y llama a `mostrarResultadoArcade` al
terminar + agregar la entrada a `SM.arcade.JUEGOS`).

## Profesor virtual: explicación paso a paso bajo pedido (`SM.lecciones.metodo`)
Pedido explícito del usuario: que cada tema se pueda "explicar como un profesor
virtual, en caso que requieran alguna explicación paso a paso". Botón
"🤖 ¿Cómo se resuelve?" visible en TODA pregunta de nivel/quiz (`pantallaJuego`, no
en el arcade — el arcade mezcla reglas de varios temas a la vez, no tiene un único
"tema" al que apuntar la explicación). Al tocarlo:
- Pausa el cronómetro que esté corriendo (contrarreloj o el del modo desafío por
  pregunta — `detenerRelojTemporalmente`/`detenerTemporizadorPregunta`) para no
  penalizar a Santi por pedir ayuda; los reanuda al cerrar (`mostrarExplicacion`
  recibe un callback `alCerrar`), solo si la pregunta seguía sin responder.
- Muestra un overlay (`mostrarExplicacion` en `ui.js`) con el MÉTODO general del
  planeta actual (`SM.lecciones.metodo(mundoId)` en `lecciones.js`, 2 pasos +
  1 ejemplo por planeta, uno para cada uno de los 7). A propósito usa un ejemplo
  CON NÚMEROS DISTINTOS a los de la pregunta en pantalla — enseña el método, no
  regala la respuesta de esa pregunta puntual. Si se agrega un planeta nuevo, hay
  que agregarle también su entrada en `METODOS` o el botón no mostrará nada.

## Lecciones (`SM.lecciones.obtener`): método Singapur CPA + lenguaje de primer grado
Pedido explícito del usuario: que las explicaciones de cada tema sean "más
explicativas... como si fuera un niño de primer grado, con imágenes y juegos de
palabras", aplicando estrategias pedagógicas comprobadas — se usó el método Singapur
**CPA (Concreto → Pictórico → Abstracto)**: cada lección de `LECCIONES` en
`lecciones.js` empieza con un ejemplo de objetos cotidianos que se pueden imaginar
(galletas, chocolates, canicas), sigue con un dibujo/cuadrícula que representa lo
mismo, y termina con el número y el procedimiento. Las 7 lecciones (7-9 pasos cada
una, antes 6-7) también incluyen al menos un truco con rima o juego de palabras
(función `truco()`, caja destacada con 💡) y un cierre que conecta el tema con la
meta de Santi de ser programador (ej. "x" en álgebra = variable en código).
- **`p.texto` se pinta con `esc()` en `ui.js`** (texto plano) — nunca meter HTML ahí.
  `p.visual` sí se inserta crudo, por eso las tarjetas/cajitas van en `visual`.
- Helpers nuevos en `lecciones.js`, todos generan HTML vía CSS (sin imágenes
  externas): `emojis(cant, simbolo)` (fila de objetos concretos), `grupos(n,
  porGrupo, simbolo)` (cajas "+" para multiplicar/dividir en concreto), `rectaNumerica(min,
  max, marcados)` (recta con puntos resaltados — cuidado con rangos muy grandes,
  cada número es un nodo; el contenedor hace scroll horizontal si no cabe),
  `bloques(centenas, decenas, unidades)` (valor posicional), y `truco(texto)` (caja
  de mnemotecnia). Se suman a los ya existentes `puntos()`, `pizzaDemo()`,
  `dosPizzas()`, `balanza()`. CSS de todos en `index.html` junto a los estilos de
  fracciones/álgebra existentes.
- Si se agrega un planeta nuevo (u otro paso a uno existente), seguir el mismo
  patrón CPA y no olvidar que `METODOS` (profesor virtual, arriba) es un contenido
  aparte — no se reescribió con este cambio, sigue siendo la ayuda corta "bajo
  pedido", mientras que `LECCIONES` es la enseñanza principal.

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

## Widget de racha estilo Duolingo (Inicio, `widgetRachaHTML` en `js/ui.js`)
Pedido explícito del usuario (2026-09-26): "widgets como el de Duolingo, el de la
racha". Un widget real en la pantalla de inicio de Android exige app nativa (APK), así
que se acordó hacerlo DENTRO de la app: reemplaza la tarjeta vieja "Reto de hoy" y el
chip 🔥 de la fila de stats. Muestra llama grande con los días (gris = hoy pendiente,
naranja animada = hoy cumplido), la semana L–D marcada, barra de XP de hoy, cuenta
regresiva hasta medianoche (borde rojo pulsante si quedan ≤4 h y hay racha que
perder) y el próximo hito (logros de 3/7/14 días, 30 días, y la `rachaMinima` de las
metas). Tocarlo abre "Mis logros". Cosmo en Inicio pasa a `celebrando` si el reto de
hoy está cumplido, `animando` si no.
- Datos: `racha.historial` (fechas ISO cumplidas, últimas 60) se llena en `sumarXP`;
  para bóvedas viejas `migrarRacha` lo reconstruye desde `racha.dias` + `retoDiario`.
  `SM.progreso.semanaRacha(estado)` arma los 7 días. No cambia ninguna regla de racha.
- Cambio de día con la app abierta: el intervalo del widget (cada 30 s, limpiado en
  `detenerIntervalo`) y un `visibilitychange` en `app.js` llaman a
  `actualizarProgresoDiario` y repintan Inicio.
- Pendiente posible (no hecho): widget real de Android vía app nativa/TWA, o insignia
  en el ícono con la Badging API.

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
