let chillerActual = 1;
let registroActual = null;
let currentUser = getCurrentUser();
let pendientesActuales = [];
let excelTargetFileHandle = null;

const NOMBRE_EXCEL = 'Copia de 01-Check List - Control valores chillers i.xls';
const HORAS_DIURNO = [
    '05:00', '07:30', '08:30', '10:00', '11:00', '14:00', '16:00', '18:00',
    '06:30', '07:30', '08:30', '10:00', '11:00', '14:00', '16:00', '18:00'
];
const ITEMS_FILAS = [
    'Temp. Salida',
    'Temp. Retorno',
    'P. Del Evaporador',
    'T. de Saturacion',
    'Temp. Retorno (Condensador)',
    'Temp. Salida (Condensador)',
    'Temp. de Saturacion (Condensador)',
    'P. en Condensador',
    'Temperatura descarga',
    'Sobrecalentamiento descarga',
    '% de limite de corriente motor',
    'Temperatura de aceite',
    'Presion de aceite',
    'SURGE'
];

function formatLocalDateYMD(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

async function seleccionarArchivoExcelParaActualizar() {
    try {
        if (!('showSaveFilePicker' in window) && !('showOpenFilePicker' in window)) return false;

        const quiere = confirm('Para guardar los cambios en el mismo Excel en este dispositivo, elige el archivo Excel o confirma donde se guardara.');
        if (!quiere) return false;

        if ('showSaveFilePicker' in window) {
            excelTargetFileHandle = await window.showSaveFilePicker({
                suggestedName: NOMBRE_EXCEL,
                types: [
                    {
                        description: 'Excel',
                        accept: {
                            'application/vnd.ms-excel': ['.xls']
                        }
                    }
                ]
            });
            return true;
        }

        if ('showOpenFilePicker' in window) {
            const handles = await window.showOpenFilePicker({
                multiple: false,
                types: [
                    {
                        description: 'Excel',
                        accept: {
                            'application/vnd.ms-excel': ['.xls']
                        }
                    }
                ]
            });
            if (handles && handles.length) {
                excelTargetFileHandle = handles[0];
                return true;
            }
        }
    } catch (_error) {
        return false;
    }

    return false;
}

async function actualizarExcelEnArchivoLocal(blob) {
    if (!excelTargetFileHandle) {
        const ok = await seleccionarArchivoExcelParaActualizar();
        if (!ok) return false;
    }

    if (!excelTargetFileHandle || typeof excelTargetFileHandle.createWritable !== 'function') return false;

    try {
        const buffer = await blob.arrayBuffer();
        const writable = await excelTargetFileHandle.createWritable();
        await writable.write(buffer);
        await writable.close();
        return true;
    } catch (_error) {
        return false;
    }
}

function getTabFromInput(input) {
    const form = input.closest('form');
    if (!form) return 'voltaje';
    if (form.id === 'formVoltaje') return 'voltaje';
    if (form.id === 'formNocturno') return 'nocturno';
    if (form.id === 'formDiurno') return 'diurno';
    return 'voltaje';
}

function activarTab(tabId) {
    document.querySelectorAll('.tab-button').forEach((button) => button.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((content) => content.classList.remove('active'));

    const button = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
    const content = document.getElementById(tabId);
    if (button) button.classList.add('active');
    if (content) content.classList.add('active');
}

function limpiarErroresValidacion() {
    document.querySelectorAll('.input-error').forEach((input) => input.classList.remove('input-error'));
    pendientesActuales = [];
}

function humanizarCampo(input) {
    const id = input.id || '';

    if (id.startsWith('v_ch')) {
        const match = id.match(/^v_ch(\d)_(.+)_(l12|l23|l31)$/);
        if (match) {
            const ch = match[1];
            const rawMoment = match[2].replace(/_+/g, ' ').trim();
            const phase = match[3] === 'l12' ? 'V L1-2' : match[3] === 'l23' ? 'V L2-3' : 'V L3-1';
            return { titulo: `Voltaje - Chiller ${ch} - ${rawMoment}`, detalle: phase };
        }
        return { titulo: 'Voltaje', detalle: id };
    }

    if (id.startsWith('noct_')) {
        const match = id.match(/^noct_(\d+)_(19h|20h|21h|22h|23h|00h)$/);
        if (match) {
            const idx = Number(match[1]);
            const hour = match[2].replace('h', ':00');
            return { titulo: `Nocturno - ${hour}`, detalle: ITEMS_FILAS[idx] || `Item ${idx + 1}` };
        }
        return { titulo: 'Nocturno', detalle: id };
    }

    if (id.startsWith('diurno_')) {
        const match = id.match(/^diurno_(\d+)_h(\d+)$/);
        if (match) {
            const idx = Number(match[1]);
            const h = Number(match[2]);
            return { titulo: `Diurno - ${HORAS_DIURNO[h] || `h${h}`}`, detalle: ITEMS_FILAS[idx] || `Item ${idx + 1}` };
        }
        return { titulo: 'Diurno', detalle: id };
    }

    if (id === 'op_nocturno') return { titulo: 'Voltaje', detalle: 'Operador nocturno' };
    if (id === 'hora_apagado_1') return { titulo: 'Voltaje', detalle: 'Hora apagado Chiller #1' };
    if (id === 'hora_apagado_3') return { titulo: 'Voltaje', detalle: 'Hora apagado Chiller #3' };
    if (id === 'temp_amb_noct') return { titulo: 'Nocturno', detalle: 'Temperatura ambiente' };
    if (id === 'temp_amb_diurno') return { titulo: 'Diurno', detalle: 'Temperatura ambiente' };
    if (id === 'tec_noct') return { titulo: 'Nocturno', detalle: 'Tecnico nocturno' };
    if (id === 'tec_diurno') return { titulo: 'Diurno', detalle: 'Tecnico diurno' };
    if (id === 'elab_noct') return { titulo: 'Nocturno', detalle: 'Elaborado por' };
    if (id === 'elab_diurno') return { titulo: 'Diurno', detalle: 'Elaborado por' };
    if (id === 'sup_noct') return { titulo: 'Nocturno', detalle: 'Supervisor' };
    if (id === 'sup_diurno') return { titulo: 'Diurno', detalle: 'Supervisor' };
    if (id.startsWith('obs_')) return { titulo: 'Observaciones', detalle: 'Opcional' };

    return { titulo: 'Campo', detalle: id || 'sin id' };
}

function obtenerCamposPendientes() {
    const inputs = document.querySelectorAll('#formVoltaje input, #formNocturno input, #formDiurno input');
    const pendientes = [];

    for (const input of inputs) {
        if (!input.id || input.id.startsWith('obs_')) continue;
        const value = (input.value ?? '').toString().trim();
        if (value !== '') continue;

        pendientes.push({
            el: input,
            tab: getTabFromInput(input),
            texto: humanizarCampo(input)
        });
    }

    return pendientes;
}

function actualizarBannerPendientes(pendientes) {
    const banner = document.getElementById('pendingBanner');
    const text = document.getElementById('pendingBannerText');
    if (!banner || !text) return;

    if (!pendientes.length) {
        banner.hidden = true;
        text.textContent = 'Puedes guardar y exportar igual; los espacios vacios quedaran en blanco en el Excel.';
        return;
    }

    banner.hidden = false;
    text.textContent = `Hay ${pendientes.length} campo(s) pendiente(s). Puedes guardar y exportar igual; el Excel dejara esas celdas en blanco.`;
}

function abrirModalValidacion(pendientes) {
    const overlay = document.getElementById('modalValidacion');
    const list = document.getElementById('modalLista');
    if (!overlay || !list) return;

    list.innerHTML = '';
    pendientes.forEach((pendiente, index) => {
        const div = document.createElement('div');
        div.className = 'modal-item';
        div.innerHTML = `
            <div class="modal-badge">${index + 1}</div>
            <div>
                <strong>${pendiente.texto.titulo}</strong>
                <small>${pendiente.texto.detalle}</small>
            </div>
        `;
        div.addEventListener('click', () => {
            cerrarModalValidacion();
            enfocarPendiente(pendiente);
        });
        list.appendChild(div);
    });

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
}

function cerrarModalValidacion() {
    const overlay = document.getElementById('modalValidacion');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
}

function enfocarPendiente(pendiente) {
    if (!pendiente?.el) return;
    activarTab(pendiente.tab);
    pendiente.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => pendiente.el.focus({ preventScroll: true }), 250);
}

function irAlPrimerPendiente() {
    if (!pendientesActuales.length) return;
    cerrarModalValidacion();
    enfocarPendiente(pendientesActuales[0]);
}

function abrirPendientesDesdeBanner() {
    const pendientes = actualizarPendientesVisuales({ abrirModal: false });
    if (pendientes.length) abrirModalValidacion(pendientes);
}

function actualizarPendientesVisuales({ abrirModal = false } = {}) {
    limpiarErroresValidacion();
    const pendientes = obtenerCamposPendientes();
    pendientesActuales = pendientes;

    pendientes.forEach((pendiente) => {
        pendiente.el.classList.add('input-error');
    });

    actualizarBannerPendientes(pendientes);

    if (abrirModal && pendientes.length) {
        abrirModalValidacion(pendientes);
    }

    return pendientes;
}

function enlazarActualizacionPendientes() {
    document.querySelectorAll('#formVoltaje input, #formNocturno input, #formDiurno input').forEach((input) => {
        const refresh = () => actualizarPendientesVisuales({ abrirModal: false });
        input.addEventListener('input', refresh);
        input.addEventListener('change', refresh);
    });
}

async function configurarBotonAccion() {
    const hoy = formatLocalDateYMD(new Date());
    const otroChiller = chillerActual === 1 ? 3 : 1;
    const registroOtro = await cargarRegistro(currentUser.username, hoy, otroChiller);
    const actionBtn = document.getElementById('btnAccionFinal');
    const cambiarBtn = document.getElementById('btnCambiarChiller');

    if (cambiarBtn) {
        cambiarBtn.textContent = `Ir a Chiller ${otroChiller}`;
        cambiarBtn.onclick = irAlOtroChiller;
    }

    if (registroOtro && Object.keys(registroOtro.voltaje || {}).length > 0) {
        actionBtn.textContent = 'Terminado';
        actionBtn.onclick = terminarJornada;
    } else {
        actionBtn.textContent = 'Siguiente';
        actionBtn.onclick = irAlSiguiente;
    }
}

function renderizarFormularioVoltaje() {
    const contenedor = document.getElementById('formVoltaje');
    contenedor.innerHTML = '';

    const momentos = chillerActual === 1
        ? ['05:00 (OP)', '08:30 (F)', '11:00 (F)', '14:00 (OP)', '16:00 (F)', '18:00 (OP)', '19:00 (OP)', '20:00 (F)', '21:00 (F)', '22:00 (OP)', '23:00 (F)', '00:00 (OP)', '01:00 (OP)']
        : ['06:30 (OP)', '08:30 (F)', '11:00 (F)', '14:00 (OP)', '16:00 (F)', '18:00 (OP)', '19:00 (OP)', '20:00 (F)', '21:00 (F)', '22:00 (OP)', '23:00 (F)', '00:00 (OP)', '01:00 (OP)'];

    momentos.forEach((momento) => {
        const idBase = `v_ch${chillerActual}_${momento.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const div = document.createElement('div');
        div.className = 'grid-form';
        div.innerHTML = `
            <h4>${momento}</h4>
            <div class="form-group">
                <label>V L1-2</label>
                <input type="number" step="0.1" id="${idBase}_l12">
            </div>
            <div class="form-group">
                <label>V L2-3</label>
                <input type="number" step="0.1" id="${idBase}_l23">
            </div>
            <div class="form-group">
                <label>V L3-1</label>
                <input type="number" step="0.1" id="${idBase}_l31">
            </div>
        `;
        contenedor.appendChild(div);
    });

    const extras = document.createElement('div');
    extras.className = 'grid-form';
    extras.innerHTML = `
        <div class="form-group">
            <label>Observaciones</label>
            <input type="text" id="obs_voltaje">
        </div>
        <div class="form-group">
            <label>Operador nocturno</label>
            <input type="text" id="op_nocturno">
        </div>
        <div class="form-group">
            <label>Hora apagado Chiller #1</label>
            <input type="time" id="hora_apagado_1">
        </div>
        <div class="form-group">
            <label>Hora apagado Chiller #3</label>
            <input type="time" id="hora_apagado_3">
        </div>
    `;
    contenedor.appendChild(extras);

    const opInput = document.getElementById('op_nocturno');
    if (opInput && currentUser?.username) {
        opInput.value = currentUser.username;
        opInput.readOnly = true;
    }
}

function renderizarFormularioNocturno() {
    const contenedor = document.getElementById('formNocturno');
    contenedor.innerHTML = `
        <div class="horizontal-table">
            <table>
                <thead>
                    <tr>
                        <th>Componente</th>
                        <th>Item</th>
                        <th>UND</th>
                        <th>19:00</th>
                        <th>20:00</th>
                        <th>21:00</th>
                        <th>22:00</th>
                        <th>23:00</th>
                        <th>00:00</th>
                    </tr>
                </thead>
                <tbody id="tablaNocturnoBody"></tbody>
            </table>
        </div>
    `;

    const tbody = document.getElementById('tablaNocturnoBody');
    const filas = [
        ['EVAPORADOR', 'Temp. Salida', 'F'],
        ['', 'Temp. Retorno', 'F'],
        ['', 'P. Del Evaporador', 'PSI'],
        ['', 'T. de Saturacion', 'F'],
        ['CONDENSADOR', 'Temp. Retorno', 'F'],
        ['', 'Temp. Salida', 'F'],
        ['', 'Temp. de Saturacion', 'F'],
        ['', 'P. en Condensador', 'PSI'],
        ['COMPRESOR', 'Temperatura descarga', 'F'],
        ['', 'Sobrecalentamiento descarga', 'F'],
        ['', '% de limite de corriente motor', '%'],
        ['', 'Temperatura de aceite', 'F'],
        ['', 'Presion de aceite', 'PSIG'],
        ['', 'SURGE', '-']
    ];

    filas.forEach((fila, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${fila[0]}</td>
            <td>${fila[1]}</td>
            <td>${fila[2]}</td>
            <td><input type="number" step="0.1" id="noct_${idx}_19h"></td>
            <td><input type="number" step="0.1" id="noct_${idx}_20h"></td>
            <td><input type="number" step="0.1" id="noct_${idx}_21h"></td>
            <td><input type="number" step="0.1" id="noct_${idx}_22h"></td>
            <td><input type="number" step="0.1" id="noct_${idx}_23h"></td>
            <td><input type="number" step="0.1" id="noct_${idx}_00h"></td>
        `;
        tbody.appendChild(tr);
    });

    const extras = document.createElement('div');
    extras.className = 'grid-form';
    extras.innerHTML = `
        <div class="form-group">
            <label>Temperatura Ambiente</label>
            <input type="number" step="0.1" id="temp_amb_noct">
        </div>
        <div class="form-group">
            <label>Observaciones</label>
            <input type="text" id="obs_noct">
        </div>
        <div class="form-group">
            <label>Tecnico Nocturno</label>
            <input type="text" id="tec_noct">
        </div>
        <div class="form-group">
            <label>Elaborado por</label>
            <input type="text" id="elab_noct">
        </div>
        <div class="form-group">
            <label>Supervisor</label>
            <input type="text" id="sup_noct">
        </div>
    `;
    contenedor.appendChild(extras);
}

function renderizarFormularioDiurno() {
    const contenedor = document.getElementById('formDiurno');
    contenedor.innerHTML = `
        <div class="horizontal-table">
            <table>
                <thead>
                    <tr>
                        <th>Componente</th>
                        <th>Item</th>
                        <th>UND</th>
                        <th>05:00 (OP)</th>
                        <th>07:30 (OP)</th>
                        <th>08:30 (F)</th>
                        <th>10:00 (F)</th>
                        <th>11:00 (F)</th>
                        <th>14:00 (OP)</th>
                        <th>16:00 (F)</th>
                        <th>18:00 (OP)</th>
                        <th>06:30 (OP)</th>
                        <th>07:30 (OP)</th>
                        <th>08:30 (F)</th>
                        <th>10:00 (F)</th>
                        <th>11:00 (F)</th>
                        <th>14:00 (OP)</th>
                        <th>16:00 (F)</th>
                        <th>18:00 (OP)</th>
                    </tr>
                </thead>
                <tbody id="tablaDiurnoBody"></tbody>
            </table>
        </div>
    `;

    const tbody = document.getElementById('tablaDiurnoBody');
    const filas = [
        ['EVAPORADOR', 'Temp. Salida', 'F'],
        ['', 'Temp. Retorno', 'F'],
        ['', 'P. Del Evaporador', 'PSI'],
        ['', 'T. de Saturacion', 'F'],
        ['CONDENSADOR', 'Temp. Retorno', 'F'],
        ['', 'Temp. Salida', 'F'],
        ['', 'Temp. de Saturacion', 'F'],
        ['', 'P. en Condensador', 'PSI'],
        ['COMPRESOR', 'Temperatura descarga', 'F'],
        ['', 'Sobrecalentamiento descarga', 'F'],
        ['', '% de limite de corriente motor', '%'],
        ['', 'Temperatura de aceite', 'F'],
        ['', 'Presion de aceite', 'PSIG'],
        ['', 'SURGE', '-']
    ];

    filas.forEach((fila, idx) => {
        const tr = document.createElement('tr');
        let html = `
            <td>${fila[0]}</td>
            <td>${fila[1]}</td>
            <td>${fila[2]}</td>
        `;
        for (let h = 0; h < 16; h += 1) {
            html += `<td><input type="number" step="0.1" id="diurno_${idx}_h${h}"></td>`;
        }
        tr.innerHTML = html;
        tbody.appendChild(tr);
    });

    const extras = document.createElement('div');
    extras.className = 'grid-form';
    extras.innerHTML = `
        <div class="form-group">
            <label>Temperatura Ambiente</label>
            <input type="number" step="0.1" id="temp_amb_diurno">
        </div>
        <div class="form-group">
            <label>Observaciones</label>
            <input type="text" id="obs_diurno">
        </div>
        <div class="form-group">
            <label>Tecnico Diurno</label>
            <input type="text" id="tec_diurno">
        </div>
        <div class="form-group">
            <label>Elaborado por</label>
            <input type="text" id="elab_diurno">
        </div>
        <div class="form-group">
            <label>Supervisor</label>
            <input type="text" id="sup_diurno">
        </div>
    `;
    contenedor.appendChild(extras);
}

function cargarValoresEnFormularios() {
    if (!registroActual) return;

    ['voltaje', 'nocturno', 'diurno'].forEach((seccion) => {
        Object.keys(registroActual[seccion] || {}).forEach((id) => {
            const input = document.getElementById(id);
            if (input) input.value = registroActual[seccion][id];
        });
    });
}

function recolectarFormulario(selector) {
    const data = {};
    document.querySelectorAll(`${selector} input`).forEach((input) => {
        if (input.id) data[input.id] = input.value ?? '';
    });
    return data;
}

function contarPendientes() {
    return actualizarPendientesVisuales({ abrirModal: false }).length;
}

function construirMensajeGuardado(base) {
    const faltantes = contarPendientes();
    if (!faltantes) return base;
    return `${base} Hay ${faltantes} campo(s) sin llenar; se marcaron en pantalla y quedaran vacios en el Excel.`;
}

async function guardarRegistroActual() {
    registroActual.voltaje = recolectarFormulario('#formVoltaje');
    registroActual.nocturno = recolectarFormulario('#formNocturno');
    registroActual.diurno = recolectarFormulario('#formDiurno');
    await guardarRegistroEnDB(registroActual);
}

function irAlOtroChiller() {
    const otro = chillerActual === 1 ? 3 : 1;
    window.location.href = `chiller.html?chiller=${otro}`;
}

async function guardarRegistro() {
    actualizarPendientesVisuales({ abrirModal: true });
    try {
        await guardarRegistroActual();
        alert(construirMensajeGuardado('Registro guardado correctamente.'));
    } catch (err) {
        console.error(err);
        alert('Error al guardar el registro.');
    }
}

async function irAlSiguiente() {
    actualizarPendientesVisuales({ abrirModal: true });
    try {
        await guardarRegistroActual();
        alert(construirMensajeGuardado('Registro guardado. Ahora ve al otro chiller.'));
        irAlOtroChiller();
    } catch (err) {
        console.error(err);
        alert('Error al guardar. Revisa los datos e intentalo de nuevo.');
    }
}

async function terminarJornada() {
    actualizarPendientesVisuales({ abrirModal: true });

    try {
        await guardarRegistroActual();
    } catch (err) {
        console.error(err);
        alert('Error al guardar el registro antes de finalizar.');
        return;
    }

    const hoy = formatLocalDateYMD(new Date());
    const token = sessionStorage.getItem('token');
    if (!token) {
        alert('Sesion expirada. Inicia sesion nuevamente.');
        window.location.href = 'login.html';
        return;
    }

    let resp;
    try {
        resp = await fetch('/api/terminar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ fecha: hoy })
        });
    } catch (err) {
        console.error(err);
        alert('No se pudo conectar al servidor para generar el Excel.');
        return;
    }

    if (!resp.ok) {
        let msg = `Error al generar el Excel (HTTP ${resp.status})`;
        try {
            const data = await resp.json();
            if (data?.error) msg = data.error;
            if (data?.falta) {
                const falta = data.falta;
                msg += `; falta: chiller1=${falta.chiller1 ? 'SI' : 'NO'}, chiller3=${falta.chiller3 ? 'SI' : 'NO'}`;
            }
        } catch {
            const txt = await resp.text().catch(() => '');
            if (txt) msg += `: ${txt.slice(0, 300)}`;
        }
        alert(msg);
        return;
    }

    const blob = await resp.blob();
    if (!blob || !blob.size) {
        alert('El servidor devolvio un Excel vacio.');
        return;
    }

    const mensajeFinal = construirMensajeGuardado('Jornada finalizada.');
    const file = new File([blob], NOMBRE_EXCEL, { type: 'application/vnd.ms-excel' });

    const actualizadoLocal = await actualizarExcelEnArchivoLocal(blob);
    if (actualizadoLocal) {
        limpiarRegistrosDiaActual();
        alert(`${mensajeFinal} Excel actualizado en este dispositivo.`);
        window.location.href = 'main.html';
        return;
    }

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: 'Registro de Chillers',
                text: 'Adjunto el registro completo de ambos chillers',
                files: [file]
            });
            limpiarRegistrosDiaActual();
            alert(`${mensajeFinal} El archivo fue compartido.`);
            window.location.href = 'main.html';
            return;
        } catch (err) {
            console.error('Error al compartir:', err);
        }
    }

    descargarArchivo(blob, NOMBRE_EXCEL);
    limpiarRegistrosDiaActual();
    alert(`${mensajeFinal} El archivo se descargo en este dispositivo.`);
    window.location.href = 'main.html';
}

function limpiarRegistrosDiaActual() {
    registroActual = null;
}

function descargarArchivo(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    chillerActual = parseInt(params.get('chiller'), 10) || 1;
    document.getElementById('chiller-titulo').innerText = `Chiller ${chillerActual}`;

    const hoy = formatLocalDateYMD(new Date());
    const existente = await cargarRegistro(currentUser.username, hoy, chillerActual);
    registroActual = existente || crearRegistroVacio(currentUser.username, hoy, chillerActual);

    renderizarFormularioVoltaje();
    renderizarFormularioNocturno();
    renderizarFormularioDiurno();
    cargarValoresEnFormularios();
    enlazarActualizacionPendientes();
    actualizarPendientesVisuales({ abrirModal: false });
    await configurarBotonAccion();

    document.querySelectorAll('.tab-button').forEach((btn) => {
        btn.addEventListener('click', () => activarTab(btn.dataset.tab));
    });
});
