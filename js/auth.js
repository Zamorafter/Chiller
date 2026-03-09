const USERS_KEY = 'chiller_users';

function register(nombre, apellido, password) {
    let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    // Crear un username único (ej. nombre.apellido)
    const username = `${nombre.toLowerCase()}.${apellido.toLowerCase()}`;
    if (users.find(u => u.username === username)) {
        alert('Ya existe un usuario con ese nombre y apellido');
        return false;
    }
    users.push({ 
        username, 
        nombre, 
        apellido, 
        password // En producción debería hashearse
    });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
}

function login(nombre, apellido, password) {
    let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    const username = `${nombre.toLowerCase()}.${apellido.toLowerCase()}`;
    let user = users.find(u => u.username === username && u.password === password);
    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        return true;
    }
    return false;
}

function cerrarSesion() {
    sessionStorage.removeItem('currentUser');
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser'));
}
