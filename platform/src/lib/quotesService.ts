import { supabase, isSupabaseConfigured } from './supabaseClient';
import { CommercialQuote } from '../types/platform';
import { MOCK_COMMERCIAL_QUOTES } from '../data/mockData';

const STORAGE_KEY = 'val_commercial_quotes';
const INFRA_STORAGE_KEYS = {
  supabase: 'val_infra_supabase',
  railway: 'val_infra_railway',
  vercel: 'val_infra_vercel',
  domain: 'val_infra_domain',
};

export interface CloudCosts {
  supabase: number;
  railway: number;
  vercel: number;
  domain: number;
}

/**
 * Obtener cotizaciones del almacenamiento local inmediatamente (caché offline)
 */
export function getLocalCommercialQuotes(): CommercialQuote[] {
  if (typeof window === 'undefined') return MOCK_COMMERCIAL_QUOTES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[quotesService] Error al leer localStorage:', e);
  }
  return MOCK_COMMERCIAL_QUOTES;
}

/**
 * Guardar cotizaciones en caché local
 */
export function setLocalCommercialQuotes(quotes: CommercialQuote[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
  } catch (e) {
    console.warn('[quotesService] Error al guardar en localStorage:', e);
  }
}

/**
 * Obtener costos Cloud de caché local
 */
export function getLocalCloudCosts(): CloudCosts {
  const defaults: CloudCosts = {
    supabase: 500,
    railway: 100,
    vercel: 0,
    domain: 20,
  };

  if (typeof window === 'undefined') return defaults;

  try {
    const s = localStorage.getItem(INFRA_STORAGE_KEYS.supabase);
    const r = localStorage.getItem(INFRA_STORAGE_KEYS.railway);
    const v = localStorage.getItem(INFRA_STORAGE_KEYS.vercel);
    const d = localStorage.getItem(INFRA_STORAGE_KEYS.domain);

    return {
      supabase: s !== null ? Number(s) : defaults.supabase,
      railway: r !== null ? Number(r) : defaults.railway,
      vercel: v !== null ? Number(v) : defaults.vercel,
      domain: d !== null ? Number(d) : defaults.domain,
    };
  } catch (e) {
    return defaults;
  }
}

/**
 * Guardar costos Cloud en caché local
 */
export function setLocalCloudCosts(costs: CloudCosts): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INFRA_STORAGE_KEYS.supabase, costs.supabase.toString());
    localStorage.setItem(INFRA_STORAGE_KEYS.railway, costs.railway.toString());
    localStorage.setItem(INFRA_STORAGE_KEYS.vercel, costs.vercel.toString());
    localStorage.setItem(INFRA_STORAGE_KEYS.domain, costs.domain.toString());
  } catch (e) {
    console.warn('[quotesService] Error al guardar costos en localStorage:', e);
  }
}

/**
 * Mapeo de fila Supabase a objeto CommercialQuote
 */
function mapRowToQuote(row: any): CommercialQuote {
  const data = row.quote_data || {};
  return {
    id: row.id,
    folio: row.folio || data.folio || 'COT-VAL-2026-0000',
    companyName: row.company_name || data.companyName || '',
    contactName: row.contact_name || data.contactName || '',
    contactEmail: row.contact_email || data.contactEmail || '',
    contactPhone: row.contact_phone || data.contactPhone || '',
    contactJobTitle: row.contact_job_title || data.contactJobTitle,
    industry: row.industry || data.industry || 'General',
    plan: row.plan || data.plan || 'Scale',
    billingPeriod: row.billing_period || data.billingPeriod || 'monthly',
    setupFeeMxn: Number(row.setup_fee_mxn ?? data.setupFeeMxn ?? 0),
    monthlyFeeMxn: Number(row.monthly_fee_mxn ?? data.monthlyFeeMxn ?? 0),
    currentStaffCount: data.currentStaffCount || 1,
    staffSalaryMxn: data.staffSalaryMxn || 14000,
    normalMonthlyVolume: data.normalMonthlyVolume || 1500,
    peakMonthlyVolume: data.peakMonthlyVolume || 2500,
    missedOffHoursPercent: data.missedOffHoursPercent || 35,
    selectedFeatures: Array.isArray(row.selected_features)
      ? row.selected_features
      : Array.isArray(data.selectedFeatures)
      ? data.selectedFeatures
      : [],
    connectedCrm: data.connectedCrm,
    connectedCalendar: data.connectedCalendar,
    currentHumanCostMxn: data.currentHumanCostMxn || 0,
    monthlySavingsMxn: Number(row.monthly_savings_mxn ?? data.monthlySavingsMxn ?? 0),
    netAnnualSavingsMxn: Number(row.net_annual_savings_mxn ?? data.netAnnualSavingsMxn ?? 0),
    amortizationDays: Number(row.amortization_days ?? data.amortizationDays ?? 15),
    estimatedMetaMonthlyCostMxn: data.estimatedMetaMonthlyCostMxn || 0,
    status: row.status || data.status || 'draft',
    createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : data.createdAt || new Date().toISOString().split('T')[0],
    expiresAt: data.expiresAt || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    notes: data.notes,
    sentAt: data.sentAt,
  };
}

/**
 * Cargar cotizaciones desde Supabase con sincronización y respaldo a localStorage
 */
export async function syncCommercialQuotesFromSupabase(): Promise<CommercialQuote[]> {
  const localQuotes = getLocalCommercialQuotes();

  if (!isSupabaseConfigured) {
    return localQuotes;
  }

  try {
    const { data, error } = await supabase
      .from('commercial_quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Si la tabla no existe aún en Supabase (código 42P01 en PG), retornamos localQuotes sin romper
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('[quotesService] Tabla commercial_quotes aún no creada en Supabase. Usando respaldo local.');
      } else {
        console.warn('[quotesService] Error al consultar commercial_quotes en Supabase:', error.message);
      }
      return localQuotes;
    }

    if (data && data.length > 0) {
      const remoteQuotes = data.map(mapRowToQuote);
      setLocalCommercialQuotes(remoteQuotes);
      return remoteQuotes;
    } else {
      // La tabla existe pero está vacía: respaldamos las cotizaciones locales en Supabase
      if (localQuotes.length > 0) {
        saveAllCommercialQuotesToSupabase(localQuotes).catch((err) =>
          console.warn('[quotesService] Auto-seed en Supabase falló silenciosamente:', err)
        );
      }
      return localQuotes;
    }
  } catch (err) {
    console.warn('[quotesService] Error de conexión Supabase:', err);
    return localQuotes;
  }
}

/**
 * Guardar o actualizar una cotización en Supabase y en localStorage
 */
export async function saveCommercialQuote(quote: CommercialQuote): Promise<void> {
  // 1. Guardar de inmediato en localStorage
  const current = getLocalCommercialQuotes();
  const exists = current.some((q) => q.id === quote.id);
  const updated = exists
    ? current.map((q) => (q.id === quote.id ? quote : q))
    : [quote, ...current];
  setLocalCommercialQuotes(updated);

  // 2. Persistir en Supabase de forma asíncrona si está configurado
  if (isSupabaseConfigured) {
    try {
      const payload = {
        id: quote.id,
        folio: quote.folio,
        company_name: quote.companyName,
        contact_name: quote.contactName,
        contact_email: quote.contactEmail,
        contact_phone: quote.contactPhone,
        contact_job_title: quote.contactJobTitle || null,
        industry: quote.industry,
        plan: quote.plan,
        billing_period: quote.billingPeriod,
        setup_fee_mxn: quote.setupFeeMxn,
        monthly_fee_mxn: quote.monthlyFeeMxn,
        monthly_savings_mxn: quote.monthlySavingsMxn,
        net_annual_savings_mxn: quote.netAnnualSavingsMxn,
        amortization_days: quote.amortizationDays,
        status: quote.status,
        selected_features: quote.selectedFeatures,
        quote_data: quote,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('commercial_quotes').upsert(payload);
      if (error && error.code !== '42P01') {
        console.warn('[quotesService] Error al hacer upsert en Supabase:', error.message);
      }
    } catch (err) {
      console.warn('[quotesService] Excepción al guardar cotización en Supabase:', err);
    }
  }
}

/**
 * Respaldo masivo a Supabase (usado para migración inicial)
 */
export async function saveAllCommercialQuotesToSupabase(quotes: CommercialQuote[]): Promise<void> {
  if (!isSupabaseConfigured || quotes.length === 0) return;

  try {
    const payloads = quotes.map((q) => ({
      id: q.id,
      folio: q.folio,
      company_name: q.companyName,
      contact_name: q.contactName,
      contact_email: q.contactEmail,
      contact_phone: q.contactPhone,
      contact_job_title: q.contactJobTitle || null,
      industry: q.industry,
      plan: q.plan,
      billing_period: q.billingPeriod,
      setup_fee_mxn: q.setupFeeMxn,
      monthly_fee_mxn: q.monthlyFeeMxn,
      monthly_savings_mxn: q.monthlySavingsMxn,
      net_annual_savings_mxn: q.netAnnualSavingsMxn,
      amortization_days: q.amortizationDays,
      status: q.status,
      selected_features: q.selectedFeatures,
      quote_data: q,
      updated_at: new Date().toISOString(),
    }));

    await supabase.from('commercial_quotes').upsert(payloads);
  } catch (e) {
    console.warn('[quotesService] Error en respaldo masivo:', e);
  }
}
