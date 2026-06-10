import { randomUUID } from 'node:crypto';
import { requiredText, optionalText } from '../validation';

/** Product controlled by the warehouse (create / update / get). */
export class Product {
  constructor(
    public readonly id: string,
    public sku: string,
    public name: string,
    public description: string | null,
    public unitOfMeasure: string,
    public active: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(props: {
    sku: unknown;
    name: unknown;
    description?: unknown;
    unitOfMeasure: unknown;
  }): Product {
    const now = new Date();
    return new Product(
      randomUUID(),
      requiredText(props.sku, 'SKU do produto'),
      requiredText(props.name, 'Nome do produto'),
      optionalText(props.description),
      requiredText(props.unitOfMeasure, 'Unidade de medida'),
      true,
      now,
      now,
    );
  }

  update(data: {
    name?: unknown;
    description?: unknown;
    unitOfMeasure?: unknown;
    active?: unknown;
  }): void {
    if (data.name !== undefined) this.name = requiredText(data.name, 'Nome do produto');
    if (data.description !== undefined) this.description = optionalText(data.description);
    if (data.unitOfMeasure !== undefined) {
      this.unitOfMeasure = requiredText(data.unitOfMeasure, 'Unidade de medida');
    }
    if (typeof data.active === 'boolean') this.active = data.active;
    this.updatedAt = new Date();
  }
}
