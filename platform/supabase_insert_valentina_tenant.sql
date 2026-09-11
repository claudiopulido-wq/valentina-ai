-- ============================================================================
-- VALENTINA AI: INSERCIÓN DE TENANT OFICIAL Y CANAL WHATSAPP EN SUPABASE
-- Tenant: Valentina AI México (valentina-ai)
-- Canal: WhatsApp Oficial Landing Page & Redes Sociales
-- ============================================================================

-- 1. Insertar o actualizar la Organización / Tenant en la tabla 'organizations' o 'tenants'
-- Si tu base de datos utiliza la tabla 'tenants':
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tenants') THEN
    INSERT INTO tenants (
      id,
      name,
      slug,
      industry,
      plan,
      status,
      subscription_fee_mxn,
      monthly_budget_mxn,
      phone_number_id,
      waba_id,
      webhook_base_url,
      created_at,
      updated_at
    )
    VALUES (
      'tenant-valentina-ai',
      'Valentina AI México',
      'valentina-ai',
      'Inteligencia Artificial & Automatización B2B',
      'Enterprise',
      'active',
      15000.00,
      1000.00,
      '1306465949219252',
      '1111806054618508',
      'https://whatsapp-empresarial-production.up.railway.app',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      phone_number_id = EXCLUDED.phone_number_id,
      waba_id = EXCLUDED.waba_id,
      webhook_base_url = EXCLUDED.webhook_base_url,
      updated_at = NOW();
  END IF;
END $$;

-- 2. Si tu base de datos utiliza la tabla 'organizations':
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organizations') THEN
    INSERT INTO organizations (
      id,
      name,
      slug,
      plan,
      status,
      phone_number_id,
      waba_id,
      created_at,
      updated_at
    )
    VALUES (
      'tenant-valentina-ai',
      'Valentina AI México',
      'valentina-ai',
      'enterprise',
      'active',
      '1306465949219252',
      '1111806054618508',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      phone_number_id = EXCLUDED.phone_number_id,
      waba_id = EXCLUDED.waba_id,
      updated_at = NOW();
  END IF;
END $$;

-- 3. Registrar el canal oficial de WhatsApp en la tabla 'channels'
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'channels') THEN
    INSERT INTO channels (
      id,
      tenant_id,
      type,
      name,
      identifier,
      phone_number_id,
      waba_id,
      status,
      created_at,
      updated_at
    )
    VALUES (
      'ch-val-wa',
      'tenant-valentina-ai',
      'whatsapp',
      'WhatsApp Oficial Landing & Redes',
      '+52 442 269 2336',
      '1306465949219252',
      '1111806054618508',
      'connected',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      phone_number_id = EXCLUDED.phone_number_id,
      waba_id = EXCLUDED.waba_id,
      identifier = EXCLUDED.identifier,
      status = 'connected',
      updated_at = NOW();
  END IF;
END $$;

-- 4. Registrar usuario administrador oficial
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    INSERT INTO users (
      id,
      email,
      full_name,
      tenant_id,
      role,
      status,
      created_at
    )
    VALUES (
      'user-valentina-admin',
      'soporte@valentina-ai.mx',
      'Ing. Soporte & Operaciones Valentina AI',
      'tenant-valentina-ai',
      'tenant_admin',
      'active',
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
