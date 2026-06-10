import { StockItem } from '../../../domain/entities/StockItem';
import { Movement } from '../../../domain/entities/Movement';
import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { MovementType } from '../../../domain/enums/MovementType';
import { DomainError } from '../../../domain/errors/DomainError';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IStockRepository } from '../../../domain/repositories/IStockRepository';
import { ILocationRepository } from '../../../domain/repositories/ILocationRepository';
import { IMovementRepository } from '../../../domain/repositories/IMovementRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { EntityFinder } from '../../../domain/services/EntityFinder';
import { FifoPolicy } from '../../../domain/services/FifoPolicy';
import { MovementDTO, toMovementDTO } from '../../dtos/MovementDTO';
import { Actor } from '../audit/Actor';
import { registerAuditSafely } from '../audit/registerAuditSafely';

export interface TransferStockInput {
  productId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  quantity: number;
  userId: string;
}

/** Use case: transfer a product's balance between two locations (consumes the source by FIFO). */
export class TransferStock {
  constructor(
    private readonly stock: IStockRepository,
    private readonly movements: IMovementRepository,
    private readonly products: IProductRepository,
    private readonly locations: ILocationRepository,
    private readonly users: IUserRepository,
    private readonly auditTrail: IAuditTrailRepository,
  ) {}

  async execute(input: TransferStockInput, actor: Actor): Promise<MovementDTO> {
    if (input.sourceLocationId === input.destinationLocationId) {
      throw new DomainError('A localização de origem e a de destino devem ser diferentes.');
    }

    const product = await EntityFinder.findOrThrow(
      (id) => this.products.findById(id),
      input.productId,
      'Produto',
    );

    const source = await EntityFinder.findOrThrow(
      (id) => this.locations.findById(id),
      input.sourceLocationId,
      'Localização de origem',
    );

    const destination = await EntityFinder.findOrThrow(
      (id) => this.locations.findById(id),
      input.destinationLocationId,
      'Localização de destino',
    );

    const user = await EntityFinder.findOrThrow(
      (id) => this.users.findById(id),
      input.userId,
      'Usuário',
    );

    const itemsAtSource = (await this.stock.listByProduct(product.id)).filter(
      (item) => item.locationId === source.id,
    );

    // FIFO: consume the oldest batches of the source first.
    const allocations = FifoPolicy.selectConsumption(itemsAtSource, input.quantity);

    for (const allocation of allocations) {
      allocation.item.decrease(allocation.quantity);
      if (allocation.item.quantity === 0) {
        await this.stock.remove(allocation.item.id);
      } else {
        await this.stock.update(allocation.item);
      }

      // Preserve the original entry date at the destination to not break FIFO.
      const itemAtDestination = StockItem.create({
        productId: product.id,
        quantity: allocation.quantity,
        locationId: destination.id,
        entryDate: allocation.item.entryDate,
      });
      await this.stock.save(itemAtDestination);
    }

    const movement = Movement.create({
      type: MovementType.TRANSFER,
      productId: product.id,
      quantity: input.quantity,
      userId: user.id,
      sourceLocationId: source.id,
      destinationLocationId: destination.id,
    });
    await this.movements.save(movement);

    await registerAuditSafely(this.auditTrail, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.STOCK_MOVE,
      entityType: 'Stock',
      entityId: movement.id,
      summary: `Transferência de ${input.quantity} un. de ${source.code} para ${destination.code}.`,
    });

    return toMovementDTO(movement);
  }
}
