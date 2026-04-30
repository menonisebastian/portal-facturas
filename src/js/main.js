import { fetchFXRates, Cache } from './api.js';
import { initSidebar, handleRouting, showSection } from './ui/sidebar.js';
import { filterInvoices } from './ui/invoices.js';
import { initTheme } from './ui/theme.js';
import { initUpload } from './ui/upload.js';
import { initChat, initChatAutoUnlock, openSession } from './ui/chat.js';

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ main.js: DOMContentLoaded');

    try {
        // 1. Componentes críticos (navegación, tema, upload)
        initSidebar();
        initTheme();
        initUpload();
        console.log('✅ main.js: Sidebar, Theme, Upload inicializados');

        // 2. Enrutamiento
        handleRouting();
        console.log('✅ main.js: Routing configurado');

        // 3. Chat (no-blocking - puede fallar sin afectar al resto)
        initChatAutoUnlock();
        const initialTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        initChat(initialTheme).catch(err => {
            console.warn('⚠️ Chat no pudo inicializarse:', err);
        });

        // 4. Carga de datos en segundo plano
        setTimeout(() => {
            fetchFXRates();
            Cache.fetch().catch(() => {});
        }, 300);

        // 5. Listener para el botón de abrir chat global
        document.getElementById('open-chat-btn')?.addEventListener('click', () => {
            const chatToggle = document.querySelector('.chat-window-toggle');
            if (chatToggle) chatToggle.click();
        });

        // 6. Listener para nuevo chat
        document.getElementById('btn-new-chat-assistant')?.addEventListener('click', () => {
            const newSessionId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
            openSession(newSessionId);
        });

        // 7. Buscador: al pulsar → ir a Facturas, al escribir → filtrar tabla
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('focus', () => {
                showSection('invoices');
            });
            searchInput.addEventListener('input', () => {
                filterInvoices(searchInput.value);
            });
        }

    } catch (err) {
        console.error('❌ main.js: Error crítico durante la inicialización:', err);
    }
});

// Exponer openSession globalmente
window.openSession = openSession;
