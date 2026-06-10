import { StockItem } from '../../domain/entities/StockItem';

/** Stock item output DTO (public representation, serializable as JSON). */
export interface StockItemDTO {
  id: string;
  productId: string;
  locationId: string | null;
  quantity: number;
  entryDate: Date;
}

export function toStockItemDTO(item: StockItem): StockItemDTO {
  return {
    id: item.id,
    productId: item.productId,
    locationId: item.locationId,
    quantity: item.quantity,
    entryDate: item.entryDate,
  };
}
