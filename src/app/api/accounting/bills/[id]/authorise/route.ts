import { BillService } from '@/modules/accounting/services/bill.service';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const entityId = request.headers.get('x-entity-id');
    if (!entityId) return Response.json({ error: 'Missing x-entity-id header' }, { status: 400 });

    const bill = await BillService.authoriseBill(entityId, params.id, 'system-user');
    return Response.json(bill);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
