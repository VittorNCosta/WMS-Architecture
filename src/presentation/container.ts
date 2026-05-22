/**
 * Composition Root (raiz de composição).
 *
 * É o único lugar que conhece todas as camadas: abre o "banco" (arquivo JSON),
 * instancia os repositórios concretos (Infra) e injeta essas abstrações nos casos
 * de uso (Application). É a aplicação concreta do padrão Dependency Injection —
 * para trocar de banco, basta trocar o que é instanciado aqui.
 */
import { resolve } from 'node:path';

import { Localizacao } from '../domain/entities/Localizacao';
import { Usuario } from '../domain/entities/Usuario';
import { PerfilUsuario } from '../domain/enums/PerfilUsuario';

import { JsonDatabase } from '../infrastructure/persistence/JsonDatabase';
import { JsonFileEstoqueRepository } from '../infrastructure/repositories/JsonFileEstoqueRepository';
import { JsonFileLocalizacaoRepository } from '../infrastructure/repositories/JsonFileLocalizacaoRepository';
import { JsonFileMovimentacaoRepository } from '../infrastructure/repositories/JsonFileMovimentacaoRepository';
import { JsonFileProdutoRepository } from '../infrastructure/repositories/JsonFileProdutoRepository';
import { JsonFileUsuarioRepository } from '../infrastructure/repositories/JsonFileUsuarioRepository';

import { CadastrarProduto } from '../application/use-cases/produtos/CadastrarProduto';
import { AtualizarProduto } from '../application/use-cases/produtos/AtualizarProduto';
import { ConsultarProduto } from '../application/use-cases/produtos/ConsultarProduto';
import { ProcessarEntrada } from '../application/use-cases/recebimento/ProcessarEntrada';
import { ArmazenarItem } from '../application/use-cases/recebimento/ArmazenarItem';
import { TransferirSaldo } from '../application/use-cases/movimentacao/TransferirSaldo';
import { ProcessarSaida } from '../application/use-cases/expedicao/ProcessarSaida';
import { RastrearMovimentacoes } from '../application/use-cases/rastreabilidade/RastrearMovimentacoes';
import { ConsultarSaldo } from '../application/use-cases/estoque/ConsultarSaldo';
import { ConsultarEstoqueGeral } from '../application/use-cases/estoque/ConsultarEstoqueGeral';
import { AutenticarUsuario } from '../application/use-cases/autenticacao/AutenticarUsuario';

// --- "Banco de dados" (arquivo JSON) ---
// Pode ser sobrescrito pela variável de ambiente WMS_DB.
const ARQUIVO_BANCO = process.env.WMS_DB ?? resolve(process.cwd(), 'data', 'wms-db.json');
const db = new JsonDatabase(ARQUIVO_BANCO);

// --- Infraestrutura (repositórios — implementações concretas das interfaces do Domain) ---
const produtoRepo = new JsonFileProdutoRepository(db);
const localizacaoRepo = new JsonFileLocalizacaoRepository(db);
const estoqueRepo = new JsonFileEstoqueRepository(db);
const movimentacaoRepo = new JsonFileMovimentacaoRepository(db);
const usuarioRepo = new JsonFileUsuarioRepository(db);

export const repositorios = {
  produtoRepo,
  localizacaoRepo,
  estoqueRepo,
  movimentacaoRepo,
  usuarioRepo,
};

// --- Casos de uso (recebem as abstrações por injeção de dependência) ---
export const casosDeUso = {
  cadastrarProduto: new CadastrarProduto(produtoRepo),
  atualizarProduto: new AtualizarProduto(produtoRepo),
  consultarProduto: new ConsultarProduto(produtoRepo),
  processarEntrada: new ProcessarEntrada(estoqueRepo, movimentacaoRepo, produtoRepo, usuarioRepo, localizacaoRepo),
  armazenarItem: new ArmazenarItem(estoqueRepo, movimentacaoRepo, localizacaoRepo, usuarioRepo),
  transferirSaldo: new TransferirSaldo(estoqueRepo, movimentacaoRepo, produtoRepo, localizacaoRepo, usuarioRepo),
  processarSaida: new ProcessarSaida(estoqueRepo, movimentacaoRepo, produtoRepo, usuarioRepo),
  rastrearMovimentacoes: new RastrearMovimentacoes(movimentacaoRepo),
  consultarSaldo: new ConsultarSaldo(estoqueRepo),
  consultarEstoqueGeral: new ConsultarEstoqueGeral(estoqueRepo, produtoRepo, localizacaoRepo),
  autenticarUsuario: new AutenticarUsuario(usuarioRepo),
};

export const caminhoBanco = ARQUIVO_BANCO;

export interface ItemSeed {
  tipo: 'usuario' | 'localizacao';
  identificador: string;
  id: string;
}

/**
 * Carrega usuários e localizações de exemplo — só na primeira execução
 * (quando o arquivo JSON ainda está vazio). É idempotente: rodar de novo
 * não duplica nada.
 */
export async function seed(): Promise<ItemSeed[]> {
  if ((await usuarioRepo.listarTodos()).length === 0) {
    await usuarioRepo.salvar(Usuario.criar({ nome: 'Administrador', login: 'admin', perfil: PerfilUsuario.ADMIN }));
    await usuarioRepo.salvar(Usuario.criar({ nome: 'Operador de Estoque', login: 'operador', perfil: PerfilUsuario.OPERADOR }));
  }

  if ((await localizacaoRepo.listarTodas()).length === 0) {
    await localizacaoRepo.salvar(Localizacao.criar({ codigo: 'DOCA', descricao: 'Doca de recebimento' }));
    await localizacaoRepo.salvar(Localizacao.criar({ codigo: 'A-01-01', descricao: 'Rua A, prateleira 01, posição 01' }));
    await localizacaoRepo.salvar(Localizacao.criar({ codigo: 'A-01-02', descricao: 'Rua A, prateleira 01, posição 02' }));
  }

  const usuarios = await usuarioRepo.listarTodos();
  const localizacoes = await localizacaoRepo.listarTodas();
  return [
    ...usuarios.map((u) => ({ tipo: 'usuario' as const, identificador: u.login, id: u.id })),
    ...localizacoes.map((l) => ({ tipo: 'localizacao' as const, identificador: l.codigo, id: l.id })),
  ];
}
