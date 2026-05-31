import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { PerfilUsuario } from '../../../domain/enums/PerfilUsuario';
import { IHasher } from '../../../domain/ports/IHasher';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';
import { EntityFinder } from '../../../domain/services/EntityFinder';
import { LastActiveAdminPolicy } from '../../../domain/services/LastActiveAdminPolicy';
import { PasswordPolicy } from '../../../domain/services/PasswordPolicy';
import { UsuarioDTO, toUsuarioDTO } from '../../dtos/UsuarioDTO';
import { Actor } from '../auditoria/Actor';
import { registerAuditSafely } from '../auditoria/registerAuditSafely';

export interface AtualizarUsuarioInput {
  nome?: unknown;
  perfil?: unknown;
  password?: unknown;
}

/** Caso de uso: atualizar dados de um usuário (login é imutável). */
export class AtualizarUsuario {
  constructor(
    private readonly usuarios: IUsuarioRepository,
    private readonly hasher: IHasher,
    private readonly auditoria: IAuditTrailRepository,
  ) {}

  async execute(id: string, dados: AtualizarUsuarioInput, actor: Actor): Promise<UsuarioDTO> {
    const usuario = await EntityFinder.findOrThrow(
      (uid) => this.usuarios.buscarPorId(uid),
      id,
      'Usuário',
    );

    // Se vai remover o perfil ADMIN de um ADMIN ativo, garante que sobra outro ADMIN ativo.
    if (
      dados.perfil !== undefined &&
      usuario.perfil === PerfilUsuario.ADMIN &&
      usuario.ativo &&
      dados.perfil !== PerfilUsuario.ADMIN
    ) {
      const todosUsuarios = await this.usuarios.listarTodos();
      LastActiveAdminPolicy.ensureNotLastActiveAdmin(todosUsuarios, id, 'DEMOTE_FROM_ADMIN');
    }

    usuario.atualizar(dados);

    if (dados.password !== undefined) {
      const validPassword = PasswordPolicy.validate(dados.password);
      const newHash = await this.hasher.hash(validPassword);
      usuario.alterarPasswordHash(newHash);
    }

    await this.usuarios.salvar(usuario);

    await registerAuditSafely(this.auditoria, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.UPDATE,
      entityType: 'Usuario',
      entityId: usuario.id,
      summary: `Usuário "${usuario.login}" atualizado.`,
    });

    return toUsuarioDTO(usuario);
  }
}
