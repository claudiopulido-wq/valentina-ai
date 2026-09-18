# 🛡️ AUDITORÍA REAL E INDEPENDIENTE: SAAS VALENTINA AI (`platform/`)
> **Segunda auditoría — basada en lectura directa del código fuente actual, no en reportes previos.**
> *Fecha:* 2026-09-17 | *Auditor:* Claude (Anthropic) | *Alcance:* `platform/src/**`
> *Motivo:* El informe anterior ([`auditoria_sistema_saas.md`](auditoria_sistema_saas.md)) declara "12/12 hallazgos 100% resueltos", pero el sistema no funciona en producción. Esta auditoría verificó cada hallazgo previo contra el código real y encontró que **la mayoría de los "arreglos" son cosméticos o directamente no existen**.

---

## 📊 RESUMEN EJECUTIVO

| Nivel de Riesgo | Cantidad | Estado real |
| :--- | :---: | :--- |
| 🔴 **Crítico (Seguridad — explotable hoy)** | **6** | Ninguno resuelto pese a lo declarado |
| 🟠 **Alto (El producto no hace lo que aparenta)** | **6** | Backend "SuperAdmin" casi inexistente |
| 🟡 **Medio (Datos/robustez)** | **5** | — |
| 🟢 **Enterprise (ausente por completo)** | **7** | Sin logging, tests, CI, rate limiting |

**Conclusión en una frase:** el portal es una interfaz de React muy bien diseñada visualmente, conectada a datos reales solo para **un tenant (UGES, solo lectura)** y para **cotizaciones**; todo lo demás — crear clientes, resetear contraseñas, canales "conectados", bandeja de mensajes, envío real de correos y WhatsApp — es simulación en memoria/`localStorage` que se ve real pero no persiste ni ejecuta nada en el backend.

---

## 🔧 ESTADO DE CORRECCIÓN — 2026-09-17 (Prioridad 1, verificado, no solo declarado)

A diferencia del informe anterior, cada corrección de esta sección fue **verificada con evidencia reproducible** (no solo declarada) antes de marcarse como resuelta: `npx tsc --noEmit` limpio, `npm run build` exitoso, e intento real de login con la contraseña maestra contra un servidor `next dev` levantado en este equipo.

| # | Hallazgo | Acción tomada | Verificación |
| :-: | :--- | :--- | :--- |
| 1.1 | Contraseña maestra universal | Eliminadas las 3 comparaciones `password === 'Valentina2026*'` y el bypass `!foundUser.password && password.length >= 6` en [`AuthModal.tsx`](platform/src/components/AuthModal.tsx). El login ahora depende **exclusivamente** de `supabase.auth.signInWithPassword`; si Supabase rechaza o no está configurado, se muestra error — sin fallback. | Probado en `next dev`: login con `contacto@valentina-ai.mx` / `Valentina2026*` → **"Credenciales no válidas"** (antes entraba como SuperAdmin). |
| 1.2 | Contraseñas en texto plano en el bundle | Eliminado el campo `password: 'Valentina2026*'` de los 3 usuarios semilla en [`mockData.ts`](platform/src/data/mockData.ts). | `grep -r "Valentina2026" platform/src` → sin resultados. |
| 1.3 | IDOR por header `x-user-id` | Eliminada por completo la rama de confianza en `x-user-id`/`Bearer <userId>` en [`serverAuth.ts`](platform/src/lib/serverAuth.ts). Ahora `getAuthenticatedUser` **solo** acepta un JWT de Supabase verificado con `supabase.auth.getUser(token)`; cualquier otra cosa devuelve `null` (401). También se quitó el envío inútil de `x-user-id` en [`knowledgeService.ts`](platform/src/lib/knowledgeService.ts). | Lectura de código: ya no existe ninguna ruta de autenticación que no pase por verificación criptográfica de JWT. |
| 1.4 | Contraseña en `localStorage` | [`page.tsx`](platform/src/app/page.tsx) ahora descarta el campo `password` (`const { password, ...safeUser }`) antes de guardar el usuario en `localStorage` o en el estado de React, en `handleLoginSuccess`. | `npx tsc --noEmit` limpio; el objeto persistido ya no puede contener contraseñas. |
| 1.5 | Clave de Supabase hardcodeada | Quitado el fallback `'sb_publishable_...'` de [`ugesSupabase.ts`](platform/src/lib/ugesSupabase.ts); si la env var falta, el cliente usa un placeholder inerte igual que `supabaseClient.ts` (falla cerrado, no expone una clave real). | Lectura de código + `npm run build` exitoso. |
| 1.6 | Sin rate limiting ni cabeceras de seguridad | Se creó [`platform/src/proxy.ts`](platform/src/proxy.ts) (convención `proxy` de Next.js 16, reemplazo de `middleware`) que aplica `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` a toda respuesta, y un rate limit de 30 solicitudes/60s por IP+ruta sobre `/api/*`. | Verificado con `fetch('/')` en el navegador: las 5 cabeceras aparecen en la respuesta real. Nota: el rate limit es en memoria (best-effort) — en Vercel multi-instancia no es un límite global exacto; para eso se recomienda Upstash Redis / Vercel KV a futuro. |

**Importante — consecuencia esperada de 1.1/1.3:** al eliminar todos los atajos inseguros, el login **ahora depende 100% de que existan cuentas reales en Supabase Auth**. Si las cuentas de `MOCK_USERS` (SuperAdmin incluido) no están creadas todavía en el panel de Supabase Auth con una contraseña real, **nadie podrá iniciar sesión** hasta que se den de alta ahí. Esto es intencional y correcto desde el punto de vista de seguridad, pero es un paso operativo pendiente: crear/confirmar en Supabase Auth (Dashboard → Authentication → Users) una cuenta para `contacto@valentina-ai.mx` y el resto de `MOCK_USERS`, con contraseñas fuertes y únicas.

**Pendiente de la Prioridad 1 (fuera de este alcance inmediato):** el punto 2.6 (reseteo de contraseña de admin no toca la cuenta real de Supabase) sigue abierto — requiere una ruta API server-side con `SUPABASE_SERVICE_ROLE_KEY` para llamar a `supabase.auth.admin.updateUserById`, que no existe hoy en `.env.local`. Se recomienda abordarlo junto con la Prioridad 2 (persistencia real de `tenants`/`users`).

---

## 🔴 PRIORIDAD 1 — CRÍTICO: Vulnerabilidades de seguridad activas

### 1.1 Contraseña maestra universal — bypass total de autenticación
* **Archivo:** [`platform/src/components/AuthModal.tsx`](platform/src/components/AuthModal.tsx) líneas **175-176, 216, 236**.
* **Evidencia:**
  ```ts
  if (foundUser && (foundUser.password === password ||
        password === 'Valentina2026*' ||           // ← línea 175
        (!foundUser.password && password.length >= 6))) { ... }
  ...
  if (foundUser && (foundUser.password === password || password === 'Valentina2026*')) { ... } // ← línea 216 (fallback de red)
  ...
  if (!foundUser || (foundUser.password && foundUser.password !== password && password !== 'Valentina2026*')) { ... } // ← línea 236 (sin Supabase)
  ```
* **Diagnóstico:** Literalmente **cualquier persona** que escriba `Valentina2026*` como contraseña entra con el email de **cualquier usuario del sistema**, incluido el SuperAdmin (`contacto@valentina-ai.mx`). Esto es peor que el hallazgo "1.1" del informe anterior (que hablaba de una sola contraseña hardcodeada `Santiago2021,`): ahora hay una **puerta trasera universal** en 3 rutas de código distintas.
* **Impacto:** Compromiso total e inmediato de todas las cuentas, incluidas las de clientes (UGES, CONOCER, Legal).
* **Solución:** Eliminar las 3 comparaciones `password === 'Valentina2026*'`. La autenticación debe depender exclusivamente de `supabase.auth.signInWithPassword`, sin ningún fallback a comparación de texto plano.

### 1.2 Contraseñas reales en texto plano dentro del bundle del cliente — NO RESUELTO
* **Archivo:** [`platform/src/data/mockData.ts`](platform/src/data/mockData.ts) líneas **626, 640, 654**.
* **Evidencia:** `MOCK_USERS` sigue exportando `password: 'Valentina2026*'` para las 3 cuentas `superadmin`/`tenant_admin`. Este archivo se importa desde `AuthModal.tsx` (`'use client'`), por lo que Next.js **lo compila dentro del JavaScript público** que cualquier visitante descarga. Basta con abrir DevTools → Sources → buscar "password" para ver la clave del dueño del sistema.
* **Esto es exactamente el hallazgo 1.1 del informe anterior**, marcado como "✅ 100% RESUELTO" — sigue presente sin cambios.

### 1.3 IDOR / Spoofing por header sigue activo (bypass parcial, no eliminado)
* **Archivo:** [`platform/src/lib/serverAuth.ts`](platform/src/lib/serverAuth.ts) líneas **72-84**.
* **Evidencia:** Se añadió verificación real de JWT de Supabase (bien), pero si esa verificación falla o no se envía `Bearer` token, el código **cae a confiar ciegamente en el header `x-user-id`**:
  ```ts
  const targetUserId = userIdHeader || (...);
  const user = MOCK_USERS.find((u) => u.id === targetUserId || ...);
  return user || null; // sin validar firma alguna
  ```
* **Diagnóstico:** `curl -H "x-user-id: user-superadmin" https://portal.valentina-ai.mx/api/tenants/1/knowledge` sigue autenticando como SuperAdmin sin contraseña ni token. El informe anterior declaró esto "resuelto" citando la verificación JWT, pero el fallback inseguro nunca se quitó.
* **Solución:** Eliminar por completo la rama de `x-user-id`; si no hay JWT válido de Supabase, responder 401.

### 1.4 Contraseñas guardadas en `localStorage` del navegador, en texto plano
* **Archivo:** [`platform/src/app/page.tsx`](platform/src/app/page.tsx) líneas **196-201, 261-274, 276-289**.
* **Evidencia:** `localStorage.setItem('valentina_auth_user', JSON.stringify(user))` guarda el objeto `AuthUser` completo — que incluye el campo `password` — sin cifrar, en el almacenamiento del navegador. `handleUpdateUserPassword` y `handleResetUserPassword` también mantienen el campo `password` en claro dentro del estado de React.
* **Impacto:** Cualquier extensión de Chrome maliciosa, XSS, o acceso físico al equipo expone la contraseña de la sesión activa.

### 1.5 Clave de Supabase hardcodeada como fallback en el repositorio
* **Archivo:** [`platform/src/lib/ugesSupabase.ts`](platform/src/lib/ugesSupabase.ts) línea **9**.
* **Evidencia:** `'sb_publishable_vbJQaQcMILT4QVUAj5Jouw_X9Kkmsbi'` como valor por defecto si la variable de entorno no está definida.
* **Diagnóstico:** Aunque sea una anon/publishable key (no una service key), queda **committeada en git para siempre** e ignora la propia regla del proyecto (`enterprise-security-guardrails`: "Nunca credenciales en código"). Si esa key se rota por una fuga, este fallback la reintroduce.
* **Solución:** Quitar el fallback; si la env var falta, fallar explícitamente en vez de usar una clave embebida.

### 1.6 Cero seguridad HTTP a nivel de plataforma
* **Evidencia:** No existe `middleware.ts` en `platform/src/` ni configuración de `headers()` en [`next.config.ts`](platform/next.config.ts) (solo define `turbopack.root`). No hay rate limiting, no hay `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`, ni CORS explícito en ninguna de las 5 rutas API.
* **Diagnóstico:** Contradice directamente las reglas propias del proyecto en `.agents/skills/enterprise-security-guardrails/SKILL.md` ("Implementar cabeceras de seguridad... Rate Limiting..."). Los endpoints `/api/sales/send-quote` y `/api/channels/whatsapp/send-message` son públicos y **sin límite de solicitudes**: cualquiera puede hacer spam de envíos de correo o de "mensajes de WhatsApp" (aunque estos últimos caigan en modo simulado, ver 2.2).

---

## 🟠 PRIORIDAD 2 — ALTO: El producto no hace lo que declara

### 2.1 El panel SuperAdmin no tiene backend — todo es estado de React + `localStorage`
* **Archivo:** [`platform/src/app/page.tsx`](platform/src/app/page.tsx) — funciones `handleCreateTenantAndUser` (232-245), `handleToggleUserStatus` (247-259), `handleUpdateUserPassword` (261-274), `handleResetUserPassword` (276-289), `handleUpdateTenant` (216-230).
* **Evidencia:** Ninguna de estas funciones llama a una API. Solo hacen `setUsers(...)`, `setTenants(...)` y `localStorage.setItem(...)`.
* **Diagnóstico crítico:** Cuando el SuperAdmin "da de alta un nuevo cliente" con el wizard de onboarding, o "resetea la contraseña" de un usuario desde `CredentialsDirectoryTab.tsx`, **eso solo existe en el `localStorage` de ese navegador específico**. Si Claudio entra desde otra computadora, el cliente nuevo no existe. Si el usuario borra caché, desaparece. **No hay tabla de `tenants` ni de `users` en Supabase** — solo hay tabla de `commercial_quotes` (parcialmente sincronizada). Esto explica en gran medida el reporte de "no funciona": las altas de clientes reales no se guardan en ningún lado persistente y compartido.
* **Confirmado además:** de las únicas 5 rutas API que existen en todo el proyecto (`find src/app/api -type f`), ninguna es `tenants`, `users`, `auth` o `onboarding` — solo `sales/send-quote`, `channels/whatsapp/send-message` y 3 de `knowledge`.

### 2.2 Envío de mensajes de WhatsApp: éxito falso cuando falla
* **Archivo:** [`platform/src/app/api/channels/whatsapp/send-message/route.ts`](platform/src/app/api/channels/whatsapp/send-message/route.ts) líneas **80-93**.
* **Evidencia:**
  ```ts
  } catch (railwayErr) {
    console.warn('Gateway Railway no disponible, operando en modo local resiliente:', railwayErr);
  }
  // Fallback simulado para entorno sandbox/demo
  return NextResponse.json({ success: true, status: 'sent', gateway: 'simulated_local', ... });
  ```
  Ni siquiera se revisa si la respuesta de Railway fue `!response.ok` fuera del `try` — solo se atrapa la excepción de red. Si Railway responde 500, 401 o 404 sin lanzar excepción, el código sigue de largo y **igual devuelve `success: true`**.
* **Impacto:** El operador humano en `LiveOmnichannelInbox.tsx` ve "✓ Enviado" en la UI sin importar si el mensaje realmente llegó al cliente por WhatsApp. Esto es, muy probablemente, la causa directa de "dice que funciona pero no funciona": **el sistema está diseñado para nunca mostrar un error de envío**.

### 2.3 Envío de cotizaciones por correo: modo simulado permanente en este entorno
* **Archivo:** [`platform/src/app/api/sales/send-quote/route.ts`](platform/src/app/api/sales/send-quote/route.ts) línea **128** (`if (workspacePassword)`).
* **Evidencia:** `platform/.env.local` **no define** `GOOGLE_WORKSPACE_APP_PASSWORD` ni `SMTP_PASSWORD` (verificado directamente en el archivo). Por lo tanto `workspacePassword` es `undefined` y el endpoint **siempre** cae al bloque de `simulated: true` (línea 159-167).
* **Diagnóstico:** El informe anterior marcó este punto como "✅ COMPLETADO / DESPACHO REAL", pero en el entorno actual **nunca se envía un correo real** — cada cotización "enviada" desde el Cotizador B2B solo genera una respuesta JSON falsa de éxito. Si en Vercel tampoco está configurada esa variable, ningún cliente ha recibido jamás una cotización por este medio.

### 2.4 Mapeo de tenants a Railway: 1 solo cliente conectado, el resto sin base de conocimiento funcional
* **Archivo:** [`platform/src/lib/serverAuth.ts`](platform/src/lib/serverAuth.ts) líneas **10-14**.
* **Evidencia:** `TENANT_ID_MAPPING` solo contiene `'tenant-uges': 1`. El comentario dice "Futuros clientes se agregarán aquí" — es decir, **manual**, no automático.
* **Diagnóstico:** Cualquier tenant creado por el wizard de onboarding (CONOCER, Legal, o uno nuevo real) no tiene `railwayTenantId` mapeado server-side. Aunque `KnowledgeBaseManager.tsx` intente resolverlo con `tenant.railwayTenantId ?? null`, `authorizeKnowledgeRequest` seguirá rechazando con `FORBIDDEN_TENANT_MISMATCH` a cualquier `tenant_admin` que no sea de UGES, porque `getSlugForNumericTenantId` no encuentra el tenant. **La Base de Conocimiento RAG está funcionalmente rota para todos los clientes salvo UGES.**

### 2.5 Toda la "telemetría en vivo" de todos los tenants excepto UGES es 100% estática
* **Archivo:** [`platform/src/data/mockData.ts`](platform/src/data/mockData.ts) (arrays `MOCK_TENANTS`, `MOCK_CONVERSATIONS`, `MOCK_TELEMETRY`) y su consumo en [`platform/src/app/page.tsx`](platform/src/app/page.tsx) líneas **334-342**.
* **Evidencia:** `currentConversations` y `currentTelemetry` solo se sustituyen por datos reales **si `currentTenant.id === 'tenant-uges'`**; para cualquier otro tenant, siempre se usa el array hardcodeado (`lastPing: 'Hace 2 seg'`, `batteryLevel: 98`, mensajes de ejemplo de "Botox", "CONOCER", "Vanguardia Jurídica" con fechas y nombres ficticios que nunca cambian).
* **Diagnóstico:** El "Portal de Monitoreo en Vivo" que se promete a cada cliente en `knowledge_base_chatbot.md` §4 **no existe** para ningún cliente real que no sea UGES. Es una demo permanente disfrazada de producto en producción.

### 2.6 Reseteo de contraseña de administrador no toca la cuenta real de Supabase Auth
* **Archivo:** [`platform/src/app/page.tsx`](platform/src/app/page.tsx) líneas **276-289**; sin contraparte en `AuthModal.tsx` más que `supabase.auth.updateUser` (que solo funciona para la sesión *propia* ya autenticada, línea 284).
* **Diagnóstico:** Cuando el SuperAdmin usa "Resetear contraseña" sobre otro usuario en `CredentialsDirectoryTab.tsx`, solo cambia el campo `password` en el objeto local de React/`localStorage`. No existe llamada server-side a `supabase.auth.admin.updateUserById` (que requeriría `SUPABASE_SERVICE_ROLE_KEY`, inexistente en `.env.local`). Si ese usuario tiene una cuenta real en Supabase Auth, **su contraseña real nunca cambia** — solo cambia el valor que habilita el bypass universal de la sección 1.1.

---

## 🔧 ESTADO DE CORRECCIÓN — 2026-09-17 (Prioridad 2)

Igual que en la Prioridad 1, cada corrección se implementó con código real (no solo se documentó) y se verificó con `npx tsc --noEmit`, `npm run build` y pruebas de los endpoints nuevos contra un servidor `next dev` real.

| # | Hallazgo | Acción tomada |
| :-: | :--- | :--- |
| 2.1 | Sin backend real para tenants/usuarios | Se creó la tabla `tenants` (columna `data JSONB` + campos indexados) y `platform_users` en Supabase (SQL agregado al modal existente en [`SupabaseSqlModal`](platform/src/components/superadmin/SupabaseSqlModal.tsx), definido en [`SuperAdminView.tsx`](platform/src/components/SuperAdminView.tsx)). Se agregaron rutas API reales: [`/api/tenants`](platform/src/app/api/tenants/route.ts) (GET/POST), [`/api/tenants/[tenantId]`](platform/src/app/api/tenants/%5BtenantId%5D/route.ts) (PATCH), [`/api/users`](platform/src/app/api/users/route.ts) (GET/POST), [`/api/users/[userId]`](platform/src/app/api/users/%5BuserId%5D/route.ts) (PATCH), y un cliente de servicio [`supabaseAdmin.ts`](platform/src/lib/supabaseAdmin.ts) (service_role, solo servidor). `page.tsx` ahora hidrata tenants/usuarios desde el servidor tras el login y persiste cada alta/edición vía [`adminDataService.ts`](platform/src/lib/adminDataService.ts), en vez de vivir solo en `localStorage`. |
| 2.2 | WhatsApp reportaba éxito aunque fallara | [`send-message/route.ts`](platform/src/app/api/channels/whatsapp/send-message/route.ts) ahora distingue 3 resultados reales: éxito real (`gateway: 'railway_whatsapp_cloud'`), fallo real (`success: false`, HTTP 502, con el error del gateway) y modo sandbox explícito (`simulated: true`). [`LiveOmnichannelInbox.tsx`](platform/src/components/LiveOmnichannelInbox.tsx) ahora muestra un banner rojo si el mensaje no se entregó y uno ámbar si fue simulado, en vez de mostrar "enviado" siempre. |
| 2.3 | UI no distinguía envío real vs. simulado | [`SalesQuoteGeneratorModal.tsx`](platform/src/components/sales/SalesQuoteGeneratorModal.tsx) ahora muestra un aviso explícito "⚠️ Modo simulado" cuando el correo no se despachó de verdad. Además se encontró y corrigió un caso más grave del mismo patrón: el botón "Disparar por API" en [`ClientDossierModal.tsx`](platform/src/components/dossier/ClientDossierModal.tsx) afirmaba "¡Expediente Despachado con Éxito! ... vía Resend API ... STATUS 200 OK" sin ejecutar ninguna petición real (`handleSimulateWebhook` solo cambiaba un booleano). Se renombró a "Vista previa de notificación (demo)" con un aviso honesto de que no se envía nada real. |
| 2.4 | Mapeo tenant→Railway hardcodeado (solo UGES) | `getSlugForNumericTenantId` en [`serverAuth.ts`](platform/src/lib/serverAuth.ts) ahora resuelve dinámicamente contra la tabla `tenants` (columna `railway_tenant_id`) para cualquier cliente dado de alta, con el mapa estático anterior como respaldo solo si la tabla no existe todavía. |
| 2.5 | Telemetría 100% estática presentada como en vivo | Se agregó un badge ámbar "Datos de ejemplo (DEMO)" en el header de [`page.tsx`](platform/src/app/page.tsx) para cualquier tenant que no sea UGES, dejando explícito que esos números no son en vivo (antes no había ninguna distinción visual). |
| 2.6 | Reset de contraseña no tocaba la cuenta real | Nueva ruta [`/api/users/[userId]/reset-password`](platform/src/app/api/users/%5BuserId%5D/reset-password/route.ts): genera una contraseña temporal de alta entropía (`crypto.randomBytes`, ya no el patrón adivinable `Val_slug!2026`) y llama a `supabaseAdmin.auth.admin.updateUserById` — la cuenta real de Supabase Auth cambia de verdad. [`SuperAdminView.tsx`](platform/src/components/SuperAdminView.tsx) ahora espera esa respuesta y muestra un error si falla, en vez de fingir éxito. También se cerró el ciclo del "primer login": [`AuthModal.tsx`](platform/src/components/AuthModal.tsx) ahora espera a que `supabase.auth.updateUser` confirme el cambio antes de continuar, y limpia la bandera `mustChangePassword` en el servidor vía [`/api/users/me/complete-password-change`](platform/src/app/api/users/me/complete-password-change/route.ts). |

**Verificado en este equipo:** `npx tsc --noEmit` y `npm run build` limpios (13 rutas API compiladas); con `next dev` corriendo, `fetch('/api/users')`, `fetch('/api/tenants')` y `fetch('/api/users/me')` sin sesión devuelven `401 UNAUTHORIZED` — es decir, los endpoints existen y están protegidos, no simulan datos.

**Pendiente de tu lado antes de que 2.1/2.4/2.6 operen en producción (no algo que yo pueda ejecutar por ti):**
1. Abrir el modal "Ver esquema SQL" en SuperAdmin → Directorio de Empresas y ejecutar el script completo (ya incluye las tablas nuevas `tenants` y `platform_users`) en el SQL Editor de tu proyecto de Supabase.
2. Agregar `SUPABASE_SERVICE_ROLE_KEY` a `platform/.env.local` (y a las variables de entorno de Vercel) — la encuentras en Supabase Dashboard → Project Settings → API → **service_role** (secreto, nunca `NEXT_PUBLIC_`). Sin esto, las rutas de alta de usuario y reseteo de contraseña responderán con un error claro de configuración (no fingirán éxito), y el mapeo de tenants seguirá limitado a UGES.
3. Para que el envío de cotizaciones deje de ser simulado (2.3), agregar `GOOGLE_WORKSPACE_APP_PASSWORD` (contraseña de aplicación de Gmail) en el mismo lugar.

**Nota de alcance:** 2.5 (telemetría en vivo real para tenants distintos a UGES) requiere conectar cada cliente a su propio backend de chatbot/RAG — eso es un proyecto de integración de datos, no un bug de la consola, así que aquí solo se corrigió la parte honesta (dejar de presentarlo como en vivo cuando no lo es).

---

## 🟡 PRIORIDAD 3 — MEDIO: Robustez y datos

### 3.1 Sin validación de esquema (Zod/Joi) en ningún endpoint
Los 5 route handlers validan campos manualmente con `if (!campo)`. No hay una capa de validación de tipos/formatos (email válido, teléfono, longitud máxima), pese a que `enterprise-security-guardrails/SKILL.md` lo exige explícitamente ("Todo payload JSON entrante debe validarse contra esquemas estrictos").

### 3.2 Sin idempotencia en envíos de mensajes/correos
`send-message` y `send-quote` no aceptan ni generan `event_id`/`message_id` para deduplicar reintentos, contradiciendo `enterprise-workflow-automation/SKILL.md` §1.

### 3.3 Cuenta bancaria (CLABE) en texto plano dentro del código fuente
* **Archivo:** [`platform/src/app/api/sales/send-quote/route.ts`](platform/src/app/api/sales/send-quote/route.ts) línea **110**: `012 680 0154892301 22`.
* No es una vulnerabilidad técnica, pero es un dato financiero sensible commiteado a git en lugar de vivir en una variable de entorno o config de negocio.

### 3.4 `quotesService.ts` sincroniza a Supabase, pero silencia todos los errores
Líneas 155-181, 222-227, 260-263: cualquier error de Supabase (incluida una tabla mal migrada, RLS mal configurada, o clave inválida) se atrapa con `console.warn` y el usuario nunca se entera de que su cotización *no* se guardó en la nube — solo queda en el `localStorage` de ese navegador.

### 3.5 `.env.local` con múltiples proveedores mezclados sin separación de entornos
El mismo `.env.local` contiene credenciales de Supabase, Railway, y **tokens de automatización de Vercel** (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`). No hay evidencia de separación entre variables de "build/deploy" y variables de "runtime de la app", lo que aumenta el radio de exposición si el archivo se filtra.

---

## 🔧 ESTADO DE CORRECCIÓN — 2026-09-17 (Prioridad 3)

| # | Hallazgo | Acción tomada |
| :-: | :--- | :--- |
| 3.1 | Sin validación de esquema | Se agregó `zod` como dependencia directa y un módulo central [`validation.ts`](platform/src/lib/validation.ts) con esquemas estrictos (tipos, formatos de email, longitudes máximas, enums) para las **8** rutas API que reciben body: `send-message`, `send-quote`, `knowledge` (crear/editar), `tenants` (crear/editar) y `users` (crear/editar). Cada ruta ahora responde `400 VALIDATION_ERROR` con el detalle campo-por-campo en vez de solo revisar `if (!campo)`. |
| 3.2 | Sin idempotencia | Nuevo helper [`idempotency.ts`](platform/src/lib/idempotency.ts) (deduplicación en memoria por ventana de tiempo, con la misma limitación best-effort del rate limiter de `proxy.ts` documentada en el propio código). Aplicado a `send-message` (mismo texto a la misma conversación en 15s → `deduped: true`, no reenvía) y `send-quote` (misma cotización al mismo destinatario en 30s). |
| 3.3 | CLABE hardcodeada en el código | Al revisar esto se encontraron **dos CLABEs distintas** en 4 archivos ([send-quote/route.ts](platform/src/app/api/sales/send-quote/route.ts), [SalesQuoteGeneratorModal.tsx](platform/src/components/sales/SalesQuoteGeneratorModal.tsx), [ExecutiveQuoteSheet.tsx](platform/src/components/dossier/ExecutiveQuoteSheet.tsx), [CommercialQuotePdfSheet.tsx](platform/src/components/sales/CommercialQuotePdfSheet.tsx)) — un riesgo real de que un cliente pague a la cuenta equivocada. Se consultó al propietario y, por instrucción explícita, **se removieron ambas** de los 4 archivos; ahora los documentos/correos dicen "los datos bancarios se comparten por separado" sin número de cuenta. Pendiente: agregar la CLABE correcta (única) cuando se confirme, idealmente vía variable de entorno en vez de hardcodeada. |
| 3.4 | Errores de sync silenciados | `saveCommercialQuote` en [`quotesService.ts`](platform/src/lib/quotesService.ts) ya no devuelve `void`: devuelve `{ savedLocally, syncedToCloud, cloudError? }`. [`SuperAdminView.tsx`](platform/src/components/SuperAdminView.tsx) ahora muestra un banner ámbar visible ("Guardado localmente, pero no se sincronizó con la nube: ...") cuando la escritura a Supabase falla, en vez de solo un `console.warn` invisible para el usuario. |
| 3.5 | Secretos de Vercel mezclados en `.env.local` | Confirmé por grep que `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` **no se usan en ningún lugar del código de la app** (`platform/src/`) — son credenciales de automatización de despliegue, no de runtime. **No edité tu `.env.local`** porque contiene secretos reales; la recomendación es moverlos a variables de entorno del pipeline de CI/CD (GitHub Actions, etc.) y sacarlas de este archivo, ya que Next.js carga todo `.env.local` en el proceso del servidor sin necesidad de que el código las referencie. |

**Verificado en vivo:** con `next dev` corriendo, probé los 3 nuevos comportamientos directamente:
- `POST /api/channels/whatsapp/send-message` con `recipient`/`message` vacíos → `400 VALIDATION_ERROR` con el detalle exacto de cada campo.
- El mismo mensaje enviado dos veces seguidas a la misma conversación → la segunda respuesta trae `deduped: true` (no se reenvía).
- `POST /api/sales/send-quote` con un email inválido y una cotización incompleta → `400 VALIDATION_ERROR` listando los 12 campos faltantes/incorrectos.
- **Hallazgo colateral real:** al probar un envío de WhatsApp válido, el gateway de Railway configurado en `PLATFORM_API_KEY`/`PLATFORM_API_BASE_URL` respondió `404 Not Found` para `/api/channels/whatsapp/send`. Antes esto quedaba oculto por el bug de la sección 2.2 (siempre reportaba éxito); ahora se ve como el `502` real que es. **Esto sugiere que el backend de Railway todavía no expone ese endpoint específico** — no es algo que se corrija desde `platform/`, sino en el repositorio del backend de WhatsApp/RAG en Railway.

---

## 🟢 PRIORIDAD 4 — MEJORAS DE NIVEL ENTERPRISE AUSENTES

Ninguna de estas existe hoy en `platform/`:

1. **Observabilidad real:** cero integración con Sentry/Datadog/similar. Todos los errores van a `console.warn`/`console.error`, invisibles en producción (Vercel logs rotan y nadie los revisa en vivo).
2. **Pruebas automatizadas:** `find src -iname '*.test.*' -o -iname '*.spec.*'` → **0 resultados**. Ningún componente, servicio ni ruta API tiene test unitario o de integración.
3. **CI/CD:** no existe `.github/workflows/` ni pipeline equivalente — cada `git push` a `main` se despliega a producción sin build gate, sin lint gate, sin test gate.
4. **Rate limiting / WAF:** ninguno (ver 1.6).
5. **Auditoría de acciones administrativas:** no hay tabla `audit_log`; nadie puede saber quién creó/borró un tenant o cambió un permiso, porque ni siquiera se persiste server-side (ver 2.1).
6. **Manejo de secretos en producción:** no hay evidencia de un vault (Vercel Environment Variables es el único mecanismo); no hay rotación programada ni alertas de expiración de `PLATFORM_API_KEY`.
7. **Feature flags / entornos staging vs. producción:** todo corre directo contra producción; no hay forma de probar un cambio de precios o un nuevo flujo de onboarding sin arriesgar el entorno real de clientes.

---

## 🔧 ESTADO DE CORRECCIÓN — 2026-09-17 (Prioridad 4)

| # | Mejora | Acción tomada |
| :-: | :--- | :--- |
| 1 | Observabilidad real | Nuevo [`logger.ts`](platform/src/lib/logger.ts): logging estructurado en JSON (`timestamp`, `level`, `route`, contexto) con **enmascarado automático de PII** (emails, teléfonos, tokens `Bearer`) y redacción total de `password`/`secret`/`token`/`apiKey`, siguiendo la regla propia del proyecto en `enterprise-security-guardrails/SKILL.md`. Reemplacé los 14 `console.warn`/`console.error` de las 8 rutas API tocadas por este logger. Esto no es Sentry/Datadog (no tengo un DSN real que configurar), pero deja la estructura lista para conectar uno en una sola línea en vez de reescribir cada log disperso. |
| 2 | Pruebas automatizadas | Instalé `vitest` y escribí **41 tests reales** (no placeholders) para la lógica más crítica que se tocó en esta auditoría: [`validation.test.ts`](platform/src/lib/validation.test.ts) (17, valida que los esquemas Zod realmente rechazan lo que deben), [`idempotency.test.ts`](platform/src/lib/idempotency.test.ts) (4), [`rateLimiter.test.ts`](platform/src/lib/rateLimiter.test.ts) (5, extraído de `proxy.ts` a su propio módulo para poder probarlo), [`permissions.test.ts`](platform/src/lib/permissions.test.ts) (9, cubre el RBAC por nivel que ya existía y nunca se había probado) y [`logger.test.ts`](platform/src/lib/logger.test.ts) (6). Corren con `npm test`. |
| 3 | CI/CD | Nuevo [`.github/workflows/platform-ci.yml`](.github/workflows/platform-ci.yml): en cada push/PR que toque `platform/` corre `tsc --noEmit`, lint (no bloqueante todavía, hay deuda preexistente documentada en 3.1 original), `npm test` y `npm run build`. No reemplaza el despliegue de Vercel; es el gate que faltaba antes de fusionar. |
| 4 | Rate limiting / WAF | Ya resuelto en la sección 1 (`proxy.ts`). Aquí solo se refactorizó a la clase [`RateLimiter`](platform/src/lib/rateLimiter.ts) para poder probarla con tests unitarios reales en vez de solo confiar en que "compila". |
| 5 | Auditoría de acciones administrativas | Nueva tabla `audit_log` (agregada al SQL del modal de SuperAdmin) + helper [`auditLog.ts`](platform/src/lib/auditLog.ts), best-effort y no bloqueante. Se registra `actor_id`, `actor_email`, `target_id` y detalles en cada: alta de tenant, edición de tenant, alta de usuario, edición de usuario (incluida la migración de una cuenta semilla) y reseteo de contraseña. |

**Verificado:** `npx tsc --noEmit`, `npm test` (41/41 ✅) y `npm run build` corridos localmente en el mismo orden que ejecutará el workflow de CI, todos limpios.

**Nota de transparencia sobre `vitest`:** al instalarlo con `@types/node ^20` (la versión que ya usa el proyecto), `npm audit` reporta 5 vulnerabilidades (3 moderadas, 1 alta, 1 crítica) en `esbuild`/`vite` — todas específicas del **servidor de desarrollo de Vitest/Vite** (path traversal y CORS del dev server), no del código que se despliega a producción, y solo explotables si alguien tiene acceso de red al proceso de `vitest` mientras corre interactivamente (no aplica en CI ni en producción). La corrección requiere `vitest@5`, que a su vez exige `@types/node >=22` — quedó fuera de este alcance para no forzar una migración de tipos de Node no relacionada. Recomendación: evaluar esa migración en un cambio aparte cuando se actualice Next/Node.

### #7 Feature flags — resuelto tras tu decisión

Preguntado directamente (la Política Cero-Localhost de tu `AGENTS.md` prohíbe un staging real), elegiste **feature flags en producción**. Implementado en [`featureFlags.ts`](platform/src/lib/featureFlags.ts): `isFeatureEnabled(flag, userEmail)` activa una función globalmente vía variable de entorno (`envVar === 'true'|'1'`), o solo para una lista de correos beta (típicamente tu propio usuario) mientras el flag global sigue apagado para todos los clientes. Es una función pura, sin estado ni base de datos — se integra donde haga falta con dos líneas:

```ts
const NUEVO_FLUJO: FeatureFlagDefinition = { envVar: 'FEATURE_X', betaEmails: ['contacto@valentina-ai.mx'] };
if (isFeatureEnabled(NUEVO_FLUJO, currentUser?.email)) { /* ... */ }
```

Probado con [`featureFlags.test.ts`](platform/src/lib/featureFlags.test.ts) (5 tests: flag apagado por defecto, activación global por `'true'`/`'1'`, activación solo para beta tester, case-insensitive en el email). Suite completa: **46/46 tests pasando**.

### Pendiente que requiere una decisión tuya (no solo código)

* **#6 Manejo de secretos en producción:** no implementé un vault (Hashicorp Vault, Doppler, etc.) porque es una decisión de infraestructura y costo, no un bug de código. Recomendación concreta: activar en Vercel la separación de variables por entorno (Production/Preview/Development) si no lo has hecho, y poner un recordatorio recurrente de rotación para `PLATFORM_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `GOOGLE_WORKSPACE_APP_PASSWORD`.

---

## ✅ Lo que sí está bien hecho (para no perder la perspectiva)
* La descomposición de componentes (`SuperAdminView`, `ClientOnboardingWizard`, `KnowledgeBaseManager`) en subcomponentes más pequeños **sí se hizo** y el código es legible.
* `authorizeKnowledgeRequest` (cuando se le fuerza el camino JWT) es un diseño correcto de RBAC + aislamiento multi-tenant — el problema es el *fallback* inseguro, no el diseño principal.
* La integración read-only de UGES (`ugesSupabase.ts`, `ugesDataService.ts`) sí trae datos reales y en vivo — es la prueba de que el patrón correcto existe en el repo, solo falta replicarlo (de forma segura) para el resto de los tenants.
* `npx tsc --noEmit` no arrojó errores de tipos, y `npm audit` no reportó vulnerabilidades conocidas en dependencias.

---

## 🎯 Plan de acción recomendado (orden de ejecución)

1. **Hoy mismo:** eliminar las 3 comparaciones `password === 'Valentina2026*'` y el campo `password` de `MOCK_USERS`/`mockData.ts`. Sin esto, el sistema no debería abrirse a clientes bajo ninguna circunstancia.
2. **Esta semana:** eliminar el fallback `x-user-id` en `serverAuth.ts`; crear las tablas `tenants` y `users` en Supabase con RLS y migrar las funciones `handleCreate/Update/Toggle/Reset*` de `page.tsx` a rutas API reales (`/api/tenants`, `/api/users`) en vez de estado local.
3. **Antes de vender un plan nuevo:** configurar `GOOGLE_WORKSPACE_APP_PASSWORD` real en Vercel y verificar con un envío de prueba; corregir `send-message` para que `success` refleje el `response.ok` real de Railway, no un catch silencioso.
4. **Antes de escalar a más de 4 clientes:** automatizar `TENANT_ID_MAPPING` (resolverlo desde Supabase en vez de un objeto hardcodeado) y construir el mismo patrón de datos en vivo de UGES para el resto de los tenants.
5. **Estructural:** agregar `middleware.ts` con rate limiting + cabeceras de seguridad, Sentry, y al menos pruebas de integración para las 5 rutas API existentes.
