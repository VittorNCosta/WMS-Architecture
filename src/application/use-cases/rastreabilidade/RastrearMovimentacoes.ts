import { Movimentacao } from '../../../domain/entities/Movimentacao';
import { IMovimentacaoRepository } from '../../../domain/repositories/IMovimentacaoRepository';

export interface RastrearMovimentacoesFiltro {
  produtoId?: string;
}

/** Caso de uso: rastrear o histórico de movimentações (todas ou de um produto). */
export class RastrearMovimentacoes {
  constructor(private readonly movimentacoes: IMovimentacaoRepository) {}

  async execute(filtro: RastrearMovimentacoesFiltro = {}): Promise<Movimentacao[]> {
    const lista = filtro.produtoId
      ? await this.movimentacoes.listarPorProduto(filtro.produtoId)
      : await this.movimentacoes.listarTodas();

    // Mais recentes primeiro.
    return [...lista].sort((a, b) => b.dataHora.getTime() - a.dataHora.getTime());
  }
}
