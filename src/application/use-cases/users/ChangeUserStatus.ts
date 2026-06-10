import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { UserRole } from '../../../domain/enums/UserRole';
import { DomainError } from '../../../domain/errors/DomainError';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { EntityFinder } from '../../../domain/services/EntityFinder';
import { LastActiveAdminPolicy } from '../../../domain/services/LastActiveAdminPolicy';
import { UserDTO, toUserDTO } from '../../dtos/UserDTO';
import { Actor } from '../audit/Actor';
import { registerAuditSafely } from '../audit/registerAuditSafely';

export interface ChangeUserStatusInput {
  active: unknown;
}

/** Use case: activate/deactivate a user, protecting the last active ADMIN. */
export class ChangeUserStatus {
  constructor(
    private readonly users: IUserRepository,
    private readonly auditTrail: IAuditTrailRepository,
  ) {}

  async execute(
    id: string,
    input: ChangeUserStatusInput,
    actor: Actor,
  ): Promise<UserDTO> {
    if (typeof input.active !== 'boolean') {
      throw new DomainError('Campo "ativo" deve ser booleano.');
    }

    const user = await EntityFinder.findOrThrow(
      (uid) => this.users.findById(uid),
      id,
      'Usuário',
    );

    if (input.active === false && user.role === UserRole.ADMIN && user.active) {
      const allUsers = await this.users.listAll();
      LastActiveAdminPolicy.ensureNotLastActiveAdmin(allUsers, id, 'DEACTIVATE');
    }

    if (input.active) user.activate();
    else user.deactivate();

    await this.users.save(user);

    await registerAuditSafely(this.auditTrail, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.STATUS_CHANGE,
      entityType: 'User',
      entityId: user.id,
      summary: `Usuário "${user.login}" ${input.active ? 'ativado' : 'inativado'}.`,
    });

    return toUserDTO(user);
  }
}
