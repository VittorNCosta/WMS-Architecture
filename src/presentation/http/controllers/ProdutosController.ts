import { Request, Response } from 'express';
import { casosDeUso } from '../../container';

/** Cadastro / atualização / consulta de produtos. */
export const ProdutosController = {
  async criar(req: Request, res: Response): Promise<void> {
    const produto = await casosDeUso.cadastrarProduto.execute(req.body);
    res.status(201).json(produto);
  },

  async atualizar(req: Request, res: Response): Promise<void> {
    const produto = await casosDeUso.atualizarProduto.execute(req.params.id, req.body);
    res.json(produto);
  },

  async listar(_req: Request, res: Response): Promise<void> {
    res.json(await casosDeUso.consultarProduto.listar());
  },

  async obter(req: Request, res: Response): Promise<void> {
    res.json(await casosDeUso.consultarProduto.porId(req.params.id));
  },
};
