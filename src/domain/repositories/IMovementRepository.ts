import { Movement } from '../entities/Movement';

/** Persistence contract for the movement history (traceability). */
export interface IMovementRepository {
  save(movement: Movement): Promise<void>;
  listAll(): Promise<Movement[]>;
  listByProduct(productId: string): Promise<Movement[]>;
}
