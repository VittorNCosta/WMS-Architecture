import { Usuario } from '../../../domain/entities/Usuario';
import { PerfilUsuario } from '../../../domain/enums/PerfilUsuario';
import { DomainError } from '../../../domain/errors/DomainError';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';

export interface AtualizarUsuarioInput {
  nome?: unknown;
  perfil?: unknown;
}

/** Caso de uso: atualizar dados de um usuário (login é imutável). */
export class AtualizarUsuario {
  constructor(private readonly usuarios: IUsuarioRepository) {}

  async execute(id: string, dados: AtualizarUsuarioInput): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario) throw new DomainError('Usuário não encontrado.');

    // Se vai remover o perfil ADMIN de um ADMIN ativo, garante que sobra outro ADMIN ativo.
    if (
      dados.perfil !== undefined &&
      usuario.perfil === PerfilUsuario.ADMIN &&
      usuario.ativo &&
      dados.perfil !== PerfilUsuario.ADMIN
    ) {
      const todos = await this.usuarios.listarTodos();
      const outrosAdminsAtivos = todos.filter(
        (u) => u.id !== id && u.perfil === PerfilUsuario.ADMIN && u.ativo,
      );
      if (outrosAdminsAtivos.length === 0) {
        throw new DomainError(
          'Não é possível remover o perfil ADMIN do último administrador ativo.',
        );
      }
    }

    usuario.atualizar(dados);
    await this.usuarios.salvar(usuario);
    return usuario;
  }
}
