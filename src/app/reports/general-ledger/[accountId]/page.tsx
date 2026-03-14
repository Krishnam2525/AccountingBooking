import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/app-store';
import { motion } from 'motion/react';
import { FileText, Download, ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';

const fetchGeneralLedger = async (entityId: string, accountId: string) => {
  const res = await fetch(`/api/accounting/reports/general-ledger?accountId=${accountId}`, {
    headers: { 'x-entity-id': entityId }
  });
  if (!res.ok) throw new Error('Failed to fetch general ledger');
  return res.json();
};

export function GeneralLedgerPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const { currentEntity } = useAppStore();
  const entityId = currentEntity?.id || '';

  const { data: gl, isLoading, error } = useQuery({
    queryKey: ['general-ledger', entityId, accountId],
    queryFn: () => fetchGeneralLedger(entityId, accountId!),
    enabled: !!entityId && !!accountId
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
          <div className="flex items-center gap-2 mb-2">
            <Link to="/reports" className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Trial Balance
            </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {gl?.account ? `${gl.account.code} - ${gl.account.name}` : 'General Ledger'}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {gl?.account ? `Account Type: ${gl.account.type}` : 'Transaction history for account.'}
          </p>
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
          <div className="h-64 flex items-center justify-center text-red-500">Failed to load general ledger.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Source</th>
                  <th className="px-6 py-3 text-right">Debit</th>
                  <th className="px-6 py-3 text-right">Credit</th>
                  <th className="px-6 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {Array.isArray(gl?.lines) && gl.lines.map((row: any) => (
                  <tr key={row.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900 whitespace-nowrap">
                      {format(new Date(row.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-zinc-700">{row.description}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700">
                        {row.sourceType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-900">
                      {row.debit > 0 ? `$${row.debit.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-900">
                      {row.credit > 0 ? `$${row.credit.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-zinc-900">
                      ${row.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {(!Array.isArray(gl?.lines) || gl.lines.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-8 h-8 text-zinc-300 mb-3" />
                        <p>No transactions found for this account.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              {gl?.lines && gl.lines.length > 0 && (
                <tfoot className="bg-zinc-50 border-t border-zinc-200 font-medium">
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-right text-zinc-700">Ending Balance</td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-900">
                      ${gl.endingBalance.toFixed(2)}
                    </td>
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
