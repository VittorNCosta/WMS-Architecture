import { describe, it, expect, beforeEach } from 'vitest';
import { Usuario } from '../../../src/domain/entities/Usuario';
import { PerfilUsuario } from '../../../src/domain/enums/PerfilUsuario';
import { DomainError } from '../../../src/domain/errors/DomainError';
import { IHasher } from '../../../src/domain/ports/IHasher';
import { ISessionStore } from '../../../src/domain/ports/ISessionStore';
import { IUsuarioRepository } from '../../../src/domain/repositories/IUsuarioRepository';
import { AutenticarUsuario } from '../../../src/application/use-cases/autenticacao/AutenticarUsuario';
import { FakeAuditTrailRepository } from '../../helpers/auditoria';

/** Hasher fake determinístico: hash(p) = "hash:" + p. */
class FakeHasher implements IHasher {
  async hash(plain: string): Promise<string> {
    return `hash:${plain}`;
  }
  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hash:${plain}`;
  }
}

class FakeSessionStore implements ISessionStore {
  private seq = 0;
  private porToken = new Map<string, string>();
  async create(userId: string): Promise<string> {
    const token = `tok-${++this.seq}`;
    this.porToken.set(token, userId);
    return token;
  }
  async getUserId(token: string): Promise<string | null> {
    return this.porToken.get(token) ?? null;
  }
  async invalidate(token: string): Promise<void> {
    this.porToken.delete(token);
  }
}

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

describe('AutenticarUsuario (caso de uso)', () => {
  let repo: UsuarioRepoMemoria;
  let auditoria: FakeAuditTrailRepository;
  let caso: AutenticarUsuario;
  let admin: Usuario;

  beforeEach(async () => {
    repo = new UsuarioRepoMemoria();
    auditoria = new FakeAuditTrailRepository();
    const hasher = new FakeHasher();
    caso = new AutenticarUsuario(repo, hasher, new FakeSessionStore(), auditoria);

    admin = Usuario.criar({
      nome: 'Administrador',
      login: 'admin',
      perfil: PerfilUsuario.ADMIN,
      passwordHash: await hasher.hash('trocar123'),
    });
    repo.inserir(admin);
  });

  it('autentica com credenciais corretas e devolve token + user sem passwordHash', async () => {
    const r = await caso.execute({ login: 'admin', password: 'trocar123' });

    expect(r.token).toBeTruthy();
    expect(r.user.login).toBe('admin');
    expect(r.user).not.toHaveProperty('passwordHash');
  });

  it('registra uma entrada de auditoria de LOGIN tendo o próprio usuário como ator', async () => {
    await caso.execute({ login: 'admin', password: 'trocar123' });

    expect(auditoria.entradas).toHaveLength(1);
    expect(auditoria.entradas[0].operation).toBe('LOGIN');
    expect(auditoria.entradas[0].actorLogin).toBe('admin');
    expect(auditoria.entradas[0].actorUserId).toBe(admin.id);
  });

  it('rejeita senha incorreta com mensagem genérica e sem auditar', async () => {
    await expect(caso.execute({ login: 'admin', password: 'errada' })).rejects.toThrow(
      'Credenciais inválidas.',
    );
    expect(auditoria.entradas).toHaveLength(0);
  });

  it('rejeita login inexistente', async () => {
    await expect(caso.execute({ login: 'fantasma', password: 'trocar123' })).rejects.toThrow(
      DomainError,
    );
  });

  it('rejeita usuário inativo', async () => {
    admin.inativar();
    await expect(caso.execute({ login: 'admin', password: 'trocar123' })).rejects.toThrow(
      'Credenciais inválidas.',
    );
  });

  it('rejeita senha vazia', async () => {
    await expect(caso.execute({ login: 'admin', password: '' })).rejects.toThrow(DomainError);
  });
});
