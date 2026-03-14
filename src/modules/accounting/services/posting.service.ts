import { PrismaClient, EntryStatus } from '@prisma/client';
import { JournalEntrySchema, CreateJournalEntryInput, ParsedJournalEntry } from '../schemas';
import { toDecimal, isEqual } from '../../../lib/math';

// In a real app, this would be injected or instantiated per request context
const prisma = new PrismaClient();

export class PostingService {
  /**
   * Creates a new Journal Entry.
   * If postImmediately is true, it strictly validates that Debits == Credits.
   * If false, it saves the entry as DRAFT.
   */
  static async createEntry(payload: CreateJournalEntryInput, postImmediately: boolean = false, userId: string = 'system') {
    // 1. Validate schema and transform to Decimal objects
    const parsed = JournalEntrySchema.parse(payload);

    // 2. If posting, validate accounting rules
    if (postImmediately) {
      this.validateBalance(parsed.lines);
      await this.validateControlAccounts(parsed.lines);
      await this.validatePeriodLock(parsed.entityId, parsed.date);
    }

    // 3. Persist to database within a transaction
    return await prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          entityId: parsed.entityId,
          date: parsed.date,
          description: parsed.description,
          sourceType: parsed.sourceType,
          sourceId: parsed.sourceId,
          status: postImmediately ? EntryStatus.POSTED : EntryStatus.DRAFT,
          createdBy: userId,
          lines: {
            create: parsed.lines.map(line => ({
              accountId: line.accountId,
              description: line.description,
              // Prisma Decimal accepts strings, which prevents float precision loss
              debit: line.debit.toString(),
              credit: line.credit.toString(),
              contactId: line.contactId,
            }))
          }
        },
        include: { lines: true }
      });

      return entry;
    });
  }

  /**
   * Retrieves journal entries for an entity.
   */
  static async getEntries(entityId: string) {
    return prisma.journalEntry.findMany({
      where: { entityId },
      include: {
        lines: {
          include: {
            account: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
  }
  static validateBalance(lines: ParsedJournalEntry['lines']) {
    let totalDebit = toDecimal(0);
    let totalCredit = toDecimal(0);

    for (const line of lines) {
      totalDebit = totalDebit.plus(line.debit);
      totalCredit = totalCredit.plus(line.credit);
    }

    if (!isEqual(totalDebit, totalCredit)) {
      throw new Error(`Unbalanced journal entry. Debits: ${totalDebit.toString()}, Credits: ${totalCredit.toString()}`);
    }
  }

  /**
   * Validates that manual entries do not hit control accounts directly.
   */
  private static async validateControlAccounts(lines: ParsedJournalEntry['lines']) {
    const accountIds = lines.map(l => l.accountId);
    
    // Fetch accounts to check their isControl flag
    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, isControl: true, code: true }
    });

    const controlAccountsHit = accounts.filter(a => a.isControl);
    
    // If this service is called directly for a manual journal, we reject control accounts.
    // In a full implementation, we would check the sourceType (e.g., if sourceType === 'MANUAL').
    // For now, we stub this logic.
    if (controlAccountsHit.length > 0) {
      // throw new Error(`Cannot post directly to control accounts: ${controlAccountsHit.map(a => a.code).join(', ')}`);
    }
  }

  /**
   * Validates that the accounting period is open for the given date.
   */
  private static async validatePeriodLock(entityId: string, date: Date) {
    // Stub: In a real app, query the PeriodLock table to ensure the date is not in a closed period.
    // if (isPeriodClosed(entityId, date)) throw new Error("Accounting period is closed.");
  }
}
