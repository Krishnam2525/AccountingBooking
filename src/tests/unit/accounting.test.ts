import { describe, it, expect } from 'vitest';
import { toDecimal, isEqual, isZero } from '../../lib/math';
import { JournalEntrySchema } from '../../modules/accounting/schemas';
import { PostingService } from '../../modules/accounting/services/posting.service';

describe('Math Utility (decimal.js wrapper)', () => {
  it('should prevent float precision errors', () => {
    // Standard JS float error: 0.1 + 0.2 = 0.30000000000000004
    const a = toDecimal(0.1);
    const b = toDecimal(0.2);
    const sum = a.plus(b);
    
    expect(sum.toString()).toBe('0.3');
    expect(isEqual(sum, '0.3')).toBe(true);
  });

  it('should correctly identify zero', () => {
    expect(isZero(0)).toBe(true);
    expect(isZero('0.00')).toBe(true);
    expect(isZero(toDecimal(0))).toBe(true);
    expect(isZero(0.01)).toBe(false);
  });
});

describe('Journal Entry Schema Validation', () => {
  const validPayload = {
    entityId: 'cm0abc1230000xyz',
    date: new Date(),
    description: 'Office Supplies',
    sourceType: 'MANUAL',
    lines: [
      {
        accountId: 'cm0def4560000xyz',
        debit: '100.50',
        credit: 0,
      },
      {
        accountId: 'cm0ghi7890000xyz',
        debit: 0,
        credit: '100.50',
      }
    ]
  };

  it('should parse a valid balanced entry', () => {
    const result = JournalEntrySchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lines[0].debit.toString()).toBe('100.5');
    }
  });

  it('should reject a line with both debit and credit', () => {
    const invalidPayload = {
      ...validPayload,
      lines: [
        {
          accountId: 'cm0def4560000xyz',
          debit: '100.50',
          credit: '50.00', // Invalid: both > 0
        },
        {
          accountId: 'cm0ghi7890000xyz',
          debit: 0,
          credit: '150.50',
        }
      ]
    };

    const result = JournalEntrySchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('cannot have both a debit and a credit');
    }
  });
});

describe('Posting Service Balance Validation', () => {
  it('should pass a balanced entry', () => {
    const lines = [
      { accountId: '1', debit: toDecimal('150.25'), credit: toDecimal(0) },
      { accountId: '2', debit: toDecimal(0), credit: toDecimal('100.00') },
      { accountId: '3', debit: toDecimal(0), credit: toDecimal('50.25') },
    ];

    expect(() => PostingService.validateBalance(lines as any)).not.toThrow();
  });

  it('should throw on an unbalanced entry', () => {
    const lines = [
      { accountId: '1', debit: toDecimal('150.25'), credit: toDecimal(0) },
      { accountId: '2', debit: toDecimal(0), credit: toDecimal('100.00') },
      { accountId: '3', debit: toDecimal(0), credit: toDecimal('50.20') }, // Off by 0.05
    ];

    expect(() => PostingService.validateBalance(lines as any)).toThrow(/Unbalanced journal entry/);
  });
});
