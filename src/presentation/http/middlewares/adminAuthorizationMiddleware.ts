import { RequestHandler } from 'express';
import { Usuario } from '../../../domain/entities/Usuario';
import { PerfilUsuario } from '../../../domain/enums/PerfilUsuario';

/**
 * Middleware de autorização: exige que `req.user` (anexado pelo middleware
 * de autenticação) tenha perfil ADMIN. Deve ser registrado SEMPRE depois do
 * authenticationMiddleware.
 */
export const adminAuthorizationMiddleware: RequestHandler = (req, res, next) => {
  const user = (req as unknown as { user?: Usuario }).user;

  if (!user) {
    res.status(401).json({ erro: 'Token de autenticação ausente ou inválido.' });
    return;
  }

  if (user.perfil !== PerfilUsuario.ADMIN) {
    res.status(403).json({ erro: 'Acesso restrito a administradores.' });
    return;
  }

  next();
};
