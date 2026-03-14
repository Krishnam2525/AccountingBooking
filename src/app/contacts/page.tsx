import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/app-store';
import { motion } from 'motion/react';
import { Users, Plus, Search } from 'lucide-react';
import { CreateContactModal } from './create-contact-modal';

const fetchContacts = async (entityId: string) => {
  const res = await fetch('/api/accounting/contacts', {
    headers: { 'x-entity-id': entityId }
  });
  if (!res.ok) throw new Error('Failed to fetch contacts');
  return res.json();
};

export function ContactsPage() {
  const { currentEntity } = useAppStore();
  const entityId = currentEntity?.id || '';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts', entityId],
    queryFn: () => fetchContacts(entityId),
    enabled: !!entityId
  });

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    if (!searchQuery) return contacts;
    const lowerQuery = searchQuery.toLowerCase();
    return contacts.filter((c: any) => 
      c.name.toLowerCase().includes(lowerQuery) ||
      (c.email && c.email.toLowerCase().includes(lowerQuery)) ||
      (c.phone && c.phone.toLowerCase().includes(lowerQuery))
    );
  }, [contacts, searchQuery]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Contacts</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your customers and vendors.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Contact
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-zinc-500">Loading contacts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredContacts.map((contact: any) => (
                  <tr key={contact.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900">{contact.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700">
                        {contact.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-600">{contact.email || '-'}</td>
                    <td className="px-6 py-4 text-zinc-600">{contact.phone || '-'}</td>
                  </tr>
                ))}
                {filteredContacts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="w-8 h-8 text-zinc-300 mb-3" />
                        <p>{searchQuery ? 'No contacts found matching your search.' : 'No contacts found.'}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateContactModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        entityId={entityId} 
      />
    </motion.div>
  );
}
