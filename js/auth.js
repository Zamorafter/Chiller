const USERS_KEY = 'chiller_users';

function register(nombre, apellido, password) {

    let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

    // Crear username automático
    const username = `${nombre.toLowerCase()}.${apellido.toLowerCase()}`;

    if (users.find(u => u.username === username)) {
        alert('Ya existe un usuario con ese nombre y apellido');
        return false;
    }

    const newUser = {
        username: username,
        nombre: nombre,
        apellido: apellido,
        password: password
    };

    users.push(newUser);

    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    return true;
}


function login(username, password) {

    let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

    let user = users.find(u =>
        u.username === username.toLowerCase() &&
        u.password === password
    );

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
