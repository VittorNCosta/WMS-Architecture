import { Product } from '../../../domain/entities/Product';
import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { DomainError } from '../../../domain/errors/DomainError';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { ProductDTO, toProductDTO } from '../../dtos/ProductDTO';
import { Actor } from '../audit/Actor';
import { registerAuditSafely } from '../audit/registerAuditSafely';

export interface CreateProductInput {
  sku: unknown;
  name: unknown;
  description?: unknown;
  unitOfMeasure: unknown;
}

/** Use case: create a new product (unique SKU). */
export class CreateProduct {
  constructor(
    private readonly products: IProductRepository,
    private readonly auditTrail: IAuditTrailRepository,
  ) {}

  async execute(input: CreateProductInput, actor: Actor): Promise<ProductDTO> {
    const product = Product.create(input);

    const alreadyExists = await this.products.findBySku(product.sku);
    if (alreadyExists) {
      throw new DomainError(`Já existe um produto com o SKU "${product.sku}".`);
    }

    await this.products.save(product);

    await registerAuditSafely(this.auditTrail, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.CREATE,
      entityType: 'Product',
      entityId: product.id,
      summary: `Produto "${product.sku}" cadastrado.`,
    });

    return toProductDTO(product);
  }
}
