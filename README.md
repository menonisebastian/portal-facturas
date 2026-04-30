# 📊 Portal de Facturas | Sysprovider

Un portal financiero de alto rendimiento para la gestión inteligente de facturación, diseñado con una arquitectura de **Single Page Application (SPA)** modular y potenciado por Inteligencia Artificial y automatización mediante **n8n**.

![Stitch UI Design](https://img.shields.io/badge/Design-Stitch--UI-blue)
![Architecture](https://img.shields.io/badge/Architecture-Modular_ESM-brightgreen)
![Responsive](https://img.shields.io/badge/Responsive-Mobile--Friendly-success)
![AI Powered](https://img.shields.io/badge/AI-Potenciado_por_IA-purple)
![Auth](https://img.shields.io/badge/Auth-Session--Guard-orange)
![Deploy](https://img.shields.io/badge/Deploy-Coolify_+_Docker-informational)

## ✨ Características Principales

- **Arquitectura Modular (ESM)**: Código organizado en módulos JavaScript independientes (ES6) para facilitar el mantenimiento y la escalabilidad.
- **Diseño "Financial Architect" (Stitch UI)**: Interfaz premium con una estética limpia, profesional y moderna, utilizando nombres de clases semánticos y descriptivos.
- **Arquitectura SPA con URLs Limpias**: Navegación fluida entre secciones (`/dashboard`, `/invoices`, `/upload`, `/assistant`) sin recargas de página mediante History API. Rutas sin `.html`.
- **🤖 Asistente AI (RAG)**: Integración profunda con **n8n** y **Qdrant** para consultas inteligentes sobre documentos en tiempo real con persistencia de sesiones.
- **🚀 Subida con IA**: Motor de carga de facturas que utiliza IA para la extracción inmediata de metadatos con feedback visual de progreso.
- **📈 Dashboard Dinámico**: Visualización de estadísticas en tiempo real sincronizadas con n8n y OneDrive, con animaciones de carga (spinners y shimmer skeletons).
- **🔔 Centro de Notificaciones**: Registro persistente de subidas de PDFs (éxito/error) con panel dropdown, badge de no leídas y fechas relativas.
- **🌓 Modo Oscuro Cohesivo**: Sistema de temas que se sincroniza con los widgets de terceros para una experiencia visual unificada.
- **🔐 Seguridad Multi-capa**: Protección de rutas mediante `auth-guard.js` y gestión de sesiones seguras.
- **⏳ Loading States Premium**: Spinners branded, shimmer skeletons y animaciones de entrada escalonadas mientras los datos del dashboard y las facturas se cargan.

## 🛠️ Stack Tecnológico

- **Frontend**: HTML5, Vanilla JavaScript (ES Modules).
- **Estilos**: Tailwind CSS (Configuration modular), CSS Moderno (Semantic Classes).
- **Automatización & IA**:
  - **n8n**: Orquestación de flujos de trabajo y AI Agent.
  - **Qdrant**: Base de datos vectorial para RAG.
- **Infraestructura**:
  - **Coolify**: Plataforma de despliegue.
  - **Docker** (nginx:alpine): Contenedor con configuración Nginx personalizada.
  - Integración con OneDrive y Excel via webhooks.

## 🚀 Estructura del Proyecto

El proyecto sigue una organización moderna y escalable:

```text
.
├── assets/                  # Recursos visuales y logos
├── src/
│   ├── css/                 # Estilos organizados por componentes
│   │   ├── style.css        # Clases semánticas, tokens y animaciones de carga
│   │   └── login.css        # Estilos específicos de acceso
│   └── js/                  # Lógica modular
│       ├── ui/              # Componentes de interfaz
│       │   ├── chat.js      # Lógica del asistente AI
│       │   ├── dashboard.js # Renderizado de estadísticas + loading states
│       │   ├── invoices.js  # Gestión de tablas y facturas + loading states
│       │   ├── notifications.js # Centro de notificaciones (localStorage)
│       │   ├── sidebar.js   # Navegación y routing SPA
│       │   ├── theme.js     # Gestión de modo oscuro
│       │   └── upload.js    # Lógica de procesamiento de archivos
│       ├── api.js           # Comunicación con webhooks y Cache
│       ├── auth-guard.js    # Guardia de seguridad de rutas
│       ├── config.js        # Configuración centralizada (URLs n8n)
│       ├── tailwind-config.js # Configuración de diseño y tokens
│       ├── main.js          # Punto de entrada de la aplicación
│       └── utils.js         # Funciones de utilidad y formateo
├── index.html               # Contenedor principal de la SPA
├── login.html               # Página de acceso seguro (/login)
├── nginx.conf               # Configuración Nginx (URLs limpias + SPA)
├── Dockerfile               # Imagen Docker (nginx:alpine)
└── .dockerignore             # Exclusiones del build Docker
```

## 🌐 Rutas y URLs

| Ruta              | Descripción                                    |
| :---------------- | :--------------------------------------------- |
| `/login`          | Página de acceso seguro                        |
| `/dashboard`      | Panel principal con estadísticas               |
| `/invoices`       | Historial de facturas                          |
| `/upload`         | Subida de facturas con procesamiento IA        |
| `/assistant`      | Asistente AI con historial de conversaciones   |
| `/login.html`     | Redirige 301 → `/login`                        |

## 🚀 Despliegue (Coolify)

1. Crear un nuevo recurso en Coolify con **Build Pack: Dockerfile**.
2. Conectar el repositorio Git.
3. Desplegar. El `Dockerfile` y `nginx.conf` del repositorio configuran todo automáticamente.

> El puerto expuesto es **80**. Coolify se encarga del proxy HTTPS/SSL.

## 🔗 Integración con n8n

| Funcionalidad             | Método | URL del Webhook                   |
| :------------------------ | :----- | :-------------------------------- |
| **API Principal (Datos)** | `GET`  | `.../webhook/api-portal`          |
| **Subida de Facturas**    | `POST` | `.../webhook/subir-factura`       |
| **Asistente (Chat)**      | `POST` | `.../webhook/.../chat`            |
| **Historial de Chats**    | `GET`  | `.../webhook/api-historial-chats` |

---

Desarrollado por **Sebastián Menoni** / **Sysprovider SL**
