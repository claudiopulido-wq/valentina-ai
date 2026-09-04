/**
 * VALENTINA IA - Lógica Interactiva
 * - Control del Hero Video Canvas (Alternar tomas, mute/unmute, telemetría)
 * - Calculadora de ROI en Tiempo Real (Horas hombre y ahorro financiero)
 * - Agente Valentina Copilot (Chat simulado con RAG de tus casos reales)
 * - Contadores de Impacto Animados (136,980 hojas, +3,000 graduados)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // ==================== 1. HERO AMBIENT VIDEO STAGE ====================
  const heroVideo = document.getElementById('hero-video-player');
  const feedTitle = document.getElementById('hero-feed-title');
  const feedButtons = document.querySelectorAll('.hero-feed-btn');
  const btnToggleSound = document.getElementById('btn-toggle-sound');
  const soundIcon = document.getElementById('sound-icon');
  const soundLabel = document.getElementById('sound-label');

  // Alternar entre los feeds de video
  feedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      feedButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const videoSrc = btn.getAttribute('data-video');
      const title = btn.getAttribute('data-title');

      if (feedTitle) feedTitle.textContent = title;

      if (heroVideo) {
        heroVideo.style.opacity = '0.3';
        setTimeout(() => {
          heroVideo.src = videoSrc;
          heroVideo.play().catch(() => {});
          heroVideo.style.opacity = '0.9';
        }, 300);
      }
    });
  });

  // Control de Sonido del Video
  if (btnToggleSound && heroVideo) {
    btnToggleSound.addEventListener('click', () => {
      heroVideo.muted = !heroVideo.muted;
      if (heroVideo.muted) {
        soundLabel.textContent = 'Silenciado';
        soundIcon.setAttribute('data-lucide', 'volume-x');
      } else {
        soundLabel.textContent = 'Audio Activo';
        soundIcon.setAttribute('data-lucide', 'volume-2');
      }
      if (window.lucide) window.lucide.createIcons();
    });
  }

  // ==================== 2. CALCULADORA INTERACTIVA DE ROI ====================
  const rangeTeam = document.getElementById('range-team');
  const rangeHours = document.getElementById('range-hours');
  const rangeCost = document.getElementById('range-cost');

  const labelTeam = document.getElementById('label-team');
  const labelHours = document.getElementById('label-hours');
  const labelCost = document.getElementById('label-cost');

  const resultHours = document.getElementById('result-hours');
  const resultSavings = document.getElementById('result-savings');
  const resultAnnual = document.getElementById('result-annual');

  function calculateROI() {
    if (!rangeTeam || !rangeHours || !rangeCost) return;

    const team = parseInt(rangeTeam.value);
    const hoursPerDay = parseInt(rangeHours.value);
    const hourlyCost = parseInt(rangeCost.value);

    // Actualizar etiquetas de los sliders
    labelTeam.textContent = `${team} ${team === 1 ? 'persona' : 'personas'}`;
    labelHours.textContent = `${hoursPerDay} hrs / día`;
    labelCost.textContent = `$${hourlyCost} MXN / hr`;

    // 22 días laborables al mes
    // Suponemos que Valentina automatiza y recupera el 75% del tiempo repetitivo
    const totalHoursPerMonth = team * hoursPerDay * 22;
    const hoursSavedPerMonth = Math.round(totalHoursPerMonth * 0.75);
    const monthlySavings = Math.round(hoursSavedPerMonth * hourlyCost);
    const annualSavings = monthlySavings * 12;

    // Formatear con separadores de miles
    resultHours.textContent = `${hoursSavedPerMonth.toLocaleString('es-MX')} hrs / mes`;
    resultSavings.textContent = `$${monthlySavings.toLocaleString('es-MX')} MXN`;
    resultAnnual.textContent = `$${annualSavings.toLocaleString('es-MX')} MXN al año`;
  }

  if (rangeTeam && rangeHours && rangeCost) {
    rangeTeam.addEventListener('input', calculateROI);
    rangeHours.addEventListener('input', calculateROI);
    rangeCost.addEventListener('input', calculateROI);
    calculateROI(); // Calcular valor inicial
  }

  // ==================== 3. AGENTE VALENTINA CHAT WIDGET ====================
  const chatWidget = document.getElementById('valentina-chat-widget');
  const chatWindow = document.getElementById('chat-window');
  const chatToggleBtn = document.getElementById('chat-toggle-btn');
  const btnCloseChat = document.getElementById('btn-close-chat');
  const btnOpenChatNav = document.getElementById('btn-open-chat-nav');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');

  function toggleChat(forceOpen = null) {
    const isHidden = chatWindow.classList.contains('hidden');
    const shouldOpen = forceOpen !== null ? forceOpen : isHidden;

    if (shouldOpen) {
      chatWindow.classList.remove('hidden');
      chatWindow.classList.add('flex');
      if (chatInput) chatInput.focus();
    } else {
      chatWindow.classList.add('hidden');
      chatWindow.classList.remove('flex');
    }
  }

  if (chatToggleBtn) chatToggleBtn.addEventListener('click', () => toggleChat());
  if (btnCloseChat) btnCloseChat.addEventListener('click', () => toggleChat(false));
  if (btnOpenChatNav) btnOpenChatNav.addEventListener('click', () => toggleChat(true));

  // Respuestas del Agente con Conocimiento de tus Casos Reales
  const knowledgeBase = [
    {
      keywords: ['conocer', 'certificacion', 'expediente', 'documento', 'hoja', 'sep', 'firma'],
      response: "En el sistema de certificación CONOCER SEP eliminamos 90 hojas físicas por expediente para más de 1,522 candidatos activos, sumando 136,980 documentos digitalizados con firma biométrica móvil. ¿Tu empresa también gestiona trámites o expedientes en papel?"
    },
    {
      keywords: ['botox', 'clinica', 'medico', 'estetica', 'salud', 'cita', 'agenda'],
      response: "Para Doctor Botox desarrollamos un agente conversacional omnicanal que califica pacientes, responde dudas médicas frecuentes, cotiza procedimientos y agenda directamente en calendario sin intervención manual 24/7."
    },
    {
      keywords: ['abogado', 'legal', 'juridico', 'demanda', 'juzgado', 'confidencial'],
      response: "Para Vanguardia Jurídica implementamos un asistente con guardrails de seguridad que clasifica casos, realiza un triage confidencial y redacta un briefing ordenado para el abogado antes de la primera consulta."
    },
    {
      keywords: ['uges', 'universidad', 'escuela', 'alumnos', 'educacion'],
      response: "Valentina está respaldada por la infraestructura técnica de la Universidad UGES y GES Académico, con más de 3,000 egresados titulados y plataformas de validación oficial de certificados."
    },
    {
      keywords: ['precio', 'costo', 'cotizar', 'cuanto', 'tarifa'],
      response: "Diseñamos soluciones a medida según el volumen de transacciones y sistemas a integrar. Para darte una propuesta exacta, ¿cuántos colaboradores atienden soporte o qué proceso te gustaría automatizar primero?"
    }
  ];

  if (chatForm && chatInput && chatMessages) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const userText = chatInput.value.trim();
      if (!userText) return;

      // Renderizar mensaje del usuario
      appendChatMessage(userText, 'user');
      chatInput.value = '';

      // Indicador de "Escribiendo..."
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'flex items-center gap-2 text-xs font-mono text-muted p-2';
      typingIndicator.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-iris animate-bounce"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-cyan animate-bounce" style="animation-delay: 0.2s"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-emerald animate-bounce" style="animation-delay: 0.4s"></span>
        <span>Valentina analizando contexto...</span>
      `;
      chatMessages.appendChild(typingIndicator);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Buscar coincidencia en la base de conocimiento
      setTimeout(() => {
        typingIndicator.remove();
        const lower = userText.toLowerCase();
        let reply = "Entendido. En Valentina estructuramos la automatización directamente en código nativo (Node.js/Python) y RAG con memoria semántica para que tus datos nunca salgan de tu control. ¿Te gustaría agendar una llamada de 15 minutos para analizar la viabilidad técnica?";

        for (const item of knowledgeBase) {
          if (item.keywords.some(k => lower.includes(k))) {
            reply = item.response;
            break;
          }
        }

        appendChatMessage(reply, 'bot');
      }, 1000);
    });
  }

  function appendChatMessage(text, sender) {
    const msgDiv = document.createElement('div');
    if (sender === 'user') {
      msgDiv.className = 'flex items-start justify-end gap-2.5';
      msgDiv.innerHTML = `
        <div class="bg-iris text-white rounded-2xl rounded-tr-sm p-3 text-xs sm:text-sm leading-relaxed max-w-[85%] shadow-md">
          ${escapeHtml(text)}
        </div>
      `;
    } else {
      msgDiv.className = 'flex items-start gap-3';
      msgDiv.innerHTML = `
        <div class="w-7 h-7 rounded-lg bg-iris/20 border border-iris/30 flex items-center justify-center text-iris font-bold text-xs shrink-0 mt-0.5">
          V
        </div>
        <div class="bg-white/[0.06] border border-white/10 rounded-2xl rounded-tl-sm p-3.5 text-slate-200 text-xs sm:text-sm leading-relaxed max-w-[85%]">
          ${text}
        </div>
      `;
    }
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function escapeHtml(string) {
    return String(string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ==================== 4. CONTADORES DE MÉTRICAS ANIMADOS ====================
  const counters = document.querySelectorAll('.counter');
  let animated = false;

  function runCounters() {
    if (animated) return;
    counters.forEach(counter => {
      const target = +counter.getAttribute('data-target');
      const duration = 2000;
      const step = target / (duration / 16);
      let current = 0;

      const updateCounter = () => {
        current += step;
        if (current < target) {
          counter.innerText = Math.ceil(current).toLocaleString('es-MX');
          requestAnimationFrame(updateCounter);
        } else {
          counter.innerText = target.toLocaleString('es-MX');
        }
      };
      updateCounter();
    });
    animated = true;
  }

  // Disparar animación de métricas con Intersection Observer
  const metricsSection = document.querySelector('.counter');
  if (metricsSection) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        runCounters();
      }
    }, { threshold: 0.5 });
    observer.observe(metricsSection);
  }
});
