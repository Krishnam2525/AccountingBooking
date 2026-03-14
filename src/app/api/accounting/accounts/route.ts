import { AccountService } from '@/modules/accounting/services/account.service';

export async function GET(request: Request) {
  try {
    // In a real app, entityId comes from the auth context or a validated header
    const entityId = request.headers.get('x-entity-id');
    
    if (!entityId) {
      return Response.json({ error: 'Missing x-entity-id header' }, { status: 400 });
    }

    const accounts = await AccountService.getAccounts(entityId);
    return Response.json(accounts);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const entityId = request.headers.get('x-entity-id');
    
    if (!entityId) {
      return Response.json({ error: 'Missing x-entity-id header' }, { status: 400 });
    }

    const body = await request.json();
    const account = await AccountService.createAccount(entityId, body);
    
    return Response.json(account, { status: 201 });
  } catch (error: any) {
    // Handle Zod validation errors specifically if needed
    return Response.json({ error: error.message }, { status: 400 });
  }
}
