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

    // --- Utilidades para manejar columnas y búsqueda de la siguiente columna libre ---
    const colNumToLetter = (num) => {
        let s = '';
        while (num > 0) {
            let mod = (num - 1) % 26;
            s = String.fromCharCode(65 + mod) + s;
            num = Math.floor((num - 1) / 26);
        }
        return s;
    };

    const siguienteColumnaLibre = (hoja, filaReferencia, colInicio, colFin) => {
        // Busca de izquierda a derecha la primera celda vacía en la filaReferencia
        for (let c = colInicio; c <= colFin; c++) {
            const colLetra = colNumToLetter(c);
            const addr = `${colLetra}${filaReferencia}`;
            const celda = hoja[addr];
            if (!celda || celda.v === undefined || celda.v === null || celda.v === '') {
                return c;
            }
        }
        // Si todas tienen algo, usa la última (sobrescribe)
        return colFin;
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

    // Filas de referencia donde se escribe FECHA / HORA en cada dashboard
    // Ajusta estos números a las filas reales de tu archivo.
    const FILA_FECHA_VOLTAJE = 4;
    const FILA_HORA_VOLTAJE = 5;

    const FILA_FECHA_CHILLER = 4;
    const FILA_HORA_CHILLER = 5;

    // Determinar la columna que se va a usar hoy (siguiente libre dentro del rango)
    const colVoltajeSeleccionada = siguienteColumnaLibre(
        hojaDashboardVoltaje,
        FILA_FECHA_VOLTAJE,
        COL_INICIO_VOLTAJE,
        COL_FIN_VOLTAJE
    );
    const colChillerSeleccionada = siguienteColumnaLibre(
        hojaDashboardChiller,
        FILA_FECHA_CHILLER,
        COL_INICIO_CHILLER,
        COL_FIN_CHILLER
    );

    const colVoltajeLetra = colNumToLetter(colVoltajeSeleccionada);
    const colChillerLetra = colNumToLetter(colChillerSeleccionada);

    // --- MAPEO DE FILAS PARA DASHBOARD VOLTAJE ---
    // Clave: id de input (como se genera en ui.js)
    // Valor: número de fila en la hoja "Dashboard Voltaje"
    // La columna se calculará dinámicamente (de D a O) según la fecha.
    const mapaDashboardVoltaje = {
        // Ejemplos de cómo usar la fila base del dashboard de voltaje.
        // Ajusta o amplía estas filas según tu layout real.

        // Chiller 1, primer bloque de voltaje (por ejemplo 05:00)
        // Temp. Salida, Temp. Retorno, P. del Evaporador, etc. irían
        // en filas consecutivas a partir de FILA_BASE_VOLTAJE.

        // 'v_ch1_05_00_OP__l12': FILA_BASE_VOLTAJE,       // Temp. salida
        // 'v_ch1_05_00_OP__l23': FILA_BASE_VOLTAJE + 1,   // Temp. retorno
        // 'v_ch1_05_00_OP__l31': FILA_BASE_VOLTAJE + 2,   // P. del evaporador

        // Chiller 3 (mismo patrón, otras filas si corresponde):
        // 'v_ch3_06_30_OP__l12': FILA_BASE_VOLTAJE + 20,
        // 'v_ch3_06_30_OP__l23': FILA_BASE_VOLTAJE + 21,
        // 'v_ch3_06_30_OP__l31': FILA_BASE_VOLTAJE + 22,
    };

    // --- MAPEO DE FILAS PARA DASHBOARD CHILLER´S ---
    // Aquí puedes combinar tanto datos nocturnos como diurnos.
    // Claves: ids de inputs de las pestañas Nocturno y Diurno.
    // Valor: número de fila donde se debe escribir en "Dashboard Chiller´s".
    // La columna se calculará dinámicamente (de D a AJ) según la fecha.
    const mapaDashboardChiller = {
        // A partir de FILA_BASE_CHILLER se encuentra la fila de
        // "Temp. Salida, Temp. Retorno, P. Del Evaporador, ..." que
        // mostraste en la captura del dashboard.
        //
        // Cada índice de fila del formulario (`idx` en ui.js) se puede
        // alinear con una fila consecutiva del dashboard:
        //
        //  idx 0 -> FILA_BASE_CHILLER      (Temp. Salida)
        //  idx 1 -> FILA_BASE_CHILLER + 1  (Temp. Retorno)
        //  idx 2 -> FILA_BASE_CHILLER + 2  (P. del Evaporador)
        //  idx 3 -> FILA_BASE_CHILLER + 3  (T. de Saturación)
        //  ... y así sucesivamente.

        // Ejemplo para los primeros cuatro ítems nocturnos a las 19:00:
        // 'noct_0_19h': FILA_BASE_CHILLER,
        // 'noct_1_19h': FILA_BASE_CHILLER + 1,
        // 'noct_2_19h': FILA_BASE_CHILLER + 2,
        // 'noct_3_19h': FILA_BASE_CHILLER + 3,

        // Ejemplo para diurno 05:00 (h0) usando la misma línea base:
        // 'diurno_0_h0': FILA_BASE_CHILLER,
        // 'diurno_1_h0': FILA_BASE_CHILLER + 1,
        // 'diurno_2_h0': FILA_BASE_CHILLER + 2,
        // 'diurno_3_h0': FILA_BASE_CHILLER + 3,
    };

    // --- Rellenar DASHBOARD VOLTAJE con datos de voltaje de ambos chillers ---
    const rellenarVoltajeEnDashboard = (chillerDatos) => {
        if (!chillerDatos || !chillerDatos.voltaje) return;
        for (let [id, valor] of Object.entries(chillerDatos.voltaje)) {
            if (mapaDashboardVoltaje[id] && valor !== '') {
                const fila = mapaDashboardVoltaje[id];
                const addr = `${colVoltajeLetra}${fila}`;
                let cell = hojaDashboardVoltaje[addr];
                if (!cell) {
                    cell = { t: 'n' };
                    hojaDashboardVoltaje[addr] = cell;
                }
                cell.v = parseFloat(valor);
                cell.t = 'n';
            }
        }
    };

    rellenarVoltajeEnDashboard(chiller1);
    rellenarVoltajeEnDashboard(chiller3);

    // --- Rellenar DASHBOARD CHILLER´S con datos nocturnos y diurnos ---
    const rellenarChillerDashboard = (chillerDatos) => {
        if (!chillerDatos) return;

        // Nocturno
        if (chillerDatos.nocturno) {
            for (let [id, valor] of Object.entries(chillerDatos.nocturno)) {
                if (mapaDashboardChiller[id] && valor !== '') {
                    const fila = mapaDashboardChiller[id];
                    const addr = `${colChillerLetra}${fila}`;
                    let cell = hojaDashboardChiller[addr];
                    if (!cell) {
                        cell = { t: 'n' };
                        hojaDashboardChiller[addr] = cell;
                    }
                    cell.v = parseFloat(valor);
                    cell.t = 'n';
                }
            }
        }

        // Diurno
        if (chillerDatos.diurno) {
            for (let [id, valor] of Object.entries(chillerDatos.diurno)) {
                if (mapaDashboardChiller[id] && valor !== '') {
                    const fila = mapaDashboardChiller[id];
                    const addr = `${colChillerLetra}${fila}`;
                    let cell = hojaDashboardChiller[addr];
                    if (!cell) {
                        cell = { t: 'n' };
                        hojaDashboardChiller[addr] = cell;
                    }
                    cell.v = parseFloat(valor);
                    cell.t = 'n';
                }
            }
        }
    };

    rellenarChillerDashboard(chiller1);
    rellenarChillerDashboard(chiller3);

    // --- Insertar fecha y hora en las celdas correspondientes de los dashboards ---
    const ahora = new Date();
    const fechaTexto = chiller1?.fecha || chiller3?.fecha || ahora.toISOString().split('T')[0];
    const horaTexto = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;

    // FECHA y HORA se escriben en la columna seleccionada (D..O / D..AJ)
    const addrFechaVoltaje = `${colVoltajeLetra}${FILA_FECHA_VOLTAJE}`;
    const addrHoraVoltaje = `${colVoltajeLetra}${FILA_HORA_VOLTAJE}`;

    hojaDashboardVoltaje[addrFechaVoltaje] = { t: 's', v: `FECHA: ${fechaTexto}` };
    hojaDashboardVoltaje[addrHoraVoltaje] = { t: 's', v: `HORA: ${horaTexto}` };

    const addrFechaChiller = `${colChillerLetra}${FILA_FECHA_CHILLER}`;
    const addrHoraChiller = `${colChillerLetra}${FILA_HORA_CHILLER}`;

    hojaDashboardChiller[addrFechaChiller] = { t: 's', v: `FECHA: ${fechaTexto}` };
    hojaDashboardChiller[addrHoraChiller] = { t: 's', v: `HORA: ${horaTexto}` };

    // --- Generar archivo Excel ---
    const wbout = XLSX.write(wb, { bookType: 'xls', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.ms-excel' });
}