import { Usuario } from '../entities/Usuario';
import { PerfilUsuario } from '../enums/PerfilUsuario';
import { DomainError } from '../errors/DomainError';

/** Operações sensíveis que podem deixar o sistema sem nenhum ADMIN ativo. */
export type LastAdminOperation = 'DEACTIVATE' | 'DEMOTE_FROM_ADMIN';

/**
 * Regra de negócio: o sistema deve ter sempre ao menos um ADMIN ativo.
 *
 * Centraliza a verificação compartilhada por casos de uso que podem
 * remover/inativar o último administrador ativo (atualização de perfil e
 * alteração de status). Função pura de domínio — testável sem repositório.
 */
export class LastActiveAdminPolicy {
  static ensureNotLastActiveAdmin(
    users: Usuario[],
    targetUserId: string,
    operation: LastAdminOperation,
  ): void {
    const otherActiveAdmins = users.filter(
      (u) => u.id !== targetUserId && u.perfil === PerfilUsuario.ADMIN && u.ativo,
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
