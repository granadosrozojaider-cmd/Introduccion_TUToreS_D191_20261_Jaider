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
    const nomElem = document.getElementById('nombre');
    const corElem = document.getElementById('correo');
    const pasElem = document.getElementById('password');
    const rolElem = document.getElementById('rol');

    if (!nomElem || !corElem || !pasElem || !rolElem) {
        console.error("Error: Algunos IDs del formulario no existen en el HTML.");
        return;
    }

    const nombre = nomElem.value.trim();
    const correo = corElem.value.trim();
    const password = pasElem.value;
    const rol = rolElem.value;

    if (!nombre || !correo || !password) {
        return mostrarAlerta("Por favor, completa todos los campos", "warning");
    }

    if (password.length < 6) {
        return mostrarAlerta("La contraseña debe tener al menos 6 caracteres", "warning");
    }

    auth.createUserWithEmailAndPassword(correo, password)
        .then(userCredential => {
            const uid = userCredential.user.uid;
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
            } else {
                mostrarAlerta("Error: " + error.message, "danger");
            }
        });
}

/**
 * Función de inicio de sesión optimizada
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
            if (correo === "tutoadmin@tutorias.com" && password === "Tutohub23") {
                localStorage.setItem("uid", uid);
                localStorage.setItem("rol", "admin");
                window.location.href = "admin/dashboard_admin.html"; 
                return null; // Detiene la búsqueda en Firestore
            }

            // Consultar rol en Firestore para usuarios normales
            return db.collection("usuarios").doc(uid).get();
        })
        .then(doc => {
            if (doc === null) return; // Salir si ya es admin

            if (doc && doc.exists) {
                const datos = doc.data();
                localStorage.setItem("uid", datos.uid);
                localStorage.setItem("rol", datos.rol);
                
                // Redirección dinámica según el rol
                if (datos.rol === "tutor") {
                    window.location.href = "tutores/dashboard_tutor.html";
                } else if (datos.rol === "estudiante") {
                    window.location.href = "estudiantes/dashboard_estudiante.html";
                } else if (datos.rol === "admin") {
                    window.location.href = "admin/dashboard_admin.html";
                }
            } else if (doc) {
                mostrarAlerta("Perfil no encontrado en la base de datos", "danger");
            }
        })
        .catch(error => {
            if (error) {
                console.error("Error Auth:", error);
                mostrarAlerta("Correo o contraseña incorrectos", "danger");
            }
        });
}

/**
 * Función para cerrar sesión
 */
function logout() {
    auth.signOut().then(() => {
        localStorage.clear();
        const path = window.location.pathname;
        
        if (path.includes("/admin/") || path.includes("/tutores/") || path.includes("/estudiantes/")) {
            window.location.href = "../index.html";
        } else {
            window.location.href = "index.html";
        }
    }).catch(error => {
        console.error("Error logout:", error);
        window.location.reload();
    });
}