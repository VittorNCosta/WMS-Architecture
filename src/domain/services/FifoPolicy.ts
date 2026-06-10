import { StockItem } from '../entities/StockItem';
import { DomainError } from '../errors/DomainError';

/** How much to consume from a specific stock item. */
export interface FifoAllocation {
  item: StockItem;
  quantity: number;
}

/**
 * FIFO (First In, First Out) business rule.
 *
 * On outbound and transfer, the consumed stock is always the **oldest first**
 * (ordered by `entryDate`). Pure domain function — testable without a database.
 */
export class FifoPolicy {
  static selectConsumption(items: StockItem[], requiredQuantity: number): FifoAllocation[] {
    if (requiredQuantity <= 0) {
      throw new DomainError('A quantidade necessária deve ser maior que zero.');
    }

    const sorted = [...items].sort(
      (a, b) => a.entryDate.getTime() - b.entryDate.getTime(),
    );

    const available = sorted.reduce((sum, item) => sum + item.quantity, 0);
    if (available < requiredQuantity) {
      throw new DomainError(
        `Saldo insuficiente: disponível ${available}, solicitado ${requiredQuantity}.`,
      );
    }

    const allocations: FifoAllocation[] = [];
    let remaining = requiredQuantity;
    for (const item of sorted) {
      if (remaining <= 0) break;
      if (item.quantity <= 0) continue;
      const consume = Math.min(item.quantity, remaining);
      allocations.push({ item, quantity: consume });
      remaining -= consume;
    }
    return allocations;
  }
}
