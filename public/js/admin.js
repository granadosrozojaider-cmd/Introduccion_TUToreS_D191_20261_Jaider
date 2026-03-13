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
            <td><span class="badge ${getBadgeColor(t.estado)}">${(t.estado || 'N/A').toUpperCase()}</span></td>
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
            <td><span class="badge bg-secondary">${(u.rol || 'N/A').toUpperCase()}</span></td>
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
        (t.materia || "").toLowerCase().includes(texto) || (t.estado || "").toLowerCase().includes(texto)
    );
    renderTutorias(filtradas);
}

function buscarUsuario() {
    let texto = document.getElementById("buscarUsuario").value.toLowerCase();
    let filtrados = listaUsuarios.filter(u => 
        (u.nombre || "").toLowerCase().includes(texto) || (u.correo || "").toLowerCase().includes(texto)
    );
    renderUsuarios(filtrados);
}

/**
 * ESTADÍSTICAS Y GRÁFICA (Chart.js)
 */
function actualizarEstadisticasUsuarios() {
    const estudiantes = listaUsuarios.filter(u => u.rol === "estudiante").length;
    const tutores = listaUsuarios.filter(u => u.rol === "tutor").length;

    if(document.getElementById("totalEstudiantes")) document.getElementById("totalEstudiantes").innerText = estudiantes;
    if(document.getElementById("totalTutores")) document.getElementById("totalTutores").innerText = tutores;

    const ctxElem = document.getElementById('graficaUsuarios');
    if (!ctxElem) return;

    const ctx = ctxElem.getContext('2d');
    if (miGrafica) miGrafica.destroy();

    miGrafica = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Estudiantes', 'Tutores'],
            datasets: [{
                data: [estudiantes, tutores],
                backgroundColor: ['#16a34a', '#0ea5e9'],
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
        let est = t.estado ? t.estado.toLowerCase() : '';
        if (stats.hasOwnProperty(est)) {
            stats[est]++;
        }
    });

    if(document.getElementById("totalTutorias")) document.getElementById("totalTutorias").innerText = stats.total;
    if(document.getElementById("tutoriasPendientes")) document.getElementById("tutoriasPendientes").innerText = stats.pendiente;
    if(document.getElementById("tutoriasAceptadas")) document.getElementById("tutoriasAceptadas").innerText = stats.aceptada;
    if(document.getElementById("tutoriasPropuestas")) document.getElementById("tutoriasPropuestas").innerText = stats.propuesta;
}

/**
 * ELIMINACIÓN EN CASCADA (BLINDADA)
 */
async function eliminarDoc(coleccion, id) {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: coleccion === 'usuarios' 
            ? "Se borrarán el usuario y todas sus tutorías asociadas permanentemente." 
            : "Este registro se eliminará permanentemente.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        background: '#0f172a',
        color: '#fff'
    });

    if (result.isConfirmed) {
        try {
            const batch = db.batch();
            const idLimpio = String(id).trim();

            if (coleccion === 'usuarios') {
                // USAMOS EL CAMPO "tutor" SEGÚN TU CAPTURA DE PANTALLA
                const tutoriasSnapshot = await db.collection("tutorias")
                    .where("tutor", "==", idLimpio)
                    .get();

                console.log(`DEBUG: Encontradas ${tutoriasSnapshot.size} tutorías para el tutor ${idLimpio}`);

                tutoriasSnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
            }

            // Borrar el documento principal
            const docRef = db.collection(coleccion).doc(idLimpio);
            batch.delete(docRef);

            await batch.commit();

            setTimeout(() => {
                Swal.fire({
                    title: 'Eliminado',
                    text: 'El proceso de borrado finalizó con éxito.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#0f172a',
                    color: '#fff'
                });
            }, 300);

        } catch (error) {
            console.error("Error crítico al eliminar:", error);
            Swal.fire({
                title: 'Error',
                text: error.message,
                icon: 'error',
                background: '#0f172a',
                color: '#fff'
            });
        }
    }
}

function getBadgeColor(estado) {
    if (!estado) return 'bg-secondary';
    switch (estado.toLowerCase()) {
        case 'aceptada': return 'bg-info';
        case 'propuesta': return 'bg-primary';
        case 'pendiente': return 'bg-warning text-dark';
        default: return 'bg-secondary';
    }
}

// Inicialización
cargarTutoriasAdmin();
cargarUsuariosAdmin();