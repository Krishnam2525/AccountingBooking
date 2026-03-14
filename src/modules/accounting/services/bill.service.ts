import { PrismaClient } from '@prisma/client';
import { CreateBillInput, CreateBillSchema } from '../schemas/contacts';
import { toDecimal } from '../../../lib/math';
import { PostingService } from './posting.service';

const prisma = new PrismaClient();

export class BillService {
  static async getBills(entityId: string) {
    return prisma.bill.findMany({
      where: { entityId },
      include: { contact: true, lines: { include: { account: true } } },
      orderBy: { date: 'desc' }
    });
  }

  static async createBill(entityId: string, data: CreateBillInput) {
    const parsed = CreateBillSchema.parse(data);
    
    // Calculate total amount
    const totalAmount = parsed.lines.reduce((sum, line) => {
      return sum.plus(line.quantity.times(line.unitPrice));
    }, toDecimal(0));

    return prisma.bill.create({
      data: {
        entityId,
        contactId: parsed.contactId,
        date: parsed.date,
        dueDate: parsed.dueDate,
        billNumber: parsed.billNumber,
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

  static async authoriseBill(entityId: string, billId: string, userId: string) {
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: { lines: true }
    });

    if (!bill || bill.entityId !== entityId) {
      throw new Error("Bill not found");
    }

    if (bill.status !== 'DRAFT') {
      throw new Error("Only DRAFT bills can be authorised");
    }

    // Find the Accounts Payable account for this entity
    const apAccount = await prisma.account.findFirst({
      where: { entityId, isControl: true, type: 'LIABILITY', code: '2000' } // Assuming 2000 is AP
    });

    if (!apAccount) {
      throw new Error("Accounts Payable control account not found. Please ensure account 2000 exists.");
    }

    // Prepare journal entry lines
    // Credit AP
    const journalLines: any[] = [
      {
        accountId: apAccount.id,
        description: `Bill ${bill.billNumber}`,
        debit: 0,
        credit: bill.totalAmount.toNumber(),
        contactId: bill.contactId
      }
    ];

    // Debit Expense/Asset accounts
    for (const line of bill.lines) {
      journalLines.push({
        accountId: line.accountId,
        description: line.description || `Bill ${bill.billNumber}`,
        debit: line.amount.toNumber(),
        credit: 0,
        contactId: bill.contactId
      });
    }

    // Post the journal entry
    await PostingService.createEntry({
      entityId,
      date: bill.date,
      description: `Bill ${bill.billNumber}`,
      sourceType: 'BILL',
      sourceId: bill.id,
      lines: journalLines
    }, true, userId);

    // Update bill status
    return prisma.bill.update({
      where: { id: billId },
      data: { status: 'AUTHORISED' },
      include: { contact: true, lines: true }
    });
  }
}
