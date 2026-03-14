import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/app-store';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText, 
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { currentEntity } = useAppStore();
  const entityId = currentEntity?.id || '';

  const { data: accounts } = useQuery({
    queryKey: ['accounts', entityId],
    queryFn: async () => {
      const res = await fetch('/api/accounting/accounts', {
        headers: { 'x-entity-id': entityId }
      });
      if (!res.ok) throw new Error('Failed to fetch accounts');
      return res.json();
    },
    enabled: !!entityId
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices', entityId],
    queryFn: async () => {
      const res = await fetch('/api/accounting/invoices', {
        headers: { 'x-entity-id': entityId }
      });
      if (!res.ok) throw new Error('Failed to fetch invoices');
      return res.json();
    },
    enabled: !!entityId
  });

  const { data: bills } = useQuery({
    queryKey: ['bills', entityId],
    queryFn: async () => {
      const res = await fetch('/api/accounting/bills', {
        headers: { 'x-entity-id': entityId }
      });
      if (!res.ok) throw new Error('Failed to fetch bills');
      return res.json();
    },
    enabled: !!entityId
  });

  const { data: bankAccounts } = useQuery({
    queryKey: ['bank-accounts', entityId],
    queryFn: async () => {
      const res = await fetch('/api/accounting/bank-accounts', {
        headers: { 'x-entity-id': entityId }
      });
      if (!res.ok) throw new Error('Failed to fetch bank accounts');
      return res.json();
    },
    enabled: !!entityId
  });

  // Calculate some basic metrics
  const totalReceivables = Array.isArray(invoices) ? invoices.filter((i: any) => i.status === 'AUTHORISED').reduce((sum: number, i: any) => sum + i.totalAmount, 0) : 0;
  const totalPayables = Array.isArray(bills) ? bills.filter((b: any) => b.status === 'AUTHORISED').reduce((sum: number, b: any) => sum + b.totalAmount, 0) : 0;
  const totalCash = Array.isArray(bankAccounts) ? bankAccounts.reduce((sum: number, b: any) => sum + b.account.balance, 0) : 0;

  const statCards = [
    {
      title: 'Total Cash',
      value: `$${totalCash.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      link: '/banking'
    },
    {
      title: 'Accounts Receivable',
      value: `$${totalReceivables.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      link: '/sales'
    },
    {
      title: 'Accounts Payable',
      value: `$${totalPayables.toFixed(2)}`,
      icon: TrendingDown,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
      link: '/purchases'
    }
  ];

  const quickLinks = [
    { name: 'Chart of Accounts', icon: FileText, path: '/accounts' },
    { name: 'Journal Entries', icon: FileText, path: '/journal-entries' },
    { name: 'Contacts', icon: Users, path: '/contacts' },
    { name: 'Banking', icon: CreditCard, path: '/banking' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Overview of your financial status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <h3 className="text-zinc-500 text-sm font-medium">{stat.title}</h3>
              <p className="text-3xl font-semibold text-zinc-900 mt-1">{stat.value}</p>
              <div className="mt-auto pt-4">
                <Link to={stat.link} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1">
                  View Details <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
            <h3 className="font-medium text-zinc-900">Recent Invoices</h3>
          </div>
          <div className="divide-y divide-zinc-100">
            {Array.isArray(invoices) && invoices.slice(0, 5).map((invoice: any) => (
              <div key={invoice.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                <div>
                  <p className="font-medium text-zinc-900">{invoice.contact.name}</p>
                  <p className="text-sm text-zinc-500">{invoice.invoiceNumber} • {new Date(invoice.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-zinc-900">${invoice.totalAmount.toFixed(2)}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    invoice.status === 'AUTHORISED' ? 'bg-emerald-100 text-emerald-700' :
                    invoice.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' :
                    'bg-zinc-100 text-zinc-700'
                  }`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
            {(!Array.isArray(invoices) || invoices.length === 0) && (
              <div className="px-6 py-8 text-center text-zinc-500 text-sm">
                No recent invoices
              </div>
            )}
          </div>
          <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50 text-center">
            <Link to="/sales" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              View All Invoices
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
            <h3 className="font-medium text-zinc-900">Quick Links</h3>
          </div>
          <div className="grid grid-cols-2 gap-px bg-zinc-100">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <Link 
                  key={index} 
                  to={link.path}
                  className="bg-white p-6 hover:bg-zinc-50 transition-colors flex flex-col items-center justify-center text-center gap-3 group"
                >
                  <div className="p-3 rounded-full bg-zinc-100 text-zinc-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-medium text-zinc-900">{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
