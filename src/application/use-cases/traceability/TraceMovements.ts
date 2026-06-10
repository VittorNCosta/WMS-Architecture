import { IMovementRepository } from '../../../domain/repositories/IMovementRepository';
import { MovementDTO, toMovementDTO } from '../../dtos/MovementDTO';

export interface TraceMovementsFilter {
  productId?: string;
}

/** Use case: trace the movement history (all or for a single product). */
export class TraceMovements {
  constructor(private readonly movements: IMovementRepository) {}

  async execute(filter: TraceMovementsFilter = {}): Promise<MovementDTO[]> {
    const list = filter.productId
      ? await this.movements.listByProduct(filter.productId)
      : await this.movements.listAll();

    // Most recent first.
    return [...list]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .map(toMovementDTO);
  }
}
