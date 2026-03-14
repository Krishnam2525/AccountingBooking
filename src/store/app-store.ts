import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Entity {
  id: string;
  name: string;
  baseCurrency: string;
}

interface AppState {
  // Multi-entity context
  currentEntity: Entity | null;
  availableEntities: Entity[];
  setCurrentEntity: (entity: Entity) => void;
  setAvailableEntities: (entities: Entity[]) => void;
  
  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentEntity: null,
      availableEntities: [],
      setCurrentEntity: (entity) => set({ currentEntity: entity }),
      setAvailableEntities: (entities) => set({ availableEntities: entities }),
      
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'accounting-app-storage',
      // Only persist the entity context, not UI state like sidebar
      partialize: (state) => ({ currentEntity: state.currentEntity }),
    }
  )
);
