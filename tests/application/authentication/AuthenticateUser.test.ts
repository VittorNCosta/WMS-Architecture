import { describe, it, expect, beforeEach } from 'vitest';
import { User } from '../../../src/domain/entities/User';
import { UserRole } from '../../../src/domain/enums/UserRole';
import { DomainError } from '../../../src/domain/errors/DomainError';
import { IHasher } from '../../../src/domain/ports/IHasher';
import { ISessionStore } from '../../../src/domain/ports/ISessionStore';
import { IUserRepository } from '../../../src/domain/repositories/IUserRepository';
import { AuthenticateUser } from '../../../src/application/use-cases/authentication/AuthenticateUser';
import { FakeAuditTrailRepository } from '../../helpers/audit';

/** Deterministic fake hasher: hash(p) = "hash:" + p. */
class FakeHasher implements IHasher {
  async hash(plain: string): Promise<string> {
    return `hash:${plain}`;
  }
  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hash:${plain}`;
  }
}

class FakeSessionStore implements ISessionStore {
  private seq = 0;
  private byToken = new Map<string, string>();
  async create(userId: string): Promise<string> {
    const token = `tok-${++this.seq}`;
    this.byToken.set(token, userId);
    return token;
  }
  async getUserId(token: string): Promise<string | null> {
    return this.byToken.get(token) ?? null;
  }
  async invalidate(token: string): Promise<void> {
    this.byToken.delete(token);
  }
}

class InMemoryUserRepo implements IUserRepository {
  private data = new Map<string, User>();
  insert(u: User): void {
    this.data.set(u.id, u);
  }
  async save(u: User): Promise<void> {
    this.data.set(u.id, u);
  }
  async findById(id: string): Promise<User | null> {
    return this.data.get(id) ?? null;
  }
  async findByLogin(login: string): Promise<User | null> {
    const target = login.toLowerCase();
    for (const u of this.data.values()) if (u.login.toLowerCase() === target) return u;
    return null;
  }
  async listAll(): Promise<User[]> {
    return [...this.data.values()];
  }
}

describe('AuthenticateUser (use case)', () => {
  let repo: InMemoryUserRepo;
  let auditTrail: FakeAuditTrailRepository;
  let useCase: AuthenticateUser;
  let admin: User;

  beforeEach(async () => {
    repo = new InMemoryUserRepo();
    auditTrail = new FakeAuditTrailRepository();
    const hasher = new FakeHasher();
    useCase = new AuthenticateUser(repo, hasher, new FakeSessionStore(), auditTrail);

    admin = User.create({
      name: 'Administrador',
      login: 'admin',
      role: UserRole.ADMIN,
      passwordHash: await hasher.hash('trocar123'),
    });
    repo.insert(admin);
  });

  it('authenticates with correct credentials and returns token + user without passwordHash', async () => {
    const r = await useCase.execute({ login: 'admin', password: 'trocar123' });

    expect(r.token).toBeTruthy();
    expect(r.user.login).toBe('admin');
    expect(r.user).not.toHaveProperty('passwordHash');
  });

  it('records a LOGIN audit entry with the user itself as actor', async () => {
    await useCase.execute({ login: 'admin', password: 'trocar123' });

    expect(auditTrail.entries).toHaveLength(1);
    expect(auditTrail.entries[0].operation).toBe('LOGIN');
    expect(auditTrail.entries[0].actorLogin).toBe('admin');
    expect(auditTrail.entries[0].actorUserId).toBe(admin.id);
  });

  it('rejects a wrong password with a generic message and without auditing', async () => {
    await expect(useCase.execute({ login: 'admin', password: 'errada' })).rejects.toThrow(
      'Credenciais inválidas.',
    );
    expect(auditTrail.entries).toHaveLength(0);
  });

  it('rejects a non-existent login', async () => {
    await expect(useCase.execute({ login: 'fantasma', password: 'trocar123' })).rejects.toThrow(
      DomainError,
    );
  });

  it('rejects an inactive user', async () => {
    admin.deactivate();
    await expect(useCase.execute({ login: 'admin', password: 'trocar123' })).rejects.toThrow(
      'Credenciais inválidas.',
    );
  });

  it('rejects an empty password', async () => {
    await expect(useCase.execute({ login: 'admin', password: '' })).rejects.toThrow(DomainError);
  });
});
