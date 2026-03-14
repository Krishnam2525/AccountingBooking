import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/app-store';
import { motion } from 'motion/react';
import { FileText, Download, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const fetchTrialBalance = async (entityId: string) => {
  const res = await fetch('/api/accounting/reports/trial-balance', {
    headers: { 'x-entity-id': entityId }
  });
  if (!res.ok) throw new Error('Failed to fetch trial balance');
  return res.json();
};

export function ReportsPage() {
  const { currentEntity } = useAppStore();
  const entityId = currentEntity?.id || '';

  const { data: tb, isLoading, error } = useQuery({
    queryKey: ['trial-balance', entityId],
    queryFn: () => fetchTrialBalance(entityId),
    enabled: !!entityId
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Trial Balance</h1>
          <p className="text-sm text-zinc-500 mt-1">Verify that total debits equal total credits.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center gap-2 shadow-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-zinc-500">Loading report...</div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center text-red-500">Failed to load trial balance.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Account Code</th>
                  <th className="px-6 py-3">Account Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3 text-right">Debit</th>
                  <th className="px-6 py-3 text-right">Credit</th>
                  <th className="px-6 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {tb?.lines?.map((row: any) => (
                  <tr key={row.accountId} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-zinc-900">{row.code}</td>
                    <td className="px-6 py-4 font-medium text-zinc-900">{row.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700">
                        {row.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-900">
                      {row.debit > 0 ? `$${row.debit.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-900">
                      {row.credit > 0 ? `$${row.credit.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link 
                        to={`/reports/general-ledger/${row.accountId}`}
                        className="text-zinc-400 hover:text-indigo-600 transition-colors inline-flex items-center justify-center"
                        title="View General Ledger"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!tb?.lines || tb.lines.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-8 h-8 text-zinc-300 mb-3" />
                        <p>No account activity found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              {tb?.lines && tb.lines.length > 0 && (
                <tfoot className="bg-zinc-50 border-t border-zinc-200 font-medium">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-right text-zinc-700">Totals</td>
                    <td className={`px-6 py-4 text-right font-mono ${tb.isBalanced ? 'text-zinc-900' : 'text-red-600'}`}>
                      ${tb.totalDebit.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 text-right font-mono ${tb.isBalanced ? 'text-zinc-900' : 'text-red-600'}`}>
                      ${tb.totalCredit.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
