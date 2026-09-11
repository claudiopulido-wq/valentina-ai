# 🚀 Valentina AI Platform (SaaS & SuperAdmin)

Plataforma multi-tenant para orquestación de agentes de IA, bandeja omnicanal en tiempo real y panel de control SuperAdmin.

## 🌐 Entorno Oficial de Producción
* **URL Oficial:** [https://portal.valentina-ai.mx](https://portal.valentina-ai.mx)
* **Despliegue Continuo:** Vercel (`valentina-portal`)
* **Política de Entorno:** Todas las pruebas y accesos se realizan en el dominio productivo oficial `https://portal.valentina-ai.mx`.

## 🛠️ Stack Tecnológico
* **Framework:** Next.js 16 (App Router + Turbopack)
* **UI & Estética:** React 19, Tailwind CSS v4, Lucide Icons, Dark Glassmorphism
* **Autenticación & Base de Datos:** Supabase (Auth, RLS, Multi-Tenant)
* **Mensajería Omnicanal:** Meta WhatsApp Cloud API / Railway Backend
* **Documentación Ejecutiva:** PDF Generator con Hoja Membretada Institucional y Código QR de Validación

## 📂 Estructura Principal (`src/`)
* `app/`: Rutas Next.js (Dashboard principal y Endpoints de API)
* `components/`: Componentes UI modulares (LiveOmnichannelInbox, SuperAdminView, KnowledgeBaseManager, B2BQuoteGenerator, OnboardingWizard)
* `lib/`: Servicios de negocio (quotesService, serverAuth, supabaseClient)
* `types/`: Tipos de TypeScript estrictos para la plataforma multi-tenant
