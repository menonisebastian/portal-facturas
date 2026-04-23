// --- 1. CONFIGURACIÓN Y NAVEGACIÓN SPA ---

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
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    } else {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

if (burgerBtn) burgerBtn.addEventListener('click', () => toggleSidebar());
if (overlay) overlay.addEventListener('click', () => toggleSidebar(true));
if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', () => toggleSidebar(true));

function showSection(sectionId, updateHistory = true) {
    // 1. Mostrar/ocultar secciones (EL BUCLE DEJA DE AFECTAR A LA CARGA)
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

    // 5. Special logic for AI Assistant tab
    if (sectionId === 'assistant') {
        const chatToggle = document.querySelector('.chat-window-toggle');
        const chatWindow = document.querySelector('.chat-window');
        // If chat is not open, open it
        if (chatToggle && (!chatWindow || chatWindow.classList.contains('hidden') || chatWindow.style.display === 'none')) {
            chatToggle.click();
        }
    }

    // --- AQUÍ ES EL LUGAR CORRECTO ---
    // 6. Cargar los datos reales una sola vez cuando se visita la sección de facturas
    if (sectionId === 'invoices') {
        loadRealInvoicesTable();
    } else if (sectionId === 'dashboard') {
        loadRealDashboardData();
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

// Router Logic
function handleRouting() {
    const path = window.location.pathname.replace('/', '') || 'dashboard';
    const sectionId = sections.includes(path) ? path : 'dashboard';
    showSection(sectionId, false);
}

// --- 2. INICIALIZACIÓN DEL ASISTENTE INTELIGENTE (RAG) ---
import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/chat.bundle.es.js';

function initChat(selectedTheme = 'light') {
    // Clean up existing chat widget if it exists to avoid duplication
    const existingChat = document.querySelector('div#n8n-chat') || document.querySelector('.n8n-chat-widget');
    if (existingChat) {
        existingChat.remove();
    }

    createChat({
        webhookUrl: 'https://n8n-automatizacion.178.105.8.162.sslip.io/webhook/a8d485bd-7592-47c6-8364-a483d80ddbc2/chat',
        theme: selectedTheme,
        showWelcomeScreen: true,
        initialMessages: [
            '¡Hola! 👋 Soy tu asistente financiero.',
            '¿En qué puedo ayudarte hoy?'
        ],
        starterPrompts: [
        { 
            label: 'Resumen de mes', 
            message: 'Por favor, analízame las facturas de este mes y dame un resumen financiero.' 
        },
        { 
            label: 'Buscar factura', 
            message: 'Necesito que me ayudes a buscar una factura específica.' 
        },
        { 
            label: 'Gastos totales', 
            message: '¿Cuáles han sido los gastos totales registrados hasta ahora?' 
        }
    ],
        i18n: {
            en: {
                title: 'Asistente de Facturas',
                subtitle: 'Consulta inteligente de tus documentos',
                inputPlaceholder: 'Escribe tu duda...',
                getStarted: 'Comenzar',
            },
            es: {
                title: 'Asistente de Facturas',
                subtitle: 'Consulta inteligente de tus documentos',
                inputPlaceholder: 'Escribe tu duda...',
                getStarted: 'Comenzar',
            }
        },
        theme: {
            mode: selectedTheme,
            customCSS: selectedTheme === 'dark' ? `
                .chat-body, .chat-layout, .chat-footer, .chat-messages-list { 
                    background-color: #0f172a !important; 
                    background: #0f172a !important;
                }
                .chat-message.chat-message-from-bot { background-color: #1e293b !important; color: white !important; }
                .chat-message.chat-message-from-user { background-color: #030086 !important; color: white !important; }
                .chat-input { background-color: #0f172a !important; border-top: 1px solid #334155 !important; }
                .chat-input textarea { background-color: #1e293b !important; color: white !important; border-color: #475569 !important; }
            ` : ''
        }
        
    });

    // Limpiar mensajes de error crudo de n8n
setTimeout(() => {
    const chatContainer = document.getElementById('n8n-chat');
    if (!chatContainer) return;

    const observer = new MutationObserver(() => {
        chatContainer.querySelectorAll('.chat-message-from-bot').forEach(msg => {
            if (msg.dataset.sanitized) return;
            const text = msg.innerText || msg.textContent || '';

            const esError = text.includes('Error in workflow') 
                || text.includes('"message"')
                || text.startsWith('{')
                || text.startsWith('[');

            if (esError) {
                msg.textContent = '⚠️ El asistente tiene un problema técnico temporal. Por favor, inténtalo de nuevo en unos minutos.';
            }
            msg.dataset.sanitized = 'true';
        });
    });

    observer.observe(chatContainer, { childList: true, subtree: true });
}, 1500); // esperar a que el widget cargue
}

// Detectar preferencia de tema inicial
const initialTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
initChat(initialTheme);

// --- 3. LÓGICA DEL MODO OSCURO ---
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

// --- 4. LÓGICA DEL FORMULARIO DE SUBIDA DE FACTURAS ---
// --- 4. LÓGICA DEL FORMULARIO DE SUBIDA DE FACTURAS ---
const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('file-name');
const fileInfoContainer = document.getElementById('file-info');

// 1. Mostrar nombre de archivo y VISTA PREVIA DEL PDF al seleccionar
if (fileInput) {
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            fileNameDisplay.textContent = `Archivo seleccionado: ${file.name}`;
            fileInfoContainer.classList.remove('hidden');

            // --- VISTA PREVIA DEL PDF ORIGINAL ---
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

        // Actualizar UI para carga
        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = 'Enviando...';
        
        statusCard.classList.remove('hidden');
        statusTitle.textContent = 'Procesando...';
        statusMessage.textContent = 'Enviando factura a la IA...';
        statusProgress.style.width = '30%';
        statusPercentage.textContent = '30%';
        statusIcon.textContent = 'sync';
        statusIcon.classList.add('animate-spin');
        
        // Mostrar animación de lectura en el visor derecho
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
                
                // Éxito en barra lateral
                statusTitle.textContent = 'Completado';
                statusMessage.textContent = result.mensaje || '¡Factura procesada con éxito!';
                statusProgress.style.width = '100%';
                statusPercentage.textContent = '100%';
                statusIcon.textContent = 'check_circle';
                statusIcon.classList.remove('animate-spin');
                statusIconContainer.classList.remove('bg-secondary-fixed', 'dark:bg-slate-700');
                statusIconContainer.classList.add('bg-green-100', 'dark:bg-green-900/40');
                statusIcon.classList.add('text-green-600', 'dark:text-green-400');
                
                // --- 2. VISTA PREVIA DE "FACTURA REAL" (TICKET DIGITAL) ---
                if (previewContainer) {
                    // Tomamos los datos de n8n (soporta mayúsculas y minúsculas por si acaso)
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

                                <div class="mt-8 flex justify-center opacity-30 dark:invert">
                                    <svg class="h-10 w-full" preserveAspectRatio="none" viewBox="0 0 100 10">
                                        <path d="M0,0 h2 v10 h-2 z M4,0 h1 v10 h-1 z M7,0 h3 v10 h-3 z M12,0 h1 v10 h-1 z M15,0 h4 v10 h-4 z M21,0 h2 v10 h-2 z M25,0 h1 v10 h-1 z M28,0 h3 v10 h-3 z M33,0 h2 v10 h-2 z M37,0 h1 v10 h-1 z M40,0 h4 v10 h-4 z M46,0 h2 v10 h-2 z M50,0 h1 v10 h-1 z M53,0 h3 v10 h-3 z M58,0 h2 v10 h-2 z M62,0 h1 v10 h-1 z M65,0 h4 v10 h-4 z M71,0 h2 v10 h-2 z M75,0 h1 v10 h-1 z M78,0 h3 v10 h-3 z M83,0 h2 v10 h-2 z M87,0 h1 v10 h-1 z M90,0 h4 v10 h-4 z M96,0 h2 v10 h-2 z" fill="currentColor"/>
                                    </svg>
                                </div>
                            </div>

                        </div>
                    `;
                }

                fileInput.value = ''; 
                fileInfoContainer.classList.add('hidden');
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
            
            // Si hay error, mostrar un visor de error
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

// --- 5. FIX DE ACTIVACIÓN DEL BOTÓN DE ENVÍO DEL CHAT Y AJUSTES VARIOS ---
setInterval(() => {
    // 1. Forzar habilitación del botón de envío
    const sendButton = document.querySelector('.chat-input-send-button');
    if (sendButton && sendButton.hasAttribute('disabled')) {
        sendButton.removeAttribute('disabled');
        sendButton.style.opacity = "1";
        sendButton.style.cursor = "pointer";
        sendButton.style.pointerEvents = "auto";
    }
    
    // 2. Ajuste manual de título si i18n falla
    const chatTitle = document.querySelector('#n8n-chat .chat-header h1');
    if (chatTitle && chatTitle.textContent.includes('Hi there')) {
        chatTitle.textContent = 'Asistente de Facturas';
    }
    const chatSubtitle = document.querySelector('#n8n-chat .chat-header p');
    if (chatSubtitle && chatSubtitle.textContent.includes('Start a chat')) {
        chatSubtitle.textContent = 'Consulta inteligente de tus documentos';
    }
}, 1000);


// =======================================================================
// --- 6. INTEGRACIÓN REAL CON N8N (VERSIÓN OPTIMIZADA) ---
//
// MEJORAS IMPLEMENTADAS:
//  1. Caché en memoria: los datos se guardan y reutilizan durante la sesión.
//  2. Promise deduplication: si dos navegaciones disparan la misma llamada
//     simultáneamente, solo se hace UNA petición real.
//  3. Precarga silenciosa: al arrancar la app ya se empieza a buscar datos.
//  4. Skeleton loaders inmediatos: el UI responde al instante.
//  5. Renderizado incremental del dashboard con datos cacheados primero.
// =======================================================================

const REAL_API_URL = 'https://n8n-automatizacion.178.105.8.162.sslip.io/webhook/api-portal';

// ── Capa de Caché ─────────────────────────────────────────────────────────────
const Cache = {
    _data: null,               // datos en memoria
    _fetchPromise: null,       // promesa en vuelo (evita peticiones duplicadas)
    _timestamp: null,
    TTL_MS: 5 * 60 * 1000,    // 5 minutos de vida útil

    isValid() {
        return this._data && this._timestamp && (Date.now() - this._timestamp < this.TTL_MS);
    },

    // Devuelve siempre una Promise. Si hay una petición en vuelo, reutiliza la misma.
    async fetch() {
        if (this.isValid()) return this._data;            // 1. Caché caliente
        if (this._fetchPromise) return this._fetchPromise; // 2. Petición en vuelo

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
                this._fetchPromise = null; // liberar para la próxima vez
            });

        return this._fetchPromise;
    },

    // Invalida el caché manualmente (útil tras subir una factura)
    invalidate() {
        this._data = null;
        this._timestamp = null;
    }
};

// ── Utilidades de renderizado ──────────────────────────────────────────────────

// Skeleton loader para la tabla de facturas
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

// Skeleton loader para el dashboard
function renderDashboardSkeleton() {
    ['dash-procesadas', 'dash-pendientes', 'dash-volumen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<div class="h-12 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>';
    });
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
async function loadRealDashboardData() {
    const elProcesadas = document.getElementById('dash-procesadas');
    const elPendientes = document.getElementById('dash-pendientes');
    const elVolumen    = document.getElementById('dash-volumen');
    const elMesActual  = document.getElementById('dash-mes-actual');
    if (!elProcesadas) return;

    // Fecha dinámica (no depende de la API, se muestra al instante)
    if (elMesActual) {
        const fecha = new Date();
        const nombreMes = fecha.toLocaleString('es-ES', { month: 'long' });
        elMesActual.textContent = `${nombreMes.charAt(0).toUpperCase()}${nombreMes.slice(1)} ${fecha.getFullYear()}`;
    }

    // Si ya hay datos válidos en caché, pintamos inmediatamente (0 ms de espera)
    if (Cache.isValid()) {
        renderDashboardStats(Cache._data, elProcesadas, elPendientes, elVolumen);
        return;
    }

    // Sin caché: mostramos skeleton y pedimos datos
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

// CÓDIGO A REEMPLAZAR EN app.js:
function renderDashboardStats(invoices, elProcesadas, elPendientes, elVolumen) {
    let totalProcesadas = 0, totalPendientes = 0, volumenTotal = 0;

    invoices.forEach(inv => {
        if (inv.status === 'PROCESADO') totalProcesadas++;
        else totalPendientes++;
        volumenTotal += parseFloat(String(inv.amount).replace(',', '.')) || 0;
    });

    const formatoMoneda = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
    }).format(volumenTotal);

    elProcesadas.textContent = totalProcesadas;
    elPendientes.textContent = totalPendientes;
    elVolumen.textContent    = formatoMoneda;

    // --- NUEVA LÓGICA PARA EL BADGE ---
    const badgeProcesadas = document.getElementById('badge-procesadas');
    const textProcesadas = document.getElementById('text-procesadas');
    const iconProcesadas = document.getElementById('icon-procesadas');

    if (badgeProcesadas && textProcesadas && iconProcesadas) {
        const totalFacturas = totalProcesadas + totalPendientes;
        
        // Ejemplo de cálculo: Porcentaje de éxito (facturas procesadas vs totales)
        // Puedes cambiar esta fórmula por crecimiento mensual si tu API te da fechas
        const porcentaje = totalFacturas > 0 ? Math.round((totalProcesadas / totalFacturas) * 100) : 0;
        
        textProcesadas.textContent = `${porcentaje}%`;

        // Cambiar colores dinámicamente según el resultado
        if (porcentaje >= 50) {
            // Estilos positivos (Verde)
            badgeProcesadas.className = "flex items-center font-bold text-sm px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400";
            iconProcesadas.textContent = "trending_up";
        } else {
            // Estilos de alerta/negativos (Rojo/Naranja)
            badgeProcesadas.className = "flex items-center font-bold text-sm px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400";
            iconProcesadas.textContent = "trending_down";
        }
    }
}

// ── Tabla de Facturas ──────────────────────────────────────────────────────────
async function loadRealInvoicesTable() {
    const tbody = document.querySelector('#invoices-section tbody');
    if (!tbody) return;

    // Si hay caché, pintamos la tabla directamente sin ningún loader
    if (Cache.isValid()) {
        renderInvoiceRows(Cache._data, tbody);
        return;
    }

    // Sin caché: skeleton inmediato
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
                        <button onclick="Cache.invalidate(); loadRealInvoicesTable()"
                            class="mt-2 text-xs text-primary underline">
                            Reintentar
                        </button>
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

    // Usamos un DocumentFragment para un solo reflow del DOM
    const fragment = document.createDocumentFragment();

    invoices.forEach(inv => {
        console.log("Datos de la factura:", inv.id, inv);
        
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
                <span class="px-3 py-1 ${isProcessed
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                    : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'}
                    rounded-full text-[10px] font-bold uppercase tracking-wider">
                    ${inv.status}
                </span>
            </td>`;
        fragment.appendChild(tr);
    });

    tbody.innerHTML = '';
    tbody.appendChild(fragment); // Un único reflow
}

// ── Previsualización PDF ───────────────────────────────────────────────────────
async function previewInvoice(invoiceId) {
    const previewContainer = document.querySelector('#upload-section .lg\\:col-span-5 div');
    if (!previewContainer) return;
    const pdfUrl = `${REAL_API_URL}-preview?id=${invoiceId}`;
    previewContainer.innerHTML = `<iframe src="${pdfUrl}" class="w-full h-[500px] border-none rounded-lg" title="Factura ${invoiceId}"></iframe>`;
}

// ── Precarga silenciosa al arrancar ───────────────────────────────────────────
// Lanzamos la petición en background sin bloquear el primer render.
// Cuando el usuario navegue al dashboard o facturas, el caché ya estará listo.
window.addEventListener('load', () => {
    setTimeout(() => Cache.fetch().catch(() => {}), 300);
});

// ── Invalidar caché tras subir una factura (añadir al bloque de éxito del upload) ──
// En el bloque de éxito del formulario de subida (sección 4), añade esta línea:
//   Cache.invalidate();
// Así la próxima visita al dashboard o facturas verá los datos frescos.

// Exponemos Cache globalmente para que el botón "Reintentar" funcione
window.Cache = Cache;

// Initial Load
handleRouting();
