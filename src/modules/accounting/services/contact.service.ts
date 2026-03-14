import { PrismaClient } from '@prisma/client';
import { CreateContactInput, CreateContactSchema } from '../schemas/contacts';

const prisma = new PrismaClient();

export class ContactService {
  static async getContacts(entityId: string) {
    return prisma.contact.findMany({
      where: { entityId },
      orderBy: { name: 'asc' }
    });
  }

  static async createContact(entityId: string, data: CreateContactInput) {
    const parsed = CreateContactSchema.parse(data);
    return prisma.contact.create({
      data: {
        ...parsed,
        entityId
      }
    });
  }
}
