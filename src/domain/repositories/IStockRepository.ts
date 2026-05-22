import { StockItem } from '../entities/StockItem';

/** Persistence contract for the stock balance (items per article/location/lot). */
export interface IStockRepository {
  save(item: StockItem): Promise<void>;
  update(item: StockItem): Promise<void>;
  remove(id: string): Promise<void>;
  findById(id: string): Promise<StockItem | null>;
  findByArticle(articleId: string): Promise<StockItem[]>;
  findAll(): Promise<StockItem[]>;
}
