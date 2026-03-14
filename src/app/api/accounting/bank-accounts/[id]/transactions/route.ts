import { BankService } from '@/modules/accounting/services/bank.service';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const transactions = await BankService.getTransactions(params.id);
    return Response.json(transactions);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const transactions = await BankService.addTransactions(params.id, data);
    return Response.json(transactions, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
