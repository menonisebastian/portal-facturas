import { Cache } from '../api.js';
import { parseAmount, toEUR } from '../utils.js';

// ─── Skeleton ─────────────────────────────────────────────────

export function renderDashboardSkeleton() {
    ['dash-procesadas', 'dash-pendientes', 'dash-volumen'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="spinner-branded"></div>
                <span class="loader-text">Cargando</span>
            </div>`;
    });

    const badge = document.getElementById('badge-procesadas');
    if (badge) { badge.style.opacity = '0'; badge.style.transition = 'opacity 0.4s ease'; }

    const pendientesIcon = document.querySelector('#dash-pendientes')?.closest('.stat-card')?.querySelector('.w-12');
    if (pendientesIcon) { pendientesIcon.style.opacity = '0'; pendientesIcon.style.transition = 'opacity 0.4s ease'; }

    const mesActual = document.getElementById('dash-mes-actual');
    if (mesActual) {
        mesActual.innerHTML = `<div class="skeleton-shimmer skeleton-line-sm" style="width: 80px; display: inline-block;"></div>`;
    }

    const sectionTitle = document.querySelector('#dashboard-section h1');
    if (sectionTitle && !sectionTitle.querySelector('.loading-dots')) {
        const dots = document.createElement('span');
        dots.className = 'loading-dots';
        dots.innerHTML = '<span></span><span></span><span></span>';
        sectionTitle.appendChild(dots);
    }
}

function clearLoadingIndicator() {
    const dots = document.querySelector('#dashboard-section h1 .loading-dots');
    if (dots) dots.remove();
}

function setCurrentMonth(el) {
    if (!el) return;
    const fecha = new Date();
    const nombreMes = fecha.toLocaleString('es-ES', { month: 'long' });
    el.textContent = `${nombreMes.charAt(0).toUpperCase()}${nombreMes.slice(1)} ${fecha.getFullYear()}`;
}

function currentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Carga principal ─────────────────────────────────────────

export async function loadRealDashboardData() {
    const elProcesadas = document.getElementById('dash-procesadas');
    const elPendientes = document.getElementById('dash-pendientes');
    const elVolumen    = document.getElementById('dash-volumen');
    const elMesActual  = document.getElementById('dash-mes-actual');
    if (!elProcesadas) return;

    const month = currentMonthKey();

    if (Cache.isValid(month)) {
        clearLoadingIndicator();
        setCurrentMonth(elMesActual);
        renderDashboardStats(Cache.getData(month), elProcesadas, elPendientes, elVolumen);
        animateStatCards();
        return;
    }

    renderDashboardSkeleton();

    try {
        const invoices = await Cache.fetch(month);
        clearLoadingIndicator();
        setCurrentMonth(elMesActual);
        renderDashboardStats(invoices, elProcesadas, elPendientes, elVolumen);
        animateStatCards();
    } catch (error) {
        console.error('Error cargando Dashboard:', error);
        clearLoadingIndicator();
        setCurrentMonth(elMesActual);
        [elProcesadas, elPendientes, elVolumen].forEach(el => {
            if (el) el.innerHTML = '<span class="text-base text-red-500">Error</span>';
        });
    }
}

function animateStatCards() {
    const grid = document.querySelector('#dashboard-section .grid');
    if (grid) {
        grid.classList.remove('animate-stagger');
        void grid.offsetWidth;
        grid.classList.add('animate-stagger');
    }
}

// ─── Render de estadísticas ───────────────────────────────────

export function renderDashboardStats(invoices, elProcesadas, elPendientes, elVolumen) {
    let totalProcesadas = 0, totalPendientes = 0, volumenEUR = 0;

    (invoices || []).forEach(inv => {
        if (inv.status === 'PROCESADO') totalProcesadas++;
        else totalPendientes++;

        const amount   = parseAmount(inv.amount);
        const currency = (inv.currency || 'EUR').toUpperCase();
        volumenEUR += toEUR(amount, currency);
    });

    const formatoMoneda = new Intl.NumberFormat('es-ES', {
        style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
    }).format(volumenEUR);

    elProcesadas.textContent = totalProcesadas;
    elPendientes.textContent = totalPendientes;
    elVolumen.textContent    = formatoMoneda;

    // Restaurar elementos ocultos durante el skeleton
    const pendientesIcon = document.querySelector('#dash-pendientes')?.closest('.stat-card')?.querySelector('.w-12');
    if (pendientesIcon) pendientesIcon.style.opacity = '1';

    const badgeProcesadas = document.getElementById('badge-procesadas');
    const textProcesadas  = document.getElementById('text-procesadas');
    const iconProcesadas  = document.getElementById('icon-procesadas');

    if (badgeProcesadas && textProcesadas && iconProcesadas) {
        badgeProcesadas.style.opacity = '1';

        const totalFacturas = totalProcesadas + totalPendientes;
        const porcentaje = totalFacturas > 0 ? Math.round((totalProcesadas / totalFacturas) * 100) : 0;
        textProcesadas.textContent = `${porcentaje}%`;

        if (porcentaje >= 50) {
            badgeProcesadas.className = 'flex items-center font-bold text-sm px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400';
            iconProcesadas.textContent = 'trending_up';
        } else {
            badgeProcesadas.className = 'flex items-center font-bold text-sm px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400';
            iconProcesadas.textContent = 'trending_down';
        }
    }
}