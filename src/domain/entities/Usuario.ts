import { randomUUID } from 'node:crypto';
import { DomainError } from '../errors/DomainError';
import { PerfilUsuario } from '../enums/PerfilUsuario';
import { textoObrigatorio } from '../validacao';

/** Usuário do sistema (operador, recebimento, expedição, administrador). */
export class Usuario {
  constructor(
    public readonly id: string,
    public nome: string,
    public readonly login: string,
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

  /** Atualiza dados mutáveis do usuário. `login` é imutável (chave de autenticação). */
  atualizar(dados: { nome?: unknown; perfil?: unknown }): void {
    if (dados.nome !== undefined) {
      this.nome = textoObrigatorio(dados.nome, 'Nome do usuário');
    }
    if (dados.perfil !== undefined) {
      if (!Object.values(PerfilUsuario).includes(dados.perfil as PerfilUsuario)) {
        throw new DomainError(`Perfil de usuário inválido: ${String(dados.perfil)}`);
      }
      this.perfil = dados.perfil as PerfilUsuario;
    }
  }

  ativar(): void {
    this.ativo = true;
  }

  inativar(): void {
    this.ativo = false;
  }

  temPerfil(...perfis: PerfilUsuario[]): boolean {
    return perfis.includes(this.perfil);
  }
}
