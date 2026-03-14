import { PostingService } from '@/modules/accounting/services/posting.service';

export async function GET(request: Request) {
  try {
    const entityId = request.headers.get('x-entity-id');
    
    if (!entityId) {
      return Response.json({ error: 'Missing x-entity-id header' }, { status: 400 });
    }

    const entries = await PostingService.getEntries(entityId);
    return Response.json(entries);
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
    
    // Inject entityId into the payload to ensure it matches the context
    const payload = { ...body, entityId };
    
    // Determine if we should post immediately or save as draft
    const postImmediately = body.postImmediately === true;
    
    // In a real app, userId comes from the auth session
    const userId = 'system'; 

    const journalEntry = await PostingService.createEntry(payload, postImmediately, userId);
    
    return Response.json(journalEntry, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
