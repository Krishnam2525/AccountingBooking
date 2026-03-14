import { describe, it, expect } from 'vitest';
import { CreateAccountSchema } from '../../modules/accounting/schemas';
import { AccountType } from '@prisma/client';
import { DEFAULT_CHART_OF_ACCOUNTS } from '../../modules/accounting/constants/default-coa';

describe('Chart of Accounts', () => {
  it('should have a valid default chart of accounts', () => {
    expect(DEFAULT_CHART_OF_ACCOUNTS.length).toBeGreaterThan(10);
    
    // Verify specific control accounts exist
    const arAccount = DEFAULT_CHART_OF_ACCOUNTS.find(a => a.code === '1200');
    expect(arAccount).toBeDefined();
    expect(arAccount?.isControl).toBe(true);
    expect(arAccount?.type).toBe(AccountType.ASSET);

    const apAccount = DEFAULT_CHART_OF_ACCOUNTS.find(a => a.code === '2000');
    expect(apAccount).toBeDefined();
    expect(apAccount?.isControl).toBe(true);
    expect(apAccount?.type).toBe(AccountType.LIABILITY);
  });
});

describe('Account Schema Validation', () => {
  it('should parse a valid account payload', () => {
    const payload = {
      code: '1010',
      name: 'Petty Cash',
      type: AccountType.ASSET,
      isControl: false,
    };

    const result = CreateAccountSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should reject an account without a code', () => {
    const payload = {
      code: '',
      name: 'Petty Cash',
      type: AccountType.ASSET,
    };

    const result = CreateAccountSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Account code is required');
    }
  });

  it('should reject an invalid account type', () => {
    const payload = {
      code: '1010',
      name: 'Petty Cash',
      type: 'INVALID_TYPE',
    };

    const result = CreateAccountSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
