import { InvoiceService } from '@/modules/accounting/services/invoice.service';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const entityId = request.headers.get('x-entity-id');
    if (!entityId) return Response.json({ error: 'Missing x-entity-id header' }, { status: 400 });

    const invoice = await InvoiceService.authoriseInvoice(entityId, params.id, 'system-user');
    return Response.json(invoice);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
