const USERS_KEY = 'chiller_users';

function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function register(username, password, nombre, apellido) {
    let users = getUsers();
    if (users.find(u => u.username === username)) {
        return false;
    }
    users.push({ username, password, nombre, apellido });
    saveUsers(users);
    return true;
}

function login(username, password) {
    let users = getUsers();
    let user = users.find(u => u.username === username && u.password === password);
    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        return true;
    }
    return false;
}

function logout() {
    sessionStorage.removeItem('currentUser');
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser'));
}