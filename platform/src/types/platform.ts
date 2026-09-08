export type ChannelType = 'whatsapp' | 'web' | 'instagram' | 'telegram';

export type ConversationStatus = 'ai_handling' | 'human_escalated' | 'resolved';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  industry: string;
  logo: string;
  plan: 'Growth' | 'Enterprise' | 'Scale';
  status: 'active' | 'trial' | 'suspended';
  monthlyBudgetMxn: number;
  totalSpentMxn: number;
  totalTokensUsed: number;
  activeAgentsCount: number;
  channels: Channel[];
}

export interface Channel {
  id: string;
  type: ChannelType;
  name: string;
  identifier: string; // Phone number or Widget Key
  status: 'connected' | 'degraded' | 'disconnected';
  lastPing: string;
  batteryLevel?: number; // Visual Apple aesthetic
  dailyMessagesCount: number;
}

export interface Contact {
  id: string;
  tenantId: string;
  name: string;
  phoneOrEmail: string;
  avatarUrl?: string;
  channelOrigin: ChannelType;
  tags: string[];
  city?: string;
  firstSeenAt: string;
  qualificationScore?: number; // 0 - 100 Lead Score
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'user' | 'ai_agent' | 'human_operator';
  senderName?: string;
  content: string;
  timestamp: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  costMxn: number;
  status: 'sent' | 'delivered' | 'read';
  mediaUrl?: string;
  mediaType?: 'audio' | 'image' | 'pdf';
}

export interface Conversation {
  id: string;
  tenantId: string;
  contact: Contact;
  channel: ChannelType;
  status: ConversationStatus;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  totalTokens: number;
  totalCostMxn: number;
  sentiment: 'positive' | 'neutral' | 'urgent' | 'lead_qualified';
  summary?: string;
  messages: ChatMessage[];
}

export interface DailyTelemetry {
  date: string;
  totalMessages: number;
  aiHandledPercentage: number;
  promptTokens: number;
  completionTokens: number;
  costMxn: number;
  hoursSaved: number;
}
