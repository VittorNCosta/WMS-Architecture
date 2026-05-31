import { Produto } from '../../domain/entities/Produto';

/**
 * DTO de saída do produto (representação pública, sem timestamps internos).
 *
 * `criadoEm` e `atualizadoEm` são propositadamente omitidos — são metadados
 * internos da entidade e não fazem parte do contrato HTTP atual.
 */
export interface ProdutoDTO {
  id: string;
  sku: string;
  nome: string;
  descricao: string | null;
  unidadeMedida: string;
  ativo: boolean;
}

export function toProdutoDTO(produto: Produto): ProdutoDTO {
  return {
    id: produto.id,
    sku: produto.sku,
    nome: produto.nome,
    descricao: produto.descricao,
    unidadeMedida: produto.unidadeMedida,
    ativo: produto.ativo,
  };
}
