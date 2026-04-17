// --- 1. INICIALIZACIÓN DEL ASISTENTE INTELIGENTE (RAG) ---
import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/chat.bundle.es.js';

// Función para inicializar o actualizar el chat con el tema correcto
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
            en: {
                title: 'Asistente de Facturas',
                subtitle: 'Consulta inteligente de tus documentos',
                inputPlaceholder: 'Escribe tu duda...',
            }
        }
    });
}

// Inicialización por defecto
initChat('light');

// --- 2. LÓGICA DEL MODO OSCURO (BOTÓN ARRIBA A LA DERECHA) ---
const themeBtn = document.getElementById('theme-toggle');

if (themeBtn) {
    themeBtn.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        
        // Cambiar el atributo en el HTML para el CSS
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Cambiar el icono del botón
        themeBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        
        // Reiniciar el chat con el nuevo tema visual
        initChat(newTheme);
    });
}

// --- 3. LÓGICA DEL FORMULARIO DE SUBIDA DE FACTURAS ---
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const fileInput = document.getElementById('fileInput');
    const submitBtn = document.getElementById('submitBtn');
    const statusDiv = document.getElementById('status');
    
    const file = fileInput.files[0];
    if (!file) return;

    const N8N_WEBHOOK_URL = 'https://n8n-automatizacion.178.105.8.162.sslip.io/webhook/subir-factura';

    const formData = new FormData();
    formData.append("attachment_0", file);

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    statusDiv.textContent = 'Procesando factura, por favor espera...';
    statusDiv.className = '';

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            body: formData
        });

        // Esperamos la respuesta final del flujo para dar un resultado real
        const result = await response.json();

        if (response.ok && result) {
            // Si el flujo devuelve un error específico (ej. "no es una factura") lo capturamos
            if (result.error_procesamiento) {
                throw new Error(result.error_procesamiento);
            }
            
            statusDiv.textContent = '¡Factura procesada con éxito y registrada en el sistema!';
            statusDiv.className = 'success';
            fileInput.value = ''; 
        } else {
            throw new Error('El servidor de automatización no pudo procesar el archivo.');
        }
    } catch (error) {
        statusDiv.textContent = `Error: ${error.message}`;
        statusDiv.className = 'error';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar a Procesar';
    }
});

// --- 4. FIX DE ACTIVACIÓN DEL BOTÓN DE ENVÍO DEL CHAT ---
// Revisa cada segundo si el botón de n8n está bloqueado y lo activa a la fuerza
setInterval(() => {
    const sendButton = document.querySelector('.chat-input-send-button');
    if (sendButton && sendButton.hasAttribute('disabled')) {
        sendButton.removeAttribute('disabled');
        sendButton.style.opacity = "1";
        sendButton.style.cursor = "pointer";
        sendButton.style.pointerEvents = "auto";
    }
}, 1000);
