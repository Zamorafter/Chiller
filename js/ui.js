// ui.js
// Lógica de interfaz, guardado, redirección y finalización

let chillerActual = 1;
let registroActual = null;
let currentUser = getCurrentUser();

document.addEventListener('DOMContentLoaded', () => {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    chillerActual = parseInt(params.get('chiller')) || 1;
    document.getElementById('chiller-titulo').innerText = `Chiller ${chillerActual}`;

    const hoy = new Date().toISOString().split('T')[0];

    let existente = cargarRegistro(currentUser.username, hoy, chillerActual);
    if (existente) {
        registroActual = existente;
    } else {
        registroActual = crearRegistroVacio(currentUser.username, hoy, chillerActual);
    }

    renderizarFormularioVoltaje();
    renderizarFormularioNocturno();
    renderizarFormularioDiurno();

    cargarValoresEnFormularios();

    // Configurar el botón de acción según el estado del otro chiller
    configurarBotonAccion();

    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
});

function configurarBotonAccion() {
    const hoy = new Date().toISOString().split('T')[0];
    const otroChiller = chillerActual === 1 ? 3 : 1;
    const registroOtro = cargarRegistro(currentUser.username, hoy, otroChiller);
    const actionBtn = document.querySelector('.action-buttons button:last-child'); // El botón "Terminado" o "Siguiente"

    if (registroOtro && Object.keys(registroOtro.voltaje).length > 0) {
        // El otro chiller ya tiene datos, mostramos "Terminado"
        actionBtn.textContent = 'Terminado';
        actionBtn.onclick = terminarJornada;
    } else {
        // El otro chiller no tiene datos, mostramos "Siguiente"
        actionBtn.textContent = 'Siguiente';
        actionBtn.onclick = irAlSiguiente;
    }
}

function renderizarFormularioVoltaje() {
    const contenedor = document.getElementById('formVoltaje');
    contenedor.innerHTML = '';

    const momentos = chillerActual === 1 ? [
        '05:00 (OP)', '08:30 (F)', '11:00 (F)', '14:00 (OP)', '16:00 (F)', '18:00 (OP)',
        '19:00 (OP)', '20:00 (F)', '21:00 (F)', '22:00 (OP)', '23:00 (F)', '00:00 (OP)', '01:00 (OP)'
    ] : [
        '06:30 (OP)', '08:30 (F)', '11:00 (F)', '14:00 (OP)', '16:00 (F)', '18:00 (OP)',
        '19:00 (OP)', '20:00 (F)', '21:00 (F)', '22:00 (OP)', '23:00 (F)', '00:00 (OP)', '01:00 (OP)'
    ];

    momentos.forEach(momento => {
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
                <tbody id="tablaNocturnoBody">
                </tbody>
            </table>
        </div>
    `;

    const tbody = document.getElementById('tablaNocturnoBody');
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
            <label>Técnico Nocturno</label>
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
                <tbody id="tablaDiurnoBody">
                </tbody>
            </table>
        </div>
    `;

    const tbody = document.getElementById('tablaDiurnoBody');
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
        let tr = document.createElement('tr');
        let html = `
            <td>${fila[0]}</td>
            <td>${fila[1]}</td>
            <td>${fila[2]}</td>
        `;
        for (let h = 0; h < 16; h++) {
            const horaId = `diurno_${idx}_h${h}`;
            html += `<td><input type="number" step="0.1" id="${horaId}"></td>`;
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
            <label>Técnico Diurno</label>
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

    if (registroActual.voltaje) {
        Object.keys(registroActual.voltaje).forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = registroActual.voltaje[id];
        });
    }

    if (registroActual.nocturno) {
        Object.keys(registroActual.nocturno).forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = registroActual.nocturno[id];
        });
    }

    if (registroActual.diurno) {
        Object.keys(registroActual.diurno).forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = registroActual.diurno[id];
        });
    }
}

function irAlOtroChiller() {
    const otro = chillerActual === 1 ? 3 : 1;
    window.location.href = `chiller.html?chiller=${otro}`;
}

function guardarRegistroActual() {
    registroActual.voltaje = {};
    document.querySelectorAll('#formVoltaje input').forEach(input => {
        if (input.id) registroActual.voltaje[input.id] = input.value;
    });

    registroActual.nocturno = {};
    document.querySelectorAll('#formNocturno input').forEach(input => {
        if (input.id) registroActual.nocturno[input.id] = input.value;
    });

    registroActual.diurno = {};
    document.querySelectorAll('#formDiurno input').forEach(input => {
        if (input.id) registroActual.diurno[input.id] = input.value;
    });

    guardarRegistroEnDB(registroActual);
}

function irAlSiguiente() {
    guardarRegistroActual();
    alert('Registro guardado. Ahora ve al otro chiller.');
    irAlOtroChiller();
}

async function terminarJornada() {
    // Guardar el registro actual
    guardarRegistroActual();

    // Cargar el registro del otro chiller
    const hoy = new Date().toISOString().split('T')[0];
    const otroChiller = chillerActual === 1 ? 3 : 1;
    const registroOtro = cargarRegistro(currentUser.username, hoy, otroChiller);

    if (!registroOtro) {
        alert('No hay datos del otro chiller. Debes llenar ambos.');
        return;
    }

    // Combinar ambos registros en un solo objeto
    const datosCombinados = {
        chiller1: chillerActual === 1 ? registroActual : registroOtro,
        chiller3: chillerActual === 3 ? registroActual : registroOtro
    };

    // Generar Excel con la plantilla
    const blob = await generarExcel(datosCombinados);
    const nombreArchivo = `Chillers_${hoy}.xlsx`;

    if (navigator.canShare && navigator.canShare({ files: [new File([blob], nombreArchivo, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })] })) {
        try {
            await navigator.share({
                title: 'Registro de Chillers',
                text: 'Adjunto el registro completo de ambos chillers',
                files: [new File([blob], nombreArchivo, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })]
            });
            // Opcional: redirigir a main.html o login
            window.location.href = 'main.html';
        } catch (err) {
            console.error('Error al compartir:', err);
            descargarArchivo(blob, nombreArchivo);
            window.location.href = 'main.html';
        }
    } else {
        descargarArchivo(blob, nombreArchivo);
        alert('Archivo guardado. Por favor adjúntalo manualmente a un correo.');
        window.location.href = 'main.html';
    }
}

function guardarRegistroEnDB(registro) {
    let registros = JSON.parse(localStorage.getItem(REGISTROS_KEY)) || [];
    let index = registros.findIndex(r => 
        r.usuario === registro.usuario && 
        r.fecha === registro.fecha && 
        r.chiller === registro.chiller
    );
    if (index >= 0) {
        registros[index] = registro;
    } else {
        registros.push(registro);
    }
    localStorage.setItem(REGISTROS_KEY, JSON.stringify(registros));
}

function descargarArchivo(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
}
