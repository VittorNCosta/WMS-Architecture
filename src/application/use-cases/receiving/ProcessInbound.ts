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
import { StockItemDTO, toStockItemDTO } from '../../dtos/StockItemDTO';
import { MovementDTO, toMovementDTO } from '../../dtos/MovementDTO';
import { Actor } from '../audit/Actor';
import { registerAuditSafely } from '../audit/registerAuditSafely';

export interface ProcessInboundInput {
  productId: string;
  quantity: number;
  userId: string;
  locationId?: string | null;
  referenceDocument?: string | null;
}

export interface ProcessInboundResult {
  stockItem: StockItemDTO;
  movement: MovementDTO;
}

/** Use case: register inbound (receiving) of a product into stock. */
export class ProcessInbound {
  constructor(
    private readonly stock: IStockRepository,
    private readonly movements: IMovementRepository,
    private readonly products: IProductRepository,
    private readonly users: IUserRepository,
    private readonly locations: ILocationRepository,
    private readonly auditTrail: IAuditTrailRepository,
  ) {}

  async execute(input: ProcessInboundInput, actor: Actor): Promise<ProcessInboundResult> {
    const product = await EntityFinder.findOrThrow(
      (id) => this.products.findById(id),
      input.productId,
      'Produto',
    );
    if (!product.active) throw new DomainError('Produto inativo não pode receber entrada.');

    const user = await EntityFinder.findOrThrow(
      (id) => this.users.findById(id),
      input.userId,
      'Usuário',
    );

    let locationId: string | null = null;
    if (input.locationId) {
      const location = await EntityFinder.findOrThrow(
        (id) => this.locations.findById(id),
        input.locationId,
        'Localização',
      );
      locationId = location.id;
    }

    const stockItem = StockItem.create({
      productId: product.id,
      quantity: input.quantity,
      locationId,
    });
    await this.stock.save(stockItem);

    const movement = Movement.create({
      type: MovementType.INBOUND,
      productId: product.id,
      quantity: stockItem.quantity,
      userId: user.id,
      destinationLocationId: locationId,
      referenceDocument: input.referenceDocument ?? null,
    });
    await this.movements.save(movement);

    await registerAuditSafely(this.auditTrail, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.STOCK_MOVE,
      entityType: 'Stock',
      entityId: stockItem.id,
      summary: `Entrada de ${stockItem.quantity} un. do produto ${product.sku}.`,
    });

    return {
      stockItem: toStockItemDTO(stockItem),
      movement: toMovementDTO(movement),
    };
  }
}
