import { supabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin';
import { Tenant } from '../types/platform';

function mapRowToTenant(row: Record<string, any>): Tenant {
  const data = (row.data || {}) as Tenant;
  return {
    ...data,
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    plan: row.plan,
    railwayTenantId: row.railway_tenant_id ?? data.railwayTenantId,
  };
}

/** Lee un solo tenant por id, ya mapeado a `Tenant` (incluye los campos fiscales/plan dentro de `data`). */
export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  if (!isSupabaseAdminConfigured || !tenantId) return null;

  const { data, error } = await supabaseAdmin.from('tenants').select('*').eq('id', tenantId).maybeSingle();
  if (error || !data) return null;

  return mapRowToTenant(data);
}

/**
 * Resuelve a qué tenant pertenece un mensaje entrante de Meta/WhatsApp a
 * partir del `phone_number_id` que Meta reporta en el payload del webhook.
 * Busca tanto en el phoneNumberId a nivel tenant como en cada canal
 * configurado, porque ambos existen en el modelo actual de `Tenant`.
 */
export async function findTenantByPhoneNumberId(phoneNumberId: string): Promise<Tenant | null> {
  if (!isSupabaseAdminConfigured || !phoneNumberId) return null;

  const { data, error } = await supabaseAdmin.from('tenants').select('*');
  if (error || !data) return null;

  const tenants = data.map(mapRowToTenant);
  return (
    tenants.find(
      (t) =>
        t.phoneNumberId === phoneNumberId ||
        t.channels?.some((ch) => ch.phoneNumberId === phoneNumberId)
    ) || null
  );
}
