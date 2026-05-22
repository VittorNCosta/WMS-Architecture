import { Request, Response } from 'express';
import { casosDeUso } from '../../container';

/** Consulta de saldo de estoque. */
export const EstoqueController = {
  async listarGeral(_req: Request, res: Response): Promise<void> {
    res.json(await casosDeUso.consultarEstoqueGeral.listar());
  },

  async saldoPorProduto(req: Request, res: Response): Promise<void> {
    res.json(await casosDeUso.consultarSaldo.porProduto(req.params.produtoId));
  },
};
