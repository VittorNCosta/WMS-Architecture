import { Produto } from '../../../domain/entities/Produto';
import { DomainError } from '../../../domain/errors/DomainError';
import { IProdutoRepository } from '../../../domain/repositories/IProdutoRepository';

export interface AtualizarProdutoInput {
  nome?: unknown;
  descricao?: unknown;
  unidadeMedida?: unknown;
  ativo?: unknown;
}

/** Caso de uso: atualizar dados de um produto existente. */
export class AtualizarProduto {
  constructor(private readonly produtos: IProdutoRepository) {}

  async execute(id: string, dados: AtualizarProdutoInput): Promise<Produto> {
    const produto = await this.produtos.buscarPorId(id);
    if (!produto) throw new DomainError('Produto não encontrado.');

    produto.atualizar(dados);
    await this.produtos.atualizar(produto);
    return produto;
  }
}
