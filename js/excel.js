function generarExcel(registro) {
    const wb = XLSX.utils.book_new();
    const wsVoltaje = crearHojaMedicionVoltaje(registro);
    const wsNocturno = crearHojaNocturno(registro);
    const wsDiurno = crearHojaDiurno(registro);
    XLSX.utils.book_append_sheet(wb, wsVoltaje, "Medición Voltaje");
    XLSX.utils.book_append_sheet(wb, wsNocturno, "NOCTURNO");
    XLSX.utils.book_append_sheet(wb, wsDiurno, "DIURNO");
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function crearHojaMedicionVoltaje(registro) {
    let data = [];
    for (let i = 0; i < 40; i++) data[i] = Array(30).fill('');

    // Títulos fijos (completar según el archivo original)
    data[0][0] = 'TOLÓN FASHION MALL';
    data[0][13] = 'GERENCIA DE OPERACIONES';
    data[1][0] = 'GERENCIA DE OPERACIONES';
    data[1][13] = 'CONTROL DE VOLTAJE';
    data[2][0] = 'CONTROL DE VOLTAJE';

    data[5][15] = `FECHA: ${registro.fecha}`;
    data[5][21] = `FECHA: ${registro.fecha}`;
    data[6][2]  = `FECHA: ${registro.fecha}`;
    data[6][8]  = `FECHA: ${registro.fecha}`;

    data[7][16] = 'CHILLER #1';
    data[7][22] = 'CHILLER #3';
    data[8][3]  = 'CHILLER #1';
    data[8][9]  = 'CHILLER #3';

    data[9][16] = 'V L1-2';
    data[9][17] = 'V L2-3';
    data[9][18] = 'V L3-1';
    data[9][22] = 'V L1-2';
    data[9][23] = 'V L2-3';
    data[9][24] = 'V L3-1';

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

    data[11][1] = '(OP)';
    data[11][2] = '05:00:00';
    data[11][7] = '(OP)';
    data[11][8] = '6:30am';
    data[11][14] = '(F)';
    data[11][15] = '20:00:00';
    data[11][20] = '(F)';
    data[11][21] = '20:00:00';

    data[12][1] = '(F)';
    data[12][2] = '08:30am';
    data[12][7] = '(F)';
    data[12][8] = '08:30am';
    data[12][14] = '(F)';
    data[12][15] = '21:00:00';
    data[12][20] = '(F)';
    data[12][21] = '21:00:00';

    data[13][1] = '(F)';
    data[13][2] = '11:00am';
    data[13][7] = '(F)';
    data[13][8] = '11:00am';
    data[13][14] = '(OP)';
    data[13][15] = '22:00:00';
    data[13][20] = '(OP)';
    data[13][21] = '22:00:00';

    data[14][1] = '(OP)';
    data[14][2] = '02:00pm';
    data[14][7] = '(OP)';
    data[14][8] = '02:00pm';
    data[14][14] = '(F)';
    data[14][15] = '23:00:00';
    data[14][20] = '(F)';
    data[14][21] = '23:00:00';

    data[15][1] = '(F)';
    data[15][2] = '04:00pm';
    data[15][7] = '(F)';
    data[15][8] = '04:00pm';
    data[15][14] = '(OP)';
    data[15][15] = '00:00:00';
    data[15][20] = '(OP)';
    data[15][21] = '00:00:00';

    data[16][1] = '(OP)';
    data[16][2] = '06:00pm';
    data[16][7] = '(OP)';
    data[16][8] = '06:00pm';
    data[16][14] = '(OP)';
    data[16][15] = '01:00:00';
    data[16][20] = '(OP)';
    data[16][21] = '01:00:00';

    // Aquí debes mapear los valores de registro.voltaje según los IDs generados en ui.js
    // Ejemplo:
    // if (registro.voltaje) {
    //     data[10][16] = registro.voltaje['v_ch1_05:00_(OP)_l12'] || '';
    //     data[10][17] = registro.voltaje['v_ch1_05:00_(OP)_l23'] || '';
    //     data[10][18] = registro.voltaje['v_ch1_05:00_(OP)_l31'] || '';
    //     ... etc
    // }

    data[18][15] = registro.voltaje?.obs_voltaje || '';
    data[22][15] = registro.voltaje?.op_nocturno || '';
    data[24][18] = registro.voltaje?.hora_apagado_1 || '';
    data[24][22] = registro.voltaje?.hora_apagado_3 || '';

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
        { s: { r: 0, c: 13 }, e: { r: 0, c: 24 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
        { s: { r: 1, c: 13 }, e: { r: 1, c: 24 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 12 } }
    ];
    return ws;
}

function crearHojaNocturno(registro) {
    let data = [];
    for (let i = 0; i < 40; i++) data[i] = Array(20).fill('');

    data[1][0] = 'TOLÓN FASHION MALL';
    data[2][0] = 'GERENCIA DE OPERACIONES';
    data[3][0] = 'CONTROL DE VALORES EN CHILLERS';
    data[5][0] = 'TEMPERATURA AMBIENTE:';
    data[6][0] = `FECHA: ${registro.fecha}`;
    data[6][4] = 'Chiller N° 1';
    data[6][10] = 'Chiller N° 3';
    data[6][16] = 'Datos de referencia';

    const horas = ['19:00:00', '20:00:00', '21:00:00', '22:00:00', '23:00:00', '00:00:00'];
    horas.forEach((h, idx) => {
        data[7][3 + idx] = h;
        data[7][9 + idx] = h;
    });

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
        data[row][3] = fila[2];
    });

    const referencias = [
        '45°F', '55°F', '36 PSI', '38 - 44',
        '70 - 85', '80 - 95', '90 - 98', '118',
        '', '20-30', '', '110 - 125', '60 - 69', ''
    ];
    referencias.forEach((val, idx) => {
        data[8 + idx][16] = val;
    });

    // Mapear valores de registro.nocturno
    // if (registro.nocturno) {
    //     data[8][4] = registro.nocturno['noct_0_19h'] || '';
    //     ...
    // }

    data[22][8] = registro.nocturno?.obs_noct || '';
    data[23][0] = 'TECNICO NOCTURNO';
    data[24][0] = registro.nocturno?.tec_noct || '';
    data[30][0] = 'Hora de apagado CHILLER #01';
    data[30][4] = 'Hora de apagado CHILLER #03';
    data[31][0] = registro.nocturno?.hora_apagado_1 || '';
    data[31][4] = registro.nocturno?.hora_apagado_3 || '';

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!merges'] = [
        { s: { r: 1, c: 0 }, e: { r: 1, c: 16 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 16 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 16 } }
    ];
    return ws;
}

function crearHojaDiurno(registro) {
    let data = [];
    for (let i = 0; i < 50; i++) data[i] = Array(25).fill('');

    data[1][0] = 'TOLÓN FASHION MALL';
    data[2][0] = 'GERENCIA DE OPERACIONES';
    data[3][0] = 'CONTROL DE VALORES EN CHILLERS';
    data[5][0] = 'TEMPERATURA AMBIENTE:';
    data[6][0] = `FECHA: ${registro.fecha}`;
    data[6][4] = 'Chiller N° 1';
    data[6][12] = 'Chiller N° 3';
    data[6][20] = 'Datos de referencia';

    const horasCh1 = ['05:00AM (OP)', '07:30AM (OP)', '08:30AM (F)', '10:00AM (F)', '11AM (F)', '2PM (OP)', '4PM (F)', '6PM (OP)'];
    const horasCh3 = ['6:30AM (OP)', '7:30AM (OP)', '08:30AM (F)', '10:00AM (F)', '11AM (F)', '2PM (OP)', '4PM (F)', '6PM (OP)'];

    horasCh1.forEach((h, idx) => {
        data[7][3 + idx] = h;
    });
    horasCh3.forEach((h, idx) => {
        data[7][11 + idx] = h;
    });

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
        data[row][3] = fila[2];
    });

    const referencias = [
        '45°F', '55°F', '36 PSI', '38 - 44',
        '70 - 85', '80 - 95', '90 - 98', '118',
        '', '20-30', '', '110 - 125', '60 - 69', ''
    ];
    referencias.forEach((val, idx) => {
        data[8 + idx][20] = val;
    });

    // Mapear valores de registro.diurno
    // if (registro.diurno) {
    //     data[8][4] = registro.diurno['diurno_0_h0'] || '';
    //     ...
    // }

    data[22][8] = registro.diurno?.obs_diurno || '';
    data[23][0] = 'TECNICO DIURNO';
    data[24][0] = registro.diurno?.tec_diurno || '';
    data[26][0] = registro.diurno?.elab_diurno || '';
    data[27][0] = registro.diurno?.sup_diurno || '';

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!merges'] = [
        { s: { r: 1, c: 0 }, e: { r: 1, c: 20 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 20 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 20 } }
    ];
    return ws;
}