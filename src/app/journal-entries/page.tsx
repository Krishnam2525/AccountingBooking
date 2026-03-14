import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/app-store';
import { motion } from 'motion/react';
import { Plus, Filter, Download, FileText, Search } from 'lucide-react';
import { JournalEntryForm } from '@/components/accounting/journal-entry-form';
import { format } from 'date-fns';

const fetchJournalEntries = async (entityId: string) => {
  const res = await fetch('/api/accounting/journal-entries', {
    headers: { 'x-entity-id': entityId }
  });
  if (!res.ok) throw new Error('Failed to fetch journal entries');
  return res.json();
};

export function JournalEntriesPage() {
  const { currentEntity } = useAppStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const entityId = currentEntity?.id || '';

  const { data: entries, isLoading, error } = useQuery({
    queryKey: ['journal-entries', entityId],
    queryFn: () => fetchJournalEntries(entityId),
    enabled: !!entityId
  });

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    if (!searchQuery) return entries;
    const lowerQuery = searchQuery.toLowerCase();
    return entries.filter((entry: any) => 
      entry.description.toLowerCase().includes(lowerQuery) ||
      entry.sourceType.toLowerCase().includes(lowerQuery) ||
      entry.status.toLowerCase().includes(lowerQuery)
    );
  }, [entries, searchQuery]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Journal Entries</h1>
          <p className="text-sm text-zinc-500 mt-1">View and manage manual journal entries and system postings.</p>
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
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Entry
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search journal entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-zinc-500">Loading entries...</div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center text-red-500">Failed to load journal entries.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Source</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredEntries.map((entry: any) => {
                  // Calculate total amount (sum of debits)
                  const totalAmount = entry.lines.reduce((sum: number, line: any) => sum + Number(line.debit), 0);
                  
                  return (
                    <tr key={entry.id} className="hover:bg-zinc-50/50 transition-colors group cursor-pointer">
                      <td className="px-6 py-4 font-medium text-zinc-900 whitespace-nowrap">
                        {format(new Date(entry.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-zinc-700">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-zinc-400" />
                          {entry.description}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700">
                          {entry.sourceType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                          entry.status === 'POSTED' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-zinc-900 font-medium">
                        ${totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-8 h-8 text-zinc-300 mb-3" />
                        <p>{searchQuery ? 'No journal entries found matching your search.' : 'No journal entries found.'}</p>
                        {!searchQuery && (
                          <button 
                            onClick={() => setIsFormOpen(true)}
                            className="mt-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                          >
                            Create your first entry
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <JournalEntryForm onClose={() => setIsFormOpen(false)} />
      )}
    </motion.div>
  );
}
