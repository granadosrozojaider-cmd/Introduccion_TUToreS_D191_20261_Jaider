const firebaseConfig = {
  apiKey: "AIzaSyBf7Z81-4n24cQASvFTR0Q4KFkCojWEMxQ",
  authDomain: "tutorias-app-f7140.firebaseapp.com",
  projectId: "tutorias-app-f7140",
  storageBucket: "tutorias-app-f7140.firebasestorage.app",
  messagingSenderId: "1014623552110",
  appId: "1:1014623552110:web:2cfca96a74ae788b779c7f",
  measurementId: "G-C921MXZTCY"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Servicios (Cámbialos a window. para que auth.js los vea)
window.db = firebase.firestore();
window.auth = firebase.auth();

// Persistencia de sesión
window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
.then(() => {
    console.log("Sesión persistente activada");
})
.catch((error) => {
    console.error("Error de persistencia:", error);
});