import { RequestHandler } from 'express';
import { User } from '../../../domain/entities/User';
import { UserRole } from '../../../domain/enums/UserRole';

/**
 * Authorization factory: builds a middleware that requires `req.user` (attached
 * by the authenticationMiddleware) to have ONE of the given roles. Must ALWAYS
 * be registered after the authenticationMiddleware.
 *
 * Returns 401 when there is no authenticated user and 403 when the user's role
 * is not allowed for the route.
 */
export function requireRoles(...allowed: UserRole[]): RequestHandler {
  return (req, res, next) => {
    const user = (req as unknown as { user?: User }).user;

    if (!user) {
      res.status(401).json({ error: 'Token de autenticação ausente ou inválido.' });
      return;
    }

    if (!user.hasRole(...allowed)) {
      res.status(403).json({ error: 'Seu perfil não tem permissão para executar esta operação.' });
      return;
    }

    next();
  };
}
