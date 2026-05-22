import { DomainError } from '../../../domain/errors/DomainError';
import { PerfilUsuario } from '../../../domain/enums/PerfilUsuario';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';
import { textoObrigatorio } from '../../../domain/validacao';

export interface AutenticarUsuarioEntrada {
  login: unknown;
}

/** Dados públicos do usuário devolvidos após autenticação (nunca expõe nada sensível). */
export interface UsuarioAutenticado {
  id: string;
  nome: string;
  login: string;
  perfil: PerfilUsuario;
}

/**
 * Caso de uso: autenticar um usuário pelo login.
 *
 * O sistema não trabalha com senha (coerente com a entidade Usuario), portanto a
 * autenticação valida apenas a existência de um login válido e ativo.
 */
export class AutenticarUsuario {
  constructor(private readonly usuarios: IUsuarioRepository) {}

  async execute(entrada: AutenticarUsuarioEntrada): Promise<UsuarioAutenticado> {
    const login = textoObrigatorio(entrada.login, 'Login');

    const usuario = await this.usuarios.buscarPorLogin(login);
    if (!usuario) throw new DomainError('Credenciais inválidas.');
    if (!usuario.ativo) throw new DomainError('Usuário inativo.');

    return {
      id: usuario.id,
      nome: usuario.nome,
      login: usuario.login,
      perfil: usuario.perfil,
    };
  }
}
