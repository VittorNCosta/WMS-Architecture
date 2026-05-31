import { RequestHandler } from 'express';
import { Usuario } from '../../../domain/entities/Usuario';
import { ISessionStore } from '../../../domain/ports/ISessionStore';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';

/**
 * Factory que produz o middleware de autenticação por token Bearer.
 *
 * Espera `Authorization: Bearer <token>`. Em qualquer falha (header ausente,
 * formato errado, token desconhecido, usuário inexistente ou inativo), responde
 * 401 com mensagem genérica. Em sucesso, anexa `req.user` e segue o pipeline.
 */
export function buildAuthenticationMiddleware(
  sessions: ISessionStore,
  usuarios: IUsuarioRepository,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization;
      if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
        res.status(401).json({ erro: 'Token de autenticação ausente ou inválido.' });
        return;
      }

      const token = header.slice('Bearer '.length).trim();
      if (token.length === 0) {
        res.status(401).json({ erro: 'Token de autenticação ausente ou inválido.' });
        return;
      }

      const userId = await sessions.getUserId(token);
      if (!userId) {
        res.status(401).json({ erro: 'Token de autenticação ausente ou inválido.' });
        return;
      }

      const usuario = await usuarios.buscarPorId(userId);
      if (!usuario || !usuario.ativo) {
        res.status(401).json({ erro: 'Token de autenticação ausente ou inválido.' });
        return;
      }

      (req as unknown as { user: Usuario }).user = usuario;
      next();
    } catch (err) {
      next(err);
    }
  };
}
