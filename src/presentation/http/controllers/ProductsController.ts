import { Request, Response } from 'express';
import { useCases } from '../../container';
import { actorFromRequest } from '../actor';

/** Create / update / get products. */
export const ProductsController = {
  async create(req: Request, res: Response): Promise<void> {
    const product = await useCases.createProduct.execute(req.body, actorFromRequest(req));
    res.status(201).json(product);
  },

  async update(req: Request, res: Response): Promise<void> {
    const product = await useCases.updateProduct.execute(
      req.params.id,
      req.body,
      actorFromRequest(req),
    );
    res.json(product);
  },

  async list(_req: Request, res: Response): Promise<void> {
    res.json(await useCases.getProduct.list());
  },

  async get(req: Request, res: Response): Promise<void> {
    res.json(await useCases.getProduct.byId(req.params.id));
  },
};
