import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/serverAuth';
import { listDossierEmissions } from '@/lib/dossierLog';

/**
 * GET /api/dossier/emissions?tenantId=...
 * Historial de auditoría de un Expediente (qué se imprimió/copió/mandó por
 * correo y cuándo) -- solo SuperAdmin.
 */
export async function GET(request: NextRequest) {
  const authCheck = await requireSuperAdmin(request);
  if (!authCheck.authorized) return authCheck.response;

  const tenantId = request.nextUrl.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ error: 'Falta tenantId.', code: 'INVALID_QUERY' }, { status: 400 });
  }

  const emissions = await listDossierEmissions(tenantId);
  return NextResponse.json({ emissions }, { status: 200 });
}
