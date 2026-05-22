import { EstoqueItem } from '../entities/EstoqueItem';
import { DomainError } from '../errors/DomainError';

/** Quanto consumir de um item de estoque específico. */
export interface AlocacaoFifo {
  item: EstoqueItem;
  quantidade: number;
}

/**
 * Regra de negócio FIFO (First In, First Out).
 *
 * Na saída e na transferência, o estoque consumido é sempre o **mais antigo primeiro**
 * (ordenado pela `dataEntrada`). Função pura de domínio — testável sem banco de dados.
 */
export class PoliticaFifo {
  static selecionarConsumo(itens: EstoqueItem[], quantidadeNecessaria: number): AlocacaoFifo[] {
    if (quantidadeNecessaria <= 0) {
      throw new DomainError('A quantidade necessária deve ser maior que zero.');
    }

    const ordenados = [...itens].sort(
      (a, b) => a.dataEntrada.getTime() - b.dataEntrada.getTime(),
    );

    const disponivel = ordenados.reduce((soma, item) => soma + item.quantidade, 0);
    if (disponivel < quantidadeNecessaria) {
      throw new DomainError(
        `Saldo insuficiente: disponível ${disponivel}, solicitado ${quantidadeNecessaria}.`,
      );
    }

    const alocacoes: AlocacaoFifo[] = [];
    let restante = quantidadeNecessaria;
    for (const item of ordenados) {
      if (restante <= 0) break;
      if (item.quantidade <= 0) continue;
      const consumir = Math.min(item.quantidade, restante);
      alocacoes.push({ item, quantidade: consumir });
      restante -= consumir;
    }
    return alocacoes;
  }
}
