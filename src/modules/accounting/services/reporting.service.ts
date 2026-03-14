import { PrismaClient } from '@prisma/client';
import { toDecimal } from '../../../lib/math';

const prisma = new PrismaClient();

export class ReportingService {
  /**
   * Generates a Trial Balance for a given entity.
   * Calculates the net debit or credit balance for each account based on its normal balance type.
   */
  static async getTrialBalance(entityId: string) {
    // Fetch all accounts for the entity
    const accounts = await prisma.account.findMany({
      where: { entityId },
      orderBy: { code: 'asc' }
    });

    // Fetch all posted journal lines
    const lines = await prisma.journalLine.findMany({
      where: {
        account: { entityId },
        entry: { status: 'POSTED' }
      },
      include: { account: true }
    });

    const tb = accounts.map(acc => {
      const accLines = lines.filter(l => l.accountId === acc.id);
      const totalDebit = accLines.reduce((sum, l) => sum.plus(l.debit), toDecimal(0));
      const totalCredit = accLines.reduce((sum, l) => sum.plus(l.credit), toDecimal(0));

      // Normal balances:
      // ASSET, EXPENSE -> Debit
      // LIABILITY, EQUITY, REVENUE -> Credit
      const isDebitNormal = ['ASSET', 'EXPENSE'].includes(acc.type);
      
      let debitBalance = toDecimal(0);
      let creditBalance = toDecimal(0);

      if (isDebitNormal) {
        const net = totalDebit.minus(totalCredit);
        if (net.isPositive()) debitBalance = net;
        else creditBalance = net.abs();
      } else {
        const net = totalCredit.minus(totalDebit);
        if (net.isPositive()) creditBalance = net;
        else debitBalance = net.abs();
      }

      return {
        accountId: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit: debitBalance.toNumber(),
        credit: creditBalance.toNumber()
      };
    }).filter(row => row.debit !== 0 || row.credit !== 0); // Only show accounts with activity/balance

    const totalDebit = tb.reduce((sum, row) => sum + row.debit, 0);
    const totalCredit = tb.reduce((sum, row) => sum + row.credit, 0);

    return {
      lines: tb,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
    };
  }

  /**
   * Generates a General Ledger report for a specific account.
   * Shows all transactions and a running balance.
   */
  static async getGeneralLedger(entityId: string, accountId: string) {
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account || account.entityId !== entityId) {
      throw new Error("Account not found or does not belong to this entity");
    }

    const lines = await prisma.journalLine.findMany({
      where: {
        accountId,
        entry: { status: 'POSTED' }
      },
      include: { entry: true },
      orderBy: { entry: { date: 'asc' } }
    });

    const isDebitNormal = ['ASSET', 'EXPENSE'].includes(account.type);
    let runningBalance = toDecimal(0);

    const glLines = lines.map(line => {
      const debit = toDecimal(line.debit);
      const credit = toDecimal(line.credit);

      if (isDebitNormal) {
        runningBalance = runningBalance.plus(debit).minus(credit);
      } else {
        runningBalance = runningBalance.plus(credit).minus(debit);
      }

      return {
        id: line.id,
        date: line.entry.date,
        entryId: line.entryId,
        description: line.description || line.entry.description,
        sourceType: line.entry.sourceType,
        debit: debit.toNumber(),
        credit: credit.toNumber(),
        balance: runningBalance.toNumber()
      };
    });

    return {
      account,
      lines: glLines,
      endingBalance: runningBalance.toNumber()
    };
  }
}
