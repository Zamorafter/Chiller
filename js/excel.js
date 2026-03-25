// excel.js
// Generación de Excel usando como plantilla el archivo original de chillers

async function generarExcel(datosCombinados) {
    // datosCombinados tiene la forma { chiller1: {...}, chiller3: {...} }
    const { chiller1, chiller3 } = datosCombinados;

    // Cargar la plantilla original desde la carpeta libs.
    // IMPORTANTE: solo se van a escribir datos en las hojas
    // "Dashboard Chiller´s" y "Dashboard Voltaje" para no afectar el resto.
    const response = await fetch('libs/Copia de 01-Check List - Control valores chillers i.xls');
    const arrayBuffer = await response.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });

    // Obtener solo las hojas que se van a modificar
    const hojaDashboardChiller = wb.Sheets["Dashboard Chiller´s"];
    const hojaDashboardVoltaje = wb.Sheets['Dashboard Voltaje'];

    // --- Utilidades para manejar columnas ---
    const colNumToLetter = (num) => {
        let s = '';
        while (num > 0) {
            let mod = (num - 1) % 26;
            s = String.fromCharCode(65 + mod) + s;
            num = Math.floor((num - 1) / 26);
        }
        return s;
    };

    // Filas base indicadas por el usuario dentro de cada dashboard
    // (primer renglón de datos que se quiere llenar).
    const FILA_BASE_CHILLER = 8169;
    const FILA_BASE_VOLTAJE = 7443;

    // Rango de columnas permitido para llenado continuo
    // Dashboard Chiller´s: de D a AJ
    const COL_INICIO_CHILLER = 4;      // D
    const COL_FIN_CHILLER = 36;        // AJ

    // Dashboard Voltaje: de D a O
    const COL_INICIO_VOLTAJE = 4;      // D
    const COL_FIN_VOLTAJE = 15;        // O

    // Mapeo de horas a columnas (según el orden del formulario / Excel)
    const HORAS_NOCT = ['19h', '20h', '21h', '22h', '23h', '00h']; // 6 columnas: D..I
    const HORAS_DIURNO = [
        '05:00', '07:30', '08:30', '10:00', '11:00', '14:00', '16:00', '18:00',
        '06:30', '07:30', '08:30', '10:00', '11:00', '14:00', '16:00', '18:00'
    ]; // 16 columnas: D..S

    const colLetraChillerNoct = (horaKey) => {
        const idx = HORAS_NOCT.indexOf(horaKey);
        const col = Math.min(Math.max(COL_INICIO_CHILLER + idx, COL_INICIO_CHILLER), COL_FIN_CHILLER);
        return colNumToLetter(col);
    };

    const colLetraChillerDiurno = (hIndex) => {
        const col = Math.min(Math.max(COL_INICIO_CHILLER + hIndex, COL_INICIO_CHILLER), COL_FIN_CHILLER);
        return colNumToLetter(col);
    };

    const colLetraVoltaje = (momentoIndex) => {
        const col = Math.min(Math.max(COL_INICIO_VOLTAJE + momentoIndex, COL_INICIO_VOLTAJE), COL_FIN_VOLTAJE);
        return colNumToLetter(col);
    };

    const setNumero = (hoja, addr, valor) => {
        if (valor === '' || valor === null || valor === undefined) return;
        const num = parseFloat(valor);
        if (Number.isNaN(num)) return;
        let cell = hoja[addr];
        if (!cell) {
            cell = { t: 'n' };
            hoja[addr] = cell;
        }
        cell.v = num;
        cell.t = 'n';
    };

    // --- Dashboard Chiller´s (filas desde 8169) ---
    // Nocturno: noct_{idx}_{19h..00h} -> fila = FILA_BASE_CHILLER + idx, columna = D..I según hora
    const escribirNocturno = (chillerDatos) => {
        if (!chillerDatos?.nocturno) return;
        for (let [id, valor] of Object.entries(chillerDatos.nocturno)) {
            const m = id.match(/^noct_(\d+)_(19h|20h|21h|22h|23h|00h)$/);
            if (!m) continue;
            const idx = parseInt(m[1], 10);
            const horaKey = m[2];
            const col = colLetraChillerNoct(horaKey);
            const fila = FILA_BASE_CHILLER + idx;
            setNumero(hojaDashboardChiller, `${col}${fila}`, valor);
        }
    };

    // Diurno: diurno_{idx}_h{0..15} -> fila = FILA_BASE_CHILLER + idx, columna = D..S según h
    const escribirDiurno = (chillerDatos) => {
        if (!chillerDatos?.diurno) return;
        for (let [id, valor] of Object.entries(chillerDatos.diurno)) {
            const m = id.match(/^diurno_(\d+)_h(\d+)$/);
            if (!m) continue;
            const idx = parseInt(m[1], 10);
            const h = parseInt(m[2], 10);
            const col = colLetraChillerDiurno(h);
            const fila = FILA_BASE_CHILLER + idx;
            setNumero(hojaDashboardChiller, `${col}${fila}`, valor);
        }
    };

    escribirNocturno(chiller1);
    escribirNocturno(chiller3);
    escribirDiurno(chiller1);
    escribirDiurno(chiller3);

    // --- Dashboard Voltaje (filas desde 7443) ---
    // Interpretación:
    // - Las columnas D..O representan los momentos del formulario (en orden).
    // - Las filas (7443..) representan L1-2 / L2-3 / L3-1 para cada chiller.
    const MOMENTOS_CH1 = [
        '05:00 (OP)', '08:30 (F)', '11:00 (F)', '14:00 (OP)', '16:00 (F)', '18:00 (OP)',
        '19:00 (OP)', '20:00 (F)', '21:00 (F)', '22:00 (OP)', '23:00 (F)', '00:00 (OP)', '01:00 (OP)'
    ];
    const MOMENTOS_CH3 = [
        '06:30 (OP)', '08:30 (F)', '11:00 (F)', '14:00 (OP)', '16:00 (F)', '18:00 (OP)',
        '19:00 (OP)', '20:00 (F)', '21:00 (F)', '22:00 (OP)', '23:00 (F)', '00:00 (OP)', '01:00 (OP)'
    ];

    const normalizarMomento = (m) => m.replace(/[^a-zA-Z0-9]/g, '_');

    const escribirVoltaje = (chillerDatos, momentos, offsetFilas) => {
        if (!chillerDatos?.voltaje) return;
        const indexPorMomento = new Map(momentos.map((m, i) => [normalizarMomento(m), i]));

        for (let [id, valor] of Object.entries(chillerDatos.voltaje)) {
            const m = id.match(/^v_ch(\d)_(.+)_(l12|l23|l31)$/);
            if (!m) continue;
            const momentoKey = m[2];
            const fase = m[3];
            const momentoIndex = indexPorMomento.has(momentoKey) ? indexPorMomento.get(momentoKey) : 0;
            const col = colLetraVoltaje(momentoIndex);

            const faseOffset = fase === 'l12' ? 0 : fase === 'l23' ? 1 : 2;
            const fila = FILA_BASE_VOLTAJE + offsetFilas + faseOffset;
            setNumero(hojaDashboardVoltaje, `${col}${fila}`, valor);
        }
    };

    // chiller1 ocupa FILA_BASE_VOLTAJE..+2, chiller3 ocupa +4..+6 (separación por claridad)
    escribirVoltaje(chiller1, MOMENTOS_CH1, 0);
    escribirVoltaje(chiller3, MOMENTOS_CH3, 4);

    // Fecha del dispositivo: se escribe en una celda cercana al bloque (puedes ajustar filas/cols si lo necesitas)
    const ahora = new Date();
    const fechaTexto = chiller1?.fecha || chiller3?.fecha || ahora.toISOString().split('T')[0];
    hojaDashboardChiller[`D${FILA_BASE_CHILLER - 1}`] = { t: 's', v: `FECHA: ${fechaTexto}` };
    hojaDashboardVoltaje[`D${FILA_BASE_VOLTAJE - 1}`] = { t: 's', v: `FECHA: ${fechaTexto}` };

    // --- Generar archivo Excel ---
    const wbout = XLSX.write(wb, { bookType: 'xls', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.ms-excel' });
}

window.generarExcel = generarExcel;
