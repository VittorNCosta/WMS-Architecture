import { User } from '../entities/User';

/** Persistence contract for users. */
export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByLogin(login: string): Promise<User | null>;
  findAll(): Promise<User[]>;
}
