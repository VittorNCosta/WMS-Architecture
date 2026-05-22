import { Localizacao } from '../entities/Localizacao';

/** Contrato de persistência de localizações de armazenagem. */
export interface ILocalizacaoRepository {
  salvar(localizacao: Localizacao): Promise<void>;
  buscarPorId(id: string): Promise<Localizacao | null>;
  buscarPorCodigo(codigo: string): Promise<Localizacao | null>;
  listarTodas(): Promise<Localizacao[]>;
}
