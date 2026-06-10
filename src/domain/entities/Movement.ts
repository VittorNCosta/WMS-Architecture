import { randomUUID } from 'node:crypto';
import { MovementType } from '../enums/MovementType';
import { positiveQuantity, requiredText } from '../validation';

/**
 * Immutable record of a stock movement.
 * It is the basis of traceability: every inbound, putaway, transfer and outbound creates one.
 */
export class Movement {
  constructor(
    public readonly id: string,
    public readonly type: MovementType,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly sourceLocationId: string | null,
    public readonly destinationLocationId: string | null,
    public readonly userId: string,
    public readonly referenceDocument: string | null,
    public readonly timestamp: Date,
  ) {}

  static create(props: {
    type: MovementType;
    productId: string;
    quantity: number;
    userId: string;
    sourceLocationId?: string | null;
    destinationLocationId?: string | null;
    referenceDocument?: string | null;
  }): Movement {
    return new Movement(
      randomUUID(),
      props.type,
      requiredText(props.productId, 'Produto'),
      positiveQuantity(props.quantity),
      props.sourceLocationId ?? null,
      props.destinationLocationId ?? null,
      requiredText(props.userId, 'Usuário responsável'),
      props.referenceDocument ? String(props.referenceDocument) : null,
      new Date(),
    );
  }
}
