let listaTutorias = [];
let listaUsuarios = [];
let miGrafica = null; 

/**
 * CARGA DE DATOS DESDE FIRESTORE (Real-time)
 */
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

function cargarUsuariosAdmin() {
    db.collection("usuarios").onSnapshot(snapshot => {
        listaUsuarios = [];
        snapshot.forEach(doc => {
            let u = doc.data();
            u.id = doc.id;
            listaUsuarios.push(u);
        });
        renderUsuarios(listaUsuarios);
        actualizarEstadisticasUsuarios();
    });
}

/**
 * RENDERIZADO DE TABLAS
 */
function renderTutorias(lista) {
    let tabla = "";
    lista.forEach(t => {
        tabla += `
        <tr>
            <td class="text-info fw-bold">${t.materia}</td>
            <td>${t.fecha}</td>
            <td><span class="badge ${getBadgeColor(t.estado)}">${t.estado.toUpperCase()}</span></td>
            <td class="text-center">
                <button class="btn btn-outline-danger btn-sm" onclick="eliminarDoc('tutorias', '${t.id}')">
                    Eliminar
                </button>
            </td>
        </tr>`;
    });
    document.getElementById("tablaTutorias").innerHTML = tabla || '<tr><td colspan="4" class="text-center text-muted">No hay tutorías registradas.</td></tr>';
}

function renderUsuarios(lista) {
    let tabla = "";
    lista.forEach(u => {
        tabla += `
        <tr>
            <td>${u.nombre || 'N/A'}</td>
            <td>${u.correo}</td>
            <td><span class="badge bg-secondary">${u.rol.toUpperCase()}</span></td>
            <td class="text-center">
                <button class="btn btn-outline-danger btn-sm" onclick="eliminarDoc('usuarios', '${u.id}')">
                    Eliminar
                </button>
            </td>
        </tr>`;
    });
    document.getElementById("tablaUsuarios").innerHTML = tabla || '<tr><td colspan="4" class="text-center text-muted">No hay usuarios registrados.</td></tr>';
}

/**
 * BÚSQUEDA Y FILTRADO
 */
function buscarTutoria() {
    let texto = document.getElementById("buscarTutoria").value.toLowerCase();
    let filtradas = listaTutorias.filter(t => 
        t.materia.toLowerCase().includes(texto) || t.estado.toLowerCase().includes(texto)
    );
    renderTutorias(filtradas);
}

function buscarUsuario() {
    let texto = document.getElementById("buscarUsuario").value.toLowerCase();
    let filtrados = listaUsuarios.filter(u => 
        (u.nombre || "").toLowerCase().includes(texto) || u.correo.toLowerCase().includes(texto)
    );
    renderUsuarios(filtrados);
}

/**
 * ESTADÍSTICAS Y GRÁFICA (Chart.js)
 */
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
                hoverOffset: 4,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#cbd5e1', padding: 20 } }
            }
        }
    });
}

function actualizarEstadisticasTutorias() {
    let stats = { total: listaTutorias.length, pendiente: 0, aceptada: 0, propuesta: 0 };
    listaTutorias.forEach(t => {
        if (stats.hasOwnProperty(t.estado.toLowerCase())) {
            stats[t.estado.toLowerCase()]++;
        }
    });

    document.getElementById("totalTutorias").innerText = stats.total;
    document.getElementById("tutoriasPendientes").innerText = stats.pendiente;
    document.getElementById("tutoriasAceptadas").innerText = stats.aceptada;
    document.getElementById("tutoriasPropuestas").innerText = stats.propuesta;
}

/**
 * ELIMINACIÓN CON SWEETALERT2
 */
function eliminarDoc(coleccion, id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Este registro se eliminará permanentemente del sistema.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: '#1e293b',
        color: '#fff'
    }).then((result) => {
        if (result.isConfirmed) {
            db.collection(coleccion).doc(id).delete()
                .then(() => {
                    Swal.fire({
                        title: 'Eliminado',
                        text: 'El registro ha sido borrado.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false,
                        background: '#1e293b',
                        color: '#fff'
                    });
                })
                .catch(error => {
                    Swal.fire('Error', error.message, 'error');
                });
        }
    });
}

function getBadgeColor(estado) {
    switch (estado.toLowerCase()) {
        case 'aceptada': return 'bg-info';
        case 'propuesta': return 'bg-primary';
        case 'pendiente': return 'bg-warning text-dark';
        default: return 'bg-secondary';
    }
}