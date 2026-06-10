import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { UserRole } from '../../../domain/enums/UserRole';
import { IHasher } from '../../../domain/ports/IHasher';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { EntityFinder } from '../../../domain/services/EntityFinder';
import { LastActiveAdminPolicy } from '../../../domain/services/LastActiveAdminPolicy';
import { PasswordPolicy } from '../../../domain/services/PasswordPolicy';
import { UserDTO, toUserDTO } from '../../dtos/UserDTO';
import { Actor } from '../audit/Actor';
import { registerAuditSafely } from '../audit/registerAuditSafely';

export interface UpdateUserInput {
  name?: unknown;
  role?: unknown;
  password?: unknown;
}

/** Use case: update user data (login is immutable). */
export class UpdateUser {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IHasher,
    private readonly auditTrail: IAuditTrailRepository,
  ) {}

  async execute(id: string, data: UpdateUserInput, actor: Actor): Promise<UserDTO> {
    const user = await EntityFinder.findOrThrow(
      (uid) => this.users.findById(uid),
      id,
      'Usuário',
    );

    // If removing the ADMIN role from an active ADMIN, ensure another active ADMIN remains.
    if (
      data.role !== undefined &&
      user.role === UserRole.ADMIN &&
      user.active &&
      data.role !== UserRole.ADMIN
    ) {
      const allUsers = await this.users.listAll();
      LastActiveAdminPolicy.ensureNotLastActiveAdmin(allUsers, id, 'DEMOTE_FROM_ADMIN');
    }

    user.update(data);

    if (data.password !== undefined) {
      const validPassword = PasswordPolicy.validate(data.password);
      const newHash = await this.hasher.hash(validPassword);
      user.changePasswordHash(newHash);
    }

    await this.users.save(user);

    await registerAuditSafely(this.auditTrail, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.UPDATE,
      entityType: 'User',
      entityId: user.id,
      summary: `Usuário "${user.login}" atualizado.`,
    });

    return toUserDTO(user);
  }
}
