import { StockItem } from '../entities/StockItem';

/** Persistence contract for stock balance (items by product/location/batch). */
export interface IStockRepository {
  save(item: StockItem): Promise<void>;
  update(item: StockItem): Promise<void>;
  remove(id: string): Promise<void>;
  findById(id: string): Promise<StockItem | null>;
  listByProduct(productId: string): Promise<StockItem[]>;
  listByLocation(locationId: string): Promise<StockItem[]>;
  listAll(): Promise<StockItem[]>;
}
