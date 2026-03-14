import { ReportingService } from '@/modules/accounting/services/reporting.service';

export async function GET(request: Request) {
  try {
    const entityId = request.headers.get('x-entity-id');
    const url = new URL(request.url);
    const accountId = url.searchParams.get('accountId');
    
    if (!entityId) {
      return Response.json({ error: 'Missing x-entity-id header' }, { status: 400 });
    }

    if (!accountId) {
      return Response.json({ error: 'Missing accountId parameter' }, { status: 400 });
    }

    const generalLedger = await ReportingService.getGeneralLedger(entityId, accountId);
    return Response.json(generalLedger);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
