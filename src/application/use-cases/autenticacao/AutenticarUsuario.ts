import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { DomainError } from '../../../domain/errors/DomainError';
import { IHasher } from '../../../domain/ports/IHasher';
import { ISessionStore } from '../../../domain/ports/ISessionStore';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';
import { textoObrigatorio } from '../../../domain/validacao';
import { UsuarioDTO, toUsuarioDTO } from '../../dtos/UsuarioDTO';
import { registerAuditSafely } from '../auditoria/registerAuditSafely';

export interface AutenticarUsuarioEntrada {
  login: unknown;
  password: unknown;
}

/**
 * Resultado da autenticação. O `user` reaproveita o `UsuarioDTO` para manter
 * consistência com os demais endpoints de usuário e garantir que campos
 * sensíveis (passwordHash) nunca sejam serializados.
 */
export interface ResultadoAutenticacao {
  token: string;
  user: UsuarioDTO;
}

/**
 * Caso de uso: autenticar um usuário por login + senha.
 *
 * Valida a existência do login, a senha (via hash comparado por IHasher) e a
 * flag de ativo. Em caso de sucesso, abre uma sessão (ISessionStore), grava
 * uma entrada de auditoria de LOGIN (o ator é o próprio usuário recém-
 * autenticado — login é a única rota sem authenticationMiddleware) e devolve
 * o token. Mensagem de erro é deliberadamente genérica para não vazar se o
 * problema foi login inexistente, senha errada ou conta inativa.
 */
export class AutenticarUsuario {
  constructor(
    private readonly usuarios: IUsuarioRepository,
    private readonly hasher: IHasher,
    private readonly sessions: ISessionStore,
    private readonly auditoria: IAuditTrailRepository,
  ) {}

  async execute(entrada: AutenticarUsuarioEntrada): Promise<ResultadoAutenticacao> {
    const login = textoObrigatorio(entrada.login, 'Login');

    if (typeof entrada.password !== 'string' || entrada.password.length === 0) {
      throw new DomainError('Credenciais inválidas.');
    }

    const usuario = await this.usuarios.buscarPorLogin(login);
    if (!usuario) throw new DomainError('Credenciais inválidas.');
    if (!usuario.ativo) throw new DomainError('Credenciais inválidas.');

    const senhaConfere = await this.hasher.compare(entrada.password, usuario.passwordHash);
    if (!senhaConfere) throw new DomainError('Credenciais inválidas.');

    const token = await this.sessions.create(usuario.id);

    await registerAuditSafely(this.auditoria, {
      actorUserId: usuario.id,
      actorLogin: usuario.login,
      operation: AuditOperation.LOGIN,
      entityType: 'Usuario',
      entityId: usuario.id,
      summary: `Login realizado por "${usuario.login}".`,
    });

    return {
      token,
      user: toUsuarioDTO(usuario),
    };
  }
}
