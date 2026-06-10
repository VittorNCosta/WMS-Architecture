import { Request } from 'express';
import { Actor } from '../../application/use-cases/audit/Actor';
import { User } from '../../domain/entities/User';

/**
 * Builds the audit {@link Actor} from the `req.user` attached by the
 * authenticationMiddleware. Should only be called on authenticated routes —
 * where `req.user` is guaranteed to be present.
 */
export function actorFromRequest(req: Request): Actor {
  const user = (req as unknown as { user: User }).user;
  return { userId: user.id, login: user.login };
}
