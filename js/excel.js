// excel.js
// Generación de Excel usando plantilla .xlsx con datos de ambos chillers

async function generarExcel(datosCombinados) {
    // datosCombinados tiene la forma { chiller1: {...}, chiller3: {...} }
    const { chiller1, chiller3 } = datosCombinados;

    // Cargar la plantilla desde la carpeta libs
    const response = await fetch('libs/plantilla.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });

    // Obtener las hojas
    const hojaVoltaje = wb.Sheets['Medición Voltaje'];
    const hojaNocturno = wb.Sheets['NOCTURNO'];
    const hojaDiurno = wb.Sheets['DIURNO'];

    // --- MAPEO DE CELDAS PARA VOLTAJE ---
    // Completa con las direcciones según tu archivo original
    const mapaVoltaje = {
        // Chiller 1
        'v_ch1_05:00_(OP)_l12': 'Q11',
        'v_ch1_05:00_(OP)_l23': 'R11',
        'v_ch1_05:00_(OP)_l31': 'S11',
        // ... todos los campos de voltaje para ch1 y ch3
    };

    // --- MAPEO PARA NOCTURNO ---
    const mapaNocturno = {
        // Chiller 1, 19:00
        'noct_0_19h': 'E9',   // Temp. Salida
        'noct_1_19h': 'E10',  // Temp. Retorno
        // ... etc para ch1 y ch3 (columnas J-O para ch3)
    };

    // --- MAPEO PARA DIURNO ---
    const mapaDiurno = {
        // Chiller 1, 05:00
        'diurno_0_h0': 'D9',   // Temp. Salida
        'diurno_0_h1': 'E9',   // 07:30
        // ... etc para ch1 y ch3 (columnas L-S para ch3)
    };

    // --- Rellenar celdas de voltaje para Chiller 1 ---
    if (chiller1 && chiller1.voltaje) {
        for (let [id, valor] of Object.entries(chiller1.voltaje)) {
            if (mapaVoltaje[id] && valor !== '') {
                const direccion = mapaVoltaje[id];
                let cell = hojaVoltaje[direccion];
                if (!cell) {
                    cell = { t: 'n' };
                    hojaVoltaje[direccion] = cell;
                }
                cell.v = parseFloat(valor);
                cell.t = 'n';
            }
        }
    }

    // --- Rellenar celdas de voltaje para Chiller 3 ---
    if (chiller3 && chiller3.voltaje) {
        for (let [id, valor] of Object.entries(chiller3.voltaje)) {
            // Los ids de ch3 deben estar en el mapa con sus coordenadas (ej. columnas W-Y)
            if (mapaVoltaje[id] && valor !== '') {
                const direccion = mapaVoltaje[id];
                let cell = hojaVoltaje[direccion];
                if (!cell) {
                    cell = { t: 'n' };
                    hojaVoltaje[direccion] = cell;
                }
                cell.v = parseFloat(valor);
                cell.t = 'n';
            }
        }
    }

    // --- Rellenar celdas nocturno para Chiller 1 (columnas E-I) ---
    if (chiller1 && chiller1.nocturno) {
        for (let [id, valor] of Object.entries(chiller1.nocturno)) {
            if (mapaNocturno[id] && valor !== '') {
                const direccion = mapaNocturno[id];
                let cell = hojaNocturno[direccion];
                if (!cell) {
                    cell = { t: 'n' };
                    hojaNocturno[direccion] = cell;
                }
                cell.v = parseFloat(valor);
                cell.t = 'n';
            }
        }
    }

    // --- Rellenar celdas nocturno para Chiller 3 (columnas J-O) ---
    if (chiller3 && chiller3.nocturno) {
        for (let [id, valor] of Object.entries(chiller3.nocturno)) {
            // Necesitas un mapa separado para ch3 o usar el mismo con prefijos
            // Ejemplo: si los ids de ch3 son 'noct_ch3_0_19h', entonces mapear a J9, etc.
            // Aquí debes adaptar según cómo generes los ids en ui.js
            // Por simplicidad, asumimos que los ids de ch3 ya están en mapaNocturno con sus coordenadas.
            if (mapaNocturno[id] && valor !== '') {
                const direccion = mapaNocturno[id];
                let cell = hojaNocturno[direccion];
                if (!cell) {
                    cell = { t: 'n' };
                    hojaNocturno[direccion] = cell;
                }
                cell.v = parseFloat(valor);
                cell.t = 'n';
            }
        }
    }

    // --- Rellenar celdas diurno para Chiller 1 (columnas D-K) ---
    if (chiller1 && chiller1.diurno) {
        for (let [id, valor] of Object.entries(chiller1.diurno)) {
            if (mapaDiurno[id] && valor !== '') {
                const direccion = mapaDiurno[id];
                let cell = hojaDiurno[direccion];
                if (!cell) {
                    cell = { t: 'n' };
                    hojaDiurno[direccion] = cell;
                }
                cell.v = parseFloat(valor);
                cell.t = 'n';
            }
        }
    }

    // --- Rellenar celdas diurno para Chiller 3 (columnas L-S) ---
    if (chiller3 && chiller3.diurno) {
        for (let [id, valor] of Object.entries(chiller3.diurno)) {
            // Similarmente, los ids de ch3 deben estar en mapaDiurno
            if (mapaDiurno[id] && valor !== '') {
                const direccion = mapaDiurno[id];
                let cell = hojaDiurno[direccion];
                if (!cell) {
                    cell = { t: 'n' };
                    hojaDiurno[direccion] = cell;
                }
                cell.v = parseFloat(valor);
                cell.t = 'n';
            }
        }
    }

    // --- Insertar fecha en las celdas correspondientes ---
    const celdasFechaVoltaje = ['O6', 'U6', 'C7', 'I7']; // Ajusta según tu archivo
    celdasFechaVoltaje.forEach(dir => {
        let cell = hojaVoltaje[dir];
        if (!cell) {
            cell = { t: 's' };
            hojaVoltaje[dir] = cell;
        }
        cell.v = `FECHA: ${chiller1?.fecha || chiller3?.fecha}`;
        cell.t = 's';
    });

    // También puedes agregar la fecha en las hojas nocturno y diurno
    // hojaNocturno['A7'] = { t: 's', v: `FECHA: ${chiller1?.fecha}` };
    // hojaDiurno['A7'] = { t: 's', v: `FECHA: ${chiller1?.fecha}` };

    // --- Generar archivo Excel ---
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
