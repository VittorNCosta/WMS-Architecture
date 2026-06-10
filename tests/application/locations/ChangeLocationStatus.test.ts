import { describe, it, expect, beforeEach } from 'vitest';
import { ChangeLocationStatus } from '../../../src/application/use-cases/locations/ChangeLocationStatus';
import { StockItem } from '../../../src/domain/entities/StockItem';
import { Location } from '../../../src/domain/entities/Location';
import { DomainError } from '../../../src/domain/errors/DomainError';
import { IStockRepository } from '../../../src/domain/repositories/IStockRepository';
import { ILocationRepository } from '../../../src/domain/repositories/ILocationRepository';
import { FakeAuditTrailRepository, TEST_ACTOR } from '../../helpers/audit';

class InMemoryLocationRepo implements ILocationRepository {
  private data = new Map<string, Location>();
  insert(l: Location): void {
    this.data.set(l.id, l);
  }
  async save(l: Location): Promise<void> {
    this.data.set(l.id, l);
  }
  async findById(id: string): Promise<Location | null> {
    return this.data.get(id) ?? null;
  }
  async findByCode(code: string): Promise<Location | null> {
    const target = code.toLowerCase();
    for (const l of this.data.values()) if (l.code.toLowerCase() === target) return l;
    return null;
  }
  async listAll(): Promise<Location[]> {
    return [...this.data.values()];
  }
}

class InMemoryStockRepo implements IStockRepository {
  private items: StockItem[] = [];
  insert(i: StockItem): void {
    this.items.push(i);
  }
  async save(i: StockItem): Promise<void> {
    this.items.push(i);
  }
  async update(i: StockItem): Promise<void> {
    const idx = this.items.findIndex((x) => x.id === i.id);
    if (idx >= 0) this.items[idx] = i;
  }
  async remove(id: string): Promise<void> {
    this.items = this.items.filter((x) => x.id !== id);
  }
  async findById(id: string): Promise<StockItem | null> {
    return this.items.find((x) => x.id === id) ?? null;
  }
  async listByProduct(productId: string): Promise<StockItem[]> {
    return this.items.filter((x) => x.productId === productId);
  }
  async listByLocation(locationId: string): Promise<StockItem[]> {
    return this.items.filter((x) => x.locationId === locationId);
  }
  async listAll(): Promise<StockItem[]> {
    return [...this.items];
  }
}

describe('ChangeLocationStatus (use case)', () => {
  let locRepo: InMemoryLocationRepo;
  let stockRepo: InMemoryStockRepo;
  let useCase: ChangeLocationStatus;

  beforeEach(() => {
    locRepo = new InMemoryLocationRepo();
    stockRepo = new InMemoryStockRepo();
    useCase = new ChangeLocationStatus(locRepo, stockRepo, new FakeAuditTrailRepository());
  });

  it('deactivates a location with no stock', async () => {
    const l = Location.create({ code: 'A-01' });
    locRepo.insert(l);

    const r = await useCase.execute(l.id, { active: false }, TEST_ACTOR);
    expect(r.active).toBe(false);
  });

  it('rejects deactivation with linked stock (quantity > 0)', async () => {
    const l = Location.create({ code: 'A-01' });
    locRepo.insert(l);
    stockRepo.insert(StockItem.create({ productId: 'p1', quantity: 5, locationId: l.id }));

    await expect(useCase.execute(l.id, { active: false }, TEST_ACTOR)).rejects.toThrow(
      'Não é possível inativar uma localização com estoque vinculado.',
    );
  });

  it('reactivates an inactive location', async () => {
    const l = Location.create({ code: 'A-01' });
    l.deactivate();
    locRepo.insert(l);

    const r = await useCase.execute(l.id, { active: true }, TEST_ACTOR);
    expect(r.active).toBe(true);
  });

  it('rejects a non-existent id', async () => {
    await expect(useCase.execute('inexistente', { active: false }, TEST_ACTOR)).rejects.toThrow(
      'Localização não encontrado(a).',
    );
  });

  it('rejects a non-boolean "active"', async () => {
    const l = Location.create({ code: 'A-01' });
    locRepo.insert(l);
    await expect(useCase.execute(l.id, { active: 1 as unknown }, TEST_ACTOR)).rejects.toThrow(
      DomainError,
    );
  });
});
