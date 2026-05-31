import { Localizacao } from '../../domain/entities/Localizacao';

/** DTO de saída da localização (representação pública, serializável como JSON). */
export interface LocalizacaoDTO {
  id: string;
  codigo: string;
  descricao: string | null;
  ativo: boolean;
}

export function toLocalizacaoDTO(localizacao: Localizacao): LocalizacaoDTO {
  return {
    id: localizacao.id,
    codigo: localizacao.codigo,
    descricao: localizacao.descricao,
    ativo: localizacao.ativo,
  };
}
