import { DomainError } from '../errors/DomainError';

/**
 * Domain Service that encapsulates the recurring pattern of finding an entity
 * by id and throwing `DomainError` when not found.
 *
 * Keeps the UseCases free of the boilerplate `const x = await repo.findById(id);
 * if (!x) throw new DomainError(...)`.
 */
export class EntityFinder {
  static async findOrThrow<T>(
    finder: (id: string) => Promise<T | null>,
    id: string,
    label: string,
  ): Promise<T> {
    const found = await finder(id);
    if (!found) {
      throw new DomainError(`${label} não encontrado(a).`);
    }
    return found;
  }
}
