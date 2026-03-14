import { PrismaClient } from '@prisma/client';
import { DEFAULT_CHART_OF_ACCOUNTS } from '../constants/default-coa';
import { CreateAccountSchema, CreateAccountInput } from '../schemas';

const prisma = new PrismaClient();

export class AccountService {
  /**
   * Seeds the default Chart of Accounts for a newly created Entity.
   * Uses skipDuplicates to safely run multiple times without crashing.
   */
  static async seedDefaultAccounts(entityId: string) {
    const accounts = DEFAULT_CHART_OF_ACCOUNTS.map(acc => ({
      ...acc,
      entityId
    }));

    for (const acc of accounts) {
      await prisma.account.upsert({
        where: {
          entityId_code: {
            entityId,
            code: acc.code
          }
        },
        update: {},
        create: acc
      });
    }

    return this.getAccounts(entityId);
  }

  /**
   * Retrieves all accounts for a specific entity, ordered by account code.
   */
  static async getAccounts(entityId: string) {
    return prisma.account.findMany({
      where: { entityId },
      orderBy: { code: 'asc' }
    });
  }

  /**
   * Creates a single custom account for an entity.
   */
  static async createAccount(entityId: string, payload: CreateAccountInput) {
    const parsed = CreateAccountSchema.parse(payload);

    // Check if account code already exists for this entity
    const existing = await prisma.account.findUnique({
      where: {
        entityId_code: {
          entityId,
          code: parsed.code
        }
      }
    });

    if (existing) {
      throw new Error(`Account code ${parsed.code} already exists for this entity.`);
    }

    return prisma.account.create({
      data: {
        entityId,
        ...parsed
      }
    });
  }
}
