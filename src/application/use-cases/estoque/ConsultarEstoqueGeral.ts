import { IEstoqueRepository } from '../../../domain/repositories/IEstoqueRepository';
import { ILocalizacaoRepository } from '../../../domain/repositories/ILocalizacaoRepository';
import { IProdutoRepository } from '../../../domain/repositories/IProdutoRepository';
import { StockOverviewConsolidator } from './StockOverviewConsolidator';
import { EstoqueGeralResultado, LinhaEstoque } from './StockOverviewDTOs';

// Re-exporta os DTOs para preservar imports existentes que apontam para este módulo.
export { EstoqueGeralResultado, LinhaEstoque };

/**
 * Caso de uso: consultar o estoque consolidado de todo o armazém.
 *
 * Apenas orquestra: busca os três conjuntos de dados (itens de estoque,
 * produtos e localizações) e delega a consolidação para o application
 * service `StockOverviewConsolidator`.
 */
export class ConsultarEstoqueGeral {
  constructor(
    private readonly estoque: IEstoqueRepository,
    private readonly produtos: IProdutoRepository,
    private readonly localizacoes: ILocalizacaoRepository,
    private readonly consolidator: StockOverviewConsolidator,
  ) {}

  async listar(): Promise<EstoqueGeralResultado> {
    const [stockItems, products, locations] = await Promise.all([
      this.estoque.listarTodos(),
      this.produtos.listarTodos(),
      this.localizacoes.listarTodas(),
    ]);
    return this.consolidator.consolidate(stockItems, products, locations);
  }
}
