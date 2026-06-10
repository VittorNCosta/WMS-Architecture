import { Request, Response } from 'express';
import { useCases } from '../../container';

/** Stock balance queries. */
export const StockController = {
  async listOverview(_req: Request, res: Response): Promise<void> {
    res.json(await useCases.getStockOverview.list());
  },

  async balanceByProduct(req: Request, res: Response): Promise<void> {
    res.json(await useCases.getBalance.byProduct(req.params.productId));
  },
};
