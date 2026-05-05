import { N8N_CHAT_WEBHOOK_URL, HISTORIAL_API_URL } from '../config.js';
import { apiFetch } from '../api.js';

// Dynamic import to avoid blocking the entire module chain if CDN fails
let createChat = null;

async function loadChatSDK() {
    if (createChat) return createChat;
    try {
        const module = await import('https://cdn.jsdelivr.net/npm/@n8n/chat/chat.bundle.es.js');
        createChat = module.createChat;
        return createChat;
    } catch (err) {
        console.warn('⚠️ No se pudo cargar el SDK del chat:', err);
        return null;
    }
}

async function waitForElement(selector, timeoutMs = 3000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const el = document.querySelector(selector);
        if (el) return el;
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return null;
}

async function ensureChatWindowOpen() {
    const chatToggle = await waitForElement('.chat-window-toggle');
    if (!chatToggle) return;

    const chatWindow = document.querySelector('.chat-window');
    const isOpen = !!(chatWindow && chatWindow.offsetParent !== null && !chatWindow.classList.contains('hidden'));
    if (!isOpen) chatToggle.click();
}

export async function initChat(selectedTheme = 'light', isHistory = false) {
    const chatFn = await loadChatSDK();
    if (!chatFn) {
        console.warn('Chat SDK no disponible. Saltando inicialización del chat.');
        return;
    }

    // 1. Limpiar widget existente
    const existingChat = document.querySelector('div#n8n-chat') || document.querySelector('.n8n-chat-widget');
    if (existingChat) {
        existingChat.remove();
    }

    // 2. Recuperar o crear sessionId persistente
    let sessionId = localStorage.getItem('sessionId') || localStorage.getItem('n8n_chat_sessionId');
    if (!sessionId) {
        sessionId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    localStorage.setItem('sessionId', sessionId);
    localStorage.setItem('n8n_chat_sessionId', sessionId);

    // 3. Crear el chat
    const initialMessages = isHistory
        ? []
        : [
            '¡Hola! 👋 Soy tu asistente financiero.',
            '¿En qué puedo ayudarte hoy?'
        ];

    chatFn({
        webhookUrl: N8N_CHAT_WEBHOOK_URL,
        chatSessionKey: 'sessionId',
        loadPreviousSession: true,
        theme: selectedTheme,
        sessionId: sessionId,
        showWelcomeScreen: false,
        initialMessages,
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

    // 4. Lógica secundaria (Errores y Botones Inyectados)
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

        if (!isHistory) {
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

                    // Ocultar prompts cuando el usuario empiece a escribir
                    const waitForTextarea = setInterval(() => {
                        const chatTextarea = document.querySelector('.chat-input textarea');
                        if (chatTextarea) {
                            clearInterval(waitForTextarea);
                            chatTextarea.addEventListener('input', () => {
                                promptsContainer.style.opacity = '0';
                                promptsContainer.style.transition = 'opacity 0.3s ease';
                                setTimeout(() => promptsContainer.style.display = 'none', 300);
                            }, { once: true });
                        }
                    }, 200);
                }
                
            }, 500); 
        }

    }, 1500);
}

export async function loadChatHistory() {
    const ul = document.getElementById('assistant-chat-history');
    if (!ul) return;

    ul.innerHTML = `
        <li class="text-center py-4">
            <div class="h-4 w-3/4 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3"></div>
            <div class="h-4 w-1/2 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </li>`;

    try {
        const res = await apiFetch(HISTORIAL_API_URL);
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
                <button data-session-id="${s.session_id}" 
                    class="chat-history-item session-btn w-full text-left p-3 rounded-xl group">
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

        // Add event listeners to session buttons
        ul.querySelectorAll('.session-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const sessionId = btn.getAttribute('data-session-id');
                await openSession(sessionId);
            });
        });

    } catch (error) {
        console.error('Error cargando historial:', error);
        ul.innerHTML = `<li class="text-center py-8 text-sm text-red-500 font-medium">Error al cargar el historial.</li>`;
    }
}

export async function openSession(sessionId) {
    localStorage.setItem('sessionId', sessionId);
    localStorage.setItem('n8n_chat_sessionId', sessionId);
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    await initChat(theme, true);
    await ensureChatWindowOpen();
}

export async function startNewSession() {
    const newSessionId = crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).substr(2);
    localStorage.setItem('sessionId', newSessionId);
    localStorage.setItem('n8n_chat_sessionId', newSessionId);

    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    await initChat(theme, false);
    await ensureChatWindowOpen();
}

export function initChatAutoUnlock() {
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
}
