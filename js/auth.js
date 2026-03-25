function isDemoMode() {
    const host = window.location.hostname || '';
    return host.includes('github.io') || window.location.protocol === 'file:';
}

window.DEMO_MODE = isDemoMode();

function setSession(user) {
    sessionStorage.setItem('token', window.DEMO_MODE ? 'demo-token' : user.token);
    sessionStorage.setItem('currentUser', JSON.stringify(user.user || user));
}

async function register(username, password, nombre, apellido) {
    if (window.DEMO_MODE) {
        const user = {
            username,
            nombre,
            apellido
        };
        localStorage.setItem(`demo-user:${username}`, JSON.stringify({ username, password, nombre, apellido }));
        setSession(user);
        return { ok: true, demo: true };
    }

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

        setSession(data);
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err?.message ? `No se pudo registrar: ${err.message}` : 'No se pudo registrar' };
    }
}

async function login(username, password) {
    if (window.DEMO_MODE) {
        const raw = localStorage.getItem(`demo-user:${username}`);
        const stored = raw ? JSON.parse(raw) : { username, password, nombre: 'Demo', apellido: 'Visual' };
        if (stored.password && stored.password !== password) {
            return { ok: false, error: 'Contrasena incorrecta para la demo local' };
        }
        setSession(stored);
        return { ok: true, demo: true };
    }

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

        setSession(data);
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
