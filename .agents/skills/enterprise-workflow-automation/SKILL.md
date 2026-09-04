---
name: enterprise-workflow-automation
description: Directrices para el diseño e implementación de flujos de automatización empresarial mediante APIs de primer nivel (Google Workspace, CRMs, Webhooks, Bases de Datos SQL/NoSQL), manejo de errores robusto, idempotencia y auditoría de eventos.
---

# Enterprise Workflow Automation

Este skill establece las reglas de ingeniería para construir automatizaciones confiables que conecten el ecosistema de **Valentina** con herramientas empresariales (Google Workspace, WhatsApp, bases de datos y sistemas de terceros).

## 1. Principios de Automatización Confiable
- **Idempotencia Obligatoria:** Cada solicitud o evento entrante debe procesarse con identificadores únicos (`event_id` o `message_id`) para evitar duplicaciones si un webhook reintenta el envío.
- **Tolerancia a Fallos y Reintentos:**
  - Emplear retroceso exponencial (exponential backoff) con jitter para llamadas a APIs externas.
  - Almacenar en una cola de mensajes no procesados (dead-letter queue) los eventos fallidos para análisis sin pérdida de información.
- **Trazabilidad y Auditoría:**
  - Registro estructurado (JSON logs) con marcas de tiempo, origen, acción ejecutada, payload resumido y estado resultante.

## 2. Integración con Google Workspace
- **Google Calendar:**
  - Agendamiento automatizado de reuniones a través de la API oficial con Service Account o OAuth2.
  - Verificación previa de disponibilidad horaria (FreeBusy query) para evitar traslapes.
  - Creación automática de enlaces de Google Meet y envío de invitaciones al cliente.
- **Google Sheets / Drive:**
  - Inserción y actualización de registros de leads en tiempo real con bloqueo concurrente seguro.
  - Generación y almacenamiento de carpetas seguras para cada cliente con permisos de lectura limitados.
- **Gmail / Notificaciones:**
  - Plantillas de correo transaccional en HTML con estética de la marca para confirmación de citas y envío de propuestas.

## 3. Arquitectura de Webhooks & Conectores
- **Validación de Seguridad:**
  - Verificación de encabezados de firma HMAC (secret token) en cada endpoint público.
  - Limitación de tasa de solicitudes (Rate Limiting) para mitigar abusos o ataques de denegación de servicio.
- **Estructura Modular de Handlers:**
  - Desacoplar la recepción del evento del procesamiento pesado para responder inmediatamente con código HTTP 200/202 al emisor del webhook.
