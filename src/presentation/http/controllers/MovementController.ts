import { Request, Response } from 'express';
import { useCases } from '../../container';
import { actorFromRequest } from '../actor';

/** Stock transfers between locations. */
export const MovementController = {
  async transfer(req: Request, res: Response): Promise<void> {
    const movement = await useCases.transferStock.execute(req.body, actorFromRequest(req));
    res.status(201).json(movement);
  },
};
