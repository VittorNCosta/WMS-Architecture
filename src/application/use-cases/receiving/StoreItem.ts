import { Movement } from '../../../domain/entities/Movement';
import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { MovementType } from '../../../domain/enums/MovementType';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IStockRepository } from '../../../domain/repositories/IStockRepository';
import { ILocationRepository } from '../../../domain/repositories/ILocationRepository';
import { IMovementRepository } from '../../../domain/repositories/IMovementRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { EntityFinder } from '../../../domain/services/EntityFinder';
import { MovementDTO, toMovementDTO } from '../../dtos/MovementDTO';
import { Actor } from '../audit/Actor';
import { registerAuditSafely } from '../audit/registerAuditSafely';

export interface StoreItemInput {
  stockItemId: string;
  locationId: string;
  userId: string;
}

/** Use case: store a received item in a warehouse location. */
export class StoreItem {
  constructor(
    private readonly stock: IStockRepository,
    private readonly movements: IMovementRepository,
    private readonly locations: ILocationRepository,
    private readonly users: IUserRepository,
    private readonly products: IProductRepository,
    private readonly auditTrail: IAuditTrailRepository,
  ) {}

  async execute(input: StoreItemInput, actor: Actor): Promise<MovementDTO> {
    const item = await EntityFinder.findOrThrow(
      (id) => this.stock.findById(id),
      input.stockItemId,
      'Item de estoque',
    );

    const location = await EntityFinder.findOrThrow(
      (id) => this.locations.findById(id),
      input.locationId,
      'Localização',
    );

    const user = await EntityFinder.findOrThrow(
      (id) => this.users.findById(id),
      input.userId,
      'Usuário',
    );

    const sourceLocationId = item.locationId;
    const storedQuantity = item.quantity;
    item.storeAt(location.id);
    await this.stock.update(item);

    const movement = Movement.create({
      type: MovementType.PUTAWAY,
      productId: item.productId,
      quantity: storedQuantity,
      userId: user.id,
      sourceLocationId,
      destinationLocationId: location.id,
    });
    await this.movements.save(movement);

    // For the human summary, we fetch the product SKU. If the read fails, we
    // fall back to the productId — registerAuditSafely swallows errors silently.
    const product = await this.products.findById(item.productId);
    const skuLabel = product?.sku ?? item.productId;

    await registerAuditSafely(this.auditTrail, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.STOCK_MOVE,
      entityType: 'Stock',
      entityId: item.id,
      summary: `Armazenagem de ${storedQuantity} un. do produto ${skuLabel} em ${location.code}.`,
    });

    return toMovementDTO(movement);
  }
}
