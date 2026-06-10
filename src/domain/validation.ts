import { DomainError } from './errors/DomainError';

/**
 * Small validators reused by the domain entities.
 * Keep the basic consistency rules in a single place.
 */

export function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new DomainError(`${field} é obrigatório.`);
  }
  return value.trim();
}

export function optionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  return cleaned === '' ? null : cleaned;
}

export function positiveQuantity(value: unknown, field = 'Quantidade'): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new DomainError(`${field} deve ser um número maior que zero.`);
  }
  return value;
}
