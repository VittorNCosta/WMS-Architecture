import { EstoqueItem } from '../../domain/entities/EstoqueItem';

/** DTO de saída do item de estoque (representação pública, serializável como JSON). */
export interface EstoqueItemDTO {
  id: string;
  produtoId: string;
  localizacaoId: string | null;
  quantidade: number;
  dataEntrada: Date;
}

export function toEstoqueItemDTO(item: EstoqueItem): EstoqueItemDTO {
  return {
    id: item.id,
    produtoId: item.produtoId,
    localizacaoId: item.localizacaoId,
    quantidade: item.quantidade,
    dataEntrada: item.dataEntrada,
  };
}
