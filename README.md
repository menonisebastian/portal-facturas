# 📊 Portal de Facturas | Sysprovider

Un portal financiero de alto rendimiento para la gestión inteligente de facturación, diseñado con una arquitectura de **Single Page Application (SPA)** modular y potenciado por Inteligencia Artificial y automatización mediante **n8n**.

![Stitch UI Design](https://img.shields.io/badge/Design-Stitch--UI-blue)
![Architecture](https://img.shields.io/badge/Architecture-Modular_ESM-brightgreen)
![Responsive](https://img.shields.io/badge/Responsive-Mobile--Friendly-success)
![AI Powered](https://img.shields.io/badge/AI-Potenciado_por_IA-purple)
![Auth](https://img.shields.io/badge/Auth-Session--Guard-orange)

## ✨ Características Principales

- **Arquitectura Modular (ESM)**: Código organizado en módulos JavaScript independientes (ES6) para facilitar el mantenimiento y la escalabilidad.
- **Diseño "Financial Architect" (Stitch UI)**: Interfaz premium con una estética limpia, profesional y moderna, utilizando nombres de clases semánticos y descriptivos.
- **Arquitectura SPA**: Navegación fluida entre secciones (Dashboard, Facturas, Subida, Asistente) sin recargas de página mediante History API.
- **🤖 Asistente AI (RAG)**: Integración profunda con **n8n** y **Qdrant** para consultas inteligentes sobre documentos en tiempo real con persistencia de sesiones.
- **🚀 Subida con IA**: Motor de carga de facturas que utiliza IA para la extracción inmediata de metadatos con feedback visual de progreso.
- **📈 Dashboard Dinámico**: Visualización de estadísticas en tiempo real sincronizadas con n8n y OneDrive.
- **🌓 Modo Oscuro Cohesivo**: Sistema de temas que se sincroniza con los widgets de terceros para una experiencia visual unificada.
- **🔐 Seguridad Multi-capa**: Protección de rutas mediante `auth-guard.js` y gestión de sesiones seguras.

## 🛠️ Stack Tecnológico

- **Frontend**: HTML5, Vanilla JavaScript (ES Modules).
- **Estilos**: Tailwind CSS (Configuration modular), CSS Moderno (Semantic Classes).
- **Automatización & IA**:
  - **n8n**: Orquestación de flujos de trabajo y AI Agent.
  - **Qdrant**: Base de datos vectorial para RAG.
- **Infraestructura**: Integración con OneDrive y Excel via webhooks.

## 🚀 Estructura del Proyecto

El proyecto sigue una organización moderna y escalable:

```text
.
├── assets/                  # Recursos visuales y logos
├── src/
│   ├── css/                 # Estilos organizados por componentes
│   │   ├── style.css        # Clases semánticas y tokens globales
│   │   └── login.css        # Estilos específicos de acceso
│   └── js/                  # Lógica modular
│       ├── ui/              # Componentes de interfaz
│       │   ├── chat.js      # Lógica del asistente AI
│       │   ├── dashboard.js # Renderizado de estadísticas
│       │   ├── invoices.js  # Gestión de tablas y facturas
│       │   ├── sidebar.js   # Navegación y routing
│       │   ├── theme.js     # Gestión de modo oscuro
│       │   └── upload.js    # Lógica de procesamiento de archivos
│       ├── api.js           # Comunicación con webhooks y Cache
│       ├── auth-guard.js    # Guardia de seguridad de rutas
│       ├── config.js        # Configuración centralizada (URLs n8n)
│       ├── tailwind-config.js # Configuración de diseño y tokens
│       ├── main.js          # Punto de entrada de la aplicación
│       └── utils.js         # Funciones de utilidad y formateo
├── index.html               # Contenedor principal de la SPA
└── login.html               # Página de acceso seguro
```

## 🚀 Integración con n8n

| Funcionalidad             | Método | URL del Webhook                   |
| :------------------------ | :----- | :-------------------------------- |
| **API Principal (Datos)** | `GET`  | `.../webhook/api-portal`          |
| **Subida de Facturas**    | `POST` | `.../webhook/subir-factura`       |
| **Asistente (Chat)**      | `POST` | `.../webhook/.../chat`            |
| **Historial de Chats**    | `GET`  | `.../webhook/api-historial-chats` |

---

Desarrollado por **Sebastián Menoni** / **Sysprovider SL**
