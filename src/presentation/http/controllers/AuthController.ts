import { Request, Response } from 'express';
import { casosDeUso } from '../../container';

/** Autenticação de usuários (acesso ao sistema). */
export const AuthController = {
  async login(req: Request, res: Response): Promise<void> {
    const usuario = await casosDeUso.autenticarUsuario.execute({ login: req.body?.login });
    res.json(usuario);
  },
};
