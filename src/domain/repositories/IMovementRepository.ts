import { Movement } from '../entities/Movement';

/** Persistence contract for the movement history (traceability). */
export interface IMovementRepository {
  save(movement: Movement): Promise<void>;
  findAll(): Promise<Movement[]>;
  findByArticle(articleId: string): Promise<Movement[]>;
}
