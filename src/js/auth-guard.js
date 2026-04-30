// ─────────────────────────────────────────────────────────────────
// auth-guard.js
// Añade este script como la PRIMERA etiqueta <script> en index.html:
//   <script src="auth-guard.js"></script>
//
// Se ejecuta de forma SÍNCRONA antes de que cargue cualquier cosa,
// redirigiendo al login si no hay sesión válida.
// ─────────────────────────────────────────────────────────────────

(function () {
    const SESSION_KEY = 'sp_portal_auth';
    const LOGIN_PAGE  = '/login.html';

    function isAuthenticated() {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            if (!raw) return false;
            const session = JSON.parse(raw);
            if (session.valid && Date.now() < session.expiresAt) return true;
            // Sesión expirada → limpiar
            sessionStorage.removeItem(SESSION_KEY);
            return false;
        } catch {
            return false;
        }
    }

    if (!isAuthenticated()) {
        // Detener rendering y redirigir inmediatamente
        document.documentElement.style.display = 'none';
        window.location.replace(LOGIN_PAGE);
    }

    // Exponer función de logout globalmente
    window.spLogout = function () {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.replace(LOGIN_PAGE);
    };
})();
