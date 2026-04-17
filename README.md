# 📊 Portal de Facturas | Sysprovider

Un portal moderno y profesional para la gestión de facturación, diseñado con una arquitectura de **Single Page Application (SPA)** y potenciado por Inteligencia Artificial.

![Stitch UI Design](https://img.shields.io/badge/Design-Stitch--UI-blue)
![Responsive](https://img.shields.io/badge/Responsive-Mobile--Friendly-success)
![AI Powered](https://img.shields.io/badge/AI-Potenciado_por_IA-purple)

## ✨ Características Principales

- **Diseño "Financial Architect"**: Interfaz premium basada en el sistema de diseño Stitch, con una estética limpia, profesional y moderna.
- **Arquitectura SPA**: Navegación fluida entre secciones (Dashboard, Facturas, Subida, Asistente) sin recargas de página.
- **🤖 Asistente AI (RAG)**: Integración profunda con **n8n** y **Qdrant** para consultas inteligentes sobre tus documentos en tiempo real.
- **🚀 Subida Optimizada**: Motor de carga de facturas con validación y feedback visual de progreso mediante webhooks de n8n.
- **📱 100% Responsivo**: Interfaz adaptativa con menú lateral tipo *drawer* para una experiencia perfecta en móviles y tablets.
- **🌓 Modo Oscuro Dinámico**: Sistema de temas nativo que se sincroniza con tus preferencias y ajusta incluso los widgets de terceros (n8n chat).
- **🔗 URLs Limpias**: Sistema de rutas amigables (History API) para una navegación más profesional.

## 🛠️ Stack Tecnológico

- **Frontend**: HTML5, Vanilla JavaScript (ESM).
- **Estilos**: Tailwind CSS, CSS Custom Properties.
- **Iconos**: Material Symbols Outlined.
- **Automatización**: n8n (Webhooks & Chat Bundle).
- **Base de Datos Vectorial**: Qdrant.
- **Almacenamiento**: OneDrive (Excel).

## 🚀 Instalación y Despliegue

### Configuración de SPA (Nginx / Coolify)
Para que las URLs limpias funcionen correctamente tras un refresco de página, asegúrate de configurar el "fallback" en tu servidor:

```nginx
location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ /index.html;
}
```

---

## 🛠️ Guía de Integración Avanzada (n8n + OneDrive + Qdrant)

El portal está preparado para conectarse a tus flujos actuales de n8n. Sigue estos pasos para activar los datos reales:

### 1. Preparar el Endpoint de Datos (GET)
Crea un flujo en n8n con un nodo **Webhook (GET)** que realice lo siguiente:
1. **OneDrive Node**: Operación "Get Spreadsheet Rows". Selecciona tu Excel de facturas.
2. **Code Node**: Mapea las columnas de Excel al formato del portal.
   ```javascript
   return items.map(item => ({
       id: item.json["ID"],
       client: item.json["Cliente"],
       date: item.json["Fecha"],
       amount: item.json["Importe"],
       status: item.json["Estado"] // Ej: "PROCESADO" o "PENDIENTE"
   }));
   ```
3. **Webhook Response**: Devuelve el array de objetos.

### 2. Preparar la Previsualización de PDF
Para mostrar los archivos guardados en OneDrive:
1. Crea un webhook en n8n: `GET /api/preview?id=XXX`.
2. Usa el nodo de **OneDrive** para "Download File" usando el ID recibido.
3. El portal cargará este binario automáticamente en el panel de vista previa.

### 3. Activar la Integración en el Portal
En el archivo `app.js`, busca la sección **`--- 6. INTEGRACIÓN REAL CON N8N ---`**.
1. Descomenta el bloque de código (quita `/*` y `*/`).
2. Actualiza la variable `REAL_API_URL` con la URL de tu webhook de n8n.
3. Añade llamadas a `loadRealDashboardData()` y `loadRealInvoicesTable()` en la función `handleRouting()` o en los event listeners de navegación.

## 📂 Estructura del Proyecto

- `index.html`: Estructura principal y secciones de la aplicación.
- `style.css`: Sistema de diseño, tokens de color y overrides del chat.
- `app.js`: Lógica de navegación, gestión de temas e integración con n8n.

---
Desarrollado por **Sebastián Menoni** / **Sysprovider SL**