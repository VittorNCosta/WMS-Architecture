import { DomainError } from '../../../domain/errors/DomainError';
import { IProdutoRepository } from '../../../domain/repositories/IProdutoRepository';
import { ProdutoDTO, toProdutoDTO } from '../../dtos/ProdutoDTO';

/** Caso de uso: consultar produtos (por id ou listagem completa). */
export class ConsultarProduto {
  constructor(private readonly produtos: IProdutoRepository) {}

  async porId(id: string): Promise<ProdutoDTO> {
    const produto = await this.produtos.buscarPorId(id);
    if (!produto) throw new DomainError('Produto não encontrado.');
    return toProdutoDTO(produto);
  }

  async listar(): Promise<ProdutoDTO[]> {
    const produtos = await this.produtos.listarTodos();
    return produtos.map(toProdutoDTO);
  }
}
