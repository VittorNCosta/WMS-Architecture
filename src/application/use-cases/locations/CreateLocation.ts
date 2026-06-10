import { Location } from '../../../domain/entities/Location';
import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { DomainError } from '../../../domain/errors/DomainError';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { ILocationRepository } from '../../../domain/repositories/ILocationRepository';
import { LocationDTO, toLocationDTO } from '../../dtos/LocationDTO';
import { Actor } from '../audit/Actor';
import { registerAuditSafely } from '../audit/registerAuditSafely';

export interface CreateLocationInput {
  code: unknown;
  description?: unknown;
}

/** Use case: create a new location (unique code, case-insensitive). */
export class CreateLocation {
  constructor(
    private readonly locations: ILocationRepository,
    private readonly auditTrail: IAuditTrailRepository,
  ) {}

  async execute(input: CreateLocationInput, actor: Actor): Promise<LocationDTO> {
    const location = Location.create(input);

    const alreadyExists = await this.locations.findByCode(location.code);
    if (alreadyExists) {
      throw new DomainError(`Já existe uma localização com o código "${location.code}".`);
    }

    await this.locations.save(location);

    await registerAuditSafely(this.auditTrail, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.CREATE,
      entityType: 'Location',
      entityId: location.id,
      summary: `Localização "${location.code}" cadastrada.`,
    });

    return toLocationDTO(location);
  }
}
