import { Localizacao } from '../../../domain/entities/Localizacao';
import { DomainError } from '../../../domain/errors/DomainError';
import { ILocalizacaoRepository } from '../../../domain/repositories/ILocalizacaoRepository';

/** Caso de uso: consultar localizações (por id ou listagem completa). */
export class ConsultarLocalizacao {
  constructor(private readonly localizacoes: ILocalizacaoRepository) {}

  async porId(id: string): Promise<Localizacao> {
    const localizacao = await this.localizacoes.buscarPorId(id);
    if (!localizacao) throw new DomainError('Localização não encontrada.');
    return localizacao;
  }

  async listar(): Promise<Localizacao[]> {
    return this.localizacoes.listarTodas();
  }
}
