import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { DomainError } from '../../../domain/errors/DomainError';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { ILocationRepository } from '../../../domain/repositories/ILocationRepository';
import { EntityFinder } from '../../../domain/services/EntityFinder';
import { LocationDTO, toLocationDTO } from '../../dtos/LocationDTO';
import { Actor } from '../audit/Actor';
import { registerAuditSafely } from '../audit/registerAuditSafely';

export interface UpdateLocationInput {
  code?: unknown;
  description?: unknown;
}

/** Use case: update an existing location, preserving code uniqueness. */
export class UpdateLocation {
  constructor(
    private readonly locations: ILocationRepository,
    private readonly auditTrail: IAuditTrailRepository,
  ) {}

  async execute(
    id: string,
    data: UpdateLocationInput,
    actor: Actor,
  ): Promise<LocationDTO> {
    const location = await EntityFinder.findOrThrow(
      (lid) => this.locations.findById(lid),
      id,
      'Localização',
    );

    if (data.code !== undefined && typeof data.code === 'string') {
      const newCode = data.code.trim();
      if (newCode !== '' && newCode.toLowerCase() !== location.code.toLowerCase()) {
        const conflict = await this.locations.findByCode(newCode);
        if (conflict && conflict.id !== id) {
          throw new DomainError(`Já existe uma localização com o código "${newCode}".`);
        }
      }
    }

    location.update(data);
    await this.locations.save(location);

    await registerAuditSafely(this.auditTrail, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.UPDATE,
      entityType: 'Location',
      entityId: location.id,
      summary: `Localização "${location.code}" atualizada.`,
    });

    return toLocationDTO(location);
  }
}
