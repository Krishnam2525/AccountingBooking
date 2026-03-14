import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

// Import API routes
import { GET as getAccounts, POST as createAccount } from './src/app/api/accounting/accounts/route';
import { POST as seedAccounts } from './src/app/api/accounting/accounts/seed/route';
import { GET as getJournalEntries, POST as createJournalEntry } from './src/app/api/accounting/journal-entries/route';
import { GET as getTrialBalance } from './src/app/api/accounting/reports/trial-balance/route';
import { GET as getGeneralLedger } from './src/app/api/accounting/reports/general-ledger/route';
import { GET as getContacts, POST as createContact } from './src/app/api/accounting/contacts/route';
import { GET as getInvoices, POST as createInvoice } from './src/app/api/accounting/invoices/route';
import { POST as authoriseInvoice } from './src/app/api/accounting/invoices/[id]/authorise/route';
import { GET as getBills, POST as createBill } from './src/app/api/accounting/bills/route';
import { POST as authoriseBill } from './src/app/api/accounting/bills/[id]/authorise/route';
import { GET as getBankAccounts, POST as createBankAccount } from './src/app/api/accounting/bank-accounts/route';
import { GET as getBankTransactions, POST as addBankTransactions } from './src/app/api/accounting/bank-accounts/[id]/transactions/route';
import { POST as reconcileTransaction } from './src/app/api/accounting/bank-accounts/[id]/transactions/[transactionId]/reconcile/route';
import { POST as setupApp } from './src/app/api/setup/route';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to adapt Next.js Route Handlers to Express
  const adaptRoute = (handler: Function) => async (req: express.Request, res: express.Response) => {
    try {
      // Create a mock Request object
      const url = new URL(req.url, `http://${req.headers.host}`);
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) headers.append(key, Array.isArray(value) ? value.join(',') : value);
      }

      const requestInit: RequestInit = {
        method: req.method,
        headers,
      };

      if (['POST', 'PUT', 'PATCH'].includes(req.method) && Object.keys(req.body).length > 0) {
        requestInit.body = JSON.stringify(req.body);
      }

      const nextReq = new Request(url.toString(), requestInit);
      const nextRes = await handler(nextReq);
      
      const data = await nextRes.json().catch(() => null);
      res.status(nextRes.status).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // API Routes
  app.post('/api/setup', adaptRoute(setupApp));
  app.get('/api/accounting/accounts', adaptRoute(getAccounts));
  app.post('/api/accounting/accounts', adaptRoute(createAccount));
  app.post('/api/accounting/accounts/seed', adaptRoute(seedAccounts));
  app.get('/api/accounting/journal-entries', adaptRoute(getJournalEntries));
  app.post('/api/accounting/journal-entries', adaptRoute(createJournalEntry));
  app.get('/api/accounting/reports/trial-balance', adaptRoute(getTrialBalance));
  app.get('/api/accounting/reports/general-ledger', adaptRoute(getGeneralLedger));
  app.get('/api/accounting/contacts', adaptRoute(getContacts));
  app.post('/api/accounting/contacts', adaptRoute(createContact));
  app.get('/api/accounting/invoices', adaptRoute(getInvoices));
  app.post('/api/accounting/invoices', adaptRoute(createInvoice));
  app.post('/api/accounting/invoices/:id/authorise', adaptRoute(authoriseInvoice));
  app.get('/api/accounting/bills', adaptRoute(getBills));
  app.post('/api/accounting/bills', adaptRoute(createBill));
  app.post('/api/accounting/bills/:id/authorise', adaptRoute(authoriseBill));
  app.get('/api/accounting/bank-accounts', adaptRoute(getBankAccounts));
  app.post('/api/accounting/bank-accounts', adaptRoute(createBankAccount));
  app.get('/api/accounting/bank-accounts/:id/transactions', adaptRoute(getBankTransactions));
  app.post('/api/accounting/bank-accounts/:id/transactions', adaptRoute(addBankTransactions));
  app.post('/api/accounting/bank-accounts/:id/transactions/:transactionId/reconcile', adaptRoute(reconcileTransaction));

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
