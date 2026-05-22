import { Localizacao } from '../../../domain/entities/Localizacao';
import { DomainError } from '../../../domain/errors/DomainError';
import { ILocalizacaoRepository } from '../../../domain/repositories/ILocalizacaoRepository';

export interface CadastrarLocalizacaoInput {
  codigo: unknown;
  descricao?: unknown;
}

/** Caso de uso: cadastrar nova localização (código único, case-insensitive). */
export class CadastrarLocalizacao {
  constructor(private readonly localizacoes: ILocalizacaoRepository) {}

  async execute(input: CadastrarLocalizacaoInput): Promise<Localizacao> {
    const localizacao = Localizacao.criar(input);

    const jaExiste = await this.localizacoes.buscarPorCodigo(localizacao.codigo);
    if (jaExiste) {
      throw new DomainError(`Já existe uma localização com o código "${localizacao.codigo}".`);
    }

    await this.localizacoes.salvar(localizacao);
    return localizacao;
  }
}
