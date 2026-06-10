import { Request, Response } from 'express';
import { useCases } from '../../container';
import { actorFromRequest } from '../actor';

/** Create / update / get / status of users. */
export const UsersController = {
  async create(req: Request, res: Response): Promise<void> {
    const user = await useCases.createUser.execute(req.body, actorFromRequest(req));
    res.status(201).json(user);
  },

  async list(_req: Request, res: Response): Promise<void> {
    res.json(await useCases.getUser.list());
  },

  async get(req: Request, res: Response): Promise<void> {
    res.json(await useCases.getUser.byId(req.params.id));
  },

  async update(req: Request, res: Response): Promise<void> {
    const user = await useCases.updateUser.execute(
      req.params.id,
      req.body,
      actorFromRequest(req),
    );
    res.json(user);
  },

  async changeStatus(req: Request, res: Response): Promise<void> {
    const user = await useCases.changeUserStatus.execute(
      req.params.id,
      req.body,
      actorFromRequest(req),
    );
    res.json(user);
  },
};
