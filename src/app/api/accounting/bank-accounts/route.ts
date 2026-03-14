import { BankService } from '@/modules/accounting/services/bank.service';

export async function GET(request: Request) {
  try {
    const entityId = request.headers.get('x-entity-id');
    if (!entityId) return Response.json({ error: 'Missing x-entity-id header' }, { status: 400 });

    const bankAccounts = await BankService.getBankAccounts(entityId);
    return Response.json(bankAccounts);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const entityId = request.headers.get('x-entity-id');
    if (!entityId) return Response.json({ error: 'Missing x-entity-id header' }, { status: 400 });

    const data = await request.json();
    const bankAccount = await BankService.createBankAccount(entityId, data);
    return Response.json(bankAccount, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
