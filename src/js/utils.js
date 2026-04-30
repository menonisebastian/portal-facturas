// Tasas de conversión aproximadas a EUR (actualizar periódicamente o usar API)
export let FX_TO_EUR = {
    EUR: 1,
    USD: 0.92,
    GBP: 1.17,
    MXN: 0.054,
    COP: 0.00023,
    ARS: 0.001,
};

// Función para convertir números de Excel (Serial Dates) a fecha legible
export function excelToJSDate(serial) {
    if (!serial || isNaN(serial)) return serial; // Si ya es texto, lo deja igual
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    return date.toLocaleDateString('es-ES'); // Formato DD/MM/YYYY
}

export function toEUR(amount, currency) {
    const rate = FX_TO_EUR[currency?.toUpperCase()] ?? 1;
    return amount * rate;
}

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
