import { randomUUID } from 'node:crypto';
import { DomainError } from '../errors/DomainError';
import { UserRole } from '../enums/UserRole';
import { requiredText } from '../validation';

/** System user (stock leader, receiving, shipping, administrator). */
export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public readonly login: string,
    public role: UserRole,
    public active: boolean,
    public passwordHash: string,
  ) {
    if (typeof passwordHash !== 'string' || passwordHash.trim().length < 4) {
      throw new DomainError('Hash de senha do usuário é obrigatório.');
    }
  }

  static create(props: {
    name: unknown;
    login: unknown;
    role: UserRole;
    passwordHash: string;
  }): User {
    if (!Object.values(UserRole).includes(props.role)) {
      throw new DomainError(`Perfil de usuário inválido: ${String(props.role)}`);
    }
    return new User(
      randomUUID(),
      requiredText(props.name, 'Nome do usuário'),
      requiredText(props.login, 'Login do usuário'),
      props.role,
      true,
      props.passwordHash,
    );
  }

  /** Updates mutable user data. `login` is immutable (authentication key). */
  update(data: { name?: unknown; role?: unknown }): void {
    if (data.name !== undefined) {
      this.name = requiredText(data.name, 'Nome do usuário');
    }
    if (data.role !== undefined) {
      if (!Object.values(UserRole).includes(data.role as UserRole)) {
        throw new DomainError(`Perfil de usuário inválido: ${String(data.role)}`);
      }
      this.role = data.role as UserRole;
    }
  }

  /** Updates the password hash (plain-text password validation lives in PasswordPolicy). */
  changePasswordHash(newHash: string): void {
    if (typeof newHash !== 'string' || newHash.trim().length < 4) {
      throw new DomainError('Hash de senha do usuário é obrigatório.');
    }
    this.passwordHash = newHash;
  }

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }

  hasRole(...roles: UserRole[]): boolean {
    return roles.includes(this.role);
  }
}
