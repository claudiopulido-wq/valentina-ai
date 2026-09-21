import { describe, it, expect, vi } from 'vitest';
import { mapHiloToConversation, mapMensajeToChatMessage, HiloDTO, MensajeDTO } from './railwayConversationsService';

describe('mapHiloToConversation', () => {
  const baseHilo: HiloDTO = {
    canal: 'whatsapp',
    contacto: '5214421234567',
    ultimoMensaje: '¿Cuál es la diferencia entre el Plan Growth y el Scale?',
    ultimoRol: 'user',
    ultimoEnviadoPor: null,
    actualizadoEn: '2026-09-19T22:14:03.512Z',
    pausadoHasta: null,
  };

  it('marks the conversation as ai_handling when pausadoHasta is null', () => {
    const conv = mapHiloToConversation(baseHilo, 'tenant-valentina-ai');
    expect(conv.status).toBe('ai_handling');
  });

  it('marks the conversation as human_escalated when pausadoHasta is in the future', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const conv = mapHiloToConversation({ ...baseHilo, pausadoHasta: future }, 'tenant-valentina-ai');
    expect(conv.status).toBe('human_escalated');
  });

  it('does not treat a past pausadoHasta as an active human takeover', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const conv = mapHiloToConversation({ ...baseHilo, pausadoHasta: past }, 'tenant-valentina-ai');
    expect(conv.status).toBe('ai_handling');
  });

  it('does not invent a contact name the API never provided', () => {
    const conv = mapHiloToConversation(baseHilo, 'tenant-valentina-ai');
    expect(conv.contact.name).toBe('5214421234567');
    expect(conv.contact.phoneOrEmail).toBe('5214421234567');
  });

  it('maps a human-sent last message to human_operator, not ai_agent', () => {
    const hilo: HiloDTO = {
      ...baseHilo,
      ultimoRol: 'assistant',
      ultimoEnviadoPor: 'humano',
      ultimoMensaje: 'Claro, con gusto te ayudo con eso...',
    };
    const conv = mapHiloToConversation(hilo, 'tenant-valentina-ai');
    expect(conv.messages[0].sender).toBe('human_operator');
  });

  it('maps a bot-sent last message to ai_agent', () => {
    const hilo: HiloDTO = { ...baseHilo, ultimoRol: 'assistant', ultimoEnviadoPor: 'bot' };
    const conv = mapHiloToConversation(hilo, 'tenant-valentina-ai');
    expect(conv.messages[0].sender).toBe('ai_agent');
  });

  it('builds a stable id from tenant, channel and contact', () => {
    const conv = mapHiloToConversation(baseHilo, 'tenant-valentina-ai');
    expect(conv.id).toBe('railway-tenant-valentina-ai-whatsapp-5214421234567');
  });
});

describe('mapMensajeToChatMessage', () => {
  it('maps a user message', () => {
    const msg: MensajeDTO = {
      id: 4821,
      rol: 'user',
      mensaje: 'Hola, quiero información de la ingeniería en sistemas',
      enviadoPor: null,
      createdAt: '2026-09-19T22:10:00.000Z',
    };
    const chatMsg = mapMensajeToChatMessage(msg, 'conv-1');
    expect(chatMsg.sender).toBe('user');
    expect(chatMsg.content).toBe(msg.mensaje);
    expect(chatMsg.conversationId).toBe('conv-1');
  });

  it('maps a bot-authored assistant message', () => {
    const msg: MensajeDTO = {
      id: 4822,
      rol: 'assistant',
      mensaje: '¡Hola! Con gusto te cuento sobre ese programa...',
      enviadoPor: 'bot',
      createdAt: '2026-09-19T22:10:03.000Z',
    };
    const chatMsg = mapMensajeToChatMessage(msg, 'conv-1');
    expect(chatMsg.sender).toBe('ai_agent');
  });

  it('maps a human-authored assistant-role message to human_operator', () => {
    const msg: MensajeDTO = {
      id: 4823,
      rol: 'assistant',
      mensaje: 'Un asesor te va a contactar en breve.',
      enviadoPor: 'humano',
      createdAt: '2026-09-19T22:11:00.000Z',
    };
    const chatMsg = mapMensajeToChatMessage(msg, 'conv-1');
    expect(chatMsg.sender).toBe('human_operator');
  });
});
