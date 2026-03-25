function getToken() {
    return sessionStorage.getItem('token');
}

async function apiFetchJson(url, options = {}) {
    const token = getToken();
    const headers = Object.assign({}, options.headers || {});
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const resp = await fetch(url, Object.assign({}, options, { headers }));
    if (!resp.ok) {
        let msg = `HTTP ${resp.status}`;
        try {
            const data = await resp.json();
            msg = data?.error || msg;
        } catch {
            // ignore
        }
        throw new Error(msg);
    }
    return resp.json();
}

async function cargarRegistro(usuario, fecha, chiller) {
    // usuario se mantiene para compatibilidad, pero el servidor usa el token.
    const fechaStr = String(fecha);
    const chillerNo = Number(chiller);
    const url = `/api/registros?fecha=${encodeURIComponent(fechaStr)}&chiller=${encodeURIComponent(String(chillerNo))}`;
    const data = await apiFetchJson(url, { method: 'GET' });
    return data?.registro || null;
}

async function guardarRegistroEnDB(registro) {
    const body = {
        fecha: registro.fecha,
        chiller: registro.chiller,
        voltaje: registro.voltaje || {},
        nocturno: registro.nocturno || {},
        diurno: registro.diurno || {}
    };
    await apiFetchJson('/api/registros', {
        method: 'POST',
        body: JSON.stringify(body)
    });
}

function crearRegistroVacio(usuario, fecha, chiller) {
    return {
        usuario,
        fecha,
        chiller,
        terminado: false,
        voltaje: {},
        nocturno: {},
        diurno: {}
    };
}