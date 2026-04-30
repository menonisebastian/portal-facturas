import { REAL_API_URL, CACHE_TTL_MS } from './config.js';
import { FX_TO_EUR } from './utils.js';

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

        this._fetchPromise = fetch(REAL_API_URL)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
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
    }
};

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
