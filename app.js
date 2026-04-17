// --- 1. CONFIGURACIÓN Y NAVEGACIÓN SPA ---

const sections = ['dashboard', 'invoices', 'upload', 'assistant'];
const navItems = document.querySelectorAll('.nav-item');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
const burgerBtn = document.getElementById('hamburger-menu');
const closeSidebarBtn = document.getElementById('close-sidebar');

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

function showSection(sectionId) {
    sections.forEach(id => {
        const section = document.getElementById(`${id}-section`);
        if (section) {
            section.classList.toggle('hidden', id !== sectionId);
        }
    });

    // Update active nav item
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

    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
        toggleSidebar(true);
    }

    // Special logic for AI Assistant tab
    if (sectionId === 'assistant') {
        const chatToggle = document.querySelector('.chat-window-toggle');
        const chatWindow = document.querySelector('.chat-window');
        // If chat is not open, open it
        if (chatToggle && (!chatWindow || chatWindow.classList.contains('hidden') || chatWindow.style.display === 'none')) {
            chatToggle.click();
        }
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
const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('file-name');
const fileInfoContainer = document.getElementById('file-info');

// Mostrar nombre de archivo al seleccionar
if (fileInput) {
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileNameDisplay.textContent = `Archivo seleccionado: ${fileInput.files[0].name}`;
            fileInfoContainer.classList.remove('hidden');
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
        statusMessage.textContent = 'Enviando factura a Precision AI...';
        statusProgress.style.width = '30%';
        statusPercentage.textContent = '30%';
        statusIcon.textContent = 'sync';
        statusIcon.classList.add('animate-spin');

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
                if (result.error_procesamiento) {
                    throw new Error(result.error_procesamiento);
                }
                
                // Éxito
                statusTitle.textContent = 'Completado';
                statusMessage.textContent = '¡Factura procesada con éxito!';
                statusProgress.style.width = '100%';
                statusPercentage.textContent = '100%';
                statusIcon.textContent = 'check_circle';
                statusIcon.classList.remove('animate-spin');
                statusIconContainer.classList.remove('bg-secondary-fixed', 'dark:bg-slate-700');
                statusIconContainer.classList.add('bg-green-100', 'dark:bg-green-900/40');
                statusIcon.classList.add('text-green-600', 'dark:text-green-400');
                
                fileInput.value = ''; 
                fileInfoContainer.classList.add('hidden');
            } else {
                throw new Error('El servidor de automatización no pudo procesar el archivo.');
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
