# DIRECTRICES GLOBALES DEL PROYECTO: VALENTINA AI

## 🌐 1. Regla de Entornos Oficiales (Política Cero-Localhost)
* **Plataforma SaaS & SuperAdmin:** `https://portal.valentina-ai.mx`
* **Landing Page Corporativa:** `https://valentina-ai.mx`
* **Directriz Estricta:** A partir del 2026-09-10, **queda formalmente prohibido utilizar o referenciar `localhost` o `localhost:3000`** para el acceso, pruebas de usuario o documentación de la plataforma SaaS. Todas las validaciones de navegación, enlaces compartidos al usuario, redirecciones y verificaciones operativas deben realizarse exclusivamente en:
  👉 **`https://portal.valentina-ai.mx`**

## 🏗️ 2. Topología Monorepo
* `platform/`: Aplicación Next.js 16 (App Router + React 19 + TypeScript) alojada y desplegada continuamente en **Vercel** (`valentina-portal`).
* `/`: Landing Page corporativa institucional de alta conversión estética (HTML5, Vanilla CSS dark glassmorphism, Vanilla JS).
* Documentación centralizada de arquitectura y auditoría:
  - `mapa_del_proyecto.md`
  - `auditoria_sistema_saas.md`

## 🔒 3. Seguridad y Buenas Prácticas
* Cero contraseñas en plano en el cliente (`MOCK_USERS` no almacena secretos).
* Autenticación exclusiva vía Supabase Auth.
* Rutas de API relativas (`/api/...`) en el frontend sin hardcodear dominios base.
* Modularidad de componentes: ningún componente debe superar las ~300 líneas de código.
