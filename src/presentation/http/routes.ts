import { Router } from 'express';
import { asyncHandler } from './asyncHandler';
import { ProdutosController } from './controllers/ProdutosController';
import { RecebimentoController } from './controllers/RecebimentoController';
import { MovimentacaoController } from './controllers/MovimentacaoController';
import { ExpedicaoController } from './controllers/ExpedicaoController';
import { EstoqueController } from './controllers/EstoqueController';
import { RastreabilidadeController } from './controllers/RastreabilidadeController';
import { AuthController } from './controllers/AuthController';
import { UsuariosController } from './controllers/UsuariosController';
import { LocalizacoesController } from './controllers/LocalizacoesController';

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

// --- Usuários (CRUD + status) ---
router.post('/usuarios', asyncHandler(UsuariosController.criar));
router.get('/usuarios', asyncHandler(UsuariosController.listar));
router.get('/usuarios/:id', asyncHandler(UsuariosController.obter));
router.put('/usuarios/:id', asyncHandler(UsuariosController.atualizar));
router.patch('/usuarios/:id/status', asyncHandler(UsuariosController.alterarStatus));

// --- Localizações (CRUD + status) ---
router.post('/localizacoes', asyncHandler(LocalizacoesController.criar));
router.get('/localizacoes', asyncHandler(LocalizacoesController.listar));
router.get('/localizacoes/:id', asyncHandler(LocalizacoesController.obter));
router.put('/localizacoes/:id', asyncHandler(LocalizacoesController.atualizar));
router.patch('/localizacoes/:id/status', asyncHandler(LocalizacoesController.alterarStatus));
