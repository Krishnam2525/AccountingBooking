import { z } from 'zod';
import { ContactType, DocumentStatus } from '@prisma/client';
import { toDecimal } from '../../../lib/math';

export const CreateContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  type: z.nativeEnum(ContactType),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
});

export type CreateContactInput = z.input<typeof CreateContactSchema>;

export const InvoiceLineSchema = z.object({
  accountId: z.string().cuid('Invalid Account ID'),
  description: z.string().optional(),
  quantity: z.union([z.string(), z.number()]).transform(val => toDecimal(val)),
  unitPrice: z.union([z.string(), z.number()]).transform(val => toDecimal(val)),
});

export const CreateInvoiceSchema = z.object({
  contactId: z.string().cuid('Invalid Contact ID'),
  date: z.union([z.string(), z.date()]).transform(val => new Date(val)),
  dueDate: z.union([z.string(), z.date()]).transform(val => new Date(val)),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  lines: z.array(InvoiceLineSchema).min(1, 'At least one line is required'),
});

export type CreateInvoiceInput = z.input<typeof CreateInvoiceSchema>;

export const CreateBillSchema = z.object({
  contactId: z.string().cuid('Invalid Contact ID'),
  date: z.union([z.string(), z.date()]).transform(val => new Date(val)),
  dueDate: z.union([z.string(), z.date()]).transform(val => new Date(val)),
  billNumber: z.string().min(1, 'Bill number is required'),
  lines: z.array(InvoiceLineSchema).min(1, 'At least one line is required'),
});

export type CreateBillInput = z.input<typeof CreateBillSchema>;
