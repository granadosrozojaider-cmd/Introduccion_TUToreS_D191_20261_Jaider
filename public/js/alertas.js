// =============================
// ALERTAS BOOTSTRAP DEL SISTEMA
// =============================

function mostrarAlerta(mensaje, tipo = "info") {

    const contenedor = document.getElementById("alertContainer")

    if (!contenedor) {
        console.error("No existe el contenedor de alertas")
        return
    }

    const alerta = document.createElement("div")

    alerta.className = `alert alert-${tipo} alert-dismissible fade show mt-2`
    alerta.role = "alert"

    alerta.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `

    contenedor.appendChild(alerta)

    // eliminar automáticamente después de 4 segundos
    setTimeout(() => {
        alerta.remove()
    }, 4000)
}



// =============================
// ALERTAS PREDEFINIDAS
// =============================

function alertaExito(mensaje) {
    mostrarAlerta(mensaje, "success")
}

function alertaError(mensaje) {
    mostrarAlerta(mensaje, "danger")
}

function alertaAdvertencia(mensaje) {
    mostrarAlerta(mensaje, "warning")
}

function alertaInfo(mensaje) {
    mostrarAlerta(mensaje, "info")
}