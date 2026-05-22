import { Request, Response } from 'express';
import { casosDeUso } from '../../container';

/** Rastreabilidade — histórico de movimentações. */
export const RastreabilidadeController = {
  async listar(req: Request, res: Response): Promise<void> {
    const produtoId = typeof req.query.produtoId === 'string' ? req.query.produtoId : undefined;
    res.json(await casosDeUso.rastrearMovimentacoes.execute({ produtoId }));
  },
};
