import { RequestHandler } from 'express';
import { User } from '../../../domain/entities/User';
import { ISessionStore } from '../../../domain/ports/ISessionStore';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';

/**
 * Factory that produces the Bearer-token authentication middleware.
 *
 * Expects `Authorization: Bearer <token>`. On any failure (missing header,
 * wrong format, unknown token, non-existent or inactive user), responds 401
 * with a generic message. On success, attaches `req.user` and continues the
 * pipeline.
 */
export function buildAuthenticationMiddleware(
  sessions: ISessionStore,
  users: IUserRepository,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization;
      if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token de autenticação ausente ou inválido.' });
        return;
      }

      const token = header.slice('Bearer '.length).trim();
      if (token.length === 0) {
        res.status(401).json({ error: 'Token de autenticação ausente ou inválido.' });
        return;
      }

      const userId = await sessions.getUserId(token);
      if (!userId) {
        res.status(401).json({ error: 'Token de autenticação ausente ou inválido.' });
        return;
      }

      const user = await users.findById(userId);
      if (!user || !user.active) {
        res.status(401).json({ error: 'Token de autenticação ausente ou inválido.' });
        return;
      }

      (req as unknown as { user: User }).user = user;
      next();
    } catch (err) {
      next(err);
    }
  };
}
