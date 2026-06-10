import { User } from '../../domain/entities/User';
import { UserRole } from '../../domain/enums/UserRole';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { JsonDatabase, UserRow } from '../persistence/JsonDatabase';

/** User persistence in a JSON file. */
export class JsonFileUserRepository implements IUserRepository {
  constructor(private readonly db: JsonDatabase) {}

  private get rows(): UserRow[] {
    return this.db.table('users');
  }

  private toRow(u: User): UserRow {
    return {
      id: u.id,
      name: u.name,
      login: u.login,
      role: u.role,
      active: u.active,
      passwordHash: u.passwordHash,
    };
  }

  private toEntity(r: UserRow): User {
    return new User(r.id, r.name, r.login, r.role as UserRole, r.active, r.passwordHash);
  }

  async save(user: User): Promise<void> {
    const i = this.rows.findIndex((l) => l.id === user.id);
    const row = this.toRow(user);
    if (i >= 0) this.rows[i] = row;
    else this.rows.push(row);
    this.db.save();
  }

  async findById(id: string): Promise<User | null> {
    const r = this.rows.find((l) => l.id === id);
    return r ? this.toEntity(r) : null;
  }

  async findByLogin(login: string): Promise<User | null> {
    const target = login.trim().toLowerCase();
    const r = this.rows.find((l) => l.login.toLowerCase() === target);
    return r ? this.toEntity(r) : null;
  }

  async listAll(): Promise<User[]> {
    return this.rows.map((r) => this.toEntity(r));
  }
}
