import { Menu, Bell, Search, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store/app-store';

export function Topbar() {
  const { toggleSidebar, currentEntity, availableEntities, setCurrentEntity } = useAppStore();

  return (
    <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-zinc-100 rounded-md text-zinc-600 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Entity Switcher */}
        <div className="relative group">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-md border border-zinc-200 cursor-pointer hover:bg-zinc-100 transition-colors">
            <div className="w-5 h-5 bg-zinc-800 rounded text-white flex items-center justify-center text-xs font-bold">
              {currentEntity?.name?.charAt(0) || 'A'}
            </div>
            <span className="text-sm font-medium text-zinc-700">
              {currentEntity?.name || 'Loading...'}
            </span>
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          </div>
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-zinc-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="py-1">
              {availableEntities.map(entity => (
                <button
                  key={entity.id}
                  onClick={() => setCurrentEntity(entity)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 transition-colors ${
                    currentEntity?.id === entity.id ? 'bg-zinc-50 font-medium text-indigo-600' : 'text-zinc-700'
                  }`}
                >
                  {entity.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            className="pl-9 pr-4 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
          />
        </div>
        
        <button className="p-2 hover:bg-zinc-100 rounded-md text-zinc-600 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="w-8 h-8 bg-zinc-200 rounded-full border border-zinc-300"></div>
      </div>
    </header>
  );
}
