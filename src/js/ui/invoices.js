import { Cache } from '../api.js';
import { REAL_API_URL } from '../config.js';
import { excelToJSDate, parseAmount, toEUR } from '../utils.js';

export function renderTableSkeleton(tbody) {
    const rows = Array.from({ length: 5 }, () => `
        <tr class="data-table-row">
            ${['w-20', 'w-32', 'w-24', 'w-16', 'w-16'].map(w => `
                <td class="data-table-cell">
                    <div class="h-4 ${w} bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </td>`).join('')}
        </tr>`).join('');
    tbody.innerHTML = rows;
}

export async function loadRealInvoicesTable() {
    const tbody = document.querySelector('#invoices-section tbody');
    if (!tbody) return;

    if (Cache.isValid()) {
        renderInvoiceRows(Cache._data, tbody);
        return;
    }

    renderTableSkeleton(tbody);

    try {
        const invoices = await Cache.fetch();
        renderInvoiceRows(invoices, tbody);
    } catch (error) {
        console.error('Error cargando tabla:', error);
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
    invoices.forEach(inv => {
        fragment.appendChild(createInvoiceRow(inv));
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
