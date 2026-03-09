const USERS_KEY = 'chiller_users';

function register(username, password, nombre) {
    let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    if (users.find(u => u.username === username)) {
        return false;
    }
    users.push({ username, password, nombre });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
}

function login(username, password) {
    let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
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