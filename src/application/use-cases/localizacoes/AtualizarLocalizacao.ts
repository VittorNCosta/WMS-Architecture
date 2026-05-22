import { Localizacao } from '../../../domain/entities/Localizacao';
import { DomainError } from '../../../domain/errors/DomainError';
import { ILocalizacaoRepository } from '../../../domain/repositories/ILocalizacaoRepository';

export interface AtualizarLocalizacaoInput {
  codigo?: unknown;
  descricao?: unknown;
}

/** Caso de uso: atualizar localização existente, preservando unicidade do código. */
export class AtualizarLocalizacao {
  constructor(private readonly localizacoes: ILocalizacaoRepository) {}

  async execute(id: string, dados: AtualizarLocalizacaoInput): Promise<Localizacao> {
    const localizacao = await this.localizacoes.buscarPorId(id);
    if (!localizacao) throw new DomainError('Localização não encontrada.');

    if (dados.codigo !== undefined && typeof dados.codigo === 'string') {
      const novoCodigo = dados.codigo.trim();
      if (novoCodigo !== '' && novoCodigo.toLowerCase() !== localizacao.codigo.toLowerCase()) {
        const conflito = await this.localizacoes.buscarPorCodigo(novoCodigo);
        if (conflito && conflito.id !== id) {
          throw new DomainError(`Já existe uma localização com o código "${novoCodigo}".`);
        }
      }
    }

    localizacao.atualizar(dados);
    await this.localizacoes.salvar(localizacao);
    return localizacao;
  }
}
