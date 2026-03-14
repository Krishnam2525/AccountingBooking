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
import { ReportsPage } from './app/reports/page';
import { GeneralLedgerPage } from './app/reports/general-ledger/[accountId]/page';
import { ContactsPage } from './app/contacts/page';
import { SalesPage } from './app/sales/page';
import { PurchasesPage } from './app/purchases/page';
import { BankingPage } from './app/banking/page';
import { ReconcilePage } from './app/banking/[accountId]/reconcile/page';
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
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/general-ledger/:accountId" element={<GeneralLedgerPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/purchases" element={<PurchasesPage />} />
              <Route path="/banking" element={<BankingPage />} />
              <Route path="/banking/:accountId/reconcile" element={<ReconcilePage />} />
            </Routes>
          </DashboardLayout>
        </BrowserRouter>
      </AppInitializer>
    </Providers>
  );
}
