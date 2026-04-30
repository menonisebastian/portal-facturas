import { Cache } from '../api.js';
import { REAL_API_URL } from '../config.js';
import { excelToJSDate, parseAmount, toEUR } from '../utils.js';

/**
 * Renders a premium shimmer-skeleton table while invoice data is loading.
 * Each row simulates the 5-column layout with realistic widths.
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

    // Add loading overlay to the table container
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
            </p>
        `;
        container.appendChild(loader);
    }

    // Also update the section title
    const sectionTitle = document.querySelector('#invoices-section h2');
    if (sectionTitle && !sectionTitle.querySelector('.loading-dots')) {
        const dots = document.createElement('span');
        dots.className = 'loading-dots';
        dots.innerHTML = '<span></span><span></span><span></span>';
        sectionTitle.appendChild(dots);
    }
}

/**
 * Removes loading overlays and indicators from the invoices section.
 */
function clearInvoicesLoading() {
    // Remove overlay spinner
    const loader = document.getElementById('invoices-loader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 400);
    }

    // Remove dots from title
    const dots = document.querySelector('#invoices-section h2 .loading-dots');
    if (dots) dots.remove();

    // Reset container positioning
    const container = document.querySelector('#invoices-section .data-table-container');
    if (container) container.style.position = '';
}

export async function loadRealInvoicesTable() {
    const tbody = document.querySelector('#invoices-section tbody');
    if (!tbody) return;

    if (Cache.isValid()) {
        clearInvoicesLoading();
        renderInvoiceRows(Cache._data, tbody);
        return;
    }

    renderTableSkeleton(tbody);

    try {
        const invoices = await Cache.fetch();
        clearInvoicesLoading();
        renderInvoiceRows(invoices, tbody);
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
            Cache.invalidate();
            loadRealInvoicesTable();
        });
    }
}

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
        currency: currency,
        maximumFractionDigits: 2
    }).format(amountNum);

    const importeEUR = isEUR ? '' : new Intl.NumberFormat('es-ES', {
        style: 'currency', currency: 'EUR', maximumFractionDigits: 2
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
            ${!isEUR ? `
                <span class="block text-[10px] text-on-surface-variant dark:text-slate-400 mt-0.5">≈ ${importeEUR}</span>
            ` : ''}
        </td>
        <td class="data-table-cell">
            <span class="px-3 py-1 ${isProcessed ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'} rounded-full text-[10px] font-bold uppercase tracking-wider">
                ${inv.status}
            </span>
        </td>`;
    return tr;
}

export function renderInvoiceRows(invoices, tbody) {
    if (!invoices.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-on-surface-variant text-sm">No hay facturas disponibles.</td></tr>';
        return;
    }

    const fragment = document.createDocumentFragment();
    invoices.forEach((inv, index) => {
        const row = createInvoiceRow(inv);
        // Add staggered entrance animation per row
        row.style.opacity = '0';
        row.style.animation = `slideUpFade 0.35s ease ${index * 0.04}s forwards`;
        fragment.appendChild(row);
    });

    tbody.innerHTML = '';
    tbody.appendChild(fragment);
}

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
            // Mostrar: primero display, luego animar entrada
            row.style.display = '';
            row.style.opacity = '0';
            row.style.transform = 'translateY(8px)';
            requestAnimationFrame(() => {
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            });
        } else if (!matches && row.style.display !== 'none') {
            // Ocultar: animar salida, luego display none
            row.style.opacity = '0';
            row.style.transform = 'translateY(-8px)';
            setTimeout(() => { row.style.display = 'none'; }, 250);
        }
    });
}
