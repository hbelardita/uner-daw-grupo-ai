# Despliegue de Producción Local (Nginx + PM2)

Configuración aislada y documentación para ejecutar el entorno de producción local del **TP Final Integrador** (Angular + NestJS + PostgreSQL).

---

## 🏛️ Arquitectura

En este entorno unificamos los servicios bajo una única puerta de entrada en el puerto `80`:

```text
                     ┌───────────────────────────────┐
                     │           Navegador           │
                     └───────────────┬───────────────┘
                                     │ http://localhost:80
                                     ▼
                     ┌───────────────────────────────┐
                     │             NGINX             │
                     │  (Instancia local aislada)    │
                     └───────┬───────────────┬───────┘
                             │               │
        Ruta / (Estáticos)   │               │   Ruta /api/ (Reverse Proxy)
                             ▼               ▼
      ┌─────────────────────────┐     ┌─────────────────────────┐
      │  Angular SPA (dist/)    │     │  NestJS API (:3000)     │
      │  Client-Side Routing    │     │  Gestionado por PM2     │
      └─────────────────────────┘     └────────────┬────────────┘
                                                   │
                                                   ▼
                                      ┌─────────────────────────┐
                                      │  PostgreSQL (:5432)     │
                                      │  Docker Compose         │
                                      └─────────────────────────┘
```

- **Angular:** Se compila a archivos estáticos optimizados. Nginx los sirve directamente desde el disco mediante la directiva `try_files $uri $uri/ /index.html;`, evitando errores 404 al refrescar rutas virtuales.
- **NestJS:** Se ejecuta en segundo plano bajo **PM2** con reinicio automático (_autorestart_) y cierre ordenado .
- **Nginx (Reverse Proxy):** Recibe las llamadas a `/api/` y las canaliza a `http://127.0.0.1:3000`, eliminando por completo problemas de **CORS** al compartir el mismo origen.

---

## 🚀 Guía Rápida de Despliegue

Ejecutar desde la raíz del repositorio:

### 1. Iniciar la base de datos

```bash
npm run db:up
```

### 2. Compilar el frontend (Angular)

```bash
npm run build:frontend
```

### 3. Compilar y levantar el backend con PM2

```bash
npm run deploy:backend
```

### 4. Probar y levantar Nginx

```bash
# Validar sintaxis de configuración (sin sudo)
npm run nginx:test

# Arrancar Nginx en el puerto 80 (requiere sudo para puerto < 1024)
npm run nginx:start
```

### 5. Probar en el navegador

Abrir **`http://localhost`**.

- La aplicación Angular cargará en `/`.
- Las peticiones a la API viajarán transparentemente a través de `/api/...`.

---

## 🛠️ Comandos de Mantenimiento

### Control de Nginx

| Comando                | Descripción                                             |
| :--------------------- | :------------------------------------------------------ |
| `npm run nginx:test`   | Valida la sintaxis del archivo `nginx.conf` aislado.    |
| `npm run nginx:start`  | Inicia la instancia local de Nginx.                     |
| `npm run nginx:reload` | Recarga la configuración sin cortar conexiones activas. |
| `npm run nginx:stop`   | Detiene la instancia de Nginx limpiamente.              |

### Control de PM2 (Backend)

| Comando                          | Descripción                                                        |
| :------------------------------- | :----------------------------------------------------------------- |
| `npm run deploy:backend`         | Compila NestJS y arranca o recarga el proceso con `startOrReload`. |
| `npm run deploy:stop:backend`    | Pausa el proceso de la API (estado `stopped`).                     |
| `npm run deploy:destroy:backend` | Elimina el proceso de la lista de PM2.                             |
| `npx pm2 status`                 | Tabla en tiempo real de CPU, memoria y reinicios.                  |
| `npx pm2 logs`                   | Transmisión de logs en vivo de NestJS.                             |

---
