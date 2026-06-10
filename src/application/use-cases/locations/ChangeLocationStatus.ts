import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { DomainError } from '../../../domain/errors/DomainError';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IStockRepository } from '../../../domain/repositories/IStockRepository';
import { ILocationRepository } from '../../../domain/repositories/ILocationRepository';
import { EntityFinder } from '../../../domain/services/EntityFinder';
import { LocationDTO, toLocationDTO } from '../../dtos/LocationDTO';
import { Actor } from '../audit/Actor';
import { registerAuditSafely } from '../audit/registerAuditSafely';

export interface ChangeLocationStatusInput {
  active: unknown;
}

/** Use case: activate/deactivate a location, blocking deactivation with linked stock. */
export class ChangeLocationStatus {
  constructor(
    private readonly locations: ILocationRepository,
    private readonly stock: IStockRepository,
    private readonly auditTrail: IAuditTrailRepository,
  ) {}

  async execute(
    id: string,
    input: ChangeLocationStatusInput,
    actor: Actor,
  ): Promise<LocationDTO> {
    if (typeof input.active !== 'boolean') {
      throw new DomainError('Campo "ativo" deve ser booleano.');
    }

    const location = await EntityFinder.findOrThrow(
      (lid) => this.locations.findById(lid),
      id,
      'Localização',
    );

    if (input.active === false) {
      const items = await this.stock.listByLocation(id);
      const hasBalance = items.some((i) => i.quantity > 0);
      if (hasBalance) {
        throw new DomainError('Não é possível inativar uma localização com estoque vinculado.');
      }
    }

    if (input.active) location.activate();
    else location.deactivate();

    await this.locations.save(location);

    await registerAuditSafely(this.auditTrail, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.STATUS_CHANGE,
      entityType: 'Location',
      entityId: location.id,
      summary: `Localização "${location.code}" ${input.active ? 'ativada' : 'inativada'}.`,
    });

    return toLocationDTO(location);
  }
}
