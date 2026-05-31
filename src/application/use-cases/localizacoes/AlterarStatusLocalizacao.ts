import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { DomainError } from '../../../domain/errors/DomainError';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IEstoqueRepository } from '../../../domain/repositories/IEstoqueRepository';
import { ILocalizacaoRepository } from '../../../domain/repositories/ILocalizacaoRepository';
import { EntityFinder } from '../../../domain/services/EntityFinder';
import { LocalizacaoDTO, toLocalizacaoDTO } from '../../dtos/LocalizacaoDTO';
import { Actor } from '../auditoria/Actor';
import { registerAuditSafely } from '../auditoria/registerAuditSafely';

export interface AlterarStatusLocalizacaoInput {
  ativo: unknown;
}

/** Caso de uso: ativar/inativar localização, bloqueando inativação com estoque vinculado. */
export class AlterarStatusLocalizacao {
  constructor(
    private readonly localizacoes: ILocalizacaoRepository,
    private readonly estoque: IEstoqueRepository,
    private readonly auditoria: IAuditTrailRepository,
  ) {}

  async execute(
    id: string,
    input: AlterarStatusLocalizacaoInput,
    actor: Actor,
  ): Promise<LocalizacaoDTO> {
    if (typeof input.ativo !== 'boolean') {
      throw new DomainError('Campo "ativo" deve ser booleano.');
    }

    const localizacao = await EntityFinder.findOrThrow(
      (lid) => this.localizacoes.buscarPorId(lid),
      id,
      'Localização',
    );

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

    await registerAuditSafely(this.auditoria, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.STATUS_CHANGE,
      entityType: 'Localizacao',
      entityId: localizacao.id,
      summary: `Localização "${localizacao.codigo}" ${input.ativo ? 'ativada' : 'inativada'}.`,
    });

    return toLocalizacaoDTO(localizacao);
  }
}
