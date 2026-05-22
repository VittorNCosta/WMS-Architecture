import { randomUUID } from 'node:crypto';
import { DomainError } from '../errors/DomainError';
import { UserRole } from '../enums/UserRole';
import { requiredText } from '../validation';

/** System user (operator, receiving clerk, shipping clerk, administrator). */
export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public login: string,
    public role: UserRole,
    public active: boolean,
  ) {}

  static create(props: { name: unknown; login: unknown; role: UserRole }): User {
    if (!Object.values(UserRole).includes(props.role)) {
      throw new DomainError(`Invalid user role: ${String(props.role)}`);
    }
    return new User(
      randomUUID(),
      requiredText(props.name, 'User name'),
      requiredText(props.login, 'User login'),
      props.role,
      true,
    );
  }

  hasRole(...roles: UserRole[]): boolean {
    return roles.includes(this.role);
  }
}
