import { DomainError } from '../../../domain/errors/DomainError';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { ProductDTO, toProductDTO } from '../../dtos/ProductDTO';

/** Use case: get products (by id or full listing). */
export class GetProduct {
  constructor(private readonly products: IProductRepository) {}

  async byId(id: string): Promise<ProductDTO> {
    const product = await this.products.findById(id);
    if (!product) throw new DomainError('Produto não encontrado.');
    return toProductDTO(product);
  }

  async list(): Promise<ProductDTO[]> {
    const products = await this.products.listAll();
    return products.map(toProductDTO);
  }
}
