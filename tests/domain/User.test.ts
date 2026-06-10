import { describe, it, expect } from 'vitest';
import { User } from '../../src/domain/entities/User';
import { UserRole } from '../../src/domain/enums/UserRole';
import { DomainError } from '../../src/domain/errors/DomainError';

// Fixed dummy hash (valid bcrypt format) — only to satisfy the entity invariant,
// which requires a non-empty passwordHash. It is not a real password hash.
const DUMMY_HASH = '$2a$10$dummyHashForTestsOnlyXXXXXXXXXXXXXXXXXXXXXXXXX';

describe('User (entity)', () => {
  describe('create', () => {
    it('creates with valid data and is active by default', () => {
      const u = User.create({
        name: 'Joana',
        login: 'joana',
        role: UserRole.STOCK_LEADER,
        passwordHash: DUMMY_HASH,
      });
      expect(u.name).toBe('Joana');
      expect(u.login).toBe('joana');
      expect(u.role).toBe(UserRole.STOCK_LEADER);
      expect(u.active).toBe(true);
      expect(u.id).toBeDefined();
      expect(u.passwordHash).toBe(DUMMY_HASH);
    });

    it('rejects an invalid role', () => {
      expect(() =>
        User.create({
          name: 'X',
          login: 'x',
          role: 'INEXISTENTE' as UserRole,
          passwordHash: DUMMY_HASH,
        }),
      ).toThrow(DomainError);
    });

    it('rejects an empty name', () => {
      expect(() =>
        User.create({
          name: '   ',
          login: 'x',
          role: UserRole.STOCK_LEADER,
          passwordHash: DUMMY_HASH,
        }),
      ).toThrow(DomainError);
    });

    it('rejects an empty login', () => {
      expect(() =>
        User.create({
          name: 'X',
          login: '',
          role: UserRole.STOCK_LEADER,
          passwordHash: DUMMY_HASH,
        }),
      ).toThrow(DomainError);
    });

    it('rejects an empty passwordHash', () => {
      expect(() =>
        User.create({
          name: 'X',
          login: 'x',
          role: UserRole.STOCK_LEADER,
          passwordHash: '',
        }),
      ).toThrow(DomainError);
    });
  });

  describe('update', () => {
    const make = () =>
      User.create({
        name: 'A',
        login: 'a',
        role: UserRole.STOCK_LEADER,
        passwordHash: DUMMY_HASH,
      });

    it('updates only the name', () => {
      const u = make();
      u.update({ name: 'Novo Nome' });
      expect(u.name).toBe('Novo Nome');
      expect(u.role).toBe(UserRole.STOCK_LEADER);
    });

    it('updates to a valid role', () => {
      const u = make();
      u.update({ role: UserRole.ADMIN });
      expect(u.role).toBe(UserRole.ADMIN);
    });

    it('rejects an invalid role on update', () => {
      const u = make();
      expect(() => u.update({ role: 'OUTRO' })).toThrow(DomainError);
    });

    it('rejects an empty name on update', () => {
      const u = make();
      expect(() => u.update({ name: '   ' })).toThrow(DomainError);
    });
  });

  describe('changePasswordHash', () => {
    it('updates the hash when valid', () => {
      const u = User.create({
        name: 'A',
        login: 'a',
        role: UserRole.ADMIN,
        passwordHash: DUMMY_HASH,
      });
      const newHash = '$2a$10$anotherDummyHashXXXXXXXXXXXXXXXXXXXXXXXXXXX';
      u.changePasswordHash(newHash);
      expect(u.passwordHash).toBe(newHash);
    });

    it('rejects an empty hash', () => {
      const u = User.create({
        name: 'A',
        login: 'a',
        role: UserRole.ADMIN,
        passwordHash: DUMMY_HASH,
      });
      expect(() => u.changePasswordHash('')).toThrow(DomainError);
    });
  });

  describe('activate/deactivate and hasRole', () => {
    it('deactivates and reactivates', () => {
      const u = User.create({
        name: 'A',
        login: 'a',
        role: UserRole.ADMIN,
        passwordHash: DUMMY_HASH,
      });
      u.deactivate();
      expect(u.active).toBe(false);
      u.activate();
      expect(u.active).toBe(true);
    });

    it('hasRole identifies ADMIN', () => {
      const admin = User.create({
        name: 'A',
        login: 'a',
        role: UserRole.ADMIN,
        passwordHash: DUMMY_HASH,
      });
      const op = User.create({
        name: 'B',
        login: 'b',
        role: UserRole.STOCK_LEADER,
        passwordHash: DUMMY_HASH,
      });
      expect(admin.hasRole(UserRole.ADMIN)).toBe(true);
      expect(op.hasRole(UserRole.ADMIN)).toBe(false);
      expect(op.hasRole(UserRole.STOCK_LEADER, UserRole.ADMIN)).toBe(true);
    });
  });
});
