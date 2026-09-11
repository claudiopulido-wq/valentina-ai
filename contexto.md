# 🧠 CONTEXTO MAESTRO DEL PROYECTO VALENTINA AI
> **Documento de Continuidad Operativa, Arquitectura, Credenciales y Estado del Sistema.**
> *Última actualización:* 2026-09-10  
> *Propósito:* Garantizar que cualquier sesión de IA o desarrollador entienda inmediatamente la estructura completa del proyecto sin tener que explorar o re-leer todo el código fuente.

---

## 1. 🏢 Ecosistema y Estructura Monorepo (`valentina-ai`)

El repositorio en GitHub es **`claudiopulido-wq/valentina-ai`**. Es un monorepo que integra tres aplicaciones principales:

```tree
Proyecto Valentina/
├── index.html                     # [1] LANDING PAGE CORPORATIVA (HTML5 / Vanilla CSS / JS)
├── js/, css/, assets/             # Assets, videos cinemáticos (Wan 2.1, Hailuo 02) y estilos
├── platform/                      # [2] PORTAL SAAS & SUPERADMIN (Next.js 16 + React 19 + Tailwind v4)
│   ├── src/app/                   # App Router de Next.js
│   ├── src/components/            # Componentes UI (Google Workspace Light Style)
│   │   ├── dossier/               # Generador de Expedientes Digitales (4 Documentos Oficiales)
│   │   ├── onboarding/            # Wizard de Alta de Clientes (4 Pasos)
│   │   └── sales/                 # Cotizador B2B, Diagnóstico y ROI
│   └── src/lib/                   # Conectores de Supabase, API y Permisos
├── studio/                        # [3] MEDIA STUDIO & OPEN HIGGSFIELD (Open Generative AI)
│   ├── packages/studio/           # Motor de generación visual y pipelines encadenados
│   ├── src/lib/muapi.js           # Conector a motor Muapi (IA Image/Video)
│   └── project_knowledge.md       # Documentación técnica del Media Studio
├── assets/politicas-y-precios/    # Políticas comerciales oficiales (POL-COM-VAL-2026-B)
└── contexto.md                    # ESTE ARCHIVO MAESTRO
```

---

## 2. 🎬 Aclaración Crítica: Open Higgsfield AI / Media Studio

* **¿Dónde vive?** Vive **DENTRO** del repositorio `valentina-ai`, en la subcarpeta **[`studio/`](file:///c:/Users/ASUS/Desktop/Antigravity/Proyecto%20Valentina/studio)**. No es un repositorio separado en GitHub, fue integrado mediante el commit `38eab61` (*"feat(studio): integrate Open Higgsfield AI studio into valentina-ai"*).
* **Base técnica:** Es la implementación open-source de Higgsfield AI basada en *Open-Generative-AI* conectada al engine de **[Muapi.ai](https://muapi.ai)**.
* **Saldo / Créditos cargados:** Se configuraron y cargaron **$10 USD** de saldo para la generación de videos cinemáticos e imágenes mediante API Key de Muapi (`muapi_key` / `x-api-key`).
* **Cómo se levanta:**
  ```bash
  # Desde la raíz del repositorio valentina-ai:
  npm run studio:dev       # Inicia en el puerto 3001
  
  # O bien dentro de la carpeta studio:
  cd studio
  npm run dev -- -p 3001
  ```
* **⚠️ Troubleshooting en GitHub Codespaces (Contenedor Alpine Linux):**
  Si el Codespace arroja `npm: command not found` o error 127, el contenedor es Alpine Linux y no tiene Node preinstalado. Se soluciona en 5 segundos con:
  ```bash
  sudo apk update && sudo apk add nodejs npm
  cd studio
  npx -y vite --host 0.0.0.0 --port 3001
  ```

---

## 3. 🌐 Cuentas, Infraestructura y Servicios Conectados

| Servicio | Identificador / URL | Función en el Proyecto |
| :--- | :--- | :--- |
| **GitHub** | `claudiopulido-wq/valentina-ai` | Repositorio central que contiene Landing, Platform y Studio. |
| **Vercel** | Proyecto: `valentina-portal`<br>ID: `prj_7kCmebng7N1otPjda6agWIPDqQgb` | Hosting del SaaS/Portal (`platform`). Vinculado para subdominio `portal.valentina-ai.mx`. |
| **DNS / Dominio** | `valentina-ai.mx`<br>`portal.valentina-ai.mx` | Landing en raíz. Subdominio `portal` apunta a `cname.vercel-dns.com`. |
| **Supabase (Principal)** | `https://xrheyqhigeutkzqigvmg.supabase.co` | Base de datos PostgreSQL multi-tenant, autenticación y almacenamiento del portal Valentina. |
| **Supabase (UGES Bot)** | `https://jzlqwkfclrejblwayqef.supabase.co` | Conexión de solo lectura al bot institucional de Universidad UGES. |
| **Railway (Backend WhatsApp)** | `https://whatsapp-empresarial-production.up.railway.app` | Backend orquestador de WhatsApp Cloud API y motor de Knowledge Base / RAG. |
| **Google Workspace for Education** | `*@gesacademico.edu.mx` | Envío oficial de cotizaciones y expedientes mediante SMTP / App Passwords de Gmail. |
| **Muapi.ai** | `https://api.muapi.ai` | Motor API de generación de video/imagen de Higgsfield AI en `studio/`. |

---

## 4. 💼 Módulos Recientes Implementados (Estado Actual)

### A. Política de Precios Oficial (`POL-COM-VAL-2026-B`)
* **Growth:** Setup $8,500 MXN / MRR $2,800 MXN (Anual: $4,250 setup / $2,350/mes).
* **Scale (Recomendado):** Setup $16,500 MXN / MRR $5,600 MXN (Anual: $8,250 setup / $4,700/mes).
* **Enterprise:** Setup desde $38,500 MXN / MRR desde $12,500 MXN.
* **Regulación Meta Telecom (Oct 2026):** $0.0085 USD/mensaje tras 1,000 libres al mes. Se desglosa como pass-through directo sin sobrecosto comercial.

### B. Wizard de Alta & Expediente Digital B2B
* Ubicado en SuperAdmin (`platform/src/components/dossier/` y `onboarding/`).
* Genera 4 documentos ejecutivos listos para imprimir (`window.print()`):
  1. *Hoja Membretada de Cotización Ejecutiva*.
  2. *Convenio Comercial B2B* (2 páginas, 8 cláusulas, LFPDPPP, SLA 99.9%, garantía 30 días, carátula y firmas).
  3. *Anexo Técnico RACI & Checklist de Prerrequisitos* (Ruta crítica de 10 a 21 días).
  4. *Cédula de Entrega de Credenciales* (Con código QR y clave de contingencia).

### C. Cotizador & Pipeline B2B
* Pestaña 4 en SuperAdmin (`platform/src/components/sales/SalesQuoteGeneratorModal.tsx`).
* **Diagnóstico de Nómina:** Permite calcular el costo de asesores comerciales humanos frente a Valentina, proyectando ahorro neto mensual y días de amortización de la inversión.
* **Generación de Folio:** Emite folios oficiales `COT-VAL-2026-XXXX`.
* **Conversión 1-Click:** El botón `⚡ Convertir en Cliente` pasa la cotización aprobada directamente al padrón de empresas y activa su expediente legal.

---

## 5. 🛠️ Comandos de Ejecución Local

Desde la raíz del repositorio:

```bash
# 1. Iniciar la Landing Page (Puerto 5500):
npm run landing:dev

# 2. Iniciar el Portal SaaS / SuperAdmin (Puerto 3000):
npm run platform:dev

# 3. Iniciar el Open Higgsfield Media Studio (Puerto 3001):
npm run studio:dev
```

---

---

## 7. 🎬 Open Higgsfield Media Studio & Solución en GitHub Codespaces

### Problema común al iniciar en Codespaces:
Los contenedores predeterminados o ligeros de GitHub Codespaces a veces ejecutan **Alpine Linux** (`musl libc`) en lugar de Ubuntu/Debian (`glibc`).
* Si se intenta ejecutar scripts de instalación como `curl -fsSL https://deb.nodesource.com/setup_... | bash -`, fallará con error `127` o comando no encontrado (`apt-get`).
* En Alpine Linux, el gestor de paquetes es `apk`, no `apt`.

### Comando de rescate y arranque directo:
Para habilitar Node.js y levantar el editor de video en el puerto 3001 en Alpine Linux:
```bash
sudo apk update && sudo apk add nodejs npm
cd studio
npx -y vite --host 0.0.0.0 --port 3001
```
* Una vez iniciado, Codespace reenvía automáticamente el puerto `3001` al navegador.
