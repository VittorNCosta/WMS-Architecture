import { DomainError } from './errors/DomainError';

/**
 * Small validators reused by the domain entities.
 * They keep the basic consistency rules in one place.
 */

export function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new DomainError(`${field} is required.`);
  }
  return value.trim();
}

export function optionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function positiveQuantity(value: unknown, field = 'Quantity'): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new DomainError(`${field} must be a number greater than zero.`);
  }
  return value;
}
