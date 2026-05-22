import { randomUUID } from 'node:crypto';
import { DomainError } from '../errors/DomainError';
import { positiveQuantity, requiredText } from '../validation';

/**
 * Stock balance of an article, in a location, originated from one receipt.
 * `entryDate` is the FIFO key: shipments consume the oldest items first.
 */
export class StockItem {
  constructor(
    public readonly id: string,
    public readonly articleId: string,
    public locationId: string | null,
    public quantity: number,
    public readonly entryDate: Date,
  ) {}

  static create(props: {
    articleId: string;
    quantity: unknown;
    locationId?: string | null;
    entryDate?: Date;
  }): StockItem {
    return new StockItem(
      randomUUID(),
      requiredText(props.articleId, 'Article'),
      props.locationId ?? null,
      positiveQuantity(props.quantity),
      props.entryDate ?? new Date(),
    );
  }

  /** Decreases part (or all) of this item's balance. */
  decrease(quantity: number): void {
    const qty = positiveQuantity(quantity, 'Quantity to decrease');
    if (qty > this.quantity) {
      throw new DomainError(
        `Insufficient quantity in this stock item (available: ${this.quantity}).`,
      );
    }
    this.quantity -= qty;
  }

  /** Sets/updates the location (used during put-away). */
  storeAt(locationId: string): void {
    this.locationId = requiredText(locationId, 'Location');
  }
}
