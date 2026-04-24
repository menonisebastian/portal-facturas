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
        if (section) section.classList.toggle('hidden', id !== sectionId);
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
        showSection(item.getAttribute('data-section'));
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


// --- 3. LÓGICA DE SESIONES Y ASISTENTE ---

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

window.openChatWidget = function () {
    let attempts = 0;
    const interval = setInterval(() => {
        const host = document.querySelector('.n8n-chat-widget') || document.querySelector('div[id^="n8n-chat"]');
        if (host) {
            let toggleBtn = host.shadowRoot
                ? host.shadowRoot.querySelector('.chat-window-toggle') || host.shadowRoot.querySelector('button')
                : document.querySelector('.chat-window-toggle');
            if (toggleBtn) {
                toggleBtn.click();
                clearInterval(interval);
                return;
            }
        }
        if (++attempts > 30) clearInterval(interval);
    }, 100);
};

function renderChatHistory() {
    const listContainer = document.getElementById('assistant-chat-history');
    if (!listContainer) return;

    const sessions = JSON.parse(localStorage.getItem('sp_chat_sessions')) || [];
    const currentSession = localStorage.getItem('sp_current_chat_id');

    listContainer.innerHTML = '';

    if (sessions.length === 0) {
        listContainer.innerHTML = '<li class="text-center py-8 text-sm text-on-surface-variant dark:text-slate-400">Aún no hay conversaciones registradas.</li>';
        return;
    }

    [...sessions].reverse().forEach((session, reversedIndex) => {
        const index = sessions.length - 1 - reversedIndex;
        const li = document.createElement('li');
        const isActive = session === currentSession;

        li.className = `cursor-pointer p-4 rounded-xl border transition-all flex items-center justify-between group ${
            isActive
                ? 'bg-primary/5 border-primary/30 dark:bg-[#bfc2ff]/10 dark:border-[#bfc2ff]/30'
                : 'bg-surface-container-lowest dark:bg-slate-900 border-outline-variant/20 dark:border-slate-700 hover:border-primary/50 dark:hover:border-[#bfc2ff]/50'
        }`;

        const timestamp = parseInt(session.split('_')[1]);
        const dateStr = isNaN(timestamp)
            ? 'Conversación'
            : new Date(timestamp).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

        li.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-primary text-white dark:bg-[#bfc2ff] dark:text-primary' : 'bg-surface-container dark:bg-slate-800 text-primary dark:text-[#bfc2ff]'}">
                    <span class="material-symbols-outlined text-[20px]">${isActive ? 'chat' : 'history'}</span>
                </div>
                <div>
                    <p class="text-sm font-bold ${isActive ? 'text-primary dark:text-[#bfc2ff]' : 'text-on-surface dark:text-white'}">Conversación ${index + 1}</p>
                    <p class="text-[11px] text-on-surface-variant dark:text-slate-400">${dateStr}</p>
                </div>
            </div>
            <button class="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-primary dark:text-[#bfc2ff] hover:bg-primary/10 dark:hover:bg-white/10 rounded-lg" title="Abrir chat">
                <span class="material-symbols-outlined">open_in_new</span>
            </button>`;

        li.onclick = () => {
            localStorage.setItem('sp_current_chat_id', session);
            const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            initChat(currentTheme);
            renderChatHistory();
            window.openChatWidget();
        };
        listContainer.appendChild(li);
    });
}

// ─── ÚNICO listener para "Nueva Consulta" ────────────────────────────────────
document.getElementById('btn-new-chat-assistant')?.addEventListener('click', () => {
    const newSession = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const sessions = JSON.parse(localStorage.getItem('sp_chat_sessions')) || [];
    sessions.push(newSession);
    localStorage.setItem('sp_chat_sessions', JSON.stringify(sessions));
    localStorage.setItem('sp_current_chat_id', newSession);

    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    initChat(currentTheme);
    renderChatHistory();
    window.openChatWidget();
});

function initChat(selectedTheme = 'light') {
    // Destruir instancia anterior
    const existingChat = document.querySelector('.n8n-chat-widget') || document.querySelector('div[id^="n8n-chat"]');
    if (existingChat) existingChat.remove();

    const currentSessionId = getOrCreateChatSessionId();

    // FIX: "theme" declarado UNA sola vez y sin duplicar la clave
    createChat({
        webhookUrl: 'https://n8n-automatizacion.178.105.8.162.sslip.io/webhook/a8d485bd-7592-47c6-8364-a483d80ddbc2/chat',
        sessionId: currentSessionId,
        mode: selectedTheme,
        showWelcomeScreen: false,
        initialMessages: [
            '¡Hola! 👋 Soy tu asistente financiero.',
            '¿En qué puedo ayudarte hoy?'
        ],
        i18n: {
            es: {
                title: 'Asistente de Facturas',
                subtitle: 'Consulta inteligente',
                inputPlaceholder: 'Escribe tu duda...',
                getStarted: 'Nueva conversación',
                footer: ''
            }
        },
        defaultLanguage: 'es',
        ...(selectedTheme === 'dark' && {
            customCSS: `
                .chat-body, .chat-layout, .chat-footer, .chat-messages-list { background-color: #0f172a !important; }
                .chat-message.chat-message-from-user { background-color: #030086 !important; }
            `
        })
    });

    // Sanitizador de errores
    setTimeout(() => {
        const chatContainer = document.querySelector('.n8n-chat-widget') || document.querySelector('div[id^="n8n-chat"]');
        if (!chatContainer) return;
        const rootToObserve = chatContainer.shadowRoot ? chatContainer.shadowRoot : chatContainer;
        const observer = new MutationObserver(() => {
            rootToObserve.querySelectorAll('.chat-message-from-bot').forEach(msg => {
                if (msg.dataset.sanitized) return;
                const text = msg.innerText || '';
                if (text.includes('Error in workflow') || text.startsWith('{')) {
                    msg.textContent = '⚠️ El asistente tiene un problema técnico temporal. Por favor, inténtalo de nuevo.';
                }
                msg.dataset.sanitized = 'true';
            });
        });
        observer.observe(rootToObserve, { childList: true, subtree: true });
    }, 1500);
}

// Inicializar al arrancar
const initialTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
initChat(initialTheme);


// --- 4. MODO OSCURO ---
const themeBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text');

if (themeBtn) {
    themeBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        const newTheme = isDark ? 'dark' : 'light';
        if (themeIcon) themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
        if (themeText) themeText.textContent = isDark ? 'Modo Claro' : 'Modo Oscuro';
        initChat(newTheme);
    });
}


// --- 5. FORMULARIO DE SUBIDA ---
const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('file-name');
const fileInfoContainer = document.getElementById('file-info');

if (fileInput) {
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            fileNameDisplay.textContent = `Archivo seleccionado: ${file.name}`;
            fileInfoContainer.classList.remove('hidden');
            const previewContainer = document.querySelector('#upload-section .lg\\:col-span-5 div');
            if (previewContainer) {
                const fileURL = URL.createObjectURL(file);
                previewContainer.innerHTML = `
                    <div class="absolute top-4 right-4 z-10 flex gap-2">
                        <div class="px-3 py-1 bg-slate-800/90 backdrop-blur rounded-lg text-[10px] font-bold text-white uppercase tracking-widest">Documento Original</div>
                    </div>
                    <iframe src="${fileURL}#toolbar=0" class="w-full h-[500px] border-none rounded-lg shadow-inner" title="Vista previa local"></iframe>`;
            }
        } else {
            fileInfoContainer.classList.add('hidden');
        }
    });
}

const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submitBtn');
        const statusCard = document.getElementById('status-card');
        const statusTitle = document.getElementById('status-title');
        const statusMessage = document.getElementById('status-message');
        const statusProgress = document.getElementById('status-progress');
        const statusPercentage = document.getElementById('status-percentage');
        const statusIcon = document.getElementById('status-icon');
        const statusIconContainer = document.getElementById('status-icon-container');
        const previewContainer = document.querySelector('#upload-section .lg\\:col-span-5 div');
        const file = fileInput.files[0];
        if (!file) return;

        const N8N_WEBHOOK_URL = 'https://n8n-automatizacion.178.105.8.162.sslip.io/webhook/subir-factura';
        const formData = new FormData();
        formData.append("attachment_0", file);

        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = 'Enviando...';
        statusCard.classList.remove('hidden');
        statusTitle.textContent = 'Procesando...';
        statusMessage.textContent = 'Enviando factura a la IA...';
        statusProgress.style.width = '30%';
        statusPercentage.textContent = '30%';
        statusIcon.textContent = 'sync';
        statusIcon.classList.add('animate-spin');

        if (previewContainer) {
            previewContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center h-[500px] bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <span class="material-symbols-outlined text-6xl text-primary animate-pulse mb-4">document_scanner</span>
                    <p class="text-sm font-bold text-primary dark:text-[#bfc2ff] animate-pulse">IA Extrayendo datos...</p>
                </div>`;
        }

        try {
            const response = await fetch(N8N_WEBHOOK_URL, { method: 'POST', body: formData });
            statusProgress.style.width = '70%';
            statusPercentage.textContent = '70%';
            statusMessage.textContent = 'Analizando metadatos del documento...';
            const result = await response.json();

            if (response.ok && result) {
                if (result.exito === false || result.error || result.error_procesamiento) {
                    throw new Error(result.mensaje || result.error || result.error_procesamiento || 'El documento fue rechazado.');
                }
                statusTitle.textContent = 'Completado';
                statusMessage.textContent = result.mensaje || '¡Factura procesada con éxito!';
                statusProgress.style.width = '100%';
                statusPercentage.textContent = '100%';
                statusIcon.textContent = 'check_circle';
                statusIcon.classList.remove('animate-spin');
                statusIconContainer.classList.remove('bg-secondary-fixed', 'dark:bg-slate-700');
                statusIconContainer.classList.add('bg-green-100', 'dark:bg-green-900/40');
                statusIcon.classList.add('text-green-600', 'dark:text-green-400');

                if (previewContainer) {
                    const prov = result.PROVEEDOR || result.proveedor || "Proveedor";
                    const num = result.NUMERO || result.numero_factura || "S/N";
                    const fecha = result['FECHA FACTURA'] || result.fecha_factura || "-";
                    const base = result.BASE || result.base_imponible || "0.00";
                    const iva = result.CUOTAIVA || result.cuota_iva || "0.00";
                    const total = result.TOTAL || result.total_factura || "0.00";
                    const moneda = result.MONEDA || result.moneda || "EUR";
                    previewContainer.innerHTML = `
                        <div class="absolute top-4 right-4 z-10 flex gap-2">
                            <div class="px-3 py-1 bg-green-500/90 backdrop-blur rounded-lg text-[10px] font-bold text-white uppercase tracking-widest">Extracción Exitosa</div>
                        </div>
                        <div class="bg-white dark:bg-slate-800 rounded-lg p-6 w-full h-[500px] flex items-center justify-center border border-outline-variant/20 shadow-sm">
                            <div class="w-full max-w-sm bg-surface-container-lowest dark:bg-slate-900 p-8 rounded-xl shadow-2xl font-mono text-sm relative border border-outline-variant/10">
                                <div class="text-center border-b border-dashed border-outline-variant/50 pb-4 mb-4">
                                    <span class="material-symbols-outlined text-5xl text-primary dark:text-[#bfc2ff] mb-2">storefront</span>
                                    <h3 class="font-bold text-xl text-on-surface dark:text-white uppercase truncate">${prov}</h3>
                                    <p class="text-[10px] text-on-surface-variant mt-1 tracking-widest">FACTURA Nº ${num}</p>
                                </div>
                                <div class="space-y-3 mb-6">
                                    <div class="flex justify-between"><span class="text-on-surface-variant">Emisión:</span> <span class="font-bold dark:text-white">${fecha}</span></div>
                                    <div class="flex justify-between"><span class="text-on-surface-variant">Estado:</span> <span class="text-green-600 font-bold">Verificado IA</span></div>
                                </div>
                                <div class="border-t border-b border-dashed border-outline-variant/50 py-4 my-4 space-y-3">
                                    <div class="flex justify-between"><span class="text-on-surface-variant">Base Imponible</span> <span class="dark:text-white">${base}</span></div>
                                    <div class="flex justify-between"><span class="text-on-surface-variant">Impuestos (IVA)</span> <span class="dark:text-white">${iva}</span></div>
                                </div>
                                <div class="flex justify-between items-center text-2xl font-bold text-primary dark:text-[#bfc2ff]">
                                    <span>TOTAL</span>
                                    <span>${total} ${moneda}</span>
                                </div>
                            </div>
                        </div>`;
                }
                fileInput.value = '';
                fileInfoContainer.classList.add('hidden');
                if (typeof Cache !== 'undefined') Cache.invalidate();
            } else {
                throw new Error('El servidor no pudo procesar el archivo.');
            }
        } catch (error) {
            statusTitle.textContent = 'Error';
            statusMessage.textContent = error.message;
            statusIcon.textContent = 'error';
            statusIcon.classList.remove('animate-spin');
            statusIconContainer.classList.remove('bg-secondary-fixed', 'dark:bg-slate-700');
            statusIconContainer.classList.add('bg-red-100', 'dark:bg-red-900/40');
            statusIcon.classList.add('text-red-600', 'dark:text-red-400');
            statusProgress.classList.remove('bg-primary', 'dark:bg-[#bfc2ff]');
            statusProgress.classList.add('bg-red-500');
            if (previewContainer) {
                previewContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-[500px] bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                        <span class="material-symbols-outlined text-6xl text-red-500 mb-4">warning</span>
                        <p class="text-sm font-bold text-red-700 dark:text-red-400">Error en la lectura del documento.</p>
                    </div>`;
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.querySelector('span').textContent = 'Subir otra factura';
        }
    });
}

// Fix botón envío del chat
setInterval(() => {
    const sendButton = document.querySelector('.chat-input-send-button');
    if (sendButton && sendButton.hasAttribute('disabled')) {
        sendButton.removeAttribute('disabled');
        sendButton.style.opacity = "1";
        sendButton.style.cursor = "pointer";
        sendButton.style.pointerEvents = "auto";
    }
}, 1000);


// --- 6. DASHBOARD Y TABLA DE FACTURAS ---

const REAL_API_URL = 'https://n8n-automatizacion.178.105.8.162.sslip.io/webhook/api-portal';

const Cache = {
    _data: null,
    _fetchPromise: null,
    _timestamp: null,
    TTL_MS: 5 * 60 * 1000,
    isValid() { return this._data && this._timestamp && (Date.now() - this._timestamp < this.TTL_MS); },
    async fetch() {
        if (this.isValid()) return this._data;
        if (this._fetchPromise) return this._fetchPromise;
        this._fetchPromise = fetch(REAL_API_URL)
            .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
            .then(data => { this._data = data; this._timestamp = Date.now(); return data; })
            .finally(() => { this._fetchPromise = null; });
        return this._fetchPromise;
    },
    invalidate() { this._data = null; this._timestamp = null; }
};

function renderTableSkeleton(tbody) {
    tbody.innerHTML = Array.from({ length: 5 }, () => `
        <tr class="border-b border-outline-variant/10">
            ${['w-20', 'w-32', 'w-24', 'w-16', 'w-16'].map(w => `
                <td class="px-6 py-4"><div class="h-4 ${w} bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></td>`).join('')}
        </tr>`).join('');
}

function renderDashboardSkeleton() {
    ['dash-procesadas', 'dash-pendientes', 'dash-volumen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<div class="h-12 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>';
    });
}

async function loadRealDashboardData() {
    const elProcesadas = document.getElementById('dash-procesadas');
    const elPendientes = document.getElementById('dash-pendientes');
    const elVolumen    = document.getElementById('dash-volumen');
    const elMesActual  = document.getElementById('dash-mes-actual');
    if (!elProcesadas) return;

    if (elMesActual) {
        const fecha = new Date();
        const nombreMes = fecha.toLocaleString('es-ES', { month: 'long' });
        elMesActual.textContent = `${nombreMes.charAt(0).toUpperCase()}${nombreMes.slice(1)} ${fecha.getFullYear()}`;
    }

    if (Cache.isValid()) { renderDashboardStats(Cache._data, elProcesadas, elPendientes, elVolumen); return; }
    renderDashboardSkeleton();
    try {
        renderDashboardStats(await Cache.fetch(), elProcesadas, elPendientes, elVolumen);
    } catch (error) {
        console.error('Error cargando Dashboard:', error);
        [elProcesadas, elPendientes, elVolumen].forEach(el => { if (el) el.innerHTML = '<span class="text-base text-red-500">Error</span>'; });
    }
}

function renderDashboardStats(invoices, elProcesadas, elPendientes, elVolumen) {
    let totalProcesadas = 0, totalPendientes = 0, volumenTotal = 0;
    invoices.forEach(inv => {
        if (inv.status === 'PROCESADO') totalProcesadas++; else totalPendientes++;
        volumenTotal += parseFloat(String(inv.amount).replace(',', '.')) || 0;
    });
    elProcesadas.textContent = totalProcesadas;
    elPendientes.textContent = totalPendientes;
    elVolumen.textContent = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(volumenTotal);

    const badgeProcesadas = document.getElementById('badge-procesadas');
    const textProcesadas = document.getElementById('text-procesadas');
    const iconProcesadas = document.getElementById('icon-procesadas');
    if (badgeProcesadas && textProcesadas && iconProcesadas) {
        const total = totalProcesadas + totalPendientes;
        const porcentaje = total > 0 ? Math.round((totalProcesadas / total) * 100) : 0;
        textProcesadas.textContent = `${porcentaje}%`;
        if (porcentaje >= 50) {
            badgeProcesadas.className = "flex items-center font-bold text-sm px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400";
            iconProcesadas.textContent = "trending_up";
        } else {
            badgeProcesadas.className = "flex items-center font-bold text-sm px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400";
            iconProcesadas.textContent = "trending_down";
        }
    }
}

async function loadRealInvoicesTable() {
    const tbody = document.querySelector('#invoices-section tbody');
    if (!tbody) return;
    if (Cache.isValid()) { renderInvoiceRows(Cache._data, tbody); return; }
    renderTableSkeleton(tbody);
    try {
        renderInvoiceRows(await Cache.fetch(), tbody);
    } catch (error) {
        console.error('Error cargando tabla:', error);
        tbody.innerHTML = `
            <tr><td colspan="5" class="px-6 py-6 text-center">
                <div class="flex flex-col items-center gap-2">
                    <span class="material-symbols-outlined text-3xl text-red-400">cloud_off</span>
                    <p class="text-sm text-red-500 font-medium">${error.message}</p>
                    <button onclick="Cache.invalidate(); loadRealInvoicesTable()" class="mt-2 text-xs text-primary underline">Reintentar</button>
                </div>
            </td></tr>`;
    }
}

function renderInvoiceRows(invoices, tbody) {
    if (!invoices.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-on-surface-variant text-sm">No hay facturas disponibles.</td></tr>';
        return;
    }
    const fragment = document.createDocumentFragment();
    invoices.forEach(inv => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-primary-fixed/30 dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-outline-variant/10';
        tr.setAttribute('onclick', `previewInvoice('${inv.id}')`);
        const isProcessed = inv.status === 'PROCESADO';
        const divisa = inv.currency || inv.moneda || '€';
        tr.innerHTML = `
            <td class="px-6 py-4 font-bold text-primary dark:text-[#bfc2ff]">${inv.id}</td>
            <td class="px-6 py-4 text-on-surface dark:text-white font-medium">${inv.client}</td>
            <td class="px-6 py-4 text-sm text-on-surface-variant dark:text-slate-400">${excelToJSDate(inv.date)}</td>
            <td class="px-6 py-4 font-bold dark:text-white">${inv.amount} ${divisa}</td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 ${isProcessed ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'} rounded-full text-[10px] font-bold uppercase tracking-wider">
                    ${inv.status}
                </span>
            </td>`;
        fragment.appendChild(tr);
    });
    tbody.innerHTML = '';
    tbody.appendChild(fragment);
}

async function previewInvoice(invoiceId) {
    const previewContainer = document.querySelector('#upload-section .lg\\:col-span-5 div');
    if (!previewContainer) return;
    previewContainer.innerHTML = `<iframe src="${REAL_API_URL}-preview?id=${invoiceId}" class="w-full h-[500px] border-none rounded-lg" title="Factura ${invoiceId}"></iframe>`;
}

// --- INICIALIZACIÓN FINAL ---
window.Cache = Cache;

window.addEventListener('load', () => {
    renderChatHistory();
    setTimeout(() => Cache.fetch().catch(() => {}), 300);
});

handleRouting();