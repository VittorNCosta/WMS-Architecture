import { Usuario } from '../../../domain/entities/Usuario';
import { PerfilUsuario } from '../../../domain/enums/PerfilUsuario';
import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { DomainError } from '../../../domain/errors/DomainError';
import { IHasher } from '../../../domain/ports/IHasher';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';
import { PasswordPolicy } from '../../../domain/services/PasswordPolicy';
import { UsuarioDTO, toUsuarioDTO } from '../../dtos/UsuarioDTO';
import { Actor } from '../auditoria/Actor';
import { registerAuditSafely } from '../auditoria/registerAuditSafely';

export interface CadastrarUsuarioInput {
  nome: unknown;
  login: unknown;
  perfil: unknown;
  password: unknown;
}

/** Caso de uso: cadastrar novo usuário (login único, case-insensitive). */
export class CadastrarUsuario {
  constructor(
    private readonly usuarios: IUsuarioRepository,
    private readonly hasher: IHasher,
    private readonly auditoria: IAuditTrailRepository,
  ) {}

  async execute(input: CadastrarUsuarioInput, actor: Actor): Promise<UsuarioDTO> {
    const validPassword = PasswordPolicy.validate(input.password);
    const passwordHash = await this.hasher.hash(validPassword);

    const usuario = Usuario.criar({
      nome: input.nome,
      login: input.login,
      perfil: input.perfil as PerfilUsuario,
      passwordHash,
    });

    const jaExiste = await this.usuarios.buscarPorLogin(usuario.login);
    if (jaExiste) {
      throw new DomainError(`Já existe um usuário com o login "${usuario.login}".`);
    }

    await this.usuarios.salvar(usuario);

    await registerAuditSafely(this.auditoria, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.CREATE,
      entityType: 'Usuario',
      entityId: usuario.id,
      summary: `Usuário "${usuario.login}" cadastrado.`,
    });

    return toUsuarioDTO(usuario);
  }
}
