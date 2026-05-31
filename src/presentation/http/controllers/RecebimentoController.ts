import { Request, Response } from 'express';
import { casosDeUso } from '../../container';
import { actorFromRequest } from '../actor';

/** Recebimento (entrada) e armazenagem de itens. */
export const RecebimentoController = {
  async darEntrada(req: Request, res: Response): Promise<void> {
    const resultado = await casosDeUso.processarEntrada.execute(req.body, actorFromRequest(req));
    res.status(201).json(resultado);
  },

  async armazenar(req: Request, res: Response): Promise<void> {
    const movimentacao = await casosDeUso.armazenarItem.execute(req.body, actorFromRequest(req));
    res.status(201).json(movimentacao);
  },
};
