import { Request, Response } from 'express';
import { ListAuditTrailFilters } from '../../../application/use-cases/audit/ListAuditTrail';
import { useCases } from '../../container';

/** Parses a query param into a Date, or undefined if absent/invalid. */
function parseDate(value: unknown): Date | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function parseText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

/** Operational audit trail query (read-only, restricted to ADMIN). */
export const AuditController = {
  async list(req: Request, res: Response): Promise<void> {
    const filters: ListAuditTrailFilters = {
      from: parseDate(req.query.from),
      to: parseDate(req.query.to),
      entityType: parseText(req.query.entityType),
      entityId: parseText(req.query.entityId),
    };
    res.json(await useCases.listAuditTrail.execute(filters));
  },
};
