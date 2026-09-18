import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isFeatureEnabled, FeatureFlagDefinition } from './featureFlags';

const TEST_FLAG: FeatureFlagDefinition = {
  envVar: 'FEATURE_TEST_FLAG_XYZ',
  betaEmails: ['claudio@valentina-ai.mx'],
};

describe('isFeatureEnabled', () => {
  const originalValue = process.env.FEATURE_TEST_FLAG_XYZ;

  beforeEach(() => {
    delete process.env.FEATURE_TEST_FLAG_XYZ;
  });

  afterEach(() => {
    if (originalValue === undefined) delete process.env.FEATURE_TEST_FLAG_XYZ;
    else process.env.FEATURE_TEST_FLAG_XYZ = originalValue;
  });

  it('is disabled by default when the env var is unset and the user is not a beta tester', () => {
    expect(isFeatureEnabled(TEST_FLAG, 'otro@empresa.com')).toBe(false);
    expect(isFeatureEnabled(TEST_FLAG, null)).toBe(false);
  });

  it('is enabled globally when the env var is "true"', () => {
    process.env.FEATURE_TEST_FLAG_XYZ = 'true';
    expect(isFeatureEnabled(TEST_FLAG, 'cualquiera@empresa.com')).toBe(true);
  });

  it('is enabled globally when the env var is "1"', () => {
    process.env.FEATURE_TEST_FLAG_XYZ = '1';
    expect(isFeatureEnabled(TEST_FLAG, null)).toBe(true);
  });

  it('is enabled only for a beta tester email while the global flag stays off', () => {
    expect(isFeatureEnabled(TEST_FLAG, 'claudio@valentina-ai.mx')).toBe(true);
    expect(isFeatureEnabled(TEST_FLAG, 'CLAUDIO@VALENTINA-AI.MX')).toBe(true); // case-insensitive
    expect(isFeatureEnabled(TEST_FLAG, 'otro@empresa.com')).toBe(false);
  });

  it('is disabled when the flag has no beta emails and no email is provided', () => {
    const flagWithoutBeta: FeatureFlagDefinition = { envVar: 'FEATURE_TEST_FLAG_XYZ' };
    expect(isFeatureEnabled(flagWithoutBeta, undefined)).toBe(false);
  });
});
