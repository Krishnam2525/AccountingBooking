import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Building2, 
  Settings, 
  Package, 
  FileText,
  Landmark
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';

const NAV_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'Chart of Accounts', icon: BookOpen, href: '/accounts' },
  { name: 'Journal Entries', icon: FileText, href: '/journal-entries' },
  { name: 'Banking', icon: Landmark, href: '/banking' },
  { name: 'Sales', icon: Users, href: '/sales' },
  { name: 'Purchases', icon: Building2, href: '/purchases' },
  { name: 'Inventory', icon: Package, href: '/inventory' },
  { name: 'Reports', icon: FileText, href: '/reports' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const { sidebarOpen } = useAppStore();

  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: sidebarOpen ? 240 : 64,
        opacity: 1
      }}
      className="h-screen bg-zinc-950 text-zinc-300 flex flex-col border-r border-zinc-800 flex-shrink-0 overflow-hidden"
    >
      <div className="h-14 flex items-center px-4 border-b border-zinc-800">
        <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg">A</span>
        </div>
        {sidebarOpen && (
          <span className="ml-3 font-semibold text-zinc-100 whitespace-nowrap">
            LedgerPro
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) => cn(
              "flex items-center h-10 px-2 rounded-md hover:bg-zinc-800 hover:text-white transition-colors group cursor-pointer",
              isActive && "bg-zinc-800 text-white"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && (
              <span className="ml-3 text-sm font-medium whitespace-nowrap">
                {item.name}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </motion.aside>
  );
}
