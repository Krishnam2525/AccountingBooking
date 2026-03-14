import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/app-store';
import { motion } from 'motion/react';
import { FileText, Plus, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const fetchBills = async (entityId: string) => {
  const res = await fetch('/api/accounting/bills', {
    headers: { 'x-entity-id': entityId }
  });
  if (!res.ok) throw new Error('Failed to fetch bills');
  return res.json();
};

const authoriseBill = async ({ entityId, billId }: { entityId: string, billId: string }) => {
  const res = await fetch(`/api/accounting/bills/${billId}/authorise`, {
    method: 'POST',
    headers: { 'x-entity-id': entityId }
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to authorise bill');
  }
  return res.json();
};

export function PurchasesPage() {
  const { currentEntity } = useAppStore();
  const entityId = currentEntity?.id || '';
  const queryClient = useQueryClient();

  const { data: bills, isLoading } = useQuery({
    queryKey: ['bills', entityId],
    queryFn: () => fetchBills(entityId),
    enabled: !!entityId
  });

  const authoriseMutation = useMutation({
    mutationFn: authoriseBill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills', entityId] });
    },
    onError: (error: Error) => {
      alert(error.message);
    }
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Purchases Bills</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your accounts payable.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          New Bill
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-zinc-500">Loading bills...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Number</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {bills?.map((bill: any) => (
                  <tr key={bill.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900">{bill.billNumber}</td>
                    <td className="px-6 py-4 text-zinc-700">{bill.contact.name}</td>
                    <td className="px-6 py-4 text-zinc-600">{format(new Date(bill.date), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 text-zinc-600">{format(new Date(bill.dueDate), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        bill.status === 'AUTHORISED' ? 'bg-emerald-100 text-emerald-700' :
                        bill.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' :
                        'bg-zinc-100 text-zinc-700'
                      }`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-zinc-900">
                      ${bill.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {bill.status === 'DRAFT' && (
                        <button 
                          onClick={() => authoriseMutation.mutate({ entityId, billId: bill.id })}
                          disabled={authoriseMutation.isPending}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-xs flex items-center justify-end gap-1 ml-auto"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Authorise
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {(!bills || bills.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-8 h-8 text-zinc-300 mb-3" />
                        <p>No bills found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
