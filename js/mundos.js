/* SM.mundos — metadata de los planetas y sus niveles. Cada nivel indica qué
   generador de preguntas usar (SM.generadores), con qué parámetros de dificultad,
   y una `dificultad` 1-4 (Fácil/Medio/Difícil/Experto) que se muestra en la UI,
   al estilo de las etiquetas de dificultad de un puzzle de ajedrez. */
(function () {
  const DIFICULTADES = {
    1: { nombre: 'Fácil', color: 'var(--green)' },
    2: { nombre: 'Medio', color: 'var(--accent)' },
    3: { nombre: 'Difícil', color: 'var(--accent2)' },
    4: { nombre: 'Experto', color: 'var(--red)' },
  };

  const lista = [
    {
      id: 'tablix', orden: 1, nombre: 'Tablix', subtitulo: 'Tablas de multiplicar',
      emoji: '🪐', color: '#4fd1ff',
      // A propósito NINGÚN nivel aísla una sola tabla: el usuario reportó que Santi
      // se quedaba "acampando" en los niveles fáciles (tabla del 2, del 5...) sin
      // avanzar de verdad, porque la mezcla real solo aparecía al final. Ahora TODOS
      // los niveles combinan tablas fáciles y difíciles desde el nivel 1 (repetir un
      // número en `rango` sube su frecuencia relativa — `elegir()` en
      // generadores.js escoge uniforme del array — así el nivel 1 ya mete 6 y 7
      // mezclados con las fáciles, solo que con menos peso). El "pool" de tablas
      // crece nivel a nivel (currículo en espiral), nunca por tabla aislada.
      niveles: [
        { id: 1, nombre: 'Despegue combinado', dificultad: 1, generador: 'tablas', params: { rango: [0, 1, 2, 5, 10, 10, 6, 7] }, preguntas: 10 },
        { id: 2, nombre: 'Subiendo el reto', dificultad: 2, generador: 'tablas', params: { rango: [0, 1, 2, 3, 4, 5, 10, 6, 7, 8, 9] }, preguntas: 10 },
        { id: 3, nombre: 'Refuerzo de las difíciles (¡con más 6, 7, 8 y 9!)', dificultad: 3, generador: 'tablas', params: { rango: [6, 7, 8, 9, 6, 7, 8, 9, 2, 5] }, preguntas: 10 },
        { id: 4, nombre: 'Mezcla total', dificultad: 3, generador: 'tablas', params: { rango: 'todas' }, preguntas: 15 },
        { id: 5, nombre: '¡Contrarreloj!', dificultad: 4, generador: 'tablas', params: { rango: 'todas' }, contrarreloj: { segundos: 60, umbralEstrellas: [8, 14, 20] } },
        { id: 'quiz', esQuiz: true, nombre: 'Quiz Final de Tablix', dificultad: 4, generador: 'tablas', params: { rango: 'todas' }, preguntas: 15 },
      ],
    },
    {
      id: 'numeria', orden: 2, nombre: 'Numeria', subtitulo: 'Suma y resta',
      emoji: '🌍', color: '#3fd67a',
      niveles: [
        { id: 1, nombre: 'Suma de 1 dígito', dificultad: 1, generador: 'sumaResta', params: { operacion: 'suma', digitos: 1 }, preguntas: 10 },
        { id: 2, nombre: 'Suma sin llevar', dificultad: 1, generador: 'sumaResta', params: { operacion: 'suma', digitos: 2, llevar: 'sin' }, preguntas: 10 },
        { id: 3, nombre: 'Suma llevando', dificultad: 2, generador: 'sumaResta', params: { operacion: 'suma', digitos: 2, llevar: 'con' }, preguntas: 10 },
        { id: 4, nombre: 'Resta sin prestar', dificultad: 1, generador: 'sumaResta', params: { operacion: 'resta', digitos: 2, llevar: 'sin' }, preguntas: 10 },
        { id: 5, nombre: 'Resta prestando', dificultad: 2, generador: 'sumaResta', params: { operacion: 'resta', digitos: 2, llevar: 'con' }, preguntas: 10 },
        { id: 6, nombre: 'Suma de 3 dígitos', dificultad: 2, generador: 'sumaResta', params: { operacion: 'suma', digitos: 3, llevar: 'mixto' }, preguntas: 10 },
        { id: 7, nombre: 'Resta de 3 dígitos', dificultad: 3, generador: 'sumaResta', params: { operacion: 'resta', digitos: 3, llevar: 'mixto' }, preguntas: 10 },
        { id: 8, nombre: 'Números grandes (4 dígitos)', dificultad: 3, generador: 'sumaResta', params: { operacion: 'mixto', digitos: 4, llevar: 'mixto' }, preguntas: 10 },
        { id: 9, nombre: 'Problemas de nave: suma', dificultad: 2, generador: 'sumaResta', params: { operacion: 'suma', digitos: 2, llevar: 'mixto', palabras: true }, preguntas: 8 },
        { id: 10, nombre: 'Problemas de nave: resta', dificultad: 2, generador: 'sumaResta', params: { operacion: 'resta', digitos: 2, llevar: 'mixto', palabras: true }, preguntas: 8 },
        { id: 11, nombre: '¡Contrarreloj!', dificultad: 4, generador: 'sumaResta', params: { operacion: 'mixto', digitos: 2, llevar: 'mixto' }, contrarreloj: { segundos: 60, umbralEstrellas: [6, 10, 15] } },
        { id: 'quiz', esQuiz: true, nombre: 'Quiz Final de Numeria', dificultad: 4, generador: 'sumaResta', params: { operacion: 'mixto', digitos: 3, llevar: 'mixto' }, preguntas: 15 },
      ],
    },
    {
      id: 'multiplux', orden: 3, nombre: 'Multiplux', subtitulo: 'Multiplicación de varios dígitos',
      emoji: '☄️', color: '#ff8a3d',
      niveles: [
        { id: 1, nombre: '2 dígitos × 1, sin llevar', dificultad: 1, generador: 'multiplicacion', params: { digitosA: 2, digitosB: 1, llevar: 'sin' }, preguntas: 10 },
        { id: 2, nombre: '2 dígitos × 1, llevando', dificultad: 2, generador: 'multiplicacion', params: { digitosA: 2, digitosB: 1, llevar: 'con' }, preguntas: 10 },
        { id: 3, nombre: '3 dígitos × 1, sin llevar', dificultad: 2, generador: 'multiplicacion', params: { digitosA: 3, digitosB: 1, llevar: 'sin' }, preguntas: 10 },
        { id: 4, nombre: '3 dígitos × 1, llevando', dificultad: 3, generador: 'multiplicacion', params: { digitosA: 3, digitosB: 1, llevar: 'con' }, preguntas: 10 },
        { id: 5, nombre: '2 dígitos × 2 dígitos', dificultad: 3, generador: 'multiplicacion', params: { digitosA: 2, digitosB: 2, llevar: 'mixto' }, preguntas: 8 },
        { id: 6, nombre: '3 dígitos × 2 dígitos', dificultad: 4, generador: 'multiplicacion', params: { digitosA: 3, digitosB: 2, llevar: 'mixto' }, preguntas: 8 },
        { id: 7, nombre: 'Problemas de carga', dificultad: 2, generador: 'multiplicacion', params: { digitosA: 2, digitosB: 1, llevar: 'mixto', palabras: true }, preguntas: 8 },
        { id: 8, nombre: 'Problemas grandes', dificultad: 3, generador: 'multiplicacion', params: { digitosA: 3, digitosB: 1, llevar: 'mixto', palabras: true }, preguntas: 8 },
        { id: 9, nombre: 'Mezcla de todo', dificultad: 3, generador: 'multiplicacion', params: { digitosA: 'mixto', digitosB: 'mixto', llevar: 'mixto' }, preguntas: 10 },
        { id: 10, nombre: '¡Contrarreloj!', dificultad: 4, generador: 'multiplicacion', params: { digitosA: 2, digitosB: 1, llevar: 'mixto' }, contrarreloj: { segundos: 60, umbralEstrellas: [4, 7, 10] } },
        { id: 'quiz', esQuiz: true, nombre: 'Quiz Final de Multiplux', dificultad: 4, generador: 'multiplicacion', params: { digitosA: 'mixto', digitosB: 'mixto', llevar: 'mixto' }, preguntas: 15 },
      ],
    },
    {
      id: 'divisorix', orden: 4, nombre: 'Divisorix', subtitulo: 'División',
      emoji: '🌑', color: '#a78bfa',
      niveles: [
        { id: 1, nombre: 'Reparto exacto fácil', dificultad: 1, generador: 'division', params: { digitosDividendo: 1, digitosDivisor: 1, residuo: false }, preguntas: 10 },
        { id: 2, nombre: 'Dos dígitos entre uno', dificultad: 1, generador: 'division', params: { digitosDividendo: 2, digitosDivisor: 1, residuo: false }, preguntas: 10 },
        { id: 3, nombre: 'Con residuo, fácil', dificultad: 2, generador: 'division', params: { digitosDividendo: 1, digitosDivisor: 1, residuo: true }, preguntas: 10 },
        { id: 4, nombre: 'Con residuo (2 dígitos)', dificultad: 2, generador: 'division', params: { digitosDividendo: 2, digitosDivisor: 1, residuo: true }, preguntas: 10 },
        { id: 5, nombre: 'Tres dígitos, exacta', dificultad: 3, generador: 'division', params: { digitosDividendo: 3, digitosDivisor: 1, residuo: false }, preguntas: 10 },
        { id: 6, nombre: 'Tres dígitos, con residuo', dificultad: 3, generador: 'division', params: { digitosDividendo: 3, digitosDivisor: 1, residuo: true }, preguntas: 10 },
        { id: 7, nombre: 'Problemas de tripulación', dificultad: 2, generador: 'division', params: { digitosDividendo: 2, digitosDivisor: 1, residuo: false, palabras: true }, preguntas: 8 },
        { id: 8, nombre: 'Problemas grandes', dificultad: 3, generador: 'division', params: { digitosDividendo: 3, digitosDivisor: 1, residuo: false, palabras: true }, preguntas: 8 },
        { id: 9, nombre: 'Mezcla de todo', dificultad: 3, generador: 'division', params: { digitosDividendo: 'mixto', digitosDivisor: 1, residuo: 'mixto' }, preguntas: 10 },
        { id: 10, nombre: '¡Contrarreloj!', dificultad: 4, generador: 'division', params: { digitosDividendo: 2, digitosDivisor: 1, residuo: 'mixto' }, contrarreloj: { segundos: 60, umbralEstrellas: [4, 7, 10] } },
        { id: 'quiz', esQuiz: true, nombre: 'Quiz Final de Divisorix', dificultad: 4, generador: 'division', params: { digitosDividendo: 'mixto', digitosDivisor: 1, residuo: 'mixto' }, preguntas: 15 },
      ],
    },
    {
      id: 'fracciolandia', orden: 5, nombre: 'Fracciolandia', subtitulo: 'Fracciones',
      emoji: '🍕', color: '#ff6fae',
      niveles: [
        { id: 1, nombre: '¿Qué fracción es?', dificultad: 1, generador: 'fracciones', params: { tipo: 'identificar' }, preguntas: 8 },
        { id: 2, nombre: 'Fracciones equivalentes', dificultad: 1, generador: 'fracciones', params: { tipo: 'equivalente' }, preguntas: 8 },
        { id: 3, nombre: 'Simplificar fracciones', dificultad: 2, generador: 'fracciones', params: { tipo: 'simplificar' }, preguntas: 8 },
        { id: 4, nombre: 'Comparar fracciones', dificultad: 2, generador: 'fracciones', params: { tipo: 'comparar' }, preguntas: 8 },
        { id: 5, nombre: 'Sumar fracciones', dificultad: 2, generador: 'fracciones', params: { tipo: 'sumar' }, preguntas: 8 },
        { id: 6, nombre: 'Restar fracciones', dificultad: 2, generador: 'fracciones', params: { tipo: 'restar' }, preguntas: 8 },
        { id: 7, nombre: 'Fracción de un número', dificultad: 3, generador: 'fracciones', params: { tipo: 'fraccionDeNumero' }, preguntas: 8 },
        { id: 8, nombre: 'Sumar con distinto denominador', dificultad: 4, generador: 'fracciones', params: { tipo: 'sumarDistinto' }, preguntas: 8 },
        { id: 9, nombre: 'Mezcla de todo', dificultad: 3, generador: 'fracciones', params: { tipo: 'mixto' }, preguntas: 10 },
        { id: 'quiz', esQuiz: true, nombre: 'Quiz Final de Fracciolandia', dificultad: 4, generador: 'fracciones', params: { tipo: 'mixto' }, preguntas: 15 },
      ],
    },
    {
      id: 'incognita', orden: 6, nombre: 'Incógnita', subtitulo: 'Álgebra básica',
      emoji: '🔭', color: '#ffd23f',
      niveles: [
        { id: 1, nombre: 'El número misterioso (+)', dificultad: 1, generador: 'algebra', params: { tipo: 'suma' }, preguntas: 10 },
        { id: 2, nombre: 'El número misterioso (−)', dificultad: 2, generador: 'algebra', params: { tipo: 'resta' }, preguntas: 10 },
        { id: 3, nombre: 'El número misterioso (×)', dificultad: 2, generador: 'algebra', params: { tipo: 'multiplicacion' }, preguntas: 10 },
        { id: 4, nombre: 'Patrones crecientes', dificultad: 1, generador: 'algebra', params: { tipo: 'patron', modo: 'creciente' }, preguntas: 10 },
        { id: 5, nombre: 'Patrones decrecientes', dificultad: 3, generador: 'algebra', params: { tipo: 'patron', modo: 'decreciente' }, preguntas: 10 },
        { id: 6, nombre: 'Ecuaciones mezcladas', dificultad: 3, generador: 'algebra', params: { tipo: 'mixtoEcuacion' }, preguntas: 10 },
        { id: 7, nombre: 'Problemas con incógnita', dificultad: 2, generador: 'algebra', params: { tipo: 'palabras' }, preguntas: 8 },
        { id: 8, nombre: 'Mezcla de todo', dificultad: 3, generador: 'algebra', params: { tipo: 'mixtoTodo' }, preguntas: 10 },
        { id: 9, nombre: '¡Contrarreloj!', dificultad: 4, generador: 'algebra', params: { tipo: 'mixtoEcuacion' }, contrarreloj: { segundos: 60, umbralEstrellas: [5, 9, 13] } },
        { id: 'quiz', esQuiz: true, nombre: 'Quiz Final de Incógnita', dificultad: 4, generador: 'algebra', params: { tipo: 'mixtoTodo' }, preguntas: 15 },
      ],
    },
    {
      id: 'radix', orden: 7, nombre: 'Radix', subtitulo: 'Raíz cuadrada',
      emoji: '🛸', color: '#2dd4bf',
      niveles: [
        { id: 1, nombre: 'Raíces fáciles (hasta 25)', dificultad: 1, generador: 'raices', params: { tipo: 'raiz', minN: 1, maxN: 5 }, preguntas: 10 },
        { id: 2, nombre: 'Raíces hasta 49', dificultad: 1, generador: 'raices', params: { tipo: 'raiz', minN: 1, maxN: 7 }, preguntas: 10 },
        { id: 3, nombre: 'Raíces hasta 100', dificultad: 2, generador: 'raices', params: { tipo: 'raiz', minN: 1, maxN: 10 }, preguntas: 10 },
        { id: 4, nombre: 'Raíces hasta 144', dificultad: 2, generador: 'raices', params: { tipo: 'raiz', minN: 1, maxN: 12 }, preguntas: 10 },
        { id: 5, nombre: 'Cuadrados perfectos', dificultad: 2, generador: 'raices', params: { tipo: 'cuadrados', minN: 1, maxN: 12 }, preguntas: 10 },
        { id: 6, nombre: 'Mezcla de raíces y cuadrados', dificultad: 3, generador: 'raices', params: { tipo: 'mixtoBasico', minN: 1, maxN: 12 }, preguntas: 10 },
        { id: 7, nombre: '¿Entre qué números está?', dificultad: 4, generador: 'raices', params: { tipo: 'estimar' }, preguntas: 8 },
        { id: 8, nombre: '¡Contrarreloj!', dificultad: 4, generador: 'raices', params: { tipo: 'raiz', minN: 1, maxN: 12 }, contrarreloj: { segundos: 60, umbralEstrellas: [6, 10, 15] } },
        { id: 'quiz', esQuiz: true, nombre: 'Quiz Final de Radix', dificultad: 4, generador: 'raices', params: { tipo: 'mixtoTodo' }, preguntas: 15 },
      ],
    },
    {
      id: 'factorix', orden: 8, nombre: 'Factorix', subtitulo: 'Divisores, MCD y mcm',
      emoji: '🌌', color: '#818cf8',
      niveles: [
        { id: 1, nombre: '¿Es divisor o no?', dificultad: 1, generador: 'factores', params: { tipo: 'noEsDivisor', min: 10, max: 40 }, preguntas: 10 },
        { id: 2, nombre: 'Reglas de divisibilidad fáciles', dificultad: 1, generador: 'factores', params: { tipo: 'divisibilidad', divisores: [2, 5, 10] }, preguntas: 10 },
        { id: 3, nombre: 'El truco del 3 (¡y más reglas!)', dificultad: 2, generador: 'factores', params: { tipo: 'divisibilidad', divisores: [2, 3, 5, 10] }, preguntas: 10 },
        { id: 4, nombre: 'Números primos y compuestos', dificultad: 2, generador: 'factores', params: { tipo: 'primo', max: 50 }, preguntas: 10 },
        { id: 5, nombre: 'Máximo Común Divisor (MCD)', dificultad: 3, generador: 'factores', params: { tipo: 'mcd' }, preguntas: 10 },
        { id: 6, nombre: 'Mínimo común múltiplo (mcm)', dificultad: 3, generador: 'factores', params: { tipo: 'mcm' }, preguntas: 10 },
        { id: 7, nombre: 'Mezcla de todo', dificultad: 3, generador: 'factores', params: { tipo: 'mixto' }, preguntas: 12 },
        { id: 8, nombre: '¡Contrarreloj!', dificultad: 4, generador: 'factores', params: { tipo: 'mixto' }, contrarreloj: { segundos: 60, umbralEstrellas: [5, 9, 13] } },
        { id: 'quiz', esQuiz: true, nombre: 'Quiz Final de Factorix', dificultad: 4, generador: 'factores', params: { tipo: 'mixto' }, preguntas: 15 },
      ],
    },
  ];

  function obtener(mundoId) {
    return lista.find((m) => m.id === mundoId) || null;
  }

  function obtenerNivel(mundoId, nivelId) {
    const mundo = obtener(mundoId);
    if (!mundo) return null;
    return mundo.niveles.find((n) => n.id === nivelId) || null;
  }

  function siguienteNivel(mundoId, nivelId) {
    const mundo = obtener(mundoId);
    if (!mundo) return null;
    const idx = mundo.niveles.findIndex((n) => n.id === nivelId);
    if (idx === -1 || idx === mundo.niveles.length - 1) return null;
    return mundo.niveles[idx + 1];
  }

  window.SM = window.SM || {};
  window.SM.mundos = { lista, obtener, obtenerNivel, siguienteNivel, DIFICULTADES };
})();
