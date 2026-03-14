import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '@/store/app-store';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { MatchTransactionModal } from './match-transaction-modal';

const fetchTransactions = async (bankAccountId: string) => {
  const res = await fetch(`/api/accounting/bank-accounts/${bankAccountId}/transactions`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
};

export function ReconcilePage() {
  const { accountId } = useParams();
  const { currentEntity } = useAppStore();
  const entityId = currentEntity?.id || '';
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['bank-transactions', accountId],
    queryFn: () => fetchTransactions(accountId!),
    enabled: !!accountId
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Link to="/banking" className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-zinc-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Reconcile</h1>
          <p className="text-sm text-zinc-500 mt-1">Match bank statement lines with ledger transactions.</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-zinc-500">Loading transactions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Spent</th>
                  <th className="px-6 py-3 text-right">Received</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {Array.isArray(transactions) && transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 text-zinc-600">{format(new Date(tx.date), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 font-medium text-zinc-900">{tx.description}</td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-600">
                      {tx.amount < 0 ? Math.abs(tx.amount).toFixed(2) : ''}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-600">
                      {tx.amount > 0 ? tx.amount.toFixed(2) : ''}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        tx.status === 'RECONCILED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {tx.status === 'UNRECONCILED' ? (
                        <button 
                          onClick={() => setSelectedTransaction(tx)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-xs"
                        >
                          Find Match
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Matched
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {(!Array.isArray(transactions) || transactions.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      <p>No transactions to reconcile. Import a bank statement to get started.</p>
                      <button className="mt-4 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors">
                        Import Statement
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTransaction && (
        <MatchTransactionModal
          isOpen={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          transaction={selectedTransaction}
          entityId={entityId}
          bankAccountId={accountId!}
        />
      )}
    </motion.div>
  );
}
