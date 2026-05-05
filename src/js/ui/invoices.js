import { Cache } from '../api.js';
import { REAL_API_URL } from '../config.js';
import { excelToJSDate, parseAmount, toEUR } from '../utils.js';

// ─── Mes activo (módulo-global) ───────────────────────────────
let selectedMonth = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
})();

// ─── Selector de mes ─────────────────────────────────────────

/**
 * Inyecta el selector de mes en la sección de facturas (solo una vez).
 */
export function buildMonthSelector() {
    const section = document.getElementById('invoices-section');
    if (!section || document.getElementById('month-selector-wrapper')) return;

    const now = new Date();

    // Opciones: 2 meses futuros + mes actual + 23 meses pasados
    const options = [];
    for (let i = -2; i <= 23; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        const cap = label.charAt(0).toUpperCase() + label.slice(1);
        options.push({ value, label: cap });
    }

    const wrapper = document.createElement('div');
    wrapper.id = 'month-selector-wrapper';
    wrapper.className = 'flex flex-wrap items-center justify-between gap-4 mb-6';

    wrapper.innerHTML = `
        <div class="flex items-center gap-3">
            <label for="month-selector" class="text-xs font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400 whitespace-nowrap">
                Mes de subida
            </label>
            <div class="relative">
                <select id="month-selector"
                    class="appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 rounded-xl text-sm font-semibold text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary/30 cursor-pointer transition-all shadow-sm hover:shadow-md">
                    ${options.map(o => `
                        <option value="${o.value}" ${o.value === selectedMonth ? 'selected' : ''}>
                            ${o.label}
                        </option>`).join('')}
                </select>
                <span class="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400 text-base">
                    expand_more
                </span>
            </div>
        </div>
        <div id="invoices-month-badge"
            class="px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest bg-primary-fixed dark:bg-[#bfc2ff]/10 text-primary dark:text-[#bfc2ff]">
        </div>`;

    // Insertar antes de la tabla
    const tableContainer = section.querySelector('.data-table-container');
    if (tableContainer) {
        section.insertBefore(wrapper, tableContainer);
    } else {
        section.appendChild(wrapper);
    }

    // Listener
    wrapper.querySelector('#month-selector').addEventListener('change', (e) => {
        selectedMonth = e.target.value;
        Cache.invalidate(selectedMonth);
        loadRealInvoicesTable();
    });
}

function updateMonthBadge(count, month) {
    const badge = document.getElementById('invoices-month-badge');
    if (!badge) return;
    const d = new Date(month + '-01');
    const label = d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    const cap = label.charAt(0).toUpperCase() + label.slice(1);
    badge.textContent = `${count} factura${count !== 1 ? 's' : ''} · ${cap}`;
}

// ─── Skeleton & loaders ───────────────────────────────────────

/**
 * Renders a premium shimmer-skeleton table while invoice data is loading.
 */
export function renderTableSkeleton(tbody) {
    const cellWidths = [
        ['w-16', 'w-32', 'w-24', 'w-20', 'w-16'],
        ['w-20', 'w-28', 'w-20', 'w-16', 'w-14'],
        ['w-14', 'w-36', 'w-24', 'w-20', 'w-12'],
        ['w-18', 'w-24', 'w-20', 'w-16', 'w-16'],
        ['w-16', 'w-32', 'w-24', 'w-14', 'w-14'],
        ['w-20', 'w-28', 'w-20', 'w-20', 'w-16'],
    ];

    const rows = cellWidths.map((widths, rowIdx) => `
        <tr class="data-table-row skeleton-table-row" style="animation: fadeIn 0.3s ease ${rowIdx * 0.06}s both;">
            ${widths.map(w => `
                <td class="data-table-cell">
                    <div class="skeleton-shimmer skeleton-table-cell ${w}" style="max-width: 100%;"></div>
                </td>`).join('')}
        </tr>`).join('');

    tbody.innerHTML = rows;

    const container = document.querySelector('#invoices-section .data-table-container');
    if (container && !container.querySelector('.section-loader')) {
        container.style.position = 'relative';
        const loader = document.createElement('div');
        loader.className = 'section-loader';
        loader.id = 'invoices-loader';
        loader.innerHTML = `
            <div class="spinner-branded"></div>
            <p class="loader-text">
                Cargando facturas
                <span class="loading-dots"><span></span><span></span><span></span></span>
            </p>`;
        container.appendChild(loader);
    }

    const sectionTitle = document.querySelector('#invoices-section h2');
    if (sectionTitle && !sectionTitle.querySelector('.loading-dots')) {
        const dots = document.createElement('span');
        dots.className = 'loading-dots';
        dots.innerHTML = '<span></span><span></span><span></span>';
        sectionTitle.appendChild(dots);
    }
}

function clearInvoicesLoading() {
    const loader = document.getElementById('invoices-loader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 400);
    }
    const dots = document.querySelector('#invoices-section h2 .loading-dots');
    if (dots) dots.remove();
    const container = document.querySelector('#invoices-section .data-table-container');
    if (container) container.style.position = '';
}

// ─── Carga principal ─────────────────────────────────────────

export async function loadRealInvoicesTable() {
    // Asegurarse de que el selector existe
    buildMonthSelector();

    // Sincronizar el <select> con el mes activo
    const select = document.getElementById('month-selector');
    if (select && select.value !== selectedMonth) select.value = selectedMonth;

    const tbody = document.querySelector('#invoices-section tbody');
    if (!tbody) return;

    if (Cache.isValid(selectedMonth)) {
        clearInvoicesLoading();
        const data = Cache.getData(selectedMonth);
        renderInvoiceRows(data, tbody);
        updateMonthBadge(data.length, selectedMonth);
        return;
    }

    renderTableSkeleton(tbody);

    try {
        const invoices = await Cache.fetch(selectedMonth);
        clearInvoicesLoading();
        renderInvoiceRows(invoices, tbody);
        updateMonthBadge(invoices.length, selectedMonth);
    } catch (error) {
        console.error('Error cargando tabla:', error);
        clearInvoicesLoading();
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="data-table-cell text-center">
                    <div class="flex flex-col items-center gap-2 py-6">
                        <span class="material-symbols-outlined text-3xl text-red-400">cloud_off</span>
                        <p class="text-sm text-red-500 font-medium">${error.message}</p>
                        <button id="retry-invoices" class="mt-2 text-xs text-primary underline">Reintentar</button>
                    </div>
                </td>
            </tr>`;
        document.getElementById('retry-invoices')?.addEventListener('click', () => {
            Cache.invalidate(selectedMonth);
            loadRealInvoicesTable();
        });
    }
}

// ─── Renderizado de filas ─────────────────────────────────────

function createInvoiceRow(inv) {
    const tr = document.createElement('tr');
    tr.className = 'data-table-row';
    tr.addEventListener('click', () => previewInvoice(inv.id));

    const fechaFormateada = excelToJSDate(inv.date);
    const isProcessed = inv.status === 'PROCESADO';
    const amountNum = parseAmount(inv.amount);
    const currency  = (inv.currency || inv.moneda || 'EUR').toUpperCase();
    const isEUR     = currency === 'EUR';

    const importeOriginal = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(amountNum);

    const importeEUR = isEUR ? '' : new Intl.NumberFormat('es-ES', {
        style: 'currency', currency: 'EUR', maximumFractionDigits: 2,
    }).format(toEUR(amountNum, currency));

    tr.innerHTML = `
        <td class="data-table-cell">
            <span class="font-bold text-primary dark:text-[#bfc2ff]">${inv.id}</span>
        </td>
        <td class="data-table-cell">
            <span class="text-on-surface dark:text-white font-medium">${inv.client}</span>
        </td>
        <td class="data-table-cell">
            <span class="text-sm text-on-surface-variant dark:text-slate-400">${fechaFormateada}</span>
        </td>
        <td class="data-table-cell">
            <span class="font-bold dark:text-white">${importeOriginal}</span>
            ${!isEUR ? `<span class="block text-[10px] text-on-surface-variant dark:text-slate-400 mt-0.5">≈ ${importeEUR}</span>` : ''}
        </td>
        <td class="data-table-cell">
            <span class="px-3 py-1 ${isProcessed
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
            } rounded-full text-[10px] font-bold uppercase tracking-wider">
                ${inv.status}
            </span>
        </td>`;
    return tr;
}

export function renderInvoiceRows(invoices, tbody) {
    if (!invoices || !invoices.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="data-table-cell text-center">
                    <div class="flex flex-col items-center gap-3 py-12">
                        <span class="material-symbols-outlined text-4xl text-outline-variant dark:text-slate-600">folder_off</span>
                        <p class="text-sm font-semibold text-on-surface-variant dark:text-slate-400">
                            No hay facturas registradas en este mes.
                        </p>
                        <p class="text-xs text-on-surface-variant/60 dark:text-slate-500">
                            Selecciona otro mes o sube una nueva factura.
                        </p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    invoices.forEach((inv, index) => {
        const row = createInvoiceRow(inv);
        row.style.opacity = '0';
        row.style.animation = `slideUpFade 0.35s ease ${index * 0.04}s forwards`;
        fragment.appendChild(row);
    });

    tbody.innerHTML = '';
    tbody.appendChild(fragment);
}

// ─── Preview & Búsqueda ───────────────────────────────────────

export async function previewInvoice(invoiceId) {
    const previewContainer = document.querySelector('#upload-section .lg\\:col-span-5 div');
    if (!previewContainer) return;
    const pdfUrl = `${REAL_API_URL}-preview?id=${invoiceId}`;
    previewContainer.innerHTML = `<iframe src="${pdfUrl}" class="w-full h-[500px] border-none rounded-lg" title="Factura ${invoiceId}"></iframe>`;
}

export function filterInvoices(query) {
    const tbody = document.querySelector('#invoices-section tbody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr.data-table-row');
    const normalizedQuery = query.toLowerCase().trim();

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const matches = !normalizedQuery || text.includes(normalizedQuery);

        if (matches && row.style.display === 'none') {
            row.style.display = '';
            row.style.opacity = '0';
            row.style.transform = 'translateY(8px)';
            requestAnimationFrame(() => {
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            });
        } else if (!matches && row.style.display !== 'none') {
            row.style.opacity = '0';
            row.style.transform = 'translateY(-8px)';
            setTimeout(() => { row.style.display = 'none'; }, 250);
        }
    });
}