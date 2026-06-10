import { Request, Response } from 'express';
import { useCases } from '../../container';
import { actorFromRequest } from '../actor';

/** Create / update / get / status of locations. */
export const LocationsController = {
  async create(req: Request, res: Response): Promise<void> {
    const location = await useCases.createLocation.execute(
      req.body,
      actorFromRequest(req),
    );
    res.status(201).json(location);
  },

  async list(_req: Request, res: Response): Promise<void> {
    res.json(await useCases.getLocation.list());
  },

  async get(req: Request, res: Response): Promise<void> {
    res.json(await useCases.getLocation.byId(req.params.id));
  },

  async update(req: Request, res: Response): Promise<void> {
    const location = await useCases.updateLocation.execute(
      req.params.id,
      req.body,
      actorFromRequest(req),
    );
    res.json(location);
  },

  async changeStatus(req: Request, res: Response): Promise<void> {
    const location = await useCases.changeLocationStatus.execute(
      req.params.id,
      req.body,
      actorFromRequest(req),
    );
    res.json(location);
  },
};
