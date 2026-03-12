let listaTutorias = [];
let listaUsuarios = [];
let miGrafica = null; 

// CARGAR TUTORÍAS
function cargarTutoriasAdmin() {
    db.collection("tutorias").onSnapshot(snapshot => {
        listaTutorias = [];
        snapshot.forEach(doc => {
            let t = doc.data();
            t.id = doc.id;
            listaTutorias.push(t);
        });
        renderTutorias(listaTutorias);
        actualizarEstadisticasTutorias();
    });
}

// CARGAR USUARIOS
function cargarUsuariosAdmin() {
    db.collection("usuarios").onSnapshot(snapshot => {
        listaUsuarios = [];
        snapshot.forEach(doc => {
            let u = doc.data();
            u.id = doc.id;
            listaUsuarios.push(u);
        });
        renderUsuarios(listaUsuarios);
        actualizarEstadisticasUsuarios(); // Actualiza tarjetas y la gráfica de dona
    });
}

// RENDERIZADO DE TABLAS (Se mantienen tus funciones originales)
function renderTutorias(lista) {
    let tabla = "";
    lista.forEach(t => {
        tabla += `<tr>
            <td class="text-info fw-bold">${t.materia}</td>
            <td>${t.fecha}</td>
            <td><span class="badge ${getBadgeColor(t.estado)}">${t.estado.toUpperCase()}</span></td>
            <td><button class="btn btn-danger btn-sm" onclick="eliminarDoc('tutorias', '${t.id}')">Eliminar</button></td>
        </tr>`;
    });
    document.getElementById("tablaTutorias").innerHTML = tabla || '<tr><td colspan="4" class="text-center">No hay tutorías.</td></tr>';
}

function renderUsuarios(lista) {
    let tabla = "";
    lista.forEach(u => {
        tabla += `<tr>
            <td>${u.nombre || 'N/A'}</td>
            <td>${u.correo}</td>
            <td><span class="badge bg-secondary">${u.rol}</span></td>
            <td><button class="btn btn-danger btn-sm" onclick="eliminarDoc('usuarios', '${u.id}')">Eliminar</button></td>
        </tr>`;
    });
    document.getElementById("tablaUsuarios").innerHTML = tabla || '<tr><td colspan="4" class="text-center">No hay usuarios.</td></tr>';
}

// FUNCIONES DE BÚSQUEDA (Se mantienen exactamente como querías)
function buscarTutoria() {
    let texto = document.getElementById("buscarTutoria").value.toLowerCase();
    let filtradas = listaTutorias.filter(t => t.materia.toLowerCase().includes(texto) || t.estado.toLowerCase().includes(texto));
    renderTutorias(filtradas);
}

function buscarUsuario() {
    let texto = document.getElementById("buscarUsuario").value.toLowerCase();
    let filtrados = listaUsuarios.filter(u => (u.nombre || "").toLowerCase().includes(texto) || u.correo.toLowerCase().includes(texto));
    renderUsuarios(filtrados);
}

// ESTADÍSTICAS Y GRÁFICA COMPACTA
function actualizarEstadisticasUsuarios() {
    const estudiantes = listaUsuarios.filter(u => u.rol === "estudiante").length;
    const tutores = listaUsuarios.filter(u => u.rol === "tutor").length;

    document.getElementById("totalEstudiantes").innerText = estudiantes;
    document.getElementById("totalTutores").innerText = tutores;

    const ctx = document.getElementById('graficaUsuarios').getContext('2d');
    if (miGrafica) miGrafica.destroy();

    miGrafica = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Estudiantes', 'Tutores'],
            datasets: [{
                data: [estudiantes, tutores],
                backgroundColor: ['#198754', '#0dcaf0'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } }
        }
    });
}

function actualizarEstadisticasTutorias() {
    let stats = { total: listaTutorias.length, pendiente: 0, aceptada: 0, propuesta: 0 };
    listaTutorias.forEach(t => {
        if (stats.hasOwnProperty(t.estado)) stats[t.estado]++;
    });

    document.getElementById("totalTutorias").innerText = stats.total;
    document.getElementById("tutoriasPendientes").innerText = stats.pendiente;
    document.getElementById("tutoriasAceptadas").innerText = stats.aceptada;
    document.getElementById("tutoriasPropuestas").innerText = stats.propuesta;
}

// ELIMINACIÓN Y COLORES
function eliminarDoc(coleccion, id) {
    if (confirm("¿Seguro que desea eliminar este registro?")) {
        db.collection(coleccion).doc(id).delete()
            .then(() => mostrarAlerta("Eliminado correctamente", "success"))
            .catch(e => mostrarAlerta(e.message, "danger"));
    }
}

function getBadgeColor(estado) {
    switch (estado) {
        case 'aceptada': return 'bg-info';
        case 'propuesta': return 'bg-primary';
        case 'pendiente': return 'bg-warning text-dark';
        default: return 'bg-secondary';
    }
}