import { Usuario } from '../../../domain/entities/Usuario';
import { PerfilUsuario } from '../../../domain/enums/PerfilUsuario';
import { DomainError } from '../../../domain/errors/DomainError';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';

export interface CadastrarUsuarioInput {
  nome: unknown;
  login: unknown;
  perfil: unknown;
}

/** Caso de uso: cadastrar novo usuário (login único, case-insensitive). */
export class CadastrarUsuario {
  constructor(private readonly usuarios: IUsuarioRepository) {}

  async execute(input: CadastrarUsuarioInput): Promise<Usuario> {
    const usuario = Usuario.criar({
      nome: input.nome,
      login: input.login,
      perfil: input.perfil as PerfilUsuario,
    });

    const jaExiste = await this.usuarios.buscarPorLogin(usuario.login);
    if (jaExiste) {
      throw new DomainError(`Já existe um usuário com o login "${usuario.login}".`);
    }

    await this.usuarios.salvar(usuario);
    return usuario;
  }
}
