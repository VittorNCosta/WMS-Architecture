import { Product } from '../entities/Product';

/** Product persistence contract (implemented in the Infrastructure layer). */
export interface IProductRepository {
  save(product: Product): Promise<void>;
  update(product: Product): Promise<void>;
  findById(id: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  listAll(): Promise<Product[]>;
}
