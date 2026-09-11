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
  subscriptionFeeMxn?: number; // Lo que el cliente le paga mensualmente a Valentina AI
  monthlyBudgetMxn: number; // Límite máximo operativo asignado para consumo de IA (Tokens)
  totalSpentMxn: number; // Gasto real acumulado de tokens de IA
  totalTokensUsed: number;
  activeAgentsCount: number;
  metaFreeConversationsUsed?: number; // Conversaciones usadas del paquete de 1,000 gratis de Meta
  metaExcessCostMxn?: number; // Costo por excedente en Meta (si supera 1,000 al mes)
  channels: Channel[];

  // Datos Fiscales, Comerciales y de Expediente Digital
  legalBusinessName?: string; // Razón Social Oficial (ej. DermaHealth Care S.A. de C.V.)
  rfc?: string; // RFC para facturación y contrato
  taxAddress?: string; // Domicilio Fiscal Completo
  legalRepresentative?: string; // Representante Legal o Titular
  legalRepresentativeTitle?: string; // Cargo del Representante (ej. Director General)
  billingPeriod?: 'monthly' | 'annual'; // Modalidad de facturación
  setupFeeMxn?: number; // Inversión inicial de implementación (Setup)
  selectedPlanDetails?: {
    setupFee: number;
    monthlyFee: number;
    billingPeriod: 'monthly' | 'annual';
    estimatedMetaMessages?: number;
    estimatedMetaCostMxn?: number;
    projectedMonthlySavingsMxn?: number;
  };
  connectedSystems?: string[]; // CRM, Calendario, ERP seleccionados
  secondaryChannels?: string[]; // Canales adicionales (Webchat, Instagram, etc.)
  railwayTenantId?: number; // Identificador numérico mapeado en el backend de Railway RAG
  notes?: string;
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
  status: 'sending' | 'sent' | 'delivered' | 'read';
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

export type UserRole = 'superadmin' | 'tenant_admin' | 'advisor' | 'evaluator';

export type UserLevel =
  | 'director'
  | 'coordinador'
  | 'vendedor'
  | 'asesor'
  | 'evaluador'
  | 'soporte';

export type UserStatus = 'active' | 'suspended' | 'pending';

export interface AuthUser {
  id: string;
  email: string;
  password?: string; // Provisional / solo para generación de credenciales nuevas
  fullName: string;
  tenantId: string | null; // null si es superadmin global
  role: UserRole;
  jobTitle?: string; // Cargo descriptivo (ej. "Director de Admisiones")
  level?: UserLevel; // Nivel de permisos dentro de la empresa
  status: UserStatus;
  avatarUrl?: string;
  createdAt: string;
  notes?: string;
  mustChangePassword?: boolean; // Obligatorio cambiar clave en primer login
}

export type QuoteStatus = 'draft' | 'sent' | 'negotiating' | 'accepted' | 'declined';

export interface CommercialQuote {
  id: string;
  folio: string; // ej. COT-VAL-2026-0182
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactJobTitle?: string;
  industry: string;

  // Diagnóstico Operativo Humano
  currentStaffCount: number; // Número de asesores/recepcionistas actuales
  staffSalaryMxn: number; // Sueldo promedio mensual por persona
  normalMonthlyVolume: number; // Conversaciones promedio al mes
  peakMonthlyVolume: number; // Conversaciones en temporadas altas
  missedOffHoursPercent?: number; // % prospectos no atendidos fuera de horario

  // Alcance y Funcionalidades
  selectedFeatures: string[]; // Lista de módulos seleccionados del checklist
  connectedCrm?: string;
  connectedCalendar?: string;

  // Propuesta Comercial Oficial (POL-COM-VAL-2026-B)
  plan: 'Growth' | 'Scale' | 'Enterprise';
  billingPeriod: 'monthly' | 'annual';
  setupFeeMxn: number;
  monthlyFeeMxn: number;

  // Métricas Financieras Proyectadas (ROI)
  currentHumanCostMxn: number;
  monthlySavingsMxn: number;
  netAnnualSavingsMxn: number;
  amortizationDays: number;
  estimatedMetaMonthlyCostMxn: number;

  // Metadatos
  status: QuoteStatus;
  createdAt: string;
  expiresAt: string;
  notes?: string;
  sentAt?: string;
}

