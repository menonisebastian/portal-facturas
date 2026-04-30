/**
 * Notifications module – persists upload results in localStorage
 * and renders them in a dropdown panel from the header bell icon.
 */

const STORAGE_KEY = 'sp_notifications';
const MAX_ITEMS = 50;

// ─── Data layer ────────────────────────────────────────────

function getNotifications() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function saveNotifications(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
}

/**
 * Adds a notification entry.
 * @param {'success'|'error'} type
 * @param {string} fileName
 * @param {string} [message]
 */
export function addNotification(type, fileName, message = '') {
    const list = getNotifications();
    list.unshift({
        id: Date.now(),
        type,
        fileName,
        message,
        date: new Date().toISOString(),
        read: false,
    });
    saveNotifications(list);
    renderNotificationsList();
    updateBadge();
}

function markAllRead() {
    const list = getNotifications().map(n => ({ ...n, read: true }));
    saveNotifications(list);
    updateBadge();
}

function clearAllNotifications() {
    saveNotifications([]);
    renderNotificationsList();
    updateBadge();
}

// ─── Badge (red dot) ───────────────────────────────────────

function updateBadge() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    const unread = getNotifications().filter(n => !n.read).length;
    badge.classList.toggle('hidden', unread === 0);
    badge.textContent = unread > 9 ? '9+' : unread;
}

// ─── Render ────────────────────────────────────────────────

function formatDate(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;

    if (diff < 60_000) return 'Ahora mismo';
    if (diff < 3_600_000) return `Hace ${Math.floor(diff / 60_000)} min`;
    if (diff < 86_400_000) return `Hace ${Math.floor(diff / 3_600_000)} h`;

    return d.toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
}

function renderNotificationsList() {
    const container = document.getElementById('notif-list');
    if (!container) return;

    const list = getNotifications();

    if (!list.length) {
        container.innerHTML = `
            <div class="notif-empty">
                <span class="material-symbols-outlined text-4xl text-outline-variant dark:text-slate-600 mb-2">notifications_off</span>
                <p>Sin notificaciones</p>
            </div>`;
        return;
    }

    container.innerHTML = list.map(n => `
        <div class="notif-item ${n.read ? '' : 'notif-unread'}" data-id="${n.id}">
            <div class="notif-icon-wrapper notif-icon-${n.type}">
                <span class="material-symbols-outlined text-sm">
                    ${n.type === 'success' ? 'check_circle' : 'error'}
                </span>
            </div>
            <div class="notif-body">
                <p class="notif-filename">${escapeHTML(n.fileName)}</p>
                <p class="notif-message">${n.type === 'success' ? (n.message || 'Subida exitosa') : (n.message || 'Error al subir')}</p>
                <p class="notif-date">${formatDate(n.date)}</p>
            </div>
        </div>
    `).join('');
}

function escapeHTML(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
}

// ─── Panel toggle ──────────────────────────────────────────

function togglePanel() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;

    const isOpen = !panel.classList.contains('hidden');
    if (isOpen) {
        panel.classList.add('notif-panel-closing');
        setTimeout(() => {
            panel.classList.add('hidden');
            panel.classList.remove('notif-panel-closing');
        }, 200);
    } else {
        renderNotificationsList();
        panel.classList.remove('hidden');
        markAllRead();
    }
}

function closePanelOnOutsideClick(e) {
    const panel = document.getElementById('notif-panel');
    const btn = document.getElementById('notif-btn');
    if (!panel || panel.classList.contains('hidden')) return;
    if (!panel.contains(e.target) && !btn.contains(e.target)) {
        togglePanel();
    }
}

// ─── Init ──────────────────────────────────────────────────

export function initNotifications() {
    const btn = document.getElementById('notif-btn');
    if (btn) btn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePanel();
    });

    const clearBtn = document.getElementById('notif-clear-btn');
    if (clearBtn) clearBtn.addEventListener('click', clearAllNotifications);

    document.addEventListener('click', closePanelOnOutsideClick);

    updateBadge();
    renderNotificationsList();
}
