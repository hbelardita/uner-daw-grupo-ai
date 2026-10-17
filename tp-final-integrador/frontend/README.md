# Frontend — Sistema de Gestión de Turnos Médicos

Cliente web Single Page Application (SPA) para el **Sistema de Gestión de Turnos Médicos**, desarrollado con [Angular](https://angular.dev/) (v21), [PrimeNG](https://primeng.org/) y [Tailwind CSS](https://tailwindcss.com/).
Cátedra **Desarrollo de Aplicaciones Web (DAW 2026)** — UNER.

---

## 🛠️ Tecnologías y Librerías

- **Framework:** Angular 21 (Standalone Components, Signals, Functional Guards e Interceptors).
- **Componentes UI:** PrimeNG 21 con tema Aura y PrimeIcons.
- **Estilos:** Tailwind CSS v4.
- **Testing:** Vitest.
- **Proxy de Desarrollo:** Configurado en `proxy.conf.json` para redirigir peticiones `/api` al backend NestJS (`http://localhost:3000`).

---

## 🚀 Puesta en Marcha

### Opción A: Desde la raíz del repositorio (Recomendado)

```bash
# Iniciar servidor de desarrollo con proxy a la API
npm run dev:frontend

# Compilar para producción
npm run build:frontend

# Ejecutar tests unitarios
npm run test:frontend
```

La aplicación quedará disponible en: [http://localhost:4200](http://localhost:4200).

---

### Opción B: Desde el directorio `frontend`

Situado en `tp-final-integrador/frontend`:

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (incluye proxy.conf.json automáticamente)
npm start

# Compilar para producción
npm run build

# Ejecutar tests unitarios
npm test
```

---

## 🌐 Configuración del Proxy Inverso

Para evitar problemas de CORS y no hardcodear la URL del backend durante el desarrollo local, Angular CLI redirige todas las llamadas a rutas relativas `/api/*` hacia el servidor backend NestJS:

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

---

## 📁 Estructura del Proyecto

```text
tp-final-integrador/frontend/
├── angular.json           # Configuración del workspace de Angular CLI y dev server
├── package.json           # Dependencias y scripts de ejecución
├── proxy.conf.json        # Proxy para redirigir /api hacia http://localhost:3000
├── tsconfig.json          # Configuración base de TypeScript
├── tsconfig.app.json      # Configuración de compilación de la app
├── tsconfig.spec.json     # Configuración para pruebas con Vitest
└── src/
    ├── app/               # Componentes, servicios, guards, interceptors y rutas
    │   ├── app.config.ts  # Proveedores globales (Router, HttpClient, PrimeNG Aura)
    │   ├── app.routes.ts  # Definición de rutas principales
    │   ├── app.ts         # Componente raíz
    │   └── app.html       # Template principal con <router-outlet>
    ├── index.html         # Página HTML principal
    ├── main.ts            # Bootstrap de la aplicación standalone
    └── styles.css         # Importación de Tailwind CSS y estilos base
```
