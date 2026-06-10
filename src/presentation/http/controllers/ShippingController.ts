import { Request, Response } from 'express';
import { useCases } from '../../container';
import { actorFromRequest } from '../actor';

/** Shipping (outbound) of products — applies FIFO. */
export const ShippingController = {
  async ship(req: Request, res: Response): Promise<void> {
    const movement = await useCases.processOutbound.execute(req.body, actorFromRequest(req));
    res.status(201).json(movement);
  },
};
