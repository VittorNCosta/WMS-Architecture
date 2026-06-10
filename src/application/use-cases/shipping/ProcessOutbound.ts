import { Movement } from '../../../domain/entities/Movement';
import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { MovementType } from '../../../domain/enums/MovementType';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IStockRepository } from '../../../domain/repositories/IStockRepository';
import { IMovementRepository } from '../../../domain/repositories/IMovementRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { EntityFinder } from '../../../domain/services/EntityFinder';
import { FifoPolicy } from '../../../domain/services/FifoPolicy';
import { MovementDTO, toMovementDTO } from '../../dtos/MovementDTO';
import { Actor } from '../audit/Actor';
import { registerAuditSafely } from '../audit/registerAuditSafely';

export interface ProcessOutboundInput {
  productId: string;
  quantity: number;
  userId: string;
  referenceDocument?: string | null;
}

/** Use case: ship (outbound) a product — consumes the oldest stock (FIFO). */
export class ProcessOutbound {
  constructor(
    private readonly stock: IStockRepository,
    private readonly movements: IMovementRepository,
    private readonly products: IProductRepository,
    private readonly users: IUserRepository,
    private readonly auditTrail: IAuditTrailRepository,
  ) {}

  async execute(input: ProcessOutboundInput, actor: Actor): Promise<MovementDTO> {
    const product = await EntityFinder.findOrThrow(
      (id) => this.products.findById(id),
      input.productId,
      'Produto',
    );

    const user = await EntityFinder.findOrThrow(
      (id) => this.users.findById(id),
      input.userId,
      'Usuário',
    );

    const items = await this.stock.listByProduct(product.id);

    // FIFO: outbound always consumes the oldest batches first.
    const allocations = FifoPolicy.selectConsumption(items, input.quantity);

    for (const allocation of allocations) {
      allocation.item.decrease(allocation.quantity);
      if (allocation.item.quantity === 0) {
        await this.stock.remove(allocation.item.id);
      } else {
        await this.stock.update(allocation.item);
      }
    }

    const movement = Movement.create({
      type: MovementType.OUTBOUND,
      productId: product.id,
      quantity: input.quantity,
      userId: user.id,
      referenceDocument: input.referenceDocument ?? null,
    });
    await this.movements.save(movement);

    await registerAuditSafely(this.auditTrail, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.STOCK_MOVE,
      entityType: 'Stock',
      entityId: movement.id,
      summary: `Saída de ${input.quantity} un. do produto ${product.sku}.`,
    });

    return toMovementDTO(movement);
  }
}
