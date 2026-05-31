import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { DomainError } from '../../../domain/errors/DomainError';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { ILocalizacaoRepository } from '../../../domain/repositories/ILocalizacaoRepository';
import { EntityFinder } from '../../../domain/services/EntityFinder';
import { LocalizacaoDTO, toLocalizacaoDTO } from '../../dtos/LocalizacaoDTO';
import { Actor } from '../auditoria/Actor';
import { registerAuditSafely } from '../auditoria/registerAuditSafely';

export interface AtualizarLocalizacaoInput {
  codigo?: unknown;
  descricao?: unknown;
}

/** Caso de uso: atualizar localização existente, preservando unicidade do código. */
export class AtualizarLocalizacao {
  constructor(
    private readonly localizacoes: ILocalizacaoRepository,
    private readonly auditoria: IAuditTrailRepository,
  ) {}

  async execute(
    id: string,
    dados: AtualizarLocalizacaoInput,
    actor: Actor,
  ): Promise<LocalizacaoDTO> {
    const localizacao = await EntityFinder.findOrThrow(
      (lid) => this.localizacoes.buscarPorId(lid),
      id,
      'Localização',
    );

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

    await registerAuditSafely(this.auditoria, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.UPDATE,
      entityType: 'Localizacao',
      entityId: localizacao.id,
      summary: `Localização "${localizacao.codigo}" atualizada.`,
    });

    return toLocalizacaoDTO(localizacao);
  }
}
