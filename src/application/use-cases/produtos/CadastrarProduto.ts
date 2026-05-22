import { Produto } from '../../../domain/entities/Produto';
import { DomainError } from '../../../domain/errors/DomainError';
import { IProdutoRepository } from '../../../domain/repositories/IProdutoRepository';

export interface CadastrarProdutoInput {
  sku: unknown;
  nome: unknown;
  descricao?: unknown;
  unidadeMedida: unknown;
}

/** Caso de uso: cadastrar um novo produto (SKU único). */
export class CadastrarProduto {
  constructor(private readonly produtos: IProdutoRepository) {}

  async execute(input: CadastrarProdutoInput): Promise<Produto> {
    const produto = Produto.criar(input);

    const jaExiste = await this.produtos.buscarPorSku(produto.sku);
    if (jaExiste) {
      throw new DomainError(`Já existe um produto com o SKU "${produto.sku}".`);
    }

    await this.produtos.salvar(produto);
    return produto;
  }
}
