import { EstoqueItem } from '../../../domain/entities/EstoqueItem';
import { Localizacao } from '../../../domain/entities/Localizacao';
import { Produto } from '../../../domain/entities/Produto';
import { EstoqueGeralResultado, LinhaEstoque } from './StockOverviewDTOs';

/**
 * Application Service responsável por consolidar a visão geral de estoque.
 *
 * Recebe as três coleções já materializadas (itens de estoque, produtos e
 * localizações) e produz o resultado final agregado: uma linha por par
 * produto+localização, enriquecida com SKU/nome do produto e código/descrição
 * da localização, ordenada e com totais calculados.
 *
 * Não possui dependências de infraestrutura — toda a I/O fica no UseCase
 * `ConsultarEstoqueGeral`, que apenas orquestra a busca e delega a
 * consolidação para esta classe.
 */
export class StockOverviewConsolidator {
  private static readonly NO_LOCATION_KEY = '(sem localização)';

  consolidate(
    stockItems: EstoqueItem[],
    products: Produto[],
    locations: Localizacao[],
  ): EstoqueGeralResultado {
    const productById = new Map(products.map((p) => [p.id, p]));
    const locationById = new Map(locations.map((l) => [l.id, l]));

    const { aggregated, totalQuantity } = this.aggregateByProductLocation(stockItems);

    const enrichedRows = this.enrichRows(aggregated, productById, locationById);

    this.sortRows(enrichedRows);

    return {
      itens: enrichedRows,
      quantidadeTotalGeral: totalQuantity,
      totalRegistros: enrichedRows.length,
    };
  }

  private aggregateByProductLocation(stockItems: EstoqueItem[]): {
    aggregated: Map<
      string,
      { produtoId: string; localizacaoId: string | null; quantidade: number }
    >;
    totalQuantity: number;
  } {
    const aggregated = new Map<
      string,
      { produtoId: string; localizacaoId: string | null; quantidade: number }
    >();
    let totalQuantity = 0;

    for (const item of stockItems) {
      totalQuantity += item.quantidade;

      const locationKey = item.localizacaoId ?? StockOverviewConsolidator.NO_LOCATION_KEY;
      const key = `${item.produtoId}|${locationKey}`;

      const existing = aggregated.get(key);
      if (existing) {
        existing.quantidade += item.quantidade;
      } else {
        aggregated.set(key, {
          produtoId: item.produtoId,
          localizacaoId: item.localizacaoId ?? null,
          quantidade: item.quantidade,
        });
      }
    }

    return { aggregated, totalQuantity };
  }

  private enrichRows(
    aggregated: Map<
      string,
      { produtoId: string; localizacaoId: string | null; quantidade: number }
    >,
    productById: Map<string, Produto>,
    locationById: Map<string, Localizacao>,
  ): LinhaEstoque[] {
    return [...aggregated.values()].map((entry) => {
      const product = productById.get(entry.produtoId) ?? null;
      const location =
        entry.localizacaoId == null
          ? null
          : locationById.get(entry.localizacaoId) ?? null;

      return {
        produtoId: entry.produtoId,
        produtoSku: product ? product.sku : null,
        produtoNome: product ? product.nome : null,
        localizacaoId: entry.localizacaoId,
        localizacaoCodigo: location ? location.codigo : null,
        localizacaoDescricao: location ? location.descricao : null,
        quantidade: entry.quantidade,
      };
    });
  }

  private sortRows(rows: LinhaEstoque[]): void {
    rows.sort((a, b) => {
      const codeA = a.localizacaoCodigo ?? '';
      const codeB = b.localizacaoCodigo ?? '';
      const byLocation = codeA.localeCompare(codeB, 'pt-BR');
      if (byLocation !== 0) return byLocation;

      const nameA = a.produtoNome ?? '';
      const nameB = b.produtoNome ?? '';
      return nameA.localeCompare(nameB, 'pt-BR');
    });
  }
}
