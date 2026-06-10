import { Product } from '../../domain/entities/Product';

/**
 * Product output DTO (public representation, without internal timestamps).
 *
 * `createdAt` and `updatedAt` are deliberately omitted — they are internal
 * entity metadata and are not part of the current HTTP contract.
 */
export interface ProductDTO {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unitOfMeasure: string;
  active: boolean;
}

export function toProductDTO(product: Product): ProductDTO {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    unitOfMeasure: product.unitOfMeasure,
    active: product.active,
  };
}
