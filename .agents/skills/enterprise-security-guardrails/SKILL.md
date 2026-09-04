---
name: enterprise-security-guardrails
description: Estándares estrictos de ciberseguridad, protección de credenciales, seguridad de APIs, endpoints y protección de datos para Valentina. Prohíbe exposición de llaves de API, asegura autenticación robusta, validación criptográfica de webhooks, sanitización de entradas contra inyecciones de prompts y mitigación de fugas de datos sensibles.
---

# Enterprise Security & Guardrails

Este skill establece los estándares inviolables de ciberseguridad, protección de infraestructura y blindaje de endpoints para todos los servicios, integraciones y aplicaciones bajo la marca **Valentina**.

## 1. Gestión Cero Fugas de Secretos y Credenciales
- **Nunca Credenciales en Código:** Prohibido escribir cadenas de conexión, tokens (WhatsApp, Gemini, OpenAI, Claude, JWT) o llaves de API en archivos de código fuente, HTML o frontend.
- **Variables de Entorno y `.gitignore`:**
  - Todo secreto reside exclusivamente en variables de entorno (`.env` local o gestor de secretos en la nube).
  - El archivo `.gitignore` debe blindar desde el inicio:
    ```gitignore
    .env
    .env.*
    *.pem
    *.key
    credentials.json
    service-account*.json
    ```
  - Proveer siempre un `.env.example` con claves vacías y comentarios explicativos como plantilla de configuración.
- **Exposición en Cliente:** Ninguna clave privada o de servicio de backend puede llegar al bundle web o al navegador del cliente. Las interacciones con LLMs o APIs externas deben pasar siempre a través de un backend/proxy seguro.

## 2. Blindaje de Endpoints y APIs Públicas
- **Validación de Firma Criptográfica en Webhooks:**
  - En webhooks entrantes (Meta/WhatsApp, pasarelas de pago, CRMs), verificar rigurosamente la firma criptográfica (ej. `X-Hub-Signature-256` mediante HMAC-SHA256 con el `APP_SECRET`). Si la firma no coincide, rechazar de inmediato con HTTP 401/403.
- **Rate Limiting y Mitigación de Abusos:**
  - Implementar limitadores de tasa por IP y por token de sesión (ej. `express-rate-limit` o token bucket) en endpoints de chat público y formularios para prevenir ataques de denegación de servicio (DDoS) o consumo no autorizado de cuotas de LLM.
- **CORS Estricto:**
  - Configurar políticas de Cross-Origin Resource Sharing restringidas únicamente a los dominios oficiales de Valentina, rechazando comodines (`*`) en endpoints con autenticación o intercambio de datos privados.
- **Validación y Sanitización de Esquemas:**
  - Todo payload JSON entrante debe validarse contra esquemas estrictos (Zod, Joi o Pydantic), descartando propiedades no reconocidas.

## 3. Seguridad de Agentes IA y LLM Guardrails
- **Mitigación de Prompt Injection:**
  - Separar explícitamente las instrucciones del sistema (*System Prompt*) del texto ingresado por usuarios externos.
  - Inclusión de guardrails para prevenir que el bot revele su prompt base, archivos internos del servidor o credenciales ante ingeniería inversa.
- **Filtrado de Salidas y DLP (Data Loss Prevention):**
  - Sanitizar respuestas antes de enviarlas al usuario para asegurar que no se filtren datos personales confidenciales (PII), números de cuenta, tokens o trazas internas de error.
- **Sandboxing de Herramientas (Tool Calling):**
  - Cualquier herramienta que ejecute consultas de base de datos o llamadas a APIs debe operar con permisos mínimos necesarios (Principle of Least Privilege). Consultas a bases de datos siempre parametrizadas contra SQL Injection.

## 4. Auditoría y Logs Seguros
- **Mascarado en Logs:**
  - Antes de registrar cualquier evento en logs del servidor, enmascarar números de teléfono, correos electrónicos, tokens de sesión y contraseñas.
- **Cabeceras de Seguridad HTTP:**
  - Implementar cabeceras de seguridad (`Helmet`, `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`).
