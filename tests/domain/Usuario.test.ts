import { describe, it, expect } from 'vitest';
import { Usuario } from '../../src/domain/entities/Usuario';
import { PerfilUsuario } from '../../src/domain/enums/PerfilUsuario';
import { DomainError } from '../../src/domain/errors/DomainError';

describe('Usuario (entidade)', () => {
  describe('criar', () => {
    it('cria com dados válidos e fica ativo por padrão', () => {
      const u = Usuario.criar({ nome: 'Joana', login: 'joana', perfil: PerfilUsuario.OPERADOR });
      expect(u.nome).toBe('Joana');
      expect(u.login).toBe('joana');
      expect(u.perfil).toBe(PerfilUsuario.OPERADOR);
      expect(u.ativo).toBe(true);
      expect(u.id).toBeDefined();
    });

    it('rejeita perfil inválido', () => {
      expect(() =>
        Usuario.criar({ nome: 'X', login: 'x', perfil: 'INEXISTENTE' as PerfilUsuario }),
      ).toThrow(DomainError);
    });

    it('rejeita nome vazio', () => {
      expect(() =>
        Usuario.criar({ nome: '   ', login: 'x', perfil: PerfilUsuario.OPERADOR }),
      ).toThrow(DomainError);
    });

    it('rejeita login vazio', () => {
      expect(() =>
        Usuario.criar({ nome: 'X', login: '', perfil: PerfilUsuario.OPERADOR }),
      ).toThrow(DomainError);
    });
  });

  describe('atualizar', () => {
    const novo = () => Usuario.criar({ nome: 'A', login: 'a', perfil: PerfilUsuario.OPERADOR });

    it('atualiza apenas o nome', () => {
      const u = novo();
      u.atualizar({ nome: 'Novo Nome' });
      expect(u.nome).toBe('Novo Nome');
      expect(u.perfil).toBe(PerfilUsuario.OPERADOR);
    });

    it('atualiza para um perfil válido', () => {
      const u = novo();
      u.atualizar({ perfil: PerfilUsuario.ADMIN });
      expect(u.perfil).toBe(PerfilUsuario.ADMIN);
    });

    it('rejeita perfil inválido na atualização', () => {
      const u = novo();
      expect(() => u.atualizar({ perfil: 'OUTRO' })).toThrow(DomainError);
    });

    it('rejeita nome vazio na atualização', () => {
      const u = novo();
      expect(() => u.atualizar({ nome: '   ' })).toThrow(DomainError);
    });
  });

  describe('ativar/inativar e temPerfil', () => {
    it('inativa e reativa', () => {
      const u = Usuario.criar({ nome: 'A', login: 'a', perfil: PerfilUsuario.ADMIN });
      u.inativar();
      expect(u.ativo).toBe(false);
      u.ativar();
      expect(u.ativo).toBe(true);
    });

    it('temPerfil identifica ADMIN', () => {
      const admin = Usuario.criar({ nome: 'A', login: 'a', perfil: PerfilUsuario.ADMIN });
      const op = Usuario.criar({ nome: 'B', login: 'b', perfil: PerfilUsuario.OPERADOR });
      expect(admin.temPerfil(PerfilUsuario.ADMIN)).toBe(true);
      expect(op.temPerfil(PerfilUsuario.ADMIN)).toBe(false);
      expect(op.temPerfil(PerfilUsuario.OPERADOR, PerfilUsuario.ADMIN)).toBe(true);
    });
  });
});
