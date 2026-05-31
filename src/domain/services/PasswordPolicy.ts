import { DomainError } from '../errors/DomainError';

/**
 * Regra de domínio para senhas em texto puro recebidas no cadastro/atualização.
 *
 * Mantém o requisito de comprimento mínimo em um único lugar, fora dos casos
 * de uso, e independente da estratégia de hashing escolhida na Infraestrutura.
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
