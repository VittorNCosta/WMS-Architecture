import { RequestHandler } from 'express';
import { User } from '../../../domain/entities/User';
import { UserRole } from '../../../domain/enums/UserRole';

/**
 * Authorization middleware: requires `req.user` (attached by the
 * authentication middleware) to have the ADMIN role. Must ALWAYS be registered
 * after the authenticationMiddleware.
 */
export const adminAuthorizationMiddleware: RequestHandler = (req, res, next) => {
  const user = (req as unknown as { user?: User }).user;

  if (!user) {
    res.status(401).json({ error: 'Token de autenticação ausente ou inválido.' });
    return;
  }

  if (user.role !== UserRole.ADMIN) {
    res.status(403).json({ error: 'Acesso restrito a administradores.' });
    return;
  }

  next();
};
