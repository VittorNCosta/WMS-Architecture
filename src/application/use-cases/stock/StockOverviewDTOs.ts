/**
 * DTOs (Data Transfer Objects) for the consolidated stock overview.
 *
 * Shared between the use case `GetStockOverview` and the application service
 * `StockOverviewConsolidator`. The field names are part of the HTTP contract
 * of the route `GET /stock` and must NOT be changed.
 */

export interface StockRow {
  productId: string;
  productSku: string | null;
  productName: string | null;
  locationId: string | null;
  locationCode: string | null;
  locationDescription: string | null;
  quantity: number;
}

export interface StockOverviewResult {
  items: StockRow[];
  totalQuantity: number;
  totalRecords: number;
}
