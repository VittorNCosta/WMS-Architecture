import { DomainError } from '../errors/DomainError';

/**
 * Domain Service que encapsula o padrão recorrente de buscar uma entidade
 * por id e lançar `DomainError` quando não encontrada.
 *
 * Mantém os UseCases livres do boilerplate `const x = await repo.buscarPorId(id);
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
