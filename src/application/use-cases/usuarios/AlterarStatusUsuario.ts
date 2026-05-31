import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { PerfilUsuario } from '../../../domain/enums/PerfilUsuario';
import { DomainError } from '../../../domain/errors/DomainError';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';
import { EntityFinder } from '../../../domain/services/EntityFinder';
import { LastActiveAdminPolicy } from '../../../domain/services/LastActiveAdminPolicy';
import { UsuarioDTO, toUsuarioDTO } from '../../dtos/UsuarioDTO';
import { Actor } from '../auditoria/Actor';
import { registerAuditSafely } from '../auditoria/registerAuditSafely';

export interface AlterarStatusUsuarioInput {
  ativo: unknown;
}

/** Caso de uso: ativar/inativar usuário, protegendo o último ADMIN ativo. */
export class AlterarStatusUsuario {
  constructor(
    private readonly usuarios: IUsuarioRepository,
    private readonly auditoria: IAuditTrailRepository,
  ) {}

  async execute(
    id: string,
    input: AlterarStatusUsuarioInput,
    actor: Actor,
  ): Promise<UsuarioDTO> {
    if (typeof input.ativo !== 'boolean') {
      throw new DomainError('Campo "ativo" deve ser booleano.');
    }

    const usuario = await EntityFinder.findOrThrow(
      (uid) => this.usuarios.buscarPorId(uid),
      id,
      'Usuário',
    );

    if (input.ativo === false && usuario.perfil === PerfilUsuario.ADMIN && usuario.ativo) {
      const todosUsuarios = await this.usuarios.listarTodos();
      LastActiveAdminPolicy.ensureNotLastActiveAdmin(todosUsuarios, id, 'DEACTIVATE');
    }

    if (input.ativo) usuario.ativar();
    else usuario.inativar();

    await this.usuarios.salvar(usuario);

    await registerAuditSafely(this.auditoria, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.STATUS_CHANGE,
      entityType: 'Usuario',
      entityId: usuario.id,
      summary: `Usuário "${usuario.login}" ${input.ativo ? 'ativado' : 'inativado'}.`,
    });

    return toUsuarioDTO(usuario);
  }
}
