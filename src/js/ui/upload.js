import { N8N_UPLOAD_WEBHOOK_URL } from '../config.js';
import { Cache } from '../api.js';

export function initUpload() {
    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('file-name');
    const fileInfoContainer = document.getElementById('file-info');
    const uploadForm = document.getElementById('uploadForm');

    if (fileInput) {
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (file) {
                fileNameDisplay.textContent = `Archivo seleccionado: ${file.name}`;
                fileInfoContainer.classList.remove('hidden');

                const previewContainer = document.querySelector('#upload-section .lg\\:col-span-5 div');
                if (previewContainer) {
                    const fileURL = URL.createObjectURL(file);
                    previewContainer.innerHTML = `
                        <div class="absolute top-4 right-4 z-10 flex gap-2">
                             <div class="px-3 py-1 bg-slate-800/90 backdrop-blur rounded-lg text-[10px] font-bold text-white uppercase tracking-widest">Documento Original</div>
                        </div>
                        <iframe src="${fileURL}#toolbar=0" class="w-full h-[500px] border-none rounded-lg shadow-inner" title="Vista previa local"></iframe>
                    `;
                }
            } else {
                fileInfoContainer.classList.add('hidden');
            }
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const submitBtn = document.getElementById('submitBtn');
            const statusCard = document.getElementById('status-card');
            const statusTitle = document.getElementById('status-title');
            const statusMessage = document.getElementById('status-message');
            const statusProgress = document.getElementById('status-progress');
            const statusPercentage = document.getElementById('status-percentage');
            const statusIcon = document.getElementById('status-icon');
            const statusIconContainer = document.getElementById('status-icon-container');
            const previewContainer = document.querySelector('#upload-section .lg\\:col-span-5 div');
            
            const file = fileInput.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append("attachment_0", file);

            submitBtn.disabled = true;
            submitBtn.querySelector('span').textContent = 'Enviando...';
            
            statusCard.classList.remove('hidden');
            statusTitle.textContent = 'Procesando...';
            statusMessage.textContent = 'Enviando factura a la IA...';
            statusProgress.style.width = '30%';
            statusPercentage.textContent = '30%';
            statusIcon.textContent = 'sync';
            statusIcon.classList.add('animate-spin');
            
            if (previewContainer) {
                 previewContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-[500px] bg-white/50 dark:bg-slate-800/50 rounded-lg">
                        <span class="material-symbols-outlined text-6xl text-primary animate-pulse mb-4">document_scanner</span>
                        <p class="text-sm font-bold text-primary dark:text-[#bfc2ff] animate-pulse">IA Extrayendo datos...</p>
                    </div>
                `;
            }

            try {
                const response = await fetch(N8N_UPLOAD_WEBHOOK_URL, {
                    method: 'POST',
                    body: formData
                });

                statusProgress.style.width = '70%';
                statusPercentage.textContent = '70%';
                statusMessage.textContent = 'Analizando metadatos del documento...';

                const result = await response.json();

                if (response.ok && result) {
                    if (result.exito === false || result.error || result.error_procesamiento) {
                        throw new Error(result.mensaje || result.error || result.error_procesamiento || 'El documento fue rechazado.');
                    }
                    
                    statusTitle.textContent = 'Completado';
                    statusMessage.textContent = result.mensaje || '¡Factura procesada con éxito!';
                    statusProgress.style.width = '100%';
                    statusPercentage.textContent = '100%';
                    statusIcon.textContent = 'check_circle';
                    statusIcon.classList.remove('animate-spin');
                    statusIconContainer.classList.remove('bg-secondary-fixed', 'dark:bg-slate-700');
                    statusIconContainer.classList.add('bg-green-100', 'dark:bg-green-900/40');
                    statusIcon.classList.add('text-green-600', 'dark:text-green-400');
                    
                    if (previewContainer) {
                        const prov = result.PROVEEDOR || result.proveedor || "Proveedor";
                        const num = result.NUMERO || result.numero_factura || "S/N";
                        const fecha = result['FECHA FACTURA'] || result.fecha_factura || "-";
                        const base = result.BASE || result.base_imponible || "0.00";
                        const iva = result.CUOTAIVA || result.cuota_iva || "0.00";
                        const total = result.TOTAL || result.total_factura || "0.00";
                        const moneda = result.MONEDA || result.moneda || "EUR";

                        previewContainer.innerHTML = `
                            <div class="absolute top-4 right-4 z-10 flex gap-2">
                                 <div class="px-3 py-1 bg-green-500/90 backdrop-blur rounded-lg text-[10px] font-bold text-white uppercase tracking-widest">Extracción Exitosa</div>
                            </div>
                            <div class="bg-white dark:bg-slate-800 rounded-lg p-6 w-full h-[500px] flex items-center justify-center border border-outline-variant/20 shadow-sm">
                                <div class="w-full max-w-sm bg-surface-container-lowest dark:bg-slate-900 p-8 rounded-xl shadow-2xl font-mono text-sm relative border border-outline-variant/10">
                                    <div class="text-center border-b border-dashed border-outline-variant/50 pb-4 mb-4">
                                        <span class="material-symbols-outlined text-5xl text-primary dark:text-[#bfc2ff] mb-2">storefront</span>
                                        <h3 class="font-bold text-xl text-on-surface dark:text-white uppercase truncate">${prov}</h3>
                                        <p class="text-[10px] text-on-surface-variant mt-1 tracking-widest">FACTURA Nº ${num}</p>
                                    </div>
                                    <div class="space-y-3 mb-6">
                                        <div class="flex justify-between"><span class="text-on-surface-variant">Emisión:</span> <span class="font-bold dark:text-white">${fecha}</span></div>
                                        <div class="flex justify-between"><span class="text-on-surface-variant">Estado:</span> <span class="text-green-600 font-bold">Verificado IA</span></div>
                                    </div>
                                    <div class="border-t border-b border-dashed border-outline-variant/50 py-4 my-4 space-y-3">
                                        <div class="flex justify-between"><span class="text-on-surface-variant">Base Imponible</span> <span class="dark:text-white">${base}</span></div>
                                        <div class="flex justify-between"><span class="text-on-surface-variant">Impuestos (IVA)</span> <span class="dark:text-white">${iva}</span></div>
                                    </div>
                                    <div class="flex justify-between items-center text-2xl font-bold text-primary dark:text-[#bfc2ff]">
                                        <span>TOTAL</span>
                                        <span>${total} ${moneda}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }

                    fileInput.value = ''; 
                    fileInfoContainer.classList.add('hidden');
                    Cache.invalidate();
                } else {
                    throw new Error('El servidor no pudo procesar el archivo.');
                }
            } catch (error) {
                statusTitle.textContent = 'Error';
                statusMessage.textContent = error.message;
                statusIcon.textContent = 'error';
                statusIcon.classList.remove('animate-spin');
                statusIconContainer.classList.remove('bg-secondary-fixed', 'dark:bg-slate-700');
                statusIconContainer.classList.add('bg-red-100', 'dark:bg-red-900/40');
                statusIcon.classList.add('text-red-600', 'dark:text-red-400');
                statusProgress.classList.remove('bg-primary', 'dark:bg-[#bfc2ff]');
                statusProgress.classList.add('bg-red-500');
                
                if (previewContainer) {
                    previewContainer.innerHTML = `
                        <div class="flex flex-col items-center justify-center h-[500px] bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                            <span class="material-symbols-outlined text-6xl text-red-500 mb-4">warning</span>
                            <p class="text-sm font-bold text-red-700 dark:text-red-400">Error en la lectura del documento.</p>
                        </div>
                    `;
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.querySelector('span').textContent = 'Subir otra factura';
            }
        });
    }
}
