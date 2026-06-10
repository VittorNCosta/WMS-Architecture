import { describe, it, expect } from 'vitest';
import { StockItem } from '../../src/domain/entities/StockItem';
import { FifoPolicy } from '../../src/domain/services/FifoPolicy';
import { DomainError } from '../../src/domain/errors/DomainError';

/** Creates a "fake" stock item with only what FIFO needs. */
const item = (quantity: number, entryDate: string) =>
  StockItem.create({ productId: 'produto-1', quantity, entryDate: new Date(entryDate) });

describe('FifoPolicy (FIFO business rule)', () => {
  it('consumes the oldest batch first', () => {
    const batches = [
      item(10, '2026-03-10'),
      item(5, '2026-01-05'), // oldest
      item(7, '2026-02-01'),
    ];

    const allocations = FifoPolicy.selectConsumption(batches, 8);

    expect(allocations).toHaveLength(2);
    expect(allocations[0].item.entryDate).toEqual(new Date('2026-01-05'));
    expect(allocations[0].quantity).toBe(5);
    expect(allocations[1].item.entryDate).toEqual(new Date('2026-02-01'));
    expect(allocations[1].quantity).toBe(3);
  });

  it('consumes a single batch when the quantity matches exactly', () => {
    const batches = [item(4, '2026-01-01'), item(6, '2026-01-02')];

    const allocations = FifoPolicy.selectConsumption(batches, 4);

    expect(allocations).toHaveLength(1);
    expect(allocations[0].quantity).toBe(4);
  });

  it('rejects when the total balance is insufficient', () => {
    const batches = [item(2, '2026-01-01'), item(3, '2026-01-02')];

    expect(() => FifoPolicy.selectConsumption(batches, 10)).toThrow(DomainError);
  });

  it('rejects zero or negative quantity', () => {
    expect(() => FifoPolicy.selectConsumption([item(5, '2026-01-01')], 0)).toThrow(DomainError);
    expect(() => FifoPolicy.selectConsumption([item(5, '2026-01-01')], -1)).toThrow(DomainError);
  });

  it('rejects when there is no stock at all', () => {
    expect(() => FifoPolicy.selectConsumption([], 1)).toThrow(DomainError);
  });
});
