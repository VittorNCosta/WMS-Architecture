/**
 * DTOs (Data Transfer Objects) da visão consolidada de estoque.
 *
 * Compartilhados entre o caso de uso `ConsultarEstoqueGeral` e o
 * application service `StockOverviewConsolidator`. Os nomes dos campos
 * fazem parte do contrato HTTP da rota `GET /estoque/geral` e NÃO
 * devem ser alterados.
 */

export interface LinhaEstoque {
  produtoId: string;
  produtoSku: string | null;
  produtoNome: string | null;
  localizacaoId: string | null;
  localizacaoCodigo: string | null;
  localizacaoDescricao: string | null;
  quantidade: number;
}

export interface EstoqueGeralResultado {
  itens: LinhaEstoque[];
  quantidadeTotalGeral: number;
  totalRegistros: number;
}
