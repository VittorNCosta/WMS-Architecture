import { Request, Response } from 'express';
import { DomainError } from '../../../domain/errors/DomainError';
import { casosDeUso } from '../../container';

/** Autenticação de usuários (acesso ao sistema). */
export const AuthController = {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const resultado = await casosDeUso.autenticarUsuario.execute({
        login: req.body?.login,
        password: req.body?.password,
      });
      res.status(200).json(resultado);
    } catch (err) {
      // Para login, qualquer DomainError (credencial inválida, login vazio etc.)
      // é traduzido para 401 com mensagem genérica — não vaza informação.
      if (err instanceof DomainError) {
        res.status(401).json({ erro: 'Credenciais inválidas.' });
        return;
      }
      throw err;
    }
  },
};
