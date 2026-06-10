/**
 * Domain port for session/token storage.
 *
 * Allows swapping the implementation (in-memory, Redis, DB) without
 * affecting the Application layer.
 */
export interface ISessionStore {
  create(userId: string): Promise<string>;
  getUserId(token: string): Promise<string | null>;
  invalidate(token: string): Promise<void>;
}
