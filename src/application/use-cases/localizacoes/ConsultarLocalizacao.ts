import { DomainError } from '../../../domain/errors/DomainError';
import { ILocalizacaoRepository } from '../../../domain/repositories/ILocalizacaoRepository';
import { LocalizacaoDTO, toLocalizacaoDTO } from '../../dtos/LocalizacaoDTO';

/** Caso de uso: consultar localizações (por id ou listagem completa). */
export class ConsultarLocalizacao {
  constructor(private readonly localizacoes: ILocalizacaoRepository) {}

  async porId(id: string): Promise<LocalizacaoDTO> {
    const localizacao = await this.localizacoes.buscarPorId(id);
    if (!localizacao) throw new DomainError('Localização não encontrada.');
    return toLocalizacaoDTO(localizacao);
  }

  async listar(): Promise<LocalizacaoDTO[]> {
    const localizacoes = await this.localizacoes.listarTodas();
    return localizacoes.map(toLocalizacaoDTO);
  }
}
