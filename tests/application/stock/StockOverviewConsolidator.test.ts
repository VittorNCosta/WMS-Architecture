import { describe, it, expect } from 'vitest';
import { StockItem } from '../../../src/domain/entities/StockItem';
import { Location } from '../../../src/domain/entities/Location';
import { Product } from '../../../src/domain/entities/Product';
import { StockOverviewConsolidator } from '../../../src/application/use-cases/stock/StockOverviewConsolidator';

describe('StockOverviewConsolidator (application service)', () => {
  const consolidator = new StockOverviewConsolidator();

  it('aggregates items of the same product+location and sums quantities', () => {
    const p1 = Product.create({ sku: 'S1', name: 'Banana', unitOfMeasure: 'UN' });
    const l1 = Location.create({ code: 'A-01' });

    const r = consolidator.consolidate(
      [
        StockItem.create({ productId: p1.id, quantity: 10, locationId: l1.id }),
        StockItem.create({ productId: p1.id, quantity: 5, locationId: l1.id }),
      ],
      [p1],
      [l1],
    );

    expect(r.totalRecords).toBe(1);
    expect(r.items[0].quantity).toBe(15);
    expect(r.totalQuantity).toBe(15);
  });

  it('enriches with product SKU/name and location code/description', () => {
    const p1 = Product.create({ sku: 'S1', name: 'Banana', unitOfMeasure: 'UN' });
    const l1 = Location.create({ code: 'A-01', description: 'Rua A' });

    const r = consolidator.consolidate(
      [StockItem.create({ productId: p1.id, quantity: 4, locationId: l1.id })],
      [p1],
      [l1],
    );

    const row = r.items[0];
    expect(row.productSku).toBe('S1');
    expect(row.productName).toBe('Banana');
    expect(row.locationCode).toBe('A-01');
    expect(row.locationDescription).toBe('Rua A');
  });

  it('handles an item without location (locationId null)', () => {
    const p1 = Product.create({ sku: 'S1', name: 'Banana', unitOfMeasure: 'UN' });

    const r = consolidator.consolidate(
      [StockItem.create({ productId: p1.id, quantity: 7, locationId: null })],
      [p1],
      [],
    );

    expect(r.items[0].locationId).toBeNull();
    expect(r.items[0].locationCode).toBeNull();
  });

  it('keeps SKU/name null when the referenced product does not exist', () => {
    const r = consolidator.consolidate(
      [StockItem.create({ productId: 'fantasma', quantity: 2, locationId: null })],
      [],
      [],
    );

    expect(r.items[0].productSku).toBeNull();
    expect(r.items[0].productName).toBeNull();
  });

  it('computes totals and sorts by location then by product name', () => {
    const banana = Product.create({ sku: 'S1', name: 'Banana', unitOfMeasure: 'UN' });
    const abacaxi = Product.create({ sku: 'S2', name: 'Abacaxi', unitOfMeasure: 'UN' });
    const a01 = Location.create({ code: 'A-01' });
    const b02 = Location.create({ code: 'B-02' });

    const r = consolidator.consolidate(
      [
        StockItem.create({ productId: banana.id, quantity: 10, locationId: a01.id }),
        StockItem.create({ productId: abacaxi.id, quantity: 3, locationId: b02.id }),
        StockItem.create({ productId: banana.id, quantity: 7, locationId: null }),
      ],
      [banana, abacaxi],
      [a01, b02],
    );

    expect(r.totalQuantity).toBe(20);
    expect(r.totalRecords).toBe(3);
    // without location (null code -> "") comes before A-01 and B-02
    expect(r.items.map((i) => i.locationCode)).toEqual([null, 'A-01', 'B-02']);
  });
});
