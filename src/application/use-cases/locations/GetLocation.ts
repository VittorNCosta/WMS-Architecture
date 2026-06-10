import { DomainError } from '../../../domain/errors/DomainError';
import { ILocationRepository } from '../../../domain/repositories/ILocationRepository';
import { LocationDTO, toLocationDTO } from '../../dtos/LocationDTO';

/** Use case: get locations (by id or full listing). */
export class GetLocation {
  constructor(private readonly locations: ILocationRepository) {}

  async byId(id: string): Promise<LocationDTO> {
    const location = await this.locations.findById(id);
    if (!location) throw new DomainError('Localização não encontrada.');
    return toLocationDTO(location);
  }

  async list(): Promise<LocationDTO[]> {
    const locations = await this.locations.listAll();
    return locations.map(toLocationDTO);
  }
}
