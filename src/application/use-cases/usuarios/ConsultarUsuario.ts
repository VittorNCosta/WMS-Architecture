import { Usuario } from '../../../domain/entities/Usuario';
import { DomainError } from '../../../domain/errors/DomainError';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';

/** Caso de uso: consultar usuários (por id ou listagem completa). */
export class ConsultarUsuario {
  constructor(private readonly usuarios: IUsuarioRepository) {}

  async porId(id: string): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario) throw new DomainError('Usuário não encontrado.');
    return usuario;
  }

  async listar(): Promise<Usuario[]> {
    return this.usuarios.listarTodos();
  }
}
