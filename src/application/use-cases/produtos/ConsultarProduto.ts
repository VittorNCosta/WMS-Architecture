import { Produto } from '../../../domain/entities/Produto';
import { DomainError } from '../../../domain/errors/DomainError';
import { IProdutoRepository } from '../../../domain/repositories/IProdutoRepository';

/** Caso de uso: consultar produtos (por id ou listagem completa). */
export class ConsultarProduto {
  constructor(private readonly produtos: IProdutoRepository) {}

  async porId(id: string): Promise<Produto> {
    const produto = await this.produtos.buscarPorId(id);
    if (!produto) throw new DomainError('Produto não encontrado.');
    return produto;
  }

  async listar(): Promise<Produto[]> {
    return this.produtos.listarTodos();
  }
}
