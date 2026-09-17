# 🏗️ ARQUITECTURA TÉCNICA DEL ECOSISTEMA VALENTINA AI
> **Documento Maestro de Tecnologías, Conexiones Externas, Componentes y Flujos de Datos.**  
> *Última actualización:* 2026-09-17  
> *Repositorio:* `claudiopulido-wq/valentina-ai`

---

## 1. 🚀 Stack Tecnológico Global

| Capa | Tecnología / Framework | Versión / Detalle | Propósito |
| :--- | :--- | :--- | :--- |
| **Landing Page** | HTML5 Semántico + Vanilla CSS + Vanilla JS | Nativo | Sitio corporativo de alta conversión estética (Dark Glassmorphism). |
| **Portal SaaS & SuperAdmin** | Next.js (App Router + Turbopack) | `16.3.4` | Plataforma de administración, clientes, RAG y cotizaciones B2B. |
| **Biblioteca de UI** | React 19 + TypeScript | `19.2.8` / TS `^5` | Lógica reactiva de componentes con tipado estricto. |
| **Motor de Estilos** | Tailwind CSS v4 + Vanilla CSS | `@tailwindcss/postcss ^4` | Tokens Google Workspace Light en SaaS y `@media print` oficial. |
| **Iconografía** | Lucide React | `^1.42.0` | Sistema de iconos vectoriales uniforme. |
| **Despacho de Correos** | Nodemailer | `^10.0.3` | Envío programático de correos y adjuntos vía SMTP. |
| **Generative Media Studio** | Vite + Open Higgsfield AI + Muapi | Vite 5 | Generación de video cinemático e imágenes mediante IA generativa. |

---

## 2. 🔌 Herramientas y Servicios Externos Conectados

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    VALENTINA AI SAAS                   │
                               │                https://portal.valentina-ai.mx          │
                               └───────────┬──────────────┬───────────────┬─────────────┘
                                           │              │               │
                     ┌─────────────────────┼──────────────┼───────────────┼────────────────────┐
                     ▼                     ▼              ▼               ▼                    ▼
             ┌───────────────┐     ┌──────────────┐ ┌───────────┐ ┌────────────────┐ ┌──────────────────┐
             │   Supabase    │     │   Railway    │ │  Vercel   │ │Google Workspace│ │   Google Drive   │
             │  (Postgres &  │     │  (WhatsApp & │ │ (Hosting  │ │  (SMTP Gmail)  │ │ (Unidad Compart. │
             │     Auth)     │     │  RAG Engine) │ │    DNS)   │ │  Cotizaciones) │ │   Expedientes)   │
             └───────────────┘     └──────────────┘ └───────────┘ └────────────────┘ └──────────────────┘
                     │                     │                              │                    │
                     ▼                     ▼                              ▼                    ▼
             Telemetría Multi-     Meta Cloud API                Despacho Formal B2B   Archivado Cloud de
             Tenant y Cuentas      WhatsApp Business              al prospecto          Propuestas Oficiales
```

### Detalle de Conexiones Activas:
1. **Supabase (`xrheyqhigeutkzqigvmg.supabase.co`):**
   - Base de datos PostgreSQL relacional con Row Level Security (RLS).
   - Autenticación de usuarios por roles (`superadmin`, `tenant_admin`, `staff`).
   - Persistencia de cotizaciones comerciales (`commercial_quotes`) y telemetría de organizaciones.
2. **Supabase UGES (`jzlqwkfclrejblwayqef.supabase.co`):**
   - Conexión de solo lectura al bot institucional de Universidad UGES para telemetría educativa.
3. **Railway (`whatsapp-empresarial-production.up.railway.app`):**
   - Orquestador del webhook oficial de WhatsApp Cloud API de Meta.
   - Motor RAG (Retrieval-Augmented Generation) para ingesta y consulta vectorial de documentos.
4. **Google Workspace for Education / Gmail SMTP (`smtp.gmail.com`):**
   - Envío de correos oficiales con autenticación por App Password (`GOOGLE_WORKSPACE_APP_PASSWORD`).
   - Plantillas HTML ejecutivas y adjunto automático de propuestas en HTML membretado.
5. **Google Drive (Unidad Compartida):**
   - Endpoint `/api/sales/save-to-drive` con vinculación a `GOOGLE_DRIVE_FOLDER_ID`.
   - Nomenclatura corporativa: `[Valentina_AI]_Propuesta_Comercial_${empresa}_${folio}.html`.
   - Enlace directo `driveFolderUrl` para apertura en 1 clic.
6. **Vercel (`prj_7kCmebng7N1otPjda6agWIPDqQgb`):**
   - Despliegue continuo CI/CD del monorepo (`platform/`) hacia `portal.valentina-ai.mx`.
7. **Muapi.ai (`api.muapi.ai`):**
   - Backend generativo de video e imagen para el editor Open Higgsfield en `studio/`.

---

## 3. 🧩 Inventario de Componentes y Función Arquitectónica

### Plataforma Central (`platform/src/components/`):
* **`SuperAdminView.tsx`:** Orquestador principal del panel de administración del ecosistema.
* **`LiveOmnichannelInbox.tsx`:** Bandeja de entrada omnicanal estilo Google Workspace (3 columnas responsive).
* **`GoogleSidebar.tsx`:** Barra de navegación lateral persistente con selector de inquilino/organización.
* **`AppleMetricsWidgets.tsx`:** Widgets de telemetría financiera (ingresos, costos de inferencia IA, costos cloud y margen operativo).
* **`AuthModal.tsx`:** Modal de inicio de sesión con soporte de Supabase Auth.

### Módulo de Cotizaciones B2B (`platform/src/components/sales/`):
* **`SalesQuoteGeneratorModal.tsx`:** Cotizador interactivo. Administra el diagnóstico de nómina, cálculo de ROI, matriz de descuentos dinámicos (Setup y MRR), guardado en Supabase, exportación a Google Drive y modal de despacho por correo con copia oculta.
* **`CommercialQuotePdfSheet.tsx`:** Hoja membretada oficial ejecutiva con política comercial `POL-COM-VAL-2026-B`, desglose transparente de precios de lista vs bonificados, firma y garantías.
* **`SalesPipelineTab.tsx`:** Tablero de control de propuestas emitidas, filtro por estado (`draft`, `sent`, `negotiating`, `accepted`), trazabilidad de fechas/destinatarios y accesos directos a Google Drive.

### Módulo de Onboarding y Expedientes (`platform/src/components/onboarding/` y `dossier/`):
* **`ClientOnboardingWizard.tsx`:** Flujo de alta de nuevos clientes en 4 pasos (Identidad fiscal, Canales Meta/CRM, Plan comercial y Credenciales).
* **`ClientDossierModal.tsx`:** Generador del Expediente Digital Integral (Cotización, Convenio de 8 cláusulas, Anexo Técnico RACI y Cédula de Entrega de Credenciales).

---

## 4. 🔒 Guardrails de Seguridad y Gobernanza de Datos
1. **Zero-Trust en Cliente:** Ningún secreto ni contraseña se expone en variables `NEXT_PUBLIC_` ni en `MOCK_USERS`.
2. **Aislamiento Multi-Tenant:** Cada organización opera con su propio identificador (`tenant_id`) en bases de conocimiento y canales.
3. **Idempotencia de Envíos:** Control de folios únicos (`COT-VAL-YYYY-XXXX`) y registro de `messageId` en despachos de correo para evitar duplicidad de envíos comerciales.
