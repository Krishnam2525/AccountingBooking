import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

// Import API routes
import { GET as getAccounts, POST as createAccount } from './src/app/api/accounting/accounts/route';
import { POST as seedAccounts } from './src/app/api/accounting/accounts/seed/route';
import { GET as getJournalEntries, POST as createJournalEntry } from './src/app/api/accounting/journal-entries/route';
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
