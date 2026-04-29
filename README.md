# 📊 Portal de Facturas | Sysprovider

Un portal financiero de alto rendimiento para la gestión inteligente de facturación, diseñado con una arquitectura de **Single Page Application (SPA)** y potenciado por Inteligencia Artificial y automatización mediante **n8n**.

![Stitch UI Design](https://img.shields.io/badge/Design-Stitch--UI-blue)
![Responsive](https://img.shields.io/badge/Responsive-Mobile--Friendly-success)
![AI Powered](https://img.shields.io/badge/AI-Potenciado_por_IA-purple)
![Auth](https://img.shields.io/badge/Auth-Session--Guard-orange)

## ✨ Características Principales

- **Diseño "Financial Architect"**: Interfaz premium basada en el sistema de diseño Stitch, con una estética limpia, profesional y moderna.
- **Arquitectura SPA**: Navegación fluida entre secciones (Dashboard, Facturas, Subida, Asistente) sin recargas de página.
- **🤖 Asistente AI (RAG)**: Integración profunda con **n8n** y **Qdrant** para consultas inteligentes sobre tus documentos en tiempo real.
- **🚀 Subida Optimizada**: Motor de carga de facturas con validación y feedback visual de progreso mediante webhooks de n8n.
- **📱 100% Responsivo**: Interfaz adaptativa con menú lateral tipo _drawer_ para una experiencia perfecta en móviles y tablets.
- **🌓 Modo Oscuro Dinámico**: Sistema de temas nativo que se sincroniza con tus preferencias y ajusta incluso los widgets de terceros (n8n chat).
- **🔗 URLs Limpias**: Sistema de rutas amigables (History API) para una navegación más profesional.
- **🔐 Autenticación Segura**: Sistema de acceso mediante `auth-guard.js` que protege las rutas y gestiona sesiones persistentes con expiración automática.
- **📈 Dashboard en Tiempo Real**: Visualización dinámica de estadísticas (facturas procesadas vs pendientes) y volumen de facturación mensual, sincronizado con n8n.
- **🤖 Asistente AI Avanzado (RAG)**: Integración con el chat de **n8n** que permite consultas en lenguaje natural sobre documentos. Incluye:
  - **Persistencia de Sesiones**: Recuperación de conversaciones previas.
  - **Historial de Chats**: Interfaz para gestionar y retomar sesiones antiguas.
  - **Starter Prompts**: Sugerencias inteligentes para agilizar consultas comunes.
- **🚀 Subida con IA**: Motor de carga de facturas que utiliza IA para la extracción inmediata de metadatos (Proveedor, Base, IVA, Total) con feedback visual de progreso.
- **📱 Interfaz Premium (Stitch UI)**: Diseño basado en "Financial Architect", 100% responsivo y adaptativo para móviles y tablets.
- **🌓 Sincronización de Temas**: Modo oscuro nativo que se comunica bidireccionalmente con el asistente IA para una experiencia visual cohesiva.

## 🛠️ Stack Tecnológico

- **Frontend**: HTML5, Vanilla JavaScript (ESM).

- **Estilos**: Tailwind CSS, CSS Custom Properties, Material Symbols Outlined.
- **Autenticación**: `sessionStorage` + Guard síncrono.
- **Automatización & IA**:
  - **n8n**: Orquestación de webhooks, extracción de datos y chat inteligente.
  - **Qdrant**: Base de datos vectorial para el motor RAG.
- **Almacenamiento**: Integración con OneDrive (Excel y PDFs).

## 🚀 Integración con n8n (Endpoints)

El portal utiliza los siguientes webhooks para comunicarse con la infraestructura de automatización:

| Funcionalidad             | Método | URL del Webhook                   |
| :------------------------ | :----- | :-------------------------------- |
| **API Principal (Datos)** | `GET`  | `.../webhook/api-portal`          |
| **Subida de Facturas**    | `POST` | `.../webhook/subir-factura`       |
| **Asistente (Chat)**      | `POST` | `.../webhook/.../chat`            |
| **Historial de Chats**    | `GET`  | `.../webhook/api-historial-chats` |

### Configuración de Servidor (SPA)

Para evitar errores 404 al recargar rutas internas en producción (ej: `/invoices`), configura el fallback en Nginx:

```nginx
location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ /index.html;
}
```

## 📂 Estructura del Proyecto

- `index.html`: Punto de entrada principal y estructura de la SPA.
- `login.html`: Interfaz de acceso al portal.
- `auth-guard.js`: Lógica de seguridad y protección de rutas (ejecución síncrona).
- `app.js`: Cerebro de la aplicación, gestión de rutas, temas e integraciones con n8n.
- `style.css`: Tokens de diseño, personalización del chat y utilidades CSS.
- `logosys.png` / `LOGO_SYSPROVIDER_DEGRADADO.svg`: Activos de marca.

---

Desarrollado por **Sebastián Menoni** / **Sysprovider SL**
