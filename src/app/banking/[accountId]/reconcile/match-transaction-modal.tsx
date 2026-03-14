import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/modal';
import { format } from 'date-fns';
import { Search, CheckCircle } from 'lucide-react';

interface MatchTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  entityId: string;
  bankAccountId: string;
}

export function MatchTransactionModal({ isOpen, onClose, transaction, entityId, bankAccountId }: MatchTransactionModalProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: journalEntries, isLoading } = useQuery({
    queryKey: ['journal-entries', entityId],
    queryFn: async () => {
      const res = await fetch('/api/accounting/journal-entries', {
        headers: { 'x-entity-id': entityId }
      });
      if (!res.ok) throw new Error('Failed to fetch journal entries');
      return res.json();
    },
    enabled: isOpen && !!entityId
  });

  const mutation = useMutation({
    mutationFn: async (journalLineId: string) => {
      const res = await fetch(`/api/accounting/bank-accounts/${bankAccountId}/transactions/${transaction.id}/reconcile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-entity-id': entityId,
        },
        body: JSON.stringify({ journalLineId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to reconcile transaction');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions', bankAccountId] });
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message);
    }
  });

  // Flatten journal entries into lines for matching
  const matchableLines = Array.isArray(journalEntries) ? journalEntries.flatMap((entry: any) => 
    entry.lines.map((line: any) => ({
      ...line,
      entryDate: entry.date,
      entryDescription: entry.description,
      entryStatus: entry.status,
      sourceType: entry.sourceType
    }))
  ).filter((line: any) => line.entryStatus === 'POSTED') : [];

  const filteredLines = matchableLines.filter((line: any) => {
    const amount = Number(line.debit) > 0 ? Number(line.debit) : -Number(line.credit);
    const txAmount = Number(transaction?.amount || 0);
    
    // Basic filter: amount must match (or be close) and search query
    const amountMatches = Math.abs(amount - txAmount) < 0.01;
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      return amountMatches && (
        line.entryDescription.toLowerCase().includes(lowerQuery) ||
        line.account.name.toLowerCase().includes(lowerQuery)
      );
    }
    
    return amountMatches;
  });

  if (!transaction) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Match Transaction" maxWidth="max-w-3xl">
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500 mb-1">Bank Transaction</p>
            <p className="font-medium text-zinc-900">{format(new Date(transaction.date), 'MMM d, yyyy')} - {transaction.description}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-500 mb-1">Amount</p>
            <p className={`font-mono font-medium ${transaction.amount > 0 ? 'text-emerald-600' : 'text-zinc-900'}`}>
              ${Math.abs(transaction.amount).toFixed(2)} {transaction.amount > 0 ? 'Received' : 'Spent'}
            </p>
          </div>
        </div>

        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by description or account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="border border-zinc-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium sticky top-0">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Account</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">Loading possible matches...</td>
                  </tr>
                ) : filteredLines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                      No matching ledger entries found for this amount.
                    </td>
                  </tr>
                ) : (
                  filteredLines.map((line: any) => {
                    const amount = Number(line.debit) > 0 ? Number(line.debit) : -Number(line.credit);
                    return (
                      <tr key={line.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-4 py-3 text-zinc-600">{format(new Date(line.entryDate), 'MMM d, yyyy')}</td>
                        <td className="px-4 py-3 font-medium text-zinc-900">{line.account.name}</td>
                        <td className="px-4 py-3 text-zinc-600">{line.entryDescription}</td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-900">
                          ${Math.abs(amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => mutation.mutate(line.id)}
                            disabled={mutation.isPending}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            Match
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t border-zinc-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
