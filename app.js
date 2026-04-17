// --- 1. CONFIGURACIÓN Y NAVEGACIÓN SPA ---

const sections = ['dashboard', 'invoices', 'upload', 'assistant'];
const navItems = document.querySelectorAll('.nav-item');

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
            item.classList.add('text-[#1111bb]', 'bg-white/50', 'dark:bg-white/10', 'border-l-4', 'border-[#1111bb]');
            item.classList.remove('text-[#454555]', 'dark:text-slate-400');
        } else {
            item.classList.remove('text-[#1111bb]', 'bg-white/50', 'dark:bg-white/10', 'border-l-4', 'border-[#1111bb]');
            item.classList.add('text-[#454555]', 'dark:text-slate-400');
        }
    });

    // Special logic for AI Assistant
    if (sectionId === 'assistant') {
        const chatToggle = document.querySelector('.chat-window-toggle');
        const chatWindow = document.querySelector('.chat-window');
        if (chatToggle && (!chatWindow || chatWindow.classList.contains('hidden'))) {
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
    createChat({
        webhookUrl: 'https://n8n-automatizacion.178.105.8.162.sslip.io/webhook/a8d485bd-7592-47c6-8364-a483d80ddbc2/chat',
        theme: selectedTheme,
        title: 'Asistente de Facturas',
        subtitle: 'Consulta inteligente de tus documentos',
        initialMessages: [
            '¡Hola! 👋 Soy tu asistente financiero.',
            '¿En qué puedo ayudarte hoy?'
        ],
        i18n: {
            es: {
                title: 'Asistente de Facturas',
                subtitle: 'Consulta inteligente de tus documentos',
                inputPlaceholder: 'Escribe tu duda...',
            }
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
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        fileNameDisplay.textContent = `Archivo seleccionado: ${fileInput.files[0].name}`;
        fileInfoContainer.classList.remove('hidden');
    } else {
        fileInfoContainer.classList.add('hidden');
    }
});

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
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
            statusIconContainer.classList.replace('bg-secondary-fixed', 'bg-green-100');
            statusIcon.classList.add('text-green-600');
            
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
        statusIconContainer.classList.replace('bg-secondary-fixed', 'bg-red-100');
        statusIcon.classList.add('text-red-600');
        statusProgress.classList.replace('bg-primary', 'bg-red-500');
    } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Subir otra factura';
    }
});

// --- 5. FIX DE ACTIVACIÓN DEL BOTÓN DE ENVÍO DEL CHAT ---
setInterval(() => {
    const sendButton = document.querySelector('.chat-input-send-button');
    if (sendButton && sendButton.hasAttribute('disabled')) {
        sendButton.removeAttribute('disabled');
        sendButton.style.opacity = "1";
        sendButton.style.cursor = "pointer";
        sendButton.style.pointerEvents = "auto";
    }
}, 1000);
