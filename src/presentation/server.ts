import { resolve } from 'node:path';

import express from 'express';
import { router } from './http/routes';
import { errorHandler } from './http/errorHandler';
import { seed } from './container';

const app = express();
app.use(express.json());

// Service status as JSON (it used to be served at the root "/").
app.get('/status', (_req, res) => {
  res.json({ service: 'WMS — Onion Architecture', status: 'ok', api: '/api' });
});

app.use('/api', router);

// Static files (login screen and other assets). The root "/" serves login.html.
const PUBLIC_DIR = resolve(process.cwd(), 'public');
app.use(express.static(PUBLIC_DIR, { index: 'login.html' }));

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3333;

seed()
  .then((sampleData) => {
    app.listen(PORT, () => {
      console.log(`WMS rodando em http://localhost:${PORT}`);
      console.log('Dados de exemplo carregados (use estes IDs para testar a API):');
      console.table(sampleData);
    });
  })
  .catch((err) => {
    console.error('Falha ao iniciar o WMS:', err);
    process.exit(1);
  });
