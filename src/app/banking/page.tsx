import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/app-store';
import { motion } from 'motion/react';
import { Landmark, Plus, ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CreateBankAccountModal } from './create-bank-account-modal';

const fetchBankAccounts = async (entityId: string) => {
  const res = await fetch('/api/accounting/bank-accounts', {
    headers: { 'x-entity-id': entityId }
  });
  if (!res.ok) throw new Error('Failed to fetch bank accounts');
  return res.json();
};

export function BankingPage() {
  const { currentEntity } = useAppStore();
  const entityId = currentEntity?.id || '';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: bankAccounts, isLoading } = useQuery({
    queryKey: ['bank-accounts', entityId],
    queryFn: () => fetchBankAccounts(entityId),
    enabled: !!entityId
  });

  const filteredBankAccounts = useMemo(() => {
    if (!bankAccounts) return [];
    if (!searchQuery) return bankAccounts;
    const lowerQuery = searchQuery.toLowerCase();
    return bankAccounts.filter((account: any) => 
      account.name.toLowerCase().includes(lowerQuery) ||
      account.bankName.toLowerCase().includes(lowerQuery) ||
      (account.accountNumber && account.accountNumber.toLowerCase().includes(lowerQuery))
    );
  }, [bankAccounts, searchQuery]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Banking</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your bank accounts and reconcile transactions.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Bank Account
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full h-64 flex items-center justify-center text-zinc-500">Loading accounts...</div>
        ) : filteredBankAccounts.length === 0 ? (
          <div className="col-span-full bg-white border border-zinc-200 rounded-xl p-12 text-center shadow-sm">
            <Landmark className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 mb-1">
              {searchQuery ? 'No bank accounts found matching your search' : 'No bank accounts'}
            </h3>
            {!searchQuery && (
              <>
                <p className="text-zinc-500 mb-4">Add your first bank account to start reconciling.</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Bank Account
                </button>
              </>
            )}
          </div>
        ) : (
          filteredBankAccounts.map((account: any) => (
            <div key={account.id} className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Landmark className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-full">
                    {account.currency}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900">{account.name}</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  {account.bankName} {account.accountNumber ? `•••• ${account.accountNumber.slice(-4)}` : ''}
                </p>
                <div className="mt-6 pt-6 border-t border-zinc-100">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Statement Balance</p>
                      <p className="text-2xl font-semibold text-zinc-900">$0.00</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500 mb-1">Ledger Balance</p>
                      <p className="text-sm font-medium text-zinc-700">$0.00</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-50 px-6 py-4 border-t border-zinc-200 flex items-center justify-between">
                <span className="text-sm text-zinc-500">0 items to reconcile</span>
                <Link 
                  to={`/banking/${account.id}/reconcile`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Reconcile
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <CreateBankAccountModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        entityId={entityId} 
      />
    </motion.div>
  );
}
