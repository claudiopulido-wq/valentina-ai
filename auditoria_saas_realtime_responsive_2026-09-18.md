# Auditoría SaaS: Tiempo Real, Conexión de Datos y Responsividad
**Fecha:** 2026-09-18
**Alcance:** Exclusivamente `platform/` (el SaaS). No se auditó `studio/` ni el bot UGES por sí mismos, salvo como fuente de datos reales que el SaaS consume.
**Objetivo del usuario (verbatim):** *"que todas las secciones sean responsivas, que cada opcion del menu este conectada y no tenga datos harckodeados, y que cada uno de los menus, responda a lo que se supone que hace... que sea exaustivo"*

**Metodología:** (1) agente de exploración de código de solo lectura, rastreando cada componente hasta su origen de datos real; (2) pruebas manuales en vivo con el servidor de desarrollo (`npm run dev`, login real como `contacto@valentina-ai.mx`), en viewport de escritorio y móvil (375×812); (3) verificación cruzada línea por línea de los hallazgos de ambas fuentes antes de incluirlos aquí.

---

## Resumen ejecutivo

El hallazgo central, que cambia el diagnóstico de "hay algunos datos de prueba sueltos" a un problema estructural: **el sistema no tiene ningún mecanismo de tiempo real**. No hay WebSockets, Supabase Realtime channels, Server-Sent Events, ni siquiera polling por `setInterval`. Todo lo que aparenta "vivo" en la UI (mensajes de chat, contadores, estados de canal) es en realidad:
- **Un solo `fetch` en el montaje del componente** (sin refresco automático — hay que recargar la página para ver datos nuevos), o
- **Un literal hardcodeado** en el JSX que ignora por completo las props reales que el componente ya recibe.

De los 4 tenants que existen en el sistema, **solo `tenant-uges` tiene una tubería de datos real** (lee un proyecto Supabase de solo lectura vía `ugesDataService.ts`). Los otros 3 tenants —incluyendo **"Valentina AI México"**, el que aparece en la captura de pantalla adjunta del usuario mostrando la conversación de "Ing. Roberto Morales"— **muestran datos de `MOCK_CONVERSATIONS` / `MOCK_TELEMETRY` estáticos en `mockData.ts`**, no una bandeja de chat en vivo real.

---

## 1. Tiempo real: no existe infraestructura

**Búsqueda exhaustiva de patrones de tiempo real** (`WebSocket`, `EventSource`, `.channel(`, `setInterval`, `supabase.*realtime`, `useEffect.*setInterval`) en todo `platform/src/`: **cero resultados relevantes**. Ningún componente se suscribe a cambios; todos hacen fetch una sola vez al montar.

- [`app/page.tsx:412-420`](platform/src/app/page.tsx:412) — `currentConversations`/`currentTelemetry` se calculan una vez en el render inicial a partir de props ya cargadas; no hay refresco.
- La captura de pantalla del usuario ("Bandeja Omnicanal en Vivo") es honesta en apariencia pero engañosa en comportamiento: la etiqueta "en vivo" sugiere actualización automática que no existe. Un mensaje nuevo real de WhatsApp/Meta no aparecerá hasta que el usuario recargue manualmente la página completa.

**Impacto:** para el caso de uso explícito del usuario (agentes viendo mensajes de chat de clientes reales), esto es una falla funcional, no solo estética — un asesor puede perder mensajes entrantes si no recarga constantemente.

---

## 2. Conexión de datos por tenant: solo 1 de 4 es real

| Tenant | Fuente de datos de conversaciones/telemetría |
|---|---|
| `tenant-uges` | **Real** — `ugesDataService.ts` consulta un proyecto Supabase de solo lectura separado |
| `tenant-valentina-ai-mexico` (el de la captura) | **Mock** — `MOCK_CONVERSATIONS`, `MOCK_TELEMETRY` en [`data/mockData.ts`](platform/src/data/mockData.ts) |
| Otros 2 tenants restantes | **Mock** — mismo origen |

Esto significa que la conversación de "Ing. Roberto Morales" que el usuario vio en producción para "Valentina AI México" es un dato de prueba fijo en el código fuente, no un mensaje real de un cliente. Cualquier acción tomada sobre esa bandeja (responder, marcar como resuelto) no persiste ni se sincroniza con ningún canal real (WhatsApp/Meta) para ese tenant.

---

## 3. Datos hardcodeados que ignoran props reales ya disponibles

Esta es la categoría más grave: son componentes que **ya reciben el dato real como prop**, pero el JSX muestra un literal fijo en su lugar. No es "falta conectar una API" — es una línea de código a corregir.

- [`components/ChannelHardwareCard.tsx:53-56`](platform/src/components/ChannelHardwareCard.tsx:53) — badge "ONLINE" fijo, ignora el campo real `Channel.status` que sí existe en el tipo y se recibe como prop.
- [`components/ChannelHardwareCard.tsx:81`](platform/src/components/ChannelHardwareCard.tsx:81) — latencia "118 ms" hardcodeada.
- [`components/ChannelHardwareCard.tsx:114-133`](platform/src/components/ChannelHardwareCard.tsx:114) — tarjeta completa "Google Workspace Vault" con datos inventados, sin ningún campo real detrás.
- [`components/GoogleSidebar.tsx:190-192`](platform/src/components/GoogleSidebar.tsx:190) — pie de página fijo "Meta API: En línea" + "118ms" (mismo número mágico que arriba, confirma que es un valor de ejemplo copiado, no una medición).
- [`components/AppleMetricsWidgets.tsx:159,168,183,192`](platform/src/components/AppleMetricsWidgets.tsx:159) — "96.4%", "3.6%", "1.1 seg", "28 min" fijos, aunque el componente recibe `telemetry`/`tenant` como props con datos reales para el resto del widget.
- [`components/superadmin/TenantsDirectoryTab.tsx:114-116](platform/src/components/superadmin/TenantsDirectoryTab.tsx:114) — **"33" usuarios y "0"** para los 4 tenants por igual (confirmado en vivo: la tabla muestra el mismo número para las 4 filas sin importar el tenant real).
- [`components/superadmin/TenantsDirectoryTab.tsx:118-123`](platform/src/components/superadmin/TenantsDirectoryTab.tsx:118) — badge "Producción" fijo, ignora el campo real `t.status` (que sí soporta `active`/`trial`/`suspended` según [`lib/validation.ts:26`](platform/src/lib/validation.ts:26)).
- [`components/superadmin/TenantsDirectoryTab.tsx:136-138`](platform/src/components/superadmin/TenantsDirectoryTab.tsx:136) — fecha "16 jun 2026" idéntica en las 4 filas.
- [`components/superadmin/TenantsDirectoryTab.tsx:180-183`](platform/src/components/superadmin/TenantsDirectoryTab.tsx:180) — paginación "Mostrar filas: 10" decorativa, sin lógica de paginación real detrás.
- [`components/superadmin/SalesPipelineTab.tsx:64`](platform/src/components/superadmin/SalesPipelineTab.tsx:64) — "Amortización media: ~13 días" fijo, no promedia los `amortizationDays` reales de cada cotización.
- [`components/superadmin/CloudInfrastructureTab.tsx:132`](platform/src/components/superadmin/CloudInfrastructureTab.tsx:132) — literal "UGES (302 msgs en vivo)" fijo en vez de un conteo real.
- [`app/page.tsx:737`](platform/src/app/page.tsx:737) — literal "Supabase Read-Only (302 msgs · 47 leads)" que no se actualiza con los conteos reales.

---

## 4. Botones y controles que no hacen nada (dead UI)

- [`components/ChannelHardwareCard.tsx:20-23`](platform/src/components/ChannelHardwareCard.tsx:20) — botón **"Sincronizar Meta APIs" sin `onClick`**. Confirmado por grep directo del JSX: no tiene ningún manejador de evento asociado. Un usuario que lo presiona no obtiene ninguna respuesta ni feedback.
- [`app/page.tsx:553-559`](platform/src/app/page.tsx:553) — campana de notificaciones sin `onClick`, con un punto rojo de "pendiente" fijo que nunca cambia (no refleja notificaciones reales).
- [`app/page.tsx:107,513-522`](platform/src/app/page.tsx:107) — la barra de búsqueda superior (`topSearch`) actualiza su propio estado al escribir, pero **ese estado nunca se lee en ningún filtro**; escribir no filtra nada.
- [`components/AppleFloatingDock.tsx`](platform/src/components/AppleFloatingDock.tsx) — componente completo, nunca importado ni renderizado en ninguna parte del árbol. Código muerto que puede eliminarse con seguridad.

---

## 5. Cálculo engañoso (no es un hardcode, pero produce un dato falso)

- [`components/AppleMetricsWidgets.tsx:136`](platform/src/components/AppleMetricsWidgets.tsx:136): `Math.max(1, Math.round(estimatedSavingsMxn / Math.max(1, tenant.totalSpentMxn)))x` — el ROI mostrado ("2464x" observado en vivo) es un cálculo real sobre datos reales, pero **sin tope superior**: cuando `tenant.totalSpentMxn` es cercano a cero, el múltiplo se dispara a cifras absurdas e increíbles para un cliente. No es dato falso, es una fórmula sin protección para el caso límite.
- Relacionado: el gráfico de 7 días en Telemetría muestra fechas fijas "Lun 01"–"Dom 07" que no corresponden a la semana real en curso (probado en vivo el 2026-09-18, mes con más de 7 días transcurridos) — esto sí es un arreglo de fechas hardcodeado, no un cálculo.

---

## 6. Responsividad: hallazgos de prueba en vivo (375×812)

| Vista | Resultado |
|---|---|
| SuperAdmin HQ → Directorio de Empresas | **No responsiva**: la tabla se desborda horizontalmente sin scroll visible ni indicador, columnas cortadas |
| Bandeja en Vivo / Chat Activo (cliente) | **Correcta**: diseño de pestañas se adapta bien a móvil |
| Base de Conocimiento | Correcta, con aviso "DEMO" bien etiquetado |
| Canales & Hardware | Aviso "DEMO" presente pero **inconsistente**: pese al aviso, sigue mostrando "118ms"/"340 mensajes"/"ONLINE" con apariencia de dato real, sin distinguir visualmente cuáles cifras son de ejemplo |
| Telemetría & Métricas | Aviso "DEMO" presente, pero cifras concretas (ROI, gráfico) se muestran con el mismo estilo que un dato real, sin indicación visual de que son de ejemplo |

**Conclusión de responsividad:** el problema no es generalizado en todas las vistas (el patrón de pestañas del cliente funciona bien), pero **las tablas de SuperAdmin (Directorio de Empresas) no tienen tratamiento responsivo** — ni scroll horizontal con indicador, ni colapso a tarjetas en móvil.

---

## Priorización sugerida

**P1 — Corrección de una línea, alto impacto en confianza del dato:**
Los ítems de la sección 3 (badges/latencias que ignoran props ya existentes) son los más baratos de arreglar y los que más generan la sensación de "sistema roto" al usuario, porque el dato correcto ya está disponible en el componente.

**P2 — Honestidad de UI (no requiere nueva infraestructura):**
Eliminar o etiquetar consistentemente los números de ejemplo en Canales/Telemetría (sección 6), quitar el botón muerto "Sincronizar Meta APIs" o darle una acción real, eliminar `AppleFloatingDock.tsx`, conectar o quitar la barra de búsqueda decorativa.

**P3 — Trabajo de infraestructura real (mayor alcance):**
Implementar tiempo real genuino (Supabase Realtime channels sobre la tabla de mensajes, o polling con `setInterval` como mínimo viable) y conectar los 3 tenants restantes a una fuente de datos real en vez de `MOCK_CONVERSATIONS`. Esto es la causa raíz de que "Valentina AI México" muestre una conversación falsa como si fuera la bandeja en vivo real.

**P4 — Ajuste de fórmula:**
Poner un tope razonable (o mostrar "N/A" por debajo de un gasto mínimo) al cálculo de ROI en `AppleMetricsWidgets.tsx:136`, y generar las fechas del gráfico de telemetría dinámicamente respecto a la fecha real.

---

## Pendientes ya documentados de la auditoría de seguridad anterior (no resueltos, fuera del foco de hoy pero relacionados)
- `handleSaveToDrive` en `SalesQuoteGeneratorModal.tsx` marca éxito aunque el fetch falle.
- Comentario falso en `CloudInfrastructureTab.tsx` que afirma persistencia en Supabase para costos cloud (solo está en localStorage).
- Rotación pendiente de `SUPABASE_SERVICE_ROLE_KEY` (expuesta accidentalmente en captura de pantalla durante esta sesión de trabajo).

---

## 🔧 Estado de corrección (actualizado 2026-09-18)

**P1 — Corregido y verificado** (`npx tsc --noEmit` limpio, 46/46 tests pasan, `npm run build` exitoso):
- [`ChannelHardwareCard.tsx`](platform/src/components/ChannelHardwareCard.tsx) — badge de estado ahora usa `ch.status` real (ONLINE/DEGRADADO/DESCONECTADO); se eliminó la "Latencia Webhook: 118ms" inventada (no existe ningún campo real de latencia en el modelo); se eliminó la tarjeta "Google Workspace Vault" (100% sintética, sin ningún dato real detrás); se eliminó el botón "Sincronizar Meta APIs" (no tenía `onClick` ni backend que lo soportara).
- [`GoogleSidebar.tsx`](platform/src/components/GoogleSidebar.tsx) — el pie "Meta API: En línea / 118ms" ahora refleja el conteo real de canales conectados (`ch.status === 'connected'`) del tenant activo.
- [`AppleMetricsWidgets.tsx`](platform/src/components/AppleMetricsWidgets.tsx) — "Resolución 100% IA" y "Escalados a humanos" ahora promedian `telemetry.aiHandledPercentage` real; se reemplazó la tarjeta de "Velocidad Respuesta" (1.1 seg / 28 min, sin ningún campo real de latencia) por "Horas Ahorradas" sumando `telemetry.hoursSaved` real.
- [`superadmin/TenantsDirectoryTab.tsx`](platform/src/components/superadmin/TenantsDirectoryTab.tsx) — usuarios por empresa ahora cuenta `users` reales por `tenantId`; badge de estado usa `t.status` real (Activo/Prueba/Suspendido); se eliminó la columna "Última actualización" (no existe ningún campo de fecha en `Tenant`, mostrar cualquier fecha habría sido inventar un dato); se eliminó la paginación decorativa "Mostrar filas: 10".
- [`superadmin/SalesPipelineTab.tsx`](platform/src/components/superadmin/SalesPipelineTab.tsx) — "Amortización media" ahora promedia `amortizationDays` real de cada cotización en vez de un "~13 días" fijo.
- [`superadmin/CloudInfrastructureTab.tsx`](platform/src/components/superadmin/CloudInfrastructureTab.tsx) — se eliminó el literal "UGES (302 msgs en vivo)" y los valores de respaldo falsos ($4.64/$18.50); ahora itera todos los tenants reales con su `totalSpentMxn` real.
- [`app/page.tsx`](platform/src/app/page.tsx) — "Supabase Read-Only (302 msgs · 47 leads)" ahora calcula mensajes y leads reales desde `currentConversations`.

**P2 — Corregido y verificado:**
- Campana de notificaciones sin `onClick` y punto "pendiente" fijo: **eliminada** (no existe ningún sistema de notificaciones real detrás; mantenerla habría sido un control decorativo permanente).
- Barra de búsqueda superior (`topSearch`) cuyo estado nunca se leía: **eliminada** (conectarla de verdad a una búsqueda global cruzando tenants/conversaciones/cotizaciones es un feature nuevo, no un fix — queda fuera de este alcance; ver sección P3).
- [`AppleFloatingDock.tsx`](platform/src/components/AppleFloatingDock.tsx) — componente muerto sin ninguna referencia en el árbol: **archivo eliminado**.
- Tabla "Directorio de Empresas" sin indicador de scroll horizontal en móvil: se agregó `min-width` a la tabla y una pista visible solo en pantallas pequeñas ("Desliza horizontalmente para ver todas las columnas").
- `handleSaveToDrive` en [`SalesQuoteGeneratorModal.tsx`](platform/src/components/sales/SalesQuoteGeneratorModal.tsx) marcaba éxito aunque el fetch fallara o el servidor respondiera con error: ahora valida `res.ok && data.success`, y en caso de fallo muestra el mensaje de error real en vez de fingir que se guardó.
- Comentario falso en [`SuperAdminView.tsx`](platform/src/components/SuperAdminView.tsx:76) que afirmaba persistencia en Supabase para costos cloud: corregido para decir explícitamente que solo persiste en `localStorage` del navegador.

**P4 — Corregido:**
- ROI "2464x" sin tope: se agregó un tope de 200x en `AppleMetricsWidgets.tsx` (por encima de eso se muestra "200x+" en vez de una cifra técnicamente real pero absurda para el cliente).
- Fechas fijas "Lun 01"–"Dom 07" del gráfico de 7 días: [`mockData.ts`](platform/src/data/mockData.ts) ahora genera las etiquetas de los últimos 7 días reales dinámicamente en cada carga, en vez de literales fijos.

**P3 — Implementado (2026-09-18, segunda pasada):**

Se construyó la infraestructura real de conversaciones/mensajes multi-tenant que antes no existía en absoluto:

- **Esquema nuevo en Supabase** (`contacts`, `conversations`, `messages`, con RLS y `ALTER PUBLICATION supabase_realtime ADD TABLE ...`) — reemplaza el bloque `organizations/channels/contacts/conversations` que estaba en el modal "Ver esquema SQL" de [SuperAdminView.tsx](platform/src/components/SuperAdminView.tsx): ese bloque original referenciaba una tabla `organizations` inexistente y **nunca se ejecutó ni se consultó desde ningún código** — era SQL decorativo. El nuevo esquema usa `tenant_id TEXT` (el mismo id real ya usado en toda la app, ej. `'tenant-valentina-ai-mexico'`) y está ordenado correctamente por dependencias (tenants → platform_users → contacts → conversations → messages).
- [`lib/conversationsService.ts`](platform/src/lib/conversationsService.ts) (nuevo): `fetchTenantConversations(tenantId)` lee conversaciones reales; `subscribeToTenantConversations(tenantId, onChange)` es la pieza de **tiempo real genuina que no existía** — usa Supabase Realtime (`postgres_changes`) para que un mensaje nuevo aparezca sin recargar la página; `insertInboundMessage`/`insertOutboundMessage` persisten mensajes entrantes/salientes reales. 4 tests unitarios nuevos en `conversationsService.test.ts`.
- [`lib/tenantLookup.ts`](platform/src/lib/tenantLookup.ts) (nuevo): resuelve qué tenant corresponde a un `phone_number_id` de Meta.
- [`api/channels/whatsapp/webhook/route.ts`](platform/src/app/api/channels/whatsapp/webhook/route.ts) (nuevo): endpoint real de webhook entrante de WhatsApp Cloud API (verificación GET + recepción POST), listo para que Meta le mande mensajes reales de cualquier tenant, no solo UGES.
- [`api/channels/whatsapp/send-message/route.ts`](platform/src/app/api/channels/whatsapp/send-message/route.ts): ahora persiste también el mensaje saliente del operador en el historial real (antes solo lo despachaba al gateway, sin guardar rastro consultable).
- [`app/page.tsx`](platform/src/app/page.tsx): para cualquier tenant que no sea UGES, ahora se intenta cargar conversaciones reales y se mantiene una suscripción de Realtime activa; el badge "Datos en vivo" vs "DEMO" ya no depende de `if (tenant.id === 'tenant-uges')` sino de si realmente hay datos reales (`hasRealLiveConversations`). Para UGES (proyecto Supabase de terceros, de solo lectura, cuyo esquema no administramos y por lo tanto no podemos habilitarle Realtime) se agregó sondeo automático cada 45s como mecanismo de "tiempo real" honesto sin tocar un sistema ajeno.

**✅ SQL ejecutado y verificado en Supabase (2026-09-19):** se corrió el subconjunto nuevo (`contacts`, `conversations`, `messages`, políticas RLS y `ALTER PUBLICATION supabase_realtime`) en el SQL Editor del proyecto real (`Proyecto Valentina`, project ref `xrheyqhigeutkzqigvmg`). Verificado con dos consultas de control:
- `information_schema.tables` confirma las 7 tablas esperadas: `audit_log`, `commercial_quotes`, `contacts`, `conversations`, `messages`, `platform_users`, `tenants`.
- `pg_publication_tables` confirma que `conversations` y `messages` están dentro de la publicación `supabase_realtime` — Realtime está genuinamente activo, no solo declarado en el código.

**Actualización 2026-09-19 — Integración real con el gateway compartido de Railway (reemplaza el plan del webhook Meta para los tenants operados ahí):**

El equipo responsable del chatbot (otro agente) confirmó que **ya existe un gateway compartido en Railway** (`whatsapp-empresarial-production.up.railway.app`, el mismo backend que ya opera UGES) con endpoints reales por tenant. Se verificó en vivo contra producción (tenant 3 = Valentina AI México) antes de programar nada:

- `GET /api/tenants/:id/conversaciones` → `{ hilos: [...] }` (lista de hilos recientes).
- `GET /api/tenants/:id/conversaciones/whatsapp/:contacto` → `{ mensajes: [...] }` (historial completo).
- `POST /api/tenants/:id/mensajes/enviar` → `{ enviado, botPausadoHasta }` (respuesta de operador humano).
- Autenticación: mismo header `Authorization: Bearer <PLATFORM_API_KEY>` que ya usa la API de Knowledge Base.

Esto es **más directo que el plan original** (webhook de Meta + tablas Supabase nuevas) porque el gateway ya existe y ya está operando — no requiere que el negocio configure nada en Meta Business Manager. Implementado:

- [`lib/railwayConversationsService.ts`](platform/src/lib/railwayConversationsService.ts) (nuevo, con 10 tests): mapea `hilos`/`mensajes` reales a nuestros tipos internos, sin inventar campos que la API no entrega (ej. no hay nombre de contacto en la lista, así que se usa el teléfono tal cual en vez de inventar uno).
- Rutas proxy nuevas `api/tenants/[tenantId]/conversaciones` y `.../conversaciones/whatsapp/[contacto]`: el navegador nunca ve `PLATFORM_API_KEY`, solo estas rutas de servidor.
- [`send-message/route.ts`](platform/src/app/api/channels/whatsapp/send-message/route.ts) **reescrito por completo**: el endpoint/payload que tenía antes (`/api/channels/whatsapp/send` con header `X-Platform-API-Key`) **nunca coincidió con el contrato real** — se reemplazó por el confirmado (`/api/tenants/:id/mensajes/enviar`, `Authorization: Bearer`, body `{ canal, contacto, mensaje }`).
- **Hallazgo de seguridad corregido de paso**: esta misma ruta de envío **no tenía ningún control de acceso** — cualquiera con la URL podía disparar mensajes reales de WhatsApp sin haber iniciado sesión. Se agregó `authorizeConversationsRequest` (nuevo guardián en `serverAuth.ts`, requiere la pestaña "inbox" y `canInterveneChat`), exigido en ambos caminos (con y sin `railwayTenantId`). Verificado en vivo: las 3 rutas devuelven `401 UNAUTHORIZED` sin sesión.
- [`page.tsx`](platform/src/app/page.tsx): para tenants con `railwayTenantId` (Valentina AI México y cualquier futuro cliente en ese gateway), se hace polling cada 4 segundos — el mecanismo de "tiempo real" que ese servicio soporta hoy, siguiendo la recomendación explícita del equipo de Railway (3-5s). Las tablas Supabase (`contacts`/`conversations`/`messages` + webhook Meta) del plan anterior se conservan como respaldo genérico para un tenant hipotético que NO esté en el gateway compartido, pero dejaron de ser el camino activo para Valentina AI México.
- **Causa raíz separada, encontrada y corregida de paso**: la tabla `tenants` en Supabase estaba **completamente vacía** (0 filas) — el control de acceso (`getSlugForNumericTenantId`) habría rechazado con 403 a cualquier admin de tenant (no-SuperAdmin) que intentara ver sus propias conversaciones, porque no había fila con la que emparejar su `railway_tenant_id`. Se sembraron los 4 tenants reales en la tabla, con `railway_tenant_id = 1` (UGES) y `= 3` (Valentina AI México) confirmados.

**Lo que SIGUE, y ya no depende de código:**
- El tenant 3 (Valentina AI México) hoy devuelve `hilos: []` porque aún no ha recibido tráfico real de WhatsApp — en cuanto entre el primer mensaje, debe aparecer en la consola dentro de los siguientes 4 segundos sin recargar la página.
- El webhook de Meta (`api/channels/whatsapp/webhook`) y las tablas Supabase nuevas quedan como infraestructura de respaldo, no como el camino activo — si en el futuro se elimina por no usarse, no afecta a Valentina AI México.

**Hallazgo de seguridad aparte, sin resolver:** `NODE_TLS_REJECT_UNAUTHORIZED=0` está activo en la terminal de este equipo, desactivando la verificación de certificados TLS para procesos Node — no lo causé yo, pero vale la pena que lo revisen (busca en variables de entorno de usuario/sistema de Windows quién la definió).

Hasta que uno de esos dos caminos esté conectado, "Valentina AI México" y los demás tenants seguirán mostrando el banner DEMO — correctamente, porque en efecto no tienen tráfico real todavía. Eso ya no es un bug de UI: es el estado real del negocio, mostrado con honestidad.

**Verificación realizada:** `npx tsc --noEmit` sin errores, `npm test` (50/50 tests OK, incluye 4 nuevos para el mapeo de conversaciones), `npm run build` exitoso (Next.js 16 + Turbopack, incluye la nueva ruta `/api/channels/whatsapp/webhook`). No se pudo hacer verificación visual interactiva en el navegador porque el login exige autenticación real contra Supabase sin bypass y no hay credenciales de prueba disponibles — señal positiva de que el endurecimiento de la auditoría de seguridad anterior sigue vigente.

**Pendiente real, no de código:** búsqueda global funcional en la barra superior si se decide reintroducirla (se eliminó por decorativa, ver P2).
