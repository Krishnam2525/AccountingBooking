import { PrismaClient } from '@prisma/client';
import { CreateInvoiceInput, CreateInvoiceSchema } from '../schemas/contacts';
import { toDecimal } from '../../../lib/math';
import { PostingService } from './posting.service';

const prisma = new PrismaClient();

export class InvoiceService {
  static async getInvoices(entityId: string) {
    return prisma.invoice.findMany({
      where: { entityId },
      include: { contact: true, lines: { include: { account: true } } },
      orderBy: { date: 'desc' }
    });
  }

  static async createInvoice(entityId: string, data: CreateInvoiceInput) {
    const parsed = CreateInvoiceSchema.parse(data);
    
    // Calculate total amount
    const totalAmount = parsed.lines.reduce((sum, line) => {
      return sum.plus(line.quantity.times(line.unitPrice));
    }, toDecimal(0));

    return prisma.invoice.create({
      data: {
        entityId,
        contactId: parsed.contactId,
        date: parsed.date,
        dueDate: parsed.dueDate,
        invoiceNumber: parsed.invoiceNumber,
        totalAmount: totalAmount.toNumber(),
        status: 'DRAFT',
        lines: {
          create: parsed.lines.map(line => ({
            accountId: line.accountId,
            description: line.description,
            quantity: line.quantity.toNumber(),
            unitPrice: line.unitPrice.toNumber(),
            amount: line.quantity.times(line.unitPrice).toNumber()
          }))
        }
      },
      include: { contact: true, lines: true }
    });
  }

  static async authoriseInvoice(entityId: string, invoiceId: string, userId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { lines: true }
    });

    if (!invoice || invoice.entityId !== entityId) {
      throw new Error("Invoice not found");
    }

    if (invoice.status !== 'DRAFT') {
      throw new Error("Only DRAFT invoices can be authorised");
    }

    // Find the Accounts Receivable account for this entity
    const arAccount = await prisma.account.findFirst({
      where: { entityId, isControl: true, type: 'ASSET', code: '1200' } // Assuming 1200 is AR
    });

    if (!arAccount) {
      throw new Error("Accounts Receivable control account not found. Please ensure account 1200 exists.");
    }

    // Prepare journal entry lines
    // Debit AR
    const journalLines: any[] = [
      {
        accountId: arAccount.id,
        description: `Invoice ${invoice.invoiceNumber}`,
        debit: invoice.totalAmount.toNumber(),
        credit: 0,
        contactId: invoice.contactId
      }
    ];

    // Credit Revenue accounts
    for (const line of invoice.lines) {
      journalLines.push({
        accountId: line.accountId,
        description: line.description || `Invoice ${invoice.invoiceNumber}`,
        debit: 0,
        credit: line.amount.toNumber(),
        contactId: invoice.contactId
      });
    }

    // Post the journal entry
    await PostingService.createEntry({
      entityId,
      date: invoice.date,
      description: `Invoice ${invoice.invoiceNumber}`,
      sourceType: 'INVOICE',
      sourceId: invoice.id,
      lines: journalLines
    }, true, userId);

    // Update invoice status
    return prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'AUTHORISED' },
      include: { contact: true, lines: true }
    });
  }
}
