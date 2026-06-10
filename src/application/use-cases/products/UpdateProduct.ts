import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { EntityFinder } from '../../../domain/services/EntityFinder';
import { ProductDTO, toProductDTO } from '../../dtos/ProductDTO';
import { Actor } from '../audit/Actor';
import { registerAuditSafely } from '../audit/registerAuditSafely';

export interface UpdateProductInput {
  name?: unknown;
  description?: unknown;
  unitOfMeasure?: unknown;
  active?: unknown;
}

/** Use case: update data of an existing product. */
export class UpdateProduct {
  constructor(
    private readonly products: IProductRepository,
    private readonly auditTrail: IAuditTrailRepository,
  ) {}

  async execute(id: string, data: UpdateProductInput, actor: Actor): Promise<ProductDTO> {
    const product = await EntityFinder.findOrThrow(
      (pid) => this.products.findById(pid),
      id,
      'Produto',
    );

    product.update(data);
    await this.products.update(product);

    await registerAuditSafely(this.auditTrail, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.UPDATE,
      entityType: 'Product',
      entityId: product.id,
      summary: `Produto "${product.sku}" atualizado.`,
    });

    return toProductDTO(product);
  }
}
