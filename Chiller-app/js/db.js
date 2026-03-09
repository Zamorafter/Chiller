const REGISTROS_KEY = 'chiller_registros';

function guardarRegistro(registro) {
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

function cargarRegistro(usuario, fecha, chiller) {
    let registros = JSON.parse(localStorage.getItem(REGISTROS_KEY)) || [];
    return registros.find(r => 
        r.usuario === usuario && 
        r.fecha === fecha && 
        r.chiller === chiller
    );
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