import { Router } from 'express';
import { asyncHandler } from './asyncHandler';
import { ProdutosController } from './controllers/ProdutosController';
import { RecebimentoController } from './controllers/RecebimentoController';
import { MovimentacaoController } from './controllers/MovimentacaoController';
import { ExpedicaoController } from './controllers/ExpedicaoController';
import { EstoqueController } from './controllers/EstoqueController';
import { RastreabilidadeController } from './controllers/RastreabilidadeController';
import { AuthController } from './controllers/AuthController';
import { repositorios } from '../container';

export const router = Router();

// --- Autenticação ---
router.post('/login', asyncHandler(AuthController.login));

// --- Produtos ---
router.post('/produtos', asyncHandler(ProdutosController.criar));
router.get('/produtos', asyncHandler(ProdutosController.listar));
router.get('/produtos/:id', asyncHandler(ProdutosController.obter));
router.put('/produtos/:id', asyncHandler(ProdutosController.atualizar));

// --- Recebimento / armazenagem ---
router.post('/recebimentos', asyncHandler(RecebimentoController.darEntrada));
router.post('/armazenagens', asyncHandler(RecebimentoController.armazenar));

// --- Movimentações / transferências ---
router.post('/transferencias', asyncHandler(MovimentacaoController.transferir));

// --- Expedição / saída ---
router.post('/expedicoes', asyncHandler(ExpedicaoController.darSaida));

// --- Estoque / saldo ---
router.get('/estoque', asyncHandler(EstoqueController.listarGeral));
router.get('/estoque/:produtoId', asyncHandler(EstoqueController.saldoPorProduto));

// --- Rastreabilidade ---
router.get('/movimentacoes', asyncHandler(RastreabilidadeController.listar));

// --- Catálogo de apoio (somente leitura) — útil para descobrir IDs de exemplo ---
router.get('/usuarios', asyncHandler(async (_req, res) => {
  res.json(await repositorios.usuarioRepo.listarTodos());
}));
router.get('/localizacoes', asyncHandler(async (_req, res) => {
  res.json(await repositorios.localizacaoRepo.listarTodas());
}));
