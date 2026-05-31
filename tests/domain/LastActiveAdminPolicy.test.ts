import { describe, it, expect } from 'vitest';
import { Usuario } from '../../src/domain/entities/Usuario';
import { PerfilUsuario } from '../../src/domain/enums/PerfilUsuario';
import { DomainError } from '../../src/domain/errors/DomainError';
import { LastActiveAdminPolicy } from '../../src/domain/services/LastActiveAdminPolicy';

const HASH = '$2a$10$dummyHashForTestsOnlyXXXXXXXXXXXXXXXXXXXXXXXXX';

function admin(login: string): Usuario {
  return Usuario.criar({ nome: login, login, perfil: PerfilUsuario.ADMIN, passwordHash: HASH });
}
function operador(login: string): Usuario {
  return Usuario.criar({ nome: login, login, perfil: PerfilUsuario.OPERADOR, passwordHash: HASH });
}

describe('LastActiveAdminPolicy (serviço de domínio)', () => {
  it('lança ao inativar o único ADMIN ativo', () => {
    const a = admin('a');
    expect(() =>
      LastActiveAdminPolicy.ensureNotLastActiveAdmin([a], a.id, 'DEACTIVATE'),
    ).toThrow('Não é possível inativar o último administrador ativo.');
  });

  it('lança ao rebaixar o único ADMIN ativo (mensagem específica)', () => {
    const a = admin('a');
    expect(() =>
      LastActiveAdminPolicy.ensureNotLastActiveAdmin([a], a.id, 'DEMOTE_FROM_ADMIN'),
    ).toThrow('Não é possível remover o perfil ADMIN do último administrador ativo.');
  });

  it('permite quando existe outro ADMIN ativo', () => {
    const a1 = admin('a1');
    const a2 = admin('a2');
    expect(() =>
      LastActiveAdminPolicy.ensureNotLastActiveAdmin([a1, a2], a1.id, 'DEACTIVATE'),
    ).not.toThrow();
  });

  it('não conta ADMIN inativo como ADMIN ativo restante', () => {
    const alvo = admin('alvo');
    const outro = admin('outro');
    outro.inativar();
    expect(() =>
      LastActiveAdminPolicy.ensureNotLastActiveAdmin([alvo, outro], alvo.id, 'DEACTIVATE'),
    ).toThrow(DomainError);
  });

  it('não considera OPERADOR como administrador', () => {
    const a = admin('a');
    const op = operador('o');
    expect(() =>
      LastActiveAdminPolicy.ensureNotLastActiveAdmin([a, op], a.id, 'DEACTIVATE'),
    ).toThrow(DomainError);
  });
});
