import { Movement } from '../../domain/entities/Movement';

/** Movement output DTO (public representation, serializable as JSON). */
export interface MovementDTO {
  id: string;
  type: string;
  productId: string;
  quantity: number;
  sourceLocationId: string | null;
  destinationLocationId: string | null;
  userId: string;
  referenceDocument: string | null;
  timestamp: Date;
}

export function toMovementDTO(movement: Movement): MovementDTO {
  return {
    id: movement.id,
    type: movement.type,
    productId: movement.productId,
    quantity: movement.quantity,
    sourceLocationId: movement.sourceLocationId,
    destinationLocationId: movement.destinationLocationId,
    userId: movement.userId,
    referenceDocument: movement.referenceDocument,
    timestamp: movement.timestamp,
  };
}
