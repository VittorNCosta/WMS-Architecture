import { Request } from 'express';
import { Actor } from '../../application/use-cases/auditoria/Actor';
import { Usuario } from '../../domain/entities/Usuario';

/**
 * Constrói o {@link Actor} de auditoria a partir do `req.user` anexado pelo
 * authenticationMiddleware. Só deve ser chamado em rotas autenticadas — onde
 * `req.user` está garantidamente presente.
 */
export function actorFromRequest(req: Request): Actor {
  const user = (req as unknown as { user: Usuario }).user;
  return { userId: user.id, login: user.login };
}
