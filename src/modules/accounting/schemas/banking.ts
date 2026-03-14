import { z } from 'zod';
import { toDecimal } from '../../../lib/math';

export const CreateBankAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  currency: z.string().default('USD'),
});

export type CreateBankAccountInput = z.input<typeof CreateBankAccountSchema>;

export const CreateBankTransactionSchema = z.object({
  date: z.union([z.string(), z.date()]).transform(val => new Date(val)),
  description: z.string().min(1, 'Description is required'),
  amount: z.union([z.string(), z.number()]).transform(val => toDecimal(val)),
});

export type CreateBankTransactionInput = z.input<typeof CreateBankTransactionSchema>;
