import { randomUUID } from 'node:crypto';
import { DomainError } from '../errors/DomainError';
import { positiveQuantity, requiredText } from '../validation';

/**
 * Balance of a product, in a location, originated from a receiving.
 * `entryDate` is the key to the FIFO rule: outbound consumes the oldest items first.
 */
export class StockItem {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public locationId: string | null,
    public quantity: number,
    public readonly entryDate: Date,
  ) {}

  static create(props: {
    productId: string;
    quantity: unknown;
    locationId?: string | null;
    entryDate?: Date;
  }): StockItem {
    return new StockItem(
      randomUUID(),
      requiredText(props.productId, 'Produto'),
      props.locationId ?? null,
      positiveQuantity(props.quantity),
      props.entryDate ?? new Date(),
    );
  }

  /** Decrements part (or all) of this item's balance. */
  decrease(quantity: number): void {
    const qty = positiveQuantity(quantity, 'Quantidade a baixar');
    if (qty > this.quantity) {
      throw new DomainError(
        `Quantidade insuficiente neste item de estoque (disponível: ${this.quantity}).`,
      );
    }
    this.quantity -= qty;
  }

  /** Sets/updates the location (used in putaway). */
  storeAt(locationId: string): void {
    this.locationId = requiredText(locationId, 'Localização');
  }
}
