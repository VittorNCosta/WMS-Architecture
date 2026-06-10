import { DomainError } from '../errors/DomainError';

/**
 * Domain rule for plain-text passwords received on create/update.
 *
 * Keeps the minimum-length requirement in a single place, outside the use
 * cases, and independent of the hashing strategy chosen in Infrastructure.
 */
export class PasswordPolicy {
  static readonly MIN_LENGTH = 6;

  static validate(plainPassword: unknown): string {
    if (typeof plainPassword !== 'string' || plainPassword.length < this.MIN_LENGTH) {
      throw new DomainError(`Senha deve ter ao menos ${this.MIN_LENGTH} caracteres.`);
    }
    return plainPassword;
  }
}
