# 🧠 CONTEXTO MAESTRO DEL PROYECTO VALENTINA AI
> **Documento de Continuidad Operativa, Aprendizajes, Reglas de Oro, Deudas Técnicas y Estado del Sistema.**
> *Última actualización:* 2026-09-17  
> *Propósito:* Garantizar que cualquier sesión de IA o desarrollador entienda inmediatamente la estructura completa del proyecto, deudas resueltas, aprendizajes críticos y pendientes sin tener que explorar o re-leer todo el código fuente.

---

## 1. 🏢 Ecosistema y Estructura Monorepo (`valentina-ai`)

El repositorio en GitHub es **`claudiopulido-wq/valentina-ai`**. Es un monorepo que integra tres aplicaciones principales:

```tree
Proyecto Valentina/
├── index.html                     # [1] LANDING PAGE CORPORATIVA (HTML5 / Vanilla CSS / JS)
├── js/, css/, assets/             # Assets, videos cinemáticos (Wan 2.1, Hailuo 02) y estilos
├── platform/                      # [2] PORTAL SAAS & SUPERADMIN (Next.js 16 + React 19 + Tailwind v4)
│   ├── src/app/                   # App Router de Next.js y Server-Side API Routes
│   │   └── api/sales/             # Endpoints: send-quote (SMTP) y save-to-drive (Google Drive)
│   ├── src/components/            # Componentes UI (Google Workspace Light Style)
│   │   ├── dossier/               # Generador de Expedientes Digitales (4 Documentos Oficiales)
│   │   ├── onboarding/            # Wizard de Alta de Clientes (4 Pasos)
│   │   └── sales/                 # Cotizador B2B, Descuentos, Diagnóstico y ROI
│   └── src/lib/                   # Conectores de Supabase, API y Permisos
├── studio/                        # [3] MEDIA STUDIO & OPEN HIGGSFIELD (Open Generative AI)
├── assets/politicas-y-precios/    # Políticas comerciales oficiales (POL-COM-VAL-2026-B)
├── contexto.md                    # [DOC 1] CONTEXTO MAESTRO, APRENDIZAJES Y DEUDAS TÉCNICAS
├── arquitectura.md                # [DOC 2] ARQUITECTURA TECNOLÓGICA Y CONEXIONES EXTERNAS
└── mapa_del_proyecto.md           # [DOC 3] MAPA DE RUTAS, ENDPOINTS Y COMPONENTES
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

### C. Cotizador & Pipeline B2B (Actualizado 2026-09-17)
* Componentes clave: `platform/src/components/sales/SalesQuoteGeneratorModal.tsx` y `CommercialQuotePdfSheet.tsx`.
* **Diagnóstico de Nómina:** Permite calcular el costo de asesores comerciales humanos frente a Valentina, proyectando ahorro neto mensual y días de amortización de la inversión.
* **Política de Descuentos Dinámica:** Soporta descuentos en porcentaje (%) o montos fijos (MXN) en Setup y Mensualidad con motivo de aprobación comercial, reflejando precios de lista tachados y bonificaciones en la cotización oficial.
* **Integración Google Drive:** Endpoint `/api/sales/save-to-drive` con respaldo para `GOOGLE_DRIVE_FOLDER_ID`, descarga normalizada y enlace directo para abrir la unidad compartida.
* **Despacho Directo por Servidor:** Endpoint `/api/sales/send-quote` con modal de confirmación (destinatario editable, CC opcional, nota personalizada y adjunto oficial) vía Google Workspace SMTP.
* **Persistencia Inmediata:** Botón explícito "Guardar Cotización" en Paso 1 y Paso 2 conectado con Supabase (`commercial_quotes`) y caché local.
* **Conversión 1-Click:** El botón `⚡ Convertir en Cliente` transfiere la cotización aprobada directamente al padrón de empresas y activa su expediente legal.

---

## 5. ⚖️ Reglas de Oro y Formas de Trabajar

1. **Política Cero-Localhost:** El portal oficial de pruebas y producción es exclusivamente `https://portal.valentina-ai.mx`. Jamás compartir o documentar URLs con `localhost:3000`.
2. **Modularidad Estricta:** Ningún componente debe superar las ~300 líneas. Componentes mayores deben descomponerse en subcomponentes (`components/sales/`, `components/superadmin/`, etc.).
3. **Seguridad y Secretos:** Cero contraseñas en texto plano. Autenticación exclusiva vía Supabase Auth. Variables con llaves privadas sin prefijo `NEXT_PUBLIC_`.
4. **Documentación Viva:** Mantener sincronizada la tríada documental (`contexto.md`, `arquitectura.md`, `mapa_del_proyecto.md`) en cada sesión.
5. **Aislamiento en Impresión:** Para exportación PDF, usar siempre selectores contextuales (`body:has(.printable-sheet)`) y jamás `body > * { display: none !important; }` porque oculta el árbol raíz de Next.js.

---

## 6. 💡 Aprendizajes Críticos y Soluciones Recientes

* **Bug de Impresión PDF en Blanco:** En Next.js App Router, todo el DOM cuelga de un `div` hijo de `body`. Al aplicar `body > * { display: none; }`, la app entera se volvía invisible para `window.print()`. Se solucionó aplicando `body:has(.printable-sheet) > *:not(:has(.printable-sheet)) { display: none !important; }` y desbloqueando los padres con `overflow: visible !important; position: static !important;`.
* **Despacho de Correo SMTP con Gmail:** Si el servidor cuenta con `GOOGLE_WORKSPACE_APP_PASSWORD`, el correo se envía directamente por Node.js con `nodemailer` sin abrir ventanas emergentes. Gmail Web se mantiene únicamente como opción de respaldo.
* **Sincronización Híbrida Supabase + Local:** `quotesService.ts` implementa estrategia offline-first: lee de Supabase y respalda en `localStorage`. Si la tabla no está creada aún, no rompe la UI y conserva la continuidad.

---

## 7. 📌 Deudas Técnicas y Pendientes

| Deuda / Pendiente | Nivel | Estado | Detalle |
| :--- | :---: | :---: | :--- |
| Configurar `GOOGLE_DRIVE_FOLDER_ID` | Medio | Pendiente usuario | El usuario creará la unidad compartida y colocará su ID en variables de entorno. |
| Inyectar `GOOGLE_WORKSPACE_APP_PASSWORD` en Vercel | Medio | En producción | Para despacho 100% real por SMTP en el dominio oficial `portal.valentina-ai.mx`. |
| Autenticación JWT en Server Proxy | Alto | Identificada | Migrar header `x-user-id` a validación criptográfica `supabase.auth.getUser()`. |


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
