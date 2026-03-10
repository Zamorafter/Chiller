// excel.js
// Generación de Excel usando plantilla .xlsx

async function generarExcel(registro) {
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
        // Ejemplo: 'v_ch1_05:00_(OP)_l12': 'Q11',
        // 'v_ch1_05:00_(OP)_l23': 'R11',
        // 'v_ch1_05:00_(OP)_l31': 'S11',
        // ... (todos los campos de voltaje)
    };

    // --- MAPEO PARA NOCTURNO ---
    const mapaNocturno = {
        // 'noct_0_19h': 'E9',   // Temp. Salida, Chiller 1, 19:00
        // 'noct_0_20h': 'F9',
        // ... etc
    };

    // --- MAPEO PARA DIURNO ---
    const mapaDiurno = {
        // 'diurno_0_h0': 'D9',   // Temp. Salida, Ch1, 05:00
        // 'diurno_0_h1': 'E9',
        // ... etc
    };

    // --- Rellenar celdas de voltaje ---
    if (registro.voltaje) {
        for (let [id, valor] of Object.entries(registro.voltaje)) {
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

    // --- Rellenar celdas nocturno ---
    if (registro.nocturno) {
        for (let [id, valor] of Object.entries(registro.nocturno)) {
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

    // --- Rellenar celdas diurno ---
    if (registro.diurno) {
        for (let [id, valor] of Object.entries(registro.diurno)) {
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
        cell.v = `FECHA: ${registro.fecha}`;
        cell.t = 's';
    });

    // También puedes agregar la fecha en las hojas nocturno y diurno si es necesario
    // hojaNocturno['A7'] = { t: 's', v: `FECHA: ${registro.fecha}` };
    // hojaDiurno['A7'] = { t: 's', v: `FECHA: ${registro.fecha}` };

    // --- Generar archivo Excel ---
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}