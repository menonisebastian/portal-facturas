import { SESSION_KEY } from './config.js';
import { fetchFXRates, Cache } from './api.js';
import { initSidebar, handleRouting } from './ui/sidebar.js';
import { initTheme } from './ui/theme.js';
import { initUpload } from './ui/upload.js';
import { initChat, initChatAutoUnlock, openSession } from './ui/chat.js';

// --- 1. PROTECCIÓN DE RUTA (SPA) ---
if (!sessionStorage.getItem(SESSION_KEY)) {
    throw new Error("Acceso no autorizado: Deteniendo ejecución de app.js");
}

// --- 2. INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar componentes UI
    initSidebar();
    initTheme();
    initUpload();
    initChatAutoUnlock();

    // Determinar tema inicial
    const initialTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    initChat(initialTheme);

    // Manejar enrutamiento inicial
    handleRouting();

    // Carga de datos inicial en segundo plano
    setTimeout(() => {
        fetchFXRates();
        Cache.fetch().catch(() => {});
    }, 300);

    // Listener para el botón de abrir chat global
    document.getElementById('open-chat-btn')?.addEventListener('click', () => {
        const chatToggle = document.querySelector('.chat-window-toggle');
        if (chatToggle) chatToggle.click();
    });

    // Listener para nuevo chat
    document.getElementById('btn-new-chat-assistant')?.addEventListener('click', () => {
        const newSessionId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
        openSession(newSessionId);
    });
});

// Exponer openSession globalmente si es necesario para el HTML (aunque lo ideal es usar listeners)
window.openSession = openSession;
