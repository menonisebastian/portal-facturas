// ─────────────────────────────────────────────────────────────
// utils.js
// Funciones de utilidad, formateo y EventBus (PubSub)
// ─────────────────────────────────────────────────────────────

// ── EventBus (PubSub) ──────────────────────────────────────
// Patrón Publicador/Suscriptor para comunicación desacoplada
// entre módulos. Uso:
//   import { EventBus } from '../utils.js';
//   EventBus.on('invoice:uploaded', data => { ... });
//   EventBus.emit('invoice:uploaded', { fileName: 'x.pdf' });
// ────────────────────────────────────────────────────────────

export const EventBus = {
    _listeners: {},

    /**
     * Suscribirse a un evento.
     * @param {string} event
     * @param {Function} callback
     * @returns {Function} unsubscribe function
     */
    on(event, callback) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(callback);
        // Devuelve función para desuscribirse
        return () => {
            this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
        };
    },

    /**
     * Emitir un evento a todos los suscriptores.
     * @param {string} event
     * @param {*} data
     */
    emit(event, data) {
        (this._listeners[event] || []).forEach(cb => {
            try { cb(data); }
            catch (err) { console.error(`EventBus error [${event}]:`, err); }
        });
    },

    /**
     * Suscribirse una sola vez (se auto-desuscribe tras la primera llamada).
     * @param {string} event
     * @param {Function} callback
     */
    once(event, callback) {
        const unsub = this.on(event, (data) => {
            unsub();
            callback(data);
        });
        return unsub;
    },
};

// ── Eventos conocidos (documentación) ──────────────────────
// 'auth:expired'         → sesión expirada o 401, redirigir al login
// 'invoice:uploaded'     → factura subida con éxito { fileName, result }
// 'invoice:uploadError'  → error al subir factura { fileName, error }
// 'cache:invalidated'    → caché de datos invalidada
// 'theme:changed'        → tema cambiado { theme: 'dark'|'light' }

// ── Tasas de cambio ────────────────────────────────────────

// Tasas de conversión aproximadas a EUR (actualizar periódicamente o usar API)
export let FX_TO_EUR = {
    EUR: 1,
    USD: 0.92,
    GBP: 1.17,
    MXN: 0.054,
    COP: 0.00023,
    ARS: 0.001,
};

// ── Formateo de fechas ─────────────────────────────────────

// Función para convertir números de Excel (Serial Dates) a fecha legible
export function excelToJSDate(serial) {
    if (!serial || isNaN(serial)) return serial; // Si ya es texto, lo deja igual
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    return date.toLocaleDateString('es-ES'); // Formato DD/MM/YYYY
}

// ── Conversión de moneda ───────────────────────────────────

export function toEUR(amount, currency) {
    const rate = FX_TO_EUR[currency?.toUpperCase()] ?? 1;
    return amount * rate;
}

// ── Parser de cantidades ───────────────────────────────────

// Parser robusto: maneja "1.250,50" (ES) y "1,250.50" (EN) y "1250.50"
export function parseAmount(raw) {
    if (!raw && raw !== 0) return 0;
    const str = String(raw).trim();
    // Si tiene coma Y punto: decidir cuál es el decimal
    if (str.includes('.') && str.includes(',')) {
        // El último separador es el decimal
        const lastDot   = str.lastIndexOf('.');
        const lastComma = str.lastIndexOf(',');
        if (lastComma > lastDot) {
            // Formato europeo: 1.250,50
            return parseFloat(str.replace(/\./g, '').replace(',', '.'));
        } else {
            // Formato anglosajón: 1,250.50
            return parseFloat(str.replace(/,/g, ''));
        }
    }
    // Solo coma → separador decimal europeo
    if (str.includes(',') && !str.includes('.')) {
        return parseFloat(str.replace(',', '.'));
    }
    return parseFloat(str) || 0;
}

// ── Validación de archivos ─────────────────────────────────

const ALLOWED_MIME_TYPES = [
    'application/pdf',
];

const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Valida un archivo antes de subirlo.
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFile(file) {
    if (!file) {
        return { valid: false, error: 'No se ha seleccionado ningún archivo.' };
    }

    // Validar tipo MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        const extension = file.name.split('.').pop()?.toUpperCase() || '?';
        return {
            valid: false,
            error: `Formato no permitido (.${extension}). Solo se aceptan archivos PDF.`,
        };
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        return {
            valid: false,
            error: `El archivo pesa ${sizeMB} MB. El máximo permitido es ${MAX_FILE_SIZE_MB} MB.`,
        };
    }

    // Validar que no esté vacío
    if (file.size === 0) {
        return { valid: false, error: 'El archivo está vacío.' };
    }

    return { valid: true };
}
