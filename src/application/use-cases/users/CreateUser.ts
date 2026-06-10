import { User } from '../../../domain/entities/User';
import { UserRole } from '../../../domain/enums/UserRole';
import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { DomainError } from '../../../domain/errors/DomainError';
import { IHasher } from '../../../domain/ports/IHasher';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { PasswordPolicy } from '../../../domain/services/PasswordPolicy';
import { UserDTO, toUserDTO } from '../../dtos/UserDTO';
import { Actor } from '../audit/Actor';
import { registerAuditSafely } from '../audit/registerAuditSafely';

export interface CreateUserInput {
  name: unknown;
  login: unknown;
  role: unknown;
  password: unknown;
}

/** Use case: create a new user (unique login, case-insensitive). */
export class CreateUser {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IHasher,
    private readonly auditTrail: IAuditTrailRepository,
  ) {}

  async execute(input: CreateUserInput, actor: Actor): Promise<UserDTO> {
    const validPassword = PasswordPolicy.validate(input.password);
    const passwordHash = await this.hasher.hash(validPassword);

    const user = User.create({
      name: input.name,
      login: input.login,
      role: input.role as UserRole,
      passwordHash,
    });

    const alreadyExists = await this.users.findByLogin(user.login);
    if (alreadyExists) {
      throw new DomainError(`Já existe um usuário com o login "${user.login}".`);
    }

    await this.users.save(user);

    await registerAuditSafely(this.auditTrail, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.CREATE,
      entityType: 'User',
      entityId: user.id,
      summary: `Usuário "${user.login}" cadastrado.`,
    });

    return toUserDTO(user);
  }
}
