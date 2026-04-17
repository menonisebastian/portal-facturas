// --- 1. INICIALIZACIÓN DEL ASISTENTE INTELIGENTE (RAG) DESDE CDN ---
import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/chat.bundle.es.js';

createChat({
    webhookUrl: 'https://n8n-automatizacion.178.105.8.162.sslip.io/webhook/a8d485bd-7592-47c6-8364-a483d80ddbc2/chat',
    title: 'Asistente de Facturas', // Esto cambia el "Hi there!"
    subtitle: 'Consulta inteligente de tus documentos', // Esto cambia el texto pequeño
    showWelcomeScreen: true,
    initialMessages: [
        '¡Hola! 👋 Soy tu asistente financiero.',
        '¿En qué puedo ayudarte hoy?'
    ],
    i18n: {
        en: {
            title: 'Asistente de Facturas',
            subtitle: 'Consulta inteligente de tus documentos',
            getStarted: 'Empezar chat',
            inputPlaceholder: 'Escribe tu duda...',
        }
    }
});

// --- 2. LÓGICA DEL FORMULARIO DE SUBIDA DE FACTURAS ---
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const fileInput = document.getElementById('fileInput');
    const submitBtn = document.getElementById('submitBtn');
    const statusDiv = document.getElementById('status');
    
    const file = fileInput.files[0];
    if (!file) return;

    // Webhook del Flujo 1 (El Ingestor)
    const N8N_WEBHOOK_URL = 'https://n8n-automatizacion.178.105.8.162.sslip.io/webhook/subir-factura';

    const formData = new FormData();
    formData.append("attachment_0", file);

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    statusDiv.textContent = '';
    statusDiv.className = '';

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            statusDiv.textContent = '¡Factura enviada y almacenada en Qdrant!';
            statusDiv.className = 'success';
            fileInput.value = ''; 
        } else {
            throw new Error('Error en el servidor');
        }
    } catch (error) {
        statusDiv.textContent = 'Error al enviar. Revisa la URL del Webhook o tu conexión.';
        statusDiv.className = 'error';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar a Procesar';
    }
});
