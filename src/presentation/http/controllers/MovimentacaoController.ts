import { Request, Response } from 'express';
import { casosDeUso } from '../../container';
import { actorFromRequest } from '../actor';

/** Transferências de saldo entre localizações. */
export const MovimentacaoController = {
  async transferir(req: Request, res: Response): Promise<void> {
    const movimentacao = await casosDeUso.transferirSaldo.execute(req.body, actorFromRequest(req));
    res.status(201).json(movimentacao);
  },
};
