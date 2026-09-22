import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/serverAuth';
import { getTenantById } from '@/lib/tenantLookup';
import { recordDossierEmission, DossierDocumentType, DossierAction } from '@/lib/dossierLog';

const VALID_DOCUMENT_TYPES: DossierDocumentType[] = ['quote', 'agreement', 'raci', 'credentials', 'all'];
const VALID_ACTIONS: DossierAction[] = ['printed', 'copied'];

/**
 * POST /api/dossier/log-emission
 * Registra que alguien imprimió/descargó o copió el texto del correo de un
 * Expediente -- llamado desde los botones "Imprimir/PDF" y "Copiar Correo"
 * en `ClientDossierModal.tsx`. El folio y el snapshot se arman aquí, del
 * lado del servidor, a partir del tenant real (no de lo que mande el
 * cliente), para que el registro sea confiable como auditoría.
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireSuperAdmin(request);
  if (!authCheck.authorized) return authCheck.response;

  let body: { tenantId?: string; userId?: string | null; documentType?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'El cuerpo de la solicitud no es un JSON válido.', code: 'INVALID_JSON' }, { status: 400 });
  }

  const { tenantId, userId, documentType, action } = body;
  if (
    !tenantId ||
    !documentType ||
    !action ||
    !VALID_DOCUMENT_TYPES.includes(documentType as DossierDocumentType) ||
    !VALID_ACTIONS.includes(action as DossierAction)
  ) {
    return NextResponse.json({ error: 'Parámetros inválidos.', code: 'INVALID_BODY' }, { status: 400 });
  }

  const tenant = await getTenantById(tenantId);
  if (!tenant) {
    return NextResponse.json({ error: 'Empresa no encontrada.', code: 'TENANT_NOT_FOUND' }, { status: 404 });
  }

  const folioPrefix = documentType === 'all' ? 'EXP' : documentType.slice(0, 4).toUpperCase();
  const folio = `${folioPrefix}-${new Date().getFullYear()}-${tenant.id.replace('tenant-', '').slice(0, 6).toUpperCase()}`;

  await recordDossierEmission({
    tenantId,
    userId: userId || null,
    folio,
    documentType: documentType as DossierDocumentType,
    action: action as DossierAction,
    snapshot: { tenantName: tenant.name, plan: tenant.plan },
    actorId: authCheck.user.id,
    actorEmail: authCheck.user.email,
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
