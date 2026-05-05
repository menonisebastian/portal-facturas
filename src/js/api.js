import { REAL_API_URL, CACHE_TTL_MS, SESSION_KEY } from './config.js';
import { FX_TO_EUR, EventBus } from './utils.js';

// ─────────────────────────────────────────────────────────────
// Centralized Fetch Wrapper
// ─────────────────────────────────────────────────────────────

/**
 * Wrapper around fetch with centralized error handling.
 * - 401/403 → emits 'auth:expired' and redirects to /login
 * - Network errors → throws with user-friendly message
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export async function apiFetch(url, options = {}) {
    let response;

    try {
        response = await fetch(url, options);
    } catch (networkError) {
        throw new Error('Error de conexión. Verifica tu red e inténtalo de nuevo.');
    }

    if (response.status === 401 || response.status === 403) {
        console.warn(`⚠️ API ${response.status}: sesión inválida o expirada.`);
        sessionStorage.removeItem(SESSION_KEY);
        EventBus.emit('auth:expired', { status: response.status, url });
        window.location.replace('/login');
        throw new Error('Sesión expirada. Redirigiendo al login...');
    }

    if (response.status >= 500) {
        throw new Error(`Error del servidor (HTTP ${response.status}). Inténtalo más tarde.`);
    }

    if (!response.ok) {
        throw new Error(`Error en la solicitud (HTTP ${response.status}).`);
    }

    return response;
}

// ─────────────────────────────────────────────────────────────
// Invoice Data Cache — por mes (yyyy-MM)
// ─────────────────────────────────────────────────────────────

export const Cache = {
    _data: {},          // { 'yyyy-MM': [...] }
    _promises: {},      // promesas en vuelo por mes
    _timestamps: {},    // timestamps por mes
    TTL_MS: CACHE_TTL_MS,

    /**
     * Devuelve el mes actual como 'yyyy-MM' si no se pasa argumento.
     */
    _currentMonth() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    },

    isValid(month) {
        const m = month || this._currentMonth();
        return !!(this._data[m] && this._timestamps[m] && (Date.now() - this._timestamps[m] < this.TTL_MS));
    },

    getData(month) {
        return this._data[month || this._currentMonth()] || null;
    },

    /**
     * Fetches invoice data for the given month (yyyy-MM).
     * Deduplicates concurrent requests for the same month.
     * @param {string} [month] - defaults to current month
     * @returns {Promise<Array>}
     */
    async fetch(month) {
        const m = month || this._currentMonth();

        if (this.isValid(m)) return this._data[m];
        if (this._promises[m]) return this._promises[m];

        const url = `${REAL_API_URL}?mes=${m}`;

        this._promises[m] = apiFetch(url)
            .then(res => res.json())
            .then(data => {
                // Si el servidor devuelve error o array vacío, tratar como vacío
                if (!data || data.error) return [];
                const arr = Array.isArray(data) ? data : [];
                this._data[m] = arr;
                this._timestamps[m] = Date.now();
                return arr;
            })
            .catch(err => {
                console.warn(`⚠️ Error cargando facturas de ${m}:`, err.message);
                throw err;
            })
            .finally(() => {
                delete this._promises[m];
            });

        return this._promises[m];
    },

    /**
     * Invalida la caché de un mes concreto o de todos los meses.
     * @param {string|null} [month]
     */
    invalidate(month = null) {
        if (month) {
            delete this._data[month];
            delete this._timestamps[month];
        } else {
            this._data = {};
            this._timestamps = {};
        }
        EventBus.emit('cache:invalidated', { month });
    },
};

// ─────────────────────────────────────────────────────────────
// FX Rates
// ─────────────────────────────────────────────────────────────

export async function fetchFXRates() {
    try {
        const res = await fetch('https://api.frankfurter.app/latest?base=EUR');
        if (!res.ok) throw new Error('Error al obtener tasas');
        const data = await res.json();
        Object.entries(data.rates).forEach(([code, rate]) => {
            FX_TO_EUR[code] = 1 / rate;
        });
        Cache.invalidate();
        console.log('✅ Tasas de cambio actualizadas:', new Date().toLocaleTimeString());
    } catch (err) {
        console.warn('⚠️ No se pudieron actualizar las tasas. Usando valores de fallback.', err);
    }
}