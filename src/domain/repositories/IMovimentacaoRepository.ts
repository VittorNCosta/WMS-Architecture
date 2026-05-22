import { Movimentacao } from '../entities/Movimentacao';

/** Contrato de persistência do histórico de movimentações (rastreabilidade). */
export interface IMovimentacaoRepository {
  salvar(movimentacao: Movimentacao): Promise<void>;
  listarTodas(): Promise<Movimentacao[]>;
  listarPorProduto(produtoId: string): Promise<Movimentacao[]>;
}
