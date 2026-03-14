/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Providers } from './components/providers';
import { DashboardLayout } from './components/layout/dashboard-layout';
import { ChartOfAccountsPage } from './app/accounts/page';
import { JournalEntriesPage } from './app/journal-entries/page';
import { useAppStore } from './store/app-store';

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { setAvailableEntities, setCurrentEntity, currentEntity } = useAppStore();

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/setup', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          if (data.entities && data.entities.length > 0) {
            setAvailableEntities(data.entities);
            if (!currentEntity) {
              setCurrentEntity(data.entities[0]);
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize app state:', error);
      }
    };
    init();
  }, []);

  return <>{children}</>;
}

export default function App() {
  return (
    <Providers>
      <AppInitializer>
        <BrowserRouter>
          <DashboardLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/accounts" replace />} />
              <Route path="/accounts" element={<ChartOfAccountsPage />} />
              <Route path="/journal-entries" element={<JournalEntriesPage />} />
            </Routes>
          </DashboardLayout>
        </BrowserRouter>
      </AppInitializer>
    </Providers>
  );
}
