import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { DomainError } from '../../../domain/errors/DomainError';
import { IHasher } from '../../../domain/ports/IHasher';
import { ISessionStore } from '../../../domain/ports/ISessionStore';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { requiredText } from '../../../domain/validation';
import { UserDTO, toUserDTO } from '../../dtos/UserDTO';
import { registerAuditSafely } from '../audit/registerAuditSafely';

export interface AuthenticateUserInput {
  login: unknown;
  password: unknown;
}

/**
 * Authentication result. `user` reuses the `UserDTO` to stay consistent with
 * the other user endpoints and to guarantee that sensitive fields
 * (passwordHash) are never serialized.
 */
export interface AuthenticationResult {
  token: string;
  user: UserDTO;
}

/**
 * Use case: authenticate a user by login + password.
 *
 * Validates the existence of the login, the password (via hash compared by
 * IHasher) and the active flag. On success, opens a session (ISessionStore),
 * writes a LOGIN audit entry (the actor is the freshly authenticated user —
 * login is the only route without authenticationMiddleware) and returns the
 * token. The error message is deliberately generic so it does not leak whether
 * the problem was a non-existent login, a wrong password or an inactive account.
 */
export class AuthenticateUser {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IHasher,
    private readonly sessions: ISessionStore,
    private readonly auditTrail: IAuditTrailRepository,
  ) {}

  async execute(input: AuthenticateUserInput): Promise<AuthenticationResult> {
    const login = requiredText(input.login, 'Login');

    if (typeof input.password !== 'string' || input.password.length === 0) {
      throw new DomainError('Credenciais inválidas.');
    }

    const user = await this.users.findByLogin(login);
    if (!user) throw new DomainError('Credenciais inválidas.');
    if (!user.active) throw new DomainError('Credenciais inválidas.');

    const passwordMatches = await this.hasher.compare(input.password, user.passwordHash);
    if (!passwordMatches) throw new DomainError('Credenciais inválidas.');

    const token = await this.sessions.create(user.id);

    await registerAuditSafely(this.auditTrail, {
      actorUserId: user.id,
      actorLogin: user.login,
      operation: AuditOperation.LOGIN,
      entityType: 'User',
      entityId: user.id,
      summary: `Login realizado por "${user.login}".`,
    });

    return {
      token,
      user: toUserDTO(user),
    };
  }
}
