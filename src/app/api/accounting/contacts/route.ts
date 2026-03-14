import { ContactService } from '@/modules/accounting/services/contact.service';

export async function GET(request: Request) {
  try {
    const entityId = request.headers.get('x-entity-id');
    if (!entityId) return Response.json({ error: 'Missing x-entity-id header' }, { status: 400 });

    const contacts = await ContactService.getContacts(entityId);
    return Response.json(contacts);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const entityId = request.headers.get('x-entity-id');
    if (!entityId) return Response.json({ error: 'Missing x-entity-id header' }, { status: 400 });

    const data = await request.json();
    const contact = await ContactService.createContact(entityId, data);
    return Response.json(contact, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
