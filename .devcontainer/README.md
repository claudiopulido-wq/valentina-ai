# 🚀 Valentina AI - Guía Rápida de GitHub Codespaces

Este entorno está configurado automáticamente en la nube de GitHub con Node.js 20, Python 3.11 y puertos redirigidos.

---

### 🌐 Cómo ejecutar cada parte del proyecto

Abre una terminal en Codespaces y corre el comando correspondiente:

#### 1. Panel de Administración Multi-Tenant (Next.js)
```bash
npm run platform:dev
```
* **Puerto:** `3000`
* **Acceso:** Codespaces te mostrará una notificación para abrir la vista previa o navegar a `https://...-3000.app.github.dev`.

---

#### 2. Open Higgsfield AI Media Studio
```bash
npm run studio:dev
```
* **Puerto:** `3001`
* **Acceso:** Abre el estudio de cine, video e imágenes en `https://...-3001.app.github.dev`.
* **Configuración de API Key:** Dentro del estudio, ve a Settings y pega tu clave de inferencia (Fal.ai, Replicate o MuAPI) para generar videos cinematográficos en segundos.

---

#### 3. Landing Page Comercial & Infografías Interactivas
```bash
npm run landing:dev
```
* **Puerto:** `5500`
* **Acceso:** Abre la web corporativa en `https://...-5500.app.github.dev`.
