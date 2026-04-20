// --- 1. CONFIGURACIÓN Y NAVEGACIÓN SPA ---

const sections = ['dashboard', 'invoices', 'upload', 'assistant'];
const navItems = document.querySelectorAll('.nav-item');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
const burgerBtn = document.getElementById('hamburger-menu');
const closeSidebarBtn = document.getElementById('close-sidebar');
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('portal_unlocked');
        window.location.href = 'login.html';
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
            item.classList.add('text-[#1111bb]', 'dark:text-[#bfc2ff]', 'bg-white/50', 'dark:bg-white/10', 'border-l-4', 'border-[#1111bb]');
            item.classList.remove('text-[#454555]', 'dark:text-slate-400');
        } else {
            item.classList.remove('text-[#1111bb]', 'dark:text-[#bfc2ff]', 'bg-white/50', 'dark:bg-white/10', 'border-l-4', 'border-[#1111bb]');
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
        showWelcomeScreen: false,
        initialMessages: [
            '¡Hola! 👋 Soy tu asistente financiero.',
            '¿En qué puedo ayudarte hoy?'
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


// --- 6. INTEGRACIÓN REAL CON N8N ---

const REAL_API_URL = 'https://n8n-automatizacion.178.105.8.162.sslip.io/webhook/api-portal';

// 1. Cargar datos del Dashboard desde Excel (OneDrive) vía n8n
async function loadRealDashboardData() {
    const elProcesadas = document.getElementById('dash-procesadas');
    const elPendientes = document.getElementById('dash-pendientes');
    const elVolumen = document.getElementById('dash-volumen');
    const elMesActual = document.getElementById('dash-mes-actual');

    if (!elProcesadas || !elPendientes || !elVolumen || !elMesActual) return;

    // --- 1. Formatear Fecha Dinámica ---
    const fecha = new Date();
    const nombreMes = fecha.toLocaleString('es-ES', { month: 'long' });
    const anio = fecha.getFullYear();
    // Capitalizamos la primera letra (ej: "abril" -> "Abril")
    const mesCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
    
    // Actualizamos el texto en el HTML
    elMesActual.textContent = `${mesCapitalizado} ${anio}`;

    // --- Mostrar estado de carga (animación de parpadeo) ---
    const loadingHtml = '<span class="text-3xl text-slate-400 animate-pulse">...</span>';
    elProcesadas.innerHTML = loadingHtml;
    elPendientes.innerHTML = loadingHtml;
    elVolumen.innerHTML = loadingHtml;

    try {
        const response = await fetch(REAL_API_URL);
        if (!response.ok) throw new Error('Error al conectar con n8n');
        
        const invoices = await response.json();
        
        // --- Variables matemáticas ---
        let totalProcesadas = 0;
        let totalPendientes = 0;
        let volumenTotal = 0;

        // --- Calcular estadísticas ---
        invoices.forEach(inv => {
            if (inv.status === 'PROCESADO') {
                totalProcesadas++;
            } else {
                totalPendientes++;
            }

            // Convertir el importe a número seguro (reemplaza comas por puntos si las hay en el Excel)
            let importe = parseFloat(String(inv.amount).replace(',', '.')) || 0;
            volumenTotal += importe;
        });

        // Dar formato de moneda europea (ej. 1.250,00 €)
        const formatoMoneda = new Intl.NumberFormat('es-ES', { 
            style: 'currency', 
            currency: 'EUR',
            maximumFractionDigits: 0 // Quitar decimales para que se vea más limpio como "$42k"
        }).format(volumenTotal);

        // --- Inyectar los resultados en el HTML ---
        elProcesadas.textContent = totalProcesadas;
        elPendientes.textContent = totalPendientes;
        elVolumen.textContent = formatoMoneda;

    } catch (error) {
        console.error('Error cargando Dashboard:', error);
        elProcesadas.innerHTML = '<span class="text-xl text-red-500">Error</span>';
        elPendientes.innerHTML = '<span class="text-xl text-red-500">Error</span>';
        elVolumen.innerHTML = '<span class="text-xl text-red-500">Error</span>';
    }
}

// 2. Cargar lista de facturas desde Excel (OneDrive) vía n8n
// 2. Cargar lista de facturas desde Excel (OneDrive) vía n8n
async function loadRealInvoicesTable() {
    const tbody = document.querySelector('#invoices-section tbody');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="px-6 py-10 text-center">
                <div class="flex flex-col items-center justify-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                    <p class="text-xs font-medium text-on-surface-variant">Cargando facturas desde Excel...</p>
                </div>
            </td>
        </tr>
    `;

    try {
        const response = await fetch(REAL_API_URL);
        if (!response.ok) throw new Error('Error al conectar con n8n');
        
        const invoices = await response.json();
        tbody.innerHTML = ''; 

        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-on-surface-variant">No hay facturas disponibles.</td></tr>';
            return;
        }

        invoices.forEach(inv => {
            // --- AQUÍ LA MAGIA: Convertimos la fecha de Excel a algo legible ---
            const fechaFormateada = excelToJSDate(inv.date);

            const row = `
                <tr class="hover:bg-primary-fixed/30 dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-outline-variant/10" onclick="previewInvoice('${inv.id}')">
                    <td class="px-6 py-4 font-bold text-primary dark:text-[#bfc2ff]">${inv.id}</td>
                    <td class="px-6 py-4 text-on-surface dark:text-white font-medium">${inv.client}</td>
                    <td class="px-6 py-4 text-sm text-on-surface-variant dark:text-slate-400">${fechaFormateada}</td>
                    <td class="px-6 py-4 font-bold dark:text-white">$${inv.amount}</td>
                    <td class="px-6 py-4">
                        <span class="px-3 py-1 ${inv.status === 'PROCESADO' ? 'bg-green-100 dark:bg-green-900/40 text-green-700' : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700'} rounded-full text-[10px] font-bold uppercase tracking-wider">
                            ${inv.status}
                        </span>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error cargando tabla:', error);
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500 text-sm">Error: ${error.message}</td></tr>`;
    }
}
// 3. Previsualizar PDF desde OneDrive/Qdrant
async function previewInvoice(invoiceId) {
    const previewContainer = document.querySelector('#upload-section .lg\\:col-span-5 div');
    if (!previewContainer) return;
    
    previewContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p class="text-xs">Cargando PDF...</p>
        </div>
    `;
    
    // Suponiendo que n8n devuelve el PDF binario (requeriría un nuevo flujo en n8n)
    const pdfUrl = `${REAL_API_URL}-preview?id=${invoiceId}`;
    previewContainer.innerHTML = `
        <iframe src="${pdfUrl}" class="w-full h-[500px] border-none rounded-lg" title="Factura ${invoiceId}"></iframe>
    `;
}


// Initial Load
handleRouting();
