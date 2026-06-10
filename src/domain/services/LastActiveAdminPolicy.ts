import { User } from '../entities/User';
import { UserRole } from '../enums/UserRole';
import { DomainError } from '../errors/DomainError';

/** Sensitive operations that may leave the system without any active ADMIN. */
export type LastAdminOperation = 'DEACTIVATE' | 'DEMOTE_FROM_ADMIN';

/**
 * Business rule: the system must always have at least one active ADMIN.
 *
 * Centralizes the check shared by use cases that may remove/deactivate the
 * last active administrator (role update and status change). Pure domain
 * function — testable without a repository.
 */
export class LastActiveAdminPolicy {
  static ensureNotLastActiveAdmin(
    users: User[],
    targetUserId: string,
    operation: LastAdminOperation,
  ): void {
    const otherActiveAdmins = users.filter(
      (u) => u.id !== targetUserId && u.role === UserRole.ADMIN && u.active,
    );
    if (otherActiveAdmins.length === 0) {
      throw new DomainError(messageFor(operation));
    }
  }
}

function messageFor(operation: LastAdminOperation): string {
  switch (operation) {
    case 'DEMOTE_FROM_ADMIN':
      return 'Não é possível remover o perfil ADMIN do último administrador ativo.';
    case 'DEACTIVATE':
      return 'Não é possível inativar o último administrador ativo.';
  }
}
