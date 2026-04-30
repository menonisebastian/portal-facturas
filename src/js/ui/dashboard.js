import { Cache } from '../api.js';
import { parseAmount, toEUR } from '../utils.js';

export function renderDashboardSkeleton() {
    ['dash-procesadas', 'dash-pendientes', 'dash-volumen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<div class="h-12 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>';
    });
}

export async function loadRealDashboardData() {
    const elProcesadas = document.getElementById('dash-procesadas');
    const elPendientes = document.getElementById('dash-pendientes');
    const elVolumen    = document.getElementById('dash-volumen');
    const elMesActual  = document.getElementById('dash-mes-actual');
    if (!elProcesadas) return;

    if (elMesActual) {
        const fecha = new Date();
        const nombreMes = fecha.toLocaleString('es-ES', { month: 'long' });
        elMesActual.textContent = `${nombreMes.charAt(0).toUpperCase()}${nombreMes.slice(1)} ${fecha.getFullYear()}`;
    }

    if (Cache.isValid()) {
        renderDashboardStats(Cache._data, elProcesadas, elPendientes, elVolumen);
        return;
    }

    renderDashboardSkeleton();

    try {
        const invoices = await Cache.fetch();
        renderDashboardStats(invoices, elProcesadas, elPendientes, elVolumen);
    } catch (error) {
        console.error('Error cargando Dashboard:', error);
        [elProcesadas, elPendientes, elVolumen].forEach(el => {
            if (el) el.innerHTML = '<span class="text-base text-red-500">Error</span>';
        });
    }
}

export function renderDashboardStats(invoices, elProcesadas, elPendientes, elVolumen) {
    let totalProcesadas = 0, totalPendientes = 0, volumenEUR = 0;

    invoices.forEach(inv => {
        if (inv.status === 'PROCESADO') totalProcesadas++;
        else totalPendientes++;
        
        const amount   = parseAmount(inv.amount);
        const currency = (inv.currency || 'EUR').toUpperCase();
        volumenEUR += toEUR(amount, currency);   
    });

    const formatoMoneda = new Intl.NumberFormat('es-ES', {
        style: 'currency', currency: 'EUR', maximumFractionDigits: 0
    }).format(volumenEUR);

    elProcesadas.textContent = totalProcesadas;
    elPendientes.textContent = totalPendientes;
    elVolumen.textContent    = formatoMoneda;

    const badgeProcesadas = document.getElementById('badge-procesadas');
    const textProcesadas = document.getElementById('text-procesadas');
    const iconProcesadas = document.getElementById('icon-procesadas');

    if (badgeProcesadas && textProcesadas && iconProcesadas) {
        const totalFacturas = totalProcesadas + totalPendientes;
        const porcentaje = totalFacturas > 0 ? Math.round((totalProcesadas / totalFacturas) * 100) : 0;
        textProcesadas.textContent = `${porcentaje}%`;

        if (porcentaje >= 50) {
            badgeProcesadas.className = "flex items-center font-bold text-sm px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400";
            iconProcesadas.textContent = "trending_up";
        } else {
            badgeProcesadas.className = "flex items-center font-bold text-sm px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400";
            iconProcesadas.textContent = "trending_down";
        }
    }
}
