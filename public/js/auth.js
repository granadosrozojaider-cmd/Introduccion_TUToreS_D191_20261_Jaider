/**
 * Inicialización de servicios de Firebase
 * Se usa 'window.' para asegurar que las variables sean globales 
 * y accesibles desde cualquier parte del proyecto.
 */
const auth = window.auth || firebase.auth();
const db = window.db || firebase.firestore();

/**
 * Función para mostrar notificaciones tipo Toast de Bootstrap
 */
function mostrarAlerta(mensaje, tipo = "primary") {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'position-fixed top-0 end-0 p-3';
        container.style.zIndex = "1100";
        document.body.appendChild(container);
    }

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-bg-${tipo} border-0 mb-2 shadow`;
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${mensaje}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>`;
    
    container.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
    
    // Eliminar el elemento del DOM una vez se oculte para no saturar la memoria
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

/**
 * Función para registrar usuarios (Firebase Auth + Firestore)
 */
function registrar() {
    // Captura de datos
    const nomElem = document.getElementById('nombre');
    const corElem = document.getElementById('correo');
    const pasElem = document.getElementById('password');
    const rolElem = document.getElementById('rol');

    // Validación de existencia de elementos
    if (!nomElem || !corElem || !pasElem || !rolElem) {
        console.error("Error: Algunos IDs del formulario no existen en el HTML.");
        return;
    }

    const nombre = nomElem.value.trim();
    const correo = corElem.value.trim();
    const password = pasElem.value;
    const rol = rolElem.value;

    // Validaciones de contenido
    if (!nombre || !correo || !password) {
        return mostrarAlerta("Por favor, completa todos los campos", "warning");
    }

    if (password.length < 6) {
        return mostrarAlerta("La contraseña debe tener al menos 6 caracteres", "warning");
    }

    // 1. Crear usuario en Firebase Authentication
    auth.createUserWithEmailAndPassword(correo, password)
        .then(userCredential => {
            const uid = userCredential.user.uid;

            // 2. Guardar datos adicionales en Firestore usando el UID como nombre del documento
            return db.collection("usuarios").doc(uid).set({
                nombre: nombre,
                correo: correo,
                rol: rol,
                uid: uid,
                fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            mostrarAlerta("¡Cuenta creada con éxito! Redirigiendo...", "success");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);
        })
        .catch(error => {
            console.error("Error en registro:", error);
            if (error.code === 'auth/email-already-in-use') {
                mostrarAlerta("Este correo ya está registrado", "danger");
            } else if (error.code === 'auth/invalid-email') {
                mostrarAlerta("El formato del correo es inválido", "danger");
            } else {
                mostrarAlerta("Error: " + error.message, "danger");
            }
        });
}

/**
 * Función de inicio de sesión
 */
function login() {
    const corElem = document.getElementById("correo");
    const pasElem = document.getElementById("password");

    if (!corElem || !pasElem) return;

    const correo = corElem.value.trim();
    const password = pasElem.value;

    if (!correo || !password) {
        return mostrarAlerta("Por favor, ingrese sus credenciales", "warning");
    }

    auth.signInWithEmailAndPassword(correo, password)
        .then(userCredential => {
            const uid = userCredential.user.uid;
            
            // VALIDACIÓN DE ADMINISTRADOR ESPECÍFICO (HARDCODED)
            if (correo === "granadosrozojaider@gmail.com" && password === "Jaider23") {
                localStorage.setItem("uid", uid);
                localStorage.setItem("rol", "admin");
                window.location = "admin/dashboard_admin.html"; 
                return; 
            }

            // Consultar rol en Firestore para usuarios normales
            return db.collection("usuarios").doc(uid).get();
        })
        .then(doc => {
            if (!doc) return; // Evitar error si entró como admin hardcoded

            if (doc.exists) {
                const datos = doc.data();
                localStorage.setItem("uid", datos.uid);
                localStorage.setItem("rol", datos.rol);
                
                // Redirección dinámica según el rol
                if (datos.rol === "tutor") {
                    window.location = "tutores/dashboard_tutor.html";
                } else if (datos.rol === "estudiante") {
                    window.location = "estudiantes/dashboard_estudiante.html";
                } else if (datos.rol === "admin") {
                    window.location = "admin/dashboard_admin.html";
                }
            } else {
                mostrarAlerta("Perfil no encontrado en la base de datos", "danger");
            }
        })
        .catch(error => {
            console.error("Error Auth:", error);
            mostrarAlerta("Correo o contraseña incorrectos", "danger");
        });
}

/**
 * Función para cerrar sesión
 */
function logout() {
    auth.signOut().then(() => {
        localStorage.clear();
        const path = window.location.pathname;
        
        // Ajuste de ruta si el usuario está dentro de una subcarpeta
        if (path.includes("/admin/") || path.includes("/tutores/") || path.includes("/estudiantes/")) {
            window.location = "../index.html";
        } else {
            window.location = "index.html";
        }
    }).catch(error => {
        console.error("Error logout:", error);
        window.location.reload();
    });
}