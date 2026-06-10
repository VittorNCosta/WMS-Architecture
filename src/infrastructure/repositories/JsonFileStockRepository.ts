import { StockItem } from '../../domain/entities/StockItem';
import { IStockRepository } from '../../domain/repositories/IStockRepository';
import { StockItemRow, JsonDatabase } from '../persistence/JsonDatabase';

/** Stock balance persistence in a JSON file. */
export class JsonFileStockRepository implements IStockRepository {
  constructor(private readonly db: JsonDatabase) {}

  private get rows(): StockItemRow[] {
    return this.db.table('stock');
  }

  private toRow(item: StockItem): StockItemRow {
    return {
      id: item.id,
      productId: item.productId,
      locationId: item.locationId,
      quantity: item.quantity,
      entryDate: item.entryDate.toISOString(),
    };
  }

  private toEntity(r: StockItemRow): StockItem {
    return new StockItem(r.id, r.productId, r.locationId, r.quantity, new Date(r.entryDate));
  }

  private persist(item: StockItem): void {
    const i = this.rows.findIndex((l) => l.id === item.id);
    const row = this.toRow(item);
    if (i >= 0) this.rows[i] = row;
    else this.rows.push(row);
    this.db.save();
  }

  async save(item: StockItem): Promise<void> {
    this.persist(item);
  }

  async update(item: StockItem): Promise<void> {
    this.persist(item);
  }

  async remove(id: string): Promise<void> {
    const i = this.rows.findIndex((l) => l.id === id);
    if (i >= 0) {
      this.rows.splice(i, 1);
      this.db.save();
    }
  }

  async findById(id: string): Promise<StockItem | null> {
    const r = this.rows.find((l) => l.id === id);
    return r ? this.toEntity(r) : null;
  }

  async listByProduct(productId: string): Promise<StockItem[]> {
    return this.rows.filter((r) => r.productId === productId).map((r) => this.toEntity(r));
  }

  async listByLocation(locationId: string): Promise<StockItem[]> {
    return this.rows
      .filter((r) => r.locationId === locationId)
      .map((r) => this.toEntity(r));
  }

  async listAll(): Promise<StockItem[]> {
    return this.rows.map((r) => this.toEntity(r));
  }
}
