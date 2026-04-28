// --- 1. IMPORTACIONES (SIEMPRE ARRIBA DEL TODO) ---
import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/chat.bundle.es.js';

// --- 2. CONFIGURACIÓN Y NAVEGACIÓN SPA ---

// Si el guard ya está redirigiendo, no ejecutar nada de app.js
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
        e.stopPropagation(); // CRITICO: Evita que el evento "suba" al router
        if (typeof window.spLogout === 'function') {
            window.spLogout(); // Usamos la función oficial del guard
        }
    });
}

// Función para convertir números de Excel (Serial Dates) a fecha legible
function excelToJSDate(serial) {
    if (!serial || isNaN(serial)) return serial; // Si ya es texto, lo deja igual
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    return date.toLocaleDateString('es-ES'); // Formato DD/MM/YYYY
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

// Añadir listener al botón de abrir chat del HTML
document.getElementById('open-chat-btn')?.addEventListener('click', () => {
    const chatToggle = document.querySelector('.chat-window-toggle');
    if (chatToggle) chatToggle.click();
});

function showSection(sectionId, updateHistory = true) {
    // 1. Mostrar/ocultar secciones
    sections.forEach(id => {
        const section = document.getElementById(`${id}-section`);
        if (section) {
            section.classList.toggle('hidden', id !== sectionId);
        }
    });

    // 2. Update active nav item
    navItems.forEach(item => {
        const isActive = item.getAttribute('data-section') === sectionId;
        item.classList.toggle('active', isActive);
        
        // Tailwind classes for active/inactive
        if (isActive) {
            item.classList.add('text-[#1111bb]', 'dark:text-[#bfc2ff]', 'bg-white/50', 'dark:bg-white/10', 'border-l-4', 'border-[#1111bb]', 'rounded-xl');
            item.classList.remove('text-[#454555]', 'dark:text-slate-400');
        } else {
            item.classList.remove('text-[#1111bb]', 'dark:text-[#bfc2ff]', 'bg-white/50', 'dark:bg-white/10', 'border-l-4', 'border-[#1111bb]', 'rounded-xl');
            item.classList.add('text-[#454555]', 'dark:text-slate-400');
        }
    });

    // 3. Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
        toggleSidebar(true);
    }

    // 4. Update URL without page reload
    if (updateHistory) {
        const path = sectionId === 'dashboard' ? '/' : `/${sectionId}`;
        window.history.pushState({ sectionId }, '', path);
    }

    // 5. Cargar los datos reales
    if (sectionId === 'invoices') {
        loadRealInvoicesTable();
    } else if (sectionId === 'dashboard') {
        loadRealDashboardData();
    } else if (sectionId === 'assistant') {
        loadChatHistory();
    }
}

// Event Listeners for Navigation
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.getAttribute('data-section');
        showSection(section);
    });
});

// Handle browser back/forward buttons
window.addEventListener('popstate', (e) => {
    if (e.state && e.state.sectionId) {
        showSection(e.state.sectionId, false);
    } else {
        handleRouting();
    }
});

function handleRouting() {
    const path = window.location.pathname.replace('/', '') || 'dashboard';
    const sectionId = sections.includes(path) ? path : 'dashboard';
    showSection(sectionId, false);
}


// --- 3. INICIALIZACIÓN DEL ASISTENTE INTELIGENTE (RAG) ---

function initChat(selectedTheme = 'light') {
    // 1. Limpiar widget existente
    const existingChat = document.querySelector('div#n8n-chat') || document.querySelector('.n8n-chat-widget');
    if (existingChat) {
        existingChat.remove();
    }

    // 2. Recuperar o crear sessionId persistente
    let sessionId = localStorage.getItem('n8n_chat_sessionId');
    if (!sessionId) {
        sessionId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
        localStorage.setItem('n8n_chat_sessionId', sessionId);
    }

    // 3. Crear el chat
    createChat({
        webhookUrl: 'https://n8n-automatizacion.178.105.8.162.sslip.io/webhook/a8d485bd-7592-47c6-8364-a483d80ddbc2/chat',
        theme: selectedTheme,
        sessionId: sessionId,
        showWelcomeScreen: false,
        initialMessages: [
            '¡Hola! 👋 Soy tu asistente financiero.',
            '¿En qué puedo ayudarte hoy?'
        ],
        i18n: {
            en: { title: 'Asistente de Facturas', subtitle: 'Consulta inteligente de tus documentos', inputPlaceholder: 'Escribe tu duda...', getStarted: 'Comenzar' },
            es: { title: 'Asistente de Facturas', subtitle: 'Consulta inteligente de tus documentos', inputPlaceholder: 'Escribe tu duda...', getStarted: 'Comenzar' }
        },
        theme: {
            mode: selectedTheme,
            customCSS: selectedTheme === 'dark' ? `
                .chat-body, .chat-layout, .chat-footer, .chat-messages-list { background-color: #0f172a !important; background: #0f172a !important; }
                .chat-message.chat-message-from-bot { background-color: #1e293b !important; color: white !important; }
                .chat-message.chat-message-from-user { background-color: #030086 !important; color: white !important; }
                .chat-input { background-color: #0f172a !important; border-top: 1px solid #334155 !important; }
                .chat-input textarea { background-color: #1e293b !important; color: white !important; border-color: #475569 !important; }
            ` : ''
        }
    });

    // 3. Lógica secundaria (Errores y Botones Inyectados)
    setTimeout(() => {
        const chatContainer = document.getElementById('n8n-chat');
        if (!chatContainer) return;

        // --- A: Observador para limpiar errores técnicos de n8n ---
        const observer = new MutationObserver(() => {
            chatContainer.querySelectorAll('.chat-message-from-bot').forEach(msg => {
                if (msg.dataset.sanitized) return;
                const text = msg.innerText || msg.textContent || '';
                const esError = text.includes('Error in workflow') || text.includes('"message"') || text.startsWith('{') || text.startsWith('[');

                if (esError) {
                    msg.textContent = '⚠️ El asistente tiene un problema técnico temporal. Por favor, inténtalo de nuevo en unos minutos.';
                }
                msg.dataset.sanitized = 'true';
            });
        });
        observer.observe(chatContainer, { childList: true, subtree: true });

        // --- B: Inyector de Starter Prompts (Seguro y aislado) ---
        const promptInterval = setInterval(() => {
            const messagesList = document.querySelector('.chat-messages-list');
            
            if (messagesList && !document.getElementById('custom-starter-prompts')) {
                const promptsContainer = document.createElement('div');
                promptsContainer.id = 'custom-starter-prompts';
                promptsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px; padding: 10px 20px; margin-top: 5px; margin-bottom: 15px; align-items: flex-end; animation: fadeIn 0.5s ease;';

                const prompts = [
                    { label: '📊 Resumen de mes', message: 'Por favor, analízame las facturas de este mes y dame un resumen financiero.' },
                    { label: '🔍 Buscar factura', message: 'Necesito que me ayudes a buscar una factura específica.' },
                    { label: '💰 Gastos totales', message: '¿Cuáles han sido los gastos totales registrados hasta ahora?' }
                ];

                const isDark = selectedTheme === 'dark';

                prompts.forEach(p => {
                    const btn = document.createElement('button');
                    btn.innerText = p.label;
                    
                    const bg = isDark ? 'rgba(191, 194, 255, 0.1)' : 'rgba(3, 0, 134, 0.05)';
                    const color = isDark ? '#bfc2ff' : '#030086';
                    const border = isDark ? 'rgba(191, 194, 255, 0.3)' : 'rgba(3, 0, 134, 0.2)';
                    
                    btn.style.cssText = `background: ${bg}; color: ${color}; border: 1px solid ${border}; padding: 8px 14px; border-radius: 16px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; max-width: 85%; text-align: left;`;
                    
                    btn.onmouseover = () => btn.style.background = isDark ? 'rgba(191, 194, 255, 0.2)' : 'rgba(3, 0, 134, 0.1)';
                    btn.onmouseout = () => btn.style.background = bg;

                    btn.onclick = () => {
                        promptsContainer.style.opacity = '0';
                        setTimeout(() => promptsContainer.style.display = 'none', 300);
                        
                        const chatInput = document.querySelector('.chat-input textarea');
                        const sendBtn = document.querySelector('.chat-input-send-button');
                        
                        if (chatInput && sendBtn) {
                            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                            nativeInputValueSetter.call(chatInput, p.message);
                            chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                            
                            sendBtn.removeAttribute('disabled');
                            sendBtn.style.opacity = "1";
                            sendBtn.style.pointerEvents = "auto";
                            sendBtn.click();
                        }
                    };
                    promptsContainer.appendChild(btn);
                });

                messagesList.appendChild(promptsContainer);
                clearInterval(promptInterval); 
            }
        }, 500); 

    }, 1500);
}

// Detectar preferencia de tema inicial
const initialTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
initChat(initialTheme);


// --- 4. LÓGICA DEL MODO OSCURO ---
const themeBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text');

if (themeBtn) {
    themeBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        const newTheme = isDark ? 'dark' : 'light';
        
        // Actualizar UI del botón
        if (themeIcon) themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
        if (themeText) themeText.textContent = isDark ? 'Modo Claro' : 'Modo Oscuro';
        
        // Reiniciar el chat con el nuevo tema visual
        initChat(newTheme);
    });
}


// --- 5. LÓGICA DEL FORMULARIO DE SUBIDA DE FACTURAS ---
const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('file-name');
const fileInfoContainer = document.getElementById('file-info');

// Mostrar nombre de archivo y VISTA PREVIA DEL PDF al seleccionar
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
                    <iframe src="${fileURL}#toolbar=0" class="w-full h-[500px] border-none rounded-lg shadow-inner" title="Vista previa local"></iframe>
                `;
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
                </div>
            `;
        }

        try {
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                body: formData
            });

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
                        </div>
                    `;
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
                    </div>
                `;
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.querySelector('span').textContent = 'Subir otra factura';
        }
    });
}

// --- FIX DE ACTIVACIÓN DEL BOTÓN DE ENVÍO DEL CHAT ---
setInterval(() => {
    const sendButton = document.querySelector('.chat-input-send-button');
    if (sendButton && sendButton.hasAttribute('disabled')) {
        sendButton.removeAttribute('disabled');
        sendButton.style.opacity = "1";
        sendButton.style.cursor = "pointer";
        sendButton.style.pointerEvents = "auto";
    }
}, 1000);


// --- 6. INTEGRACIÓN REAL CON N8N Y DASHBOARD ---

const REAL_API_URL = 'https://n8n-automatizacion.178.105.8.162.sslip.io/webhook/api-portal';
const HISTORIAL_API_URL = 'https://n8n-automatizacion.178.105.8.162.sslip.io/webhook/api-historial-chats';

const Cache = {
    _data: null,               
    _fetchPromise: null,       
    _timestamp: null,
    TTL_MS: 5 * 60 * 1000,    

    isValid() {
        return this._data && this._timestamp && (Date.now() - this._timestamp < this.TTL_MS);
    },

    async fetch() {
        if (this.isValid()) return this._data;            
        if (this._fetchPromise) return this._fetchPromise; 

        this._fetchPromise = fetch(REAL_API_URL)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                this._data = data;
                this._timestamp = Date.now();
                return data;
            })
            .finally(() => {
                this._fetchPromise = null; 
            });

        return this._fetchPromise;
    },

    invalidate() {
        this._data = null;
        this._timestamp = null;
    }
};

function renderTableSkeleton(tbody) {
    const rows = Array.from({ length: 5 }, () => `
        <tr class="border-b border-outline-variant/10">
            ${['w-20', 'w-32', 'w-24', 'w-16', 'w-16'].map(w => `
                <td class="px-6 py-4">
                    <div class="h-4 ${w} bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </td>`).join('')}
        </tr>`).join('');
    tbody.innerHTML = rows;
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

    if (Cache.isValid()) {
        renderDashboardStats(Cache._data, elProcesadas, elPendientes, elVolumen);
        return;
    }

    renderDashboardSkeleton();

    try {
        const invoices = await Cache.fetch();
        renderDashboardStats(invoices, elProcesadas, elPendientes, elVolumen);
    } catch (error) {
        console.error('Error cargando Dashboard:', error);
        [elProcesadas, elPendientes, elVolumen].forEach(el => {
            if (el) el.innerHTML = '<span class="text-base text-red-500">Error</span>';
        });
    }
}

function renderDashboardStats(invoices, elProcesadas, elPendientes, elVolumen) {
    let totalProcesadas = 0, totalPendientes = 0, volumenTotal = 0;

    invoices.forEach(inv => {
        if (inv.status === 'PROCESADO') totalProcesadas++;
        else totalPendientes++;
        volumenTotal += parseFloat(String(inv.amount).replace(',', '.')) || 0;
    });

    const formatoMoneda = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(volumenTotal);

    elProcesadas.textContent = totalProcesadas;
    elPendientes.textContent = totalPendientes;
    elVolumen.textContent    = formatoMoneda;

    const badgeProcesadas = document.getElementById('badge-procesadas');
    const textProcesadas = document.getElementById('text-procesadas');
    const iconProcesadas = document.getElementById('icon-procesadas');

    if (badgeProcesadas && textProcesadas && iconProcesadas) {
        const totalFacturas = totalProcesadas + totalPendientes;
        const porcentaje = totalFacturas > 0 ? Math.round((totalProcesadas / totalFacturas) * 100) : 0;
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

    if (Cache.isValid()) {
        renderInvoiceRows(Cache._data, tbody);
        return;
    }

    renderTableSkeleton(tbody);

    try {
        const invoices = await Cache.fetch();
        renderInvoiceRows(invoices, tbody);
    } catch (error) {
        console.error('Error cargando tabla:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-6 text-center">
                    <div class="flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl text-red-400">cloud_off</span>
                        <p class="text-sm text-red-500 font-medium">${error.message}</p>
                        <button onclick="Cache.invalidate(); loadRealInvoicesTable()" class="mt-2 text-xs text-primary underline">Reintentar</button>
                    </div>
                </td>
            </tr>`;
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

        const fechaFormateada = excelToJSDate(inv.date);
        const isProcessed = inv.status === 'PROCESADO';
        const divisa = inv.currency || inv.moneda || '€';

        tr.innerHTML = `
            <td class="px-6 py-4 font-bold text-primary dark:text-[#bfc2ff]">${inv.id}</td>
            <td class="px-6 py-4 text-on-surface dark:text-white font-medium">${inv.client}</td>
            <td class="px-6 py-4 text-sm text-on-surface-variant dark:text-slate-400">${fechaFormateada}</td>
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
    const pdfUrl = `${REAL_API_URL}-preview?id=${invoiceId}`;
    previewContainer.innerHTML = `<iframe src="${pdfUrl}" class="w-full h-[500px] border-none rounded-lg" title="Factura ${invoiceId}"></iframe>`;
}

window.addEventListener('load', () => {
    setTimeout(() => Cache.fetch().catch(() => {}), 300);
});

// --- HISTORIAL Y GESTIÓN DE SESIONES DEL ASISTENTE ---

async function loadChatHistory() {
    const ul = document.getElementById('assistant-chat-history');
    if (!ul) return;

    ul.innerHTML = `
        <li class="text-center py-4">
            <div class="h-4 w-3/4 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3"></div>
            <div class="h-4 w-1/2 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </li>`;

    try {
        const res = await fetch(HISTORIAL_API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const sesiones = await res.json();

        if (!sesiones.length) {
            ul.innerHTML = `<li class="text-center py-8 text-sm text-on-surface-variant dark:text-slate-400">
                No hay conversaciones anteriores.
            </li>`;
            return;
        }

        ul.innerHTML = '';
        sesiones.forEach(s => {
            const li = document.createElement('li');
            const fecha = new Date(s.fecha_inicio).toLocaleDateString('es-ES', 
                { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
            const resumen = s.primer_mensaje 
                ? s.primer_mensaje.substring(0, 55) + (s.primer_mensaje.length > 55 ? '…' : '')
                : 'Conversación sin texto';

            li.innerHTML = `
                <button onclick="openSession('${s.session_id}')" 
                    class="w-full text-left p-3 rounded-xl hover:bg-primary-fixed/30 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-outline-variant/20 group">
                    <div class="flex items-start gap-3">
                        <span class="material-symbols-outlined text-primary dark:text-[#bfc2ff] mt-0.5 flex-shrink-0" style="font-size:18px">chat</span>
                        <div class="min-w-0">
                            <p class="text-sm font-semibold dark:text-white truncate">${resumen}</p>
                            <p class="text-[10px] text-on-surface-variant dark:text-slate-400 mt-0.5">
                                ${fecha} · ${s.num_mensajes} mensajes
                            </p>
                        </div>
                    </div>
                </button>`;
            ul.appendChild(li);
        });

    } catch (err) {
        ul.innerHTML = `<li class="text-center py-4 text-sm text-red-500">
            Error al cargar el historial. 
            <button onclick="loadChatHistory()" class="underline ml-1">Reintentar</button>
        </li>`;
        console.error('Error historial chats:', err);
    }
}

// Abrir una sesión anterior: cambia el sessionId y abre el chat
async function openSession(sessionId) {
    const isDark = document.documentElement.classList.contains('dark');
    
    // 1. Obtener mensajes de la sesión
    const res = await fetch(`${HISTORIAL_API_URL}?session_id=${sessionId}`);
    const mensajes = await res.json();
    
    // 2. Cargar el chat con ese sessionId
    localStorage.setItem('n8n_chat_sessionId', sessionId);
    
    const existingChat = document.querySelector('div#n8n-chat');
    if (existingChat) existingChat.remove();
    
    setTimeout(() => {
        initChat(isDark ? 'dark' : 'light');
        
        // 3. Inyectar los mensajes anteriores en el chat
        setTimeout(() => {
            const toggle = document.querySelector('.chat-window-toggle');
            if (toggle) toggle.click();
            
            setTimeout(() => {
                const messagesList = document.querySelector('.chat-messages-list');
                if (!messagesList || !mensajes.length) return;
                
                // Limpiar mensajes iniciales
                messagesList.innerHTML = '';
                
                mensajes.forEach(m => {
                    const div = document.createElement('div');
                    div.className = m.type === 'human' 
                        ? 'chat-message chat-message-from-user' 
                        : 'chat-message chat-message-from-bot';
                    div.textContent = m.content;
                    messagesList.appendChild(div);
                });
                
                // Scroll al final
                messagesList.scrollTop = messagesList.scrollHeight;
            }, 800);
        }, 800);
    }, 300);
}

// Nueva conversación: genera sessionId fresco
document.getElementById('btn-new-chat-assistant')?.addEventListener('click', () => {
    const newId = crypto.randomUUID 
        ? crypto.randomUUID() 
        : Date.now().toString(36) + Math.random().toString(36).substr(2);
    localStorage.setItem('n8n_chat_sessionId', newId);
    const isDark = document.documentElement.classList.contains('dark');
    initChat(isDark ? 'dark' : 'light');
    setTimeout(() => {
        const toggle = document.querySelector('.chat-window-toggle');
        if (toggle) toggle.click();
    }, 400);
});

// Exponer para uso desde HTML
window.openSession = openSession;

window.Cache = Cache;
handleRouting();
