import { Request, Response } from 'express';
import { casosDeUso } from '../../container';
import { actorFromRequest } from '../actor';

/** Cadastro / atualização / consulta de produtos. */
export const ProdutosController = {
  async criar(req: Request, res: Response): Promise<void> {
    const produto = await casosDeUso.cadastrarProduto.execute(req.body, actorFromRequest(req));
    res.status(201).json(produto);
  },

  async atualizar(req: Request, res: Response): Promise<void> {
    const produto = await casosDeUso.atualizarProduto.execute(
      req.params.id,
      req.body,
      actorFromRequest(req),
    );
    res.json(produto);
  },

  async listar(_req: Request, res: Response): Promise<void> {
    res.json(await casosDeUso.consultarProduto.listar());
  },

  async obter(req: Request, res: Response): Promise<void> {
    res.json(await casosDeUso.consultarProduto.porId(req.params.id));
  },
};
