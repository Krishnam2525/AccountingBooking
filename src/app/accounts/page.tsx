import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AccountType } from '@prisma/client';
import { useAppStore } from '@/store/app-store';
import { motion } from 'motion/react';
import { Plus, Filter, Download, Database } from 'lucide-react';

// Mock data fetcher until we wire up the backend fully
const fetchAccounts = async (entityId: string) => {
  const res = await fetch('/api/accounting/accounts', {
    headers: { 'x-entity-id': entityId }
  });
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
};

const seedAccounts = async (entityId: string) => {
  const res = await fetch('/api/accounting/accounts/seed', {
    method: 'POST',
    headers: { 'x-entity-id': entityId }
  });
  if (!res.ok) throw new Error('Failed to seed accounts');
  return res.json();
};

export function ChartOfAccountsPage() {
  const { currentEntity } = useAppStore();
  const queryClient = useQueryClient();
  
  // Hardcoded entity ID for Phase 1 testing
  const entityId = currentEntity?.id || 'cm0testentity123';

  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['accounts', entityId],
    queryFn: () => fetchAccounts(entityId),
  });

  const seedMutation = useMutation({
    mutationFn: () => seedAccounts(entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', entityId] });
    }
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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Chart of Accounts</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your general ledger accounts and balances.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center gap-2 shadow-sm">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center gap-2 shadow-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button 
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            {seedMutation.isPending ? 'Seeding...' : 'Seed Default'}
          </button>
          <button className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            New Account
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-zinc-500">Loading accounts...</div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center text-red-500">Failed to load accounts. Ensure the database is seeded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Control Account</th>
                  <th className="px-6 py-3 text-right">YTD Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {accounts?.map((account: any) => (
                  <tr key={account.id} className="hover:bg-zinc-50/50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 font-mono text-zinc-600">{account.code}</td>
                    <td className="px-6 py-4 font-medium text-zinc-900">{account.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700">
                        {account.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {account.isControl ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          System Locked
                        </span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-600">
                      $0.00
                    </td>
                  </tr>
                ))}
                {(!accounts || accounts.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      No accounts found. Run the seeder to populate the default chart.
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
