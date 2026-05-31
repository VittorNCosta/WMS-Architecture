import { randomBytes } from 'node:crypto';
import { ISessionStore } from '../../domain/ports/ISessionStore';

interface SessionEntry {
  userId: string;
  createdAt: Date;
}

/**
 * Implementação de ISessionStore em memória.
 *
 * Tokens são strings hex aleatórias de 32 bytes (256 bits). Suficiente para
 * autenticação simples em um projeto acadêmico — para produção, trocar por
 * Redis/JWT, mas o contrato (ISessionStore) permanece o mesmo.
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
