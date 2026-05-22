import { Localizacao } from '../../../domain/entities/Localizacao';
import { DomainError } from '../../../domain/errors/DomainError';
import { IEstoqueRepository } from '../../../domain/repositories/IEstoqueRepository';
import { ILocalizacaoRepository } from '../../../domain/repositories/ILocalizacaoRepository';

export interface AlterarStatusLocalizacaoInput {
  ativo: unknown;
}

/** Caso de uso: ativar/inativar localização, bloqueando inativação com estoque vinculado. */
export class AlterarStatusLocalizacao {
  constructor(
    private readonly localizacoes: ILocalizacaoRepository,
    private readonly estoque: IEstoqueRepository,
  ) {}

  async execute(id: string, input: AlterarStatusLocalizacaoInput): Promise<Localizacao> {
    if (typeof input.ativo !== 'boolean') {
      throw new DomainError('Campo "ativo" deve ser booleano.');
    }

    const localizacao = await this.localizacoes.buscarPorId(id);
    if (!localizacao) throw new DomainError('Localização não encontrada.');

    if (input.ativo === false) {
      const itens = await this.estoque.listarPorLocalizacao(id);
      const temSaldo = itens.some((i) => i.quantidade > 0);
      if (temSaldo) {
        throw new DomainError('Não é possível inativar uma localização com estoque vinculado.');
      }
    }

    if (input.ativo) localizacao.ativar();
    else localizacao.inativar();

    await this.localizacoes.salvar(localizacao);
    return localizacao;
  }
}
