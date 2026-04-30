import { REAL_API_URL, CACHE_TTL_MS, SESSION_KEY } from './config.js';
import { FX_TO_EUR, EventBus } from './utils.js';

// ─────────────────────────────────────────────────────────────
// Centralized Fetch Wrapper
// Intercepta errores HTTP globales (401, 403, 5xx) y emite
// eventos a través del EventBus para reacciones desacopladas.
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
        // Network failure (offline, DNS, CORS, etc.)
        throw new Error('Error de conexión. Verifica tu red e inténtalo de nuevo.');
    }

    // ── Auth errors → redirect to login ──
    if (response.status === 401 || response.status === 403) {
        console.warn(`⚠️ API ${response.status}: sesión inválida o expirada.`);
        sessionStorage.removeItem(SESSION_KEY);
        EventBus.emit('auth:expired', { status: response.status, url });
        window.location.replace('/login');
        // Throw to stop further processing in the caller
        throw new Error('Sesión expirada. Redirigiendo al login...');
    }

    // ── Server errors (5xx) ──
    if (response.status >= 500) {
        throw new Error(`Error del servidor (HTTP ${response.status}). Inténtalo más tarde.`);
    }

    // ── Client errors (4xx, excl. 401/403) ──
    if (!response.ok) {
        throw new Error(`Error en la solicitud (HTTP ${response.status}).`);
    }

    return response;
}

// ─────────────────────────────────────────────────────────────
// Invoice Data Cache
// ─────────────────────────────────────────────────────────────

export const Cache = {
    _data: null,               
    _fetchPromise: null,       
    _timestamp: null,
    TTL_MS: CACHE_TTL_MS,    

    isValid() {
        return this._data && this._timestamp && (Date.now() - this._timestamp < this.TTL_MS);
    },

    async fetch() {
        if (this.isValid()) return this._data;            
        if (this._fetchPromise) return this._fetchPromise; 

        this._fetchPromise = apiFetch(REAL_API_URL)
            .then(res => res.json())
            .then(data => {
                this._data = data;
                this._timestamp = Date.now();
                return data;
            })
            .finally(() => {
                this._fetchPromise = null; 
            });

        return this._fetchPromise;
    },

    invalidate() {
        this._data = null;
        this._timestamp = null;
        EventBus.emit('cache:invalidated');
    }
};

// ─────────────────────────────────────────────────────────────
// FX Rates
// ─────────────────────────────────────────────────────────────

export async function fetchFXRates() {
    try {
        const res = await fetch('https://api.frankfurter.app/latest?base=EUR');
        if (!res.ok) throw new Error('Error al obtener tasas');
        const data = await res.json();
        // data.rates = { USD: 1.09, GBP: 0.86, ... } → invertir a "cuántos EUR vale 1 unidad"
        Object.entries(data.rates).forEach(([code, rate]) => {
            FX_TO_EUR[code] = 1 / rate;
        });
        Cache.invalidate(); // ← Forzar recálculo con tipos reales
        console.log('✅ Tasas de cambio actualizadas:', new Date().toLocaleTimeString());
    } catch (err) {
        console.warn('⚠️ No se pudieron actualizar las tasas. Usando valores de fallback.', err);
    }
}
