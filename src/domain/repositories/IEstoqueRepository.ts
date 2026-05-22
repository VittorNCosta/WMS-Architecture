import { EstoqueItem } from '../entities/EstoqueItem';

/** Contrato de persistência do saldo de estoque (itens por produto/localização/lote). */
export interface IEstoqueRepository {
  salvar(item: EstoqueItem): Promise<void>;
  atualizar(item: EstoqueItem): Promise<void>;
  remover(id: string): Promise<void>;
  buscarPorId(id: string): Promise<EstoqueItem | null>;
  listarPorProduto(produtoId: string): Promise<EstoqueItem[]>;
  listarTodos(): Promise<EstoqueItem[]>;
}
