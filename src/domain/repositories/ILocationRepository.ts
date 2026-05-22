import { Location } from '../entities/Location';

/** Persistence contract for storage locations. */
export interface ILocationRepository {
  save(location: Location): Promise<void>;
  findById(id: string): Promise<Location | null>;
  findByCode(code: string): Promise<Location | null>;
  findAll(): Promise<Location[]>;
}
