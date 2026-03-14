import { ReportingService } from '@/modules/accounting/services/reporting.service';

export async function GET(request: Request) {
  try {
    const entityId = request.headers.get('x-entity-id');
    
    if (!entityId) {
      return Response.json({ error: 'Missing x-entity-id header' }, { status: 400 });
    }

    const trialBalance = await ReportingService.getTrialBalance(entityId);
    return Response.json(trialBalance);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
