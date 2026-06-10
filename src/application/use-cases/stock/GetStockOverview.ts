import { IStockRepository } from '../../../domain/repositories/IStockRepository';
import { ILocationRepository } from '../../../domain/repositories/ILocationRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { StockOverviewConsolidator } from './StockOverviewConsolidator';
import { StockOverviewResult, StockRow } from './StockOverviewDTOs';

// Re-export the DTOs to preserve existing imports that point to this module.
export { StockOverviewResult, StockRow };

/**
 * Use case: get the consolidated stock of the whole warehouse.
 *
 * Only orchestrates: fetches the three datasets (stock items, products and
 * locations) and delegates the consolidation to the application service
 * `StockOverviewConsolidator`.
 */
export class GetStockOverview {
  constructor(
    private readonly stock: IStockRepository,
    private readonly products: IProductRepository,
    private readonly locations: ILocationRepository,
    private readonly consolidator: StockOverviewConsolidator,
  ) {}

  async list(): Promise<StockOverviewResult> {
    const [stockItems, products, locations] = await Promise.all([
      this.stock.listAll(),
      this.products.listAll(),
      this.locations.listAll(),
    ]);
    return this.consolidator.consolidate(stockItems, products, locations);
  }
}
