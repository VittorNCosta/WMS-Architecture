import { Movimentacao } from '../../domain/entities/Movimentacao';

/** DTO de saída da movimentação (representação pública, serializável como JSON). */
export interface MovimentacaoDTO {
  id: string;
  tipo: string;
  produtoId: string;
  quantidade: number;
  localizacaoOrigemId: string | null;
  localizacaoDestinoId: string | null;
  usuarioId: string;
  documentoReferencia: string | null;
  dataHora: Date;
}

export function toMovimentacaoDTO(movimentacao: Movimentacao): MovimentacaoDTO {
  return {
    id: movimentacao.id,
    tipo: movimentacao.tipo,
    produtoId: movimentacao.produtoId,
    quantidade: movimentacao.quantidade,
    localizacaoOrigemId: movimentacao.localizacaoOrigemId,
    localizacaoDestinoId: movimentacao.localizacaoDestinoId,
    usuarioId: movimentacao.usuarioId,
    documentoReferencia: movimentacao.documentoReferencia,
    dataHora: movimentacao.dataHora,
  };
}
