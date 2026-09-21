import { describe, it, expect } from 'vitest';
import { mapRowToConversation } from './conversationsService';

function buildRow(overrides: Partial<Parameters<typeof mapRowToConversation>[0]> = {}) {
  return {
    id: 'conv-1',
    tenant_id: 'tenant-acme',
    channel: 'whatsapp' as const,
    status: 'ai_handling' as const,
    sentiment: 'neutral' as const,
    summary: null,
    created_at: '2026-09-18T10:00:00.000Z',
    updated_at: '2026-09-18T10:05:00.000Z',
    contact: {
      id: 'contact-1',
      tenant_id: 'tenant-acme',
      name: 'Juan Pérez',
      phone_or_email: '+525512345678',
      channel_origin: 'whatsapp',
      city: null,
      qualification_score: 80,
      tags: ['prospecto'],
      created_at: '2026-09-18T09:00:00.000Z',
    },
    messages: [],
    ...overrides,
  };
}

describe('mapRowToConversation', () => {
  it('aggregates token usage and cost from real messages instead of a fixed value', () => {
    const row = buildRow({
      messages: [
        {
          id: 'm1',
          conversation_id: 'conv-1',
          sender: 'user',
          sender_name: 'Juan',
          content: 'Hola',
          tokens_prompt: 10,
          tokens_completion: 0,
          cost_mxn: 0.001,
          status: 'delivered',
          simulated: false,
          media_url: null,
          media_type: null,
          created_at: '2026-09-18T10:00:00.000Z',
        },
        {
          id: 'm2',
          conversation_id: 'conv-1',
          sender: 'ai_agent',
          sender_name: 'Valentina AI',
          content: 'Hola, ¿en qué puedo ayudarte?',
          tokens_prompt: 5,
          tokens_completion: 20,
          cost_mxn: 0.002,
          status: 'sent',
          simulated: false,
          media_url: null,
          media_type: null,
          created_at: '2026-09-18T10:01:00.000Z',
        },
      ],
    });

    const conversation = mapRowToConversation(row);

    expect(conversation.totalTokens).toBe(35);
    expect(conversation.totalCostMxn).toBeCloseTo(0.003, 5);
    expect(conversation.messages).toHaveLength(2);
    expect(conversation.lastMessage).toBe('Hola, ¿en qué puedo ayudarte?');
  });

  it('sorts messages chronologically regardless of row order', () => {
    const row = buildRow({
      messages: [
        {
          id: 'm2',
          conversation_id: 'conv-1',
          sender: 'ai_agent',
          sender_name: 'Valentina AI',
          content: 'segundo',
          tokens_prompt: 1,
          tokens_completion: 1,
          cost_mxn: 0,
          status: 'sent',
          simulated: false,
          media_url: null,
          media_type: null,
          created_at: '2026-09-18T10:05:00.000Z',
        },
        {
          id: 'm1',
          conversation_id: 'conv-1',
          sender: 'user',
          sender_name: 'Juan',
          content: 'primero',
          tokens_prompt: 1,
          tokens_completion: 0,
          cost_mxn: 0,
          status: 'delivered',
          simulated: false,
          media_url: null,
          media_type: null,
          created_at: '2026-09-18T10:00:00.000Z',
        },
      ],
    });

    const conversation = mapRowToConversation(row);
    expect(conversation.messages[0].content).toBe('primero');
    expect(conversation.messages[1].content).toBe('segundo');
  });

  it('falls back to a placeholder contact when the row has none, without crashing', () => {
    const row = buildRow({ contact: null, messages: [] });
    const conversation = mapRowToConversation(row);

    expect(conversation.contact.name).toBe('Contacto sin identificar');
    expect(conversation.lastMessage).toBe('Sin mensajes todavía');
    expect(conversation.totalTokens).toBe(0);
  });

  it('uses the real contact qualification score and tags instead of inventing them', () => {
    const row = buildRow();
    const conversation = mapRowToConversation(row);

    expect(conversation.contact.name).toBe('Juan Pérez');
    expect(conversation.contact.qualificationScore).toBe(80);
    expect(conversation.contact.tags).toEqual(['prospecto']);
  });
});
