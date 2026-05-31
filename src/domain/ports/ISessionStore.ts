/**
 * Porta de domínio para armazenamento de sessões/tokens.
 *
 * Permite trocar a implementação (em memória, Redis, DB) sem afetar a
 * camada Application.
 */
export interface ISessionStore {
  create(userId: string): Promise<string>;
  getUserId(token: string): Promise<string | null>;
  invalidate(token: string): Promise<void>;
}
