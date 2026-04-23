// --- 1. IMPORTACIONES (SIEMPRE ARRIBA DEL TODO) ---
import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/chat.bundle.es.js';

// --- 2. CONFIGURACIÓN Y NAVEGACIÓN SPA ---

if (!sessionStorage.getItem('sp_portal_auth')) {
    throw new Error("Acceso no autorizado: Deteniendo ejecución de app.js");
}

const sections = ['dashboard', 'invoices', 'upload', 'assistant'];
const navItems = document.querySelectorAll('.nav-item');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
const burgerBtn = document.getElementById('hamburger-menu');
const closeSidebarBtn = document.getElementById('close-sidebar');
const logoutBtn = document.getElementById('logout-btn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); 
        if (typeof window.spLogout === 'function') {
            window.spLogout(); 
        }
    });
}

function excelToJSDate(serial) {
    if (!serial || isNaN(serial)) return serial; 
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    return date.toLocaleDateString('es-ES'); 
}

function toggleSidebar(forceClose = false) {
    if (forceClose) {
        sidebar?.classList.remove('translate-x-0');
        overlay?.classList.remove('block');
        overlay?.classList.add('hidden');
    } else {
        sidebar?.classList.toggle('translate-x-0');
        overlay?.classList.toggle('hidden');
    }
}

if (burgerBtn) burgerBtn.addEventListener('click', () => toggleSidebar());
if (overlay) overlay.addEventListener('click', () => toggleSidebar(true));
if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', () => toggleSidebar(true));

document.getElementById('open-chat-btn')?.addEventListener('click', () => {
    const chatToggle = document.querySelector('.chat-window-toggle');
    if (chatToggle) chatToggle.click();
});

function showSection(sectionId, updateHistory = true) {
    sections.forEach(id => {
        const section = document.getElementById(`${id}-section`);
        if (section) {
            section.classList.toggle('hidden', id !== sectionId);
        }
    });

    navItems.forEach(item => {
        const isActive = item.getAttribute('data-section') === sectionId;
        item.classList.toggle('active', isActive);
        if (isActive) {
            item.classList.add('text-[#1111bb]', 'dark:text-[#bfc2ff]', 'bg-white/50', 'dark:bg-white/10', 'border-l-4', 'border-[#1111bb]', 'rounded-xl');
            item.classList.remove('text-[#454555]', 'dark:text-slate-400');
        } else {
            item.classList.remove('text-[#1111bb]', 'dark:text-[#bfc2ff]', 'bg-white/50', 'dark:bg-white/10', 'border-l-4', 'border-[#1111bb]', 'rounded-xl');
            item.classList.add('text-[#454555]', 'dark:text-slate-400');
        }
    });

    if (window.innerWidth < 1024) toggleSidebar(true);
    if (updateHistory) {
        const path = sectionId === 'dashboard' ? '/' : `/${sectionId}`;
        window.history.pushState({ sectionId }, '', path);
    }
    if (sectionId === 'invoices') loadRealInvoicesTable();
    else if (sectionId === 'dashboard') loadRealDashboardData();
}

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.getAttribute('data-section');
        showSection(section);
    });
});

window.addEventListener('popstate', (e) => {
    if (e.state && e.state.sectionId) showSection(e.state.sectionId, false);
    else handleRouting();
});

function handleRouting() {
    const path = window.location.pathname.replace('/', '') || 'dashboard';
    const sectionId = sections.includes(path) ? path : 'dashboard';
    showSection(sectionId, false);
}


// --- 3. LÓGICA DE SESIONES Y ASISTENTE (NUEVO) ---

function getOrCreateChatSessionId(chatId = null) {
    let sessions = JSON.parse(localStorage.getItem('sp_chat_sessions')) || [];
    if (chatId && sessions.includes(chatId)) {
        localStorage.setItem('sp_current_chat_id', chatId);
        return chatId;
    }
    let currentSession = localStorage.getItem('sp_current_chat_id');
    if (!currentSession || !sessions.includes(currentSession)) {
        currentSession = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        sessions.push(currentSession);
        localStorage.setItem('sp_chat_sessions', JSON.stringify(sessions));
        localStorage.setItem('sp_current_chat_id', currentSession);
    }
    return currentSession;
}

function renderChatHistory() {
    const listContainer = document.getElementById('chat-history-list');
    if (!listContainer) return;
    let sessions = JSON.parse(localStorage.getItem('sp_chat_sessions')) || [];
    let currentSession = localStorage.getItem('sp_current_chat_id');
    listContainer.innerHTML = '';
    sessions.forEach((session, index) => {
        const li = document.createElement('li');
        const isActive = session === currentSession;
        li.className = `cursor-pointer text-[11px] px-3 py-2 rounded-lg transition-colors truncate flex items-center gap-3 ${isActive ? 'bg-primary/10 dark:bg-white/10 text-primary dark:text-[#bfc2ff] font-bold' : 'text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-800'}`;
        li.innerHTML = `<span class="material-symbols-outlined text-[14px]">${isActive ? 'chat' : 'chat_bubble'}</span><span>Conversación ${index + 1}</span>`;
        li.onclick = () => {
            localStorage.setItem('sp_current_chat_id', session);
            initChat(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
            renderChatHistory();
        };
        listContainer.appendChild(li);
    });
}

document.getElementById('new-chat-btn')?.addEventListener('click', () => {
    const newSession = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    let sessions = JSON.parse(localStorage.getItem('sp_chat_sessions')) || [];
    sessions.push(newSession);
    localStorage.setItem('sp_chat_sessions', JSON.stringify(sessions));
    localStorage.setItem('sp_current_chat_id', newSession);
    initChat(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    renderChatHistory();
    showSection('assistant');
});

function initChat(selectedTheme = 'light') {
    const existingChat = document.querySelector('div#n8n-chat') || document.querySelector('.n8n-chat-widget');
    if (existingChat) existingChat.remove();

    const currentSessionId = getOrCreateChatSessionId();

    createChat({
        webhookUrl: 'https://n8n-automatizacion.178.105.8.162.sslip.io/webhook/a8d485bd-7592-47c6-8364-a483d80ddbc2/chat',
        metadata: { sessionId: currentSessionId },
        theme: selectedTheme,
        showWelcomeScreen: false,
        initialMessages: ['¡Hola! 👋 Soy tu asistente financiero.', '¿En qué puedo ayudarte hoy?'],
        i18n: {
            es: { title: 'Asistente de Facturas', subtitle: 'Consulta inteligente', inputPlaceholder: 'Escribe tu duda...' }
        },
        theme: {
            mode: selectedTheme,
            customCSS: selectedTheme === 'dark' ? `
                .chat-body, .chat-layout, .chat-footer, .chat-messages-list { background-color: #0f172a !important; }
                .chat-message.chat-message-from-user { background-color: #030086 !important; }
            ` : ''
        }
    });

    setTimeout(() => {
        const chatContainer = document.getElementById('n8n-chat');
        if (!chatContainer) return;
        const observer = new MutationObserver(() => {
            chatContainer.querySelectorAll('.chat-message-from-bot').forEach(msg => {
                if (msg.dataset.sanitized) return;
                const text = msg.innerText || '';
                if (text.includes('Error in workflow') || text.startsWith('{')) {
                    msg.textContent = '⚠️ El asistente tiene un problema técnico temporal.';
                }
                msg.dataset.sanitized = 'true';
            });
        });
        observer.observe(chatContainer, { childList: true, subtree: true });
    }, 1500);
}

const initialTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
initChat(initialTheme);


// --- 4. LÓGICA DEL MODO OSCURO ---
const themeBtn = document.getElementById('theme-toggle');
if (themeBtn) {
    themeBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        const newTheme = isDark ? 'dark' : 'light';
        document.getElementById('theme-icon').textContent = isDark ? 'light_mode' : 'dark_mode';
        document.getElementById('theme-text').textContent = isDark ? 'Modo Claro' : 'Modo Oscuro';
        initChat(newTheme);
    });
}


// --- 5. SUBIDA DE FACTURAS ---
const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = document.getElementById('fileInput').files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("attachment_0", file);

        document.getElementById('status-card').classList.remove('hidden');
        document.getElementById('status-title').textContent = 'Procesando...';

        try {
            const response = await fetch('https://n8n-automatizacion.178.105.8.162.sslip.io/webhook/subir-factura', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (response.ok) {
                document.getElementById('status-title').textContent = '¡Éxito!';
                Cache.invalidate();
            }
        } catch (error) {
            document.getElementById('status-title').textContent = 'Error';
        }
    });
}

setInterval(() => {
    const btn = document.querySelector('.chat-input-send-button');
    if (btn && btn.hasAttribute('disabled')) {
        btn.removeAttribute('disabled');
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
    }
}, 1000);


// --- 6. API Y DASHBOARD ---
const REAL_API_URL = 'https://n8n-automatizacion.178.105.8.162.sslip.io/webhook/api-portal';
const Cache = {
    _data: null, _timestamp: null, TTL_MS: 300000,
    async fetch() {
        if (this._data && (Date.now() - this._timestamp < this.TTL_MS)) return this._data;
        const res = await fetch(REAL_API_URL);
        this._data = await res.json();
        this._timestamp = Date.now();
        return this._data;
    },
    invalidate() { this._data = null; }
};

async function loadRealDashboardData() {
    const el = document.getElementById('dash-procesadas');
    if (!el) return;
    try {
        const data = await Cache.fetch();
        el.textContent = data.filter(i => i.status === 'PROCESADO').length;
        document.getElementById('dash-pendientes').textContent = data.filter(i => i.status !== 'PROCESADO').length;
        const total = data.reduce((acc, i) => acc + (parseFloat(String(i.amount).replace(',', '.')) || 0), 0);
        document.getElementById('dash-volumen').textContent = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(total);
    } catch (e) { console.error(e); }
}

async function loadRealInvoicesTable() {
    const tbody = document.querySelector('#invoices-section tbody');
    if (!tbody) return;
    try {
        const data = await Cache.fetch();
        tbody.innerHTML = data.map(inv => `
            <tr class="border-b border-outline-variant/10">
                <td class="px-6 py-4 font-bold text-primary">${inv.id}</td>
                <td class="px-6 py-4">${inv.client}</td>
                <td class="px-6 py-4 text-sm">${excelToJSDate(inv.date)}</td>
                <td class="px-6 py-4 font-bold">${inv.amount} €</td>
                <td class="px-6 py-4"><span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">${inv.status}</span></td>
            </tr>`).join('');
    } catch (e) { tbody.innerHTML = 'Error cargando datos.'; }
}

window.addEventListener('load', () => {
    renderChatHistory();
    setTimeout(() => Cache.fetch().catch(() => {}), 300);
});

handleRouting();
