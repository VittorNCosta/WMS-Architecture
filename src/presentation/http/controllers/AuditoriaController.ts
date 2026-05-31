import { Request, Response } from 'express';
import { ListAuditTrailFilters } from '../../../application/use-cases/auditoria/ListAuditTrail';
import { casosDeUso } from '../../container';

/** Converte um query param em Date, ou undefined se ausente/ inválido. */
function parseData(valor: unknown): Date | undefined {
  if (typeof valor !== 'string' || valor.trim() === '') return undefined;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function parseTexto(valor: unknown): string | undefined {
  return typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : undefined;
}

/** Consulta da trilha de auditoria operacional (somente leitura, restrita a ADMIN). */
export const AuditoriaController = {
  async listar(req: Request, res: Response): Promise<void> {
    const filtros: ListAuditTrailFilters = {
      de: parseData(req.query.de),
      ate: parseData(req.query.ate),
      entityType: parseTexto(req.query.entityType),
      entityId: parseTexto(req.query.entityId),
    };
    res.json(await casosDeUso.listAuditTrail.executar(filtros));
  },
};
