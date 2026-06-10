import { Product } from '../../domain/entities/Product';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { JsonDatabase, ProductRow } from '../persistence/JsonDatabase';

/**
 * Product persistence in a JSON file.
 * Implements the same interface (`IProductRepository`) the rest of the app uses —
 * swapping this for a real database affects neither Domain, Application nor Presentation.
 */
export class JsonFileProductRepository implements IProductRepository {
  constructor(private readonly db: JsonDatabase) {}

  private get rows(): ProductRow[] {
    return this.db.table('products');
  }

  private toRow(p: Product): ProductRow {
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      unitOfMeasure: p.unitOfMeasure,
      active: p.active,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  private toEntity(r: ProductRow): Product {
    return new Product(
      r.id,
      r.sku,
      r.name,
      r.description,
      r.unitOfMeasure,
      r.active,
      new Date(r.createdAt),
      new Date(r.updatedAt),
    );
  }

  private persist(product: Product): void {
    const i = this.rows.findIndex((l) => l.id === product.id);
    const row = this.toRow(product);
    if (i >= 0) this.rows[i] = row;
    else this.rows.push(row);
    this.db.save();
  }

  async save(product: Product): Promise<void> {
    this.persist(product);
  }

  async update(product: Product): Promise<void> {
    this.persist(product);
  }

  async findById(id: string): Promise<Product | null> {
    const r = this.rows.find((l) => l.id === id);
    return r ? this.toEntity(r) : null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const target = sku.trim().toLowerCase();
    const r = this.rows.find((l) => l.sku.toLowerCase() === target);
    return r ? this.toEntity(r) : null;
  }

  async listAll(): Promise<Product[]> {
    return this.rows.map((r) => this.toEntity(r));
  }
}
