import { Location } from '../../domain/entities/Location';
import { ILocationRepository } from '../../domain/repositories/ILocationRepository';
import { JsonDatabase, LocationRow } from '../persistence/JsonDatabase';

/** Location persistence in a JSON file. */
export class JsonFileLocationRepository implements ILocationRepository {
  constructor(private readonly db: JsonDatabase) {}

  private get rows(): LocationRow[] {
    return this.db.table('locations');
  }

  private toRow(l: Location): LocationRow {
    return { id: l.id, code: l.code, description: l.description, active: l.active };
  }

  private toEntity(r: LocationRow): Location {
    // Light migration: old JSON may not have `active` — assume true.
    return new Location(r.id, r.code, r.description, r.active ?? true);
  }

  async save(location: Location): Promise<void> {
    const i = this.rows.findIndex((l) => l.id === location.id);
    const row = this.toRow(location);
    if (i >= 0) this.rows[i] = row;
    else this.rows.push(row);
    this.db.save();
  }

  async findById(id: string): Promise<Location | null> {
    const r = this.rows.find((l) => l.id === id);
    return r ? this.toEntity(r) : null;
  }

  async findByCode(code: string): Promise<Location | null> {
    const target = code.trim().toLowerCase();
    const r = this.rows.find((l) => l.code.toLowerCase() === target);
    return r ? this.toEntity(r) : null;
  }

  async listAll(): Promise<Location[]> {
    return this.rows.map((r) => this.toEntity(r));
  }
}
