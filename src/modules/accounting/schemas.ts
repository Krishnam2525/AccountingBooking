import { z } from 'zod';
import { toDecimal } from '../../lib/math';
import { AccountType } from '@prisma/client';

/**
 * Schema for creating a new Account.
 */
export const CreateAccountSchema = z.object({
  code: z.string().min(1, 'Account code is required').max(20),
  name: z.string().min(1, 'Account name is required').max(255),
  type: z.nativeEnum(AccountType),
  isControl: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type CreateAccountInput = z.input<typeof CreateAccountSchema>;

/**
 * Schema for a single line in a journal entry.
 * Validates that a line cannot have both a debit and a credit.
 */
export const JournalLineSchema = z.object({
  accountId: z.string().cuid('Invalid Account ID'),
  description: z.string().optional(),
  debit: z.union([z.string(), z.number()]).transform(val => toDecimal(val)),
  credit: z.union([z.string(), z.number()]).transform(val => toDecimal(val)),
  contactId: z.string().cuid('Invalid Contact ID').optional(),
}).refine(data => {
  const hasDebit = !data.debit.isZero();
  const hasCredit = !data.credit.isZero();
  
  // A line must have either a debit or a credit, but not both.
  // (Technically it could have neither if it's a 0-value line, but we reject both being > 0)
  return !(hasDebit && hasCredit);
}, {
  message: "A single journal line cannot have both a debit and a credit.",
  path: ["debit"] // Attach error to debit field
});

/**
 * Schema for a complete journal entry.
 * Validates that there are at least two lines.
 */
export const JournalEntrySchema = z.object({
  entityId: z.string().cuid('Invalid Entity ID'),
  date: z.union([z.string(), z.date()]).transform(val => new Date(val)),
  description: z.string().min(1, 'Description is required'),
  sourceType: z.string().min(1, 'Source type is required'),
  sourceId: z.string().optional(),
  lines: z.array(JournalLineSchema).min(2, "A journal entry must have at least two lines."),
});

export type CreateJournalEntryInput = z.input<typeof JournalEntrySchema>;
export type ParsedJournalEntry = z.output<typeof JournalEntrySchema>;
