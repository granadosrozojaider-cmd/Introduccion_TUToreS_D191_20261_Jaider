// ========================================
// FUNCIONES COMPARTIDAS / LIMPIEZA
// ========================================
function eliminarTutoriasPasadas() {
    const ahora = new Date().toISOString();
    db.collection("tutorias").where("fechaHora", "<", ahora).get().then(snap => {
        snap.forEach(doc => db.collection("tutorias").doc(doc.id).delete());
    });
}

// ========================================
// LÓGICA DEL TUTOR
// ========================================
function proponerTutoria() {
    const materia = document.getElementById("materiaPropuesta").value;
    const fecha = document.getElementById("fechaPropuesta").value;
    const horaInicio = document.getElementById("horaInicio").value;
    const horaFin = document.getElementById("horaFin").value;
    const uid = localStorage.getItem("uid");

    if (!materia || !fecha || !horaInicio || !horaFin) {
        return mostrarAlerta("Complete todos los campos", "warning");
    }

    const ahora = new Date();
    const fechaHoraInicio = new Date(fecha + "T" + horaInicio);
    const fechaHoraFin = new Date(fecha + "T" + horaFin);

    if (fechaHoraInicio < ahora) {
        return mostrarAlerta("No es posible: la fecha ya pasó", "danger");
    }

    const duracion = (fechaHoraFin - fechaHoraInicio) / 3600000;
    if (duracion <= 0) {
        return mostrarAlerta("La hora fin debe ser mayor a la de inicio", "danger");
    }

    db.collection("tutorias").add({
        materia: materia,
        fecha: fecha,
        horaInicio: horaInicio,
        horaFin: horaFin,
        fechaHora: fechaHoraInicio.toISOString(),
        duracion: duracion,
        tutor: uid,
        estado: "propuesta",
        estudiante: ""
    })
    .then(() => {
        mostrarAlerta("Tutoría publicada", "success");
        document.getElementById("materiaPropuesta").value = "";
    })
    .catch(error => mostrarAlerta("Error: " + error.message, "danger"));
}

function verMisTutorias() {
    const uid = localStorage.getItem("uid");
    db.collection("tutorias").where("tutor", "==", uid).onSnapshot(snapshot => {
        let html = "";
        snapshot.forEach(doc => {
            const t = doc.data();
            const dur = typeof t.duracion === 'number' ? t.duracion.toFixed(2) : t.duracion;
            html += `<tr>
                <td class="fw-bold text-success">${t.materia}</td>
                <td>${t.fecha}</td>
                <td>${t.horaInicio} - ${t.horaFin}</td>
                <td>${dur} h</td>
                <td><span class="badge bg-success">${t.estado}</span></td>
                <td><button class="btn btn-outline-danger btn-sm" onclick="eliminarMiTutoria('${doc.id}')">Eliminar</button></td>
            </tr>`;
        });
        document.getElementById("tablaMisTutorias").innerHTML = html || '<tr><td colspan="6" class="text-center">Sin tutorías.</td></tr>';
    });
}

function eliminarMiTutoria(id) {
    if (confirm("¿Eliminar?")) db.collection("tutorias").doc(id).delete();
}

// ========================================
// LÓGICA DEL ESTUDIANTE
// ========================================
function verTutoriasPropuestas() {
    const lista = document.getElementById("listaPropuestas");
    const contador = document.getElementById("totalDisponibles");

    db.collection("tutorias").where("estado", "==", "propuesta").onSnapshot(snapshot => {
        let html = "";
        let count = 0;
        const ahora = new Date().toISOString();

        snapshot.forEach(doc => {
            const t = doc.data();
            if (t.fechaHora >= ahora) {
                count++;
                html += `<tr>
                    <td class="fw-bold text-success">${t.materia}</td>
                    <td>${t.fecha}</td>
                    <td>${t.horaInicio} - ${t.horaFin}</td>
                    <td class="text-center"><button class="btn btn-success btn-sm" onclick="aceptarTutoria('${doc.id}')">Agendar</button></td>
                </tr>`;
            }
        });
        if(contador) contador.innerText = `${count} disponibles`;
        lista.innerHTML = html || '<tr><td colspan="4" class="text-center">No hay disponibles.</td></tr>';
    });
}

function verMisTutoriasAgendadas() {
    const uid = localStorage.getItem("uid");
    db.collection("tutorias").where("estudiante", "==", uid).where("estado", "==", "aceptada").onSnapshot(snapshot => {
        let html = "";
        snapshot.forEach(doc => {
            const t = doc.data();
            html += `<tr>
                <td class="fw-bold text-info">${t.materia}</td>
                <td>${t.fecha}</td>
                <td>${t.horaInicio} - ${t.horaFin}</td>
                <td class="text-center"><span class="badge bg-info">Agendada</span></td>
            </tr>`;
        });
        document.getElementById("misTutoriasAgendadas").innerHTML = html || '<tr><td colspan="4" class="text-center">No has agendado nada.</td></tr>';
    });
}

async function aceptarTutoria(id) {
    const uid = localStorage.getItem("uid");
    const docRef = await db.collection("tutorias").doc(id).get();
    const nueva = docRef.data();

    // Validación de choque de horario
    const agendadas = await db.collection("tutorias")
        .where("estudiante", "==", uid)
        .where("fecha", "==", nueva.fecha)
        .where("estado", "==", "aceptada").get();

    let choque = false;
    agendadas.forEach(doc => {
        const ag = doc.data();
        if (nueva.horaInicio < ag.horaFin && nueva.horaFin > ag.horaInicio) choque = true;
    });

    if (choque) return mostrarAlerta("Ya tienes una tutoría a esta misma hora.", "danger");

    db.collection("tutorias").doc(id).update({ estudiante: uid, estado: "aceptada" })
        .then(() => mostrarAlerta("Agendada con éxito", "success"));
}