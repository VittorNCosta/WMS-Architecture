import { randomUUID } from 'node:crypto';
import { DomainError } from '../errors/DomainError';
import { PerfilUsuario } from '../enums/PerfilUsuario';
import { textoObrigatorio } from '../validacao';

/** Usuário do sistema (operador, recebimento, expedição, administrador). */
export class Usuario {
  constructor(
    public readonly id: string,
    public nome: string,
    public login: string,
    public perfil: PerfilUsuario,
    public ativo: boolean,
  ) {}

  static criar(props: { nome: unknown; login: unknown; perfil: PerfilUsuario }): Usuario {
    if (!Object.values(PerfilUsuario).includes(props.perfil)) {
      throw new DomainError(`Perfil de usuário inválido: ${String(props.perfil)}`);
    }
    return new Usuario(
      randomUUID(),
      textoObrigatorio(props.nome, 'Nome do usuário'),
      textoObrigatorio(props.login, 'Login do usuário'),
      props.perfil,
      true,
    );
  }

  temPerfil(...perfis: PerfilUsuario[]): boolean {
    return perfis.includes(this.perfil);
  }
}
