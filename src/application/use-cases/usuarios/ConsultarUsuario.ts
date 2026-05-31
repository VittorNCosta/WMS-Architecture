import { DomainError } from '../../../domain/errors/DomainError';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';
import { UsuarioDTO, toUsuarioDTO } from '../../dtos/UsuarioDTO';

/** Caso de uso: consultar usuários (por id ou listagem completa). */
export class ConsultarUsuario {
  constructor(private readonly usuarios: IUsuarioRepository) {}

  async porId(id: string): Promise<UsuarioDTO> {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario) throw new DomainError('Usuário não encontrado.');
    return toUsuarioDTO(usuario);
  }

  async listar(): Promise<UsuarioDTO[]> {
    const usuarios = await this.usuarios.listarTodos();
    return usuarios.map(toUsuarioDTO);
  }
}
