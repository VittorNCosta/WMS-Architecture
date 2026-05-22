import { Request, Response } from 'express';
import { casosDeUso } from '../../container';

/** Cadastro / atualização / consulta / status de usuários. */
export const UsuariosController = {
  async criar(req: Request, res: Response): Promise<void> {
    const usuario = await casosDeUso.cadastrarUsuario.execute(req.body);
    res.status(201).json(usuario);
  },

  async listar(_req: Request, res: Response): Promise<void> {
    res.json(await casosDeUso.consultarUsuario.listar());
  },

  async obter(req: Request, res: Response): Promise<void> {
    res.json(await casosDeUso.consultarUsuario.porId(req.params.id));
  },

  async atualizar(req: Request, res: Response): Promise<void> {
    const usuario = await casosDeUso.atualizarUsuario.execute(req.params.id, req.body);
    res.json(usuario);
  },

  async alterarStatus(req: Request, res: Response): Promise<void> {
    const usuario = await casosDeUso.alterarStatusUsuario.execute(req.params.id, req.body);
    res.json(usuario);
  },
};
