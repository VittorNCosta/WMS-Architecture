import { DomainError } from '../../../domain/errors/DomainError';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserDTO, toUserDTO } from '../../dtos/UserDTO';

/** Use case: get users (by id or full listing). */
export class GetUser {
  constructor(private readonly users: IUserRepository) {}

  async byId(id: string): Promise<UserDTO> {
    const user = await this.users.findById(id);
    if (!user) throw new DomainError('Usuário não encontrado.');
    return toUserDTO(user);
  }

  async list(): Promise<UserDTO[]> {
    const users = await this.users.listAll();
    return users.map(toUserDTO);
  }
}
