import { Request, Response } from 'express';
import { casosDeUso } from '../../container';

/** Cadastro / atualização / consulta / status de localizações. */
export const LocalizacoesController = {
  async criar(req: Request, res: Response): Promise<void> {
    const localizacao = await casosDeUso.cadastrarLocalizacao.execute(req.body);
    res.status(201).json(localizacao);
  },

  async listar(_req: Request, res: Response): Promise<void> {
    res.json(await casosDeUso.consultarLocalizacao.listar());
  },

  async obter(req: Request, res: Response): Promise<void> {
    res.json(await casosDeUso.consultarLocalizacao.porId(req.params.id));
  },

  async atualizar(req: Request, res: Response): Promise<void> {
    const localizacao = await casosDeUso.atualizarLocalizacao.execute(req.params.id, req.body);
    res.json(localizacao);
  },

  async alterarStatus(req: Request, res: Response): Promise<void> {
    const localizacao = await casosDeUso.alterarStatusLocalizacao.execute(req.params.id, req.body);
    res.json(localizacao);
  },
};
