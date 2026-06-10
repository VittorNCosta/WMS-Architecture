import { User } from '../entities/User';

/** User persistence contract. */
export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByLogin(login: string): Promise<User | null>;
  listAll(): Promise<User[]>;
}
