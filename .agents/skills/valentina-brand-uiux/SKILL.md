---
name: valentina-brand-uiux
description: Directrices maestras de diseño UI/UX para la marca Valentina. Define la identidad visual de alta gama, paleta cromática, tipografía moderna, estética dark-glassmorphism, animaciones fluidas y patrones de conversión B2B.
---

# Valentina Brand & UI/UX Design System

Este skill contiene las directrices obligatorias de diseño, experiencia de usuario y presentación visual para todos los productos digitales de **Valentina**.

## 1. Identidad de Marca y Tono
- **Posicionamiento:** Estudio y plataforma boutique de Inteligencia Artificial Empresarial y Automatización de Procesos Críticos.
- **Tono:** Ejecutivo, innovador, certero, seguro y de alto impacto tecnológico.
- **Objetivo visual:** WOW factor inmediato. Debe sentirse al nivel de marcas de software como Vercel, Linear, Stripe o Raycast. Cero estética de plantilla genérica o estilos infantiles.

## 2. Paleta Cromática (Modern Dark & Cyber Obsidian)
- **Fondo Base Primario:** `#090A0F` (Obsidiana profundo con un matiz frío).
- **Fondo Secundario / Superficies:** `#111420` (Gris azulado muy oscuro).
- **Bordes & Separadores:** `rgba(255, 255, 255, 0.08)` a `rgba(255, 255, 255, 0.15)`.
- **Acentos Primarios (Glow / Gradients):**
  - **Valentina Violet:** `#8B5CF6` / `#A855F7` (Innovación, inteligencia).
  - **Cyan Tech:** `#06B6D4` / `#38BDF8` (Agilidad, datos, conectividad).
  - **Emerald Accent (Métricas/Éxito):** `#10B981` (ROI, confirmaciones, estado activo).
- **Tipografía:**
  - Texto principal: `#F3F4F6` (Gris ultra claro / blanco suavizado, evita fatiga visual).
  - Texto secundario / muted: `#9CA3AF` o `#6B7280`.

## 3. Tipografía
- **Titulares:** `Outfit`, `Plus Jakarta Sans` o `Cabinet Grotesk` (Pesos: 600, 700, 800) con tracking ajustado (`letter-spacing: -0.02em`).
- **Cuerpo y lectura técnica:** `Inter` o `Geist Sans` (Pesos: 400, 500) con altura de línea relajada (`line-height: 1.6`).
- **Código y Métricas:** `JetBrains Mono` o `Fira Code` para KPIs numéricos y logs interactivos.

## 4. Estilo Glassmorphism & Efectos
- **Tarjetas y Contenedores:**
  ```css
  background: rgba(17, 20, 32, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
  ```
- **Hover Dinámico:** Los elementos interactivos deben responder suavemente (`transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`), con un ligero resplandor de borde (`border-color: rgba(139, 92, 246, 0.4)` y elevación en Y de `-2px` a `-4px`).
- **Gradients de Acento:** Usar gradientes lineales sutiles con máscara de texto (`background-clip: text`) para palabras clave en titulares hero.

## 5. Principios de UX y Conversión B2B
- **Metrics-First:** Cada servicio o caso de éxito debe comenzar por el resultado cuantificable (ej. "Tiempo de ciclo reducido en 80%", "0% errores de captura").
- **Flujo de Acción Directo:** Los llamados a la acción (CTAs) deben ser específicos: "Agendar Demo Técnica", "Ver Arquitectura en Vivo", "Explorar Caso de Estudio".
- **Sin placeholders:** En lugar de imágenes falsas o 'lorem ipsum', usar maquetas con datos realistas de los proyectos de Valentina (certificaciones, integraciones universitarias, bots conversacionales).
