import { randomBytes } from 'node:crypto';
import { ISessionStore } from '../../domain/ports/ISessionStore';

interface SessionEntry {
  userId: string;
  createdAt: Date;
}

/**
 * In-memory ISessionStore implementation.
 *
 * Tokens are random 32-byte (256-bit) hex strings. Enough for simple
 * authentication in an academic project — for production, swap for Redis/JWT,
 * but the contract (ISessionStore) stays the same.
 */
export class InMemorySessionStore implements ISessionStore {
  private readonly sessions = new Map<string, SessionEntry>();

  async create(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    this.sessions.set(token, { userId, createdAt: new Date() });
    return token;
  }

  async getUserId(token: string): Promise<string | null> {
    return this.sessions.get(token)?.userId ?? null;
  }

  async invalidate(token: string): Promise<void> {
    this.sessions.delete(token);
  }
}
