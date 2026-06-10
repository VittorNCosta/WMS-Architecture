import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import { requireRoles } from '../../src/presentation/http/middlewares/requireRoles';
import { User } from '../../src/domain/entities/User';
import { UserRole } from '../../src/domain/enums/UserRole';

const DUMMY_HASH = '$2a$10$dummyHashForTestsOnlyXXXXXXXXXXXXXXXXXXXXXXXXX';

function userWithRole(role: UserRole): User {
  return User.create({ name: 'X', login: 'x', role, passwordHash: DUMMY_HASH });
}

/** Builds a fake Express response capturing status code and JSON body. */
function fakeResponse(): Response & { statusCode?: number; body?: unknown } {
  const res = {} as Response & { statusCode?: number; body?: unknown };
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  }) as unknown as Response['status'];
  res.json = vi.fn((payload: unknown) => {
    res.body = payload;
    return res;
  }) as unknown as Response['json'];
  return res;
}

describe('requireRoles (authorization middleware)', () => {
  it('calls next() when the user has one of the allowed roles', () => {
    const req = { user: userWithRole(UserRole.STOCK_LEADER) } as unknown as Request;
    const res = fakeResponse();
    const next = vi.fn();

    requireRoles(UserRole.STOCK_LEADER, UserRole.ADMIN)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('responds 403 when the user role is not allowed', () => {
    const req = { user: userWithRole(UserRole.RECEIVING) } as unknown as Request;
    const res = fakeResponse();
    const next = vi.fn();

    requireRoles(UserRole.SHIPPING, UserRole.STOCK_LEADER, UserRole.ADMIN)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      error: 'Seu perfil não tem permissão para executar esta operação.',
    });
  });

  it('responds 401 when there is no authenticated user', () => {
    const req = {} as unknown as Request;
    const res = fakeResponse();
    const next = vi.fn();

    requireRoles(UserRole.ADMIN)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Token de autenticação ausente ou inválido.' });
  });
});
