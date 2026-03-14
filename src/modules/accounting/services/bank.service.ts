import { PrismaClient } from '@prisma/client';
import { CreateBankAccountInput, CreateBankAccountSchema, CreateBankTransactionInput, CreateBankTransactionSchema } from '../schemas/banking';

const prisma = new PrismaClient();

export class BankService {
  static async getBankAccounts(entityId: string) {
    return prisma.bankAccount.findMany({
      where: { entityId },
      include: { account: true },
      orderBy: { name: 'asc' }
    });
  }

  static async createBankAccount(entityId: string, data: CreateBankAccountInput) {
    const parsed = CreateBankAccountSchema.parse(data);
    
    return prisma.$transaction(async (tx) => {
      // 1. Create a new GL Account for this bank account
      // Find the next available code in the 1000 range (Assets)
      const existingAccounts = await tx.account.findMany({
        where: { entityId, type: 'ASSET', code: { startsWith: '10' } },
        orderBy: { code: 'desc' },
        take: 1
      });
      
      let nextCode = '1000';
      if (existingAccounts.length > 0) {
        nextCode = (parseInt(existingAccounts[0].code, 10) + 1).toString();
      }

      const glAccount = await tx.account.create({
        data: {
          entityId,
          name: parsed.name,
          code: nextCode,
          type: 'ASSET',
          isControl: true, // Bank accounts are control accounts
        }
      });

      // 2. Create the Bank Account record
      return tx.bankAccount.create({
        data: {
          entityId,
          accountId: glAccount.id,
          name: parsed.name,
          accountNumber: parsed.accountNumber,
          bankName: parsed.bankName,
          currency: parsed.currency,
        },
        include: { account: true }
      });
    });
  }

  static async getTransactions(bankAccountId: string) {
    return prisma.bankTransaction.findMany({
      where: { bankAccountId },
      include: { matchedLine: true },
      orderBy: { date: 'desc' }
    });
  }

  static async addTransactions(bankAccountId: string, transactions: CreateBankTransactionInput[]) {
    const parsed = transactions.map(t => CreateBankTransactionSchema.parse(t));
    
    return prisma.bankTransaction.createMany({
      data: parsed.map(t => ({
        bankAccountId,
        date: t.date,
        description: t.description,
        amount: t.amount.toNumber(),
        status: 'UNRECONCILED'
      }))
    });
  }

  static async reconcileTransaction(transactionId: string, journalLineId: string) {
    return prisma.$transaction(async (tx) => {
      const transaction = await tx.bankTransaction.findUnique({ where: { id: transactionId } });
      if (!transaction) throw new Error("Transaction not found");
      if (transaction.status === 'RECONCILED') throw new Error("Transaction already reconciled");

      const line = await tx.journalLine.findUnique({ where: { id: journalLineId } });
      if (!line) throw new Error("Journal line not found");

      // In a real app, we'd validate amounts match exactly or within tolerance
      
      return tx.bankTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'RECONCILED',
          matchedLineId: journalLineId
        }
      });
    });
  }
}
