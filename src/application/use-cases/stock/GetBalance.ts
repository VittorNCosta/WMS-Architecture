import { IStockRepository } from '../../../domain/repositories/IStockRepository';

export interface BalanceByLocation {
  locationId: string | null;
  quantity: number;
}

export interface ConsolidatedBalance {
  productId: string;
  totalQuantity: number;
  byLocation: BalanceByLocation[];
}

/** Use case: get the current balance of a product (total and per location). */
export class GetBalance {
  constructor(private readonly stock: IStockRepository) {}

  async byProduct(productId: string): Promise<ConsolidatedBalance> {
    const items = await this.stock.listByProduct(productId);

    const accumulated = new Map<string, number>();
    let totalQuantity = 0;
    for (const item of items) {
      totalQuantity += item.quantity;
      const key = item.locationId ?? '(sem localização)';
      accumulated.set(key, (accumulated.get(key) ?? 0) + item.quantity);
    }

    const byLocation: BalanceByLocation[] = [...accumulated.entries()].map(
      ([key, quantity]) => ({
        locationId: key === '(sem localização)' ? null : key,
        quantity,
      }),
    );

    return { productId, totalQuantity, byLocation };
  }
}
