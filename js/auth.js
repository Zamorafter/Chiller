async function register(username, password, nombre, apellido) {
    try {
        const resp = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                password,
                nombre,
                apellido
            })
        });

        const data = await resp.json().catch(() => null);
        if (!resp.ok) {
            if (data?.error) return { ok: false, error: data.error };
            // fallback: leer texto por si el backend devolvió algo no-JSON
            const txt = await resp.text().catch(() => '');
            const extra = txt ? `: ${txt.slice(0, 300)}` : '';
            return { ok: false, error: `Error HTTP ${resp.status}${extra}` };
        }

        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('currentUser', JSON.stringify(data.user));
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err?.message ? `No se pudo registrar: ${err.message}` : 'No se pudo registrar' };
    }
}

async function login(username, password) {
    try {
        const resp = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                password
            })
        });

        const data = await resp.json().catch(() => null);
        if (!resp.ok) {
            if (data?.error) return { ok: false, error: data.error };
            const txt = await resp.text().catch(() => '');
            const extra = txt ? `: ${txt.slice(0, 300)}` : '';
            return { ok: false, error: `Error HTTP ${resp.status}${extra}` };
        }

        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('currentUser', JSON.stringify(data.user));
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err?.message ? `No se pudo iniciar sesión: ${err.message}` : 'No se pudo iniciar sesión' };
    }
}

function logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('currentUser');
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser'));
}