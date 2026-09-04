/* SM.lecciones — contenido didáctico por planeta. Cada lección sigue el método
   Singapur (CPA): primero CONCRETO (objetos que se pueden imaginar/contar), luego
   PICTÓRICO (un dibujo que representa lo mismo), y al final ABSTRACTO (el número y
   el procedimiento). El lenguaje está pensado para un niño de primer grado: frases
   cortas, ejemplos de la vida diaria, y trucos con rima o juego de palabras para que
   se peguen en la memoria. Los visuales son HTML/CSS simples, sin imágenes externas.
   IMPORTANTE: `texto` se pinta con esc() en ui.js (texto plano, sin etiquetas HTML);
   `visual` se inserta tal cual (HTML), así que ahí sí se arman las tarjetas/cajitas. */
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
  // Objetos "de verdad" (emoji) para la etapa CONCRETA — se pueden contar con el dedo.
  function emojis(cantidad, simbolo) {
    return `<div class="sm-emoji-fila">${(simbolo + ' ').repeat(cantidad)}</div>`;
  }
  // Grupos iguales (cajas) separados por "+" — la forma más concreta de multiplicar/dividir.
  function grupos(n, porGrupo, simbolo) {
    const caja = `<div class="sm-grupo">${(simbolo + ' ').repeat(porGrupo)}</div>`;
    return `<div class="sm-grupos-fila">${Array(n).fill(caja).join('<span class="sm-grupo-signo">+</span>')}</div>`;
  }
  // Recta numérica con puntos resaltados — para contar saltando, patrones y "entre qué números".
  function rectaNumerica(min, max, marcados) {
    const set = new Set(marcados || []);
    let html = '';
    for (let i = min; i <= max; i++) {
      html += `<div class="sm-recta-punto ${set.has(i) ? 'activo' : ''}"><span></span><b>${i}</b></div>`;
    }
    return `<div class="sm-recta">${html}</div>`;
  }
  // Bloques de valor posicional: centenas (cuadrado grande), decenas (barrita), unidades (cubito).
  function bloques(centenas, decenas, unidades) {
    const col = (cant, clase, etiqueta) => `<div class="sm-bloque-col"><div class="sm-bloque-grupo">${`<i class="${clase}"></i>`.repeat(cant)}</div><span>${etiqueta}</span></div>`;
    return `<div class="sm-bloques-fila">${centenas ? col(centenas, 'sm-bloque-cent', 'centenas') : ''}${decenas ? col(decenas, 'sm-bloque-dec', 'decenas') : ''}${col(unidades, 'sm-bloque-uni', 'unidades')}</div>`;
  }
  // Cajita destacada para rimas y trucos de memoria (juegos de palabras).
  function truco(texto) {
    return `<div class="sm-leccion-truco">💡 ${texto}</div>`;
  }

  const LECCIONES = {
    tablix: {
      titulo: 'Trucos para dominar las tablas',
      pasos: [
        { titulo: '¡Bienvenido a Tablix, capitán!', texto: 'Aquí te vas a volver un experto en las tablas de multiplicar. Si hoy te cuestan un poco, tranquilo: con estos trucos muy pronto las vas a decir de memoria, ¡como dices tu propio nombre!' },
        { titulo: 'Multiplicar es juntar grupitos iguales', texto: 'Imagina 3 platos, y en cada plato pones 4 galletas. ¿Cuántas galletas hay en total? Eso es multiplicar: 3 grupos de 4 galletas.', visual: grupos(3, 4, '🍪') },
        { titulo: 'Lo mismo, pero en cuadrícula', texto: 'Si acomodas esas 12 galletas en filas y columnas, forman un rectángulo de 3 filas por 4 columnas. Por eso 3 × 4 = 12: son 3 filas con 4 puntos cada una.', visual: puntos(3, 4) },
        { titulo: 'El signo × es un atajo', texto: 'En vez de dibujar o sumar 4 + 4 + 4, escribimos 3 × 4 = 12. El primer número dice cuántos grupos hay, el segundo dice cuántos objetos tiene cada grupo.' },
        { titulo: 'Los 3 trucos regalados: 2, 5 y 10', texto: 'Tabla del 2: es el doble (súmalo con sigo mismo). Tabla del 5: el resultado siempre termina en 0 o en 5. Tabla del 10: solo le agregas un cero al número.', visual: truco('Rima para el 5: "Si multiplicas por cinco, el resultado no es difícil: termina en cero o en cinco."') },
        { titulo: 'La manito mágica del 9', texto: 'Para 9 × 4: imagina tus 10 dedos y dobla el dedo número 4 (contando desde la izquierda). Los dedos que quedan a la izquierda son las decenas, los de la derecha las unidades: 3 y 6 → ¡36!' },
        { titulo: 'Cuando el número es difícil, pártelo', texto: '7 × 8 suena complicado, pero puedes hacer 7 × 8 = 7 × 10 − 7 × 2 = 70 − 14 = 56. Usa lo que ya sabes (multiplicar por 10) para resolver lo que no sabes.' },
        { titulo: 'Salta, salta y no pares', texto: 'Practica "contar salteado": para la tabla del 6, cuenta 6, 12, 18, 24, 30... Cada número es un salto más. Mira los saltos en la recta:', visual: rectaNumerica(0, 30, [0, 6, 12, 18, 24, 30]) },
        { titulo: '¡Listo para despegar!', texto: 'Dato curioso: los programadores usan la multiplicación todo el tiempo, por ejemplo para saber cuántos cuadritos tiene la pantalla de un videojuego (filas × columnas). ¡Dominar las tablas te acerca a ser un gran programador! Vamos, Santi, tú puedes.' },
      ],
    },
    numeria: {
      titulo: 'Suma y resta como un experto',
      pasos: [
        { titulo: 'Bienvenido a Numeria', texto: 'Aquí vas a sumar y restar números cada vez más grandes. El secreto de todo está en las "casitas" de cada número: unidades, decenas y centenas.' },
        { titulo: 'Las casitas de los números', texto: 'Imagina el número 23 como 2 grupos de 10 palitos (decenas) y 3 palitos sueltos (unidades). Cada palito vive en su propia casita.', visual: bloques(0, 2, 3) },
        { titulo: 'Sumar es juntar casitas iguales', texto: 'Para sumar 23 + 45, junta las unidades con las unidades (3 + 5 = 8) y las decenas con las decenas (2 + 4 = 6). El resultado es 68.', visual: bloques(0, 6, 8) },
        { titulo: 'Cuando una casita se llena (llevar)', texto: 'Cada casita solo aguanta hasta 9. Si al sumar te pasas, escribes la unidad y "llevas" 1 a la casita de al lado. 27 + 15: unidades 7+5=12 (escribo 2, llevo 1); decenas 2+1+1=4 → 42.' },
        { titulo: 'Restar pidiendo prestado', texto: 'Si arriba hay menos que abajo, le pides prestada 1 decena a la vecina. 52 − 27: como no puedo hacer 2−7, convierto: 12−7=5, y la decena baja de 5 a 4: 4−2=2 → 25.' },
        { titulo: 'El truco del redondeo (para hacerlo de cabeza)', texto: 'Para sumar rápido: 98 + 45 ≈ 100 + 45 − 2 = 143. Redondeas al número fácil y después ajustas lo que sobró o faltó.', visual: truco('Frase para recordar: "Redondeo, sumo fácil, y al final le hago un ajustecito."') },
        { titulo: 'Sumar contando saltos', texto: 'Para números chiquitos, puedes "saltar" en la recta numérica. Para 8 + 5, empieza en el 8 y da 5 saltos: 9, 10, 11, 12, 13. ¡Ahí está la respuesta!', visual: rectaNumerica(0, 15, [8, 9, 10, 11, 12, 13]) },
        { titulo: '¡A practicar en Numeria!', texto: 'Los programadores usan sumas y restas todo el tiempo, por ejemplo para saber cuántos puntos le quedan a un personaje de videojuego. Alinea bien tus números, ve de derecha a izquierda, y con calma. ¡Vamos, Santi, Numeria te espera!' },
      ],
    },
    multiplux: {
      titulo: 'Multiplicar números grandes',
      pasos: [
        { titulo: 'Bienvenido a Multiplux', texto: 'Ya eres un campeón de las tablas en Tablix. Ahora las vas a usar para multiplicar números más grandes. Todo lo que sigue se apoya en lo que ya sabes — nada nuevo que temer.' },
        { titulo: 'Grupos de grupos', texto: 'Imagina 4 cajas, y en cada caja hay 6 canicas. Para saber el total multiplicas 4 × 6 = 24. Es la misma idea de "grupos iguales" de Tablix, solo que en Multiplux los números crecen.', visual: grupos(4, 6, '🔵') },
        { titulo: 'El truco relámpago: por 10 y por 100', texto: 'Multiplicar por 10 es solo agregarle un cero al número: 23 × 10 = 230. Por 100, le agregas dos ceros: 23 × 100 = 2300. ¡Así de fácil, como magia!' },
        { titulo: 'Parte el número en trocitos', texto: '23 × 4: parte el 23 en 20 + 3. Multiplica cada trocito: 20 × 4 = 80, y 3 × 4 = 12. Después los juntas: 80 + 12 = 92.', visual: bloques(0, 8, 12) },
        { titulo: 'El método clásico, paso a paso', texto: 'Multiplicas cada dígito de arriba por el de abajo y "llevas" igual que en la suma. 47 × 6: primero 7×6=42 (escribo 2, llevo 4); luego 4×6=24, más el 4 que llevaba = 28 → 282.' },
        { titulo: 'Cuando los dos números son grandes', texto: 'Multiplicas el número de abajo por cada parte del de arriba, y corres un espacio la segunda fila antes de sumar. Suena largo, pero es repetir lo que ya sabes, por partes.', visual: truco('Frase para no perderte: "Primero las unidades, después la decena — ¡y corro un pasito antes de que sume!"') },
        { titulo: '¡A conquistar Multiplux!', texto: 'Cuando un programador hace que una imagen se agrande al doble en un juego, está multiplicando por 2 cada medida. Recuerda tus tablas de Tablix — son la base de todo esto. ¡Tú puedes, Santi!' },
      ],
    },
    divisorix: {
      titulo: 'Repartir en partes iguales',
      pasos: [
        { titulo: 'Bienvenido a Divisorix', texto: 'Dividir es repartir algo en partes iguales, para que a todos les toque lo mismo. Nada de peleas — aquí todo se reparte justo.' },
        { titulo: 'Repartir galletas entre amigos', texto: 'Si tienes 12 galletas y las repartes entre 3 amigos por partes iguales, ¿cuántas le tocan a cada uno? A cada uno le tocan 4. Eso se escribe: 12 ÷ 3 = 4.', visual: grupos(3, 4, '🍪') },
        { titulo: 'El mismo dibujo que la multiplicación', texto: 'Mira: si acomodas esas 12 galletas en 3 filas de 4, es el mismo dibujo que usaste para 3 × 4 en Tablix. ¡Dividir y multiplicar son primos hermanos!', visual: puntos(3, 4) },
        { titulo: 'La relación mágica con la multiplicación', texto: 'Dividir es lo contrario de multiplicar. Si sabes que 6 × 7 = 42, automáticamente sabes que 42 ÷ 7 = 6 y 42 ÷ 6 = 7. ¡Tus tablas de Tablix te sirven aquí también!' },
        { titulo: '¿Cuántas veces cabe?', texto: 'Pregúntate: "¿cuántas veces cabe el divisor dentro del dividendo?". Para 36 ÷ 9, piensa en la tabla del 9: 9 × 4 = 36, entonces 36 ÷ 9 = 4.' },
        { titulo: 'Cuando sobra algo (residuo)', texto: 'No siempre la división es exacta, ¡y no pasa nada! 17 ÷ 5: 5 × 3 = 15, y sobran 2. Entonces 17 ÷ 5 = 3 y sobran 2.', visual: truco('Para recordar: "Multiplico, resto, y lo que queda es lo que sobra."') },
        { titulo: 'Números más grandes, mismo truco', texto: 'Para dividir un número de 3 dígitos entre 1 dígito, ve probando de a poco: primero cuántas veces cabe en las centenas, luego sigues con lo que sobra. Con práctica se vuelve automático.' },
        { titulo: '¡A repartir en Divisorix!', texto: 'Cuando un programador reparte puntos o vidas en partes iguales entre jugadores, está dividiendo. Usa siempre tus tablas de multiplicar como ayuda. ¡Vamos, Santi!' },
      ],
    },
    fracciolandia: {
      titulo: 'El mundo de las fracciones',
      pasos: [
        { titulo: 'Bienvenido a Fracciolandia', texto: 'Una fracción es solo una parte de un todo — como cuando repartes algo con tu familia. Aquí vas a aprender a repartir sin pelear por el pedazo más grande.' },
        { titulo: 'Reparte objetos reales', texto: 'Imagina 4 chocolates iguales en fila. Si te comes 1 de esos 4, te comiste 1 de 4 partes. Eso es una fracción: 1/4 (un cuarto).', visual: emojis(4, '🍫') },
        { titulo: 'La misma idea, en una pizza', texto: 'Si cortas una pizza en 4 pedazos iguales y te comes 1, comiste 1/4 de la pizza. El número de abajo (4) dice en cuántas partes se cortó el todo.', visual: pizzaDemo(1, 4) },
        { titulo: 'Arriba lo que tomas, abajo el total', texto: 'En 3/4: el 4 (abajo) dice en cuántas partes se cortó el todo. El 3 (arriba) dice cuántas partes tomaste.', visual: pizzaDemo(3, 4) + truco('Para no olvidar: "Abajo cuántas partes hay, arriba las que vas a tomar."') },
        { titulo: 'Fracciones equivalentes', texto: '1/2 y 2/4 son la misma cantidad, solo cortada distinto. Si multiplicas arriba y abajo por el mismo número, la fracción no cambia de tamaño, solo de nombre.', visual: dosPizzas(1, 2, 2, 4) },
        { titulo: 'Comparar fracciones', texto: 'Con el mismo denominador (mismo tamaño de corte), gana la fracción con el numerador más grande: 3/8 es mayor que 2/8. ¡Imagina las pizzas cortadas igual, y compara cuántos pedazos tiene cada una!', visual: dosPizzas(3, 8, 2, 8) },
        { titulo: 'Sumar y restar fracciones', texto: 'Cuando el denominador es el mismo, solo sumas o restas los de arriba, y el de abajo queda igual: 2/6 + 3/6 = 5/6.' },
        { titulo: 'Fracción de un número', texto: 'Para hallar 1/4 de 20: reparte 20 en 4 grupos iguales (20÷4=5) y toma la cantidad de grupos que pide el numerador. 1 grupo son 5 estrellas.', visual: grupos(4, 5, '⭐') },
        { titulo: '¡A explorar Fracciolandia!', texto: 'Los programadores usan fracciones para cosas como la barra de vida de un personaje (¾ de vida, ½ de vida...). Piensa siempre en pizzas repartidas y vas a ver que las fracciones son más fáciles de lo que parecen. ¡Vamos, Santi!' },
      ],
    },
    incognita: {
      titulo: 'El número misterioso',
      pasos: [
        { titulo: 'Bienvenido a Incógnita', texto: 'Aquí vas a resolver acertijos con un número secreto, que los matemáticos llaman "x". Es un juego de detective: tu misión es descubrir cuánto vale x.' },
        { titulo: 'La balanza perfecta', texto: 'Piensa en una ecuación como una balanza de dos platos: los dos lados siempre deben pesar exactamente igual. Si le quitas algo a un lado, tienes que quitarle lo mismo al otro para que no se desnivele.', visual: balanza('x + 5', '12') },
        { titulo: 'Resolver x + 5 = 12', texto: 'Para descubrir cuánto vale x, quita el 5 de los DOS lados de la balanza: x = 12 − 5 = 7. ¡Lo que le quitas a un lado, se lo quitas al otro, para que siga en equilibrio!', visual: balanza('x', '7') },
        { titulo: 'Resolver 4 × x = 20', texto: 'Aquí x está multiplicando, así que divides ambos lados entre 4: x = 20 ÷ 4 = 5. Multiplicar y dividir son "opuestos" — uno deshace al otro, igual que sumar y restar.', visual: balanza('4 × x', '20') },
        { titulo: 'El truco de la operación contraria', texto: 'Cada operación tiene su contraria: sumar↔restar, multiplicar↔dividir. Para despejar x, usa siempre la operación CONTRARIA a la que le está pasando a x.', visual: truco('Para recordar: "Lo que x tiene sumado, se lo resto de un lado; lo que tiene multiplicado, entre eso lo he dividido."') },
        { titulo: 'Patrones y secuencias', texto: 'En 2, 5, 8, 11, ___ cada número sube 3. Descubre la regla (súmalo o réstalo) y sigue el patrón para hallar el número que sigue.', visual: rectaNumerica(0, 14, [2, 5, 8, 11, 14]) },
        { titulo: '¡El secreto mejor guardado!', texto: 'Un secreto: cuando programas, la "x" se llama VARIABLE, y los programadores las usan todo el tiempo para guardar números que cambian, como tu puntaje en un videojuego. ¡Resolver ecuaciones es entrenar directamente para ser programador! Tú puedes, Santi.' },
      ],
    },
    radix: {
      titulo: 'Raíz cuadrada, el tema nuevo del cole',
      pasos: [
        { titulo: 'Bienvenido a Radix', texto: 'Este es el tema que están viendo ahora en el colegio. La raíz cuadrada (√) es la pregunta contraria a "elevar al cuadrado": pregunta "¿qué número multiplicado por sí mismo me da este resultado?".' },
        { titulo: 'Un cuadrado de verdad', texto: '√9 = 3 porque 3 × 3 = 9. Si acomodas 9 puntos formando un cuadrado perfecto, quedan 3 filas por 3 columnas — por eso se llama raíz "cuadrada".', visual: puntos(3, 3) },
        { titulo: '¡Ya sabes esto, es solo al revés!', texto: 'Como ya dominas las tablas en Tablix, sacar raíces es fácil: piensa "¿qué número por sí mismo da este resultado?". Para √16, piensa en la tabla del 4: 4 × 4 = 16, entonces √16 = 4.', visual: puntos(4, 4) },
        { titulo: 'Los cuadrados perfectos, tus nuevos amigos', texto: 'Apréndete estos de memoria y vas a volar: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144. Son 1² hasta 12², los mismos números de tus tablas.' },
        { titulo: 'Cuando no es exacto (¡y está bien!)', texto: 'No todos los números tienen raíz exacta. √50 no da un número entero, pero puedes decir "está entre 7 y 8", porque 7×7=49 y 8×8=64, y 50 queda justo en el medio.', visual: rectaNumerica(45, 65, [49, 50, 64]) },
        { titulo: 'Un truco para no perderte', texto: 'Cuando veas √, pregúntate siempre: "¿qué número, multiplicado por sí mismo, me da esto?" — y prueba con tus tablas hasta encontrarlo.', visual: truco('Para recordar: "La raíz pregunta bajito: ¿quién por sí mismo me da este numerito?"') },
        { titulo: '¡A conquistar Radix!', texto: 'Los programadores de videojuegos usan raíces cuadradas para calcular distancias en la pantalla, por ejemplo qué tan lejos está tu nave de un asteroide. Usa tus tablas como ayuda y vas a dominar las raíces más rápido de lo que crees. ¡Vamos, Santi!' },
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
