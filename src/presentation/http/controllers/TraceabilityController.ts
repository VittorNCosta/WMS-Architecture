import { Request, Response } from 'express';
import { useCases } from '../../container';

/** Traceability — movement history. */
export const TraceabilityController = {
  async list(req: Request, res: Response): Promise<void> {
    const productId = typeof req.query.productId === 'string' ? req.query.productId : undefined;
    res.json(await useCases.traceMovements.execute({ productId }));
  },
};
