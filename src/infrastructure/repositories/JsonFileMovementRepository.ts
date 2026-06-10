import { Movement } from '../../domain/entities/Movement';
import { MovementType } from '../../domain/enums/MovementType';
import { IMovementRepository } from '../../domain/repositories/IMovementRepository';
import { JsonDatabase, MovementRow } from '../persistence/JsonDatabase';

/** Movement history (traceability) persistence in a JSON file. */
export class JsonFileMovementRepository implements IMovementRepository {
  constructor(private readonly db: JsonDatabase) {}

  private get rows(): MovementRow[] {
    return this.db.table('movements');
  }

  private toRow(m: Movement): MovementRow {
    return {
      id: m.id,
      type: m.type,
      productId: m.productId,
      quantity: m.quantity,
      sourceLocationId: m.sourceLocationId,
      destinationLocationId: m.destinationLocationId,
      userId: m.userId,
      referenceDocument: m.referenceDocument,
      timestamp: m.timestamp.toISOString(),
    };
  }

  private toEntity(r: MovementRow): Movement {
    return new Movement(
      r.id,
      r.type as MovementType,
      r.productId,
      r.quantity,
      r.sourceLocationId,
      r.destinationLocationId,
      r.userId,
      r.referenceDocument,
      new Date(r.timestamp),
    );
  }

  async save(movement: Movement): Promise<void> {
    this.rows.push(this.toRow(movement));
    this.db.save();
  }

  async listAll(): Promise<Movement[]> {
    return this.rows.map((r) => this.toEntity(r));
  }

  async listByProduct(productId: string): Promise<Movement[]> {
    return this.rows.filter((r) => r.productId === productId).map((r) => this.toEntity(r));
  }
}
