import { InvoiceService } from '@/modules/accounting/services/invoice.service';

export async function GET(request: Request) {
  try {
    const entityId = request.headers.get('x-entity-id');
    if (!entityId) return Response.json({ error: 'Missing x-entity-id header' }, { status: 400 });

    const invoices = await InvoiceService.getInvoices(entityId);
    return Response.json(invoices);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const entityId = request.headers.get('x-entity-id');
    if (!entityId) return Response.json({ error: 'Missing x-entity-id header' }, { status: 400 });

    const data = await request.json();
    const invoice = await InvoiceService.createInvoice(entityId, data);
    return Response.json(invoice, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
