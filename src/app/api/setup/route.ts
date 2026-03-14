import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Check if org exists
    let org = await prisma.organization.findFirst();
    
    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: 'Demo Organization',
          entities: {
            create: [
              { name: 'Acme Corp (US)', baseCurrency: 'USD' },
              { name: 'Acme Ltd (UK)', baseCurrency: 'GBP' }
            ]
          }
        },
        include: { entities: true }
      });
    } else {
      // Ensure entities exist
      const entities = await prisma.entity.findMany({ where: { organizationId: org.id } });
      if (entities.length === 0) {
         await prisma.entity.createMany({
           data: [
             { organizationId: org.id, name: 'Acme Corp (US)', baseCurrency: 'USD' },
             { organizationId: org.id, name: 'Acme Ltd (UK)', baseCurrency: 'GBP' }
           ]
         });
      }
    }

    const updatedOrg = await prisma.organization.findFirst({ include: { entities: true }});
    return Response.json(updatedOrg);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
