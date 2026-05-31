import { IMovimentacaoRepository } from '../../../domain/repositories/IMovimentacaoRepository';
import { MovimentacaoDTO, toMovimentacaoDTO } from '../../dtos/MovimentacaoDTO';

export interface RastrearMovimentacoesFiltro {
  produtoId?: string;
}

/** Caso de uso: rastrear o histórico de movimentações (todas ou de um produto). */
export class RastrearMovimentacoes {
  constructor(private readonly movimentacoes: IMovimentacaoRepository) {}

  async execute(filtro: RastrearMovimentacoesFiltro = {}): Promise<MovimentacaoDTO[]> {
    const lista = filtro.produtoId
      ? await this.movimentacoes.listarPorProduto(filtro.produtoId)
      : await this.movimentacoes.listarTodas();

    // Mais recentes primeiro.
    return [...lista]
      .sort((a, b) => b.dataHora.getTime() - a.dataHora.getTime())
      .map(toMovimentacaoDTO);
  }
}
