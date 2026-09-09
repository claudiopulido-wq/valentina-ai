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

  // ==================== 0. MENÚ RESPONSIVO MÓVIL ====================
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuIcon = document.getElementById('menu-icon');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isClosed = mobileMenu.classList.contains('hidden');
      if (isClosed) {
        mobileMenu.classList.remove('hidden');
        mobileMenu.classList.add('flex');
        if (menuIcon) menuIcon.setAttribute('data-lucide', 'x');
      } else {
        mobileMenu.classList.add('hidden');
        mobileMenu.classList.remove('flex');
        if (menuIcon) menuIcon.setAttribute('data-lucide', 'menu');
      }
      if (window.lucide) window.lucide.createIcons();
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        mobileMenu.classList.remove('flex');
        if (menuIcon) menuIcon.setAttribute('data-lucide', 'menu');
        if (window.lucide) window.lucide.createIcons();
      });
    });
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
          try {
            heroVideo.pause();
            heroVideo.src = videoSrc;
            heroVideo.load();
            heroVideo.play().catch(() => {});
          } catch (err) {
            console.warn('Video switch error:', err);
          }
          heroVideo.style.opacity = '0.9';
        }, 150);
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

    // Sincronizar en tiempo real con el Drawer
    const drawerRoiSummary = document.getElementById('drawer-roi-summary');
    const drawerSavingsSummary = document.getElementById('drawer-savings-summary');
    if (drawerRoiSummary) drawerRoiSummary.textContent = `${hoursSavedPerMonth.toLocaleString('es-MX')} hrs recuperables / mes`;
    if (drawerSavingsSummary) drawerSavingsSummary.textContent = `$${monthlySavings.toLocaleString('es-MX')} MXN / mes`;
  }

  if (rangeTeam && rangeHours && rangeCost) {
    rangeTeam.addEventListener('input', calculateROI);
    rangeHours.addEventListener('input', calculateROI);
    rangeCost.addEventListener('input', calculateROI);
    calculateROI(); // Calcular valor inicial
  }

  // ==================== 2.1 DRAWER DE DIAGNÓSTICO ENTERPRISE ====================
  const btnOpenDrawer = document.getElementById('btn-open-drawer-roi');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const drawerBackdrop = document.getElementById('diagnostic-drawer-backdrop');
  const drawer = document.getElementById('diagnostic-drawer');
  const diagnosticForm = document.getElementById('diagnostic-form');
  const drawerSuccess = document.getElementById('drawer-success');
  const btnCloseSuccess = document.getElementById('btn-close-success');

  function toggleDrawer(open = true) {
    if (!drawer || !drawerBackdrop) return;
    if (open) {
      drawerBackdrop.classList.remove('hidden');
      setTimeout(() => {
        drawerBackdrop.classList.remove('opacity-0');
        drawer.classList.remove('translate-x-full');
      }, 10);
      document.body.style.overflow = 'hidden';
    } else {
      drawerBackdrop.classList.add('opacity-0');
      drawer.classList.add('translate-x-full');
      setTimeout(() => {
        drawerBackdrop.classList.add('hidden');
        document.body.style.overflow = '';
      }, 300);
    }
  }

  if (btnOpenDrawer) btnOpenDrawer.addEventListener('click', () => toggleDrawer(true));
  if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', () => toggleDrawer(false));
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', () => toggleDrawer(false));
  if (btnCloseSuccess) btnCloseSuccess.addEventListener('click', () => {
    toggleDrawer(false);
    setTimeout(() => {
      if (diagnosticForm) {
        diagnosticForm.reset();
        diagnosticForm.classList.remove('hidden');
      }
      if (drawerSuccess) drawerSuccess.classList.add('hidden');
    }, 400);
  });

  // Envío del Formulario de Diagnóstico
  if (diagnosticForm) {
    diagnosticForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById('btn-submit-diagnostic');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
          <span>Procesando Diagnóstico con Valentina...</span>
        `;
      }

      // Simulación de procesamiento y guardado seguro (enviando a backend)
      setTimeout(() => {
        if (diagnosticForm) diagnosticForm.classList.add('hidden');
        if (drawerSuccess) drawerSuccess.classList.remove('hidden');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `
            <span>Solicitar Diagnóstico Técnico &amp; Propuesta en PDF</span>
            <i data-lucide="send" class="w-4 h-4"></i>
          `;
          if (window.lucide) window.lucide.createIcons();
        }
      }, 1200);
    });
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
      keywords: ['clinica', 'medico', 'estetica', 'salud', 'cita', 'agenda', 'paciente', 'botox'],
      response: "Para clínicas médicas y de alta especialidad desarrollamos un asistente inteligente que califica pacientes, responde dudas frecuentes, cotiza tratamientos y agenda citas directamente en el calendario médico las 24 horas del día."
    },
    {
      keywords: ['abogado', 'legal', 'juridico', 'demanda', 'juzgado', 'confidencial', 'contrato'],
      response: "Para firmas y despachos jurídicos implementamos un asistente con confidencialidad absoluta que clasifica los casos, recopila la información clave del cliente y prepara un resumen ordenado para el abogado antes de la consulta."
    },
    {
      keywords: ['uges', 'universidad', 'escuela', 'alumnos', 'educacion'],
      response: "Valentina está respaldada por una sólida infraestructura institucional y académica, con más de 3,000 egresados titulados y plataformas oficiales de certificación."
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
        <span>Valentina analizando mensaje...</span>
      `;
      chatMessages.appendChild(typingIndicator);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Buscar coincidencia en la base de conocimiento
      setTimeout(() => {
        typingIndicator.remove();
        const lower = userText.toLowerCase();
        let reply = "Entendido. En Valentina creamos asistentes de inteligencia artificial a la medida de tu empresa para atender clientes por WhatsApp y automatizar tus procesos sin errores humanos. ¿Te gustaría agendar una llamada breve de 15 minutos para ver cómo aplicarlo a tu negocio?";

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

  // ==================== 5. INFOGRAFÍAS TÉCNICAS INTERACTIVAS ====================
  // Alternar entre Pestañas de Infografía
  const tabBtnArch = document.getElementById('tab-btn-arch');
  const tabBtnSpec = document.getElementById('tab-btn-spec');
  const tabBtnVideos = document.getElementById('tab-btn-videos');
  const tabArch = document.getElementById('infographic-tab-arch');
  const tabSpec = document.getElementById('infographic-tab-spec');
  const tabVideos = document.getElementById('infographic-tab-videos');

  const setTab = (activeBtn, activePanel) => {
    [tabBtnArch, tabBtnSpec, tabBtnVideos].forEach(btn => btn?.classList.remove('active'));
    [tabArch, tabSpec, tabVideos].forEach(panel => panel?.classList.add('hidden'));

    activeBtn?.classList.add('active');
    activePanel?.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  };

  tabBtnArch?.addEventListener('click', () => setTab(tabBtnArch, tabArch));
  tabBtnSpec?.addEventListener('click', () => setTab(tabBtnSpec, tabSpec));
  tabBtnVideos?.addEventListener('click', () => setTab(tabBtnVideos, tabVideos));

  // Nodos Interactivos de Arquitectura (Tab 1)
  const archNodes = document.querySelectorAll('.infographic-node');
  const detailTitle = document.getElementById('detail-title');
  const detailDesc = document.getElementById('detail-desc');
  const detailSpec1 = document.getElementById('detail-spec-1');
  const detailSpec2 = document.getElementById('detail-spec-2');
  const detailSpec3 = document.getElementById('detail-spec-3');
  const detailSpec4 = document.getElementById('detail-spec-4');

  const nodeData = {
    entry: {
      title: '1. Canales de Atención Directa',
      desc: 'Conexión oficial con WhatsApp y chat en tu sitio web. Recibe y atiende a cientos de clientes al mismo tiempo sin saturarse y responde de inmediato las 24 horas del día.',
      s1: 'Canal Oficial: WhatsApp Business & Web',
      s2: 'Tiempo de Respuesta: < 2 segundos',
      s3: 'Disponibilidad: 24/7/365',
      s4: 'Capacidad: Ilimitada sin esperas'
    },
    gateway: {
      title: '2. Filtro de Seguridad y Privacidad',
      desc: 'Protección de nivel bancario. Filtra mensajes no deseados, bloquea fraudes y garantiza que tus accesos y contraseñas nunca queden expuestos.',
      s1: 'Seguridad: Grado Bancario',
      s2: 'Filtro: Antifraude y Spam Activo',
      s3: 'Protección: Automática 24/7',
      s4: 'Riesgo de fugas: Cero'
    },
    brain: {
      title: '3. Inteligencia de tu Empresa',
      desc: 'El cerebro de Valentina aprende tus listas de precios, políticas, catálogos y preguntas frecuentes. Responde con lenguaje natural, cálido y certero, sin inventar datos.',
      s1: 'Conocimiento: Catálogos y Políticas',
      s2: 'Precisión de respuesta: > 99%',
      s3: 'Tono: Humano y Empático',
      s4: 'Cotización: Automática en segundos'
    },
    rls: {
      title: '4. Bóveda Privada de Información',
      desc: 'Toda la información de tu negocio, expedientes y clientes está guardada bajo una bóveda digital exclusiva. Tus datos jamás se mezclan ni se comparten con terceros.',
      s1: 'Privacidad: 100% Exclusiva para ti',
      s2: 'Propiedad de datos: Tu Empresa',
      s3: 'Confidencialidad: Total Garantizada',
      s4: 'Cifrado: Blindaje Completo'
    },
    execution: {
      title: '5. Acciones Reales y Conexión con tu Equipo',
      desc: 'Valentina no solo responde dudas: agenda citas en tu calendario de Google, registra prospectos en tu sistema y transfiere la conversación a una persona de tu equipo si el cliente lo solicita.',
      s1: 'Agendamiento: Google Calendar en Vivo',
      s2: 'Sistemas: Conexión con tu CRM o Base de Datos',
      s3: 'Pase a Asesor Humano: En 1 clic',
      s4: 'Operación: 100% Manos Libres'
    }
  };

  archNodes.forEach(node => {
    node.addEventListener('click', () => {
      archNodes.forEach(n => n.classList.remove('active'));
      node.classList.add('active');

      const nodeKey = node.getAttribute('data-node');
      const data = nodeData[nodeKey];

      if (data && detailTitle) {
        detailTitle.textContent = data.title;
        detailDesc.textContent = data.desc;
        detailSpec1.textContent = data.s1;
        detailSpec2.textContent = data.s2;
        detailSpec3.textContent = data.s3;
        detailSpec4.textContent = data.s4;
      }
    });
  });

  // Simulador de Industria en la Ficha Técnica (Tab 2)
  const specButtons = document.querySelectorAll('.spec-sim-btn');
  const simAgentName = document.getElementById('sim-agent-name');
  const simUserMsg = document.getElementById('sim-user-msg');
  const simAgentReply = document.getElementById('sim-agent-reply');
  const simMetricScore = document.getElementById('sim-metric-score');
  const simBarScore = document.getElementById('sim-bar-score');
  const simMetricRes = document.getElementById('sim-metric-res');
  const simBarRes = document.getElementById('sim-bar-res');
  const simMetricLat = document.getElementById('sim-metric-lat');
  const simMetricCost = document.getElementById('sim-metric-cost');

  const tenantSimData = {
    botox: {
      name: 'Agente Valentina (Clínica Médica Especializada)',
      user: '"Hola buenas tardes! Quisiera saber el costo del botox para patas de gallo y entrecejo por favor"',
      reply: '¡Hola Sofía! Con gusto. Para tercio superior utilizamos toxina botulínica certificada. El paquete ronda entre $3,800 y $4,500 MXN. ¿Te gustaría agendar cita diagnóstica este viernes en Polanco o Roma Norte?',
      score: '95 / 100',
      scorePct: '95%',
      res: '91.4%',
      resPct: '91%',
      lat: '1.08 seg',
      cost: '$0.024 MXN'
    },
    uges: {
      name: 'Agente Valentina (Institución Universitaria)',
      user: '"Buenas tardes, me interesa la Licenciatura en Derecho Ejecutivo. ¿Tienen validez RVOE y modalidad sabatina?"',
      reply: '¡Hola! Sí, nuestra Licenciatura en Derecho cuenta con RVOE Federal oficial de la SEP. Contamos con modalidad sabatina presencial o 100% online con titulación directa. ¿Te gustaría que te envíe el plan curricular al correo?',
      score: '98 / 100',
      scorePct: '98%',
      res: '94.8%',
      resPct: '95%',
      lat: '0.94 seg',
      cost: '$0.019 MXN'
    },
    legal: {
      name: 'Agente Valentina (Firma Legal Corporativa)',
      user: '"Requiero asesoría urgente sobre una rescisión laboral injustificada de un puesto gerencial"',
      reply: 'Estimado cliente, comprendo la urgencia. En materia laboral protegemos la confidencialidad absoluta de su caso. Para calcular su liquidación conforme al artículo 48 de la LFT, ¿cuántos años de antigüedad y salario promedio mantenía?',
      score: '92 / 100',
      scorePct: '92%',
      res: '88.5%',
      resPct: '88%',
      lat: '1.14 seg',
      cost: '$0.028 MXN'
    },
    busa: {
      name: 'Agente Valentina (Centro de Servicios Automotrices)',
      user: '"Oye amigo, tienes balatas delanteras para un Mazda 3 modelo 2022 y cuánto sale el cambio?"',
      reply: '¡Qué tal! Sí tenemos en existencia balatas de cerámica para Mazda 3 2022 ($1,450 MXN el par) más $450 de mano de obra con rectificado de discos. ¿Te aparto espacio en el taller para hoy a las 4:00 PM?',
      score: '96 / 100',
      scorePct: '96%',
      res: '93.2%',
      resPct: '93%',
      lat: '0.86 seg',
      cost: '$0.016 MXN'
    }
  };

  specButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      specButtons.forEach(b => {
        b.classList.remove('active', 'border-iris/40', 'bg-iris/15');
        b.classList.add('border-white/10', 'bg-white/[0.02]');
      });

      btn.classList.add('active', 'border-iris/40', 'bg-iris/15');
      btn.classList.remove('border-white/10', 'bg-white/[0.02]');

      const tenant = btn.getAttribute('data-tenant');
      const d = tenantSimData[tenant];

      if (d && simAgentName) {
        simAgentName.textContent = d.name;
        simUserMsg.textContent = d.user;
        simAgentReply.textContent = d.reply;
        simMetricScore.textContent = d.score;
        simBarScore.style.width = d.scorePct;
        simMetricRes.textContent = d.res;
        simBarRes.style.width = d.resPct;
        simMetricLat.textContent = d.lat;
        simMetricCost.textContent = d.cost;
      }
    });
  });

  // ==================== 5. PROTECCIÓN ESTRICTA DE VIDEOS ====================
  // Deshabilitar descargas, menús contextuales y accesos directos
  const protectVideos = () => {
    document.querySelectorAll('video').forEach(video => {
      video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
      video.setAttribute('disablePictureInPicture', 'true');
      video.addEventListener('contextmenu', e => e.preventDefault());
    });
  };
  protectVideos();
  // Re-aplicar periódicamente si hay elementos dinámicos
  setTimeout(protectVideos, 1000);
});
