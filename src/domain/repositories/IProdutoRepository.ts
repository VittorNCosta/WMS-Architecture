import { Produto } from '../entities/Produto';

/** Contrato de persistência de produtos (implementado na camada de Infra). */
export interface IProdutoRepository {
  salvar(produto: Produto): Promise<void>;
  atualizar(produto: Produto): Promise<void>;
  buscarPorId(id: string): Promise<Produto | null>;
  buscarPorSku(sku: string): Promise<Produto | null>;
  listarTodos(): Promise<Produto[]>;
}
