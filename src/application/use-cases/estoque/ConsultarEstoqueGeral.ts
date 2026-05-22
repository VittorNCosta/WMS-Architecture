import { IEstoqueRepository } from '../../../domain/repositories/IEstoqueRepository';
import { ILocalizacaoRepository } from '../../../domain/repositories/ILocalizacaoRepository';
import { IProdutoRepository } from '../../../domain/repositories/IProdutoRepository';

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

/**
 * Caso de uso: consultar o estoque consolidado de todo o armazém.
 *
 * Soma a quantidade de todos os lotes que compartilham o mesmo par
 * produto+localização (visão consolidada), enriquecendo cada linha com
 * o SKU/nome do produto e o código/descrição da localização.
 */
export class ConsultarEstoqueGeral {
  constructor(
    private readonly estoque: IEstoqueRepository,
    private readonly produtos: IProdutoRepository,
    private readonly localizacoes: ILocalizacaoRepository,
  ) {}

  async listar(): Promise<EstoqueGeralResultado> {
    const itens = await this.estoque.listarTodos();
    const produtos = await this.produtos.listarTodos();
    const localizacoes = await this.localizacoes.listarTodas();

    const produtoPorId = new Map(produtos.map((p) => [p.id, p]));
    const localizacaoPorId = new Map(localizacoes.map((l) => [l.id, l]));

    const SEM_LOCALIZACAO = '(sem localização)';
    const acumulado = new Map<
      string,
      { produtoId: string; localizacaoId: string | null; quantidade: number }
    >();
    let quantidadeTotalGeral = 0;

    for (const item of itens) {
      quantidadeTotalGeral += item.quantidade;

      const localizacaoChave = item.localizacaoId ?? SEM_LOCALIZACAO;
      const chave = `${item.produtoId}|${localizacaoChave}`;

      const existente = acumulado.get(chave);
      if (existente) {
        existente.quantidade += item.quantidade;
      } else {
        acumulado.set(chave, {
          produtoId: item.produtoId,
          localizacaoId: item.localizacaoId ?? null,
          quantidade: item.quantidade,
        });
      }
    }

    const linhas: LinhaEstoque[] = [...acumulado.values()].map((agregado) => {
      const produto = produtoPorId.get(agregado.produtoId) ?? null;
      const localizacao =
        agregado.localizacaoId == null
          ? null
          : localizacaoPorId.get(agregado.localizacaoId) ?? null;

      return {
        produtoId: agregado.produtoId,
        produtoSku: produto ? produto.sku : null,
        produtoNome: produto ? produto.nome : null,
        localizacaoId: agregado.localizacaoId,
        localizacaoCodigo: localizacao ? localizacao.codigo : null,
        localizacaoDescricao: localizacao ? localizacao.descricao : null,
        quantidade: agregado.quantidade,
      };
    });

    linhas.sort((a, b) => {
      const codigoA = a.localizacaoCodigo ?? '';
      const codigoB = b.localizacaoCodigo ?? '';
      const porLocalizacao = codigoA.localeCompare(codigoB, 'pt-BR');
      if (porLocalizacao !== 0) return porLocalizacao;

      const nomeA = a.produtoNome ?? '';
      const nomeB = b.produtoNome ?? '';
      return nomeA.localeCompare(nomeB, 'pt-BR');
    });

    return {
      itens: linhas,
      quantidadeTotalGeral,
      totalRegistros: linhas.length,
    };
  }
}
