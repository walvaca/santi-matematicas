/* SM.generadores — crea preguntas al azar (nunca un banco fijo) para cada planeta.
   Cada función devuelve: { enunciado, visual, tipo:'multiple'|'numero', opciones?,
   respuesta, explicacion }. `tipo:'numero'` se responde con el teclado numérico de
   la pantalla de juego; `tipo:'multiple'` con botones de opción. */
(function () {
  // ---------- utilidades compartidas ----------
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function elegir(arr) { return arr[randInt(0, arr.length - 1)]; }
  function mezclar(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function rangoDigitos(d) {
    if (d === 1) return [1, 9];
    return [Math.pow(10, d - 1), Math.pow(10, d) - 1];
  }
  function elegirDigitosSpec(spec, opciones) { return spec === 'mixto' ? elegir(opciones) : spec; }
  function mcd(a, b) { return b === 0 ? a : mcd(b, a % b); }

  function completarOpciones(correctaStr, candidatosBrutos, cantidad) {
    const vistos = new Set([correctaStr]);
    const salida = [];
    candidatosBrutos.forEach((c) => {
      const s = String(c);
      if (salida.length < cantidad && !vistos.has(s)) { vistos.add(s); salida.push(s); }
    });
    return salida;
  }
  function construirMultiple(enunciado, correcta, candidatosBrutos, explicacion, visual) {
    const correctaStr = String(correcta);
    const distractores = completarOpciones(correctaStr, candidatosBrutos, 3);
    return { enunciado, visual: visual || null, tipo: 'multiple', opciones: mezclar([correctaStr, ...distractores]), respuesta: correctaStr, explicacion };
  }
  function construirNumero(enunciado, correcta, explicacion, visual) {
    return { enunciado, visual: visual || null, tipo: 'numero', respuesta: correcta, explicacion };
  }

  // ---------- visuales de fracciones (HTML/CSS, sin imágenes) ----------
  function pizzaHTML(n, d) {
    const pct = (n / d) * 100;
    return `<div class="sm-pizza" style="background:conic-gradient(var(--accent) 0% ${pct}%, var(--card2) ${pct}% 100%)"></div>`;
  }

  // ================= TABLAS (Tablix) =================
  function tablas(params) {
    const a = params.rango === 'todas' ? randInt(0, 12) : elegir(params.rango);
    const b = randInt(1, 12);
    const correcta = a * b;
    const candidatos = mezclar([
      a * (b + 1), a * Math.max(b - 1, 0), (a + 1) * b, Math.max(a - 1, 0) * b,
      correcta + a, Math.max(correcta - a, 0), correcta + b, Math.max(correcta - b, 0),
    ]);
    return construirMultiple(`${a} × ${b} = ?`, correcta, candidatos, `${a} × ${b} = ${correcta}`);
  }

  // ================= SUMA Y RESTA (Numeria) =================
  const PLANTILLAS_SUMA = [
    (a, b) => `Santi encontró ${a} meteoritos y luego ${b} más. ¿Cuántos meteoritos tiene en total?`,
    (a, b) => `La nave recogió ${a} cristales de energía en Marte y ${b} en la Luna. ¿Cuántos cristales recogió en total?`,
    (a, b) => `Cosmo contó ${a} estrellas en el mapa y descubrió ${b} nuevas. ¿Cuántas estrellas hay ahora?`,
  ];
  const PLANTILLAS_RESTA = [
    (a, b) => `La nave tenía ${a} litros de combustible y usó ${b} en el viaje. ¿Cuánto combustible le queda?`,
    (a, b) => `Había ${a} astronautas en la base y ${b} salieron a explorar. ¿Cuántos quedaron en la base?`,
    (a, b) => `Cosmo tenía ${a} monedas espaciales y gastó ${b} reparando la nave. ¿Cuántas monedas le quedan?`,
  ];

  function tieneLlevarSuma(a, b) {
    let ca = a, cb = b, llevar = 0, hubo = false;
    while (ca > 0 || cb > 0) {
      const suma = (ca % 10) + (cb % 10) + llevar;
      llevar = suma > 9 ? 1 : 0;
      if (llevar) hubo = true;
      ca = Math.floor(ca / 10); cb = Math.floor(cb / 10);
    }
    return hubo;
  }
  function tienePrestamoResta(a, b) {
    let ca = a, cb = b, prestamo = 0, hubo = false;
    while (ca > 0 || cb > 0) {
      const da = ca % 10, db = (cb % 10) + prestamo;
      if (da < db) { hubo = true; prestamo = 1; } else prestamo = 0;
      ca = Math.floor(ca / 10); cb = Math.floor(cb / 10);
    }
    return hubo;
  }
  function generarSuma(digitos, tipoLlevar) {
    const [min, max] = rangoDigitos(digitos);
    for (let i = 0; i < 200; i++) {
      const a = randInt(min, max), b = randInt(min, max);
      const llevar = tieneLlevarSuma(a, b);
      if (tipoLlevar === 'mixto' || !tipoLlevar || (tipoLlevar === 'con' && llevar) || (tipoLlevar === 'sin' && !llevar)) return { a, b };
    }
    return { a: min, b: min };
  }
  function generarResta(digitos, tipoLlevar) {
    const [min, max] = rangoDigitos(digitos);
    for (let i = 0; i < 200; i++) {
      let a = randInt(min, max), b = randInt(min, max);
      if (a < b) [a, b] = [b, a];
      const prestamo = tienePrestamoResta(a, b);
      if (tipoLlevar === 'mixto' || !tipoLlevar || (tipoLlevar === 'con' && prestamo) || (tipoLlevar === 'sin' && !prestamo)) return { a, b };
    }
    return { a: max, b: min };
  }

  function sumaResta(params) {
    const digitos = params.digitos || 2;
    let operacion = params.operacion || 'mixto';
    if (operacion === 'mixto') operacion = Math.random() < 0.5 ? 'suma' : 'resta';
    let a, b, correcta, simbolo, plantillas;
    if (operacion === 'suma') {
      ({ a, b } = generarSuma(digitos, params.llevar)); correcta = a + b; simbolo = '+'; plantillas = PLANTILLAS_SUMA;
    } else {
      ({ a, b } = generarResta(digitos, params.llevar)); correcta = a - b; simbolo = '−'; plantillas = PLANTILLAS_RESTA;
    }
    const enunciado = params.palabras ? elegir(plantillas)(a, b) : `${a} ${simbolo} ${b} =`;
    return construirNumero(enunciado, correcta, `${a} ${simbolo} ${b} = ${correcta}`);
  }

  // ================= MULTIPLICACIÓN (Multiplux) =================
  const PLANTILLAS_MULT = [
    (a, b) => `Cada cápsula de carga lleva ${a} cristales. Si hay ${b} cápsulas, ¿cuántos cristales hay en total?`,
    (a, b) => `Un robot recolector junta ${a} rocas espaciales por minuto. ¿Cuántas junta en ${b} minutos?`,
    (a, b) => `Hay ${b} naves y cada una lleva ${a} tripulantes. ¿Cuántos tripulantes hay en total?`,
  ];
  function tieneLlevarMultiplicacion(a, b) {
    let ca = a, llevar = 0, hubo = false;
    while (ca > 0) {
      const prod = (ca % 10) * b + llevar;
      llevar = prod >= 10 ? Math.floor(prod / 10) : 0;
      if (llevar) hubo = true;
      ca = Math.floor(ca / 10);
    }
    return hubo;
  }
  function multiplicacion(params) {
    const digitosA = elegirDigitosSpec(params.digitosA, [1, 2, 3]);
    const digitosB = elegirDigitosSpec(params.digitosB, [1, 2]);
    const [minA, maxA] = rangoDigitos(digitosA);
    let a, b;
    if (digitosB === 1) {
      a = randInt(minA, maxA); b = randInt(2, 9);
      for (let i = 0; i < 200; i++) {
        a = randInt(minA, maxA); b = randInt(2, 9);
        const llevar = tieneLlevarMultiplicacion(a, b);
        if (params.llevar === 'mixto' || !params.llevar || (params.llevar === 'con' && llevar) || (params.llevar === 'sin' && !llevar)) break;
      }
    } else {
      const [minB, maxB] = rangoDigitos(digitosB);
      a = randInt(minA, maxA); b = randInt(minB, maxB);
    }
    const correcta = a * b;
    const enunciado = params.palabras ? elegir(PLANTILLAS_MULT)(a, b) : `${a} × ${b} =`;
    return construirNumero(enunciado, correcta, `${a} × ${b} = ${correcta}`);
  }

  // ================= DIVISIÓN (Divisorix) =================
  const PLANTILLAS_DIV = [
    (dividendo, divisor) => `Hay ${dividendo} astronautas para repartir en ${divisor} naves, la misma cantidad en cada una. ¿Cuántos van en cada nave?`,
    (dividendo, divisor) => `Cosmo repartió ${dividendo} cristales de energía entre ${divisor} planetas por igual. ¿Cuántos le tocaron a cada uno?`,
    (dividendo, divisor) => `Se repartieron ${dividendo} raciones de comida entre ${divisor} tripulantes por igual. ¿Cuántas raciones recibió cada uno?`,
  ];
  function generarDivision(digitosDividendo, conResiduo) {
    const dd = elegirDigitosSpec(digitosDividendo, [1, 2, 3]);
    const [min, max] = rangoDigitos(dd);
    for (let i = 0; i < 300; i++) {
      const divisor = randInt(2, 9);
      const dividendo = randInt(min, max);
      const cociente = Math.floor(dividendo / divisor);
      const resto = dividendo % divisor;
      if (cociente < 1) continue;
      if (conResiduo === false && resto === 0) return { dividendo, divisor, cociente, resto };
      if (conResiduo === true && resto !== 0) return { dividendo, divisor, cociente, resto };
      if (conResiduo === 'mixto') return { dividendo, divisor, cociente, resto };
    }
    const divisor = randInt(2, 9), cociente = randInt(2, 9);
    return { dividendo: divisor * cociente, divisor, cociente, resto: 0 };
  }
  function division(params) {
    const { dividendo, divisor, cociente, resto } = generarDivision(params.digitosDividendo, params.residuo);
    if (resto === 0) {
      const enunciado = params.palabras ? elegir(PLANTILLAS_DIV)(dividendo, divisor) : `${dividendo} ÷ ${divisor} =`;
      return construirNumero(enunciado, cociente, `${dividendo} ÷ ${divisor} = ${cociente}`);
    }
    const correcta = `${cociente} y sobran ${resto}`;
    const candidatos = mezclar([
      `${cociente + 1} y sobran ${resto}`, `${Math.max(cociente - 1, 0)} y sobran ${resto}`,
      `${cociente} y sobran ${Math.max(resto - 1, 0)}`, `${cociente} y sobran ${resto + 1}`,
    ]);
    return construirMultiple(`${dividendo} ÷ ${divisor} = ?`, correcta, candidatos, `${divisor} × ${cociente} = ${divisor * cociente}, y sobran ${resto} (${dividendo} − ${divisor * cociente} = ${resto})`);
  }

  // ================= FRACCIONES (Fracciolandia) =================
  function identificar() {
    const d = elegir([2, 3, 4, 5, 6, 8, 10]);
    const n = randInt(1, d - 1);
    const correcta = `${n}/${d}`;
    const candidatos = mezclar([`${d - n}/${d}`, `${d}/${n}`, `${n}/${d + 1}`, `${Math.min(n + 1, d - 1)}/${d}`]);
    return construirMultiple('¿Qué fracción está pintada?', correcta, candidatos, `Hay ${n} partes pintadas de ${d} en total: ${correcta}`, pizzaHTML(n, d));
  }
  function equivalente() {
    const d = randInt(2, 6), n = randInt(1, d - 1), k = randInt(2, 4);
    const correcta = `${n * k}/${d * k}`;
    const candidatos = mezclar([`${n * k + 1}/${d * k}`, `${n * k}/${d * k + 1}`, `${n}/${d * k}`, `${d}/${n}`]);
    return construirMultiple(`¿Cuál fracción es equivalente a ${n}/${d}?`, correcta, candidatos, `${n}/${d} = ${correcta} (se multiplica arriba y abajo por ${k})`);
  }
  function comparar() {
    let d1, d2, n1, n2;
    for (let intento = 0; intento < 20; intento++) {
      d1 = randInt(2, 8); d2 = randInt(2, 8);
      n1 = randInt(1, d1 - 1); n2 = randInt(1, d2 - 1);
      if (`${n1}/${d1}` !== `${n2}/${d2}`) break;
    }
    const v1 = n1 / d1, v2 = n2 / d2;
    const correcta = Math.abs(v1 - v2) < 1e-9 ? 'Son iguales' : (v1 > v2 ? `${n1}/${d1}` : `${n2}/${d2}`);
    return {
      enunciado: `¿Cuál fracción es mayor: ${n1}/${d1} o ${n2}/${d2}?`, visual: null, tipo: 'multiple',
      opciones: mezclar([`${n1}/${d1}`, `${n2}/${d2}`, 'Son iguales']), respuesta: correcta,
      explicacion: `${n1}/${d1} = ${v1.toFixed(2)} y ${n2}/${d2} = ${v2.toFixed(2)}`,
    };
  }
  function sumarFracciones() {
    const d = randInt(2, 10);
    const n1 = randInt(1, d - 1);
    const n2 = randInt(1, Math.max(d - 1 - n1, 1));
    const correctaN = n1 + n2, correcta = `${correctaN}/${d}`;
    const candidatos = mezclar([`${correctaN + 1}/${d}`, `${Math.max(correctaN - 1, 1)}/${d}`, `${correctaN}/${d + 1}`, `${correctaN}/${d - 1 || 1}`]);
    return construirMultiple(`${n1}/${d} + ${n2}/${d} = ?`, correcta, candidatos, `Mismo denominador: se suman de arriba (${n1}+${n2}=${correctaN}) y abajo queda igual: ${correcta}`);
  }
  function restarFracciones() {
    const d = randInt(2, 10);
    const n1 = randInt(2, d - 1);
    const n2 = randInt(1, n1 - 1);
    const correctaN = n1 - n2, correcta = `${correctaN}/${d}`;
    const candidatos = mezclar([`${correctaN + 1}/${d}`, `${Math.max(correctaN - 1, 0)}/${d}`, `${correctaN}/${d + 1}`, `${n1}/${d}`]);
    return construirMultiple(`${n1}/${d} − ${n2}/${d} = ?`, correcta, candidatos, `Mismo denominador: se restan de arriba (${n1}−${n2}=${correctaN}) y abajo queda igual: ${correcta}`);
  }
  function fraccionDeNumero() {
    const d = elegir([2, 3, 4, 5, 6, 8, 10]);
    const n = randInt(1, d - 1);
    const k = randInt(2, 9);
    const total = d * k;
    const correcta = n * k;
    return construirNumero(`¿Cuánto es ${n}/${d} de ${total}?`, correcta, `${total} ÷ ${d} = ${k}; luego ${k} × ${n} = ${correcta}`);
  }
  const FRACCIONES_BASE = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 6], [5, 6], [1, 8], [3, 8]];
  function simplificar() {
    const [nBase, dBase] = elegir(FRACCIONES_BASE);
    const k = randInt(2, 4);
    const nMostrado = nBase * k, dMostrado = dBase * k;
    const correcta = `${nBase}/${dBase}`;
    const candidatos = mezclar([`${nMostrado}/${dMostrado}`, `${nBase + 1}/${dBase}`, `${nBase}/${dBase + 1}`, `${nMostrado}/${dBase}`]);
    return construirMultiple(`Simplifica la fracción: ${nMostrado}/${dMostrado}`, correcta, candidatos, `${nMostrado}/${dMostrado} se puede dividir arriba y abajo entre ${k}: ${correcta}`);
  }
  function sumarDistinto() {
    for (let intento = 0; intento < 50; intento++) {
      const dBase = randInt(2, 5), factor = randInt(2, 3), dGrande = dBase * factor;
      const n1 = randInt(1, dBase - 1);
      const n1Convertido = n1 * factor;
      const maxN2 = dGrande - 1 - n1Convertido;
      if (maxN2 < 1) continue;
      const n2 = randInt(1, maxN2);
      const sumaN = n1Convertido + n2;
      const correcta = `${sumaN}/${dGrande}`;
      const candidatos = mezclar([`${n1 + n2}/${dGrande}`, `${sumaN}/${dBase + dGrande}`, `${sumaN + 1}/${dGrande}`, `${Math.max(sumaN - 1, 1)}/${dGrande}`]);
      return construirMultiple(`${n1}/${dBase} + ${n2}/${dGrande} = ?`, correcta, candidatos, `Convierte ${n1}/${dBase} a ${n1Convertido}/${dGrande} (multiplica arriba y abajo por ${factor}), y suma: ${n1Convertido} + ${n2} = ${sumaN} → ${correcta}`);
    }
    return construirMultiple('1/2 + 1/4 = ?', '3/4', ['1/6', '2/6', '2/4'], 'Convierte 1/2 a 2/4, y suma: 2 + 1 = 3 → 3/4');
  }
  function fracciones(params) {
    const mapa = { identificar, equivalente, comparar, sumar: sumarFracciones, restar: restarFracciones, fraccionDeNumero, simplificar, sumarDistinto };
    if (params.tipo === 'mixto') return mapa[elegir(Object.keys(mapa))]();
    return (mapa[params.tipo] || identificar)();
  }

  // ================= ÁLGEBRA (Incógnita) =================
  function algSuma() {
    const a = randInt(1, 20), x = randInt(1, 20), b = a + x;
    return construirNumero(`x + ${a} = ${b}  →  ¿Cuánto vale x?`, x, `x = ${b} − ${a} = ${x}`);
  }
  function algResta() {
    if (Math.random() < 0.5) {
      const a = randInt(1, 15), b = randInt(1, 15), x = a + b;
      return construirNumero(`x − ${a} = ${b}  →  ¿Cuánto vale x?`, x, `x = ${b} + ${a} = ${x}`);
    }
    const x = randInt(1, 15), a = randInt(x + 1, x + 15), b = a - x;
    return construirNumero(`${a} − x = ${b}  →  ¿Cuánto vale x?`, x, `x = ${a} − ${b} = ${x}`);
  }
  function algMultiplicacion() {
    const a = randInt(2, 9), x = randInt(2, 9), b = a * x;
    const enunciado = Math.random() < 0.5 ? `${a} × x = ${b}  →  ¿Cuánto vale x?` : `x × ${a} = ${b}  →  ¿Cuánto vale x?`;
    return construirNumero(enunciado, x, `x = ${b} ÷ ${a} = ${x}`);
  }
  function patron(modo) {
    const negativo = modo === 'decreciente' ? true : (modo === 'creciente' ? false : Math.random() < 0.35);
    const k = negativo ? elegir([-2, -3, -4]) : elegir([2, 3, 4, 5, 6]);
    const s = negativo ? randInt(25, 45) : randInt(1, 15);
    const terminos = [s, s + k, s + 2 * k, s + 3 * k];
    const siguiente = s + 4 * k;
    return construirNumero(`${terminos.join(',  ')},  ___   ¿Qué número sigue?`, siguiente, `La secuencia ${k > 0 ? 'suma' : 'resta'} ${Math.abs(k)} cada vez, así que el siguiente es ${siguiente}`);
  }
  function palabrasAlgebra() {
    const forma = elegir(['suma', 'restaFinal', 'restaFaltan']);
    if (forma === 'suma') {
      const inicio = randInt(2, 20), agregado = randInt(2, 20), total = inicio + agregado;
      return construirNumero(`Santi tenía algunos meteoritos. Encontró ${agregado} más y ahora tiene ${total}. ¿Cuántos tenía al principio?`, inicio, `${total} − ${agregado} = ${inicio}`);
    }
    if (forma === 'restaFinal') {
      const inicio = randInt(10, 30), usado = randInt(2, inicio - 1), quedan = inicio - usado;
      return construirNumero(`Cosmo tenía ${inicio} cristales de energía y usó algunos reparando la nave. Le quedaron ${quedan}. ¿Cuántos cristales usó?`, usado, `${inicio} − ${quedan} = ${usado}`);
    }
    const tiene = randInt(2, 20), necesita = randInt(tiene + 2, tiene + 20), faltan = necesita - tiene;
    return construirNumero(`La tripulación necesita ${necesita} raciones de comida y ya tienen ${tiene}. ¿Cuántas raciones les faltan?`, faltan, `${necesita} − ${tiene} = ${faltan}`);
  }
  function algebra(params) {
    if (params.tipo === 'suma') return algSuma();
    if (params.tipo === 'resta') return algResta();
    if (params.tipo === 'multiplicacion') return algMultiplicacion();
    if (params.tipo === 'patron') return patron(params.modo);
    if (params.tipo === 'palabras') return palabrasAlgebra();
    if (params.tipo === 'mixtoTodo') return elegir([algSuma, algResta, algMultiplicacion, () => patron('mixto'), palabrasAlgebra])();
    return elegir([algSuma, algResta, algMultiplicacion])();
  }

  // ================= RAÍZ CUADRADA (Radix) =================
  function raizBasica(params) {
    const n = randInt(params.minN || 1, params.maxN || 12);
    const cuadrado = n * n;
    return construirNumero(`√${cuadrado} = ?`, n, `${n} × ${n} = ${cuadrado}, entonces √${cuadrado} = ${n}`);
  }
  function cuadradosPerfectos(params) {
    const n = randInt(params.minN || 1, params.maxN || 12);
    return construirNumero(`${n}² = ?`, n * n, `${n} × ${n} = ${n * n}`);
  }
  function estimarRaiz() {
    const nBase = randInt(2, 11);
    const cuadradoBase = nBase * nBase;
    const cuadradoSiguiente = (nBase + 1) * (nBase + 1);
    const numero = randInt(cuadradoBase + 1, cuadradoSiguiente - 1);
    const correcta = `${nBase} y ${nBase + 1}`;
    const candidatos = mezclar([`${Math.max(nBase - 1, 0)} y ${nBase}`, `${nBase + 1} y ${nBase + 2}`, `${nBase} y ${nBase + 2}`]);
    return construirMultiple(`¿Entre qué dos números está √${numero}?`, correcta, candidatos,
      `${nBase}² = ${cuadradoBase} y ${nBase + 1}² = ${cuadradoSiguiente}. Como ${cuadradoBase} < ${numero} < ${cuadradoSiguiente}, √${numero} está entre ${nBase} y ${nBase + 1}`);
  }
  function raices(params) {
    if (params.tipo === 'cuadrados') return cuadradosPerfectos(params);
    if (params.tipo === 'estimar') return estimarRaiz();
    if (params.tipo === 'mixtoBasico') return elegir([raizBasica, cuadradosPerfectos])(params);
    if (params.tipo === 'mixtoTodo') {
      const r = Math.random();
      if (r < 0.4) return raizBasica({ minN: 1, maxN: 12 });
      if (r < 0.8) return cuadradosPerfectos({ minN: 1, maxN: 12 });
      return estimarRaiz();
    }
    return raizBasica(params);
  }

  // ================= despacho general =================
  const GENERADORES = { tablas, sumaResta, multiplicacion, division, fracciones, algebra, raices };
  function generar(nombre, params) {
    const fn = GENERADORES[nombre];
    if (!fn) throw new Error(`Generador desconocido: ${nombre}`);
    return fn(params || {});
  }

  window.SM = window.SM || {};
  window.SM.generadores = Object.assign({ generar }, GENERADORES);
})();
