---
name: custom-ai-agents-runtime
description: Patrones de arquitectura para agentes y chatbots de producción construidos con código limpio (Node.js/TypeScript/Python), sin depender de plataformas no-code pesadas. Abarca memoria semántica, RAG vectorial, llamadas a herramientas (function calling) y conexión multicanal directa (WhatsApp Cloud API y Web).
---

# Custom AI Agents & Conversational Runtime

Este skill define las pautas de ingeniería para la construcción de agentes conversacionales y asistentes inteligentes de alto rendimiento bajo código nativo.

## 1. Filosofía de Arquitectura
- **Código Nativo > Plataformas No-Code:** Los flujos conversacionales y orquestaciones críticas se construyen con código modular y ligero (Node.js/Express/FastAPI/TypeScript), lo que garantiza:
  - Cero costos ocultos por ejecución de nodos.
  - Latencia mínima (respuestas en < 1.5 segundos).
  - Control granular sobre el estado de la conversación, logs y auditoría.
- **Modelo de Lenguaje Agnóstico:** Adaptadores limpios para alternar o combinar modelos (Gemini 2.0/Flash para velocidad y bajo costo, Claude 3.5 Sonnet para razonamiento complejo o código, OpenAI para compatibilidad).

## 2. Memoria Semántica y Manejo de Contexto (RAG)
- **Almacenamiento Vectorial:** SQLite con extensión `sqlite-vec` o PostgreSQL con `pgvector` para entornos locales/ligeros o base de datos serverless (Supabase).
- **Estrategia RAG Híbrida:**
  - Búsqueda léxica (palabras clave / FTS) + Búsqueda vectorial (embeddings).
  - Reranking ligero para inyectar únicamente los 3 a 5 fragmentos más pertinentes en la ventana de contexto.
  - Reducción estricta de tokens para mantener latencia ultra baja.
- **Memoria de Sesión:**
  - Historial de conversación con ventana deslizante (últimos $N$ turnos) y resumen condensado para conversaciones extensas.

## 3. Tool Calling y Agentes Autónomos
- **Esquema Declarativo de Herramientas:**
  - Cada función externa (agendar cita, consultar base de datos, validar estatus de certificación, generar cotización) debe definirse con un JSON Schema estricto.
  - Validación de argumentos antes de la ejecución.
- **Human-in-the-Loop & Escalación:**
  - Cuando la confianza del agente sea menor a un umbral o el usuario solicite explícitamente asistencia humana, el sistema debe registrar el evento y notificar al operador por webhook/WhatsApp.

## 4. Integración Directa con Canales
- **WhatsApp Cloud API Nativa:**
  - Manejo de webhooks con verificación de token y validación criptográfica de firma SHA256.
  - Procesamiento asíncrono de mensajes entrantes (evitar bloqueos en el webhook de Meta mediante colas o ejecución en segundo plano).
  - Respuestas formateadas: listas interactivas, botones de acción rápida y soporte de archivos multimedia (PDFs, audios, imágenes).
- **Web Widget:**
  - Componente ligero sin frameworks pesados, con soporte para streaming (Server-Sent Events o WebSockets), Markdown rendering e indicadores de actividad en tiempo real.
