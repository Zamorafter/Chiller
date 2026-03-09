// excel.js
// Funciones para generar el archivo Excel con el formato de "CUADROS APP CHILLER.xlsx"

/**
 * Genera el archivo Excel completo a partir de un registro
 * @param {Object} registro - Objeto con los datos del chiller (voltaje, nocturno, diurno)
 * @returns {Blob} Blob del archivo Excel listo para descargar o compartir
 */
function generarExcel(registro) {
    // Crear un nuevo libro
    const wb = XLSX.utils.book_new();

    // Crear cada hoja
    const wsVoltaje = crearHojaMedicionVoltaje(registro);
    const wsNocturno = crearHojaNocturno(registro);
    const wsDiurno = crearHojaDiurno(registro);

    // Agregar hojas al libro
    XLSX.utils.book_append_sheet(wb, wsVoltaje, "Medición Voltaje");
    XLSX.utils.book_append_sheet(wb, wsNocturno, "NOCTURNO");
    XLSX.utils.book_append_sheet(wb, wsDiurno, "DIURNO");

    // Generar el archivo binario
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/* -------------------------------------------------------------------------- */
/* Hoja: Medición Voltaje                                                     */
/* -------------------------------------------------------------------------- */
function crearHojaMedicionVoltaje(registro) {
    // Definir una matriz suficientemente grande (40 filas x 30 columnas)
    let data = [];
    for (let i = 0; i < 40; i++) {
        data[i] = Array(30).fill('');
    }

    // ---- Títulos y encabezados fijos (según el archivo original) ----
    data[0][0] = 'TOLÓN FASHION MALL';
    data[0][13] = 'GERENCIA DE OPERACIONES';
    data[1][0] = 'GERENCIA DE OPERACIONES';
    data[1][13] = 'CONTROL DE VOLTAJE';
    data[2][0] = 'CONTROL DE VOLTAJE';

    // Fechas (ajusta las posiciones si es necesario)
    // Fila 6 (índice 5) columna 16 (Q) y columna 22 (W) – según tu archivo
    data[5][15] = `FECHA: ${registro.fecha}`;  // O15?  En tu archivo está en columna O (15) de la fila 6
    data[5][21] = `FECHA: ${registro.fecha}`;  // U22?  Ajusta
    data[6][2]  = `FECHA: ${registro.fecha}`;  // C7
    data[6][8]  = `FECHA: ${registro.fecha}`;  // I7

    // Identificadores de Chiller
    data[7][16] = 'CHILLER #1';   // Q8
    data[7][22] = 'CHILLER #3';   // W8
    data[8][3]  = 'CHILLER #1';   // D9
    data[8][9]  = 'CHILLER #3';   // J9

    // Títulos de tensiones
    data[9][16] = 'V L1-2';        // Q10
    data[9][17] = 'V L2-3';        // R10
    data[9][18] = 'V L3-1';        // S10
    data[9][22] = 'V L1-2';        // W10
    data[9][23] = 'V L2-3';        // X10
    data[9][24] = 'V L3-1';        // Y10

    // ---- Horas y tipos (OP/F) - Debes completar todas las filas según el archivo ----
    // Fila 11 (índice 10) – primera línea de horas
    data[10][3]  = 'V L1-2';
    data[10][4]  = 'V L2-3';
    data[10][5]  = 'V L3-1';
    data[10][9]  = 'V L1-2';
    data[10][10] = 'V L2-3';
    data[10][11] = 'V L3-1';
    data[10][14] = '(OP)';
    data[10][15] = '19:00:00';
    data[10][20] = '(OP)';
    data[10][21] = '19:00:00';

    // Fila 12 (índice 11)
    data[11][1] = '(OP)';
    data[11][2] = '05:00:00';
    data[11][7] = '(OP)';
    data[11][8] = '6:30am';
    data[11][14] = '(F)';
    data[11][15] = '20:00:00';
    data[11][20] = '(F)';
    data[11][21] = '20:00:00';

    // Fila 13 (índice 12)
    data[12][1] = '(F)';
    data[12][2] = '08:30am';
    data[12][7] = '(F)';
    data[12][8] = '08:30am';
    data[12][14] = '(F)';
    data[12][15] = '21:00:00';
    data[12][20] = '(F)';
    data[12][21] = '21:00:00';

    // Fila 14 (índice 13)
    data[13][1] = '(F)';
    data[13][2] = '11:00am';
    data[13][7] = '(F)';
    data[13][8] = '11:00am';
    data[13][14] = '(OP)';
    data[13][15] = '22:00:00';
    data[13][20] = '(OP)';
    data[13][21] = '22:00:00';

    // Fila 15 (índice 14)
    data[14][1] = '(OP)';
    data[14][2] = '02:00pm';
    data[14][7] = '(OP)';
    data[14][8] = '02:00pm';
    data[14][14] = '(F)';
    data[14][15] = '23:00:00';
    data[14][20] = '(F)';
    data[14][21] = '23:00:00';

    // Fila 16 (índice 15)
    data[15][1] = '(F)';
    data[15][2] = '04:00pm';
    data[15][7] = '(F)';
    data[15][8] = '04:00pm';
    data[15][14] = '(OP)';
    data[15][15] = '00:00:00';  // 1900-01-01 00:00:00 en el original, pero ponemos la hora
    data[15][20] = '(OP)';
    data[15][21] = '00:00:00';

    // Fila 17 (índice 16)
    data[16][1] = '(OP)';
    data[16][2] = '06:00pm';
    data[16][7] = '(OP)';
    data[16][8] = '06:00pm';
    data[16][14] = '(OP)';
    data[16][15] = '01:00:00';
    data[16][20] = '(OP)';
    data[16][21] = '01:00:00';

    // ---- Insertar los valores reales del registro ----
    // Aquí debes mapear cada campo de `registro.voltaje` a su celda correspondiente
    // Los IDs de los inputs deben coincidir con estos nombres
    // Ejemplo (para Chiller 1, a las 05:00 OP):
    // data[10][16] = registro.voltaje['v_ch1_05am_op_l12'] || '';  // V L1-2
    // data[10][17] = registro.voltaje['v_ch1_05am_op_l23'] || '';  // V L2-3
    // data[10][18] = registro.voltaje['v_ch1_05am_op_l31'] || '';  // V L3-1

    // Observaciones (fila 19, columna 15)
    data[18][15] = registro.voltaje?.observaciones || '';

    // Nombre operador nocturno (fila 23, columna 15)
    data[22][15] = registro.voltaje?.operador_nocturno || '';

    // Horas de apagado (fila 25, columna 18 para Chiller #1, columna 22 para Chiller #3)
    data[24][18] = registro.voltaje?.hora_apagado_1 || '';
    data[24][22] = registro.voltaje?.hora_apagado_3 || '';

    // Convertir matriz a hoja de cálculo
    const ws = XLSX.utils.aoa_to_sheet(data);

    // ---- Fusiones de celdas (merges) según el formato original ----
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },   // A1:M1
        { s: { r: 0, c: 13 }, e: { r: 0, c: 24 } },  // N1:Y1
        { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },   // A2:M2
        { s: { r: 1, c: 13 }, e: { r: 1, c: 24 } },  // N2:Y2
        { s: { r: 2, c: 0 }, e: { r: 2, c: 12 } },   // A3:M3
        // Agrega aquí todas las fusiones necesarias (puedes añadir más según el original)
    ];

    return ws;
}

/* -------------------------------------------------------------------------- */
/* Hoja: NOCTURNO                                                             */
/* -------------------------------------------------------------------------- */
function crearHojaNocturno(registro) {
    let data = [];
    for (let i = 0; i < 40; i++) data[i] = Array(20).fill('');

    // Títulos y encabezados
    data[1][0] = 'TOLÓN FASHION MALL';
    data[2][0] = 'GERENCIA DE OPERACIONES';
    data[3][0] = 'CONTROL DE VALORES EN CHILLERS';
    data[5][0] = 'TEMPERATURA AMBIENTE:';
    data[6][0] = `FECHA: ${registro.fecha}`;
    data[6][4] = 'Chiller N° 1';       // E7
    data[6][10] = 'Chiller N° 3';      // K7
    data[6][16] = 'Datos de referencia'; // Q7

    // Horas para Chiller 1 (columnas D a I) y Chiller 3 (columnas J a O)
    const horas = ['19:00:00', '20:00:00', '21:00:00', '22:00:00', '23:00:00', '00:00:00'];
    horas.forEach((h, idx) => {
        data[7][3 + idx] = h;  // D, E, F, G, H, I
        data[7][9 + idx] = h;  // J, K, L, M, N, O
    });

    // Filas de componentes (según el archivo original)
    const filas = [
        ['EVAPORADOR', 'Temp. Salida', 'ºF'],
        ['', 'Temp. Retorno', 'ºF'],
        ['', 'P. Del Evaporador', 'PSI'],
        ['', 'T. de Saturación', '°F'],
        ['CONDENSADOR', 'Temp. Retorno', 'ºF'],
        ['', 'Temp. Salida', 'ºF'],
        ['', 'Temp. de Saturación', 'ºF'],
        ['', 'P. en Condensador', 'PSI'],
        ['COMPRESOR', 'Temperatura descarga', '°F'],
        ['', 'Sobrecalentamiento descarga', '°F'],
        ['', '% de límite de corriente motor', '%'],
        ['', 'Temperatura de aceite', 'ºF'],
        ['', 'Presión de aceite', 'PSIG'],
        ['', 'SURGE', '-']
    ];

    // Colocar los textos de las filas (columna A, B y D)
    filas.forEach((fila, idx) => {
        const row = 8 + idx;  // fila 9 en adelante (índice 8)
        data[row][0] = fila[0];  // componente
        data[row][1] = fila[1];  // item
        data[row][3] = fila[2];  // unidad (columna D)
    });

    // Valores de referencia en la última columna (Q)
    const referencias = [
        '45°F', '55°F', '36 PSI', '38 - 44',
        '70 - 85', '80 - 95', '90 - 98', '118',
        '', '20-30', '', '110 - 125', '60 - 69', ''
    ];
    referencias.forEach((val, idx) => {
        data[8 + idx][16] = val;  // columna Q (índice 16)
    });

    // ---- Insertar valores del registro nocturno ----
    // Aquí debes asignar los valores capturados en el formulario
    // Ejemplo para la primera celda de Temp. Salida (Chiller 1, 19:00):
    // data[8][4] = registro.nocturno['evap_salida_19h'] || '';

    // Observaciones (fila 23, columna 8)
    data[22][8] = registro.nocturno?.observaciones || '';

    // Técnico nocturno (fila 24, columna 0)
    data[23][0] = 'TECNICO NOCTURNO';
    data[24][0] = registro.nocturno?.tecnico_nocturno || '';

    // Elaborado por / Supervisor / Mañana / Encendido por / Firma (ajusta según tu formulario)
    // data[26][0] = registro.nocturno.elaborado_por || '';
    // data[27][0] = registro.nocturno.supervisor || '';
    // data[26][4] = registro.nocturno.manana || '';
    // data[26][5] = registro.nocturno.encendido_por || '';

    // Horas de apagado (fila 31, columna 0 y columna 4)
    data[30][0] = 'Hora de apagado CHILLER #01';
    data[30][4] = 'Hora de apagado CHILLER #03';
    data[31][0] = registro.nocturno?.hora_apagado_1 || '';
    data[31][4] = registro.nocturno?.hora_apagado_3 || '';

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Fusiones (puedes agregar las que veas en el original)
    ws['!merges'] = [
        { s: { r: 1, c: 0 }, e: { r: 1, c: 16 } }, // A2:Q2
        { s: { r: 2, c: 0 }, e: { r: 2, c: 16 } }, // A3:Q3
        { s: { r: 3, c: 0 }, e: { r: 3, c: 16 } }, // A4:Q4
        // ... etc
    ];

    return ws;
}

/* -------------------------------------------------------------------------- */
/* Hoja: DIURNO                                                               */
/* -------------------------------------------------------------------------- */
function crearHojaDiurno(registro) {
    let data = [];
    for (let i = 0; i < 50; i++) data[i] = Array(25).fill('');

    // Títulos
    data[1][0] = 'TOLÓN FASHION MALL';
    data[2][0] = 'GERENCIA DE OPERACIONES';
    data[3][0] = 'CONTROL DE VALORES EN CHILLERS';
    data[5][0] = 'TEMPERATURA AMBIENTE:';
    data[6][0] = `FECHA: ${registro.fecha}`;
    data[6][4] = 'Chiller N° 1';   // E7
    data[6][12] = 'Chiller N° 3';  // M7
    data[6][20] = 'Datos de referencia'; // U7

    // Horas para Chiller 1 (columnas D a K) y Chiller 3 (columnas L a S)
    const horasCh1 = ['05:00AM (OP)', '07:30AM (OP)', '08:30AM (F)', '10:00AM (F)', '11AM (F)', '2PM (OP)', '4PM (F)', '6PM (OP)'];
    const horasCh3 = ['6:30AM (OP)', '7:30AM (OP)', '08:30AM (F)', '10:00AM (F)', '11AM (F)', '2PM (OP)', '4PM (F)', '6PM (OP)'];

    horasCh1.forEach((h, idx) => {
        data[7][3 + idx] = h;  // D, E, F, G, H, I, J, K
    });
    horasCh3.forEach((h, idx) => {
        data[7][11 + idx] = h; // L, M, N, O, P, Q, R, S
    });

    // Filas de componentes (misma estructura que nocturno)
    const filas = [
        ['EVAPORADOR', 'Temp. Salida', 'ºF'],
        ['', 'Temp. Retorno', 'ºF'],
        ['', 'P. Del Evaporador', 'PSI'],
        ['', 'T. de Saturación', '°F'],
        ['CONDENSADOR', 'Temp. Retorno', 'ºF'],
        ['', 'Temp. Salida', 'ºF'],
        ['', 'Temp. de Saturación', 'ºF'],
        ['', 'P. en Condensador', 'PSI'],
        ['COMPRESOR', 'Temperatura descarga', '°F'],
        ['', 'Sobrecalentamiento descarga', '°F'],
        ['', '% de límite de corriente motor', '%'],
        ['', 'Temperatura de aceite', 'ºF'],
        ['', 'Presión de aceite', 'PSIG'],
        ['', 'SURGE', '-']
    ];

    filas.forEach((fila, idx) => {
        const row = 8 + idx;
        data[row][0] = fila[0];
        data[row][1] = fila[1];
        data[row][3] = fila[2];  // UND
    });

    // Valores de referencia (última columna, T? U? índice 20)
    const referencias = [
        '45°F', '55°F', '36 PSI', '38 - 44',
        '70 - 85', '80 - 95', '90 - 98', '118',
        '', '20-30', '', '110 - 125', '60 - 69', ''
    ];
    referencias.forEach((val, idx) => {
        data[8 + idx][20] = val;
    });

    // ---- Insertar valores del registro diurno ----
    // Ejemplo: data[8][4] = registro.diurno['evap_salida_05am'] || '';  // Ch1 05:00AM

    // Observaciones (fila 23, columna 8)
    data[22][8] = registro.diurno?.observaciones || '';

    // Técnico diurno
    data[23][0] = 'TECNICO DIURNO';
    data[24][0] = registro.diurno?.tecnico_diurno || '';

    // Elaborado por, Supervisor, Mañana, Encendido por
    // data[26][0] = registro.diurno.elaborado_por || '';
    // data[27][0] = registro.diurno.supervisor || '';
    // data[26][4] = registro.diurno.manana || '';
    // data[26][5] = registro.diurno.encendido_por || '';

    const ws = XLSX.utils.aoa_to_sheet(data);

    ws['!merges'] = [
        { s: { r: 1, c: 0 }, e: { r: 1, c: 20 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 20 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 20 } },
        // ...
    ];

    return ws;
}
