/* SM.lecciones — contenido didáctico por planeta. Cada lección es una serie de
   pasos cortos (para leer en el celular sin cansarse) con trucos reales, no solo
   teoría. Los visuales son HTML/CSS simples, sin imágenes externas. */
(function () {
  function puntos(filas, cols) {
    return `<div class="sm-grid-puntos" style="--cols:${cols}">${'<span></span>'.repeat(filas * cols)}</div>`;
  }
  function pizzaDemo(n, d) {
    const pct = (n / d) * 100;
    return `<div class="sm-pizza" style="background:conic-gradient(var(--accent) 0% ${pct}%, var(--card2) ${pct}% 100%)"></div>`;
  }
  function dosPizzas(n1, d1, n2, d2) {
    return `<div class="sm-fila-pizzas">${pizzaDemo(n1, d1)}${pizzaDemo(n2, d2)}</div>`;
  }
  function balanza(izq, der) {
    return `<div class="sm-balanza"><div class="sm-balanza-plato">${izq}</div><div class="sm-balanza-barra"></div><div class="sm-balanza-plato">${der}</div></div>`;
  }

  const LECCIONES = {
    tablix: {
      titulo: 'Trucos para dominar las tablas',
      pasos: [
        { titulo: '¡Bienvenido a Tablix!', texto: 'Aquí vas a dominar las tablas de multiplicar del 0 al 12. Es la habilidad que más te va a servir en TODA la matemática que viene — vamos con trucos, no a memorizar a la fuerza.' },
        { titulo: 'Multiplicar es sumar rápido', texto: '3 × 4 significa sumar 4 tres veces: 4 + 4 + 4 = 12. Míralo como una cuadrícula: 3 filas de 4 puntos.', visual: puntos(3, 4) },
        { titulo: 'El truco del 2, el 5 y el 10', texto: 'Tabla del 2: es el doble (súmalo con sigo mismo). Tabla del 5: siempre termina en 0 o en 5. Tabla del 10: solo agrégale un 0 al número.' },
        { titulo: 'El truco de los dedos para el 9', texto: 'Para 9 × 4: baja el dedo número 4 de tus dos manos. Quedan 3 dedos a la izquierda y 6 a la derecha → ¡36! Funciona para toda la tabla del 9.' },
        { titulo: 'El truco para el 7 y el 8', texto: 'Si te cuesta una tabla difícil, descompónla: 7 × 8 = 7 × 10 − 7 × 2 = 70 − 14 = 56. Usa lo que ya sabes (multiplicar por 10) para resolver lo que no.' },
        { titulo: 'Conteo salteado', texto: 'Practica contar "salteado": para la tabla del 6, cuenta 6, 12, 18, 24, 30... Cuanto más lo hagas, más rápido las vas a recordar de memoria.' },
        { titulo: '¡Listo para despegar!', texto: 'Ya tienes las herramientas. Empieza por las tablas más fáciles y ve subiendo — cada estrella que ganes te acerca a dominar Tablix por completo. ¡Vamos, Santi!' },
      ],
    },
    numeria: {
      titulo: 'Suma y resta como un experto',
      pasos: [
        { titulo: 'Bienvenido a Numeria', texto: 'Aquí vas a sumar y restar números cada vez más grandes. La clave de todo es entender el "valor posicional": cada posición de un número vale distinto (unidades, decenas, centenas).' },
        { titulo: 'Suma sin llevar', texto: 'Se suma columna por columna, de derecha a izquierda. 23 + 45: unidades 3+5=8, decenas 2+4=6 → 68. Fácil cuando ninguna columna pasa de 9.' },
        { titulo: 'Suma llevando (acarreo)', texto: 'Cuando una columna suma más de 9, escribes la unidad y "llevas" 1 a la siguiente columna. 27 + 15: unidades 7+5=12 → escribes 2 y llevas 1. Decenas: 2+1+1=4 → 42.' },
        { titulo: 'Resta prestando', texto: 'Si la unidad de arriba es menor que la de abajo, le "pides prestada" una decena. 52 − 27: no puedes hacer 2−7, así que conviertes: 12−7=5, y la decena baja de 5 a 4: 4−2=2 → 25.' },
        { titulo: 'Truco mental: redondear', texto: 'Para sumar rápido en tu cabeza: 98 + 45 ≈ 100 + 45 − 2 = 143. Redondea al número fácil y luego ajusta.' },
        { titulo: '¡A practicar!', texto: 'Recuerda: alinea los números por columnas, empieza por la derecha, y con calma. ¡Vamos, Santi, Numeria te espera!' },
      ],
    },
    multiplux: {
      titulo: 'Multiplicar números grandes',
      pasos: [
        { titulo: 'Bienvenido a Multiplux', texto: 'Ya dominas las tablas en Tablix — ahora las vas a usar para multiplicar números más grandes. Todo lo que sigue se apoya en lo que ya sabes.' },
        { titulo: 'Multiplicar por 10 y por 100', texto: 'Multiplicar por 10 es solo agregar un 0: 23 × 10 = 230. Por 100, agregas dos ceros: 23 × 100 = 2300. ¡Así de fácil!' },
        { titulo: 'Descomponer para multiplicar', texto: '23 × 4: descompón el 23 en 20 + 3. Luego: 20 × 4 = 80, y 3 × 4 = 12. Súmalos: 80 + 12 = 92.' },
        { titulo: 'Multiplicación en columna con acarreo', texto: 'El método clásico: multiplicas cada dígito y "llevas" igual que en la suma. 47 × 6: 7×6=42 (escribes 2, llevas 4), 4×6=24, +4 llevado = 28 → 282.' },
        { titulo: 'Dos dígitos por dos dígitos', texto: 'Multiplica el número de abajo por cada parte del de arriba y suma los resultados, corriendo un espacio la segunda fila. Con calma y por partes, cualquier multiplicación se puede.' },
        { titulo: '¡A conquistar Multiplux!', texto: 'Recuerda tus tablas de Tablix — son la base de todo esto. ¡Tú puedes, Santi!' },
      ],
    },
    divisorix: {
      titulo: 'Repartir en partes iguales',
      pasos: [
        { titulo: 'Bienvenido a Divisorix', texto: 'Dividir es repartir algo en partes iguales. Si tienes 12 galletas y las repartes entre 3 amigos, cada uno recibe 4: 12 ÷ 3 = 4.' },
        { titulo: 'La relación mágica con la multiplicación', texto: 'Dividir es lo contrario de multiplicar. Si sabes que 6 × 7 = 42, automáticamente sabes que 42 ÷ 7 = 6 y 42 ÷ 6 = 7. ¡Tus tablas de Tablix te sirven aquí también!' },
        { titulo: 'División exacta', texto: 'Pregúntate: "¿cuántas veces cabe el divisor en el dividendo?" 36 ÷ 9: piensa en la tabla del 9... 9×4=36, entonces 36 ÷ 9 = 4.' },
        { titulo: 'Cuando sobra algo (residuo)', texto: 'No siempre la división es exacta. 17 ÷ 5: 5×3=15, y sobran 2. Entonces 17 ÷ 5 = 3 y sobran 2. ¡No pasa nada, es normal que sobre algo!' },
        { titulo: 'Números más grandes', texto: 'Para 3 dígitos entre 1, ve probando de a poco: primero cuántas veces cabe en las centenas, luego sigues con el resto. Con práctica se vuelve automático.' },
        { titulo: '¡A repartir en Divisorix!', texto: 'Usa siempre tus tablas de multiplicar como ayuda — dividir se vuelve fácil cuando las conoces bien. ¡Vamos, Santi!' },
      ],
    },
    fracciolandia: {
      titulo: 'El mundo de las fracciones',
      pasos: [
        { titulo: 'Bienvenido a Fracciolandia', texto: 'Una fracción es una parte de un todo — como una pizza cortada en pedazos. Si cortas la pizza en 4 partes y te comes 1, comiste 1/4 (un cuarto) de la pizza.', visual: pizzaDemo(1, 4) },
        { titulo: 'Numerador y denominador', texto: 'En 3/4: el número de abajo (4) dice en cuántas partes se cortó el todo. El de arriba (3) dice cuántas partes tomaste. ¡Abajo el total, arriba lo que tienes!', visual: pizzaDemo(3, 4) },
        { titulo: 'Fracciones equivalentes', texto: '1/2 y 2/4 son la misma cantidad, solo cortadas distinto. Si multiplicas arriba y abajo por el mismo número, la fracción no cambia de tamaño, solo de nombre.', visual: dosPizzas(1, 2, 2, 4) },
        { titulo: 'Comparar fracciones', texto: 'Con el mismo denominador (mismo tamaño de corte), gana la que tiene el numerador más grande: 3/8 es mayor que 2/8. ¡Imagina las pizzas cortadas igual!' },
        { titulo: 'Sumar y restar fracciones', texto: 'Cuando el denominador es el mismo, solo sumas o restas los de arriba y el de abajo queda igual: 2/6 + 3/6 = 5/6.' },
        { titulo: 'Fracción de un número', texto: 'Para hallar 1/4 de 20: divide 20 entre el denominador (20÷4=5) y multiplica por el numerador (5×1=5). ¡Así de simple!' },
        { titulo: '¡A explorar Fracciolandia!', texto: 'Piensa siempre en pizzas o barras repartidas — vas a ver que las fracciones son más fáciles de lo que parecen. ¡Vamos, Santi!' },
      ],
    },
    incognita: {
      titulo: 'El número misterioso',
      pasos: [
        { titulo: 'Bienvenido a Incógnita', texto: 'Aquí vas a resolver acertijos con un número misterioso, que en matemáticas se escribe como "x". Tu misión: descubrir cuánto vale x.' },
        { titulo: 'La balanza perfecta', texto: 'Piensa en una ecuación como una balanza: los dos lados siempre deben pesar igual. Si le haces algo a un lado (sumar, restar), tienes que hacerle lo mismo al otro para que siga en equilibrio.', visual: balanza('x + 5', '12') },
        { titulo: 'Resolver x + a = b', texto: 'Para despejar x en "x + 5 = 12", resta 5 de ambos lados: x = 12 − 5 = 7. ¡Lo que le quitas a un lado, se lo quitas al otro!' },
        { titulo: 'Resolver a × x = b', texto: 'Para "4 × x = 20", divide ambos lados entre 4: x = 20 ÷ 4 = 5. Multiplicar y dividir se cancelan, igual que sumar y restar.' },
        { titulo: 'Patrones y secuencias', texto: 'En 2, 5, 8, 11, ___ cada número sube 3. Descubre la regla (súmalo o réstalo) y sigue el patrón para hallar el siguiente número.' },
        { titulo: '¡A resolver el misterio!', texto: 'El álgebra es solo un acertijo con reglas fijas. Encuentra la operación contraria y despeja x. ¡Tú puedes, Santi!' },
      ],
    },
    radix: {
      titulo: 'Raíz cuadrada, el tema nuevo del cole',
      pasos: [
        { titulo: 'Bienvenido a Radix', texto: 'Este es el tema que están viendo ahora en el colegio. La raíz cuadrada (√) es la operación contraria a elevar al cuadrado: te pregunta "¿qué número multiplicado por sí mismo da este resultado?".' },
        { titulo: 'Un ejemplo con dibujo', texto: '√9 = 3 porque 3 × 3 = 9. Mira: si acomodas 9 puntos en un cuadrado perfecto, te queda de 3 filas por 3 columnas — por eso se llama "cuadrada".', visual: puntos(3, 3) },
        { titulo: '¡Ya sabes esto!', texto: 'Como ya dominas las tablas en Tablix, sacar raíces es fácil: piensa "¿qué número por sí mismo da este resultado?". Para √64, piensa en la tabla: 8 × 8 = 64, entonces √64 = 8.' },
        { titulo: 'Los cuadrados perfectos', texto: 'Apréndete estos de memoria y vas a volar: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144 — son 1² hasta 12², los mismos números de tus tablas.' },
        { titulo: 'Cuando no es exacto', texto: 'No todo número tiene raíz exacta. √50 no da un número entero, pero puedes decir "está entre 7 y 8", porque 7×7=49 y 8×8=64, y 50 queda en el medio.' },
        { titulo: '¡A conquistar Radix!', texto: 'Usa tus tablas como ayuda y vas a dominar las raíces cuadradas más rápido de lo que crees. ¡Vamos, Santi!' },
      ],
    },
  };

  // "Profesor virtual": una explicación corta y siempre disponible del MÉTODO general
  // de cada planeta (con un ejemplo propio, distinto al de la pregunta en pantalla) —
  // para cuando Santi necesita un empujón paso a paso sin que se le regale la
  // respuesta de la pregunta que tiene enfrente. Ver botón "🤖" en la pantalla de juego.
  const METODOS = {
    tablix: { titulo: 'Cómo sacar una tabla de multiplicar', pasos: [
      'Piensa en el primer número como "grupos", y el segundo como "cuántos hay en cada grupo".',
      'Usa un truco: dobla, cuenta salteado, o descompón el número más difícil en uno fácil (como el 10).',
    ], ejemplo: 'Ejemplo: 6 × 7 = 6 × 5 + 6 × 2 = 30 + 12 = 42' },
    numeria: { titulo: 'Cómo sumar y restar paso a paso', pasos: [
      'Alinea los números por su valor: unidades con unidades, decenas con decenas.',
      'Opera desde la derecha hacia la izquierda. Si te pasas de 9 al sumar, "llevas" 1 a la siguiente columna; si al restar te falta, "pides prestado" a la decena.',
    ], ejemplo: 'Ejemplo: 48 + 27 → unidades 8+7=15 (escribo 5, llevo 1), decenas 4+2+1=7 → 75' },
    multiplux: { titulo: 'Cómo multiplicar números grandes', pasos: [
      'Descompón el número más grande en decenas y unidades.',
      'Multiplica cada parte por separado y luego suma los resultados.',
    ], ejemplo: 'Ejemplo: 34 × 6 → 30×6=180, 4×6=24 → 180+24=204' },
    divisorix: { titulo: 'Cómo dividir paso a paso', pasos: [
      'Pregúntate "¿cuántas veces cabe el divisor en el dividendo?" — usa tus tablas de multiplicar al revés.',
      'Multiplica el divisor por tu respuesta: si no te da exacto el dividendo, lo que falta es el residuo.',
    ], ejemplo: 'Ejemplo: 45 ÷ 9 → tabla del 9: 9×5=45, entonces 45÷9=5 exacto' },
    fracciolandia: { titulo: 'Cómo trabajar con fracciones', pasos: [
      'El de abajo (denominador) dice en cuántas partes se cortó el todo; el de arriba (numerador), cuántas partes tienes.',
      'Con el mismo denominador, para sumar o restar solo operas los de arriba — el de abajo queda igual.',
    ], ejemplo: 'Ejemplo: 2/6 + 3/6 = (2+3)/6 = 5/6' },
    incognita: { titulo: 'Cómo despejar el número misterioso (x)', pasos: [
      'Piensa en una balanza: lo que le hagas a un lado, hazlo también al otro para que siga en equilibrio.',
      'Si x está sumando, resta ese número de ambos lados. Si está multiplicando, divide ambos lados entre ese número.',
    ], ejemplo: 'Ejemplo: x + 6 = 14 → x = 14 − 6 = 8' },
    radix: { titulo: 'Cómo sacar una raíz cuadrada', pasos: [
      'Pregúntate "¿qué número multiplicado por sí mismo me da este resultado?".',
      'Prueba con los cuadrados que ya conoces: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144 — hasta encontrar el que coincide.',
    ], ejemplo: 'Ejemplo: √81 → ¿qué número × sí mismo = 81? → 9×9=81 → √81=9' },
  };

  function obtener(mundoId) { return LECCIONES[mundoId] || null; }
  function metodo(mundoId) { return METODOS[mundoId] || null; }

  window.SM = window.SM || {};
  window.SM.lecciones = { obtener, metodo };
})();
