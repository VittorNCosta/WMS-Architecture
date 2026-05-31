import { Localizacao } from '../../../domain/entities/Localizacao';
import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { DomainError } from '../../../domain/errors/DomainError';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { ILocalizacaoRepository } from '../../../domain/repositories/ILocalizacaoRepository';
import { LocalizacaoDTO, toLocalizacaoDTO } from '../../dtos/LocalizacaoDTO';
import { Actor } from '../auditoria/Actor';
import { registerAuditSafely } from '../auditoria/registerAuditSafely';

export interface CadastrarLocalizacaoInput {
  codigo: unknown;
  descricao?: unknown;
}

/** Caso de uso: cadastrar nova localização (código único, case-insensitive). */
export class CadastrarLocalizacao {
  constructor(
    private readonly localizacoes: ILocalizacaoRepository,
    private readonly auditoria: IAuditTrailRepository,
  ) {}

  async execute(input: CadastrarLocalizacaoInput, actor: Actor): Promise<LocalizacaoDTO> {
    const localizacao = Localizacao.criar(input);

    const jaExiste = await this.localizacoes.buscarPorCodigo(localizacao.codigo);
    if (jaExiste) {
      throw new DomainError(`Já existe uma localização com o código "${localizacao.codigo}".`);
    }

    await this.localizacoes.salvar(localizacao);

    await registerAuditSafely(this.auditoria, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.CREATE,
      entityType: 'Localizacao',
      entityId: localizacao.id,
      summary: `Localização "${localizacao.codigo}" cadastrada.`,
    });

    return toLocalizacaoDTO(localizacao);
  }
}
