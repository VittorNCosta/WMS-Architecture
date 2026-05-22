import { Usuario } from '../../../domain/entities/Usuario';
import { PerfilUsuario } from '../../../domain/enums/PerfilUsuario';
import { DomainError } from '../../../domain/errors/DomainError';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';

export interface AlterarStatusUsuarioInput {
  ativo: unknown;
}

/** Caso de uso: ativar/inativar usuário, protegendo o último ADMIN ativo. */
export class AlterarStatusUsuario {
  constructor(private readonly usuarios: IUsuarioRepository) {}

  async execute(id: string, input: AlterarStatusUsuarioInput): Promise<Usuario> {
    if (typeof input.ativo !== 'boolean') {
      throw new DomainError('Campo "ativo" deve ser booleano.');
    }

    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario) throw new DomainError('Usuário não encontrado.');

    if (input.ativo === false && usuario.perfil === PerfilUsuario.ADMIN && usuario.ativo) {
      const todos = await this.usuarios.listarTodos();
      const outrosAdminsAtivos = todos.filter(
        (u) => u.id !== id && u.perfil === PerfilUsuario.ADMIN && u.ativo,
      );
      if (outrosAdminsAtivos.length === 0) {
        throw new DomainError('Não é possível inativar o último administrador ativo.');
      }
    }

    if (input.ativo) usuario.ativar();
    else usuario.inativar();

    await this.usuarios.salvar(usuario);
    return usuario;
  }
}
