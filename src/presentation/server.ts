import { resolve } from 'node:path';

import express from 'express';
import { router } from './http/routes';
import { errorHandler } from './http/errorHandler';
import { seed } from './container';

const app = express();
app.use(express.json());

// Status do serviço em JSON (antes era servido na raiz "/").
app.get('/status', (_req, res) => {
  res.json({ servico: 'WMS — Onion Architecture', status: 'ok', api: '/api' });
});

app.use('/api', router);

// Arquivos estáticos (tela de login e demais assets). A raiz "/" serve login.html.
const PASTA_PUBLICA = resolve(process.cwd(), 'public');
app.use(express.static(PASTA_PUBLICA, { index: 'login.html' }));

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3333;

seed()
  .then((dadosExemplo) => {
    app.listen(PORT, () => {
      console.log(`WMS rodando em http://localhost:${PORT}`);
      console.log('Dados de exemplo carregados (use estes IDs para testar a API):');
      console.table(dadosExemplo);
    });
  })
  .catch((erro) => {
    console.error('Falha ao iniciar o WMS:', erro);
    process.exit(1);
  });
