import { Request, Response } from 'express';
import { useCases } from '../../container';
import { actorFromRequest } from '../actor';

/** Receiving (inbound) and putaway of items. */
export const ReceivingController = {
  async receive(req: Request, res: Response): Promise<void> {
    const result = await useCases.processInbound.execute(req.body, actorFromRequest(req));
    res.status(201).json(result);
  },

  async store(req: Request, res: Response): Promise<void> {
    const movement = await useCases.storeItem.execute(req.body, actorFromRequest(req));
    res.status(201).json(movement);
  },
};
