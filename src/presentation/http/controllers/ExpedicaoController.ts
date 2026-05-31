import { Request, Response } from 'express';
import { casosDeUso } from '../../container';
import { actorFromRequest } from '../actor';

/** Expedição (saída) de produtos — aplica FIFO. */
export const ExpedicaoController = {
  async darSaida(req: Request, res: Response): Promise<void> {
    const movimentacao = await casosDeUso.processarSaida.execute(req.body, actorFromRequest(req));
    res.status(201).json(movimentacao);
  },
};
