import { BankService } from '@/modules/accounting/services/bank.service';

export async function POST(request: Request, { params }: { params: { id: string, transactionId: string } }) {
  try {
    const { journalLineId } = await request.json();
    if (!journalLineId) return Response.json({ error: 'Missing journalLineId' }, { status: 400 });
    
    const transaction = await BankService.reconcileTransaction(params.transactionId, journalLineId);
    return Response.json(transaction);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
