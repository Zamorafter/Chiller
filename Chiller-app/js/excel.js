function generarExcel(registro) {
    const wb = XLSX.utils.book_new();

    // Crear hoja Medición Voltaje
    const wsVoltaje = crearHojaMedicionVoltaje(registro);
    XLSX.utils.book_append_sheet(wb, wsVoltaje, "Medición Voltaje");

    // Crear hoja NOCTURNO
    const wsNocturno = crearHojaNocturno(registro);
    XLSX.utils.book_append_sheet(wb, wsNocturno, "NOCTURNO");

    // Crear hoja DIURNO
    const wsDiurno = crearHojaDiurno(registro);
    XLSX.utils.book_append_sheet(wb, wsDiurno, "DIURNO");

    // Generar archivo
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function crearHojaMedicionVoltaje(registro) {
    let data = [];
    for (let i = 0; i < 30; i++) {
        data[i] = Array(25).fill('');
    }

    // Títulos y encabezados fijos (según el archivo original)
    data[0][0] = 'TOLÓN FASHION MALL';
    data[0][13] = 'GERENCIA DE OPERACIONES';
    data[1][0] = 'GERENCIA DE OPERACIONES';
    data[1][13] = 'CONTROL DE VOLTAJE';
    data[2][0] = 'CONTROL DE VOLTAJE';
    
    // Fechas
    data[5][15] = `FECHA: ${registro.fecha}`;        // O6
    data[5][21] = `FECHA: ${registro.fecha}`;        // V6? Ajustar
    data[6][2] = `FECHA: ${registro.fecha}`;          // C7
    data[6][8] = `FECHA: ${registro.fecha}`;          // I7

    // Encabezados de chiller
    data[7][16] = 'CHILLER #1';                        // Q8
    data[7][22] = 'CHILLER #3';                        // W8
    data[8][3] = 'CHILLER #1';                         // D9
    data[8][9] = 'CHILLER #3';                         // J9
    data[9][16] = 'V L1 - 2';                          // Q10
    data[9][17] = 'V L2 - 3';                          // R10
    data[9][18] = 'V L3 - 1';                          // S10
    data[9][22] = 'V L1 - 2';                          // W10
    data[9][23] = 'V L2 - 3';                          // X10
    data[9][24] = 'V L3 - 1';                          // Y10

    // Filas con horas y tipos (según el archivo)
    data[10][3] = 'V L1 - 2';                          // D11
    data[10][4] = 'V L2 - 3';                          // E11
    data[10][5] = 'V L3 - 1';                          // F11
    data[10][9] = 'V L1 - 2';                          // J11
    data[10][10] = 'V L2 - 3';                         // K11
    data[10][11] = 'V L3 - 1';                         // L11
    data[10][14] = '(OP)';                             // O11
    data[10][15] = '19:00:00';                         // P11
    data[10][20] = '(OP)';                             // U11
    data[10][21] = '19:00:00';                         // V11

    data[11][1] = '(OP)';                              // B12
    data[11][2] = '05:00:00';                          // C12
    data[11][7] = '(OP)';                              // H12
    data[11][8] = '6:30am';                            // I12
    data[11][14] = '(F)';                              // O12
    data[11][15] = '20:00:00';                         // P12
    data[11][20] = '(F)';                              // U12
    data[11][21] = '20:00:00';                         // V12

    data[12][1] = '(F)';                               // B13
    data[12][2] = '08:30am';                           // C13
    data[12][7] = '(F)';                               // H13
    data[12][8] = '08:30am';                           // I13
    data[12][14] = '(F)';                              // O13
    data[12][15] = '21:00:00';                         // P13
    data[12][20] = '(F)';                              // U13
    data[12][21] = '21:00:00';                         // V13

    data[13][1] = '(F)';                               // B14
    data[13][2] = '11:00am';                           // C14
    data[13][7] = '(F)';                               // H14
    data[13][8] = '11:00am';                           // I14
    data[13][14] = '(OP)';                             // O14
    data[13][15] = '22:00:00';                         // P14
    data[13][20] = '(OP)';                             // U14
    data[13][21] = '22:00:00';                         // V14

    data[14][1] = '(OP)';                              // B15
    data[14][2] = '02:00pm';                           // C15
    data[14][7] = '(OP)';                              // H15
    data[14][8] = '02:00pm';                           // I15
    data[14][14] = '(F)';                              // O15
    data[14][15] = '23:00:00';                         // P15
    data[14][20] = '(F)';                              // U15
    data[14][21] = '23:00:00';                         // V15

    data[15][1] = '(F)';                               // B16
    data[15][2] = '04:00pm';                           // C16
    data[15][7] = '(F)';                               // H16
    data[15][8] = '04:00pm';                           // I16
    data[15][14] = '(OP)';                             // O16
    data[15][15] = '1900-01-01 00:00:00';              // P16
    data[15][20] = '(OP)';                             // U16
    data[15][21] = '1900-01-01 00:00:00';              // V16

    data[16][1] = '(OP)';                              // B17
    data[16][2] = '06:00pm';                           // C17
    data[16][7] = '(OP)';                              // H17
    data[16][8] = '06:00pm';                           // I17
    data[16][14] = '(OP)';                             // O17
    data[16][15] = '1900-01-01 01:00:00';              // P17
    data[16][20] = '(OP)';                             // U17
    data[16][21] = '1900-01-01 01:00:00';              // V17

    // Observaciones y otros
    data[18][15] = 'Observaciones:';                   // O19
    data[19][2] = 'Observaciones:';                    // C20
    data[22][15] = 'Nombre operador nocturno:';        // O23
    data[23][15] = 'FIRMA';                            // O24
    data[23][18] = 'HORA DE APAGADO DE LOS CHILLERS';  // R24
    data[24][18] = 'CHILLER #1';                       // R25
    data[24][22] = 'CHILLER #3';                       // V25

    // Insertar valores del registro (voltajes)
    // Para simplificar, usaremos un mapa de ids a coordenadas (fila, columna)
    const mapaVoltaje = {
        // Chiller 1
        'v_ch1_05am_op_l12': { r: 11, c: 16 },  // Q12
        'v_ch1_05am_op_l23': { r: 11, c: 17 },  // R12
        'v_ch1_05am_op_l31': { r: 11, c: 18 },  // S12
        'v_ch1_0830am_f_l12': { r: 12, c: 16 }, // Q13
        'v_ch1_0830am_f_l23': { r: 12, c: 17 },
        'v_ch1_0830am_f_l31': { r: 12, c: 18 },
        'v_ch1_11am_f_l12': { r: 13, c: 16 },
        'v_ch1_11am_f_l23': { r: 13, c: 17 },
        'v_ch1_11am_f_l31': { r: 13, c: 18 },
        'v_ch1_2pm_op_l12': { r: 14, c: 16 },
        'v_ch1_2pm_op_l23': { r: 14, c: 17 },
        'v_ch1_2pm_op_l31': { r: 14, c: 18 },
        'v_ch1_4pm_f_l12': { r: 15, c: 16 },
        'v_ch1_4pm_f_l23': { r: 15, c: 17 },
        'v_ch1_4pm_f_l31': { r: 15, c: 18 },
        'v_ch1_6pm_op_l12': { r: 16, c: 16 },
        'v_ch1_6pm_op_l23': { r: 16, c: 17 },
        'v_ch1_6pm_op_l31': { r: 16, c: 18 },
        'v_ch1_19h_op_l12': { r: 10, c: 16 },  // Q11
        'v_ch1_19h_op_l23': { r: 10, c: 17 },
        'v_ch1_19h_op_l31': { r: 10, c: 18 },
        'v_ch1_20h_f_l12': { r: 11, c: 16 },   // Q12? Ya usado para 05am? Cuidado: son diferentes filas
        // ... continuar con todos los momentos
    };

    for (let id in registro.voltaje) {
        if (mapaVoltaje[id]) {
            const { r, c } = mapaVoltaje[id];
            data[r][c] = registro.voltaje[id];
        }
    }

    // Fusiones (merges)
    const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
        { s: { r: 0, c: 13 }, e: { r: 0, c: 24 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
        { s: { r: 1, c: 13 }, e: { r: 1, c: 24 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 12 } },
        { s: { r: 5, c: 15 }, e: { r: 5, c: 20 } }, // O6:? (fecha)
        // Agregar todas las necesarias según el original
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!merges'] = merges;
    return ws;
}

function crearHojaNocturno(registro) {
    let data = [];
    for (let i = 0; i < 40; i++) data[i] = Array(17).fill('');

    // Títulos
    data[1][0] = 'TOLÓN FASHION MALL';
    data[2][0] = 'GERENCIA DE OPERACIONES';
    data[3][0] = 'CONTROL DE VALORES EN CHILLERS';
    data[5][0] = 'TEMPERATURA AMBIENTE:';
    data[6][0] = `FECHA: ${registro.fecha}`;
    data[6][4] = 'Chiller  N° 1';
    data[6][10] = 'Chiller N° 3';
    data[6][16] = 'Datos de referencia';

    // Encabezados de horas
    data[7][0] = 'COMPONENTE / ITEM';
    data[7][2] = 'UND';
    data[7][3] = '19:00:00';
    data[7][4] = '20:00:00';
    data[7][5] = '21:00:00';
    data[7][6] = '22:00:00';
    data[7][7] = '23:00:00';
    data[7][8] = '1900-01-01 00:00:00';
    data[7][9] = '19:00:00';
    data[7][10] = '20:00:00';
    data[7][11] = '21:00:00';
    data[7][12] = '22:00:00';
    data[7][13] = '23:00:00';
    data[7][14] = '1900-01-01 00:00:00';

    // Filas de parámetros
    const filasParams = [
        { comp: 'EVAPORADOR', item: 'Temp. Salida', und: 'ºF', ref: '45°F' },
        { comp: '', item: 'Temp. Retorno', und: 'ºF', ref: '55°F' },
        { comp: '', item: 'P. Del Evaporador', und: 'PSI', ref: '36 PSI' },
        { comp: '', item: 'T. de Saturación', und: '°F', ref: '38 - 44' },
        { comp: 'CONDENSADOR', item: 'Temp. Retorno', und: 'ºF', ref: '70 - 85' },
        { comp: '', item: 'Temp. Salida', und: 'ºF', ref: '80 - 95' },
        { comp: '', item: 'Temp. de Saturación', und: 'ºF', ref: '90 - 98' },
        { comp: '', item: 'P. en Condensador', und: 'PSI', ref: '118' },
        { comp: 'COMPRESOR', item: 'Temperatura descarga', und: '°F', ref: '' },
        { comp: '', item: 'Sobrecalentamiento descarga', und: '°F', ref: '20-30' },
        { comp: '', item: '% de límite de corriente motor', und: '%', ref: '' },
        { comp: '', item: 'Temperatura de aceite', und: 'ºF', ref: '110 - 125' },
        { comp: '', item: 'Presión de aceite', und: 'PSIG', ref: '60 - 69' },
        { comp: '', item: 'SURGE', und: '-', ref: '' }
    ];

    for (let i = 0; i < filasParams.length; i++) {
        let row = 8 + i; // fila 9 en adelante
        data[row][0] = filasParams[i].comp;
        data[row][1] = filasParams[i].item;
        data[row][2] = filasParams[i].und;
        data[row][16] = filasParams[i].ref;
    }

    // Insertar valores del registro (nocturno)
    // Aquí se mapearían los inputs a celdas. Por simplicidad, asumimos que registro.nocturno tiene claves como "noct_0_19h"
    // y las asignamos a las columnas correspondientes (3 a 8 para ch1, 9 a 14 para ch3)
    for (let i = 0; i < filasParams.length; i++) {
        for (let h = 0; h < 6; h++) {
            let idCh1 = `noct_${i}_${h+3}h`; // col 3 a 8
            if (registro.nocturno[idCh1]) {
                data[8+i][3+h] = registro.nocturno[idCh1];
            }
            let idCh3 = `noct_${i}_${h+9}h`; // col 9 a 14
            if (registro.nocturno[idCh3]) {
                data[8+i][9+h] = registro.nocturno[idCh3];
            }
        }
    }

    // Observaciones, técnico, etc.
    data[22][8] = '(*)Observaciones:';
    data[23][1] = 'TECNICO NOCTURNO';
    data[25][0] = 'Elaborado por:';
    data[25][4] = 'Mañana';
    data[25][5] = 'Encendido por:';
    data[26][0] = 'Supervisor:';
    data[29][0] = 'Elaborado por:';
    data[31][0] = 'Supervisor:';
    data[31][5] = 'Firma:';
    data[37][0] = 'Hora de apagado CHILLER #01';
    data[37][4] = 'Hora de apagado CHILLER #03';

    // Fusiones (algunas)
    const merges = [
        { s: { r: 1, c: 0 }, e: { r: 1, c: 16 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 16 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 16 } },
        { s: { r: 22, c: 8 }, e: { r: 22, c: 15 } },
        // etc.
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!merges'] = merges;
    return ws;
}

function crearHojaDiurno(registro) {
    let data = [];
    for (let i = 0; i < 50; i++) data[i] = Array(21).fill('');

    // Títulos
    data[1][0] = 'TOLÓN FASHION MALL';
    data[2][0] = 'GERENCIA DE OPERACIONES';
    data[3][0] = 'CONTROL DE VALORES EN CHILLERS';
    data[5][0] = 'TEMPERATURA AMBIENTE:';
    data[6][0] = `FECHA: ${registro.fecha}`;
    data[6][4] = 'Chiller  N° 1';
    data[6][11] = 'Chiller N° 3';
    data[6][20] = 'Datos de referencia';

    // Encabezados de horas para Ch1 y Ch3
    data[7][0] = 'COMPONENTE / ITEM';
    data[7][2] = 'UND';
    // Ch1 horas
    data[7][3] = '05:00AM (OP)';
    data[7][4] = '07:30AM (OP)';
    data[7][5] = '08:30AM (F)';
    data[7][6] = '10:00AM (F)';
    data[7][7] = '11AM (F)';
    data[7][8] = '2PM (OP)';
    data[7][9] = '4PM (F)';
    data[7][10] = '6PM (OP)';
    // Ch3 horas
    data[7][11] = '6:30AM (OP)';
    data[7][12] = '7:30AM (OP)';
    data[7][13] = '08:30AM (F)';
    data[7][14] = '10:00AM (F)';
    data[7][15] = '11AM (F)';
    data[7][16] = '2PM (OP)';
    data[7][17] = '4PM (F)';
    data[7][18] = '6PM (OP)';

    // Filas de parámetros (mismas que nocturno)
    const filasParams = [
        { comp: 'EVAPORADOR', item: 'Temp. Salida', und: 'ºF', ref: '45°F' },
        { comp: '', item: 'Temp. Retorno', und: 'ºF', ref: '55°F' },
        { comp: '', item: 'P. Del Evaporador', und: 'PSI', ref: '36 PSI' },
        { comp: '', item: 'T. de Saturación', und: '°F', ref: '38 - 44' },
        { comp: 'CONDENSADOR', item: 'Temp. Retorno', und: 'ºF', ref: '70 - 85' },
        { comp: '', item: 'Temp. Salida', und: 'ºF', ref: '80 - 95' },
        { comp: '', item: 'Temp. de Saturación', und: 'ºF', ref: '90 - 98' },
        { comp: '', item: 'P. en Condensador', und: 'PSI', ref: '118' },
        { comp: 'COMPRESOR', item: 'Temperatura descarga', und: '°F', ref: '' },
        { comp: '', item: 'Sobrecalentamiento descarga', und: '°F', ref: '20-30' },
        { comp: '', item: '% de límite de corriente motor', und: '%', ref: '' },
        { comp: '', item: 'Temperatura de aceite', und: 'ºF', ref: '110 - 125' },
        { comp: '', item: 'Presión de aceite', und: 'PSIG', ref: '60 - 69' },
        { comp: '', item: 'SURGE', und: '-', ref: '' }
    ];

    for (let i = 0; i < filasParams.length; i++) {
        let row = 8 + i;
        data[row][0] = filasParams[i].comp;
        data[row][1] = filasParams[i].item;
        data[row][2] = filasParams[i].und;
        data[row][20] = filasParams[i].ref;
    }

    // Insertar valores del registro (diurno)
    // Aquí se mapean los ids a las celdas correspondientes
    for (let i = 0; i < filasParams.length; i++) {
        for (let h = 0; h < 8; h++) {
            let idCh1 = `diur_${i}_${h+3}`; // col 3 a 10
            if (registro.diurno[idCh1]) {
                data[8+i][3+h] = registro.diurno[idCh1];
            }
            let idCh3 = `diur_${i}_${h+11}`; // col 11 a 18
            if (registro.diurno[idCh3]) {
                data[8+i][11+h] = registro.diurno[idCh3];
            }
        }
    }

    // Observaciones, técnico, etc.
    data[21][8] = '(*)Observaciones:';
    data[22][1] = 'TECNICO DIURNO';
    data[24][0] = 'Elaborado por:';
    data[24][4] = 'Mañana';
    data[24][5] = 'Encendido por:';
    data[25][0] = 'Supervisor:';
    // ... otros campos

    const merges = [
        { s: { r: 1, c: 0 }, e: { r: 1, c: 20 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 20 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 20 } },
        { s: { r: 21, c: 8 }, e: { r: 21, c: 19 } },
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!merges'] = merges;
    return ws;
}