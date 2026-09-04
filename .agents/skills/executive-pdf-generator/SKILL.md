---
name: executive-pdf-generator
description: Pautas para la generación programática de documentos comerciales, dossiers de proyectos, infografías ejecutivas y propuestas técnicas en formato PDF con diseño visual de alta calidad, maquetación tipográfica precisa y estilo editorial corporativo.
---

# Executive PDF & Document Engine

Este skill define los estándares de diseño y desarrollo para producir documentos PDF comerciales y técnicos para **Valentina**, asegurando que cualquier archivo descargable o enviado a prospectos transmita el máximo nivel de profesionalismo.

## 1. Estética Editorial & Layout
- **Dimensiones:** Formato estándar A4 o Letter con márgenes simétricos de 24mm.
- **Jerarquía Visual:**
  - Portada impactante con fondo oscuro de marca, isotipo de Valentina, título de la propuesta, destinatario, fecha y versión.
  - Encabezados y pies de página discretos con numeración de página dinámica ("Página X de Y") y marcas de confidencialidad.
  - Cuadrícula de contenido estructurada a 2 o 3 columnas para casos de estudio y comparativas técnicas.

## 2. Componentes Clave en Dossiers Comerciales
- **Fichas de Caso de Éxito (1-Pager per Project):**
  - **Cliente / Sector:** (ej. Sector Educativo, Certificación Laboral en México).
  - **El Desafío:** Contexto operativo antes de la intervención.
  - **La Solución Valentina:** Arquitectura implementada (RAG, agentes, integraciones).
  - **Impacto & Métricas Clave:** Cuadros destacados con cifras contundentes (ej. "98.4% precisión", "-60% tiempo de trámite").
  - **Diagrama de Arquitectura Simplificado:** Flujo de datos limpio y legible.
- **Cotizaciones y Propuestas Técnicas:**
  - Tablas de alcances con desglose de entregables, hitos temporales y SLA de soporte.
  - Sección de garantías de seguridad, confidencialidad (NDA) y soberanía de datos.

## 3. Implementación Técnica Recomendada
- **HTML/CSS to PDF:**
  - Maquetación mediante plantillas HTML/CSS puras con `@media print`, lo que permite un control tipográfico absoluto y uso de fuentes web vectoriales.
  - Motores de renderizado headless (Puppeteer / Playwright) para generar PDFs vectoriales con soporte completo de SVG, gráficos CSS y enlaces clicables.
  - Inyección de datos dinámicos mediante plantillas ligeras para personalizar nombres de empresas y logotipos en segundos.
