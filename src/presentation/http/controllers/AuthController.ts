import { Request, Response } from 'express';
import { DomainError } from '../../../domain/errors/DomainError';
import { useCases } from '../../container';

/** User authentication (system access). */
export const AuthController = {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await useCases.authenticateUser.execute({
        login: req.body?.login,
        password: req.body?.password,
      });
      res.status(200).json(result);
    } catch (err) {
      // For login, any DomainError (invalid credential, empty login, etc.) is
      // translated to 401 with a generic message — it does not leak information.
      if (err instanceof DomainError) {
        res.status(401).json({ error: 'Credenciais inválidas.' });
        return;
      }
      throw err;
    }
  },
};
