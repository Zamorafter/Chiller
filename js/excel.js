const OUTPUT_SHEETS = ['Dashboard Chiller', 'Dashboard Voltaje'];

function encontrarHoja(wb, target) {
    const normalizedTarget = target.toLowerCase();
    const found = wb.SheetNames.find((name) => name.toLowerCase().includes(normalizedTarget));
    if (!found) {
        throw new Error(`No existe la hoja ${target} en la plantilla.`);
    }
    return found;
}

function conservarSoloDashboards(wb) {
    const chillerSheetName = encontrarHoja(wb, OUTPUT_SHEETS[0]);
    const voltageSheetName = encontrarHoja(wb, OUTPUT_SHEETS[1]);
    const nuevo = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(nuevo, wb.Sheets[chillerSheetName], chillerSheetName);
    XLSX.utils.book_append_sheet(nuevo, wb.Sheets[voltageSheetName], voltageSheetName);
    return { wb: nuevo, chillerSheetName, voltageSheetName };
}

async function generarExcel(datosCombinados) {
    const { chiller1, chiller3 } = datosCombinados;
    const response = await fetch('libs/Copia de 01-Check List - Control valores chillers i.xls');
    const arrayBuffer = await response.arrayBuffer();
    const { wb, chillerSheetName, voltageSheetName } = conservarSoloDashboards(XLSX.read(arrayBuffer, { type: 'array' }));

    const hojaDashboardChiller = wb.Sheets[chillerSheetName];
    const hojaDashboardVoltaje = wb.Sheets[voltageSheetName];

    const colNumToLetter = (num) => {
        let s = '';
        while (num > 0) {
            const mod = (num - 1) % 26;
            s = String.fromCharCode(65 + mod) + s;
            num = Math.floor((num - 1) / 26);
        }
        return s;
    };

    const FILA_BASE_CHILLER = 8169;
    const FILA_BASE_VOLTAJE = 7443;
    const COL_INICIO_CHILLER = 4;
    const COL_FIN_CHILLER = 36;
    const COL_INICIO_VOLTAJE = 4;
    const COL_FIN_VOLTAJE = 15;
    const HORAS_NOCT = ['19h', '20h', '21h', '22h', '23h', '00h'];

    const colLetraChillerNoct = (horaKey) => {
        const idx = HORAS_NOCT.indexOf(horaKey);
        return colNumToLetter(Math.min(Math.max(COL_INICIO_CHILLER + idx, COL_INICIO_CHILLER), COL_FIN_CHILLER));
    };

    const colLetraChillerDiurno = (hIndex) => colNumToLetter(Math.min(Math.max(COL_INICIO_CHILLER + hIndex, COL_INICIO_CHILLER), COL_FIN_CHILLER));
    const colLetraVoltaje = (momentoIndex) => colNumToLetter(Math.min(Math.max(COL_INICIO_VOLTAJE + momentoIndex, COL_INICIO_VOLTAJE), COL_FIN_VOLTAJE));

    const setNumero = (hoja, addr, valor) => {
        if (valor === '' || valor === null || valor === undefined) return;
        const num = parseFloat(valor);
        if (Number.isNaN(num)) return;
        hoja[addr] = { t: 'n', v: num };
    };

    const escribirNocturno = (chillerDatos) => {
        Object.entries(chillerDatos?.nocturno || {}).forEach(([id, valor]) => {
            const m = id.match(/^noct_(\d+)_(19h|20h|21h|22h|23h|00h)$/);
            if (!m) return;
            setNumero(hojaDashboardChiller, `${colLetraChillerNoct(m[2])}${FILA_BASE_CHILLER + parseInt(m[1], 10)}`, valor);
        });
    };

    const escribirDiurno = (chillerDatos) => {
        Object.entries(chillerDatos?.diurno || {}).forEach(([id, valor]) => {
            const m = id.match(/^diurno_(\d+)_h(\d+)$/);
            if (!m) return;
            setNumero(hojaDashboardChiller, `${colLetraChillerDiurno(parseInt(m[2], 10))}${FILA_BASE_CHILLER + parseInt(m[1], 10)}`, valor);
        });
    };

    const MOMENTOS_CH1 = ['05:00 (OP)', '08:30 (F)', '11:00 (F)', '14:00 (OP)', '16:00 (F)', '18:00 (OP)', '19:00 (OP)', '20:00 (F)', '21:00 (F)', '22:00 (OP)', '23:00 (F)', '00:00 (OP)', '01:00 (OP)'];
    const MOMENTOS_CH3 = ['06:30 (OP)', '08:30 (F)', '11:00 (F)', '14:00 (OP)', '16:00 (F)', '18:00 (OP)', '19:00 (OP)', '20:00 (F)', '21:00 (F)', '22:00 (OP)', '23:00 (F)', '00:00 (OP)', '01:00 (OP)'];
    const normalizarMomento = (m) => m.replace(/[^a-zA-Z0-9]/g, '_');

    const escribirVoltaje = (chillerDatos, momentos, offsetFilas) => {
        const indexPorMomento = new Map(momentos.map((m, i) => [normalizarMomento(m), i]));
        Object.entries(chillerDatos?.voltaje || {}).forEach(([id, valor]) => {
            const m = id.match(/^v_ch(\d)_(.+)_(l12|l23|l31)$/);
            if (!m) return;
            const faseOffset = m[3] === 'l12' ? 0 : m[3] === 'l23' ? 1 : 2;
            const momentoIndex = indexPorMomento.has(m[2]) ? indexPorMomento.get(m[2]) : 0;
            setNumero(hojaDashboardVoltaje, `${colLetraVoltaje(momentoIndex)}${FILA_BASE_VOLTAJE + offsetFilas + faseOffset}`, valor);
        });
    };

    escribirNocturno(chiller1);
    escribirNocturno(chiller3);
    escribirDiurno(chiller1);
    escribirDiurno(chiller3);
    escribirVoltaje(chiller1, MOMENTOS_CH1, 0);
    escribirVoltaje(chiller3, MOMENTOS_CH3, 4);

    const wbout = XLSX.write(wb, { bookType: 'xls', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.ms-excel' });
}

window.generarExcel = generarExcel;
