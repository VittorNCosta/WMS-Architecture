import { StockItem } from '../../../domain/entities/StockItem';
import { Location } from '../../../domain/entities/Location';
import { Product } from '../../../domain/entities/Product';
import { StockOverviewResult, StockRow } from './StockOverviewDTOs';

/**
 * Application Service responsible for consolidating the stock overview.
 *
 * Receives the three already-materialized collections (stock items, products
 * and locations) and produces the final aggregated result: one row per
 * product+location pair, enriched with the product SKU/name and the location
 * code/description, sorted and with totals computed.
 *
 * Has no infrastructure dependencies — all I/O lives in the `GetStockOverview`
 * use case, which only orchestrates the fetch and delegates the consolidation
 * to this class.
 */
export class StockOverviewConsolidator {
  private static readonly NO_LOCATION_KEY = '(sem localização)';

  consolidate(
    stockItems: StockItem[],
    products: Product[],
    locations: Location[],
  ): StockOverviewResult {
    const productById = new Map(products.map((p) => [p.id, p]));
    const locationById = new Map(locations.map((l) => [l.id, l]));

    const { aggregated, totalQuantity } = this.aggregateByProductLocation(stockItems);

    const enrichedRows = this.enrichRows(aggregated, productById, locationById);

    this.sortRows(enrichedRows);

    return {
      items: enrichedRows,
      totalQuantity,
      totalRecords: enrichedRows.length,
    };
  }

  private aggregateByProductLocation(stockItems: StockItem[]): {
    aggregated: Map<
      string,
      { productId: string; locationId: string | null; quantity: number }
    >;
    totalQuantity: number;
  } {
    const aggregated = new Map<
      string,
      { productId: string; locationId: string | null; quantity: number }
    >();
    let totalQuantity = 0;

    for (const item of stockItems) {
      totalQuantity += item.quantity;

      const locationKey = item.locationId ?? StockOverviewConsolidator.NO_LOCATION_KEY;
      const key = `${item.productId}|${locationKey}`;

      const existing = aggregated.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        aggregated.set(key, {
          productId: item.productId,
          locationId: item.locationId ?? null,
          quantity: item.quantity,
        });
      }
    }

    return { aggregated, totalQuantity };
  }

  private enrichRows(
    aggregated: Map<
      string,
      { productId: string; locationId: string | null; quantity: number }
    >,
    productById: Map<string, Product>,
    locationById: Map<string, Location>,
  ): StockRow[] {
    return [...aggregated.values()].map((entry) => {
      const product = productById.get(entry.productId) ?? null;
      const location =
        entry.locationId == null
          ? null
          : locationById.get(entry.locationId) ?? null;

      return {
        productId: entry.productId,
        productSku: product ? product.sku : null,
        productName: product ? product.name : null,
        locationId: entry.locationId,
        locationCode: location ? location.code : null,
        locationDescription: location ? location.description : null,
        quantity: entry.quantity,
      };
    });
  }

  private sortRows(rows: StockRow[]): void {
    rows.sort((a, b) => {
      const codeA = a.locationCode ?? '';
      const codeB = b.locationCode ?? '';
      const byLocation = codeA.localeCompare(codeB, 'pt-BR');
      if (byLocation !== 0) return byLocation;

      const nameA = a.productName ?? '';
      const nameB = b.productName ?? '';
      return nameA.localeCompare(nameB, 'pt-BR');
    });
  }
}
