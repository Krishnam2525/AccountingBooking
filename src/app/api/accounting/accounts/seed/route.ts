import { AccountService } from '@/modules/accounting/services/account.service';

export async function POST(request: Request) {
  try {
    const entityId = request.headers.get('x-entity-id');
    
    if (!entityId) {
      return Response.json({ error: 'Missing x-entity-id header' }, { status: 400 });
    }

    const accounts = await AccountService.seedDefaultAccounts(entityId);
    return Response.json(accounts, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
