import { describe, it, expect, beforeEach } from 'vitest';
import { AlterarStatusUsuario } from '../../../src/application/use-cases/usuarios/AlterarStatusUsuario';
import { Usuario } from '../../../src/domain/entities/Usuario';
import { PerfilUsuario } from '../../../src/domain/enums/PerfilUsuario';
import { DomainError } from '../../../src/domain/errors/DomainError';
import { IUsuarioRepository } from '../../../src/domain/repositories/IUsuarioRepository';

class UsuarioRepoMemoria implements IUsuarioRepository {
  private dados = new Map<string, Usuario>();

  inserir(u: Usuario): void {
    this.dados.set(u.id, u);
  }

  async salvar(u: Usuario): Promise<void> {
    this.dados.set(u.id, u);
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.dados.get(id) ?? null;
  }

  async buscarPorLogin(login: string): Promise<Usuario | null> {
    const alvo = login.toLowerCase();
    for (const u of this.dados.values()) if (u.login.toLowerCase() === alvo) return u;
    return null;
  }

  async listarTodos(): Promise<Usuario[]> {
    return [...this.dados.values()];
  }
}

describe('AlterarStatusUsuario (caso de uso)', () => {
  let repo: UsuarioRepoMemoria;
  let caso: AlterarStatusUsuario;

  beforeEach(() => {
    repo = new UsuarioRepoMemoria();
    caso = new AlterarStatusUsuario(repo);
  });

  it('rejeita inativar o único ADMIN ativo', async () => {
    const admin = Usuario.criar({ nome: 'A', login: 'a', perfil: PerfilUsuario.ADMIN });
    repo.inserir(admin);

    await expect(caso.execute(admin.id, { ativo: false })).rejects.toThrow(
      'Não é possível inativar o último administrador ativo.',
    );
  });

  it('permite inativar 1 de 2 ADMINs ativos', async () => {
    const a1 = Usuario.criar({ nome: 'A1', login: 'a1', perfil: PerfilUsuario.ADMIN });
    const a2 = Usuario.criar({ nome: 'A2', login: 'a2', perfil: PerfilUsuario.ADMIN });
    repo.inserir(a1);
    repo.inserir(a2);

    const r = await caso.execute(a1.id, { ativo: false });
    expect(r.ativo).toBe(false);
  });

  it('permite inativar um OPERADOR mesmo sem outro admin', async () => {
    const admin = Usuario.criar({ nome: 'A', login: 'a', perfil: PerfilUsuario.ADMIN });
    const op = Usuario.criar({ nome: 'O', login: 'o', perfil: PerfilUsuario.OPERADOR });
    repo.inserir(admin);
    repo.inserir(op);

    const r = await caso.execute(op.id, { ativo: false });
    expect(r.ativo).toBe(false);
  });

  it('permite reativar usuário inativo (mesmo sem outros admins ativos)', async () => {
    const admin = Usuario.criar({ nome: 'A', login: 'a', perfil: PerfilUsuario.ADMIN });
    admin.inativar();
    repo.inserir(admin);

    const r = await caso.execute(admin.id, { ativo: true });
    expect(r.ativo).toBe(true);
  });

  it('rejeita "ativo" não-booleano', async () => {
    const u = Usuario.criar({ nome: 'X', login: 'x', perfil: PerfilUsuario.OPERADOR });
    repo.inserir(u);

    await expect(caso.execute(u.id, { ativo: 'sim' as unknown })).rejects.toThrow(DomainError);
  });
});
